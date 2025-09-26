import { Component, OnInit, ViewChild } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
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
  selector: 'app-country-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    ListpageComponent,
    FavoriteStarComponent,
    NgxSpinnerModule,
    ReusableTableComponent
  ],
  templateUrl: './country-list.component.html',
  styleUrl: './country-list.component.scss'
})
export class CountryListComponent extends BaseListComponent implements OnInit {
  @ViewChild('countryTable') countryTable!: ReusableTableComponent;
  searchType = 'countryName';
  countryList: any[] = [];
  allCountries: any[] = [];
  loading: boolean = false;
  zoneOptions: any[] = [];
  currencyOptions: any[] = [];
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  isFavorite: boolean = false;
  // Company
  currentCompany: any;
  currentBranch: any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View country',
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
    trackByKey: 'CountryMasterSid',
    emptyMessage: 'No country found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'country-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'countryName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allCountry() { return this.allItems; }
  constructor(
    private masterService: MasterService,
    private route: Router,
    private appService: AppService,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
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
    this.loadZones();
    this.loadCurrencies();
    this.loadCountries();
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
    return this.masterService.searchCountries(this.getSearchParams());
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

  if (response && (response.status || response.items || response.data)) {
    // Build lookup maps like before
    const zoneMap = this.zoneOptions.reduce((acc, zone) => {
      acc[zone.ZoneMasterSid] = zone.ZoneName;
      return acc;
    }, {} as Record<number, string>);

    const currencyMap = this.currencyOptions.reduce((acc, currency) => {
      acc[currency.CurrencyMasterSid] = currency.currencyName || currency.CurrencyName;
      return acc;
    }, {} as Record<number, string>);

    // Normalize payload
    const rawItems = response.data?.items || response.items || response || [];

    // Map zone & currency into table rows
    this.allItems = rawItems.map((country: any) => ({
      ...country,
      zoneName: zoneMap[country.ZoneMasterSid] || country.zoneMaster?.ZoneName || '-',
      currencyName: currencyMap[country.CurrencyMasterSid] || country.currencyMaster?.currencyName || '-',
      status: country.status === 'A' ? 'Active' : 'Suspended'
    }));

    // Total records
    this.totalLengthOfCollection = response.data?.totalCount || response.totalCount || rawItems.length || 0;

    this.applySorting();
    this.searchPerformed = true;
  } else {
    this.appSettingService.showError(response?.message || 'Error searching Country.');
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
  searchCountry() {
    this.search();
    console.log(this.search, "Serach")
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.CountryMasterSid || index;
  }
  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewBooking(event.row);
    } else if (event.action === "delete") {
      this.deleteBy(event.row)
    }
  }

  viewBooking(country: any): void {
    this.route.navigate(['/master/country/entry/', country.CountryMasterSid]);
  }

  deleteBy(row:any) {
    this.deleteCountry(row.CountryMasterSid)
  }
  deleteCountry(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteCountryById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Country deleted successfully!");
            this.search();
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }
  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'countryName',
        label: 'Country Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'countryCode',
        label: 'Country Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'zoneName',
        label: 'Zone',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'currencyName',
        label: 'Currency',
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
    const formattedData = this.allCountry;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.countryTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Country-Report',
      title: companyName
    });
  }
  loadCountries(): void {
    this.spinner.show();
    this.loading = true;

    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    this.masterService.searchCountries(params).subscribe({
      next: (response) => {
        if (response) {
          // Create lookup maps
          const zoneMap = this.zoneOptions.reduce((acc, zone) => {
            acc[zone.ZoneMasterSid] = zone.ZoneName;
            return acc;
          }, {});

          const currencyMap = this.currencyOptions.reduce((acc, currency) => {
            acc[currency.CurrencyMasterSid] = currency.currencyName || currency.CurrencyName;
            return acc;
          }, {});

          // Map the response data with zone and currency names
          this.countryList = (response.items || response.data || response).map((country: any) => ({
            ...country,
            zoneName: zoneMap[country.ZoneMasterSid] || '-',
            currencyName: currencyMap[country.CurrencyMasterSid] || '-'
          }));

          this.totalLengthOfCollection = response.totalCount || response.length || 0;
          this.applySorting();
          this.searchPerformed = true;
        }
        else {
          this.appSettingService.showError(response.message);
        }

        this.spinner.hide();
        this.loading = false;
      },
      error: (err) => {

        console.error('Error fetching countries:', err);
        this.countryList = [];
        this.totalLengthOfCollection = 0;
        this.loading = false;
      }
    });
  }
  loadZones() {
    this.loading = true;
    this.masterService.getAllZones().subscribe({
      next: (res: any) => {
        this.zoneOptions = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading zones:', err);
        this.loading = false;
      }
    });
  }

  loadCurrencies() {
    this.loading = true;
    this.masterService.getAllCurrencies().subscribe({
      next: (res: any) => {
        console.log('Currency API Response:', res);
        this.currencyOptions = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading currencies:', err);
        this.loading = false;
      }
    });
  }

  updatePaginatedData() {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadCountries();
  }

  createNew() {
    this.route.navigate(['master/country/entry']);
  }
  reset() {
    this.filterValue = '';
    this.searchType = 'countryName';
    this.page = 1;
    this.searchPerformed = false;
    this.countryList = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'countryName';
    this.sortDirection = 'asc';
    this.loadCountries();
  }
}