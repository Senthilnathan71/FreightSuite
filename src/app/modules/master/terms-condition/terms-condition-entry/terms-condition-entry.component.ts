import { Component, OnInit } from '@angular/core';
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
        NgbDropdownModule
    ],
    templateUrl: './terms-condition-entry.component.html',
    styleUrl: './terms-condition-entry.component.scss'
})
export class TermsConditionEntryComponent implements OnInit{

    TermsAndConditionsMasterSid: number;
    departmentOnTermsId : number;
    TermsAndConditionsDetailSid:number | null;
    isEditMode : boolean = false;
    isModalEditMode : boolean = false;
    isSaving: boolean = false;
    isDetailSaving: boolean = false;
    termsAndConditionForm !:FormGroup;
    termsAndConditionDetailForm !:FormGroup;
    menuList : any[] = [];
    portList : any[] = [];
    carrierList : any[] = [];
    branchList : any[] = [];
    departmentList : any[] = [];
    selectedDepartment: any;
    selectedDepartmentType: string = '';
    selectedFCLLCL: string = '';
    filteredPorts: any[] = [];
    filteredPOL: any[] = [];
    filteredPOD: any[] = [];
    filteredFDC: any[] = [];
    TandCDetail : any[] = [];
    filteredTandCDetail : any[] = [];
    TandCDetailLength : number = 0;
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

    portLookupConfig = DROPDOWN_CONFIGS.PORT
    constructor(
        private masterService : MasterService,
        private operationService: OperationService,
        private settingsService: SettingsService,
        private appSettingService : AppSettingsService,
        private route : Router,
        private currentRoute : ActivatedRoute,
        private modalService : NgbModal,
        private fb:FormBuilder,
        private dialog : MatDialog,
        public mps: MenuPermissionService
    ){}

    ngOnInit(){
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        this.mps.init().subscribe();
        this.initTandCForm();
        this.initTandDetailForm();
        this.loadAllFields();
        this.currentRoute.paramMap.subscribe(
            (param)=>{
                this.TermsAndConditionsMasterSid = +param.get('id');
                if(this.TermsAndConditionsMasterSid){
                    this.isEditMode = true;
                    this.loadTermsAndConditions();
                }
            }
        )
    }

