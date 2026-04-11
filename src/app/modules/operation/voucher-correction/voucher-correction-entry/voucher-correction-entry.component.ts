import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService, CurrencySettings } from 'src/app/core/services/company-settings-manager.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { OperationService } from '../../operation.service';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { toNgbDateStruct, getDefaultTodayDate, toNumber } from 'src/app/common/helper';
import { consistentExchangeRatesValidator } from 'src/app/core/ValidationFn/exRateConsistency.validators';
import { greaterThanZero } from 'src/app/core/ValidationFn/greaterThanZero.validators';
import { forkJoin, catchError, of } from 'rxjs';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { AccountsService } from 'src/app/modules/accounts/accounts.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { ReceiptService } from 'src/app/modules/accounts/services/receipt.service';

@Component({
  selector: 'app-voucher-correction-entry',
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
  templateUrl: './voucher-correction-entry.component.html',
  styleUrl: './voucher-correction-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
  ]
})
export class VoucherCorrectionEntryComponent implements OnInit {
  userData: any;
  selectedDocumentType: string = '';
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
  salesmanFetched: boolean = false;
  salesmanName: string | null = null;

  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;

  voucherForm!: FormGroup;
  headerId: number | null = null;
  voucherData: any;
  currentMenuId: number;
  isViewMode: boolean = false;
  get isEditMode() {
    return !!this.headerId && !this.isViewMode;
  }

  customerList: any[] = [];
  customerBranchList: any[] = [];
  currencyList: any[] = [];
  chargeList: any[] = [];
  hssacList: any[][] = [];
  coaList: any[] = [];
  subledgerList: any[] = [];
  ledgerList: any[][] = [];
  filteredCoaList: any[][] = [];
  costCenterList: any[] = [];
  profitCenterList: any[] = [];
  isSaving: boolean = false;
  uomList: any[] = [];
  paymentModes: { value: string; label: string }[] = [];
  departmentList: any[] = [];
  masterJobList: any[] = [];
  houseJobList: any[] = [];
  taxGroupList: any[] = [];
  vendorList: any[] = [];
  chargeTaxGroupMap: Map<number, any> = new Map();
  masterHouseMap: Map<number, any[]> = new Map();
  houseJobListByMasterJob: { [key: number]: any[] } = {};
  bookingModeCountry: string = 'india';
  cashTypeLedgers: any[] = [];
  bankTypedLedgers: any[] = [];
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  HSSACLookupConfig = DROPDOWN_CONFIGS.HSSAC;
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  masterJobLookupConfig = DROPDOWN_CONFIGS.MASTER_JOB;
  COALookupConfig = DROPDOWN_CONFIGS.COA_LEDGER;

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

  reason = [
    { id: 'Service Cancelled', name: 'Service Cancelled' },
    { id: 'Discount', name: 'Discount' },
    { id: 'Service Deficiency', name: 'Service Deficiency' },
    { id: 'Correction on Invoice', name: 'Correction on Invoice' },
    { id: 'Tax Changes', name: 'Tax Changes' },
    { id: 'Place of Supply Change', name: 'Place of Supply Change' },
    { id: 'Others', name: 'Others' },
  ];

  ModeofStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];

  modeOfPayment = [
    { label: 'Cash', value: 'C' },
    { label: 'Bank', value: 'B' }
  ]

  get f(): { [key: string]: AbstractControl } {
    return this.voucherForm.controls;
  }
  get details(): FormArray {
    return this.voucherForm.get('voucherDetails') as FormArray;
  }

  get transactions(): FormGroup {
    return this.voucherForm.get('voucherTransactions') as FormGroup;
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
    private commonService: CommonService,
    private currencyConfigService: CurrencyConfigurationService,
    private currencyFormatter: CurrencyFormatService,
    private numberToWords: NumberToWordsService,
    private accountService: AccountsService,
    private dropdownStore: DropdownStore,
    private receiptService: ReceiptService,
  ) { }

  ngOnInit(): void {
    try {
      const userProfile = this.appSettingService.getDecryptedUserProfile();
      if (userProfile) {
        this.userData = userProfile;
        this.currUserEmail = userProfile.userEmail;
      }
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
    this.initForm();
    this.updateVendorInvoiceValidators();
    this.updateReceiptValidators();
    this.voucherForm.get('CashOrBank')?.valueChanges.subscribe(() => {
  this.updateReceiptBankValidators();
});
    this.loadPaymentModes();
    this.loadLookups();
    this.loadDetailLookups();
    this.spinner.show();
    this.route.data.subscribe((data) => {
      this.isViewMode = data['viewMode'] === true;
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.headerId = Number(id);
        this.loadVoucherById(this.headerId);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.voucherForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  initForm() {
    const companyCurrencyId =
      this.currentCompany?.CurrencyMasterSid ||
      this.currentCompanyCurrency?.currencyMasterSid;
    const companyCurrencyCode = this.currentCompanyCurrency.code;
    const today = getDefaultTodayDate();
    const fy = this.appSettingService.getCurrentFinancialYear();
    const defaultVoucherDate = fy && (today < new Date(fy.StartDate) || today > new Date(fy.EndDate)) ? fy.EndDate : today;

    this.voucherForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }],
      VoucherDate: [defaultVoucherDate],
      PostDate: [{ value: null, disabled: true }],
      CustomerMasterSid: [{ value: null, disabled: true }],
      PartyMasterSid: [{ value: null, disabled: true }],
      PartyName: [{ value: null, disabled: true }],
      PartyAddress: [{ value: '', disabled: true }],
      COAMasterSid: [{ value: null, disabled: true }],
      State: [{ value: '', disabled: true }],
      BankCOA: [{ value: null, disabled: true }],
      CustomerBranchSid: [{ value: null, disabled: true }],
      DocumentNumber: [''],
      IRNNumber: [{ value: '', disabled: true }],
      MasterJobSid: [{ value: null, disabled: true }],
      ReversalVoucher: [{ value: null, disabled: true }],
      TaxNumber: [{ value: null, disabled: true }],
      HouseJobSid: [{ value: null, disabled: true }],
      HouseNumber: [{ value: '', disabled: true }],
      MasterNumber: [{ value: '', disabled: true }],
      Amount: [{ value: null, disabled: true }],
      LocalAmount: [{ value: null, disabled: true }],
      DocumentDate: [null],
      NetAmount: [{ value: null, disabled: true }],
      SetoffStatus: [{ value: '', disabled: true }],
      InstrumentMode: [''],
      BankCurrencyMasterSid: [{ value: null, disabled: true }],
      BankCurrencyCode: [{ value: '', disabled: true }],
      DepartmentMasterSid: [{ value: null, disabled: true }],
      InstrumentNumber: [''],
      ClearanceDate: [{ value: null, disabled: true }],
      CreditNoteReason: [{ value: '', disabled: true }],
      CashOrBank: [{ value: '', disabled: true }],
      MultiBranch: [{ value: '', disabled: true }],
      BankPartyName: [''],
      BookingHeaderSid: [{ value: null, disabled: true }],
      PostStatus: [{ value: '', disabled: true }],
      ReversalVoucherNumber: [{ value: '', disabled: true }],
      InstrumentDate: [null],
      CurrencyMasterSid: [{ value: companyCurrencyId, disabled: true }],
      CurrencyCode: [{ value: companyCurrencyCode || '', disabled: true }],
      ExchangeRate: [{ value: 1, disabled: true }],
      GST_VAT: [{ value: '', disabled: true }],
      PlaceOfSupply: [{ value: '', disabled: true }],
      Salesman: [{ value: '', disabled: true }],
      GSTType: [{ value: '', disabled: true }],
      InvoiceType: [{ value: 'REG', disabled: true }],
      VoucherType: [{ value: null, disabledd: true }],
      TaxType: [{ value: companyCurrencyCode === 'in' ? 'GST' : 'VAT', disabled: true }],
      Narration: [''],
      Remarks: [''],
      IRNStatus: [{ value: '', disabled: true }],
      Status: [{ value: 'A', disabled: true }],
      voucherDetails: this.fb.array([]),
    });
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
      vendors: this.operationService.getAllCreditorWithCOAMapped(filterOption).pipe(catchError(() => of({ data: [] }))),

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
      ({
        vendors,
        customers,
        currencies,
        charges,
        uoms,
        departments,
        masterJobs,
        bankTypedLedgers,
        cashTypeLedgers
      }) => {
        this.customerList = customers.data || [];
        this.vendorList = vendors.data || [];
        this.subledgerList = customers.data || [];
        this.chargeList = charges.data || [];
        this.bankTypedLedgers = Array.isArray(bankTypedLedgers?.data) ? bankTypedLedgers.data : [];
        this.cashTypeLedgers = Array.isArray(cashTypeLedgers?.data) ? cashTypeLedgers.data : [];
        this.currencyList = currencies.data || [];
        this.currencyConfigService.initializeConfigurations(this.currencyList);
        this.numberToWords.initializeCurrencies(this.currencyList);

        this.uomList = uoms.data || [];
        this.departmentList = departments.data || [];
        this.masterJobList = masterJobs.data || [];
        if (!this.isEditMode) {
          this.spinner.hide();
        }
      }
    );
  }

  loadVoucherById(id: number) {
    this.operationService.findVoucherById(id).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {

          this.voucherData = resp.data;
          this.selectedDocumentType = resp.data?.voucherTypeMaster?.DocumentTypeCode || '';
          this.updateVendorInvoiceValidators();
          this.updateReceiptValidators();
          this.updateReceiptBankValidators();
          this.voucherForm.markAsUntouched();
          this.patchValues(this.voucherData);
        } else {
          this.spinner.hide();
          this.appSettingService.showError(resp.message);
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
        this.appSettingService.showError('Error loading voucher');
      },
    });
  }

  patchValues(data: any) {
    this.details.clear();
    this.ledgerList = [];
    this.voucherForm.patchValue(
      {
        VoucherNumber: data.VoucherNumber,
        Status: data.Status,
        VoucherType: data.VoucherType,
        VoucherDate: data.VoucherDate ? new Date(data.VoucherDate) : null,
        PostDate: data.PostDate ? new Date(data.PostDate) : null,
        Narration: data.Narration,
        PartyMasterSid: data.PartyMasterSid,
        PartyName: data.PartyName,
        PartyAddress: data.PartyAddress,
        CustomerBranchSid: data.CustomerBranchSid,
        PlaceOfSupply: data.PlaceOfSupply,
        State: data.State,
        COAMasterSid: data.COAMasterSid,
        BankCOA: data.BankCOA,
        BankPartyName: data.BankPartyName,
        GST_VAT: data.GST_VAT,
        InvoiceType: data.InvoiceType,
        ReversalVoucher: data.ReversalVoucher,
        ReversalVoucherNumber: data.reversalVoucher?.VoucherNumber,
        TaxNumber: data.TaxNumber,
        GSTType: data.GSTType,
        Remarks: data.Remarks,
        DepartmentMasterSid: data.DepartmentMasterSid,
        HouseNumber: data.HouseNumber,
        MasterNumber: data.MasterNumber,
        HouseJobSid: data.HouseJobSid,
        MasterJobSid: data.MasterJobSid,
        CurrencyMasterSid: data.CurrencyMasterSid,
        CurrencyCode: data.CurrencyCode,
        BankCurrencyMasterSid: data.BankCurrencyMasterSid,
        BankCurrencyCode: data.BankCurrencyCode,
        ExchangeRate: toNumber(data.ExchangeRate),
        Amount: toNumber(data.Amount),
        LocalAmount: toNumber(data.LocalAmount),
        NetAmount: toNumber(data.NetAmount),
        DocumentNumber: data.DocumentNumber,
        DocumentDate: data.DocumentDate ? new Date(data.DocumentDate) : null,
        SetoffStatus: data.SetoffStatus,
        TaxType: data.TaxType,
        InstrumentMode: data.InstrumentMode,
        InstrumentNumber: data.InstrumentNumber,
        InstrumentDate: data.InstrumentDate ? new Date(data.InstrumentDate) : null,
        ClearanceDate: data.ClearanceDate ? new Date(data.ClearanceDate) : null,
        CreditNoteReason: data.CreditNoteReason,
        PostStatus: data.PostStatus,
        CashOrBank: data.CashOrBank,
        MultiBranch: data.MultiBranch,
      },
    );
    const detailsFromResp = data.VoucherDetail || [];

    detailsFromResp.forEach((det: any) => {

      const group = this.createDetailGroup({
        VoucherDetailSid: det.VoucherDetailSid,
        Sno: det.Sno,
        LedgerMasterSid: det.LedgerMasterSid,
        COAMasterSid: det.COAMasterSid || null,
        ChargeMasterSid: det.ChargeMasterSid,
        ChargeDescription: det.ChargeDescription,
        HSSACMasterSid: det.hSSACMaster?.HSSACMasterSid ?? null,
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
        Status: det.Status,
        CostRevenue: det.CostRevenue,
        Narration: det.Narration,
        InvoiceType: det.InvoiceType,
        CostCenter: det.CostCenter,
        ProfitCenter: det.ProfitCenter,
      });

      this.details.push(group);
      const currentIndex = this.details.length - 1;

      if (det.COAMasterSid) {
        const coa = this.coaList.find(
          c => c.COAMasterSid === det.COAMasterSid
        );

        if (coa) {
          this.fetchLedgerForCOA(coa, currentIndex, true);
        }
      }

    });
    this.updateReceiptBankValidators();
    this.spinner.hide();
  }

  createDetailGroup(data?: any): FormGroup {
    const group = this.fb.group({
      VoucherDetailSid: [{value:data?.VoucherDetailSid || null, disabled:true}],
      ChargeMasterSid: [{value:data?.ChargeMasterSid || null,disabled:true}],
      ChargeDescription: [data?.ChargeDescription || ''],
      HSSACMasterSid: [{value:data?.HSSACMasterSid || null,disabled: true}],
      ChargeUOMSid: [{value:data?.ChargeUOMSid || null,disabled:true}],
      NumberOfUnit: [{value:data?.NumberOfUnit || 1,disabled: true}],
      DrCr: [{value:data?.DrCr || 'C',disabled: true}],
      CurrencyMasterSid: [{value:data?.CurrencyMasterSid || this.voucherForm.get('CurrencyMasterSid')?.value || null,disabled: true}],
      CurrencyCode: [{value:data?.CurrencyCode || this.voucherForm.get('CurrencyCode')?.value || null,disabled: true}],
      Rate: [{value:data?.Rate || 0,disabled: true}],
      ExchangeRate: [{value:data?.ExchangeRate || this.voucherForm.get('ExchangeRate')?.value || 1,disabled: true}],
      Amount: [{value:data?.Amount || 0,disabled: true}],
      TaxableAmount: [{value:data?.TaxableAmount || 0,disabled: true}],
      TaxPercentage1: [{value:data?.TaxPercentage1 || 0,disabled: true}],
      TaxAmount1: [{value:data?.TaxAmount1 || 0,disabled: true}],
      TaxPercentage2: [{value:data?.TaxPercentage2 || 0,disabled: true}],
      TaxAmount2: [{value:data?.TaxAmount2 || 0,disabled: true}],
      LocalAmount: [{value:data?.LocalAmount || 0,disabled: true}],
      PartyAmount: [{value:data?.PartyAmount || 0,disabled: true}],
      MasterJobSid: [{value:data?.MasterJobSid || null,disabled: true}],
      HouseJobSid: [{value:data?.HouseJobSid || null,disabled: true}],
      DepartmentMasterSid: [{value:data?.DepartmentMasterSid || null,disabled: true}],
      LedgerMasterSid: [{value:data?.LedgerMasterSid || null,disabled: true}],
      COAMasterSid: [{value:data?.COAMasterSid || null,disabled: true}],
      IsAutoGenerated: [{value:data?.IsAutoGenerated === 'Y' || false,disabled: true}],
      CostRevenueChargesSid: [{value:data?.CostRevenueChargesSid || null,disabled: true}],
      CostRevenue: [{value:data?.CostRevenue || '',disabled: true}],
      Narration: [data?.Narration || ''],
      InvoiceType: [{value:data?.InvoiceType || '',disabled: true}],
      CostCenter: [{value:data?.CostCenter || null,disabled: true}],
      ProfitCenter: [{value:data?.ProfitCenter || null,disabled: true}],
      Remarks: [data?.Remarks || ''],
      YearMasterSid: [{value:data?.YearMasterSid || null,disabled: true}],
    });
    return group;
  }

  onSubmit() {
    const raw = this.voucherForm.getRawValue();
    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy) {
      const voucherDate = new Date(this.voucherForm.getRawValue().VoucherDate);
      const fyStart = new Date(fy.StartDate);
      const fyEnd = new Date(fy.EndDate);
      if (voucherDate < fyStart || voucherDate > fyEnd) {
        this.appSettingService.showWarning(
          `Voucher date must be within the financial year (${fy.YearName})`
        );
        return;
      }
    }

    if (this.isEditMode && this.voucherData?.VoucherDate) {
      const originalDate = new Date(this.voucherData.VoucherDate);
      const newDate = new Date(raw.VoucherDate);

      const sameMonth =
        originalDate.getMonth() === newDate.getMonth() &&
        originalDate.getFullYear() === newDate.getFullYear();

      if (!sameMonth) {
        this.appSettingService.showError(
          `Voucher date must be within ${originalDate.toLocaleString('default', {
            month: 'long',
          })} ${originalDate.getFullYear()}`
        );
        return;
      }
    }

    if (this.voucherForm.invalid) {
      this.voucherForm.markAllAsTouched();
      this.voucherForm.updateValueAndValidity();
      this.appSettingService.showError('Please fill all the required fields.');
      return;
    }
    const YearMasterSid = Number(localStorage.getItem('current-year-id'));

    const voucherDetailArray = (raw.voucherDetails || []).map(
      (d: any, index: number) => {
        const detail = {
          VoucherDetailSid: d.VoucherDetailSid,
          ChargeDescription: d.ChargeDescription || '',
          Narration: d.Narration || '',
          Remarks: d.Remarks || '',
        };
        return detail;
      }
    );

    const payload: any = {
      ...(this.isEditMode
        ? { UpdatedBy: this.currUserEmail }
        : { CreatedBy: this.currUserEmail }),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      YearMasterSid: YearMasterSid,
      VoucherDate: raw.VoucherDate ? new Date(raw.VoucherDate) : null,
      Narration: raw.Narration !== undefined ? raw.Narration : undefined,
      VoucherDetail:
        voucherDetailArray.length > 0 ? voucherDetailArray : undefined,
      DocumentNumber: raw.DocumentNumber || undefined,
      Remarks: raw.Remarks || undefined,
      DocumentDate: raw.DocumentDate ? new Date(raw.DocumentDate) : null,
      BankPartyName: raw.BankPartyName || undefined,
      InstrumentNumber: raw.InstrumentNumber || undefined,
      InstrumentMode: raw.InstrumentMode || undefined,
      InstrumentDate: raw.InstrumentDate ? new Date(raw.InstrumentDate) : null,
    };


    this.isSaving = true;
    this.spinner.show();

    if (this.isEditMode && this.headerId) {
      this.operationService.updateVoucherById(this.headerId, payload).subscribe({
        next: async (resp: any) => {
          this.isSaving = false;
          if (resp.status) {
            this.loadVoucherById(this.headerId);
          } else {
            this.appSettingService.showError(resp.message);
            this.spinner.hide();
          }
        },
        error: (error) => {
          this.appSettingService.showError('Failed to update invoice');
          this.isSaving = false;
          this.spinner.hide();
        }
      })
    }
  }

  goBack() {
    this.router.navigate(['operation/voucher-correction/list']);
  }

  showInfo() {
    if (!this.voucherData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.voucherData;
    modalRef.componentInstance.idLabel = 'Voucher Id';
    modalRef.componentInstance.idValue = this.voucherData?.VoucherHeaderSid;
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
      hssac: this.operationService.getAllHssac().pipe(catchError((err) => of([]))),
    }).subscribe(
      ({
        coaWithLedgerCategoryAsLedger,
        costCenters,
        profitCenters,
        depts,
        charges,
        hssac
      }) => {
        this.coaList = coaWithLedgerCategoryAsLedger.data;
        this.costCenterList = costCenters.data;
        this.profitCenterList = profitCenters.data;
        this.departmentList = depts;
        this.chargeList = charges;
        this.hssacList = hssac || [];
      }
    );
  }

  private loadPaymentModes(): void {
    this.paymentModes = this.receiptService.getInstrumentModes();
  }

  getPostStatusDisplay(): string {
    const postStatus = this.voucherForm.get('PostStatus')?.value;
    if (postStatus === 'P') {
      return 'Posted';
    } else if (postStatus === 'U') {
      return 'Unposted';
    }
    return postStatus || 'Unposted';
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

  get isInvoice(): boolean {
    return this.selectedDocumentType === 'INV';
  }

  get isVendorInvoice(): boolean {
    return this.selectedDocumentType === 'VIN'
  }

  get isCreditNote(): boolean {
    return this.selectedDocumentType === 'CRN'
  }

  get isReceipt(): boolean {
    return this.selectedDocumentType === 'RPT'
  }

  get isPayment(): boolean {
    return this.selectedDocumentType === 'PMT'
  }

  get isVendorCreditNote(): boolean {
    return this.selectedDocumentType === 'VRN'
  }

  get isJournalVoucher(): boolean {
    return this.selectedDocumentType === 'JV'
  }

  fetchLedgerForCOA(coa: any, detailIndex: number, isPatching: boolean = false) {
  const detailGroup = this.details.at(detailIndex) as FormGroup;
  if (!detailGroup) return;

  const ledgerCtrl = detailGroup.get('LedgerMasterSid');
  if (!ledgerCtrl) return;

  const selectedLedgerSid = ledgerCtrl.getRawValue();

  if (coa) {
    this.accountService
      .getLedgerByCOAMasterSid({
        COAMasterSid: coa.COAMappedId || coa.COAMasterSid,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      })
      .subscribe((resp: any) => {
        if (resp?.status) {
          this.ledgerList[detailIndex] = resp.data || [];

          const matchedLedger = this.ledgerList[detailIndex].find(
            (l: any) =>
              l.SubledgerMasterSid === selectedLedgerSid ||
              l.LedgerMasterSid === selectedLedgerSid
          );

          if (matchedLedger) {
            ledgerCtrl.setValue(
              matchedLedger.SubledgerMasterSid ?? matchedLedger.LedgerMasterSid,
              { emitEvent: false }
            );
          } else if (!isPatching) {
            ledgerCtrl.setValue(null, { emitEvent: false });
          }

          // Always keep subledger disabled
          ledgerCtrl.disable({ emitEvent: false });
          ledgerCtrl.clearValidators();
          ledgerCtrl.updateValueAndValidity({ emitEvent: false });
        } else {
          this.ledgerList[detailIndex] = [];
          ledgerCtrl.setValue(null, { emitEvent: false });
          ledgerCtrl.disable({ emitEvent: false });
          this.appSettingService.showError('Error fetching ledger for COA');
        }
      });
  } else {
    this.ledgerList[detailIndex] = [];
    ledgerCtrl.setValue(null, { emitEvent: false });
    ledgerCtrl.disable({ emitEvent: false });
    ledgerCtrl.clearValidators();
    ledgerCtrl.updateValueAndValidity({ emitEvent: false });
  }
}

  isAutoPartyRow(index: number): boolean {
    const row = this.details.at(index);
    if (!row) return false;
    const partySid = this.f['PartyMasterSid']?.getRawValue();
    return partySid && row.get('LedgerMasterSid')?.getRawValue() === partySid;
  }

  /**
   * Check if a detail row is the auto-inserted bank/cash row.
   */
  isAutoBankRow(index: number): boolean {
    const row = this.details.at(index);
    if (!row) return false;
    const bankCoaSid = this.f['BankCOA']?.getRawValue();
    return bankCoaSid && row.get('COAMasterSid')?.getRawValue() === bankCoaSid;
  }

  private updateVendorInvoiceValidators(): void {
  const docNo = this.voucherForm.get('DocumentNumber');
  const docDate = this.voucherForm.get('DocumentDate');

  if (this.isVendorInvoice || this.isVendorCreditNote) {
    docNo?.setValidators([Validators.required]);
    docDate?.setValidators([Validators.required]);
  } else {
    docNo?.clearValidators();
    docDate?.clearValidators();
  }

  docNo?.updateValueAndValidity();
  docDate?.updateValueAndValidity();
}

private updateReceiptValidators(): void {
  const narration = this.voucherForm.get('Narration');

  if (this.isReceipt || this.isPayment) {
    narration?.setValidators([Validators.required]);
  } else {
    narration?.clearValidators();
  }

  narration?.updateValueAndValidity();
}

get isBankReceipt(): boolean {
  return (this.isReceipt || this.isPayment) && this.voucherForm.get('CashOrBank')?.value === 'B';
}

private updateReceiptBankValidators(): void {
  const instNo = this.voucherForm.get('InstrumentNumber');
  const instMode = this.voucherForm.get('InstrumentMode');

  if (this.isBankReceipt) {
    instNo?.setValidators([Validators.required]);
    instMode?.setValidators([Validators.required]);
  } else {
    instNo?.clearValidators();
    instMode?.clearValidators();
  }

  instNo?.updateValueAndValidity();
  instMode?.updateValueAndValidity();
}

get isJobBasedVendorInvoice(): boolean {
  if (!(this.isVendorInvoice || this.isVendorCreditNote)) return false;

  const masterJobSid = this.voucherForm.get('MasterJobSid')?.value;
  const houseJobSid = this.voucherForm.get('HouseJobSid')?.value;

  return !!masterJobSid || !!houseJobSid;
}

}
