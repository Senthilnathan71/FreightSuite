import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AccountsService } from '../../accounts.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { Observable } from 'rxjs';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  DropdownFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';
@Component({
  selector: 'app-currency-exchange-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    RouterModule,
    NgbPaginationModule,
    CustomDatePipe,
    FavoriteStarComponent,
    NgxSpinnerModule,
    CommonPaginationComponent,
    ReusableTableComponent,
     PageHeaderComponent,
  ],
  providers: [CustomDatePipe],
  templateUrl: './currency-exchange-list.component.html',
  styleUrl: './currency-exchange-list.component.scss'
})
export class CurrencyExchangeListComponent extends BaseListComponent implements OnInit {
  @ViewChild('currencyExchangeTable') currencyExchangeTable!: ReusableTableComponent;
  searchType = 'FromCurrency';
  // filterValue = '';
  allResults: any[] = []; // Store all results for pagination and sorting
  currencyExchangeList: any[] = []; // Store paginated results
  // searchPerformed = false;
  loading: boolean = false;
  userData: any;

  // pagination
  // page = 1;
  // pageSize = 10;
  // totalLengthOfCollection: number = 0;

  //  sorting
  // sortColumn: string = 'EffectiveFrom'; 
  // sortDirection: string = 'desc'; 
  isFavorite: boolean = false;
  // Company
  currentCompany: any;
  currentBranch: any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  // Table configuration
  tableConfig: TableConfig;

