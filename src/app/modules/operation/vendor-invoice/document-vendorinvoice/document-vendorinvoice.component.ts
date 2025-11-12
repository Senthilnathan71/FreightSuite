import { Component, OnInit, ViewChild, TemplateRef, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DocVendorInvoiceService, ExtractionReview, FieldMapping, VendorInvoiceData } from '../../doc-vendorinvoice.service';

@Component({
  selector: 'app-document-vendorinvoice-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
   templateUrl: './document-vendorinvoice.component.html',
  styleUrl: './document-vendorinvoice.component.scss'
})
export class DocumentVendorInvoiceEntryComponent implements OnInit {
  @Output() documentProcessed = new EventEmitter<VendorInvoiceData>();
  @Output() documentCleared = new EventEmitter<void>();

  vendorInvoiceForm: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;
  uploadError: string | null = null;
  extractedData: VendorInvoiceData | null = null;
  fieldMappings: FieldMapping[] = [];
  
  // Review state
  isReviewMode = false;
  userCorrections: VendorInvoiceData | null = null;
  validationResults: any[] = [];
  totalMismatches: any = null;
  
  // Progress tracking
  uploadProgress = { percentage: 0, stage: 'uploading', message: 'Ready to upload' };

  // Modal references
  private modalRef: NgbModalRef | null = null;
  @ViewChild('extractedDataModal') extractedDataModal!: TemplateRef<any>;
  @ViewChild('fieldMappingModal') fieldMappingModal!: TemplateRef<any>;
  @ViewChild('validationModal') validationModal!: TemplateRef<any>;

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private documentService: DocVendorInvoiceService
  ) {
    this.vendorInvoiceForm = this.createForm();
  }

  ngOnInit(): void {
    // Subscribe to upload progress
    const progressSub = this.documentService.getVendorInvoiceUploadProgress().subscribe(
      progress => {
        this.uploadProgress = progress;
        
        if (progress.stage === 'error') {
          this.uploadError = progress.message;
          this.isUploading = false;
        } else if (progress.stage === 'complete') {
          this.isUploading = false;
          this.uploadError = null;
        }
      }
    );
    
    this.subscriptions.push(progressSub);

    // Test connection on component load
    this.testConnection();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Header Information
      voucherNumber: [''],
      voucherDate: [''],
      documentNumber: ['', Validators.required],
      documentDate: ['', Validators.required],
      
      // Vendor Information
      partyName: ['', Validators.required],
      partyAddress: [''],
      gstNo: [''],
      gstType: [''],
      placeOfSupply: [''],
      
      // Financial Information
      currencyCode: ['', Validators.required],
      exchangeRate: [1, [Validators.required, Validators.min(0)]],
      amount: [0, [Validators.required, Validators.min(0)]],
      localAmount: [0],
      netAmount: [0],
      
      // Job Information
      masterNumber: [''],
      houseNumber: [''],
      masterJobSid: [null],
      houseJobSid: [null],
      departmentMasterSid: [null],
      
      // Charge Details Array
      voucherDetails: this.fb.array([])
    });
  }

  // Getters for form arrays and controls
  get voucherDetails(): FormArray {
    return this.vendorInvoiceForm.get('voucherDetails') as FormArray;
  }

  get f(): { [key: string]: AbstractControl } {
    return this.vendorInvoiceForm.controls;
  }

  createChargeDetailGroup(data?: any): FormGroup {
    return this.fb.group({
      CostRevenueChargesSid: [data?.CostRevenueChargesSid || null], // Store original cost ID
    ChargeMasterSid: [data?.ChargeMasterSid || null, Validators.required],
    ChargeDescription: [data?.ChargeDescription || ''],
    HSSACMasterSid: [data?.HSSACMasterSid || null],
    ChargeUOMSid: [data?.ChargeUOMSid || null],
    NumberOfUnit: [data?.NumberOfUnit || 1, [Validators.required, Validators.min(0)]],
    DrCr: [data?.DrCr || 'Dr', Validators.required],
    CurrencyCode: [data?.CurrencyCode || this.vendorInvoiceForm.get('CurrencyCode')?.value || null],
    Rate: [data?.Rate || 0, [Validators.required, Validators.min(0)]],
    ExchangeRate: [data?.ExchangeRate || this.vendorInvoiceForm.get('ExchangeRate')?.value || 1],
    Amount: [data?.Amount || 0],
    TaxableAmount: [data?.TaxableAmount || 0],
    TaxPercentage1: [data?.TaxPercentage1 || 0],
    TaxAmount1: [data?.TaxAmount1 || 0],
    TaxPercentage2: [data?.TaxPercentage2 || 0],
    TaxAmount2: [data?.TaxAmount2 || 0],
    TaxPercentageIGST: [data?.TaxPercentageIGST || 0],
    TaxAmountIGST: [data?.TaxAmountIGST || 0],
    LocalAmount: [data?.LocalAmount || 0],
    PartyAmount: [data?.PartyAmount || 0],
    MasterJobSid: [data?.MasterJobSid || null],
    HouseJobSid: [data?.HouseJobSid || null],
    DepartmentMasterSid: [data?.DepartmentMasterSid || null],
    LedgerMasterSid: [data?.LedgerMasterSid || null],
    COAMasterSid: [data?.COAMasterSid || null]
    });
  }

  addChargeDetailRow(data?: any): void {
    const row = this.createChargeDetailGroup(data);
    this.voucherDetails.push(row);
  }

  removeChargeDetailRow(index: number): void {
    this.voucherDetails.removeAt(index);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadError = null;
    this.extractedData = null;
    this.isReviewMode = false;
    this.userCorrections = null;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        this.uploadError = 'Please select a PDF file';
        this.selectedFile = null;
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.uploadError = 'File size must be less than 10MB';
        this.selectedFile = null;
        return;
      }
      
      this.selectedFile = file;
      console.log('Vendor Invoice PDF selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  }

  async uploadAndProcess(): Promise<void> {
    if (!this.selectedFile) {
      this.uploadError = 'Please select a file first';
      return;
    }

    this.isUploading = true;
    this.uploadError = null;
    this.extractedData = null;
    this.fieldMappings = [];
    this.isReviewMode = false;

    try {
      console.log('Starting vendor invoice upload process...');
      
      const uploadSub = this.documentService.uploadVendorInvoice(this.selectedFile).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            console.log('Vendor invoice processed successfully:', response);
            this.extractedData = response.data;
            this.fieldMappings = response.data.fieldMappings || [];
            
            // Switch to review mode
            this.isReviewMode = true;
            this.userCorrections = { ...response.data };
            
            // Populate form with extracted data for review
            this.populateForm(this.extractedData);
            
            // Validate the extracted data
            this.validateExtractedData();
            
          } else {
            this.uploadError = response.error || 'Failed to process vendor invoice';
            this.isUploading = false;
          }
        },
        error: (error) => {
          console.error('Upload failed:', error);
          this.uploadError = error.message || 'Failed to upload and process vendor invoice';
          this.isUploading = false;
        }
      });
      
      this.subscriptions.push(uploadSub);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      this.uploadError = 'An unexpected error occurred';
      this.isUploading = false;
    }
  }

  private populateForm(data: VendorInvoiceData): void {
    // Clear existing form data
    this.voucherDetails.clear();
    
    // Populate header fields
    this.vendorInvoiceForm.patchValue({
      voucherNumber: data.voucherNumber || '',
      voucherDate: data.voucherDate || '',
      documentNumber: data.documentNumber || '',
      documentDate: data.documentDate || '',
      partyName: data.partyName || '',
      partyAddress: data.partyAddress || '',
      gstNo: data.gstNo || '',
      gstType: data.gstType || '',
      placeOfSupply: data.placeOfSupply || '',
      currencyCode: data.currencyCode || '',
      exchangeRate: data.exchangeRate || 1,
      amount: data.amount || 0,
      localAmount: data.localAmount || 0,
      netAmount: data.netAmount || 0,
      masterNumber: data.masterNumber || '',
      houseNumber: data.houseNumber || '',
      masterJobSid: data.masterJobSid || null,
      houseJobSid: data.houseJobSid || null,
      departmentMasterSid: data.departmentMasterSid || null
    });

    // Populate charge details
    if (data.voucherDetails && data.voucherDetails.length > 0) {
      data.voucherDetails.forEach(detail => {
        this.addChargeDetailRow(detail);
      });
    }
  }

  validateExtractedData(): void {
    if (!this.extractedData) return;

    this.documentService.validateVendorInvoiceData(this.extractedData).subscribe({
      next: (validationResult) => {
        this.validationResults = validationResult.validationResults;
        this.totalMismatches = validationResult.totalMismatches;
        
        if (!validationResult.isValid) {
          this.showValidationModal();
        }
      },
      error: (error) => {
        console.error('Validation error:', error);
      }
    });
  }

  onFieldMappingChange(field: string, newMapping: string): void {
    if (!this.fieldMappings) return;

    const mapping = this.fieldMappings.find(m => m.canonicalField === field);
    if (mapping) {
      mapping.userCorrected = true;
      // Update the corresponding form value
      this.vendorInvoiceForm.get(field)?.setValue(newMapping);
    }
  }

  saveExtractionReview(): void {
    if (!this.extractedData || !this.userCorrections) return;

    const reviewData: ExtractionReview = {
      extractionId: `EXT_${Date.now()}`,
      originalData: this.extractedData,
      userCorrections: this.userCorrections,
      fieldMappings: this.fieldMappings.map(mapping => ({
        ...mapping,
        userCorrected: mapping.userCorrected || false
      })),
      validated: this.validationResults.every(result => result.isValid) && 
                (!this.totalMismatches || Math.abs(this.totalMismatches.difference) < 0.01)
    };

    this.documentService.saveExtractionReview(reviewData).subscribe({
      next: (response) => {
        console.log('Extraction review saved:', response);
        // Emit the processed data to parent component
        this.documentProcessed.emit(this.userCorrections!);
        
        this.isReviewMode = false;
        this.showSuccessMessage('Vendor invoice data saved for review');
      },
      error: (error) => {
        console.error('Failed to save extraction review:', error);
        this.showErrorMessage('Failed to save extraction review');
      }
    });
  }

  applyToDatabase(): void {
    if (this.vendorInvoiceForm.invalid) {
      this.markFormGroupTouched(this.vendorInvoiceForm);
      this.showErrorMessage('Please correct all validation errors before saving');
      return;
    }

    // In a real implementation, you would get these from app settings
    const saveData = {
      reviewId: `REV_${Date.now()}`,
      companyMasterSid: 1, // Get from app settings
      branchMasterSid: 1,  // Get from app settings
      voucherTypeMasterSid: 1, // Vendor Invoice type
      validatedData: this.vendorInvoiceForm.value,
      userId: 'current-user' // Get from user service
    };

    this.documentService.saveVendorInvoiceToDatabase(saveData).subscribe({
      next: (response) => {
        console.log('Vendor invoice saved to database:', response);
        this.documentProcessed.emit(this.vendorInvoiceForm.value);
        this.showSuccessMessage('Vendor invoice saved to database successfully');
        this.clearForm();
      },
      error: (error) => {
        console.error('Failed to save to database:', error);
        this.showErrorMessage('Failed to save vendor invoice to database');
      }
    });
  }

  showExtractedDataModal(): void {
    if (this.extractedData) {
      this.modalRef = this.modalService.open(this.extractedDataModal, {
        size: 'xl',
        backdrop: 'static',
        scrollable: true
      });
    }
  }

  showFieldMappingModal(): void {
    this.modalRef = this.modalService.open(this.fieldMappingModal, {
      size: 'lg',
      backdrop: 'static',
      scrollable: true
    });
  }

  showValidationModal(): void {
    this.modalRef = this.modalService.open(this.validationModal, {
      size: 'lg',
      backdrop: 'static'
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
  }

  private testConnection(): void {
    this.documentService.testVendorInvoiceConnection().subscribe({
      next: (response) => {
        console.log('Vendor invoice backend connection successful:', response);
      },
      error: (error) => {
        console.warn('Vendor invoice backend connection failed:', error);
        this.uploadError = 'Warning: Cannot connect to vendor invoice service';
      }
    });
  }

  clearForm(): void {
    this.vendorInvoiceForm.reset();
    this.voucherDetails.clear();
    this.selectedFile = null;
    this.uploadError = null;
    this.extractedData = null;
    this.fieldMappings = [];
    this.isReviewMode = false;
    this.userCorrections = null;
    this.validationResults = [];
    this.totalMismatches = null;
    
    // Reset file input
    const fileInput = document.getElementById('vendorInvoiceFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    // Emit clear event to parent
    this.documentCleared.emit();
  }

  // Utility methods
  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private showSuccessMessage(message: string): void {
    // You can use a toast service here
    alert(`Success: ${message}`);
  }

  private showErrorMessage(message: string): void {
    // You can use a toast service here
    alert(`Error: ${message}`);
  }

  getRoundedConfidence(confidence: number): number {
    return Math.round(confidence * 100);
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 0.8) return 'high-confidence';
    if (confidence >= 0.6) return 'medium-confidence';
    return 'low-confidence';
  }

  getFieldMapping(field: string): FieldMapping | undefined {
    return this.fieldMappings?.find(m => m.canonicalField === field);
  }

  // Calculate totals for display
  getTotalAmount(): number {
    return this.voucherDetails.controls.reduce((sum, control) => {
      return sum + (control.get('amount')?.value || 0);
    }, 0);
  }


  getTotalTaxAmount(): number {
    return this.voucherDetails.controls.reduce((sum, control) => {
      return sum + (control.get('cgstAmount')?.value || 0) + 
                   (control.get('sgstAmount')?.value || 0) + 
                   (control.get('igstAmount')?.value || 0);
    }, 0);
  }

  getGrandTotal(): number {
    return this.getTotalAmount() + this.getTotalTaxAmount();
  }

  // Check if there are total mismatches
  hasTotalMismatches(): boolean {
    return this.totalMismatches && Math.abs(this.totalMismatches.difference) >= 0.01;
  }
  abs(value: number): number {
  return Math.abs(value);
}
}