import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { SettingsService } from 'src/app/modules/settings/settings.service';
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
    selector: 'app-tds-set-list',
    standalone: true,
    imports: [
        RouterModule,
        CommonModule,
        FeatherModule,
        FormsModule,
        FavoriteStarComponent,
        CustomDatePipe,
        NgbPaginationModule,
        NgxSpinnerModule,
        ReusableTableComponent,
        PageHeaderComponent,
        ToolsDropdownComponent
    ],
    providers: [CustomDatePipe],
    templateUrl: './tds-set-list.component.html',
    styleUrl: './tds-set-list.component.scss'
})
export class TdsSetListComponent extends BaseListComponent implements OnInit {
    @ViewChild('tdssetTable') tdssetTable!: ReusableTableComponent;
    // filterValue: string;
    results: any[];
    tdsList: any[];
    userData: any;
    // searchPerformed: boolean;

    // page = 1;
    // pageSize = 15;
    // totalLengthOfCollection: number;
    permissions: string[] = [];
    currentMenuPermissions: any = {};

    // sortColumn: string = 'TDSSetName';
    // sortDirection: string = 'asc';
    // Company
    currentCompany: any;
    currentBranch: any;
    headerActions: HeaderAction[] = [];
    // Table configuration
    tableConfig: TableConfig = {
        columns: [],
        actions: [
            {
                icon: 'fas fa-eye',
                label: 'View',
                action: 'view',
                tooltip: 'View tds-set',
                condition: (row: any) => this.hasPermission('View')
            },
            {
                icon: 'fas fa-trash',
                label: 'Delete',
                action: 'delete',
                tooltip: 'Delete tds-set',
                class: "text-danger",
                condition: (row: any) => this.hasPermission('Delete')
            }
        ],
        selectable: false,
        multiSelect: false,
        showColumnToggle: true,
        showFilters: true,
        showPagination: true,
        trackByKey: 'TDSSetHeaderSid',
        emptyMessage: 'No tsd-set found',
        dragAndDrop: true
    };

    tableLoading = false;

