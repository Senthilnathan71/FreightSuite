import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { Currency } from 'src/app/modules/crm-mobile/Interfaces/currency.interface';
import { Country } from 'src/app/modules/crm-mobile/Interfaces/country.interface';

@Component({
  selector: 'app-currency-entry',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule
  ],
  templateUrl: './currency-entry.component.html',
  styleUrls: ['./currency-entry.component.scss']
})
export class CurrencyEntryComponent {
  currencyForm!: FormGroup;
  isEditMode = false;
  CurrencyMasterSid: number;
  btnDisable: boolean = false;
  loading: boolean = false;

  countries: Country[] = []; // Changed from countryList to countries to match template
  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'In Active' }
  ]; // Added to match template
  status: any;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getAllCountries();
    this.initForm();

    this.route.paramMap.subscribe(params => {
      this.CurrencyMasterSid = +params.get('id');
      if (this.CurrencyMasterSid) {
        this.isEditMode = true;
        this.loadCurrencyData(this.CurrencyMasterSid);
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
      CountryMasterSid: ['', [Validators.required]],
      status: ['A'], // Set default to 'A' (Active)
      remarks: ['']
    });

    this.currencyForm.get('currencyCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.currencyForm.get('currencyCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  // Renamed from reset to resetForm to match template
  resetForm() {
    if (this.isEditMode) {
      this.loadCurrencyData(this.CurrencyMasterSid);
    } else {
      this.currencyForm.reset({
        currencyRatio: 1,
        amountDecimal: 2,
        exchangeDecimal: 4,
        status: 'A'
      });
    }
  }

  onSubmit() {
    if (this.currencyForm.invalid) {
      this.currencyForm.markAllAsTouched();
      this.currencyForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    this.btnDisable = true;
    this.loading = true;

    let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const formValue = this.currencyForm.value;

    const payload = (this.isEditMode) ? {
      ...formValue,
      CountryMasterSid: Number(formValue.CountryMasterSid),
      CurrencyMasterSid: this.CurrencyMasterSid,
      ...updatedBy,
      status: this.status === "A" ? "A" : "I"
    } : {
      ...formValue,
      CountryMasterSid: Number(formValue.CountryMasterSid),
      ...createdBy,
      status: formValue.status === "Active" ? "A" : "I"
    };

    if (this.isEditMode) {
      this.masterService.updateCurrencyById(this.CurrencyMasterSid, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['master/currency/list']);
          } else {
            this.appSettingService.showError(resp.message);
          }
          this.btnDisable = false;
          this.loading = false;
        },
        (error) => {
          this.appSettingService.showError(error.message);
          this.btnDisable = false;
          this.loading = false;
        }
      );
    } else {
      this.masterService.createCurrency(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['master/currency/list']);
          } else {
            this.appSettingService.showError(resp.message);
          }
          this.btnDisable = false;
          this.loading = false;
        },
        (error) => {
          this.appSettingService.showError(error.message);
          this.btnDisable = false;
          this.loading = false;
        }
      );
    }
  }

  statusMap: { [key: string]: string } = {
    A: 'Active',
    I: 'In Active'
  };

  loadCurrencyData(currencyId: number) {
    this.masterService.getCurrencyById(currencyId).subscribe(
      (currencyData) => {
        this.status = currencyData.status;
        const formattedStatus = this.statusMap[currencyData.status] || '';
        this.currencyForm.patchValue({
          ...currencyData,
          CountryMasterSid: currencyData.CountryMasterSid,
          status: formattedStatus
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading currency data.');
      }
    );
  }

  getAllCountries() {
    this.masterService.getAllCountry().subscribe((res) => {
      this.countries = res.data; // Changed from countryList to countries
    });
  }

  goBack() {
    this.router.navigate(['master/currency/list']);
  }
}