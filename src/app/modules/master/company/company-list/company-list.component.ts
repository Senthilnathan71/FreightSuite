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
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
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
  permissions: string[] = [];
  currentMenuPermissions: any = {};
   headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
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
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'CompanyMasterSid',
    emptyMessage: 'No comapny found',
    dragAndDrop: true
  };

  tableLoading = false;

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
    paginationService: PaginationService
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
    this.checkPermissions();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    // Initialize table configuration
    this.initializeTableConfig();
      this.initializeHeaderActions();
      this.initializeModalDropdownItems();
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
          this.initializeModalDropdownItems();
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
    return this.masterService.searchCompanyList(this.getSearchParams());
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
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
       this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching company.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

    onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
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

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      // {
      //   key: 'BookingNo',
      //   label: 'Booking No',
      //   sortable: true,
      //   filterable: true,
      //   visible: true,
      //   template: 'link',
      //   width: '180px',
      //   dataType: 'string'
      // },
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
    ];
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewCompany(event.row);
    }
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

