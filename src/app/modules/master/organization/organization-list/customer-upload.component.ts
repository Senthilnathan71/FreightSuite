import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-customer-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <!-- Header -->
    <div class="modal-header modalHeaderpart p-1">
      <h5 class="modal-title text-white">
        <i class="fas fa-file-import me-2"></i>Bulk Upload Customers
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
            <li>Fill in customer details in the <strong>Customers</strong> sheet (one row per customer)</li>
            <li>Add branch rows in the <strong>Branches</strong> sheet, linked by <strong>Customer Name</strong></li>
            <li>Multiple branches can be added for the same customer by repeating the Customer Name</li>
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
          <h6 class="fw-bold mb-0">Review Customers</h6>
          <button type="button" class="btn btn-sm btn-info" (click)="onReUpload()">
            <i class="fas fa-sync-alt me-1"></i>Upload Different File
          </button>
        </div>

        <!-- Summary badges -->
        <div class="d-flex gap-2 mb-3">
          <span class="badge bg-secondary">Total: {{ customersData.length }}</span>
          <span class="badge bg-success">Valid: {{ validCount }}</span>
          <span class="badge bg-danger" *ngIf="invalidCount">Invalid: {{ invalidCount }}</span>
        </div>

        <!-- Valid rows preview table -->
        <div class="customers-table-wrapper" *ngIf="customersArray.length">
          <table class="table table-sm table-hover preview-table mb-0">
            <thead class="table-info">
              <tr>
                <th></th>
                <th>Customer Name</th>
                <th>Short Code</th>
                <th>Country</th>
                <th>Payment Type</th>
                <th>Status</th>
                <th>Branches</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ctrl of customersArray.controls; let i = index"
                  [class.table-danger]="rowHasError(i)">
                <td>
                  <button type="button" class="btn btn-sm py-0"
                          (click)="removeCustomer(i)">
                    <i class="fas fa-trash text-danger"></i>
                  </button>
                </td>
                <td>{{ ctrl.get('customerName')?.value }}</td>
                <td>{{ ctrl.get('shortCode')?.value || '—' }}</td>
                <td>{{ ctrl.get('countryRaw')?.value }}</td>
                <td>{{ ctrl.get('paymentType')?.value }}</td>
                <td>
                  <span class="badge"
                        [class.bg-success]="ctrl.get('status')?.value === 'A'"
                        [class.bg-secondary]="ctrl.get('status')?.value !== 'A'">
                    {{ ctrl.get('status')?.value === 'A' ? 'Active' : 'Suspended' }}
                  </span>
                </td>
                <td>
                  <span class="badge bg-info">
                    {{ getBranchCount(i) }} branch(es)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
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
              <span> – {{ error.message }}</span>
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

    .customers-table-wrapper {
      max-height: 360px; overflow-y: auto;
      border-radius: 8px; border: 1px solid #dee2e6;
    }
    .preview-table { font-size: 12px; margin-bottom: 0; }
    .preview-table th {
      position: sticky; top: 0; z-index: 1;
      font-size: 11px; white-space: nowrap;
    }

    .loading-overlay {
      position: absolute; inset: 0; background: rgba(255,255,255,0.8);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 10; border-radius: 4px;
    }

    .error-item { padding: 2px 0; border-bottom: 1px solid #ffc10733; }
  `]
})
export class CustomerImportModalComponent implements OnInit {
  @Input() currentCompany: any;
  @Input() userData: any;

  // State
  selectedFile: File | null = null;
  fileError = '';
  showPreview = false;
  isProcessing = false;
  downloading = false;
  processingMessage = 'Processing...';

  // Data
  customersData: any[] = [];
  errors: any[] = [];
  rowErrors: { row: number; message: string }[] = [];

  // Form
  customersForm!: FormGroup;

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
    this.customersForm = this.fb.group({ customers: this.fb.array([]) });
  }

  get customersArray(): FormArray {
    return this.customersForm.get('customers') as FormArray;
  }

  get validCount(): number {
    return this.customersArray.length - this.rowErrors.length;
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
    this.masterService.downloadCustomerTemplate(
      this.currentCompany?.CompanyMasterSid
    ).subscribe({
      next: (blob: Blob) => {
        this.downloading = false;
        const url = window.URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = 'Customer_Upload_Template.xlsx';
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

    this.isProcessing      = true;
    this.processingMessage = 'Parsing file...';
    this.errors            = [];
    this.rowErrors         = [];

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('CompanyMasterSid', String(this.currentCompany?.CompanyMasterSid));

    this.masterService.parseCustomerExcel(formData).subscribe({
      next: (resp: any) => {
        this.isProcessing = false;

        if (!resp?.data) {
          this.fileError = resp?.message || 'Failed to parse file.';
          return;
        }

        const result = resp.data;

        // Surface structural errors (missing sheets, bad headers, etc.)
        if (result.errors?.length) {
          this.errors      = result.errors;
          this.showPreview = false;
          return;
        }

        this.customersData = [
          ...(result.validRows   || []),
          ...(result.invalidRows || [])
        ];

        if (!this.customersData.length) {
          this.fileError = 'No rows found in the file.';
          return;
        }

        this.buildCustomersForm(
          result.validRows   || [],
          result.invalidRows || []
        );
        this.showPreview = true;
        this.appSettingsService.showSuccess('File parsed successfully');
      },
      error: (err: any) => {
        this.isProcessing = false;
        this.fileError = err?.error?.message || 'Failed to parse file. Please try again.';
      }
    });
  }

  buildCustomersForm(validRows: any[], invalidRows: any[]) {
    const allRows = [...validRows, ...invalidRows];

    const customerGroups = allRows.map((row: any) =>
      this.fb.group({
        rowNum:              [row.rowNum            ?? ''],
        customerName:        [row.customerName      ?? ''],
        shortCode:           [row.shortCode         ?? ''],
        aliasName:           [row.aliasName         ?? ''],
        address1:            [row.address1          ?? ''],
        address2:            [row.address2          ?? ''],
        countryRaw:          [row.countryRaw        ?? ''],
        CountryMasterSid:    [row.CountryMasterSid  ?? null],
        CurrencyMasterSid:   [row.CurrencyMasterSid ?? null],
        companyType:         [row.companyType       ?? ''],
        panAvailable:        [row.panAvailable      ?? false],
        panNumber:           [row.panNumber         ?? ''],
        panName:             [row.panName           ?? ''],
        groupName:           [row.groupName         ?? ''],
        website:             [row.website           ?? ''],
        paymentType:         [row.paymentType       ?? 'Credit'],
        isMsme:              [row.isMsme            ?? false],
        registrationNo:      [row.registrationNo    ?? ''],
        cin:                 [row.cin               ?? ''],
        tan:                 [row.tan               ?? ''],
        remarks:             [row.remarks           ?? ''],
        customerTypeObject:  [row.customerTypeObject ?? {}],
        network:             [row.network           ?? ''],
        status:              [row.status            ?? 'A'],
        // Stash branch records for save payload
        _branchRecords:      [row.branchRecords     ?? []],
      })
    );

    this.customersForm = this.fb.group({
      customers: this.fb.array(customerGroups)
    });

    // Tag invalid rows
    this.rowErrors = [];
    allRows.forEach((row: any, i: number) => {
      const allErrors = [...(row.errors || []), ...(row.branchErrors?.map((be: any) =>
        `Branch "${be.branchName}": ${be.errors?.join(', ')}`
      ) || [])];

      if (allErrors.length) {
        this.rowErrors.push({
          row:     row.rowNum ?? i + 4,
          message: allErrors.join('; ')
        });
      }
    });
  }

  // ── Row helpers ──────────────────────────────────────────────────────────────

  rowHasError(index: number): boolean {
    const rowNum = this.customersArray.at(index).get('rowNum')?.value;
    return this.rowErrors.some(e => e.row === rowNum);
  }

  getBranchCount(index: number): number {
    return (this.customersArray.at(index).get('_branchRecords')?.value || []).length;
  }

  removeCustomer(index: number) {
    const rowNum = this.customersArray.at(index).get('rowNum')?.value;
    this.customersArray.removeAt(index);
    this.rowErrors = this.rowErrors.filter(e => e.row !== rowNum);
  }

  // ── Confirm import ───────────────────────────────────────────────────────────

  onConfirmImport() {
    if (!this.customersArray.length || !this.validCount) return;

    // Collect only valid rows, rebuild payload shape expected by saveCustomerExcel
    const validRows = this.customersArray.controls
      .filter((_, i) => !this.rowHasError(i))
      .map(ctrl => {
        const v = ctrl.value;
        return {
          rowNum:             v.rowNum,
          customerName:       v.customerName,
          shortCode:          v.shortCode,
          aliasName:          v.aliasName,
          address1:           v.address1,
          address2:           v.address2,
          countryRaw:         v.countryRaw,
          CountryMasterSid:   v.CountryMasterSid,
          CurrencyMasterSid:  v.CurrencyMasterSid,
          companyType:        v.companyType,
          panAvailable:       v.panAvailable,
          panNumber:          v.panNumber,
          panName:            v.panName,
          groupName:          v.groupName,
          website:            v.website,
          paymentType:        v.paymentType,
          isMsme:             v.isMsme,
          registrationNo:     v.registrationNo,
          cin:                v.cin,
          tan:                v.tan,
          remarks:            v.remarks,
          customerTypeObject: v.customerTypeObject,
          network:            v.network,
          status:             v.status,
          branchRecords:      v._branchRecords,
        };
      });

    const payload = {
      validRows,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      createdBy:        this.userData?.userEmail || ''
    };

    this.isProcessing      = true;
    this.processingMessage = 'Importing customers...';

    this.masterService.saveCustomerExcel(payload).subscribe({
      next: (resp: any) => {
        this.isProcessing = false;
        if (resp?.data) {
          const created = resp.data.created ?? 0;
          this.appSettingsService.showSuccess(
            `Import complete — ${created} customer(s) created.`
          );
          this.activeModal.close(created > 0);
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

  // ── Navigation ───────────────────────────────────────────────────────────────

  onReUpload() {
    this.selectedFile  = null;
    this.fileError     = '';
    this.showPreview   = false;
    this.customersData = [];
    this.errors        = [];
    this.rowErrors     = [];
    this.initForm();
  }

  onCancel()  { this.activeModal.dismiss(); }
  hasErrors() { return this.errors.length > 0; }
}