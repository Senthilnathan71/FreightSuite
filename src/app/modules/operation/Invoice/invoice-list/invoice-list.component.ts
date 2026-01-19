// invoice-list.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { forkJoin } from 'rxjs';
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
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

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
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss'
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

  protected config: ListComponentConfig = {
    storageKey: 'invoice-type-state',
    defaultPageSize: 10,
    defaultSortColumn: 'InvoiceNo',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allInvoice() { return this.allItems; }

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
     private mps: MenuPermissionService
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    this.getAllCompanies();
    this.loadJobMappings();

    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();

    if (userProfile) {
      this.userData = userProfile;
    }
    this.initializeHeaderActions();
    this.initializeTableConfig();
    this.mps.init().subscribe(()=>{
          this.initializeTableConfig();
          this.initializeHeaderActions();
        });
    super.ngOnInit();
    // this.loadInvoices();
  }


  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.operationService.searchInvoices(this.getSearchParams());
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
        BookingNo: item?.BookingHeader?.BookingNo || '',
        VoucherDate:this.datePipe.transform(item?.VoucherDate),
        PostStatusLabel: item.PostStatus === 'P' ? 'Posted' : 'Unposted',
        Status: item.Status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching Invoice.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
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
        width:"170px"
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
        label: 'Curr Code ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '100px',
      },
        {
        key: 'MasterNumber',
        label: 'Job No  ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '150px',
      },
        {
        key: 'HouseNumber',
        label: 'House No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '150px',
      },
      {
        key:'BookingNo',
        label:'Booking No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '150px',
      },
      {
        key: 'PostStatusLabel',
        label: 'Post Status',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '150px',
      },
      
       {
        key: 'CreatedBy',
        label: 'Create By ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '150px',
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
        state: !this.mps.can('delete')
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
    if (event.action === 'view') {
      this.editbyrow(event.row);
    } else if (event.action === 'delete') {
      this.deleteInvoiceByRow(event.row);
    }
  }

  // viewInvoice(item.VoucherHeaderSid)
  editbyrow(row:any) {
     this.router.navigate(['operation/invoice/entry/', row.VoucherHeaderSid]);
  }


  deleteInvoiceByRow(row: any) {
    this.deleteInvoice(row.VoucherHeaderSid);
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

    this.operationService.searchInvoices(params).subscribe({
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


  getAllCompanies() {
    // Assuming you have a service to get companies
    // this.masterService.getAllCompanies().subscribe((companies: any[]) => {
    //   this.companyMap = {};
    //   companies.forEach(c => {
    //     this.companyMap[c.CompanyMasterSid] = c.companyName;
    //   });
    // });
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

  deleteInvoice(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.operationService.deleteInvoiceById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.loadInvoices();
        });
      }
    });
  }

  navigateToAddNewInvoice() {
    this.router.navigate(['operation/invoice/entry']);
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

  formatDate(date: any): string {
    if (!date) return 'N/A';

    // Handle string dates, timestamps, and Date objects
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
  }

  viewInvoice(id: number) {
    this.router.navigate(['operation/invoice/entry/', id]);
  }
}