import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { authService } from 'src/app/modules/authentication/auth.service';
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
@Component({
  selector: 'app-imco-list',
  standalone: true,
  imports: [FeatherModule, RouterModule, FormsModule, CommonModule, NgbPaginationModule, ListpageComponent, FavoriteStarComponent, NgxSpinnerModule, ReusableTableComponent,PageHeaderComponent,],
  templateUrl: './imco-list.component.html',
  styleUrl: './imco-list.component.scss'
})
export class ImcoListComponent extends BaseListComponent implements OnInit {
  @ViewChild('imcoTable') imcoTable!: ReusableTableComponent;
  searchType: string = "ImcoClass";
  // filterValue: any;
  // searchPerformed: boolean;
  imcoList: any[];
  searchResults: any[];
  userData: any;
  // sortColumn: string = 'ImcoClass';
  // sortDirection: string = 'asc';
  loading = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // Pagination Data
  // page = 1;
  // pageSize = 15;
  totalAmountOfCollection: number;
  isFavorite: boolean = false;
  headerActions: HeaderAction[] = [];
  // Company
  currentCompany: any;
  currentBranch: any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  // Table configuration
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View',
        condition: (row: any) => this.hasPermission('View')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete ',
        class: "text-danger",
        condition: (row: any) => this.hasPermission('Delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'ImcoMasterSid',
    emptyMessage: 'No imco found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'imco-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'ImcoClass',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allImco() { return this.allItems; }
  constructor(
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private matdial: MatDialog,
    private route: Router,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    // this.appSettingService.getUser().subscribe(
    //     user=>{
    //         if(user){
    //             this.userData = user;
    //              this.checkPermissions();
    //         }
    //     }
    // );
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    // this.loadImcos();
    // Initialize table configuration
    this.initializeTableConfig();
    this.initializeHeaderActions();
    // Initialize base component
    super.ngOnInit();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId)
    console.log(userRole)
    if (currentMenuId && userRole) {
      this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions)
            .filter(key => this.currentMenuPermissions[key] === 'isTrue');
          console.log(this.permissions)
          this.initializeHeaderActions();
        }
      });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchIMCO(this.getSearchParams());
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
        status: item.status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
       this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching imco.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching imco.');
    console.error('Error searching imco', error);
    super.handleSearchError(error);
  }

    onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchImco();
  }
  // Legacy methods for template compatibility
  searchImco() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
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

  override trackBy(index: number, item: any): number {
    return item.ImcoMasterSid || index;
  }


  viewImco(item: any): void {
    this.route.navigate(['/master/imco/entry/', item.ImcoMasterSid]);
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [

      {
        key: 'ImcoClass',
        label: 'Imco Class',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ImcoUn',
        label: 'UN No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'PackingGroup',
        label: 'Packing Group',
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
      this.viewImco(event.row);
    }else if(event.action === 'delete'){
      this.deleteBy(event.row)
    }
  }

  deleteBy(row:any){
    this.deleteIMCOById(row.ImcoMasterSid)
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
    const formattedData = this.allImco;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.imcoTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Imco-Report',
      title: companyName
    });
  }

  // loadImcos(): void {
  //   this.spinner.show();
  //   this.loading = true;

  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection
  //   };

  //   this.masterService.searchIMCO(params).subscribe({
  //     next: (response: any) => {
  //       if (response.status) {
  //         this.imcoList = response.data.items;
  //         this.totalAmountOfCollection = response.data.totalCount || response.data.length;
  //         this.applySorting();
  //         this.searchPerformed = true;
  //       } else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error fetching IMCOs:', err);
  //       this.imcoList = [];
  //       this.totalAmountOfCollection = 0;
  //       this.loading = false;
  //     }
  //   });
  // }


  // sort(column: string) {
  //   if (this.sortColumn === column) {
  //     // Reverse the sort direction if clicking the same column
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     // Set new sort column and default to ascending
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.loadImcos();

  // }

  // applySorting() {
  //   if (!this.imcoList) return;

  //   this.imcoList.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];

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

  updatePaginationData() {
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
    // this.loadImcos();
  }
  // clearFilterValue() {
  //   this.filterValue = '';
  //   this.loadImcos();
  // }

  deleteIMCOById(IMCOMasterSid: number) {
    const matRef = this.matdial.open(DeleteWarningComponent);
    matRef.afterClosed().subscribe(
      (result) => {
        if (result) {
          this.masterService.deleteIMCOById(IMCOMasterSid).subscribe(
            (resp: any) => {
              if (resp.status) {
                this.appSettingService.showSuccess('IMCO Deleted');
                // this.loadImcos();
                this.searchImco();
              } else {
                this.appSettingService.showError('Error Deleting IMCO');
              }
            },
            (error) => {
              console.error('Error Deleting IMCO', error);
            }
          )
        }
      }
    )
  }


  navigateToCreate() {
    this.route.navigate(['master/imco/entry']);
  }

  reset() {
    this.searchPerformed = false;
    this.imcoList = [];
    this.totalAmountOfCollection = 0;
    this.filterValue = '';
    this.searchType = 'ImcoClass';
    this.page = 1;
    this.sortColumn = 'ImcoClass';
    this.sortDirection = 'asc';
    // this.loadImcos();
  }

  // report(): void {
  //   const formattedData = this.imcoList.map(item => ({
  //     ...item,
  //     status: item.status === 'A' ? 'Active' : 'Suspended'
  //   }));

  //   // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'ImcoClass', label: 'Imco Class' },
  //       { key: 'ImcoUn', label: 'UN No' },
  //       { key: 'PackingGroup', label: 'Packing Group' },
  //       { key: 'status', label: 'Status' },
  //     ],
  //     fileName: 'Imco-Report',
  //     title: companyName
  //   });
  // }
}
