import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
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
@Component({
  selector: 'app-uom-list',
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
    ReusableTableComponent
  ],
  templateUrl: './uom-list.component.html',
  styleUrl: './uom-list.component.scss'
})
export class UOMListComponent extends BaseListComponent implements OnInit {
  @ViewChild('uomTable') uomTable!: ReusableTableComponent;
  // filterValue = '';
  uomList: any[] = [];
  searched = false;
  userData: any;
  // pagination
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection: number;
  isFavorite: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};

  // sortColumn: string = 'UOMName';
  // sortDirection: string = 'asc';
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
        tooltip: 'Delete',
        class: "text-danger",
        condition: (row: any) => this.hasPermission('Delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: '',
    emptyMessage: 'No uom found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'uom-list-state',
    defaultPageSize: 10,
    defaultSortColumn: '',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allUom() { return this.allItems; }
  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    //   this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    //     this.checkPermissions();
    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.loadUoms();
    // Initialize table configuration
    this.initializeTableConfig();

    // Initialize base component
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
            console.log(this.permissions);
          },
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
    return this.masterService.searchUomList(this.getSearchParams());
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
        // ReceivedDate: this.datePipe.transform(item?.ReceivedDate)
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
    } else {
      this.appSettingService.showError('Error searching uom.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching uom.');
    console.error('Error searching uom', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchUOM() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.UOMMasterSid || index;
  }


  viewUom(row: any): void {
    this.router.navigate(['/master/uom-master/view/', row.UOMMasterSid]);
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [

     
      {
        key: 'UOMName',
        label: 'UOM Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'UOMCode',
        label: 'UOMCode',
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
      this.viewUom(event.row);
    } else if (event.action === "delete") {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row: any) {
    this.deleteUom(row.UOMMasterSid)
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
    const formattedData = this.allUom;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.uomTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'uom-Report',
      title: companyName
    });
  }
  loadUoms(): void {
    this.spinner.show();
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
    };

    this.masterService.searchUomList(params).subscribe({
      next: (response) => {
        if (response.status) {
          this.uomList = response.data.items;
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        } else {
          this.appSettingService.showError(response.message);
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching Uoms:', err);
        this.uomList = [];
        this.totalLengthOfCollection = 0;
      },
    });
  }

  // sort(column: string) {
  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }

  //   this.applySorting();
  // }

  // applySorting() {
  //   if (!Array.isArray(this.uomList)) {
  //     this.uomList = [];
  //     return;
  //   }
  //   this.uomList.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];

  //     if (valueA == null) valueA = '';
  //     if (valueB == null) valueB = '';

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
    this.loadUoms();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteUom(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteUomById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.loadUoms();
          this.searchUOM();
        });
      }
    });
  }

  navigateToCreateUom() {
    this.router.navigate(['master/uom-master/view'])
  }

  // resetPage() {
  //   this.uomList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.searched = false;
  //   this.filterValue = '';
  //   this.page = 1;
  //   this.sortColumn = 'UOMName';
  //   this.sortDirection = 'asc';
  //   this.loadUoms();
  // }

  //   report(): void {

  //   const formattedData = this.uomList.map(item => ({
  //     ...item,
  //     status: this.getStatusText(item.status) 
  //   }));


  //   // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'UOMName', label: 'UOM Name' },
  //       { key: 'UOMCode', label: 'UOM Code' },
  //       { key: 'status', label: 'Status' }
  //     ],
  //     fileName: 'UOM-Report', 
  //     title: companyName
  //   });
  // }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  // clearFilterValue() {
  //   this.filterValue = '';
  // }
}