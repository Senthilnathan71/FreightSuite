import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { Commodity } from 'src/app/modules/crm-mobile/Interfaces/commodity.interface';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { HSSAC } from 'src/app/modules/crm-mobile/Interfaces/hs-sac.interfaces';

@Component({
  selector: 'app-commodity-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule
  ],
  templateUrl: './commodity-entry.component.html',
  styleUrls: ['./commodity-entry.component.scss']
})
export class CommodityEntryComponent implements OnInit {
  commodityForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  commodityId: number;
  hssacOptions: HSSAC[] = [];
  
  commodityAttributes = [
    { id: 'Haz', name: 'Hazardous' },
    { id: 'Perishable', name: 'Perishable' },
    { id: 'Flamable', name: 'Flammable' },
    { id: 'Timber', name: 'Timber' },
    { id: 'ContainerVentRequired', name: 'Vent Required' }
  ];

  commodityTypes = [
    { id: 'General', name: 'General' },
    { id: 'Haz', name: 'Hazardous' },
    { id: 'Reefer', name: 'Reefer' }
  ];

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'Suspended' }
  ];

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadHSSACOptions(); 
    
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.commodityId = +params['id'];
        this.isEditMode = true;
        this.getCommodityById(this.commodityId);
        // Enable status control when in edit mode
        this.commodityForm.get('status')?.enable();
      }
    });
  }

  initForm() {
    this.commodityForm = this.fb.group({
      CommodityName: ['', [Validators.required, Validators.maxLength(50), this.alphaSpaceValidator()]],
      CommodityCode: ['', [Validators.required, Validators.maxLength(10), this.alphanumericValidator()]],
      // CommodityNameLL: ['', [Validators.maxLength(50)]],
      // UOMSid: [''],
      HSSACCode: [''],
      // ImcoName: ['', [Validators.maxLength(10)]],
      // UNNo: ['', [Validators.maxLength(10)]],
      // PackingGroup: ['', [Validators.maxLength(10)]],
      CommodityType: ['', Validators.required],
      // FlashPoint: ['', [Validators.maxLength(5)]],
      // MinTemp: [''],
      // MaxTemp: [''],
      status: [{value: 'A', disabled: true}, Validators.required],
      Remarks: ['', [Validators.maxLength(300)]],
      // Attribute checkboxes
      // Haz: [false],
      // Perishable: [false],
      // Flamable: [false],
      // Timber: [false],
      // ContainerVentRequired: [false]
    });

    this.commodityForm.get('CommodityCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.commodityForm.get('CommodityCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  private alphaSpaceValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z\s]+$/.test(control.value);
      return valid ? null : { invalidAlphaSpace: true };
    };
  }

  private alphanumericValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z0-9]+$/.test(control.value);
      return valid ? null : { invalidAlphanumeric: true };
    };
  }

  loadHSSACOptions() {
    this.masterService.getAllHssac().subscribe({
      next: (resp: any) => {
        this.hssacOptions = resp.data || resp;
      },
      error: (err) => {
        console.error('Error loading HSSAC codes:', err);
        this.appSettingService.showError('Failed to load HSSAC codes');
      }
    });
  }

  

  getCommodityById(id: number) {
    this.commodityForm.reset();
    this.masterService.getCommodityById(id).subscribe({
      next: (commodity: Commodity) => {
        this.commodityForm.patchValue({
          CommodityName: commodity.CommodityName,
          CommodityCode: commodity.CommodityCode,
          // CommodityNameLL: commodity.CommodityNameLL || '',
          // UOMSid: commodity.UOMSid || '',
          HSSACCode: commodity.HSSACCode || '', 
          // ImcoName: commodity.ImcoName || '',
          // UNNo: commodity.UNNo || '',
          // PackingGroup: commodity.PackingGroup || '',
          CommodityType: commodity.CommodityType || 'General',
          // FlashPoint: commodity.FlashPoint || '',
          // MinTemp: commodity.MinTemp || '',
          // MaxTemp: commodity.MaxTemp || '',
          status: commodity.status || 'A',
          Remarks: commodity.Remarks || '',
          // Haz: commodity.Haz || false,
          // Perishable: commodity.Perishable || false,
          // Flamable: commodity.Flamable || false,
          // Timber: commodity.Timber || false,
          // ContainerVentRequired: commodity.ContainerVentRequired || false
        });
        // Enable status control when in edit mode
        this.commodityForm.get('status')?.enable();
      },
      error: (err) => {
        console.error('Error loading commodity:', err);
        this.appSettingService.showError('Failed to load commodity data');
      }
    });
  }

  onSubmit() {
    if (this.commodityForm.invalid) {
      this.markFormGroupTouched(this.commodityForm);
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }
  
    this.btnDisable = true;
    
    const formValue = this.commodityForm.value;
    const createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    
    const payload = {
      ...formValue,
      UOMSid: formValue.UOMSid ? Number(formValue.UOMSid) : null,
      HSSACCode: formValue.HSSACCode ? Number(formValue.HSSACCode) : null,
      status: this.isEditMode ? formValue.status : 'A',
      ...(this.isEditMode ? updatedBy : createdBy)
    };
  
    const operation = this.isEditMode 
      ? this.masterService.updateCommodityById(this.commodityId, payload)
      : this.masterService.createNewCommodity(payload);
  
    operation.subscribe({
      next: (resp: any) => {
        this.btnDisable = false;
        const message = resp.message || 
          (this.isEditMode ? 'Commodity updated successfully!' : 'Commodity created successfully!');
        
        if (resp.status) {
          this.appSettingService.showSuccess(message);
          this.router.navigate(['/master/commodity/list']);
        } else {
          this.appSettingService.showError(resp.message || 'Operation failed');
        }
      },
      error: (err) => {
        this.btnDisable = false;
        const errorMessage = err.error?.message || 
          `Error ${this.isEditMode ? 'updating' : 'creating'} commodity`;
        this.appSettingService.showError(errorMessage);
      }
    });
  }

  resetForm() {
    if (this.isEditMode) {
      this.getCommodityById(this.commodityId);
    } else {
      this.commodityForm.reset({
        CommodityName: '',
        CommodityCode: '',
        // CommodityNameLL: '',
        // UOMSid: '',
        // HSSACCode: '',
        // ImcoName: '',
        // UNNo: '',
        // PackingGroup: '',
        CommodityType: 'General',
        // FlashPoint: '',
        // MinTemp: '',
        // MaxTemp: '',
        status: 'A',
        Remarks: '',
        // Haz: false,
        // Perishable: false,
        // Flamable: false,
        // Timber: false,
        // ContainerVentRequired: false
      });
      // Disable status control when not in edit mode
      this.commodityForm.get('status')?.disable();
    }
  }

  goBack() {
    this.router.navigate(['master/commodity/list']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}