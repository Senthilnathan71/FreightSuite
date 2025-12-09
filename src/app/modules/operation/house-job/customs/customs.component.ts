import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { OperationService } from '../../operation.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

// Interface for validation errors from backend
interface MandatoryFieldError {
  recordType: 'VOY' | 'BOL' | 'CON' | 'CTR';
  fieldRef: string;
  fieldName: string;
  houseJobSid?: number;
  hblNo?: string;
}

@Component({
  selector: 'app-customs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './customs.component.html',
  styleUrls: ['./customs.component.scss'],
})
export class CustomsComponent implements OnInit, OnChanges {
  @Input() formData: any;
  @Input() dataItems: any[] = [];
  @Input() resetTrigger = false;
  @Input() screenName: 'HouseJob' | 'MasterJob' = 'HouseJob';

  @Output() dataEmitter = new EventEmitter<any>();
  
  customsForm!: FormGroup;
  loading = false;
  houseJobSid: number | null = null;
  masterJobSid: number | null = null;

  // Validation modal properties
  showValidationModal = false;
  validationErrors: MandatoryFieldError[] = [];
  groupedErrors: { [key: string]: MandatoryFieldError[] } = {};

  // Importer Codes
  importerCodeList = [
    { value: 'D9999', label: 'Personal Effects / Empty Containers' },
    { value: 'T9999', label: 'Trans-Shipment' },
  ];

  // Cargo Code
  cargoCodeList = [
    { value: 'F', label: 'FCL Container' },
    { value: 'L', label: 'LCL Container' },
    { value: 'M', label: 'Empty Container' },
    { value: 'B', label: 'Bulk Solid' },
    { value: 'Q', label: 'Bulk Liquid' },
    { value: 'R', label: 'RO-RO Unit' },
    { value: 'P', label: 'Passenger' },
    { value: 'G', label: 'General Cargo (Break Bulk)' },
  ];

  // Storage Request
  storageRequestList = [
    { value: 'D', label: 'Direct Delivery' },
    { value: 'S', label: 'Storage in Sheds' },
    { value: 'Y', label: 'Storage in Yards' },
  ];

  // Used Or New
  usedNewList = [
    { value: 'U', label: 'Used' },
    { value: 'N', label: 'New' },
  ];

  // Temperature Units
  temperatureUnitList = [
    { value: 'F', label: 'Fahrenheit' },
    { value: 'C', label: 'Celsius' },
  ];

  // Hazard Storage Request
  hazStorageList = [
    { value: 'D', label: 'Direct Delivery' },
    { value: 'S', label: 'Storage in Sheds' },
    { value: 'Y', label: 'Storage in Yards' },
  ];

