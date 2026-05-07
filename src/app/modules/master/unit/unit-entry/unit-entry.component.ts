import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy, TemplateRef } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { ContainerType } from 'src/app/modules/crm-mobile/Interfaces/container-type.interface';
import { Unit } from 'src/app/modules/crm-mobile/Interfaces/unit.interface';
import { NgbDropdownModule, NgbModal ,NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
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


@Component({
  selector: 'app-unit-entry',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    OnlyTextDirective,
    TextWithNumbersDirective,
    DatePipe,
    NgbDropdownModule
  ],
  templateUrl: './unit-entry.component.html',
  styleUrls: ['./unit-entry.component.scss']
})
export class UnitEntryComponent implements HasUnsavedChanges, OnDestroy {
  unitForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  isDirty = false;
  isSaving = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();
  containerTypes: ContainerType[] = [];
  idParam: number;
  errorMessage: string;
  unitData: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  jobType = [
    { id: 'FCL', name: 'FCL' },
    { id: 'LCL', name: 'LCL' },
    { id: 'Air', name: 'Air' }
  ];

  measurementType = [
    { id: 'Dimension', name: 'Dimension' },
    { id: 'Volume', name: 'Volume' },
    { id: 'Weight', name: 'Weight' },
    { id: 'Number', name: 'Number' }
  ];
  
  statusOptions = [
    { value: 'A', name: 'Active' },
    { value: 'S', name: 'Suspended' }
  ];
  currentMenuId: number;
  TandCList: any;
   userData: any;
   currentCompany: any;
   currentBranch: any;
   MenuMasterSid: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  constructor(
    public mps : MenuPermissionService, 
    private config: NgSelectConfig, 
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router, 
    private appSettingService: AppSettingsService, 
    private masterService: MasterService,
    private modalService: NgbModal,
    private commonService: CommonService,
  ) {
    this.config.notFoundText = 'No items found';
    this.config.appendTo = 'body';
    this.config.bindValue = 'ContainerTypeMasterSid';
    this.config.bindLabel = 'ContainerName';
    this.initializeForm();
  }

  ngOnInit() {

  //        this.appSettingService.getUser().subscribe(user => {
  //   if(user) {
  //     this.userData = user;
 
  //   }
  // });
   this.mps.init().subscribe();
  this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
  this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch')); 
  this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
  const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
		}
    this.loadContainerTypes();
    
     this.unitForm.statusChanges.subscribe(status => {
    this.btnDisable = status !== 'VALID';
  });

    this.subscribeToFormChanges();
    this.route.paramMap.subscribe(params => {
      this.idParam = Number(params.get('id'));
      if (this.idParam) {
        this.isEditMode = true;
        this.loadUnit(this.idParam);
        this.unitForm.get('status')?.enable();
      } else {
        this.unitForm.get('status')?.disable();
        this.captureInitialFormValue();
      }
    });
  }

  loadContainerTypes() {
    this.masterService.getAllContainerTypes().subscribe({
      next: (resp: any) => {
        this.containerTypes = resp.data || resp;
      },
      error: (error) => {
        console.error('Error loading container types:', error);
        this.appSettingService.showError('Failed to load container types');
      }
    });
  }


  
  


hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }
  initializeForm() {
    this.unitForm = this.fb.group({
      unitName: ['', [Validators.required, Validators.maxLength(100)]],
      unitCode: ['', [Validators.required, Validators.maxLength(4)]],
      jobType: [''],
      measurementType: [''],
      containerType: [''],
      status: ['A', [Validators.required]],
      Remarks: ['']
    });
  }

  loadUnit(UnitMasterSid: number): void {
    this.masterService.getUnitById(UnitMasterSid).subscribe({
      next: (unit: Unit) => {
        this.unitData = unit;
        this.unitForm.patchValue({
          unitName: unit.unitName,
          unitCode: unit.unitCode,
          jobType: unit.jobType,
          measurementType: unit.measurementType,
          containerType: unit.containerType,
          status: unit.status,
          Remarks: unit.Remarks
        });
        this.captureInitialFormValue();
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.appSettingService.showError('Failed to load unit data');
      }
    });
  }

  // reset() {
  //   this.unitForm.reset({
  //     jobType: 'FCL',
  //     measurementType: 'Dimension',
  //     status: 'A'
  //   });
  //   if (!this.isEditMode) {
  //     this.unitForm.get('status')?.disable();
  //   }
  // }

  reset() {
  // If editing an existing unit, reload it (restore original state)
  if (this.isEditMode && this.idParam) {
    this.loadUnit(this.idParam);
    return;
  }

  // Create-mode: reset form to sensible defaults
  this.unitForm.reset({
    unitName: '',
    unitCode: '',
    jobType: 'FCL',
    measurementType: 'Dimension',
    containerType: null,
    status: 'A',
    Remarks: ''
  });

  // Disable status field for new records
  this.unitForm.get('status')?.disable();

  // Clear error message
  this.errorMessage = '';

  // Reset any additional state variables if needed
  this.unitData = null;
}

  goBack() {
    this.router.navigate(['master/unit/list']);
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
    this.unitForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        if (!this.initialFormValue) return;
        this.isDirty = !this.deepEqual(this.initialFormValue, this.unitForm.getRawValue());
      });
  }

  private captureInitialFormValue(): void {
    this.initialFormValue = this.unitForm.getRawValue();
    this.isDirty = false;
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) return Number(value);
    if (typeof value === 'number') return Number(value.toFixed(6));
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

  onSubmit(resolve?: (value: boolean) => void) {
    const raw = this.unitForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.unitForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    if (this.unitForm.invalid) {
      this.unitForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      if (resolve) resolve(false);
      return;
    }

    const formValue = this.unitForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    
    // Prepare payload based on create/update
    const payload = {
      ...formValue,
      createdBy: this.isEditMode ? undefined : userEmail,
      updatedBy: this.isEditMode ? userEmail : undefined
    };

    // Handle status for new records
    if (!this.isEditMode) {
      payload.status = 'A'; // Default status for new records
    }

    const apiCall = this.isEditMode 
      ? this.masterService.updateUnitById(this.idParam, payload)
      : this.masterService.createUnit(payload);

    this.btnDisable = true;
    this.isSaving = true;
    apiCall.subscribe({
      next: (resp: any) => {
        this.btnDisable = false;
        this.isSaving = false;
        if (resp.status) {
          this.isDirty = false;
          this.captureInitialFormValue();
          this.appSettingService.showSuccess(resp.message);
          if (resolve) resolve(true);
          this.router.navigate(['master/unit/list']);
        } else {
          if (resolve) resolve(false);
          this.appSettingService.showError(resp.message);
        }
      },
      error: (error) => {
        this.btnDisable = false;
        this.isSaving = false;
        this.errorMessage = error.message;
        this.appSettingService.showError('Operation failed');
        if (resolve) resolve(false);
      }
    });
  }

  showInfo() {
    if (!this.unitData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.unitData;
    modalRef.componentInstance.idLabel = 'Unit Id';
    modalRef.componentInstance.idValue = this.unitData?.UnitMasterSid;
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
	// 				modalRef.componentInstance.DocumentSid = this.idParam;

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
    if (!this.unitData) return;
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
    modalRef.componentInstance.documentSid = this.idParam;
  }

openEDoc() {
  if (!this.unitData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.unitData;
  modalRef.componentInstance.idLabel = 'Unit Id';
  modalRef.componentInstance.idValue = this.unitData?.UnitMasterSid;
 const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.idParam
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
    modalRef.componentInstance.DocumentSid = this.idParam;
  }
 ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.commonService.clearDocumentData()
 }
//  openAuditLogs(modal: TemplateRef<any>) {
//   if (!this.idParam) return;

//   this.masterService.getAuditLogs('UnitMaster', this.idParam.toString()).subscribe({
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

   openFollowup(){
        const modalRef = this.modalService.open(FollowUpComponent,{
            size : 'lg',
            backdrop : 'static',
            centered : true
        })
    }

openAuditLogs(modal: TemplateRef<any>) {
  if (!this.idParam) return;

  this.masterService.getAuditLogs(
    'UnitMaster',
    this.idParam.toString()
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
 navigateToCreateUnit() {
    this.router.navigate(['master/unit/entry']);
  }
}
