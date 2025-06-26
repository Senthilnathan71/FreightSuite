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
  isEditMode: boolean;
  isModalEditMode: boolean;
  setErrorMessage: boolean;
  authorityDetailsLength: number;
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
  userResults: any[];
  companyList: any[] = [];
  branchesByCompany: {[key: number]: any[]} = {};
  selectedCompanyId: number | null = null;
  branchList : any[];
  usersTeamList : any[]
  TandCList: any[]=[];
  currentMenuId: any;
  

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
    this.loadAllFields();
    this.loadCompaniesAndBranches();
    // this.loadCustomerSalesperson();

    this.currentRoute.paramMap.subscribe(
      (param) => {
        this.AuthorityMasterSid = +param.get('id');
        if (this.AuthorityMasterSid) {
          this.isEditMode = true;
          this.loadAuthorityData();
        }
      }
    );
  }
  loadCompaniesAndBranches() {
  this.masterService.getAllCompanies().subscribe(companies => {
    this.companyList = companies;
    // companies.forEach(company => {
    //   this.masterService.getBranchesByCompanyId(company.CompanyMasterSid).subscribe(
    //     branches => {
    //       this.branchesByCompany[company.CompanyMasterSid] = branches;
    //     }
    //   );
    // });
  });
}

  onCompanySelect(companyId: number) {
    console.log('Selected company ID:', companyId);
    this.selectedCompanyId = companyId;
   
    this.authorityForm.get('BranchMasterSid').reset();
    
    // If branches aren't pre-loaded, load them now
   if (!this.branchesByCompany[companyId]) {
    this.masterService.getBranchesByCompanyId(companyId).subscribe(
      branches => {
        console.log('Branches received:', branches);
        this.branchesByCompany[companyId] = branches;
      },
      error => {
        console.error('Error loading branches:', error);
      }
    );
  }
}

