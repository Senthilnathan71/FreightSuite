import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { DateTimePickerComponent } from 'src/app/component/datetimepicker/datetimepicker.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { normalizeTimezoneOffset, getOffsetMinutes } from 'src/app/common/helper';
import { OperationService } from '../operation.service';
import {
  MilestoneTrackerService,
  MilestoneTrackerSubmitItem,
} from './milestone-tracker.service';

@Component({
  selector: 'app-milestone-tracker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    FeatherModule,
    DateTimePickerComponent,
    CustomDatePipe,
  ],
  templateUrl: './milestone-tracker.component.html',
  styleUrl: './milestone-tracker.component.scss',
})
export class MilestoneTrackerComponent implements OnInit {
  searchTypes: { id: 'hbl' | 'mbl' | 'masterjob'; name: string }[] = [
    { id: 'hbl', name: 'HBL No' },
    { id: 'mbl', name: 'MBL No' },
    { id: 'masterjob', name: 'Master Job No' },
  ];
  searchType: 'hbl' | 'mbl' | 'masterjob' = 'hbl';
  refNo = '';

  currentCompany: any;
  currentBranch: any;
  userData: any;

  // House picker (shown when an MBL resolves to several houses)
  houses: any[] = [];
  showHousePicker = false;

  header: any = null;
  pendingForm!: FormArray;
  completed: any[] = [];
  // Full applicable master milestone list for the shipment's department(s),
  // sourced from the shared ff-booking/milestone API (ordered by SortBy). The
  // pending form is the subset of these that fall after the last achieved
  // milestone.
  private pendingItems: any[] = [];
  // Department names/SIDs the pending list spans — the shipment's department plus
  // its opposite-direction sibling (e.g. LCL Import + LCL Export). Resolved by the
  // fetch API.
  private milestoneDepartmentNames: string[] = [];
  private milestoneDepartmentSids: number[] = [];

  // Inline empty-state shown when a search matches no shipment.
  notFound = false;
  notFoundRef = '';

  searching = false;
  loading = false;
  submitting = false;

  // Row state is cached rather than computed per change-detection cycle: the
  // template binds `previousMilestoneDate(i)` into an @Input, so returning a
  // freshly-built Date on every read makes the binding look permanently changed.
  private achievedLatest: Date | null = null;
  private minDates: (Date | null)[] = [];
  private rowErrors: (string | null)[] = [];

  constructor(
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private milestoneTrackerService: MilestoneTrackerService,
    private operationService: OperationService,
  ) {}

