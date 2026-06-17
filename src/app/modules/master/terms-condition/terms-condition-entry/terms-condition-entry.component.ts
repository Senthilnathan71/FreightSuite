import { Component, HostListener, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { SearchableDropdownModal } from 'src/app/component/searchable-dropdown/searchable-dropdown-modal.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

@Component({
    selector: 'app-terms-condition-entry',
    standalone: true,
    imports: [
        FeatherModule,
        NgSelectModule,
        ReactiveFormsModule,
        NgbPaginationModule,
        NgbModalModule,
        CommonModule,
        OnlyTextDirective,
        TextWithNumbersDirective,
        DatePipe,
        PreventMultiClickDirective,
        SearchableDropdown,
        NgbDropdownModule,
        ElementStateGuardDirective,
        FormStateGuardDirective
    ],
    templateUrl: './terms-condition-entry.component.html',
    styleUrl: './terms-condition-entry.component.scss'
})
export class TermsConditionEntryComponent implements OnInit, HasUnsavedChanges {

    TermsAndConditionsMasterSid: number;
    departmentOnTermsId: number;
    TermsAndConditionsDetailSid: number | null;
    isEditMode: boolean = false;
    isModalEditMode: boolean = false;
    isSaving: boolean = false;
    isDirty: boolean = false;
    isDetailSaving: boolean = false;
    termsAndConditionForm !: FormGroup;
    termsAndConditionDetailForm !: FormGroup;
    menuList: any[] = [];
    portList: any[] = [];
    carrierList: any[] = [];
    branchList: any[] = [];
    departmentList: any[] = [];
    selectedDepartment: any;
    selectedDepartmentType: string = '';
    selectedFCLLCL: string = '';
    filteredPorts: any[] = [];
    filteredPOL: any[] = [];
    filteredPOD: any[] = [];
    TandCDetail: any[] = [];
    filteredTandCDetail: any[] = [];
    TandCDetailLength: number = 0;
    page = 1;
    pageSize = 5;
    totalAmountOfCollections: number;
    tandCHeaderData: any;
    tandCDetailData: any;
    currentMenuId: number;
    TandCList: any[] = [];
    currentCompany: any;
    currentBranch: any;
    showDetailSection: boolean = false;
    pendingDetailEditIndex: number | null = null;
    pendingDepartmentSid: number | null = null;
    private initialStateSnapshot = '';
    private suppressDirtyCheck = false;

    portLookupConfig = DROPDOWN_CONFIGS.PORT
    constructor(
        private masterService: MasterService,
        private operationService: OperationService,
        private settingsService: SettingsService,
        private appSettingService: AppSettingsService,
        private route: Router,
        private currentRoute: ActivatedRoute,
        private modalService: NgbModal,
        private fb: FormBuilder,
        private dialog: MatDialog,
        public mps: MenuPermissionService
    ) { }

    ngOnInit() {
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        this.mps.init().subscribe();
        this.initTandCForm();
        this.initTandDetailForm();
        this.loadAllFields();
        this.termsAndConditionForm.get('MenuMasterSid')?.valueChanges.subscribe(() => {
    if (!this.showExtraFields) {
        this.termsAndConditionForm.patchValue({
            departmentId: null,
            Carrier: null,
            POL: null,
            POD: null
        }, { emitEvent: false });

        this.selectedDepartment = null;
        this.selectedDepartmentType = '';
        this.selectedFCLLCL = '';
        this.filteredPorts = [...this.portList];
        this.filteredPOL = [...this.portList];
        this.filteredPOD = [...this.portList];
    }
});
        this.currentRoute.paramMap.subscribe(
            (param) => {
                this.TermsAndConditionsMasterSid = +param.get('id');
                if (this.TermsAndConditionsMasterSid) {
                    this.isEditMode = true;
                }
            }
        )
        this.subscribeToFormChanges();
        this.captureInitialState();
    }

    initTandCForm() {
        this.termsAndConditionForm = this.fb.group({
            MenuMasterSid: [, [Validators.required]],
            BranchMasterSid: [, [Validators.required]],
            departmentId: [],
            CompanyMasterSid: [this.currentCompany?.CompanyMasterSid],
            Carrier: [],
            POL: [],
            POD: [],
            status: ['Active'],
        })
    }

    private getDetailPayloadFromForm(formValue: any) {
        return {
            TermsAndConditionsDetailSid: formValue?.TermsAndConditionsDetailSid || this.TermsAndConditionsDetailSid || null,
            TermsAndConditionsMasterSid: this.TermsAndConditionsMasterSid || null,
            IsDefaut: formValue?.IsDefaut === true || formValue?.IsDefaut === 'S' ? 'S' : 'N',
            TandC: formValue?.TandC || '',
            Type: formValue?.Type || '',
            TypeValue: formValue?.TypeValue || '',
            status: (formValue?.detailstatus ? formValue.detailstatus : formValue?.status) === 'Active' || formValue?.status === 'A' ? 'A' : 'S'
        };
    }

    private buildTermsDetailPayload(): any[] {
        const details = [...(this.TandCDetail || [])];
        return details.map((item: any) => this.getDetailPayloadFromForm(item));
    }

    initTandDetailForm() {
        this.termsAndConditionDetailForm = this.fb.group({
            TermsAndConditionsMasterSid: [],
            IsDefaut: [false, [Validators.required]],
            TandC: ['', [Validators.required, Validators.maxLength(500)]],
            Type: ['', [Validators.maxLength(20)]],
            TypeValue: ['', [Validators.maxLength(20)]],
            detailstatus: ['Active'],
        })
    }

    updatePaginationData() {
        let start = (this.page - 1) * this.pageSize;
        let end = start + this.pageSize;
        this.filteredTandCDetail = this.TandCDetail.slice(start, end);
    }


    loadAllFields() {
        const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
        forkJoin({
            menus: this.masterService.getAllMenus(),
            ports: this.masterService.getAllPorts(),
            carriers: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['carrier', 'airLine'] }).pipe(catchError(err => of([]))),
            branches: this.masterService.getCurrentBranch(CompanyMasterSid),
            departments: this.masterService.getAllDepartments(CompanyMasterSid)
        }).subscribe(({ menus, ports, carriers, branches, departments }) => {
            this.menuList = menus,
                this.portList = (ports.data || []).map(p=> ({ ...p, Country: p.countryMaster?.countryName})),
                this.filteredPorts = [...this.portList],
                this.filteredPOL = [...this.portList],
                this.filteredPOD = [...this.portList],
                this.carrierList = carriers.data,
                this.branchList = branches,
                this.departmentList = departments;
            if (this.pendingDepartmentSid) {
                this.onDepartmentChange(this.pendingDepartmentSid);
                this.pendingDepartmentSid = null;
            }
            if (this.isEditMode && this.TermsAndConditionsMasterSid) {
                this.loadTermsAndConditions();
            }
        })
    }

    onDepartmentChange(departmentSid: any) {
        const selectedDepartmentSid = typeof departmentSid === 'object'
            ? Number(departmentSid?.DepartmentMasterSid ?? departmentSid?.departmentId ?? 0)
            : Number(departmentSid);

        if (!selectedDepartmentSid) {
            this.selectedDepartment = null;
            this.selectedDepartmentType = '';
            this.selectedFCLLCL = '';
            this.filteredPorts = [...this.portList];
            this.filteredPOL = [...this.portList];
            this.filteredPOD = [...this.portList];
            this.termsAndConditionForm.patchValue({
                POL: null,
                POD: null,
            }, { emitEvent: false });
            return;
        }
        if (!this.departmentList?.length) {
            this.pendingDepartmentSid = selectedDepartmentSid;
            return;
        }
        const department = this.departmentList.find(
            (dep: any) => Number(dep?.DepartmentMasterSid) === selectedDepartmentSid
        );
        this.selectedDepartment = department || null;

        if (!department) {
            this.selectedDepartmentType = '';
            this.selectedFCLLCL = '';
            this.filteredPorts = [...this.portList];
            this.filteredPOL = [...this.portList];
            this.filteredPOD = [...this.portList];
            this.termsAndConditionForm.patchValue({
                POL: [],
                POD: [],
            }, { emitEvent: false });
            return;
        }

        this.selectedDepartmentType = String(department?.departmentType || '').toUpperCase();
        this.selectedFCLLCL = this.selectedDepartmentType === 'SEA'
            ? String(department?.FCLLCL || '').toUpperCase()
            : 'AIR';

        this.filteredPorts = this.getFilteredPortsBySegment(this.selectedFCLLCL);

        // 🔥 CLEAR POL & POD when department changes
        this.termsAndConditionForm.patchValue({
            POL: null,
            POD: null,
        }, { emitEvent: false });

        // Reset filtered dropdown lists
        this.filteredPOL = [...this.filteredPorts];
        this.filteredPOD = [...this.filteredPorts];
    }

    getFilteredPortsBySegment(segment: string): any[] {
        const normalized = String(segment || '').toUpperCase();
        if (normalized === 'AIR') {
            return this.portList.filter((port: any) => String(port?.PortType || '').toUpperCase() === 'AIR');
        }
        if (normalized === 'FCL' || normalized === 'LCL') {
            return this.portList.filter((port: any) => String(port?.PortType || '').toUpperCase() === 'SEA');
        }
        return [...this.portList];
    }

    onPortSelectionChange(): void {
        const pol = this.termsAndConditionForm.get('POL')?.value;
        const pod = this.termsAndConditionForm.get('POD')?.value;

        this.filteredPOL = this.filteredPorts.filter(
            (port: any) => port.PortCode !== pod
        );

        this.filteredPOD = this.filteredPorts.filter(
            (port: any) => port.PortCode !== pol
        );

        // If same selected in both, clear one
        if (pol && pod && pol === pod) {
            this.termsAndConditionForm.patchValue({
                POD: null
            }, { emitEvent: false });
        }
    }


    private asArray(value: any): any[] {
        if (Array.isArray(value)) return value;
        if (value === null || value === undefined || value === '') return [];
        return [value];
    }

    onSubmit(resolve?: (value: boolean) => void) {
        if (this.isSaving) {
            if (resolve) resolve(false);
            return;
        }
        if (!this.hasUnsavedChanges()) {
            this.appSettingService.showWarning('No changes to save');
            if (resolve) resolve(true);
            return;
        }
        if (this.termsAndConditionForm.invalid) {
            this.termsAndConditionForm.markAllAsTouched();
            this.termsAndConditionForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields');
            if (resolve) resolve(false);
            return;
        }
        if (!this.TandCDetail || this.TandCDetail.length === 0) {
            this.appSettingService.showWarning('Please add at least one Terms and Conditions detail row');
            if (resolve) resolve(false);
            return;
        }
        this.isSaving = true;
        const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
        const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
        const formValue = this.termsAndConditionForm.getRawValue();
        const { departmentId, ...rest } = formValue;
        const masterFormValue = {
            ...rest,
            CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
            POL: this.wrapAsArray(rest.POL),
            POD: this.wrapAsArray(rest.POD),
        };
        const termsAndConditionsDetail = this.buildTermsDetailPayload();
        const departmentPayload = departmentId
            ? [{
                DepartmentOnTermSid: this.isEditMode ? this.departmentOnTermsId : null,
                departmentId: Number(departmentId),
                status: formValue.status === 'Active' ? 'A' : 'S'
            }]
            : [];
        const payload = {
            ...masterFormValue,
            status: formValue.status === 'Active' ? 'A' : 'S',
            departmentOnTerms: departmentPayload,
            termsAndConditionsDetail,
            ...(this.isEditMode ? { updatedBy: updatedBy } : { createdBy: createdBy })
        };
        if (this.isEditMode) {
            this.masterService.updateTandCById(this.TermsAndConditionsMasterSid, payload).subscribe(
                (resp: any) => {
                    if (resp.status) {
                        this.appSettingService.showSuccess('Terms and Conditions updated successfully');
                        this.isDirty = false;
                        this.loadTermsAndConditions();
                        if (resolve) resolve(true);
                    } else {
                        const backendMessage = resp?.message;
                        this.appSettingService.showError(backendMessage)
                        if (resolve) resolve(false);
                    }
                    this.isSaving = false;
                },
                (error) => {
                    this.isSaving = false;
                    if (resolve) resolve(false);
                    console.error('Error Updating Terms and Conditions', error);
                }
            )
        } else {
            this.masterService.createNewTandC(payload).subscribe(
                (resp: any) => {
                    if (resp.status) {
                        const createdId = resp?.data?.tandCData?.TermsAndConditionsMasterSid;
                        this.isDirty = false;
                        this.captureInitialState();
                        if (createdId) {
                            this.appSettingService.showSuccess('New Terms and Conditions created successfully');
                            this.route.navigate(['master/terms-condition/entry', createdId]);
                        } else {
                            this.appSettingService.showSuccess('New Terms and Conditions created successfully');
                            this.route.navigate(['master/terms-condition/list']);
                        }
                        if (resolve) resolve(true);
                    } else {
                        const backendMessage = resp?.message;
                        this.appSettingService.showError(backendMessage)
                        if (resolve) resolve(false);
                    }
                    this.isSaving = false;
                },
                (error) => {
                    this.isSaving = false;
                    const backendMessage = error?.error?.message || error?.error?.response?.message || error?.message;
                    this.appSettingService.showError(backendMessage)
                    if (resolve) resolve(false);
                    console.error('Error Creating Terms and Conditions', error)
                }
            )
        }
    }
    private wrapAsArray(value: any): string[] {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
    }


    upsertDetailRow() {
        if (this.isDetailSaving) return;
        if (this.termsAndConditionDetailForm.invalid) {
            this.termsAndConditionDetailForm.markAllAsTouched();
            this.termsAndConditionDetailForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields');
            return;
        }
        const formValue = this.termsAndConditionDetailForm.value;
        const localDetail = {
            TermsAndConditionsMasterSid: this.TermsAndConditionsMasterSid || null,
            TermsAndConditionsDetailSid: this.TermsAndConditionsDetailSid || null,
            IsDefaut: formValue.IsDefaut ? 'S' : 'N',
            TandC: formValue.TandC,
            Type: formValue.Type,
            TypeValue: formValue.TypeValue,
            status: formValue.detailstatus === 'Active' ? 'A' : 'S'
        };

        if (this.isModalEditMode && this.pendingDetailEditIndex !== null) {
            this.TandCDetail[this.pendingDetailEditIndex] = localDetail;
        } else {
            this.TandCDetail.push(localDetail);
        }
        this.TandCDetailLength = this.TandCDetail.length;
        this.totalAmountOfCollections = this.TandCDetailLength;
        this.updatePaginationData();
        this.closeDetailSection();
        this.evaluateDirtyState();
    }

    startNewDetail() {
        this.initTandDetailForm();
        this.isModalEditMode = false;
        this.TermsAndConditionsDetailSid = null;
        this.pendingDetailEditIndex = null;
        this.termsAndConditionDetailForm.patchValue({
            TermsAndConditionsMasterSid: this.TermsAndConditionsMasterSid || null,
            IsDefaut: false,
            TandC: '',
            Type: '',
            TypeValue: '',
            detailstatus: 'Active'
        });
    }

    editDetail(data?: any, index?: number) {
        this.showDetailSection = true;
        this.initTandDetailForm();
        this.isModalEditMode = false;
        this.TermsAndConditionsDetailSid = null;
        this.pendingDetailEditIndex = null;
        if (data) {
            this.isModalEditMode = true;
            this.tandCDetailData = data;
            if (typeof index === 'number') {
                this.pendingDetailEditIndex = index;
            }
            this.termsAndConditionDetailForm.patchValue({
                ...data,
                IsDefaut: data.IsDefaut === 'S' ? true : false,
                detailstatus: data.status === 'A' ? 'Active' : 'Suspended'
            })
            if (data.TermsAndConditionsDetailSid) {
                this.termsAndConditionDetailForm.get('TermsAndConditionsMasterSid').setValue(data.TermsAndConditionsMasterSid);
                this.TermsAndConditionsDetailSid = data.TermsAndConditionsDetailSid;
            }
        } else {
            this.termsAndConditionDetailForm.get('TermsAndConditionsMasterSid').setValue(this.TermsAndConditionsMasterSid);
        }
    }

    deleteTandCDetail(item: any, index: number) {
        if (!item?.TermsAndConditionsDetailSid) {
            this.TandCDetail.splice(index, 1);
            this.TandCDetailLength = this.TandCDetail.length;
            this.totalAmountOfCollections = this.TandCDetailLength;
            this.updatePaginationData();
            this.evaluateDirtyState();
            return;
        }
        const modalRef = this.dialog.open(DeleteWarningComponent);
        modalRef.afterClosed().subscribe(
            (res) => {
                if (res) {
                    this.masterService.deleteTandCDetailById(item.TermsAndConditionsDetailSid).subscribe(
                        (resp: any) => {
                            if (resp.status) {
                                this.appSettingService.showSuccess('Terms and Conditions Details successfully deleted');
                                this.loadTandCDetails();
                            } else {
                                this.appSettingService.showError('Error Deleting Terms and Conditions Details')
                            }
                        },
                        (error) => {
                            console.error('Error Deleting Terms and Conditions Details', error);
                        }
                    )
                }
            }
        )
    }

    loadTermsAndConditions() {
        const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
        const BranchMasterSid = this.currentBranch?.BranchMasterSid;
        const payload = {
            CompanyMasterSid: CompanyMasterSid,
            BranchMasterSid: BranchMasterSid,
            TermsAndConditionsMasterSid: this.TermsAndConditionsMasterSid
        };
        this.masterService.getTandCById(payload).subscribe(
            (resp: any) => {
                if (resp.status) {
                    const response = resp.data;
                    this.tandCHeaderData = response;
                    this.suppressDirtyCheck = true;

                    const departmentId =
                        response.departments[0]?.departmentId ||
                        response.departments[0]?.DepartmentMasterSid ||
                        '';

                    this.termsAndConditionForm.patchValue({
                        ...response,
                        departmentId,
                        status: response.status === 'A' ? 'Active' : 'Suspended'
                    });

                    this.onDepartmentChange(departmentId);

                    const polCode = response.POL?.[0] || null;
                    const podCode = response.POD?.[0] || null;

                    this.termsAndConditionForm.patchValue({
                        POL: polCode,
                        POD: podCode
                    });

                    this.departmentOnTermsId =
                        response.departments[0]?.DepartmentOnTermSid;
                    this.suppressDirtyCheck = false;

                    this.loadTandCDetails();
                    if (this.isEditMode) {
                    ['MenuMasterSid', 'BranchMasterSid', 'departmentId', 'Carrier', 'POL', 'POD']
                        .forEach(ctrl => this.termsAndConditionForm.get(ctrl)?.disable({ emitEvent: false }));
                }
                } else {
                    this.appSettingService.showError('Access denied.');
                }
            }
        );
    }

    loadTandCDetails() {
        this.masterService.getAllTandCDetail().subscribe(
            (resp: any) => {
                if (resp.status) {
                    const loadedData = resp.data;
                    this.TandCDetail = loadedData.filter(detail => detail.TermsAndConditionsMasterSid === this.TermsAndConditionsMasterSid);
                    this.TandCDetailLength = this.TandCDetail.length;
                    this.totalAmountOfCollections = this.TandCDetailLength;
                    this.updatePaginationData();
                    this.captureInitialState();
                } else {
                    this.appSettingService.showError('Error Loading Terms and Conditions Details')
                }
            },
            (error) => {
                console.error('Error loading T&C Details', error);
            }
        )
    }

    closeDetailForm() {
        this.isModalEditMode = false;
        this.isDetailSaving = false;
        this.TermsAndConditionsDetailSid = null;
        this.pendingDetailEditIndex = null;
        this.termsAndConditionDetailForm.reset({
            TermsAndConditionsMasterSid: this.TermsAndConditionsMasterSid || null,
            IsDefaut: false,
            TandC: '',
            Type: '',
            TypeValue: '',
            detailstatus: 'Active'
        });
    }

    resetForm() {

        // If editing → reload original record from server
        if (this.isEditMode && this.TermsAndConditionsMasterSid) {
            this.loadTermsAndConditions();
            return;
        }

        // ---------- CREATE MODE RESET ----------

        this.termsAndConditionForm.reset({
            MenuMasterSid: null,
            BranchMasterSid: null,
            departmentId: null,
            Carrier: null,
            POL: null,
            POD: null,
            status: 'Active'
        });

        // Reset detail form also
        this.termsAndConditionDetailForm.reset({
            TermsAndConditionsMasterSid: null,
            IsDefaut: false,
            TandC: '',
            Type: '',
            TypeValue: '',
            detailstatus: 'Active'
        });

        // Clear header-level local state
        this.selectedDepartment = null;
        this.selectedDepartmentType = '';
        this.selectedFCLLCL = '';
        this.departmentOnTermsId = null;

        // Reset port filtering
        this.filteredPorts = [];
        this.filteredPOL = [];
        this.filteredPOD = [];

        // Clear details table
        this.TandCDetail = [];
        this.filteredTandCDetail = [];
        this.TandCDetailLength = 0;
        this.totalAmountOfCollections = 0;

        // Reset pagination
        this.page = 1;

        // Reset flags
        this.isModalEditMode = false;
        this.isSaving = false;
        this.isDetailSaving = false;
        this.TermsAndConditionsDetailSid = null;
        this.pendingDetailEditIndex = null;

        // Hide detail section if open
        this.showDetailSection = false;

        // Clear header data references
        this.tandCHeaderData = null;
        this.tandCDetailData = null;
        this.captureInitialState();

    }

    navigateToCreate() {
        this.route.navigate(['master/terms-condition/entry']);
    }


    navigateBack() {
        this.route.navigate(['master/terms-condition/list']);
    }

    showHeaderInfo() {
        if (!this.tandCHeaderData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.tandCHeaderData;
        modalRef.componentInstance.idLabel = 'Terms and Condition Header Id';
        modalRef.componentInstance.idValue = this.tandCHeaderData?.TermsAndConditionsMasterSid;
    }
    showDetailInfo() {
        if (!this.tandCDetailData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.tandCDetailData;
        modalRef.componentInstance.idLabel = 'Terms and Condition Detail Id';
        modalRef.componentInstance.idValue = this.tandCDetailData?.TermsAndConditionsDetailSid;
    }

    openDetailSection() {
        this.showDetailSection = true;
        this.startNewDetail();
    }

    closeDetailSection() {
        this.showDetailSection = false;
        this.closeDetailForm();
    }

    allowedMenuCodesForExtraFields: string[] = ['QUA', 'RAT', 'SC2', 'MA2', 'MA1', 'HJB', 'HBL', 'BKN', 'AMA'];

get selectedMenuCode(): string {
    const selectedMenuSid = Number(this.termsAndConditionForm?.get('MenuMasterSid')?.value);
    const selectedMenu = this.menuList?.find(
        (menu: any) => Number(menu?.MenuMasterSid) === selectedMenuSid
    );
    return String(selectedMenu?.MenuCode || '').trim().toUpperCase();
}

get showExtraFields(): boolean {
    return this.allowedMenuCodesForExtraFields.includes(this.selectedMenuCode);
}

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: BeforeUnloadEvent): void {
        if (this.hasUnsavedChanges()) {
            $event.preventDefault();
            $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    hasUnsavedChanges(): boolean {
        return this.isDirty;
    }

    async saveChanges(): Promise<boolean> {
        return new Promise((resolve) => {
            this.onSubmit(resolve);
        });
    }

    private subscribeToFormChanges(): void {
        this.termsAndConditionForm.valueChanges.subscribe(() => {
            if (this.suppressDirtyCheck) return;
            this.evaluateDirtyState();
        });
    }

    private evaluateDirtyState(): void {
        this.isDirty = this.initialStateSnapshot !== this.buildCurrentStateSnapshot();
    }

    private captureInitialState(): void {
        this.initialStateSnapshot = this.buildCurrentStateSnapshot();
        this.isDirty = false;
    }

    private buildCurrentStateSnapshot(): string {
        return JSON.stringify({
            form: this.normalizeValue(this.termsAndConditionForm?.getRawValue?.() || {}),
            details: this.normalizeValue(this.buildTermsDetailPayload())
        });
    }

    private normalizeValue(value: any): any {
        if (value === null || value === undefined) return null;
        if (typeof value === 'string') return value.trim();
        if (typeof value === 'number') return Number(value);
        if (Array.isArray(value)) return value.map((item) => this.normalizeValue(item));
        if (typeof value === 'object') {
            return Object.keys(value).sort().reduce((acc: any, key: string) => {
                acc[key] = this.normalizeValue(value[key]);
                return acc;
            }, {});
        }
        return value;
    }

    openAuditLogs() {
          if (!this.TermsAndConditionsMasterSid) return;
          const modalRef = this.modalService.open(AuditLogComponent, {
            centered: true,
            scrollable: true,
            size: 'xl',
            windowClass: 'audit-log-modal'
          });
          modalRef.componentInstance.title = 'Terms And Condition Logs';
          modalRef.componentInstance.tableName = 'TermsAndConditionsMaster';
          modalRef.componentInstance.recordId = this.TermsAndConditionsMasterSid.toString();
          modalRef.componentInstance.screenName = 'Terms';
        }

}
