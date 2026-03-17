import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableSortConfig } from 'src/app/shared/interfaces/table.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { OperationService } from '../../operation.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { FeatherModule } from 'angular-feather';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  DropdownFilterConfig,
  PartyFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';
// You will need to import your DeleteWarningComponent
// import { DeleteWarningComponent } from 'path/to/delete-warning.component';

@Component({
    selector: 'app-service-job-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        FeatherModule,
        NgbPaginationModule,
        NgxSpinnerModule,
        ReusableTableComponent,
        PageHeaderComponent,
        FavoriteStarComponent,
        CustomDatePipe
    ],
    providers: [CustomDatePipe, ExcelExportService],
    templateUrl: './service-job-list.component.html',
    styleUrls: ['./service-job-list.component.scss']
})
export class ServiceJobListComponent extends BaseListComponent implements OnInit {
    @ViewChild('serviceJobTable') serviceJobTable!: ReusableTableComponent;

    userData: any;
    permissions: string[] = [];
    currentMenuPermissions: any = {};
    currentCompany: any;
    currentBranch: any;

    headerActions: HeaderAction[] = [];

    tableConfig:TableConfig;
    private initializeTableConfig() {
    this.tableConfig = {
        columns: [
            //  { key: 'HBLNo', label: 'HBL No', sortable: true, filterable: true, visible: true, dataType: 'string' },
             { key: 'MasterJobNumber', label: 'Job No', sortable: true, filterable: true, visible: true, dataType: 'string' },
             { key:'MBLDate', label: 'Job Date', sortable: true, filterable: true, visible: true, dataType: 'string' },
            { key: 'ShipmentNo', label: 'Ref. No', sortable: true, filterable: true, visible: true, dataType: 'string' },
            { key: 'CustomerName', label: 'Customer', sortable: true, filterable: true, visible: true, dataType: 'string' },
            { key: 'departmentName', label: 'Dept', sortable: true, filterable: true, visible: true, dataType: 'string' },
            { key: 'POL', label: 'POL', sortable: true, visible: true, dataType: 'string' },
            { key: 'POD', label: 'POD', sortable: true, visible: true, dataType: 'string' },
            { key: 'Status', label: 'Status', sortable: true, visible: true, template: 'status', dataType: 'string' }
        ],
        actions: [
            {
                icon: 'fas fa-eye',
                label: 'View',
                action: 'view',
                tooltip: 'View Service Job',
                state: !this.mps.can('view')
            }
        ],
        selectable: false,
        multiSelect: false,
        showColumnToggle: true,
        showFilters: true,
        showPagination: true,
        trackByKey: 'HouseJobSid',
        emptyMessage: 'No service jobs found',
    }
};