  ngOnInit(): void {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company'),
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch'),
    );
    this.pendingForm = this.fb.array([]);
    this.pendingForm.valueChanges.subscribe(() => this.recomputeRowState());
  }

  private get companyId(): number {
    return this.currentCompany?.CompanyMasterSid;
  }

  private get branchId(): number {
    return this.currentBranch?.BranchMasterSid;
  }

  private get userEmail(): string {
    return this.userData?.['userEmail'] ?? this.userData?.userEmail ?? '';
  }

  get hasResult(): boolean {
    return !!this.header;
  }

  onSearch(): void {
    const ref = (this.refNo || '').trim();
    if (!ref) {
      this.appSettingService.showWarning('Please enter a reference number.');
      return;
    }
    if (!this.companyId || !this.branchId) {
      this.appSettingService.showError(
        'No company / branch selected. Please reselect and try again.',
      );
      return;
    }

    this.searching = true;
    this.clearResult();
    this.milestoneTrackerService
      .searchHouses({
        Ref: ref,
        Type: this.searchType,
        CompanyMasterSid: this.companyId,
        BranchMasterSid: this.branchId,
      })
      .subscribe({
        next: (res) => {
          this.searching = false;
          if (!res?.status) {
            this.showNotFound(ref);
            return;
          }
          const list: any[] = res.data || [];
          if (list.length === 0) {
            this.showNotFound(ref);
          } else if (list.length === 1) {
            this.loadMilestones(list[0].HouseJobSid);
          } else {
            // Multiple houses for this MBL — let the user pick.
            this.houses = list;
            this.showHousePicker = true;
          }
        },
        error: () => {
          this.searching = false;
          this.appSettingService.showError('Failed to search shipment.');
        },
      });
  }

  private showNotFound(ref: string): void {
    this.notFoundRef = ref;
    this.notFound = true;
  }

  onSelectHouse(house: any): void {
    this.showHousePicker = false;
    this.loadMilestones(house.HouseJobSid);
  }

  private loadMilestones(houseJobSid: number): void {
    this.loading = true;
    this.milestoneTrackerService
      .getMilestones({
        HouseJobSid: houseJobSid,
        CompanyMasterSid: this.companyId,
        BranchMasterSid: this.branchId,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (!res?.status) {
            this.appSettingService.showWarning(
              res?.message || 'Could not load milestones.',
            );
            return;
          }
          this.applyResult(res.data);
        },
        error: () => {
          this.loading = false;
          this.appSettingService.showError('Failed to load milestones.');
        },
      });
  }

  private applyResult(data: any): void {
    this.header = data?.header || null;
    this.pendingForm.clear({ emitEvent: false });
    this.completed = [];
    this.pendingItems = [];
    this.minDates = [];
    this.rowErrors = [];
    // Departments the pending list spans (both directions). Fall back to the
    // header's own department if the fetch API didn't resolve a sibling.
    this.milestoneDepartmentNames =
      data?.milestoneDepartments?.names?.length
        ? data.milestoneDepartments.names
        : this.header?.DepartmentName
          ? [this.header.DepartmentName]
          : [];
    this.milestoneDepartmentSids =
      data?.milestoneDepartments?.sids?.length
        ? data.milestoneDepartments.sids
        : this.header?.DepartmentMasterSid != null
          ? [this.header.DepartmentMasterSid]
          : [];
    this.loadMilestoneData();
  }

  /**
   * Load, in parallel, the two lists the pending form is derived from:
   *   1. the full applicable master milestone list for the shipment's department
   *      (ff-booking/milestone — the same source the House Job milestone tab uses), and
   *   2. the achieved milestones via the shared milestone/job-flow fetch. The job
   *      flow returns `previousMilestones` (the upstream leg of a transhipment) and
   *      `currentMilestones` (this job's own recorded milestones); both are shown
   *      as achieved — the upstream leg first, then the current job.
   * Once both resolve, the pending form is built as the masters that fall after
   * the last achieved milestone (by SortBy).
   */
  private loadMilestoneData(): void {
    const h = this.header;
    if (!h?.HouseJobSid) {
      this.buildPending();
      return;
    }

    // Span both directions (e.g. LCL Import + LCL Export). The backend milestone
    // filter accepts arrays of department names / SIDs and unions the matches.
    const masters$ = this.operationService
      .getAllMilestones({
        CompanyMasterSid: this.companyId,
        BranchMasterSid: this.branchId,
        DepartmentName: this.milestoneDepartmentNames,
        DepartmentMasterSid: this.milestoneDepartmentSids,
      })
      .pipe(catchError(() => of([])));

    const flow$ =
      h.DepartmentMasterSid != null
        ? this.operationService
            .getMilestoneJobFlow({
              companyMasterSid: this.companyId,
              branchMasterSid: this.branchId,
              houseJobSid: h.HouseJobSid,
              departmentMasterSid: h.DepartmentMasterSid,
              bookingHeaderSid: h.BookingHeaderSid ?? null,
            })
            .pipe(catchError(() => of(null)))
        : of(null);

    forkJoin({ masters: masters$, flow: flow$ }).subscribe({
      next: ({ masters, flow }) => {
        this.pendingItems = masters || [];
        const previous = flow?.previousMilestones?.items || [];
        const current = flow?.currentMilestones?.items || [];
        // Show every achieved milestone ordered by its configured SortBy
        // (ascending); rows without a SortBy fall to the end.
        this.completed = [...previous, ...current].sort(
          (a, b) =>
            this.toSortBy(a?.SortBy, Number.MAX_SAFE_INTEGER) -
            this.toSortBy(b?.SortBy, Number.MAX_SAFE_INTEGER),
        );
        this.buildPending();
      },
      error: () => {
        this.appSettingService.showError('Failed to load milestones.');
        this.buildPending();
      },
    });
  }

  /** Coerce a (possibly string) SortBy to a number, falling back when unset/invalid. */
  private toSortBy(value: any, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  /**
   * Build the pending form: the master milestones that fall after the last
   * achieved milestone, compared purely by SortBy. The achieved rows (from the
   * job-flow) may reference different MilestoneMasterSids than the master list
   * (they can be auto-captured against a different master set), so the cut-off
   * is by SortBy value only — never by MilestoneMasterSid. With nothing achieved
   * yet, the full master list is shown.
   */
  private buildPending(): void {
    this.pendingForm.clear({ emitEvent: false });

    // Highest SortBy among the achieved milestones.
    const lastAchievedSortBy = this.completed.reduce((max, m) => {
      const sort = this.toSortBy(m?.SortBy, Number.NEGATIVE_INFINITY);
      return sort > max ? sort : max;
    }, Number.NEGATIVE_INFINITY);

    const items = this.pendingItems.filter((item) => {
      if (lastAchievedSortBy === Number.NEGATIVE_INFINITY) {
        return true;
      }
      const sort = this.toSortBy(item?.SortBy, Number.NEGATIVE_INFINITY);
      return sort > lastAchievedSortBy;
    });

    for (const item of items) {
      this.pendingForm.push(
        this.fb.group({
          MilestoneMasterSid: [item.MilestoneMasterSid],
          MilestoneName: [item.MilestoneName],
          // The date-time picker (app-date-time-picker) works with a UTC ISO
          // string; pending rows start empty.
          MilestoneDate: [item.MilestoneDate ?? null],
          Remarks: [item.Remarks || ''],
        }),
        { emitEvent: false },
      );
    }

    this.achievedLatest = this.latestAchievedDate();
    this.recomputeRowState();
  }

  /**
   * Recompute each pending row's minimum date and sequence error. Called once per
   * real change (form rebuild, or a value edit), never per change-detection cycle —
   * the Date objects it caches must keep a stable identity between cycles or the
   * `[minSelectableDate]` binding re-fires forever.
   */
  private recomputeRowState(): void {
    const rows = this.pendingForm.controls;
    this.minDates = [];
    this.rowErrors = [];

    // The date a row must fall strictly after: the latest of the last achieved
    // milestone and every earlier pending row that already has a date.
    let prev = this.achievedLatest;
    for (let i = 0; i < rows.length; i++) {
      this.minDates[i] = prev;

      const value = rows[i].get('MilestoneDate')?.value;
      const current = value ? new Date(value) : null;
      const valid = !!current && !isNaN(current.getTime());

      this.rowErrors[i] =
        valid && prev && current.getTime() <= prev.getTime()
          ? `Date & Time must be after the previous milestone (${this.formatDateTime(prev)}).`
          : null;

      if (valid && (!prev || current.getTime() > prev.getTime())) {
        prev = current;
      }
    }
  }

  get pendingControls(): FormGroup[] {
    return this.pendingForm.controls as FormGroup[];
  }

  get filledPendingCount(): number {
    return this.pendingControls.filter(
      (row) => !!row.get('MilestoneDate')?.value,
    ).length;
  }

  get nextMilestoneName(): string {
    return (
      this.pendingControls[0]?.get('MilestoneName')?.value ||
      (this.completed.length ? 'All complete' : 'Not started')
    );
  }

  get isAirDepartment(): boolean {
    return /air/i.test(this.header?.DepartmentName || '');
  }

  get freightModeLabel(): string {
    return this.isAirDepartment ? 'Air Freight' : 'Sea Freight';
  }

  get transportReference(): string {
    const vessel = this.header?.VesselName || '';
    const voyage = this.header?.VoyageNo || '';
    return [vessel, voyage].filter(Boolean).join(' / ') || '—';
  }

  /**
   * Latest MilestoneDate among the achieved milestones, or null — in the same
   * branch-local wall-clock frame the achieved chips are displayed in and the
   * pending date-time picker works in. Auto-captured ACTION rows (a UTC instant)
   * are shifted by the branch offset so the pending min-bound and sequence check
   * line up with what the user sees.
   */
  private latestAchievedDate(): Date | null {
    let latest: Date | null = null;
    for (const m of this.completed) {
      if (!m?.MilestoneDate) {
        continue;
      }
      const parsed = new Date(m.MilestoneDate);
      if (isNaN(parsed.getTime())) {
        continue;
      }
      const shift = this.milestoneShiftMs(m.MilestoneDate, m.AutoCaptured);
      const d = shift ? new Date(parsed.getTime() + shift) : parsed;
      if (!latest || d.getTime() > latest.getTime()) {
        latest = d;
      }
    }
    return latest;
  }

  /**
   * The date the pending row at `index` must fall strictly after: the latest of
   * the last achieved milestone and any earlier pending row that already has a
   * date. Drives the picker's minimum selectable date and the sequence check.
   */
  previousMilestoneDate(index: number): Date | null {
    return this.minDates[index] ?? null;
  }

  /**
   * Inline validation for a pending row: its Date & Time must be greater than the
   * previous milestone's. Returns an error message when it isn't, else null.
   */
  rowDateError(index: number): string | null {
    return this.rowErrors[index] ?? null;
  }

  /**
   * Format an achieved milestone's Date & Time for display. Mirrors the House Job
   * milestone tab's handling (see milestone.component.ts), because these achieved
   * rows come from the same job-flow API and MilestoneDate is a naive `timestamp`
   * with three meanings:
   *  - Auto-captured ACTION (DB `now()`): a real UTC instant → shift by the CURRENT
   *    BRANCH's offset so the chip reads branch-local, not UTC.
   *  - Auto-captured DATE-FIELD (@db.Date → midnight): a naive calendar date → raw.
   *  - Manual (date-time picker): the picked wall-clock stored UTC-naive → raw.
   * All read via getUTC* getters so output is independent of the viewer's browser TZ.
   * `autoCaptured` omitted ⇒ treated as manual (raw, no shift). Returns "" when empty.
   */
  formatMilestoneDateTime(value: any, autoCaptured?: any): string {
    if (!value) {
      return '';
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return '';
    }
    const shift = this.milestoneShiftMs(value, autoCaptured);
    const date = shift ? new Date(parsed.getTime() + shift) : parsed;
    return this.formatDateTime(date);
  }

  /** Current branch's UTC offset in ms (company-config timezone); 0 when unknown. */
  private branchOffsetMs(): number {
    const tz = this.appSettingService.getCurrentBranchInfo()?.timeZone;
    return getOffsetMinutes(normalizeTimezoneOffset(tz)) * 60 * 1000;
  }

  /**
   * ms to add to a stored MilestoneDate to reach the branch-local wall clock. Non-zero
   * ONLY for auto-captured ACTION rows (a now() UTC instant — AutoCaptured with a
   * non-midnight UTC time); 0 for auto DATE-FIELD rows (@db.Date → midnight) and manual
   * rows, which are already naive wall-clock.
   */
  private milestoneShiftMs(value: any, autoCaptured: any): number {
    const isAuto = autoCaptured === true || String(autoCaptured || '').trim().toUpperCase() === 'Y';
    if (!isAuto || !value) {
      return 0;
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return 0;
    }
    const isMidnightUtc =
      d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
    return isMidnightUtc ? 0 : this.branchOffsetMs();
  }

  /** Format a date as "06 Jul 2026" from its UTC components (date only, no time). */
  formatDateOnly(value: any): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${day} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }

  /** Format a date's UTC components for display (dates are stored UTC-naive). */
  private formatDateTime(value: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(value.getUTCDate()).padStart(2, '0');
    const month = months[value.getUTCMonth()];
    const year = value.getUTCFullYear();
    let hour = value.getUTCHours();
    const minute = String(value.getUTCMinutes()).padStart(2, '0');
    const meridian = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${day}-${month}-${year} ${String(hour).padStart(2, '0')}:${minute} ${meridian}`;
  }

  onSubmit(): void {
    if (!this.header) {
      return;
    }

    // Enforce the sequence: every filled row must be after the previous milestone.
    for (let i = 0; i < this.pendingForm.length; i++) {
      const error = this.rowDateError(i);
      if (error) {
        this.appSettingService.showWarning(error);
        return;
      }
    }

    const rows = this.pendingForm.getRawValue() as any[];
    const items: MilestoneTrackerSubmitItem[] = rows
      .filter((r) => !!r.MilestoneDate)
      .map((r) => ({
        MilestoneMasterSid: r.MilestoneMasterSid,
        MilestoneName: r.MilestoneName,
        MilestoneDate: r.MilestoneDate,
        Remarks: (r.Remarks || '').trim() || null,
      }));

    if (!items.length) {
      this.appSettingService.showWarning(
        'Enter a date for at least one pending milestone before submitting.',
      );
      return;
    }

    this.submitting = true;
    this.milestoneTrackerService
      .submitMilestones({
        ShipmentNo: this.header.ShipmentNo,
        HouseJobSid: this.header.HouseJobSid,
        BookingHeaderSid: this.header.BookingHeaderSid ?? null,
        CompanyMasterSid: this.companyId,
        BranchMasterSid: this.branchId,
        CreatedBy: this.userEmail,
        Items: items,
      })
      .subscribe({
        next: (res) => {
          this.submitting = false;
          if (!res?.status) {
            this.appSettingService.showWarning(
              res?.message || 'Could not save milestones.',
            );
            return;
          }
          this.appSettingService.showSuccess('Milestones saved successfully.');
          this.applyResult(res.data);
        },
        error: () => {
          this.submitting = false;
          this.appSettingService.showError('Failed to save milestones.');
        },
      });
  }

  onReset(): void {
    this.refNo = '';
    this.searchType = 'hbl';
    this.clearResult();
  }

  onClose(): void {
    this.clearResult();
    this.refNo = '';
  }

  private clearResult(): void {
    this.header = null;
    this.completed = [];
    this.houses = [];
    this.showHousePicker = false;
    this.notFound = false;
    this.notFoundRef = '';
    this.pendingForm?.clear({ emitEvent: false });
    this.achievedLatest = null;
    this.minDates = [];
    this.rowErrors = [];
  }
}
