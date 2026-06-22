// invoice-list.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { OperationService } from '../../operation.service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { catchError, map, Observable, of } from 'rxjs';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { AccountsService } from '../../../accounts/accounts.service';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  DropdownFilterConfig,
  PartyFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';
import { InvoiceService } from '../../services/invoice.service';
import { VoucherActionGuardService } from 'src/app/shared/services/voucher-action-guard.service';
import { getFinancialYearDateRangeBounds, getFinancialYearPresetDateRange } from 'src/app/common/helper';
import { VoucherType, navigateToVoucherEntry } from 'src/app/common/voucher-route';

@Component({
  selector: 'app-invoice-list',
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
  templateUrl: './invoice-list.component.html'
})
export class InvoiceListComponent extends BaseListComponent implements OnInit {
  @ViewChild('invoiceTable') invoiceTable!: ReusableTableComponent;
  searchType = 'InvoiceNo';
  // filterValue = '';
  results: any[] = [];
  invoiceList: any[] = [];
  // searchPerformed = false;
  companyMap: { [id: number]: string } = {};
  userData: any;
  // sortColumn: string = 'InvoiceNo';
  // sortDirection: string = 'asc';
  loading = false;

  // Pagination 
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection = 0;
  isFavorite: boolean = false;
  masterJobMap: { [id: number]: string } = {};
  houseJobMap: { [id: number]: string } = {};

