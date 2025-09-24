import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
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
  selector: 'app-vessel-list',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    RouterModule,
    ListpageComponent,
    FavoriteStarComponent,
    NgxSpinnerModule,
    ReusableTableComponent
  ],
  templateUrl: './vessel-list.component.html',
  styleUrl: './vessel-list.component.scss'
})
export class VesselListComponent extends BaseListComponent implements OnInit {
  @ViewChild('vesselTable') vesselTable!: ReusableTableComponent;
  // filterValue: any;
  vesselList: any[] = [];
  searched = false;
  userData: any;
  loading: boolean = false;

  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // pagination
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection: number;
  isFavorite: boolean = false;

  // sorting
  // sortColumn: string = 'VesselName';
  // sortDirection: string = 'asc'; 
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  // Company
  currentCompany: any;
  currentBranch: any;
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View vessel',
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
    trackByKey: 'VesselMasterSid',
    emptyMessage: 'No vessel found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'vessel-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'VesselName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allVessels() { return this.allItems; }

  constructor(private masterService: MasterService, private router: Router,
    private appSettingService: AppSettingsService, private dialog: MatDialog,
    private excelReportService: ExcelExportService, private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }
  override ngOnInit() {
    // this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    //      this.checkPermissions();
    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.loadVessels();
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
    return this.masterService.searchVesselList(this.getSearchParams());
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
    } else {
      this.appSettingService.showError('Error searching bookings.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching bookings.');
    console.error('Error searching bookings', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchVessels() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.BookingHeaderSid || index;
  }


  viewVessel(vessel: any): void {
    this.router.navigate(['master/vessel/entry', vessel.VesselMasterSid]);
  }


  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'VesselName',
        label: 'Vessel Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'VesselType',
        label: 'Vessel Type',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'YearofBuilt',
        label: 'Year of Built',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'VesselOperator',
        label: 'Vessel Operator',
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
      this.viewVessel(event.row);
    } else if (event.action === "delete") {
      this.delete(event.row)
    }
  }


  delete(row: any) {
    this.deleteVessel(row.VesselMasterSid)
  }


  deleteVessel(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteVesselById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.loadVessels();
          this.searchVessels();
          // this.router.navigate(['master/vessel/list'])
          // this.search();
        }, (error) => {
          this.appSettingService.showError("Error Deleting Vessel", error);
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
    const formattedData = this.allVessels;
    const companyName = this.currentCompany?.companyName ?? 'Company';
    const visibleColumns = this.vesselTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Vessel-Report',
      title: companyName
    });
  }
  loadVessels(): void {
    this.spinner.show();
    const params = {
      search: this.filterValue ? this.filterValue.trim() : '',
      page: this.page,
      pageSize: this.pageSize,
    };

    this.masterService.searchVesselList(params).subscribe({
      next: (response) => {
        if (response.status) {
          this.vesselList = response.data.items;
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        }
        else {
          this.appSettingService.showError(response.message);
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching vessels:', err);
        this.vesselList = [];
        this.totalLengthOfCollection = 0;
      },
    });
  }


  // search(): void {
  //   if (!this.filterValue) {
  //     this.searchResults = [...this.vesselList];
  //     this.totalLengthOfCollection = this.searchResults.length;
  //     this.applySorting();
  //     this.searchPerformed = true;
  //     this.updatePaginatedData();
  //     console.log(this.searchResults);
  //     return;
  //   }
  //   if (this.filterValue) {
  //     this.searchResults = this.searchResults.filter(item => {
  //       return (
  //         (item.VesselName && item.VesselName.toLowerCase().includes(this.filterValue.toLowerCase())) ||
  //         (item.VesselType && item.VesselType.toLowerCase().includes(this.filterValue.toLowerCase())) ||
  //         (item.YearofBuilt && item.YearofBuilt === Number(this.filterValue)) ||
  //         (item.VesselOperator && item.VesselOperator.toLowerCase().includes(this.filterValue.toLowerCase())) ||
  //         (item.status && item.status.toLowerCase().includes(this.filterValue.toLowerCase()))
  //       );
  //     });
  //     this.totalLengthOfCollection = this.searchResults.length;
  //     this.applySorting();
  //     this.searchPerformed = true;
  //     this.updatePaginatedData();
  //     console.log(this.searchResults);
  //   }
  // }


  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadVessels();
    // this.vesselList = this.searchResults.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }



  navigateToCreateVessel() {
    this.router.navigate(['master/vessel/entry'])
  }


}
