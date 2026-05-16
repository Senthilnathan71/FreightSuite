import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
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

import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  PartyFilterConfig,
  DropdownFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';

import { OperationService } from '../../operation.service';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';

@Component({
  selector: 'app-agent-master-air-waybill-list',
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
    ToolsDropdownComponent,
    ElementStateGuardDirective
  ],
  providers: [CustomDatePipe],
  templateUrl: './agent-master-air-waybill-list.component.html',
  styleUrl: './agent-master-air-waybill-list.component.scss'
})
export class AgentMasterAirWaybillListComponent extends BaseListComponent implements OnInit {
  @ViewChild('houseTable') houseTable!: ReusableTableComponent;

  userData: any;
  currentCompany: any;
  currentBranch: any;
 
  headerActions: HeaderAction[] = [];
  tableConfig!: TableConfig;

  tableLoading = false;

  dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [{ label: 'MBLDate', value: 'MBLDate' }],
    defaultValue: 'MBLDate'
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
  private lastSearchParams: any = null;

  partySearchFn = (_searchTerm: string, partyType: string): Observable<any[]> => {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!companyMasterSid || partyType !== 'CustomerMasterSid') {
      return of([]);
    }

    return this.operationService.getAllCustomersWithBranch(companyMasterSid).pipe(
      map((data: any) => Array.isArray(data) ? data : []),
      catchError(() => of([]))
    );
  };

  protected config: ListComponentConfig = {
    storageKey: 'agent-master-air-waybill-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'MBLDate',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100],
    maxPagesToShow: 3
  };

  get allHouseJob() {
    return this.allItems;
  }

  constructor(
    private operationService: OperationService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private excelExportService: ExcelExportService,
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

    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'MBLDate'
    };

    this.loadHeaderLookups();
    super.ngOnInit();
  }

  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.operationService.searchAgentMasterAirWaybill(this.getSearchParams());
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
      departmentType: 'Air'
    };

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
      params.CustomerMasterSid = this.currentFilters.party.partyId;
      params.customerMasterSid = this.currentFilters.party.partyId;
      params.customerName = this.currentFilters.party.partyName;
    }
    if (this.currentFilters.departmentSid) {
      params.DepartmentMasterSid = Number(this.currentFilters.departmentSid);
      params.departmentMasterSid = Number(this.currentFilters.departmentSid);
    }
    if (this.currentFilters.pol) {
      const polCode = String(this.currentFilters.pol);
      params.POL = polCode;
      params.pol = polCode;
      const polSid = this.getPortSidByCode(polCode);
      if (polSid) {
        params.POLSid = polSid;
        params.polSid = polSid;
      }
    }
    if (this.currentFilters.pod) {
      const podCode = String(this.currentFilters.pod);
      params.POD = podCode;
      params.pod = podCode;
      const podSid = this.getPortSidByCode(podCode);
      if (podSid) {
        params.PODSid = podSid;
        params.podSid = podSid;
      }
    }

    this.lastSearchParams = { ...params };
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
    const totalCount = response?.data?.totalCount || rawItems.length || 0;

    if (this.hasAdvancedFilterValues()) {
      const filteredOnPage = this.applyAdvancedFilters(rawItems);
      if (filteredOnPage.length !== rawItems.length && totalCount > rawItems.length) {
        this.fetchAllFilteredItems(totalCount);
        return;
      }
    }

    this.allItems = rawItems.map(item => this.normalizeRow(item));

    this.totalLengthOfCollection = totalCount;
    this.applySorting();
    this.updateHeaderActionState();
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

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action =>
      action.action === 'report'
        ? { ...action, disabled: this.totalLengthOfCollection === 0 }
        : action
    );
  }

  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: [
        { key: 'MasterJobNumber', label: 'Agent Master Job No', sortable: true, filterable: true, visible: true },
        { key: 'MBLNo', label: 'MAWB No', sortable: true, filterable: true, visible: true },
        { key: 'MBLDate', label: 'MAWB Date', sortable: true, filterable: true, visible: true },
        { key: 'CustomerName', label: 'Customer', sortable: true, filterable: true, visible: true },
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

  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.router.navigate(['operation/agent-master-air-waybill/entry', event.row.HouseJobSid]);
    }
  }

  onTableRowClick(row: any): void {}

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    console.log('Filters changed', filters);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchHouseJob();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'MBLDate'
    };
    this.clearFilterValue();
  }

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
  }

  onDepartmentFilterChanged(departmentSid: number | null): void {
    this.setFilteredPortOptions(departmentSid);
  }

  searchHouseJob(): void {
    this.search();
  }

  clearFilterValue(): void {
    this.clearFilter();
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.router.navigate(['operation/agent-master-air-waybill/entry']);
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

    this.excelExportService.exportAsExcel({
      data: this.allHouseJob,
      headers,
      fileName: 'Agent-Master-Air-Waybill-Report',
      title: this.currentCompany?.companyName ?? 'Company'
    });
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
        options: allDepartments.filter((d: any) => (d?.departmentType || '').toUpperCase() === 'AIR')
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
          return departmentType === 'AIR' ? portType === 'AIR' : portType === 'SEA';
        });

    this.polFilterConfig = { ...this.polFilterConfig, options: filteredPorts };
    this.podFilterConfig = { ...this.podFilterConfig, options: filteredPorts };
  }

  private getPortSidByCode(portCode: string | null | undefined): number | null {
    if (!portCode) {
      return null;
    }

    const port = this.allPorts.find((p: any) => String(p?.PortCode) === String(portCode));
    return port?.PortMasterSid ? Number(port.PortMasterSid) : null;
  }

  private getPortCode(value: any): string {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    return String(value?.PortCode || value?.portCode || '').trim();
  }

  private getLast30FromDate(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }

  private hasAdvancedFilterValues(): boolean {
    return !!(
      this.currentFilters.party?.partyId ||
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

    const selectedDateField = this.currentFilters.dateType || 'MBLDate';
    const from = this.currentFilters.dateRange?.fromDate ? new Date(this.currentFilters.dateRange.fromDate) : null;
    const to = this.currentFilters.dateRange?.toDate ? new Date(this.currentFilters.dateRange.toDate) : null;
    const selectedPol = this.currentFilters.pol ? String(this.currentFilters.pol).trim().toUpperCase() : null;
    const selectedPod = this.currentFilters.pod ? String(this.currentFilters.pod).trim().toUpperCase() : null;
    const selectedDeptSid = this.currentFilters.departmentSid ? Number(this.currentFilters.departmentSid) : null;
    const selectedCustomerSid = this.currentFilters.party?.partyId ? Number(this.currentFilters.party.partyId) : null;
    const selectedCustomerName = this.currentFilters.party?.partyName
      ? String(this.currentFilters.party.partyName).trim().toUpperCase()
      : null;

    return items.filter((item: any) => {
      if (selectedCustomerSid || selectedCustomerName) {
        const itemCustomerSid = Number(
          item?.CustomerMasterSid ??
          item?.customerMaster?.CustomerMasterSid ??
          item?.customer?.CustomerMasterSid ??
          0
        );
        const itemCustomerName = String(
          item?.CustomerName ??
          item?.customerMaster?.CustomerName ??
          item?.customer?.CustomerName ??
          ''
        ).trim().toUpperCase();

        const sidMatches = selectedCustomerSid ? itemCustomerSid === selectedCustomerSid : false;
        const nameMatches = selectedCustomerName ? itemCustomerName === selectedCustomerName : false;
        if (!(sidMatches || nameMatches)) {
          return false;
        }
      }

      if (selectedDeptSid) {
        const itemDeptSid = Number(
          item?.DepartmentMasterSid ??
          item?.departmentMasterSid ??
          item?.departmentMaster?.DepartmentMasterSid ??
          item?.departmentMaster?.departmentMasterSid ??
          0
        );
        if (itemDeptSid !== selectedDeptSid) {
          return false;
        }
      }

      const itemPol = this.getPortCode(item?.POL).toUpperCase();
      const itemPod = this.getPortCode(item?.POD).toUpperCase();

      if (selectedPol && itemPol !== selectedPol) {
        return false;
      }

      if (selectedPod && itemPod !== selectedPod) {
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

  private fetchAllFilteredItems(totalCount: number): void {
    const baseParams = { ...(this.lastSearchParams || {}) };
    if (!baseParams.pageSize) {
      baseParams.pageSize = Number(this.pageSize);
    }

    const pageSize = Number(baseParams.pageSize);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    this.tableLoading = true;
    this.spinner.show();

    const requests = Array.from({ length: totalPages }, (_v, index) => {
      const page = index + 1;
      return this.operationService.searchAgentMasterAirWaybill({ ...baseParams, page }).pipe(
        catchError(() => of(null))
      );
    });

    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        const allRawItems = responses.flatMap(resp =>
          Array.isArray(resp?.data?.items) ? resp.data.items : []
        );
        const filteredItems = this.applyAdvancedFilters(allRawItems);
        const normalizedItems = filteredItems.map(item => this.normalizeRow(item));

        this.allItems = normalizedItems;
        this.applySorting();

        const start = (this.page - 1) * pageSize;
        const end = start + pageSize;
        this.allItems = this.allItems.slice(start, end);

        this.totalLengthOfCollection = normalizedItems.length;
        this.updatePaginationConfig();
        this.updateHeaderActionState();
        this.tableLoading = false;
        this.spinner.hide();
      },
      error: () => {
        this.tableLoading = false;
        this.spinner.hide();
      }
    });
  }

  private normalizeRow(item: any): any {
    return {
      ...item,
      MasterJobSid: item.MasterJobSid,
      MasterJobNumber: item.MasterJobNumber ?? item.masterJob?.MasterJobNumber ?? '',
      departmentName: item?.departmentMaster?.departmentName ?? item?.departmentName ?? '',
      MBLDate: item?.MBLDate ? this.datePipe.transform(item.MBLDate) : '',
      ETD: item?.ETD ? this.datePipe.transform(item.ETD) : '',
      ETA: item?.ETA ? this.datePipe.transform(item.ETA) : '',
      HBLDate: item?.HBLDate ? this.datePipe.transform(item.HBLDate) : '',
      Status: item.status === 'A' ? 'Active' : 'Suspended'
    };
  }
}




