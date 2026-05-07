import { Component, HostListener, OnDestroy, OnInit ,TemplateRef} from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule, DatePipe } from '@angular/common';
import { NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
    selector: 'app-imco-entry',
    standalone: true,
    imports: [FeatherModule, OnlyTextDirective, OnlyNumbersDirective, TextWithNumbersDirective, NgSelectModule, ReactiveFormsModule,DatePipe,PreventMultiClickDirective,CommonModule,NgbDropdownModule],
    templateUrl: './imco-entry.component.html',
    styleUrl: './imco-entry.component.scss'
})
export class ImcoEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {

    ImcoMasterSid: number;
    isEditMode: boolean;
    ImcoForm: FormGroup;
    imcoData: any;
    btnDisable: boolean = true; 

    modeOfStatus = [
        { value: 'Active', name: 'Active' },
        { value: 'Suspended', name: 'Suspended' },
    ]

    // Pagination Variables
    page = 1;
    pageSize = 10;
    totalAmountofCollection: number;
    currentMenuId: number;
    TandCList: any;
    userData:any;
    currentCompany: any;
    currentBranch: any;
    MenuMasterSid: any;
    permissions: string[] = [];
    currentMenuPermissions: any = {};
    auditLogs: any[] = []; // Stores audit logs
    auditLogModalRef!: NgbModalRef;
    isDirty: boolean = false;
    isSaving: boolean = false;
    private initialFormValue: any = null;
    private destroy$ = new Subject<void>();
    constructor(
        private masterService: MasterService,
        private fb: FormBuilder,
        private route: Router,
        private currRoute: ActivatedRoute,
        private appSettingService: AppSettingsService,
        private modalService : NgbModal,
        private commonService: CommonService,
        public mps : MenuPermissionService,
        private ngbModal: NgbModal,
    ) { }

    ngOnInit() {
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
      this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');  
        this.initImcoForm();
        this.subscribeToFormChanges();
        this.mps.init().subscribe();
        this.currRoute.paramMap.subscribe(
            (param) => {
                this.ImcoMasterSid = +param.get('id');
                if (this.ImcoMasterSid) {
                    this.isEditMode = true;
                    this.loadImco(this.ImcoMasterSid);
                } else {
                    this.initialFormValue = this.ImcoForm.getRawValue();
                    this.isDirty = false;
                }
            }
        )
//          this.appSettingService.getUser().subscribe(user => {
//     if (user) {
//       this.userData = user;
//       
//     }
//   });
const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
    
		}
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
      this.ImcoForm.valueChanges
        .pipe(takeUntil(this.destroy$), debounceTime(300))
        .subscribe(() => {
          if (this.initialFormValue === null) return;
          this.isDirty = !this.deepEqual(this.initialFormValue, this.ImcoForm.getRawValue());
        });
    }

    private normalizeValue(value: any): any {
      if (value === null || value === undefined) return null;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== '' && !isNaN(+trimmed)) return Number(trimmed);
        return trimmed;
      }
      if (typeof value === 'number') return Number(value.toFixed(6));
      if (Array.isArray(value)) return value.map(v => this.normalizeValue(v));
      if (typeof value === 'object') {
        return Object.keys(value)
          .sort()
          .reduce((acc: any, key: string) => {
            acc[key] = this.normalizeValue(value[key]);
            return acc;
          }, {});
      }
      return value;
    }

    private deepEqual(obj1: any, obj2: any): boolean {
      return JSON.stringify(this.normalizeValue(obj1)) === JSON.stringify(this.normalizeValue(obj2));
    }

      
hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Authority', 'Email', 'Document Reference'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

    initImcoForm() {
        this.ImcoForm = this.fb.group({
            ImcoClass: ['', [Validators.required]],
            ImcoName: ['', [Validators.required]],
            Description: ['', [Validators.required]],
            ImcoUn: [],
            ImcoPageNo: [],
            PackingGroup: [''],
            status: ['Active', [Validators.required]],
            Remarks: ['']
        })
            this.ImcoForm.statusChanges.subscribe(status => {
            this.btnDisable = status !== 'VALID';
        });
    }

    onSubmit(resolve?: (saved: boolean) => void) {
        if (this.isSaving) return;
        if (this.ImcoForm.invalid) {
            this.ImcoForm.markAllAsTouched();
            this.ImcoForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields');
            if (resolve) resolve(false);
            return;
        } else {
            const raw = this.ImcoForm.getRawValue();
            if (this.isEditMode && this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
                this.appSettingService.showWarning('No changes to save');
                this.ImcoForm.markAsUntouched();
                if (resolve) resolve(false);
                return;
            }

            this.isSaving = true;
            const formValue = this.ImcoForm.value;
            const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
            const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
            const payload = {
                ...formValue,
                status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
                ImcoUn: parseFloat(formValue.ImcoUn),
                ImcoPageNo: parseFloat(formValue.ImcoPageNo),
                ...(this.isEditMode ? { updatedBy: updatedBy } : { createdBy: createdBy })
            }

            if (this.isEditMode) {
                this.masterService.updateIMCOById(this.ImcoMasterSid, payload).subscribe(
                    (resp: any) => {
                        this.isSaving = false;
                        if (resp.status) {
                            this.appSettingService.showSuccess(resp.message);
                            this.isDirty = false;
                            this.initialFormValue = raw;
                            if (resolve) resolve(true);
                            this.route.navigate(['/master/imco/list']);
                        } else {
                            this.appSettingService.showError(resp.message);
                            if (resolve) resolve(false);
                        }
                    },
                    (error) => {
                        this.isSaving = false;
                        console.error('Error Updating Imco', error);
                        if (resolve) resolve(false);
                    }
                )
            } else {
                this.masterService.createNewIMCO(payload).subscribe(
                    (resp: any) => {
                        this.isSaving = false;
                        if (resp.status) {
                            this.appSettingService.showSuccess(resp.message);
                            this.isDirty = false;
                            this.initialFormValue = this.ImcoForm.getRawValue();
                            if (resolve) resolve(true);
                            this.route.navigate(['/master/imco/list']);
                        } else {
                            this.appSettingService.showError(resp.message);
                            if (resolve) resolve(false);
                        }
                    },
                    (error) => {
                        this.isSaving = false;
                        console.error('Error Creating Imco', error);
                        if (resolve) resolve(false);
                    }
                )
            }

        }
    }

    loadImco(ImcoMasterSid) {
        this.masterService.getIMCOById(ImcoMasterSid).subscribe(
            (resp: any) => {
                if (resp.status) {
                    this.imcoData = resp.data;
                    this.ImcoForm.patchValue({
                        ...resp.data,
                        status: resp.data.status === 'A' ? 'Active' : 'Suspended',
                    });
                    this.initialFormValue = this.ImcoForm.getRawValue();
                    this.isDirty = false;
                }
            },
            (error) => {
                this.appSettingService.showError('Error Loading Imco');
                console.error('Error Loading Imco', error);
            }
        )
    }

    goBack() {
        history.back();
    }

//     resetForm() {
//     this.ImcoForm.reset({
//     ImcoClass: '',
//     ImcoName: '',
//     Description: '',
//     ImcoUn: null,
//     ImcoPageNo: null,
//     PackingGroup: '',
//     status: 'Active',  
//     Remarks: ''
//   });
//     }

