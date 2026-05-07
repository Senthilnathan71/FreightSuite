import { CommonModule } from '@angular/common';
import { Component, HostListener, TemplateRef, ViewChild } from '@angular/core';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
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
} from 'rxjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { TaxCalculationService } from '../../services/tax-calculation.service';
import {
  errorLogger,
  getDefaultTodayDate,
  toNgbDateStruct,
  toNumber,
} from 'src/app/common/helper';
import {
  VoucherPeriodValidationService,
  VoucherDateConstraints,
} from 'src/app/common/voucher-period-validation.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { greaterThanZero } from 'src/app/core/ValidationFn/greaterThanZero.validators';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { getExchangeRateErrorMessage } from 'src/app/core/ValidationFn/exRateConsistency.validators';
import {
  errorLoggerWithToastr,
  ValidationMessageConfig,
} from 'src/app/common/error-handling/form-error-handler';
import { ToastrService } from 'ngx-toastr';
import { PdfMakeService } from 'src/app/common/pdf';
import { AuditLogComponent } from '../../audit-log/audit-log.component';
import { DocReferenceComponent } from '../../doc-reference/doc-reference.component';

interface NgbDateStructLike {
  day: number;
  month: number;
  year: number;
}

interface rateComparison {
  Rate: number;
  Amount: number;
  TaxableAmount: number;
  TaxAmount1: number;
  TaxAmount2: number;
  LocalAmount: number;
  PartyAmount: number;
}

@Component({
  selector: 'app-credit-note-entry',
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
  templateUrl: './credit-note-entry.component.html',
  styleUrl: './credit-note-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
    TaxCalculationService,
  ],
})
export class CreditNoteEntryComponent {
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
  salesmanFetched: boolean = false;
  salesmanName: string | null = null;
  isTermsAndConditionsEnabled: boolean = true;
  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;

  creditNoteForm!: FormGroup;
  dueDate: any;
  headerId: number | null = null;
  private taxMastersReady: Promise<void> = Promise.resolve();
  creditNoteData: any;
  currentMenuId: number;
  isViewMode: boolean = false;
  get isEditMode() {
    return !!this.headerId && !this.isViewMode;
  }

  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  // emailForm!: FormGroup;
  // MenuMasterSid: any;
  // currentClauseId: any;
  // showPrintLogo: boolean = false;
  // showPdfLogo: boolean = true;

  @ViewChild('printModal') printModalRef: any;
  @ViewChild('emailModal') emailModalRef: any;
  
  customerList: any[] = [];
  customerBranchList: any[] = [];
  currencyList: any[] = [];
  chargeList: any[] = [];
  hssacList: any[] = [];
  subledgerList: any[] = [];
  uomList: any[] = [];
  departmentList: any[] = [];
  masterJobList: any[] = [];
  houseJobList: any[] = [];
  taxGroupList: any[] = [];
  originalRateList: Map<number, rateComparison> = new Map();
  chargeTaxGroupMap: Map<number, number> = new Map();
  masterHouseMap: Map<number, any[]> = new Map();

  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  HSSACLookupConfig = DROPDOWN_CONFIGS.HSSAC_TAX;
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  masterJobLookupConfig = DROPDOWN_CONFIGS.MASTER_JOB;
  invoiceLookupConfig = DROPDOWN_CONFIGS.INVOICE;

  MenuMasterSid: any;

