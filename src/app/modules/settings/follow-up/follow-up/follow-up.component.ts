import { Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Optional, Output, SimpleChanges } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { SafeInsertShipmentMilestone, ShipmentMilestoneService } from 'src/app/modules/operation/services/shipment-milestone.service';
import { branchDateToUtcIso, utcIsoToBranchLocalDate } from 'src/app/common/helper';

@Component({
  selector: 'app-follow-up',
  standalone: true,
  imports: [
    NgSelectModule,
    NgbDatepickerModule,
    FeatherModule,
    FormsModule,
    PreventMultiClickDirective,
    ReactiveFormsModule,
    SearchableDropdown,
    CommonModule
  ],
  templateUrl: './follow-up.component.html',
  styleUrl: './follow-up.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class FollowUpComponent implements OnInit, OnChanges, OnDestroy {
  @Input() parentEmail: string;
  @Input() parentEmailCC?: string;
  @Input() parentSubject!: string;
  @Input() parentMailbody!: string;
  @Input() documentSid!: number;
  @Input() menuMasterSid: number;
  @Input() showPublic: boolean = false;
  @Input() screenName: string = 'Follow Up';
  @Input() dataItems: any[] = [];
  @Input() resetTrigger: boolean = false;
  @Input() formData: any;
  @Input() parentMailbodyTemplate: string = '';

  private _isFormDisabled: boolean = false;
  @Input()
  set isFormDisabled(value: boolean) {
    this._isFormDisabled = value;
    if (this.activeForm) {
      value ? this.activeForm.disable({ emitEvent: false }) : this.activeForm.enable({ emitEvent: false });
    }
  }
  get isFormDisabled(): boolean {
    return this._isFormDisabled;
  }

  @Input() autoInsertMilestone?: boolean = false;
  @Input() milestonePayload?: {
    MilestoneCode: string;
    ShipmentNo: string;
    CompanyMasterSid: number;
    BranchMasterSid: number;
    DepartmentName: string;
    JobType: string;
    createdBy: string;
    Remarks: string;
    HouseJobSid?: number;
    BookingHeaderSid?: number;
  };

  @Output() reloadMilestone = new EventEmitter<void>();
  @Output() closeModalEvent = new EventEmitter<boolean>();
  @Output() dataEmitter = new EventEmitter<any>();
  @Output() followupSaved = new EventEmitter<any>();

  // Accordion state
  followups: any[] = [];
  expandedId: string | null = null;
  activeForm: FormGroup | null = null;
  activeRowRef: any = null;         // reference to the currently open row object
  activeRowData: any = null;        // snapshot of original row data (for Reset)
  activeRowIsNew = false;
  isExternalFreeText = false;
  activeFilter: 'All' | 'Pending' | 'Completed' = 'All';
  searchTerm = '';

  loading = false;
  userData: any;
  usersList: any[] = [];
  customerList: any[] = [];
  currentCompany: any;
  currentBranch: any;

  mailBody: string = '';
  subject: string = '';

  modeOfStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];
  modeOfAction = [
    { id: '1', name: 'Internal' },
    { id: '2', name: 'External' },
    { id: '3', name: 'Both' }
  ];

  private rowFormCleanup$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private shipmentMilestoneService: ShipmentMilestoneService,
    @Optional() public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) this.userData = userProfile;
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.getCurrentBranchInfo();
    this.loadLookups();
    if (this.documentSid) this.loadFollowups();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documentSid'] && !changes['documentSid'].firstChange && changes['documentSid'].currentValue) {
      this.closeRow();
      this.loadFollowups();
    }
    if (changes['autoInsertMilestone'] && !changes['autoInsertMilestone'].firstChange) {
      this.autoInsertMilestone = changes['autoInsertMilestone'].currentValue;
    }
    if (changes['milestonePayload'] && !changes['milestonePayload'].firstChange) {
      this.milestonePayload = changes['milestonePayload'].currentValue;
    }
  }

  ngOnDestroy(): void {
    this.rowFormCleanup$.next();
    this.rowFormCleanup$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data Loading ─────────────────────────────────────────────────────────

  loadFollowups(): void {
    if (!this.documentSid) return;
    this.masterService.getFollowupsByDocumentId(this.documentSid, this.menuMasterSid).subscribe({
      next: (resp: any) => {
        this.followups = resp.data || [];
      },
      error: (err) => console.error('Failed to load followups:', err)
    });
  }

  loadLookups() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!CompanyMasterSid) {
      this.appSettingService.showError('Company information not available');
      return;
    }
    forkJoin({
      users: this.masterService.getAllFfUserByCompany(CompanyMasterSid),
      customers: this.masterService.getAllCustomersWithCustomerBranch(CompanyMasterSid)
    }).subscribe(({ users, customers }) => {
      this.usersList = users.data || [];
      this.customerList = customers || [];
    });
  }

  // ── Accordion Logic ───────────────────────────────────────────────────────

  getRowId(row: any): string {
    return row.FollowupSid ? row.FollowupSid.toString() : (row._tempId || '');
  }

  trackByRow = (_: number, row: any): any => {
    return row.FollowupSid ? row.FollowupSid.toString() : (row._tempId || '');
  }

  isRowLocked(row: any): boolean {
    return row.IsCompleted === 'Y' || row.Status === 'S';
  }

  get filteredFollowups(): any[] {
    let list = this.followups;
    switch (this.activeFilter) {
      case 'Pending':   list = list.filter(r => r.IsCompleted !== 'Y'); break;
      case 'Completed': list = list.filter(r => r.IsCompleted === 'Y'); break;
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(r =>
        (r.Subject || '').toLowerCase().includes(term) ||
        (r.Remarks || '').toLowerCase().includes(term) ||
        (r.ExternalUser || '').toLowerCase().includes(term)
      );
    }
    return list;
  }

  get allCount(): number { return this.followups.filter(r => !r._isNew).length; }
  get pendingCount(): number { return this.followups.filter(r => !r._isNew && r.IsCompleted !== 'Y').length; }
  get completedCount(): number { return this.followups.filter(r => r.IsCompleted === 'Y').length; }

  setFilter(filter: 'All' | 'Pending' | 'Completed') {
    this.activeFilter = filter;
  }

  openRow(row: any) {
    const rowId = this.getRowId(row);
    // Toggle: clicking the already-open row header closes it
    if (this.expandedId === rowId) {
      if (this.activeForm?.dirty) {
        if (!confirm('You have unsaved changes. Discard them?')) return;
      }
      this.closeRow();
      return;
    }
    // Switching away from a dirty form — prompt before discarding
    if (this.expandedId !== null && this.activeForm?.dirty) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    // Remove any currently-open new row
    if (this.expandedId !== null && this.activeRowIsNew) {
      const idx = this.followups.findIndex(r => this.getRowId(r) === this.expandedId);
      if (idx !== -1) this.followups.splice(idx, 1);
    }
    this.rowFormCleanup$.next();
    this.expandedId = rowId;
    this.activeRowRef = row;
    this.activeRowData = { ...row };
    this.activeRowIsNew = !row.FollowupSid;
    this.isExternalFreeText = this.shouldUseFreeText(row);
    this.activeForm = this.buildRowForm(row);
    if (this.isRowLocked(row)) this.activeForm.disable({ emitEvent: false });
    this.subscribeToActionChanges();
  }

  closeRow() {
    this.rowFormCleanup$.next();
    if (this.activeRowIsNew && this.expandedId) {
      const idx = this.followups.findIndex(r => this.getRowId(r) === this.expandedId);
      if (idx !== -1) this.followups.splice(idx, 1);
    }
    this.expandedId = null;
    this.activeForm = null;
    this.activeRowRef = null;
    this.activeRowData = null;
    this.activeRowIsNew = false;
    this.isExternalFreeText = false;
  }

  addNew() {
    const tempId = `new_${Date.now()}`;
    const newRow = { _tempId: tempId, Status: 'A', IsCompleted: 'N', _isNew: true };
    // Close any currently open row (discarding new if needed)
    if (this.expandedId !== null && this.activeRowIsNew) {
      const idx = this.followups.findIndex(r => this.getRowId(r) === this.expandedId);
      if (idx !== -1) this.followups.splice(idx, 1);
    }
    this.rowFormCleanup$.next();
    this.followups = [newRow, ...this.followups];
    this.expandedId = tempId;
    this.activeRowRef = newRow;
    this.activeRowData = { ...newRow };
    this.activeRowIsNew = true;
    this.isExternalFreeText = false;
    this.activeForm = this.buildRowForm(newRow);
    this.subscribeToActionChanges();
  }

  /** Reset the currently open form back to its original saved values */
  resetActiveForm() {
    if (!this.activeForm || !this.activeRowData) return;
    this.rowFormCleanup$.next();
    this.isExternalFreeText = this.shouldUseFreeText(this.activeRowData);
    this.activeForm = this.buildRowForm(this.activeRowData);
    this.subscribeToActionChanges();
  }

  /** Create a new unsaved row pre-filled with the values from an existing row */
  duplicateRow(row: any) {
    const tempId = `new_${Date.now()}`;
    const duplicated = {
      ...row,
      FollowupSid: undefined,
      _tempId: tempId,
      _isNew: true,
      CreatedOn: undefined,
      CreatedBy: undefined,
      UpdatedOn: undefined,
      UpdatedBy: undefined,
      IsCompleted: 'N',
    };
    // Close current row (discard new-unsaved if needed)
    if (this.expandedId !== null && this.activeRowIsNew) {
      const idx = this.followups.findIndex(r => this.getRowId(r) === this.expandedId);
      if (idx !== -1) this.followups.splice(idx, 1);
    }
    this.rowFormCleanup$.next();
    this.followups = [duplicated, ...this.followups];
    this.expandedId = tempId;
    this.activeRowRef = duplicated;
    this.activeRowData = { ...duplicated };
    this.activeRowIsNew = true;
    this.isExternalFreeText = this.shouldUseFreeText(duplicated);
    this.activeForm = this.buildRowForm(duplicated);
    this.subscribeToActionChanges();
  }

  private buildRowForm(row?: any): FormGroup {
    const statusValue = row?.Status === 'S' ? 'Suspended' : 'Active';
    const followupDate = row?.FollowupDate
      ? utcIsoToBranchLocalDate(row.FollowupDate, this.currentBranch?.timeZone)
      : null;
    return this.fb.group({
      FollowupRequire: [row?.FollowupRequire ?? 'Y'],
      FollowupDate: [followupDate, Validators.required],
      FollowupAction: [row?.FollowupAction ?? '', Validators.required],
      InternalUser: [row?.InternalUser ?? null],
      ExternalUser: [row?.ExternalUser ?? ''],
      Remarks: [row?.Remarks ?? ''],
      Public: [row?.Public === 'Y'],
      sentEmail: [row?.sentEmail === 'Y'],
      Status: [statusValue, Validators.required],
      Subject: [row?.Subject ?? '', Validators.required],
    });
  }

  private subscribeToActionChanges() {
    this.activeForm.get('FollowupAction')?.valueChanges
      .pipe(takeUntil(this.rowFormCleanup$))
      .subscribe(action => {
        const ctrl = this.activeForm.get('InternalUser');
        if (action === 'Internal' || action === 'Both') {
          ctrl?.setValidators([Validators.required]);
        } else {
          ctrl?.clearValidators();
          if (action !== 'Both') ctrl?.setValue(null);
        }
        ctrl?.updateValueAndValidity();
      });
  }

  private shouldUseFreeText(row: any): boolean {
    if (!row.ExternalUser) return false;
    return !this.customerList.some(c => c.CustomerName === row.ExternalUser);
  }

  toggleExternalFreeText() {
    this.isExternalFreeText = !this.isExternalFreeText;
    this.activeForm?.get('ExternalUser')?.reset();
  }

  get showInternalUserField(): boolean {
    const action = this.activeForm?.get('FollowupAction')?.value;
    return action === 'Internal' || action === 'Both';
  }

  get showExternalUserField(): boolean {
    const action = this.activeForm?.get('FollowupAction')?.value;
    return action === 'External' || action === 'Both';
  }

  get isInternalUserRequired(): boolean {
    return this.showInternalUserField;
  }

  get isExternalUserRequired(): boolean {
    return this.showExternalUserField;
  }

  // ── Save / Delete ─────────────────────────────────────────────────────────

  async saveRow(row: any) {
    if (!this.activeForm || this.loading) return;
    this.activeForm.markAllAsTouched();
    if (this.activeForm.invalid) {
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    this.loading = true;
    const formValue = this.activeForm.value;
    const currentUser = this.appSettingService.userSettingSource.value['userEmail'];

    const followupDate = formValue.FollowupDate
      ? branchDateToUtcIso(formValue.FollowupDate, this.currentBranch?.timeZone)
      : null;

    this.subject = this.parentSubject ? this.parentSubject.replace('__SUBJECT__', formValue.Subject || '') : formValue.Subject;
    this.mailBody = this.parentMailbodyTemplate ? this.parentMailbodyTemplate.replace('__SUBJECT__', formValue.Subject || '') : '';

    const followupCreate = {
      FollowupRequire: formValue.FollowupRequire,
      FollowupDate: followupDate,
      FollowupAction: formValue.FollowupAction,
      InternalUser: formValue.InternalUser,
      ExternalUser: formValue.ExternalUser || null,
      Remarks: formValue.Remarks,
      Public: formValue.Public,
      sentEmail: formValue.sentEmail,
      Status: formValue.Status === 'Active' ? 'A' : 'S',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DocumentSid: this.documentSid,
      MenuMasterSid: this.menuMasterSid,
      Subject: formValue.Subject,
    };

    const emailRecipients = this.getEmailRecipients(formValue);
    const mailContent = {
      EmailTo: emailRecipients.to,
      EmailCC: emailRecipients.cc,
      Subject: this.subject,
      Mailbody: this.mailBody,
    };

    const isNew = this.activeRowIsNew;

    const onSuccess = (resp: any) => {
      if (resp.status) {
        this.followupSaved.emit(resp);
        const isCargoInvolved = followupCreate.FollowupAction === 'External' && this.subject.toLowerCase().includes('cargo');
        if (isCargoInvolved && this.autoInsertMilestone) {
          this.handleAutoInsertMilestone();
        }
        // Use closeRow() so activeRowRef/activeRowData are also cleared
        this.rowFormCleanup$.next();
        this.expandedId = null;
        this.activeForm = null;
        this.activeRowRef = null;
        this.activeRowData = null;
        this.activeRowIsNew = false;
        this.isExternalFreeText = false;
        this.loadFollowups();
      } else {
        this.appSettingService.showError(resp.message);
      }
      this.loading = false;
    };

    const onError = (error: any) => {
      this.appSettingService.showError(error.message);
      this.loading = false;
    };

    if (isNew) {
      const payload = { followupCreate, mailContent, createdBy: currentUser, updatedBy: currentUser };
      this.masterService.createFollowup(payload).subscribe({ next: onSuccess, error: onError });
    } else {
      const payload = { followupCreate, mailContent, updatedBy: currentUser };
      this.masterService.updateById(row.FollowupSid, payload).subscribe({ next: onSuccess, error: onError });
    }
  }

  deleteRow(row: any) {
    if (!row.FollowupSid) {
      this.closeRow();
      return;
    }
    this.masterService.deletefollowupById(row.FollowupSid).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Followup deleted');
          this.closeRow();
          this.loadFollowups();
        } else {
          this.appSettingService.showError(resp.message);
        }
      },
      error: (error) => this.appSettingService.showError(error.message)
    });
  }

  onToggleCompleted(row: any, isCompleted: string) {
    const currentUser = this.appSettingService.userSettingSource.value['userEmail'];
    this.masterService.markFollowupCompleted(row.FollowupSid, {
      documentSid: this.documentSid,
      menuMasterSid: this.menuMasterSid,
      isCompleted,
      updatedBy: currentUser
    }).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.loadFollowups();
        } else {
          this.appSettingService.showError(resp.message);
        }
      },
      error: (error) => this.appSettingService.showError(error.message)
    });
  }

  // ── Display Helpers ───────────────────────────────────────────────────────

  private static readonly MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  private static readonly DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  /** Returns "25 May 2026" — branch-local calendar date */
  formatRowDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = utcIsoToBranchLocalDate(dateStr, this.currentBranch?.timeZone);
    if (!date) return '-';
    const d = date.getUTCDate();
    const m = FollowUpComponent.MONTHS[date.getUTCMonth()];
    const y = date.getUTCFullYear();
    return `${d} ${m} ${y}`;
  }

  /** Returns "Mon", "Tue", etc. */
  getDayLabel(dateStr: string): string {
    if (!dateStr) return '';
    const date = utcIsoToBranchLocalDate(dateStr, this.currentBranch?.timeZone);
    if (!date) return '';
    return FollowUpComponent.DAYS[date.getUTCDay()];
  }

  /** Returns 1-2 letter initials for the user/external on the row */
  getUserInitials(row: any): string {
    const name = this.getUserNameOrExternal(row);
    if (!name || name === '-' || name === '—') return '?';
    // Filter out non-word characters at the start of each token
    const parts = name.split(/\s+/).filter((p: string) => /\w/.test(p));
    if (!parts.length) return '?';
    return parts.map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  /** Returns the CSS class for the status badge */
  getBadgeClass(row: any): string {
    return row.IsCompleted === 'Y' ? 'badge--done' : 'badge--pending';
  }

  getStatusLabel(row: any): string {
    return row.IsCompleted === 'Y' ? 'Completed' : 'Pending';
  }

  getUserNameOrExternal(row: any): string {
    if (row.InternalUser) {
      return this.usersList.find((u: any) => u.UserMasterSid === row.InternalUser)?.userName || `User#${row.InternalUser}`;
    }
    return row.ExternalUser || '—';
  }

  /** @deprecated kept for any legacy callers */
  getActionDotColor(action: string): string {
    switch (action) {
      case 'Internal': return '#5b8def';
      case 'External': return '#e0a82e';
      case 'Both': return '#8e6dd2';
      default: return '#ccc';
    }
  }
  getStatusBg(row: any): string {
    if (row.IsCompleted === 'Y') return '#eef2f7';
    if (row.Status === 'S') return '#fff3e1';
    return '#e6f4ec';
  }
  getStatusColor(row: any): string {
    if (row.IsCompleted === 'Y') return '#7a8a9c';
    if (row.Status === 'S') return '#c97a16';
    return '#2e7d4f';
  }

  private getUserEmail(sid: number): string {
    return this.usersList.find(u => u.UserMasterSid === sid)?.userEmail || '';
  }

  // ── Email / PDF ───────────────────────────────────────────────────────────

  private getEmailRecipients(formValue: any): { to: string; cc: string } {
    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    let emailTo = '';
    let emailCC = currentUserEmail;

    switch (formValue.FollowupAction) {
      case 'Internal':
        emailTo = this.getUserEmail(formValue.InternalUser);
        break;
      case 'External':
        if (!this.isExternalFreeText) {
          const customer = this.customerList.find(c => c.CustomerName === formValue.ExternalUser);
          emailTo = customer?.Email || formValue.ExternalUser || '';
        } else {
          emailTo = formValue.ExternalUser || '';
        }
        break;
      case 'Both': {
        const internalEmail = this.getUserEmail(formValue.InternalUser);
        let externalEmail = '';
        if (!this.isExternalFreeText) {
          const customer = this.customerList.find(c => c.CustomerName === formValue.ExternalUser);
          externalEmail = customer?.Email || formValue.ExternalUser || '';
        } else {
          externalEmail = formValue.ExternalUser || '';
        }
        emailTo = [internalEmail, externalEmail].filter(e => e && e.trim()).join(', ');
        break;
      }
    }

    if (this.parentEmailCC) {
      const ccEmails = this.parentEmailCC.split(',').map(e => e.trim());
      ccEmails.forEach(ccEmail => {
        if (ccEmail && ccEmail !== currentUserEmail && ccEmail !== emailTo && !emailCC.includes(ccEmail)) {
          emailCC += (emailCC ? ', ' : '') + ccEmail;
        }
      });
    }

    return { to: emailTo, cc: emailCC };
  }

  private async generatePdfFromHtml(html: string): Promise<File> {
    const element = document.createElement('div');
    element.innerHTML = html;
    element.style.position = 'fixed';
    element.style.left = '-9999px';
    document.body.appendChild(element);
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const pdfBlob = pdf.output('blob');
    document.body.removeChild(element);
    return new File([pdfBlob], 'Followup.pdf', { type: 'application/pdf' });
  }

  // ── Milestone ─────────────────────────────────────────────────────────────

  handleAutoInsertMilestone() {
    const milestoneDate = this.getMilestoneDateFromForm();
    const payload: SafeInsertShipmentMilestone = {
      CompanyMasterSid: this.milestonePayload?.CompanyMasterSid || this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.milestonePayload?.BranchMasterSid || this.currentBranch?.BranchMasterSid,
      DepartmentName: this.milestonePayload?.DepartmentName,
      JobType: this.milestonePayload?.JobType,
      MilestoneCode: this.milestonePayload?.MilestoneCode,
      ShipmentNo: this.milestonePayload?.ShipmentNo,
      HouseJobSid: this.milestonePayload?.HouseJobSid,
      BookingHeaderSid: this.milestonePayload?.BookingHeaderSid,
      MilestoneDate: milestoneDate || undefined,
      createdBy: this.milestonePayload?.createdBy,
      // carry the anchors through so the milestone attaches to the booking / house job, not ShipmentNo only
      Remarks: this.milestonePayload?.Remarks
    };
    this.shipmentMilestoneService.safeInsertMilestone(payload).subscribe({
      next: (resp) => {
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message);
          this.reloadMilestone.emit();
        } else {
          this.appSettingService.showError(resp.message);
        }
      },
      error: (error) => this.appSettingService.showError(error.message)
    });
  }

  private getMilestoneDateFromForm(): Date | null {
    const followupDate = this.activeForm?.get('FollowupDate')?.value;
    if (!followupDate) return null;
    if (followupDate instanceof Date) return isNaN(followupDate.getTime()) ? null : followupDate;
    if (typeof followupDate === 'string') {
      const parsed = new Date(followupDate);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof followupDate === 'object' && 'year' in followupDate) {
      const parsed = new Date(followupDate.year, followupDate.month - 1, followupDate.day);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const tag = (event.target as HTMLElement)?.tagName?.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if ((event.key === 'n' || event.key === 'N') && !event.metaKey && !event.ctrlKey) {
      this.addNew();
    }
    if (event.key === 'Escape') {
      this.closeRow();
    }
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  closeModal() {
    if (this.activeModal) {
      this.activeModal.close();
    } else {
      this.closeModalEvent.emit(true);
    }
  }
}
