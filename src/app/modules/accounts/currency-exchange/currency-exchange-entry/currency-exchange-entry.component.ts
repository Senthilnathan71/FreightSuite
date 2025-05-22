import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AccountsService } from '../../accounts.service';

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
  statusList = ["Active", "Inactive"];
  loading = false;
  companyMasterList: any[] = [];
  branchMasterList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private accountService: AccountsService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
    this.loadCompanies();
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
      status: ['Active', [Validators.required]],
      CompanyMasterSid: [null, [Validators.required]],
      BranchMasterSid: [null, [Validators.required]]
    });

    // Load branches when company changes
    this.currencyExchangeForm.get('CompanyMasterSid')?.valueChanges.subscribe(companyId => {
      if (companyId) {
        this.loadBranchesForCompany(companyId);
      } else {
        this.branchMasterList = [];
        this.currencyExchangeForm.patchValue({ BranchMasterSid: null });
      }
    });
  }

  loadCompanies() {
    this.loading = true;
    this.accountService.getAllCompanies().subscribe({
      next: (companies) => {
        this.companyMasterList = companies;
        this.loading = false;
        
        // If in edit mode, branches will be loaded with the data
        if (!this.isEditMode && this.companyMasterList.length > 0) {
          const defaultCompany = this.companyMasterList[0].CompanyMasterSid;
          this.currencyExchangeForm.patchValue({ CompanyMasterSid: defaultCompany });
          this.loadBranchesForCompany(defaultCompany);
        }
      },
      error: (err) => {
        this.loading = false;
        this.appSettingService.showError('Failed to load companies');
        console.error(err);
      }
    });
  }

  loadBranchesForCompany(companyId: number) {
    this.loading = true;
    this.accountService.getAllCustomerBranches().subscribe({
      next: (branches: any[]) => {
        // Filter branches for the selected company
        this.branchMasterList = branches.filter(branch => 
          branch.CompanyMasterSid === companyId
        );
        this.loading = false;
        
        // If in edit mode, don't reset the branch selection
        if (!this.isEditMode && this.branchMasterList.length > 0) {
          this.currencyExchangeForm.patchValue({ 
            BranchMasterSid: this.branchMasterList[0].BranchMasterSid 
          });
        }
      },
      error: (err) => {
        this.loading = false;
        this.appSettingService.showError('Failed to load branches');
        console.error(err);
      }
    });
  }

  checkEditMode() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.CurrencyExchangeSid = +id;
      this.loadCurrencyExchangeData(this.CurrencyExchangeSid);
    }
  }

  loadCurrencyExchangeData(id: number) {
    this.loading = true;
    this.accountService.getCurrencyExchangeById(id).subscribe({
      next: (data) => {
        const effectiveFrom = data.EffectiveFrom ? 
          new Date(data.EffectiveFrom).toISOString().split('T')[0] : '';
        
        this.currencyExchangeForm.patchValue({
          EffectiveFrom: effectiveFrom,
          FromCurrency: data.FromCurrency,
          ToCurrency: data.ToCurrency,
          SellRate: data.SellRate,
          BuyRate: data.BuyRate,
          BankName: data.BankName,
          Remarks: data.Remarks,
          status: data.status === 'A' ? 'Active' : 'Inactive',
          CompanyMasterSid: data.CompanyMasterSid,
          BranchMasterSid: data.BranchMasterSid
        });
        
        // Load branches for the company in edit mode
        if (data.CompanyMasterSid) {
          this.loadBranchesForCompany(data.CompanyMasterSid);
        }
        
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
    const formValue = this.currencyExchangeForm.value;
    
    const payload = {
      EffectiveFrom: new Date(formValue.EffectiveFrom).toISOString(),
      FromCurrency: formValue.FromCurrency,
      ToCurrency: formValue.ToCurrency,
      SellRate: parseFloat(formValue.SellRate),
      BuyRate: parseFloat(formValue.BuyRate),
      BankName: formValue.BankName,
      Remarks: formValue.Remarks,
      status: formValue.status === "Active" ? "A" : "I",
      CompanyMasterSid: formValue.CompanyMasterSid,
      BranchMasterSid: formValue.BranchMasterSid,
      createdBy: this.appSettingService.userSettingSource.value['userEmail'],
      updatedBy: this.appSettingService.userSettingSource.value['userEmail']
    };

    if (this.isEditMode && this.CurrencyExchangeSid) {
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
    this.appSettingService.showSuccess(successMsg);
    this.router.navigate(['accounts/currency-exchange/list']);
  }

  handleError(err: any) {
    this.loading = false;
    console.error('Error:', err);
    this.appSettingService.showError(
      err.error?.message || 
      err.message || 
      'Failed to perform operation. Please try again.'
    );
  }

  reset() {
    this.currencyExchangeForm.reset({
      status: 'Active',
      CompanyMasterSid: this.companyMasterList.length > 0 ? this.companyMasterList[0].CompanyMasterSid : null,
      BranchMasterSid: this.branchMasterList.length > 0 ? this.branchMasterList[0].BranchMasterSid : null
    });
  }

  goBack() {
    this.router.navigate(['accounts/currency-exchange/list']);
  }
}