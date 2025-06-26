import { Component, OnInit, TemplateRef } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalModule, NgbModalRef, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';

@Component({
    selector: 'app-terms-condition-entry',
    standalone: true,
    imports: [
        FeatherModule,
        NgSelectModule,
        ReactiveFormsModule,
        NgbNavModule,
        NgbPaginationModule,
        NgbModalModule,
        CommonModule,
        OnlyTextDirective,
        TextWithNumbersDirective,
        DatePipe,
        PreventMultiClickDirective
    ],
    templateUrl: './terms-condition-entry.component.html',
    styleUrl: './terms-condition-entry.component.scss'
})
export class TermsConditionEntryComponent implements OnInit{

    TermsAndConditionsMasterSid: number;
    departmentOnTermsId : number;
    TermsAndConditionsDetailSid:number;
    isEditMode : boolean;
    isModalEditMode : boolean;
    termsAndConditionForm !:FormGroup;
    termsAndConditionDetailForm !:FormGroup;
    menuList : any[];
    portList : any[];
    carrierList : any[];
    branchList : any[];
    departmentList : any[];
    active = 1;
    TandCDetail : any[];
    filteredTandCDetail : any[];
    TandCDetailLength : number;
    modalRef : NgbModalRef;
    page = 1;
    pageSize = 5;
    totalAmountOfCollections: number;
    tandCHeaderData: any;
    tandCDetailData: any;
    currentMenuId: number;
    TandCList: any;

    constructor(
        private masterService : MasterService,
        private settingsService: SettingsService,
        private appSettingService : AppSettingsService,
        private route : Router,
        private currentRoute : ActivatedRoute,
        private modalService : NgbModal,
        private fb:FormBuilder,
        private dialog : MatDialog
    ){}

