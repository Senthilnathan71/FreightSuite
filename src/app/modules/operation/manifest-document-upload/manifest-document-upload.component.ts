import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { ManifestService, ManifestData, UploadProgress } from '../services/manifest.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';

export interface ContainerInfo {
  containerNumber: string;
  containerType: string;
  sealNumber: string;
  size: string;
  weight: string;
  measurement: string;
}

export interface ManifestJobData {
  masterJob: {
    manifestNumber: string;
    jobNumber: string;
    vesselName: string;
    voyageNumber: string;
    portOfLoading: string;
    portOfDischarge: string;
    dateOfDeparture: string;
    dateOfArrival: string;
    etd: string;
    eta: string;
    agent: string;
    carrier: string;
    totalContainers: number;
    totalWeight: string;
    totalVolume: string;
    containerList: ContainerInfo[];
  };
  houseJobs: Array<{
    hblNumber: string;
    shipper: string;
    shipperAddress: string;
    consignee: string;
    consigneeAddress: string;
    notifyParty: string;
    cargoDescription: string;
    numberOfPackages: string;
    packageType: string;
    grossWeight: string;
    netWeight: string;
    measurement: string;
    containerNumbers: string[];
    marksAndNumbers: string;
    freightTerms: string;
  }>;
  confidence: number;
}

@Component({
  selector: 'app-manifest-document-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manifest-document-upload.component.html',
  styleUrls: ['./manifest-document-upload.component.scss']
})
export class ManifestDocumentUploadComponent implements OnInit, OnDestroy {
  manifestForm: FormGroup;
  selectedFile: File | null = null;
  uploadProgress: UploadProgress = { percentage: 0, stage: 'uploading', message: 'Ready to upload' };
  isUploading = false;
  uploadError: string | null = null;
  extractedData: ManifestJobData | null = null;
  showModal = false;

