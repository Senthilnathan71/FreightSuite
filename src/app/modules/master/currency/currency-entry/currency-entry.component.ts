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
  currencyID: number;
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
        this.currencyID = +params['id'];
        this.isEditMode = true;
        this.getCurrencyById(this.currencyID);
      }
    });
  }

  initForm() {
    this.currencyForm = this.fb.group({
      currencyName: ['', [
        Validators.required, 
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z\s]*$/) // Alphabets and spaces only
      ]],
      currencyCode: ['', [
        Validators.required, 
        Validators.maxLength(3),
        Validators.pattern(/^[A-Z]{3}$/) // Exactly 3 uppercase letters
      ]],
      currencyID: ['', [
        Validators.required, 
        Validators.maxLength(1),
        Validators.pattern(/^[A-Z0-9]$/) // Single alphanumeric character
      ]],
      currencyUnit: ['', [
        Validators.required, 
        Validators.maxLength(50)
      ]],
      currencySubUnit: ['', [
        Validators.maxLength(50) // Made optional since it wasn't marked as required in UI
      ]],
      symbol: ['', [
        Validators.required, 
        Validators.maxLength(5)
      ]],
      currencyFirstName: ['', [
        Validators.maxLength(50)
      ]],
      currencyLastName: ['', [
        Validators.maxLength(50)
      ]],
      currencyRatio: [1, [
        Validators.required,
        Validators.min(1), // Minimum value 1 (positive integer)
        Validators.pattern(/^[1-9]\d*$/) // Positive integers only
      ]],
      amountDecimal: [2, [
        Validators.required,
        Validators.min(0),
        Validators.max(8), // Max 8 decimal places
        Validators.pattern(/^\d+$/) // Integers only
      ]],
      exchangeDecimal: [4, [
        Validators.required,
        Validators.min(0),
        Validators.max(8), // Max 8 decimal places
        Validators.pattern(/^\d+$/) // Integers only
      ]],
      status: [{value: 'A', disabled: !this.isEditMode}, Validators.required],
      CountryMasterSid: ['', Validators.required],
      remarks: ['']
    });

     // Auto-uppercase and enforce 3 characters for currency code
    this.currencyForm.get('currencyCode')?.valueChanges.subscribe(val => {
      if (val) {
        const upperVal = val.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
        if (upperVal !== val) {
          this.currencyForm.get('currencyCode')?.setValue(upperVal, { emitEvent: false });
        }
      }
    });

    // Prevent non-alphabet characters and spaces for currency name
    this.currencyForm.get('currencyName')?.valueChanges.subscribe(val => {
      if (val) {
        const cleanVal = val.replace(/[^a-zA-Z\s]/g, '');
        if (cleanVal !== val) {
          this.currencyForm.get('currencyName')?.setValue(cleanVal, { emitEvent: false });
        }
      }
    });
  }

  // Rest of the component remains the same...
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
    this.currencyForm.reset();
    this.masterService.getCurrencyById(id).subscribe({
      next: (currency: Currency) => {
        this.currencyForm.patchValue({
          currencyName: currency.currencyName,
          currencyCode: currency.currencyCode,
          currencyID: currency.currencyID,
          currencyUnit: currency.CurrencyUnit, 
          currencySubUnit: currency.CurrencySubUnit,
          symbol: currency.Symbol,
          currencyFirstName: currency.currencyFirstName || '',
          currencyLastName: currency.currencyLastName || '',
          currencyRatio: currency.currencyRatio,
          amountDecimal: currency.amountDecimal,
          exchangeDecimal: currency.exchangeDecimal,
          status: currency.status,
          CountryMasterSid: currency.CountryMasterSid,
          Remarks: currency.Remarks || ''
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
      currencyName: this.currencyForm.value.currencyName,
      currencyCode: this.currencyForm.value.currencyCode,
      currencyID: this.currencyForm.value.currencyID,
      CurrencyUnit: this.currencyForm.value.currencyUnit, 
      CurrencySubUnit: this.currencyForm.value.currencySubUnit, 
      Symbol: this.currencyForm.value.symbol,
      currencyFirstName: this.currencyForm.value.currencyFirstName,
      currencyLastName: this.currencyForm.value.currencyLastName,
      currencyRatio: Number(this.currencyForm.value.currencyRatio),
      amountDecimal: Number(this.currencyForm.value.amountDecimal),
      exchangeDecimal: Number(this.currencyForm.value.exchangeDecimal),
      CountryMasterSid: Number(this.currencyForm.value.CountryMasterSid),
      status: this.currencyForm.value.status,
      Remarks: this.currencyForm.value.Remarks
    };
  
    const operation = this.isEditMode 
      ? this.masterService.editCurrency(this.currencyID, payload)
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
          queryParams: { refresh: Date.now() }
        });
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.btnDisable = false;
        let errorMessage = `Error ${this.isEditMode ? 'updating' : 'creating'} currency`;
        if (err.status === 400 && err.error.message.includes('already exists')) {
          this.appSettingService.showError(err.error.message);
        } else {
          this.appSettingService.showError('Failed to create currency. Please try again.');
        }      
      }
    });
  }
  
  resetForm() {
    if (this.isEditMode) {
      this.getCurrencyById(this.currencyID);
    } else {
      this.currencyForm.reset({
        currencyName: '',
        currencyCode: '',
        currencyUnit: '',
        currencySubUnit: '',
        Symbol: '',
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