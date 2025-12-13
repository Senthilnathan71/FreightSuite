import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

@Component({
  selector: 'app-year-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    ListpageComponent,
    CustomDatePipe,
    FavoriteStarComponent,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
  ],
  providers: [CustomDatePipe],
  templateUrl: './year-list.component.html',
  styleUrl: './year-list.component.scss'
})
export class YearListComponent extends BaseListComponent implements OnInit {
  @ViewChild('yearTable') yearTable!: ReusableTableComponent;
  isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  // filterValue = '';
  yearList: any[] = [];
  searched = false;
  loading: boolean = false;
  userData: any;
  companyMap: { [id: number]: string } = {};
  permissions: string[] = [];
  currentMenuPermissions: any = {};
   headerActions: HeaderAction[] = [];
   tableConfig: TableConfig;
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection: number = 0;

  // sortColumn: string = 'YearName';
  // sortDirection: string = 'asc';

  // Company
  currentCompany: any;
  currentBranch: any;
  // Table configuration
  

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'year-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'YearName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allYear() { return this.allItems; }
  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    public mps : MenuPermissionService,
     private datePipe: CustomDatePipe,
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    this.getAllCompanies();
    //  this.appSettingService.getUser().subscribe(user => {
    //     if (user) {
    //       this.userData = user;
    
    //     }
    //   });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      
    }
    // this.loadYears();
    // Initialize table configuration
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });
    // Initiaize base component
    super.ngOnInit();
  }
  
  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchYearList(this.getSearchParams());
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
    if (response.status) {
      this.allItems = response.data.items.map(item => ({
        ...item,
        status: item.status === 'A' ? 'Active' : 'Suspended',
        StartDate: item.StartDate ? this.datePipe.transform(item.StartDate) : '',
      EndDate: item.EndDate ? this.datePipe.transform(item.EndDate) : '',
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching Years.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching Years.');
    console.error('Error searching Years', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchYears() {
    this.search();
  }

   onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchYears();
  }

    onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilterValue();
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
 
  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.nagivateTocreateYear()
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
  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.YearMasterSid || index;
  }


  viewYear(item: any): void {
    this.router.navigate(['master/year/entry', item.YearMasterSid]);
  }



  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig = {
    columns: [
      {
        key: 'YearName',
        label: 'Year Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'YearCode',
        label: 'Year Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'StartDate',
        label: 'Start Date',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'EndDate',
        label: 'End Date',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'CurrentYear',
        label: 'Current Year',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'YearEndCompleted',
        label: 'Year End Completed',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',

      },
      {
        key: 'Remarks',
        label: 'Remarks',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'status',
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
        tooltip: 'View ',
        state : !this.mps.can('view')
      },
       {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete ',
        class:"text-danger",
        state : !this.mps.can('delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'YearMasterSid',
    emptyMessage: 'No Year found',
    dragAndDrop: true
  };
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewYear(event.row);
    } else if (event.action === 'delete') {
      this.deleteYearByRow(event.row);
    }
  }

  deleteYearByRow(row: any) {
    this.deleteYearById(row.YearMasterSid);
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
    const formattedData = this.allYear;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.yearTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Year-Report',
      title: companyName
    });
  }
  // loadYears(): void {
  //   this.spinner.show();
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     activeCompanyId: CompanyMasterSid,
  //   };

  //   this.masterService.searchYearList(params).subscribe({
  //     next: (response) => {
  //       if (response.status) {
  //         this.yearList = response.data.items;
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searched = true;
  //       }
  //       else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //     },
  //     error: (err) => {
  //       console.error('Error fetching years:', err);
  //       this.yearList = [];
  //       this.totalLengthOfCollection = 0;
  //     },
  //   });
  // }

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((companies: any[]) => {
      this.companyMap = {};
      companies.forEach(c => {
        this.companyMap[c.CompanyMasterSid] = c.companyName;
      });
    });
  }



  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadYears();
    this.searchYears();
  }

  trackByIndex(index: number, item: any): number {
    return item.YearMasterSid || index;
  }

  deleteYearById(YearMasterSid: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteYearById(YearMasterSid).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Deleted successfully!");
            // this.loadYears();
            this.searchYears();
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  // resetPage() {
  //   this.searched = false;
  //   this.yearList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.filterValue = '';
  //   this.page = 1;
  //   this.sortColumn = 'YearName';
  //   this.sortDirection = 'asc';
  //   this.loadYears();
  // }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }
  // report(): void {
  //   if (!this.yearList || this.yearList.length === 0) {
  //     this.appSettingService.showWarning("No data available to generate report");
  //     return;
  //   }

  //   const formattedData = this.yearList.map(item => ({
  //     ...item,
  //     status: item.status === 'A' ? 'Active' : 'Inactive',
  //     StartDate: new CustomDatePipe().transform(item.StartDate),
  //     EndDate: new CustomDatePipe().transform(item.EndDate)
  //   }));


  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'YearName', label: ' Year Name' },
  //       { key: 'YearCode', label: ' Year Code' },
  //       { key: 'StartDate', label: 'StartDate' },
  //       { key: 'EndDate', label: 'End Date' },
  //       { key: 'CurrentYear', label: ' Current Year' },
  //       { key: 'YearEndCompleted', label: 'Year-End Completed' },
  //       { key: 'EndDate', label: 'End Date' },
  //       { key: 'status', label: 'Status' }
  //     ],
  //     fileName: 'Year-Report',
  //     title: companyName,
  //     sheetName: 'Year'
  //   });
  // }

  nagivateTocreateYear() {
    this.router.navigate(['master/year/entry'])
  }

  // clearFilterValue() {
  //   this.filterValue = '';
  // }
}
