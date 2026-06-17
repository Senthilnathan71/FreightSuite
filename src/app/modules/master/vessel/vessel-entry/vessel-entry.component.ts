import { Component, HostListener, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vessel } from 'src/app/modules/crm-mobile/Interfaces/vessel.interface';
import { CommonModule, DatePipe } from '@angular/common';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { NgbDropdownModule, NgbModal,NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { Subject, takeUntil } from 'rxjs';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

@Component({
    selector: 'app-vessel-entry',
    standalone: true,
    imports: [
        FeatherModule,
        ReactiveFormsModule,
        CommonModule,
        OnlyNumbersDirective,
        OnlyTextDirective,
        TextWithNumbersDirective,
        DatePipe,
        NgSelectModule,
        NgbDropdownModule,
        ElementStateGuardDirective,
        FormStateGuardDirective
    ],
    templateUrl: './vessel-entry.component.html',
    styleUrl: './vessel-entry.component.scss'
})
export class VesselEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {

    vesselForm !: FormGroup;
    VesselMasterSid: number;
    isEditMode: boolean;
    vesselData: any;
    userData:any;
    permissions: string[] = [];
    currentMenuPermissions: any = {};
    vesselTypes = [
        "Container", "Tank", "Bulk", "General"
    ]
    currentMenuId: number;
    currentCompany: any;
    currentBranch: any;
    MenuMasterSid: any;
    TandCList: any;
    auditLogs: any[] = []; // Stores audit logs
    auditLogModalRef!: NgbModalRef;
    isDirty: boolean = false;
    isSaving: boolean = false;
    private initialFormValue: any = null;
    private destroy$ = new Subject<void>();
    constructor(
         public mps : MenuPermissionService, 
        private masterServ: MasterService,
        private appSettingService: AppSettingsService,
        private currRoute: ActivatedRoute,
        private fb: FormBuilder,
        private route: Router,
        private modalService : NgbModal,
        private commonService: CommonService,

    ) { }

    ngOnInit() {
        this.mps.init().subscribe();
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
        this.mps.init().subscribe();
        this.initForm();
        this.subscribeToFormChanges();
        this.initialFormValue = this.vesselForm.getRawValue();

        this.currRoute.paramMap.subscribe(
            (param) => {
                this.VesselMasterSid = +param.get('id');
                if (this.VesselMasterSid) {
                    this.isEditMode = true;
                    this.loadVessel();
                }
            }
        )

    //      this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    
    //   }
    // });
     const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
    
		}
    }

   

        

            hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc','Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

    initForm() {
        this.vesselForm = this.fb.group({
            VesselName: ['', [Validators.required, Validators.maxLength(100)]],
            VesselShortCode: ['', [Validators.required, Validators.maxLength(5)]],
            IMOCode: ['', [Validators.required, Validators.maxLength(10)]],
            CallSignIn: ['', [Validators.required, Validators.maxLength(10)]],
            YearofBuilt: ['', [Validators.required]],
            MMSINo: ['', [Validators.required]],
            GRT: ['', [Validators.required]],
            NRT: ['', [Validators.required]],
            VesselType: ['', [Validators.required, Validators.maxLength(10)]],
            VesselOperator: ['', [Validators.required, Validators.maxLength(100)]],
            LengthinMtr: ['', [Validators.required]],
            BreadthinMtr: ['', [Validators.required]],
            Remarks: [''],
            status: ['Active']
        })
    }

    loadVessel() {
        this.masterServ.loadVesselById(this.VesselMasterSid).subscribe(
            (vesselData: Vessel) => {
                this.vesselData = vesselData;
                this.vesselForm.patchValue({
                    ...vesselData,
                    status: vesselData.status === 'A' ? "Active" : "Suspended"
                });
                this.initialFormValue = this.vesselForm.getRawValue();
                this.isDirty = false;
            },
            (error) => {
                this.appSettingService.showError(`Error Loading Vessel `, error)
            }
        )
    }

    navigateBack() {
        history.back();
    }

    onSave(resolve?: (value: boolean) => void) {
        if (this.isSaving) {
            resolve?.(false);
            return;
        }

        const raw = this.vesselForm.getRawValue();
        if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
            this.appSettingService.showWarning('No changes to save');
            this.vesselForm.markAsUntouched();
            resolve?.(false);
            return;
        }

        if (this.vesselForm.invalid) {
            this.vesselForm.markAllAsTouched();
            this.vesselForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill out all the required fields');
            resolve?.(false);
            return;
        } else {
            const formValue = this.vesselForm.value;
            const payload = this.coerceIntoRequiredFormat(formValue);
            this.isSaving = true;


            if (this.isEditMode) {
                this.masterServ.updateVesselById(this.VesselMasterSid, payload).subscribe(
                    (resp: any) => {
                        this.isSaving = false;
                        if (resp.status) {
                            this.appSettingService.showSuccess(resp.message);
                            this.isDirty = false;
                            this.initialFormValue = this.vesselForm.getRawValue();
                            resolve?.(true);
                            this.route.navigate(['/master/vessel/list']);
                        } else {
                            resolve?.(false);
                            this.appSettingService.showError(resp.message)
                        }
                    },
                    (error) => {
                        this.isSaving = false;
                        resolve?.(false);
                        console.error('Error updating Vessel', error);
                    }
                )
            } else {
                this.masterServ.createVessel(payload).subscribe(
                    (resp: any) => {
                        this.isSaving = false;
                        if (resp.status) {
                            this.appSettingService.showSuccess(resp.message);
                            this.isDirty = false;
                            this.initialFormValue = this.vesselForm.getRawValue();
                            resolve?.(true);
                            this.route.navigate(['/master/vessel/list']);
                        } else {
                            resolve?.(false);
                            this.appSettingService.showError(resp.message)
                        }
                    },
                    (error) => {
                        this.isSaving = false;
                        resolve?.(false);
                        console.error('Error Creating Vessel', error);
                    }
                )
            }
        }
    }

    coerceIntoRequiredFormat(formValue: Vessel) {
        const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
        const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
        return this.isEditMode ? {
            ...formValue,
            YearofBuilt: Number(formValue.YearofBuilt),
            MMSINo: Number(formValue.MMSINo),
            GRT: Number(formValue.GRT),
            NRT: Number(formValue.NRT),
            LengthinMtr: Number(formValue.LengthinMtr),
            BreadthinMtr: Number(formValue.BreadthinMtr),
            status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
            updatedBy: updatedBy
        } : {
            ...formValue,
            YearofBuilt: Number(formValue.YearofBuilt),
            MMSINo: Number(formValue.MMSINo),
            GRT: Number(formValue.GRT),
            NRT: Number(formValue.NRT),
            LengthinMtr: Number(formValue.LengthinMtr),
            BreadthinMtr: Number(formValue.BreadthinMtr),
            status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
            createdBy: createdBy
        }
    }

    showInfo() {
        if (!this.vesselData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.vesselData;
        modalRef.componentInstance.idLabel = 'Vessel Id';
        modalRef.componentInstance.idValue = this.vesselData?.VesselMasterSid;
    }

    // openTandC() {
	// 	this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
	// 	const payload = { MenuMasterSid: this.currentMenuId };
	// 	this.masterServ.getTandCByCondition(payload).subscribe(
	// 		(resp: any) => {
	// 			if (resp.status) {
	// 				this.TandCList = resp.data;
	// 				const modalRef = this.modalService.open(TermsAndConditionsComponent, {
	// 					size: 'lg',
	// 					backdrop: 'static',
	// 					centered: true
	// 				});
	// 				modalRef.componentInstance.terms = this.TandCList;
	// 				modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
	// 				modalRef.componentInstance.DocumentSid = this.VesselMasterSid;

	// 			} else {
	// 				this.appSettingService.showError('Error loading Terms and Conditions');
	// 			}
	// 		},
	// 		(error) => {
	// 			this.appSettingService.showError('Error loading Terms and Conditions', error);
	// 		}
	// 	);
	// }


    openEmail() {
        if (!this.vesselData) return;
        const modalRef = this.modalService.open(EmailEntryComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });
    }

  openAuthority() {
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
   const modalRef = this.modalService.open(AuthorityLogComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.VesselMasterSid;
  }

openEDoc() {
  if (!this.vesselData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.vesselData;
  modalRef.componentInstance.idLabel = 'Vessel Id';
  modalRef.componentInstance.idValue = this.vesselData?.VesselMasterSid;
const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.VesselMasterSid
  }

      this.commonService.documentData.set(data)
}

openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.VesselMasterSid;
  }
ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.commonService.clearDocumentData()
 }

