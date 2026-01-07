import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { ToastrService } from 'ngx-toastr';
import { ReceiptService } from '../../services/receipt.service';
import { OutstandingService } from '../../services/outstanding.service';
import {
  CreateReceiptRequest,
  ReceiptDetail,
  OutstandingInvoice,
  PaymentMode,
  SearchOutstandingRequest,
  ReceiptFormData,
} from '../../models/receipt.model';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  takeUntil,
} from 'rxjs';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { AccountsService } from '../../accounts.service';
import { ConfirmationDialogComponent } from 'src/app/component/confirmation-modal/confirmation-modal.component';
import { errorLogger, toNgbDateStruct, toNumber } from 'src/app/common/helper';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { BankReceiptComponent } from '../report/bank-receipt/bank-receipt.component';
import { CashReceiptComponent } from '../report/cash-receipt/cash-receipt.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { CommonService } from 'src/app/common/common.service';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import {
  consistentExchangeRatesValidator,
  getExchangeRateErrorMessage,
} from 'src/app/core/ValidationFn/exRateConsistency.validators';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';

/**
 * Receipt Entry Component
 * Handles creation and editing of receipt vouchers with:
 * - Invoice matching
 * - Advance receipts
 * - TDS deduction
 * - Multi-currency
 * - Inter-branch receipts with automatic JV
 */
@Component({
  selector: 'app-receipt-entry',
  standalone: true,
  imports: [
    NgbDropdownModule,
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
    NgxSpinnerModule,
    RouterModule,
  ],
  templateUrl: './receipt-entry.component.html',
  styleUrl: './receipt-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
  ],
})
export class ReceiptEntryComponent implements OnInit, HasUnsavedChanges {
  headerId: number;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  totalDebits: number = 0;
  totalCredits: number = 0;
  currentCompanyCountryCode: string;
  selectedTab = 'Detail';
  isSaving = false;
  isViewMode: boolean = false;
  isPosted: boolean = false;
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
  currentMenuId: number;
  receiptData: any;
  userData: any;
  searchType: string = 'Party';
  selectedParty: any;
  filterText: any;

  matchingError: string | null = null;

  today = new Date();
  todayDateInNgbStruct = toNgbDateStruct(this.today);
  searchOutstandingForm!: FormGroup;
  receiptForm!: FormGroup;
  partyList: any[] = [];
  onlyCustomerList: any[] = [];
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
  receiptPrintData: any;
  isLimitErrorShown: false;

  CustomerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  COALookupConfig = DROPDOWN_CONFIGS.COA_LEDGER;

  outstandingInvoices: OutstandingInvoice[] = [];
  selectedInvoices: OutstandingInvoice[] = [];
  paymentModes: { value: string; label: string }[] = [];
  isAutoPosting: boolean = false;
  voucherMatchingInfo: {
    VoucherMatchingHeaderSid: number;
    VoucherMatchingNo: string;
  };

  // Outstanding invoices

  get isEditMode() {
    return !!this.headerId && !this.isViewMode;
  }

  @ViewChild('searchModal') searchModal!: TemplateRef<any>;

  // Tabs configuration
  tabs = [
    { name: 'Detail', icon: 'fas fa-address-card' },
    { name: 'Voucher Matching', icon: 'fas fa-code-branch' },
    // { name: 'Interbranch', icon: 'fas fa-flag-checkered' },
  ];

  CrDr = [
    { id: 1, name: 'Cr', value: 'C' },
    { id: 2, name: 'Dr', value: 'D' },
  ];
  public searchTypes = [
    { label: 'Party', value: 'Party' },
    { label: 'Invoice', value: 'Invoice' },
    // { label: 'House No.', value: 'HouseNo' },
    // { label: 'HBL No.', value: 'HBLNo' },
    // { label: 'Master No.', value: 'MasterNo' },
    // { label: 'MBL No.', value: 'MBLNo' },
    // { label: 'HAWB', value: 'HAWB' },
    // { label: 'MAWB', value: 'MAWB' }
  ];

  modalSearchType = [
    { id: 1, name: 'House No' },
    { id: 2, name: 'HBL No' },
    { id: 3, name: 'Master No' },
    { id: 4, name: 'MBL No' },
    { id: 5, name: 'HAWB' },
    { id: 6, name: 'MAWB' },
    { id: 7, name: 'Party' },
    { id: 8, name: 'Invoice' },
  ];

  TandCList: any[] = [];
  allPendingCosts: any[] = [];
  selectedCosts: any[] = [];
  companyCurrency: any;
  currentCurrencyCode: string = '';
  private destroy$ = new Subject<void>();

  // Unsaved changes detection
  private isLoading = false;
  isDirty = false;
  private initialDetailCount = 0;
  private initialMatchingCount = 0;
  private formSaved = false;
  private markAsDirty(): void {
    this.isDirty = true;
    this.formSaved = false;
  }

  constructor(
    public mps: MenuPermissionService,
    private commonService: CommonService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private receiptService: ReceiptService,
    private appSettingService: AppSettingsService,
    private dropdownStore: DropdownStore,
    private accountService: AccountsService,
    private currencyFormatService: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService,
    private spinner: NgxSpinnerService,
    private companySettings: CompanySettingsManagerService
  ) {}

  ngOnInit(): void {
    this.userData = this.appSettingService.getDecryptedUserProfile();

    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    this.currentCompanyCountryCode = String(
      this.appSettingService.getCurrentCompanyCountry()?.countryCode
    ).toLowerCase();
    this.currentYearId = Number(localStorage.getItem('current-year-id'));
    this.currentMenuId = this.mps.getMenuId();
    this.companyCurrency = this.companySettings.getCurrencySettings();
    this.currentCurrencyCode = this.companyCurrency.code;
    console.log('Company Currency:', this.currentCurrencyCode);
    console.log('Company Currency:', this.companyCurrency);
    this.getCurrentCompanyBranches();

    this.currentBranch = this.appSettingService.getCurrentBranchInfo();

    console.log('USER DATA', this.userData);
    console.log('CURRENT COMPANY', this.currentCompany);
    console.log('CURRENT BRANCH', this.currentBranch);
    console.log('CURRENT COMPANY COUNTRY', this.currentCompanyCountryCode);
    console.log('CURRENT YEAR ID', this.currentYearId);
    this.mps.init().subscribe();
    this.checkVoucherPostingMechanism();
    this.initSearchOutstandingForm();
    this.initializeForm();
    this.loadPaymentModes();
    this.loadAllLookups();
    this.loadDetailLookups();

    // Check if editing existing receipt
    const receiptId = this.route.snapshot.params['id'];
    if (receiptId) {
      this.headerId = Number(receiptId);
      this.loadReceipt(this.headerId);
    } else {
      this.subscribeToPartyAndBankChanges();
      this.setupFormChangeDetection();
    }
  }

