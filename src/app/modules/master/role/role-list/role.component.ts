import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';

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
    FormsModule
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

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.RoleMasterSid = +params.get('id');
      if (this.RoleMasterSid) {
        this.isEditMode = true;
        this.loadRoleData(this.RoleMasterSid);
      }
    });
  }

  initForm() {
    this.roleForm = this.fb.group({
      UserRoleName: ['', [Validators.required, Validators.maxLength(50)]],
      UserRoleCode: ['', [Validators.required, Validators.maxLength(3), this.alphaNumericValidator()]],
      LicenseType: ['', [Validators.maxLength(50)]],
      status: ['Active', Validators.required]
    });
  }

  private alphaNumericValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z0-9]+$/.test(control.value);
      return valid ? null : { invalidAlphaNumeric: true };
    };
  }

  resetForm(): void {
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
  this.masterService.getRoleById(id).pipe(take(1)).subscribe({
    next: (response: any) => {
      const role = response.data; // Access the data property from the response
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
  this.masterService.getRoleById(id).subscribe(
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
    status: formValue.status === "Active" ? "A" : "S"
  };

      if (this.isEditMode) {
        this.masterService.updateRoleById(this.RoleMasterSid, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.search();
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
        this.masterService.createNewRole(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.search();
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

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue
    };

    this.masterService.searchRole(payload).subscribe((res: any) => {
      this.results = res.data || res;
      this.searchPerformed = true;
      this.updatePaginationData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.roleList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteRoleById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteRoleById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.search();
        });
      }
    });
  }

  resetPage(): void {
    this.roleList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'UserRoleName';
  }

  report(): void {
    // Implement report functionality
  }
}