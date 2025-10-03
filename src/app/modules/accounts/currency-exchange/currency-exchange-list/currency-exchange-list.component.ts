import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AccountsService } from '../../accounts.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { Observable } from 'rxjs';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
@Component({
  selector: 'app-currency-exchange-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    RouterModule,
    NgbPaginationModule,
    CustomDatePipe,
    FavoriteStarComponent,
    NgxSpinnerModule,
    CommonPaginationComponent,
    ReusableTableComponent
  ],
  providers: [CustomDatePipe],
  templateUrl: './currency-exchange-list.component.html',
  styleUrl: './currency-exchange-list.component.scss'
})
export class CurrencyExchangeListComponent extends BaseListComponent implements OnInit {
  @ViewChild('currencyExchangeTable') currencyExchangeTable!: ReusableTableComponent;
  searchType = 'FromCurrency';
  // filterValue = '';
  allResults: any[] = []; // Store all results for pagination and sorting
  currencyExchangeList: any[] = []; // Store paginated results
  // searchPerformed = false;
  loading: boolean = false;
  userData: any;

  // pagination
  // page = 1;
  // pageSize = 10;
  // totalLengthOfCollection: number = 0;

  //  sorting
  // sortColumn: string = 'EffectiveFrom'; 
  // sortDirection: string = 'desc'; 
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
      // {
      //   icon: 'fas fa-eye',
      //   label: 'View',
      //   action: 'view',
      //   tooltip: 'View',
      //   condition: (row: any) => this.hasPermission('View')
      // }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'LedgerSid',
    emptyMessage: 'No currency-exchange found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'currencyExchange-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'EffectiveFrom',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  get allCurrencyExchange() { return this.allItems; }
  constructor(
    private accountService: AccountsService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe
  ) {
    super(paginationService);
  }
  override ngOnInit(): void {
    //    this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    // this.loadCurrencyExchanges();
    this.initializeTableConfig();
    super.ngOnInit();
  }

  // loadCurrencyExchanges(): void {
  //   this.spinner.show();
  //   this.loading = true;
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   let BranchMasterSid=this.currentBranch?.BranchMasterSid;
  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection,
  //     activeCompanyId : CompanyMasterSid,
  //     activeBranchId: BranchMasterSid,
  //   };

