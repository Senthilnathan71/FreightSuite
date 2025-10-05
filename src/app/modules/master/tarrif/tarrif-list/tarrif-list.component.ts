import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Tariff } from 'src/app/modules/crm-mobile/Interfaces/tariff.interface';
import { Router, RouterModule } from '@angular/router';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
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
  selector: 'app-tarrif-list',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    RouterModule,
    NgbPaginationModule,
    CustomDatePipe,
    ListpageComponent,
    FavoriteStarComponent,
    NgxSpinnerModule,
    ReusableTableComponent
  ],
  templateUrl: './tarrif-list.component.html',
  styleUrl: './tarrif-list.component.scss',
  providers: [
    CustomDatePipe
  ]
})
export class TarrifListComponent extends BaseListComponent implements OnInit {
  @ViewChild('tarrifTable') tarrifTable!: ReusableTableComponent;
  searchType: string = "POLTerminal";
  // filterValue: string;
  results: Tariff[];
  tariffList: any[];
  searched: boolean = false;
  userData: any;

  // pagination values
  // page = 1;
  // pageSize = 15;
  // totalNumberOfCollection: number;
  // sortColumn: string = 'POLTerminal'; 
  // sortDirection: string = 'asc';
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  isFavorite: boolean = false;
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
        tooltip: 'View tarrif',
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
    trackByKey: 'TariffHeaderSid',
    emptyMessage: 'No Tarrif found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'tarrif-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'Department',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allTarrif() { return this.allItems; }
  constructor(
    private masterServ: MasterService,
    private dialog: MatDialog,
    private appSettingServ: AppSettingsService,
    private appSettingService: AppSettingsService,
    private router: Router,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe
  ) {
    super(paginationService);
  }


  override ngOnInit() {
    // this.appSettingServ.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       this.checkPermissions();
    //     }
    //   });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingServ.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.loadTariffs();

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
      this.masterServ
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
    return this.masterServ.searchTariffList(this.getSearchParams());
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
        Dept: item.departmentMaster?.departmentName,
        carrier: item.customerCarrier?.CustomerName,
        agent: item.customerAgent?.CustomerName,
        status: item.status === 'A' ? 'Active' : 'Suspended',
        EffectiveDate: this.datePipe.transform(item?.EffectiveDate)
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
  searchTarrif() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.TariffHeaderSid || index;
  }



  viewBooking(tarrif: any): void {
    this.router.navigate(['/master/tarrif/entry/', tarrif.TariffHeaderSid]);
  }

  deleteTariff(TariffHeaderSid) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.masterServ.deleteTariffById(TariffHeaderSid).subscribe(
          (resp: any) => {
            this.appSettingServ.showSuccess("Tariff deleted successfully!");
            // this.router.navigate([`master/tarrif/list`]);
            this.loadTariffs()
            this.searchTarrif();
          });
      }
    })
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'Dept',
        label: 'Department',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'p',
        label: 'POL',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'POD',
        label: 'POD',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'carrier',
        label: 'Carrier',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'agent',
        label: 'Agent',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        cellClass: 'vessel-column'
      },
      {
        key: 'EffectiveDate',
        label: 'Effective From',
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
    } else if (event.action === "delete") {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row) {
    this.deleteTariff(row.TariffHeaderSid)
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
    const formattedData = this.allTarrif;
    const companyName = this.currentCompany?.companyName ?? 'Company';
    const visibleColumns = this.tarrifTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Tarrif-Report',
      title: companyName
    });
  }

  loadTariffs(): void {
    this.spinner.show();
    let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const params = {
      search: this.filterValue ? this.filterValue.trim() : '',
      page: this.page,
      pageSize: this.pageSize,
      activeCompanyId: CompanyMasterSid,
    };

    this.masterServ.searchTariffList(params).subscribe({
      next: (response) => {
        if (response.status) {
          this.tariffList = response.data.items;
          this.results = [...this.tariffList];
          // this.totalNumberOfCollection = response.data.totalCount;
          // this.applySorting();
          this.searched = true;
        } else {
          this.appSettingService.showError(response.message);
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching tariffs:', err);
        this.tariffList = [];
        this.results = [];
        // this.totalNumberOfCollection = 0;
      },
    });
  }

  onSearch(event: { type: string, value: string }) {
    this.searchType = event.type;
    this.filterValue = event.value;
    console.log('Searching with:', this.searchType, this.filterValue);
    this.search();
  }

  // search() {
  //   const intFields = ['Carrier', 'AgentSid'];
  //   const payload = {
  //     searchType: this.searchType,
  //     filterValue: intFields.includes(this.searchType) ? Number(this.filterValue) : this.filterValue
  //   }
  //   this.masterServ.searchTariffList(payload).subscribe(
  //     (res) => {
  //       this.results = res.data;
  //       this.searched = true;
  //       // this.applySorting();
  //       this.updatePaginationData();
  //       this.totalNumberOfCollection = this.results.length || 0;
  //     }
  //   )
  // }


  updatePaginationData() {
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
    this.loadTariffs();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }



  navigateToCreateTariff() {
    this.router.navigate(['master/tarrif/entry']);
  }



  reset() {
    this.tariffList = [];
    this.filterValue = '';
    this.searched = false;
    // this.totalNumberOfCollection = 0;
    this.sortColumn = 'POLTerminal';
    this.sortDirection = 'asc';
    this.loadTariffs();
  }


}
