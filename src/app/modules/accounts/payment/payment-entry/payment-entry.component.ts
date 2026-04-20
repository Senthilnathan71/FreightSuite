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
import { PaymentService } from '../../services/payment.service';
import { OutstandingInvoice, PaymentMode } from '../../models/receipt.model';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
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
import { BankPaymentPrintComponent } from '../report/bank-payment-print/bank-payment-print.component';
import { PaymentPrintComponent } from '../report/payment-print/payment-print.component';
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
import { OperationService } from 'src/app/modules/operation/operation.service';
import { TaxCalculationService } from 'src/app/modules/operation/services/tax-calculation.service';

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
    NgbTooltipModule
  ],
  templateUrl: './payment-entry.component.html',
  styleUrl: './payment-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
    TaxCalculationService,
  ],
})
export class PaymentEntryComponent implements OnInit, AfterViewInit, HasUnsavedChanges {
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
  hssacList: any[] = [];
  hssacListForRow: any[][] = [];
  taxLabelCache: string[] = [];
  private _previousPaymentInvoiceType: string = '';
  private _originalHSSACValues: any[] = [];
  invoiceTypeOptions = [
    { id: 'REG',   name: 'Regular' },
    { id: 'RCM',   name: 'RCM - Reverse Charge' },
    { id: 'REIMB', name: 'Reimbursement (Pure Agent)' },
  ];
  vatInvoiceTypeOptions = [
    { id: 'REG', name: 'Regular' },
    { id: 'ZR',  name: 'Zero Rated' },
    { id: 'EXE', name: 'Exempt' },
    { id: 'BOS', name: 'Out of Scope' },
  ];

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
  paymentDataPrint: any;
  isLimitErrorShown: boolean = false;
  isTermsAndConditionsEnabled: boolean = true;
  CustomerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  COALookupConfig = DROPDOWN_CONFIGS.COA_LEDGER;
  HSSACLookupConfig = DROPDOWN_CONFIGS.HSSAC_TAX;

  outstandingInvoices: OutstandingInvoice[] = [];
  selectedInvoices: OutstandingInvoice[] = [];
  paymentModes: { value: string; label: string }[] = [];
  isAutoPosting: boolean = false;
  private autoPostingCache: Record<string, boolean> = {};
  voucherMatchingInfo: {
    VoucherMatchingHeaderSid: number;
    VoucherMatchingNo: string;
  };
  paymentRequestSid: number | null = null;
  private isPatching = false;

  paymentValidationConfig: ValidationMessageConfig = {
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
    { label: 'Vendor Invoice', value: 'Invoice' },
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
  // Gates the inline error label and button-disable: create=after save-click, edit=after date-change
  showVoucherDateError = false;

  private isLoading = false;
  isDirty = false;
  private initialFormValue : any = null;
  private previousPartyBranchSid: number | null = null;
  private previousBankCoaSid: number | null = null;

  get hasMatchingDetails(): boolean {
    return this.voucherMatchings?.length > 0;
  }

  constructor(
    public mps: MenuPermissionService,
    private commonService: CommonService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private paymentService: PaymentService,
    private appSettingService: AppSettingsService,
    private dropdownStore: DropdownStore,
    private accountService: AccountsService,
    private currencyFormatService: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService,
    private spinner: NgxSpinnerService,
    private companySettings: CompanySettingsManagerService,
    private voucherPeriodService: VoucherPeriodValidationService,
    private confirmService: ModalService,
    private datePipe: CustomDatePipe,
    private cdr: ChangeDetectorRef,
    private masterService: MasterService,
    private operationService: OperationService,
    private taxCalculationService: TaxCalculationService
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
    this.initPaymentTaxService();

    this.paymentRequestSid = Number(this.route.snapshot.queryParamMap.get('paymentRequestSid')) || null;

    // Check if editing existing payment
    const paymentId = this.route.snapshot.params['id'];
    if (paymentId) {
      this.headerId = Number(paymentId);
    }

    // Load currencies first, then fetch the payment so currencyList
    // is always populated before patchValues runs.
    this.loadAllLookups().subscribe(() => {
      if (this.headerId) {
        this.loadPayment(this.headerId);
      } else {
        this.subscribeToPartyAndBankChanges();
        if (this.paymentRequestSid) {
          this.prefillFromPaymentRequest(this.paymentRequestSid);
        }
      }
    });
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

  ngAfterViewInit(): void {
    if (!this.isPosted) this.setupMatchingObserver();
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
    this.paymentForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300),filter(() => !this.isPatching))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.paymentForm.getRawValue()
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
    // Skip grace/closed validation in edit & view mode (per manager rules 4 & 5).
    // Edit-mode safety is provided by the datepicker's month restriction
    // + a save-time cross-month popup.
    if (this.headerId || this.isViewMode) {
      this.voucherConstraints = { isClosed: false, errorMessage: null };
      return;
    }
    const voucherDate = this.paymentForm?.get('VoucherDate')?.value;
    this.voucherConstraints = this.voucherPeriodService.applyConstraints(voucherDate, 'AP');
  }

