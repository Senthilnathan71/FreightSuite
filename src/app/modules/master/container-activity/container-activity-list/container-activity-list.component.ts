
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { Observable, forkJoin } from 'rxjs';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';

@Component({
  selector: 'app-container-activity-list',
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
    CommonPaginationComponent,
    ReusableTableComponent
  ],
  templateUrl: './container-activity-list.component.html',
  styleUrl: './container-activity-list.component.scss'
})
export class ContainerActivityListComponent extends BaseListComponent implements OnInit {
   @ViewChild('containerActivtityTable') containerActivtityTable!: ReusableTableComponent;
  searchType = 'ActivityName';
  
  results: any[] = [];
  containerActivityList: any[] = [];
 
  companyMap: { [id: number]: string } = {};
  userData: any;
  
  loading = false;
    tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Zone',
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
    trackByKey: 'ContainerActivityMasterSid',
    emptyMessage: 'No Container Activity found',
    dragAndDrop: true
  };
  tableLoading = false;
  // Pagination 
  get containerActivityLists() { return this.allItems; }

  protected config: ListComponentConfig = {
        storageKey: 'containerActivity-type-state',
        defaultPageSize: 10,
        defaultSortColumn: 'ActivityCode',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100, 500],
        maxPagesToShow: 3
    };
  isFavorite: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  
  // Company
  currentCompany: any;
  currentBranch: any;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
     private spinner: NgxSpinnerService,
     paginationService: PaginationService
  ) {
    super(paginationService);
  }

 override ngOnInit() {
    this.getAllCompanies();
    
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.initializeTableConfig();
    super.ngOnInit();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    
    if (currentMenuId && userRole) {
      this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions)
            .filter(key => this.currentMenuPermissions[key] === 'isTrue');
        }
      });
    }
  }
 
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

   // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.masterService.searchContainerActivities(this.getSearchParams());
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
      this.allItems = response.data.items.map(item => ({
        ...item,
        Status: item.Status === 'A' ? 'Active' : 'Suspended',
        ContainerMoveStatus: item.ContainerMoveStatus || 'N/A',
        MoveType: item.MoveType || 'N/A',
        IsDamageMove: item.IsDamageMove === 'Y' ? 'Yes' : 'No'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
    } else {
      this.appSettingService.showError('Error searching container activities.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error searching container activities.');
    console.error('Error searching container activities', error);
    super.handleSearchError(error);
  }

  // Legacy method for template compatibility
  loadContainerActivities() {
    this.page=1;
    this.search();
  }

  // Legacy method for template compatibility
  clearFilterValue() {
    this.clearFilter();
  }

   // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
       {
        key: 'ActivityCode',
        label: 'Activty Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ActivityName',
        label: 'Actvity Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ContainerMoveStatus',
        label: 'Container Move Status',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
       {
        key: 'MoveType',
        label: 'Move Type',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
       {
        key: 'IsDamageMove',
        label: 'Damage Move ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'Status',
        label: 'Status',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'status',
        width: '100px',
        dataType: 'string'
      },
    ];
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewZone(event.row);
    } else if (event.action === 'delete') {
      this.deleteChargeByRow(event.row);
    }
  }

   viewZone(row: any) : void{
   this.router.navigate(['/master/container-activity/entry/', row.ContainerActivityMasterSid]);
  }

  deleteChargeByRow(row: any) {
    this.deleteContainerActivity(row.ContainerActivityMasterSid);
  }

   deleteContainerActivity(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteContainerActivityById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.loadContainerActivities();
        });
      }
    });
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
    const visibleColumns = this.containerActivtityTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Container-Activity-Report',
      title: companyName
    });
  }

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((companies: any[]) => {
      this.companyMap = {};
      companies.forEach(c => {
        this.companyMap[c.CompanyMasterSid] = c.companyName;
      });
    });
  }

  

  trackByIndex(index: number, item: any): number {
    return index;
  }

 

  navigateToAddNewContainerActivity() {
    this.router.navigate(['master/container-activity/entry']);
  }

}