import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
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
  selector: 'app-package-type-list',
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
  templateUrl: './package-type-list.component.html',
  styleUrl: './package-type-list.component.scss',
  providers: [DatePipe]
})
export class PackageTypeListComponent {
  packageTypeForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  PackageTypeMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  packageTypeList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: NgbModalRef;
  searchType = 'PackageName';
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
  }

  initForm() {
    this.packageTypeForm = this.fb.group({
      PackageName: ['', [Validators.required, Validators.maxLength(100)]],
      PackageCode: ['', [Validators.required, Validators.maxLength(3)]],
      status: ['Active', Validators.required],
      CompanyMasterSid: [2]
    });
  }

  resetForm(): void {
    this.packageTypeForm.reset({
      status: 'Active',
      CompanyMasterSid: 2
    });
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editPackageType(id: number, content: any) {
    this.isEditMode = true;
    this.PackageTypeMasterSid = id;
    this.masterService.getPackageTypeById(id).pipe(take(1)).subscribe({
      next: (response: any) => {
        this.packageTypeForm.patchValue({
          PackageName: response.PackageName,
          PackageCode: response.PackageCode,
          status: response.status === 'A' ? 'Active' : 'Suspended',
          CompanyMasterSid: response.CompanyMasterSid
        });
        this.modalRef = this.modalService.open(content, {centered: true, size: 'lg', backdrop: 'static'});
      },
      error: (err) => {
        console.error('Error fetching Package Type', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  onSubmit() {
    if (this.packageTypeForm.invalid) {
      this.packageTypeForm.markAllAsTouched();
      this.packageTypeForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.packageTypeForm.value;

      const payload = {
        ...formValue,
        ...(this.isEditMode ? updatedBy : createdBy),
        status: formValue.status === "Active" ? "A" : "S"
      };

      if (this.isEditMode) {
        this.masterService.updatePackageTypeById(this.PackageTypeMasterSid, payload).subscribe(
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
        this.masterService.createNewPackageType(payload).subscribe(
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

    this.masterService.searchPackageType(payload).subscribe((res: any) => {
      this.results = res.data || res;
      this.searchPerformed = true;
      this.updatePaginationData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.packageTypeList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deletePackageTypeById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deletePackageById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.search();
        });
      }
    });
  }

  resetPage(): void {
    this.packageTypeList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'PackageName';
  }

  report(): void {
    // Implement report functionality
  }
}