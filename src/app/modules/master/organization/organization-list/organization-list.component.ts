import { Component, OnInit, ViewChild } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
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
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [FeatherModule, NgSelectModule, NgbPaginationModule, CommonModule, RouterModule, FormsModule, ReactiveFormsModule, ListpageComponent, FavoriteStarComponent, NgxSpinnerModule, ReusableTableComponent, PageHeaderComponent, ToolsDropdownComponent],
  templateUrl: './organization-list.component.html',
  styleUrl: './organization-list.component.scss'
})
export class OrganizationListComponent extends BaseListComponent implements OnInit {
  @ViewChild('organizationTable') organizationTable!: ReusableTableComponent;

  modeOfStatus = [
    { value: 'Active', name: 'Active' },
    { value: 'Invalid', name: 'Invalid' },
    { value: 'Block', name: 'Block' },
  ]
  searchType = 'CustomerName';
  // filterValue = '';
  results: any[] = [];
  organizationList: any[] = []
  // searchPerformed = false;
  userData: any;
  loading = false;
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];

  isFavorite: boolean = false;
  allOrganizations: any[] = [];
  // sortColumn: string = 'CustomerName';
  // sortDirection: string = 'asc';
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  countryList: any[] = [];
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
        tooltip: 'Delete Zone',
        class: "text-danger",
        condition: (row: any) => this.hasPermission('Delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'CustomerMasterSid',
    emptyMessage: 'No Organization found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'organization-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'CustomerName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allOrganization() { return this.allItems; }

  constructor(private masterService: MasterService, private router: Router,
    private dialog: MatDialog, private appSettingService: AppSettingsService,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }
  override ngOnInit() {
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       this.checkPermissions();
    //     }
    //   }
    // );
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.loadCountryList();
    // this.loadOrganizations();

    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.initializeModalDropdownItems();

    // Initialize base component
    super.ngOnInit();
  }

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchOrganizationList(this.getSearchParams());
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
        countryName: this.getCountryName(item.CountryMasterSid),
        type: this.getFirstTrueKey(item.CustomerType) || "N/A"
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching bookings.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }
  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
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
        this.navigateToCreateOrganization();
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
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching bookings.');
    console.error('Error searching bookings', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchOrganization() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.CustomerMasterSid || index;
  }


  viewCompany(item: any): void {
    this.router.navigate(['/master/organization/entry/', item.CustomerMasterSid]);
  }


  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [

      {
        key: 'CustomerName',
        label: 'Customer Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'type',
        label: 'Type ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'CustomerShortCode',
        label: 'Short Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'PanType',
        label: 'PAN/VAT',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'countryName',
        label: 'Country ',
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


  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewCompany(event.row);
    } else if (event.action = "delete") {
      this.deleteBy(event.row)
    }
  }


  deleteBy(row: any) {
    this.deleteOrganization(row.CustomerMasterSid)
  }

  deleteOrganization(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteOrganizationById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.router.navigate(['master/organization/list'])
          this.searchOrganization();
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
    const formattedData = this.allOrganization;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.organizationTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Organization-Report',
      title: companyName
    });
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
  loadCountryList() {
    this.masterService.getAllCountry().subscribe({
      next: (response) => {
        this.countryList = response.data || [];
      },
      error: (err) => {
        console.error('Error loading country list:', err);
      }
    });
  }
  // loadOrganizations(): void {
  //   this.spinner.show();
  //   this.loading = true;
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection,
  //     activeCompanyId: CompanyMasterSid
  //   };

  //   this.masterService.searchOrganizationList(params).subscribe({
  //     next: (response) => {
  //       if (response.status) {
  //         this.organizationList = response.data.items;
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searchPerformed = true;
  //       } else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error fetching organizations:', err);
  //       this.organizationList = [];
  //       this.totalLengthOfCollection = 0;
  //       this.loading = false;
  //     }
  //   });
  // }
  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadOrganizations();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
  getCountryName(countrySid: number): string {
    return this.countryList.find(c => c.CountryMasterSid === countrySid)?.countryName || '';
  }

  navigateToCreateOrganization() {
    this.router.navigate(['master/organization/entry'])
  }
  reset() {
    this.organizationList = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'CustomerName';
    this.sortDirection = 'asc';
    this.searchPerformed = false;
    this.filterValue = '';
    // this.loadOrganizations();
  }

  getFirstTrueKey(jsonStr: any): string {
  // Check if jsonStr is null, undefined, or not an object
  if (!jsonStr || typeof jsonStr !== 'object') {
    return "N/A";
  }

  for (const [key, value] of Object.entries(jsonStr)) {
    if (value === "isTrue") {
      return String(key).toUpperCase() + "...";
    }
  }

  return "N/A";
}
}
