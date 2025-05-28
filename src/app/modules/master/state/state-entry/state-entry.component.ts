import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { State } from 'src/app/modules/crm-mobile/Interfaces/state.interface';
import { Country } from 'src/app/modules/crm-mobile/Interfaces/country.interface';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Zone } from 'src/app/modules/crm-mobile/Interfaces/zone.interface';

@Component({
  selector: 'app-state-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule
  ],
  templateUrl: './state-entry.component.html',
  styleUrls: ['./state-entry.component.scss']
})
export class StateEntryComponent implements OnInit {
  stateForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  stateId: number;
  countries: Country[] = [];
  zones: Zone[] = []; 
  
  statusMap: { [key: string]: string } = {
    A: 'Active',
    I: 'Invalid'
  };

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'Invalid' }
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
    this.loadCountries();
    this.loadZones(); 
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.stateId = +params['id'];
        this.isEditMode = true;
        this.getStateById(this.stateId);
        // Enable status control when in edit mode
        this.stateForm.get('status')?.enable();
      }
    });
  }

  initForm() {
    this.stateForm = this.fb.group({
      stateName: ['', [Validators.required, Validators.maxLength(100), this.alphaSpaceValidator()]],
      stateCode: ['', [Validators.required, Validators.maxLength(2), this.alphaValidator()]],
      stateGSTCode: ['', [Validators.required, Validators.maxLength(2), Validators.pattern('^[0-9]*$'), this.trimSpaceValidator()]],
      CountryMasterSid: ['', Validators.required],
      ZoneMasterSid: ['', Validators.required],
      region: [''],
      status: [{value: 'A', disabled: true}, Validators.required],
      Remarks: ['']
    });

    this.stateForm.get('stateCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.stateForm.get('stateCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });

    this.stateForm.get('stateGSTCode')?.valueChanges.subscribe(val => {
      if (val) {
        // Remove any spaces from GST code
        const trimmedVal = val.replace(/\s/g, '');
        if (val !== trimmedVal) {
          this.stateForm.get('stateGSTCode')?.setValue(trimmedVal, { emitEvent: false });
        }
      }
    });
  }

  private alphaValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z]+$/.test(control.value);
      return valid ? null : { invalidAlpha: true };
    };
  }

  private alphaSpaceValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z\s]+$/.test(control.value);
      return valid ? null : { invalidAlphaSpace: true };
    };
  }

  private trimSpaceValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const hasSpaces = /\s/.test(control.value);
      return hasSpaces ? { hasSpaces: true } : null;
    };
  }

  onKeyPress(event: KeyboardEvent, field: string) {
    if (field === 'stateCode') {
      const pattern = /[A-Za-z]/;
      if (!pattern.test(event.key)) {
        event.preventDefault();
      }
    } else if (field === 'stateName') {
      const pattern = /[A-Za-z\s]/;
      if (!pattern.test(event.key)) {
        event.preventDefault();
      }
    } else if (field === 'stateGSTCode') {
      const pattern = /[0-9]/;
      if (!pattern.test(event.key)) {
        event.preventDefault();
      }
    }
  }

  loadCountries() {
    this.masterService.getAllCountry().subscribe({
      next: (resp: any) => {
        this.countries = resp.data || resp;
      },
      error: (err) => {
        console.error('Error loading countries:', err);
        this.appSettingService.showError('Failed to load countries');
      }
    });
  }

  loadZones() {
    this.masterService.getAllZones().subscribe({
      next: (resp: any) => {
        this.zones = resp.data || resp;
      },
      error: (err) => {
        console.error('Error loading zones:', err);
        this.appSettingService.showError('Failed to load zones');
      }
    });
  }

  getStateById(id: number) {
    this.stateForm.reset();
    this.masterService.getStateById(id).subscribe({
      next: (state: State) => {
        this.stateForm.patchValue({
          stateName: state.stateName,
          stateCode: state.stateCode,
          stateGSTCode: state.stateGSTCode,
          CountryMasterSid: state.CountryMasterSid,
          ZoneMasterSid: state.ZoneMasterSid,
          region: state.region || '',
          status: state.status || 'A',
          Remarks: state.Remarks || ''
        });
        // Enable status control when in edit mode
        this.stateForm.get('status')?.enable();
      },
      error: (err) => {
        console.error('Error loading state:', err);
        this.appSettingService.showError('Failed to load state data');
      }
    });
  }

  onSubmit() {
    if (this.stateForm.invalid) {
      this.markFormGroupTouched(this.stateForm);
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }
  
    this.btnDisable = true;
    
    const formValue = this.stateForm.value;
    const createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    
    const payload = {
      ...formValue,
      CountryMasterSid: Number(formValue.CountryMasterSid),
      ZoneMasterSid: Number(formValue.ZoneMasterSid),
      status: this.isEditMode ? formValue.status : 'A',
      ...(this.isEditMode ? updatedBy : createdBy)
    };
  
    const operation = this.isEditMode 
      ? this.masterService.editState(this.stateId, payload)
      : this.masterService.createState(payload);
  
    operation.subscribe({
      next: (resp: any) => {
        this.btnDisable = false;
        const message = resp.message || 
          (this.isEditMode ? 'State updated successfully!' : 'State created successfully!');
        
        if (resp.status) {
          this.appSettingService.showSuccess(message);
          this.router.navigate(['/master/state/list']);
        } else {
          this.appSettingService.showError(resp.message || 'Operation failed');
        }
      },
      error: (err) => {
        this.btnDisable = false;
        const errorMessage = err.error?.message || 
          `Error ${this.isEditMode ? 'updating' : 'creating'} state`;
        this.appSettingService.showError(errorMessage);
      }
    });
  }

  resetForm() {
    if (this.isEditMode) {
      this.getStateById(this.stateId);
    } else {
      this.stateForm.reset({
        stateName: '',
        stateCode: '',
        stateGSTCode: '',
        CountryMasterSid: '',
        ZoneMasterSid: '',
        region: '',
        status: 'A',
        Remarks: ''
      });
      // Disable status control when not in edit mode
      this.stateForm.get('status')?.disable();
    }
  }

  goBack() {
    this.router.navigate(['master/state/list']);
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