    tableLoading = false;
    dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
    dateTypeConfig: DateTypeConfig = {
      enabled: true,
      options: [{ label: 'JobDate', value: 'MBLDate' }],
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
      bindLabel: 'displayName',
      bindValue: 'PortCode'
    };
    podFilterConfig: DropdownFilterConfig = {
      enabled: true,
      label: 'POD',
      options: [],
      bindLabel: 'displayName',
      bindValue: 'PortCode'
    };
    private allPorts: any[] = [];
    currentFilters: AdvancedFilterValues = {};

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
        storageKey: 'service-job-list-state',
        defaultPageSize: 10,
        defaultSortColumn: 'MBLDate',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100,500],
        maxPagesToShow: 5
    };
    
    // Alias for template compatibility
    get allServiceJobs() { return this.allItems; }

    constructor(
        private operationService: OperationService, 
        private router: Router,
        private appSettingService: AppSettingsService,
        private modalService: NgbModal,
        private excelReportService: ExcelExportService,
        private spinner: NgxSpinnerService,
        paginationService: PaginationService,
        private datePipe: CustomDatePipe,
        public mps : MenuPermissionService,
        private ngbModal: NgbModal,
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
    this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });
        this.initializeTableConfig();
        this.initializeHeaderActions();

        this.currentFilters = {
          dateRange: {
            preset: 'last30',
            fromDate: this.getLast30FromDate(),
            toDate: new Date().toISOString()
          },
          dateType: 'MBLDate'
        };

        this.loadHeaderLookups();
        super.ngOnInit(); // This triggers the initial data fetch
    }


    // --- Abstract Method Implementations from BaseListComponent ---

    protected searchItems(): Observable<any> {
        this.tableLoading = true;
        this.spinner.show();
        // This method should call your backend to fetch service jobs
        return this.operationService.searchServiceJobs(this.getSearchParams());
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
        if (response && response.status) {
            const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];

            this.allItems = rawItems.map((item: any) => ({
                ...item,
                departmentName : item.departmentMaster?.departmentName,
                MasterJobNumber: item.masterJob?.MasterJobNumber,
                MBLDate:this.datePipe.transform(item?.MBLDate),
                Status: item.status === 'A' ? 'Active' : 'Inactive',
            }));
            this.totalLengthOfCollection = response?.data?.totalCount || rawItems.length || 0;
            this.applySorting();
            this.updateHeaderActionState();
        } else {
            this.appSettingService.showError('Could not fetch service jobs.');
            this.allItems = [];
            this.totalLengthOfCollection = 0;
        }
    }
    
    protected override handleSearchError(error: any): void {
        this.tableLoading = false;
        this.spinner.hide();
        this.appSettingService.showError('An error occurred while fetching data.');
        super.handleSearchError(error);
    }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

    // --- UI and Table Event Handlers ---

    onSearchTriggered(searchValue: string): void {
        this.filterValue = searchValue;
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
          dateType: 'MBLDate'
        };
        this.clearFilter();
    }
    
    onActionTriggered(action: string): void {
        switch (action) {
            case 'create':
                this.navigateToServiceJobEntry();
                break;
            case 'report':
                this.exportReport();
                break;
            case 'reset':
                this.resetPage();
                break;
        }
    }
    
    onTableActionClick(event: TableEventData): void {
        switch (event.action) {
            case 'view':
                this.viewServiceJob(event.row.HouseJobSid);
                break;
            case 'delete':
                this.deleteServiceJob(event.row.HouseJobSid);
                break;
        }
    }
    
    // --- Component-Specific Logic ---
    private initializeHeaderActions(): void {
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
                disabled: this.totalLengthOfCollection === 0,
            },
            {
                label: 'Reset',
                icon: 'fas fa-sync-alt',
                action: 'reset',
            }
        ];
    }
    
    private updateHeaderActionState(): void {
        this.headerActions = this.headerActions.map(action => {
            if (action.action === 'report') {
                return { ...action, disabled: this.totalLengthOfCollection === 0 };
            }
            return action;
        });
    }

    navigateToServiceJobEntry(): void {
        this.router.navigate(['operation/service-job/entry']);
    }

    viewServiceJob(houseJobSid: number): void {
        this.router.navigate(['operation/service-job/entry', houseJobSid]);
    }

    deleteServiceJob(houseJobSid: number): void {
        /*
        const modalRef = this.modalService.open(DeleteWarningComponent, { centered: true, backdrop: 'static' });
        modalRef.result.then((result) => {
            if (result === true) {
                this.spinner.show();
                this.operationService.deleteServiceJob(houseJobSid).subscribe({
                    next: (response) => {
                        this.spinner.hide();
                        if (response.status) {
                            this.appSettingService.showSuccess('Service Job deleted successfully.');
                            this.search(); // Refresh the list
                        } else {
                            this.appSettingService.showError(response.message || 'Error deleting service job.');
                        }
                    },
                    error: (err) => {
                        this.spinner.hide();
                        this.appSettingService.showError('An error occurred during deletion.');
                    }
                });
            }
        });
        */
        console.log(`Delete logic for Service Job ID: ${houseJobSid} is commented out. Uncomment to enable.`);
        this.appSettingService.showInfo('Delete functionality is currently disabled in this example.');
    }

    exportReport(): void {
        if (this.totalLengthOfCollection === 0) return;
        this.spinner.show();
        const visibleColumns = this.serviceJobTable.getVisibleColumns();
        const headers = visibleColumns.map(col => ({ key: col.key, label: col.label }));
        
        this.excelReportService.exportAsExcel({
            data: this.allItems,
            headers: headers,
            fileName: 'Service_Job_Report',
            title: this.currentCompany?.companyName || 'Service Job Report'
        });
        this.spinner.hide();
    }
    
    override trackBy(index: number, item: any): number {
        return item.HouseJobSid || index;
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
}



