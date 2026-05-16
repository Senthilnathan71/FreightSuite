import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from 'src/app/modules/master/master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-coa-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <!-- Header -->
    <div class="modal-header modalHeaderpart p-1">
      <h5 class="modal-title text-white">
        <i class="fas fa-file-import me-2"></i>Bulk Upload Chart of Accounts
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
            <li>Fill in entries in the <strong>COA</strong> sheet — one row per account</li>
            <li>
              Hierarchy rules:
              <ul>
                <li><strong>Group</strong> — only Category + Group Name required</li>
                <li><strong>Subgroup</strong> — Group Name (from existing groups) + Subgroup Name</li>
                <li><strong>Ledger</strong> — Group + Subgroup (from existing) + Ledger Name &amp; Code</li>
              </ul>
            </li>
            <li>Upload the completed file, review, then click <strong>Confirm Upload</strong></li>
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
          <h6 class="fw-bold mb-0">Review Chart of Accounts</h6>
          <button type="button" class="btn btn-sm btn-info" (click)="onReUpload()">
            <i class="fas fa-sync-alt me-1"></i>Upload Different File
          </button>
        </div>

        <!-- Summary badges -->
        <div class="d-flex gap-2 mb-3">
          <span class="badge bg-secondary">Total: {{ coaData.length }}</span>
          <span class="badge bg-success">Valid: {{ validCount }}</span>
          <span class="badge bg-warning text-dark" *ngIf="warningCount">Warnings: {{ warningCount }}</span>
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

        <!-- Preview table -->
        <div class="charges-table-wrapper mt-3" *ngIf="coaArray.length">
          <table class="table table-bordered table-hover preview-table">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>Ledger Category</th>
                <th>Group Name</th>
                <th>Sub Group</th>
                <th>Ledger Name</th>
                <th>Ledger Code</th>
                <th>Ledger Type</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody [formGroup]="coaForm">
              <ng-container formArrayName="coa">
                <tr *ngFor="let row of coaArray.controls; let i = index"
                    [formGroupName]="i"
                    [class.table-danger]="rowHasError(i)"
                    [class.table-warning]="rowHasWarning(i)">
                  <td class="text-muted small">{{ row.get('_rowNum')?.value }}</td>
                  <td>{{ row.get('category')?.value }}</td>
                  <td>{{ row.get('ledgerCategory')?.value }}</td>
                  <td>{{ row.get('groupName')?.value }}</td>
                  <td>{{ row.get('subGroupName')?.value }}</td>
                  <td>{{ row.get('ledgerName')?.value }}</td>
                  <td>{{ row.get('ledgerCode')?.value }}</td>
                  <td>{{ row.get('ledgerType')?.value }}</td>
                  <td>
                    <span class="badge"
                      [class.bg-success]="row.get('status')?.value?.toLowerCase() === 'active' || row.get('status')?.value === 'A'"
                      [class.bg-secondary]="row.get('status')?.value?.toLowerCase() !== 'active' && row.get('status')?.value !== 'A'">
                      {{ row.get('status')?.value }}
                    </span>
                  </td>
                  <td>
                    <button type="button" class="btn btn-sm btn-outline-danger py-0 px-1"
                            (click)="removeRow(i)" title="Remove row">
                      <i class="fas fa-times"></i>
                    </button>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
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
              <span> – {{ error.field || error.message }}</span>
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
        Confirm Upload ({{ validCount }} rows)
      </button>
    </div>
  `,
  styles: [`
    .file-upload-box { display: flex; flex-direction: column; align-items: flex-start; }
    .selected-file { font-size: 13px; }

    .charges-table-wrapper { max-height: 360px; overflow-y: auto; border-radius: 8px; border: 1px solid #dee2e6; }
    .preview-table { font-size: 12px; margin-bottom: 0; }
    .preview-table th { position: sticky; top: 0; z-index: 1; font-size: 11px; white-space: nowrap; background: #f8f9fa; }

    .loading-overlay {
      position: absolute; inset: 0; background: rgba(255,255,255,0.85);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 10; border-radius: 4px;
    }

    .error-item { padding: 2px 0; border-bottom: 1px solid #ffc10733; }
  `]
})
export class CoaImportModalComponent implements OnInit {
  @Input() currentCompany: any;
  @Input() currentBranch: any;
  @Input() userData: any;

  // State
  selectedFile: File | null = null;
  fileError = '';
  showPreview = false;
  isProcessing = false;
  downloading = false;
  processingMessage = 'Processing...';

  // Data
  coaData: any[] = [];
  errors: any[] = [];
  rowErrors: { row: number; message: string }[] = [];
  rowWarnings: { row: number; message: string }[] = [];

  // Form
  coaForm!: FormGroup;

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
    this.coaForm = this.fb.group({ coa: this.fb.array([]) });
  }

  get coaArray(): FormArray {
    return this.coaForm.get('coa') as FormArray;
  }

  get validCount(): number {
    return this.coaArray.controls.filter((_, i) => !this.rowHasError(i)).length;
  }

  get invalidCount(): number {
    return this.rowErrors.length;
  }

  get warningCount(): number {
    return this.rowWarnings.length;
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
    this.masterService.downloadCoaTemplate(this.currentCompany?.CompanyMasterSid).subscribe({
      next: (blob: Blob) => {
        this.downloading = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'COA_Upload_Template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloading = false;
        this.appSettingsService.showError('Failed to download template');
      }
    });
  }

  // ── Parse Excel → call backend ───────────────────────────────────────────────

  parseAndPreview() {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.processingMessage = 'Parsing file...';
    this.errors = [];
    this.rowErrors = [];
    this.rowWarnings = [];

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('CompanyMasterSid', String(this.currentCompany?.CompanyMasterSid));

    this.masterService.parseCoaExcel(formData).subscribe({
      next: (resp: any) => {
        this.isProcessing = false;

        if (!resp?.data) {
          this.fileError = resp?.message || 'Failed to parse file.';
          return;
        }

        const result = resp.data;

        // Surface backend structural errors
        if (result.errors?.length) {
          this.errors = result.errors;
          this.showPreview = false;
          return;
        }

        this.coaData = [...(result.validRows || []), ...(result.invalidRows || [])];

        if (!this.coaData.length) {
          this.fileError = 'No rows found in the file.';
          return;
        }

        this.buildCoaForm(result.validRows || [], result.invalidRows || []);
        this.showPreview = true;
        this.appSettingsService.showSuccess('File parsed successfully');
      },
      error: (err: any) => {
        this.isProcessing = false;
        this.fileError = err?.error?.message || 'Failed to parse file. Please try again.';
      }
    });
  }

  buildCoaForm(validRows: any[], invalidRows: any[]) {
    const allRows = [...validRows, ...invalidRows];

    const coaGroups = allRows.map((row: any) => {
      return this.fb.group({
        category:       [row.category       ?? ''],
        ledgerCategory: [row.ledgerCategory  ?? ''],
        groupName:      [row.groupName       ?? ''],
        subGroupName:   [row.subGroupName    ?? ''],
        ledgerName:     [row.ledgerName      ?? ''],
        ledgerCode:     [row.ledgerCode      ?? ''],
        ledgerType:     [row.ledgerType      ?? ''],
        reportType:     [row.reportType      ?? ''],
        currency:       [row.currency        ?? ''],
        remarks:        [row.remarks         ?? ''],
        subledgerName:  [row.subledgerName   ?? 'N'],
        jobNoRequire:   [row.jobNoRequire    ?? 'N'],
        hsnRequire:     [row.hsnRequire      ?? 'N'],
        status:         [row.status          ?? 'Active'],
        // Internal meta
        _rowNum:        [row.rowNum          ?? ''],
        _resolvedStatus:[row.resolvedStatus  ?? 'A'],
      });
    });

    this.coaForm = this.fb.group({ coa: this.fb.array(coaGroups) });

    // Map row errors and warnings from backend
    this.rowErrors = [];
    this.rowWarnings = [];

    allRows.forEach((row: any) => {
      if (row.errors?.length) {
        this.rowErrors.push({ row: row.rowNum, message: row.errors.join('; ') });
      }
      if (row.warnings?.length) {
        this.rowWarnings.push({ row: row.rowNum, message: row.warnings.join('; ') });
      }
    });
  }

  // ── Row helpers ──────────────────────────────────────────────────────────────

  rowHasError(index: number): boolean {
    const rowNum = this.coaArray.at(index).get('_rowNum')?.value;
    return this.rowErrors.some(e => e.row === rowNum);
  }

  rowHasWarning(index: number): boolean {
    const rowNum = this.coaArray.at(index).get('_rowNum')?.value;
    return this.rowWarnings.some(e => e.row === rowNum);
  }

  removeRow(index: number) {
    const rowNum = this.coaArray.at(index).get('_rowNum')?.value;
    this.coaArray.removeAt(index);
    this.rowErrors   = this.rowErrors.filter(e => e.row !== rowNum);
    this.rowWarnings = this.rowWarnings.filter(e => e.row !== rowNum);
  }


  onConfirmImport() {
    if (!this.coaArray.length || !this.validCount) return;

    const validRows = this.coaArray.controls
      .filter((_, i) => !this.rowHasError(i))
      .map(ctrl => {
        const val = ctrl.value;
        const { _rowNum, _resolvedStatus, ...rest } = val;
        return { ...rest, resolvedStatus: _resolvedStatus };
      });

    const payload = {
      validRows,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      createdBy: this.userData?.userEmail || ''
    };

    this.isProcessing = true;
    this.processingMessage = 'Importing chart of accounts...';

    this.masterService.saveCoaExcel(payload).subscribe({
      next: (resp: any) => {
        this.isProcessing = false;
        if (resp?.data) {
          const created = resp.data.created ?? 0;
          this.appSettingsService.showSuccess(
            `Import complete — ${created} account(s) created.`
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
    this.selectedFile  = null;
    this.fileError     = '';
    this.showPreview   = false;
    this.coaData       = [];
    this.errors        = [];
    this.rowErrors     = [];
    this.rowWarnings   = [];
    this.initForm();
  }

  onCancel()  { this.activeModal.dismiss(); }
  hasErrors() { return this.errors.length > 0; }
}