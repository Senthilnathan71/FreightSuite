import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgbPagination, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { PageHeaderComponent, HeaderAction } from 'src/app/shared/components/header-list/header-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { ToolsDropdownComponent, DropdownMenuItem } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  DropdownFilterConfig,
  PartyFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { OperationService } from '../../operation.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';

@Component({
  selector: 'app-cargo-receipt-list',
  standalone: true,
  imports: [
      CommonModule,
      RouterModule,
      NgbPagination,
      NgbModalModule,
      NgSelectModule,
      FeatherModule,
      ReactiveFormsModule,
      FormsModule,
      FavoriteStarComponent,
      NgxSpinnerModule,
      ReusableTableComponent,
      PageHeaderComponent,
      ToolsDropdownComponent,
      CustomDatePipe,
      ElementStateGuardDirective
    ],
    providers: [CustomDatePipe],
  templateUrl: './cargo-receipt-list.component.html',
  styleUrl: './cargo-receipt-list.component.scss'
})

export class CargoReceiptListComponent extends BaseListComponent implements OnInit {
  @ViewChild('cargoReceiptTable') cargoReceiptTable!: ReusableTableComponent;
  cargoList: any[] = [];
  results: any[] = [];
  // filterValue = '';
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection = 0;
  // searched = false;
  // sortColumn: string = 'BookingNo';
  // sortDirection: string = 'desc';

  // Company/Branch
  currentCompany: any;
  currentBranch: any;
  userData: any;
  // Table configuration
  tableConfig: TableConfig;

