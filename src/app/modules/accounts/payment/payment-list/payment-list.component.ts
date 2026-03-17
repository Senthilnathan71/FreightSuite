
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { MasterService } from 'src/app/modules/master/master.service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ToolsDropdownComponent, DropdownMenuItem } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { PaymentListItem, PaymentFilter } from '../../models/payment.model';
import { PaymentService } from '../../services/payment.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { AccountsService } from '../../accounts.service';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  DropdownFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';

/**
 * Payment List Component
 * Displays list of payment vouchers with search, filter, and pagination
 * Supports Cash and Bank payments
 */
@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FeatherModule,
    NgbPaginationModule,
    MatDialogModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent,
    CustomDatePipe
  ],
  providers: [CustomDatePipe],
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss']
})
export class PaymentListComponent extends BaseListComponent implements OnInit {
  @ViewChild('paymentTable') paymentTable!: ReusableTableComponent;

  searchType = 'VoucherNumber';
  results: any[] = [];
  paymentList: any[] = [];
  allPayments: PaymentListItem[] = [];
  companyMap: { [id: number]: string } = {};
  userData: any;
  loading = false;
  tableLoading = false;
  isFavorite: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};

  // Company & Branch
  currentCompany: any;
  currentBranch: any;

  protected config: ListComponentConfig = {
    storageKey: 'payment-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'VoucherDate',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Filters
  selectedPaymentMode = 'All'; // All, Cash, Bank
  dateFrom?: string;
  dateTo?: string;
  dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [
      { label: 'Payment Date', value: 'VoucherDate' },
      { label: 'Post Date', value: 'PostDate' }
    ],
    defaultValue: 'VoucherDate'
  };
  partyNameFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'PartyName',
    options: [],
    bindLabel: 'PartyName',
    bindValue: 'PartyName'
  };
  currencyFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Currency',
    options: [],
    bindLabel: 'currencyCode',
    bindValue: 'currencyCode'
  };
  cashOrBankFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Cash or Bank',
    options: [
      { label: 'Cash', value: 'C' },
      { label: 'Bank', value: 'B' }
    ],
    bindLabel: 'label',
    bindValue: 'value'
  };
  currentFilters: AdvancedFilterValues = {};

  tableConfig: TableConfig ;

  headerActions: HeaderAction[] = [
    {
      label: 'New Payment',
      icon: 'fas fa-plus',
      action: 'create',
      cssClass: 'btn-info'
    },
    {
      label: 'Refresh',
      icon: 'fas fa-sync-alt',
      action: 'refresh'
    },
    {
      label: 'Export',
      icon: 'fas fa-file-export',
      action: 'export'
    }
  ];

  toolsMenuItems: DropdownMenuItem[] = [
    {
      label: 'Import Payments',
      icon: 'fas fa-file-import',
      action: 'import'
    },
    {
      label: 'Export to Excel',
      icon: 'fas fa-file-excel',
      action: 'export-excel'
    },
    {
      label: 'Export to PDF',
      icon: 'fas fa-file-pdf',
      action: 'export-pdf'
    },
    {
      label: 'Print',
      icon: 'fas fa-print',
      action: 'print'
    }
  ];

  get Allpayment() { return this.allItems; }

  constructor(
    public mps : MenuPermissionService,
    public router: Router,
    public dialog: MatDialog,
    public appSettingsService: AppSettingsService,
    public spinner: NgxSpinnerService,
    public excelService: ExcelExportService,
    private paymentService: PaymentService,
    private accountService: AccountsService,
    private datePipe: CustomDatePipe,
    paginationService : PaginationService
  ) {
    super(paginationService)
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingsService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingsService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(()=>{
      this.initializeHeaderActions();
      this.initializeTableConfig();
    });
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'VoucherDate'
    };
    this.loadFilterLookups();

    super.ngOnInit();
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


  initializeTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'VoucherNumber',
          label: 'Payment No',
          sortable: true,
          filterable: true,
          visible: true,
          width: '120px',
          // cellClass: 'fw-bold text-primary'
        },
        {
          key: 'VoucherDate',
          label: 'Payment Date',
          sortable: true,
          filterable: true,
          visible: true,
          width: '140px'
        },
        {
          key: 'CashOrBank',
          label: 'Cash or Bank',
          sortable: true,
          filterable: true,
          visible: true,
          width: '140px'
        },
        {
          key: 'PartyName',
          label: 'Party Name',
          sortable: true,
          filterable: true,
          visible: true,
          width: '200px',
          cellClass: 'text-truncate'
        },
        {
          key: 'CurrencyCode',
          label: 'Currency',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'number',
          width: '120px',
        },
        {
          key: 'ListAmount',
          label: 'Amount',
          sortable: true,
          filterable: true,
          visible: true,
          width: '130px',
          cellClass: 'text-end pe-5'
        },
        {
          key: 'CreatedBy',
          label: 'Created By',
          sortable: true,
          filterable: true,
          visible: true,
          width: '160px',
          cellClass: 'text-truncate'
        },
        {
            key: 'PostDate',
            label: 'Posted Date',
            sortable: true,
            filterable: true,
            visible: true,
            width: '140px'
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
          tooltip: 'View Payment',
          state: !this.mps.can('view')
        },
        {
          icon: 'fas fa-trash',
          label: 'Delete',
          action: 'delete',
          tooltip: 'Delete Payment',
          state: !this.mps.can('delete'),
          condition: (row: any) => row.Status === 'Active' && row.PostStatus === 'Unposted',
          class: "text-danger"
        }
      ],
      selectable: true,
      showPagination: true,
      showColumnToggle: true,
      emptyMessage: 'No payment vouchers found',
      loadingMessage: 'Loading payments...'
    }
  }

  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.paymentService.searchPayment(this.getSearchParams());
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
    if (this.currentFilters.departmentSid) {
      params.PartyName = this.currentFilters.departmentSid;
      params.partyName = this.currentFilters.departmentSid;
    }
    if (this.currentFilters.pol) {
      params.CurrencyCode = this.currentFilters.pol;
      params.currencyCode = this.currentFilters.pol;
    }
    if (this.currentFilters.pod) {
      params.CashOrBank = this.currentFilters.pod;
      params.cashOrBank = this.currentFilters.pod;
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
        CashOrBank : item.CashOrBank === 'C' ? 'Cash' : 'Bank',
        ListAmount : Number(item.VoucherDetail[0]?.PartyAmount || 0).toFixed(2),
        VoucherDateRaw: item.VoucherDate,
        PostDateRaw: item.PostDate,
        VoucherDate : this.datePipe.transform(item.VoucherDate),
        PostDate: this.datePipe.transform(item.PostDate),
        PostStatus : item.PostStatus === 'P' ? 'Posted' : 'Unposted',
        Status: item.Status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response?.data?.totalCount || rawItems.length || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingsService.showError('Error searching payments.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingsService.showError('Error searching payments.');
    console.error('Error searching payments', error);
    super.handleSearchError(error);
  }

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'report') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 };
      }
      return action;
    });
  }

  onTableFilterChange(filters: TableFilter[]): void {
    // For now, we'll handle this with the existing search functionality
    // In a more advanced implementation, you could apply individual column filters
    console.log('Filters changed:', filters);
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableRowClick(row: any): void {
    // Row clicking can be handled by the table component if needed
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.navigateToCreate();
        break;
      case 'report':
        this.exportToExcel();
        break;
      case 'reset':
        this.resetPage();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  navigateToCreate() {
    this.router.navigate(['accounts/payment/entry'])
  }






  /**
   * Handle search triggered from header
   */
  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.search();
  }

  /**
   * Handle header actions
   */
  onHeaderAction(action: string): void {
    switch (action) {
      case 'create':
        this.router.navigate(['accounts/payment/entry']);
        break;
      case 'export':
        this.exportToExcel();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  /**
   * Handle table actions (view, edit, delete, etc.)
   */
  onTableActionClick(event: TableEventData): void {
    const payment = event.row;

    switch (event.action) {
      case 'view':
        this.viewPayment(payment.VoucherHeaderSid);
        break;
      case 'edit':
        this.editPayment(payment.VoucherHeaderSid);
        break;
      case 'reverse':
        this.reversePayment(payment);
        break;
      case 'delete':
        this.deletePayment(payment);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  /**
   * View payment details
   */
  viewPayment(id: number): void {
    this.router.navigate(['accounts/payment/entry', id]);
  }

  /**
   * Edit payment
   */
  editPayment(id: number): void {
    this.router.navigate(['accounts/payment/entry', id]);
  }

  /**
   * Reverse payment voucher
   */
  reversePayment(payment: any): void {
    const dialogRef = this.dialog.open(DeleteWarningComponent, {
      data: {
        title: 'Reverse Payment',
        message: `Are you sure you want to reverse payment voucher ${payment.VoucherNumber}?`,
        confirmText: 'Reverse',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.spinner.show();

        const reverseRequest = {
          VoucherHeaderSid: payment.VoucherHeaderSid,
          ReversalDate: new Date().toISOString().split('T')[0],
          ReversalReason: 'Payment reversal',
          ReversedBy: this.userData?.userName
        };

        this.paymentService.reversePayment(reverseRequest).subscribe({
          next: () => {
            this.appSettingsService.showSuccess('Payment reversed successfully');
            this.search();
            this.spinner.hide();
          },
          error: (error) => {
            console.error('Error reversing payment:', error);
            this.spinner.hide();
          }
        });
      }
    });
  }

  /**
   * Delete payment voucher
   */
  deletePayment(payment: any): void {
    const dialogRef = this.dialog.open(DeleteWarningComponent, {
      data: {
        title: 'Delete Payment',
        message: `Are you sure you want to delete payment voucher ${payment.VoucherNumber}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.spinner.show();

        this.accountService.deleteVoucher({
          VoucherHeaderSid: payment.VoucherHeaderSid,
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          BranchMasterSid: this.currentBranch?.BranchMasterSid,
          UserEmail: this.userData?.userEmail
        }).subscribe({
          next: (resp: any) => {
            this.spinner.hide();
            if (resp.status) {
              this.appSettingsService.showSuccess(resp.message || 'Payment deleted successfully');
              this.search();
            } else {
              this.appSettingsService.showError(resp.message || 'Failed to delete payment');
            }
          },
          error: (error) => {
            console.error('Error deleting payment:', error);
            this.appSettingsService.showError('Failed to delete payment');
            this.spinner.hide();
          }
        });
      }
    });
  }

  /**
   * Export to Excel
   */
  exportToExcel(): void {
    const formattedData = this.allItems;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns from table
    const visibleColumns = this.paymentTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Payment-Voucher-Report',
      title: companyName
    });
  }

  /**
   * Handle tools menu actions
   */
  onToolsAction(action: string): void {
    switch (action) {
      case 'import':
        this.appSettingsService.showInfo('Import functionality coming soon');
        break;
      case 'export-excel':
        this.exportToExcel();
        break;
      case 'export-pdf':
        this.appSettingsService.showInfo('PDF export coming soon');
        break;
      case 'print':
        window.print();
        break;
      default:
        console.log('Unknown tools action:', action);
    }
  }

  /**
   * Check if this page is in favorites
   */
  checkIfFavorite(): boolean {
    // TODO: Implement favorite check
    return false;
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
    // TODO: Implement favorite persistence
    this.appSettingsService.showInfo(
      this.isFavorite ? 'Added to favorites' : 'Removed from favorites'
    );
  }

  /**
   * Filter by payment mode
   */
  filterByPaymentMode(mode: string): void {
    this.selectedPaymentMode = mode;
    this.search();
  }

  /**
   * Filter by date range
   */
  filterByDateRange(dateFrom: string, dateTo: string): void {
    this.dateFrom = dateFrom;
    this.dateTo = dateTo;
    this.search();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterValue = '';
    this.selectedPaymentMode = 'All';
    this.dateFrom = undefined;
    this.dateTo = undefined;
    this.search();
  }

  // Helper methods
  private getCurrentCompany(): any {
    // Get from session storage or auth service
    const companyStr = sessionStorage.getItem('selectedCompany');
    return companyStr ? JSON.parse(companyStr) : null;
  }

  private getCurrentBranch(): any {
    // Get from session storage or auth service
    const branchStr = sessionStorage.getItem('selectedBranch');
    return branchStr ? JSON.parse(branchStr) : null;
  }

  private getUserData(): any {
    // Get from session storage or auth service
    const userStr = sessionStorage.getItem('userData');
    return userStr ? JSON.parse(userStr) : null;
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'VoucherDate'
    };
    this.clearFilterValue();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
  }

  private loadFilterLookups(): void {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    const branchMasterSid = this.currentBranch?.BranchMasterSid;
    if (!companyMasterSid || !branchMasterSid) {
      return;
    }

    this.accountService.getAllCreditorWithCOAMapped({
      CompanyMasterSid :companyMasterSid,
      BranchMasterSid: branchMasterSid
    }).subscribe({
      next: (response: any) => {
        const rows = Array.isArray(response?.data) ? response.data : [];
        const parties = rows.map((row: any) => ({
          ...row,
          PartyName: row?.PartyName || row?.CustomerName || row?.VendorName || row?.SupplierName || ''
        })).filter((p: any) => !!p.PartyName);
        this.partyNameFilterConfig = {
          ...this.partyNameFilterConfig,
          options: Array.from(new Map(parties.map((p: any) => [p.PartyName, p])).values())
        };
      },
      error: () => {
        this.partyNameFilterConfig = { ...this.partyNameFilterConfig, options: [] };
      }
    });

    this.accountService.getAllCurrencies().subscribe({
      next: (rows: any[]) => {
        const currencies = Array.isArray(rows)
          ? rows.map((row: any) => ({
              ...row,
              currencyCode: row?.currencyCode || row?.CurrencyCode || row?.code || ''
            })).filter((c: any) => !!c.currencyCode)
          : [];
        this.currencyFilterConfig = { ...this.currencyFilterConfig, options: currencies };
      },
      error: () => {
        this.currencyFilterConfig = { ...this.currencyFilterConfig, options: [] };
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
    const selectedDateField = this.currentFilters.dateType || 'VoucherDate';
    const from = this.currentFilters.dateRange?.fromDate ? new Date(this.currentFilters.dateRange.fromDate) : null;
    const to = this.currentFilters.dateRange?.toDate ? new Date(this.currentFilters.dateRange.toDate) : null;
    const selectedParty = this.currentFilters.departmentSid ? String(this.currentFilters.departmentSid).trim().toUpperCase() : '';
    const selectedCurrency = this.currentFilters.pol ? String(this.currentFilters.pol).trim().toUpperCase() : '';
    const selectedCashOrBank = this.currentFilters.pod ? String(this.currentFilters.pod).trim().toUpperCase() : '';

    if (!from && !to && !selectedParty && !selectedCurrency && !selectedCashOrBank) {
      return items;
    }

    return items.filter((item: any) => {
      const itemParty = String(item?.PartyName ?? '').trim().toUpperCase();
      const itemCurrency = String(item?.CurrencyCode ?? '').trim().toUpperCase();
      const itemCashOrBank = String(item?.CashOrBank ?? '').trim().toUpperCase();

      if (selectedParty && itemParty !== selectedParty) {
        return false;
      }
      if (selectedCurrency && itemCurrency !== selectedCurrency) {
        return false;
      }
      if (selectedCashOrBank && itemCashOrBank !== selectedCashOrBank) {
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
}