// reset() {
//   this.vesselForm.reset({
//     status: 'Active' 
//   });
// }

reset() {
  // If editing an existing vessel, reload it (restore original state)
  if (this.isEditMode && this.VesselMasterSid) {
    this.loadVessel();
    return;
  }

  // Create-mode: reset form to sensible defaults
  this.vesselForm.reset({
    VesselName: '',
    VesselShortCode: '',
    IMOCode: '',
    CallSignIn: '',
    YearofBuilt: null,    // Use null for numeric fields
    MMSINo: null,         // Use null for numeric fields
    GRT: null,            // Use null for numeric fields
    NRT: null,            // Use null for numeric fields
    VesselType: '',
    VesselOperator: '',
    LengthinMtr: null,    // Use null for numeric fields
    BreadthinMtr: null,   // Use null for numeric fields
    Remarks: '',
    status: 'Active'
  });


  // Reset any additional state variables if needed
  this.vesselData = null;
  this.initialFormValue = this.vesselForm.getRawValue();
  this.isDirty = false;
}


openFollowup(){
        const modalRef = this.modalService.open(FollowUpComponent,{
            size : 'lg',
            backdrop : 'static',
            centered : true
        })
    }
    openAuditLogs() {
          if (!this.vesselData?.VesselMasterSid) return;
          const modalRef = this.modalService.open(AuditLogComponent, {
            centered: true,
            scrollable: true,
            size: 'xl',
            windowClass: 'audit-log-modal'
          });
          modalRef.componentInstance.title = 'Vessel Logs';
          modalRef.componentInstance.tableName = 'VesselMaster';
          modalRef.componentInstance.recordId = this.vesselData?.VesselMasterSid.toString();
          modalRef.componentInstance.screenName = 'Vessel';
        }
navigateToCreateVessel() {
    this.route.navigate(['master/vessel/entry'])
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
      this.onSave(resolve);
    });
  }

  private subscribeToFormChanges(): void {
    this.vesselForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(this.initialFormValue, this.vesselForm.getRawValue());
      });
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) {
      return Number(value);
    }

    if (typeof value === 'number') {
      return Number(value.toFixed(6));
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.normalizeValue(v));
    }

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
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }

}
