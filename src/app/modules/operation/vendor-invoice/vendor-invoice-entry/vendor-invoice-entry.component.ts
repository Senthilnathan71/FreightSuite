import { Component, OnInit, ViewChild, TemplateRef, input, HostListener, ChangeDetectorRef } from '@angular/core';
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
  ValidationErrors
} from '@angular/forms';
import { NgbModal, NgbDatepickerModule, NgbModalRef, NgbDropdownModule, NgbTooltipModule, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, firstValueFrom, forkJoin, map, Observable, of, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import { OperationService } from 'src/app/modules/operation/operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService, CurrencySettings } from 'src/app/core/services/company-settings-manager.service';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DocumentVendorInvoiceEntryComponent } from '../document-vendorinvoice/document-vendorinvoice.component';
import { ExtractedInvoice } from '../../ocr.service';
import { CommonService } from 'src/app/common/common.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { errorLogger, getDefaultTodayDate, toNgbDateStruct, toNumber } from 'src/app/common/helper';
import { VoucherPeriodValidationService, VoucherDateConstraints } from 'src/app/common/voucher-period-validation.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { ToastrService } from 'ngx-toastr';
import { consistentExchangeRatesValidator, getExchangeRateErrorMessage } from 'src/app/core/ValidationFn/exRateConsistency.validators';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { VendorInvoicePrintComponent } from '../report/vendor-invoice-print/vendor-invoice-print.component';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { offset } from '@popperjs/core';
import { TaxCalculationService } from '../../services/tax-calculation.service';
import { AuditLogComponent } from '../../audit-log/audit-log.component';

interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-vendor-invoice-entry',
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
    RouterModule,
    NgbDropdownModule,
    DecimalPrecisionDirective,
    PreventMultiClickDirective
  ],
  templateUrl: './vendor-invoice-entry.component.html',
  styleUrls: ['./vendor-invoice-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
    TaxCalculationService
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
  currentFinancialYear: any;
  currentCountry: number;
  currentBranchCityId: number;
  currentBranchCityName: string | null;

  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;

  vendorInvoiceForm!: FormGroup;
  temporaryForm !: FormGroup;
  headerId: number | null = null;
  private taxMastersReady: Promise<void> = Promise.resolve();
  vendorInvoiceData: any;
  currentMenuId : number;
  TandCList: any[] = [];
  isBankFetched: boolean = false;
  TandCFetched: boolean = false;
  bankDetails: any[] = [];
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
  filteredChargeList : any[] = [];
  hssacList: any[][] = []; // for job related
  hssacListForNonJob : any[][] = []; // for non job related
  temporaryHssacList : any[][] = []; // for pulling os
  subledgerList: any[] = [];
  uomList: any[] = [];
  departmentList: any[] = [];
  masterJobList: any[] = [];
  houseJobList: any[][] = [];
  taxGroupList : any[] = [];
  isTermsAndConditionsEnabled: boolean = true;
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

  invoiceTypesSales = [
    { id: 'REG',    name: 'Regular' },
    { id: 'NONGST', name: 'Zero Rated' },
    { id: 'EXE',    name: 'Exempt' },
    { id: 'BOS',    name: 'Bill of Supply' },
  ];
  invoiceTypesPurchase = [
    { id: 'REG',    name: 'Regular' },
    { id: 'NONGST', name: 'Zero Rated' },
    { id: 'EXE',    name: 'Exempt' },
    { id: 'BOS',    name: 'Bill of Supply' },
    { id: 'RCM',    name: 'RCM - Reverse Charge' },
    { id: 'REIMB',  name: 'Reimbursement (Pure Agent)' },
  ];
  vatInvoiceTypes = [
    { id: 'REG', name: 'Regular' },
    { id: 'NONGST', name: 'Zero Rated' },
    { id: 'EXE', name: 'Exempt' },
    { id: 'OOS', name: 'Out of Scope' },
  ];
  get activeInvoiceTypes() { return this.isVATMode ? this.vatInvoiceTypes : this.invoiceTypesPurchase; }
  
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

  hyperLinkInfo = {
    id: null,
    number: null,
    path: null,
    label: null
  };

  currentDate = new Date();
  isAutoPosting : boolean = false;
  vendorInvoicePrintData: any;

  // Voucher period constraints
  voucherConstraints: VoucherDateConstraints = {
    isClosed: false, errorMessage: null
  };

  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

  // TDS Configuration
  tdsConfig: any = null;

  // others
  coaList : any[] = [];
  subledgerListDetail : any[][] = [];
  
  // Country/Tax mode
  bookingModeCountry: string = 'india';

  // Unsaved changes related varaible declarations
  isDirty : boolean = false;
  isSaving: boolean = false;
  private initialFormValue : any = null;
  private destroy$ = new Subject<void>();
  private _originalHSSACValues: (number | null)[] = [];
  private _previousInvoiceType: string = 'REG';
  private _isInitialLoad = false;
  
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
    return this.taxCalculationService.isIndiaGST;
  }

  get isVATMode(): boolean {
    return this.taxCalculationService.isVATMode;
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
    private cdr: ChangeDetectorRef,
    private companySettings: CompanySettingsManagerService,
    private commonService: CommonService,
    private masterService: MasterService,
    public mps: MenuPermissionService,
    private currencyConfigService: CurrencyConfigurationService,
    private currencyFormatService: CurrencyFormatService,
    private datePipe : CustomDatePipe,
    private voucherPeriodService: VoucherPeriodValidationService,
    private toastr: ToastrService,
    private numberToWords: NumberToWordsService,
    public taxCalculationService: TaxCalculationService
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

      if (currentFinancialYear) {
        this.currentFinancialYear = Number(currentFinancialYear.YearMasterSid);
        this.fyMinDate = toNgbDateStruct(currentFinancialYear.StartDate);
        const fyEnd = new Date(currentFinancialYear.EndDate);
        const today = getDefaultTodayDate();
        this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
      }

      this.currentMenuId = this.mps.getMenuId();
      this.mps.init().subscribe();

      // Assigning value to global variables
      this.currentCompanyCountryId = Number(this.currentCompany?.CountryMasterSid) || this.currentCompanyCountry.CountryMasterSid;
      this.currentCompanyCountryCode = String(this.currentCompanyCountry.countryCode).trim().toLowerCase();
      if(this.currentBranchState){
        this.currentBranchStateName = this.currentBranchState.stateName || this.currentBranch?.stateMaster?.stateName;
      }
      if(this.currentBranchCity){
        this.currentBranchCityId = this.currentBranchCity.CityMasterSid || this.currentBranch?.cityMaster?.CityMasterSid;
      }

    // Preload tax masters for synchronous row-level calculation
    this.taxMastersReady = this.taxCalculationService.init({
      documentSide: 'PURCHASE',
      companyCountryCode: this.currentCompanyCountryCode,
      companyCountryMasterSid: this.currentCompanyCountryId,
      branchStateName: this.currentBranchStateName,
      branchStateMasterSid: this.currentBranchState?.StateMasterSid,
    }).then(() => this.taxCalculationService.fetchTaxMasters('PURCHASE'));

    } catch (e) {
      this.currentCompany = null;
      this.currentBranch = null;
    }
    const paramValue = this.route.snapshot.queryParamMap.get('isNonJob');
    this.isNonJob = paramValue === 'true'; 

    this.loadTermsAndConditionsConfig();
    this.checkVoucherPostingMechanism();
    this.initForm();
    this.loadVoucherPeriods();
    this.spinner.show();

    this.route.data.subscribe((data) => {
      this.isViewMode = data['viewMode'] === true;
    });

    // Resolve headerId synchronously so loadLookups subscription can act on it
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.headerId = Number(id);
    }

    // All lookups (including COA for NonJob) are guaranteed to be ready
    // before loadVendorInvoiceById is called
    this.loadLookups().subscribe({
      next: async () => {
        await this.taxMastersReady;
        if (this.headerId) {
          this.loadVendorInvoiceById(this.headerId);
        } else {
          this.initialFormValue = this.vendorInvoiceForm.getRawValue();
          this.subscribeToFormChanges();
          this.subscribeToValueChanges();
          this.spinner.hide();
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Lookup error:', err);
      }
    });
  }

  initForm() {
    const companyCurrencyId = this.currentCompany.CurrencyMasterSid || this.currentCompanyCurrency.currencyMasterSid;
    const companyCurrencyCode = this.currentCompanyCurrency.code;

    const currentFinancialYear = this.appSettingService.getCurrentFinancialYear();
    const today = getDefaultTodayDate();
    let defaultDate: Date | string = today;
    if (currentFinancialYear) {
      const fyStart = new Date(currentFinancialYear.StartDate);
      const fyEnd = new Date(currentFinancialYear.EndDate);
      if (today < fyStart || today > fyEnd) {
        defaultDate = currentFinancialYear.EndDate;
      }
    }

    this.vendorInvoiceForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }],
      VoucherDate: [defaultDate, Validators.required],
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


  private getHSSACListForRow(i: number): any[] {
    return this.isNonJob ? (this.hssacListForNonJob || []) : (this.hssacList[i] || []);
  }

  private handleZeroRatedSwitch(invoiceType: string): boolean {
    if (this._isInitialLoad) return true;
    if (invoiceType === 'NONGST') {
      const failedCharges: string[] = [];
      for (let i = 0; i < this.details.length; i++) {
        const row = this.details.at(i) as FormGroup;
        const zeroRated = this.taxCalculationService.findZeroRatedHSSAC(this.getHSSACListForRow(i));
        if (!zeroRated) {
          const chargeSid = row.get('ChargeMasterSid')?.value;
          const name = this.chargeList.find((c: any) => c.ChargeMasterSid === chargeSid)?.chargeName || `Row ${i + 1}`;
          failedCharges.push(name);
        }
      }
      if (failedCharges.length > 0) {
        this.appSettingService.showError(
          `The following charges are not mapped to a Zero Rated HSSAC:<br>${failedCharges.map(n => `&bull; ${n}`).join('<br>')}<br><br>Please update the Charge Master or select a different charge.`,
          'Zero Rated — HSSAC Missing',
          { closeButton: true, enableHtml: true }
        );
        return false;
      }
      for (let i = 0; i < this.details.length; i++) {
        const row = this.details.at(i) as FormGroup;
        const zeroRated = this.taxCalculationService.findZeroRatedHSSAC(this.getHSSACListForRow(i))!;
        this._originalHSSACValues[i] = row.get('HSSACMasterSid')?.value;
        row.get('HSSACMasterSid')?.setValue(zeroRated.HSSACMasterSid, { emitEvent: false });
        row.get('HSSACMasterSid')?.disable({ emitEvent: false });
      }
      return true;
    } else {
      if (this._originalHSSACValues.length > 0) {
        for (let i = 0; i < this.details.length; i++) {
          const row = this.details.at(i) as FormGroup;
          row.get('HSSACMasterSid')?.enable({ emitEvent: false });
          row.get('HSSACMasterSid')?.setValue(this._originalHSSACValues[i] ?? null, { emitEvent: false });
        }
        this._originalHSSACValues = [];
      }
      return true;
    }
  }

  subscribeToValueChanges() {
    this.vendorInvoiceForm.get('InvoiceType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((invoiceType) => {
        if (!this.vendorInvoiceForm.get('PlaceOfSupply')?.value) return;
        const ok = this.handleZeroRatedSwitch(invoiceType);
        if (!ok) {
          this.vendorInvoiceForm.get('InvoiceType')?.setValue(this._previousInvoiceType, { emitEvent: false });
          return;
        }
        this._previousInvoiceType = invoiceType;
        const classification = this.taxCalculationService.updateInvoiceType(invoiceType as any);
        this.vendorInvoiceForm.get('GSTType')?.setValue(classification.formGSTType, { emitEvent: false });
        if (this.isPosted) return;
        this.recalculateAllRows();
      });

    this.vendorInvoiceForm.get('GSTType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((gstType) => {
        if (this.isPosted) return;
        if (gstType === 'EXPWP' || gstType === 'EXPWOP') {
          this.taxCalculationService.updateSelectedGstType(gstType);
        }
        this.recalculateAllRows();
      });

    ['CurrencyCode', 'ExchangeRate'].forEach((field) => {
      this.vendorInvoiceForm.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.isPosted) return;
          this.recalculateAllRows();
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

    // Warn if selected currency differs from the vendor's default currency
    const partyMasterSid = this.vendorInvoiceForm.get('PartyMasterSid')?.getRawValue();
    if (partyMasterSid && currencyMasterSid) {
      const vendor = this.vendorList.find(v => v.SubledgerMasterSid === partyMasterSid);
      const vendorCurrencySid = vendor?.currencyMaster?.CurrencyMasterSid;
      if (vendorCurrencySid && currencyMasterSid !== vendorCurrencySid) {
        this.toastr.warning('Selected currency differs from the vendor\'s default currency.', 'Currency Mismatch', { timeOut: 2000 });
      }
    }
  }

  // Load lookups — critical (party, charges, COA) fetch first.
  // Once done, non-critical lookups start in the background and vendor invoice loads.
  loadLookups(): Observable<void> {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const filterOption = { CompanyMasterSid, BranchMasterSid };

    // 1. Critical lookups — party, charges and COA must be ready before vendor invoice is loaded
    const criticalSource: any = {
      vendors: this.operationService.getAllCreditorWithCOAMapped(filterOption).pipe(catchError(() => of({ data: [] }))),
      charges: this.isNonJob
        ? of({ data: [] })
        : this.operationService.getAllMappedChargeDebtors(filterOption).pipe(catchError(() => of({ data: [] })))
    };
    if (this.isNonJob) {
      criticalSource.coa = this.operationService.getAllCoaWithLedgerCategory({
        LedgerCategory: 'Ledger',
        CompanyMasterSid: CompanyMasterSid,
        filterNonJob: true
      }).pipe(catchError(() => of({ data: [] })));
    }

    return forkJoin(criticalSource).pipe(
      map(({ vendors, charges, coa }: any) => {
        this.vendorList = vendors.data || [];
        this.subledgerList = vendors.data || [];
        this.chargeList = charges?.data || [];
        this.filteredChargeList = [...this.chargeList];
        this.coaList = coa?.data || [];

        // 2. Non-critical lookups start after critical resources are ready
        const otherSource: any = {
          currencies: this.operationService.getAllCurrencies().pipe(catchError(() => of({ data: [] }))),
          uom: this.operationService.getAllUom().pipe(catchError(() => of({ data: [] }))),
          departments: this.operationService.getAllDepartments(CompanyMasterSid).pipe(catchError(() => of({ data: [] }))),
          masterJobs: this.operationService.getAllMasterJobs({ ...filterOption, limit: 200, offset: 0 }).pipe(catchError(() => of({ data: [] })))
        };
        if (this.isNonJob) {
          otherSource.hssac = this.operationService.getAllHssac().pipe(catchError(() => of([])));
        }
        forkJoin(otherSource).subscribe({
          next: ({ currencies, uom, departments, masterJobs, hssac }: any) => {
            this.currencyList = currencies.data || [];
            this.currencyConfigService.initializeConfigurations(this.currencyList);
            this.numberToWords.initializeCurrencies(this.currencyList);
            this.uomList = uom.data || [];
            this.departmentList = departments.data || [];
            this.masterJobList = masterJobs.data || [];
            this.hssacListForNonJob = hssac || [];
          },
          error: (err) => console.error('Lookup error:', err)
        });
      })
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
    const localCurrencyId = this.currentCompany?.CurrencyMasterSid;
    const localCurrencyCode = this.currentCompanyCurrency.code;
    

    if (!selected || !vendorMasterSid) {
      this.vendorBranchList = [];
      this.vendorInvoiceForm.get('CustomerBranchSid')?.setValue(null);
      this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
      this.vendorInvoiceForm.get('PartyMasterSid')?.setValue(null);
      this.vendorInvoiceForm.get('COAMasterSid')?.setValue(null);
      this.vendorInvoiceForm.get('GST_VAT')?.setValue('');
      this.vendorInvoiceForm.get('PartyName')?.setValue(null);
      this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');
      this.vendorInvoiceForm.get('CurrencyMasterSid')?.setValue(localCurrencyId);
      this.vendorInvoiceForm.get('CurrencyCode')?.setValue(localCurrencyCode);
      this.onHeaderCurrencyChange({
        CurrencyMasterSid: localCurrencyId,
        currencyCode: localCurrencyCode
      })

      this.vendorInvoiceForm.get('InvoiceType')?.setValue('REG');
      this.vendorInvoiceForm.get('GSTType')?.setValue('');
      return;
    }

    const vendor = this.vendorList.find(
      (v) => v.CustomerMasterSid === vendorMasterSid
    );
    const customerCurrency = vendor.currencyMaster || {};
    const countryCode = this.getCustomerCountryCode(vendor);

    if (vendor) {
      this.vendorInvoiceForm.patchValue({
        PartyName : vendor.CustomerName || null,
        PartyMasterSid : vendor.SubledgerMasterSid,
        COAMasterSid : vendor.COAMappedId,
        InvoiceType : 'REG',
        CurrencyMasterSid : customerCurrency?.CurrencyMasterSid ?? localCurrencyId,
        CurrencyCode : customerCurrency?.currencyCode ?? localCurrencyCode,
      })
      this.onHeaderCurrencyChange(customerCurrency);
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
    // Overseas party → Place of Supply is the seller's (company's) state
    const vendorCountry = this.getVendorCountry()?.toLowerCase();
    const isOverseas = vendorCountry && vendorCountry !== this.currentCompanyCountryCode;
    const placeOfSupply = isOverseas
      ? (this.currentBranchStateName || '')
      : (foundBranch?.stateMaster?.stateName || '');

    if (foundBranch) {
      this.vendorInvoiceForm.patchValue({
        PartyAddress : foundBranch.Address,
        PlaceOfSupply : placeOfSupply
      })
      if (this.currentCompanyCountryCode === 'in') {
        this.vendorInvoiceForm.get('GST_VAT')?.setValue(foundBranch?.GSTNo || '');
      } else {
        this.vendorInvoiceForm.get('GST_VAT')?.setValue(foundBranch?.customerMaster?.PanType || '');
      }
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

    const vendorBranchSid = this.vendorInvoiceForm.get('CustomerBranchSid')?.value;
    const foundBranch = this.vendorBranchList.find(
      (branch) => Number(branch.CustomerBranchSid) === Number(vendorBranchSid)
    );
    const vendorGSTNo = this.vendorInvoiceForm.get('GST_VAT')?.value;
    const invoiceType = this.vendorInvoiceForm.get('InvoiceType')?.value;
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

    this.vendorInvoiceForm.get('GSTType')?.setValue(classification.formGSTType);
    if (this.currentCompanyCountryCode !== 'in') {
      this.vendorInvoiceForm.get('GSTType')?.setValue('VAT');
      this.vendorInvoiceForm.get('TaxType')?.setValue('VAT');
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
          this._isInitialLoad = true;
          this.patchValues(this.vendorInvoiceData);
          this.vendorInvoiceForm.get('PartyName')?.disable();
          this.vendorInvoiceForm.get('CustomerBranchSid')?.disable();
          this.vendorInvoiceForm.get('CurrencyMasterSid')?.disable();
          this.vendorInvoiceForm.get('CurrencyCode')?.disable();
          if (this.isReadOnly) {
            this.details.disable({ emitEvent: false });
            this.isDirty = false;
            this.initialFormValue = this.vendorInvoiceForm.getRawValue();
            this.vendorInvoiceForm.disable();
            this.destroy$.next();
            this.destroy$.complete();
            return;
          }
          setTimeout(() => {
            this._isInitialLoad = false;
            this.initialFormValue = this.vendorInvoiceForm.getRawValue();
            this.isDirty = false;
            this.subscribeToFormChanges();
            this.subscribeToValueChanges();
          }, 0);
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
    this.gatherHyperLinkInfo(data);

    if(data.departmentMaster){
      this.filterChargeBasedOnDept(data.departmentMaster);
    }

    if (data.CustomerMasterSid) {
      this.getVendorBranchByVendor(Number(data.CustomerMasterSid));
    } else {
      this.vendorBranchList = [];
    }

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

    // In edit mode, restrict the date picker to the original document's month
    const _vinOrigDate = new Date(data.VoucherDate);
    if (!isNaN(_vinOrigDate.getTime())) {
      const _y = _vinOrigDate.getFullYear(), _m = _vinOrigDate.getMonth() + 1;
      const _monthEnd = new Date(_y, _m, 0);
      const _today = new Date(); _today.setHours(0, 0, 0, 0);
      const _effectiveEnd = _monthEnd < _today ? _monthEnd : _today;
      this.fyMinDate = { year: _y, month: _m, day: 1 };
      this.fyMaxDate = { year: _effectiveEnd.getFullYear(), month: _effectiveEnd.getMonth() + 1, day: _effectiveEnd.getDate() };
    }

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
          CostRevenueChargesSid: det.CostRevenueChargesSid,
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
        selectedGstType: (data.GSTType === 'EXPWP' || data.GSTType === 'EXPWOP') ? data.GSTType : undefined,
      },
      data.InvoiceType as any
    );

    this.spinner.hide();
  }

  filterChargeBasedOnDept(dept : any) {
    if(!dept || !dept.departmentName) return;

    this.filteredChargeList = this.chargeList.filter(charge =>{
      const allowedDepts : any[] = (charge.Departments || []);
      return allowedDepts.includes(dept.departmentName);
    })
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
    this._originalHSSACValues.push(null);
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


    const allowedControls = ['Rate', 'ExchangeRate', 'HSSACMasterSid','ChargeDescription','NumberOfUnit'];

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
    if (this._originalHSSACValues.length > index) this._originalHSSACValues.splice(index, 1);
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
    const hssacListItems = this.isNonJob ? (this.hssacListForNonJob || []) : (this.hssacList[index] || []);
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
    this.vendorInvoiceForm.updateValueAndValidity();
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
      const drCr = this.details.at(i).get('DrCr')?.value;
      if(drCr === 'C') {
        total += taxAmt1 + taxAmt2;
      } else {
        total -= taxAmt1 + taxAmt2;
      }
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
            const sanitizedHssacList = (res.data || []).filter(
              (item: any) => item && item.HSSACMasterSid
            );
            this.hssacList[index] = sanitizedHssacList;
            if (!patch && this.vendorInvoiceForm.get('InvoiceType')?.value === 'NONGST') {
              const zeroRated = this.taxCalculationService.findZeroRatedHSSAC(this.getHSSACListForRow(index));
              if (zeroRated) {
                this._originalHSSACValues[index] = this.details.at(index).get('HSSACMasterSid')?.value;
                this.details.at(index).get('HSSACMasterSid')?.disable({ emitEvent: false });
              }
            }
            if (patch) {
              this.details.at(index).patchValue({
                HSSACMasterSid: sanitizedHssacList[0]?.HSSACMasterSid || null,
              });
            }
            this.recalcRow(index);
            // If NONGST mode, override with zero-rated HSSAC
            if (patch && this.vendorInvoiceForm.get('InvoiceType')?.value === 'NONGST') {
              const hssacSource = this.getHSSACListForRow(index);
              const zeroRated = this.taxCalculationService.findZeroRatedHSSAC(hssacSource);
              if (zeroRated) {
                this._originalHSSACValues[index] = this.details.at(index).get('HSSACMasterSid')?.value;
                this.details.at(index).get('HSSACMasterSid')?.setValue(zeroRated.HSSACMasterSid, { emitEvent: false });
                this.details.at(index).get('HSSACMasterSid')?.disable({ emitEvent: false });
              } else {
                this.details.at(index).patchValue(
                  { ChargeMasterSid: null, ChargeDescription: '', HSSACMasterSid: null, ChargeUOMSid: null, LedgerMasterSid: null, COAMasterSid: null },
                  { emitEvent: false }
                );
                this.hssacList[index] = [];
                this.appSettingService.showError(
                  `<b>${chargeName}</b> is not mapped to a Zero Rated HSSAC.<br><br>Please update the Charge Master or select a different charge.`,
                  'Zero Rated — HSSAC Missing',
                  { closeButton: true, enableHtml: true }
                );
              }
            }
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
    // Validate voucher date is within financial year
    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy) {
      const voucherDate = new Date(this.vendorInvoiceForm.getRawValue().VoucherDate);
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

    // Zero Rated guard: every row must have a zero-rated HSSAC applied
    if (this.vendorInvoiceForm.get('InvoiceType')?.value === 'NONGST') {
      const failedRows: string[] = [];
      for (let i = 0; i < this.details.length; i++) {
        const hssacSid = this.details.at(i).getRawValue().HSSACMasterSid;
        const hssacSource = this.isNonJob ? (this.hssacListForNonJob || []) : (this.hssacList[i] || []);
        const hssac = hssacSource.find((h: any) => h.HSSACMasterSid === hssacSid);
        if (!hssac || parseFloat(hssac.TaxRate) !== 0) {
          failedRows.push(`Row ${i + 1}`);
        }
      }
      if (failedRows.length > 0) {
        this.appSettingService.showError(
          `The following rows do not have a Zero Rated HSSAC applied:<br>${failedRows.map(r => `&bull; ${r}`).join('<br>')}<br><br>Please select a charge with a Zero Rated HSSAC.`,
          'Zero Rated — Validation Failed',
          { closeButton: true, enableHtml: true }
        );
        if (resolve) resolve(false);
        return;
      }
    }

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
      const interOrIntra = this.taxCalculationService.context?.taxCategory || 'Intra';

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
          EffectiveFrom: this.vendorInvoiceForm.get('VoucherDate')?.getRawValue() ?? new Date().toISOString(),
          TaxType: 'Input',
          IsUnionTerritory: this.taxCalculationService.context?.appliedTaxMode === 'CGST_UGST',
          CustomerGstType: this.taxCalculationService.context?.party?.customerGstType || '',
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

  get isReadOnly(): boolean {
    if(!this.isEditMode) return false;
    return this.vendorInvoiceData?.PostStatus !== 'U' || this.vendorInvoiceData?.Status !== 'A';
  }

  // Check if voucher is draft
  get isDraft(): boolean {
    return !this.vendorInvoiceData?.PostStatus || this.vendorInvoiceData?.PostStatus === 'U';
  }

  onReset() {
    if (this.isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to reset?');
      if (!confirmed) return;
    }
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
      current_date : getDefaultTodayDate(),
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

  get isTodayOutOfVoucherDateRange(): boolean {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ngbToMs = (s: { year: number; month: number; day: number }) =>
      new Date(s.year, s.month - 1, s.day).getTime();
    const todayMs = today.getTime();
    if (this.fyMinDate && todayMs < ngbToMs(this.fyMinDate)) return true;
    if (this.fyMaxDate && todayMs > ngbToMs(this.fyMaxDate)) return true;
    return false;
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
        ExchangeRate: this.getFormattedAndPaddedExchangeRate(1, fromCurrencyId),
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
              ExchangeRate: this.getFormattedAndPaddedExchangeRate(exchangeRate, fromCurrencyId)
            });
            const key = this.buildExchangeRateMapKey(fromCurrencyCode, toCurrencyCode, voucherDate);
            this.exchangeRateMap.set(key, resp.data);
          } else {
            this.appSettingService.showError(resp.message);
            this.vendorInvoiceForm.patchValue({
              CurrencyMasterSid : fromCurrencyId,
              CurrencyCode: fromCurrencyCode,
              ExchangeRate: this.getFormattedAndPaddedExchangeRate(0, fromCurrencyId)
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
            ExchangeRate: this.getFormattedAndPaddedExchangeRate(0, fromCurrencyId),
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

    // Non-job: default detail row currency from the COA's LedgerCurrency and fetch exchange rate
    if (this.isNonJob && resetSubledger) {
      const fullCoa = this.coaList.find(c => c.COAMasterSid === (coa.COAMasterSid ?? coa));
      const ledgerCurrencyId = fullCoa?.LedgerCurrency;
      if (ledgerCurrencyId) {
        const currency = this.currencyList.find(c => c.CurrencyMasterSid === ledgerCurrencyId);
        const companyCurrencyCode = this.currentCompanyCurrency?.code;
        ctrl.patchValue({
          CurrencyMasterSid: ledgerCurrencyId,
          CurrencyCode: currency?.currencyCode ?? null,
        });
        if (currency?.currencyCode) {
          this.patchExchangeRateForDetail(currency.currencyCode, companyCurrencyCode, detailIndex);
        }
      }
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

  onDetailSubledgerChange(subledger: any, detailIndex: number) {
    if (!subledger || !this.isNonJob) return;
    const ctrl = this.details.at(detailIndex) as FormGroup;
    const currencyId = subledger.CurrencyMasterSid || subledger.currencyMaster?.CurrencyMasterSid;
    if (currencyId) {
      const currency = this.currencyList.find(c => c.CurrencyMasterSid === currencyId);
      if (currency) {
        const companyCurrencyCode = this.currentCompanyCurrency?.code;
        ctrl.patchValue({
          CurrencyMasterSid: currencyId,
          CurrencyCode: currency.currencyCode,
        });
        this.patchExchangeRateForDetail(currency.currencyCode, companyCurrencyCode, detailIndex);
      }
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
  // Handle processed vendor invoice data from OCR extraction modal
  onVendorInvoiceProcessed(extractedData: ExtractedInvoice): void {
    if (!extractedData) return;

    // Parse invoice date (format: DD/MM/YYYY from LLM)
    let billDate: Date | null = null;
    if (extractedData.invoice_date) {
      const parts = extractedData.invoice_date.split('/');
      if (parts.length === 3) {
        billDate = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      } else {
        billDate = new Date(extractedData.invoice_date);
      }
      if (isNaN(billDate.getTime())) billDate = null;
    }

    // The seller is the vendor (party issuing the invoice)
    this.vendorInvoiceForm.patchValue({
      BillNo: extractedData.invoice_number || '',
      BillDate: billDate,
      BillAmt: extractedData.grand_total || 0,
      PlaceOfSupply: extractedData.place_of_supply || '',
      Narration: extractedData.amount_in_words || '',
    });

    // Try to match seller name to existing vendor list
    const sellerName = extractedData.seller?.name?.trim();
    if (sellerName) {
      const matchedVendor = this.vendorList.find(v =>
        v.CustomerName?.toLowerCase().includes(sellerName.toLowerCase()) ||
        sellerName.toLowerCase().includes(v.CustomerName?.toLowerCase())
      );
      if (matchedVendor) {
        this.onVendorChange(matchedVendor);
      }
    }

    // Populate line items as detail rows
    this.details.clear();
    if (extractedData.line_items && extractedData.line_items.length > 0) {
      extractedData.line_items.forEach((item, index) => {
        // Try to find matching charge by description
        const matchedCharge = item.description
          ? this.chargeList.find(c =>
              c.chargeName?.toLowerCase().includes(item.description!.toLowerCase()) ||
              item.description!.toLowerCase().includes(c.chargeName?.toLowerCase())
            )
          : null;

        const detailGroup = this.createDetailGroup({
          Sno: item.sno || index + 1,
          ChargeMasterSid: matchedCharge?.ChargeMasterSid || null,
          ChargeDescription: item.description || '',
          NumberOfUnit: item.qty || 1,
          Rate: item.rate || 0,
          Amount: item.taxable_value || 0,
          TaxPercentage1: item.vat_percent || 0,
          TaxAmount1: item.vat_amount || 0,
          DrCr: 'D',
        });

        this.details.push(detailGroup);

        // If charge matched, trigger HSN fetch and recalc
        if (matchedCharge) {
          this.onDetailChange(index, 'ChargeMasterSid');
        }
      });
    }

    this.recalculateAllRows();
    this.appSettingService.showSuccess('Invoice data extracted and populated successfully.');
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
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    const payload = { 
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.vendorInvoiceData?.VoucherHeaderSid
    };

    const openModal = (terms: any[]) => {
      const modelRef = this.modalService.open(TermsAndConditionsComponent, {
              size: 'lg',
              backdrop: 'static',
              centered: true,
            });
            modelRef.componentInstance.terms = terms || [];
          modelRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modelRef.componentInstance.DocumentSid = this.vendorInvoiceData?.VoucherHeaderSid;
          modelRef.componentInstance.loadAllOnGet = !this.isTermsAndConditionsEnabled;
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
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
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
        vatRate: 0
      };
    } else if (mode === 'CGST_UGST') {
      return {
        cgstRate: detail.TaxPercentage1 || 0,
        sgstRate: 0,
        ugstRate: detail.TaxPercentage2 || 0,
        igstRate: 0,
        vatRate: 0
      };
    } else if (mode === 'IGST') {
      return {
        cgstRate: 0,
        sgstRate: 0,
        ugstRate: 0,
        igstRate: detail.TaxPercentage1 || 0,
        vatRate: 0
      };
    } else if (mode === 'VAT') {
      return {
        cgstRate: 0,
        sgstRate: 0,
        ugstRate: 0,
        igstRate: 0,
        vatRate: detail.TaxPercentage1 || 0
      };
    }

    return {
      cgstRate: detail.TaxPercentage1 || 0,
      sgstRate: detail.TaxPercentage2 || 0,
      ugstRate: 0,
      igstRate: 0,
      vatRate: detail.TaxPercentage1 || 0
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
        vatAmt: 0
      };
    } else if (mode === 'CGST_UGST') {
      return {
        cgstAmt: detail.TaxAmount1 || 0,
        sgstAmt: 0,
        ugstAmt: detail.TaxAmount2 || 0,
        igstAmt: 0,
        vatAmt: 0
      };
    } else if (mode === 'IGST') {
      return {
        cgstAmt: 0,
        sgstAmt: 0,
        ugstAmt: 0,
        igstAmt: detail.TaxAmount1 || 0,
        vatAmt: 0
      };
    } else if (mode === 'VAT') {
      return {
        cgstAmt: 0,
        sgstAmt: 0,
        ugstAmt: 0,
        igstAmt: 0,
        vatAmt: detail.TaxAmount1 || 0
      };
    }

    return {
      cgstAmt: detail.TaxAmount1 || 0,
      sgstAmt: detail.TaxAmount2 || 0,
      ugstAmt: 0,
      igstAmt: 0,
      vatAmt: detail.TaxAmount1 || 0
    };
  }

 
  getShipmentFieldValue(
    fieldName: 'VesselName' | 'VoyageNo' | 'POL' | 'FPD' | 'ETD' | 'ETA'
  ): any {
    const data = this.vendorInvoiceData || {};
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

  async getAndStoreVendorBankDetails(): Promise<void> {
    try {
      const partyCurrencyId =
        this.vendorInvoiceData?.CurrencyMasterSid ||
        this.vendorInvoiceForm.get('CurrencyMasterSid')?.getRawValue();
      const payload = {
        CurrencyMasterSid: partyCurrencyId,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
      };

      const resp: any = await firstValueFrom(this.operationService.getBankDetails(payload));
      this.isBankFetched = true;
      this.bankDetails = resp?.status && resp.data ? resp.data : [];
    } catch (err) {
      console.error('Error fetching vendor bank details', err);
      this.bankDetails = [];
    }
  }

  async getAndStoreVendorTandC(): Promise<void> {
    try {
      this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
      const payload = {
        MenuMasterSid: this.currentMenuId,
        DocumentSid: this.vendorInvoiceData?.VoucherHeaderSid
      };
      const resp: any = await firstValueFrom(this.masterService.getTandCByCondition(payload));
      this.TandCFetched = true;
      this.TandCList = resp?.status && Array.isArray(resp?.data) ? resp.data : [];
    } catch (err) {
      console.error('Error fetching vendor terms and conditions', err);
      this.TandCList = [];
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

  gatherHyperLinkInfo(data: any) {
    const airDept = String(data?.departmentMaster?.departmentType)?.toUpperCase() === 'AIR';
    const isHouseJobInvoice = data?.HouseJobSid && data?.MasterJobSid;
    const isMasterJobInvoice = data?.MasterJobSid && !data?.HouseJobSid;
    const isBookingInvoice = !!data?.BookingHeaderSid;
    const isAgentHouseJob = String(data?.houseJob?.JobType || '') === 'Agent';
    const invoiceServiceFlag = String(data?.IsServiceJob ?? '').trim().toUpperCase();
    const houseServiceFlag = String(data?.houseJob?.IsServiceJob ?? '').trim().toUpperCase();
    const isServiceJobInvoice = invoiceServiceFlag
      ? invoiceServiceFlag === 'Y'
      : houseServiceFlag === 'Y';

    if (isHouseJobInvoice) {
      this.hyperLinkInfo = {
        id: data?.HouseJobSid,
        number: isAgentHouseJob
          ? (data?.masterJob?.MasterJobNumber || data?.MasterNumber || '')
          : data?.houseJob?.HBLNo,
        path: isAgentHouseJob
          ? `/operation/agent-master-air-waybill/entry/${data.HouseJobSid}`
          : (isServiceJobInvoice
            ? `/operation/service-job/entry/${data.HouseJobSid}`
            : `/operation/house-job/entry/${data.HouseJobSid}`),
        label: isAgentHouseJob ? 'AMWBL No.' : (airDept ? 'HAWBL No.' : 'HBL No.')
      };
    } else if (isMasterJobInvoice) {
      this.hyperLinkInfo = {
        id: data?.MasterJobSid,
        number: data?.masterJob?.MasterJobNumber,
        path: `/operation/${airDept ? 'mawbill' : 'master-job'}/entry/${data.MasterJobSid}`,
        label: airDept ? 'MAWB No.' : 'MBL No.'
      };
    } else if (isBookingInvoice) {
      this.hyperLinkInfo = {
        id: data?.BookingHeaderSid,
        number: data?.BookingHeader?.BookingNo,
        path: `/operation/booking/entry/${data.BookingHeaderSid}`,
        label: 'Booking No.'
      };
    } else {
      this.hyperLinkInfo = {
        id: null,
        number: null,
        path: null,
        label: null
      };
    }
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
      this.temporaryForm.get('InvoiceType')?.setValue('REG');
      this.temporaryForm.get('GSTType')?.setValue('');
      return;
    } 

    const countryCode = this.getCustomerCountryCode(vendor);

    // Set vendor information in main form
    this.temporaryForm.patchValue({
      PartyName: vendor.CustomerName || null,
      PartyMasterSid: vendor.SubledgerMasterSid,
      COAMasterSid: vendor.COAMappedId,
      InvoiceType: 'REG',
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
    // Overseas party → Place of Supply is the seller's (company's) state
    const vendorCountryTemp = this.getVendorCountry()?.toLowerCase();
    const isOverseasTemp = vendorCountryTemp && vendorCountryTemp !== this.currentCompanyCountryCode;
    const placeOfSupply = isOverseasTemp
      ? (this.currentBranchStateName || '')
      : (foundBranch?.stateMaster?.stateName || '');

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

    const vendorBranchSid = this.temporaryForm.get('CustomerBranchSid')?.value;
    const foundBranch = this.vendorBranchList.find(
      (branch) => Number(branch.CustomerBranchSid) === Number(vendorBranchSid)
    );
    const vendorGSTNo = this.temporaryForm.get('GST_VAT')?.value;
    const invoiceType = this.temporaryForm.get('InvoiceType')?.value;
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

    this.temporaryForm.get('GSTType')?.setValue(classification.formGSTType);
    if (this.currentCompanyCountryCode !== 'in') {
      this.temporaryForm.get('GSTType')?.setValue('VAT');
      this.temporaryForm.get('TaxType')?.setValue('VAT');
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
  
  openAuditLogs() {
      if (!this.vendorInvoiceData?.VoucherHeaderSid) return;
      const modalRef = this.modalService.open(AuditLogComponent, {
        centered: true,
        scrollable: true,
        size: 'xl',
        windowClass: 'audit-log-modal'
      });
      modalRef.componentInstance.title = 'Vendor Invoice Logs';
      modalRef.componentInstance.tableName = 'VoucherHeader';
      modalRef.componentInstance.recordId = this.vendorInvoiceData?.VoucherHeaderSid.toString();
      modalRef.componentInstance.screenName = 'VendorInvoice';
    }
    
        getAuditLog() {
      this.operationService.getAuditLogsCreditNote(
        'VoucherHeader',
        this.vendorInvoiceData?.VoucherHeaderSid.toString()
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


    async prepareVendorPrintData() {
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

      const isBookingInvoice = this.vendorInvoiceData?.BookingHeaderSid;
      const isHouseJobInvoice = this.vendorInvoiceData?.HouseJobSid && this.vendorInvoiceData?.MasterJobSid;
      const isMasterJobInvoice = this.vendorInvoiceData?.MasterJobSid && !this.vendorInvoiceData?.HouseJobSid;
      const bookingHeader = this.vendorInvoiceData?.BookingHeader || this.vendorInvoiceData?.bookingHeader || {};
      const houseJob = this.vendorInvoiceData?.houseJob || {};
      const masterJob = this.vendorInvoiceData?.masterJob || {};
      const allDetails: any[] = this.vendorInvoiceData?.VoucherDetail || [];
      const voucherDetails = allDetails
        .filter((d) => d.IsAutoGenerated !== 'Y')
        .map((detail, index) => {
          const taxPercentages = this.getTaxPercentageForDisplay(detail);
          const taxAmounts = this.getTaxAmountForDisplay(detail);
          const hssacCode = detail?.HSSACCode || detail?.hssacMaster?.HSSACCode || detail?.hssacMaster?.hsnCode || '-';

          const totalTaxAmount = toNumber(taxAmounts.cgstAmt) + toNumber(taxAmounts.sgstAmt) + toNumber(taxAmounts.igstAmt) + toNumber(taxAmounts.vatAmt);
          const actualLocalAmount = toNumber(detail.LocalAmount) + totalTaxAmount;
          const exchangeRate = toNumber(this.vendorInvoiceData?.ExchangeRate) || 1;
          const correctedTaxAmount =
            this.vendorInvoiceData?.CurrencyMasterSid === this.currentCompany.CurrencyMasterSid
              ? totalTaxAmount
              : (totalTaxAmount / exchangeRate);
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
            PartyAmount: this.getFormattedAmount(actualPartyAmount, this.vendorInvoiceData?.CurrencyMasterSid)
          };
        });

      const totalPartyAmount = voucherDetails.reduce((sum, detail) => {
        if (detail.DrCr === 'D') {
          return sum + toNumber(detail.PartyAmount);
        }
        return sum - toNumber(detail.PartyAmount);
      }, 0);

      if (!this.isBankFetched) {
        await this.getAndStoreVendorBankDetails();
      }
      const bankDetails = this.bankDetails ?? this.vendorInvoiceData?.BankDetails ?? [];

      if (!this.TandCFetched) {
        await this.getAndStoreVendorTandC();
      }
      const tandc = this.TandCList || [];
      const salesmanName = this.vendorInvoiceData?.SalesmanName || '';
      const resolvedCurrencySid =
        this.vendorInvoiceData?.CurrencyMasterSid ||
        this.vendorInvoiceForm.get('CurrencyMasterSid')?.getRawValue() ||
        this.currencyList.find(
          (c: any) => c.currencyCode === this.vendorInvoiceData?.CurrencyCode
        )?.CurrencyMasterSid ||
        this.currentCompanyCurrency?.currencyMasterSid;
      const totalForWords = Number(Math.abs(totalPartyAmount).toFixed(2));
      const amountInWords = this.getAmountInWords(totalForWords, resolvedCurrencySid);

      this.vendorInvoicePrintData = {
        invoiceTitle: 'Vendor Invoice',
        GSTCode: this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
        CurrencyMasterSid: this.vendorInvoiceData?.CurrencyMasterSid || 0,
        CurrencyCode: this.vendorInvoiceData?.CurrencyCode || '',
        VoucherDate: this.vendorInvoiceData?.VoucherDate || '',
        InvoiceNo: this.vendorInvoiceData?.VoucherNumber || '',
        InvoiceDate: this.vendorInvoiceData?.VoucherDate || '',
        InvoiceDueDate: this.vendorInvoiceData?.DueDate || this.vendorInvoiceForm.get('DueDate')?.value || '',
        BilledTo: this.vendorInvoiceData?.PartyName || this.vendorInvoiceData?.subledgerMaster?.SubledgerName || '',
        BillingAddress: this.vendorInvoiceData?.PartyAddress || this.vendorInvoiceData?.subledgerMaster?.Address || '',
        PAN: this.currentCompany?.Pan || this.currentCompany?.PAN || '',
        GST_VAT: this.vendorInvoiceData?.GST_VAT || '',
        IRNNumber: this.vendorInvoiceData?.IRNNumber || '',
        ShipperName: isHouseJobInvoice ? houseJob?.ShipperName : (isBookingInvoice ? bookingHeader?.ShipperName : ''),
        ConsigneeName: isHouseJobInvoice ? houseJob?.ConsigneeName : (isBookingInvoice ? bookingHeader?.ConsigneeName : ''),
        Vessel: this.getShipmentFieldValue('VesselName') || '',
        VoyageNo: this.getShipmentFieldValue('VoyageNo') || '',
        POL: this.getShipmentFieldValue('POL') || '',
        PlaceofSupply: this.vendorInvoiceData?.PlaceOfSupply || '',
        FPD: this.getShipmentFieldValue('FPD') || '',
        ETD: this.getShipmentFieldValue('ETD') || '',
        ETA: this.getShipmentFieldValue('ETA') || '',
        MasterJobNumber: masterJob?.MasterJobNumber || '',
        MasterJobDate: masterJob?.MasterJobDate || '',
        DocumentNumber: this.vendorInvoiceData?.DocumentNumber || '',
        DocumentDate: this.vendorInvoiceData?.DocumentDate || '',
        ContainerType: masterJob?.containers?.[0]?.ContainerType || '',
        ContainerNumber: masterJob?.containers?.[0]?.ContainerNumber || '',
        DepartmentMasterSid: masterJob?.DepartmentMasterSid || '',
        HBLNo: houseJob?.HBLNo || '',
        MBLNo: masterJob?.MBLNo || '',
        isPosted: this.isPosted,
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
        BookingNumber: isHouseJobInvoice
          ? houseJob?.BookingNo
          : (isBookingInvoice ? bookingHeader?.BookingNo : ''),
        CurrExRate: `${this.vendorInvoiceData?.CurrencyCode || ''} / ${this.getFormattedAndPaddedExchangeRate(toNumber(this.vendorInvoiceData?.ExchangeRate), this.vendorInvoiceData?.CurrencyMasterSid)}`,
        SalesPerson: salesmanName,
        Remarks: this.vendorInvoiceData?.Remarks || '',
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
              : ' '
      };
    }

    async openPrintModal(){
      if (!this.headerId) {
        this.appSettingService.showWarning('Please save the vendor invoice first.');
        return;
      }

      this.spinner.show();
      try {
        await this.prepareVendorPrintData();

        const modalRef = this.modalService.open(VendorInvoicePrintComponent, {
          size: 'xl',
          scrollable: true
        });

        modalRef.componentInstance.sourceVendorInvoiceData = this.vendorInvoiceData;
        modalRef.componentInstance.vendorInvoiceData = this.vendorInvoicePrintData;
        modalRef.componentInstance.printData = this.vendorInvoicePrintData;
        modalRef.componentInstance.currentCompany = this.currentCompany;
        modalRef.componentInstance.currentBranch = this.currentBranch;
        modalRef.componentInstance.currentCompanyCountryCode = this.currentCompanyCountryCode;
        modalRef.componentInstance.currentCompanyCurrency = this.currentCompanyCurrency;
        modalRef.componentInstance.bankDetails = this.vendorInvoicePrintData?.BankDetails || [];
        modalRef.componentInstance.TandCList = this.vendorInvoicePrintData?.TermsAndConditions || [];
        modalRef.componentInstance.userData = this.userData;
        modalRef.componentInstance.isVATMode = this.isVATMode;
        modalRef.componentInstance.currentDate = this.currentDate;
      } finally {
        this.spinner.hide();
      }
    }
}
