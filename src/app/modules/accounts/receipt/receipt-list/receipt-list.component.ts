// receipt-list.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
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
      
    })
    this.initializeModalDropdownItems();
    super.ngOnInit();
  }


  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.receiptService.searchReceipts(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams {
    return {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();

    // Handle both array response and paginated response
    if(response && response.status){
      this.allItems = (response.data.items || []).map((item: any) => ({
        ...item,
        ListAmount : this.formatAmount(item.VoucherDetail[0]?.LocalAmount || 0),
        CashOrBank : item.CashOrBank === 'C' ? 'Cash' : 'Bank',
        VoucherDate: this.datePipe.transform(item?.VoucherDate),
        PostStatus : item.PostStatus === 'P' ? 'Posted' : 'Unposted',
        Status: item.Status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || this.allItems.length;
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
          width: '150px'
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
          width: '120px',
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
          key: 'ListAmount',
          label: 'Amount',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'number',
          width: '130px',
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
          key: 'PostStatus',
          label: 'Post Status',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'number',
          width: '130px',
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
          state: !this.mps.can('delete')
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
    this.deleteReceipt(row.VoucherHeaderSid);
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

  deleteReceipt(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // TODO: Implement delete receipt API
        this.appSettingService.showWarning('Delete receipt functionality not yet implemented');
        // this.receiptService.deleteReceiptById(id).subscribe((resp: any) => {
        //   this.appSettingService.showSuccess("Receipt deleted!");
        //   this.loadReceipts();
        // });
      }
    });
  }

  navigateToAddNewReceipt() {
    this.router.navigate(['accounts/receipt/entry']);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
  }
}
