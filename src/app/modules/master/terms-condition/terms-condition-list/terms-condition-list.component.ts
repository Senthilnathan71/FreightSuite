import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { forkJoin, Observable } from 'rxjs';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableFilter, TableSortConfig } from 'src/app/shared/interfaces/table.interface';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { MasterService } from '../../master.service';

@Component({
    selector: 'app-terms-condition-list',
    standalone: true,
    imports: [
        FeatherModule,
        CommonModule,
        FormsModule,
        RouterModule,
        FavoriteStarComponent,
        NgxSpinnerModule,
        ReusableTableComponent,
        PageHeaderComponent
    ],
    template: `
<ngx-spinner bdColor="rgba(0,0,0,0.8)" size="medium" color="#fff" type="ball-scale-ripple" [fullScreen]="true">
    <p style="color: white;" class="m-0">Loading...</p>
</ngx-spinner>

<div class="row compact-form">
    <app-page-header
        [title]="'Terms And Conditions'"
        [showFavorite]="true"
        [showSearch]="true"
        [searchPlaceholder]="'Search'"
        [searchButtonText]="'Search'"
        [(searchValue)]="filterValue"
        [actions]="headerActions"
        (searchTriggered)="onSearchTriggered($event)"
        (searchCleared)="onSearchCleared()"
        (actionTriggered)="onActionTriggered($event)">
    </app-page-header>

    <div class="col-12 px-0 table-scroll-wrapper">
        <app-reusable-table
            #termsConditionTable
            [config]="tableConfig"
            [data]="allTermsConditions"
            [loading]="tableLoading"
            [totalRecords]="totalLengthOfCollection"
            [paginationConfig]="paginationConfig"
            (actionClick)="onTableActionClick($event)"
            (rowClick)="onTableRowClick($event)"
            (sortChange)="onTableSortChange($event)"
            (filterChange)="onTableFilterChange($event)"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
        </app-reusable-table>
    </div>
</div>
`,
    styleUrl: './terms-condition-list.component.scss'
})
export class TermsConditionListComponent extends BaseListComponent implements OnInit {
    @ViewChild('termsConditionTable') termsConditionTable!: ReusableTableComponent;
    headerActions: HeaderAction[] = [];
    tableConfig: TableConfig;
    tableLoading = false;

    userData : any;
    currentCompany : any;
    currentBranch : any;
    private branchNameMap = new Map<number, string>();
    private menuNameMap = new Map<number, string>();
    private departmentNameMap = new Map<number, string>();

