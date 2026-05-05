import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

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
  PartyFilterConfig,
  DropdownFilterConfig
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
      { label: 'HBL Date', value: 'HBLDate' },
      { label: 'ETD', value: 'ETD' },
      { label: 'ETA', value: 'ETA' },
    ],
    defaultValue: 'HBLDate'
  };
  partyFilterConfig: PartyFilterConfig = {
    enabled: true,
    partyTypes: [{ label: 'Customer', value: 'CustomerMasterSid' }],
    defaultPartyType: 'CustomerMasterSid'
  };
  departmentFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Dept',
    options: [],
    bindLabel: 'departmentName',
    bindValue: 'DepartmentMasterSid'
  };
  polFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'POL',
    options: [],
    bindLabel: 'PortName',
    bindValue: 'PortCode'
  };
  podFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'POD',
    options: [],
    bindLabel: 'PortName',
    bindValue: 'PortCode'
  };
  private allPorts: any[] = [];
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
    defaultSortColumn: 'HBLDate',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100,500],
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
      dateType: 'HBLDate'
    };

    this.loadHeaderLookups();
    super.ngOnInit();
  }

  private loadHeaderLookups(): void {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!companyMasterSid) {
      return;
    }

    forkJoin({
      departments: this.operationService.getAllDepartments(companyMasterSid).pipe(catchError(() => of({ data: [] }))),
      ports: this.operationService.getAllPorts().pipe(catchError(() => of({ data: [] })))
    }).subscribe(({ departments, ports }: any) => {
      const allDepartments = Array.isArray(departments?.data) ? departments.data : [];
      this.departmentFilterConfig = {
        ...this.departmentFilterConfig,
        options: allDepartments.filter((d: any) => 
          ['SEA', 'ROAD', 'TRANSPORT', 'OTHER', 'OTHERS']
        .includes((d?.departmentType || '').toUpperCase()))
      };

      const allPorts = Array.isArray(ports?.data) ? ports.data : [];
      this.allPorts = allPorts.map((port: any) => ({
        ...port,
        displayName: `${port.PortName} (${port.PortCode})`
      }));

      this.setFilteredPortOptions(null);
    });
  }

  private setFilteredPortOptions(departmentSid: number | null): void {
    const normalizedDepartmentSid = departmentSid !== null ? Number(departmentSid) : null;
    const selectedDepartment = this.departmentFilterConfig.options.find(
      (dept: any) => Number(dept?.DepartmentMasterSid) === normalizedDepartmentSid
    );

    const departmentType = (selectedDepartment?.departmentType || '').toUpperCase();
    const filteredPorts = !departmentType
      ? [...this.allPorts]
      : this.allPorts.filter((port: any) => {
          const portType = (port?.PortType || '').toUpperCase();
          if (departmentType === 'AIR') {
            return portType === 'AIR';
          }
          if (['ROAD', 'TRANSPORT', 'OTHER', 'OTHERS'].includes(departmentType)) {
            return true;
          }
          return portType === 'SEA';
        });

    this.polFilterConfig = { ...this.polFilterConfig, options: filteredPorts };
    this.podFilterConfig = { ...this.podFilterConfig, options: filteredPorts };
  }

  private getLast30FromDate(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }

  private getSelectedDepartment(): any | null {
    if (!this.currentFilters.departmentSid) {
      return null;
    }

    return this.departmentFilterConfig.options.find(
      (dept: any) => Number(dept?.DepartmentMasterSid) === Number(this.currentFilters.departmentSid)
    ) || null;
  }

  private getPortSidByCode(portCode: string | null | undefined): number | null {
    if (!portCode) {
      return null;
    }

    const port = this.allPorts.find((p: any) => String(p?.PortCode) === String(portCode));
    return port?.PortMasterSid ? Number(port.PortMasterSid) : null;
  }

  private hasAdvancedFilterValues(): boolean {
    return !!(
      this.currentFilters.departmentSid ||
      this.currentFilters.pol ||
      this.currentFilters.pod ||
      this.currentFilters.dateRange?.fromDate ||
      this.currentFilters.dateRange?.toDate
    );
  }

  private applyAdvancedFilters(items: any[]): any[] {
    if (!this.hasAdvancedFilterValues()) {
      return items;
    }

    const selectedDateField = this.currentFilters.dateType || 'HBLDate';
    const from = this.currentFilters.dateRange?.fromDate ? new Date(this.currentFilters.dateRange.fromDate) : null;
    const to = this.currentFilters.dateRange?.toDate ? new Date(this.currentFilters.dateRange.toDate) : null;
    const selectedPol = this.currentFilters.pol ? String(this.currentFilters.pol).trim().toUpperCase() : null;
    const selectedPod = this.currentFilters.pod ? String(this.currentFilters.pod).trim().toUpperCase() : null;
    const selectedDeptSid = this.currentFilters.departmentSid ? Number(this.currentFilters.departmentSid) : null;

    return items.filter((item: any) => {
      if (selectedDeptSid && Number(item?.DepartmentMasterSid) !== selectedDeptSid) {
        return false;
      }

      if (selectedPol && String(item?.POL || '').trim().toUpperCase() !== selectedPol) {
        return false;
      }

      if (selectedPod && String(item?.POD || '').trim().toUpperCase() !== selectedPod) {
        return false;
      }

      if (from || to) {
        const rawDate = item?.[selectedDateField];
        if (!rawDate) {
          return false;
        }

        const itemTime = this.parseDateValue(rawDate);
        if (itemTime === null) {
          return false;
        }
        const itemDate = new Date(itemTime);
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
      departmentType: ['Sea', 'Road', 'Transport', 'Other', 'Others']
    };

    // Merge advanced filter values
    if (this.currentFilters.dateRange?.fromDate) {
      params.dateFrom = this.currentFilters.dateRange.fromDate;
      params.DateFrom = this.currentFilters.dateRange.fromDate;
    }
    if (this.currentFilters.dateRange?.toDate) {
      params.dateTo = this.currentFilters.dateRange.toDate;
      params.DateTo = this.currentFilters.dateRange.toDate;
    }
    if (this.currentFilters.dateType) {
      params.dateField = this.currentFilters.dateType;
      params.DateField = this.currentFilters.dateType;
      if (params.dateFrom) {
        params[`${this.currentFilters.dateType}From`] = params.dateFrom;
      }
      if (params.dateTo) {
        params[`${this.currentFilters.dateType}To`] = params.dateTo;
      }
    }
    if (this.currentFilters.party) {
      params.partyType = this.currentFilters.party.partyType;
      params.partyId = this.currentFilters.party.partyId;
      params.partyName = this.currentFilters.party.partyName;
    }
    if (this.currentFilters.departmentSid) {
      const selectedDept = this.getSelectedDepartment();
      const departmentSid = Number(this.currentFilters.departmentSid);

      params.DepartmentMasterSid = departmentSid;
      params.departmentMasterSid = departmentSid;
      params.DepartmentSid = departmentSid;
      params.departmentSid = departmentSid;

      if (selectedDept?.departmentName) {
        params.Department = selectedDept.departmentName;
        params.department = selectedDept.departmentName;
        params.departmentName = selectedDept.departmentName;
        params.DepartmentType = selectedDept.departmentName;
      }
    }
    if (this.currentFilters.pol) {
      const polCode = String(this.currentFilters.pol);
      const polSid = this.getPortSidByCode(polCode);

      params.POL = polCode;
      params.pol = polCode;
      if (polSid) {
        params.POLSid = polSid;
        params.polSid = polSid;
      }
    }
    if (this.currentFilters.pod) {
      const podCode = String(this.currentFilters.pod);
      const podSid = this.getPortSidByCode(podCode);

      params.POD = podCode;
      params.pod = podCode;
      if (podSid) {
        params.PODSid = podSid;
        params.podSid = podSid;
      }
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

    const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
    const filteredItems = this.applyAdvancedFilters(rawItems);

    this.allItems = filteredItems.map((item: any) => ({
      ...item,
      MasterJobSid: item.MasterJobSid,
      MasterJobNumber: item.masterJob?.MasterJobNumber ?? item.MBLNo ?? '',
      departmentName: item?.departmentMaster?.departmentName ?? '',
      ETD: item?.ETD ? this.datePipe.transform(item.ETD) : '',
      ETA: item?.ETA ? this.datePipe.transform(item.ETA) : '',
      HBLDate: item?.HBLDate ? this.datePipe.transform(item.HBLDate) : '',
      Status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

    const responseTotal = Number(response?.data?.totalCount || 0);
    this.totalLengthOfCollection = this.hasAdvancedFilterValues()
      ? filteredItems.length
      : responseTotal || rawItems.length || 0;
    this.applySorting();
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
        { key: 'HBLDate', label: 'HBL Date', sortable: true, filterable: true, visible: true },
        { key: 'BookingNo', label: 'Booking No', sortable: true, filterable: true, visible: true, template: 'link',cellClass: 'booking-no-column' },
        { key: 'departmentName', label: 'Department', sortable: true, filterable: true, visible: true },
        { key: 'CustomerName', label: 'Customer', sortable: true, filterable: true, visible: true },
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
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'HBLDate'
    };
    this.clearFilterValue();
  }

  onDepartmentFilterChanged(departmentSid: number | null): void {
    this.setFilteredPortOptions(departmentSid);
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
 




