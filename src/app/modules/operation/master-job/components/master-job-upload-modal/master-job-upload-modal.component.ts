import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ExcelUploadService } from 'src/app/shared/services/excel-upload.service';
import { OperationService } from '../../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-master-job-upload-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './master-job-upload-modal.component.html',
  styleUrls: ['./master-job-upload-modal.component.scss']
})
export class MasterJobUploadModalComponent implements OnInit {
  selectedFile: File | null = null;
  masterJobData: any = null;
  houseJobsData: any[] = [];
  errors: any[] = [];
  isProcessing = false;
  showPreview = false;

  masterJobForm!: FormGroup;
  houseJobsForm!: FormGroup;

  // Master Job table columns
  masterJobColumns: string[] = [];
  masterJobDisplayColumns: string[] = [];

  // House Jobs table columns
  houseJobColumns: string[] = [];
  houseJobDisplayColumns: string[] = [];

  currentCompany: any;
  currentBranch: any;
  userData: any;

  constructor(
    public dialogRef: MatDialogRef<MasterJobUploadModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private excelUploadService: ExcelUploadService,
    private operationService: OperationService,
    private appSettingsService: AppSettingsService,
    private spinner: NgxSpinnerService
  ) {
    this.currentCompany = data?.currentCompany;
    this.currentBranch = data?.currentBranch;
    this.userData = data?.userData;
  }

  ngOnInit(): void {
    this.initializeForms();
  }

  initializeForms(): void {
    this.masterJobForm = this.fb.group({});
    this.houseJobsForm = this.fb.group({
      houseJobs: this.fb.array([])
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file
    const validation = this.excelUploadService.validateExcelStructure(file);
    if (!validation.valid) {
      this.appSettingsService.showError(validation.error || 'Invalid file');
      return;
    }

    this.selectedFile = file;
    this.parseExcelFile();
  }

  parseExcelFile(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isProcessing = true;
    this.spinner.show();
    this.errors = [];

    this.excelUploadService.readExcelFile(this.selectedFile)
      .then(result => {
        if (result.errors && result.errors.length > 0) {
          this.errors = result.errors;
          this.appSettingsService.showError('Excel file has validation errors. Please review.');
          this.isProcessing = false;
          this.spinner.hide();
          return;
        }

        this.masterJobData = result.masterJob;
        this.houseJobsData = result.houseJobs;

        // Build forms with the data
        this.buildMasterJobForm();
        this.buildHouseJobsForm();

        this.showPreview = true;
        this.isProcessing = false;
        this.spinner.hide();
        this.appSettingsService.showSuccess('Excel file parsed successfully');
      })
      .catch(error => {
        console.error('Error parsing Excel:', error);
        this.appSettingsService.showError('Error parsing Excel file');
        this.isProcessing = false;
        this.spinner.hide();
      });
  }

  buildMasterJobForm(): void {
    const formGroup: any = {};

    // Get all keys from master job data
    if (this.masterJobData) {
      Object.keys(this.masterJobData).forEach(key => {
        formGroup[key] = [this.masterJobData[key]];
      });

      this.masterJobForm = this.fb.group(formGroup);

      // Set columns for table display
      this.masterJobColumns = Object.keys(this.masterJobData);
      this.masterJobDisplayColumns = this.masterJobColumns.slice(0, 10); // Show first 10 columns
    }
  }

  buildHouseJobsForm(): void {
    const houseJobsArray = this.fb.array(
      this.houseJobsData.map(houseJob => {
        const houseJobGroup: any = {};
        Object.keys(houseJob).forEach(key => {
          houseJobGroup[key] = [houseJob[key]];
        });
        return this.fb.group(houseJobGroup);
      })
    );

    this.houseJobsForm = this.fb.group({
      houseJobs: houseJobsArray
    });

    // Set columns for table display
    if (this.houseJobsData.length > 0) {
      this.houseJobColumns = Object.keys(this.houseJobsData[0]);
      this.houseJobDisplayColumns = this.houseJobColumns.slice(0, 8); // Show first 8 columns
    }
  }

  get houseJobsArray(): FormArray {
    return this.houseJobsForm.get('houseJobs') as FormArray;
  }

  onProceed(): void {
    if (!this.masterJobForm || !this.houseJobsForm) {
      this.appSettingsService.showError('No data to process');
      return;
    }

    // Get form values
    const masterJob = this.masterJobForm.value;
    const houseJobs = this.houseJobsArray.value;

    // Validate required fields
    if (!this.currentCompany?.CompanyMasterSid) {
      this.appSettingsService.showError('Company information missing');
      return;
    }

    if (!this.currentBranch?.BranchMasterSid) {
      this.appSettingsService.showError('Branch information missing');
      return;
    }

    if (!this.userData?.userEmail) {
      this.appSettingsService.showError('User information missing');
      return;
    }

    // Prepare payload
    const payload = {
      masterJob: {
        ...masterJob,
        CompanyMasterSid: this.currentCompany.CompanyMasterSid,
        BranchMasterSid: this.currentBranch.BranchMasterSid,
        DepartmentMasterSid: masterJob.DepartmentMasterSid || 1, // Default department
        CreatedBy: this.userData.userEmail
      },
      houseJobs: houseJobs.map((hj: any) => ({
        ...hj,
        CompanyMasterSid: this.currentCompany.CompanyMasterSid,
        BranchMasterSid: this.currentBranch.BranchMasterSid,
        DepartmentMasterSid: hj.DepartmentMasterSid || masterJob.DepartmentMasterSid || 1,
        CreatedBy: this.userData.userEmail
      })),
      companyMasterSid: this.currentCompany.CompanyMasterSid,
      branchMasterSid: this.currentBranch.BranchMasterSid,
      createdBy: this.userData.userEmail
    };

    this.isProcessing = true;
    this.spinner.show();

    this.operationService.processBulkUpload(payload).subscribe({
      next: (response) => {
        this.spinner.hide();
        this.isProcessing = false;

        if (response.status) {
          this.appSettingsService.showSuccess(response.message || 'Master Job and House Jobs created successfully');
          this.dialogRef.close({ success: true, data: response.data });
        } else {
          if (response.data?.errors) {
            this.errors = response.data.errors;
          }
          this.appSettingsService.showError(response.message || 'Error creating jobs');
        }
      },
      error: (error) => {
        console.error('Error processing bulk upload:', error);
        this.spinner.hide();
        this.isProcessing = false;
        this.appSettingsService.showError('Error processing bulk upload');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onReUpload(): void {
    this.selectedFile = null;
    this.masterJobData = null;
    this.houseJobsData = [];
    this.errors = [];
    this.showPreview = false;
    this.initializeForms();
  }

  getErrorsForSheet(sheetName: string): any[] {
    return this.errors.filter(e => e.sheet === sheetName);
  }

  hasErrors(): boolean {
    return this.errors && this.errors.length > 0;
  }

  // Helper method to get form control for house job
  getHouseJobControl(index: number, fieldName: string): any {
    return this.houseJobsArray.at(index).get(fieldName);
  }

  // Helper method to check if field has error
  hasFieldError(field: string, sheet: string, row?: number): boolean {
    return this.errors.some(e =>
      e.field === field &&
      e.sheet === sheet &&
      (row === undefined || e.row === row)
    );
  }

  // Helper method to get error message for field
  getFieldError(field: string, sheet: string, row?: number): string {
    const error = this.errors.find(e =>
      e.field === field &&
      e.sheet === sheet &&
      (row === undefined || e.row === row)
    );
    return error ? error.message : '';
  }
}
