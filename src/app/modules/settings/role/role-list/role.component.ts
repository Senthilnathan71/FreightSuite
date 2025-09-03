import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { SettingsService } from '../../settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from '../../email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from '../../edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [
    NgbModalModule,
    FeatherModule,
    NgSelectModule,
    CommonModule,
    ReactiveFormsModule,
    NgbPagination,
    RouterModule,
    FormsModule,
    DatePipe,
    PreventMultiClickDirective,
    FavoriteStarComponent,
    NgxSpinnerModule
  ],
  templateUrl: './role.component.html',
  styleUrl: './role.component.scss',
  providers: [DatePipe]
})
export class RoleComponent implements OnInit {
  roleForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  RoleMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  roleList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: NgbModalRef;
  searchType = 'UserRoleName';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  isLoading = false;
  userData : any;
  roleData : any;
  currentMenuId: number;
  TandCList: any;
  isFavorite: boolean = false;
  sortColumn: string = 'UserRoleName'; 
  sortDirection: string = 'asc';
  
  // Company
  currentCompany : any;
  currentBranch : any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private userService: authService,
    private excelReportService: ExcelExportService,
     private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //     }
    //   }
    // )
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
		}

    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.RoleMasterSid = +params.get('id');
      if (this.RoleMasterSid) {
        this.isEditMode = true;
        this.loadRoleData(this.RoleMasterSid);
      }
    });
    this.loadRoles();
  }
  loadRoles(): void {
  this.spinner.show();
  this.isLoading = true;
  let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize,
    sortColumn: this.sortColumn,
    sortDirection: this.sortDirection,
    activeCompanyId : CompanyMasterSid
  };

  this.settingsService.searchRole(params).subscribe({
    next: (response: any) => {
      if(response.status){
        this.roleList = response.data.items || response.data;
        this.totalLengthOfCollection = response.data.totalCount || response.length;
        this.applySorting();
        this.searchPerformed = true;
      }else {
        this.appSettingService.showError(response.message);
      }
      this.spinner.hide();
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Error fetching roles:', err);
      this.roleList = [];
      this.totalLengthOfCollection = 0;
      this.isLoading = false;
    }
  });
}

  initForm() {
    this.roleForm = this.fb.group({
      UserRoleName: ['', [Validators.required, Validators.maxLength(50), this.alphaSpaceValidator()]],
    UserRoleCode: ['', [
      Validators.required,
      Validators.maxLength(3),
      Validators.minLength(3),
      this.alphaValidator() 
    ]],
    LicenseType: ['', [
      Validators.maxLength(50),
      this.alphaSpaceValidator() 
    ]],
      status: [{value: 'Active', disabled: false}, Validators.required]
    });
    this.roleForm.get('UserRoleCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.roleForm.get('UserRoleCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }
  
  
   private alphaValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z]+$/.test(control.value);
      return valid ? null : { invalidAlpha: true };
    };
  }

   private alphaSpaceValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z\s]+$/.test(control.value);
      return valid ? null : { invalidAlphaSpace: true };
    };
  }
