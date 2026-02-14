import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
  FormsModule,
  ValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import {
  NgbModal,
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDate,
  NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { catchError, debounceTime, distinctUntilChanged, firstValueFrom, forkJoin, Observable, of, Subject, takeUntil } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { OperationService } from 'src/app/modules/operation/operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import {
  CompanySettingsManagerService,
  CurrencySettings,
} from 'src/app/core/services/company-settings-manager.service';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { MasterService } from 'src/app/modules/master/master.service';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { TaxCalculationService } from '../../services/tax-calculation.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { getDefaultTodayDate, toNgbDateStruct, toNumber } from 'src/app/common/helper';
import { VoucherPeriodValidationService, VoucherDateConstraints } from 'src/app/common/voucher-period-validation.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { ToastrService } from 'ngx-toastr';
import {
  consistentExchangeRatesValidator,
  getExchangeRateErrorMessage,
} from 'src/app/core/ValidationFn/exRateConsistency.validators';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { LogoService } from 'src/app/core/services/logo.service';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { greaterThanZero } from 'src/app/core/ValidationFn/greaterThanZero.validators';

interface NgbDateStructLike {
  day: number;
  month: number;
  year: number;
}

@Component({
  selector: 'app-invoice-entry',
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
    PreventMultiClickDirective,
    DecimalPrecisionDirective,
    RouterModule
  ],
  templateUrl: './invoice-entry.component.html',
  styleUrls: ['./invoice-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
  ],
})
export class InvoiceEntryComponent implements OnInit,HasUnsavedChanges , OnDestroy {
  // Datas from Session Storage
  userData: any;
  currUserEmail: string | null = null;
  currentCompany: any;
  currentBranch: any;
  currentCompanyCountry: {
    CountryMasterSid: number;
    countryName: string;
    countryCode: string;
  };
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
  currentCurrency: CurrencySettings;
  currentBranchCityId: number;
  currentBranchCityName: string | null;
  salesmanFetched : boolean = false;
  salesmanName : string | null = null;

  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;

  invoiceForm!: FormGroup;
  dueDate : any;
  headerId: number | null = null;
  invoiceData: any;
  currentMenuId: number;
  isViewMode: boolean = false;
  get isEditMode() {
    return !!this.headerId && !this.isViewMode;
  }
  
  // ViewChild references for modals
  @ViewChild('printModal') printModalRef: any;
  @ViewChild('emailModal') emailModalRef: any;
  
  // lookups
  customerList: any[] = [];
  customerBranchList: any[] = [];
  currencyList: any[] = [];
  chargeList: any[] = [];
  hssacList: any[][] = [];
  subledgerList: any[] = [];
  uomList: any[] = [];
  departmentList: any[] = [];
  masterJobList: any[] = [];
  houseJobList: any[] = [];
  taxGroupList: any[] = [];
  chargeTaxGroupMap: Map<number, any> = new Map();
  masterHouseMap: Map<number, any[]> = new Map();
  
  //  Dropdown configs
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  HSSACLookupConfig = DROPDOWN_CONFIGS.HSSAC_TAX;
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  masterJobLookupConfig = DROPDOWN_CONFIGS.MASTER_JOB;
  @ViewChild('uninvoicedChargesModal') uninvoicedChargesModalRef: any;
  uninvoicedChargesList: any[] = [];
  selectedUninvoicedCharges: Set<number> = new Set();
  jobMenuMasterSid: number | null = null;
  transactionSid: number | null = null;
  
