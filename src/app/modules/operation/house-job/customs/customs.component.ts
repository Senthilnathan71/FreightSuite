import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { finalize } from 'rxjs/operators';
import { OperationService } from '../../operation.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-customs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './customs.component.html',
  styleUrls: ['./customs.component.scss'],
})
export class CustomsComponent implements OnChanges {
  @Input() formData: any;
  @Input() dataItems: any[] = [];
  @Input() resetTrigger = false;

  @Output() reloadParent = new EventEmitter<any>();

  customsForm!: FormGroup;
  selectedRecord: any = null;
  loading = false;
  houseJobSid: number | null = null;

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
    this.loadPackageTypes();
  }

  private loadPackageTypes() {
    this.operationService.getUOMsByType('E').subscribe((resp) => {
      this.packageTypeList = resp.data; // format: [{ UOMCode: "BOX", Description: "Box" }]
    });
  }

  private initForm() {
    this.customsForm = this.fb.group({
      HouseJobCustomsSid: [null],
      CompanyMasterSid: [null, Validators.required],
      HouseJobSid: [null, Validators.required],

      LineCode: ['', [Validators.required, Validators.maxLength(6)]],
      VoyageAgentCode: ['', [Validators.required, Validators.maxLength(6)]],
      RotationNumber: ['', [Validators.required, Validators.maxLength(6)]],
      ManifestSequence: ['', [Validators.required, Validators.maxLength(5)]],

      CargoCode: ['F', Validators.required],
      StorageRequest: ['D'],
      PackageTypeCode: ['', [Validators.required, Validators.maxLength(3)]],

      FreightTonne: ['', [Validators.pattern(/^\d{0,6}(\.\d{0,3})?$/)]],
      NoOfPallets: ['', [Validators.pattern(/^\d{1,4}$/)]],
      SLACIndicator: ['', Validators.maxLength(1)],

      ImporterCode: ['', [Validators.required, Validators.maxLength(5)]],

      SerialNumber: ['', [Validators.required, Validators.pattern(/^\d{1,6}$/)]],
      UsedOrNew: ['U', Validators.required],
      UNHSCode: ['', [Validators.required, Validators.maxLength(10)]],
      UNNumber: ['', Validators.maxLength(5)],

      FlashPoints: ['', [Validators.pattern(/^\d{0,3}(\.\d{0,1})?$/)]],
      TemperatureUnit: ['C'],
      HazStorageRequest: ['D'],
      RefrigerationRequired: [''],

      MinTemperature: ['', [Validators.pattern(/^\d{0,3}(\.\d{0,1})?$/)]],
      MaxTemperature: ['', [Validators.pattern(/^\d{0,3}(\.\d{0,1})?$/)]],

      RefTemperatureUnit: ['C'],

      CreatedBy: [''],
      UpdatedBy: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formData'] && this.formData) {
      this.houseJobSid = this.formData.HouseJobSid;
      this.customsForm.patchValue({
        CompanyMasterSid: this.formData.CompanyMasterSid,
        HouseJobSid: this.formData.HouseJobSid,
        CreatedBy: this.formData.CreatedBy,
        UpdatedBy: this.formData.UpdatedBy,
      });
    }

    if (changes['dataItems'] && Array.isArray(this.dataItems)) {
      if (this.dataItems.length > 0) {
        this.selectedRecord = this.dataItems[0];
        this.customsForm.patchValue(this.selectedRecord);
      } else {
        this.resetChildForm();
      }
    }

    if (changes['resetTrigger'] && this.resetTrigger) {
      this.resetChildForm();
    }
  }

  submitForm() {
    if (this.customsForm.invalid) {
      this.customsForm.markAllAsTouched();
      return;
    }

    const payload = this.customsForm.value;
    this.loading = true;

    if (this.selectedRecord) {
      this.operationService.updateCustomsById(this.selectedRecord.HouseJobCustomsSid, payload)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(() => {
          this.reloadParent.emit(payload.HouseJobSid);
          this.resetChildForm();
        });
    } else {
      this.operationService.createCustoms(payload)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(() => {
          this.reloadParent.emit(payload.HouseJobSid);
          this.resetChildForm();
        });
    }
  }

  resetChildForm() {
    this.selectedRecord = null;
    this.customsForm.reset({
      CompanyMasterSid: this.formData?.CompanyMasterSid,
      HouseJobSid: this.formData?.HouseJobSid,
      CargoCode: 'F',
      StorageRequest: 'D',
      UsedOrNew: 'U',
      TemperatureUnit: 'C',
      HazStorageRequest: 'D',
      RefTemperatureUnit: 'C',
      CreatedBy: this.formData?.CreatedBy,
      UpdatedBy: this.formData?.UpdatedBy,
    });
  }
  getCustomsData(): any[] {
  if (this.customsForm.valid && this.customsForm.dirty) {
    const formValue = this.customsForm.value;
    
    // If we're editing an existing record
    if (this.selectedRecord && this.selectedRecord.HouseJobCustomsSid) {
      return [{
        ...formValue,
        HouseJobCustomsSid: this.selectedRecord.HouseJobCustomsSid,
        UpdatedBy: this.formData?.UpdatedBy || this.formData?.CreatedBy
      }];
    } else {
      // If creating a new record
      return [{
        ...formValue,
        CreatedBy: this.formData?.CreatedBy || this.formData?.UpdatedBy
      }];
    }
  }
  
  // Return existing data if form is not dirty
  return this.dataItems || [];
}

  generateEDIManifest() {
    if (!this.houseJobSid) {
      this.toastr.error('House Job ID not found');
      return;
    }

    this.spinner.show();
    this.operationService.generateHouseJobEDIManifest(this.houseJobSid).subscribe({
      next: (response: string) => {
        this.spinner.hide();
        const blob = new Blob([response], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EDI_Manifest_HouseJob_${this.houseJobSid}_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.toastr.success('EDI Manifest generated successfully');
      },
      error: (error) => {
        this.spinner.hide();
        this.toastr.error(error.error?.message || 'Failed to generate EDI Manifest');
      }
    });
  }
}
