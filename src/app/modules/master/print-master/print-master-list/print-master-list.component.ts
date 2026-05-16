import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PrintMasterService } from '../print-master.service';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { UnsavedChangesAction, UnsavedChangesDialogComponent } from 'src/app/shared/components/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';

@Component({
    selector: 'app-print-master-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgSelectModule,
        NgxSpinnerModule,
        ReusableTableComponent,
        PageHeaderComponent
    ],
    templateUrl: './print-master-list.component.html'
})
export class PrintMasterListComponent extends BaseListComponent implements OnInit {
    @ViewChild('printMasterTable') printMasterTable!: ReusableTableComponent;
    @ViewChild('content') content!: TemplateRef<any>;

    form!: FormGroup;
    isEditMode = false;
    isSaving = false;
    isDirty = false;
    currentRecord: any = null;
    menuList: any[] = [];
    modalRef!: NgbModalRef;
    private initialFormValue: any = null;

    readonly printMailOptions = [
        { value: 'Print', label: 'Print' },
        { value: 'Send Mail', label: 'Send Mail' },
        { value: 'Download', label: 'Download' }
    ];

    readonly statusOptions = [
        { value: 'A', label: 'Active' },
        { value: 'S', label: 'Suspended' }
    ];

    tableConfig: TableConfig = {
        columns: [],
        actions: [
            { icon: 'fas fa-edit', label: 'Edit', action: 'edit', tooltip: 'Edit' }
        ],
        selectable: false,
        multiSelect: false,
        showColumnToggle: true,
        showFilters: true,
        showPagination: true,
        trackByKey: 'PrintMasterSid',
        emptyMessage: 'No print masters found',
        dragAndDrop: false
    };

    tableLoading = false;
    headerActions: HeaderAction[] = [];

