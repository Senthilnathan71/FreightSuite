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
  AbstractControl,
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
  tabName?: string;
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
  @Input() isFormDisabled: boolean = false;
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
  groupedByHBL: { [hblNo: string]: { [recordType: string]: MandatoryFieldError[] } } = {};

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

    this.updateFormDisabledState();
  }

  onFormChange() {
    this.emitData();
  }

  isFieldRequired(controlName: string): boolean {
    const control = this.customsForm?.get(controlName);
    if (!control) {
      return false;
    }

    const validator = control.validator ? control.validator({} as AbstractControl) : null;
    return !!validator?.['required'];
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
      dataItems: [this.customsForm.getRawValue()], // Wrap in array for consistency
      formData: this.formData
    };
    this.dataEmitter.emit(data);
  }

  getCustomsData(): any[] {
    // Return an array with the single form value if form is valid and has data
    const formValue = this.customsForm.getRawValue();
    
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

  /**
   * Validate customs required fields before parent save operation.
   * Returns true if valid (or no customs data entered), false if validation errors exist.
   * Shows validation modal with missing fields when invalid.
   */
  validateForSave(): boolean {
    const errors = this.getValidationErrorsForSave();
    if (errors.length > 0) {
      this.validationErrors = errors;
      this.groupErrorsByHBL();
      this.showValidationModal = true;
      return false;
    }
    return true;
  }

  /**
   * Returns customs validation errors without showing any modal.
   * Parent components can use this to display errors in their own UI.
   */
  getValidationErrorsForSave(): MandatoryFieldError[] {
    const formValue = this.customsForm.value;

    // Only validate if user has started entering customs data
    const hasData = formValue.LineCode ||
                    formValue.VoyageAgentCode ||
                    formValue.RotationNumber ||
                    formValue.ManifestSequence;

    if (!hasData) return []; // No customs data to validate

    const errors: MandatoryFieldError[] = [];

    if (!formValue.LineCode) {
      errors.push({ recordType: 'VOY', fieldRef: '1.1', fieldName: 'Line Code', tabName: 'Customs' });
    }
    if (!formValue.VoyageAgentCode) {
      errors.push({ recordType: 'VOY', fieldRef: '1.2', fieldName: 'Voyage Agent Code', tabName: 'Customs' });
    }
    if (!formValue.RotationNumber) {
      errors.push({ recordType: 'VOY', fieldRef: '1.7', fieldName: 'Rotation Number', tabName: 'Customs' });
    }
    if (!formValue.ManifestSequence) {
      errors.push({ recordType: 'VOY', fieldRef: '1.10', fieldName: 'Manifest Sequence', tabName: 'Customs' });
    }
    if (!formValue.PackageTypeCode) {
      errors.push({ recordType: 'BOL', fieldRef: '2.46', fieldName: 'Package Type Code', tabName: 'Customs' });
    }
    if (!formValue.ImporterCode || formValue.ImporterCode === 'null') {
      errors.push({ recordType: 'BOL', fieldRef: '2.29', fieldName: 'Importer Code', tabName: 'Customs' });
    }
    if (!formValue.SerialNumber) {
      errors.push({ recordType: 'CON', fieldRef: '3.1', fieldName: 'Serial Number', tabName: 'Customs' });
    }
    if (!formValue.UNHSCode) {
      errors.push({ recordType: 'CON', fieldRef: '3.5', fieldName: 'HS Code (Commodity Code)', tabName: 'Customs' });
    }

    return errors;
  }

  private loadPackageTypes() {
    this.operationService.getUOMsByType('P').subscribe({
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
    if (this.isEffectiveFormDisabled) {
      return;
    }
    // Basic frontend validation - show in modal instead of toast
    const customsData = this.customsForm.value;
    const basicErrors: MandatoryFieldError[] = [];

    if (!customsData.LineCode) {
      basicErrors.push({ recordType: 'VOY', fieldRef: '1.1', fieldName: 'Line Code' });
    }
    if (!customsData.VoyageAgentCode) {
      basicErrors.push({ recordType: 'VOY', fieldRef: '1.2', fieldName: 'Voyage Agent Code' });
    }
    if (!customsData.ManifestSequence) {
      basicErrors.push({ recordType: 'VOY', fieldRef: '1.10', fieldName: 'Manifest Sequence' });
    }
    if (!customsData.SerialNumber) {
      basicErrors.push({ recordType: 'CON', fieldRef: '3.1', fieldName: 'Serial Number' });
    }
    if (!customsData.UNHSCode) {
      basicErrors.push({ recordType: 'CON', fieldRef: '3.5', fieldName: 'HS Code (Commodity Code)' });
    }
    if (!customsData.PackageTypeCode) {
      basicErrors.push({ recordType: 'BOL', fieldRef: '2.46', fieldName: 'Package Type Code' });
    }
    if (!customsData.ImporterCode || customsData.ImporterCode === 'null') {
      basicErrors.push({ recordType: 'BOL', fieldRef: '2.29', fieldName: 'Importer Code (Consignee Code)' });
    }

    if (basicErrors.length > 0) {
      // Show in modal instead of toast
      this.validationErrors = basicErrors;
      this.groupErrorsByHBL();
      this.showValidationModal = true;
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
    // When responseType is 'text', Angular returns the error body as a raw string
    let errorBody = error.error;
    if (typeof errorBody === 'string') {
      try {
        errorBody = JSON.parse(errorBody);
      } catch (e) {
        // Not valid JSON, keep as-is
      }
    }

    // Check if this is a validation error with field list
    if (errorBody?.errors && Array.isArray(errorBody.errors)) {
      this.validationErrors = errorBody.errors;
      this.groupErrorsByHBL();
      this.showValidationModal = true;
    } else {
      // Generic error
      this.toastr.error(errorBody?.message || 'Failed to generate EDI Manifest');
    }
  }

  /**
   * Group validation errors by HBL number first, then by tab name for user-friendly display
   */
  private groupErrorsByHBL() {
    this.groupedByHBL = {};

    for (const error of this.validationErrors) {
      const hblKey = error.hblNo || 'Common Fields';
      const tabLabel = error.tabName || this.getTabNameForField(error);

      if (!this.groupedByHBL[hblKey]) {
        this.groupedByHBL[hblKey] = {};
      }
      if (!this.groupedByHBL[hblKey][tabLabel]) {
        this.groupedByHBL[hblKey][tabLabel] = [];
      }
      this.groupedByHBL[hblKey][tabLabel].push(error);
    }
  }

  /**
   * Fallback tab mapping for frontend-generated errors (no tabName from backend)
   */
  private getTabNameForField(error: MandatoryFieldError): string {
    const map: { [fieldRef: string]: string } = {
      '1.1': 'Customs', '1.2': 'Customs', '1.10': 'Customs',
      '2.29': 'Customs', '2.46': 'Customs',
      '3.1': 'Customs', '3.5': 'Customs',
    };
    return map[error.fieldRef] || 'Customs';
  }

  /**
   * Get HBL keys for template iteration (Common Fields first, then HBL numbers)
   */
  getHBLKeys(): string[] {
    const keys = Object.keys(this.groupedByHBL);
    // Sort to put 'Common Fields' first
    return keys.sort((a, b) => {
      if (a === 'Common Fields') return -1;
      if (b === 'Common Fields') return 1;
      return a.localeCompare(b);
    });
  }

  /**
   * Get tab name keys for a specific HBL, sorted in logical tab order
   */
  getRecordTypeKeys(hblNo: string): string[] {
    if (!this.groupedByHBL[hblNo]) return [];
    const order = this.screenName === 'HouseJob'
      ? ['Shipment', 'Cargo', 'Others', 'Customs']
      : ['Master', 'Shipment', 'Cargo', 'Others', 'Customs', 'Container'];
    return Object.keys(this.groupedByHBL[hblNo]).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }

  /**
   * Close validation modal
   */
  closeValidationModal() {
    this.showValidationModal = false;
    this.validationErrors = [];
    this.groupedErrors = {};
    this.groupedByHBL = {};
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

  get isEffectiveFormDisabled(): boolean {
    return this.isFormDisabled || this.isSuspendedStatus(this.formData?.status);
  }

  private updateFormDisabledState(): void {
    if (!this.customsForm) {
      return;
    }
    if (this.isEffectiveFormDisabled) {
      this.customsForm.disable({ emitEvent: false });
    } else {
      this.customsForm.enable({ emitEvent: false });
    }
  }

  private isSuspendedStatus(status: any): boolean {
    const value = String(status ?? '').trim().toLowerCase();
    return value === 's' || value === 'suspended';
  }
}
