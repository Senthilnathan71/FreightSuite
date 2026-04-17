import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { ReactiveFormsModule, FormsModule, AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, firstValueFrom, Subject, takeUntil } from 'rxjs';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService, CurrencySettings } from 'src/app/core/services/company-settings-manager.service';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { AccountsService } from '../../accounts.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { CommonService } from 'src/app/common/common.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { getDefaultTodayDate, toNgbDateStruct } from 'src/app/common/helper';
import { VoucherPeriodValidationService, VoucherDateConstraints } from 'src/app/common/voucher-period-validation.service';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { ToastrService } from 'ngx-toastr';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';

interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-reverse-voucher-entry',
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
    NgbDropdownModule
  ],
  templateUrl: './reverse-voucher-entry.component.html',
  styleUrl: './reverse-voucher-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
  ],
})
export class ReverseVoucherEntryComponent {
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
  reverseVoucherForm!: FormGroup;
  headerId: number | null = null;
  reverseVoucherData: any;
  currentMenuId: number;
  isViewMode: boolean = false;
  isTermsAndConditionsEnabled: boolean = true;
  get isEditMode() {
    return !!this.headerId && !this.isViewMode;
  }
  currencyList: any[] = [];
  chargeList: any[] = [];
  hssacList: any[] = [];
  subledgerList: any[] = [];
  coaList: any[] = [];
  departmentList: any[] = [];
  masterJobList: any[] = [];
  houseJobList: any[] = [];
  houseJobListByMasterJob: { [key: number]: any[] } = {};
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  HSSACLookupConfig = {
    displayFields: ['HSSACCode', 'HSSACName'],
    displayLabels: ['Code', 'Name'],
    labelFields: ['HSSACCode'],
  };
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  masterJobLookupConfig = DROPDOWN_CONFIGS.MASTER_JOB;
  MenuMasterSid: any;
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
  voucherConstraints: VoucherDateConstraints = {
    isClosed: false,
    errorMessage: null,
  };
  // Gates the inline error label and button-disable: create=after save-click, edit=after date-change
  showVoucherDateError = false;
  isDirty: boolean = false;
  isSaving: boolean = false;
  suspendedMatchingHeaders: { VoucherMatchingHeaderSid: number; VoucherMatchingNo: string }[] = [];
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();
  bookingModeCountry: string = 'india';
  get isIndiaGST(): boolean {
    return this.currentCompanyCountryCode === 'in';
  }
  get isVATMode(): boolean {
    return this.currentCompanyCountryCode !== 'in'; // VAT for non-India countries
  }
  get f(): { [key: string]: AbstractControl } {
    return this.reverseVoucherForm.controls;
  }
  get details(): FormArray {
    return this.reverseVoucherForm.get('voucherDetails') as FormArray;
  }
  get isReadOnly(): boolean {
    if (!this.isEditMode) return false;
    return this.reverseVoucherData?.PostStatus !== 'U' || this.reverseVoucherData?.Status !== 'A';
  }
  totalCredits: number = 0;
  totalDebits: number = 0;
  TandCList: any[] = [];
  currentClauseId: any;
  costCenterList: any[] = [];
  profitCenterList: any[] = [];
  statusList = [
    { value: 'A', name: 'Active' },
    { value: 'S', name: 'Suspended' },
  ];
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private operationService: OperationService,
    private accountService: AccountsService,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private spinner: NgxSpinnerService,
    private companySettings: CompanySettingsManagerService,
    public mps: MenuPermissionService,
    private commonService: CommonService,
    private voucherPeriodService: VoucherPeriodValidationService,
    private numberToWords: NumberToWordsService,
    private currencyFormatter: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService,
    public logoService: LogoService,
    private datePipe: CustomDatePipe,
    private toastr: ToastrService,
  ) { }




  voucherList: any[] = [];
  vendorList: any[] = [];
  vendorBranchList: any[] = [];
  uomList: any[] = [];
  stateList: any[] = [];
  selectedVendorForCosts: any = null;
  allPendingCosts: any[] = [];
  searchVendors: any[] = [];
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  private pendingBranchToSelect: number | null = null;
  private originalInvoiceRates: Map<number, number> = new Map();
  invoiceOutstandingAmount: number = 0;
  selectedOutstandingInvoice: any = null;
  showOutstandingInfo: boolean = false;
  invoiceLookupConfig = DROPDOWN_CONFIGS.INVOICE;
  searchType: string = 'Master Job';
  searchValue: string = '';
  pendingCosts: any[] = [];
  selectedCosts: Set<number> = new Set();
  searchPerformed: boolean = false;
  searchResultsLoading: boolean = false;
  currentCurrency: number;
  currentUserCurrency: string;
  currentUserCountry: string;




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
      this.currentCompanyCountry = this.appSettingService.getCurrentCompanyCountry();
      this.currentCompanyCurrency = this.companySettings.getCurrencySettings();
      this.currentBranchState = this.appSettingService.getCurrentBranchState();
      this.currentBranchCity = this.appSettingService.getCurrentBranchCity();
      const currentFinancialYear = this.appSettingService.getCurrentFinancialYear();
      this.currentFinancialYear = Number(localStorage.getItem('current-year-id'));
      if (currentFinancialYear) {
        this.fyMinDate = toNgbDateStruct(currentFinancialYear.StartDate);
        const fyEnd = new Date(currentFinancialYear.EndDate);
        const today = getDefaultTodayDate();
        this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
      }
      this.currentMenuId = this.mps.getMenuId();
      this.mps.init().subscribe();
      this.currentCompanyCountryId = Number(this.currentCompany?.CountryMasterSid) || this.currentCompanyCountry.CountryMasterSid;
      this.currentCompanyCountryCode = String(this.currentCompanyCountry.countryCode).trim().toLocaleLowerCase();
      if (currentFinancialYear) {
        this.currentFinancialYear = Number(currentFinancialYear.YearMasterSid);
      }
      if (this.currentBranchState) {
        this.currentBranchStateName = this.currentBranchState.stateName || this.currentBranch?.stateMaster?.stateName;
      }
      if (this.currentBranchCity) {
        this.currentBranchCityId = this.currentBranchCity.CityMasterSid || this.currentBranch?.cityMaster?.CityMasterSid;
      }
    } catch (e) {
      console.error('Error loading company data:', e);
      this.currentCompany = null;
      this.currentBranch = null;
    }
    this.loadTermsAndConditionsConfig();
    this.initForm();
    this.loadVoucherPeriods();
    this.loadLookups();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.headerId = Number(id);
        this.loadReverseVoucherById(this.headerId);
      } else {
        this.initialFormValue = this.reverseVoucherForm.getRawValue();
        this.subscribeToFormChanges();
      }
    });
    
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
    const today = getDefaultTodayDate();
    const fyDefault = this.appSettingService.getCurrentFinancialYear();
    const defaultVoucherDate = fyDefault && (today < new Date(fyDefault.StartDate) || today > new Date(fyDefault.EndDate)) ? fyDefault.EndDate : today;
    this.reverseVoucherForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }],
      VoucherDate: [defaultVoucherDate, Validators.required],
      ReversalVoucher: [{ value: '', disabled: true }],
      ReversalVoucherNumber: [''],
      PostedOn: [{ value: null, disabled: true }],
      PostStatus: [{ value: 'U', disabled: true }],
      Narration: [{ value: '', disabled: true }],
      Remarks: [{ value: '', disabled: true }],
      Status: [{ value: 'A', disabled: true }],
      voucherDetails: this.fb.array([]),
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
    this.reverseVoucherForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.reverseVoucherForm.getRawValue(),
        );
        this.validateAmount();
      });
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined || value === '') {
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

  loadLookups() {
    this.spinner.show();
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const companyRaw = localStorage.getItem('selected-company');
    const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;
    const filterOption = { CompanyMasterSid: company?.CompanyMasterSid, BranchMasterSid: company?.BranchMasterSid };

    Promise.all([
      firstValueFrom(this.operationService.getAllCreditorWithCOAMapped(filterOption)),
      firstValueFrom(this.operationService.getAllCurrencies()),
      firstValueFrom(this.operationService.getAllMappedChargeDebtors(filterOption)),
      firstValueFrom(this.operationService.getAllHssac()),
      firstValueFrom(this.operationService.getAllUom()),
      firstValueFrom(this.accountService.getAllCostCenters()),
      firstValueFrom(this.accountService.getAllProfitCenters()),
      firstValueFrom(this.accountService.getAllCoaWithLedgerCategory({LedgerCategory: 'Ledger',CompanyMasterSid})),
      firstValueFrom(this.masterService.getSubledgerMasterByType('Customer', CompanyMasterSid)),
      firstValueFrom(this.operationService.getAllDepartments(CompanyMasterSid)),
      firstValueFrom(this.operationService.getAllMasterJobs(filterOption))
    ]).then(([vendors, currencies, charges, hssac, uom,  costCenters, profitCenters,coa, subledger,dept,job]) => {
      this.vendorList = vendors.data || [];
      this.costCenterList = costCenters.data || [];
      this.profitCenterList = profitCenters.data || [];
      this.subledgerList = vendors.data || [];
      this.currencyList = currencies.data || [];
      this.chargeList = charges.data || [];
      this.hssacList = hssac || [];
      this.uomList = uom.data || [];
      this.coaList = coa.data || [];
      this.subledgerList = subledger.data || [];
      this.departmentList = dept.data || [];
      this.masterJobList = job.data || [];
      this.spinner.hide();
    }).catch(error => {
      console.error('Error loading lookups:', error);
      this.spinner.hide();
      this.appSettingService.showError('Error loading lookup data');
    });
  }

  getVoucherData() {
    const voucherNumber = this.reverseVoucherForm.get('ReversalVoucherNumber')?.value;
    const searchValue = String(voucherNumber).trim();
    if (!voucherNumber) {
      this.appSettingService.showWarning('Please enter an voucher number first.');
      return;
    }
    const payload = {
      VoucherNumber: searchValue,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };
    this.operationService.getVoucherById(payload).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          const data = resp.data;
          this.suspendedMatchingHeaders = data.suspendedMatchings || [];
          this.reverseVoucherForm.patchValue({
            ReversalVoucher: data.VoucherHeaderSid,
          });
          const autoNarration = this.autoGenerateNarration(data);
          this.reverseVoucherForm.get('Narration')?.setValue(autoNarration);
          this.minVoucherDate = toNgbDateStruct(resp.data?.VoucherDate) || null;
          this.patchVoucherData(data);
          this.appSettingService.showSuccess('Voucher data loaded successfully');
        } else {
          try {
            const errorData = JSON.parse(resp.message);
            if (errorData.type === 'VOUCHER_MATCHING_EXISTS') {
              this.suspendedMatchingHeaders = errorData.matchingHeaders || [];
              this.appSettingService.showError(errorData.message);
              return;
            }
          } catch (e) { /* not structured, fall through */ }
          this.appSettingService.showError(resp.message || 'Error loading voucher data');
        }
      },
      error: (err) => {
        console.error('Error fetching voucher:', err);
        this.appSettingService.showError('Failed to load voucher data');
      },
    });
  }


  navigateToVoucherMatching(sid: number) {
    this.router.navigate(['/accounts/voucher-matching/entry', sid]);
  }

  private patchVoucherData(data: any) {
    const header = data;
    const voucher = header.VoucherHeaderSid || header.voucherHeaderSid || null;
    const autoNarration = this.autoGenerateNarration(data);
    this.reverseVoucherForm.patchValue({
      ReversalVoucher: voucher,
      Narration: autoNarration || header.Narration,
      PartyMasterSid: header.PartyMasterSid || null,
      PartyName: header.PartyName || '',
      PartyAddress: header.PartyAddress || '',
      CustomerBranchSid: header.CustomerBranchSid || null,
      GSTNo: header.GST_VAT || '',
      GSTType: header.GSTType || '',
      PlaceOfSupply: header.PlaceOfSupply || '',
      InvoiceType: header.InvoiceType || '',
      CurrencyCode: header.currencyMaster?.currencyCode || header.CurrencyCode || null,
      ExchangeRate: header.ExchangeRate || header.ExRate || 1,
      BillAmount: header.Amount || 0,
      BillDate: this.toNgbDate(header.DocumentDate),
      BillNo: header.DocumentNumber || '',
      MBLNo: header.MBLNo || '',
      HBLNo: header.HBLNo || '',
      Remarks: header.Remarks || '',
    });
    const customerMasterSid = header.CustomerMasterSid;
    if (customerMasterSid) {
      this.reverseVoucherForm.get('CustomerMasterSid')?.setValue(customerMasterSid);
      const customer = this.vendorList.find(c => c.CustomerMasterSid === customerMasterSid);
      if (customer) {
        this.reverseVoucherForm.get('PartName')?.setValue(customer.CustomerName || '');
        if (customer.SubledgerMasterSid) {
          this.reverseVoucherForm.get('PartyMasterSid')?.setValue(Number(customer.SubledgerMasterSid));
        }
      }
      this.getVendorBranchByVendor(Number(customerMasterSid));
      const branchSid = header.CustomerBranchSid;
      if (branchSid) {
        setTimeout(() => {
          this.reverseVoucherForm.get('CustomerBranchSid')?.setValue(Number(branchSid));
          const foundBranch = this.vendorBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));
          if (foundBranch) {
            this.reverseVoucherForm.get('PartyAddress')?.setValue(foundBranch.Address || foundBranch.CustomerAddress1 || '');
          }
        }, 500);
      }
    }

    let detailsFromVendorInvoice: any[] = [];

    if (header.VoucherTransaction && Array.isArray(header.VoucherTransaction)) {
      detailsFromVendorInvoice = header.VoucherTransaction
        .filter((transaction: any) => transaction.voucherDetail) // Only transactions with voucherDetail
        .map((transaction: any) => {
          const detail = transaction.voucherDetail;
          const transactionData = transaction; // Main transaction data
          if (detail.ChargeMasterSid && detail.Rate != null) {
            const chargeId = Number(detail.ChargeMasterSid);
            const originalRate = Number(detail.Rate);

            this.originalInvoiceRates.set(chargeId, originalRate);

            console.log(`DEBUG - Stored original rate for charge ${chargeId}: ${originalRate}`);
          }
          return {
            ...detail,
            // Include transaction-level data that might be needed
            Amount: transaction.Amount || detail.Amount,
            LocalAmount: transaction.LocalAmount || detail.LocalAmount,
            // Map other fields as needed
          };
        });
    }
    if (detailsFromVendorInvoice.length === 0) {
      detailsFromVendorInvoice = data.voucherDetails
        || data.voucherDetail
        || data.VoucherDetail
        || data.VoucherDetails
        || [];
    }
    console.log('DEBUG - Extracted voucher details:', detailsFromVendorInvoice);
    this.details.clear();
    detailsFromVendorInvoice.forEach((detail: any) => {
      const amount = detail.Amount ? (Number(detail.Amount)) : 0;
      const taxableAmount = detail.TaxableAmount ? (Number(detail.TaxableAmount)) : 0;
      const taxAmount1 = detail.TaxAmount1 ? (Number(detail.TaxAmount1)) : 0;
      const taxAmount2 = detail.TaxAmount2 ? (Number(detail.TaxAmount2)) : 0;
      const taxAmountIGST = detail.TaxAmountIGST ? (Number(detail.TaxAmountIGST)) : 0;
      const localAmount = detail.LocalAmount ? (Number(detail.LocalAmount)) : 0;
      const partyAmount = detail.PartyAmount ? (Number(detail.PartyAmount)) : 0;


      const taxPercentage1 = detail.TaxPercentage1 !== undefined ? Number(detail.TaxPercentage1) :
        detail.taxPercentage1 !== undefined ? Number(detail.taxPercentage1) : 0;

      const taxPercentage2 = detail.TaxPercentage2 !== undefined ? Number(detail.TaxPercentage2) :
        detail.taxPercentage2 !== undefined ? Number(detail.taxPercentage2) : 0;

      const taxPercentageIGST = detail.TaxPercentageIGST !== undefined ? Number(detail.TaxPercentageIGST) :
        detail.taxPercentageIGST !== undefined ? Number(detail.taxPercentageIGST) : 0;

      console.log('DEBUG - Tax percentages for detail:', {
        taxPercentage1,
        taxPercentage2,
        taxPercentageIGST,
        chargeDescription: detail.ChargeDescription
      });

      // For credit note, typically use 'Cr' for credit entries
      const originalDrCr = detail.DrCr || detail.drCr || 'D';
      const swappedDrCr = originalDrCr === 'C' ? 'D' : 'C';

      console.log('DEBUG - Dr/Cr swap:', {
        original: originalDrCr,
        swapped: swappedDrCr,
        chargeDescription: detail.ChargeDescription
      });

      this.details.push(this.createDetailGroup({
        VoucherDetailSid: detail.VoucherDetailSid,
        ChargeMasterSid: detail.ChargeMasterSid,
        ChargeDescription: detail.ChargeDescription,
        HSSACMasterSid: detail.HSSACMasterSid,
        ChargeUOMSid: detail.ChargeUOMSid,
        DepartmentMasterSid: detail.DepartmentMasterSid,
        NumberOfUnit: detail.NumberOfUnit,
        DrCr: swappedDrCr,
        CurrencyCode: detail.CurrencyCode,
        Rate: amount,
        ExchangeRate: detail.ExchangeRate,
        Amount: amount,
        TaxableAmount: taxableAmount,
        TaxPercentage1: taxPercentage1,
        TaxAmount1: taxAmount1,
        TaxPercentage2: taxPercentage2,
        TaxAmount2: taxAmount2,
        TaxPercentageIGST: taxPercentageIGST,
        TaxAmountIGST: taxAmountIGST,
        LocalAmount: localAmount,
        PartyAmount: partyAmount,
        MasterJobSid: detail.MasterJobSid,
        HouseJobSid: detail.HouseJobSid,
        ProfitCenterMasterSid: detail.ProfitCenterMasterSid,
        CostCenterMasterSid: detail.CostCenterMasterSid,
        COAMasterSid: detail.COAMasterSid,
        LedgerMasterSid: detail.LedgerMasterSid,
      }));
    });

    const voucherOthersSource = data.VoucherOthers
      || data.voucherOthers
      || (Array.isArray(data.voucherOthers) ? data.voucherOthers[0] : undefined);

    if (voucherOthersSource) {
      const vg = this.reverseVoucherForm.get('voucherOthers') as FormGroup;
      vg.patchValue({
        ContainerNumber: voucherOthersSource.ContainerNumber || '',
        VoucherNote: voucherOthersSource.VoucherNote || '',
        Footer: voucherOthersSource.Footer || '',
        ReverseCreditNote: voucherOthersSource.ReverseCreditNote || '',
        DueDate: this.toNgbDate(voucherOthersSource.DueDate),
        IRNNumber: voucherOthersSource.IRNNumber || ''
      });
    }

    console.log('DEBUG - Final details array length:', this.details.length);
    this.validateAmount();

  }

  loadVoucherPeriods(): void {
    this.voucherPeriodService.loadPeriods(
      this.currentCompany?.CompanyMasterSid,
      this.currentBranch?.BranchMasterSid,
      this.currentFinancialYear,
      () => this.applyVoucherDateConstraints()
    );
  }

  private toNgbDate(d: any): NgbDateStructLike | null {
    if (!d) return null;
    const dt = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return null;
    return { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() };
  }

  onFinalSave() {
    this.showVoucherDateError = true;
    this.applyVoucherDateConstraints();
    if (this.voucherConstraints.isClosed) {
      if (this.voucherConstraints.errorMessage) this.appSettingService.showWarning(this.voucherConstraints.errorMessage);
      return;
    }
    if (this.reverseVoucherForm.invalid) {
      this.reverseVoucherForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill required reverse voucher fields.');
      return;
    }

    if (this.details.length === 0) {
      this.appSettingService.showWarning('Please add at least one charge line.');
      return;
    }

    this.saveReverseVoucher(true); // true indicates final save
  }

  private saveReverseVoucher(isFinal: boolean) {
    const payload = this.preparePayload();

    this.spinner.show();

    const saveObservable = this.headerId
      ? this.operationService.updateReverseVoucherById(this.headerId, payload)
      : this.operationService.createReverseVoucher(payload);

    saveObservable.subscribe({
      next: async (resp: any) => {
        if (resp?.status) {
          const voucherHeaderSid = resp.data?.newVoucher?.VoucherHeaderSid || resp.data?.VoucherHeaderSid || this.headerId;

          if (isFinal && voucherHeaderSid) {
            // If final save, post the voucher
            await this.postVoucher(voucherHeaderSid);
          } else {
            this.spinner.hide();
            const message = isFinal ? 'Reverse Voucher saved and posted successfully!' : 'Reverse Voucher saved as draft successfully!';
            this.appSettingService.showSuccess(message);

            if (!this.headerId && voucherHeaderSid) {
              this.headerId = voucherHeaderSid;
              this.router.navigate(['operation/reverse-voucher/entry', voucherHeaderSid]);
            }
          }
        } else {
          this.spinner.hide();
          this.appSettingService.showError('Error saving Reverse Voucher.');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Save Reverse Voucher error', err);
        this.appSettingService.showError('Failed to save Reverse Voucher.');
      }
    });
  }

  private async postVoucher(voucherHeaderSid: number) {
    try {
      const currentCompany = this.currentCompany;
      const currentBranch = this.currentBranch;
      const currentFinancialYear = Number(localStorage.getItem('current-year-id'));
      const currentCountry = Number(this.currentCompany?.CountryMasterSid);
      const currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
      const currentCountryName = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      const currentUserEmail = this.userData?.userEmail;



      if (!currentCompany || !currentBranch || !currentFinancialYear || !currentCountry || !currentCurrency) {
        throw new Error('Company, branch, or financial year or country information is missing');

      }

      const postPayload = {
        VoucherHeaderSid: voucherHeaderSid,
        CompanyMasterSid: currentCompany.CompanyMasterSid,
        BranchMasterSid: currentBranch.BranchMasterSid,
        YearMasterSid: currentFinancialYear,
        LocalCurrencyMasterSid: currentCurrency,
        LocalCurrencyCode: currentCompany.CurrencyCode,
        PostedBy: currentUserEmail,
        TaxDetails: {
          CountryMasterSid: this.currentCompanyCountry,
          countryCode: this.currentCompanyCountryCode,
          TaxCategory: 'Inter',
          EffectiveFrom: new Date().toISOString(),
          TaxType: 'Output'
        }
      };

      const result = await firstValueFrom(this.operationService.postVoucherSid(postPayload));

      this.spinner.hide();
      if (result.status) {
        this.appSettingService.showSuccess('Reverse Voucher posted successfully!');
        this.reverseVoucherData.PostStatus = 'P'; // Update local state

        // Navigate to list or stay on page but disable edits
        this.router.navigate(['accounts/reverse-voucher/list']);
      } else {
        this.appSettingService.showError(result.message || 'Failed to post Reverse Voucher.');
      }
    } catch (error) {
      this.spinner.hide();
      console.error('Post voucher error:', error);
      this.appSettingService.showError('Failed to post Reverse Voucher. Please try again.');
    }
  }

  

  createDetailGroup(data?: any): FormGroup {
    return this.fb.group({
      VoucherDetailSid: [data?.VoucherDetailSid || null],
      CostRevenueChargesSid: [data?.CostRevenueChargesSid || null], // Store original cost ID
      ChargeMasterSid: [{ value: data?.ChargeMasterSid || null, disabled: true }],
      ChargeDescription: [{ value: data?.ChargeDescription || '', disabled: true }],
      HSSACMasterSid: [{ value: data?.HSSACMasterSid || null, disabled: true }],
      ChargeUOMSid: [{ value: data?.ChargeUOMSid || null, disabled: true }],
      NumberOfUnit: [{ value: data?.NumberOfUnit || 1, disabled: true }],
      DrCr: [{ value: data?.DrCr || 'D', disabled: true }],
      CurrencyCode: [{ value: data?.CurrencyCode || this.reverseVoucherForm.get('CurrencyCode')?.value || null, disabled: true }],
      Rate: [data?.Rate != null ? Number(data.Rate) : 0],
      ExchangeRate: [{ value: data?.ExchangeRate || this.reverseVoucherForm.get('ExchangeRate')?.value || 1, disabled: true }],
      Amount: [{ value: data?.Amount || 0, disabled: true }],
      TaxableAmount: [{ value: data?.TaxableAmount || 0, disabled: true }],
      TaxPercentage1: [{ value: data?.TaxPercentage1 || 0, disabled: true }],
      TaxAmount1: [{ value: data?.TaxAmount1 || 0, disabled: true }],
      TaxPercentage2: [{ value: data?.TaxPercentage2 || 0, disabled: true }],
      TaxAmount2: [{ value: data?.TaxAmount2 || 0, disabled: true }],
      TaxPercentageIGST: [{ value: data?.TaxPercentageIGST || 0, disabled: true }],
      TaxAmountIGST: [{ value: data?.TaxAmountIGST || 0, disabled: true }],
      LocalAmount: [{ value: data?.LocalAmount || 0, disabled: true }],
      PartyAmount: [{ value: data?.PartyAmount || 0, disabled: true }],
      MasterJobSid: [{ value: data?.MasterJobSid || null, disabled: true }],
      HouseJobSid: [{ value: data?.HouseJobSid || null, disabled: true }],
      DepartmentMasterSid: [{ value: data?.DepartmentMasterSid || null, disabled: true }],
      LedgerMasterSid: [{ value: data?.LedgerMasterSid || null, disabled: true }],
      COAMasterSid: [{ value: data?.COAMasterSid || null, disabled: true }],
      ProfitCenterMasterSid: [{ value: data?.ProfitCenterMasterSid || null, disabled: true }],
      CostCenterMasterSid: [{ value: data?.CostCenterMasterSid || null, disabled: true }],
    });
  }

  getDepartmentName(departmentSid: number): string {
    if (!departmentSid || this.departmentList.length === 0) {
      return '-';
    }
    const department = this.departmentList.find(dept =>
      dept.DepartmentMasterSid === departmentSid ||
      dept.departmentMasterSid === departmentSid
    );
    return department?.DepartmentName || department?.departmentName || '-';
  }

  renumberRows() {
    this.details.controls.forEach((row, i) => {
      row.patchValue({ Sno: i + 1 }, { emitEvent: false });
    });
  }


  // Vendor selection
  onVendorChange(selected: any) {
    const vendorMasterSid = (typeof selected === 'object' && selected !== null)
      ? (selected.CustomerMasterSid ?? selected)
      : selected;

    if (!vendorMasterSid) {
      this.vendorBranchList = [];
      this.reverseVoucherForm.get('CustomerBranchSid')?.setValue(null);
      this.reverseVoucherForm.get('PartyAddress')?.setValue('');
      this.reverseVoucherForm.get('PartyMasterSid')?.setValue(null); // Clear PartyMasterSid
      this.reverseVoucherForm.get('GSTNo')?.setValue('');
      this.reverseVoucherForm.get('PartyName')?.setValue('');
      this.reverseVoucherForm.get('PlaceOfSupply')?.setValue('');
      this.reverseVoucherForm.get('InvoiceType')?.setValue('B2B');
      this.reverseVoucherForm.get('GSTType')?.setValue('');
      return;
    }

    const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
    if (vendor) {
      // Set PartyName to vendor name
      this.reverseVoucherForm.get('PartyName')?.setValue(vendor.CustomerName || '');

      // CRITICAL: Set PartyMasterSid from vendor's SubledgerMasterSid
      if (vendor.SubledgerMasterSid) {
        this.reverseVoucherForm.get('PartyMasterSid')?.setValue(Number(vendor.SubledgerMasterSid));
        console.log('DEBUG - Set PartyMasterSid from vendor:', vendor.SubledgerMasterSid);
      } else {
        console.warn('DEBUG - Vendor has no SubledgerMasterSid:', vendor);
        this.reverseVoucherForm.get('PartyMasterSid')?.setValue(null);
      }

      // Rest of your existing code for GST, InvoiceType, etc...
      const countryCode = this.getCustomerCountryCode(vendor);
      console.log('Vendor Country Code:', countryCode);

      if (countryCode === 'IN' && vendor.GSTNo) {
        this.reverseVoucherForm.get('InvoiceType')?.setValue('B2B');
        console.log('Invoice Type: B2B (Indian vendor with GST)');
      } else if (countryCode !== 'IN') {
        this.reverseVoucherForm.get('InvoiceType')?.setValue('EXPWP');
        console.log('Invoice Type: EXPWP (Export vendor)');
      } else {
        this.reverseVoucherForm.get('InvoiceType')?.setValue('B2C');
        console.log('Invoice Type: B2C (Indian vendor without GST)');
      }

      if (this.currentCompanyCountryCode !== 'in') {
        this.reverseVoucherForm.get('GSTType')?.setValue('VAT');
      }

      // Load TDS configuration
      // this.loadVendorTDS(vendorMasterSid);
    }

    // Reset branch selection when vendor changes
    this.reverseVoucherForm.get('CustomerBranchSid')?.setValue(null);
    this.reverseVoucherForm.get('PartyAddress')?.setValue('');
    this.reverseVoucherForm.get('PlaceOfSupply')?.setValue('');
    this.reverseVoucherForm.get('GSTType')?.setValue('');
    this.getVendorBranchByVendor(Number(vendorMasterSid));
  }

  // Enhanced vendor branch selection
  onVendorBranchChange(selectedBranch: any) {
    const branchSid = (typeof selectedBranch === 'object' && selectedBranch !== null)
      ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
      : selectedBranch;

    if (!branchSid) {
      this.reverseVoucherForm.get('PartyAddress')?.setValue('');
      this.reverseVoucherForm.get('GSTNo')?.setValue('');
      this.reverseVoucherForm.get('PlaceOfSupply')?.setValue('');
      return;
    }

    const foundBranch = this.vendorBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));

    if (foundBranch) {
      // Set address from branch
      const address = foundBranch.Address || foundBranch.CustomerAddress1 || foundBranch.customerAddress || '';
      this.reverseVoucherForm.get('PartyAddress')?.setValue(address);

      // Get Place of Supply from state lookup
      let placeOfSupply = '';
      const stateMasterSid = foundBranch.StateMasterSid;

      if (stateMasterSid && this.stateList.length > 0) {
        const state = this.stateList.find(s =>
          s.StateMasterSid === stateMasterSid ||
          s.stateMasterSid === stateMasterSid
        );
        if (state) {
          placeOfSupply = state.stateName || state.StateName || '';
        }
      }

      // If no state found, try to get city or use empty
      if (!placeOfSupply) {
        placeOfSupply = foundBranch.City || foundBranch.city || '';
      }

      console.log('Setting Place of Supply:', placeOfSupply);
      this.reverseVoucherForm.get('PlaceOfSupply')?.setValue(placeOfSupply);

      // Set GST No based on country
      const vendorMasterSid = foundBranch.CustomerMasterSid;
      if (vendorMasterSid) {
        const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
        if (vendor) {
          const countryCode = this.getCustomerCountryCode(vendor);
          if (countryCode === 'IN') {
            this.reverseVoucherForm.get('GSTNo')?.setValue(foundBranch.GSTNo || '');
          } else {
            this.reverseVoucherForm.get('GSTNo')?.setValue(vendor.PanType || '');
          }
        }
      }

      
    } else {
      this.reverseVoucherForm.get('PartyAddress')?.setValue('');
      this.reverseVoucherForm.get('GSTNo')?.setValue('');
      this.reverseVoucherForm.get('PlaceOfSupply')?.setValue('');
    }
  }

  getStateNameFromVendor(vendorMasterSid: number): string {
    const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
    if (vendor && vendor.stateMaster) {
      return vendor.stateMaster.stateName || vendor.stateMaster.StateName || '';
    }
    return '';
  }
  
  getCompanyState(): string {
    if (!this.currentCompany) {
      console.warn('No current company data available');
      return '';
    }

    console.log('=== COMPANY STATE DEBUG ===');
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    console.log('User Data:', this.userData);

    // Method 5: Navigate through userData structure to get branch state
    if (this.userData && this.userData.userCompanyMaster) {
      const userCompanies = this.userData.userCompanyMaster;

      // Find the current company in user companies
      const currentUserCompany = userCompanies.find((uc: any) =>
        uc.CompanyMasterSid === this.currentCompany.CompanyMasterSid
      );

      if (currentUserCompany && currentUserCompany.companyMaster) {
        const companyMaster = currentUserCompany.companyMaster;

        // Check company master's userBranchMaster
        if (companyMaster.userBranchMaster && Array.isArray(companyMaster.userBranchMaster)) {
          // Find the current branch
          const currentUserBranch = companyMaster.userBranchMaster.find((ub: any) =>
            ub.BranchMasterSid === this.currentBranch.BranchMasterSid
          );

          if (currentUserBranch && currentUserBranch.branchMaster) {
            const branchMaster = currentUserBranch.branchMaster;

            // Method 5a: Check branchMaster's stateMaster
            if (branchMaster.stateMaster) {
              const state = branchMaster.stateMaster.stateName || branchMaster.stateMaster.StateName;
              if (state) {
                console.log('Company State from userData->branchMaster->stateMaster:', state);
                return state;
              }
            }

            // Method 5b: Check branchMaster's StateMasterSid
            if (branchMaster.StateMasterSid && this.stateList.length > 0) {
              const state = this.stateList.find(s =>
                s.StateMasterSid === branchMaster.StateMasterSid ||
                s.stateMasterSid === branchMaster.StateMasterSid
              );
              if (state) {
                const stateName = state.stateName || state.StateName;
                console.log('Company State from userData->branchMaster->StateMasterSid lookup:', stateName);
                return stateName;
              }
            }
          }
        }

        // Method 6: Check company master's StateMasterSid
        if (companyMaster.StateMasterSid && this.stateList.length > 0) {
          const state = this.stateList.find(s =>
            s.StateMasterSid === companyMaster.StateMasterSid ||
            s.stateMasterSid === companyMaster.StateMasterSid
          );
          if (state) {
            const stateName = state.stateName || state.StateName;
            console.log('Company State from userData->companyMaster->StateMasterSid lookup:', stateName);
            return stateName;
          }
        }
      }
    }

    console.log('No company state found after all attempts');
    return '';
  }
  getStateNameBySid(stateMasterSid: number): string {
    if (!stateMasterSid || this.stateList.length === 0) return '';

    const state = this.stateList.find(s =>
      s.StateMasterSid === stateMasterSid ||
      s.stateMasterSid === stateMasterSid
    );

    return state?.stateName || state?.StateName || '';
  }
  // Enhanced getVendorBranchByVendor method with callback
  getVendorBranchByVendor(CustomerMasterSid: number, callback?: (branches: any[]) => void) {
    if (!CustomerMasterSid) {
      this.vendorBranchList = [];
      if (callback) callback([]);
      return;
    }

    this.operationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          this.vendorBranchList = Array.isArray(resp.data) ? resp.data : resp.data;

          if (callback) {
            callback(this.vendorBranchList);
          }

          // Auto-select the branch if there's a pending selection
          if (this.pendingBranchToSelect) {
            const branchId = this.pendingBranchToSelect;
            this.pendingBranchToSelect = null;
            this.triggerVendorBranchChange(branchId);
          }
        } else if (Array.isArray(resp)) {
          this.vendorBranchList = resp;
          if (callback) callback(this.vendorBranchList);
        } else if (resp?.data) {
          this.vendorBranchList = resp.data;
          if (callback) callback(this.vendorBranchList);
        } else {
          this.vendorBranchList = [];
          if (callback) callback([]);
        }
      },
      error: (err) => {
        console.error('Error fetching vendor branches', err);
        this.vendorBranchList = [];
        if (callback) callback([]);
      }
    });
  }


  private getCustomerCountryCode(vendor: any): string {
    if (vendor.CountryMasterSid && typeof vendor.CountryMasterSid === 'object') {
      const code = vendor.CountryMasterSid.countryCode || vendor.CountryMasterSid.CountryCode;
      return code || '';
    }

    const countryCode = vendor.CountryCode ||
      vendor.countryCode ||
      vendor.countryMaster?.countryCode ||
      vendor.country?.countryCode ||
      vendor.CountryMaster?.CountryCode ||
      '';

    if (!countryCode) {
      const vendorBranches = this.vendorBranchList.filter(b => b.CustomerMasterSid === vendor.CustomerMasterSid);
      const hasGSTNo = vendorBranches.some(branch => branch.GSTNo);
      if (hasGSTNo) {
        return 'IN';
      }
    }

    return countryCode;
  }
  onVendorSelect(vendor: any) {
    const vendors = (typeof vendor === 'object' && vendor !== null)
      ? (vendor.vendors ?? vendor)
      : vendor;
    if (!vendor) {
      this.vendorList = [];
      this.reverseVoucherForm.get('PartyAddress')?.setValue('');
      return;
    }
    this.reverseVoucherForm.get('PartyAddress')?.setValue(vendor.Address || '');
  }

 

  private autoPopulateVendorFromSelection(vendor: any) {
    if (!vendor) return;

    // Set vendor information in main form
    this.reverseVoucherForm.patchValue({
      PartyName: vendor.VendorName || vendor.CustomerName,
      PartyMasterSid: vendor.VendorSid
    });

    // Load vendor branches
    this.getVendorBranchByVendor(vendor.VendorSid, (branches) => {
      if (branches.length > 0) {
        const matchingBranch = branches.find(branch =>
          branch.Address?.includes(vendor.VendorAddress) ||
          branch.CustomerAddress1?.includes(vendor.VendorAddress)
        );

        const branchToSelect = matchingBranch || branches[0];

        if (branchToSelect) {
          this.reverseVoucherForm.get('CustomerBranchSid')?.setValue(branchToSelect.CustomerBranchSid);
          this.triggerVendorBranchChange(branchToSelect.CustomerBranchSid);
        }
      }
    });

    // Set vendor address
    this.reverseVoucherForm.patchValue({
      PartyAddress: vendor.VendorAddress || vendor.Address || ''
    });
  }

  toggleCostSelection(costSid: number) {
    if (this.selectedCosts.has(costSid)) {
      this.selectedCosts.delete(costSid);
    } else {
      this.selectedCosts.add(costSid);
    }
  }
  private triggerVendorBranchChange(customerBranchSid: number) {
    const foundBranch = this.vendorBranchList.find(b =>
      Number(b.CustomerBranchSid) === Number(customerBranchSid)
    );

    if (foundBranch) {
      // Set address from branch
      const address = foundBranch.Address || foundBranch.CustomerAddress1 || foundBranch.customerAddress || '';
      this.reverseVoucherForm.get('PartyAddress')?.setValue(address);

      // Get Place of Supply from state lookup
      let placeOfSupply = '';
      const stateMasterSid = foundBranch.StateMasterSid;

      if (stateMasterSid && this.stateList.length > 0) {
        const state = this.stateList.find(s =>
          s.StateMasterSid === stateMasterSid ||
          s.stateMasterSid === stateMasterSid
        );
        if (state) {
          placeOfSupply = state.stateName || state.StateName || '';
        }
      }

      // If no state found, try to get city or use empty
      if (!placeOfSupply) {
        placeOfSupply = foundBranch.City || foundBranch.city || '';
      }

      console.log('Setting Place of Supply:', placeOfSupply);
      this.reverseVoucherForm.get('PlaceOfSupply')?.setValue(placeOfSupply);

      // Set GST No based on country
      const vendorMasterSid = foundBranch.CustomerMasterSid;
      if (vendorMasterSid) {
        const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
        if (vendor) {
          const countryCode = this.getCustomerCountryCode(vendor);
          if (countryCode === 'IN') {
            this.reverseVoucherForm.get('GSTNo')?.setValue(foundBranch.GSTNo || '');
          } else {
            this.reverseVoucherForm.get('GSTNo')?.setValue(vendor.PanType || '');
          }
        }
      }

    }
  }



  // Get selected costs
  getSelectedCosts(): any[] {
    return this.allPendingCosts.filter(cost => cost.selected);
  }



  applyVoucherDateConstraints(): void {
    // Validation runs in create AND edit mode (message shows when invalid).
    // Only view mode skips.
    if (this.isViewMode) {
      this.voucherConstraints = { isClosed: false, errorMessage: null };
      return;
    }
    const voucherDate = this.reverseVoucherForm?.get('VoucherDate')?.value;
    this.voucherConstraints = this.voucherPeriodService.applyConstraints(voucherDate, 'GL');
  }

  onVoucherDateChange(): void {
    this.applyVoucherDateConstraints();
    // Edit mode: reveal error label + gate button-disable now that user has changed the date
    if (this.headerId) this.showVoucherDateError = true;
  }




  getMasterJobNumber(jobSid: number): string {
    const job = this.masterJobList.find(j => j.MasterJobSid === jobSid);
    return job?.MasterJobNumber || job?.displayLabel || '-';
  }
  loadReverseVoucherById(id: number) {
    this.operationService.getReverseVoucherById(id).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.destroy$.next();
          this.destroy$.complete();
          console.log(response.data, 'loadReverseVoucherById')
          this.reverseVoucherData = response.data;
          this.populateForm(this.reverseVoucherData);
          this.applyVoucherDateConstraints();
          if (this.isReadOnly) {
            this.details.disable({ emitEvent: false });
            this.isDirty = false;
            this.initialFormValue = this.reverseVoucherForm.getRawValue();
            this.reverseVoucherForm.disable();
            this.destroy$.next();
            this.destroy$.complete();
            return;
          } else {
            setTimeout(() => {
              this.initialFormValue = this.reverseVoucherForm.getRawValue();
              this.isDirty = false;
              this.subscribeToFormChanges();
            }, 0);
          }
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



  formatDateForDisplay(date: string | Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }

  populateForm(data: any) {

    console.log('populateForm called with data:', data);

    const currency = this.currencyList.find(c => c.CurrencyMasterSid === data.CurrencyMasterSid)
    const header = data;
    const customerMasterSidFromBranch = header?.customerBranch?.CustomerMasterSid
      || header?.CustomerBranch?.CustomerMasterSid
      || null;

    console.log(currency, 'currency')
    this.reverseVoucherForm.patchValue({
      ReversalVoucher: header.ReversalVoucher,
      ReversalVoucherNumber: header.reversalVoucher?.VoucherNumber || '',
      VoucherNumber: header.VoucherNumber,
      VoucherDate: header.VoucherDate,
      CustomerMasterSid: header.CustomerMasterSid || customerMasterSidFromBranch || null,
      PartyMasterSid: header.PartyMasterSid,
      PartyName: header.PartyName,
      PartyAddress: header.PartyAddress,
      CustomerBranchSid: header.CustomerBranchSid || customerMasterSidFromBranch || null,
      GSTNo: header.GST_VAT,
      PlaceOfSupply: header.PlaceOfSupply,
      PostedOn: header.PostDate ? this.formatDateForDisplay(header.PostDate) : null,
      CurrencyCode: header.CurrencyCode,
      ExchangeRate: header.ExchangeRate || 1,
      BillNo: header.DocumentNumber,
      BillDate: header.DocumentDate ? this.formatDateForNgb(header.DocumentDate) : null,
      BillAmt: header.Amount || 0,
      MBLNo: header.MasterNumber,
      HBLNo: header.HouseNumber,
      CreditNoteReason: header.CreditNoteReason || '',
      PostStatus: header.PostStatus,
      InvoiceType: header.InvoiceType || 'B2B',
      GSTType: header.GSTType,
      Narration: header.Narration || '',
      Remarks: header.Remarks || (header.VoucherOthers && header.VoucherOthers[0]?.Remarks) || '',
      MasterJobSid: header.MasterJobSid,
      HouseJobSid: header.HouseJobSid,
      Status: header.Status
    });
    console.log('DEBUG - data.PartyName:', header.PartyName);
    console.log('DEBUG - data.PartyAddress:', header.PartyAddress);
    console.log('DEBUG - data.CustomerBranchSid:', header.CustomerBranchSid);
    const cm = header.CustomerMasterSid || customerMasterSidFromBranch || null;
    console.log('DEBUG - cm:', cm);
    const branchSid = header.CustomerBranchSid || header.PartyName || (header.customerBranch ? header.customerBranch.CustomerBranchSid : null) || null;
    console.log('DEBUG - branchSid:', branchSid);
    this.pendingBranchToSelect = branchSid ? Number(branchSid) : null;
    this.getVendorBranchByVendor(cm);
    console.log('DEBUG - pendingBranchToSelect:', this.pendingBranchToSelect);
    if (branchSid) {
      this.reverseVoucherForm.get('CustomerBranchSid')?.setValue(Number(branchSid));
      this.pendingBranchToSelect = Number(branchSid);
      console.log('DEBUG - pendingBranchToSelect:', this.pendingBranchToSelect);
      const currentVendor = this.reverseVoucherForm.get('CustomerMasterSid')?.value;
      if (currentVendor) {
        this.getVendorBranchByVendor(Number(currentVendor));
      } else {
        const found = this.vendorBranchList.find(b =>
          Number(b.CustomerBranchSid) === Number(branchSid) ||
          Number(b.CustomerName) === Number(branchSid)
        );
        if (found) {
          this.reverseVoucherForm.get('PartyName')?.setValue(Number(branchSid));
          this.reverseVoucherForm.get('PartyAddress')?.setValue(found.Address);
        }
      }
    }

    // Edit mode: datepicker keeps the full FY range so user can re-date into any past month.


    this.details.clear();
    console.log('Details array cleared, length:', this.details.length);

    if (data.VoucherDetail && Array.isArray(data.VoucherDetail)) {
      console.log('Populating details, count:', data.VoucherDetail.length);
      data.VoucherDetail.forEach((detail: any, index: number) => {
        console.log(`Processing detail ${index}:`, detail);
        const row = this.createDetailGroup({
          Sno: detail.Sno,
          VoucherDetailSid: detail.VoucherDetailSid,
          ChargeMasterSid: detail.ChargeMasterSid,
          ChargeDescription: detail.ChargeDescription,
          HSSACMasterSid: detail.HSSACMasterSid,
          ChargeUOMSid: detail.ChargeUOMSid,
          NumberOfUnit: detail.NumberOfUnit,
          DrCr: detail.DrCr,
          CurrencyCode: detail.CurrencyCode,
          ExchangeRate: detail.ExchangeRate,
          Rate: detail.Rate,
          Amount: detail.Amount,
          TaxableAmount: detail.TaxableAmount,
          TaxPercentage1: detail.TaxPercentage1,
          TaxAmount1: detail.TaxAmount1,
          TaxPercentage2: detail.TaxPercentage2,
          TaxAmount2: detail.TaxAmount2,
          LocalAmount: detail.LocalAmount,
          MasterJobSid: detail.MasterJobSid,
          HouseJobSid: detail.HouseJobSid,
          DepartmentMasterSid: detail.DepartmentMasterSid,
          Remarks: detail.Remarks,
          COAMasterSid: detail.COAMasterSid,
          LedgerMasterSid: detail.LedgerMasterSid,
          ProfitCenterMasterSid: detail.ProfitCenterMasterSid,
          CostCenterMasterSid: detail.CostCenterMasterSid,
        });
        console.log(`Created form group for detail ${index}:`, row.value);
        this.details.push(row);
        console.log(`Pushed row to details array, new length: ${this.details.length}`);
      });
      console.log('Finished populating details. Final length:', this.details.length);
      console.log('Details controls:', this.details.controls);
      this.validateAmount();
    } else {
      console.log('VoucherDetail is missing or not an array');
    }
    if (data.VoucherOthers && data.VoucherOthers.length > 0) {
      const others = data.VoucherOthers[0];
      this.reverseVoucherForm.get('voucherOthers')?.patchValue({
        ContainerNumber: others.ContainerNumber || '',
        VoucherNote: others.VoucherNote || '',
        Footer: others.Footer || ''
      });
    }
  }

  preparePayload(): any {
    const formValue = this.reverseVoucherForm.getRawValue();
    const financialYear = this.appSettingService.getCurrentFinancialYear();

    const payload: any = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      ReversalVoucher: formValue.ReversalVoucher || null,
      PartyMasterSid: formValue.PartyMasterSid,
      PartyName: formValue.PartyName,
      PartyAddress: formValue.PartyAddress,
      CustomerBranchSid: formValue.CustomerBranchSid,
      GSTNo: formValue.GSTNo,
      PlaceOfSupply: formValue.PlaceOfSupply,
      CurrencyCode: formValue.CurrencyCode,
      CurrencyMasterSid: this.currencyList.find(c => c.currencyCode === formValue.CurrencyCode)?.CurrencyMasterSid,
      ExchangeRate: formValue.ExchangeRate,
      BillNo: formValue.BillNo,
      BillDate: this.fromNgbDate(formValue.BillDate),
      BillAmt: formValue.BillAmt,
      MBLNo: formValue.MBLNo,
      HBLNo: formValue.HBLNo,
      PostStatus: formValue.PostStatus,
      InvoiceType: formValue.InvoiceType,
      GSTType: this.currentCompanyCountryCode !== 'in' ? 'VAT' : (formValue.GSTType || ''),
      State: this.currentCompanyCountryCode !== 'in' ? 'Inter' : (formValue.PlaceOfSupply === this.currentBranchState?.stateName ? 'Inter' : 'Intra'),
      Narration: formValue.Narration,
      MasterJobSid: formValue.MasterJobSid,
      HouseJobSid: formValue.HouseJobSid,
      VoucherDate: formValue.VoucherDate,
      PostDate: formValue.PostedOn ? this.fromNgbDate(formValue.PostedOn) : null,
      status: formValue.Status,
      CreatedBy: this.currUserEmail || 'System',
      UpdatedBy: this.currUserEmail || 'System',
      YearMasterSid: financialYear.YearMasterSid
    };

    // Add details with CostRevenueChargesSid
    payload.VoucherDetail = formValue.voucherDetails.map((detail: any, index: number) => ({
      Sno: index + 1,
      VoucherDetailSid: detail.VoucherDetailSid,
      CostRevenueChargesSid: detail.CostRevenueChargesSid, // Include original cost ID
      ChargeMasterSid: detail.ChargeMasterSid,
      ChargeDescription: detail.ChargeDescription,
      HSSACMasterSid: detail.HSSACMasterSid,
      ChargeUOMSid: detail.ChargeUOMSid,
      NumberOfUnit: detail.NumberOfUnit,
      Rate: detail.Rate,
      Amount: detail.Amount,
      TaxableAmount: detail.TaxableAmount,
      TaxPercentage1: detail.TaxPercentage1 || 0,
      TaxAmount1: detail.TaxAmount1 || 0,
      TaxPercentage2: detail.TaxPercentage2 || 0,
      TaxAmount2: detail.TaxAmount2 || 0,
      TaxPercentageIGST: detail.TaxPercentageIGST || 0,
      TaxAmountIGST: detail.TaxAmountIGST || 0,
      LocalAmount: detail.LocalAmount,
      CurrencyCode: detail.CurrencyCode,
      CurrencyMasterSid: this.currencyList.find(c => c.currencyCode === detail.CurrencyCode)?.CurrencyMasterSid,
      ExchangeRate: detail.ExchangeRate,
      DrCr: detail.DrCr,
      LedgerMasterSid: detail.LedgerMasterSid,
      MasterJobSid: detail.MasterJobSid,
      HouseJobSid: detail.HouseJobSid,
      DepartmentMasterSid: detail.DepartmentMasterSid,
      Remarks: detail.Remarks,
      COAMasterSid: detail.COAMasterSid,
      ProfitCenterMasterSid: detail.ProfitCenterMasterSid,
      CostCenterMasterSid: detail.CostCenterMasterSid,
    }));

    // Add TDS
    // payload.VoucherTDS = this.prepareVoucherTDSPayload(formValue.voucherDetails);

    // Add others
    payload.VoucherOthers = {
      ...formValue.voucherOthers,
      Remarks: formValue.Remarks || ''
    };

    return payload;
  }



  get isPosted(): boolean {
    return this.reverseVoucherData?.PostStatus === 'P';
  }

  // Check if voucher is draft
  get isDraft(): boolean {
    return !this.reverseVoucherData?.PostStatus || this.reverseVoucherData?.PostStatus === 'U';
  }


  onReset() {
    if (this.isEditMode) {
      this.loadReverseVoucherById(this.headerId!);
    } else {
      const voucherDate = this.reverseVoucherForm.get('VoucherDate')?.value;
      this.reverseVoucherForm.reset();
      this.details.clear();
      // this.tdsGroup.reset();
      const currencySettings = this.companySettings.getCurrencySettings();
      this.reverseVoucherForm.patchValue({
        VoucherDate: voucherDate,
        CurrencyCode: currencySettings.code,
        ExchangeRate: 1,
        InvoiceType: 'B2B',
        Status: 'A'
      });
    }
  }

  onCancel() {
    
    this.router.navigate(['/accounts/reverse-voucher/list']);
  }

  onPrint() {
    window.print();
  }

  getChargeName(chargeMasterSid: number): string {
    if (!chargeMasterSid) return '-';
    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeMasterSid);
    return charge?.chargeCode || '-';
  }

  onSubmit(resolve?: (value: boolean) => void, isPostingTrue?: boolean) {
    // Validate voucher date is within financial year
    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy) {
      const voucherDate = new Date(this.reverseVoucherForm.getRawValue().VoucherDate);
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

    if (this.reverseVoucherForm.invalid) {
      this.markFormGroupTouched(this.reverseVoucherForm);
      this.appSettingService.showError('Please fill all required fields');
      return;
    }

    const raw = this.reverseVoucherForm.getRawValue();
    const autoPostingButNoPosted = this.isAutoPosting && !this.isPosted;
    if (this.isEditMode && autoPostingButNoPosted) {
      this.appSettingService.showWarning(
        'Auto Posting is currently enabled.\n\nPlease switch to Manual Posting and post this reverse voucher first.\nAfter posting, you can switch back to Auto Posting.',
      );
      if (resolve) resolve(false);
      return;
    }
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.reverseVoucherForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }
    if (this.details.length === 0) {
      this.appSettingService.showError('Please get the voucher to be reversed');
      return;
    }
    const payload = this.preparePayload();
    this.isSaving = true;
    this.spinner.show();

    if (this.isEditMode && this.headerId) {
      this.operationService.updateReverseVoucherById(this.headerId, payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          this.isSaving = false;
          this.isDirty = false;
          if (response.status) {
            this.appSettingService.showSuccess('Reverse Voucher updated successfully');
            const id = response.data?.newVoucher?.VoucherHeaderSid || response.data?.VoucherHeaderSid || response.data?.voucherHeaderSid || null;
            this.router.navigate(['/accounts/reverse-voucher/entry', id]);
          } else {
            this.appSettingService.showError(response.message);
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError('Error updating Reverse Voucher');
          console.error('Error:', error);
        }
      });
    } else {
      this.operationService.createReverseVoucher(payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          this.isSaving = false;
          this.isDirty = false;
          if (response.status) {
            this.appSettingService.showSuccess('Reverse Voucher created and posted successfully');
            const id = response.data?.newVoucher?.VoucherHeaderSid || response.data?.VoucherHeaderSid || response.data?.voucherHeaderSid || null;
            if (id) this.router.navigate(['/accounts/reverse-voucher/entry', id]);
            else this.router.navigate(['/accounts/reverse-voucher/list']);
          } else {
            this.appSettingService.showError(response.message);
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError(error.error?.message || error.message || error);
          console.error('Error:', error);
        }
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.reverseVoucherForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isDetailFieldInvalid(index: number, fieldName: string): boolean {
    const row = this.details.at(index) as FormGroup;
    const field = row.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  setToday(fieldName: string, datepicker: any): void {
    const today = new Date();
    const ngbDate = { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };
    this.reverseVoucherForm.get(fieldName)?.setValue(ngbDate);
    datepicker.close();
  }


  formatDateForNgb(date: string | Date | null): NgbDateStructLike | null {
    if (!date) return null;
    const d = new Date(date);
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  }

  private fromNgbDate(s: NgbDateStructLike | null): Date | null {
    if (!s || !s.year) return null;
    return new Date(s.year, (s.month || 1) - 1, s.day || 1);
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }


  getPostStatusDisplay(): string {
    const postStatus = this.reverseVoucherForm.get('PostStatus')?.value;
    if (postStatus === 'P') {
      return 'Posted';
    } else if (postStatus === 'U') {
      return 'Unposted';
    }
    return postStatus || 'Unposted';
  }

  showInfo() {
    if (!this.reverseVoucherData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.reverseVoucherData;
    modalRef.componentInstance.idLabel = 'Reverse Voucher Id';
    modalRef.componentInstance.idValue = this.reverseVoucherData?.VoucherHeaderSid;
  }

  openAuditLogs() {
        if (!this.reverseVoucherData?.VoucherHeaderSid) return;
        const modalRef = this.modalService.open(AuditLogComponent, {
        centered: true,
        scrollable: true,
        size: 'xl',
        windowClass: 'audit-log-modal'
      });
      modalRef.componentInstance.title = 'RverseVoucher Logs';
      modalRef.componentInstance.tableName = 'VoucherHeader';
      modalRef.componentInstance.recordId = this.reverseVoucherData?.VoucherHeaderSid.toString();
      modalRef.componentInstance.screenName = 'ReverseVoucher';
      }

  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    const payload = { 
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.reverseVoucherData?.VoucherHeaderSid
     };
     const openModal = (terms: any[])=> {
      const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = terms || [];
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.reverseVoucherData?.VoucherHeaderSid;
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
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
  }

  openEmail() {
    if (!this.reverseVoucherData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.reverseVoucherData;
    modalRef.componentInstance.idLabel = 'Reverse Voucher Id';
    modalRef.componentInstance.idValue = this.reverseVoucherData?.VoucherHeaderSid;
  }

  openAuthority() {
    if (!this.reverseVoucherData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.reverseVoucherData;
    modalRef.componentInstance.idLabel = 'Reverse Voucher Id';
    modalRef.componentInstance.idValue = this.reverseVoucherData?.VoucherHeaderSid;
  }

  openEDoc() {
    if (!this.reverseVoucherData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.reverseVoucherData;
    modalRef.componentInstance.idLabel = 'Reverse Voucher Id';
    modalRef.componentInstance.idValue = this.reverseVoucherData.VoucherHeaderSid;
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: this.reverseVoucherData?.VoucherHeaderSid
    }

    this.commonService.documentData.set(data)
  }

  openFollowup() {

  }

  validatePartyMatchingAmount() {
    // Check if debits and credits are balanced
    const isBalanced = Math.abs(this.totalDebits - this.totalCredits) < 0.01;
    return !isBalanced; // Returns true if unbalanced
  }
  validateAmount() {
    let totalCredits = 0;
    let totalDebits = 0;

    // Use getRawValue() to get values from disabled controls
    const details = this.details.getRawValue() || [];

    details.forEach((vd) => {
      const amount = Number(vd.LocalAmount);
      if (vd.DrCr === 'C') {
        totalCredits += amount;
      } else if (vd.DrCr === 'D') {
        totalDebits += amount;
      }
    });

    this.totalCredits = totalCredits;
    this.totalDebits = totalDebits;
  }

  checkVoucherPostingMechanism() {
    const companyId = this.currentCompany?.CompanyMasterSid;
    const branchId = this.currentBranch?.BranchMasterSid;
    const menuName = 'Reverse Voucher';
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
}
