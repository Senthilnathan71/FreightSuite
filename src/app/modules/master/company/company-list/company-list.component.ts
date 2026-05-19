import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { MasterService } from 'src/app/modules/master/master.service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable, of } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [FeatherModule, FormsModule, CommonModule, RouterModule, ListpageComponent, NgbPaginationModule, FavoriteStarComponent, NgxSpinnerModule, ReusableTableComponent,PageHeaderComponent,ToolsDropdownComponent],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss',
})
export class CompanyListComponent extends BaseListComponent implements OnInit {
  @ViewChild('companyTable') companyTable!: ReusableTableComponent;
  results: any[] = [];
  searchResults: any[] = []
  companyList: any[] = []
  userData: any;
  hasViewPermission : boolean = false;
  permissionError : boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
   headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  // Table configuration
  tableConfig: TableConfig;

  tableLoading = false;
  private readonly stateKey = 'company-list-state';

  protected config: ListComponentConfig = {
    storageKey: 'company-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'CompanyMasterSid',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allCompany() { return this.allItems; }

  isFavorite: boolean = false;
  // Company
  currentCompany: any;
  currentBranch: any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
 
  constructor(private masterService: MasterService, private router: Router,
    private appSettingService: AppSettingsService, private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    public mps:MenuPermissionService
  ) {
    super(paginationService);
  }
  override ngOnInit() {
    // this.loadCompanies();
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;

    //     }
    //   }
    // )
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    this.userData = userProfile;
    
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    // Initialize table configuration
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.spinner.show();
    this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
      this.initializeHeaderActions();
      this.checkViewPermission();
    })
    
      
     
