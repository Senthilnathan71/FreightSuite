import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
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
    tableConfig: TableConfig = {
        columns: [],
        actions: [
            {
                icon: 'fas fa-eye',
                label: 'View',
                action: 'view',
                tooltip: 'View Service Job',
                // condition: (row: any) => this.hasPermission('View')
            }
        ],
        selectable: false,
        multiSelect: false,
        showColumnToggle: true,
        showFilters: true,
        showPagination: true,
        trackByKey: 'HouseJobSid',
        emptyMessage: 'No service jobs found',
    };

    tableLoading = false;

    protected config: ListComponentConfig = {
        storageKey: 'service-job-list-state',
        defaultPageSize: 10,
        defaultSortColumn: 'createdOn',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100],
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
        private datePipe: CustomDatePipe
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
        
        this.initializeTableConfig();
        this.initializeHeaderActions();
        super.ngOnInit(); // This triggers the initial data fetch
    }

    checkPermissions() {
        const currentMenuId = Number(localStorage.getItem('currentMenuId'));
        const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
        if (currentMenuId && userRole) {
            this.operationService
                .getRoleMenuPermissions(currentMenuId, userRole)
                .subscribe({
                    next: (response) => {
                        this.currentMenuPermissions = response.data.MenuPermissions || {};
                        this.permissions = Object.keys(this.currentMenuPermissions).filter(
                            key => this.currentMenuPermissions[key] === 'isTrue'
                        );
                        // Re-initialize actions after permissions are available
                        this.initializeHeaderActions();
                        // Refresh table actions to apply conditions
                        this.tableConfig.actions = this.tableConfig.actions?.map(action => ({
                           ...action,
                           condition: action.condition
                        }));
                    },
                });
        }
    }

    hasPermission(permission: string): boolean {
        return this.permissions.includes(permission);
    }

    // --- Abstract Method Implementations from BaseListComponent ---

    protected searchItems(): Observable<any> {
        this.tableLoading = true;
        this.spinner.show();
        // This method should call your backend to fetch service jobs
        return this.operationService.searchServiceJobs(this.getSearchParams());
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
        if (response && response.status) {
            this.allItems = response.data?.items.map((item: any) => ({
                ...item,
                departmentName : item.departmentMaster?.departmentName,
                Status: item.status === 'A' ? 'Active' : 'Inactive',
            }));
            this.totalLengthOfCollection = response.data.totalCount || 0;
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
        this.search();
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

    private initializeTableConfig(): void {
        this.tableConfig.columns = [
            { key: 'HBLNo', label: 'HBL No', sortable: true, filterable: true, visible: true, dataType: 'string' },
            { key: 'ShipmentNo', label: 'Ref. No', sortable: true, filterable: true, visible: true, dataType: 'string' },
            { key: 'CustomerName', label: 'Customer', sortable: true, filterable: true, visible: true, dataType: 'string' },
            { key: 'departmentName', label: 'Dept', sortable: true, filterable: true, visible: true, dataType: 'string' },
            { key: 'POL', label: 'POL', sortable: true, visible: true, dataType: 'string' },
            { key: 'POD', label: 'POD', sortable: true, visible: true, dataType: 'string' },
            { key: 'Status', label: 'Status', sortable: true, visible: true, template: 'status', dataType: 'string' }
        ];
    }

    private initializeHeaderActions(): void {
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
}
