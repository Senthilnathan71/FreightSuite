import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { Zone } from 'src/app/modules/crm-mobile/Interfaces/zone.interface';
import { Currency } from 'src/app/modules/crm-mobile/Interfaces/currency.interface';

@Component({
  selector: 'app-country-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule
  ],
  templateUrl: './country-entry.component.html',
  styleUrls: ['./country-entry.component.scss']
})
export class CountryEntryComponent implements OnInit {
  countryForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  countryId: number;
  
  zones: Zone[] = [];
  currencies: Currency[] = [];

  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended'
  };

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
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
    this.loadZones();
    this.loadCurrencies();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.countryId = +params['id'];
        this.isEditMode = true;
        this.loadCountry(this.countryId);
        this.countryForm.get('status')?.enable();
      }
    });
  }

  initForm() {
    this.countryForm = this.fb.group({
      countryName: ['', [Validators.required, Validators.maxLength(100)]],
      countryCode: ['', [Validators.required, Validators.maxLength(2)]],
      ZoneMasterSid: ['', Validators.required],
      CurrencyMasterSid: ['', Validators.required],
      status: [{value: 'A', disabled: true}, Validators.required]
    });

    this.countryForm.get('countryCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.countryForm.get('countryCode')?.setValue(val.toUpperCase(), { emitEvent: false });
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

  loadCurrencies() {
  this.masterService.getAllCurrencies().subscribe({
    next: (resp: any) => {
      console.log('Currencies loaded:', resp); // Add this line
      this.currencies = resp.data || resp;
    },
    error: (err) => {
      console.error('Error loading currencies:', err);
      this.appSettingService.showError('Failed to load currencies');
    }
  });
}

  loadCountry(id: number) {
    this.countryForm.reset();
    this.masterService.getCountryById(id).subscribe({
      next: (country: any) => {
        this.countryForm.patchValue({
          countryName: country.countryName,
          countryCode: country.countryCode,
          ZoneMasterSid: country.ZoneMasterSid,
          CurrencyMasterSid: country.CurrencyMasterSid,
          status: country.status || 'A'
        });
        this.countryForm.get('status')?.enable();
      },
      error: (err) => {
        console.error('Error loading country:', err);
        this.appSettingService.showError('Failed to load country data');
      }
    });
  }

  onSubmit() {
    if (this.countryForm.invalid) {
      this.markFormGroupTouched(this.countryForm);
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }
  
    this.btnDisable = true;
    
    const formValue = this.countryForm.value;
    const createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    
    const payload = {
      ...formValue,
      ZoneMasterSid: Number(formValue.ZoneMasterSid),
      CurrencyMasterSid: Number(formValue.CurrencyMasterSid),
      status: this.isEditMode ? formValue.status : 'A',
      ...(this.isEditMode ? updatedBy : createdBy)
    };
  
    const operation = this.isEditMode 
      ? this.masterService.updateCountryById(this.countryId, payload)
      : this.masterService.createCountry(payload);
  
    operation.subscribe({
      next: (resp: any) => {
        this.btnDisable = false;
        const message = resp.message || 
          (this.isEditMode ? 'Country updated successfully!' : 'Country created successfully!');
        
        if (resp.status) {
          this.appSettingService.showSuccess(message);
          this.router.navigate(['/master/country/list']);
        } else {
          this.appSettingService.showError(resp.message || 'Operation failed');
        }
      },
      error: (err) => {
        this.btnDisable = false;
        const errorMessage = err.error?.message || 
          `Error ${this.isEditMode ? 'updating' : 'creating'} country`;
        this.appSettingService.showError(errorMessage);
      }
    });
  }

  resetForm() {
    if (this.isEditMode) {
      this.loadCountry(this.countryId);
    } else {
      this.countryForm.reset({
        countryName: '',
        countryCode: '',
        ZoneMasterSid: '',
        CurrencyMasterSid: '',
        status: 'A'
      });
      this.countryForm.get('status')?.disable();
    }
  }

  goBack() {
    this.router.navigate(['master/country/list']);
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