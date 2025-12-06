import { Component, OnInit } from '@angular/core';
import {
  ActivityAllocationService,
  ResourceSummaryRow,
  SummaryMode
} from './activity-allocation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

type SummarySortColumn =
  | 'userName'
  | 'rateRequestCount'
  | 'quotationCount'
  | 'bookingCount'
  | 'loadPlanCount'
  | 'masterJobCount'
  | 'jobCount'
  | 'blCount'
  | 'siCount'
  | 'invoiceCount'
  | 'total';

@Component({
  selector: 'app-activity-allocation',
  templateUrl: './activity-allocation.component.html',
  styleUrls: ['./activity-allocation.component.scss']
})
export class ActivityAllocationComponent implements OnInit {
  mode: SummaryMode = 'Pending';
  rows: ResourceSummaryRow[] = [];
  displayRows: (ResourceSummaryRow & { total: number })[] = [];

  isLoading = false;
  error: string | null = null;

  sortColumn: SummarySortColumn = 'userName';
  sortDirection: 'asc' | 'desc' = 'asc';

  searchText = '';

  constructor(
    private activityService: ActivityAllocationService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const qpMode = (params['mode'] as SummaryMode) || this.mode;
      this.mode = qpMode;
      this.loadSummary();
    });
  }


  onModeChange(newMode: SummaryMode): void {
    if (this.mode === newMode) return;
    this.mode = newMode;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: this.mode },
      queryParamsHandling: 'merge'
    });

    this.loadSummary();
  }

  changeMode(mode: SummaryMode): void {
    this.onModeChange(mode);
  }


  loadSummary(): void {
    this.isLoading = true;
    this.error = null;

    console.log('🔍 Loading summary with mode:', this.mode);

    this.activityService.getResourceSummary(this.mode).subscribe({
      next: (data) => {
        console.log('✅ API returned', data.length, 'rows for mode', this.mode);
        this.rows = data;
        this.applySortingAndFiltering();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading Resource Summary:', err);
        this.rows = [];
        this.displayRows = [];
        this.error = 'Failed to load Resource Summary';
        this.isLoading = false;
        this.appSettingService.showError(
          'Failed to load Activity Allocation summary.'
        );
      }
    });
  }


  getTotal(row: ResourceSummaryRow): number {
    return (
      row.rateRequestCount +
      row.quotationCount +
      row.bookingCount +
      row.loadPlanCount +
      row.masterJobCount +
      row.jobCount +
      row.blCount +
      row.siCount +
      row.invoiceCount
    );
  }

  getTotalUsers(): number {
    return this.rows.length;
  }

  getUsersInCurrentMode(): number {
    return this.displayRows.length;
  }

  getTotalActivitiesInMode(): number {
    return this.displayRows.reduce((sum, r) => sum + r.total, 0);
  }

  getTotalPending(): number {
    if (this.mode !== 'Pending') return 0;
    return this.getTotalActivitiesInMode();
  }

  getTotalProcessed(): number {
    if (this.mode !== 'Processed') return 0;
    return this.getTotalActivitiesInMode();
  }

  getGrandTotal(): number {
    return this.getTotalActivitiesInMode();
  }


  changeSort(column: SummarySortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySortingAndFiltering();
  }

  onSearchTextChange(): void {
    this.applySortingAndFiltering();
  }

  private applySortingAndFiltering(): void {
    const search = this.searchText.trim().toLowerCase();

    let filtered = this.rows;


    if (search) {
      filtered = filtered.filter((r) => {
        const values = [
          r.userName,
          r.rateRequestCount,
          r.quotationCount,
          r.bookingCount,
          r.loadPlanCount,
          r.masterJobCount,
          r.jobCount,
          r.blCount,
          r.siCount,
          r.invoiceCount
        ];
        return values
          .map((v) => String(v ?? '').toLowerCase())
          .some((v) => v.includes(search));
      });
    }

    const rowsWithTotal = filtered.map((r) => ({
      ...r,
      total: this.getTotal(r)
    }));

    rowsWithTotal.sort((a: any, b: any) => {
      const col = this.sortColumn;
      let av = a[col];
      let bv = b[col];

      if (col === 'userName') {
        av = String(av);
        bv = String(bv);
        const cmp = av.localeCompare(bv);
        return this.sortDirection === 'asc' ? cmp : -cmp;
      }

      av = Number(av) || 0;
      bv = Number(bv) || 0;
      const cmp = av - bv;
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    this.displayRows = rowsWithTotal;
  }


  openWorkload(stage: string, row: ResourceSummaryRow): void {
    if (!row.userSid) return;

    this.router.navigate(['/crm/activity-allocation/entry'], {
      queryParams: {
        userSid: row.userSid,
        userName: row.userName,
        stage: stage,
        mode: this.mode
      }
    });
  }

  private getDefaultStageForRow(row: ResourceSummaryRow): string {
    if (row.quotationCount > 0) return 'Quotation';
    if (row.bookingCount > 0) return 'Booking';
    if (row.rateRequestCount > 0) return 'RateRequest';
    if (row.loadPlanCount > 0) return 'LoadPlan';
    if (row.masterJobCount > 0) return 'MasterJob';
    if (row.jobCount > 0) return 'Job';
    if (row.blCount > 0) return 'BL';
    if (row.siCount > 0) return 'SI';
    if (row.invoiceCount > 0) return 'Invoice';
    return 'Quotation';
  }

  openUserWorkload(row: ResourceSummaryRow): void {
    const stage = this.getDefaultStageForRow(row);
    this.openWorkload(stage, row);
  }


  onReportClick(): void {
    if (!this.displayRows.length) {
      this.appSettingService.showWarning('No data available to export.');
      return;
    }

    const header = [
      'User Name',
      'Rate Request',
      'Quotation',
      'Booking',
      'Load Plan',
      'Master Job',
      'Job',
      'BL',
      'SI',
      'Invoice',
      'Total'
    ];
    const rows = this.displayRows.map((r) => [
      r.userName,
      r.rateRequestCount,
      r.quotationCount,
      r.bookingCount,
      r.loadPlanCount,
      r.masterJobCount,
      r.jobCount,
      r.blCount,
      r.siCount,
      r.invoiceCount,
      r.total
    ]);

    const csvLines = [header.join(','), ...rows.map((row) => row.join(','))];
    const csvContent = csvLines.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `activity-allocation-${this.mode.toLowerCase()}-${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.appSettingService.showSuccess(
      'Activity Allocation summary exported successfully.'
    );
  }

  onResetClick(): void {
    this.mode = 'Pending';
    this.sortColumn = 'userName';
    this.sortDirection = 'asc';
    this.searchText = '';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: this.mode },
      queryParamsHandling: 'merge'
    });

    this.loadSummary();
  }


  getBadgeClass(): string {
    switch (this.mode) {
      case 'Pending':
        return 'badge-warning';
      case 'Processed':
        return 'badge-success';
      case 'All':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  getSortIcon(column: SummarySortColumn): string {
    if (this.sortColumn !== column) {
      return 'fa-sort text-muted';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }
}
