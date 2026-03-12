import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { JournalVoucherService, JournalVoucherSearchResponse } from '../journal-voucher.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AccountsService } from '../../accounts.service';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  DropdownFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';

@Component({
  selector: 'app-journal-voucher-list',
  standalone: true,
  imports: [
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    FeatherModule,
    FavoriteStarComponent,
    ReactiveFormsModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    CommonModule,
    CustomDatePipe
  ],
  providers: [CustomDatePipe],
  templateUrl: './journal-voucher-list.component.html',
  styles: ``
})
export class JournalVoucherListComponent extends BaseListComponent implements OnInit {
  @ViewChild('JournalVoucherTable') JournalVoucherTable!: ReusableTableComponent;
  JournalVoucherList: any[] = [];
  userData: any;
  searched = false;

  // Company
  currentCompany: any;
  currentBranch: any;
  headerActions: HeaderAction[] = [];

  // Table configuration
 tableConfig: TableConfig;

  tableLoading = false;
  dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [
      { label: 'Voucher Date', value: 'VoucherDateFormatted' },
      { label: 'Post Date', value: 'PostDateFormatted' }
    ],
    defaultValue: 'VoucherDateFormatted'
  };
  postStatusFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'PostStatus',
    options: [
      { label: 'Posted', value: 'P' },
      { label: 'Unposted', value: 'U' }
    ],
    bindLabel: 'label',
    bindValue: 'value'
  };
  currentFilters: AdvancedFilterValues = {};

  protected config: ListComponentConfig = {
    storageKey: 'journal-voucher-list-state',
    defaultPageSize: 20,
    defaultSortColumn: 'VoucherDate',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allJournalVoucher() { return this.allItems; }

  constructor(
    private journalVoucherService: JournalVoucherService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private dialog: MatDialog,
    private spinner: NgxSpinnerService,
    public mps: MenuPermissionService,
    private datePipe: CustomDatePipe,
    private accountService: AccountsService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    // Initialize table configuration
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'VoucherDateFormatted'
    };
    // Initialize base component
    super.ngOnInit();
   
  }

  loadJournalVouchers(){
    this.journalVoucherService.getAllVoucher().subscribe({
      next: (resp:any) => {
        this.JournalVoucherList = resp?.data || resp || [];
        this.searchJournalVoucher();
      },
      error:(err)=> {
        console.error('Error loading',err);
        this.JournalVoucherList = [];
        this.searchJournalVoucher();
      }
    })
  }

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.journalVoucherService.searchJournalVouchers(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams & Record<string, any> {
    const params: any = {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    const dateField = this.currentFilters.dateType === 'PostDateFormatted' ? 'PostDate' : 'VoucherDate';
    if (this.currentFilters.dateRange?.fromDate) {
      params.dateFrom = this.currentFilters.dateRange.fromDate;
      params.DateFrom = this.currentFilters.dateRange.fromDate;
    }
    if (this.currentFilters.dateRange?.toDate) {
      params.dateTo = this.currentFilters.dateRange.toDate;
      params.DateTo = this.currentFilters.dateRange.toDate;
    }
    if (this.currentFilters.dateType) {
      params.dateField = dateField;
      params.DateField = dateField;
    }
    if (this.currentFilters.departmentSid) {
      params.PostStatus = this.currentFilters.departmentSid;
      params.postStatus = this.currentFilters.departmentSid;
    }

    return params;
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response.status) {
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
      const filteredItems = this.applyAdvancedFilters(rawItems);
      this.allItems = filteredItems.map((item: any) => ({
        ...item,
        PostStatusCode: item.PostStatus,
        VoucherDateRaw: item.VoucherDate,
        PostDateRaw: item.PostDate,
        PostStatus: item.PostStatus === 'P' ? 'Posted' : 'Unposted',
        StatusLabel: item.Status === 'A' ? 'Active' : 'Suspended',
        VoucherDateFormatted: this.datePipe.transform(item.VoucherDate),
        PostDateFormatted: this.datePipe.transform(item.PostDate),
        LocalAmountFormatted: this.formatAmount(item.LocalAmount) 
      }));
      this.totalLengthOfCollection = response?.data?.totalCount || filteredItems.length || 0;
      // this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching journal vouchers.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

 
private formatAmount(amount: number | string): string {
  if (!amount) return '0.00';
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // If negative, show without decimals
  if (numValue < 0) {
    return Math.round(Math.abs(numValue)).toString();
  }
  
  // If positive, show with 2 decimals
  return numValue.toFixed(2);
}

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching journal vouchers.');
    console.error('Error searching journal vouchers', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchJournalVoucher();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'VoucherDateFormatted'
    };
    this.clearFilterValue();
  }

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
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
        action: 'reset'
      }
    ];
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.navigateToCreate();
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

  // Legacy methods for template compatibility
  searchJournalVoucher() {
    this.page = 1;
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.VoucherHeaderSid || index;
  }

  // Table configuration
  private initializeTableConfig(){
    this.tableConfig = {
      columns : [
      {
        key: 'VoucherNumber',
        label: 'Voucher No.',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',

      },
      {
        key: 'VoucherDateFormatted',
        label: 'Voucher Date',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
       
      },
      {
        key: 'LocalAmountFormatted',
        label: 'Amount',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'number',
        width: '120px',
      },
      {
        key: 'Narration',
        label: 'Narration',
        sortable: false,
        filterable: true,
        visible: true,
        dataType: 'string',
  
      },
       {
        key: 'PostStatus',
        label: 'Posted Status',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'status',
        dataType: 'string',
        
      },
      {
        key: 'PostDateFormatted',
        label: 'Posted On',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '120px',
      },
      {
        key: 'StatusLabel',
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
        tooltip: 'View Journal Voucher',
        state: !this.mps.can('view')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete Journal Voucher',
        class: 'text-danger',
        state: !this.mps.can('delete'),
        condition: (row: any) => row.Status === 'A' && row.PostStatus === 'Unposted' // Only unposted can be deleted
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'VoucherHeaderSid',
    emptyMessage: 'No journal vouchers found',
    dragAndDrop: true
  };
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    switch (event.action) {
      case 'view':
        this.viewJournalVoucher(event.row);
        break;
      case 'edit':
        this.editJournalVoucher(event.row);
        break;
      case 'post':
        this.postJournalVoucher(event.row);
        break;
      case 'delete':
        this.deleteJournalVoucher(event.row);
        break;
    }
  }

  viewJournalVoucher(item: any): void {
  this.router.navigate(['/accounts/journal-voucher/entry', item.VoucherHeaderSid]);
}

editJournalVoucher(item: any): void {
  this.router.navigate(['/accounts/journal-voucher/entry', item.VoucherHeaderSid]);
}

  postJournalVoucher(item: any): void {
    const confirmed = confirm(`Are you sure you want to post voucher ${item.VoucherNumber}? This action cannot be undone.`);

    if (confirmed) {
      this.spinner.show();
      this.journalVoucherService.postJournalVoucher(item.VoucherHeaderSid).subscribe({
        next: (response) => {
          this.spinner.hide();
          if (response.status) {
            this.appSettingService.showSuccess('Journal voucher posted successfully', 'Success');
            this.searchJournalVoucher(); // Refresh list
          } 
        },
        error: (err) => {
          this.spinner.hide();
          console.error('Error posting voucher:', err);
          this.appSettingService.showError(err.error?.message || 'Failed to post voucher', 'Error');
        },
      });
    }
  }

  deleteJournalVoucher(item: any): void {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.spinner.show();
        this.accountService.deleteVoucher({
          VoucherHeaderSid: item.VoucherHeaderSid,
            CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
            BranchMasterSid: this.currentBranch?.BranchMasterSid,
            UserEmail: this.userData?.userEmail
        }).subscribe({
          next: (resp: any) => {
            this.spinner.hide();
            if (resp.status) {
              this.appSettingService.showSuccess("Journal Voucher Deleted!");
              this.search();
            } else {
                this.appSettingService.showError(resp.message || 'Failed to delete Credit Note');
              }
          },
          error: (error) => {
            this.spinner.hide();
            console.error('Error deleting journal voucher:', error);
            if (error.error && error.error.message) {
              this.appSettingService.showError(error.error.message);
            } else {
              this.appSettingService.showError("Error Deleting Journal Voucher");
            }
          }
        });
      }
    });
  }

  onTableRowClick(row: any): void {
    // Can be used to view on row click if needed
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    // console.log('Filters changed:', filters);
  }

  private getLast30FromDate(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }

  private applyAdvancedFilters(items: any[]): any[] {
    const selectedDateField = this.currentFilters.dateType === 'PostDateFormatted' ? 'PostDate' : 'VoucherDate';
    const from = this.currentFilters.dateRange?.fromDate ? new Date(this.currentFilters.dateRange.fromDate) : null;
    const to = this.currentFilters.dateRange?.toDate ? new Date(this.currentFilters.dateRange.toDate) : null;
    const selectedPostStatus = this.currentFilters.departmentSid ? String(this.currentFilters.departmentSid).trim().toUpperCase() : '';

    if (!from && !to && !selectedPostStatus) {
      return items;
    }

    return items.filter((item: any) => {
      const itemPostStatus = String(item?.PostStatus ?? '').trim().toUpperCase();
      if (selectedPostStatus && itemPostStatus !== selectedPostStatus) {
        return false;
      }

      if (from || to) {
        const rawDate = item?.[selectedDateField];
        if (!rawDate) {
          return false;
        }

        const itemDate = new Date(rawDate);
        if (Number.isNaN(itemDate.getTime())) {
          return false;
        }

        if (from && itemDate < from) {
          return false;
        }
        if (to && itemDate > to) {
          return false;
        }
      }

      return true;
    });
  }

  report(): void {

  const formattedData = this.allJournalVoucher.map(item => ({
    VoucherNumber: item.VoucherNumber,
    VoucherDateFormatted: item.VoucherDateFormatted,
    PostStatus: item.PostStatus,
    PostDateFormatted: item.PostDateFormatted,
    LocalAmountFormatted: item.LocalAmountFormatted,
    Narration: item.Narration || '',
    StatusLabel: item.StatusLabel,
  }));

  const companyName = this.currentCompany?.companyName ?? 'Company';

  const visibleColumns = this.JournalVoucherTable?.getVisibleColumns() 
    || this.tableConfig.columns.filter(c => c.visible);

  const dynamicHeaders = visibleColumns.map(column => ({
    key: column.key,
    label: column.label
  }));

  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: dynamicHeaders,
    fileName: 'Journal-Voucher-Report',
    title: companyName
  });
}


  updatePaginatedData(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  navigateToCreate() {
    this.router.navigate(['accounts/journal-voucher/entry']);
  }
}
