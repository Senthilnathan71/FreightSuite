import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbDateStruct,
  NgbDropdownModule,
  NgbModal,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { ToastrService } from 'ngx-toastr';
import { ReceiptService } from '../../services/receipt.service';
import { OutstandingInvoice, PaymentMode } from '../../models/receipt.model';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { AccountsService } from '../../accounts.service';
import { errorLogger, getDefaultTodayDate, ngbDateStructToDate, toNgbDateStruct, toNumber } from 'src/app/common/helper';
import { VoucherPeriodValidationService, VoucherDateConstraints } from 'src/app/common/voucher-period-validation.service';
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
import { errorLoggerWithToastr, ValidationMessageConfig } from 'src/app/common/error-handling/form-error-handler';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';

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
    NgbTooltipModule,
  ],
  templateUrl: './receipt-entry.component.html',
  styleUrl: './receipt-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
  ],
})
export class ReceiptEntryComponent implements OnInit, AfterViewInit, HasUnsavedChanges {
  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;
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
  isReadOnly: boolean = false;
  isTermsAndConditionsEnabled: boolean = true;
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
  selectedPartyItemForSearch: any = null;
  currencyList: any[] = [];
  coaList: any[] = [];
  filteredCoaList: any[][] = [];
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

  // Infinite scroll + typeahead state for Master/House Job dropdowns
  private readonly JOB_BATCH_SIZE = 50;
  masterJobTypeahead$: Subject<string>[] = [];
  masterJobLoading: boolean[] = [];
  private masterJobSkip: number[] = [];
  private masterJobHasMore: boolean[] = [];
  private masterJobSearchTerm: string[] = [];
  houseJobTypeahead$: Subject<string>[] = [];
  houseJobLoading: boolean[] = [];
  private houseJobSkip: number[] = [];
  private houseJobHasMore: boolean[] = [];
  private houseJobSearchTerm: string[] = [];
  currentCompanyBranches: any[] = [];
  receiptPrintData: any;
  isLimitErrorShown: boolean = false;

  CustomerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  COALookupConfig = DROPDOWN_CONFIGS.COA_LEDGER;

  outstandingInvoices: OutstandingInvoice[] = [];
  selectedInvoices: OutstandingInvoice[] = [];
  paymentModes: { value: string; label: string }[] = [];
  isAutoPosting: boolean = false;
  private autoPostingCache: Record<string, boolean> = {};
  voucherMatchingInfo: {
    VoucherMatchingHeaderSid: number;
    VoucherMatchingNo: string;
  };

  receiptValidationConfig: ValidationMessageConfig = {
  labels: {
    // Header
    VoucherDate: 'Voucher Date',
    CashOrBank: 'Cash / Bank',
    BankCOA: 'Bank / Cash Account',
    CurrencyMasterSid: 'Currency',
    ExchangeRate: 'Exchange Rate',

    // Party
    PartyMasterSid: 'Party',
    COAMasterSid: 'Party Ledger',
    GST_VAT: 'GST/VAT',
    BankPartyName: 'Bank Party Name',
    Narration: 'Narration',
    InstrumentMode: 'Payment Mode',
    InstrumentNumber: 'Instrument Number',
    InstrumentDate: 'Instrument Date',
    ClearanceDate: 'Clearance Date',

    // Detail Items (FormArray)
    // COAMasterSid: 'Ledger',
    LedgerMasterSid: 'Subledger',
    DrCr: 'Dr / Cr',
    // CurrencyMasterSid: 'Currency',
    CurrencyCode: 'Currency Code',
    // ExchangeRate: 'Exchange Rate',
    Amount: 'Amount',
    LocalAmount: 'Local Amount',
    NumberOfUnit: 'No. of Units',
    Rate: 'Rate',
    // Narration: 'Narration',
    DepartmentMasterSid: 'Department',
    HSSACMasterSid: 'HS / SAC Code',
    ChargeMasterSid: 'Charge',
    ChargeDescription: 'Charge Description',
    ChargeUomSid: 'Unit',
    MasterJobSid: 'Master Job',
    HouseJobSid: 'House Job',
  },

  messages: {
    required: (label: string) => `${label} is mandatory`,

    minlength: (label: string, error: any) =>
      `${label} must be at least ${error.requiredLength} characters`,

    maxlength: (label: string, error: any) =>
      `${label} cannot exceed ${error.requiredLength} characters`,

    min: (label: string, error: any) =>
      `${label} must be greater than or equal to ${error.min}`,

    max: (label: string, error: any) =>
      `${label} must be less than or equal to ${error.max}`,

    pattern: (label: string) =>
      `${label} format is invalid`,

    default: (label: string) =>
      `${label} is invalid`,
  },
};

  // Outstanding invoices

  get isEditMode() {
    return !!this.headerId && !this.isViewMode;
  }

  @ViewChild('searchModal') searchModal!: TemplateRef<any>;
  @ViewChild('matchingSentinel') matchingSentinel!: ElementRef;
  @ViewChild('matchingScrollContainer') matchingScrollContainer!: ElementRef;
  private matchingObserver!: IntersectionObserver;
  private matchingSkip = 0;
  private readonly MATCHING_BATCH_SIZE = 30;
  hasMoreMatchingData = false;
  isLoadingMatching = false;
  private currentSearchPayload: any = null;

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

  modeOfPayment = [
    { label: 'Cash', value: 'C' },
    { label: 'Bank', value: 'B' }
  ]

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

  // Voucher period constraints
  voucherConstraints: VoucherDateConstraints = {
    isClosed: false, errorMessage: null
  };

  private isLoading = false;
  private previousBankCoaSid: number | null = null;

  // Unsaved changes related variable declarations
  isDirty: boolean = false;
  private initialFormValue: any = null;

  get hasMatchingDetails(): boolean {
    return this.voucherMatchings?.length > 0;
  }

  constructor(
    public mps: MenuPermissionService,
    private commonService: CommonService,
    private datePipe : CustomDatePipe,
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
    private companySettings: CompanySettingsManagerService,
    private voucherPeriodService: VoucherPeriodValidationService,
    private confirmService: ModalService,
    private cdr: ChangeDetectorRef,
    private masterService: MasterService
  ) {}

  ngOnInit(): void {
    this.userData = this.appSettingService.getDecryptedUserProfile();

    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    this.currentCompanyCountryCode = String(
      this.appSettingService.getCurrentCompanyCountry()?.countryCode
    ).toLowerCase();
    this.currentYearId = Number(localStorage.getItem('current-year-id'));

    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy) {
      this.fyMinDate = toNgbDateStruct(fy.StartDate);
      const fyEnd = new Date(fy.EndDate);
      const today = getDefaultTodayDate();
      this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
    }

    this.currentMenuId = this.mps.getMenuId();
    this.companyCurrency = this.companySettings.getCurrencySettings();
    this.currentCurrencyCode = this.companyCurrency.code;
    this.getCurrentCompanyBranches();

    this.currentBranch = this.appSettingService.getCurrentBranchInfo();
    this.loadTermsAndConditionsConfig();
    this.mps.init().subscribe();
    this.checkVoucherPostingMechanism('B');
    this.initSearchOutstandingForm();
    this.initializeForm();
    this.loadPaymentModes();
    this.loadDetailLookups();
    this.loadVoucherPeriods();

    // Check if editing existing receipt
    const receiptId = this.route.snapshot.params['id'];
    if (receiptId) {
      this.headerId = Number(receiptId);
    }

    // Load currencies first, then fetch the receipt so currencyList
    // is always populated before patchValues runs.
    this.loadAllLookups().subscribe(() => {
      if (this.headerId) {
        this.loadReceipt(this.headerId);
      } else {
        this.subscribeToPartyAndBankChanges();
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.isPosted) this.setupMatchingObserver();
  }

  private loadTermsAndConditionsConfig(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) {
      this.isTermsAndConditionsEnabled = true;
      return;
    }

    this.masterService.getConfigurationValue(companyId, 'TermsandConditions').subscribe({
      next: (resp: any) => {
        const rawValue = resp?.ConfigurationValue ?? resp?.value ?? resp;
        this.isTermsAndConditionsEnabled = this.parseConfigBoolean(rawValue, true);
        this.cdr.markForCheck();
      },
      error: () => {
        // Default to enabled if config fetch fails
        this.isTermsAndConditionsEnabled = true;
        this.cdr.markForCheck();
      }
    });
  }

  private parseConfigBoolean(value: any, defaultValue: boolean): boolean {
    if (value === true || value === false) return value;
    if (value === null || value === undefined) return defaultValue;
    const normalized = String(value).trim().toUpperCase();
    if (['Y', 'YES', 'TRUE', '1'].includes(normalized)) return true;
    if (['N', 'NO', 'FALSE', '0'].includes(normalized)) return false;
    return defaultValue;
  }

  private setupMatchingObserver(): void {
    this.reobserveMatchingSentinel();
  }

