import { Component, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { NgSelectModule } from '@ng-select/ng-select';
import { Division } from 'src/app/modules/crm-mobile/Interfaces/division.interface';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';

@Component({
  selector: 'app-department-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    DatePipe
  ],
  templateUrl: './department-entry.component.html',
  styleUrl: './department-entry.component.scss'
})
export class DepartmentEntryComponent {
  departmentForm!: FormGroup;
  isEditMode = false; // Flag for edit mode
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  DepartmentMasterSid: number;
  divisionList : Division[];
  departmentData : any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  userData: any;
  countryList: any
  stateList: any
  statusList = ["Active", "Suspended"]
  currentMenuId: any;
  TandCList: any[]=[];
  departmentTypeOptions = ['Sea', 'Air', 'Road', 'Transport'];
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  currentCompany: any;
  currentBranch: any;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService : NgbModal
  ) { }

  ngOnInit(): void {
     this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
       this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.initForm();
    this.getAllDivisions();
    // Subscribe to route params and load lead if ID exists
    this.route.paramMap.subscribe(params => {
      this.DepartmentMasterSid = +params.get('id');
      if (this.DepartmentMasterSid) {
        this.isEditMode = true;
        this.loadDepartmentData(this.DepartmentMasterSid);
      }
    });
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       this.checkPermissions();
    //     }
    //   }
    // );
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}

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

  // Initialize the Form
  initForm() {
    this.departmentForm = this.fb.group({
      departmentName: ['', [Validators.required]],
      departmentCode: ['', [Validators.required]],
      departmentType: ['', [Validators.required]],
      ExportImport: ['', [Validators.required]],
      FCLLCL: ['', [Validators.required]],
      Division : [''],
      Remarks : [''],
      Status: ['Active']
    });
  }

  onSubmit() {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched(); // Force validation messages to show
      this.departmentForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.departmentForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...updatedBy,
        Status: formValue.Status === "Active" ? "A" : "S",
        CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
      } : {
        ...formValue,
        ...createdBy,
        Status: formValue.Status === "Active" ? "A" : "S",
        CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
      };


      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateDepartmentById(this.DepartmentMasterSid, payload).subscribe(
          (resp: any) => {

            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/department/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading country:', error);
          }
        );
      } else {

        this.masterService.createDepartment(payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/department/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading country:', error);
          }
        );
      }
    }
  }

  // Mapping for API status values
  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended',
    
  };

  getAllDivisions(){
     const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.masterService.getAllDivisions(CompanyMasterSid).subscribe(
      (resp:any)=>{
        this.divisionList=resp;
      }
    )
  }

  // Fetch lead data and patch the form
  loadDepartmentData(deptId: number) {
    this.masterService.getDepartmentById(deptId).subscribe(
      (deptData: any) => {
        this.departmentData = deptData;
        this.departmentForm.patchValue({
          ...deptData,
          Status: deptData.Status === 'A' ? 'Active' : 'Suspended'
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading lead data.');
      }
    );
  }

 openAuditLogs(modal: TemplateRef<any>) {
  if (!this.DepartmentMasterSid) return;

  this.masterService.getAuditLogs('DepartmentMaster', this.DepartmentMasterSid.toString()).subscribe({
    next: (logs: any[]) => {
      const formatFields = (val: any) => {
        if (!val) return ['NA'];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        delete obj.updatedOn; // Remove updatedOn field
        // If no fields exist after deleting updatedOn
        if (Object.keys(obj).length === 0) return ['NA'];
        return Object.entries(obj).map(
          ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
        );
      };

      this.auditLogs = logs.map(log => ({
        ...log,
        oldValDisplay: formatFields(log.oldVal),
        newValDisplay: formatFields(log.newVal)
      }));

      this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
}



  reset() {
    this.departmentForm.reset();
  }
  goBack() {
    history.back()
  }

  showInfo() {
    if(!this.departmentData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.departmentData;
    modalRef.componentInstance.idLabel = 'Department Id';
    modalRef.componentInstance.idValue = this.departmentData?.DepartmentMasterSid;
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
            modalRef.componentInstance.DocumentSid = this.DepartmentMasterSid;
  
          } else {
            this.appSettingService.showError('Error loading Terms and Conditions');
          }
        },
        (error) => {
          this.appSettingService.showError('Error loading Terms and Conditions',error);
        }
      );
    }
  openEmail() {
    if (!this.departmentData) return;
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
    modalRef.componentInstance.documentSid = this.DepartmentMasterSid;
  }

openEDoc() {
  if (!this.departmentData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.departmentData;
  modalRef.componentInstance.idLabel = 'Department Id';
  modalRef.componentInstance.idValue = this.departmentData?.DepartmentMasterSid;
}

}