  tableLoading = false;
  dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [{ label: 'Booking Date', value: 'BookingDateTime' }],
    defaultValue: 'BookingDateTime'
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
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  protected config: ListComponentConfig = {
    storageKey: 'cargo-receipt-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'BookingDateTime',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allCargo() { return this.allItems; }
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

  constructor(
    private router: Router,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    private spinner: NgxSpinnerService,
    private excelReportService: ExcelExportService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe,
    public mps: MenuPermissionService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch')
    );
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    // this.loadCargoReceipts();
    this.initializeHeaderActions();
    this.initializeTableConfig();
    this.mps.init().subscribe(()=>{
          this.initializeTableConfig();
          this.initializeHeaderActions();
        })

    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'BookingDateTime'
    };
    this.loadHeaderLookups();
    // this.initializeModalDropdownItems();
    super.ngOnInit();
  }


  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.operationService.search(this.getSearchParams());
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

    return params;
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response.status) {
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];

      this.allItems = rawItems.map((item: any) => ({
        ...item,
        status: item.status === 'A' ? 'Active' : 'Suspended',
        departmentName:item.departmentMaster?.departmentName,
        BookingDateTime:this.datePipe.transform(item?.BookingDateTime),
        bookingStatus: item.BookingStatus
      }));
      this.totalLengthOfCollection = response?.data?.totalCount || rawItems.length || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching Cargo.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching Cargo.');
    console.error('Error searching Cargo', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadAllClauses();
  }


  // Legacy method for template compatibility
  loadAllClauses() {
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
      dateType: 'BookingDateTime'
    };
    this.clearFilterValue();
  }

  // Legacy method for template compatibility
  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.BookingHeaderSid || index;
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

  // Table configuration
  private initializeTableConfig() {
    this.tableConfig = {
    columns: [
      {
        key: 'departmentName',
        label: 'Dept',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'BookingNo',
        label: 'Booking No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'BookingDateTime',
        label: 'Booking Date',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
       {
        key: 'CustomerName',
        label: 'Customer',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
       {
        key: 'POO',
        label: 'POO',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
       {
        key: 'POL',
        label: 'POL',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
       {
        key: 'POD',
        label: 'POD',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
       {
        key: 'FPD',
        label: 'FPD',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
      {
        key: 'bookingStatus',
        label: 'Booking Status',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'status',
        width: '140px',
        dataType: 'string',
        cellClass: 'status-column'
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
    ],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Booking',
        state: !this.mps.can('view')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'BookingHeaderSid',
    emptyMessage: 'No cargo receipt found',
    dragAndDrop: true
  };
  }


  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.TonavigateCreate()
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

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.editbyrow(event.row);
    }
  }

  editbyrow(row: any,) {
   this.router.navigate(['/operation/cargo-receipt/entry', row.BookingHeaderSid]);
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

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
  }

  onDepartmentFilterChanged(departmentSid: number | null): void {
    this.setFilteredPortOptions(departmentSid);
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
      this.departmentFilterConfig = {
        ...this.departmentFilterConfig,
        options: Array.isArray(departments?.data) ? departments.data : []
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

    const selectedDateField = this.currentFilters.dateType || 'BookingDateTime';
    const from = this.currentFilters.dateRange?.fromDate ? new Date(this.currentFilters.dateRange.fromDate) : null;
    const to = this.currentFilters.dateRange?.toDate ? new Date(this.currentFilters.dateRange.toDate) : null;
    const selectedPol = this.currentFilters.pol ? String(this.currentFilters.pol).trim().toUpperCase() : null;
    const selectedPod = this.currentFilters.pod ? String(this.currentFilters.pod).trim().toUpperCase() : null;
    const selectedDeptSid = this.currentFilters.departmentSid ? Number(this.currentFilters.departmentSid) : null;
    const selectedDept = selectedDeptSid
      ? this.departmentFilterConfig.options.find(
          (dept: any) => Number(dept?.DepartmentMasterSid) === selectedDeptSid
        )
      : null;
    const selectedDeptName = selectedDept?.departmentName
      ? String(selectedDept.departmentName).trim().toUpperCase()
      : null;
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
            item?.departmentMaster?.DepartmentMasterSid ??
            item?.departmentMaster?.departmentMasterSid ??
            0
        );

        if (itemDeptSid > 0 && itemDeptSid !== selectedDeptSid) {
          return false;
        }

        if (!itemDeptSid && selectedDeptName) {
          const itemDeptName = String(item?.departmentMaster?.departmentName ?? '')
            .trim()
            .toUpperCase();
          if (itemDeptName !== selectedDeptName) {
            return false;
          }
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

  report(): void {
    const formattedData = this.allCargo;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.cargoReceiptTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Cargo-Receipt-Report',
      title: companyName
    });
  }

  // loadCargoReceipts(): void {
  //   this.spinner.show();
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;

  //   const params = {
  //     search: this.filterValue ? this.filterValue.trim() : '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortDirection: this.sortDirection,
  //     activeCompanyId: CompanyMasterSid,
  //     filterType: 'cargoReceipt' // optional, if backend expects
  //   };

  //   this.operationService.search(params).subscribe({
  //     next: (response) => {
  //       if (response.status) {
  //         this.cargoList = response.data.items;
  //         this.results = [...this.cargoList];
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searched = true;
  //       } else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //     },
  //     error: (err) => {
  //       console.error('Error fetching cargo receipts:', err);
  //       this.cargoList = [];
  //       this.results = [];
  //       this.totalLengthOfCollection = 0;
  //     }
  //   });
  // }

  // applySorting() {
  //   this.results.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];

  //     if (valueA == null) valueA = '';
  //     if (valueB == null) valueB = '';

  //     valueA = valueA.toString().toLowerCase();
  //     valueB = valueB.toString().toLowerCase();

  //     if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
  //     if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
  //     return 0;
  //   });
  // }

  // sort(column: string) {
  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.applySorting();
  // }

  // updatePaginatedData(): void {
  //   this.loadCargoReceipts();
  // }

  // resetPage(): void {
  //   this.filterValue = '';
  //   this.page = 1;
  //   this.cargoList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.searched = false;
  //   this.sortColumn = 'BookingDate';
  //   this.sortDirection = 'desc';
  //   this.loadCargoReceipts();
  // }

  // report(): void {
  //     const formattedData = this.cargoList.map(item => ({
  //       ...item,
  //       departmentName: item.departmentMaster?.departmentName,
  //       status: item.status === 'A' ? 'Active' : 'Suspended'
  //     }));
  //     //  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //       const companyName = this.currentCompany?.companyName ?? 'Company';
  //      this.excelReportService.exportAsExcel({
  //       data: formattedData,
  //       headers: [
  //         { key: 'departmentName', label: 'Department Name' },
  //         { key: 'BookingNo', label: 'Booking No' },
  //         { key: 'BookingDateTime', label: 'Booking Date' },
  //         { key: 'CustomerName', label: 'Customer Name' },
  //         { key: 'POO', label: 'POO' },
  //         { key: 'POL', label: 'POL' },
  //         { key: 'POD', label: 'POD' },
  //         { key: 'FPD', label: 'FPD' },
  //         { key: 'status', label: 'Status' },
  //       ],
  //       fileName: 'Cargo-Receipt-Report',
  //       title: companyName
  //      });
  //   }

  TonavigateCreate() {
    this.router.navigate(['operation/cargo-receipt/entry']);
  }

  // clearFilterValue() {
  //   this.filterValue = '';
  // }

  trackByIndex(index: number, item: any): number {
    return index;
  }


}




