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
  NgbDropdownModule,
  NgbModal,
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
import { errorLogger, getDefaultTodayDate, toNgbDateStruct, toNumber } from 'src/app/common/helper';
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
import { errorLoggerWithToastr } from 'src/app/common/error-handling/form-error-handler';

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
  ],
  templateUrl: './payment-entry.component.html',
  styleUrl: './payment-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
  ],
})
export class PaymentEntryComponent implements OnInit, HasUnsavedChanges {
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
  paymentDataPrint: any;
  isLimitErrorShown: boolean = false;

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
    { label: 'Vendor Invoice', value: 'Invoice' },
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

  // Voucher period constraints
  voucherConstraints: VoucherDateConstraints = {
    isClosed: false, errorMessage: null
  };

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
    private paymentService: PaymentService,
    private appSettingService: AppSettingsService,
    private dropdownStore: DropdownStore,
    private accountService: AccountsService,
    private currencyFormatService: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService,
    private spinner: NgxSpinnerService,
    private companySettings: CompanySettingsManagerService,
    private voucherPeriodService: VoucherPeriodValidationService
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
    this.getCurrentCompanyBranches();

    this.currentBranch = this.appSettingService.getCurrentBranchInfo();
    this.mps.init().subscribe();
    this.checkVoucherPostingMechanism();
    this.initSearchOutstandingForm();
    this.initializeForm();
    this.loadPaymentModes();
    this.loadAllLookups();
    this.loadDetailLookups();
    this.loadVoucherPeriods();

