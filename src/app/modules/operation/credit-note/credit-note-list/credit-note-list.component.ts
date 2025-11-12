import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { OperationService } from '../../operation.service';
import { Observable } from 'rxjs';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';

@Component({
  selector: 'app-credit-note-list',
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
  templateUrl: './credit-note-list.component.html',
  styleUrl: './credit-note-list.component.scss'
})
export class CreditNoteListComponent extends BaseListComponent implements OnInit{
  @ViewChild('invoiceTable') invoiceTable!: ReusableTableComponent;
  searchType = 'CreditNoteNo';
  // filterValue = '';
  results: any[] = [];
  creditNoteList: any[] = [];
  invoiceList: any[] =[];
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

  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View ',
        // condition: (row: any) => this.hasPermission('View')
      },
      // {
      //   icon: 'fas fa-trash',
      //   label: 'Delete',
      //   action: 'delete',
      //   tooltip: 'Delete ',
      //   class: "text-danger",
      //   // condition: (row: any) => this.hasPermission('Delete')
      // }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'VoucherHeaderSid',
    emptyMessage: 'No Credit Note found',
    dragAndDrop: true
  };
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'credit-note-type-state',
    defaultPageSize: 10,
    defaultSortColumn: 'CreditNoteNo',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allCreditNote() { return this.allItems; }

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
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    this.getAllCompanies();
    this.loadJobMappings();
    this.loadInvoices();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();

    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.initializeHeaderActions();
    this.initializeTableConfig();
    this.initializeModalDropdownItems();
    super.ngOnInit();
    this.loadCreditNotes();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;

    if (currentMenuId && userRole) {
      // Assuming you have a similar permission service for operations
      // this.operationService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
      //   next: (response) => {
      //     this.currentMenuPermissions = response.data.MenuPermissions || {};
      //     this.permissions = Object.keys(this.currentMenuPermissions)
      //       .filter(key => this.currentMenuPermissions[key] === 'isTrue');
      //   }
      // });
    }
  }
   hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  loadInvoices() {
    this.operationService.getAllInvoice().subscribe({
      next: (resp: any) => {
        this.invoiceList = resp?.data || resp || [];
        // Now load credit notes after invoices are loaded
        this.loadCreditNotes();
      },
      error: (err) => {
        console.error('Error loading invoices', err);
        this.invoiceList = [];
        this.loadCreditNotes();
      }
    });
  }

  protected searchItems(): Observable<any> {
      this.spinner.show();
      return this.operationService.searchCreditNote(this.getSearchParams());
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
        VoucherDate:this.datePipe.transform(item?.VoucherDate),
        Status: item.Status === 'A' ? 'Active' : 'Suspended',
        ReversalVoucherDisplay: this.getInvoiceNumber(item.ReversalVoucher)
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

    getInvoiceNumber(reversalVoucherId: number): string {
    if (!reversalVoucherId) return '-';
    
    const invoice = this.invoiceList.find(inv => 
      inv.VoucherHeaderSid === reversalVoucherId || 
      inv.voucherHeaderSid === reversalVoucherId
    );
    
    return invoice ? invoice.VoucherNumber : `ID: ${reversalVoucherId}`;
  }

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error searching Invoice.');
    console.error('Error searching Invoice', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadCreditNote();
  }

  loadCreditNote() {
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
        // condition: this.hasPermission('Add')
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
    this.tableConfig.columns = [
      {
        key: 'VoucherNumber',
        label: 'Credit Note',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width:"150px"
      },
      {
        key: 'ReversalVoucherDisplay',
        label: 'Invoice No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',        
      },
      {
        key: 'VoucherDate',
        label: 'Date ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width:"150px"
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
        label: 'Curr',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '150px',
      },
      //  {
      //   key: 'LocalAmount',
      //   label: 'Local Amount ',
      //   sortable: true,
      //   filterable: true,
      //   visible: true,
      //   dataType: 'string',
      //   width: '150px',
      // },
      //  {
      //   key: 'IRNNumber',
      //   label: 'Job No ',
      //   sortable: true,
      //   filterable: true,
      //   visible: true,
      //   dataType: 'string',
      //   width: '150px',
      // },
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
        key: 'CreatedBy',
        label: 'Create By ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '150px',
      },
      //  {
      //   key: 'HouseJobSid',
      //   label: 'Credit Note No',
      //   sortable: true,
      //   filterable: true,
      //   visible: true,
      //   dataType: 'string',
      //   width: '150px',
      // },
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
    ];
  }
  initializeModalDropdownItems(): void {
    this.modalDropdownItems = [
      {
        label: 'Edoc',
        icon: 'fas fa-file-alt',
        action: 'edoc',
        condition: this.hasPermission('Edoc')
      },
      {
        label: 'Terms & Condition',
        icon: 'fas fa-clipboard',
        action: 'terms',
        condition: this.hasPermission('Terms and Condition')
      },
      {
        label: 'Authorize',
        icon: 'fas fa-shield-alt',
        action: 'authority',
        condition: this.hasPermission('Authority')
      },
      {
        label: 'Email',
        icon: 'fas fa-envelope',
        action: 'email',
        condition: this.hasPermission('Email')
      }
    ];
  }
  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.navigateToAddNewCreditNote();
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

  onTableActionClick(event: TableEventData): void {
      if (event.action === 'view') {
        this.editbyrow(event.row);
      } else if (event.action === 'delete') {
        this.deleteCreditNoteByRow(event.row);
      }
    }

    editbyrow(row:any) {
     this.router.navigate(['operation/credit-note/entry/', row.VoucherHeaderSid]);
  }

  deleteCreditNoteByRow(row: any) {
    this.deleteCreditNote(row.VoucherHeaderSid);
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
    const formattedData = this.allCreditNote;
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
      fileName: 'Credit-Note-Report',
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
  loadCreditNotes(): void {
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

    this.operationService.searchCreditNote(params).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.results = this.processCreditNoteData(response.data.items || response.data || []);
          this.creditNoteList = this.results;
          this.totalLengthOfCollection = response.totalCount || this.creditNoteList.length;
          this.applySorting();
          this.searchPerformed = true;
        }
        this.spinner.hide();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching invoices:', err);
        this.results = [];
        this.creditNoteList = [];
        this.totalLengthOfCollection = 0;
        this.loading = false;
        this.spinner.hide();
      }
    });
  }
  private processCreditNoteData(creditnotes: any[]): any[] {
    return creditnotes.map(creditnote => {
      // Calculate local amount if not provided
      if (!creditnote.LocalAmount && creditnote.voucherDetails) {
        creditnote.LocalAmount = creditnote.voucherDetails.reduce((total: number, detail: any) => {
          return total + (detail.LocalAmount || 0);
        }, 0);
      }

      // Get job numbers from mappings
      if (creditnote.MasterJobSid) {
        creditnote.MasterJobNumber = this.masterJobMap[creditnote.MasterJobSid] || creditnote.MasterJobSid;
      }

      if (creditnote.HouseJobSid) {
        creditnote.HouseJobNumber = this.houseJobMap[creditnote.HouseJobSid] || creditnote.HouseJobSid;
      }

      return creditnote;
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

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadCreditNotes();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCreditNote(id: number) {
      const dialogRef = this.dialog.open(DeleteWarningComponent);
      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.operationService.deleteCreditNoteById(id).subscribe((resp: any) => {
            this.appSettingService.showSuccess("Deleted!");
            this.loadCreditNotes();
          });
        }
      });
    }
    navigateToAddNewCreditNote() {
    this.router.navigate(['operation/credit-note/entry']);
  }
  formatDate(date: any): string {
    if (!date) return 'N/A';

    // Handle string dates, timestamps, and Date objects
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
  }

  viewCreditNote(id: number) {
    this.router.navigate(['operation/cred/entry/', id]);
  }
}