  tableLoading = false;
  headerActions: HeaderAction[] = [];
  dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [{ label: 'Effective From', value: 'EffectiveFrom' }],
    defaultValue: 'EffectiveFrom'
  };
  fromCurrencyFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'FromCurrency',
    options: [],
    bindLabel: 'currencyCode',
    bindValue: 'currencyCode'
  };
  toCurrencyFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'ToCurrency',
    options: [],
    bindLabel: 'currencyCode',
    bindValue: 'currencyCode'
  };
  private allCurrencies: any[] = [];
  currentFilters: AdvancedFilterValues = {};
  protected config: ListComponentConfig = {
    storageKey: 'currencyExchange-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'EffectiveFrom',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  get allCurrencyExchange() { return this.allItems; }
  constructor(
    private accountService: AccountsService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe,
    public mps: MenuPermissionService,
  ) {
    super(paginationService);
  }
  override ngOnInit(): void {
    //    this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    // this.loadCurrencyExchanges();
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'EffectiveFrom'
    };
    this.loadCurrencies();
    super.ngOnInit();
  }

  // loadCurrencyExchanges(): void {
  //   this.spinner.show();
  //   this.loading = true;
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   let BranchMasterSid=this.currentBranch?.BranchMasterSid;
  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection,
  //     activeCompanyId : CompanyMasterSid,
  //     activeBranchId: BranchMasterSid,
  //   };

  //   this.accountService.searchCurrencyExchangeList(params).subscribe({
  //     next: (response) => {
  //       if(response.status) {
  //         this.currencyExchangeList = response.data.items || response.data || [];
  //         this.totalLengthOfCollection = response.data.totalCount || response.length || 0;
  //         this.applySorting();
  //         this.searchPerformed = true;
  //       }else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error fetching currency exchanges:', err);
  //       this.currencyExchangeList = [];
  //       this.totalLengthOfCollection = 0;
  //       this.loading = false;
  //     }
  //   });
  // }
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.accountService.searchCurrencyExchangeList(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams & Record<string, any> {
    const params: any = {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    if (this.currentFilters.dateRange?.fromDate) {
      params.dateFrom = this.currentFilters.dateRange.fromDate;
      params.DateFrom = this.currentFilters.dateRange.fromDate;
    }
    if (this.currentFilters.dateRange?.toDate) {
      params.dateTo = this.currentFilters.dateRange.toDate;
      params.DateTo = this.currentFilters.dateRange.toDate;
    }
    if (this.currentFilters.dateType) {
      params.dateField = this.currentFilters.dateType;
      params.DateField = this.currentFilters.dateType;
    }
    if (this.currentFilters.pol) {
      params.FromCurrency = this.currentFilters.pol;
      params.fromCurrency = this.currentFilters.pol;
    }
    if (this.currentFilters.pod) {
      params.ToCurrency = this.currentFilters.pod;
      params.toCurrency = this.currentFilters.pod;
    }

    return params;
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response.status) {
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
      this.allItems = rawItems.map(item => ({
        ...item,
        status: item.status === 'A' ? 'Active' : 'Suspended',
        EffectiveFromRaw: item?.EffectiveFrom,
        EffectiveFrom: this.datePipe.transform(item?.EffectiveFrom),
        SellRateFormatted: this.formatAmount(item.SellRate),
        BuyRateFormatted: this.formatAmount(item.BuyRate)
      }));
      this.totalLengthOfCollection = response?.data?.totalCount || rawItems.length || 0;
      this.applySorting();
      this.updateHeaderActionState();

    } else {
      this.appSettingService.showError('Error fetching Currency-Exchange.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }
  private formatAmount(amount: number | string): string {
  if (!amount) return '0.00';
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // If negative, show without decimals
  if (numValue < 0) {
    return Math.round(numValue).toString();
  }
  
  // If positive, show with 2 decimals
  return numValue.toFixed(2);
}

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error fetching Currency-Exchange.');
    console.error('Error fetching Currency-Exchange', error);
    super.handleSearchError(error);
  }


    onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchCurrencyExchange();
  }
  searchCurrencyExchange() {
    this.page = 1;
    this.search();
  }

    onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'EffectiveFrom'
    };
    this.fromCurrencyFilterConfig = { ...this.fromCurrencyFilterConfig, options: [...this.allCurrencies] };
    this.toCurrencyFilterConfig = { ...this.toCurrencyFilterConfig, options: [...this.allCurrencies] };
    this.clearFilterValue();
  }

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
  }

  onFromCurrencyFilterChanged(fromCurrency: string | null): void {
    const selectedFrom = fromCurrency ? String(fromCurrency).trim().toUpperCase() : '';
    const filteredToOptions = !selectedFrom
      ? [...this.allCurrencies]
      : this.allCurrencies.filter((c: any) => String(c?.currencyCode || '').trim().toUpperCase() !== selectedFrom);
    this.toCurrencyFilterConfig = { ...this.toCurrencyFilterConfig, options: filteredToOptions };
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
        this.navigateToCreateCurrencyExchange();
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

  updatePaginationData(): void {
    this.search();
  }

  trackByExchangeId(index: number, item: any): number {
    return index;
  }

  override trackBy(index: number, item: any): number {
    return item.CurrencyExchangeSid || index;
  }

  viewCurrencyExchange(item: any): void {
    this.router.navigate(['accounts/currency-exchange/entry', item.CurrencyExchangeSid]);
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig = {
      columns : [
      {
        key: 'EffectiveFrom',
        label: 'Effective From',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'FromCurrency',
        label: 'From Currency',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ToCurrency',
        label: 'To Currency',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'SellRateFormatted',
        label: 'Sell Rate',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'BuyRateFormatted',
        label: 'Buy Rate',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        cellClass: 'vessel-column'
      },
      {
        key: 'RateFrom',
        label: 'Rate From ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'status',
        width: '100px',
        dataType: 'string',
        cellClass: 'status-column'
      }
    ],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Currency Exchange',
        state: !this.mps.can('view')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete ',
        class: "text-danger",
        state: !this.mps.can('delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'CurrencyExchangeSid',
    emptyMessage: 'No currency-exchange found',
    dragAndDrop: true
  }
}

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewCurrencyExchange(event.row);
    }
  }

  onTableRowClick(row: any): void {
    // Row clicking can be handled by the table component if needed
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    // For now, we'll handle this with the existing search functionality
    // In a more advanced implementation, you could apply individual column filters
    console.log('Filters changed:', filters);
  }

  private loadCurrencies(): void {
    this.accountService.getAllCurrencies().subscribe({
      next: (rows: any[]) => {
        const currencies = Array.isArray(rows)
          ? rows.map((row: any) => ({
              ...row,
              currencyCode: row?.currencyCode || row?.CurrencyCode || row?.code || ''
            })).filter((c: any) => !!c.currencyCode)
          : [];
        this.allCurrencies = currencies;
        this.fromCurrencyFilterConfig = { ...this.fromCurrencyFilterConfig, options: [...currencies] };
        this.toCurrencyFilterConfig = { ...this.toCurrencyFilterConfig, options: [...currencies] };
      },
      error: () => {
        this.allCurrencies = [];
        this.fromCurrencyFilterConfig = { ...this.fromCurrencyFilterConfig, options: [] };
        this.toCurrencyFilterConfig = { ...this.toCurrencyFilterConfig, options: [] };
      }
    });
  }

  private getLast30FromDate(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }

  private applyAdvancedFilters(items: any[]): any[] {
    const selectedDateField = this.currentFilters.dateType || 'EffectiveFrom';
    const from = this.currentFilters.dateRange?.fromDate ? new Date(this.currentFilters.dateRange.fromDate) : null;
    const to = this.currentFilters.dateRange?.toDate ? new Date(this.currentFilters.dateRange.toDate) : null;
    const fromCurrency = this.currentFilters.pol ? String(this.currentFilters.pol).trim().toUpperCase() : '';
    const toCurrency = this.currentFilters.pod ? String(this.currentFilters.pod).trim().toUpperCase() : '';

    if (!from && !to && !fromCurrency && !toCurrency) {
      return items;
    }

    return items.filter((item: any) => {
      if (fromCurrency && String(item?.FromCurrency || '').trim().toUpperCase() !== fromCurrency) {
        return false;
      }
      if (toCurrency && String(item?.ToCurrency || '').trim().toUpperCase() !== toCurrency) {
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

  report(): void {
    const formattedData = this.allCurrencyExchange;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.currencyExchangeTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Currency-Exchange-Report',
      title: companyName
    });
  }
  // sort(column: string) {
  //   if (this.sortColumn === column) {

  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {

  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.loadCurrencyExchanges();
  //   this.applySorting();
  //   this.updatePaginatedData();
  // }

  // applySorting() {
  //   this.currencyExchangeList.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];


  //     if (valueA == null) valueA = '';
  //     if (valueB == null) valueB = '';


  //     if (this.sortColumn === 'EffectiveFrom') {
  //       valueA = new Date(valueA).getTime();
  //       valueB = new Date(valueB).getTime();
  //     }


  //     if (this.sortColumn === 'SellRate' || this.sortColumn === 'BuyRate') {
  //       valueA = Number(valueA);
  //       valueB = Number(valueB);
  //     }


  //     if (typeof valueA !== 'number' && !(valueA instanceof Date)) {
  //       valueA = valueA.toString().toLowerCase();
  //       valueB = valueB.toString().toLowerCase();
  //     }

  //     if (valueA < valueB) {
  //       return this.sortDirection === 'asc' ? -1 : 1;
  //     }
  //     if (valueA > valueB) {
  //       return this.sortDirection === 'asc' ? 1 : -1;
  //     }
  //     return 0;
  //   });
  // }
  //   clearFilterValue() {
  //   this.filterValue = '';
  //   this.loadCurrencyExchanges();
  // }

  //   updatePaginatedData(): void {
  //     const startIndex = (this.page - 1) * this.pageSize;
  //     const endIndex = startIndex + this.pageSize;
  //     this.loadCurrencyExchanges();
  //   }

  //   trackByExchangeId(index: number, item: any): number {
  //     return item.ExchangeRateSid || index;
  //   }

  // deleteCurrencyExchange(id: number) {
  //   const dialogRef = this.dialog.open(DeleteWarningComponent);
  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result === true) {
  //       this.loading = true;
  //       this.accountService.deleteCurrencyExchangeById(id).subscribe({
  //         next: (resp: any) => {
  //           this.appSettingService.showSuccess("Currency exchange deleted successfully!");
  //           this.search(); // Refresh search results
  //         },
  //         error: (err) => {
  //           console.error('Delete error:', err);
  //           this.loading = false;
  //         }
  //       });
  //     }
  //   });
  // }

  navigateToCreateCurrencyExchange() {
    this.router.navigate(['accounts/currency-exchange/entry']);
  }

  // resetPage() {
  //   this.filterValue = '';
  //   this.searchType = 'FromCurrency';
  //   this.page = 1;
  //   this.searchPerformed = false;
  //   this.allResults = [];
  //   this.currencyExchangeList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.sortColumn = 'EffectiveFrom';
  //   this.sortDirection = 'desc';
  //    this.loadCurrencyExchanges();
  // }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  // report(): void {
  //   const formattedData = this.currencyExchangeList.map(item => ({
  //     ...item,
  //     status: item.status === 'A' ? 'Active' : 'Suspended',
  //     EffectiveFrom: this.formatDateForExport(item.EffectiveFrom),
  //     SellRate: this.formatNumberForExport(item.SellRate),
  //     BuyRate: this.formatNumberForExport(item.BuyRate)
  //   }));

  //   // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'EffectiveFrom', label: 'Effective From' },
  //       { key: 'FromCurrency', label: 'From Currency' },
  //       { key: 'ToCurrency', label: 'To Currency' },
  //       { key: 'SellRate', label: 'Sell Rate' },
  //       { key: 'BuyRate', label: 'Buy Rate' },
  //       { key: 'BankName', label: 'Bank Name' },
  //       { key: 'status', label: 'Status' }
  //     ],
  //     fileName: 'Currency-Exchange-Report',
  //     title: companyName
  //   });
  // }

  private formatDateForExport(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private formatNumberForExport(value: number | string): string {
    if (value === null || value === undefined) return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toFixed(2);
  }
}
