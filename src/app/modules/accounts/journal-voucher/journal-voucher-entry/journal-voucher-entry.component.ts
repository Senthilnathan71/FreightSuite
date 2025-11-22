import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { JournalVoucherService } from '../journal-voucher.service';
import { AccountsService } from '../../accounts.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

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

  statusList = [
    { id: 'Active', name: 'Active' },
    { id: 'Inactive', name: 'Inactive' },
  ];

  drCrList = [
    { id: 'D', name: 'Debit' },
    { id: 'C', name: 'Credit' },
  ];

  // Company and Branch context
  currentCompany: any;
  currentBranch: any;

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
    private appSettingService: AppSettingsService
  ) {}

  ngOnInit(): void {
    // Initialize company and branch from localStorage
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    this.initializeForm();
    this.setTodayDate();
    this.loadMasterData();
    this.checkEditMode();
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
    }).subscribe({
      next: (result) => {
        this.currencyList = result.currencies;
        this.departmentList = result.departments;
        this.costCenterList = result.costCenters.data;
        this.profitCenterList = result.profitCenters.data;
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
    // Load leaf-level ledgers only from COAMaster
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
    // Load debtors and creditors as subledgers
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
        this.chargeList = charges; // No .data property
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
        // Add first detail line for new voucher
        this.addDetailLine();
      }
    });
  }

  loadVoucherForEdit(id: number): void {
    this.journalVoucherService.getJournalVoucherById(
      id,
      this.currentCompany?.CompanyMasterSid,
      this.currentBranch?.BranchMasterSid
    ).subscribe({
      next: (voucher) => {
        this.isPosted = voucher.PostStatus === 'P';

        // Populate header
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

        // Populate details
        voucher.details.forEach((detail: any) => {
          const detailGroup = this.createDetailGroup();
          detailGroup.patchValue({
            VoucherDetailSid: detail.VoucherDetailSid,
            coaMasterSid: detail.COAMasterSid,
            ledgerMasterSid: detail.LedgerMasterSid,
            currencyMasterSid: detail.CurrencyMasterSid,
            currencyCode: detail.CurrencyCode,
            exchangeRate: detail.ExchangeRate,
            currencyAmount: detail.Amount,
            localAmount: detail.LocalAmount,
            drCr: detail.DrCr,
            narration: detail.Narration,
            departmentMasterSid: detail.DepartmentMasterSid,
            chargeMasterSid: detail.ChargeMasterSid,
            chargeDescription: detail.ChargeDescription,
            hsnsac: detail.HSNSAC,
            masterJobSid: detail.MasterJobSid,
            houseJobSid: detail.HouseJobSid,
            taxPercentage: detail.TaxPercentage1,
            taxAmount: detail.TaxAmount1,
            costCenterMasterSid: detail.CostCenterMasterSid,
            profitCenterMasterSid: detail.ProfitCenterMasterSid,
          });
          this.details.push(detailGroup);
        });

        this.calculateTotals();

        // Disable form if posted
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
      hsnsac: [''],
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

    // Subscribe to value changes for calculations
    this.setupDetailCalculations(detailGroup);

    this.details.push(detailGroup);
  }

  setupDetailCalculations(detailGroup: FormGroup): void {
    // Calculate local amount when currency amount or exchange rate changes
    detailGroup.get('currencyAmount')?.valueChanges.subscribe(() => {
      this.calculateLocalAmount(detailGroup);
      this.calculateTotals();
    });

    detailGroup.get('exchangeRate')?.valueChanges.subscribe(() => {
      this.calculateLocalAmount(detailGroup);
      this.calculateTotals();
    });

    // Recalculate totals when Dr/Cr changes
    detailGroup.get('drCr')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    // Fetch exchange rate when currency changes
    detailGroup.get('currencyMasterSid')?.valueChanges.subscribe((currencyId) => {
      if (currencyId) {
        this.fetchExchangeRate(detailGroup, currencyId);
      }
    });

    // Fetch charge details when charge changes
    detailGroup.get('chargeMasterSid')?.valueChanges.subscribe((chargeId) => {
      if (chargeId) {
        this.fetchChargeDetails(detailGroup, chargeId);
      }
    });

    // Calculate tax amount when tax percentage or local amount changes
    detailGroup.get('taxPercentage')?.valueChanges.subscribe(() => {
      this.calculateTaxAmount(detailGroup);
    });
  }

  calculateLocalAmount(detailGroup: FormGroup): void {
    const currencyAmount = detailGroup.get('currencyAmount')?.value || 0;
    const exchangeRate = detailGroup.get('exchangeRate')?.value || 1;
    const localAmount = currencyAmount * exchangeRate;

    detailGroup.patchValue({ localAmount }, { emitEvent: false });
  }

  calculateTaxAmount(detailGroup: FormGroup): void {
    const localAmount = detailGroup.get('localAmount')?.value || 0;
    const taxPercentage = detailGroup.get('taxPercentage')?.value || 0;
    const taxAmount = (localAmount * taxPercentage) / 100;

    detailGroup.patchValue({ taxAmount }, { emitEvent: false });
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
      ToCurrency: 'USD', // TODO: Get base currency from company
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
      detailGroup.patchValue({
        chargeDescription: charge.chargeName,
        hsnsac: charge.HSNSAC || '',
        taxPercentage: charge.TaxPercentage || 0,
      });
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

  saveDraft(): void {
    if (!this.isFormValid()) return;

    const payload = this.preparePayload();

    if (this.editMode && this.voucherHeaderSid) {
      // Update existing voucher
      this.journalVoucherService.updateJournalVoucher(
        this.voucherHeaderSid,
        payload,
        this.currentCompany?.CompanyMasterSid,
        this.currentBranch?.BranchMasterSid
      ).subscribe({
        next: (response) => {
          this.appSettingService.showSuccess('Journal voucher updated successfully', 'Success');
          this.router.navigate(['/accounts/journal-voucher/list']);
        },
        error: (err) => {
          console.error('Error updating voucher:', err);
          this.appSettingService.showError(err.error?.message || 'Failed to update voucher', 'Error');
        },
      });
    } else {
      // Create new voucher
      const createPayload = {
        ...payload,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
      };

      this.journalVoucherService.createJournalVoucher(createPayload).subscribe({
        next: (response) => {
          this.appSettingService.showSuccess('Journal voucher created successfully', 'Success');
          this.router.navigate(['/accounts/journal-voucher/list']);
        },
        error: (err) => {
          console.error('Error creating voucher:', err);
          this.appSettingService.showError(err.error?.message || 'Failed to create voucher', 'Error');
        },
      });
    }
  }

  postVoucher(): void {
    if (!this.isFormValid()) return;

    if (!this.voucherHeaderSid) {
      this.appSettingService.showError('Please save the voucher first before posting', 'Error');
      return;
    }

    const confirmed = confirm('Are you sure you want to post this journal voucher? This action cannot be undone.');

    if (confirmed) {
      this.journalVoucherService.postJournalVoucher(this.voucherHeaderSid!).subscribe({
        next: (response) => {
          if (response.success) {
            this.appSettingService.showSuccess('Journal voucher posted successfully', 'Success');
            this.router.navigate(['/accounts/journal-voucher/list']);
          } else {
            this.appSettingService.showError(response.errors?.join(', ') || 'Validation failed', 'Validation Failed');
          }
        },
        error: (err) => {
          console.error('Error posting voucher:', err);
          this.appSettingService.showError(err.error?.message || 'Failed to post voucher', 'Error');
        },
      });
    }
  }

  preparePayload(): any {
    const formValue = this.form.getRawValue();
    const voucherDate = formValue.voucherDate;
    const voucherDateString = `${voucherDate.year}-${String(voucherDate.month).padStart(2, '0')}-${String(voucherDate.day).padStart(2, '0')}`;

    const details = formValue.details.map((detail: any) => ({
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
      HSNSAC: detail.hsnsac || null,
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
      details,
    };
  }

  navigateToBack(): void {
    this.router.navigate(['/accounts/journal-voucher/list']);
  }
}
