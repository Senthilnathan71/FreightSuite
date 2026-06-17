import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal, NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { Search } from 'angular-feather/icons';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

@Component({
  selector: 'app-authority-entry',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FeatherModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    NgbNavModule,
    PreventMultiClickDirective,
    NgbModalModule,
    MultiSelectComponent,
    NgbDropdownModule,
    SearchableDropdown,
    ElementStateGuardDirective,
    FormStateGuardDirective
  ],
  templateUrl: './authority-entry.component.html',
  styleUrls: ['./authority-entry.component.scss']
})
export class AuthorityEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  active = 1;
  modeOfStatus = [
    { id: 'Active', name: 'Active' },
    { id: 'Suspended', name: 'Suspended' },
  ];

  AuthorityMasterSid: number;
  AuthorityDetailSid: number;
  isEditMode: boolean = false;
  isModalEditMode: boolean = false;
  authorityDetailsLength: number = 0;
  modalRef: NgbModalRef;
  MenuMasterSid:any
  authorityForm!: FormGroup;
  authorityDetailForm!: FormGroup;
  authorityDetailsList: any[] = [];
  authorityData: any;
  detailData: any;
  readonly maxAuthorityDetails = 3;

  companyResults: any[] = [];
  branchResults: any[] = [];
  departmentResults: any[] = [];
  filteredAuthorisers: any[][] = [];
  menuResults: any[] = [];
  userResults: any[] = [];
  branchList: any[] = [];
  usersTeamList: any[] = [];
  TandCList: any[] = [];
  currentMenuId: any;
  isSaving = false;
  isDirty: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();
  currentDetailIndex : number;
  userData : any;
  currentCompany : any
  currentBranch : any
  
auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

  userLookupConfig = DROPDOWN_CONFIGS.USER;


  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private settingsService: SettingsService,
    private appSettingService: AppSettingsService,
    private route: Router,
    private currentRoute: ActivatedRoute,
    private modalService: NgbModal,
    private commonService: CommonService,
    public mps : MenuPermissionService,
  ) { }

  ngOnInit(): void {
    this.initAuthorityForm();
    this.subscribeToFormChanges();
    
    this.userData = this.appSettingService.getDecryptedUserProfile();

    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
    console.log('Current Company:', this.currentCompany);
  console.log('CompanyMasterSid:', this.currentCompany?.CompanyMasterSid);
  this.loadAllFields();
    this.branchList = this.getBranchListByCompany(this.userData,this.currentCompany?.CompanyMasterSid)
    if (this.currentBranch?.BranchMasterSid) {
      this.authorityForm.patchValue({ BranchMasterSid: this.currentBranch.BranchMasterSid });
    }
    console.log(this.branchList);

    // this.filterBranchByCompany(CompanyMasterSid);
    this.mps.init().subscribe();
    this.currentRoute.paramMap.subscribe((param) => {
      this.AuthorityMasterSid = +param.get('id');
      if (this.AuthorityMasterSid) {
        this.isEditMode = true;
        this.loadAuthorityData();
      } else {
        this.addAuthDetail();
        this.setInitialFormSnapshot();
      }
    });
  }

  getBranchListByCompany(userData, targetCompanySid) {
    const company = userData.userCompanyMaster?.find(
      (c) => c.CompanyMasterSid === targetCompanySid
    );

    if (!company) {
      return [];
    }

    return company.companyMaster?.userBranchMaster?.map((branch) => {
      return {
        BranchMasterSid: branch.BranchMasterSid,
        branchName: branch.branchMaster?.branchName
      };
    }) || [];
  }


  loadAllFields() {
     const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
     if (!CompanyMasterSid) {
    console.error('Company ID not found');
    this.appSettingService.showError('Company information not available');
    return;
  }
    forkJoin({
      companies: this.masterService.getAllCompanies(),
      departments: this.masterService.getAllDepartments(CompanyMasterSid),
      menus: this.settingsService.getAllMenu(),
      users: this.masterService.getAllFfUser(),
      // branches: this.masterService.getAllBranches()
    }).subscribe(({ companies, departments, menus, users}) => {
      this.companyResults = companies;
      if (Array.isArray(departments)) {
      this.departmentResults = departments;
    } else if (departments && departments.data) {
      this.departmentResults = departments.data;
    } else {
      console.warn('Unexpected departments response format:', departments);
      this.departmentResults = [];
    }
      this.menuResults = menus;
      this.userResults = users.data;
      this.updateFilteredAuthorisers();
      // this.branchList = branches;
    });
  }

  initAuthorityForm() {
    this.authorityForm = this.fb.group({
      BranchMasterSid: [null, [Validators.required]],
      DepartmentMaster: [[], [Validators.required]],
      MenuMaster: [null, [Validators.required]],
      status: ['Active', [Validators.required]],
      Remarks: [''],
      authDetails : this.fb.array([],[Validators.required])
    });
  }

  initAuthDetailForm() {
    this.authorityDetailForm = this.fb.group({
      UserMasterSid: [null, [Validators.required]],
      AuthorityLevel: ['', [Validators.required, Validators.min(1)]],
      FinalAuthority: [false, [Validators.required]],
      status: ['Active', [Validators.required]],
      Remarks: ['']
    })
  }

  createNewAuthDetail(data?:any) {
    return this.fb.group({
      AuthorityDetailSid : [data?.AuthorityDetailSid || null],
      UserMasterSid: [data?.UserMasterSid || null, [Validators.required]],
      AuthorityLevel: [data?.AuthorityLevel ],
      FinalAuthority: [data?.FinalAuthority === 'Y' || false, [Validators.required]],
      status: ['Active', [Validators.required]],
      Remarks: ['']
    })
  }

  addAuthDetail(){
    if (!this.canAddAuthDetail()) {
      this.appSettingService.showWarning(`Maximum ${this.maxAuthorityDetails} authorizers are allowed`);
      return;
    }

    const formGroup = this.createNewAuthDetail();
    this.authDetails.push(formGroup);
    this.updateFilteredAuthorisers();
  }

  get authDetails() : FormArray{
    return this.authorityForm.get('authDetails') as FormArray
  }

  canAddAuthDetail(): boolean {
    return this.authDetails.length < this.maxAuthorityDetails;
  }

  removeAuthDetail(detailIndex: number,AuthorityDetailSid : number) {
    if(AuthorityDetailSid){
      this.masterService.deleteAuthorityDetailById(AuthorityDetailSid).subscribe(
        (resp:any)=>{
          if(resp.status){
            this.appSettingService.showSuccess('Authority Detail deleted successfully');
            this.authDetails.removeAt(detailIndex);
            this.updateFilteredAuthorisers();
          } else {
            this.appSettingService.showError('Error deleting Authority Detail');
          }
        }
      )
    } else {
      this.appSettingService.showSuccess('Authority Detail deleted successfully');
      this.authDetails.removeAt(detailIndex)
      this.updateFilteredAuthorisers();
    }
  }


  filterBranchByCompany(companyId: number){
      this.masterService.getBranchesByCompanyId(companyId).subscribe(
        (resp) => {
          if(resp){
            this.branchList = resp;
          }
        }
      );
  }

  loadAuthorityData() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const payload = {
      CompanyMasterSid: CompanyMasterSid,
      BranchMasterSid: BranchMasterSid,
      AuthorityMasterSid: this.AuthorityMasterSid
    };
    this.masterService.getAuthorityById(payload).subscribe({
      next :(resp: any) => {
        if(resp.status){
          this.authorityData = resp.data;
          const data = resp.data;
          const authDetailsArr :any[] = resp.data?.authorityDetail || [];
          this.authorityForm.patchValue({
            BranchMasterSid: data.BranchMasterSid,
            DepartmentMaster: data.DepartmentMaster,
            MenuMaster: data.MenuMaster,
            status: data.status === 'A' ? 'Active' : 'Suspended',
            Remarks: data.Remarks
          })
          this.authDetails.clear();
          authDetailsArr.forEach(detail => {
            let data = {
              AuthorityDetailSid : detail.AuthorityDetailSid,
              UserMasterSid: detail.UserMasterSid,
              AuthorityLevel: detail.AuthorityLevel,
              FinalAuthority: detail.FinalAuthority,
              status: detail.status === 'A' ? 'Active' : 'Suspended',
              Remarks: detail.Remarks
            }
            const formGroupWithData = this.createNewAuthDetail(data);
            this.authDetails.push(formGroupWithData);
          })
          this.updateFilteredAuthorisers();
          this.setInitialFormSnapshot();
        } else {
          this.appSettingService.showError("Access denied.");
          console.error(resp.message);
        }
      },
      error :(error) => {
        console.error(error);
      }
    });
  }



  submitAuthorityForm(resolve?: (value: boolean) => void) {
    if (this.isSaving) {
      resolve?.(false);
      return;
    }

    const raw = this.authorityForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.authorityForm.markAsUntouched();
      resolve?.(false);
      return;
    }
    
    if (this.authorityForm.invalid) {
      this.authorityForm.markAllAsTouched();
      this.authorityForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly');
      resolve?.(false);
      return;
    }

    if (this.authDetails.length > this.maxAuthorityDetails) {
      this.appSettingService.showWarning(`Only ${this.maxAuthorityDetails} authorization levels are allowed`);
      resolve?.(false);
      return;
    }

    const selectedAuthorizers = this.authDetails.value
      .map((detail: any) => detail.UserMasterSid)
      .filter((sid: any) => sid !== null && sid !== undefined && sid !== '');
    const hasDuplicateAuthorizers = new Set(selectedAuthorizers).size !== selectedAuthorizers.length;

    if (hasDuplicateAuthorizers) {
      this.appSettingService.showWarning('Duplicate authorizers are not allowed');
      resolve?.(false);
      return;
    }


    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const formValue = this.authorityForm.getRawValue();
    if (!CompanyMasterSid || !BranchMasterSid) {
      this.appSettingService.showError('Company or branch information not available');
      resolve?.(false);
      return;
    }
    const length = this.authDetails.length - 1;
    const detailPayload = this.authDetails.value.map((detail,index) => {
      return {
        AuthorityDetailSid : detail.AuthorityDetailSid,
        UserMasterSid: detail.UserMasterSid,
        AuthorityLevel: index + 1,
        FinalAuthority: index === length ? 'Y' : 'N',
        status: detail.status === 'Active' ? 'A' : 'S',
        Remarks: detail.Remarks
      }
    })
     
    const payload = {
      CompanyMasterSid,
      BranchMasterSid: formValue.BranchMasterSid || BranchMasterSid,
      DepartmentMaster:formValue.DepartmentMaster,
      MenuMaster: formValue.MenuMaster,
      status: formValue.status === 'Active' ? 'A' : 'S',
      Remarks: formValue.Remarks,
      authDetails: detailPayload,
      ...(this.isEditMode ? { updatedBy : currentUserEmail } : {createdBy : currentUserEmail})
    };
    
    if(this.isEditMode) {
      this.isSaving = true;
      this.masterService.updateAuthorityById(this.AuthorityMasterSid,payload).subscribe({
        next :(resp:any)=>{
          this.isSaving = false;
          if(resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.setInitialFormSnapshot();
            resolve?.(true);
            this.route.navigate(['master/authorization/list'])
          } else {
            this.appSettingService.showError(resp.message);
            resolve?.(false);
            console.error(resp.message);
          }
        },
        error :(error:any) => {
          this.isSaving = false;
          resolve?.(false);
          console.error(error);
        }
      })
    } else {
      this.isSaving = true;
      this.masterService.createAuthority(payload).subscribe({
        next :(resp:any)=>{
          this.isSaving = false;
          if(resp.status) {
           this.appSettingService.showSuccess(resp.message);
            this.setInitialFormSnapshot();
            resolve?.(true);
            this.route.navigate(['master/authorization/list'])
          } else {
            this.appSettingService.showError(resp.message);
            resolve?.(false);
            console.error(resp.message);
          }
        },
        error :(error:any) => {
          this.isSaving = false;
          resolve?.(false);
          console.error(error);
        }
      })
    }
  }

  

