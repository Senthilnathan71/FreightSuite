import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDatepickerModule, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, takeUntil } from 'rxjs';
import { PaymentService } from '../../services/payment.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import {
  CreatePaymentRequest,
  PaymentDetail,
  PaymentTDS,
  PaymentVoucherMatching,
  PaymentInterBranch,
  VendorOutstandingInvoice,
  PaymentMode,
  InstrumentMode,
  SearchType
} from '../../models/payment.model';

/**
 * Payment Entry Component
 *
 * Supports 4 types of payments:
 * 1. Advance Payment to Vendor
 * 2. Payment against Vendor Invoice with TDS
 * 3. Multi-branch Payment with Auto Inter-branch JV
 * 4. Direct Expense Payment
 */
@Component({
  selector: 'app-payment-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbDatepickerModule,
    NgbTooltipModule,
    FeatherModule,
    NgxSpinnerModule,
    NgSelectModule
  ],
  templateUrl: './payment-entry.component.html',
  styleUrls: ['./payment-entry.component.scss']
})
export class PaymentEntryComponent implements OnInit, OnDestroy {
  paymentForm!: FormGroup;
  paymentId?: number;
  isEditMode = false;
  isLoading = false;
  isSaving = false;

  // Tabs
  selectedTab = 'detail';
  tabs = [
    { id: 'detail', name: 'Detail', icon: 'fas fa-file-alt' },
    { id: 'tds', name: 'TDS', icon: 'fas fa-file-invoice-dollar' },
    { id: 'voucher', name: 'Voucher', icon: 'fas fa-receipt' },
    { id: 'interbranch', name: 'Interbranch', icon: 'fas fa-exchange-alt' }
  ];

  // Enums for dropdowns
  paymentModes = Object.values(PaymentMode);
  instrumentModes = Object.values(InstrumentMode);
  searchTypes = Object.values(SearchType);

  // Master data (to be loaded from services)
  companies: any[] = [];
  branches: any[] = [];
  banks: any[] = [];
  vendors: any[] = [];
  ledgers: any[] = [];
  currencies: any[] = [];
  tdsSets: any[] = [];
  costCenters: any[] = [];
  profitCenters: any[] = [];
  chargeList: any[] = [];

  // Property aliases for template compatibility
  get branchList() { return this.branches; }
  get bankList() { return this.banks; }
  get vendorList() { return this.vendors; }
  get ledgerList() { return this.ledgers; }
  get currencyList() { return this.currencies; }
  get tdsSetList() { return this.tdsSets; }
  get costCenterList() { return this.costCenters; }

  // Outstanding invoices
  outstandingInvoices: VendorOutstandingInvoice[] = [];
  filteredOutstandingInvoices: VendorOutstandingInvoice[] = [];

  // Current company and branch (from session)
  currentCompany: any;
  currentBranch: any;

  // Calculation totals
  totalDr = 0;
  totalCr = 0;
  netAmount = 0;
  totalTDS = 0;

  // Make Math available in template
  Math = Math;

  // Loading state alias for template
  get loading() { return this.isLoading; }

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private appSettingsService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadMasterData();
    this.setupFormSubscriptions();

