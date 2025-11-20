import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { ToastrService } from 'ngx-toastr';
import { PaymentService } from '../../services/payment.service';
import { OutstandingService } from '../../services/outstanding.service';
import {
  OutstandingInvoice,
  PaymentMode,
} from '../../models/receipt.model';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { catchError, combineLatest, firstValueFrom, forkJoin, map, Observable, of, Subject, takeUntil } from 'rxjs';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { AccountsService } from '../../accounts.service';
import { ConfirmationDialogComponent } from 'src/app/component/confirmation-modal/confirmation-modal.component';
import { toNgbDateStruct } from 'src/app/common/helper';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ReceiptService } from '../../services/receipt.service';

/**
 * Payment Entry Component
 * Handles creation and editing of payment vouchers with:
 * - Invoice matching
 * - Advance payments
 * - TDS deduction
 * - Multi-currency
 * - Inter-branch payments with automatic JV
 */
@Component({
  selector: 'app-payment-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    FeatherModule,
    NgSelectComponent,
    NgxSpinnerModule,
    FormsModule,
    SearchableDropdown,
    DecimalPrecisionDirective,
    TextWithNumbersDirective,
    OnlyNumbersDirective,
    NgxSpinnerModule
  ],
  templateUrl: './payment-entry.component.html',
  styleUrl: './payment-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class PaymentEntryComponent implements OnInit {
  headerId: number;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  currentUserCountry: string;
  selectedTab = 'Detail';
  isSaving = false;
  isViewMode: boolean = false;
  isPosted : boolean = false;
  /**
 * Calculate local amount before round off the Currency Amount
 * 
 * Yes, then Multiply "No.of Unit" with "Per Unit Rate"  before round off 99.1881 x 14.7978 =	 
 * 
 * No, then	Multiply "No.of Unit" with "Per Unit Rate" then after round off  round( 99.1881,2) x 14.7978 
 */
  formatCurrencyAmountBeforeConcludingLocal: boolean = true;
  currentCompany: any;
  currentBranch: any;
  currentYearId: any;
  paymentData: any;
  userData: any;
  searchType: string = 'Party';
  selectedParty: any;
  filterText: any;
  matchingError: string | null = null;

  today = new Date();
  todayDateInNgbStruct = toNgbDateStruct(this.today);
  searchOutstandingForm!: FormGroup;
  paymentForm!: FormGroup;
  partyList: any[] = [];
  onlyCustomerList : any[] = [];
  currencyList: any[] = [];
  coaList: any[] = [];
  ledgerList: any[][] = [];
  bankTypedLedgers: any[] = [];
  cashTypeLedgers: any[] = [];
  costCenterList: any[] = [];
  profitCenterList: any[] = [];
  deptList: any[] = [];
  chargeList: any[] = [];
  filteredChargeList: any[][] = [];
  masterJobList: any[][] = [];
  houseJobList: any[][] = [];
  currentCompanyBranches: any[] = [];


  CustomerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  COALookupConfig = DROPDOWN_CONFIGS.COA_LEDGER;

  outstandingInvoices: OutstandingInvoice[] = [];
  selectedInvoices: OutstandingInvoice[] = [];
  paymentModes: { value: string; label: string }[] = [];

  // Outstanding invoices

  get isEditMode() { return !!this.headerId && !this.isViewMode; }

  @ViewChild('searchModal') searchModal!: TemplateRef<any>;



  // Tabs configuration
  tabs = [
    { name: 'Detail', icon: 'fas fa-address-card' },
    { name: 'Voucher Matching', icon: 'fas fa-code-branch' },
    // { name: 'Interbranch', icon: 'fas fa-flag-checkered' },
  ];

  CrDr = [
    { id: 1, name: "Cr", value: "C" },
    { id: 2, name: "Dr", value: "D" }
  ]
  public searchTypes = [
    { label: 'Party', value: 'Party' },
    { label: 'Vendor Invoice', value: 'Invoice' },
    // { label: 'House No.', value: 'HouseNo' },
    // { label: 'HBL No.', value: 'HBLNo' },
    // { label: 'Master No.', value: 'MasterNo' },
    // { label: 'MBL No.', value: 'MBLNo' },
    // { label: 'HAWB', value: 'HAWB' },
    // { label: 'MAWB', value: 'MAWB' }
  ];

  modalSearchType = [
    { id: 1, name: "House No" },
    { id: 2, name: "HBL No" },
    { id: 3, name: "Master No" },
    { id: 4, name: "MBL No" },
    { id: 5, name: "HAWB" },
    { id: 6, name: "MAWB" },
    { id: 7, name: "Party" },
    { id: 8, name: "Invoice" }
  ]

  allPendingCosts: any[] = [];
  selectedCosts: any[] = [];
  private destroy$ = new Subject<void>();


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private paymentService : PaymentService,
    private accountService : AccountsService,
    private appSettingService: AppSettingsService,
    private dropdownStore: DropdownStore,
    private currencyFormatService: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService,
    private spinner : NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.userData = this.appSettingService.getDecryptedUserProfile();

    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentUserCountry = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
    this.currentYearId = Number(localStorage.getItem('current-year-id'));
    this.getCurrentCompanyBranches();

    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;

    console.log("USER DATA", this.userData);
    console.log("CURRENT COMPANY", this.currentCompany);
    console.log("CURRENT BRANCH", this.currentBranch);
    console.log("CURRENT USER COUNTRY", this.currentUserCountry);
    console.log("CURRENT YEAR ID", this.currentYearId);

    this.initSearchOutstandingForm();
    this.initializeForm();
    this.loadPaymentModes();
    this.loadAllLookups();
    this.loadDetailLookups();

    // Check if editing existing payment
    const paymentId = this.route.snapshot.params['id'];
    if (paymentId) {
      this.headerId = Number(paymentId);
      this.loadPayment(this.headerId);
    } else {
      this.subscribeToPartyAndBankChanges();
    }
  }

  initSearchOutstandingForm() {
    this.searchOutstandingForm = this.fb.group({
      CompanyMasterSid: [this.currentCompany?.CompanyMasterSid, Validators.required],
      SearchType: ['Party', Validators.required],

      LedgerMasterSid: [null],
      CustomerName: [''],
      VendorInvoiceNumber: [''],
      HouseNumber: [''],

      FilterText: [''],   // generic input for all NON-Party searches
      IncludeFullyPaid: [false]
    });

    this.searchOutstandingForm.get('SearchType')?.valueChanges.subscribe(type => {
      this.clearSearchFields(type);
    });
  }

    /**
   * Initialize the payment form with validation
   */
  private initializeForm(): void {
    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    this.paymentForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }],  // Payment Number
      VoucherDate: [new Date()], // Payment Date
      MultiBranch: [{value : false, disabled: true}],
      CashOrBank: [false],
      BankCOA: [null, [Validators.required]], // Bank COA or Cash COA
      CurrencyMasterSid: [companyCurrency || null],
      CurrencyCode: ['INR'],
      ExchangeRate: [1, [Validators.required, Validators.min(0)]],

      // Party related info
      PartyMasterSid: [null, [Validators.required]],
      PartyName: [''],
      PartyAddress: [''],
      CustomerBranchSid: [null],
      COAMasterSid: [null, [Validators.required]],
      GST_VAT: [''],
      BankPartyName: [''],
      Narration: ['', [Validators.required]],
      Remarks: [''],
      InstrumentMode: [PaymentMode.NEFT, Validators.required],
      InstrumentNumber: ['', [Validators.required]],
      InstrumentDate: [null, [Validators.required]],
      ClearanceDate: [null],

      // Form arrays
      detailItems: this.fb.array([]), // charge detail formArray
      voucherMatchings: this.fb.array([]), // voucherMatching formArray
      interBranches: this.fb.array([]), // interBranch formArray
    });
    ['CashOrBank','InstrumentMode','InstrumentNumber','BankPartyName'].forEach(ctrl => {
      this.paymentForm.get(ctrl)?.valueChanges.subscribe(() => {
        this.updateDetailNarration();
      })
    })
    this.setupBillMatchingValidation()
  }

  
  /**
   * Setup form value change listeners
   */
  // private setupFormListeners(): void {
  //   // Recalculate TDS when percentage or amount changes
  //   this.paymentForm.get('TDSPercentage')?.valueChanges.subscribe(() => {
  //     this.calculateTDS();
  //   });

  //   this.paymentForm.get('TotalInvoiceAmount')?.valueChanges.subscribe(() => {
  //     this.calculateTDS();
  //     this.calculateNetAmount();
  //   });

  //   // Show/hide TDS fields
  //   this.paymentForm.get('HasTDS')?.valueChanges.subscribe((hasTDS) => {
  //     if (hasTDS) {
  //       this.paymentForm.get('TDSPercentage')?.setValidators([Validators.required, Validators.min(0)]);
  //       this.paymentForm.get('TDSLedgerMasterSid')?.setValidators([Validators.required]);
  //     } else {
  //       this.paymentForm.get('TDSPercentage')?.clearValidators();
  //       this.paymentForm.get('TDSLedgerMasterSid')?.clearValidators();
  //       this.paymentForm.patchValue({ TDSPercentage: 0, TDSAmount: 0 });
  //     }
  //     this.paymentForm.get('TDSPercentage')?.updateValueAndValidity();
  //     this.paymentForm.get('TDSLedgerMasterSid')?.updateValueAndValidity();
  //   });

  //   // Show/hide inter-branch fields
  //   this.paymentForm.get('IsInterBranch')?.valueChanges.subscribe((isInterBranch) => {
  //     if (isInterBranch) {
  //       this.paymentForm.get('ReceivingBranchMasterSid')?.setValidators([Validators.required]);
  //     } else {
  //       this.paymentForm.get('ReceivingBranchMasterSid')?.clearValidators();
  //     }
  //     this.paymentForm.get('ReceivingBranchMasterSid')?.updateValueAndValidity();
  //   });

  //   // Show cheque fields for cheque payment mode
  //   this.paymentForm.get('PaymentMode')?.valueChanges.subscribe((mode) => {
  //     if (mode === PaymentMode.CHEQUE) {
  //       this.paymentForm.get('ChequeNumber')?.setValidators([Validators.required]);
  //       this.paymentForm.get('ChequeDate')?.setValidators([Validators.required]);
  //     } else {
  //       this.paymentForm.get('ChequeNumber')?.clearValidators();
  //       this.paymentForm.get('ChequeDate')?.clearValidators();
  //     }
  //     this.paymentForm.get('ChequeNumber')?.updateValueAndValidity();
  //     this.paymentForm.get('ChequeDate')?.updateValueAndValidity();
  //   });
  // }

  loadAllLookups() {
    const filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid
    }
    forkJoin({
      parties: this.accountService.getAllCreditorWithCOAMapped(filterOption).pipe(catchError(err => of([]))),
      currencies: this.dropdownStore.loadCurrencies().pipe(catchError(err => of([]))),
      bankTypedLedgers: this.accountService.getAllLedgersByItsType({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        LedgerType: 'Bank'
      }).pipe(catchError(err => of([]))),
      cashTypeLedgers: this.accountService.getAllLedgersByItsType({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        LedgerType: 'Cash'
      }).pipe(catchError(err => of([]))),
    }).subscribe(({ parties, currencies, bankTypedLedgers, cashTypeLedgers }) => {
      this.partyList = parties.data;
      this.currencyList = (currencies || []).map(c => ({ ...c, countryName: c?.countryMaster?.countryName }));
      this.bankTypedLedgers = bankTypedLedgers.data;
      this.cashTypeLedgers = cashTypeLedgers.data;

      const companyCurrency = this.r['CurrencyMasterSid']?.value;
      this.setCurrencyCode(companyCurrency)

      this.currencyConfigService.initializeConfigurations(this.currencyList);
      console.log("CURRENCY CONFIG INITIALIZED", this.currencyConfigService.getAllCurrencyConfigs());


      const cusMap = new Map<number, any>();
      this.partyList.forEach(customer => {
        cusMap.set(customer.CustomerMasterSid, customer);
      });
      this.onlyCustomerList = Array.from(cusMap.values());
    })
  }

  loadDetailLookups() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const filterOption = {
      CompanyMasterSid,
      BranchMasterSid
    }
    forkJoin({
      coaWithLedgerCategoryAsLedger: this.accountService.getAllCoaWithLedgerCategory({
        LedgerCategory: 'Ledger',
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      }).pipe(catchError(err => of([]))),
      costCenters: this.accountService.getAllCostCenters().pipe(catchError(err => of([]))),
      profitCenters: this.accountService.getAllProfitCenters().pipe(catchError(err => of([]))),
      depts: this.dropdownStore.loadDepartments(filterOption).pipe(catchError(err => of([]))),
      charges: this.accountService.getAllCharges(this.currentCompany?.CompanyMasterSid).pipe(catchError(err => of([])))
    }).subscribe(({ coaWithLedgerCategoryAsLedger, costCenters, profitCenters, depts, charges }) => {
      this.coaList = coaWithLedgerCategoryAsLedger.data;
      this.costCenterList = costCenters.data;
      this.profitCenterList = profitCenters.data;
      this.deptList = depts
      this.chargeList = charges;
      this.filterChargeByDeptForAllRow();
    })
  }

  /**
 * Load payment modes
 */
  private loadPaymentModes(): void {
    this.paymentModes = this.paymentService.getInstrumentModes();
  }

  /**
   * Search outstanding invoices for customer
   */

  searchOutstanding() {
    const form = this.searchOutstandingForm.getRawValue();
    console.log("FormValue", form);
    let payload: any = {
      CompanyMasterSid: form.CompanyMasterSid,
      IncludeFullyPaid: form.IncludeFullyPaid
    };

    switch (form.SearchType) {
      case 'Party':
        payload.LedgerMasterSid = form.LedgerMasterSid;
        break;

      case 'Invoice':
        payload.VendorInvoiceNumber = form.FilterText;
        break;

      case 'HouseNo':
        payload.HouseNumber = form.FilterText;
        break;

      default:
        // For HBL, MBL, HAWB, MAWB, MasterNo etc.
        payload.VendorInvoiceNumber = form.FilterText;
    }

    console.log("Payload Sent:", payload);

    this.accountService.getPaymentOutstanding(payload).subscribe(
      res => {
        this.patchHeaderValue(res);
        this.patchOutstandingFormArray(res)
    });
  }

  patchHeaderValue(res: any) {
    console.log("RES",res);
    if(res.length > 0 && res[0].LedgerMasterSid && this.searchOutstandingForm.get('SearchType')?.value === "Invoice"){ 
      const party = this.partyList.find(p => p.SubledgerMasterSid === res[0].LedgerMasterSid);
      this.onPartyChange(party);
    } else if(
      res.length > 0 && this.searchOutstandingForm.get('SearchType')?.value === "Party" 
      && this.searchOutstandingForm.get('LedgerMasterSid')?.value
    ){
      const partyIdInSearch = this.searchOutstandingForm.get('LedgerMasterSid')?.value;
      const party = this.partyList.find(p => p.SubledgerMasterSid === partyIdInSearch);
      this.onPartyChange(party);
    }
  }


  
  /**
   * Save payment
   */
  // async savePayment(): Promise<void> {
  //   if (this.paymentForm.invalid) {
  //     this.toastr.warning('Please fill all required fields');
  //     this.markFormGroupTouched(this.paymentForm);
  //     return;
  //   }

  //   this.isSaving = true;

  //   try {
  //     const formValue = this.paymentForm.getRawValue();

  //     // Build payment details from vouchers
  //     const details: PaymentDetail[] = this.detailItems.controls.map((control) => ({
  //       VoucherTransactionSid: control.get('VoucherTransactionSid')?.value,
  //       Amount: control.get('MatchedAmount')?.value,
  //       Narration: control.get('Narration')?.value,
  //       IsAdvance: control.get('IsAdvance')?.value || false,
  //     }));

  //     // Add advance amount if any
  //     const advanceAmount = formValue.AdvanceAmount || 0;
  //     if (advanceAmount > 0) {
  //       details.push({
  //         Amount: advanceAmount,
  //         IsAdvance: true,
  //         Description: 'Advance payment',
  //       });
  //     }

  //     const createRequest: CreatePaymentRequest = {
  //       CompanyMasterSid: formValue.CompanyMasterSid,
  //       BranchMasterSid: formValue.BranchMasterSid,
  //       LedgerMasterSid: formValue.LedgerMasterSid,
  //       VoucherDate: this.paymentService.formatDateForAPI(formValue.VoucherDate),
  //       Narration: formValue.Narration,
  //       PaymentMode: formValue.PaymentMode,
  //       ChequeNumber: formValue.ChequeNumber,
  //       ChequeDate: formValue.ChequeDate ? this.paymentService.formatDateForAPI(formValue.ChequeDate) : undefined,
  //       BankName: formValue.BankName,
  //       TotalAmount: formValue.TotalInvoiceAmount,
  //       CurrencyMasterSid: formValue.CurrencyMasterSid,
  //       ExchangeRate: formValue.ExchangeRate,
  //       CurrencyAmount: formValue.TotalCurrencyAmount,
  //       HasTDS: formValue.HasTDS,
  //       TDSLedgerMasterSid: formValue.TDSLedgerMasterSid,
  //       TDSAmount: formValue.TDSAmount,
  //       TDSPercentage: formValue.TDSPercentage,
  //       Details: details,
  //       IsInterBranch: formValue.IsInterBranch,
  //       ReceivingBranchMasterSid: formValue.ReceivingBranchMasterSid,
  //       CreatedBy: 'current-user', // TODO: Get from auth service
  //     };

  //     const response = await this.paymentService.createPayment(createRequest).toPromise();

  //     this.toastr.success(`Payment ${response?.VoucherNumber} created successfully`);
  //     this.router.navigate(['/accounts/payment/list']);
  //   } catch (error: any) {
  //     console.error('Failed to save payment:', error);
  //     this.toastr.error(error.message || 'Failed to save payment');
  //   } finally {
  //     this.isSaving = false;
  //   }
  // }

  onSubmit(isPostingTrue?: boolean) {
    const formValue = this.paymentForm.getRawValue();
    const detailItems = this.detailItems.getRawValue();
    if (this.detailItems.length === 0) {
      this.appSettingService.showError('Please add at least one payment detail');
      return;
    }




    const hasPartyDetail = detailItems.some(d => d.LedgerMasterSid === formValue.LedgerMasterSid);
    if (formValue.LedgerMasterSid && !hasPartyDetail) {
      this.appSettingService.showError('Please add a party detail for the alloted ledger');
      return;
    }

    const hasBankDetail = detailItems.some(d => d.COAMasterSid === formValue.BankCOA);
    if (formValue.BankCOA && !hasBankDetail) {
      this.appSettingService.showError('Please add a bank detail for the alloted COA');
      return;
    }

    const totalDebit = detailItems.filter(d => d.DrCr === 'D')
      .reduce((sum, d) => sum + Number(d.LocalAmount || 0), 0);

    const totalCredit = detailItems.filter(d => d.DrCr === 'C')
      .reduce((sum, d) => sum + Number(d.LocalAmount || 0), 0);


    if (totalDebit !== totalCredit) {
      this.appSettingService.showError('Please make sure the sum of debit amounts and credit amounts are equal');
      return;
    }

    if (this.matchingError) {
      this.appSettingService.showError(this.matchingError);
      return;
    }

    if (this.paymentForm.invalid) {
      this; this.appSettingService.showError('Please fill all required fields');
      this.markFormGroupTouched(this.paymentForm);
      return;
    }
    this.isSaving = true;

    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const voucherMatching = this.voucherMatchings.getRawValue()
      .map((vm) => ({
        VoucherHeaderSid: vm.VoucherHeaderSid,
        VoucherDetailSid: vm.VoucherDetailSid,
        VoucherTransactionSid: vm.VoucherTransactionSid,
        VoucherType: vm.voucherType,
        CurrencyCode: vm.curr,
        ExchangeRate: vm.exRate || 1,
        DrCr: vm.drCr,
        Amount: vm.currAmt,
        LocalAmount: vm.localAmt,
        MatchingCurrency: vm.matchCurr,
        MatchingExRate: vm.matchExRate,
        MatchingAmount: vm.matchCurrAmt,
        MatchingLocalAmount: vm.matchLocalAmt,
        MatchingTDSAmount: vm.tdsAmt,
        tdsAmt: vm.tdsAmt,
      }));

    console.log("Only filled voucher matchings", voucherMatching);
    const totalTDSAmount = voucherMatching.reduce((acc, curr) => acc + curr.tdsAmt, 0);
    const totalAmount = voucherMatching.reduce((acc, curr) => acc + curr.MatchingAmount, 0);
    const totalLocalAmount = voucherMatching.reduce((acc, curr) => acc + curr.MatchingLocalAmount, 0);
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      CashOrBank: formValue.CashOrBank ? "C" : "B",
      MultiBranch: formValue.MultiBranch ? "Y" : "N",
      VoucherDate: formValue.VoucherDate,
      YearMasterSid: this.currentYearId,
      Narration: formValue.Narration,
      PartyMasterSid: formValue.PartyMasterSid,
      PartyName: formValue.PartyName,
      PartyAddress: formValue.PartyAddress,
      CustomerBranchSid: formValue.CustomerBranchSid,
      PlaceOfSupply: formValue.PlaceOfSupply,
      State: formValue.State,
      COAMasterSid: formValue.COAMasterSid,
      BankCOA: formValue.BankCOA,
      BankPartyName: formValue.BankPartyName,
      GST_VAT: formValue.GST_VAT,
      ReversalVoucher: formValue.ReversalVoucher,
      TaxNumber: formValue.TaxNumber,
      GSTType: formValue.GSTType,
      Remarks: formValue.Remarks,
      CurrencyMasterSid: formValue.CurrencyMasterSid,
      CurrencyCode: formValue.CurrencyCode,
      ExchangeRate: formValue.ExchangeRate,
      Amount: totalAmount,
      LocalAmount: totalLocalAmount,
      NetAmount: 0,
      TaxType: this.currentUserCountry === 'india' ? 'GST' : (this.currentUserCountry === 'united arab emirates' ? 'VAT' : ''),
      InstrumentMode: formValue.InstrumentMode,
      InstrumentNumber: formValue.InstrumentNumber,
      InstrumentDate: formValue.InstrumentDate,
      ClearanceDate: formValue.ClearanceDate,
      ...(isPostingTrue ? {
        PostStatus: 'P'
      } : {}),
      detailItems: detailItems.map(d => {
        const isBankRecord = d.COAMasterSid === formValue.BankCOA;
        return {
          ...d,
        }
      }),
      voucherMatching: voucherMatching,
      ...(this.isEditMode ? {
        UpdatedBy: currentUserEmail
      } : {
        CreatedBy: currentUserEmail
      })
    }

    console.log("PAYLOAD", payload);

    if (this.isEditMode) {
      this.accountService.updatePaymentById(this.headerId, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Payment updated successfully');
            const id = resp.data?.voucherHeader?.VoucherHeaderSid;
            this.loadPayment(this.headerId)
          } else {
            this.appSettingService.showError(resp.message);
          }
        }
      );
    } else {
      this.accountService.createPayment(payload).subscribe(
        async (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Payment created successfully');
            this.headerId = resp.data?.voucherHeader?.VoucherHeaderSid;
            this.appSettingService.showInfo(`Autoposting Payment : ${resp.data?.voucherHeader?.VoucherNumber}`)
            // await this.postVoucher();
            if (this.headerId) {
              this.router.navigate(['accounts/payment/entry', this.headerId]);
            }
          } else {
            this.appSettingService.showError(resp.message);
          }
        }
      )
    }
  }


  async postVoucher() {
    try {
      const voucherHeaderSid = this.headerId;
      const currentCompany = this.currentCompany;
      const currentBranch = this.currentBranch;
      const currentUserEmail = this.userData?.userEmail;
      const currentFinancialYear = Number(localStorage.getItem('current-year-id'));

      const currentCompanyCountry = Number(this.currentCompany?.CountryMasterSid);
      const currentCompanyCountryName = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      const currentCompanyState = Number(this.currentBranch?.StateMasterSid);

      const currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
      const customerBranchFromForm = Number(this.r['CustomerBranchSid']?.value);
      const customerState = this.partyList.find(c => c.CustomerBranchSid === customerBranchFromForm)?.StateMasterSid;


      let interOrIntra = 'Inter';
      // india
      if(currentCompanyCountryName === 'india'){
        if(currentCompanyState === customerState){
          interOrIntra = 'Inter';
        }
        else{
          interOrIntra = 'Intra';
        }
      }

      if (!voucherHeaderSid || !currentCompany || !currentBranch || !currentFinancialYear || !currentCompanyCountry || !currentCurrency) {
        throw new Error('Payment Id ,Company, branch, or financial year or country information is missing');
      }

      const postPayload = {
        VoucherHeaderSid: this.headerId,
        CompanyMasterSid: currentCompany.CompanyMasterSid,
        BranchMasterSid: currentBranch.BranchMasterSid,
        YearMasterSid: currentFinancialYear,
        LocalCurrencyMasterSid: currentCurrency,
        LocalCurrencyCode: currentCompany.CurrencyCode,
        PostedBy: currentUserEmail,
        TaxDetails: {
          CountryMasterSid: currentCompanyCountry,
          countryName: currentCompanyCountryName,
          TaxCategory: interOrIntra,
          EffectiveFrom: new Date().toISOString(),
          TaxType: 'Output'
        }
      };

      const result = await firstValueFrom(this.paymentService.postPayment(postPayload));

      this.spinner.hide();
      if (result.status) {
        this.appSettingService.showSuccess('Payment posted successfully!');
        this.paymentData.PostStatus = 'P';
      } else {
        this.appSettingService.showError(result.message || 'Failed to post payment.');
      }
    } catch (error) {
      this.spinner.hide();
      console.error('Post voucher error:', error);
    }
  }

  /**
 * Load existing payment for editing
 */
  loadPayment(paymentId: number) {
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherHeaderSid: paymentId
    }
    this.accountService.getPaymentById(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.patchValues(resp.data);
        } else {
          this.appSettingService.showError(resp.message);
        }
      }
    );
  }

  patchValues(response: any) {
    this.paymentData = response;
    const { VoucherDetail, VoucherTransaction, voucherMatchings, ...headerInfo } = response;
    this.paymentForm.patchValue({
      VoucherNumber: headerInfo.VoucherNumber,
      CashOrBank: headerInfo.CashOrBank === "C",
      MultiBranch: headerInfo.MultiBranch === "Y",
      VoucherDate: headerInfo.VoucherDate,
      BankCOA: headerInfo.BankCOA,
      CurrencyMasterSid: headerInfo.CurrencyMasterSid,
      CurrencyCode: headerInfo.CurrencyCode,
      ExchangeRate: headerInfo.ExchangeRate,
      PartyMasterSid: headerInfo.PartyMasterSid,
      PartyName: headerInfo.PartyName,
      PartyAddress: headerInfo.PartyAddress,
      CustomerBranchSid: headerInfo.CustomerBranchSid,
      COAMasterSid: headerInfo.COAMasterSid,
      GST_VAT: headerInfo.GST_VAT,
      BankPartyName: headerInfo.BankPartyName,
      Narration: headerInfo.Narration,
      Remarks: headerInfo.Remarks,
      InstrumentMode: headerInfo.InstrumentMode,
      InstrumentNumber: headerInfo.InstrumentNumber,
      InstrumentDate: headerInfo.InstrumentDate,
      ClearanceDate: headerInfo.ClearanceDate,
    })

    console.log("Header",this.paymentForm.value);
    
    const detailItems = response.VoucherDetail || [];
    detailItems.forEach((d, index) => {
      const detailRecord = {
        VoucherDetailSid: d.VoucherDetailSid,
        VoucherHeaderSid: d.VoucherHeaderSid,
        Sno: index + 1,
        Status: String(d.Status).charAt(0),
        COAMasterSid: d.COAMasterSid,
        LedgerMasterSid: d.LedgerMasterSid,
        DrCr: d.DrCr,
        CurrencyMasterSid: d.CurrencyMasterSid,
        CurrencyCode: d.CurrencyCode,
        ExchangeRate: d.ExchangeRate,
        NumberOfUnit: d.NumberOfUnit,
        Rate: d.Rate,
        Amount: d.Amount,
        LocalAmount: d.LocalAmount,
        Narration: d.Narration,
        CostCenter: d.CostCenter,
        ProfitCenter: d.ProfitCenter,
        DepartmentMasterSid: d.DepartmentMasterSid,
        ChargeMasterSid: d.ChargeMasterSid,
        ChargeDescription: d.ChargeDescription,
        HSSACMasterSid: d.HSSACMasterSid,
        ChargeUOMSid: d.ChargeUOMSid,
        HouseJobSid: d.HouseJobSid,
        MasterJobSid: d.MasterJobSid,
        YearMasterSid: d.YearMasterSid,
        VoucherTransactionSid: d.VoucherTransactionSid,
        CostRevenue: d.CostRevenue,
        TaxableAmount: d.TaxableAmount,
        TaxPercentage1: d.TaxPercentage1,
        TaxAmount1: d.TaxAmount1,
        TaxPercentage2: d.TaxPercentage2,
        TaxAmount2: d.TaxAmount2,
        InvoiceType: d.InvoiceType,
        Remarks: d.Remarks,
        PartyAmount: d.PartyAmount
      }

      this.addDetailRow(detailRecord);
      this.handleCOAChange({
        COAMasterSid: d.COAMasterSid,
        SubledgerName: d.LedgerMasterSid !== null ? 'Y' : 'N'
      }, index);
      const dept = this.deptList.find(dep => dep.DepartmentMasterSid === d.DepartmentMasterSid);
      this.filterDetailsWithDept(dept, index);
      this.onMasterJobChange(index, {
        MasterJobSid: d.MasterJobSid
      })
    })
    console.log("Detail",this.paymentForm.value);
    
    if(response.PostStatus === 'P'){
      this.paymentForm.disable();
    }

    // const voucherMatchingHeader = response.voucherMatchingHeader || [];
    // console.log("VOUCHER MATCHING HEADER", voucherMatchingHeader);
    const voucherMatchingRecords = response.voucherMatchings || [];
    console.log("VOUCHER MATCHING RECORDS", voucherMatchingRecords);
    this.patchOutstandingFormArray(voucherMatchingRecords);

  }

  /**
 * Reset form
 */
  resetForm(): void {
    this.paymentForm.reset();
    this.detailItems.clear();
    this.interBranches.clear();
    this.addInterBranch();
    this.selectedInvoices = [];
    this.outstandingInvoices = [];
  }

  /**
   * Navigate back to list
   */
  goBack(): void {
    history.back();
  }

  // Section-2 VoucherDetail Related

  get detailItems(): FormArray {
    return this.paymentForm.get('detailItems') as FormArray;
  }

  constructDetailItems(data?: any): FormGroup {
    const detailItem = this.fb.group({
      // Primary & audit fields
      VoucherDetailSid: [data?.VoucherDetailSid || 0],
      VoucherHeaderSid: [data?.VoucherHeaderSid || null],
      Sno: [data?.Sno || 1],
      Status: [data?.Status || 'A'],

      // Foreign keys
      COAMasterSid: [data?.COAMasterSid || null, [Validators.required]],
      LedgerMasterSid: [data?.LedgerMasterSid || null, [Validators.required]],
      DrCr: [data?.DrCr || 'D', Validators.required],
      CurrencyMasterSid: [data?.CurrencyMasterSid || null, Validators.required],
      CurrencyCode: [data?.CurrencyCode || 'INR', Validators.required],
      ExchangeRate: [data?.ExchangeRate || 1.000, Validators.required],
      NumberOfUnit: [data?.NumberOfUnit || 1.000],
      Rate: [data?.Rate || 1],
      Amount: [data?.Amount || 0.000, Validators.required],
      LocalAmount: [data?.LocalAmount || 0.000, Validators.required],

      Narration: [data?.Narration || ''],
      CostCenter: [data?.CostCenter || null],
      ProfitCenter: [data?.ProfitCenter || null],
      DepartmentMasterSid: [data?.DepartmentMasterSid || null],
      ChargeMasterSid: [data?.ChargeMasterSid || null],
      ChargeDescription: [data?.ChargeDescription || ''],
      HSSACMasterSid: [data?.HSSACMasterSid || null],
      ChargeUOMSid: [data?.ChargeUOMSid || null],
      HouseJobSid: [data?.HouseJobSid || null],
      MasterJobSid: [data?.MasterJobSid || null],


      YearMasterSid: [data?.YearMasterSid || null],
      VoucherTransactionSid: [data?.VoucherTransactionSid || null],

      // Transaction details
      CostRevenue: [data?.CostRevenue || ''],
      TaxableAmount: [data?.TaxableAmount || 0.000],
      TaxPercentage1: [data?.TaxPercentage1 || 0.00],
      TaxAmount1: [data?.TaxAmount1 || 0.000],
      TaxPercentage2: [data?.TaxPercentage2 || 0.00],
      TaxAmount2: [data?.TaxAmount2 || 0.000],
      InvoiceType: [data?.InvoiceType || ''],
      Remarks: [data?.Remarks || ''],
      PartyAmount: [data?.PartyAmount || 0.000],

      // Relational objects (used for dropdowns or display)
      coaMaster: [data?.coaMaster || null],              // COA reference
      chargeMaster: [data?.chargeMaster || null],        // Charge reference
      currencyMaster: [data?.currencyMaster || null],    // Currency reference
      departmentMaster: [data?.departmentMaster || null],
      hSSACMaster: [data?.hSSACMaster || null],
      houseJob: [data?.houseJob || null],
      masterJob: [data?.masterJob || null],
      CostCenterMaster: [data?.CostCenterMaster || null],
      ProfitCenterMaster: [data?.ProfitCenterMaster || null],
      VoucherHeader: [data?.VoucherHeader || null],
      voucherTransaction: [data?.voucherTransaction || null],
      yearMaster: [data?.yearMaster || null],
    });
    return detailItem;
  }

  addDetailRow(data?: any) {
    const newRow = this.constructDetailItems(data);
    this.detailItems.push(newRow);
    const lastAddedRow = this.detailItems.length - 1;
    const localAmountTriggeringCtrls = ['Amount', 'ExchangeRate'];
    localAmountTriggeringCtrls.forEach(ctrl => {
      newRow.get(ctrl)?.valueChanges.subscribe(() => {
        this.calculateLocalAmount(lastAddedRow);
      });
    });
  }

  removeDetail(detailIndex: number, VoucherDetailSid?: number) {

    // Case 1 : Row has VoucherDetailSid → call API first
    if (VoucherDetailSid) {
      this.accountService.softDeleteVoucherDetail(VoucherDetailSid).subscribe({
        next: (res) => {
          // On success, remove row from form array
          (this.detailItems as FormArray).removeAt(detailIndex);
        },
        error: (err) => {
          console.error('Error deleting voucher detail:', err);
        }
      });
    }
    // Case 2 : New row (no VoucherDetailSid) → directly remove it
    else {
      (this.detailItems as FormArray).removeAt(detailIndex);
    }
  }

  private subscribeToPartyAndBankChanges(): void {
    combineLatest([
      this.paymentForm.get('CustomerBranchSid').valueChanges,
      this.paymentForm.get('BankCOA').valueChanges
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([partySid, bankCoaSid]) => {
      // Check if both are selected and if the details grid is empty
      if (partySid && bankCoaSid) {
        this.populateInitialDetailRows(partySid, bankCoaSid);
      }
    });
  }

  private populateInitialDetailRows(partySid: number, bankCoaSid: number): void {
    this.detailItems.clear();
    console.log("Selected ITEMS", {
      SelectedPartyId: partySid,
      SelectedBankCoaId: bankCoaSid
    })
    // 1. Find the selected bank/cash ledger
    const isCashMode = this.paymentForm.get('CashOrBank')?.value;
    const bankLedgerSource = isCashMode ? this.cashTypeLedgers : this.bankTypedLedgers;
    const bankLedger = bankLedgerSource.find(ledger => ledger.COAMasterSid === bankCoaSid);

    // 2. Find the selected party ledger
    const partyLedger = this.partyList.find(p => p.CustomerBranchSid === partySid);

    console.log("Selected Full ITEMS", {
      SelectedParty: partyLedger,
      SelectedBank: bankLedger
    })

    if (!bankLedger || !partyLedger) {
      console.error('Could not find the selected bank or party ledger details.');
      return;
    }
    const outstandingCurrencyAmount = this.getTotalOSCurrAmt();
    // 3. Create the Party Row (Credit)
    const partyData = {
      Sno: 1,
      COAMasterSid: partyLedger.COAMappedId,
      LedgerMasterSid: partyLedger.SubledgerMasterSid,
      DrCr: 'D',
      CurrencyMasterSid: this.r['CurrencyMasterSid']?.value,
      ExchangeRate: this.r['ExchangeRate']?.value,
      Amount : outstandingCurrencyAmount,
    }
    console.log("PartyData", partyData);
    this.addDetailRow(partyData);
    this.fetchLedgerForCOA(partyLedger, 0);
    this.calculateLocalAmount(0);

    // 4. Create the Bank Row (Debit)
    const bankData = {
      Sno: 2,
      COAMasterSid: bankLedger.COAMasterSid,
      LedgerMasterSid: bankLedger.LedgerMasterSid,
      DrCr: 'C',
      CurrencyMasterSid: this.r['CurrencyMasterSid']?.value,
      ExchangeRate: this.r['ExchangeRate']?.value,
      Amount : outstandingCurrencyAmount,
    }
    console.log("BankData", bankData);
    this.addDetailRow(bankData);
    this.fetchLedgerForCOA(bankLedger, 1);
    this.calculateLocalAmount(1);

    this.updateDetailNarration();
  }

   handleCOAChange(coa: any, detailIndex: number) {
    console.log("Handle COA Change", coa);
    if (!coa) {
      this.detailItems.at(detailIndex).get('LedgerMasterSid')?.setValue(null);
      return;
    }
    this.fetchLedgerForCOA(coa, detailIndex);
  }

  /**
   * Update the narration for the party detail
   * eg Party row -  Being Bank Transfer Recd. NEFT 7887
   * Bank row - Being NEFT 7887 from KRS Logistics
   */
  updateDetailNarration(){


    const allDetails = this.detailItems.getRawValue();
    let partyDetailIndex = allDetails.findIndex(d => d.LedgerMasterSid === this.r['PartyMasterSid']?.value);
    let bankDetailIndex = allDetails.findIndex(d => d.COAMasterSid === this.r['BankCOA']?.value);
    const partyCtrl = this.detailItems.at(partyDetailIndex) as FormGroup;
    const bankCtrl = this.detailItems.at(bankDetailIndex) as FormGroup;
    if(partyDetailIndex === -1) partyCtrl?.setValue(null);
    if(bankDetailIndex === -1) bankCtrl?.setValue(null);
    

    const cashOrBank = this.r['CashOrBank']?.value ? "Cash" : "Bank"
    console.log(cashOrBank);
    const instrumentMode = this.r['InstrumentMode']?.value;
    const instrumentNumber = this.r['InstrumentNumber']?.value;
    const bankPartyName = this.r['BankPartyName']?.value;

    partyCtrl?.patchValue({
      Narration : cashOrBank === "Bank" ?
      `Being Bank Transfer Recd. ${instrumentMode} ${instrumentNumber}` :
      `Being Cash Transfer Recd.`
    })

    bankCtrl?.patchValue({
      Narration : cashOrBank === "Bank" ?
      `Being ${instrumentMode} ${instrumentNumber} from ${bankPartyName}` :
      `Being Cash Transfer Recd.`
    })
    
  }

  fetchLedgerForCOA(coa: any, detailIndex: number) {
    const ledgerCtrl = (this.detailItems.at(detailIndex) as FormGroup).get('LedgerMasterSid');
    if (coa.SubledgerName === 'Y') {
      ledgerCtrl.enable();
      ledgerCtrl.setValidators([Validators.required]);
      this.accountService.getLedgerByCOAMasterSid({
        COAMasterSid: coa.COAMappedId || coa.COAMasterSid,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        DrCr : 'C'
      }).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.ledgerList[detailIndex] = resp.data || [];
            const currentValue = ledgerCtrl.getRawValue();
            const exist = this.ledgerList[detailIndex].find(l => l.SubledgerMasterSid === currentValue);
            if (exist) {
              ledgerCtrl.setValue(exist.SubledgerMasterSid);
            } else {
              ledgerCtrl.setValue(null);
            }
          } else {
            this.appSettingService.showError('Error fetching ledger for COA');
          }
        }
      )
    } else {
      ledgerCtrl.disable();
      ledgerCtrl.clearValidators();
    }
    console.log("LEDGER CTRL STATE", ledgerCtrl.enabled)
  }

  onCurrencyChangeForEachRow(selected: any, index: number) {
    const row = this.detailItems.at(index) as FormGroup;
    if (!selected || selected === undefined) {
      row.get('CurrencyCode')?.setValue('');
      row.get('ExchangeRate')?.setValue('');
      return;
    }
    row.get('CurrencyCode')?.setValue(selected.currencyCode);
    this.patchCurrencyExchangeRateForDetail(selected.CurrencyMasterSid, index);
    this.calculateLocalAmount(index);
  }

  patchCurrencyExchangeRateForDetail(currencySid: number, detailIndex: number) {
    this.getExchangeRate(currencySid).subscribe(
      (resp: any) => {
        const row = this.detailItems.at(detailIndex) as FormGroup;
        const currencyCode = this.currencyList.find(c => c.CurrencyMasterSid === currencySid)?.currencyCode;
        row.get('ExchangeRate')?.setValue(this.getFormattedExchangeRate(Number(resp) || 1, currencySid).toFixed(this.getExchangeRateDecimalPlaces(currencyCode)));
      }
    )
  }

  onChargeChange(detailIndex: number, charge: any) {
    const row = this.detailItems.at(detailIndex) as FormGroup;
    if (!charge) {
      row.patchValue({
        ChargeDescription: '',
        HSSACMasterSid: null,
        ChargeUOMSid: null,
      });
      return;
    }
    row.patchValue({
      ChargeDescription: charge.chargeName,
      HSSACMasterSid: charge.HSSACMasterSid || null,
      ChargeUOMSid: charge.UOM,
    })
  }

  filterDetailsWithDept(dept: any, detailIndex: number) {
    if (!dept) {
      const row = this.detailItems.at(detailIndex) as FormGroup;
      row.patchValue({
        ChargeDescription: '',
        HSSACMasterSid: null,
        ChargeUOMSid: null,
        MasterJobSid: null,
        HouseJobSid: null,
      });
      this.filteredChargeList[detailIndex] = [];
      this.masterJobList[detailIndex] = [];
      this.houseJobList[detailIndex] = [];
      return;
    }
    this.filterChargeByDeptForARow(dept, detailIndex);
    this.accountService.getMasterJobByDepartment({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentMasterSid: dept?.DepartmentMasterSid
    }).subscribe({
      next: (resp: any) => {
        this.masterJobList[detailIndex] = resp;
      },
      error: (err) => {
        console.error('Failed to load master jobs:', err);
      }
    });
  }

  onMasterJobChange(detailIndex: number, masterJob: any) {
    if (!masterJob || !masterJob.MasterJobSid) {
      this.houseJobList[detailIndex] = [];
      return;
    }
    this.accountService.getHouseJobByMasterJob({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MasterJobSid: masterJob?.MasterJobSid
    }).subscribe({
      next: (resp: any) => {
        this.houseJobList[detailIndex] = resp;
      },
      error: (err) => {
        console.error('Failed to load house jobs:', err);
      }
    });
  }

  filterChargeByDeptForAllRow() {
    this.detailItems.controls.forEach((group: FormGroup, index) => {
      const deptId = group.get('DepartmentMasterSid')?.value;
      const department = this.deptList.find(dept => dept.DepartmentMasterSid === deptId);
      console.log("FILTER CHARGE BY DEPT FOR ALL ROW", {
        deptId: deptId,
        deptObj: department,
        deptList: this.deptList
      });
      if (department) {
        this.filterChargeByDeptForARow(department, index);
      }
    })
  }

  filterChargeByDeptForARow(dept, rowIndex) {
    console.log(`Filtering Dept from row ${rowIndex}`, {
      department: dept,
      chargeList: this.chargeList
    });
    const departmentName = dept.departmentName;
    this.filteredChargeList[rowIndex] = (this.chargeList || []).filter(charge => {
      const allDepartmentNames = charge.DepartmentMasterSid || [];
      return allDepartmentNames.includes(departmentName);
    })
  }

  // Section-3 Voucher Matching Related

  get voucherMatchings(): FormArray {
    return this.paymentForm.get('voucherMatchings') as FormArray;
  }

  patchOutstandingFormArray(transactions: any[]) {
    this.voucherMatchings.clear();

    const currencyInHeader = this.r['CurrencyMasterSid']?.value;
    const exchangeRateInHeader = this.r['ExchangeRate']?.value;
    const searchType = this.searchOutstandingForm.get('SearchType')?.value;

    transactions.forEach(tx => {
      console.log("Transaction",tx)
      const isMatchedRecord = !!tx.VoucherMatchingSid;  // <–– detect matched data

      const form = this.fb.group({
        VoucherMatchingHeaderSid : [tx.VoucherMatchingHeaderSid || null],
        VoucherMatchingSid: [tx.VoucherMatchingSid || null],
        VoucherTransactionSid: [tx.VoucherTransactionSid],
        VoucherHeaderSid: [tx.VoucherHeaderSid],
        VoucherDetailSid: [tx.VoucherDetailSid],
        LedgerMasterSid: [tx.LedgerMasterSid],
        COAMasterSid: [tx.COAMasterSid],

        // Voucher Info
        voucherNo: [tx.VoucherHeader?.VoucherNumber || tx.VoucherNumber || tx.voucherNo],
        voucherTypeMasterSid: [tx.VoucherTypeMasterSid],
        voucherType: [tx.VoucherHeader?.voucherTypeMaster?.DocumentTypeName || tx.VoucherType],
        voucherDate: [new Date(tx.VoucherHeader?.VoucherDate || tx.VoucherDate)],
        drCr: [tx.DrCr === "C" ? "Cr" : "Dr"],

        // System amounts
        curr: [tx.CurrencyCode],
        currAmt: [tx.OriginalCurrencyAmount],
        localAmt: [tx.OriginalLocalAmount],

        osCurrAmt: [tx.OutstandingCurrencyAmount],
        osLocalAmt: [tx.OutstandingLocalAmount],

        exRate: [tx.ExchangeRate || 1],

        // Matching values (either blank or existing)
        matchCurr: [
          isMatchedRecord ? tx.MatchingCurrency : currencyInHeader
        ],
        matchExRate: [
          isMatchedRecord ? tx.MatchingExRate : (exchangeRateInHeader || 1)
        ],
        matchCurrAmt: [
          isMatchedRecord ? tx.MatchingAmount : (searchType === "Invoice" && !this.isEditMode ? tx.OutstandingCurrencyAmount : null )
        ],
        matchLocalAmt: [
          isMatchedRecord ? tx.MatchingLocalAmount : (searchType === "Invoice" && !this.isEditMode ? tx.OutstandingLocalAmount : null )
        ],
        tdsAmt: [
          isMatchedRecord ? tx.MatchingTDSAmount ?? null : null
        ],

        balance: [
          isMatchedRecord ? (tx.OutstandingLocalAmount - tx.LocalAmount) : null
        ]
      });

      // Disable fields
      [
        'voucherNo', 'voucherType', 'voucherDate', 'drCr',
        'curr', 'exRate', 'currAmt', 'localAmt', 'osCurrAmt', 'osLocalAmt',
        'balance'
      ].forEach(field => form.get(field)?.disable());
      form.get('matchLocalAmt').valueChanges.subscribe(val => {
        const osLocalAmt = form.get('osLocalAmt')?.value;
        const balance = Number(osLocalAmt-val).toFixed(2);
        form.get('balance')?.setValue(Number(balance));
      });
      this.voucherMatchings.push(form);
    });

    console.log("Unified FormArray →", this.voucherMatchings.getRawValue());
  }


  patchExchangeRateForMatchRow(index: number) {
    const row = this.voucherMatchings.at(index) as FormGroup;
    const curr = row.get('matchCurr')?.value;
    this.getExchangeRate(curr).subscribe(rate => {
      row.get('matchExRate')?.setValue(rate);
    })
    this.calculateLocalAmountForMatchRow(index);
  }



  calculateLocalAmountForMatchRow(index: number) {
    const row = this.voucherMatchings.at(index) as FormGroup;
    const amount = Number(row.get('matchCurrAmt')?.value);
    const exchangeRate = Number(row.get('matchExRate')?.value);
    const formattedExchangeRate = this.getFormattedExchangeRate(exchangeRate, row.get('matchCurr')?.value);
    const formattedAmount = this.getFormattedAmount(amount, row.get('matchCurr')?.value);

    let finalAmount;
    if (this.formatCurrencyAmountBeforeConcludingLocal) {
      finalAmount = Number(formattedAmount) * Number(formattedExchangeRate);
    } else {
      finalAmount = Number(amount) * Number(formattedExchangeRate);
    }
    row.get('matchLocalAmt')?.setValue(this.getFormattedAmount(finalAmount, row.get('matchCurr')?.value));
  }

  
  /**
   * Remove voucher matching row
   */
  removeVoucher(index: number): void {
    this.detailItems.removeAt(index);
    this.recalculateTotalAmount();
  }

  getTotalCurrAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('currAmt')?.value || 0), 0).toFixed(2);
  }

  getTotalLocalAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('localAmt')?.value || 0), 0).toFixed(2);
  }

  getTotalOSCurrAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('osCurrAmt')?.value || 0), 0).toFixed(2);
  }

  getTotalOSLocalAmount() {
    return this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('osLocalAmt')?.value || 0), 0).toFixed(2);
  }

  getTotalMatchCurrAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('matchCurrAmt')?.value || 0), 0).toFixed(2);
  }

  getTotalMatchLocalAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('matchLocalAmt')?.value || 0), 0).toFixed(2);
  }

  getTotalTdsAmt() {
    return (this.voucherMatchings.controls
      .reduce((total, control) => total + Number(control.get('tdsAmt')?.value || 0), 0).toFixed(2));
  }

  /**
 * Select invoices from outstanding modal
 */
  applySelectedInvoices(): void {
    const selectedInvoices = this.outstandingInvoices.filter((inv) => inv.selected);

    if (selectedInvoices.length === 0) {
      this.toastr.warning('Please select at least one invoice');
      return;
    }

    // Clear existing vouchers
    this.detailItems.clear();

    // Add selected invoices to vouchers
    selectedInvoices.forEach((invoice) => {
      const amountToApply = invoice.amountToApply || invoice.OutstandingAmount;

      this.detailItems.push(
        this.fb.group({
          VoucherTransactionSid: [invoice.VoucherTransactionSid],
          VoucherNumber: [invoice.VoucherNumber],
          VoucherType: [invoice.VoucherType],
          VoucherDate: [invoice.VoucherDate],
          OriginalAmount: [invoice.OriginalAmount],
          OutstandingAmount: [invoice.OutstandingAmount],
          MatchedAmount: [amountToApply, [Validators.required, Validators.min(0)]],
          CurrencyCode: [invoice.CurrencyCode],
          DrCr: [invoice.DrCr],
          Narration: [''],
          IsAdvance: [false],
        }),
      );
    });

    this.recalculateTotalAmount();
    this.modalService.dismissAll();
    this.toastr.success(`${selectedInvoices.length} invoice(s) added`);
  }


  // Section-4 Helper
  getCurrentCompanyBranches() {
    const currentCompanyId = this.currentCompany?.CompanyMasterSid;
    const currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === currentCompanyId).companyMaster);
    this.currentCompanyBranches = (currentCompany?.userBranchMaster || []).map(ubm => ubm.branchMaster);
    console.log(this.currentCompanyBranches);
  }


  get r(): { [key: string]: AbstractControl } {
    return this.paymentForm.controls || {}
  }

  get interBranches(): FormArray {
    return this.paymentForm.get('interBranches') as FormArray;
  }

  /**
   * Add inter-branch row
   */
  addInterBranch(): void {
    this.interBranches.push(
      this.fb.group({
        BranchMasterSid: [null, Validators.required],
        BranchName: [''],
        Amount: [0, [Validators.required, Validators.min(0)]],
        InterBranchJV: [''],
        VoucherType: [''],
      }),
    );
  }

  /**
   * Remove inter-branch row
   */
  removeInterBranch(index: number): void {
    this.interBranches.removeAt(index);
  }

  /**
   * Tab selection
   */
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }

  /**
   * Open outstanding modal
   */
  openDubaiModal(content: any): void {
    this.modalService.open(content, { centered: true, size: 'xl' });
  }







  // async searchOutstanding(modal?: any): Promise<void> {
  //   const customerSid = this.paymentForm.get('LedgerMasterSid')?.value;
  //   if (!customerSid) {
  //     this.toastr.warning('Please select a customer first');
  //     return;
  //   }

  //   try {
  //     // Use payment service which calls outstanding service
  //     const invoices = await this.paymentService.getCustomerOutstanding(this.CompanyMasterSid, customerSid).toPromise();

  //     if (invoices && invoices.length > 0) {
  //       this.outstandingInvoices = invoices;
  //       this.modalService.open(modal, { size: 'xl', backdrop: 'static' });
  //     } else {
  //       this.toastr.info('No outstanding invoices found for this customer');
  //     }
  //   } catch (error: any) {
  //     console.error('Failed to fetch outstanding:', error);
  //     this.toastr.error(error.message || 'Failed to fetch outstanding invoices');
  //   }
  // }



  /**
   * Calculate total invoice amount from vouchers
   */
  recalculateTotalAmount(): void {
    let total = 0;
    this.detailItems.controls.forEach((control) => {
      const matchedAmount = control.get('MatchedAmount')?.value || 0;
      total += matchedAmount;
    });

    this.paymentForm.patchValue({
      TotalInvoiceAmount: total,
    });
  }

  /**
   * Calculate TDS amount
   */
  calculateTDS(): void {
    const hasTDS = this.paymentForm.get('HasTDS')?.value;
    if (!hasTDS) {
      this.paymentForm.patchValue({ TDSAmount: 0 });
      return;
    }

    const totalAmount = this.paymentForm.get('TotalInvoiceAmount')?.value || 0;
    const tdsPercentage = this.paymentForm.get('TDSPercentage')?.value || 0;

    const tdsAmount = this.paymentService.calculateTDS(totalAmount, tdsPercentage);
    this.paymentForm.patchValue({ TDSAmount: tdsAmount });
  }

  /**
   * Mark all form controls as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.paymentForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  onCurrencyChange(selected: any) {
    if (!selected) {
      this.paymentForm.patchValue({
        CurrencyCode: null
      })
      return;
    } else {
      this.paymentForm.patchValue({
        CurrencyCode: selected.currencyCode
      })
    }
    this.patchCurrencyExchangeRate();
  }

  patchCurrencyExchangeRate() {
    const currencySid = this.paymentForm.get('CurrencyMasterSid')?.value;
    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    console.log('Entered patchCurrencyExchangeRate', {
      FromCurrencyId: currencySid,
      toCurrencyId: companyCurrency
    });

    if (currencySid === companyCurrency && currencySid !== null) {
      this.paymentForm.patchValue({
        ExchangeRate: 1
      })
      return;
    }

    const fromCurrencyCode = this.paymentForm.get('CurrencyCode')?.value;
    const toCurrencyCode = this.currencyList.find(c => c.CurrencyMasterSid === companyCurrency)?.currencyCode;
    if (!fromCurrencyCode || !toCurrencyCode) {
      return;
    }
    console.log('FINDING CURRENCY EXCHANGE', {
      fromCurrencyCode: fromCurrencyCode,
      toCurrencyCode: toCurrencyCode
    })
    const payload = {
      fromCurrencyCode,
      toCurrencyCode,
      segment: 'revenue'
    };
    this.accountService.getExchangeRate(payload).subscribe(
      (resp: any) => {
        if (resp?.status && resp.data) {
          console.log('PATCHING EXCHANGE RATE', resp.data);
          this.paymentForm.patchValue({
            ExchangeRate: resp.data
          })
        }
      }
    )
  }

  onPartyChange(party: any) {
    console.log("Selected Party", party);
    this.errorLogger();
    if (!party) {
      this.paymentForm.patchValue({
        PartyMasterSid: null,
        PartyName: '',
        PartyAddress: '',
        CustomerBranchSid: null,
        COAMasterSid: null,
        LedgerMasterSid: null,
        GST_VAT: ''
      })
      return;
    }
    this.paymentForm.patchValue({
      PartyMasterSid: party.SubledgerMasterSid,
      PartyName: party.CustomerName,
      PartyAddress: party.Address,
      CustomerBranchSid: party.CustomerBranchSid,
      COAMasterSid: party.COAMappedId,
      LedgerMasterSid: party.SubledgerMasterSid,
      GST_VAT: party.GSTNo
    })
    if (!this.r['BankPartyName']?.value) {
      this.r['BankPartyName']?.setValue(party.CustomerName);
    }
    console.log("FORM VALUE AFTER CUSTOMER SELECTED", this.paymentForm.value);
  }

  // openSearchModal() {
  //   if (!this.searchModal) {
  //     this.appSettingService.showError('Search modal template not found');
  //     return;
  //   }

  //   this.searchType = 'House No';
  //   this.searchValue = '';
  //   this.allPendingCosts = [];
  //   this.selectedCosts = [];

  //   this.modalService.open(this.searchModal, {
  //     size: 'lg',
  //     backdrop: 'static',
  //     keyboard: false
  //   });
  // }
  // closeSearchModal() {
  //   this.modalService.dismissAll();
  //   this.selectedCosts = [];
  // }

  toggleMultiBranch(event: any): void {
    const ctrl = this.paymentForm.get('MultiBranch');
    const element = event.target as HTMLInputElement;
    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      element.checked = !element.checked;
    }
    ctrl.setValue(element.checked);
    if (element.checked) {
      // Only add interBranch tab if not already present
      if (!this.tabs.find(t => t.name === 'Interbranch')) {
        this.tabs.push({ name: 'Interbranch', icon: 'fas fa-flag-checkered' });
      }
      // Do not auto-populate interBranches; only add rows when user clicks "Add"
    } else {
      // Remove interBranch tab and clear form array
      this.tabs = this.tabs.filter(t => t.name !== 'Interbranch');
      this.interBranches.clear();
    }
  }



  toggleCashOrBank(event: any) {
    const element = event.target as HTMLInputElement;
    const ctrl = this.paymentForm.get('CashOrBank');
    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      element.checked = !element.checked;
      console.log("KEYBOARD EVENT TRIGGERED", {
        isCheckBoxTicked: element.checked,
        prevValue: ctrl.value,
        newValue: !ctrl.value
      })
    }
    else if (event instanceof PointerEvent) {
      console.log("POINTER EVENT TRIGGERED", {
        isCheckBoxTicked: element.checked,
        prevValue: ctrl.value,
        newValue: !ctrl.value
      })
    }
    this.r['BankCOA']?.setValue(null);
    ctrl.setValue(element.checked);

    if(element.checked){
      this.paymentForm.patchValue({
        InstrumentMode : null,
        InstrumentNumber : '',
        InstrumentDate : null,
        ClearanceDate : null
      })
    }
  }

 

  getExchangeRate(currency: number | string): Observable<number> {
    if (!currency) {
      return of(1);
    }

    if (typeof currency === 'string') {
      currency = this.currencyList.find(curr => curr.currencyCode === currency)?.CurrencyMasterSid;
    }
    const fromCurrencyId = currency as number;
    const toCurrencyId = this.currentCompany?.CurrencyMasterSid;

    console.log("CURRENCY EXCHANGE IDS", { fromCurrencyId, toCurrencyId });

    if (fromCurrencyId === toCurrencyId) {
      console.log("SAME CURRENCY FOUND ON EXCHANGE RATE");
      return of(this.getFormattedExchangeRate(1, fromCurrencyId));
    }

    const fromCurrencyCode = this.currencyList.find(curr => curr.CurrencyMasterSid === fromCurrencyId)?.currencyCode;
    const toCurrencyCode = this.currencyList.find(curr => curr.CurrencyMasterSid === toCurrencyId)?.currencyCode;

    console.log("CURRENCY EXCHANGE CODES", { fromCurrencyCode, toCurrencyCode });

    if (!fromCurrencyCode || !toCurrencyCode) {
      console.log("NO CURRENCY CODE FOUND ON EXCHANGE RATE DEFAULTING TO 1");
      return of(this.getFormattedExchangeRate(1, fromCurrencyId));
    }

    const payload = {
      fromCurrencyCode,
      toCurrencyCode,
      segment: 'sale'
    };

    return this.accountService.getExchangeRate(payload).pipe(
      map((resp: any) => {
        if (resp.status && resp.data != null) {
          console.log("EXCHANGE RATE FOUND", resp.data);
          return this.getFormattedExchangeRate(resp.data, fromCurrencyId);
        } else {
          console.log("Exchange rate not found, defaulting to 1");
          return this.getFormattedExchangeRate(1, fromCurrencyId);
        }
      }),
      catchError((err) => {
        console.error("Error fetching exchange rate", err);
        return of(this.getFormattedExchangeRate(1, fromCurrencyId));
      })
    );
  }


  calculateLocalAmount(index: number) {
    const row = this.detailItems.at(index) as FormGroup;
    const amount = Number(row.get('Amount')?.value);
    const exchangeRate = Number(row.get('ExchangeRate')?.value);
    const formattedExchangeRate = this.getFormattedExchangeRate(exchangeRate, row.get('CurrencyMasterSid')?.value);
    const formattedAmount = this.getFormattedAmount(amount, row.get('CurrencyMasterSid')?.value);

    let finalAmount;
    if (this.formatCurrencyAmountBeforeConcludingLocal) {
      finalAmount = Number(formattedAmount) * Number(formattedExchangeRate);
    } else {
      finalAmount = Number(amount) * Number(formattedExchangeRate);
    }
    row.get('LocalAmount')?.setValue(this.getFormattedAmount(finalAmount, row.get('CurrencyMasterSid')?.value));
  }

  setCurrencyCode(CurrencyMasterSid: number) {
    if(!CurrencyMasterSid || this.currencyList.length === 0) return;
    const code = this.currencyList.find(c => c.CurrencyMasterSid === CurrencyMasterSid)?.currencyCode;
    this.r['CurrencyCode']?.setValue(code);
  }



  clearSearchFields(type: string) {
    this.searchOutstandingForm.patchValue({
      LedgerMasterSid: null,
      CustomerName: '',
      VendorInvoiceNumber: '',
      HouseNumber: '',
      FilterText: ''
    });
  }


  /**
   * Get the number of decimal places allowed for amounts
   * Used with [decimalDigitsAfter] directive
   * Example: getAmountDecimalPlaces('USD') returns 2
   */
  public getAmountDecimalPlaces(CurrencyMasterSid: number): number {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(currency.currencyCode);
      return config?.amountDecimal;
    }
    return 2;
  }

  /**
   * Get the number of decimal places allowed for exchange rates
   * Example: getExchangeRateDecimalPlaces('USD') returns 3
   */
  public getExchangeRateDecimalPlaces(CurrencyMasterSid: string): number {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(currency.currencyCode);
      return config?.exchangeDecimal;
    }
    return 2;
  }
  /**
 * Format an amount with currency symbol and comma separators
 * Example: getFormattedAmount(1234.56, 'USD') returns '$1,234.56'
 */
  public getFormattedAmount(amount: number, CurrencyMasterSid: number) {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    const input = {
      value: amount,
      currencyCode: currency?.currencyCode
    }
    return this.currencyFormatService.formatAmount(input, false);
  }

  /**
   * Format an exchange rate as a string
   * Example: getFormattedExchangeRate(1234.5678, 'USD') returns '1234.568'
   */
  /**
   * Format an exchange rate as a string
   * Example: getFormattedExchangeRate(1234.5678, 'USD') returns '1234.568'
   */
  public getFormattedExchangeRate(rate: number, CurrencyMasterSid: number): number {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    return this.currencyFormatService.formatExchangeRate({
      value: rate,
      currencyCode: currency?.currencyCode
    });
  }




  private findInvalidControlsRecursive(form: FormGroup | FormArray): string[] {
    let invalidControls: string[] = [];
    Object.keys(form.controls).forEach(key => {
      const control = (form as any).get(key);
      if (control.invalid) {
        invalidControls.push(key);
      }
      if (control instanceof FormGroup || control instanceof FormArray) {
        invalidControls = invalidControls.concat(
          this.findInvalidControlsRecursive(control).map(childKey => `${key}.${childKey}`)
        );
      }
    });
    return invalidControls;
  }

  public errorLogger(): void {
    console.log('Form Status:', this.paymentForm.status);
    console.log('Form Value', this.paymentForm.value);
    if (this.paymentForm.invalid) {
      const invalid = this.findInvalidControlsRecursive(this.paymentForm);
      console.log('Invalid controls:', invalid);
    } else {
      console.log('No invalid controls found.');
    }
  }

  private setupBillMatchingValidation(): void {
    this.voucherMatchings.valueChanges
      .subscribe(() => this.validateTotalMatchingAmount());
    this.detailItems.valueChanges
      .subscribe(() => this.validateTotalMatchingAmount());
  }

  private validateTotalMatchingAmount(): void {
    // Find party detail (D) row: usually first or with party LedgerMasterSid
    console.log("Validating");
    const detailItems = this.detailItems.getRawValue();
    const partyDetail = detailItems.find((d: any) => d.LedgerMasterSid === this.r['PartyMasterSid']?.value);
    if(!partyDetail) {
      this.matchingError = null;
      return;
    }
    const partyAmount = Number(partyDetail?.Amount ?? 0);
    console.log("party info",{
      partyDetail,
      partyAmount
    })

    // Calculate sum of all matching amounts
    const totalBillMatchingAmount = this.voucherMatchings.controls
      .reduce((sum, c) => sum + Number(c.get('matchCurrAmt')?.value ?? 0), 0);

    console.log("totalBillMatchingAmount",totalBillMatchingAmount);
    console.log(totalBillMatchingAmount > partyAmount);
    if (totalBillMatchingAmount > partyAmount) {
       this.matchingError = 'Total bill matching amount cannot be greater than party detail amount.';
    } else {
      if (this.matchingError) {
        // Remove the custom error if present and condition is not met
         this.matchingError = null;
      }
    }
    console.log("FINAL DECISION",this.matchingError);
    this.paymentForm.updateValueAndValidity();
  }





  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
