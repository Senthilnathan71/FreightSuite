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
import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DocumentService, BillOfLadingData, UploadProgress } from '../services/document.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { OperationService } from '../operation.service';

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

  // ---- Master data + context passed in by the parent (Master / House screen) ----
  @Input() portList: any[] = [];
  @Input() departmentList: any[] = [];
  @Input() customerList: any[] = [];
  @Input() containerTypeList: any[] = [];
  @Input() defaultDepartmentSid: number | null = null;
  @Input() companyMasterSid: number | null = null;
  @Input() mode: 'master' | 'house' = 'master';
  // MBL-only upload (Master Job only): hides the Customer dropdown and drops its
  // required validator. The parent does not create a House Job in this mode.
  @Input() mblOnly = false;

  // Dropdown display configs (reused from the main screens)
  readonly portConfig = DROPDOWN_CONFIGS['PORT'];
  readonly departmentConfig = DROPDOWN_CONFIGS['DEPARTMENT'];
  readonly customerConfig = DROPDOWN_CONFIGS['CUSTOMER'];
  readonly containerTypeConfig = DROPDOWN_CONFIGS['CONTAINER_TYPE'];

  // Resolved selections (the actual master-data objects the user picked / matched)
  selectedDepartment: any = null;
  selectedCustomer: any = null;
  selectedPOL: any = null;
  selectedPOD: any = null;
  selectedPOR: any = null;
  selectedPODel: any = null;
  selectedContainerType: any = null;

  // Per-field "could not auto-match" hints shown under each dropdown
  matchHints: { [key: string]: string } = {};

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService,
    private operationService: OperationService,
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

    // MBL-only flow: the Customer is not captured here, so drop its required
    // validator (the field is hidden in the template).
    if (this.mblOnly) {
      const customerCtrl = this.billOfLadingForm.get('CustomerMasterSid');
      customerCtrl?.clearValidators();
      customerCtrl?.updateValueAndValidity();
    }

    // Apply the default department (from the parent screen) if its list is present.
    this.applyDefaultDepartment();

    // The modal must be self-sufficient: when the parent screen has not loaded a
    // list yet (e.g. uploading on a brand-new job), load it here so the Department,
    // Port and Customer dropdowns always have items to match/select.
    this.ensureDepartmentList();
    this.ensurePortList();
    this.ensureCustomerList();
    this.ensureContainerTypeList();

    // Test connection on component load
    this.testConnection();
  }

  private applyDefaultDepartment(): void {
    if (!this.defaultDepartmentSid || this.selectedDepartment) {
      return;
    }
    const dept = this.departmentList?.find(d => d.DepartmentMasterSid === this.defaultDepartmentSid);
    if (dept) {
      this.selectedDepartment = dept;
      this.billOfLadingForm.get('DepartmentMasterSid')?.setValue(dept.DepartmentMasterSid);
    }
  }

  private departmentListLoading = false;

  /** Loads the department list when the parent did not supply one. */
  private ensureDepartmentList(): void {
    if (this.departmentListLoading || (this.departmentList && this.departmentList.length) || !this.companyMasterSid) {
      return;
    }
    this.departmentListLoading = true;
    const sub = this.operationService.getAllDepartments(this.companyMasterSid).subscribe({
      next: (resp: any) => {
        this.departmentList = resp?.data || (Array.isArray(resp) ? resp : []);
        this.departmentListLoading = false;
        this.applyDefaultDepartment();
      },
      error: () => { this.departmentListLoading = false; },
    });
    this.subscriptions.push(sub);
  }

  private portListLoading = false;

  /** Loads the port master when the parent did not supply one. */
  private ensurePortList(): void {
    if (this.portListLoading || (this.portList && this.portList.length)) {
      return;
    }
    this.portListLoading = true;
    const sub = this.operationService.getAllPorts().subscribe({
      next: (resp: any) => {
        const ports = resp?.data || (Array.isArray(resp) ? resp : []);
        this.portList = ports.map((p: any) => ({ ...p, Country: p?.countryMaster?.countryName }));
        this.portListLoading = false;
        // Re-run port matching now that the list is available.
        if (this.extractedData) {
          this.autoMatchSelections(this.extractedData);
        }
      },
      error: () => { this.portListLoading = false; },
    });
    this.subscriptions.push(sub);
  }

  private containerTypeListLoading = false;

  /** Loads the container-type master when the parent did not supply one. */
  private ensureContainerTypeList(): void {
    if (this.containerTypeListLoading || (this.containerTypeList && this.containerTypeList.length)) {
      return;
    }
    this.containerTypeListLoading = true;
    const sub = this.operationService.getAllContainerTypes().subscribe({
      next: (resp: any) => {
        this.containerTypeList = resp?.data || (Array.isArray(resp) ? resp : []);
        this.containerTypeListLoading = false;
        if (this.extractedData) {
          this.matchContainerType(this.extractedData);
        }
      },
      error: () => { this.containerTypeListLoading = false; },
    });
    this.subscriptions.push(sub);
  }

  private customerListLoading = false;

  /** Loads the customer master when the parent did not supply a populated list. */
  private ensureCustomerList(): void {
    if (this.customerListLoading || (this.customerList && this.customerList.length) || !this.companyMasterSid) {
      return;
    }
    this.customerListLoading = true;
    const customerSub = this.operationService.getAllCustomersWithBranch(this.companyMasterSid).subscribe({
      next: (customers: any) => {
        this.customerList = Array.isArray(customers) ? customers : (customers?.data || []);
        this.customerListLoading = false;
        // Re-derive the customer if the document was already processed.
        if (this.extractedData) {
          this.deriveCustomerByDirection(this.extractedData);
        }
      },
      error: () => { this.customerListLoading = false; },
    });
    this.subscriptions.push(customerSub);
  }

  /** Export / Import direction of the currently selected department. */
  get direction(): string {
    return this.normalizeText(this.selectedDepartment?.ExportImport);
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
      // Raw extracted port text (kept for reference / emit). The actual port is
      // chosen through the dropdown-bound *Sid controls below.
      portOfLoading: [''],
      portOfDischarge: [''],
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
      freightTerms: [''],
      // ---- Resolved selections (dropdowns) ----
      DepartmentMasterSid: [null, Validators.required],
      CustomerMasterSid: [null, Validators.required],
      POLSid: [null, Validators.required],
      PODSid: [null, Validators.required],
      PORSid: [null],
      PODelSid: [null],
      ContainerTypeSid: [null],
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

    // Make sure all master lists are available before the extracted data is applied.
    this.ensureDepartmentList();
    this.ensurePortList();
    this.ensureCustomerList();
    this.ensureContainerTypeList();

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

    // Try to resolve the extracted ports & customer against the master data.
    this.autoMatchSelections(data);
  }

  /**
   * Auto-matches the extracted strings to the master data:
   *  - the 4 ports -> port dropdowns
   *  - the customer -> by department direction (Export=Shipper, Import=Consignee)
   * Anything that cannot be matched is left empty with a hint for the user.
   */
  private autoMatchSelections(data: BillOfLadingData): void {
    this.matchHints = {};

    this.selectedPOL = this.matchPort('POL', data.portOfLoading, true);
    this.selectedPOD = this.matchPort('POD', data.portOfDischarge, true);
    this.selectedPOR = this.matchPort('POR', data.placeOfReceipt, false);
    this.selectedPODel = this.matchPort('PODel', data.placeOfDelivery, false);

    this.billOfLadingForm.patchValue({
      POLSid: this.selectedPOL?.PortMasterSid ?? null,
      PODSid: this.selectedPOD?.PortMasterSid ?? null,
      PORSid: this.selectedPOR?.PortMasterSid ?? null,
      PODelSid: this.selectedPODel?.PortMasterSid ?? null,
    });

    this.deriveCustomerByDirection(data);
    this.matchContainerType(data);
  }

  /** Matches the extracted container type (e.g. "40HC") to the container-type master. */
  private matchContainerType(data: BillOfLadingData): void {
    const raw = data?.containerType || '';
    if (!raw) {
      return;
    }
    const containerType = this.findContainerTypeByText(raw);
    this.selectedContainerType = containerType;
    this.billOfLadingForm.get('ContainerTypeSid')?.setValue(containerType?.ContainerTypeMasterSid ?? null);
    if (!containerType) {
      this.matchHints['CONTAINERTYPE'] = `"${raw}" not matched — please select the Container Type.`;
    } else {
      delete this.matchHints['CONTAINERTYPE'];
    }
  }

  private findContainerTypeByText(value: string): any {
    const normalized = this.normalizeText(value); // e.g. "40HC"
    if (!normalized || !this.containerTypeList?.length) {
      return null;
    }

    // Split "40HC" -> size digits "40" + type abbreviation "HC", and map the
    // abbreviation to the descriptive word used in ContainerName ("HIGH CUBE").
    const parsed = normalized.match(/^(\d{2})([A-Z]+)$/);
    const sizeDigits = parsed?.[1] || '';
    const typeAbbr = parsed?.[2] || '';
    const typeWords: { [key: string]: string } = {
      HC: 'HIGHCUBE', HQ: 'HIGHCUBE', GP: 'GENERAL', DC: 'STANDARD', DV: 'STANDARD',
      RF: 'REEFER', RH: 'REEFER', RE: 'REEFER', OT: 'OPENTOP', FR: 'FLATRACK', TK: 'TANK',
    };
    const typeWord = typeWords[typeAbbr] || '';

    return this.containerTypeList.find(ct => {
      const name = this.normalizeText(ct?.ContainerName);
      const code = this.normalizeText(ct?.ContainerCode);
      const size = this.normalizeText(ct?.ContainerSize);
      const iso = this.normalizeText(ct?.ContainerIsoCode);

      // Direct matches first.
      if (code === normalized || iso === normalized || size === normalized || name === normalized) {
        return true;
      }
      if (`${size}${code}` === normalized) {
        return true;
      }

      // Size + type match: the entry must reflect BOTH the size and the type, so
      // "40HC" matches "40ft High Cube" but never "45ft High Cube" or "40ft Standard".
      if (sizeDigits && typeAbbr) {
        const hasSize = name.includes(sizeDigits) || size.includes(sizeDigits) || code.includes(sizeDigits);
        const hasType = name.includes(typeAbbr) || code.includes(typeAbbr) || size.includes(typeAbbr) ||
          (!!typeWord && name.includes(typeWord));
        if (hasSize && hasType) {
          return true;
        }
      }
      return false;
    }) || null;
  }

  onContainerTypeSelected(containerType: any): void {
    this.selectedContainerType = containerType || null;
    if (containerType) { delete this.matchHints['CONTAINERTYPE']; }
  }

  private matchPort(key: string, rawValue: string, required: boolean): any {
    if (!rawValue) {
      return null;
    }
    const port = this.findPortByText(rawValue);
    if (!port && required) {
      this.matchHints[key] = 'Not matched automatically — please select the port.';
    }
    return port;
  }

  /** Picks the House customer from the BoL parties by department direction. */
  private deriveCustomerByDirection(data: BillOfLadingData): void {
    const partyName = this.direction === 'IMPORT'
      ? (data.consignee || data.notifyParty || '')
      : (data.shipper || '');

    if (!partyName) {
      return;
    }

    const customer = this.findCustomerByText(partyName);
    if (customer) {
      this.selectedCustomer = customer;
      this.billOfLadingForm.get('CustomerMasterSid')?.setValue(customer.CustomerMasterSid);
      delete this.matchHints['CUSTOMER'];
    } else {
      this.selectedCustomer = null;
      this.billOfLadingForm.get('CustomerMasterSid')?.setValue(null);
      this.matchHints['CUSTOMER'] = 'Not matched automatically — please select the Customer.';
    }
  }

  // ---- Dropdown change handlers ----
  onDepartmentSelected(dept: any): void {
    this.selectedDepartment = dept || null;
    // Re-derive the customer using the new direction and the extracted parties.
    if (this.extractedData) {
      this.deriveCustomerByDirection(this.extractedData);
    }
  }

  onPortSelected(key: 'POL' | 'POD' | 'POR' | 'PODel', port: any): void {
    if (key === 'POL') { this.selectedPOL = port; }
    if (key === 'POD') { this.selectedPOD = port; }
    if (key === 'POR') { this.selectedPOR = port; }
    if (key === 'PODel') { this.selectedPODel = port; }
    if (port) { delete this.matchHints[key]; }
  }

  onCustomerSelected(customer: any): void {
    this.selectedCustomer = customer || null;
    if (customer) { delete this.matchHints['CUSTOMER']; }
  }

  // ---- Matching helpers ----
  private findPortByText(value: string): any {
    const full = this.normalizeText(value);
    // City part = text before the first comma, dropping the country.
    // e.g. "JEBEL ALI,UNITED ARAB EMIRATES" -> "JEBEL ALI"
    const city = this.normalizeText(String(value || '').split(',')[0]);
    const candidates = [full, city].filter(v => v && v.length >= 3);
    if (!candidates.length || !this.portList?.length) {
      return null;
    }

    return this.portList.find(port => {
      const code = this.normalizeText(port?.PortCode);
      const name = this.normalizeText(port?.PortName);
      // Drop a trailing "PORT" so "JEBELALIPORT" matches "JEBELALI".
      const nameCore = name.replace(/PORT$/, '');
      const unCode = this.normalizeText(port?.UNLOCODE || port?.UnLocode || port?.UNCode);

      return candidates.some(v =>
        code === v ||
        unCode === v ||
        name === v ||
        (!!nameCore && nameCore === v) ||
        (!!code && v.includes(code)) ||
        (!!name && v.includes(name)) ||
        (!!nameCore && nameCore.length >= 4 && (v.startsWith(nameCore) || nameCore.startsWith(v))) ||
        (!!name && name.startsWith(v))
      );
    }) || null;
  }

  private findCustomerByText(value: string): any {
    const normalized = this.normalizeText(value);
    if (!normalized || !this.customerList?.length) {
      return null;
    }
    return this.customerList.find(customer => {
      const name = this.normalizeText(customer?.CustomerName);
      return !!name && (name === normalized || normalized.includes(name) || name.includes(normalized));
    }) || null;
  }

  private normalizeText(value: any): string {
    return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  /**
   * Save is allowed only when Department and both required ports are set. The
   * Customer is also required for the MBL/HBL flow, but not for MBL-only (mblOnly).
   */
  get canSave(): boolean {
    return !!this.billOfLadingForm.get('DepartmentMasterSid')?.value &&
      (this.mblOnly || !!this.billOfLadingForm.get('CustomerMasterSid')?.value) &&
      !!this.billOfLadingForm.get('POLSid')?.value &&
      !!this.billOfLadingForm.get('PODSid')?.value &&
      !!this.extractedData;
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
    if (this.billOfLadingForm.valid && this.canSave) {
      const formData = {
        ...this.billOfLadingForm.value,
        // These are extracted by the backend but not shown as editable controls,
        // so forward them explicitly so the parent (House/Master Job) can patch them.
        netWeight: this.extractedData?.netWeight ?? '',
        marksAndNumbers: this.extractedData?.marksAndNumbers ?? '',
        sealNumber: this.extractedData?.sealNumber ?? '',
        // Raw text passed through so the parent can re-scan for fields (e.g. seal)
        // that are not surfaced as dedicated controls.
        extractedText: this.extractedData?.extractedText ?? '',
        confidence: this.extractedData?.confidence || 0,
        // Resolved selections for the parent screen to apply directly.
        departmentMasterSid: this.selectedDepartment?.DepartmentMasterSid ?? this.billOfLadingForm.get('DepartmentMasterSid')?.value,
        department: this.selectedDepartment,
        customerMasterSid: this.selectedCustomer?.CustomerMasterSid ?? this.billOfLadingForm.get('CustomerMasterSid')?.value,
        customer: this.selectedCustomer,
        resolvedPOL: this.selectedPOL,
        resolvedPOD: this.selectedPOD,
        resolvedPOR: this.selectedPOR,
        resolvedPODel: this.selectedPODel,
        containerTypeMasterSid: this.selectedContainerType?.ContainerTypeMasterSid ?? this.billOfLadingForm.get('ContainerTypeSid')?.value ?? null,
        containerType: this.selectedContainerType,
        mode: this.mode,
      };

      // Emit the final form data to parent component
      this.documentProcessed.emit(formData);
      this.activeModal.close(formData);
    } else {
      this.markFormGroupTouched(this.billOfLadingForm);
      this.uploadError = 'Please select Department, Port of Loading, Port of Discharge and Customer before saving.';
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
