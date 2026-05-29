import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AccountsService } from '../../accounts.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { VoucherActionGuardService } from 'src/app/shared/services/voucher-action-guard.service';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  DropdownFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';
import { getFinancialYearDateRangeBounds, getFinancialYearPresetDateRange } from 'src/app/common/helper';

@Component({
  selector: 'app-voucher-matching-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FeatherModule,
    NgbPaginationModule,
    ListpageComponent,
    FavoriteStarComponent,
    MatDialogModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent,
    CustomDatePipe
  ],
   providers: [CustomDatePipe],
  templateUrl: './voucher-matching-list.component.html',
  styles: ``
})
export class VoucherMatchingListComponent  extends BaseListComponent implements OnInit{
  @ViewChild('voucherMatchingTable') voucherMatchingTable!: ReusableTableComponent;
  results: any[] = [];
  voucherList: any[] = [];
  companyMap: { [id: number]: string } = {};
  userData: any;
  loading = false;
  isFavorite: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};

  // Company & Branch
  currentCompany: any;
  currentBranch: any;

  tableConfig: TableConfig;
  dateRangeConfig: DateRangeConfig;
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [{ label: 'Matching Date', value: 'VoucherMatchingDate' }],
    defaultValue: 'VoucherMatchingDate'
  };
  subledgerFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'SubledgerName',
    options: [],
    bindLabel: 'SubledgerName',
    bindValue: 'SubledgerName'
  };
  currentFilters: AdvancedFilterValues = {};

  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  tableLoading = false;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  protected config: ListComponentConfig = {
    storageKey: '',
    defaultPageSize: 10,
    defaultSortColumn: 'VoucherMatchingHeaderSid',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with template
  get allVoucher() { return this.allItems; }

  constructor(
    private mps : MenuPermissionService,
    private accountService : AccountsService,
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe,
    private voucherActionGuard: VoucherActionGuardService,
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();

    this.userData = userProfile;

    const fy = this.appSettingService.getCurrentFinancialYear();
    const dateRangeBounds = getFinancialYearDateRangeBounds(fy);
    this.dateRangeConfig = {
      enabled: true,
      defaultPreset: 'last30',
      minDate: dateRangeBounds.minDate,
      maxDate: dateRangeBounds.maxDate,
    };

    this.initializeHeaderActions();
    this.initializeTableConfig();
    this.mps.init().subscribe(()=>{
      this.initializeHeaderActions();
      this.initializeTableConfig();
    })
    this.currentFilters = this.getDefaultFilters();
    this.loadSubledgerOptions();
    super.ngOnInit();
  }


  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.accountService.searchVoucherMatching(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams & Record<string, any> {
    const params: SearchParams & Record<string, any> = {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    if (this.currentFilters.dateRange?.fromDate) {
      params['dateFrom'] = this.currentFilters.dateRange.fromDate;
    }
    if (this.currentFilters.dateRange?.toDate) {
      params['dateTo'] = this.currentFilters.dateRange.toDate;
    }
    if (this.currentFilters.dateType) {
      params['dateField'] = this.currentFilters.dateType;
    }
    if (this.currentFilters.pol) {
      params['SubledgerName'] = this.currentFilters.pol;
      params['subledgerName'] = this.currentFilters.pol;
    }

    if (!this.hasExplicitDateRange()) {
      const currentYear = this.appSettingService.getCurrentFinancialYear();
      if (currentYear?.YearMasterSid) {
        params['YearMasterSid'] = currentYear.YearMasterSid;
      }
    }

    return params;
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();

    // Handle both array response and paginated response
    if(response.status){
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
      this.updateSubledgerOptions(rawItems);
      this.allItems = rawItems.map(item => ({
        ...item,
        VoucherMatchingDateRaw: item?.VoucherMatchingDate,
        VoucherMatchingDate:this.datePipe.transform(item?.VoucherMatchingDate),
        Status: item.Status === 'A' ? 'Active' : 'Suspended',
      }));
      this.totalLengthOfCollection = response?.data?.totalCount || rawItems.length || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching voucher matching.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching Voucher Matching.');
    console.error('Error searching voucher matching', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadVoucherMatching();
  }

  loadVoucherMatching(){
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = this.getDefaultFilters();
    this.clearFilterValue();
  }

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.VoucherMatchingHeaderSid || index;
  }

  initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Create',
        icon: 'fas fa-plus',
        action: 'create',
        disabled : !this.mps.can('insert')
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

  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'VoucherMatchingNo',
          label: 'Matching No.',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
         
        },
        {
          key: 'VoucherMatchingDate',
          label: 'Matching Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
        },
        {
          key: 'Narration',
          label: 'Narration',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
        },
        {
          key: 'SubledgerName',
          label: 'Subledger',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
        
        },
        {
          key: 'Status',
          label: 'Status',
          sortable: true,
          filterable: true,
          visible: true,
          template: 'status',
          width: '70px',
          dataType: 'string',
          cellClass: 'status-column'
        },
      ],
      actions: [
        {
          icon: 'fas fa-eye',
          label: 'View',
          action: 'view',
          tooltip: 'View Voucher Matching',
          state: !this.mps.can('view')
        },
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'VoucherMatchingHeaderSid',
      emptyMessage: 'No Voucher Matching found',
      dragAndDrop: true
    };
  }

  initializeModalDropdownItems(): void {
    this.modalDropdownItems = [
      {
        label: 'Print',
        icon: 'fas fa-print',
        action: 'print',
        condition: true
      },
      {
        label: 'Email',
        icon: 'fas fa-envelope',
        action: 'email',
        condition: this.mps.has('email')
      }
    ];
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.navigateToCreate();
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

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewVoucherMatching(event.row);
    }
  }

  viewVoucherMatching(row: any) {
    this.router.navigate(['accounts/voucher-matching/entry/', row.VoucherMatchingHeaderSid]);
  }


  onTableRowClick(row: any): void {
    // Row clicking handled by table component
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
    const formattedData = this.allVoucher;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns from table
    const visibleColumns = this.voucherMatchingTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Voucher-Matching-Report',
      title: companyName
    });
  }



  updatePaginatedData(): void {
    this.loadVoucherMatching();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  navigateToCreate() {
    const blockedReason = this.voucherActionGuard.getInsertBlockedReason({
      documentName: 'Voucher Matching',
      canInsert: this.mps.can('insert')
    });
    if (this.voucherActionGuard.block(blockedReason)) return;

    this.router.navigate(['accounts/voucher-matching/entry']);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
  }

  private updateSubledgerOptions(items: any[]): void {
    const subledgers = Array.from(
      new Map(
        (items || [])
          .map((item: any) => ({ SubledgerName: item?.SubledgerName ?? '' }))
          .filter((x: any) => !!x.SubledgerName)
          .map((x: any) => [x.SubledgerName, x])
      ).values()
    );
    const existing = Array.isArray(this.subledgerFilterConfig.options) ? this.subledgerFilterConfig.options : [];
    const merged = Array.from(
      new Map([...existing, ...subledgers].map((x: any) => [x.SubledgerName, x])).values()
    );
    this.subledgerFilterConfig = { ...this.subledgerFilterConfig, options: merged };
  }

  private loadSubledgerOptions(): void {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!companyMasterSid) {
      this.subledgerFilterConfig = { ...this.subledgerFilterConfig, options: [] };
      return;
    }
    forkJoin({
      customers: this.masterService.getSubledgerMasterByType('Customer', companyMasterSid).pipe(catchError(() => of({ data: [] }))),
      charges: this.masterService.getSubledgerMasterByType('Charge', companyMasterSid).pipe(catchError(() => of({ data: [] }))),
      taxes: this.masterService.getSubledgerMasterByType('Tax', companyMasterSid).pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: ({ customers, charges, taxes }: any) => {
        const rows = [
          ...(Array.isArray(customers?.data) ? customers.data : []),
          ...(Array.isArray(charges?.data) ? charges.data : []),
          ...(Array.isArray(taxes?.data) ? taxes.data : [])
        ];
        const subledgers = Array.from(
          new Map(
            rows
              .map((row: any) => ({ SubledgerName: row?.SubledgerName ?? '' }))
              .filter((x: any) => !!x.SubledgerName)
              .map((x: any) => [x.SubledgerName, x])
          ).values()
        );
        this.subledgerFilterConfig = { ...this.subledgerFilterConfig, options: subledgers };
      },
      error: () => {
        this.subledgerFilterConfig = { ...this.subledgerFilterConfig, options: [] };
      }
    });
  }

  private applyAdvancedFilters(items: any[]): any[] {
    const selectedDateField = this.currentFilters.dateType || 'VoucherMatchingDate';
    const from = this.currentFilters.dateRange?.fromDate ? new Date(this.currentFilters.dateRange.fromDate) : null;
    const to = this.currentFilters.dateRange?.toDate ? new Date(this.currentFilters.dateRange.toDate) : null;
    const selectedSubledger = this.currentFilters.pol ? String(this.currentFilters.pol).trim().toUpperCase() : '';

    if (!from && !to && !selectedSubledger) {
      return items;
    }

    return (items || []).filter((item: any) => {
      const itemSubledger = String(item?.SubledgerName ?? '').trim().toUpperCase();
      if (selectedSubledger && itemSubledger !== selectedSubledger) {
        return false;
      }

      if (from || to) {
        const rawDate = item?.[selectedDateField];
        if (!rawDate) {
          return false;
        }
        const itemDate = new Date(rawDate);
        if (Number.isNaN(itemDate.getTime())) {
          return false;
        }
        if (from && itemDate < from) {
          return false;
        }
        if (to && itemDate > to) {
          return false;
        }
      }
      return true;
    });
  }

  private getDefaultDateRange(): NonNullable<AdvancedFilterValues['dateRange']> {
    const range = getFinancialYearPresetDateRange('last30', this.appSettingService.getCurrentFinancialYear());
    return { preset: 'last30', ...range };
  }

  private hasExplicitDateRange(): boolean {
    return !!(this.currentFilters.dateRange?.fromDate || this.currentFilters.dateRange?.toDate);
  }

  private getDefaultFilters(): AdvancedFilterValues {
    return {
      dateRange: this.getDefaultDateRange(),
      dateType: 'VoucherMatchingDate'
    };
  }
}

