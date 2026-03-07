import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { catchError, map, Observable, of } from 'rxjs';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { OperationService } from '../../operation.service';
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
  selector: 'app-vendor-credit-note-list',
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
  templateUrl: './vendor-credit-note-list.component.html',
  styleUrl: './vendor-credit-note-list.component.scss'
})
export class VendorCreditNoteListComponent extends BaseListComponent implements OnInit{
  @ViewChild('vendorCreditNoteTable') vendorCreditNoteTable!: ReusableTableComponent;
  searchType = 'VendorCreditNoteNo';
  results: any[] = [];
    vendorCreditNoteList: any[] = [];
    vendorInvoiceList: any[] = [];
    companyMap: { [id: number]: string } = {};
    userData: any;
    loading = false;
    isFavorite: boolean = false;
    permissions: string[] = [];
    currentMenuPermissions: any = {};
    masterJobMap: { [id: number]: string } = {};
    houseJobMap: { [id: number]: string } = {};
  
    // Company
    currentCompany: any;
    currentBranch: any;
  
    toggleFavorite() {
      this.isFavorite = !this.isFavorite;
    }
  
    tableConfig:TableConfig;
    private initializeTableConfig() {
    this.tableConfig = {
      columns: [
         {
          key: 'VoucherNumber',
          label: 'Vendor CreNote No',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: "170px"
        },
        {
        key: 'ReversalVoucherNumber',
        label: 'Vendor Invo No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        template: 'link'       
      },
        {
          key: 'VoucherDate',
          label: 'Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: '100px',
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
          width: '100px',
        },
        {
          key: 'BillDate',
          label: 'Bill Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: '100px',
        },
        {
          key: 'CurrencyCode',
          label: 'Curr',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
         
        },
        {
          key: 'AmountFormatted',
          label: 'Amt',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'number',
        },
        {
          key: 'MBLNo',
          label: 'MBL No',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: '120px',
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
          tooltip: 'View Vendor Credit Note',
          state: !this.mps.can('view')
        },
         {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete ',
        class: "text-danger",
        state: !this.mps.can('delete'),
        condition: (row: any) => row.Status === 'Active' && row.PostStatus === 'Unposted'
      }
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'VoucherHeaderSid',
      emptyMessage: 'No Vendor CreditNote found',
      dragAndDrop: true
    }
  };
  
    headerActions: HeaderAction[] = [];
    modalDropdownItems: DropdownMenuItem[] = [];
    tableLoading = false;
    dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
    dateTypeConfig: DateTypeConfig = {
      enabled: true,
      options: [
        { label: 'Credit Date', value: 'VoucherDate' },
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
      storageKey: 'vendor-credit-note-list-state',
      defaultPageSize: 10,
      defaultSortColumn: 'VendorCreditNoteNo',
      defaultSortDirection: 'desc',
      pageSizeOptions: [10, 20, 50, 100, 500],
      maxPagesToShow: 3
    };
  
    // Alias for compatibility with existing template
    get allVendorCreditNote() { return this.allItems; }
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
      public mps : MenuPermissionService,
    ) {
      super(paginationService);
    }
  
    override ngOnInit() {
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
      const userProfile = this.appSettingService.getDecryptedUserProfile();
  
      if (userProfile) {
        this.userData = userProfile;
       ;
      }
  
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
        dateType: 'VoucherDate'
      };
      this.loadCurrencies();
      this.initializeHeaderActions();
      this.initializeTableConfig();
      this.initializeModalDropdownItems();
      super.ngOnInit();
      // this.loadVendorInvoices();
    }
  
 
  
    loadVendorInvoices() {
      const CompanyMasterSid = this.currentCompany?.CompanyMasterSid
    this.operationService.getAllVendorInvoice(CompanyMasterSid).subscribe({
      next: (resp: any) => {
        this.vendorInvoiceList = resp?.data || resp || [];
        // Now load credit notes after invoices are loaded
        this.loadVendorCreditNotes();
      },
      error: (err) => {
        console.error('Error loading invoices', err);
        this.vendorInvoiceList = [];
        this.loadVendorCreditNotes();
      }
    });
  }

