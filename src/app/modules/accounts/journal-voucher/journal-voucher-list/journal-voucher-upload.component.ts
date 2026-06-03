import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AccountsService } from '../../accounts.service';

@Component({
  selector: 'app-journal-voucher-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <!-- Header -->
    <div class="modal-header modalHeaderpart p-1">
      <h5 class="modal-title text-white">
        <i class="fas fa-file-import me-2"></i>Bulk Upload Journal Vouchers
      </h5>
      <button type="button" class="btn-close btn-close-white" (click)="onCancel()"
              [disabled]="isProcessing"></button>
    </div>

    <!-- Body -->
    <div class="modal-body" style="position:relative;">

      <!-- ── UPLOAD STATE ── -->
      <div *ngIf="!showPreview">
        <div class="upload-instructions mb-3">
          <h6 class="fw-bold">Instructions:</h6>
          <ol>
            <li>Download the Excel template if you haven't already</li>
            <li>Fill in voucher headers in the <strong>Journal Vouchers</strong> sheet — assign a unique <strong>Sno</strong> (1, 2, 3…) per row</li>
            <li>Fill in debit/credit lines in the <strong>Voucher Details</strong> sheet — set <strong>Sno</strong> to match the header row</li>
            <li>Debits and Credits must balance exactly per Sno group</li>
            <li>The system will auto-generate the Voucher Number on save — do not enter it manually</li>
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
          <h6 class="fw-bold mb-0">Review Journal Vouchers</h6>
          <button type="button" class="btn btn-sm btn-info" (click)="onReUpload()">
            <i class="fas fa-sync-alt me-1"></i>Upload Different File
          </button>
        </div>

        <div class="d-flex gap-2 mb-3">
          <span class="badge bg-secondary">Total: {{ vouchersArray.length }}</span>
          <span class="badge bg-success">Valid: {{ validCount }}</span>
          <span class="badge bg-danger" *ngIf="invalidCount">Invalid: {{ invalidCount }}</span>
        </div>

        <div class="vouchers-list" style="max-height:360px; overflow-y:auto;">
          <div *ngFor="let ctrl of vouchersArray.controls; let i = index"
               class="voucher-card p-2 mb-2 rounded border"
               [class.border-danger]="rowHasError(i)"
               [class.border-success]="!rowHasError(i)">

            <div class="d-flex justify-content-between align-items-start">
              <div class="small">
                <!--
                  _linkSno shown as a temporary reference badge.
                  Tooltip clarifies it is NOT the final voucher number.
                -->
                <span class="badge bg-light text-muted border me-1"
                      title="Excel link key only — Voucher Number will be auto-generated on save">
                  Sno #{{ ctrl.get('_linkSno')?.value }}
                </span>
                <strong>{{ ctrl.get('narration')?.value }}</strong>
                <span class="text-muted ms-2">{{ ctrl.get('voucherDateRaw')?.value }}</span>
              </div>
              <div class="d-flex gap-1 align-items-center">
                <span class="badge bg-info">{{ getDetailCount(i) }} line(s)</span>
                <button type="button" class="btn btn-sm btn-outline-danger py-0 px-1"
                        (click)="removeVoucher(i)" title="Remove this voucher">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div *ngIf="rowHasError(i)" class="mt-1">
              <span class="small text-danger">
                <i class="fas fa-exclamation-circle me-1"></i>{{ getRowError(i) }}
              </span>
            </div>
          </div>
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

      <!-- ── VALIDATION ERRORS STATE ── -->
      <div class="errors-section" *ngIf="hasErrors()">
        <div class="alert alert-warning">
          <div class="d-flex align-items-center mb-3">
            <i class="fas fa-exclamation-triangle fa-2x me-3"></i>
            <h6 class="mb-0 fw-bold">Validation Errors ({{ errors.length }})</h6>
          </div>
          <div class="error-list" style="max-height:260px; overflow-y:auto;">
            <div *ngFor="let error of errors" class="error-item mb-1 small">
              <strong>Row {{ error.rowNum }}</strong>
              <span *ngIf="error.narration"> — {{ error.narration }}</span>
              <span> — {{ error.message }}</span>
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
        Confirm Upload ({{ validCount }} voucher(s))
      </button>
    </div>
  `,
  styles: [`
    .file-upload-box { display: flex; flex-direction: column; align-items: flex-start; }
    .selected-file { font-size: 13px; }
    .voucher-card { background: #fafafa; font-size: 12px; }
    .voucher-card.border-success { border-color: #198754 !important; }
    .voucher-card.border-danger  { border-color: #dc3545 !important; }
    .loading-overlay {
      position: absolute; inset: 0; background: rgba(255,255,255,0.8);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 10; border-radius: 4px;
    }
    .error-item { padding: 2px 0; border-bottom: 1px solid #ffc10733; }
  `]
})
export class JournalVoucherImportModalComponent implements OnInit {
  @Input() currentCompany: any;
  @Input() currentBranch: any;
  @Input() currentYear: any;
  @Input() userData: any;

  selectedFile: File | null = null;
  fileError = '';
  showPreview = false;
  isProcessing = false;
  downloading = false;
  processingMessage = 'Processing...';

  errors: any[] = [];
  rowErrors: { row: number; message: string }[] = [];

  vouchersForm!: FormGroup;

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private accountsService: AccountsService,
    private appSettingsService: AppSettingsService,
  ) {}

  ngOnInit() { this.initForm(); }

  initForm() {
    this.vouchersForm = this.fb.group({ vouchers: this.fb.array([]) });
  }

  get vouchersArray(): FormArray {
    return this.vouchersForm.get('vouchers') as FormArray;
  }

  get validCount(): number {
    return this.vouchersArray.controls.filter((_, i) => !this.rowHasError(i)).length;
  }

  get invalidCount(): number {
    return this.rowErrors.length;
  }

  // ── File handling ────────────────────────────────────────────────────────────

  onFileSelected(event: Event) {
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

  // ── Download template ────────────────────────────────────────────────────────

  downloadTemplate() {
    this.downloading = true;
    this.accountsService.downloadJournalVoucherTemplate(
      this.currentCompany?.CompanyMasterSid,
      this.currentBranch?.BranchMasterSid
    ).subscribe({
      next: (blob: Blob) => {
        this.downloading = false;
        const url = window.URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = 'Journal_Voucher_Upload_Template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloading = false;
        this.appSettingsService.showError('Failed to download template');
      }
    });
  }

  // ── Parse Excel ──────────────────────────────────────────────────────────────

  parseAndPreview() {
    if (!this.selectedFile) return;
    this.isProcessing = true;
    this.processingMessage = 'Parsing file...';
    this.errors    = [];
    this.rowErrors = [];

    const formData = new FormData();
    formData.append('file',            this.selectedFile);
    formData.append('CompanyMasterSid',String(this.currentCompany?.CompanyMasterSid));
    formData.append('BranchMasterSid', String(this.currentBranch?.BranchMasterSid));
    formData.append('YearMasterSid',   String(this.currentYear?.YearMasterSid));

    this.accountsService.parseJournalVoucherExcel(formData).subscribe({
      next: (resp: any) => {
        this.isProcessing = false;
        if (!resp?.data) { this.fileError = resp?.message || 'Failed to parse file.'; return; }

        const result = resp.data;

        if (result.errors?.length) {
          this.errors      = result.errors;
          this.showPreview = false;
          return;
        }

        const allRows = [...(result.validRows || []), ...(result.invalidRows || [])];
        if (!allRows.length) { this.fileError = 'No voucher rows found in the file.'; return; }

        this.buildVouchersForm(result.validRows || [], result.invalidRows || []);
        this.showPreview = true;
        this.appSettingsService.showSuccess(
          `Parsed: ${result.validRows?.length ?? 0} valid, ${result.invalidRows?.length ?? 0} invalid.`
        );
      },
      error: (err: any) => {
        this.isProcessing = false;
        this.fileError = err?.error?.message || 'Failed to parse file. Please try again.';
      }
    });
  }

  buildVouchersForm(validRows: any[], invalidRows: any[]) {
    const allRows = [...validRows, ...invalidRows];

    const groups = allRows.map((row: any) => this.fb.group({
      // ── Internal / link fields (stripped before save) ──────────────────────
      _linkSno:       [row._linkSno      ?? ''],   // Excel Sno — link key only, NOT sent to API
      _details:       [row.details       ?? []],   // JV line items — sent as `details`
      _rowNum:        [row.rowNum        ?? ''],   // for error matching only
      voucherDateRaw: [row.voucherDateRaw ?? ''],  // human-readable display only
      // ── Real DB fields ─────────────────────────────────────────────────────
      voucherDate:       [row.voucherDate       ?? null],
      narration:         [row.narration         ?? ''],
      documentNumber:    [row.documentNumber    ?? null],
      documentDate:      [row.documentDate      ?? null],
    }));

    this.vouchersForm = this.fb.group({ vouchers: this.fb.array(groups) });

    this.rowErrors = [];
    allRows.forEach((row: any) => {
      if (row.errors?.length) {
        this.rowErrors.push({ row: row.rowNum, message: row.errors.join('; ') });
      }
    });
  }

  // ── Row helpers ──────────────────────────────────────────────────────────────

  rowHasError(index: number): boolean {
    const rowNum = this.vouchersArray.at(index).get('_rowNum')?.value;
    return this.rowErrors.some(e => e.row === rowNum);
  }

  getRowError(index: number): string {
    const rowNum = this.vouchersArray.at(index).get('_rowNum')?.value;
    return this.rowErrors.find(e => e.row === rowNum)?.message ?? '';
  }

  getDetailCount(index: number): number {
    return (this.vouchersArray.at(index).get('_details')?.value || []).length;
  }

  removeVoucher(index: number) {
    const rowNum = this.vouchersArray.at(index).get('_rowNum')?.value;
    this.vouchersArray.removeAt(index);
    this.rowErrors = this.rowErrors.filter(e => e.row !== rowNum);
  }

  // ── Confirm import ───────────────────────────────────────────────────────────

  onConfirmImport() {
    if (!this.vouchersArray.length || !this.validCount) return;

    const validRows = this.vouchersArray.controls
      .filter((_, i) => !this.rowHasError(i))
      .map(ctrl => {
        // Strip ALL internal/display fields — only real DB fields go to the API
        // _linkSno is explicitly excluded; VoucherNumber is auto-generated by backend
        const { _linkSno, _details, _rowNum, voucherDateRaw, ...rest } = ctrl.value;
        return { ...rest, details: _details };
      });

    const payload = {
      validRows,   // no _linkSno, no VoucherNumber — backend generates it
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid:  this.currentBranch?.BranchMasterSid,
      YearMasterSid:    this.currentYear?.YearMasterSid,
      createdBy:        this.userData?.userEmail || ''
    };

    this.isProcessing    = true;
    this.processingMessage = 'Importing journal vouchers...';

    this.accountsService.saveJournalVoucherExcel(payload).subscribe({
      next: (resp: any) => {
        this.isProcessing = false;
        if (resp?.data) {
          const created = resp.data.created ?? 0;
          const skipped = resp.data.skipped ?? 0;
          this.appSettingsService.showSuccess(
            `Import complete — ${created} voucher(s) created, ${skipped} skipped.`
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
    this.errors       = [];
    this.rowErrors    = [];
    this.initForm();
  }

  onCancel()  { this.activeModal.dismiss(); }
  hasErrors() { return this.errors.length > 0; }
}
