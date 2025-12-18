import { Component, OnInit, ViewChild, TemplateRef, input } from '@angular/core';
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
import { NgbModal, NgbDatepickerModule, NgbModalRef, NgbDropdownModule, NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, firstValueFrom, map, of, Subscription, switchMap } from 'rxjs';
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
import { toNumber } from 'src/app/common/helper';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { ToastrService } from 'ngx-toastr';
import { getExchangeRateErrorMessage } from 'src/app/core/ValidationFn/exRateConsistency.validators';

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
  vendorInvoiceForm!: FormGroup;
  headerId: number | null = null;
  currentCompany: any;
  currentBranch: any;
  vendorInvoiceData: any;
  selectedVendor: any = null;
  private subscriptions : Subscription[] = []
  currUserEmail: string | null = null;
  isViewMode: boolean = false;
  get isEditMode() { return !!this.headerId && !this.isViewMode; }

  // ViewChild references for modals
  @ViewChild('searchCostsModal') searchCostsModalRef: TemplateRef<any> | undefined;
  searchCostsModalInstance: NgbModalRef | null = null;

  // Lookups
  vendorList: any[] = [];
  vendorBranchList: any[] = [];
  currencyList: any[] = [];
  chargeList: any[] = [];
  hssacList: any[][] = [];
  subledgerList: any[] = [];
  currentMenuId: number = 0;
  TandCList: any[] = [];
  uomList: any[] = [];
  masterJobList: any[] = [];
  houseJobList: any[] = [];
  stateList: any[] = [];
  houseJobListByMasterJob: { [key: number]: any[] } = {};
  selectedVendorForCosts: any = null;
  allPendingCosts: any[] = [];
  searchVendors: any[] = [];
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  selectedVendorBranchForSearch: any = null;


  CurrencyLookupConfig = {
    displayFields: ['currencyCode', 'currencyName', 'countryName'],
    displayLabels: ['Code', 'Name', 'Country'],
    labelFields: ['currencyCode'],
  };

  HSSACLookupConfig =DROPDOWN_CONFIGS.HSSAC_TAX;
  departmentList: any[] = [];
  departmentLookupConfig = {
    displayFields: ['departmentCode', 'departmentName'],
    displayLabels: ['Code', 'Name'],
    labelFields: ['departmentCode'],
  };
  // Add master job config with other configs
  masterJobLookupConfig = {
    displayFields: ['MasterJobNumber', 'MBLNo'],
    displayLabels: ['Job No', 'MBL No'],
    labelFields: ['MasterJobNumber'],
  };
  userData: any;
  currentDate = new Date();
  private pendingBranchToSelect: number | null = null;

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
    { id: 'NONGST', name: 'Non GST/Zero' },
    { id: 'VAT', name: 'VAT' } // Add this for non-India countries
  ];

  gstTypes = [
    { id: 'B2B', name: 'B2B - Business to Business' },
    { id: 'B2C', name: 'B2C - Business to Customer' },
    { id: 'EXWP', name: 'Export With Payment' },
    { id: 'EXWOP', name: 'Export Without Payment' },
    { id: 'VAT', name: 'VAT' } // Add this for non-India countries
  ];
  statusList = [
    { value: 'A', name: 'Active' },
    { value: 'S', name: 'Suspended' },
  ];

  isSaving: boolean = false;

  gstType = [
    { id: 'B2B', name: 'B2B - Business to Business' },
    { id: 'B2CS', name: 'B2CS - Business to Customer(Small)' },
    { id: 'B2CL', name: 'B2CL - Business to Customer(Large)' },
    { id: 'EXWP', name: 'EXWP - Export With Payment of Tax' },
    { id: 'EXWOP', name: 'EXWOP - Export Without Payment of Tax' },
  ];
  selectedVendorForSearch: any = null;
  searchTypes = [

    { id: 'Master Job', name: 'Master Job' },
    { id: 'House Job', name: 'House Job' },
    { id: 'Vendor Name', name: 'Vendor Name' },
    { id: 'MBL No', name: 'MBL No' },
    { id: 'HBL No', name: 'HBL No' },
    { id: 'Container No', name: 'Container No' }
  ];

  // Search costs
  searchType: string = 'Master Job';
  searchValue: string = '';
  pendingCosts: any[] = [];
  selectedCosts: Set<number> = new Set();
  searchPerformed: boolean = false;
  searchResultsLoading: boolean = false;

  // TDS Configuration
  tdsConfig: any = null;
  currentUserState: string;
  currentFinancialYear: number;
  currentUserCountry: string;
  currentCountry: number;
  currentCountryID: any;
  MenuMasterSid: any;
  currencySettings: any;
  companyCurrency: CurrencySettings;
  currentCurrencyCode: string;
  currentBranchCityId: number;
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

  get isIndiaGST(): boolean {
    return this.currentUserCountry === 'india';
  }

  get isVATMode(): boolean {
    return this.currentUserCountry !== 'india'; // VAT for non-India countries
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
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    try {
      // taking company info
      this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
      this.currentBranch = this.appSettingService.getCurrentBranchInfo();
      this.MenuMasterSid = localStorage.getItem('currentMenuId');
      this.currentFinancialYear = Number(localStorage.getItem('current-year-id'));

      // taking country info
      this.currentUserCountry = String(this.currentCompany?.countryMaster?.countryName).trim().toLowerCase();
      this.currentCountry = Number(this.currentCompany?.CountryMasterSid);

      // taking state info
      this.currentUserState = String(this.currentBranch?.stateMaster?.stateName).trim().toLowerCase();

      // taking city info
      this.currentBranchCityId = this.currentBranch.CityMasterSid;

      this.bookingModeCountry = this.currentUserCountry;
    } catch (e) {
      this.currentCompany = null;
      this.currentBranch = null;
    }
    this.initForm();
    this.loadLookups();
    this.initializeDefaultHeaderCurrency();
    this.mps.init().subscribe();




    try {
      const decryptedProfileRaw = localStorage.getItem('user-profile');
      const decryptedProfile = decryptedProfileRaw ? this.appSettingService.decrypt(decryptedProfileRaw) : null;
      this.currUserEmail = decryptedProfile?.email || localStorage.getItem('user-email') || null;
    } catch (err) {
      this.currUserEmail = localStorage.getItem('user-email') || null;
    }

    // Check if view mode from route data
    this.route.data.subscribe(data => {
      this.isViewMode = data['viewMode'] === true;
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.headerId = Number(id);
        this.loadVendorInvoiceById(this.headerId);
      } else {
        this.setupDueDateStream();
      }
    });

    // Recalculate when currency/exchange rate changes
    this.subscriptions.push(
      this.vendorInvoiceForm.get('CurrencyMasterSid')!.valueChanges
        .pipe(
          distinctUntilChanged()
        )
        .subscribe(id => {
          const selectedCurrency = this.currencyList.find(
            c => c.CurrencyMasterSid === id
          );

          if (selectedCurrency) {
            this.onHeaderCurrencyChange(selectedCurrency);
          }
        })
    );


    // this.vendorInvoiceForm.get('ExchangeRate')?.valueChanges.subscribe(() => {
    //   this.recalculateAllRows();
    // });
  }

  initializeDefaultHeaderCurrency() {
    const companyCurrencyId = this.currentCompany?.CurrencyMasterSid;
    // taking currency related infos
    this.companyCurrency = this.companySettings.getCurrencySettings();
    this.currentCurrencyCode = this.companyCurrency.code;
    const finalCompanyCurrencyId = companyCurrencyId || this.companyCurrency.currencyMasterSid;
    const companyCurrency = this.currencyList.find(c => c.CurrencyMasterSid === finalCompanyCurrencyId);
    const finalCompanyCurrencyCode = this.currentCurrencyCode || companyCurrency?.currencyCode;

    this.vendorInvoiceForm.patchValue({
      CurrencyMasterSid: finalCompanyCurrencyId
    });
    // console.log("INIT VENDOR INVOICE FORM", this.vendorInvoiceForm.getRawValue());

  }

  onHeaderCurrencyChange(selectedCurrency: any): void {
    if (!selectedCurrency) return;
    const currencyMasterSid = selectedCurrency?.CurrencyMasterSid;
    const currencyCode = selectedCurrency?.currencyCode;

    const companyCurrency = this.companyCurrency?.currencyMasterSid;
    const companyCurrencyCode = this.companyCurrency?.code;


    // If same as company currency, set exchange rate to 1 and disable
    if (currencyMasterSid === companyCurrency) {
      this.vendorInvoiceForm.patchValue({
        CurrencyCode: currencyCode,
        ExchangeRate: 1
      }, { emitEvent: false });
      this.vendorInvoiceForm.get('ExchangeRate')?.disable();
    } else {
      this.fetchExchangeRate(currencyCode, companyCurrencyCode);
    }
  }

  initForm() {
    this.vendorInvoiceForm = this.fb.group({
      // Header
      VoucherNumber: [{ value: '', disabled: true }],
      VoucherDate: [new Date(), Validators.required],
      PartyMasterSid: [null], // Vendor
      PartyName: ['', Validators.required],
      PartyAddress: [{ value: '', disabled: true }],
      GSTNo: [{ value: '', disabled: true }],
      PlaceOfSupply: [{ value: '', disabled: true }],
      PostedOn: [{ value: null, disabled: true }],
      CustomerBranchSid: [null],
      DepartmentMasterSid : [null],
      CurrencyMasterSid: [null, Validators.required],
      CurrencyCode: [null],
      ExchangeRate: [1, [Validators.required, Validators.min(0)]],
      BillNo: ['', Validators.required],
      BillDate: [null, Validators.required],
      BillAmt: [0, [Validators.required, Validators.min(0)]],
      MBLNo: [''],
      HBLNo: [''],
      PostStatus: ['U'],
      InvoiceType: ['B2B'],
      GSTType: [''],
      Narration: [''],
      Remarks: [''],
      MasterJobSid: [null],
      HouseJobSid: [null],
      COAMasterSid: [null],
      Status: ['A'],

      // Details Array
      voucherDetails: this.fb.array([]),

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

      // Others
      voucherOthers: this.fb.group({
        ContainerNumber: [''],
        VoucherNote: [''],
        Footer: ['']
      })
    });

    this.vendorInvoiceForm.setValidators(this.consistentExchangeRatesValidator(this.currencyList));
  }

  createDetailGroup(data?: any): FormGroup {
    const row = this.fb.group({
      VoucherDetailSid: [data?.VoucherDetailSid || null],
      CostRevenueChargesSid: [data?.CostRevenueChargesSid || null], // Store original cost ID
      ChargeMasterSid: [data?.ChargeMasterSid || null, Validators.required],
      ChargeDescription: [data?.ChargeDescription || ''],
      HSSACMasterSid: [data?.HSSACMasterSid || null],
      ChargeUOMSid: [data?.ChargeUOMSid || data?.chargeMaster?.UOM || null],
      NumberOfUnit: [data?.NumberOfUnit || 1, [Validators.required, Validators.min(0)]],
      DrCr: [data?.DrCr || 'D', Validators.required],
      CurrencyMasterSid: [data?.CurrencyMasterSid || this.vendorInvoiceForm.get('CurrencyMasterSid')?.value || null],
      CurrencyCode: [data?.CurrencyCode || this.vendorInvoiceForm.get('CurrencyCode')?.value || null],
      Rate: [data?.Rate || 0, [Validators.required, Validators.min(0)]],
      ExchangeRate: [data?.ExchangeRate || this.vendorInvoiceForm.get('ExchangeRate')?.value || 1],
      Amount: [data?.Amount || 0],
      TaxableAmount: [data?.TaxableAmount || 0],
      TaxPercentage1: [data?.TaxPercentage1 || 0],
      TaxAmount1: [data?.TaxAmount1 || 0],
      TaxPercentage2: [data?.TaxPercentage2 || 0],
      TaxAmount2: [data?.TaxAmount2 || 0],
      TaxPercentageIGST: [data?.TaxPercentageIGST || 0],
      TaxAmountIGST: [data?.TaxAmountIGST || 0],
      LocalAmount: [data?.LocalAmount || 0],
      PartyAmount: [data?.PartyAmount || 0],
      MasterJobSid: [data?.MasterJobSid || null],
      HouseJobSid: [data?.HouseJobSid || null],
      DepartmentMasterSid: [data?.DepartmentMasterSid || null],
      LedgerMasterSid: [data?.LedgerMasterSid || null],
      COAMasterSid: [data?.COAMasterSid || null],
      IsAutoGenerated: [data?.IsAutoGenerated === 'Y' || false]
    });
    // this.disableControlsIfVoucherExists(row);
    return row;
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
  onDetailChange(index: number, field?: string) {
    console.log("onDetailChange triggered with index", index, "and field", field);
    if (this.isPosted) {
      // console.log('Vendor Invoice is posted - ignoring detail change');
      return;
    }

    if (['NumberOfUnit', 'HSSACMasterSid', 'Rate', 'ExchangeRate', 'TaxPercentage1', 'TaxPercentage2', 'TaxPercentageIGST', 'CurrencyMasterSid'].includes(field || '')) {
      this.recalcRow(index);
      if (field === 'CurrencyMasterSid') {
        const formGroup = this.details.at(index) as FormGroup;
        const fromCurrencyId = formGroup.get('CurrencyMasterSid')?.value;
        const fromCurrencyCode = this.currencyList.find(x => x.CurrencyMasterSid === fromCurrencyId)?.currencyCode;
        formGroup.get('CurrencyCode').setValue(fromCurrencyCode);
        let toCurrencyCode = this.companyCurrency.code;
        this.patchExchangeRateForDetail(fromCurrencyCode, toCurrencyCode, index);
      }
    } else if (field === 'ChargeMasterSid') {
      const chargeSid = this.details.at(index).get('ChargeMasterSid')?.value;
      if(!chargeSid){
        this.hssacList[index] = [];
        this.details.at(index).patchValue({
          ChargeDescription : '',
          HSSACMasterSid : null,
        },{emitEvent: false});
      }
      const selectedCharge = this.chargeList?.find((c: any) => c.ChargeMasterSid === chargeSid);
      this.fetchHSN(index, true);
      if (selectedCharge) {
        const description = selectedCharge.ChargeDescription || selectedCharge.chargeName || selectedCharge.ChargeName || '';
        let hssacId = selectedCharge.HSSACMasterSid ?? selectedCharge.HSSACMasterSid ?? null;

        // Auto-set HSN/SAC code from ChargeTaxMaster
        if (!hssacId && Array.isArray(selectedCharge.ChargeTaxMaster) && selectedCharge.ChargeTaxMaster.length > 0) {
          const firstTax = selectedCharge.ChargeTaxMaster[0];
          const hsnCode = firstTax?.HSNCode;

          // Find matching HSSAC from hssacList using HSNCode
          if (hsnCode) {
            const matchingHssac = (this.hssacList[index] || []).find(h =>
              h.HSSACCode === hsnCode || h.HSNCode === hsnCode
            );
            if (matchingHssac) {
              hssacId = matchingHssac?.HSSACMasterSid;
            }
          }
        }

        const chargeUomId = selectedCharge?.ChargeUOMSid ?? selectedCharge?.UOM ?? selectedCharge?.UOMMasterSid ?? null;

        // Auto-set LedgerMasterSid and COAMasterSid
        const ledgerMasterSid = selectedCharge?.SubledgerMasterSid || null;
        const coaMasterSid = selectedCharge?.DrCOAMappedId || null;

        this.details.at(index).patchValue({
          ChargeDescription: description,
          HSSACMasterSid: hssacId || null,
          ChargeUOMSid: chargeUomId || null,
          Rate: selectedCharge?.DefaultRate || selectedCharge?.Rate || this.details.at(index).get('Rate')?.value || 0,
          LedgerMasterSid: ledgerMasterSid,
          COAMasterSid: coaMasterSid
        });

        this.recalcRow(index);
      }
    }
  }

  private async recalcRow(index: number) {
    const row = this.details.at(index);
    if (!row) return;
    if (this.isPosted) {
      // console.log('Vendor Invoice is posted - skipping recalculation for row', index);
      return;
    }

    // const headerCurrency = this.vendorInvoiceForm.get('CurrencyCode')?.value;
    // if (row.get('CurrencyCode')?.value !== headerCurrency) {
    //   row.get('CurrencyCode')?.setValue(headerCurrency);
    // }

    const unit = Number(row.get('NumberOfUnit')?.value || 0);
    const rate = Number(row.get('Rate')?.value || 0);
    const exRate = Number(row.get('ExchangeRate')?.value || this.vendorInvoiceForm.get('ExchangeRate')?.value || 1);

    // Calculate basic amounts
    const amount = unit * rate;
    const taxableAmount = amount * exRate;
    const localAmount = amount * exRate;

    // Get GST Type and determine tax applicability
    const gstType = this.vendorInvoiceForm.get('GSTType')?.value;
    const placeOfSupply = this.vendorInvoiceForm.get('PlaceOfSupply')?.value;
    const companyState = this.getCompanyState();

    // console.log('=== TAX CALCULATION DEBUG - START ===');
    // console.log('Row Index:', index);
    // console.log('GST Type from form:', gstType);
    // console.log('Current User Country:', this.currentUserCountry);
    // console.log('Is India GST:', this.isIndiaGST);
    // console.log('Place of Supply:', placeOfSupply);
    // console.log('Company State:', companyState);
    // console.log('Taxable Amount:', taxableAmount);

    // Initialize tax variables
    let cgstRate = 0, sgstRate = 0, igstRate = 0, vatRate = 0;
    let cgstAmt = 0, sgstAmt = 0, igstAmt = 0, vatAmt = 0;

    // Get charge data for tax ledger lookup
    const chargeSid = row.get('ChargeMasterSid')?.value;
    // console.log('Charge SID:', chargeSid);

    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeSid);
    // console.log('Found charge:', charge?.ChargeDescription);

    // console.log('DEBUG - Current GST Type for calculation:', gstType);

    if (charge) {
      const HSSACMasterSid = row.get('HSSACMasterSid')?.value;
      const hssacItem = (this.hssacList[index] || []).find(c => c.HSSACMasterSid === HSSACMasterSid);

      if (HSSACMasterSid) {
        let taxLedgers: any[] = [];
        const inputOrOutput: 'Input' | 'Output' = 'Input';
        const companyState = this.getCompanyState();
        const currentCountry = Number(this.currentCompany?.CountryMasterSid);
        const vendorCountry = this.getVendorCountry();
        const taxCategory = this.determineTaxCategory(companyState, placeOfSupply, vendorCountry);

        const key = this.buildKey(
          hssacItem?.TaxGroupSid,
          inputOrOutput,
          taxCategory,
          currentCountry
        );
        console.log(`recalculating taxes for ${index}` + key);
        if (this.taxGroupMap.has(key)) {
          console.log("Applying already existing tax group for " + key);
          const alreadyFetched = this.taxGroupMap.get(key);
          taxLedgers = alreadyFetched;
        } else {
          console.log("Fetching tax group for " + key);
          taxLedgers = await this.getTaxLedgerForHSSAC(hssacItem, placeOfSupply);
        }

        if (taxLedgers && taxLedgers.length > 0) {
          // Extract individual tax rates from tax master records
          for (const tax of taxLedgers) {
            // console.log('Processing tax record:', tax);
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
                // console.log('DEBUG - VAT Rate found:', vatRate, '%');
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
            // console.log('CGST+SGST Applied:', { cgstAmt, sgstAmt, cgstRate, sgstRate });
          } else if (gstType === 'IGST') {
            // Different state - apply IGST (India)
            igstAmt = (taxableAmount * igstRate) / 100;
            // console.log('IGST Applied:', { igstAmt, igstRate });
          } else if (gstType === 'B2C') {
            // FIX FOR B2C ISSUE: 
            // If we have IGST rate but GST Type is B2C, we need to decide how to handle
            // Option 1: Apply CGST if available, otherwise use IGST for B2C
            if (cgstRate > 0) {
              cgstAmt = (taxableAmount * cgstRate) / 100;
              // console.log('B2C - CGST Applied:', { cgstAmt, cgstRate });
            } else if (igstRate > 0) {
              // IMPORTANT FIX: If we have IGST but GST Type is B2C, we might want to:
              // 1. Apply IGST as the tax amount
              // 2. Or decide based on business logic
              // For now, let's apply IGST for B2C when CGST is not available
              igstAmt = (taxableAmount * igstRate) / 100;
              // console.log('B2C - Using IGST (no CGST available):', { igstAmt, igstRate });
            }
          } else if (gstType === 'EXWP' || gstType === 'EXWOP') {
            // Export - no tax
            // console.log('Export - No tax applied');
          } else {
            // Default fallback based on country
            if (this.isIndiaGST) {
              // India default
              igstAmt = (taxableAmount * igstRate) / 100;
              // console.log('Default India (IGST) Applied:', { igstAmt, igstRate });
            } else {
              // Non-India default (VAT)
              vatAmt = (taxableAmount * vatRate) / 100;
              // console.log('Default Non-India (VAT) Applied:', { vatAmt, vatRate });
            }
          }
        } else {
          // console.log('No tax ledger data, using fallback tax rate');
          // Fallback to HSSAC tax rate
          this.applyFallbackTax(index, row, taxableAmount, gstType, cgstRate, cgstAmt, sgstRate, sgstAmt, igstRate, igstAmt, vatRate, vatAmt);
        }
      }
    } else {
      // console.log('No charge found, using fallback tax calculation');
      this.applyFallbackTax(index, row, taxableAmount, gstType, cgstRate, cgstAmt, sgstRate, sgstAmt, igstRate, igstAmt, vatRate, vatAmt);
    }

    // console.log('=== FINAL TAX AMOUNTS ===');
    // console.log('CGST Amount:', cgstAmt);
    // console.log('SGST Amount:', sgstAmt);
    // console.log('IGST Amount:', igstAmt);
    // console.log('VAT Amount:', vatAmt);

    // Update row values
    row.get('Amount')?.setValue(this.round(amount));
    row.get('TaxableAmount')?.setValue(this.round(taxableAmount));

    // Clear all tax fields first
    row.get('TaxPercentage1')?.setValue(0);
    row.get('TaxAmount1')?.setValue(0);
    row.get('TaxPercentage2')?.setValue(0);
    row.get('TaxAmount2')?.setValue(0);

    // Set values based on GST type
    // console.log('Setting tax values for GST Type:', gstType);

    if (gstType === 'VAT') {
      // VAT - use TaxPercentage1 and TaxAmount1 for VAT
      row.get('TaxPercentage1')?.setValue(this.round(vatRate));
      row.get('TaxAmount1')?.setValue(this.round(vatAmt));
      // console.log('Setting VAT values - Rate:', vatRate, 'Amount:', vatAmt);
    } else if (gstType === 'CGST+SGST') {
      // CGST+SGST
      row.get('TaxPercentage1')?.setValue(this.round(cgstRate));
      row.get('TaxAmount1')?.setValue(this.round(cgstAmt));
      row.get('TaxPercentage2')?.setValue(this.round(sgstRate));
      row.get('TaxAmount2')?.setValue(this.round(sgstAmt));
      // console.log('Setting CGST+SGST values');
    } else if (gstType === 'IGST' || gstType === 'B2C') {
      // IGST or B2C - use TaxPercentage1 and TaxAmount1 only
      const rate = gstType === 'IGST' ? igstRate : cgstRate;
      const amount = gstType === 'IGST' ? igstAmt : cgstAmt;
      row.get('TaxPercentage1')?.setValue(this.round(rate));
      row.get('TaxAmount1')?.setValue(this.round(amount));
      // console.log(`Setting ${gstType} values - Rate:`, rate, 'Amount:', amount);
    } else {
      // Default based on country
      if (this.isIndiaGST) {
        // India default - use TaxPercentage1 and TaxAmount1
        row.get('TaxPercentage1')?.setValue(this.round(igstRate));
        row.get('TaxAmount1')?.setValue(this.round(igstAmt));
      } else {
        // Non-India default (VAT)
        row.get('TaxPercentage1')?.setValue(this.round(vatRate));
        row.get('TaxAmount1')?.setValue(this.round(vatAmt));
      }
    }

    row.get('LocalAmount')?.setValue(this.round(localAmount));
    row.get('PartyAmount')?.setValue(this.getPartyAmount(row.getRawValue()));

    this.updateBillAmount();
    this.vendorInvoiceForm.updateValueAndValidity();
    // console.log('=== TAX CALCULATION DEBUG - END ===');
  }


  updateBillAmount() {
    const totalLocalAmount = this.calculateTotalLocalAmount();
    this.vendorInvoiceForm.get('BillAmt')?.setValue(this.round(totalLocalAmount));
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
    return this.round(total);
  }

  getTotalTaxAmount() {
    let total = 0;
    for (let i = 0; i < this.details.length; i++) {
      const taxAmt1 = Number(this.details.at(i).get('TaxAmount1')?.value || 0);
      const taxAmt2 = Number(this.details.at(i).get('TaxAmount2')?.value || 0);

      total += taxAmt1 + taxAmt2;
    }
    return total.toFixed(2);
  }

  getGrandTotal(): number {
    return this.round(this.getTotalCurrencyAmount() + toNumber(this.getTotalTaxAmount()));
  }

  addDetailRow() {
    const newRow = this.createDetailGroup();
    this.onDetailChange(this.details.length - 1, 'CurrencyCode');
    this.details.push(newRow);
    this.vendorInvoiceForm.updateValueAndValidity();
    // Subscribe to changes for auto-calculation
    // this.subscribeToRowChanges(newRow);
  }

  // subscribeToRowChanges(row: FormGroup) {
  //   // Recalculate when NumberOfUnit or Rate changes
  //   row.get('NumberOfUnit')?.valueChanges.subscribe(() => this.recalculateRow(row));
  //   row.get('Rate')?.valueChanges.subscribe(() => this.recalculateRow(row));
  //   row.get('CGSTPercentage')?.valueChanges.subscribe(() => this.recalculateRow(row));
  //   row.get('SGSTPercentage')?.valueChanges.subscribe(() => this.recalculateRow(row));
  //   row.get('IGSTPercentage')?.valueChanges.subscribe(() => this.recalculateRow(row));
  //   row.get('VATPercentage')?.valueChanges.subscribe(() => this.recalculateRow(row));

  //   // When charge changes, fetch SAC code and UOM
  //   row.get('ChargeMasterSid')?.valueChanges.subscribe((chargeSid) => {
  //     if (chargeSid) {
  //       this.onChargeChange(row, chargeSid);
  //     }
  //   });
  // }

  onChargeChange(row: FormGroup, chargeSid: number) {
    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeSid);
    const detailIndex = this.details.getRawValue()?.findIndex(d => d === row.getRawValue());
    // console.log(charge, 'onChargeChange')

    const uom = this.uomList.find(u => u.UOMMasterSid === charge.UOM)
    if (charge) {
      row.patchValue({
        ChargeDescription: charge.chargeName,
        SACCode: charge.HSNSAC || charge.HSNCode || '',
        Unit: uom.UOMCode || '',
        ChargeUOMSid: charge.ChargeUOMSid,
      }, { emitEvent: false });

      // Fetch HSN/SAC Master ID
      if (charge.SACCode || charge.HSNCode) {
        const hssac = (this.hssacList[detailIndex] || []).find(h =>
          h.HSSACCode === (charge.SACCode || charge.HSNSAC) ||
          h.SACCode === (charge.SACCode || charge.HSNCode)
        );
        if (hssac) {
          row.patchValue({ HSSACMasterSid: hssac?.HSSACMasterSid }, { emitEvent: false });

          // Auto-fill tax percentage based on SAC code
          if (this.isIndiaGST) {
            const taxRate = hssac.TaxRate || 18; // Default 18% GST
            row.patchValue({
              CGSTPercentage: taxRate / 2,
              SGSTPercentage: taxRate / 2
            });
          } else {
            row.patchValue({
              VATPercentage: hssac.TaxRate || 5 // Default 5% VAT
            });
          }
        }
      }
    }
  }

  recalculateRow(row: FormGroup) {
    if (this.isPosted) return;
    const numberOfUnit = Number(row.get('NumberOfUnit')?.value) || 0;
    const rate = Number(row.get('Rate')?.value) || 0;
    const exchangeRate = Number(row.get('ExchangeRate')?.value) || 1;

    // Calculate Amount
    const amount = numberOfUnit * rate;
    row.patchValue({ Amount: this.round(amount) }, { emitEvent: false });

    // Taxable Amount = Amount
    const taxableAmount = amount;
    row.patchValue({ TaxableAmount: this.round(taxableAmount) }, { emitEvent: false });

    // Calculate taxes
    let totalTax = 0;

    if (this.isIndiaGST) {
      const cgstPct = Number(row.get('CGSTPercentage')?.value) || 0;
      const sgstPct = Number(row.get('SGSTPercentage')?.value) || 0;
      const igstPct = Number(row.get('IGSTPercentage')?.value) || 0;

      if (igstPct > 0) {
        // Inter-state: IGST
        const igst = (taxableAmount * igstPct) / 100;
        row.patchValue({ IGST: this.round(igst), CGST: 0, SGST: 0 }, { emitEvent: false });
        totalTax = igst;
      } else {
        // Intra-state: CGST + SGST
        const cgst = (taxableAmount * cgstPct) / 100;
        const sgst = (taxableAmount * sgstPct) / 100;
        row.patchValue({
          CGST: this.round(cgst),
          SGST: this.round(sgst),
          IGST: 0
        }, { emitEvent: false });
        totalTax = cgst + sgst;
      }
    } else {
      // VAT for non-India
      const vatPct = Number(row.get('VATPercentage')?.value) || 0;
      const vat = (taxableAmount * vatPct) / 100;
      row.patchValue({ VAT: this.round(vat) }, { emitEvent: false });
      totalTax = vat;
    }

    // Local Amount = (Amount + Tax) * Exchange Rate
    const localAmount = (amount + totalTax) * exchangeRate;
    row.patchValue({ LocalAmount: this.round(localAmount) }, { emitEvent: false });

    // Recalculate TDS
    this.calculateTDS();
  }



  deleteDetailRow(index: number) {
    this.details.removeAt(index);
    this.renumberRows();
    this.calculateTDS();
  }

  renumberRows() {
    this.details.controls.forEach((row, i) => {
      row.patchValue({ Sno: i + 1 }, { emitEvent: false });
    });
  }

  calculateTDS() {
    const totalTaxable = this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('TaxableAmount')?.value) || 0);
    }, 0);

    const tdsRate = this.tdsConfig?.tdsRate || 0;
    const tdsAmount = (totalTaxable * tdsRate) / 100;

    this.tdsGroup.patchValue({
      TaxableAmt: this.round(totalTaxable),
      TDSAmt: this.round(tdsAmount)
    });
  }

  calculateTotalAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('Amount')?.value) || 0);
    }, 0);
  }

  calculateTotalTaxableAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('TaxableAmount')?.value) || 0);
    }, 0);
  }

  calculateTotalCGST(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('CGST')?.value) || 0);
    }, 0);
  }

  calculateTotalSGST(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('SGST')?.value) || 0);
    }, 0);
  }

  calculateTotalIGST(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('IGST')?.value) || 0);
    }, 0);
  }

  calculateTotalVAT(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('VAT')?.value) || 0);
    }, 0);
  }

  calculateTotalLocalAmount(): number {
    return this.details.controls.reduce((sum, row: any) => {
      return sum + (Number(row.get('LocalAmount')?.value) || 0);
    }, 0);
  }




  // Vendor selection
  onVendorChange(selected: any) {
    const vendorMasterSid = (typeof selected === 'object' && selected !== null)
      ? (selected.CustomerMasterSid ?? selected)
      : selected;

    if (!vendorMasterSid) {
      this.vendorBranchList = [];
      this.vendorInvoiceForm.get('CustomerBranchSid')?.setValue(null);
      this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
      this.vendorInvoiceForm.get('PartyMasterSid')?.setValue(null);
      this.vendorInvoiceForm.get('CustomerMasterSid')?.setValue(null);
      this.vendorInvoiceForm.get('COAMasterSid')?.setValue(null);
      this.vendorInvoiceForm.get('GSTNo')?.setValue('');
      this.vendorInvoiceForm.get('PartyName')?.setValue('');
      this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');

      // Set default Invoice Type based on country
      if (this.isIndiaGST) {
        this.vendorInvoiceForm.get('InvoiceType')?.setValue('B2B');
      } else {
        this.vendorInvoiceForm.get('InvoiceType')?.setValue('VAT');
      }

      this.vendorInvoiceForm.get('GSTType')?.setValue('');
      return;
    }

    const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
    if (vendor) {
      // console.log('Selected Vendor:', vendor);

      // Store vendor reference for later use in payload
      this.selectedVendor = vendor; // Add this property

      // Set PartyName to vendor name
      this.vendorInvoiceForm.get('PartyName')?.setValue(vendor.CustomerName || '');

      // Set CustomerMasterSid from vendor
      this.vendorInvoiceForm.get('CustomerMasterSid')?.setValue(vendorMasterSid);
      // console.log('Set CustomerMasterSid:', vendorMasterSid);

      // Set PartyMasterSid from vendor's SubledgerMasterSid in form (for reference)
      if (vendor.SubledgerMasterSid) {
        this.vendorInvoiceForm.get('PartyMasterSid')?.setValue(Number(vendor.SubledgerMasterSid));
        // console.log('Set PartyMasterSid from SubledgerMasterSid:', vendor.SubledgerMasterSid);
      }

      // IMPORTANT: Set COAMasterSid from vendor's COAMappedId in form (for reference)
      if (vendor.COAMappedId) {
        this.vendorInvoiceForm.get('COAMasterSid')?.setValue(Number(vendor.COAMappedId));
        // console.log('Set COAMasterSid from COAMappedId:', vendor.COAMappedId);
      } else {
        console.warn('Vendor has no COAMappedId:', vendor);
        this.vendorInvoiceForm.get('COAMasterSid')?.setValue(null);
      }

      const countryCode = this.getCustomerCountryCode(vendor);
      // console.log('Vendor Country Code:', countryCode);

      // Set Invoice Type based on country
      if (this.isIndiaGST) {
        if (countryCode === 'IN' && vendor.GSTNo) {
          this.vendorInvoiceForm.get('InvoiceType')?.setValue('B2B');
          // console.log('Invoice Type: B2B (Indian vendor with GST)');
        } else if (countryCode !== 'IN') {
          this.vendorInvoiceForm.get('InvoiceType')?.setValue('EXWP');
          // console.log('Invoice Type: EXWP (Export vendor)');
        } else {
          this.vendorInvoiceForm.get('InvoiceType')?.setValue('B2C');
          // console.log('Invoice Type: B2C (Indian vendor without GST)');
        }
      } else {
        // For non-India countries (like UAE), always use VAT
        this.vendorInvoiceForm.get('InvoiceType')?.setValue('VAT');
        // console.log('Invoice Type: VAT (Non-India country)');
      }

      // Load TDS configuration
      this.loadVendorTDS(vendorMasterSid);
    }

    // Reset branch selection when vendor changes
    this.vendorInvoiceForm.get('CustomerBranchSid')?.setValue(null);
    this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
    this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');
    this.vendorInvoiceForm.get('GSTType')?.setValue('');
    this.getVendorBranchByVendor(Number(vendorMasterSid));
  }

  // Enhanced vendor branch selection
  onVendorBranchChange(selectedBranch: any) {
    const branchSid = (typeof selectedBranch === 'object' && selectedBranch !== null)
      ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
      : selectedBranch;

    if (!branchSid) {
      this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
      this.vendorInvoiceForm.get('GSTNo')?.setValue('');
      this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');
      return;
    }

    const foundBranch = this.vendorBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));

    if (foundBranch) {
      // Set address from branch
      const address = foundBranch.Address || foundBranch.CustomerAddress1 || foundBranch.customerAddress || '';
      this.vendorInvoiceForm.get('PartyAddress')?.setValue(address);

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

      // console.log('Setting Place of Supply:', placeOfSupply);
      this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue(placeOfSupply);

      // Set GST No based on country
      const vendorMasterSid = foundBranch.CustomerMasterSid;
      if (vendorMasterSid) {
        const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
        if (vendor) {
          const countryCode = this.getCustomerCountryCode(vendor);
          if (countryCode === 'IN') {
            this.vendorInvoiceForm.get('GSTNo')?.setValue(foundBranch.GSTNo || '');
          } else {
            this.vendorInvoiceForm.get('GSTNo')?.setValue(vendor.PanType || '');
          }
        }
      }

      // Auto-determine GST Type based on Place of Supply
      this.determineGSTType(placeOfSupply);
    } else {
      this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
      this.vendorInvoiceForm.get('GSTNo')?.setValue('');
      this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue('');
    }
  }

  getStateNameFromVendor(vendorMasterSid: number): string {
    const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
    if (vendor && vendor.stateMaster) {
      return vendor.stateMaster.stateName || vendor.stateMaster.StateName || '';
    }
    return '';
  }
  determineGSTType(placeOfSupply: string) {
    if (!placeOfSupply) {
      this.vendorInvoiceForm.get('GSTType')?.setValue('');
      return;
    }

    const companyState = this.getCompanyState();
    const vendorGSTNo = this.vendorInvoiceForm.get('GSTNo')?.value;
    const invoiceType = this.vendorInvoiceForm.get('InvoiceType')?.value;

    // console.log('=== DETERMINING GST TYPE ===');
    // console.log('Company State:', companyState);
    // console.log('Place of Supply:', placeOfSupply);
    // console.log('Vendor GST No:', vendorGSTNo);
    // console.log('Invoice Type:', invoiceType);
    // console.log('Current User Country:', this.currentUserCountry);
    // console.log('Is India GST:', this.isIndiaGST);

    // CRITICAL FIX: Check country first
    if (!this.isIndiaGST) {
      // Non-India countries (like UAE) - always use VAT
      this.vendorInvoiceForm.get('GSTType')?.setValue('VAT');
      // console.log('Non-India country - GST Type set to: VAT');
      return;
    }

    // Only for India countries - keep existing logic
    if (this.isIndiaGST) {
      if (invoiceType === 'EXWP' || invoiceType === 'EXWOP') {
        this.vendorInvoiceForm.get('GSTType')?.setValue('EXWP');
        // console.log('GST Type set to: EXPORT (Export scenario)');
        return;
      }

      if (vendorGSTNo) {
        const normalizedCompanyState = companyState?.trim().toLowerCase();
        const normalizedPlaceOfSupply = placeOfSupply?.trim().toLowerCase();

        if (normalizedPlaceOfSupply === normalizedCompanyState) {
          this.vendorInvoiceForm.get('GSTType')?.setValue('CGST+SGST');
          // console.log('GST Type set to: CGST+SGST (Intra-state)');
        } else {
          this.vendorInvoiceForm.get('GSTType')?.setValue('IGST');
          // console.log('GST Type set to: IGST (Inter-state)');
        }
      } else {
        this.vendorInvoiceForm.get('GSTType')?.setValue('B2C');
        // console.log('GST Type set to: B2C (Unregistered dealer)');
      }
    }
  }
  getCompanyState(): string {
    if (!this.currentCompany) {
      console.warn('No current company data available');
      return '';
    }

    // console.log('=== COMPANY STATE DEBUG ===');
    // console.log('Current Company:', this.currentCompany);
    // console.log('Current Branch:', this.currentBranch);
    // console.log('User Data:', this.userData);

    // Method 1: Check if currentCompany has stateMaster directly
    // if (this.currentCompany.stateMaster) {
    //   const state = this.currentCompany.stateMaster.stateName || this.currentCompany.stateMaster.StateName;
    //   if (state) {
    //     // console.log('Company State from currentCompany.stateMaster:', state);
    //     return state;
    //   }
    // }

    // Method 2: Check if currentCompany has StateMasterSid and look up in stateList
    // if (this.currentCompany.StateMasterSid && this.stateList.length > 0) {
    //   const state = this.stateList.find(s => 
    //     s.StateMasterSid === this.currentCompany.StateMasterSid || 
    //     s.stateMasterSid === this.currentCompany.StateMasterSid
    //   );
    //   if (state) {
    //     const stateName = state.stateName || state.StateName;
    //     // console.log('Company State from currentCompany.StateMasterSid lookup:', stateName);
    //     return stateName;
    //   }
    // }

    // Method 3: Check currentBranch state information
    // if (this.currentBranch && this.currentBranch.stateMaster) {
    //   const state = this.currentBranch.stateMaster.stateName || this.currentBranch.stateMaster.StateName;
    //   if (state) {
    //     // console.log('Company State from currentBranch.stateMaster:', state);
    //     return state;
    //   }
    // }

    // // Method 4: Check currentBranch StateMasterSid
    // if (this.currentBranch && this.currentBranch.StateMasterSid && this.stateList.length > 0) {
    //   const state = this.stateList.find(s => 
    //     s.StateMasterSid === this.currentBranch.StateMasterSid || 
    //     s.stateMasterSid === this.currentBranch.StateMasterSid
    //   );
    //   if (state) {
    //     const stateName = state.stateName || state.StateName;
    //     // console.log('Company State from currentBranch.StateMasterSid lookup:', stateName);
    //     return stateName;
    //   }
    // }

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
                // console.log('Company State from userData->branchMaster->stateMaster:', state);
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
                // console.log('Company State from userData->branchMaster->StateMasterSid lookup:', stateName);
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
            // console.log('Company State from userData->companyMaster->StateMasterSid lookup:', stateName);
            return stateName;
          }
        }
      }
    }

    // console.log('No company state found after all attempts');
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
      this.vendorInvoiceForm.get('PartyAddress')?.setValue('');
      return;
    }
    this.vendorInvoiceForm.get('PartyAddress')?.setValue(vendor.Address || '');
  }

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

    this.searchCostsModalInstance = this.modalService.open(this.searchCostsModalRef, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
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

    // Add vendor SID and branch SID if vendor is selected
    if (this.selectedVendorForSearch) {
      payload.vendorSid = this.selectedVendorForSearch.CustomerMasterSid;
      // If vendor branch is selected, include it
      if (this.selectedVendorBranchForSearch) {
        payload.vendorBranchSid = this.selectedVendorBranchForSearch.CustomerBranchSid;
      }
    }

    this.operationService.searchPendingCosts(payload).subscribe({
      next: (response) => {
        this.searchResultsLoading = false;
        this.searchPerformed = true;

        if (response.status && response.data) {
          this.allPendingCosts = response.data.items || response.data;
          this.autoSetHssacForPendingCosts();

          // Auto-populate vendor branch information from search
          if (this.selectedVendorForSearch && this.allPendingCosts.length > 0) {
            // Auto-select the vendor branch if available
            if (!this.selectedVendorBranchForSearch) {
              // Find the most common branch in the results
              const branchCounts = new Map();
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
                this.vendorInvoiceForm.patchValue({
                  MasterJobSid: firstCost.MasterJobSid,
                  MBLNo: firstCost.MBLNo || ''
                });
              }
              if (firstCost.HouseJobSid) {
                this.vendorInvoiceForm.patchValue({
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

  private async autoSetHssacForPendingCosts() {
    this.allPendingCosts.forEach(cost => {
      if (cost.ChargeMasterSid) {
        const charge = this.chargeList.find((c: any) => c.ChargeMasterSid === cost.ChargeMasterSid);

        if (charge) {
          // Try to get HSSAC code from different possible fields in charge
          const hsnCode = charge.HSNCode || charge.HSNSAC || charge.SACCode;

          if (hsnCode) {
            // Find matching HSSAC from hssacList using HSNCode
            const matchingHssac = (this.hssacList[0] || []).find(h =>
              h.HSSACCode === hsnCode ||
              h.HSNCode === hsnCode ||
              h.SACCode === hsnCode
            );

            if (matchingHssac) {
              cost.HSSACMasterSid = matchingHssac.HSSACMasterSid;
              cost.HSSACCode = matchingHssac.HSSACCode;
              cost.HSNCode = matchingHssac.HSSACCode; // For display
            }
          }

          // Also try from ChargeTaxMaster if available
          if (!cost.HSSACMasterSid && Array.isArray(charge.ChargeTaxMaster) && charge.ChargeTaxMaster.length > 0) {
            const firstTax = charge.ChargeTaxMaster[0];
            const taxHsnCode = firstTax?.HSNCode || firstTax?.HSNSAC;

            if (taxHsnCode) {
              const matchingHssac = this.hssacList[0].find(h =>
                h.HSSACCode === taxHsnCode ||
                h.HSNCode === taxHsnCode
              );

              if (matchingHssac) {
                cost.HSSACMasterSid = matchingHssac.HSSACMasterSid;
                cost.HSSACCode = matchingHssac.HSSACCode;
                cost.HSNCode = matchingHssac.HSSACCode;
              }
            }
          }
        }
      }

      // If still no HSSAC code, set default or leave empty
      if (!cost.HSSACCode) {
        cost.HSSACCode = '-';
      }
    });
  }

  // Extract unique vendors from costs
  private extractVendorsFromCosts(costs: any[]) {
    const vendorMap = new Map();

    costs.forEach(cost => {
      if (cost.VendorSid && cost.VendorName) {
        if (!vendorMap.has(cost.VendorSid)) {
          vendorMap.set(cost.VendorSid, {
            VendorSid: cost.VendorSid,
            VendorName: cost.VendorName,
            VendorAddress: cost.VendorAddress || '',
            CustomerName: cost.CustomerName || cost.VendorName,
            Address: cost.Address || cost.VendorAddress || '',
            HSSACCode: cost.HSSACCode || '',
            HSSACMasterSid: cost.HSSACMasterSid || null,
          });
        }
      }
    });

    this.searchVendors = Array.from(vendorMap.values());
    // console.log('Available vendors:', this.searchVendors);
  }
  onVendorSelectForCosts(selectedVendor: any) {
    this.selectedVendorForCosts = selectedVendor;

    if (selectedVendor) {
      // Auto-populate vendor information in main form
      this.autoPopulateVendorFromSelection(selectedVendor);
    }
  }



  private autoPopulateVendorFromSelection(vendor: any) {
    if (!vendor) return;

    // Set vendor information in main form
    this.vendorInvoiceForm.patchValue({
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
          this.vendorInvoiceForm.get('CustomerBranchSid')?.setValue(branchToSelect.CustomerBranchSid);
          this.triggerVendorBranchChange(branchToSelect.CustomerBranchSid);
        }
      }
    });

    // Set vendor address
    this.vendorInvoiceForm.patchValue({
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
      this.vendorInvoiceForm.get('PartyAddress')?.setValue(address);

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

      // console.log('Setting Place of Supply:', placeOfSupply);
      this.vendorInvoiceForm.get('PlaceOfSupply')?.setValue(placeOfSupply);

      // Set GST No based on country
      const vendorMasterSid = foundBranch.CustomerMasterSid;
      if (vendorMasterSid) {
        const vendor = this.vendorList.find(v => v.CustomerMasterSid === vendorMasterSid);
        if (vendor) {
          const countryCode = this.getCustomerCountryCode(vendor);
          if (countryCode === 'IN') {
            this.vendorInvoiceForm.get('GSTNo')?.setValue(foundBranch.GSTNo || '');
          } else {
            this.vendorInvoiceForm.get('GSTNo')?.setValue(vendor.PanType || '');
          }
        }
      }

      // Auto-determine GST Type based on Place of Supply
      this.determineGSTType(placeOfSupply);
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

    // Store job information from the first selected cost
    const firstCost = selectedCostItems[0];

    // Update the main form with job information
    if (firstCost.MasterJobSid) {
      this.vendorInvoiceForm.patchValue({
        MasterJobSid: firstCost.MasterJobSid,
        MBLNo: firstCost.MBLNo || ''
      });
    }

    if (firstCost.HouseJobSid) {
      this.vendorInvoiceForm.patchValue({
        HouseJobSid: firstCost.HouseJobSid,
        HBLNo: firstCost.HBLNo || ''
      });
    }

    // Use the vendor from first selected cost if no vendor explicitly selected
    if (!this.selectedVendorForCosts && firstCost) {
      const vendor = this.searchVendors.find(v => v.VendorSid === firstCost.VendorSid);
      if (vendor) {
        const fullVendor = this.vendorList.find(v => v.CustomerMasterSid === vendor.VendorSid);
        if (fullVendor) {
          this.selectedVendor = fullVendor;
          this.onVendorSelectForCosts(vendor);
        }
      }
    }

    selectedCostItems.forEach(cost => {
      const detailRow = this.createDetailGroup({
        CostRevenueChargesSid: cost.CostRevenueChargesSid,
        ChargeMasterSid: cost.ChargeMasterSid,
        ChargeDescription: cost.ChargeDescription,
        NumberOfUnit: cost.NumberOfUnit || 1,
        Rate: cost.Rate || cost.CostAmount || 0,
        CurrencyMasterSid: cost.CurrencyMasterSid || this.vendorInvoiceForm.get('CurrencyMasterSid')?.value,
        CurrencyCode: cost.CurrencyCode || this.vendorInvoiceForm.get('CurrencyMasterSid')?.value,
        ExchangeRate: cost.CostExchangeRate || cost.ExchangeRate || 1,
        MasterJobSid: cost.MasterJobSid,
        HouseJobSid: cost.HouseJobSid,
        HSSACMasterSid: cost.HSSACMasterSid,
        HSSACCode: cost.HSSACCode || cost.HSNCode,
        ChargeUOMSid: cost.ChargeUOMSid,
        // Include the CostAgentBranchSid for updating
        CostAgentBranchSid: this.selectedVendorBranchForSearch?.CustomerBranchSid || cost.CostAgentBranchSid
      });

      this.details.push(detailRow);
      // this.subscribeToRowChanges(detailRow);
    });

    this.renumberRows();
    this.recalculateAllRows();
    this.searchCostsModalInstance?.close();
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
  }

  // Load lookups
  loadLookups() {
    this.spinner.show();
    const companyRaw = localStorage.getItem('selected-company');
    const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;
    const filterOption = { CompanyMasterSid: company?.CompanyMasterSid, BranchMasterSid: company?.BranchMasterSid };

    Promise.all([
      firstValueFrom(this.operationService.getAllCreditorWithCOAMapped(filterOption)),
      firstValueFrom(this.operationService.getAllCurrencies()),
      firstValueFrom(this.operationService.getAllMappedChargeDebtors(filterOption)),
      firstValueFrom(this.operationService.getAllUom()),
      firstValueFrom(this.operationService.getAllState()),
    ]).then(([vendors, currencies, charges, uom, states]) => {
      this.vendorList = vendors.data || [];
      this.subledgerList = vendors.data || [];
      this.currencyList = currencies.data || [];
      this.currencyConfigService.initializeConfigurations(this.currencyList);
      if (!this.isEditMode) {
        this.initializeDefaultHeaderCurrency();
      }
      this.chargeList = charges.data || [];
      this.uomList = uom.data || [];
      this.stateList = states?.data || states || [];
      this.loadDepartments(company?.CompanyMasterSid).catch(e => {
        console.error('Error loading departments', e);
        this.departmentList = [];
      });

      this.loadMasterJobs().catch(e => {
        console.error('Error loading master jobs', e);
        this.masterJobList = [];
      });
      this.spinner.hide();
    }).catch(error => {
      console.error('Error loading lookups:', error);
      this.spinner.hide();
      this.appSettingService.showError('Error loading lookup data');
    });
  }
  async loadDepartments(companyMasterSid: number) {
    if (!companyMasterSid) {
      this.departmentList = [];
      return;
    }
    try {
      const departments: any = await firstValueFrom(this.operationService.getAllDepartments(companyMasterSid));
      if (departments && Array.isArray(departments)) {
        this.departmentList = departments;
      } else if (departments?.data && Array.isArray(departments.data)) {
        this.departmentList = departments.data;
      } else if (departments?.status && Array.isArray(departments.data)) {
        this.departmentList = departments.data;
      } else {
        this.departmentList = departments || [];
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      this.departmentList = [];
      throw error;
    }
  }
  async loadMasterJobs() {
    try {
      const companyRaw = localStorage.getItem('selected-company');
      const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;

      const payload = {
        CompanyMasterSid: company?.CompanyMasterSid,
        BranchMasterSid: company?.BranchMasterSid,
        limit: 200,
        offset: 0
      };

      const resp: any = await firstValueFrom(this.operationService.getAllMasterJobs(payload));
      let items: any[] = [];
      if (resp?.data && Array.isArray(resp.data)) {
        items = resp.data;
      } else if (Array.isArray(resp)) {
        items = resp;
      } else if (resp?.data?.data && Array.isArray(resp.data.data)) {
        items = resp.data.data;
      }

      this.masterJobList = items.map((it: any) => {
        const mj = {
          ...it,
          MasterJobSid: it.MasterJobSid ?? it.masterJobSid ?? it.MasterJobId ?? null,
          MasterJobNumber: it.MasterJobNumber ?? it.masterJobNumber ?? it.JobNumber ?? it.JobNo ?? '',
          MBLNo: it.MBLNo ?? it.mblNo ?? it.MBL ?? '',
          HBLNo: it.HBLNo ?? it.hblNo ?? it.HouseJob ?? '',
        };
        mj.displayLabel = `${mj.MasterJobNumber || ('#' + (mj.MasterJobSid ?? ''))}`;
        return mj;
      });
    } catch (err) {
      console.error('Error loading master jobs', err);
      this.masterJobList = [];
    }
  }
  getMasterJobNumber(jobSid: number): string {
    const job = this.masterJobList.find(j => j.MasterJobSid === jobSid);
    return job?.MasterJobNumber || job?.displayLabel || '-';
  }
  // Load vendor invoice by ID
  loadVendorInvoiceById(id: number) {
    this.spinner.show();
    this.operationService.getVendorInvoiceById(id).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.vendorInvoiceData = response.data;
          this.populateForm(this.vendorInvoiceData);
          this.setFormReadonly();
          // this.checkAndDisableExchangeRate();
          if(!this.isPosted){
            this.setupDueDateStream();
          }
          this.spinner.hide();
        } else {
          this.appSettingService.showError('Vendor Invoice not found');
          this.router.navigate(['/operation/vendor-invoice/list']);
        }
      },
      error: (error) => {
        this.spinner.hide();
        this.appSettingService.showError('Error loading Vendor Invoice');
        console.error('Error:', error);
        this.router.navigate(['/operation/vendor-invoice/list']);
      }
    });
  }
  // private setupCurrencyChangeListener(): void {
  //   this.vendorInvoiceForm.get('CurrencyMasterSid')?.valueChanges.subscribe((CurrencyMasterSid) => {
  //     if (CurrencyMasterSid) {
  //       const currentCurrencyCode = this.currentCompany?.currencyMaster?.CurrencyMasterSid;

  //       // Only fetch exchange rate if different from company currency
  //       if (CurrencyMasterSid !== currentCurrencyCode) {
  //         // Small delay to ensure user has selected the currency
  //         setTimeout(() => {
  //           this.fetchExchangeRate(currentCurrencyCode, CurrencyMasterSid);
  //         }, 300);
  //       } else {
  //         // Same currency - set to 1 and disable
  //         this.vendorInvoiceForm.get('ExchangeRate')?.disable();
  //         this.vendorInvoiceForm.get('ExchangeRate')?.setValue(1, { emitEvent: false });
  //       }
  //     }
  //   });
  // }
  setFormReadonly() {
    if (this.isViewMode || this.isPosted) {
      this.vendorInvoiceForm.disable();

      // Also disable details array if posted
      // if (this.isPosted) {
      //   this.details.disable();
      // }
    } else {
      this.vendorInvoiceForm.enable();
      this.details.enable();

      // Keep readonly fields as is
      this.vendorInvoiceForm.get('VoucherNumber')?.disable();
      this.vendorInvoiceForm.get('PostedOn')?.disable();
      this.vendorInvoiceForm.get('PartyAddress')?.disable();
      this.vendorInvoiceForm.get('GSTNo')?.disable();
      this.vendorInvoiceForm.get('PlaceOfSupply')?.disable();
      this.vendorInvoiceForm.get('CurrencyMasterSid')?.disable();
      this.details.controls.forEach(row => {
        row.disable();
      });
      this.details.controls.forEach(row => {
        row.get('Rate')?.enable();
        row.get('ExchangeRate')?.enable();
        row.get('HSSACMasterSid')?.enable();
      });
    }
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

    // console.log('populateForm called with data:', data);

    const currency = this.currencyList.find(c => c.CurrencyMasterSid === data.CurrencyMasterSid)
    const customerMasterSidFromBranch = data?.customerBranch?.CustomerMasterSid
      || data?.CustomerBranch?.CustomerMasterSid
      || null;

    this.vendorInvoiceForm.patchValue({
      VoucherNumber: data.VoucherNumber,
      VoucherDate: this.formatDateForNgb(data.VoucherDate),
      CustomerMasterSid: data.CustomerMasterSid || customerMasterSidFromBranch || null,
      PartyMasterSid: data.PartyMasterSid,
      PartyName: data.PartyName,
      PartyAddress: data.PartyAddress,
      CustomerBranchSid: data.CustomerBranchSid || customerMasterSidFromBranch || null,
      GSTNo: data.GST_VAT,
      PlaceOfSupply: data.PlaceOfSupply,
      PostedOn: data.PostDate ? this.formatDateForDisplay(data.PostDate) : null,
      CurrencyMasterSid: data.CurrencyMasterSid || currency.CurrencyMasterSid,
      CurrencyCode: data.CurrencyCode || currency.currencyCode,
      ExchangeRate: data.ExchangeRate || 1,
      BillNo: data.DocumentNumber,
      BillDate: data.DocumentDate ? this.formatDateForNgb(data.DocumentDate) : null,
      BillAmt: data.Amount || 0,
      MBLNo: data.MasterNumber,
      HBLNo: data.HouseNumber,
      PostStatus: data.PostStatus,
      InvoiceType: data.InvoiceType || 'B2B',
      GSTType: data.GSTType,
      Narration: data.Narration || '',
      Remarks: data.Remarks || (data.VoucherOthers && data.VoucherOthers[0]?.Remarks) || '',
      MasterJobSid: data.MasterJobSid,
      HouseJobSid: data.HouseJobSid,
      Status: data.Status,
      COAMasterSid: data.COAMasterSid
    },{emitEvent : false});
    // const headerCurr = this.currencyList.find(cr => cr.CurrencyMasterSid === data.CurrencyMasterSid);
    // if (headerCurr) {
    //   this.onHeaderCurrencyChange(headerCurr)
    // }

    if (data?.CurrencyMasterSid === this.currentCompany?.CurrencyMasterSid || this.isPosted) {
      this.vendorInvoiceForm.get('ExchangeRate')?.disable();
    } else {
      this.vendorInvoiceForm.get('ExchangeRate')?.enable();
    }

    const cm = data.CustomerMasterSid || null;
    const branchSid = data.CustomerBranchSid || null;
    // console.log('DEBUG - branchSid:', branchSid);
    // this.pendingBranchToSelect = branchSid ? Number(branchSid) : null;
    this.getVendorBranchByVendor(cm);
    // console.log('DEBUG - pendingBranchToSelect:', this.pendingBranchToSelect);
    // if (branchSid) {
    //   this.vendorInvoiceForm.get('CustomerBranchSid')?.setValue(Number(branchSid));
    //   this.pendingBranchToSelect = Number(branchSid);
    //   // console.log('DEBUG - pendingBranchToSelect:', this.pendingBranchToSelect);
    //   const currentVendor = this.vendorInvoiceForm.get('CustomerMasterSid')?.value;
    //   if (currentVendor) {
    //     this.getVendorBranchByVendor(Number(currentVendor));
    //   } else {
        // const found = this.vendorBranchList.find(b =>
        //   Number(b.CustomerBranchSid) === Number(branchSid) ||
        //   Number(b.CustomerName) === Number(branchSid)
        // );
        // if (found) {
        //   // this.vendorInvoiceForm.get('PartyName')?.setValue(Number(branchSid));
        //   // this.vendorInvoiceForm.get('PartyAddress')?.setValue(found.Address);
        // }
      // }
    // }


    // Populate details
    this.details.clear();
    // console.log('Details array cleared, length:', this.details.length);

    if (data.VoucherDetail && Array.isArray(data.VoucherDetail)) {
      // console.log('Populating details, count:', data.VoucherDetail.length);
      data.VoucherDetail.forEach((detail: any, index: number) => {
        // console.log(`Processing detail ${index}:`, detail);
        const row = this.createDetailGroup({
          VoucherDetailSid: detail.VoucherDetailSid,
          Sno: detail.Sno,
          LedgerMasterSid: detail.LedgerMasterSid,
          ChargeMasterSid: detail.ChargeMasterSid,
          ChargeDescription: detail.ChargeDescription,
          HSSACMasterSid: detail.HSSACMasterSid,
          ChargeUOMSid: detail.ChargeUOMSid || detail.chargeMaster?.UOM || null,
          NumberOfUnit: detail.NumberOfUnit,
          DrCr: detail.DrCr,
          CurrencyMasterSid: detail.CurrencyMasterSid,
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
          PartyAmount: detail.PartyAmount || this.getPartyAmount(detail),
          IsAutoGenerated: detail.IsAutoGenerated
        });
        // console.log(`Created form group for detail ${index}:`, row.value);
        this.details.push(row);
        this.fetchHSN(index);
        this.onDetailChange(index, 'CurrencyMasterSid');
        // console.log(`Pushed row to details array, new length: ${this.details.length}`);
        // this.subscribeToRowChanges(row);
      });
      this.recalculateAllRows();
      this.vendorInvoiceForm.disable();
      this.vendorInvoiceForm.updateValueAndValidity();
      // console.log('Finished populating details. Final length:', this.details.length);
      // console.log('Details controls:', this.details.controls);
    } else {
      // console.log('VoucherDetail is missing or not an array');
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

    // Populate others
    if (data.VoucherOthers && data.VoucherOthers.length > 0) {
      const others = data.VoucherOthers[0];
      this.vendorInvoiceForm.get('voucherOthers')?.patchValue({
        ContainerNumber: others.ContainerNumber || '',
        VoucherNote: others.VoucherNote || '',
        Footer: others.Footer || ''
      });
    }
  }

  // Save
  onSave() {
    if (this.vendorInvoiceForm.invalid) {
      this.appSettingService.showWarning('Please fill all required fields');
      this.markFormGroupTouched(this.vendorInvoiceForm);
      return;
    }

    if (this.details.length === 0) {
      this.appSettingService.showWarning('Please add at least one charge detail');
      return;
    }

    const payload = this.preparePayload();

    this.spinner.show();
    if (this.isEditMode) {
      this.operationService.updateVendorInvoiceById(this.headerId!, payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          if (response.status) {
            this.appSettingService.showSuccess('Vendor Invoice updated successfully');

            this.loadVendorInvoiceById(this.headerId);
          } else {
            this.appSettingService.showError('Failed to update Vendor Invoice');
            this.router.navigate(['/operation/vendor-invoice/list']);
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.appSettingService.showError('Error updating Vendor Invoice');
          console.error('Error:', error);
        }
      });
    } else {
      this.operationService.createVendorInvoice(payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          if (response.status) {
            this.appSettingService.showSuccess('Vendor Invoice created successfully');
            this.router.navigate(['/operation/vendor-invoice/list']);
          } else {
            this.appSettingService.showError(response.message || 'Failed to create Vendor Invoice');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.appSettingService.showError('Error creating Vendor Invoice');
          console.error('Error:', error);
        }
      });
    }
  }


  preparePayload(): any {
    const formValue = this.vendorInvoiceForm.getRawValue();
    const selectedCurrency = this.currencyList.find(c => c.CurrencyMasterSid === formValue.CurrencyMasterSid);
    const currencyCode = selectedCurrency?.currencyCode || '';
    const isPatching = this.details.controls.some(row =>
      row.get('CostRevenueChargesSid')?.value
    );

    const patchedIds: number[] = [];
    const patchCostData: any[] = []; // Store cost data to update
    const YearMasterSid = Number(localStorage.getItem('current-year-id'));
    const vendor = this.vendorList.find(v =>
      v.CustomerBranchSid === formValue.CustomerBranchSid ||
      v.CustomerMasterSid === formValue.CustomerMasterSid ||
      v.CustomerName === formValue.PartyName
    );

    const partyMasterSid = vendor?.SubledgerMasterSid || null;
    const coaMasterSid = vendor?.COAMappedId || null;

    const payload: any = {
      VoucherHeaderSid: this.headerId,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      CustomerMasterSid: formValue.CustomerMasterSid,
      PartyMasterSid: formValue.PartyMasterSid || vendor.SubledgerMasterSid,
      PartyName: formValue.PartyName,
      PartyAddress: formValue.PartyAddress,
      CustomerBranchSid: formValue.CustomerBranchSid,
      GSTNo: formValue.GSTNo,
      PlaceOfSupply: formValue.PlaceOfSupply,
      CurrencyMasterSid: formValue.CurrencyMasterSid,
      CurrencyCode: currencyCode,
      ExchangeRate: formValue.ExchangeRate,
      BillNo: formValue.BillNo,
      BillDate: formValue.BillDate ? new Date(formValue.BillDate) : null,
      BillAmt: formValue.BillAmt,
      MBLNo: formValue.MBLNo,
      HBLNo: formValue.HBLNo,
      PostStatus: formValue.PostStatus,
      InvoiceType: formValue.InvoiceType,
      GSTType: formValue.GSTType,
      Narration: formValue.Narration,
      MasterJobSid: formValue.MasterJobSid,
      HouseJobSid: formValue.HouseJobSid,
      VoucherDate: formValue.VoucherDate ? new Date(formValue.VoucherDate) : null,
      DepartmentMasterSid: formValue.DepartmentMasterSid || null,
      PostDate: formValue.PostedOn ? new Date(formValue.PostedOn) : null,
      Status: formValue.Status,
      COAMasterSid: coaMasterSid,
      YearMasterSid: YearMasterSid,
      CreatedBy: this.currUserEmail || 'System',
      UpdatedBy: this.currUserEmail || 'System',
      isPatching: isPatching
    };

    // Add details with CostRevenueChargesSid and job IDs
    payload.VoucherDetail = formValue.voucherDetails.map((detail: any, index: number) => {
      const detailCurrency = this.currencyList.find(c => c.CurrencyMasterSid === detail.CurrencyMasterSid);
      const detailCurrencyCode = detailCurrency?.currencyCode || '';
      const costRevenueChargesSid = detail.CostRevenueChargesSid;

      if (costRevenueChargesSid) {
        patchedIds.push(costRevenueChargesSid);

        // Store cost data for updating CostAgentBranchSid
        patchCostData.push({
          CostRevenueChargesSid: costRevenueChargesSid,
          CostAgentBranchSid: formValue.CustomerBranchSid || detail.CostAgentBranchSid
        });
      }

      const partyAmount = this.getPartyAmount(detail);

      return {
        Sno: index + 1,
        VoucherDetailSid: detail.VoucherDetailSid ? Number(detail.VoucherDetailSid) : null,
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
        CurrencyMasterSid: detail.CurrencyMasterSid,
        CurrencyCode: detailCurrencyCode,
        ExchangeRate: detail.ExchangeRate,
        DrCr: detail.DrCr,
        LedgerMasterSid: detail.LedgerMasterSid,
        COAMasterSid: detail.COAMasterSid || coaMasterSid,
        MasterJobSid: detail.MasterJobSid,
        HouseJobSid: detail.HouseJobSid,
        DepartmentMasterSid: detail.DepartmentMasterSid,
        Remarks: detail.Remarks,
        CostRevenueChargesSid: costRevenueChargesSid || null,
        PartyAmount: toNumber(partyAmount),
        YearMasterSid: YearMasterSid
      };
    });

    if (patchedIds.length > 0) {
      payload.patchedIds = patchedIds;
    }

    // Add cost data for updating CostAgentBranchSid
    if (patchCostData.length > 0) {
      payload.patchCostData = patchCostData;
    }

    // Add others
    payload.VoucherOthers = {
      ...formValue.voucherOthers,
      Remarks: formValue.Remarks || ''
    };

    // console.log('=== PAYLOAD DEBUG ===');
    // console.log('Patch Cost Data:', patchCostData);
    // console.log('Full Payload:', payload);

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
      return this.getFormattedAmount(toNumber(detail?.LocalAmount), chargeCurrencyId);
    } else {
      return this.getFormattedAmount(toNumber(detail?.LocalAmount) / toNumber(voucherHeaderExRate), chargeCurrencyId);
    }
  }


  public getFormattedAmount(amount: number, CurrencyMasterSid: number) {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    const input = {
      value: amount,
      currencyCode: currency?.currencyCode
    }
    return this.currencyFormatService.formatAmount(input, false);
  }

  patchExchangeRateForDetail(fromCurrencyCode: string, toCurrencyCode: string, index: number) {
    console.log("Patch Exchange Rate triggered with fromCurrencyCode", fromCurrencyCode, "and toCurrencyCode", toCurrencyCode, "and index", index);
    const formGroup = this.details.at(index) as FormGroup;
    if (fromCurrencyCode === toCurrencyCode) {
      formGroup.patchValue({
        CurrencyCode: fromCurrencyCode,
        ExchangeRate: 1,
      });
      this.recalcRow(index);
      formGroup.get('ExchangeRate')?.disable();
      return;
    }

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode,
      toCurrencyCode,
      EffectiveFrom: this.isEditMode ? new Date(this.vendorInvoiceData?.VoucherDate) : new Date(),
      segment: 'cost'
    }

    // console.log("Currency Exchange payload", payload)

    this.operationService.getExchangeRate(payload).subscribe({
      next: (response: any) => {
        if (response?.status) {
          const formGroup = this.details.at(index) as FormGroup;
          formGroup.get('ExchangeRate')?.enable();
          formGroup.patchValue({
            CurrencyCode: fromCurrencyCode,
            ExchangeRate: Number(response.data),
          });
          this.recalcRow(index);
        } else {
          console.warn('Exchange rate not found, defaulting to 1');
          formGroup.get('ExchangeRate')?.disable();
          formGroup.patchValue({
            ExchangeRate: 1,
            CurrencyCode: fromCurrencyCode,
          });
          this.recalcRow(index);
        }
      },
      error: (err) => {
        console.error('Error fetching exchange rate:', err);
        formGroup.get('ExchangeRate')?.disable();
        formGroup.patchValue({
          ExchangeRate: 1,
          CurrencyCode: fromCurrencyCode,
        });
        this.recalcRow(index);
      }
    });
  }

  hasDetailSid(index:number){
    const detail = (this.details.at(index) as FormGroup)?.getRawValue();
    return !!detail?.VoucherDetailSid;
  }


  getTotalLocalCredits() {
    return (this.details.getRawValue().reduce((sum, dtl: any) => {
      if (dtl.DrCr === 'C') {
        return sum + Number(dtl.LocalAmount);
      }
      return sum;
    }, 0)).toFixed(2);
  }

  getTotalLocalDebits() {
    return (this.details.getRawValue().reduce((sum, dtl: any) => {
      if (dtl.DrCr === 'D') {
        return sum + Number(dtl.LocalAmount);
      }
      return sum;
    }, 0)).toFixed(2);
  }

  getNetCrDr() {
    return toNumber(this.getTotalLocalCredits() - this.getTotalLocalDebits()).toFixed(2);
  }

  getPartyCurrCreditAmt() {
    return (this.details.getRawValue().reduce((sum, dtl: any) => {
      if (dtl.DrCr === 'C') {
        return sum + Number(dtl.PartyAmount);
      }
      return sum;
    }, 0)).toFixed(2);
  }

  getPartyCurrDebitAmt() {
    return (this.details.getRawValue().reduce((sum, dtl: any) => {
      if (dtl.DrCr === 'D') {
        return sum + Number(dtl.PartyAmount);
      }
      return sum;
    }, 0)).toFixed(2);
  }

  //   prepareVoucherTDSPayload(details: any[]): any[] {
  //   const taxRecords: any[] = [];

  //   details.forEach((detail: any) => {
  //     if (detail.TaxAmount1 > 0 || detail.TaxAmount2 > 0 || detail.TaxAmountIGST > 0) {
  //       if (detail.TaxAmountIGST > 0) {
  //         taxRecords.push({
  //           TaxType: 'IGST',
  //           TaxPercentage: detail.TaxPercentageIGST,
  //           TaxAmount: detail.TaxAmountIGST,
  //           HSSACMasterSid: detail.HSSACMasterSid,
  //           TDSSetRateSid: detail.TDSSetRateSid,
  //           ITSectionCode: this.tdsGroup.get('ITSectionCode')?.value || ''
  //         });
  //       } else {
  //         if (detail.TaxAmount1 > 0) {
  //           taxRecords.push({
  //             TaxType: 'CGST',
  //             TaxPercentage: detail.TaxPercentage1,
  //             TaxAmount: detail.TaxAmount1,
  //             TDSSetRateSid: detail.TDSSetRateSid,
  //             HSSACMasterSid: detail.HSSACMasterSid,
  //             ITSectionCode: this.tdsGroup.get('ITSectionCode')?.value || ''
  //           });
  //         }
  //         if (detail.TaxAmount2 > 0) {
  //           taxRecords.push({
  //             TaxType: 'SGST',
  //             TaxPercentage: detail.TaxPercentage2,
  //             TaxAmount: detail.TaxAmount2,
  //             TDSSetRateSid: detail.TDSSetRateSid,
  //             HSSACMasterSid: detail.HSSACMasterSid,
  //             ITSectionCode: this.tdsGroup.get('ITSectionCode')?.value || ''
  //           });
  //         }
  //       }
  //     }
  //   });

  //   return taxRecords;
  // }

  onFinalSave() {
    if (this.vendorInvoiceForm.invalid) {
      this.vendorInvoiceForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill required vendor invoice fields.');
      return;
    }

    if (this.details.length === 0) {
      this.appSettingService.showWarning('Please add at least one charge line.');
      return;
    }

    this.recalculateAllRows();
    this.saveVendorInvoice(true); // true indicates final save
  }

  // Draft Save
  onDraftSave() {
    if (this.vendorInvoiceForm.invalid) {
      this.vendorInvoiceForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill required invoice fields.');
      return;
    }

    this.recalculateAllRows();
    this.saveVendorInvoice(false); // false indicates draft save
  }

  private saveVendorInvoice(isFinal: boolean) {
    const payload = this.preparePayload();

    if (this.vendorInvoiceForm.hasError('inconsistentExchangeRates')) {
      const errorMsg = getExchangeRateErrorMessage(
        this.vendorInvoiceForm,
        this.currencyList
      );
      this.appSettingService.showError(errorMsg);
      return;
    }

    if (this.vendorInvoiceForm.invalid) {
      this.vendorInvoiceForm.markAllAsTouched();
      this.vendorInvoiceForm.updateValueAndValidity();
      this.appSettingService.showError('Please fill all the required fields.');
      return;
    }

    this.spinner.show();

    const saveObservable = this.headerId
      ? this.operationService.updateVendorInvoiceById(this.headerId, payload)
      : this.operationService.createVendorInvoice(payload);

    saveObservable.subscribe({
      next: async (resp: any) => {
        if (!resp?.status) {
          this.appSettingService.showError('Failed to save vendor invoice.');
          return;
        }
        const voucherHeaderSid = resp.data?.VoucherHeaderSid || this.headerId;

        if (isFinal) {
          const postResult = await this.postVoucher(voucherHeaderSid);
          if (postResult && postResult.status) {
            this.appSettingService.showSuccess(
              `Vendor Invoice ${this.headerId ? 'updated' : 'created'} and posted successfully!`
            );
          } else {
            this.appSettingService.showWarning(
              'Vendor Invoice created successfully but failed during posting.'
            );
            setTimeout(() => {
              this.toastr.clear();

              if (postResult?.message) {
                this.appSettingService.showError(postResult.message);
              }
            }, 2000);
          }

          if (!this.headerId && voucherHeaderSid) {
            this.headerId = voucherHeaderSid;
            this.router.navigate(['operation/vendor-invoice/entry', voucherHeaderSid]);
          } else if (this.headerId && voucherHeaderSid) {
            this.loadVendorInvoiceById(voucherHeaderSid);
          }
        } else {
          this.spinner.hide();
          this.appSettingService.showSuccess(
            'Vendor Invoice saved as draft successfully!'
          );

          if (!this.headerId && voucherHeaderSid) {
            this.headerId = voucherHeaderSid;
            this.router.navigate(['operation/vendor-invoice/entry', voucherHeaderSid]);
          } else if (this.headerId && voucherHeaderSid) {
            this.loadVendorInvoiceById(voucherHeaderSid);
          }
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Save Vendor invoice error', err);
        this.appSettingService.showError('Failed to save invoice.');
      }
    });
  }

  consistentExchangeRatesValidator(currencyList: any[] = []): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      // Map: CurrencyMasterSid -> Array of { rate, path, controlRef }
      const currencyRateMap = new Map<number, Array<{
        rate: number;
        path: string;
        control: AbstractControl;
      }>>();

      /**
       * ✅ COMPLETE TRAVERSE LOGIC - Handles ALL cases
       */
      function traverseControls(control: AbstractControl, path: string[] = []): void {
        // Handle FormGroup
        if (control instanceof FormGroup) {
          let currencySid: number | null = null;
          let exchangeRate: number | null = null;

          // ✅ PRIORITY 1: Direct CurrencyMasterSid (detail rows)
          const currencySidControl = control.get('CurrencyMasterSid');
          if (currencySidControl?.value) {
            currencySid = Number(currencySidControl.value);
            exchangeRate = Number(control.get('ExchangeRate')?.value || 0);
          }
          // ✅ PRIORITY 2: CurrencyCode → lookup SID (fallback)
          else {
            const currencyCode = control.get('CurrencyCode')?.value as string;
            if (currencyCode && currencyList.length > 0) {
              const currency = currencyList.find(c =>
                c.currencyCode === currencyCode ||
                c.CurrencyCode === currencyCode
              );
              currencySid = currency?.CurrencyMasterSid || null;
              exchangeRate = Number(control.get('ExchangeRate')?.value || 0);
            }
          }

          // ✅ PRIORITY 3: Root/header level (no CurrencyMasterSid needed)
          if (!currencySid && path.length === 1 && path[0] === 'root') {
            const rootCurrencyCode = (formGroup as FormGroup).get('CurrencyCode')?.value as string;
            if (rootCurrencyCode && currencyList.length > 0) {
              const currency = currencyList.find(c =>
                c.currencyCode === rootCurrencyCode ||
                c.CurrencyCode === rootCurrencyCode
              );
              currencySid = currency?.CurrencyMasterSid || null;
              exchangeRate = Number((formGroup as FormGroup).get('ExchangeRate')?.value || 0);
            }
          }

          // ✅ COLLECT if both SID and rate exist
          if (currencySid && !isNaN(exchangeRate!) && exchangeRate! > 0) {
            const rate = Number(exchangeRate!.toFixed(6));
            const pathString = path.length > 0 ? path.join('.') : 'header';

            if (!currencyRateMap.has(currencySid)) {
              currencyRateMap.set(currencySid, []);
            }

            currencyRateMap.get(currencySid)!.push({
              rate,
              path: pathString,
              control: control.get('ExchangeRate') || control
            });
          }

          // ✅ RECURSE into child controls
          Object.keys((control as FormGroup).controls).forEach(key => {
            const childControl = (control as FormGroup).get(key);
            if (childControl) {
              traverseControls(childControl, [...path, key]);
            }
          });
        }

        // Handle FormArray (voucherDetails)
        else if (control instanceof FormArray) {
          control.controls.forEach((childControl, index) => {
            traverseControls(childControl, [...path, `[${index}]`]);
          });
        }
      }

      // ✅ START TRAVERSAL
      traverseControls(formGroup, ['root']);

      // ✅ CLEAR PREVIOUS ERRORS
      currencyRateMap.forEach((rateEntries) => {
        rateEntries.forEach(entry => {
          const currentErrors = entry.control.errors;
          if (currentErrors && currentErrors['inconsistentRate']) {
            delete currentErrors['inconsistentRate'];
            entry.control.setErrors(
              Object.keys(currentErrors).length > 0 ? currentErrors : null
            );
          }
        });
      });

      // ✅ CHECK FOR INCONSISTENCIES
      const conflicts: Array<{
        currencySid: number;
        rates: number[];
        paths: string[];
      }> = [];

      currencyRateMap.forEach((rateEntries, currencySid) => {
        const uniqueRates = new Set(rateEntries.map(entry => entry.rate));

        if (uniqueRates.size > 1) {
          conflicts.push({
            currencySid,
            rates: Array.from(uniqueRates),
            paths: rateEntries.map(e => e.path)
          });

          // Mark each ExchangeRate control as invalid
          rateEntries.forEach(entry => {
            entry.control.setErrors({
              ...entry.control.errors,
              inconsistentRate: true
            });
            entry.control.markAsTouched();
          });
        }
      });

      // ✅ EXPLICIT RETURN - fixes TS2355
      if (conflicts.length > 0) {
        return {
          inconsistentExchangeRates: {
            message: 'Same currency has different exchange rates in different rows',
            conflicts: conflicts.map(c => ({
              currencyId: c.currencySid,
              conflictingRates: c.rates,
              locations: c.paths
            }))
          }
        };
      }

      return null;
    };
  }

  private setupDueDateStream(): void {
    const party$ = this.vendorInvoiceForm.get('PartyMasterSid')!.valueChanges;
    const branch$ = this.vendorInvoiceForm.get('CustomerBranchSid')!.valueChanges;
    const voucherDate$ = this.vendorInvoiceForm.get('VoucherDate')!.valueChanges;
    const department$ = this.vendorInvoiceForm.get('DepartmentMasterSid')!.valueChanges;

    this.subscriptions.push(
      combineLatest([party$, branch$, voucherDate$, department$])
        .pipe(
          debounceTime(200),

          map(([partyLedgerSid, branchId, voucherDate, departmentId]) => {
            let CustomerMasterSid: number | undefined;
            let CustomerBranchSid: number | undefined;

            if (partyLedgerSid) {
              CustomerMasterSid = this.vendorList
                .find(v => v.SubledgerMasterSid === partyLedgerSid)
                ?.CustomerMasterSid;
            }

            if (branchId) {
              CustomerBranchSid = branchId;
              CustomerMasterSid ??=
                this.vendorBranchList
                  .find(b => b.BranchMasterSid === branchId)
                  ?.CustomerMasterSid;
            }

            if (!voucherDate || !CustomerMasterSid) return null;

            return {
              CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
              CustomerMasterSid,
              CustomerBranchSid,
              DepartmentMasterSid: departmentId,
              VoucherDate: !isNaN(new Date(voucherDate).getTime())
                ? new Date(voucherDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
            };
          }),

          // 🔥 core requirement
          distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),

          // cancel previous request if new payload comes
          switchMap(payload =>
            payload
              ? this.operationService.getDueDate(payload)
              : of(null)
          )
        )
        .subscribe(response => {
          if (response?.status && response.data?.dueDate) {
            this.others.get('DueDate')?.setValue(
              new Date(response.data.dueDate),
              { emitEvent: false }
            );
          } else {
            this.others.get('DueDate')?.setValue(null, { emitEvent: false });
          }
        })
    );
  }


  private async postVoucher(voucherHeaderSid: number): Promise<{ status: boolean, data: any, message: string }> {
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
          CountryMasterSid: currentCountry,
          countryName: currentCountryName,
          TaxCategory: 'Inter',
          EffectiveFrom: new Date().toISOString(),
          TaxType: 'Output'
        }
      };

      const result = await firstValueFrom(this.operationService.postVoucherByVoucherSid(postPayload));

      // console.log("Result of Posting", result)
      this.spinner.hide();
      return result;
    } catch (error) {
      console.error('Post voucher error:', error);
      return null;
    }
  }
  // Check if voucher is posted (for UI controls)
  get isPosted(): boolean {
    if (this.vendorInvoiceData?.PostStatus === 'P' && !this.vendorInvoiceForm.disabled) {
      this.vendorInvoiceForm.disable();
    }
    return this.vendorInvoiceData?.PostStatus === 'P';
  }

  // Check if voucher is draft
  get isDraft(): boolean {
    return !this.vendorInvoiceData?.PostStatus || this.vendorInvoiceData?.PostStatus === 'U';
  }


  onReset() {
    if (this.isEditMode) {
      this.loadVendorInvoiceById(this.headerId!);
    } else {
      this.vendorInvoiceForm.reset();
      this.details.clear();
      this.tdsGroup.reset();
      const currencySettings = this.companySettings.getCurrencySettings();
      this.vendorInvoiceForm.patchValue({
        CurrencyCode: currencySettings.code,
        ExchangeRate: 1,
        InvoiceType: 'B2B',
        Status: 'A'
      });
    }
  }

  onCancel() {
    this.router.navigate(['/operation/vendor-invoice/list']);
  }

  onPrint() {
    window.print();
  }

  getChargeName(chargeMasterSid: number): string {
    if (!chargeMasterSid) return '-';
    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeMasterSid);
    return charge?.chargeCode || '-';
  }

  onSubmit() {
    if (this.vendorInvoiceForm.invalid) {
      this.markFormGroupTouched(this.vendorInvoiceForm);
      this.appSettingService.showError('Please fill all required fields');
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
      // Update existing vendor invoice
      this.operationService.updateVendorInvoiceById(this.headerId, payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          this.isSaving = false;
          if (response.status) {
            this.appSettingService.showSuccess('Vendor Invoice updated successfully');
            this.loadVendorInvoiceById(this.headerId);
          } else {
            this.appSettingService.showError('Failed to update Vendor Invoice');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError('Error updating Vendor Invoice');
          console.error('Error:', error);
        }
      });
    } else {
      // Create new vendor invoice
      this.operationService.createVendorInvoice(payload).subscribe({
        next: (response) => {
          this.spinner.hide();
          this.isSaving = false;
          if (response.status) {
            this.appSettingService.showSuccess('Vendor Invoice created successfully');
            const id = response.data?.newVoucher?.VoucherHeaderSid || response.data?.VoucherHeaderSid || this.headerId;
            if (id) this.router.navigate(['operation/vendor-invoice/entry', id]);
            else this.router.navigate(['operation/vendor-invoice/list']);
          } else {
            this.appSettingService.showError('Failed to create Vendor Invoice');
          }
        },
        error: (error) => {
          this.spinner.hide();
          this.isSaving = false;
          this.appSettingService.showError('Error creating Vendor Invoice');
          console.error('Error:', error);
        }
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.vendorInvoiceForm.get(fieldName);
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
    this.vendorInvoiceForm.get(fieldName)?.setValue(ngbDate);
    datepicker.close();
  }

  onCurrencyChange(event: any): void {
    // console.log('=== onCurrencyChange START ===');

    if (!this.vendorInvoiceForm) {
      console.warn('Form not initialized yet');
      return;
    }

    let selectedCurrency: any;

    if (typeof event === 'object' && event !== null) {
      selectedCurrency = event;
    } else {
      const currencySid = event;
      selectedCurrency = this.currencyList.find(c => c.CurrencyMasterSid === currencySid);
    }

    if (!selectedCurrency) {
      console.warn('No currency selected or found');
      return;
    }

    // Update CurrencyMasterSid in the form
    this.vendorInvoiceForm.patchValue({
      CurrencyMasterSid: selectedCurrency.CurrencyMasterSid
    }, { emitEvent: false });

    // If currency is different from company currency, fetch exchange rate
    if (this.companyCurrency?.currencyMasterSid !== selectedCurrency.CurrencyMasterSid) {
      // Get currency code from selected currency for API call
      const selectedCurrencyCode = selectedCurrency.currencyCode;
      this.fetchExchangeRate(this.currentCurrencyCode, selectedCurrencyCode);
    } else {
      const exchangeRateControl = this.vendorInvoiceForm.get('ExchangeRate');
      if (exchangeRateControl) {
        exchangeRateControl.disable();
      }

      this.vendorInvoiceForm.patchValue({
        ExchangeRate: 1
      }, { emitEvent: false });
    }

    // console.log('=== onCurrencyChange END ===');
    this.recalculateAllRows();
  }
  // Add this new method to fetch exchange rate
  private fetchExchangeRate(fromCurrencyCode: string, toCurrencyCode: string): void {

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode: fromCurrencyCode,
      toCurrencyCode: toCurrencyCode,
      EffectiveFrom: this.isEditMode ? new Date(this.vendorInvoiceData?.VoucherDate) : new Date(),
      segment: 'cost'
    };

    if (!fromCurrencyCode || !toCurrencyCode) {
      return;
    }

    const fromCurrencyId = this.currencyList.find(c => c.currencyCode === fromCurrencyCode)?.CurrencyMasterSid;

    if (fromCurrencyCode === toCurrencyCode) {
      this.vendorInvoiceForm.patchValue({
        CurrencyCode: fromCurrencyCode,
        ExchangeRate: 1
      });
      this.vendorInvoiceForm.get('ExchangeRate')?.disable();
      return;
    }

    this.operationService.getExchangeRate(payload).subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          const exchangeRate = Number(resp.data || 1);
          this.vendorInvoiceForm.patchValue({
            CurrencyCode: fromCurrencyCode,
            ExchangeRate: exchangeRate
          }, { emitEvent: false });
          this.vendorInvoiceForm.get('ExchangeRate')?.enable();
          // this.recalculateAllRows();
        } else {
          this.vendorInvoiceForm.patchValue({
            CurrencyCode: fromCurrencyCode,
            ExchangeRate: 1
          }, { emitEvent: false });
          this.vendorInvoiceForm.get('ExchangeRate')?.disable();

        }
      },
      error: (err) => {
        console.error('Error fetching exchange rate:', err);
        // Default to 1 if API fails
        this.vendorInvoiceForm.patchValue({
          CurrencyCode: fromCurrencyCode,
          ExchangeRate: 1
        });
        this.vendorInvoiceForm.get('ExchangeRate')?.disable();
        // this.recalculateAllRows();
      }
    });
  }



  // onExchangeRateChange(): void {
  //   this.recalculateAllRows();
  // }

  // Utility methods
  round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  formatDateForNgb(date: string | Date | null): NgbDateStructLike | null {
    if (!date) return null;
    const d = new Date(date);
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  }

  // parseNgbDateToISO(ngbDate: NgbDateStructLike | null): string | null {
  //   if (!ngbDate) return null;
  //   const d = new Date(ngbDate.year, ngbDate.month - 1, ngbDate.day);
  //   return d.toISOString();
  // }
  // private fromNgbDate(s: NgbDateStructLike | null): Date | null {
  //   if (!s || !s.year) return null;
  //   return new Date(s.year, (s.month || 1) - 1, s.day || 1);
  // }

  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }
  removeDetailRow(index: number) {
    if (this.details.length > index) this.details.removeAt(index);
    this.recalculateAllRows();
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
    // console.log('Vendor invoice data received from document upload:', processedData);

    // Populate the main form with the processed data
    this.populateFormFromDocument(processedData);

    // Show success message
    // this.toastr.success('Vendor invoice data populated from document');
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
      ExchangeRate: data.exchangeRate || 1,
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
  getCurrencyCode(currencyMasterSid: number): string {
    if (!currencyMasterSid) return '';
    const currency = this.currencyList.find(c => c.CurrencyMasterSid === currencyMasterSid);
    return currency?.currencyCode || '';
  }

  /**
   * Get tax ledger for charge - VENDOR INVOICE (INPUT TAX)
   */
  private async getTaxLedgerForHSSAC(
    hssacItem: any,
    placeOfSupplyState: string
  ): Promise<any> {
    try {
      // console.log('=== GET TAX LEDGER DEBUG (VENDOR) ===');
      // console.log('HSSAC object:', hssacItem);

      const taxGroupSid = hssacItem?.TaxGroupSid;
      // console.log('Extracted TaxGroupSid:', taxGroupSid);

      if (!taxGroupSid) {
        // console.log('No TaxGroupSid found for hssac:', hssacItem?.HSSACCode);
        return null;
      }

      const currentCountry = Number(this.currentCompany?.CountryMasterSid);

      // VENDOR INVOICE = INPUT (purchasing goods/services)
      const inputOrOutput: 'Input' | 'Output' = 'Input';

      const companyState = this.getCompanyState();
      const vendorCountry = this.getVendorCountry();
      const taxCategory = this.determineTaxCategory(companyState, placeOfSupplyState, vendorCountry);

      // console.log('Tax Ledger Parameters (Vendor):', {
      //   hssac: hssacItem?.HSSACCode,
      //   taxGroupSid,
      //   inputOrOutput, // This is INPUT for vendor invoices
      //   taxCategory,
      //   companyState,
      //   placeOfSupplyState,
      //   vendorCountry,
      //   currentCountry
      // });

      const payload = {
        taxGroup: taxGroupSid,
        InputOrOutput: inputOrOutput,
        TaxCategory: taxCategory,
        CountryMasterSid: currentCountry
      };
      // console.log('Calling tax ledger API with payload:', payload);

      const response = await firstValueFrom(
        this.operationService.getLedgerForTaxGroup(payload).pipe(
          catchError(error => {
            console.error('Error calling getLedgerForTaxGroup:', error);
            return of(null);
          })
        )
      );

      // console.log('Tax Ledger API Response:', response);
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
        return null;
      }

    } catch (error) {
      console.error('Error fetching tax ledger:', error);
      return null;
    }
  }

  private getVendorCountry(): string {
    // For Vendor Invoice - get from vendor
    const vendorMaster = this.vendorList.find(v => v.CustomerMasterSid === this.vendorInvoiceForm.get('CustomerMasterSid')?.value);
    const vendorBranch = this.vendorBranchList.find(b => b.CustomerBranchSid === this.vendorInvoiceForm.get('CustomerBranchSid')?.value);

    const country = vendorMaster?.countryMaster?.countryCode ||
      vendorMaster?.Country ||
      vendorBranch?.countryMaster?.countryCode ||
      vendorBranch?.Country ||
      '';

    // console.log('Vendor Country (Vendor Invoice):', {
    //   vendorName: vendorMaster?.CustomerName,
    //   countryFromMaster: vendorMaster?.countryMaster?.countryCode,
    //   countryFromBranch: vendorBranch?.countryMaster?.countryCode,
    //   finalCountry: country
    // });

    return country;
  }

  // private getTaxGroupSidFromCharge(charge: any): number | null {
  //   // console.log('DEBUG - getTaxGroupSidFromCharge - charge structure:', charge);

  //   if (!charge) {
  //     // console.log('DEBUG - Charge object is null or undefined');
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

  //   // console.log('DEBUG - chargeTaxMaster found:', chargeTaxMaster);

  //   if (!chargeTaxMaster || !Array.isArray(chargeTaxMaster) || chargeTaxMaster.length === 0) {
  //     // console.log('DEBUG - No chargeTaxMaster array found or empty');
  //     return null;
  //   }

  //   const firstTax = chargeTaxMaster[0];
  //   // console.log('DEBUG - First tax record:', firstTax);

  //   // Try different possible field names for TaxGroupSid
  //   const taxGroupSid = firstTax.TaxGroupSid ||
  //     firstTax.taxGroupSid ||
  //     firstTax.TaxGroupMasterSid ||
  //     firstTax.taxGroupMasterSid;

  //   // console.log('DEBUG - Extracted taxGroupSid:', taxGroupSid);

  //   return taxGroupSid ? Number(taxGroupSid) : null;
  // }

  /**
   * Determine tax category based on company state and place of supply
   */
  private determineTaxCategory(companyState: string, billingPartyState: string, vendorCountry: string): 'Inter' | 'Intra' {
    if (!companyState || !billingPartyState) {
      console.warn('Missing state information, defaulting to Inter');
      return 'Inter';
    }

    // Normalize country codes for comparison
    const normalizedVendorCountry = vendorCountry?.toLowerCase() || '';
    const isIndianVendor = normalizedVendorCountry === 'india' || normalizedVendorCountry === 'in';
    const isInternationalVendor = !isIndianVendor && normalizedVendorCountry !== '';

    // console.log('Tax Category - Vendor Country Analysis:', {
    //   vendorCountry,
    //   normalizedVendorCountry,
    //   isIndianVendor,
    //   isInternationalVendor
    // });

    // For international vendors (like Dubai), use 'Inter' category for VAT
    if (isInternationalVendor) {
      // console.log('International transaction - Using Inter category for vendor country:', vendorCountry);
      return 'Inter'; // Use 'Inter' for international transactions (VAT)
    }

    // For Indian vendors, check if same state or different state
    const normalizedCompanyState = companyState.trim().toLowerCase();
    const normalizedBillingState = billingPartyState.trim().toLowerCase();

    const isSameState = normalizedCompanyState === normalizedBillingState;

    // console.log('Tax Category Determination for Indian Vendor:', {
    //   companyState: normalizedCompanyState,
    //   billingPartyState: normalizedBillingState,
    //   isSameState,
    //   // CORRECT: Same state = Inter, Different state = Intra
    //   taxCategory: isSameState ? 'Inter' : 'Intra'
    // });

    // CORRECT LOGIC:
    // Same state = Inter (CGST+SGST)
    // Different state = Intra (IGST)
    return isSameState ? 'Inter' : 'Intra';
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
  // Helper methods for tax display logic
  shouldShowCGSTSGST(): boolean {
    if (this.currentUserCountry !== 'india') return false;

    const gstType = this.vendorInvoiceForm.get('GSTType')?.value;
    return gstType === 'CGST+SGST';
  }

  shouldShowIGST(): boolean {
    if (this.currentUserCountry !== 'india') return false;

    const gstType = this.vendorInvoiceForm.get('GSTType')?.value;
    return gstType === 'IGST';
  }

  shouldShowVAT(): boolean {
    return this.currentUserCountry !== 'india';
  }

  getTaxDisplayConfig(): {
    showCGST: boolean;
    showSGST: boolean;
    showIGST: boolean;
    showVAT: boolean;
  } {
    const gstType = this.vendorInvoiceForm.get('GSTType')?.value;
    const isIndia = this.currentUserCountry === 'india';

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
    return this.currentUserCountry === 'india';
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

  // Add this method to handle search type change
  onSearchTypeChange(event: any): void {
    // Reset search value when type changes
    this.searchValue = '';
    this.selectedVendorForSearch = null;
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

  // Add this method to handle vendor selection in search
  onVendorSearchSelect(vendor: any): void {
    if (vendor) {
      this.selectedVendorForSearch = vendor;
      this.searchValue = vendor.CustomerName || vendor.customerName || '';

      // Clear previous branch selection
      this.selectedVendorBranchForSearch = null;

      // Load vendor branches for selection
      this.getVendorBranchByVendor(vendor.CustomerMasterSid, (branches) => {
        // If there's only one branch, auto-select it
        if (branches.length === 1) {
          this.selectedVendorBranchForSearch = branches[0];
        }
      });
    } else {
      this.selectedVendorForSearch = null;
      this.selectedVendorBranchForSearch = null;
      this.searchValue = '';
    }
  }
  onVendorBranchSearchSelect(branch: any): void {
    this.selectedVendorBranchForSearch = branch;
  }

  getChargeCode(chargeSid: number): string {
    if(!chargeSid || !this.chargeList) return '-';
    const charge = this.chargeList.find(c => c.ChargeMasterSid === chargeSid);
    return charge?.chargeCode || '-';
  }
}
