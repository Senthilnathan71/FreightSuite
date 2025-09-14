import { Component, TemplateRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { PasswordValidators } from 'src/app/core/ValidationFn/password.validators';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    FeatherModule,
    FormsModule,
    CommonModule,
    RouterModule,
    NgbPaginationModule,
    ListpageComponent,
    ReactiveFormsModule,
    FavoriteStarComponent,
    NgxSpinnerModule
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {

  searchType: string = "userName";
  filterValue: string;
  results: any[];
  userList: any[];
  searched: boolean = false;
  userData: any;
  loading: boolean = false;
  alluser: any[] = []
  // pagination values
  page = 1;
  pageSize = 15;
  totalNumberOfCollection: number;
  isFavorite: boolean = false;
  resetPasswordForm !:FormGroup
  passwordView : boolean;
  passwordView1 : boolean;
  UserMasterSid : boolean;
  modalRef : NgbModalRef
  permissions: string[] = [];
  currentMenuPermissions: any = {};
    // sorting
  sortColumn: string = 'userName'; // default sort column
  sortDirection: string = 'asc'; // default sort direction
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 

  // Company
  currentCompany : any;
  currentBranch : any;
  constructor(
    private masterServ: MasterService,
    private dialog: MatDialog,
    private appSettingServ: AppSettingsService,
    private appSettingService: AppSettingsService,
    private router: Router,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private fb:FormBuilder,
    private modalService : NgbModal,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    // this.appSettingServ.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       this.checkPermissions();
    //     }
    //   });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
     const userProfile = this.appSettingServ.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
      this.loadUsers();
  }
   checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId);
    console.log(userRole);
    if (currentMenuId && userRole) {
      this.masterServ
        .getRoleMenuPermissions(currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
            console.log(this.permissions);
          },
        });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }
  loadUsers(): void {
    this.spinner.show();
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
    };

    this.masterServ.searchFfUserList(params).subscribe({
      next: (response) => {
        if(response.status){
          this.userList = response.data.items;
          this.results = [...this.userList];
          this.totalNumberOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        }else {
        this.appSettingService.showError(response.message);
      }
      this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.userList = [];
        this.results = [];
        this.totalNumberOfCollection = 0;
      },
    });
  }

  // search(event ?: any) {
  //   const payload = {
  //     searchType: event.type,
  //     filterValue: event.value
  //   }
  //   this.masterServ.searchFfUser(payload).subscribe(
  //     (res) => {
  //       this.results = res.data;
  //       this.searchPerformed = true;
  //       this.updatePaginationData();
  //       this.totalNumberOfCollection = this.results.length || 0;
  //     }
  //   )
  // }
  

  sort(column: string) {
    if (this.sortColumn === column) {
      // Reverse the sort direction if clicking the same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new sort column and default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.applySorting();
  }

  applySorting() {
    this.results.sort((a, b) => {
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
    this.userList = [...this.results];
  }


  updatePaginationData() {
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
    this.loadUsers();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteUser(UserMasterSid) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.masterServ.deleteFfUserById(UserMasterSid).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingServ.showSuccess("Deleted!");
              this.loadUsers();
            } else {
              this.appSettingServ.showError('Error Deleting User');
            }
          },
          (error) => {
            console.error('Error Deleting User', error);
          }
        );
      }
    })
  }

  nagivateTocreateUser() {
    this.router.navigate(['master/user/entry']);
  }

  report(): void {
    const formattedData = this.userList.map(item => ({
      ...item,
      salesperson : item.isSalesperson === '1' ? 'Yes' : 'No',
      status : item.status === 'A' ? 'Active' : 'Suspended'
    }));

    // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
    const companyName = this.currentCompany?.companyName ?? 'Company';
    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'userName', label: 'User Name' },
        { key: 'userEmail', label: 'Email' },
        { key: 'salesperson', label: 'isSalesman' },
        { key: 'status', label: 'Status' },
      ],
      fileName: 'User-Report',
      title: companyName
    });
  }

  reset() {
    this.userList = [];
    this.searchType = 'userName';
    this.filterValue = '';
    this.searched = false;
    this.totalNumberOfCollection = 0;
    this.loadUsers();
  }

  initResetPassForm() {
    this.resetPasswordForm = this.fb.group({
      password: ["", [
        Validators.required,
        PasswordValidators.validate()
      ]],
      confirmPassword: ["", [Validators.required,this.confirmPasswordValidator()]]
    });
    this.resetPasswordForm.get('password')?.valueChanges.subscribe(
      ()=>{
        this.resetPasswordForm.get('confirmPassword').updateValueAndValidity()
      }
    )
  }


  confirmPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!this.resetPasswordForm) return null;

      const password = this.resetPasswordForm.get('password')?.value;
      const confirmPassword = control.value;

      // Only validate if both fields have values
      if (!password || !confirmPassword) {
        return null;
      }

      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  openChangePassword(content:TemplateRef<any>,UserMasterSid){
    this.initResetPassForm();
    this.UserMasterSid = UserMasterSid;
    if(this.UserMasterSid){
      this.modalRef = this.modalService.open(content,{size: 'lg',centered : true,backdrop : 'static'})
    }
  }

  onSubmitPassForm(){
    if(this.resetPasswordForm.invalid){
      this.resetPasswordForm.markAllAsTouched();
      this.resetPasswordForm.updateValueAndValidity();
      this.appSettingServ.showWarning('Please fill all the required fields correctly.')
      return;
    }

    const currentUserEmail = this.appSettingServ.userSettingSource.value['userEmail'];
    const formValue = this.resetPasswordForm.value;
    const payload = {
      password :formValue.password,
      updatedBy : currentUserEmail
    }

    this.masterServ.resetUserPassword(this.UserMasterSid,payload).subscribe(
      (resp:any)=>{
        if(resp.status){
          this.appSettingServ.showSuccess('Password changed Successfully');
          this.modalRef.close()
        } else {
          this.appSettingServ.showError('Error Changing Password');
          console.error(resp.message)
        }
      }
    )

  }


  togglePassword(isPassword: boolean,input:HTMLInputElement): void {
    if(isPassword){
      this.passwordView = !this.passwordView
      input.type = 'text'
    } else {
      this.passwordView1 = !this.passwordView1
      input.type = 'text'
    }
  }

  viewPassword(isPassword: boolean,input:HTMLInputElement): void {
    if(input.type === 'password'){
      return;
    }
    if(isPassword){
      this.passwordView = !this.passwordView
      input.type = 'password'
    } else {
      this.passwordView1 = !this.passwordView1
      input.type = 'password'
    }
  }

  clearFilterValue(){
      this.filterValue = '';
    }
}
