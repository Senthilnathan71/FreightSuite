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
    ReactiveFormsModule
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {

  searchType: string = "userName";
  filterValue: string;
  results: any[];
  userList: any[];
  searchPerformed: boolean;
  userData: any;
  loading: boolean = false;
  alluser: any[] = []
  // pagination values
  page = 1;
  pageSize = 10;
  totalNumberOfCollection: number;
  isFavorite: boolean = false;
  resetPasswordForm !:FormGroup
  passwordView : boolean;
  passwordView1 : boolean;
  UserMasterSid : boolean;
  modalRef : NgbModalRef

    // sorting
  sortColumn: string = '=userName'; // default sort column
  sortDirection: string = 'asc'; // default sort direction
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 

  constructor(
    private masterServ: MasterService,
    private dialog: MatDialog,
    private appSettingServ: AppSettingsService,
    private router: Router,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private fb:FormBuilder,
    private modalService : NgbModal
  ) { }

  ngOnInit() {
    this.appSettingServ.getUser().subscribe(
      user => {
        if (user) {
          this.userData = user;
        }
      }
    )
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
  search(event?: any) {
  const payload = {
    searchType: event?.type || this.searchType,
    filterValue: event?.value || this.filterValue
  };

  this.loading = true;
  this.masterServ.searchFfUser(payload).subscribe(
    (res) => {
      this.alluser = Array.isArray(res) ? res : res.data || []; 
      this.applySorting();
      this.userList = [...this.alluser];
      this.totalNumberOfCollection = this.userList.length || 0;
      this.searchPerformed = true;
      this.page = 1;
      this.updatePaginationData();
      this.loading = false;
    },
    (err) => {
      console.error('Search error:', err);
      this.loading = false;
    }
  );
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
    
    this.applySorting();
    this.updatePaginationData();
  }

  applySorting() {
    this.alluser.sort((a, b) => {
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


  updatePaginationData() {
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
     this.userList= this.alluser.slice(start, end);
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
              this.search(null)
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

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

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
    this.searchPerformed = false;
    this.totalNumberOfCollection = 0;
  }

  initResetPassForm() {
    this.resetPasswordForm = this.fb.group({
      password: ["", [
        Validators.required,
        this.passwordValidator()
      ]],
      confirmPassword: ["", [Validators.required,this.confirmPasswordValidator()]]
    });
    this.resetPasswordForm.get('password')?.valueChanges.subscribe(
      ()=>{
        this.resetPasswordForm.get('confirmPassword').updateValueAndValidity()
      }
    )
  }

  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      if (!value) {
        return null;
      }

      const errors: any = {};

      // Check individual requirements
      const hasLetter = /[a-zA-Z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const hasMinLength = value.length >= 4;

      if (!hasLetter) errors.missingLetter = true;
      if (!hasNumber) errors.missingNumber = true;
      if (!hasSpecialChar) errors.missingSpecialChar = true;
      if (!hasMinLength) errors.minLength = true;

      return Object.keys(errors).length > 0 ? errors : null;
    };
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


}
