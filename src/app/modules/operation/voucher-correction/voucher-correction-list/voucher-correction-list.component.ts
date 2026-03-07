import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbDropdownModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { AccountsService } from 'src/app/modules/accounts/accounts.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableFilter, TableSortConfig } from 'src/app/shared/interfaces/table.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { OperationService } from '../../operation.service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { Observable } from 'rxjs';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  DropdownFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';

@Component({
  selector: 'app-voucher-correction-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FeatherModule,
    NgbPaginationModule,
    ListpageComponent,
    FavoriteStarComponent,
    MatDialogModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent,
    CustomDatePipe,
    NgbDropdownModule
  ],
  providers: [CustomDatePipe],
  templateUrl: './voucher-correction-list.component.html',
  styleUrl: './voucher-correction-list.component.scss'
})
export class VoucherCorrectionListComponent extends BaseListComponent implements OnInit {
  @ViewChild('voucherCorrectionTable') voucherCorrectionTable!: ReusableTableComponent;
  searchType = 'VoucherHeaderSid';
  results: any[] = [];
  voucherCorrectionList: any[] = [];
  companyMap: { [id: number]: string } = {};
  userData: any;
  loading = false;
  isFavourite: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentCompany: any;
  currentBranch: any;

  toggleFavourite() {
    this.isFavourite = !this.isFavourite;
  }