    initTandCForm(){
        this.termsAndConditionForm = this.fb.group({
            MenuMasterSid : [,[Validators.required]],
            BranchMasterSid : [,[Validators.required]],
            departmentId : [],
            Carrier : [],
            POL : [],
            POD : [],
            FDC : [],
            status : ['Active'],
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

    initTandDetailForm(){
        this.termsAndConditionDetailForm = this.fb.group({
            TermsAndConditionsMasterSid: [],
            IsDefaut : [false,[Validators.required]],
            TandC: ['',[Validators.required, Validators.maxLength(500)]],
            Type : ['',[Validators.maxLength(20)]],
            TypeValue : ['',[Validators.maxLength(20)]],
            detailstatus : ['Active'], 
        })
    }

    updatePaginationData(){
        let start = (this.page - 1 ) * this.pageSize;
        let end = start + this.pageSize;
        this.filteredTandCDetail = this.TandCDetail.slice(start,end);
    }

    private filterOnlyLeafMenus(menuList: any[]): any[] {
  if (!Array.isArray(menuList)) return [];

  // Collect all parentIds that exist
  const parentIds = new Set(
    menuList
      .map(menu => Number(menu.parentId))
      .filter(parentId => !!parentId)
  );

  // Keep only menus that are NOT parents
  return menuList.filter(
    menu => !parentIds.has(Number(menu.MenuMasterSid))
  );
}
    
    loadAllFields(){
         const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
        forkJoin({
            menus : this.masterService.getAllMenu(),
            ports : this.masterService.getAllPorts(),
            carriers: this.operationService.getCustomerByItsType({ CompanyMasterSid, types: ['carrier' , 'airLine'] }).pipe(catchError(err => of([]))),
            branches : this.masterService.getCurrentBranch(CompanyMasterSid),
            departments : this.masterService.getAllDepartments(CompanyMasterSid)
        }).subscribe(({menus,ports,carriers,branches,departments})=>{
            this.menuList = this.filterOnlyLeafMenus(menus),
            this.portList = ports.data,
            this.filteredPorts = [...this.portList],
            this.filteredPOL = [...this.portList],
            this.filteredPOD = [...this.portList],
            this.filteredFDC = [...this.portList],
            this.carrierList = carriers.data,
            this.branchList = branches,
            this.departmentList = departments;
            if (this.pendingDepartmentSid) {
                this.onDepartmentChange(this.pendingDepartmentSid);
                this.pendingDepartmentSid = null;
            }
        })
    }

    onDepartmentChange(departmentSid: any){
        const selectedDepartmentSid = typeof departmentSid === 'object'
            ? Number(departmentSid?.DepartmentMasterSid ?? departmentSid?.departmentId ?? 0)
            : Number(departmentSid);

        if (!selectedDepartmentSid) {
            this.selectedDepartment = null;
            this.selectedDepartmentType = '';
            this.selectedFCLLCL = '';
            this.filteredPorts = [];
            this.filteredPOL = [];
            this.filteredPOD = [];
            this.filteredFDC = [];
            this.termsAndConditionForm.patchValue({
                POL: [],
                POD: [],
                FDC: []
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
            this.filteredPorts = [];
            this.filteredPOL = [];
            this.filteredPOD = [];
            this.filteredFDC = [];
            this.termsAndConditionForm.patchValue({
                POL: [],
                POD: [],
                FDC: []
            }, { emitEvent: false });
            return;
        }

        this.selectedDepartmentType = String(department?.departmentType || '').toUpperCase();
        this.selectedFCLLCL = this.selectedDepartmentType === 'SEA'
            ? String(department?.FCLLCL || '').toUpperCase()
            : 'AIR';

        this.filteredPorts = this.getFilteredPortsBySegment(this.selectedFCLLCL);
        this.onPortSelectionChange();
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

    onSubmit(){
        if (this.isSaving) return;
        if(this.termsAndConditionForm.invalid){
            this.termsAndConditionForm.markAllAsTouched();
            this.termsAndConditionForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields');
            return;
        }
        this.isSaving = true;
        const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
        const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
        const formValue = this.termsAndConditionForm.value;
        const { departmentId, ...rest } = formValue;
        const masterFormValue = {
        ...rest,
        POL: this.wrapAsArray(rest.POL),
        POD: this.wrapAsArray(rest.POD),
        FDC: this.wrapAsArray(rest.FDC)
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
            status : formValue.status === 'Active' ? 'A' : 'S',
            departmentOnTerms: departmentPayload,
            termsAndConditionsDetail,
            ...(this.isEditMode ? {updatedBy:updatedBy}: {createdBy:createdBy})
        };
        if(this.isEditMode){
            this.masterService.updateTandCById(this.TermsAndConditionsMasterSid,payload).subscribe(
                (resp:any)=>{
                    if(resp.status){
                        this.appSettingService.showSuccess('Terms and Conditions updated successfully');
                        this.loadTermsAndConditions();
                    } else {
                        const backendMessage = resp?.message;
                        this.appSettingService.showError(backendMessage)
                    }
                    this.isSaving = false;
                },
                (error)=>{
                    this.isSaving = false;
                    console.error('Error Updating Terms and Conditions',error);
                }
            )
        } else {
            this.masterService.createNewTandC(payload).subscribe(
                (resp:any)=>{
                    if(resp.status){
                        const createdId = resp?.data?.TermsAndConditionsMasterSid
                            || resp?.data?.termsAndCondition?.TermsAndConditionsMasterSid
                            || resp?.data?.id;
                        if (createdId) {
                            this.appSettingService.showSuccess('New Terms and Conditions created successfully');
                            this.route.navigate(['master/terms-condition/entry', createdId]);
                        } else {
                            this.appSettingService.showSuccess('New Terms and Conditions created successfully');
                            this.route.navigate(['master/terms-condition/list']);
                        }
                    } else {
                        const backendMessage = resp?.message;
                        this.appSettingService.showError(backendMessage)
                    }
                    this.isSaving = false;
                },
                (error)=>{
                    this.isSaving = false;
                    const backendMessage = error?.error?.message || error?.error?.response?.message || error?.message;
                    this.appSettingService.showError(backendMessage)
                    console.error('Error Creating Terms and Conditions',error)
                }
            )
        }
    }
    private wrapAsArray(value: any): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}


    upsertDetailRow(){
        if (this.isDetailSaving) return;
        if(this.termsAndConditionDetailForm.invalid){
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
        this.closeDetailForm();
    }

    startNewDetail(){
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

    editDetail(data ?:any, index?: number){
        this.initTandDetailForm();
        this.isModalEditMode = false;
        this.TermsAndConditionsDetailSid = null;
        this.pendingDetailEditIndex = null;
        if(data){
            this.isModalEditMode = true;
            this.tandCDetailData = data;
            if (typeof index === 'number') {
                this.pendingDetailEditIndex = index;
            }
            this.termsAndConditionDetailForm.patchValue({
                ...data,
                IsDefaut : data.IsDefaut === 'S' ? true : false,
                detailstatus : data.status === 'A' ? 'Active' : 'Suspended'
            })
            if(data.TermsAndConditionsDetailSid){
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

    loadTermsAndConditions(){
        this.masterService.getTandCById(this.TermsAndConditionsMasterSid).subscribe(
            (resp:any)=>{
                if(resp.status){
                    const response = resp.data;
                    this.tandCHeaderData = response;
                    this.termsAndConditionForm.patchValue({
                        ...response,
                        POL: response.POL?.[0] || null,
                        POD: response.POD?.[0] || null,
                        FDC: response.FDC?.[0] || null,
                        departmentId : response.departments[0]?.departmentId || response.departments[0]?.DepartmentMasterSid || '',
                        status : response.status === 'A' ? 'Active':'Suspended'    
                    })
                    this.onDepartmentChange(response.departments[0]?.departmentId || response.departments[0]?.DepartmentMasterSid);
                    this.departmentOnTermsId = response.departments[0]?.DepartmentOnTermSid;
                    this.loadTandCDetails();
                } else {
                    this.appSettingService.showError('Error Loading Terms and Conditions');
                }
            },
            (error)=>{
                console.error('Error Loading Terms and Conditions',error);
            }
        )
    }

    loadTandCDetails(){
        this.masterService.getAllTandCDetail().subscribe(
            (resp:any)=>{
                if(resp.status){
                    const loadedData = resp.data;
                    this.TandCDetail = loadedData.filter(detail => detail.TermsAndConditionsMasterSid === this.TermsAndConditionsMasterSid);
                    this.TandCDetailLength = this.TandCDetail.length;
                    this.totalAmountOfCollections = this.TandCDetailLength;
                    this.updatePaginationData();
                } else {
                    this.appSettingService.showError('Error Loading Terms and Conditions Details')
                }
            },
            (error)=>{
                console.error('Error loading T&C Details',error);
            }
        )
    }

    closeDetailForm(){
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

    resetForm(){
        this.termsAndConditionForm.reset({
            status : 'Active'
        })
        this.selectedDepartment = null;
        this.selectedDepartmentType = '';
        this.selectedFCLLCL = '';
        this.filteredPorts = [];
        this.filteredPOL = [];
        this.filteredPOD = [];
        this.filteredFDC = [];
    }

    navigateToCreate() {
        this.route.navigate(['master/terms-condition/entry']);
    }


    navigateBack() {
        history.back();
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

}
