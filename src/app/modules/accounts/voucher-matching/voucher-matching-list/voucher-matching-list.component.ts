import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
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
import { AccountsService } from '../../accounts.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

@Component({
  selector: 'app-voucher-matching-list',
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
  templateUrl: './voucher-matching-list.component.html',
  styles: ``
})
export class VoucherMatchingListComponent  extends BaseListComponent implements OnInit{
  @ViewChild('voucherMatchingTable') voucherMatchingTable!: ReusableTableComponent;
  results: any[] = [];
  voucherList: any[] = [];
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
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  protected config: ListComponentConfig = {
    storageKey: '',
    defaultPageSize: 10,
    defaultSortColumn: 'VoucherMatchingHeaderSid',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with template
  get allVoucher() { return this.allItems; }

  constructor(
    private mps : MenuPermissionService,
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

    this.userData = userProfile;

    this.initializeHeaderActions();
    this.initializeTableConfig();
    this.mps.init().subscribe(()=>{
      this.initializeHeaderActions();
      this.initializeTableConfig();
    })
    super.ngOnInit();
  }


  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.accountService.searchVoucherMatching(this.getSearchParams());
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
    if(response.status){
      this.allItems = response.data.items.map(item => ({
        ...item,
        VoucherMatchingDate:this.datePipe.transform(item?.VoucherMatchingDate),
        Status: item.Status === 'A' ? 'Active' : 'Suspended',
      }));
      this.totalLengthOfCollection = response.data.totalCount || this.allItems.length;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching voucher matching.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching Voucher Matching.');
    console.error('Error searching voucher matching', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadVoucherMatching();
  }

  loadVoucherMatching(){
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
    return item.VoucherMatchingHeaderSid || index;
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
          key: 'VoucherMatchingNo',
          label: 'Matching No.',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: '150px'
        },
        {
          key: 'VoucherMatchingDate',
          label: 'Matching Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: '100px'
        },
        {
          key: 'Narration',
          label: 'Narration',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: '180px',
        },
        {
          key: 'SubledgerName',
          label: 'Subledger',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: '200px',
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
          tooltip: 'View Voucher Matching',
          state: !this.mps.can('view')
        },
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'VoucherMatchingHeaderSid',
      emptyMessage: 'No Voucher Matching found',
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
        this.navigateToCreate();
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
      this.viewVoucherMatching(event.row);
    }
  }

  viewVoucherMatching(row: any) {
    this.router.navigate(['accounts/voucher-matching/entry/', row.VoucherMatchingHeaderSid]);
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
    console.log('Filters changed:', filters);
  }

  report(): void {
    const formattedData = this.allVoucher;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns from table
    const visibleColumns = this.voucherMatchingTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Voucher-Matching-Report',
      title: companyName
    });
  }



  updatePaginatedData(): void {
    this.loadVoucherMatching();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  navigateToCreate() {
    this.router.navigate(['accounts/voucher-matching/entry']);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
  }
}