    protected config: ListComponentConfig = {
        storageKey: 'tds-set-list-state',
        defaultPageSize: 10,
        defaultSortColumn: 'TDSSetName',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100, 500],
        maxPagesToShow: 3
    };

    // Alias for compatibility with existing template
    get allTdsset() { return this.allItems; }
    constructor(
        private router: Router,
        private appSettingService: AppSettingsService,
        private masterService: MasterService,
        private dialog: MatDialog,
        private excelReportService: ExcelExportService,
        private settingService: SettingsService,
        private spinner: NgxSpinnerService,
        paginationService: PaginationService,
        private datePipe: CustomDatePipe,
    ) {
        super(paginationService);
    }

    override ngOnInit(): void {
        // this.appSettingService.getUser().subscribe(
        //     (res) => {
        //         this.userData = res;
        //         this.checkPermissions();
        //     }
        // )
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        const userProfile = this.appSettingService.getDecryptedUserProfile();
        if (userProfile) {
            this.userData = userProfile;
            this.checkPermissions();
        }
        this.loadTds();
        this.initializeTableConfig();
        this.initializeHeaderActions();

        // Initialize base component
        super.ngOnInit();
    }
    // Implement abstract methods from BaseListComponent
    protected searchItems(): Observable<any> {
        this.tableLoading = true;
        this.spinner.show();
        return this.masterService.searchTds(this.getSearchParams());
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
                status: item.status === 'A' ? 'Active' : 'Suspended',
                EffectiveFrom: this.datePipe.transform(item?.EffectiveFrom)
            }));
            this.totalLengthOfCollection = response.data.totalCount || 0;
            this.applySorting();
            this.updateHeaderActionState();
        } else {
            this.appSettingService.showError('Error searching Tds-set.');
            this.allItems = [];
            this.totalLengthOfCollection = 0;
        }
    }

    protected override handleSearchError(error: any): void {
        this.tableLoading = false;
        this.spinner.hide();
        this.appSettingService.showError('Error searching Tds-set.');
        console.error('Error searching Tds-set', error);
        super.handleSearchError(error);
    }

    // Legacy methods for template compatibility
    searchTds() {
        this.search();
    }

    clearFilterValue() {
        this.clearFilter();
    }

    override trackBy(index: number, item: any): number {
        return item.TDSSetHeaderSid || index;
    }

    onSearchTriggered(searchValue: string): void {
        this.filterValue = searchValue;
        this.searchTds();
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

    //    initializeModalDropdownItems(): void {
    //     this.modalDropdownItems = [
    //       {
    //         label: 'Edoc',
    //         icon: 'fas fa-file-alt',
    //         action: 'edoc',
    //         condition: this.hasPermission('Edoc')
    //       },
    //       {
    //         label: 'Terms & Condition',
    //         icon: 'fas fa-clipboard',
    //         action: 'terms',
    //         condition: this.hasPermission('Terms and Condition')
    //       },
    //       {
    //         label: 'Authorize',
    //         icon: 'fas fa-shield-alt',
    //         action: 'authority',
    //         condition: this.hasPermission('Authority')
    //       },
    //       {
    //         label: 'Email',
    //         icon: 'fas fa-envelope',
    //         action: 'email',
    //         condition: this.hasPermission('Email')
    //       }
    //     ];
    //   }
    
  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'report') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 };
      }
      return action;
    });
  }
    onActionTriggered(action: string): void {
        switch (action) {
            case 'create':
                this.navigateTocreatetdsSet();
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
    viewTds(row: any): void {
        this.router.navigate(['/master/tds-set/entry', row.TDSSetHeaderSid]);
    }

    // Table configuration
    private initializeTableConfig(): void {
        this.tableConfig.columns = [

            {
                key: 'TDSSetName',
                label: 'TDS Name',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string'
            },
            {
                key: 'EffectiveFrom',
                label: 'Effective Date',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string'
            },
            {
                key: 'TransactionLimit',
                label: 'Transaction Limit ',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string'
            },
            {
                key: 'AnnualLimit',
                label: 'Annual Limit ',
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
            this.viewTds(event.row);
        } else if (event.action === "delete") {
            this.deleteBy(event.row)
        }
    }

    deleteBy(row: any) {
        this.deleteTdsSet(row.TDSSetHeaderSid)
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
        const formattedData = this.allTdsset;
        const companyName = this.currentCompany?.companyName ?? 'Company';

        // Get visible columns in their current order from the table component
        const visibleColumns = this.tdssetTable.getVisibleColumns();
        const dynamicHeaders = visibleColumns.map(column => ({
            key: column.key,
            label: column.label
        }));

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: dynamicHeaders,
            fileName: 'Tds-Set-Report',
            title: companyName
        });
    }
    checkPermissions() {
        const currentMenuId = Number(localStorage.getItem('currentMenuId'));
        const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
        console.log(currentMenuId)
        console.log(userRole)
        if (currentMenuId && userRole) {
            this.settingService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
                next: (response) => {
                    this.currentMenuPermissions = response.data.MenuPermissions || {};
                    this.permissions = Object.keys(this.currentMenuPermissions)
                        .filter(key => this.currentMenuPermissions[key] === 'isTrue');
                    console.log(this.permissions)
                    this.initializeHeaderActions();
                }
            });
        }
    }

    loadTds() {
        this.spinner.show();
        let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
        const payload = {
            search: this.filterValue,
            page: this.page,
            pageSize: this.pageSize,
            activeCompanyId: CompanyMasterSid
        }
        this.masterService.searchTds(payload).subscribe(
            (resp: any) => {
                if (resp.status) {
                    const response = resp.data.items;
                    this.tdsList = response;
                    this.results = [...this.tdsList];
                    this.totalLengthOfCollection = this.tdsList.length;
                    this.applySorting();
                    this.searchPerformed = true;
                } else {
                    this.appSettingService.showError(resp.message);
                }
                this.spinner.hide();
            }
        )
    }



    deleteTdsSet(TDSSetHeaderSid) {
        const dialogRef = this.dialog.open(DeleteWarningComponent);
        dialogRef.afterClosed().subscribe((res) => {
            if (res) {
                this.masterService.deleteTds(TDSSetHeaderSid).subscribe(
                    (resp: any) => {
                        this.appSettingService.showSuccess("Deleted!");
                        this.loadTds();
                        this.searchTds();
                    });
            }
        })
    }

    updatePaginatedData() {
        let start = (this.page - 1) * this.pageSize;
        let end = start + this.pageSize;
        this.loadTds();
    }

    navigateTocreatetdsSet() {
        this.router.navigate(['master/tds-set/entry'])
    }
    // clearFilterValue() {
    //     this.filterValue = '';
    // }



    hasPermission(permission: string): boolean {
        return this.permissions.includes(permission);
    }

    reset() {
        this.tdsList = [];
        this.filterValue = '';
        this.searchPerformed = false;
        this.totalLengthOfCollection = 0;
        this.sortColumn = 'TDSSetName';
        this.sortDirection = 'asc';
        this.loadTds()
    }

}