  //   this.accountService.searchCurrencyExchangeList(params).subscribe({
  //     next: (response) => {
  //       if(response.status) {
  //         this.currencyExchangeList = response.data.items || response.data || [];
  //         this.totalLengthOfCollection = response.data.totalCount || response.length || 0;
  //         this.applySorting();
  //         this.searchPerformed = true;
  //       }else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error fetching currency exchanges:', err);
  //       this.currencyExchangeList = [];
  //       this.totalLengthOfCollection = 0;
  //       this.loading = false;
  //     }
  //   });
  // }
  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.accountService.searchCurrencyExchangeList(this.getSearchParams());
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
        status: item.status === 'A' ? 'Active' : 'Suspended',
        EffectiveFrom: this.datePipe.transform(item?.EffectiveFrom)
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
    } else {
      this.appSettingService.showError('Error fetching Currency-Exchange.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error fetching Currency-Exchange.');
    console.error('Error fetching Currency-Exchange', error);
    super.handleSearchError(error);
  }


  searchCurrencyExchange() {
    this.page = 1;
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  updatePaginationData(): void {
    this.search();
  }

  trackByExchangeId(index: number, item: any): number {
    return index;
  }

  override trackBy(index: number, item: any): number {
    return item.LedgerSid || index;
  }

  viewCurrencyExchange(item: any): void {
    this.router.navigate(['/operation/booking/entry', item.LedgerSid]);
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      // {
      //     key: 'BookingNo',
      //     label: 'Booking No',
      //     sortable: true,
      //     filterable: true,
      //     visible: true,
      //     template: 'link',
      //     width: '180px',
      //     dataType: 'string'
      // },
      {
        key: 'EffectiveFrom',
        label: 'Effective From',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'FromCurrency',
        label: 'From Currency',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ToCurrency',
        label: 'To Currency',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'SellRate',
        label: 'Sell Rate',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'BuyRate',
        label: 'Buy Rate',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        cellClass: 'vessel-column'
      },
      {
        key: 'RateFrom',
        label: 'Rate From ',
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
      this.viewCurrencyExchange(event.row);
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
    const formattedData = this.allCurrencyExchange;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.currencyExchangeTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Currency-Exchange-Report',
      title: companyName
    });
  }
  // sort(column: string) {
  //   if (this.sortColumn === column) {

  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {

  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.loadCurrencyExchanges();
  //   this.applySorting();
  //   this.updatePaginatedData();
  // }

  // applySorting() {
  //   this.currencyExchangeList.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];


  //     if (valueA == null) valueA = '';
  //     if (valueB == null) valueB = '';


  //     if (this.sortColumn === 'EffectiveFrom') {
  //       valueA = new Date(valueA).getTime();
  //       valueB = new Date(valueB).getTime();
  //     }


  //     if (this.sortColumn === 'SellRate' || this.sortColumn === 'BuyRate') {
  //       valueA = Number(valueA);
  //       valueB = Number(valueB);
  //     }


  //     if (typeof valueA !== 'number' && !(valueA instanceof Date)) {
  //       valueA = valueA.toString().toLowerCase();
  //       valueB = valueB.toString().toLowerCase();
  //     }

  //     if (valueA < valueB) {
  //       return this.sortDirection === 'asc' ? -1 : 1;
  //     }
  //     if (valueA > valueB) {
  //       return this.sortDirection === 'asc' ? 1 : -1;
  //     }
  //     return 0;
  //   });
  // }
  //   clearFilterValue() {
  //   this.filterValue = '';
  //   this.loadCurrencyExchanges();
  // }

  //   updatePaginatedData(): void {
  //     const startIndex = (this.page - 1) * this.pageSize;
  //     const endIndex = startIndex + this.pageSize;
  //     this.loadCurrencyExchanges();
  //   }

  //   trackByExchangeId(index: number, item: any): number {
  //     return item.ExchangeRateSid || index;
  //   }

  // deleteCurrencyExchange(id: number) {
  //   const dialogRef = this.dialog.open(DeleteWarningComponent);
  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result === true) {
  //       this.loading = true;
  //       this.accountService.deleteCurrencyExchangeById(id).subscribe({
  //         next: (resp: any) => {
  //           this.appSettingService.showSuccess("Currency exchange deleted successfully!");
  //           this.search(); // Refresh search results
  //         },
  //         error: (err) => {
  //           console.error('Delete error:', err);
  //           this.loading = false;
  //         }
  //       });
  //     }
  //   });
  // }

  navigateToCreateCurrencyExchange() {
    this.router.navigate(['accounts/currency-exchange/entry']);
  }

  // resetPage() {
  //   this.filterValue = '';
  //   this.searchType = 'FromCurrency';
  //   this.page = 1;
  //   this.searchPerformed = false;
  //   this.allResults = [];
  //   this.currencyExchangeList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.sortColumn = 'EffectiveFrom';
  //   this.sortDirection = 'desc';
  //    this.loadCurrencyExchanges();
  // }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  // report(): void {
  //   const formattedData = this.currencyExchangeList.map(item => ({
  //     ...item,
  //     status: item.status === 'A' ? 'Active' : 'Suspended',
  //     EffectiveFrom: this.formatDateForExport(item.EffectiveFrom),
  //     SellRate: this.formatNumberForExport(item.SellRate),
  //     BuyRate: this.formatNumberForExport(item.BuyRate)
  //   }));

  //   // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'EffectiveFrom', label: 'Effective From' },
  //       { key: 'FromCurrency', label: 'From Currency' },
  //       { key: 'ToCurrency', label: 'To Currency' },
  //       { key: 'SellRate', label: 'Sell Rate' },
  //       { key: 'BuyRate', label: 'Buy Rate' },
  //       { key: 'BankName', label: 'Bank Name' },
  //       { key: 'status', label: 'Status' }
  //     ],
  //     fileName: 'Currency-Exchange-Report',
  //     title: companyName
  //   });
  // }

  private formatDateForExport(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private formatNumberForExport(value: number | string): string {
    if (value === null || value === undefined) return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toFixed(2);
  }
}