import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OcrService, OcrExtractResponse, ExtractedInvoice } from '../../services/ocr.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-document-vendorinvoice-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSpinnerModule],
  templateUrl: './document-vendorinvoice.component.html',
  styleUrls: ['./document-vendorinvoice.component.scss'],
})
export class DocumentVendorInvoiceEntryComponent {
  @Output() documentProcessed = new EventEmitter<ExtractedInvoice>();
  @Output() documentCleared = new EventEmitter<void>();

  selectedFile: File | null = null;
  isProcessing = false;
  errorMessage: string | null = null;

  // Extracted result from API
  response: OcrExtractResponse | null = null;
  extractedData: ExtractedInvoice | null = null;

  constructor(
    private ocrService: OcrService,
    private spinner: NgxSpinnerService,
  ) {}

  // ── File selection ──────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.errorMessage = null;
    this.response = null;
    this.extractedData = null;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.type !== 'application/pdf') {
        this.errorMessage = 'Only PDF files are supported.';
        this.selectedFile = null;
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        this.errorMessage = 'File size must be less than 20 MB.';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
    }
  }

  // ── Upload & Extract ────────────────────────────
  processFile(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file first.';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = null;
    this.response = null;
    this.extractedData = null;
    this.spinner.show('ocrSpinner');

    this.ocrService.extractFromPdf(this.selectedFile, 'invoice').subscribe({
      next: (res) => {
        this.spinner.hide('ocrSpinner');
        this.isProcessing = false;
        this.response = res;

        if (res.success && res.extractedData) {
          const lineItems = (res.extractedData.line_items || [])
            .filter(item =>
              !!item &&
              (
                !!item.description ||
                Number(item.taxable_value || 0) > 0 ||
                Number(item.total || 0) > 0 ||
                Number(item.vat_amount || 0) > 0
              )
            );

          this.extractedData = {
            ...res.extractedData,
            line_items: lineItems
          };
        } else {
          this.errorMessage = res.error || 'Extraction failed. Please try again.';
        }
      },
      error: (err) => {
        this.spinner.hide('ocrSpinner');
        this.isProcessing = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to process the document.';
      },
    });
  }

  // ── Apply to parent form ────────────────────────
  applyData(): void {
    if (this.extractedData) {
      this.documentProcessed.emit({
        ...this.extractedData,
        line_items: this.extractedData.line_items || [],
      });
    }
  }

  // ── Clear / Close ───────────────────────────────
  clearForm(): void {
    this.selectedFile = null;
    this.errorMessage = null;
    this.response = null;
    this.extractedData = null;

    const fileInput = document.getElementById('vendorInvoiceFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';

    this.documentCleared.emit();
  }

  // ── Helpers for template ────────────────────────
  getFileSizeMB(): string {
    return this.selectedFile ? (this.selectedFile.size / 1024 / 1024).toFixed(2) : '0';
  }

  getTotalFromLineItems(): number {
    if (!this.extractedData?.line_items) return 0;
    return this.extractedData.line_items.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  getTaxableValue(item: any): number {
    const taxable = Number(item?.taxable_value || 0);
    if (taxable > 0) return taxable;
    const total = Number(item?.total || 0);
    const tax = Number(item?.vat_amount || 0);
    return Math.max(total - tax, 0);
  }

  getRatePerQty(item: any): number {
    const rate = Number(item?.rate || 0);
    if (rate > 0) return rate;
    const qty = Number(item?.qty || 0);
    const taxable = this.getTaxableValue(item);
    return qty > 0 ? taxable / qty : taxable;
  }
}