onKeyPress(event: KeyboardEvent, field: string) {
 if (field === 'UserRoleCode') {
      const pattern = /[A-Za-z]/;
      if (!pattern.test(event.key)) {
        event.preventDefault();
      }
  } else if (field === 'UserRoleName') {
    const pattern = /[A-Za-z\s]/;
    if (!pattern.test(event.key)) {
      event.preventDefault();
    }
  } else if (field === 'LicenseType') {
    const pattern = /[A-Za-z\s]/;
    if (!pattern.test(event.key)) {
      event.preventDefault();
    }
  }
}

  resetForm(): void {
    this.roleForm.get('status')?.disable();
    this.roleForm.reset({
      status: 'Active'
    });
  }

 openModal(content: any): void {
  this.isEditMode = false;
  this.resetForm();
  this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
}

  editRole(id: number, content: any) {
  this.isEditMode = true;
  this.RoleMasterSid = id;
  this.settingsService.getRoleById(id).pipe(take(1)).subscribe({
    next: (response: any) => {
      const role = response.data; 
      this.roleData = role;
      this.roleForm.get('status')?.enable();
      this.roleForm.patchValue({
        UserRoleName: role.UserRoleName,
        UserRoleCode: role.UserRoleCode,
        LicenseType: role.LicenseType || '',
        status: role.status === 'A' ? 'Active' : 'Suspended'
      });
      this.roleForm.get('status')?.enable();
      this.modalRef = this.modalService.open(content, {centered: true, size: 'lg', backdrop: 'static'});
    },
    error: (err) => {
      console.error('Error fetching Role', err);
      this.appSettingService.showError('Error fetching data for editing');
    }
  });
}
  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadRoleData(id: number) {
  this.settingsService.getRoleById(id).subscribe(
    (response: any) => {
      const data = response.data; // Access the data property from the response
      this.roleForm.patchValue({
        UserRoleName: data.UserRoleName,
        UserRoleCode: data.UserRoleCode,
        LicenseType: data.LicenseType,
        status: data.status === 'A' ? 'Active' : 'Suspended'
      });
    },
    (error) => {
      this.appSettingService.showError('Error loading data.');
    }
  );
}

  onSubmit() {
    if (this.roleForm.get('status')?.disabled) {
      this.roleForm.get('status')?.enable();
    }
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      this.roleForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.roleForm.value;

      const payload = {
    ...formValue,
    ...(this.isEditMode ? updatedBy : createdBy),
    status: formValue.status === "Active" ? "A" : "S",
    CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
  };

      if (this.isEditMode) {
        this.settingsService.updateRoleById(this.RoleMasterSid, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
             
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      } else {
        this.settingsService.createNewRole(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      }
    }
  }

  
  sort(column: string) {
  if (this.sortColumn === column) {
    // Reverse the sort direction if clicking the same column
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new sort column and default to ascending
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }
  
  this.loadRoles();
}

applySorting() {
  this.roleList.sort((a, b) => {
    let valueA = a[this.sortColumn];
    let valueB = b[this.sortColumn];
    
    // Handle null/undefined values
    if (valueA == null) valueA = '';
    if (valueB == null) valueB = '';
    
    // Convert to string for case-insensitive comparison
    valueA = valueA.toString().toLowerCase();
    valueB = valueB.toString().toLowerCase();
  
    if (valueA < valueB) {
      return this.sortDirection === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return this.sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadRoles();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  // deleteRoleById(id: number) {
  //   const dialogRef = this.dialog.open(DeleteWarningComponent);
  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result === true) {
  //       this.settingsService.deleteRoleById(id).subscribe((resp: any) => {
  //         this.appSettingService.showSuccess('Deleted!');
  //         this.search();
  //       });
  //     }
  //   });
  // }

  resetPage(): void {
    this.roleList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'UserRoleName';
    this.sortColumn = 'UserRoleName'; 
    this.sortDirection = 'asc';
  }
  clearFilterValue() {
  this.filterValue = '';
  this.loadRoles();
}

  report(): void {
    const formattedData = this.roleList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

        // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
        const companyName = this.currentCompany?.companyName ?? 'Company';
        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'UserRoleName', label: 'Role Name' },
                { key: 'UserRoleCode', label: 'Role Code' },
                { key: 'LicenseType', label: 'License Type' },
                { key: 'status', label: 'Status' },
            ],
            fileName: 'Role-Report', 
            title: companyName
        });
    }

  showInfo() {
    if (!this.roleData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.roleData;
    modalRef.componentInstance.idLabel = 'Role Id';
    modalRef.componentInstance.idValue = this.roleData?.RoleMasterSid;
  }

  openTandC() {
		this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
		const payload = { MenuMasterSid: this.currentMenuId };
		this.settingsService.getTandCByCondition(payload).subscribe(
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
					modalRef.componentInstance.DocumentSid = this.RoleMasterSid;

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
  if (!this.roleData) return;
  const modalRef = this.modalService.open(EmailEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.roleData;
  modalRef.componentInstance.idLabel = 'Role Id';
  modalRef.componentInstance.idValue = this.roleData?.RoleMasterSid;
}

openAuthority() {
  if (!this.roleData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.roleData;
  modalRef.componentInstance.idLabel = 'Role Id';
  modalRef.componentInstance.idValue = this.roleData?.RoleMasterSid;
}

openEDoc() {
  if (!this.roleData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.roleData;
  modalRef.componentInstance.idLabel = 'Role Id';
  modalRef.componentInstance.idValue = this.roleData?.RoleMasterSid;
}


}