// openAuditLogs(modal: TemplateRef<any>) {
//   if (!this.AuthorityMasterSid) return;

//   this.masterService.getAuditLogsAuthority('AuthorityMaster', this.AuthorityMasterSid.toString()).subscribe({
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
  if (!this.AuthorityMasterSid) return;

  this.masterService.getAuditLogsAuthority(
    'AuthorityMaster',
    this.AuthorityMasterSid.toString()
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


  closeAuthorityDetailForm() {
    this.authorityDetailForm.reset({
      FinalAuthority: 'Y',
      status: 'Active'
    });
    this.isModalEditMode = false;
    this.modalService.dismissAll();
  }

  getFilteredAuthoriser(detailIndex: number): any[] {
    if (!this.authDetails?.length || !this.userResults?.length) {
      return [];
    }

    const currentDetail = this.authDetails.at(detailIndex).value;
    const currentUserSid = currentDetail.UserMasterSid;

    const allSelectedUsers = this.authDetails.value
      .filter((detail: any, index: number) => detail.UserMasterSid && index !== detailIndex)
      .map((detail: any) => detail.UserMasterSid);

    // Keep all users except those already selected elsewhere,
    // but always include the current row's selected user (if any)
    const filteredUsers = this.userResults.filter((user: any) =>
      !allSelectedUsers.includes(user.UserMasterSid) || user.UserMasterSid === currentUserSid
    );

    return filteredUsers;
  }


  onFinalAuthorityChange(detailIndex, event: any) {
    const element = event.target as HTMLInputElement;
    const control = this.authDetails.at(detailIndex).get('FinalAuthority');
    if(event instanceof KeyboardEvent){
      element.checked = !element.checked
    }
    control.setValue(element.checked);
  }
  
  filterAuthorisersForIndex(index: number): any[] {
    if (!this.authDetails?.length || !this.userResults?.length) return [];

    const currentDetail = this.authDetails.at(index);
    const currentUserSid = currentDetail?.value?.UserMasterSid;

    const selectedSids = this.authDetails.value
      .filter((_: any, i: number) => i !== index)
      .map((detail: any) => detail.UserMasterSid);

    return this.userResults.filter(
      (user: any) =>
        !selectedSids.includes(user.UserMasterSid) || user.UserMasterSid === currentUserSid
    );
  }

  updateFilteredAuthorisers(): void {
    this.filteredAuthorisers = this.authDetails.controls.map((_, index) =>
      this.filterAuthorisersForIndex(index)
    );
  }

  onAuthorizerChange(event: any, index: number): void {
    this.updateFilteredAuthorisers();
  }


  goBack(){
    history.back();
  }


  // resetAuthorityForm() {
  //   this.authorityForm.reset({
  //     status: 'Active'
  //   });
  //   this.authDetails.clear();
  // }

  resetAuthorityForm() {
  if (this.isEditMode && this.AuthorityMasterSid) {
    this.loadAuthorityData();
    return;
  }

  this.authorityForm.reset({
    BranchMasterSid: null,
    DepartmentMaster: [],
    MenuMaster: null,
    status: 'Active',
    Remarks: ''
  });

  // Use patchValue to set authDetails to empty array
  this.authorityForm.patchValue({
    authDetails: []
  });
  
  // Clear the form array
  while (this.authDetails.length > 0) {
    this.authDetails.removeAt(0);
  }
  
  // Reset other properties
  this.authorityDetailsList = [];
  this.authorityDetailsLength = 0;
  this.filteredAuthorisers = [];
  this.AuthorityMasterSid = null;
  this.AuthorityDetailSid = null;
  this.isModalEditMode = false;
  
  this.addAuthDetail();
  this.updateFilteredAuthorisers();
  this.setInitialFormSnapshot();
}

  showAuthorityInfo() {
    if (!this.authorityData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.authorityData;
    modalRef.componentInstance.idLabel = 'Authority Id';
    modalRef.componentInstance.idValue = this.authorityData?.AuthorityMasterSid;
  }

  showAuthorityDetailInfo() {
    if (!this.detailData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.detailData;
    modalRef.componentInstance.idLabel = 'Authority Detail Id';
    modalRef.componentInstance.idValue = this.detailData?.AuthorityDetailSid;
  }

   openTandC() {
     this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
     const payload = { MenuMasterSid: this.currentMenuId };
     this.masterService.getTandCByCondition(payload).subscribe(
       (resp: any) => {
         if (resp.Status) {
           this.TandCList = resp.data;
           const modalRef = this.modalService.open(TermsAndConditionsComponent, {
             size: 'lg',
             backdrop: 'static',
             centered: true
           });
           modalRef.componentInstance.terms = this.TandCList;
           modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
           modalRef.componentInstance.DocumentSid = this.AuthorityMasterSid;
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
     if (!this.authorityData) return;
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
     modalRef.componentInstance.documentSid = this.AuthorityMasterSid;
     modalRef.componentInstance.CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
     modalRef.componentInstance.BranchMasterSid = this.currentBranch?.BranchMasterSid;
     modalRef.componentInstance.DepartmentMaster = this.authorityForm.get('DepartmentMaster')?.value?.[0];
   }
   
   openEDoc() {
     if (!this.authorityData) return;
     const modalRef = this.modalService.open(EdocComponent, { 
       size: 'lg', 
       centered: true, 
       backdrop: 'static' 
     });
     modalRef.componentInstance.item = this.authorityData;
     modalRef.componentInstance.idLabel = 'AuthorityMasterSid';
     modalRef.componentInstance.idValue = this.authorityData?.AuthorityMasterSid;
     const data:any={
     CompanyMasterSid: this.currentCompany.CompanyMasterSid,
     BranchMasterSid: this.currentBranch.BranchMasterSid,
     MenuMasterSid : this.MenuMasterSid,
     DocumentSid: this.AuthorityMasterSid
   }
 
       this.commonService.documentData.set(data)
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
      this.submitAuthorityForm(resolve);
    });
  }

  private subscribeToFormChanges(): void {
    this.authorityForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.initialFormValue) return;
        this.isDirty = !this.deepEqual(this.initialFormValue, this.authorityForm.getRawValue());
      });
  }

  private setInitialFormSnapshot(): void {
    this.initialFormValue = this.authorityForm.getRawValue();
    this.isDirty = false;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
