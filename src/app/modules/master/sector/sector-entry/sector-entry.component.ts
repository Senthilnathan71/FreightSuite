import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-sector-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule
  ],
  templateUrl: './sector-entry.component.html',
  styleUrls: ['./sector-entry.component.scss']
})
export class SectorEntryComponent implements OnInit {
  sectorForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  sectorId: number;

  // freightModes = [
  //   { id: 'Air', name: 'Air' },
  //   { id: 'Sea', name: 'Sea' },
  //   { id: 'Land', name: 'Land' }
  // ];

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'Inactive' }
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
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.sectorId = +params['id'];
        this.isEditMode = true;
        this.getSectorById(this.sectorId);
      }
    });
  }

  initForm() {
    this.sectorForm = this.fb.group({
      sectorName: ['', [Validators.required, Validators.maxLength(50)]],
      sectorCode: ['', [Validators.required, Validators.maxLength(10), this.alphaNumericValidator(), this.uppercaseValidator()]],
      // freightMode: [''],
      status: [{value: 'A', disabled: !this.isEditMode}, Validators.required],
      // remarks: ['']
    });

    this.sectorForm.get('sectorCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.sectorForm.get('sectorCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  private alphaNumericValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z0-9]+$/.test(control.value);
      return valid ? null : { invalidAlphaNumeric: true };
    };
  }

  private uppercaseValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      return control.value === control.value.toUpperCase() ? null : { notUppercase: true };
    };
  }

  getSectorById(id: number) {
    this.masterService.getSectorById(id).subscribe({
      next: (sector: any) => {
        this.sectorForm.patchValue({
          sectorName: sector.sectorName,
          sectorCode: sector.sectorCode,
          // freightMode: sector.freightMode || '',
          status: sector.status || 'A',
          // remarks: sector.remarks || ''
        });
      },
      error: (err) => {
        console.error('Error loading sector:', err);
        this.appSettingService.showError('Failed to load sector data');
      }
    });
  }

  onSubmit() {
    if (this.sectorForm.invalid) {
      this.markFormGroupTouched(this.sectorForm);
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }
  
    this.btnDisable = true;
    
    const formValue = this.sectorForm.getRawValue();
    const createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    
    const payload = {
      ...formValue,
      status: this.isEditMode ? formValue.status : 'A',
      ...(this.isEditMode ? updatedBy : createdBy)
    };
  
    const operation = this.isEditMode 
      ? this.masterService.updateSector(this.sectorId, payload)
      : this.masterService.createSector(payload);
  
    operation.subscribe({
      next: (resp: any) => {
        this.btnDisable = false;
        const message = this.isEditMode ? 'Sector updated successfully!' : 'Sector created successfully!';
        
        if (resp.status === true || resp.status === undefined) {
          this.appSettingService.showSuccess(message);
          this.router.navigate(['/master/sector/list']);
        } else {
          this.appSettingService.showError(resp.message || 'Operation failed');
        }
      },
      error: (err) => {
        this.btnDisable = false;
        const errorMessage = err.error?.message || 
          `Error ${this.isEditMode ? 'updating' : 'creating'} sector`;
        this.appSettingService.showError(errorMessage);
      }
    });
  }

  resetForm() {
    if (this.isEditMode) {
      this.getSectorById(this.sectorId);
    } else {
      this.sectorForm.reset({
        sectorName: '',
        sectorCode: '',
        freightMode: '',
        status: 'A',
        // remarks: ''
      });
    }
  }

  goBack() {
    this.router.navigate(['master/sector/list']);
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