  // Package Types (from API)
  packageTypeList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private operationService: OperationService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadPackageTypes();
  }

  private initForm() {
    this.customsForm = this.fb.group({
      HouseJobCustomsSid: [null],
      CompanyMasterSid: [null, Validators.required],
      HouseJobSid: [null],
      MasterJobSid: [null],

      LineCode: ['', [Validators.required, Validators.maxLength(6)]],
      VoyageAgentCode: ['', [Validators.required, Validators.maxLength(6)]],
      RotationNumber: ['', [Validators.required, Validators.maxLength(6)]],
      ManifestSequence: ['', [Validators.required, Validators.maxLength(5)]],

      CargoCode: ['F', [Validators.required, Validators.maxLength(1)]],
      StorageRequest: ['D', Validators.maxLength(1)],
      PackageTypeCode: ['', [Validators.required, Validators.maxLength(3)]],

      FreightTonne: ['', [Validators.pattern(/^\d{0,6}(\.\d{0,3})?$/)]],
      NoOfPallets: ['', [Validators.pattern(/^\d{1,4}$/)]],
      SLACIndicator: ['', Validators.maxLength(1)],

      ImporterCode: ['null', [Validators.required, Validators.maxLength(5)]],

      SerialNumber: ['', [Validators.required, Validators.pattern(/^\d{1,6}$/)]],
      UsedOrNew: ['U', [Validators.required, Validators.maxLength(1)]],
      UNHSCode: ['', [Validators.required, Validators.maxLength(10)]],
      UNNumber: ['', Validators.maxLength(5)],

      FlashPoints: ['', [Validators.pattern(/^\d{0,3}(\.\d{0,1})?$/)]],
      TemperatureUnit: ['C', Validators.maxLength(1)],
      HazStorageRequest: ['D', Validators.maxLength(1)],
      RefrigerationRequired: ['', Validators.maxLength(1)],

      MinTemperature: ['', [Validators.pattern(/^\d{0,3}(\.\d{0,1})?$/)]],
      MaxTemperature: ['', [Validators.pattern(/^\d{0,3}(\.\d{0,1})?$/)]],
      RefTemperatureUnit: ['C', Validators.maxLength(1)],

      CreatedBy: [''],
      UpdatedBy: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formData'] && this.formData) {
      this.houseJobSid = this.formData.HouseJobSid || null;
      this.masterJobSid = this.formData.MasterJobSid || null;
      this.customsForm.patchValue({
        CompanyMasterSid: this.formData.CompanyMasterSid,
        HouseJobSid: this.screenName === 'HouseJob' ? this.formData.HouseJobSid : null,
        MasterJobSid: this.screenName === 'MasterJob' ? this.formData.MasterJobSid : null,
        CreatedBy: this.formData.CreatedBy,
        UpdatedBy: this.formData.UpdatedBy,
      });
      this.emitData();
    }

    if (changes['dataItems'] && Array.isArray(this.dataItems)) {
      if (this.dataItems.length > 0) {
        // Take only the first customs record (single form like Others tab)
        this.customsForm.patchValue(this.dataItems[0]);
      } else {
        this.resetForm();
      }
      this.emitData();
    }

    if (changes['resetTrigger'] && this.resetTrigger) {
      this.resetForm();
    }
  }

  onFormChange() {
    this.emitData();
  }

  resetForm() {
    this.customsForm.reset({
      CompanyMasterSid: this.formData?.CompanyMasterSid,
      HouseJobSid: this.screenName === 'HouseJob' ? this.formData?.HouseJobSid : null,
      MasterJobSid: this.screenName === 'MasterJob' ? this.formData?.MasterJobSid : null,
      CargoCode: 'F',
      StorageRequest: 'D',
      UsedOrNew: 'U',
      TemperatureUnit: 'C',
      HazStorageRequest: 'D',
      RefTemperatureUnit: 'C',
      CreatedBy: this.formData?.CreatedBy,
      UpdatedBy: this.formData?.UpdatedBy,
    });
    this.emitData();
  }

  emitData() {
    const data = {
      dataItems: [this.customsForm.value], // Wrap in array for consistency
      formData: this.formData
    };
    this.dataEmitter.emit(data);
  }

  getCustomsData(): any[] {
    // Return an array with the single form value if form is valid and has data
    const formValue = this.customsForm.value;
    
    // Check if any required field is filled
    const hasData = formValue.LineCode || 
                   formValue.VoyageAgentCode || 
                   formValue.RotationNumber || 
                   formValue.ManifestSequence;
    
    if (hasData) {
      // If editing existing record
      if (this.dataItems.length > 0 && this.dataItems[0]?.HouseJobCustomsSid) {
        return [{
          ...formValue,
          HouseJobCustomsSid: this.dataItems[0].HouseJobCustomsSid,
          UpdatedBy: this.formData?.UpdatedBy || this.formData?.CreatedBy
        }];
      } else {
        // If creating new record
        return [{
          ...formValue,
          CreatedBy: this.formData?.CreatedBy || this.formData?.UpdatedBy
        }];
      }
    }
    
    // Return empty array if no data
    return [];
  }

  private loadPackageTypes() {
    this.operationService.getUOMsByType('E').subscribe({
      next: (resp) => {
        this.packageTypeList = resp.data;
      },
      error: (err) => {
        console.error('Failed to load package types:', err);
        this.toastr.error('Failed to load package types.');
      }
    });
  }

  generateEDIManifest() {
    // Basic frontend validation first
    const customsData = this.customsForm.value;
    const basicErrors: string[] = [];

    if (!customsData.LineCode) basicErrors.push('Line Code');
    if (!customsData.VoyageAgentCode) basicErrors.push('Voyage Agent Code');
    if (!customsData.ManifestSequence) basicErrors.push('Manifest Sequence');
    if (!customsData.SerialNumber) basicErrors.push('Serial Number');
    if (!customsData.UNHSCode) basicErrors.push('HS Code (UNHSCode)');
    if (!customsData.PackageTypeCode) basicErrors.push('Package Type Code');
    if (!customsData.ImporterCode || customsData.ImporterCode === 'null') basicErrors.push('Importer Code');

    if (basicErrors.length > 0) {
      this.toastr.warning(`Please fill the following Customs fields: ${basicErrors.join(', ')}`);
      return;
    }

    if (this.screenName === 'HouseJob') {
      if (!this.houseJobSid) {
        this.toastr.error('House Job ID not found');
        return;
      }
      this.spinner.show();
      this.operationService.generateHouseJobEDIManifest(this.houseJobSid).subscribe({
        next: (response: string) => {
          this.spinner.hide();
          this.downloadEDIFile(response, `EDI_Manifest_HouseJob_${this.houseJobSid}_${Date.now()}.txt`);
          this.toastr.success('EDI Manifest generated successfully');
        },
        error: (error) => {
          this.spinner.hide();
          this.handleValidationError(error);
        }
      });
    } else {
      if (!this.masterJobSid) {
        this.toastr.error('Master Job ID not found');
        return;
      }
      this.spinner.show();
      this.operationService.generateMasterJobEDIManifest(this.masterJobSid).subscribe({
        next: (response: string) => {
          this.spinner.hide();
          this.downloadEDIFile(response, `EDI_Manifest_MasterJob_${this.masterJobSid}_${Date.now()}.txt`);
          this.toastr.success('EDI Manifest generated successfully');
        },
        error: (error) => {
          this.spinner.hide();
          this.handleValidationError(error);
        }
      });
    }
  }

  /**
   * Handle validation errors from backend
   */
  private handleValidationError(error: any) {
    // Check if this is a validation error with field list
    if (error.error?.errors && Array.isArray(error.error.errors)) {
      this.validationErrors = error.error.errors;
      this.groupErrorsByRecordType();
      this.showValidationModal = true;
    } else {
      // Generic error
      this.toastr.error(error.error?.message || 'Failed to generate EDI Manifest');
    }
  }

  /**
   * Group validation errors by record type for display
   */
  private groupErrorsByRecordType() {
    this.groupedErrors = {};
    const recordTypeLabels: { [key: string]: string } = {
      'VOY': 'Voyage Details (VOY)',
      'BOL': 'Bill of Lading (BOL)',
      'CON': 'Consignment Details (CON)',
      'CTR': 'Container Details (CTR)'
    };

    for (const error of this.validationErrors) {
      const label = recordTypeLabels[error.recordType] || error.recordType;
      if (!this.groupedErrors[label]) {
        this.groupedErrors[label] = [];
      }
      this.groupedErrors[label].push(error);
    }
  }

  /**
   * Close validation modal
   */
  closeValidationModal() {
    this.showValidationModal = false;
    this.validationErrors = [];
    this.groupedErrors = {};
  }

  /**
   * Get grouped error keys for template iteration
   */
  getGroupedErrorKeys(): string[] {
    return Object.keys(this.groupedErrors);
  }

  private downloadEDIFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}