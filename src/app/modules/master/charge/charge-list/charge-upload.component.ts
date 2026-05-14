import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-charge-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <!-- Header -->
    <div class="modal-header modalHeaderpart p-1">
      <h5 class="modal-title text-white">
        <i class="fas fa-file-import me-2"></i>Bulk Import Charges
      </h5>
      <button type="button" class="btn-close btn-close-white" (click)="onCancel()"
              [disabled]="isProcessing"></button>
    </div>

    <!-- Body -->
    <div class="modal-body">

      <!-- ── UPLOAD STATE ── -->
      <div *ngIf="!showPreview">
        <div class="upload-instructions mb-3">
          <h6 class="fw-bold">Instructions:</h6>
          <ol>
            <li>Download the Excel template if you haven't already</li>
            <li>Fill in charge details in the <strong>Charges</strong> sheet</li>
            <li>Add tax rows in the <strong>Tax Details</strong> sheet (linked by Charge Name)</li>
            <li>Add TDS rows in the <strong>TDS Details</strong> sheet (linked by Charge Name)</li>
            <li>Upload the completed file, review, then click <strong>Confirm Import</strong></li>
          </ol>
        </div>

        <div class="file-upload-box mb-3">
          <input type="file" #fileInput accept=".xlsx,.xls"
                 (change)="onFileSelected($event)" style="display:none" />

          <button type="button" class="btn btn-info btn-sm" (click)="fileInput.click()"
                  [disabled]="isProcessing">
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

        <!-- Template download hint -->
        <div class="d-flex align-items-center justify-content-between p-2 bg-light rounded">
          <span class="small text-muted">
            <i class="fas fa-info-circle me-1 text-info"></i>
            Don't have the template? Download it first.
          </span>
          <button type="button" class="btn btn-sm btn-outline-info"
                  (click)="downloadTemplate()" [disabled]="downloading">
            <i class="fas" [class.fa-download]="!downloading"
               [class.fa-spinner]="downloading" [class.fa-spin]="downloading"></i>
            {{ downloading ? 'Downloading...' : 'Download Template' }}
          </button>
        </div>
      </div>

      <!-- ── PREVIEW STATE ── -->
      <div *ngIf="showPreview && !hasErrors()">
        <div class="preview-header p-1 mb-2 d-flex justify-content-between align-items-center">
          <h6 class="fw-bold mb-0">Review and Edit Charges</h6>
          <button type="button" class="btn btn-sm btn-info" (click)="onReUpload()">
            <i class="fas fa-sync-alt me-1"></i>Upload Different File
          </button>
        </div>

        <!-- Summary badges -->
        <div class="d-flex gap-2 mb-3">
          <span class="badge bg-secondary">Total: {{ chargesData.length }}</span>
          <span class="badge bg-success">Valid: {{ validCount }}</span>
          <span class="badge bg-danger" *ngIf="invalidCount">Invalid: {{ invalidCount }}</span>
        </div>

        <!-- Row-level errors -->
        <div *ngIf="rowErrors.length" class="mt-2">
          <p class="small fw-semibold text-danger mb-1">
            <i class="fas fa-exclamation-circle me-1"></i>Row Errors:
          </p>
          <ul class="mb-0 ps-3 small text-danger">
            <li *ngFor="let e of rowErrors">Row {{ e.row }}: {{ e.message }}</li>
          </ul>
        </div>
      </div>

      <!-- ── VALIDATION ERRORS STATE ── -->
      <div class="errors-section" *ngIf="hasErrors()">
        <div class="alert alert-warning">
          <div class="d-flex align-items-center mb-3">
            <i class="fas fa-exclamation-triangle fa-2x me-3"></i>
            <h6 class="mb-0 fw-bold">Validation Errors ({{ errors.length }})</h6>
          </div>
          <div class="error-list">
            <div *ngFor="let error of errors" class="error-item mb-1 small">
              <strong>{{ error.sheet }}</strong>
              <span *ngIf="error.row"> – Row {{ error.row }}</span>
              <span> – {{ error.field }}: {{ error.message }}</span>
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

      <!-- Loading overlay -->
      <div class="loading-overlay" *ngIf="isProcessing">
        <div class="spinner-border text-info" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">{{ processingMessage }}</p>
      </div>

    </div>

    <!-- Footer -->
    <div class="modal-footer">
      <button type="button" class="btn btn-light-secondary btn-sm"
              (click)="onCancel()" [disabled]="isProcessing">
        Cancel
      </button>
      <button type="button" class="btn btn-success btn-sm"
              *ngIf="showPreview && !hasErrors()"
              (click)="onConfirmImport()"
              [disabled]="isProcessing || !validCount">
        <i class="fas fa-database me-1"></i>
        Confirm Import ({{ validCount }} rows)
      </button>
    </div>
  `,
  styles: [`
    .file-upload-box { display: flex; flex-direction: column; align-items: flex-start; }
    .selected-file { font-size: 13px; }

    .charges-table-wrapper { max-height: 360px; overflow-y: auto; border-radius: 8px; border: 1px solid #dee2e6; }
    .preview-table { font-size: 12px; margin-bottom: 0; }
    .preview-table th { position: sticky; top: 0; z-index: 1; font-size: 11px; white-space: nowrap; }
    .inline-input { min-width: 80px; font-size: 11px; padding: 2px 6px; }

    .loading-overlay {
      position: absolute; inset: 0; background: rgba(255,255,255,0.8);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 10; border-radius: 4px;
    }

    .error-item { padding: 2px 0; border-bottom: 1px solid #ffc10733; }
  `]
})
export class ChargeImportModalComponent implements OnInit {
  @Input() currentCompany: any;
  @Input() currentBranch: any;
  @Input() userData: any;
  @Input() departmentOptions: any[] = [];
  @Input() uomOptions: any[] = [];

  // State
  selectedFile: File | null = null;
  fileError = '';
  showPreview = false;
  isProcessing = false;
  downloading = false;
  processingMessage = 'Processing...';

  // Data
  chargesData: any[] = [];
  chargeColumns: string[] = [];
  errors: any[] = [];
  rowErrors: { row: number; message: string }[] = [];

  // Form
  chargesForm!: FormGroup;

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingsService: AppSettingsService,
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.chargesForm = this.fb.group({ charges: this.fb.array([]) });
  }

  get chargesArray(): FormArray {
    return this.chargesForm.get('charges') as FormArray;
  }

  get validCount(): number {
    return this.chargesArray.length - this.rowErrors.length;
  }

  get invalidCount(): number {
    return this.rowErrors.length;
  }

  // ── File handling ────────────────────────────────────────────────────────────

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.fileError = '';
    const validExt = /\.(xlsx|xls)$/i.test(file.name);
    if (!validExt) {
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

  // ── Download template ────────────────────────────────────────────────────────

  downloadTemplate() {
    this.downloading = true;
    this.masterService.downloadChargeTemplate(this.currentCompany?.CompanyMasterSid).subscribe({
      next: (blob: Blob) => {
        this.downloading = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Charge_Upload_Template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloading = false;
        this.appSettingsService.showError('Failed to download template');
      }
    });
  }

  // ── Parse Excel → build form ─────────────────────────────────────────────────

  parseAndPreview() {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.processingMessage = 'Parsing file...';
    this.errors = [];
    this.rowErrors = [];

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('CompanyMasterSid', String(this.currentCompany?.CompanyMasterSid));

    this.masterService.parseChargeExcel(formData).subscribe({
      next: (resp: any) => {
        this.isProcessing = false;

        if (!resp?.data) {
          this.fileError = resp?.message || 'Failed to parse file.';
          return;
        }

        const result = resp.data;

        // Surface backend structural errors (missing sheets, bad headers, etc.)
        if (result.errors?.length) {
          this.errors = result.errors;
          this.showPreview = false; // Show error state, not preview
          return;
        }

        this.chargesData = [...(result.validRows || []), ...(result.invalidRows || [])];

        if (!this.chargesData.length) {
          this.fileError = 'No rows found in the file.';
          return;
        }

        this.buildChargesForm(result.validRows || [], result.invalidRows || []);
        this.showPreview = true;
        this.appSettingsService.showSuccess('File parsed successfully');
      },
      error: (err: any) => {
        this.isProcessing = false;
        this.fileError = err?.error?.message || 'Failed to parse file. Please try again.';
      }
    });
  }

  buildChargesForm(validRows: any[], invalidRows: any[]) {
    // Derive columns from first available row (exclude meta fields)
    const sampleRow = validRows[0] || invalidRows[0] || {};
    this.chargeColumns = Object.keys(sampleRow).filter(
      k => !['rowNum', 'errors', 'taxRecords', 'tdsRecords'].includes(k)
    );

    const allRows = [...validRows, ...invalidRows];
    const chargeGroups = allRows.map((row: any) => {
      const group: any = {};
      this.chargeColumns.forEach(col => {
        group[col] = [row[col] ?? ''];
      });
      // Stash nested records on the control for display
      group['_taxRecords']  = [row.taxRecords  ?? []];
      group['_tdsRecords']  = [row.tdsRecords  ?? []];
      group['_rowNum']      = [row.rowNum ?? ''];
      return this.fb.group(group);
    });

    this.chargesForm = this.fb.group({ charges: this.fb.array(chargeGroups) });

    // Run frontend UOM/dept validations and tag invalid rows
    this.rowErrors = [];
    allRows.forEach((row: any, i: number) => {
      const backendErrors = row.errors || [];
      const frontendErrors = this.runFrontendValidations(row);
      const allErrors = [...backendErrors, ...frontendErrors];
      if (allErrors.length) {
        this.rowErrors.push({ row: row.rowNum ?? i + 2, message: allErrors.join('; ') });
      }
    });
  }

  // ── Frontend validations (mirrors original logic) ────────────────────────────

  runFrontendValidations(row: any): string[] {
    const errors: string[] = [];
    const uomCode  = (row.uom  || '').toString().trim().toUpperCase();
    const deptRaw  = (row.departments || '').toString().trim();
    if (!uomCode || !deptRaw) return errors;

    const deptNames     = deptRaw.split(';').map((d: string) => d.trim().toLowerCase());
    const selectedDepts = this.departmentOptions.filter(d =>
      deptNames.includes(d.departmentName?.trim().toLowerCase())
    );
    const selectedUOM = this.uomOptions.find(u =>
      u.UOMCode?.trim().toUpperCase() === uomCode
    );
    if (!selectedUOM) return errors;

    const containerUoms = ['CON', '20F', '40F', '45F'];
    if (selectedDepts.some(d => d.FCLLCL === 'FCL') && uomCode === 'CBM') {
      errors.push('CBM is not applicable for FCL department(s)');
    }
    if (selectedDepts.some(d => d.FCLLCL === 'LCL') && containerUoms.includes(uomCode)) {
      errors.push(`${uomCode} is not applicable for LCL department(s)`);
    }
    return errors;
  }

  // ── Row helpers ──────────────────────────────────────────────────────────────

  rowHasError(index: number): boolean {
    const rowNum = this.chargesArray.at(index).get('_rowNum')?.value;
    return this.rowErrors.some(e => e.row === rowNum);
  }

  getTaxCount(index: number): number {
    return (this.chargesArray.at(index).get('_taxRecords')?.value || []).length;
  }

  getTdsCount(index: number): number {
    return (this.chargesArray.at(index).get('_tdsRecords')?.value || []).length;
  }

  removeCharge(index: number) {
    const rowNum = this.chargesArray.at(index).get('_rowNum')?.value;
    this.chargesArray.removeAt(index);
    this.rowErrors = this.rowErrors.filter(e => e.row !== rowNum);
  }

  // ── Confirm import ───────────────────────────────────────────────────────────

  onConfirmImport() {
    if (!this.chargesArray.length || !this.validCount) return;

    // Collect only rows without errors, strip internal fields
    const validRows = this.chargesArray.controls
      .filter((_, i) => !this.rowHasError(i))
      .map(ctrl => {
        const val = ctrl.value;
        const { _taxRecords, _tdsRecords, _rowNum, ...rest } = val;
        return { ...rest, taxRecords: _taxRecords, tdsRecords: _tdsRecords };
      });

    const payload = {
      validRows,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      createdBy: this.userData?.userEmail || ''
    };

    this.isProcessing = true;
    this.processingMessage = 'Importing charges...';

    this.masterService.saveChargeExcel(payload).subscribe({
      next: (resp: any) => {
        this.isProcessing = false;
        if (resp?.data) {
          const created = resp.data.created ?? 0;
          this.appSettingsService.showSuccess(
            `Import complete — ${created} charge(s) created.`
          );
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

  // ── Navigation ───────────────────────────────────────────────────────────────

  onReUpload() {
    this.selectedFile = null;
    this.fileError    = '';
    this.showPreview  = false;
    this.chargesData  = [];
    this.errors       = [];
    this.rowErrors    = [];
    this.initForm();
  }

  onCancel()  { this.activeModal.dismiss(); }
  hasErrors() { return this.errors.length > 0; }
}