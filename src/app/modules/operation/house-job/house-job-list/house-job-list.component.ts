import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { catchError, map, Observable, of } from 'rxjs';

import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

import { PageHeaderComponent, HeaderAction } from 'src/app/shared/components/header-list/header-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';

import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';

import {
  ListComponentConfig,
  SearchParams
} from 'src/app/shared/interfaces/pagination.interface';

import {
  TableConfig,
  TableEventData,
  TableSortConfig,
  TableFilter
} from 'src/app/shared/interfaces/table.interface';

import { OperationService } from '../../operation.service';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  PartyFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';

@Component({
  selector: 'app-house-job-list',
  standalone: true,
  imports: [
    FavoriteStarComponent,
    FeatherModule,
    CommonModule,
    FormsModule,
    CustomDatePipe,
    NgbPaginationModule,
    NgxSpinnerModule,
    ReusableTableComponent, 
    PageHeaderComponent,
    ToolsDropdownComponent
  ],
  providers: [CustomDatePipe],
  templateUrl: './house-job-list.component.html',
  styleUrl: './house-job-list.component.scss'
})
export class HouseJobListComponent extends BaseListComponent implements OnInit {
  @ViewChild('houseTable') houseTable!: ReusableTableComponent;

  userData: any;
  currentCompany: any;
  currentBranch: any;

  headerActions: HeaderAction[] = [];
  tableConfig!: TableConfig;

  tableLoading = false;

