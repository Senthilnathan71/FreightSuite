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
import { Observable } from 'rxjs';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableConfig } from 'src/app/shared/interfaces/table.interface';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

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

  constructor(
    private operationService: OperationService,
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
    this.initializeModalDropdownItems();
    super.ngOnInit();
    this.loadVendorInvoices();
  }

  

  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.operationService.searchVendorInvoices(this.getSearchParams());
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
        Status: item.Status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching Vendor Invoices.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
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
        filterable: true,
        visible: true,
        dataType: 'string'
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
        key: 'LocalAmount',
        label: 'Amount',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'number',
        width: '120px',
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
        tooltip: 'View Vendor Invoice',
         state : !this.mps.can('view')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete Vendor Invoice',
        class: "text-danger",
        state : !this.mps.can('delete')
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

  onReport() {
    if (this.allItems.length > 0) {
      this.exportExcel();
    }
  }

  onReset() {
    this.filterValue = '';
    this.page = 1;
    this.search();
  }

  onTableAction(event: any) {
    const { action, row } = event;
    switch (action) {
      case 'view':
        this.editVendorInvoice(row);
        break;
      case 'delete':
        this.deleteVendorInvoice(row);
        break;
      default:
        console.log('Unknown table action:', action);
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

  viewVendorInvoice(vendorInvoice: any) {
    this.router.navigate(['/operation/vendor-invoice/view', vendorInvoice.VoucherHeaderSid]);
  }

  editVendorInvoice(vendorInvoice: any) {
    this.router.navigate(['/operation/vendor-invoice/entry', vendorInvoice.VoucherHeaderSid]);
  }

  deleteVendorInvoice(vendorInvoice: any) {
    const dialogRef = this.dialog.open(DeleteWarningComponent, {
      width: '400px',
      data: {
        title: 'Delete Vendor Invoice',
        message: `Are you sure you want to delete Vendor Invoice ${vendorInvoice.VoucherNumber}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.spinner.show();
        this.operationService.deleteVendorInvoiceById(vendorInvoice.VoucherHeaderSid).subscribe({
          next: (response) => {
            this.spinner.hide();
            if (response.status) {
              this.appSettingService.showSuccess('Vendor Invoice deleted successfully');
              this.search();
            } else {
              this.appSettingService.showError('Failed to delete Vendor Invoice');
            }
          },
          error: (error) => {
            this.spinner.hide();
            this.appSettingService.showError('Error deleting Vendor Invoice');
            console.error('Error deleting Vendor Invoice:', error);
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
        { key: 'VoucherDate', label: 'Invoice Date' },
        { key: 'VendorName', label: 'Vendor Name' },
        { key: 'BillNo', label: 'Bill No' },
        { key: 'BillDate', label: 'Bill Date' },
        { key: 'CurrencyCode', label: 'Currency' },
        { key: 'LocalAmount', label: 'Amount' },
        { key: 'TDSAmount', label: 'TDS Amount' },
        { key: 'MBLNo', label: 'MBL No' },
        { key: 'HBLNo', label: 'HBL No' },
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
