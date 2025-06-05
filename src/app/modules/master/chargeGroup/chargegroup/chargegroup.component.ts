import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';

@Component({
  selector: 'app-chargegroup',
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
  templateUrl: './chargegroup.component.html',
  styleUrl: './chargegroup.component.scss',
  providers: [DatePipe]
})
export class ChargegroupComponent implements OnInit {
  chargeGroupForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  ChargeGroupSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  chargeGroupList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: NgbModalRef;
  searchType = 'GroupName';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  isLoading = false;
 companyOptions: any[] = [];
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
      this.ChargeGroupSid = +params.get('id');
      if (this.ChargeGroupSid) {
        this.isEditMode = true;
        this.loadChargeGroupData(this.ChargeGroupSid);
      }
    });
    
    this.loadCompanies();

  }
  
toggleStatusControl() {
  const statusControl = this.chargeGroupForm.get('status');
  if (this.isEditMode) {
    statusControl?.enable();
  } else {
    statusControl?.disable();
  }
}
  loadCompanies(): void {
  this.masterService.getAllCompanies().subscribe({
    next: (companies) => {
      this.companyOptions = companies.data || companies;
    },
    error: (error) => {
      console.error('Error loading companies:', error);
      this.appSettingService.showError('Failed to load companies');
    }
  });
}

  initForm() {
    this.chargeGroupForm = this.fb.group({
      CompanyMasterSid: ['', Validators.required],
      GroupName: ['', [Validators.required, Validators.maxLength(100)]],
      Remarks: ['', [Validators.required, Validators.maxLength(100)]],
      status: ['Active', Validators.required]
    });
  }

  resetForm(): void {
    this.chargeGroupForm.reset({
      status: 'Active'
    });
    this.toggleStatusControl(); 
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.toggleStatusControl();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editChargeGroup(id: number, content: any) {
  this.isEditMode = true;
  this.ChargeGroupSid = id;
  this.masterService.getChargeGroupById(id).pipe(take(1)).subscribe({
    next: (response: any) => {
      const chargeGroup = response.data;
      this.chargeGroupForm.patchValue({
        CompanyMasterSid: chargeGroup.CompanyMasterSid,
        GroupName: chargeGroup.GroupName,
        Remarks: chargeGroup.Remarks || '',
        status: chargeGroup.status === 'A' ? 'Active' : 'Suspended'
      });
      this.toggleStatusControl(); // Add this line
      this.modalRef = this.modalService.open(content, {centered: true, size: 'lg', backdrop: 'static'});
    },
    error: (err) => {
      console.error('Error fetching Charge Group', err);
      this.appSettingService.showError('Error fetching data for editing');
    }
  });
}
  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadChargeGroupData(id: number) {
    this.masterService.getChargeGroupById(id).subscribe(
      (response: any) => {
        const data = response.data;
        this.chargeGroupForm.patchValue({
          CompanyMasterSid: data.CompanyMasterSid,
          GroupName: data.GroupName,
          Remarks: data.Remarks,
          status: data.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  onSubmit() {
    if (this.chargeGroupForm.invalid) {
      this.chargeGroupForm.markAllAsTouched();
      this.chargeGroupForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.chargeGroupForm.value;

      const payload = {
        ...formValue,
        ...(this.isEditMode ? updatedBy : createdBy),
        status: formValue.status === "Active" ? "A" : "S",
        CompanyMasterSid: Number(formValue.CompanyMasterSid)
      };

      if (this.isEditMode) {
        this.masterService.updateChargeGroupById(this.ChargeGroupSid, payload).subscribe(
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
        this.masterService.createNewChargeGroup(payload).subscribe(
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

    this.masterService.searchChargeGroups(payload).subscribe((res: any) => {
      this.results = res.data || res;
      this.searchPerformed = true;
      this.updatePaginationData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.chargeGroupList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteChargeGroupById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteChargeGroupById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.search();
        });
      }
    });
  }

  resetPage(): void {
    this.chargeGroupList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'GroupName';
  }

  report(): void {
    // Implement report functionality
  }
}