    protected config: ListComponentConfig = {
        storageKey: 'terms-condition-list-state',
        defaultPageSize: 10,
        defaultSortColumn: 'branchName',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100, 500],
        maxPagesToShow: 3
    };

    get allTermsConditions() {
        return this.allItems;
    }

    constructor(
        private router: Router,
        private masterService:MasterService,
        private appSettingService:AppSettingsService,
        private dialog:MatDialog,
        private excelReportService : ExcelExportService,
        private spinner: NgxSpinnerService,
        paginationService: PaginationService,
        public mps: MenuPermissionService
    ) {
        super(paginationService);
    }

    override ngOnInit(): void {
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        const userProfile = this.appSettingService.getDecryptedUserProfile();
        if(userProfile){
            this.userData = userProfile;
        }

        this.initializeTableConfig();
        this.initializeHeaderActions();
        this.mps.init().subscribe(() => {
            this.initializeTableConfig();
            this.initializeHeaderActions();
        });

        // super.ngOnInit();
        this.loadLookupData();
    }

    protected searchItems(): Observable<any> {
        this.tableLoading = true;
        this.spinner.show();
        const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
        return this.masterService.searchTandC({
            search: this.filterValue?.trim(),
            page: Number(this.page),
            pageSize: Number(this.pageSize),
            activeCompanyId: CompanyMasterSid,
            activeBranchId: this.currentBranch?.BranchMasterSid,
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection
        });
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
        if (response?.status) {
            const rawData = Array.isArray(response.data?.items)
                ? response.data.items
                : (Array.isArray(response.data) ? response.data : []);

            this.allItems = rawData.map(item => ({
                ...item,
                branchName: this.getBranchName(item),
                menuName: this.getMenuName(item),
                departmentName: this.getDepartmentName(item),
                pol: Array.isArray(item.POL) && item.POL.length ? item.POL[0] : '-',
                pod: Array.isArray(item.POD) && item.POD.length ? item.POD[0] : '-',
                status: item.status === 'A' ? 'Active' : 'Suspended'
            }));

            this.totalLengthOfCollection = response.data?.totalCount ?? this.allItems.length;
            this.applySorting();
            this.updateHeaderActionState();
        } else {
            this.appSettingService.showError('Error searching Terms and Conditions.');
            this.allItems = [];
            this.totalLengthOfCollection = 0;
        }
    }

    protected override handleSearchError(error: any): void {
        this.tableLoading = false;
        this.spinner.hide();
        this.appSettingService.showError('Error searching Terms and Conditions.');
        console.error('Error searching Terms and Conditions', error);
        super.handleSearchError(error);
    }

    onSearchTriggered(searchValue: string): void {
        this.filterValue = searchValue;
        this.searchTermsAndConditions();
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
                this.navigateTocreateTerms();
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

    searchTermsAndConditions() {
        this.search();
    }

    clearFilterValue() {
        this.clearFilter();
    }

    override trackBy(index: number, item: any): number {
        return item.TermsAndConditionsMasterSid || index;
    }

    viewTermsAndCondition(item: any): void {
        this.router.navigate(['/master/terms-condition/entry/', item.TermsAndConditionsMasterSid]);
    }

    deleteTandC(item: any) {
        const dialogRef = this.dialog.open(DeleteWarningComponent);
        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.spinner.show();
                this.masterService.deleteTandCById(item.TermsAndConditionsMasterSid).subscribe({
                    next: (resp: any) => {
                        this.spinner.hide();
                        if (resp.status) {
                            this.appSettingService.showSuccess('Terms and Conditions successfully deleted');
                            this.search();
                        } else {
                            this.appSettingService.showError('Error deleting Terms and Conditions');
                        }
                    },
                    error: (error) => {
                        this.spinner.hide();
                        this.appSettingService.showError('Error deleting Terms and Conditions');
                        console.error('Error deleting Terms and Conditions', error);
                    }
                });
            }
        });
    }

    navigateTocreateTerms() {
        this.router.navigate(['master/terms-condition/entry']);
    }

    report(): void {
        const formattedData = this.allTermsConditions;
        const companyName = this.currentCompany?.companyName ?? 'Company';

        const visibleColumns = this.termsConditionTable.getVisibleColumns();
        const dynamicHeaders = visibleColumns.map(column => ({
            key: column.key,
            label: column.label
        }));

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: dynamicHeaders,
            fileName: 'Terms-and-Condition-Report',
            title: companyName
        });
    }

    private initializeTableConfig(): void {
        this.tableConfig = {
            columns: [
                {
                    key: 'branchName',
                    label: 'Branch',
                    sortable: true,
                    filterable: true,
                    visible: true,
                    dataType: 'string'
                },
                {
                    key: 'menuName',
                    label: 'Menu',
                    sortable: true,
                    filterable: true,
                    visible: true,
                    dataType: 'string'
                },
                {
                    key: 'departmentName',
                    label: 'Department',
                    sortable: true,
                    filterable: true,
                    visible: true,
                    dataType: 'string'
                },
                {
                    key: 'pol',
                    label: 'POL',
                    sortable: true,
                    filterable: true,
                    visible: true,
                    dataType: 'string'
                },
                {
                    key: 'pod',
                    label: 'POD',
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
                    dataType: 'string',
                    cellClass: 'status-column'
                }
            ],
            actions: [
                {
                    icon: 'fas fa-eye',
                    label: 'View',
                    action: 'view',
                    tooltip: 'View',
                    state: !this.mps.can('view')
                },
                {
                    icon: 'fas fa-trash',
                    label: 'Delete',
                    action: 'delete',
                    tooltip: 'Delete',
                    class: 'text-danger',
                    state: !this.mps.can('delete')
                }
            ],
            selectable: false,
            multiSelect: false,
            showColumnToggle: true,
            showFilters: true,
            showPagination: true,
            trackByKey: 'TermsAndConditionsMasterSid',
            emptyMessage: 'No Terms and Conditions found',
            dragAndDrop: true
        };
    }

    onTableActionClick(event: TableEventData): void {
        if (event.action === 'view') {
            this.viewTermsAndCondition(event.row);
        } else if (event.action === 'delete') {
            this.deleteTandC(event.row);
        }
    }

    onTableRowClick(row: any): void {}

    onTableSortChange(sort: TableSortConfig): void {
        this.sortColumn = sort.column;
        this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
        this.search();
    }

    onTableFilterChange(filters: TableFilter[]): void {
        console.log('Filters changed:', filters);
    }

    private loadLookupData(): void {
        const companyMasterSid = this.currentCompany?.CompanyMasterSid;
        if (!companyMasterSid) {
            return;
        }

        forkJoin({
            branches: this.masterService.getCurrentBranch(companyMasterSid),
            menus: this.masterService.getAllMenu(),
            departments: this.masterService.getAllDepartments(companyMasterSid)
        }).subscribe({
            next: ({ branches, menus, departments }) => {
                this.branchNameMap.clear();
                this.menuNameMap.clear();
                this.departmentNameMap.clear();

                (branches || []).forEach((branch: any) => {
                    if (branch?.BranchMasterSid != null) {
                        this.branchNameMap.set(Number(branch.BranchMasterSid), branch?.branchName || '');
                    }
                });

                (menus || []).forEach((menu: any) => {
                    if (menu?.MenuMasterSid != null) {
                        this.menuNameMap.set(Number(menu.MenuMasterSid), menu?.MenuName || '');
                    }
                });

                (departments || []).forEach((department: any) => {
                    const sid = department?.DepartmentMasterSid ?? department?.departmentId;
                    if (sid != null) {
                        this.departmentNameMap.set(Number(sid), department?.departmentName || '');
                    }
                });

                super.ngOnInit();
            },
            error: (error) => {
                console.error('Error loading lookup data for Terms and Conditions list', error);
            }
        });
    }

    private getBranchName(item: any): string {
        return item?.branch?.branchName
            || this.branchNameMap.get(Number(item?.BranchMasterSid))
            || (item?.BranchMasterSid != null ? String(item.BranchMasterSid) : '');
    }

    private getMenuName(item: any): string {
        return item?.menu?.MenuName
            || this.menuNameMap.get(Number(item?.MenuMasterSid))
            || (item?.MenuMasterSid != null ? String(item.MenuMasterSid) : '');
    }

    private getDepartmentName(item: any): string {
        const departments = Array.isArray(item?.departments) ? item.departments : [];
        if (departments.length > 0) {
            const names = departments
                .map((department: any) => {
                    const nestedName = department?.departmentName
                        || department?.department?.departmentName
                        || department?.DepartmentMaster?.departmentName;
                    if (nestedName) return nestedName;
                    const sid = department?.DepartmentMasterSid ?? department?.departmentId;
                    return this.departmentNameMap.get(Number(sid)) || '';
                })
                .filter((name: string) => !!name);
            return names.length ? names.join(', ') : '-';
        }

        const sid = item?.DepartmentMasterSid ?? item?.departmentId;
        if (sid != null) {
            return this.departmentNameMap.get(Number(sid)) || '-';
        }
        return '-';
    }
}
