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

@Component({
  selector: 'app-vehicle',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './vehicle.component.html',
  styleUrls: ['./vehicle.component.scss'],
})
export class VehicleComponent implements OnChanges {
  @Input() formData: any;
  @Input() dataItems: any[] = [];
  @Input() resetTrigger = false;

  @Output() reloadParent = new EventEmitter<any>();

  vehicleForm!: FormGroup;
  selectedRecord: any = null;
  loading = false;

  // Dropdowns
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

  constructor(private fb: FormBuilder, private operationService: OperationService) {
    this.initForm();
  }

  private initForm() {
    this.vehicleForm = this.fb.group({
      HouseJobVehicleSid: [null],
      CompanyMasterSid: [null, Validators.required],
      HouseJobSid: [null, Validators.required],

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

      CreatedBy: [''],
      UpdatedBy: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // patch parent data (HouseJobSid, CompanyMasterSid, etc.)
    if (changes['formData'] && this.formData) {
      this.vehicleForm.patchValue({
        CompanyMasterSid: this.formData.CompanyMasterSid,
        HouseJobSid: this.formData.HouseJobSid,
        CreatedBy: this.formData.CreatedBy,
        UpdatedBy: this.formData.UpdatedBy,
      });
    }

    // when parent provides vehicle records
    if (changes['dataItems'] && Array.isArray(this.dataItems)) {
      if (this.dataItems.length > 0) {
        this.selectedRecord = this.dataItems[0];
        this.vehicleForm.patchValue({
          ...this.selectedRecord,
          CompanyMasterSid: this.formData?.CompanyMasterSid ?? this.selectedRecord.CompanyMasterSid,
          HouseJobSid: this.formData?.HouseJobSid ?? this.selectedRecord.HouseJobSid,
        });
      } else {
        this.resetChildForm();
      }
    }

    // reset button from parent
    if (changes['resetTrigger'] && this.resetTrigger) {
      this.resetChildForm();
    }
  }

  submitForm() {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }

    const payload = this.vehicleForm.value;

    this.loading = true;

    if (this.selectedRecord) {
      // UPDATE
      this.operationService
        .updateVehicleById(this.selectedRecord.HouseJobVehicleSid, payload)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(() => {
          this.reloadParent.emit(payload.HouseJobSid);
          this.resetChildForm();
        });

    } else {
      // CREATE
      this.operationService
        .createVehicle(payload)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(() => {
          this.reloadParent.emit(payload.HouseJobSid);
          this.resetChildForm();
        });
    }
  }

  resetChildForm() {
    this.selectedRecord = null;

    this.vehicleForm.reset({
      CompanyMasterSid: this.formData?.CompanyMasterSid,
      HouseJobSid: this.formData?.HouseJobSid,

      VehicleIndicator: 'V',
      UsedNew: 'U',
      Rolling: 'R',

      CreatedBy: this.formData?.CreatedBy,
      UpdatedBy: this.formData?.UpdatedBy,
    });
  }
}
