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
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { getConcatenatedPorts } from 'src/app/common/helper';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MatDialog } from '@angular/material/dialog';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';


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
        // Initialize base component
        super.ngOnInit();
    }

    // Implement abstract methods from BaseListComponent
    protected searchItems(): Observable<any> {
        this.tableLoading = true;
        this.spinner.show();
        return this.operationService.searchBooking(this.getSearchParams());
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
        if (response.status) {
            this.allItems = response.data.items.map(item => ({
                ...item,
                formattedPOL : item.POL ? getConcatenatedPorts(item.POL?.PortName, item.POL?.PortCode) : '',
                formattedPOD : item.POD ? getConcatenatedPorts(item.POD?.PortName, item.POD?.PortCode) : '',
                Dept: item.departmentMaster?.departmentName,
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
            this.totalLengthOfCollection = response.data.totalCount || 0;
            this.applySorting();
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

    // New method to navigate to master job
    navigateToMasterJob(masterJobSid: number): void {
        if (masterJobSid) {
            this.router.navigate(['/operation/master-job/entry', masterJobSid]);
        } else {
            this.appSettingService.showWarning('Master Job not available');
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
                label: 'Date',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string',
                width: '100px'
                
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
                key: 'Dept',
                label: 'Dpt',
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
                width: '100px'
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
        // Handle link template click (Master Job Number)
        this.navigateToMasterJob(event.row.MasterJobSid)
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