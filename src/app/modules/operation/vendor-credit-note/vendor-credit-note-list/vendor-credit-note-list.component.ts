import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
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
        key: 'ReversalVoucherDisplay',
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
      this.initializeHeaderActions();
      this.initializeTableConfig();
      this.initializeModalDropdownItems();
      super.ngOnInit();
      this.loadVendorInvoices();
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
      this.spinner.show();
      return this.operationService.searchVendorCreditNote(this.getSearchParams());
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
      this.spinner.hide();
      if (response.status) {
        this.allItems = (response.data.items || []).map((item: any) => ({
          ...item,
          VoucherDate: this.datePipe.transform(item?.VoucherDate),
          BillDate: this.datePipe.transform(item?.BillDate),
          CurrencyCode: item.currencyMaster.currencyCode,
          Status: item.Status === 'A' ? 'Active' : 'Suspended',
          PostStatus: item.PostStatus === 'P' ? 'Posted' : 'Unposted',
          ReversalVoucherDisplay: this.getInvoiceNumber(item.ReversalVoucher),
          AmountFormatted: this.formatAmount(item.Amount)

        }));
        this.totalLengthOfCollection = response.data.totalCount || 0;
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
      this.filterValue = '';
      this.page = 1;
      this.search();
    }
  
    onTableAction(event: TableEventData): void {
      if (event.column?.key === 'ReversalVoucherDisplay') {
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
      const dialogRef = this.dialog.open(DeleteWarningComponent, {
        width: '400px',
        data: {
          title: 'Delete Vendor CreditNote',
          message: `Are you sure you want to delete Vendor CreditNote ${vendorCreditNote.VoucherNumber}?`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'confirm') {
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
          { key: 'ReversalVoucherDisplay', label: 'Vendor Invo No' },
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
