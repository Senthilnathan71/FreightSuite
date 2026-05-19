import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';

@Component({
  selector: 'app-service-job-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-header modalHeaderpart p-1">
      <h5 class="modal-title text-white">
        <i class="fas fa-file-import me-2"></i>Bulk Upload Service Jobs
      </h5>
      <button type="button" class="btn-close btn-close-white" (click)="onCancel()" [disabled]="isProcessing"></button>
    </div>

    <div class="modal-body">
      <div *ngIf="!showPreview">
        <div class="upload-instructions mb-3">
          <h6 class="fw-bold">Instructions:</h6>
          <ol>
            <li>Download the Excel template before uploading</li>
            <li>Fill service job header, cargo, and rate columns in <strong>ServiceJob_Upload</strong></li>
            <li>Keep the first sample row and notes unchanged; upload processing starts after them</li>
            <li>Upload the completed file, review validation, then confirm upload</li>
          </ol>
        </div>

        <div class="file-upload-box mb-3">
          <input type="file" #fileInput accept=".xlsx,.xls" (change)="onFileSelected($event)" style="display:none" />
          <button type="button" class="btn btn-info btn-sm" (click)="fileInput.click()" [disabled]="isProcessing">
            <i class="fas fa-upload me-1"></i>Select Excel File
          </button>

          <p *ngIf="selectedFile" class="selected-file mb-0 mt-2">
            <i class="fas fa-file-excel me-2 text-success"></i>
            {{ selectedFile.name }}
            <span class="text-muted small ms-2">({{ formatSize(selectedFile.size) }})</span>
          </p>
        </div>

        <div *ngIf="fileError" class="alert alert-danger py-2 small">
          <i class="fas fa-exclamation-circle me-1"></i>{{ fileError }}
        </div>

        <div class="d-flex align-items-center justify-content-between p-2 bg-light rounded">
          <span class="small text-muted">
            <i class="fas fa-info-circle me-1 text-info"></i>
            Download a fresh template for current dropdown values.
          </span>
          <button type="button" class="btn btn-sm btn-outline-info" (click)="downloadTemplate()" [disabled]="downloading">
            <i class="fas" [class.fa-download]="!downloading" [class.fa-spinner]="downloading" [class.fa-spin]="downloading"></i>
            {{ downloading ? 'Downloading...' : 'Download Template' }}
          </button>
        </div>
      </div>

      <div *ngIf="showPreview && !hasErrors()">
        <div class="preview-header p-1 mb-2 d-flex justify-content-between align-items-center">
          <h6 class="fw-bold mb-0">Review Service Jobs</h6>
          <button type="button" class="btn btn-sm btn-info" (click)="onReUpload()">
            <i class="fas fa-sync-alt me-1"></i>Upload Different File
          </button>
        </div>

        <div class="d-flex gap-2 mb-3">
          <span class="badge bg-secondary">Total: {{ serviceJobRows.length }}</span>
          <span class="badge bg-success">Valid: {{ validCount }}</span>
          <span class="badge bg-danger" *ngIf="invalidCount">Invalid: {{ invalidCount }}</span>
        </div>

        <div *ngIf="rowErrors.length" class="mt-2">
          <p class="small fw-semibold text-danger mb-1">
            <i class="fas fa-exclamation-circle me-1"></i>Row Errors:
          </p>
          <ul class="mb-0 ps-3 small text-danger">
            <li *ngFor="let e of rowErrors">Row {{ e.row }}: {{ e.message }}</li>
          </ul>
        </div>
      </div>

      <div class="errors-section" *ngIf="hasErrors()">
        <div class="alert alert-warning">
          <div class="d-flex align-items-center mb-3">
            <i class="fas fa-exclamation-triangle fa-2x me-3"></i>
            <h6 class="mb-0 fw-bold">Validation Errors ({{ errors.length }})</h6>
          </div>
          <div class="error-list">
            <div *ngFor="let error of errors" class="error-item mb-1 small">
              <strong>{{ error.sheet || 'ServiceJob_Upload' }}</strong>
              <span *ngIf="error.row"> - Row {{ error.row }}</span>
              <span> - {{ error.message }}</span>
            </div>
          </div>
          <div class="text-center mt-3">
            <p class="mb-2 small">Fix the errors in your Excel file and upload again.</p>
            <button type="button" class="btn btn-primary btn-sm" (click)="onReUpload()">
              <i class="fas fa-sync-alt me-2"></i>Upload Corrected File
            </button>
          </div>
        </div>
      </div>

      <div class="loading-overlay" *ngIf="isProcessing">
        <div class="spinner-border text-info" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">{{ processingMessage }}</p>
      </div>
    </div>

    <div class="modal-footer">
      <button type="button" class="btn btn-light-secondary btn-sm" (click)="onCancel()" [disabled]="isProcessing">
        Cancel
      </button>
      <button type="button" class="btn btn-success btn-sm" *ngIf="showPreview && !hasErrors()"
              (click)="onConfirmImport()" [disabled]="isProcessing || !validCount">
        <i class="fas fa-database me-1"></i>
        Confirm Upload ({{ validCount }} rows)
      </button>
    </div>
  `,
  styles: [`
    .file-upload-box { display: flex; flex-direction: column; align-items: flex-start; }
    .selected-file { font-size: 13px; }
    .loading-overlay {
      position: absolute; inset: 0; background: rgba(255,255,255,0.8);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 10; border-radius: 4px;
    }
    .error-item { padding: 2px 0; border-bottom: 1px solid #ffc10733; }
  `]
})
export class ServiceJobImportModalComponent implements OnInit {
  @Input() currentCompany: any;
  @Input() currentBranch: any;
  @Input() userData: any;

  selectedFile: File | null = null;
  fileError = '';
  showPreview = false;
  isProcessing = false;
  downloading = false;
  processingMessage = 'Processing...';

  serviceJobRows: any[] = [];
  errors: any[] = [];
  rowErrors: { row: number; message: string }[] = [];
  serviceJobForm!: FormGroup;

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private operationService: OperationService,
    private appSettingsService: AppSettingsService,
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.currentCompany || this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.currentBranch || this.appSettingsService.getCurrentBranchInfo();
    this.userData = this.userData || this.appSettingsService.getDecryptedUserProfile();
    this.initForm();
  }

  initForm(): void {
    this.serviceJobForm = this.fb.group({ rows: this.fb.array([]) });
  }

  get rowsArray(): FormArray {
    return this.serviceJobForm.get('rows') as FormArray;
  }

  get validCount(): number {
    return this.rowsArray.length - this.rowErrors.length;
  }

  get invalidCount(): number {
    return this.rowErrors.length;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.fileError = '';
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      this.fileError = 'Invalid file type. Please upload an .xlsx or .xls file.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.fileError = 'File size exceeds 5 MB limit.';
      return;
    }

    this.selectedFile = file;
    this.parseAndPreview();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  downloadTemplate(): void {
    const companyId = this.getLoginCompanySid();
    const branchId = this.getLoginBranchSid();
    if (!companyId || !branchId) {
      this.appSettingsService.showError('Company or branch is not selected');
      return;
    }

    this.downloading = true;
    this.operationService.downloadServiceJobTemplate(companyId, branchId).subscribe({
      next: (blob: Blob) => {
        this.downloading = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ServiceJob_Upload_Template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloading = false;
        this.appSettingsService.showError('Failed to download template');
      }
    });
  }

  parseAndPreview(): void {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.processingMessage = 'Parsing file...';
    this.errors = [];
    this.rowErrors = [];

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('CompanyMasterSid', String(this.getLoginCompanySid() || ''));
    formData.append('BranchMasterSid', String(this.getLoginBranchSid() || ''));

    this.operationService.parseServiceJobExcel(formData).subscribe({
      next: (resp: any) => {
        this.isProcessing = false;
        if (!resp?.data) {
          this.fileError = resp?.message || 'Failed to parse file.';
          return;
        }

        const result = resp.data;
        if (result.errors?.length) {
          this.errors = result.errors;
          this.showPreview = false;
          return;
        }

        this.serviceJobRows = [...(result.validRows || []), ...(result.invalidRows || [])];
        if (!this.serviceJobRows.length) {
          this.fileError = 'No rows found in the file.';
          return;
        }

        this.buildRowsForm(result.validRows || [], result.invalidRows || []);
        this.showPreview = true;
        this.appSettingsService.showSuccess('File parsed successfully');
      },
      error: (err: any) => {
        this.isProcessing = false;
        this.fileError = err?.error?.message || 'Failed to parse file. Please try again.';
      }
    });
  }

  buildRowsForm(validRows: any[], invalidRows: any[]): void {
    const allRows = [...validRows, ...invalidRows];
    const controls = allRows.map(row => this.fb.group({
      _rowNum: [row.rowNum],
      row: [row],
    }));
    this.serviceJobForm = this.fb.group({ rows: this.fb.array(controls) });

    this.rowErrors = [];
    allRows.forEach((row: any, index: number) => {
      const errors = row.errors || [];
      if (errors.length) {
        this.rowErrors.push({ row: row.rowNum ?? index + 7, message: errors.join('; ') });
      }
    });
  }

  rowHasError(index: number): boolean {
    const rowNum = this.rowsArray.at(index).get('_rowNum')?.value;
    return this.rowErrors.some(e => e.row === rowNum);
  }

  onConfirmImport(): void {
    if (!this.rowsArray.length || !this.validCount) return;

    const validRows = this.rowsArray.controls
      .filter((_, index) => !this.rowHasError(index))
      .map(ctrl => ctrl.value.row);

    const payload = {
      validRows,
      CompanyMasterSid: this.getLoginCompanySid(),
      BranchMasterSid: this.getLoginBranchSid(),
      createdBy: this.getLoginUserEmail(),
    };

    this.isProcessing = true;
    this.processingMessage = 'Importing service jobs...';

    this.operationService.saveServiceJobExcel(payload).subscribe({
      next: (resp: any) => {
        this.isProcessing = false;
        if (resp?.status) {
          const created = resp.data?.created ?? 0;
          this.appSettingsService.showSuccess(`Import complete - ${created} service job(s) created.`);
          this.activeModal.close(created > 0);
        } else {
          this.appSettingsService.showError(resp?.message || 'Import failed.');
        }
      },
      error: (err: any) => {
        this.isProcessing = false;
        this.appSettingsService.showError(err?.error?.message || 'Import failed. Please try again.');
      }
    });
  }

  onReUpload(): void {
    this.selectedFile = null;
    this.fileError = '';
    this.showPreview = false;
    this.serviceJobRows = [];
    this.errors = [];
    this.rowErrors = [];
    this.initForm();
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  private getLoginCompanySid(): number | null {
    const company = this.appSettingsService.getCurrentCompanyInfo() || this.currentCompany;
    return Number(company?.CompanyMasterSid) || null;
  }

  private getLoginBranchSid(): number | null {
    const branch = this.appSettingsService.getCurrentBranchInfo() || this.currentBranch;
    return Number(branch?.BranchMasterSid) || null;
  }

  private getLoginUserEmail(): string {
    const user = this.userData || this.appSettingsService.getDecryptedUserProfile();
    return user?.userEmail || '';
  }
}
