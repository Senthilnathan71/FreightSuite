import { CommonModule } from '@angular/common';
import { Component, HostListener, TemplateRef, ViewChild } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  AbstractControl,
  FormArray,
  FormBuilder,
  Validators,
  ValidationErrors,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  NgbDate,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbDateStruct,
  NgbDropdownModule,
  NgbTooltipModule,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import {
  CompanySettingsManagerService,
  CurrencySettings,
} from 'src/app/core/services/company-settings-manager.service';
import { OperationService } from '../../operation.service';
import {
  catchError,
  debounceTime,
  firstValueFrom,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { CommonService } from 'src/app/common/common.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import {
  errorLogger,
  getDefaultTodayDate,
  toNgbDateStruct,
  toNumber,
} from 'src/app/common/helper';
import { VoucherPeriodValidationService, VoucherDateConstraints } from 'src/app/common/voucher-period-validation.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import {
  consistentExchangeRatesValidator,
  getExchangeRateErrorMessage,
} from 'src/app/core/ValidationFn/exRateConsistency.validators';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { VendorCreditNotePrintComponent } from '../report/vendor-credit-note-print/vendor-credit-note-print.component';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { TaxCalculationService } from '../../services/tax-calculation.service';

interface NgbDateStructLike {
  day: number;
  month: number;
  year: number;
}

interface rateComparison {
  Rate : number;
  Amount : number;
  TaxableAmount : number;
  TaxAmount1 : number;
  TaxAmount2 : number;
  LocalAmount : number;
  PartyAmount : number;
}

@Component({
  selector: 'app-vendor-credit-note-entry',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FeatherModule,
    NgbDatepickerModule,
    NgbTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSpinnerModule,
    NumberFormatPipe,
    CustomDatePipe,
    SearchableDropdown,
    NgbDropdownModule,
    DecimalPrecisionDirective,
  ],
  templateUrl: './vendor-credit-note-entry.component.html',
  styleUrl: './vendor-credit-note-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
    TaxCalculationService,
  ],
})
export class VendorCreditNoteEntryComponent {
  userData: any;
  currUserEmail: string | null = null;
  currentCompany: any;
  currentBranch: any;
  currentCompanyCountry: {
    CountryMasterSid: number;
    countryName: string;
    countryCode: string;
  };
  currentCompanyCountryId: number;
  currentCompanyCountryCode: string;
  currentCompanyCurrency: CurrencySettings;
  currentBranchState: {
    StateMasterSid: number;
    stateName: string;
    stateCode: string;
  };
  currentBranchStateName: string;
  currentBranchCity: {
    CityMasterSid: number;
    cityName: string;
    cityCode: string;
  };
  currentUserState: string;
  currentFinancialYear: number;
  currentCountry: number;
  currentBranchCityId: number;
  currentBranchCityName: string | null;

  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;

  vendorCreditNoteForm!: FormGroup;
  headerId: number | null = null;
  private taxMastersReady: Promise<void> = Promise.resolve();
  vendorCreditNoteData: any;
  vendorCreditNotePrintData: any;
  isBankFetched: boolean = false;
  TandCFetched: boolean = false;
  bankDetails: any[] = [];
  currentMenuId: number;
  TandCList: any[] = [];
  isViewMode: boolean = false;
  isNonJob: boolean = false;
  jobSpecificDropdownFetch : boolean = false;
  nonJobSpecificDropdownFetch : boolean = false;
  get isEditMode() {
    return !!this.headerId && !this.isViewMode;
  }

  // Lookups
  vendorInvoiceList: any[] = [];
  vendorList: any[] = [];
  vendorBranchList: any[] = [];
  currencyList: any[] = [];
  chargeList: any[] = [];
  hssacList: any[] = [];
  hssacListForNonJob: any[][] = []; // for non job related
  subledgerList: any[] = [];
  uomList: any[] = [];
  departmentList: any[] = [];
  masterJobList: any[] = [];
  houseJobList: any[][] = [];
  taxGroupList: any[] = [];
  originalRateList : Map<number,rateComparison> = new Map();
  chargeTaxGroupMap: Map<number, any[]> = new Map();
  masterHouseMap: Map<number, any[]> = new Map();
  auditLogs: any[] = []; // Stores audit logs
    auditLogModalRef!: NgbModalRef;

  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  HSSACLookupConfig = DROPDOWN_CONFIGS.HSSAC_TAX;
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  masterJobLookupConfig = DROPDOWN_CONFIGS.MASTER_JOB;
  invoiceLookupConfig = DROPDOWN_CONFIGS.INVOICE;
  isTermsAndConditionsEnabled: boolean = true;
  MenuMasterSid: any;

  // Add master job config with other configs