  // Output events
  @Output() documentProcessed = new EventEmitter<ManifestJobData>();
  @Output() documentCleared = new EventEmitter<void>();
  @Output() createJob = new EventEmitter<ManifestJobData>();

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private manifestService: ManifestService,
    public activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private emailTriggerService: EmailTriggerService,
  ) {
    this.manifestForm = this.createForm();
  }

  sendManualMail(): void {
    const currentCompany = this.appSettingService.getCurrentCompanyInfo();
    const currentBranch = this.appSettingService.getCurrentBranchInfo();
    this.emailTriggerService.triggerManualEmails({
      companyId: currentCompany?.CompanyMasterSid,
      branchId: currentBranch?.BranchMasterSid,
      menuMasterSid: Number(sessionStorage.getItem('currentMenuId')),
      action: 'UPDATE',
      context: {}
    });
  }

  ngOnInit(): void {
    // Reset component state on initialization
    this.resetComponentState();

    // Subscribe to upload progress
    const progressSub = this.manifestService.getUploadProgress().subscribe(
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

  private resetComponentState(): void {
    this.selectedFile = null;
    this.uploadError = null;
    this.extractedData = null;
    this.showModal = false;
    this.isUploading = false;
    this.uploadProgress = { percentage: 0, stage: 'uploading', message: 'Ready to upload' };
    this.houseJobsArray.clear();

    // Reset the manifest service progress as well
    this.manifestService.resetProgress();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Master Job Information
      manifestNumber: ['', Validators.required],
      jobNumber: [''],
      vesselName: ['', Validators.required],
      voyageNumber: ['', Validators.required],
      portOfLoading: ['', Validators.required],
      portOfDischarge: ['', Validators.required],
      dateOfDeparture: [''],
      dateOfArrival: [''],
      etd: [''],
      eta: [''],
      agent: [''],
      carrier: [''],
      totalContainers: [''],
      totalWeight: [''],
      totalVolume: [''],

      // House Jobs Array
      houseJobs: this.fb.array([]),

      // Additional metadata
      manifestDate: [''],
      manifestType: [''],
      remarks: ['']
    });
  }

  get houseJobsArray() {
    return this.manifestForm.get('houseJobs') as FormArray;
  }

  private createHouseJobGroup(houseJob?: any): FormGroup {
    // Convert single container number to array if it exists
    let containerNumbers = [];
    if (houseJob?.containerNumbers && Array.isArray(houseJob.containerNumbers)) {
      containerNumbers = houseJob.containerNumbers;
    } else if (houseJob?.containerNumber) {
      containerNumbers = [houseJob.containerNumber];
    }

    return this.fb.group({
      hblNumber: [houseJob?.hblNumber || '', Validators.required],
      shipper: [houseJob?.shipper || '', Validators.required],
      shipperAddress: [houseJob?.shipperAddress || ''],
      consignee: [houseJob?.consignee || '', Validators.required],
      consigneeAddress: [houseJob?.consigneeAddress || ''],
      notifyParty: [houseJob?.notifyParty || ''],
      cargoDescription: [houseJob?.cargoDescription || ''],
      numberOfPackages: [houseJob?.numberOfPackages || ''],
      packageType: [houseJob?.packageType || ''],
      grossWeight: [houseJob?.grossWeight || ''],
      netWeight: [houseJob?.netWeight || ''],
      measurement: [houseJob?.measurement || ''],
      containerNumbers: [containerNumbers.join(', ')], // Store as comma-separated string for UI
      marksAndNumbers: [houseJob?.marksAndNumbers || ''],
      freightTerms: [houseJob?.freightTerms || '']
    });
  }

  addHouseJob(houseJob?: any): void {
    this.houseJobsArray.push(this.createHouseJobGroup(houseJob));
  }

  removeHouseJob(index: number): void {
    this.houseJobsArray.removeAt(index);
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

      // Validate file size (20MB)
      if (file.size > 20 * 1024 * 1024) {
        this.uploadError = 'File size must be less than 20MB';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
      console.log('Manifest file selected:', {
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
      console.log('Starting manifest upload process...');

      const uploadSub = this.manifestService.uploadManifest(this.selectedFile).subscribe({
        next: (data) => {
          if (data) {
            console.log('Manifest processed successfully:', data);
            this.extractedData = data;
            this.populateForm(data);

            // Emit the processed data to parent component
            this.documentProcessed.emit(data);

            // Show warning for low confidence
            if (data.confidence < 0.7) {
              this.uploadError = `Manifest processed with low confidence (${Math.round(data.confidence * 100)}%). Please review the extracted data carefully.`;
            }
          }
        },
        error: (error) => {
          console.error('Manifest upload failed:', error);
          this.uploadError = error.message || 'Failed to upload and process manifest';
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

  private populateForm(data: ManifestJobData): void {
    if (data.masterJob) {
      this.manifestForm.patchValue({
        manifestNumber: data.masterJob.manifestNumber || '',
        jobNumber: data.masterJob.jobNumber || '',
        vesselName: data.masterJob.vesselName || '',
        voyageNumber: data.masterJob.voyageNumber || '',
        portOfLoading: data.masterJob.portOfLoading || '',
        portOfDischarge: data.masterJob.portOfDischarge || '',
        dateOfDeparture: data.masterJob.dateOfDeparture || '',
        dateOfArrival: data.masterJob.dateOfArrival || '',
        etd: data.masterJob.etd || '',
        eta: data.masterJob.eta || '',
        agent: data.masterJob.agent || '',
        carrier: data.masterJob.carrier || '',
        totalContainers: data.masterJob.totalContainers || '',
        totalWeight: data.masterJob.totalWeight || '',
        totalVolume: data.masterJob.totalVolume || ''
      });
    }

    // Clear existing house jobs and populate with extracted data
    this.houseJobsArray.clear();
    if (data.houseJobs && data.houseJobs.length > 0) {
      data.houseJobs.forEach(houseJob => {
        this.addHouseJob(houseJob);
      });
    }
  }

  private testConnection(): void {
    this.manifestService.testConnection().subscribe({
      next: (response) => {
        console.log('Manifest service connection successful:', response);
      },
      error: (error) => {
        console.warn('Manifest service connection failed:', error);
        this.uploadError = 'Warning: Cannot connect to manifest service';
      }
    });
  }

  onCreateJob(): void {
    if (this.extractedData && this.manifestForm.valid) {
      const jobData: ManifestJobData = {
        ...this.extractedData,
        masterJob: {
          ...this.extractedData.masterJob,
          ...this.manifestForm.value
        }
      };

      console.log('Creating job with manifest data:', jobData);
      this.createJob.emit(jobData);
      this.activeModal.close(jobData);
    } else {
      this.markFormGroupTouched(this.manifestForm);
      this.uploadError = 'Please upload and process a manifest document first, then fill in all required fields';
    }
  }

  showExtractedDataModal(): void {
    this.showModal = true;
  }

  closeExtractedDataModal(): void {
    this.showModal = false;
  }

  clearForm(): void {
    this.manifestForm.reset();
    this.uploadError = null;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  resetForm(): void {
    this.manifestForm.reset();
    this.houseJobsArray.clear();
    this.selectedFile = null;
    this.uploadError = null;
    this.extractedData = null;
    this.showModal = false;
    this.isUploading = false;
    this.uploadProgress = { percentage: 0, stage: 'uploading', message: 'Ready to upload' };

    // Reset the manifest service progress as well
    this.manifestService.resetProgress();

    // Emit clear event
    this.documentCleared.emit();

    // Reset file input
    const fileInput = document.getElementById('manifestFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  closeModal(): void {
    // Reset all component state when closing modal
    this.resetForm();
    this.activeModal.dismiss('cancel');
  }

  // Utility methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.manifestForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.manifestForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      manifestNumber: 'Manifest Number',
      vesselName: 'Vessel Name',
      voyageNumber: 'Voyage Number',
      portOfLoading: 'Port of Loading',
      portOfDischarge: 'Port of Discharge',
      dateOfDeparture: 'Date of Departure',
      dateOfArrival: 'Date of Arrival',
      agent: 'Agent',
      carrier: 'Carrier',
      totalContainers: 'Total Containers',
      totalWeight: 'Total Weight',
      totalVolume: 'Total Volume',
      manifestDate: 'Manifest Date',
      manifestType: 'Manifest Type',
      remarks: 'Remarks'
    };
    return labels[fieldName] || fieldName;
  }

  getRoundedConfidence(confidence: number): number {
    return Math.round(confidence * 100);
  }

  // Method to show extracted data details
  showHouseJobDetails(): boolean {
    return !!(this.extractedData && this.extractedData.houseJobs && this.extractedData.houseJobs.length > 0);
  }
}