  // UI state
  selectedTab = 'Invoice';
  invoicePrintData : any;
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }
  tabs = [
    { name: 'Invoice', icon: 'fas fa-file-invoice' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
  ];

  invoiceTypes = [
    { id: 'REG', name: 'Regular' },
    { id: 'REIMB', name: 'Reimbursement' },
    { id: 'BOS', name: 'Bill of Supply' },
    { id: 'NONGST', name: 'Non GST/Zero' },
  ];
  
  gstTypes = [
    { id: 'B2B', name: 'B2B - Business to Business' },
    { id: 'B2C', name: 'B2C - Business to Customer' },
    { id: 'EXWP', name: 'Export With Payment' },
    { id: 'EXWOP', name: 'Export Without Payment' },
  ];
  
  ModeofStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];

  hyperLinkInfo = {
    id : null,
    number : null,
    path : null,
    label : null
  }
  
  
  filteredDetailItems: any[] = [];
  currentDate = new Date();
  isAutoPosting : boolean = false;

  // Voucher period constraints
  voucherConstraints: VoucherDateConstraints = {
    isClosed: false, errorMessage: null
  };
  
  // Declaration not exist in Vendor Invoice
  TandCFetched : boolean = false;
  TandCList: any[] = [];
  isBankFetched : boolean = false;
  bankDetails: any;
  emailForm!: FormGroup;

  // Unsaved changes related varaible declarations
  isDirty : boolean = false;
  isSaving : boolean = false;
  private initialFormValue : any = null;
  private destroy$ = new Subject<void>();

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
  
  private pendingBranchToSelect: number | null = null;
  
  // Tax display mode based on country
  get isIndiaGST(): boolean {
    return this.currentCompanyCountryCode === 'in';
  }

  get isVATMode(): boolean {
    return this.currentCompanyCountryCode !== 'in'; // VAT for non-India countries
  }

  get f(): { [key: string]: AbstractControl } {
    return this.invoiceForm.controls;
  }
  get details(): FormArray {
    return this.invoiceForm.get('voucherDetails') as FormArray;
  }

  get others(): FormGroup {
    return this.invoiceForm.get('voucherOthers') as FormGroup;
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private operationService: OperationService,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private companySettings: CompanySettingsManagerService,
    public mps: MenuPermissionService,
    private commonService: CommonService,
    private taxCalculationService: TaxCalculationService,
    private currencyConfigService: CurrencyConfigurationService,
    private currencyFormatter: CurrencyFormatService,
    private pdfService: PdfDownloadService,
    private pdfMakeService: PdfMakeService,
    private toastr: ToastrService,
    public logoService: LogoService,
    private numberToWords: NumberToWordsService,
    private voucherPeriodService: VoucherPeriodValidationService
  ) {}

  ngOnInit(): void {
    // Try accessing User related Properties
    try {
      const userProfile = this.appSettingService.getDecryptedUserProfile();
      if (userProfile) {
        this.userData = userProfile;
        this.currUserEmail = userProfile.userEmail;
      }

      // Getting Data from appSettingService
      this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
      this.currentBranch = this.appSettingService.getCurrentBranchInfo();
      this.currentCompanyCountry = this.appSettingService.getCurrentCompanyCountry();
      this.currentCompanyCurrency = this.companySettings.getCurrencySettings();
      this.currentBranchState = this.appSettingService.getCurrentBranchState();
      this.currentBranchCity = this.appSettingService.getCurrentBranchCity();
      const currentFinancialYear =
      this.appSettingService.getCurrentFinancialYear();

      if (currentFinancialYear) {
        this.fyMinDate = toNgbDateStruct(currentFinancialYear.StartDate);
        this.fyMaxDate = toNgbDateStruct(currentFinancialYear.EndDate);
      }

      // Getting Menu Id from MenuPermissionService
      this.currentMenuId = this.mps.getMenuId();
      this.mps.init().subscribe();

      // Assigning value to global variables
      if (currentFinancialYear) {
        this.currentFinancialYear = Number(currentFinancialYear.YearMasterSid);
      }
      if (this.currentCompanyCountry) {
        this.currentCountry =
          this.currentCompanyCountry.CountryMasterSid ||
          this.currentCompany?.CountryMasterSid;
        this.currentCompanyCountryCode = String(
          this.currentCompanyCountry.countryCode ||
            this.currentCompany?.countryMaster?.countryCode
        ).toLowerCase();
        this.bookingModeCountry = this.currentCompanyCountry.countryName;
      }
      if (this.currentBranchState) {
        this.currentBranchStateName =
          this.currentBranchState?.stateName ||
          this.currentBranch.stateMaster?.stateName;
      }
      if (this.currentBranchCity) {
        this.currentBranchCityId =
          this.currentBranchCity.CityMasterSid ||
          this.currentBranchCity.CityMasterSid;
      }
    } catch (e) {
      console.error('Error loading company data:', e);
      this.currentCompany = null;
      this.currentBranch = null;
    }
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
        this.loadInvoiceById(this.headerId);
      } else {
        this.initialFormValue = this.invoiceForm.getRawValue();
        this.subscribeToFormChanges();
        this.subscribeToValueChanges();
      }
    });

  }

  initForm() {
    const companyCurrencyId =
      this.currentCompany?.CurrencyMasterSid ||
      this.currentCompanyCurrency?.currencyMasterSid;
    const companyCurrencyCode = this.currentCompanyCurrency.code;
    const today = getDefaultTodayDate();
    const fy = this.appSettingService.getCurrentFinancialYear();
    const defaultVoucherDate = fy && (today < new Date(fy.StartDate) || today > new Date(fy.EndDate)) ? fy.EndDate : today;

    this.invoiceForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }],
      VoucherDate: [defaultVoucherDate, Validators.required],
      CustomerMasterSid: [null],
      PartyMasterSid: [null],
      PartyName: [null, Validators.required],
      PartyAddress: [{ value: '', disabled: true }, Validators.required],
      COAMasterSid: [null],
      CustomerBranchSid: [null],
      DocumentNumber: [''],
      IRNNumber: [''],
      MasterJobSid: [null],
      HBLNo: [''],
      CurrencyMasterSid: [companyCurrencyId, Validators.required],
      CurrencyCode: [companyCurrencyCode || '', Validators.required],
      ExchangeRate: [
        { value: 1, disabled: true },
        [Validators.required, greaterThanZero()],
      ],
      GST_VAT: [''],
      PlaceOfSupply: [''],
      PostStatus: [''],
      GSTType: [''],
      InvoiceType: ['REG'],
      VoucherType: [null],
      TaxType : [companyCurrencyCode === 'in' ? 'GST' : 'VAT'],
      Narration: [''],
      Remarks: [''],
      IRNStatus: [''],
      MBLNo: [{ value: '', disabled: true }],
      status: ['A', Validators.required],
      voucherDetails: this.fb.array([]),
      voucherOthers: this.fb.group({
        ContainerNumber: [''],
        VoucherNote: [''],
        Footer: [''],
        ReverseCreditNote: [''],
        DueDate: [null],
        IRNNumber: [''],
        IRNStatus: [''],
        IRNQRCode: [''],
        VoucherReverseSid: [null],
      }),
    });
    this.invoiceForm.setValidators(
      consistentExchangeRatesValidator(companyCurrencyId, companyCurrencyCode)
    );
  }

  subscribeToValueChanges() {
    this.invoiceForm.get('GSTType')?.valueChanges
    .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
      this.recalculateAllRows();
    });

    ['GSTType', 'CurrencyCode', 'ExchangeRate'].forEach((field) => {
      this.invoiceForm.get(field)?.valueChanges
      .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
        if (this.isPosted) return;
        this.recalculateAllRows();
      });
    });

    ['CustomerBranchSid', 'PartyMasterSid', 'VoucherDate'].forEach((field) => {
      this.invoiceForm.get(field)?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.isEditMode) {
          this.patchDueDate();
        }
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

  async saveChanges() : Promise<boolean> {
    return new Promise((resolve) =>{
      this.onSubmit(resolve);
    })
  }

  subscribeToFormChanges() {
    this.invoiceForm.valueChanges
      .pipe(takeUntil(this.destroy$),debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.invoiceForm.getRawValue()
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



  loadLookups() {
    this.spinner.show();
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const filterOption = {
      CompanyMasterSid,
      BranchMasterSid,
    };

    forkJoin({
      customers: this.operationService
        .getAllDebtorWithCOAMapped(filterOption)
        .pipe(catchError((err) => of({ data: [] }))),
      currencies: this.operationService
        .getAllCurrencies()
        .pipe(catchError((err) => of([]))),
      charges: this.operationService
        .getAllMappedChargeCreditors(filterOption)
        .pipe(catchError((err) => of([]))),
      uoms: this.operationService.getAllUom().pipe(catchError((err) => of([]))),
      departments: this.operationService
        .getAllDepartments(CompanyMasterSid)
        .pipe(catchError((err) => of([]))),
      masterJobs: this.operationService
        .getAllMasterJobs({
          CompanyMasterSid,
          BranchMasterSid,
          limit: 200,
          offset: 0,
        })
        .pipe(catchError((err) => of([]))),
    }).subscribe(
      ({
        customers,
        currencies,
        charges,
        uoms,
        departments,
        masterJobs,
      }) => {
        this.customerList = customers.data || [];
        this.subledgerList = customers.data || [];
        this.chargeList = charges.data || [];

        this.currencyList = currencies.data || [];
        this.currencyConfigService.initializeConfigurations(this.currencyList);
        this.numberToWords.initializeCurrencies(this.currencyList);

        this.uomList = uoms.data || [];
        this.departmentList = departments.data || [];
        this.masterJobList = masterJobs.data || [];
        if(!this.isEditMode){
          this.spinner.hide();
        }
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
    const voucherDate = this.invoiceForm?.get('VoucherDate')?.value;
    this.voucherConstraints = this.voucherPeriodService.applyConstraints(voucherDate, 'AR');
  }

  onVoucherDateChange(){
    this.applyVoucherDateConstraints();
    const voucherDate = this.invoiceForm.get('VoucherDate')?.value;
    if(!voucherDate) return;

    const companyCurrency = this.currentCompanyCurrency.code;

    // Check if header currency available , if yes fetch and recalculate
    const headerCurrencyId = this.invoiceForm.get('CurrencyMasterSid')?.value;
    const headerCurrencyCode = this.invoiceForm.get('CurrencyCode')?.value;
    if(headerCurrencyId){

      if(headerCurrencyCode === companyCurrency){
        this.invoiceForm.get('ExchangeRate')?.setValue(this.getFormattedAndPaddedExchangeRate(1, headerCurrencyId));
        this.invoiceForm.get('ExchangeRate')?.disable();
        this.recalculateAllRows();
        return;
      }

      const key = this.buildExchangeRateMapKey(headerCurrencyCode, companyCurrency, voucherDate);

      if(this.exchangeRateMap.has(key)){
        const exchangeRate = this.exchangeRateMap.get(key);
        this.invoiceForm.get('ExchangeRate')?.setValue(this.getFormattedAndPaddedExchangeRate(exchangeRate, headerCurrencyId));
        this.recalculateAllRows();
      } else {
        this.fetchExchangeRate(headerCurrencyCode,companyCurrency);
      }
    }

    // check for each detail and update the exchange rate
    this.details.controls.forEach((detail: FormGroup,index:number) => {
      const rawValue = detail.getRawValue();
      const fromCurrencyCode = rawValue.CurrencyCode;
      const toCurrencyCode = companyCurrency;
      const key = this.buildExchangeRateMapKey(fromCurrencyCode, toCurrencyCode,voucherDate);
      if(this.exchangeRateMap.has(key)){
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

  onCustomerChange(selected: any) {
    const customerMasterSid =
      typeof selected === 'object' && selected !== null
        ? selected.CustomerMasterSid ?? selected
        : selected;
    
    const localCurrencyId = this.currentCompany?.CurrencyMasterSid;
    const localCurrencyCode = this.currentCompanyCurrency.code;

    if (!selected || !customerMasterSid) {
      this.customerBranchList = [];
      this.invoiceForm.get('CustomerMasterSid')?.setValue(null);
      this.invoiceForm.get('CustomerBranchSid')?.setValue(null);
      this.invoiceForm.get('PartyAddress')?.setValue('');
      this.invoiceForm.get('PartyMasterSid')?.setValue(null);
      this.invoiceForm.get('COAMasterSid')?.setValue(null);
      this.invoiceForm.get('GST_VAT')?.setValue('');
      this.invoiceForm.get('PartyName')?.setValue(null);
      this.invoiceForm.get('PlaceOfSupply')?.setValue('');
      this.invoiceForm.get('CurrencyMasterSid')?.setValue(localCurrencyId);
      this.invoiceForm.get('CurrencyCode')?.setValue(localCurrencyCode);
      this.onHeaderCurrencyChange({
        CurrencyMasterSid: localCurrencyId,
        currencyCode: localCurrencyCode
      })

      // Set default InvoiceType based on country
      if (this.currentCompanyCountryCode === 'in') {
        this.invoiceForm.get('InvoiceType')?.setValue('B2B');
      } else {
        this.invoiceForm.get('InvoiceType')?.setValue('REG');
      }
      this.invoiceForm.get('GSTType')?.setValue('');
      return;
    }

    const customer = this.customerList.find(
      (c) => c.CustomerMasterSid === customerMasterSid
    );
    const customerCurrency = customer.currencyMaster || {};
    const countryCode = this.getCustomerCountryCode(customer);

    // Check if customer has GST in any branch to determine B2B vs B2C
    const customerBranches = this.customerBranchList.filter(
      (b) => b.CustomerMasterSid === customerMasterSid
    );
    const hasGSTInBranches = customerBranches.some(
      (branch) => branch.GSTNo && branch.GSTNo.trim() !== ''
    );
    if (customer) {
      this.invoiceForm.patchValue({
        CustomerMasterSid: customer.CustomerMasterSid,
        PartyName: customer.CustomerName || '',
        PartyMasterSid: customer.SubledgerMasterSid || null,
        COAMasterSid: customer.COAMappedId || null,
        InvoiceType:
          countryCode === 'in'
            ? hasGSTInBranches || customer.GSTNo
              ? 'B2B'
              : 'B2C'
            : 'REG',
        GST_VAT:
          (countryCode === 'in' ? customer.GSTNo : customer.PanType) || '',
        CurrencyMasterSid : customerCurrency?.CurrencyMasterSid ?? localCurrencyId,
        CurrencyCode : customerCurrency?.currencyCode ?? localCurrencyCode,
      });
      this.onHeaderCurrencyChange(customerCurrency);
    }

    // Reset branch selection when customer changes
    this.invoiceForm.get('CustomerBranchSid')?.setValue(null);
    this.invoiceForm.get('PartyAddress')?.setValue('');
    this.invoiceForm.get('PlaceOfSupply')?.setValue('');
    this.invoiceForm.get('GSTType')?.setValue('');
    this.getCustomerBranchByCustomer(Number(customerMasterSid));
  }

  getCustomerBranchByCustomer(CustomerMasterSid: number) {
    if (!CustomerMasterSid) {
      this.customerBranchList = [];
      return;
    }

    this.operationService
      .getCustomerBranchByCustomer(CustomerMasterSid)
      .subscribe({
        next: (resp: any) => {
          if (resp?.status) {
            this.customerBranchList = resp.data || [];
          }
        },
        error: (err) => {
          console.error('Error fetching customer branches', err);
          this.customerBranchList = [];
        },
      });
  }

  onCustomerBranchChange(selectedBranch: any) {
    const branchSid =
      typeof selectedBranch === 'object' && selectedBranch !== null
        ? selectedBranch.CustomerBranchSid ?? selectedBranch
        : selectedBranch;

    if (!branchSid) {
      this.invoiceForm.get('PartyAddress')?.setValue('');
      this.invoiceForm.get('PlaceOfSupply')?.setValue('');
      this.invoiceForm.get('GSTType')?.setValue('');
      this.others.get('DueDate')?.setValue(null);
      return;
    }

    const foundBranch = this.customerBranchList.find(
      (b) => Number(b.CustomerBranchSid) === Number(branchSid)
    );
    const placeOfSupply = foundBranch?.stateMaster?.stateName || '';
    if (foundBranch) {
      this.invoiceForm.patchValue({
        PartyAddress: foundBranch.Address,
        PlaceOfSupply: placeOfSupply,
      });
    } else {
      this.invoiceForm.get('PartyAddress')?.setValue('');
      this.invoiceForm.get('PlaceOfSupply')?.setValue('');
    }
    this.determineGSTType(placeOfSupply);
    this.recalculateAllRows();
  }

  determineGSTType(placeOfSupply: string) {
    if (!placeOfSupply) {
      this.invoiceForm.get('GSTType')?.setValue('');
      return;
    }

    const customerTaxNo = this.invoiceForm.get('GST_VAT')?.value;
    const invoiceType = this.invoiceForm.get('InvoiceType')?.value;

    const normalizedCompanyState = this.currentBranchStateName
      ?.trim()
      .toLowerCase();
    const normalizedPlaceOfSupply = placeOfSupply?.trim().toLowerCase();

    // Check if GST number is valid (not empty or undefined)
    const hasValidGST =
      customerTaxNo &&
      customerTaxNo.trim() !== '' &&
      customerTaxNo !== 'undefined';

    if (!this.isIndiaGST) {
      this.invoiceForm.get('GSTType')?.setValue('VAT');
      return;
    }

    // India GST scenarios (only for India)
    if (this.isIndiaGST) {
      // Scenario 1: Export (Customer outside India)
      if (invoiceType === 'EXWP' || invoiceType === 'EXWOP') {
        this.invoiceForm.get('GSTType')?.setValue('EXWP');
        return;
      }

      // Scenario 2 & 3: Regular India GST scenarios
      if (hasValidGST) {
        // Customer has GST number
        if (normalizedPlaceOfSupply === normalizedCompanyState) {
          // Same State - CGST + SGST
          this.invoiceForm.get('GSTType')?.setValue('CGST+SGST');
        } else {
          // Different State - IGST
          this.invoiceForm.get('GSTType')?.setValue('IGST');
        }
      } else {
        // Customer doesn't have GST number - B2C
        this.invoiceForm.get('GSTType')?.setValue('B2C');
      }
    }
  }

  patchDueDate() {
    let CustomerMasterSid: number;
    let CustomerBranchSid: number;
    let partyLedgerSid = this.invoiceForm?.get('PartyMasterSid')?.value;
    if (partyLedgerSid) {
      const selectedParty = this.customerList.find(
        (cus) => cus.SubledgerMasterSid === partyLedgerSid
      );
      CustomerMasterSid = selectedParty?.CustomerMasterSid;
    }

    const branchId = this.invoiceForm?.get('CustomerBranchSid')?.value;
    if (branchId) {
      const selectedBranch = this.customerBranchList.find(
        (branch) => branch.BranchMasterSid === branchId
      );
      CustomerBranchSid = branchId;
      CustomerMasterSid =
        CustomerMasterSid || selectedBranch?.CustomerMasterSid;
    }

    const voucherDate = this.invoiceForm?.get('VoucherDate')?.value;
    const departmentId = this.invoiceForm?.get('DepartmentMasterSid')?.value;
    const validDate = voucherDate && !isNaN(new Date(voucherDate).getTime());

    if (!voucherDate || !CustomerMasterSid) {
      this.dueDate = null;
      return;
    }

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      CustomerMasterSid: CustomerMasterSid,
      CustomerBranchSid: CustomerBranchSid,
      DepartmentMasterSid: departmentId,
      VoucherDate: validDate
        ? new Date(voucherDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    };
    this.operationService.getDueDate(payload).subscribe({
      next: (response: any) => {
        if (response?.status && response.data) {
          const date = new Date(response.data?.dueDate);
          this.dueDate = date;
        } else {
          this.dueDate = null;
        }
      },
      error: (error) => {
        this.dueDate = null;
      },
    });
  }

  loadInvoiceById(id: number) {
    this.operationService.getInvoiceById(id).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          this.destroy$.next();
          this.destroy$.complete();

          this.invoiceData = resp.data;
          this.invoiceData['MBLNo'] = resp.data?.MasterNumber;
          this.invoiceData['HBLNo'] = resp.data?.HouseNumber;

          this.invoiceForm.markAsUntouched();
          this.patchValues(this.invoiceData);
          this.patchDueDate();

          this.invoiceForm.get('PartyName')?.disable();
          this.invoiceForm.get('CustomerBranchSid')?.disable();
          this.invoiceForm.get('CurrencyMasterSid')?.disable();
          this.invoiceForm.get('CurrencyCode')?.disable();
          if (this.isPosted) {
            this.details.disable({ emitEvent: false });
            this.isDirty = false;
            this.initialFormValue = this.invoiceForm.getRawValue();
            this.invoiceForm.disable();
            this.destroy$.next();
            this.destroy$.complete();
            return;
          }
          // unsaved changes related
          setTimeout(() => {
            this.initialFormValue = this.invoiceForm.getRawValue();
            this.isDirty = false;
            this.subscribeToFormChanges();
            this.subscribeToValueChanges();
          }, 0);
        } else {
          this.spinner.hide();
          this.appSettingService.showError(resp.message);
          // this.router.navigate(['operation/invoice/list']);
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
        this.appSettingService.showError('Error loading invoice');
      },
    });
  }

  patchValues(data: any) {
    this.gatherHyperLinkInfo(data);

    this.invoiceForm.patchValue(
      {
        VoucherNumber: data.VoucherNumber,
        VoucherDate: data.VoucherDate ? new Date(data.VoucherDate) : null,
        CustomerMasterSid: data.CustomerMasterSid || null,
        CustomerBranchSid: data.CustomerBranchSid || null,
        PartyMasterSid: data.PartyMasterSid || null,
        PartyName: data.PartyName || '',
        PartyAddress: data.PartyAddress || '',
        COAMasterSid: data.COAMasterSid || null,
        PlaceOfSupply: data.PlaceOfSupply || '',
        PostStatus: data.PostStatus || '',
        MasterJobSid: data.MasterJobSid || null,
        HBLNo: data.HouseJob || data.HBLNo || '',
        CurrencyMasterSid: data?.CurrencyMasterSid || null,
        CurrencyCode: data.CurrencyCode || null,
        ExchangeRate: toNumber(data.ExchangeRate),
        GST_VAT: data.GST_VAT || '',
        InvoiceType: data.InvoiceType || null,
        GSTType: data.GSTType || null,
        TaxType : data.TaxType || null,
        Narration: data.Narration || '',
        Remarks: data.Remarks || '',
        MBLNo: data.MBLNo || '',
        status: data.Status || 'A',
        
        DocumentNumber: data.DocumentNumber || '',
        IRNNumber: data.IRNNumber || '',
        IRNStatus: data.IRNStatus || '',
        VoucherType: data.VoucherType,
      },
      { emitEvent: false }
    );

    if (
      data?.CurrencyMasterSid === this.currentCompany?.CurrencyMasterSid ||
      this.isPosted
    ) {
      this.invoiceForm.get('ExchangeRate')?.disable();
    } else {
      this.invoiceForm.get('ExchangeRate')?.enable();
    }

    const detailsFromResp = data.VoucherDetail || [];

    this.filteredDetailItems = detailsFromResp.filter(
      (dtl) => dtl.IsAutoGenerated !== 'Y'
    );

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
        })
      );
      this.fetchHSN(this.details.length - 1,false);
      if (det.CurrencyMasterSid === this.currentCompany.CurrencyMasterSid) {
        this.details
          .at(this.details.length - 1)
          .get('ExchangeRate')
          ?.disable();
      }
      if(det.MasterJobSid){
        this.onDetailMasterJobSelected(
          { MasterJobSid: det.MasterJobSid },
          index++
        );
      }
    }

    const voucherOthersSource =
      data.VoucherOthers && Array.isArray(data.VoucherOthers)
        ? data.VoucherOthers[0]
        : data.VoucherOthers ||
          data.voucherOthers ||
          (Array.isArray(data.voucherOthers)
            ? data.voucherOthers[0]
            : undefined);

    const vg = this.invoiceForm.get('voucherOthers') as FormGroup;
    if (voucherOthersSource) {
      vg.patchValue({
        ContainerNumber: voucherOthersSource.ContainerNumber || '',
        VoucherNote: voucherOthersSource.VoucherNote || '',
        Footer: voucherOthersSource.Footer || '',
        ReverseCreditNote: voucherOthersSource.ReverseCreditNote || '',
        DueDate: voucherOthersSource.DueDate
          ? new Date(voucherOthersSource.DueDate)
          : null,
        IRNNumber:
          voucherOthersSource.IRNNumber || voucherOthersSource.IRNNo || '',
        IRNStatus: voucherOthersSource.IRNStatus || '',
        IRNQRCode: voucherOthersSource.IRNQRCode || '',
      });
    } else {
      vg.reset({
        ContainerNumber: '',
        VoucherNote: '',
        Footer: '',
        ReverseCreditNote: '',
        DueDate: null,
        IRNNumber: '',
        IRNStatus: '',
        IRNQRCode: '',
        VoucherReverseSid: null,
      });
    }
    this.spinner.hide();
  }

  async preparePrintData() {
    const isBookingInvoice = this.invoiceData.BookingHeaderSid;
    const isHouseJobInvoice = this.invoiceData.HouseJobSid && this.invoiceData.MasterJobSid;
    const isMasterJobInvoice = this.invoiceData.MasterJobSid && !this.invoiceData?.HouseJobSid;

    const allDetails: any[] = this.invoiceData.VoucherDetail || [];
    const voucherDetails = allDetails
      .filter(d => d.IsAutoGenerated !== 'Y')
      .map((detail, index) => {
        const hssacCode = this.getHSSACCode(detail.HSSACMasterSid, index);
        const taxPercentages = this.getTaxPercentageForDisplay(detail);
        const taxAmounts = this.getTaxAmountForDisplay(detail);

        console.log({
          cgstAmt : this.getTaxAmountForDisplay(detail).cgstAmt,
          sgstAmt : this.getTaxAmountForDisplay(detail).sgstAmt,
          igstAmt : this.getTaxAmountForDisplay(detail).igstAmt,
          vatAmt : this.getTaxAmountForDisplay(detail).vatAmt,
        })

        const totalTaxAmount = this.getFormattedAmount(
          (this.getTaxAmountForDisplay(detail).cgstAmt +
          this.getTaxAmountForDisplay(detail).sgstAmt +
          this.getTaxAmountForDisplay(detail).igstAmt +
          this.getTaxAmountForDisplay(detail).vatAmt),
          this.currentCompany.CurrencyMasterSid
        )
        
          console.warn(`TOTAL TAX ${index} AMOUNT ${totalTaxAmount}`);
          
          const actualLocalAmount = toNumber(detail.LocalAmount) + toNumber(totalTaxAmount);
          console.warn(`ACTUAL LOCAL ${index} AMOUNT ${actualLocalAmount}`);


          
          const correctedTaxAmount = 
          this.invoiceData?.CurrencyMasterSid === this.currentCompany.CurrencyMasterSid 
          ? toNumber(totalTaxAmount) : (toNumber(totalTaxAmount) / toNumber(this.invoiceData?.ExchangeRate));
          const actualPartyAmount = toNumber(correctedTaxAmount) + toNumber(detail.PartyAmount);
          
          console.warn("CHECK",{
            total_tax : totalTaxAmount,
            local_amount : detail.LocalAmount,
            actual_local_amount : actualLocalAmount,
            invoice_currency : this.invoiceData?.CurrencyMasterSid,
            current_company_currency : this.currentCompany.CurrencyMasterSid,
            exchange_rate : toNumber(this.invoiceData?.ExchangeRate),
            actual_party_amt : actualPartyAmount
          })
        return {
          Sno: index + 1,
          ChargeDescription: detail.ChargeDescription,
          HSSACCode: hssacCode,
          DrCr : detail.DrCr,
          CurrencyMasterSid : detail.CurrencyMasterSid,
          CurrencyCode: detail.CurrencyCode,
          NumberOfUnit: Number(detail.NumberOfUnit).toFixed(3),
          Rate: this.getFormattedAndPaddedAmount(detail.Rate,detail.CurrencyMasterSid),
          ExchangeRate: this.getFormattedAndPaddedExchangeRate(detail.ExchangeRate,detail.CurrencyMasterSid),
          TaxableAmount: this.getFormattedAndPaddedAmount(detail.TaxableAmount,this.currentCompany.CurrencyMasterSid),
          cgstRate: Number(taxPercentages.cgstRate).toFixed(3),
          cgstAmt: this.getFormattedAndPaddedAmount(taxAmounts.cgstAmt,this.currentCompany.CurrencyMasterSid),
          sgstRate: Number(taxPercentages.sgstRate).toFixed(3),
          sgstAmt: this.getFormattedAndPaddedAmount(taxAmounts.sgstAmt,this.currentCompany.CurrencyMasterSid),
          igstRate: Number(taxPercentages.igstRate).toFixed(3),
          igstAmt: this.getFormattedAndPaddedAmount(taxAmounts.igstAmt,this.currentCompany.CurrencyMasterSid),
          vatRate: Number(taxPercentages.vatRate).toFixed(3),
          vatAmt: this.getFormattedAndPaddedAmount(taxAmounts.vatAmt,this.currentCompany.CurrencyMasterSid),
          LocalAmount: this.getFormattedAndPaddedAmount(String(actualLocalAmount),this.currentCompany.CurrencyMasterSid),
          PartyAmount: this.getFormattedAndPaddedAmount(String(actualPartyAmount),this.invoiceData?.CurrencyMasterSid),
        }
      })
    
    const totalPartyAmount = voucherDetails.reduce((sum, detail) => {
      if(detail.DrCr === 'C'){
        return sum + toNumber(detail.PartyAmount);
      }
      return sum - toNumber(detail.PartyAmount);
    }, 0);

    const amountInWords = this.getAmountInWords(
      totalPartyAmount,
      this.invoiceData?.CurrencyMasterSid
    );

    // Get salesman name if not already fetched
    if(!this.salesmanFetched){
      await this.fetchSalesmanName(
        isHouseJobInvoice ? 
        this.invoiceData?.houseJob?.SalesmanSid : 
        (isBookingInvoice ? this.invoiceData?.BookingHeader?.SalesmanSid : '')
      );
    }
    const salesmanName = this.salesmanName || '';

    //  Get Bank Details if not already fetched
    if(!this.isBankFetched){
      await this.getAndStoreBankDetails();
    }
    const bankDetails = this.bankDetails ?? [];
    
    // Get Terms and Conditions if not already fetched 
    if(!this.TandCFetched) {
      await this.getAndStoreTandC();
    }
    const tandc = this.TandCList || [];
    

    this.invoicePrintData = {
      invoiceTitle: this.getInvoiceTitle(),
      GSTCode: this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
      BilledTo: this.invoiceData?.PartyName || this.invoiceData?.subledgerMaster?.SubledgerName || '',
      BillingAddress: this.invoiceData?.PartyAddress || this.invoiceData?.subledgerMaster?.Address || '',
      PAN: this.currentCompany?.Pan || this.currentCompany?.PAN || '',
      InvoiceNo: this.invoiceData?.VoucherNumber || '',
      InvoiceDate: this.invoiceData?.VoucherDate || '',
      GST_VAT: this.invoiceData?.GST_VAT || '',
      IRNNumber: this.invoiceData?.IRNNumber || '',
      ShipperName: isHouseJobInvoice ? this.invoiceData?.houseJob?.ShipperName : (isBookingInvoice ? this.invoiceData?.BookingHeader?.ShipperName : ''),
      ConsigneeName: isHouseJobInvoice ? this.invoiceData?.houseJob?.ConsigneeName : (isBookingInvoice ? this.invoiceData?.BookingHeader?.ConsigneeName : ''),
      Vessel: this.getShipmentFieldValue('VesselName') || "",
      VoyageNo: this.getShipmentFieldValue('VoyageNo') || "",
      POL: this.getShipmentFieldValue('POL') || "",
      PlaceofSupply: this.invoiceData?.PlaceOfSupply || '',
      FPD: this.getShipmentFieldValue('FPD') || "",
      ETD: this.getShipmentFieldValue('ETD') || "",
      ETA: this.getShipmentFieldValue('ETA') || "",
      HBLNo: this.invoiceData?.houseJob?.HBLNo || '',
      MBLNo: this.invoiceData?.masterJob?.MBLNo || '',
      MasterJobNumber: this.invoiceData?.masterJob?.MasterJobNumber || '',
      MasterJobDate: this.invoiceData?.masterJob?.MasterJobDate || '',
      CustomerRefNo: this.invoiceData?.houseJob?.Others?.[0]?.CustomerRefNo || '',
      ContainerType: this.invoiceData?.masterJob?.containers?.[0]?.ContainerType || '',
      ContainerNumber: this.invoiceData?.masterJob?.containers?.[0]?.ContainerNumber || '',
      DepartmentMasterSid : this.invoiceData?.masterJob?.DepartmentMasterSid || '',
      FreightTerms:
        isHouseJobInvoice ?
          this.invoiceData?.houseJob?.FreightTerms :
          (isBookingInvoice ?
            this.invoiceData?.BookingHeader?.FreightTerms :
            (isMasterJobInvoice ?
              this.invoiceData?.masterJob?.FreightPPCC : ''
            )
          )
      ,
      PkgWtVol: 
        isHouseJobInvoice ?
          `${this.invoiceData?.houseJob?.Cargo?.[0]?.NoOfPackage || "0"} / ${this.invoiceData?.houseJob?.Cargo?.[0]?.GrossWeight || "0"} / ${this.invoiceData?.houseJob?.Cargo?.[0]?.Volume || "0"}` :
            (isBookingInvoice ? `${this.invoiceData?.BookingHeader?.bookingCargo?.[0]?.NoOfPackage || "0"} / ${this.invoiceData?.BookingHeader?.bookingCargo?.[0]?.GrossWeight || "0"} / ${this.invoiceData?.BookingHeader?.bookingCargo?.[0]?.Volume || "0"}` : 
              (isMasterJobInvoice ? `${this.invoiceData?.masterJob?.NoOfPkg || "0"} / ${this.invoiceData?.masterJob?.GrossWeight || "0"} / ${this.invoiceData?.masterJob?.Volume || "0"}` : '')
            ),
      BookingNumber : 
        isHouseJobInvoice ? 
          this.invoiceData?.houseJob?.BookingNo : 
          ( isBookingInvoice ? this.invoiceData?.BookingHeader?.BookingNo : '' )
      ,
      InvoiceDueDate: this.dueDate,
      CurrExRate: `${this.invoiceData?.CurrencyCode || ""} / ${this.getFormattedAndPaddedExchangeRate(this.invoiceData?.ExchangeRate,this.invoiceData?.CurrencyMasterSid) || ""}`,
      SalesPerson: salesmanName,
      voucherDetails: voucherDetails,
      totalPartyAmount : this.getFormattedAndPaddedAmount(totalPartyAmount,this.invoiceData?.CurrencyMasterSid),
      AmountInWords : amountInWords,
      Remarks : this.invoiceData?.Remarks,
      BankDetails : bankDetails,
      TermsAndConditions : tandc,




       pkg: isHouseJobInvoice
  ? (this.invoiceData?.houseJob?.Cargo?.[0]?.NoOfPackage ?? " ")
  : isBookingInvoice
    ? (this.invoiceData?.BookingHeader?.bookingCargo?.[0]?.NoOfPackage ?? " ")
    : isMasterJobInvoice
      ? (this.invoiceData?.masterJob?.NoOfPkg ?? " ")
      : " ",
     
    grosswt: isHouseJobInvoice
  ? (this.invoiceData?.houseJob?.Cargo?.[0]?.GrossWeight ?? " ")
  : isBookingInvoice
    ? (this.invoiceData?.BookingHeader?.bookingCargo?.[0]?.GrossWeight ?? " ")
    : isMasterJobInvoice
      ? (this.invoiceData?.masterJob?.GrossWeight ?? " ")
      : " ",
 
      desc: isHouseJobInvoice
  ? (this.invoiceData?.houseJob?.Cargo?.[0]?.CommodityDescription ?? " ")
  : isBookingInvoice
    ? (this.invoiceData?.BookingHeader?.bookingCargo?.[0]?.CommodityDescription ?? " ")
    : isMasterJobInvoice
      ? (this.invoiceData?.masterJob?.CommodityDescription ?? " ")
      : " ",
 
    ChargeableWeight: isHouseJobInvoice
  ? (this.invoiceData?.houseJob?.Cargo?.[0]?.ChargeableWeight ?? " ")
  : isBookingInvoice
    ? (this.invoiceData?.BookingHeader?.bookingCargo?.[0]?.ChargeableWeight ?? " ")
    : isMasterJobInvoice
      ? (this.invoiceData?.masterJob?.ChargeableWeight ?? " ")
      : " ",
 
    cbm: isHouseJobInvoice
  ? (this.invoiceData?.houseJob?.Cargo?.[0]?.Volume ?? " ")
  : isBookingInvoice
    ? (this.invoiceData?.BookingHeader?.bookingCargo?.[0]?.Volume ?? " ")
    : isMasterJobInvoice
      ? (this.invoiceData?.masterJob?.Volume ?? " ")
      : " ",
    }


    
   
    
  } 

isSeaDepartment(): boolean {
 const deptSid = this.invoiceData?.masterJob?.DepartmentMasterSid || this.invoiceData?.BookingHeader?.DepartmentMasterSid;

  if (!deptSid || !Array.isArray(this.departmentList) || this.departmentList.length === 0) {
    return false;
  }

  const dept = this.departmentList.find(
    d => Number(d.DepartmentMasterSid) === Number(deptSid)
  );

  console.log('Dept SID:', deptSid, 'Found dept:', dept); 

  if (!dept?.departmentType) return false;

  return dept.departmentType.toUpperCase().includes('SEA');
}

  gatherHyperLinkInfo(data){
    const airDept = String(data.departmentMaster?.departmentType)?.toUpperCase() === 'AIR';
    const isHouseJobInvoice = data.HouseJobSid && data.MasterJobSid;
    const isMasterJobInvoice = data.MasterJobSid && !data.HouseJobSid;
    const isBookingInvoice = !!data.BookingHeaderSid;

    if(isHouseJobInvoice){
      this.hyperLinkInfo = {
        id : data?.HouseJobSid,
        number : data?.houseJob?.HBLNo,
        path : `/operation/house-job/entry/${data.HouseJobSid}`,
        label : airDept ? 'HAWBL No.' : 'HBL No.'
      }
    } else if (isMasterJobInvoice) {
      this.hyperLinkInfo = {
        id: data.MasterJobSid,
        number : data?.masterJob?.MasterJobNumber,
        path: `/operation/${airDept ? 'mawbill' :  'master-job'}/entry/${data.MasterJobSid}`,
        label : airDept ? 'MAWB No.' : 'MBL No.'
      }
    } else if (isBookingInvoice){
      this.hyperLinkInfo = {
        id: data.BookingHeaderSid,
        number : data?.BookingHeader?.BookingNo,
        path: `/operation/booking/entry/${data.BookingHeaderSid}`,
        label : 'Booking No.'
      }
    } else {
      this.hyperLinkInfo = {
        id : null,
        number : null,
        path : null,
        label : null
      }
    }

  }

    checkVoucherPostingMechanism() {
    const companyId = this.currentCompany?.CompanyMasterSid;
    const branchId = this.currentBranch?.BranchMasterSid;
    const menuName = 'Invoice';
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

    const currency = this.invoiceForm.get('CurrencyCode')?.value;
    const customerBranch = this.invoiceForm.get('CustomerBranchSid')?.value;

    if (!customerBranch) {
      missingErrors.push('• Please select Customer Branch from the dropdown.');
      this.invoiceForm.get('CustomerBranchSid')?.markAsTouched();
    }

    if (!currency) {
      missingErrors.push('• Please select Currency from the dropdown.');
      this.invoiceForm.get('CurrencyCode')?.markAsTouched();
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
    this.invoiceForm.updateValueAndValidity();
  }


  createDetailGroup(data?: any): FormGroup {
    const group = this.fb.group({
      VoucherDetailSid: [data?.VoucherDetailSid || null],
      ChargeMasterSid: [data?.ChargeMasterSid || null, Validators.required],
      ChargeDescription: [data?.ChargeDescription || ''],
      HSSACMasterSid: [data?.HSSACMasterSid || null],
      ChargeUOMSid: [data?.ChargeUOMSid || null],
      NumberOfUnit: [
        data?.NumberOfUnit || 1,
        [Validators.required, Validators.min(0)],
      ],
      DrCr: [data?.DrCr || 'C', Validators.required],
      CurrencyMasterSid: [
        data?.CurrencyMasterSid ||
          this.invoiceForm.get('CurrencyMasterSid')?.value ||
          null,
      ],
      CurrencyCode: [
        data?.CurrencyCode ||
          this.invoiceForm.get('CurrencyCode')?.value ||
          null,
      ],
      Rate: [data?.Rate || 0, [Validators.required, Validators.min(0)]],
      ExchangeRate: [
        data?.ExchangeRate || this.invoiceForm.get('ExchangeRate')?.value || 1,
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
      CostRevenueChargesSid: [data?.CostRevenueChargesSid || null]
    });
    this.disableControlsIfVoucherExists(group);
    return group;
  }

  private disableControlsIfVoucherExists(group: FormGroup): void {
    const voucherDetailSid = group.get('VoucherDetailSid')?.value;

    if (!voucherDetailSid) {
      return;
    }

    const allowedControls = ['Rate', 'ExchangeRate', 'HSSACMasterSid','ChargeDescription'];

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
      (dept) => dept.DepartmentMasterSid === departmentSid 
    );
    return department?.departmentName || '-';
  }
  removeDetailRow(index: number) {
    if (this.details.length > index) this.details.removeAt(index);
    this.invoiceForm.updateValueAndValidity();
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
      ].includes(field || '')
    ) {
      this.recalcRow(index);
      if (field === 'CurrencyCode') {
        const formGroup = this.details.at(index) as FormGroup;
        let fromCurrencyCode = formGroup.get('CurrencyCode')?.value;
        const selectedCurrency = this.currencyList.find(
          (c: any) => c.currencyCode === fromCurrencyCode
        );
        formGroup.get('CurrencyMasterSid')
          ?.setValue(selectedCurrency?.CurrencyMasterSid);
        let toCurrencyCode = this.currentCompanyCurrency.code;
        this.patchExchangeRateForDetail(
          fromCurrencyCode,
          toCurrencyCode,
          index
        );
      }
    } else if (field === 'ChargeMasterSid') {
      const chargeSid = this.details.at(index).get('ChargeMasterSid')?.value;
      const selectedCharge = this.chargeList?.find(
        (c: any) => c.ChargeMasterSid === chargeSid
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
        COAMasterSid: selectedCharge?.CrCOAMasterSid || null,
      });

      // Trigger tax calculation when charge changes
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
    const unit = toNumber(row.get('NumberOfUnit')?.value || 0);
    const rate = toNumber(
      this.getFormattedAmount(
        row.get('Rate')?.value || 0,
        rawValue.CurrencyMasterSid
      )
    );
    const exRate = toNumber(
      this.getFormattedExchangeRate(
        row.get('ExchangeRate')?.value || 0,
        rawValue.CurrencyMasterSid
      )
    );

    // Calculate basic amounts
    const amount = unit * rate;
    const taxableAmount = amount * exRate;
    const localAmount = amount * exRate;

    // Get GST Type and determine tax applicability - IMPORTANT: Get from form, not from currentUserCountry
    const gstType = this.invoiceForm.get('GSTType')?.value;
    const placeOfSupply = this.invoiceForm.get('PlaceOfSupply')?.value;

    // Initialize tax variables
    let cgstRate = 0,
      sgstRate = 0,
      igstRate = 0,
      vatRate = 0;
    let cgstAmt = 0,
      sgstAmt = 0,
      igstAmt = 0,
      vatAmt = 0;

    // Get charge data for tax ledger lookup
    const chargeSid = row.get('ChargeMasterSid')?.value;
    const charge = this.chargeList.find((c) => c.ChargeMasterSid === chargeSid);

    if (charge) {
      const HSSACMasterSid = row.get('HSSACMasterSid')?.value;
      const hssacItem = (this.hssacList[index] || []).find(
        (c) => c.HSSACMasterSid === HSSACMasterSid
      );

      if (HSSACMasterSid) {
        let taxLedgers: any[] = [];
        const inputOrOutput: 'Input' | 'Output' = 'Input';
        const companyState = this.currentBranchState.stateName;
        const currentCountry = Number(this.currentCompany?.CountryMasterSid);
        const customerCountry = this.getCustomerCountry();
        const taxCategory = this.determineTaxCategory(
          companyState,
          placeOfSupply,
          customerCountry
        );

        const key = this.buildKey(
          hssacItem?.TaxGroupSid,
          inputOrOutput,
          taxCategory,
          currentCountry
        );

        if (this.taxGroupMap.has(key)) {
          const alreadyFetched = this.taxGroupMap.get(key);
          taxLedgers = alreadyFetched;
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
          // CRITICAL FIX: Apply tax based on GST type from form, not country
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
            // Export - no tax
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
          this.applyFallbackTax(
            index,
            row,
            taxableAmount,
            gstType,
            cgstRate,
            cgstAmt,
            sgstRate,
            sgstAmt,
            igstRate,
            igstAmt,
            vatRate,
            vatAmt
          );
        }
      }
    } else {
      this.applyFallbackTax(
        index,
        row,
        taxableAmount,
        gstType,
        cgstRate,
        cgstAmt,
        sgstRate,
        sgstAmt,
        igstRate,
        igstAmt,
        vatRate,
        vatAmt
      );
    }

    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    // Update row values
    row
      .get('Amount')
      ?.setValue(
        toNumber(this.getFormattedAmount(amount, rawValue.CurrencyMasterSid))
      );
    row
      .get('TaxableAmount')
      ?.setValue(
        toNumber(this.getFormattedAmount(taxableAmount, companyCurrency))
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
      row
        .get('TaxAmount1')
        ?.setValue(toNumber(this.getFormattedAmount(vatAmt, companyCurrency)));
    } else if (gstType === 'CGST+SGST') {
      // CGST+SGST
      row.get('TaxPercentage1')?.setValue(cgstRate);
      row
        .get('TaxAmount1')
        ?.setValue(toNumber(this.getFormattedAmount(cgstAmt, companyCurrency)));
      row.get('TaxPercentage2')?.setValue(this.round(sgstRate));
      row
        .get('TaxAmount2')
        ?.setValue(toNumber(this.getFormattedAmount(sgstAmt, companyCurrency)));
    } else if (gstType === 'IGST') {
      // IGST or B2C - use TaxPercentage1 and TaxAmount1 only
      const rate = gstType === 'IGST' ? igstRate : cgstRate;
      const amount = gstType === 'IGST' ? igstAmt : cgstAmt;
      row.get('TaxPercentage1')?.setValue(rate);
      row
        .get('TaxAmount1')
        ?.setValue(toNumber(this.getFormattedAmount(amount, companyCurrency)));
    } else {
      // Default based on country
      if (this.isIndiaGST) {
        // India default - use TaxPercentage1 and TaxAmount1
        row.get('TaxPercentage1')?.setValue(igstRate);
        row
          .get('TaxAmount1')
          ?.setValue(
            toNumber(this.getFormattedAmount(igstAmt, companyCurrency))
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
    this.invoiceForm.updateValueAndValidity();
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
    const hssac =
      this.hssacList[index] || [].find((h) => h.HSSACMasterSid === hssacSid);

    // Determine tax rate based on GST type
    if (gstType === 'VAT') {
      // VAT - use 5% as default for UAE/non-India
      vatRate = hssac?.TaxRate || 5;
      vatAmt = (taxableAmount * vatRate) / 100;
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
    const totalLocalAmount = this.calculateTotalLocalAmount();
    this.invoiceForm.get('BillAmt')?.setValue(this.round(totalLocalAmount));
  }
  calculateTotalLocalAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('LocalAmount')?.value) || 0);
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
        exRateCtrl.setValue(this.invoiceForm.get('ExchangeRate')?.value || 1);
      }
      this.recalcRow(i);
    }
  }

  // Calculate total currency amount (sum of all amounts)
  getTotalCurrencyAmount(): number {
    let total = 0;
    for (let i = 0; i < this.details.length; i++) {
      const amount = Number(this.details.at(i).get('PartyAmount')?.value || 0);
      total += amount;
    }
    return this.round(total);
  }

  // Calculate total tax amount (CGST + SGST + IGST)
  getTotalTaxAmount() {
    let total = 0;
    for (let i = 0; i < this.details.length; i++) {
      const taxAmt1 = Number(this.details.at(i).get('TaxAmount1')?.value || 0);
      const taxAmt2 = Number(this.details.at(i).get('TaxAmount2')?.value || 0);
      // const igstAmt = Number(this.details.at(i).get('TaxAmount1')?.value || 0);
      total += taxAmt1 + taxAmt2;
    }
    return this.getFormattedAmount(
      total,
      this.currentCompany.CurrencyMasterSid
    );
  }

  // Calculate grand total (Currency Amount + Tax Amount)

  round(val: number) {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  private normalizeParty(raw: any) {
    const customerMasterSid =
      raw.CustomerMasterSid != null ? Number(raw.CustomerMasterSid) : null;
    const partyControl = raw.PartyName; // This now contains the CustomerName string

    let customerBranchSid: number | null =
      raw.CustomerBranchSid != null ? Number(raw.CustomerBranchSid) : null;

    let partyNameStr = partyControl || '';
    let partyAddressStr = raw.PartyAddress || '';

    // Get address from branch if available
    if (customerBranchSid) {
      const foundBranch = this.customerBranchList.find(
        (b) => Number(b.CustomerBranchSid) === customerBranchSid
      );
      if (foundBranch) {
        partyAddressStr =
          foundBranch.Address ||
          foundBranch.CustomerAddress1 ||
          partyAddressStr;
      }
    }

    // CRITICAL: PartyMasterSid should come from the form control, not from branch
    let partyMasterSid =
      raw.PartyMasterSid != null ? Number(raw.PartyMasterSid) : null;

    // Fallback: if PartyMasterSid is not set, try to get from customer
    if (!partyMasterSid && customerMasterSid) {
      const customer = this.customerList.find(
        (c) => c.CustomerMasterSid === customerMasterSid
      );
      if (customer && customer.SubledgerMasterSid) {
        partyMasterSid = Number(customer.SubledgerMasterSid);
      }
    }


    return {
      PartyMasterSid: partyMasterSid,
      CustomerBranchSid: customerBranchSid,
      PartyName: partyNameStr,
      PartyAddress: partyAddressStr,
      CustomerName: partyNameStr,
    };
  }

  getCurrencyId(CurrencyCode: string): number | null {
    if (!CurrencyCode || !this.currencyList) {
      return null;
    } else {
      const currency = this.currencyList.find(
        (c) => c.currencyCode === CurrencyCode
      );
      return currency ? currency.CurrencyMasterSid : null;
    }
  }

  private buildVoucherOthersPayload(rawVoucherOthers: any): any | undefined {
    if (!rawVoucherOthers || typeof rawVoucherOthers !== 'object')
      return undefined;

    const allowedKeys = [
      'ContainerNumber',
      'VoucherNote',
      'Footer',
      'ReverseCreditNote',
      'DueDate',
      'IRNNumber',
      'IRNStatus',
      'IRNQRCode',
      'VoucherReverseSid',
    ];

    const cleaned: any = {};

    for (const k of allowedKeys) {
      const val = rawVoucherOthers[k];
      if (val === null || val === undefined) continue;
      if (typeof val === 'string') {
        if (val.trim() === '') continue;
        cleaned[k] = val;
      } else if (val instanceof Date) {
        cleaned[k] = val;
      } else {
        cleaned[k] = val;
      }
    }

    if (Object.keys(cleaned).length === 0) return undefined;

    if (!('Footer' in cleaned)) {
      cleaned['Footer'] = '';
    }

    if (cleaned.DueDate && !(cleaned.DueDate instanceof Date)) {
      const parsed = new Date(cleaned.DueDate);
      if (!isNaN(parsed.getTime())) cleaned.DueDate = parsed;
      else delete cleaned.DueDate;
    }

    if ('VoucherReverseSid' in cleaned) {
      const v = Number(cleaned.VoucherReverseSid);
      cleaned.VoucherReverseSid = isNaN(v) ? null : v;
    }

    return cleaned;
  }

  // Called when user selects master job in main Job No control
  onMasterJobSelected(selected: any) {
    if (!selected) {
      this.invoiceForm.get('MBLNo')?.setValue('');
      this.invoiceForm.get('HBLNo')?.setValue('');
      return;
    }
    const masterJob =
      typeof selected === 'object'
        ? selected
        : this.masterJobList.find((m) => m.MasterJobSid === selected);
    if (masterJob) {
      if (masterJob.MBLNo !== undefined)
        this.invoiceForm.get('MBLNo')?.setValue(masterJob.MBLNo || '');
      if (masterJob.HBLNo !== undefined)
        this.invoiceForm
          .get('HBLNo')
          ?.setValue(masterJob.HBLNo || masterJob.HouseJob || '');
      this.invoiceForm
        .get('MasterJobSid')
        ?.setValue(Number(masterJob.MasterJobSid));
      // optional: apply to all detail rows
      // this.applyMasterJobToAllDetails(Number(masterJob.MasterJobSid));
    }
  }

  onDetailMasterJobSelected(masterJob: any, detailIndex: number) {
    const row = this.details.at(detailIndex) as FormGroup;
    if (!masterJob) {
      this.houseJobList[detailIndex] = [];
      row.get('HouseJobSid')?.setValue(null);
      return;
    }

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
      (c: any) => c.ChargeMasterSid === ChargeMasterSid
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
              `Error fetching HSSAC details for ${chargeName}`
            );
            this.hssacList[index] = null;
          }
        },
        error: (err: any) => {
          this.appSettingService.showError(
            `Error fetching HSSAC details for ${chargeName}`
          );
          this.hssacList[index] = null;
        },
      });
    }
  }

  onSubmit(
    resolve?: (value:boolean) => void,
    isPostingTrue?: boolean
  ) {
    // Validate voucher date is within financial year
    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy) {
      const voucherDate = new Date(this.invoiceForm.getRawValue().VoucherDate);
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

    const raw = this.invoiceForm.getRawValue();

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
      this.invoiceForm.markAsUntouched();
      if(resolve) resolve(false);
      return;
    }

    // Enhanced exchange rate validation - checks all three error types
    if (this.invoiceForm.errors) {
      const hasExchangeRateError =
        this.invoiceForm.errors['inconsistentExchangeRates'] ||
        this.invoiceForm.errors['foreignCurrencyRateOne'] ||
        this.invoiceForm.errors['exchangeRateZero'];

      if (hasExchangeRateError) {
        const errorMsg = getExchangeRateErrorMessage(
          this.invoiceForm,
          this.currencyList
        );
        this.appSettingService.showError(errorMsg);
        if (resolve) resolve(false);
        this.isSaving = false;
        return;
      }
    }

    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.invoiceForm.updateValueAndValidity();
      this.appSettingService.showError('Please fill all the required fields.');
      if(resolve) resolve(false);
      return;
    }


    const YearMasterSid = Number(localStorage.getItem('current-year-id'));


    const voucherDetailArray = (raw.voucherDetails || []).map(
      (d: any, index: number) => {
        const detail = {
          VoucherDetailSid: d.VoucherDetailSid,
          ChargeMasterSid:
            d.ChargeMasterSid != null ? Number(d.ChargeMasterSid) : null,
          ChargeDescription: d.ChargeDescription || '',
          HSSACMasterSid:
            d.HSSACMasterSid != null ? Number(d.HSSACMasterSid) : null,
          LedgerMasterSid: d.LedgerMasterSid ? Number(d.LedgerMasterSid) : null,
          COAMasterSid: d.COAMasterSid ? Number(d.COAMasterSid) : null,
          ChargeUOMSid: d.ChargeUOMSid != null ? Number(d.ChargeUOMSid) : null,
          DepartmentMasterSid:
            d.DepartmentMasterSid != null
              ? Number(d.DepartmentMasterSid)
              : null,
          NumberOfUnit: d.NumberOfUnit != null ? Number(d.NumberOfUnit) : 0,
          CostRevenue : d.DrCr === 'D' ? 'Cost' : 'Revenue',
          DrCr: d.DrCr || 'D',
          CurrencyCode: d.CurrencyCode || raw.CurrencyCode,
          CurrencyMasterSid: d.CurrencyMasterSid || this.getCurrencyId(d.CurrencyCode),
          Rate: d.Rate != null ? Number(d.Rate) : 0,
          ExchangeRate:
            d.ExchangeRate != null
              ? Number(d.ExchangeRate)
              : raw.ExchangeRate != null
              ? Number(raw.ExchangeRate)
              : 1,
          Amount: d.Amount != null ? Number(d.Amount) : 0,
          TaxableAmount:
            d.TaxableAmount != null
              ? Number(d.TaxableAmount)
              : d.Amount != null
              ? Number(d.Amount)
              : 0,
          TaxPercentage1:
            d.TaxPercentage1 != null ? Number(d.TaxPercentage1) : 0,
          TaxAmount1: d.TaxAmount1 != null ? Number(d.TaxAmount1) : 0,
          TaxPercentage2:
            d.TaxPercentage2 != null ? Number(d.TaxPercentage2) : 0,
          TaxAmount2: d.TaxAmount2 != null ? Number(d.TaxAmount2) : 0,
          LocalAmount: d.LocalAmount != null ? Number(d.LocalAmount) : 0,
          PartyAmount: d.PartyAmount != null ? Number(d.PartyAmount) : 0,
          MasterJobSid: d.MasterJobSid ? Number(d.MasterJobSid) : null,
          HouseJobSid: d.HouseJobSid ? Number(d.HouseJobSid) : null,
          YearMasterSid: YearMasterSid,
          CostRevenueChargesSid: d.CostRevenueChargesSid ? Number(d.CostRevenueChargesSid) : null
        };
        return detail;
      }
    );

    const rawVoucherOthers = raw.voucherOthers
      ? { ...raw.voucherOthers }
      : null;

    const voucherOthersCandidate =
      this.buildVoucherOthersPayload(rawVoucherOthers);

    const payload: any = {
      ...(this.isEditMode
        ? { UpdatedBy: this.currUserEmail }
        : { CreatedBy: this.currUserEmail }),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherDate: raw.VoucherDate ? new Date(raw.VoucherDate) : null,
      current_date : getDefaultTodayDate(),
      GST_VAT: raw.GST_VAT || undefined,
      PartyMasterSid: raw.PartyMasterSid ?? null,
      DepartmentMasterSid: raw.DepartmentMasterSid || null,
      PartyName: raw.PartyName || '',
      PartyAddress: raw.PartyAddress || '',
      CustomerBranchSid: raw.CustomerBranchSid ?? null,
      PlaceOfSupply: raw.PlaceOfSupply || '',
      COAMasterSid: raw.COAMasterSid ?? 1,
      InvoiceType: raw.InvoiceType || 'REG',
      GSTType: raw.GSTType || '',
      TaxType : raw.TaxType || "VAT",
      CurrencyMasterSid: raw.CurrencyMasterSid ?? null,
      PostStatus: raw.PostStatus || 'U',
      CurrencyCode: raw.CurrencyCode || undefined,
      ExchangeRate:
        raw.ExchangeRate != null ? Number(raw.ExchangeRate) : undefined,
      MasterJobSid: raw.MasterJobSid ?? null,
      HouseJobSid: raw.HouseJobSid ? Number(raw.HouseJobSid) : null,
      Narration: raw.Narration !== undefined ? raw.Narration : undefined,
      status: raw.status != null ? raw.status : 'A',
      VoucherDetail:
      voucherDetailArray.length > 0 ? voucherDetailArray : undefined,
      YearMasterSid: YearMasterSid,

      DocumentNumber: raw.DocumentNumber || undefined,
      Remarks: raw.Remarks || undefined,
    };

    if (voucherOthersCandidate) {
      payload.VoucherOthers = voucherOthersCandidate;
    }

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    this.isSaving = true;
    this.spinner.show();

    if (this.isEditMode && this.headerId) {
      this.operationService.updateInvoiceById(this.headerId, payload).subscribe({
        next: async (resp: any) => {
          this.isSaving = false;
          if (resp.status) {
            this.isDirty = false;
            if(isPostingTrue){
              await this.postVoucher();
            } else {
              this.appSettingService.showSuccess(resp.message);
              this.spinner.hide();
            }
            if (resolve) resolve(true);
            this.loadInvoiceById(this.headerId);
          } else {
            this.appSettingService.showError(resp.message);
            if (resolve) resolve(false);
            this.spinner.hide();
          }
        },
        error: (error) => {
          this.appSettingService.showError('Failed to update invoice');
          this.isSaving = false;
          if (resolve) resolve(false);
          this.spinner.hide();
        }
      })
    } else {
      this.operationService.createInvoice(payload).subscribe({
        next: async (resp: any) => {
          this.isSaving = false;
          if (resp.status) {
            this.isDirty = false;
            this.headerId = resp.data?.VoucherHeaderSid;
            if(isPostingTrue){
              await this.postVoucher();
            } else {
              this.appSettingService.showSuccess(resp.message);
              this.spinner.hide();
            }
            if (resolve) resolve(true);
            if (this.headerId) {
              this.router.navigate(['operation/invoice/entry', this.headerId]);
            }
          } else {
            this.appSettingService.showError(resp.message);
            if (resolve) resolve(false);
            this.spinner.hide();
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.appSettingService.showError('Failed to create invoice');
          if (resolve) resolve(false);
          this.spinner.hide();
        }
      })
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
      const customerBranchFromForm = toNumber(this.invoiceForm.get('CustomerBranchSid')?.value);
      const customerState = this.customerBranchList.find(
        c => c.CustomerBranchSid === customerBranchFromForm
      )?.StateMasterSid;
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
        current_date : getDefaultTodayDate(),
        TaxDetails: {
          CountryMasterSid: currentCompanyCountry,
          countryCode: this.currentCompanyCountryCode,
          TaxCategory: interOrIntra,
          EffectiveFrom: this.invoiceForm.get('VoucherDate')?.getRawValue() ?? new Date().toISOString(),
          TaxType: 'Input',
        },
      };

      const result = await firstValueFrom(
        this.operationService.postVoucherByVoucherSid(postPayload)
      );
      this.spinner.hide();
      if(result.status) {
        this.appSettingService.showSuccess(result.message);
        this.invoiceData.PostStatus = 'P';
        if (notFromSubmit) {
          this.loadInvoiceById(this.headerId);
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
    if (this.invoiceData?.PostStatus === 'P' && !this.invoiceForm.disabled) {
      this.invoiceForm.disable();
    }
    return this.invoiceData?.PostStatus === 'P' || false;
  }

  // Check if voucher is draft
  get isDraft(): boolean {
    return (
      !this.invoiceData?.PostStatus || this.invoiceData?.PostStatus === 'U'
    );
  }

  onReset() {
    this.invoiceForm.reset({ status: 'A' });
  }

  goBack() {
    this.router.navigate(['operation/invoice/list']);
  }


  getHSSACCode(hssacSid: number, rowIndex?: number): string {
    // First, try to get from hssacList using the HSSACMasterSid
    if (hssacSid && this.hssacList && this.hssacList.length > 0) {
      const hssac = (this.hssacList[rowIndex] || []).find(
        (h) =>
          h.HSSACMasterSid === hssacSid ||
          h.hssacMasterSid === hssacSid ||
          h.HSSACMasterId === hssacSid ||
          h.ChargeTaxMasterSid === hssacSid ||
          h.chargeTaxMasterSid === hssacSid
      );
      if (hssac) {
        const result =
          hssac?.HSSACCode ||
          hssac?.hssacCode ||
          hssac?.HSNCode ||
          hssac?.hsnCode ||
          hssac?.SACCode ||
          hssac?.sacCode ||
          '-';
        return result;
      }
    }

    // Fallback: If rowIndex is provided and HSSACMasterSid is null, try to get HSN from chargeMaster
    if (
      rowIndex !== undefined &&
      !hssacSid &&
      this.details &&
      this.details.length > rowIndex
    ) {
      const row = this.details.at(rowIndex);
      const chargeSid = row?.get('ChargeMasterSid')?.value;
      if (chargeSid) {
        const charge = this.chargeList?.find(
          (c: any) => c.ChargeMasterSid === chargeSid
        );
        if (
          charge?.chargeTaxMaster &&
          Array.isArray(charge.chargeTaxMaster) &&
          charge.chargeTaxMaster.length > 0
        ) {
          const hsnCode =
            charge.chargeTaxMaster[0]?.HSNCode ||
            charge.chargeTaxMaster[0]?.hsnCode ||
            charge.chargeTaxMaster[0]?.HSSACCode;
          if (hsnCode) {
            return hsnCode;
          }
        }
      }
    }
    return '-';
  }

  getUOMCode(uomSid: number): string {
    const uom = this.uomList.find((u) => u.UOMMasterSid === uomSid);
    return uom?.UOMCode || uom?.UOMName || '-';
  }

  getMasterJobNumber(jobSid: number): string {
    const job = this.masterJobList.find((j) => j.MasterJobSid === jobSid);
    return job?.MasterJobNumber || job?.displayLabel || '-';
  }

  // Print Modal Methods
  async openPrintModal() {
    if (!this.headerId) {
      this.appSettingService.showWarning('Please save the invoice first.');
      return;
    }

    this.spinner.show();

    try {
      await this.preparePrintData();
      console.log("PRINT DATA", this.invoicePrintData);
      this.modalService.open(this.printModalRef, {
        size: 'xl',
        scrollable: true
      });

    } finally {
      this.spinner.hide();
    }
  }


  openEmailModal() {
    this.initializeEmailForm();
    this.modalService.open(this.emailModalRef, { size: 'lg' });
  }

  initializeEmailForm() {
    const customerBranchSid = this.invoiceForm.get('PartyName')?.value;
    const customerBranch = this.customerBranchList.find(
      (b) => b.CustomerBranchSid === customerBranchSid
    );
    const customerEmail = customerBranch?.Email || customerBranch?.email || '';

    // Get company email from company config if available
    let fromEmail = this.currUserEmail || '';
    if (this.currentCompany?.config?.systemSettings?.emailConfig?.fromEmail) {
      fromEmail =
        this.currentCompany.config.systemSettings.emailConfig.fromEmail;
    }

    this.emailForm = this.fb.group({
      from: [fromEmail, [Validators.required, Validators.email]],
      to: [customerEmail, [Validators.required, Validators.email]],
      cc: ['', Validators.email],
      subject: [
        `Invoice ${this.invoiceForm.get('VoucherNumber')?.value}`,
        Validators.required,
      ],
      message: [
        'Please find attached invoice for your reference.\n\nThank you for your business.',
      ],
    });
  }

  async sendInvoiceEmail() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      this.appSettingService.showWarning(
        'Please fill all required email fields correctly.'
      );
      return;
    }

    try {
      this.spinner.show();

      // Generate PDF blob
      const pdfBlob = await this.generatePDFBlob();
      if (!pdfBlob) {
        this.appSettingService.showError(
          'Failed to generate PDF. Please try again.'
        );
        this.spinner.hide();
        return;
      }

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const pdfBase64 = base64data.split(',')[1]; // Remove data:application/pdf;base64, prefix

        const emailData = this.emailForm.value;
        const voucherNumber =
          this.invoiceForm.get('VoucherNumber')?.value || 'Invoice';
        const filename = `Invoice_${voucherNumber}.pdf`;

        // Prepare payload for API
        const payload = {
          companyId: this.currentCompany?.CompanyMasterSid || null,
          from: emailData.from,
          to: emailData.to,
          cc: emailData.cc || '',
          subject: emailData.subject,
          message: emailData.message,
          pdfBase64: pdfBase64,
          filename: filename,
          invoiceDetails: {
            companyName: this.currentCompany?.CompanyName || 'Company Name',
            invoiceNumber: voucherNumber,
            invoiceDate: this.formatDate(
              this.invoiceForm.get('VoucherDate')?.value
            ),
            totalAmount: this.getGrandTotal().toFixed(2),
            currency: this.invoiceForm.get('CurrencyCode')?.value || '',
          },
        };

        // Call API to send email
        this.operationService.sendInvoiceEmail(payload).subscribe({
          next: (resp: any) => {
            this.spinner.hide();
            if (resp?.status) {
              this.appSettingService.showSuccess(
                'Invoice email sent successfully!'
              );
              this.modalService.dismissAll();
            } else {
              this.appSettingService.showError(
                resp?.message || 'Failed to send email.'
              );
            }
          },
          error: (err) => {
            this.spinner.hide();
            console.error('Error sending email:', err);
            this.appSettingService.showError(
              'Failed to send invoice email. Please try again.'
            );
          },
        });
      };

      reader.onerror = () => {
        this.spinner.hide();
        this.appSettingService.showError(
          'Failed to process PDF. Please try again.'
        );
      };
    } catch (error) {
      this.spinner.hide();
      console.error('Error in sendInvoiceEmail:', error);
      this.appSettingService.showError(
        'An error occurred while sending email.'
      );
    }
  }

  getCustomerBranchName(): string {
    const branchSid = this.invoiceForm.get('PartyName')?.value;
    if (!branchSid) return '-';
    const branch = this.customerBranchList.find(
      (b) => b.CustomerBranchSid === branchSid
    );
    return branch?.CustomerBranchName || branch?.CustomerName || '-';
  }

  formatDate(date: any): string {
    if (!date) return '-';
    // Handle NgbDateStruct
    if (date.year && date.month && date.day) {
      return `${date.day.toString().padStart(2, '0')}/${date.month
        .toString()
        .padStart(2, '0')}/${date.year}`;
    }
    // Handle Date object or string
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }

  getAmountInWords(total: number, currencySid: number): string {
    if (!total) return '';
    return this.numberToWords.convert(total, currencySid);
  }

  getGrandTotal(): number {
    return this.round(
      this.getTotalCurrencyAmount() + toNumber(this.getTotalTaxAmount())
    );
  }
  getCustomerName(CustomerMasterSid: number) {
    if (!CustomerMasterSid || this.customerList.length === 0) {
      return '';
    }
    return this.customerList.find(
      (cus) => cus.CustomerMasterSid === CustomerMasterSid
    )?.CustomerName;
  }

  async getAndStoreBankDetails(): Promise<void> {
    try {
      const resp: any = await firstValueFrom(this.getBankDetails());
      this.isBankFetched = true;
      this.bankDetails = resp?.status && resp.data ? resp.data : [];

    } catch (err) {
      console.error('Error fetching bank details', err);
      this.bankDetails = [];
    }
  }

  getBankDetails() : Observable<any> {
    const partyCurrencyId = this.invoiceForm.get('CurrencyMasterSid')?.getRawValue();
    const payload = {
      CurrencyMasterSid : partyCurrencyId,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    }
    return this.operationService.getBankDetails(payload);
  }



  getRowTotal(detail: any): number {
    const taxable = Number(detail.TaxableAmount || 0);
    const cgst = Number(detail.TaxAmount1 || 0);
    const sgst = Number(detail.TaxAmount2 || 0);
    const igst = Number(detail.TaxAmount1 || 0);

    return taxable + cgst + sgst + igst;
  }

  getGrandRowTotal(): number {
    return this.filteredDetailItems.reduce((sum, detail) => {
      return sum + this.getRowTotal(detail);
    }, 0);
  }
  getInvoiceTitle(): string {
    const postStatus = this.invoiceData?.PostStatus || 'U';
    return postStatus === 'P' ? 'TAX INVOICE' : 'TAX INVOICE DRAFT';
  }

  getDisplayValue(cargoValue: any, bookingValue: any): string {
    return cargoValue || bookingValue || '';
  }

  showInfo() {
    if (!this.invoiceData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.invoiceData;
    modalRef.componentInstance.idLabel = 'Invoice Id';
    modalRef.componentInstance.idValue = this.invoiceData?.VoucherHeaderSid;
  }
  
  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    if (this.currentCompany?.CompanyMasterSid === 13) {
    const staticTerms = [
      { sno: 1, TandC: 'If any discrepancy is noticed in the invoice, kindly inform us in writing within 7 days, otherwise the above amount will be considered as correct.' },
      { sno: 2, TandC: 'Please mention our invoice number(s) on your remittance instructions.' },
    ];
    const modalRef = this.modalService.open(TermsAndConditionsComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
    modalRef.componentInstance.terms = staticTerms;
    modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
    modalRef.componentInstance.DocumentSid = this.headerId;
    return;
  }

    // If already fetched simply open the modal
    if(this.TandCFetched){
      const modalRef = this.modalService.open(TermsAndConditionsComponent, {
        size: 'lg',
        backdrop: 'static',
        centered: true,
      });
      modalRef.componentInstance.terms = this.TandCList;
      modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
      modalRef.componentInstance.DocumentSid = this.headerId;
      return;
    }

    // If not fetched then fetch and open the modal
    this.getTandC().subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCFetched = true;
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true,
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.headerId;
        } else {
          this.appSettingService.showError(
            'Error loading Terms and Conditions'
          );
        }
      },
      (error) => {
        this.appSettingService.showError(
          'Error loading Terms and Conditions',
          error
        );
      }
    );
  }

  async getAndStoreTandC() : Promise<void> {
    try {
      const result = await firstValueFrom(this.getTandC());
      this.TandCFetched = true;
      if(result.status){
        this.TandCList = result.data;
      } else {
        this.TandCList = [];
      }
    } catch (error) {
      console.error(error);
      this.TandCList = [];
    }
  }

  getTandC() : Observable<any> {
    // if(this.currentCompany.CompanyMasterSid === 13){
    //   return of([
    //     { sno : 1 , TandC : 'If any discrepancy is noticed in the invoice, kindly inform us in writing within 7 days, otherwise the above amount will be considered as correct.' },
    //     { sno : 2 , TandC : 'Please mention our invoice number(s) on your remittance instructions.' },
    //   ])
    // }

    return this.masterService.getTandCByCondition({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.invoiceData?.VoucherHeaderSid,
    });
  }

  openEmail() {
    if (!this.invoiceData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.invoiceData;
    modalRef.componentInstance.idLabel = 'Invoice Id';
    modalRef.componentInstance.idValue = this.invoiceData?.VoucherHeaderSid;
  }

  openAuthority() {
    const MenuMasterSid = localStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    // modalRef.componentInstance.documentSid = this.VoucherHeaderSid;
  }

  openEDoc() {
    if (!this.invoiceData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.invoiceData;
    modalRef.componentInstance.idLabel = 'Invoice Id';
    modalRef.componentInstance.idValue = this.invoiceData.VoucherHeaderSid;
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.invoiceData?.VoucherHeaderSid,
    };

    this.commonService.documentData.set(data);
  }

  openFollowup() {}
  onHeaderCurrencyChange(selectedCurrency: any) {
    if (!selectedCurrency) return;
    const currencyCode = selectedCurrency?.currencyCode;
    const companyCurrencyCode = this.currentCompanyCurrency?.code;

    // If same as company currency, set exchange rate to 1 and disable
    if (currencyCode === companyCurrencyCode) {
      this.invoiceForm.patchValue({
        CurrencyMasterSid: selectedCurrency.CurrencyMasterSid,
        CurrencyCode: selectedCurrency.currencyCode,
        ExchangeRate: 1,
      });
      this.invoiceForm.get('ExchangeRate')?.disable();
    } else {
      // Different currency - fetch exchange rate and enable field
      this.fetchExchangeRate(currencyCode, companyCurrencyCode);
    }
  }

  getPartyAmount(detailIndex: number) {
    const detail = (this.details.at(detailIndex) as FormGroup)?.getRawValue();
    const voucherHeaderCurrency = this.invoiceForm.get('CurrencyCode')?.value;
    const voucherHeaderExRate = this.invoiceForm.get('ExchangeRate')?.value;
    const chargeCurrencyCode = detail.CurrencyCode;
    const chargeCurrencyId = this.currencyList.find(
      (cr) => detail.CurrencyCode === cr.currencyCode
    )?.CurrencyMasterSid;

    if (detail.IsAutoGenerated) {
      return this.getFormattedAmount(
        toNumber(detail.PartyAmount),
        chargeCurrencyId
      );
    }

    // Same currency → no conversion
    if (chargeCurrencyCode === voucherHeaderCurrency) {
      return this.getFormattedAmount(toNumber(detail.Amount), chargeCurrencyId);
    } else {
      return this.getFormattedAmount(
        toNumber(detail.LocalAmount) / toNumber(voucherHeaderExRate),
        chargeCurrencyId
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
    CurrencyMasterSid: number
  ): number {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid
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
    CurrencyMasterSid: number
  ): string {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid
    );
    const formattedExchangeRate =  this.currencyFormatter.formatExchangeRate({
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
    return 2;
  }

  public getFormattedAndPaddedAmount(amount: number | string, CurrencyMasterSid: number) {
    const currency = this.currencyList.find(
      (currency) => currency.CurrencyMasterSid === CurrencyMasterSid
    );
    const input = {
      value: toNumber(amount),
      currencyCode: currency?.currencyCode,
    };
    const formattedAmount = this.currencyFormatter.formatAmount(input, false);
    const digitForPadding = this.getAmountDecimalPlaces(CurrencyMasterSid);
    console.log("formattedAmount", formattedAmount);
    console.log("digitForPadding", digitForPadding);
    return Number(formattedAmount).toFixed(digitForPadding);
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
    return this.currencyFormatter.formatAmount(input, false);
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
    return 2;
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

    const invoiceDate = this.invoiceForm.get('VoucherDate')?.getRawValue() ?? new Date();
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode,
      toCurrencyCode,
      EffectiveFrom: invoiceDate
        ? new Date(invoiceDate)
        : new Date(),
      segment: 'revenue',
    };

    this.operationService.getExchangeRate(payload).subscribe({
      next: (response: any) => {
        if (response?.status) {
          const formGroup = this.details.at(index) as FormGroup;
          if (response.data) {
            formGroup.patchValue({ 
              ExchangeRate: toNumber(this.getFormattedExchangeRate(response.data,fromCurrencyId)) 
            });
            const key = this.buildExchangeRateMapKey(fromCurrencyCode,toCurrencyCode,invoiceDate);
            this.exchangeRateMap.set(key,response.data);
          } else {
            formGroup.patchValue({ 
              ExchangeRate: toNumber(this.getFormattedExchangeRate(0,fromCurrencyId)) 
            });
            this.appSettingService.showError(response.message);
          }
          formGroup.get('ExchangeRate')?.enable();
          this.recalcRow(index);
        } else {
          formGroup.patchValue({
            ExchangeRate: toNumber(this.getFormattedExchangeRate(0,fromCurrencyId)) 
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
          ExchangeRate: toNumber(this.getFormattedExchangeRate(0,fromCurrencyId)) 
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
    const headerCurrency = this.invoiceForm.get('CurrencyMasterSid')?.getRawValue();
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
    const headerCurrency = this.invoiceForm.get('CurrencyMasterSid')?.getRawValue();
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


  private fetchExchangeRate(fromCurrencyCode: string, toCurrencyCode: string) {
    const invoiceDate = this.invoiceForm.get('VoucherDate')?.getRawValue() ?? new Date();
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode: fromCurrencyCode,
      toCurrencyCode: toCurrencyCode,
      EffectiveFrom: invoiceDate
        ? new Date(invoiceDate)
        : new Date(),
      segment: 'revenue',
    };

    if (!fromCurrencyCode || !toCurrencyCode) {
      return;
    }

    const fromCurrencyId = this.currencyList.find(
      (c) => c.currencyCode === fromCurrencyCode
    )?.CurrencyMasterSid;

    if (fromCurrencyCode === toCurrencyCode) {
      this.invoiceForm.patchValue({
        CurrencyMasterSid: fromCurrencyId,
        CurrencyCode: fromCurrencyCode,
        ExchangeRate: this.getFormattedExchangeRate(1, fromCurrencyId),
      });
      this.invoiceForm.get('ExchangeRate')?.disable();
      return;
    }

    this.operationService.getExchangeRate(payload).subscribe({
      next: (resp: any) => {
        // Response status : true
        if (resp?.status) {
          //  If data = something like 3.56
          if (resp.data) {
            this.invoiceForm.patchValue({
              CurrencyMasterSid: fromCurrencyId,
              CurrencyCode: fromCurrencyCode,
              ExchangeRate: this.getFormattedExchangeRate(resp.data, fromCurrencyId)
            });
            const key = this.buildExchangeRateMapKey(fromCurrencyCode, toCurrencyCode,invoiceDate);
            this.exchangeRateMap.set(key, resp.data);
          }
          // if data = null , then Exchange Rate not found for the conversion
          else {
            this.appSettingService.showError(resp.message);
            this.invoiceForm.patchValue({
              CurrencyMasterSid: fromCurrencyId,
              CurrencyCode: fromCurrencyCode,
              ExchangeRate: this.getFormattedExchangeRate(0, fromCurrencyId)
            });
          }
          this.invoiceForm.get('ExchangeRate')?.enable();
          this.recalculateAllRows();
        } else {
          // Response status : false
          this.appSettingService.showError(resp.message);
          this.invoiceForm.patchValue({
            CurrencyMasterSid: fromCurrencyId,
            CurrencyCode: fromCurrencyCode,
            ExchangeRate: this.getFormattedExchangeRate(0, fromCurrencyId),
          });
          this.invoiceForm.get('ExchangeRate')?.enable();
        }
      },
      error: (err) => {
        console.error('Error fetching exchange rate:', err);
        // Default to 1 if API fails
        this.invoiceForm.patchValue({
          CurrencyMasterSid: fromCurrencyId,
          CurrencyCode: fromCurrencyCode,
          ExchangeRate: this.getFormattedExchangeRate(0, fromCurrencyId)
        });
        this.invoiceForm.get('ExchangeRate')?.enable();
      },
    });
  }

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

      // Determine Input/Output - INVOICE = OUTPUT (selling goods/services)
      const inputOrOutput: 'Input' | 'Output' = 'Input';

      const companyState = this.currentBranchStateName;
      const customerCountry = this.getCustomerCountry();
      const taxCategory = this.determineTaxCategory(
        companyState,
        placeOfSupplyState,
        customerCountry
      );

      const payload = {
        taxGroup: taxGroupSid,
        InputOrOutput: inputOrOutput,
        TaxCategory: taxCategory,
        CountryMasterSid: currentCountry,
      };

      const response = await firstValueFrom(
        this.operationService.getLedgerForTaxGroup(payload).pipe(
          catchError((error) => {
            console.error('Error calling getLedgerForTaxGroup:', error);
            return of(null);
          })
        )
      );

      let key = this.buildKey(
        payload.taxGroup,
        payload.InputOrOutput,
        payload.TaxCategory,
        payload.CountryMasterSid
      );

      if (this.taxGroupMap.has(key)) {
        return this.taxGroupMap.get(key);
      }

      if (response?.status && response.data && response.data.length > 0) {
        const taxGroupData = response.data[0];

        // Return individual tax master records for proper calculation
        if (taxGroupData.taxMaster && Array.isArray(taxGroupData.taxMaster)) {
          const taxMasters = taxGroupData.taxMaster || [];
          this.taxGroupMap.set(key, taxMasters);
          return taxGroupData.taxMaster;
        }

        // Fallback to tax group rate if no individual tax masters
        const taxMasters = taxGroupData;
        this.taxGroupMap.set(key, taxMasters);
        return [taxGroupData];
      } else {
        console.warn(
          'No tax ledger data found for HSSACCode:',
          hssacItem?.HSSACCode
        );
        return null;
      }
    } catch (error) {
      console.error('Error fetching tax ledger:', error);
      return null;
    }
  }

  private getCustomerCountry(): string {
    const customer = this.customerList.find(
      (c) =>
        c.SubledgerMasterSid === this.invoiceForm.get('PartyMasterSid')?.value
    );
    return customer?.countryMaster?.countryCode || '';
  }

  /**
   * Determine tax category based on company state and place of supply
   */
  private determineTaxCategory(
    companyState: string,
    billingPartyState: string,
    customerCountry: string
  ): 'Inter' | 'Intra' {
    if (!companyState || !billingPartyState) {
      return 'Inter';
    }

    // Normalize country codes for comparison
    const normalizedCustomerCountry = customerCountry?.toLowerCase() || '';
    const isIndianCustomer = normalizedCustomerCountry === 'in';
    const isInternationalCustomer =
      !isIndianCustomer && normalizedCustomerCountry !== '';

    // For international customers (like Dubai), use 'Inter' category for VAT
    if (isInternationalCustomer) {
      return 'Inter';
    }

    // For Indian customers, check if same state or different state
    const normalizedCompanyState = companyState.trim().toLowerCase();
    const normalizedBillingState = billingPartyState.trim().toLowerCase();

    const isSameState = normalizedCompanyState === normalizedBillingState;
    return isSameState ? 'Inter' : 'Intra';
  }

  printDiv(divId: string): void {

    setTimeout(() => {
      const printContents = document.getElementById(divId)?.innerHTML;
      if (!printContents) return;

      const popupWin = window.open('', '_blank', 'width=900,height=600');
      if (popupWin) {
        popupWin.document.open();
        popupWin.document.write(`
        <html>
          <head>
            <title>Print</title>
          </head>
          <body onload="window.print(); window.close();">
            ${printContents}
          </body>
        </html>
      `);
        popupWin.document.close();
      }
    }, 50); // small timeout so Angular updates DOM
  }

  // pdf

  async downloadPDF() {
    this.spinner.show();
    try {
      await this.preparePrintData();
      const logo = this.pdfMakeService.getReportLogo();

      const lookups = {
        hssacMaster: this.hssacList?.flat() || [],
        currencyMaster: this.currencyList || []
      };

      const options = {
        taxDisplayConfig: this.getTaxDisplayConfig(),
        bankDetails: this.bankDetails || [],
        terms: this.TandCList || [],
        amountInWords: this.invoicePrintData?.AmountInWords || '',
        localCurrency: this.currentCompanyCurrency?.code || '',
        invoiceTitle: this.invoicePrintData?.invoiceTitle || '',
        // Additional options for matching original PDF
        isSeaMode: this.isSeaDepartment(),
        isVATMode: this.isVATMode,
        companyVatNo: this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
        shipmentDetails: {
          shipper: this.invoicePrintData?.ShipperName,
          consignee: this.invoicePrintData?.ConsigneeName,
          vesselName: this.invoicePrintData?.Vessel,
          voyageNo: this.invoicePrintData?.VoyageNo,
          shipperRefNo: this.invoicePrintData?.CustomerRefNo,
          loadingPort: this.invoicePrintData?.POL,
          finalDestination: this.invoicePrintData?.FPD,
          etd: this.invoicePrintData?.ETD,
          eta: this.invoicePrintData?.ETA,
          invoiceDueDate: this.invoicePrintData?.InvoiceDueDate
        },
        cargoDetails: {
          packages: this.invoicePrintData?.pkg,
          commodityDesc: this.invoicePrintData?.desc,
          grossWeight: this.invoicePrintData?.grosswt,
          chargeableWeight: this.invoicePrintData?.ChargeableWeight,
          cbm: this.invoicePrintData?.cbm
        },
        invoicePrintData: this.invoicePrintData
      };

      this.pdfMakeService.generateInvoiceFromApi(
        this.invoiceData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        lookups,
        options
      );
      this.appSettingService.showSuccess('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }


  async generatePDFBlob(): Promise<Blob | null> {
    try {
      await this.preparePrintData();
      const logo = this.pdfMakeService.getReportLogo();

      const lookups = {
        hssacMaster: this.hssacList?.flat() || [],
        currencyMaster: this.currencyList || []
      };

      const options = {
        taxDisplayConfig: this.getTaxDisplayConfig(),
        bankDetails: this.bankDetails || [],
        terms: this.TandCList || [],
        amountInWords: this.invoicePrintData?.AmountInWords || '',
        localCurrency: this.currentCompanyCurrency?.code || '',
        invoiceTitle: this.invoicePrintData?.invoiceTitle || '',
        // Additional options for matching original PDF
        isSeaMode: this.isSeaDepartment(),
        isVATMode: this.isVATMode,
        companyVatNo: this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
        shipmentDetails: {
          shipper: this.invoicePrintData?.ShipperName,
          consignee: this.invoicePrintData?.ConsigneeName,
          vesselName: this.invoicePrintData?.Vessel,
          voyageNo: this.invoicePrintData?.VoyageNo,
          shipperRefNo: this.invoicePrintData?.CustomerRefNo,
          loadingPort: this.invoicePrintData?.POL,
          finalDestination: this.invoicePrintData?.FPD,
          etd: this.invoicePrintData?.ETD,
          eta: this.invoicePrintData?.ETA,
          invoiceDueDate: this.invoicePrintData?.InvoiceDueDate
        },
        cargoDetails: {
          packages: this.invoicePrintData?.pkg,
          commodityDesc: this.invoicePrintData?.desc,
          grossWeight: this.invoicePrintData?.grosswt,
          chargeableWeight: this.invoicePrintData?.ChargeableWeight,
          cbm: this.invoicePrintData?.cbm
        }
      };

      const blob = await this.pdfMakeService.generateInvoiceBlobFromApi(
        this.invoiceData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        lookups,
        options
      );

      return blob;
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      return null;
    }
  }

  // Helper methods for tax display logic
  shouldShowCGSTSGST(): boolean {
    if (this.currentCompanyCountryCode !== 'in') return false;

    const companyState = this.currentBranchState.stateName;
    const placeOfSupply = this.invoiceForm.get('PlaceOfSupply')?.value;

    if (!companyState || !placeOfSupply) return false;

    return (
      companyState.trim().toLowerCase() === placeOfSupply.trim().toLowerCase()
    );
  }

  shouldShowIGST(): boolean {
    if (this.currentCompanyCountryCode !== 'in') return false;

    const companyState = this.currentBranchStateName;
    const placeOfSupply = this.invoiceForm.get('PlaceOfSupply')?.value;

    if (!companyState || !placeOfSupply) return false;

    return (
      companyState.trim().toLowerCase() !== placeOfSupply.trim().toLowerCase()
    );
  }

  shouldShowVAT(): boolean {
    return this.currentCompanyCountryCode !== 'in';
  }

  getTaxDisplayConfig(): {
    showCGST: boolean;
    showSGST: boolean;
    showIGST: boolean;
    showVAT: boolean;
  } {
    const gstType = this.invoiceForm.get('GSTType')?.value;
    const isIndia = this.currentCompanyCountryCode === 'in';

    if (!isIndia) {
      // Non-India countries (like UAE) - show VAT only
      return {
        showCGST: false,
        showSGST: false,
        showIGST: false,
        showVAT: true,
      };
    }

    // India GST logic
    if (gstType === 'CGST+SGST') {
      // Same state - show CGST and SGST
      return {
        showCGST: true,
        showSGST: true,
        showIGST: false,
        showVAT: false,
      };
    } else if (gstType === 'IGST') {
      // Different state - show IGST only
      return {
        showCGST: false,
        showSGST: false,
        showIGST: true,
        showVAT: false,
      };
    } else if (gstType === 'B2C') {
      // B2C - show CGST only (for B2C in India)
      return {
        showCGST: true,
        showSGST: false,
        showIGST: false,
        showVAT: false,
      };
    } else if (gstType === 'VAT') {
      // VAT (shouldn't happen for India, but just in case)
      return {
        showCGST: false,
        showSGST: false,
        showIGST: false,
        showVAT: true,
      };
    }

    
    // Default: Show all GST columns for India
    return {
      showCGST: true,
      showSGST: true,
      showIGST: true,
      showVAT: false,
    };
  }

  
  getSalesmanName(): string {
    return this.salesmanName || '';
  }

  fetchSalesmanName(UserMasterSid : number){
    if(!UserMasterSid || UserMasterSid === undefined) return;
    this.masterService.getFfUserById(UserMasterSid).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.salesmanName = resp.data?.userName;
        }
      },
      error: (error) => {
        console.error('Error fetching salesman name:', error);
      }
    });
  }

  getTaxPercentageForDisplay(detail: any): {
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    vatRate: number;
  } {
    const gstType = this.invoiceForm.get('GSTType')?.value;

    if (gstType === 'CGST+SGST') {
      return {
        cgstRate: detail.TaxPercentage1 || 0,
        sgstRate: detail.TaxPercentage2 || 0,
        igstRate: 0,
        vatRate: 0,
      };
    } else if (gstType === 'IGST') {
      return {
        cgstRate: 0,
        sgstRate: 0,
        igstRate: detail.TaxPercentage1 || 0,
        vatRate: 0,
      };
    } else if (gstType === 'B2C') {
      return {
        cgstRate: detail.TaxPercentage1 || 0,
        sgstRate: 0,
        igstRate: 0,
        vatRate: 0,
      };
    } else if (gstType === 'VAT') {
      return {
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
        vatRate: detail.TaxPercentage1 || 0,
      };
    }

    return {
      cgstRate: detail.TaxPercentage1 || 0,
      sgstRate: detail.TaxPercentage2 || 0,
      igstRate: detail.TaxPercentage1 || 0,
      vatRate: detail.TaxPercentage1 || 0,
    };
  }
  getTaxAmountForDisplay(detail: any): {
    cgstAmt: number;
    sgstAmt: number;
    igstAmt: number;
    vatAmt: number;
  } {
    const taxType = this.invoiceForm.get('TaxType')?.value;
    const currentCompanyState = toNumber(this.currentBranch?.StateMasterSid)
    const customerBranchFromForm = toNumber(this.invoiceForm.get('CustomerBranchSid')?.value);
    const customerState = this.customerBranchList.find(
      c => c.CustomerBranchSid === customerBranchFromForm
    )?.StateMasterSid;
    console.log("DEBUG getTaxAmountForDisplay",{
      taxType,
      currentCompanyCountry : this.currentCompanyCountryCode,
      currentCompanyState,
      customerBranchFromForm,
      customerState
    })
    if(this.currentCompanyCountryCode === 'in'){
      if(currentCompanyState === customerState){
        return {
          cgstAmt: detail.TaxAmount1 || 0,
          sgstAmt: detail.TaxAmount2 || 0,
          igstAmt: 0,
          vatAmt: 0,
        }
      } else {
        return {
          cgstAmt: detail.TaxAmount1 || 0,
          sgstAmt: 0,
          igstAmt: 0,
          vatAmt: 0,
        }
      }
    }
    if (taxType === 'VAT') {
      return {
        cgstAmt: 0,
        sgstAmt: 0,
        igstAmt: 0,
        vatAmt: detail.TaxAmount1 || 0,
      };
    }

    return {
      cgstAmt: toNumber(detail.TaxAmount1) || 0,
      sgstAmt: toNumber(detail.TaxAmount2) || 0,
      igstAmt: toNumber(detail.TaxAmountIGST) || 0,
      vatAmt: toNumber(detail.TaxAmount1) || 0
    };
  }
  
  shouldShowGSTTypeField(): boolean {
    return this.currentCompanyCountryCode === 'in';
  }

  shouldShowForeignCurrencyColumn(): boolean {
    return this.invoiceData?.CurrencyCode !== this.currentCompanyCurrency?.code;
  }

  getLocalCurrencyTotal(): number {
    const currencyTotal = Number(this.getTotalCurrencyAmount()) || 0;
    let taxTotal = 0;
    for (let i = 0; i < this.details.length; i++) {
      const taxAmt1 = Number(this.details.at(i).get('TaxAmount1')?.value || 0);
      const taxAmt2 = Number(this.details.at(i).get('TaxAmount2')?.value || 0);
      taxTotal += taxAmt1 + taxAmt2;
    }
    return currencyTotal + taxTotal;
  }

  /**
   * Get shipment field value based on priority: HouseJob > MasterJob > BookingHeader
   * Note: MasterJob only has POL and FPD directly. VesselName, VoyageNo, ETD, ETA
   * are in MasterJobVoyage (not included in API), so these fall back to bookingHeader.
   */
  getShipmentFieldValue(fieldName: 'VesselName' | 'VoyageNo' | 'POL' | 'FPD' | 'ETD' | 'ETA'): any {
    const hasHouseJob = !!this.invoiceData?.HouseJobSid;
    const hasMasterJob = !!this.invoiceData?.MasterJobSid;
    const hasBookingHeader = !!this.invoiceData?.BookingHeaderSid;

    // Priority 1: HouseJob (if HouseJobSid exists)
    if (hasHouseJob && this.invoiceData?.houseJob) {
      const value = (this.invoiceData.houseJob as any)[fieldName];
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }

    // Priority 2: MasterJob (if only MasterJobSid exists, no HouseJobSid)
    // Only POL and FPD are directly available on masterJob
    if (!hasHouseJob && hasMasterJob && this.invoiceData?.masterJob) {
      if (fieldName === 'POL' || fieldName === 'FPD') {
        const value = (this.invoiceData.masterJob as any)[fieldName];
        if (value !== null && value !== undefined && value !== '') {
          return value;
        }
      } else {
        if (this.invoiceData.masterJob.voyages) {
          const voyage = (this.invoiceData.masterJob.voyages?.[0] as any)[fieldName];
          if (voyage !== null && voyage !== undefined && voyage !== '') {
            return voyage;
          }
        }
      }
      // VesselName, VoyageNo, ETD, ETA are in MasterJobVoyage - fall through to bookingHeader
    }

    // Priority 3: BookingHeader (fallback)
    if (hasBookingHeader && this.invoiceData?.BookingHeader) {
      return (this.invoiceData.BookingHeader as any)[fieldName] || null;
    }

    return null;
  }

  calculateTotalColspan(): number {
    const config = this.getTaxDisplayConfig();
    let baseColumns = 7; // S.No, Particulars, Curr, No of Unit, Rate, ROE, Taxable Value

    // Add HSN/SAC column if not UAE
    if (this.currentCompanyCountryCode?.toLowerCase() !== 'ae') {
      baseColumns += 1;
    }

    // Add tax columns based on what's visible
    if (config.showCGST) baseColumns += 2; // CGST % + CGST Amt
    if (config.showSGST) baseColumns += 2; // SGST % + SGST Amt
    if (config.showIGST) baseColumns += 2; // IGST % + IGST Amt
    if (config.showVAT) baseColumns += 2; // VAT % + VAT Amt

    return baseColumns;
  }

  // Helper Section
  private getCustomerCountryCode(customer: any): string {
    return customer.countryMaster?.countryCode
  }

  getGSTType(){
    return this.invoiceForm.get('GSTType')?.getRawValue();
  }

  navigateToCreate() : void {
    this.router.navigate(['operation/invoice/entry']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


openUninvoicedChargesModal() {

  // HOUSE JOB INVOICE
  if (this.invoiceData?.HouseJobSid && this.invoiceData?.houseJob) {

    this.transactionSid = this.invoiceData.HouseJobSid;
    this.jobMenuMasterSid = this.invoiceData.houseJob.MenuMasterSid;

  }

  // MASTER JOB INVOICE
  else if (!this.invoiceData?.HouseJobSid && this.invoiceData?.MasterJobSid && this.invoiceData?.masterJob) {

    this.transactionSid = this.invoiceData.MasterJobSid;
    this.jobMenuMasterSid = this.invoiceData.masterJob.MenuMasterSid;

  }

  // BOOKING INVOICE (future safe)
  else if (this.invoiceData?.BookingHeaderSid && this.invoiceData?.BookingHeader) {

    this.transactionSid = this.invoiceData.BookingHeaderSid;
    this.jobMenuMasterSid = this.invoiceData.BookingHeader.MenuMasterSid;

  }

  else {
    this.appSettingService.showWarning('Cannot determine job type for uninvoiced charges');
    return;
  }
  // Get customer branch details
  const customerBranchSid = this.invoiceData?.CustomerBranchSid;
let customerMasterSid: number | null = null;

// 1️⃣ Directly from API response (most reliable)
if (this.invoiceData?.customerBranch?.CustomerMasterSid) {
  customerMasterSid = this.invoiceData.customerBranch.CustomerMasterSid;
}

// 2️⃣ Fallback only if API did not expand relation
else if (this.invoiceData?.CustomerBranchSid && this.customerBranchList?.length) {
  const branch = this.customerBranchList.find(
    b => b.CustomerBranchSid === this.invoiceData.CustomerBranchSid
  );
  customerMasterSid = branch?.CustomerMasterSid ?? null;
}

// Safety
if (!customerMasterSid) {
  this.appSettingService.showWarning('Customer not mapped to branch');
  return;
}

  const payload = {
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid,
    transactionSid: this.transactionSid,
    MenuMasterSid: this.jobMenuMasterSid,
    RevenueCustomerBranchSid: customerBranchSid,
    RevenueCustomerMasterSid: customerMasterSid
  };

  this.spinner.show();
  this.operationService.getUninvoicedRevenueCharges(payload).subscribe({
    next: (resp: any) => {
      this.spinner.hide();
      if (resp?.status && resp.data) {
        this.uninvoicedChargesList = resp.data || [];
        this.selectedUninvoicedCharges.clear();
        this.modalService.open(this.uninvoicedChargesModalRef, {
          size: 'xl',
          backdrop: 'static',
          keyboard: false,
          scrollable: true
        });
      } else {
        this.appSettingService.showWarning(resp.message || 'No uninvoiced charges found');
      }
    },
    error: (err) => {
      this.spinner.hide();
      console.error('Error fetching uninvoiced charges:', err);
      this.appSettingService.showError('Failed to fetch uninvoiced charges');
    }
  });
}

toggleChargeSelection(chargeSid: number) {
  if (this.selectedUninvoicedCharges.has(chargeSid)) {
    this.selectedUninvoicedCharges.delete(chargeSid);
  } else {
    this.selectedUninvoicedCharges.add(chargeSid);
  }
}

isChargeSelected(chargeSid: number): boolean {
  return this.selectedUninvoicedCharges.has(chargeSid);
}
selectAllUninvoicedCharges() {
  this.uninvoicedChargesList.forEach(charge => {
    this.selectedUninvoicedCharges.add(charge.CostRevenueChargesSid);
  });
}
deselectAllUninvoicedCharges() {
  this.selectedUninvoicedCharges.clear();
}

addSelectedUninvoicedCharges() {
  if (this.selectedUninvoicedCharges.size === 0) {
    this.appSettingService.showWarning('Please select at least one charge');
    return;
  }

  const selectedCharges = this.uninvoicedChargesList.filter(
    charge => this.selectedUninvoicedCharges.has(charge.CostRevenueChargesSid)
  );

  selectedCharges.forEach(charge => {
    this.patchUninvoicedChargeToDetails(charge);
  });

  this.modalService.dismissAll();
  this.recalculateAllRows();
  // this.appSettingService.showSuccess(`${selectedCharges.length} charge(s) added successfully`);
}

patchUninvoicedChargeToDetails(charge: any) {
 const selectedCharge = this.chargeList?.find(
    (c: any) => c.ChargeMasterSid === charge.ChargeMasterSid
  );

  if (!selectedCharge) {
    this.appSettingService.showError('Charge mapping is missing. Please configure charge master first.');
    return;
  }
  // Create detail group with charge data - using correct field names from API
  const detailGroup = this.createDetailGroup({
    ChargeMasterSid: charge.ChargeMasterSid,
    ChargeDescription: charge.ChargeDescription || charge.chargeMaster?.chargeName,
    HSSACMasterSid: charge.chargeMaster?.chargeTaxMaster?.[0]?.HSSACMasterSid || null, // Note: HSSACMasterSid not in response
    ChargeUOMSid: charge.RevenueChargeUomSid || charge.ChargeUomSid || charge.chargeMaster?.UOM,
    NumberOfUnit: charge.RevenueNumberOfUnit || 1,
    DrCr: charge.RevenueDrCr || 'C',
    CurrencyMasterSid: charge.RevenueCurrencyMasterSid,
    CurrencyCode: charge.revenueCurrencyMaster?.currencyCode,
    ExchangeRate: charge.RevenueExchangeRate || 1,
    Rate: charge.RevenueRate || 0,
    Amount: charge.RevenueAmount || 0,
    TaxableAmount: charge.RevenueLocalAmount || 0, // Taxable amount is LocalAmount before tax
    TaxPercentage1: charge.chargeMaster?.chargeTaxMaster?.[0]?.TaxRate || 0,
    TaxAmount1: 0, // Will be calculated by recalcRow
    TaxPercentage2: 0,
    TaxAmount2: 0,
    LocalAmount: charge.RevenueLocalAmount || 0,
    PartyAmount: charge.RevenueLocalAmount || 0, 
    MasterJobSid: this.invoiceData?.MasterJobSid || null,
    HouseJobSid: this.invoiceData?.HouseJobSid || null,
    DepartmentMasterSid: this.invoiceData?.DepartmentMasterSid || charge.DepartmentMasterSid,
    LedgerMasterSid: null,
    COAMasterSid: null,
    IsAutoGenerated: false,
    CostRevenue: 'Revenue',
    CostRevenueChargesSid: charge.CostRevenueChargesSid
  });

   // Add to form array first
  this.details.push(detailGroup);
  const index = this.details.length - 1;

  // Fetch ledger details using the same logic as cost-entry.component.ts
  this.operationService.getLedgerDetails({
    DepartmentMasterSid: this.invoiceData?.DepartmentMasterSid || charge.DepartmentMasterSid,
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    SubledgerMappingSid: charge.ChargeMasterSid,
    LedgerType: 'Charge',
    DrCr: 'Cr' // Revenue side is Credit
  }).subscribe({
    next: (ledgerResp: any) => {
      if (ledgerResp?.status) {
        const ledgerDetail = ledgerResp.data;
        
        // Patch the ledger and COA values
        this.details.at(index).patchValue({
          LedgerMasterSid: ledgerDetail.SubledgerMasterSid,
          COAMasterSid: ledgerDetail.COAMasterSid
        });
        
        // Now continue with other operations
        this.details.at(index).updateValueAndValidity();
        
        // Disable exchange rate if same as company currency
        const detailCurrencyId = detailGroup.get('CurrencyMasterSid')?.value;
        if (detailCurrencyId === this.currentCompany?.CurrencyMasterSid) {
          detailGroup.get('ExchangeRate')?.disable();
        }
        
        this.fetchHSN(index, true);
        
        if (this.invoiceData.MasterJobSid) {
          this.onDetailMasterJobSelected(
            { MasterJobSid: this.invoiceData.MasterJobSid },
            index
          );
        }
        
        // Trigger tax calculation
        this.recalcRow(index);
      } else {
        this.appSettingService.showError(ledgerResp.message || 'Failed to fetch ledger details');
      }
    },
    error: (error) => {
      console.error('Error fetching ledger details:', error);
      this.appSettingService.showError('Failed to fetch ledger details');
    }
  });
}

// Add helper to check if charge has voucher
hasVoucherGenerated(charge: any): boolean {
  return !!charge.RevenueVoucherHeaderSid;
}
selectOrDeselectAll(event: any) {
  if (event.target.checked) {
    this.selectAllUninvoicedCharges();
  } else {
    this.deselectAllUninvoicedCharges();
  }
}



}
