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
  NgbPopoverModule,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { ToastrService } from 'ngx-toastr';
import { PaymentService } from '../../services/payment.service';
import { OutstandingInvoice, PaymentMode } from '../../models/receipt.model';
import { getVoucherEntryLink, navigateToVoucherEntry, VoucherType } from 'src/app/common/voucher-route';
import { VOUCHER_FIELD_LIMITS } from 'src/app/common/voucher-field-limits';
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
  Subscription,
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
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { VoucherActionGuardContext, VoucherActionGuardService } from 'src/app/shared/services/voucher-action-guard.service';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';
import { InterBranchTabComponent } from '../../inter-branch/inter-branch-tab.component';
import { InterBranchService } from '../../inter-branch/inter-branch.service';
import { TdsHelperService } from '../../services/tds-helper.service';

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
    NgbTooltipModule,
    NgbPopoverModule,
    ElementStateGuardDirective,
    FormStateGuardDirective,
    InterBranchTabComponent,
  ],
  templateUrl: './payment-entry.component.html',
  styleUrl: './payment-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
    TaxCalculationService,
    TdsHelperService,
  ],
})
export class PaymentEntryComponent implements OnInit, AfterViewInit, HasUnsavedChanges {
  // Voucher-type → entry-route mapping for matching-grid hyperlinks (shared util).
  protected readonly getVoucherEntryLink = getVoucherEntryLink;
  protected readonly VoucherType = VoucherType;
  // Character limits for text fields (single source of truth, mirrors DB widths).
  protected readonly LIMITS = VOUCHER_FIELD_LIMITS;
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
  tdsForm!: FormGroup;
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
  private previousHeaderNarration: string = '';
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
  PartyLedgerLookupConfig = DROPDOWN_CONFIGS.SUBLEDGER_PARTY;

  /** COA LedgerType that represents the party control account on this screen (payment = creditor). */
  private readonly PARTY_LEDGER_TYPE = 'Sy Cr';

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
  isFromPaymentRequest: boolean = false;
  prPaymentRequestNumber: string = '';
  prPaymentRequestSid: number | null = null;
  private isPatching = false;
  private isPrefilling = false;
  private prMasterJobSid: number | null = null;
  private prHouseJobSid: number | null = null;
  private prDepartmentMasterSid: number | null = null;
  private prBookingHeaderSid: number | null = null;

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
    BankPartyName: 'Pay To',
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

    // TDS sub-grid (nested 'tdsDetail' group)
    'tdsDetail.ITSectionCode': 'IT Section Code',
    'tdsDetail.CertificateNo': 'Certificate No',
    'tdsDetail.NotificationNo': 'Notification No',
    'tdsDetail.Reason': 'TDS Reason',
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
  private readonly MATCHING_BATCH_SIZE = 30;
  isLoadingMatching = false;
  private currentSearchPayload: any = null;

  // Per-branch matching pagination — one cursor per tab (source branch + each owning/inter-branch).
  // Single source of truth: one endpoint + loadMatchingData(branchSid) + this cursor map.
  matchingCursors = new Map<number, {
    branchSid: number; branchName: string; isSource: boolean;
    skip: number; hasMore: boolean; includeFullyPaid: boolean;
    take: number; partyLedgerSid?: number; stagedMatches?: any[];
  }>();
  /** BranchMasterSid of the matching tab currently shown (null until the source cursor is seeded). */
  activeMatchingBranchSid: number | null = null;

