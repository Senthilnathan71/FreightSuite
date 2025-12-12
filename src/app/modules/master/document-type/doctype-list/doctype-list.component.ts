import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from 'src/app/modules/master/master.service';
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
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
@Component({
  selector: 'app-doctype-list',
  standalone: true,
  imports: [CommonModule, FeatherModule, FormsModule, NgbPaginationModule, RouterModule, ListpageComponent, FavoriteStarComponent, NgxSpinnerModule, ReusableTableComponent, PageHeaderComponent, ToolsDropdownComponent],
  templateUrl: './doctype-list.component.html',
  styleUrl: './doctype-list.component.scss'
})
export class DoctypeListComponent extends BaseListComponent implements OnInit {
  @ViewChild('doctTypeTable') doctTypeTable!: ReusableTableComponent;
  searchType = 'DocumentTypeName';
  // filterValue = '';
  results: any[] = [];
  docTypeList: any[] = []
  // searchPerformed = false;
  // sortColumn: string = 'DocumentTypeName';
  // sortDirection: string = 'asc';
  loading = false;
  permissions: string[] = [];
  tableConfig: TableConfig ;
  currentMenuPermissions: any = {};
  // pagination
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection: number;
  userData: any
  isFavorite: boolean = false;
  // Company
  currentCompany: any;
  currentBranch: any;
  headerActions: HeaderAction[] = [];
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  // Table configuration
  

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'document-Type-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'DocumentTypeName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allDoctType() { return this.allItems; }
  constructor(
    private masterService: MasterService,
    private excelReportService: ExcelExportService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    public mps : MenuPermissionService
  ) {
    super(paginationService);
  }
  override ngOnInit() {
    // this.appSettingService.getUser().subscribe(user => {
    //    if (user) {
    //       this.userData = user;
    //       
    //    }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      
    }
    // this.loadDocTypes();
    // Initialize table configuration
    this.initializeTableConfig();
     this.initializeHeaderActions();
     this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
      this.initializeHeaderActions();
    })
    // Initialize base component
    super.ngOnInit();
    
  }
  

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchDocTypes(this.getSearchParams());
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
        branchName: item.branchMaster?.branchName,
        status: item.status === 'A' ? 'Active' : 'Suspended'
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
    this.searchDoctType();
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
        action: 'reset',
      }
    ];
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.navigateToCreateDocType();
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
      } else if (action.action === 'reset') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 }
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
  searchDoctType() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.VoucherTypeMasterSid || index;
  }


  viewDoctType(item: any): void {
    this.router.navigate(['/master/doctype/entry/', item.VoucherTypeMasterSid]);
  }



  // Table configuration
  private initializeTableConfig(): void {
   this.tableConfig = {
    columns: [
       {
        key: 'DocumentTypeName',
        label: 'Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'Type',
        label: 'Type',
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
    trackByKey: 'VoucherTypeMasterSid',
    emptyMessage: 'No document-type found',
    dragAndDrop: true
  };
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewDoctType(event.row);
    } else if (event.action === 'delete') {
      this.deleteBy(event.row)
    }
  }


  deleteBy(row: any) {
    this.deleteDocType(row.VoucherTypeMasterSid)
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
    const formattedData = this.allDoctType;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.doctTypeTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'documnent-Type-Report',
      title: companyName
    });
  }
  // loadDocTypes(): void {
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

  //   this.masterService.searchDocTypes(params).subscribe({
  //     next: (response: any) => {
  //       if (response.status) {
  //         this.docTypeList = response.data.items;
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
  //       console.error('Error fetching document types:', err);
  //       this.docTypeList = [];
  //       this.totalLengthOfCollection = 0;
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
  //   this.loadDocTypes();

  //   this.applySorting();
  //   this.updatePaginatedData();
  // }

  // applySorting() {
  //   this.docTypeList.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];

  //     // Handle null/undefined values and nested properties
  //     if (this.sortColumn === 'branch') {
  //       valueA = a.branchMaster?.branchName || '';
  //       valueB = b.branchMaster?.branchName || '';
  //     } else {
  //       if (valueA == null) valueA = '';
  //       if (valueB == null) valueB = '';
  //     }

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



  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadDocTypes();
    this.searchDoctType()
  }
  // clearFilterValue() {
  //   this.filterValue = '';
  //   this.loadDocTypes();
  // }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteDocType(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteDocTypeById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.router.navigate(['master/doctype/list'])
          // this.loadDocTypes();
          this.searchDoctType()
        });
      }
    });
  }

  navigateToCreateDocType() {
    this.router.navigate(['master/doctype/entry'])
  }

  // resetPage() {
  //   this.searchPerformed = false;
  //   this.docTypeList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.filterValue = '';
  //   this.searchType = 'DocumentTypeName';
  //   this.page = 1;
  //   this.sortColumn = 'DocumentTypeName';
  //   this.sortDirection = 'asc';
  //   this.loadDocTypes();
  // }

  // report(): void {
  //   const formattedData = this.docTypeList.map(item => ({
  //     ...item,
  //     branch: item.branchMaster.branchName,
  //     Status: item.status === 'A' ? 'Active' : 'Suspended'
  //   }));

  //   // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'DocumentTypeName', label: 'Name' },
  //       { key: 'Type', label: 'Type' },
  //       { key: 'branch', label: 'Branch' },
  //       { key: 'Status', label: 'Status' }
  //     ],
  //     fileName: 'DocumentType-Report',
  //     title: companyName
  //   });
  // }

}
