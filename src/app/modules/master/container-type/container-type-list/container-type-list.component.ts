import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { forkJoin, Observable } from 'rxjs';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
@Component({
  selector: 'app-container-type-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FeatherModule,
    NgbPaginationModule,
    ListpageComponent,
    NgxSpinnerModule,
    CommonPaginationComponent,
    FavoriteStarComponent,
    ReusableTableComponent,
      PageHeaderComponent,
    ToolsDropdownComponent
  ],
  templateUrl: './container-type-list.component.html',
  styleUrl: './container-type-list.component.scss'
})
export class ContainerTypeListComponent extends BaseListComponent implements OnInit {
  @ViewChild('containerTable') containerTable!: ReusableTableComponent;
  companyMap: { [id: number]: string } = {};
  userData: any;
  isFavorite: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentCompany: any;
  currentBranch: any;
  tableConfig: TableConfig;
  headerActions: HeaderAction[] = [];
  // Alias for compatibility with existing template
  get containerList() { return this.allItems; }
  // Table configuration
  

  tableLoading = false;
  protected config: ListComponentConfig = {
    storageKey: 'container-type-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'ContainerName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allcontainer() { return this.allItems; }

  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    public mps : MenuPermissionService
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
    this.initializeTableConfig();
     this.initializeHeaderActions();   // Initialize base component
     this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });
    super.ngOnInit();
  }

  


  override trackBy(index: number, item: any): number {
    return item.ContainerTypeMasterSid || index;
  }


  viewContainer(item: any): void {
    this.router.navigate(['/master/container-type/entry/', item.ContainerTypeMasterSid]);
  }


  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig = {
    columns: [
      {
        key: 'ContainerName',
        label: 'Container Name ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ContainerCode',
        label: 'Container Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ContainerIsoCode',
        label: 'ISO Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ContainerCategory',
        label: 'Category',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'NoOfTeu',
        label: 'No of TEU',
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
        class: "text-danger",
       state : !this.mps.can('delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'ContainerTypeMasterSid',
    emptyMessage: 'No container-type found',
    dragAndDrop: true
  };
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewContainer(event.row);
    } else if (event.action === "delete") {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row: any) {
    this.deleteContainerType(row.ContainerTypeMasterSid)
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
    const formattedData = this.allcontainer;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.containerTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Container-Report',
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

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.masterService.searchContainerType(this.getSearchParams());
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
        status: item.status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching container types.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  
  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadContainerTypes();
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
        this. navigateToaddNewContainerType()
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

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error searching container types.');
    console.error('Error searching container types', error);
    super.handleSearchError(error);
  }

  // Legacy method for template compatibility
  loadContainerTypes() {
    this.page = 1;
    this.search();
  }

  // Legacy method for template compatibility
  clearFilterValue() {
    this.clearFilter();
  }

  trackByIndex(index: number, item: any): number {
    return item.ContainerTypeMasterSid || index;
  }

  deleteContainerType(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteContainerTypeById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.search(); // Refresh the list after deletion
          this.loadContainerTypes();
        });
      }
    });
  }

  navigateToaddNewContainerType() {
    this.router.navigate(['master/container-type/entry']);
  }


}