    // Check if edit mode
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.paymentId = +params['id'];
        this.isEditMode = true;
        this.loadPayment(this.paymentId);
      } else {
        // Initialize with default values
        this.addDetailRow();
      }
    });

    // Load current company and branch from session
    this.loadCurrentContext();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize reactive form
   */
  initializeForm(): void {
    this.paymentForm = this.fb.group({
      // Header fields
      searchType: [SearchType.VendorName],
      searchValue: [''],
      paymentNumber: [{ value: '', disabled: true }],
      paymentDate: [new Date(), Validators.required],
      paymentMode: [PaymentMode.Cash, Validators.required],
      multiBranch: [false],
      company: [null, Validators.required],
      branch: [null, Validators.required],
      bank: [null, Validators.required],
      currency: [null, Validators.required],
      exchangeRate: [1, [Validators.required, Validators.min(0)]],
      vendor: [null],
      paidTo: ['', [Validators.required, Validators.maxLength(200)]],
      address: ['', Validators.maxLength(500)],
      gstNumber: ['', Validators.maxLength(50)],
      narration: ['', Validators.maxLength(200)],
      remarks: ['', Validators.maxLength(200)],
      instrumentMode: [''],
      instrumentNumber: [''],
      instrumentDate: [null],
      clearanceDate: [null],

      // FormArrays for tabs
      details: this.fb.array([]),
      tdsDetails: this.fb.array([]),
      voucherMatchings: this.fb.array([]),
      interBranch: this.fb.array([])
    });
  }

  /**
   * Setup form value change subscriptions
   */
  setupFormSubscriptions(): void {
    // Auto-populate vendor details when vendor selected
    this.paymentForm.get('vendor')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(vendor => {
        if (vendor) {
          this.paymentForm.patchValue({
            paidTo: vendor.SubledgerName || '',
            address: vendor.Address || '',
            gstNumber: vendor.GSTNumber || ''
          });
          // Load vendor TDS mapping
          this.loadVendorTDSMapping(vendor.SubledgerMasterSid);
        }
      });

    // Calculate local amount when currency or exchange rate changes
    this.paymentForm.get('currency')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(currency => {
        if (currency) {
          // Fetch exchange rate from master
          this.loadExchangeRate(currency.CurrencyMasterSid);
        }
      });

    // Show/hide instrument fields based on payment mode
    this.paymentForm.get('paymentMode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(mode => {
        if (mode === PaymentMode.Cash) {
          this.paymentForm.patchValue({
            instrumentMode: '',
            instrumentNumber: '',
            instrumentDate: null
          });
        }
      });

    // Show/hide inter-branch section
    this.paymentForm.get('multiBranch')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMultiBranch => {
        if (isMultiBranch && this.interBranchArray.length === 0) {
          this.addInterBranchRow();
        }
      });

    // Recalculate totals when details change
    this.detailsArray.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculateTotals();
      });

    this.tdsArray.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculateTotals();
      });
  }

  /**
   * Load master data
   */
  loadMasterData(): void {
    // TODO: Load from respective services
    // this.companyService.getCompanies()
    // this.branchService.getBranches()
    // this.ledgerService.getLedgers()
    // etc.
  }

  /**
   * Load current company and branch from session
   */
  loadCurrentContext(): void {
    // TODO: Get from auth/session service
    // this.currentCompany = this.authService.getCurrentCompany();
    // this.currentBranch = this.authService.getCurrentBranch();

    // Set default values
    this.paymentForm.patchValue({
      company: this.currentCompany,
      branch: this.currentBranch
    });
  }

  /**
   * Load payment for edit
   */
  loadPayment(id: number): void {
    this.isLoading = true;
    this.spinner.show();

    this.paymentService.getPaymentById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payment) => {
          this.populateForm(payment);
          this.isLoading = false;
          this.spinner.hide();
        },
        error: (error) => {
          console.error('Error loading payment:', error);
          this.isLoading = false;
          this.spinner.hide();
          this.goBack();
        }
      });
  }

  /**
   * Populate form with payment data
   */
  populateForm(payment: any): void {
    // TODO: Implement form population for edit mode
    this.appSettingsService.showWarning('Edit mode not yet fully implemented');
  }

  /**
   * Load vendor TDS mapping
   */
  loadVendorTDSMapping(vendorSid: number): void {
    // TODO: Load from vendor TDS mapping service
    // Auto-populate TDS tab based on vendor configuration
  }

  /**
   * Load exchange rate
   */
  loadExchangeRate(currencySid: number): void {
    // TODO: Fetch from exchange rate master
    // For now, set default
    this.paymentForm.patchValue({
      exchangeRate: 1
    });
  }

  // ============================================
  // Detail Tab Methods
  // ============================================

  get detailsArray(): FormArray {
    return this.paymentForm.get('details') as FormArray;
  }

  createDetailRow(): FormGroup {
    return this.fb.group({
      charge: [null],
      sacHSCode: [''],
      ledger: [null, Validators.required],
      branch: [null, Validators.required],
      drCr: ['D', Validators.required],
      currency: [null, Validators.required],
      exchangeRate: [1, [Validators.required, Validators.min(0)]],
      currencyAmount: [0, [Validators.required, Validators.min(0)]],
      taxableAmount: [0, [Validators.required, Validators.min(0)]],
      taxPercentage: [0, [Validators.min(0), Validators.max(100)]],
      taxAmount: [0, Validators.min(0)],
      localAmount: [0, [Validators.required, Validators.min(0)]],
      narration: ['', Validators.maxLength(200)],
      costCenter: [null],
      profitCenter: [null],
      masterJob: [null],
      houseJob: [null]
    });
  }

  addDetailRow(): void {
    const detailGroup = this.createDetailRow();

    // Setup subscriptions for calculations
    this.setupDetailRowCalculations(detailGroup);

    this.detailsArray.push(detailGroup);
  }

  removeDetailRow(index: number): void {
    if (this.detailsArray.length > 1) {
      this.detailsArray.removeAt(index);
    } else {
      this.appSettingsService.showWarning('At least one detail line is required');
    }
  }

  setupDetailRowCalculations(detailGroup: FormGroup): void {
    // Auto-calculate local amount when currency amount or exchange rate changes
    detailGroup.get('currencyAmount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateDetailRowLocalAmount(detailGroup));

    detailGroup.get('exchangeRate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateDetailRowLocalAmount(detailGroup));

    // Auto-calculate tax amount
    detailGroup.get('taxableAmount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateDetailRowTaxAmount(detailGroup));

    detailGroup.get('taxPercentage')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateDetailRowTaxAmount(detailGroup));
  }

  calculateDetailRowLocalAmount(detailGroup: FormGroup): void {
    const currencyAmount = detailGroup.get('currencyAmount')?.value || 0;
    const exchangeRate = detailGroup.get('exchangeRate')?.value || 1;
    const localAmount = this.paymentService.calculateLocalAmount(currencyAmount, exchangeRate);

    detailGroup.patchValue({
      localAmount: localAmount,
      taxableAmount: localAmount // Default taxable amount = local amount
    }, { emitEvent: false });
  }

  calculateDetailRowTaxAmount(detailGroup: FormGroup): void {
    const taxableAmount = detailGroup.get('taxableAmount')?.value || 0;
    const taxPercentage = detailGroup.get('taxPercentage')?.value || 0;
    const taxAmount = this.paymentService.calculateTax(taxableAmount, taxPercentage);

    detailGroup.patchValue({
      taxAmount: taxAmount
    }, { emitEvent: false });
  }

  // ============================================
  // TDS Tab Methods
  // ============================================

  get tdsArray(): FormArray {
    return this.paymentForm.get('tdsDetails') as FormArray;
  }

  createTDSRow(): FormGroup {
    return this.fb.group({
      tdsSet: [null, Validators.required],
      tdsCompanyType: ['Company', Validators.required],
      itSectionCode: ['', Validators.required],
      certificateNumber: [''],
      tdsPercentage: [0, [Validators.required, Validators.min(0)]],
      taxableAmount: [0, [Validators.required, Validators.min(0)]],
      tdsAmount: [0, [Validators.required, Validators.min(0)]],
      reason: ['', Validators.maxLength(200)]
    });
  }

  addTDSRow(): void {
    const tdsGroup = this.createTDSRow();

    // Setup TDS calculations
    this.setupTDSRowCalculations(tdsGroup);

    this.tdsArray.push(tdsGroup);
  }

  removeTDSRow(index: number): void {
    this.tdsArray.removeAt(index);
  }

  setupTDSRowCalculations(tdsGroup: FormGroup): void {
    // Auto-populate from TDS Set when selected
    tdsGroup.get('tdsSet')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(tdsSet => {
        if (tdsSet) {
          tdsGroup.patchValue({
            itSectionCode: tdsSet.ITSectionCode || '',
            tdsPercentage: tdsSet.TDSPercentage || 0,
            tdsCompanyType: tdsSet.TDSCompanyType || 'Company'
          });
        }
      });

    // Auto-calculate TDS amount
    tdsGroup.get('taxableAmount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateTDSRowAmount(tdsGroup));

    tdsGroup.get('tdsPercentage')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateTDSRowAmount(tdsGroup));
  }

  calculateTDSRowAmount(tdsGroup: FormGroup): void {
    const taxableAmount = tdsGroup.get('taxableAmount')?.value || 0;
    const tdsPercentage = tdsGroup.get('tdsPercentage')?.value || 0;
    const tdsAmount = this.paymentService.calculateTDS(taxableAmount, tdsPercentage);

    tdsGroup.patchValue({
      tdsAmount: tdsAmount
    }, { emitEvent: false });
  }

  // ============================================
  // Voucher Matching Tab Methods
  // ============================================

  get voucherMatchingsArray(): FormArray {
    return this.paymentForm.get('voucherMatchings') as FormArray;
  }

  /**
   * Search vendor outstanding invoices
   */
  searchOutstanding(): void {
    const searchType = this.paymentForm.get('searchType')?.value;
    const searchValue = this.paymentForm.get('searchValue')?.value;
    const company = this.paymentForm.get('company')?.value;
    const vendor = this.paymentForm.get('vendor')?.value;

    if (!searchValue && !vendor) {
      this.appSettingsService.showWarning('Please enter search value or select vendor');
      return;
    }

    this.isLoading = true;
    this.spinner.show();

    const request: any = {
      CompanyMasterSid: company?.CompanyMasterSid,
      LedgerMasterSid: vendor?.SubledgerMasterSid
    };

    // Add search criteria based on type
    switch (searchType) {
      case SearchType.Invoice:
        request.InvoiceNumber = searchValue;
        break;
      case SearchType.HouseNo:
        request.HouseNumber = searchValue;
        break;
      case SearchType.MasterNo:
        request.MasterNumber = searchValue;
        break;
      // Add other search types
    }

    // this.paymentService.searchVendorOutstanding(request)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (invoices) => {
    //       this.outstandingInvoices = invoices;
    //       this.filteredOutstandingInvoices = invoices;
    //       this.isLoading = false;
    //       this.spinner.hide();

    //       if (invoices.length === 0) {
    //         this.appSettingsService.showInfo('No outstanding invoices found');
    //       }
    //     },
    //     error: (error) => {
    //       console.error('Error searching outstanding:', error);
    //       this.isLoading = false;
    //       this.spinner.hide();
    //     }
    //   });
  }

  /**
   * Add invoice to matching list
   */
  addInvoiceToMatching(invoice: VendorOutstandingInvoice): void {
    const matchingGroup = this.fb.group({
      voucherTransactionSid: [invoice.VoucherTransactionSid, Validators.required],
      voucherNumber: [invoice.VoucherNumber],
      invoiceDate: [invoice.VoucherDate],
      originalAmount: [invoice.OriginalAmount],
      outstandingAmount: [invoice.OutstandingAmount],
      currencyAmount: [invoice.OutstandingCurrencyAmount, [Validators.required, Validators.min(0)]],
      localAmount: [invoice.OutstandingAmount, [Validators.required, Validators.min(0)]],
      tdsAmount: [0, Validators.min(0)],
      balance: [invoice.OutstandingAmount]
    });

    // Setup matching calculations
    this.setupMatchingRowCalculations(matchingGroup);

    this.voucherMatchingsArray.push(matchingGroup);
  }

  removeMatchingRow(index: number): void {
    this.voucherMatchingsArray.removeAt(index);
  }

  setupMatchingRowCalculations(matchingGroup: FormGroup): void {
    // Calculate balance when matching amount changes
    matchingGroup.get('localAmount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const outstanding = matchingGroup.get('outstandingAmount')?.value || 0;
        const matched = matchingGroup.get('localAmount')?.value || 0;
        const tds = matchingGroup.get('tdsAmount')?.value || 0;
        const balance = outstanding - matched - tds;

        matchingGroup.patchValue({
          balance: balance
        }, { emitEvent: false });
      });

    matchingGroup.get('tdsAmount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const outstanding = matchingGroup.get('outstandingAmount')?.value || 0;
        const matched = matchingGroup.get('localAmount')?.value || 0;
        const tds = matchingGroup.get('tdsAmount')?.value || 0;
        const balance = outstanding - matched - tds;

        matchingGroup.patchValue({
          balance: balance
        }, { emitEvent: false });
      });
  }

  // ============================================
  // Inter-Branch Tab Methods
  // ============================================

  get interBranchArray(): FormArray {
    return this.paymentForm.get('interBranch') as FormArray;
  }

  createInterBranchRow(): FormGroup {
    return this.fb.group({
      branch: [null, Validators.required],
      currencyAmount: [0, [Validators.required, Validators.min(0)]],
      narration: ['', Validators.maxLength(200)],
      jvNumber: [{ value: '', disabled: true }]
    });
  }

  addInterBranchRow(): void {
    this.interBranchArray.push(this.createInterBranchRow());
  }

  removeInterBranchRow(index: number): void {
    this.interBranchArray.removeAt(index);
  }

  // ============================================
  // Calculation Methods
  // ============================================

  calculateTotals(): void {
    // Calculate total Dr and Cr from details
    this.totalDr = 0;
    this.totalCr = 0;

    this.detailsArray.controls.forEach(control => {
      const drCr = control.get('drCr')?.value;
      const amount = control.get('localAmount')?.value || 0;

      if (drCr === 'D') {
        this.totalDr += amount;
      } else if (drCr === 'C') {
        this.totalCr += amount;
      }
    });

    // Calculate total TDS
    this.totalTDS = 0;
    this.tdsArray.controls.forEach(control => {
      const tdsAmount = control.get('tdsAmount')?.value || 0;
      this.totalTDS += tdsAmount;
    });

    // Add TDS to Dr side
    this.totalDr += this.totalTDS;

    // Calculate net amount
    this.netAmount = this.totalDr - this.totalCr;
  }

  // ============================================
  // Tab Navigation
  // ============================================

  selectTab(tabId: string): void {
    this.selectedTab = tabId;
  }

  // ============================================
  // Form Submission
  // ============================================

  submit(): void {
    if (this.paymentForm.invalid) {
      this.appSettingsService.showError('Please fill all required fields');
      this.markFormGroupTouched(this.paymentForm);
      return;
    }

    // Validate Dr/Cr balance
    const validation = this.paymentService.validatePaymentAmounts(this.totalDr, this.totalCr);
    if (!validation.isValid) {
      this.appSettingsService.showError(validation.message || 'Dr and Cr amounts do not match');
      return;
    }

    const paymentRequest = this.buildPaymentRequest();

    this.isSaving = true;
    this.spinner.show();

    this.paymentService.createPayment(paymentRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          this.spinner.hide();
          this.appSettingsService.showSuccess(
            `Payment voucher ${response.VoucherNumber} created successfully`
          );

          // Show inter-branch JV numbers if created
          if (response.InterBranchJVs && response.InterBranchJVs.length > 0) {
            const jvNumbers = response.InterBranchJVs.map(jv => jv.JVNumber).join(', ');
            this.appSettingsService.showInfo(`Inter-branch JVs created: ${jvNumbers}`);
          }

          // Show exchange JV if created
          if (response.ExchangeJV) {
            this.appSettingsService.showInfo(
              `Exchange ${response.ExchangeJV.IsGain ? 'Gain' : 'Loss'} JV created: ${response.ExchangeJV.JVNumber}`
            );
          }

          this.goBack();
        },
        error: (error) => {
          console.error('Error creating payment:', error);
          this.isSaving = false;
          this.spinner.hide();
        }
      });
  }

  buildPaymentRequest(): CreatePaymentRequest {
    const formValue = this.paymentForm.getRawValue();

    const request: CreatePaymentRequest = {
      CompanyMasterSid: formValue.company?.CompanyMasterSid,
      BranchMasterSid: formValue.branch?.BranchMasterSid,
      VoucherDate: this.paymentService.formatDateForAPI(formValue.paymentDate),
      PaymentMode: formValue.paymentMode,
      BankLedgerMasterSid: formValue.bank?.SubledgerMasterSid,
      CurrencyMasterSid: formValue.currency?.CurrencyMasterSid,
      ExchangeRate: formValue.exchangeRate,
      VendorLedgerMasterSid: formValue.vendor?.SubledgerMasterSid,
      PaidTo: formValue.paidTo,
      Address: formValue.address,
      GSTNumber: formValue.gstNumber,
      Narration: formValue.narration,
      Remarks: formValue.remarks,
      InstrumentMode: formValue.instrumentMode,
      InstrumentNumber: formValue.instrumentNumber,
      InstrumentDate: formValue.instrumentDate ? this.paymentService.formatDateForAPI(formValue.instrumentDate) : undefined,
      ClearanceDate: formValue.clearanceDate ? this.paymentService.formatDateForAPI(formValue.clearanceDate) : undefined,
      IsMultiBranch: formValue.multiBranch,
      Details: this.buildDetailsList(formValue.details),
      TDSDetails: this.buildTDSList(formValue.tdsDetails),
      VoucherMatchings: this.buildMatchingsList(formValue.voucherMatchings),
      InterBranch: this.buildInterBranchList(formValue.interBranch)
    };

    return request;
  }

  buildDetailsList(details: any[]): PaymentDetail[] {
    return details.map(detail => ({
      ChargeMasterSid: detail.charge?.ChargeMasterSid,
      SACHSCode: detail.sacHSCode,
      LedgerMasterSid: detail.ledger?.SubledgerMasterSid,
      BranchMasterSid: detail.branch?.BranchMasterSid,
      DrCr: detail.drCr,
      CurrencyMasterSid: detail.currency?.CurrencyMasterSid,
      ExchangeRate: detail.exchangeRate,
      CurrencyAmount: detail.currencyAmount,
      TaxableAmount: detail.taxableAmount,
      TaxPercentage: detail.taxPercentage,
      TaxAmount: detail.taxAmount,
      LocalAmount: detail.localAmount,
      Narration: detail.narration,
      CostCenterSid: detail.costCenter?.CostCenterSid,
      ProfitCenterSid: detail.profitCenter?.ProfitCenterSid,
      MasterJobSid: detail.masterJob?.MasterJobSid,
      HouseJobSid: detail.houseJob?.HouseJobSid
    }));
  }

  buildTDSList(tdsDetails: any[]): PaymentTDS[] {
    return tdsDetails.map(tds => ({
      TDSSetRateSid: tds.tdsSet?.TDSSetRateSid,
      TDSCompanyType: tds.tdsCompanyType,
      ITSectionCode: tds.itSectionCode,
      CertificateNumber: tds.certificateNumber,
      TDSPercentage: tds.tdsPercentage,
      TaxableAmount: tds.taxableAmount,
      TDSAmount: tds.tdsAmount,
      Reason: tds.reason
    }));
  }

  buildMatchingsList(matchings: any[]): PaymentVoucherMatching[] {
    return matchings.map(matching => ({
      VoucherTransactionSid: matching.voucherTransactionSid,
      CurrencyAmount: matching.currencyAmount,
      LocalAmount: matching.localAmount,
      TDSAmount: matching.tdsAmount,
      Narration: `Payment against invoice ${matching.voucherNumber}`
    }));
  }

  buildInterBranchList(interBranch: any[]): PaymentInterBranch[] {
    return interBranch.map(ib => ({
      BranchMasterSid: ib.branch?.BranchMasterSid,
      CurrencyAmount: ib.currencyAmount,
      Narration: ib.narration
    }));
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // ============================================
  // Navigation
  // ============================================

  goBack(): void {
    this.router.navigate(['accounts/payment/list']);
  }

  cancel(): void {
    if (this.paymentForm.dirty) {
      if (confirm('You have unsaved changes. Do you want to discard them?')) {
        this.goBack();
      }
    } else {
      this.goBack();
    }
  }

  resetForm(): void {
    if (confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
      this.paymentForm.reset();
      this.initializeForm();
      this.outstandingInvoices = [];
      this.calculateTotals();
    }
  }

  // ============================================
  // Invoice Selection for Voucher Matching
  // ============================================

  toggleInvoiceSelection(invoice: VendorOutstandingInvoice): void {
    if (invoice.selected) {
      // Add invoice to voucher matchings
      const matchingGroup = this.fb.group({
        voucherTransactionSid: [invoice.VoucherTransactionSid],
        voucherNumber: [invoice.VoucherNumber],
        voucherDate: [invoice.VoucherDate],
        originalAmount: [invoice.OriginalAmount],
        outstandingAmount: [invoice.OutstandingAmount],
        matchingAmount: [invoice.OutstandingAmount],
        tdsAmount: [0],
        balance: [0]
      });

      this.setupMatchingRowCalculations(matchingGroup);
      this.voucherMatchingsArray.push(matchingGroup);
    } else {
      // Remove invoice from voucher matchings
      const index = this.voucherMatchingsArray.controls.findIndex(
        control => control.get('voucherTransactionSid')?.value === invoice.VoucherTransactionSid
      );
      if (index !== -1) {
        this.voucherMatchingsArray.removeAt(index);
      }
    }
  }
}
