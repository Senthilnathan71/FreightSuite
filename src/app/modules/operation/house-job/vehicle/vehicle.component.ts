import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { OperationService } from '../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';

@Component({
  selector: 'app-vehicle',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule, TextWithNumbersDirective, DecimalPrecisionDirective],
  templateUrl: './vehicle.component.html',
  styleUrls: ['./vehicle.component.scss'],
})
export class VehicleComponent implements OnChanges {
  @Input() formData: any;
  @Input() dataItems: any[] = [];
  @Input() resetTrigger = false;
  @Input() isFormDisabled: boolean = false;

  @Output() dataEmitter = new EventEmitter<any>();

  vehicleForm!: FormGroup;
  vehicleDataArray: any[] = [];

  // Dropdowns (keep your existing dropdown lists)
  vehicleIndicatorList = [
    { value: 'V', label: 'Vehicle' },
    { value: 'E', label: 'Equipment' },
    { value: 'X', label: 'Others' },
  ];

  usedNewList = [
    { value: 'U', label: 'Used' },
    { value: 'N', label: 'New' },
  ];

  rollingList = [
    { value: 'R', label: 'Rolling' },
    { value: 'S', label: 'Static' },
  ];

  constructor(private fb: FormBuilder,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
  ) {
    this.initForm();
  }

  private initForm() {
    this.vehicleForm = this.fb.group({
      HouseJobVehicleSid: [null],
      VehicleIndicator: ['V', Validators.required],
      UsedNew: ['U', Validators.required],
      Rolling: ['R', Validators.required],
      ChassisNo: ['', Validators.maxLength(24)],
      CaseNo: ['', Validators.maxLength(24)],
      Make: ['', Validators.maxLength(20)],
      Model: ['', Validators.maxLength(20)],
      EngineNo: ['', Validators.maxLength(30)],
      YearBuilt: ['', [Validators.maxLength(4), Validators.pattern(/^\d{0,4}$/)]],
      Color: ['', Validators.maxLength(16)],
      GoodsDescription: ['', Validators.maxLength(200)],
      Remarks: ['', Validators.maxLength(200)],
      Weight: ['', [Validators.pattern(/^\d{0,6}(\.\d{0,3})?$/)]],
      Volume: ['', [Validators.pattern(/^\d{0,6}(\.\d{0,3})?$/)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When parent provides vehicle records
    if (changes['dataItems'] && Array.isArray(this.dataItems)) {
      this.vehicleDataArray = [...this.dataItems];
      this.emitData();
    }

    // Reset from parent
    if (changes['resetTrigger'] && this.resetTrigger) {
      this.resetForm();
    }

    this.updateFormDisabledState();
  }

  // Add vehicle to array
  addVehicle() {
    if (this.isEffectiveFormDisabled) {
      return;
    }
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }

    const formValue = this.vehicleForm.value;
    
    // Add CompanyMasterSid and HouseJobSid from formData
    const vehicleData = {
      ...formValue,
      CompanyMasterSid: this.formData?.CompanyMasterSid,
      HouseJobSid: this.formData?.HouseJobSid,
      CreatedBy: this.formData?.CreatedBy,
      UpdatedBy: this.formData?.UpdatedBy,
    };

    this.vehicleDataArray.push(vehicleData);
    this.emitData();
    this.resetForm();
  }

  // Edit vehicle
  editVehicle(index: number) {
    if (this.isEffectiveFormDisabled) {
      return;
    }
    const vehicle = this.vehicleDataArray[index];
    this.vehicleForm.patchValue(vehicle);
    this.vehicleDataArray.splice(index, 1);
    this.emitData();
  }

  // Delete vehicle
  deleteVehicle(index: number) {
  if (this.isEffectiveFormDisabled) {
    return;
  }
  const vehicle = this.vehicleDataArray[index];
  const vehicleId = vehicle.HouseJobVehicleSid; // or BoeSid, adjust based on your actual ID field
  
  if (confirm('Are you sure you want to delete this vehicle?')) {
    this.operationService.deleteVehicleById(vehicleId).subscribe({
      next: (response) => {
        // Remove from local array on successful deletion
        this.vehicleDataArray.splice(index, 1);
         this.appSettingService.showSuccess('Vehicle deleted successfully');
      },
      error: (error) => {
        console.error('Error deleting vehicle:', error);
        this.appSettingService.showError('Failed to delete vehicle: ' + error.message);
      }
    });
  }
}

  // Reset form
  resetForm() {
    this.vehicleForm.reset({
      VehicleIndicator: 'V',
      UsedNew: 'U',
      Rolling: 'R',
    });
  }

  // Emit data to parent
  private emitData() {
    this.dataEmitter.emit({
      dataItems: this.vehicleDataArray,
      formData: this.formData
    });
  }

  // Method to get vehicle data for parent
  getVehicleData(): any[] {
    if(!this.isEffectiveFormDisabled && this.vehicleForm.valid && this.vehicleForm.dirty){
      this.addVehicle()
    }
    return this.vehicleDataArray;
  }
  getVehicleTypeLabel(value: string): string {
    const type = this.vehicleIndicatorList.find(item => item.value === value);
    return type ? type.label : value;
  }
  getUsedNewLabel(value: string): string {
    const type = this.usedNewList.find(item => item.value === value);
    return type ? type.label : value;
  }

  getRollingLabel(value: string): string {
    const type = this.rollingList.find(item => item.value === value);
    return type ? type.label : value;
  }

  get isEffectiveFormDisabled(): boolean {
    return this.isFormDisabled || this.isSuspendedStatus(this.formData?.status);
  }

  private updateFormDisabledState(): void {
    if (!this.vehicleForm) {
      return;
    }
    if (this.isEffectiveFormDisabled) {
      this.vehicleForm.disable({ emitEvent: false });
    } else {
      this.vehicleForm.enable({ emitEvent: false });
    }
  }

  private isSuspendedStatus(status: any): boolean {
    const value = String(status ?? '').trim().toLowerCase();
    return value === 's' || value === 'suspended';
  }
  
}