  // Tabs configuration
  tabs = [
    { name: 'Detail', icon: 'fas fa-address-card' },
    { name: 'Voucher Matching', icon: 'fas fa-code-branch' },
    { name: 'Inter Branch', icon: 'fas fa-flag-checkered' },
  ];
  interBranchBranches: any[] = [];

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
  // Route-id reactivity: Angular reuses this component between two .../payment/entry/:id URLs,
  // so we watch paramMap (not a one-time snapshot) and recreate on a changed id. routeSub is
  // kept separate from destroy$ because patchValues completes destroy$ on read-only loads.
  private routeInitialized = false;
  private loadedPaymentId: number | null = null;
  private routeSub?: Subscription;

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
  private copiedPaymentData: any = null;
  private isCopiedPayment: boolean = false;

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
    private taxCalculationService: TaxCalculationService,
    private voucherActionGuard: VoucherActionGuardService,
    public tdsHelper: TdsHelperService,
    private interBranchService: InterBranchService
  ) {}

  copyDocumentNumber(controlName: string, label: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const documentNo = this.paymentForm?.get(controlName)?.value;
    if (!documentNo) {
      return;
    }
    navigator.clipboard.writeText(String(documentNo)).then(() => {
      this.appSettingService.showSuccess(`${label} copied to clipboard.`);
    });
  }

  private getActionGuardContext(): VoucherActionGuardContext {
    return {
      documentName: 'Payment',
      isSaving: this.isSaving,
      isEditMode: this.isEditMode,
      isReadOnly: this.isReadOnly,
      isPosted: this.isPosted,
      isDirty: this.isDirty,
      headerId: this.headerId,
      formInvalid: this.paymentForm?.invalid,
      status: this.paymentData?.Status,
      postStatus: this.paymentData?.PostStatus,
      canInsert: this.mps.can('insert'),
      canUpdate: this.mps.can('update'),
      canPost: this.mps.can('post'),
    };
  }

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

    // React to the route id. Angular REUSES this component when navigating between two
    // .../payment/entry/:id URLs (same route config), so a one-time snapshot read would leave
    // the previous payment patched. First emission runs the normal load; a later emission with
    // a different id means the instance was reused for another payment → force a fresh instance
    // (clean edit-load) by bouncing through the list route. (entry vs entry/:id are separate
    // routes, so create↔edit — incl. copy/new — already recreates and isn't handled here.)
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id')) || null;

      if (this.routeInitialized) {
        if (id !== this.loadedPaymentId) {
          this.router
            .navigateByUrl('/accounts/payment/list', { skipLocationChange: true })
            .then(() => navigateToVoucherEntry(this.router, VoucherType.PAYMENT, id));
        }
        return;
      }

      this.routeInitialized = true;
      this.loadedPaymentId = id;
      if (id) {
        this.headerId = id;
      }
      const historyState = history?.state;
      this.copiedPaymentData = historyState?.copiedPaymentData;
      this.isCopiedPayment = !!historyState?.isCopiedPayment;
      if (this.isCopiedPayment && this.copiedPaymentData) {
        history.replaceState({}, '', location.pathname);
      }

      // Load currencies first, then fetch the payment so currencyList
      // is always populated before patchValues runs.
      this.loadAllLookups().subscribe(() => {
        if (this.headerId) {
          this.loadInterBranchAllocations(this.headerId); // fire in parallel with the payment fetch
          this.loadPayment(this.headerId);
        } else {
          if (this.isCopiedPayment && this.copiedPaymentData) {
            this.patchValues(this.copiedPaymentData);
            this.applyCopiedPaymentMode();
            this.spinner.hide();
          }
          this.subscribeToPartyAndBankChanges();
          if (this.paymentRequestSid) {
            this.prefillFromPaymentRequest(this.paymentRequestSid);
          }
        }
      });
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
          if (entries[0].isIntersecting) this.loadMatchingData(this.activeMatchingBranchSid);
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
    // View mode: never validate.
    if (this.isViewMode) {
      this.voucherConstraints = { isClosed: false, errorMessage: null };
      return;
    }
    // Edit mode AND user hasn't changed the date → skip (allow save without checking).
    if (this.headerId && !this.showVoucherDateError) {
      this.voucherConstraints = { isClosed: false, errorMessage: null };
      return;
    }
    // Create mode, or edit mode after user changed the date → validate like create.
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

      CustomerBranchSid: [null],
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
      MultiBranch: [false],
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
      GST_VAT: ['', [Validators.maxLength(VOUCHER_FIELD_LIMITS.header.GST_VAT)]],
      BankPartyName: ['', [Validators.required, Validators.maxLength(VOUCHER_FIELD_LIMITS.header.BankPartyName)]],
      Narration: ['', [Validators.required, Validators.maxLength(VOUCHER_FIELD_LIMITS.header.Narration)]],
      Remarks: ['', [Validators.maxLength(VOUCHER_FIELD_LIMITS.header.Remarks)]],
      InstrumentMode: [PaymentMode.NEFT, Validators.required],
      InstrumentNumber: ['', [Validators.required, Validators.maxLength(VOUCHER_FIELD_LIMITS.header.InstrumentNumber)]],
      InstrumentDate: [null, [Validators.required]],
      ClearanceDate: [null],

      InvoiceType: ['REG'],
      PlaceOfSupply: [this.appSettingService.getCurrentBranchState()?.stateName || '', [Validators.maxLength(VOUCHER_FIELD_LIMITS.header.PlaceOfSupply)]],
      ReversalVoucher: [null],

      // Form arrays
      detailItems: this.fb.array([]), // charge detail formArray
      voucherMatchings: this.fb.array([]), // voucherMatching formArray
      interBranches: this.fb.array([]), // interBranch formArray

      // TDS toggle state — separate from tdsDetail so it can be tracked independently
      TDSEnabled: [false],
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

    // TDS form — nested inside paymentForm so all TDS field changes flow through
    // paymentForm.valueChanges and are captured by the deepEqual dirty detection.
    this.tdsForm = this.tdsHelper.buildTdsForm(this.fb);
    this.paymentForm.addControl('tdsDetail', this.tdsForm);

    // Recalculate TDS amounts whenever detail rows change
    this.paymentForm.get('detailItems')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(150))
      .subscribe(() => {
        if (this.isPatching || !this.tdsHelper.isTDSEnabled || this.isPosted) return;
        this.runTDSRecalc();
        this.validateAmount();
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

    // All requests run in parallel. The returned observable resolves only when
    // every lookup completes so callers (payment-load, PR prefill) can safely
    // read partyList / currencyList without a race condition.
    return forkJoin({
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
      currencies: this.dropdownStore.loadCurrencies().pipe(catchError(() => of([]))),
    }).pipe(
      tap(({ parties, bankTypedLedgers, cashTypeLedgers, currencies }) => {
        this.partyList = parties.data;
        this.bankTypedLedgers = bankTypedLedgers.data;
        this.cashTypeLedgers = cashTypeLedgers.data;

        const cusMap = new Map<number, any>();
        this.partyList.forEach((customer) => {
          cusMap.set(customer.CustomerMasterSid, customer);
        });
        this.onlyCustomerList = Array.from(cusMap.values());

        this.currencyList = (currencies || []).map((c) => ({
          ...c,
          countryName: c?.countryMaster?.countryName,
        }));
        this.currencyConfigService.initializeConfigurations(this.currencyList);
        const companyCurrency = this.r['CurrencyMasterSid']?.getRawValue();
        this.setCurrencyCode(companyCurrency);

        if (!this.isEditMode) {
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

    // TDS sets — India only
    if (this.currentCompanyCountryCode === 'in' && CompanyMasterSid) {
      this.tdsHelper.loadTDSSets().subscribe();
    }
    forkJoin({
      coaWithLedgerCategoryAsLedger: this.accountService
        .getAllCoaWithLedgerCategory({
          LedgerCategory: 'Ledger',
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          filterNonJob: false,
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
          // For PR rows: coaList arrival may have just enabled HSSAC — load charge-specific list
          if (this.isFromPaymentRequest && this.isHSSACEnabledForRow(i)) {
            const row = this.detailItems.at(i) as FormGroup;
            const chargeSid = row.get('ChargeMasterSid')?.getRawValue();
            if (chargeSid) {
              if (this.hssacListForRow[i]?.length > 0 && !row.get('HSSACMasterSid')?.value) {
                row.patchValue({ HSSACMasterSid: this.hssacListForRow[i][0].HSSACMasterSid }, { emitEvent: false });
                this.recalcPaymentTaxForRow(i);
              } else if (!this.hssacListForRow[i]?.length) {
                this.loadHSSACForCharge(i, chargeSid);
              }
            }
          }
        }
        // coaList + hssacList are now available — refresh labels for rows already patched
        // (handles the race where forkJoin arrives after the 1000ms patchValues timer)
        this.refreshTaxLabelCache();
        // Re-enforce PlaceOfSupply guard in case forkJoin won the race (arrived after the timeout)
        if (!this.isPosted && !this.isReadOnly) {
          this.recalcAllPaymentTaxRows();
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
    // ControlValueAccessor writes CustomerBranchSid automatically via bindValue
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
      case 'Party': {
        const selectedParty = this.partyList.find(p => p.CustomerBranchSid === form.CustomerBranchSid);
        payload.LedgerMasterSid = selectedParty?.SubledgerMasterSid ?? null;
        break;
      }

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

      if(this.isEditMode && !this.isPosted && form.SearchType === 'Party' && form.CustomerBranchSid !== this.r['CustomerBranchSid']?.getRawValue() && this.hasMatchingDetails) {
        this.appSettingService.showWarning(`Already a party ${this.r['PartyName']?.getRawValue()} involved in this payment. \nCannot select a different one.`);
        return;
      }

    // In create mode, if matchings already exist for a different party, confirm before proceeding
    if (!this.isEditMode && this.voucherMatchings?.length > 0) {
      const currentPartyBranchInHeader = this.r['CustomerBranchSid']?.getRawValue();
      const newPartyInSearch = form.SearchType === 'Party' ? form.CustomerBranchSid : null;

      // Different party (or invoice search which may resolve to a different party)
      if (newPartyInSearch !== currentPartyBranchInHeader || form.SearchType !== 'Party') {
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
        // Party changed → owning outstanding is party-scoped, so drop owning tabs/rows too.
        this.matchingCursors.clear(); // source cursor re-seeded below
      }
    }

    // Reset to the source-branch tab; owning tabs are added via the Inter Branch tab.
    this.currentSearchPayload = payload;
    const sourceSid = this.currentBranch?.BranchMasterSid;
    this.seedSourceMatchingCursor(form.IncludeFullyPaid);
    this.activeMatchingBranchSid = sourceSid ?? null;

    this.spinner.show();
    this.loadMatchingData(sourceSid);
  }

  /** Seed (or reset) the source-branch matching cursor — the default tab. */
  private seedSourceMatchingCursor(includeFullyPaid: boolean): void {
    const sid = this.currentBranch?.BranchMasterSid;
    if (sid == null) return;
    this.matchingCursors.set(sid, {
      branchSid: sid,
      branchName: this.currentBranch?.branchName || this.currentBranch?.BranchName || 'Source Branch',
      isSource: true,
      skip: 0,
      hasMore: true,
      includeFullyPaid: !!includeFullyPaid,
      take: this.MATCHING_BATCH_SIZE,
    });
  }

  /**
   * Ensure a source-branch tab exists and is active (idempotent). Used on edit-load and owning-add,
   * where `searchOutstanding` hasn't seeded the source cursor; `hasMore:false` so pre-loaded saved
   * matches don't auto-paginate until the user explicitly searches.
   */
  private ensureSourceMatchingTab(): void {
    const sid = this.currentBranch?.BranchMasterSid;
    if (sid == null) return;
    if (!this.matchingCursors.has(sid)) {
      this.matchingCursors.set(sid, {
        branchSid: sid,
        branchName: this.currentBranch?.branchName || this.currentBranch?.BranchName || 'Source Branch',
        isSource: true,
        skip: 0,
        hasMore: false,
        includeFullyPaid: false,
        take: this.MATCHING_BATCH_SIZE,
      });
    }
    if (this.activeMatchingBranchSid == null) this.activeMatchingBranchSid = sid;
  }

  /**
   * Load the next page of outstanding for ONE branch tab (source or owning). Single source of truth:
   * the source tab uses the party/invoice/house search criteria; owning tabs always fetch the party's
   * outstanding in that branch. Rows are tagged with allotmentBranchSid for owning branches.
   */
  loadMatchingData(branchSid: number | null = this.activeMatchingBranchSid) {
    if (branchSid == null) return;
    const cursor = this.matchingCursors.get(branchSid);
    if (!cursor || !cursor.hasMore || this.isLoadingMatching) return;
    // Source tab needs the party/invoice/house search criteria; owning tabs build their own payload
    // (so they still load on edit, where no source search has run and currentSearchPayload is null).
    if (cursor.isSource && !this.currentSearchPayload) return;
    this.isLoadingMatching = true;

    const payload = cursor.isSource
      ? { ...this.currentSearchPayload, BranchMasterSid: branchSid, Skip: cursor.skip, Take: cursor.take }
      : {
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          BranchMasterSid: branchSid,
          LedgerMasterSid: cursor.partyLedgerSid ?? this.paymentForm.get('PartyMasterSid')?.value,
          IncludeFullyPaid: cursor.includeFullyPaid,
          LedgerType: 'Sy Cr',
          Skip: cursor.skip,
          Take: cursor.take,
        };

    const wasFirstPage = cursor.skip === 0;
    this.accountService.getPaymentOutstanding(payload).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : [];
        if (data.length > 0) {
          if (cursor.isSource && wasFirstPage) {
            this.patchHeaderValue(data);
          }
          const rows = cursor.isSource
            ? data
            : data.map((t: any) => ({
                ...t,
                allotmentBranchSid: branchSid,
                BranchName: t.BranchName || t.branchName || cursor.branchName,
              }));
          this.appendMatchingRows(rows);
          cursor.skip += data.length;
          cursor.hasMore = data.length >= cursor.take;
          if (!cursor.isSource) {
            if (cursor.stagedMatches?.length) {
              this.applyStagedMatches(branchSid, cursor.stagedMatches);
              cursor.stagedMatches = undefined;
            }
            this.recomputeInterBranchMemo();
          }
        } else {
          if (cursor.isSource && wasFirstPage) {
            const searchType = this.searchOutstandingForm.get('SearchType')?.value;
            this.appSettingService.showWarning(`No outstanding found for this ${searchType}.`);
            // For Party search: still apply the party to the header so the user
            // can proceed with a manual entry without a matching record.
            if (searchType === 'Party') {
              const custBranchSid = this.searchOutstandingForm.get('CustomerBranchSid')?.getRawValue();
              const party = this.partyList.find((p: any) => p.CustomerBranchSid === custBranchSid)
                ?? this.selectedPartyItemForSearch;
              if (party) {
                this.onPartyChange(party, true);
              }
            }
          }
          cursor.hasMore = false;
        }
        this.isLoadingMatching = false;
        this.spinner.hide();
        if (this.activeMatchingBranchSid === branchSid && cursor.hasMore) {
          setTimeout(() => this.reobserveMatchingSentinel(), 100);
        }
      },
      error: () => {
        this.isLoadingMatching = false;
        this.spinner.hide();
      },
    });
  }

  /** Matching tabs in display order (source first, then owning branches by insertion order). */
  get matchingTabs() {
    return [...this.matchingCursors.values()];
  }

  /** Show the tab strip only when inter-branch is active with at least one owning branch added. */
  get showMatchingTabs(): boolean {
    return (this.interBranches?.length ?? 0) > 0;
  }

  /** True when the given matching row belongs to the active tab (source = untagged rows). */
  rowBelongsToActiveTab(control: AbstractControl): boolean {
    const branchSid = this.activeMatchingBranchSid;
    if (branchSid == null) return true;
    const cursor = this.matchingCursors.get(branchSid);
    const tag = control.get('allotmentBranchSid')?.value ?? null;
    return cursor?.isSource ? tag == null : tag === branchSid;
  }

  /** Switch the visible matching tab; lazy-load its first page if not yet fetched. */
  selectMatchingTab(branchSid: number): void {
    this.activeMatchingBranchSid = branchSid;
    const cursor = this.matchingCursors.get(branchSid);
    const hasRows = this.voucherMatchings.controls.some(
      (c) => (c.get('allotmentBranchSid')?.value ?? null) === (cursor?.isSource ? null : branchSid),
    );
    if (cursor && !hasRows && cursor.hasMore) {
      this.spinner.show();
      this.loadMatchingData(branchSid);
    } else {
      setTimeout(() => this.reobserveMatchingSentinel(), 50);
    }
  }

  /** Re-tick previously staged owning-branch matches after their rows are (re)loaded (edit mode). */
  private applyStagedMatches(branchSid: number, stagedMatches: any[]): void {
    const byTxn = new Map(stagedMatches.map((m) => [m.VoucherTransactionSid, m]));
    this.voucherMatchings.controls
      .filter((c) => c.get('allotmentBranchSid')?.value === branchSid)
      .forEach((c) => {
        const m = byTxn.get(c.get('VoucherTransactionSid')?.value);
        if (!m) return;
        c.get('matchCurr')?.setValue(m.MatchingCurrency ?? c.get('matchCurr')?.value, { emitEvent: false });
        c.get('matchCurrAmt')?.setValue(toNumber(m.MatchingAmount), { emitEvent: false });
        c.get('matchLocalAmt')?.setValue(toNumber(m.MatchingLocalAmount), { emitEvent: false });
        c.get('matchPartyAmt')?.setValue(toNumber(m.PartyAmount ?? m.MatchingAmount), { emitEvent: false });
        c.get('isTicked')?.setValue(true, { emitEvent: false });
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
        branchName: [tx.BranchName || tx.branchName || ''],
        // null = source-branch row (normal payment matching); set = owning (inter-branch) row
        allotmentBranchSid: [tx.allotmentBranchSid ?? null],

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
        // Display-only: party-row narration shown as a hover popover on the Voucher No. cell
        narration: [{ value: tx.Narration ?? '', disabled: true }],
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
      this.searchOutstandingForm.get('CustomerBranchSid')?.disable();
      this.paymentForm.get('PartyMasterSid')?.disable();
    } else if (
      res.length > 0 &&
      this.searchOutstandingForm.get('SearchType')?.value === 'Party' &&
      this.searchOutstandingForm.get('CustomerBranchSid')?.value
    ) {
      const branchSid = this.searchOutstandingForm.get('CustomerBranchSid')?.getRawValue();
      const party = this.partyList.find(p => p.CustomerBranchSid === branchSid)
        ?? this.selectedPartyItemForSearch;
      this.onPartyChange(party, true);
      this.paymentForm.get('PartyMasterSid')?.disable();
    }
  }

  onSubmit(resolve?: (value: boolean) => void, isPostingTrue?: boolean) {
    const blockedReason = this.voucherActionGuard.getSaveBlockedReason(this.getActionGuardContext());
    if (this.voucherActionGuard.block(blockedReason, resolve)) return;

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

    for (const rawRow of (this.paymentForm.getRawValue().detailItems || [])) {
      const coa = this.coaList?.find((c: any) => c.COAMasterSid === rawRow.COAMasterSid);
      if (coa?.LedgerType === 'Cost' && !rawRow.MasterJobSid && !rawRow.HouseJobSid) {
        this.appSettingService.showError(
          `Charge "${rawRow.ChargeDescription || rawRow.COAMasterSid}" has Ledger Type "Cost" — Master Job or House Job is required.`
        );
        this.isSaving = false;
        this.spinner.hide();
        if (resolve) resolve(false);
        return;
      }
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

    const matchingHappened = (this.voucherMatchings.getRawValue() || []).filter(mt => !mt.allotmentBranchSid).some(mt => toNumber(mt.matchCurrAmt) || toNumber(mt.matchLocalAmt));
    if(matchingHappened && toNumber(this.getTotalMatchPartyAmt()) < 0) {
      this.appSettingService.showError(
        'Please make sure the matching amount is greater or equal to zero.'
      );
      if (resolve) resolve(false);
      this.isSaving = false;
      return;
    }

    const matchingAmt = this.getTotalMatchPartyAmt();
    const partyAmt = partyDetail?.PartyAmount ?? 0;
    if (formValue.PartyMasterSid && toNumber(matchingAmt) > toNumber(partyAmt)) {
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
      if (!formValue.CustomerBranchSid) {
        // No counterparty (expense payment, PR conversion, etc.) — company's own state → CGST+SGST
        interOrIntra = 'Intra';
      } else if (currentCompanyState === customerState) {
        interOrIntra = 'Intra';
      } else {
        interOrIntra = 'Inter';
      }
    }

    const voucherMatching = this.voucherMatchings.getRawValue()
      .filter((vm) => !vm.allotmentBranchSid) // owning-branch rows are staged via inter-branch, not matched on the source payment
      .map((vm) => ({
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

    const bankRow = detailItems.find((d: any) => d.COAMasterSid === formValue.BankCOA);

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      CashOrBank: formValue.CashOrBank,
      MultiBranch: formValue.MultiBranch ? 'Y' : 'N',
      VoucherDate: formValue.VoucherDate,
      YearMasterSid: this.currentYearId,
      Narration: formValue.Narration,
      // PR-converted payments must not carry party FK fields — the payment settles
      // operational charges, not a vendor-ledger balance.  PartyMasterSid / CustomerBranchSid
      // / COAMasterSid are kept null so outstanding and sub-ledger logic is not mis-triggered.
      PartyMasterSid: this.isFromPaymentRequest ? null : formValue.PartyMasterSid,
      PartyName: this.isFromPaymentRequest ? '' : formValue.PartyName,
      PartyAddress: this.isFromPaymentRequest ? '' : formValue.PartyAddress,
      CustomerBranchSid: this.isFromPaymentRequest ? null : formValue.CustomerBranchSid,
      PlaceOfSupply: formValue.PlaceOfSupply,
      State: interOrIntra,
      COAMasterSid: this.isFromPaymentRequest ? null : formValue.COAMasterSid,
      BankCOA: formValue.BankCOA,
      BankPartyName: formValue.BankPartyName,
      GST_VAT: this.isFromPaymentRequest ? '' : formValue.GST_VAT,
      ReversalVoucher: this.isFromPaymentRequest
        ? (this.paymentRequestSid ?? formValue.ReversalVoucher)
        : formValue.ReversalVoucher,
      TaxNumber: formValue.TaxNumber,
      InvoiceType : formValue.InvoiceType || 'REG',
      GSTType: this.currentCompanyCountryCode !== 'in' ? 'VAT' : (formValue.GSTType || ''),
      Remarks: formValue.Remarks,
      CurrencyMasterSid: formValue.CurrencyMasterSid,
      CurrencyCode: formValue.CurrencyCode,
      ExchangeRate: formValue.ExchangeRate,
      Amount: bankRow?.Amount ?? 0,
      LocalAmount: bankRow?.LocalAmount ?? 0,
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
      // TDS applies only when a party (vendor sub-ledger) row is part of the payment.
      // PR-converted payments settle operational charges/expenses — no TDS deduction.
      // For direct payments, require a party row in detailItems as the source of deduction.
      tdsDetail: this.buildTdsDetailForPayload(detailItems, formValue),
      PaymentRequestSid: this.paymentRequestSid,
      MasterJobSid: this.prMasterJobSid ?? null,
      HouseJobSid: this.prHouseJobSid ?? null,
      BookingHeaderSid: this.prBookingHeaderSid ?? null,
      DepartmentMasterSid: this.prDepartmentMasterSid ?? null,
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
            // Stage inter-branch first, THEN reload — so the reload's getAllocations sees the staged rows.
            this.stageInterBranchIfNeeded(this.headerId, () => this.loadPayment(this.headerId));
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
            // Stage inter-branch first, THEN navigate/reload — avoids the reload racing the stage POST.
            this.stageInterBranchIfNeeded(this.headerId, () => {
              if (this.headerId) {
                navigateToVoucherEntry(this.router, VoucherType.PAYMENT, this.headerId);
              }
            });
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
    const blockedReason = this.voucherActionGuard.getPostBlockedReason(this.getActionGuardContext());
    if (this.voucherActionGuard.block(blockedReason)) return;

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
        if (!this.r['CustomerBranchSid']?.value) {
          // No counterparty (expense payment, PR conversion, etc.) — company's own state → CGST+SGST
          interOrIntra = 'Intra';
        } else if (currentCompanyState === customerState) {
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
        // Posting created the Source JV (JV①) + mirror JVs (JV②). Reload the inter-branch tab so their
        // voucher numbers surface on the allocation grid (getAllocations returns them once posted).
        // Strip the pre-post owning rows/cursors first so the posted reload doesn't duplicate them.
        if (this.paymentForm.get('MultiBranch')?.value && this.headerId) {
          this.removeOwningBranchMatchingRows();
          this.loadInterBranchAllocations(this.headerId);
        }
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
        this.appSettingService.showError(
      error?.error?.message || 'Access denied.'
    );
      },
    });
  }

  private prefillFromPaymentRequest(paymentRequestSid: number) {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const payload = {
      PaymentRequestSid: paymentRequestSid,
      CompanyMasterSid,
      BranchMasterSid
    }
    this.operationService.getPaymentRequestById(payload).subscribe({
      next: async (resp: any) => {
        if (!resp.status) {
          this.appSettingService.showWarning( 'Access denied.');
          return;
        }

        const request = resp.data;
        this.prMasterJobSid = request.MasterJobSid ?? null;
        this.prHouseJobSid = request.HouseJobSid ?? null;
        this.prDepartmentMasterSid = request.DepartmentMasterSid ?? null;
        this.prBookingHeaderSid = request.BookingSid ?? null;
        if (request?.PaymentRequestStatus !== 'Approved') {
          this.appSettingService.showWarning('Payment voucher can be created only for approved payment request');
          return;
        }

        if (request?.VoucherSid) {
          this.appSettingService.showWarning('Payment voucher already created for this payment request');
          return;
        }

        const firstDetail = request?.paymentRequestDetails?.[0];

        // Payment Request Party is informational only. Do not patch it into
        // the payment header or create the auto party ledger row.
        this.isFromPaymentRequest = true;
        this.prPaymentRequestSid = paymentRequestSid;
        this.isPrefilling = true;

        this.paymentForm.patchValue({
          PartyMasterSid: null,
          PartyName: '',
          PartyAddress: '',
          CustomerBranchSid: null,
          COAMasterSid: null,
          GST_VAT: '',
          BankPartyName: request.PayableTo || '',
        }, { emitEvent: false });

        const currencySid = firstDetail?.CostCurrencyMasterSid || this.r['CurrencyMasterSid']?.value;
        const exchangeRate = firstDetail?.CostExchangeRate || 1;

        this.paymentForm.patchValue({
          VoucherDate: this.toInputDate(request.PaymentRequestDate),
          CashOrBank: request.CashBank === 'Cash' ? 'C' : 'B',
          CurrencyMasterSid: currencySid,
          Narration: `Payment against request ${request.PaymentRequestNumber}`,
          Remarks: request.Remarks || '',
          BankPartyName: request.PayableTo || '',
        });
        this.setCurrencyCode(currencySid);

        // Set exchange rate directly from saved payment request — no async API call.
        const exCtrl = this.paymentForm.get('ExchangeRate');
        const currCtrl = this.paymentForm.get('CurrencyMasterSid');
        exCtrl?.setValue(this.getFormattedAndPaddedExchangeRate(exchangeRate, currencySid));
        if (currencySid === this.currentCompany?.CurrencyMasterSid) {
          exCtrl?.disable({ emitEvent: false });
          currCtrl?.disable({ emitEvent: false });
        } else {
          exCtrl?.enable({ emitEvent: false });
          currCtrl?.enable({ emitEvent: false });
        }
        // Lock fields derived from payment request
        this.paymentForm.get('CashOrBank')?.disable({ emitEvent: false });

        // Cash PR has no instrument — clear the seeded NEFT default + drop the
        // instrument validators (the fields are hidden when CashOrBank === 'C',
        // so leaving them required would block save on unreachable controls).
        const isCashPR = request.CashBank === 'Cash';
        if (isCashPR) {
          this.paymentForm.patchValue(
            { InstrumentMode: null, InstrumentNumber: '', InstrumentDate: null, ClearanceDate: null },
            { emitEvent: false },
          );
        }
        this.setInstrumentValidators(isCashPR);

        // Release the guard before adding charge detail rows
        this.isPrefilling = false;

        // Build master/house job display objects from PR header relations
        const prMasterJobObj: any = request.masterJob
          ? { ...request.masterJob }
          : (request.MasterJobSid ? { MasterJobSid: request.MasterJobSid, MasterJobNumber: String(request.MasterJobSid) } : null);
        const prHouseJobObj: any = request.houseJob
          ? { ...request.houseJob }
          : (request.HouseJobSid ? { HouseJobSid: request.HouseJobSid, HBLNo: String(request.HouseJobSid) } : null);

        (request.paymentRequestDetails || []).forEach((detail: any) => {
          this.addDetailRow({
            COAMasterSid: detail.COAMasterSid || null,
            LedgerMasterSid: detail.LedgerMasterSid || null,
            DrCr: detail.DrCr || 'D',
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
            PartyAmount: detail.CostLocalAmount || detail.CostAmount || 0,
            CostRevenueChargesSid: detail.CostRevenueChargesSid || null,
            BookingRatesSid: detail.BookingRatesSid || null,
            SourceDetailSid: detail.PaymentRequestDtlSid ?? null,
          }, false);
          const rowIndex = this.detailItems.length - 1;

          if (detail.COAMasterSid) {
            this.handleCOAChange(
              {
                COAMasterSid: detail.COAMasterSid,
                SubledgerName: detail.LedgerMasterSid != null ? 'Y' : 'N',
              },
              rowIndex,
              true,
            );
          }

          // Load charge list for department.
          // Do NOT call filterDetailsWithDept — it resets job state for the row.
          const deptSid = detail.DepartmentMasterSid || request.DepartmentMasterSid;
          if (deptSid) {
            const dept = this.deptList?.find((d: any) => d.DepartmentMasterSid === deptSid);
            if (dept) this.filterChargeByDeptForARow(dept, rowIndex);
          }

          // Load charge-specific HSSAC list for tax calculation
          if (detail.ChargeMasterSid) {
            this.loadHSSACForCharge(rowIndex, detail.ChargeMasterSid);
          }

          // Seed masterJobList so ng-select shows the label immediately (before API resolves)
          if (prMasterJobObj) {
            this.masterJobList[rowIndex] = [prMasterJobObj];
            this.detailItems.at(rowIndex)?.get('masterJob')?.setValue(prMasterJobObj, { emitEvent: false });
            // onMasterJobChange sets up house job loading and disables dept field
            this.onMasterJobChange(rowIndex, prMasterJobObj);
          }

          // Seed houseJobList after onMasterJobChange clears it (its API call is still pending)
          if (prHouseJobObj) {
            this.houseJobList[rowIndex] = [prHouseJobObj];
            this.detailItems.at(rowIndex)?.get('houseJob')?.setValue(prHouseJobObj, { emitEvent: false });
          }
        });

        // Lock all prefilled detail fields — only Amount and LocalAmount remain editable
        const prLockedFields = [
          'COAMasterSid', 'LedgerMasterSid', 'DrCr',
          'CurrencyMasterSid', 'CurrencyCode', 'ExchangeRate',
          'NumberOfUnit', 'Rate',
          'DepartmentMasterSid', 'ChargeMasterSid', 'ChargeDescription', 'ChargeUOMSid',
          'HouseJobSid', 'MasterJobSid',
        ];
        this.detailItems.controls.forEach((ctrl) => {
          prLockedFields.forEach(field => (ctrl as FormGroup).get(field)?.disable({ emitEvent: false }));
        });

        // PlaceOfSupply defaults to branch state (from initializeForm) and taxCalculationService
        // defaults to company's own state (from initPaymentTaxService), so CGST+SGST / VAT
        // will calculate correctly for these no-party rows without any extra steps here.
        this.recalcAllPaymentTaxRows();

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
    this.isFromPaymentRequest = !!(headerInfo.ReversalVoucher || headerInfo.PaymentRequestSid);
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
        ReversalVoucher: headerInfo.ReversalVoucher ?? null,
        // Restore PlaceOfSupply from saved data; fall back to branch state for no-party payments
        // whose PlaceOfSupply was saved as empty (pre-fix data).
        PlaceOfSupply: headerInfo.PlaceOfSupply ||
          (!headerInfo.CustomerBranchSid
            ? (this.appSettingService.getCurrentBranchState()?.stateName || '')
            : ''),
      },
      { emitEvent: false }
    );
    this.previousHeaderNarration = headerInfo.Narration || '';
    const prSid = headerInfo.ReversalVoucher || headerInfo.PaymentRequestSid;
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const payload = {
      PaymentRequestSid: prSid,
      CompanyMasterSid,
      BranchMasterSid
    }
    if (prSid) {
      this.prPaymentRequestSid = prSid;
      this.operationService.getPaymentRequestById(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({ next: (r: any) => {
          if (r?.data) this.prPaymentRequestNumber = r.data.PaymentRequestNumber || '';
        }});
    }

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
    this.searchOutstandingForm.get('CustomerBranchSid')?.setValue(headerInfo.CustomerBranchSid ?? null);

    this.paymentForm.get('CashOrBank')?.disable({ emitEvent: false });

    // Re-check auto posting for the loaded CashOrBank value
    this.checkVoucherPostingMechanism(headerInfo.CashOrBank);

    this.setInstrumentValidators(headerInfo.CashOrBank === 'C');
    this.isPosted = response.PostStatus === 'P';
    this.isReadOnly = response.PostStatus !== 'U' || response.Status !== 'A';

    this.detailItems.clear();
    const detailItems = response.VoucherDetail || [];
    detailItems.forEach((d, index) => {
      const detailRecord = {
        VoucherDetailSid: d.VoucherDetailSid,
        SourceDetailSid: d.SourceDetailSid ?? d.PaymentRequestDtlSid ?? null,
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
        CostRevenueChargesSid: d.CostRevenueChargesSid || null,
        masterJob: d.masterJob || null,
        houseJob: d.houseJob || null,
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
      const masterJobObj = d.masterJob || { MasterJobSid: d.MasterJobSid };
      if (d.MasterJobSid && d.masterJob) {
        this.masterJobList[index] = [d.masterJob];
      }
      this.onMasterJobChange(index, masterJobObj);
      // Re-seed houseJobList and houseJob control after onMasterJobChange clears them
      if (d.HouseJobSid && d.houseJob) {
        this.houseJobList[index] = [d.houseJob];
        this.detailItems.at(index)?.get('houseJob')?.setValue(d.houseJob, { emitEvent: false });
      }
    });

    // Update filtered COA list based on loaded data
    this.rebuildFilteredCoaListForAllRows();

    // Lock auto-inserted party/bank rows in edit mode
    for (let i = 0; i < this.detailItems.length; i++) {
      const isParty = this.isAutoPartyRow(i);
      if (isParty || this.isAutoBankRow(i)) {
        if (isParty) {
          // The party row's COA is a party control account (Sy Cr) → its picker is fed by the
          // header's CustomerBranchSid (the branch isn't persisted at detail level).
          this.detailItems.at(i).get('CustomerBranchSid')?.setValue(
            this.r['CustomerBranchSid']?.getRawValue(), { emitEvent: false });
        }
        ['COAMasterSid', 'LedgerMasterSid', 'CustomerBranchSid', 'DrCr', 'CurrencyMasterSid', 'CurrencyCode'].forEach(field => {
          this.detailItems.at(i).get(field)?.disable({ emitEvent: false });
        });
      }
      // Extra advance creditor rows (cash multi-party) use the classic subledger dropdown; their
      // ledgerList is loaded by handleCOAChange in the detail loop above, so nothing to do here.
    }

    // Lock charge detail fields for Payment Request payments in edit mode
    if (this.isFromPaymentRequest) {
      const prLockedFields = [
        'COAMasterSid', 'LedgerMasterSid', 'DrCr',
        'CurrencyMasterSid', 'CurrencyCode', 'ExchangeRate',
        'NumberOfUnit', 'Rate',
        'DepartmentMasterSid', 'ChargeMasterSid', 'ChargeDescription', 'ChargeUOMSid',
        'HouseJobSid', 'MasterJobSid',
      ];
      this.detailItems.controls.forEach((ctrl) => {
        prLockedFields.forEach(f => (ctrl as FormGroup).get(f)?.disable({ emitEvent: false }));
      });
      this.searchOutstandingForm.get('CustomerBranchSid')?.disable({ emitEvent: false });

      // Load charge-specific HSSAC lists for PR rows in edit mode
      this.detailItems.controls.forEach((ctrl, i) => {
        const chargeSid = (ctrl as FormGroup).get('ChargeMasterSid')?.getRawValue();
        if (chargeSid) this.loadHSSACForCharge(i, chargeSid);
      });
    }

    // const voucherMatchingHeader = response.voucherMatchingHeader || [];
    const voucherMatchingRecords = response.voucherMatchings || [];
    this.patchOutstandingFormArray(voucherMatchingRecords);

    // Restore VoucherTDS (India only)
    const savedTDS = response.VoucherTDS?.[0];
    if (savedTDS && this.currentCompanyCountryCode === 'in') {
      this.tdsHelper.isTDSEnabled = true;
      this.paymentForm.get('TDSEnabled')?.setValue(true, { emitEvent: false });
      this.tdsHelper.patchFromSavedTDS(
        savedTDS,
        this.tdsForm,
        (n) => this.getFormattedAndPaddedAmount(n, headerInfo.CurrencyMasterSid),
        (n) => this.getFormattedAndPaddedAmount(n, this.currentCompany?.CurrencyMasterSid),
      );
      const headerSidForRates = savedTDS.TDSSetRate?.TDSSetHeaderSid ?? this.tdsForm.get('TDSSetHeaderSid')?.value;
      if (headerSidForRates) {
        this.tdsHelper.loadRatesForSet(headerSidForRates).subscribe();
      }
      // For unposted edit mode: fetch mapping context (limits + FY cumulative) so
      // subsequent recalcTDSAmounts calls use the correct thresholds.
      // Skipped for posted payments — CertificateNo/NotificationNo are now stored
      // directly in VoucherTDS and restored by patchFromSavedTDS above; no recalc needed.
      if (!this.isPosted) {
        let tdsContextBranchSid: number | null = headerInfo.CustomerBranchSid ?? null;
        if (!tdsContextBranchSid) {
          const vendorDetail = (response.VoucherDetail || []).find((d: any) => d.LedgerMasterSid);
          if (vendorDetail) {
            const match = this.partyList.find((p: any) => p.SubledgerMasterSid === vendorDetail.LedgerMasterSid);
            tdsContextBranchSid = match?.CustomerBranchSid ?? null;
          }
        }
        this.refreshSupplierTDSContext(tdsContextBranchSid);
      }
    }

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
      // Re-enforce PlaceOfSupply guard after edit data is fully patched — zero out tax
      // amounts on rows where no party/Place of Supply was saved (e.g. PR-converted payments).
      this.recalcAllPaymentTaxRows();
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
      SourceDetailSid: [data?.SourceDetailSid ?? data?.PaymentRequestDtlSid ?? null],
      VoucherHeaderSid: [data?.VoucherHeaderSid || null],
      Sno: [data?.Sno || 1],
      Status: [data?.Status || 'A'],

      // Foreign keys
      COAMasterSid: [data?.COAMasterSid || null, [Validators.required]],
      LedgerMasterSid: [data?.LedgerMasterSid || null, [Validators.required]],
      // UI-only: when the row's COA is the party control account (Sy Cr), the subledger cell
      // becomes a party picker bound to this branch; header already persists the branch.
      CustomerBranchSid: [data?.CustomerBranchSid || null],
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

      Narration: [data?.Narration || '', [Validators.maxLength(VOUCHER_FIELD_LIMITS.detail.Narration)]],
      CostCenter: [data?.CostCenter || null],
      ProfitCenter: [data?.ProfitCenter || null],
      DepartmentMasterSid: [data?.DepartmentMasterSid || null],
      ChargeMasterSid: [data?.ChargeMasterSid || null],
      ChargeDescription: [data?.ChargeDescription || '', [Validators.maxLength(VOUCHER_FIELD_LIMITS.detail.ChargeDescription)]],
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
      Remarks: [data?.Remarks || '', [Validators.maxLength(VOUCHER_FIELD_LIMITS.detail.Remarks)]],
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
      CostRevenueChargesSid: [data?.CostRevenueChargesSid || null],
      BookingRatesSid: [data?.BookingRatesSid || null],
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
    if (!data) {
      const blockedReason = this.voucherActionGuard.getDetailMutationBlockedReason(this.getActionGuardContext());
      if (this.voucherActionGuard.block(blockedReason)) return;
    }

    const newRow = this.constructDetailItems(data);
    if (!newRow.get('Narration')?.value) {
      newRow.patchValue({ Narration: this.r['Narration']?.value || '' }, { emitEvent: false });
    }
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
      // For auto party/bank rows or PR-prefilled rows, keep currency fields disabled
      const isLockedRow = this.isAutoPartyRow(detailIndex) || this.isAutoBankRow(detailIndex);
      const isPRRow = !!detail.get('SourceDetailSid')?.value;
      if (!isLockedRow && !isPRRow) {
        detail.get('CurrencyMasterSid')?.enable({ emitEvent: false });
        detail.get('CurrencyCode')?.enable({ emitEvent: false });
        detail.get('ExchangeRate')?.enable({ emitEvent: false });
      }
    }
    this.calculateLocalAmount(detailIndex,true);
  }

  removeDetail(detailIndex: number, VoucherDetailSid?: number) {
    const blockedReason = this.voucherActionGuard.getDetailMutationBlockedReason(this.getActionGuardContext());
    if (this.voucherActionGuard.block(blockedReason)) return;

    const wasAdvance = this.isExtraAdvanceRow(detailIndex);
    // Remove from form array only — the backend soft-deletes orphaned rows on save
    (this.detailItems as FormArray).removeAt(detailIndex);
    this.filteredCoaList.splice(detailIndex, 1);
    this.removeJobSearchState(detailIndex);
    this.rebuildFilteredCoaListForAllRows();
    // Re-balance the cash row only in the multi-party feature context (an advance was removed, or
    // advances still remain) — single-party / bank payments are left untouched.
    if (wasAdvance || this.detailItems.controls.some((_, i) => this.isExtraAdvanceRow(i))) {
      this.syncCashToParties();
    }
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
        this.refreshSupplierTDS(partySid);
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

    // Replace the previous MAIN (header) party row (the creditor debit row at index 0) AND fold in any
    // row that already carries THIS party — the "first pick" row that promotes to the header, or a
    // would-be duplicate. EXTRA advance rows for OTHER creditors keep a different LedgerMasterSid, so
    // they are preserved.
    const rows = this.detailItems.getRawValue() || [];
    const partyIndexes: number[] = [];
    rows.forEach((d, index) => {
      const isPrevMainAtZero =
        index === 0 &&
        d.DrCr === 'D' &&
        (d.COAMasterSid === partyLedger.COAMappedId ||
          this.isSyCrCoa(d.COAMasterSid) ||
          d.LedgerMasterSid === partyLedger.SubledgerMasterSid);
      const isSameAsNewParty =
        d.LedgerMasterSid != null &&
        Number(d.LedgerMasterSid) === Number(partyLedger.SubledgerMasterSid);
      if (isPrevMainAtZero || isSameAsNewParty) {
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
      // Drives the party-picker display on this (party-COA) row.
      CustomerBranchSid: partyLedger.CustomerBranchSid,
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

    ['COAMasterSid', 'LedgerMasterSid', 'CustomerBranchSid', 'DrCr', 'CurrencyMasterSid', 'CurrencyCode'].forEach(field => {
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
      // Other rows: exclude Sy Dr always, and Sy Cr too — EXCEPT on cash payments, where extra
      // Sy Cr rows are allowed (advances to other creditors). Also exclude the selected bank/cash COA.
      if (partySid) {
        const allowExtraSyCr = this.paymentForm.get('CashOrBank')?.getRawValue() === 'C';
        filtered = filtered.filter((coa) => {
          const lt = coa.LedgerType?.trim();
          if (lt === 'Sy Dr') return false;          // never a payment party type
          if (lt === 'Sy Cr') return allowExtraSyCr;  // extra creditor only in cash mode
          return true;
        });
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
    // Resolve full COA object to get LedgerType/JobNoRequire (during patching, coa may be minimal)
    const fullCoa = this.coaList.find(c => c.COAMasterSid === coa.COAMasterSid) || coa;

    if (this.isScreenPartyCoa(fullCoa)) {
      // Party control account (Sy Cr).
      const ledgerCtrl = (this.detailItems.at(detailIndex) as FormGroup).get('LedgerMasterSid');
      ledgerCtrl?.setValidators([Validators.required]);
      if (this.showPartyPicker(detailIndex)) {
        // Main party row (and the first pick that sets the header) → Customer+Branch picker (partyList).
        if (!isPatching) {
          this.detailItems.at(detailIndex).patchValue(
            { LedgerMasterSid: null, CustomerBranchSid: null },
            { emitEvent: false },
          );
        }
        ledgerCtrl?.updateValueAndValidity({ emitEvent: false });
      } else {
        // Extra advance creditor row → classic subledger dropdown fed from ledgerList[i].
        this.fetchLedgerForCOA(coa, detailIndex, isPatching);
      }
    } else {
      this.fetchLedgerForCOA(coa, detailIndex, isPatching);
    }
    this.updateHSSACEnabledState(detailIndex);

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

  /** True when the COA is this screen's party control account (payment = creditor / Sy Cr). */
  private isScreenPartyCoa(coa: any): boolean {
    return coa?.LedgerType?.trim() === this.PARTY_LEDGER_TYPE;
  }

  /** True when a detail row's chosen COA is the party control account (Sy Cr). */
  isPartyCoaRow(detailIndex: number): boolean {
    const coaSid = this.detailItems.at(detailIndex)?.get('COAMasterSid')?.getRawValue();
    const coa = this.coaList.find((c) => c.COAMasterSid === coaSid);
    return this.isScreenPartyCoa(coa);
  }

  /**
   * Whether a Sy Cr row shows the Customer + Branch party picker (vs the classic subledger dropdown).
   * Only the MAIN (header) party row — and the first Sy Cr pick that promotes to the header before any
   * party exists — needs the branch. Extra advance rows use the classic subledger dropdown (branch is
   * irrelevant for an on-account advance: a customer's branches share one SubledgerMasterSid).
   */
  showPartyPicker(detailIndex: number): boolean {
    if (!this.isPartyCoaRow(detailIndex)) return false;
    if (this.isAutoPartyRow(detailIndex)) return true;
    return !this.r['PartyMasterSid']?.getRawValue();
  }

  /**
   * User picked a party (with branch) from the detail-row party picker.
   * Store the subledger on the row, then — the first time only — promote the full party
   * (with its exact branch) to the header via onPartyChange.
   */
  onPartyLedgerSelect(party: any, detailIndex: number): void {
    const row = this.detailItems.at(detailIndex) as FormGroup;
    const picked = party?.SubledgerMasterSid ?? null;

    // Block a creditor that is already the header party or already on another row.
    // (A customer's branches share one SubledgerMasterSid, so compare on that.)
    const headerParty = this.paymentForm.get('PartyMasterSid')?.getRawValue();
    const dupInOtherRow = (this.detailItems.getRawValue() || []).some(
      (d, i) => i !== detailIndex && Number(d.LedgerMasterSid) === Number(picked),
    );
    if (picked && (Number(picked) === Number(headerParty) || dupInOtherRow)) {
      this.appSettingService.showWarning(
        `${party?.CustomerName ?? 'This party'} is already on this payment.`,
      );
      row.patchValue({ LedgerMasterSid: null, CustomerBranchSid: null }, { emitEvent: false });
      return;
    }

    row.get('LedgerMasterSid')?.setValue(picked, { emitEvent: false });
    this.checkAndUpdateForPartyDetail(detailIndex);

    // First-time guard: never override an already-set header party.
    if (this.paymentForm.get('PartyMasterSid')?.getRawValue()) return;
    if (party?.CustomerBranchSid) this.onPartyChange(party, true);
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
          : this.r['Narration']?.value || '',
    });

    bankCtrl?.patchValue({
      Narration:
        cashOrBank === 'Bank'
          ? `Being ${instrumentMode ? instrumentMode + '-' : ''}${instrumentNumber ? instrumentNumber + '-' : ''}${instrumentDate ? instrumentDate + ' ' : ''}to ${bankPartyName ? bankPartyName + '' : ''}`
          : this.r['Narration']?.value || '',
    });
  }

  onHeaderNarrationChange() {
    const newValue: string = this.r['Narration']?.value || '';
    const prevNarration = this.previousHeaderNarration;

    (this.detailItems.controls as FormGroup[]).forEach((row) => {
      const rowNarration: string = row.get('Narration')?.value ?? '';
      if (!rowNarration || rowNarration === prevNarration) {
        row.patchValue({ Narration: newValue }, { emitEvent: false });
      }
    });

    this.previousHeaderNarration = newValue;
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

  /**
   * Source-branch matching rows only (owning/inter-branch rows excluded).
   * Source-payment LOGIC (party/bank amount sync, validations, save payload, getTotalMatchPartyAmt)
   * must use this — owning-branch ticks flow into stageAllocations().matches instead, NOT into the
   * source payment's own matching.
   */
  get sourceMatchings(): AbstractControl[] {
    return this.voucherMatchings.controls.filter((c) => !c.get('allotmentBranchSid')?.value);
  }

  /**
   * Matching rows of the currently active tab (source tab → untagged rows; owning tab → that branch's
   * rows). DISPLAY totals (footer "Net" row + the "Matching" summary box) use this so each tab shows
   * its own totals; defaults to source rows before a tab is selected.
   */
  get activeTabMatchings(): AbstractControl[] {
    if (this.activeMatchingBranchSid == null) return this.sourceMatchings;
    return this.voucherMatchings.controls.filter((c) => this.rowBelongsToActiveTab(c));
  }

  /** Per-branch matched party totals (Dr/Cr/Net of matchPartyAmt) — one entry per matching tab. */
  get matchingTotalsByBranch(): Array<{ branchSid: number; branchName: string; dr: number; cr: number; net: number }> {
    const rows = this.voucherMatchings.getRawValue();
    return this.matchingTabs.map((tab) => {
      const branchRows = rows.filter((r) =>
        tab.isSource ? r.allotmentBranchSid == null : r.allotmentBranchSid === tab.branchSid,
      );
      const dr = branchRows.filter((r) => r.drCr === 'Dr').reduce((t, r) => t + (Number(r.matchPartyAmt) || 0), 0);
      const cr = branchRows.filter((r) => r.drCr === 'Cr').reduce((t, r) => t + (Number(r.matchPartyAmt) || 0), 0);
      return { branchSid: tab.branchSid, branchName: tab.branchName, dr, cr, net: cr - dr };
    });
  }

  /** Overall matched party totals across ALL branches (sum of the per-branch rows). */
  get matchingOverallTotal(): { dr: number; cr: number; net: number } {
    const t = this.matchingTotalsByBranch.reduce((acc, b) => ({ dr: acc.dr + b.dr, cr: acc.cr + b.cr }), { dr: 0, cr: 0 });
    return { dr: t.dr, cr: t.cr, net: t.cr - t.dr };
  }

  /** Matched party total for the active branch tab (branch-wise) — shown alongside the branch pills. */
  get activeBranchMatchingTotal(): { branchName: string; dr: number; cr: number; net: number } {
    return (
      this.matchingTotalsByBranch.find((b) => b.branchSid === this.activeMatchingBranchSid) ?? {
        branchName: '',
        dr: 0,
        cr: 0,
        net: 0,
      }
    );
  }

  /** Remove only source-branch rows, preserving owning (inter-branch) rows (used on edit-load). */
  private clearSourceMatchingRows(): void {
    for (let i = this.voucherMatchings.length - 1; i >= 0; i--) {
      if (!this.voucherMatchings.at(i).get('allotmentBranchSid')?.value) {
        this.voucherMatchings.removeAt(i);
      }
    }
  }

  patchOutstandingFormArray(transactions: any[]) {
    // Clear only source rows — owning (inter-branch) rows are loaded separately and must survive.
    this.clearSourceMatchingRows();
    this.ensureSourceMatchingTab(); // edit-load: make the source tab exist + active
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
        branchName: [tx.BranchName || tx.branchName || ''],
        allotmentBranchSid: [tx.allotmentBranchSid ?? null], // source rows on edit-load

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
        // Display-only: party-row narration shown as a hover popover on the Voucher No. cell
        narration: [{ value: tx.Narration ?? '', disabled: true }],
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
    // Manual matched-amount edits on an owning-branch row refresh its inter-branch memo.
    if (this.voucherMatchings.at(index)?.get('allotmentBranchSid')?.value) {
      this.recomputeInterBranchMemo();
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
    const blockedReason = this.voucherActionGuard.getDetailMutationBlockedReason(this.getActionGuardContext());
    if (this.voucherActionGuard.block(blockedReason)) return;

    this.detailItems.removeAt(index);
    this.recalculateTotalAmount();
  }

  getTotalCurrAmt() {
    return this.activeTabMatchings
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Cr') {
          return total + Number(control.get('currAmt')?.value || 0);
        }
        return total - Number(control.get('currAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalLocalAmt() {
    return this.activeTabMatchings
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Cr') {
          return total + Number(control.get('localAmt')?.value || 0);
        }
        return total - Number(control.get('localAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalOSCurrAmt() {
    return this.activeTabMatchings
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Cr') {
          return total + Number(control.get('osCurrAmt')?.value || 0);
        }
        return total - Number(control.get('osCurrAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalOSLocalAmount() {
    return this.activeTabMatchings
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Cr') {
          return total + Number(control.get('osLocalAmt')?.value || 0);
        }
        return total - Number(control.get('osLocalAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalMatchCurrAmt() {
    const totalMatchCurrAmt = this.activeTabMatchings.reduce(
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
    return this.activeTabMatchings
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Cr') {
          return total + Number(control.get('matchLocalAmt')?.value || 0);
        }
        return total - Number(control.get('matchLocalAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalMatchPartyAmt() {
    return this.sourceMatchings
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Cr') {
          return total + Number(control.get('matchPartyAmt')?.value || 0);
        }
        return total - Number(control.get('matchPartyAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  /** Active-tab matched party total — DISPLAY only (the "Matching" box + footer Net); source logic uses getTotalMatchPartyAmt. */
  getTabTotalMatchPartyAmt() {
    return this.activeTabMatchings
      .reduce((total, control) => {
        if (control.get('drCr')?.value === 'Cr') {
          return total + Number(control.get('matchPartyAmt')?.value || 0);
        }
        return total - Number(control.get('matchPartyAmt')?.value || 0);
      }, 0)
      .toFixed(2);
  }

  getTotalTdsAmt() {
    return this.activeTabMatchings
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
   * Check if a detail row deletion is blocked (auto-inserted party/bank row, or PR-originated row).
   */
  isDeleteBlocked(index: number): boolean {
    return this.isAutoPartyRow(index)
        || this.isAutoBankRow(index)
        || !!this.detailItems.at(index)?.get('SourceDetailSid')?.value;
  }

  isSyTypeRow(index: number): boolean {
    const row = this.detailItems.at(index);
    if (!row || !this.coaList?.length) return false;
    const coaSid = row.get('COAMasterSid')?.getRawValue();
    const rowCoa = this.coaList.find((c) => c.COAMasterSid === coaSid);
    const ledgerType = String(rowCoa?.LedgerType || '').trim();
    return ledgerType === 'Sy Cr' || ledgerType === 'Sy Dr';
  }

  /** True when the COA on a row is this screen's creditor control account (Sy Cr). */
  private isSyCrCoa(coaSid: number | null): boolean {
    if (!coaSid || !this.coaList?.length) return false;
    const coa = this.coaList.find((c) => c.COAMasterSid === coaSid);
    return String(coa?.LedgerType || '').trim() === 'Sy Cr';
  }

  /**
   * True when a row is an EXTRA creditor (advance) row on a cash payment — a Sy Cr row that is
   * neither the main (header) party row nor the bank/cash row. These post as on-account advances:
   * no bill matching, no TDS, no tax.
   */
  private isExtraAdvanceRow(index: number): boolean {
    if (this.paymentForm.get('CashOrBank')?.getRawValue() !== 'C') return false;
    if (this.isAutoPartyRow(index) || this.isAutoBankRow(index)) return false;
    const coaSid = this.detailItems.at(index)?.get('COAMasterSid')?.getRawValue();
    return this.isSyCrCoa(coaSid);
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
    if (this.detailItems.at(index)?.get('SourceDetailSid')?.value) {
      return 'Row originates from a Payment Request and cannot be deleted';
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
    const blockedReason = this.voucherActionGuard.getDetailMutationBlockedReason(this.getActionGuardContext());
    if (this.voucherActionGuard.block(blockedReason)) return;

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
    const blockedReason = this.voucherActionGuard.getDetailMutationBlockedReason(this.getActionGuardContext());
    if (this.voucherActionGuard.block(blockedReason)) return;

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
    if (this.isPrefilling) return;
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
      const clearedBranchState = this.appSettingService.getCurrentBranchState();
      this.paymentForm.patchValue({
        PartyMasterSid: null,
        PartyName: '',
        PartyAddress: '',
        CustomerBranchSid: null,
        COAMasterSid: null,
        LedgerMasterSid: null,
        GST_VAT: '',
        PlaceOfSupply: clearedBranchState?.stateName || '',
      });
      this.taxCalculationService.updateParty({
        countryCode: this.currentCompanyCountryCode,
        stateName: clearedBranchState?.stateName || '',
        stateMasterSid: clearedBranchState?.StateMasterSid,
        gstNumber: '',
        customerGstType: 'Regular',
        isUnionTerritory: false,
      });
      this.recalcAllPaymentTaxRows();
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

  // ── Inter Branch (multi-branch) ──
  get interBranchSourceAmount(): number {
    return Math.max(this.totalCredits || 0, this.totalDebits || 0);
  }

  get interBranchPartyCurrency(): { CurrencyMasterSid: number; currencyCode: string } {
    return {
      CurrencyMasterSid: this.paymentForm.get('CurrencyMasterSid')?.value,
      currencyCode: this.paymentForm.get('CurrencyCode')?.getRawValue(),
    };
  }

  onMultiBranchToggle(on: boolean): void {
    this.paymentForm.get('MultiBranch')?.setValue(on);
    if (on) {
      if (!this.interBranchBranches.length) this.loadInterBranchBranches();
    } else {
      this.interBranches.clear();
      this.removeOwningBranchMatchingRows();
    }
  }

  private loadInterBranchBranches(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) return;
    this.masterService.getBranchesByCompanyId(companyId).subscribe(
      (branches: any[]) => { this.interBranchBranches = branches || []; },
      () => { this.interBranchBranches = []; },
    );
  }

  /** On edit, load the staged inter-branch allocations back into the tab + re-surface owning rows. */
  private loadInterBranchAllocations(headerId: number): void {
    if (!headerId) return;
    this.interBranchService.getAllocations(headerId).subscribe(
      (allocations: any[]) => {
        this.interBranches.clear();
        if (!allocations || !allocations.length) return;
        if (!this.interBranchBranches.length) this.loadInterBranchBranches();
        this.paymentForm.get('MultiBranch')?.setValue(true);
        this.ensureSourceMatchingTab(); // edit: source tab alongside the owning tabs
        allocations.forEach((a) => {
          this.interBranches.push(
            this.fb.group({
              BranchMasterSid: [a.AllotmentBranchSid],
              BranchName: [a.allotmentBranch?.branchName || ''],
              CurrencyMasterSid: [a.sourceVoucher?.CurrencyMasterSid ?? this.paymentForm.get('CurrencyMasterSid')?.value],
              CurrencyCode: [a.sourceVoucher?.CurrencyCode || this.paymentForm.get('CurrencyCode')?.getRawValue()],
              ExchangeRate: [Number(a.sourceVoucher?.ExchangeRate) || this.paymentForm.get('ExchangeRate')?.value || 1],
              Amount: [Number(a.CurrencyAmount) || 0],
              LocalAmount: [Number(a.LocalAmount) || 0],
              MatchedAmount: [{ value: 0, disabled: true }],
              AdvanceAmount: [{ value: Number(a.CurrencyAmount) || 0, disabled: true }],
              InterBranchJV: [a.mirrorJV?.VoucherNumber || ''],
              SourceJV: [a.sourceJV?.VoucherNumber || ''],
              SourceJVSid: [a.SourceJVHeaderSid || null],
            }),
          );

          if (a.posted) {
            // Posted: render the owning branch's matched invoices straight from VoucherMatching
            // (a.matches are full rows) — fully-matched invoices are excluded from the outstanding fetch.
            this.renderPostedOwningMatches(a.AllotmentBranchSid, a.allotmentBranch?.branchName || '', a.matches || []);
          } else {
            // Draft: seed the owning tab cursor + fetch the outstanding, then re-tick the staged matches.
            // Party ledger comes from the source voucher (timing-independent of the header fetch); large
            // take loads all rows in one page so every staged match resurfaces.
            const partyLedgerSid = a.sourceVoucher?.PartyMasterSid ?? this.paymentForm.get('PartyMasterSid')?.value;
            if (partyLedgerSid) {
              this.matchingCursors.set(a.AllotmentBranchSid, {
                branchSid: a.AllotmentBranchSid,
                branchName: a.allotmentBranch?.branchName || '',
                isSource: false,
                skip: 0,
                hasMore: true,
                includeFullyPaid: true,
                take: 100000,
                partyLedgerSid,
                stagedMatches: a.matches || [],
              });
              this.loadMatchingData(a.AllotmentBranchSid);
            }
          }
        });
      },
      () => {},
    );
  }

  /**
   * Posted edit: render an owning branch's matched invoices directly (from VoucherMatching, supplied by
   * getAllocations as full rows) and re-tick them. No outstanding fetch — the matched invoices are fully
   * paid and excluded from it. The owning cursor is seeded with hasMore=false (nothing left to paginate).
   */
  private renderPostedOwningMatches(branchSid: number, branchName: string, matches: any[]): void {
    this.matchingCursors.set(branchSid, {
      branchSid,
      branchName,
      isSource: false,
      skip: 0,
      hasMore: false,
      includeFullyPaid: true,
      take: this.MATCHING_BATCH_SIZE,
    });
    if (!matches.length) return;
    const rows = matches.map((m) => ({ ...m, allotmentBranchSid: branchSid, BranchName: m.BranchName || branchName }));
    this.appendMatchingRows(rows);
    this.applyStagedMatches(branchSid, matches);
    // Posted voucher → these owning rows are read-only (consistent with the disabled source rows).
    this.voucherMatchings.controls
      .filter((c) => c.get('allotmentBranchSid')?.value === branchSid)
      .forEach((c) => c.disable({ emitEvent: false }));
    this.recomputeInterBranchMemo();
  }

  onOwningBranchAdded(branchSid: number): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    const partyLedgerSid = this.paymentForm.get('PartyMasterSid')?.value;
    if (!companyId || !partyLedgerSid) {
      this.appSettingService.showWarning('Select the party before adding an inter-branch allocation.');
      return;
    }
    this.ensureSourceMatchingTab(); // guarantee the source tab sits alongside the new owning tab
    const branchName = (this.interBranchBranches || []).find((b) => b.BranchMasterSid === branchSid)?.branchName || '';
    this.matchingCursors.set(branchSid, {
      branchSid,
      branchName,
      isSource: false,
      skip: 0,
      hasMore: true,
      includeFullyPaid: false,
      take: this.MATCHING_BATCH_SIZE,
      partyLedgerSid,
    });
    this.activeMatchingBranchSid = branchSid; // focus the newly added branch's tab
    this.spinner.show();
    this.loadMatchingData(branchSid);
  }

  onOwningBranchRemoved(branchSid: number): void {
    this.removeOwningBranchMatchingRows(branchSid);
  }

  onInterBranchAllocationsChanged(): void {
    this.recomputeInterBranchMemo();
  }

  /** Strip owning-branch rows + drop their tab cursors (one branch, or all when no arg). */
  private removeOwningBranchMatchingRows(branchSid?: number): void {
    if (branchSid) {
      this.matchingCursors.delete(branchSid);
    } else {
      for (const sid of [...this.matchingCursors.keys()]) {
        if (!this.matchingCursors.get(sid)?.isSource) this.matchingCursors.delete(sid);
      }
    }
    // Strip the owning-branch rows from the shared matching grid (all, or just this branch's).
    for (let i = this.voucherMatchings.length - 1; i >= 0; i--) {
      const sid = this.voucherMatchings.at(i).get('allotmentBranchSid')?.value;
      if (branchSid ? sid === branchSid : sid != null) {
        this.voucherMatchings.removeAt(i);
      }
    }
    // If the active tab was removed, fall back to the source tab.
    if (this.activeMatchingBranchSid != null && !this.matchingCursors.has(this.activeMatchingBranchSid)) {
      this.activeMatchingBranchSid = [...this.matchingCursors.values()].find((c) => c.isSource)?.branchSid ?? null;
    }
    this.recomputeInterBranchMemo();
    setTimeout(() => this.reobserveMatchingSentinel(), 50);
  }

  private recomputeInterBranchMemo(): void {
    const rows = this.voucherMatchings.getRawValue();
    this.interBranches.controls.forEach((row) => {
      const sid = row.get('BranchMasterSid')?.value;
      const amount = Number(row.get('Amount')?.value) || 0;
      const matched = rows
        .filter((vm) => vm.allotmentBranchSid === sid)
        .reduce((s, vm) => s + (Number(vm.matchPartyAmt) || 0), 0);
      const matchedRounded = Math.round(matched * 100) / 100;
      row.get('MatchedAmount')?.setValue(matchedRounded, { emitEvent: false });
      row.get('AdvanceAmount')?.setValue(Math.max(Math.round((amount - matchedRounded) * 100) / 100, 0), { emitEvent: false });
    });
  }

  private buildInterBranchAllocations(): any[] {
    const rows = this.voucherMatchings.getRawValue();
    return this.interBranches.controls.map((row) => {
      const sid = row.get('BranchMasterSid')?.value;
      const matches = rows
        .filter((vm) => vm.allotmentBranchSid === sid && (toNumber(vm.matchCurrAmt) || toNumber(vm.matchLocalAmt)))
        .map((vm) => ({
          VoucherHeaderSid: vm.VoucherHeaderSid,
          VoucherDetailSid: vm.VoucherDetailSid,
          VoucherTransactionSid: vm.VoucherTransactionSid,
          VoucherType: vm.voucherType,
          BranchName: vm.branchName,
          CurrencyCode: vm.curr,
          ExchangeRate: toNumber(vm.exRate) || 1,
          DrCr: vm.drCr === 'Cr' ? 'C' : 'D',
          Amount: toNumber(vm.currAmt),
          LocalAmount: toNumber(vm.localAmt),
          MatchingAmount: toNumber(vm.matchCurrAmt),
          MatchingLocalAmount: toNumber(vm.matchLocalAmt),
          PartyAmount: toNumber(vm.matchPartyAmt),
          MatchingCurrency: vm.matchCurr ?? null,
        }));
      return {
        AllotmentBranchSid: sid,
        CurrencyAmount: Number(row.get('Amount')?.value) || 0,
        LocalAmount: Number(row.get('LocalAmount')?.value) || 0,
        matches,
      };
    });
  }

  /** After the payment is saved, persist its inter-branch allocations + matches. */
  stageInterBranchIfNeeded(headerId: number, done?: () => void): void {
    const on = this.paymentForm.get('MultiBranch')?.value;
    if (!(on === true || on === 'Y') || !headerId) { done?.(); return; }
    const allocations = this.buildInterBranchAllocations();
    if (!allocations.length) { done?.(); return; }
    this.interBranchService
      .stageAllocations({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        VoucherHeaderSid: headerId,
        CreatedBy: this.userData?.userEmail,
        CurrencyCode: this.paymentForm.get('CurrencyCode')?.getRawValue(),
        ExchangeRate: Number(this.paymentForm.get('ExchangeRate')?.value) || 1,
        allocations,
      })
      .subscribe({
        next: () => done?.(),
        error: () => {
          this.appSettingService.showError('Failed to stage inter-branch allocations');
          done?.();
        },
      });
  }
  
  private bankFieldsBackup: any = null;
  private cashFieldsBackup: any = null;

  /**
   * Cash payments have no instrument — clear the InstrumentMode/Number/Date
   * validators; Bank payments require all three. Shared by the manual Cash/Bank
   * toggle, the edit-load patch, and the payment-request prefill so the three
   * paths stay in sync.
   */
  private setInstrumentValidators(isCash: boolean): void {
    ['InstrumentMode', 'InstrumentNumber', 'InstrumentDate'].forEach((ctrl) => {
      const c = this.paymentForm.get(ctrl);
      if (isCash) {
        c?.clearValidators();
      } else {
        c?.setValidators([Validators.required]);
      }
      c?.updateValueAndValidity({ emitEvent: false });
    });
  }

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
      this.cashFieldsBackup = null;
    } else {
      // Switching to Bank — drop any EXTRA advance (Sy Cr) rows; multiple parties are cash-only.
      // (CashOrBank is already 'B' here, so check the COA type directly, not isExtraAdvanceRow.)
      for (let i = this.detailItems.length - 1; i >= 2; i--) {
        const coaSid = this.detailItems.at(i).get('COAMasterSid')?.getRawValue();
        if (this.isSyCrCoa(coaSid) && !this.isAutoPartyRow(i)) {
          this.detailItems.removeAt(i);
          this.filteredCoaList.splice(i, 1);
        }
      }
      // Restore bank backup if available, else set defaults
      this.paymentForm.patchValue({
        BankCOA: this.bankFieldsBackup?.BankCOA ?? null,
        InstrumentMode: this.bankFieldsBackup?.InstrumentMode ?? null,
        InstrumentNumber: this.bankFieldsBackup?.InstrumentNumber ?? '',
        InstrumentDate: this.bankFieldsBackup?.InstrumentDate ?? null,
        ClearanceDate: this.bankFieldsBackup?.ClearanceDate ?? null,
      });
      this.bankFieldsBackup = null;
    }

    this.setInstrumentValidators(isCash);

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
    const formattedLocalAmount = this.getFormattedAmount(
      finalAmount,
      row.get('CurrencyMasterSid')?.value
    );
    row.get('LocalAmount')?.setValue(formattedLocalAmount);
    row.get('TaxableAmount')?.setValue(formattedLocalAmount);

    if (recalcPartyAmount) {
      this.recalcPaymentTaxForRow(index);
    }

    // Cash multi-party: when any creditor (debit) row's amount changes and advances are present,
    // re-balance the single cash row. Covers both the main party and the advance rows.
    if (!this.isPatching && this.paymentForm.get('CashOrBank')?.getRawValue() === 'C') {
      const isDebitRow = this.detailItems.at(index)?.get('DrCr')?.getRawValue() === 'D';
      const hasAdvances = this.detailItems.controls.some((_, j) => this.isExtraAdvanceRow(j));
      if (isDebitRow && hasAdvances) {
        this.syncCashToParties();
      }
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
      CustomerBranchSid: null,
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
  public getAmountDecimalPlaces(currency: string | number): number {
    if (!currency) {
      return 4;
    }

    let currencyCode: string | undefined;
    if (typeof currency === 'number' || !isNaN(Number(currency))) {
      const currencyMasterSid = Number(currency);
      currencyCode = this.currencyList.find(
        (item) => item.CurrencyMasterSid === currencyMasterSid
      )?.currencyCode;
    } else {
      currencyCode = currency;
    }

    if (currencyCode) {
      const config = this.currencyConfigService.getCurrencyConfig(currencyCode);
      return config?.amountDecimal ?? 4;
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
    const branchState = this.appSettingService.getCurrentBranchState();
    this.taxCalculationService.init({
      documentSide: 'PURCHASE',
      companyCountryCode: this.currentCompanyCountryCode,
      companyCountryMasterSid: Number(company.CountryMasterSid),
      branchStateName: this.currentBranch?.stateMaster?.StateName || this.currentBranch?.StateName || '',
      branchStateMasterSid: this.currentBranch?.StateMasterSid,
    }).then(async () => {
      await this.taxCalculationService.fetchTaxMasters('PURCHASE');
      // Default party context to company's own state so expense payments (no party)
      // get CGST+SGST (India) / VAT (UAE) without requiring a party selection.
      if (branchState?.stateName) {
        this.taxCalculationService.updateParty({
          countryCode: this.currentCompanyCountryCode,
          stateName: branchState.stateName,
          stateMasterSid: branchState.StateMasterSid,
          gstNumber: '',
          customerGstType: 'Regular',
          isUnionTerritory: false,
        });
      }
    });
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

    // PlaceOfSupply should always be set (from party, branch state, or DB). This guard
    // covers edge cases where neither party nor branch state is available.
    if (!this.paymentForm.get('PlaceOfSupply')?.value) {
      const currSid = row.get('CurrencyMasterSid')?.getRawValue();
      const localAmount = toNumber(row.get('LocalAmount')?.value);
      row.patchValue({
        TaxableAmount: this.getFormattedAmount(localAmount, currSid),
        TaxPercentage1: 0,
        TaxAmount1: this.getFormattedAmount(0, currSid),
        TaxPercentage2: 0,
        TaxAmount2: this.getFormattedAmount(0, currSid),
      }, { emitEvent: false });
      this.taxLabelCache[index] = '';
      this.recalcPartyAmtForDetail(index);
      this.updateInvoiceTypeRequired();
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
    const hasPlaceOfSupply = !!(this.paymentForm?.get('PlaceOfSupply')?.value);
    this.detailItems.controls.forEach((_, i) => {
      if (!hasPlaceOfSupply) { this.taxLabelCache[i] = ''; return; }
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
    // Advance creditor rows use this classic dropdown — block a party already on the payment
    // (the header party or another row). Compare on SubledgerMasterSid (= the party ledger).
    if (this.isPartyCoaRow(index)) {
      const picked = subledger?.SubledgerMasterSid
        ?? this.detailItems.at(index).get('LedgerMasterSid')?.getRawValue();
      const headerParty = this.r['PartyMasterSid']?.getRawValue();
      const dup = (this.detailItems.getRawValue() || []).some(
        (d, i) => i !== index && Number(d.LedgerMasterSid) === Number(picked),
      );
      if (picked && (Number(picked) === Number(headerParty) || dup)) {
        this.appSettingService.showWarning(
          `${subledger?.SubledgerName ?? 'This party'} is already on this payment.`,
        );
        this.detailItems.at(index).get('LedgerMasterSid')?.setValue(null, { emitEvent: false });
        return;
      }
    }
    this.fillPayTo()
    this.checkAndUpdateForPartyDetail(index);
    this.loadHSSACForSubledger(index, subledger, false);
  }

  fillPayTo() {
    const target = this.paymentForm.get('BankPartyName');
    if (!target) return;

    const currentValue = target.getRawValue();

    // ✅ If already has value → do nothing
    if (currentValue) return;

    const rows = this.detailItems.getRawValue();

    const syCrIndex = rows.findIndex((row) => {
      const coaMaster = this.coaList.find(
        (c) => c.COAMasterSid === row.COAMasterSid
      );
      return coaMaster?.LedgerType === 'Sy Cr';
    });

    if (syCrIndex === -1) return;

    const syCrRow = rows[syCrIndex];

    const ledger = this.ledgerList[syCrIndex]?.find(
      (l) => l.SubledgerMasterSid === syCrRow?.LedgerMasterSid
    );

    if (ledger) {
      target.setValue(ledger.SubledgerName, { emitEvent: false });
    }
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
          if (hssacItems.length > 0 && (!isPatching || (this.isFromPaymentRequest && !this.isPatching))) {
            (this.detailItems.at(index) as FormGroup).patchValue(
              { HSSACMasterSid: hssacItems[0].HSSACMasterSid },
              { emitEvent: false }
            );
            this.recalcPaymentTaxForRow(index);
          } else if (this.isPosted || isPatching) {
            // For posted/edit records refresh the label cache now that HSSAC data has arrived
            this.refreshTaxLabelCache();
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

  /**
   * Load HSSAC list for a row by ChargeMasterSid directly.
   * Used when PR rows have vendor/party subledgers (not type 'Charge'),
   * so loadHSSACForSubledger() cannot resolve the charge's HSSAC.
   */
  loadHSSACForCharge(index: number, chargeMasterSid: number): void {
    this.operationService.getChargeTaxForChargeId(chargeMasterSid).subscribe({
      next: (res: any) => {
        if (res.status) {
          const hssacItems = (res.data || []).filter((h: any) => h.HSSACMasterSid);
          this.hssacListForRow[index] = hssacItems;
          if (hssacItems.length > 0 && this.isHSSACEnabledForRow(index)) {
            const row = this.detailItems.at(index) as FormGroup;
            const currentHssac = row.get('HSSACMasterSid')?.value;
            if (!currentHssac) {
              row.patchValue(
                { HSSACMasterSid: hssacItems[0].HSSACMasterSid },
                { emitEvent: false }
              );
              this.recalcPaymentTaxForRow(index);
            } else if (this.isFromPaymentRequest && !this.isPosted) {
              this.recalcPaymentTaxForRow(index);
            } else if (this.isPosted || currentHssac) {
              // currentHssac already set means edit/view mode — refresh labels
              this.refreshTaxLabelCache();
            }
          } else if (this.isPosted) {
            this.refreshTaxLabelCache();
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
    // TDS (Cr-side) — India only
    if (this.tdsHelper?.isTDSEnabled && this.currentCompanyCountryCode === 'in') {
      const tdsAmt = toNumber(this.tdsForm?.get('TDSAmount')?.value || 0);
      if (tdsAmt > 0) {
        totalDebits += tdsAmt / (headerExRate || 1);
      }
    }
    this.totalCredits = toNumber(this.getFormattedAndPaddedAmount(totalCredits,this.paymentForm.get('CurrencyMasterSid')?.getRawValue()));
    this.totalDebits = toNumber(this.getFormattedAndPaddedAmount(totalDebits,this.paymentForm.get('CurrencyMasterSid')?.getRawValue()));
  }

  /**
   * Fetch supplier TDS mapping + FY cumulative when CustomerBranchSid changes.
   * India-only. Auto-populates form and re-validates totals.
   *
   * Intentionally skipped for PR-converted payments: those settle operational
   * charges / expenses and are not subject to TDS deduction at source.
   * TDS is applicable only when a vendor party ledger is the primary debit.
   */
  private refreshSupplierTDS(customerBranchSid: number | null): void {
    if (this.currentCompanyCountryCode !== 'in') return;
    if (this.isFromPaymentRequest) {
      this.tdsHelper.reset();
      this.tdsForm?.reset({ TaxableAmount: 0, TDSAmount: 0, TDSPartyAmount: 0, TDSRate: 0 });
      this.paymentForm?.get('TDSEnabled')?.setValue(false, { emitEvent: false });
      return;
    }
    if (!customerBranchSid) {
      this.tdsHelper.reset();
      this.tdsForm?.reset({ TaxableAmount: 0, TDSAmount: 0, TDSPartyAmount: 0, TDSRate: 0 });
      this.paymentForm?.get('TDSEnabled')?.setValue(false, { emitEvent: false });
      this.validateAmount();
      return;
    }
    const party = this.partyList.find(p => p.CustomerBranchSid === customerBranchSid);
    const ledgerMasterSid = party?.SubledgerMasterSid;
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!ledgerMasterSid || !companyMasterSid) return;

    const fy = this.appSettingService.getCurrentFinancialYear();
    if (!fy) return;
    const fyStart = new Date(fy.StartDate);
    const fyEnd = new Date(fy.EndDate);
    const voucherDateRaw = this.paymentForm.get('VoucherDate')?.value;
    const voucherDate = voucherDateRaw ? new Date(voucherDateRaw) : new Date();

    this.tdsHelper.fetchAndPopulate({
      CustomerBranchSid: customerBranchSid,
      LedgerMasterSid: ledgerMasterSid,
      CompanyMasterSid: companyMasterSid,
      fyStartDate: fyStart,
      fyEndDate: fyEnd,
      excludeVoucherHeaderSid: this.headerId,
      voucherDate,
      tdsForm: this.tdsForm,
      vendorCountryName: party?.countryMaster?.countryName ?? '',
      vendorHasPAN: !!party?.PanType,
    }).subscribe(() => {
      if (this.tdsHelper.isTDSEnabled) {
        this.runTDSRecalc();
      }
      this.validateAmount();
    });
  }

  /** Fetches supplier TDS context (mapping limits + FY cumulative) in edit mode without
   *  overwriting the already-patched saved form values.  Called once after patchFromSavedTDS
   *  so that subsequent recalcTDSAmounts calls use the correct thresholds. */
  private refreshSupplierTDSContext(customerBranchSid: number | null): void {
    if (this.currentCompanyCountryCode !== 'in') return;
    if (!customerBranchSid) return;
    const party = this.partyList.find(p => p.CustomerBranchSid === customerBranchSid);
    const ledgerMasterSid = party?.SubledgerMasterSid;
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!ledgerMasterSid || !companyMasterSid) return;
    const fy = this.appSettingService.getCurrentFinancialYear();
    if (!fy) return;
    const fyStart = new Date(fy.StartDate);
    const fyEnd = new Date(fy.EndDate);
    const voucherDateRaw = this.paymentForm.get('VoucherDate')?.value;
    const voucherDate = voucherDateRaw ? new Date(voucherDateRaw) : new Date();

    this.tdsHelper.fetchAndPopulate({
      CustomerBranchSid: customerBranchSid,
      LedgerMasterSid: ledgerMasterSid,
      CompanyMasterSid: companyMasterSid,
      fyStartDate: fyStart,
      fyEndDate: fyEnd,
      excludeVoucherHeaderSid: this.headerId,
      voucherDate,
      tdsForm: this.tdsForm,
      vendorCountryName: party?.countryMaster?.countryName ?? '',
      vendorHasPAN: !!party?.PanType,
      contextOnly: true,
    }).subscribe(() => {
      if (this.tdsHelper.isTDSEnabled) {
        this.runTDSRecalc();
      }
      this.validateAmount();
    });
  }

  /**
   * Decides whether to include a VoucherTDS record in the save payload.
   *
   * Rules:
   *  1. PR-converted payments — never include TDS.  These payments settle
   *     operational charges / expenses; TDS deduction does not apply.
   *  2. Direct payments — include TDS only when a vendor sub-ledger row
   *     (party row) is present in detailItems.  A payment with no party
   *     row has no deductee, so TDS would be meaningless.
   *  3. In all other cases delegate to tdsHelper.buildPayload which checks
   *     isTDSEnabled and returns null if TDS is not configured.
   */
  private buildTdsDetailForPayload(detailItems: any[], formValue: any): any | null {
    if (this.isFromPaymentRequest) return null;
    const partyLedger = formValue.PartyMasterSid;
    const hasPartyRow = partyLedger
      && detailItems.some((d: any) => Number(d.LedgerMasterSid) === Number(partyLedger));
    if (!hasPartyRow) return null;
    return this.tdsHelper.buildPayload(this.tdsForm);
  }

  onTDSToggle(): void {
    const hasParty = !!(this.paymentForm.get('PartyMasterSid')?.value);
    if (this.tdsHelper.isTDSEnabled && !hasParty) {
      this.appSettingService.showWarning(
        'TDS deduction requires a vendor party. ' +
        'Select a party first, then enable TDS deduction.'
      );
      // Defer the reset so Angular's current change-detection cycle (which committed
      // isTDSEnabled = true via [(ngModel)]) completes before we flip it back.
      setTimeout(() => {
        this.tdsHelper.isTDSEnabled = false;
        this.paymentForm.get('TDSEnabled')?.setValue(false, { emitEvent: true });
      }, 0);
      return;
    }
    if (!this.tdsHelper.isTDSEnabled) {
      this.tdsForm.reset({ TaxableAmount: 0, TDSAmount: 0, TDSPartyAmount: 0, TDSRate: 0 });
      this.tdsHelper.limitNote = null;
      this.tdsHelper.autoReason = null;
    } else {
      this.runTDSRecalc();
    }
    // Mirror the toggle state into paymentForm so valueChanges fires and
    // deepEqual dirty detection picks up the TDS enable/disable change.
    this.paymentForm.get('TDSEnabled')?.setValue(this.tdsHelper.isTDSEnabled, { emitEvent: true });
    this.validateAmount();
  }

  onTDSSetChange(set: any): void {
    if (!set) {
      this.tdsHelper.tdsRateList = [];
      this.tdsForm.patchValue({ TDSSetRateSid: null, TDSRate: 0, ITSectionCode: '', CompanyType: '' }, { emitEvent: false });
      this.validateAmount();
      return;
    }
    this.tdsHelper.loadRatesForSet(set.TDSSetHeaderSid).subscribe();
    this.tdsForm.patchValue({ TDSSetRateSid: null, TDSRate: 0, ITSectionCode: '', CompanyType: '' }, { emitEvent: false });
  }

  onTDSRateChange(rate: any): void {
    if (!rate) return;
    this.tdsForm.patchValue({
      TDSRate: Number(rate.TDSRate ?? 0),
      ITSectionCode: rate.ITSectionCode ?? '',
      CompanyType: rate.CompanyType ?? '',
    }, { emitEvent: false });
    this.runTDSRecalc();
    this.validateAmount();
  }

  private tdsRateOnFocus: number | null = null;

  onTDSRateFocus(): void {
    this.tdsRateOnFocus = Number(this.tdsForm.get('TDSRate')?.value ?? 0);
  }

  onTDSRateBlur(): void {
    const current = Number(this.tdsForm.get('TDSRate')?.value ?? 0);
    // Only recalculate when the user actually changed the rate. Without this guard,
    // edit mode re-runs recalc with the *current* FY cumulative (which may differ
    // from creation time), incorrectly inflating the TDS amount.
    if (this.tdsRateOnFocus !== null && current !== this.tdsRateOnFocus) {
      this.runTDSRecalc();
    }
    this.tdsRateOnFocus = null;
    this.validateAmount();
  }

  /** Single entry-point for TDS recalculation — passes party SID + currency formatter */
  private runTDSRecalc(): void {
    if (this.isPosted) return;
    const currencySid = this.paymentForm.get('CurrencyMasterSid')?.getRawValue();
    this.tdsHelper.recalcTDSAmounts(
      this.detailItems.getRawValue(),
      this.tdsForm,
      toNumber(this.paymentForm.get('ExchangeRate')?.getRawValue() || 1),
      this.paymentForm.get('PartyMasterSid')?.getRawValue(),
      (n: number) => this.getFormattedAndPaddedAmount(n, currencySid),
    );
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

  openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.currentMenuId);  
    modalRef.componentInstance.DocumentSid = this.paymentData?.VoucherHeaderSid;
  }

  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    const payload = { 
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.paymentData?.VoucherHeaderSid
     };
     const transactionPayload = {
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    MenuMasterSid: this.currentMenuId,
    DocumentSid: this.paymentData?.VoucherHeaderSid
  };
     const getTermText = (item: any): string =>
    (item?.Terms || item?.TandC || '').trim().toLowerCase();

  const isSameTerm = (a: any, b: any): boolean =>
    (
      a?.TandCTransactionSid &&
      b?.TandCTransactionSid &&
      a.TandCTransactionSid === b.TandCTransactionSid
    ) ||
    (
      getTermText(a) === getTermText(b) &&
      (a?.DocumentSid ?? this.paymentData?.VoucherHeaderSid ?? null) ===
      (b?.DocumentSid ?? this.paymentData?.VoucherHeaderSid ?? null)
    );
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
     if (this.isTermsAndConditionsEnabled) {
    forkJoin({
      tandc: this.masterService.getTandC(transactionPayload),
      defaults: this.masterService.getTandCByCondition(payload)
    }).subscribe(
      (resp: any) => {
        const tandcData = resp?.tandc?.status ? (resp.tandc.data || []) : [];
        const defaultData = resp?.defaults?.status ? (resp.defaults.data || []) : [];

        const combined = [...tandcData, ...defaultData].filter(
          (item: any, index: number, arr: any[]) =>
            index === arr.findIndex((x: any) => isSameTerm(x, item))
        );

        this.TandCList = combined;
        openModal(this.TandCList);
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
    return;
  }
    this.masterService.getTandC(transactionPayload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          openModal(this.TandCList);
        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
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
    modalRef.componentInstance.currentMenuId = this.currentMenuId;
  }

  reportPayment() {
    const modalRef = this.modalService.open(PaymentPrintComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.paymentDataPrint = this.paymentDataPrint || [];
    modalRef.componentInstance.coaList = this.coaList || [];
    modalRef.componentInstance.ledgerList = this.ledgerList || [];
    modalRef.componentInstance.currentMenuId = this.currentMenuId;
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
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
    const isOwningRow = !!row.get('allotmentBranchSid')?.value;

    if (!checked) {
      row.patchValue({
        // matchCurr: null,
        // matchExRate: null,
        matchCurrAmt: null,
        matchLocalAmt: null,
        matchPartyAmt: null,
      });
      row.get('isTicked')?.setValue(false);
      isOwningRow ? this.recomputeInterBranchMemo() : this.updateDetailAmountsFromMatching();
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
    isOwningRow ? this.recomputeInterBranchMemo() : this.updateDetailAmountsFromMatching();

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
    // Cash multi-party: when advance rows exist, the cash row = matched main amount + the advances.
    // With no advances we keep the original matched-only behaviour byte-for-byte.
    const hasExtraAdvance =
      this.paymentForm.get('CashOrBank')?.getRawValue() === 'C' &&
      this.detailItems.controls.some((_, i) => this.isExtraAdvanceRow(i));
    if (hasExtraAdvance) {
      this.syncCashToParties();
      return;
    }
    const headerCurrency = this.r['CurrencyMasterSid']?.getRawValue();
    const bankRow = this.detailItems.at(1) as FormGroup;
    if (bankRow) {
      const bankCurrency = bankRow.get('CurrencyMasterSid')?.value;
      bankRow.patchValue({ Amount: headerCurrency === bankCurrency ?  totalMatchCurrAmt : 0 });
      this.calculateLocalAmount(1, true);
    }
  }

  /**
   * Cash multi-party: keep the single cash row equal to the sum of every creditor (debit) row —
   * the matched main-party amount plus each advance row — so debits == credits stay balanced.
   * Tightly scoped to a header-party cash payment; a no-op for PR payments, bank/cheque payments,
   * during edit-load patching, or when the cash currency differs from the header currency.
   */
  private syncCashToParties(): void {
    if (this.isFromPaymentRequest) return;
    if (this.paymentForm.get('CashOrBank')?.getRawValue() !== 'C') return;
    if (this.isPatching) return;
    if (!this.r['PartyMasterSid']?.getRawValue()) return;
    const bankRow = this.detailItems.at(1) as FormGroup;
    if (!bankRow || bankRow.get('DrCr')?.getRawValue() !== 'C') return;
    const headerCurrency = this.r['CurrencyMasterSid']?.getRawValue();
    const bankCurrency = bankRow.get('CurrencyMasterSid')?.value;
    if (headerCurrency !== bankCurrency) return; // mixed-currency cash isn't auto-summed
    let debitTotal = 0;
    this.detailItems.controls.forEach((_, i) => {
      if (this.detailItems.at(i).get('DrCr')?.getRawValue() === 'D') {
        debitTotal += toNumber(this.detailItems.at(i).get('Amount')?.value);
      }
    });
    // Net the cash by any TDS withheld from the MAIN party (India) — mirrors validateAmount, which
    // adds TDS to the credit side. Cash paid = creditor debits − TDS, so debits == credits balances.
    let tdsInHeaderCurr = 0;
    if (this.tdsHelper?.isTDSEnabled && this.currentCompanyCountryCode === 'in') {
      const tdsAmt = toNumber(this.tdsForm?.get('TDSAmount')?.value || 0);
      const exRate = toNumber(this.r['ExchangeRate']?.getRawValue()) || 1;
      if (tdsAmt > 0) tdsInHeaderCurr = tdsAmt / exRate;
    }
    const cash = debitTotal - tdsInHeaderCurr;
    bankRow.patchValue(
      { Amount: this.getFormattedAndPaddedAmount(cash, bankCurrency) },
      { emitEvent: false },
    );
    this.calculateLocalAmount(1, true);
    this.validateAmount();
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
        DocumentTypeCode: VoucherType.PAYMENT,
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

  navigateToCreate() {
        navigateToVoucherEntry(this.router, VoucherType.PAYMENT);
  }

  copyPayment(): void {
    if (!this.paymentData) {
      this.appSettingService.showWarning('No payment data to copy');
      return;
    }

    this.confirmService.confirm(
      'Are you sure you want to copy this payment?',
      'Copy Payment',
      'Copy'
    ).then((confirmed) => {
      if (confirmed) {
        this.performPaymentCopy();
      }
    });
  }

  private performPaymentCopy(): void {
    this.spinner.show();
    const copiedData = this.prepareCopiedPaymentData();

    navigateToVoucherEntry(this.router, VoucherType.PAYMENT, undefined, {
      extras: {
        state: {
          copiedPaymentData: copiedData,
          isCopiedPayment: true,
        },
      },
    });
  }

  private prepareCopiedPaymentData(): any {
  const copiedData = { ...this.paymentData };

  // Clear header fields that should not be copied
  copiedData.VoucherHeaderSid = null;
  copiedData.VoucherNumber = '';
  copiedData.VoucherDate = getDefaultTodayDate();
  copiedData.PostStatus = 'U';
  copiedData.Status = 'A';
  copiedData.PostDate = null;
  copiedData.PostedOn = null;

if (copiedData.ReversalVoucher || copiedData.PaymentRequestSid) {
  copiedData.Narration = '';
}

  // Clear payment request linkage
  copiedData.ReversalVoucher = null;
  copiedData.PaymentRequestSid = null;

  // Clear job references from header
  copiedData.MasterJobSid = null;
  copiedData.HouseJobSid = null;
  copiedData.DepartmentMasterSid = null;
  copiedData.BookingHeaderSid = null;

  // Clear voucher matchings
  copiedData.voucherMatchings = [];
  copiedData.VoucherMatchingHeader = [];

  // Read narration BEFORE clearing it — cash mode uses it as the detail narration
  const cashOrBank = copiedData.CashOrBank === 'C' ? 'Cash' : 'Bank';
  const instrumentMode = copiedData.InstrumentMode || '';
  const instrumentNumber = copiedData.InstrumentNumber || '';
  const instrumentDate = copiedData.InstrumentDate
    ? this.datePipe.transform(new Date(copiedData.InstrumentDate))
    : '';
  const bankPartyName = copiedData.BankPartyName || '';

  const partyNarration = cashOrBank === 'Bank'
    ? `Being Bank Transfer  ${instrumentMode ? instrumentMode + '-' : ''}${instrumentNumber ? instrumentNumber + '-' : ''}${instrumentDate ? instrumentDate + ' ' : ''}`
    : '';

  const bankNarration = cashOrBank === 'Bank'
    ? `Being ${instrumentMode ? instrumentMode + '-' : ''}${instrumentNumber ? instrumentNumber + '-' : ''}${instrumentDate ? instrumentDate + ' ' : ''}to ${bankPartyName}`
    : '';

  if (Array.isArray(copiedData.VoucherDetail)) {
    copiedData.VoucherDetail = copiedData.VoucherDetail.map((detail: any) => {
      const isBankRow = detail.COAMasterSid === copiedData.BankCOA;
      const isPartyRow = detail.LedgerMasterSid === copiedData.PartyMasterSid;

      return {
        ...detail,
        VoucherDetailSid: null,
        VoucherHeaderSid: null,
        MasterJobSid: null,
        HouseJobSid: null,
        masterJob: null,
        houseJob: null,
        SourceDetailSid: null,
        CostRevenueChargesSid: null,
        BookingRatesSid: null,
        Narration: isBankRow ? bankNarration : isPartyRow ? partyNarration : partyNarration,
      };
    });
  }

  return copiedData;
}

  private applyCopiedPaymentMode(): void {
    this.headerId = null;
    this.isViewMode = false;
    this.isPosted = false;
    this.isReadOnly = false;
    this.paymentForm.get('CashOrBank')?.enable({ emitEvent: false });
    this.paymentForm.get('VoucherNumber')?.setValue('', { emitEvent: false });

    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy) {
      this.fyMinDate = toNgbDateStruct(fy.StartDate);
      const fyEnd = new Date(fy.EndDate);
      const today = getDefaultTodayDate();
      this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
    }
  }
}
