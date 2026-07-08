import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DateTimePickerComponent } from 'src/app/component/datetimepicker/datetimepicker.component';
import { normalizeTimezoneOffset, getOffsetMinutes } from 'src/app/common/helper';

@Component({
  selector: 'app-milestone',
  standalone: true,
  imports: [NgSelectModule ,NgbDatepickerModule, FeatherModule, CustomDatePipe, CommonModule,ReactiveFormsModule,NgbPagination,DatePipe, DateTimePickerComponent],
  templateUrl: './milestone.component.html',
  styleUrl: './milestone.component.scss',
  providers: [
    // NOTE: do NOT provide a custom NgbDateAdapter/NgbDateParserFormatter here. This
    // component hosts <app-date-time-picker>, whose internal ngb-datepicker would
    // inherit the override via DI and break date selection (the emitted value stops
    // being a plain {year,month,day}, so the picker can't advance to the time view).
    // The milestone modal no longer uses a raw ngbDatepicker, so the override is unneeded.
    CustomDatePipe
  ],
})
export class MilestoneComponent implements OnInit {
  page1 = 1;
  pageSize1 = 5;
  totalPages = 0;
  currentMilestoneIndex: number;
  milestoneDataLength: number;
  milestoneFormArray: FormArray;
  slicedMilestoneFormArr: any[];
  currentBranch: any;
  currentCompany: any;
  filterOption: any;
  MilestoneMasterSid: any;
  selectedMode: string;
  milestoneForm !: FormGroup;
  isEditMode: boolean;
  // True while the open modal is showing an auto-captured (system-triggered) milestone.
  // For such rows the Milestone dropdown is locked (system-chosen); other fields stay editable.
  isAutoCapturedMilestone = false;
  userData : any;
  allMilestones: any[] = [];
  // Selectable date range for the open Add/Edit popup, derived from the selected
  // milestone's SortBy neighbours (previous milestone date .. next milestone date).
  milestoneMinDate: any = null;
  milestoneMaxDate: any = null;
  // Branch-local shift (ms) baked into the edit picker for the currently-open auto-captured ACTION
  // milestone, so save can undo it and persist the original stored instant. 0 for date-field/manual.
  private editDateShiftMs = 0;
  previousMilestones: any[] = [];
  previousMilestonesTitle = 'Previous Milestones';
  currentMilestonesTitle = 'Current Milestones';
  modeOfStatus = [
  { id: 'Active', name: 'Active' },
  { id: 'Suspended', name: 'Suspended' },
];


  @Input() screenName: string;
  @Input() hblNo: string;
  @Input() isFormDisabled: boolean = false;
   private _shipmentNo: string;
   @Input()
  get shipmentNo(): string {
    return this._shipmentNo;
  }
  set shipmentNo(value: string) {
    this._shipmentNo = value;
    this.scheduleShipmentMilestoneReload();
  }

  // Identifiers used to fetch this shipment's saved milestones. The backend fetch is
  // keyed by HouseJobSid / BookingHeaderSid / ShipmentNo (OR), so the parent passes
  // whichever it has: Booking screen -> bookingHeaderSid; House/Service -> houseJobSid.
  private _houseJobSid: any;
  @Input()
  get houseJobSid(): any {
    return this._houseJobSid;
  }
  set houseJobSid(value: any) {
    this._houseJobSid = value;
    this.scheduleShipmentMilestoneReload();
  }

  private _bookingHeaderSid: any;
  @Input()
  get bookingHeaderSid(): any {
    return this._bookingHeaderSid;
  }
  set bookingHeaderSid(value: any) {
    this._bookingHeaderSid = value;
    this.scheduleShipmentMilestoneReload();
  }

  // ShipmentNo and the two IDs typically bind together in one change-detection pass.
  // Coalesce them into a single fetch on the next microtask so the request reads the
  // final values regardless of binding order.
  private _milestoneReloadScheduled = false;
  private scheduleShipmentMilestoneReload(): void {
    if (this._milestoneReloadScheduled) {
      return;
    }
    this._milestoneReloadScheduled = true;
    Promise.resolve().then(() => {
      this._milestoneReloadScheduled = false;
      this.loadShipmentMilestones();
    });
  }

