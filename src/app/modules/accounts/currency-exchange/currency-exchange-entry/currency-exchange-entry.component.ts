import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AccountsService } from '../../accounts.service';
import { MasterService } from 'src/app/modules/master/master.service';

@Component({
  selector: 'app-currency-exchange-entry',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './currency-exchange-entry.component.html',
  styleUrls: ['./currency-exchange-entry.component.scss']
})
export class CurrencyExchangeEntryComponent implements OnInit {
  currencyExchangeForm!: FormGroup;
  isEditMode = false;
  CurrencyExchangeSid: number | null = null;
  statusList = ["Active", "Suspended"];
  companies: any[] = [];
  branches: any[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountsService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private masterService: MasterService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCompaniesAndBranches();
    this.checkEditMode();
  }

  initForm() {
    this.currencyExchangeForm = this.fb.group({
      EffectiveFrom: ['', [Validators.required]],
      FromCurrency: ['', [
        Validators.required,
        Validators.maxLength(3),
        Validators.pattern('^[A-Z]{3}$')
      ]],
      ToCurrency: ['', [
        Validators.required,
        Validators.maxLength(3),
        Validators.pattern('^[A-Z]{3}$')
      ]],
      SellRate: ['', [
        Validators.required,
        Validators.pattern(/^\d+\.?\d{0,5}$/)
      ]],
      BuyRate: ['', [
        Validators.required,
        Validators.pattern(/^\d+\.?\d{0,5}$/)
      ]],
      BankName: ['', [Validators.required]],
      Remarks: [''],
      status: [{ value: 'Active', disabled: true }, [Validators.required]],
      CompanyMasterSid: ['', [Validators.required]],
      BranchMasterSid: ['', [Validators.required]]
    });

    // Automatically convert currency inputs to uppercase
    this.currencyExchangeForm.get('FromCurrency')?.valueChanges.subscribe(val => {
      if (val) {
        this.currencyExchangeForm.get('FromCurrency')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });

    this.currencyExchangeForm.get('ToCurrency')?.valueChanges.subscribe(val => {
      if (val) {
        this.currencyExchangeForm.get('ToCurrency')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  loadCompaniesAndBranches() {
    this.loading = true;
    this.masterService.getAllCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
        if (this.companies.length > 0) {
          this.currencyExchangeForm.patchValue({
            CompanyMasterSid: this.companies[0].CompanyMasterSid
          });
        }
      },
      error: (err) => {
        this.appSettingService.showError('Failed to load companies.');
        console.error(err);
      }
    });

    this.masterService.getAllBranches().subscribe({
      next: (branches) => {
        this.branches = branches;
        if (this.branches.length > 0) {
          this.currencyExchangeForm.patchValue({
            BranchMasterSid: this.branches[0].BranchMasterSid
          });
        }
        this.loading = false;
      },
      error: (err) => {
        this.appSettingService.showError('Failed to load branches.');
        console.error(err);
        this.loading = false;
      }
    });
  }

  checkEditMode() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.CurrencyExchangeSid = +id;
      this.loadCurrencyExchangeData(this.CurrencyExchangeSid);
      // Enable status control in edit mode
      this.currencyExchangeForm.get('status')?.enable();
    }
  }

  loadCurrencyExchangeData(id: number) {
    this.loading = true;
    this.accountService.getCurrencyExchangeById(id).subscribe({
      next: (data) => {
        const effectiveFrom = data.EffectiveFrom ?
          new Date(data.EffectiveFrom).toISOString().split('T')[0] : '';

        this.currencyExchangeForm.patchValue({
          ...data,
          EffectiveFrom: effectiveFrom,
          status: data.status === 'A' ? 'Active' : 'Suspended'
        });
        this.loading = false;
      },
      error: (err) => {
        this.appSettingService.showError('Error loading currency exchange data.');
        console.error(err);
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.currencyExchangeForm.invalid) {
      this.currencyExchangeForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    this.loading = true;
    const formValue = this.currencyExchangeForm.getRawValue(); // Use getRawValue to get disabled control values

    const payload = {
      ...formValue,
      EffectiveFrom: new Date(formValue.EffectiveFrom).toISOString(),
      SellRate: parseFloat(formValue.SellRate),
      BuyRate: parseFloat(formValue.BuyRate),
      status: formValue.status === "Active" ? "A" : "S",
      createdBy: this.appSettingService.userSettingSource.value['userEmail']
    };

    if (this.isEditMode && this.CurrencyExchangeSid) {
      payload.updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
      this.accountService.updateCurrencyExchangeById(this.CurrencyExchangeSid, payload).subscribe({
        next: (resp) => {
          this.handleSuccess(resp, 'Currency Exchange updated successfully!');
        },
        error: (err) => {
          this.handleError(err);
        }
      });
    } else {
      this.accountService.createCurrencyExchange(payload).subscribe({
        next: (resp) => {
          this.handleSuccess(resp, 'Currency Exchange created successfully!');
        },
        error: (err) => {
          this.handleError(err);
        }
      });
    }
  }

  handleSuccess(resp: any, successMsg: string) {
    this.loading = false;
    if (resp.status) {
      this.appSettingService.showSuccess(successMsg);
      this.router.navigate(['accounts/currency-exchange/list']);
    } else {
      this.appSettingService.showError(resp.message || 'Operation failed');
    }
  }

  handleError(err: any) {
    this.loading = false;
    console.error('Error:', err);
    this.appSettingService.showError(
      err.message ||
      err.error?.message ||
      'Failed to perform operation'
    );
  }

  reset() {
    this.currencyExchangeForm.reset({
      status: 'Active',
      CompanyMasterSid: this.companies.length > 0 ? this.companies[0].CompanyMasterSid : '',
      BranchMasterSid: this.branches.length > 0 ? this.branches[0].BranchMasterSid : ''
    });
    // Disable status again if not in edit mode
    if (!this.isEditMode) {
      this.currencyExchangeForm.get('status')?.disable();
    }
  }

  goBack() {
    this.router.navigate(['accounts/currency-exchange/list']);
  }
}