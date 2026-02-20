import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    ListpageComponent,
    FavoriteStarComponent,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
  ],
  templateUrl: './milestone-list.component.html',
  styleUrl: './milestone-list.component.scss'
})
export class MilestoneListComponent extends BaseListComponent implements OnInit {
  @ViewChild('milestoneTable') milestoneTable!: ReusableTableComponent;
  searchType = 'MilestoneName';
  // filterValue = '';
  milestoneList: any[] = [];
  allMilestones: any[] = [];
  // searchPerformed = false;
  loading: boolean = false;
  departmentOptions: any[] = [];
  userData: any;
  // sortColumn: string = 'MilestoneName';
  // sortDirection: string = 'asc';
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // pagination
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection: number = 0;
  isFavorite: boolean = false;

  // Company
  currentCompany: any;
  currentBranch: any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
    headerActions: HeaderAction[] = [];
  shipmentTypeOptions = [
    { value: 'Export', label: 'Export' },
    { value: 'Import', label: 'Import' },
    { value: 'Transshipment', label: 'Transshipment' }
  ];
  tableConfig:TableConfig;
  // Table configuration
  private initializeTableConfig() {
  this.tableConfig = {
    columns: [
        {
        key: 'MilestoneName',
        label: 'Milestone Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'MilestoneCode',
        label: 'Milestone Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ShipmentType',
        label: 'Shipment Type ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'DepartmentMasterSid',
        label: 'Department ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'SortBy',
        label: 'Sort By  ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'number'
      },
      {
        key: 'AutoCapture',
        label: 'Auto Capture',
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
        tooltip: 'View',
         state: !this.mps.can('view')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete',
        class: "text-danger",
         state: !this.mps.can('delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: '',
    emptyMessage: 'No milestone found',
    dragAndDrop: true
  }
};

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'milestone-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'SortBy',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allMilestone() { return this.allItems; }
  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    public mps : MenuPermissionService,
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    // this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    
    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    this.loadDepartments();
    // this.loadMilestones();
    // Initialize table configuration
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
       this.initializeHeaderActions();
    });
    // Initialize base component
    super.ngOnInit();
  }

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchMilestoneList(this.getSearchParams());
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
        SortBy: Number(item.SortBy),
        status: item.status === 'A' ? 'Active' : 'Suspended',
        departmentName:item.departmentMaster?.departmentName,
        // ReceivedDate: this.datePipe.transform(item?.ReceivedDate)
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching milestone.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching milestone.');
    console.error('Error searching milestone', error);
    super.handleSearchError(error);
  }

   onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchMilestone();
  }

   onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilterValue();
  }

  // Legacy methods for template compatibility
  searchMilestone() {
    this.search();
  }

  // clearFilterValue() {
  //   this.clearFilter();
  // }

  
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


  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.navigateToCreateMilestone();
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
  override trackBy(index: number, item: any): number {
    return item.MilestoneMasterSid || index;
  }


  viewHawb(row: any): void {
    this.router.navigate(['/master/milestone/entry', row.MilestoneMasterSid]);
  }



  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewHawb(event.row);
    } else if (event.action === "delete") {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row: any) {
    this.softDelete(row.MilestoneMasterSid)
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
    const formattedData = this.allMilestone;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.milestoneTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'milestone-Report',
      title: companyName
    });
  }
  // loadMilestones(): void {
  //   this.spinner.show();
  //   this.loading = true;
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   let BranchMasterSid = this.currentBranch?.BranchMasterSid;
  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection,
  //     activeCompanyId: CompanyMasterSid,
  //     activeBranchId: BranchMasterSid,
  //   };

  //   this.masterService.searchMilestoneList(params).subscribe({
  //     next: (response: any) => {
  //       if (response.status) {
  //         this.allMilestones = response.data.items || response;
  //         this.totalLengthOfCollection = response.data.totalCount || response.length;
  //         this.applySorting();
  //         this.milestoneList = this.allMilestones;
  //         this.searchPerformed = true;
  //       }
  //       else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error fetching milestones:', err);
  //       this.allMilestones = [];
  //       this.milestoneList = [];
  //       this.totalLengthOfCollection = 0;
  //       this.loading = false;
  //     }
  //   });
  // }


  loadDepartments() {
    const companyMastersID = this.currentCompany?.CompanyMasterSid;
    this.loading = true;
    console.log(companyMastersID)
    this.masterService.getAllDepartments(companyMastersID).subscribe({
      next: (res: any) => {
        this.departmentOptions = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading departments:', err);
        this.loading = false;
      }
    });
  }
  // sort(column: string) {
  //   if (this.sortColumn === column) {
  //     // Reverse the sort direction if clicking the same column
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     // Set new sort column and default to ascending
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.loadMilestones();
  //   this.applySorting();
  //   this.updatePaginatedData();
  // }

  // applySorting() {
  //   this.allMilestones.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];
  //     if (this.sortColumn === 'departmentName') {
  //       valueA = a.departmentMaster?.departmentName || a.departmentName || '';
  //       valueB = b.departmentMaster?.departmentName || b.departmentName || '';
  //     }



  //     // Handle null/undefined values
  //     if (valueA == null) valueA = '';
  //     if (valueB == null) valueB = '';

  //     // Convert to string for case-insensitive comparison
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



  getShipmentTypeLabel(type: string): string {
    const found = this.shipmentTypeOptions.find(t => t.value === type);
    return found ? found.label : type;
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadMilestones();
  }
  clearFilterValue() {
    this.filterValue = '';
    // this.loadMilestones();
  }

  trackByMilestoneId(index: number, item: any): number {
    return item.MilestoneMasterSid;
  }

  softDelete(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteMilestoneById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Milestone deleted successfully!");
            // this.loadMilestones();
            this.searchMilestone()
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateMilestone() {
    this.router.navigate(['master/milestone/entry']);
  }

  // resetPage() {
  //   this.filterValue = '';
  //   this.searchType = 'MilestoneName';
  //   this.page = 1;
  //   this.searchPerformed = false;
  //   this.milestoneList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.sortColumn = 'MilestoneName';
  //   this.sortDirection = 'asc';
  //   this.loadMilestones();
  // }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  // report(): void {
  //   const formattedData = this.milestoneList.map(item => ({
  //     ...item,
  //     departmentName: item.departmentMaster?.departmentName || '-',
  //     status: item.status === 'A' ? 'Active' : 'Suspended'
  //   }));

  //   // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'MilestoneName', label: 'Milestone Name' },
  //       { key: 'MilestoneCode', label: 'Milestone Code' },
  //       { key: 'departmentName', label: 'Department' },
  //       { key: 'ShipmentType', label: 'Shipment Type' },
  //       { key: 'SortBy', label: 'Order By' },
  //       { key: 'AutoCapture', label: 'Auto Capture' },
  //       { key: 'AutomailRequire', label: 'Auto Mail' },
  //       { key: 'status', label: 'Status' }
  //     ],
  //     fileName: 'Milestone-Report',
  //     title: companyName
  //   });
  // }
}