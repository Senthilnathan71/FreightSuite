// receipt-list.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
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
import { ReceiptService } from '../../services/receipt.service';
import { ReceiptFilter, ReceiptListItem } from '../../models/receipt.model';
import { AccountsService } from '../../accounts.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { VoucherActionGuardService } from 'src/app/shared/services/voucher-action-guard.service';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  DropdownFilterConfig,
  PartyFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';

/**
 * Receipt List Component
 * Displays list of receipt vouchers with search, filter, and pagination
 * Follows the same design pattern as invoice-list component
 */
@Component({
  selector: 'app-receipt-list',
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
  templateUrl: './receipt-list.component.html',
  styleUrl: './receipt-list.component.scss'
})
export class ReceiptListComponent extends BaseListComponent implements OnInit {
  @ViewChild('receiptTable') receiptTable!: ReusableTableComponent;

  searchType = 'VoucherNumber';
  results: any[] = [];
  receiptList: any[] = [];
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
  dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [{ label: 'Receipt Date', value: 'VoucherDate' }],
    defaultValue: 'VoucherDate'
  };
  partyFilterConfig: PartyFilterConfig = {
    enabled: true,
    partyTypes: [{ label: 'Customer', value: 'CustomerMasterSid' }],
    defaultPartyType: 'CustomerMasterSid'
  };
  currencyFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Curr',
    options: [],
    bindLabel: 'currencyCode',
    bindValue: 'currencyCode'
  };
  postStatusFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'PostStatus',
    options: [
      { label: 'Posted', value: 'P' },
      { label: 'Unposted', value: 'U' }
    ],
    bindLabel: 'label',
    bindValue: 'value'
  };
  currentFilters: AdvancedFilterValues = {};

  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'receipt-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'VoucherDate',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with template
  get allReceipts() { return this.allItems; }

  constructor(
    private mps : MenuPermissionService,
    private receiptService: ReceiptService,
    private accountService : AccountsService,
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

    if (userProfile) {
      this.userData = userProfile;
    }

    this.initializeHeaderActions();
    this.initializeTableConfig();
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'VoucherDate'
    };
    this.loadFilterLookups();
    this.mps.init().subscribe(()=>{
      this.initializeHeaderActions();
      this.initializeTableConfig();
      
    })
    this.initializeModalDropdownItems();
    super.ngOnInit();
  }


  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.receiptService.searchReceipts(this.getSearchParams());
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
      params['DateFrom'] = this.currentFilters.dateRange.fromDate;
    }
    if (this.currentFilters.dateRange?.toDate) {
      params['dateTo'] = this.currentFilters.dateRange.toDate;
      params['DateTo'] = this.currentFilters.dateRange.toDate;
    }
    if (this.currentFilters.dateType) {
      params['dateField'] = this.currentFilters.dateType;
      params['DateField'] = this.currentFilters.dateType;
    }
    if (this.currentFilters.party?.partyId) {
      params['PartyMasterSid'] = this.currentFilters.party.partyId;
      params['partyMasterSid'] = this.currentFilters.party.partyId;
    }
    if (this.currentFilters.party?.partyName) {
      params['CustomerName'] = this.currentFilters.party.partyName;
      params['PartyName'] = this.currentFilters.party.partyName;
    }
    if (this.currentFilters.pol) {
      params['CurrencyCode'] = this.currentFilters.pol;
      params['currencyCode'] = this.currentFilters.pol;
    }
    if (this.currentFilters.extra) {
      params['PostStatus'] = this.currentFilters.extra;
      params['postStatus'] = this.currentFilters.extra;
    }

    return params;
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();

    // Handle both array response and paginated response
    if(response && response.status){
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
      this.allItems = rawItems.map((item: any) => ({
        ...item,
        VoucherDateRaw: item?.VoucherDate,
        PostStatusCode: item?.PostStatus,
        ListAmount : this.formatAmount(item.VoucherDetail[0]?.PartyAmount || 0),
        CashOrBank : item.CashOrBank === 'C' ? 'Cash' : 'Bank',
        VoucherDate: this.datePipe.transform(item?.VoucherDate),
        PostStatus : item.PostStatus === 'P' ? 'Posted' : 'Unposted',
        Status: item.Status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response?.data?.totalCount || rawItems.length || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching receipts.');
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
    this.spinner.hide();
    this.appSettingService.showError('Error searching receipts.');
    console.error('Error searching receipts', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadReceipt();
  }

  loadReceipt() {
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

  partySearchFn = (_searchTerm: string, partyType: string): Observable<any[]> => {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    const branchMasterSid = this.currentBranch?.BranchMasterSid;
    if (!companyMasterSid || !branchMasterSid || partyType !== 'CustomerMasterSid') {
      return of([]);
    }
    const payload = {
      CompanyMasterSid: companyMasterSid,
      BranchMasterSid: branchMasterSid
    };

    return this.accountService.getAllDebtorWithCOAMapped(payload).pipe(
      map((response: any) => {
        const rows = Array.isArray(response?.data) ? response.data : [];
        const customers = rows
          .map((row: any) => ({
            ...row,
            CustomerMasterSid:
              row?.SubledgerMasterSid ??
              row?.subledgerMasterSid ??
              row?.PartyMasterSid ??
              row?.partyMasterSid ??
              row?.CustomerMasterSid ??
              null,
            CustomerName: row?.CustomerName ?? ''
          }))
          .filter((row: any) => !!row.CustomerMasterSid && !!row.CustomerName);

        return Array.from(new Map(customers.map((c: any) => [c.CustomerMasterSid, c])).values());
      }),
      catchError(() => of([]))
    );
  };

  override trackBy(index: number, item: any): number {
    return item.VoucherHeaderSid || index;
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
          key: 'VoucherNumber',
          label: 'Receipt No',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          
        },
        {
          key: 'VoucherDate',
          label: 'Receipt Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: '130px'
        },
        {
          key: 'CashOrBank',
          label: 'Cash or Bank',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          
        },
        {
          key: 'PartyName',
          label: 'Customer Name',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: '200px',
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
          dataType: 'number',
          width: '130px',
          cellClass: 'text-end'
        },
        
        {
          key: 'PostStatus',
          label: 'Post Status',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'number',
          width: '130px',
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
      ],
      actions: [
        // {
        //   icon: 'fas fa-file',
        //   label: 'View',
        //   action: 'view',
        //   tooltip: 'View Receipt',
        // },
        {
          icon: 'fas fa-eye',
          label: 'View',
          action: 'view',
          tooltip: 'View Receipt',
          // state: !this.mps.can('view')
        },
        // {
        //   icon: 'fas fa-undo',
        //   label: 'Reverse',
        //   action: 'reverse',
        //   tooltip: 'Reverse Receipt',
        //   class: 'text-warning',
        // },
        {
          icon: 'fas fa-trash',
          label: 'Delete',
          action: 'delete',
          tooltip: 'Delete Receipt',
          class: 'text-danger',
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
      emptyMessage: 'No receipts found',
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
        this.navigateToAddNewReceipt();
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
      this.viewReceipt(event.row);
    } else if (event.action === 'edit') {
      this.editReceipt(event.row);
    } else if (event.action === 'reverse') {
      this.reverseReceipt(event.row);
    } else if (event.action === 'delete') {
      this.deleteReceiptByRow(event.row);
    }
  }

  viewReceipt(row: any) {
    this.router.navigate(['accounts/receipt/entry/', row.VoucherHeaderSid]);
  }

  editReceipt(row: any) {
    this.router.navigate(['accounts/receipt/entry/', row.VoucherHeaderSid]);
  }

  reverseReceipt(row: any) {
    const blockedReason = this.voucherActionGuard.getReverseBlockedReason({
      documentName: 'Receipt',
      headerId: row?.VoucherHeaderSid,
      status: row?.Status,
      postStatus: row?.PostStatus,
      canUpdate: this.mps.can('update'),
      blockedByCondition: row?.Status !== 'Active' || row?.PostStatus !== 'Posted',
      blockedConditionReason: 'Only posted active receipts can be reversed.'
    });
    if (this.voucherActionGuard.block(blockedReason)) return;

    // TODO: Implement receipt reversal
    if (confirm(`Are you sure you want to reverse receipt ${row.VoucherNumber}?`)) {
      this.receiptService.reverseReceipt(row.VoucherHeaderSid, {
        VoucherHeaderSid: row.VoucherHeaderSid,
        ReversalDate: new Date().toISOString().split('T')[0],
        Reason: 'Manual reversal',
        ReversedBy: this.userData?.userName || 'system'
      }).subscribe({
        next: () => {
          this.appSettingService.showSuccess('Receipt reversed successfully');
          this.loadReceipts();
        },
        error: (error) => {
          this.appSettingService.showError('Failed to reverse receipt');
          console.error('Error reversing receipt:', error);
        }
      });
    }
  }

  deleteReceiptByRow(row: any) {
    this.deleteReceipt(row);
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
    // console.log('Filters changed:', filters);
  }

  report(): void {
    const formattedData = this.allReceipts;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns from table
    const visibleColumns = this.receiptTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Receipt-Report',
      title: companyName
    });
  }

  loadReceipts(): void {
    this.spinner.show();
    this.loading = true;

    const filter: ReceiptFilter = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherNumber: this.filterValue?.trim() || '',
    };

    this.receiptService.searchReceipts(filter).subscribe({
      next: (response: any) => {
        // Handle both array response and object with data property
        const receipts = Array.isArray(response) ? response : (response.data || []);

        this.results = this.processReceiptData(receipts);
        this.receiptList = this.results;
        this.totalLengthOfCollection = receipts.length;
        this.allItems = this.results.map(item => ({
          ...item,
          PostStatus : item.PostStatus === 'P' ? 'Posted' : 'Unposted',
          VoucherDate: this.datePipe.transform(item.VoucherDate),
          Status: item.Status === 'A' ? 'Active' : 'Suspended'
        }));
        this.applySorting();
        this.searchPerformed = true;
        this.spinner.hide();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching receipts:', err);
        this.results = [];
        this.receiptList = [];
        this.totalLengthOfCollection = 0;
        this.loading = false;
        this.spinner.hide();
      }
    });
  }

  private processReceiptData(receipts: any[]): any[] {
    return receipts.map(receipt => {
      // Calculate amounts if needed from voucher details
      if (!receipt.TotalAmount && receipt.voucherDetails) {
        receipt.TotalAmount = receipt.voucherDetails.reduce((total: number, detail: any) => {
          return total + (detail.Amount || 0);
        }, 0);
      }

      // Get customer name from subledger if available
      if (receipt.voucherTransactions && receipt.voucherTransactions.length > 0) {
        const customerTxn = receipt.voucherTransactions.find((txn: any) => txn.SubledgerMaster);
        if (customerTxn) {
          receipt.CustomerName = customerTxn.SubledgerMaster.SubledgerName;
        }
      }

      // Get branch name
      if (receipt.branch) {
        receipt.BranchName = receipt.branch.branchName;
      }

      return receipt;
    });
  }

  updatePaginatedData(): void {
    this.loadReceipts();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteReceipt(receipt: any) {
    const blockedReason = this.voucherActionGuard.getDeleteBlockedReason({
      documentName: 'Receipt',
      status: receipt?.Status,
      postStatus: receipt?.PostStatus,
      canDelete: this.mps.can('delete'),
      blockedByCondition: receipt?.Status !== 'Active' || receipt?.PostStatus !== 'Unposted'
    });
    if (this.voucherActionGuard.block(blockedReason)) return;

    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.spinner.show();
        this.accountService.deleteVoucher({
          VoucherHeaderSid: receipt.VoucherHeaderSid,
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          BranchMasterSid: this.currentBranch?.BranchMasterSid,
          UserEmail: this.userData?.userEmail
        }).subscribe({
          next: (resp: any) => {
            this.spinner.hide();
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message || 'Receipt deleted successfully');
              this.search();
            } else {
              this.appSettingService.showError(resp.message || 'Failed to delete receipt');
            }
          },
          error: (error) => {
            console.error('Error deleting receipt:', error);
            this.appSettingService.showError('Failed to delete receipt');
            this.spinner.hide();
          }
        });
      }
    });
  }

  navigateToAddNewReceipt() {
    const blockedReason = this.voucherActionGuard.getInsertBlockedReason({
      documentName: 'Receipt',
      canInsert: this.mps.can('insert')
    });
    if (this.voucherActionGuard.block(blockedReason)) return;

    this.router.navigate(['accounts/receipt/entry']);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
  }

  private loadFilterLookups(): void {
    this.accountService.getAllCurrencies().subscribe({
      next: (rows: any[]) => {
        const currencies = Array.isArray(rows)
          ? rows
              .map((row: any) => ({
                ...row,
                currencyCode: row?.currencyCode || row?.CurrencyCode || row?.code || ''
              }))
              .filter((c: any) => !!c.currencyCode)
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
    const selectedCustomerSid = this.currentFilters.party?.partyId ? Number(this.currentFilters.party.partyId) : null;
    const selectedCustomerName = this.currentFilters.party?.partyName
      ? String(this.currentFilters.party.partyName).trim().toUpperCase()
      : '';
    const selectedCurrency = this.currentFilters.pol ? String(this.currentFilters.pol).trim().toUpperCase() : '';
    const selectedPostStatus = this.currentFilters.extra ? String(this.currentFilters.extra).trim().toUpperCase() : '';

    if (!from && !to && !selectedCustomerSid && !selectedCustomerName && !selectedCurrency && !selectedPostStatus) {
      return items;
    }

    return items.filter((item: any) => {
      const itemCustomerSid = Number(item?.CustomerMasterSid ?? item?.customerMaster?.CustomerMasterSid ?? 0);
      const itemCustomerName = String(item?.PartyName ?? item?.CustomerName ?? '').trim().toUpperCase();
      const sidMatch = selectedCustomerSid ? itemCustomerSid === selectedCustomerSid : false;
      const nameMatch = selectedCustomerName ? itemCustomerName === selectedCustomerName : false;
      if ((selectedCustomerSid || selectedCustomerName) && !(sidMatch || nameMatch)) {
        return false;
      }

      const itemCurrency = String(item?.CurrencyCode ?? '').trim().toUpperCase();
      if (selectedCurrency && itemCurrency !== selectedCurrency) {
        return false;
      }

      const itemPostStatus = String(item?.PostStatus ?? '').trim().toUpperCase();
      if (selectedPostStatus && itemPostStatus !== selectedPostStatus) {
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