  private reobserveMatchingSentinel(): void {
    if (this.matchingSentinel?.nativeElement) {
      this.matchingObserver?.disconnect();
      this.matchingObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) this.loadMatchingData();
        },
        { root: this.matchingScrollContainer?.nativeElement, threshold: 0.1 }
      );
      this.matchingObserver.observe(this.matchingSentinel.nativeElement);
    }
  }

  subscribeToFormChanges() {
    this.receiptForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.receiptForm.getRawValue()
        );
      });
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }

    // Handle Date
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]; // DATE only
    }

    // Handle numeric strings and numbers
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) {
      return Number(value);
    }

    if (typeof value === 'number') {
      return Number(value.toFixed(6)); // prevent float noise
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(v => this.normalizeValue(v));
    }

    // Handle objects
    if (typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc: any, key) => {
          acc[key] = this.normalizeValue(value[key]);
          return acc;
        }, {});
    }

    return value;
  }

  deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }

  loadVoucherPeriods(): void {
    this.voucherPeriodService.loadPeriods(
      this.currentCompany?.CompanyMasterSid,
      this.currentBranch?.BranchMasterSid,
      this.currentYearId,
      () => this.applyVoucherDateConstraints()
    );
  }

  applyVoucherDateConstraints(): void {
    const voucherDate = this.receiptForm?.get('VoucherDate')?.value;
    this.voucherConstraints = this.voucherPeriodService.applyConstraints(voucherDate, 'AR');
  }

  onVoucherDateChange(): void {
    this.applyVoucherDateConstraints();

    const currencySid = this.receiptForm.get('CurrencyMasterSid')?.getRawValue();
    if (!currencySid) return;

    // Re-fetch header exchange rate for foreign currencies
    // (patchCurrencyExchangeRate also calls checkAndUpdateForAllPartyDetail
    //  and recalculateAllMatchingPartyAmounts after the API response)
    if (currencySid !== this.currentCompany?.CurrencyMasterSid) {
      this.patchCurrencyExchangeRate();
    }

    // Re-fetch exchange rates for non-party detail rows with foreign currencies
    for (let i = 0; i < this.detailItems.length; i++) {
      if (this.isAutoPartyRow(i)) continue; // party row is synced inside patchCurrencyExchangeRate
      const row = this.detailItems.at(i) as FormGroup;
      const detailCurrencySid = row.get('CurrencyMasterSid')?.getRawValue();
      if (detailCurrencySid && detailCurrencySid !== this.currentCompany?.CurrencyMasterSid) {
        this.patchCurrencyExchangeRateForDetail(detailCurrencySid, i);
      }
    }
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
    const today = getDefaultTodayDate();
    const fyDefault = this.appSettingService.getCurrentFinancialYear();
    const defaultVoucherDate = fyDefault && (today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)) ? fyDefault.EndDate : today;

    this.receiptForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }], // Receipt Number
      VoucherDate: [defaultVoucherDate], // Receipt Date
      MultiBranch: [{ value: false, disabled: true }],
      CashOrBank: ['B'],      // B - Bank / C - Cash
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
      Narration: ['', [Validators.required, Validators.maxLength(300)]],
      Remarks: ['', [Validators.maxLength(100)]],
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
      'InstrumentDate',
      'InstrumentNumber',
      'BankPartyName',
    ].forEach((ctrl) => {
      this.receiptForm.get(ctrl)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.updateDetailNarration();
      });
    });
    ['detailItems', 'voucherMatchings'].forEach((ctrl) => {
      this.receiptForm.get(ctrl)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.validateAmount();
      });
    });

    this.receiptForm.setValidators(
      consistentExchangeRatesValidator(
        companyCurrency,
        this.currentCurrencyCode
      )
    );
    this.receiptForm.updateValueAndValidity();

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
      exCtrl?.setValue(this.getFormattedAndPaddedExchangeRate(1, currencySid));
      exCtrl?.disable({ emitEvent: false });
      this.checkAndUpdateForAllPartyDetail();
      this.recalculateAllMatchingPartyAmounts();
      return;
    }

    // DIFFERENT CURRENCY
    exCtrl?.enable({ emitEvent: false });

    this.patchCurrencyExchangeRate(); // existing API call
  }


  loadAllLookups(): Observable<void> {
    const filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };

    // Parties and ledgers load in the background — do not block receipt loading.
    forkJoin({
      parties: this.accountService
        .getAllDebtorWithCOAMapped(filterOption)
        .pipe(catchError(() => of([]))),
      bankTypedLedgers: this.accountService
        .getAllLedgersByItsType({
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          LedgerType: 'Bank',
          filterNonJob: true,
        })
        .pipe(catchError(() => of([]))),
      cashTypeLedgers: this.accountService
        .getAllLedgersByItsType({
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          LedgerType: 'Cash',
          filterNonJob: true,
        })
        .pipe(catchError(() => of([]))),
    }).subscribe(({ parties, bankTypedLedgers, cashTypeLedgers }) => {
      this.partyList = Array.isArray(parties?.data) ? parties.data : [];
      this.bankTypedLedgers = Array.isArray(bankTypedLedgers?.data) ? bankTypedLedgers.data : [];
      this.cashTypeLedgers = Array.isArray(cashTypeLedgers?.data) ? cashTypeLedgers.data : [];

      const cusMap = new Map<number, any>();
      this.partyList.forEach((customer) => {
        cusMap.set(customer.CustomerMasterSid, customer);
      });
      this.onlyCustomerList = Array.from(cusMap.values());
    });

    // Only currencies block the returned observable so that receipt
    // loading is always deferred until currencyList is populated.
    return this.dropdownStore.loadCurrencies().pipe(
      catchError(() => of([])),
      tap((currencies) => {
        this.currencyList = (currencies || []).map((c) => ({
          ...c,
          countryName: c?.countryMaster?.countryName,
        }));
        this.currencyConfigService.initializeConfigurations(this.currencyList);
        const companyCurrency = this.r['CurrencyMasterSid']?.getRawValue();
        this.setCurrencyCode(companyCurrency);

        if (!this.isEditMode) {
          // Snapshot after currencies are loaded (create mode only).
          // Parties/ledgers are dropdown options only and do not affect form values.
          setTimeout(() => {
            this.initialFormValue = this.receiptForm.getRawValue();
            this.isDirty = false;
            this.subscribeToFormChanges();
          }, 0);
        }
      }),
      map(() => void 0),
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
          filterNonJob: true,
          VoucherType: 'RPT'
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
        this.rebuildFilteredCoaListForAllRows();
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

  onPartySearchSelect(item: any): void {
    this.selectedPartyItemForSearch = item ?? null;
    this.searchOutstandingForm.get('LedgerMasterSid')?.setValue(item?.SubledgerMasterSid ?? null);
  }

  async searchOutstanding() {
    const form = this.searchOutstandingForm.getRawValue();

    let payload: any = {
      CompanyMasterSid: form.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      IncludeFullyPaid: form.IncludeFullyPaid,
      LedgerType: 'Sy Dr',
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

    if(this.isEditMode && !this.isPosted && form.SearchType === 'Party' && form.LedgerMasterSid !== this.r['PartyMasterSid']?.getRawValue() && this.hasMatchingDetails) {
      this.appSettingService.showWarning(`Already a party ${this.r['PartyName']?.getRawValue()} involved in this receipt. \nCannot select a different one.`);
      return;
    }

    // In create mode, if matchings already exist for a different party, confirm before proceeding
    if (!this.isEditMode && this.voucherMatchings?.length > 0) {
      const currentPartyInHeader = this.r['PartyMasterSid']?.getRawValue();
      const newPartyInSearch = form.SearchType === 'Party' ? form.LedgerMasterSid : null;

      // Different party (or invoice search which may resolve to a different party)
      if (newPartyInSearch !== currentPartyInHeader || form.SearchType !== 'Party') {
        const confirmed = await this.confirmService.confirm(
          'Changing the party will clear all voucher matchings. Do you want to proceed?',
          'Change Party',
          'Clear & Proceed'
        );
        if (!confirmed) {
          return;
        }
        this.voucherMatchings.clear();
        this.updateDetailAmountsFromMatching();
      }
    }

    // Reset pagination for the new search; existing matched rows are preserved
    this.matchingSkip = 0;
    this.hasMoreMatchingData = true;
    this.currentSearchPayload = payload;

    this.spinner.show();
    this.loadMatchingData();
  }

  loadMatchingData() {
    if (this.isLoadingMatching || !this.hasMoreMatchingData || !this.currentSearchPayload) return;
    this.isLoadingMatching = true;

    const paginatedPayload = {
      ...this.currentSearchPayload,
      Skip: this.matchingSkip,
      Take: this.MATCHING_BATCH_SIZE,
    };

    this.receiptService.searchOutstandingInvoices(paginatedPayload).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : [];
        if (data.length > 0) {
          if (this.matchingSkip === 0) {
            this.patchHeaderValue(data);
          }
          this.appendMatchingRows(data);
          this.matchingSkip += data.length;
          this.hasMoreMatchingData = data.length >= this.MATCHING_BATCH_SIZE;
        } else {
          if (this.matchingSkip === 0) {
            const searchType = this.searchOutstandingForm.get('SearchType')?.value;
            this.appSettingService.showError(
              `No outstanding found for this ${searchType}.`
            );
          }
          this.hasMoreMatchingData = false;
        }
        this.isLoadingMatching = false;
        this.spinner.hide();
        if (this.hasMoreMatchingData) {
          setTimeout(() => this.reobserveMatchingSentinel(), 100);
        }
      },
      error: () => {
        this.isLoadingMatching = false;
        this.spinner.hide();
      },
    });
  }

  /**
   * Append matching rows without clearing existing ones (for infinite scroll)
   */
  private appendMatchingRows(transactions: any[]): void {
    const searchType = this.searchOutstandingForm.get('SearchType')?.value;

    // Collect VoucherTransactionSids already in the list so we don't duplicate them
    const existingSids = new Set(
      this.voucherMatchings.controls.map(c => c.get('VoucherTransactionSid')?.value)
    );

    transactions.forEach((tx) => {
      // Skip rows that are already present (e.g. from a previous Get OS call)
      if (existingSids.has(tx.VoucherTransactionSid)) return;

      const isMatchedRecord = !!tx.MatchingDetailSid;
      const matchCurrencyForThisTxn = this.currencyList.find(
        (c) => c.currencyCode === tx.CurrencyCode
      )?.CurrencyMasterSid;
      const txCurrencySid = matchCurrencyForThisTxn || null;
      const form = this.fb.group({
        VoucherMatchingHeaderSid: [tx.VoucherMatchingHeaderSid || null],
        MatchingDetailSid: [tx.MatchingDetailSid || null],
        VoucherMatchingSid: [tx.VoucherMatchingSid || null],
        VoucherTransactionSid: [tx.VoucherTransactionSid],
        VoucherHeaderSid: [tx.VoucherHeaderSid],
        VoucherDetailSid: [tx.VoucherDetailSid],
        LedgerMasterSid: [tx.LedgerMasterSid],
        COAMasterSid: [tx.COAMasterSid],

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

        curr: [tx.CurrencyCode],
        currAmt: [tx.OriginalCurrencyAmount],
        localAmt: [tx.OriginalLocalAmount],

        osCurrAmt: [tx.OutstandingCurrencyAmount],
        osLocalAmt: [tx.OutstandingLocalAmount],

        exRate: [this.getFormattedAndPaddedExchangeRate(tx.ExchangeRate || 1, txCurrencySid)],

        matchCurr: [{
          value : isMatchedRecord ? tx.MatchingCurrency : matchCurrencyForThisTxn,
          disabled : true
        }],
        matchExRate: [{
          value : this.getFormattedAndPaddedExchangeRate(
            isMatchedRecord ? tx.MatchingExRate : tx.ExchangeRate || 0,
            isMatchedRecord ? tx.MatchingCurrency : txCurrencySid
          ),
          disabled : true
        }],
        matchCurrAmt: [
          isMatchedRecord
            ? tx.MatchingAmount
            : null,
        ],
        matchLocalAmt: [
          isMatchedRecord
            ? tx.MatchingLocalAmount
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
        const osLocalAmt = form.get('osLocalAmt')?.value || 0;
        const balance = Number(osLocalAmt - val).toFixed(2);
        form.get('balance')?.setValue(Number(balance || 0));
      });
      this.voucherMatchings.push(form);
    });
  }

  patchHeaderValue(res: any) {
    // skipConfirmation = true because searchOutstanding() already handled the
    // party-change confirmation before the API call was made
    if (
      res.length > 0 &&
      res[0].LedgerMasterSid &&
      this.searchOutstandingForm.get('SearchType')?.value === 'Invoice'
    ) {
      const party = this.partyList.find(
        (p) => p.SubledgerMasterSid === res[0].LedgerMasterSid
      );
      if (this.isEditMode &&
        this.searchOutstandingForm.get('SearchType').getRawValue() === 'Party' &&
        res[0].LedgerMasterSid !== this.r['PartyMasterSid']?.getRawValue()
      ) {
        this.appSettingService.showWarning(`Already a party ${this.r['PartyName']?.getRawValue()} involved in this receipt. \nCannot select a different one.`);
        return;
      }
      this.onPartyChange(party, true);
      this.searchOutstandingForm.get('LedgerMasterSid')?.disable();
      this.receiptForm.get('PartyMasterSid')?.disable();
    } else if (
      res.length > 0 &&
      this.searchOutstandingForm.get('SearchType')?.value === 'Party' &&
      this.searchOutstandingForm.get('LedgerMasterSid')?.value
    ) {
      this.onPartyChange(this.selectedPartyItemForSearch, true);
      this.receiptForm.get('PartyMasterSid')?.disable();
    }
  }

  onSubmit(resolve?: (value: boolean) => void, isPostingTrue?: boolean) {
    // Validate voucher date is within financial year
    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy) {
      const voucherDate = new Date(this.receiptForm.getRawValue().VoucherDate);
      const fyStart = new Date(fy.StartDate);
      const fyEnd = new Date(fy.EndDate);
      if (voucherDate < fyStart || voucherDate > fyEnd) {
        this.appSettingService.showWarning(
          `Voucher date must be within the financial year (${fy.YearName})`
        );
        if (resolve) resolve(false);
        return;
      }
    }

    // Re-validate voucher date constraints at save time (edit mode may have stale state)
    this.applyVoucherDateConstraints();
    // Block save if voucher period grace days exceeded or module closed
    if (this.voucherConstraints.isClosed) {
      this.appSettingService.showWarning(this.voucherConstraints.errorMessage);
      if (resolve) resolve(false);
      return;
    }

    const raw = this.receiptForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.receiptForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    this.isSaving = true;
    const formValue = raw;
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

    const zeroLocalAmountIndex = detailItems.findIndex(
      (d) => isNaN(Number(d.LocalAmount)) || Number(d.LocalAmount) <= 0
    );
    if (zeroLocalAmountIndex !== -1) {
      this.appSettingService.showError(
        `Row ${zeroLocalAmountIndex + 1}: Local Amount must be greater than zero.`
      );
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
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

    if (this.totalCredits < 0) {
      this.appSettingService.showError(
        'Credit amount cannot be negative.'
      );
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
    }

    if (this.totalDebits < 0) {
      this.appSettingService.showError(
        'Debit amount cannot be negative.'
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

    const matchingHappened = (this.voucherMatchings.getRawValue() || []).some(mt => toNumber(mt.matchCurrAmt) || toNumber(mt.matchLocalAmt));
    if(matchingHappened && toNumber(this.getTotalMatchPartyAmt()) < 0) {
      this.appSettingService.showError(
        'Please make sure the matching amount is greater or equal to zero.'
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
      errorLoggerWithToastr(this.receiptForm,this.toastr,this.receiptValidationConfig);
      this.receiptForm.markAllAsTouched();
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
    }

    const currentUserEmail =
      this.appSettingService.userSettingSource.value['userEmail'];

    const currentCompanyState = Number(this.currentBranch?.StateMasterSid);
    const customerBranchFromForm = Number(formValue.CustomerBranchSid);
    const customerState = this.partyList.find(
      (c) => c.CustomerBranchSid === customerBranchFromForm
    )?.StateMasterSid;
    let interOrIntra = 'Inter';
    if (this.currentCompanyCountryCode === 'in') {
      if (currentCompanyState === customerState) {
        interOrIntra = 'Inter';
      } else {
        interOrIntra = 'Intra';
      }
    }

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
      updatedBy: currentUserEmail
    }));

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      CashOrBank: formValue.CashOrBank,
      MultiBranch: formValue.MultiBranch ? 'Y' : 'N',
      VoucherDate: formValue.VoucherDate,
      YearMasterSid: this.currentYearId,
      Narration: formValue.Narration,
      PartyMasterSid: formValue.PartyMasterSid,
      PartyName: formValue.PartyName,
      PartyAddress: formValue.PartyAddress,
      CustomerBranchSid: formValue.CustomerBranchSid,
      PlaceOfSupply: formValue.PlaceOfSupply,
      State: interOrIntra,
      COAMasterSid: formValue.COAMasterSid,
      BankCOA: formValue.BankCOA,
      BankPartyName: formValue.BankPartyName,
      GST_VAT: formValue.GST_VAT,
      ReversalVoucher: formValue.ReversalVoucher,
      TaxNumber: formValue.TaxNumber,
      GSTType: this.currentCompanyCountryCode !== 'in' ? 'VAT' : (formValue.GSTType || ''),
      Remarks: formValue.Remarks,
      CurrencyMasterSid: formValue.CurrencyMasterSid,
      CurrencyCode: formValue.CurrencyCode,
      ExchangeRate: formValue.ExchangeRate,
      Amount: 0,
      LocalAmount: 0,
      NetAmount: 0,
      TaxType:
        this.currentCompanyCountryCode === 'in' ? 'GST' : 'VAT',
      InstrumentMode: formValue.InstrumentMode,
      InstrumentNumber: formValue.InstrumentNumber,
      InstrumentDate: formValue.InstrumentDate,
      ClearanceDate: formValue.ClearanceDate,
      detailItems: detailItems.map((d,index) => {
        const isBankRecord = d.COAMasterSid === formValue.BankCOA;
        return {
          ...d,
          Sno : index + 1,
          Narration : d.Narration || formValue.Narration,
        };
      }),
      voucherMatching: voucherMatching,
      ...(this.isEditMode
        ? {
            UpdatedBy: currentUserEmail,
          }
        : {
            CreatedBy: currentUserEmail,
            LocalCurrencyMasterSid: Number(this.currentCompany?.CurrencyMasterSid),
            LocalCurrencyCode: this.companyCurrency?.code,
            current_date: getDefaultTodayDate(),
            TaxDetails: {
              CountryMasterSid: Number(this.currentCompany?.CountryMasterSid),
              countryCode: this.currentCompanyCountryCode,
              TaxCategory: interOrIntra,
              EffectiveFrom: new Date().toISOString(),
              TaxType: 'Output',
            },
          }),
    };

    this.spinner.show();
    if (this.isEditMode) {
      this.accountService.updateReceiptById(this.headerId, payload).subscribe({
        next: (resp: any) => {
          this.isSaving = false;
          if (resp.status) {
            this.isDirty = false;
            this.appSettingService.showSuccess(resp.message);
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
          this.appSettingService.showError('Failed to update receipt.');
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
            this.appSettingService.showSuccess(resp.message);
            if (resp.data?.isAutoPosted) {
              this.receiptData = { ...this.receiptData, PostStatus: 'P' };
            }
            this.spinner.hide();
            this.isDirty = false;
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

  async postVoucher(notFromSubmit: boolean = false) {
    if (this.isSaving) return;
    this.applyVoucherDateConstraints();
    if (this.voucherConstraints.isClosed) {
      this.appSettingService.showWarning(this.voucherConstraints.errorMessage);
      return;
    }
    try {
      this.isSaving = true;
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
        LocalCurrencyCode: this.companyCurrency.code,
        current_date : getDefaultTodayDate(),
        PostedBy: currentUserEmail,
        TaxDetails: {
          CountryMasterSid: currentCompanyCountry,
          countryCode: this.currentCompanyCountryCode,
          TaxCategory: interOrIntra,
          EffectiveFrom: new Date().toISOString(),
          TaxType: 'Output',
        },
      };

      const result = await firstValueFrom(
        this.receiptService.postReceipt(postPayload)
      );

      this.spinner.hide();
      this.isSaving = false;
      if (result.status) {
        this.appSettingService.showSuccess(result.message);
        this.receiptData.PostStatus = 'P';
        if (notFromSubmit) {
          this.loadReceipt(this.headerId);
        }
      } else {
        this.spinner.hide();
        this.isSaving = false;
        this.appSettingService.showError(result.message);
      }
    } catch (error) {
      this.spinner.hide();
      this.isSaving = false;
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
          this.applyVoucherDateConstraints();
          this.receiptPrintData = resp.data;
          this.voucherMatchingInfo = resp.data?.VoucherMatchingHeader?.[0];
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
        CashOrBank: headerInfo.CashOrBank,
        MultiBranch: headerInfo.MultiBranch === 'Y',
        VoucherDate: headerInfo.VoucherDate,
        BankCOA: headerInfo.BankCOA,
        CurrencyMasterSid: headerInfo.CurrencyMasterSid,
        CurrencyCode: headerInfo.CurrencyCode,
        ExchangeRate: this.getFormattedAndPaddedExchangeRate(headerInfo.ExchangeRate, headerInfo.CurrencyMasterSid),
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
    // If currencyList is already loaded, resolve the code from the list.
    // If not yet loaded, loadAllLookups will call setCurrencyCode once currencies arrive.
    this.setCurrencyCode(headerInfo.CurrencyMasterSid);

    // In edit mode, restrict the date picker to the original document's month
    const _receiptOrigDate = new Date(headerInfo.VoucherDate);
    if (!isNaN(_receiptOrigDate.getTime())) {
      const _y = _receiptOrigDate.getFullYear(), _m = _receiptOrigDate.getMonth() + 1;
      const _monthEnd = new Date(_y, _m, 0);
      const _today = new Date(); _today.setHours(0, 0, 0, 0);
      const _effectiveEnd = _monthEnd < _today ? _monthEnd : _today;
      this.fyMinDate = { year: _y, month: _m, day: 1 };
      this.fyMaxDate = { year: _effectiveEnd.getFullYear(), month: _effectiveEnd.getMonth() + 1, day: _effectiveEnd.getDate() };
    }

    this.previousPartyBranchSid = headerInfo.CustomerBranchSid;
    this.searchOutstandingForm.get('LedgerMasterSid')?.setValue(headerInfo.PartyMasterSid);

    if (headerInfo.GST_VAT) {
      this.receiptForm.get('GST_VAT')?.disable({ emitEvent: false });
    }

    this.receiptForm.get('CashOrBank')?.disable({ emitEvent: false });

    // Re-check auto posting for the loaded CashOrBank value
    this.checkVoucherPostingMechanism(headerInfo.CashOrBank);

    if(headerInfo.CashOrBank === 'C'){
      this.receiptForm.get('InstrumentMode')?.clearValidators();
      this.receiptForm.get('InstrumentMode')?.updateValueAndValidity();
      this.receiptForm.get('InstrumentNumber')?.clearValidators();
      this.receiptForm.get('InstrumentNumber')?.updateValueAndValidity();
      this.receiptForm.get('InstrumentDate')?.clearValidators();
      this.receiptForm.get('InstrumentDate')?.updateValueAndValidity();
    }
    this.isPosted = response.PostStatus === 'P';
    this.isReadOnly = response.PostStatus !== 'U' || response.Status !== 'A';

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

    // Update filtered COA list based on loaded data
    this.rebuildFilteredCoaListForAllRows();

    // Lock auto-inserted party/bank rows in edit mode
    for (let i = 0; i < this.detailItems.length; i++) {
      if (this.isAutoPartyRow(i) || this.isAutoBankRow(i)) {
        ['COAMasterSid', 'LedgerMasterSid', 'DrCr', 'CurrencyMasterSid', 'CurrencyCode'].forEach(field => {
          this.detailItems.at(i).get(field)?.disable({ emitEvent: false });
        });
      }
    }

    // const voucherMatchingHeader = response.voucherMatchingHeader || [];
    const voucherMatchingRecords = response.voucherMatchings || [];
    this.patchOutstandingFormArray(voucherMatchingRecords);

    if (this.isReadOnly) {
      this.isDirty = false;
      this.initialFormValue = this.receiptForm.getRawValue();
      this.destroy$.next();
      this.destroy$.complete();
      this.receiptForm.disable();
      return;
    }

    // unsaved changes related — allow all recalculations to settle before snapshotting
    this.isLoading = true;
    setTimeout(() => {
      this.initialFormValue = this.receiptForm.getRawValue();
      this.isDirty = false;
      this.isLoading = false;
      this.subscribeToFormChanges();
      this.subscribeToPartyAndBankChanges();
    }, 1000);
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
    this.router.navigate(['/accounts/receipt/list']);
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
      ExchangeRate: [this.getFormattedAndPaddedExchangeRate(data?.ExchangeRate || 0, data?.CurrencyMasterSid || null), Validators.required],

      NumberOfUnit: [data?.NumberOfUnit || 1.0],
      Rate: [data?.Rate || 1],
      Amount: [data?.Amount || 0.0, Validators.required],
      LocalAmount: [data?.LocalAmount || 0.0, Validators.required],

      Narration: [data?.Narration || '', [Validators.maxLength(300)]],
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
      Remarks: [data?.Remarks || '', [Validators.maxLength(100)]],
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

    const lastAddedRow = this.detailItems.length - 1;
    this.initJobSearchState(lastAddedRow);
    this.filteredCoaList[lastAddedRow] = this.getFilteredCoaListForRow(lastAddedRow);
    this.checkAndUpdateForPartyDetail(lastAddedRow, syncExRate);
    const currencySid = newRow.get('CurrencyMasterSid')?.value;
    if (syncExRate) {
      this.handleDetailExchangeRate(currencySid, lastAddedRow);
    }
  }

  checkAndUpdateForAllPartyDetail(patchRequired: boolean = true) {
    for (let i = 0; i < this.detailItems.length; i++) {
      this.checkAndUpdateForPartyDetail(i, patchRequired);
    }
  }

  checkAndUpdateForPartyDetail(detailIndex: number, patch: boolean = true) {
    const detail = this.detailItems.at(detailIndex) as FormGroup;
    const headerPartyValue = this.receiptForm.get('PartyMasterSid')?.getRawValue();
    const detailLedgerValue = detail.get('LedgerMasterSid')?.getRawValue();

    // Only sync currency when both values are non-null and match (actual party row)
    if (headerPartyValue && detailLedgerValue && headerPartyValue === detailLedgerValue) {
      if (patch) {
        // Use emitEvent: false to prevent valueChanges subscriber from
        // wiping CurrencyCode when currencyList hasn't loaded yet
        detail
          .get('CurrencyMasterSid')
          ?.setValue(this.r['CurrencyMasterSid']?.getRawValue(), { emitEvent: false });
        detail
          .get('CurrencyCode')
          ?.setValue(this.r['CurrencyCode']?.getRawValue());
        detail
          .get('ExchangeRate')
          ?.setValue(this.r['ExchangeRate']?.getRawValue());
        }
        detail.get('CurrencyMasterSid')?.disable({ emitEvent: false });
        detail.get('CurrencyCode')?.disable({ emitEvent: false });
        detail.get('ExchangeRate')?.disable({ emitEvent: false });
      } else {
        // For auto party/bank rows, keep currency fields disabled
        const isLockedRow = this.isAutoPartyRow(detailIndex) || this.isAutoBankRow(detailIndex);
        if (!isLockedRow) {
          detail.get('CurrencyMasterSid')?.enable({ emitEvent: false });
          detail.get('CurrencyCode')?.enable({ emitEvent: false });
          detail.get('ExchangeRate')?.enable({ emitEvent: false });
        }
      }
      this.calculateLocalAmount(detailIndex,true);
  }

  removeDetail(detailIndex: number, VoucherDetailSid?: number) {
    // Remove from form array only — the backend soft-deletes orphaned rows on save
    (this.detailItems as FormArray).removeAt(detailIndex);
    this.filteredCoaList.splice(detailIndex, 1);
    this.removeJobSearchState(detailIndex);
    this.rebuildFilteredCoaListForAllRows();
  }

  private subscribeToPartyAndBankChanges(): void {
    // Listen to party changes independently
    this.receiptForm.get('CustomerBranchSid').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((partySid) => {
        if (this.isLoading) return;
        if (partySid) {
          this.insertPartyRow(partySid);
        } else {
          this.removeAutoPartyRow();
        }
      });

    // Capture initial BankCOA value so we can track the previous one on changes
    this.previousBankCoaSid = Number(this.r['BankCOA']?.getRawValue()) || null;

    // Listen to bank/cash changes independently
    this.receiptForm.get('BankCOA').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((bankCoaSid) => {
        if (this.isLoading) return;
        const prevSid = this.previousBankCoaSid;
        this.previousBankCoaSid = bankCoaSid ? Number(bankCoaSid) : null;
        if (bankCoaSid) {
          this.insertBankCashRow(bankCoaSid, prevSid);
        } else {
          this.removeAutoBankRow();
        }
      });
  }

  /**
   * Insert a party row when party is selected.
   * After insertion, filter COA list to exclude Sy Cr and Sy Dr type ledgers.
   */
  private async insertPartyRow(partySid: number): Promise<void> {
    const partyLedger = this.partyList.find(
      (p) => p.CustomerBranchSid === partySid
    );
    if (!partyLedger) {
      console.error('Could not find the selected party ledger details.');
      return;
    }

    // Find ALL party-type rows (rows with Sy Cr or Sy Dr ledger types)
    const partyIndexes: number[] = [];
    (this.detailItems.getRawValue() || []).forEach((d, index) => {
      const ledgerObj = this.coaList.find(
        l => l.COAMasterSid === d.COAMasterSid
      );
      // Check if it's a Sy Cr or Sy Dr type OR matches the party ledger
      if (
        ledgerObj?.LedgerType === 'Sy Cr' ||
        ledgerObj?.LedgerType === 'Sy Dr' ||
        d.LedgerMasterSid === partyLedger.SubledgerMasterSid ||
        (d.DrCr === 'C' && d.COAMasterSid === partyLedger.COAMappedId)
      ) {
        partyIndexes.push(index);
      }
    });

    // Capture VoucherDetailSid/HeaderSid from the existing party row before removing,
    // so the backend updates the record instead of creating a duplicate on save
    let existingPartyVoucherDetailSid = 0;
    let existingPartyVoucherHeaderSid: number | null = null;
    if (partyIndexes.length > 0) {
      const primaryPartyRow = this.detailItems.at(partyIndexes[0]);
      existingPartyVoucherDetailSid = primaryPartyRow?.get('VoucherDetailSid')?.value || 0;
      existingPartyVoucherHeaderSid = primaryPartyRow?.get('VoucherHeaderSid')?.value || null;
    }

    // Remove all existing party rows (from last to first to avoid index issues)
    if (partyIndexes.length > 0) {
      partyIndexes
        .sort((a, b) => b - a)
        .forEach(index => {
          this.detailItems.removeAt(index);
          this.filteredCoaList.splice(index, 1);
        });
    }

    const headerCurrencyId = this.r['CurrencyMasterSid']?.value;
    const headerCurrencyCode = this.r['CurrencyCode']?.value;
    const currentMatchingPartyAmt = this.getTotalMatchPartyAmt();

    const partyData = {
      VoucherDetailSid: existingPartyVoucherDetailSid,
      VoucherHeaderSid: existingPartyVoucherHeaderSid,
      Sno: 1,
      COAMasterSid: partyLedger.COAMappedId,
      LedgerMasterSid: partyLedger.SubledgerMasterSid,
      DrCr: 'C',
      CurrencyMasterSid: headerCurrencyId,
      CurrencyCode: headerCurrencyCode,
      ExchangeRate: this.getFormattedAndPaddedExchangeRate(this.r['ExchangeRate']?.value, headerCurrencyId),
      Amount: this.getFormattedAndPaddedAmount(currentMatchingPartyAmt, headerCurrencyId),
    };

    // Insert party row at the beginning
    const newRow = this.constructDetailItems(partyData);
    this.detailItems.insert(0, newRow);

    if (headerCurrencyId === this.currentCompany?.CurrencyMasterSid) {
      this.detailItems.at(0).get('ExchangeRate')?.disable({ emitEvent : false });
    }

    ['COAMasterSid', 'LedgerMasterSid', 'DrCr', 'CurrencyMasterSid', 'CurrencyCode'].forEach(field => {
      this.detailItems.at(0).get(field)?.disable({ emitEvent: false });
    });

    this.fetchLedgerForCOA(partyLedger, 0);
    this.calculateLocalAmount(0, true);
    this.checkAndUpdateForAllPartyDetail();
    this.updateDetailNarration();

    // Filter COA list: exclude Sy Cr and Sy Dr type ledgers
    this.rebuildFilteredCoaListForAllRows();
  }

  /**
   * Insert a bank/cash row when bank/cash is selected.
   * After insertion, filter COA list to exclude the selected bank/cash.
   */
  private async insertBankCashRow(bankCoaSid: number, prevBankCoaSid?: number | null): Promise<void> {
    const isCashMode = this.receiptForm.get('CashOrBank')?.value === 'C';
    const bankLedgerSource = isCashMode
      ? this.cashTypeLedgers
      : this.bankTypedLedgers;
    const bankCoaSidNum = Number(bankCoaSid);
    const bankLedger = bankLedgerSource.find(
      (ledger) => Number(ledger.COAMasterSid) === bankCoaSidNum
    );
    if (!bankLedger) {
      console.error('Could not find the selected bank/cash ledger details.');
      return;
    }

    // Find ALL bank/cash-type rows — use Number() coercion for safe comparison
    const cashBankIndexes: number[] = [];
    const allBankCashCoaSidNums = new Set([
      ...this.bankTypedLedgers.map((l) => Number(l.COAMasterSid)),
      ...this.cashTypeLedgers.map((l) => Number(l.COAMasterSid)),
    ]);
    const prevSidNum = prevBankCoaSid ? Number(prevBankCoaSid) : null;

    (this.detailItems.getRawValue() || []).forEach((d, index) => {
      const dCoaSidNum = Number(d.COAMasterSid);
      const ledgerObj = this.coaList.find(
        l => Number(l.COAMasterSid) === dCoaSidNum
      );

      // Check if it's a Bank or Cash type, matches any bank/cash COA, or is the previous bank row
      if (
        ledgerObj?.LedgerType === 'Bank' ||
        ledgerObj?.LedgerType === 'Cash' ||
        allBankCashCoaSidNums.has(dCoaSidNum) ||
        (prevSidNum && dCoaSidNum === prevSidNum)
      ) {
        cashBankIndexes.push(index);
      }
    });

    // Capture VoucherDetailSid/HeaderSid from the existing bank row before removing,
    // so the backend updates the record instead of creating a duplicate on save
    let existingBankVoucherDetailSid = 0;
    let existingBankVoucherHeaderSid: number | null = null;
    if (cashBankIndexes.length > 0) {
      const primaryBankRow = this.detailItems.at(cashBankIndexes[0]);
      existingBankVoucherDetailSid = primaryBankRow?.get('VoucherDetailSid')?.value || 0;
      existingBankVoucherHeaderSid = primaryBankRow?.get('VoucherHeaderSid')?.value || null;
    }

    // Remove all existing bank/cash rows (from last to first to avoid index issues)
    if (cashBankIndexes.length > 0) {
      cashBankIndexes
        .sort((a, b) => b - a)
        .forEach(index => {
          this.detailItems.removeAt(index);
          this.filteredCoaList.splice(index, 1);
        });
    }

    // Use the bank's own LedgerCurrency if available, otherwise fall back to header currency
    const headerCurrencyId = this.r['CurrencyMasterSid']?.value;
    const bankCurrencyId = bankLedger.LedgerCurrency || headerCurrencyId;
    const bankCurrency = this.currencyList.find(c => c.CurrencyMasterSid === bankCurrencyId);
    const bankCurrencyCode = bankCurrency?.currencyCode || this.r['CurrencyCode']?.value;

    const currentMatchingPartyAmt = headerCurrencyId === bankCurrencyId ? this.getTotalMatchPartyAmt() : 0;

    const bankData = {
      VoucherDetailSid: existingBankVoucherDetailSid,
      VoucherHeaderSid: existingBankVoucherHeaderSid,
      Sno: this.detailItems.length + 1,
      COAMasterSid: bankLedger.COAMasterSid,
      LedgerMasterSid: bankLedger.LedgerMasterSid,
      DrCr: 'D',
      CurrencyMasterSid: bankCurrencyId,
      CurrencyCode: bankCurrencyCode,
      ExchangeRate: this.getFormattedAndPaddedExchangeRate(1, bankCurrencyId),
      Amount: this.getFormattedAndPaddedAmount(currentMatchingPartyAmt, bankCurrencyId),
    };

    // Insert bank/cash row after the party row (or at start if no party row)
    const insertIndex = this.detailItems.length > 0 ? 1 : 0;
    const newRow = this.constructDetailItems(bankData);
    this.detailItems.insert(insertIndex, newRow);

    ['COAMasterSid', 'LedgerMasterSid', 'DrCr', 'CurrencyMasterSid', 'CurrencyCode'].forEach(field => {
      this.detailItems.at(insertIndex).get(field)?.disable({ emitEvent: false });
    });

    // Fetch the correct exchange rate for the bank's currency
    this.handleDetailExchangeRate(bankCurrencyId, insertIndex);
    this.fetchLedgerForCOA(bankLedger, insertIndex);
    this.checkAndUpdateForAllPartyDetail();
    this.updateDetailNarration();

    // Filter COA list: exclude the selected bank/cash
    this.rebuildFilteredCoaListForAllRows();
  }

  /**
   * Remove the auto-inserted party row when the party field is cleared.
   */
  private removeAutoPartyRow(): void {
    // Party row is always at index 0
    if (this.detailItems.length > 0) {
      const row = this.detailItems.at(0);
      const rowDrCr = row?.get('DrCr')?.getRawValue();
      if (rowDrCr === 'C') {
        this.detailItems.removeAt(0);
        this.filteredCoaList.splice(0, 1);
        this.rebuildFilteredCoaListForAllRows();
      }
    }
  }

  /**
   * Remove the auto-inserted bank/cash row when the bank/cash field is cleared.
   */
  private removeAutoBankRow(): void {
    // Bank row is always at index 1 (if party exists) or index 0
    const details = this.detailItems.getRawValue();
    const allBankCashCoaSids = [
      ...this.bankTypedLedgers.map((l) => l.COAMasterSid),
      ...this.cashTypeLedgers.map((l) => l.COAMasterSid),
    ];
    const bankIndex = details.findIndex(
      (d) => d.DrCr === 'D' && allBankCashCoaSids.includes(d.COAMasterSid)
    );
    if (bankIndex !== -1) {
      this.detailItems.removeAt(bankIndex);
      this.filteredCoaList.splice(bankIndex, 1);
      this.rebuildFilteredCoaListForAllRows();
    }
  }

  /**
   * Build the filtered COA list for a specific detail row.
   * - Party row: keeps its own party COA, filters out the selected bank/cash COA
   * - Bank/cash row: keeps its own bank/cash COA, filters out Sy Cr and Sy Dr
   * - Other rows: filters out both Sy Cr/Sy Dr and the selected bank/cash COA
   */
  private getFilteredCoaListForRow(rowIndex: number): any[] {
    const partySid = this.r['PartyMasterSid']?.getRawValue();
    const bankCoaSid = this.r['BankCOA']?.getRawValue();
    const row = this.detailItems.at(rowIndex);
    const rowCoaSid = row?.get('COAMasterSid')?.getRawValue();
    const rowLedgerSid = row?.get('LedgerMasterSid')?.getRawValue();

    const isPartyRow = partySid && rowLedgerSid === partySid;
    const isBankRow = bankCoaSid && rowCoaSid === bankCoaSid;

    let filtered : any[];
    if(this.coaList){
      filtered = [...this.coaList];
    }

    if (isPartyRow) {
      // Party row: exclude the selected bank/cash COA only
      if (bankCoaSid) {
        filtered = filtered.filter((coa) => coa.LedgerType !== 'Cash' && coa.LedgerType !== 'Bank');
      }
    } else if (isBankRow) {
      // Bank/cash row: exclude Sy Cr and Sy Dr only
      if (partySid) {
        filtered = filtered.filter(
          (coa) => coa.LedgerType?.trim() !== 'Sy Cr' && coa.LedgerType?.trim() !== 'Sy Dr'
        );
      }
    } else {
      // Other rows: exclude both Sy Cr/Sy Dr and the selected bank/cash COA
      if (partySid) {
        filtered = filtered.filter(
          (coa) => coa.LedgerType?.trim() !== 'Sy Cr' && coa.LedgerType?.trim() !== 'Sy Dr'
        );
      }
      if (bankCoaSid) {
        filtered = filtered.filter((coa) => coa.LedgerType !== 'Bank' && coa.LedgerType !== 'Cash');
      }
    }

    return filtered;
  }

  /**
   * Rebuild filteredCoaList for all detail rows.
   */
  private rebuildFilteredCoaListForAllRows(): void {
    for (let i = 0; i < this.detailItems.length; i++) {
      this.filteredCoaList[i] = this.getFilteredCoaListForRow(i);
    }
  }

  handleCOAChange(coa: any, detailIndex: number, isPatching: boolean = false) {
    if (!coa) {
      if (!isPatching) {
        this.detailItems.at(detailIndex).get('LedgerMasterSid')?.setValue(null);
      }
      return;
    }
    this.fetchLedgerForCOA(coa, detailIndex, isPatching);

    // Resolve full COA object to get JobNoRequire (during patching, coa may be minimal)
    const fullCoa = this.coaList.find(c => c.COAMasterSid === coa.COAMasterSid) || coa;
    this.applyJobRequireValidation(fullCoa, detailIndex);

    // Default currency from COA's LedgerCurrency (allow user to change)
    if (!isPatching && coa.LedgerCurrency) {
      const row = this.detailItems.at(detailIndex) as FormGroup;
      // Only set if not a party row (party row syncs with header)
      if (!this.isAutoPartyRow(detailIndex)) {
        row.patchValue({ CurrencyMasterSid: coa.LedgerCurrency });
        this.handleDetailExchangeRate(coa.LedgerCurrency, detailIndex);
      }
    }
  }

  /**
   * Apply MasterJob and Department validation based on COA's JobNoRequire flag.
   * HouseJob is optional — if a user picks one, MasterJob must already be set.
   */
  applyJobRequireValidation(coa: any, detailIndex: number) {
    const row = this.detailItems.at(detailIndex) as FormGroup;
    const masterJobCtrl = row.get('MasterJobSid');
    const houseJobCtrl = row.get('HouseJobSid');
    const deptCtrl = row.get('DepartmentMasterSid');

    if (coa?.JobNoRequire === 'Y') {
      masterJobCtrl?.setValidators([Validators.required]);
      deptCtrl?.setValidators([Validators.required]);
      houseJobCtrl?.clearValidators();
    } else {
      masterJobCtrl?.clearValidators();
      houseJobCtrl?.clearValidators();
      deptCtrl?.clearValidators();
    }

    masterJobCtrl?.updateValueAndValidity();
    houseJobCtrl?.updateValueAndValidity();
    deptCtrl?.updateValueAndValidity();
  }

  /**
   * Update the narration for the party detail
   * eg Party row -  Being Bank Transfer Recd. NEFT 7887
   * Bank row - Being NEFT 7887 from KRS Logistics
   */
  private syncClearanceDate(mode: string, date: any) {
    if (['NEFT', 'IMPS', 'RTGS'].includes(mode)) {
      // dateSelect fires NgbDateStruct {year,month,day} — convert to Date so the
      // form control stores the same type as CustomDateAdapter.toModel produces
      const value = (date && 'year' in date) ? ngbDateStructToDate(date) : date;
      this.receiptForm.get('ClearanceDate')?.setValue(value);
    }
  }

  onInstrumentDateSelect(date: any) {
    const mode = this.receiptForm.get('InstrumentMode')?.value;
    this.syncClearanceDate(mode, date);
  }

  onInstrumentModeChange(event: any) {
    const date = this.receiptForm.get('InstrumentDate')?.value;
    this.syncClearanceDate(event?.value, date);
  }

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
    // if (partyDetailIndex === -1) partyCtrl?.setValue(null);
    // if (bankDetailIndex === -1) bankCtrl?.setValue(null);

    const cashOrBank = this.r['CashOrBank']?.value === 'C' ? 'Cash' : 'Bank';
    const intrumentDate = this.datePipe.transform(this.r['InstrumentDate']?.value ? new Date(this.r['InstrumentDate']?.value) : null);
    const instrumentMode = this.r['InstrumentMode']?.value;
    const instrumentNumber = this.r['InstrumentNumber']?.value;
    const bankPartyName = this.r['BankPartyName']?.value;

    partyCtrl?.patchValue({
      Narration:
        cashOrBank === 'Bank'
          ? `Being Bank Transfer Recd. ${instrumentMode ? instrumentMode + '-' : ''}${instrumentNumber ? instrumentNumber + '-' : ''}${intrumentDate ? intrumentDate + ' ' : ''}`
          : `Being Cash Transfer Recd.`,
    });

    bankCtrl?.patchValue({
      Narration:
        cashOrBank === 'Bank'
          ? `Being ${instrumentMode ? instrumentMode + '-' : ''}${instrumentNumber ? instrumentNumber + '-' : ''}${intrumentDate ? intrumentDate + ' ' : ''}from ${bankPartyName ? bankPartyName + '' : ''}`
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
    const isLockedRow = this.isAutoPartyRow(detailIndex) || this.isAutoBankRow(detailIndex);

    if (coa.SubledgerName === 'Y') {
      // Only enable the ledger dropdown if this is NOT an auto-inserted row
      if (!isLockedRow) {
        ledgerCtrl.enable();
      }
      ledgerCtrl.setValidators([Validators.required]);
      this.accountService
        .getLedgerByCOAMasterSid({
          COAMasterSid: coa.COAMappedId || coa.COAMasterSid,
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
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
            // Re-disable after async data load for auto-inserted rows
            if (isLockedRow) {
              ledgerCtrl.disable();
            }
          } else {
            this.appSettingService.showError('Error fetching ledger for COA');
          }
        });
    } else {
      ledgerCtrl.setValue(null);
      ledgerCtrl.disable();
      ledgerCtrl.clearValidators();
      ledgerCtrl.updateValueAndValidity();
    }
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
        this.getFormattedAndPaddedExchangeRate(Number(resp),
          currencySid,
        )
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
      this.masterJobSkip[detailIndex] = 0;
      this.masterJobHasMore[detailIndex] = false;
      this.houseJobSkip[detailIndex] = 0;
      this.houseJobHasMore[detailIndex] = false;
      return;
    }
    this.filterChargeByDeptForARow(dept, detailIndex);

    // Reset and load master jobs with pagination
    this.masterJobSearchTerm[detailIndex] = '';
    this.masterJobSkip[detailIndex] = 0;
    this.masterJobList[detailIndex] = [];
    this.masterJobHasMore[detailIndex] = true;
    this.loadMasterJobs(detailIndex);
  }

  onMasterJobChange(detailIndex: number, masterJob: any) {
    const row = this.detailItems.at(detailIndex) as FormGroup;

    if (!masterJob || !masterJob.MasterJobSid) {
      this.houseJobList[detailIndex] = [];
      this.houseJobSkip[detailIndex] = 0;
      this.houseJobHasMore[detailIndex] = false;

      // Re-enable department when master job is cleared
      row.get('DepartmentMasterSid')?.enable();
      return;
    }

    // Auto-patch department from master job (full object from ng-select)
    if (masterJob.DepartmentMasterSid) {
      row.patchValue({ DepartmentMasterSid: masterJob.DepartmentMasterSid });

      // Load charges for the auto-patched department
      const dept = this.deptList.find(
        (d) => d.DepartmentMasterSid === masterJob.DepartmentMasterSid
      );
      if (dept) {
        this.filterChargeByDeptForARow(dept, detailIndex);
      }
    }

    // Disable department when a master job is selected
    row.get('DepartmentMasterSid')?.disable();

    // Reset and load house jobs with pagination
    this.houseJobSearchTerm[detailIndex] = '';
    this.houseJobSkip[detailIndex] = 0;
    this.houseJobList[detailIndex] = [];
    this.houseJobHasMore[detailIndex] = true;
    this.loadHouseJobs(detailIndex);
  }

  /**
   * Initialize typeahead Subjects and pagination state for a detail row.
   */
  private initJobSearchState(index: number): void {
    // Master job typeahead
    const masterSubject = new Subject<string>();
    this.masterJobTypeahead$[index] = masterSubject;
    this.masterJobLoading[index] = false;
    this.masterJobSkip[index] = 0;
    this.masterJobHasMore[index] = false;
    this.masterJobSearchTerm[index] = '';

    masterSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      // Find current index by Subject reference (handles row removal/reorder)
      const currentIndex = this.masterJobTypeahead$.indexOf(masterSubject);
      if (currentIndex === -1) return;
      this.masterJobSearchTerm[currentIndex] = term || '';
      this.masterJobSkip[currentIndex] = 0;
      this.masterJobList[currentIndex] = [];
      this.loadMasterJobs(currentIndex);
    });

    // House job typeahead
    const houseSubject = new Subject<string>();
    this.houseJobTypeahead$[index] = houseSubject;
    this.houseJobLoading[index] = false;
    this.houseJobSkip[index] = 0;
    this.houseJobHasMore[index] = false;
    this.houseJobSearchTerm[index] = '';

    houseSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      const currentIndex = this.houseJobTypeahead$.indexOf(houseSubject);
      if (currentIndex === -1) return;
      this.houseJobSearchTerm[currentIndex] = term || '';
      this.houseJobSkip[currentIndex] = 0;
      this.houseJobList[currentIndex] = [];
      this.loadHouseJobs(currentIndex);
    });
  }

  /**
   * Clean up job search state arrays when a detail row is removed.
   */
  private removeJobSearchState(index: number): void {
    this.masterJobTypeahead$.splice(index, 1);
    this.masterJobLoading.splice(index, 1);
    this.masterJobSkip.splice(index, 1);
    this.masterJobHasMore.splice(index, 1);
    this.masterJobSearchTerm.splice(index, 1);
    this.masterJobList.splice(index, 1);

    this.houseJobTypeahead$.splice(index, 1);
    this.houseJobLoading.splice(index, 1);
    this.houseJobSkip.splice(index, 1);
    this.houseJobHasMore.splice(index, 1);
    this.houseJobSearchTerm.splice(index, 1);
    this.houseJobList.splice(index, 1);
  }

  /**
   * Load master jobs with pagination for a detail row.
   */
  loadMasterJobs(index: number): void {
    const row = this.detailItems.at(index) as FormGroup;
    const deptId = row?.get('DepartmentMasterSid')?.value;

    this.masterJobLoading[index] = true;

    const payload: any = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      SearchText: this.masterJobSearchTerm[index] || '',
      Skip: this.masterJobSkip[index],
      Take: this.JOB_BATCH_SIZE,
    };

    // Include department filter only if a department is selected
    if (deptId) {
      payload.DepartmentMasterSid = deptId;
    }

    this.accountService
      .getMasterJobByDepartment(payload)
      .subscribe({
        next: (resp: any) => {
          const data = Array.isArray(resp) ? resp : (resp?.data || []);
          this.masterJobList[index] = [...(this.masterJobList[index] || []), ...data];
          this.masterJobSkip[index] += data.length;
          this.masterJobHasMore[index] = data.length >= this.JOB_BATCH_SIZE;
          this.masterJobLoading[index] = false;
        },
        error: (err) => {
          console.error('Failed to load master jobs:', err);
          this.masterJobLoading[index] = false;
        },
      });
  }

  onMasterJobScrollToEnd(index: number): void {
    if (this.masterJobHasMore[index] && !this.masterJobLoading[index]) {
      this.loadMasterJobs(index);
    }
  }

  /**
   * Load house jobs with pagination for a detail row.
   */
  loadHouseJobs(index: number): void {
    const row = this.detailItems.at(index) as FormGroup;
    const masterJobSid = row?.get('MasterJobSid')?.value;
    if (!masterJobSid) return;

    this.houseJobLoading[index] = true;

    this.accountService
      .getHouseJobByMasterJob({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        MasterJobSid: masterJobSid,
        SearchText: this.houseJobSearchTerm[index] || '',
        Skip: this.houseJobSkip[index],
        Take: this.JOB_BATCH_SIZE,
      })
      .subscribe({
        next: (resp: any) => {
          const data = Array.isArray(resp) ? resp : (resp?.data || []);
          this.houseJobList[index] = [...(this.houseJobList[index] || []), ...data];
          this.houseJobSkip[index] += data.length;
          this.houseJobHasMore[index] = data.length >= this.JOB_BATCH_SIZE;
          this.houseJobLoading[index] = false;
        },
        error: (err) => {
          console.error('Failed to load house jobs:', err);
          this.houseJobLoading[index] = false;
        },
      });
  }

  onHouseJobScrollToEnd(index: number): void {
    if (this.houseJobHasMore[index] && !this.houseJobLoading[index]) {
      this.loadHouseJobs(index);
    }
  }

  filterChargeByDeptForAllRow() {
    this.detailItems.controls.forEach((group: FormGroup, index) => {
      const deptId = group.get('DepartmentMasterSid')?.value;
      const department = this.deptList.find(
        (dept) => dept.DepartmentMasterSid === deptId
      );

      if (department) {
        this.filterChargeByDeptForARow(department, index);
      }
    });
  }

  filterChargeByDeptForARow(dept, rowIndex) {
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
      const isMatchedRecord = !!tx.MatchingDetailSid; // <–– detect matched data
      const matchCurrencyForThisTxn = this.currencyList.find(
        (c) => c.currencyCode === tx.CurrencyCode
      )?.CurrencyMasterSid;
      const txCurrencySid = matchCurrencyForThisTxn || null;
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

        exRate: [this.getFormattedAndPaddedExchangeRate(tx.ExchangeRate || 1, txCurrencySid)],

        // Matching values (either blank or existing)
        matchCurr: [{
          value : isMatchedRecord ? tx.MatchingCurrency : matchCurrencyForThisTxn,
          disabled : true
        }],
        matchExRate: [{
          value  : this.getFormattedAndPaddedExchangeRate(
            isMatchedRecord ? tx.MatchingExRate : tx.ExchangeRate || 0,
            isMatchedRecord ? tx.MatchingCurrency : txCurrencySid
          ),
          disabled : true
        }],
        matchCurrAmt: [
          isMatchedRecord
            ? tx.MatchingAmount
            : null,
        ],
        matchLocalAmt: [
          isMatchedRecord
            ? tx.MatchingLocalAmount
            : null,
        ],
        matchPartyAmt: [tx.PartyAmount ?? 0],
        tdsAmt: [isMatchedRecord ? tx.MatchingTDSAmount ?? null : null],

        balance: [
          isMatchedRecord ? Number(tx.OutstandingLocalAmount || 0) - Number(tx.LocalAmount || 0) : null,
        ],
        isTicked: [isMatchedRecord ? Math.abs(Number(tx.OutstandingLocalAmount || 0) - Number(tx.LocalAmount || 0)) < 0 : false],
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
        const osLocalAmt = form.get('osLocalAmt')?.value || 0;
        const balance = Number(osLocalAmt - val).toFixed(2);
        form.get('balance')?.setValue(Number(balance || 0));
      });
      this.voucherMatchings.push(form);

      // Trigger balance recalculation for patched matched records
      const matchLocalAmtVal = form.get('matchLocalAmt')?.value;
      if (matchLocalAmtVal != null) {
        form.get('matchLocalAmt')?.updateValueAndValidity();
      }
    });

  }

  patchExchangeRateForMatchRow(index: number) {
    const row = this.voucherMatchings.at(index) as FormGroup;
    const curr = row.get('matchCurr')?.getRawValue();

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
    const osCurrAmt = Number(row.get('osCurrAmt')?.value || 0);
    const osLocalAmt = Number(row.get('osLocalAmt')?.value || 0);

    // If outstanding has a currency amount but zero local amount, keep local at 0
    if (osCurrAmt !== 0 && osLocalAmt === 0) {
      row.get('matchLocalAmt')?.setValue(this.getFormattedAmount(0, row.get('matchCurr')?.value));
    } else if (amount === osCurrAmt) {
      // If matching currency amount equals outstanding currency amount,
      // use outstanding local amount directly to avoid rounding differences
      row.get('matchLocalAmt')?.setValue(osLocalAmt);
    } else {
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
    }

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
    return toNumber(totalMatchCurrAmt).toFixed(2);
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

  // Section-4 Helper
  getCurrentCompanyBranches() {
    const currentCompanyId = this.currentCompany?.CompanyMasterSid;
    const currentCompany = (this.userData.userCompanyMaster || []).find(
      (ucm) => ucm.CompanyMasterSid === currentCompanyId
    ).companyMaster;
    this.currentCompanyBranches = (currentCompany?.userBranchMaster || []).map(
      (ubm) => ubm.branchMaster
    );
  }

  /**
   * Check if a detail row is the auto-inserted party row.
   */
  isAutoPartyRow(index: number): boolean {
    const row = this.detailItems.at(index);
    if (!row) return false;
    const partySid = this.r['PartyMasterSid']?.getRawValue();
    return partySid && row.get('LedgerMasterSid')?.getRawValue() === partySid;
  }

  /**
   * Check if a detail row is the auto-inserted bank/cash row.
   */
  isAutoBankRow(index: number): boolean {
    const row = this.detailItems.at(index);
    if (!row) return false;
    const bankCoaSid = this.r['BankCOA']?.getRawValue();
    return bankCoaSid && row.get('COAMasterSid')?.getRawValue() === bankCoaSid;
  }

  /**
   * Check if a detail row deletion is blocked (auto-inserted party/bank row).
   */
  isDeleteBlocked(index: number): boolean {
    return this.isAutoPartyRow(index) || this.isAutoBankRow(index);
  }

  /**
   * Get tooltip text for the delete button.
   */
  getDeleteTooltip(index: number): string {
    if (this.isAutoPartyRow(index)) {
      return 'Clear the Party field to remove this row';
    }
    if (this.isAutoBankRow(index)) {
      return 'Clear the Bank/Cash field to remove this row';
    }
    return '';
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

  onCurrencyChange(selected: any) {
    if (!selected) return;

    const currencySid = selected.CurrencyMasterSid;

    this.receiptForm.patchValue({
      CurrencyMasterSid: currencySid,
      CurrencyCode: selected.currencyCode,
    });

    this.handleHeaderExchangeRate(currencySid);

    // Warn if selected currency differs from the party's default currency
    const currentPartyId = this.receiptForm.get('PartyMasterSid')?.getRawValue();
    if (currentPartyId) {
      const currentParty = this.partyList.find(p => p.SubledgerMasterSid === currentPartyId);
      const partyCurrencySid = currentParty?.currencyMaster?.CurrencyMasterSid;
      if (partyCurrencySid && currencySid !== partyCurrencySid) {
        this.toastr.warning('Selected currency differs from the party\'s default currency.', 'Currency Mismatch', { timeOut: 2000 });
      }
    }
  }

  handleDetailExchangeRate(currencySid: number, index: number) {
    const row = this.detailItems.at(index) as FormGroup;
    const exCtrl = row.get('ExchangeRate');

    if (!currencySid) return;

    // SAME CURRENCY
    if (currencySid === this.currentCompany?.CurrencyMasterSid) {
      exCtrl?.setValue(this.getFormattedAndPaddedExchangeRate(1, currencySid));
      exCtrl?.disable({ emitEvent: false });
      this.calculateLocalAmount(index,true);
      return;
    }

    // DIFFERENT CURRENCY
    const isLockedRow = this.isAutoPartyRow(index) || this.isAutoBankRow(index);
    if (!isLockedRow) {
      exCtrl?.enable({ emitEvent: false });
    }
    this.patchCurrencyExchangeRateForDetail(currencySid, index);
  }

  patchCurrencyExchangeRate() {
    const currencySid = this.receiptForm.get('CurrencyMasterSid')?.value;
    const companyCurrency = this.currentCompany?.CurrencyMasterSid;

    if (currencySid === companyCurrency && currencySid !== null) {
      this.receiptForm.patchValue({
        ExchangeRate: this.getFormattedAndPaddedExchangeRate(1, currencySid),
      });
      this.recalculateAllMatchingPartyAmounts();
      // this.recalcPartyAmtForAllDetails();
      this.checkAndUpdateForAllPartyDetail();
      return;
    }

    const fromCurrencyCode = this.receiptForm.get('CurrencyCode')?.value;
    const toCurrencyCode = this.currencyList.find(
      (c) => c.CurrencyMasterSid === companyCurrency
    )?.currencyCode;
    if (!fromCurrencyCode || !toCurrencyCode) {
      return;
    }

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode,
      toCurrencyCode,
      EffectiveFrom: this.receiptForm.get('VoucherDate')?.getRawValue()
        ? new Date(this.receiptForm.get('VoucherDate').getRawValue())
        : new Date(),
      segment: 'revenue',
    };
    this.accountService.getExchangeRate(payload).subscribe((resp: any) => {
      if (resp?.status) {
        if (resp.data) {
          this.receiptForm.patchValue({
            ExchangeRate: this.getFormattedAndPaddedExchangeRate(resp.data, currencySid),
          });
        } else {
          this.receiptForm.patchValue({
            ExchangeRate: this.getFormattedAndPaddedExchangeRate(0, currencySid),
          });
          this.appSettingService.showError(resp.message);
        }
        this.recalculateAllMatchingPartyAmounts();
        this.checkAndUpdateForAllPartyDetail();
      } else {
        this.appSettingService.showError('Error fetching exchange rate');
      }
    });
  }

  private previousPartyBranchSid: number | null = null;

  async onPartyChange(party: any, skipConfirmation: boolean = false) {
    // If matchings exist in create mode, confirm before clearing
    // skipConfirmation is true when called from patchHeaderValue (searchOutstanding already confirmed)
    if (!skipConfirmation && !this.isEditMode && this.voucherMatchings?.length > 0) {
      const confirmed = await this.confirmService.confirm(
        'Changing the party will clear all voucher matchings. Do you want to proceed?',
        'Change Party',
        'Clear & Proceed'
      );
      if (!confirmed) {
        // Revert party selection
        this.receiptForm.get('CustomerBranchSid')?.setValue(
          this.previousPartyBranchSid,
          { emitEvent: false }
        );
        return;
      }
      this.voucherMatchings.clear();
      this.updateDetailAmountsFromMatching();
    }

    const partyCountry = String(party?.countryMaster?.countryName)
      .trim()
      .toLowerCase();
    if (!party) {
      this.previousPartyBranchSid = null;
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
    this.previousPartyBranchSid = party.CustomerBranchSid;
    this.receiptForm.patchValue({
      PartyMasterSid: party.SubledgerMasterSid,
      PartyName: party.CustomerName,
      PartyAddress: party.Address,
      CustomerBranchSid: party.CustomerBranchSid,
      COAMasterSid: party.COAMappedId,
      LedgerMasterSid: party.SubledgerMasterSid,
      GST_VAT:
        this.currentCompanyCountryCode !== 'in' ? party.PanType : party.GSTNo,
    });

    // Default header currency from the party's configured currency
    const partyCurrency = party.currencyMaster;
    if (partyCurrency?.CurrencyMasterSid) {
      this.receiptForm.patchValue({
        CurrencyMasterSid: partyCurrency.CurrencyMasterSid,
        CurrencyCode: partyCurrency.currencyCode,
      });
      this.handleHeaderExchangeRate(partyCurrency.CurrencyMasterSid);
    }

    this.r['BankPartyName']?.setValue(party.CustomerName);

    const taxNoCtrl = this.receiptForm.get('GST_VAT');
    if(taxNoCtrl.getRawValue()){
      taxNoCtrl.disable({ emitEvent: false });
    } else {
      taxNoCtrl.enable({ emitEvent: false });
    }
  }

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

  private bankFieldsBackup: any = null;
  private cashFieldsBackup: any = null;

  toggleCashOrBank(selectedMode: any) {
    const mode = this.receiptForm.get('InstrumentMode');
    const number = this.receiptForm.get('InstrumentNumber');
    const date = this.receiptForm.get('InstrumentDate');
    const prevMode = this.bankFieldsBackup ? 'B' : (this.cashFieldsBackup ? 'C' : null);

    // Save current field values before clearing
    const currentCashOrBank = prevMode || (this.receiptForm.get('CashOrBank')?.value === 'C' ? 'B' : 'C');
    if (currentCashOrBank === 'B') {
      this.bankFieldsBackup = {
        BankCOA: this.receiptForm.get('BankCOA')?.value,
        InstrumentMode: mode?.value,
        InstrumentNumber: number?.value,
        InstrumentDate: date?.value,
        ClearanceDate: this.receiptForm.get('ClearanceDate')?.value,
      };
    } else {
      this.cashFieldsBackup = {
        BankCOA: this.receiptForm.get('BankCOA')?.value,
      };
    }

    // Read from form value (ng-select (change) may emit full item object)
    const isCash = this.receiptForm.get('CashOrBank')?.value === 'C';

    if (isCash) {
      // Switching to Cash — restore cash backup if available, else clear
      this.receiptForm.patchValue({
        BankCOA: this.cashFieldsBackup?.BankCOA ?? null,
        InstrumentMode: null,
        InstrumentNumber: '',
        InstrumentDate: null,
        ClearanceDate: null,
      });
      mode?.clearValidators();
      number?.clearValidators();
      date?.clearValidators();
      this.cashFieldsBackup = null;
    } else {
      // Switching to Bank — restore bank backup if available, else set defaults
      this.receiptForm.patchValue({
        BankCOA: this.bankFieldsBackup?.BankCOA ?? null,
        InstrumentMode: this.bankFieldsBackup?.InstrumentMode ?? null,
        InstrumentNumber: this.bankFieldsBackup?.InstrumentNumber ?? '',
        InstrumentDate: this.bankFieldsBackup?.InstrumentDate ?? null,
        ClearanceDate: this.bankFieldsBackup?.ClearanceDate ?? null,
      });
      mode?.setValidators([Validators.required]);
      number?.setValidators([Validators.required]);
      date?.setValidators([Validators.required]);
      this.bankFieldsBackup = null;
    }

    mode?.updateValueAndValidity();
    number?.updateValueAndValidity();
    date?.updateValueAndValidity();

    // Update filtered COA list since bank/cash selection was cleared
    this.rebuildFilteredCoaListForAllRows();

    // Re-check auto posting based on the new Cash/Bank mode
    this.checkVoucherPostingMechanism();
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

    if (fromCurrencyId === toCurrencyId) {
      return of(this.getFormattedExchangeRate(1, fromCurrencyId));
    }

    const fromCurrencyCode = this.currencyList.find(
      (curr) => curr.CurrencyMasterSid === fromCurrencyId
    )?.currencyCode;
    const toCurrencyCode = this.currencyList.find(
      (curr) => curr.CurrencyMasterSid === toCurrencyId
    )?.currencyCode;

    if (!fromCurrencyCode || !toCurrencyCode) {
      return of(this.getFormattedExchangeRate(1, fromCurrencyId));
    }

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode,
      toCurrencyCode,
      EffectiveFrom: this.receiptForm.get('VoucherDate')?.getRawValue()
        ? new Date(this.receiptForm.get('VoucherDate').getRawValue())
        : new Date(),
      segment: 'revenue',
    };

    return this.accountService.getExchangeRate(payload).pipe(
      map((resp: any) => {
        if (resp.status) {
          if (resp.data) {
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
    if (this.isPosted || this.detailItems.get('IsAutoGenerated')?.value === 'Y') {
      return;
    }
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
      (c) => c.CurrencyMasterSid === Number(CurrencyMasterSid)
    )?.currencyCode;
    if (code) {
      this.r['CurrencyCode']?.setValue(code);
    }
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
    return 4;
  }

  /**
   * Get the number of decimal places allowed for exchange rates
   * Example: getExchangeRateDecimalPlaces(12) returns 3
   */
  public getExchangeRateDecimalPlaces(CurrencyMasterSid: number): number {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid
    );
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(
        currency.currencyCode
      );
      return config?.exchangeDecimal;
    }
    return 4;
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
    return 4;
  }

  public getAmountDecimalPlacesByCode(CurrencyCode: string): number {
    if (CurrencyCode) {
      const config = this.currencyConfigService.getCurrencyConfig(CurrencyCode);
      return config?.amountDecimal;
    }
    return 4;
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

  public getFormattedAndPaddedAmount(
    amount: number | string,
    CurrencyMasterSid: number,
  ) {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid,
    );
    const input = {
      value: toNumber(amount),
      currencyCode: currency?.currencyCode,
    };
    const formattedAmount = this.currencyFormatService.formatAmount(input, false);
    const digitForPadding = this.getAmountDecimalPlaces(CurrencyMasterSid);
    return Number(formattedAmount).toFixed(digitForPadding);
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


  /**
   * Format an exchange rate as a string
   * Example: getFormattedExchangeRate(1234.5678, 'USD') returns '1234.568'
   */
  /**
   * Format an exchange rate as a string
   * Example: getFormattedExchangeRate(1234.5678, 'USD') returns '1234.568'
   */
  public getFormattedAndPaddedExchangeRate(
    rate: number,
    CurrencyMasterSid: number,
  ): string {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid,
    );
    const formattedExchangeRate = this.currencyFormatService.formatExchangeRate({
      value: rate,
      currencyCode: currency?.currencyCode,
    });
    return formattedExchangeRate.toFixed(
      this.getExchangeRateDecimalPlaces(CurrencyMasterSid),
    );
  }

  validateAmount() {
    let totalCredits = 0;
    let totalDebits = 0;
    (this.detailItems.getRawValue() || []).forEach((vd) => {
      if (vd.DrCr === 'C') {
        totalCredits += Number(vd.PartyAmount) || 0;
      } else {
        totalDebits += Number(vd.PartyAmount) || 0;
      }
    });
    this.totalCredits = toNumber(this.getFormattedAndPaddedAmount(totalCredits,this.receiptForm.get('CurrencyMasterSid')?.getRawValue()));
    this.totalDebits = toNumber(this.getFormattedAndPaddedAmount(totalDebits,this.receiptForm.get('CurrencyMasterSid')?.getRawValue()));
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
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    const payload = { 
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.receiptData?.VoucherHeaderSid
     };
     const openModal = (terms: any[]) => {
      const modalRef = this.modalService.open(TermsAndConditionsComponent, {
          size: 'lg',
          backdrop: 'static',
          centered: true,
        });

        modalRef.componentInstance.terms = terms || [];
        modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
        modalRef.componentInstance.DocumentSid = this.receiptData?.VoucherHeaderSid;
        modalRef.componentInstance.loadAllOnGet = !this.isTermsAndConditionsEnabled;
     };
     if (!this.isTermsAndConditionsEnabled) {
      this.TandCList = [];
      openModal(this.TandCList);
      return;
    }
    this.masterService.getTandCByCondition(payload).subscribe((resp: any) => {
      if (resp.status) {
        this.TandCList = resp.data;
        openModal(this.TandCList);
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
    modalRef.componentInstance.coaList = this.coaList || [];
    modalRef.componentInstance.ledgerList = this.ledgerList || [];
  }

  reportCash() {
    const modalRef = this.modalService.open(CashReceiptComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.receiptPrintData = this.receiptPrintData || [];
    modalRef.componentInstance.coaList = this.coaList || [];
    modalRef.componentInstance.ledgerList = this.ledgerList || [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.matchingObserver?.disconnect();
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
      this.updateDetailAmountsFromMatching();
      return;
    }

    const originalCurr = row.get('curr')?.value;
    const osCurrAmt = Number(row.get('osCurrAmt')?.value);
    const osLocalAmt = Number(row.get('osLocalAmt')?.value);
    const exRate = Number(row.get('exRate')?.value);

    // FIXED HERE
    const currencySid = this.getCurrencySidFromCode(originalCurr);

    row.patchValue({
      matchCurr: currencySid,
      matchExRate: this.getFormattedAndPaddedExchangeRate(exRate, currencySid),
      matchCurrAmt: this.getFormattedAndPaddedAmount(osCurrAmt, currencySid),
      matchLocalAmt: this.getFormattedAndPaddedAmount(osLocalAmt, currencySid),
    });
    this.calculatePartyAmount(index);
    row.get('isTicked')?.setValue(checked);
    this.updateDetailAmountsFromMatching();

    // this.calculateLocalAmountForMatchRow(index);
  }

  /**
   * Update party row (index 0) and bank row (index 1) amounts
   * based on total matched currency/local amounts.
   */
  updateDetailAmountsFromMatching() {
    const totalMatchCurrAmt = Number(this.getTotalMatchPartyAmt());
    const partyRow = this.detailItems.at(0) as FormGroup;
    if (partyRow) {
      partyRow.patchValue({ Amount: totalMatchCurrAmt });
      this.calculateLocalAmount(0, true);
    }
    const headerCurrency = this.r['CurrencyMasterSid']?.getRawValue();
    const bankRow = this.detailItems.at(1) as FormGroup;
    if (bankRow) {
      const bankCurrency = bankRow.get('CurrencyMasterSid')?.value;
      bankRow.patchValue({ Amount: headerCurrency === bankCurrency ?  totalMatchCurrAmt : 0 });
      this.calculateLocalAmount(1, true);
    }
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
    return this.currentCompanyCountryCode === 'ae';
  }

  isUSACompany() {
    return this.currentCompanyCountryCode === 'us';
  }

  isIndianCompany() {
    return this.currentCompanyCountryCode === 'in';
  }

  checkVoucherPostingMechanism(cashOrBankCode?: string) {
    const code = cashOrBankCode || this.receiptForm?.get('CashOrBank')?.value || 'B';
    const typeValue = code === 'C' ? 'Cash' : 'Bank';

    // Return cached result if already fetched for this type
    if (typeValue in this.autoPostingCache) {
      this.isAutoPosting = this.autoPostingCache[typeValue];
      this.cdr.detectChanges();
      return;
    }

    const companyId = this.currentCompany?.CompanyMasterSid;
    const branchId = this.currentBranch?.BranchMasterSid;
    if (!companyId || !branchId) {
      return;
    }
    this.accountService
      .checkVoucherPostingMechanism({
        CompanyMasterSid: companyId,
        BranchMasterSid: branchId,
        MenuName: 'Receipt',
        Type: typeValue,
      })
      .subscribe({
        next: (resp) => {
          const result = resp.status ? Boolean(resp.data) : false;
          this.autoPostingCache[typeValue] = result;
          this.isAutoPosting = result;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error checking voucher posting mechanism:', error);
        },
      });
  }

  openAuditLogs() {
          if (!this.receiptData?.VoucherHeaderSid) return;
          const modalRef = this.modalService.open(AuditLogComponent, {
          centered: true,
          scrollable: true,
          size: 'xl',
          windowClass: 'audit-log-modal'
        });
        modalRef.componentInstance.title = 'Receipt Logs';
        modalRef.componentInstance.tableName = 'VoucherHeader';
        modalRef.componentInstance.recordId = this.receiptData?.VoucherHeaderSid.toString();
        modalRef.componentInstance.screenName = 'Receipt';
        }
}