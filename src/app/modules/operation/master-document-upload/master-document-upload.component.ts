// // src/app/components/document-upload/document-upload.component.ts
// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { DocumentService, BillOfLadingData, UploadProgress } from '../document.service';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-document-upload',
//   templateUrl: './master-document-upload.component.html',
//   styleUrls: ['./master-document-upload.component.scss']
// })
// export class MasterDocumentUploadComponent implements OnInit, OnDestroy {
//   billOfLadingForm: FormGroup;
//   selectedFile: File | null = null;
//   uploadProgress: UploadProgress = { percentage: 0, stage: 'uploading', message: 'Ready to upload' };
//   isUploading = false;
//   uploadError: string | null = null;
//   extractedData: BillOfLadingData | null = null;
  
//   private subscriptions: Subscription[] = [];

//   constructor(
//     private fb: FormBuilder,
//     private documentService: DocumentService
//   ) {
//     this.billOfLadingForm = this.createForm();
//   }

//   ngOnInit(): void {
//     // Subscribe to upload progress
//     const progressSub = this.documentService.getUploadProgress().subscribe(
//       progress => {
//         this.uploadProgress = progress;
        
//         if (progress.stage === 'error') {
//           this.uploadError = progress.message;
//           this.isUploading = false;
//         } else if (progress.stage === 'complete') {
//           this.isUploading = false;
//           this.uploadError = null;
//         }
//       }
//     );
    
//     this.subscriptions.push(progressSub);

//     // Test connection on component load
//     this.testConnection();
//   }

//   ngOnDestroy(): void {
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//   }

//   private createForm(): FormGroup {
//     return this.fb.group({
//       shipper: ['', Validators.required],
//       consignee: ['', Validators.required],
//       portOfLoading: ['', Validators.required],
//       portOfDischarge: ['', Validators.required],
//       vesselVoyage: ['', Validators.required],
//       cargoDetails: ['', Validators.required],
//       containerDetails: ['', Validators.required],
//       blNumber: [''],
//       dateOfIssue: ['']
//     });
//   }

//   onFileSelected(event: Event): void {
//     const input = event.target as HTMLInputElement;
//     this.uploadError = null;
//     this.extractedData = null;
    
//     if (input.files && input.files.length > 0) {
//       const file = input.files[0];
      
//       // Validate file type
//       if (file.type !== 'application/pdf') {
//         this.uploadError = 'Please select a PDF file';
//         this.selectedFile = null;
//         return;
//       }
      
//       // Validate file size (10MB)
//       if (file.size > 10 * 1024 * 1024) {
//         this.uploadError = 'File size must be less than 10MB';
//         this.selectedFile = null;
//         return;
//       }
      
//       this.selectedFile = file;
//       console.log('File selected:', {
//         name: file.name,
//         size: file.size,
//         type: file.type
//       });
//     }
//   }

//   async uploadAndProcess(): Promise<void> {
//     if (!this.selectedFile) {
//       this.uploadError = 'Please select a file first';
//       return;
//     }

//     this.isUploading = true;
//     this.uploadError = null;
//     this.extractedData = null;

//     try {
//       console.log('Starting upload process...');
      
//       const uploadSub = this.documentService.uploadBillOfLading(this.selectedFile).subscribe({
//         next: (data) => {
//           if (data) {
//             console.log('Document processed successfully:', data);
//             this.extractedData = data;
//             this.populateForm(data);
            
//             // Show warning for low confidence
//             if (data.confidence < 0.7) {
//               this.uploadError = `Document processed with low confidence (${Math.round(data.confidence * 100)}%). Please review the extracted data carefully.`;
//             }
//           }
//         },
//         error: (error) => {
//           console.error('Upload failed:', error);
//           this.uploadError = error.message || 'Failed to upload and process document';
//           this.isUploading = false;
//         },
//         complete: () => {
//           this.isUploading = false;
//         }
//       });
      
//       this.subscriptions.push(uploadSub);
      
//     } catch (error) {
//       console.error('Unexpected error:', error);
//       this.uploadError = 'An unexpected error occurred';
//       this.isUploading = false;
//     }
//   }

//   private populateForm(data: BillOfLadingData): void {
//     this.billOfLadingForm.patchValue({
//       shipper: data.shipper || '',
//       consignee: data.consignee || '',
//       portOfLoading: data.portOfLoading || '',
//       portOfDischarge: data.portOfDischarge || '',
//       vesselVoyage: data.vesselVoyage || '',
//       cargoDetails: data.cargoDetails || '',
//       containerDetails: data.containerDetails || '',
//       blNumber: data.blNumber || '',
//       dateOfIssue: data.dateOfIssue || ''
//     });
//   }

//   private testConnection(): void {
//     this.documentService.testConnection().subscribe({
//       next: (response) => {
//         console.log('Backend connection successful:', response);
//       },
//       error: (error) => {
//         console.warn('Backend connection failed:', error);
//         this.uploadError = 'Warning: Cannot connect to backend service';
//       }
//     });
//   }