  onVoucherDateChange(): void {
    this.applyVoucherDateConstraints();
    // Edit mode: reveal error label + gate button-disable now that user has changed the date
    if (this.headerId) this.showVoucherDateError = true;

    const currencySid = this.paymentForm.get('CurrencyMasterSid')?.getRawValue();
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
      VendorInvoiceNumber: [''],
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
   * Initialize the payment form with validation
   */
  private initializeForm(): void {
    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    const today = getDefaultTodayDate();
    const fyDefault = this.appSettingService.getCurrentFinancialYear();
    const defaultVoucherDate = fyDefault && (today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)) ? fyDefault.EndDate : today;

    this.paymentForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }], // Payment Number
      VoucherDate: [defaultVoucherDate], // Payment Date
      MultiBranch: [{ value: false, disabled: true }],
      CashOrBank: ['B'],      // B - Bank / C - Cash
      BankCOA: [null, [Validators.required]], // Bank COA or Cash COA
      CurrencyMasterSid: [companyCurrency || null],
      CurrencyCode: ['INR'],
      ExchangeRate: [1, [Validators.required, Validators.min(0)]],

      // Party related info
      PartyMasterSid: [null],
      PartyName: [''],
      PartyAddress: [''],
      CustomerBranchSid: [null],
      COAMasterSid: [null],
      GST_VAT: [''],
      BankPartyName: [''],
      Narration: ['', [Validators.required, Validators.maxLength(300)]],
      Remarks: ['', [Validators.maxLength(100)]],
      InstrumentMode: [PaymentMode.NEFT, Validators.required],
      InstrumentNumber: ['', [Validators.required]],
      InstrumentDate: [null, [Validators.required]],
      ClearanceDate: [null],

      InvoiceType: [null],
      PlaceOfSupply: [''],

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
      this.paymentForm.get(ctrl)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.updateDetailNarration();
      });
    });
    ['detailItems', 'voucherMatchings'].forEach((ctrl) => {
      this.paymentForm.get(ctrl)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.validateAmount();
      });
    });

    this.paymentForm.setValidators(
      consistentExchangeRatesValidator(
        companyCurrency,
        this.currentCurrencyCode
      )
    );
    this.paymentForm.updateValueAndValidity();

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
    const exCtrl = this.paymentForm.get('ExchangeRate');

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

    // Parties and ledgers load in the background — do not block payment loading.
    forkJoin({
      parties: this.accountService
        .getAllCreditorWithCOAMapped(filterOption)
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
      this.partyList = parties.data;
      this.bankTypedLedgers = bankTypedLedgers.data;
      this.cashTypeLedgers = cashTypeLedgers.data;

      const cusMap = new Map<number, any>();
      this.partyList.forEach((customer) => {
        cusMap.set(customer.CustomerMasterSid, customer);
      });
      this.onlyCustomerList = Array.from(cusMap.values());
    });

    // Only currencies block the returned observable so that payment
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
            this.initialFormValue = this.paymentForm.getRawValue();
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
          VoucherType: 'PMT',
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
      hssacList: this.operationService.getAllHssac().pipe(catchError(() => of([]))),
    }).subscribe(
      ({
        coaWithLedgerCategoryAsLedger,
        costCenters,
        profitCenters,
        depts,
        charges,
        hssacList,
      }) => {
        this.hssacList = hssacList || [];
        this.coaList = coaWithLedgerCategoryAsLedger.data;
        this.rebuildFilteredCoaListForAllRows();
        this.costCenterList = costCenters.data;
        this.profitCenterList = profitCenters.data;
        this.deptList = depts;
        this.chargeList = charges;
        this.filterChargeByDeptForAllRow();
        // Re-evaluate HSSAC enabled state for all rows now that coaList is loaded
        for (let i = 0; i < this.detailItems.length; i++) {
          this.updateHSSACEnabledState(i);
        }
      }
    );
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
      LedgerType: 'Sy Cr',
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

      if(this.isEditMode && !this.isPosted && form.SearchType === 'Party' && form.LedgerMasterSid !== this.r['PartyMasterSid']?.getRawValue() && this.hasMatchingDetails) {
        this.appSettingService.showWarning(`Already a party ${this.r['PartyName']?.getRawValue()} involved in this payment. \nCannot select a different one.`);
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

    // Reset pagination and clear existing data
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

    this.accountService.getPaymentOutstanding(paginatedPayload).subscribe({
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
        this.appSettingService.showWarning(`Already a party ${this.r['PartyName']?.getRawValue()} involved in this payment. \nCannot select a different one.`);
        return;
      }
      this.onPartyChange(party, true);
      this.searchOutstandingForm.get('LedgerMasterSid')?.disable();
      this.paymentForm.get('PartyMasterSid')?.disable();
    } else if (
      res.length > 0 &&
      this.searchOutstandingForm.get('SearchType')?.value === 'Party' &&
      this.searchOutstandingForm.get('LedgerMasterSid')?.value
    ) {
      this.onPartyChange(this.selectedPartyItemForSearch, true);
      this.paymentForm.get('PartyMasterSid')?.disable();
    }
  }

  onSubmit(resolve?: (value: boolean) => void, isPostingTrue?: boolean) {
    // Validate voucher date is within financial year
    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy) {
      const voucherDate = new Date(this.paymentForm.getRawValue().VoucherDate);
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

    // Reveal error label now that user has clicked save
    this.showVoucherDateError = true;
    // Re-validate voucher date constraints at save time (edit mode may have stale state)
    this.applyVoucherDateConstraints();
    // Block save if voucher period grace days exceeded or module closed
    if (this.voucherConstraints.isClosed) {
      if (this.voucherConstraints.errorMessage) this.appSettingService.showWarning(this.voucherConstraints.errorMessage);
      if (resolve) resolve(false);
      return;
    }

    if (this.paymentForm.invalid) {
      errorLoggerWithToastr(this.paymentForm, this.toastr, this.paymentValidationConfig);
      this.paymentForm.markAllAsTouched();
      if (resolve) resolve(false);
      return;
    }

    const raw = this.paymentForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.paymentForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    this.isSaving = true;
    const formValue = raw;
    const detailItems = this.detailItems.getRawValue();

    if (this.detailItems.length === 0) {
      this.appSettingService.showError(
        'Please add at least one payment detail'
      );
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
    }

    // Enhanced exchange rate validation - checks all three error types
    if (this.paymentForm.errors) {
      const hasExchangeRateError =
        this.paymentForm.errors['inconsistentExchangeRates'] ||
        this.paymentForm.errors['foreignCurrencyRateOne'] ||
        this.paymentForm.errors['exchangeRateZero'];

      if (hasExchangeRateError) {
        const errorMsg = getExchangeRateErrorMessage(
          this.paymentForm,
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
        interOrIntra = 'Intra';
      } else {
        interOrIntra = 'Inter';
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
      InvoiceType : formValue.InvoiceType || 'REG',
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
      PaymentRequestSid: this.paymentRequestSid,
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
              TaxType: 'Input',
              IsUnionTerritory: this.taxCalculationService.context?.appliedTaxMode === 'CGST_UGST',
            },
          }),
    };

    this.spinner.show();
    if (this.isEditMode) {
      this.accountService.updatePaymentById(this.headerId, payload).subscribe({
        next: (resp: any) => {
          this.isSaving = false;
          if (resp.status) {
            this.isDirty = false;
            this.appSettingService.showSuccess(resp.message);
            if (resolve) resolve(true);
            this.spinner.hide();
            this.loadPayment(this.headerId);
          } else {
            this.appSettingService.showError(resp.message);
            if (resolve) resolve(false);
            this.spinner.hide();
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.appSettingService.showError('Failed to update payment.');
          if (resolve) resolve(false);
          this.spinner.hide();
        },
      });
    } else {
      this.accountService.createPayment(payload).subscribe({
        next: async (resp: any) => {
          this.isSaving = false;
          if (resp.status) {
            this.headerId = resp.data?.voucherHeader?.VoucherHeaderSid;
            this.appSettingService.showSuccess(resp.message);
            if (resp.data?.isAutoPosted) {
              this.paymentData = { ...this.paymentData, PostStatus: 'P' };
            }
            this.spinner.hide();
            this.isDirty = false;
            if (resolve) resolve(true);
            if (this.headerId) {
              this.router.navigate(['accounts/payment/entry', this.headerId]);
            }
          } else {
            this.appSettingService.showError(resp.message);
            if (resolve) resolve(false);
            this.spinner.hide();
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.appSettingService.showError('Failed to create payment');
          if (resolve) resolve(false);
          this.spinner.hide();
        },
      });
    }
  }

  async postVoucher(notFromSubmit: boolean = false) {
    if (this.isSaving) return;
    this.showVoucherDateError = true;
    this.applyVoucherDateConstraints();
    if (this.voucherConstraints.isClosed) {
      if (this.voucherConstraints.errorMessage) this.appSettingService.showWarning(this.voucherConstraints.errorMessage);
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
          interOrIntra = 'Intra';
        } else {
          interOrIntra = 'Inter';
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
          'Payment Id ,Company, branch, or financial year or country information is missing'
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
          TaxType: 'Input',
          IsUnionTerritory: this.taxCalculationService.context?.appliedTaxMode === 'CGST_UGST',
          CustomerGstType: this.taxCalculationService.context?.party?.customerGstType || '',
        },
      };

      const result = await firstValueFrom(
        this.paymentService.postPayment(postPayload)
      );

      this.spinner.hide();
      this.isSaving = false;
      if (result.status) {
        this.appSettingService.showSuccess(result.message);
        this.paymentData.PostStatus = 'P';
        if (notFromSubmit) {
          this.loadPayment(this.headerId);
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
   * Load existing payment for editing
   */
  loadPayment(paymentId: number) {
    this.isLoading = true;
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherHeaderSid: paymentId,
    };
    this.accountService.getPaymentById(payload).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.patchValues(resp.data);
          this.applyVoucherDateConstraints();
          this.paymentDataPrint = resp.data;
          this.voucherMatchingInfo = resp.data?.VoucherMatchingHeader?.[0];
        } else {
          this.appSettingService.showError(resp.message);
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading payment:', error);
      },
    });
  }

  private prefillFromPaymentRequest(paymentRequestSid: number) {
    this.operationService.getPaymentRequestById(paymentRequestSid).subscribe({
      next: async (resp: any) => {
        if (!resp.status) {
          this.appSettingService.showWarning(resp.message || 'Unable to load payment request');
          return;
        }

        const request = resp.data;
        if (request?.PaymentRequestStatus !== 'Approved') {
          this.appSettingService.showWarning('Payment voucher can be created only for approved payment request');
          return;
        }

        if (request?.VoucherSid) {
          this.appSettingService.showWarning('Payment voucher already created for this payment request');
          return;
        }

        const firstDetail = request?.paymentRequestDetails?.[0];
        const firstSource = firstDetail?.sourceCostRevenueCharge;
        const party = this.partyList.find((item) => item.CustomerBranchSid === firstSource?.CostAgentBranchSid);

        if (party) {
          await this.onPartyChange(party, true);
        }

        const currencySid = firstDetail?.CostCurrencyMasterSid || this.r['CurrencyMasterSid']?.value;
        this.paymentForm.patchValue({
          VoucherDate: this.toInputDate(request.PaymentRequestDate),
          CashOrBank: request.CashBank === 'Cash' ? 'C' : 'B',
          CurrencyMasterSid: currencySid,
          Narration: `Payment against request ${request.PaymentRequestNumber}`,
          Remarks: request.Remarks || '',
        });
        this.setCurrencyCode(currencySid);
        this.handleHeaderExchangeRate(currencySid);

        if (this.bankTypedLedgers?.length) {
          this.paymentForm.get('BankCOA')?.setValue(this.bankTypedLedgers[0]?.COAMasterSid);
        }

        (request.paymentRequestDetails || []).forEach((detail: any) => {
          const source = detail.sourceCostRevenueCharge;
          this.addDetailRow({
            COAMasterSid: source?.ChargeCOAMasterSid || null,
            LedgerMasterSid: source?.ChargeSubledgerMasterSid || null,
            DrCr: 'D',
            CurrencyMasterSid: detail.CostCurrencyMasterSid,
            CurrencyCode: detail.currency?.currencyCode || '',
            ExchangeRate: detail.CostExchangeRate || 1,
            NumberOfUnit: detail.CostNumberOfUnit || 1,
            Rate: detail.CostRate || 0,
            Amount: detail.CostAmount || 0,
            LocalAmount: detail.CostLocalAmount || 0,
            DepartmentMasterSid: request.DepartmentMasterSid || null,
            ChargeMasterSid: detail.ChargeMasterSid,
            ChargeDescription: detail.ChargeDescription,
            ChargeUOMSid: detail.CostChargeUomSid,
            HouseJobSid: request.HouseJobSid || null,
            MasterJobSid: request.MasterJobSid || null,
            CostRevenue: 'Cost',
            PartyAmount: detail.CostAmount || 0,
          }, false);
        });
      },
    });
  }

  private toInputDate(value: any) {
    return value ? new Date(value).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  }

  patchValues(response: any) {
    this.isPatching = true;
    this.paymentData = response;
    const {
      VoucherDetail,
      VoucherTransaction,
      voucherMatchings,
      ...headerInfo
    } = response;
    this.paymentForm.patchValue(
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
        InvoiceType: headerInfo.InvoiceType || '',
      },
      { emitEvent: false }
    );

    // Update tax service with party context from edit load
    const loadedParty = this.partyList?.find(
      (p: any) => p.CustomerBranchSid === headerInfo.CustomerBranchSid
    );
    if (loadedParty) {
      this.taxCalculationService.updateParty({
        countryCode: loadedParty.countryMaster?.countryCode || this.currentCompanyCountryCode,
        stateName: loadedParty.stateMaster?.stateName || '',
        stateMasterSid: loadedParty.stateMaster?.StateMasterSid,
        gstNumber: loadedParty.GSTNo || loadedParty.PanType || '',
        customerGstType: loadedParty.CustomerGstType || 'Regular',
        isUnionTerritory: loadedParty.stateMaster?.IsUnionTerritory === 'Y',
      });
    }
    if (headerInfo.InvoiceType) {
      this.taxCalculationService.updateInvoiceType(headerInfo.InvoiceType as any);
    }

    // If currencyList is already loaded, resolve the code from the list.
    // If not yet loaded, loadAllLookups will call setCurrencyCode once currencies arrive.
    this.setCurrencyCode(headerInfo.CurrencyMasterSid);

    // Edit mode: restrict the date picker to the original voucher's month so user
    // cannot change the voucher date to a different month.
    const _pmOrigDate = new Date(headerInfo.VoucherDate);
    if (!isNaN(_pmOrigDate.getTime())) {
      const _y = _pmOrigDate.getFullYear(), _m = _pmOrigDate.getMonth() + 1;
      const _monthEnd = new Date(_y, _m, 0);
      const _today = new Date(); _today.setHours(0, 0, 0, 0);
      const _effectiveEnd = _monthEnd < _today ? _monthEnd : _today;
      this.fyMinDate = { year: _y, month: _m, day: 1 };
      this.fyMaxDate = { year: _effectiveEnd.getFullYear(), month: _effectiveEnd.getMonth() + 1, day: _effectiveEnd.getDate() };
    }

    this.previousPartyBranchSid = headerInfo.CustomerBranchSid;
    this.searchOutstandingForm.get('LedgerMasterSid')?.setValue(headerInfo.PartyMasterSid);

    this.paymentForm.get('CashOrBank')?.disable({ emitEvent: false });

    // Re-check auto posting for the loaded CashOrBank value
    this.checkVoucherPostingMechanism(headerInfo.CashOrBank);

    if (headerInfo.CashOrBank === 'C') {
      this.paymentForm.get('InstrumentMode')?.clearValidators();
      this.paymentForm.get('InstrumentMode')?.updateValueAndValidity();
      this.paymentForm.get('InstrumentNumber')?.clearValidators();
      this.paymentForm.get('InstrumentNumber')?.updateValueAndValidity();
      this.paymentForm.get('InstrumentDate')?.clearValidators();
      this.paymentForm.get('InstrumentDate')?.updateValueAndValidity();
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
        IsAutoGenerated: d.IsAutoGenerated || 'N',
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
      this.initialFormValue = this.paymentForm.getRawValue();
      this.destroy$.next();
      this.destroy$.complete();
      this.paymentForm.disable();
      setTimeout(() => this.refreshTaxLabelCache(), 1000);
      return;
    }
    
    // unsaved changes related — allow all recalculations to settle before snapshotting
    this.isLoading = true;
    setTimeout(() => {
      this.refreshTaxLabelCache();
      this.applyZeroRatedDisableOnLoad();
      this.initialFormValue = this.paymentForm.getRawValue();
      this.isPatching = false;
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
    this.paymentForm.reset();
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
    this.router.navigate(['/accounts/payment/list']);
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
      CurrencyMasterSid: [
        data?.CurrencyMasterSid || this.currentCompany?.CurrencyMasterSid,
        Validators.required,
      ],
      CurrencyCode: [
        data?.CurrencyCode || this.currentCurrencyCode,
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
      HSSACMasterSid: [{ value: data?.HSSACMasterSid || null, disabled: true }],
      ChargeUOMSid: [data?.ChargeUOMSid || null],
      HouseJobSid: [data?.HouseJobSid || null],
      MasterJobSid: [data?.MasterJobSid || null],

      YearMasterSid: [data?.YearMasterSid || null],
      VoucherTransactionSid: [data?.VoucherTransactionSid || null],
      IsAutoGenerated: [data?.IsAutoGenerated || 'N'],

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
    const currencySid = newRow.get('CurrencyMasterSid')?.getRawValue();
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
    const headerPartyValue = this.paymentForm.get('PartyMasterSid')?.getRawValue();
    const detailLedgerValue = detail.get('LedgerMasterSid')?.getRawValue();
    const isSyTypeDetail = this.isSyTypeRow(detailIndex);

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
    } else if (isSyTypeDetail) {
      if (patch) {
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
    this.paymentForm.get('CustomerBranchSid').valueChanges
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
    this.paymentForm.get('BankCOA').valueChanges
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
        (d.DrCr === 'D' && d.COAMasterSid === partyLedger.COAMappedId)
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
      DrCr: 'D',
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
    const isCashMode = this.paymentForm.get('CashOrBank')?.value === 'C';
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
      DrCr: 'C',
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
      if (rowDrCr === 'D') {
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
      (d) => d.DrCr === 'C' && allBankCashCoaSids.includes(d.COAMasterSid)
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
    if (!isPatching) {
      this.hssacListForRow[detailIndex] = [];
    }
    this.fetchLedgerForCOA(coa, detailIndex, isPatching);
    this.updateHSSACEnabledState(detailIndex);

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
    this.checkAndUpdateForPartyDetail(detailIndex, true);
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
      this.paymentForm.get('ClearanceDate')?.setValue(value);
    }
  }

  onInstrumentDateSelect(date: any) {
    const mode = this.paymentForm.get('InstrumentMode')?.value;
    this.syncClearanceDate(mode, date);
  }

  onInstrumentModeChange(event: any) {
    const date = this.paymentForm.get('InstrumentDate')?.value;
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
    const instrumentDate = this.datePipe.transform(this.r['InstrumentDate']?.value ? new Date(this.r['InstrumentDate']?.value) : null);
    const instrumentMode = this.r['InstrumentMode']?.value;
    const instrumentNumber = this.r['InstrumentNumber']?.value;
    const bankPartyName = this.r['BankPartyName']?.value;

    partyCtrl?.patchValue({
      Narration:
        cashOrBank === 'Bank'
          ? `Being Bank Transfer  ${instrumentMode ? instrumentMode + '-' : ''}${instrumentNumber ? instrumentNumber + '-' : ''}${instrumentDate ? instrumentDate + ' ' : ''}`
          : `Being Cash Transfer .`,
    });

    bankCtrl?.patchValue({
      Narration:
        cashOrBank === 'Bank'
          ? `Being ${instrumentMode ? instrumentMode + '-' : ''}${instrumentNumber ? instrumentNumber + '-' : ''}${instrumentDate ? instrumentDate + ' ' : ''}from ${bankPartyName ? bankPartyName + '' : ''}`
          : `Being Cash Transfer.`,
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
              ledgerCtrl.disable({ emitEvent: false });
            }
            // Auto-load HSSAC for Charge subledger
            const subledgerSid = ledgerCtrl.getRawValue();
            if (subledgerSid) {
              const subledger = (this.ledgerList[detailIndex] || []).find(
                (l: any) => l.SubledgerMasterSid === subledgerSid
              );
              this.loadHSSACForSubledger(detailIndex, subledger, isPatching);
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
      const patch: any = {
        ChargeDescription: '',
        ChargeUOMSid: null,
        MasterJobSid: null,
        HouseJobSid: null,
      };
      // During patching deptList may not be loaded yet — a missing dept means
      // "not found in list", not "user cleared it". Preserve HSSAC in that case.
      if (!this.isPatching) {
        patch.HSSACMasterSid = null;
      }
      row.patchValue(patch);
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
    return this.paymentForm.get('voucherMatchings') as FormArray;
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
    const currencyInHeader = this.paymentForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    const exRateInHeader = this.paymentForm.get('ExchangeRate')?.getRawValue();

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
        if (control.get('drCr')?.value === 'Cr') {
          return total + Number(control.get('currAmt')?.value || 0);
        }
        return total - Number(control.get('currAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalLocalAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Cr') {
          return total + Number(control.get('localAmt')?.value || 0);
        }
        return total - Number(control.get('localAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalOSCurrAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Cr') {
          return total + Number(control.get('osCurrAmt')?.value || 0);
        }
        return total - Number(control.get('osCurrAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalOSLocalAmount() {
    return this.voucherMatchings.controls
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Cr') {
          return total + Number(control.get('osLocalAmt')?.value || 0);
        }
        return total - Number(control.get('osLocalAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalMatchCurrAmt() {
    const totalMatchCurrAmt = this.voucherMatchings.controls.reduce(
      (total, control) => {
        if (control.get('drCr')?.value === 'Cr') {
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
        if (control.get('drCr')?.value === 'Cr') {
          return total + Number(control.get('matchLocalAmt')?.value || 0);
        }
        return total - Number(control.get('matchLocalAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalMatchPartyAmt() {
    return this.voucherMatchings.controls
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Cr') {
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

  isSyTypeRow(index: number): boolean {
    const row = this.detailItems.at(index);
    if (!row || !this.coaList?.length) return false;
    const coaSid = row.get('COAMasterSid')?.getRawValue();
    const rowCoa = this.coaList.find((c) => c.COAMasterSid === coaSid);
    const ledgerType = String(rowCoa?.LedgerType || '').trim();
    return ledgerType === 'Sy Cr' || ledgerType === 'Sy Dr';
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
    return this.paymentForm.controls || {};
  }

  private getDefaultInvoiceTypeFromGstType(gstType: string): string {
    if (!gstType) return 'REG';
    const map: Record<string, string> = {
      'Regular':       'REG',
      'Composite':     'BOS',
      'Composition':   'BOS',    // legacy
      'Unregistered':  'BOS',    // legacy
      'Exempt':        'EXE',
      'RCM Others':    'RCM',
      'RCM Specified': 'RCM',
      'SEZ':           'NONGST',
      'Zero Rated':    'NONGST',
      'Export':        'NONGST', // legacy
      'REG':    'REG',
      'BOS':    'BOS',
      'NONGST': 'NONGST',
      'EXE':    'EXE',
      'RCM':    'RCM',
      'REIMB':  'REIMB',
    };
    const mapped = map[gstType] ?? 'REG';
    const available = this.invoiceTypeOptions.map(t => t.id);
    return available.includes(mapped) ? mapped : 'REG';
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
      if (control.get('DrCr')?.value === 'Cr') {
        total += matchedAmount;
      } else {
        total -= matchedAmount;
      }
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

    const tdsAmount = this.paymentService.calculateTDS(
      totalAmount,
      tdsPercentage
    );
    this.paymentForm.patchValue({ TDSAmount: tdsAmount });
  }

  onCurrencyChange(selected: any) {
    if (!selected) return;

    const currencySid = selected.CurrencyMasterSid;

    this.paymentForm.patchValue({
      CurrencyMasterSid: currencySid,
      CurrencyCode: selected.currencyCode,
    });

    this.handleHeaderExchangeRate(currencySid);

    // Warn if selected currency differs from the party's default currency
    const currentPartyId = this.paymentForm.get('PartyMasterSid')?.getRawValue();
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
    const currencySid = this.paymentForm.get('CurrencyMasterSid')?.value;
    const companyCurrency = this.currentCompany?.CurrencyMasterSid;

    if (currencySid === companyCurrency && currencySid !== null) {
      this.paymentForm.patchValue({
        ExchangeRate: this.getFormattedExchangeRate(1, currencySid),
      });
      this.recalculateAllMatchingPartyAmounts();
      this.recalcPartyAmtForAllDetails();
      this.checkAndUpdateForAllPartyDetail();
      return;
    }

    const fromCurrencyCode = this.paymentForm.get('CurrencyCode')?.value;
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
      EffectiveFrom: this.paymentForm.get('VoucherDate')?.getRawValue()
        ? new Date(this.paymentForm.get('VoucherDate').getRawValue())
        : new Date(),
      segment: 'cost',
    };
    this.accountService.getExchangeRate(payload).subscribe((resp: any) => {
      if (resp?.status) {
        if (resp.data) {
          this.paymentForm.patchValue({
            ExchangeRate: this.getFormattedExchangeRate(resp.data, currencySid),
          });
        } else {
          this.paymentForm.patchValue({
            ExchangeRate: this.getFormattedExchangeRate(0, currencySid),
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
        this.paymentForm.get('CustomerBranchSid')?.setValue(
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
      this.paymentForm.patchValue({
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
    const defaultInvoiceType = this.currentCompanyCountryCode === 'in'
      ? this.getDefaultInvoiceTypeFromGstType(party.CustomerGstType)
      : 'REG';
    const partyCountryCode = String(party?.countryMaster?.countryCode || '').toLowerCase();
    const isOverseas = partyCountryCode && partyCountryCode !== this.currentCompanyCountryCode;
    const placeOfSupply = isOverseas
      ? (this.appSettingService.getCurrentBranchState()?.stateName || '')
      : (party.stateMaster?.stateName || '');
    this.paymentForm.patchValue({
      PartyMasterSid: party.SubledgerMasterSid,
      PartyName: party.CustomerName,
      PartyAddress: party.Address,
      CustomerBranchSid: party.CustomerBranchSid,
      COAMasterSid: party.COAMappedId,
      LedgerMasterSid: party.SubledgerMasterSid,
      GST_VAT:
        this.currentCompanyCountryCode !== 'in' ? party.PanType : party.GSTNo,
      InvoiceType: defaultInvoiceType ?? null,
      PlaceOfSupply: placeOfSupply,
    });

    this.taxCalculationService.updateParty({
      countryCode: party.countryMaster?.countryCode || this.currentCompanyCountryCode,
      stateName: party.stateMaster?.stateName || '',
      stateMasterSid: party.stateMaster?.StateMasterSid,
      gstNumber: party.GSTNo || party.PanType || '',
      customerGstType: party.CustomerGstType || 'Regular',
      isUnionTerritory: party.stateMaster?.IsUnionTerritory === 'Y',
    });
    this.recalcAllPaymentTaxRows();

    // Default header currency from the party's configured currency
    const partyCurrency = party.currencyMaster;
    if (partyCurrency?.CurrencyMasterSid) {
      this.paymentForm.patchValue({
        CurrencyMasterSid: partyCurrency.CurrencyMasterSid,
        CurrencyCode: partyCurrency.currencyCode,
      });
      this.handleHeaderExchangeRate(partyCurrency.CurrencyMasterSid);
    }

    this.r['BankPartyName']?.setValue(party.CustomerName);

    const taxNoCtrl = this.paymentForm.get('GST_VAT');
    if(taxNoCtrl.getRawValue()){
      taxNoCtrl.disable({ emitEvent: false });
    } else {
      taxNoCtrl.enable({ emitEvent: false });
    }
  }

  toggleMultiBranch(event: any): void {
    const ctrl = this.paymentForm.get('MultiBranch');
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
    const mode = this.paymentForm.get('InstrumentMode');
    const number = this.paymentForm.get('InstrumentNumber');
    const date = this.paymentForm.get('InstrumentDate');
    const prevMode = this.bankFieldsBackup ? 'B' : (this.cashFieldsBackup ? 'C' : null);

    // Save current field values before clearing
    const currentCashOrBank = prevMode || (this.paymentForm.get('CashOrBank')?.value === 'C' ? 'B' : 'C');
    if (currentCashOrBank === 'B') {
      this.bankFieldsBackup = {
        BankCOA: this.paymentForm.get('BankCOA')?.value,
        InstrumentMode: mode?.value,
        InstrumentNumber: number?.value,
        InstrumentDate: date?.value,
        ClearanceDate: this.paymentForm.get('ClearanceDate')?.value,
      };
    } else {
      this.cashFieldsBackup = {
        BankCOA: this.paymentForm.get('BankCOA')?.value,
      };
    }

    // Read from form value (ng-select (change) may emit full item object)
    const isCash = this.paymentForm.get('CashOrBank')?.value === 'C';

    if (isCash) {
      // Switching to Cash — restore cash backup if available, else clear
      this.paymentForm.patchValue({
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
      this.paymentForm.patchValue({
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
      EffectiveFrom: this.paymentForm.get('VoucherDate')?.getRawValue()
        ? new Date(this.paymentForm.get('VoucherDate').getRawValue())
        : new Date(),
      segment: 'cost',
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
    const amount = toNumber(row.get('Amount')?.value);
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
      this.recalcPaymentTaxForRow(index);
    }
  }

  recalcPartyAmtForAllDetails() {
    this.detailItems.controls.forEach((group, index) => {
      this.recalcPartyAmtForDetail(index);
    });
  }

  recalcPartyAmtForDetail(index: number) {
    const formGroup = this.detailItems.at(index) as FormGroup;
    const currencyInHeader = this.paymentForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    const exRateInHeader = this.paymentForm.get('ExchangeRate')?.getRawValue();

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
      this.r['CurrencyCode']?.setValue(code, { emitEvent: false });
    }
  }

  clearSearchFields(type: string) {
    this.searchOutstandingForm.patchValue({
      LedgerMasterSid: null,
      CustomerName: '',
      VendorInvoiceNumber: '',
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

  // ── Tax Service Integration ────────────────────────────────────────────────

  private initPaymentTaxService(): void {
    const company = this.currentCompany;
    if (!company) return;
    this.taxCalculationService.init({
      documentSide: 'PURCHASE',
      companyCountryCode: this.currentCompanyCountryCode,
      companyCountryMasterSid: Number(company.CountryMasterSid),
      branchStateName: this.currentBranch?.stateMaster?.StateName || this.currentBranch?.StateName || '',
      branchStateMasterSid: this.currentBranch?.StateMasterSid,
    }).then(() => this.taxCalculationService.fetchTaxMasters('PURCHASE'));
  }

  onPaymentInvoiceTypeChange(invoiceType: string): void {
    if (this.currentCompanyCountryCode === 'ae') {
      const ok = this.handleZeroRatedSwitch(invoiceType);
      if (!ok) {
        this.paymentForm.get('InvoiceType')?.setValue(this._previousPaymentInvoiceType, { emitEvent: false });
        return;
      }
      this._previousPaymentInvoiceType = invoiceType;
    }
    this.taxCalculationService.updateInvoiceType((invoiceType || 'REG') as any);
    this.recalcAllPaymentTaxRows();
  }

  private getHSSACListForDetailRow(i: number): any[] {
    return this.hssacListForRow[i]?.length > 0 ? this.hssacListForRow[i] : this.hssacList;
  }

  private applyZeroRatedDisableOnLoad(): void {
    if (this.currentCompanyCountryCode !== 'ae') return;
    const invoiceType = this.paymentForm.get('InvoiceType')?.value;
    if (invoiceType !== 'ZR') return;
    this._originalHSSACValues = [];
    for (let i = 0; i < this.detailItems.length; i++) {
      if (!this.isHSSACEnabledForRow(i)) continue;
      const row = this.detailItems.at(i) as FormGroup;
      this._originalHSSACValues[i] = row.get('HSSACMasterSid')?.value;
      row.get('HSSACMasterSid')?.disable({ emitEvent: false });
    }
    this._previousPaymentInvoiceType = 'ZR';
  }

  private handleZeroRatedSwitch(invoiceType: string): boolean {
    if (invoiceType === 'ZR') {
      const failedRows: number[] = [];
      for (let i = 0; i < this.detailItems.length; i++) {
        if (!this.isHSSACEnabledForRow(i)) continue;
        const zeroRated = this.taxCalculationService.findZeroRatedHSSAC(this.getHSSACListForDetailRow(i));
        if (!zeroRated) failedRows.push(i + 1);
      }
      if (failedRows.length > 0) {
        this.appSettingService.showError(
          `Row(s) ${failedRows.join(', ')} are not mapped to a Zero Rated HSSAC. Please update the Charge Master.`
        );
        return false;
      }
      for (let i = 0; i < this.detailItems.length; i++) {
        if (!this.isHSSACEnabledForRow(i)) continue;
        const row = this.detailItems.at(i) as FormGroup;
        const zeroRated = this.taxCalculationService.findZeroRatedHSSAC(this.getHSSACListForDetailRow(i))!;
        this._originalHSSACValues[i] = row.get('HSSACMasterSid')?.value;
        row.get('HSSACMasterSid')?.setValue(zeroRated.HSSACMasterSid, { emitEvent: false });
        row.get('HSSACMasterSid')?.disable({ emitEvent: false });
      }
      return true;
    } else {
      if (this._originalHSSACValues.length > 0) {
        for (let i = 0; i < this.detailItems.length; i++) {
          const row = this.detailItems.at(i) as FormGroup;
          row.get('HSSACMasterSid')?.enable({ emitEvent: false });
          row.get('HSSACMasterSid')?.setValue(this._originalHSSACValues[i] ?? null, { emitEvent: false });
        }
        this._originalHSSACValues = [];
      }
      return true;
    }
  }

  isHSSACEnabledForRow(index: number): boolean {
    const row = this.detailItems.at(index) as FormGroup;
    const coaSid = row.get('COAMasterSid')?.value;
    const coa = this.coaList.find((c: any) => c.COAMasterSid === coaSid);
    return coa?.Category === 'Expense' && coa?.HSNRequire === 'Y';
  }

  updateHSSACEnabledState(index: number): void {
    if (this.isPosted) return;
    const row = this.detailItems.at(index) as FormGroup;
    const hssacCtrl = row.get('HSSACMasterSid');
    if (!hssacCtrl) return;
    if (this.isHSSACEnabledForRow(index)) {
      hssacCtrl.enable({ emitEvent: false });
    } else {
      hssacCtrl.disable({ emitEvent: false });
      // During patching, coaList may not be loaded yet — preserve the saved value
      // so it can display correctly once coaList arrives and the control is re-enabled.
      if (!this.isPatching) {
        hssacCtrl.setValue(null, { emitEvent: false });
        row.patchValue({
          TaxableAmount: 0,
          TaxPercentage1: 0,
          TaxAmount1: 0,
          TaxPercentage2: 0,
          TaxAmount2: 0,
        }, { emitEvent: false });
        this.updateInvoiceTypeRequired();
      }
    }
  }

  onPaymentHSSACChange(index: number): void {
    const row = this.detailItems.at(index) as FormGroup;
    const hssacSid = row.get('HSSACMasterSid')?.value;
    if (!hssacSid) {
      const currSid = row.get('CurrencyMasterSid')?.getRawValue();
      row.patchValue({
        TaxableAmount: this.getFormattedAmount(0, currSid),
        TaxPercentage1: 0,
        TaxAmount1: this.getFormattedAmount(0, currSid),
        TaxPercentage2: 0,
        TaxAmount2: this.getFormattedAmount(0, currSid),
      }, { emitEvent: false });
      this.recalcPartyAmtForDetail(index);
      this.updateInvoiceTypeRequired();
      return;
    }
    this.recalcPaymentTaxForRow(index);
  }

  recalcPaymentTaxForRow(index: number): void {
    const row = this.detailItems.at(index) as FormGroup;
    if (this.isPosted) {
      return;
    }

    if (!this.isHSSACEnabledForRow(index)) {
      this.taxLabelCache[index] = '';
      this.recalcPartyAmtForDetail(index);
      this.updateInvoiceTypeRequired();
      return;
    }

    const hssacSid = row.get('HSSACMasterSid')?.value;
    if (!hssacSid) {
      this.taxLabelCache[index] = '';
      this.recalcPartyAmtForDetail(index);
      this.updateInvoiceTypeRequired();
      return;
    }

    const hssacSource = (this.hssacListForRow[index]?.length > 0)
      ? this.hssacListForRow[index]
      : this.hssacList;
    const hssacItem = hssacSource.find((h: any) => h.HSSACMasterSid === hssacSid);
    const localAmount = toNumber(row.get('LocalAmount')?.value);
    const currSid = row.get('CurrencyMasterSid')?.getRawValue();

    const taxResult = this.taxCalculationService.calculateRowTax({
      taxableAmount: localAmount,
      taxGroupSid: hssacItem?.TaxGroupSid,
    });

    this.taxLabelCache[index] = taxResult.TaxLabel || '-';

    row.patchValue({
      TaxableAmount: this.getFormattedAmount(localAmount, currSid),
      TaxPercentage1: taxResult.TaxPercentage1,
      TaxAmount1: this.getFormattedAmount(taxResult.TaxAmount1, currSid),
      TaxPercentage2: taxResult.TaxPercentage2,
      TaxAmount2: this.getFormattedAmount(taxResult.TaxAmount2, currSid),
    }, { emitEvent: false });

    this.recalcPartyAmtForDetail(index);
    this.updateInvoiceTypeRequired();
  }

  recalcAllPaymentTaxRows(): void {
    this.detailItems.controls.forEach((_, i) => {
      this.recalcPaymentTaxForRow(i);
    });
    this.updateInvoiceTypeRequired();
  }

  get isInvoiceTypeRequired(): boolean {
    return this.paymentForm?.get('InvoiceType')?.hasValidator(Validators.required) ?? false;
  }

  updateInvoiceTypeRequired(): void {
    const hasActiveTax = this.detailItems.controls.some((_, i) => {
      if (!this.isHSSACEnabledForRow(i)) return false;
      const hssacSid = (this.detailItems.at(i) as FormGroup).get('HSSACMasterSid')?.getRawValue();
      if (!hssacSid) return false;
      const source = this.hssacListForRow[i]?.length > 0 ? this.hssacListForRow[i] : this.hssacList;
      const hssacItem = source.find((h: any) => h.HSSACMasterSid === hssacSid);
      return !!hssacItem?.TaxGroupSid;
    });

    const ctrl = this.paymentForm.get('InvoiceType');
    if (hasActiveTax) {
      ctrl?.setValidators([Validators.required]);
    } else {
      ctrl?.clearValidators();
    }
    ctrl?.updateValueAndValidity({ emitEvent: false });
  }

  refreshTaxLabelCache(): void {
    this.detailItems.controls.forEach((_, i) => {
      const row = this.detailItems.at(i);
      const hssacSid = row.get('HSSACMasterSid')?.getRawValue();
      if (!hssacSid) { this.taxLabelCache[i] = ''; return; }
      const source = this.hssacListForRow[i]?.length > 0 ? this.hssacListForRow[i] : this.hssacList;
      const hssacItem = source.find((h: any) => h.HSSACMasterSid === hssacSid);
      if (!hssacItem?.TaxGroupSid) { this.taxLabelCache[i] = ''; return; }
      this.taxLabelCache[i] = this.taxCalculationService.calculateRowTax({
        taxGroupSid: hssacItem.TaxGroupSid,
        taxableAmount: 0,
      }).TaxLabel || '-';
    });
  }

  getPaymentTaxLabel(index: number): string {
    return this.taxLabelCache[index] || '';
  }

  getDynamicTextWidthCh(value: string, minWidth: number = 10, maxWidth: number = 32): number {
    const textLength = (value || '').trim().length;
    return Math.min(Math.max(textLength + 2, minWidth), maxWidth);
  }

  getPaymentTaxColumnWidthCh(minWidth: number = 10, maxWidth: number = 32): number {
    const longestLabel = this.detailItems?.controls?.reduce((longest, row, index) => {
      const label = row.get('IsAutoGenerated')?.value === 'Y' ? '-' : this.getPaymentTaxLabel(index);
      return label.length > longest.length ? label : longest;
    }, '') || '';

    return this.getDynamicTextWidthCh(longestLabel, minWidth, maxWidth);
  }

  getPaymentTaxAmount(index: number): string {
    const row = this.detailItems.at(index);
    const total = toNumber(row.get('TaxAmount1')?.value) + toNumber(row.get('TaxAmount2')?.value);
    const currSid = row.get('CurrencyMasterSid')?.getRawValue();
    return this.getFormattedAmount(total, currSid);
  }

  onSubledgerChange(subledger: any, index: number): void {
    this.checkAndUpdateForPartyDetail(index);
    this.loadHSSACForSubledger(index, subledger, false);
  }

  loadHSSACForSubledger(index: number, subledger: any, isPatching: boolean = false): void {
    if (!subledger || subledger.SubledgerType !== 'Charge' || !subledger.SubledgerMappingSid) {
      this.hssacListForRow[index] = [];
      return;
    }
    this.operationService.getChargeTaxForChargeId(subledger.SubledgerMappingSid).subscribe({
      next: (res: any) => {
        if (res.status) {
          const hssacItems = (res.data || []).filter((h: any) => h.HSSACMasterSid);
          this.hssacListForRow[index] = hssacItems;
          if (hssacItems.length > 0 && !isPatching) {
            (this.detailItems.at(index) as FormGroup).patchValue(
              { HSSACMasterSid: hssacItems[0].HSSACMasterSid },
              { emitEvent: false }
            );
            this.recalcPaymentTaxForRow(index);
          }
        } else {
          this.hssacListForRow[index] = [];
        }
      },
      error: () => {
        this.hssacListForRow[index] = [];
      }
    });
  }

  validateAmount() {
    let totalCredits = 0;
    let totalDebits = 0;
    const headerExRate = toNumber(this.paymentForm.get('ExchangeRate')?.getRawValue());
    (this.detailItems.getRawValue() || []).forEach((vd) => {
      if (vd.IsAutoGenerated === 'Y') return;
      if (vd.DrCr === 'D') {
        totalCredits += ((toNumber(vd.LocalAmount) + toNumber(vd.TaxAmount1) + toNumber(vd.TaxAmount2)) / headerExRate)  || 0;
      } else {
        totalDebits += ((toNumber(vd.LocalAmount) + toNumber(vd.TaxAmount1) + toNumber(vd.TaxAmount2)) / headerExRate)  || 0;
      }
    });
    this.totalCredits = toNumber(this.getFormattedAndPaddedAmount(totalCredits,this.paymentForm.get('CurrencyMasterSid')?.getRawValue()));
    this.totalDebits = toNumber(this.getFormattedAndPaddedAmount(totalDebits,this.paymentForm.get('CurrencyMasterSid')?.getRawValue()));
  }

  showInfo() {
    if (!this.paymentData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.paymentData;
    modalRef.componentInstance.idLabel = 'Payment ID';
    modalRef.componentInstance.idValue = this.paymentData?.VoucherHeaderSid;
  }

  openEDoc() {
    if (!this.paymentData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.screenName = 'Edoc';
    modalRef.componentInstance.formData = this.paymentData;
    modalRef.componentInstance.resetTrigger = false;
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.paymentData?.VoucherHeaderSid,
    };
    this.commonService.documentData.set(data);
  }

  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    const payload = { 
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.paymentData?.VoucherHeaderSid
     };
     const openModal = (terms: any[]) => {
      const modalRef = this.modalService.open(TermsAndConditionsComponent, {
          size: 'lg',
          backdrop: 'static',
          centered: true,
        });

        modalRef.componentInstance.terms = terms || [];
        modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
        modalRef.componentInstance.DocumentSid = this.paymentData?.VoucherHeaderSid;
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

  // loadTandC(payload: { MenuMasterSid: number }): Observable<any[]> {
  //   return this.accountService.getTandCByCondition(payload).pipe(
  //     map((resp: any) => {
  //       if (resp && resp.status) {
  //         return resp.data;
  //       }
  //       this.appSettingService.showError(
  //         'Failed to load Terms and Conditions: Invalid response'
  //       );
  //       return [];
  //     }),
  //     catchError((error) => {
  //       this.appSettingService.showError('Error loading Terms and Conditions');
  //       return of([]);
  //     })
  //   );
  // }

  openEmail() {
    if (!this.paymentData) return;
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
  
  reportBankPayment() {
    const modalRef = this.modalService.open(BankPaymentPrintComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.paymentDataPrint = this.paymentDataPrint || [];
    modalRef.componentInstance.currencyList = this.currencyList || [];
    modalRef.componentInstance.bankTypedLedgers = this.bankTypedLedgers || [];
    modalRef.componentInstance.coaList = this.coaList || [];
    modalRef.componentInstance.ledgerList = this.ledgerList || [];
  }

  reportPayment() {
    const modalRef = this.modalService.open(PaymentPrintComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.paymentDataPrint = this.paymentDataPrint || [];
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
    const code = cashOrBankCode || this.paymentForm?.get('CashOrBank')?.value || 'B';
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
        MenuName: 'Payment',
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
    if (!this.paymentData?.VoucherHeaderSid) return;
    const modalRef = this.modalService.open(AuditLogComponent, {
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'Payment Logs';
    modalRef.componentInstance.tableName = 'VoucherHeader';
    modalRef.componentInstance.recordId = this.paymentData?.VoucherHeaderSid.toString();
    modalRef.componentInstance.screenName = 'Payment';
  }
}
