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
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-currency-list',
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
  templateUrl: './currency-list.component.html',
  styleUrl: './currency-list.component.scss'
})
export class CurrencyListComponent extends BaseListComponent implements OnInit {
  @ViewChild('currencyTable') currencyTable!: ReusableTableComponent;
  searchType = 'currencyName';
  // filterValue = '';
  results: any[] = [];
  allCurrencies: any[] = []; // Renamed from results to allCurrencies for consistency
  currencyList: any[] = [];
  // searchPerformed = false;
  loading: boolean = false;
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // pagination
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection: number = 0;

  // sorting
  // sortColumn: string = 'currencyName'; // default sort column
  // sortDirection: string = 'asc'; // default sort direction
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
        tooltip: 'View currency',
        condition: (row: any) => this.hasPermission('View')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete currency',
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
    emptyMessage: 'No currency found',
    dragAndDrop: true
  };

  tableLoading = false;
  protected config: ListComponentConfig = {
    storageKey: 'currency-state',
    defaultPageSize: 10,
    defaultSortColumn: 'currencyName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allcurrency() { return this.allItems; }
  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    //   this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    //       this.checkPermissions();
    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.loadCurrencies();
    this.initializeTableConfig();
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
    return this.masterService.searchCurrencyList(this.getSearchParams());
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
      this.appSettingService.showError('Error searching currency.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching currency.');
    console.error('Error searching currency', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchcurrency() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.CurrencyMasterSid || index;
  }


  viewCurrency(row: any): void {
    this.router.navigate(['master/currency/entry', row.CurrencyMasterSid]);
  }


  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [

      {
        key: 'currencyName',
        label: 'Currency Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'currencyCode',
        label: 'Currency Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ShortCode',
        label: 'Short Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'CurrencyUnit',
        label: 'Unit',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'CurrencySubUnit',
        label: 'Sub Unit',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'SubUnitIn',
        label: 'Sub Unit In',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'RoundOf',
        label: 'Round Off ',
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
      this.viewCurrency(event.row);
    } else if (event.action === "delete") {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row: any) {
    this.deleteCurrency(row.CurrencyMasterSid)
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
    const formattedData = this.allcurrency;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.currencyTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Currency-Report',
      title: companyName
    });
  }
  loadCurrencies(): void {
    this.spinner.show();
    this.loading = true;

    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    this.masterService.searchCurrencyList(params).subscribe({
      next: (response) => {
        if (response.status) {
          this.currencyList = response.data.items;
          this.allCurrencies = response.data.items; // Maintain both lists if needed
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searchPerformed = true;
        } else {
          this.appSettingService.showError(response.message);
        }
        this.spinner.hide();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching currencies:', err);
        this.currencyList = [];
        this.allCurrencies = [];
        this.totalLengthOfCollection = 0;
        this.loading = false;
      }
    });
  }


  // sort(column: string) {
  //   if (this.sortColumn === column) {
  //     // Reverse the sort direction if clicking the same column
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     // Set new sort column and default to ascending
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }

  //   this.applySorting();
  //   this.updatePaginatedData();
  // }

  // applySorting() {
  //   this.allCurrencies.sort((a, b) => {
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

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadCurrencies();
  }
  // clearFilterValue() {
  //   this.filterValue = '';
  //   this.loadCurrencies();
  // }

  trackByCurrencyId(index: number, item: any): number {
    return item.CurrencyMasterSid;
  }

  deleteCurrency(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.softDelete(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Currency deleted successfully!");
            this.searchcurrency();
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateCurrency() {
    this.router.navigate(['master/currency/entry']);
  }

  // resetPage() {
  //   this.filterValue = '';
  //   this.searchType = 'currencyName';
  //   this.page = 1;
  //   this.searchPerformed = false;
  //   this.currencyList = [];
  //   this.allCurrencies = [];
  //   this.totalLengthOfCollection = 0;
  //   this.sortColumn = 'currencyName';
  //   this.sortDirection = 'asc';
  //   this.loadCurrencies();
  // }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }


}