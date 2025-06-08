import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbModal, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';

import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-module',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    FeatherModule,
    NgbModalModule,
    NgbPaginationModule,
    NgSelectModule
  ],
  templateUrl: './module.component.html',
  styleUrls: ['./module.component.scss']
})
export class ModuleComponent implements OnInit {
  moduleForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  ModuleMasterSid!: number;
  moduleList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: any;
  userData : any;
  
  searchType = 'ModuleName';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 10;
  totalAmountOfCollection = 0;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.appSettingService.getUser().subscribe(
      user => {
        if (user) {
          this.userData = user;
        }
      }
    )
  }

  initForm() {
    this.moduleForm = this.fb.group({
      ModuleName: ['', [Validators.required, Validators.maxLength(50)]],
      ModuleCode: ['', [Validators.required, Validators.maxLength(20)]],
      status: [{value: 'Active', disabled: false}, Validators.required],
      Remarks: ['', [Validators.required, Validators.maxLength(300)]]
    });
  }
  resetForm(): void {
    
    this.moduleForm.get('status')?.disable();
    this.moduleForm.reset({
      status: 'Active'
    });
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editModule(id: number, content: any) {
    this.isEditMode = true;
    this.ModuleMasterSid = id;
    this.masterService.getModuleById(id).subscribe({
      next: (response: any) => {
        const module = response.data;
        this.moduleForm.get('status')?.enable();
        this.moduleForm.patchValue({
          ModuleName: module.ModuleName,
          ModuleCode: module.ModuleCode,
          Remarks: module.Remarks,
          status: module.status === 'A' ? 'Active' : 'Suspended'
        });
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
      },
      error: (err) => {
        console.error('Error fetching Module', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  onSubmit() {
    if (this.moduleForm.get('status')?.disabled) {
      this.moduleForm.get('status')?.enable();
    }
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      this.moduleForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const formValue = this.moduleForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const payload = {
      ...formValue,
      status: formValue.status === "Active" ? "A" : "S",
      ...(this.isEditMode ? { updatedBy: userEmail } : { createdBy: userEmail })
    };

    const operation = this.isEditMode 
      ? this.masterService.updateModuleById(this.ModuleMasterSid, payload)
      : this.masterService.createNewModule(payload);

    operation.subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message || 'Operation successful');
          this.closeModal();
          this.onSearch();
        } else {
          this.appSettingService.showError(resp.message || 'Operation failed');
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.appSettingService.showError('An error occurred');
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  onSearch() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue
    };

    this.masterService.searchModule(payload).subscribe({
      next: (res: any) => {
        this.results = res.data || res;
        this.searchPerformed = true;
        this.updatePaginationData();
        this.totalAmountOfCollection = this.results.length;
      },
      error: (err) => {
        console.error('Search error:', err);
      }
    });
  }

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.moduleList = this.results.slice(startIndex, endIndex);
  }

  deleteModuleById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.masterService.deleteModuleById(id).subscribe({
          next: (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess('Module deleted successfully');
              this.onSearch();
            }
          },
          error: (err) => {
            console.error('Delete error:', err);
          }
        });
      }
    });
  }

  reset() {
    this.moduleList = [];
    this.totalAmountOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'ModuleName';
  }
  trackByIndex(index: number, item: any): number {
  return index; // or return item.ModuleMasterSid if you want to track by ID
}

  report(): void {
    const formattedData = this.moduleList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'ModuleName', label: 'Module Name' },
        { key: 'ModuleCode', label: 'Module Code' },
        { key: 'Remarks', label: 'Remarks' },
        { key: 'status', label: 'Status' },
      ],
      fileName: 'Module-Report',
      title: companyName
    });
  }
}