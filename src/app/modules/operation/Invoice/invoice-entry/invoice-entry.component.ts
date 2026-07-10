import { Component, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
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
  NgbTooltipModule,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDate,
  NgbDateStruct,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { catchError, debounceTime, distinctUntilChanged, firstValueFrom, forkJoin, map, Observable, of, Subject, take, takeUntil } from 'rxjs';
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
import { AppliedTaxMode, TaxCalculationService } from '../../services/tax-calculation.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { getDefaultTodayDate, toNgbDateStruct, toNumber } from 'src/app/common/helper';
import { VoucherPeriodValidationService, VoucherDateConstraints } from 'src/app/common/voucher-period-validation.service';
import { navigateToVoucherEntry, VoucherType } from 'src/app/common/voucher-route';
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
import { PdfFileSaveService } from 'src/app/common/pdf-file-save.service';
import { Menu } from 'angular-feather/icons';
import { AuditLogComponent } from '../../audit-log/audit-log.component';
import { DocReferenceComponent } from '../../doc-reference/doc-reference.component';
import { InvoiceService } from '../../services/invoice.service';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';
import { ExpandTextDirective } from 'src/app/core/Directives/expand-text.directive';
import { VoucherActionGuardContext, VoucherActionGuardService } from 'src/app/shared/services/voucher-action-guard.service';
import { errorLoggerWithToastr, ValidationMessageConfig } from 'src/app/common/error-handling/form-error-handler';
import { VOUCHER_FIELD_LIMITS } from 'src/app/common/voucher-field-limits';
import { InvoiceCommodityPrintComponent } from '../invoice-new/invoice-commodity-print.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';

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
    NgbTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSpinnerModule,
    NumberFormatPipe,
    CustomDatePipe,
    SearchableDropdown,
    NgbDropdownModule,
    PreventMultiClickDirective,
    DecimalPrecisionDirective,
    ElementStateGuardDirective,
    FormStateGuardDirective,
    ExpandTextDirective,
    RouterModule,
    InvoiceCommodityPrintComponent,
    PrintHeaderComponent
  ],
  templateUrl: './invoice-entry.component.html',
  styleUrl: './invoice-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
    TaxCalculationService,
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
  private taxMastersReady: Promise<void> = Promise.resolve();
  invoiceData: any;
  currentMenuId: number;
  isViewMode: boolean = false;
  get isEditMode() {
    return !!this.headerId && !this.isViewMode;
  }

  // Detail "delete" action column: visible whenever the invoice is editable
  // (create + edit), hidden at posting time / read-only / view mode.
  get showDetailDeleteColumn(): boolean {
    return !this.isViewMode && !this.isPosted && !this.isReadOnly;
  }

  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  
  // ViewChild references for modals
  @ViewChild('printModal') printModalRef: any;
  @ViewChild('emailModal') emailModalRef: any;
  @ViewChild('nonJobprintModal') nonJobPrintModalRef: any;
  
  // lookups
  customerList: any[] = [];
  customerBranchList: any[] = [];
  currencyList: any[] = [];
  chargeList: any[] = [];
  containerTypeList: any[] = [];
  filteredChargeList : any[] = [];
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
  selectedUninvoicedCharges: Set<string> = new Set();
  jobMenuMasterSid: number | null = null;
  transactionSid: number | null = null;
  
  // UI state
  selectedTab = 'Invoice';
  invoicePrintData : any;
  printTaxDisplayConfig = {
    showCGST: false,
    showSGST: false,
    showUGST: false,
    showIGST: false,
    showVAT: false,
  };
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }
  tabs = [
    { name: 'Invoice', icon: 'fas fa-file-invoice' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' },
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
  get activeInvoiceTypes() { return this.isVATMode ? this.vatInvoiceTypes : this.invoiceTypesSales; }
  
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
  // Gates the inline error label and button-disable: create=after save-click, edit=after date-change
  showVoucherDateError = false;
  
  // Declaration not exist in Vendor Invoice
  TandCFetched : boolean = false;
  TandCList: any[] = [];
  isTermsAndConditionsEnabled: boolean = true;
  isPrintAllBankEnabled: boolean = false;
  isShowCargowithContainerEnabled: boolean = false;
  isUAECompany: boolean = false;
  customsDutyLabel: string = 'Customs Duty Invoice';
  private isPrintAllBankConfigLoaded: boolean = false;
  isBankFetched : boolean = false;
  bankDetails: any;
  emailForm!: FormGroup;
  ogranzationcountry : any;
  // Unsaved changes related varaible declarations
  isDirty : boolean = false;
  isSaving : boolean = false;
  // True while a single-line soft-delete is in flight — disables every row's delete button so
  // only one delete runs at a time (concurrent deletes would each recompute the header total
  // without seeing the other's removal, leaving a stale header).
  isDeletingDetail : boolean = false;
  private initialFormValue : any = null;
  private _isInitialLoad = false;
  private destroy$ = new Subject<void>();
  private _originalHSSACValues: (number | null)[] = [];
  private _previousInvoiceType: string = 'REG';

  bookingModeCountry: string = 'india';
  private pendingBranchToSelect: number | null = null;

  // Tax display mode — delegated to TaxCalculationService
  get isIndiaGST(): boolean {
    return this.taxCalculationService.isIndiaGST;
  }

  get isVATMode(): boolean {
    return this.taxCalculationService.isVATMode;
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

  protected readonly LIMITS = VOUCHER_FIELD_LIMITS;
  private readonly invoiceValidationConfig: ValidationMessageConfig = {
    labels: {
      VoucherDate: 'Voucher Date',
      VoucherType: 'Voucher Type',
      PartyName: 'Party',
      PartyAddress: 'Party Address',
      PlaceOfSupply: 'Place of Supply',
      State: 'State',
      GST_VAT: 'GST / VAT',
      InvoiceType: 'Invoice Type',
      GSTType: 'GST Type',
      TaxType: 'Tax Type',
      CurrencyMasterSid: 'Currency',
      CurrencyCode: 'Currency',
      ExchangeRate: 'Exchange Rate',
      DocumentNumber: 'Document Number',
      HouseNumber: 'House Number',
      MasterNumber: 'Master Number',
      Narration: 'Narration',
      Remarks: 'Remarks',
      CustomsDuty: 'Customs Duty',
      Salesman: 'Salesman',
      ChargeMasterSid: 'Charge',
      ChargeDescription: 'Charge Description',
      LedgerMasterSid: 'Ledger',
      COAMasterSid: 'COA',
      HSSACMasterSid: 'HS / SAC Code',
      ChargeUOMSid: 'UOM',
      NumberOfUnit: 'Number of Units',
      DrCr: 'Debit / Credit',
      Rate: 'Rate',
      Amount: 'Amount',
      LocalAmount: 'Local Amount',
      PartyAmount: 'Party Amount',
      CostRevenue: 'Cost / Revenue',
      IRNNumber: 'IRN No',
      IRNStatus: 'IRN Status',
      HBLNo: 'HBL No',
      'voucherOthers.Footer': 'Invoice Footer',
      'voucherOthers.VoucherNote': 'Invoice Note',
      'voucherOthers.ContainerNumber': 'Container No',
    },
    messages: {
      required: (label: string) => `${label} is required`,
      maxlength: (label: string, error: any) =>
        `${label} must not exceed ${error.requiredLength} characters`,
      min: (label: string, error: any) =>
        `${label} must be greater than ${error.min}`,
      default: (label: string) => `${label} is invalid`,
    },
  };

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
    private invoiceService : InvoiceService,
    private operationService: OperationService,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private companySettings: CompanySettingsManagerService,
    public mps: MenuPermissionService,
    private commonService: CommonService,
    public taxCalculationService: TaxCalculationService,
    private currencyConfigService: CurrencyConfigurationService,
    private currencyFormatter: CurrencyFormatService,
    private pdfService: PdfDownloadService,
    private pdfMakeService: PdfMakeService,
    private toastr: ToastrService,
    public logoService: LogoService,
    private numberToWords: NumberToWordsService,
    private voucherPeriodService: VoucherPeriodValidationService,
    private pdfFileSaveService: PdfFileSaveService,
    private emailTriggerService: EmailTriggerService,
    private voucherActionGuard: VoucherActionGuardService,
    private confirmService: ModalService,
  ) {}

  copyInvoiceNumber(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const invoiceNo = this.invoiceForm?.get('VoucherNumber')?.value;
    if (!invoiceNo) {
      return;
    }
    navigator.clipboard.writeText(String(invoiceNo)).then(() => {
      this.toastr.success('Invoice No. copied to clipboard.', '', { timeOut: 1500 });
    });
  }

  copyDocumentValue(controlName: string, label: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const documentValue = this.invoiceForm?.get(controlName)?.value;
    if (!documentValue) {
      return;
    }
    navigator.clipboard.writeText(String(documentValue)).then(() => {
      this.toastr.success(`${label} copied to clipboard.`, '', { timeOut: 1500 });
    });
  }

  private getActionGuardContext(): VoucherActionGuardContext {
    return {
      documentName: 'Invoice',
      isSaving: this.isSaving,
      isEditMode: this.isEditMode,
      isReadOnly: this.isReadOnly,
      isPosted: this.isPosted,
      isDirty: this.isDirty,
      headerId: this.headerId,
      formInvalid: this.invoiceForm?.invalid,
      status: this.invoiceData?.Status ?? this.invoiceForm?.get('status')?.value,
      postStatus: this.invoiceData?.PostStatus ?? this.invoiceForm?.get('PostStatus')?.value,
      canInsert: this.mps.can('insert'),
      canUpdate: this.mps.can('update'),
      canPost: this.mps.can('post'),
    };
  }

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
        const fyEnd = new Date(currentFinancialYear.EndDate);
        const today = getDefaultTodayDate();
        this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
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
        this.isUAECompany = this.currentCompanyCountryCode === 'ae';
        if (this.isUAECompany) {
          this.loadCustomsDutyLabelConfig();
        }
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
    this.loadTermsAndConditionsConfig();
    this.loadPrintAllBankConfig();
    this.loadShowCommodityWithContainerConfig();
    this.checkVoucherPostingMechanism();
    this.initForm();
    this.loadVoucherPeriods();
    this.spinner.show();
    this.route.data.subscribe((data) => {
      this.isViewMode = data['viewMode'] === true;
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.headerId = Number(id);
    }

    // Preload tax masters for synchronous row-level calculation
    this.taxMastersReady = this.taxCalculationService.init({
      documentSide: 'SALES',
      companyCountryCode: this.currentCompanyCountryCode,
      companyCountryMasterSid: this.currentCountry,
      branchStateName: this.currentBranchStateName,
      branchStateMasterSid: this.currentBranchState?.StateMasterSid,
    }).then(() => this.taxCalculationService.fetchTaxMasters('SALES'));

    this.loadLookups().subscribe({
      next: async () => {
        await this.taxMastersReady;
        if (this.headerId) {
          this.loadInvoiceById(this.headerId);
        } else {
          this.initialFormValue = this.invoiceForm.getRawValue();
          this.subscribeToFormChanges();
          this.subscribeToValueChanges();
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Lookup error:', err);
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
      PartyName: [null, [Validators.required, Validators.maxLength(100)]],
      PartyAddress: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(300)]],
      COAMasterSid: [null],
      CustomerBranchSid: [null],
      DocumentNumber: ['', [Validators.maxLength(30)]],
      IRNNumber: ['', [Validators.maxLength(VOUCHER_FIELD_LIMITS.others.IRNNumber)]],
      MasterJobSid: [null],
      HBLNo: ['', [Validators.maxLength(VOUCHER_FIELD_LIMITS.header.HouseNumber)]],
      CurrencyMasterSid: [companyCurrencyId, Validators.required],
      CurrencyCode: [companyCurrencyCode || '', [Validators.required, Validators.maxLength(3)]],
      ExchangeRate: [
        { value: 1, disabled: true },
        [Validators.required, greaterThanZero()],
      ],
      GST_VAT: ['', [Validators.maxLength(20)]],
      PlaceOfSupply: ['', [Validators.maxLength(50)]],
      PostStatus: [''],
      GSTType: ['', [Validators.maxLength(10)]],
      InvoiceType: [null, [Validators.maxLength(10)]],
      VoucherType: [null],
      TaxType : [companyCurrencyCode === 'in' ? 'GST' : 'VAT', [Validators.maxLength(3)]],
      Narration: ['', [Validators.maxLength(300)]],
      Remarks: ['', [Validators.maxLength(300)]],
      IRNStatus: ['', [Validators.maxLength(VOUCHER_FIELD_LIMITS.others.IRNStatus)]],
      MBLNo: [{ value: '', disabled: true }],
      CustomsDuty: ['N', [Validators.maxLength(1)]],
      status: ['A', Validators.required],
      voucherDetails: this.fb.array([]),
      voucherOthers: this.fb.group({
        ContainerNumber: ['', [Validators.maxLength(VOUCHER_FIELD_LIMITS.others.ContainerNumber)]],
        VoucherNote: ['', [Validators.maxLength(VOUCHER_FIELD_LIMITS.others.VoucherNote)]],
        Footer: ['', [Validators.maxLength(VOUCHER_FIELD_LIMITS.others.Footer)]],
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
    this.invoiceForm.get('InvoiceType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((invoiceType) => {
        if (!this.invoiceForm.get('PlaceOfSupply')?.value) return;
        const ok = this.handleZeroRatedSwitch(invoiceType);
        if (!ok) {
          this.invoiceForm.get('InvoiceType')?.setValue(this._previousInvoiceType, { emitEvent: false });
          return;
        }
        this._previousInvoiceType = invoiceType;
        const classification = this.taxCalculationService.updateInvoiceType(invoiceType as any);
        this.invoiceForm.get('GSTType')?.setValue(classification.formGSTType, { emitEvent: false });
        if (this.isPosted) return;
        this.recalculateAllRows();
      });

    this.invoiceForm.get('GSTType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((gstType) => {
        if (this.isPosted) return;
        if (gstType === 'EXPWP' || gstType === 'EXPWOP') {
          this.taxCalculationService.updateSelectedGstType(gstType);
        }
        this.recalculateAllRows();
      });

    ['CurrencyCode', 'ExchangeRate'].forEach((field) => {
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

  private showBlockedAction(reason: string, resolve?: (value: boolean) => void): boolean {
    return this.voucherActionGuard.block(reason, resolve);
  }

  private getInvoiceStateBlockedReason(action: string): string {
    if (this.invoiceData?.PostStatus === 'P') return `This invoice is already posted and cannot ${action}.`;
    if (this.invoiceData?.Status !== 'A') return `Inactive invoice cannot ${action}.`;
    if (this.isReadOnly) return `This invoice cannot ${action} in its current status.`;
    return '';
  }

  private getSaveBlockedReason(): string {
    return this.voucherActionGuard.getSaveBlockedReason(this.getActionGuardContext());
  }

  private getPostBlockedReason(): string {
    return this.voucherActionGuard.getPostBlockedReason(this.getActionGuardContext());
  }

  private getResetBlockedReason(): string {
    const stateReason = this.getInvoiceStateBlockedReason('be reset');
    if (stateReason) return stateReason;
    return '';
  }

  private getPrintBlockedReason(): string {
    if (!this.invoiceData || !this.headerId) return 'Please save the invoice before printing.';
    if (this.invoiceData?.Status !== 'A') return 'Inactive invoice cannot be printed.';
    return '';
  }

  private getSendMailBlockedReason(): string {
    if (!this.invoiceData || !this.headerId) return 'Please save the invoice before sending email.';
    if (this.invoiceData?.Status !== 'A') return 'Inactive invoice cannot be sent by email.';
    return '';
  }

  private getUninvoicedChargesBlockedReason(): string {
    const stateReason = this.getInvoiceStateBlockedReason('have unbilled charges added');
    if (stateReason) return stateReason;
    return '';
  }

  private getDetailMutationBlockedReason(): string {
    return this.voucherActionGuard.getDetailMutationBlockedReason(this.getActionGuardContext());
  }

  private getChargeSelectionBlockedReason(charge: any): string {
    if (this.hasVoucherGenerated(charge)) return 'This charge is already invoiced and cannot be selected.';
    return '';
  }

  private getAddSelectedUninvoicedChargesBlockedReason(): string {
    if (this.selectedUninvoicedCharges.size === 0) return 'Please select at least one charge.';
    return '';
  }

  private getEmailSubmitBlockedReason(): string {
    if (this.emailForm?.invalid) return 'Please fill all required email fields correctly.';
    return '';
  }

  getAutoPostBlockedReason(): string {
    if (this.isSaving) return 'Invoice is currently saving. Please wait.';
    if (this.isPosted) return 'This invoice is already posted.';
    return 'Posting is handled automatically. Use Save to save and post this invoice.';
  }

  showAutoPostBlockedReason(): void {
    this.showBlockedAction(this.getAutoPostBlockedReason());
  }


  deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }



  loadLookups(): Observable<void> {
    this.spinner.show();
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const filterOption = {
      CompanyMasterSid,
      BranchMasterSid,
    };

    // 1. Critical lookups — customers and charges must be ready before invoice is loaded
    return forkJoin({
      customers: this.operationService
        .getAllDebtorWithCOAMapped(filterOption)
        .pipe(catchError((err) => of({ data: [] }))),
      charges: this.operationService
        .getAllMappedChargeCreditors(filterOption)
        .pipe(catchError((err) => of([]))),
    }).pipe(
      map(({ customers, charges }) => {
        this.customerList = customers.data || [];
        this.subledgerList = customers.data || [];
        this.chargeList = charges.data || [];

        // 2. Non-critical lookups start in the background
          forkJoin({
            currencies: this.operationService
              .getAllCurrencies()
              .pipe(catchError((err) => of([]))),
            uoms: this.operationService.getAllUom().pipe(catchError((err) => of([]))),
            containerTypes: this.operationService
              .getAllContainerTypes()
              .pipe(catchError((err) => of([]))),
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
          }).subscribe(({ currencies, uoms, containerTypes, departments, masterJobs }) => {
            this.currencyList = currencies.data || [];
            this.currencyConfigService.initializeConfigurations(this.currencyList);
            this.numberToWords.initializeCurrencies(this.currencyList);

            this.uomList = uoms.data || [];
            this.containerTypeList = Array.isArray(containerTypes)
              ? containerTypes
              : (containerTypes?.data || []);
            this.departmentList = departments.data || [];
            this.masterJobList = masterJobs.data || [];
            if(!this.isEditMode){
              this.spinner.hide();
            }
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
    const voucherDate = this.invoiceForm?.get('VoucherDate')?.value;
    this.voucherConstraints = this.voucherPeriodService.applyConstraints(voucherDate, 'AR');
  }

  private restrictDatePickerToVoucherMonth(voucherDate: any): void {
    const origDate = new Date(voucherDate);
    if (isNaN(origDate.getTime())) return;
    const y = origDate.getFullYear(), m = origDate.getMonth() + 1;
    const monthEnd = new Date(y, m, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const effectiveEnd = monthEnd < today ? monthEnd : today;
    this.fyMinDate = { year: y, month: m, day: 1 };
    this.fyMaxDate = { year: effectiveEnd.getFullYear(), month: effectiveEnd.getMonth() + 1, day: effectiveEnd.getDate() };
  }

  onVoucherDateChange(){
    this.applyVoucherDateConstraints();
    // Edit mode: reveal error label + gate button-disable now that user has changed the date
    if (this.headerId) this.showVoucherDateError = true;
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

      this.invoiceForm.get('InvoiceType')?.setValue(null);
      this.invoiceForm.get('GSTType')?.setValue('');
      return;
    }

    const customer = this.customerList.find(
      (c) => c.CustomerMasterSid === customerMasterSid
    );
    const customerCurrency = customer.currencyMaster || {};
    const countryCode = this.getCustomerCountryCode(customer);

    if (customer) {
      this.invoiceForm.patchValue({
        CustomerMasterSid: customer.CustomerMasterSid,
        PartyName: customer.CustomerName || '',
        PartyMasterSid: customer.SubledgerMasterSid || null,
        COAMasterSid: customer.COAMappedId || null,
        InvoiceType: null,
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
    const available = this.activeInvoiceTypes.map(t => t.id);
    return available.includes(mapped) ? mapped : 'REG';
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
    // Overseas party → Place of Supply is the seller's (company's) state
    const customerCountry = this.getCustomerCountry()?.toLowerCase();
    const isOverseas = customerCountry && customerCountry !== this.currentCompanyCountryCode;
    const placeOfSupply = isOverseas
      ? (this.currentBranchStateName || '')
      : (foundBranch?.stateMaster?.stateName || '');
    if (foundBranch) {
      this.invoiceForm.patchValue({
        PartyAddress: foundBranch.Address,
        PlaceOfSupply: placeOfSupply,
      });
      if (this.currentCompanyCountryCode === 'in') {
        this.invoiceForm.get('GST_VAT')?.setValue(foundBranch?.GSTNo || '');
      } else {
        this.invoiceForm.get('GST_VAT')?.setValue(foundBranch?.customerMaster?.PanType || '');
      }
      const defaultInvoiceType = this.currentCompanyCountryCode === 'in'
        ? this.getDefaultInvoiceTypeFromGstType(foundBranch?.CustomerGstType)
        : 'REG';
      this.invoiceForm.get('InvoiceType')?.setValue(defaultInvoiceType ?? null);
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

    const customerBranchSid = this.invoiceForm.get('CustomerBranchSid')?.value;
    const foundBranch = this.customerBranchList.find(
      (branch) => Number(branch.CustomerBranchSid) === Number(customerBranchSid)
    );
    const customerTaxNo = this.invoiceForm.get('GST_VAT')?.value;
    const invoiceType = this.invoiceForm.get('InvoiceType')?.value;
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

    this.invoiceForm.get('GSTType')?.setValue(classification.formGSTType);

    if (this.currentCompanyCountryCode !== 'in') {
      this.invoiceForm.get('GSTType')?.setValue('VAT');
      this.invoiceForm.get('TaxType')?.setValue('VAT');
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
      CustomsDuty: this.invoiceForm?.get('CustomsDuty')?.value,
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
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const payload = {
      VoucherHeaderSid: id,
      CompanyMasterSid,
      BranchMasterSid
    }
    this.invoiceService.getInvoiceById(payload).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          this.destroy$.next();
          this.destroy$.complete();

          this.invoiceData = resp.data;
          this.invoiceData['MBLNo'] = resp.data?.MasterNumber;
          this.invoiceData['HBLNo'] = resp.data?.HouseNumber;

          this.invoiceForm.markAsUntouched();
          this._isInitialLoad = true;
          this.patchValues(this.invoiceData);
          this.applyVoucherDateConstraints();
          this.restrictDatePickerToVoucherMonth(this.invoiceData.VoucherDate);
          this.patchDueDate();

          this.invoiceForm.get('PartyName')?.disable();
          this.invoiceForm.get('CustomerBranchSid')?.disable();
          this.invoiceForm.get('CurrencyMasterSid')?.disable();
          this.invoiceForm.get('CurrencyCode')?.disable();
          if (this.isReadOnly) {
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
            this._isInitialLoad = false;
            this.initialFormValue = this.invoiceForm.getRawValue();
            this.isDirty = false;
            this.subscribeToFormChanges();
            this.subscribeToValueChanges();
          }, 0);
        } else {
          this.spinner.hide();
          this.appSettingService.showError('Access denied.');
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

    if(data.departmentMaster){
      this.filterChargeBasedOnDept(data.departmentMaster);
    }

    if (data.CustomerMasterSid) {
      this.getCustomerBranchByCustomer(Number(data.CustomerMasterSid));
    } else {
      this.customerBranchList = [];
    }

    const mblNo = data.MBLNo || '';
    const autoNarration = mblNo
      ? `${this.isAirDepartment(data) ? 'MAWB No' : 'MBL No'}: ${mblNo}`
      : '';

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
        Narration: data.Narration || autoNarration,
        Remarks: data.Remarks || '',
        MBLNo: data.MBLNo || '',
        status: data.Status || 'A',
        
        DocumentNumber: data.DocumentNumber || '',
        IRNNumber: data.IRNNumber || '',
        IRNStatus: data.IRNStatus || '',
        VoucherType: data.VoucherType,
        CustomsDuty: data.CustomsDuty || 'N',
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
          CostRevenueChargesSid:
            det.CostRevenueChargesSid != null
              ? Number(det.CostRevenueChargesSid)
              : null,
          BookingRateSid:
            det.BookingRateSid != null
              ? Number(det.BookingRateSid)
              : det.BookingRatesSid != null
              ? Number(det.BookingRatesSid)
              : null,
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

    // Heal stale zero amounts written by an earlier missing-exchange-rate bug so bad records
    // self-correct on open (recalcRow forces rate 1 for a same-currency charge).
    this.healZeroDerivedAmounts();

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

    this.spinner.hide();
  }


  filterChargeBasedOnDept(dept: any) {
    if (!dept || !dept.departmentName) return;

    this.filteredChargeList = this.chargeList.filter(charge => {
      const allowedDepts: any[] = (charge.Departments || []);
      return allowedDepts.includes(dept.departmentName);
    })
  }

  async preparePrintData() {
    const isBookingInvoice = this.invoiceData.BookingHeaderSid;
    const isHouseJobInvoice = this.invoiceData.HouseJobSid && this.invoiceData.MasterJobSid;
    const isMasterJobInvoice = this.invoiceData.MasterJobSid && !this.invoiceData?.HouseJobSid;
    const printTaxMode = this.resolvePrintTaxMode(this.invoiceData);
    this.printTaxDisplayConfig = this.taxCalculationService.getTaxDisplayConfig();

    const allDetails: any[] = this.invoiceData.VoucherDetail || [];
    const voucherDetails = allDetails
      .filter(d => d.IsAutoGenerated !== 'Y')
      .map((detail, index) => {
        const hssacCode = this.getHSSACCode(detail.HSSACMasterSid, index);
        const taxPercentages = this.getTaxPercentageForDisplay(detail, printTaxMode);
        const taxAmounts = this.getTaxAmountForDisplay(detail, printTaxMode);

        console.log({
          cgstAmt : taxAmounts.cgstAmt,
          sgstAmt : taxAmounts.sgstAmt,
          igstAmt : taxAmounts.igstAmt,
          vatAmt : taxAmounts.vatAmt,
        })

        const totalTaxAmount = this.getFormattedAmount(
          (
            toNumber(taxAmounts.cgstAmt) +
            toNumber(taxAmounts.sgstAmt) +
            toNumber(taxAmounts.igstAmt) +
            toNumber(taxAmounts.vatAmt)),
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
          taxGroupName: detail?.hSSACMaster?.taxGroup?.TaxGroup ?? null,
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
          ugstRate: Number(taxPercentages.ugstRate).toFixed(3),
          ugstAmt: this.getFormattedAndPaddedAmount(taxAmounts.ugstAmt,this.currentCompany.CurrencyMasterSid),
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
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      IsNonJobInvoice: this.shouldUseNonJobInvoicePrintFormat(),
      invoiceTitle: this.getInvoiceTitle(),
      GSTCode: this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
      BilledTo: this.invoiceData?.PartyName || this.invoiceData?.subledgerMaster?.SubledgerName || '',
      BillingAddress: this.invoiceData?.PartyAddress || this.invoiceData?.subledgerMaster?.Address || '',
      PAN: this.invoiceData?.customerBranch?.customerMaster?.PanType.toUpperCase() || '',
      CustomerCountryCode: (this.invoiceData?.customerBranch?.customerMaster?.countryMaster?.countryCode || '').toLowerCase(),
      InvoiceNo: this.currentCompany?.CompanyMasterSid === 13
        ? `${this.invoiceData?.VoucherNumber || ''} ${this.invoiceData?.PostStatus === 'P' ? '' : '( CREATED )'}`
        : `${this.invoiceData?.VoucherNumber || ''} ${this.invoiceData?.PostStatus === 'P' ? '' : '( DRAFT )'}`,
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
      BOENo: this.getInvoiceBOENoDisplay(),
      DeclarationNo: this.getInvoiceDeclarationNoDisplay(),
      HBLNo: this.invoiceData?.houseJob?.HBLNo || '',
      MBLNo: this.invoiceData?.masterJob?.MBLNo || '',
      MasterJobNumber: this.invoiceData?.masterJob?.MasterJobNumber || '',
      MasterJobDate: this.invoiceData?.masterJob?.MasterJobDate || '',
      DocumentNumber: this.invoiceData?.DocumentNumber || '',
        ContainerType: '',
        ContainerNumber: this.getInvoiceContainerDisplay() || '',
      DepartmentMasterSid : this.invoiceData?.masterJob?.DepartmentMasterSid || '',
      isPosted : this.isPosted,
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
      JobType:isHouseJobInvoice ? this.invoiceData?.houseJob?.JobType : 
      isBookingInvoice ? this.invoiceData?.BookingHeader?.JobType : 
      isMasterJobInvoice ? this.invoiceData?.masterJob?.JobType : '',
      IsServiceJob : isHouseJobInvoice ? this.invoiceData?.houseJob?.IsServiceJob : '',
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
      InvoiceDueDate: this.invoiceData?.CustomsDuty === 'Y' ? 'Cash Invoice' : this.dueDate,
      CurrExRate: `${this.invoiceData?.CurrencyCode || ""} / ${this.getFormattedAndPaddedExchangeRate(this.invoiceData?.ExchangeRate,this.invoiceData?.CurrencyMasterSid) || ""}`,
      SalesPerson: salesmanName,
      voucherDetails: voucherDetails,
      totalPartyAmount : this.getFormattedAndPaddedAmount(totalPartyAmount,this.invoiceData?.CurrencyMasterSid),
      AmountInWords : amountInWords,
      Remarks : this.invoiceData?.Remarks,
      BankDetails : bankDetails,
      TermsAndConditions : tandc,
      packageTypeList: this.uomList || [],




       pkg: isHouseJobInvoice
  ? (this.invoiceData?.houseJob?.Cargo?.reduce(
        (total: number, item: any) =>
          total + Number(item?.NoOfPackage || 0),
        0
      ) ?? " ")
  : isBookingInvoice
    ? (this.invoiceData?.BookingHeader?.bookingCargo?.reduce(
        (total: number, item: any) =>
          total + Number(item?.NoOfPackage || 0),
        0
      ) ?? " ")
    : isMasterJobInvoice
      ? (this.invoiceData?.masterJob?.NoOfPkg ?? " ")
      : " ",
     
    grosswt: isHouseJobInvoice
  ? (
      this.invoiceData?.houseJob?.Cargo?.reduce(
        (total: number, item: any) =>
          total + Number(item?.GrossWeight || 0),
        0
      ) ?? " "
    )
  : isBookingInvoice
    ? (
        this.invoiceData?.BookingHeader?.bookingCargo?.reduce(
          (total: number, item: any) =>
            total + Number(item?.GrossWeight || 0),
          0
        ) ?? " "
      )
    : isMasterJobInvoice
      ? (this.invoiceData?.masterJob?.GrossWeight ?? " ")
      : " "
      ,
 
      desc: isHouseJobInvoice
  ? (this.invoiceData?.houseJob?.Cargo?.[0]?.CommodityDescription ?? " ")
  : isBookingInvoice
    ? (this.invoiceData?.BookingHeader?.bookingCargo?.[0]?.CommodityDescription ?? " ")
    : isMasterJobInvoice
      ? (this.invoiceData?.masterJob?.CommodityDescription ?? " ")
      : " ",
 
    ChargeableWeight: isHouseJobInvoice
  ? (
      this.invoiceData?.houseJob?.Cargo?.reduce(
        (total: number, item: any) =>
          total + Number(item?.ChargeableWeight || 0),
        0
      ) ?? " "
    )
  : isBookingInvoice
    ? (
        this.invoiceData?.BookingHeader?.bookingCargo?.reduce(
          (total: number, item: any) =>
            total + Number(item?.ChargeableWeight || 0),
          0
        ) ?? " "
      )
    : isMasterJobInvoice
      ? (this.invoiceData?.masterJob?.ChargeableWeight ?? " ")
      : " ",
 
    cbm: isHouseJobInvoice
  ? (this.invoiceData?.houseJob?.Cargo?.reduce(
        (total: number, item: any) => 
          total + Number(item?.Volume || 0),
        0
      ) ?? " ")
  : isBookingInvoice
    ? (this.invoiceData?.BookingHeader?.bookingCargo?.reduce(
        (total: number, item: any) => 
          total + Number(item?.Volume || 0),
        0
      ) ?? " ")
    : isMasterJobInvoice
      ? (this.invoiceData?.masterJob?.Volume ?? " ")
      : " ",
    }


    
   
    
  } 

  protected shouldUseNonJobInvoicePrintFormat(): boolean {
    return Number(this.currentCompany?.CompanyMasterSid || 0) === 24;
  }

  private getInvoiceDeclarationNoDisplay(): string {
    const declarationList = this.invoiceData?.houseJob?.houseJobBOE;

    if (!Array.isArray(declarationList)) {
      return '';
    }

    return declarationList
      .map((boe: any) => String(boe?.DeclarationNo).trim())
      .filter((declarationNo: string) => declarationNo)
      .join(', ');
  }

  private getInvoiceBOENoDisplay(): string {
    const boeList = this.invoiceData?.houseJob?.houseJobBOE;

    if (!Array.isArray(boeList)) {
      return '';
    }

    return boeList
      .map((boe: any) => String(boe?.BOENo).trim())
      .filter((boeNo: string) => boeNo)
      .join(', ');
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
    const airDept = this.isAirDepartment(data);
    const isHouseJobInvoice = data.HouseJobSid;
    const isMasterJobInvoice = data.MasterJobSid && !data.HouseJobSid;
    const isBookingInvoice = !!data.BookingHeaderSid;
    const isAgentHouseJob = String(data?.houseJob?.JobType || '') === 'Agent';
    const invoiceServiceFlag = String(data?.IsServiceJob ?? '').trim().toUpperCase();
    const houseServiceFlag = String(data?.houseJob?.IsServiceJob ?? '').trim().toUpperCase();
    const isServiceJobInvoice = invoiceServiceFlag
      ? invoiceServiceFlag === 'Y'
      : houseServiceFlag === 'Y';

    if(isHouseJobInvoice){
      this.hyperLinkInfo = {
        id : data?.HouseJobSid,
        number : isAgentHouseJob
          ? (data?.masterJob?.MasterJobNumber || data?.MasterNumber || '')
          : data?.houseJob?.HBLNo,
        path : isAgentHouseJob
          ? `/operation/agent-master-air-waybill/entry/${data.HouseJobSid}`
          : (isServiceJobInvoice
            ? `/operation/service-job/entry/${data.HouseJobSid}`
            : `/${this.getHouseJobRouteSegment(data)}/entry/${data.HouseJobSid}`),
        label : isAgentHouseJob ? 'AMWBL No.' : (airDept ? 'HAWBL No.' : 'HBL No.')
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
        DocumentTypeCode: VoucherType.INVOICE,
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
    if (this.showBlockedAction(this.getDetailMutationBlockedReason())) return;

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
    this._originalHSSACValues.push(null);
    this.onDetailChange(this.details.length - 1, 'CurrencyCode');
    this.invoiceForm.updateValueAndValidity();
  }


  createDetailGroup(data?: any): FormGroup {
    const group = this.fb.group({
      VoucherDetailSid: [data?.VoucherDetailSid || null],
      ChargeMasterSid: [data?.ChargeMasterSid || null, Validators.required],
      ChargeDescription: [data?.ChargeDescription || '', [Validators.maxLength(100)]],
      HSSACMasterSid: [data?.HSSACMasterSid || null],
      ChargeUOMSid: [data?.ChargeUOMSid || null],
      NumberOfUnit: [
        data?.NumberOfUnit || 1,
        [Validators.required, Validators.min(0)],
      ],
      DrCr: [data?.DrCr || 'C', [Validators.required, Validators.maxLength(50)]],
      CurrencyMasterSid: [
        data?.CurrencyMasterSid ||
          this.invoiceForm.get('CurrencyMasterSid')?.value ||
          null,
      ],
      CurrencyCode: [
        data?.CurrencyCode ||
          this.invoiceForm.get('CurrencyCode')?.value ||
          null,
        [Validators.maxLength(3)]
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
      CostRevenueChargesSid: [data?.CostRevenueChargesSid || null],
      BookingRateSid: [data?.BookingRateSid || null]
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
  async removeDetailRow(index: number) {
    if (this.isDeletingDetail) return;   // a delete is already in flight — ignore (one at a time)
    if (this.showBlockedAction(this.getDetailMutationBlockedReason())) return;

    const row = this.details.at(index) as FormGroup;
    const voucherDetailSid = row?.get('VoucherDetailSid')?.value;

    // Unsaved row → remove locally only (no API; its charge link is created on save).
    if (!voucherDetailSid) {
      this.spliceDetailRow(index);
      return;
    }

    // Saved row → confirm, then delete server-side (soft-delete + un-link the charge).
    const confirmed = await this.confirmService.confirm(
      'Are you sure you want to delete this charge line? This cannot be undone.',
      'Delete Charge Line',
      'Delete',
    );
    if (!confirmed) return;

    // Recompute the header total over the surviving rows (all rows except the one being deleted),
    // using the same formula as Save, and persist it alongside the soft-delete so the header
    // doesn't go stale until the next Save.
    const remainingRows = this.details.controls
      .filter((_, i) => i !== index)
      .map((c) => c.getRawValue());
    const { Amount, LocalAmount } = this.computeHeaderAmounts(remainingRows);

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      UpdatedBy: this.currUserEmail,
      Amount,        // header total in party currency, surviving lines only
      LocalAmount,   // header total in local currency, surviving lines only
    };

    this.isDeletingDetail = true;
    this.invoiceService.deleteInvoiceDetail(Number(voucherDetailSid), payload).subscribe({
      next: (resp: any) => {
        this.isDeletingDetail = false;
        if (resp?.status) {
          this.dropDetailFromBaseline(Number(voucherDetailSid));
          this.spliceDetailRow(index);
          this.toastr.success('Charge line deleted.');
        } else {
          this.appSettingService.showError(resp?.message || 'Failed to delete charge line.');
        }
      },
      error: () => {
        this.isDeletingDetail = false;
        this.appSettingService.showError('Failed to delete charge line.');
      },
    });
  }

  private spliceDetailRow(index: number) {
    if (this.details.length > index) this.details.removeAt(index);
    if (this._originalHSSACValues.length > index) this._originalHSSACValues.splice(index, 1);
    this.invoiceForm.updateValueAndValidity();
    this.recalculateAllRows();
  }

  /**
   * Drop the just-deleted (already persisted) detail from the unsaved-changes baseline so the
   * guard doesn't flag this server-side deletion, while preserving any genuine pending edits.
   */
  private dropDetailFromBaseline(voucherDetailSid: number) {
    const details = this.initialFormValue?.voucherDetails;
    if (!Array.isArray(details)) return;
    this.initialFormValue.voucherDetails = details.filter(
      (d: any) => Number(d?.VoucherDetailSid) !== Number(voucherDetailSid),
    );
  }

  /**
   * Header Amount (party currency) + LocalAmount (local currency) computed from the given detail
   * rows. This is the single source of truth for the header total — used both by the Save payload
   * and by the single-line delete, so deleting a charge line never diverges from a Save.
   * Header currency context (local ccy, party ccy, exchange rate) is read from the form.
   */
  private computeHeaderAmounts(
    rows: Array<{ LocalAmount: any; TaxAmount1: any; TaxAmount2: any; DrCr: any }>,
  ): { Amount: number; LocalAmount: number } {
    const raw = this.invoiceForm.getRawValue();
    const localCurrencySid = this.currentCompany?.CurrencyMasterSid;
    const headerCurrencySid = raw.CurrencyMasterSid;
    const headerExchangeRate = raw.ExchangeRate != null ? Number(raw.ExchangeRate) : 1;

    let totalLocalAmountWithTax = 0;
    for (const r of rows) {
      const rowTotal = toNumber(r.LocalAmount) + toNumber(r.TaxAmount1) + toNumber(r.TaxAmount2);
      totalLocalAmountWithTax += r.DrCr === 'C' ? rowTotal : -rowTotal;
    }

    const LocalAmount = toNumber(this.getFormattedAmount(totalLocalAmountWithTax, localCurrencySid));
    const Amount = localCurrencySid === headerCurrencySid
      ? LocalAmount
      : toNumber(this.getFormattedAmount(totalLocalAmountWithTax / headerExchangeRate, headerCurrencySid));
    return { Amount, LocalAmount };
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
  /** A computed amount is invalid when it is null / undefined / blank / NaN, or exactly zero.
   *  Strict: NO tolerance — a tiny non-zero decimal (e.g. 0.0005) is treated as valid. */
  private isBlankOrZero(v: any): boolean {
    if (v === null || v === undefined || v === '') return true;
    const n = parseFloat(v);
    return isNaN(n) || n === 0;
  }

  /** True when the row has an Amount but its Local or Party amount is zero or null/blank.
   *  Drives the red highlight on the row's ExchangeRate input. */
  isRowAmountInvalid(index: number): boolean {
    const row = this.details.at(index)?.getRawValue();
    if (!row) return false;
    const amount = parseFloat(row.Amount);
    if (isNaN(amount) || amount <= 0) return false; // rule applies only when Amount > 0 (strict)
    return this.isBlankOrZero(row.LocalAmount) || this.isBlankOrZero(row.PartyAmount);
  }

  /** Zero-local + zero-party guards, shared by save (onSubmit) and post (postVoucher).
   *  Validates `rows` (defaults to the live form). A direct post writes the stored details, not the
   *  form, so postVoucher passes the persisted rows. Returns true (and shows a toastr) on a violation. */
  private hasDetailAmountViolation(
    resolve?: (value: boolean) => void,
    rows?: any[]
  ): boolean {
    const source = rows ?? this.details.getRawValue();

    // Every charge row must have a non-zero (and non-null) local amount.
    const zeroAmountRows: string[] = [];
    source.forEach((row: any, i: number) => {
      if (this.isBlankOrZero(row.LocalAmount)) {
        zeroAmountRows.push(row.ChargeDescription || `Row ${i + 1}`);
      }
    });
    if (zeroAmountRows.length > 0) {
      this.appSettingService.showError(
        `The following charge rows have a zero local amount:<br>${zeroAmountRows.map(r => `&bull; ${r}`).join('<br>')}<br><br>All charges must have a non-zero local amount.`,
        'Zero Amount — Validation Failed',
        { closeButton: true, enableHtml: true }
      );
      if (resolve) resolve(false);
      return true;
    }

    // When an amount is entered, the party amount must be greater than zero (strict, null-aware).
    const zeroPartyRows: string[] = [];
    source.forEach((row: any, i: number) => {
      const amount = parseFloat(row.Amount);
      if (isNaN(amount) || amount <= 0) return; // rule applies only when Amount > 0 (strict)
      if (this.isBlankOrZero(row.PartyAmount)) {
        zeroPartyRows.push(row.ChargeDescription || `Row ${i + 1}`);
      }
    });
    if (zeroPartyRows.length > 0) {
      this.appSettingService.showError(
        `The following charge rows have an amount but a zero/blank party amount:<br>${zeroPartyRows.map(r => `&bull; ${r}`).join('<br>')}<br><br>When an amount is entered, the party amount must be greater than zero. Please check the exchange rate.`,
        'Zero Party Amount — Validation Failed',
        { closeButton: true, enableHtml: true }
      );
      if (resolve) resolve(false);
      return true;
    }

    return false;
  }

  /** Recompute any row whose derived Local/Party went stale (0/blank) while it still has an Amount.
   *  recalcRow forces rate 1 for a same-currency charge, so a missing self-pair Exchange master row
   *  (e.g. AED->AED) heals to the correct amount. Runs on edit-load AND at save, so the persisted
   *  payload never carries a stale zero. Skipped for posted (immutable) vouchers. */
  private healZeroDerivedAmounts(): void {
    if (this.isPosted) return;
    for (let i = 0; i < this.details.length; i++) {
      const r = this.details.at(i).getRawValue();
      const amt = parseFloat(r.Amount);
      if (isNaN(amt) || amt <= 0) continue;
      if (this.isBlankOrZero(r.LocalAmount) || this.isBlankOrZero(r.PartyAmount)) {
        this.recalcRow(i);
      }
    }
  }

  private recalcRow(index: number) {
    const row = this.details.at(index);
    if (!row) return;
    if (this.isPosted) return;

    const rawValue = row.getRawValue();
    const unit = toNumber(row.get('NumberOfUnit')?.value || 0);
    const rate = toNumber(
      this.getFormattedAmount(row.get('Rate')?.value || 0, rawValue.CurrencyMasterSid)
    );
    // Same currency as company always uses rate 1 — a missing AED->AED Exchange master row must NOT
    // collapse LocalAmount/PartyAmount to 0. Otherwise use the row's exchange rate.
    const isSameAsCompany =
      rawValue.CurrencyMasterSid != null &&
      Number(rawValue.CurrencyMasterSid) === Number(this.currentCompany?.CurrencyMasterSid);
    const exRate = isSameAsCompany
      ? 1
      : toNumber(
          this.getFormattedExchangeRate(row.get('ExchangeRate')?.value || 0, rawValue.CurrencyMasterSid)
        );

    const amount = unit * rate;
    const taxableAmount = amount * exRate;
    const localAmount = amount * exRate;

    // Synchronous tax calculation via preloaded TaxMasters
    const HSSACMasterSid = row.get('HSSACMasterSid')?.value;
    const hssacItem = (this.hssacList[index] || []).find(
      (c: any) => c.HSSACMasterSid === HSSACMasterSid
    );
    const taxResult = this.taxCalculationService.calculateRowTax({
      taxableAmount,
      taxGroupSid: hssacItem?.TaxGroupSid,
    });

    const companyCurrency = this.currentCompany?.CurrencyMasterSid;
    row.get('Amount')?.setValue(
      toNumber(this.getFormattedAmount(amount, rawValue.CurrencyMasterSid))
    );
    row.get('TaxableAmount')?.setValue(
      toNumber(this.getFormattedAmount(taxableAmount, companyCurrency))
    );
    row.get('TaxPercentage1')?.setValue(taxResult.TaxPercentage1);
    row.get('TaxAmount1')?.setValue(
      toNumber(this.getFormattedAmount(taxResult.TaxAmount1, companyCurrency))
    );
    row.get('TaxPercentage2')?.setValue(taxResult.TaxPercentage2);
    row.get('TaxAmount2')?.setValue(
      toNumber(this.getFormattedAmount(taxResult.TaxAmount2, companyCurrency))
    );
    // Store as clean numbers (rounded to the currency's decimals) — NOT masked strings. The template
    // re-masks via getFormattedAmount for display; storing "20,000.00" here makes Number(...) NaN in
    // the save payload (JSON serialises NaN -> null), which zeroed Local/Party on save.
    row.get('LocalAmount')?.setValue(toNumber(this.getFormattedAmount(localAmount, companyCurrency)));
    row.get('PartyAmount')?.setValue(toNumber(this.getPartyAmount(index)));

    this.updateBillAmount();
    this.invoiceForm.updateValueAndValidity();
    this.updateInvoiceTypeRequired();
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
    this.updateInvoiceTypeRequired();
  }

  get isInvoiceTypeRequired(): boolean {
    return this.invoiceForm?.get('InvoiceType')?.hasValidator(Validators.required) ?? false;
  }

  updateInvoiceTypeRequired(): void {
    const hasActiveTax = this.details.controls.some((ctrl, i) => {
      const hssacSid = (ctrl as FormGroup).get('HSSACMasterSid')?.value;
      if (!hssacSid) return false;
      const hssacItem = (this.hssacList[i] || []).find((h: any) => h.HSSACMasterSid === hssacSid);
      return !!hssacItem?.TaxGroupSid;
    });
    const ctrl = this.invoiceForm.get('InvoiceType');
    if (hasActiveTax) {
      ctrl?.setValidators([Validators.required]);
    } else {
      ctrl?.clearValidators();
    }
    ctrl?.updateValueAndValidity({ emitEvent: false });
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
      const drCr = this.details.at(i).get('DrCr')?.value;
      if(drCr === 'C') {
        total += taxAmt1 + taxAmt2;
      } else {
        total -= taxAmt1 + taxAmt2;
      }
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
      if (masterJob.MBLNo && !this.invoiceForm.get('Narration')?.value) {
        const isAir = String(masterJob.departmentMaster?.departmentType ?? masterJob.DepartmentType ?? '').trim().toUpperCase() === 'AIR';
        this.invoiceForm.get('Narration')?.setValue(`${isAir ? 'MAWB No' : 'MBL No'}: ${masterJob.MBLNo}`);
      }
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
            if (!patch && this.invoiceForm.get('InvoiceType')?.value === 'NONGST') {
              const zeroRated = this.taxCalculationService.findZeroRatedHSSAC(res.data);
              if (zeroRated) {
                this._originalHSSACValues[index] = this.details.at(index).get('HSSACMasterSid')?.value;
                this.details.at(index).get('HSSACMasterSid')?.disable({ emitEvent: false });
              }
            }
            if (patch) {
              this.details.at(index).patchValue({
                HSSACMasterSid: res.data[0]?.HSSACMasterSid || null,
              });
              this.recalcRow(index);
              // If NONGST mode, override with zero-rated HSSAC
              if (this.invoiceForm.get('InvoiceType')?.value === 'NONGST') {
                const zeroRated = this.taxCalculationService.findZeroRatedHSSAC(res.data);
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
    if (this.showBlockedAction(this.getSaveBlockedReason(), resolve)) return;

    // Refresh any row whose derived Local/Party went stale (0/blank) before validating and building
    // the payload — a same-currency charge with no self-pair Exchange master row heals to rate 1.
    this.healZeroDerivedAmounts();

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
      if (this.voucherConstraints.errorMessage) this.appSettingService.showWarning(this.voucherConstraints.errorMessage);
      if (resolve) resolve(false);
      return;
    }

    // Zero Rated guard: every row must have a zero-rated HSSAC applied
    if (this.invoiceForm.get('InvoiceType')?.value === 'NONGST') {
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

    // --- Zero/blank local & party amount guards (shared with post-time validation) ---
    if (this.hasDetailAmountViolation(resolve)) return;

    // --- Zero net amount guard ---
    let totalCredit = 0;
    let totalDebit = 0;
    for (let i = 0; i < this.details.length; i++) {
      const row = this.details.at(i).getRawValue();
      const amt = parseFloat(row.LocalAmount) || 0;
      if (row.DrCr === 'C') totalCredit += amt;
      else totalDebit += amt;
    }
    if (Math.abs(totalCredit - totalDebit) < 0.001) {
      this.appSettingService.showError(
        'The net amount of this invoice is zero (total credits equal total debits). Please review the charge amounts before saving.',
        'Zero Net Amount — Validation Failed',
        { closeButton: true, enableHtml: true }
      );
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
      errorLoggerWithToastr(this.invoiceForm, this.toastr, this.invoiceValidationConfig);
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
          // toNumber (not Number) for every money field — strips the per-currency thousands separator so
          // a masked value like "20,000.00" parses to 20000 instead of NaN (which JSON serialises to null).
          Rate: toNumber(d.Rate),
          ExchangeRate:
            d.ExchangeRate != null
              ? toNumber(d.ExchangeRate)
              : raw.ExchangeRate != null
              ? toNumber(raw.ExchangeRate)
              : 1,
          Amount: toNumber(d.Amount),
          TaxableAmount:
            d.TaxableAmount != null
              ? toNumber(d.TaxableAmount)
              : toNumber(d.Amount),
          TaxPercentage1:
            d.TaxPercentage1 != null ? Number(d.TaxPercentage1) : 0,
          TaxAmount1: toNumber(d.TaxAmount1),
          TaxPercentage2:
            d.TaxPercentage2 != null ? Number(d.TaxPercentage2) : 0,
          TaxAmount2: toNumber(d.TaxAmount2),
          LocalAmount: toNumber(d.LocalAmount),
          PartyAmount: toNumber(d.PartyAmount),
          MasterJobSid: d.MasterJobSid ? Number(d.MasterJobSid) : null,
          HouseJobSid: d.HouseJobSid ? Number(d.HouseJobSid) : null,
          YearMasterSid: YearMasterSid,
          CostRevenueChargesSid: d.CostRevenueChargesSid ? Number(d.CostRevenueChargesSid) : null,
          BookingRateSid: d.BookingRateSid ? Number(d.BookingRateSid) : null
        };
        return detail;
      }
    );

    const rawVoucherOthers = raw.voucherOthers
      ? { ...raw.voucherOthers }
      : null;

    const voucherOthersCandidate =
      this.buildVoucherOthersPayload(rawVoucherOthers);

    // Calculate header Amount (party currency) and LocalAmount (local currency)
    const { Amount: headerAmount, LocalAmount: headerLocalAmount } =
      this.computeHeaderAmounts(voucherDetailArray);

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
      State: this.taxCalculationService.context?.taxCategory || 'Inter',
      CurrencyMasterSid: raw.CurrencyMasterSid ?? null,
      PostStatus: raw.PostStatus || 'U',
      CurrencyCode: raw.CurrencyCode || undefined,
      ExchangeRate:
        raw.ExchangeRate != null ? Number(raw.ExchangeRate) : undefined,
      Amount: headerAmount,
      LocalAmount: headerLocalAmount,
      MasterJobSid: raw.MasterJobSid ?? null,
      HouseJobSid: raw.HouseJobSid ? Number(raw.HouseJobSid) : null,
      Narration: raw.Narration !== undefined ? raw.Narration : undefined,
      status: raw.status != null ? raw.status : 'A',
      VoucherDetail:
      voucherDetailArray.length > 0 ? voucherDetailArray : undefined,
      YearMasterSid: YearMasterSid,

      DocumentNumber: raw.DocumentNumber || undefined,
      Remarks: raw.Remarks || undefined,
      CustomsDuty: raw.CustomsDuty || 'N',
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
      this.invoiceService.updateInvoiceById(this.headerId, payload).subscribe({
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
          this.appSettingService.showError(error?.error?.message || 'Failed to update invoice');
          this.isSaving = false;
          if (resolve) resolve(false);
          this.spinner.hide();
        }
      })
    } else {
      this.invoiceService.createInvoice(payload).subscribe({
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
              this.loadInvoiceById(this.headerId);
              this.navigateAfterCreate(this.headerId);
            }
          } else {
            this.appSettingService.showError(resp.message);
            if (resolve) resolve(false);
            this.spinner.hide();
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.appSettingService.showError(error?.error?.message || 'Failed to create invoice');
          if (resolve) resolve(false);
          this.spinner.hide();
        }
      })
    }
  }

  async postVoucher(notFromSubmit: boolean = false) : Promise<void> {
    if (this.showBlockedAction(this.getPostBlockedReason())) return;

    this.applyVoucherDateConstraints();
    if (this.voucherConstraints.isClosed) {
      if (this.voucherConstraints.errorMessage) this.appSettingService.showWarning(this.voucherConstraints.errorMessage);
      return;
    }

    // Post-time amount validation — posting is immutable. A direct Post (notFromSubmit) writes the
    // STORED details, so validate the persisted rows; the save-then-post path validates the just-saved
    // form. Either way a zero/blank local or party amount blocks the post.
    const rowsForPost = notFromSubmit ? (this.invoiceData?.VoucherDetail || []) : undefined;
    if (this.hasDetailAmountViolation(undefined, rowsForPost)) return;

    try {
      this.isSaving = true;
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
          EffectiveFrom: this.invoiceForm.get('VoucherDate')?.getRawValue() ?? new Date().toISOString(),
          TaxType: 'Output',
          IsUnionTerritory: this.taxCalculationService.context?.appliedTaxMode === 'CGST_UGST',
          CustomerGstType: this.taxCalculationService.context?.party?.customerGstType || '',
        },
      };

      const result = await firstValueFrom(
        this.operationService.postVoucherByVoucherSid(postPayload)
      );
      this.isSaving = false;
      if(result.status) {
        this.appSettingService.showSuccess(result.message);
        this.invoiceData.PostStatus = 'P';
        if (notFromSubmit) {
          this.loadInvoiceById(this.headerId);
        }
      } else {
        this.spinner.hide();
        this.appSettingService.showError(result.message);
      }
    } catch (error) {
      console.error('Post voucher error:', error);
      this.isSaving = false;
      this.spinner.hide();
      this.appSettingService.showError(error?.error?.message || 'Failed to post invoice. Please try again.');
      return null;
    }
  }

  get isPosted(): boolean {
    return this.invoiceData?.PostStatus === 'P' || false;
  }

  get isReadOnly(): boolean {
    if(!this.isEditMode) return false;
    return this.invoiceData?.PostStatus !== 'U' || this.invoiceData?.Status !== 'A';
  }

  get printButtonStatus() : boolean {
    return this.invoiceData?.PostStatus !== 'P' || this.invoiceData?.Status !== 'A';
  }

  // Check if voucher is draft
  get isDraft(): boolean {
    return (
      !this.invoiceData?.PostStatus || this.invoiceData?.PostStatus === 'U'
    );
  }

  onReset() {
    if (this.showBlockedAction(this.getResetBlockedReason())) return;

    this.invoiceForm.reset({ status: 'A' });
  }

  async sendManualMail(): Promise<void> {
    this.spinner.show();
    const pdfBlob = await this.generatePDFBlob();
    let attachmentFile: File | undefined;
    if (pdfBlob) {
      attachmentFile = new File([pdfBlob], (this.invoiceData?.InvoiceNo || 'Invoice') + '.pdf', { type: 'application/pdf' });
    }
    const menuMasterSid = this.getCurrentMenuMasterSidForEmail();
    const recipients = await this.emailTriggerService.resolveCustomerBranchEmailRecipientsByMenu({
      customerBranchSid: this.getCustomerBranchSidForEmail(),
      customerMasterSid: this.getCustomerMasterSidForEmail(),
      menuMasterSid
    });
    const toEmail = recipients.toEmail.join(', ');
    const ccEmail = Array.from(
      new Set(
        (recipients.ccEmail || [])
          .map((email: string) => (email || '').trim())
          .filter((email: string) => !!email)
      )
    ).join(', ');

    this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid: menuMasterSid || this.currentMenuId,
      action: 'UPDATE',
      attachmentFile,
      context: {
        allowManualEmailEntry: true,
        requireToEmail: false,
        menuMasterSid,
        customerBranchSid: this.getCustomerBranchSidForEmail(),
        customerMasterSid: this.getCustomerMasterSidForEmail(),
        userName: this.userData?.userName,
        toEmail,
        ccEmail
      }
    });
    const payload = {
        tableName: 'VoucherHeader',
        recordId: String(this.invoiceData?.VoucherHeaderSid),
        operation: 'EMAIL',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'Email Send'
        },
        newVal: {
          Email: 'Invoice Email Send',
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
      this.spinner.hide();
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

  getHouseJobNumberByRow(detailIndex: number): string {
    const row = this.details.at(detailIndex) as FormGroup;
    const houseJobSid = Number(row?.get('HouseJobSid')?.value || 0);
    if (!houseJobSid) {
      return '-';
    }

    const matchedHouseJob = (this.houseJobList[detailIndex] || []).find(
      (job: any) => Number(job?.HouseJobSid) === houseJobSid
    );

    return matchedHouseJob?.HBLNo || matchedHouseJob?.HouseJobNumber || '-';
  }

  navigateToDetailMasterJob(detailIndex: number): void {
    const row = this.details.at(detailIndex) as FormGroup;
    const masterJobSid = Number(row?.get('MasterJobSid')?.value || 0);
    if (!masterJobSid) {
      this.appSettingService.showWarning('Master Job not available');
      return;
    }

    const detailContext = this.getDetailNavigationContext(detailIndex, row);
    if (detailContext.isAgentHouseJob && detailContext.houseJobSid) {
      this.router.navigate(['/operation/agent-master-air-waybill/entry', detailContext.houseJobSid]);
      return;
    }

    if (detailContext.isServiceJob && detailContext.houseJobSid) {
      this.router.navigate(['/operation/service-job/entry', detailContext.houseJobSid]);
      return;
    }

    if (detailContext.departmentType === 'AIR') {
      this.router.navigate(['/operation/mawbill/entry', masterJobSid]);
      return;
    }

    this.router.navigate(['/operation/master-job/entry', masterJobSid]);
  }

  navigateToDetailHouseJob(detailIndex: number): void {
    const row = this.details.at(detailIndex) as FormGroup;
    const houseJobSid = Number(row?.get('HouseJobSid')?.value || 0);
    if (!houseJobSid) {
      this.appSettingService.showWarning('House Job not available');
      return;
    }

    const detailContext = this.getDetailNavigationContext(detailIndex, row);
    if (detailContext.isAgentHouseJob) {
      this.router.navigate(['/operation/agent-master-air-waybill/entry', houseJobSid]);
      return;
    }

    if (detailContext.isServiceJob) {
      this.router.navigate(['/operation/service-job/entry', houseJobSid]);
      return;
    }

    if (detailContext.departmentType === 'AIR') {
      this.router.navigate(['/operation/hawb-bill/entry', houseJobSid]);
      return;
    }

    this.router.navigate(['/operation/house-job/entry', houseJobSid]);
  }

  private getDetailNavigationContext(detailIndex: number, row: FormGroup): {
    departmentType: string;
    houseJobSid: number;
    isAgentHouseJob: boolean;
    isServiceJob: boolean;
  } {
    const houseJobSid = Number(row?.get('HouseJobSid')?.value || 0);
    const matchedHouseJob = (this.houseJobList[detailIndex] || []).find(
      (job: any) => Number(job?.HouseJobSid) === houseJobSid
    );

    const jobType = String(
      matchedHouseJob?.JobType ??
      this.invoiceData?.houseJob?.JobType ??
      ''
    ).trim();
    const isAgentHouseJob = jobType === 'Agent';

    const detailServiceFlag = String(row?.get('IsServiceJob')?.value ?? '').trim().toUpperCase();
    const houseServiceFlag = String(matchedHouseJob?.IsServiceJob ?? '').trim().toUpperCase();
    const invoiceServiceFlag = String(this.invoiceData?.IsServiceJob ?? '').trim().toUpperCase();
    const invoiceHouseServiceFlag = String(this.invoiceData?.houseJob?.IsServiceJob ?? '').trim().toUpperCase();
    const isServiceJob =
      detailServiceFlag === 'Y' ||
      houseServiceFlag === 'Y' ||
      invoiceServiceFlag === 'Y' ||
      invoiceHouseServiceFlag === 'Y';

    return {
      departmentType: this.getDetailDepartmentType(row),
      houseJobSid,
      isAgentHouseJob,
      isServiceJob,
    };
  }

  private getDetailDepartmentType(row: FormGroup): string {
    const departmentMasterSid = Number(row?.get('DepartmentMasterSid')?.value || 0);
    const department = this.departmentList.find(
      (d: any) => Number(d?.DepartmentMasterSid) === departmentMasterSid
    );

    return String(department?.departmentType || '').trim().toUpperCase();
  }

  // Print Modal Methods
  async openPrintModal() {
  if (this.showBlockedAction(this.getPrintBlockedReason())) return;

  this.spinner.show();

  try {
    await this.preparePrintData();
    console.log("PRINT DATA", this.invoicePrintData);
    
    const modalToOpen = this.shouldUseNonJobInvoicePrintFormat()
      ? this.nonJobPrintModalRef 
      : this.printModalRef;
    
    this.modalService.open(modalToOpen, {
      size: 'xl',
      scrollable: true
    });

  } finally {
    this.spinner.hide();
  }
}


  async openEmailModal(): Promise<void> {
    if (this.showBlockedAction(this.getSendMailBlockedReason())) return;

    this.spinner.show();

    try {
      const blob = await this.generatePDFBlob();
      if (!blob) {
        this.appSettingService.showError('Error generating PDF. Please try again.');
        return;
      }

      const documentName = 'Invoice';
      const voucherNumber = this.invoiceForm.get('VoucherNumber')?.value || this.invoiceData?.VoucherNumber || this.invoiceData?.InvoiceNo || '';
      const documentDate = this.formatEmailDate(this.invoiceForm.get('VoucherDate')?.value || this.invoiceData?.VoucherDate);
      const recipients = await this.emailTriggerService.resolveCustomerBranchEmailRecipientsByMenu({
        customerBranchSid: this.getCustomerBranchSidForEmail(),
        customerMasterSid: this.getCustomerMasterSidForEmail(),
        menuMasterSid: this.getCurrentMenuMasterSidForEmail()
      });
      const toEmail = recipients.toEmail;
      const ccEmail = Array.from(
        new Set(
          [
            ...(recipients.ccEmail || []),
            this.userData?.userEmail || ''
          ].map((email: string) => (email || '').trim()).filter((email: string) => !!email)
        )
      );

      if (toEmail.length === 0) {
        this.appSettingService.showError('No email found in customer branch email.');
        return;
      }

      const emailContent = this.emailTriggerService.buildOperationEmailContent({
        documentName,
        documentNoLabel: 'Invoice No.',
        documentNo: voucherNumber,
        documentDate,
        pol: this.invoicePrintData?.POL || this.invoiceData?.POL || '',
        pod: this.invoicePrintData?.POD || this.invoiceData?.POD || '',
        fpd: this.invoicePrintData?.FPD || this.invoiceData?.FPD || '',
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });
      const menuMasterSid = this.getCurrentMenuMasterSidForEmail();
      const mailConfig = await this.emailTriggerService.resolveMailForMenu({
        companyId: this.currentCompany?.CompanyMasterSid,
        menuMasterSid,
        action: this.headerId ? 'UPDATE' : 'CREATE',
        customerBranchSid: this.getCustomerBranchSidForEmail(),
        fallbackToEmail: toEmail.join(','),
        context: {
          documentName,
          documentNoLabel: 'Invoice No.',
          documentNo: voucherNumber,
          date: documentDate,
          VoucherNumber: voucherNumber,
          VoucherDate: documentDate,
          POL: this.invoicePrintData?.POL || this.invoiceData?.POL || '',
          POD: this.invoicePrintData?.POD || this.invoiceData?.POD || '',
          FPD: this.invoicePrintData?.FPD || this.invoiceData?.FPD || ''
        }
      });
      const resolvedBody = (mailConfig?.body || '').trim() || emailContent.body;

      // Attachment is governed by the menu's Mail Configuration (AttachmentRequire),
      // like sendManualMail(). When no config exists, keep attaching the PDF.
      const attachmentRequired = await this.emailTriggerService.isAttachmentRequiredForMenu(this.currentCompany?.CompanyMasterSid, menuMasterSid);

      const file = new File([blob], `Invoice_${voucherNumber || 'Report'}.pdf`, { type: 'application/pdf' });
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: toEmail,
        EmailCC: ccEmail,
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: resolvedBody,
        context: {
          documentName,
          documentNoLabel: 'Invoice No',
          menuName: documentName,
          documentNo: voucherNumber,
          date: documentDate,
          pol: this.invoicePrintData?.POL || this.invoiceData?.POL || '',
          pod: this.invoicePrintData?.POD || this.invoiceData?.POD || '',
          fpd: this.invoicePrintData?.FPD || this.invoiceData?.FPD || ''
        },
        attachmentRequired,
        // Print "Send Mail" always carries the generated PDF, even when the
        // menu's Mail Configuration has AttachmentRequire = No.
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('Invoice email error:', error);
      this.appSettingService.showError('Error preparing email');
    } finally {
      this.spinner.hide();
    }
  }

  private createEmailAuditLog(documentName: string): void {
    const payload = {
      tableName: 'VoucherHeader',
      recordId: String(this.invoiceData?.VoucherHeaderSid || this.headerId),
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
      this.invoiceForm.get('CustomerBranchSid')?.getRawValue(),
      this.invoiceData?.CustomerBranchSid,
      this.invoiceData?.customerBranch?.CustomerBranchSid,
      this.invoiceData?.CustomerBranch?.CustomerBranchSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCustomerMasterSidForEmail(): number | null {
    const candidates = [
      this.invoiceForm.get('CustomerMasterSid')?.getRawValue(),
      this.invoiceData?.CustomerMasterSid,
      this.invoiceData?.customerMaster?.CustomerMasterSid,
      this.invoiceData?.CustomerMaster?.CustomerMasterSid,
      this.invoiceData?.customerBranch?.CustomerMasterSid,
      this.invoiceData?.CustomerBranch?.CustomerMasterSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCurrentMenuMasterSidForEmail(): number | null {
    const sid = Number(
      this.invoiceData?.voucherTypeMaster?.MenuMasterSid ||
      this.currentMenuId
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
    const blockedReason = this.getEmailSubmitBlockedReason();
    if (blockedReason) {
      this.emailForm.markAllAsTouched();
      this.showBlockedAction(blockedReason);
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
        this.invoiceService.sendInvoiceEmail(payload).subscribe({
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
      if (!this.isPrintAllBankConfigLoaded) {
        await this.loadPrintAllBankConfig();
      }

      const resp: any = await firstValueFrom(this.getBankDetails());
      this.isBankFetched = true;
      this.bankDetails = this.filterPrintableBankDetails(resp ?? []);

    } catch (err) {
      console.error('Error fetching bank details', err);
      this.bankDetails = [];
    }
  }

  getBankDetails(): Observable<any[]> {
    return this.masterService.getAllBranchBanks();
  }

  private filterPrintableBankDetails(bankDetails: any[]): any[] {
    if (!Array.isArray(bankDetails)) {
      return [];
    }

    const branchSid = Number(this.currentBranch?.BranchMasterSid || 0);
    const partyCurrencyId = Number(this.invoiceForm.get('CurrencyMasterSid')?.getRawValue() || 0);

    return bankDetails.filter((bankDetail: any) => {
      const bankBranchSid = Number(bankDetail?.BranchMasterSid || 0);
      const bankCurrencySid = Number(bankDetail?.CurrencyMasterSid || 0);
      const printOnInvoice = bankDetail?.PrintOnInvoice ?? bankDetail?.printOnInvoice;

      if (branchSid && bankBranchSid !== branchSid) {
        return false;
      }

      if (!this.isPrintAllBankEnabled && partyCurrencyId && bankCurrencySid !== partyCurrencyId) {
        return false;
      }

      return this.parseConfigBoolean(printOnInvoice, false);
    });
  }

  getBankCurrencyCode(bankDetail: any): string {
    const bankCurrencySid = Number(bankDetail?.CurrencyMasterSid || bankDetail?.currencyMasterSid || 0);
    const bankCurrency = bankCurrencySid
      ? this.currencyList?.find((currency: any) => Number(currency?.CurrencyMasterSid) === bankCurrencySid)
      : null;

    return bankDetail?.CurrencyCode ||
      bankDetail?.currencyCode ||
      bankDetail?.currencyMaster?.currencyCode ||
      bankCurrency?.currencyCode ||
      this.invoiceData?.CurrencyCode ||
      '';
  }

  private async loadPrintAllBankConfig(): Promise<void> {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) {
      this.isPrintAllBankEnabled = false;
      this.isPrintAllBankConfigLoaded = true;
      return;
    }

    try {
      const resp: any = await firstValueFrom(
        this.masterService.getConfigurationValue(companyId, 'Printallbank')
      );
      const rawValue = resp?.ConfigurationValue ?? resp?.value ?? resp;
      this.isPrintAllBankEnabled = this.parseConfigBoolean(rawValue, false);
    } catch (error) {
      console.warn('Could not load Printallbank configuration:', error);
      this.isPrintAllBankEnabled = false;
    } finally {
      this.isPrintAllBankConfigLoaded = true;
    }
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
  return 'TAX INVOICE';
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
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    const menuMasterSid =
      this.invoiceData?.voucherTypeMaster?.MenuMasterSid ?? this.currentMenuId;
    const documentSid = this.invoiceData?.VoucherHeaderSid ?? this.headerId;

    const transactionPayload = {
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    MenuMasterSid: this.currentMenuId,
    DocumentSid: this.invoiceData?.VoucherHeaderSid
  };
    const payload = {
      MenuMasterSid: menuMasterSid,
      DocumentSid: documentSid,
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
      (a?.DocumentSid ?? this.invoiceData?.VoucherHeaderSid ?? null) ===
      (b?.DocumentSid ?? this.invoiceData?.VoucherHeaderSid ?? null)
    );

    const openModal = (terms: any[]) => {
      const modalRef = this.modalService.open(TermsAndConditionsComponent, {
        size: 'lg',
        backdrop: 'static',
        centered: true,
      });
      modalRef.componentInstance.terms = terms || [];
      modalRef.componentInstance.MenuMasterSid = menuMasterSid;
      modalRef.componentInstance.DocumentSid = documentSid;
      modalRef.componentInstance.loadAllOnGet = !this.isTermsAndConditionsEnabled;
    };

    if (this.currentCompany?.CompanyMasterSid === 13) {
      const staticTerms = [
        { sno: 1, TandC: 'If any discrepancy is noticed in the invoice, kindly inform us in writing within 7 days, otherwise the above amount will be considered as correct.' },
        { sno: 2, TandC: 'Please mention our invoice number(s) on your remittance instructions.' },
      ];
      openModal(staticTerms);
      return;
    }

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

  private loadCustomsDutyLabelConfig(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) return;
    this.masterService.getConfigurationValue(companyId, 'ChangeLabelToCashInvoice').subscribe({
      next: (resp: any) => {
        const rawValue = resp?.ConfigurationValue ?? resp?.value ?? resp;
        const isCashInvoice = rawValue === true || rawValue === 'Y' || rawValue === 'y';
        this.customsDutyLabel = isCashInvoice ? 'Cash Invoice' : 'Customs Duty Invoice';
      },
      error: () => { this.customsDutyLabel = 'Customs Duty Invoice'; }
    });
  }

  private loadShowCommodityWithContainerConfig(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) {
      this.isShowCargowithContainerEnabled = false;
      return;
    }

    this.masterService.getConfigurationValue(companyId, 'ShowCargowithContainer').subscribe({
      next: (resp: any) => {
        const rawValue = resp?.ConfigurationValue ?? resp?.value ?? resp;
        this.isShowCargowithContainerEnabled = this.parseConfigBoolean(rawValue, false);
      },
      error: () => {
        // Keep default print layout on config fetch failure.
        this.isShowCargowithContainerEnabled = false;
      }
    });
  }

  shouldUseCargoMultiPrintLayout(): boolean {
    return this.isShowCargowithContainerEnabled && this.isSeaDepartment();
  }

  onCustomsDutyToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.invoiceForm.get('CustomsDuty')?.setValue(checked ? 'Y' : 'N');
  }

  private parseConfigBoolean(value: any, defaultValue: boolean): boolean {
    if (value === true || value === false) return value;
    if (value === null || value === undefined) return defaultValue;
    const normalized = String(value).trim().toUpperCase();
    if (['Y', 'YES', 'TRUE', '1'].includes(normalized)) return true;
    if (['N', 'NO', 'FALSE', '0'].includes(normalized)) return false;
    return defaultValue;
  }

  get effectiveTermsAndConditions(): any[] {
    if (Array.isArray(this.TandCList) && this.TandCList.length > 0) {
      return this.TandCList;
    }

    const printTerms = this.invoicePrintData?.TermsAndConditions;
    if (Array.isArray(printTerms) && printTerms.length > 0) {
      return printTerms;
    }

    return [];
  }

  async getAndStoreTandC() : Promise<void> {
    try {
      const companyMasterSid = this.currentCompany?.CompanyMasterSid;
      const menuMasterSid = this.invoiceData?.voucherTypeMaster?.MenuMasterSid;
      const documentSid = this.invoiceData?.VoucherHeaderSid;

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

      const result = await firstValueFrom(
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
      MenuMasterSid: this.invoiceData?.voucherTypeMaster?.MenuMasterSid,
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

  openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.currentMenuId);  
    modalRef.componentInstance.DocumentSid = this.invoiceData?.VoucherHeaderSid;
  }

  openFollowup() {}
  onHeaderCurrencyChange(selectedCurrency: any) {
    if (!selectedCurrency) return;
    const currencyMasterSid = selectedCurrency?.CurrencyMasterSid;
    const currencyCode = selectedCurrency?.currencyCode;
    const companyCurrencyCode = this.currentCompanyCurrency?.code;

    // If same as company currency, set exchange rate to 1 and disable
    if (currencyCode === companyCurrencyCode) {
      this.invoiceForm.patchValue({
        CurrencyMasterSid: currencyMasterSid,
        CurrencyCode: currencyCode,
        ExchangeRate: 1,
      });
      this.invoiceForm.get('ExchangeRate')?.disable();
    } else {
      // Different currency - fetch exchange rate and enable field
      this.fetchExchangeRate(currencyCode, companyCurrencyCode);
    }

    // Warn if selected currency differs from the customer's default currency
    const customerMasterSid = this.invoiceForm.get('CustomerMasterSid')?.getRawValue();
    if (customerMasterSid && currencyMasterSid) {
      const customer = this.customerList.find(c => c.CustomerMasterSid === customerMasterSid);
      const customerCurrencySid = customer?.currencyMaster?.CurrencyMasterSid;
      if (customerCurrencySid && currencyMasterSid !== customerCurrencySid) {
        this.toastr.warning('Selected currency differs from the customer\'s default currency.', 'Currency Mismatch', { timeOut: 2000 });
      }
    }
  }

  private isAirDepartment(data: any): boolean {
    const departmentType = String(
      data?.departmentMaster?.departmentType ??
      data?.houseJob?.departmentMaster?.departmentType ??
      data?.masterJob?.departmentMaster?.departmentType ??
      data?.DepartmentType ??
      ''
    ).trim().toUpperCase();

    return departmentType === 'AIR';
  }

  private getHouseJobRouteSegment(data: any): string {
    return this.isAirDepartment(data) ? 'operation/hawb-bill' : 'operation/house-job';
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
    return 4;
  }

  public getFormattedAndPaddedAmount(amount: number | string, CurrencyMasterSid: number) {
    return this.formatCurrencyDisplayAmount(amount, CurrencyMasterSid);
  }

  public getFormattedAmount(
    amount: number | string,
    CurrencyMasterSid: number
  ) {
    return this.formatCurrencyDisplayAmount(amount, CurrencyMasterSid);
  }

  public formatCurrencyDisplayAmount(
    amount: number | string,
    CurrencyMasterSid?: number,
  ): string {
    const currency = this.currencyList.find(
      (currency) => Number(currency.CurrencyMasterSid) === Number(CurrencyMasterSid)
    );

    return this.currencyFormatter.formatMaskedAmount({
      value: toNumber(amount),
      currencyCode:
        currency?.currencyCode ||
        currency?.CurrencyCode ||
        this.invoiceForm?.get('CurrencyCode')?.getRawValue() ||
        '',
    });
  }

  public formatInvoiceCurrencyAmount(amount: number | string): string {
    return this.formatCurrencyDisplayAmount(
      amount,
      this.invoiceForm?.get('CurrencyMasterSid')?.getRawValue() ||
        this.invoiceData?.CurrencyMasterSid,
    );
  }

  public formatCompanyCurrencyAmount(amount: number | string): string {
    return this.formatCurrencyDisplayAmount(
      amount,
      this.currentCompany?.CurrencyMasterSid,
    );
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

  private getCustomerCountry(): string {
    const customer = this.customerList.find(
      (c: any) =>
        c.SubledgerMasterSid === this.invoiceForm.get('PartyMasterSid')?.value
    );
    return customer?.countryMaster?.countryCode || '';
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
      const companyMasterSid = Number(this.currentCompany?.CompanyMasterSid || 0);
      const saveAsFilePath = await this.pdfFileSaveService.shouldDownloadByFilePath(companyMasterSid);
      if (saveAsFilePath) {
        await this.downloadPDFByFilePath();
      } else {
        await this.downloadPDFInBrowser();
      }
      this.appSettingService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'VoucherHeader',
        recordId: String(this.invoiceData?.VoucherHeaderSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: 'Invoice Pdf Downloaded',
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        return;
      }
      console.error('Error generating PDF:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }

  private async getPdfGenerationContext(): Promise<{ logo: string | undefined; lookups: any; options: any }> {
    await this.preparePrintData();
    const logo = await this.resolveReportLogo();

    const lookups = {
      hssacMaster: this.hssacList?.flat() || [],
      currencyMaster: this.currencyList || []
    };

    const options = {
      taxDisplayConfig: this.printTaxDisplayConfig,
      bankDetails: this.bankDetails || [],
      terms: this.TandCList || [],
      amountInWords: this.invoicePrintData?.AmountInWords || '',
      localCurrency: this.currentCompanyCurrency?.code || '',
      invoiceTitle: this.invoicePrintData?.invoiceTitle || '',
      isSeaMode: this.isSeaDepartment(),
      isVATMode: this.printTaxDisplayConfig.showVAT,
      companyCountryCode: this.currentCompanyCountryCode,
      printSettings: this.companySettings.getPrintSettings(),
      companyVatNo:
        this.currentCompany?.Pan || '',
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
      invoicePrintData: {
        ...this.invoicePrintData,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        IsNonJobInvoice: this.invoicePrintData?.IsNonJobInvoice || this.shouldUseNonJobInvoicePrintFormat(),
      }
    };

    return { logo, lookups, options };
  }

  private async resolveReportLogo(): Promise<string | undefined> {
    const logoFromStream = await firstValueFrom(
      this.logoService.reportLogo$.pipe(take(1)),
    );
    const logoSource =
      logoFromStream || localStorage.getItem('current_report_logo') || '';

    if (!logoSource || logoSource === 'none') return undefined;
    if (logoSource.startsWith('data:image')) return logoSource;
    if (logoSource.toLowerCase().split('?')[0].endsWith('.svg')) {
      const svgText = await this.fetchSvgText(logoSource);
      return svgText
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`
        : undefined;
    }

    return this.imageUrlToBase64(logoSource);
  }

  private async fetchSvgText(url: string): Promise<string | undefined> {
    try {
      const response = await fetch(url);
      if (!response.ok) return undefined;
      return response.text();
    } catch {
      return undefined;
    }
  }

  private imageUrlToBase64(url: string): Promise<string | undefined> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const scale = 3;
        const canvas = document.createElement('canvas');
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(undefined);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => resolve(undefined);
      img.src = url;
    });
  }

  private async downloadPDFInBrowser(): Promise<void> {
    const { logo, lookups, options } = await this.getPdfGenerationContext();
    if (this.shouldUseCommodityPdfGenerator()) {
      this.pdfMakeService.generateCommodityInvoiceFromApi(
        this.invoiceData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        lookups,
        options
      );
      return;
    }

    this.pdfMakeService.generateInvoiceFromApi(
      this.invoiceData,
      this.currentCompany,
      this.currentBranch,
      this.userData,
      logo,
      lookups,
      options
    );
  }

  private async downloadPDFByFilePath(): Promise<void> {
    const blob = await this.getDownloadPDFBlob();
    const filename = this.getInvoicePdfFilename();
    await this.pdfFileSaveService.savePdf(blob, filename, true);
  }
 

  private getInvoicePdfFilename(): string {
    const voucherNumber = this.invoiceForm.get('VoucherNumber')?.value || 'Invoice';
    return `Invoice_${voucherNumber}.pdf`;
  }
 
  async generatePDFBlob(): Promise<Blob | null> {
    try {
      return await this.getDownloadPDFBlob();
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      return null;
    }
  }

  private async getDownloadPDFBlob(): Promise<Blob> {
    const { logo, lookups, options } = await this.getPdfGenerationContext();

    if (this.shouldUseCommodityPdfGenerator()) {
      return await this.pdfMakeService.generateCommodityInvoiceBlobFromApi(
        this.invoiceData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        lookups,
        options
      );
    }

    return await this.pdfMakeService.generateInvoiceBlobFromApi(
      this.invoiceData,
      this.currentCompany,
      this.currentBranch,
      this.userData,
      logo,
      lookups,
      options
    );
  }

  private shouldUseCommodityPdfGenerator(): boolean {
    return this.shouldUseCargoMultiPrintLayout();
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
    showUGST: boolean;
    showIGST: boolean;
    showVAT: boolean;
  } {
    return this.taxCalculationService.getTaxDisplayConfig();
  }

  
  getSalesmanName(): string {
    return this.salesmanName || '';
  }

  fetchSalesmanName(UserMasterSid : number){
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const payload = {
      UserMasterSid: UserMasterSid,
      CompanyMasterSid: CompanyMasterSid,
    }
    if(!UserMasterSid || UserMasterSid === undefined) return;
    this.masterService.getFfUserById(payload).subscribe({
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

  getTaxPercentageForDisplay(detail: any, appliedMode?: AppliedTaxMode): {
    cgstRate: number;
    sgstRate: number;
    ugstRate: number;
    igstRate: number;
    vatRate: number;
  } {
    const mode = appliedMode ?? this.taxCalculationService.context?.appliedTaxMode;

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
      vatRate: 0,
    };
  }
  getTaxAmountForDisplay(detail: any, appliedMode?: AppliedTaxMode): {
    cgstAmt: number;
    sgstAmt: number;
    ugstAmt: number;
    igstAmt: number;
    vatAmt: number;
  } {
    const mode = appliedMode ?? this.taxCalculationService.context?.appliedTaxMode;
    const taxableAmount = toNumber(detail.TaxableAmount);
    const calculateTaxAmount = (rate: any): number =>
      this.round((taxableAmount * toNumber(rate)) / 100);

    if (mode === 'CGST_SGST') {
      return {
        cgstAmt: calculateTaxAmount(detail.TaxPercentage1),
        sgstAmt: calculateTaxAmount(detail.TaxPercentage2),
        ugstAmt: 0,
        igstAmt: 0,
        vatAmt: 0,
      };
    } else if (mode === 'CGST_UGST') {
      return {
        cgstAmt: calculateTaxAmount(detail.TaxPercentage1),
        sgstAmt: 0,
        ugstAmt: calculateTaxAmount(detail.TaxPercentage2),
        igstAmt: 0,
        vatAmt: 0,
      };
    } else if (mode === 'IGST') {
      return {
        cgstAmt: 0,
        sgstAmt: 0,
        ugstAmt: 0,
        igstAmt: calculateTaxAmount(detail.TaxPercentage1),
        vatAmt: 0,
      };
    } else if (mode === 'VAT') {
      return {
        cgstAmt: 0,
        sgstAmt: 0,
        ugstAmt: 0,
        igstAmt: 0,
        vatAmt: calculateTaxAmount(detail.TaxPercentage1),
      };
    }

    return {
      cgstAmt: calculateTaxAmount(detail.TaxPercentage1),
      sgstAmt: calculateTaxAmount(detail.TaxPercentage2),
      ugstAmt: 0,
      igstAmt: 0,
      vatAmt: 0,
    };
  }
  
  shouldShowGSTTypeField(): boolean {
    return this.currentCompanyCountryCode === 'in';
  }

  private resolvePrintTaxMode(invoice: any): AppliedTaxMode {
    if (!invoice) return 'NONE';

    const invoiceType = invoice.InvoiceType;
    if (invoiceType === 'EXE' || invoiceType === 'BOS' || invoiceType === 'REIMB' || invoiceType === 'RCM') {
      return 'NONE';
    }

    const companyCountryCode = (this.currentCompanyCountryCode || '').toLowerCase();
    const branchStateSid = this.currentBranchState?.StateMasterSid;
    const partyStateSid = invoice.customerBranch?.stateMaster?.StateMasterSid;
    const placeOfSupply = invoice.PlaceOfSupply || '';
    const isUnionTerritory = invoice.customerBranch?.stateMaster?.IsUnionTerritory === 'Y';
    const gstType = invoice.GSTType || '';
    const customerGstType = invoice.customerBranch?.CustomerGstType || '';
    const partyCountryCode = (
      invoice.customerBranch?.customerMaster?.countryMaster?.countryCode ||
      invoice.customerMaster?.countryMaster?.countryCode ||
      invoice.subledgerMaster?.countryMaster?.countryCode ||
      companyCountryCode
    ).toLowerCase();
    const isSameCountry = !partyCountryCode || partyCountryCode === companyCountryCode || partyCountryCode === 'india';

    if (companyCountryCode !== 'in') {
      if (invoiceType === 'NONGST') {
        return isSameCountry ? 'VAT' : 'NONE';
      }
      return isSameCountry ? 'VAT' : 'NONE';
    }

    if (gstType === 'EXPWP' || gstType === 'EXPWOP') {
      return 'IGST';
    }
    if (customerGstType === 'Exempt' || customerGstType === 'Composite') {
      return 'NONE';
    }

    const taxCategory = this.taxCalculationService.determineTaxCategory(
      this.currentBranchStateName,
      placeOfSupply,
      partyCountryCode,
      branchStateSid,
      partyStateSid
    );

    if (!isSameCountry) {
      return 'IGST';
    }

    if (isUnionTerritory) {
      return 'CGST_UGST';
    }

    return taxCategory === 'Inter' ? 'IGST' : 'CGST_SGST';
  }

  shouldShowForeignCurrencyColumn(): boolean {
    return this.invoiceData?.CurrencyCode !== this.currentCompanyCurrency?.code;
  }

  shouldShowIndiaGstAmountTotals(configOverride?: {
    showCGST: boolean;
    showSGST: boolean;
  }): boolean {
    const config = configOverride ?? this.printTaxDisplayConfig;
    return this.currentCompanyCountryCode?.toLowerCase() === 'in' && !!config?.showCGST && !!config?.showSGST;
  }

  shouldShowVatAmountTotals(configOverride?: {
    showVAT: boolean;
  }): boolean {
    const config = configOverride ?? this.printTaxDisplayConfig;
    return this.currentCompanyCountryCode?.toLowerCase() === 'ae' && !!config?.showVAT;
  }

  shouldShowDetailedTaxAmountTotals(configOverride?: {
    showCGST: boolean;
    showSGST: boolean;
    showVAT: boolean;
  }): boolean {
    return this.shouldShowIndiaGstAmountTotals(configOverride) || this.shouldShowVatAmountTotals(configOverride);
  }

  getInvoicePrintAmountTotal(fieldName: 'cgstAmt' | 'sgstAmt' | 'vatAmt' | 'TaxableAmount' | 'LocalAmount'): string {
    const total = (this.invoicePrintData?.voucherDetails || []).reduce((sum: number, detail: any) => {
      return sum + toNumber(detail?.[fieldName]);
    }, 0);

    return this.getFormattedAndPaddedAmount(total, this.currentCompany.CurrencyMasterSid);
  }

  getInvoicePrintVatSummary(): Array<{ vatRate: string; vatRateDisplay: string; taxableAmount: number; vatAmt: number }> {
    const summary = new Map<string, { vatRate: string; vatRateDisplay: string; taxableAmount: number; vatAmt: number }>();

    for (const detail of this.invoicePrintData?.voucherDetails || []) {
      const vatRate = detail?.vatRate ?? '0.000';
      // UAE: group by HSSAC -> TaxGroup name (VAT 5% / VAT 0% / Exempt / Out of Scope);
      // other countries keep the tax-percentage grouping.
      const groupByTaxGroup = this.isUAECompany;
      const key = groupByTaxGroup ? (detail?.taxGroupName || 'Unmapped') : vatRate;
      const display = groupByTaxGroup ? (detail?.taxGroupName || 'Unmapped') : `${toNumber(vatRate)}%`;
      const summaryRow = summary.get(key) || {
        vatRate,
        vatRateDisplay: display,
        taxableAmount: 0,
        vatAmt: 0,
      };

      summaryRow.taxableAmount += toNumber(detail?.TaxableAmount);
      summaryRow.vatAmt += toNumber(detail?.vatAmt);
      summary.set(key, summaryRow);
    }

    return Array.from(summary.values());
  }

  calculateBaseInvoicePrintColspan(): number {
    let baseColumns = 7; // S.No, Particulars, Curr, No. of Unit, Rate, ROE, Taxable Amt

    if (this.currentCompanyCountryCode?.toLowerCase() !== 'ae') {
      baseColumns += 1; // HSN/SAC
    }

    return baseColumns;
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

  getContainerTypeName(containerTypeSid: number | string | null | undefined): string {
    if (!containerTypeSid || !this.containerTypeList?.length) return '';

    const normalizedSid = Number(containerTypeSid);
    const containerType = this.containerTypeList.find((item: any) =>
      Number(item?.ContainerTypeMasterSid ?? item?.ContainerTypeSid) === normalizedSid
    );

    return containerType?.ContainerName || containerType?.ContainerType || '';
  }

  getContainerDisplay(containers: any[] | null | undefined): string {
    if (!Array.isArray(containers) || containers.length === 0) return '';

    const masterContainers = Array.isArray(this.invoiceData?.masterJob?.containers)
      ? this.invoiceData.masterJob.containers
      : [];

    return containers
      .map((item: any) => {
        const masterJobContainerSid = Number(
          item?.MasterJobContainerSid ?? item?.masterJobContainer?.MasterJobContainerSid
        );

        const container = masterJobContainerSid
          ? masterContainers.find(
              (masterContainer: any) =>
                Number(masterContainer?.MasterJobContainerSid) === masterJobContainerSid
            ) ?? null
          : item;

        const number = container?.ContainerNumber || '';
        const type = container?.containerType?.ContainerName;

        if (number && type) {
          return `${number} / ${type}`;
        }

        return number || type || '';
      })
      .filter((value: string) => !!value)
      .join(', ');
  }

  getInvoiceContainerDisplay(): string {
    const masterContainers = Array.isArray(this.invoiceData?.masterJob?.containers)
      ? this.invoiceData.masterJob.containers
      : [];
    const houseProducts = Array.isArray(this.invoiceData?.houseJob?.Products)
      ? this.invoiceData.houseJob.Products
      : [];

    const linkedMasterContainerSids = new Set(
      houseProducts
        .map((item: any) =>
          Number(item?.MasterJobContainerSid ?? item?.masterJobContainer?.MasterJobContainerSid)
        )
        .filter((sid: number) => !!sid)
    );

    const linkedMasterContainers = masterContainers.filter((container: any) =>
      linkedMasterContainerSids.has(Number(container?.MasterJobContainerSid))
    );

    const sourceContainers = linkedMasterContainers.length ? linkedMasterContainers : masterContainers;
    return this.getContainerDisplay(sourceContainers);
  }

  calculateTotalColspan(configOverride?: {
    showCGST: boolean;
    showSGST: boolean;
    showUGST: boolean;
    showIGST: boolean;
    showVAT: boolean;
  }): number {
    const config = configOverride ?? this.getTaxDisplayConfig();
    let baseColumns = 7; // S.No, Particulars, Curr, No of Unit, Rate, ROE, Taxable Value

    // Add HSN/SAC column if not UAE
    if (this.currentCompanyCountryCode?.toLowerCase() !== 'ae') {
      baseColumns += 1;
    }

    // Add tax columns based on what's visible
    if (config.showCGST) baseColumns += 2; // CGST % + CGST Amt
    if (config.showSGST) baseColumns += 2; // SGST % + SGST Amt
    if (config.showUGST) baseColumns += 2; // UGST % + UGST Amt
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
    navigateToVoucherEntry(this.router, VoucherType.INVOICE);
  }

  /**
   * Post-create navigation to the saved voucher's entry screen. Extracted so
   * subclasses (e.g. non-job invoice) can route to their own entry screen
   * instead of the job-invoice route — WITHOUT patching the global Router.
   */
  protected navigateAfterCreate(headerId: number): void {
    navigateToVoucherEntry(this.router, VoucherType.INVOICE, headerId, {
      extras: { replaceUrl: true }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


openUninvoicedChargesModal() {
  if (this.showBlockedAction(this.getUninvoicedChargesBlockedReason())) return;

  const isBooking = !!(this.invoiceData?.BookingHeaderSid && this.invoiceData?.BookingHeader)
    && !this.invoiceData?.HouseJobSid
    && !this.invoiceData?.MasterJobSid;

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
    IsBooking: isBooking,
    RevenueCustomerBranchSid: customerBranchSid,
    RevenueCustomerMasterSid: customerMasterSid
  };

  if (isBooking) {
    (payload as any).BookingHeaderSid = this.invoiceData?.BookingHeaderSid;
  } else {
    (payload as any).transactionSid = this.transactionSid;
    (payload as any).MenuMasterSid = this.jobMenuMasterSid;
  }

  this.spinner.show();
  this.invoiceService.getUninvoicedRevenueCharges(payload).subscribe({
    next: (resp: any) => {
      this.spinner.hide();
      if (resp?.status && resp.data) {
        const addedChargeKeys = new Set(
          this.details.getRawValue()
            .map((detail: any) =>
              detail?.BookingRateSid != null
                ? `booking-${detail.BookingRateSid}`
                : detail?.CostRevenueChargesSid != null
                ? `revenue-${detail.CostRevenueChargesSid}`
                : null
            )
            .filter((key: string | null) => !!key)
        );
        
        // Filter out charges that are already added to the invoice
        this.uninvoicedChargesList = (resp.data || []).filter(
          (charge: any) => !addedChargeKeys.has(this.getUninvoicedChargeKey(charge))
        );
        
        this.selectedUninvoicedCharges.clear();
        
        // Check if there are any charges left after filtering
        if (this.uninvoicedChargesList.length === 0) {
          this.appSettingService.showWarning('No new uninvoiced charges available to add');
          return;
        }
        this.modalService.open(this.uninvoicedChargesModalRef, {
          size: 'xl',
          backdrop: 'static',
          keyboard: false,
          scrollable: true,
          centered:true
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

private getUninvoicedChargeKey(charge: any): string | null {
  if (charge?.BookingRatesSid != null) return `booking-${charge.BookingRatesSid}`;
  if (charge?.CostRevenueChargesSid != null) return `revenue-${charge.CostRevenueChargesSid}`;
  return null;
}

toggleChargeSelection(charge: any) {
  if (this.showBlockedAction(this.getChargeSelectionBlockedReason(charge))) return;

  const key = this.getUninvoicedChargeKey(charge);
  if (!key) return;

  if (this.selectedUninvoicedCharges.has(key)) {
    this.selectedUninvoicedCharges.delete(key);
  } else {
    this.selectedUninvoicedCharges.add(key);
  }
}

isChargeSelected(charge: any): boolean {
  const key = this.getUninvoicedChargeKey(charge);
  return !!key && this.selectedUninvoicedCharges.has(key);
}
selectAllUninvoicedCharges() {
  this.uninvoicedChargesList.forEach(charge => {
    if (this.hasVoucherGenerated(charge)) return;
    const key = this.getUninvoicedChargeKey(charge);
    if (key) this.selectedUninvoicedCharges.add(key);
  });
}
deselectAllUninvoicedCharges() {
  this.selectedUninvoicedCharges.clear();
}

addSelectedUninvoicedCharges() {
  if (this.showBlockedAction(this.getAddSelectedUninvoicedChargesBlockedReason())) return;

  const selectedCharges = this.uninvoicedChargesList.filter(
    charge => {
      const key = this.getUninvoicedChargeKey(charge);
      return !!key && this.selectedUninvoicedCharges.has(key);
    }
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
    CostRevenueChargesSid: charge.CostRevenueChargesSid,
    BookingRateSid: charge.BookingRateSid ?? charge.BookingRatesSid ?? null
  });

   // Add to form array first
  this.details.push(detailGroup);
  const index = this.details.length - 1;
  const controlsToDisable = [
    'ChargeMasterSid',
    'ChargeUOMSid',
    'NumberOfUnit',
    'DrCr',
    'CurrencyMasterSid',
    'CurrencyCode',
    'ExchangeRate',
    'Amount',
    'TaxableAmount',
    'TaxPercentage1',
    'TaxAmount1',
    'TaxPercentage2',
    'TaxAmount2',
    'LocalAmount',
    'PartyAmount',
    'MasterJobSid',
    'HouseJobSid',
    'DepartmentMasterSid',
    'LedgerMasterSid',
    'COAMasterSid',
    'CostRevenueChargesSid',
    'BookingRateSid'
  ];
   controlsToDisable.forEach(controlName => {
    const control = this.details.at(index).get(controlName);
    if (control) {
      control.disable({ emitEvent: false });
    }
  });
  
  // Ensure Rate is enabled
  this.details.at(index).get('Rate')?.enable({ emitEvent: false });
  const rateControl = this.details.at(index).get('Rate');

// Rate can be freely edited (including increased) for pulled unbilled charges
rateControl?.setValidators([
  Validators.required,
  Validators.min(0)
]);

rateControl?.updateValueAndValidity({ emitEvent: false });

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
         this.fetchHSN(index, true);
          if (this.invoiceData.MasterJobSid) {
          this.onDetailMasterJobSelected(
            { MasterJobSid: this.invoiceData.MasterJobSid },
            index
          );
        }
        
        // Trigger tax calculation
        this.recalcRow(index);
        // Now continue with other operations
        this.details.at(index).updateValueAndValidity();
        
        // Disable exchange rate if same as company currency
        const detailCurrencyId = detailGroup.get('CurrencyMasterSid')?.value;
        if (detailCurrencyId === this.currentCompany?.CurrencyMasterSid) {
          detailGroup.get('ExchangeRate')?.disable();
        }
        
       
        
       
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

 openAuditLogs() {
      if (!this.invoiceData?.VoucherHeaderSid) return;
      const modalRef = this.modalService.open(AuditLogComponent, {
        centered: true,
        scrollable: true,
        size: 'xl',
        windowClass: 'audit-log-modal'
      });
      modalRef.componentInstance.title = 'Invoice Logs';
      modalRef.componentInstance.tableName = 'VoucherHeader';
      modalRef.componentInstance.recordId = this.invoiceData?.VoucherHeaderSid.toString();
      modalRef.componentInstance.screenName = 'Invoice';
    }

}