  // Advanced filter configs
  dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [
      { label: 'Booking Date', value: 'BookingDateTime' },
      { label: 'ETD', value: 'ETD' },
      { label: 'ETA', value: 'ETA' },
      { label: 'HBL Date', value: 'HBLDate' },
    ],
    defaultValue: 'BookingDateTime'
  };
  partyFilterConfig: PartyFilterConfig = {
    enabled: true,
    partyTypes: [
      { label: 'Customer', value: 'CustomerMasterSid' },
      { label: 'Shipper', value: 'ShipperName' },
      { label: 'Consignee', value: 'ConsigneeName' },
    ]
  };
  currentFilters: AdvancedFilterValues = {};

  partySearchFn = (searchTerm: string, partyType: string): Observable<any[]> => {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;

    switch (partyType) {
      case 'CustomerMasterSid':
        return this.operationService.getAllCustomersWithBranch(CompanyMasterSid).pipe(
          map((data: any) => Array.isArray(data) ? data : []),
          catchError(() => of([]))
        );

      case 'ShipperName':
        return this.operationService.getCustomerByItsType({
          CompanyMasterSid,
          types: ['shipper']
        }).pipe(
          map((res: any) => res?.data || []),
          catchError(() => of([]))
        );

      case 'ConsigneeName':
        return this.operationService.getCustomerByItsType({
          CompanyMasterSid,
          types: ['consignee']
        }).pipe(
          map((res: any) => res?.data || []),
          catchError(() => of([]))
        );

      default:
        return of([]);
    }
  };

  protected config: ListComponentConfig = {
    storageKey: 'house-job-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'HBLNo',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100],
    maxPagesToShow: 3
  };

  // Alias for template compatibility
  get allHouseJob() {
    return this.allItems;
  }

  constructor(
    private operationService: OperationService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe,
    public mps: MenuPermissionService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
      }
    });

    this.mps.init().subscribe(() => {
      this.initializeHeaderActions();
      this.initializeTableConfig();
    });

    this.initializeHeaderActions();
    this.initializeTableConfig();

    // Set default filters before initial search so first API call includes date range
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'BookingDateTime'
    };

    super.ngOnInit();
  }

  private getLast30FromDate(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }

  // =========================
  // BaseListComponent methods
  // =========================

  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.operationService.searchHouseJob(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams & Record<string, any> {
    const params: any = {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      departmentType: 'Sea'
    };

    // Merge advanced filter values
    if (this.currentFilters.dateRange) {
      params.dateFrom = this.currentFilters.dateRange.fromDate;
      params.dateTo = this.currentFilters.dateRange.toDate;
    }
    if (this.currentFilters.dateType) {
      params.dateField = this.currentFilters.dateType;
    }
    if (this.currentFilters.party) {
      params.partyType = this.currentFilters.party.partyType;
      params.partyId = this.currentFilters.party.partyId;
      params.partyName = this.currentFilters.party.partyName;
    }

    return params;
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();

    if (!response?.status) {
      this.allItems = [];
      this.totalLengthOfCollection = 0;
      return;
    }

    this.allItems = response.data.items.map((item: any) => ({
      ...item,
      MasterJobSid: item.MasterJobSid,
      MasterJobNumber: item.masterJob?.MasterJobNumber ?? item.MBLNo ?? '',
      departmentName: item?.departmentMaster?.departmentName ?? '',
      ETD: item?.ETD ? this.datePipe.transform(item.ETD) : '',
      ETA: item?.ETA ? this.datePipe.transform(item.ETA) : '',
      HBLDate: item?.HBLDate ? this.datePipe.transform(item.HBLDate) : '',
      Status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

    this.totalLengthOfCollection = response.data.totalCount || 0;
    this.updateHeaderActionState();
  }

  // =========================
  // Header actions
  // =========================

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

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action =>
      action.action === 'report'
        ? { ...action, disabled: this.totalLengthOfCollection === 0 }
        : action
    );
  }

  // =========================
  // Table config
  // =========================

  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: [
        { key: 'MasterJobNumber', label: 'Master Job No', sortable: true, filterable: true, visible: true,template: 'link',cellClass: 'master-job-column' },
        { key: 'HBLNo', label: 'HBL No', sortable: true, filterable: true, visible: true },
        { key: 'BookingNo', label: 'Booking No', sortable: true, filterable: true, visible: true, template: 'link',cellClass: 'booking-no-column' },
        { key: 'departmentName', label: 'Department', sortable: true, filterable: true, visible: true },
        { key: 'POL', label: 'POL', sortable: true, filterable: true, visible: true },
        { key: 'POD', label: 'POD', sortable: true, filterable: true, visible: true },
        { key: 'ETD', label: 'ETD', sortable: true, filterable: true, visible: true },
        { key: 'ETA', label: 'ETA', sortable: true, filterable: true, visible: true },
        { key: 'HouseStatus', label: 'House Status', sortable: true, filterable: true, visible: true }
      ],
      actions: [
        {
          icon: 'fas fa-eye',
          label: 'View',
          action: 'view',
          tooltip: 'View',
          state: !this.mps.can('view')
        }
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      emptyMessage: 'No house job found'
    };
  }

  // =========================
  // Table events
  // =========================

  onTableActionClick(event: TableEventData): void {
    if(event.column?.template === "link"){
      if (event.column.key === 'MasterJobNumber') {
        this.router.navigate([
          'operation/master-job/entry',
          event.row.MasterJobSid
        ]);
        return;
      }
      if (event.column.key === 'BookingNo') {
        this.router.navigate([
          'operation/booking/entry',
          event.row.BookingHeaderSid
        ]);
        return;
      }
    }
     else if (event.action === 'view') {
      this.router.navigate(['operation/house-job/entry', event.row.HouseJobSid]);
    }
  }

  onTableRowClick(row: any): void {
    // same as master-job-list (no action on row click)
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    console.log('Filters changed', filters);
  }

  // =========================
  // Search handlers (REQUIRED)
  // =========================

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = {};
    this.clearFilterValue();
  }

  // Legacy aliases (same as master list)
  searchHouseJob(): void {
    this.search();
  }

  clearFilterValue(): void {
    this.clearFilter();
  }

  // =========================
  // Header action handlers
  // =========================

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.router.navigate(['operation/house-job/entry']);
        break;
      case 'report':
        this.exportReport();
        break;
      case 'reset':
        this.resetPage();
        break;
    }
  }

  exportReport(): void {
    const visibleColumns = this.houseTable.getVisibleColumns();
    const headers = visibleColumns.map(col => ({
      key: col.key,
      label: col.label
    }));

    this.excelReportService.exportAsExcel({
      data: this.allHouseJob,
      headers,
      fileName: 'House-Job-Report',
      title: this.currentCompany?.companyName ?? 'Company'
    });
  }
}
 