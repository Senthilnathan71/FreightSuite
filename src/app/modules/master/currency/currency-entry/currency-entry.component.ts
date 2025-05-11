import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { Country } from 'src/app/modules/crm-mobile/Interfaces/country.interface';
import { Currency } from 'src/app/modules/crm-mobile/Interfaces/currency.interface';

@Component({
  selector: 'app-currency-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule
  ],
  templateUrl: './currency-entry.component.html',
  styleUrls: ['./currency-entry.component.scss']
})
export class CurrencyEntryComponent implements OnInit {
countryOptions: readonly any[];

goBack() {
  this.router.navigate(['master/currency/list']);
}

  currencyForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  currencyId: number;
  loading = false;
  countries: Country[] = [];
  
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
    this.loadCountries();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.currencyId = +params['id'];
        this.isEditMode = true;
        this.getCurrencyById(this.currencyId);
      }
    });
  }

  initForm() {
    this.currencyForm = this.fb.group({
      currencyName: ['', [Validators.required, Validators.maxLength(100)]],
      currencyCode: ['', [Validators.required, Validators.maxLength(3)]],
      currencyUnit: ['', [Validators.required, Validators.maxLength(50)]],
      currencySubUnit: ['', [Validators.required, Validators.maxLength(50)]],
      symbol: ['', [Validators.required, Validators.maxLength(5)]],
      currencyFirstName: ['', [Validators.maxLength(50)]],
      currencyLastName: ['', [Validators.maxLength(50)]],
      currencyRatio: [1, [Validators.required, Validators.min(0)]],
      amountDecimal: [2, [Validators.required, Validators.min(0), Validators.max(8)]],
      exchangeDecimal: [4, [Validators.required, Validators.min(0), Validators.max(8)]],
      status: ['A', Validators.required],
      CountryMasterSid: ['', Validators.required],
      remarks: ['']
    });

    this.currencyForm.get('currencyCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.currencyForm.get('currencyCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  loadCountries() {
    this.loading = true;
    this.masterService.getAllCountry().subscribe({
      next: (resp: any) => {
        this.countries = resp.data || resp;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading countries:', err);
        this.loading = false;
      }
    });
  }

  getCurrencyById(id: number) {
    this.loading = true;
    this.masterService.getCurrencyById(id).subscribe({
      next: (currency: Currency) => {
        this.currencyForm.patchValue({
          currencyName: currency.currencyName,
          currencyCode: currency.currencyCode,
          currencyUnit: currency.currencyUnit,
          currencySubUnit: currency.currencySubUnit,
          symbol: currency.symbol,
          currencyFirstName: currency.currencyFirstName || '',
          currencyLastName: currency.currencyLastName || '',
          currencyRatio: currency.currencyRatio,
          amountDecimal: currency.amountDecimal,
          exchangeDecimal: currency.exchangeDecimal,
          status: currency.status,
          countryMasterSid: currency.CountryMasterSid,
          remarks: currency.remarks || ''
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading currency:', err);
        this.loading = false;
        this.appSettingService.showError('Failed to load currency data');
      }
    });
  }

  onSubmit() {
    if (this.currencyForm.invalid) {
      this.markFormGroupTouched(this.currencyForm);
      return;
    }

    this.btnDisable = true;
    this.loading = true;
    
    const payload = {
      ...this.currencyForm.value,
      currencyRatio: Number(this.currencyForm.value.currencyRatio),
      amountDecimal: Number(this.currencyForm.value.amountDecimal),
      exchangeDecimal: Number(this.currencyForm.value.exchangeDecimal),
      CountryMasterSid: Number(this.currencyForm.value.CountryMasterSid),
      currencyID: this.isEditMode ? this.currencyId.toString() : '0',
      CurrencyMasterSid: this.isEditMode ? this.currencyId : 0,
      createdBy: 'system',
      updatedBy: 'system'
    };

    const operation = this.isEditMode 
      ? this.masterService.updateCurrencyById(this.currencyId, payload)
      : this.masterService.createCurrency(payload);

    operation.subscribe({
      next: (resp) => {
        this.loading = false;
        this.btnDisable = false;
        const message = this.isEditMode 
          ? 'Currency updated successfully!' 
          : 'Currency created successfully!';
        
        this.appSettingService.showSuccess(message);
        this.router.navigate(['/master/currency/list'], {
          queryParams: { refresh: true }
        });
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.btnDisable = false;
        const errorMessage = `Error ${this.isEditMode ? 'updating' : 'creating'} currency`;
        this.appSettingService.showError(errorMessage + ': ' + (err.error?.message || ''));
      }
    });
  }

  resetForm() {
    if (this.isEditMode) {
      this.getCurrencyById(this.currencyId);
    } else {
      this.currencyForm.reset({
        currencyName: '',
        currencyCode: '',
        currencyUnit: '',
        currencySubUnit: '',
        symbol: '',
        currencyFirstName: '',
        currencyLastName: '',
        currencyRatio: 1,
        amountDecimal: 2,
        exchangeDecimal: 4,
        status: 'A',
        countryMasterSid: '',
        remarks: ''
      });
    }
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
