import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { AuthorizationApprovalService } from './authorization-approval.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-authorization-approval',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgbPaginationModule,
    NgSelectModule,
    FeatherModule,
    NgxSpinnerModule,
    FavoriteStarComponent,
    CustomDatePipe,
  ],
  providers: [CustomDatePipe],
  templateUrl: './authorization-approval.component.html',
  styleUrl: './authorization-approval.component.scss',
})
export class AuthorizationApprovalComponent implements OnInit {
  @ViewChild('decisionModal') decisionModal!: TemplateRef<any>;
  @ViewChild('detailsModal') detailsModal!: TemplateRef<any>;

  // Data
  rows: any[] = [];
  menus: { MenuMasterSid: number; MenuName: string }[] = [];

  // Filters
  filterValue = '';
  selectedMenu: number | null = null; // null = All
  selectedDepartment: number | null = null; // reserved (no UI dropdown)
  statusFilter = 'Pending';
  dateFrom: string | null = null;
  dateTo: string | null = null;

  // Pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;

  // Selection (keyed by menu+document)
  selectedKeys = new Set<string>();

  // Context
  currentCompany: any;
  currentBranch: any;
  userData: any;

  // Modal state
  decisionType: 'Approved' | 'Rejected' = 'Approved';
  decisionRemarks = '';
  decisionRow: any = null;
  isBulkDecision = false;
  detailLogs: any[] = [];
  detailStatus = '';

  constructor(
    private approvalService: AuthorizationApprovalService,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    private modal: NgbModal,
    private datePipe: CustomDatePipe,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const profile = this.appSettingService.getDecryptedUserProfile();
    if (profile) this.userData = profile;

    this.loadMenus();
    this.loadPending();
  }

  // ── Loaders ────────────────────────────────────────────────────────────────
  loadMenus(): void {
    this.approvalService
      .getAvailableMenus(
        this.userData?.UserMasterSid,
        this.currentCompany?.CompanyMasterSid,
        this.currentBranch?.BranchMasterSid,
      )
      .subscribe({
        next: (resp) => {
          this.menus = resp?.status ? resp.data || [] : [];
        },
        error: (err) => console.error('Load menus error', err),
      });
  }

  loadPending(): void {
    this.spinner.show();
    const payload = {
      UserMasterSid: this.userData?.UserMasterSid,
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: this.selectedMenu || undefined,
      DepartmentMasterSid: this.selectedDepartment || undefined,
      search: this.filterValue.trim(),
      page: this.page,
      pageSize: this.pageSize,
      dateFrom: this.dateFrom || undefined,
      dateTo: this.dateTo || undefined,
      status: this.statusFilter,
    };
    this.approvalService.getPendingDocuments(payload).subscribe({
      next: (resp) => {
        if (resp?.status) {
          this.rows = resp.data?.items || [];
          this.totalLengthOfCollection = resp.data?.totalCount || 0;
        } else {
          this.appSettingService.showError(resp?.message || 'Error loading pending approvals.');
          this.rows = [];
          this.totalLengthOfCollection = 0;
        }
        this.pruneSelection();
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Load pending error', err);
        this.spinner.hide();
        this.appSettingService.showError('Error loading pending approvals.');
      },
    });
  }

  // ── Filters / pagination ─────────────────────────────────────────────────────
  onMenuChange(): void {
    this.page = 1;
    this.loadPending();
  }

  applyFilters(): void {
    this.page = 1;
    this.loadPending();
  }

  clearFilterValue(): void {
    this.filterValue = '';
    this.page = 1;
    this.loadPending();
  }

  resetPage(): void {
    this.filterValue = '';
    this.selectedMenu = null;
    this.selectedDepartment = null;
    this.statusFilter = 'Pending';
    this.dateFrom = null;
    this.dateTo = null;
    this.page = 1;
    this.selectedKeys.clear();
    this.loadPending();
  }

  updatePaginationData(): void {
    this.loadPending();
  }

  // ── Selection ────────────────────────────────────────────────────────────────
  rowKey(row: any): string {
    return `${row.MenuMasterSid}-${row.DocumentSid}`;
  }

  isSelected(row: any): boolean {
    return this.selectedKeys.has(this.rowKey(row));
  }

  toggleRow(row: any): void {
    const key = this.rowKey(row);
    if (this.selectedKeys.has(key)) this.selectedKeys.delete(key);
    else this.selectedKeys.add(key);
  }