    protected config: ListComponentConfig = {
        storageKey: 'print-master-list-state',
        defaultPageSize: 10,
        defaultSortColumn: 'PrintMasterSid',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100],
        maxPagesToShow: 3
    };

    currentCompany: any;
    currentBranch: any;
    userData: any;

    constructor(
        public mps: MenuPermissionService,
        private printMasterService: PrintMasterService,
        private settingsService: SettingsService,
        private appSettingService: AppSettingsService,
        private modalService: NgbModal,
        private fb: FormBuilder,
        private spinner: NgxSpinnerService,
        private excelReportService: ExcelExportService,
        paginationService: PaginationService
    ) {
        super(paginationService);
    }

    override ngOnInit(): void {
        this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        this.userData = this.appSettingService.getDecryptedUserProfile();
        this.initForm();
        this.loadMenuList();
        this.initTableConfig();
        this.initHeaderActions();
        this.mps.init().subscribe(() => {
            this.initHeaderActions();
            this.initTableConfig();
        });
        super.ngOnInit();
    }

    private initForm(): void {
        this.form = this.fb.group({
            MenuMasterSid: [null, Validators.required],
            Name: ['', [Validators.required, Validators.maxLength(50)]],
            PrintMail: [null, Validators.required],
            Status: ['A']
        });

        this.form.valueChanges.subscribe(() => {
            if (!this.initialFormValue) return;
            this.isDirty = !this.deepEqual(this.initialFormValue, this.form.getRawValue());
        });
    }

    private loadMenuList(): void {
        this.settingsService.getAllModulesWithMenus().subscribe({
            next: (resp: any) => {
                const menuMap: Record<string, any[]> = resp.data || {};
                const menus: any[] = [];
                Object.values(menuMap).forEach((moduleMenus: any[]) => {
                    moduleMenus.forEach(m => menus.push(m));
                });
                this.menuList = menus.sort((a, b) =>
                    String(a.MenuName).localeCompare(String(b.MenuName))
                );
            },
            error: () => this.appSettingService.showError('Failed to load menu list.')
        });
    }

    openModal(item?: any): void {
        this.isEditMode = !!item;
        this.currentRecord = item || null;
        this.form.reset({ MenuMasterSid: null, Name: '', PrintMail: null, Status: 'A' });

        if (this.isEditMode) {
            this.form.patchValue({
                MenuMasterSid: item.MenuMasterSid,
                Name: item.Name,
                PrintMail: item.PrintMail,
                Status: item.Status
            });
            this.form.get('Status')?.enable();
        } else {
            this.form.get('Status')?.disable();
        }

        this.setInitialFormValue();
        this.modalRef = this.modalService.open(this.content, {
            centered: true,
            size: 'md',
            backdrop: 'static',
            keyboard: false,
            beforeDismiss: () => this.canCloseModal()
        });
    }

    showInfo(): void {
        if (!this.currentRecord) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.currentRecord;
        modalRef.componentInstance.idLabel = 'Print Master Id';
        modalRef.componentInstance.idValue = this.currentRecord?.PrintMasterSid;
    }

    openAuditLogs() {
                if (!this.currentRecord?.PrintMasterSid) return;
            const modalRef = this.modalService.open(AuditLogComponent, {
                  centered: true,
                  scrollable: true,
                  size: 'xl',
                  windowClass: 'audit-log-modal'
                });
                modalRef.componentInstance.title = 'Print Logs';
                modalRef.componentInstance.tableName = 'PrintMaster';
                modalRef.componentInstance.recordId = this.currentRecord?.PrintMasterSid.toString();
                modalRef.componentInstance.screenName = 'Print';
              }

    onSave(modal: any): void {
        if (this.isSaving) return;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.appSettingService.showWarning('Please fill all required fields.');
            return;
        }
        if (!this.isDirty) {
            this.appSettingService.showWarning('No changes to save.');
            return;
        }

        const formValue = this.form.getRawValue();
        this.isSaving = true;

        if (this.isEditMode) {
            const payload = {
                Name: formValue.Name,
                PrintMail: formValue.PrintMail,
                MenuMasterSid: formValue.MenuMasterSid,
                Status: formValue.Status,
                UpdatedBy: this.userData?.userEmail || ''
            };
            this.printMasterService.update(this.currentRecord.PrintMasterSid, payload).subscribe({
                next: (resp: any) => {
                    this.isSaving = false;
                    if (resp.status) {
                        this.appSettingService.showSuccess(resp.message || 'Updated successfully.');
                        this.setInitialFormValue();
                        modal.close();
                        this.search();
                    } else {
                        this.appSettingService.showError(resp.message || 'Update failed.');
                    }
                },
                error: (err: any) => {
                    this.isSaving = false;
                    this.appSettingService.showError(err.error?.message || 'Update failed.');
                }
            });
        } else {
            const payload = {
                Name: formValue.Name,
                PrintMail: formValue.PrintMail,
                MenuMasterSid: formValue.MenuMasterSid,
                CreatedBy: this.userData?.userEmail || ''
            };
            this.printMasterService.create(payload).subscribe({
                next: (resp: any) => {
                    this.isSaving = false;
                    if (resp.status) {
                        this.appSettingService.showSuccess(resp.message || 'Created successfully.');
                        this.setInitialFormValue();
                        modal.close();
                        this.search();
                    } else {
                        this.appSettingService.showError(resp.message || 'Create failed.');
                    }
                },
                error: (err: any) => {
                    this.isSaving = false;
                    this.appSettingService.showError(err.error?.message || 'Create failed.');
                }
            });
        }
    }

    protected searchItems(): Observable<any> {
        this.tableLoading = true;
        this.spinner.show();
        return this.printMasterService.searchList(this.getSearchParams());
    }

    protected getSearchParams(): SearchParams {
        return {
            search: this.filterValue.trim(),
            page: Number(this.page),
            pageSize: Number(this.pageSize),
            sortColumn: this.sortColumn,
            sortDirection: this.sortDirection
        };
    }

    protected processSearchResults(response: any): void {
        this.tableLoading = false;
        this.spinner.hide();
        if (response?.status && response?.data) {
            const { items, totalCount } = response.data;
            this.allItems = (items || []).map((item: any) => ({
                ...item,
                MenuName : item.MenuMaster?.MenuName || '',
                StatusLabel: item.Status === 'A' ? 'Active' : 'Suspended'
            }));
            this.totalLengthOfCollection = totalCount || 0;
            this.applySorting();
            this.updateHeaderActionState();
        } else {
            this.allItems = [];
            this.totalLengthOfCollection = 0;
        }
    }

    protected override handleSearchError(error: any): void {
        this.tableLoading = false;
        this.spinner.hide();
        this.appSettingService.showError('Error fetching Print Master list.');
        super.handleSearchError(error);
    }

    private initTableConfig(): void {
        this.tableConfig.columns = [
            { key: 'Name', label: 'Print Name', sortable: true, filterable: true, visible: true, dataType: 'string' },
            { key: 'PrintMail', label: 'Action', sortable: true, filterable: true, visible: true, dataType: 'string' },
            { key: 'MenuName', label: 'Menu', sortable: true, filterable: true, visible: true, dataType: 'string' },
            { key: 'StatusLabel', label: 'Status', sortable: true, filterable: true, visible: true, template: 'status', width: '100px', dataType: 'string', cellClass: 'status-column' }
        ];
    }

    private initHeaderActions(): void {
        this.headerActions = [
            { label: 'Create', icon: 'fas fa-plus', action: 'create' },
            { label: 'Report', icon: 'fas fa-file-alt', action: 'report', disabled: true },
            { label: 'Reset', icon: 'fas fa-sync-alt', action: 'reset' }
        ];
    }

    private updateHeaderActionState(): void {
        this.headerActions = this.headerActions.map(a =>
            a.action === 'report' ? { ...a, disabled: this.totalLengthOfCollection === 0 } : a
        );
    }

    onSearchTriggered(value: string): void {
        this.filterValue = value;
        this.search();
    }

    onSearchCleared(): void {
        this.filterValue = '';
        this.clearFilter();
    }

    onActionTriggered(action: string): void {
        switch (action) {
            case 'create': this.openModal(); break;
            case 'report': this.report(); break;
            case 'reset': this.resetPage(); break;
        }
    }

    onTableActionClick(event: TableEventData): void {
        if (event.action === 'edit') {
            this.openModal(event.row);
        }
    }

    onTableRowClick(_row: any): void {}

    onTableSortChange(sort: TableSortConfig): void {
        this.sortColumn = sort.column;
        this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
        this.search();
    }

    onTableFilterChange(_filters: TableFilter[]): void {}

    report(): void {
        const visibleColumns = this.printMasterTable.getVisibleColumns();
        this.excelReportService.exportAsExcel({
            data: this.allItems,
            headers: visibleColumns.map(c => ({ key: c.key, label: c.label })),
            fileName: 'Print-Master-Report',
            title: this.currentCompany?.companyName ?? 'Company'
        });
    }

    override trackBy(_index: number, item: any): number {
        return item.PrintMasterSid;
    }

    private setInitialFormValue(): void {
        this.initialFormValue = this.form.getRawValue();
        this.isDirty = false;
    }

    private normalizeValue(value: any): any {
        if (value === null || value === undefined) return null;
        if (value instanceof Date) return value.toISOString();
        if (Array.isArray(value)) return value.map((v) => this.normalizeValue(v));
        if (typeof value === 'object') {
            return Object.keys(value)
                .sort()
                .reduce((acc: any, key) => {
                    acc[key] = this.normalizeValue(value[key]);
                    return acc;
                }, {});
        }
        return value;
    }

    private deepEqual(obj1: any, obj2: any): boolean {
        return JSON.stringify(this.normalizeValue(obj1)) === JSON.stringify(this.normalizeValue(obj2));
    }

    canCloseModal(): boolean | Promise<boolean> {
        if (this.isSaving) return false;
        if (!this.isDirty) return true;

        const unsavedModalRef = this.modalService.open(UnsavedChangesDialogComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false
        });

        return unsavedModalRef.result
            .then((action: UnsavedChangesAction) => action === 'discard')
            .catch(() => false);
    }
}
