// vendor-invoice-list.component.ts
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
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableConfig } from 'src/app/shared/interfaces/table.interface';
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

@Component({
  selector: 'app-vendor-invoice-list',
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
  templateUrl: './vendor-invoice-list.component.html',
  styleUrl: './vendor-invoice-list.component.scss'
})
export class VendorInvoiceListComponent extends BaseListComponent implements OnInit {
  @ViewChild('vendorInvoiceTable') vendorInvoiceTable!: ReusableTableComponent;

  results: any[] = [];
  vendorInvoiceList: any[] = [];
  userData: any;
  loading = false;
  isFavorite: boolean = false;
  permissions: string[] = [];
  tableConfig: TableConfig;
  currentMenuPermissions: any = {};

  // Company
  currentCompany: any;
  currentBranch: any;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  tableLoading = false;
  dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [
      { label: 'Invoice Date', value: 'VoucherDate' },
      { label: 'Bill Date', value: 'BillDate' }
    ],
    defaultValue: 'VoucherDate'
  };
  partyFilterConfig: PartyFilterConfig = {
    enabled: true,
    partyTypes: [{ label: 'VendorName', value: 'CustomerMasterSid' }],
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

  protected config: ListComponentConfig = {
    storageKey: 'vendor-invoice-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'VoucherDate',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allVendorInvoice() { return this.allItems; }
  partySearchFn = (_searchTerm: string, partyType: string): Observable<any[]> => {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!companyMasterSid || partyType !== 'CustomerMasterSid') {
      return of([]);
    }

    return this.operationService.getAllCustomersWithBranch(companyMasterSid).pipe(
      map((data: any) => Array.isArray(data) ? data : []),
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
    public mps: MenuPermissionService
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

    this.initializeHeaderActions();
    this.initializeTableConfig();
    this.mps.init().subscribe(()=>{
     this.initializeHeaderActions();
    this.initializeTableConfig();
    });
    this.currentFilters = this.getDefaultFilters();
    this.loadCurrencies();
    this.initializeModalDropdownItems();
    super.ngOnInit();
    // this.loadVendorInvoices();
  }

  

  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.operationService.searchVendorInvoices(this.getSearchParams());
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
    if (this.currentFilters.party) {
      params.CustomerMasterSid = this.currentFilters.party.partyId;
      params.customerMasterSid = this.currentFilters.party.partyId;
      params.customerName = this.currentFilters.party.partyName;
    }
    if (this.currentFilters.pol) {
      params.CurrencyCode = this.currentFilters.pol;
      params.currencyCode = this.currentFilters.pol;
    }

    return params;
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response.status) {
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
      const filteredItems = this.applyAdvancedFilters(rawItems);

      this.allItems = filteredItems.map((item: any) => ({
        ...item,
        VoucherDateRaw: item?.VoucherDate,
        BillDateRaw: item?.BillDate,
        VoucherDate: this.datePipe.transform(item?.VoucherDate),
        BillDate: this.datePipe.transform(item?.BillDate),
        CurrencyCode: item?.CurrencyCode || item?.currencyMaster?.currencyCode || '',
        PostStatus : item.PostStatus === 'P' ? 'Posted' : 'Unposted',
        Status: item.Status === 'A' ? 'Active' : 'Suspended',
        AmountFormatted: this.formatAmount(item.Amount)
      }));
      this.totalLengthOfCollection = response?.data?.totalCount || filteredItems.length || 0;
      // this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching Vendor Invoices.');
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
    this.appSettingService.showError('Error searching Vendor Invoices.');
    console.error('Error searching Vendor Invoices', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadVendorInvoice();
  }

  loadVendorInvoice() {
    this.page = 1;
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = this.getDefaultFilters();
    this.clearFilterValue();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.VoucherHeaderSid || index;
  }

  initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Create (Job)',
        icon: 'fas fa-plus',
        action: 'create',
        cssClass : 'dofi-min-w-100',
        disabled: !this.mps.can('insert')
      },
      {
        label: 'Create (Non Job)',
        icon: 'fas fa-plus',
        action: 'create-non-job',
        cssClass : 'dofi-min-w-120',
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

  private initializeTableConfig(): void {
   this.tableConfig = {
    columns: [
      {
        key: 'VoucherNumber',
        label: 'Vendor Invoice No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: "170px"
      },
      {
        key: 'VoucherDate',
        label: 'Invoice Date',
        sortable: true,
        sortKey: 'VoucherDateRaw',
        filterable: true,
        visible: true,
        dataType: 'date',

      },
      {
        key: 'VendorName',
        label: 'Vendor Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '180px',
      },
      {
        key: 'BillNo',
        label: 'Bill No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '120px',
      },
      {
        key: 'BillDate',
        label: 'Bill Date',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'CurrencyCode',
        label: 'Currency',
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
      },
      {
        key: 'MBLNo',
        label: 'MBL No.',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        template : 'link',
        width: '120px',
      },
      {
        key: 'HBLNo',
        label: 'HBL No.',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        template : 'link',
        width: '120px',
      },
      {
        key: 'BookingNo',
        label: 'Booking No.',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        template : 'link',
        width: '120px',
      },
       {
         key: 'PostStatus',
         label: 'Post Status',
         sortable: true,
         filterable: true,
         visible: true,
         width: '120px',
         template: 'status',
         dataType: 'string',
       },
      {
        key: 'Status',
        label: 'Status',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        template: 'status',
      }
    ],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Vendor Invoice',
         state : !this.mps.can('view')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete Vendor Invoice',
        class: "text-danger",
        state : !this.mps.can('delete'),
        condition: (row: any) => row.Status === 'Active' && row.PostStatus === 'Unposted'
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'VoucherHeaderSid',
    emptyMessage: 'No Vendor Invoice found',
    dragAndDrop: true
  };

  }

  private initializeModalDropdownItems(): void {
    this.modalDropdownItems = [
      {
        label: 'Export to Excel',
        icon: 'fas fa-file-excel',
        action: 'exportExcel',
        disabled: this.totalLengthOfCollection === 0
      }
    ];
  }

  loadVendorInvoices() {
    this.search();
  }

  onHeaderAction(action: string) {
    switch (action) {
      case 'create':
        this.onCreate();
        break;
      case 'create-non-job':
        this.onCreateNonJob();
        break;
      case 'report':
        this.onReport();
        break;
      case 'reset':
        this.onReset();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  onCreate() {
    this.router.navigate(['/operation/vendor-invoice/entry']);
  }

  onCreateNonJob() {
    this.router.navigate(['/operation/vendor-invoice/entry'], {
      queryParams: { isNonJob: true }
    });
  }

  onReport() {
    if (this.allItems.length > 0) {
      this.exportExcel();
    }
  }

  onReset() {
    this.currentFilters = this.getDefaultFilters();
    this.resetPage();
  }

  onTableActionClick(event: any) {
    const { action, row } = event;
    if (event.column?.template === "link") {
      // Handle link template click (Master Job Number)
      if (event.column.key === 'MBLNo') {
      this.navigateToMasterJob(event.row);
      return;
    }

    if (event.column.key === 'HBLNo') {
      this.navigateToHouse(event.row);
      return;
    }
    if (event.column.key === 'BookingNo') {
      this.navigateToBooking(event.row);
      return;
    }
    } else if (event.action === 'view') {
      this.editVendorInvoice(row);
    } else if (event.action === 'delete') {
      this.deleteVendorInvoice(row);
    }
    // const { action, row } = event;
    // switch (action) {
    //   case 'view':
    //     this.editVendorInvoice(row);
    //     break;
    //   case 'delete':
    //     this.deleteVendorInvoice(row);
    //     break;
    //   default:
    //     console.log('Unknown table action:', action);
    // }
  }

  navigateToMasterJob(invoice: any): void {
    const departmentType = String(invoice?.departmentMaster?.departmentType).toUpperCase();

    if (invoice && departmentType) {
      const masterJobSid = invoice.MasterJobSid;
      if (departmentType === 'SEA') {
        this.router.navigate(['/operation/master-job/entry', masterJobSid]);
      } else if (departmentType === 'AIR') {
        this.router.navigate(['/operation/mawbill/entry', masterJobSid]);
      } else {
        console.warn('Unknown department type:', departmentType);
      }
    } else {
      this.appSettingService.showWarning('Master Job not available');
    }
  }
  navigateToHouse(row: any): void {
    if (row?.HouseJobSid) {
      this.router.navigate(['/operation/house-job/entry', row.HouseJobSid]);
    } else {
      this.appSettingService.showWarning('House Job not available');
    }
  }

  navigateToBooking(row: any): void {
    if (row?.BookingHeaderSid) {
      this.router.navigate(['/operation/booking/entry', row.BookingHeaderSid]);
    } else {
      this.appSettingService.showWarning('Booking not available');
    }
  }

  onTableSortChange(sort: any): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: any[]): void {
    // Handle column filters if needed
    console.log('Filters changed:', filters);
  }

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = {
      ...this.getDefaultFilters(),
      ...event.filters,
      dateRange: event.filters?.dateRange ?? this.getDefaultFilters().dateRange,
      dateType: event.filters?.dateType || 'VoucherDate'
    };
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

  private getLast30FromDate(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }

  private getDefaultFilters(): AdvancedFilterValues {
    return {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'VoucherDate'
    };
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
        const itemCustomerName = String(item?.PartyName ?? item?.VendorName ?? item?.CustomerName ?? '').trim().toUpperCase();
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

  viewVendorInvoice(vendorInvoice: any) {
    if(vendorInvoice.CashOrBank === 'Y'){
      this.router.navigate(['/operation/vendor-invoice/entry', vendorInvoice.VoucherHeaderSid],{
        queryParams : {isNonJob : true}
      });
    } else {
      this.router.navigate(['/operation/vendor-invoice/entry', vendorInvoice.VoucherHeaderSid]);
    }
  }

  editVendorInvoice(vendorInvoice: any) {
    if(vendorInvoice.CashOrBank === 'Y'){
      this.router.navigate(['/operation/vendor-invoice/entry', vendorInvoice.VoucherHeaderSid],{
        queryParams : {isNonJob : true}
      });
    } else {
      this.router.navigate(['/operation/vendor-invoice/entry', vendorInvoice.VoucherHeaderSid]);
    }
  }

  deleteVendorInvoice(vendorInvoice: any) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.spinner.show();
        this.accountService.deleteVoucher({
          VoucherHeaderSid: vendorInvoice.VoucherHeaderSid,
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          BranchMasterSid: this.currentBranch?.BranchMasterSid,
          UserEmail: this.userData?.userEmail
        }).subscribe({
          next: (response: any) => {
            this.spinner.hide();
            if (response.status) {
              this.appSettingService.showSuccess(response.message || 'Vendor Invoice deleted successfully');
              this.search();
            } else {
              this.appSettingService.showError(response.message || 'Failed to delete Vendor Invoice');
            }
          },
          error: (error) => {
            console.error('Error deleting Vendor Invoice:', error);
            this.appSettingService.showError('Failed to delete Vendor Invoice');
            this.spinner.hide();
          }
        });
      }
    });
  }

  exportExcel() {
    this.excelReportService.exportAsExcel({
      data: this.allItems,
      headers: [
        { key: 'VoucherNumber', label: 'Vendor Invoice No' },
        { key: 'VoucherNumber', label: 'Vendor Invoice No' },
        { key: 'VoucherDate', label: 'Invoice Date' },
        { key: 'VendorName', label: 'Vendor Name' },
        { key: 'BillNo', label: 'Bill No' },
        { key: 'BillDate', label: 'Bill Date' },
        { key: 'CurrencyCode', label: 'Currency' },
        { key: 'LocalAmount', label: 'Amount' },
        // { key: 'TDSAmount', label: 'TDS Amount' },
        { key: 'MBLNo', label: 'MBL No' },
        { key: 'HBLNo', label: 'HBL No' },
        { key: 'BookingNo', label: 'Booking No' },
        { key: 'PostStatus', label: 'Posted Status' },
        { key: 'Status', label: 'Status' }
      ],
      fileName: 'Vendor_Invoices',
      sheetName: 'Vendor Invoices'
    });
  }

  updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'report') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 };
      }
      return action;
    });

    this.modalDropdownItems = this.modalDropdownItems.map(item => {
      if (item.action === 'exportExcel') {
        return { ...item, disabled: this.totalLengthOfCollection === 0 };
      }
      return item;
    });
  }
}