//   onSubmit(): void {
//     if (this.billOfLadingForm.valid) {
//       const formData = this.billOfLadingForm.value;
//       console.log('Form submitted:', formData);
      
//       // Here you would typically send the data to your backend for B/L creation
//       // For now, just log it
//       alert('Form submitted successfully! Check console for data.');
//     } else {
//       this.markFormGroupTouched(this.billOfLadingForm);
//       this.uploadError = 'Please fill in all required fields';
//     }
//   }

//   private markFormGroupTouched(formGroup: FormGroup): void {
//     Object.keys(formGroup.controls).forEach(key => {
//       const control = formGroup.get(key);
//       control?.markAsTouched();
//     });
//   }

//   clearForm(): void {
//     this.billOfLadingForm.reset();
//     this.selectedFile = null;
//     this.uploadError = null;
//     this.extractedData = null;
    
//     // Reset file input
//     const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
//     if (fileInput) {
//       fileInput.value = '';
//     }
//   }

//   // Utility methods for template
//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.billOfLadingForm.get(fieldName);
//     return !!(field && field.invalid && field.touched);
//   }

//   getFieldError(fieldName: string): string {
//     const field = this.billOfLadingForm.get(fieldName);
//     if (field && field.errors && field.touched) {
//       if (field.errors['required']) {
//         return `${this.getFieldLabel(fieldName)} is required`;
//       }
//     }
//     return '';
//   }

//   private getFieldLabel(fieldName: string): string {
//     const labels: { [key: string]: string } = {
//       shipper: 'Shipper',
//       consignee: 'Consignee',
//       portOfLoading: 'Port of Loading',
//       portOfDischarge: 'Port of Discharge',
//       vesselVoyage: 'Vessel/Voyage',
//       cargoDetails: 'Cargo Details',
//       containerDetails: 'Container Details',
//       blNumber: 'B/L Number',
//       dateOfIssue: 'Date of Issue'
//     };
//     return labels[fieldName] || fieldName;
//   }

//   // Methods for displaying extracted data details
//   showExtractedDataModal(): void {
//     if (this.extractedData) {
//       const modal = document.getElementById('extractedDataModal');
//       if (modal) {
//         modal.style.display = 'block';
//       }
//     }
//   }

//   closeExtractedDataModal(): void {
//     const modal = document.getElementById('extractedDataModal');
//     if (modal) {
//       modal.style.display = 'none';
//     }
//   }
// }