  get allSelected(): boolean {
    return this.rows.length > 0 && this.rows.every((r) => this.isSelected(r));
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.rows.forEach((r) => this.selectedKeys.delete(this.rowKey(r)));
    } else {
      this.rows.forEach((r) => this.selectedKeys.add(this.rowKey(r)));
    }
  }

  get selectedCount(): number {
    return this.selectedKeys.size;
  }

  /** Drop selections that are no longer on screen after a refresh. */
  private pruneSelection(): void {
    const visible = new Set(this.rows.map((r) => this.rowKey(r)));
    this.selectedKeys.forEach((k) => {
      if (!visible.has(k)) this.selectedKeys.delete(k);
    });
  }

  // ── Approve / Reject (single) ────────────────────────────────────────────────
  openDecision(row: any, decision: 'Approved' | 'Rejected'): void {
    this.decisionRow = row;
    this.decisionType = decision;
    this.decisionRemarks = '';
    this.isBulkDecision = false;
    this.modal.open(this.decisionModal, { centered: true });
  }

  openBulkDecision(decision: 'Approved' | 'Rejected'): void {
    if (this.selectedCount === 0) {
      this.appSettingService.showWarning('Please select at least one document.');
      return;
    }
    this.decisionRow = null;
    this.decisionType = decision;
    this.decisionRemarks = '';
    this.isBulkDecision = true;
    this.modal.open(this.decisionModal, { centered: true });
  }

  confirmDecision(modalRef: any): void {
    modalRef.close();
    if (this.isBulkDecision) this.runBulkDecision();
    else this.runSingleDecision();
  }

  private approvedBy(): string {
    return this.userData?.userEmail || this.userData?.userName || 'user';
  }

  private runSingleDecision(): void {
    const row = this.decisionRow;
    const payload = {
      UserMasterSid: this.userData?.UserMasterSid,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: row.MenuMasterSid,
      DocumentSid: row.DocumentSid,
      DepartmentMasterSid: row.DepartmentMasterSid || undefined,
      Remarks: this.decisionRemarks?.trim() || undefined,
      ApprovedBy: this.approvedBy(),
    };
    this.spinner.show();
    const call =
      this.decisionType === 'Approved'
        ? this.approvalService.approve(payload)
        : this.approvalService.reject(payload);
    call.subscribe({
      next: (resp) => {
        this.spinner.hide();
        if (resp?.status) {
          this.appSettingService.showSuccess(
            `Document ${this.decisionType === 'Approved' ? 'approved' : 'rejected'} successfully.`,
          );
          this.loadPending();
        } else {
          this.appSettingService.showError(resp?.message || 'Action failed.');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Decision error', err);
        this.appSettingService.showError('Action failed.');
      },
    });
  }

  private runBulkDecision(): void {
    const items = this.rows
      .filter((r) => this.isSelected(r))
      .map((r) => ({
        MenuMasterSid: r.MenuMasterSid,
        DocumentSid: r.DocumentSid,
        DepartmentMasterSid: r.DepartmentMasterSid || undefined,
      }));
    const payload = {
      UserMasterSid: this.userData?.UserMasterSid,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      items,
      Remarks: this.decisionRemarks?.trim() || undefined,
      ApprovedBy: this.approvedBy(),
    };
    this.spinner.show();
    const call =
      this.decisionType === 'Approved'
        ? this.approvalService.bulkApprove(payload)
        : this.approvalService.bulkReject(payload);
    call.subscribe({
      next: (resp) => {
        this.spinner.hide();
        if (resp?.status) {
          const data = resp.data || {};
          const ok = data.approvedCount ?? 0;
          const fail = data.failedCount ?? 0;
          if (fail > 0) {
            this.appSettingService.showWarning(`${ok} processed, ${fail} failed.`);
          } else {
            this.appSettingService.showSuccess(`${ok} document(s) processed successfully.`);
          }
          this.selectedKeys.clear();
          this.loadPending();
        } else {
          this.appSettingService.showError(resp?.message || 'Bulk action failed.');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Bulk decision error', err);
        this.appSettingService.showError('Bulk action failed.');
      },
    });
  }

  // ── View timeline ────────────────────────────────────────────────────────────
  openDetails(row: any): void {
    this.spinner.show();
    this.approvalService
      .getApprovalDetails(
        row.MenuMasterSid,
        row.DocumentSid,
        this.currentCompany?.CompanyMasterSid,
        this.currentBranch?.BranchMasterSid,
        row.DepartmentMasterSid || undefined,
      )
      .subscribe({
        next: (resp) => {
          this.spinner.hide();
          if (resp?.status) {
            this.detailLogs = resp.data?.logData || [];
            this.detailStatus = resp.data?.status || '';
            this.decisionRow = row;
            this.modal.open(this.detailsModal, { centered: true, size: 'lg' });
          } else {
            this.appSettingService.showError(resp?.message || 'Unable to load details.');
          }
        },
        error: (err) => {
          this.spinner.hide();
          console.error('Details error', err);
          this.appSettingService.showError('Unable to load details.');
        },
      });
  }

  goToLink(row: any): void {
    if (!row?.authorizeLink) return;
    sessionStorage.setItem('currentMenuId', String(row.MenuMasterSid));
    this.router.navigate([row.authorizeLink]);
  }

  // ── Report ───────────────────────────────────────────────────────────────────
  report(): void {
    const formatted = this.rows.map((r) => ({
      ...r,
      SubmittedDate: this.datePipe.transform(r.SubmittedDate),
    }));
    const companyName = this.currentCompany?.companyName ?? 'Company';
    this.excelReportService.exportAsExcel({
      data: formatted,
      headers: [
        { key: 'MenuName', label: 'Form Name' },
        { key: 'DocumentNo', label: 'Transaction Id' },
        { key: 'CustomerName', label: 'Customer Name' },
        { key: 'LocationName', label: 'Location' },
        { key: 'DepartmentName', label: 'Department' },
        { key: 'ApprovalLevel', label: 'Approval Level' },
        { key: 'SubmittedBy', label: 'Submitted By' },
        { key: 'SubmittedDate', label: 'Submitted Date' },
        { key: 'WaitingDays', label: 'Waiting Days' },
        { key: 'CurrentStatus', label: 'Status' },
      ],
      fileName: 'Authorization-Approval-Report',
      title: companyName,
    });
  }
}