    // Initialize base component
    // super.ngOnInit();
  }

  private checkViewPermission(): void {
    this.hasViewPermission = this.mps.can('view');

    if (!this.hasViewPermission) {
      this.permissionError = true;

      this.allItems = [];
      this.totalLengthOfCollection = 0;

      this.tableConfig = {
        ...this.tableConfig,
        showPagination : false,
        overlayVisible: true,
        overlayMessage: `You don't have permission to view the company list`,
        overlayIcon: 'fas fa-lock'
      };

      super.updatePaginationConfig();
      this.spinner.hide();
    } else {
      this.permissionError = false;

      this.tableConfig = {
        ...this.tableConfig,
        overlayVisible: false,
        showPagination : true
      };

      this.restoreListState();
      super.loadData();
    }
  }


  initializeTableConfig(){
    this.tableConfig = {
    columns:  [
      {
        key: 'companyName',
        label: 'Company Name ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'companyCode',
        label: 'Company Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'branchName',
        label: 'Branch Name ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
        {
        key: 'country',
        label: 'Country',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
    
      {
        key: 'state',
        label: 'State',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        cellClass: 'vessel-column'
      },
        {
        key: 'city',
        label: 'City',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'gst',
        label: 'VAT/GST No',
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
    trackByKey: 'CompanyMasterSid',
    emptyMessage: 'No company found',
    dragAndDrop: true
  };
  }
  

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    if (!this.hasViewPermission) {
      this.tableLoading = false;
      this.spinner.hide();
      return of({
        status: false,
        message: 'You do not have permission to view company list',
        data: { items: [], totalCount: 0 }
      });
    }
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchCompanyList(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams {
    const search = this.filterValue.trim();
    return {
      search,
      searchTerm: search,
      filterValue: search,
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
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
      const normalizedItems = rawItems.map(item => this.normalizeCompanyRow(item));
      const filteredItems = this.applyLocalSearch(normalizedItems);

      this.allItems = filteredItems;
      this.totalLengthOfCollection = this.filterValue.trim()
        ? filteredItems.length
        : response.data.totalCount || normalizedItems.length || 0;
      this.applySorting();
       this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching company.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  onSearchTriggered(searchValue: string): void {
    if (!this.hasViewPermission) {
      this.appSettingService.showError('You do not have permission to view company list');
      return;
    }
    this.filterValue = searchValue;
    this.page = 1;
    this.saveListState();
    this.searchCompany();
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
        this.navigateToCreateDepartment();
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

  // onModalDropdownItemClick(action: string): void {
  //   switch (action) {
  //     case 'edoc':
  //       this.openEDoc();
  //       break;
  //     case 'terms':
  //       this.openTandC();
  //       break;
  //     case 'authority':
  //       this.openAuthority();
  //       break;
  //     case 'email':
  //       this.openEmail();
  //       break;
  //     default:
  //       console.warn(`Unknown dropdown action: ${action}`);
  //   }
  // }

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'report') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 };
      }
      return action;
    });
  }
  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching company.');
    console.error('Error searching company', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchCompany() {
    this.saveListState();
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.CompanyMasterSid || index;
  }


  viewCompany(row: any): void {
    this.router.navigate(['/master/company/entry/', row.CompanyMasterSid]);
  }

  navigateToCreate() {
    this.router.navigate(['operation/booking/entry']);
  }


  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewCompany(event.row);
    }else if (event.action === 'delete') {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row: any) {
    this.deleteCompany(row.CompanyMasterSid)
  }

  onTableRowClick(row: any): void {
    // Row clicking can be handled by the table component if needed
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.saveListState();
    this.search();
  }

  override onPageChange(newPage: number): void {
    this.page = newPage;
    this.updatePaginationConfig();
    this.saveListState();
    this.search();
  }

  override onPageSizeChange(newPageSize: number): void {
    this.pageSize = Number(newPageSize);
    this.page = 1;
    this.updatePaginationConfig();
    this.saveListState();
    this.search();
  }

  override resetPage(): void {
    sessionStorage.removeItem(this.stateKey);
    super.resetPage();
  }

  override clearFilter(): void {
    sessionStorage.removeItem(this.stateKey);
    super.clearFilter();
  }

  private normalizeCompanyRow(item: any): any {
    const branch = Array.isArray(item?.branchMaster) ? item.branchMaster[0] : item?.branchMaster;

    return {
      ...item,
      branchName: item?.branchName ?? branch?.branchName ?? '',
      city: item?.city ?? branch?.cityMaster?.cityName ?? branch?.city ?? '',
      state: item?.state ?? branch?.stateMaster?.stateName ?? branch?.state ?? '',
      country: item?.country ?? branch?.countryMaster?.countryName ?? branch?.country ?? '',
      gst: item?.gst ?? branch?.taxRegistrationNo ?? branch?.gst ?? '',
      status: item?.status === 'A' || item?.status === 'Active' ? 'Active' : 'Suspended'
    };
  }

  private applyLocalSearch(items: any[]): any[] {
    const search = this.filterValue.trim().toLowerCase();
    if (!search) {
      return items;
    }

    const searchableKeys = [
      'companyName',
      'companyCode',
      'branchName',
      'country',
      'state',
      'city',
      'gst',
      'status'
    ];

    return items.filter(item =>
      searchableKeys.some(key => String(item?.[key] ?? '').toLowerCase().includes(search))
    );
  }

  private saveListState(): void {
    const state = {
      filterValue: this.filterValue,
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };
    sessionStorage.setItem(this.stateKey, JSON.stringify(state));
  }

  private restoreListState(): void {
    const rawState = sessionStorage.getItem(this.stateKey);
    if (!rawState) {
      return;
    }

    try {
      const state = JSON.parse(rawState);
      this.filterValue = state?.filterValue ?? '';
      this.page = Number(state?.page || 1);
      this.pageSize = Number(state?.pageSize || this.config.defaultPageSize);
      this.sortColumn = state?.sortColumn || this.config.defaultSortColumn;
      this.sortDirection = state?.sortDirection === 'asc' ? 'asc' : 'desc';
      this.updatePaginationConfig();
    } catch {
      sessionStorage.removeItem(this.stateKey);
    }
  }

  onTableFilterChange(filters: TableFilter[]): void {
    // For now, we'll handle this with the existing search functionality
    // In a more advanced implementation, you could apply individual column filters
    console.log('Filters changed:', filters);
  }

  report(): void {
    const formattedData = this.allCompany;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.companyTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Company-Report',
      title: companyName
    });
  }
  // loadCompanies(): void {
  //   this.spinner.show();
  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection.toUpperCase()
  //   };


  //   this.masterService.searchCompanyList(params).subscribe({
  //     next: (response) => {
  //       if (response.status) {
  //         this.companyList = response.data.items;
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searchPerformed = true;
  //       } else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();

  //     },
  //     error: (err) => {
  //       console.error('Error fetching companies:', err);
  //       this.companyList = [];
  //       this.totalLengthOfCollection = 0;

  //     }
  //   });
  // }




  // applySorting() {
  //   console.log('Entered Sorting')
  //   this.searchResults.sort((a, b) => {
  //     // For company-level sorting
  //     if (['companyName', 'companyCode'].includes(this.sortColumn)) {
  //       return this.compareValues(a[this.sortColumn], b[this.sortColumn]);
  //     }
  //     // For branch-level sorting
  //     else {
  //       const branchA = a.branchMaster?.[0] || {};
  //       const branchB = b.branchMaster?.[0] || {};

  //       switch(this.sortColumn) {
  //         case 'branchName':
  //           return this.compareValues(branchA.branchName, branchB.branchName);
  //         case 'city':
  //           return this.compareValues(branchA.cityMaster?.cityName, branchB.cityMaster?.cityName);
  //         case 'state':
  //           return this.compareValues(branchA.stateMaster?.stateName, branchB.stateMaster?.stateName);
  //         case 'country':
  //           return this.compareValues(branchA.countryMaster?.countryName, branchB.countryMaster?.countryName);
  //         case 'gst':
  //           return this.compareValues(branchA.taxRegistrationNo, branchB.taxRegistrationNo);
  //         default:
  //           return 0;
  //       }
  //     }
  //   });
  // }


  private compareValues(valueA: any, valueB: any): number {
    // Handle null/undefined values
    if (valueA == null) valueA = '';
    if (valueB == null) valueB = '';

    // Convert to string for case-insensitive comparison
    valueA = valueA.toString().toLowerCase();
    valueB = valueB.toString().toLowerCase();

    if (valueA < valueB) {
      return this.sortDirection === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return this.sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  }



  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadCompanies();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCompany(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteCompanyById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");

        });
      }
    });
  }

  navigateToCreateDepartment() {
    this.router.navigate(['master/company/entry'])
  }


}

