import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-voucher-period-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    CustomDatePipe,
    NgxSpinnerModule,
    PageHeaderComponent,
    NgSelectModule
  ],
  providers: [CustomDatePipe],
  templateUrl: './voucher-period-list.component.html',
  styleUrl: './voucher-period-list.component.scss'
})
export class VoucherPeriodListComponent extends BaseListComponent implements OnInit {
  isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  voucherPeriodList: any[] = [];
  searched = false;
  loading: boolean = false;
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  headerActions: HeaderAction[] = [];
  tableConfig: TableConfig;

  // Company and Branch
  currentCompany: any;
  currentBranch: any;

  // Year filter
  yearList: any[] = [];
  selectedYearMasterSid: number | null = null;

  // Expandable rows
  expandedRows: Set<number> = new Set();

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'voucher-period-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'PeriodName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  get allVoucherPeriod() { return this.allItems; }

  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    public mps: MenuPermissionService,
    private datePipe: CustomDatePipe,
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    this.loadYears();
    this.initializeHeaderActions();
    this.mps.init().subscribe(() => {
      this.initializeHeaderActions();
    });
    super.ngOnInit();
  }

  loadYears(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.masterService.getAllYears(CompanyMasterSid).subscribe(
      (resp: any) => {
        this.yearList = resp || [];
        // Select first year by default if available
        if (this.yearList.length > 0) {
          this.selectedYearMasterSid = this.yearList[0].YearMasterSid;
        }
      },
      (error) => {
        console.error('Error loading years:', error);
      }
    );
  }

  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchVoucherPeriodList(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams {
    return {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      yearMasterSid: this.selectedYearMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response.status) {
      this.allItems = response.data.items.map(item => ({
        ...item,
        statusDisplay: item.status === 'A' ? 'Active' : 'Suspended',
        StartDateDisplay: item.StartDate ? this.datePipe.transform(item.StartDate) : '',
        EndDateDisplay: item.EndDate ? this.datePipe.transform(item.EndDate) : '',
        YearName: item.yearMaster?.YearName || '',
        PeriodClosed: item.PeriodClosed || ((item.GLClosed === 'Y' && item.ARClosed === 'Y' && item.APClosed === 'Y') ? 'Y' : 'N')
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
      this.searched = true;
    } else {
      this.appSettingService.showError('Error searching Voucher Periods.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching Voucher Periods.');
    console.error('Error searching Voucher Periods', error);
    super.handleSearchError(error);
  }

  searchVoucherPeriods() {
    this.search();
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchVoucherPeriods();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilterValue();
  }

  onYearChange(): void {
    this.page = 1;
    this.searchVoucherPeriods();
  }

  initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Create',
        icon: 'fas fa-plus',
        action: 'create',
        disabled: !this.mps.can('insert')
      },
      {
        label: 'Report',
        icon: 'fas fa-file-alt',
        action: 'report',
        disabled: this.totalLengthOfCollection === 0
      },
      {
        label: 'Reset',
        icon: 'fas fa-sync-alt',
        action: 'reset'
      }
    ];
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.navigateToCreateVoucherPeriod();
        break;
      case 'report':
        this.report();
        break;
      case 'reset':
        this.resetPage();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'report') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 };
      }
      return action;
    });
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.VoucherPeriodSid || index;
  }

  viewVoucherPeriod(item: any): void {
    this.router.navigate(['master/voucher-period/entry', item.VoucherPeriodSid]);
  }

  // Expandable row methods
  toggleExpand(VoucherPeriodSid: number): void {
    if (this.expandedRows.has(VoucherPeriodSid)) {
      this.expandedRows.delete(VoucherPeriodSid);
    } else {
      this.expandedRows.add(VoucherPeriodSid);
    }
  }

  isExpanded(VoucherPeriodSid: number): boolean {
    return this.expandedRows.has(VoucherPeriodSid);
  }

  deleteVoucherPeriodByRow(row: any) {
    this.deleteVoucherPeriodById(row.VoucherPeriodSid);
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    console.log('Filters changed:', filters);
  }

  report(): void {
    const formattedData = this.allVoucherPeriod.map(item => ({
      PeriodName: item.PeriodName,
      PeriodCode: item.PeriodCode,
      YearName: item.YearName,
      StartDate: item.StartDateDisplay,
      EndDate: item.EndDateDisplay,
      Remarks: item.Remarks,
      Status: item.statusDisplay,
      GLClosed: item.GLClosed,
      ARClosed: item.ARClosed,
      APClosed: item.APClosed,
      PeriodClosed: item.PeriodClosed,
      GLGraceDays: item.GLGraceDays,
      ARGraceDays: item.ARGraceDays,
      APGraceDays: item.APGraceDays
    }));
    const companyName = this.currentCompany?.companyName ?? 'Company';

    const dynamicHeaders = [
      { key: 'PeriodName', label: 'Period Name' },
      { key: 'PeriodCode', label: 'Period Code' },
      { key: 'YearName', label: 'Year' },
      { key: 'StartDate', label: 'Start Date' },
      { key: 'EndDate', label: 'End Date' },
      { key: 'Remarks', label: 'Remarks' },
      { key: 'Status', label: 'Status' },
      { key: 'GLClosed', label: 'GL Closed' },
      { key: 'ARClosed', label: 'AR Closed' },
      { key: 'APClosed', label: 'AP Closed' },
      { key: 'PeriodClosed', label: 'Period Closed' },
      { key: 'GLGraceDays', label: 'GL Grace Days' },
      { key: 'ARGraceDays', label: 'AR Grace Days' },
      { key: 'APGraceDays', label: 'AP Grace Days' }
    ];

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'VoucherPeriod-Report',
      title: companyName
    });
  }

  deleteVoucherPeriodById(VoucherPeriodSid: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteVoucherPeriodById(VoucherPeriodSid).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Deleted successfully!");
            this.searchVoucherPeriods();
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  // Block/Unblock status toggle
  toggleBlockStatus(item: any): void {
    const newStatus = item.status === 'A' ? 'S' : 'A';
    const payload = { status: newStatus };

    this.masterService.updateVoucherPeriodById(item.VoucherPeriodSid, payload).subscribe({
      next: (resp: any) => {
        const statusText = newStatus === 'A' ? 'Activated' : 'Blocked';
        this.appSettingService.showSuccess(`Period ${statusText} successfully!`);
        this.searchVoucherPeriods();
      },
      error: (err) => {
        console.error('Status update error:', err);
        this.appSettingService.showError('Failed to update status');
      }
    });
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  navigateToCreateVoucherPeriod() {
    this.router.navigate(['master/voucher-period/entry']);
  }

  updatePaginatedData(): void {
    this.searchVoucherPeriods();
  }

  trackByIndex(index: number, item: any): number {
    return item.VoucherPeriodSid || index;
  }
}
