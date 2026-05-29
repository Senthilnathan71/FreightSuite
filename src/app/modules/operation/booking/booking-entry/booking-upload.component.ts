import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';

@Component({
  selector: 'app-booking-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <!-- Header -->
    <div class="modal-header modalHeaderpart p-1">
      <h5 class="modal-title text-white">
        <i class="fas fa-file-import me-2"></i>
        Bulk Upload Bookings
      </h5>
      <button type="button" class="btn-close btn-close-white"
              (click)="onCancel()" [disabled]="isProcessing"></button>
    </div>

    <!-- Body -->
    <div class="modal-body" style="position:relative; min-height: 200px;">

      <!-- ── UPLOAD STATE ── -->
      <div *ngIf="!showPreview">
        <div class="upload-instructions mb-3">
          <h6 class="fw-bold">Instructions:</h6>
          <ol>
            <li>Download the Excel template if you haven't already</li>
            <li>Fill in the <strong>Booking</strong> sheet — one row per booking</li>
            <li>Add cargo rows in <strong>BookingCargo</strong> (linked by BookingNo)</li>
            <li>Add product rows in <strong>BookingProduct</strong> (linked by BookingNo + CargoIndex)</li>
            <li>Add additional details in <strong>BookingOthers</strong> (linked by BookingNo)</li>
            <li>Upload the completed file, review, then click <strong>Confirm Upload</strong></li>
          </ol>
        </div>

        <div class="file-upload-box mb-3">
          <input type="file" #fileInput accept=".xlsx,.xls"
                 (change)="onFileSelected($event)" style="display:none" />
          <button type="button" class="btn btn-info btn-sm"
                  (click)="fileInput.click()" [disabled]="isProcessing">
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
          <h6 class="fw-bold mb-0">Review Rows</h6>
          <button type="button" class="btn btn-sm btn-info" (click)="onReUpload()">
            <i class="fas fa-sync-alt me-1"></i>Upload Different File
          </button>
        </div>

        <!-- Summary badges -->
        <div class="d-flex gap-2 mb-3">
          <span class="badge bg-secondary">Total: {{ totalCount }}</span>
          <span class="badge bg-success">Valid: {{ validCount }}</span>
          <span class="badge bg-danger" *ngIf="invalidCount">Invalid: {{ invalidCount }}</span>
        </div>

        <!-- Valid rows preview table -->
        <div class="table-responsive mb-3"
             style="max-height:320px; overflow-y:auto; border:1px solid #dee2e6; border-radius:6px;">
          <table class="table table-sm table-bordered table-hover mb-0" style="font-size:11px;">
            <thead class="table-light" style="position:sticky; top:0; z-index:1;">
              <tr>
                <th>#</th>
                <th>Ref</th>
                <th>Department</th>
                <th>Customer</th>
                <th>POL</th>
                <th>POD</th>
                <th>Booking Date</th>
                <th>Cargo</th>
                <th>Products</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of validRows; let i = index">
                <td>{{ row.rowNum }}</td>
                <td>{{ row.tempBookingRef }}</td>
                <td>{{ row.DepartmentName }}</td>
                <td>{{ row.CustomerName }}</td>
                <td>{{ row.POL }}</td>
                <td>{{ row.POD }}</td>
                <td>{{ row.BookingDate }}</td>
                <td class="text-end">{{ row.bookingCargo?.length || 0 }}</td>
                <td class="text-end">{{ getTotalProducts(row) }}</td>
                <td><span class="badge bg-success">Valid</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Invalid rows -->
        <div *ngIf="invalidRows.length" class="mt-2">
          <p class="small fw-semibold text-danger mb-1">
            <i class="fas fa-exclamation-circle me-1"></i>
            Invalid Rows ({{ invalidRows.length }}) — will be skipped:
          </p>
          <div class="table-responsive" style="max-height:200px; overflow-y:auto;">
            <table class="table table-sm table-bordered mb-0" style="font-size:11px;">
              <thead class="table-danger">
                <tr>
                  <th>Row</th>
                  <th>Ref</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of invalidRows" class="table-danger">
                  <td>{{ row.rowNum }}</td>
                  <td>{{ row.tempBookingRef }}</td>
                  <td>
                    <ul class="mb-0 ps-3">
                      <li *ngFor="let err of row.errors">{{ err }}</li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── STRUCTURAL ERRORS STATE ── -->
      <div *ngIf="hasErrors()">
        <div class="alert alert-warning">
          <div class="d-flex align-items-center mb-3">
            <i class="fas fa-exclamation-triangle fa-2x me-3"></i>
            <h6 class="mb-0 fw-bold">Validation Errors ({{ errors.length }})</h6>
          </div>
          <div class="error-list" style="max-height:240px; overflow-y:auto;">
            <div *ngFor="let error of errors" class="error-item mb-1 small">
              <span *ngIf="error.row">Row {{ error.row }} — </span>
              {{ error.message || error }}
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
              *ngIf="showPreview && !hasErrors() && validCount > 0"
              (click)="onConfirmImport()" [disabled]="isProcessing">
        <i class="fas fa-database me-1"></i>
        Confirm Upload ({{ validCount }} rows)
      </button>
    </div>
  `,
  styles: [`
    .file-upload-box { display: flex; flex-direction: column; align-items: flex-start; }
    .selected-file { font-size: 13px; }
    .loading-overlay {
      position: absolute; inset: 0; background: rgba(255,255,255,0.85);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 10; border-radius: 4px;
    }
    .error-item { padding: 2px 0; border-bottom: 1px solid #ffc10733; }
  `]
})
export class BookingImportModalComponent implements OnInit {
  @Input() currentCompany: any;
  @Input() currentBranch: any;
  @Input() userData: any;
  @Input() menuMasterSid: number = 0;

  // State
  selectedFile: File | null = null;
  fileError = '';
  showPreview = false;
  isProcessing = false;
  downloading = false;
  processingMessage = 'Processing...';

  // Data
  validRows: any[] = [];
  invalidRows: any[] = [];
  errors: any[] = [];

  constructor(
    private activeModal: NgbActiveModal,
    private operationService: OperationService,
    private appSettingsService: AppSettingsService,
  ) {}

  ngOnInit() {}

  get validCount(): number  { return this.validRows.length; }
  get invalidCount(): number { return this.invalidRows.length; }
  get totalCount(): number  { return this.validRows.length + this.invalidRows.length; }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  getTotalProducts(row: any): number {
    return (row.bookingCargo || []).reduce(
      (sum: number, cargo: any) => sum + (cargo.bookingProducts?.length || 0), 0
    );
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ── File handling ─────────────────────────────────────────────────────────────

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.fileError = '';
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      this.fileError = 'Invalid file type. Please upload an .xlsx or .xls file.';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.fileError = 'File size exceeds 10 MB limit.';
      return;
    }

    this.selectedFile = file;
    this.parseAndPreview();
  }

  // ── Download template ─────────────────────────────────────────────────────────

  downloadTemplate() {
    this.downloading = true;
    this.operationService.downloadBookingTemplate(
      this.currentCompany?.CompanyMasterSid
    ).subscribe({
      next: (blob: Blob) => {
        this.downloading = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Booking_Upload_Template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloading = false;
        this.appSettingsService.showError('Failed to download template');
      }
    });
  }

  // ── Parse Excel ───────────────────────────────────────────────────────────────

  parseAndPreview() {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.processingMessage = 'Parsing file...';
    this.errors = [];
    this.validRows = [];
    this.invalidRows = [];

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('CompanyMasterSid', String(this.currentCompany?.CompanyMasterSid));
    formData.append('BranchMasterSid',  String(this.currentBranch?.BranchMasterSid));

    this.operationService.parseBookingExcel(formData).subscribe({
      next: (resp: any) => {
        this.isProcessing = false;

        if (!resp?.data) {
          this.fileError = resp?.message || 'Failed to parse file.';
          return;
        }

        const result = resp.data;

        if (!result.validRows?.length && !result.invalidRows?.length) {
          this.fileError = 'No data rows found in the file. Please check the template.';
          return;
        }

        this.validRows   = result.validRows   || [];
        this.invalidRows = result.invalidRows || [];
        this.showPreview = true;

        if (this.validRows.length) {
          this.appSettingsService.showSuccess(
            `Parsed: ${this.validRows.length} valid, ${this.invalidRows.length} invalid.`
          );
        }
      },
      error: (err: any) => {
        this.isProcessing = false;
        this.fileError = err?.error?.message || 'Failed to parse file. Please try again.';
      }
    });
  }

  // ── Confirm import ────────────────────────────────────────────────────────────

  onConfirmImport() {
    if (!this.validRows.length) return;

    this.isProcessing = true;
    this.processingMessage = 'Importing bookings...';

    const payload = {
      validRows:        this.validRows,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid:  this.currentBranch?.BranchMasterSid,
      MenuMasterSid:    this.menuMasterSid || 0,
      createdBy:        this.userData?.userEmail || ''
    };

    this.operationService.saveBookingExcel(payload).subscribe({
      next: (resp: any) => {
        this.isProcessing = false;
        if (resp?.status) {
          const created = resp.data?.created ?? 0;
          const skipped = resp.data?.skipped ?? 0;
          this.appSettingsService.showSuccess(
            `Import complete — ${created} created, ${skipped} skipped.`
          );
          if (resp.data?.errors?.length) {
            this.errors = resp.data.errors;
            this.showPreview = false;
          } else {
            this.activeModal.close(created > 0);
          }
        } else {
          this.appSettingsService.showError(resp?.message || 'Import failed.');
        }
      },
      error: (err: any) => {
        this.isProcessing = false;
        this.appSettingsService.showError(
          err?.error?.message || 'Import failed. Please try again.'
        );
      }
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────────

  onReUpload() {
    this.selectedFile = null;
    this.fileError    = '';
    this.showPreview  = false;
    this.validRows    = [];
    this.invalidRows  = [];
    this.errors       = [];
  }

  onCancel()  { this.activeModal.dismiss(); }
  hasErrors() { return this.errors.length > 0; }
}