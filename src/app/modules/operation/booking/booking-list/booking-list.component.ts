import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { OperationService } from '../../operation.service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { getConcatenatedPorts } from 'src/app/common/helper';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MatDialog } from '@angular/material/dialog';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import {
    AdvancedFilterValues,
    DateRangeConfig,
    DateTypeConfig,
    DropdownFilterConfig,
    PartyFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';


@Component({
    selector: 'app-booking-list',
    standalone: true,
    imports: [
        FeatherModule,
        CommonModule,
        FormsModule,
        RouterModule,
        FavoriteStarComponent,
        CustomDatePipe,
        NgxSpinnerModule,
        ReusableTableComponent,
        PageHeaderComponent,
        ToolsDropdownComponent
    ],
    providers: [CustomDatePipe],
    templateUrl: './booking-list.component.html',
    styleUrl: './booking-list.component.scss'
})
export class BookingListComponent extends BaseListComponent implements OnInit {
    @ViewChild('bookingTable') bookingTable!: ReusableTableComponent;
    headerActions: HeaderAction[] = [];
    userData: any;
    currentCompany: any;
    currentBranch: any;
    
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
        storageKey: 'booking-list-state',
        defaultPageSize: 10,
        defaultSortColumn: 'BookingDateTime',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100, 500],
        maxPagesToShow: 3
    };

    // Alias for compatibility with existing template
    get allBookings() { return this.allItems; }

    constructor(
        private operationService: OperationService,
        private router: Router,
        private dialog: MatDialog,
        private appSettingService: AppSettingsService,
        private excelReportService: ExcelExportService,
        private spinner: NgxSpinnerService,
        paginationService: PaginationService,
        public mps: MenuPermissionService,
        private datePipe: CustomDatePipe,
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

        // Initialize table configuration
        this.initializeTableConfig();
        this.initializeHeaderActions();
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

        // Initialize base component
        super.ngOnInit();
    }

    // Implement abstract methods from BaseListComponent
    protected searchItems(): Observable<any> {
        this.tableLoading = true;
        this.spinner.show();
        return this.operationService.searchBooking(this.getSearchParams());
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
            const filteredItems = this.applyAdvancedFilters(rawItems);

            this.allItems = filteredItems.map(item => ({
                ...item,
                formattedPOL : item.POL ? getConcatenatedPorts(item.POL?.PortName, item.POL?.PortCode) : '',
                formattedPOD : item.POD ? getConcatenatedPorts(item.POD?.PortName, item.POD?.PortCode) : '',
                MasterNoSid: item.MasterNoSid ?? null, 
                Dept: item.departmentMaster?.departmentName,
                displayHBL: item.HBLNo || item.HouseNo || '',
                departmentType: item.departmentMaster?.departmentType,
                vslvoy: item.VesselName && item.VoyageNo ? item.VesselName + ' / ' + item.VoyageNo : '',
                milestone: item.Milestone?.MilestoneName,
                salesman: item.salesman?.userName,
                status: item.status === 'A' ? 'Active' : 'Suspended',
                BookingDateTime: this.datePipe.transform(item?.BookingDateTime),
                // Extract MasterJobNumber from houseJob array
                MasterJobNumber: item.houseJob?.masterJob?.MasterJobNumber || '',
                HouseJobSid : item.houseJob?.HouseJobSid || null,
                HBLNo : item.houseJob?.HBLNo || '',
                MasterJobSid: item.houseJob?.masterJob?.MasterJobSid || null
            }));
            this.totalLengthOfCollection = response?.data?.totalCount || filteredItems.length || 0;
            // this.applySorting();
            this.updateHeaderActionState();
        } else {
            this.appSettingService.showError('Error searching bookings.');
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

    onSearchTriggered(searchValue: string): void {
        this.filterValue = searchValue;
        this.searchBookings();
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
                this.navigateToCreate()
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
    searchBookings() {
        this.search();
    }

    clearFilterValue() {
        this.clearFilter();
    }

    override trackBy(index: number, item: any): number {
        return item.BookingHeaderSid || index;
    }

    viewBooking(booking: any): void {
        this.router.navigate(['/operation/booking/entry', booking.BookingHeaderSid]);
    }

    deleteBooking(Booking: any) {
        if(Booking.HouseJobSid){
            this.appSettingService.showWarning(
                `This booking cannot be deleted.\n\nHouse Job with HBL No: ${Booking.HBLNo} is associated with it.`
            );
            return;
        }
        const dialogRef = this.dialog.open(DeleteWarningComponent);
    
        dialogRef.afterClosed().subscribe(result => {
          if (result === true) {
            this.spinner.show();
            this.operationService.deleteBookingById(Booking.BookingHeaderSid).subscribe({
              next: (response) => {
                this.spinner.hide();
                if (response.status) {
                  this.appSettingService.showSuccess('Booking deleted successfully');
                  this.search();
                } else {
                  this.appSettingService.showError('Failed to delete Booking ');
                }
              },
              error: (error) => {
                this.spinner.hide();
                this.appSettingService.showError('Error deleting Booking');
                console.error('Error deleting Booking:', error);
              }
            });
          }
        });
      }

    
   navigateToMasterJob(item: any): void {
    const departmentType = String(item?.departmentMaster?.departmentType).toUpperCase();

    if (item && departmentType) {
      const masterJobSid = item.MasterNoSid;
      if (departmentType === 'SEA') {
        this.router.navigate(['/operation/master-job/entry', masterJobSid]);
      } else if (departmentType === 'AIR') {
        this.router.navigate(['/operation/mawbill/entry', masterJobSid]);
      } else {
        console.warn('Unknown department type:', departmentType);
      }
    } else {
      this.appSettingService.showWarning('Master Job not available');
    }
  }

  navigateToHouse(row: any): void {
  if (row?.HouseJobSid) {
    this.router.navigate(['/operation/house-job/entry', row.HouseJobSid]);
  } else {
    this.appSettingService.showWarning('House Job not available');
  }
}

    navigateToCreate() {
        this.router.navigate(['operation/booking/entry']);
    }

    // Table configuration
    private initializeTableConfig() {
        this.tableConfig = {
        columns : [
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
            key: 'MasterJobNumber',
            label: 'Job No.',
            sortable: true,
            filterable: true,
            visible: true,
            dataType: 'string',
            template: 'link', 
            cellClass: 'master-job-column'
        },
        {
            key: 'displayHBL',
            label: 'HBL/HAWB',
            sortable: true,
            filterable: true,
            visible: true,
            dataType: 'string',
            template: 'link', 
            cellClass: 'hbl-column'
        },
            {
                key: 'Dept',
                label: 'Dept',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string',
                width: '100px'
            },
            {
                key: 'CustomerName',
                label: 'Customer',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string',
                width: '200px'
            },
            {
                key: 'POL',
                label: 'POL',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string'
            },
            {
                key: 'POD',
                label: 'POD',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string'
            },
            {
                key: 'FPD',
                label: 'FDC',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string'
            },
            {
                key: 'vslvoy',
                label: 'Vsl / Voy',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string',
                cellClass: 'vessel-column',
               
            },
            // {
            //     key: 'salesman',
            //     label: 'Salesman',
            //     sortable: true,
            //     filterable: true,
            //     visible: true,
            //     dataType: 'string'
            // },
            {
                key: 'BookingStatus',
                label: 'Booking Status',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string',
                width: '140px'
            },
            {
                key: 'status',
                label: 'Status',
                sortable: true,
                filterable: true,
                visible: true,
                template: 'status',
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
            },
            {
            icon: 'fas fa-trash',
            label: 'Delete',
            action: 'delete',
            tooltip: 'Delete ',
            class: "text-danger",
            state: !this.mps.can('delete')
      }
        ],
        selectable: false,
        multiSelect: false,
        showColumnToggle: true,
        showFilters: true,
        showPagination: true,
        trackByKey: 'BookingHeaderSid',
        emptyMessage: 'No bookings found',
        dragAndDrop: true
    };
    }

    // Table event handlers
   onTableActionClick(event: TableEventData): void {
    if (event.column?.template === "link") {
        if (event.column.key === 'MasterJobNumber') {
      this.navigateToMasterJob(event.row);
      return;
    }

    if (event.column.key === 'displayHBL') {
      this.navigateToHouse(event.row);
      return;
    }
    } else if (event.action === 'view') {
        // Handle view action - navigate to booking entry page
        this.viewBooking(event.row);
    } else if (event.action === 'delete') {
        this.deleteBooking(event.row);
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
        const formattedData = this.allBookings;
        const companyName = this.currentCompany?.companyName ?? 'Company';

        // Get visible columns in their current order from the table component
        const visibleColumns = this.bookingTable.getVisibleColumns();
        const dynamicHeaders = visibleColumns.map(column => ({
            key: column.key,
            label: column.label
        }));

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: dynamicHeaders,
            fileName: 'Booking-Report',
            title: companyName
        });
    }
}
