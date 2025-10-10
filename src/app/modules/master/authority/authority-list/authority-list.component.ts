// authority-list.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { Observable } from 'rxjs';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
@Component({
  selector: 'app-authority-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    RouterModule,
    ListpageComponent,
    FavoriteStarComponent,
    NgxSpinnerModule,
    CommonPaginationComponent,
    ReusableTableComponent,
    PageHeaderComponent,
  ],
  templateUrl: './authority-list.component.html',
  styleUrls: ['./authority-list.component.scss']
})
export class AuthorityListComponent extends BaseListComponent implements OnInit {
  @ViewChild('authorityTable') authorityTable!: ReusableTableComponent;
  // Variable Declaring Section
  userData: any;

  // Lookup Related Variable Declaration
  departmentOptions: any[] = [];

  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // Company
  currentCompany: any;
  currentBranch: any;
  protected config: ListComponentConfig = {
    storageKey: 'authority-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'DepartmentMaster',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };
    headerActions: HeaderAction[] = [];
  // Table configuration
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Booking',
        condition: (row: any) => this.hasPermission('View')
      },
        {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete Zone',
        class:"text-danger",
        condition: (row: any) => this.hasPermission('Delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'AuthorityMasterSid',
    emptyMessage: 'No Authorization found',
    dragAndDrop: true
  };

  tableLoading = false;
  // Alias for compatibility with existing template
  get authorityList() { return this.allItems; }
  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userInfo = this.appSettingService.getDecryptedUserProfile();
    if (userInfo) {
      this.userData = userInfo;
      this.checkPermissions();
    }
    this.initializeTableConfig();
    this.initializeHeaderActions();
    super.ngOnInit();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId);
    console.log(userRole);
    if (currentMenuId && userRole) {
      this.masterService
        .getRoleMenuPermissions(currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
            this.initializeHeaderActions();
            console.log(this.permissions);
          },
        });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  protected override searchItems(): Observable<any> {
    this.spinner.show();
    return this.masterService.searchAuthority(this.getSearchParams());
  }
  protected override getSearchParams(): SearchParams {
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

  // formatDepartment(depart: any[]) {
  //   return depart.join(" , ")
  // }

  protected override processSearchResults(response: any): void {
    this.spinner.hide();
    if (response.status) {
      this.allItems = response.data.items.map(item => ({
        ...item,
        DepartmentMaster: item.DepartmentMaster,
        menuName: item.menuMaster?.MenuName,
        branchName: item.branchMaster?.branchName,
        status: item.status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching authority.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error searching authority.');
    console.error('Error searching authority', error);
    super.handleSearchError(error);
  }

    onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchAuthority();
  }
  searchAuthority() {
    this.page = 1;
    this.search();
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
        condition: this.hasPermission('Add')
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
        this.navigateToCreateAuthority();
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

  trackByAuthorityId(index: number, item: any): number {
    return item.AuthorityMasterSid;
  }

  clearFilterValue() {
    this.clearFilter();
  }
  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [

      {
        key: 'DepartmentMaster',
        label: 'Department',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'menuName',
        label: 'Screen ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'branchName',
        label: 'Branch',
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
    ];
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewBooking(event.row);
    }else if(event.action === 'delete'){
      this.deleteBy(event.row)
    }
  }

  deleteBy(id){
    this.softDelete(id.AuthorityMasterSid)
  }

    softDelete(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteAuthorityById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Authority deleted successfully!");
            this.searchAuthority();
          },
          error: (err) => {
            console.error('Delete error:', err);
          }
        });
      }
    });
  }
  viewBooking(item: any): void {
    this.router.navigate(['/master/authorization/entry', item.AuthorityMasterSid]);
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
    const formattedData = this.allItems;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.authorityTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Authorization-Report',
      title: companyName
    });
  }



  navigateToCreateAuthority() {
    this.router.navigate(['master/authorization/entry']);
  }

  updatePaginationData(): void {
    this.search();
  }

  override trackBy(index: number, item: any) {
    return item.AuthorityMasterSid || index;
  }
} 