    protected searchItems(): Observable<any> {
      this.tableLoading = true;
      this.spinner.show();
      return this.operationService.searchVendorCreditNote(this.getSearchParams());
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
          Status: item.Status === 'A' ? 'Active' : 'Suspended',
          PostStatus: item.PostStatus === 'P' ? 'Posted' : 'Unposted',
          AmountFormatted: this.formatAmount(item.Amount)

        }));
        this.totalLengthOfCollection = response?.data?.totalCount || filteredItems.length || 0;
        this.applySorting();
        this.updateHeaderActionState();
      } else {
        this.appSettingService.showError('Error searching Vendor CreditNotes.');
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

    getInvoiceNumber(reversalVoucherId: number): string {
    if (!reversalVoucherId) return '-';
    
    const invoice = this.vendorInvoiceList.find(inv => 
      inv.VoucherHeaderSid === reversalVoucherId || 
      inv.voucherHeaderSid === reversalVoucherId
    );
    
    return invoice ? invoice.VoucherNumber : `ID: ${reversalVoucherId}`;
  }
  
  goToVendorInvoice(voucherHeaderSid: number) {
  if (!voucherHeaderSid) return;
  this.router.navigate(['/operation/vendor-invoice/view', voucherHeaderSid]);
}

    protected override handleSearchError(error: any): void {
      this.tableLoading = false;
      this.spinner.hide();
      this.appSettingService.showError('Error searching Vendor CreditNote.');
      console.error('Error searching Vendor CreditNote', error);
      super.handleSearchError(error);
    }
  
    onSearchTriggered(searchValue: string): void {
      this.filterValue = searchValue;
      this.loadVendorCreditNotes();
    }
  
    loadVendorCreditNotes() {
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
  
    onHeaderAction(action: string) {
      switch (action) {
        case 'create':
          this.onCreate();
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
      this.router.navigate(['/operation/vendor-credit-note/entry']);
    }
  
    onReport() {
      if (this.allItems.length > 0) {
        this.exportExcel();
      }
    }

    onTableRowClick(row: any): void {
    // Row clicking can be handled by the table component if needed
  }
  
    onReset() {
     this.currentFilters = this.getDefaultFilters();
    this.resetPage();
    }
  
    onTableAction(event: TableEventData): void {
      if (event.column?.key === 'ReversalVoucherNumber') {
    // Clicking VENDOR INVOICE link
    this.navigateToVendorInvoice(event.row.ReversalVoucher);
    return;
  }
      if (event.action === 'view') {
        this.editVendorCreditNote(event.row);
      } else if (event.action === 'delete') {
        this.deleteVendorCreditNote(event.row);
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

    navigateToVendorInvoice(voucherSid: number) {
  if (!voucherSid) return;

  this.router.navigate([
    '/operation/vendor-invoice/entry',
    voucherSid
  ]);
}
  
    viewVendorCreditNote(vendorCreditNote: any) {
      this.router.navigate(['/operation/vendor-credit-note/view', vendorCreditNote.VoucherHeaderSid]);
    }
  
    editVendorCreditNote(vendorCreditNote: any) {
      this.router.navigate(['/operation/vendor-credit-note/entry', vendorCreditNote.VoucherHeaderSid]);
    }
  
    deleteVendorCreditNote(vendorCreditNote: any) {
      const dialogRef = this.dialog.open(DeleteWarningComponent);

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.spinner.show();
          this.accountService.deleteVoucher({
            VoucherHeaderSid: vendorCreditNote.VoucherHeaderSid,
            CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
            BranchMasterSid: this.currentBranch?.BranchMasterSid,
            UserEmail: this.userData?.userEmail
          }).subscribe({
            next: (response: any) => {
              this.spinner.hide();
              if (response.status) {
                this.appSettingService.showSuccess(response.message || 'Vendor CreditNote deleted successfully');
                this.search();
              } else {
                this.appSettingService.showError(response.message || 'Failed to delete Vendor CreditNote');
              }
            },
            error: (error) => {
              this.spinner.hide();
              this.appSettingService.showError('Error deleting Vendor CreditNote');
              console.error('Error deleting Vendor CreditNote:', error);
            }
          });
        }
      });
    }
  
    exportExcel() {
      this.excelReportService.exportAsExcel({
        data: this.allItems,
        headers: [
          { key: 'VoucherNumber', label: 'Vendor CreditNote No' },
          { key: 'ReversalVoucherNumber', label: 'Vendor Invo No' },
          { key: 'VoucherDate', label: 'Date' },
          { key: 'VendorName', label: 'Vendor Name' },
          { key: 'BillNo', label: 'Bill No' },
          { key: 'BillDate', label: 'Bill Date' },
          { key: 'CurrencyCode', label: 'Currency' },
          { key: 'LocalAmount', label: 'Amount' },
          { key: 'MBLNo', label: 'MBL No' },
          // { key: 'HBLNo', label: 'HBL No' },
          { key: 'Status', label: 'Status' }
        ],
        fileName: 'Vendor_CreditNote',
        sheetName: 'Vendor CreditNote'
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