resetForm() {
  // If editing an existing IMCO, reload it (restore original state)
  if (this.isEditMode && this.ImcoMasterSid) {
    this.loadImco(this.ImcoMasterSid);
    return;
  }

  // Create-mode: reset form to sensible defaults
  this.ImcoForm.reset({
    ImcoClass: '',
    ImcoName: '',
    Description: '',
    ImcoUn: null,
    ImcoPageNo: null,
    PackingGroup: '',
    status: 'Active',
    Remarks: ''
  });

  // Clear any loaded data for new entries
  this.imcoData = null;
  this.ImcoMasterSid = null;
}

    showInfo() {
        if (!this.imcoData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.imcoData;
        modalRef.componentInstance.idLabel = 'Imco Id';
        modalRef.componentInstance.idValue = this.imcoData?.ImcoMasterSid;
    }

    // openTandC() {
	// 	this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
	// 	const payload = { MenuMasterSid: this.currentMenuId };
	// 	this.masterService.getTandCByCondition(payload).subscribe(
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
	// 				modalRef.componentInstance.DocumentSid = this.ImcoMasterSid;

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
        if (!this.imcoData) return;
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
    modalRef.componentInstance.documentSid = this.ImcoMasterSid;
  }

openEDoc() {
  if (!this.imcoData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.imcoData;
  modalRef.componentInstance.idLabel = 'Imco Id';
  modalRef.componentInstance.idValue = this.imcoData?.ImcoMasterSid;
  const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.ImcoMasterSid
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
    modalRef.componentInstance.DocumentSid = this.ImcoMasterSid;
  }

 openFollowup() {
    if (!this.imcoData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.imcoData?.UserMasterSid;
    modalRef.componentInstance.parentEmail = this.imcoData;
  //   modalRef.componentInstance.parentSubject = `Quotation No.${this.userData} Date:${new Date(this.userData).toLocaleDateString()}`;
    modalRef.componentInstance.parentMailbody = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
    <p>Dear Sir/Madam,</p>
    <p>Please find enclosed the quotation as requested.</p>
    <p>Kindly review the details at your convenience.</p>
    <p>Looking forward to your feedback and the opportunity to work together.</p>
    <p>
      Approval Hyperlink: 
      <a href="https://xxxxxxxxx" target="_blank" style="color: #1a73e8;">Click here to approve</a>
    </p>
    <p>Best Regards,</p>
    <p>${this.userData['userEmail']}</p>
    </div>
  `;
  
  // Optionally, pass the quotation HTML content ID for PDF generation
  modalRef.componentInstance.pdfContentId = 'quotationContent';
  }
 ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.commonService.clearDocumentData()
 }


//  openAuditLogs(modal: TemplateRef<any>) {
//   if (!this.ImcoMasterSid) return;

//   this.masterService.getAuditLogs('ImcoMaster', this.ImcoMasterSid.toString()).subscribe({
//     next: (logs: any[]) => {
//       const formatFields = (val: any) => {
//         if (!val) return ['NA'];
//         const obj = typeof val === 'string' ? JSON.parse(val) : val;
//         delete obj.updatedOn; // Remove updatedOn field
//         // If no fields exist after deleting updatedOn
//         if (Object.keys(obj).length === 0) return ['NA'];
//         return Object.entries(obj).map(
//           ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
//         );
//       };

//       this.auditLogs = logs.map(log => ({
//         ...log,
//         oldValDisplay: formatFields(log.oldVal),
//         newValDisplay: formatFields(log.newVal)
//       }));

//       this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
//     },
//     error: err => console.error('Error fetching audit logs:', err)
//   });
// }

openAuditLogs(modal: TemplateRef<any>) {
  if (!this.ImcoMasterSid) return;

  this.masterService.getAuditLogs(
    'ImcoMaster',
    this.ImcoMasterSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['updatedOn','updatedBy']; // ✅ add more if needed later

      const formatFields = (val: any) => {
        if (!val) return [];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        if (Object.keys(obj).length === 0) return [];
        return Object.entries(obj)
          .filter(([key]) => !ignoredFields.includes(key)) // 🚫 exclude fields
          .map(([key, value]) => `${key}: ${value ?? 'NA'}`);
      };

      this.auditLogs = logs
        .map(log => ({
          ...log,
          oldValDisplay: formatFields(log.oldVal),
          newValDisplay: formatFields(log.newVal),
        }))
        .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);

      this.auditLogModalRef = this.modalService.open(modal, {
        centered: true,
        scrollable: true,
        windowClass: 'audit-log-modal'
      });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
}

}
