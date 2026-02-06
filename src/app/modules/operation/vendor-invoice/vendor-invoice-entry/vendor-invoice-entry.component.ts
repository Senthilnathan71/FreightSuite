import { Component, OnInit, ViewChild, TemplateRef, input, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
  FormsModule,
  ValidatorFn,
  ValidationErrors
} from '@angular/forms';
import { NgbModal, NgbDatepickerModule, NgbModalRef, NgbDropdownModule, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, firstValueFrom, forkJoin, map, of, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import { OperationService } from 'src/app/modules/operation/operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService, CurrencySettings } from 'src/app/core/services/company-settings-manager.service';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DocumentVendorInvoiceEntryComponent } from '../document-vendorinvoice/document-vendorinvoice.component';
import { CommonService } from 'src/app/common/common.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { errorLogger, getDefaultTodayDate, toNumber } from 'src/app/common/helper';
import { VoucherPeriodValidationService, VoucherDateConstraints } from 'src/app/common/voucher-period-validation.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { ToastrService } from 'ngx-toastr';
import { consistentExchangeRatesValidator, getExchangeRateErrorMessage } from 'src/app/core/ValidationFn/exRateConsistency.validators';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { offset } from '@popperjs/core';

interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-vendor-invoice-entry',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FeatherModule,
    NgbDatepickerModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSpinnerModule,
    NumberFormatPipe,
    CustomDatePipe,
    SearchableDropdown,
    NgbDropdownModule,
    DecimalPrecisionDirective,
    PreventMultiClickDirective
  ],
  templateUrl: './vendor-invoice-entry.component.html',
  styleUrls: ['./vendor-invoice-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class VendorInvoiceEntryComponent implements OnInit {
  // Datas from Session Storage
  userData : any;
  currUserEmail: string | null = null;
  currentCompany: any;
  currentBranch: any;
  currentCompanyCountry : {
    CountryMasterSid : number;
    countryName : string;
    countryCode : string;
  }
  currentCompanyCountryId : number;
  currentCompanyCountryCode : string;
  currentCompanyCurrency : CurrencySettings;
  currentBranchState : {
    StateMasterSid : number;
    stateName : string;
    stateCode : string;
  }
  currentBranchStateName : string;
  currentBranchCity : {
    CityMasterSid : number;
    cityName : string;
    cityCode : string;
  }
  currentUserState: string;
  currentFinancialYear: number;
  currentCountry: number;
  currentBranchCityId: number;
  currentBranchCityName: string | null;

  vendorInvoiceForm!: FormGroup;
  temporaryForm !: FormGroup;
  headerId: number | null = null;
  vendorInvoiceData: any;
  currentMenuId : number;
  TandCList: any[] = [];
  isViewMode: boolean = false;
  isNonJob: boolean = false;
  get isEditMode() { 
    return !!this.headerId && !this.isViewMode; 
  }
  
  // ViewChild references for modals
  @ViewChild('searchCostsModal') searchCostsModalRef: TemplateRef<any> | undefined;
  searchCostsModalInstance: NgbModalRef | null = null;

  // Lookups
  vendorList: any[] = [];
  vendorBranchList: any[] = [];
  currencyList: any[] = [];
  chargeList: any[] = [];
  hssacList: any[][] = []; // for job related
  hssacListForNonJob : any[][] = []; // for non job related
  temporaryHssacList : any[][] = []; // for pulling os
  subledgerList: any[] = [];
  uomList: any[] = [];
  departmentList: any[] = [];
  masterJobList: any[] = [];
  houseJobList: any[][] = [];
  taxGroupList : any[] = [];
  chargeTaxGroupMap : Map<number,any> = new Map();
  masterHouseMap: Map<number, any[]> = new Map();
  
  // Dropdown configs
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  HSSACLookupConfig =DROPDOWN_CONFIGS.HSSAC_TAX;
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  masterJobLookupConfig = DROPDOWN_CONFIGS.MASTER_JOB;
  
  // UI state
  selectedTab = 'VendorInvoice';
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }
  tabs = [
    { name: 'VendorInvoice', icon: 'fas fa-file-invoice' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' }
  ];

  invoiceTypes = [
    { id: 'REG', name: 'Regular' },
    { id: 'REIMB', name: 'Reimbursement' },
    { id: 'BOS', name: 'Bill of Supply' },
    { id: 'NONGST', name: 'Non GST/Zero' }
  ];
  
  gstTypes = [
    { id: 'B2B', name: 'B2B - Business to Business' },
    { id: 'B2C', name: 'B2C - Business to Customer' },
    { id: 'EXWP', name: 'Export With Payment' },
    { id: 'EXWOP', name: 'Export Without Payment' }
  ];

  statusList = [
    { value: 'A', name: 'Active' },
    { value: 'S', name: 'Suspended' },
  ];

  currentDate = new Date();
  isAutoPosting : boolean = false;

  // Voucher period constraints
  voucherConstraints: VoucherDateConstraints = {
    minDate: null, maxDate: null, isClosed: false, errorMessage: null
  };

  // TDS Configuration
  tdsConfig: any = null;

  // others
  coaList : any[] = [];
  subledgerListDetail : any[][] = [];
  
  // Country/Tax mode
  bookingModeCountry: string = 'india';
  taxGroupMap: Map<string, any[]> = new Map();
  buildKey(
    TaxGroupSid: number,
    InputOrOutput: 'Input' | 'Output',
    placeOfSupply: string,
    CountryMasterSid: number
  ): string {
    return `${TaxGroupSid}_${InputOrOutput}_${placeOfSupply}_${CountryMasterSid}`;
  }

  // Unsaved changes related varaible declarations
  isDirty : boolean = false;
  isSaving: boolean = false;
  private initialFormValue : any = null;
  private destroy$ = new Subject<void>();
  
  /** OTHERS */
  // Declaration for Get OS
  searchType: string = 'Master Job';
  searchValue: string = '';
  pendingCosts: any[] = [];
  selectedCosts: Set<number> = new Set();
  searchPerformed: boolean = false;
  searchResultsLoading: boolean = false;
  selectedVendorForSearch: any = null;
  selectedVendorForCosts: any = null;
  allPendingCosts: any[] = [];
  searchVendors: any[] = [];
  selectedVendorBranchForSearch: any = null;
  searchTypes = [
    { id: 'Master Job', name: 'Master Job' },
    { id: 'House Job', name: 'House Job' },
    { id: 'Vendor Name', name: 'Vendor Name' },
    { id: 'MBL No', name: 'MBL No' },
    { id: 'HBL No', name: 'HBL No' },
    { id: 'Container No', name: 'Container No' }
  ];
  
  get isIndiaGST(): boolean {
    return this.currentCompanyCountryCode === 'in';
  }

  get isVATMode(): boolean {
    return this.currentCompanyCountryCode !== 'in'; // VAT for non-India countries
  }

  get f(): { [key: string]: AbstractControl } {
    return this.vendorInvoiceForm.controls;
  }
  get details(): FormArray {
    return this.vendorInvoiceForm.get('voucherDetails') as FormArray;
  }

  get others(): FormGroup {
    return this.vendorInvoiceForm.get('voucherOthers') as FormGroup;
  }

  
  // storing frequently used data in a map
  /**
   * Exchange rate map
   * key = fromCurrencyCode + toCurrencyCode + Date
   */
  private exchangeRateMap: Map<string, number> = new Map();
  buildExchangeRateMapKey(fromCurrencyCode: string, toCurrencyCode: string, date: Date): string {
    return `${fromCurrencyCode}_${toCurrencyCode}_${date.toISOString()}`;
  }

  get tdsGroup(): FormGroup {
    return this.vendorInvoiceForm.get('voucherTDS') as FormGroup;
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
    private commonService: CommonService,
    private masterService: MasterService,
    public mps: MenuPermissionService,
    private currencyConfigService: CurrencyConfigurationService,
    private currencyFormatService: CurrencyFormatService,
    private datePipe : CustomDatePipe,
    private voucherPeriodService: VoucherPeriodValidationService
  ) { }

  ngOnInit(): void {
    
    try {
    // Try accessing User related Properties
      const userProfile = this.appSettingService.getDecryptedUserProfile();
      if (userProfile) {
        this.userData = userProfile;
        this.currUserEmail = this.userData.userEmail;
      }

      // Getting Data from appSettingService
      this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
      this.currentBranch = this.appSettingService.getCurrentBranchInfo();
      this.currentCompanyCountry = this.appSettingService.getCurrentCompanyCountry();
      this.currentCompanyCurrency = this.companySettings.getCurrencySettings();
      this.currentBranchState = this.appSettingService.getCurrentBranchState();
      this.currentBranchCity = this.appSettingService.getCurrentBranchCity();
      const currentFinancialYear = this.appSettingService.getCurrentFinancialYear();
      this.currentFinancialYear = Number(localStorage.getItem('current-year-id'));
      
      
      this.currentMenuId = this.mps.getMenuId();
      this.mps.init().subscribe();

      // Assigning value to global variables
      this.currentCompanyCountryId = Number(this.currentCompany?.CountryMasterSid) || this.currentCompanyCountry.CountryMasterSid;
      this.currentCompanyCountryCode = String(this.currentCompanyCountry.countryCode).trim().toLowerCase();
      if (currentFinancialYear) {
        this.currentFinancialYear = Number(currentFinancialYear.YearMasterSid);
      }
      if(this.currentBranchState){
        this.currentBranchStateName = this.currentBranchState.stateName || this.currentBranch?.stateMaster?.stateName;
      }
      if(this.currentBranchCity){
        this.currentBranchCityId = this.currentBranchCity.CityMasterSid || this.currentBranch?.cityMaster?.CityMasterSid;
      }

    } catch (e) {
      this.currentCompany = null;
      this.currentBranch = null;
    }
    const paramValue = this.route.snapshot.queryParamMap.get('isNonJob');
    this.isNonJob = paramValue === 'true'; 

    this.checkVoucherPostingMechanism();
    this.initForm();
    this.loadLookups();
    this.loadVoucherPeriods();
    this.spinner.show();
    this.route.data.subscribe((data) => {
      this.isViewMode = data['viewMode'] === true;
    });


    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.headerId = Number(id);
        this.loadVendorInvoiceById(this.headerId);
      } else {
        this.initialFormValue = this.vendorInvoiceForm.getRawValue();
        this.subscribeToFormChanges();
        this.subscribeToValueChanges();
      }
    });
  }

  initForm() {
    const companyCurrencyId = this.currentCompany.CurrencyMasterSid || this.currentCompanyCurrency.currencyMasterSid;
    const companyCurrencyCode = this.currentCompanyCurrency.code;
    const today = getDefaultTodayDate();

    this.vendorInvoiceForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }],
      VoucherDate: [today, Validators.required],
      PartyMasterSid: [null],
      PartyName: [null, Validators.required],
      PartyAddress: [{ value: '', disabled: true },Validators.required],
      COAMasterSid :[null],
      CustomerBranchSid: [null],
      DocumentNumber : [''],
      IRNNumber : [''],
      MasterJobSid : [null],
      HBLNo : [{value: '', disabled: true}],
      CurrencyMasterSid : [companyCurrencyId, Validators.required],
      CurrencyCode : [companyCurrencyCode || "", Validators.required],
      ExchangeRate : [
        { value: 1, disabled: true }, 
        [Validators.required, Validators.min(0)]
      ],
      GST_VAT: [''],
      PlaceOfSupply: [''],
      PostStatus: ['U'],
      GSTType: [''],
      InvoiceType: ['REG'],
      Narration: [''],
      Remarks : [''],
      IRNStatus : [''],
      MBLNo : [{value: '', disabled: true}],
      Status: ['A',[Validators.required]],
      JobOrNonJob: [{value : this.isNonJob, disabled: true}],  // true then non job , false then job

      DepartmentMasterSid: [null],
      BillNo: ['', Validators.required],
      BillDate: [null, Validators.required],
      BillAmt: [0, [Validators.required, Validators.min(0)]],
      HouseJobSid: [null],
      PostedOn: [{ value: null, disabled: true }],
      
      // Details Array
      voucherDetails: this.fb.array([]),

      // Others
      voucherOthers: this.fb.group({
        ContainerNumber: [''],
        VoucherNote: [''],
        Footer: ['']
      }),
      // TDS Section
      voucherTDS: this.fb.group({
        TDSSet: [{ value: '', disabled: true }],
        TDSCompany: [{ value: '', disabled: true }],
        ITSectionType: [{ value: '', disabled: true }],
        ITSectionCode: [{ value: 'null', disabled: true }],
        CertificateNo: [{ value: '', disabled: true }],
        Percentage: [{ value: 0, disabled: true }],
        TaxableAmt: [{ value: 0, disabled: true }],
        TDSSetRateSid: [{ value: 0, disabled: true }],
        TDSAmt: [{ value: 0, disabled: true }],
        Reason: [''],
        TDSSectionCode: [''],
        TDSNature: [''],
        TDSCompanyType: [''],
        TDSPercent: [''],
        TDSAccountCode: ['']
      }),

    });

    this.vendorInvoiceForm.setValidators(
      consistentExchangeRatesValidator(companyCurrencyId,companyCurrencyCode));
  }


  subscribeToValueChanges() {
    this.vendorInvoiceForm.get('GSTType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.recalculateAllRows();
      });

    ['GSTType', 'CurrencyCode', 'ExchangeRate'].forEach((field) => {
      this.vendorInvoiceForm.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.isPosted) return;
          this.recalculateAllRows();
        });
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
    })
  }


  subscribeToFormChanges() {
    this.vendorInvoiceForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.vendorInvoiceForm.getRawValue()
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

  onHeaderCurrencyChange(selectedCurrency: any): void {
    if (!selectedCurrency) return;
    const currencyMasterSid = selectedCurrency?.CurrencyMasterSid;
    const currencyCode = selectedCurrency?.currencyCode;

    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    const companyCurrencyCode = this.currentCompanyCurrency?.code;


    // If same as company currency, set exchange rate to 1 and disable
    if (currencyMasterSid === companyCurrency) {
      this.vendorInvoiceForm.patchValue({
        CurrencyMasterSid : currencyMasterSid,
        CurrencyCode: currencyCode,
        ExchangeRate: 1
      });
      this.vendorInvoiceForm.get('ExchangeRate')?.disable();
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
      vendors: this.operationService.getAllCreditorWithCOAMapped(filterOption).pipe(catchError(() => of({ data: [] }))),
      currencies: this.operationService.getAllCurrencies().pipe(catchError(() => of({ data: [] }))),
      uom: this.operationService.getAllUom().pipe(catchError(() => of({ data: [] }))),
      departments: this.operationService.getAllDepartments(CompanyMasterSid).pipe(catchError(() => of({ data: [] }))),
      masterJobs: this.operationService.getAllMasterJobs({ ...filterOption, limit: 200, offset: 0 }).pipe(catchError(() => of({ data: [] })))
    };

    if (this.isNonJob) {
      source.coa = this.operationService.getAllCoaWithLedgerCategory({
        LedgerCategory: 'Ledger',
        CompanyMasterSid: CompanyMasterSid
      }).pipe(catchError(() => of({ data: [] })));
      source.hssac = this.operationService.getAllHssac().pipe(catchError(() => of([])));
      source.charges = of({ data: [] });
    } else {
      source.charges = this.operationService.getAllMappedChargeDebtors(filterOption).pipe(catchError(() => of({ data: [] })));
      source.hssac = of([]);
      source.coa = of({ data: [] });
    }

    // 3. Use the dynamic source in forkJoin
    forkJoin(source).subscribe(
      ({ vendors, currencies, charges, uom, departments, masterJobs, coa , hssac }: any) => {
        this.vendorList = vendors.data || [];
        this.subledgerList = vendors.data || [];
        this.chargeList = charges.data || [];
        this.uomList = uom.data || [];
        this.departmentList = departments.data || [];
        this.masterJobList = masterJobs.data || [];
        this.hssacListForNonJob = hssac || [];
        this.coaList = coa.data || [];

        this.currencyList = currencies.data || [];
        this.currencyConfigService.initializeConfigurations(this.currencyList);

        if (!this.isEditMode) {
          this.spinner.hide();
        }
      },
      (err) => {
        this.spinner.hide();
        console.error("Lookup error:", err);
      }
    );
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
    const voucherDate = this.vendorInvoiceForm?.get('VoucherDate')?.value;
    this.voucherConstraints = this.voucherPeriodService.applyConstraints(voucherDate, 'AP');
  }

  onVoucherDateChange() {
    this.applyVoucherDateConstraints();
    const voucherDate = this.vendorInvoiceForm.get('VoucherDate')?.value;
    if (!voucherDate) return;

    const companyCurrency = this.currentCompanyCurrency.code;

    // Check if header currency available , if yes fetch and recalculate
    const headerCurrencyId = this.vendorInvoiceForm.get('CurrencyMasterSid')?.value;
    const headerCurrencyCode = this.vendorInvoiceForm.get('CurrencyCode')?.value;
    if (headerCurrencyId) {

      if (headerCurrencyCode === companyCurrency) {
        this.vendorInvoiceForm.get('ExchangeRate')?.setValue(this.getFormattedAndPaddedExchangeRate(1, headerCurrencyId));
        this.vendorInvoiceForm.get('ExchangeRate')?.disable();
        this.recalculateAllRows();
        return;
      }

      const key = this.buildExchangeRateMapKey(headerCurrencyCode, companyCurrency, voucherDate);

      if (this.exchangeRateMap.has(key)) {
        const exchangeRate = this.exchangeRateMap.get(key);
        this.vendorInvoiceForm.get('ExchangeRate')?.setValue(this.getFormattedAndPaddedExchangeRate(exchangeRate, headerCurrencyId));
        this.recalculateAllRows();
      } else {
        this.fetchExchangeRate(headerCurrencyCode, companyCurrency);
      }
    }

    // check for each detail and update the exchange rate
    this.details.controls.forEach((detail: FormGroup, index: number) => {
      const rawValue = detail.getRawValue();
      const fromCurrencyCode = rawValue.CurrencyCode;
      const toCurrencyCode = companyCurrency;
      const key = this.buildExchangeRateMapKey(fromCurrencyCode, toCurrencyCode, voucherDate);
      if (this.exchangeRateMap.has(key)) {
        const exchangeRate = this.exchangeRateMap.get(key);
        detail.get('ExchangeRate')?.setValue(this.getFormattedAndPaddedExchangeRate(exchangeRate, headerCurrencyId));
        this.recalcRow(index);
      } else {
        this.patchExchangeRateForDetail(
          fromCurrencyCode,
          toCurrencyCode,
          index,
        )
      }
    });

  }

  onVendorChange(selected: any) {
    const vendorMasterSid = (typeof selected === 'object' && selected !== null)
      ? (selected.CustomerMasterSid ?? selected)
      : selected;

    if (!selected || !vendorMasterSid) {
      this.vendorBranchList = [];
      this.vendorInvoiceForm.get('CustomerBranchSid')?.setValue(null);
      this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
      this.vendorInvoiceForm.get('PartyMasterSid')?.setValue(null);
      this.vendorInvoiceForm.get('COAMasterSid')?.setValue(null);
      this.vendorInvoiceForm.get('GST_VAT')?.setValue('');
      this.vendorInvoiceForm.get('PartyName')?.setValue(null);
      this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');

      // Set default Invoice Type based on country
      if (this.currentCompanyCountryCode === 'in') {
        this.vendorInvoiceForm.get('InvoiceType')?.setValue('B2B');
      } else {
        this.vendorInvoiceForm.get('InvoiceType')?.setValue('REG');
      }
      this.vendorInvoiceForm.get('GSTType')?.setValue('');
      return;
    }

    const vendor = this.vendorList.find(
      (v) => v.CustomerMasterSid === vendorMasterSid
    );
    const countryCode = this.getCustomerCountryCode(vendor);

    // Check if customer has GST in any branch to determine B2B vs B2C
    const vendorBranches = this.vendorBranchList.filter(
      (b) => b.CustomerMasterSid === vendorMasterSid
    );
    const hasGSTInBranches = vendorBranches.some(
      (branch) => branch.GSTNo && branch.GSTNo?.trim() !== ''
    );

    if (vendor) {
      this.vendorInvoiceForm.patchValue({
        PartyName : vendor.CustomerName || null,
        PartyMasterSid : vendor.SubledgerMasterSid,
        COAMasterSid : vendor.COAMappedId,
        InvoiceType : 
          countryCode === 'in' ? 
          (hasGSTInBranches || vendor.GSTNo ? 'B2B' : 'B2C') : 'REG',
        GST_VAT : (countryCode === 'in' ? vendor.GSTNo : vendor.PanType) || "",
      })
      // Load TDS configuration
      // this.loadVendorTDS(vendorMasterSid);
    }

    // Reset branch selection when vendor changes
    this.vendorInvoiceForm.get('CustomerBranchSid')?.setValue(null);
    this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
    this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');
    this.vendorInvoiceForm.get('GSTType')?.setValue('');
    this.getVendorBranchByVendor(Number(vendorMasterSid));
  }

  // Enhanced getVendorBranchByVendor method with callback
  getVendorBranchByVendor(CustomerMasterSid: number) {
    if (!CustomerMasterSid) {
      this.vendorBranchList = [];
      return;
    }

    this.operationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          this.vendorBranchList = resp.data || [];
        } 
      },
      error: (err) => {
        console.error('Error fetching vendor branches', err);
        this.vendorBranchList = [];
      }
    });
  }

  onVendorBranchChange(selectedBranch: any) {
    const branchSid = (typeof selectedBranch === 'object' && selectedBranch !== null)
      ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
      : selectedBranch;

    if (!branchSid) {
      this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
      this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');
      this.vendorInvoiceForm.get('GSTType')?.setValue('');
      return;
    }

    const foundBranch = this.vendorBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));
    const placeOfSupply = foundBranch?.stateMaster?.stateName || "";

    if (foundBranch) {
      this.vendorInvoiceForm.patchValue({
        PartyAddress : foundBranch.Address,
        PlaceOfSupply : placeOfSupply
      })

    } else {
      this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
      this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');
    }
    this.determineGSTType(placeOfSupply);
    this.recalculateAllRows();
  }

  determineGSTType(placeOfSupply: string) {
    if (!placeOfSupply) {
      this.vendorInvoiceForm.get('GSTType')?.setValue('');
      return;
    }

    const vendorGSTNo = this.vendorInvoiceForm.get('GST_VAT')?.value;
    const invoiceType = this.vendorInvoiceForm.get('InvoiceType')?.value;
    const normalizedCompanyState = this.currentBranchStateName?.trim().toLowerCase();
    const normalizedPlaceOfSupply = placeOfSupply?.trim().toLowerCase();

    const hasValidGST = 
      vendorGSTNo &&
      vendorGSTNo.trim() !== '' &&
      vendorGSTNo !== undefined

    if (!this.isIndiaGST) {
      this.vendorInvoiceForm.get('GSTType')?.setValue('VAT');
      return;
    }

    if (this.isIndiaGST) {
      if (invoiceType === 'EXWP' || invoiceType === 'EXWOP') {
        this.vendorInvoiceForm.get('GSTType')?.setValue('EXWP');
        return;
      }

      if (hasValidGST) {
        if (normalizedPlaceOfSupply === normalizedCompanyState) {
          this.vendorInvoiceForm.get('GSTType')?.setValue('CGST+SGST');
        } else {
          this.vendorInvoiceForm.get('GSTType')?.setValue('IGST');
        }
      } else {
        this.vendorInvoiceForm.get('GSTType')?.setValue('B2C');
      }
    }
  }

  loadVendorInvoiceById(id: number) {
    this.operationService.getVendorInvoiceById(id).subscribe({
      next: (resp:any) => {
        if (resp.status && resp.data) {
          this.destroy$.next();
          this.destroy$.complete();

          this.vendorInvoiceData = resp.data;

          this.vendorInvoiceForm.markAllAsTouched();
          this.patchValues(this.vendorInvoiceData);
          this.vendorInvoiceForm.get('PartyName')?.disable();
          this.vendorInvoiceForm.get('CustomerBranchSid')?.disable();
          this.vendorInvoiceForm.get('CurrencyMasterSid')?.disable();
          this.vendorInvoiceForm.get('CurrencyCode')?.disable();
          if (this.isPosted) {
            this.details.disable({ emitEvent: false });
            this.isDirty = false;
            this.initialFormValue = this.vendorInvoiceForm.getRawValue();
            this.vendorInvoiceForm.disable();
            this.destroy$.next();
            this.destroy$.complete();
            return;
          } else {
            setTimeout(() => {
              this.initialFormValue = this.vendorInvoiceForm.getRawValue();
              this.isDirty = false;
              this.subscribeToFormChanges();
              this.subscribeToValueChanges();
            }, 0);
          }
          // unsaved changes related
        } else {
          this.spinner.hide();
          this.appSettingService.showError(resp.message);
          // this.router.navigate(['/operation/vendor-invoice/list']);
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
        this.appSettingService.showError('Error loading Vendor Invoice');
      }
    });
  }

  patchValues(data: any) {
    this.vendorInvoiceForm.patchValue({
      VoucherNumber: data.VoucherNumber,
      VoucherDate: data.VoucherDate ? new Date(data.VoucherDate) : null,
      CustomerMasterSid: data.CustomerMasterSid || null,
      CustomerBranchSid: data.CustomerBranchSid || null,
      PartyMasterSid: data.PartyMasterSid || null,
      PartyName: data.PartyName || '',
      PartyAddress: data.PartyAddress || '',
      COAMasterSid : data.COAMasterSid || null,
      PlaceOfSupply: data.PlaceOfSupply,
      PostStatus: data.PostStatus,
      MasterJobSid: data.MasterJobSid,
      HBLNo: data.HouseNumber,
      CurrencyMasterSid: data.CurrencyMasterSid || null,
      CurrencyCode: data.CurrencyCode || '',
      ExchangeRate: toNumber(data.ExchangeRate),
      GST_VAT: data.GST_VAT || "",
      InvoiceType: data.InvoiceType || null,
      GSTType: data.GSTType || null,
      Narration: data.Narration || '',
      Remarks: data.Remarks || '',
      MBLNo: data.MasterNumber,
      Status: data.Status,
      JobOrNonJob : data.CashOrBank === 'Y' ? true : false,
      
      PostedOn: data.PostDate ? new Date(data.PostDate) : null,
      BillNo: data.DocumentNumber,
      BillDate: data.DocumentDate ? new Date(data.DocumentDate) : null,
      BillAmt: data.Amount || 0,
      HouseJobSid: data.HouseJobSid,
    }, { emitEvent: false });

    if (data?.CurrencyMasterSid === this.currentCompany?.CurrencyMasterSid || this.isPosted) {
      this.vendorInvoiceForm.get('ExchangeRate')?.disable();
    } else {
      this.vendorInvoiceForm.get('ExchangeRate')?.enable();
    }

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
          TaxPercentage2:toNumber(det.TaxPercentage2) ,
          TaxAmount2: toNumber(det.TaxAmount2),
          LocalAmount: toNumber(det.LocalAmount),
          MasterJobSid: det.MasterJobSid,
          HouseJobSid: det.HouseJobSid,
          DepartmentMasterSid: det.DepartmentMasterSid,
          Remarks: det.Remarks,
          PartyAmount: det.PartyAmount,
          IsAutoGenerated: det.IsAutoGenerated,
          CostRevenueChargesSid: det.CostRevenueChargeSid,
        })
      );
      this.fetchHSN(this.details.length - 1,false);
      if (det.CurrencyMasterSid === this.currentCompany.CurrencyMasterSid) {
        this.details
          .at(this.details.length - 1)
          .get('ExchangeRate')
          ?.disable();
      }
      if (det.MasterJobSid) {
        this.onDetailMasterJobSelected(
          { MasterJobSid: det.MasterJobSid , DepartmentMasterSid : det.DepartmentMasterSid || null},
          index
        );
      }
      if (this.isNonJob && det.COAMasterSid) {
        const selectedCOA = this.coaList.find(coa => coa.COAMasterSid === det.COAMasterSid);
        if (selectedCOA && selectedCOA.SubledgerName === "Y") {
          this.onCOAChange(selectedCOA,index,false);
        } else {
          this.details.at(index)?.get('LedgerMasterSid')?.disable();
        }
      }
      index++;
    }

    // Populate others
    if (data.VoucherOthers && data.VoucherOthers.length > 0) {
      const others = data.VoucherOthers[0];
      this.vendorInvoiceForm.get('voucherOthers')?.patchValue({
        ContainerNumber: others.ContainerNumber || '',
        VoucherNote: others.VoucherNote || '',
        Footer: others.Footer || ''
      });
    }

    // Populate TDS
    if (data.VoucherTDS && data.VoucherTDS.length > 0) {
      const tds = data.VoucherTDS[0];
      this.tdsGroup.patchValue({
        ITSectionCode: tds.ITSectionCode,
        TDSSetRateSid: tds.TDSSetRateSid,
        Percentage: tds.TDSRate,
        TaxableAmt: tds.TaxableAmount,
        TDSAmt: tds.TDSAmount,
        Reason: tds.Reason || ''
      });
    }
    this.spinner.hide();
  }

  checkVoucherPostingMechanism() {
    const companyId = this.currentCompany?.CompanyMasterSid;
    const branchId = this.currentBranch?.BranchMasterSid;
    const menuName = 'Vendor Invoice';
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

    const currency = this.vendorInvoiceForm.get('CurrencyCode')?.value;
    const customerBranch = this.vendorInvoiceForm.get('CustomerBranchSid')?.value;

    if (!customerBranch) {
      missingErrors.push('• Please select Customer Branch from the dropdown.');
      this.vendorInvoiceForm.get('CustomerBranchSid')?.markAsTouched();
    }

    if (!currency) {
      missingErrors.push('• Please select Currency from the dropdown.');
      this.vendorInvoiceForm.get('CurrencyCode')?.markAsTouched();
    }

    if (missingErrors.length > 0) {
      if(missingErrors.length === 1){
        this.appSettingService.showWarning(missingErrors[0]);
        return;
      }
      this.appSettingService.showWarning(
        `Please fill all required fields:\n\n${missingErrors.join('\n')}`
      );
      return;
    }

    // All validations passed
    this.details.push(this.createDetailGroup());
    this.onDetailChange(this.details.length - 1, 'CurrencyCode');
    this.vendorInvoiceForm.updateValueAndValidity();
  }


  createDetailGroup(data?: any): FormGroup {
    const group = this.fb.group({
      VoucherDetailSid: [data?.VoucherDetailSid || null],
      ChargeMasterSid: [data?.ChargeMasterSid || null, !this.isNonJob ? [Validators.required] : []],
      ChargeDescription: [data?.ChargeDescription || ''],
      HSSACMasterSid: [data?.HSSACMasterSid || null],
      ChargeUOMSid: [data?.ChargeUOMSid || null],
      NumberOfUnit: [
        data?.NumberOfUnit || 1,
        [Validators.required, Validators.min(0)],
      ],
      DrCr: [data?.DrCr || 'D', Validators.required],
      CurrencyMasterSid: [
        data?.CurrencyMasterSid ||
          this.vendorInvoiceForm.get('CurrencyMasterSid')?.value ||
          null,
      ],
      CurrencyCode: [
        data?.CurrencyCode ||
          this.vendorInvoiceForm.get('CurrencyCode')?.value ||
          null,
      ],
      Rate: [data?.Rate || 0, [Validators.required, Validators.min(0)]],
      ExchangeRate: [
        data?.ExchangeRate || this.vendorInvoiceForm.get('ExchangeRate')?.value || 0,
      ],
      Amount: [data?.Amount || 0],
      TaxableAmount: [data?.TaxableAmount || 0],
      TaxPercentage1: [data?.TaxPercentage1 || 0],
      TaxAmount1: [data?.TaxAmount1 || 0],
      TaxPercentage2: [data?.TaxPercentage2 || 0],
      TaxAmount2: [data?.TaxAmount2 || 0],
      LocalAmount: [data?.LocalAmount || 0],
      PartyAmount: [data?.PartyAmount || 0],
      MasterJobSid: [data?.MasterJobSid || null],
      HouseJobSid: [data?.HouseJobSid || null],
      DepartmentMasterSid: [data?.DepartmentMasterSid || null],
      LedgerMasterSid: [data?.LedgerMasterSid || null],
      COAMasterSid: [data?.COAMasterSid || null],
      IsAutoGenerated: [data?.IsAutoGenerated === 'Y' || false],

      // Vendor Invoice Specific
      CostRevenueChargesSid: [data?.CostRevenueChargesSid || null],
    });
    this.disableControlsIfVoucherExists(group);
    return group;
  }

  private disableControlsIfVoucherExists(group: FormGroup): void {
    const voucherDetailSid = group.get('VoucherDetailSid')?.value;

    console.log("Cost Revenue Charges Sid",group.get('CostRevenueChargesSid')?.value);
    let fullDisabled = false;
    if (group.get('CostRevenueChargesSid')?.value) {
      Object.keys(group.controls).forEach((controlName) => {
          group.get(controlName)?.disable({ emitEvent: false });
      });
      fullDisabled = true;
    }

    if (!voucherDetailSid || fullDisabled) {
      return;
    }


    const allowedControls = ['Rate', 'ExchangeRate', 'HSSACMasterSid'];

    Object.keys(group.controls).forEach((controlName) => {
      if (!allowedControls.includes(controlName)) {
        group.get(controlName)?.disable({ emitEvent: false });
      }
    });
  }
  

  getDepartmentName(departmentSid: number): string {
    if (!departmentSid || this.departmentList.length === 0) {
      return '-';
    }
    const department = this.departmentList.find(
      dept => dept.DepartmentMasterSid === departmentSid
    );
    return department?.departmentName || '-';
  }

  removeDetailRow(index: number) {
    if (this.details.length > index) this.details.removeAt(index);
    this.vendorInvoiceForm.updateValueAndValidity();
    this.recalculateAllRows();
  }

  onDetailChange(index: number, field?: string) {
    if (this.isPosted) {
      return;
    }

    if (
      [
        'NumberOfUnit', 
        'HSSACMasterSid', 
        'Rate', 
        'ExchangeRate', 
        'TaxPercentage1', 
        'TaxPercentage2', 
        'CurrencyCode',
      ].includes(field || '')) {
      if (field === 'CurrencyCode') {
        const formGroup = this.details.at(index) as FormGroup;
        const fromCurrencyCode = formGroup.get('CurrencyCode')?.getRawValue();
        const selectedCurrency = this.currencyList.find(x => x.currencyCode === fromCurrencyCode);
        formGroup.get('CurrencyMasterSid').setValue(selectedCurrency?.CurrencyMasterSid);
        let toCurrencyCode = this.currentCompanyCurrency.code;
        this.patchExchangeRateForDetail(
          fromCurrencyCode, 
          toCurrencyCode, 
          index
        );
      } else {
        this.recalcRow(index);
      }
    } else if (field === 'ChargeMasterSid') {
      const chargeSid = this.details.at(index).get('ChargeMasterSid')?.value;
      const selectedCharge = this.chargeList?.find(
        (c: any) => c.ChargeMasterSid === chargeSid
      );

      if(!chargeSid || !selectedCharge){
        this.hssacList[index] = [];
        this.details.at(index).patchValue({
          ChargeDescription: '',
          HSSACMasterSid: null,
          ChargeUOMSid: null,
          LedgerMasterSid: null,
          COAMasterSid: null
        },
          { emitEvent: false }
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
            (h) => h.HSSACCode === hsnCode || h.HSNCode === hsnCode
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
      this.onCOAChange({COAMasterSid : selectedCharge?.DrCOAMappedId},index);
      this.recalcRow(index);
    }
  }

  private async recalcRow(index: number) {
    const row = this.details.at(index);
    if (!row) return;
    if (this.isPosted) {
      return;
    }

    const rawValue = row.getRawValue();
    const unit = toNumber(rawValue.NumberOfUnit);
    const rate = toNumber(
      this.getFormattedAmount(
        rawValue.Rate || 0,
        rawValue.CurrencyMasterSid
      )
    );
    const exRate = toNumber(
      this.getFormattedExchangeRate(
        rawValue.ExchangeRate || 0,
        rawValue.CurrencyMasterSid
      )
    );

    // Calculate basic amounts
    const amount = unit * rate;
    const taxableAmount = amount * exRate;
    const localAmount = amount * exRate;

    // Get GST Type and determine tax applicability
    const gstType = this.vendorInvoiceForm.get('GSTType')?.value;
    const placeOfSupply = this.vendorInvoiceForm.get('PlaceOfSupply')?.value;

    // Initialize tax variables
    let cgstRate = 0, sgstRate = 0, igstRate = 0, vatRate = 0;
    let cgstAmt = 0, sgstAmt = 0, igstAmt = 0, vatAmt = 0;

    // Get charge data for tax ledger lookup
    const chargeSid = row.get('ChargeMasterSid')?.value;
    const hssacSid = row.get('HSSACMasterSid')?.value;
    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeSid);
    if (charge || hssacSid) {
      const HSSACMasterSid = row.get('HSSACMasterSid')?.value;
      const hssacListItems = this.isNonJob ? (this.hssacListForNonJob || []) :  (this.hssacList[index] || []);
      const hssacItem = hssacListItems.find(c => c.HSSACMasterSid === HSSACMasterSid);

      if (HSSACMasterSid && hssacItem) {
        let taxLedgers: any[] = [];
        const inputOrOutput: 'Input' | 'Output' = 'Input';
        const companyState = this.currentBranchStateName;
        const currentCountry = Number(this.currentCompany?.CountryMasterSid);
        const vendorCountry = this.getVendorCountry();
        const taxCategory = this.determineTaxCategory(companyState, placeOfSupply, vendorCountry);

        const key = this.buildKey(
          hssacItem?.TaxGroupSid,
          inputOrOutput,
          taxCategory,
          currentCountry
        );

        if (this.taxGroupMap.has(key)) {
          taxLedgers = this.taxGroupMap.get(key);
        } else {
          taxLedgers = await this.getTaxLedgerForHSSAC(
            hssacItem, 
            placeOfSupply
          );
        }

        if (taxLedgers && taxLedgers.length > 0) {
          // Extract individual tax rates from tax master records
          for (const tax of taxLedgers) {
            switch (tax.TaxCode) {
              case 'CGST':
                cgstRate = parseFloat(tax.TaxRate || 0);
                break;
              case 'SGST':
                sgstRate = parseFloat(tax.TaxRate || 0);
                break;
              case 'IGST':
                igstRate = parseFloat(tax.TaxRate || 0);
                break;
              case 'VAT':
                vatRate = parseFloat(tax.TaxRate || 0);
                break;
            }
          }


          // Apply tax based on GST type from form
          if (gstType === 'VAT') {
            // VAT scenario - apply VAT for UAE/non-India
            vatAmt = (taxableAmount * vatRate) / 100;
          } else if (gstType === 'CGST+SGST') {
            // Same state - apply CGST + SGST (India)
            cgstAmt = (taxableAmount * cgstRate) / 100;
            sgstAmt = (taxableAmount * sgstRate) / 100;
          } else if (gstType === 'IGST') {
            // Different state - apply IGST (India)
            igstAmt = (taxableAmount * igstRate) / 100;
          } else if (gstType === 'B2C') {
            if (cgstRate > 0) {
              cgstAmt = (taxableAmount * cgstRate) / 100;
            } else if (igstRate > 0) {
              // IMPORTANT FIX: If we have IGST but GST Type is B2C, we might want to:
              // 1. Apply IGST as the tax amount
              // 2. Or decide based on business logic
              // For now, let's apply IGST for B2C when CGST is not available
              igstAmt = (taxableAmount * igstRate) / 100;
            }
          } else if (gstType === 'EXWP' || gstType === 'EXWOP') {
          } else {
            // Default fallback based on country
            if (this.isIndiaGST) {
              // India default
              igstAmt = (taxableAmount * igstRate) / 100;
            } else {
              // Non-India default (VAT)
              vatAmt = (taxableAmount * vatRate) / 100;
            }
          }
        } else {
          // Fallback to HSSAC tax rate
          this.applyFallbackTax(index, row, taxableAmount, gstType, cgstRate, cgstAmt, sgstRate, sgstAmt, igstRate, igstAmt, vatRate, vatAmt);
        }
      }
    } else {
      this.applyFallbackTax(index, row, taxableAmount, gstType, cgstRate, cgstAmt, sgstRate, sgstAmt, igstRate, igstAmt, vatRate, vatAmt);
    }

    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    // Update row values
    row
      .get('Amount')?.setValue(
        this.getFormattedAmount(amount, companyCurrency)
      );
    row
      .get('TaxableAmount')?.setValue(
        this.getFormattedAmount(taxableAmount, companyCurrency)
      );
    row.get('TaxPercentage1')?.setValue(0.0);
    row
      .get('TaxAmount1')
      ?.setValue(toNumber(this.getFormattedAmount(0.0, companyCurrency)));
    row.get('TaxPercentage2')?.setValue(0);
    row
      .get('TaxAmount2')
      ?.setValue(toNumber(this.getFormattedAmount(0.0, companyCurrency)));

    if (gstType === 'VAT') {
      // VAT - use TaxPercentage1 and TaxAmount1 for VAT
      row.get('TaxPercentage1')?.setValue(vatRate);
      row.get('TaxAmount1')?.setValue(
        toNumber(this.getFormattedAmount(vatAmt, companyCurrency))
      );
    } else if (gstType === 'CGST+SGST') {
      // CGST+SGST
      row.get('TaxPercentage1')?.setValue(cgstRate);
      row.get('TaxAmount1')?.setValue(
        toNumber(this.getFormattedAmount(cgstAmt, companyCurrency))
      );
      row.get('TaxPercentage2')?.setValue(sgstRate);
      row.get('TaxAmount2')?.setValue(
        toNumber(this.getFormattedAmount(sgstAmt, companyCurrency))
      );
    } else if (gstType === 'IGST') {
      const rate = gstType === 'IGST' ? igstRate : cgstRate;
      const amount = gstType === 'IGST' ? igstAmt : cgstAmt;
      row.get('TaxPercentage1')?.setValue(rate);
      row.get('TaxAmount1')?.setValue(
        this.getFormattedAmount(amount, companyCurrency)
      );
    } else {
      // Default based on country
      if (this.isIndiaGST) {
        // India default - use TaxPercentage1 and TaxAmount1
        row.get('TaxPercentage1')?.setValue(igstRate);
        row.get('TaxAmount1')?.setValue(
          this.getFormattedAmount(igstAmt, companyCurrency)
        );
      } else {
        // Non-India default (VAT)
        row.get('TaxPercentage1')?.setValue(vatRate);
        row.get('TaxAmount1')?.setValue(this.getFormattedAmount(vatAmt,companyCurrency));
      }
    }

    row.get('LocalAmount')?.setValue(this.getFormattedAmount(localAmount,companyCurrency));
    row.get('PartyAmount')?.setValue(this.getPartyAmount(index));

    this.updateBillAmount();
    this.vendorInvoiceForm.updateValueAndValidity();
  }

  private applyFallbackTax(
    index: number,
    row: any,
    taxableAmount: number,
    gstType: string,
    cgstRate: number,
    cgstAmt: number,
    sgstRate: number,
    sgstAmt: number,
    igstRate: number,
    igstAmt: number,
    vatRate: number,
    vatAmt: number
  ) {
    const hssacSid = row.get('HSSACMasterSid')?.value;
    const hssac = (this.hssacList[index] || []).find(h => h.HSSACMasterSid === hssacSid);

    // Determine tax rate based on GST type
    if (gstType === 'VAT') {
      // VAT - use 5% as default for UAE/non-India
      vatRate = hssac?.TaxRate || 5;
      vatAmt = (taxableAmount * vatRate) / 100;
      // console.log('Fallback VAT Applied:', { vatRate, vatAmt, taxableAmount });
    } else {
      // India GST - use 18% as default
      const defaultTaxRate = hssac?.TaxRate || 18;

      switch (gstType) {
        case 'CGST+SGST':
          // Same state - split tax rate for CGST and SGST
          cgstRate = defaultTaxRate / 2;
          cgstAmt = (taxableAmount * cgstRate) / 100;
          sgstRate = defaultTaxRate / 2;
          sgstAmt = (taxableAmount * sgstRate) / 100;
          break;
        case 'IGST':
          // Different state - full tax rate for IGST
          igstRate = defaultTaxRate;
          igstAmt = (taxableAmount * igstRate) / 100;
          break;
        case 'B2C':
          // B2C - apply full tax as CGST
          cgstRate = defaultTaxRate;
          cgstAmt = (taxableAmount * cgstRate) / 100;
          break;
        case 'EXWP':
        case 'EXWOP':
          // Export - no tax
          break;
        default:
          // Default to IGST for India, VAT for non-India
          if (this.isIndiaGST) {
            igstRate = defaultTaxRate;
            igstAmt = (taxableAmount * igstRate) / 100;
          } else {
            vatRate = hssac?.TaxRate || 5;
            vatAmt = (taxableAmount * vatRate) / 100;
          }
          break;
      }
    }
  }

  updateBillAmount() {
    const headerCurrency = this.vendorInvoiceForm.get('CurrencyMasterSid')?.getRawValue();
    const totalBillAmount = toNumber(this.getPartyCurrDebitAmt()) - toNumber(this.getPartyCurrCreditAmt());
    this.vendorInvoiceForm.get('BillAmt')?.setValue(
      this.getFormattedAmount(totalBillAmount, headerCurrency)
    );
  }
  calculateTotalBillAmount(): number {
    const partyId = this.vendorInvoiceForm.get('PartyMasterSid')?.getRawValue();
    return this.details.getRawValue().
    filter(det => det.LedgerMasterSid !== partyId)
    .reduce((sum, row: any) => {
      if(row.DrCr === 'D'){
        return sum + (Number(row.PartyAmount) || 0);
      }
      return sum - (Number(row.PartyAmount) || 0);
    }, 0);
  }

  recalculateAllRows() {
    if (this.isPosted) return;
    for (let i = 0; i < this.details.length; i++) {
      const exRateCtrl = this.details.at(i).get('ExchangeRate');
      if (exRateCtrl && (exRateCtrl.value === null || exRateCtrl.value === undefined)) {
        exRateCtrl.setValue(this.vendorInvoiceForm.get('ExchangeRate')?.value || 1);
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

      total += taxAmt1 + taxAmt2;
    }
    return this.getFormattedAmount(
      total,
      this.currentCompany?.CurrencyMasterSid
    )
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
    const chargeName = this.chargeList.find((c: any) => c.ChargeMasterSid === ChargeMasterSid)?.chargeName;
    if (ChargeMasterSid) {
      this.operationService.getChargeTaxForChargeId(ChargeMasterSid).subscribe({
        next: (res: any) => {
          if (res.status) {
            this.hssacList[index] = res.data;
            if (patch) {
              this.details.at(index).patchValue({
                HSSACMasterSid: res.data[0]?.HSSACMasterSid || null,
              });
            }
            this.recalcRow(index);
          } else {
            this.appSettingService.showError(`Error fetching HSSAC details for ${chargeName}`);
            this.hssacList[index] = null;
          }
        },
        error: (err: any) => {
          this.appSettingService.showError(`Error fetching HSSAC details for ${chargeName}`);
          this.hssacList[index] = null;
        }
      });
    }
  }

  onSubmit(
    resolve?: (value:boolean) => void,
    isPostingTrue ?: boolean
  ) {
    const raw = this.vendorInvoiceForm.getRawValue();

    const autoPostingButNoPosted = (this.isAutoPosting && !this.isPosted);
    if (this.isEditMode && autoPostingButNoPosted) {
      this.appSettingService.showWarning(
        'Auto Posting is currently enabled.\n\nPlease switch to Manual Posting and post this vendor invoice first.\nAfter posting, you can switch back to Auto Posting.'
      );
      if(resolve) resolve(false);
      return;
    }

    if(this.deepEqual(raw,this.initialFormValue) && !this.isDirty){
      this.appSettingService.showWarning('No changes to save');
      this.vendorInvoiceForm.markAsUntouched();
      if(resolve) resolve(false);
      return;
    }

    // Enhanced exchange rate validation - checks all three error types
    if (this.vendorInvoiceForm.errors) {
      const hasExchangeRateError =
        this.vendorInvoiceForm.errors['inconsistentExchangeRates'] ||
        this.vendorInvoiceForm.errors['foreignCurrencyRateOne'] ||
        this.vendorInvoiceForm.errors['exchangeRateZero'];

      if (hasExchangeRateError) {
        const errorMsg = getExchangeRateErrorMessage(
          this.vendorInvoiceForm,
          this.currencyList
        );
        this.appSettingService.showError(errorMsg);
        if (resolve) resolve(false);
        return;
      }
    }

    if (this.vendorInvoiceForm.invalid) {
      errorLogger(this.vendorInvoiceForm);
      this.vendorInvoiceForm.markAllAsTouched();
      this.vendorInvoiceForm.updateValueAndValidity();
      this.appSettingService.showError('Please fill all required fields.');
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
      this.operationService.updateVendorInvoiceById(this.headerId, payload).subscribe({
        next: async (resp : any) => {
          this.isSaving = false;
          if (resp.status) {
            this.isDirty= false;
            if(isPostingTrue){
              await this.postVoucher();
            } else {
              this.appSettingService.showSuccess(resp.message);
              this.spinner.hide();
            }
            if(resolve) resolve(true);
            this.loadVendorInvoiceById(this.headerId);
          } else {
            this.appSettingService.showError(resp.message);
            if(resolve) resolve(false);
            this.spinner.hide();
          }
        },
        error: (error) => {
          this.appSettingService.showError('Error updating Vendor Invoice');
          this.isSaving = false;
          if(resolve) resolve(false);
          this.spinner.hide();
        }
      });
    } else {
      // Create new vendor invoice
      this.operationService.createVendorInvoice(payload).subscribe({
        next: async (resp : any) => {
          this.isSaving = false;
          if (resp.status) {
            this.isDirty = false;
            this.headerId = resp?.data?.VoucherHeaderSid;
            if(isPostingTrue) {
              await this.postVoucher();
            } else {
              this.appSettingService.showSuccess(resp.message);
              this.spinner.hide();
            }
            if(resolve) resolve(true);
            if (this.headerId) {
              this.router.navigate(['operation/vendor-invoice/entry', this.headerId],{
                queryParams : {
                  ...(this.isNonJob ? {isNonJob: this.isNonJob} : {})
                }
              });
            }
          } else {
            this.appSettingService.showError(resp.message);
            if(resolve) resolve(false);
            this.spinner.hide();
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.appSettingService.showError('Error creating Vendor Invoice');
          if(resolve) resolve(false);
          this.spinner.hide();
        }
      });
    }
  }

  async postVoucher(notFromSubmit: boolean = false) : Promise<void> {
    try {
      this.spinner.show();
      const voucherHeaderSid = this.headerId;
      const currentCompany = this.currentCompany;
      const currentBranch = this.currentBranch;
      const currentFinancialYear = toNumber(
        localStorage.getItem('current-year-id')
      );

      const currentCompanyCountry = toNumber(this.currentCompany?.CountryMasterSid);
      const currentCompanyState = toNumber(this.currentBranch?.StateMasterSid)
      const currentCurrency = toNumber(this.currentCompany?.CurrencyMasterSid);
      const customerBranchFromForm = toNumber(this.vendorInvoiceForm.get('CustomerBranchSid')?.value);
      const customerState = this.vendorBranchList.find(
        c => c.CustomerBranchSid === customerBranchFromForm
      )
      let interOrIntra = 'Inter';
      // india
      if(this.currentCompanyCountryCode === 'in'){
        if(currentCompanyState === customerState){
          interOrIntra = 'Inter';
        } else {
          interOrIntra = 'Intra';
        }
      } else if(['ae', 'us'].includes(this.currentCompanyCountryCode)){
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
          'Company, branch, or financial year or country information is missing'
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
        TaxDetails: {
          CountryMasterSid: currentCompanyCountry,
          countryCode: this.currentCompanyCountryCode,
          TaxCategory: interOrIntra,
          EffectiveFrom: this.vendorInvoiceForm.get('VoucherDate')?.getRawValue() ?? new Date().toISOString(),
          TaxType: 'Output',
        },
      };

      const result = await firstValueFrom(
        this.operationService.postVoucherByVoucherSid(postPayload)
      );
      this.spinner.hide();
      if(result.status) {
        this.appSettingService.showSuccess(result.message);
        if (notFromSubmit) {
          this.loadVendorInvoiceById(this.headerId);
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
    return this.vendorInvoiceData?.PostStatus === 'P' || false;
  }

  // Check if voucher is draft
  get isDraft(): boolean {
    return !this.vendorInvoiceData?.PostStatus || this.vendorInvoiceData?.PostStatus === 'U';
  }

  onReset() {
    if(this.isEditMode){
      this.patchValues(this.vendorInvoiceData);
    } else {
      this.vendorInvoiceForm.reset({ status : 'A' });
      this.details.clear();
    }
  }

  goBack() {
    this.router.navigate(['operation/vendor-invoice/list']);
  }
  

  calculateTDS() {
    const totalTaxable = this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('TaxableAmount')?.value) || 0);
    }, 0);

    const tdsRate = this.tdsConfig?.tdsRate || 0;
    const tdsAmount = (totalTaxable * tdsRate) / 100;

    this.tdsGroup.patchValue({
      TaxableAmt: toNumber(totalTaxable.toFixed(2)),
      TDSAmt: toNumber(tdsAmount.toFixed(2))
    });
  }


  private getCustomerCountryCode(vendor: any): string {
    return String(vendor?.countryMaster?.countryCode).trim().toLowerCase() || "";
  }

  // onVendorSelect(vendor: any) {
  //   const vendors = (typeof vendor === 'object' && vendor !== null)
  //     ? (vendor.vendors ?? vendor)
  //     : vendor;
  //   if (!vendor) {
  //     this.vendorList = [];
  //     this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
  //     return;
  //   }
  //   this.vendorInvoiceForm.get('PartyAddress')?.setValue(vendor.Address || '');
  // }

  loadVendorTDS(vendorSid: number) {
    this.operationService.getVendorTDSMapping(vendorSid).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.tdsConfig = response.data;

          this.tdsGroup.patchValue({
            TDSSet: this.tdsConfig.tdsSetName || '',
            TDSCompany: this.currentCompany?.CompanyName || '',
            ITSectionType: this.tdsConfig.companyType || '',
            ITSectionCode: this.tdsConfig.itSectionCode || '',
            TDSSetRateSid: this.tdsConfig.tdsSetRateSid || 0,
            CertificateNo: this.tdsConfig.certificateNo || '',
            Percentage: this.tdsConfig.tdsRate || 0
          });

          // Recalculate TDS
          this.calculateTDS();
        } else {
          // No TDS config found
          this.tdsConfig = null;
          this.tdsGroup.patchValue({
            TDSSet: '',
            TDSCompany: '',
            ITSectionType: '',
            ITSectionCode: '',
            TDSSetRateSid: 0,
            CertificateNo: '',
            Percentage: 0,
            TDSAmt: 0
          });
        }
      },
      error: (error) => {
        console.error('Error loading TDS config:', error);
        this.tdsConfig = null;
      }
    });
  }






  private async autoSetHssacForAllPendingCosts() {
    this.allPendingCosts.forEach((cost,index) => {
      if (cost.ChargeMasterSid) {
        const charge = this.chargeList.find((c: any) => c.ChargeMasterSid === cost.ChargeMasterSid);

        if (charge) {
          this.temporaryHssacList[index] = charge.ChargeTaxMaster || [];

          // Also try from ChargeTaxMaster if available
          if (!cost.HSSACMasterSid && Array.isArray(charge.ChargeTaxMaster) && charge.ChargeTaxMaster.length > 0) {
            const firstTaxMapping = charge.ChargeTaxMaster?.[0];

            if (firstTaxMapping) {
              cost.HSSACMasterSid = firstTaxMapping.HSSACMasterSid;
              cost.HSSACCode = firstTaxMapping.HSNCode;
            }

          } else {
            this.temporaryHssacList[index] = [];
          }
        } else {
          this.temporaryHssacList[index] = [];
        }
      }

      // If still no HSSAC code, set default or leave empty
      if (!cost.HSSACCode) {
        cost.HSSACCode = '-';
      }
    });
  }

  onHSSACChange(index: number,tax: any) {
    if(!tax) {
      this.allPendingCosts[index].HSSACMasterSid = null;
      this.allPendingCosts[index].HSSACCode = null;
      return;
    }
    this.allPendingCosts[index].HSSACMasterSid = tax.HSSACMasterSid;
    this.allPendingCosts[index].HSSACCode = tax.HSNCode;
  }

  // Extract unique vendors from costs
  private extractVendorsFromCosts(costs: any[]) {
    const vendorMap = new Map();

    costs.forEach(cost => {
      if (cost.VendorSid && cost.VendorName) {
        if (!vendorMap.has(cost.VendorSid)) {
          const vendor = this.vendorList.find(v => v.CustomerMasterSid === cost.VendorSid);
          vendorMap.set(cost.VendorSid, vendor);
        }
      }
    });

    this.searchVendors = Array.from(vendorMap.values());
    // console.log('Available vendors:', this.searchVendors);
  }







  preparePayload(): any {
    const formValue = this.vendorInvoiceForm.getRawValue();
    const isPatching = this.details.controls.some(row =>
      row.get('CostRevenueChargesSid')?.value
    );

    const patchedIds: number[] = [];
    const patchCostData: any[] = []; // Store cost data to update
    const YearMasterSid = Number(localStorage.getItem('current-year-id'));

   const derivedNarration = `${formValue.BillNo} ${this.datePipe.transform(formValue.BillDate)}  ${formValue.Narration}`; 
    // Add details with CostRevenueChargesSid and job IDs
    const voucherDetailArray = (formValue.voucherDetails || []).map((detail: any, index: number) => {
      const costRevenueChargesSid = detail.CostRevenueChargesSid;

      if (costRevenueChargesSid) {
        patchedIds.push(costRevenueChargesSid);
        patchCostData.push({
          CostRevenueChargesSid: costRevenueChargesSid,
          CostAgentBranchSid: formValue.CustomerBranchSid || detail.CostAgentBranchSid
        });
      }

      return {
        VoucherDetailSid: detail.VoucherDetailSid ? Number(detail.VoucherDetailSid) : null,
        ChargeMasterSid: detail.ChargeMasterSid ?? null,
        ChargeDescription: detail.ChargeDescription || "",
        HSSACMasterSid: detail.HSSACMasterSid ? Number(detail.HSSACMasterSid) : null,
        LedgerMasterSid: detail.LedgerMasterSid ?? null,
        COAMasterSid: detail.COAMasterSid ?? null,
        ChargeUOMSid: detail.ChargeUOMSid ?? null,
        DepartmentMasterSid: detail.DepartmentMasterSid ?? null,
        NumberOfUnit: toNumber(detail.NumberOfUnit),
        CostRevenue : detail.DrCr === 'D' ? "Revenue" : "Cost",
        DrCr: detail.DrCr,
        CurrencyCode: detail.CurrencyCode,
        CurrencyMasterSid: detail.CurrencyMasterSid,
        Sno: index + 1,
        Rate: toNumber(detail.Rate),
        ExchangeRate: toNumber(detail.ExchangeRate),
        Amount: toNumber(detail.Amount),
        TaxableAmount: toNumber(detail.TaxableAmount),
        TaxPercentage1: toNumber(detail.TaxPercentage1),
        TaxAmount1: toNumber(detail.TaxAmount1),
        TaxPercentage2: toNumber(detail.TaxPercentage2),
        TaxAmount2: toNumber(detail.TaxAmount2),
        LocalAmount: toNumber(detail.LocalAmount),
        PartyAmount : toNumber(detail.PartyAmount),
        MasterJobSid: detail.MasterJobSid ?? null,
        HouseJobSid: detail.HouseJobSid ?? null,
        YearMasterSid: YearMasterSid,
        Narration : derivedNarration,
        CostRevenueChargesSid: costRevenueChargesSid || null,
      };
    });

    const totalBillAmount = toNumber(this.getPartyCurrDebitAmt()) - toNumber(this.getPartyCurrCreditAmt());
    const payload: any = {
      ...(this.isEditMode
        ? { UpdatedBy: this.currUserEmail }
        : { CreatedBy: this.currUserEmail }),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherDate : formValue.VoucherDate ? new Date(formValue.VoucherDate) : null,
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
      CurrencyMasterSid: formValue.CurrencyMasterSid ?? null,
      PostStatus: formValue.PostStatus || "U",
      CurrencyCode: formValue.CurrencyCode ?? null,
      ExchangeRate: formValue.ExchangeRate ? toNumber(formValue.ExchangeRate) : 0,
      MasterJobSid: formValue.MasterJobSid,
      HouseJobSid: formValue.HouseJobSid,
      Narration: formValue.Narration,
      Status: String(formValue.Status).charAt(0),
      YearMasterSid: YearMasterSid,
      CashOrBank : formValue.JobOrNonJob ? 'Y' : 'N',

      BillNo: formValue.BillNo,
      BillDate: formValue.BillDate ? new Date(formValue.BillDate) : null,
      BillAmt: totalBillAmount,
      MBLNo: formValue.MBLNo,
      HBLNo: formValue.HBLNo,
      
      VoucherDetail: voucherDetailArray.length > 0 ? voucherDetailArray : undefined,
      
      // Cost revenue pulled from jobs handling
      isPatching: isPatching,
      patchedIds,
      patchCostData
    };


    // Add others
    payload.VoucherOthers = {
      ...formValue.voucherOthers,
      Remarks: formValue.Remarks || ''
    };

    return payload;
  }


  getPartyAmount(detailIndex: number) {
    const detail = (this.details.at(detailIndex) as FormGroup)?.getRawValue();
    const voucherHeaderCurrency = this.vendorInvoiceForm.get('CurrencyMasterSid')?.getRawValue();
    const voucherHeaderExRate = this.vendorInvoiceForm.get('ExchangeRate')?.getRawValue();
    const chargeCurrencyId = detail?.CurrencyMasterSid;


    if (detail?.IsAutoGenerated) {
      return this.getFormattedAmount(toNumber(detail?.PartyAmount), chargeCurrencyId);
    }

    // Same currency → no conversion
    if (chargeCurrencyId === voucherHeaderCurrency) {
      return this.getFormattedAmount(toNumber(detail?.Amount), chargeCurrencyId);
    } else {
      return this.getFormattedAmount(toNumber(detail?.LocalAmount) / toNumber(voucherHeaderExRate), chargeCurrencyId);
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
    CurrencyMasterSid: number
  ): string {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid
    );
    const formattedExchangeRate = this.currencyFormatService.formatExchangeRate({
      value: rate,
      currencyCode: currency?.currencyCode,
    });
    return formattedExchangeRate.toFixed(this.getExchangeRateDecimalPlaces(CurrencyMasterSid));
  }

  /**
   * Get the number of decimal places allowed for exchange rates
   * Example: getExchangeRateDecimalPlaces('USD') returns 3
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

  public getFormattedAmount(
    amount: number | string,
    CurrencyMasterSid: number
  ) {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid
    );
    const input = {
      value: toNumber(amount),
      currencyCode: currency?.currencyCode,
    };
    return this.currencyFormatService.formatAmount(input, false);
  }

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

  patchExchangeRateForDetail(
    fromCurrencyCode: string,
    toCurrencyCode: string,
    index: number
  ) {
    const formGroup = this.details.at(index) as FormGroup;
    const fromCurrencyId = this.currencyList.find(c => c.currencyCode === fromCurrencyCode)?.CurrencyMasterSid;

    if (fromCurrencyCode === toCurrencyCode) {
      formGroup.patchValue({
        ExchangeRate: toNumber(this.getFormattedExchangeRate(1, fromCurrencyId)),
      });
      this.recalcRow(index);
      formGroup.get('ExchangeRate')?.disable();
      return;
    }

    const voucherDate = this.vendorInvoiceForm.get('VoucherDate')?.getRawValue() ?? new Date();
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode,
      toCurrencyCode,
      EffectiveFrom: voucherDate
        ? new Date(voucherDate)
        : new Date(),
      segment: 'cost',
    };

    this.operationService.getExchangeRate(payload).subscribe({
      next: (response: any) => {
        if (response?.status) {
          const formGroup = this.details.at(index) as FormGroup;
          if (response.data) {
            formGroup.patchValue({
              ExchangeRate: toNumber(this.getFormattedExchangeRate(response.data, fromCurrencyId))
            });
            const key = this.buildExchangeRateMapKey(fromCurrencyCode, toCurrencyCode, voucherDate);
            this.exchangeRateMap.set(key, response.data);
          } else {
            formGroup.patchValue({
              ExchangeRate: toNumber(this.getFormattedExchangeRate(0, fromCurrencyId))
            });
            this.appSettingService.showError(response.message);
          }
          formGroup.get('ExchangeRate')?.enable();
          this.recalcRow(index);
        } else {
          formGroup.patchValue({
            ExchangeRate: toNumber(this.getFormattedExchangeRate(0, fromCurrencyId))
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
          ExchangeRate: toNumber(this.getFormattedExchangeRate(0, fromCurrencyId))
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
      this.currentCompany.CurrencyMasterSid
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
      this.currentCompany.CurrencyMasterSid
    );
  }

  getNetCrDr() {
    return this.getFormattedAmount(
      toNumber(this.getTotalLocalCredits()) -
        toNumber(this.getTotalLocalDebits()),
      this.currentCompany.CurrencyMasterSid
    );
  }

  getPartyCurrCreditAmt() {
    const headerCurrency = this.vendorInvoiceForm.get('CurrencyMasterSid')?.getRawValue();
    return this.getFormattedAmount(
      this.details.getRawValue().reduce((sum, dtl: any) => {
        if (dtl.DrCr === 'C') {
          return sum + Number(dtl.PartyAmount);
        }
        return sum;
      }, 0),
      headerCurrency
    );
  }

  getPartyCurrDebitAmt() {
    const headerCurrency = this.vendorInvoiceForm.get('CurrencyMasterSid')?.getRawValue();
    return this.getFormattedAmount(
      this.details.getRawValue().reduce((sum, dtl: any) => {
        if (dtl.DrCr === 'D') {
          return sum + Number(dtl.PartyAmount);
        }
        return sum;
      }, 0),
      headerCurrency
    );
  }

  onCancel() {
    this.router.navigate(['/operation/vendor-invoice/list']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.vendorInvoiceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }


  setToday(fieldName: string, datepicker: any): void {
    const today = new Date();
    this.vendorInvoiceForm.get(fieldName)?.setValue(today);
    datepicker.close();
  }

  // Add this new method to fetch exchange rate
  private fetchExchangeRate(fromCurrencyCode: string, toCurrencyCode: string): void {
    const voucherDate = this.vendorInvoiceForm.get('VoucherDate')?.getRawValue() ?? new Date();
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode: fromCurrencyCode,
      toCurrencyCode: toCurrencyCode,
      EffectiveFrom: voucherDate ? new Date(voucherDate) : new Date(),
      segment: 'cost'
    };

    if (!fromCurrencyCode || !toCurrencyCode) {
      return;
    }

    const fromCurrencyId = this.currencyList.find(c => c.currencyCode === fromCurrencyCode)?.CurrencyMasterSid;

    if (fromCurrencyCode === toCurrencyCode) {
      this.vendorInvoiceForm.patchValue({
        CurrencyMasterSid : fromCurrencyId,
        CurrencyCode: fromCurrencyCode,
        ExchangeRate: this.getFormattedExchangeRate(1, fromCurrencyId),
      });
      this.vendorInvoiceForm.get('ExchangeRate')?.disable();
      return;
    }

    this.operationService.getExchangeRate(payload).subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          if (resp.data) {
            const exchangeRate = Number(resp.data);
            this.vendorInvoiceForm.patchValue({
              CurrencyMasterSid : fromCurrencyId,
              CurrencyCode: fromCurrencyCode,
              ExchangeRate: toNumber(this.getFormattedExchangeRate(exchangeRate, fromCurrencyId))
            });
            const key = this.buildExchangeRateMapKey(fromCurrencyCode, toCurrencyCode, voucherDate);
            this.exchangeRateMap.set(key, resp.data);
          } else {
            this.appSettingService.showError(resp.message);
            this.vendorInvoiceForm.patchValue({
              CurrencyMasterSid : fromCurrencyId,
              CurrencyCode: fromCurrencyCode,
              ExchangeRate: toNumber(this.getFormattedExchangeRate(0, fromCurrencyId))
            });
          }
          this.vendorInvoiceForm.get('ExchangeRate')?.enable();
          this.recalculateAllRows();
        } else {
          // Response status : false
          this.appSettingService.showError(resp.message);
          this.vendorInvoiceForm.patchValue({
            CurrencyMasterSid: fromCurrencyId,
            CurrencyCode: fromCurrencyCode,
            ExchangeRate: this.getFormattedExchangeRate(0, fromCurrencyId),
          });
          this.vendorInvoiceForm.get('ExchangeRate')?.enable();
        }
      },
      error: (err) => {
        console.error('Error fetching exchange rate:', err);
        // Default to 1 if API fails
        this.vendorInvoiceForm.patchValue({
          CurrencyMasterSid : fromCurrencyId,
          CurrencyCode: fromCurrencyCode,
          ExchangeRate: this.getFormattedExchangeRate(0, fromCurrencyId)
        });
        this.vendorInvoiceForm.get('ExchangeRate')?.enable();
      }
    });
  }

  
  /**
   * Get tax ledger for charge - VENDOR INVOICE (INPUT TAX)
   */
  private async getTaxLedgerForHSSAC(
    hssacItem: any,
    placeOfSupplyState: string
  ): Promise<any> {
    try {

      const taxGroupSid = hssacItem?.TaxGroupSid;

      if (!taxGroupSid) {
        return null;
      }

      const currentCountry = Number(this.currentCompany?.CountryMasterSid);

      // VENDOR INVOICE = INPUT (purchasing goods/services)
      const inputOrOutput: 'Input' | 'Output' = 'Output';

      const companyState = this.currentBranchStateName;
      const vendorCountry = this.getVendorCountry();
      const taxCategory = this.determineTaxCategory(companyState, placeOfSupplyState, vendorCountry);


      const payload = {
        taxGroup: taxGroupSid,
        InputOrOutput: inputOrOutput,
        TaxCategory: taxCategory,
        CountryMasterSid: currentCountry
      };
      
      let key = this.buildKey(
        payload.taxGroup,
        payload.InputOrOutput,
        payload.TaxCategory,
        payload.CountryMasterSid
      );

      if (this.taxGroupMap.has(key)) {
        return this.taxGroupMap.get(key);
      }

      const response = await firstValueFrom(
        this.operationService.getLedgerForTaxGroup(payload).pipe(
          catchError(error => {
            console.error('Error calling getLedgerForTaxGroup:', error);
            return of(null);
          })
        )
      );



      if (response?.status && response.data && response.data.length > 0) {
        const taxGroupData = response.data[0];
        // console.log('Tax Group Data:', taxGroupData);

        // Return individual tax master records for proper calculation
        if (taxGroupData.taxMaster && Array.isArray(taxGroupData.taxMaster)) {
          // console.log('Individual Tax Masters found:', taxGroupData.taxMaster);
          const taxMasters = taxGroupData.taxMaster || [];
          this.taxGroupMap.set(key, taxMasters);
          return taxGroupData.taxMaster;
        }

        // Fallback to tax group rate if no individual tax masters
        const taxMasters = taxGroupData;
        this.taxGroupMap.set(key, taxMasters);
        return [taxGroupData];
      } else {
        console.warn('No tax ledger data found for HSSACCOde:', hssacItem?.HSSACCode);
        // this.appSettingService.showError('No tax ledger data found for specified criteria.\n\n Tax : ' + hssacItem?.TaxType + '\n Tax Group : ' + taxGroupSid + '\n Input/Output : ' + inputOrOutput + '\n Country : ' + vendorCountry);
        return null;
      }

    } catch (error) {
      console.error('Error fetching tax ledger:', error);
      return null;
    }
  }

  onCOAChange(coa:any,detailIndex:number,resetSubledger: boolean = true){
    const ctrl = this.details.at(detailIndex) as FormGroup;
    if(resetSubledger){
      ctrl.get('LedgerMasterSid')?.setValue(null);
      ctrl.get('LedgerMasterSid')?.disable();
    }
    if(!coa) {
      this.subledgerListDetail[detailIndex] = [];
      return;
    }
    if(coa.SubledgerName === 'Y'){
      ctrl.get('LedgerMasterSid')?.enable();
      this.operationService.getAllSubledgerByCOA({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        COAMasterSid: coa.COAMasterSid
      }).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.subledgerListDetail[detailIndex] = resp.data || [];
          } else {
            this.appSettingService.showError('Error fetching subledger for COA');
          }
        },
        error: (err) => {
          this.subledgerListDetail[detailIndex] = [];
          ctrl.get('LedgerMasterSid')?.setValue(null);
          ctrl.get('LedgerMasterSid')?.disable();
          console.error('Error fetching subledger for COA', err);
        }
      })
    } else {
      ctrl.get('LedgerMasterSid')?.disable();
    }

  }

  private getVendorCountry(): string {
    const customer = this.vendorList.find(
      (c) => c.SubledgerMasterSid === this.vendorInvoiceForm.get('PartyMasterSid')?.value
    );
    return customer?.countryMaster?.countryCode || "";
  }

  // Replace the existing upload button click handler or add a new method
  openVendorInvoiceUploadModal(): void {
    try {
      const modalRef = this.modalService.open(DocumentVendorInvoiceEntryComponent, {
        size: 'xl',
        backdrop: 'static',
        centered: true,
        windowClass: 'vendor-invoice-upload-modal'
      });

      // Handle the processed data from the document upload component
      modalRef.componentInstance.documentProcessed.subscribe((processedData: any) => {
        // console.log('Received processed data:', processedData);
        this.onVendorInvoiceProcessed(processedData);
        modalRef.close();
      });

      // Handle modal close
      modalRef.componentInstance.documentCleared.subscribe(() => {
        modalRef.close();
      });

      // Handle modal dismissal
      modalRef.result.catch((reason) => {
        // console.log('Modal dismissed:', reason);
      });

    } catch (error) {
      console.error('Error opening vendor invoice upload modal:', error);
      this.appSettingService.showError('Failed to open upload modal');
    }
  }
  // Add this method to handle processed vendor invoice data from document upload
  onVendorInvoiceProcessed(processedData: any): void {
    this.populateFormFromDocument(processedData);
  }

  // Add this method to populate form from document data
  private populateFormFromDocument(data: any): void {
    if (!data) return;

    // Populate header fields
    this.vendorInvoiceForm.patchValue({
      PartyName: data.partyName || '',
      PartyAddress: data.partyAddress || '',
      GSTNo: data.gstNo || '',
      PlaceOfSupply: data.placeOfSupply || '',
      CurrencyCode: data.currencyCode || '',
      ExchangeRate: data.exchangeRate || 0,
      BillNo: data.documentNumber || '',
      BillDate: data.documentDate ? new Date(data.documentDate) : null,
      BillAmt: data.amount || 0,
      MBLNo: data.masterNumber || '',
      HBLNo: data.houseNumber || '',
      MasterJobSid: data.masterJobSid || null,
      HouseJobSid: data.houseJobSid || null,
      Narration: data.narration || '',
      GSTType: data.gstType || ''
    });

    // Clear existing details and populate with new ones
    this.details.clear();

    if (data.voucherDetails && data.voucherDetails.length > 0) {
      data.voucherDetails.forEach((detail: any, index: number) => {
        const detailGroup = this.createDetailGroup({
          ChargeMasterSid: this.findChargeIdByDescription(detail.chargeDescription),
          ChargeDescription: detail.chargeDescription,
          HSSACMasterSid: this.findHssacIdByCode(detail.sacCode, index),
          NumberOfUnit: detail.numberOfUnit || 1,
          Rate: detail.rate || 0,
          Amount: detail.amount || 0,
          TaxableAmount: detail.taxableAmount || 0,
          TaxPercentage1: detail.cgstRate || 0,
          TaxAmount1: detail.cgstAmount || 0,
          TaxPercentage2: detail.sgstRate || 0,
          TaxAmount2: detail.sgstAmount || 0,
          TaxPercentageIGST: detail.igstRate || 0,
          TaxAmountIGST: detail.igstAmount || 0,
          LocalAmount: detail.localAmount || 0,
          PartyAmount: detail.partyAmount || 0,
          MasterJobSid: detail.masterJobSid,
          HouseJobSid: detail.houseJobSid,
          DepartmentMasterSid: detail.departmentMasterSid
        });

        this.details.push(detailGroup);
      });
    }

    // Recalculate all rows after population
    this.recalculateAllRows();
  }

  // Helper methods to find IDs from descriptions/codes
  private findChargeIdByDescription(description: string): number | null {
    if (!description) return null;
    const charge = this.chargeList.find(c =>
      c.ChargeDescription?.toLowerCase().includes(description.toLowerCase()) ||
      c.chargeName?.toLowerCase().includes(description.toLowerCase())
    );
    return charge?.ChargeMasterSid || null;
  }

  private findHssacIdByCode(code: string, index: number): number | null {
    if (!code) return null;
    const hssac = this.hssacList[index].find(h => h.HSSACCode === code);
    return hssac?.HSSACMasterSid || null;
  }
  // eDoc Method
  openEDoc() {
    if (!this.vendorInvoiceData) return;

    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });

    modalRef.componentInstance.item = this.vendorInvoiceData;
    modalRef.componentInstance.idLabel = 'Vendor Invoice Id';
    modalRef.componentInstance.idValue = this.vendorInvoiceData?.VoucherHeaderSid;

    const data: any = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.vendorInvoiceData?.VoucherHeaderSid
    };

    this.commonService.documentData.set(data);
  }

  // Terms & Conditions Method
  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };

    this.masterService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });

          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.vendorInvoiceData?.VoucherHeaderSid;

        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
  }

  // Authority Method
  openAuthority() {
    const MenuMasterSid = localStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;

    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });

    modalRef.componentInstance.menuMasterSid = Number(MenuMasterSid);
    modalRef.componentInstance.documentSid = this.vendorInvoiceData?.VoucherHeaderSid;
  }

  // Email Method
  openEmail() {
    if (!this.vendorInvoiceData) return;

    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });

    modalRef.componentInstance.item = this.vendorInvoiceData;
    modalRef.componentInstance.idLabel = 'Vendor Invoice Id';
    modalRef.componentInstance.idValue = this.vendorInvoiceData?.VoucherHeaderSid;
  }

  openFollowup() {}

  /**
   * Determine tax category based on company state and place of supply
   */
  private determineTaxCategory(companyState: string, billingPartyState: string, vendorCountry: string): 'Inter' | 'Intra' {
    if (!companyState || !billingPartyState) {
      return 'Inter';
    }

    // Normalize country codes for comparison
    const normalizedVendorCountry = vendorCountry?.toLowerCase() || '';
    const isIndianCustomer = normalizedVendorCountry === 'in';
    const isInternationalCustomer = !isIndianCustomer && normalizedVendorCountry !== '';

    // For international customers (like Dubai), use 'Inter' category for VAT
    if (isInternationalCustomer) {
      return 'Inter';
    }

    // For Indian vendors, check if same state or different state
    const normalizedCompanyState = companyState.trim().toLowerCase();
    const normalizedBillingState = billingPartyState.trim().toLowerCase();

    const isSameState = normalizedCompanyState === normalizedBillingState;
    return isSameState ? 'Inter' : 'Intra';
  }



  // Helper methods for tax display logic
  shouldShowCGSTSGST(): boolean {
    if (this.currentCompanyCountryCode !== 'in') return false;

    const gstType = this.vendorInvoiceForm.get('GSTType')?.value;
    return gstType === 'CGST+SGST';
  }

  shouldShowIGST(): boolean {
    if (this.currentCompanyCountryCode !== 'in') return false;

    const gstType = this.vendorInvoiceForm.get('GSTType')?.value;
    return gstType === 'IGST';
  }

  shouldShowVAT(): boolean {
    return this.currentCompanyCountryCode !== 'india';
  }

  getTaxDisplayConfig(): {
    showCGST: boolean;
    showSGST: boolean;
    showIGST: boolean;
    showVAT: boolean;
  } {
    const gstType = this.vendorInvoiceForm.get('GSTType')?.value;
    const isIndia = this.currentCompanyCountryCode === 'india';

    if (!isIndia) {
      // Non-India countries (like UAE) - show VAT only
      return {
        showCGST: false,
        showSGST: false,
        showIGST: false,
        showVAT: true
      };
    }

    // India GST logic
    if (gstType === 'CGST+SGST') {
      // Same state - show CGST and SGST
      return {
        showCGST: true,
        showSGST: true,
        showIGST: false,
        showVAT: false
      };
    } else if (gstType === 'IGST') {
      // Different state - show IGST only
      return {
        showCGST: false,
        showSGST: false,
        showIGST: true,
        showVAT: false
      };
    } else if (gstType === 'B2C') {
      // B2C - show CGST only (for B2C in India)
      return {
        showCGST: true,
        showSGST: false,
        showIGST: false,
        showVAT: false
      };
    } else if (gstType === 'VAT') {
      // VAT (shouldn't happen for India, but just in case)
      return {
        showCGST: false,
        showSGST: false,
        showIGST: false,
        showVAT: true
      };
    }

    // Default: Show all GST columns for India
    return {
      showCGST: true,
      showSGST: true,
      showIGST: true,
      showVAT: false
    };
  }

  getTaxPercentageForDisplay(detail: any): {
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    vatRate: number;
  } {
    const gstType = this.vendorInvoiceForm.get('GSTType')?.value;

    if (gstType === 'CGST+SGST') {
      return {
        cgstRate: detail.TaxPercentage1 || 0,
        sgstRate: detail.TaxPercentage2 || 0,
        igstRate: 0,
        vatRate: 0
      };
    } else if (gstType === 'IGST') {
      return {
        cgstRate: 0,
        sgstRate: 0,
        igstRate: detail.TaxPercentageIGST || 0,
        vatRate: 0
      };
    } else if (gstType === 'B2C') {
      return {
        cgstRate: detail.TaxPercentage1 || 0,
        sgstRate: 0,
        igstRate: 0,
        vatRate: 0
      };
    } else if (gstType === 'VAT') {
      return {
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
        vatRate: detail.TaxPercentage1 || 0
      };
    }

    return {
      cgstRate: detail.TaxPercentage1 || 0,
      sgstRate: detail.TaxPercentage2 || 0,
      igstRate: detail.TaxPercentageIGST || 0,
      vatRate: detail.TaxPercentage1 || 0
    };
  }

  getTaxAmountForDisplay(detail: any): {
    cgstAmt: number;
    sgstAmt: number;
    igstAmt: number;
    vatAmt: number;
  } {
    const gstType = this.vendorInvoiceForm.get('GSTType')?.value;

    if (gstType === 'CGST+SGST') {
      return {
        cgstAmt: detail.TaxAmount1 || 0,
        sgstAmt: detail.TaxAmount2 || 0,
        igstAmt: 0,
        vatAmt: 0
      };
    } else if (gstType === 'IGST') {
      return {
        cgstAmt: 0,
        sgstAmt: 0,
        igstAmt: detail.TaxAmountIGST || 0,
        vatAmt: 0
      };
    } else if (gstType === 'B2C') {
      return {
        cgstAmt: detail.TaxAmount1 || 0,
        sgstAmt: 0,
        igstAmt: 0,
        vatAmt: 0
      };
    } else if (gstType === 'VAT') {
      return {
        cgstAmt: 0,
        sgstAmt: 0,
        igstAmt: 0,
        vatAmt: detail.TaxAmount1 || 0
      };
    }

    return {
      cgstAmt: detail.TaxAmount1 || 0,
      sgstAmt: detail.TaxAmount2 || 0,
      igstAmt: detail.TaxAmountIGST || 0,
      vatAmt: detail.TaxAmount1 || 0
    };
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
    if (config.showIGST) baseColumns += 2; // IGST % + IGST Amt
    if (config.showVAT) baseColumns += 2;  // VAT % + VAT Amt

    return baseColumns;
  }



  // Add this method to get placeholder text
  getSearchPlaceholder(): string {
    switch (this.searchType) {
      case 'Master Job': return 'Enter Master Job Number';
      case 'House Job': return 'Enter House Job Number';
      case 'MBL No': return 'Enter MBL Number';
      case 'HBL No': return 'Enter HBL Number';
      case 'Container No': return 'Enter Container Number';
      default: return 'Enter search value';
    }
  }




  getChargeCode(chargeSid: number): string {
    if(!chargeSid || !this.chargeList) return '-';
    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeSid);
    return charge?.chargeCode || '-';
  }
  showInfo() {
    if (!this.vendorInvoiceData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.vendorInvoiceData;
    modalRef.componentInstance.idLabel = 'Vendor Invoice Id';
    modalRef.componentInstance.idValue = this.vendorInvoiceData?.VoucherHeaderSid;
  }


  // Get OS Section

  // Search Pending Costs
  openSearchCostsModal() {
    if (!this.searchCostsModalRef) {
      this.appSettingService.showError('Search modal template not found');
      return;
    }

    this.searchType = 'Master Job';
    this.searchValue = '';
    this.allPendingCosts = [];
    this.searchVendors = [];
    this.selectedVendorForCosts = null;
    this.initTemporaryForm();
    this.searchCostsModalInstance = this.modalService.open(this.searchCostsModalRef, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
  }

  initTemporaryForm() {
    const companyCurrencyId = this.currentCompany.CurrencyMasterSid || this.currentCompanyCurrency.currencyMasterSid;
    const companyCurrencyCode = this.currentCompanyCurrency.code;
    this.temporaryForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }], // auto generated
      VoucherDate: [new Date(), Validators.required], // default
      PartyMasterSid: [null], // based on dropdown choose for search
      PartyName: [null, Validators.required], // based on dropdown choose for search
      PartyAddress: [{ value: '', disabled: true },Validators.required], // based on dropdown choose for search
      COAMasterSid :[null], // based on dropdown choose for search
      CustomerBranchSid: [null], // based on dropdown choose for search
      DocumentNumber : [''],
      IRNNumber : [''],
      MasterJobSid : [null],
      HBLNo : [{value: '', disabled: true}],
      CurrencyMasterSid : [companyCurrencyId, Validators.required],
      CurrencyCode : [companyCurrencyCode || "", Validators.required],
      ExchangeRate : [
        { value: 1, disabled: true }, 
        [Validators.required, Validators.min(0)]
      ],
      GST_VAT: [''],
      PlaceOfSupply: [''],
      PostStatus: ['U'],
      GSTType: [''],
      InvoiceType: ['REG'],
      Narration: [''],
      Remarks : [''],
      IRNStatus : [''],
      MBLNo : [{value: '', disabled: true}],
      Status: ['A',[Validators.required]],

      DepartmentMasterSid: [null],
      BillNo: ['', Validators.required],
      BillDate: [null, Validators.required],
      BillAmt: [0, [Validators.required, Validators.min(0)]],
      HouseJobSid: [null],
      PostedOn: [{ value: null, disabled: true }],
      
      // Details Array
      voucherDetails: this.fb.array([]),
    });
  }

    // Add this method to handle search type change
  onSearchTypeChange(event: any): void {
    // Reset search value when type changes
    this.searchValue = '';
    this.selectedVendorForSearch = null;
  }

  // Add this method to handle vendor selection in search
  onVendorSearchSelect(vendor: any): void {
    if (vendor) {
      this.selectedVendorForSearch = vendor;
      this.searchValue = vendor.CustomerName || vendor.customerName || '';

      // Clear previous branch selection
      this.selectedVendorBranchForSearch = null;

      // Load vendor branches for selection
      this.getVendorBranchByVendor(vendor.CustomerMasterSid);
    } else {
      this.selectedVendorForSearch = null;
      this.selectedVendorBranchForSearch = null;
      this.searchValue = '';
    }
  }

  onVendorBranchSearchSelect(branch: any): void {
    this.selectedVendorBranchForSearch = branch;
  }

  
  searchPendingCostsAction() {
    if (!this.searchValue.trim()) {
      this.appSettingService.showWarning('Please enter a search value');
      return;
    }

    this.searchResultsLoading = true;

    // Prepare payload with vendor branch information
    const payload: any = {
      searchType: this.searchType,
      searchValue: this.searchValue.trim(),
      companyMasterSid: this.currentCompany?.CompanyMasterSid,
      branchMasterSid: this.currentBranch?.BranchMasterSid
    };

    if (this.selectedVendorForSearch) {
      payload.vendorSid = this.selectedVendorForSearch.CustomerMasterSid;
      if (this.selectedVendorBranchForSearch) {
        payload.vendorBranchSid = this.selectedVendorBranchForSearch.CustomerBranchSid;
      }
    }

    if(this.searchType === "Vendor Name" && (!payload.vendorSid || !payload.vendorBranchSid)){
      this.appSettingService.showWarning('Please select a vendor and a branch');
      return;
    }

    this.operationService.searchPendingCosts(payload).subscribe({
      next: (response) => {
        this.searchResultsLoading = false;
        this.searchPerformed = true;

        if (response.status && response.data) {
          this.allPendingCosts = response.data.items;
          this.autoSetHssacForAllPendingCosts();

          if(this.searchType === 'Vendor Name'){
            this.selectedVendorForCosts = this.selectedVendorForSearch;
            this.handleMultipleVendorChange(this.selectedVendorForSearch);
            this.onVendorBranchChangeForTemp(this.selectedVendorBranchForSearch);
          }

          const branchCounts = new Map();
          // Auto-populate vendor branch information from search
          if (this.allPendingCosts.length > 0) {
            if (!this.selectedVendorBranchForSearch) {
              // Find the most common branch in the results
              this.allPendingCosts.forEach(cost => {
                if (cost.CostAgentBranchSid) {
                  branchCounts.set(cost.CostAgentBranchSid,
                    (branchCounts.get(cost.CostAgentBranchSid) || 0) + 1);
                }
              });

              if (branchCounts.size > 0) {
                const mostCommonBranch = Array.from(branchCounts.entries())
                  .sort((a, b) => b[1] - a[1])[0][0];

                // Find the branch object
                const vendorBranches = this.vendorBranchList.filter(
                  b => b.CustomerMasterSid === this.selectedVendorForSearch.CustomerMasterSid
                );

                this.selectedVendorBranchForSearch = vendorBranches.find(
                  b => b.CustomerBranchSid === mostCommonBranch
                );
              }
            }
          }

          if (this.allPendingCosts.length > 0) {
            // Extract unique vendors for selection
            this.extractVendorsFromCosts(this.allPendingCosts);

            // Set job information from the first result
            if (this.allPendingCosts.length > 0) {
              const firstCost = this.allPendingCosts[0];
              if (firstCost.MasterJobSid) {
                this.temporaryForm.patchValue({
                  MasterJobSid: firstCost.MasterJobSid,
                  MBLNo: firstCost.MBLNo || ''
                });
              }
              if (firstCost.HouseJobSid) {
                this.temporaryForm.patchValue({
                  HouseJobSid: firstCost.HouseJobSid,
                  HBLNo: firstCost.HBLNo || ''
                });
              }
            }

            this.appSettingService.showSuccess(`Found ${this.allPendingCosts.length} pending costs`);
          } else {
            this.appSettingService.showInfo('No pending costs found');
            this.allPendingCosts = [];
            this.searchVendors = [];
            this.selectedVendorBranchForSearch = null;
          }
        } else {
          this.appSettingService.showError(response.message || 'No pending costs found');
          this.allPendingCosts = [];
          this.searchVendors = [];
          this.selectedVendorBranchForSearch = null;
        }
      },
      error: (error) => {
        this.searchResultsLoading = false;
        this.searchPerformed = true;
        this.appSettingService.showError('Error searching pending costs');
        console.error('Error:', error);
      }
    });
  }

  handleMultipleVendorChange(vendor: any) {
    if (!vendor){
      this.vendorBranchList = [];
      this.temporaryForm.get('CustomerBranchSid')?.setValue(null);
      this.temporaryForm.get('PartyAddress')?.setValue('');
      this.temporaryForm.get('PartyMasterSid')?.setValue(null);
      this.temporaryForm.get('COAMasterSid')?.setValue(null);
      this.temporaryForm.get('GST_VAT')?.setValue('');
      this.temporaryForm.get('PartyName')?.setValue(null);
      this.temporaryForm.get('PlaceOfSupply')?.setValue('');
      // Set default Invoice Type based on country
      if (this.currentCompanyCountryCode === 'in') {
        this.temporaryForm.get('InvoiceType')?.setValue('B2B');
      } else {
        this.temporaryForm.get('InvoiceType')?.setValue('REG');
      }
      this.temporaryForm.get('GSTType')?.setValue('');
      return;
    } 

    const countryCode = this.getCustomerCountryCode(vendor);
    
    // Check if customer has GST in any branch to determine B2B vs B2C
    const vendorBranches = this.vendorBranchList.filter(
      (b) => b.CustomerMasterSid === vendor.CustomerMasterSid
    );
    const hasGSTInBranches = vendorBranches.some(
      (branch) => branch.GSTNo && branch.GSTNo?.trim() !== ''
    );

    // Set vendor information in main form
    this.temporaryForm.patchValue({
      PartyName: vendor.CustomerName || null,
      PartyMasterSid: vendor.SubledgerMasterSid,
      COAMasterSid: vendor.COAMappedId,
      GST_VAT: (countryCode === 'in' ? vendor.GSTNo : vendor.PanType),
    })

    // Reset branch selection when vendor changes
    this.temporaryForm.get('CustomerBranchSid')?.setValue(null);
    this.temporaryForm.get('PartyAddress')?.setValue('');
    this.temporaryForm.get('PlaceOfSupply')?.setValue('');
    this.temporaryForm.get('GSTType')?.setValue('');
    this.getVendorBranchByVendor(vendor.CustomerMasterSid);
  }

  onVendorBranchChangeForTemp(selectedBranch: any) {
    const branchSid = (typeof selectedBranch === 'object' && selectedBranch !== null)
      ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
      : selectedBranch;

    if (!branchSid) {
      this.temporaryForm.get('PartyAddress')?.setValue('');
      this.temporaryForm.get('PlaceOfSupply')?.setValue('');
      this.temporaryForm.get('GSTType')?.setValue('');
      return;
    }

    const foundBranch = this.vendorBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));
    const placeOfSupply = foundBranch?.stateMaster?.stateName || "";

    if (foundBranch) {
      this.temporaryForm.patchValue({
        CustomerBranchSid : branchSid,
        PartyAddress : foundBranch.Address,
        PlaceOfSupply : placeOfSupply
      })

    } else {
      this.temporaryForm.get('PartyAddress')?.setValue('');
      this.temporaryForm.get('PlaceOfSupply')?.setValue('');
    }
    this.determineGSTTypeForTemp(placeOfSupply);
  }

  determineGSTTypeForTemp(placeOfSupply: string) {
    if (!placeOfSupply) {
      this.temporaryForm.get('GSTType')?.setValue('');
      return;
    }

    const vendorGSTNo = this.temporaryForm.get('GST_VAT')?.value;
    const invoiceType = this.temporaryForm.get('InvoiceType')?.value;
    const normalizedCompanyState = this.currentBranchStateName?.trim().toLowerCase();
    const normalizedPlaceOfSupply = placeOfSupply?.trim().toLowerCase();

    const hasValidGST =
      vendorGSTNo &&
      vendorGSTNo.trim() !== '' &&
      vendorGSTNo !== undefined

    if (!this.isIndiaGST) {
      this.temporaryForm.get('GSTType')?.setValue('VAT');
      return;
    }

    if (this.isIndiaGST) {
      if (invoiceType === 'EXWP' || invoiceType === 'EXWOP') {
        this.temporaryForm.get('GSTType')?.setValue('EXWP');
        return;
      }

      if (hasValidGST) {
        if (normalizedPlaceOfSupply === normalizedCompanyState) {
          this.temporaryForm.get('GSTType')?.setValue('CGST+SGST');
        } else {
          this.temporaryForm.get('GSTType')?.setValue('IGST');
        }
      } else {
        this.temporaryForm.get('GSTType')?.setValue('B2C');
      }
    }
  }



  toggleCostSelection(costSid: number) {
    if (this.selectedCosts.has(costSid)) {
      this.selectedCosts.delete(costSid);
    } else {
      this.selectedCosts.add(costSid);
    }
  }

  addSelectedCosts() {
    const selectedCostItems = this.allPendingCosts.filter(cost => cost.selected);

    if (selectedCostItems.length === 0) {
      this.appSettingService.showWarning('Please select at least one cost');
      return;
    }

    // Check if all selected costs belong to the same vendor
    const uniqueVendors = new Set(selectedCostItems.map(cost => cost.VendorSid));
    if (uniqueVendors.size > 1) {
      this.appSettingService.showWarning('Selected costs belong to different vendors. Please select costs from one vendor only.');
      return;
    }

    // Check if vendor branch is selected (required for vendor name search)
    if (this.searchType === 'Vendor Name' && !this.selectedVendorBranchForSearch) {
      this.appSettingService.showWarning('Please select a vendor branch for the vendor costs');
      return;
    }

    // Check if every charge has a ledger and subledger mapped
    const allChargeHasLedgers = selectedCostItems.every(cost => {
      const selectedCharge = this.chargeList.find(c => c.ChargeMasterSid === cost.ChargeMasterSid);
      return selectedCharge?.SubledgerMasterSid && selectedCharge?.DrCOAMappedId;
    });

    const unmappedCharges = selectedCostItems
      .map(cost => {
        const charge = this.chargeList.find(
          c => c.ChargeMasterSid === cost.ChargeMasterSid
        );

        if (!charge?.SubledgerMasterSid || !charge?.DrCOAMappedId) {
          return {
            ChargeMasterSid: cost.ChargeMasterSid,
            ChargeName: charge?.ChargeName || cost.ChargeDescription,
            missingSubledger: !charge?.SubledgerMasterSid,
            missingDrCOA: !charge?.DrCOAMappedId
          };
        }

        return null;
      })
      .filter(Boolean);

    if (unmappedCharges.length > 0) {
      const message = unmappedCharges
        .map(c => {
          const missing = [];
          if (c.missingDrCOA) missing.push('Debit COA');

          return `• ${c.ChargeName} → Missing: ${missing.join('')}`;
        })
        .join('\n');

      this.appSettingService.showError(
        `Ledger Mapping Incomplete
The following charges are not properly mapped:
${message}
Please configure the missing mappings and try again.`
      );

      return; // stop further processing
    }


    // Check if single Master Job Selected
    const uniqueMasterJobs = new Set(
      selectedCostItems.map(cost => ({
        MasterJobSid: cost.MasterJobSid,
        MBLNo : cost.MBLNo,
      }))
    );

    const uniqueMasterJobCount = uniqueMasterJobs.size;
    
    const uniqueHouseJobs = new Set(
      selectedCostItems.map(cost => ({
        HouseJobSid: cost.HouseJobSid,
        HBLNo : cost.HBLNo,
      }))
    );

    const uniqueHouseJobCount = uniqueHouseJobs.size;

    // Store job information from the first selected cost
    // const firstCost = selectedCostItems[0];

    // Update the main form with job information
    // if (firstCost.MasterJobSid) {
    //   this.vendorInvoiceForm.patchValue({
    //     MasterJobSid: firstCost.MasterJobSid,
    //     MBLNo: firstCost.MBLNo || ''
    //   });
    // }

    // if (firstCost.HouseJobSid) {
    //   this.vendorInvoiceForm.patchValue({
    //     HouseJobSid: firstCost.HouseJobSid,
    //     HBLNo: firstCost.HBLNo || ''
    //   });
    // }
    const data = this.temporaryForm.getRawValue();
    this.vendorInvoiceForm.patchValue({
      CustomerMasterSid: data.CustomerMasterSid || null,
      CustomerBranchSid: data.CustomerBranchSid || null,
      PartyMasterSid: data.PartyMasterSid || null,
      PartyName: data.PartyName || '',
      PartyAddress: data.PartyAddress || '',
      COAMasterSid : data.COAMasterSid || null,
      PlaceOfSupply: data.PlaceOfSupply,
      PostStatus: data.PostStatus,
      MasterJobSid: data.MasterJobSid,
      HBLNo: data.MBLNo,
      CurrencyMasterSid: data.CurrencyMasterSid || null,
      CurrencyCode: data.CurrencyCode || '',
      ExchangeRate: toNumber(data.ExchangeRate),
      GST_VAT: data.GST_VAT || "",
      InvoiceType: data.InvoiceType || null,
      GSTType: data.GSTType || null,
      Narration: data.Narration || '',
      Remarks: data.Remarks || '',
      MBLNo: data.MBLNo,
      Status: data.Status,
      
      PostedOn: data.PostDate ? new Date(data.PostDate) : null,
      BillNo: data.DocumentNumber,
      BillDate: data.DocumentDate ? new Date(data.DocumentDate) : null,
      BillAmt: data.Amount || 0,
      HouseJobSid: data.HouseJobSid,
    });

    if(uniqueMasterJobCount === 1){
      const data = Array.from(uniqueMasterJobs)[0];
      this.vendorInvoiceForm.patchValue({
        MasterJobSid: data.MasterJobSid,
        MBLNo: data.MBLNo
      });
    }

    if(uniqueHouseJobCount === 1){
      const data = Array.from(uniqueHouseJobs)[0];
      this.vendorInvoiceForm.patchValue({
        HouseJobSid: data.HouseJobSid,
        HBLNo: data.HBLNo
      });
    }

    selectedCostItems.forEach((cost:any,index:number) => {

      const selectedCharge = this.chargeList.find(c => c.ChargeMasterSid === cost.ChargeMasterSid);
    

      const detailRow = this.createDetailGroup({
        CostRevenueChargesSid: cost.CostRevenueChargesSid,
        Sno : index + 1,
        ChargeMasterSid: cost.ChargeMasterSid,
        ChargeDescription: cost.ChargeDescription,
        LedgerMasterSid: selectedCharge?.SubledgerMasterSid || null,
        COAMasterSid: selectedCharge?.DrCOAMappedId || null,
        HSSACMasterSid: cost.HSSACMasterSid,
        HSSACCode: cost.HSSACCode || cost.HSNCode,
        ChargeUOMSid: cost.ChargeUOMSid,
        NumberOfUnit: cost.NumberOfUnit || 1,
        DrCr : cost.DrCr,
        Rate: cost.Rate || 0,
        Amount : cost.CostAmount || 0,
        TaxableAmount : cost.LocalAmount || 0,
        LocalAmount : cost.LocalAmount || 0,
        CurrencyMasterSid: cost.CurrencyMasterSid || this.temporaryForm.get('CurrencyMasterSid')?.value,
        CurrencyCode: cost.CurrencyCode || this.temporaryForm.get('CurrencyMasterSid')?.value,
        ExchangeRate: toNumber(cost.CostExchangeRate) || 0,
        MasterJobSid: cost.MasterJobSid,
        HouseJobSid: cost.HouseJobSid,
        DepartmentMasterSid : cost.DepartmentMasterSid,
        // Include the CostAgentBranchSid for updating
        CostAgentBranchSid: this.selectedVendorBranchForSearch?.CustomerBranchSid || cost.CostAgentBranchSid
      });
      this.details.push(detailRow);
      this.onDetailChange(index, 'CurrencyCode');
      this.fetchHSN(index);
      this.onDetailMasterJobSelected({ MasterJobSid : cost.MasterJobSid , DepartmentMasterSid : cost.DepartmentMasterSid || null},index);
      // this.subscribeToRowChanges(detailRow);
    });

    this.recalculateAllRows();
    this.closeSearchCostsModal();
    this.appSettingService.showSuccess(`${selectedCostItems.length} cost(s) added successfully`);
  }

  // Select/Deselect all costs
  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.allPendingCosts.forEach(cost => cost.selected = checked);
  }

  // Check if all costs are selected
  isAllSelected(): boolean {
    return this.allPendingCosts.length > 0 &&
      this.allPendingCosts.every(c => c.selected);
  }

  // Get selected costs
  getSelectedCosts(): any[] {
    return this.allPendingCosts.filter(cost => cost.selected);
  }

  closeSearchCostsModal() {
    this.searchCostsModalInstance?.close();
    this.selectedVendorForCosts = null;
    this.searchVendors = [];
    this.allPendingCosts = [];
    this.selectedVendorForSearch = null;
    this.selectedVendorBranchForSearch = null;
    this.temporaryForm.reset();
  }
  

}
