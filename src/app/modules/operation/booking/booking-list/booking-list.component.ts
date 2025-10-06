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
@Component({
    selector: 'app-booking-list',
    standalone: true,
    imports: [
        FeatherModule,
        CommonModule,
        FormsModule,
        RouterModule,
        FavoriteStarComponent,
        NgxSpinnerModule,
        ReusableTableComponent,
         PageHeaderComponent,
         ToolsDropdownComponent
    ],
    templateUrl: './booking-list.component.html',
    styleUrl: './booking-list.component.scss'
})
export class BookingListComponent extends BaseListComponent implements OnInit {
    @ViewChild('bookingTable') bookingTable!: ReusableTableComponent;
    headerActions: HeaderAction[] = [];
    userData: any;
    permissions: string[] = [];
    currentMenuPermissions: any = {};
    currentCompany: any;
    currentBranch: any;
    // Table configuration
    tableConfig: TableConfig = {
        columns: [],
        actions: [
            {
                icon: 'fas fa-eye',
                label: 'View',
                action: 'view',
                tooltip: 'View Booking',
                condition: (row: any) => this.hasPermission('View')
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

    tableLoading = false;

    protected config: ListComponentConfig = {
        storageKey: 'booking-list-state',
        defaultPageSize: 10,
        defaultSortColumn: 'BookingNo',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100, 500],
        maxPagesToShow: 3
    };

    // Alias for compatibility with existing template
    get allBookings() { return this.allItems; }

    constructor(
        private operationService: OperationService,
        private router: Router,
        private appSettingService: AppSettingsService,
        private excelReportService: ExcelExportService,
        private spinner: NgxSpinnerService,
        paginationService: PaginationService
    ) {
        super(paginationService);
    }

    override ngOnInit(): void {
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        this.appSettingService.getUser().subscribe(user => {
            if (user) {
                this.userData = user;
                this.checkPermissions();
            }
        });

        // Initialize table configuration
        this.initializeTableConfig();
        this.initializeHeaderActions();
        // Initialize base component
        super.ngOnInit();
    }

    checkPermissions() {
        const currentMenuId = Number(localStorage.getItem('currentMenuId'));
        const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
        if (currentMenuId && userRole) {
            this.operationService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
                next: (response:any) => {
                    this.currentMenuPermissions = response.data.MenuPermissions || {};
                    this.permissions = Object.keys(this.currentMenuPermissions).filter(
                        key => this.currentMenuPermissions[key] === 'isTrue'
                    );
                      this.initializeHeaderActions();
                }
            });
        }
    }

    hasPermission(permission: string): boolean {
        return this.permissions.includes(permission);
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
                Dept: item.departmentMaster?.departmentName,
                vslvoy: `${item.VesselName} / ${item.VoyageNo}`,
                milestone: item.Milestone?.MilestoneName,
                salesman: item.salesman?.userName,
                status: item.status === 'A' ? 'Active' : 'Suspended'
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
        condition: this.hasPermission('Add')
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

    navigateToCreate() {
        this.router.navigate(['operation/booking/entry']);
    }

    // Table configuration
    private initializeTableConfig(): void {
        this.tableConfig.columns = [
            {
                key: 'BookingNo',
                label: 'Booking No',
                sortable: true,
                filterable: true,
                visible: true,
                template: 'link',
                width: '180px',
                dataType: 'string'
            },
            {
                key: 'Dept',
                label: 'Department',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string'
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
                label: 'Vessel / Voyage',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string',
                cellClass: 'vessel-column'
            },
            {
                key: 'salesman',
                label: 'Salesman',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string'
            },
            {
                key: 'milestone',
                label: 'Milestone',
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
            this.viewBooking(event.row);
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