  // Company
  currentCompany: any;
  currentBranch: any;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  tableConfig: TableConfig;
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];

  tableLoading = false;
  dateRangeConfig: DateRangeConfig;
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [{ label: 'Invoice Date', value: 'VoucherDate' }],
    defaultValue: 'VoucherDate'
  };
  partyFilterConfig: PartyFilterConfig = {
    enabled: true,
    partyTypes: [{ label: 'Customer', value: 'CustomerMasterSid' }],
    defaultPartyType: 'CustomerMasterSid'
  };
  currencyFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Currency',
    options: [],
    bindLabel: 'currencyCode',
    bindValue: 'currencyCode'
  };
  currentFilters: AdvancedFilterValues = {};
  private partyOptions: any[] = [];

  protected config: ListComponentConfig = {
    storageKey: 'invoice-type-state',
    defaultPageSize: 10,
    defaultSortColumn: 'VoucherDate',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allInvoice() { return this.allItems; }
  partySearchFn = (_searchTerm: string, partyType: string): Observable<any[]> => {
   const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    const branchMasterSid = this.currentBranch?.BranchMasterSid;
    if (!companyMasterSid || !branchMasterSid || partyType !== 'CustomerMasterSid') {
      return of([]);
    }

    return this.operationService.getAllDebtorWithCOAMapped({
      CompanyMasterSid: companyMasterSid,
      BranchMasterSid: branchMasterSid
    }).pipe(
      map((resp: any) => {
        const rows = Array.isArray(resp?.data) ? resp.data : [];
        this.partyOptions = rows;
        return rows;
      }),
      catchError(() => of([]))
    );
  };

  constructor(
    private operationService: OperationService,
    private accountService: AccountsService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
     private datePipe: CustomDatePipe,
     private mps: MenuPermissionService,
     private invoiceService: InvoiceService,
     private voucherActionGuard: VoucherActionGuardService
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    this.loadJobMappings();

    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();

    if (userProfile) {
      this.userData = userProfile;
    }

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
          this.initializeTableConfig();
          this.initializeHeaderActions();
        });
    this.currentFilters = {
      dateRange: this.getDefaultDateRange(),
      dateType: 'VoucherDate'
    };
    this.loadCurrencies();
    super.ngOnInit();
    // this.loadInvoices();
  }


  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.invoiceService.searchInvoices(this.getSearchParams());
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
    }
    if (this.currentFilters.dateRange?.toDate) {
      params.dateTo = this.currentFilters.dateRange.toDate;
    }
    if (this.currentFilters.dateType) {
      params.dateField = this.currentFilters.dateType;
    }
    if (this.currentFilters.party) {
      const partyMasterSid = this.resolvePartyMasterSid(this.currentFilters.party.partyId);
      if (partyMasterSid) {
        params.PartyMasterSid = partyMasterSid;
        params.partyMasterSid = partyMasterSid;
      } else {
        params.CustomerMasterSid = this.currentFilters.party.partyId;
        params.customerMasterSid = this.currentFilters.party.partyId;
      }
      params.customerName = this.currentFilters.party.partyName;
    }
    if (this.currentFilters.pol) {
      params.CurrencyCode = this.currentFilters.pol;
      params.currencyCode = this.currentFilters.pol;
    }

    if (!this.hasExplicitDateRange()) {
      const currentYear = this.appSettingService.getCurrentFinancialYear();
      if (currentYear?.YearMasterSid) {
        params.YearMasterSid = currentYear.YearMasterSid;
      }
    }

    return params;
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response.status) {
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
      this.allItems = rawItems.map((item: any) => ({
        ...item,
        BookingNo: item?.BookingHeader?.BookingNo || '',
        MasterNumber: item?.masterJob?.MasterJobNumber || '',
        VoucherDateRaw: item?.VoucherDate,
        VoucherDate:this.datePipe.transform(item?.VoucherDate),
        PostStatusLabel: item.PostStatus === 'P' ? 'Posted' : 'Unposted',
        Status: item.Status === 'A' ? 'Active' : 'Suspended',
        AmountFormatted: this.formatAmount(item.Amount)
      }));
      this.totalLengthOfCollection = response?.data?.totalCount || rawItems.length || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching Invoice.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching Invoice.');
    console.error('Error searching Invoice', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadInvoice();
  }


  // Legacy method for template compatibility
  loadInvoice() {
    this.page = 1;
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = {
      dateRange: this.getDefaultDateRange(),
      dateType: 'VoucherDate'
    };
    this.clearFilterValue();
  }

  // Legacy method for template compatibility
  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.VoucherHeaderSid || index;
  }

  initializeHeaderActions(): void {
    this.headerActions = [
      // {
      //   label: 'Create',
      //   icon: 'fas fa-plus',
      //   action: 'create',
      //   disabled: !this.mps.can('insert')
      // },
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

  // Table configuration
  private initializeTableConfig() {
    this.tableConfig = {
    columns: [
      {
        key: 'VoucherNumber',
        label: 'Invoice No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        
      },
      {
        key: 'VoucherDate',
        label: 'Invoice Date ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width:"120px"
      },
      {
        key: 'PartyName',
        label: 'Customer Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '180px',
      },
       {
        key: 'CurrencyCode',
        label: 'Currency ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '100px',
      },
      {
        key: 'AmountFormatted',
        label: 'Amount',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'number',
        width: '120px',
        cellClass: 'text-end'
      },
        {
        key: 'MasterNumber',
        label: 'Job No  ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        template:'link',
      },
        {
        key: 'HouseNumber',
        label: 'House No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        template: 'link',  
      },
      {
        key:'BookingNo',
        label:'Booking No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        template: 'link',
      },
      {
        key: 'PostStatusLabel',
        label: 'Post Status',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '120px',
        template: 'status',
      },
      {
        key: 'Status',
        label: 'Status',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'status',
        width: '100px',
        dataType: 'string',
        cellClass: 'status-column'
      },
      
       {
        key: 'CreatedBy',
        label: 'Create By ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '150px',
      }
    ],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View ',
        state: !this.mps.can('view')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete ',
        class: "text-danger",
        state: !this.mps.can('delete'),
        condition: (row: any) => this.canDeleteInvoice(row)
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'VoucherHeaderSid',
    emptyMessage: 'No Invoice found',
    dragAndDrop: true
  };
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.navigateToAddNewInvoice();
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
    if (event.column?.template === "link") {
      // Handle link template click (Master Job Number)
      if (event.column.key === 'MasterNumber') {
      this.navigateToMasterJob(event.row);
      return;
    }

    if (event.column.key === 'HouseNumber') {
      this.navigateToHouse(event.row);
      return;
    }
    if (event.column.key === 'BookingNo') {
      this.navigateToBooking(event.row);
      return;
    }
    } else if (event.action === 'view') {
      this.editbyrow(event.row);
    } else if (event.action === 'delete') {
      this.deleteInvoiceByRow(event.row);
    }
  }
  navigateToMasterJob(invoice: any): void {
    const masterJobSid = Number(invoice?.MasterJobSid || 0);
    if (!masterJobSid) {
      this.appSettingService.showWarning('Master Job not available');
      return;
    }

    const rowContext = this.getRowNavigationContext(invoice);
    if (rowContext.isAgentHouseJob && rowContext.houseJobSid) {
      this.router.navigate(['/operation/agent-master-air-waybill/entry', rowContext.houseJobSid]);
      return;
    }

    if (rowContext.isServiceJob && rowContext.houseJobSid) {
      this.router.navigate(['/operation/service-job/entry', rowContext.houseJobSid]);
      return;
    }

    if (rowContext.departmentType === 'AIR') {
      this.router.navigate(['/operation/mawbill/entry', masterJobSid]);
      return;
    }

    this.router.navigate(['/operation/master-job/entry', masterJobSid]);
  }
  navigateToHouse(row: any): void {
    const houseJobSid = Number(row?.HouseJobSid || 0);
    if (!houseJobSid) {
      this.appSettingService.showWarning('House Job not available');
      return;
    }

    const rowContext = this.getRowNavigationContext(row);
    if (rowContext.isAgentHouseJob) {
      this.router.navigate(['/operation/agent-master-air-waybill/entry', houseJobSid]);
      return;
    }

    if (rowContext.isServiceJob) {
      this.router.navigate(['/operation/service-job/entry', houseJobSid]);
      return;
    }

    if (rowContext.departmentType === 'AIR') {
      this.router.navigate(['/operation/hawb-bill/entry', houseJobSid]);
      return;
    }

    this.router.navigate(['/operation/house-job/entry', houseJobSid]);
  }

  private getRowNavigationContext(row: any): {
    departmentType: string;
    houseJobSid: number;
    isAgentHouseJob: boolean;
    isServiceJob: boolean;
  } {
    const houseJobSid = Number(row?.HouseJobSid || 0);
    const jobType = String(row?.houseJob?.JobType ?? row?.JobType ?? '').trim();
    const isAgentHouseJob = jobType === 'Agent';

    const rowServiceFlag = String(row?.IsServiceJob ?? '').trim().toUpperCase();
    const houseServiceFlag = String(row?.houseJob?.IsServiceJob ?? '').trim().toUpperCase();
    const isServiceJob = rowServiceFlag === 'Y' || houseServiceFlag === 'Y';

    return {
      departmentType: this.getRowDepartmentType(row),
      houseJobSid,
      isAgentHouseJob,
      isServiceJob
    };
  }

  private getRowDepartmentType(row: any): string {
    return String(
      row?.departmentMaster?.departmentType ??
      row?.DepartmentType ??
      row?.departmentType ??
      row?.DepartmentMaster?.departmentType ??
      ''
    ).trim().toUpperCase();
  }

navigateToBooking(row: any): void {
  if (row?.BookingHeaderSid) {
    this.router.navigate(['/operation/booking/entry', row.BookingHeaderSid]);
  } else {
    this.appSettingService.showWarning('Booking not available');
  }
}

  // viewInvoice(item.VoucherHeaderSid)
  editbyrow(row:any) {
     navigateToVoucherEntry(this.router, VoucherType.INVOICE, row.VoucherHeaderSid);
  }


  deleteInvoiceByRow(row: any) {
    this.deleteInvoice(row.VoucherHeaderSid, row);
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
    // console.log('Filters changed:', filters);
  }

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
  }

  private loadCurrencies(): void {
    this.operationService.getAllCurrencies().pipe(
      map((response: any) => {
        const rows = Array.isArray(response?.data) ? response.data : [];
        return rows.map((row: any) => ({
          ...row,
          currencyCode: row.currencyCode || row.CurrencyCode || row.code || ''
        }));
      }),
      catchError(() => of([]))
    ).subscribe((currencies: any[]) => {
      this.currencyFilterConfig = {
        ...this.currencyFilterConfig,
        options: currencies.filter((c: any) => !!c.currencyCode)
      };
    });
  }

  private getDefaultDateRange(): NonNullable<AdvancedFilterValues['dateRange']> {
    const range = getFinancialYearPresetDateRange('last30', this.appSettingService.getCurrentFinancialYear());
    return { preset: 'last30', ...range };
  }

  private hasExplicitDateRange(): boolean {
    return !!(this.currentFilters.dateRange?.fromDate || this.currentFilters.dateRange?.toDate);
  }

  private resolvePartyMasterSid(partyId: any): number | null {
    const idNum = Number(partyId);
    if (!idNum || this.partyOptions.length === 0) {
      return null;
    }
    const match = this.partyOptions.find((p: any) =>
      Number(p?.CustomerMasterSid) === idNum ||
      Number(p?.SubledgerMasterSid) === idNum ||
      Number(p?.PartyMasterSid) === idNum
    );
    return match?.SubledgerMasterSid ?? match?.PartyMasterSid ?? null;
  }

  private hasAdvancedFilterValues(): boolean {
    return !!(
      this.currentFilters.party?.partyId ||
      this.currentFilters.pol ||
      this.currentFilters.dateRange?.fromDate ||
      this.currentFilters.dateRange?.toDate
    );
  }

  private applyAdvancedFilters(items: any[]): any[] {
    if (!this.hasAdvancedFilterValues()) {
      return items;
    }

    const selectedDateField = this.currentFilters.dateType || 'VoucherDate';
    const from = this.currentFilters.dateRange?.fromDate ? new Date(this.currentFilters.dateRange.fromDate) : null;
    const to = this.currentFilters.dateRange?.toDate ? new Date(this.currentFilters.dateRange.toDate) : null;
    const selectedCurrency = this.currentFilters.pol ? String(this.currentFilters.pol).trim().toUpperCase() : null;
    const selectedCustomerSid = this.currentFilters.party?.partyId ? Number(this.currentFilters.party.partyId) : null;
    const selectedCustomerName = this.currentFilters.party?.partyName
      ? String(this.currentFilters.party.partyName).trim().toUpperCase()
      : null;

    return items.filter((item: any) => {
      if (selectedCustomerSid || selectedCustomerName) {
        const itemCustomerSid = Number(item?.CustomerMasterSid ?? item?.customerMaster?.CustomerMasterSid ?? 0);
        const itemCustomerName = String(item?.PartyName ?? item?.CustomerName ?? '').trim().toUpperCase();
        const sidMatches = selectedCustomerSid ? itemCustomerSid === selectedCustomerSid : false;
        const nameMatches = selectedCustomerName ? itemCustomerName === selectedCustomerName : false;
        if (!(sidMatches || nameMatches)) {
          return false;
        }
      }

      if (selectedCurrency) {
        const itemCurrency = String(item?.CurrencyCode ?? item?.currencyMaster?.currencyCode ?? '').trim().toUpperCase();
        if (itemCurrency !== selectedCurrency) {
          return false;
        }
      }

      if (from || to) {
        const rawDate = item?.[selectedDateField];
        if (!rawDate) {
          return false;
        }
        const itemTime = this.parseDateValue(rawDate);
        if (itemTime === null) {
          return false;
        }
        const itemDate = new Date(itemTime);
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
    const formattedData = this.allInvoice;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.invoiceTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Invoice-Report',
      title: companyName
    });
  }
  loadJobMappings() {
    // Load master jobs mapping
    this.operationService.getAllMasterJobs({}).subscribe({
      next: (response: any) => {
        if (response.data) {
          response.data.forEach((job: any) => {
            this.masterJobMap[job.MasterJobSid] = job.MasterJobNumber;
          });
        }
      }
    });

    // Load house jobs mapping if needed
    // this.operationService.getAllHouseJobs({}).subscribe({
    //   next: (response: any) => {
    //     if (response.data) {
    //       response.data.forEach((job: any) => {
    //         this.houseJobMap[job.HouseJobSid] = job.HouseJobNumber;
    //       });
    //     }
    //   }
    // });
  }
  loadInvoices(): void {
    this.spinner.show();
    this.loading = true;

    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      includeDetails: true // Request to include voucher details for calculation
    };

    this.invoiceService.searchInvoices(params).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.results = this.processInvoiceData(response.data.items || response.data || []);
          this.invoiceList = this.results;
          this.totalLengthOfCollection = response.totalCount || this.invoiceList.length;
          this.applySorting();
          this.searchPerformed = true;
        }
        this.spinner.hide();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching invoices:', err);
        this.results = [];
        this.invoiceList = [];
        this.totalLengthOfCollection = 0;
        this.loading = false;
        this.spinner.hide();
      }
    });
  }
  private processInvoiceData(invoices: any[]): any[] {
    return invoices.map(invoice => {
      // Calculate local amount if not provided
      if (!invoice.LocalAmount && invoice.voucherDetails) {
        invoice.LocalAmount = invoice.voucherDetails.reduce((total: number, detail: any) => {
          return total + (detail.LocalAmount || 0);
        }, 0);
      }

      // Get job numbers from mappings
      if (invoice.MasterJobSid) {
        invoice.MasterJobNumber = this.masterJobMap[invoice.MasterJobSid] || invoice.MasterJobSid;
      }

      if (invoice.HouseJobSid) {
        invoice.HouseJobNumber = this.houseJobMap[invoice.HouseJobSid] || invoice.HouseJobSid;
      }

      return invoice;
    });
  }


  // sort(column: string) {
  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.loadInvoices();
  //   this.applySorting();
  //   this.updatePaginatedData();
  // }

  // applySorting() {
  //   this.results.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];

  //     if (valueA == null) valueA = '';
  //     if (valueB == null) valueB = '';

  //     valueA = valueA.toString().toLowerCase();
  //     valueB = valueB.toString().toLowerCase();

  //     if (valueA < valueB) {
  //       return this.sortDirection === 'asc' ? -1 : 1;
  //     }
  //     if (valueA > valueB) {
  //       return this.sortDirection === 'asc' ? 1 : -1;
  //     }
  //     return 0;
  //   });
  // }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadInvoices();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  private canDeleteInvoice(row: any): boolean {
    const status = String(row?.Status ?? '').trim().toUpperCase();
    const postStatus = String(row?.PostStatus ?? row?.PostStatusLabel ?? '').trim().toUpperCase();

    const isActive = status === 'A' || status === 'ACTIVE';
    const isUnposted = postStatus === 'U' || postStatus === 'UNPOSTED';

    return isActive && isUnposted;
  }

  deleteInvoice(id: number, invoice?: any) {
    const row = invoice ?? this.allItems.find((item: any) => item?.VoucherHeaderSid === id);
    const blockedReason = this.voucherActionGuard.getDeleteBlockedReason({
      documentName: 'Invoice',
      status: row?.Status,
      postStatus: row?.PostStatus ?? row?.PostStatusLabel,
      canDelete: this.mps.can('delete'),
      blockedByCondition: !this.canDeleteInvoice(row),
      blockedConditionReason: 'Only active unposted invoices can be deleted.',
    });
    if (this.voucherActionGuard.block(blockedReason)) return;

    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.spinner.show();
        this.accountService.deleteVoucher({
          VoucherHeaderSid: id,
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          BranchMasterSid: this.currentBranch?.BranchMasterSid,
          UserEmail: this.userData?.userEmail
        }).subscribe({
          next: (resp: any) => {
            this.spinner.hide();
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message || 'Invoice deleted successfully');
              this.search();
            } else {
              this.appSettingService.showError(resp.message || 'Failed to delete invoice');
            }
          },
          error: (error) => {
            console.error('Error deleting invoice:', error);
            this.appSettingService.showError('Failed to delete invoice');
            this.spinner.hide();
          }
        });
      }
    });
  }

  navigateToAddNewInvoice() {
    const blockedReason = this.voucherActionGuard.getInsertBlockedReason({
      documentName: 'Invoice',
      canInsert: this.mps.can('insert'),
    });
    if (this.voucherActionGuard.block(blockedReason)) return;

    navigateToVoucherEntry(this.router, VoucherType.INVOICE);
  }

  // clearFilterValue() {
  //   this.filterValue = '';
  // }

  // resetPage(): void {
  //   this.invoiceList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.searchPerformed = false;
  //   this.filterValue = '';
  //   this.searchType = 'InvoiceNo';
  //   this.page = 1;
  //   this.sortColumn = 'InvoiceNo';
  //   this.sortDirection = 'asc';
  //   this.loadInvoices();
  // }

  // report(): void {
  //   const formattedData = this.invoiceList.map(item => ({
  //     ...item,
  //     status: item.status === 'A' ? 'Active' : 'Suspended',
  //     InvoiceDate: this.formatDate(item.InvoiceDate),
  //     CreateOn: this.formatDate(item.CreateOn)
  //   }));

  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'VoucherNumber', label: 'VoucherNumber' },
  //       { key: 'VoucherDate', label: 'VoucherDate ' },
  //       { key: 'PartyName', label: 'PartyName ' },
  //       { key: 'CurrencyCode', label: 'CurrencyCode' },
  //       { key: 'LocalAmount', label: 'Local Amount' },
  //       { key: 'IRNNumber', label: 'INR No' },
  //       { key: 'MasterJobSid', label: 'Job No' },
  //       { key: 'HouseJobSid', label: 'House No' },
  //       { key: 'status', label: 'Status' },
  //       { key: 'CreateOn', label: 'Created On' },
  //       { key: 'CreditNoteNo', label: 'Credit Note No' },
  //     ],
  //     fileName: 'Invoice-Report',
  //     title: companyName
  //   });
  // }

  private formatAmount(amount: number | string): string {
    if (!amount) return '0.00';
    const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numValue)) return '0.00';
    return numValue.toFixed(2);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';

    // Handle string dates, timestamps, and Date objects
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
  }

  viewInvoice(id: number) {
    navigateToVoucherEntry(this.router, VoucherType.INVOICE, id);
  }
}




