import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { forkJoin, firstValueFrom } from 'rxjs';
import { JournalVoucherService } from '../journal-voucher.service';
import { AccountsService } from '../../accounts.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { OperationService } from 'src/app/modules/operation/operation.service';

@Component({
  selector: 'app-journal-voucher-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    FeatherModule,
    NgSelectModule,
  ],
  templateUrl: './journal-voucher-entry.component.html',
  styles: [``],
})
export class JournalVoucherEntryComponent implements OnInit {
  form!: FormGroup;
  editMode = false;
  voucherHeaderSid: number | null = null;
  isPosted = false;
  todayDateInNgbStruct!: NgbDateStruct;
  isSaving = false;

  // Add these properties from vendor invoice component
  currentCompany: any;
  currentBranch: any;
  currentFinancialYear: number;
  currentCountry: number;
  currentCurrency: number;
  currentUserCurrency: string;
  currentUserCountry: string;
  currentUserState: string;
  userData: any;
  currUserEmail: string | null = null;

  // Master Data Lists
  coaList: any[] = [];
  subledgerList: any[] = [];
  currencyList: any[] = [];
  departmentList: any[] = [];
  chargeList: any[] = [];
  masterJobList: any[] = [];
  houseJobList: any[] = [];
  costCenterList: any[] = [];
  profitCenterList: any[] = [];
  hssacList: any[] = [];
  uomList: any[] = [];
  HSSACLookupConfig = {
  displayFields: ['HSSACCode', 'HSSACName'],
  displayLabels: ['Code', 'Name'],
  labelFields: ['HSSACCode'],
};

  statusList = [
    { id: 'Active', name: 'Active' },
    { id: 'Inactive', name: 'Inactive' },
  ];

  drCrList = [
    { id: 'D', name: 'D' },
    { id: 'C', name: 'C' },
  ];

