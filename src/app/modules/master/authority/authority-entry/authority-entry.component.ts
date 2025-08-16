import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbModalModule, NgbModalRef, NgbModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';

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
    MultiSelectComponent
  ],
  templateUrl: './authority-entry.component.html',
  styleUrls: ['./authority-entry.component.scss']
})
export class AuthorityEntryComponent implements OnInit {
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

  authorityForm!: FormGroup;
  authorityDetailForm!: FormGroup;
  authorityDetailsList: any[] = [];
  authorityData: any;
  detailData: any;

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
  currentDetailIndex : number;
  userData : any;
  currentCompany : any
  currentBranch : any
  
auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;



  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private settingsService: SettingsService,
    private appSettingService: AppSettingsService,
    private route: Router,
    private currentRoute: ActivatedRoute,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.initAuthorityForm();
    this.loadAllFields();
    this.userData = this.appSettingService.getDecryptedUserProfile();

    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    this.branchList = this.getBranchListByCompany(this.userData,this.currentCompany?.CompanyMasterSid)
    console.log(this.branchList);

    // this.filterBranchByCompany(CompanyMasterSid);

    this.currentRoute.paramMap.subscribe((param) => {
      this.AuthorityMasterSid = +param.get('id');
      if (this.AuthorityMasterSid) {
        this.isEditMode = true;
        this.loadAuthorityData();
      } else {
        this.addAuthDetail();
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
    forkJoin({
      companies: this.masterService.getAllCompanies(),
      departments: this.masterService.getAllDepartments(),
      menus: this.settingsService.getAllMenu(),
      users: this.masterService.getAllFfUser(),
      // branches: this.masterService.getAllBranches()
    }).subscribe(({ companies, departments, menus, users}) => {
      this.companyResults = companies;
      this.departmentResults = departments;
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
    const formGroup = this.createNewAuthDetail();
    this.authDetails.push(formGroup);
    this.updateFilteredAuthorisers();
  }

  get authDetails() : FormArray{
    return this.authorityForm.get('authDetails') as FormArray
  }

  removeAuthDetail(detailIndex: number) {
    this.authDetails.removeAt(detailIndex)
    this.updateFilteredAuthorisers();
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
    this.masterService.getAuthorityById(this.AuthorityMasterSid).subscribe({
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
        } else {
          this.appSettingService.showError("Error fetching authority");
          console.error(resp.message);
        }
      },
      error :(error) => {
        console.error(error);
      }
    });
  }



  submitAuthorityForm() {
    
    if (this.authorityForm.invalid) {
      this.authorityForm.markAllAsTouched();
      this.authorityForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly');
      return;
    }


    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const formValue = this.authorityForm.value;
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
      BranchMasterSid: formValue.BranchMasterSid,
      DepartmentMaster:formValue.DepartmentMaster,
      MenuMaster: formValue.MenuMaster,
      status: formValue.status === 'Active' ? 'A' : 'S',
      Remarks: formValue.Remarks,
      authDetails: detailPayload,
      ...(this.isEditMode ? { updatedBy : currentUserEmail } : {createdBy : currentUserEmail})
    };
    
    if(this.isEditMode) {
      this.masterService.updateAuthorityById(this.AuthorityMasterSid,payload).subscribe({
        next :(resp:any)=>{
          if(resp.status) {
            this.appSettingService.showSuccess("Authorization updated successfully");
            this.route.navigate(['master/authorization/list'])
          } else {
            this.appSettingService.showError(resp.message);
            console.error(resp.message);
          }
        },
        error :(error:any) => {
          console.error(error);
        }
      })
    } else {
      this.masterService.createAuthority(payload).subscribe({
        next :(resp:any)=>{
          if(resp.status) {
            this.appSettingService.showSuccess("New authorization create successfully");
            this.route.navigate(['master/authorization/list'])
          } else {
            this.appSettingService.showError(resp.message);
            console.error(resp.message);
          }
        },
        error :(error:any) => {
          console.error(error);
        }
      })
    }
  }

  

openAuditLogs(modal: TemplateRef<any>) {
  if (!this.AuthorityMasterSid) return;

  this.masterService.getAuditLogsAuthority('AuthorityMaster', this.AuthorityMasterSid.toString()).subscribe({
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


  resetAuthorityForm() {
    this.authorityForm.reset({
      status: 'Active'
    });
    this.authDetails.clear();
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
}