    ngOnInit(){
        this.initTandCForm();
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
            departmentId : [,[Validators.required]],
            Carrier : [],
            POL : [],
            POD : [],
            FDC : [],
            status : ['Active'],
        })
    }

    initTandDetailForm(){
        this.termsAndConditionDetailForm = this.fb.group({
            TermsAndConditionsMasterSid: [, [Validators.required]],
            IsDefaut : [false,[Validators.required]],
            TandC: ['',[Validators.required]],
            Type : [''],
            TypeValue : [''],
            detailstatus : ['Active'], 
        })
    }

    updatePaginationData(){
        let start = (this.page - 1 ) * this.pageSize;
        let end = start + this.pageSize;
        this.filteredTandCDetail = this.TandCDetail.slice(start,end);
    }

    loadAllFields(){
        forkJoin({
            menus : this.settingsService.getAllMenu(),
            ports : this.masterService.getAllPorts(),
            carriers : this.masterService.getAllCustomers(),
            branches : this.masterService.getAllBranches(),
            departments : this.masterService.getAllDepartments()
        }).subscribe(({menus,ports,carriers,branches,departments})=>{
            this.menuList = menus,
            this.portList = ports.data,
            this.carrierList = carriers,
            this.branchList = branches,
            this.departmentList = departments
        })
    }

    onSubmit(){
        if(this.termsAndConditionForm.invalid){
            this.termsAndConditionForm.markAllAsTouched();
            this.termsAndConditionForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields');
        }
        else {
            const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
            const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
            const formValue = this.termsAndConditionForm.value;
            const payload = {
                ...formValue,
                status : formValue.status === 'Active' ? 'A' : 'S',
                ...(this.isEditMode ? {updatedBy:updatedBy,DepartmentOnTermSid:this.departmentOnTermsId}: {createdBy:createdBy})
            }
            if(this.isEditMode){
                this.masterService.updateTandCById(this.TermsAndConditionsMasterSid,payload).subscribe(
                    (resp:any)=>{
                        if(resp.status){
                            this.appSettingService.showSuccess('Terms and Conditions updated Successfully');
                            this.route.navigate(['master/terms-condition/list']);
                        } else {
                            this.appSettingService.showError('Error Updating Terms and Conditions')
                        }
                    },
                    (error)=>{
                        console.error('Error Updating Terms and Conditions',error);
                    }
                )
            } else {
                this.masterService.createNewTandC(payload).subscribe(
                    (resp:any)=>{
                        if(resp.status){
                            this.appSettingService.showSuccess('New Terms and Conditions created Successfully');
                            this.route.navigate(['master/terms-condition/list']);
                        } else {
                            this.appSettingService.showError('Error Creating Terms and Conditions');
                        }
                    },
                    (error)=>{
                        console.error('Error Creating Terms and Conditions',error)
                    }
                )
            }
        }
    }

    onModalSubmit(){
        if(this.termsAndConditionDetailForm.invalid){
            this.termsAndConditionDetailForm.markAllAsTouched();
            this.termsAndConditionDetailForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields');
        }
        else {
            const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
            const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
            const formValue = this.termsAndConditionDetailForm.value;
            const payload = {
                TermsAndConditionsMasterSid: this.TermsAndConditionsMasterSid || formValue.TermsAndConditionsMasterSid,
                TandC: formValue.TandC,
                Type: formValue.Type,
                TypeValue: formValue.TypeValue,
                IsDefaut: formValue.IsDefaut ? 'Y' : 'N',
                status: formValue.detailstatus === 'Active' ? 'A' : 'S',
                ...(this.isModalEditMode ? { updatedBy: updatedBy } : { createdBy: createdBy })
            }
            if(this.isModalEditMode){
                this.masterService.updateTandCDetailById(this.TermsAndConditionsDetailSid,payload).subscribe(
                    (resp:any)=>{
                        if(resp.status){
                            this.appSettingService.showSuccess('Terms and Conditions Details updated Successfully');
                            this.loadTandCDetails();
                            this.closeDetailForm();
                        } else {
                            this.appSettingService.showError('Error Updating Terms and Conditions Details')
                        }
                    },
                    (error)=>{
                        console.error('Error Updating Terms and Conditions Details',error);
                    }
                )
            } else {
                this.masterService.createNewTandCDetail(payload).subscribe(
                    (resp:any)=>{
                        if(resp.status){
                            this.appSettingService.showSuccess('New Terms and Conditions Detail created Successfully');
                            this.loadTandCDetails();
                            this.closeDetailForm();
                        } else {
                            this.appSettingService.showError('Error Creating Terms and Conditions Details');
                        }
                    },
                    (error)=>{
                        console.error('Error Creating Terms and Conditions Details',error)
                    }
                )
            }
        }
    }

    openTandCEntryModal(content:TemplateRef<any>,data ?:any){
        this.initTandDetailForm();
        if(data){
            this.isModalEditMode = true;
            this.tandCDetailData = data;
            this.termsAndConditionDetailForm.patchValue({
                ...data,
                IsDefaut : data.IsDefaut === 'Y' ? true : false,
                detailstatus : data.status === 'A' ? 'Active' : 'Suspended'
            })
            if(data.TermsAndConditionsDetailSid){
                this.termsAndConditionDetailForm.get('TermsAndConditionsMasterSid').setValue(data.TermsAndConditionsMasterSid);
                this.TermsAndConditionsDetailSid = data.TermsAndConditionsDetailSid;
            }
        } else {
            this.termsAndConditionDetailForm.get('TermsAndConditionsMasterSid').setValue(this.TermsAndConditionsMasterSid);
        }
        this.modalRef = this.modalService.open(content , {size:'lg',centered:true});
    }

    deleteTandCDetail(TermsAndConditionsDetailSid) {
        const modalRef = this.dialog.open(DeleteWarningComponent);
        modalRef.afterClosed().subscribe(
            (res) => {
                if (res) {
                    this.masterService.deleteTandCDetailById(TermsAndConditionsDetailSid).subscribe(
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
                        departmentId : response.departments[0]?.departmentId || '',
                        status : response.status === 'A' ? 'Active':'Suspended'    
                    })
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
        this.modalRef.close();
        this.isModalEditMode = false;
        this.termsAndConditionDetailForm.reset();
    }

    resetForm(){
        this.termsAndConditionForm.reset({
            status : 'Active'
        })
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

    openTandC() {
		this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
		const payload = { MenuMasterSid: this.currentMenuId };
		this.masterService.getTandCByCondition(payload).subscribe(
			(resp: any) => {
				if (resp.status) {
					this.TandCList = resp.data;
					const modalRef = this.modalService.open(TermsAndConditionsComponent, {
						size: 'lg',
						backdrop: 'static',
						centered: true
					});
					modalRef.componentInstance.terms = this.TandCList;
					modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
					modalRef.componentInstance.DocumentSid = this.TermsAndConditionsMasterSid;

				} else {
					this.appSettingService.showError('Error loading Terms and Conditions');
				}
			},
			(error) => {
				this.appSettingService.showError('Error loading Terms and Conditions', error);
			}
		);
	}

}