  tableConfig: TableConfig;
  dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [{ label: 'Voucher Date', value: 'VoucherDate' }],
    defaultValue: 'VoucherDate'
  };
  voucherTypeFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Voucher Type',
    options: [],
    bindLabel: 'DocumentTypeName',
    bindValue: 'VoucherTypeMasterSid'
  };
  partyNameFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Party Name',
    options: [],
    bindLabel: 'PartyName',
    bindValue: 'PartyName'
  };
  currencyFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Curr',
    options: [],
    bindLabel: 'CurrencyCode',
    bindValue: 'CurrencyCode'
  };
  cashOrBankFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'CashorBank',
    options: [
      { label: 'Cash', value: 'C' },
      { label: 'Bank', value: 'B' }
    ],
    bindLabel: 'label',
    bindValue: 'value'
  };
  currentFilters: AdvancedFilterValues = {
    dateRange: {
      preset: 'last30',
      fromDate: this.getLast30FromDate(),
      toDate: new Date().toISOString()
    },
    dateType: 'VoucherDate'
  };
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'voucher-correction-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'VoucherNumber',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  get allVoucherCorrection() { return this.allItems; }

  constructor(
    private operationService: OperationService,
    private accountService: AccountsService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe,
    public mps: MenuPermissionService
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

    this.initializeHeaderActions();
    this.initializeTableConfig();
    this.mps.init().subscribe(() => {
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });
    super.ngOnInit();
  }

  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.operationService.searchVoucher(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams & Record<string, any> {
    const params: SearchParams & Record<string, any> = {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    if (this.currentFilters.dateRange?.fromDate) {
      params['dateFrom'] = this.currentFilters.dateRange.fromDate;
      params['DateFrom'] = this.currentFilters.dateRange.fromDate;
    }
    if (this.currentFilters.dateRange?.toDate) {
      params['dateTo'] = this.currentFilters.dateRange.toDate;
      params['DateTo'] = this.currentFilters.dateRange.toDate;
    }
    if (this.currentFilters.dateType) {
      params['dateField'] = this.currentFilters.dateType;
      params['DateField'] = this.currentFilters.dateType;
    }
    if (this.currentFilters.departmentSid) {
      params['VoucherTypeMasterSid'] = Number(this.currentFilters.departmentSid);
      params['voucherTypeMasterSid'] = Number(this.currentFilters.departmentSid);
    }
    if (this.currentFilters.pol) {
      params['PartyName'] = this.currentFilters.pol;
      params['partyName'] = this.currentFilters.pol;
    }
    if (this.currentFilters.pod) {
      params['CurrencyCode'] = this.currentFilters.pod;
      params['currencyCode'] = this.currentFilters.pod;
    }
    if (this.currentFilters.extra) {
      params['CashOrBank'] = this.currentFilters.extra;
      params['cashOrBank'] = this.currentFilters.extra;
    }

    return params;
  }

  protected processSearchResults(response: any): void {
    this.spinner.hide();
    if (response.status) {
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
      this.updateFilterOptions(rawItems);
      const filteredItems = this.applyAdvancedFilters(rawItems);
      this.allItems = filteredItems.map((item: any) => ({
        ...item,
        VoucherDateRaw: item?.VoucherDate,
        VoucherTypeMasterSid: item?.VoucherTypeMasterSid ?? item?.voucherTypeMaster?.VoucherTypeMasterSid ?? null,
        DocumentTypeName: item.voucherTypeMaster?.DocumentTypeName,
        VoucherDate: this.datePipe.transform(item?.VoucherDate),
        CashOrBankCode: item.CashOrBank,
        CashOrBank: item.CashOrBank === 'C' ? 'Cash' : 'Bank',
        PostDate: this.datePipe.transform(item?.PostDate),
        PostStatus: item.PostStatus === 'P' ? 'Posted' : 'Unposted',
        Status: item.Status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response?.data?.totalCount || filteredItems.length || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error Searching Voucher');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }
  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error searching Voucher');
    console.error('Error searching Voucher', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadVoucherCorrection();
  }

  loadVoucherCorrection() {
    this.page = 1;
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'VoucherDate'
    };
    this.clearFilterValue();
  }

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any) {
    return item.VoucherHeaderSid || index;
  }

  initializeHeaderActions(): void {
    this.headerActions = [
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


  private initializeTableConfig() {
    this.tableConfig = {
      columns: [
        {
          key: 'DocumentTypeName',
          label: 'Voucher Type',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
        },
        {
          key: 'VoucherNumber',
          label: 'Voucher No',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
        },
        {
          key: 'VoucherDate',
          label: 'Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'date',
        },
        {
          key: 'PartyName',
          label: 'Party Name ',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
        },
        {
          key: 'CurrencyCode',
          label: 'Curr',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
        },
        {
          key: 'CashOrBank',
          label: 'Cash Or Bank',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
        },
        {
          key: 'CreatedBy',
          label: 'Created By',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
        },
        {
          key: 'PostDate',
          label: 'Post Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'date',
        },
        {
          key: 'PostStatus',
          label: 'Post Status',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
        },
        {
          key: 'Status',
          label: 'Status',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          template: 'status',
          cellClass: 'status-column'
        },
      ],
      actions: [
        {
          icon: 'fas fa-eye',
          label: 'View',
          action: 'view',
          tooltip: 'View ',
          // state: !this.mps.can('view')
        }
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'VoucherHeaderSid',
      emptyMessage: 'No Voucher found',
      dragAndDrop: true,
    }
  }

  onActionTriggered(action: string): void {
    switch (action) {
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

  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.editbyrow(event.row);
    }
  }

  editbyrow(row: any) {
    this.router.navigate(['operation/voucher-correction/entry/', row.VoucherHeaderSid]);
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
    const formattedData = this.allVoucherCorrection;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.voucherCorrectionTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Voucher-Correction-Report',
      title: companyName
    });
  }

  private updateFilterOptions(items: any[]): void {
    const voucherTypes = Array.from(
      new Map(
        (items || [])
          .map((item: any) => ({
            VoucherTypeMasterSid: item?.VoucherTypeMasterSid ?? item?.voucherTypeMaster?.VoucherTypeMasterSid ?? null,
            DocumentTypeName: item?.voucherTypeMaster?.DocumentTypeName ?? item?.DocumentTypeName ?? ''
          }))
          .filter((x: any) => !!x.VoucherTypeMasterSid && !!x.DocumentTypeName)
          .map((x: any) => [x.VoucherTypeMasterSid, x])
      ).values()
    );
    const parties = Array.from(
      new Map(
        (items || [])
          .map((item: any) => ({ PartyName: item?.PartyName ?? '' }))
          .filter((x: any) => !!x.PartyName)
          .map((x: any) => [x.PartyName, x])
      ).values()
    );
    const currencies = Array.from(
      new Map(
        (items || [])
          .map((item: any) => ({ CurrencyCode: item?.CurrencyCode ?? '' }))
          .filter((x: any) => !!x.CurrencyCode)
          .map((x: any) => [x.CurrencyCode, x])
      ).values()
    );

    this.voucherTypeFilterConfig = { ...this.voucherTypeFilterConfig, options: voucherTypes };
    this.partyNameFilterConfig = { ...this.partyNameFilterConfig, options: parties };
    this.currencyFilterConfig = { ...this.currencyFilterConfig, options: currencies };
  }

  private applyAdvancedFilters(items: any[]): any[] {
    const selectedDateField = this.currentFilters.dateType || 'VoucherDate';
    const from = this.currentFilters.dateRange?.fromDate ? new Date(this.currentFilters.dateRange.fromDate) : null;
    const to = this.currentFilters.dateRange?.toDate ? new Date(this.currentFilters.dateRange.toDate) : null;
    const selectedVoucherType = this.currentFilters.departmentSid ? Number(this.currentFilters.departmentSid) : null;
    const selectedParty = this.currentFilters.pol ? String(this.currentFilters.pol).trim().toUpperCase() : '';
    const selectedCurrency = this.currentFilters.pod ? String(this.currentFilters.pod).trim().toUpperCase() : '';
    const selectedCashOrBank = this.currentFilters.extra ? String(this.currentFilters.extra).trim().toUpperCase() : '';

    if (!from && !to && !selectedVoucherType && !selectedParty && !selectedCurrency && !selectedCashOrBank) {
      return items;
    }

    return (items || []).filter((item: any) => {
      const itemVoucherType = Number(item?.VoucherTypeMasterSid ?? item?.voucherTypeMaster?.VoucherTypeMasterSid ?? 0);
      const itemParty = String(item?.PartyName ?? '').trim().toUpperCase();
      const itemCurrency = String(item?.CurrencyCode ?? '').trim().toUpperCase();
      const itemCashOrBank = String(item?.CashOrBank ?? '').trim().toUpperCase();

      if (selectedVoucherType && itemVoucherType !== selectedVoucherType) {
        return false;
      }
      if (selectedParty && itemParty !== selectedParty) {
        return false;
      }
      if (selectedCurrency && itemCurrency !== selectedCurrency) {
        return false;
      }
      if (selectedCashOrBank && itemCashOrBank !== selectedCashOrBank) {
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

  private getLast30FromDate(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }


}