  private setupFormChangeDetection(): void {
    this.receiptForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (
          !this.formSaved &&
          !this.isSaving &&
          this.receiptForm.dirty &&
          !this.isLoading
        ) {
          this.markAsDirty();
        }
      });

    this.detailItems.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.formSaved && !this.isSaving && !this.isLoading) {
          this.markAsDirty();
        }
      });

    // Track voucher matching changes
    this.voucherMatchings.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.formSaved && !this.isSaving && !this.isLoading) {
          this.markAsDirty();
        }
      });

    // Track inter-branch changes if applicable
    this.interBranches.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.formSaved && !this.isSaving && !this.isLoading) {
          this.markAsDirty();
        }
      });
  }

  initSearchOutstandingForm() {
    this.searchOutstandingForm = this.fb.group({
      CompanyMasterSid: [
        this.currentCompany?.CompanyMasterSid,
        Validators.required,
      ],
      SearchType: ['Party', Validators.required],

      LedgerMasterSid: [null],
      CustomerName: [''],
      InvoiceNumber: [''],
      HouseNumber: [''],

      FilterText: [''], // generic input for all NON-Party searches
      IncludeFullyPaid: [false],
    });

    this.searchOutstandingForm
      .get('SearchType')
      ?.valueChanges.subscribe((type) => {
        this.clearSearchFields(type);
      });
  }

  /**
   * Initialize the receipt form with validation
   */
  private initializeForm(): void {
    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    this.receiptForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }], // Receipt Number
      VoucherDate: [new Date()], // Receipt Date
      MultiBranch: [{ value: false, disabled: true }],
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
    [
      'CashOrBank',
      'InstrumentMode',
      'InstrumentNumber',
      'BankPartyName',
    ].forEach((ctrl) => {
      this.receiptForm.get(ctrl)?.valueChanges.subscribe(() => {
        this.updateDetailNarration();
      });
    });
    ['detailItems', 'voucherMatchings'].forEach((ctrl) => {
      this.receiptForm.get(ctrl)?.valueChanges.subscribe(() => {
        this.validateAmount();
      });
    });
    // this.setupBillMatchingValidation()
    this.receiptForm.setValidators(consistentExchangeRatesValidator(companyCurrency, this.currentCurrencyCode));
    this.receiptForm.updateValueAndValidity();

    this.receiptForm.patchValue({
      CurrencyMasterSid: companyCurrency,
    });

    this.setCurrencyCode(companyCurrency);
    this.handleHeaderExchangeRate(companyCurrency);
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue =
        'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    if (this.formSaved) {
      return false;
    }

    // Check if main form is dirty
    if (this.receiptForm?.dirty) {
      return true;
    }

    // Check if details changed
    if (this.detailItems?.length !== this.initialDetailCount) {
      return true;
    }

    // Check if matching count changed
    if (this.voucherMatchings?.length !== this.initialMatchingCount) {
      return true;
    }

    // Check if any detail item is dirty
    const hasDetailChanges = this.detailItems?.controls.some(
      (control) => control.dirty
    );
    if (hasDetailChanges) {
      return true;
    }

    // Check if any voucher matching is dirty
    const hasMatchingChanges = this.voucherMatchings?.controls.some(
      (control) => control.dirty
    );
    if (hasMatchingChanges) {
      return true;
    }

    // Check custom dirty flag
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      // Call the existing submit logic
      this.onSubmit(resolve);
    });
  }

  handleHeaderExchangeRate(currencySid: number) {
    const exCtrl = this.receiptForm.get('ExchangeRate');

    if (!currencySid) return;

    // SAME CURRENCY
    if (currencySid === this.currentCompany?.CurrencyMasterSid) {
      exCtrl?.setValue(1);
      exCtrl?.disable({ emitEvent: false });
      this.recalculateAllMatchingPartyAmounts();
      this.recalcPartyAmtForAllDetails();
      return;
    }

    // DIFFERENT CURRENCY
    exCtrl?.enable({ emitEvent: false });

    this.patchCurrencyExchangeRate(); // existing API call
  }

  /**
   * Setup form value change listeners
   */
  // private setupFormListeners(): void {
  //   // Recalculate TDS when percentage or amount changes
  //   this.receiptForm.get('TDSPercentage')?.valueChanges.subscribe(() => {
  //     this.calculateTDS();
  //   });

  //   this.receiptForm.get('TotalInvoiceAmount')?.valueChanges.subscribe(() => {
  //     this.calculateTDS();
  //     this.calculateNetAmount();
  //   });

  //   // Show/hide TDS fields
  //   this.receiptForm.get('HasTDS')?.valueChanges.subscribe((hasTDS) => {
  //     if (hasTDS) {
  //       this.receiptForm.get('TDSPercentage')?.setValidators([Validators.required, Validators.min(0)]);
  //       this.receiptForm.get('TDSLedgerMasterSid')?.setValidators([Validators.required]);
  //     } else {
  //       this.receiptForm.get('TDSPercentage')?.clearValidators();
  //       this.receiptForm.get('TDSLedgerMasterSid')?.clearValidators();
  //       this.receiptForm.patchValue({ TDSPercentage: 0, TDSAmount: 0 });
  //     }
  //     this.receiptForm.get('TDSPercentage')?.updateValueAndValidity();
  //     this.receiptForm.get('TDSLedgerMasterSid')?.updateValueAndValidity();
  //   });

  //   // Show/hide inter-branch fields
  //   this.receiptForm.get('IsInterBranch')?.valueChanges.subscribe((isInterBranch) => {
  //     if (isInterBranch) {
  //       this.receiptForm.get('ReceivingBranchMasterSid')?.setValidators([Validators.required]);
  //     } else {
  //       this.receiptForm.get('ReceivingBranchMasterSid')?.clearValidators();
  //     }
  //     this.receiptForm.get('ReceivingBranchMasterSid')?.updateValueAndValidity();
  //   });

  //   // Show cheque fields for cheque payment mode
  //   this.receiptForm.get('PaymentMode')?.valueChanges.subscribe((mode) => {
  //     if (mode === PaymentMode.CHEQUE) {
  //       this.receiptForm.get('ChequeNumber')?.setValidators([Validators.required]);
  //       this.receiptForm.get('ChequeDate')?.setValidators([Validators.required]);
  //     } else {
  //       this.receiptForm.get('ChequeNumber')?.clearValidators();
  //       this.receiptForm.get('ChequeDate')?.clearValidators();
  //     }
  //     this.receiptForm.get('ChequeNumber')?.updateValueAndValidity();
  //     this.receiptForm.get('ChequeDate')?.updateValueAndValidity();
  //   });
  // }

  loadAllLookups() {
    const filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };
    forkJoin({
      parties: this.accountService
        .getAllDebtorWithCOAMapped(filterOption)
        .pipe(catchError((err) => of([]))),
      currencies: this.dropdownStore
        .loadCurrencies()
        .pipe(catchError((err) => of([]))),
      bankTypedLedgers: this.accountService
        .getAllLedgersByItsType({
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          LedgerType: 'Bank',
        })
        .pipe(catchError((err) => of([]))),
      cashTypeLedgers: this.accountService
        .getAllLedgersByItsType({
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          LedgerType: 'Cash',
        })
        .pipe(catchError((err) => of([]))),
    }).subscribe(
      ({ parties, currencies, bankTypedLedgers, cashTypeLedgers }) => {
        this.partyList = parties.data;
        this.currencyList = (currencies || []).map((c) => ({
          ...c,
          countryName: c?.countryMaster?.countryName,
        }));
        this.bankTypedLedgers = bankTypedLedgers.data;
        this.cashTypeLedgers = cashTypeLedgers.data;

        const companyCurrency = this.r['CurrencyMasterSid']?.value;
        this.setCurrencyCode(companyCurrency);

        this.currencyConfigService.initializeConfigurations(this.currencyList);
        console.log(
          'CURRENCY CONFIG INITIALIZED',
          this.currencyConfigService.getAllCurrencyConfigs()
        );

        const cusMap = new Map<number, any>();
        this.partyList.forEach((customer) => {
          cusMap.set(customer.CustomerMasterSid, customer);
        });
        this.onlyCustomerList = Array.from(cusMap.values());
      }
    );
  }

  loadDetailLookups() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const filterOption = {
      CompanyMasterSid,
      BranchMasterSid,
    };
    forkJoin({
      coaWithLedgerCategoryAsLedger: this.accountService
        .getAllCoaWithLedgerCategory({
          LedgerCategory: 'Ledger',
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        })
        .pipe(catchError((err) => of([]))),
      costCenters: this.accountService
        .getAllCostCenters()
        .pipe(catchError((err) => of([]))),
      profitCenters: this.accountService
        .getAllProfitCenters()
        .pipe(catchError((err) => of([]))),
      depts: this.dropdownStore
        .loadDepartments(filterOption)
        .pipe(catchError((err) => of([]))),
      charges: this.accountService
        .getAllCharges(this.currentCompany?.CompanyMasterSid)
        .pipe(catchError((err) => of([]))),
    }).subscribe(
      ({
        coaWithLedgerCategoryAsLedger,
        costCenters,
        profitCenters,
        depts,
        charges,
      }) => {
        this.coaList = coaWithLedgerCategoryAsLedger.data;
        this.costCenterList = costCenters.data;
        this.profitCenterList = profitCenters.data;
        this.deptList = depts;
        this.chargeList = charges;
        this.filterChargeByDeptForAllRow();
      }
    );
  }

  /**
   * Load payment modes
   */
  private loadPaymentModes(): void {
    this.paymentModes = this.receiptService.getInstrumentModes();
  }

  /**
   * Search outstanding invoices for customer
   */

  searchOutstanding() {
    const form = this.searchOutstandingForm.getRawValue();
    console.log('FormValue', form);
    let payload: any = {
      CompanyMasterSid: form.CompanyMasterSid,
      IncludeFullyPaid: form.IncludeFullyPaid,
    };

    switch (form.SearchType) {
      case 'Party':
        payload.LedgerMasterSid = form.LedgerMasterSid;
        break;

      case 'Invoice':
        payload.InvoiceNumber = form.FilterText;
        break;

      case 'HouseNo':
        payload.HouseNumber = form.FilterText;
        break;

      default:
        // For HBL, MBL, HAWB, MAWB, MasterNo etc.
        payload.InvoiceNumber = form.FilterText;
    }

    console.log('Payload Sent:', payload);

    this.receiptService.searchOutstandingInvoices(payload).subscribe((res) => {
      if (res && Array.isArray(res) && res.length > 0) {
        this.patchHeaderValue(res);
        this.patchOutstandingFormArray(res);
      } else {
        const searchType = this.searchOutstandingForm.get('SearchType')?.value;
        this.appSettingService.showError(
          `No outstanding found for this ${searchType}.`
        );
      }
    });
  }

  patchHeaderValue(res: any) {
    console.log('RES', res);
    if (
      res.length > 0 &&
      res[0].LedgerMasterSid &&
      this.searchOutstandingForm.get('SearchType')?.value === 'Invoice'
    ) {
      const party = this.partyList.find(
        (p) => p.SubledgerMasterSid === res[0].LedgerMasterSid
      );
      this.onPartyChange(party);
    } else if (
      res.length > 0 &&
      this.searchOutstandingForm.get('SearchType')?.value === 'Party' &&
      this.searchOutstandingForm.get('LedgerMasterSid')?.value
    ) {
      const partyIdInSearch =
        this.searchOutstandingForm.get('LedgerMasterSid')?.value;
      const party = this.partyList.find(
        (p) => p.SubledgerMasterSid === partyIdInSearch
      );
      this.onPartyChange(party);
    }
  }

  /**
   * Save receipt
   */
  // async saveReceipt(): Promise<void> {
  //   if (this.receiptForm.invalid) {
  //     this.toastr.warning('Please fill all required fields');
  //     this.markFormGroupTouched(this.receiptForm);
  //     return;
  //   }

  //   this.isSaving = true;

  //   try {
  //     const formValue = this.receiptForm.getRawValue();

  //     // Build receipt details from vouchers
  //     const details: ReceiptDetail[] = this.detailItems.controls.map((control) => ({
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

  //     const createRequest: CreateReceiptRequest = {
  //       CompanyMasterSid: formValue.CompanyMasterSid,
  //       BranchMasterSid: formValue.BranchMasterSid,
  //       LedgerMasterSid: formValue.LedgerMasterSid,
  //       VoucherDate: this.receiptService.formatDateForAPI(formValue.VoucherDate),
  //       Narration: formValue.Narration,
  //       PaymentMode: formValue.PaymentMode,
  //       ChequeNumber: formValue.ChequeNumber,
  //       ChequeDate: formValue.ChequeDate ? this.receiptService.formatDateForAPI(formValue.ChequeDate) : undefined,
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

  //     const response = await this.receiptService.createReceipt(createRequest).toPromise();

  //     this.toastr.success(`Receipt ${response?.VoucherNumber} created successfully`);
  //     this.router.navigate(['/accounts/receipt/list']);
  //   } catch (error: any) {
  //     console.error('Failed to save receipt:', error);
  //     this.toastr.error(error.message || 'Failed to save receipt');
  //   } finally {
  //     this.isSaving = false;
  //   }
  // }

  onSubmit(resolve?: (value: boolean) => void, isPostingTrue?: boolean) {
    this.isSaving = true;
    const formValue = this.receiptForm.getRawValue();
    const detailItems = this.detailItems.getRawValue();

    if (this.detailItems.length === 0) {
      this.appSettingService.showError(
        'Please add at least one receipt detail'
      );
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
    }

    // Enhanced exchange rate validation - checks all three error types
    if (this.receiptForm.errors) {
      const hasExchangeRateError =
        this.receiptForm.errors['inconsistentExchangeRates'] ||
        this.receiptForm.errors['foreignCurrencyRateOne'] ||
        this.receiptForm.errors['exchangeRateZero'];

      if (hasExchangeRateError) {
        const errorMsg = getExchangeRateErrorMessage(
          this.receiptForm,
          this.currencyList
        );
        this.appSettingService.showError(errorMsg);
        if (resolve) resolve(false);
        this.isSaving = false;
        return;
      }
    }

    const partyDetail = detailItems.find(
      (d) => d.LedgerMasterSid === formValue.PartyMasterSid
    );
    if (formValue.PartyMasterSid && !partyDetail) {
      this.appSettingService.showError(
        'Please add a party detail for the alloted ledger.'
      );
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
    }

    const hasBankDetail = detailItems.some(
      (d) => d.COAMasterSid === formValue.BankCOA
    );
    if (formValue.BankCOA && !hasBankDetail) {
      this.appSettingService.showError(
        'Please add a bank detail for the alloted COA.'
      );
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
    }

    if (this.totalDebits === 0 || this.totalCredits === 0) {
      this.appSettingService.showError(
        'Please add at least one debit or credit amount.'
      );
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
    }

    if (this.totalDebits !== this.totalCredits) {
      this.appSettingService.showError(
        'Please make sure the sum of debit amounts and credit amounts are equal.'
      );
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
    }

    const matchingAmt = this.getTotalMatchPartyAmt();
    const partyAmt = partyDetail.PartyAmount;
    if (toNumber(matchingAmt) > toNumber(partyAmt)) {
      this.appSettingService.showError(
        'Please make sure the matching amount does not exceed the party amount.'
      );
      console.error(
        'Party amount:',
        partyAmt,
        'Matching amount:',
        matchingAmt,
        'comparison : ',
        toNumber(matchingAmt) > toNumber(partyAmt)
      );
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
    }

    if (this.matchingError) {
      this.appSettingService.showError(this.matchingError);
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
    }

    if (this.receiptForm.invalid) {
      errorLogger(this.receiptForm);
      this.appSettingService.showWarning('Please fill all required fields');
      this.receiptForm.markAllAsTouched();
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
    }

    const currentUserEmail =
      this.appSettingService.userSettingSource.value['userEmail'];
    const voucherMatching = this.voucherMatchings.getRawValue().map((vm) => ({
      MatchingDetailSid: vm.MatchingDetailSid,
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
      PartyAmount: vm.matchPartyAmt,
      MatchingTDSAmount: vm.tdsAmt,
      tdsAmt: vm.tdsAmt,
    }));

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      CashOrBank: formValue.CashOrBank ? 'C' : 'B',
      MultiBranch: formValue.MultiBranch ? 'Y' : 'N',
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
      Amount: 0,
      LocalAmount: 0,
      NetAmount: 0,
      TaxType:
        this.currentCompanyCountryCode === 'in'
          ? 'GST'
          : this.currentCompanyCountryCode === 'ae' ||
            this.currentCompanyCountryCode === 'us'
          ? 'VAT'
          : '',
      InstrumentMode: formValue.InstrumentMode,
      InstrumentNumber: formValue.InstrumentNumber,
      InstrumentDate: formValue.InstrumentDate,
      ClearanceDate: formValue.ClearanceDate,
      detailItems: detailItems.map((d) => {
        const isBankRecord = d.COAMasterSid === formValue.BankCOA;
        return {
          ...d,
        };
      }),
      voucherMatching: voucherMatching,
      ...(this.isEditMode
        ? {
            UpdatedBy: currentUserEmail,
          }
        : {
            CreatedBy: currentUserEmail,
          }),
    };

    this.spinner.show();
    if (this.isEditMode) {
      this.accountService.updateReceiptById(this.headerId, payload).subscribe({
        next: (resp: any) => {
          this.isSaving = false;
          if (resp.status) {
            this.appSettingService.showSuccess('Receipt updated successfully');

            this.formSaved = true;
            this.isDirty = false;

            if (resolve) resolve(true);
            this.spinner.hide();
            this.loadReceipt(this.headerId);
          } else {
            this.appSettingService.showError(resp.message);
            if (resolve) resolve(false);
            this.spinner.hide();
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.appSettingService.showError('Failed to update receipt');
          if (resolve) resolve(false);
          this.spinner.hide();
        },
      });
    } else {
      this.accountService.createReceipt(payload).subscribe({
        next: async (resp: any) => {
          this.isSaving = false;
          if (resp.status) {
            this.headerId = resp.data?.voucherHeader?.VoucherHeaderSid;
            if (isPostingTrue) {
              await this.postVoucher();
            } else {
              this.spinner.hide();
            }
            this.resetDirtyState();
            this.formSaved = true;
            if (resolve) resolve(true);
            if (this.headerId) {
              this.router.navigate(['accounts/receipt/entry', this.headerId]);
            }
          } else {
            this.appSettingService.showError(resp.message);
            if (resolve) resolve(false);
            this.spinner.hide();
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.appSettingService.showError('Failed to create receipt');
          if (resolve) resolve(false);
          this.spinner.hide();
        },
      });
    }
  }

  private resetDirtyState(): void {
    this.isDirty = false;
    this.formSaved = false;
    this.receiptForm?.markAsPristine();
    this.initialDetailCount = this.detailItems?.length || 0;
    this.initialMatchingCount = this.voucherMatchings?.length || 0;
  }

  // onSubmit(isPostingTrue?: boolean) {
  //   const formValue = this.receiptForm.getRawValue();
  //   const detailItems = this.detailItems.getRawValue();
  //   if (this.detailItems.length === 0) {
  //     this.appSettingService.showError('Please add at least one receipt detail');
  //     return;
  //   }

  //   if (this.receiptForm.hasError('inconsistentExchangeRates')) {
  //     const errorMsg = getExchangeRateErrorMessage(
  //       this.receiptForm,
  //       this.currencyList
  //     );
  //     this.appSettingService.showError(errorMsg);
  //     return;
  //   }

  //   const partyDetail = detailItems.find(d => d.LedgerMasterSid === formValue.PartyMasterSid);
  //   if (formValue.PartyMasterSid && !partyDetail) {
  //     this.appSettingService.showError('Please add a party detail for the alloted ledger.');
  //     return;
  //   }

  //   const hasBankDetail = detailItems.some(d => d.COAMasterSid === formValue.BankCOA);
  //   if (formValue.BankCOA && !hasBankDetail) {
  //     this.appSettingService.showError('Please add a bank detail for the alloted COA.');
  //     return;
  //   }

  //   if(this.totalDebits === 0 || this.totalCredits === 0){
  //     this.appSettingService.showError('Please add at least one debit or credit amount.');
  //     return;
  //   }

  //   if (this.totalDebits !== this.totalCredits) {
  //     this.appSettingService.showError('Please make sure the sum of debit amounts and credit amounts are equal.');
  //     return;
  //   }

  //   if(this.getTotalMatchCurrAmt() > partyDetail.PartyAmount){
  //     this.appSettingService.showError('Please make sure the matching amount does not exceed the party amount.');
  //     return;
  //   }

  //   if (this.matchingError) {
  //     this.appSettingService.showError(this.matchingError);
  //     return;
  //   }

  //   if (this.receiptForm.invalid) {
  //     this; this.appSettingService.showError('Please fill all required fields');
  //     this.markFormGroupTouched(this.receiptForm);
  //     return;
  //   }
  //   this.isSaving = true;

  //   const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
  //   const voucherMatching = this.voucherMatchings.getRawValue()
  //     .map((vm) => ({
  //       VoucherHeaderSid: vm.VoucherHeaderSid,
  //       VoucherDetailSid: vm.VoucherDetailSid,
  //       VoucherTransactionSid: vm.VoucherTransactionSid,
  //       VoucherType: vm.voucherType,
  //       CurrencyCode: vm.curr,
  //       ExchangeRate: vm.exRate || 1,
  //       DrCr: vm.drCr,
  //       Amount: vm.currAmt,
  //       LocalAmount: vm.localAmt,
  //       MatchingCurrency: vm.matchCurr,
  //       MatchingExRate: vm.matchExRate,
  //       MatchingAmount: vm.matchCurrAmt,
  //       MatchingLocalAmount: vm.matchLocalAmt,
  //       PartyAmount : vm.matchPartyAmt,
  //       MatchingTDSAmount: vm.tdsAmt,
  //       tdsAmt: vm.tdsAmt,
  //     }));

  //   console.log("Only filled voucher matchings", voucherMatching);
  //   const totalTDSAmount = voucherMatching.reduce((acc, curr) => acc + curr.tdsAmt, 0);
  //   const totalLocalAmount = voucherMatching.reduce((acc, curr) => acc + curr.MatchingLocalAmount, 0);
  //   const payload = {
  //     CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
  //     BranchMasterSid: this.currentBranch?.BranchMasterSid,
  //     CashOrBank: formValue.CashOrBank ? "C" : "B",
  //     MultiBranch: formValue.MultiBranch ? "Y" : "N",
  //     VoucherDate: formValue.VoucherDate,
  //     YearMasterSid: this.currentYearId,
  //     Narration: formValue.Narration,
  //     PartyMasterSid: formValue.PartyMasterSid,
  //     PartyName: formValue.PartyName,
  //     PartyAddress: formValue.PartyAddress,
  //     CustomerBranchSid: formValue.CustomerBranchSid,
  //     PlaceOfSupply: formValue.PlaceOfSupply,
  //     State: formValue.State,
  //     COAMasterSid: formValue.COAMasterSid,
  //     BankCOA: formValue.BankCOA,
  //     BankPartyName: formValue.BankPartyName,
  //     GST_VAT: formValue.GST_VAT,
  //     ReversalVoucher: formValue.ReversalVoucher,
  //     TaxNumber: formValue.TaxNumber,
  //     GSTType: formValue.GSTType,
  //     Remarks: formValue.Remarks,
  //     CurrencyMasterSid: formValue.CurrencyMasterSid,
  //     CurrencyCode: formValue.CurrencyCode,
  //     ExchangeRate: formValue.ExchangeRate,
  //     Amount: 0,
  //     LocalAmount: 0,
  //     NetAmount: 0,
  //     TaxType: this.currentUserCountry === 'india' ? 'GST' : (this.currentUserCountry === 'united arab emirates' ? 'VAT' : ''),
  //     InstrumentMode: formValue.InstrumentMode,
  //     InstrumentNumber: formValue.InstrumentNumber,
  //     InstrumentDate: formValue.InstrumentDate,
  //     ClearanceDate: formValue.ClearanceDate,
  //     ...(isPostingTrue ? {
  //       PostStatus: 'P'
  //     } : {}),
  //     detailItems: detailItems.map(d => {
  //       const isBankRecord = d.COAMasterSid === formValue.BankCOA;
  //       return {
  //         ...d,
  //       }
  //     }),
  //     voucherMatching: voucherMatching,
  //     ...(this.isEditMode ? {
  //       UpdatedBy: currentUserEmail
  //     } : {
  //       CreatedBy: currentUserEmail
  //     })
  //   }

  //   console.log("PAYLOAD", payload);

  //   if (this.isEditMode) {
  //     this.accountService.updateReceiptById(this.headerId, payload).subscribe(
  //       (resp: any) => {
  //         if (resp.status) {
  //           this.appSettingService.showSuccess('Receipt updated successfully');
  //           const id = resp.data?.voucherHeader?.VoucherHeaderSid;
  //           this.loadReceipt(this.headerId)
  //         } else {
  //           this.appSettingService.showError(resp.message);
  //         }
  //       }
  //     );
  //   } else {
  //     this.accountService.createReceipt(payload).subscribe(
  //       async (resp: any) => {
  //         if (resp.status) {
  //           this.headerId = resp.data?.voucherHeader?.VoucherHeaderSid;
  //           if (isPostingTrue) {
  //             await this.postVoucher();
  //           }
  //           if (this.headerId) {
  //             this.router.navigate(['accounts/receipt/entry', this.headerId]);
  //           }
  //         } else {
  //           this.appSettingService.showError(resp.message);
  //         }
  //       }
  //     )
  //   }
  // }

  async postVoucher(notFromSubmit: boolean = false) {
    try {
      this.spinner.show();
      const voucherHeaderSid = this.headerId;
      const currentCompany = this.currentCompany;
      const currentBranch = this.currentBranch;
      const currentUserEmail = this.userData?.userEmail;
      const currentFinancialYear = Number(
        localStorage.getItem('current-year-id')
      );

      const currentCompanyCountry = Number(
        this.currentCompany?.CountryMasterSid
      );
      const currentCompanyState = Number(this.currentBranch?.StateMasterSid);

      const currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
      const customerBranchFromForm = Number(this.r['CustomerBranchSid']?.value);
      const customerState = this.partyList.find(
        (c) => c.CustomerBranchSid === customerBranchFromForm
      )?.StateMasterSid;

      let interOrIntra = 'Inter';
      // india
      if (this.currentCompanyCountryCode === 'in') {
        if (currentCompanyState === customerState) {
          interOrIntra = 'Inter';
        } else {
          interOrIntra = 'Intra';
        }
      } else if (['ae', 'us'].includes(this.currentCompanyCountryCode)) {
        interOrIntra = 'Inter';
      }

      if (
        !voucherHeaderSid ||
        !currentCompany ||
        !currentBranch ||
        !currentFinancialYear ||
        !currentCompanyCountry ||
        !currentCurrency
      ) {
        throw new Error(
          'Receipt Id ,Company, branch, or financial year or country information is missing'
        );
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
          countryName: this.currentCompanyCountryCode,
          TaxCategory: interOrIntra,
          EffectiveFrom: new Date().toISOString(),
          TaxType: 'Output',
        },
      };

      const result = await firstValueFrom(
        this.receiptService.postReceipt(postPayload)
      );

      this.spinner.hide();
      if (result.status) {
        this.appSettingService.showSuccess(result.message);
        this.receiptData.PostStatus = 'P';
        if (notFromSubmit) {
          this.loadReceipt(this.headerId);
        }
      } else {
        this.appSettingService.showError(result.message);
      }
    } catch (error) {
      this.spinner.hide();
      console.error('Post voucher error:', error);
    }
  }

  /**
   * Load existing receipt for editing
   */
  loadReceipt(receiptId: number) {
    this.isLoading = true;
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherHeaderSid: receiptId,
    };
    this.accountService.getReceiptById(payload).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.patchValues(resp.data);
          this.receiptPrintData = resp.data;
          this.voucherMatchingInfo = resp.data?.VoucherMatchingHeader?.[0];
          console.log(this.receiptPrintData, 'PRINTDATA');
          console.log(this.voucherMatchingInfo, 'VOUCHER MATCHING INFO');
        } else {
          this.appSettingService.showError(resp.message);
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading receipt:', error);
      },
    });
  }

  patchValues(response: any) {
    this.receiptData = response;
    const {
      VoucherDetail,
      VoucherTransaction,
      voucherMatchings,
      ...headerInfo
    } = response;
    this.receiptForm.patchValue(
      {
        VoucherNumber: headerInfo.VoucherNumber,
        CashOrBank: headerInfo.CashOrBank === 'C',
        MultiBranch: headerInfo.MultiBranch === 'Y',
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
      },
      { emitEvent: false }
    );

    console.log('Header', this.receiptForm.value);

    this.detailItems.clear();
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
        PartyAmount: d.PartyAmount,
      };

      this.addDetailRow(detailRecord, false);
      this.handleCOAChange(
        {
          COAMasterSid: d.COAMasterSid,
          SubledgerName: d.LedgerMasterSid !== null ? 'Y' : 'N',
        },
        index,
        true
      );
      const dept = this.deptList.find(
        (dep) => dep.DepartmentMasterSid === d.DepartmentMasterSid
      );
      this.filterDetailsWithDept(dept, index);
      this.onMasterJobChange(index, {
        MasterJobSid: d.MasterJobSid,
      });
    });
    console.log('Detail', this.receiptForm.value);
    this.isPosted = response.PostStatus === 'P';

    // const voucherMatchingHeader = response.voucherMatchingHeader || [];
    // console.log("VOUCHER MATCHING HEADER", voucherMatchingHeader);
    const voucherMatchingRecords = response.voucherMatchings || [];
    console.log('VOUCHER MATCHING RECORDS', voucherMatchingRecords);
    this.patchOutstandingFormArray(voucherMatchingRecords);

    if (this.isPosted) {
      this.receiptForm.disable();
    }
    setTimeout(() => {
      this.isDirty = false;
      this.formSaved = true;
      this.isLoading = false;

      this.receiptForm.markAsPristine();
      this.receiptForm.markAsUntouched();
      this.detailItems.markAsPristine();
      this.voucherMatchings.markAsPristine();

      this.initialDetailCount = this.detailItems?.length || 0;
      this.initialMatchingCount = this.voucherMatchings?.length || 0;

      console.log('✅ Form loaded and reset complete', {
        isDirty: this.isDirty,
        formSaved: this.formSaved,
        isLoading: this.isLoading,
        formStatus: this.receiptForm.status,
      });
    }, 100);
    this.setupFormChangeDetection();
  }

  /**
   * Reset form
   */
  resetForm(): void {
    this.receiptForm.reset();
    this.detailItems.clear();
    this.interBranches.clear();
    // this.addInterBranch();
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
    return this.receiptForm.get('detailItems') as FormArray;
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
      CurrencyMasterSid: [
        data?.CurrencyMasterSid || this.currentCompany?.CurrencyMasterSid,
        Validators.required,
      ],
      CurrencyCode: [
        data?.CurrencyCode || this.currentCurrencyCode,
        Validators.required,
      ],
      ExchangeRate: [data?.ExchangeRate || 0, Validators.required],

      NumberOfUnit: [data?.NumberOfUnit || 1.0],
      Rate: [data?.Rate || 1],
      Amount: [data?.Amount || 0.0, Validators.required],
      LocalAmount: [data?.LocalAmount || 0.0, Validators.required],

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
      TaxableAmount: [data?.TaxableAmount || 0.0],
      TaxPercentage1: [data?.TaxPercentage1 || 0.0],
      TaxAmount1: [data?.TaxAmount1 || 0.0],
      TaxPercentage2: [data?.TaxPercentage2 || 0.0],
      TaxAmount2: [data?.TaxAmount2 || 0.0],
      InvoiceType: [data?.InvoiceType || ''],
      Remarks: [data?.Remarks || ''],
      PartyAmount: [data?.PartyAmount || 0.0],

      // Relational objects (used for dropdowns or display)
      coaMaster: [data?.coaMaster || null], // COA reference
      chargeMaster: [data?.chargeMaster || null], // Charge reference
      currencyMaster: [data?.currencyMaster || null], // Currency reference
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

    detailItem.get('CurrencyMasterSid')?.valueChanges.subscribe((val) => {
      if (!val || this.currencyList.length === 0) {
        detailItem.get('CurrencyCode')?.setValue('');
        return;
      } else {
        detailItem
          .get('CurrencyCode')
          ?.setValue(
            this.currencyList.find((c) => c.CurrencyMasterSid === val)
              ?.currencyCode
          );
      }
    });
    return detailItem;
  }

  addDetailRow(data?: any, syncExRate: boolean = true) {
    const newRow = this.constructDetailItems(data);
    this.detailItems.push(newRow);

    const isNewRow = !data?.VoucherDetailSid;
    if (
      isNewRow &&
      !this.formSaved &&
      !this.isLoading &&
      this.initialDetailCount > 0
    ) {
      this.markAsDirty();
    }

    const lastAddedRow = this.detailItems.length - 1;
    const currencySid = newRow.get('CurrencyMasterSid')?.value;
    if (syncExRate) {
      this.handleDetailExchangeRate(currencySid, lastAddedRow);
    }
    // const localAmountTriggeringCtrls = ['Amount', 'ExchangeRate'];
    // localAmountTriggeringCtrls.forEach((ctrl) => {
    //   newRow.get(ctrl)?.valueChanges.subscribe(() => {
    //     if (!this.isSaving && !this.isLoading) {
    //       this.calculateLocalAmount(lastAddedRow, true);
    //     }
    //   });
    // });
  }

  removeDetail(detailIndex: number, VoucherDetailSid?: number) {
    // Case 1 : Row has VoucherDetailSid → call API first
    if (VoucherDetailSid) {
      this.accountService.softDeleteVoucherDetail(VoucherDetailSid).subscribe({
        next: (res) => {
          // On success, remove row from form array
          (this.detailItems as FormArray).removeAt(detailIndex);
          this.markAsDirty();
        },
        error: (err) => {
          console.error('Error deleting voucher detail:', err);
        },
      });
    }
    // Case 2 : New row (no VoucherDetailSid) → directly remove it
    else {
      (this.detailItems as FormArray).removeAt(detailIndex);
      this.markAsDirty();
    }
  }

  private subscribeToPartyAndBankChanges(): void {
    combineLatest([
      this.receiptForm.get('CustomerBranchSid').valueChanges,
      this.receiptForm.get('BankCOA').valueChanges,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([partySid, bankCoaSid]) => {
        // Check if both are selected and if the details grid is empty
        if (partySid && bankCoaSid && !this.isLoading) {
          this.populateInitialDetailRows(partySid, bankCoaSid);
        }
      });
  }

  private populateInitialDetailRows(
    partySid: number,
    bankCoaSid: number
  ): void {
    this.detailItems.clear();
    console.log('Selected ITEMS', {
      SelectedPartyId: partySid,
      SelectedBankCoaId: bankCoaSid,
    });
    // 1. Find the selected bank/cash ledger
    const isCashMode = this.receiptForm.get('CashOrBank')?.value;
    const bankLedgerSource = isCashMode
      ? this.cashTypeLedgers
      : this.bankTypedLedgers;
    const bankLedger = bankLedgerSource.find(
      (ledger) => ledger.COAMasterSid === bankCoaSid
    );
    const headerCurrencyId = this.r['CurrencyMasterSid']?.value;
    const headerCurrencyCode = this.r['CurrencyCode']?.value;
    // 2. Find the selected party ledger
    const partyLedger = this.partyList.find(
      (p) => p.CustomerBranchSid === partySid
    );

    console.log('Selected Full ITEMS', {
      SelectedParty: partyLedger,
      SelectedBank: bankLedger,
    });

    if (!bankLedger || !partyLedger) {
      console.error(
        'Could not find the selected bank or party ledger details.'
      );
      return;
    }
    const outstandingCurrencyAmount = this.getTotalOSCurrAmt();
    // 3. Create the Party Row (Credit)
    const partyData = {
      Sno: 1,
      COAMasterSid: partyLedger.COAMappedId,
      LedgerMasterSid: partyLedger.SubledgerMasterSid,
      DrCr: 'C',
      CurrencyMasterSid: headerCurrencyId,
      CurrencyCode: headerCurrencyCode,
      ExchangeRate: this.r['ExchangeRate']?.value,
      Amount: outstandingCurrencyAmount,
    };
    console.log('PartyData', partyData);
    this.addDetailRow(partyData,false);
    if(headerCurrencyId === this.currentCompany?.CurrencyMasterSid){
      this.detailItems.at(this.detailItems.length - 1).get('ExchangeRate')?.disable();
    }
    this.fetchLedgerForCOA(partyLedger, 0);
    this.calculateLocalAmount(0, true);

    // 4. Create the Bank Row (Debit)
    const bankData = {
      Sno: 2,
      COAMasterSid: bankLedger.COAMasterSid,
      LedgerMasterSid: bankLedger.LedgerMasterSid,
      DrCr: 'D',
      CurrencyMasterSid: headerCurrencyId,
      CurrencyCode: headerCurrencyCode,
      ExchangeRate: this.r['ExchangeRate']?.value,
      Amount: outstandingCurrencyAmount,
    };
    console.log('BankData', bankData);
    this.addDetailRow(bankData,false);
    if(headerCurrencyId === this.currentCompany?.CurrencyMasterSid){
      this.detailItems.at(this.detailItems.length - 1).get('ExchangeRate')?.disable();
    }
    this.fetchLedgerForCOA(bankLedger, 1);
    console.log('RAW VALUE', this.detailItems.at(1).getRawValue());
    this.calculateLocalAmount(1, true);

    this.updateDetailNarration();
  }

  handleCOAChange(coa: any, detailIndex: number, isPatching: boolean = false) {
    console.log('Handle COA Change', coa);
    if (!coa) {
      if (!isPatching) {
        this.detailItems.at(detailIndex).get('LedgerMasterSid')?.setValue(null);
      }
      return;
    }
    this.fetchLedgerForCOA(coa, detailIndex, isPatching);
  }

  /**
   * Update the narration for the party detail
   * eg Party row -  Being Bank Transfer Recd. NEFT 7887
   * Bank row - Being NEFT 7887 from KRS Logistics
   */
  updateDetailNarration() {
    const allDetails = this.detailItems.getRawValue();
    let partyDetailIndex = allDetails.findIndex(
      (d) => d.LedgerMasterSid === this.r['PartyMasterSid']?.value
    );
    let bankDetailIndex = allDetails.findIndex(
      (d) => d.COAMasterSid === this.r['BankCOA']?.value
    );
    const partyCtrl = this.detailItems.at(partyDetailIndex) as FormGroup;
    const bankCtrl = this.detailItems.at(bankDetailIndex) as FormGroup;
    if (partyDetailIndex === -1) partyCtrl?.setValue(null);
    if (bankDetailIndex === -1) bankCtrl?.setValue(null);

    const cashOrBank = this.r['CashOrBank']?.value ? 'Cash' : 'Bank';
    console.log(cashOrBank);
    const instrumentMode = this.r['InstrumentMode']?.value;
    const instrumentNumber = this.r['InstrumentNumber']?.value;
    const bankPartyName = this.r['BankPartyName']?.value;

    partyCtrl?.patchValue({
      Narration:
        cashOrBank === 'Bank'
          ? `Being Bank Transfer Recd. ${instrumentMode} ${instrumentNumber}`
          : `Being Cash Transfer Recd.`,
    });

    bankCtrl?.patchValue({
      Narration:
        cashOrBank === 'Bank'
          ? `Being ${instrumentMode} ${instrumentNumber} from ${bankPartyName}`
          : `Being Cash Transfer Recd.`,
    });
  }

  fetchLedgerForCOA(
    coa: any,
    detailIndex: number,
    isPatching: boolean = false
  ) {
    const ledgerCtrl = (this.detailItems.at(detailIndex) as FormGroup).get(
      'LedgerMasterSid'
    );
    if (coa.SubledgerName === 'Y') {
      ledgerCtrl.enable();
      ledgerCtrl.setValidators([Validators.required]);
      this.accountService
        .getLedgerByCOAMasterSid({
          COAMasterSid: coa.COAMappedId || coa.COAMasterSid,
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          DrCr: 'D',
        })
        .subscribe((resp: any) => {
          if (resp.status) {
            this.ledgerList[detailIndex] = resp.data || [];
            const currentValue = ledgerCtrl.getRawValue();
            const exist = this.ledgerList[detailIndex].find(
              (l) => l.SubledgerMasterSid === currentValue
            );
            if (!isPatching) {
              if (exist) {
                ledgerCtrl.setValue(exist.SubledgerMasterSid);
              } else {
                ledgerCtrl.setValue(null);
              }
            }
          } else {
            this.appSettingService.showError('Error fetching ledger for COA');
          }
        });
    } else {
      ledgerCtrl.disable();
      ledgerCtrl.clearValidators();
      ledgerCtrl.updateValueAndValidity();
    }
    console.log('LEDGER CTRL STATE', ledgerCtrl.enabled);
  }

  onCurrencyChangeForEachRow(selected: any, index: number) {
    const row = this.detailItems.at(index) as FormGroup;

    if (!selected) return;

    row.patchValue({
      CurrencyMasterSid: selected.CurrencyMasterSid,
      CurrencyCode: selected.currencyCode,
    });

    this.handleDetailExchangeRate(selected.CurrencyMasterSid, index);
  }

  patchCurrencyExchangeRateForDetail(currencySid: number, detailIndex: number) {
    this.getExchangeRate(currencySid).subscribe((resp: any) => {
      const row = this.detailItems.at(detailIndex) as FormGroup;
      const currencyCode = this.currencyList.find(
        (c) => c.CurrencyMasterSid === currencySid
      )?.currencyCode;
      row.get('ExchangeRate')?.setValue(
        this.currencyFormatService.formatExchangeRate({
          value: Number(resp),
          currencyCode,
        })
      );
      this.calculateLocalAmount(detailIndex, true);
    });
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
    });
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
    this.accountService
      .getMasterJobByDepartment({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        DepartmentMasterSid: dept?.DepartmentMasterSid,
      })
      .subscribe({
        next: (resp: any) => {
          this.masterJobList[detailIndex] = resp;
        },
        error: (err) => {
          console.error('Failed to load master jobs:', err);
        },
      });
  }

  onMasterJobChange(detailIndex: number, masterJob: any) {
    if (!masterJob || !masterJob.MasterJobSid) {
      this.houseJobList[detailIndex] = [];
      return;
    }
    this.accountService
      .getHouseJobByMasterJob({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        MasterJobSid: masterJob?.MasterJobSid,
      })
      .subscribe({
        next: (resp: any) => {
          this.houseJobList[detailIndex] = resp;
        },
        error: (err) => {
          console.error('Failed to load house jobs:', err);
        },
      });
  }

  filterChargeByDeptForAllRow() {
    this.detailItems.controls.forEach((group: FormGroup, index) => {
      const deptId = group.get('DepartmentMasterSid')?.value;
      const department = this.deptList.find(
        (dept) => dept.DepartmentMasterSid === deptId
      );
      console.log('FILTER CHARGE BY DEPT FOR ALL ROW', {
        deptId: deptId,
        deptObj: department,
        deptList: this.deptList,
      });
      if (department) {
        this.filterChargeByDeptForARow(department, index);
      }
    });
  }

  filterChargeByDeptForARow(dept, rowIndex) {
    console.log(`Filtering Dept from row ${rowIndex}`, {
      department: dept,
      chargeList: this.chargeList,
    });
    const departmentName = dept.departmentName;
    this.filteredChargeList[rowIndex] = (this.chargeList || []).filter(
      (charge) => {
        const allDepartmentNames = charge.DepartmentMasterSid || [];
        return allDepartmentNames.includes(departmentName);
      }
    );
  }

  // Section-3 Voucher Matching Related

  get voucherMatchings(): FormArray {
    return this.receiptForm.get('voucherMatchings') as FormArray;
  }

  patchOutstandingFormArray(transactions: any[]) {
    this.voucherMatchings.clear();
    const searchType = this.searchOutstandingForm.get('SearchType')?.value;

    transactions.forEach((tx) => {
      console.log('Transaction', tx);
      const isMatchedRecord = !!tx.MatchingDetailSid; // <–– detect matched data
      const matchCurrencyForThisTxn = this.currencyList.find(
        (c) => c.currencyCode === tx.CurrencyCode
      )?.CurrencyMasterSid;
      const form = this.fb.group({
        VoucherMatchingHeaderSid: [tx.VoucherMatchingHeaderSid || null],
        MatchingDetailSid: [tx.MatchingDetailSid || null],
        VoucherMatchingSid: [tx.VoucherMatchingSid || null],
        VoucherTransactionSid: [tx.VoucherTransactionSid],
        VoucherHeaderSid: [tx.VoucherHeaderSid],
        VoucherDetailSid: [tx.VoucherDetailSid],
        LedgerMasterSid: [tx.LedgerMasterSid],
        COAMasterSid: [tx.COAMasterSid],

        // Voucher Info
        voucherNo: [
          tx.VoucherHeader?.VoucherNumber || tx.VoucherNumber || tx.voucherNo,
        ],
        voucherTypeMasterSid: [tx.VoucherTypeMasterSid],
        voucherType: [
          tx.VoucherHeader?.voucherTypeMaster?.DocumentTypeName ||
            tx.VoucherType,
        ],
        voucherDate: [
          new Date(tx.VoucherHeader?.VoucherDate || tx.VoucherDate),
        ],
        drCr: [tx.DrCr === 'C' ? 'Cr' : 'Dr'],

        // System amounts
        curr: [tx.CurrencyCode],
        currAmt: [tx.OriginalCurrencyAmount],
        localAmt: [tx.OriginalLocalAmount],

        osCurrAmt: [tx.OutstandingCurrencyAmount],
        osLocalAmt: [tx.OutstandingLocalAmount],

        exRate: [tx.ExchangeRate || 1],

        // Matching values (either blank or existing)
        matchCurr: [
          isMatchedRecord ? tx.MatchingCurrency : matchCurrencyForThisTxn,
        ],
        matchExRate: [
          isMatchedRecord ? tx.MatchingExRate : tx.ExchangeRate || 1,
        ],
        matchCurrAmt: [
          isMatchedRecord
            ? tx.MatchingAmount
            : searchType === 'Invoice' && !this.isEditMode
            ? tx.OutstandingCurrencyAmount
            : null,
        ],
        matchLocalAmt: [
          isMatchedRecord
            ? tx.MatchingLocalAmount
            : searchType === 'Invoice' && !this.isEditMode
            ? tx.OutstandingLocalAmount
            : null,
        ],
        matchPartyAmt: [tx.PartyAmount ?? 0],
        tdsAmt: [isMatchedRecord ? tx.MatchingTDSAmount ?? null : null],

        balance: [
          isMatchedRecord ? tx.OutstandingLocalAmount - tx.LocalAmount : null,
        ],
        isTicked: [false],
        isLimitErrorShown: [false],
      });

      // Disable fields
      [
        'voucherNo',
        'voucherType',
        'voucherDate',
        'drCr',
        'curr',
        'exRate',
        'currAmt',
        'localAmt',
        'matchPartyAmt',
        'osCurrAmt',
        'osLocalAmt',
        'balance',
      ].forEach((field) => form.get(field)?.disable());
      form.get('matchLocalAmt').valueChanges.subscribe((val) => {
        const osLocalAmt = form.get('osLocalAmt')?.value;
        const balance = Number(osLocalAmt - val).toFixed(2);
        form.get('balance')?.setValue(Number(balance));
      });
      this.voucherMatchings.push(form);
    });

    console.log('Unified FormArray →', this.voucherMatchings.getRawValue());
  }

  patchExchangeRateForMatchRow(index: number) {
    const row = this.voucherMatchings.at(index) as FormGroup;
    const curr = row.get('matchCurr')?.value;
    console.log('Reached Patch Exchange Rate for Match Row' + index, {
      curr,
    });
    this.getExchangeRate(curr).subscribe((rate) => {
      row.get('matchExRate')?.setValue(rate);
      this.calculateLocalAmountForMatchRow(index, true);
    });
  }

  calculateLocalAmountForMatchRow(
    index: number,
    recalPartyAmt: boolean = false
  ) {
    const row = this.voucherMatchings.at(index) as FormGroup;

    const amount = Number(row.get('matchCurrAmt')?.value);
    const exchangeRate = Number(row.get('matchExRate')?.value);
    const formattedExchangeRate = this.getFormattedExchangeRate(
      exchangeRate,
      row.get('matchCurr')?.value
    );
    const formattedAmount = this.getFormattedAmount(
      amount,
      row.get('matchCurr')?.value
    );

    let finalAmount;
    if (this.formatCurrencyAmountBeforeConcludingLocal) {
      finalAmount = Number(formattedAmount) * Number(formattedExchangeRate);
    } else {
      finalAmount = Number(amount) * Number(formattedExchangeRate);
    }
    row
      .get('matchLocalAmt')
      ?.setValue(
        this.getFormattedAmount(finalAmount, row.get('matchCurr')?.value)
      );

    if (recalPartyAmt) {
      this.calculatePartyAmount(index);
    }
  }

  recalculateAllMatchingPartyAmounts() {
    this.voucherMatchings.controls.forEach((group, index) => {
      this.calculatePartyAmount(index);
    });
  }

  calculatePartyAmount(index: number) {
    const formGroup = this.voucherMatchings.at(index) as FormGroup;
    const currencyInHeader = this.receiptForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    const exRateInHeader = this.receiptForm.get('ExchangeRate')?.getRawValue();

    const currAmt = formGroup.get('matchCurrAmt')?.getRawValue();
    const localAmt = formGroup.get('matchLocalAmt')?.getRawValue();
    const currencyInMatchRow = formGroup.get('matchCurr')?.getRawValue();
    const target = formGroup.get('matchPartyAmt');
    console.log('DEBUG - Calculate Party Amount', {
      currencyInHeader,
      exRateInHeader,
      currAmt,
      localAmt,
      currencyInMatchRow,
    });
    if (currencyInHeader && currencyInMatchRow) {
      const normalizedCurrAmt = toNumber(currAmt);
      const normalizedLocalAmt = toNumber(localAmt);
      const normalizedExRateInHeader = toNumber(exRateInHeader);

      if (!normalizedExRateInHeader) {
        target.setValue(this.getFormattedAmount(0, currencyInMatchRow));
      } else {
        if (currencyInHeader === currencyInMatchRow) {
          target.setValue(
            this.getFormattedAmount(normalizedCurrAmt, currencyInMatchRow)
          );
        } else {
          const partyAmount = normalizedLocalAmt / toNumber(exRateInHeader);
          target.setValue(
            this.getFormattedAmount(partyAmount, currencyInMatchRow)
          );
        }
      }
    } else {
      target.setValue(this.getFormattedAmount(0, currencyInMatchRow));
    }
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
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Dr') {
          return total + Number(control.get('currAmt')?.value || 0);
        }
        return total - Number(control.get('currAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalLocalAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Dr') {
          return total + Number(control.get('localAmt')?.value || 0);
        }
        return total - Number(control.get('localAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalOSCurrAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Dr') {
          return total + Number(control.get('osCurrAmt')?.value || 0);
        }
        return total - Number(control.get('osCurrAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalOSLocalAmount() {
    return this.voucherMatchings.controls
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Dr') {
          return total + Number(control.get('osLocalAmt')?.value || 0);
        }
        return total - Number(control.get('osLocalAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalMatchCurrAmt() {
    const totalMatchCurrAmt = this.voucherMatchings.controls.reduce(
      (total, control) => {
        if (control.get('drCr')?.value === 'Dr') {
          return total + Number(control.get('matchCurrAmt')?.value || 0);
        }
        return total - Number(control.get('matchCurrAmt')?.value || 0);
      },
      0
    );
    return Number(totalMatchCurrAmt).toFixed(2);
  }

  getPartyDetailAmount() {
    const partyDetail = this.detailItems
      .getRawValue()
      .find((d) => d.LedgerMasterSid === this.r['PartyMasterSid']?.value);
    const amount = Number(partyDetail?.PartyAmount || 0);
    return amount.toFixed(2);
  }

  validatePartyMatchingAmount(): boolean {
    const totalMatchPartyAmt = toNumber(this.getTotalMatchPartyAmt());
    const partyDetailAmount = toNumber(this.getPartyDetailAmount());
    return totalMatchPartyAmt > partyDetailAmount;
  }

  getTotalMatchLocalAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Dr') {
          return total + Number(control.get('matchLocalAmt')?.value || 0);
        }
        return total - Number(control.get('matchLocalAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalMatchPartyAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Dr') {
          return total + Number(control.get('matchPartyAmt')?.value || 0);
        }
        return total - Number(control.get('matchPartyAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalTdsAmt() {
    return this.voucherMatchings.controls
      .reduce(
        (total, control) => total + Number(control.get('tdsAmt')?.value || 0),
        0
      )
      .toFixed(2);
  }

  /**
   * Select invoices from outstanding modal
   */
  applySelectedInvoices(): void {
    const selectedInvoices = this.outstandingInvoices.filter(
      (inv) => inv.selected
    );

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
          MatchedAmount: [
            amountToApply,
            [Validators.required, Validators.min(0)],
          ],
          CurrencyCode: [invoice.CurrencyCode],
          DrCr: [invoice.DrCr],
          Narration: [''],
          IsAdvance: [false],
        })
      );
    });

    this.recalculateTotalAmount();
    this.modalService.dismissAll();
    this.toastr.success(`${selectedInvoices.length} invoice(s) added`);
  }

  // Section-4 Helper
  getCurrentCompanyBranches() {
    const currentCompanyId = this.currentCompany?.CompanyMasterSid;
    const currentCompany = (this.userData.userCompanyMaster || []).find(
      (ucm) => ucm.CompanyMasterSid === currentCompanyId
    ).companyMaster;
    this.currentCompanyBranches = (currentCompany?.userBranchMaster || []).map(
      (ubm) => ubm.branchMaster
    );
    console.log(this.currentCompanyBranches);
  }

  get r(): { [key: string]: AbstractControl } {
    return this.receiptForm.controls || {};
  }

  get interBranches(): FormArray {
    return this.receiptForm.get('interBranches') as FormArray;
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
      })
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
  //   const customerSid = this.receiptForm.get('LedgerMasterSid')?.value;
  //   if (!customerSid) {
  //     this.toastr.warning('Please select a customer first');
  //     return;
  //   }

  //   try {
  //     // Use receipt service which calls outstanding service
  //     const invoices = await this.receiptService.getCustomerOutstanding(this.CompanyMasterSid, customerSid).toPromise();

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
      if (control.get('DrCr')?.value === 'Dr') {
        total += matchedAmount;
      } else {
        total -= matchedAmount;
      }
    });

    this.receiptForm.patchValue({
      TotalInvoiceAmount: total,
    });
  }

  /**
   * Calculate TDS amount
   */
  calculateTDS(): void {
    const hasTDS = this.receiptForm.get('HasTDS')?.value;
    if (!hasTDS) {
      this.receiptForm.patchValue({ TDSAmount: 0 });
      return;
    }

    const totalAmount = this.receiptForm.get('TotalInvoiceAmount')?.value || 0;
    const tdsPercentage = this.receiptForm.get('TDSPercentage')?.value || 0;

    const tdsAmount = this.receiptService.calculateTDS(
      totalAmount,
      tdsPercentage
    );
    this.receiptForm.patchValue({ TDSAmount: tdsAmount });
  }

  /**
   * Calculate net receipt amount
   */
  calculateNetAmount(): void {
    const totalAmount = this.receiptForm.get('TotalInvoiceAmount')?.value || 0;
    const tdsAmount = this.receiptForm.get('TDSAmount')?.value || 0;

    const netAmount = this.receiptService.calculateNetAmount(
      totalAmount,
      tdsAmount
    );
    this.receiptForm.patchValue({ NetReceiptAmount: netAmount });
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
    const field = this.receiptForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  onCurrencyChange(selected: any) {
    if (!selected) return;

    const currencySid = selected.CurrencyMasterSid;

    this.receiptForm.patchValue({
      CurrencyMasterSid: currencySid,
      CurrencyCode: selected.currencyCode,
    });

    this.handleHeaderExchangeRate(currencySid);
  }

  handleDetailExchangeRate(currencySid: number, index: number) {
    const row = this.detailItems.at(index) as FormGroup;
    const exCtrl = row.get('ExchangeRate');

    if (!currencySid) return;

    // SAME CURRENCY
    if (currencySid === this.currentCompany?.CurrencyMasterSid) {
      exCtrl?.setValue(1);
      exCtrl?.disable({ emitEvent: false });
      this.calculateLocalAmount(index);
      return;
    }

    // DIFFERENT CURRENCY
    exCtrl?.enable({ emitEvent: false });
    this.patchCurrencyExchangeRateForDetail(currencySid, index);
  }

  patchCurrencyExchangeRate() {
    const currencySid = this.receiptForm.get('CurrencyMasterSid')?.value;
    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    console.log('Entered patchCurrencyExchangeRate', {
      FromCurrencyId: currencySid,
      toCurrencyId: companyCurrency,
    });

    if (currencySid === companyCurrency && currencySid !== null) {
      this.receiptForm.patchValue({
        ExchangeRate: 1,
      });
      this.recalculateAllMatchingPartyAmounts();
      this.recalcPartyAmtForAllDetails();
      return;
    }

    const fromCurrencyCode = this.receiptForm.get('CurrencyCode')?.value;
    const toCurrencyCode = this.currencyList.find(
      (c) => c.CurrencyMasterSid === companyCurrency
    )?.currencyCode;
    if (!fromCurrencyCode || !toCurrencyCode) {
      return;
    }
    console.log('FINDING CURRENCY EXCHANGE', {
      fromCurrencyCode: fromCurrencyCode,
      toCurrencyCode: toCurrencyCode,
    });
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode,
      toCurrencyCode,
      EffectiveFrom: this.isEditMode
        ? new Date(this.receiptData?.VoucherDate)
        : new Date(),
      segment: 'revenue',
    };
    this.accountService.getExchangeRate(payload).subscribe((resp: any) => {
      if (resp?.status) {
        console.log('PATCHING EXCHANGE RATE', resp.data);
        if (resp.data) {
          this.receiptForm.patchValue({
            ExchangeRate: resp.data,
          });
        } else {
          this.receiptForm.patchValue({
            ExchangeRate: 0,
          });
          this.appSettingService.showError(resp.message);
        }
        this.recalculateAllMatchingPartyAmounts();
        this.recalcPartyAmtForAllDetails();
      } else {
        this.appSettingService.showError('Error fetching exchange rate');
      }
    });
  }

  onPartyChange(party: any) {
    console.log('Selected Party', party);
    const partyCountry = String(party?.countryMaster?.countryName)
      .trim()
      .toLowerCase();
    errorLogger(this.receiptForm);
    if (!party) {
      this.receiptForm.patchValue({
        PartyMasterSid: null,
        PartyName: '',
        PartyAddress: '',
        CustomerBranchSid: null,
        COAMasterSid: null,
        LedgerMasterSid: null,
        GST_VAT: '',
      });
      return;
    }
    this.receiptForm.patchValue({
      PartyMasterSid: party.SubledgerMasterSid,
      PartyName: party.CustomerName,
      PartyAddress: party.Address,
      CustomerBranchSid: party.CustomerBranchSid,
      COAMasterSid: party.COAMappedId,
      LedgerMasterSid: party.SubledgerMasterSid,
      GST_VAT:
        partyCountry === 'united arab emirates' ? party.PanType : party.GSTNo,
    });

    if (!this.r['BankPartyName']?.value) {
      this.r['BankPartyName']?.setValue(party.CustomerName);
    }
    console.log('FORM VALUE AFTER CUSTOMER SELECTED', this.receiptForm.value);
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
    const ctrl = this.receiptForm.get('MultiBranch');
    const element = event.target as HTMLInputElement;
    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      element.checked = !element.checked;
    }
    ctrl.setValue(element.checked);
    if (element.checked) {
      // Only add interBranch tab if not already present
      if (!this.tabs.find((t) => t.name === 'Interbranch')) {
        this.tabs.push({ name: 'Interbranch', icon: 'fas fa-flag-checkered' });
      }
      // Do not auto-populate interBranches; only add rows when user clicks "Add"
    } else {
      // Remove interBranch tab and clear form array
      this.tabs = this.tabs.filter((t) => t.name !== 'Interbranch');
      this.interBranches.clear();
    }
  }

  toggleCashOrBank(event: any) {
    const element = event.target as HTMLInputElement;
    const ctrl = this.receiptForm.get('CashOrBank');
    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      element.checked = !element.checked;
    }

    // Set the checkbox value in the form control
    ctrl.setValue(element.checked);

    // Reset the BankCOA field whenever the checkbox is toggled
    this.r['BankCOA']?.setValue(null);

    const mode = this.receiptForm.get('InstrumentMode');
    const number = this.receiptForm.get('InstrumentNumber');
    const date = this.receiptForm.get('InstrumentDate');

    // Reset the other form values for the instrument section
    this.receiptForm.patchValue({
      InstrumentMode: null,
      InstrumentNumber: '',
      InstrumentDate: null,
      ClearanceDate: null,
    });

    // Conditionally clear/set validators based on the checkbox
    if (element.checked) {
      // If "Cash" is checked, clear validators for instrument fields
      mode?.clearValidators();
      number?.clearValidators();
      date?.clearValidators();
    } else {
      // If "Bank" is unchecked, set validators for instrument fields
      mode?.setValidators([Validators.required]);
      number?.setValidators([Validators.required]);
      date?.setValidators([Validators.required]);
    }

    // Update the validity of the form controls
    mode?.updateValueAndValidity();
    number?.updateValueAndValidity();
    date?.updateValueAndValidity();
  }

  getExchangeRate(currency: number | string): Observable<number> {
    if (!currency) {
      return of(1);
    }

    if (typeof currency === 'string') {
      currency = this.currencyList.find(
        (curr) => curr.currencyCode === currency
      )?.CurrencyMasterSid;
    }
    const fromCurrencyId = currency as number;
    const toCurrencyId = this.currentCompany?.CurrencyMasterSid;

    console.log('CURRENCY EXCHANGE IDS', { fromCurrencyId, toCurrencyId });

    if (fromCurrencyId === toCurrencyId) {
      console.log('SAME CURRENCY FOUND ON EXCHANGE RATE');
      return of(this.getFormattedExchangeRate(1, fromCurrencyId));
    }

    const fromCurrencyCode = this.currencyList.find(
      (curr) => curr.CurrencyMasterSid === fromCurrencyId
    )?.currencyCode;
    const toCurrencyCode = this.currencyList.find(
      (curr) => curr.CurrencyMasterSid === toCurrencyId
    )?.currencyCode;

    console.log('CURRENCY EXCHANGE CODES', {
      fromCurrencyCode,
      toCurrencyCode,
    });

    if (!fromCurrencyCode || !toCurrencyCode) {
      console.log('NO CURRENCY CODE FOUND ON EXCHANGE RATE DEFAULTING TO 1');
      return of(this.getFormattedExchangeRate(1, fromCurrencyId));
    }

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode,
      toCurrencyCode,
      EffectiveFrom: this.isEditMode
        ? new Date(this.receiptData?.VoucherDate)
        : new Date(),
      segment: 'revenue',
    };

    return this.accountService.getExchangeRate(payload).pipe(
      map((resp: any) => {
        if (resp.status) {
          if (resp.data) {
            console.log('EXCHANGE RATE FOUND', resp.data);
            return this.getFormattedExchangeRate(resp.data, fromCurrencyId);
          } else {
            this.appSettingService.showError(resp.message);
            return this.getFormattedExchangeRate(0, fromCurrencyId);
          }
        } else {
          this.appSettingService.showError(resp.message);
          return this.getFormattedExchangeRate(0, fromCurrencyId);
        }
      }),
      catchError((err) => {
        console.error('Error fetching exchange rate', err);
        return of(this.getFormattedExchangeRate(0, fromCurrencyId));
      })
    );
  }

  calculateLocalAmount(index: number, recalcPartyAmount: boolean = false) {
    const row = this.detailItems.at(index) as FormGroup;
    const amount = Number(row.get('Amount')?.value);
    const exchangeRate = Number(row.get('ExchangeRate')?.value);
    const formattedExchangeRate = this.getFormattedExchangeRate(
      exchangeRate,
      row.get('CurrencyMasterSid')?.value
    );
    const formattedAmount = this.getFormattedAmount(
      amount,
      row.get('CurrencyMasterSid')?.value
    );

    let finalAmount;
    if (this.formatCurrencyAmountBeforeConcludingLocal) {
      finalAmount = Number(formattedAmount) * Number(formattedExchangeRate);
    } else {
      finalAmount = Number(amount) * Number(formattedExchangeRate);
    }
    row
      .get('LocalAmount')
      ?.setValue(
        this.getFormattedAmount(
          finalAmount,
          row.get('CurrencyMasterSid')?.value
        )
      );

    if (recalcPartyAmount) {
      this.recalcPartyAmtForDetail(index);
    }
  }

  recalcPartyAmtForAllDetails() {
    this.detailItems.controls.forEach((group, index) => {
      this.recalcPartyAmtForDetail(index);
    });
  }

  recalcPartyAmtForDetail(index: number) {
    const formGroup = this.detailItems.at(index) as FormGroup;
    const currencyInHeader = this.receiptForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    const exRateInHeader = this.receiptForm.get('ExchangeRate')?.getRawValue();

    const amount = formGroup.get('Amount')?.getRawValue();
    const localAmount = formGroup.get('LocalAmount')?.getRawValue();
    const currencyInMatchRow = formGroup
      .get('CurrencyMasterSid')
      ?.getRawValue();
    const target = formGroup.get('PartyAmount');
    console.log('DEBUG - Calculate Party Amount', {
      currencyInHeader,
      exRateInHeader,
      amount,
      localAmount,
      currencyInMatchRow,
    });
    if (currencyInHeader && currencyInMatchRow) {
      const normalizedAmt = toNumber(amount);
      const normalizedLocalAmt = toNumber(localAmount);
      const normalizedExRateInHeader = toNumber(exRateInHeader);
      if (!normalizedExRateInHeader) {
        target.setValue(this.getFormattedAmount(0, currencyInMatchRow));
      } else {
        if (currencyInHeader === currencyInMatchRow) {
          target.setValue(
            this.getFormattedAmount(normalizedAmt, currencyInMatchRow)
          );
        } else {
          const partyAmount = normalizedLocalAmt / toNumber(exRateInHeader);
          target.setValue(
            this.getFormattedAmount(partyAmount, currencyInMatchRow)
          );
        }
      }
    } else {
      target.setValue(this.getFormattedAmount(0, currencyInMatchRow));
    }
  }

  setCurrencyCode(CurrencyMasterSid: number) {
    if (!CurrencyMasterSid || this.currencyList.length === 0) return;
    const code = this.currencyList.find(
      (c) => c.CurrencyMasterSid === CurrencyMasterSid
    )?.currencyCode;
    this.r['CurrencyCode']?.setValue(code);
  }

  clearSearchFields(type: string) {
    this.searchOutstandingForm.patchValue({
      LedgerMasterSid: null,
      CustomerName: '',
      InvoiceNumber: '',
      HouseNumber: '',
      FilterText: '',
    });
  }

  /**
   * Get the number of decimal places allowed for amounts
   * Used with [decimalDigitsAfter] directive
   * Example: getAmountDecimalPlaces('USD') returns 2
   */
  public getAmountDecimalPlaces(CurrencyMasterSid: number): number {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid
    );
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(
        currency.currencyCode
      );
      return config?.amountDecimal;
    }
    return 2;
  }

  /**
   * Get the number of decimal places allowed for exchange rates
   * Example: getExchangeRateDecimalPlaces('USD') returns 3
   */
  public getExchangeRateDecimalPlaces(CurrencyMasterSid: string): number {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid
    );
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(
        currency.currencyCode
      );
      return config?.exchangeDecimal;
    }
    return 2;
  }
  /**
   * Get the number of decimal places allowed for exchange rates
   * Example: getExchangeRateDecimalPlaces('USD') returns 3
   */
  public getExchangeRateDecimalPlacesWithCode(CurrencyCode: string): number {
    if (CurrencyCode) {
      const config = this.currencyConfigService.getCurrencyConfig(CurrencyCode);
      return config?.exchangeDecimal;
    }
    return 2;
  }
  /**
   * Format an amount with currency symbol and comma separators
   * Example: getFormattedAmount(1234.56, 'USD') returns '$1,234.56'
   */
  public getFormattedAmount(amount: number, CurrencyMasterSid: number) {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid
    );
    const input = {
      value: amount,
      currencyCode: currency?.currencyCode,
    };
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
  public getFormattedExchangeRate(
    rate: number,
    CurrencyMasterSid: number
  ): number {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid
    );
    return this.currencyFormatService.formatExchangeRate({
      value: rate,
      currencyCode: currency?.currencyCode,
    });
  }

  validateAmount() {
    let totalCredits = 0;
    let totalDebits = 0;
    (this.detailItems.getRawValue() || []).forEach((vd) => {
      // console.log(vd)
      if (vd.DrCr === 'C') {
        totalCredits += Number(vd.PartyAmount) || 0;
      } else {
        totalDebits += Number(vd.PartyAmount) || 0;
      }
    });
    this.totalCredits = totalCredits || 0;
    this.totalDebits = totalDebits || 0;
  }

  showInfo() {
    if (!this.receiptData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.receiptData;
    modalRef.componentInstance.idLabel = 'Receipt ID';
    modalRef.componentInstance.idValue = this.receiptData?.VoucherHeaderSid;
  }

  openEDoc() {
    if (!this.receiptData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.screenName = 'Edoc';
    modalRef.componentInstance.formData = this.receiptData;
    modalRef.componentInstance.resetTrigger = false;
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.receiptData?.VoucherHeaderSid,
    };
    this.commonService.documentData.set(data);
  }

  openTandC() {
    if (!this.currentMenuId) {
      this.appSettingService.showError('Error: Menu ID not found.');
      return;
    }

    const payload = { MenuMasterSid: this.currentMenuId };

    const sub = this.loadTandC(payload).subscribe((termsData: any[]) => {
      if (termsData && termsData.length > 0) {
        this.TandCList = termsData;
        const modalRef = this.modalService.open(TermsAndConditionsComponent, {
          size: 'lg',
          backdrop: 'static',
          centered: true,
        });

        modalRef.componentInstance.terms = this.TandCList;
        modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
        modalRef.componentInstance.DocumentSid = this.headerId;
      } else {
        console.warn('No Terms and Conditions data found to display.');
      }
    });
  }

  loadTandC(payload: { MenuMasterSid: number }): Observable<any[]> {
    return this.accountService.getTandCByCondition(payload).pipe(
      map((resp: any) => {
        if (resp && resp.status) {
          return resp.data;
        }
        this.appSettingService.showError(
          'Failed to load Terms and Conditions: Invalid response'
        );
        return [];
      }),
      catchError((error) => {
        this.appSettingService.showError('Error loading Terms and Conditions');
        return of([]);
      })
    );
  }

  openEmail() {
    if (!this.receiptData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
  }

  openAuthority() {
    if (!this.currentMenuId) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.menuMasterSid = this.currentMenuId;
    modalRef.componentInstance.documentSid = this.headerId;
  }

  openFollowup() {
    const modalRef = this.modalService.open(FollowUpComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
  }

  reportBank() {
    const modalRef = this.modalService.open(BankReceiptComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.receiptPrintData = this.receiptPrintData || [];
    modalRef.componentInstance.currencyList = this.currencyList || [];
    modalRef.componentInstance.bankTypedLedgers = this.bankTypedLedgers || [];
  }

  reportCash() {
    const modalRef = this.modalService.open(CashReceiptComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.receiptPrintData = this.receiptPrintData || [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  getCurrencySidFromCode(code: string) {
    if (!code || !this.currencyList) return null;

    return (
      this.currencyList.find(
        (c) => c.currencyCode?.toUpperCase() === code.toUpperCase()
      )?.CurrencyMasterSid || null
    );
  }

  onTickMatch(index: number, event: any) {
    const checked = event.target.checked;
    const row = this.voucherMatchings.at(index) as FormGroup;

    if (!checked) {
      row.patchValue({
        // matchCurr: null,
        // matchExRate: null,
        matchCurrAmt: null,
        matchLocalAmt: null,
        matchPartyAmt: null,
      });
      this.markAsDirty();
      return;
    }

    const originalCurr = row.get('curr')?.value;
    const osCurrAmt = Number(row.get('osCurrAmt')?.value);
    const osLocalAmt = Number(row.get('osLocalAmt')?.value);
    const exRate = Number(row.get('exRate')?.value);

    console.log('originalCurr:', originalCurr);

    // FIXED HERE
    const currencySid = this.getCurrencySidFromCode(originalCurr);

    console.log('✔ FIXED currencySid:', currencySid);

    row.patchValue({
      matchCurr: currencySid,
      matchExRate: exRate,
      matchCurrAmt: osCurrAmt,
      matchLocalAmt: osLocalAmt,
    });
    this.calculatePartyAmount(index);
    row.get('isTicked')?.setValue(checked);
    this.markAsDirty();

    console.log('✔ PATCHED ROW:', row.value);

    // this.calculateLocalAmountForMatchRow(index);
  }
  validateMatchLimits(index: number) {
    const row = this.voucherMatchings.at(index) as FormGroup;

    const osCurr = Number(row.get('osCurrAmt')?.value || 0);
    const osLocal = Number(row.get('osLocalAmt')?.value || 0);

    const currAmt = Number(row.get('matchCurrAmt')?.value || 0);
    const localAmt = Number(row.get('matchLocalAmt')?.value || 0);

    // Skip check if ticked
    if (row.get('isTicked')?.value === true) return;

    // CONDITION VIOLATION
    const violatesCurr = currAmt > osCurr;
    const violatesLocal = localAmt > osLocal;

    if (violatesCurr || violatesLocal) {
      // SHOW ERROR ONLY ONCE
      if (!row.get('isLimitErrorShown')?.value) {
        const msg = `
        Matching Curr. Amount cannot be greater than OS Curr.
        Matching Local Amount cannot be greater than OS Local Amount.
      `;

        this.toastr.error(msg, 'Validation Error');

        row.patchValue({ isLimitErrorShown: true });

        // Set field errors
        row.get('matchCurrAmt')?.setErrors({ limitExceeded: true });
        row.get('matchLocalAmt')?.setErrors({ limitExceeded: true });
      }

      return; // do not clear error until corrected
    }

    // IF VALUE NOW VALID → RESET FLAG
    if (row.get('isLimitErrorShown')?.value) {
      row.patchValue({ isLimitErrorShown: false });
    }

    // Clear errors
    row.get('matchCurrAmt')?.setErrors(null);
    row.get('matchLocalAmt')?.setErrors(null);
  }

  isUAECompany() {
    return this.currentCompanyCountryCode === 'united arab emirates';
  }

  isUSACompany() {
    return this.currentCompanyCountryCode === 'united states';
  }

  isIndianCompany() {
    return this.currentCompanyCountryCode === 'india';
  }

  checkVoucherPostingMechanism() {
    const companyId = this.currentCompany?.CompanyMasterSid;
    const branchId = this.currentBranch?.BranchMasterSid;
    const menuName = 'Receipt';
    if (!companyId || !branchId || !menuName) {
      return;
    }
    this.accountService
      .checkVoucherPostingMechanism({
        CompanyMasterSid: companyId,
        BranchMasterSid: branchId,
        MenuName: 'Receipt',
      })
      .subscribe({
        next: (resp) => {
          if (resp.status) {
            this.isAutoPosting = Boolean(resp.data);
          } else {
            this.isAutoPosting = false;
          }
        },
        error: (error: any) => {
          console.error('Error checking voucher posting mechanism:', error);
        },
      });
  }
}