filterBranchByCompany(company:any){
  this.masterService.getBranchesByCompanyId(company.CompanyMasterSid).subscribe(
    (resp)=>{
      this.branchList = resp;
    }
  )
}

  initAuthorityForm() {
    this.authorityForm = this.fb.group({
      CompanyMasterSid: ['', [Validators.required]],
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
      AuthorityLevel: ['', [Validators.required]],
      FinalAuthority: ['Y', [Validators.required]],
      status: ['Active', [Validators.required]],
      Remarks: ['']
    });
  }

  loadAllFields() {
    forkJoin({
      companies: this.masterService.getAllCompanies(),
      departments: this.masterService.getAllDepartments(),
      menus: this.settingsService.getAllMenu(),
      users: this.masterService.getAllFfUser()
    }).subscribe(({ companies, departments, menus, users }) => {
      this.companyResults = companies;
      this.departmentResults = departments;
      this.menuResults = menus;
      this.userResults = users.data;
      console.log('Departments loaded:', this.departmentResults);
    });
  }
  // loadCustomerSalesperson(){
  //   this.masterService.getAllFfUser().subscribe(
  //     (resp:any)=>{
  //       if(resp.status){
  //         this.usersTeamList = resp.data;
  //       } else {
  //         this.appSettingService.showError('Error loading Customer Salesman')
  //       }
  //     }
  //   )
  //   this.masterService.getAllFfUser().subscribe(
  //     (resp : any)=>{
  //       if(resp.status){
  //         this.userResults = resp.data;
  //       } else { 
  //         this.appSettingService.showError('Error loading All Salesperson')
  //       }
  //     }
  //   )
  // }

  getBranchesByCompany(CompanyMasterSid: number) {
    this.branchResults = [];
    if (this.authorityForm.get('BranchMasterSid').value) {
      this.authorityForm.get('BranchMasterSid').reset();
    }
    this.masterService.getBranchesByCompanyId(CompanyMasterSid).subscribe(
      (resp: any) => {
        this.branchResults = resp;
      }
    );
  }

  loadAuthorityData() {
    this.masterService.getAuthorityById(this.AuthorityMasterSid).subscribe(
      (resp) => {
        this.authorityData = resp;
        this.authorityForm.patchValue({
          ...resp,
          status: resp.status === 'A' ? 'Active' : 'Suspended',
          DepartmentMaster: resp.DepartmentMaster || []
        });
        this.getBranchesByCompany(resp.CompanyMasterSid);
      },
      (error) => {
        this.appSettingService.showWarning('Error Loading Authority');
      }
    );
    this.loadAuthorityDetails();
  }

 loadAuthorityDetails() {
  console.log('Loading details for AuthorityMasterSid:', this.AuthorityMasterSid);
  this.masterService.getAllAuthorityDetails().subscribe(
    (details: any) => {
      console.log('All details from API:', details);
      this.authorityDetailsList = details.filter(detail => 
        detail.AuthorityMasterSid === this.AuthorityMasterSid
      );
      console.log('Filtered details:', this.authorityDetailsList);
      this.authorityDetailsLength = this.authorityDetailsList.length;
      console.log('Details length:', this.authorityDetailsLength);
    }
  );
}

  findusersName(id: number) {
  const user = this.userResults.find(person => person.UserMasterSid === id);
  return user?.userName;
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
    }
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
  }

  submitAuthorityForm() {
    if (this.authorityForm.invalid) {
      this.authorityForm.markAllAsTouched();
      this.authorityForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly');
      return;
    }

    const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
    const formValue = this.authorityForm.value;
    let departmentPayload;
  const selectedDepartments = formValue.DepartmentMaster || [];
  departmentPayload = selectedDepartments.map(dept => dept.toString());

    
    const payload = this.isEditMode ? {
      ...formValue,
      DepartmentMaster: departmentPayload,
      MenuMaster: parseInt(formValue.MenuMaster),
      status: formValue.status === 'Active' ? 'A' : 'S',
      updatedBy: updatedBy
    } : {
      ...formValue,
      DepartmentMaster: departmentPayload,
      MenuMaster: parseInt(formValue.MenuMaster),
      status: formValue.status === 'Active' ? 'A' : 'S',
      createdBy: createdBy
    };
    console.log('Final payload:', payload);

    if (this.isEditMode) {
      this.masterService.updateAuthorityById(this.AuthorityMasterSid, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Authority Updated Successfully');
            this.route.navigate(['master/authority/list']);
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          console.error('Error updating Authority: ', error);
        }
      );
    } else {
      this.masterService.createAuthority(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Authority Created Successfully');
            this.route.navigate(['master/authority/list']);
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          console.error('Error creating Authority: ', error);
        }
      );
    }
  }

  submitAuthorityDetailForm() {
    if (this.authorityDetailForm.invalid) {
      this.authorityDetailForm.markAllAsTouched();
      this.authorityDetailForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly');
      return;
    }

    const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
    const formValue = this.authorityDetailForm.value;
    
    const payload = {
      ...formValue,
      CompanyMasterSid: this.authorityForm.get('CompanyMasterSid').value,
      BranchMasterSid: this.authorityForm.get('BranchMasterSid').value, 
      UserMasterSid: parseInt(formValue.UserMasterSid),
      FinalAuthority: formValue.FinalAuthority,
      status: formValue.status === 'Active' ? 'A' : 'S',
      ...(this.isModalEditMode ? { updatedBy: updatedBy } : { createdBy: createdBy })
    };

    if (this.isModalEditMode) {
      this.masterService.updateAuthorityDetailById(this.AuthorityDetailSid, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Authority Detail Updated Successfully');
            this.loadAuthorityDetails();
            this.closeAuthorityDetailForm();
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          console.error('Error updating Authority Detail: ', error);
        }
      );
    } else {
      this.masterService.createNewAuthorityDetail(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Authority Detail Created Successfully');
            this.loadAuthorityDetails();
            this.closeAuthorityDetailForm();
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          console.error('Error creating Authority Detail: ', error);
        }
      );
    }
  }

  deleteAuthorityDetail(AuthorityDetailSid: number) {
    const matRef = this.matdial.open(DeleteWarningComponent);
    this.modalService.dismissAll();
    matRef.afterClosed().subscribe(
      (res) => {
        if (res) {
          this.masterService.deleteAuthorityDetailById(AuthorityDetailSid).subscribe(
            (resp: any) => {
              if (resp) {
                this.appSettingService.showSuccess("Authority Detail Successfully Deleted");
                this.loadAuthorityDetails();
              } else {
                this.appSettingService.showError('Error Deleting Authority Detail');
              }
            },
          );
        }
      }
    );
  }

  closeAuthorityDetailForm() {
    this.authorityDetailForm.reset();
    this.isModalEditMode = false;
    this.modalService.dismissAll();
  }

  navigateBack() {
    history.back();
  }

  resetAuthorityForm() {
    this.authorityForm.reset();
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