  // Calculations
  debitTotal = 0;
  creditTotal = 0;
  difference = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private journalVoucherService: JournalVoucherService,
    private accountsService: AccountsService,
    private dropdownStore: DropdownStore,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    private spinner: NgxSpinnerService // Add spinner service
  ) {}

  ngOnInit(): void {
    this.loadUserAndCompanyData();
    this.initializeForm();
    this.setTodayDate();
    this.loadMasterData();
    this.checkEditMode();
  }

  loadUserAndCompanyData(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    try {
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
      this.currentFinancialYear = Number(localStorage.getItem('current-year-id'));
      this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
      this.currentUserCountry = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      this.currentCountry = Number(this.currentCompany?.CountryMasterSid);
      this.currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
      this.currentUserCurrency = String(this.currentCompany?.currencyMaster?.currencyName).trim().toLowerCase();
      this.currentUserState = String(this.currentBranch?.stateMaster?.stateName).trim().toLowerCase();

      console.log('=== JOURNAL VOUCHER COMPANY DATA ===');
      console.log('Current Company:', this.currentCompany);
      console.log('Current Branch:', this.currentBranch);
      console.log('Company State:', this.currentUserState);
      console.log('Company Currency:', this.currentUserCurrency);
      console.log('Current Country:', this.currentCountry);
      console.log('Current Currency:', this.currentCurrency);
      console.log('Current Financial Year:', this.currentFinancialYear);

    } catch (e) {
      console.error('Error loading company data:', e);
      this.currentCompany = null;
      this.currentBranch = null;
    }

    // Get user email
    try {
      const decryptedProfileRaw = localStorage.getItem('user-profile');
      const decryptedProfile = decryptedProfileRaw ? this.appSettingService.decrypt(decryptedProfileRaw) : null;
      this.currUserEmail = decryptedProfile?.email || localStorage.getItem('user-email') || null;
    } catch (err) {
      this.currUserEmail = localStorage.getItem('user-email') || null;
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
      voucherNumber: [{ value: '', disabled: true }],
      voucherDate: [null, Validators.required],
      narration: ['', Validators.maxLength(200)],
      remarks: ['', Validators.maxLength(200)],
      status: ['Active'],
      postStatus: [{ value: 'Unposted', disabled: true }],
      postDate: [{ value: '', disabled: true }],
      details: this.fb.array([]),
    });
  }

  setTodayDate(): void {
    const today = new Date();
    this.todayDateInNgbStruct = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    };
    this.form.patchValue({ voucherDate: this.todayDateInNgbStruct });
  }

  loadMasterData(): void {
    forkJoin({
      currencies: this.dropdownStore.loadCurrencies(),
      departments: this.dropdownStore.loadDepartments({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid
      }),
      costCenters: this.accountsService.getAllCostCenters(),
      profitCenters: this.accountsService.getAllProfitCenters(),
       hssac: this.operationService.getAllHssac(), // Add HSSAC
      uom: this.operationService.getAllUom(),
    }).subscribe({
      next: (result) => {
        this.currencyList = result.currencies;
        this.departmentList = result.departments;
        this.costCenterList = result.costCenters.data;
        this.profitCenterList = result.profitCenters.data;
        this.hssacList = result.hssac || [];
        this.uomList = result.uom?.data || [];
        this.loadCOAList();
        this.loadSubledgerList();
        this.loadChargeList();
      },
      error: (err) => {
        console.error('Error loading master data:', err);
        this.appSettingService.showError('Failed to load master data', 'Error');
      },
    });
  }

  loadCOAList(): void {
    this.accountsService.getAllCoaWithLedgerCategory({
      LedgerCategory: 'Ledger',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid
    }).subscribe({
      next: (response: any) => {
        this.coaList = response.data || [];
      },
      error: (err) => {
        console.error('Error loading COA list:', err);
      },
    });
  }

  loadSubledgerList(): void {
    this.accountsService.getAllDebtorWithCOAMapped({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid
    }).subscribe({
      next: (response: any) => {
        this.subledgerList = response.data || [];
      },
      error: (err) => {
        console.error('Error loading subledger list:', err);
      },
    });
  }

  loadChargeList(): void {
    this.accountsService.getAllCharges(this.currentCompany?.CompanyMasterSid).subscribe({
      next: (charges) => {
        this.chargeList = charges;
      },
      error: (err) => {
        console.error('Error loading charge list:', err);
      },
    });
  }

  checkEditMode(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.editMode = true;
        this.voucherHeaderSid = +params['id'];
        this.loadVoucherForEdit(this.voucherHeaderSid);
      } else {
        this.addDetailLine();
      }
    });
  }

  loadVoucherForEdit(id: number): void {
    this.journalVoucherService.getJournalVoucherById(id).subscribe({
      next: (response) => {
        const voucher = response.data;
        
        if (!voucher) {
          this.appSettingService.showError('Voucher not found', 'Error');
          this.router.navigate(['/accounts/journal-voucher/list']);
          return;
        }

        this.isPosted = voucher.PostStatus === 'P';

        const voucherDate = new Date(voucher.VoucherDate);
        const voucherDateStruct: NgbDateStruct = {
          year: voucherDate.getFullYear(),
          month: voucherDate.getMonth() + 1,
          day: voucherDate.getDate(),
        };

        this.form.patchValue({
          voucherNumber: voucher.VoucherNumber,
          voucherDate: voucherDateStruct,
          narration: voucher.Narration,
          remarks: voucher.Remarks,
          status: voucher.Status,
          postStatus: voucher.PostStatus === 'P' ? 'Posted' : 'Unposted',
          postDate: voucher.PostDate ? new Date(voucher.PostDate).toLocaleDateString() : '',
        });

        this.details.clear();

        if (voucher.VoucherDetail && Array.isArray(voucher.VoucherDetail)) {
          voucher.VoucherDetail.forEach((detail: any) => {
            const detailGroup = this.createDetailGroup();
            
            detailGroup.patchValue({
              VoucherDetailSid: detail.VoucherDetailSid,
              coaMasterSid: detail.COAMasterSid,
              ledgerMasterSid: detail.LedgerMasterSid,
              currencyMasterSid: detail.CurrencyMasterSid,
              currencyCode: detail.CurrencyCode,
              exchangeRate: parseFloat(detail.ExchangeRate) || 1,
              currencyAmount: parseFloat(detail.Amount) || 0,
              localAmount: parseFloat(detail.LocalAmount) || 0,
              drCr: detail.DrCr,
              narration: detail.Narration,
              departmentMasterSid: detail.DepartmentMasterSid,
              chargeMasterSid: detail.ChargeMasterSid,
              chargeDescription: detail.ChargeDescription,
              HSSACCode: detail.HSSACCode,
              masterJobSid: detail.MasterJobSid,
              houseJobSid: detail.HouseJobSid,
              taxPercentage: parseFloat(detail.TaxPercentage1) || 0,
              taxAmount: parseFloat(detail.TaxAmount1) || 0,
              costCenterMasterSid: detail.CostCenter,
              profitCenterMasterSid: detail.ProfitCenter,
            });

            this.setupDetailCalculations(detailGroup);
            this.details.push(detailGroup);
          });
        }

        this.calculateTotals();

        if (this.isPosted) {
          this.form.disable();
        }
      },
      error: (err) => {
        console.error('Error loading voucher:', err);
        this.appSettingService.showError('Failed to load voucher details', 'Error');
        this.router.navigate(['/accounts/journal-voucher/list']);
      },
    });
  }

  get details(): FormArray {
    return this.form.get('details') as FormArray;
  }

  createDetailGroup(): FormGroup {
    return this.fb.group({
      VoucherDetailSid: [null],
      coaMasterSid: [null, Validators.required],
      ledgerMasterSid: [null],
      currencyMasterSid: [null, Validators.required],
      currencyCode: [''],
      exchangeRate: [1, [Validators.required, Validators.min(0)]],
      currencyAmount: [0, [Validators.required, Validators.min(0.01)]],
      localAmount: [0, [Validators.required, Validators.min(0)]],
      drCr: ['D', Validators.required],
      narration: ['', Validators.maxLength(200)],
      departmentMasterSid: [null],
      chargeMasterSid: [null],
      chargeDescription: [''],
      HSSACCode: [''],
      masterJobSid: [null],
      houseJobSid: [null],
      taxPercentage: [0],
      taxAmount: [0],
      costCenterMasterSid: [null],
      profitCenterMasterSid: [null],
    });
  }

  addDetailLine(): void {
    const detailGroup = this.createDetailGroup();
    this.setupDetailCalculations(detailGroup);
    this.details.push(detailGroup);
  }

  setupDetailCalculations(detailGroup: FormGroup): void {
  detailGroup.get('currencyAmount')?.valueChanges.subscribe(() => {
    this.calculateLocalAmount(detailGroup);
    this.calculateTotals();
  });

  detailGroup.get('exchangeRate')?.valueChanges.subscribe(() => {
    this.calculateLocalAmount(detailGroup);
    this.calculateTotals();
  });

  detailGroup.get('drCr')?.valueChanges.subscribe(() => {
    this.calculateTotals();
  });

  detailGroup.get('currencyMasterSid')?.valueChanges.subscribe((currencyId) => {
    if (currencyId) {
      this.fetchExchangeRate(detailGroup, currencyId);
    }
  });

  // Enhanced charge change handling
  detailGroup.get('chargeMasterSid')?.valueChanges.subscribe((chargeId) => {
    if (chargeId) {
      this.onChargeChange(detailGroup, chargeId);
    } else {
      // Reset charge-related fields when charge is cleared
      detailGroup.patchValue({
        chargeDescription: '',
        HSSACCode: '',
        taxPercentage: 0,
        taxAmount: 0
      });
    }
  });

  detailGroup.get('taxPercentage')?.valueChanges.subscribe(() => {
    this.calculateTaxAmount(detailGroup);
  });
}


  calculateTaxAmount(detailGroup: FormGroup): void {
  const localAmount = detailGroup.get('localAmount')?.value || 0;
  const taxPercentage = detailGroup.get('taxPercentage')?.value || 0;
  const taxAmount = (localAmount * taxPercentage) / 100;
  detailGroup.patchValue({ taxAmount }, { emitEvent: false });
}
 calculateLocalAmount(detailGroup: FormGroup): void {
  const currencyAmount = detailGroup.get('currencyAmount')?.value || 0;
  const exchangeRate = detailGroup.get('exchangeRate')?.value || 1;
  const localAmount = currencyAmount * exchangeRate;
  detailGroup.patchValue({ localAmount }, { emitEvent: false });
  
  // Recalculate tax when local amount changes
  this.calculateTaxAmount(detailGroup);
}

  fetchExchangeRate(detailGroup: FormGroup, currencyId: number): void {
    const voucherDate = this.form.get('voucherDate')?.value;
    if (!voucherDate) return;

    const dateString = `${voucherDate.year}-${String(voucherDate.month).padStart(2, '0')}-${String(voucherDate.day).padStart(2, '0')}`;

    const currency = this.currencyList.find((c) => c.CurrencyMasterSid === currencyId);
    if (currency) {
      detailGroup.patchValue({ currencyCode: currency.currencyCode });
    }

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      FromCurrency: currency?.currencyCode || '',
      ToCurrency: this.currentUserCurrency || 'USD',
      VoucherDate: dateString,
    };

    this.accountsService.getExchangeRate(payload).subscribe({
      next: (response: any) => {
        const rate = response?.ExchangeRate || 1;
        detailGroup.patchValue({ exchangeRate: rate });
      },
      error: (err) => {
        console.error('Error fetching exchange rate:', err);
        detailGroup.patchValue({ exchangeRate: 1 });
      },
    });
  }

  fetchChargeDetails(detailGroup: FormGroup, chargeId: number): void {
  const charge = this.chargeList.find((c) => c.ChargeMasterSid === chargeId);
  
  if (charge) {
    const description = charge.ChargeDescription || charge.chargeName || charge.ChargeName || '';
    let hssacId = charge.HSSACMasterSid ?? charge.HSSACMasterSid ?? null;
    
    // Auto-set HSN/SAC code from ChargeTaxMaster (same logic as vendor invoice)
    if (!hssacId && Array.isArray(charge.ChargeTaxMaster) && charge.ChargeTaxMaster.length > 0) {
      const firstTax = charge.ChargeTaxMaster[0];
      const hsnCode = firstTax?.HSNCode;
      
      // Find matching HSSAC from hssacList using HSNCode
      if (hsnCode) {
        const matchingHssac = this.hssacList.find(h => 
          h.HSSACCode === hsnCode || h.HSNCode === hsnCode
        );
        if (matchingHssac) {
          hssacId = matchingHssac.HSSACMasterSid;
        }
      }
    }
    
    const chargeUomId = charge.ChargeUOMSid ?? charge.UOM ?? charge.UOMMasterSid ?? null;
    
    // Auto-set tax percentage from HSSAC
    let taxPercentage = charge.TaxPercentage || 0;
    if (hssacId) {
      const hssac = this.hssacList.find(h => h.HSSACMasterSid === hssacId);
      taxPercentage = hssac?.TaxRate || taxPercentage;
    }

    // Update the detail group with all charge information
    detailGroup.patchValue({
      chargeDescription: description,
      HSSACCode: this.getHSSACCode(hssacId), // Set HSSAC code for display
      taxPercentage: taxPercentage,
      // Note: We're storing HSSACMasterSid in a separate field if needed
    });

    // Store HSSAC Master SID in a custom property if needed for calculations
    detailGroup.get('HSSACCode')?.setValue(this.getHSSACCode(hssacId));
    
    // Recalculate tax amount after setting tax percentage
    this.calculateTaxAmount(detailGroup);
  }
}
getHSSACCode(hssacMasterSid: number): string {
  if (!hssacMasterSid) return '';
  const hssac = this.hssacList.find(h => h.HSSACMasterSid === hssacMasterSid);
  return hssac?.HSSACCode || hssac?.HSNCode || '';
}
onChargeChange(detailControl: AbstractControl, event: any): void {
  const detailGroup = detailControl as FormGroup;
  const chargeId = event;
  
  const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeId);
  
  if (charge) {
    const description = charge.ChargeDescription || charge.chargeName || charge.ChargeName || '';
    let hssacId = charge.HSSACMasterSid ?? charge.HSSACMasterSid ?? null;
    
    // Auto-set HSN/SAC code from ChargeTaxMaster
    if (!hssacId && Array.isArray(charge.ChargeTaxMaster) && charge.ChargeTaxMaster.length > 0) {
      const firstTax = charge.ChargeTaxMaster[0];
      const hsnCode = firstTax?.HSNCode;
      
      if (hsnCode) {
        const matchingHssac = this.hssacList.find(h => 
          h.HSSACCode === hsnCode || h.HSNCode === hsnCode
        );
        if (matchingHssac) {
          hssacId = matchingHssac.HSSACMasterSid;
        }
      }
    }
    
    const chargeUomId = charge.ChargeUOMSid ?? charge.UOM ?? charge.UOMMasterSid ?? null;

    // Auto-set tax percentage
    let taxPercentage = charge.TaxPercentage || 0;
    if (hssacId) {
      const hssac = this.hssacList.find(h => h.HSSACMasterSid === hssacId);
      taxPercentage = hssac?.TaxRate || taxPercentage;
    }

    detailGroup.patchValue({
      chargeDescription: description,
      HSSACCode: this.getHSSACCode(hssacId),
      taxPercentage: taxPercentage
    });

    this.calculateTaxAmount(detailGroup);
  }
}

  deleteDetailLine(index: number): void {
    if (this.details.length > 1) {
      this.details.removeAt(index);
      this.calculateTotals();
    } else {
      this.appSettingService.showWarning('At least one detail line is required', 'Warning');
    }
  }

  calculateTotals(): void {
    this.debitTotal = 0;
    this.creditTotal = 0;

    this.details.controls.forEach((control) => {
      const drCr = control.get('drCr')?.value;
      const localAmount = control.get('localAmount')?.value || 0;

      if (drCr === 'D') {
        this.debitTotal += localAmount;
      } else if (drCr === 'C') {
        this.creditTotal += localAmount;
      }
    });

    this.difference = Math.abs(this.debitTotal - this.creditTotal);
  }

  isFormValid(): boolean {
    if (!this.form.valid) {
      this.appSettingService.showError('Please fill all required fields', 'Validation Error');
      return false;
    }

    if (this.details.length === 0) {
      this.appSettingService.showError('Please add at least one detail line', 'Validation Error');
      return false;
    }

    if (this.difference > 0.01) {
      this.appSettingService.showError(
        `Debit and Credit totals must be equal. Difference: ${this.difference.toFixed(2)}`,
        'Validation Error'
      );
      return false;
    }

    return true;
  }

  // NEW: Final Save with Posting functionality
  onFinalSave(): void {
    if (!this.isFormValid()) return;

    this.calculateTotals(); // Ensure totals are up to date
    
    this.saveJournalVoucher(true); // true indicates final save with posting
  }

  // NEW: Save Journal Voucher (similar to vendor invoice)
  private saveJournalVoucher(isFinal: boolean): void {
    const payload = this.preparePayload();

    this.isSaving = true;
    this.spinner.show();

    const saveObservable = this.voucherHeaderSid 
      ? this.journalVoucherService.updateJournalVoucherById(this.voucherHeaderSid, payload)
      : this.journalVoucherService.createJournalVoucher(payload);

    saveObservable.subscribe({
      next: async (response: any) => {
        if (response?.status) {
          const voucherHeaderSid = response.data?.VoucherHeaderSid || this.voucherHeaderSid;
          
          if (isFinal && voucherHeaderSid) {
            // If final save, post the voucher
            await this.postVoucher(voucherHeaderSid);
          } else {
            this.spinner.hide();
            this.isSaving = false;
            const message = isFinal ? 'Journal voucher saved and posted successfully!' : 'Journal voucher saved as draft successfully!';
            this.appSettingService.showSuccess(message);
            
            if (!this.voucherHeaderSid && voucherHeaderSid) {
              this.voucherHeaderSid = voucherHeaderSid;
              this.router.navigate(['/accounts/journal-voucher/entry', voucherHeaderSid]);
            }
          }
        } else {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError('Error saving journal voucher.');
        }
      },
      error: (err) => {
        this.spinner.hide();
        this.isSaving = false;
        console.error('Save journal voucher error', err);
        this.appSettingService.showError('Failed to save journal voucher.');
      }
    });
  }

  // NEW: Post Voucher method (similar to vendor invoice)
  private async postVoucher(voucherHeaderSid: number): Promise<void> {
    try {
      this.spinner.show();
      
      const currentCompany = this.currentCompany;
      const currentBranch = this.currentBranch;
      const currentFinancialYear = Number(localStorage.getItem('current-year-id'));
      const currentCountry = Number(this.currentCompany?.CountryMasterSid);
      const currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
      const currentCountryName = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      const currentUserEmail =  this.userData?.userEmail;

      if (!currentCompany || !currentBranch || !currentFinancialYear || !currentCountry || !currentCurrency) {
        throw new Error('Company, branch, financial year, or currency information is missing');
      }

      const postPayload = {
        VoucherHeaderSid: voucherHeaderSid,
        CompanyMasterSid: currentCompany.CompanyMasterSid,
        BranchMasterSid: currentBranch.BranchMasterSid,
        YearMasterSid: currentFinancialYear,
        LocalCurrencyMasterSid: currentCurrency,
        LocalCurrencyCode: this.currentCompany.CurrencyCode,
        PostedBy: currentUserEmail,
        TaxDetails: {
          CountryMasterSid: currentCountry,
          countryName: currentCountryName,
          TaxCategory: 'Inter',
          EffectiveFrom: new Date().toISOString(),
          TaxType: 'Output'
        }
      };

      // Use journalVoucherService for posting
      const result = await firstValueFrom(this.operationService.postVoucherByVoucherSid(postPayload));
      
      this.spinner.hide();
      this.isSaving = false;
      
      if (result.status) {
        this.appSettingService.showSuccess('Journal voucher saved and posted successfully!');
        this.isPosted = true; // Update local state
        
        // Navigate to list after successful posting
        this.router.navigate(['/accounts/journal-voucher/list']);
      } else {
        this.appSettingService.showError(result.message || 'Failed to post journal voucher.');
      }
    } catch (error) {
      this.spinner.hide();
      this.isSaving = false;
      console.error('Post voucher error:', error);
      this.appSettingService.showError('Failed to post journal voucher. Please try again.');
    }
  }

  // Existing saveDraft method (for draft saving)
  saveDraft(): void {
    if (!this.isFormValid()) return;
    this.saveJournalVoucher(false); // false indicates draft save without posting
  }

  preparePayload(): any {
    const formValue = this.form.getRawValue();
    const voucherDate = formValue.voucherDate;
    const voucherDateString = `${voucherDate.year}-${String(voucherDate.month).padStart(2, '0')}-${String(voucherDate.day).padStart(2, '0')}`;

    const VoucherDetail = formValue.details.map((detail: any) => ({
      VoucherDetailSid: detail.VoucherDetailSid || undefined,
      COAMasterSid: detail.coaMasterSid,
      LedgerMasterSid: detail.ledgerMasterSid || null,
      CurrencyMasterSid: detail.currencyMasterSid,
      CurrencyCode: detail.currencyCode,
      ExchangeRate: detail.exchangeRate,
      Amount: detail.currencyAmount,
      LocalAmount: detail.localAmount,
      DrCr: detail.drCr,
      Narration: detail.narration || null,
      DepartmentMasterSid: detail.departmentMasterSid || null,
      ChargeMasterSid: detail.chargeMasterSid || null,
      ChargeDescription: detail.chargeDescription || null,
      HSSACCode: detail.HSSACCode || null,
      MasterJobSid: detail.masterJobSid || null,
      HouseJobSid: detail.houseJobSid || null,
      TaxPercentage1: detail.taxPercentage || null,
      TaxAmount1: detail.taxAmount || null,
      CostCenterMasterSid: detail.costCenterMasterSid || null,
      ProfitCenterMasterSid: detail.profitCenterMasterSid || null,
    }));

    return {
      VoucherDate: voucherDateString,
      Narration: formValue.narration || null,
      Remarks: formValue.remarks || null,
      Status: formValue.status,
      PostStatus: 'U', // Unposted for draft
      PartyName: 'System Journal Entry',
      DocumentNumber: `JV-${new Date().getTime()}`,
      Amount: this.debitTotal,
      LocalAmount: this.debitTotal,
      VoucherDetail,
      // Add company context for new vouchers
      ...(!this.voucherHeaderSid && {
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
      })
    };
  }

  navigateToBack(): void {
    this.router.navigate(['/accounts/journal-voucher/list']);
  }
}