    // Check if editing existing payment
    const paymentId = this.route.snapshot.params['id'];
    if (paymentId) {
      this.headerId = Number(paymentId);
      this.loadPayment(this.headerId);
    } else {
      this.subscribeToPartyChanges();
      this.subscribeToBankChanges();
      this.setupFormChangeDetection();
    }
  }

  private setupFormChangeDetection(): void {
    this.paymentForm.valueChanges
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
          this.paymentForm.dirty &&
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

  loadVoucherPeriods(): void {
    this.voucherPeriodService.loadPeriods(
      this.currentCompany?.CompanyMasterSid,
      this.currentBranch?.BranchMasterSid,
      this.currentYearId,
      () => this.applyVoucherDateConstraints()
    );
  }

  applyVoucherDateConstraints(): void {
    const voucherDate = this.paymentForm?.get('VoucherDate')?.value;
    this.voucherConstraints = this.voucherPeriodService.applyConstraints(voucherDate, 'GL');
  }

  onVoucherDateChange(): void {
    this.applyVoucherDateConstraints();
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

    this.paymentForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }], // Payment Number
      VoucherDate: [today], // Payment Date
      MultiBranch: [{ value: false, disabled: true }],
      CashOrBank: [false],
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
      this.paymentForm.get(ctrl)?.valueChanges.subscribe(() => {
        this.updateDetailNarration();
      });
    });
    ['detailItems', 'voucherMatchings'].forEach((ctrl) => {
      this.paymentForm.get(ctrl)?.valueChanges.subscribe(() => {
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
    if (this.formSaved) {
      return false;
    }

    // Check if main form is dirty
    if (this.paymentForm?.dirty) {
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
    const exCtrl = this.paymentForm.get('ExchangeRate');

    if (!currencySid) return;

    // SAME CURRENCY
    if (currencySid === this.currentCompany?.CurrencyMasterSid) {
      exCtrl?.setValue(this.getFormattedExchangeRate(1, currencySid));
      exCtrl?.disable({ emitEvent: false });
      this.recalculateAllMatchingPartyAmounts();
      this.recalcPartyAmtForAllDetails();
      this.checkAndUpdateForAllPartyDetail();
      return;
    }

    // DIFFERENT CURRENCY
    exCtrl?.enable({ emitEvent: false });

    this.patchCurrencyExchangeRate(); // existing API call
  }


  loadAllLookups() {
    const filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };
    forkJoin({
      parties: this.accountService
        .getAllCreditorWithCOAMapped(filterOption)
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
    this.paymentModes = this.paymentService.getInstrumentModes();
  }

  /**
   * Search outstanding invoices for customer
   */

  searchOutstanding() {
    const form = this.searchOutstandingForm.getRawValue();
    let payload: any = {
      CompanyMasterSid: form.CompanyMasterSid,
      IncludeFullyPaid: form.IncludeFullyPaid,
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


    this.accountService.getPaymentOutstanding(payload).subscribe((res) => {
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

  onSubmit(resolve?: (value: boolean) => void, isPostingTrue?: boolean) {
    // Re-validate voucher date constraints at save time (edit mode may have stale state)
    this.applyVoucherDateConstraints();
    // Block save if voucher period grace days exceeded or module closed
    if (this.voucherConstraints.isClosed) {
      this.appSettingService.showWarning(this.voucherConstraints.errorMessage);
      if (resolve) resolve(false);
      return;
    }

    this.isSaving = true;
    const formValue = this.paymentForm.getRawValue();
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

    if (this.paymentForm.invalid) {
      errorLoggerWithToastr(this.paymentForm,this.toastr);
      this.appSettingService.showWarning('Please fill all required fields');
      this.paymentForm.markAllAsTouched();
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
      this.accountService.updatePaymentById(this.headerId, payload).subscribe({
        next: (resp: any) => {
          this.isSaving = false;
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);

            this.formSaved = true;
            this.isDirty = false;

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
            if (isPostingTrue) {
              await this.postVoucher();
            } else {
              this.spinner.hide();
            }
            this.resetDirtyState();
            this.formSaved = true;
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

  private resetDirtyState(): void {
    this.isDirty = false;
    this.formSaved = false;
    this.paymentForm?.markAsPristine();
    this.initialDetailCount = this.detailItems?.length || 0;
    this.initialMatchingCount = this.voucherMatchings?.length || 0;
  }

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
        this.paymentService.postPayment(postPayload)
      );

      this.spinner.hide();
      if (result.status) {
        this.appSettingService.showSuccess(result.message);
        this.paymentData.PostStatus = 'P';
        if (notFromSubmit) {
          this.loadPayment(this.headerId);
        }
      } else {
        this.spinner.hide();
        this.appSettingService.showError(result.message);
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

  patchValues(response: any) {
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

    if (headerInfo.CashOrBank === 'C') {
      this.paymentForm.get('InstrumentMode')?.clearValidators();
      this.paymentForm.get('InstrumentMode')?.updateValueAndValidity();
      this.paymentForm.get('InstrumentNumber')?.clearValidators();
      this.paymentForm.get('InstrumentNumber')?.updateValueAndValidity();
      this.paymentForm.get('InstrumentDate')?.clearValidators();
      this.paymentForm.get('InstrumentDate')?.updateValueAndValidity();
    }

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
    this.isPosted = response.PostStatus === 'P';

    // const voucherMatchingHeader = response.voucherMatchingHeader || [];
    const voucherMatchingRecords = response.voucherMatchings || [];
    this.patchOutstandingFormArray(voucherMatchingRecords);

    if (this.isPosted) {
      this.paymentForm.disable();
    }

    setTimeout(() => {
      this.isDirty = false;
      this.formSaved = true;
      this.isLoading = false;

      this.paymentForm.markAsPristine();
      this.paymentForm.markAsUntouched();
      this.detailItems.markAsPristine();
      this.voucherMatchings.markAsPristine();

      this.initialDetailCount = this.detailItems?.length || 0;
      this.initialMatchingCount = this.voucherMatchings?.length || 0;

    }, 100);
    this.setupFormChangeDetection();
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
    const headerCtrl = this.paymentForm.get('PartyMasterSid') as FormControl;
    const detailPartyCtrl = detail.get('LedgerMasterSid') as FormControl;

    if (headerCtrl && detailPartyCtrl) {
      if (headerCtrl.getRawValue() === detailPartyCtrl.getRawValue()) {
        if (patch) {
          detail
            .get('CurrencyMasterSid')
            ?.setValue(this.r['CurrencyMasterSid']?.getRawValue());
          detail
            .get('CurrencyCode')
            ?.setValue(this.r['CurrencyCode']?.getRawValue());
          detail
            .get('ExchangeRate')
            ?.setValue(this.r['ExchangeRate']?.getRawValue());
          this.calculateLocalAmount(detailIndex);
        }
        detail.get('CurrencyMasterSid')?.disable();
        detail.get('CurrencyCode')?.disable();
        detail.get('ExchangeRate')?.disable();
      } else {
        detail.get('CurrencyMasterSid')?.enable();
        detail.get('CurrencyCode')?.enable();
        detail.get('ExchangeRate')?.enable();
      }
    } else {
      detail.get('CurrencyMasterSid')?.enable();
      detail.get('CurrencyCode')?.enable();
      detail.get('ExchangeRate')?.enable();
    }
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

  private subscribeToPartyChanges(): void {
    this.paymentForm.get('CustomerBranchSid')!
      .valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((partySid: number) => {
        console.log('Party changed:', partySid);

        if (!this.isLoading && partySid) {
          this.populateOrPatchDetailRows();
        }
      });
  }

  private subscribeToBankChanges(): void {
    this.paymentForm.get('BankCOA')!
      .valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((bankCoaSid: number) => {
        console.log('Bank changed:', bankCoaSid);

        if (!this.isLoading && bankCoaSid) {
          this.populateOrPatchDetailRows();
        }
      });
  }




  private populateOrPatchDetailRows( ): void {
    const partySid = this.paymentForm.get('CustomerBranchSid')?.value;
    const bankCoaSid = this.paymentForm.get('BankCOA')?.value;

    this.detailItems.clear();
    const headerCurrencyId = this.r['CurrencyMasterSid']?.value;
    const headerCurrencyCode = this.r['CurrencyCode']?.value;
    const exchangeRate = this.r['ExchangeRate']?.value;
    const amount = this.getTotalOSCurrAmt();
    console.log("Entered populate or patch detail rows");


        /* ---------------- BANK ROW ---------------- */
    if (bankCoaSid) {
      console.log("Entered bank coa sid");
      const isCashMode = this.paymentForm.get('CashOrBank')?.value;
      const bankLedgerSource = isCashMode
        ? this.cashTypeLedgers
        : this.bankTypedLedgers;

      const bankLedger = bankLedgerSource.find(
        ledger => ledger.COAMasterSid === bankCoaSid
      );

      if (bankLedger) {
        const bankIndex = this.detailItems.controls.findIndex(
          ctrl => ctrl.get('DrCr')?.value === 'C'
        );

        const bankData = {
          COAMasterSid: bankLedger.COAMasterSid,
          LedgerMasterSid: bankLedger.LedgerMasterSid,
          CurrencyMasterSid: headerCurrencyId,
          CurrencyCode: headerCurrencyCode,
          ExchangeRate: exchangeRate,
          Amount: amount,
        };

        if (bankIndex > -1) {
          // 🔁 PATCH existing row
          this.detailItems.at(bankIndex).patchValue(bankData);
          this.calculateLocalAmount(bankIndex, true);
        } else {
          // ➕ ADD new row
          this.addDetailRow(
            {
              Sno: this.detailItems.length + 1,
              DrCr: 'C',
              ...bankData,
            },
            false
          );
          this.fetchLedgerForCOA(bankLedger, this.detailItems.length - 1);
          this.detailItems.at(this.detailItems.length - 1).get('COAMasterSid')?.disable();
          this.calculateLocalAmount(this.detailItems.length - 1, true);
        }
      }
    }


    /* ---------------- PARTY ROW ---------------- */
    if (partySid) {
      console.log("Entered party sid");
      const partyLedger = this.partyList.find(
        p => p.CustomerBranchSid === partySid
      );

      if (partyLedger) {
        const partyIndex = this.detailItems.controls.findIndex(
          ctrl => ctrl.get('DrCr')?.value === 'D'
        );

        const partyData = {
          COAMasterSid: partyLedger.COAMappedId,
          LedgerMasterSid: partyLedger.SubledgerMasterSid,
          CurrencyMasterSid: headerCurrencyId,
          CurrencyCode: headerCurrencyCode,
          ExchangeRate: exchangeRate,
          Amount: amount,
        };

        if (partyIndex > -1) {
          // 🔁 PATCH existing row
          this.detailItems.at(partyIndex).patchValue(partyData);
          this.calculateLocalAmount(partyIndex, true);
        } else {
          // ➕ ADD new row
          this.addDetailRow(
            {
              Sno: this.detailItems.length + 1,
              DrCr: 'D',
              ...partyData,
            },
            false
          );
          this.fetchLedgerForCOA(partyLedger, this.detailItems.length - 1);
          this.detailItems.at(this.detailItems.length - 1).get('COAMasterSid')?.disable();
          this.detailItems.at(this.detailItems.length - 1).get('LedgerMasterSid')?.disable();
          this.calculateLocalAmount(this.detailItems.length - 1, true);
        }
      }
    }


    this.checkAndUpdateForAllPartyDetail();
    this.updateDetailNarration();
  }


  handleCOAChange(coa: any, detailIndex: number, isPatching: boolean = false) {
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
    const instrumentMode = this.r['InstrumentMode']?.value;
    const instrumentNumber = this.r['InstrumentNumber']?.value;
    const bankPartyName = this.r['BankPartyName']?.value;

    partyCtrl?.patchValue({
      Narration:
        cashOrBank === 'Bank'
          ? `Being Bank Transfer  ${instrumentMode} ${instrumentNumber}`
          : `Being Cash Transfer .`,
    });

    bankCtrl?.patchValue({
      Narration:
        cashOrBank === 'Bank'
          ? `Being ${instrumentMode} ${instrumentNumber} from ${bankPartyName}`
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
    const masterJobCtrl = this.detailItems.at(detailIndex).get('MasterJobSid');
    const houseJobCtrl = this.detailItems.at(detailIndex).get('HouseJobSid');
    const deptJobCtrl = this.detailItems.at(detailIndex).get('DepartmentMasterSid');

    if(coa.JobNoRequire === 'Y'){
      masterJobCtrl.setValidators([Validators.required]); masterJobCtrl.updateValueAndValidity();
      houseJobCtrl.setValidators([Validators.required]); houseJobCtrl.updateValueAndValidity();
      deptJobCtrl.setValidators([Validators.required]); deptJobCtrl.updateValueAndValidity();
    } else {
      masterJobCtrl.clearValidators(); masterJobCtrl.updateValueAndValidity();
      houseJobCtrl.clearValidators(); houseJobCtrl.updateValueAndValidity();
      deptJobCtrl.clearValidators(); deptJobCtrl.updateValueAndValidity();
    }
    
    if (coa.SubledgerName === 'Y') {
      ledgerCtrl.enable();
      ledgerCtrl.setValidators([Validators.required]);
      this.accountService
        .getLedgerByCOAMasterSid({
          COAMasterSid: coa.COAMappedId || coa.COAMasterSid,
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          DrCr: 'C',
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
          isMatchedRecord ? tx.MatchingExRate : tx.ExchangeRate || 0,
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

  }

  patchExchangeRateForMatchRow(index: number) {
    const row = this.voucherMatchings.at(index) as FormGroup;
    const curr = row.get('matchCurr')?.value;

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

  get r(): { [key: string]: AbstractControl } {
    return this.paymentForm.controls || {};
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
  }

  handleDetailExchangeRate(currencySid: number, index: number) {
    const row = this.detailItems.at(index) as FormGroup;
    const exCtrl = row.get('ExchangeRate');

    if (!currencySid) return;

    // SAME CURRENCY
    if (currencySid === this.currentCompany?.CurrencyMasterSid) {
      exCtrl?.setValue(this.getFormattedExchangeRate(1, currencySid));
      exCtrl?.disable({ emitEvent: false });
      this.calculateLocalAmount(index,true);
      return;
    }

    // DIFFERENT CURRENCY
    exCtrl?.enable({ emitEvent: false });
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
      EffectiveFrom:
        this.paymentForm.get('VoucherDate')?.getRawValue ?? new Date(),
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
        this.recalcPartyAmtForAllDetails();
        this.checkAndUpdateForAllPartyDetail();
      } else {
        this.appSettingService.showError('Error fetching exchange rate');
      }
    });
  }

  onPartyChange(party: any) {
    const partyCountry = String(party?.countryMaster?.countryName)
      .trim()
      .toLowerCase();
    // errorLogger(this.paymentForm,this.toastr);
    if (!party) {
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
    this.paymentForm.patchValue({
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

  toggleCashOrBank(event: any) {
    const element = event.target as HTMLInputElement;
    const ctrl = this.paymentForm.get('CashOrBank');
    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      element.checked = !element.checked;
    }

    ctrl?.setValue(element.checked);
    this.r['BankCOA']?.setValue(null);

    const mode = this.paymentForm.get('InstrumentMode');
    const number = this.paymentForm.get('InstrumentNumber');
    const date = this.paymentForm.get('InstrumentDate');

    this.paymentForm.patchValue({
      InstrumentMode: null,
      InstrumentNumber: '',
      InstrumentDate: null,
      ClearanceDate: null,
    });

    if (element.checked) {
      mode?.clearValidators();
      number?.clearValidators();
      date?.clearValidators();
    } else {
      mode?.setValidators([Validators.required]);
      number?.setValidators([Validators.required]);
      date?.setValidators([Validators.required]);
    }

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
      EffectiveFrom:
        this.paymentForm.get('VoucherDate')?.getRawValue ?? new Date(),
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
      (c) => c.CurrencyMasterSid === CurrencyMasterSid
    )?.currencyCode;
    this.r['CurrencyCode']?.setValue(code);
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
      if (vd.DrCr === 'D') {
        totalCredits += Number(vd.PartyAmount) || 0;
      } else {
        totalDebits += Number(vd.PartyAmount) || 0;
      }
    });
    this.totalCredits = totalCredits || 0;
    this.totalDebits = totalDebits || 0;
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
  }

  reportPayment() {
    const modalRef = this.modalService.open(PaymentPrintComponent, {
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.paymentDataPrint = this.paymentDataPrint || [];
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


    // FIXED HERE
    const currencySid = this.getCurrencySidFromCode(originalCurr);


    row.patchValue({
      matchCurr: currencySid,
      matchExRate: exRate,
      matchCurrAmt: osCurrAmt,
      matchLocalAmt: osLocalAmt,
    });
    this.calculatePartyAmount(index);
    row.get('isTicked')?.setValue(checked);
    this.markAsDirty();


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
    return this.currentCompanyCountryCode === 'ae';
  }

  isUSACompany() {
    return this.currentCompanyCountryCode === 'us';
  }

  isIndianCompany() {
    return this.currentCompanyCountryCode === 'in';
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
        MenuName: 'Payment',
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