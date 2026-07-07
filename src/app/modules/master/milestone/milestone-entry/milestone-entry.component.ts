import { Component, HostListener, OnDestroy, OnInit,TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { NgbDropdownModule, NgbModal,NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { CommonService } from 'src/app/common/common.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

@Component({
  selector: 'app-milestone-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule,
    DatePipe,
    PreventMultiClickDirective,
    NgbDropdownModule,
    SearchableDropdown,
    MultiSelectComponent,
    ElementStateGuardDirective,
    FormStateGuardDirective
  ],
  templateUrl: './milestone-entry.component.html',
  styleUrls: ['./milestone-entry.component.scss']
})
export class MilestoneEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  milestoneForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  milestoneId: number;
  departmentList: any[] = [];
  departmentOptions: any[] = [];
  selectedDepartments: any[] = [];
  companyList: any[] = [];
  userData: any;
  milestoneData : any
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  shipmentTypeOptions = [
    { value: 'Export', label: 'Export' },
    { value: 'Import', label: 'Import' },
    { value: 'Transshipment', label: 'Transshipment' }
  ];

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'Suspended' }
  ];
  currentMenuId: any;
  TandCList: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  currentCompany:any;
  currentBranch:any;
  MenuMasterSid: any;
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private modalService : NgbModal,
    private commonService: CommonService,
    public mps: MenuPermissionService,
    private ngbModal: NgbModal,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
     this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
     this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    // this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    // Load departments after setting current company
  console.log('Current Company:', this.currentCompany);
  console.log('CompanyMasterSid:', this.currentCompany?.CompanyMasterSid);
  this.getAllDepartments();
  this.getAllCompanies();
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
		}
    this.mps.init().subscribe();
    // Pre-select the active company for a new milestone; edit mode overwrites
    // this with the record's company in getMilestoneById().
    if (this.currentCompany?.CompanyMasterSid) {
      this.milestoneForm.get('CompanyMasterSids')?.setValue([Number(this.currentCompany.CompanyMasterSid)]);
    }
    this.initialFormValue = this.milestoneForm.getRawValue();
    this.subscribeToFormChanges();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.milestoneId = +params['id'];
        this.isEditMode = true;
        this.getMilestoneById(this.milestoneId);
        this.milestoneForm.get('status')?.enable();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.milestoneForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(this.initialFormValue, this.milestoneForm.getRawValue());
      });
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) return Number(value);
    if (typeof value === 'number') return Number(value.toFixed(6));
    if (Array.isArray(value)) return value.map(v => this.normalizeValue(v));
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


hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  initForm() {
    this.milestoneForm = this.fb.group({
      MilestoneName: ['', [Validators.required, Validators.maxLength(30)]],
      MilestoneCode: ['', [Validators.required, Validators.maxLength(30)]],
      CompanyMasterSids: [[], Validators.required],
      DepartmentMasterSid: [[], Validators.required],
      ShipmentType: ['', Validators.required],
      SortBy: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      AutoCapture: ['N'],
      AutomailRequire: ['N'],
      status: [{value: 'A', disabled: true}, Validators.required],
      Remarks: ['', Validators.maxLength(500)],
    //   CompanyMasterSid: [null],
    // BranchMasterSid: [null]
    });
  }

 getAllDepartments() {
  
  const companyMastersID = this.currentCompany?.CompanyMasterSid;
  
  if (!companyMastersID) {
    console.error('Company ID not found');
    this.appSettingService.showError('Company information not available');
    return;
  }

  this.masterService.getAllDepartments(companyMastersID).subscribe(
    (resp: any) => {
      
      if (Array.isArray(resp)) {
        this.departmentList = resp;
      } else if (resp && resp.data) {
        this.departmentList = resp.data;
      } else {
        console.warn('Unexpected departments response format:', resp);
        this.departmentList = [];
      }
    },
    (error) => {
      console.error('Error loading departments:', error);
      this.appSettingService.showError('Failed to load departments');
      this.departmentList = [];
    }
  );
}

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe({
      next: (resp: any) => {
        const list = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
        this.companyList = list
          .map((c: any) => ({
            CompanyMasterSid: Number(c.CompanyMasterSid),
            companyName: c.companyName || c.CompanyName || `Company ${c.CompanyMasterSid}`
          }))
          .filter((c: any) => !!c.CompanyMasterSid);
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.companyList = [];
      }
    });
  }

  getMilestoneById(id: number) {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const payload = {
      CompanyMasterSid: CompanyMasterSid,
      BranchMasterSid: BranchMasterSid,
      MilestoneMasterSid: id
    }
    this.milestoneForm.reset();
    this.masterService.getMilestoneById(payload).subscribe({
      next: (milestone: any) => {
        if (!milestone.status) {
      this.appSettingService.showError(milestone.message || 'Access denied.');
      return;
    }
        this.milestoneData = milestone;
        this.milestoneForm.patchValue({
          MilestoneName: milestone.MilestoneName,
          MilestoneCode: milestone.MilestoneCode,
          CompanyMasterSids: Array.isArray(milestone.CompanyMasterSids) && milestone.CompanyMasterSids.length
            ? milestone.CompanyMasterSids.map((id: any) => Number(id))
            : (milestone.CompanyMasterSid != null ? [Number(milestone.CompanyMasterSid)] : []),
          DepartmentMasterSid: milestone.DepartmentMasterSid,
          ShipmentType: milestone.ShipmentType,
          SortBy: milestone.SortBy,
          AutoCapture: milestone.AutoCapture || 'N',
          AutomailRequire: milestone.AutomailRequire || 'N',
          status: milestone.status || 'A',
          Remarks: milestone.Remarks || ''
        });
        this.milestoneForm.get('status')?.enable();
        // Keep the company selector open in edit mode: the record's own company
        // is updated, and any newly-added company gets a fresh milestone created
        // (the backend skips companies that already have it — no duplication).
        this.milestoneForm.get('CompanyMasterSids')?.enable();
        this.initialFormValue = this.milestoneForm.getRawValue();
        this.isDirty = false;
      },
      error: (err) => {
        console.error('Error loading milestone:', err);
        this.appSettingService.showError('Failed to load milestone data');
      }
    });
  }

  onSubmit(resolve?: (saved: boolean) => void) {
    const raw = this.milestoneForm.getRawValue();
    if (this.isEditMode && this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.milestoneForm.markAsUntouched();
      resolve?.(false);
      return;
    }

    if (this.isSaving) {
      resolve?.(false);
      return;
    }

    if (this.milestoneForm.invalid) {
      this.markFormGroupTouched(this.milestoneForm);
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      resolve?.(false);
      return;
    }
  
    this.isSaving = true;
    this.btnDisable = true;
    
    const formValue = this.milestoneForm.value;
    const createdBy = { createdBy: this.userData?.userEmail || 'system' };
    const updatedBy = { updatedBy: this.userData?.userEmail || 'system' };
    
    const payload = {
      CompanyMasterSid :this.currentCompany?.CompanyMasterSid,
      ...formValue,
      DepartmentMasterSid: formValue.DepartmentMasterSid,
      // Milestones are company-level, not branch-scoped — never persist a branch.
      BranchMasterSid: null,
      status: this.isEditMode ? formValue.status : 'A',
      ...(this.isEditMode ? updatedBy : createdBy)
    };
  
    const operation = this.isEditMode 
      ? this.masterService.updateMilestoneById(this.milestoneId, payload)
      : this.masterService.createMilestone(payload);
  
    operation.subscribe({
      next: (resp: any) => {
        this.isSaving = false;
        this.btnDisable = false;
        const message = resp.message || 
          (this.isEditMode ? 'Milestone updated successfully!' : 'Milestone created successfully!');
        
        if (resp.status) {
          this.isDirty = false;
          this.initialFormValue = this.milestoneForm.getRawValue();
          this.appSettingService.showSuccess(message);
          resolve?.(true);
          this.router.navigate(['/master/milestone/list']);
        } else {
          this.appSettingService.showError(resp.message || 'Operation failed');
          resolve?.(false);
        }
      },
      error: (err) => {
  console.error('Error:', err);
  this.isSaving = false;
  this.btnDisable = false;
  const errorMessage = err.error?.message || 
    err.message || 
    `Error ${this.isEditMode ? 'updating' : 'creating'} milestone`;
  this.appSettingService.showError(errorMessage);
  resolve?.(false);
}
    });
  }

  resetForm() {
    if (this.isEditMode) {
      this.getMilestoneById(this.milestoneId);
    } else {
      this.milestoneForm.reset({
        MilestoneName: '',
        MilestoneCode: '',
        CompanyMasterSids: this.currentCompany?.CompanyMasterSid ? [Number(this.currentCompany.CompanyMasterSid)] : [],
        DepartmentMasterSid: [],
        ShipmentType: '',
        SortBy: '',
        AutoCapture: 'N',
        AutomailRequire: 'N',
        status: 'A',
        Remarks: ''
      });
      this.milestoneForm.get('status')?.disable();
      this.initialFormValue = this.milestoneForm.getRawValue();
      this.isDirty = false;
    }
  }

  goBack() {
    this.router.navigate(['master/milestone/list']);
  }
  onAutoCaptureChange(event: any) {
  const isChecked = event.target.checked;
  this.milestoneForm.get('AutoCapture')?.setValue(isChecked ? 'Y' : 'N');
}

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  showInfo() {
    if (!this.milestoneData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.milestoneData;
    modalRef.componentInstance.idLabel = 'Milestone Id';
    modalRef.componentInstance.idValue = this.milestoneData?.MilestoneMasterSid;
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
	// 				modalRef.componentInstance.DocumentSid = this.milestoneId;

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
    if (!this.milestoneData) return;
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
    modalRef.componentInstance.documentSid = this.milestoneId;
  }

openEDoc() {
  if (!this.milestoneData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.milestoneData;
  modalRef.componentInstance.idLabel = 'Milestone Id';
  modalRef.componentInstance.idValue = this.milestoneData?.milestoneId;
  const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.milestoneId
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
    modalRef.componentInstance.DocumentSid = this.milestoneId;
  }

 openFollowup() {
    if (!this.milestoneData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.milestoneData?.QuoteHeaderSid;
    modalRef.componentInstance.parentEmail = this.milestoneData.Email;
    modalRef.componentInstance.parentSubject = `Quotation No.${this.milestoneData.QuoteNumber} Date:${new Date(this.milestoneData.QuoteDate).toLocaleDateString()}`;
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

openAuditLogs() {
    if (!this.milestoneData?.MilestoneMasterSid) return;
    const modalRef = this.modalService.open(AuditLogComponent, {
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'Milestone Logs';
    modalRef.componentInstance.tableName = 'MilestoneMaster';
    modalRef.componentInstance.recordId = this.milestoneData?.MilestoneMasterSid.toString();
    modalRef.componentInstance.screenName = 'Milestone';
  }
navigateToCreateMilestone() {
    this.router.navigate(['master/milestone/entry']);
  }
}