  // Current job's department. Passed by the parent screen so the milestone dropdown
  // is filtered (server-side) to milestones configured for this department. The
  // backend matches on either the name or the SID, so we forward both. Changing the
  // department after init reloads the dropdown. Screens that don't bind a department
  // get the full list (backward compatible).
  private _initialized = false;
  private _reloadScheduled = false;
  private _departmentName: string;
  @Input()
  get departmentName(): string {
    return this._departmentName;
  }
  set departmentName(value: string) {
    if (this._departmentName === value) {
      return;
    }
    this._departmentName = value;
    this.scheduleMilestoneReload();
  }

  private _departmentSid: any;
  @Input()
  get departmentSid(): any {
    return this._departmentSid;
  }
  set departmentSid(value: any) {
    if (this._departmentSid === value) {
      return;
    }
    this._departmentSid = value;
    this.scheduleMilestoneReload();
    this.scheduleShipmentMilestoneReload();
  }

  // departmentName and departmentSid often change together in one change-detection
  // pass. Coalesce them into a single reload on the next microtask so the request
  // always reads the final values regardless of input-binding order, and never
  // fires before ngOnInit's initial load.
  private scheduleMilestoneReload(): void {
    if (!this._initialized || this._reloadScheduled) {
      return;
    }
    this._reloadScheduled = true;
    Promise.resolve().then(() => {
      this._reloadScheduled = false;
      this.loadAllMilestones();
    });
  }

  private prevValue;
  @Input()
  set resetTrigger(value: boolean) {
    if (value !== this.prevValue) {
      this.prevValue = value;
      this.milestoneFormArray.clear();
      this.milestoneDataLength = 0;
      this.slicedMilestoneFormArr = [];
    }
  }
 

