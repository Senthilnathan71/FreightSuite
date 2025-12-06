import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import {
  ActivityAllocationService,
  Stage,
  SummaryMode,
  WorkloadRow,
  AllocateUser
} from '../activity-allocation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-activity-allocation-entry',
  templateUrl: './activity-allocation-entry.component.html',
  styleUrls: ['./activity-allocation-entry.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class ActivityAllocationEntryComponent implements OnInit, OnDestroy {
  userSid = 0;
  userName = '';
  stage: Stage = 'RateRequest' as Stage;
  mode: SummaryMode = 'Pending' as SummaryMode;

  rows: WorkloadRow[] = [];
  allocateUsers: AllocateUser[] = [];

  filterValue = '';
  isLoading = false;
  isBulkAllocating = false;
  isExporting = false;
  error: string | null = null;
  successMessage: string | null = null;
  lastRefreshed: Date | null = null;
  showAdvancedFilters = false;
  showKeyboardHints = false;

  selectedUserByActivityId: { [activityId: number]: number | null } = {};
  selectedActivityIds = new Set<number>();
  bulkSelectedUserSid: number | null = null;

  sortColumn: keyof WorkloadRow = 'etd';
  sortOrder: 'asc' | 'desc' = 'asc';

  advancedFilters = {
    etdStatus: '',
    status: '',
    customer: '',
    salesPerson: ''
  };

  visibleColumns = {
    customerService: true,
    documentation: true
  };

  selectedRowForDetail: WorkloadRow | null = null;

  private successTimeout: any;
  private modalInstance: bootstrap.Modal | null = null;

  @ViewChild('searchBox') searchBoxRef!: ElementRef<HTMLInputElement>;
  @ViewChild('detailModal') detailModalRef!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityAllocationService,
    private appSettingService: AppSettingsService
  ) {}

  ngOnInit(): void {
    this.loadColumnPreferences();
    
    this.route.queryParams.subscribe(params => {
      this.userSid = Number(params['userSid'] || 0);
      this.userName = params['userName'] || '';
      this.stage = (params['stage'] as Stage) || ('RateRequest' as Stage);
      this.mode = (params['mode'] as SummaryMode) || ('Pending' as SummaryMode);
      this.loadData();
    });

    setTimeout(() => {
      this.showKeyboardHints = true;
      setTimeout(() => {
        this.showKeyboardHints = false;
      }, 10000);
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    if (this.modalInstance) {
      this.modalInstance.dispose();
    }
  }

  private loadData(): void {
    if (!this.userSid) {
      this.rows = [];
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;
    this.selectedUserByActivityId = {};
    this.selectedActivityIds.clear();
    this.lastRefreshed = null;

    this.activityService
      .getWorkloadDetails(this.userSid, this.stage, this.mode)
      .subscribe({
        next: res => {
          this.rows = res.data || [];
          this.allocateUsers = res.availableUsers || [];

          if (!this.userName && this.rows.length > 0) {
            this.userName = this.rows[0].userName || this.userName;
          }

          for (const row of this.rows) {
            this.selectedUserByActivityId[row.activityId] = this.userSid || null;
          }

          this.lastRefreshed = new Date();
          this.isLoading = false;
        },
        error: err => {
          console.error('Error loading workload details', err);
          this.rows = [];
          this.allocateUsers = [];
          this.error =
            err?.error?.message || 'Failed to load workload details';
          this.isLoading = false;
          this.appSettingService.showError(
            'Failed to load Activity Allocation workload details.'
          );
        }
      });
  }

  onRetry(): void {
    this.loadData();
  }

  onSearchClick(): void {
  }

  onSearchInput(): void {
  }

  clearSearch(): void {
    this.filterValue = '';
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  applyAdvancedFilters(): void {
  }

  hasAdvancedFilters(): boolean {
    return !!(
      this.advancedFilters.etdStatus ||
      this.advancedFilters.status ||
      this.advancedFilters.customer ||
      this.advancedFilters.salesPerson
    );
  }

  onResetClick(): void {
    this.filterValue = '';
    this.sortColumn = 'etd';
    this.sortOrder = 'asc';
    this.selectedActivityIds.clear();
    this.bulkSelectedUserSid = null;
    this.advancedFilters = {
      etdStatus: '',
      status: '',
      customer: '',
      salesPerson: ''
    };
  }

  onExportClick(): void {
    if (!this.rows || this.rows.length === 0) {
      this.appSettingService.showWarning('No activities to export.');
      return;
    }

    this.isExporting = true;
    try {
      const dataToExport = this.sortedAndFilteredRows;
      const exportRows = dataToExport.map(r => ({
        QuotationNo: r.quotationNo || '',
        BookingNo: r.bookingNo || '',
        Customer: r.customerName || '',
        SalesPerson: r.salesPersonName || '',
        CustomerService: r.customerServiceName || '',
        Documentation: r.documentationName || '',
        ETD: r.etd ? new Date(r.etd).toISOString().slice(0, 10) : '',
        Status: r.status || '',
        BookingStatus: this.getBookingStatusLabel(r),
        EtdLabel: this.getEtdLabel(r)
      }));

      console.table(exportRows);
      this.appSettingService.showSuccess(
        `Exported ${exportRows.length} activities successfully.`
      );
    } catch (e) {
      console.error('Export error', e);
      this.appSettingService.showError('Failed to export activities.');
    } finally {
      this.isExporting = false;
    }
  }

  exportSelected(): void {
    if (this.selectedActivityIds.size === 0) {
      this.appSettingService.showWarning('No activities selected.');
      return;
    }

    const selectedRows = this.sortedAndFilteredRows.filter(r =>
      this.selectedActivityIds.has(r.activityId)
    );

    console.log('Exporting selected rows:', selectedRows);
    this.appSettingService.showSuccess(
      `Exported ${selectedRows.length} selected activities.`
    );
  }

  exportSingleRow(row: WorkloadRow): void {
    console.log('Exporting single row:', row);
    this.appSettingService.showSuccess('Row exported successfully.');
  }

  printSelected(): void {
    if (this.selectedActivityIds.size === 0) {
      this.appSettingService.showWarning('No activities selected.');
      return;
    }

    window.print();
  }

  goBack(): void {
    this.router.navigate(['crm/activity-allocation'], {
      queryParams: { refresh: 1, mode: this.mode }
    });
  }

  get uniqueCustomers(): string[] {
    const customers = this.rows
      .map(r => r.customerName)
      .filter(Boolean) as string[];
    return [...new Set(customers)].sort();
  }

  get uniqueSalesPersons(): string[] {
    const salesPersons = this.rows
      .map(r => r.salesPersonName)
      .filter(Boolean) as string[];
    return [...new Set(salesPersons)].sort();
  }

  get sortedAndFilteredRows(): WorkloadRow[] {
    if (!this.rows.length) return [];

    const term = this.filterValue?.toLowerCase() || '';
    let data = this.rows;

    if (term) {
      data = data.filter(r => {
        const q = (r.quotationNo || '').toLowerCase();
        const b = (r.bookingNo || '').toLowerCase();
        const c = (r.customerName || '').toLowerCase();
        const s = (r.salesPersonName || '').toLowerCase();
        return (
          q.includes(term) ||
          b.includes(term) ||
          c.includes(term) ||
          s.includes(term)
        );
      });
    }

    if (this.advancedFilters.status) {
      data = data.filter(r => r.status === this.advancedFilters.status);
    }

    if (this.advancedFilters.customer) {
      data = data.filter(r => r.customerName === this.advancedFilters.customer);
    }

    if (this.advancedFilters.salesPerson) {
      data = data.filter(
        r => r.salesPersonName === this.advancedFilters.salesPerson
      );
    }

    if (this.advancedFilters.etdStatus) {
      data = data.filter(r => {
        const status = this.getEtdFilterStatus(r);
        return status === this.advancedFilters.etdStatus;
      });
    }

    return [...data].sort((a, b) => {
      const aVal: any = a[this.sortColumn];
      const bVal: any = b[this.sortColumn];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (
        this.sortColumn === 'etd' ||
        this.sortColumn === 'createdOn' ||
        this.sortColumn === 'updatedOn'
      ) {
        const aDate = new Date(aVal as any).getTime();
        const bDate = new Date(bVal as any).getTime();
        return this.sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
        return this.sortOrder === 'asc' ? cmp : -cmp;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return this.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }

  private getEtdFilterStatus(row: WorkloadRow): string {
    if (!row.etd) return '';
    
    const etdDate = new Date(row.etd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    etdDate.setHours(0, 0, 0, 0);

    const diffMs = etdDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 7) return 'thisWeek';
    return 'upcoming';
  }

  sortBy(column: keyof WorkloadRow): void {
    if (this.sortColumn === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortOrder = 'asc';
    }
  }

  getSortIconClass(column: keyof WorkloadRow): string {
    if (this.sortColumn !== column) return 'fas fa-sort';
    return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  get allSelected(): boolean {
    return (
      this.sortedAndFilteredRows.length > 0 &&
      this.sortedAndFilteredRows.every(r =>
        this.selectedActivityIds.has(r.activityId)
      )
    );
  }

  get isPartiallySelected(): boolean {
    return this.selectedActivityIds.size > 0 && !this.allSelected;
  }

  toggleRowSelection(row: WorkloadRow, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.selectedActivityIds.add(row.activityId);
    else this.selectedActivityIds.delete(row.activityId);
  }

  toggleRowSelectionByRow(row: WorkloadRow): void {
    if (this.selectedActivityIds.has(row.activityId)) {
      this.selectedActivityIds.delete(row.activityId);
    } else {
      this.selectedActivityIds.add(row.activityId);
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedActivityIds.clear();
    if (checked) {
      for (const row of this.sortedAndFilteredRows) {
        this.selectedActivityIds.add(row.activityId);
      }
    }
  }

  onRowKeyToggle(row: WorkloadRow): void {
    this.toggleRowSelectionByRow(row);
  }

  async onAllocate(row: WorkloadRow): Promise<void> {
    this.successMessage = null;
    this.error = null;
    clearTimeout(this.successTimeout);

    const selectedUserSid = this.selectedUserByActivityId[row.activityId] ?? null;
    if (!selectedUserSid) {
      const msg = 'Please select a user before allocating.';
      this.error = msg;
      this.appSettingService.showWarning(msg);
      return;
    }

    const targetUser = this.allocateUsers.find(
      u => u.userSid === selectedUserSid
    );

    const result = await Swal.fire({
      title: 'Confirm Allocation',
      html: `
        <p>Allocate activity to</p>
        <p class="text-primary fs-5">
          <strong>${targetUser?.userName || 'Unknown User'}</strong>
        </p>
        <p class="text-muted small">
          Activity: ${row.bookingNo || row.quotationNo || 'N/A'}
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Allocate',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0056b3',
      cancelButtonColor: '#6c757d'
    });

    if (!result.isConfirmed) return;

    this.activityService.allocate(row.activityId, selectedUserSid).subscribe({
      next: res => {
        if (!res.success) {
          const msg = res.message || 'Failed to allocate activity.';
          this.error = msg;
          this.appSettingService.showError(msg);
          return;
        }

        if (this.mode === 'Pending') {
          this.rows = this.rows.filter(r => r.activityId !== row.activityId);
          this.selectedActivityIds.delete(row.activityId);
        } else {
          row.status = 'Processed';
        }

        this.successMessage =
          res.message || 'Activity allocated successfully.';
        this.appSettingService.showSuccess(this.successMessage);
        this.successTimeout = setTimeout(
          () => (this.successMessage = null),
          4000
        );
        this.lastRefreshed = new Date();
      },
      error: err => {
        console.error('Error allocating activity', err);
        let msg = 'Failed to allocate activity.';
        if (err.status === 400) msg = err.error?.message || 'Invalid request.';
        else if (err.status === 401)
          msg = 'Unauthorized - please login again.';
        else if (err.status === 500)
          msg = 'Server error - please try again.';
        this.error = msg;
        this.appSettingService.showError(msg);
      }
    });
  }

  async onBulkAllocate(): Promise<void> {
    this.successMessage = null;
    this.error = null;
    clearTimeout(this.successTimeout);

    if (!this.bulkSelectedUserSid) {
      const msg = 'Please select a user for bulk allocation.';
      this.error = msg;
      this.appSettingService.showWarning(msg);
      return;
    }

    if (this.selectedActivityIds.size === 0) {
      const msg = 'Please select at least one activity to allocate.';
      this.error = msg;
      this.appSettingService.showWarning(msg);
      return;
    }

    const rowsToAllocate = this.sortedAndFilteredRows.filter(r =>
      this.selectedActivityIds.has(r.activityId)
    );
    const targetUser = this.allocateUsers.find(
      u => u.userSid === this.bulkSelectedUserSid
    );

    const result = await Swal.fire({
      title: 'Confirm Bulk Allocation',
      html: `
        <p>You are about to allocate <strong>${
          rowsToAllocate.length
        }</strong> activities to</p>
        <p class="text-primary fs-5">
          <strong>${targetUser?.userName || 'Unknown User'}</strong>
        </p>
        <p class="text-muted small">This action cannot be undone.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Allocate All',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0056b3',
      cancelButtonColor: '#6c757d'
    });

    if (!result.isConfirmed) return;
    if (!rowsToAllocate.length) return;

    this.isBulkAllocating = true;
    let completed = 0;
    let failures = 0;

    rowsToAllocate.forEach(row => {
      this.activityService
        .allocate(row.activityId, this.bulkSelectedUserSid as number)
        .subscribe({
          next: res => {
            if (!res.success) {
              failures++;
            } else {
              if (this.mode === 'Pending') {
                this.rows = this.rows.filter(
                  r => r.activityId !== row.activityId
                );
              } else {
                row.status = 'Processed';
              }
              this.selectedActivityIds.delete(row.activityId);
            }
            completed++;
            if (completed === rowsToAllocate.length) {
              this.finishBulk(failures, rowsToAllocate.length);
            }
          },
          error: err => {
            console.error('Bulk allocation item error', err);
            failures++;
            completed++;
            if (completed === rowsToAllocate.length) {
              this.finishBulk(failures, rowsToAllocate.length);
            }
          }
        });
    });
  }

  private finishBulk(failures: number, total: number): void {
    this.isBulkAllocating = false;

    if (failures === 0) {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `${total} activities allocated successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Partial Failure',
        text: `${total - failures} succeeded, ${failures} failed`
      });
    }

    this.selectedActivityIds.clear();
    this.bulkSelectedUserSid = null;
    this.lastRefreshed = new Date();
  }

  openDetailModal(row: WorkloadRow): void {
    this.selectedRowForDetail = row;
    
    if (!this.modalInstance && this.detailModalRef) {
      this.modalInstance = new bootstrap.Modal(this.detailModalRef.nativeElement);
    }
    
    this.modalInstance?.show();
  }

  copyAllDetails(): void {
    if (!this.selectedRowForDetail) return;

    const details = `
Activity Details:
-----------------
Quotation No: ${this.selectedRowForDetail.quotationNo || 'N/A'}
Booking No: ${this.selectedRowForDetail.bookingNo || 'N/A'}
Customer: ${this.selectedRowForDetail.customerName || 'N/A'}
Sales Person: ${this.selectedRowForDetail.salesPersonName || 'N/A'}
ETD: ${this.selectedRowForDetail.etd}
Status: ${this.selectedRowForDetail.status || 'Pending'}
    `.trim();

    navigator.clipboard.writeText(details).then(() => {
      this.appSettingService.showSuccess('Details copied to clipboard!');
    });
  }

  copyQuotationNumber(row: WorkloadRow): void {
    if (row.quotationNo) {
      navigator.clipboard.writeText(row.quotationNo).then(() => {
        this.appSettingService.showSuccess('Quotation number copied!');
      });
    }
  }

  viewInBooking(row: WorkloadRow): void {
    if (row.bookingNo) {
      this.router.navigate(['/crm/booking', row.bookingNo]);
    }
  }

  viewActivityHistory(row: WorkloadRow): void {
    console.log('View history for:', row);
    this.appSettingService.showInfo('Activity history feature coming soon!');
  }

  getProcessedCount(): number {
    return this.rows.filter(r => r.status === 'Processed').length;
  }

  getOverdueCount(): number {
    return this.rows.filter(r => this.isOverdue(r)).length;
  }

  isOverdue(row: WorkloadRow): boolean {
    if (!row.etd || row.status === 'Processed') return false;
    
    try {
      const etdDate = new Date(row.etd);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      etdDate.setHours(0, 0, 0, 0);
      
      return etdDate < today;
    } catch {
      return false;
    }
  }

  getEtdLabel(row: WorkloadRow): string {
    try {
      if (!row.etd) return 'No ETD';
      const etdDate = new Date(row.etd);
      if (isNaN(etdDate.getTime())) return 'Invalid Date';

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      etdDate.setHours(0, 0, 0, 0);

      const diffMs = etdDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (row.status !== 'Processed' && diffDays < 0) return 'Overdue';
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
      return `${diffDays} days`;
    } catch {
      return 'Unknown';
    }
  }

  getEtdBadgeClass(row: WorkloadRow): string {
    try {
      if (!row.etd) return 'badge-unknown';

      const etdDate = new Date(row.etd);
      if (isNaN(etdDate.getTime())) return 'badge-unknown';

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      etdDate.setHours(0, 0, 0, 0);

      const diffMs = etdDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (row.status !== 'Processed' && diffDays <= 0) return 'badge-danger';
      if (diffDays <= 7) return 'badge-warning';
      return 'badge-success';
    } catch {
      return 'badge-unknown';
    }
  }

  getEtdIconClass(row: WorkloadRow): string {
    const badgeClass = this.getEtdBadgeClass(row);
    return (
      {
        'badge-danger': 'fas fa-exclamation-circle',
        'badge-warning': 'fas fa-exclamation-triangle',
        'badge-success': 'fas fa-check-circle',
        'badge-unknown': 'fas fa-question-circle'
      }[badgeClass] || 'fas fa-info-circle'
    );
  }

  getBookingStatusLabel(row: WorkloadRow): string {
    return row.bookingNo ? row.bookingNo : 'Not Created';
  }

  getBookingStatusClass(row: WorkloadRow): string {
    return row.bookingNo ? 'badge-success' : 'badge-danger';
  }

  isBookingCreated(row: WorkloadRow): boolean {
    return !!row.bookingNo;
  }

  loadColumnPreferences(): void {
    const saved = localStorage.getItem('workload-column-visibility');
    if (saved) {
      this.visibleColumns = JSON.parse(saved);
    }
  }

  saveColumnPreferences(): void {
    localStorage.setItem(
      'workload-column-visibility',
      JSON.stringify(this.visibleColumns)
    );
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      if (event.key === 'Escape') {
        (target as HTMLInputElement).blur();
        this.selectedActivityIds.clear();
      }
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'a':
          event.preventDefault();
          this.selectAllRows();
          break;
        case 'd':
          event.preventDefault();
          this.deselectAllRows();
          break;
        case 'e':
          event.preventDefault();
          this.onExportClick();
          break;
        case 'f':
          event.preventDefault();
          this.focusSearch();
          break;
        case 'r':
          event.preventDefault();
          this.onRetry();
          break;
        case 'p':
          event.preventDefault();
          this.printSelected();
          break;
      }
    } else if (event.key === 'Escape') {
      this.selectedActivityIds.clear();
      this.clearSearch();
    }
  }

  private selectAllRows(): void {
    this.selectedActivityIds.clear();
    for (const row of this.sortedAndFilteredRows) {
      this.selectedActivityIds.add(row.activityId);
    }
  }

  private deselectAllRows(): void {
    this.selectedActivityIds.clear();
  }

  private focusSearch(): void {
    if (this.searchBoxRef?.nativeElement) {
      this.searchBoxRef.nativeElement.focus();
      this.searchBoxRef.nativeElement.select();
    }
  }
}
