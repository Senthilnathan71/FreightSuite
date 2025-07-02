import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
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
    PreventMultiClickDirective
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
  setErrorMessage: boolean = false;
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
  menuResults: any[] = [];
  userResults: any[] = [];
  branchList: any[] = [];
  usersTeamList: any[] = [];
  TandCList: any[] = [];
  currentMenuId: any;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private settingsService: SettingsService,
    private appSettingService: AppSettingsService,
    private route: Router,
    private currentRoute: ActivatedRoute,
    private modalService: NgbModal,
    private matdial: MatDialog
  ) { }

  ngOnInit(): void {
    this.initAuthorityForm();
    this.initAuthorityDetailForm();
    this.loadAllFields();
    

    const userSettings = this.appSettingService.userSettingSource.value;
    const CompanyMasterSid = userSettings['userBranchMaster'][0].companyMaster.CompanyMasterSid;
    
    this.filterBranchByCompany(CompanyMasterSid).then(() => {
      this.authorityForm.patchValue({
        CompanyMasterSid: userSettings['companyId'],
        BranchMasterSid: userSettings['branchId']
      });
    });

    this.currentRoute.paramMap.subscribe((param) => {
      this.AuthorityMasterSid = +param.get('id');
      if (this.AuthorityMasterSid) {
        this.isEditMode = true;
        this.loadAuthorityData();
      }
    });
  }

  initAuthorityForm() {
    this.authorityForm = this.fb.group({
      BranchMasterSid: ['', [Validators.required]],
      DepartmentMaster: [[], [Validators.required]],
      MenuMaster: ['', [Validators.required]],
      status: ['Active', [Validators.required]],
      Remarks: ['']
    });
  }

  initAuthorityDetailForm() {
    this.authorityDetailForm = this.fb.group({
      UserMasterSid: ['', [Validators.required]],
      AuthorityLevel: ['', [Validators.required, Validators.min(1)]],
      FinalAuthority: ['Y', [Validators.required]],
      status: ['Active', [Validators.required]],
      Remarks: ['']
    });
  }

  onFinalAuthorityChange(event: any) {
    const isChecked = event.target.checked;
    this.authorityDetailForm.get('FinalAuthority')?.setValue(isChecked ? 'Y' : 'N');
  }

  loadAllFields() {
    forkJoin({
      companies: this.masterService.getAllCompanies(),
      departments: this.masterService.getAllDepartments(),
      menus: this.settingsService.getAllMenu(),
      users: this.masterService.getAllFfUser(),
      branches: this.masterService.getAllBranches()
    }).subscribe(({ companies, departments, menus, users, branches }) => {
      this.companyResults = companies;
      this.departmentResults = departments;
      this.menuResults = menus;
      this.userResults = users.data;
      this.branchList = branches;
    });
  }

  filterBranchByCompany(companyId: number): Promise<void> {
    return new Promise((resolve) => {
      this.masterService.getBranchesByCompanyId(companyId).subscribe(
        (resp) => {
          this.branchList = resp;
          resolve();
        }
      );
    });
  }

  loadAuthorityData() {
    this.masterService.getAuthorityById(this.AuthorityMasterSid).subscribe(
      (resp: any) => {
        if (resp) {
          this.authorityData = resp.authority;
          const selectedBranch = this.branchList.find(b => b.BranchMasterSid === resp.BranchMasterSid);
          this.authorityForm.patchValue({
            ...resp,
            status: resp.status === 'A' ? 'Active' : 'Suspended',
            DepartmentMaster: resp.DepartmentMaster || [],
            BranchMasterSid: resp.BranchMasterSid
          });
          if (selectedBranch) {
          this.authorityForm.get('BranchMasterSid').setValue(selectedBranch.BranchMasterSid, {
            emitEvent: false,
            onlySelf: true
          });
        }
          this.authorityDetailsList = resp.authorityDetail || [];
          this.authorityDetailsLength = this.authorityDetailsList.length;
        } else {
          this.appSettingService.showWarning('Error loading authority');
        }
      },
      (error) => {
        this.appSettingService.showWarning('Error loading authority');
      }
    );
  }

  loadAuthorityDetails() {
    if (this.isEditMode) {
      this.masterService.getAuthorityById(this.AuthorityMasterSid).subscribe(
        (resp: any) => {
          if (resp) {
            this.authorityDetailsList = [...resp.authorityDetail];
            this.authorityDetailsLength = this.authorityDetailsList.length;
          }
        },
        (error) => {
          this.appSettingService.showError('Error loading authority details');
        }
      );
    }
  }

  findusersName(id: number) {
    const user = this.userResults.find(person => person.UserMasterSid === id);
    return user?.userName || 'N/A';
  }

  openAuthorityDetailModal(content: TemplateRef<any>, data?: any) {
    this.initAuthorityDetailForm();
    if (data) {
      this.isModalEditMode = true;
      this.detailData = data;
      this.authorityDetailForm.patchValue({
        UserMasterSid: data.UserMasterSid || '',
        AuthorityLevel: data.AuthorityLevel || '',
        FinalAuthority: data.FinalAuthority || 'Y',
        status: data.status === 'A' ? 'Active' : 'Suspended',
        Remarks: data.Remarks || ''
      });

      if (data.AuthorityDetailSid) {
        this.AuthorityDetailSid = data.AuthorityDetailSid;
      }
    } else {
      this.isModalEditMode = false;
    }
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
  }

  submitAuthorityForm() {
    if (this.isSaving) return; 
    this.isSaving = true;
    
    if (this.authorityForm.invalid) {
      this.authorityForm.markAllAsTouched();
      this.authorityForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly');
      this.isSaving = false;
      return;
    }

    if (!this.isEditMode && this.authorityDetailsLength === 0) {
      this.appSettingService.showWarning('At least one authority detail is required');
      this.isSaving = false;
      return;
    }

    const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
    const CompanyMasterSid = this.appSettingService.userSettingSource.value['userBranchMaster'][0].companyMaster.CompanyMasterSid;
    const formValue = this.authorityForm.value;
    
    const departmentPayload = Array.isArray(formValue.DepartmentMaster) 
      ? formValue.DepartmentMaster.map(dept => dept.toString())
      : [formValue.DepartmentMaster.toString()];
      
     
    const payload = {
      
      ...formValue,
      CompanyMasterSid,
      DepartmentMaster: departmentPayload,
      MenuMaster: parseInt(formValue.MenuMaster),
      status: formValue.status === 'Active' ? 'A' : 'S',
      authorityDetails: this.authorityDetailsList.map(detail => ({
        AuthorityDetailSid: detail.AuthorityDetailSid || undefined,
        UserMasterSid: detail.UserMasterSid,
        AuthorityLevel: detail.AuthorityLevel,
        FinalAuthority: detail.FinalAuthority,
        status: detail.status,
        Remarks: detail.Remarks,
        createdBy: detail.createdBy || createdBy,
        updatedBy: updatedBy
      })),
      createdBy: this.isEditMode ? undefined : createdBy,
      updatedBy: this.isEditMode ? updatedBy : undefined
    };
     console.log(payload)
    const apiCall = this.isEditMode 
      ? this.masterService.updateAuthorityById(this.AuthorityMasterSid, payload)
      : this.masterService.createAuthority(payload);

    apiCall.subscribe(
      (resp: any) => {
        this.isSaving = false;
        if (resp) {
          this.filterBranchByCompany(this.appSettingService.userSettingSource.value['userBranchMaster'][0].companyMaster.CompanyMasterSid)
          .then(() => {
            this.appSettingService.showSuccess(`Authority ${this.isEditMode ? 'Updated' : 'Created'} Successfully`);
            this.route.navigate(['master/authority/list']);
          });
      } else {
        this.appSettingService.showError('Failed to process authority');
      }
      },
      (error) => {
        this.isSaving = false;
        console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} Authority: `, error);
        this.appSettingService.showError(`Failed to ${this.isEditMode ? 'update' : 'create'} authority`);
      }
    );
  }

  submitAuthorityDetailForm() {
    if (this.authorityDetailForm.invalid) {
        this.authorityDetailForm.markAllAsTouched();
        this.authorityDetailForm.updateValueAndValidity();
        this.appSettingService.showWarning('Please fill all required fields correctly');
        return;
    }
    console.log('Before update:', JSON.parse(JSON.stringify(this.authorityDetailsList)));

    const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
    const formValue = this.authorityDetailForm.value;
    
    const payload = {
        ...formValue,
        UserMasterSid: parseInt(formValue.UserMasterSid),
        AuthorityLevel: parseInt(formValue.AuthorityLevel),
        FinalAuthority: formValue.FinalAuthority,
        status: formValue.status === 'Active' ? 'A' : 'S',
        ...(this.isModalEditMode ? { updatedBy } : { createdBy })
    };

    if (this.isModalEditMode && this.isEditMode) {
        // Update existing detail in edit mode
        this.masterService.updateAuthorityDetailById(this.AuthorityDetailSid, payload).subscribe(
            (resp: any) => {
                if (resp) {
                    this.appSettingService.showSuccess('Authority Detail Updated Successfully');
                    this.loadAuthorityData(); // Reload the entire authority data
                    this.closeAuthorityDetailForm();
                } else {
                    this.appSettingService.showError('Failed to update authority detail');
                }
            },
            (error) => {
                console.error('Error updating Authority Detail: ', error);
                this.appSettingService.showError('Failed to update authority detail');
            }
        );
    } else {
        // Add new detail or update existing in create mode
        const newDetail = {
            ...payload,
            UserMasterSid: parseInt(formValue.UserMasterSid),
            userName: this.findusersName(parseInt(formValue.UserMasterSid)),
            status: formValue.status === 'Active' ? 'A' : 'S',
            createdBy: createdBy
        };
        
        if (this.isModalEditMode && !this.isEditMode) {
            // Find the exact index to update using AuthorityDetailSid if available, otherwise UserMasterSid
            const index = this.authorityDetailsList.findIndex(d => 
                (this.AuthorityDetailSid ? d.AuthorityDetailSid === this.AuthorityDetailSid : 
                 d.UserMasterSid === newDetail.UserMasterSid && d.AuthorityLevel === newDetail.AuthorityLevel)
            );
            
            if (index !== -1) {
                // Create a new array with the updated item
                this.authorityDetailsList = [
                    ...this.authorityDetailsList.slice(0, index),
                    newDetail,
                    ...this.authorityDetailsList.slice(index + 1)
                ];
            }
        } else {
            // Add new detail
            this.authorityDetailsList = [...this.authorityDetailsList, newDetail];
        }
        console.log('After local update:', JSON.parse(JSON.stringify(this.authorityDetailsList)));
        
        this.authorityDetailsLength = this.authorityDetailsList.length;
        this.appSettingService.showSuccess('Authority Detail Added Successfully');
        this.closeAuthorityDetailForm();
    }
}

  deleteAuthorityDetail(AuthorityDetailSid: number) {
    const matRef = this.matdial.open(DeleteWarningComponent);
    matRef.afterClosed().subscribe(
      (res) => {
        if (res) {
          if (this.isEditMode) {
            // Delete from server if in edit mode
            this.masterService.deleteAuthorityDetailById(AuthorityDetailSid).subscribe(
              (resp: any) => {
                if (resp) {
                  this.appSettingService.showSuccess("Authority Detail Successfully Deleted");
                  this.loadAuthorityData(); // Reload the entire authority data
                } else {
                  this.appSettingService.showError('Error Deleting Authority Detail');
                }
              },
              (error) => {
                this.appSettingService.showError('Error Deleting Authority Detail');
              }
            );
          } else {
            // Remove from local list if in create mode
            this.authorityDetailsList = this.authorityDetailsList.filter(
              detail => detail.AuthorityDetailSid !== AuthorityDetailSid
            );
            this.authorityDetailsLength = this.authorityDetailsList.length;
            this.appSettingService.showSuccess("Authority Detail Removed");
          }
        }
      }
    );
  }

  closeAuthorityDetailForm() {
    this.authorityDetailForm.reset({
      FinalAuthority: 'Y',
      status: 'Active'
    });
    this.isModalEditMode = false;
    this.modalService.dismissAll();
  }

  navigateBack() {
    history.back();
  }

  resetAuthorityForm() {
    this.authorityForm.reset({
      status: 'Active'
    });
    this.authorityDetailsList = [];
    this.authorityDetailsLength = 0;
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