  @Output() dataEmitter = new EventEmitter<any[]>()
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    private excelExportService : ExcelExportService,
    private datePipe : CustomDatePipe
  ) { }

  ngOnInit(): void {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentCompany?.BranchMasterSid,
    }
    this.loadAllMilestones();
    this._initialized = true;
    this.milestoneFormArray = this.fb.array([])
  }

  loadAllMilestones() {
     const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentName: this._departmentName,
      DepartmentMasterSid: this._departmentSid,
      ...(this.isEditMode ? { updatedBy: currUserEmail } : { createdBy: currUserEmail })
    };

    this.operationService.getAllMilestones(payload).subscribe({
      next: (milestones) => {
        this.allMilestones = milestones;
      },
      error: (err) => {
        console.error('Failed to load all milestones', err);
        this.appSettingService.showError('Could not load master milestone list.');
      },
    });
  }


  loadShipmentMilestones(shipmentNo?: string) {
  if (shipmentNo !== undefined) {
    this._shipmentNo = shipmentNo;
  }

  if (this._houseJobSid != null) {
    if (this._departmentSid == null || this.currentCompany?.CompanyMasterSid == null ||
        this.currentBranch?.BranchMasterSid == null) {
      return;
    }
    const payload = {
      companyMasterSid: this.currentCompany.CompanyMasterSid,
      branchMasterSid: this.currentBranch.BranchMasterSid,
      bookingHeaderSid: this._bookingHeaderSid ?? null,
      houseJobSid: this._houseJobSid,
      departmentMasterSid: this._departmentSid
    };
    this.operationService.getMilestoneJobFlow(payload).subscribe({
      next: (flow) => {
        this.previousMilestones = flow?.previousMilestones?.items || [];
        this.previousMilestonesTitle = flow?.previousMilestones?.title || 'Previous Milestones';
        this.currentMilestonesTitle = flow?.currentMilestones?.title || 'Current Milestones';
        this.patchValues(flow?.currentMilestones?.items || [], true);
      },
      error: (err) => {
        console.error('Failed to fetch milestone job flow', err);
        this.appSettingService.showError('Could not load job-flow milestones.');
      }
    });
    return;
  }

  // Booking screen (no House Job generated yet). For a Transhipment Export booking the
  // backend also returns the source Import House milestones as read-only "Previous".
  // Non-transhipment bookings get an empty "previous", so behaviour is unchanged.
  if (this._bookingHeaderSid != null) {
    if (this.currentCompany?.CompanyMasterSid == null ||
        this.currentBranch?.BranchMasterSid == null) {
      return;
    }
    const payload = {
      companyMasterSid: this.currentCompany.CompanyMasterSid,
      branchMasterSid: this.currentBranch.BranchMasterSid,
      bookingHeaderSid: this._bookingHeaderSid
    };
    this.operationService.getMilestoneBookingFlow(payload).subscribe({
      next: (flow) => {
        this.previousMilestones = flow?.previousMilestones?.items || [];
        this.previousMilestonesTitle = flow?.previousMilestones?.title || 'Previous Milestones';
        this.currentMilestonesTitle = flow?.currentMilestones?.title || 'Current Milestones';
        this.patchValues(flow?.currentMilestones?.items || [], true);
      },
      error: (err) => {
        console.error('Failed to fetch milestone booking flow', err);
        this.appSettingService.showError('Could not load booking-flow milestones.');
      }
    });
    return;
  }

  // Legacy screens with only a ShipmentNo continue using the existing API.
  if (!this._shipmentNo) {
    return;
  }

  const payload = {
    ShipmentNo: this._shipmentNo,
    HouseJobSid: this._houseJobSid ?? null,
    BookingHeaderSid: this._bookingHeaderSid ?? null,
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid
  };

  this.operationService.getShipmentMilestones(payload).subscribe({
    next: (milestones) => {
      this.patchValues(milestones || []);   // populate formArray
    },
    error: (err) => {
      console.error("Failed to fetch shipment milestones", err);
      this.appSettingService.showError("Could not load shipment milestones.");
    }
  });
}

  initMilestoneForm() {
    this.milestoneForm = this.fb.group({
      ShipmentMilestoneSid: [null],
      ShipmentNo: [{ value: '', disabled: true }],
      MilestoneMasterSid: [null, Validators.required],
      MilestoneName: [''],
      MilestoneDate: ['', Validators.required],
      // Auto Captured is system-controlled, not user-selectable. Disabled so a manual
      // entry can never be ticked as auto; getRawValue() still persists its value and
      // patchValue() still reflects an existing auto row's checked state when viewing.
      AutoCaptured: [{ value: false, disabled: true }],
      Remarks: [''],
      Status: [{ value: 'Active', disabled: true }],
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      CreatedBy: this.userData['userEmail'],
      UpdatedBy: this.userData['userEmail']
      
    })
  }

  // `preservePrevious` is set by callers that manage the previous/current split
  // themselves (the House job-flow and Booking booking-flow). Legacy ShipmentNo-only
  // fetches leave it false so the read-only "previous" section is cleared.
  patchValues(items: any[], preservePrevious = false) {
    this.milestoneFormArray.clear();
    for (const item of items) {
      const formGroupWithData = this.createShipmentMilestone(item);
      this.milestoneFormArray.push(formGroupWithData);
    }
    this.milestoneDataLength = items.length;
    this.page1 = 1;
    if (!preservePrevious) {
      this.previousMilestones = [];
      this.currentMilestonesTitle = this._departmentName
        ? `Current ${this._departmentName} Milestones`
        : 'Current Milestones';
    }
    this.sortMilestonesBySortBy();
    this.milestoneFormArray.updateValueAndValidity();
    this.updateMilestonePagination();
    this.syncDataWithParentComponent();
  }

  createShipmentMilestone(data?:any): FormGroup {
    const milestoneForm = this.fb.group({
      ShipmentMilestoneSid: [data?.ShipmentMilestoneSid || null],
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      ShipmentNo: [data?.ShipmentNo || this.shipmentNo],
      MilestoneMasterSid: [data?.MilestoneMasterSid || null],
      MilestoneName: [data?.MilestoneName || null],
      // The row's own configured SortBy (sent by the backend) — used to order the grid
      // reliably even for saved milestones that aren't in the department dropdown.
      SortBy: [data?.SortBy ?? null],
      MilestoneDate: [data?.MilestoneDate || ''],
      AutoCaptured: [this.isAutoCapturedValue(data?.AutoCaptured)],
      Remarks: [data?.Remarks || null],
      Status: [data.Status ? (data.Status === "A" ? "Active" : "Suspended") : "Active"],
      CreatedBy: this.userData['userEmail'],
      UpdatedBy: this.userData['userEmail']
    })
    return milestoneForm;
  }

  openMilestoneModal(content: TemplateRef<any>, data?:any, milestoneIndex?: number) {
    if (this.isFormDisabled) {
      return;
    }
    this.initMilestoneForm();
    this.selectedMode = '';
    if(data) {
      this.currentMilestoneIndex = milestoneIndex;
      this.selectedMode = data.Mode;
      // Auto-captured (system-triggered) rows open as view-only — nothing is editable.
      this.isAutoCapturedMilestone = this.isAutoCapturedValue(data.AutoCaptured);
      // Auto-captured action milestones are stored as a UTC instant but shown branch-local in the
      // list; show the SAME wall clock in the edit picker (record the shift so save can undo it).
      this.editDateShiftMs = this.milestoneShiftMs(data?.MilestoneDate, data.AutoCaptured);
      this.milestoneForm.patchValue({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        ShipmentMilestoneSid: data.ShipmentMilestoneSid,
        ShipmentNo: data.ShipmentNo,
        MilestoneMasterSid: data.MilestoneMasterSid,
        MilestoneName : data.MilestoneName,
        MilestoneDate: this.toPickerDate(data?.MilestoneDate, data.AutoCaptured),
        AutoCaptured: this.isAutoCapturedValue(data.AutoCaptured),
        Remarks: data.Remarks,
        Status: data.Status,
        CreatedBy: this.userData['userEmail'],  
        UpdatedBy: this.userData['userEmail']
      });
      this.milestoneForm.get('Status')?.enable();
      // Edit: constrain the date to the SortBy window (excluding this row itself).
      this.applyMilestoneDateBounds(data.MilestoneMasterSid);
      // Lock every field when this is an auto-captured milestone (view-only).
      this.applyAutoCapturedLock();
    } else {
      this.currentMilestoneIndex = -1;
      this.isAutoCapturedMilestone = false;   // add rows are always manual → fully editable
      this.editDateShiftMs = 0;   // add rows are manual → no branch shift
      // Add: no milestone chosen yet, so no range until one is selected.
      this.applyMilestoneDateBounds(null);
      this.milestoneForm.patchValue({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      ShipmentMilestoneSid: null,
      ShipmentNo: '',
      MilestoneMasterSid: null,
      MilestoneDate: null,
      AutoCaptured: false,
      Remarks: '',
      Status: 'Active'
    });

    // Disable status in add mode
    this.milestoneForm.get('Status')?.disable();
    }

    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  /**
   * Auto-captured (system-triggered) rows carry a fixed, system-chosen milestone, so the
   * Milestone dropdown must not be changed. Disable only that control for auto rows (the
   * other fields — Date & Time, Remarks, Status — stay editable); manual rows re-enable it.
   * getRawValue() still persists the disabled MilestoneMasterSid on save.
   */
  private applyAutoCapturedLock(): void {
    const control = this.milestoneForm.get('MilestoneMasterSid');
    if (!control) {
      return;
    }
    if (this.isAutoCapturedMilestone) {
      control.disable();
    } else {
      control.enable();
    }
  }

  private isAutoCapturedValue(value: any): boolean {
    return value === true || String(value || '').trim().toUpperCase() === 'Y';
  }

  onMilestoneSubmit() {
    if (this.isFormDisabled) {
      return;
    }
    if(this.milestoneForm.invalid){
      this.milestoneForm.markAllAsTouched();
      this.milestoneForm.updateValueAndValidity();
      this.appSettingService.showWarning("Please fill all the required fields correctly.")
      return;
    }
    const milestoneFormValue = this.milestoneForm.getRawValue();
    // The edit picker shows branch-local for auto-captured action rows; convert back to the stored
    // (raw/UTC) instant so the date-sequence check compares like-for-like with the other (raw) rows
    // and we persist the original instant unchanged.
    milestoneFormValue.MilestoneDate = this.fromPickerDate(milestoneFormValue.MilestoneDate);

    // Prevent the same milestone being added twice. Match by milestone code (the
    // business identity) when available, else by MilestoneMasterSid. The row being
    // edited is excluded from the check.
    if (this.isDuplicateMilestone(milestoneFormValue.MilestoneMasterSid, this.currentMilestoneIndex)) {
      this.appSettingService.showWarning('This milestone is already added.');
      return;
    }

    // Enforce the SortBy date sequence: the date must sit between the previous and next
    // milestone (by SortBy). Prevents e.g. a later-stage milestone being dated earlier.
    const dateSequenceError = this.validateMilestoneDateSequence(
      milestoneFormValue.MilestoneMasterSid,
      milestoneFormValue.MilestoneDate,
      this.currentMilestoneIndex,
    );
    if (dateSequenceError) {
      this.appSettingService.showWarning(dateSequenceError);
      return;
    }

    if(this.currentMilestoneIndex !== -1){
      const existingForm = this.milestoneFormArray.at(this.currentMilestoneIndex) as FormGroup;
      existingForm.patchValue({
        ...milestoneFormValue
      })
    } else {
      this.milestoneFormArray.push(this.milestoneForm);
    }
    this.milestoneDataLength = this.milestoneFormArray.length;
    this.sortMilestonesBySortBy();
    this.milestoneFormArray.updateValueAndValidity();
    this.updateMilestonePagination();
    this.syncDataWithParentComponent();
    this.modalService.dismissAll();
  }

  /** Resolve a milestone master's code (lowercased) from the loaded dropdown list. */
  private getMilestoneCode(milestoneMasterSid: any): string {
    if (milestoneMasterSid === null || milestoneMasterSid === undefined) {
      return '';
    }
    const master = this.allMilestones?.find((m) => m.MilestoneMasterSid === milestoneMasterSid);
    return master?.MilestoneCode ? String(master.MilestoneCode).trim().toLowerCase() : '';
  }

  /** True when the selected milestone is already present in the list (by code, else by master Sid). */
  private isDuplicateMilestone(milestoneMasterSid: any, excludeIndex: number): boolean {
    if (milestoneMasterSid === null || milestoneMasterSid === undefined) {
      return false;
    }
    const newCode = this.getMilestoneCode(milestoneMasterSid);
    const rows = this.milestoneFormArray.getRawValue();
    return rows.some((row, index) => {
      if (excludeIndex !== -1 && index === excludeIndex) {
        return false;
      }
      const rowCode = this.getMilestoneCode(row.MilestoneMasterSid);
      if (newCode && rowCode) {
        return newCode === rowCode;
      }
      return row.MilestoneMasterSid != null && row.MilestoneMasterSid === milestoneMasterSid;
    });
  }

    onMilestoneChange(milestone: any) {
    if (!milestone) {
      // Reset fields if milestone is cleared
      this.milestoneForm.patchValue({
        MilestoneName: '',
        MilestoneDate: '',
        AutoCaptured: false,
        Remarks: ''
      });
      this.applyMilestoneDateBounds(null);
      return;
    }

    // Patch milestone values when selected. A milestone entered manually here is NOT a
    // system auto-capture, so AutoCaptured is always unticked ('N'/false) regardless of
    // the master's AutoCapture setting.
    this.editDateShiftMs = 0;   // picking a milestone here makes it a manual entry → no branch shift
    this.milestoneForm.patchValue({
      MilestoneName: milestone.MilestoneName,
      // leave date empty so user can choose
      AutoCaptured: false,
      Remarks: milestone.Remarks || ''
    });
    // Constrain the date picker to this milestone's SortBy window (prev .. next).
    this.applyMilestoneDateBounds(milestone.MilestoneMasterSid);
  }



  syncDataWithParentComponent() {
    const formValue : any[] = (this.milestoneFormArray.getRawValue() || []).map(
      m => ({...m, AutoCaptured : this.isAutoCapturedValue(m.AutoCaptured) ? 'Y' : 'N'})
    );
    this.dataEmitter.emit(formValue);
  }

  adjustMilestonePageAfterDelete() {
    const totalPages = Math.ceil(this.milestoneDataLength / this.pageSize1);
    if (this.page1 > totalPages && totalPages > 0) {
      this.page1 = totalPages;
    } else if (this.milestoneDataLength === 0) {
      this.page1 = 1;
    }
  }

  updateMilestonePagination() {
    const start = (this.page1 - 1) * this.pageSize1;
    const end = start + this.pageSize1;
    this.slicedMilestoneFormArr = this.milestoneFormArray.getRawValue().slice(start, end);
  }

  /** Numeric SortBy for a milestone, resolved from the department milestone master list. */
  private milestoneSortValue(milestoneMasterSid: any): number {
    const master = this.allMilestones?.find((m) => m.MilestoneMasterSid === milestoneMasterSid);
    const sortBy = Number(master?.SortBy);
    return Number.isFinite(sortBy) ? sortBy : Number.MAX_SAFE_INTEGER;
  }

  /**
   * SortBy for a milestone row: prefer the row's own SortBy (sent by the backend for
   * saved milestones) and only fall back to the department dropdown lookup for newly
   * added rows that don't carry one yet.
   */
  private resolveSortValue(ownSortBy: any, milestoneMasterSid: any): number {
    const own = Number(ownSortBy);
    if (Number.isFinite(own)) {
      return own;
    }
    return this.milestoneSortValue(milestoneMasterSid);
  }

  /**
   * Reorder the milestone rows by the configured master SortBy (numeric, ascending),
   * with Date & Time as the tie-breaker. Reorders the existing FormGroup instances
   * (does not recreate them) so every value — including Status — is preserved. Keeps
   * the grid in workflow order even after a new milestone is added at the end.
   */
  private sortMilestonesBySortBy(): void {
    const controls = [...this.milestoneFormArray.controls];
    if (controls.length < 2) {
      return;
    }
    controls.sort((a, b) => {
      const sa = this.resolveSortValue(a.get('SortBy')?.value, a.get('MilestoneMasterSid')?.value);
      const sb = this.resolveSortValue(b.get('SortBy')?.value, b.get('MilestoneMasterSid')?.value);
      if (sa !== sb) {
        return sa - sb;
      }
      const da = a.get('MilestoneDate')?.value ? new Date(a.get('MilestoneDate')!.value).getTime() : 0;
      const db = b.get('MilestoneDate')?.value ? new Date(b.get('MilestoneDate')!.value).getTime() : 0;
      return da - db;
    });
    this.milestoneFormArray.clear();
    controls.forEach((control) => this.milestoneFormArray.push(control));
  }

  /**
   * Enforce the SortBy date sequence. A milestone's Date & Time must be:
   *   - on/after the immediately-PREVIOUS milestone (nearest lower SortBy that has a date), and
   *   - on/before the immediately-NEXT milestone (nearest higher SortBy that has a date).
   * Uses full date+time. The row being edited is excluded. Returns an error message
   * when the date breaks the sequence, else null.
   */
  private validateMilestoneDateSequence(milestoneMasterSid: any, dateValue: any, excludeIndex: number): string | null {
    if (!dateValue) {
      return null;
    }
    const newSort = this.milestoneSortValue(milestoneMasterSid);
    const newTime = new Date(dateValue).getTime();
    if (Number.isNaN(newTime) || newSort === Number.MAX_SAFE_INTEGER) {
      return null;
    }

    let prev: { name: string; sort: number; date: any; auto?: any } | null = null;
    let next: { name: string; sort: number; date: any; auto?: any } | null = null;

    this.milestoneFormArray.getRawValue().forEach((row: any, index: number) => {
      if (excludeIndex !== -1 && index === excludeIndex) {
        return;
      }
      if (!row?.MilestoneDate) {
        return;
      }
      const sort = this.resolveSortValue(row.SortBy, row.MilestoneMasterSid);
      const time = new Date(row.MilestoneDate).getTime();
      if (Number.isNaN(time) || sort === Number.MAX_SAFE_INTEGER) {
        return;
      }
      if (sort < newSort && (!prev || sort > prev.sort)) {
        prev = { name: row.MilestoneName, sort, date: row.MilestoneDate, auto: row.AutoCaptured };
      } else if (sort > newSort && (!next || sort < next.sort)) {
        next = { name: row.MilestoneName, sort, date: row.MilestoneDate, auto: row.AutoCaptured };
      }
    });

    if (prev && newTime < new Date((prev as any).date).getTime()) {
      return `Date & Time must be on or after "${(prev as any).name}" (${this.formatMilestoneDateTime((prev as any).date, (prev as any).auto)}).`;
    }
    if (next && newTime > new Date((next as any).date).getTime()) {
      return `Date & Time must be on or before "${(next as any).name}" (${this.formatMilestoneDateTime((next as any).date, (next as any).auto)}).`;
    }
    return null;
  }

  /**
   * Set the calendar's selectable range for the open popup from the selected milestone's
   * SortBy neighbours: min = the previous milestone's date, max = the next milestone's
   * date. Null when there is no neighbour on that side (that end is unrestricted).
   */
  private applyMilestoneDateBounds(milestoneMasterSid: any): void {
    if (milestoneMasterSid === null || milestoneMasterSid === undefined) {
      this.milestoneMinDate = null;
      this.milestoneMaxDate = null;
      return;
    }
    const newSort = this.milestoneSortValue(milestoneMasterSid);
    if (newSort === Number.MAX_SAFE_INTEGER) {
      this.milestoneMinDate = null;
      this.milestoneMaxDate = null;
      return;
    }

    let prev: { sort: number; date: any; auto: any } | null = null;
    let next: { sort: number; date: any; auto: any } | null = null;

    this.milestoneFormArray.getRawValue().forEach((row: any, index: number) => {
      if (this.currentMilestoneIndex !== -1 && index === this.currentMilestoneIndex) {
        return;
      }
      if (!row?.MilestoneDate) {
        return;
      }
      const sort = this.resolveSortValue(row.SortBy, row.MilestoneMasterSid);
      if (sort === Number.MAX_SAFE_INTEGER) {
        return;
      }
      if (sort < newSort && (!prev || sort > prev.sort)) {
        prev = { sort, date: row.MilestoneDate, auto: row.AutoCaptured };
      } else if (sort > newSort && (!next || sort < next.sort)) {
        next = { sort, date: row.MilestoneDate, auto: row.AutoCaptured };
      }
    });

    // Bounds must be in the SAME frame the picker shows (branch-local for auto-captured action rows),
    // so an auto milestone's selectable range lines up with its (shifted) displayed value.
    this.milestoneMinDate = prev ? this.toPickerDate((prev as any).date, (prev as any).auto) : null;
    this.milestoneMaxDate = next ? this.toPickerDate((next as any).date, (next as any).auto) : null;
  }

  reportMilestones(): void {
    const allMilestones = this.slicedMilestoneFormArr;
    
    const formattedData = allMilestones.map((milestone, index) => ({
        SerialNo: index + 1,
        MilestoneName: milestone.MilestoneName || '',
        MilestoneDate: this.formatMilestoneDateTime(milestone.MilestoneDate, milestone.AutoCaptured) || '',
        AutoCaptured: (milestone.AutoCaptured === true || milestone.AutoCaptured === 'Y') ? 'Yes' : 'No',
        Status: this.getMilestoneStatusLabel(milestone.Status),
        Remarks: milestone.Remarks || ''
    }));

    const companyName = this.currentCompany?.companyName ?? 'Company';
    
    this.excelExportService.exportAsExcel({
        data: formattedData,
        headers: [
            { key: 'SerialNo', label: 'S.No' },
            { key: 'MilestoneName', label: 'Milestone' },
            { key: 'MilestoneDate', label: 'Date & Time' },
            { key: 'AutoCaptured', label: 'Auto Captured' },
            { key: 'Status', label: 'Status' },
            { key: 'Remarks', label: 'Remarks' }
        ],
        fileName: 'Booking-Milestone-Report',
        title: companyName
    });
}

/**
   * Format a milestone's date + time for display.
   *
   * MilestoneDate is a naive `timestamp` with THREE meanings depending on how the row was created:
   *  - Auto-captured ACTION (DB `now()`): a real UTC instant → shift by the CURRENT BRANCH's offset
   *    (branchOffset) so the chip reads branch-local, not UTC.
   *  - Auto-captured DATE-FIELD (DB stores the datepicker field, e.g. SOBDate — a @db.Date, so always
   *    midnight): a naive calendar date → read RAW, so the shown date always equals the field's date
   *    (offsetting would show a bogus time and could roll the date back on a negative-offset branch).
   *  - Manual (date-time picker): the picked wall-clock stored UTC-naive → read RAW.
   * All read via getUTC* getters so the output is independent of the viewer's browser TZ.
   * Distinguisher: only an auto-captured row with a NON-midnight UTC time is a now() action (⇒ shift).
   * Returns "" for empty/invalid. `autoCaptured` omitted ⇒ treated as manual (raw, no shift).
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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const rawHour = date.getUTCHours();
    const minute = String(date.getUTCMinutes()).padStart(2, '0');
    const meridian = rawHour >= 12 ? 'PM' : 'AM';
    let hour12 = rawHour % 12;
    if (hour12 === 0) {
      hour12 = 12;
    }
    return `${day}-${month}-${year} ${String(hour12).padStart(2, '0')}:${minute} ${meridian}`;
  }

  /** Current branch's UTC offset in ms (company-config timezone); 0 when unknown. */
  private branchOffsetMs(): number {
    const tz = this.appSettingService.getCurrentBranchInfo()?.timeZone;
    return getOffsetMinutes(normalizeTimezoneOffset(tz)) * 60 * 1000;
  }

  /**
   * ms to add to a stored MilestoneDate to reach the branch-local wall clock. Non-zero ONLY for
   * auto-captured ACTION rows (a now() UTC instant — AutoCaptured with a non-midnight UTC time);
   * 0 for auto DATE-FIELD rows (@db.Date → midnight) and manual rows, which are already naive.
   * Single source of truth shared by display, edit-load (toPickerDate) and save (fromPickerDate).
   */
  private milestoneShiftMs(value: any, autoCaptured: any): number {
    const isAuto = autoCaptured === true || autoCaptured === 'Y';
    if (!isAuto || !value) {
      return 0;
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return 0;
    }
    const isMidnightUtc = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
    return isMidnightUtc ? 0 : this.branchOffsetMs();
  }

  /**
   * Stored MilestoneDate → the value fed to the edit date-time picker. The picker reads UTC
   * components, so bake the branch offset into the ISO string for auto-captured ACTION rows, making
   * the modal show the SAME wall clock as the list chip. Date-field/manual values pass through raw.
   */
  private toPickerDate(value: any, autoCaptured: any): any {
    const shift = this.milestoneShiftMs(value, autoCaptured);
    if (!shift || !value) {
      return value || null;
    }
    return new Date(new Date(value).getTime() + shift).toISOString();
  }

  /**
   * Edit picker value → stored MilestoneDate: undo the branch-local shift applied on load (using the
   * shift recorded when the modal opened) so the date-sequence check compares like-for-like with the
   * other (raw) rows and the persisted UTC instant is unchanged. No-op when nothing was shifted.
   */
  private fromPickerDate(value: any): any {
    if (!this.editDateShiftMs || !value) {
      return value ?? null;
    }
    return new Date(new Date(value).getTime() - this.editDateShiftMs).toISOString();
  }

  getMilestoneStatusLabel(status: any): string {
    return this.isMilestoneSuspended(status) ? 'Suspended' : 'Active';
  }

  isMilestoneSuspended(status: any): boolean {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    return normalizedStatus === 's' || normalizedStatus === 'suspended' || normalizedStatus === 'suspend';
  }

isHBLNoValid(): boolean {
    // Only apply this validation for Booking screen
    if (this.screenName !== 'Booking') {
      return true;
    }
    
    // Return true (enable button) when HBLNo is null/undefined/empty string
    // Return false (disable button) when HBLNo has any value
    return !this.hblNo || this.hblNo.trim() === '';
  }
  
}