  // UI state
  selectedTab = 'VendorCreditNote';
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }
  tabs = [
    { name: 'VendorCreditNote', icon: 'fas fa-file-invoice' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
  ];

  invoiceTypes = [
    { id: 'REG', name: 'Regular' },
    { id: 'REIMB', name: 'Reimbursement' },
    { id: 'BOS', name: 'Bill of Supply' },
    { id: 'NONGST', name: 'Non GST/Zero' },
  ];
  vatInvoiceTypes = [
    { id: 'REG', name: 'Regular' },
    { id: 'NONGST', name: 'Zero Rated' },
    { id: 'EXE', name: 'Exempt' },
    { id: 'OOS', name: 'Out of Scope' },
  ];
  get activeInvoiceTypes() { return this.isVATMode ? this.vatInvoiceTypes : this.invoiceTypes; }

  gstTypes = [
    { id: 'B2B', name: 'B2B - Business to Business' },
    { id: 'B2C', name: 'B2C - Business to Customer' },
    { id: 'EXPWP', name: 'Export With Payment' },
    { id: 'EXPWOP', name: 'Export Without Payment' },
    { id: 'RCM', name: 'RCM - Reverse Charge' },
    { id: 'VAT', name: 'VAT' },
  ];
  exportGstTypes = [
    { id: 'EXPWP', name: 'Export With Payment' },
    { id: 'EXPWOP', name: 'Export Without Payment' },
  ];

  statusList = [
    { value: 'A', name: 'Active' },
    { value: 'S', name: 'Suspended' },
  ];

  reason = [
    { id: 'Service Cancelled', name: 'Service Cancelled' },
    { id: 'Discount', name: 'Discount' },
    { id: 'Service Deficiency', name: 'Service Deficiency' },
    { id: 'Correction on Invoice', name: 'Correction on Invoice' },
    { id: 'Tax Changes', name: 'Tax Changes' },
    { id: 'Place of Supply Change', name: 'Place of Supply Change' },
    { id: 'Others', name: 'Others' },
  ];

  currentDate = new Date();
  isAutoPosting: boolean = true;

  // others
  coaList: any[] = [];
  subledgerListDetail: any[][] = [];
  minVoucherDate: NgbDateStruct = null;

  get effectiveMinDate(): NgbDateStruct | null {
    if (this.minVoucherDate && this.fyMinDate) {
      const invDate = new Date(this.minVoucherDate.year, this.minVoucherDate.month - 1, this.minVoucherDate.day);
      const fyDate = new Date(this.fyMinDate.year, this.fyMinDate.month - 1, this.fyMinDate.day);
      return invDate > fyDate ? this.minVoucherDate : this.fyMinDate;
    }
    return this.fyMinDate;
  }

  // Voucher period constraints
  voucherConstraints: VoucherDateConstraints = {
    isClosed: false, errorMessage: null
  };

  // Country/Tax mode
  bookingModeCountry: string = 'india';
  // Unsaved changes related varaible declarations
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();

  // Search costs
  searchType: string = 'Master Job';
  searchValue: string = '';
  pendingCosts: any[] = [];
  selectedCosts: Set<number> = new Set();
  searchPerformed: boolean = false;
  searchResultsLoading: boolean = false;
  selectedVendorForCosts: any = null;
  allPendingCosts: any[] = [];
  searchVendors: any[] = [];
  searchTypes = [
    { id: 'Customer', name: 'Customer' },
    { id: 'Master Job', name: 'Master Job' },
    { id: 'House Job', name: 'House Job' },
    { id: 'MBL No', name: 'MBL No' },
    { id: 'HBL No', name: 'HBL No' },
    { id: 'Container No', name: 'Container No' },
  ];

  private originalInvoiceRates: Map<number, number> = new Map();
  invoiceOutstandingAmount: number = 0;
  invoiceOutstandingLocalAmount : number = 0;
  selectedOutstandingInvoice: any = null;
  showOutstandingInfo: boolean = false;

  // Country/Tax mode

  get isIndiaGST(): boolean {
    return this.taxCalculationService.isIndiaGST;
  }
  get isVATMode(): boolean {
    return this.taxCalculationService.isVATMode;
  }

  get f(): { [key: string]: AbstractControl } {
    return this.vendorCreditNoteForm.controls;
  }
  get details(): FormArray {
    return this.vendorCreditNoteForm.get('voucherDetails') as FormArray;
  }
  // get tdsGroup(): FormGroup {
  //   return this.vendorCreditNoteForm.get('voucherTDS') as FormGroup;
  // }

  // storing frequently used data in a map
  /**
   * Exchange rate map
   * key = fromCurrencyCode + toCurrencyCode + Date
   */
  private exchangeRateMap: Map<string, number> = new Map();
  buildExchangeRateMapKey(
    fromCurrencyCode: string,
    toCurrencyCode: string,
    date: Date,
  ): string {
    return `${fromCurrencyCode}_${toCurrencyCode}_${date.toISOString()}`;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private companySettings: CompanySettingsManagerService,
    public mps: MenuPermissionService,
    private ngbModal: NgbModal,
    private commonService: CommonService,
    private masterService: MasterService,
    private currencyFormatter: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService,
    private datePipe: CustomDatePipe,
    private voucherPeriodService: VoucherPeriodValidationService,
    private numberToWords: NumberToWordsService,
    public taxCalculationService: TaxCalculationService,
  ) {}

  ngOnInit(): void {
    try {
      const userProfile = this.appSettingService.getDecryptedUserProfile();
      if (userProfile) {
        this.userData = userProfile;
        this.currUserEmail = this.userData.userEmail;
      }

      this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
      this.currentBranch = this.appSettingService.getCurrentBranchInfo();
      this.currentCompanyCountry =
        this.appSettingService.getCurrentCompanyCountry();
      this.currentCompanyCurrency = this.companySettings.getCurrencySettings();
      this.currentBranchState = this.appSettingService.getCurrentBranchState();
      this.currentBranchCity = this.appSettingService.getCurrentBranchCity();
      const currentFinancialYear =
        this.appSettingService.getCurrentFinancialYear();
      this.currentFinancialYear = Number(
        localStorage.getItem('current-year-id'),
      );

      if (currentFinancialYear) {
        this.fyMinDate = toNgbDateStruct(currentFinancialYear.StartDate);
        const fyEnd = new Date(currentFinancialYear.EndDate);
        const today = getDefaultTodayDate();
        this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
      }

      this.currentMenuId = this.mps.getMenuId();
      this.mps.init().subscribe();

      // Assigning value to global variables
      this.currentCompanyCountryId =
        Number(this.currentCompany?.CountryMasterSid) ||
        this.currentCompanyCountry.CountryMasterSid;
      this.currentCompanyCountryCode = String(
        this.currentCompanyCountry.countryCode,
      )
        .trim()
        .toLowerCase();
      if (currentFinancialYear) {
        this.currentFinancialYear = Number(currentFinancialYear.YearMasterSid);
      }
      if (this.currentBranchState) {
        this.currentBranchStateName =
          this.currentBranchState.stateName ||
          this.currentBranch?.stateMaster?.stateName;
      }
      if (this.currentBranchCity) {
        this.currentBranchCityId =
          this.currentBranchCity.CityMasterSid ||
          this.currentBranch?.cityMaster?.CityMasterSid;
      }
    } catch (e) {
      this.currentCompany = null;
      this.currentBranch = null;
    }
    const paramValue = this.route.snapshot.queryParamMap.get('isNonJob');
    this.isNonJob = paramValue === 'true';

    this.route.data.subscribe((data) => {
      this.isViewMode = data['viewMode'] === true;
    });
    this.loadTermsAndConditionsConfig();
    this.initForm();
    this.loadVoucherPeriods();
    // this.checkVoucherPostingMechanism();

    this.taxMastersReady = this.taxCalculationService.init({
      documentSide: 'PURCHASE',
      companyCountryCode: this.currentCompanyCountryCode,
      companyCountryMasterSid: this.currentCompanyCountryId,
      branchStateName: this.currentBranchStateName,
      branchStateMasterSid: this.currentBranchState?.StateMasterSid,
    }).then(() => this.taxCalculationService.fetchTaxMasters('PURCHASE'));

    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (id) {
        this.headerId = Number(id);
        await this.taxMastersReady;
        this.loadVendorCreditNoteById(this.headerId);
      } else {
        this.initialFormValue = this.vendorCreditNoteForm.getRawValue();
        this.subscribeToFormChanges();
        this.subscribeToValueChanges();
      }
    });

    this.loadLookups();
    this.spinner.show();

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
      },
      error: () => {
        // Default to enabled if config fetch fails
        this.isTermsAndConditionsEnabled = true;
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

  initForm() {
    const companyCurrencyId =
      this.currentCompany.CurrencyMasterSid ||
      this.currentCompanyCurrency.currencyMasterSid;
    const companyCurrencyCode = this.currentCompanyCurrency.code;
    const today = getDefaultTodayDate();
    const fyDefault = this.appSettingService.getCurrentFinancialYear();
    const defaultVoucherDate = fyDefault && (today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)) ? fyDefault.EndDate : today;

    this.vendorCreditNoteForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }],
      VoucherDate: [defaultVoucherDate, Validators.required],
      PartyMasterSid: [{ value: null, disabled: true }],
      PartyName: [{ value: '', disabled: true }],
      PartyAddress: [{ value: '', disabled: true }],
      COAMasterSid: [null],
      CustomerBranchSid: [{ value: null, disabled: true }],
      IRNNumber: [{ value: '', disabled: true }],
      MasterJobSid: [{ value: null, disabled: true }],
      MBLNo: [{ value: '', disabled: true }],
      HouseJobSid: [{ value: null, disabled: true }],
      HBLNo: [{ value: '', disabled: true }],
      CurrencyMasterSid: [{ value: null, disabled: true }],
      CurrencyCode: [{ value: '', disabled: true }],
      ExchangeRate: [{ value: 1, disabled: true }],
      GST_VAT: [{ value: '', disabled: true }],
      PlaceOfSupply: [{ value: '', disabled: true }],
      PostStatus: [{ value: 'U', disabled: true }],
      PostedOn: [{ value: null, disabled: true }],
      GSTType: [{ value: '', disabled: true }],
      InvoiceType: [{ value: 'B2B', disabled: true }],
      Narration: [{ value: '', disabled: true }],
      Remarks: [{ value: '', disabled: true }],
      IRNStatus: [{ value: '', disabled: true }],
      Status: [{ value: 'A', disabled: true }],
      JobOrNonJob: [{ value: this.isNonJob, disabled: true }], // true then non job , false then job
      DepartmentMasterSid: [{ value: null, disabled: true }],
      BillNo: [{ value: '', disabled: true }],
      BillDate: [{ value: null, disabled: true }],
      BillAmt: [{ value: 0, disabled: true }],
      CreditNoteReason: [null, Validators.required],
      ReversalVoucher: [{ value: '', disabled: true }],
      ReversalVoucherNumber: [""],
      Salesman : [''],
      State: [{ value: '', disabled: true }],
      HouseNumber: [{ value: '', disabled: true }],
      MasterNumber: [{ value: '', disabled: true }],
      BookingHeaderSid: [{ value: null, disabled: true }],
      // Details Array
      voucherDetails: this.fb.array([]),

      // TDS Section
      // voucherTDS: this.fb.group({
      //   TDSSet: [{ value: '', disabled: true }],
      //   TDSCompany: [{ value: '', disabled: true }],
      //   ITSectionType: [{ value: '', disabled: true }],
      //   ITSectionCode: [{ value: 'null', disabled: true }],
      //   CertificateNo: [{ value: '', disabled: true }],
      //   Percentage: [{ value: 0, disabled: true }],
      //   TaxableAmt: [{ value: 0, disabled: true }],
      //   TDSSetRateSid: [{ value: 0, disabled: true }],
      //   TDSAmt: [{ value: 0, disabled: true }],
      //   Reason: [''],
      //   TDSSectionCode:[''],
      //   TDSNature:[''],
      //   TDSCompanyType:[''],
      //   TDSPercent:[''],
      //   TDSAccountCode:['']
      // }),

      // Others
      voucherOthers: this.fb.group({
        ContainerNumber: [''],
        VoucherNote: [''],
        Footer: [''],
      }),
    });
  }

  subscribeToValueChanges() {
    ['GSTType', 'CurrencyCode', 'ExchangeRate'].forEach((field) => {
      this.vendorCreditNoteForm
        .get(field)
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.isPosted) return;
          this.recalculateAllRows();
        });
    });

    this.vendorCreditNoteForm.get('InvoiceType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((invoiceType) => {
        if (!this.vendorCreditNoteForm.get('PlaceOfSupply')?.value) return;
        const classification = this.taxCalculationService.updateInvoiceType(invoiceType as any);
        this.vendorCreditNoteForm.get('GSTType')?.setValue(classification.formGSTType, { emitEvent: false });
        if (this.isPosted) return;
        this.recalculateAllRows();
      });
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
      this.onSubmit(resolve);
    });
  }

  subscribeToFormChanges() {
    this.vendorCreditNoteForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.vendorCreditNoteForm.getRawValue(),
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
      return value.map((v) => this.normalizeValue(v));
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
    // console.log("normalizedObj1", JSON.stringify(normalizedObj1));
    // console.log("normalizedObj2", JSON.stringify(normalizedObj2));
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }

  private autoGenerateNarration(reversalVoucher: any): string {
    if (!reversalVoucher) return '';
    const voucherNumber = reversalVoucher.VoucherNumber || "";
    const voucherType = reversalVoucher.voucherType || "";
    if (voucherNumber) {
      return `Being reversal of ${voucherNumber}${voucherType ? ` - ${voucherType}` : ''}`;
    }

    return '';
  }

  onVendorInvoiceChange(selectedVendorInvoice: any) {
    if(selectedVendorInvoice) return;
    this.onReset();
  }

  onHeaderCurrencyChange(selectedCurrency: any): void {
    if (!selectedCurrency) return;
    const currencyMasterSid = selectedCurrency?.CurrencyMasterSid;
    const currencyCode = selectedCurrency?.currencyCode;

    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    const companyCurrencyCode = this.currentCompanyCurrency?.code;

    // If same as company currency, set exchange rate to 1 and disable
    if (currencyMasterSid === companyCurrency) {
      this.vendorCreditNoteForm.patchValue({
        CurrencyMasterSid: currencyMasterSid,
        CurrencyCode: currencyCode,
        ExchangeRate: 1,
      });
      this.vendorCreditNoteForm.get('ExchangeRate')?.disable();
    } else {
      this.fetchExchangeRate(currencyCode, companyCurrencyCode);
    }
  }

  // Load lookups
  loadLookups() {
    this.spinner.show();

    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const filterOption = { CompanyMasterSid, BranchMasterSid };

    const source: any = {
      vendors: this.operationService
        .getAllCreditorWithCOAMapped(filterOption)
        .pipe(catchError(() => of({ data: [] }))),

      currencies: this.operationService
        .getAllCurrencies()
        .pipe(catchError(() => of({ data: [] }))),

      uom: this.operationService
        .getAllUom()
        .pipe(catchError(() => of({ data: [] }))),

      departments: this.operationService
        .getAllDepartments(CompanyMasterSid)
        .pipe(catchError(() => of({ data: [] }))),

      masterJobs: this.operationService
        .getAllMasterJobs({ ...filterOption, limit: 200, offset: 0 })
        .pipe(catchError(() => of({ data: [] }))),
    };

    forkJoin(source).subscribe({
      next: ({
        vendors,
        currencies,
        uom,
        departments,
        masterJobs,
      }: any) => {
        this.vendorList = vendors.data || [];
        this.subledgerList = vendors.data || [];
        this.uomList = uom.data || [];
        this.departmentList = departments.data || [];
        this.masterJobList = masterJobs.data || [];
        this.currencyList = currencies.data || [];

        this.currencyConfigService.initializeConfigurations(this.currencyList);

        this.spinner.hide();
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Lookup error:', err);
      },
    });
  }

  handleDropdownBasedOnJob(): Observable<void> {
    const CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch.BranchMasterSid;

    // ---------- NON JOB ----------
    if (this.isNonJob && !this.nonJobSpecificDropdownFetch) {
      return forkJoin({
        coa: this.operationService
          .getAllCoaWithLedgerCategory({
            LedgerCategory: 'Ledger',
            CompanyMasterSid,
            filterNonJob: true,
          })
          .pipe(catchError(() => of({ data: [] }))),

        hssac: this.operationService
          .getAllHssac()
          .pipe(catchError(() => of([]))),
      }).pipe(
        tap(({ coa, hssac }) => {
          this.coaList = coa.data || [];
          this.hssacListForNonJob = hssac || [];

          this.nonJobSpecificDropdownFetch = true;
        }),
        map(() => void 0)
      );
    }

    // ---------- JOB ----------
    if (!this.isNonJob && !this.jobSpecificDropdownFetch) {
      return this.operationService
        .getAllMappedChargeDebtors({ CompanyMasterSid, BranchMasterSid })
        .pipe(
          catchError(() => of({ data: [] })),
          tap((charges: any) => {
            this.chargeList = charges.data || [];

            this.jobSpecificDropdownFetch = true;
          }),
          map(() => void 0)
        );
    }

    // ---------- NOTHING TO FETCH ----------
    return of(void 0);
  }

  
  getVendorInvoiceData() {
    const invoiceNumber = this.vendorCreditNoteForm.get('ReversalVoucherNumber')?.value;
    const searchValue = String(invoiceNumber).trim();
    if (!invoiceNumber) {
      this.appSettingService.showWarning(
        'Please enter an vendor invoice number first.',
      );
      return;
    }

    
    const payload = {
      VoucherNumber : searchValue,
      CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
      BranchMasterSid : this.currentBranch?.BranchMasterSid
    }
    
    this.spinner.show();
    this.operationService.getVendorInvoiceByNumber(payload).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          const data = resp.data;
          if(!data.hasOutstandingAmount){
            this.appSettingService.showWarning('No outstanding amount found for this invoice.');
            this.spinner.hide();
            return;
          }
          this.vendorCreditNoteForm.patchValue({
            ReversalVoucher: data.VoucherHeaderSid,
          });

          const autoNarration = this.autoGenerateNarration(resp.data);
          this.vendorCreditNoteForm.get('Narration')?.setValue(autoNarration);
          this.minVoucherDate = toNgbDateStruct(resp.data?.VoucherDate) || null;
          this.isNonJob = data.CashOrBank === 'Y';

          // 🔑 WAIT for dropdowns to load
          this.handleDropdownBasedOnJob().subscribe({
            next: () => {
              this.patchVendorInvoiceData(data);
            },
            error: () => {
              this.spinner.hide();
            }
          });
          this.appSettingService.showSuccess(
            'Vendor Invoice data loaded successfully.',
          );
        } else {
          this.spinner.hide();
          this.appSettingService.showError(resp.message);
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Error fetching vendor invoice:', err);
        this.appSettingService.showError('Failed to load vendor invoice data.');
      },
    });
  }

  private patchVendorInvoiceData(data: any) {
    const header = data;
    const vendorCreditNote =
      header.VoucherHeaderSid || header.voucherHeaderSid || null;
    this.originalInvoiceRates = new Map();
    const autoNarration = this.autoGenerateNarration(
      this.vendorCreditNoteForm.get('ReversalVoucher')?.value,
    );


    this.getVendorBranchByVendor(header.CustomerMasterSid);

    this.vendorCreditNoteForm.patchValue({
      ReversalVoucher: vendorCreditNote,
      Narration: autoNarration || header.Narration || '',
      PartyMasterSid: header.PartyMasterSid || null,
      PartyName: header.PartyName || '',
      PartyAddress: header.PartyAddress || '',
      CustomerBranchSid: header.CustomerBranchSid || null,
      COAMasterSid: header.COAMasterSid || null,
      GST_VAT: header.GST_VAT || '',
      GSTType: header.GSTType || '',
      PlaceOfSupply: header.PlaceOfSupply || '',
      InvoiceType: header.InvoiceType || '',
      IRNNumber: header.IRNNumber || '',
      IRNStatus: header.IRNStatus || '',
      State: header.State || '',
      DepartmentMasterSid: header.DepartmentMasterSid || null,
      HouseNumber: header.HouseNumber || '',
      MasterNumber: header.MasterNumber || '',
      HouseJobSid: header.HouseJobSid || null,
      BookingHeaderSid: header.BookingHeaderSid || null,
      CurrencyMasterSid: header.CurrencyMasterSid || null,
      Salesman : header.Salesman || "",
      CurrencyCode:
        header.currencyMaster?.currencyCode || header.CurrencyCode || null,
      ExchangeRate: header.ExchangeRate || header.ExRate || 1,
      BillAmount: header.Amount || 0,
      BillDate: header.DocumentDate,
      BillNo: header.DocumentNumber || '',
      MBLNo: header.MasterNumber || '',
      HBLNo: header.HouseNumber || '',
      Remarks: header.Remarks || '',
    },{emitEvent : false});

    // if (
    //   header.CurrencyMasterSid === this.currentCompany?.CurrencyMasterSid ||
    //   this.isPosted
    // ) {
    //   this.vendorCreditNoteForm.get('ExchangeRate')?.disable();
    // } else {
    //   this.vendorCreditNoteForm.get('ExchangeRate')?.enable();
    // }

    this.details.clear();
    let index = 0;
    (data.VoucherDetail || []).forEach((detail: any) => {
      const originalDrCr = detail.DrCr || detail.drCr || 'D';
      const swappedDrCr = originalDrCr === 'C' ? 'D' : 'C';

      const originalRateComparison : rateComparison = {
        Rate : toNumber(this.getFormattedAmount(detail.Rate || 0, detail.CurrencyMasterSid)),
        Amount : toNumber(this.getFormattedAmount(detail.Amount || 0, detail.CurrencyMasterSid)),
        TaxableAmount : toNumber(this.getFormattedAmount(detail.TaxableAmount || 0, this.currentCompany.CurrencyMasterSid)),
        TaxAmount1 : toNumber(this.getFormattedAmount(detail.TaxAmount1 || 0, this.currentCompany.CurrencyMasterSid)),
        TaxAmount2 : toNumber(this.getFormattedAmount(detail.TaxAmount2 || 0, this.currentCompany.CurrencyMasterSid)),
        LocalAmount : toNumber(this.getFormattedAmount(detail.LocalAmount || 0, this.currentCompany.CurrencyMasterSid)),
        PartyAmount : toNumber(this.getFormattedAmount(detail.PartyAmount || 0, data.CurrencyMasterSid)),
      }

      this.originalRateList.set(detail.VoucherDetailSid ,originalRateComparison);

      this.details.push(
        this.createDetailGroup({
          SourceDetailSid: detail.VoucherDetailSid,
          ChargeMasterSid: detail.ChargeMasterSid,
          ChargeDescription: detail.ChargeDescription,
          HSSACMasterSid: detail.HSSACMasterSid,
          LedgerMasterSid: detail.LedgerMasterSid,
          COAMasterSid: detail.COAMasterSid,
          ChargeUOMSid: detail.ChargeUOMSid,
          DepartmentMasterSid: detail.DepartmentMasterSid,
          NumberOfUnit: detail.NumberOfUnit,
          DrCr: swappedDrCr,
          CurrencyMasterSid : detail.CurrencyMasterSid,
          CurrencyCode: detail.CurrencyCode,
          Rate: detail.Rate != null ? Number(detail.Rate) : 0,
          ExchangeRate: detail.ExchangeRate,
          Amount: toNumber(detail.Amount),
          TaxableAmount: toNumber(detail.TaxableAmount),
          TaxPercentage1: toNumber(detail.TaxPercentage1),
          TaxAmount1: toNumber(detail.TaxAmount1),
          TaxPercentage2: toNumber(detail.TaxPercentage2),
          TaxAmount2: toNumber(detail.TaxAmount2),
          MasterNumber:
            header.MasterNumber || detail.masterJob?.MasterJobNumber,
          HouseNumber: header.HouseNumber || detail.houseJob?.HouseNo,
          YearMasterSid: detail.YearMasterSid,
          LocalAmount: toNumber(detail.LocalAmount),
          PartyAmount: toNumber(detail.PartyAmount),
          MasterJobSid: detail.MasterJobSid,
          BookingRatesSid : detail.BookingRatesSid,
          CostRevenueChargesSid : detail.CostRevenueChargesSid ?? null,
          HouseJobSid: detail.HouseJobSid,
        }),
      );
      this.fetchHSN(this.details.length - 1, false);
      if (detail.CurrencyMasterSid === this.currentCompany.CurrencyMasterSid) {
        this.details
          .at(this.details.length - 1)
          .get('ExchangeRate')
          ?.disable();
      }
      if (detail.MasterJobSid) {
        this.onDetailMasterJobSelected(
          {
            MasterJobSid: detail.MasterJobSid,
            DepartmentMasterSid: detail.DepartmentMasterSid || null,
          },
          index,
        );
      }
      if (this.isNonJob) {
        if (detail.COAMasterSid) {
          const selectedCOA = this.coaList.find(
            (coa) => coa.COAMasterSid === detail.COAMasterSid,
          );
          if (selectedCOA && selectedCOA.SubledgerName === 'Y') {
            this.onCOAChange(selectedCOA, index, false);
          }
        }
        // In non-job mode, only Rate is editable (same as job mode)
        this.details.at(index).get('COAMasterSid')?.disable({ emitEvent: false });
        this.details.at(index).get('LedgerMasterSid')?.disable({ emitEvent: false });
      }
      index++;
    });

    const voucherOthersSource =
      data.VoucherOthers ||
      data.voucherOthers ||
      (Array.isArray(data.voucherOthers) ? data.voucherOthers[0] : undefined);

    if (voucherOthersSource) {
      const vg = this.vendorCreditNoteForm.get('voucherOthers') as FormGroup;
      vg.patchValue({
        ContainerNumber: voucherOthersSource.ContainerNumber || '',
        VoucherNote: voucherOthersSource.VoucherNote || '',
        Footer: voucherOthersSource.Footer || '',
        ReverseCreditNote: voucherOthersSource.ReverseCreditNote || '',
        DueDate: voucherOthersSource.DueDate
          ? new Date(voucherOthersSource.DueDate)
          : null,
        IRNNumber: voucherOthersSource.IRNNumber || '',
      });
    }
    if(data.hasOutstandingAmount){
      this.invoiceOutstandingAmount = data.totalOSAmount;
      this.invoiceOutstandingLocalAmount = data.totalOSLocalAmount;
    }
    this.spinner.hide();
  }

  loadVoucherPeriods(): void {
    this.voucherPeriodService.loadPeriods(
      this.currentCompany?.CompanyMasterSid,
      this.currentBranch?.BranchMasterSid,
      this.currentFinancialYear,
      () => this.applyVoucherDateConstraints()
    );
  }

  applyVoucherDateConstraints(): void {
    const voucherDate = this.vendorCreditNoteForm?.get('VoucherDate')?.value;
    this.voucherConstraints = this.voucherPeriodService.applyConstraints(voucherDate, 'AP');
  }

  onVoucherDateChange() {
    this.applyVoucherDateConstraints();
    const voucherDate = this.vendorCreditNoteForm
      .get('VoucherDate')
      ?.getRawValue();
    if (!voucherDate) return;

    const companyCurrency = this.currentCompanyCurrency.code;

    // Check if header currency available , if yes fetch and recalculate
    const headerCurrencyId = this.vendorCreditNoteForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    const headerCurrencyCode = this.vendorCreditNoteForm
      .get('CurrencyCode')
      ?.getRawValue();
    if (headerCurrencyId) {
      if (headerCurrencyCode === companyCurrency) {
        this.vendorCreditNoteForm
          .get('ExchangeRate')
          ?.setValue(
            this.getFormattedAndPaddedExchangeRate(1, headerCurrencyId),
          );
        this.vendorCreditNoteForm.get('ExchangeRate')?.disable();
        this.recalculateAllRows();
        return;
      }

      const key = this.buildExchangeRateMapKey(
        headerCurrencyCode,
        companyCurrency,
        voucherDate,
      );

      if (this.exchangeRateMap.has(key)) {
        const exchangeRate = this.exchangeRateMap.get(key);
        this.vendorCreditNoteForm
          .get('ExchangeRate')
          ?.setValue(
            this.getFormattedAndPaddedExchangeRate(
              exchangeRate,
              headerCurrencyId,
            ),
          );
        this.recalculateAllRows();
      } else {
        this.fetchExchangeRate(headerCurrencyCode, companyCurrency);
      }
    }

    // check for each detail and update the exchange rate
    // this.details.controls.forEach((detail: FormGroup, index: number) => {
    //   const rawValue = detail.getRawValue();
    //   const fromCurrencyCode = rawValue.CurrencyCode;
    //   const toCurrencyCode = companyCurrency;
    //   const key = this.buildExchangeRateMapKey(fromCurrencyCode, toCurrencyCode, voucherDate);
    //   if (this.exchangeRateMap.has(key)) {
    //     const exchangeRate = this.exchangeRateMap.get(key);
    //     detail.get('ExchangeRate')?.setValue(this.getFormattedAndPaddedExchangeRate(exchangeRate, headerCurrencyId));
    //     this.recalcRow(index);
    //   } else {
    //     this.patchExchangeRateForDetail(
    //       fromCurrencyCode,
    //       toCurrencyCode,
    //       index,
    //     )
    //   }
    // });
  }

  // Vendor selection
  onVendorChange(selected: any) {
    const vendorMasterSid =
      typeof selected === 'object' && selected !== null
        ? (selected.CustomerMasterSid ?? selected)
        : selected;

    if (!selected || !vendorMasterSid) {
      this.vendorBranchList = [];
      this.vendorCreditNoteForm.get('CustomerBranchSid')?.setValue(null);
      this.vendorCreditNoteForm.get('PartyAddress')?.setValue('');
      this.vendorCreditNoteForm.get('PartyMasterSid')?.setValue(null);
      this.vendorCreditNoteForm.get('COAMasterSid')?.setValue(null);
      this.vendorCreditNoteForm.get('GST_VAT')?.setValue('');
      this.vendorCreditNoteForm.get('PartyName')?.setValue('');
      this.vendorCreditNoteForm.get('PlaceOfSupply')?.setValue('');
      this.vendorCreditNoteForm.get('InvoiceType')?.setValue('REG');
      this.vendorCreditNoteForm.get('GSTType')?.setValue('');
      return;
    }
    const vendor = this.vendorList.find(
      (v) => v.CustomerMasterSid === vendorMasterSid,
    );
    const countryCode = this.getCustomerCountryCode(vendor);

    if (vendor) {
      this.vendorCreditNoteForm.patchValue({
        PartyName: vendor.CustomerName || null,
        PartyMasterSid: vendor.SubledgerMasterSid,
        COAMasterSid: vendor.COAMappedId,
        InvoiceType: 'REG',
      });
      // Load TDS configuration
      // this.loadVendorTDS(vendorMasterSid);
    }

    // Reset branch selection when vendor changes
    this.vendorCreditNoteForm.get('CustomerBranchSid')?.setValue(null);
    this.vendorCreditNoteForm.get('PartyAddress')?.setValue('');
    this.vendorCreditNoteForm.get('PlaceOfSupply')?.setValue('');
    this.vendorCreditNoteForm.get('GSTType')?.setValue('');
    this.getVendorBranchByVendor(Number(vendorMasterSid));
  }

  // Enhanced getVendorBranchByVendor method with callback
  getVendorBranchByVendor(CustomerMasterSid: number) {
    if (!CustomerMasterSid) {
      this.vendorBranchList = [];
      return;
    }

    this.operationService
      .getCustomerBranchByCustomer(CustomerMasterSid)
      .subscribe({
        next: (resp: any) => {
          if (resp?.status) {
            this.vendorBranchList = resp.data || [];
          }
        },
        error: (err) => {
          console.error('Error fetching vendor branches', err);
          this.vendorBranchList = [];
        },
      });
  }

  // Enhanced vendor branch selection
  onVendorBranchChange(selectedBranch: any) {
    const branchSid =
      typeof selectedBranch === 'object' && selectedBranch !== null
        ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
        : selectedBranch;

    if (!branchSid) {
      this.vendorCreditNoteForm.get('PartyAddress')?.setValue('');
      this.vendorCreditNoteForm.get('PlaceOfSupply')?.setValue('');
      this.vendorCreditNoteForm.get('GSTType')?.setValue('');
      return;
    }

    const foundBranch = this.vendorBranchList.find(
      (b) => Number(b.CustomerBranchSid) === Number(branchSid),
    );
    // Overseas party → Place of Supply is the seller's (company's) state
    const vendorCountry = this.getVendorCountry()?.toLowerCase();
    const isOverseas = vendorCountry && vendorCountry !== this.currentCompanyCountryCode;
    const placeOfSupply = isOverseas
      ? (this.currentBranchStateName || '')
      : (foundBranch?.stateMaster?.stateName || '');

    if (foundBranch) {
      this.vendorCreditNoteForm.patchValue({
        PartyAddress: foundBranch.Address,
        PlaceOfSupply: placeOfSupply,
      });
      if (this.currentCompanyCountryCode === 'in') {
        this.vendorCreditNoteForm.get('GST_VAT')?.setValue(foundBranch?.GSTNo || '');
      } else {
        this.vendorCreditNoteForm.get('GST_VAT')?.setValue(foundBranch?.customerMaster?.PanType || '');
      }
    } else {
      this.vendorCreditNoteForm.get('PartyAddress')?.setValue('');
      this.vendorCreditNoteForm.get('PlaceOfSupply')?.setValue('');
    }
    this.determineGSTType(placeOfSupply);
    this.recalculateAllRows();
  }

  determineGSTType(placeOfSupply: string) {
    if (!placeOfSupply) {
      this.vendorCreditNoteForm.get('GSTType')?.setValue('');
      return;
    }

    const vendorBranchSid = this.vendorCreditNoteForm.get('CustomerBranchSid')?.value;
    const foundBranch = this.vendorBranchList.find(
      (branch) => Number(branch.CustomerBranchSid) === Number(vendorBranchSid),
    );
    const vendorGSTNo = this.vendorCreditNoteForm.get('GST_VAT')?.value;
    const invoiceType = this.vendorCreditNoteForm.get('InvoiceType')?.value;
    const vendorCountry = this.getVendorCountry();

    const classification = this.taxCalculationService.updateParty(
      {
        countryCode: vendorCountry || this.currentCompanyCountryCode,
        stateName: placeOfSupply,
        stateMasterSid: foundBranch?.stateMaster?.StateMasterSid,
        gstNumber: vendorGSTNo,
        customerGstType: foundBranch?.CustomerGstType || 'Regular',
        isUnionTerritory: foundBranch?.stateMaster?.IsUnionTerritory === 'Y',
      },
      invoiceType as any
    );

    this.vendorCreditNoteForm.get('GSTType')?.setValue(classification.formGSTType);

    if (this.currentCompanyCountryCode !== 'in') {
      this.vendorCreditNoteForm.get('GSTType')?.setValue('VAT');
      this.vendorCreditNoteForm.get('TaxType')?.setValue('VAT');
    }
  }

  loadVendorCreditNoteById(id: number) {
    this.operationService.getVendorCreditNoteById(id).subscribe({
      next: (resp: any) => {
        if (resp.status && resp.data) {
          this.destroy$.next();
          this.destroy$.complete();
          const data = resp.data;
          this.vendorCreditNoteData = resp.data;
          this.vendorCreditNoteForm.markAllAsTouched();

          this.isNonJob = data.CashOrBank === 'Y';
          this.handleDropdownBasedOnJob().subscribe({
            next: () => {
              this.patchValues(data);
              // this.invoiceOutstandingAmount = data.netOutstandingForParty || 0;

              this.vendorCreditNoteForm.get('PartyName')?.disable();
              this.vendorCreditNoteForm.get('CustomerBranchSid')?.disable();
              this.vendorCreditNoteForm.get('CurrencyMasterSid')?.disable();
              this.vendorCreditNoteForm.get('CurrencyCode')?.disable();
              if (this.isReadOnly) {
                this.details.disable({ emitEvent: false });
                this.isDirty = false;
                this.initialFormValue = this.vendorCreditNoteForm.getRawValue();
                this.vendorCreditNoteForm.disable();
                this.destroy$.next();
                this.destroy$.complete();
                return;
              }
              setTimeout(() => {
                this.initialFormValue = this.vendorCreditNoteForm.getRawValue();
                this.isDirty = false;
                this.subscribeToFormChanges();
                this.subscribeToValueChanges();
              }, 0);
            },
            error: () => {
              this.spinner.hide();
            }
          });
          // this.setFormReadonly();
        } else {
          this.spinner.hide();
          this.appSettingService.showError(resp.message);
        }
      },
      error: (error) => {
        this.spinner.hide();
        console.error('Error:', error);
        this.appSettingService.showError('Error loading Vendor Invoice');
      },
    });
  }

  patchValues(data: any) {
    if (data.CustomerMasterSid) {
      this.getVendorBranchByVendor(Number(data.CustomerMasterSid));
    } else {
      this.vendorBranchList = [];
    }

    this.vendorCreditNoteForm.patchValue(
      {
        ReversalVoucher: data.ReversalVoucher,
        ReversalVoucherNumber: data.reversalVoucher?.VoucherNumber || "",
        VoucherNumber: data.VoucherNumber,
        VoucherDate: data.VoucherDate,
        CustomerMasterSid: data.CustomerMasterSid || null,
        CustomerBranchSid: data.CustomerBranchSid || null,
        PartyMasterSid: data.PartyMasterSid || null,
        PartyName: data.PartyName || '',
        PartyAddress: data.PartyAddress || '',
        COAMasterSid: data.COAMasterSid || null,
        PlaceOfSupply: data.PlaceOfSupply,
        PostStatus: data.PostStatus,
        MasterJobSid: data.MasterJobSid,
        HBLNo: data.HouseNumber,
        CurrencyMasterSid: data?.CurrencyMasterSid || null,
        CurrencyCode: data.CurrencyCode || '',
        ExchangeRate: toNumber(data.ExchangeRate),
        GST_VAT: data.GST_VAT || '',
        InvoiceType: data.InvoiceType || null,
        CreditNoteReason: data.CreditNoteReason || '',
        GSTType: data.GSTType || null,
        Narration: data.Narration || '',
        Remarks: data.Remarks || '',
        MBLNo: data.MasterNumber,
        Status: data.Status,
        JobOrNonJob: data.CashOrBank === 'Y' ? true : false,
        Salesman : data.Salesman || "",

        PostedOn: data.PostDate ? new Date(data?.PostDate) : null,
        BillNo: data.DocumentNumber,
        BillDate: data.DocumentDate ? new Date(data.DocumentDate) : null,
        BillAmt: data.Amount || 0,
        HouseJobSid: data.HouseJobSid,
      },
      { emitEvent: false },
    );

    this.vendorCreditNoteForm.get('VoucherDate')?.disable();
    this.vendorCreditNoteForm.get('ReversalVoucher')?.disable();

    const detailsFromResp = data.VoucherDetail || [];
    this.details.clear();
    let index = 0;
    for (const det of detailsFromResp) {
      this.details.push(
        this.createDetailGroup({
          VoucherDetailSid: det.VoucherDetailSid,
          Sno: det.Sno || index + 1,
          LedgerMasterSid: det.LedgerMasterSid,
          COAMasterSid: det.COAMasterSid || null,
          ChargeMasterSid: det.ChargeMasterSid,
          ChargeDescription: det.ChargeDescription,
          HSSACMasterSid: det.HSSACMasterSid,
          ChargeUOMSid: det.ChargeUOMSid,
          NumberOfUnit: toNumber(det.NumberOfUnit),
          DrCr: det.DrCr,
          CurrencyMasterSid: det.CurrencyMasterSid,
          CurrencyCode: det.CurrencyCode,
          ExchangeRate: toNumber(det.ExchangeRate),
          Rate: toNumber(det.Rate),
          Amount: toNumber(det.Amount),
          TaxableAmount: toNumber(det.TaxableAmount),
          TaxPercentage1: toNumber(det.TaxPercentage1),
          TaxAmount1: toNumber(det.TaxAmount1),
          TaxPercentage2: toNumber(det.TaxPercentage2),
          TaxAmount2: toNumber(det.TaxAmount2),
          LocalAmount: toNumber(det.LocalAmount),
          MasterJobSid: det.MasterJobSid,
          HouseJobSid: det.HouseJobSid,
          DepartmentMasterSid: det.DepartmentMasterSid,
          Remarks: det.Remarks,
          PartyAmount: det.PartyAmount,
          IsAutoGenerated: det.IsAutoGenerated,
          BookingRatesSid : det.BookingRatesSid,
          CostRevenueChargesSid: det.CostRevenueChargeSid,
          SourceDetailSid : det.SourceDetailSid,
        }),
      );
      this.fetchHSN(this.details.length - 1, false);
      if (det.CurrencyMasterSid === this.currentCompany.CurrencyMasterSid) {
        this.details
          .at(this.details.length - 1)
          .get('ExchangeRate')
          ?.disable();
      }
      if (det.MasterJobSid) {
        this.onDetailMasterJobSelected(
          {
            MasterJobSid: det.MasterJobSid,
            DepartmentMasterSid: det.DepartmentMasterSid || null,
          },
          index,
        );
      }
      if (this.isNonJob) {
        if (det.COAMasterSid) {
          const selectedCOA = this.coaList.find(
            (coa) => coa.COAMasterSid === det.COAMasterSid,
          );
          if (selectedCOA && selectedCOA.SubledgerName === 'Y') {
            this.onCOAChange(selectedCOA, index, false);
          }
        }
        // In non-job mode, only Rate is editable (same as job mode)
        this.details.at(index).get('COAMasterSid')?.disable({ emitEvent: false });
        this.details.at(index).get('LedgerMasterSid')?.disable({ emitEvent: false });
      }
      index++;
    }

    // Populate others
    if (data.VoucherOthers && data.VoucherOthers.length > 0) {
      const others = data.VoucherOthers[0];
      this.vendorCreditNoteForm.get('voucherOthers')?.patchValue({
        ContainerNumber: others.ContainerNumber || '',
        VoucherNote: others.VoucherNote || '',
        Footer: others.Footer || '',
      });
    }

    // Set up party context for tax calculation on subsequent changes
    const vendor = this.vendorList.find(
      (v) => v.SubledgerMasterSid === data.PartyMasterSid
    );
    this.taxCalculationService.updateParty(
      {
        countryCode: vendor?.countryMaster?.countryCode || this.currentCompanyCountryCode,
        stateName: data.PlaceOfSupply || '',
        stateMasterSid: data.customerBranch?.stateMaster?.StateMasterSid,
        gstNumber: data.GST_VAT || '',
        customerGstType: data.customerBranch?.CustomerGstType || 'Regular',
        isUnionTerritory: data.customerBranch?.stateMaster?.IsUnionTerritory === 'Y',
      },
      data.InvoiceType as any
    );

    this.spinner.hide();
  }

  checkVoucherPostingMechanism() {
    const companyId = this.currentCompany?.CompanyMasterSid;
    const branchId = this.currentBranch?.BranchMasterSid;
    const menuName = 'Vendor Credit Note';
    if (!companyId || !branchId || !menuName) {
      return;
    }
    this.operationService
      .checkVoucherPostingMechanism({
        CompanyMasterSid: companyId,
        BranchMasterSid: branchId,
        MenuName: menuName,
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

  addDetailRow() {
    const missingErrors: string[] = [];

    const currency = this.vendorCreditNoteForm.get('CurrencyCode')?.value;
    const customerBranch =
      this.vendorCreditNoteForm.get('CustomerBranchSid')?.value;

    if (!customerBranch) {
      missingErrors.push('• Please select Customer Branch from the dropdown.');
      this.vendorCreditNoteForm.get('CustomerBranchSid')?.markAsTouched();
    }

    if (!currency) {
      missingErrors.push('• Please select Currency from the dropdown.');
      this.vendorCreditNoteForm.get('CurrencyCode')?.markAsTouched();
    }

    if (missingErrors.length > 0) {
      if (missingErrors.length === 1) {
        this.appSettingService.showWarning(missingErrors[0]);
        return;
      }
      this.appSettingService.showWarning(
        `Please fill all required fields:\n\n${missingErrors.join('\n')}`,
      );
      return;
    }

    // All validations passed
    this.details.push(this.createDetailGroup());
    this.onDetailChange(this.details.length - 1, 'CurrencyCode');
    this.vendorCreditNoteForm.updateValueAndValidity();
  }

  createDetailGroup(data?: any): FormGroup {
    const group = this.fb.group({
      VoucherDetailSid: [data?.VoucherDetailSid || null],
      ChargeMasterSid: [
        { value: data?.ChargeMasterSid || null, disabled: true },
      ],
      ChargeDescription: [
        { value: data?.ChargeDescription || '', disabled: true },
      ],
      HSSACMasterSid: [{ value: data?.HSSACMasterSid || null, disabled: true }],
      ChargeUOMSid: [{ value: data?.ChargeUOMSid || null, disabled: true }],
      NumberOfUnit: [{ value: data?.NumberOfUnit || 1, disabled: true }],
      DrCr: [{ value: data?.DrCr || 'D', disabled: true }],
      CurrencyMasterSid: [
        data?.CurrencyMasterSid ||
          this.vendorCreditNoteForm.get('CurrencyMasterSid')?.value ||
          null,
      ],
      CurrencyCode: [
        {
          value:
            data?.CurrencyCode ||
            this.vendorCreditNoteForm.get('CurrencyCode')?.value ||
            null,
          disabled: true,
        },
      ],
      Rate: [
        data?.Rate != null ? Number(data.Rate) : 0,
        [Validators.required, Validators.min(0), this.rateCompareValidator.bind(this)],
      ],
      ExchangeRate: [
        {
          value:
            data?.ExchangeRate ||
            this.vendorCreditNoteForm.get('ExchangeRate')?.value ||
            1,
          disabled: true,
        },
      ],
      Amount: [{ value: data?.Amount || 0, disabled: true }],
      TaxableAmount: [{ value: data?.TaxableAmount || 0, disabled: true }],
      TaxPercentage1: [{ value: data?.TaxPercentage1 || 0, disabled: true }],
      TaxAmount1: [{ value: data?.TaxAmount1 || 0, disabled: true }],
      TaxPercentage2: [{ value: data?.TaxPercentage2 || 0, disabled: true }],
      TaxAmount2: [{ value: data?.TaxAmount2 || 0, disabled: true }],
      LocalAmount: [data?.LocalAmount || 0],
      PartyAmount: [data?.PartyAmount || 0],
      MasterJobSid: [{ value: data?.MasterJobSid || null, disabled: true }],
      HouseJobSid: [{ value: data?.HouseJobSid || null, disabled: true }],
      DepartmentMasterSid: [
        { value: data?.DepartmentMasterSid || null, disabled: true },
      ],
      LedgerMasterSid: [{ value: data?.LedgerMasterSid || null, disabled: this.isNonJob }],
      COAMasterSid: [{ value: data?.COAMasterSid || null, disabled: this.isNonJob }],
      IsAutoGenerated: [data?.IsAutoGenerated === 'Y' || false],
      SourceDetailSid : [data?.SourceDetailSid || null],

      // Vendor Credit Note Specific
      BookingRatesSid : [data?.BookingRatesSid || null],
      CostRevenueChargesSid: [data?.CostRevenueChargesSid || null],
    });
    // this.disableControlsIfVoucherExists(group);
    return group;
  }

  rateCompareValidator(control: AbstractControl): ValidationErrors | null {
    if (!control || control.value == null) return null;

    const rate = Number(control.value);
    const group = control.parent as FormGroup;
    if (!group) return null;

    const sourceDetailSid = group.get('SourceDetailSid')?.value;
    if (!sourceDetailSid) return null;

    const original = (this.originalRateList.get(sourceDetailSid) as rateComparison);
    console.log(this.originalRateList);
    console.log(`original amount for source : ${sourceDetailSid}`, original);
    console.log(`current amount for source : ${sourceDetailSid}`, rate);
    console.log("result",toNumber(rate) > original.Rate);
    if (!original) return null;

    if (toNumber(rate) > original.Rate) {
      return { rateExceeded: true };
    }

    return null;
  }

  // private disableControlsIfVoucherExists(group: FormGroup): void {
  //   const voucherDetailSid = group.get('VoucherDetailSid')?.value;

  //   console.log(
  //     'Cost Revenue Charges Sid',
  //     group.get('CostRevenueChargesSid')?.value,
  //   );
  //   let fullDisabled = false;
  //   if (group.get('CostRevenueChargesSid')?.value) {
  //     Object.keys(group.controls).forEach((controlName) => {
  //       group.get(controlName)?.disable({ emitEvent: false });
  //     });
  //     fullDisabled = true;
  //   }

  //   if (!voucherDetailSid || fullDisabled) {
  //     return;
  //   }

  //   const allowedControls = ['Rate', 'ExchangeRate', 'HSSACMasterSid'];

  //   Object.keys(group.controls).forEach((controlName) => {
  //     if (!allowedControls.includes(controlName)) {
  //       group.get(controlName)?.disable({ emitEvent: false });
  //     }
  //   });
  // }

  private getRowIndexFromControl(control: AbstractControl): number {
    if (!this.details) return -1;

    for (let i = 0; i < this.details.length; i++) {
      const row = this.details.at(i);
      if (row.get('Rate') === control) {
        return i;
      }
    }
    return -1;
  }

  removeDetailRow(index: number) {
    if (this.details.length > index) this.details.removeAt(index);
    this.vendorCreditNoteForm.updateValueAndValidity();
    this.recalculateAllRows();
  }

  onDetailChange(index: number, field?: string) {
    if (this.isPosted) {
      return;
    }

    if (
      [
        'NumberOfUnit',
        'Rate',
        'ExchangeRate',
        'TaxPercentage1',
        'TaxPercentage2',
        'CurrencyCode',
      ].includes(field || '')
    ) {
      if (field === 'CurrencyCode') {
        const formGroup = this.details.at(index) as FormGroup;
        const fromCurrencyCode = formGroup.get('CurrencyCode')?.getRawValue();
        const selectedCurrency = this.currencyList.find(
          (x) => x.currencyCode === fromCurrencyCode,
        );
        formGroup
          .get('CurrencyMasterSid')
          .setValue(selectedCurrency?.CurrencyMasterSid);
        let toCurrencyCode = this.currentCompanyCurrency.code;
        this.patchExchangeRateForDetail(
          fromCurrencyCode,
          toCurrencyCode,
          index,
        );
      } else {
        this.recalcRow(index);
      }
    } else if (field === 'ChargeMasterSid') {
      const chargeSid = this.details.at(index).get('ChargeMasterSid')?.value;
      const selectedCharge = this.chargeList?.find(
        (c: any) => c.ChargeMasterSid === chargeSid,
      );

      if (!chargeSid || !selectedCharge) {
        this.hssacList[index] = [];
        this.details.at(index).patchValue(
          {
            ChargeDescription: '',
            HSSACMasterSid: null,
            ChargeUOMSid: null,
            LedgerMasterSid: null,
            COAMasterSid: null,
          },
          { emitEvent: false },
        );
      }
      this.fetchHSN(index, true);
      let hssacId: number | null = null;

      if (
        !hssacId &&
        Array.isArray(selectedCharge.ChargeTaxMaster) &&
        selectedCharge.ChargeTaxMaster.length > 0
      ) {
        const firstTax = selectedCharge.ChargeTaxMaster[0];
        const hsnCode = firstTax?.HSNCode;
        if (hsnCode) {
          const matchingHssac = (this.hssacList[index] || []).find(
            (h) => h.HSSACCode === hsnCode || h.HSNCode === hsnCode,
          );
          if (matchingHssac) {
            hssacId = matchingHssac?.HSSACMasterSid;
          }
        }
      }

      // Auto-set LedgerMasterSid and COAMasterSid

      this.details.at(index).patchValue({
        ChargeDescription: selectedCharge.chargeName || '',
        HSSACMasterSid: hssacId || null,
        ChargeUOMSid: selectedCharge?.UOM || null,
        LedgerMasterSid: selectedCharge?.SubledgerMasterSid || null,
        COAMasterSid: selectedCharge?.DrCOAMappedId || null,
      });

      // Trigger tax calculation when charge changes
      this.onCOAChange({ COAMasterSid: selectedCharge?.DrCOAMappedId }, index);
      this.recalcRow(index);
    }
  }

  private recalcRow(index: number) {
    const row = this.details.at(index);
    if (!row) return;
    if (this.isPosted) return;

    const rawValue = row.getRawValue();
    const unit = toNumber(rawValue.NumberOfUnit);
    const rate = toNumber(
      this.getFormattedAmount(rawValue.Rate || 0, rawValue.CurrencyMasterSid)
    );
    const exRate = toNumber(
      this.getFormattedExchangeRate(rawValue.ExchangeRate || 0, rawValue.CurrencyMasterSid)
    );

    const amount = unit * rate;
    const taxableAmount = amount * exRate;
    const localAmount = amount * exRate;

    // Synchronous tax calculation via preloaded TaxMasters
    const HSSACMasterSid = row.get('HSSACMasterSid')?.value;
    const hssacListItems = this.isNonJob
      ? this.hssacListForNonJob || []
      : this.hssacList[index] || [];
    const hssacItem = hssacListItems.find((c: any) => c.HSSACMasterSid === HSSACMasterSid);
    const taxResult = this.taxCalculationService.calculateRowTax({
      taxableAmount,
      taxGroupSid: hssacItem?.TaxGroupSid,
    });

    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    row.get('Amount')?.setValue(this.getFormattedAmount(amount, companyCurrency));
    row.get('TaxableAmount')?.setValue(this.getFormattedAmount(taxableAmount, companyCurrency));
    row.get('TaxPercentage1')?.setValue(taxResult.TaxPercentage1);
    row.get('TaxAmount1')?.setValue(
      toNumber(this.getFormattedAmount(taxResult.TaxAmount1, companyCurrency))
    );
    row.get('TaxPercentage2')?.setValue(taxResult.TaxPercentage2);
    row.get('TaxAmount2')?.setValue(
      toNumber(this.getFormattedAmount(taxResult.TaxAmount2, companyCurrency))
    );
    row.get('LocalAmount')?.setValue(this.getFormattedAmount(localAmount, companyCurrency));
    row.get('PartyAmount')?.setValue(this.getPartyAmount(index));

    this.updateBillAmount();
    this.vendorCreditNoteForm.updateValueAndValidity();
  }

  updateBillAmount() {
    const headerCurrency = this.vendorCreditNoteForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    const totalBillAmount =
      toNumber(this.getPartyCurrCreditAmt()) -
      toNumber(this.getPartyCurrDebitAmt());
    this.vendorCreditNoteForm
      .get('BillAmt')
      ?.setValue(this.getFormattedAmount(totalBillAmount, headerCurrency));
  }

  calculateTotalBillAmount(): number {
    const partyId = this.vendorCreditNoteForm
      .get('PartyMasterSid')
      ?.getRawValue();
    return this.details
      .getRawValue()
      .filter((det) => det.LedgerMasterSid !== partyId)
      .reduce((sum, row: any) => {
        if (row.DrCr === 'C') {
          return sum + (Number(row.PartyAmount) || 0);
        }
        return sum - (Number(row.PartyAmount) || 0);
      }, 0);
  }

  recalculateAllRows() {
    if (this.isPosted) return;
    for (let i = 0; i < this.details.length; i++) {
      const exRateCtrl = this.details.at(i).get('ExchangeRate');
      if (
        exRateCtrl &&
        (exRateCtrl.value === null || exRateCtrl.value === undefined)
      ) {
        exRateCtrl.setValue(
          this.vendorCreditNoteForm.get('ExchangeRate')?.value || 1,
        );
      }
      this.recalcRow(i);
    }
  }

  getTotalCurrencyAmount(): number {
    let total = 0;
    for (let i = 0; i < this.details.length; i++) {
      const amount = Number(this.details.at(i).get('PartyAmount')?.value || 0);
      total += amount;
    }
    return toNumber(total.toFixed(2));
  }

  getTotalTaxAmount() {
    let total = 0;
    for (let i = 0; i < this.details.length; i++) {
      const taxAmt1 = Number(this.details.at(i).get('TaxAmount1')?.value || 0);
      const taxAmt2 = Number(this.details.at(i).get('TaxAmount2')?.value || 0);
      const drCr = this.details.at(i).get('DrCr')?.value;
      if(drCr === 'C') {
        total += taxAmt1 + taxAmt2;
      } else {
        total -= taxAmt1 + taxAmt2;
      }
    }
    return this.getFormattedAmount(
      total,
      this.currentCompany?.CurrencyMasterSid,
    );
  }

  onDetailMasterJobSelected(masterJob: any, detailIndex: number) {
    const row = this.details.at(detailIndex) as FormGroup;
    if (!masterJob) {
      this.houseJobList[detailIndex] = [];
      row.get('HouseJobSid')?.setValue(null);
      row.get('DepartmentMasterSid')?.setValue(null);
      return;
    }
    row.get('DepartmentMasterSid')?.setValue(masterJob.DepartmentMasterSid);

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MasterJobSid: masterJob.MasterJobSid,
    };
    this.operationService.getHouseJobByMasterJob(payload).subscribe({
      next: (resp: any) => {
        if (resp) {
          this.houseJobList[detailIndex] = resp;
        } else {
          this.houseJobList[detailIndex] = [];
        }
      },
      error: (err: any) => {
        console.error('Error fetching houseJobList', err);
        this.houseJobList[detailIndex] = [];
      },
    });
  }

  applyMasterJobToAllDetails(masterJobSid: number | null) {
    if (!masterJobSid) return;
    for (let i = 0; i < this.details.length; i++) {
      const grp = this.details.at(i);
      if (grp) grp.get('MasterJobSid')?.setValue(masterJobSid);
    }
  }

  fetchHSN(index: number, patch: boolean = false) {
    const row = this.details.at(index) as FormGroup;
    const ChargeMasterSid = row.get('ChargeMasterSid').value;
    const chargeName = this.chargeList.find(
      (c: any) => c.ChargeMasterSid === ChargeMasterSid,
    )?.chargeName;
    if (ChargeMasterSid) {
      this.operationService.getChargeTaxForChargeId(ChargeMasterSid).subscribe({
        next: (res: any) => {
          if (res.status) {
            this.hssacList[index] = res.data;
            if (patch) {
              this.details.at(index).patchValue({
                HSSACMasterSid: res.data[0]?.HSSACMasterSid || null,
              });
              this.recalcRow(index);
            }
          } else {
            this.appSettingService.showError(
              `Error fetching HSSAC details for ${chargeName}`,
            );
            this.hssacList[index] = null;
          }
        },
        error: (err: any) => {
          this.appSettingService.showError(
            `Error fetching HSSAC details for ${chargeName}`,
          );
          this.hssacList[index] = null;
        },
      });
    }
  }

  onSubmit(resolve?: (value: boolean) => void, isPostingTrue?: boolean) {
    // Validate voucher date is within financial year
    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy) {
      const voucherDate = new Date(this.vendorCreditNoteForm.getRawValue().VoucherDate);
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

    const raw = this.vendorCreditNoteForm.getRawValue();

    const autoPostingButNoPosted = this.isAutoPosting && !this.isPosted;
    if (this.isEditMode && autoPostingButNoPosted) {
      this.appSettingService.showWarning(
        'Auto Posting is currently enabled.\n\nPlease switch to Manual Posting and post this vendor invoice first.\nAfter posting, you can switch back to Auto Posting.',
      );
      if (resolve) resolve(false);
      return;
    }

    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.vendorCreditNoteForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    const actualLocalAmount = toNumber(this.getTotalLocalCredits()) + toNumber(this.getTotalTaxAmount()) - toNumber(this.getTotalLocalDebits());
    const headerCurrency = this.vendorCreditNoteForm.get('CurrencyMasterSid')?.getRawValue();
    const headerExRate = this.vendorCreditNoteForm.get('ExchangeRate')?.getRawValue();
    const actualPartyAmount = toNumber(this.getFormattedAmount((toNumber(actualLocalAmount) / toNumber(headerExRate)), headerCurrency));
    const actualMatchedAmount = toNumber(this.getFormattedAmount(actualPartyAmount, this.currentCompany?.CurrencyMasterSid));
    if (actualMatchedAmount > this.invoiceOutstandingAmount) {

      const matched = actualMatchedAmount.toFixed(2);
      const outstanding = this.invoiceOutstandingAmount.toFixed(2);

      this.appSettingService.showWarning(
        `Entered Amount (${matched}) exceeds the Outstanding Amount (${outstanding}). 
     Please enter an amount less than or equal to the outstanding balance.`
      );

      if (resolve) resolve(false);
      return;
    } else if (actualMatchedAmount === this.invoiceOutstandingAmount) {
      const totalMatchedLocalAmount = toNumber(this.getTotalLocalCredits()) - toNumber(this.getTotalLocalDebits());
      const osLocalAmount = toNumber(this.invoiceOutstandingLocalAmount);
      if (totalMatchedLocalAmount > osLocalAmount) {
        const matched = totalMatchedLocalAmount.toFixed(2);
        const outstanding = osLocalAmount.toFixed(2);

        this.appSettingService.showWarning(
          `Entered Local Amount (${matched}) exceeds the Outstanding Local Amount (${outstanding}). 
     Please enter an amount less than or equal to the outstanding local balance.`
        );

        if (resolve) resolve(false);
        return;
      }
    }

    // Enhanced exchange rate validation - checks all three error types
    if (this.vendorCreditNoteForm.errors) {
      const hasExchangeRateError =
        this.vendorCreditNoteForm.errors['inconsistentExchangeRates'] ||
        this.vendorCreditNoteForm.errors['foreignCurrencyRateOne'] ||
        this.vendorCreditNoteForm.errors['exchangeRateZero'];

      if (hasExchangeRateError) {
        const errorMsg = getExchangeRateErrorMessage(
          this.vendorCreditNoteForm,
          this.currencyList,
        );
        this.appSettingService.showError(errorMsg);
        if (resolve) resolve(false);
        return;
      }
    }

    // ---- Rate exceeded validation (DETAIL LEVEL with messages) ----
    const rateErrorMessages: string[] = [];

    this.details.controls.forEach((row: FormGroup, index: number) => {
      const rateControl = row.get('Rate');
      if (!rateControl || !rateControl.hasError('rateExceeded')) return;

      const sourceDetailSid = row.get('SourceDetailSid')?.value;
      const original = this.originalRateList.get(sourceDetailSid);

      if (original) {
        rateErrorMessages.push(
          `Row ${index + 1}: Rate should not exceed ${(toNumber(original.Rate)).toFixed(2)}`
        );
      }
    });

    if (rateErrorMessages.length > 0) {
      this.appSettingService.showWarning(rateErrorMessages.join('\n'));
      this.details.markAllAsTouched();
      if (resolve) resolve(false);
      return;
    }


    if (this.vendorCreditNoteForm.invalid) {
      errorLogger(this.vendorCreditNoteForm);
      this.vendorCreditNoteForm.markAllAsTouched();
      this.vendorCreditNoteForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields.');
      if (resolve) resolve(false);
      return;
    }

    if (this.details.length === 0) {
      this.appSettingService.showError('Please add at least one detail row');
      return;
    }

    const payload = this.preparePayload();
    this.isSaving = true;
    this.spinner.show();

    if (this.isEditMode && this.headerId) {
      this.operationService
        .updateVendorCreditNoteById(this.headerId, payload)
        .subscribe({
          next: async (resp: any) => {
            this.isSaving = false;
            if (resp.status) {
              this.isDirty = false;
              if (isPostingTrue) {
                await this.postVoucher();
              } else {
                this.appSettingService.showSuccess(resp.message);
                this.spinner.hide();
              }
              if (resolve) resolve(true);
              this.loadVendorCreditNoteById(this.headerId);
            } else {
              this.appSettingService.showError(resp.message);
              if (resolve) resolve(false);
              this.spinner.hide();
            }
          },
          error: (error) => {
            this.appSettingService.showError('Error updating Vendor Invoice');
            this.isSaving = false;
            if (resolve) resolve(false);
            this.spinner.hide();
          },
        });
    } else {
      // Create new vendor invoice
      this.operationService.createVendorCreditNote(payload).subscribe({
        next: async (resp: any) => {
          this.isSaving = false;
          if (resp.status) {
            this.isDirty = false;
            this.headerId = resp?.data?.VoucherHeaderSid;
            // if (isPostingTrue) {
            //   await this.postVoucher();
            // } else {
              this.appSettingService.showSuccess(resp.message);
              this.spinner.hide();
            // }
            if (resolve) resolve(true);
            if (this.headerId) {
              this.router.navigate(
                ['operation/vendor-credit-note/entry', this.headerId],
                {
                  queryParams: {
                    ...(this.isNonJob ? { isNonJob: this.isNonJob } : {}),
                  },
                },
              );
            }
          } else {
            this.appSettingService.showError(resp.message);
            if (resolve) resolve(false);
            this.spinner.hide();
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.appSettingService.showError('Error creating Vendor Invoice');
          if (resolve) resolve(false);
          this.spinner.hide();
        },
      });
    }
  }

  async postVoucher(notFromSubmit: boolean = false): Promise<void> {
    try {
      this.spinner.show();
      const voucherHeaderSid = this.headerId;
      const currentCompany = this.currentCompany;
      const currentBranch = this.currentBranch;
      const currentFinancialYear = toNumber(
        localStorage.getItem('current-year-id'),
      );

      const currentCompanyCountry = toNumber(
        this.currentCompany?.CountryMasterSid,
      );
      const currentCompanyState = toNumber(this.currentBranch?.StateMasterSid);
      const currentCurrency = toNumber(this.currentCompany?.CurrencyMasterSid);
      const customerBranchFromForm = toNumber(
        this.vendorCreditNoteForm.get('CustomerBranchSid')?.value,
      );
      const customerState = this.vendorBranchList.find(
        (c) => c.CustomerBranchSid === customerBranchFromForm,
      )?.StateMasterSid;
      let interOrIntra = 'Intra';
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
      // Union territory uses same TaxCategory as same-state (Intra)
      if (this.taxCalculationService.context?.appliedTaxMode === 'CGST_UGST') {
        interOrIntra = 'Intra';
      }
      // SEZ/Export with payment uses IGST regardless of state match
      if (this.taxCalculationService.context?.appliedTaxMode === 'IGST' && this.taxCalculationService.isExportOrSEZ) {
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
          'Company, branch, or financial year or country information is missing',
        );
      }

      const postPayload = {
        VoucherHeaderSid: voucherHeaderSid,
        CompanyMasterSid: currentCompany.CompanyMasterSid,
        BranchMasterSid: currentBranch.BranchMasterSid,
        YearMasterSid: currentFinancialYear,
        LocalCurrencyMasterSid: currentCurrency,
        LocalCurrencyCode: this.currentCompanyCurrency.code,
        PostedBy: this.userData?.userEmail,
        current_date : getDefaultTodayDate(),
        TaxDetails: {
          CountryMasterSid: currentCompanyCountry,
          countryCode: this.currentCompanyCountryCode,
          TaxCategory: interOrIntra,
          EffectiveFrom:
            this.vendorCreditNoteForm.get('VoucherDate')?.getRawValue() ??
            new Date().toISOString(),
          TaxType: 'Input',
          IsUnionTerritory: this.taxCalculationService.context?.appliedTaxMode === 'CGST_UGST',
          CustomerGstType: this.taxCalculationService.context?.party?.customerGstType || '',
        },
      };

      const result = await firstValueFrom(
        this.operationService.postVoucherByVoucherSid(postPayload),
      );
      this.spinner.hide();
      if (result.status) {
        this.appSettingService.showSuccess(result.message);
        if (notFromSubmit) {
          this.loadVendorCreditNoteById(this.headerId);
        }
      } else {
        this.appSettingService.showError(result.message);
      }
    } catch (error) {
      console.error('Post voucher error:', error);
      return null;
    }
  }

  get isPosted(): boolean {
    return this.vendorCreditNoteData?.PostStatus === 'P' || false;
  }

  get isReadOnly(): boolean {
    if(!this.isEditMode) return false;
    return this.vendorCreditNoteData?.PostStatus !== 'U' || this.vendorCreditNoteData?.Status !== 'A';
  }

  // Check if voucher is draft
  get isDraft(): boolean {
    return (
      !this.vendorCreditNoteData?.PostStatus ||
      this.vendorCreditNoteData?.PostStatus === 'U'
    );
  }

  onReset() {
    this.minVoucherDate = null;
    this.isNonJob = false;
    this.invoiceOutstandingAmount = null;
    if (this.isEditMode) {
      this.patchValues(this.vendorCreditNoteData);
    } else {
      this.initForm();
      this.details.clear();
    }
  }

  goBack() {
    this.router.navigate(['operation/vendor-credit-note/list']);
  }

  private getCustomerCountryCode(vendor: any): string {
    return (
      String(vendor?.countryMaster?.countryCode).trim().toLowerCase() || ''
    );
  }

  preparePayload(): any {
    const formValue = this.vendorCreditNoteForm.getRawValue();
    const YearMasterSid = Number(localStorage.getItem('current-year-id'));

    const derivedNarration = `${formValue.BillNo} ${this.datePipe.transform(formValue.BillDate)}  ${formValue.Narration}`;
    // Add details with CostRevenueChargesSid and job IDs
    
    const allDetails = formValue.voucherDetails || [];
    const voucherDetailArray = allDetails.map(
      (detail: any, index: number) => {
        let finalRate = toNumber(detail.Rate);
        let finalAmount = toNumber(detail.Amount);
        let finalTaxableAmount = toNumber(detail.TaxableAmount);
        let finalTaxAmount1 = toNumber(detail.TaxAmount1);
        let finalTaxAmount2 = toNumber(detail.TaxAmount2);
        let finalLocalAmount = toNumber(detail.LocalAmount);
        let finalPartyAmount = toNumber(detail.PartyAmount);
        if(detail.SourceDetailSid) {
          const originalRateComparison : rateComparison = this.originalRateList.get(detail.SourceDetailSid);
          if(originalRateComparison && finalRate === originalRateComparison.Rate) {
            finalAmount = Math.abs(originalRateComparison.Amount - finalAmount) <= 0.01 ? originalRateComparison.Amount : finalAmount;
            finalTaxableAmount = Math.abs(originalRateComparison.TaxableAmount - finalTaxableAmount) <= 0.01 ? originalRateComparison.TaxableAmount : finalTaxableAmount;
            finalTaxAmount1 = Math.abs(originalRateComparison.TaxAmount1 - finalTaxAmount1) <= 0.01 ? originalRateComparison.TaxAmount1 : finalTaxAmount1;
            finalTaxAmount2 = Math.abs(originalRateComparison.TaxAmount2 - finalTaxAmount2) <= 0.01 ? originalRateComparison.TaxAmount2 : finalTaxAmount2;
            finalLocalAmount = Math.abs(originalRateComparison.LocalAmount - finalLocalAmount) <= 0.01 ? originalRateComparison.LocalAmount : finalLocalAmount;
            finalPartyAmount = Math.abs(originalRateComparison.PartyAmount - finalPartyAmount) <= 0.01 ? originalRateComparison.PartyAmount : finalPartyAmount;
          }
        }
        return {
          VoucherDetailSid: detail.VoucherDetailSid
            ? Number(detail.VoucherDetailSid)
            : null,
          ChargeMasterSid: detail.ChargeMasterSid ?? null,
          ChargeDescription: detail.ChargeDescription || '',
          HSSACMasterSid: detail.HSSACMasterSid
            ? Number(detail.HSSACMasterSid)
            : null,
          LedgerMasterSid: detail.LedgerMasterSid ?? null,
          COAMasterSid: detail.COAMasterSid ?? null,
          ChargeUOMSid: detail.ChargeUOMSid ?? null,
          DepartmentMasterSid: detail.DepartmentMasterSid ?? null,
          NumberOfUnit: toNumber(detail.NumberOfUnit),
          CostRevenue: detail.DrCr === 'D' ? 'Revenue' : 'Cost',
          DrCr: detail.DrCr,
          CurrencyCode: detail.CurrencyCode,
          CurrencyMasterSid: detail.CurrencyMasterSid,
          Sno: index + 1,
          Rate: finalRate,
          ExchangeRate: toNumber(detail.ExchangeRate),
          Amount: finalAmount,
          TaxableAmount: finalTaxableAmount,
          TaxPercentage1: toNumber(detail.TaxPercentage1),
          TaxAmount1: finalTaxAmount1,
          TaxPercentage2: toNumber(detail.TaxPercentage2),
          TaxAmount2: finalTaxAmount2,
          LocalAmount: finalLocalAmount,
          PartyAmount: finalPartyAmount,
          MasterJobSid: detail.MasterJobSid ?? null,
          HouseJobSid: detail.HouseJobSid ?? null,
          YearMasterSid: YearMasterSid,
          Narration: formValue.Narration,
          BookingRatesSid : detail.BookingRatesSid,
          CostRevenueChargesSid: detail.CostRevenueChargesSid || null,
          SourceDetailSid : detail.SourceDetailSid || null,
        };
      },
    );

    const fullyMatched = Array.from(this.originalRateList.entries()).every(
      ([sourceDetailSid, original]) => {

        console.log('--- Checking SourceDetailSid:', sourceDetailSid);
        console.log('Original value:', original);

        const found = voucherDetailArray.find(
          d => d.SourceDetailSid === sourceDetailSid
        );

        if (!found) {
          const partyAmountCheck = Math.abs(original.PartyAmount) <= 0.01;

          console.log(
            'No matching voucher detail found.',
            'PartyAmount:', original.PartyAmount,
            'Within tolerance:', partyAmountCheck
          );

          return partyAmountCheck;
        }

        console.log('Found voucher detail:', found);

        const rateMatched =
          Math.abs(original.Rate - found.Rate) <= 0.0001;

        const partyAmountMatched =
          Math.abs(original.PartyAmount - found.PartyAmount) <= 0.01;

        console.log('Rate comparison:', {
          originalRate: original.Rate,
          foundRate: found.Rate,
          rateMatched
        });

        console.log('PartyAmount comparison:', {
          originalPartyAmount: original.PartyAmount,
          foundPartyAmount: found.PartyAmount,
          partyAmountMatched
        });

        return rateMatched && partyAmountMatched;
      }
    );

    console.log('Final fullyMatched result:', fullyMatched);

    const totalBillAmount =
      toNumber(this.getPartyCurrCreditAmt()) -
      toNumber(this.getPartyCurrDebitAmt());
    const payload: any = {
      ...(this.isEditMode
        ? { UpdatedBy: this.currUserEmail }
        : { CreatedBy: this.currUserEmail }),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherDate: formValue.VoucherDate
        ? new Date(formValue.VoucherDate)
        : null,
      GST_VAT: formValue.GST_VAT,
      PartyMasterSid: formValue.PartyMasterSid ?? null,
      DepartmentMasterSid: formValue.DepartmentMasterSid || null,
      PartyName: formValue.PartyName,
      PartyAddress: formValue.PartyAddress,
      CustomerBranchSid: formValue.CustomerBranchSid,
      PlaceOfSupply: formValue.PlaceOfSupply,
      COAMasterSid: formValue.COAMasterSid ?? null,
      InvoiceType: formValue.InvoiceType || 'REG',
      GSTType: formValue.GSTType,
      State: this.taxCalculationService.context?.taxCategory || 'Inter',
      CurrencyMasterSid: formValue.CurrencyMasterSid ?? null,
      PostStatus: formValue.PostStatus || 'U',
      CurrencyCode: formValue.CurrencyCode ?? null,
      ExchangeRate: formValue.ExchangeRate
        ? toNumber(formValue.ExchangeRate)
        : 0,
      BookingHeaderSid : formValue.BookingHeaderSid ?? null,
      MasterJobSid: formValue.MasterJobSid,
      HouseJobSid: formValue.HouseJobSid,
      Narration: formValue.Narration,
      Status: String(formValue.Status).charAt(0),
      YearMasterSid: YearMasterSid,
      CashOrBank: this.isNonJob ? 'Y' : 'N',

      BillNo: formValue.BillNo,
      BillDate: formValue.BillDate ? new Date(formValue.BillDate) : null,
      BillAmt: totalBillAmount,
      MBLNo: formValue.MBLNo,
      HBLNo: formValue.HBLNo,
      CreditNoteReason : formValue.CreditNoteReason,
      ReversalVoucher : formValue.ReversalVoucher,
      Salesman : formValue.Salesman,

      VoucherDetail:
        voucherDetailArray.length > 0 ? voucherDetailArray : undefined,
      IsFullyReversed : fullyMatched
    };

    //Posting infomations
    const currentCurrency = toNumber(this.currentCompany?.CurrencyMasterSid);
    const currentCompanyCountry = toNumber(
      this.currentCompany?.CountryMasterSid,
    );
    const currentCompanyState = toNumber(this.currentBranch?.StateMasterSid);
    const customerBranchFromForm = toNumber(
      this.vendorCreditNoteForm.get('CustomerBranchSid')?.getRawValue(),
    );
    const customerState = this.vendorList.find(
      (c) => c.CustomerBranchSid === customerBranchFromForm,
    )?.stateMaster?.StateMasterSid;

    let interOrIntra = 'Intra';
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
    // Union territory uses same TaxCategory as same-state (Intra)
    if (this.taxCalculationService.context?.appliedTaxMode === 'CGST_UGST') {
      interOrIntra = 'Intra';
    }
    // SEZ/Export with payment uses IGST regardless of state match
    if (this.taxCalculationService.context?.appliedTaxMode === 'IGST' && this.taxCalculationService.isExportOrSEZ) {
      interOrIntra = 'Inter';
    }

    payload.PostingInfo = {
      LocalCurrencyMasterSid : currentCurrency,
      LocalCurrencyCode : this.currentCompanyCurrency.code,
      TaxDetails : {
        CountryMasterSid : currentCompanyCountry,
        countryCode : this.currentCompanyCountryCode,
        TaxCategory : interOrIntra,
        EffectiveFrom : this.vendorCreditNoteForm.get('VoucherDate')?.getRawValue() ?? new Date().toISOString(),
        TaxType : 'Input',
        IsUnionTerritory: this.taxCalculationService.context?.appliedTaxMode === 'CGST_UGST',
      }
    }

    // Add others
    payload.VoucherOthers = {
      ...formValue.voucherOthers,
      Remarks: formValue.Remarks || '',
    };

    return payload;
  }

  getPartyAmount(detailIndex: number) {
    const detail = (this.details.at(detailIndex) as FormGroup)?.getRawValue();
    const voucherHeaderCurrency = this.vendorCreditNoteForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    const voucherHeaderExRate = this.vendorCreditNoteForm
      .get('ExchangeRate')
      ?.getRawValue();
    const chargeCurrencyId = detail?.CurrencyMasterSid;

    if (detail?.IsAutoGenerated) {
      return this.getFormattedAmount(
        toNumber(detail?.PartyAmount),
        chargeCurrencyId,
      );
    }

    // Same currency → no conversion
    if (chargeCurrencyId === voucherHeaderCurrency) {
      return this.getFormattedAmount(
        toNumber(detail?.Amount),
        chargeCurrencyId,
      );
    } else {
      return this.getFormattedAmount(
        toNumber(detail?.LocalAmount) / toNumber(voucherHeaderExRate),
        chargeCurrencyId,
      );
    }
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
    CurrencyMasterSid: number,
  ): number {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid,
    );
    return this.currencyFormatter.formatExchangeRate({
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
    const formattedExchangeRate = this.currencyFormatter.formatExchangeRate({
      value: rate,
      currencyCode: currency?.currencyCode,
    });
    return formattedExchangeRate.toFixed(
      this.getExchangeRateDecimalPlaces(CurrencyMasterSid),
    );
  }

  /**
   * Get the number of decimal places allowed for exchange rates
   * Example: getExchangeRateDecimalPlaces('USD') returns 3
   */
  public getExchangeRateDecimalPlaces(CurrencyMasterSid: number): number {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid,
    );
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(
        currency.currencyCode,
      );
      return config?.exchangeDecimal;
    }
    return 4;
  }

  public getFormattedAmount(
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
    return this.currencyFormatter.formatAmount(input, false);
  }

  public getAmountDecimalPlaces(CurrencyMasterSid: number): number {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid,
    );
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(
        currency.currencyCode,
      );
      return config?.amountDecimal;
    }
    return 4;
  }

  patchExchangeRateForDetail(
    fromCurrencyCode: string,
    toCurrencyCode: string,
    index: number,
  ) {
    const formGroup = this.details.at(index) as FormGroup;
    const fromCurrencyId = this.currencyList.find(
      (c) => c.currencyCode === fromCurrencyCode,
    )?.CurrencyMasterSid;

    if (fromCurrencyCode === toCurrencyCode) {
      formGroup.patchValue({
        ExchangeRate: toNumber(
          this.getFormattedExchangeRate(1, fromCurrencyId),
        ),
      });
      this.recalcRow(index);
      formGroup.get('ExchangeRate')?.disable();
      return;
    }

    const voucherDate =
      this.vendorCreditNoteForm.get('VoucherDate')?.getRawValue() ?? new Date();
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode,
      toCurrencyCode,
      EffectiveFrom: voucherDate ? new Date(voucherDate) : new Date(),
      segment: 'cost',
    };

    this.operationService.getExchangeRate(payload).subscribe({
      next: (response: any) => {
        if (response?.status) {
          const formGroup = this.details.at(index) as FormGroup;
          if (response.data) {
            formGroup.patchValue({
              ExchangeRate: toNumber(
                this.getFormattedExchangeRate(response.data, fromCurrencyId),
              ),
            });
            const key = this.buildExchangeRateMapKey(
              fromCurrencyCode,
              toCurrencyCode,
              voucherDate,
            );
            this.exchangeRateMap.set(key, response.data);
          } else {
            formGroup.patchValue({
              ExchangeRate: toNumber(
                this.getFormattedExchangeRate(0, fromCurrencyId),
              ),
            });
            this.appSettingService.showError(response.message);
          }
          formGroup.get('ExchangeRate')?.enable();
          this.recalcRow(index);
        } else {
          formGroup.patchValue({
            ExchangeRate: toNumber(
              this.getFormattedExchangeRate(0, fromCurrencyId),
            ),
          });
          this.appSettingService.showError(response.message);
          formGroup.get('ExchangeRate')?.enable();
          this.recalcRow(index);
        }
      },
      error: (err) => {
        console.error('Error fetching exchange rate:', err);
        formGroup.get('ExchangeRate')?.enable();
        formGroup.patchValue({
          ExchangeRate: toNumber(
            this.getFormattedExchangeRate(0, fromCurrencyId),
          ),
        });
        this.recalcRow(index);
      },
    });
  }

  getTotalLocalCredits() {
    return this.getFormattedAmount(
      this.details.getRawValue().reduce((sum, dtl: any) => {
        if (dtl.DrCr === 'C') {
          return sum + Number(dtl.LocalAmount);
        }
        return sum;
      }, 0),
      this.currentCompany.CurrencyMasterSid,
    );
  }

  getTotalLocalDebits() {
    return this.getFormattedAmount(
      this.details.getRawValue().reduce((sum, dtl: any) => {
        if (dtl.DrCr === 'D') {
          return sum + Number(dtl.LocalAmount);
        }
        return sum;
      }, 0),
      this.currentCompany.CurrencyMasterSid,
    );
  }

  getNetCrDr() {
    return this.getFormattedAmount(
      toNumber(this.getTotalLocalCredits()) -
        toNumber(this.getTotalLocalDebits()),
      this.currentCompany.CurrencyMasterSid,
    );
  }

  getPartyCurrCreditAmt() {
    const headerCurrency = this.vendorCreditNoteForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    return this.getFormattedAmount(
      this.details.getRawValue().reduce((sum, dtl: any) => {
        if (dtl.DrCr === 'C') {
          return sum + Number(dtl.PartyAmount);
        }
        return sum;
      }, 0),
      headerCurrency,
    );
  }

  getPartyCurrDebitAmt() {
    const headerCurrency = this.vendorCreditNoteForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    return this.getFormattedAmount(
      this.details.getRawValue().reduce((sum, dtl: any) => {
        if (dtl.DrCr === 'D') {
          return sum + Number(dtl.PartyAmount);
        }
        return sum;
      }, 0),
      headerCurrency,
    );
  }

  onCancel() {
    this.router.navigate(['/operation/vendor-credit-note/list']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.vendorCreditNoteForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  setToday(fieldName: string, datepicker: any): void {
    const today = new Date();
    this.vendorCreditNoteForm.get(fieldName)?.setValue(today);
    datepicker.close();
  }

  // Add this new method to fetch exchange rate
  private fetchExchangeRate(
    fromCurrencyCode: string,
    toCurrencyCode: string,
  ): void {
    const voucherDate =
      this.vendorCreditNoteForm.get('VoucherDate')?.getRawValue() ?? new Date();
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode: fromCurrencyCode,
      toCurrencyCode: toCurrencyCode,
      EffectiveFrom: voucherDate ? new Date(voucherDate) : new Date(),
      segment: 'cost',
    };

    if (!fromCurrencyCode || !toCurrencyCode) {
      return;
    }

    const fromCurrencyId = this.currencyList.find(
      (c) => c.currencyCode === fromCurrencyCode,
    )?.CurrencyMasterSid;

    if (fromCurrencyCode === toCurrencyCode) {
      this.vendorCreditNoteForm.patchValue({
        CurrencyMasterSid: fromCurrencyId,
        CurrencyCode: fromCurrencyCode,
        ExchangeRate: this.getFormattedExchangeRate(1, fromCurrencyId),
      });
      this.vendorCreditNoteForm.get('ExchangeRate')?.disable();
      return;
    }

    this.operationService.getExchangeRate(payload).subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          if (resp.data) {
            const exchangeRate = Number(resp.data);
            this.vendorCreditNoteForm.patchValue({
              CurrencyMasterSid: fromCurrencyId,
              CurrencyCode: fromCurrencyCode,
              ExchangeRate: toNumber(
                this.getFormattedExchangeRate(exchangeRate, fromCurrencyId),
              ),
            });
            const key = this.buildExchangeRateMapKey(
              fromCurrencyCode,
              toCurrencyCode,
              voucherDate,
            );
            this.exchangeRateMap.set(key, resp.data);
          } else {
            this.appSettingService.showError(resp.message);
            this.vendorCreditNoteForm.patchValue({
              CurrencyMasterSid: fromCurrencyId,
              CurrencyCode: fromCurrencyCode,
              ExchangeRate: toNumber(
                this.getFormattedExchangeRate(0, fromCurrencyId),
              ),
            });
          }
          this.vendorCreditNoteForm.get('ExchangeRate')?.enable();
          this.recalculateAllRows();
        } else {
          // Response status : false
          this.appSettingService.showError(resp.message);
          this.vendorCreditNoteForm.patchValue({
            CurrencyMasterSid: fromCurrencyId,
            CurrencyCode: fromCurrencyCode,
            ExchangeRate: this.getFormattedExchangeRate(0, fromCurrencyId),
          });
          this.vendorCreditNoteForm.get('ExchangeRate')?.enable();
        }
      },
      error: (err) => {
        console.error('Error fetching exchange rate:', err);
        // Default to 1 if API fails
        this.vendorCreditNoteForm.patchValue({
          CurrencyMasterSid: fromCurrencyId,
          CurrencyCode: fromCurrencyCode,
          ExchangeRate: this.getFormattedExchangeRate(0, fromCurrencyId),
        });
        this.vendorCreditNoteForm.get('ExchangeRate')?.enable();
      },
    });
  }

  onCOAChange(coa: any, detailIndex: number, resetSubledger: boolean = true) {
    const ctrl = this.details.at(detailIndex) as FormGroup;
    // Preserve the selected ledger so it can be restored after the async list loads (patch/edit mode)
    const preservedLedgerSid = !resetSubledger ? ctrl.get('LedgerMasterSid')?.value : null;
    if (resetSubledger) {
      ctrl.get('LedgerMasterSid')?.setValue(null);
      ctrl.get('LedgerMasterSid')?.disable();
    }
    if (!coa) {
      this.subledgerListDetail[detailIndex] = [];
      return;
    }
    if (coa.SubledgerName === 'Y') {
      ctrl.get('LedgerMasterSid')?.enable();
      this.operationService
        .getAllSubledgerByCOA({
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          COAMasterSid: coa.COAMasterSid,
        })
        .subscribe({
          next: (resp: any) => {
            if (resp.status) {
              this.subledgerListDetail[detailIndex] = resp.data || [];
              // Re-apply the preserved ledger value so ng-select can bind to the loaded list
              if (preservedLedgerSid) {
                ctrl.get('LedgerMasterSid')?.setValue(preservedLedgerSid);
              }
            } else {
              this.appSettingService.showError(
                'Error fetching subledger for COA',
              );
            }
          },
          error: (err) => {
            this.subledgerListDetail[detailIndex] = [];
            ctrl.get('LedgerMasterSid')?.setValue(null);
            ctrl.get('LedgerMasterSid')?.disable();
            console.error('Error fetching subledger for COA', err);
          },
        });
    } else {
      ctrl.get('LedgerMasterSid')?.disable();
    }
  }

  private getVendorCountry(): string {
    const customer = this.vendorList.find(
      (c) =>
        c.SubledgerMasterSid ===
        this.vendorCreditNoteForm.get('PartyMasterSid')?.value,
    );
    return customer?.countryMaster?.countryCode || '';
  }

  openEDoc() {
    if (!this.vendorCreditNoteData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.vendorCreditNoteData;
    modalRef.componentInstance.idLabel = 'Vendor Credit Note Id';
    modalRef.componentInstance.idValue = this.vendorCreditNoteData?.headerId;
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: this.headerId,
    };

    this.commonService.documentData.set(data);
  }

  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    const payload = { 
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.headerId
     };

     const openModal = (terms: any[]) => {
      const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true,
          });
          modalRef.componentInstance.terms = terms || [];
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.headerId;
          modalRef.componentInstance.loadAllOnGet = !this.isTermsAndConditionsEnabled;
     };
     if (!this.isTermsAndConditionsEnabled) {
      this.TandCList = [];
      openModal(this.TandCList);
      return;
    }
    this.masterService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          openModal(this.TandCList);
        } else {
          this.appSettingService.showError(
            'Error loading Terms and Conditions',
          );
        }
      },
      (error) => {
        this.appSettingService.showError(
          'Error loading Terms and Conditions',
          error,
        );
      },
    );
  }

  // Authority Method
  openAuthority() {
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.headerId;
  }

  // Email Method
  openEmail() {
    if (!this.vendorCreditNoteData) return;

    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });

    modalRef.componentInstance.item = this.vendorCreditNoteData;
    modalRef.componentInstance.idLabel = 'Vendor Credit Note Id';
    modalRef.componentInstance.idValue =
      this.vendorCreditNoteData?.VoucherHeaderSid;
  }

  openFollowup() {
      const modalRef = this.modalService.open(FollowUpComponent, {
          size: 'lg',
          centered: true,
          backdrop: 'static',
        });
  }

  // Helper methods for tax display logic
  shouldShowCGSTSGST(): boolean {
    return this.taxCalculationService.context?.appliedTaxMode === 'CGST_SGST';
  }

  shouldShowIGST(): boolean {
    return this.taxCalculationService.context?.appliedTaxMode === 'IGST';
  }

  shouldShowVAT(): boolean {
    return this.taxCalculationService.context?.appliedTaxMode === 'VAT';
  }

  getTaxDisplayConfig(): {
    showCGST: boolean;
    showSGST: boolean;
    showUGST: boolean;
    showIGST: boolean;
    showVAT: boolean;
  } {
    return this.taxCalculationService.getTaxDisplayConfig();
  }

  getTaxPercentageForDisplay(detail: any): {
    cgstRate: number;
    sgstRate: number;
    ugstRate: number;
    igstRate: number;
    vatRate: number;
  } {
    const mode = this.taxCalculationService.context?.appliedTaxMode;

    if (mode === 'CGST_SGST') {
      return {
        cgstRate: detail.TaxPercentage1 || 0,
        sgstRate: detail.TaxPercentage2 || 0,
        ugstRate: 0,
        igstRate: 0,
        vatRate: 0,
      };
    } else if (mode === 'CGST_UGST') {
      return {
        cgstRate: detail.TaxPercentage1 || 0,
        sgstRate: 0,
        ugstRate: detail.TaxPercentage2 || 0,
        igstRate: 0,
        vatRate: 0,
      };
    } else if (mode === 'IGST') {
      return {
        cgstRate: 0,
        sgstRate: 0,
        ugstRate: 0,
        igstRate: detail.TaxPercentage1 || 0,
        vatRate: 0,
      };
    } else if (mode === 'VAT') {
      return {
        cgstRate: 0,
        sgstRate: 0,
        ugstRate: 0,
        igstRate: 0,
        vatRate: detail.TaxPercentage1 || 0,
      };
    }

    return {
      cgstRate: detail.TaxPercentage1 || 0,
      sgstRate: detail.TaxPercentage2 || 0,
      ugstRate: 0,
      igstRate: 0,
      vatRate: detail.TaxPercentage1 || 0,
    };
  }

  getTaxAmountForDisplay(detail: any): {
    cgstAmt: number;
    sgstAmt: number;
    ugstAmt: number;
    igstAmt: number;
    vatAmt: number;
  } {
    const mode = this.taxCalculationService.context?.appliedTaxMode;

    if (mode === 'CGST_SGST') {
      return {
        cgstAmt: detail.TaxAmount1 || 0,
        sgstAmt: detail.TaxAmount2 || 0,
        ugstAmt: 0,
        igstAmt: 0,
        vatAmt: 0,
      };
    } else if (mode === 'CGST_UGST') {
      return {
        cgstAmt: detail.TaxAmount1 || 0,
        sgstAmt: 0,
        ugstAmt: detail.TaxAmount2 || 0,
        igstAmt: 0,
        vatAmt: 0,
      };
    } else if (mode === 'IGST') {
      return {
        cgstAmt: 0,
        sgstAmt: 0,
        ugstAmt: 0,
        igstAmt: detail.TaxAmount1 || 0,
        vatAmt: 0,
      };
    } else if (mode === 'VAT') {
      return {
        cgstAmt: 0,
        sgstAmt: 0,
        ugstAmt: 0,
        igstAmt: 0,
        vatAmt: detail.TaxAmount1 || 0,
      };
    }

    return {
      cgstAmt: detail.TaxAmount1 || 0,
      sgstAmt: detail.TaxAmount2 || 0,
      ugstAmt: 0,
      igstAmt: 0,
      vatAmt: detail.TaxAmount1 || 0,
    };
  }

  getShipmentFieldValue(
    fieldName: 'VesselName' | 'VoyageNo' | 'POL' | 'FPD' | 'ETD' | 'ETA',
  ): any {
    const data = this.vendorCreditNoteData || {};
    const hasHouseJob = !!data?.HouseJobSid;
    const hasMasterJob = !!data?.MasterJobSid;
    const bookingHeader = data?.BookingHeader || data?.bookingHeader;

    if (hasHouseJob && data?.houseJob) {
      const value = data.houseJob?.[fieldName];
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }

    if (hasMasterJob && data?.masterJob) {
      const directValue = data.masterJob?.[fieldName];
      if (directValue !== null && directValue !== undefined && directValue !== '') {
        return directValue;
      }

      const voyageValue = data.masterJob?.voyages?.[0]?.[fieldName];
      if (voyageValue !== null && voyageValue !== undefined && voyageValue !== '') {
        return voyageValue;
      }
    }

    if (bookingHeader) {
      const bookingValue = bookingHeader?.[fieldName];
      if (bookingValue !== null && bookingValue !== undefined && bookingValue !== '') {
        return bookingValue;
      }
    }

    return null;
  }

  getAmountInWords(total: number, currencySid: number): string {
    if (!total) return '';
    return this.numberToWords.convert(total, currencySid);
  }

  async getAndStoreVendorCreditNoteBankDetails(): Promise<void> {
    try {
      const partyCurrencyId =
        this.vendorCreditNoteData?.CurrencyMasterSid ||
        this.vendorCreditNoteForm.get('CurrencyMasterSid')?.getRawValue();
      const payload = {
        CurrencyMasterSid: partyCurrencyId,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
      };

      const resp: any = await firstValueFrom(this.operationService.getBankDetails(payload));
      this.isBankFetched = true;
      this.bankDetails = resp?.status && resp.data ? resp.data : [];
    } catch (err) {
      console.error('Error fetching vendor credit note bank details', err);
      this.bankDetails = [];
    }
  }

  async getAndStoreVendorCreditNoteTandC(): Promise<void> {
    try {
      this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
      const payload = {
        MenuMasterSid: this.currentMenuId,
        DocumentSid: this.vendorCreditNoteData?.VoucherHeaderSid,
      };
      const resp: any = await firstValueFrom(this.masterService.getTandCByCondition(payload));
      this.TandCFetched = true;
      this.TandCList = resp?.status && Array.isArray(resp?.data) ? resp.data : [];
    } catch (err) {
      console.error('Error fetching vendor credit note terms and conditions', err);
      this.TandCList = [];
    }
  }

  async prepareVendorCreditNotePrintData() {
    if (!this.currencyList || this.currencyList.length === 0) {
      try {
        const currenciesResp: any = await firstValueFrom(this.operationService.getAllCurrencies());
        this.currencyList = currenciesResp?.data || [];
      } catch {
        this.currencyList = [];
      }
    }
    if (this.currencyList.length > 0) {
      this.numberToWords.initializeCurrencies(this.currencyList);
    }

    const isBookingInvoice = this.vendorCreditNoteData?.BookingHeaderSid;
    const isHouseJobInvoice = this.vendorCreditNoteData?.HouseJobSid && this.vendorCreditNoteData?.MasterJobSid;
    const isMasterJobInvoice = this.vendorCreditNoteData?.MasterJobSid && !this.vendorCreditNoteData?.HouseJobSid;
    const bookingHeader = this.vendorCreditNoteData?.BookingHeader || this.vendorCreditNoteData?.bookingHeader || {};
    const houseJob = this.vendorCreditNoteData?.houseJob || {};
    const masterJob = this.vendorCreditNoteData?.masterJob || {};
    const allDetails: any[] = this.vendorCreditNoteData?.VoucherDetail || [];

    const voucherDetails = allDetails
      .filter((d) => d.IsAutoGenerated !== 'Y')
      .map((detail, index) => {
        const taxPercentages = this.getTaxPercentageForDisplay(detail);
        const taxAmounts = this.getTaxAmountForDisplay(detail);
        const hssacCode = detail?.HSSACCode || detail?.hssacMaster?.HSSACCode || detail?.hssacMaster?.hsnCode || '-';

        const totalTaxAmount =
          toNumber(taxAmounts.cgstAmt) +
          toNumber(taxAmounts.sgstAmt) +
          toNumber(taxAmounts.igstAmt) +
          toNumber(taxAmounts.vatAmt);
        const actualLocalAmount = toNumber(detail.LocalAmount) + totalTaxAmount;
        const exchangeRate = toNumber(this.vendorCreditNoteData?.ExchangeRate) || 1;
        const correctedTaxAmount =
          this.vendorCreditNoteData?.CurrencyMasterSid === this.currentCompany.CurrencyMasterSid
            ? totalTaxAmount
            : totalTaxAmount / exchangeRate;
        const actualPartyAmount = toNumber(detail.PartyAmount) + correctedTaxAmount;

        return {
          Sno: index + 1,
          ChargeDescription: detail.ChargeDescription || '',
          HSSACCode: hssacCode,
          DrCr: detail.DrCr || '',
          CurrencyMasterSid: detail.CurrencyMasterSid,
          CurrencyCode: detail.CurrencyCode || '',
          NumberOfUnit: Number(detail.NumberOfUnit || 0).toFixed(3),
          Rate: this.getFormattedAmount(detail.Rate, detail.CurrencyMasterSid),
          ExchangeRate: this.getFormattedAndPaddedExchangeRate(toNumber(detail.ExchangeRate), detail.CurrencyMasterSid),
          TaxableAmount: this.getFormattedAmount(detail.TaxableAmount, this.currentCompany.CurrencyMasterSid),
          cgstRate: Number(taxPercentages.cgstRate || 0).toFixed(3),
          cgstAmt: this.getFormattedAmount(taxAmounts.cgstAmt, this.currentCompany.CurrencyMasterSid),
          sgstRate: Number(taxPercentages.sgstRate || 0).toFixed(3),
          sgstAmt: this.getFormattedAmount(taxAmounts.sgstAmt, this.currentCompany.CurrencyMasterSid),
          igstRate: Number(taxPercentages.igstRate || 0).toFixed(3),
          igstAmt: this.getFormattedAmount(taxAmounts.igstAmt, this.currentCompany.CurrencyMasterSid),
          vatRate: Number(taxPercentages.vatRate || 0).toFixed(3),
          vatAmt: this.getFormattedAmount(taxAmounts.vatAmt, this.currentCompany.CurrencyMasterSid),
          LocalAmount: this.getFormattedAmount(actualLocalAmount, this.currentCompany.CurrencyMasterSid),
          PartyAmount: this.getFormattedAmount(actualPartyAmount, this.vendorCreditNoteData?.CurrencyMasterSid),
        };
      });

    const totalPartyAmount = voucherDetails.reduce((sum, detail) => {
        return sum + toNumber(detail.PartyAmount);
    }, 0);

    if (!this.isBankFetched) {
      await this.getAndStoreVendorCreditNoteBankDetails();
    }
    const bankDetails = this.bankDetails ?? this.vendorCreditNoteData?.BankDetails ?? [];

    if (!this.TandCFetched) {
      await this.getAndStoreVendorCreditNoteTandC();
    }
    const tandc = this.TandCList || [];

    const resolvedCurrencySid =
      this.vendorCreditNoteData?.CurrencyMasterSid ||
      this.vendorCreditNoteForm.get('CurrencyMasterSid')?.getRawValue() ||
      this.currencyList.find(
        (c: any) => c.currencyCode === this.vendorCreditNoteData?.CurrencyCode
      )?.CurrencyMasterSid ||
      this.currentCompanyCurrency?.currencyMasterSid;
    const amountInWords = this.getAmountInWords(totalPartyAmount, resolvedCurrencySid);

    this.vendorCreditNotePrintData = {
      invoiceTitle: 'Vendor Credit Note',
      GSTCode: this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
      CurrencyMasterSid: this.vendorCreditNoteData?.CurrencyMasterSid || 0,
      CurrencyCode: this.vendorCreditNoteData?.CurrencyCode || '',
      VoucherDate: this.vendorCreditNoteData?.VoucherDate || '',
      CreditNo: this.vendorCreditNoteData?.VoucherNumber || '',
      CreditDate: this.vendorCreditNoteData?.VoucherDate || '',
      InvoiceNo: this.vendorCreditNoteData?.VoucherNumber || '',
      InvoiceDate: this.vendorCreditNoteData?.VoucherDate || '',
      InvoiceDueDate: this.vendorCreditNoteData?.DueDate || '',
      BilledTo: this.vendorCreditNoteData?.PartyName || this.vendorCreditNoteData?.subledgerMaster?.SubledgerName || '',
      BillingAddress: this.vendorCreditNoteData?.PartyAddress || this.vendorCreditNoteData?.subledgerMaster?.Address || '',
      PAN: this.currentCompany?.Pan || this.currentCompany?.PAN || '',
      GST_VAT: this.vendorCreditNoteData?.GST_VAT || '',
      IRNNumber: this.vendorCreditNoteData?.IRNNumber || '',
      ShipperName: isHouseJobInvoice ? houseJob?.ShipperName : (isBookingInvoice ? bookingHeader?.ShipperName : ''),
      ConsigneeName: isHouseJobInvoice ? houseJob?.ConsigneeName : (isBookingInvoice ? bookingHeader?.ConsigneeName : ''),
      Vessel: this.getShipmentFieldValue('VesselName') || '',
      VoyageNo: this.getShipmentFieldValue('VoyageNo') || '',
      POL: this.getShipmentFieldValue('POL') || '',
      PlaceofSupply: this.vendorCreditNoteData?.PlaceOfSupply || '',
      FPD: this.getShipmentFieldValue('FPD') || '',
      ETD: this.getShipmentFieldValue('ETD') || '',
      ETA: this.getShipmentFieldValue('ETA') || '',
      MasterJobNumber: masterJob?.MasterJobNumber || '',
      MasterJobDate: masterJob?.MasterJobDate || '',
      HBLNo: houseJob?.HBLNo || '',
      MBLNo: masterJob?.MBLNo || '',
      DocumentNumber: this.vendorCreditNoteData?.DocumentNumber || '',
      DocumentDate: this.vendorCreditNoteData?.DocumentDate || '',
      ContainerType: masterJob?.containers?.[0]?.ContainerType || '',
      ContainerNumber: masterJob?.containers?.[0]?.ContainerNumber || '',
      DepartmentMasterSid: masterJob?.DepartmentMasterSid || '',
      FreightTerms: isHouseJobInvoice
        ? houseJob?.FreightTerms
        : (isBookingInvoice
            ? bookingHeader?.FreightTerms
            : (isMasterJobInvoice ? masterJob?.FreightPPCC : '')),
      JobType: isHouseJobInvoice
        ? houseJob?.JobType
        : (isBookingInvoice
            ? bookingHeader?.JobType
            : (isMasterJobInvoice ? masterJob?.JobType : '')),
      IsServiceJob: isHouseJobInvoice ? houseJob?.IsServiceJob : '',
      BookingNumber: isHouseJobInvoice ? houseJob?.BookingNo : (isBookingInvoice ? bookingHeader?.BookingNo : ''),
      CurrExRate: `${this.vendorCreditNoteData?.CurrencyCode || ''} / ${this.getFormattedAndPaddedExchangeRate(toNumber(this.vendorCreditNoteData?.ExchangeRate), this.vendorCreditNoteData?.CurrencyMasterSid)}`,
      SalesPerson: '',
      Remarks: this.vendorCreditNoteData?.Remarks || '',
      voucherDetails,
      totalPartyAmount: this.getFormattedAmount(totalPartyAmount, resolvedCurrencySid),
      AmountInWords: amountInWords,
      BankDetails: bankDetails,
      TermsAndConditions: tandc,
      pkg: isHouseJobInvoice
        ? (houseJob?.Cargo?.[0]?.NoOfPackage ?? ' ')
        : isBookingInvoice
          ? (bookingHeader?.bookingCargo?.[0]?.NoOfPackage ?? ' ')
          : isMasterJobInvoice
            ? (masterJob?.NoOfPkg ?? ' ')
            : ' ',
      grosswt: isHouseJobInvoice
        ? (houseJob?.Cargo?.[0]?.GrossWeight ?? ' ')
        : isBookingInvoice
          ? (bookingHeader?.bookingCargo?.[0]?.GrossWeight ?? ' ')
          : isMasterJobInvoice
            ? (masterJob?.GrossWeight ?? ' ')
            : ' ',
      desc: isHouseJobInvoice
        ? (houseJob?.Cargo?.[0]?.CommodityDescription ?? ' ')
        : isBookingInvoice
          ? (bookingHeader?.bookingCargo?.[0]?.CommodityDescription ?? ' ')
          : isMasterJobInvoice
            ? (masterJob?.CommodityDescription ?? ' ')
            : ' ',
      ChargeableWeight: isHouseJobInvoice
        ? (houseJob?.Cargo?.[0]?.ChargeableWeight ?? ' ')
        : isBookingInvoice
          ? (bookingHeader?.bookingCargo?.[0]?.ChargeableWeight ?? ' ')
          : isMasterJobInvoice
            ? (masterJob?.ChargeableWeight ?? ' ')
            : ' ',
      cbm: isHouseJobInvoice
        ? (houseJob?.Cargo?.[0]?.Volume ?? ' ')
        : isBookingInvoice
          ? (bookingHeader?.bookingCargo?.[0]?.Volume ?? ' ')
          : isMasterJobInvoice
            ? (masterJob?.Volume ?? ' ')
            : ' ',
    };
  }

  async openPrintModal() {
    if (!this.headerId) {
      this.appSettingService.showWarning('Please save the vendor credit note first.');
      return;
    }

    this.spinner.show();
    try {
      await this.prepareVendorCreditNotePrintData();

      const modalRef = this.modalService.open(VendorCreditNotePrintComponent, {
        size: 'xl',
        scrollable: true,
      });

      modalRef.componentInstance.sourceVendorCreditNoteData = this.vendorCreditNoteData;
      modalRef.componentInstance.vendorCreditNoteData = this.vendorCreditNotePrintData;
      modalRef.componentInstance.printData = this.vendorCreditNotePrintData;
      modalRef.componentInstance.currentCompany = this.currentCompany;
      modalRef.componentInstance.currentBranch = this.currentBranch;
      modalRef.componentInstance.currentCompanyCountryCode = this.currentCompanyCountryCode;
      modalRef.componentInstance.currentCompanyCurrency = this.currentCompanyCurrency;
      modalRef.componentInstance.bankDetails = this.vendorCreditNotePrintData?.BankDetails || [];
      modalRef.componentInstance.TandCList = this.vendorCreditNotePrintData?.TermsAndConditions || [];
      modalRef.componentInstance.userData = this.userData;
      modalRef.componentInstance.isVATMode = this.isVATMode;
      modalRef.componentInstance.currentDate = this.currentDate;
    } finally {
      this.spinner.hide();
    }
  }

  shouldShowGSTTypeField(): boolean {
    return this.currentCompanyCountryCode === 'in';
  }

  calculateTotalColspan(): number {
    const config = this.getTaxDisplayConfig();
    let baseColumns = 13; // Adjust based on your column count

    // Add tax columns based on what's visible
    if (config.showCGST) baseColumns += 2; // CGST % + CGST Amt
    if (config.showSGST) baseColumns += 2; // SGST % + SGST Amt
    if (config.showUGST) baseColumns += 2; // UGST % + UGST Amt
    if (config.showIGST) baseColumns += 2; // IGST % + IGST Amt
    if (config.showVAT) baseColumns += 2; // VAT % + VAT Amt

    return baseColumns;
  }


  private searchOutstandingForVendorInvoice(
    invoiceNumber: string,
    invoiceData: any,
  ) {
    if (!invoiceNumber || !this.currentCompany?.CompanyMasterSid) {
      this.spinner.hide();
      return;
    }

    const searchDto = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      InvoiceNumber: invoiceNumber,
      IncludeFullyPaid: false,
    };

    this.operationService.searchOutstandingInvoices(searchDto).subscribe({
      next: (response: any) => {
        this.spinner.hide();

        // Extract the array from the response
        const outstandingInvoices = response.data || response || [];

        // Find the specific invoice in outstanding results
        const matchingOutstanding = outstandingInvoices.find(
          (inv: any) => inv.VoucherNumber === invoiceNumber,
        );

        if (matchingOutstanding) {
          const outstandingAmount = Math.abs(
            matchingOutstanding.OutstandingLocalAmount,
          );

          // Store the outstanding information
          this.invoiceOutstandingAmount = outstandingAmount;
          this.selectedOutstandingInvoice = matchingOutstanding;
          this.showOutstandingInfo = true;
        } else {
          this.invoiceOutstandingAmount = 0;
          this.showOutstandingInfo = false;
          this.appSettingService.showInfo(
            'No outstanding amount found for this invoice.',
          );
        }
      },
      error: (error) => {
        this.spinner.hide();
        this.invoiceOutstandingAmount = 0;
        this.showOutstandingInfo = false;
        this.appSettingService.showWarning(
          'Could not fetch outstanding amount, but invoice data was loaded.',
        );
      },
    });
  }

  calculateTotalAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('Amount')?.value) || 0);
    }, 0);
  }

  calculateTotalLocalAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('LocalAmount')?.value) || 0);
    }, 0);
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFirstRateError(): string {
    for (let row of this.details.controls) {
      const rateControl = row.get('Rate');
      if (rateControl?.invalid && rateControl?.touched) {
        if (rateControl.errors?.['rateExceeded']) {
          return 'Credit note rate cannot exceed original vendor invoice rate';
        }
        if (rateControl.errors?.['required']) {
          return 'Rate is required';
        }
        if (rateControl.errors?.['min']) {
          return 'Rate must be greater than or equal to 0';
        }
      }
    }
    return '';
  }

  showInfo() {
    if (!this.vendorCreditNoteData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.vendorCreditNoteData;
    modalRef.componentInstance.idLabel = 'Vendor Credit Note Id';
    modalRef.componentInstance.idValue = this.vendorCreditNoteData?.VoucherHeaderSid;
  }

  openAuditLogs(modal: TemplateRef<any>) {
        if (!this.vendorCreditNoteData?.VoucherHeaderSid) return;
        this.getAuditLog()
        this.auditLogModalRef = this.modalService.open(modal, {
          centered: true,
          scrollable: true,
          windowClass: 'audit-log-modal'
        });
      }
  
      getAuditLog() {
    this.operationService.getAuditLogsCreditNote(
      'VoucherHeader',
      this.vendorCreditNoteData?.VoucherHeaderSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
  
        const ignoreWords = [
          'updatedon',
          'updatedby',
          'createdon',
          'createdby'
        ];
  
        const normalize = (val: any) => {
          if (val === null || val === undefined || val === '') return null;
          return String(val).trim();
        };
  
        const sortedLogs = [...logs].sort(
          (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
        );
  
        const groups: any[] = [];
        const MERGE_WINDOW_MS = 5000;
  
        sortedLogs.forEach(log => {
          const logTime = new Date(log.changedAt).getTime();
  
          let group = groups.find(g =>
            g.changedBy === log.changedBy &&
            g.operation === log.operation &&
            (logTime - g.lastChangedAtTime) <= MERGE_WINDOW_MS
          );
  
          if (!group) {
            group = {
              changedAt: log.changedAt,
              changedBy: log.changedBy,
              operation: log.operation,
              oldValDisplay: [],
              newValDisplay: [],
              lastChangedAtTime: logTime
            };
            groups.push(group);
          } else {
            group.lastChangedAtTime = logTime;
          }
  
          const oldObj = log.oldVal || {};
          const newObj = log.newVal || {};
  
          const keys = new Set([
            ...Object.keys(oldObj),
            ...Object.keys(newObj)
          ]);
  
          keys.forEach(k => {
            const lowerKey = k.toLowerCase();
  
            if (ignoreWords.some(x => lowerKey.includes(x))) return;
  
            const oldVal = normalize(oldObj[k]);
            const newVal = normalize(newObj[k]);
  
            if (oldVal !== newVal) {
              const oldLine = `${k}: ${oldVal ?? '-'}`;
              const newLine = `${k}: ${newVal ?? '-'}`;
  
              if (!group.oldValDisplay.includes(oldLine)) {
                group.oldValDisplay.push(oldLine);
              }
  
              if (!group.newValDisplay.includes(newLine)) {
                group.newValDisplay.push(newLine);
              }
            }
          });
        });
  
        this.auditLogs = groups
          .filter(g => g.oldValDisplay.length > 0)
          .map(({ lastChangedAtTime, ...rest }) => rest)
          .sort(
            (a, b) =>
              new Date(b.changedAt).getTime() -
              new Date(a.changedAt).getTime()
          );
      },
      error: err => console.error('Error fetching audit logs:', err)
    });
  }
}