// src/app/components/document-upload/document-upload.component.ts
import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DocumentService, BillOfLadingData, UploadProgress } from '../services/document.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-document-upload',
  templateUrl: './master-document-upload.component.html',
  styleUrls: ['./master-document-upload.component.scss']
})
export class MasterDocumentUploadComponent implements OnInit, OnDestroy {
  billOfLadingForm: FormGroup;
  selectedFile: File | null = null;
  uploadProgress: UploadProgress = { percentage: 0, stage: 'uploading', message: 'Ready to upload' };
  isUploading = false;
  uploadError: string | null = null;
  extractedData: BillOfLadingData | null = null;
  showDocumentUploadModal = true;
  // Output event to send data to parent component
  @Output() documentProcessed = new EventEmitter<BillOfLadingData>();
  @Output() documentCleared = new EventEmitter<void>();
  
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService,
     public activeModal: NgbActiveModal
  ) {
    this.billOfLadingForm = this.createForm();
  }

  ngOnInit(): void {
    // Subscribe to upload progress
    const progressSub = this.documentService.getUploadProgress().subscribe(
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
      blNumber: [''],
      dateOfIssue: [''],
      placeOfIssue: [''],
      shipper: ['', Validators.required],
      shipperAddress: [''],
      consignee: ['', Validators.required],
      consigneeAddress: [''],
      notifyParty: [''],
      portOfLoading: ['', Validators.required],
      portOfDischarge: ['', Validators.required],
      placeOfReceipt: [''],
      placeOfDelivery: [''],
      vesselVoyage: ['', Validators.required],
      cargoDetails: ['', Validators.required],
      cargoDescription: [''],
      numberOfPackages: [''],
      packageType: [''],
      grossWeight: [''],
      measurement: [''],
      containerDetails: ['', Validators.required],
      consolNumber: [''],
      freightTerms: ['']
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadError = null;
    this.extractedData = null;
    
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
      console.log('File selected:', {
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

    try {
      console.log('Starting upload process...');
      
      const uploadSub = this.documentService.uploadBillOfLading(this.selectedFile).subscribe({
        next: (data) => {
          if (data) {
            console.log('Document processed successfully:', data);
            this.extractedData = data;
            this.populateForm(data);
            
            // Emit the processed data to parent component
            this.documentProcessed.emit(data);
            
            // Show warning for low confidence
            if (data.confidence < 0.7) {
              this.uploadError = `Document processed with low confidence (${Math.round(data.confidence * 100)}%). Please review the extracted data carefully.`;
            }
          }
        },
        error: (error) => {
          console.error('Upload failed:', error);
          this.uploadError = error.message || 'Failed to upload and process document';
          this.isUploading = false;
        },
        complete: () => {
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

  private populateForm(data: BillOfLadingData): void {
    this.billOfLadingForm.patchValue({
      blNumber: data.blNumber || '',
      dateOfIssue: this.toDateInputValue(data.dateOfIssue),
      placeOfIssue: data.placeOfIssue || '',
      shipper: data.shipper || '',
      shipperAddress: data.shipperAddress || '',
      consignee: data.consignee || '',
      consigneeAddress: data.consigneeAddress || '',
      notifyParty: data.notifyParty || '',
      portOfLoading: data.portOfLoading || '',
      portOfDischarge: data.portOfDischarge || '',
      placeOfReceipt: data.placeOfReceipt || '',
      placeOfDelivery: data.placeOfDelivery || '',
      vesselVoyage: data.vesselVoyage || '',
      cargoDetails: data.cargoDetails || '',
      cargoDescription: data.cargoDescription || '',
      numberOfPackages: data.numberOfPackages || '',
      packageType: data.packageType || '',
      grossWeight: data.grossWeight || '',
      measurement: data.measurement || '',
      containerDetails: data.containerDetails || '',
      consolNumber: data.consolNumber || '',
      freightTerms: data.freightTerms || ''
    });
  }

  private toDateInputValue(value: string | undefined): string {
    if (!value) {
      return '';
    }

    const text = String(value).trim();
    const ddMmYyyy = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (ddMmYyyy) {
      const day = ddMmYyyy[1].padStart(2, '0');
      const month = ddMmYyyy[2].padStart(2, '0');
      return `${ddMmYyyy[3]}-${month}-${day}`;
    }

    const yyyyMmDd = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyyMmDd) {
      return `${yyyyMmDd[1]}-${yyyyMmDd[2].padStart(2, '0')}-${yyyyMmDd[3].padStart(2, '0')}`;
    }

    return '';
  }

  private testConnection(): void {
    this.documentService.testConnection().subscribe({
      next: (response) => {
        console.log('Backend connection successful:', response);
      },
      error: (error) => {
        console.warn('Backend connection failed:', error);
        this.uploadError = 'Warning: Cannot connect to backend service';
      }
    });
  }

  onSubmit(): void {
    if (this.billOfLadingForm.valid) {
      const formData = {
        ...this.billOfLadingForm.value,
        confidence: this.extractedData?.confidence || 0
      };
      console.log('Form submitted:', formData);
      
      // Emit the final form data to parent component
      this.documentProcessed.emit(formData);
      this.activeModal.close(formData);
    } else {
      this.markFormGroupTouched(this.billOfLadingForm);
      this.uploadError = 'Please fill in all required fields';
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  clearForm(): void {
    this.billOfLadingForm.reset();
    this.selectedFile = null;
    this.uploadError = null;
    this.extractedData = null;
    
    // Emit clear event to parent
    this.documentCleared.emit();
    
    // Reset file input
    const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Utility methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.billOfLadingForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.billOfLadingForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      // Document Information
      blNumber: 'B/L Number',
      dateOfIssue: 'Date of Issue',
      placeOfIssue: 'Place of Issue',
      freightTerms: 'Freight Terms',
      
      // Shipper Information
      shipper: 'Shipper',
      shipperAddress: 'Shipper Address',
      
      // Consignee Information
      consignee: 'Consignee',
      consigneeAddress: 'Consignee Address',
      
      // Notify Party Information
      notifyParty: 'Notify Party',
      notifyPartyAddress: 'Notify Party Address',
      
      // Delivery Agent Information
      deliveryAgent: 'Delivery Agent',
      deliveryAgentAddress: 'Delivery Agent Address',
      
      // Ports and Places
      portOfLoading: 'Port of Loading',
      portOfDischarge: 'Port of Discharge',
      placeOfReceipt: 'Place of Receipt',
      placeOfDelivery: 'Place of Delivery',
      
      // Vessel Information
      vesselVoyage: 'Vessel/Voyage',
      
      // Cargo Information
      cargoDetails: 'Cargo Details',
      cargoDescription: 'Cargo Description',
      marksAndNumbers: 'Marks and Numbers',
      numberOfPackages: 'Number of Packages',
      packageType: 'Package Type',
      grossWeight: 'Gross Weight',
      measurement: 'Measurement',
      
      // Container Information
      containerDetails: 'Container Details',
      consolNumber: 'Consol Number'
    };
    return labels[fieldName] || fieldName;
  }

  // Methods for displaying extracted data details
  showExtractedDataModal(): void {
    if (this.extractedData) {
      const modal = document.getElementById('extractedDataModal');
      if (modal) {
        modal.style.display = 'block';
      }
    }
  }

  closeExtractedDataModal(): void {
    const modal = document.getElementById('extractedDataModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
  getRoundedConfidence(confidence: number): number {
    return Math.round(confidence);
  }

closeModal(): void {
    // Reset all component state when closing modal
    this.activeModal.dismiss('cancel');
  }


}
