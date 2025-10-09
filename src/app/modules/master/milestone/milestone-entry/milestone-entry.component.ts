import { Component, OnInit,TemplateRef } from '@angular/core';
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
    NgbDropdownModule
  ],
  templateUrl: './milestone-entry.component.html',
  styleUrls: ['./milestone-entry.component.scss']
})
export class MilestoneEntryComponent implements OnInit {
  milestoneForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  milestoneId: number;
  departmentList: any[] = [];
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
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private modalService : NgbModal
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
     this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    // this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    // Load departments after setting current company
  console.log('Current Company:', this.currentCompany);
  console.log('CompanyMasterSid:', this.currentCompany?.CompanyMasterSid);
  this.getAllDepartments(); 
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.milestoneId = +params['id'];
        this.isEditMode = true;
        this.getMilestoneById(this.milestoneId);
        this.milestoneForm.get('status')?.enable();
      }
    });
  }

   checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId)
    console.log(userRole)
    if (currentMenuId && userRole) {
     this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
  next: (response) => {
    this.currentMenuPermissions = response.data.MenuPermissions || {};
    this.permissions = Object.keys(this.currentMenuPermissions)
      .filter(key => this.currentMenuPermissions[key] === 'isTrue');
      console.log(this.permissions)
  }
});
    }
  }
 
  hasPermission(permission: string): boolean {
  return this.permissions.includes(permission);
}

hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  initForm() {
    this.milestoneForm = this.fb.group({
      MilestoneName: ['', [Validators.required, Validators.maxLength(30)]],
      MilestoneCode: ['', [Validators.required, Validators.maxLength(30)]],
      DepartmentMasterSid: ['', Validators.required],
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

  getMilestoneById(id: number) {
    this.milestoneForm.reset();
    this.masterService.getMilestoneById(id).subscribe({
      next: (milestone: any) => {
        this.milestoneData = milestone;
        this.milestoneForm.patchValue({
          MilestoneName: milestone.MilestoneName,
          MilestoneCode: milestone.MilestoneCode,
          DepartmentMasterSid: milestone.DepartmentMasterSid,
          ShipmentType: milestone.ShipmentType,
          SortBy: milestone.SortBy,
          AutoCapture: milestone.AutoCapture || 'N',
          AutomailRequire: milestone.AutomailRequire || 'N',
          status: milestone.status || 'A',
          Remarks: milestone.Remarks || ''
        });
        this.milestoneForm.get('status')?.enable();
      },
      error: (err) => {
        console.error('Error loading milestone:', err);
        this.appSettingService.showError('Failed to load milestone data');
      }
    });
  }

  onSubmit() {
    if (this.milestoneForm.invalid) {
      this.markFormGroupTouched(this.milestoneForm);
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }
  
    this.btnDisable = true;
    
    const formValue = this.milestoneForm.value;
    const createdBy = { createdBy: this.userData?.userEmail || 'system' };
    const updatedBy = { updatedBy: this.userData?.userEmail || 'system' };
    
    const payload = {
      CompanyMasterSid :this.currentCompany?.CompanyMasterSid,
      BranchMasterSid:this.currentBranch?.BranchMasterSid,
      ...formValue,
      DepartmentMasterSid: Number(formValue.DepartmentMasterSid),
      status: this.isEditMode ? formValue.status : 'A',
      ...(this.isEditMode ? updatedBy : createdBy)
    };
  
    const operation = this.isEditMode 
      ? this.masterService.updateMilestoneById(this.milestoneId, payload)
      : this.masterService.createMilestone(payload);
  
    operation.subscribe({
      next: (resp: any) => {
        this.btnDisable = false;
        const message = resp.message || 
          (this.isEditMode ? 'Milestone updated successfully!' : 'Milestone created successfully!');
        
        if (resp.status) {
          this.appSettingService.showSuccess(message);
          this.router.navigate(['/master/milestone/list']);
        } else {
          this.appSettingService.showError(resp.message || 'Operation failed');
        }
      },
      error: (err) => {
  console.error('Error:', err);
  this.btnDisable = false;
  const errorMessage = err.error?.message || 
    err.message || 
    `Error ${this.isEditMode ? 'updating' : 'creating'} milestone`;
  this.appSettingService.showError(errorMessage);
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
        DepartmentMasterSid: '',
        ShipmentType: '',
        SortBy: '',
        AutoCapture: 'N',
        AutomailRequire: 'N',
        status: 'A',
        Remarks: ''
      });
      this.milestoneForm.get('status')?.disable();
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
					modalRef.componentInstance.DocumentSid = this.milestoneId;

				} else {
					this.appSettingService.showError('Error loading Terms and Conditions');
				}
			},
			(error) => {
				this.appSettingService.showError('Error loading Terms and Conditions', error);
			}
		);
	}
  openEmail() {
    if (!this.milestoneData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    const MenuMasterSid = localStorage.getItem('currentMenuId');
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
}

//  openAuditLogs(modal: TemplateRef<any>) {
//   if (!this.milestoneId) return;

//   this.masterService.getAuditLogs('MilestoneMaster', this.milestoneId.toString()).subscribe({
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
  if (!this.milestoneId) return;

  this.masterService.getAuditLogs(
    'MilestoneMaster',
    this.milestoneId.toString()
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