  selectedTab = 'Credit Note';
  creditNotePrintData: any;
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }
  tabs = [
    { name: 'Credit Note', icon: 'fas fa-file-invoice' },
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
    { id: 'VAT', name: 'VAT' },
  ];
  exportGstTypes = [
    { id: 'EXPWP', name: 'Export With Payment' },
    { id: 'EXPWOP', name: 'Export Without Payment' },
  ];
  ModeofStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
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

  filteredDetailItems: any[] = [];
  currentDate = new Date();
  isAutoPosting: boolean = true;
  minVoucherDate: NgbDateStruct = null;

  get effectiveMinDate(): NgbDateStruct | null {
    if (this.minVoucherDate && this.fyMinDate) {
      const invDate = new Date(this.minVoucherDate.year, this.minVoucherDate.month - 1, this.minVoucherDate.day);
      const fyDate = new Date(this.fyMinDate.year, this.fyMinDate.month - 1, this.fyMinDate.day);
      return invDate > fyDate ? this.minVoucherDate : this.fyMinDate;
    }
    return this.fyMinDate;
  }

  // Credit Note specific variable declaration
  invoiceOutstandingAmount: number = 0;
  invoiceOutstandingLocalAmount : number = 0;
  selectedOutstandingInvoice: any = null;
  showOutstandingInfo: boolean = false;

  // Voucher period constraints
  voucherConstraints: VoucherDateConstraints = {
    isClosed: false,
    errorMessage: null,
  };
  // Gates the inline error label and button-disable: create=after save-click, edit=after date-change
  showVoucherDateError = false;

  // Unsaved changes related variable declarations
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();
  private _originalHSSACValues: (number | null)[] = [];
  private _previousInvoiceType: string = 'REG';
  private _isInitialLoad = false;

  // Declaration not exist in Vendor Invoice
  TandCFetched: boolean = false;
  TandCList: any[] = [];
  isBankFetched: boolean = false;
  bankDetails: any;
  emailForm!: FormGroup;

  bookingModeCountry: string = 'india';

  get isIndiaGST(): boolean {
    return this.taxCalculationService.isIndiaGST;
  }
  get isVATMode(): boolean {
    return this.taxCalculationService.isVATMode;
  }

  get f(): { [key: string]: AbstractControl } {
    return this.creditNoteForm.controls;
  }
  get details(): FormArray {
    return this.creditNoteForm.get('voucherDetails') as FormArray;
  }

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
    private commonService: CommonService,
    private masterService: MasterService,
    private numberToWords: NumberToWordsService,
    private currencyFormatter: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService,
    public logoService: LogoService,
    private voucherPeriodService: VoucherPeriodValidationService,
    private datePipe: CustomDatePipe,
    private toastr: ToastrService,
    private pdfMakeService: PdfMakeService,
    public taxCalculationService: TaxCalculationService,
    private emailTriggerService: EmailTriggerService,
  ) {}
  ngOnInit(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
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
      console.error('Error loading company data:', e);
      this.currentCompany = null;
      this.currentBranch = null;
    }
    this.taxMastersReady = this.taxCalculationService.init({
      documentSide: 'SALES',
      companyCountryCode: this.currentCompanyCountryCode,
      companyCountryMasterSid: this.currentCompanyCountryId,
      branchStateName: this.currentBranchStateName,
      branchStateMasterSid: this.currentBranchState?.StateMasterSid,
    }).then(() => this.taxCalculationService.fetchTaxMasters('SALES'));

    this.loadTermsAndConditionsConfig();
    this.initForm();
    this.loadVoucherPeriods();

    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (id) {
        this.headerId = Number(id);
        await this.taxMastersReady;
        this.loadCreditNoteById(this.headerId);
      } else {
        this.initialFormValue = this.creditNoteForm.getRawValue();
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

  loadCityName(): void {
    if (!this.currentBranchCityId) return;

    this.spinner.show();

    this.masterService
      .getCityById(this.currentBranch?.CityMasterSid)
      .subscribe({
        next: (response: any) => {
          console.log('City API response:', response);

          if (response) {
            const ourCity = response;

            this.currentBranchCityName = ourCity ? ourCity.cityName : '';
            console.log('Final City Name:', this.currentBranchCityName);
          }

          this.spinner.hide();
        },
        error: (error) => {
          console.error('Failed to load city:', error);
          this.spinner.hide();
        },
      });
  }

  initForm() {
    const companyCurrencyId =
      this.currentCompany?.CurrencyMasterSid ||
      this.currentCompanyCurrency?.currencyMasterSid;
    const companyCurrencyCode = this.currentCompanyCurrency.code;
    const today = getDefaultTodayDate();
    const fyDefault = this.appSettingService.getCurrentFinancialYear();
    const defaultVoucherDate = fyDefault && (today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)) ? fyDefault.EndDate : today;

    this.creditNoteForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }],
      VoucherDate: [defaultVoucherDate, Validators.required],
      CustomerMasterSid: [null],
      PartyMasterSid: [{ value: null, disabled: true }],
      PartyName: [{ value: null, disabled: true }],
      PartyAddress: [{ value: '', disabled: true }, Validators.required],
      COAMasterSid: [null],
      CustomerBranchSid: [{ value: null, disabled: true }],
      IRNNumber: [{ value: '', disabled: true }],
      MasterJobSid: [{ value: '', disabled: true }],
      MBLNo: [{ value: '', disabled: true }],
      HouseJobSid: [{ value: null, disabled: true }],
      HBLNo: [{ value: '', disabled: true }],
      CurrencyMasterSid: [{ value: companyCurrencyId, disabled: true }],
      CurrencyCode: [{ value: companyCurrencyCode, disabled: true }],
      ExchangeRate: [
        { value: 1, disabled: true },
        [Validators.required, greaterThanZero()],
      ],
      GST_VAT: [{ value: '', disabled: true }],
      PlaceOfSupply: [{ value: '', disabled: true }],
      PostStatus: ['U'],
      PostedOn: [{ value: null, disabled: true }],
      GSTType: [{ value: '', disabled: true }],
      InvoiceType: [{ value: 'REG', disabled: true }],
      Narration: [{ value: '', disabled: true }],
      Remarks: [{ value: '', disabled: true }],
      Salesman : [''],
      IRNStatus: [{ value: '', disabled: true }],
      //TODO - Status
      Status: [{ value: 'A', disabled: true }],
      DepartmentMasterSid: [{ value: null, disabled: true }],
      //TODO - BillNo
      BillNo: [{ value: '', disabled: true }],
      CreditNoteReason: [null, Validators.required],
      ReversalVoucher: [{ value: '', disabled: true }],
      ReversalVoucherNumber: [''],

      State: [{ value: '', disabled: true }],
      HouseNumber: [{ value: '', disabled: true }],
      MasterNumber: [{ value: '', disabled: true }],
      BookingHeaderSid: [{ value: null, disabled: true }],
      //Details Array
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
  }

  private getHSSACListForRow(i: number): any[] {
    return this.hssacList[i] || [];
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
    ['CurrencyCode', 'ExchangeRate'].forEach((field) => {
      this.creditNoteForm
        .get(field)
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.isPosted) return;
          this.recalculateAllRows();
        });
    });

    this.creditNoteForm.get('GSTType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((gstType) => {
        if (this.isPosted) return;
        if (gstType === 'EXPWP' || gstType === 'EXPWOP') {
          this.taxCalculationService.updateSelectedGstType(gstType);
        }
        this.recalculateAllRows();
      });

    this.creditNoteForm.get('InvoiceType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((invoiceType) => {
        if (!this.creditNoteForm.get('PlaceOfSupply')?.value) return;
        const ok = this.handleZeroRatedSwitch(invoiceType);
        if (!ok) {
          this.creditNoteForm.get('InvoiceType')?.setValue(this._previousInvoiceType, { emitEvent: false });
          return;
        }
        this._previousInvoiceType = invoiceType;
        const classification = this.taxCalculationService.updateInvoiceType(invoiceType as any);
        this.creditNoteForm.get('GSTType')?.setValue(classification.formGSTType, { emitEvent: false });
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
    this.creditNoteForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.creditNoteForm.getRawValue(),
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
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }

  private autoGenerateNarration(reversalVoucher: any): string {
    if (!reversalVoucher) return '';
    const voucherNumber = reversalVoucher.VoucherNumber || '';
    const voucherType = reversalVoucher.voucherType || '';
    if (voucherNumber) {
      return `Being reversal of ${voucherNumber}${voucherType ? ` - ${voucherType}` : ''}`;
    }

    return '';
  }

  onHeaderCurrencyChange(selectedCurrency: any): void {
    if (!selectedCurrency) return;
    const currencyMasterSid = selectedCurrency?.CurrencyMasterSid;
    const currencyCode = selectedCurrency?.currencyCode;

    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    const companyCurrencyCode = this.currentCompanyCurrency?.code;

    // If same as company currency, set exchange rate to 1 and disable
    if (currencyMasterSid === companyCurrency) {
      this.creditNoteForm.patchValue({
        CurrencyMasterSid: currencyMasterSid,
        CurrencyCode: currencyCode,
        ExchangeRate: 1,
      });
      this.creditNoteForm.get('ExchangeRate')?.disable();
    } else {
      this.fetchExchangeRate(currencyCode, companyCurrencyCode);
    }
  }

  async loadLookups() {
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
      ({ customers, currencies, charges, uoms, departments, masterJobs }) => {
        this.customerList = customers.data || [];
        this.subledgerList = customers.data || [];
        this.chargeList = charges.data || [];

        this.currencyList = currencies.data || [];
        this.currencyConfigService.initializeConfigurations(this.currencyList);
        this.numberToWords.initializeCurrencies(this.currencyList);

        this.uomList = uoms.data || [];
        this.departmentList = departments.data || [];
        this.masterJobList = masterJobs.data || [];
        if (!this.isEditMode) {
          this.spinner.hide();
        }
      },
    );
  }

  getInvoiceData() {
    const invoiceNumber = this.creditNoteForm.get(
      'ReversalVoucherNumber',
    )?.value;
    const searchValue = String(invoiceNumber).trim();
    if (!invoiceNumber) {
      this.appSettingService.showWarning(
        'Please enter an invoice number first.',
      );
      return;
    }

    const payload = {
      VoucherNumber: searchValue,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };

    this.spinner.show();
    this.operationService.getInvoiceByNumber(payload).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          const data = resp.data;
          if (!data.hasOutstandingAmount) {
            this.appSettingService.showWarning(
              'No outstanding amount found for this invoice.',
            );
            this.spinner.hide();
            return;
          }
          this.creditNoteForm.patchValue({
            ReversalVoucher: data.VoucherHeaderSid,
          });

          const autoNarration = this.autoGenerateNarration(data);
          this.creditNoteForm.get('Narration')?.setValue(autoNarration);
          this.minVoucherDate = toNgbDateStruct(resp.data?.VoucherDate) || null;

          this.patchcreditNoteData(data);
          this.appSettingService.showSuccess(
            'Invoice data loaded successfully.',
          );
        } else {
          this.spinner.hide();
          this.appSettingService.showError(
            resp.message || 'Error loading invoice data.',
          );
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Error fetching invoice:', err);
        this.appSettingService.showError('Failed to load invoice data.');
      },
    });
  }

  getcreditNoteData() {
    const invoiceNumber = this.creditNoteForm.get(
      'ReversalVoucherNumber',
    )?.value;
    const searchValue = String(invoiceNumber).trim();
    if (!invoiceNumber) {
      this.appSettingService.showWarning(
        'Please enter an invoice number first.',
      );
      return;
    }

    const payload = {
      VoucherNumber: searchValue,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };

    this.spinner.show();
    this.operationService.getInvoiceByNumber(payload).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          const data = resp.data;
          if (!data.hasOutstandingAmount) {
            this.appSettingService.showWarning(
              'No outstanding amount found for this invoice.',
            );
            this.spinner.hide();
            return;
          }
          this.creditNoteForm.patchValue({
            ReversalVoucher: data.VoucherHeaderSid,
          });

          const autoNarration = this.autoGenerateNarration(data);
          this.creditNoteForm.get('Narration')?.setValue(autoNarration);
          this.minVoucherDate = toNgbDateStruct(resp.data?.VoucherDate) || null;

          this.patchcreditNoteData(data);
          this.appSettingService.showSuccess(
            'Invoice data loaded successfully.',
          );
        } else {
          this.spinner.hide();
          this.appSettingService.showError(
            resp.message || 'Error loading invoice data.',
          );
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Error fetching invoice:', err);
        this.appSettingService.showError('Failed to load invoice data.');
      },
    });
  }

  private patchcreditNoteData(data: any) {
    const header = data;
    const invoiceHeaderSid =
      header.VoucherHeaderSid || header.voucherHeaderSid || null;
    this.originalRateList = new Map();
    const autoNarration = this.autoGenerateNarration(data);

    this.getCustomerBranchByCustomer(header.CustomerMasterSid);

    this.creditNoteForm.patchValue(
      {
        ReversalVoucher: invoiceHeaderSid,
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
        MasterJobSid: header.MasterJobSid || null,
        BookingHeaderSid: header.BookingHeaderSid || null,
        CurrencyMasterSid: header.CurrencyMasterSid || null,
        CurrencyCode:
          header.currencyMaster?.currencyCode || header.CurrencyCode || null,
        ExchangeRate: this.getFormattedAndPaddedExchangeRate(header.ExchangeRate || header.ExRate || 0, header.CurrencyMasterSid),
        BillNo: header.DocumentNumber || '',
        BillAmount: header.Amount || 0,
        MBLNo: header.MasterNumber || '',
        HBLNo: header.HouseNumber || '',
        Remarks: header.Remarks || '',
        Salesman : header.Salesman || '',
      },
      { emitEvent: false },
    );

    this.details.clear();
    let index = 0;
    (data.VoucherDetail || []).forEach((detail: any) => {
      const originalDrCr = detail.DrCr || detail.drCr || 'C';
      const swappedDrCr = originalDrCr === 'C' ? 'D' : 'C';

      const originalRateComparison: rateComparison = {
        Rate: toNumber(
          this.getFormattedAmount(detail.Rate || 0, detail.CurrencyMasterSid),
        ),
        Amount: toNumber(
          this.getFormattedAmount(detail.Amount || 0, detail.CurrencyMasterSid),
        ),
        TaxableAmount: toNumber(
          this.getFormattedAmount(
            detail.TaxableAmount || 0,
            this.currentCompany.CurrencyMasterSid,
          ),
        ),
        TaxAmount1: toNumber(
          this.getFormattedAmount(
            detail.TaxAmount1 || 0,
            this.currentCompany.CurrencyMasterSid,
          ),
        ),
        TaxAmount2: toNumber(
          this.getFormattedAmount(
            detail.TaxAmount2 || 0,
            this.currentCompany.CurrencyMasterSid,
          ),
        ),
        LocalAmount: toNumber(
          this.getFormattedAmount(
            detail.LocalAmount || 0,
            this.currentCompany.CurrencyMasterSid,
          ),
        ),
        PartyAmount: toNumber(
          this.getFormattedAmount(
            detail.PartyAmount || 0,
            data.CurrencyMasterSid,
          ),
        ),
      };

      this.originalRateList.set(
        detail.VoucherDetailSid,
        originalRateComparison,
      );

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
          CurrencyMasterSid: detail.CurrencyMasterSid,
          CurrencyCode: detail.CurrencyCode,
          Rate: detail.Rate != null ? Number(detail.Rate) : 0,
          ExchangeRate: this.getFormattedAndPaddedExchangeRate(detail.ExchangeRate, detail.CurrencyMasterSid),
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
          CostRevenue : detail.CostRevenue,
          LocalAmount: toNumber(detail.LocalAmount),
          PartyAmount: toNumber(detail.PartyAmount),
          MasterJobSid: detail.MasterJobSid,
          BookingRatesSid : detail.BookingRatesSid,
          CostRevenueChargesSid:
            detail.CostRevenueChargesSid ?? detail.CostRevenueChargeSid ?? null,
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
      index++;
    });

    // Patch voucher others data if available
    const voucherOthersSource =
      data.VoucherOthers ||
      data.voucherOthers ||
      (Array.isArray(data.voucherOthers) ? data.voucherOthers[0] : undefined);

    if (voucherOthersSource) {
      const vg = this.creditNoteForm.get('voucherOthers') as FormGroup;
      vg.patchValue({
        ContainerNumber: voucherOthersSource.ContainerNumber || '',
        VoucherNote: voucherOthersSource.VoucherNote || '',
        Footer: voucherOthersSource.Footer || '',
        ReverseCreditNote: voucherOthersSource.ReverseCreditNote || '',
        DueDate: voucherOthersSource.DueDate,
        IRNNumber: voucherOthersSource.IRNNumber || '',
      });
    }

    if (data.hasOutstandingAmount) {
      this.invoiceOutstandingAmount = data.totalOSAmount;
      this.invoiceOutstandingLocalAmount = data.totalOSLocalAmount;
      this.showOutstandingInfo = true;
    }

    // Set up party context for tax display (columns + row tax amounts)
    this.taxCalculationService.updateParty(
      {
        countryCode: this.getCustomerCountry() || this.currentCompanyCountryCode,
        stateName: header.PlaceOfSupply || '',
        stateMasterSid: header.customerBranch?.stateMaster?.StateMasterSid,
        gstNumber: header.GST_VAT || '',
        customerGstType: header.customerBranch?.CustomerGstType || 'Regular',
        isUnionTerritory: header.customerBranch?.stateMaster?.IsUnionTerritory === 'Y',
        selectedGstType: (header.GSTType === 'EXPWP' || header.GSTType === 'EXPWOP') ? header.GSTType : undefined,
      },
      header.InvoiceType as any
    );

    console.info('DEBUG - After patching', this.creditNoteForm.getRawValue());
    this.spinner.hide();
  }

  loadVoucherPeriods(): void {
    this.voucherPeriodService.loadPeriods(
      this.currentCompany?.CompanyMasterSid,
      this.currentBranch?.BranchMasterSid,
      this.currentFinancialYear,
      () => this.applyVoucherDateConstraints(),
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
    const voucherDate = this.creditNoteForm?.get('VoucherDate')?.value;
    this.voucherConstraints = this.voucherPeriodService.applyConstraints(
      voucherDate,
      'AR',
    );
  }

  onVoucherDateChange(): void {
    this.applyVoucherDateConstraints();
    // Edit mode: reveal error label + gate button-disable now that user has changed the date
    if (this.headerId) this.showVoucherDateError = true;
    const voucherDate = this.creditNoteForm.get('VoucherDate')?.getRawValue();
    if (!voucherDate) return;

    const companyCurrency = this.currentCompanyCurrency.code;

    // Check if header currency available , if yes fetch and recalculate
    const headerCurrencyId = this.creditNoteForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    const headerCurrencyCode = this.creditNoteForm
      .get('CurrencyCode')
      ?.getRawValue();
    if (headerCurrencyId) {
      if (headerCurrencyCode === companyCurrency) {
        this.creditNoteForm
          .get('ExchangeRate')
          ?.setValue(
            this.getFormattedAndPaddedExchangeRate(1, headerCurrencyId),
          );
        this.creditNoteForm.get('ExchangeRate')?.disable();
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
        this.creditNoteForm
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
  }

  onCustomerChange(selected: any) {
    const customerMasterSid =
      typeof selected === 'object' && selected !== null
        ? (selected.CustomerMasterSid ?? selected)
        : selected;

    const currentCompanyCurrencyId = this.currentCompany.CurrencyMasterSid;
    const currentCompanyCurrencyCode = this.currentCompanyCurrency?.code;

    if (!selected || !customerMasterSid) {
      this.customerBranchList = [];
      this.creditNoteForm.get('CustomerMasterSid')?.setValue(null);
      this.creditNoteForm.get('CustomerBranchSid')?.setValue(null);
      this.creditNoteForm.get('PartyAddress')?.setValue('');
      this.creditNoteForm.get('PartyMasterSid')?.setValue(null);
      this.creditNoteForm.get('COAMasterSid')?.setValue(null);
      this.creditNoteForm.get('GST_VAT')?.setValue('');
      this.creditNoteForm.get('PartyName')?.setValue(null);
      this.creditNoteForm.get('PlaceOfSupply')?.setValue('');
      this.creditNoteForm
        .get('CurrencyMasterSid')
        ?.setValue(currentCompanyCurrencyId);
      this.creditNoteForm
        .get('CurrencyCode')
        ?.setValue(currentCompanyCurrencyCode);

      this.creditNoteForm.get('InvoiceType')?.setValue('REG');
      this.creditNoteForm.get('GSTType')?.setValue('');
      return;
    }

    const customer = this.customerList.find(
      (c) => c.CustomerMasterSid === customerMasterSid,
    );
    const countryCode = this.getCustomerCountryCode(customer);
    const customerCurrency = customer?.currencyMaster;

    if (customer) {
      this.creditNoteForm.patchValue({
        CustomerMasterSid: customer.CustomerMasterSid,
        PartyName: customer.CustomerName || '',
        PartyMasterSid: customer.SubledgerMasterSid || null,
        COAMasterSid: customer.COAMappedId || null,
        InvoiceType: 'REG',
        CurrencyMasterSid:
          customerCurrency?.CurrencyMasterSid ?? currentCompanyCurrencyId,
        CurrencyCode:
          customerCurrency?.currencyCode ?? currentCompanyCurrencyCode,
      });

      if (customerCurrency) {
        this.onHeaderCurrencyChange(customerCurrency);
      } else {
        const currency = {
          CurrencyMasterSid: currentCompanyCurrencyId,
          currencyCode: currentCompanyCurrencyCode,
        };
        this.onHeaderCurrencyChange(currency);
      }
    }

    // Reset branch selection when customer changes
    this.creditNoteForm.get('CustomerBranchSid')?.setValue(null);
    this.creditNoteForm.get('PartyAddress')?.setValue('');
    this.creditNoteForm.get('PlaceOfSupply')?.setValue('');
    this.creditNoteForm.get('GSTType')?.setValue('');
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
        ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
        : selectedBranch;

    if (!branchSid) {
      this.creditNoteForm.get('PartyAddress')?.setValue('');
      this.creditNoteForm.get('PlaceOfSupply')?.setValue('');
      this.creditNoteForm.get('GSTType')?.setValue('');
      //TODO Need to ask whether due date is required for this
      // this.others.get('DueDate')?.setValue(null);
      return;
    }

    const foundBranch = this.customerBranchList.find(
      (b) => Number(b.CustomerBranchSid) === Number(branchSid),
    );
    // Overseas party → Place of Supply is the seller's (company's) state
    const customerCountry = this.getCustomerCountry()?.toLowerCase();
    const isOverseas = customerCountry && customerCountry !== this.currentCompanyCountryCode;
    const placeOfSupply = isOverseas
      ? (this.currentBranchStateName || '')
      : (foundBranch?.stateMaster?.stateName || '');
    if (foundBranch) {
      this.creditNoteForm.patchValue({
        PartyAddress: foundBranch.Address,
        PlaceOfSupply: placeOfSupply,
      });
      if (this.currentCompanyCountryCode === 'in') {
        this.creditNoteForm.get('GST_VAT')?.setValue(foundBranch?.GSTNo || '');
      } else {
        this.creditNoteForm.get('GST_VAT')?.setValue(foundBranch?.customerMaster?.PanType || '');
      }
    } else {
      this.creditNoteForm.get('PartyAddress')?.setValue('');
      this.creditNoteForm.get('PlaceOfSupply')?.setValue('');
    }
    this.determineGSTType(placeOfSupply);
    this.recalculateAllRows();
  }

  determineGSTType(placeOfSupply: string) {
    if (!placeOfSupply) {
      this.creditNoteForm.get('GSTType')?.setValue('');
      return;
    }

    const customerBranchSid = this.creditNoteForm.get('CustomerBranchSid')?.value;
    const foundBranch = this.customerBranchList.find(
      (branch) => Number(branch.CustomerBranchSid) === Number(customerBranchSid),
    );
    const customerTaxNo = this.creditNoteForm.get('GST_VAT')?.value;
    const invoiceType = this.creditNoteForm.get('InvoiceType')?.value;
    const customerCountry = this.getCustomerCountry();

    const classification = this.taxCalculationService.updateParty(
      {
        countryCode: customerCountry || this.currentCompanyCountryCode,
        stateName: placeOfSupply,
        stateMasterSid: foundBranch?.stateMaster?.StateMasterSid,
        gstNumber: customerTaxNo,
        customerGstType: foundBranch?.CustomerGstType || 'Regular',
        isUnionTerritory: foundBranch?.stateMaster?.IsUnionTerritory === 'Y',
      },
      invoiceType as any
    );

    this.creditNoteForm.get('GSTType')?.setValue(classification.formGSTType);

    if (this.currentCompanyCountryCode !== 'in') {
      this.creditNoteForm.get('GSTType')?.setValue('VAT');
      this.creditNoteForm.get('TaxType')?.setValue('VAT');
    }
  }

  patchDueDate() {
    let CustomerMasterSid: number;
    let CustomerBranchSid: number;
    let partyLedgerSid = this.creditNoteForm?.get('PartyMasterSid')?.value;
    if (partyLedgerSid) {
      const selectedParty = this.customerList.find(
        (cus) => cus.SubledgerMasterSid === partyLedgerSid,
      );
      CustomerMasterSid = selectedParty?.CustomerMasterSid;
    }

    const branchId = this.creditNoteForm?.get('CustomerBranchSid')?.value;
    if (branchId) {
      const selectedBranch = this.customerBranchList.find(
        (branch) => branch.BranchMasterSid === branchId,
      );
      CustomerBranchSid = branchId;
      CustomerMasterSid =
        CustomerMasterSid || selectedBranch?.CustomerMasterSid;
    }

    const voucherDate = this.creditNoteForm?.get('VoucherDate')?.value;
    const departmentId = this.creditNoteForm?.get('DepartmentMasterSid')?.value;
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

  loadCreditNoteById(id: number) {
    this.operationService.getCreditNoteById(id).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          this.destroy$.next();
          this.destroy$.complete();
          const data = resp.data;
          this.creditNoteData = resp.data;
          this.creditNoteForm.markAllAsTouched();
          this.patchValues(this.creditNoteData);
          this.applyVoucherDateConstraints();

          // Edit mode: restrict the date picker to the original voucher's month so user
          // cannot change the voucher date to a different month.
          const _cnOrigDate = new Date(this.creditNoteData.VoucherDate);
          if (!isNaN(_cnOrigDate.getTime())) {
            const _y = _cnOrigDate.getFullYear(), _m = _cnOrigDate.getMonth() + 1;
            const _monthEnd = new Date(_y, _m, 0);
            const _today = new Date(); _today.setHours(0, 0, 0, 0);
            const _effectiveEnd = _monthEnd < _today ? _monthEnd : _today;
            this.fyMinDate = { year: _y, month: _m, day: 1 };
            this.fyMaxDate = { year: _effectiveEnd.getFullYear(), month: _effectiveEnd.getMonth() + 1, day: _effectiveEnd.getDate() };
          }

          this.creditNoteForm.get('PartyName')?.disable();
          this.creditNoteForm.get('CustomerBranchSid')?.disable();
          this.creditNoteForm.get('CurrencyMasterSid')?.disable();
          this.creditNoteForm.get('CurrencyCode')?.disable();
          if (this.isReadOnly) {
            this.details.disable({ emitEvent: false });
            this.isDirty = false;
            this.initialFormValue = this.creditNoteForm.getRawValue();
            this.creditNoteForm.disable();
            this.destroy$.next();
            this.destroy$.complete();
            return;
          }
          setTimeout(() => {
            this.initialFormValue = this.creditNoteForm.getRawValue();
            this.isDirty = false;
            this.subscribeToFormChanges();
            this.subscribeToValueChanges();
          }, 0);
        } else {
          this.spinner.hide();
          this.appSettingService.showError('Error loading creditNoteData');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
        this.appSettingService.showError('Error loading creditNoteData');
      },
    });
  }

  patchValues(data: any) {
    if (data.CustomerMasterSid) {
      this.getCustomerBranchByCustomer(Number(data.CustomerMasterSid));
    } else {
      this.customerBranchList = [];
    }

    this.creditNoteForm.patchValue(
      {
        ReversalVoucher: data.ReversalVoucher,
        ReversalVoucherNumber: data.reversalVoucher?.VoucherNumber || '',
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

    this.creditNoteForm.get('VoucherDate')?.disable();
    this.creditNoteForm.get('ReversalVoucher')?.disable();

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

          CostRevenue : det.CostRevenue,
          BookingRatesSid : det.BookingRatesSid,
          CostRevenueChargesSid:
            det.CostRevenueChargesSid ?? det.CostRevenueChargeSid ?? null,
          SourceDetailSid: det.SourceDetailSid,
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
      index++;
    }

    if (data.VoucherOthers && data.VoucherOthers.length > 0) {
      const others = data.VoucherOthers[0];
      this.creditNoteForm.get('voucherOthers')?.patchValue({
        ContainerNumber: others.ContainerNumber || '',
        VoucherNote: others.VoucherNote || '',
        Footer: others.Footer || '',
      });
    }
    // Set up party context for tax calculation on subsequent changes
    const customer = this.customerList.find(
      (c) => c.SubledgerMasterSid === data.PartyMasterSid
    );
    this.taxCalculationService.updateParty(
      {
        countryCode: customer?.countryMaster?.countryCode || this.currentCompanyCountryCode,
        stateName: data.PlaceOfSupply || '',
        stateMasterSid: data.customerBranch?.stateMaster?.StateMasterSid,
        gstNumber: data.GST_VAT || '',
        customerGstType: data.customerBranch?.CustomerGstType || 'Regular',
        isUnionTerritory: data.customerBranch?.stateMaster?.IsUnionTerritory === 'Y',
        selectedGstType: (data.GSTType === 'EXPWP' || data.GSTType === 'EXPWOP') ? data.GSTType : undefined,
      },
      data.InvoiceType as any
    );

    console.info('DEBUG - After patching', this.creditNoteForm.getRawValue());
    this.spinner.hide();
  }

  async preparePrintData() {
    const isBookingInvoice = this.creditNoteData.BookingHeaderSid;
    const isHouseJobInvoice =
      this.creditNoteData.HouseJobSid && this.creditNoteData.MasterJobSid;
    const isMasterJobInvoice =
      this.creditNoteData.MasterJobSid && !this.creditNoteData?.HouseJobSid;

    const allDetails: any[] = this.creditNoteData.VoucherDetail || [];
    const voucherDetails = allDetails
      .filter((d) => d.IsAutoGenerated !== 'Y')
      .map((detail, index) => {
        const hssacCode = this.getHSSACCode(detail.HSSACMasterSid, index);
        const taxPercentages = this.getTaxPercentageForDisplay(detail);
        const taxAmounts = this.getTaxAmountForDisplay(detail);

        const totalTaxAmount =
          this.getTaxAmountForDisplay(detail).cgstAmt +
          this.getTaxAmountForDisplay(detail).sgstAmt +
          this.getTaxAmountForDisplay(detail).igstAmt +
          this.getTaxAmountForDisplay(detail).vatAmt;

        const actualLocalAmount =
          toNumber(detail.LocalAmount) + toNumber(totalTaxAmount);

        const correctedTaxAmount =
          this.creditNoteData?.CurrencyMasterSid ===
          this.currentCompany.CurrencyMasterSid
            ? totalTaxAmount
            : totalTaxAmount / toNumber(this.creditNoteData?.ExchangeRate);
        const actualPartyAmount =
          toNumber(correctedTaxAmount) + toNumber(detail.PartyAmount);

        return {
          Sno: index + 1,
          ChargeDescription: detail.ChargeDescription,
          HSSACCode: hssacCode,
          DrCr: detail.DrCr,
          CurrencyMasterSid: detail.CurrencyMasterSid,
          CurrencyCode: detail.CurrencyCode,
          NumberOfUnit: Number(detail.NumberOfUnit).toFixed(3),
          Rate: this.getFormattedAndPaddedAmount(
            detail.Rate,
            detail.CurrencyMasterSid,
          ),
          ExchangeRate: this.getFormattedAndPaddedExchangeRate(
            detail.ExchangeRate,
            detail.CurrencyMasterSid,
          ),
          TaxableAmount: this.getFormattedAndPaddedAmount(
            detail.TaxableAmount,
            this.currentCompany.CurrencyMasterSid,
          ),
          cgstRate: Number(taxPercentages.cgstRate).toFixed(3),
          cgstAmt: this.getFormattedAndPaddedAmount(
            taxAmounts.cgstAmt,
            this.currentCompany.CurrencyMasterSid,
          ),
          sgstRate: Number(taxPercentages.sgstRate).toFixed(3),
          sgstAmt: this.getFormattedAndPaddedAmount(
            taxAmounts.sgstAmt,
            this.currentCompany.CurrencyMasterSid,
          ),
          igstRate: Number(taxPercentages.igstRate).toFixed(3),
          igstAmt: this.getFormattedAndPaddedAmount(
            taxAmounts.igstAmt,
            this.currentCompany.CurrencyMasterSid,
          ),
          vatRate: Number(taxPercentages.vatRate).toFixed(3),
          vatAmt: this.getFormattedAndPaddedAmount(
            taxAmounts.vatAmt,
            this.currentCompany.CurrencyMasterSid,
          ),
          LocalAmount: this.getFormattedAndPaddedAmount(
            String(actualLocalAmount),
            this.currentCompany.CurrencyMasterSid,
          ),
          PartyAmount: this.getFormattedAndPaddedAmount(
            String(actualPartyAmount),
            this.creditNoteData?.CurrencyMasterSid,
          ),
        };
      });

    const totalPartyAmount = voucherDetails.reduce((sum, detail) => {
      if (detail.DrCr === 'D') {
        return sum + toNumber(detail.PartyAmount);
      }
      return sum - toNumber(detail.PartyAmount);
    }, 0);

    const amountInWords = this.getAmountInWords(
      totalPartyAmount,
      this.creditNoteData?.CurrencyMasterSid,
    );

    // Get salesman name if not already fetched
    if (!this.salesmanFetched) {
      await this.fetchSalesmanName(
        isHouseJobInvoice
          ? this.creditNoteData?.houseJob?.SalesmanSid
          : isBookingInvoice
            ? this.creditNoteData?.BookingHeader?.SalesmanSid
            : '',
      );
    }
    const salesmanName = this.salesmanName || '';

    //  Get Bank Details if not already fetched
    if (!this.isBankFetched) {
      await this.getAndStoreBankDetails();
    }
    const bankDetails = this.bankDetails ?? [];

    // Get Terms and Conditions if not already fetched
    if (!this.TandCFetched) {
      await this.getAndStoreTandC();
    }
    const tandc = this.TandCList || [];


    this.creditNotePrintData = {
      invoiceTitle: 'CREDIT NOTE',
      GSTCode: this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT ||'',
      BilledTo: this.creditNoteData?.PartyName || this.creditNoteData?.subledgerMaster?.SubledgerName ||'',
      BillingAddress: this.creditNoteData?.PartyAddress || this.creditNoteData?.subledgerMaster?.Address ||'',
      PAN: this.currentCompany?.Pan || this.currentCompany?.PAN || '',
      CreditNo: this.creditNoteData?.VoucherNumber || '',
      CreditDate: this.creditNoteData?.VoucherDate || '',
      GST_VAT: this.creditNoteData?.GST_VAT || '',
      IRNNumber: this.creditNoteData?.IRNNumber || '',
      ShipperName: isHouseJobInvoice? this.creditNoteData?.houseJob?.ShipperName: isBookingInvoice? this.creditNoteData?.BookingHeader?.ShipperName: '',
      ConsigneeName: isHouseJobInvoice? this.creditNoteData?.houseJob?.ConsigneeName: isBookingInvoice? this.creditNoteData?.BookingHeader?.ConsigneeName: '',
      Vessel: this.getShipmentFieldValue('VesselName') || '',
      VoyageNo: this.getShipmentFieldValue('VoyageNo') || '',
      POL: this.getShipmentFieldValue('POL') || '',
      PlaceofSupply: this.creditNoteData?.PlaceOfSupply || '',
      FPD: this.getShipmentFieldValue('FPD') || '',
      ETD: this.getShipmentFieldValue('ETD') || '',
      ETA: this.getShipmentFieldValue('ETA') || '',
      HBLNo: this.creditNoteData?.houseJob?.HBLNo || '',
      MBLNo: this.creditNoteData?.masterJob?.MBLNo || '',
      MasterJobNumber: this.creditNoteData?.masterJob?.MasterJobNumber || '',
      MasterJobDate: this.creditNoteData?.masterJob?.MasterJobDate || '',
      CustomerRefNo: this.creditNoteData?.houseJob?.Others?.[0]?.CustomerRefNo || '',
      ContainerType: this.creditNoteData?.masterJob?.containers?.[0]?.ContainerType || '',
      ContainerNumber: this.creditNoteData?.masterJob?.containers?.[0]?.ContainerNumber || '',
      DepartmentMasterSid: this.creditNoteData?.masterJob?.DepartmentMasterSid || '',
      FreightTerms: isHouseJobInvoice
        ? this.creditNoteData?.houseJob?.FreightTerms
        : isBookingInvoice
          ? this.creditNoteData?.BookingHeader?.FreightTerms
          : isMasterJobInvoice
            ? this.creditNoteData?.masterJob?.FreightPPCC
            : '',
      PkgWtVol: isHouseJobInvoice
        ? `${this.creditNoteData?.houseJob?.Cargo?.[0]?.NoOfPackage || '0'} / ${this.creditNoteData?.houseJob?.Cargo?.[0]?.GrossWeight || '0'} / ${this.creditNoteData?.houseJob?.Cargo?.[0]?.Volume || '0'}`
        : isBookingInvoice
          ? `${this.creditNoteData?.BookingHeader?.bookingCargo?.[0]?.NoOfPackage || '0'} / ${this.creditNoteData?.BookingHeader?.bookingCargo?.[0]?.GrossWeight || '0'} / ${this.creditNoteData?.BookingHeader?.bookingCargo?.[0]?.Volume || '0'}`
          : isMasterJobInvoice
            ? `${this.creditNoteData?.masterJob?.NoOfPkg || '0'} / ${this.creditNoteData?.masterJob?.GrossWeight || '0'} / ${this.creditNoteData?.masterJob?.Volume || '0'}`
            : '',
      BookingNumber: isHouseJobInvoice
        ? this.creditNoteData?.houseJob?.BookingNo
        : isBookingInvoice
          ? this.creditNoteData?.BookingHeader?.BookingNo
          : '',
      InvoiceDueDate: this.dueDate,
      CurrExRate: `${this.creditNoteData?.CurrencyCode || ''} / ${this.getFormattedAndPaddedExchangeRate(this.creditNoteData?.ExchangeRate, this.creditNoteData?.CurrencyMasterSid) || ''}`,
      SalesPerson: salesmanName,
      voucherDetails: voucherDetails,
      totalPartyAmount: this.getFormattedAndPaddedAmount(
        totalPartyAmount,
        this.creditNoteData?.CurrencyMasterSid,
      ),
      AmountInWords: amountInWords,
      Remarks: this.creditNoteData?.Remarks,
      BankDetails: bankDetails,
      TermsAndConditions: tandc,

      pkg: isHouseJobInvoice
        ? (this.creditNoteData?.houseJob?.Cargo?.[0]?.NoOfPackage ?? ' ')
        : isBookingInvoice
          ? (this.creditNoteData?.BookingHeader?.bookingCargo?.[0]
              ?.NoOfPackage ?? ' ')
          : isMasterJobInvoice
            ? (this.creditNoteData?.masterJob?.NoOfPkg ?? ' ')
            : ' ',

      grosswt: isHouseJobInvoice
        ? (this.creditNoteData?.houseJob?.Cargo?.[0]?.GrossWeight ?? ' ')
        : isBookingInvoice
          ? (this.creditNoteData?.BookingHeader?.bookingCargo?.[0]
              ?.GrossWeight ?? ' ')
          : isMasterJobInvoice
            ? (this.creditNoteData?.masterJob?.GrossWeight ?? ' ')
            : ' ',

      desc: isHouseJobInvoice
        ? (this.creditNoteData?.houseJob?.Cargo?.[0]?.CommodityDescription ??
          ' ')
        : isBookingInvoice
          ? (this.creditNoteData?.BookingHeader?.bookingCargo?.[0]
              ?.CommodityDescription ?? ' ')
          : isMasterJobInvoice
            ? (this.creditNoteData?.masterJob?.CommodityDescription ?? ' ')
            : ' ',

      ChargeableWeight: isHouseJobInvoice
        ? (this.creditNoteData?.houseJob?.Cargo?.[0]?.ChargeableWeight ?? ' ')
        : isBookingInvoice
          ? (this.creditNoteData?.BookingHeader?.bookingCargo?.[0]
              ?.ChargeableWeight ?? ' ')
          : isMasterJobInvoice
            ? (this.creditNoteData?.masterJob?.ChargeableWeight ?? ' ')
            : ' ',

      cbm: isHouseJobInvoice
        ? (this.creditNoteData?.houseJob?.Cargo?.[0]?.Volume ?? ' ')
        : isBookingInvoice
          ? (this.creditNoteData?.BookingHeader?.bookingCargo?.[0]?.Volume ??
            ' ')
          : isMasterJobInvoice
            ? (this.creditNoteData?.masterJob?.Volume ?? ' ')
            : ' ',
    };
  }

  isSeaDepartment(): boolean {
    const deptSid =
      this.creditNoteData?.masterJob?.DepartmentMasterSid ||
      this.creditNoteData?.BookingHeader?.DepartmentMasterSid;

    if (
      !deptSid ||
      !Array.isArray(this.departmentList) ||
      this.departmentList.length === 0
    ) {
      return false;
    }

    const dept = this.departmentList.find(
      (d) => Number(d.DepartmentMasterSid) === Number(deptSid),
    );

    console.log('Dept SID:', deptSid, 'Found dept:', dept);

    if (!dept?.departmentType) return false;

    return dept.departmentType.toUpperCase().includes('SEA');
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

    const currency = this.creditNoteForm.get('CurrencyCode')?.value;
    const customerBranch = this.creditNoteForm.get('CustomerBranchSid')?.value;

    if (!customerBranch) {
      missingErrors.push('• Please select Customer Branch from the dropdown.');
      this.creditNoteForm.get('CustomerBranchSid')?.markAsTouched();
    }

    if (!currency) {
      missingErrors.push('• Please select Currency from the dropdown.');
      this.creditNoteForm.get('CurrencyCode')?.markAsTouched();
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
    this.creditNoteForm.updateValueAndValidity();
  }

  createDetailGroup(data?: any): FormGroup {
    const autoNarration = this.creditNoteForm.get('Narration')?.getRawValue();
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
          this.creditNoteForm.get('CurrencyMasterSid')?.value ||
          null,
      ],
      CurrencyCode: [
        {
          value:
            data?.CurrencyCode ||
            this.creditNoteForm.get('CurrencyCode')?.value ||
            null,
          disabled: true,
        },
      ],
      Rate: [
        data?.Rate != null ? Number(data.Rate) : 0,
        [
          Validators.required,
          Validators.min(0),
          this.rateCompareValidator.bind(this),
        ],
      ],
      ExchangeRate: [
        {
          value:
            data?.ExchangeRate ||
            this.creditNoteForm.get('ExchangeRate')?.value ||
            1,
          disabled: true,
        },
      ],
      CostRevenue : [
        data?.CostRevenue || (data?.DrCr === 'C' ? 'Cost' : 'Revenue'),
      ],
      Amount: [{ value: data?.Amount || 0, disabled: true }],
      TaxableAmount: [{ value: data?.TaxableAmount || 0, disabled: true }],
      TaxPercentage1: [{ value: data?.TaxPercentage1 || 0, disabled: true }],
      TaxAmount1: [{ value: data?.TaxAmount1 || 0, disabled: true }],
      TaxPercentage2: [{ value: data?.TaxPercentage2 || 0, disabled: true }],
      TaxAmount2: [{ value: data?.TaxAmount2 || 0, disabled: true }],
      LocalAmount: [data?.LocalAmount || 0],
      PartyAmount: [
        data?.PartyAmount || 0,
        [Validators.required, greaterThanZero()],
      ],
      MasterJobSid: [{ value: data?.MasterJobSid || null, disabled: true }],
      HouseJobSid: [{ value: data?.HouseJobSid || null, disabled: true }],
      DepartmentMasterSid: [
        { value: data?.DepartmentMasterSid || null, disabled: true },
      ],
      LedgerMasterSid: [data?.LedgerMasterSid || null],
      COAMasterSid: [data?.COAMasterSid || null],
      IsAutoGenerated: [data?.IsAutoGenerated === 'Y' || false],
      SourceDetailSid: [data?.SourceDetailSid || null],
      Narration : [data?.Narration || null],
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

    const original = this.originalRateList.get(
      sourceDetailSid,
    ) as rateComparison;
    console.log(this.originalRateList);
    console.log(`original amount for source : ${sourceDetailSid}`, original);
    console.log(`current amount for source : ${sourceDetailSid}`, rate);
    console.log('result', toNumber(rate) > original.Rate);
    if (!original) return null;

    if (toNumber(rate) > original.Rate) {
      return { rateExceeded: true };
    }

    return null;
  }

  removeDetailRow(index: number) {
    if (this.details.length > index) this.details.removeAt(index);
    this.creditNoteForm.updateValueAndValidity();
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
      // this.onCOAChange({ COAMasterSid: selectedCharge?.DrCOAMappedId }, index);
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
    const hssacListItems = this.hssacList[index] || [];
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
    this.creditNoteForm.updateValueAndValidity();
  }

  updateBillAmount() {
    const headerCurrency = this.creditNoteForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    const totalBillAmount =
      toNumber(this.getPartyCurrCreditAmt()) -
      toNumber(this.getPartyCurrDebitAmt());
    this.creditNoteForm
      .get('BillAmt')
      ?.setValue(this.getFormattedAmount(totalBillAmount, headerCurrency));
  }

  calculateTotalBillAmount(): number {
    const partyId = this.creditNoteForm.get('PartyMasterSid')?.getRawValue();
    return this.details
      .getRawValue()
      .filter((det) => det.LedgerMasterSid !== partyId)
      .reduce((sum, row: any) => {
        if (row.DrCr === 'D') {
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
          this.creditNoteForm.get('ExchangeRate')?.value || 1,
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
     return this.round(total);
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


  // Calculate total tax amount (CGST + SGST + IGST)
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
      this.currentCompany.CurrencyMasterSid,
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
      const voucherDate = new Date(this.creditNoteForm.getRawValue().VoucherDate);
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

    const raw = this.creditNoteForm.getRawValue();

    const autoPostingButNoPosted = this.isAutoPosting && !this.isPosted;
    if (this.isEditMode && autoPostingButNoPosted) {
      this.appSettingService.showWarning(
        'Auto Posting is currently enabled.\n\nPlease switch to Manual Posting and post this vendor invoice first.\nAfter posting, you can switch back to Auto Posting.',
      );
      if (resolve) resolve(false);
      return;
    }

    // Zero Rated guard: every row must have a zero-rated HSSAC applied
    if (this.creditNoteForm.get('InvoiceType')?.value === 'NONGST') {
      const failedRows: string[] = [];
      for (let i = 0; i < this.details.length; i++) {
        const hssacSid = this.details.at(i).getRawValue().HSSACMasterSid;
        const hssac = (this.hssacList[i] || []).find((h: any) => h.HSSACMasterSid === hssacSid);
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

    const partyAmountErrors = this.getPartyAmountValidationErrors();
    if (partyAmountErrors.length > 0) {
      this.appSettingService.showWarning(partyAmountErrors.join('\n'));
      this.details.markAllAsTouched();
      if (resolve) resolve(false);
      return;
    }

    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.creditNoteForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    const actualLocalAmount = toNumber(this.getTotalLocalDebits()) + toNumber(this.getTotalTaxAmount()) - toNumber(this.getTotalLocalCredits());
    const headerCurrency = this.creditNoteForm.get('CurrencyMasterSid')?.getRawValue();
    const headerExRate = this.creditNoteForm.get('ExchangeRate')?.getRawValue();
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
      const totalMatchedLocalAmount = toNumber(this.getTotalLocalDebits()) - toNumber(this.getTotalLocalCredits());
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
    if (this.creditNoteForm.errors) {
      const hasExchangeRateError =
        this.creditNoteForm.errors['inconsistentExchangeRates'] ||
        this.creditNoteForm.errors['foreignCurrencyRateOne'] ||
        this.creditNoteForm.errors['exchangeRateZero'];

      if (hasExchangeRateError) {
        const errorMsg = getExchangeRateErrorMessage(
          this.creditNoteForm,
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
          `Row ${index + 1}: Rate should not exceed ${toNumber(original.Rate).toFixed(2)}`,
        );
      }
    });

    if (rateErrorMessages.length > 0) {
      this.appSettingService.showWarning(rateErrorMessages.join('\n'));
      this.details.markAllAsTouched();
      if (resolve) resolve(false);
      return;
    }

    if (this.creditNoteForm.invalid) {
      errorLoggerWithToastr(
        this.creditNoteForm,
        this.toastr,
        this.getCreditNoteConfig,
      );
      this.creditNoteForm.markAllAsTouched();
      this.creditNoteForm.updateValueAndValidity();
      // this.appSettingService.showWarning('Please fill all required fields.');
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
        .updateCreditNoteById(this.headerId, payload)
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
              this.loadCreditNoteById(this.headerId);
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
      this.operationService.createCreditNote(payload).subscribe({
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
              this.router.navigate([
                'operation/credit-note/entry',
                this.headerId,
              ]);
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
    if (this.isSaving) return;
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
      const currentFinancialYear = toNumber(
        localStorage.getItem('current-year-id'),
      );

      const currentCompanyCountry = toNumber(
        this.currentCompany?.CountryMasterSid,
      );
      const currentCurrency = toNumber(this.currentCompany?.CurrencyMasterSid);
      const interOrIntra = this.taxCalculationService.context?.taxCategory || 'Inter';

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
        current_date: getDefaultTodayDate(),
        TaxDetails: {
          CountryMasterSid: currentCompanyCountry,
          countryCode: this.currentCompanyCountryCode,
          TaxCategory: interOrIntra,
          EffectiveFrom:
            this.creditNoteForm.get('VoucherDate')?.getRawValue() ??
            new Date().toISOString(),
          TaxType: 'Output',
          IsUnionTerritory: this.taxCalculationService.context?.appliedTaxMode === 'CGST_UGST',
          CustomerGstType: this.taxCalculationService.context?.party?.customerGstType || '',
        },
      };

      const result = await firstValueFrom(
        this.operationService.postVoucherByVoucherSid(postPayload),
      );
      this.isSaving = false;
      if (result.status) {
        this.appSettingService.showSuccess(result.message);
        if (notFromSubmit) {
          this.loadCreditNoteById(this.headerId);
        }
      } else {
        this.spinner.hide();
        this.appSettingService.showError(result.message);
      }
    } catch (error) {
      console.error('Post voucher error:', error);
      this.isSaving = false;
      this.spinner.hide();
      return null;
    }
  }

  get isPosted(): boolean {
    return this.creditNoteData?.PostStatus === 'P' || false;
  }

  get isReadOnly(): boolean {
    if(!this.isEditMode) return false;
    return this.creditNoteData?.PostStatus !== 'U' || this.creditNoteData?.Status !== 'A';
  }

  // Check if voucher is draft
  get isDraft(): boolean {
    return (
      !this.creditNoteData?.PostStatus ||
      this.creditNoteData?.PostStatus === 'U'
    );
  }

  onReset() {
    this.minVoucherDate = null;
    this.invoiceOutstandingAmount = null;
    if (this.isEditMode) {
      this.patchValues(this.creditNoteData);
    } else {
      this.initForm();
      this.details.clear();
    }
  }

  goBack() {
    this.router.navigate(['operation/credit-note/list']);
  }

  private getCustomerCountryCode(vendor: any): string {
    return (
      String(vendor?.countryMaster?.countryCode).trim().toLowerCase() || ''
    );
  }

  preparePayload(): any {
    const formValue = this.creditNoteForm.getRawValue();
    const YearMasterSid = Number(localStorage.getItem('current-year-id'));

    const headerNarration = formValue.Narration;
    // Add details with CostRevenueChargesSid and job IDs

    const allDetails = formValue.voucherDetails || [];
    const voucherDetailArray = allDetails.map((detail: any, index: number) => {
      let finalRate = toNumber(detail.Rate);
      let finalAmount = toNumber(detail.Amount);
      let finalTaxableAmount = toNumber(detail.TaxableAmount);
      let finalTaxAmount1 = toNumber(detail.TaxAmount1);
      let finalTaxAmount2 = toNumber(detail.TaxAmount2);
      let finalLocalAmount = toNumber(detail.LocalAmount);
      let finalPartyAmount = toNumber(detail.PartyAmount);
      if (detail.SourceDetailSid) {
        const originalRateComparison: rateComparison =
          this.originalRateList.get(detail.SourceDetailSid);
        if (
          originalRateComparison &&
          finalRate === originalRateComparison.Rate
        ) {
          finalAmount =
            Math.abs(originalRateComparison.Amount - finalAmount) <= 0.01
              ? originalRateComparison.Amount
              : finalAmount;
          finalTaxableAmount =
            Math.abs(
              originalRateComparison.TaxableAmount - finalTaxableAmount,
            ) <= 0.01
              ? originalRateComparison.TaxableAmount
              : finalTaxableAmount;
          finalTaxAmount1 =
            Math.abs(originalRateComparison.TaxAmount1 - finalTaxAmount1) <=
            0.01
              ? originalRateComparison.TaxAmount1
              : finalTaxAmount1;
          finalTaxAmount2 =
            Math.abs(originalRateComparison.TaxAmount2 - finalTaxAmount2) <=
            0.01
              ? originalRateComparison.TaxAmount2
              : finalTaxAmount2;
          finalLocalAmount =
            Math.abs(originalRateComparison.LocalAmount - finalLocalAmount) <=
            0.01
              ? originalRateComparison.LocalAmount
              : finalLocalAmount;
          finalPartyAmount =
            Math.abs(originalRateComparison.PartyAmount - finalPartyAmount) <=
            0.01
              ? originalRateComparison.PartyAmount
              : finalPartyAmount;
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
        CostRevenue:
          detail.CostRevenue || (detail.DrCr === 'D' ? 'Revenue' : 'Cost'),
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
        Narration: headerNarration,
        BookingRatesSid : detail.BookingRatesSid,
        CostRevenueChargesSid: detail.CostRevenueChargesSid || null,
        SourceDetailSid: detail.SourceDetailSid || null,
      };
    });

    const fullyMatched = Array.from(this.originalRateList.entries()).every(
      ([sourceDetailSid, original]) => {
        console.log('--- Checking SourceDetailSid:', sourceDetailSid);
        console.log('Original value:', original);

        const found = voucherDetailArray.find(
          (d) => d.SourceDetailSid === sourceDetailSid,
        );

        if (!found) {
          const partyAmountCheck = Math.abs(original.PartyAmount) <= 0.01;

          console.log(
            'No matching voucher detail found.',
            'PartyAmount:',
            original.PartyAmount,
            'Within tolerance:',
            partyAmountCheck,
          );

          return partyAmountCheck;
        }

        console.log('Found voucher detail:', found);

        const rateMatched = Math.abs(original.Rate - found.Rate) <= 0.0001;

        const partyAmountMatched =
          Math.abs(original.PartyAmount - found.PartyAmount) <= 0.01;

        console.log('Rate comparison:', {
          originalRate: original.Rate,
          foundRate: found.Rate,
          rateMatched,
        });

        console.log('PartyAmount comparison:', {
          originalPartyAmount: original.PartyAmount,
          foundPartyAmount: found.PartyAmount,
          partyAmountMatched,
        });

        return rateMatched && partyAmountMatched;
      },
    );

    console.log('Final fullyMatched result:', fullyMatched);

    const totalBillAmount =
      toNumber(this.getPartyCurrDebitAmt()) -
      toNumber(this.getPartyCurrCreditAmt());
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
      Status: String(formValue.Status || 'A').charAt(0),
      YearMasterSid: YearMasterSid,

      BillNo: formValue.BillNo,
      BillDate: formValue.BillDate ? new Date(formValue.BillDate) : null,
      BillAmt: totalBillAmount,
      MBLNo: formValue.MBLNo,
      HBLNo: formValue.HBLNo,
      CreditNoteReason: formValue.CreditNoteReason,
      ReversalVoucher: formValue.ReversalVoucher,
      Salesman : formValue.Salesman,

      VoucherDetail:
        voucherDetailArray.length > 0 ? voucherDetailArray : undefined,
      IsFullyReversed: fullyMatched,
      current_date: getDefaultTodayDate(),
    };

    //Posting infomations
    const currentCurrency = toNumber(this.currentCompany?.CurrencyMasterSid);
    const currentCompanyCountry = toNumber(
      this.currentCompany?.CountryMasterSid,
    );
    const interOrIntra = this.taxCalculationService.context?.taxCategory || 'Inter';

    payload.PostingInfo = {
      LocalCurrencyMasterSid: currentCurrency,
      LocalCurrencyCode: this.currentCompanyCurrency.code,
      TaxDetails: {
        CountryMasterSid: currentCompanyCountry,
        countryCode: this.currentCompanyCountryCode,
        TaxCategory: interOrIntra,
        EffectiveFrom:
          this.creditNoteForm.get('VoucherDate')?.getRawValue() ??
          new Date().toISOString(),
        TaxType: 'Output',
        IsUnionTerritory: this.taxCalculationService.context?.appliedTaxMode === 'CGST_UGST',
      },
    };

    // Add others
    payload.VoucherOthers = {
      ...formValue.voucherOthers,
      Remarks: formValue.Remarks || '',
    };

    return payload;
  }

  getPartyAmount(detailIndex: number) {
    const detail = (this.details.at(detailIndex) as FormGroup)?.getRawValue();
    const voucherHeaderCurrency = this.creditNoteForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    const voucherHeaderExRate = this.creditNoteForm
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
    const formattedAmount = this.currencyFormatter.formatAmount(input, false);
    const digitForPadding = this.getAmountDecimalPlaces(CurrencyMasterSid);
    return Number(formattedAmount).toFixed(digitForPadding);
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
      this.creditNoteForm.get('VoucherDate')?.getRawValue() ?? new Date();
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
    const headerCurrency = this.creditNoteForm
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
    const headerCurrency = this.creditNoteForm
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

  async sendManualMail(): Promise<void> {
    const pdfBlob = await this.generatePDFBlob();
    let attachmentFile: File | undefined;
    if (pdfBlob) {
      attachmentFile = new File([pdfBlob], (this.creditNoteData?.CreditNoteNo || 'CreditNote') + '.pdf', { type: 'application/pdf' });
    }
    this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid: Number(sessionStorage.getItem('currentMenuId')),
      action: 'UPDATE',
      attachmentFile,
      context: {
        userName: this.userData?.userName,
        toEmail: ''
      }
    });
  }

  onCancel() {
    this.router.navigate(['/operation/credit-note/list']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.creditNoteForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  setToday(fieldName: string, datepicker: any): void {
    const today = new Date();
    this.creditNoteForm.get(fieldName)?.setValue(today);
    datepicker.close();
  }

  // Add this new method to fetch exchange rate
  private fetchExchangeRate(
    fromCurrencyCode: string,
    toCurrencyCode: string,
  ): void {
    const voucherDate =
      this.creditNoteForm.get('VoucherDate')?.getRawValue() ?? new Date();
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
      this.creditNoteForm.patchValue({
        CurrencyMasterSid: fromCurrencyId,
        CurrencyCode: fromCurrencyCode,
        ExchangeRate: this.getFormattedExchangeRate(1, fromCurrencyId),
      });
      this.creditNoteForm.get('ExchangeRate')?.disable();
      return;
    }

    this.operationService.getExchangeRate(payload).subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          if (resp.data) {
            const exchangeRate = Number(resp.data);
            this.creditNoteForm.patchValue({
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
            this.creditNoteForm.patchValue({
              CurrencyMasterSid: fromCurrencyId,
              CurrencyCode: fromCurrencyCode,
              ExchangeRate: toNumber(
                this.getFormattedExchangeRate(0, fromCurrencyId),
              ),
            });
          }
          this.creditNoteForm.get('ExchangeRate')?.enable();
          this.recalculateAllRows();
        } else {
          // Response status : false
          this.appSettingService.showError(resp.message);
          this.creditNoteForm.patchValue({
            CurrencyMasterSid: fromCurrencyId,
            CurrencyCode: fromCurrencyCode,
            ExchangeRate: this.getFormattedExchangeRate(0, fromCurrencyId),
          });
          this.creditNoteForm.get('ExchangeRate')?.enable();
        }
      },
      error: (err) => {
        console.error('Error fetching exchange rate:', err);
        // Default to 1 if API fails
        this.creditNoteForm.patchValue({
          CurrencyMasterSid: fromCurrencyId,
          CurrencyCode: fromCurrencyCode,
          ExchangeRate: this.getFormattedExchangeRate(0, fromCurrencyId),
        });
        this.creditNoteForm.get('ExchangeRate')?.enable();
      },
    });
  }

  /**
   * Get tax ledger for charge - VENDOR INVOICE (INPUT TAX)
   */
  // onCOAChange(coa: any, detailIndex: number, resetSubledger: boolean = true) {
  //   const ctrl = this.details.at(detailIndex) as FormGroup;
  //   if (resetSubledger) {
  //     ctrl.get('LedgerMasterSid')?.setValue(null);
  //     ctrl.get('LedgerMasterSid')?.disable();
  //   }
  //   if (!coa) {
  //     this.subledgerListDetail[detailIndex] = [];
  //     return;
  //   }
  //   if (coa.SubledgerName === 'Y') {
  //     ctrl.get('LedgerMasterSid')?.enable();
  //     this.operationService
  //       .getAllSubledgerByCOA({
  //         CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
  //         COAMasterSid: coa.COAMasterSid,
  //       })
  //       .subscribe({
  //         next: (resp: any) => {
  //           if (resp.status) {
  //             this.subledgerListDetail[detailIndex] = resp.data || [];
  //           } else {
  //             this.appSettingService.showError(
  //               'Error fetching subledger for COA',
  //             );
  //           }
  //         },
  //         error: (err) => {
  //           this.subledgerListDetail[detailIndex] = [];
  //           ctrl.get('LedgerMasterSid')?.setValue(null);
  //           ctrl.get('LedgerMasterSid')?.disable();
  //           console.error('Error fetching subledger for COA', err);
  //         },
  //       });
  //   } else {
  //     ctrl.get('LedgerMasterSid')?.disable();
  //   }
  // }

  private getCustomerCountry(): string {
    const customer = this.customerList.find(
      (c) =>
        c.SubledgerMasterSid ===
        this.creditNoteForm.get('PartyMasterSid')?.value,
    );
    return customer?.countryMaster?.countryCode || '';
  }

  openEDoc() {
    if (!this.creditNoteData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.creditNoteData;
    modalRef.componentInstance.idLabel = 'Vendor Credit Note Id';
    modalRef.componentInstance.idValue = this.creditNoteData?.headerId;
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: this.headerId,
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
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.headerId;
  }

  async getAndStoreTandC(): Promise<void> {
    try {
      const companyMasterSid = this.currentCompany?.CompanyMasterSid;
      const menuMasterSid = this.currentMenuId;
      const documentSid = this.creditNoteData?.VoucherHeaderSid;

      const payload = {
        CompanyMasterSid: companyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        MenuMasterSid: menuMasterSid,
        DocumentSid: documentSid,
      };

      const transactionPayload = {
        CompanyMasterSid: companyMasterSid,
        MenuMasterSid: menuMasterSid,
        DocumentSid: documentSid
      };

      const getTermText = (item: any): string =>
        String(item?.Terms || item?.TandC || '').trim().toLowerCase();

      const isSameTerm = (a: any, b: any): boolean =>
        (
          a?.TandCTransactionSid &&
          b?.TandCTransactionSid &&
          a.TandCTransactionSid === b.TandCTransactionSid
        ) ||
        (
          getTermText(a) === getTermText(b) &&
          (a?.DocumentSid ?? documentSid ?? null) ===
          (b?.DocumentSid ?? documentSid ?? null)
        );

      const result: any = await firstValueFrom(
        this.isTermsAndConditionsEnabled
          ? forkJoin({
              tandc: this.masterService.getTandC(transactionPayload),
              defaults: this.masterService.getTandCByCondition(payload)
            })
          : this.masterService.getTandC(transactionPayload).pipe(
              map((tandc: any) => ({ tandc, defaults: null }))
            )
      );

      this.TandCFetched = true;
      const tandcData = result?.tandc?.status && Array.isArray(result?.tandc?.data)
        ? result.tandc.data
        : [];
      const defaultData = this.isTermsAndConditionsEnabled &&
        result?.defaults?.status &&
        Array.isArray(result?.defaults?.data)
          ? result.defaults.data
          : [];

      this.TandCList = [...tandcData, ...defaultData].filter(
        (item: any, index: number, arr: any[]) =>
          index === arr.findIndex((x: any) => isSameTerm(x, item))
      );
    } catch (error) {
      console.error(error);
      this.TandCFetched = true;
      this.TandCList = [];
    }
  }

  getTandC(): Observable<any> {
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
      DocumentSid: this.creditNoteData?.VoucherHeaderSid,
    });
  }

  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    const payload = { 
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.creditNoteData?.VoucherHeaderSid
     };
     const transactionPayload = {
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    MenuMasterSid: this.currentMenuId,
    DocumentSid: this.creditNoteData?.VoucherHeaderSid
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
      (a?.DocumentSid ?? this.creditNoteData?.VoucherHeaderSid ?? null) ===
      (b?.DocumentSid ?? this.creditNoteData?.VoucherHeaderSid ?? null)
    );
     const openModal = (terms: any[]) => {
      const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true,
          });
          modalRef.componentInstance.terms = terms || [];
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.creditNoteData?.VoucherHeaderSid;
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
    if (!this.creditNoteData) return;

    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });

    modalRef.componentInstance.item = this.creditNoteData;
    modalRef.componentInstance.idLabel = 'Vendor Credit Note Id';
    modalRef.componentInstance.idValue = this.creditNoteData?.VoucherHeaderSid;
  }

  openFollowup() {}

  /**
   * Determine tax category based on company state and place of supply
   */
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

  fetchSalesmanName(UserMasterSid: number) {
    if (!UserMasterSid || UserMasterSid === undefined) return;
    this.masterService.getFfUserById(UserMasterSid).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.salesmanName = resp.data?.userName;
        }
      },
      error: (error) => {
        console.error('Error fetching salesman name:', error);
      },
    });
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
    }

    if (mode === 'CGST_UGST') {
      return {
        cgstAmt: detail.TaxAmount1 || 0,
        sgstAmt: 0,
        ugstAmt: detail.TaxAmount2 || 0,
        igstAmt: 0,
        vatAmt: 0,
      };
    }

    if (mode === 'IGST') {
      return {
        cgstAmt: 0,
        sgstAmt: 0,
        ugstAmt: 0,
        igstAmt: detail.TaxAmount1 || 0,
        vatAmt: 0,
      };
    }

    if (mode === 'VAT') {
      return {
        cgstAmt: 0,
        sgstAmt: 0,
        ugstAmt: 0,
        igstAmt: 0,
        vatAmt: detail.TaxAmount1 || 0,
      };
    }

    return {
      cgstAmt: toNumber(detail.TaxAmount1) || 0,
      sgstAmt: toNumber(detail.TaxAmount2) || 0,
      ugstAmt: 0,
      igstAmt: 0,
      vatAmt: toNumber(detail.TaxAmount1) || 0,
    };
  }

  shouldShowGSTTypeField(): boolean {
    return this.currentCompanyCountryCode === 'in';
  }

  shouldShowForeignCurrencyColumn(): boolean {
    return (
      this.creditNoteData?.CurrencyCode !== this.currentCompanyCurrency?.code
    );
  }

  /**
   * Get shipment field value based on priority: HouseJob > MasterJob > BookingHeader
   * Note: MasterJob only has POL and FPD directly. VesselName, VoyageNo, ETD, ETA
   * are in MasterJobVoyage (not included in API), so these fall back to bookingHeader.
   */
  getShipmentFieldValue(
    fieldName: 'VesselName' | 'VoyageNo' | 'POL' | 'FPD' | 'ETD' | 'ETA',
  ): any {
    const hasHouseJob = !!this.creditNoteData?.HouseJobSid;
    const hasMasterJob = !!this.creditNoteData?.MasterJobSid;
    const hasBookingHeader = !!this.creditNoteData?.BookingHeaderSid;

    // Priority 1: HouseJob (if HouseJobSid exists)
    if (hasHouseJob && this.creditNoteData?.houseJob) {
      const value = (this.creditNoteData.houseJob as any)[fieldName];
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }

    // Priority 2: MasterJob (if only MasterJobSid exists, no HouseJobSid)
    // Only POL and FPD are directly available on masterJob
    if (!hasHouseJob && hasMasterJob && this.creditNoteData?.masterJob) {
      if (fieldName === 'POL' || fieldName === 'FPD') {
        const value = (this.creditNoteData.masterJob as any)[fieldName];
        if (value !== null && value !== undefined && value !== '') {
          return value;
        }
      } else {
        if (this.creditNoteData.masterJob.voyages) {
          const voyage = (this.creditNoteData.masterJob.voyages?.[0] as any)[
            fieldName
          ];
          if (voyage !== null && voyage !== undefined && voyage !== '') {
            return voyage;
          }
        }
      }
      // VesselName, VoyageNo, ETD, ETA are in MasterJobVoyage - fall through to bookingHeader
    }

    // Priority 3: BookingHeader (fallback)
    if (hasBookingHeader && this.creditNoteData?.BookingHeader) {
      return (this.creditNoteData.BookingHeader as any)[fieldName] || null;
    }

    return null;
  }

  calculateTotalColspan(): number {
    const config = this.getTaxDisplayConfig();
    let baseColumns =
      this.currentCompanyCountryCode?.toLowerCase() === 'ae' ? 7 : 8; // S.No, Particulars, HSN/SAC(if shown), Curr, No of Unit, Rate, ROE, Taxable Value

    // Add tax columns based on what's visible
    if (config.showCGST) baseColumns += 2; // CGST % + CGST Amt
    if (config.showSGST) baseColumns += 2; // SGST % + SGST Amt
    if (config.showUGST) baseColumns += 2; // UGST % + UGST Amt
    if (config.showIGST) baseColumns += 2; // IGST % + IGST Amt
    if (config.showVAT) baseColumns += 2; // VAT % + VAT Amt

    return baseColumns;
  }

  shouldShowVatAmountTotals(configOverride?: {
    showVAT: boolean;
  }): boolean {
    const config = configOverride ?? this.getTaxDisplayConfig();
    return (
      this.currentCompanyCountryCode?.toLowerCase() === 'ae' &&
      !!config?.showVAT
    );
  }

  shouldShowDetailedTaxAmountTotals(configOverride?: {
    showVAT: boolean;
  }): boolean {
    return this.shouldShowVatAmountTotals(configOverride);
  }

  getCreditNotePrintAmountTotal(fieldName: 'vatAmt' | 'LocalAmount'): string {
    const total = (this.creditNotePrintData?.voucherDetails || []).reduce(
      (sum: number, detail: any) => sum + toNumber(detail?.[fieldName]),
      0,
    );

    return this.getFormattedAndPaddedAmount(
      total,
      this.currentCompany.CurrencyMasterSid,
    );
  }

  calculateBaseCreditNotePrintColspan(): number {
    let baseColumns = 7; // S.No, Particulars, Curr, No. of Unit, Rate, ROE, Taxable Amt

    if (this.currentCompanyCountryCode?.toLowerCase() !== 'ae') {
      baseColumns += 1; // HSN/SAC
    }

    return baseColumns;
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

  private getPartyAmountValidationErrors(): string[] {
    const errors: string[] = [];

    this.details.controls.forEach((row, index) => {
      const partyAmountControl = row.get('PartyAmount');
      partyAmountControl?.updateValueAndValidity({ onlySelf: true });

      if (
        partyAmountControl?.hasError('required') ||
        partyAmountControl?.hasError('greaterThanZero')
      ) {
        errors.push(`Row ${index + 1}: Party Amount must be greater than zero.`);
      }
    });

    return errors;
  }

  showInfo() {
    if (!this.creditNoteData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.creditNoteData;
    modalRef.componentInstance.idLabel = 'Credit Note Id';
    modalRef.componentInstance.idValue = this.creditNoteData?.VoucherHeaderSid;
  }

  // onFinalSave() {
  //   console.log('DEBUG - onFinalSave called');

  //   if (this.creditNoteForm.invalid) {
  //     this.creditNoteForm.markAllAsTouched();
  //     this.appSettingService.showWarning('Please fill required credit note fields.');
  //     return;
  //   }

  //   if (this.details.length === 0) {
  //     this.appSettingService.showWarning('Please add at least one charge line.');
  //     return;
  //   }

  //   this.recalculateAllRows();

  //   console.log('DEBUG - Calling saveCreditNote with isFinal: true');

  //   // First save the invoice, then post it
  //   this.saveCreditNote(true); // true indicates final save
  // }

  // private saveCreditNote(isFinal: boolean) {
  //   const raw = this.creditNoteForm.getRawValue();

  //   const userEmailFromSettings = (this.appSettingService as any).userSettingSource?.value?.['userEmail'] || null;
  //   const createdByValue = userEmailFromSettings || this.currUserEmail || null;
  //   const updatedByValue = this.isEditMode ? (userEmailFromSettings || this.currUserEmail || null) : null;

  //   // Add PostStatus to payload
  //   const postStatus = isFinal ? 'P' : 'D'; // 'P' for Posted, 'D' for Draft

  //   let voucherDate: Date;
  //   if (!raw.VoucherDate) {
  //     voucherDate = new Date();
  //   } else if ((raw.VoucherDate as NgbDateStructLike).year) {
  //     const converted = this.fromNgbDate(raw.VoucherDate as NgbDateStructLike);
  //     voucherDate = converted ?? new Date();
  //   } else {
  //     const parsed = new Date(raw.VoucherDate);
  //     voucherDate = isNaN(parsed.getTime()) ? new Date() : parsed;
  //   }

  //   const normalizedParty = this.normalizeParty(raw);
  //   const currencyMasterId = this.getCurrencyId(raw.CurrencyCode);
  //   const masterJobSid = raw.MasterJobSid ? Number(raw.MasterJobSid) : null;

  //   const rawPartyControl = this.creditNoteForm.get('PartyMasterSid')?.value;
  //   const partyMasterSid = rawPartyControl != null && rawPartyControl !== ''
  //     ? Number(rawPartyControl)
  //     : (normalizedParty.PartyMasterSid != null ? Number(normalizedParty.PartyMasterSid) : null);

  //   const voucherDetailArray = (raw.voucherDetails || []).map((d: any, index: number) => {
  //     const partyAmount = this.getPartyAmount(d);
  //     const detail = {
  //       VoucherDetailSid: d.VoucherDetailSid,
  //       SourceDetailSid: d.SourceDetailSid || null,
  //       ChargeMasterSid: d.ChargeMasterSid != null ? Number(d.ChargeMasterSid) : null,
  //       ChargeDescription: d.ChargeDescription || '',
  //       LedgerMasterSid: d.LedgerMasterSid != null ? Number(d.LedgerMasterSid) : null,
  //       COAMasterSid : d.COAMasterSid != null ? Number(d.COAMasterSid) : null,
  //       HSSACMasterSid: d.HSSACMasterSid != null ? Number(d.HSSACMasterSid) : null,
  //       ChargeUOMSid: d.ChargeUOMSid != null ? Number(d.ChargeUOMSid) : null,
  //       DepartmentMasterSid: d.DepartmentMasterSid != null ? Number(d.DepartmentMasterSid) : null,
  //       NumberOfUnit: d.NumberOfUnit != null ? Number(d.NumberOfUnit) : 0,
  //       DrCr: d.DrCr || 'D',
  //       CurrencyCode: d.CurrencyCode || raw.CurrencyCode,
  //       CurrencyMasterSid: this.getCurrencyId(d.CurrencyCode || raw.CurrencyCode),
  //       Rate: d.Rate != null ? Number(d.Rate) : 0,
  //       ExchangeRate: d.ExchangeRate != null ? Number(d.ExchangeRate) : (raw.ExchangeRate != null ? Number(raw.ExchangeRate) : 1),
  //       Amount: d.Amount != null ? Number(d.Amount) : 0,
  //       TaxableAmount: d.TaxableAmount != null ? Number(d.TaxableAmount) : (d.Amount != null ? Number(d.Amount) : 0),
  //       TaxPercentage1: d.TaxPercentage1 != null ? Number(d.TaxPercentage1) : 0,
  //       TaxAmount1: d.TaxAmount1 != null ? Number(d.TaxAmount1) : 0,
  //       TaxPercentage2: d.TaxPercentage2 != null ? Number(d.TaxPercentage2) : 0,
  //       TaxAmount2: d.TaxAmount2 != null ? Number(d.TaxAmount2) : 0,
  //       LocalAmount: d.LocalAmount != null ? Number(d.LocalAmount) : 0,
  //       PartyAmount: partyAmount,
  //       MasterJobSid: d.MasterJobSid ? Number(d.MasterJobSid) : masterJobSid,
  //       HouseJobSid: d.HouseJobSid ? Number(d.HouseJobSid) : null
  //     };
  //     return detail;
  //   });

  //   const rawVoucherOthers = raw.voucherOthers ? { ...raw.voucherOthers } : null;
  //   if (rawVoucherOthers && rawVoucherOthers.DueDate && (rawVoucherOthers.DueDate as NgbDateStructLike).year) {
  //     rawVoucherOthers.DueDate = this.fromNgbDate(rawVoucherOthers.DueDate as NgbDateStructLike);
  //   }

  //   const voucherOthersCandidate = this.buildVoucherOthersPayload(rawVoucherOthers);

  //   const payload: any = {
  //     ...(this.isEditMode ? { UpdatedBy: updatedByValue } : { CreatedBy: createdByValue }),
  //     CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
  //     BranchMasterSid: this.currentBranch?.BranchMasterSid,
  //     VoucherNumber: raw.VoucherNumber || null,
  //     VoucherDate: raw.VoucherDate,
  //     PostDate: raw.PostDate,
  //     GST_VAT: raw.GST_VAT || undefined,
  //     PartyMasterSid: partyMasterSid,
  //     PartyName: normalizedParty.PartyName || String(raw.PartyName || ''),
  //     PartyAddress: normalizedParty.PartyAddress || raw.PartyAddress || '',
  //     CustomerBranchSid: normalizedParty.CustomerBranchSid ?? null,
  //     PlaceOfSupply: raw.PlaceOfSupply || '',
  //     COAMasterSid: raw.COAMasterSid ?? 1,
  //     InvoiceType: raw.InvoiceType || 'REG',
  //     GSTType: raw.GSTType || '',
  //     CurrencyMasterSid: currencyMasterId,
  //     PostStatus: raw.PostStatus || '',
  //     CurrencyCode: raw.CurrencyCode || undefined,
  //     ExchangeRate: raw.ExchangeRate != null ? Number(raw.ExchangeRate) : undefined,
  //     MasterJobSid: masterJobSid,
  //     HouseJobSid: raw.HouseJobSid ? Number(raw.HouseJobSid) : null,
  //     State : raw.State || "",
  //     DepartmentMasterSid : raw.DepartmentMasterSid || null,
  //     BookingHeaderSid: raw.BookingHeaderSid || null,
  //     MasterNumber : raw.MasterNumber || "",
  //     HouseNumber : raw.HouseNumber || "",
  //     DocumentNumber: raw.DocumentNumber || undefined,
  //     Remarks: raw.Remarks || undefined,
  //     Narration: (raw.Narration !== undefined ? raw.Narration : undefined),
  //     status: (raw.status != null ? raw.status : 'A'),
  //     VoucherDetail: voucherDetailArray.length > 0 ? voucherDetailArray : undefined,
  //   };

  //   if (voucherOthersCandidate) {
  //     payload.VoucherOthers = voucherOthersCandidate;
  //   }

  //   Object.keys(payload).forEach(k => {
  //     if (payload[k] === undefined) delete payload[k];
  //   });

  //   const saveObservable = this.headerId
  //     ? this.operationService.updateCreditNoteById(this.headerId, payload)
  //     : this.operationService.createCreditNote(payload);

  //   this.spinner.show();
  //   saveObservable.subscribe({
  //     next: async (resp: any) => {
  //       if (resp?.status) {
  //         const voucherHeaderSid = resp.data?.newVoucher?.VoucherHeaderSid || resp.data?.VoucherHeaderSid || this.headerId;

  //         if (isFinal && voucherHeaderSid) {
  //           // If final save, post the voucher
  //           await this.postVoucher(voucherHeaderSid);
  //         } else {
  //           this.spinner.hide();
  //           const message = isFinal ? 'CreditNote saved and posted successfully!' : 'CreditNote saved as draft successfully!';
  //           this.appSettingService.showSuccess(message);

  //           if (!this.headerId && voucherHeaderSid) {
  //             this.headerId = voucherHeaderSid;
  //             this.router.navigate(['operation/credit-note/entry', voucherHeaderSid]);
  //           }
  //         }
  //       } else {
  //         this.spinner.hide();
  //         this.appSettingService.showError('Error saving CreditNote.');
  //       }
  //     },
  //     error: (err) => {
  //       this.spinner.hide();
  //       console.error('Save CreditNote error', err);
  //       this.appSettingService.showError('Failed to save CreditNote.');
  //     }
  //   });
  // }

  // private async postVoucher(voucherHeaderSid: number) {
  //   try {
  //     const currentCompany = this.currentCompany;
  //     const currentBranch = this.currentBranch;
  //     const currentFinancialYear = Number(localStorage.getItem('current-year-id'));
  //     const currentCountry =Number(this.currentCompany?.CountryMasterSid);
  //     const currentCountryName = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
  //     const currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
  //     const currentUserEmail =  this.userData?.userEmail;

  //     if (!currentCompany || !currentBranch || !currentFinancialYear || !currentCountry || !currentCurrency) {
  //       throw new Error('Company, branch, or financial year or country information is missing');

  //     }

  //     const postPayload = {
  //       VoucherHeaderSid: voucherHeaderSid,
  //       CompanyMasterSid: currentCompany.CompanyMasterSid,
  //       BranchMasterSid: currentBranch.BranchMasterSid,
  //       YearMasterSid: currentFinancialYear,
  //       LocalCurrencyMasterSid: currentCurrency  ,
  //       LocalCurrencyCode: this.currentCompanyCurrency.code ,
  //       PostedBy: currentUserEmail ,
  //       TaxDetails: {
  //         CountryMasterSid: currentCountry || this.currentUserCountry,
  //         countryCode: String(this.currentCompanyCountry.countryCode).toLowerCase(),
  //         TaxCategory: 'Inter',
  //         EffectiveFrom: new Date().toISOString(),
  //         TaxType: 'Output'
  //       }
  //     };

  //     const result = await firstValueFrom(this.operationService.postVoucherByVoucherSid(postPayload));

  //     this.spinner.hide();
  //     if (result.status) {
  //       this.appSettingService.showSuccess('Credted Note posted successfully!');
  //        this.creditNoteForm.patchValue({
  //   PostStatus: 'P' // Posted status
  // }); // Update local state

  //       // Navigate to list or stay on page but disable edits
  //       this.router.navigate(['operation/credit-note/entry', voucherHeaderSid]);
  //       this.loadCreditNoteById(voucherHeaderSid);
  //     } else {
  //       this.appSettingService.showError(result.message || 'Failed to post Credit Note.');
  //     }
  //   } catch (error) {
  //     this.spinner.hide();
  //     console.error('Post voucher error:', error);
  //     this.appSettingService.showError('Failed to post Credit Note. Please try again.');
  //   }
  // }
  // async loadDepartments(companyMasterSid: number) {
  //     if (!companyMasterSid) {
  //       this.departmentList = [];
  //       return;
  //     }

  //     try {
  //       const departments: any = await firstValueFrom(this.operationService.getAllDepartments(companyMasterSid));

  //       // Handle different response formats
  //       if (departments && Array.isArray(departments)) {
  //         this.departmentList = departments;
  //       } else if (departments?.data && Array.isArray(departments.data)) {
  //         this.departmentList = departments.data;
  //       } else if (departments?.status && Array.isArray(departments.data)) {
  //         this.departmentList = departments.data;
  //       } else {
  //         this.departmentList = departments || [];
  //       }

  //       console.log('DEBUG - Departments loaded:', this.departmentList.length, 'items');
  //       if (this.departmentList.length > 0) {
  //         console.log('DEBUG - First department item:', this.departmentList[0]);
  //       }
  //     } catch (error) {
  //       console.error('Error loading departments:', error);
  //       this.departmentList = [];
  //       throw error;
  //     }
  //   }
  //       async fetchCountryName(countryMasterSid: number) {
  //   try {
  //     const resp: any = await firstValueFrom(this.operationService.getCountryById(countryMasterSid));
  //     if (resp?.status && resp.data) {
  //       const country = resp.data;
  //       const countryName = country.countryName || country.CountryName;
  //       if (countryName) {
  //         this.bookingModeCountry = String(countryName).trim().toLowerCase();
  //         console.log('DEBUG - Fetched country from backend:', this.bookingModeCountry);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error fetching country:', error);
  //     throw error;
  //   }
  // }
  //   onGSTTypeChange() {
  //   console.log('GST Type changed to:', this.creditNoteForm.get('GSTType')?.value);
  //   this.recalculateAllRows();
  // }
  // async loadMasterJobs() {
  //   try {
  //     const companyRaw = localStorage.getItem('selected-company');
  //     const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;

  //     const payload = {
  //       CompanyMasterSid: company?.CompanyMasterSid,
  //       BranchMasterSid: company?.BranchMasterSid,
  //       limit: 200,
  //       offset: 0
  //     };

  //     const resp: any = await firstValueFrom(this.operationService.getAllMasterJobs(payload));
  //     let items: any[] = [];
  //     if (resp?.data && Array.isArray(resp.data)) {
  //       items = resp.data;
  //     } else if (Array.isArray(resp)) {
  //       items = resp;
  //     } else if (resp?.data?.data && Array.isArray(resp.data.data)) {
  //       items = resp.data.data;
  //     }

  //     this.masterJobList = items.map((it: any) => {
  //       const mj = {
  //         ...it,
  //         MasterJobSid: it.MasterJobSid ?? it.masterJobSid ?? it.MasterJobId ?? null,
  //         MasterJobNumber: it.MasterJobNumber ?? it.masterJobNumber ?? it.JobNumber ?? it.JobNo ?? '',
  //         MBLNo: it.MBLNo ?? it.mblNo ?? it.MBL ?? '',
  //         HBLNo: it.HBLNo ?? it.hblNo ?? it.HouseJob ?? '',
  //       };
  //       mj.displayLabel = `${mj.MasterJobNumber || ('#' + (mj.MasterJobSid ?? ''))}`;
  //       return mj;
  //     });
  //   } catch (err) {
  //     console.error('Error loading master jobs', err);
  //     this.masterJobList = [];
  //   }
  // }

  // onBranchChange(selectedBranch: any) {
  //   const branchSid = (typeof selectedBranch === 'object' && selectedBranch !== null)
  //     ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
  //     : selectedBranch;

  //   if (!branchSid) {
  //     // Clear all related fields if no branch selected
  //     this.creditNoteForm.get('PartyAddress')?.setValue('');
  //     this.creditNoteForm.get('CustomerBranchSid')?.setValue(null);
  //     this.creditNoteForm.get('GST_VAT')?.setValue('');
  //     return;
  //   }

  //   // Find the selected branch from customerBranchList
  //   const foundBranch = this.customerBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));

  //   if (foundBranch) {
  //     console.log('DEBUG - Found Branch:', foundBranch);

  //     // Set CustomerBranchSid
  //     this.creditNoteForm.get('CustomerBranchSid')?.setValue(Number(branchSid));

  //     // Set PartyAddress - this will go to Address in payload
  //     const address = foundBranch.Address || foundBranch.CustomerAddress1 || foundBranch.customerAddress || '';
  //     this.creditNoteForm.get('PartyAddress')?.setValue(address);

  //     // IMPORTANT: DO NOT set PartyMasterSid from branch - it should come from customer
  //     // Only set address and GST/VAT information

  //     // Get customer data to get country code and PanType
  //     const customerMasterSid = foundBranch.CustomerMasterSid;
  //     if (customerMasterSid) {
  //       const customer = this.customerList.find(c => c.CustomerMasterSid === customerMasterSid);
  //       if (customer) {
  //         console.log('DEBUG - Found Customer for branch:', customer);

  //         // Get country code from CUSTOMER
  //         const countryCode = this.getCustomerCountryCode(customer);

  //         console.log('DEBUG - Customer CountryCode:', countryCode);
  //         console.log('DEBUG - Branch GSTNo:', foundBranch.GSTNo);

  //         // Use branch GSTNo for India, customer PanType for other countries
  //         if (countryCode === 'IN') {
  //           // For India - populate GST No from BRANCH table
  //           this.creditNoteForm.get('GST_VAT')?.setValue(foundBranch.GSTNo || '');
  //         } else {
  //           // For non-India countries - populate PAN Type from CUSTOMER table
  //           this.creditNoteForm.get('GST_VAT')?.setValue(customer.PanType || '');
  //         }
  //       }
  //     }
  //   } else {
  //     // If branch not found in current list, clear dependent fields
  //     this.creditNoteForm.get('PartyAddress')?.setValue('');
  //     this.creditNoteForm.get('GST_VAT')?.setValue('');
  //   }
  // }
  // // Improved helper method to get country code from branch
  // private getBranchCountryCode(branch: any): string {
  //   console.log('DEBUG - Branch structure for country detection:', branch);

  //   // Check if CountryMasterSid exists and has countryCode
  //   if (branch.CountryMasterSid && typeof branch.CountryMasterSid === 'object') {
  //     const countryCode = branch.CountryMasterSid.countryCode || branch.CountryMasterSid.CountryCode;
  //     if (countryCode) {
  //       console.log('DEBUG - Extracted countryCode from CountryMasterSid object:', countryCode);
  //       return countryCode.toUpperCase();
  //     }
  //   }

  //   // Check if countryCode exists directly on branch
  //   if (branch.countryCode) {
  //     console.log('DEBUG - Found countryCode directly on branch:', branch.countryCode);
  //     return branch.countryCode.toUpperCase();
  //   }

  //   // Check if CountryCode exists directly on branch
  //   if (branch.CountryCode) {
  //     console.log('DEBUG - Found CountryCode directly on branch:', branch.CountryCode);
  //     return branch.CountryCode.toUpperCase();
  //   }

  //   // Final fallback: if branch has GSTNo with value, assume it's India
  //   if (branch.GSTNo && branch.GSTNo.trim() !== '') {
  //     console.log('DEBUG - Fallback: Using GSTNo to determine country as India');
  //     return 'IN';
  //   }

  //   console.log('DEBUG - No country code detected, defaulting to empty string');
  //   return '';
  // }

  // loadCreditNoteById(id: number) {
  //   this.operationService.getCreditNoteById(id).subscribe({
  //     next: (resp: any) => {
  //       if (resp?.status && resp.data) {
  //         this.creditNoteData = resp.data;
  //         this.creditNoteData['MBLNo'] = resp.data?.MasterNumber;
  //         this.creditNoteData['HBLNo'] = resp.data?.HouseNumber;
  //         console.log(this.creditNoteData,"creditNoteData")
  //         this.patchValues(this.creditNoteData);
  //       } else {
  //         this.appSettingService.showError('Error loading creditNoteData');
  //       }
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.appSettingService.showError('Error loading creditNoteData');
  //     },
  //   });
  // }

  //   private toNgbDate(d: any): NgbDateStructLike | null {
  //     if (!d) return null;
  //     const dt = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d instanceof Date ? d : new Date(d);
  //     if (isNaN(dt.getTime())) return null;
  //     return { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() };
  //   }

  //   private fromNgbDate(s: NgbDateStructLike | null): Date | null {
  //     if (!s || !s.year) return null;
  //     return new Date(s.year, (s.month || 1) - 1, s.day || 1);
  //   }

  // getDepartmentName(departmentSid: number): string {
  //     if (!departmentSid || this.departmentList.length === 0) {
  //       return '-';
  //     }
  //     const department = this.departmentList.find(dept =>
  //       dept.DepartmentMasterSid === departmentSid ||
  //       dept.departmentMasterSid === departmentSid
  //     );
  //     return department?.DepartmentName || department?.departmentName || '-';
  //   }

  // onDetailChange(index: number, field?: string) {
  //   if (['NumberOfUnit', 'Rate', 'ExchangeRate', 'TaxPercentage1', 'TaxPercentage2', 'CurrencyCode'].includes(field || '')) {
  //     this.recalcRow(index);
  //   } else if (field === 'ChargeMasterSid') {
  //     const chargeSid = this.details.at(index).get('ChargeMasterSid')?.value;
  //     const selectedCharge = this.chargeList?.find((c: any) => c.ChargeMasterSid === chargeSid);
  //     if (selectedCharge) {
  //       const description = selectedCharge.ChargeDescription || selectedCharge.chargeName || selectedCharge.ChargeName || '';

  //       let hssacId = selectedCharge.HSSACMasterSid ?? selectedCharge.HSSACMasterSid ?? null;
  //       if (!hssacId && Array.isArray(selectedCharge.chargeTaxMaster) && selectedCharge.chargeTaxMaster.length > 0) {
  //         const firstTax = selectedCharge.chargeTaxMaster[0];
  //         hssacId = firstTax?.ChargeTaxMasterSid ?? firstTax?.chargeTaxMasterSid ?? null;
  //       }

  //       const chargeUomId = selectedCharge.ChargeUOMSid ?? selectedCharge.UOM ?? selectedCharge.UOMMasterSid ?? null;
  //       const ledgerMasterSid = selectedCharge.SubledgerMasterSid || null;
  //     const coaMasterSid = selectedCharge.DrCOAMappedId || null;
  //       this.details.at(index).patchValue({
  //         ChargeDescription: description,
  //         HSSACMasterSid: hssacId || null,
  //         ChargeUOMSid: chargeUomId || null,
  //         Rate: selectedCharge.DefaultRate || selectedCharge.Rate || this.details.at(index).get('Rate')?.value || 0,
  //         LedgerMasterSid: ledgerMasterSid,
  //       COAMasterSid: coaMasterSid
  //       });

  //       this.recalcRow(index);
  //     }
  //   }
  // }

  //  private async recalcRow(index: number) {
  //   const row = this.details.at(index);
  //   if (!row) return;

  //   // const headerCurrency = this.creditNoteForm.get('CurrencyCode')?.value;
  //   // if (row.get('CurrencyCode')?.value !== headerCurrency) {
  //   //   row.get('CurrencyCode')?.setValue(headerCurrency);
  //   // }

  //   const unit = Number(row.get('NumberOfUnit')?.value || 0);
  //   const rate = Number(row.get('Rate')?.value || 0);
  //   const exRate = Number(row.get('ExchangeRate')?.value || this.creditNoteForm.get('ExchangeRate')?.value || 1);

  //   // Calculate basic amounts
  //   const amount = unit * rate;
  //   const taxableAmount = amount * exRate;
  //   const localAmount = amount * exRate;

  //   // Get GST Type
  //   const gstType = this.creditNoteForm.get('GSTType')?.value;
  //   const placeOfSupply = this.creditNoteForm.get('PlaceOfSupply')?.value;

  //   console.log('=== RATE CHANGE DEBUG - START ===');
  //   console.log('Row Index:', index);
  //   console.log('Unit:', unit);
  //   console.log('Rate:', rate);
  //   console.log('Exchange Rate:', exRate);
  //   console.log('Amount:', amount);
  //   console.log('Taxable Amount:', taxableAmount);
  //   console.log('GST Type:', gstType);

  //   // Store current tax rates before clearing
  //   const currentTaxPercentage1 = Number(row.get('TaxPercentage1')?.value || 0);
  //   const currentTaxPercentage2 = Number(row.get('TaxPercentage2')?.value || 0);

  //   console.log('Current Tax Rates:', {
  //     taxPercentage1: currentTaxPercentage1,
  //     taxPercentage2: currentTaxPercentage2,
  //   });

  //   // Only fetch new tax rates if charge changed or not already set
  //   let cgstRate = currentTaxPercentage1;
  //   let sgstRate = currentTaxPercentage2;
  //   let vatRate = currentTaxPercentage1; // VAT uses TaxPercentage1

  //   const chargeSid = row.get('ChargeMasterSid')?.value;

  //   // If we have a charge but no tax rates yet, fetch them
  //   if (chargeSid && (cgstRate === 0 && sgstRate === 0  && vatRate === 0)) {
  //     const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeSid);
  //     if (charge) {
  //       const taxLedger = await this.getTaxLedgerForCharge(charge, placeOfSupply);

  //       if (taxLedger && taxLedger.length > 0) {
  //         // Extract individual tax rates from tax master records
  //         for (const tax of taxLedger) {
  //           console.log('Processing tax record:', tax);
  //           switch (tax.TaxCode) {
  //             case 'CGST':
  //               cgstRate = parseFloat(tax.TaxRate || 0);
  //               break;
  //             case 'SGST':
  //               sgstRate = parseFloat(tax.TaxRate || 0);
  //               break;
  //             case 'IGST':
  //               cgstRate = parseFloat(tax.TaxRate || 0);
  //               break;
  //             case 'VAT':
  //               vatRate = parseFloat(tax.TaxRate || 0);
  //               break;
  //           }
  //         }
  //       } else {
  //         // Fallback to HSSAC tax rate
  //         const hssacSid = row.get('HSSACMasterSid')?.value;
  //         const hssac = this.hssacList.find(h => h.HSSACMasterSid === hssacSid);

  //         if (this.currentUserCountry !== 'india') {
  //           // VAT - use 5% as default for UAE/non-India
  //           vatRate = hssac?.TaxRate || 5;
  //         } else {
  //           // India GST - use 18% as default
  //           const defaultTaxRate = hssac?.TaxRate || 18;

  //           if (gstType === 'CGST+SGST') {
  //             cgstRate = defaultTaxRate / 2;
  //             sgstRate = defaultTaxRate / 2;
  //           } else if (gstType === 'IGST') {
  //             cgstRate = defaultTaxRate;
  //           } else if (gstType === 'B2C') {
  //             cgstRate = defaultTaxRate;
  //           } else {
  //             cgstRate = defaultTaxRate;
  //           }
  //         }
  //       }
  //     }
  //   }

  //   // Calculate tax amounts based on current rates
  //   let cgstAmt = 0, sgstAmt = 0, vatAmt = 0;

  //   console.log('Using Tax Rates:', {
  //     cgstRate,
  //     sgstRate,
  //     vatRate,
  //     gstType,
  //     taxableAmount
  //   });

  //   if (this.currentUserCountry !== 'india') {
  //     // VAT calculation
  //     vatAmt = (taxableAmount * vatRate) / 100;
  //     console.log('VAT Calculation:', {
  //       taxableAmount,
  //       vatRate,
  //       vatAmt,
  //       formula: `(${taxableAmount} * ${vatRate}) / 100 = ${vatAmt}`
  //     });
  //   } else {
  //     // India GST calculations
  //     if (gstType === 'CGST+SGST') {
  //       cgstAmt = (taxableAmount * cgstRate) / 100;
  //       sgstAmt = (taxableAmount * sgstRate) / 100;
  //       console.log('CGST+SGST Calculation:', {
  //         cgstAmt,
  //         sgstAmt,
  //         cgstRate,
  //         sgstRate
  //       });
  //     } else if (gstType === 'IGST') {
  //       cgstAmt = (taxableAmount * cgstRate) / 100;
  //       console.log('IGST Calculation:', {
  //         cgstAmt,
  //         cgstRate
  //       });
  //     } else if (gstType === 'B2C') {
  //       cgstAmt = (taxableAmount * cgstRate) / 100;
  //       console.log('B2C Calculation:', {
  //         cgstAmt,
  //         cgstRate
  //       });
  //     } else if (gstType === 'EXWP' || gstType === 'EXWOP') {
  //       // Export - no tax
  //       console.log('Export - No tax applied');
  //     } else {
  //       // Default to IGST
  //       cgstAmt = (taxableAmount * cgstRate) / 100;
  //       console.log('Default IGST Calculation:', {
  //         cgstAmt,
  //         cgstRate
  //       });
  //     }
  //   }

  //   console.log('=== FINAL CALCULATED AMOUNTS ===');
  //   console.log('CGST Amount:', cgstAmt);
  //   console.log('SGST Amount:', sgstAmt);
  //   console.log('IGST Amount:', cgstAmt);
  //   console.log('VAT Amount:', vatAmt);

  //   // Update row values - DO NOT CLEAR RATES
  //   row.get('Amount')?.setValue(this.round(amount));
  //   row.get('TaxableAmount')?.setValue(this.round(taxableAmount));

  //   // Set tax RATES (keep them as they are or use calculated ones)
  //   // Set tax AMOUNTS (recalculate based on new taxable amount)

  //   if (this.currentUserCountry !== 'india') {
  //     // VAT - use TaxPercentage1 for VAT rate, TaxAmount1 for VAT amount
  //     row.get('TaxPercentage1')?.setValue(this.round(vatRate));
  //     row.get('TaxAmount1')?.setValue(this.round(vatAmt));
  //     console.log('Setting VAT - Rate:', vatRate, 'Amount:', vatAmt);
  //   } else {
  //     // India GST
  //     if (gstType === 'CGST+SGST') {
  //       row.get('TaxPercentage1')?.setValue(this.round(cgstRate));
  //       row.get('TaxAmount1')?.setValue(this.round(cgstAmt));
  //       row.get('TaxPercentage2')?.setValue(this.round(sgstRate));
  //       row.get('TaxAmount2')?.setValue(this.round(sgstAmt));
  //       console.log('Setting CGST+SGST');
  //     } else if (gstType === 'IGST') {
  //       row.get('TaxPercentage1')?.setValue(this.round(cgstRate));
  //       row.get('TaxAmount1')?.setValue(this.round(cgstAmt));
  //       console.log('Setting IGST');
  //     } else if (gstType === 'B2C') {
  //       row.get('TaxPercentage1')?.setValue(this.round(cgstRate));
  //       row.get('TaxAmount1')?.setValue(this.round(cgstAmt));
  //       console.log('Setting B2C');
  //     } else {
  //       // Default
  //       row.get('TaxPercentage1')?.setValue(this.round(cgstRate));
  //       row.get('TaxAmount1')?.setValue(this.round(cgstAmt));
  //       console.log('Setting default GST');
  //     }
  //   }

  //   row.get('LocalAmount')?.setValue(this.round(localAmount));
  //   row.get('PartyAmount')?.setValue(this.getPartyAmount(row.value));

  //   this.updateBillAmount();
  //   console.log('=== RATE CHANGE DEBUG - END ===');
  // }

  /**
   * Get tax ledger for charge using the same method as invoice-entry.component.ts
   */
  // private async getTaxLedgerForCharge(
  //   charge: any,
  //   placeOfSupplyState: string
  // ): Promise<any> {
  //   try {
  //     console.log('=== GET TAX LEDGER DEBUG ===');
  //     console.log('Charge object:', charge);

  //     const taxGroupSid = this.getTaxGroupSidFromCharge(charge);
  //     console.log('Extracted TaxGroupSid:', taxGroupSid);

  //     if (!taxGroupSid) {
  //       console.log('No TaxGroupSid found for charge:', charge?.ChargeDescription);
  //       return null;
  //     }

  //     const currentCountry = Number(this.currentCompany?.CountryMasterSid);

  //     // Determine Input/Output - INVOICE = OUTPUT (selling goods/services)
  //     const inputOrOutput: 'Input' | 'Output' = 'Output';

  //     const companyState = this.getCompanyState();
  //     const customerCountry = this.getCustomerCountryFromCharge(charge);
  //     const taxCategory = this.determineTaxCategory(companyState, placeOfSupplyState, customerCountry);

  //     console.log('Tax Ledger Parameters:', {
  //       charge: charge?.ChargeDescription,
  //       taxGroupSid,
  //       inputOrOutput,
  //       taxCategory,
  //       companyState,
  //       placeOfSupplyState,
  //       customerCountry,
  //       currentCountry
  //     });

  //     const payload = {
  //       taxGroup: taxGroupSid,
  //       InputOrOutput: inputOrOutput,
  //       TaxCategory: taxCategory,
  //       CountryMasterSid: currentCountry
  //     };

  //     console.log('Calling tax ledger API with payload:', payload);

  //     const response = await firstValueFrom(
  //       this.operationService.getLedgerForTaxGroup(payload).pipe(
  //         catchError(error => {
  //           console.error('Error calling getLedgerForTaxGroup:', error);
  //           return of(null);
  //         })
  //       )
  //     );

  //     console.log('Tax Ledger API Response:', response);

  //     if (response?.status && response.data && response.data.length > 0) {
  //       const taxGroupData = response.data[0];
  //       console.log('Tax Group Data:', taxGroupData);

  //       // Return individual tax master records for proper calculation
  //       if (taxGroupData.taxMaster && Array.isArray(taxGroupData.taxMaster)) {
  //         console.log('Individual Tax Masters found:', taxGroupData.taxMaster);
  //         return taxGroupData.taxMaster;
  //       }

  //       // Fallback to tax group rate if no individual tax masters
  //       return [taxGroupData];
  //     } else {
  //       console.warn('No tax ledger data found for charge:', charge?.ChargeDescription);
  //       return null;
  //     }

  //   } catch (error) {
  //     console.error('Error fetching tax ledger:', error);
  //     return null;
  //   }
  // }

  // private getTaxGroupSidFromCharge(charge: any): number | null {
  //   console.log('DEBUG - getTaxGroupSidFromCharge - charge structure:', charge);

  //   if (!charge) {
  //     console.log('DEBUG - Charge object is null or undefined');
  //     return null;
  //   }

  //   // Try different possible structures for chargeTaxMaster
  //   let chargeTaxMaster = charge.ChargeMaster?.chargeTaxMaster;

  //   if (!chargeTaxMaster && charge.chargeTaxMaster) {
  //     chargeTaxMaster = charge.chargeTaxMaster;
  //   }

  //   if (!chargeTaxMaster && charge.ChargeTaxMaster) {
  //     chargeTaxMaster = charge.ChargeTaxMaster;
  //   }

  //   console.log('DEBUG - chargeTaxMaster found:', chargeTaxMaster);

  //   if (!chargeTaxMaster || !Array.isArray(chargeTaxMaster) || chargeTaxMaster.length === 0) {
  //     console.log('DEBUG - No chargeTaxMaster array found or empty');
  //     return null;
  //   }

  //   const firstTax = chargeTaxMaster[0];
  //   console.log('DEBUG - First tax record:', firstTax);

  //   // Try different possible field names for TaxGroupSid
  //   const taxGroupSid = firstTax.TaxGroupSid ||
  //                      firstTax.taxGroupSid ||
  //                      firstTax.TaxGroupMasterSid ||
  //                      firstTax.taxGroupMasterSid;

  //   console.log('DEBUG - Extracted taxGroupSid:', taxGroupSid);

  //   return taxGroupSid ? Number(taxGroupSid) : null;
  // }

  // private getCustomerCountryFromCharge(charge: any): string {
  //   // For Credit Note - get from customer
  //   const customerMaster = this.customerList.find(c => c.CustomerMasterSid === this.creditNoteForm.get('CustomerMasterSid')?.value);
  //   const customerBranch = this.customerBranchList.find(b => b.CustomerBranchSid === this.creditNoteForm.get('CustomerBranchSid')?.value);

  //   const country = customerMaster?.countryMaster?.countryCode ||
  //                  customerMaster?.Country ||
  //                  customerBranch?.countryMaster?.countryCode ||
  //                  customerBranch?.Country ||
  //                  '';

  //   console.log('Customer Country (Credit Note):', {
  //     customerName: customerMaster?.CustomerName,
  //     countryFromMaster: customerMaster?.countryMaster?.countryCode,
  //     countryFromBranch: customerBranch?.countryMaster?.countryCode,
  //     finalCountry: country
  //   });

  //   return country;
  // }

  /**
   * Determine tax category based on company state and place of supply
   */
  // private determineTaxCategory(companyState: string, billingPartyState: string, customerCountry: string): 'Inter' | 'Intra' {
  //   if (!companyState || !billingPartyState) {
  //     console.warn('Missing state information, defaulting to Inter');
  //     return 'Inter';
  //   }

  //   // Normalize country codes for comparison
  //   const normalizedCustomerCountry = customerCountry?.toLowerCase() || '';
  //   const isIndianCustomer = normalizedCustomerCountry === 'india' || normalizedCustomerCountry === 'in';

  //   console.log('Tax Category - Customer Country Analysis:', {
  //     customerCountry,
  //     normalizedCustomerCountry,
  //     isIndianCustomer,
  //     isInternationalCustomer
  //   });

  //   // For international customers (like Dubai), use 'Inter' category for VAT
  //   if (isInternationalCustomer) {
  //     console.log('International transaction - Using Inter category for customer country:', customerCountry);
  //     return 'Inter'; // Use 'Inter' for international transactions (VAT)
  //   }

  //   // For Indian customers, check if same state or different state
  //   const normalizedCompanyState = companyState.trim().toLowerCase();
  //   const normalizedBillingState = billingPartyState.trim().toLowerCase();

  //   const isSameState = normalizedCompanyState === normalizedBillingState;

  //   console.log('Tax Category Determination for Indian Customer:', {
  //     companyState: normalizedCompanyState,
  //     billingPartyState: normalizedBillingState,
  //     isSameState,
  //     taxCategory: isSameState ? 'Inter' : 'Intra'
  //   });

  //   return isSameState ? 'Inter' : 'Intra';
  // }
  // onInvoiceTypeChange() {
  //   const placeOfSupply = this.creditNoteForm.get('PlaceOfSupply')?.value;
  //   this.determineGSTType(placeOfSupply);
  //   this.recalculateAllRows();
  // }

  // getCompanyState(): string {
  //   if (!this.currentCompany) {
  //     console.warn('No current company data available');
  //     return '';
  //   }

  //   console.log('=== COMPANY STATE DEBUG ===');
  //   console.log('Current Company:', this.currentCompany);
  //   console.log('Current Branch:', this.currentBranch);
  //   console.log('User Data:', this.userData);

  //   // Method 1: Check if currentCompany has stateMaster directly
  //   if (this.currentCompany.stateMaster) {
  //     const state = this.currentCompany.stateMaster.stateName || this.currentCompany.stateMaster.StateName;
  //     if (state) {
  //       console.log('Company State from currentCompany.stateMaster:', state);
  //       return state;
  //     }
  //   }

  //   // Method 2: Check if currentCompany has StateMasterSid and look up in stateList
  //   if (this.currentCompany.StateMasterSid && this.stateList.length > 0) {
  //     const state = this.stateList.find(s =>
  //       s.StateMasterSid === this.currentCompany.StateMasterSid ||
  //       s.stateMasterSid === this.currentCompany.StateMasterSid
  //     );
  //     if (state) {
  //       const stateName = state.stateName || state.StateName;
  //       console.log('Company State from currentCompany.StateMasterSid lookup:', stateName);
  //       return stateName;
  //     }
  //   }

  //   // Method 3: Check currentBranch state information
  //   if (this.currentBranch && this.currentBranch.stateMaster) {
  //     const state = this.currentBranch.stateMaster.stateName || this.currentBranch.stateMaster.StateName;
  //     if (state) {
  //       console.log('Company State from currentBranch.stateMaster:', state);
  //       return state;
  //     }
  //   }

  //   // Method 4: Check currentBranch StateMasterSid
  //   if (this.currentBranch && this.currentBranch.StateMasterSid && this.stateList.length > 0) {
  //     const state = this.stateList.find(s =>
  //       s.StateMasterSid === this.currentBranch.StateMasterSid ||
  //       s.stateMasterSid === this.currentBranch.StateMasterSid
  //     );
  //     if (state) {
  //       const stateName = state.stateName || state.StateName;
  //       console.log('Company State from currentBranch.StateMasterSid lookup:', stateName);
  //       return stateName;
  //     }
  //   }

  //   // Method 5: Navigate through userData structure to get branch state
  //   if (this.userData && this.userData.userCompanyMaster) {
  //     const userCompanies = this.userData.userCompanyMaster;

  //     // Find the current company in user companies
  //     const currentUserCompany = userCompanies.find((uc: any) =>
  //       uc.CompanyMasterSid === this.currentCompany.CompanyMasterSid
  //     );

  //     if (currentUserCompany && currentUserCompany.companyMaster) {
  //       const companyMaster = currentUserCompany.companyMaster;

  //       // Check company master's userBranchMaster
  //       if (companyMaster.userBranchMaster && Array.isArray(companyMaster.userBranchMaster)) {
  //         // Find the current branch
  //         const currentUserBranch = companyMaster.userBranchMaster.find((ub: any) =>
  //           ub.BranchMasterSid === this.currentBranch.BranchMasterSid
  //         );

  //         if (currentUserBranch && currentUserBranch.branchMaster) {
  //           const branchMaster = currentUserBranch.branchMaster;

  //           // Method 5a: Check branchMaster's stateMaster
  //           if (branchMaster.stateMaster) {
  //             const state = branchMaster.stateMaster.stateName || branchMaster.stateMaster.StateName;
  //             if (state) {
  //               console.log('Company State from userData->branchMaster->stateMaster:', state);
  //               return state;
  //             }
  //           }

  //           // Method 5b: Check branchMaster's StateMasterSid
  //           if (branchMaster.StateMasterSid && this.stateList.length > 0) {
  //             const state = this.stateList.find(s =>
  //               s.StateMasterSid === branchMaster.StateMasterSid ||
  //               s.stateMasterSid === branchMaster.StateMasterSid
  //             );
  //             if (state) {
  //               const stateName = state.stateName || state.StateName;
  //               console.log('Company State from userData->branchMaster->StateMasterSid lookup:', stateName);
  //               return stateName;
  //             }
  //           }
  //         }
  //       }

  //       // Method 6: Check company master's StateMasterSid
  //       if (companyMaster.StateMasterSid && this.stateList.length > 0) {
  //         const state = this.stateList.find(s =>
  //           s.StateMasterSid === companyMaster.StateMasterSid ||
  //           s.stateMasterSid === companyMaster.StateMasterSid
  //         );
  //         if (state) {
  //           const stateName = state.stateName || state.StateName;
  //           console.log('Company State from userData->companyMaster->StateMasterSid lookup:', stateName);
  //           return stateName;
  //         }
  //       }
  //     }
  //   }

  //   console.log('No company state found after all attempts');
  //   return '';
  // }

  // updateBillAmount() {
  //   const totalLocalAmount = this.calculateTotalLocalAmount();
  //   this.creditNoteForm.get('BillAmt')?.setValue(this.round(totalLocalAmount));
  // }

  // calculateTotalLocalAmount(): number {
  //   return this.details.controls.reduce((sum, row: any) => {
  //     return sum + (Number(row.get('LocalAmount')?.value) || 0);
  //   }, 0);
  // }

  // recalculateAllRows() {
  //   for (let i = 0; i < this.details.length; i++) {
  //     const exRateCtrl = this.details.at(i).get('ExchangeRate');
  //     if (exRateCtrl && (exRateCtrl.value === null || exRateCtrl.value === undefined)) {
  //       exRateCtrl.setValue(this.creditNoteForm.get('ExchangeRate')?.value || 1);
  //     }
  //     // const currCtrl = this.details.at(i).get('CurrencyCode');
  //     // if (currCtrl && !currCtrl.value) {
  //     //   currCtrl.setValue(this.creditNoteForm.get('CurrencyCode')?.value || null);
  //     // }
  //     this.recalcRow(i);
  //   }
  // }

  // Calculate total currency amount (sum of all amounts)

  // Calculate total tax amount (CGST + SGST + IGST)
  // getTotalTaxAmount() {
  //   let total = 0;
  //   for (let i = 0; i < this.details.length; i++) {
  //     const taxAmt1 = Number(this.details.at(i).get('TaxAmount1')?.value || 0);
  //     const taxAmt2 = Number(this.details.at(i).get('TaxAmount2')?.value || 0);
  //     total += taxAmt1 + taxAmt2 ;
  //   }
  //   return total.toFixed(2);
  // }

  // Calculate grand total (Currency Amount + Tax Amount)
  getGrandTotal(): number {
    return this.round(
      this.getTotalCurrencyAmount() + toNumber(this.getTotalTaxAmount()),
    );
  }

  round(val: number) {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  // private normalizeParty(raw: any) {
  //   const customerMasterSid = raw.CustomerMasterSid != null ? Number(raw.CustomerMasterSid) : null;
  //   const partyControl = raw.PartyName; // This now contains the CustomerName string

  //   let customerBranchSid: number | null = raw.CustomerBranchSid != null ? Number(raw.CustomerBranchSid) : null;

  //   let partyNameStr = partyControl || '';
  //   let partyAddressStr = raw.PartyAddress || '';

  //   // Get address from branch if available
  //   if (customerBranchSid) {
  //     const foundBranch = this.customerBranchList.find(b => Number(b.CustomerBranchSid) === customerBranchSid);
  //     if (foundBranch) {
  //       partyAddressStr = foundBranch.Address || foundBranch.CustomerAddress1 || partyAddressStr;
  //     }
  //   }

  //   // CRITICAL: PartyMasterSid should come from the form control, not from branch
  //   let partyMasterSid = raw.PartyMasterSid != null ? Number(raw.PartyMasterSid) : null;

  //   // Fallback: if PartyMasterSid is not set, try to get from customer
  //   if (!partyMasterSid && customerMasterSid) {
  //     const customer = this.customerList.find(c => c.CustomerMasterSid === customerMasterSid);
  //     if (customer && customer.SubledgerMasterSid) {
  //       partyMasterSid = Number(customer.SubledgerMasterSid);
  //     }
  //   }

  //   console.log('DEBUG - normalizeParty result:', {
  //     PartyMasterSid: partyMasterSid,
  //     CustomerBranchSid: customerBranchSid,
  //     PartyName: partyNameStr,
  //     PartyAddress: partyAddressStr
  //   });

  //   return {
  //     PartyMasterSid: partyMasterSid,
  //     CustomerBranchSid: customerBranchSid,
  //     PartyName: partyNameStr,
  //     PartyAddress: partyAddressStr,
  //     CustomerName: partyNameStr
  //   };
  // }

  // getCurrencyId(CurrencyCode: string): number | null {
  //   if(!CurrencyCode || !this.currencyList){
  //     return null;
  //   } else {
  //     const currency = this.currencyList.find(c => c.currencyCode === CurrencyCode);
  //     return currency ? currency.CurrencyMasterSid : null
  //   }
  // }

  // private buildVoucherOthersPayload(rawVoucherOthers: any): any | undefined {
  //   if (!rawVoucherOthers || typeof rawVoucherOthers !== 'object') return undefined;

  //   const allowedKeys = [
  //     'ContainerNumber',
  //     'VoucherNote',
  //     'Footer',
  //     'ReverseCreditNote',
  //     'DueDate',
  //     'IRNNumber',
  //     'IRNStatus',
  //     'IRNQRCode',
  //     'VoucherReverseSid'
  //   ];

  //   const cleaned: any = {};

  //   for (const k of allowedKeys) {
  //     const val = rawVoucherOthers[k];
  //     if (val === null || val === undefined) continue;
  //     if (typeof val === 'string') {
  //       if (val.trim() === '') continue;
  //       cleaned[k] = val;
  //     } else if (val instanceof Date) {
  //       cleaned[k] = val;
  //     } else {
  //       cleaned[k] = val;
  //     }
  //   }

  //   if (Object.keys(cleaned).length === 0) return undefined;

  //   if (!('Footer' in cleaned)) {
  //     cleaned['Footer'] = '';
  //   }

  //   if (cleaned.DueDate && !(cleaned.DueDate instanceof Date)) {
  //     const parsed = new Date(cleaned.DueDate);
  //     if (!isNaN(parsed.getTime())) cleaned.DueDate = parsed;
  //     else delete cleaned.DueDate;
  //   }

  //   if ('VoucherReverseSid' in cleaned) {
  //     const v = Number(cleaned.VoucherReverseSid);
  //     cleaned.VoucherReverseSid = isNaN(v) ? null : v;
  //   }

  //   return cleaned;
  // }

  // Called when user selects master job in main Job No control
  // onMasterJobSelected(selected: any) {
  //   if (!selected) {
  //     this.creditNoteForm.get('MBLNo')?.setValue('');
  //     this.creditNoteForm.get('HBLNo')?.setValue('');
  //     return;
  //   }
  //   const masterJob = typeof selected === 'object' ? selected : this.masterJobList.find(m => m.MasterJobSid === selected);
  //   if (masterJob) {
  //     if (masterJob.MBLNo !== undefined) this.creditNoteForm.get('MBLNo')?.setValue(masterJob.MBLNo || '');
  //     if (masterJob.HBLNo !== undefined) this.creditNoteForm.get('HBLNo')?.setValue(masterJob.HBLNo || masterJob.HouseJob || '');
  //     this.creditNoteForm.get('MasterJobSid')?.setValue(Number(masterJob.MasterJobSid));
  //     // optional: apply to all detail rows
  //     // this.applyMasterJobToAllDetails(Number(masterJob.MasterJobSid));
  //   }
  // }

  //   private rateValidator(control: AbstractControl): ValidationErrors | null {
  //   if (!control.value && control.value !== 0) {
  //     return null;
  //   }

  //   const rate = Number(control.value);
  //   const rowIndex = this.getRowIndexFromControl(control);

  //   if (rowIndex === -1) return null;

  //   const row = this.details.at(rowIndex);
  //   if (!row) return null;

  //   const sourceDetailSid = row.get('SourceDetailSid')?.value;

  //   if (!sourceDetailSid || !this.originalRateList) {
  //     return null;
  //   }

  //   const original = this.originalRateList.get(Number(sourceDetailSid));

  //   if (original && rate > original.Rate) {
  //     return {
  //       rateExceeded: {
  //         actualRate: rate,
  //         maxAllowedRate: original.Rate
  //       }
  //     };
  //   }

  //   return null;
  // }

  //   private getRowIndexFromControl(control: AbstractControl): number {
  //   if (!this.details) return -1;

  //   for (let i = 0; i < this.details.length; i++) {
  //     const row = this.details.at(i);
  //     if (row.get('Rate') === control) {
  //       return i;
  //     }
  //   }
  //   return -1;
  // }

  // async onSave() {
  //   // Block save if voucher period grace days exceeded or module closed
  //   if (this.voucherConstraints.isClosed) {
  //     if (this.voucherConstraints.errorMessage) this.appSettingService.showWarning(this.voucherConstraints.errorMessage);
  //     return;
  //   }

  //   if (this.creditNoteForm.invalid) {
  //     this.creditNoteForm.markAllAsTouched();
  //     this.appSettingService.showWarning('Please fill required creditNote fields.');
  //     return;
  //   }
  //   this.recalculateAllRows();

  //   const raw = this.creditNoteForm.getRawValue();

  //   const userEmailFromSettings = (this.appSettingService as any).userSettingSource?.value?.['userEmail'] || null;
  //   const createdByValue = userEmailFromSettings || this.currUserEmail || null;
  //   const updatedByValue = this.isEditMode ? (userEmailFromSettings || this.currUserEmail || null) : null;

  //   let voucherDate: Date;
  //   if (!raw.VoucherDate) {
  //     voucherDate = new Date();
  //   } else if ((raw.VoucherDate as NgbDateStructLike).year) {
  //     const converted = this.fromNgbDate(raw.VoucherDate as NgbDateStructLike);
  //     voucherDate = converted ?? new Date();
  //   } else {
  //     const parsed = new Date(raw.VoucherDate);
  //     voucherDate = isNaN(parsed.getTime()) ? new Date() : parsed;
  //   }

  //   const normalizedParty = this.normalizeParty(raw);

  //   const currencyMasterId = this.getCurrencyId(raw.CurrencyCode);

  //   const masterJobSid = raw.MasterJobSid ? Number(raw.MasterJobSid) : null;

  //   const rawPartyControl = this.creditNoteForm.get('PartyMasterSid')?.value;
  //   const partyMasterSid = rawPartyControl != null && rawPartyControl !== ''
  //     ? Number(rawPartyControl)
  //     : (normalizedParty.PartyMasterSid != null ? Number(normalizedParty.PartyMasterSid) : null);

  //   const voucherDetailArray = (raw.voucherDetails || []).map((d: any, index: number) => {
  //     const partyAmount = this.getPartyAmount(d);
  //     const detail = {
  //       VoucherDetailSid: d.VoucherDetailSid,
  //       SourceDetailSid: d.SourceDetailSid || null,
  //       ChargeMasterSid: d.ChargeMasterSid != null ? Number(d.ChargeMasterSid) : null,
  //       ChargeDescription: d.ChargeDescription || '',
  //       HSSACMasterSid: d.HSSACMasterSid != null ? Number(d.HSSACMasterSid) : null,
  //       LedgerMasterSid : d.LedgerMasterSid ? Number(d.LedgerMasterSid) : null,
  //       COAMasterSid : d.COAMasterSid ? Number(d.COAMasterSid) : null,
  //       ChargeUOMSid: d.ChargeUOMSid != null ? Number(d.ChargeUOMSid) : null,
  //       DepartmentMasterSid: d.DepartmentMasterSid != null ? Number(d.DepartmentMasterSid) : null,
  //       NumberOfUnit: d.NumberOfUnit != null ? Number(d.NumberOfUnit) : 0,
  //       DrCr: d.DrCr || 'D',
  //       CurrencyCode: d.CurrencyCode || raw.CurrencyCode,
  //       CurrencyMasterSid: this.getCurrencyId(d.CurrencyCode || raw.CurrencyCode),
  //       Rate: d.Rate != null ? Number(d.Rate) : 0,
  //       ExchangeRate: d.ExchangeRate != null ? Number(d.ExchangeRate) : (raw.ExchangeRate != null ? Number(raw.ExchangeRate) : 1),
  //       Amount: d.Amount != null ? Number(d.Amount) : 0,
  //       TaxableAmount: d.TaxableAmount != null ? Number(d.TaxableAmount) : (d.Amount != null ? Number(d.Amount) : 0),
  //       TaxPercentage1: d.TaxPercentage1 != null ? Number(d.TaxPercentage1) : 0,
  //       TaxAmount1: d.TaxAmount1 != null ? Number(d.TaxAmount1) : 0,
  //       TaxPercentage2: d.TaxPercentage2 != null ? Number(d.TaxPercentage2) : 0,
  //       TaxAmount2: d.TaxAmount2 != null ? Number(d.TaxAmount2) : 0,
  //       LocalAmount: d.LocalAmount != null ? Number(d.LocalAmount) : 0,
  //       PartyAmount: partyAmount,
  //       MasterJobSid: d.MasterJobSid ? Number(d.MasterJobSid) : masterJobSid,
  //       HouseJobSid: d.HouseJobSid ? Number(d.HouseJobSid) : null
  //     };
  //     return detail;
  //   });

  //   const rawVoucherOthers = raw.voucherOthers ? { ...raw.voucherOthers } : null;
  //   if (rawVoucherOthers && rawVoucherOthers.DueDate && (rawVoucherOthers.DueDate as NgbDateStructLike).year) {
  //     rawVoucherOthers.DueDate = this.fromNgbDate(rawVoucherOthers.DueDate as NgbDateStructLike);
  //   }

  //   const voucherOthersCandidate = this.buildVoucherOthersPayload(rawVoucherOthers);

  //   const payload: any = {
  //     ...(this.isEditMode ? { UpdatedBy: updatedByValue } : { CreatedBy: createdByValue }),
  //     CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
  //     BranchMasterSid: this.currentBranch?.BranchMasterSid,
  //     VoucherNumber: raw.VoucherNumber || null,
  //     ReversalVoucher: raw.ReversalVoucher || null,
  //     VoucherDate: raw.VoucherDate,
  //     PostDate: raw.PostDate,
  //     GST_VAT: raw.GST_VAT || undefined,
  //     PartyMasterSid: partyMasterSid,
  //     PartyName: normalizedParty.PartyName || String(raw.PartyName || ''),
  //     DepartmentMasterSid: raw.DepartmentMasterSid || null,
  //     PartyAddress: normalizedParty.PartyAddress || raw.PartyAddress || '',
  //     CustomerBranchSid: normalizedParty.CustomerBranchSid ?? null,
  //     COAMasterSid: raw.COAMasterSid ?? 1,
  //     InvoiceType: raw.InvoiceType || 'REG',
  //     GSTType: raw.GSTType || '',
  //     CurrencyMasterSid: currencyMasterId,
  //     CurrencyCode: raw.CurrencyCode || undefined,
  //     ExchangeRate: raw.ExchangeRate != null ? Number(raw.ExchangeRate) : undefined,
  //     MasterJobSid: masterJobSid,
  //     HouseJobSid: raw.HouseJobSid ? Number(raw.HouseJobSid) : null,
  //     BookingHeaderSid: raw.BookingHeaderSid? Number(raw.BookingHeaderSid): null,
  //     DocumentNumber: raw.DocumentNumber || undefined,
  //     CreditNoteReason: raw.CreditNoteReason || undefined,
  //     Remarks: raw.Remarks || undefined,
  //     Narration: (raw.Narration !== undefined ? raw.Narration : undefined),
  //     status: (raw.status != null ? raw.status : 'A'),
  //     VoucherDetail: voucherDetailArray.length > 0 ? voucherDetailArray : undefined,
  //   };

  //   if (voucherOthersCandidate) {
  //     payload.VoucherOthers = voucherOthersCandidate;
  //   }

  //   Object.keys(payload).forEach(k => {
  //     if (payload[k] === undefined) delete payload[k];
  //   });

  //   console.debug('DEBUG - payload PartyMasterSid (will send):', payload.PartyMasterSid);
  //   console.debug('DEBUG - full payload', payload);

  //   if (this.headerId) {
  //     payload.UpdatedBy = updatedByValue;
  //     this.operationService.updateCreditNoteById(this.headerId, payload).subscribe({
  //       next: (resp: any) => {
  //         if (resp?.status) {
  //           this.appSettingService.showSuccess('CreditNote updated successfully.');
  //           const id = resp.data?.newVoucher?.VoucherHeaderSid || resp.data?.VoucherHeaderSid || resp.data?.voucherHeaderSid || null;
  //           this.router.navigate(['operation/credit-note/entry', id]);
  //         } else {
  //           this.appSettingService.showError('Error updating CreditNote.');
  //           console.error('updateCreditNote resp', resp);
  //         }
  //       },
  //       error: (err) => {
  //         console.error('updateCreditNote error', err);
  //         this.appSettingService.showError('Failed to update CreditNote.');
  //       }
  //     });
  //   } else {
  //     payload.CreatedBy = createdByValue;
  //     this.operationService.createCreditNote(payload).subscribe({
  //       next: (resp: any) => {
  //         if (resp?.status) {
  //           this.appSettingService.showSuccess('CreditNote created successfully.');
  //           const id = resp.data?.newVoucher?.VoucherHeaderSid || resp.data?.VoucherHeaderSid || resp.data?.voucherHeaderSid || null;
  //           if (id) this.router.navigate(['operation/credit-note/entry', id]);
  //           else this.router.navigate(['operation/credit-note/list']);
  //         } else {
  //           this.appSettingService.showError('Error creating creditNote.');
  //           console.error('createCreditNote resp', resp);
  //         }
  //       },
  //       error: (err) => {
  //         console.error('createCreditNote error', err);
  //         this.appSettingService.showError('Failed to create CreditNote.');
  //       }
  //     });
  //   }
  // }

  // Helper methods to get display values
  //   getChargeCode(chargeSid: number): string {
  //     const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeSid);
  //     return charge?.chargeCode || charge?.ChargeCode || '-';
  //   }

  getHSSACCode(hssacSid: number, rowIndex?: number): string {
    // First, try to get from hssacList using the HSSACMasterSid
    if (hssacSid && this.hssacList && this.hssacList.length > 0) {
      const hssac = this.hssacList.find(
        (h) =>
          h.HSSACMasterSid === hssacSid ||
          h.hssacMasterSid === hssacSid ||
          h.HSSACMasterId === hssacSid ||
          h.ChargeTaxMasterSid === hssacSid ||
          h.chargeTaxMasterSid === hssacSid,
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
        // console.log('DEBUG - getHSSACCode: hssacSid =', hssacSid, ', found in hssacList =', true, ', result =', result);
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
          (c: any) => c.ChargeMasterSid === chargeSid,
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
            // console.log('DEBUG - getHSSACCode: Got HSN from chargeTaxMaster =', hsnCode);
            return hsnCode;
          }
        }
      }
    }

    console.log(
      'DEBUG - getHSSACCode: hssacSid =',
      hssacSid,
      ', hssacList length =',
      this.hssacList?.length || 0,
      ', not found',
    );
    return '-';
  }

  // Print Modal Methods
  async openPrintModal() {
    if (!this.headerId) {
      this.appSettingService.showWarning('Please save the credit note first.');
      return;
    }

    this.spinner.show();

    try {
      await this.preparePrintData();
      console.log('PRINT DATA', this.creditNotePrintData);
      this.modalService.open(this.printModalRef, {
        size: 'xl',
        scrollable: true,
      });
    } finally {
      this.spinner.hide();
    }
  }

  printDiv(divId: string): void {
    setTimeout(() => {
      const printContents = document.getElementById(divId)?.innerHTML;
      if (!printContents) {
        this.appSettingService.showError('Print content not found.');
        return;
      }

      const popupWin = window.open('', '_blank', 'width=900,height=600');
      if (!popupWin) {
        this.appSettingService.showError('Unable to open print window.');
        return;
      }

      popupWin.document.open();
      popupWin.document.write(`
        <html>
          <head>
            <title>Credit Note Print</title>
          </head>
          <body onload="window.print(); window.close();">
            ${printContents}
          </body>
        </html>
      `);
      popupWin.document.close();
    }, 50);
  }

  //   getUOMCode(uomSid: number): string {
  //     const uom = this.uomList.find(u => u.UOMMasterSid === uomSid);
  //     return uom?.UOMCode || uom?.UOMName || '-';
  //   }

  //   getMasterJobNumber(jobSid: number): string {
  //     const job = this.masterJobList.find(j => j.MasterJobSid === jobSid);
  //     return job?.MasterJobNumber || job?.displayLabel || '-';
  //   }

  //   getHouseJobNumber(jobSid: number, masterJobSid: number): string {
  //     const houseJobs = this.houseJobListByMasterJob[masterJobSid] || [];
  //     const job = houseJobs.find(j => j.HouseJobSid === jobSid);
  //     return job?.HouseJobNumber || job?.displayLabel || '-';
  //   }

  //   // Print Modal Methods
  //   openPrintModal() {
  //     if (!this.headerId) {
  //       this.appSettingService.showWarning('Please save the creditNote first.');
  //       return;
  //     }
  //     this.modalService.open(this.printModalRef, { size: 'xl', scrollable: true });
  //   }

  // async downloadPDF() {
  //   const printContent = document.getElementById('printContent');
  //   if (!printContent) {
  //     this.appSettingService.showError('Print content not found.');
  //     return;
  //   }

  //   try {
  //     this.spinner.show();

  //     // Generate PDF using html2canvas and jsPDF
  //     const canvas = await html2canvas(printContent, {
  //       scale: 2,
  //       useCORS: true,
  //       logging: false,
  //       backgroundColor: '#ffffff',
  //     });

  //     const imgWidth = 210; // A4 width in mm
  //     const pageHeight = 297; // A4 height in mm
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width;
  //     let heightLeft = imgHeight;
  //     let position = 0;

  //     const pdf = new jsPDF('p', 'mm', 'a4');
  //     const imgData = canvas.toDataURL('image/png');

  //     // Add first page
  //     pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  //     heightLeft -= pageHeight;

  //     // Add additional pages if content exceeds one page
  //     while (heightLeft > 0) {
  //       position = heightLeft - imgHeight;
  //       pdf.addPage();
  //       pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  //       heightLeft -= pageHeight;
  //     }

  //     // Generate filename with invoice number
  //     const voucherNumber =
  //       this.creditNoteForm.get('VoucherNumber')?.value || 'CreditNote';
  //     const filename = `CreditNote_${voucherNumber}.pdf`;

  //     // Download the PDF
  //     pdf.save(filename);

  //     this.spinner.hide();
  //     this.appSettingService.showSuccess('PDF downloaded successfully!');
  //   } catch (error) {
  //     this.spinner.hide();
  //     console.error('Error generating PDF:', error);
  //     this.appSettingService.showError(
  //       'Error generating PDF. Please try again.',
  //     );
  //   }
  // }

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
        amountInWords: this.creditNotePrintData?.AmountInWords || '',
        localCurrency: this.currentCompanyCurrency?.code || '',
        invoiceTitle: this.creditNotePrintData?.invoiceTitle || '',
        // Additional options for matching original PDF
        isSeaMode: this.isSeaDepartment(),
        isVATMode: this.isVATMode,
        companyVatNo: this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
        shipmentDetails: {
          shipper: this.creditNotePrintData?.ShipperName,
          consignee: this.creditNotePrintData?.ConsigneeName,
          vesselName: this.creditNotePrintData?.Vessel,
          voyageNo: this.creditNotePrintData?.VoyageNo,
          shipperRefNo: this.creditNotePrintData?.CustomerRefNo,
          loadingPort: this.creditNotePrintData?.POL,
          finalDestination: this.creditNotePrintData?.FPD,
          etd: this.creditNotePrintData?.ETD,
          eta: this.creditNotePrintData?.ETA,
          invoiceDueDate: this.creditNotePrintData?.InvoiceDueDate
        },
        cargoDetails: {
          packages: this.creditNotePrintData?.pkg,
          commodityDesc: this.creditNotePrintData?.desc,
          grossWeight: this.creditNotePrintData?.grosswt,
          chargeableWeight: this.creditNotePrintData?.ChargeableWeight,
          cbm: this.creditNotePrintData?.cbm
        },
        creditNotePrintData: this.creditNotePrintData
      };

      this.pdfMakeService.generateCreditNoteFromApi(
        this.creditNoteData,
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

  // async generatePDFBlob(): Promise<Blob | null> {
  //   const printContent = document.getElementById('printContent');
  //   if (!printContent) {
  //     return null;
  //   }

  //   try {
  //     const canvas = await html2canvas(printContent, {
  //       scale: 2,
  //       useCORS: true,
  //       logging: false,
  //       backgroundColor: '#ffffff',
  //     });

  //     const imgWidth = 210;
  //     const pageHeight = 297;
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width;
  //     let heightLeft = imgHeight;
  //     let position = 0;

  //     const pdf = new jsPDF('p', 'mm', 'a4');
  //     const imgData = canvas.toDataURL('image/png');

  //     pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  //     heightLeft -= pageHeight;

  //     while (heightLeft > 0) {
  //       position = heightLeft - imgHeight;
  //       pdf.addPage();
  //       pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  //       heightLeft -= pageHeight;
  //     }

  //     return pdf.output('blob');
  //   } catch (error) {
  //     console.error('Error generating PDF blob:', error);
  //     return null;
  //   }
  // }

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
        amountInWords: this.creditNotePrintData?.AmountInWords || '',
        localCurrency: this.currentCompanyCurrency?.code || '',
        invoiceTitle: this.creditNotePrintData?.invoiceTitle || '',
        // Additional options for matching original PDF
        isSeaMode: this.isSeaDepartment(),
        isVATMode: this.isVATMode,
        companyVatNo: this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
        shipmentDetails: {
          shipper: this.creditNotePrintData?.ShipperName,
          consignee: this.creditNotePrintData?.ConsigneeName,
          vesselName: this.creditNotePrintData?.Vessel,
          voyageNo: this.creditNotePrintData?.VoyageNo,
          shipperRefNo: this.creditNotePrintData?.CustomerRefNo,
          loadingPort: this.creditNotePrintData?.POL,
          finalDestination: this.creditNotePrintData?.FPD,
          etd: this.creditNotePrintData?.ETD,
          eta: this.creditNotePrintData?.ETA,
          invoiceDueDate: this.creditNotePrintData?.InvoiceDueDate
        },
        cargoDetails: {
          packages: this.creditNotePrintData?.pkg,
          commodityDesc: this.creditNotePrintData?.desc,
          grossWeight: this.creditNotePrintData?.grosswt,
          chargeableWeight: this.creditNotePrintData?.ChargeableWeight,
          cbm: this.creditNotePrintData?.cbm
        },
        creditNotePrintData: this.creditNotePrintData
      };

      const blob = await this.pdfMakeService.generateCreditNoteBlobFromApi(
        this.creditNoteData,
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

  initializeEmailForm() {
    const customerBranchSid = this.creditNoteForm.get('PartyName')?.value;
    const customerBranch = this.customerBranchList.find(
      (b) => b.CustomerBranchSid === customerBranchSid,
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
        `CreditNote ${this.creditNoteForm.get('VoucherNumber')?.value}`,
        Validators.required,
      ],
      message: [
        'Please find attached CreditNote for your reference.\n\nThank you for your business.',
      ],
    });
  }

  async sendcreditNoteEmail() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      this.appSettingService.showWarning(
        'Please fill all required email fields correctly.',
      );
      return;
    }

    try {
      this.spinner.show();

      // Generate PDF blob
      const pdfBlob = await this.generatePDFBlob();
      if (!pdfBlob) {
        this.appSettingService.showError(
          'Failed to generate PDF. Please try again.',
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
          this.creditNoteForm.get('VoucherNumber')?.value || 'CreditNote';
        const filename = `CreditNote_${voucherNumber}.pdf`;

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
          creditNoteDetails: {
            companyName: this.currentCompany?.CompanyName || 'Company Name',
            creditNoteNumber: voucherNumber,
            creditNoteData: this.datePipe.transform(
              this.creditNoteForm.get('VoucherDate')?.value,
            ),
            totalAmount: this.getGrandTotal().toFixed(2),
            currency: this.creditNoteForm.get('CurrencyCode')?.value || '',
          },
        };

        // Call API to send email
        // this.operationService.sendCreditNoteEmail(payload).subscribe({
        //   next: (resp: any) => {
        //     this.spinner.hide();
        //     if (resp?.status) {
        //       this.appSettingService.showSuccess('creditNote email sent successfully!');
        //       this.modalService.dismissAll();
        //     } else {
        //       this.appSettingService.showError(resp?.message || 'Failed to send email.');
        //     }
        //   },
        //   error: (err) => {
        //     this.spinner.hide();
        //     console.error('Error sending email:', err);
        //     this.appSettingService.showError('Failed to send creditNote email. Please try again.');
        //   }
        // });
      };

      reader.onerror = () => {
        this.spinner.hide();
        this.appSettingService.showError(
          'Failed to process PDF. Please try again.',
        );
      };
    } catch (error) {
      this.spinner.hide();
      console.error('Error in sendCreditNoteEmail:', error);
      this.appSettingService.showError(
        'An error occurred while sending email.',
      );
    }
  }

  //   getCustomerBranchName(): string {
  //     const branchSid = this.creditNoteForm.get('PartyName')?.value;
  //     if (!branchSid) return '-';
  //     const branch = this.customerBranchList.find(b => b.CustomerBranchSid === branchSid);
  //     return branch?.CustomerBranchName || branch?.CustomerName || '-';
  //   }

  //   formatDate(date: any): string {
  //     if (!date) return '-';
  //     // Handle NgbDateStruct
  //     if (date.year && date.month && date.day) {
  //       return `${date.day.toString().padStart(2, '0')}/${date.month.toString().padStart(2, '0')}/${date.year}`;
  //     }
  //     // Handle Date object or string
  //     const d = new Date(date);
  //     if (isNaN(d.getTime())) return '-';
  //     return d.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  //   }

  getAmountInWords(total: number, currencySid: number): string {
    if (!total) return '';
    return this.numberToWords.convert(total, currencySid);
  }

  //   getCustomerName(CustomerMasterSid:number){
  //     if(!CustomerMasterSid || this.customerList.length === 0){
  //       return ' '
  //     }
  //     return (this.customerList.find(cus => cus.CustomerMasterSid === CustomerMasterSid)?.CustomerName);
  //   }

  //   getBankDetails() {
  //     console.log('DEBUG - getBankDetails');
  //     const currCode = this.creditNoteForm.get('CurrencyCode')?.value;
  //     const currentBranchId = this.currentBranch?.BranchMasterSid;
  //     const currency = this.currencyList.find(c => c.currencyCode === currCode)?.CurrencyMasterSid;
  //     console.log('DEBUG - getBankDetails - branch:', currentBranchId);
  //     console.log('DEBUG - getBankDetails - currencyCode:', currCode);
  //     console.log('DEBUG - getBankDetails - currency:', currency);
  //     console.log('DEBUG - getBankDetails - currencyid:', currency);
  //     if(!currency || !currentBranchId){
  //       this.bankDetails = null;
  //       return;
  //     }
  //     const payload = {
  //       BranchMasterSid: currentBranchId,
  //       CurrencyMasterSid: currency
  //     }
  //     this.operationService.getBankDetails(payload).subscribe({
  //       next: (resp: any) => {
  //         if (resp?.status && resp.data) {
  //           this.bankDetails = resp.data;
  //         } else {
  //           this.bankDetails = null;
  //         }
  //       },
  //       error: (err) => {
  //         console.error('Error fetching bank details', err);
  //         this.bankDetails = null;
  //       }
  //     });
  //   }

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

  getBankDetails(): Observable<any> {
    const partyCurrencyId = this.creditNoteForm
      .get('CurrencyMasterSid')
      ?.getRawValue();
    const payload = {
      CurrencyMasterSid: partyCurrencyId,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };
    return this.operationService.getBankDetails(payload);
  }

  getRowTotal(detail: any): number {
    const taxable = Number(detail.get('TaxableAmount')?.value || 0);
    const cgst = Number(detail.get('TaxAmount1')?.value || 0);
    const sgst = Number(detail.get('TaxAmount2')?.value || 0);

    return taxable + cgst + sgst;
  }

  // getPartyAmount(detail: any) {
  //   const voucherHeaderCurrency = this.creditNoteForm.get('CurrencyCode')?.value;
  //   const voucherHeaderExRate = this.creditNoteForm.get('ExchangeRate')?.value;
  //   const chargeCurrencyCode = detail.CurrencyCode;
  //   const chargeCurrencyId = this.currencyList.find(cr => detail.CurrencyCode === cr.currencyCode)?.CurrencyMasterSid;

  //   if(detail.IsAutoGenerated){
  //     return this.getFormattedAmount(toNumber(detail.PartyAmount), chargeCurrencyId);
  //   }

  //   // Same currency → no conversion
  //   if (chargeCurrencyCode === voucherHeaderCurrency) {
  //     return this.getFormattedAmount(toNumber(detail.LocalAmount), chargeCurrencyId);
  //   } else {
  //     return this.getFormattedAmount(toNumber(detail.LocalAmount) / toNumber(voucherHeaderExRate), chargeCurrencyId);
  //   }
  // }

  // public getFormattedAmount(amount: number, CurrencyMasterSid: number) {
  //   const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
  //   const input = {
  //     value: amount,
  //     currencyCode: currency?.currencyCode
  //   }
  //   return this.currencyFormatter.formatAmount(input, false);
  // }

  // patchExchangeRateForDetail(fromCurrencyCode: string, toCurrencyCode: string, index: number) {
  //   const formGroup = this.details.at(index) as FormGroup;
  //   const payload = {
  //     CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
  //     BranchMasterSid: this.currentBranch?.BranchMasterSid,
  //     fromCurrencyCode,
  //     toCurrencyCode,
  //     EffectiveFrom : this.isEditMode ? new Date(this.creditNoteData?.VoucherDate) : new Date(),
  //     segment: 'revenue'
  //   }

  //   this.operationService.getExchangeRate(payload).subscribe({
  //     next: (response: any) => {
  //       if (response?.status && response.data) {
  //         const formGroup = this.details.at(index) as FormGroup;
  //         formGroup.get('ExchangeRate')?.enable();
  //         formGroup.patchValue({ ExchangeRate: Number(response.data), });
  //         this.recalcRow(index);
  //       } else {
  //         console.warn('Exchange rate not found, defaulting to 1');
  //         formGroup.get('ExchangeRate')?.disable();
  //         formGroup.patchValue({ ExchangeRate: 1, });
  //         this.recalcRow(index);
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Error fetching exchange rate:', err);
  //       formGroup.get('ExchangeRate')?.disable();
  //       formGroup.patchValue({ ExchangeRate: 1, });
  //       this.recalcRow(index);
  //     }
  //   });
  // }

  // getTotalLocalCredits() {
  //   return (this.details.getRawValue().reduce((sum, dtl: any) => {
  //     if (dtl.DrCr === 'C') {
  //       return sum + Number(dtl.LocalAmount);
  //     }
  //     return sum;
  //   }, 0)).toFixed(2);
  // }

  // getTotalLocalDebits() {
  //   return (this.details.getRawValue().reduce((sum, dtl: any) => {
  //     if (dtl.DrCr === 'D') {
  //       return sum + Number(dtl.LocalAmount);
  //     }
  //     return sum;
  //   }, 0)).toFixed(2);
  // }

  // getNetCrDr() {
  //   return toNumber(this.getTotalLocalCredits() - this.getTotalLocalDebits()).toFixed(2);
  // }

  // getPartyCurrCreditAmt() {
  //   return (this.details.getRawValue().reduce((sum, dtl: any) => {
  //     if (dtl.DrCr === 'C') {
  //       return sum + Number(dtl.PartyAmount);
  //     }
  //     return sum;
  //   }, 0)).toFixed(2);
  // }

  // getPartyCurrDebitAmt() {
  //   return (this.details.getRawValue().reduce((sum, dtl: any) => {
  //     if (dtl.DrCr === 'D') {
  //       return sum + Number(dtl.PartyAmount);
  //     }
  //     return sum;
  //   }, 0)).toFixed(2);
  // }

  // showInfo() {
  //       if(!this.creditNoteData) return;
  //       const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
  //       modalRef.componentInstance.item = this.creditNoteData;
  //       modalRef.componentInstance.idLabel = 'Credit Note Id';
  //       modalRef.componentInstance.idValue = this.creditNoteData?.VoucherHeaderSid;
  //     }

  // getTaxDisplayConfig(): {
  //   showCGST: boolean;
  //   showSGST: boolean;
  //   showIGST: boolean;
  //   showVAT: boolean;
  // } {
  //   const gstType = this.creditNoteForm.get('GSTType')?.value;
  //   const isIndia = this.currentUserCountry === 'india';

  //   if (!isIndia) {
  //     // Non-India countries (like UAE) - show VAT only
  //     return {
  //       showCGST: false,
  //       showSGST: false,
  //       showIGST: false,
  //       showVAT: true
  //     };
  //   }

  //   // India GST logic
  //   if (gstType === 'CGST+SGST') {
  //     // Same state - show CGST and SGST
  //     return {
  //       showCGST: true,
  //       showSGST: true,
  //       showIGST: false,
  //       showVAT: false
  //     };
  //   } else if (gstType === 'IGST') {
  //     // Different state - show IGST only
  //     return {
  //       showCGST: false,
  //       showSGST: false,
  //       showIGST: true,
  //       showVAT: false
  //     };
  //   } else if (gstType === 'B2C') {
  //     // B2C - show CGST only (for B2C in India)
  //     return {
  //       showCGST: true,
  //       showSGST: false,
  //       showIGST: false,
  //       showVAT: false
  //     };
  //   } else if (gstType === 'VAT') {
  //     // VAT (shouldn't happen for India, but just in case)
  //     return {
  //       showCGST: false,
  //       showSGST: false,
  //       showIGST: false,
  //       showVAT: true
  //     };
  //   }

  //   // Default: Show all GST columns for India
  //   return {
  //     showCGST: true,
  //     showSGST: true,
  //     showIGST: true,
  //     showVAT: false
  //   };
  // }

  // getTaxPercentageForDisplay(detail: any): {
  //   cgstRate: number;
  //   sgstRate: number;
  //   vatRate: number;
  // } {
  //   const gstType = this.creditNoteForm.get('GSTType')?.value;

  //   if (gstType === 'CGST+SGST') {
  //     return {
  //       cgstRate: detail.TaxPercentage1 || 0,
  //       sgstRate: detail.TaxPercentage2 || 0,
  //       vatRate: 0
  //     };
  //   } else if (gstType === 'IGST') {
  //     return {
  //       cgstRate: detail.TaxPercentage1 || 0,
  //       sgstRate: 0,
  //       vatRate: 0
  //     };
  //   } else if (gstType === 'B2C') {
  //     return {
  //       cgstRate: detail.TaxPercentage1 || 0,
  //       sgstRate: 0,
  //       vatRate: 0
  //     };
  //   } else if (gstType === 'VAT') {
  //     return {
  //       cgstRate: 0,
  //       sgstRate: 0,
  //       vatRate: detail.TaxPercentage1 || 0
  //     };
  //   }

  //   return {
  //     cgstRate: detail.TaxPercentage1 || 0,
  //     sgstRate: detail.TaxPercentage2 || 0,
  //     vatRate: detail.TaxPercentage1 || 0
  //   };
  // }

  // getTaxAmountForDisplay(detail: any): {
  //   cgstAmt: number;
  //   sgstAmt: number;
  //   vatAmt: number;
  // } {
  //   const gstType = this.creditNoteForm.get('GSTType')?.value;

  //   if (gstType === 'CGST+SGST') {
  //     return {
  //       cgstAmt: detail.TaxAmount1 || 0,
  //       sgstAmt: detail.TaxAmount2 || 0,
  //       vatAmt: 0
  //     };
  //   } else if (gstType === 'IGST') {
  //     return {
  //       cgstAmt: detail.TaxAmount1 || 0,
  //       sgstAmt: 0,
  //       vatAmt: 0
  //     };
  //   } else if (gstType === 'B2C') {
  //     return {
  //       cgstAmt: detail.TaxAmount1 || 0,
  //       sgstAmt: 0,
  //       vatAmt: 0
  //     };
  //   } else if (gstType === 'VAT') {
  //     return {
  //       cgstAmt: 0,
  //       sgstAmt: 0,
  //       vatAmt: detail.TaxAmount1 || 0
  //     };
  //   }

  //   return {
  //     cgstAmt: detail.TaxAmount1 || 0,
  //     sgstAmt: detail.TaxAmount2 || 0,
  //     vatAmt: detail.TaxAmount1 || 0
  //   };
  // }

  // calculateTotalColspan(): number {
  //   const config = this.getTaxDisplayConfig();
  //   let baseColumns = 8; // S.No, Particulars, HSN/SAC, Curr, No of Unit, Rate, ROE, Taxable Value

  //   // Add tax columns based on what's visible
  //   if (config.showCGST) baseColumns += 2; // CGST % + CGST Amt
  //   if (config.showSGST) baseColumns += 2; // SGST % + SGST Amt
  //   if (config.showIGST) baseColumns += 2; // IGST % + IGST Amt
  //   if (config.showVAT) baseColumns += 2;  // VAT % + VAT Amt

  //   return baseColumns;
  // }

  getPkgWtVol() {
    let pkg: any = null;
    let wt: any = null;
    let vol: any = null;

    const master = this.creditNoteData?.masterJob;
    const houseCargo = this.creditNoteData?.houseJob?.Cargo?.[0];
    const bookingCargo = this.creditNoteData?.BookingHeader?.bookingCargo?.[0];

    const hasValidValue = (v: any) =>
      v !== null && v !== undefined && v !== '' && Number(v) !== 0;

    // 1️⃣ Master Job only if it has REAL values (not 0)
    if (
      master &&
      (hasValidValue(master.NoOfPkg) ||
        hasValidValue(master.GrossWeight) ||
        hasValidValue(master.Volume))
    ) {
      pkg = master.NoOfPkg;
      wt = master.GrossWeight;
      vol = master.Volume;
    }

    // 2️⃣ Otherwise House Job
    else if (houseCargo) {
      pkg = houseCargo.NoOfPackage;
      wt = houseCargo.GrossWeight;
      vol = houseCargo.Volume;
    }

    // 3️⃣ Otherwise Booking
    else if (bookingCargo) {
      pkg = bookingCargo.NoOfPackage;
      wt = bookingCargo.GrossWeight;
      vol = bookingCargo.Volume;
    }

    if (pkg == null && wt == null && vol == null) return '';

    return [pkg, wt, vol]
      .filter((v) => v !== null && v !== undefined && v !== '')
      .join(' / ');
  }

  getCurrencyExRate(): string {
    const currency = this.creditNoteData?.VoucherDetail?.[0]?.CurrencyCode;
    const exRate = this.creditNoteData?.ExchangeRate;

    const values = [];

    if (currency) values.push(currency);
    if (exRate) values.push(Number(exRate).toFixed(3));

    return values.join(' / ');
  }

  // printDiv(divId: string): void {
  //   this.showPrintLogo = true;
  //   this.showPdfLogo = false;

  //   setTimeout(() => {
  //     const printContents = document.getElementById(divId)?.innerHTML;
  //     if (!printContents) return;

  //     const popupWin = window.open('', '_blank', 'width=900,height=600');
  //     if (popupWin) {
  //       popupWin.document.open();
  //       popupWin.document.write(`
  //         <html>
  //           <head>
  //             <title>Print</title>
  //           </head>
  //           <body onload="window.print(); window.close();">
  //             ${printContents}
  //           </body>
  //         </html>
  //       `);
  //       popupWin.document.close();
  //     }
  //   }, 50); // small timeout so Angular updates DOM
  // }

  

  async openEmailModal(): Promise<void> {
    this.spinner.show();

    try {
      const blob = await this.generatePDFBlob();
      if (!blob) {
        this.appSettingService.showError('Error generating PDF. Please try again.');
        return;
      }

      const documentName = 'Credit Note';
      const voucherNumber = this.creditNoteForm.get('VoucherNumber')?.value || this.creditNoteData?.VoucherNumber || this.creditNoteData?.CreditNoteNo || '';
      const documentDate = this.formatEmailDate(this.creditNoteForm.get('VoucherDate')?.value || this.creditNoteData?.VoucherDate);
      const emailRecipients = await this.emailTriggerService.resolveCustomerBranchEmailRecipientsByMenu({
        customerBranchSid: this.getCustomerBranchSidForEmail(),
        customerMasterSid: this.getCustomerMasterSidForEmail(),
        menuMasterSid: this.getCurrentMenuMasterSidForEmail()
      });

      if (emailRecipients.toEmail.length === 0) {
        this.appSettingService.showError('No email found in customer branch email.');
        return;
      }

      const emailContent = this.emailTriggerService.buildOperationEmailContent({
        documentName,
        documentNoLabel: 'Credit Note No.',
        documentNo: voucherNumber,
        documentDate,
        pol: this.creditNotePrintData?.POL || this.creditNoteData?.POL || '',
        pod: this.creditNotePrintData?.POD || this.creditNoteData?.POD || '',
        fpd: this.creditNotePrintData?.FPD || this.creditNoteData?.FPD || '',
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const file = new File([blob], `Credit_Note_${voucherNumber || 'Report'}.pdf`, { type: 'application/pdf' });
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: emailRecipients.toEmail,
        EmailCC: emailRecipients.ccEmail,
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'Credit Note No',
          menuName: documentName,
          documentNo: voucherNumber,
          date: documentDate,
          pol: this.creditNotePrintData?.POL || this.creditNoteData?.POL || '',
          pod: this.creditNotePrintData?.POD || this.creditNoteData?.POD || '',
          fpd: this.creditNotePrintData?.FPD || this.creditNoteData?.FPD || ''
        },
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('Credit Note email error:', error);
      this.appSettingService.showError('Error preparing email');
    } finally {
      this.spinner.hide();
    }
  }

  private createEmailAuditLog(documentName: string): void {
    const payload = {
      tableName: 'VoucherHeader',
      recordId: String(this.creditNoteData?.VoucherHeaderSid || this.headerId),
      operation: 'EMAIL',
      changedBy: this.appSettingService.userSettingSource.value['userEmail'],
      changes: {
        action: 'Send Mail'
      },
      newVal: {
        Email: `${documentName} Mail Send`
      }
    };

    this.operationService.createAuditLog(payload).subscribe({
      next: () => { },
      error: (err) => console.error(err)
    });
  }

  private getCustomerBranchSidForEmail(): number | null {
    const candidates = [
      this.creditNoteForm.get('CustomerBranchSid')?.getRawValue(),
      this.creditNoteData?.CustomerBranchSid,
      this.creditNoteData?.customerBranch?.CustomerBranchSid,
      this.creditNoteData?.CustomerBranch?.CustomerBranchSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCustomerMasterSidForEmail(): number | null {
    const candidates = [
      this.creditNoteForm.get('CustomerMasterSid')?.getRawValue(),
      this.creditNoteData?.CustomerMasterSid,
      this.creditNoteData?.customerMaster?.CustomerMasterSid,
      this.creditNoteData?.CustomerMaster?.CustomerMasterSid,
      this.creditNoteData?.customerBranch?.CustomerMasterSid,
      this.creditNoteData?.CustomerBranch?.CustomerMasterSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCurrentMenuMasterSidForEmail(): number | null {
    const sid = Number(
      this.currentMenuId ||
      sessionStorage.getItem('currentMenuId') ||
      this.creditNoteData?.voucherTypeMaster?.MenuMasterSid ||
      this.creditNoteData?.MenuMasterSid
    );

    return Number.isFinite(sid) && sid > 0 ? sid : null;
  }

  private formatEmailDate(value: any): string {
    if (!value) return '';
    const date = value?.year && value?.month && value?.day
      ? new Date(value.year, value.month - 1, value.day)
      : new Date(value);

    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB');
  }

  getCreditNoteConfig: ValidationMessageConfig = {
    labels: {
      VoucherDate: 'Voucher Date',
      PartyAddress: 'Party Address',
      ExchangeRate: 'Exchange Rate',
      CreditNoteReason: 'Credit Note Reason',
      Rate: 'Rate',
      CurrencyMasterSid: 'Currency',
      LedgerMasterSid: 'Ledger',
    },

    messages: {
      required: (label: string) => `${label} is required.`,

      minlength: (label: string, error: any) =>
        `${label} must be at least ${error.requiredLength} characters.`,

      maxlength: (label: string, error: any) =>
        `${label} cannot exceed ${error.requiredLength} characters.`,

      min: (label: string, error: any) =>
        `${label} must be greater than or equal to ${error.min}.`,

      max: (label: string, error: any) =>
        `${label} must be less than or equal to ${error.max}.`,

      pattern: (label: string) => `${label} format is invalid.`,

      default: (label: string) => `Invalid value for ${label}.`,
    },
  };

  openAuditLogs() {
      if (!this.creditNoteData?.VoucherHeaderSid) return;
      const modalRef = this.modalService.open(AuditLogComponent, {
        centered: true,
        scrollable: true,
        size: 'xl',
        windowClass: 'audit-log-modal'
      });
      modalRef.componentInstance.title = 'Credit Note Logs';
      modalRef.componentInstance.tableName = 'VoucherHeader';
      modalRef.componentInstance.recordId = this.creditNoteData?.VoucherHeaderSid.toString();
      modalRef.componentInstance.screenName = 'CreditNote';
    }
}
