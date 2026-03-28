import { Component, ViewChild, TemplateRef, Input, OnInit, OnDestroy, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NgbDatepickerModule, NgbDateStruct, NgbModal, NgbModalRef, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { OperationService } from '../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { catchError, firstValueFrom, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { FeatherModule } from 'angular-feather';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { SearchableDropdownModal } from 'src/app/component/searchable-dropdown/searchable-dropdown-modal.component';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BookingRateDetails, TaxCalculationService } from '../../services/tax-calculation.service';
import { CompanySettingsManagerService, CurrencySettings } from 'src/app/core/services/company-settings-manager.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { ToastrService } from 'ngx-toastr';
import { getDefaultTodayDate, toNgbDateStruct, toNumber } from 'src/app/common/helper';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { greaterThanZero } from 'src/app/core/ValidationFn/greaterThanZero.validators';
import { GetStandardChargesComponent } from '../get-standard-charges/get-standard-charges.component';
import { consistentExchangeRatesValidator } from 'src/app/core/ValidationFn/exRateConsistency.validators';
import { handleError, sortValidationErrors } from 'src/app/common/error-handling/payload-validation-handler';
import { errorLoggerWithToastr } from 'src/app/common/error-handling/form-error-handler';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';

@Component({
  selector: 'app-cost-entry',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgSelectModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    FeatherModule,
    OnlyNumbersDirective,
    DecimalPrecisionDirective,
    TextWithNumbersDirective,
    NumberFormatPipe,
    SearchableDropdown,
    SearchableDropdownModal,
    NgxSpinnerModule,
    FormsModule,
    NgbTooltipModule,
    NgbDatepickerModule
  ],
  templateUrl: './cost-entry.component.html',
  styleUrls: ['./cost-entry.component.scss'],
  providers: [
    CustomDatePipe,
    TaxCalculationService
  ]
})
export class CostEntryComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;
  selectedTab = 'Sales and cost';
  chargeList: any[] = [];
  filteredChargeList : any[] = [];
  uomList: any[] = [];
  docTypeList: any[] = [];
  vouchers:any[]=[]
  slicedCostFormArray: any[] = [];
  slicedRevenueFormArray: any[] = [];
  billingParties : any[] = [];
  parties : any[] = [];
  tariffLoading: boolean;
  tariffDetails: any[] = [];
  profitSummary: any[] = [];
  profitProratedCharges: any[] = [];
  isProfitProrateLoading = false;
  hasLoadedProfitProrate = false;
  hasResolvedProrateStatus = false;
  resolvedJobToSubjob: 'Y' | 'N' = 'N';
  isResolvingProrateStatus = false;
  resolvingProrateStatusForHouseJobSid: number | null = null;
  isFetchingProfitProratedCharges = false;
  fetchingProfitProratedChargesForHouseJobSid: number | null = null;
  pendingProrateStatusCallbacks: Array<() => void> = [];
  costDataLength: number = 0;
  page = 1;
  pageSize = 5;
  revenueDataLength: number = 0;
  page1 = 1;
  pageSize1 = 5;
  filterOption: any;
  currentCompany: any;
  currentBranch: any;
  selectedGSTType: string = 'B2B';
  placeOfSupply: string = '';
  userData : any;
  digitsAfterDecimal = 3;
  CurrencyLookupConfig = {
    displayFields : ['currencyCode', 'currencyName','countryName'],
    displayLabels : ['Code', 'Name','Country'],
    labelFields :['currencyCode'],
  };
  HSSACLookupConfig =DROPDOWN_CONFIGS.HSSAC_TAX;

  ppcc = [
    { id: 1, name: 'Prepaid' },
    { id: 2, name: 'Collect' }
  ]
  drcr = [
    { id: 1, name: 'D', value: 'D' },
    { id: 2, name: 'C', value: 'C' }
  ]

  invoiceTypes = [
    { id: 'REG', name: 'Regular' },
    { id: 'REIMB', name: 'Reimbursement' },
    { id: 'BOS', name: 'Bill of Supply' },
    { id: 'NONGST', name: 'Non GST/Zero' },
  ];

  exportGstTypes = [
    { id: 'EXPWP', name: 'Export With Payment' },
    { id: 'EXPWOP', name: 'Export Without Payment' },
  ];

  ModeofStatus = [
    { id: 'A', name: "Active" },
    { id: 'S', name: "Suspended" }
  ]
  ModeofShowType = [
    { id: 1, name: "All" },
    { id: 2, name: "Accounting" },
    { id: 3, name: "Non-Accounting" },
    { id: 4, name: "Manifest" },
    { id: 5, name: "Non-Manifest" }
  ]
  ModeofProfitShare = [
    { id: 1, name: "Yes" },
    { id: 2, name: "No" }
  ]
  ModeofNeutral = [
    { id: 1, name: "Yes" },
    { id: 2, name: "No" }
  ]
  selectTab(tab: string) {
    this.selectedTab = tab;

    if (tab === 'Profit') {
      this.loadProfitView();
    }
  }

  @Input() screenName: 'Booking' | 'Master Job' | 'House Job' | 'House Air Waybill' | 'Master Air Waybill' | 'Service Job'| 'Agent Master Air Waybill';
  private _currencyList: any[] = [];
  private _customerList: any[] = [];
  private _agentList: any[] = [];
  private _dataItems: any[] = [];

  @Input()
  set currencyList(value: any[]) {
    this._currencyList = value || [];
     if (this._currencyList.length > 0) {
      this.currencyConfigService.initializeConfigurations(this._currencyList);
      console.log(`Initialized currency configurations for ${this._currencyList.length} currencies`);
    }
  }
  get currencyList(): any[] {
    return this._currencyList;
  }

  @Input()
  set customerList(value: any[]) {
    this._customerList = value || [];
  }
  // get customerList(): any[] {
  //   return this._customerList;
  // }


  @Input()
  set agentList(value: any[]) {
    this._agentList = value || [];
  }
  // get agentList(): any[] {
  //   return this._agentList;
  // }

  private prevValue;
  @Input()
  set resetTrigger(value: boolean) {
    if (value !== this.prevValue) {
      this.prevValue = value;
      this.costDataLength = 0;
      this.revenueDataLength = 0;
      this.profitSummary = [];
      this.profitProratedCharges = [];
      this.isProfitProrateLoading = false;
      this.hasLoadedProfitProrate = false;
      this.hasResolvedProrateStatus = false;
      this.resolvedJobToSubjob = 'N';
      this.isResolvingProrateStatus = false;
      this.resolvingProrateStatusForHouseJobSid = null;
      this.isFetchingProfitProratedCharges = false;
      this.fetchingProfitProratedChargesForHouseJobSid = null;
      this.pendingProrateStatusCallbacks = [];
      this.slicedCostFormArray = [];
      this.slicedRevenueFormArray = [];
    }
  }

  @Input()
  set dataItems(value: any[]) {
    // Safety check: ensure rateForm is initialized before accessing rateFormArray
    if (!this.rateForm) {
      this._dataItems = value || [];
      return;
    }

    this.rateFormArray?.clear(); // clear existing rows first
    if (value && value.length > 0) {
      this._dataItems = value;
      console.log("Charges Changed",value);
      this.patchValues(this._dataItems);
    } else {
      this._dataItems = [];
      this.profitSummary = [];
      this.profitProratedCharges = [];
      this.isProfitProrateLoading = false;
      this.hasLoadedProfitProrate = false;
      this.hasResolvedProrateStatus = false;
      this.resolvedJobToSubjob = 'N';
      this.isResolvingProrateStatus = false;
      this.resolvingProrateStatusForHouseJobSid = null;
      this.isFetchingProfitProratedCharges = false;
      this.fetchingProfitProratedChargesForHouseJobSid = null;
      this.pendingProrateStatusCallbacks = [];
      this.slicedCostFormArray = [];
      this.slicedRevenueFormArray = [];
    }
  }
  get dataItems(): any[] {
    return this._dataItems;
  }

  parentFormValue: any = {};
  previousDepartmentName : string | null = '';
  @Input()
  set formData(value: any) {
    if (value) {
      // console.log("Parent Value Changed",value);
      const previousHouseJobSid = this.parentFormValue?.HouseJobSid ?? null;
      this.parentFormValue = value;
      if (previousHouseJobSid !== this.parentFormValue?.HouseJobSid) {
        this.resetProrateProfitState();
        this.prefetchProrateStatus();
      }
      this.setParentData(value);
      if(this.parentFormValue?.departmentName && this.previousDepartmentName !== this.parentFormValue?.departmentName){
        this.previousDepartmentName = this.parentFormValue?.departmentName;
        this.filterDepartmentBasedOnSegment(this.parentFormValue?.departmentName);
      }
    } else {
      this.parentFormValue = {};
      this.resetProrateProfitState();
    }
  }

  setParentData(value){
    this.ParentSid = this.getParentSid();
    this.isEditMode = this.ParentSid !== null;
  }



  @Output() dataEmitter = new EventEmitter<any[]>();
  @Output() validationResult = new EventEmitter<boolean>();
  @Output() reloadParent = new EventEmitter<any>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('leftTableBody') leftBody!: ElementRef;
  @ViewChild('rightTableBody') rightBody!: ElementRef;
  syncScroll(event: Event) {
    const scrollTop = (event.target as HTMLElement).scrollTop;
    this.leftBody.nativeElement.scrollTop = scrollTop;
  }
  rateForm!: FormGroup;
  currentRateIndex: number = -1;
  private routeParentSid: number | null = null;


  // Invoice related Declaration
  /**
   * This one hold the parent component's Sid (i.e.) id of Booking , MasterJob , HouseJob
   */
  ParentSid: number;
  isBooking: boolean;
  currentMenuId : number;
  countryOfCompany : string;
  isEditMode: boolean;
  availableBillingParties: any[] = [];
  selectedVoucherType: 'Invoice' | 'Vendor Invoice' | null = null;
  isProcessingVoucherType = false;
  currentVoucherTypeFilter: 'revenue' | 'cost' = 'revenue';
  @ViewChild('voucherTypeModal') voucherTypeModal!: TemplateRef<any>;
  @ViewChild('billingPartyModal') billingPartyModal!: TemplateRef<any>;
  @ViewChild('chargeSelectionModal') chargeSelectionModal!: TemplateRef<any>;
  /** It is used to store the HSSACMaster for each charge */
  chargeHSSACMapping :any[][] = [];
  voucherForm !: FormGroup;
  disableHeaderExRate : boolean;

  invoiceGenerationPayload = {
    
  }

  // Voucher generation properties
  selectedBillingPartyIndex: number = -1;
  pendingBookingRates: BookingRateDetails[] = [];
  voucherTypeModalRef?: NgbModalRef;
  billingPartyModalRef?: NgbModalRef;
  chargeSelectionModalRef?: NgbModalRef;
  

  // Charge selection properties
  availableCharges: any[] = [];
  selectedCharges: Set<number> = new Set();
  currentBillingPartySid: number | null = null;
  chargeSelectionTaxResult: any = null;


  // Invoice header properties
  invoiceHeaderType : any = 'REG';
  invoiceHeaderCurrency: any = null;
  invoiceHeaderExchangeRate: number = 1;
  selectedTaxCategory : string = 'VAT'
  billingPartyDetails: any = null;
  billingPartyBranchDetails : any = null;
  billingPartyAddress: string = '';
  billingGST_VAT: string = '';
  billingIsUnionTerritory: boolean = false;
  billingPartyCurrency: any = null;
  taxGroupList: any[] = [];
  currentCountry: Number;
  currentBranchStateName : string;
  currentBranchstate:string;
  chargeTaxGroupMap: Map<number, any[]> = new Map(); // Map of BookingRatesSid to selected tax group
  overallSummary = {
    totalTaxAmountOnFirstColumn : '',
    totalTaxAmountOnSecondColumn : '',
    totalLocalAmount : '',
    totalTaxAmount : '',
    totalLocalAmountWithTax : '',
    totalPartyAmount : '',
  }


  currentCompanyCountry : {
    CountryMasterSid: number;
    countryName: string;
    countryCode : string;
  }
  currentCompanyCurrency : CurrencySettings;
  currentCompanyCountryCode : string;
  currentBranchCity : any;
  /**
   * Calculate local amount before round off the Currency Amount
   * 
   * Yes, then Multiply "No.of Unit" with "Per Unit Rate"  before round off 99.1881 x 14.7978 =	 
   * 
   * No, then	Multiply "No.of Unit" with "Per Unit Rate" then after round off  round( 99.1881,2) x 14.7978 
   */
  formatCurrencyAmountBeforeConcludingLocal : boolean = true;

  customerLookupConfig = {
    displayFields : ['CustomerName','BranchName', 'Address'],
    displayLabels : ['Customer','Branch', 'Address'],
    labelFields :['CustomerName']
  };
  chargeDropdownConfig = {
    displayFields: ['chargeCode', 'chargeName'],
    displayLabels: ['Code', 'Name'],
    labelFields: ['chargeCode']
  };
  uomDropdownConfig = {
    displayFields: ['UOMCode', 'UOMName'],
    displayLabels: ['Code', 'Name'],
    labelFields: ['UOMCode']
  };

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private excelExportService: ExcelExportService,
    private route: ActivatedRoute,
    private currencyConfigService : CurrencyConfigurationService,
    private currencyFormatter: CurrencyFormatService,
    private spinner : NgxSpinnerService,
    public taxCalculationService: TaxCalculationService,
    private companySettings: CompanySettingsManagerService,
    private masterService: MasterService,
    private router : Router,
    private toaster: ToastrService,
    private commonModalService : ModalService,
    private datePipe : CustomDatePipe
  ) { this.initRateForm();}

  ngOnInit(): void {
  const fy = this.appSettingService.getCurrentFinancialYear();
  if (fy) {
    this.fyMinDate = toNgbDateStruct(fy.StartDate);
    const fyEnd = new Date(fy.EndDate);
    const todayForMax = getDefaultTodayDate();
    this.fyMaxDate = toNgbDateStruct(fyEnd > todayForMax ? todayForMax : fyEnd);
  }

  this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
  this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
  this.currentCompanyCountry = this.appSettingService.getCurrentCompanyCountry();
  this.currentCompanyCountryCode = String(this.currentCompanyCountry.countryCode).toLowerCase();
  this.currentBranchstate = this.appSettingService.getCurrentBranchState()?.StateMasterSid;
  this.currentBranchStateName = this.appSettingService.getCurrentBranchState()?.stateName;
  this.currentBranchCity = this.appSettingService.getCurrentBranchCity()?.CityMasterSid;
  this.currentCompanyCurrency = this.companySettings.getCurrencySettings();
  
  // Get user data first
  this.userData = this.appSettingService.getDecryptedUserProfile();
  this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
  this.countryOfCompany = (this.currentCompany?.countryMaster?.countryName || "").trim().toLowerCase();

  this.currentBranch = this.appSettingService.getCurrentBranchInfo();
  
  this.isBooking = this.screenName === "Booking";
  this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  

  // Extract BookingHeaderSid from route parameter
  this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
    if (params['id']) {
      this.routeParentSid = Number(params['id']);
      console.log('ParentSid from route:', this.routeParentSid);
    }
  });

  this.filterOption = {
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid,
  }
  
  this.loadRateLookups();

  this.rateFormArray.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
    this.validateExchangeRates();
    this.dataEmitter.emit(this.rateFormArray.getRawValue());
    this.calculateProfit();
  });

  // If dataItems was set before ngOnInit, process them now
  if (this._dataItems && this._dataItems.length > 0) {
    this.patchValues(this._dataItems);
  }

  this.prefetchProrateStatus();
}
  ngOnChanges(){
    if(!this.dataItems){
      this.addRateRow()
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

    /**
   * Validates exchange rates for both Cost and Revenue sides.
   * Sets an error directly on the conflicting ExchangeRate form controls.
   */
  validateExchangeRates() {
    const costRateMap = new Map<number, { rate: number, control: FormGroup }>();
    const revenueRateMap = new Map<number, { rate: number, control: FormGroup }>();
    const controls = this.rateFormArray.controls as FormGroup[];
 
    // 1. First, clear any previous mismatch errors from all relevant controls
    controls.forEach(group => {
      const costControl = group.get('CostExchangeRate');
      if (costControl?.hasError('exchangeRateMismatch')) {
        delete costControl.errors['exchangeRateMismatch'];
        costControl.updateValueAndValidity({ emitEvent: false });
      }
 
      const revenueControl = group.get('RevenueExchangeRate');
      if (revenueControl?.hasError('exchangeRateMismatch')) {
        delete revenueControl.errors['exchangeRateMismatch'];
        revenueControl.updateValueAndValidity({ emitEvent: false });
      }
    });
 
    // 2. Iterate to find and set new errors on conflicting controls
    controls.forEach(group => {
      // --- Validate Cost Side ---
      const costCurrencyId = group.get('CostCurrencyMasterSid')?.value;
      const costExchangeRate = group.get('CostExchangeRate')?.value;
      const costControl = group.get('CostExchangeRate');
 
      if (costCurrencyId && costExchangeRate !== null && costExchangeRate !== undefined && costControl) {
        if (costRateMap.has(costCurrencyId)) {
          const storedEntry = costRateMap.get(costCurrencyId)!;
          if (storedEntry.rate !== costExchangeRate) {
            // Mismatch found. Set error on the current control and the first one.
            costControl.setErrors({ ...costControl.errors, exchangeRateMismatch: true });
            const firstControl = storedEntry.control.get('CostExchangeRate');
            firstControl?.setErrors({ ...firstControl.errors, exchangeRateMismatch: true });
          }
        } else {
          costRateMap.set(costCurrencyId, { rate: costExchangeRate, control: group });
        }
      }
 
      // --- Validate Revenue Side ---
      const revenueCurrencyId = group.get('RevenueCurrencyMasterSid')?.value;
      const revenueExchangeRate = group.get('RevenueExchangeRate')?.value;
      const revenueControl = group.get('RevenueExchangeRate');
 
      if (revenueCurrencyId && revenueExchangeRate !== null && revenueExchangeRate !== undefined && revenueControl) {
        if (revenueRateMap.has(revenueCurrencyId)) {
          const storedEntry = revenueRateMap.get(revenueCurrencyId)!;
          if (storedEntry.rate !== revenueExchangeRate) {
            // Mismatch found. Set error on the current control and the first one.
            revenueControl.setErrors({ ...revenueControl.errors, exchangeRateMismatch: true });
            const firstControl = storedEntry.control.get('RevenueExchangeRate');
            firstControl?.setErrors({ ...firstControl.errors, exchangeRateMismatch: true });
          }
        } else {
          revenueRateMap.set(revenueCurrencyId, { rate: revenueExchangeRate, control: group });
        }
      }
    });
 
  }

  loadRateLookups() {
    forkJoin({
      allMasters: this.operationService.getAllBookingRateLookups(this.filterOption).pipe(catchError(err => of({ charges: [], uoms: [], docTypes: [] }))),
      charges: this.operationService.getAllCharges(this.currentCompany?.CompanyMasterSid).pipe(catchError(err => of([]))),
      revenueParties : this.operationService.getAllDebtorWithCOAMapped({CompanyMasterSid: this.currentCompany?.CompanyMasterSid}).pipe(catchError(err => of([]))),
      costParties : this.operationService.getAllCreditorWithCOAMapped({CompanyMasterSid: this.currentCompany?.CompanyMasterSid}).pipe(catchError(err => of([]))),
      // state :this.operationService.getStateById(this.currentBranch?.StateMasterSid).pipe(catchError(err => of([]))),
    }).subscribe(({ allMasters , charges , revenueParties, costParties }) => {
      this.chargeList = charges;
      this.filterDepartmentBasedOnSegment(this.parentFormValue?.departmentName);
      this.uomList = allMasters.uoms;
      this.docTypeList = allMasters.docTypes;
      // this.currentBranchStateName = state?.stateName || "";
      this.vouchers= allMasters.Vouchers;
      this.billingParties = revenueParties.data;
      this.parties = costParties.data;
    })
  }


  initRateForm() {
    this.rateForm = this.fb.group({
      /** This one hold the parent component's Sid (i.e.) id of Booking , MasterJob , HouseJob */
      ParentSid: [null],
      /** This one holds BookingRateSid or CostRevenueChargesSid */
      RateSid : [null],
      SerialNumber: [{ value: '', disabled: true }],
      ChargeMasterSid: [null,[Validators.required]],
      ChargeDescription: [''],
      NumberOfUnit:['',[Validators.required]],
      // Cost 
      CostCurrencyMasterSid: [null],
      CostPrepaidCollect: [''],
      CostExchangeRate: [''],
      CostDrCr: [''],
      CostAmount: [''],
      CostLocalAmount: [''],
      CostChargeUomSid:['',[Validators.required]],
      CostVoucherHeaderSid: [''],
      CostVoucherTypeSid: [null],
      CostNumberOfUnit:[null],
      

      RevenuePrepaidCollect:[''],
      RevenueCurrencyMasterSid: [null],
      RevenueExchangeRate: [''],
      CustomerMasterSid: [''],
      RevenueNumberOfUnit:[null],
      RevenueChargeUomSid:['',[Validators.required]],
      RevenueDrCr: [''],
      RevenueAmount: [''],
      RevenueLocalAmount: [''],
      RevenueVoucherHeaderSid: [''],
      RevenueVoucherTypeSid: [null],
      AgentSid: [''],
      CustomerBranchSid: [null],
      rateFormArray: this.fb.array([])
    });

  }

  hasRequired(controlName:string){
    const requiredFields = ['ChargeMasterSid','ChargeDescription','ChargeUomSid','NoOfUnit'];
    return requiredFields.includes(controlName);
  }

  validateRateArray(): boolean {
    const errorMessages: string[] = [];
    
    this.rateFormArray.markAllAsTouched();
    this.rateFormArray.updateValueAndValidity();

    if (!this.rateFormArray || this.rateFormArray.length === 0) {
      this.validationResult.emit(true);
      return true;
    }


    const requiredFieldMap = [
      { key: 'ChargeMasterSid', label: 'Charge' },
      { key: 'ChargeDescription', label: 'Charge Description' },
      { key: 'ChargeUomSid', label: 'Unit' },
      { key: 'NoOfUnit', label: 'No of Units' }
    ];

    for (let rateIndex = 0; rateIndex < this.rateFormArray.length; rateIndex++) {
      const rate = this.rateFormArray.at(rateIndex) as FormGroup;

      // Required field validation
      for (const field of requiredFieldMap) {
        const control = rate.get(field.key);
        const value = control?.value;

        if (value === null || value === undefined || value === '') {
          errorMessages.push(
            `[SNo: ${rateIndex + 1}] ${field.label} is required.`
          );
        }
      }

      //  Revenue / Cost side validation
      const hasLocalAmountAtLeastOneSide =
        !!Number(rate.get('CostLocalAmount')?.value) ||
        !!Number(rate.get('RevenueLocalAmount')?.value);

      if (!hasLocalAmountAtLeastOneSide) {
        errorMessages.push(
          `[SNo: ${rateIndex + 1}] Please fill at least one side: Revenue or Cost.`
        );
      }
    }

    //  Show all errors together
    if (errorMessages.length > 0) {
      this.appSettingService.showWarning(errorMessages.join('\n'));
      this.validationResult.emit(false);
      return false;
    }

    // All good
    this.validationResult.emit(true);
    return true;
  }



  // Getter
get rateFormArray(): FormArray {
  return this.rateForm.get('rateFormArray') as FormArray || null;
}

// This allows you to access controls easily in the template
get r() {
  return this.rateForm.controls;
}


  patchValues(items: any[]) {
    console.log(items, 'patchValues')
    if (items && items.length > 0) {
      for (const item of items) {
        this.addRateRow(item);
      }
    } else {
      this.addRateRow(); // <-- Add one empty row when no data
    }
    this.calculateProfit();
  }
createRateFormGroup(data?: any): FormGroup {
  console.log(data,'createRateFormGroup')
  console.log(this.docTypeList,'this.docTypeList',this.vouchers,'vouchers')

  // Ensure ParentSid is available - try from data, then helper method
  const ParentSid = data?.ParentSid ?? this.getParentSid();
  const isFromQuotation = !!data?.QuoteChargeSid
    || ((this.screenName === 'House Job' || this.screenName === 'House Air Waybill') && !!data?.BookingRateSid);

  const form = this.fb.group({
    /** This one holds BookingRateSid or CostRevenueChargesSid */
    RateSid: [data?.RateSid ?? null],
    /** This one hold the parent component's Sid (i.e.) id of Booking , MasterJob , HouseJob */
    ParentSid: [ParentSid],
    MenuMasterSid : [this.currentMenuId],
    ShipmentNo : [data?.ShipmentNo ?? ''],
    MasterJobNo : [data?.MasterJobNo ?? ''],
    CompanyMasterSid: [data?.CompanyMasterSid ?? null],
    BranchMasterSid: [data?.BranchMasterSid ?? null],
    
    SerialNumber: [data?.SerialNumber ?? ''],
    ChargeMasterSid: [
      { value: data?.ChargeMasterSid ?? null, disabled: isFromQuotation }
    ],
    ChargeDescription: [
      { value: data?.ChargeDescription ?? null, disabled: isFromQuotation }
    ],

    ChargeUomSid: [
      { value: (data?.ChargeUomSid || data?.RevenueChargeUomSid || data?.CostChargeUomSid) ?? null, disabled: isFromQuotation },
      [Validators.required]
    ],
    RevenueChargeUomSid: [
      { value: (data?.RevenueChargeUomSid || data?.ChargeUomSid) ?? null, disabled: isFromQuotation },
      [Validators.required]
    ],
    CostChargeUomSid: [(data?.CostChargeUomSid || data?.ChargeUomSid) ?? null , [Validators.required]],

    NoOfUnit: [
      { value: (data?.NoOfUnit || data?.RevenueNumberOfUnit || data?.CostNumberOfUnit) ?? '', disabled: isFromQuotation },
      [ Validators.required , greaterThanZero()]
    ],
    RevenueNumberOfUnit: [
      { value: (data?.RevenueNumberOfUnit || data?.NoOfUnit) ?? '', disabled: isFromQuotation }
    ],
    CostNumberOfUnit: [(data?.CostNumberOfUnit || data?.NoOfUnit) ?? ''],
    
    // Revenue Fields (disabled if from quotation)
    RevenueCurrencyMasterSid: [
      { value: data?.RevenueCurrencyMasterSid ?? null, disabled: isFromQuotation }
    ],
    RevenueExchangeRate: [
      { value: data?.RevenueExchangeRate != null ? Number(data.RevenueExchangeRate) : '', disabled: isFromQuotation }
    ],
    RevenueRate: [
      { value: data?.RevenueRate != null ? Number(data.RevenueRate) : '', disabled: isFromQuotation }
    ],
    RevenueAmount: [
      { value: data?.RevenueAmount != null ? Number(data.RevenueAmount) : '', disabled: isFromQuotation }
    ],
    RevenueLocalAmount: [
      { value: data?.RevenueLocalAmount != null ? Number(data.RevenueLocalAmount) : '', disabled: isFromQuotation }
    ],
    RevenueDrCr: [
      { value: data?.RevenueDrCr ?? 'C', disabled: isFromQuotation }
    ],
    RevenueCustomerMasterSid: [
      { value: data?.RevenueCustomerMasterSid ?? null, disabled: isFromQuotation }
    ],
    RevenueCustomerBranchSid: [
      { value: data?.RevenueCustomerBranchSid ?? null, disabled: isFromQuotation }
    ],
    RevenuePrepaidCollect: [
      { value: data?.RevenuePrepaidCollect ?? "Prepaid", disabled: isFromQuotation }
    ],
    RevenueVoucherHeaderSid: [data?.RevenueVoucherHeaderSid ?? null],
    RevenueVoucherTypeSid: [data?.RevenueVoucherTypeMasterSid ?? null],
    RevenueVoucherHeader: [data?.revenueVoucherHeader || data?.RevenueVoucherHeader || null],  // Store voucher header object for display
    RevenueVoucherType: [data?.revenueVoucherTypeMaster || data?.RevenueVoucherType || null],  // Store voucher type object for display


    // Cost Related Fields
    CostCurrencyMasterSid: [data?.CostCurrencyMasterSid ?? null],
    CostExchangeRate: [data?.CostExchangeRate != null ? Number(data.CostExchangeRate) : ''],
    CostRate: [data?.CostRate != null ? Number(data.CostRate) : ''],
    CostAmount: [data?.CostAmount != null ? Number(data.CostAmount) : ''],
    CostLocalAmount: [data?.CostLocalAmount != null ? Number(data.CostLocalAmount).toFixed(this.digitsAfterDecimal) : ''],
    CostDrCr: [data?.CostDrCr ?? 'D'],
    CostAgentMasterSid: [data?.CostAgentMasterSid ?? null],
    CostAgentBranchSid: [data?.CostAgentBranchSid ?? null],
    CostPrepaidCollect: [data?.CostPrepaidCollect ?? "Prepaid"],
    CostVoucherHeaderSid: [data?.CostVoucherHeaderSid ?? null],
    CostVoucherTypeSid: [data?.CostVoucherTypeMasterSid ?? null],
    CostVoucherHeader: [data?.costVoucherHeader || data?.CostVoucherHeader || null],  // Store voucher header object for display
    CostVoucherType: [data?.costVoucherTypeMaster || data?.CostVoucherType || null],  // Store voucher type object for display
    
    
    status : ['Active'],
    Remarks : [data?.Remarks ?? ''],
    
    // Below are some helping fields
    QuoteChargeSid : [data?.QuoteChargeSid ?? null],
    TariffDetailSid : [data?.TariffDetailSid ?? null],
    BookingRateSid : [data?.BookingRateSid ?? data?.RateSid ?? null],
    unitQtyBasis: [data?.UnitQty || null],  // Store unit quantity basis for taking no of unit from parent
    _costVoucherHeaderSid: [data?.CostVoucherHeaderSid ?? null], // Store actual IDs separately for validation
    _revenueVoucherHeaderSid: [data?.RevenueVoucherHeaderSid ?? null] ,// Store actual IDs separately for validation
    isFromQuotation: [isFromQuotation]
  });
  form.get('NoOfUnit')?.valueChanges.subscribe((value) => {
    form.get('RevenueNumberOfUnit')?.setValue(value);
    form.get('CostNumberOfUnit')?.setValue(value);
  });
  form.get('ChargeUomSid')?.valueChanges.subscribe((value) => {
    form.get('RevenueChargeUomSid')?.setValue(value);
    form.get('CostChargeUomSid')?.setValue(value);
  });
   const revenueCurrency = data?.RevenueCurrencyMasterSid;
  const costCurrency = data?.CostCurrencyMasterSid;
  const companyCurrencySid = this.currentCompany?.CurrencyMasterSid;

  // Check Revenue side
  if (revenueCurrency && revenueCurrency === companyCurrencySid) {
    form.get('RevenueExchangeRate')?.setValue(this.getFormattedExchangeRate(1, revenueCurrency));
    form.get('RevenueExchangeRate')?.disable();
  }

  // Check Cost side
  if (costCurrency && costCurrency === companyCurrencySid) {
    form.get('CostExchangeRate')?.setValue(this.getFormattedExchangeRate(1, costCurrency));
    form.get('CostExchangeRate')?.disable();
  }
  // if(data?.RevenueVoucherHeaderSid || data?.CostVoucherHeaderSid){
  //   form.disable();
  // }
  const commonFields = [
    'ChargeMasterSid',
    'ChargeDescription',
    'ChargeUomSid',
    'NoOfUnit'
  ];
  const revenueFields = [ 
    'RevenueCurrencyMasterSid',
    'RevenueExchangeRate',
    'RevenueRate',
    'RevenueAmount',
    'RevenueLocalAmount',
    'RevenueDrCr',
    'RevenueCustomerMasterSid',
    'RevenueCustomerBranchSid',
    'RevenuePrepaidCollect',
    'RevenueVoucherHeaderSid',
    'RevenueVoucherTypeSid',
    'RevenueVoucherHeader',  
    'RevenueVoucherType', 
   ];
  const costFields = [
    'CostCurrencyMasterSid',
    'CostExchangeRate',
    'CostRate',
    'CostAmount',
    'CostLocalAmount',
    'CostDrCr',
    'CostAgentMasterSid',
    'CostAgentBranchSid',
    'CostPrepaidCollect',
    'CostVoucherHeaderSid',
    'CostVoucherTypeSid',
    'CostVoucherHeader',  
    'CostVoucherType',
  ];
  if(data?.RevenueVoucherHeaderSid){
    revenueFields.forEach(field => {
      form.get(field)?.disable();
    })
  }
  if(data?.CostVoucherHeaderSid){
    costFields.forEach(field => {
      form.get(field)?.disable();
    })
  }
  if(data?.RevenueVoucherHeaderSid || data?.CostVoucherHeaderSid){
    commonFields.forEach(field => {
      form.get(field)?.disable();
    })
  }

  return form

}


  /**
   * Get BookingHeaderSid from parent form, existing rates, or route parameter
   */
  getParentSid(): number | null {
    // First try to get from parent form
    if (this.parentFormValue?.ParentSid) {
      return this.parentFormValue.ParentSid;
    }

    // If not in parent form, try to get from existing rates
    if (this.rateForm && this.rateFormArray?.length > 0) {
      const firstRate = this.rateFormArray?.at(0).getRawValue();
      if (firstRate.ParentSid) {
        return firstRate.ParentSid;
      }
    }

    // Third fallback - try to get from route parameter
    if (this.routeParentSid) {
      return this.routeParentSid;
    }

    return null;
  }

  addRateRow(data?:any){
    // When adding a new row without data, populate it with parent form values immediately
    if (!data && this.parentFormValue) {
      const ParentSid = this.getParentSid();
      data = {
        ParentSid: ParentSid,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid || null,
        BranchMasterSid: this.currentBranch?.BranchMasterSid || null,
        RevenueCustomerMasterSid: this.parentFormValue.CustomerMasterSid || null,
        RevenueCustomerBranchSid: this.parentFormValue.CustomerBranchSid || null
      };
    }

    const formGroup = this.createRateFormGroup(data);
    this.rateFormArray.push(formGroup);
  }



  deleteRate(index: number, RatesSid?: number) {
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
    // Check if voucher exists
    // Check the hidden ID fields for voucher existence
    if (formGroup.get('_costVoucherHeaderSid')?.value || formGroup.get('_revenueVoucherHeaderSid')?.value) {
      this.appSettingService.showWarning('Cannot delete rate. Voucher already generated for this rate.');
      return;
    }

    if (RatesSid) {
      const api = this.isBooking ?
      this.operationService.deleteBookingRate(RatesSid,updatedBy) :
      this.operationService.deleteCostRevenueCharge(RatesSid);
      api.subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.rateFormArray.removeAt(index);
            this.appSettingService.showSuccess("Rate Deleted Successfully");
          } else {
            this.appSettingService.showError(resp.message || 'Error deleting rate');
          }
        },
        error: (error) => {
          this.appSettingService.showError(error?.error?.message || 'Error deleting rate');
        }
      })
    } else {
      this.rateFormArray.removeAt(index);
      this.appSettingService.showSuccess("Rate Deleted Successfully");
    }
  }

  /**
   * Check if rate can be edited (no voucher generated)
   */
  canEditRate(index: number): boolean {
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    // Check the hidden ID fields instead of display fields
    return !formGroup.get('_costVoucherHeaderSid')?.value && !formGroup.get('_revenueVoucherHeaderSid')?.value;
  }


  /**
   * Handle charge change for a specific row
   */
  onChargeChangeForRow(charge: any, index: number) {
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    console.log(charge);
    if (!charge) {
      formGroup.patchValue({
        ChargeMasterSid: null,
        ChargeDescription: '',
        unitQtyBasis: null,
        RevenueCurrencyMasterSid: null,
        CostCurrencyMasterSid: null,
        ChargeUomSid : null,
        RevenueChargeUomSid : null,
        CostChargeUomSid : null,
      });
      return;
    }

    const selectedUnit = this.uomList.find(uom => uom.UOMMasterSid === charge.UOM);

    formGroup.patchValue({
      ChargeMasterSid: charge.ChargeMasterSid,
      ChargeDescription: charge.chargeName,
      unitQtyBasis: charge.UnitQty,
      RevenueCurrencyMasterSid: charge.CurrencyMasterSid,
      CostCurrencyMasterSid: charge.CurrencyMasterSid,
      ChargeUomSid: selectedUnit ? selectedUnit.UOMMasterSid : null,
      RevenueChargeUomSid: selectedUnit ? selectedUnit.UOMMasterSid : null,
      CostChargeUomSid: selectedUnit ? selectedUnit.UOMMasterSid : null,
    });

    this.updateSingleChargeQty(index);
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === charge.CurrencyMasterSid);
    if (currency) {
      this.getRevenueExchangeRate(index, currency);
      this.getCostExchangeRate(index, currency);
    }
  }

  private updateAllChargeQuantitiesForRoute(): void {
    const parentData = this.parentFormValue;
    if (!parentData) return;

    this.rateFormArray.controls.forEach((rate:FormGroup, rateIndex) => {
      this.updateSingleChargeQty(rateIndex)
    });

  }
  
  updateSingleChargeQty(rateIndex:number): void {
      const rateGroup = this.rateFormArray.at(rateIndex) as FormGroup;
  
      const unitQtyBasis = rateGroup.get('unitQtyBasis')?.value;
      if (!unitQtyBasis) {
        return; 
      }
  
      const qtySourceField = this.findFieldForQty(unitQtyBasis);
      let newQty = 1;
      
      if (typeof qtySourceField === 'string' && this.parentFormValue[qtySourceField]) {
        newQty = this.parentFormValue[qtySourceField] || 1;
      } else if (typeof qtySourceField === 'number') {
        newQty = qtySourceField;
      }
      console.log(this.parentFormValue);
      console.log(newQty);
  
      rateGroup.get('NoOfUnit')?.setValue(newQty);
      this.calculateRevenueLocalAmount(rateIndex);
      this.calculateCostLocalAmount(rateIndex);
    }

  /**
   * Calculate cost amount when per unit or number of units changes
   */
  calculateCostAmount(index: number) {
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    const noOfUnit = formGroup.get('NoOfUnit')?.value || 0;
    const perUnit = formGroup.get('CostRate')?.value || 0;
    const amount = Number(noOfUnit) * Number(perUnit);

    const CurrencyMasterSid = formGroup.get('CostCurrencyMasterSid')?.value;
    const formattedAmount = this.getFormattedAmount(amount, CurrencyMasterSid);

    let finalAmount;
    if (this.formatCurrencyAmountBeforeConcludingLocal) {
      finalAmount = Number(formattedAmount);
    } else {
      finalAmount = Number(amount);
    }

    formGroup.patchValue({
      CostAmount: this.getFormattedAmount(finalAmount, CurrencyMasterSid)
    });

    this.calculateCostLocalAmount(index);
  }

  /**
   * Calculate cost local amount when amount or exchange rate changes
   */
  calculateCostLocalAmount(index: number) {
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    const noOfUnit = formGroup.get('NoOfUnit')?.value || 0;
    const perUnit = formGroup.get('CostRate')?.value || 0;
    const amount = Number(noOfUnit) * Number(perUnit);

    const CurrencyMasterSid = formGroup.get('CostCurrencyMasterSid')?.value;
    const exchangeRate = formGroup.get('CostExchangeRate')?.getRawValue() || 1;

    const formattedExchangeRate = this.getFormattedExchangeRate(exchangeRate, CurrencyMasterSid);
    const formattedAmount = this.getFormattedAmount(amount, CurrencyMasterSid);
    
    let localAmount;
    if (this.formatCurrencyAmountBeforeConcludingLocal) {
      localAmount = Number(formattedAmount) * Number(formattedExchangeRate);
    } else {
      localAmount = Number(amount) * Number(formattedExchangeRate);
    }
    formGroup.patchValue({
      CostLocalAmount: this.getFormattedAmount(localAmount, CurrencyMasterSid)
    });
  }

  /**
   * Calculate revenue amount when per unit or number of units changes
   */
  calculateRevenueAmount(index: number) {
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    const noOfUnit = formGroup.get('NoOfUnit')?.value || 0;
    const perUnit = formGroup.get('RevenueRate')?.value || 0;
    const amount = Number(noOfUnit) * Number(perUnit);

    const CurrencyMasterSid = formGroup.get('RevenueCurrencyMasterSid')?.value;
    const formattedAmount = this.getFormattedAmount(amount, CurrencyMasterSid);

    let finalAmount;
    if (this.formatCurrencyAmountBeforeConcludingLocal) {
      finalAmount = Number(formattedAmount);
    } else {
      finalAmount = Number(amount);
    }

    formGroup.patchValue({
      RevenueAmount: this.getFormattedAmount(finalAmount, formGroup.get('RevenueCurrencyMasterSid')?.value)
    });
    this.calculateRevenueLocalAmount(index);
  }

  /**
   * Calculate revenue local amount when amount or exchange rate changes
   */
  calculateRevenueLocalAmount(index: number) {
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    const noOfUnit = formGroup.get('NoOfUnit')?.value || 0;
    const perUnit = formGroup.get('RevenueRate')?.value || 0;
    const amount = Number(noOfUnit) * Number(perUnit);

    const CurrencyMasterSid = formGroup.get('RevenueCurrencyMasterSid')?.value;
    const exchangeRate = formGroup.get('RevenueExchangeRate')?.getRawValue() || 1;

    const formattedExchangeRate = this.getFormattedExchangeRate(exchangeRate, CurrencyMasterSid);
    const formattedAmount = this.getFormattedAmount(amount, CurrencyMasterSid);
    let localAmount;
    if(this.formatCurrencyAmountBeforeConcludingLocal){
      localAmount = Number(formattedAmount) * Number(formattedExchangeRate);
    } else {
      localAmount = Number(amount) * Number(formattedExchangeRate);
    }
    formGroup.patchValue({
      RevenueLocalAmount: this.getFormattedAmount(localAmount, CurrencyMasterSid)
    });
  }

  /**
   * Get exchange rate for cost currency
   */
  getCostExchangeRate(index: number, currency: any) {
    if (!currency) return;
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    const toCurrency = Number(this.currentCompany?.CurrencyMasterSid);
    const fromCurrencyCode = currency?.currencyCode;
    const toCurrencyCode = this.currencyList.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode;

    if (!fromCurrencyCode || !toCurrencyCode) return;
    const currentCostCurrency = formGroup.get('CostCurrencyMasterSid')?.value;
  const isSameCurrency = currentCostCurrency && currentCostCurrency === toCurrency;

    if (fromCurrencyCode === toCurrencyCode|| isSameCurrency) {
      const formGroup = this.rateFormArray.at(index) as FormGroup;
      formGroup.patchValue({ CostExchangeRate: this.getFormattedExchangeRate(1, currentCostCurrency || toCurrency), });
      formGroup.get('CostExchangeRate')?.disable();
      this.calculateCostLocalAmount(index);
      return;
    }
   formGroup.get('CostExchangeRate')?.enable();
    const payload = { 
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode, 
      toCurrencyCode ,
      EffectiveFrom : this.isEditMode ? this.parentFormValue?.BookingDateTime : new Date(),
      segment: 'cost',
    };
    this.operationService.getExchangeRate(payload).subscribe(
      (resp: any) => {
        if (resp.status && resp.data) {
          const formGroup = this.rateFormArray.at(index) as FormGroup;
          formGroup.get('CostExchangeRate')?.enable();
          formGroup.patchValue({ CostExchangeRate: this.getFormattedExchangeRate(Number(resp.data), currentCostCurrency || toCurrency), });
          this.calculateCostLocalAmount(index);
        }
      }
    );
  }

  /**
   * Get exchange rate for revenue currency
   */
  getRevenueExchangeRate(index: number, currency: any) {
    if (!currency) return;
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    const toCurrency = Number(this.currentCompany?.CurrencyMasterSid);
    const fromCurrencyCode = currency?.currencyCode;
    const toCurrencyCode = this.currencyList.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode;
    if (!fromCurrencyCode || !toCurrencyCode) return;
    const currentRevenueCurrency = formGroup.get('RevenueCurrencyMasterSid')?.value;
  const isSameCurrency = currentRevenueCurrency && currentRevenueCurrency === toCurrency;
    if (fromCurrencyCode === toCurrencyCode  || isSameCurrency) {
      const formGroup = this.rateFormArray.at(index) as FormGroup;
      formGroup.patchValue({ 
        RevenueExchangeRate:  this.getFormattedExchangeRate(1, currentRevenueCurrency || toCurrency),
      });
      formGroup.get('RevenueExchangeRate')?.disable();
      this.calculateRevenueLocalAmount(index);
      return;
    }
    formGroup.get('RevenueExchangeRate')?.enable();

    const payload = { 
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode, 
      toCurrencyCode , 
      EffectiveFrom : this.isEditMode ? new Date(this.parentFormValue?.BookingDateTime) : new Date(),
      segment : 'revenue',
    };
    this.operationService.getExchangeRate(payload).subscribe(
      (resp: any) => {
        if (resp.status && resp.data) {
          const formGroup = this.rateFormArray.at(index) as FormGroup;
          formGroup.get('RevenueExchangeRate')?.enable();
          formGroup.patchValue({ RevenueExchangeRate: this.getFormattedExchangeRate(Number(resp.data), currentRevenueCurrency || toCurrency), });
          this.calculateRevenueLocalAmount(index);
        }
      }
    );
  }


  // getExchangeRate() {
  //   const fromCurrency = Number(this.rateForm.get('CurrencyMasterSid')?.value);
  //   const toCurrency = Number(this.currentCompany?.CurrencyMasterSid);
  //   const fromCurrencyCode = (this.currencyList.find(curr => curr.CurrencyMasterSid === fromCurrency)?.currencyCode);
  //   const toCurrencyCode = (this.currencyList.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode);
  //   if (!fromCurrencyCode || !toCurrencyCode) {
  //     return;
  //   }
  //   if (fromCurrencyCode === toCurrencyCode) {
  //     this.rateForm.get('RevenueExchangeRate')?.setValue(1);
  //     this.rateForm.get('CostExchangeRate')?.setValue(1);
  //     this.calculateLocalAmount();
  //     return;
  //   }
  //   const payload = {
  //     fromCurrencyCode,
  //     toCurrencyCode
  //   }
  //   this.operationService.getExchangeRate(payload).subscribe(
  //     (resp: any) => {
  //       if (resp.status) {
  //         this.rateForm.get('CostExchangeRate')?.setValue(
  //           resp.data ? 
  //           this.getFormattedExchangeRate(resp.data,fromCurrency)
  //           : '');
  //         this.rateForm.get('RevenueExchangeRate')?.setValue(resp.data ? 
  //           this.getFormattedExchangeRate(resp.data,fromCurrency)
  //           : '');

  //         this.calculateLocalAmount();
  //       } else {
  //         this.appSettingService.showWarning('Error fetching exchange rate');
  //       }
  //     }
  //   )
  // }

  // calculateLocalAmount() {
  //   const CostnoOfUnit = this.rateForm.get('NoOfUnit')?.value;
  //   const RevenuenoOfUnit = this.rateForm.get('NoOfUnit')?.value;


  //   const Costrate = this.rateForm.get('CostRate')?.value;
  //   const Revenuerate = this.rateForm.get('RevenueRate')?.value;

  //   const excostrate = this.rateForm.get('CostExchangeRate')?.value;
  //   const exrevenuerate = this.rateForm.get('RevenueExchangeRate')?.value;

  //   const Costctrl = this.rateForm.get('CostLocalAmount');
  //   const Revenuectrl = this.rateForm.get('RevenueLocalAmount');

  //   if (!CostnoOfUnit || !Costrate || !excostrate) {
  //     Costctrl.setValue('');
  //     return;
  //   }

  //   if (!RevenuenoOfUnit || !Revenuerate || !exrevenuerate) {
  //     Revenuectrl.setValue('');
  //     return;
  //   }
  //   const LocalCostAmount = (Number(CostnoOfUnit) * Number(Costrate) * Number(excostrate)).toFixed(3);
  //   const LocalRevenueAmount = (Number(RevenuenoOfUnit) * Number(Revenuerate) * Number(exrevenuerate)).toFixed(3);

  //   Costctrl.setValue(LocalCostAmount);
  //   Revenuectrl.setValue(LocalRevenueAmount);

  //   Costctrl.updateValueAndValidity();
  //   Revenuectrl.updateValueAndValidity();
  // }


  // calculateAmount() {
  //   const CostnoOfUnit = this.rateForm.get('NoOfUnit')?.value;
  //   const RevenuenoOfUnit = this.rateForm.get('NoOfUnit')?.value;
  //   const Costrate = this.rateForm.get('CostRate')?.value;
  //   const Revenuerate = this.rateForm.get('RevenueRate')?.value;

  //   const Costctrl = this.rateForm.get('CostAmount');
  //   const Revenuectrl = this.rateForm.get('RevenueAmount');

  //   if (!CostnoOfUnit || !Costrate) {
  //     Costctrl.setValue('');
  //     return;
  //   }

  //   if (!RevenuenoOfUnit || !Revenuerate) {
  //     Revenuectrl.setValue('');
  //     return;
  //   }

  //   const Costamount = (Number(CostnoOfUnit) * Number(Revenuerate)).toFixed(3);
  //   const Revenueamount = (Number(RevenuenoOfUnit) * Number(Revenuerate)).toFixed(3);
  //   Costctrl.setValue(Costamount);
  //   Revenuectrl.setValue(Revenueamount);

  //   Costctrl.updateValueAndValidity();
  //   Revenuectrl.updateValueAndValidity();

  // }




  calculateProfit() {
    const rateFormValue = (this.rateFormArray.getRawValue() || []).map((row: any) => ({
      ...row,
      ProfitSourceType: 'House'
    }));
    const data = this.shouldUseProratedProfitRows()
      ? [...rateFormValue, ...this.mapProratedChargesForProfit()]
      : [...rateFormValue];

    this.calculateProfitFromRows(data);
  }

  private calculateProfitFromRows(data: any[]) {
    this.profitSummary = [];

    data.forEach(item => {
      console.log(item);
      const costAmt = parseFloat(item.CostLocalAmount || 0);
      const revenueAmt = parseFloat(item.RevenueLocalAmount || 0);
      const chargeName = item.ChargeName || this.getChargeName(item.ChargeMasterSid) || "Unknown";
      const sourceType = item.ProfitSourceType || 'House';

      let existing = this.profitSummary.find(
        p => p.chargeName === chargeName && p.sourceType === sourceType
      );

      if (!existing) {
        existing = {
          chargeName,
          sourceType,
          totalSales: 0,
          totalCost: 0,
          profit: 0,
          profitPercent: "0%"
        };
        this.profitSummary.push(existing);
      }

      // if (item.CostRevenue === "Cost") {
        existing.totalCost += item.CostDrCr === "D" ? costAmt : -costAmt;
      // }

      // if (item.CostRevenue === "Revenue") {
        existing.totalSales += item.RevenueDrCr === "C" ? revenueAmt : -revenueAmt;
      // }
    });

    this.profitSummary.forEach(p => {
      let profit: number;
      let profitPercent: number;

      if (p.totalSales > p.totalCost) {
        profit = p.totalSales - p.totalCost;
        profitPercent = p.totalSales !== 0 ? (profit / p.totalSales) * 100 : 0;
      } else {
        profit = -(p.totalCost - p.totalSales);
        profitPercent = p.totalCost !== 0 ? (profit / p.totalCost) * 100 : 0;
      }

      p.profit = profit.toFixed(this.digitsAfterDecimal);
      p.profitPercent = profitPercent.toFixed(this.digitsAfterDecimal) + "%";
      p.totalSales = p.totalSales.toFixed(this.digitsAfterDecimal);
      p.totalCost = p.totalCost.toFixed(this.digitsAfterDecimal);
    });

    console.log(this.profitSummary);
  }

  private loadProfitView() {
    if (!this.isHouseScopedProrateScreen()) {
      this.isProfitProrateLoading = false;
      this.calculateProfit();
      return;
    }

    const proratePayload = this.getHouseProratePayload();
    if (!proratePayload) {
      this.isProfitProrateLoading = false;
      this.calculateProfit();
      return;
    }

    const { HouseJobSid: houseJobSid } = proratePayload;

    if (!this.hasResolvedProrateStatus) {
      this.isProfitProrateLoading = true;
      this.ensureProrateStatusResolved(() => this.loadProfitView());
      return;
    }

    if (!this.shouldFetchProratedProfitRows()) {
      this.isProfitProrateLoading = false;
      this.calculateProfit();
      return;
    }

    if (this.hasLoadedProfitProrate) {
      this.isProfitProrateLoading = false;
      this.calculateProfit();
      return;
    }

    if (this.isFetchingProfitProratedCharges
      && this.fetchingProfitProratedChargesForHouseJobSid === houseJobSid) {
      this.isProfitProrateLoading = true;
      return;
    }

    this.isProfitProrateLoading = true;
    this.isFetchingProfitProratedCharges = true;
    this.fetchingProfitProratedChargesForHouseJobSid = houseJobSid;

    this.operationService.getHouseProratedCharges(proratePayload).subscribe({
      next: (resp: any) => {
        if (this.getProfitHouseJobSid() !== houseJobSid) {
          return;
        }

        this.profitProratedCharges = resp?.data?.proratedCharges || [];
        this.hasLoadedProfitProrate = true;
        this.isProfitProrateLoading = false;
        this.calculateProfit();
      },
      error: () => {
        if (this.getProfitHouseJobSid() !== houseJobSid) {
          return;
        }

        this.isProfitProrateLoading = false;
        this.calculateProfit();
      },
      complete: () => {
        if (this.fetchingProfitProratedChargesForHouseJobSid === houseJobSid) {
          this.isFetchingProfitProratedCharges = false;
          this.fetchingProfitProratedChargesForHouseJobSid = null;
        }
      }
    });
  }

  private ensureProrateStatusResolved(onResolved?: () => void) {
    if (!this.isHouseScopedProrateScreen()) {
      onResolved?.();
      return;
    }

    if (this.hasResolvedProrateStatus) {
      onResolved?.();
      return;
    }

    const proratePayload = this.getHouseProratePayload();
    if (!proratePayload) {
      this.hasResolvedProrateStatus = true;
      this.resolvedJobToSubjob = 'N';
      onResolved?.();
      return;
    }

    const { HouseJobSid: houseJobSid } = proratePayload;

    if (this.isResolvingProrateStatus
      && this.resolvingProrateStatusForHouseJobSid === houseJobSid) {
      if (onResolved) {
        this.pendingProrateStatusCallbacks.push(onResolved);
      }
      return;
    }

    if (onResolved) {
      this.pendingProrateStatusCallbacks.push(onResolved);
    }

    this.isResolvingProrateStatus = true;
    this.resolvingProrateStatusForHouseJobSid = houseJobSid;

    this.operationService.getHouseProrateStatus(proratePayload).subscribe({
      next: (resp: any) => {
        if (this.getProfitHouseJobSid() !== houseJobSid) {
          return;
        }

        this.resolvedJobToSubjob = resp?.data?.JobtoSubjob === 'Y' ? 'Y' : 'N';
        this.hasResolvedProrateStatus = true;
        const callbacks = [...this.pendingProrateStatusCallbacks];
        this.pendingProrateStatusCallbacks = [];
        callbacks.forEach(callback => callback());
      },
      error: () => {
        if (this.getProfitHouseJobSid() !== houseJobSid) {
          return;
        }

        this.resolvedJobToSubjob = 'N';
        this.hasResolvedProrateStatus = true;
        const callbacks = [...this.pendingProrateStatusCallbacks];
        this.pendingProrateStatusCallbacks = [];
        callbacks.forEach(callback => callback());
      },
      complete: () => {
        if (this.resolvingProrateStatusForHouseJobSid === houseJobSid) {
          this.isResolvingProrateStatus = false;
          this.resolvingProrateStatusForHouseJobSid = null;
        }
      }
    });
  }

  private prefetchProrateStatus() {
    if (!this.isHouseScopedProrateScreen()) {
      return;
    }

    this.ensureProrateStatusResolved();
  }

  private getHouseProratePayload(): {
    HouseJobSid: number;
    CompanyMasterSid: number;
    BranchMasterSid: number;
  } | null {
    const houseJobSid = this.getProfitHouseJobSid();
    const companyMasterSid = Number(this.currentCompany?.CompanyMasterSid || 0);
    const branchMasterSid = Number(this.currentBranch?.BranchMasterSid || 0);

    if (!houseJobSid || !companyMasterSid || !branchMasterSid) {
      return null;
    }

    return {
      HouseJobSid: houseJobSid,
      CompanyMasterSid: companyMasterSid,
      BranchMasterSid: branchMasterSid,
    };
  }

  private shouldUseProratedProfitRows(): boolean {
    return this.shouldFetchProratedProfitRows() && this.hasLoadedProfitProrate;
  }

  private shouldFetchProratedProfitRows(): boolean {
    return this.resolvedJobToSubjob === 'Y' && !!this.getProfitHouseJobSid();
  }

  private mapProratedChargesForProfit(): any[] {
    return (this.profitProratedCharges || []).map((row: any) => ({
      ChargeMasterSid: row.chargeMasterSid,
      ChargeName: row.chargeName,
      ProfitSourceType: 'Prorate',
      CostLocalAmount: row.costLocalAmount ?? 0,
      RevenueLocalAmount: row.revenueLocalAmount ?? 0,
      CostDrCr: row.costDrCr,
      RevenueDrCr: row.revenueDrCr
    }));
  }

  private getProfitHouseJobSid(): number | null {
    const houseJobSid = Number(this.parentFormValue?.HouseJobSid || 0);
    return houseJobSid > 0 ? houseJobSid : null;
  }

  private isHouseScopedProrateScreen(): boolean {
    return this.screenName === 'Booking'
      || this.screenName === 'House Job'
      || this.screenName === 'House Air Waybill';
  }

  private resetProrateProfitState() {
    this.profitProratedCharges = [];
    this.isProfitProrateLoading = false;
    this.hasLoadedProfitProrate = false;
    this.hasResolvedProrateStatus = false;
    this.resolvedJobToSubjob = 'N';
    this.isResolvingProrateStatus = false;
    this.resolvingProrateStatusForHouseJobSid = null;
    this.isFetchingProfitProratedCharges = false;
    this.fetchingProfitProratedChargesForHouseJobSid = null;
    this.pendingProrateStatusCallbacks = [];
  }

  calculateTotal(field: string): number {
    return this.profitSummary.reduce((sum, item) => sum + parseFloat(item[field] || 0), 0);
  }

  calculateTotalProfitPercent(): number {
    const totalSales = this.calculateTotal('totalSales');
    const totalCost = this.calculateTotal('totalCost');
    const totalProfit = this.calculateTotal('profit');
    if (totalSales > totalCost) {
      return totalProfit / totalSales * 100;
    } else {
      return totalProfit / totalCost * 100;
    }
  }

  getTotalProfitPercent(): string {
    return this.calculateTotalProfitPercent().toFixed(this.digitsAfterDecimal);
  }


  getChargeCode(ChargeMasterSid) {
    if (!ChargeMasterSid || this.chargeList.length === 0) {
      return '';
    }
    return (this.chargeList.find(charge => charge.ChargeMasterSid === ChargeMasterSid)?.chargeCode);
  }

  getChargeName(ChargeMasterSid) {
    if (!ChargeMasterSid || this.chargeList.length === 0) {
      return '';
    }
    return (this.chargeList.find(charge => charge.ChargeMasterSid === ChargeMasterSid)?.chargeName);
  }

  getUnitCode(ChargeUomSid) {
    if (!ChargeUomSid || this.uomList.length === 0) {
      return '';
    }
    return (this.uomList.find(uom => uom.UOMMasterSid === ChargeUomSid)?.UOMCode);
  }

  getCurrencyCode(CurrencyMasterSid) {
    if (!CurrencyMasterSid || this.currencyList.length === 0) {
      return '';
    }
    return (this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid)?.currencyCode);
  }

  getCustomerName(CustomerMasterSid) {
    if (!CustomerMasterSid || this.customerList.length === 0) {
      return '';
    }
    return (this.customerList.find(customer => customer.CustomerMasterSid === CustomerMasterSid)?.CustomerName);
  }

  getAgentName(CustomerMasterSid) {
    if (!CustomerMasterSid || this.agentList.length === 0) {
      return '';
    }
    return (this.agentList.find(customer => customer.CustomerMasterSid === CustomerMasterSid)?.CustomerName);
  }

  getDocTypeName(VoucherTypeSid) {
    if (!VoucherTypeSid || this.docTypeList.length === 0) {
      return '';
    }
    return (this.docTypeList.find(docType => docType.DocumentTypeMasterSid === VoucherTypeSid)?.DocumentTypeCode);
  }

  getTariffDetails(content: TemplateRef<any>) {
    if (!this.hasRequiredFieldsFilled()) {
      this.appSettingService.showWarning("Please fill all the required fields correctly to get Tariff.");
      return;
    }
    this.tariffLoading = true;
    let segment = this.parentFormValue.Segment;
    let value;
    if (segment === "FCL") {
      value = this.parentFormValue.NoofContainers
    } else if (segment === "LCL") {
      value = this.parentFormValue.Volume
    } else if (segment === "AIR") {
      value = this.parentFormValue.ChargeableWeight
    }
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid : this.currentBranch?.BranchMasterSid,
      DepartmentMasterSid: this.parentFormValue?.DepartmentMasterSid || null,
      PORSid: this.parentFormValue?.PORSid || null,
      POLSid: this.parentFormValue?.POLSid || null,
      PODSid:this.parentFormValue?.PODSid || null,
      FPODSid: this.parentFormValue?.FPODSid || null,
      CargoType: this.parentFormValue?.CargoType || 'General',
      EffectiveDate: this.isEditMode ? this.parentFormValue?.EffectiveDate : new Date,
      ExpiredDate: this.isEditMode ? this.parentFormValue?.ExpiredDate : new Date,
      Carrier: this.parentFormValue?.Carrier || null,
      IncoTerms: this.parentFormValue?.IncoTerms || null,
    };

    let stopFlag = false;
    ['CompanyMasterSid','POLSid','PODSid','DepartmentMasterSid','EffectiveDate','ExpiredDate'].forEach(field => {
      if(!payload[field]){
        stopFlag = true;
      }
    })

    if(stopFlag){
      this.appSettingService.showWarning("Please fill all required fields to get tariff.");
      return;
    }

    this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
    this.operationService.getTariffDetails(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          console.log(resp.data)
          const response: any[] = resp.data || [];

          // Check if no tariffs found
          if (response.length === 0) {
            this.tariffLoading = false;
            this.modalService.dismissAll();
            this.appSettingService.showError("No tariff charges found for the selected criteria.");
            return;
          }

          // Check if standard rates were returned
          const isStandardRate = response.length > 0 && response[0].isStandardRate === true;

          this.tariffDetails = response
            .map((td: any) => {
              const charge = this.getCharge(td.ChargeCode);
              const qtySourceField = this.findFieldForQty(charge?.UnitQty);
              let value = 1;
              if (typeof qtySourceField === 'string' && this.parentFormValue[qtySourceField]) {
                value = this.parentFormValue[qtySourceField] || 1;
              } else if (typeof qtySourceField === 'number') {
                value = qtySourceField;
              }

              return {
                TariffDetailSid : td.TariffDetailSid,
                ChargeMasterSid: charge?.ChargeMasterSid,
                ChargeDescription: td.Description,
                ChargeUomSid: td.UOMSid,
                RevenueChargeUomSid: td.UOMSid,
                CostChargeUomSid: td.UOMSid,
                NoOfUnit: value,

                CostCurrencyMasterSid : td.BuyCurrency,
                CostExchangeRate : Number(td.costExchangeRate).toFixed(this.digitsAfterDecimal),
                CostRate : Number(td.BuyPerUnitPrice).toFixed(this.digitsAfterDecimal),
                CostAmount : (Number(value) * Number(td.BuyPerUnitPrice)).toFixed(this.digitsAfterDecimal),
                CostLocalAmount : (Number(td.costExchangeRate) * Number(value) * Number(td.BuyPerUnitPrice)).toFixed(this.digitsAfterDecimal),
                CostDrCr : 'D',
                CostPrepaidCollect: "Prepaid",

                RevenueCurrencyMasterSid : td.SaleCurrency,
                RevenueExchangeRate : Number(td.revenueExchangeRate).toFixed(this.digitsAfterDecimal),
                RevenueRate : Number(td.SalePerUnitPrice).toFixed(this.digitsAfterDecimal),
                RevenueAmount : (Number(value) * Number(td.SalePerUnitPrice)).toFixed(this.digitsAfterDecimal),
                RevenueLocalAmount : (Number(td.revenueExchangeRate) * Number(value) * Number(td.SalePerUnitPrice)).toFixed(this.digitsAfterDecimal),
                RevenueDrCr : 'C',
                RevenuePrepaidCollect: "Prepaid",
              }
            })

          console.log(this.tariffDetails);
          this.tariffLoading = false;

          // Show info message if standard rates were returned
          if (isStandardRate) {
            this.appSettingService.showInfo("No specific tariff found. Displaying standard rates based on Department, POL, POD, and Company.");
          }
        } else {
          this.appSettingService.showError("Error loading Tariff Details");
          this.tariffLoading = false;
          this.modalService.dismissAll();
        }
      },
      (error) => {
        this.tariffLoading = false;
        this.modalService.dismissAll();
        this.appSettingService.showError("Error loading Tariff Details");
      }
    )

  }

  getCharge(chargeCode) {
    if (!chargeCode || !this.chargeList || this.chargeList.length === 0) {
      return {};
    }
    const charge = this.chargeList.find(ch => ch.chargeCode === chargeCode);
    return charge;
  }

    findFieldForQty(UnitQty:string){
    const trimmedUnitQty = String(UnitQty).trim();
    switch(trimmedUnitQty){
      case 'GrossWeight':
        return 'GrossWeight';
      case 'CBM':
        return 'Volume';
      case '20ft':
        return 'Qty';
      case '40ft':
        return 'Qty';
      case 'ChargeableWeight':
        return 'ChargeableWeight';
      case 'BL':
        return '1';
      case 'Shipment':
        return '1';
      default:
        return '1';
    }
  }

  hasRequiredFieldsFilled() {
    const data = this.parentFormValue;
    return (data.DepartmentMasterSid || data.POLSid || data.PODSid || data.EffectiveDate || data.ExpiredDate)
  }

  applyTariff(detail) {
    console.log(detail);
 
    if (this.rateFormArray.length === 0) {
      this.addRateRow(detail);
    } else {
      if (this.checkIfLastChargeEmpty()) {
        const rateGroup = this.rateFormArray.at(this.rateFormArray.length - 1);
        rateGroup.patchValue(detail);
      } else {
        this.addRateRow(detail);
      }
    }
 
    this.calculateProfit();
    this.modalService.dismissAll();
  }
  checkIfLastChargeEmpty(){
    if(this.rateFormArray.length === 0){
      return true;
    }
    const lastCharge = this.rateFormArray.at(this.rateFormArray.length - 1);
    if(lastCharge.get('ChargeMasterSid')?.value === null){
      return true;
    }
    return false;
  }

  closeTariffModal() {
    this.tariffDetails = [];
    this.modalService.dismissAll();
  }


  reportProfitSummary(): void {
    const formattedData = this.profitSummary.map(row => ({
      ChargeName: row.chargeName || '',
      TotalSales: parseFloat(row.totalSales) || 0,
      TotalCost: parseFloat(row.totalCost) || 0,
      Profit: parseFloat(row.profit) || 0,
      ProfitPercent: row.profitPercent || '0%'
    }));

    const totalRow = {
      ChargeName: 'Total',
      TotalSales: this.calculateTotal('totalSales'),
      TotalCost: this.calculateTotal('totalCost'),
      Profit: this.calculateTotal('profit'),
      ProfitPercent: `${this.calculateTotalProfitPercent().toFixed(this.digitsAfterDecimal)}%`
    };

    formattedData.push(totalRow);

    const companyName = this.currentCompany?.companyName ?? 'Company';

    this.excelExportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'ChargeName', label: 'Charge Name' },
        { key: 'TotalSales', label: 'Total Sales' },
        { key: 'TotalCost', label: 'Total Cost' },
        { key: 'Profit', label: 'Profit' },
        { key: 'ProfitPercent', label: 'Profit %' }
      ],
      fileName: 'Profit-Summary-Report',
      title: companyName
    });
  }
 handleCustomerBranchChange(rateIndex: number, customerBranch: any) {
  const formGroup = this.rateFormArray.at(rateIndex) as FormGroup;
  
  if (!customerBranch) {
    formGroup.get('RevenueCustomerBranchSid')?.setValue(null);
    this.billingGST_VAT = '';
    this.billingIsUnionTerritory = false;
    return;
  }

  formGroup.get('RevenueCustomerBranchSid')?.setValue(customerBranch.CustomerBranchSid);
  this.billingIsUnionTerritory = customerBranch?.stateMaster?.IsUnionTerritory === 'Y';

  // Get the customer master data from the branch
  const customerMaster = customerBranch.revenueCustomerMaster;
  
  if (customerMaster && customerMaster.countryMaster) {
    const countryCode = customerMaster.countryMaster.countryCode;
    
    if (countryCode === 'IN') {
      // For India - use GSTNo from branch
      this.billingGST_VAT = customerBranch.GSTNo || '';
      console.log('GST-VAT set from branch GSTNo:', this.billingGST_VAT);
    } else {
      // For other countries - use PanType from customer master
      this.billingGST_VAT = customerBranch?.customerMaster?.PanType || '';
      console.log('GST-VAT set from customer PanType:', this.billingGST_VAT);
    }
  } else {
    this.billingGST_VAT = '';
    console.log('No country master found for customer');
  }
}

  handleCustomerChange(rateIndex:number , customer: any) {
    const formGroup = this.rateFormArray.at(rateIndex) as FormGroup;
    if (!customer || customer === undefined) {
      formGroup.get('RevenueCustomerMasterSid')?.setValue(null);
      formGroup.get('RevenueCustomerBranchSid')?.setValue(null);
    this.billingGST_VAT = '';
      return;
    }
    formGroup.get('RevenueCustomerMasterSid')?.setValue(customer.CustomerMasterSid);
    if (customer.revenueCustomerBranch && customer.revenueCustomerBranch.length > 0) {
    // You might want to show branch selection or use the first branch
    const firstBranch = customer.revenueCustomerBranch[0];
    this.handleCustomerBranchChange(rateIndex, firstBranch);
  } else {
    // Apply logic directly to customer master if no branches
    if (customer.countryMaster) {
      const countryCode = customer.countryMaster.countryCode;

      if (countryCode === 'IN') {
        // For India customers without branches, you might not have GSTNo
        this.billingGST_VAT = customer.GSTNo || '';
      } else {
        // For other countries - use PanType from customer master
        this.billingGST_VAT = customer.PanType || '';
      }
    }
  }
  }

  handleAgentChange(rateIndex:number , agent: any) {
    const formGroup = this.rateFormArray.at(rateIndex) as FormGroup;
    if (!agent || agent === undefined) {
      formGroup.get('CostAgentMasterSid')?.setValue(null);
      return;
    }
    formGroup.get('CostAgentMasterSid')?.setValue(agent.CustomerMasterSid);
  }

  filterDepartmentBasedOnSegment(departmentName: string) {
    if (departmentName) {
      this.filteredChargeList = this.chargeList.filter(charge => {
        const allDepartmentNames = charge.DepartmentMasterSid || [];
        return allDepartmentNames.includes(departmentName);
      });
    }
  }

  /**
   * Get the number of decimal places allowed for amounts
   * Used with [decimalDigitsAfter] directive
   * Example: getAmountDecimalPlaces('USD') returns 2
   */
  public getAmountDecimalPlaces(CurrencyMasterSid: number): number {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(currency.currencyCode);
      return config?.amountDecimal;
    }
    return 2;
  }

  /**
   * Get the number of decimal places allowed for exchange rates
   * Example: getExchangeRateDecimalPlaces('USD') returns 3
   */
  public getExchangeRateDecimalPlaces(CurrencyMasterSid: number): number {
    if(!this.currencyList || this.currencyList.length === 0) return 4;
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(currency.currencyCode);
      return config?.exchangeDecimal?? 4;
    }
    return 4;
  }
//   public getExchangeRateDecimalPlaces(CurrencyMasterSid: number): number {
//   if (!this.currencyList || this.currencyList.length === 0) return 3;
//   const currency = this.currencyList.find(c => c.CurrencyMasterSid === CurrencyMasterSid);
//   if (currency) {
//     const config = this.currencyConfigService.getCurrencyConfig(currency.currencyCode);
//     return config?.exchangeDecimal ?? 3;
//   }
//   return 3; 
// }
    /**
   * Format an amount with currency symbol and comma separators
   * Example: getFormattedAmount(1234.56, 'USD') returns '$1,234.56'
   */
  public getFormattedAmount(amount: number, CurrencyMasterSid: number) {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    const input = {
      value : amount,
      currencyCode: currency?.currencyCode
    }
    return this.currencyFormatter.formatAmount(input,false);
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
    return Number(formattedAmount).toFixed(digitForPadding);
  }

  /**
   * Format an exchange rate as a string
   * Example: getFormattedExchangeRate(1234.5678, 'USD') returns '1234.568'
   */
  public getFormattedExchangeRate(rate: number, CurrencyMasterSid: number): number {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    return this.currencyFormatter.formatExchangeRate({
      value: rate,
      currencyCode: currency?.currencyCode
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
    const formattedExchangeRate = this.currencyFormatter.formatExchangeRate({
      value: rate,
      currencyCode: currency?.currencyCode,
    });
    return formattedExchangeRate.toFixed(this.getExchangeRateDecimalPlaces(CurrencyMasterSid));
  }

    /**
   |--------------------------------------------------
   | //SECTION - 8: Voucher Generation Methods
   |--------------------------------------------------
   */

  
  isCurrentScreen(screenName : 'Booking' | 'Master Job' | 'House Job' | 'House Air Waybill' | 'Master Air Waybill' | 'Service Job'| 'Agent Master Air Waybill'){
    return this.screenName === screenName;
  }

  initVoucherForm() {
    const currentCompanyCurrencyId = this.currentCompany?.CurrencyMasterSid;
    const currentCompanyCurrencyCode = this.currentCompanyCurrency?.code;
    const today = getDefaultTodayDate();
    const fyForDefault = this.appSettingService.getCurrentFinancialYear();
    const todayDate = fyForDefault && (today < new Date(fyForDefault.StartDate) || today > new Date(fyForDefault.EndDate)) ? fyForDefault.EndDate : today;
    const narration = this.autoGenerateNarration();

    // Validation related checking
    const isBookingFieldsRequired = 
      this.isCurrentScreen('Booking')
    
    const isHouseFieldsRequired =
      this.isCurrentScreen('House Job') || 
      this.isCurrentScreen('House Air Waybill') ||
      this.isCurrentScreen('Agent Master Air Waybill');

    const isMasterFieldsRequired =
      this.isCurrentScreen('Master Job') ||
      this.isCurrentScreen('Master Air Waybill');

    this.voucherForm = this.fb.group({
      VoucherNumber: [''],
      VoucherType: ['INV'],
      VoucherDate: [todayDate],
      PostDate : [null],
      Narration : [narration],
      PartyMasterSid : [null,[Validators.required]],
      COAMasterSid : [null,[Validators.required]],
      PartyName : [{value : '', disabled : true },[Validators.required]],
      PartyAddress : [{value : '', disabled : true },[Validators.required]],
      CustomerBranchSid : [null,[Validators.required]],
      PlaceOfSupply : [{ value : '' , disabled : true },[Validators.required]],
      State : [''],
      GST_VAT : [{ value : '', disabled : true }],
      InvoiceType : ['REG'],
      TaxNumber : [''],
      GSTType : [''],
      Remarks : [''],
      DepartmentMasterSid : [null,[Validators.required]],
      HouseNumber : [{ value : '' , disabled : true }],
      MasterNumber : [{ value : '' , disabled : true }],
      HouseJobSid : [null , isHouseFieldsRequired ? [Validators.required] : []],
      MasterJobSid : [null , isMasterFieldsRequired ? [Validators.required] : []],
      CurrencyMasterSid : [ currentCompanyCurrencyId || null ,[Validators.required]],
      CurrencyCode : [ currentCompanyCurrencyCode || null ,[Validators.required]],
      ExchangeRate : [{ value : 1 , disabled : true },[Validators.required , greaterThanZero()]],
      Amount : [null],
      LocalAmount : [null],
      NetAmount : [null],
      DocumentNumber : [null],
      DocumentDate : [null],
      SetoffStatus : [null],
      TaxType : [this.currentCompanyCountryCode === 'in' ? 'GST' : 'VAT'],
      VoucherTypeMasterSid : [null],
      VoucherHeaderSid : [null],
      PostStatus : [null],
      BookingHeaderSid : [null , isBookingFieldsRequired ? [Validators.required] : [] ],
      Salesman : [null],
      voucherDetails : this.fb.array([]),

      // Unused here
      BankCOA : [''],
      BankPartyName : [''],
      ReversalVoucher : [null],
      BankCurrencyMasterSid : [null],
      BankCurrencyCode : [null],
      InstrumentMode : [null],
      InstrumentNumber : [null],
      InstrumentDate : [null],
      ClearanceDate : [null],
      CreditNoteReason : [null],
      CashOrBank : [null],
      MultiBranch : [null],
    })

    // initializing opertation related fields
    this.voucherForm.patchValue({
      DepartmentMasterSid : this.parentFormValue?.DepartmentMasterSid,
      HouseNumber : (isHouseFieldsRequired) ? this.parentFormValue?.HBLNo : null,
      MasterNumber : (isHouseFieldsRequired || isMasterFieldsRequired) ? this.parentFormValue?.MBLNo : null,
      HouseJobSid : (isHouseFieldsRequired) ? this.getParentSid() : null,
      MasterJobSid : (isMasterFieldsRequired) ? this.getParentSid() : (isHouseFieldsRequired) ? this.parentFormValue?.MasterJobSid : null,
      BookingHeaderSid : isBookingFieldsRequired ? this.getParentSid() : (isHouseFieldsRequired ? this.parentFormValue?.BookingHeaderSid : null),
      Salesman : !isMasterFieldsRequired ? this.parentFormValue?.SalesmanName : null,
    })

    this.voucherForm.setValidators(
      consistentExchangeRatesValidator(currentCompanyCurrencyId,currentCompanyCurrencyCode)
    );

    this.subscribeToVoucherValueChanges();
  }

  private subscribeToVoucherValueChanges() {
    this.voucherForm.get('InvoiceType')?.valueChanges.subscribe((invoiceType) => {
      if (!this.voucherForm.get('PlaceOfSupply')?.value) {
        return;
      }

      const classification = this.refreshVoucherTaxClassification(invoiceType as any);
      this.voucherForm.get('GSTType')?.setValue(classification.formGSTType, { emitEvent: false });
      this.recalculateVoucherTaxes();
    });

    this.voucherForm.get('GSTType')?.valueChanges.subscribe(() => {
      if (!this.voucherForm.get('PlaceOfSupply')?.value) {
        return;
      }

      this.refreshVoucherTaxClassification();
      this.recalculateVoucherTaxes();
    });
  }

  get voucher() : { [key : string] : AbstractControl<any,any> } {
    return this.voucherForm.controls || {};
  }

  get details() : FormArray {
    return this.voucherForm.get('voucherDetails') as FormArray;
  }

  get showVendorInvoiceHeaderRemarks(): boolean {
    return this.selectedVoucherType === 'Vendor Invoice';
  }

  addDetailGroup(data : any) {
    this.details.push(this.createDetailGroup(data));
  }

  createDetailGroup(data?:any){
    const len = this.details.length + 1;
    // Validation related checking
    const isBookingFieldsRequired = 
      this.isCurrentScreen('Booking') || 
      this.isCurrentScreen('House Job') || 
      this.isCurrentScreen('House Air Waybill') ||
      this.isCurrentScreen('Agent Master Air Waybill');
    
    const isHouseFieldsRequired =
      this.isCurrentScreen('House Job') || 
      this.isCurrentScreen('House Air Waybill') ||
      this.isCurrentScreen('Agent Master Air Waybill');

    const isMasterFieldsRequired =
      this.isCurrentScreen('Master Job') ||
      this.isCurrentScreen('Master Air Waybill');
    
    const YearMasterSid = this.appSettingService.getCurrentFinancialYear()?.YearMasterSid;

    const group = this.fb.group({
      isSelected : [true],
      Sno : [data?.Sno ?? len],
      ChargeMasterSid : [data?.ChargeMasterSid ?? null , [Validators.required]],
      ChargeDescription : [data?.ChargeDescription ?? '' ],
      LedgerMasterSid : [data?.LedgerMasterSid ?? null , [Validators.required]],
      COAMasterSid : [data?.COAMasterSid ?? null , [Validators.required]],
      HSSACMasterSid : [data?.HSSACMasterSid ?? null , [Validators.required]],
      ChargeUOMSid : [data?.ChargeUOMSid ?? null , [Validators.required]],
      NumberOfUnit : [data?.NumberOfUnit ?? this.voucher['NumberOfUnit'].value ?? null , [Validators.required , greaterThanZero()]],
      CurrencyMasterSid : [data?.CurrencyMasterSid ?? this.voucher['CurrencyMasterSid'].value ?? null , [Validators.required]],
      CurrencyCode : [data?.CurrencyCode ?? this.voucher['CurrencyCode'].value ?? null , [Validators.required]],
      ExchangeRate : [data?.ExchangeRate ?? this.voucher['ExchangeRate'].value ?? null , [Validators.required, greaterThanZero()]],
      DrCr : [data?.DrCr ?? 'D' , [Validators.required]],
      Rate : [data?.Rate ?? null , [Validators.required , greaterThanZero()]],
      Amount : [data?.Amount ?? null , [Validators.required , greaterThanZero()]],
      TaxableAmount : [data?.TaxableAmount ?? null ],
      TaxPercentage1 : [data?.TaxPercentage1 ?? null],
      TaxAmount1 : [data?.TaxAmount1 ?? null],
      TaxPercentage2 : [data?.TaxPercentage2 ?? null],
      TaxAmount2 : [data?.TaxAmount2 ?? null],
      LocalAmount : [data?.LocalAmount ?? null , [Validators.required , greaterThanZero()]],
      PartyAmount : [data?.PartyAmount ?? null , [Validators.required , greaterThanZero()]],
      
      HouseJobSid : [data?.HouseJobSid ?? null , isHouseFieldsRequired ? [Validators.required] : []],
      MasterJobSid : [data?.MasterJobSid ?? null , isMasterFieldsRequired ? [Validators.required] : []],
      DepartmentMasterSid : [data?.DepartmentMasterSid ?? null ],
      YearMasterSid : [data?.YearMasterSid ?? YearMasterSid],
      RateSid : [data?.RateSid ?? null],
      Narration : [''],
      
      IsAutoGenerated : [data?.IsAutoGenerated ?? 'N'],
      VoucherTransactionSid : [data?.VoucherTransactionSid ?? null],
      SourceDetailSid : [data?.SourceDetailSid ?? null],
      ReversalAmount : [data?.ReversalAmount ?? null],
      CostCenter : [data?.CostCenter ?? null],
      ProfitCenter : [data?.ProfitCenter ?? null],
      Remarks : [data?.Remarks ?? ''],
      CostRevenue : [data?.CostRevenue ?? 'Revenue'],
      InvoiceType : [data?.InvoiceType ?? ''],
      TotalTaxAmount : [data?.TotalTaxAmount ?? 0],
      TotalAmount : [data?.TotalAmount ?? 0],

      // Just for display content
      ChargeCode : [data?.ChargeCode ?? ''],
      TaxLabel : ['']
    });

    // Object.keys(group.controls).forEach(key =>{
    //   group.get(key)?.disable();
    // });

    return group;
  }
  
  openVoucherTypeModal() {
     if (!this.isVoucherGenerationAllowed()) {
        const status = this.parentFormValue?.status;
        this.appSettingService.showWarning(`Cannot generate voucher. Booking status is '${status || 'Invalid'}'`);
        return;
    }
    if (!this.isEditMode || !this.rateFormArray?.length) {
      this.appSettingService.showWarning('No rates available for voucher generation');
      return;
    }

    this.initVoucherForm();
    // Open voucher type selection modal
    this.voucherTypeModalRef = this.modalService.open(this.voucherTypeModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
  }

  async selectVoucherType(voucherType: 'Invoice' | 'Vendor Invoice') {
    if (this.isProcessingVoucherType) return;
    this.isProcessingVoucherType = true;

    try {
      this.selectedVoucherType = voucherType;
      const documentSide = this.selectedVoucherType === 'Invoice' ? 'SALES' : 'PURCHASE';
      await this.taxCalculationService.init({
        documentSide,
        companyCountryCode: this.currentCompanyCountryCode,
        companyCountryMasterSid: this.currentCompany?.CountryMasterSid,
        branchStateName: this.currentBranch?.stateMaster?.stateName,
        branchStateMasterSid: this.currentBranch?.StateMasterSid,
      });
      await this.taxCalculationService.fetchTaxMasters(documentSide);
      this.voucherTypeModalRef?.close();

      // Based on voucher type, determine charges to include
      if (voucherType === 'Invoice') {
        this.voucherForm.patchValue({
          VoucherType: 'INV',
          TaxType: 'Output'
        })
        await this.processPendingCharges('revenue');
      } else {
        this.voucherForm.patchValue({
          VoucherType: 'VIN',
          TaxType: 'Input'
        })
        await this.processPendingCharges('cost');
      }
      this.checkVoucherPostingMechanism();
    } finally {
      this.isProcessingVoucherType = false;
    }
  }

  checkVoucherPostingMechanism() {
    const companyId = this.currentCompany?.CompanyMasterSid;
    const branchId = this.currentBranch?.BranchMasterSid;
    const menuName = this.selectedVoucherType;
    const isInvoice = this.selectedVoucherType === 'Invoice';
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
          if (resp.status && resp.data) {
            if(!isInvoice){
              this.voucher['DocumentNumber']?.setValidators([Validators.required]); this.voucher['DocumentNumber']?.updateValueAndValidity();
              this.voucher['DocumentDate']?.setValidators([Validators.required]); this.voucher['DocumentDate']?.updateValueAndValidity();
            }
          } else {
            this.voucher['DocumentNumber']?.clearValidators(); this.voucher['DocumentNumber']?.updateValueAndValidity();
            this.voucher['DocumentDate']?.clearValidators(); this.voucher['DocumentDate']?.updateValueAndValidity();
          }
        },
        error: (error: any) => {
          console.error('Error checking voucher posting mechanism:', error);
        },
      });
  }

  isFieldRequired(fieldName: string): boolean {
    return this.voucher[fieldName]?.hasValidator(Validators.required);
  }

  private async processPendingCharges(type: 'revenue' | 'cost') {
    try {
      this.spinner.show();

      // Store the type for later use in filtering
      this.currentVoucherTypeFilter = type;

      // Get booking rates with full details including customer information
      let ratesResp;
      if (this.isBooking) {
        const result = await firstValueFrom(this.operationService.getBookingRatesWithDetails(this.ParentSid));
        if(result.status){
          ratesResp = (result.data || [])
          .map(rate =>({
            ...rate,
            RateSid : rate.BookingRatesSid,
            ParentSid : rate.BookingHeaderSid,
            status:rate.status,
            RevenueCustomerMasterSid : rate.CustomerMasterSid,
            RevenueCustomerBranchSid : rate.CustomerBranchSid,
            CostAgentMasterSid : rate.AgentMasterSid,
            CostAgentBranchSid : rate.AgentBranchSid,
          }));
        } else {
          this.appSettingService.showError(result.message || 'Error Fetching Booking Rates');
          this.spinner.hide();
          return;
        }
      } else {
        const result = await firstValueFrom(this.operationService.getCostRevenueChargeWithDetails({
          TransactionSid: this.routeParentSid,
          menuName : this.screenName
        }));
        if(result.status){
          ratesResp = (result.data || [])
          .map(rate =>({
            ...rate,
            RateSid : rate.CostRevenueChargesSid,
            ParentSid : rate.TransactionSid,
          }));
        } else {
          this.appSettingService.showError(result.message || `Error Fetching ${this.screenName} Rates`);
          this.spinner.hide()
          return;
        }
      }

      if (!ratesResp?.length) {
        this.appSettingService.showWarning(`No ${this.screenName} rates found`);
        this.spinner.hide();
        return;
      }

      // Filter based on type and pending status
      const allRates = ratesResp;
      const filteredRates = allRates.filter((rate: any) => {
        const isCorrectType = type === 'revenue' ? Number(rate.RevenueAmount) > 0 : Number(rate.CostAmount) > 0;
        // Check specific voucher field based on type
        const isPending = type === 'revenue'
          ? !rate.RevenueVoucherHeaderSid
          : !rate.CostVoucherHeaderSid;
        return isCorrectType && isPending;
      });

      if (!filteredRates.length) {
        this.appSettingService.showWarning(`No pending ${type} charges found for voucher generation`);
        this.spinner.hide();
        return;
      }

      // Get unique billing parties (pass type to determine which field to use)
      let uniqueBillingParties = this.taxCalculationService.getUniqueBillingParties(filteredRates, type);

      if (uniqueBillingParties.length === 0) {
        this.appSettingService.showWarning('No billing parties found');
        this.spinner.hide();
        return;
      } else if (uniqueBillingParties.length === 1) {
        // Single billing party - proceed directly
        const billingPartySid = uniqueBillingParties[0];
        const pendingCharges = this.taxCalculationService.filterPendingCharges(filteredRates, billingPartySid, type);
        this.proceedToInvoiceGeneration(billingPartySid, pendingCharges);
      } else {
        // Multiple billing parties - show selection modal
        this.showBillingPartySelection(filteredRates, uniqueBillingParties);
      }

      this.spinner.hide();
    } catch (error) {
      this.spinner.hide();
      console.error('Error processing pending charges:', error);
      this.appSettingService.showError('Error processing charges for voucher generation');
    }
  }

  private showBillingPartySelection(allRates: any[], uniqueBillingParties: number[]) {
    // Prepare billing party data for display
    const isRevenue = this.currentVoucherTypeFilter === 'revenue';

    this.availableBillingParties = uniqueBillingParties.map(partySid => {
      // Filter charges for this specific billing party
      // Revenue: use CustomerMasterSid, Cost: use AgentMasterSid
      const pendingCharges = allRates.filter((rate: any) => {
          return isRevenue
            ? rate.RevenueCustomerMasterSid === partySid
            : rate.CostAgentMasterSid === partySid;
      });

      const firstCharge: any = pendingCharges[0];

      // Get billing party info based on type
      // Revenue: customerMasterBP, Cost: AgentMaster
      const billingPartyInfo = isRevenue
          ? firstCharge?.customerMasterBP
          : firstCharge?.AgentMaster;


      return {
        billingPartySid: partySid,
        customerName: billingPartyInfo?.CustomerName || 'Unknown Customer',
        customerAddress: billingPartyInfo?.CustomerAddress1 || billingPartyInfo?.Address || 'No Address',
        pendingChargesCount: pendingCharges.length,
        totalAmount: pendingCharges.reduce((sum: number, charge: any) => {
          return sum + (isRevenue ? Number(charge.RevenueLocalAmount) : Number(charge.CostLocalAmount) || 0);
        }, 0),
        pendingCharges: pendingCharges
      };
    });

    this.selectedBillingPartyIndex = -1;

    // Open billing party selection modal
    this.billingPartyModalRef = this.modalService.open(this.billingPartyModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
  }

  selectBillingParty(index: number) {
    this.selectedBillingPartyIndex = index;
  }

  proceedWithBillingParty() {
    if (this.selectedBillingPartyIndex === -1) {
      this.appSettingService.showWarning('Please select a billing party');
      return;
    }

    const selectedParty = this.availableBillingParties[this.selectedBillingPartyIndex];
    this.billingPartyModalRef?.close();

    this.proceedToInvoiceGeneration(selectedParty.billingPartySid, selectedParty.pendingCharges);
  }

  private proceedToInvoiceGeneration(billingPartySid: number, pendingCharges: BookingRateDetails[]) {
    this.resetVoucherChargeSelectionState();
    pendingCharges.forEach((charge, index) => {
      this.chargeHSSACMapping[index] = charge?.ChargeMaster?.chargeTaxMaster?.map(tax => tax.hssacMaster) || [];
    });
    this.availableCharges = [...pendingCharges];
    this.showChargeSelectionModal(billingPartySid, pendingCharges);
  }

  private resetVoucherChargeSelectionState() {
    this.details.clear();
    this.availableCharges = [];
    this.selectedCharges.clear();
    this.chargeHSSACMapping = [];
    this.currentBillingPartySid = null;
  }

  private async showChargeSelectionModal(
    billingPartySid: number,
    pendingCharges: BookingRateDetails[]
  ) {
    this.spinner.show();

    try {
      this.currentBillingPartySid = billingPartySid;

      // setting zeroth indexed charge tax master as default one
      // this.availableCharges = pendingCharges.map(charge => ({
      //   ...charge,
      //   selectedTaxMapping: charge?.ChargeMaster?.chargeTaxMaster?.[0],
      //   isSelected: true
      // }));

      // this.selectedCharges = new Set(pendingCharges.map(c => c.RateSid));

      // Run required initializers
      this.initializeInvoiceHeader(pendingCharges);
      await this.setUpInvoiceDetail(pendingCharges);

      this.chargeSelectionModalRef = this.modalService.open(this.chargeSelectionModal,{
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        scrollable: true
      })
      // this.determineGSTTypeAndPlaceOfSupply();

      // ⚡ WAIT FOR TAX GROUPS TO LOAD
      // await this.initializeTaxGroupsForCharges();

      // ⚡ Wait for tax calculation
      // this.calculateChargeSelectionTax();


    } catch (error) {
      console.error('Error in showChargeSelectionModal:', error);
      this.appSettingService.showError(error instanceof Error ? error.message : 'Error loading charge selection');
    } finally {
      this.spinner.hide();
    }
  }

  private initializeInvoiceHeader(charges: any[]) {
    if (!charges || charges.length === 0) {
      console.error('No charges provided to initialize invoice header');
      return;
    }

    const firstCharge = charges[0];
    const isRevenue = this.currentVoucherTypeFilter === 'revenue';

    try {
      let customer: any;
      let customerBranch: any;
      let customerBranchSid: any;
      if (isRevenue) {
        customer = firstCharge.customerMasterBP || {};
        customerBranch = firstCharge?.customerBranch || {};
        customerBranchSid = firstCharge?.RevenueCustomerBranchSid;
      } else {
        customer = firstCharge?.AgentMaster || {};
        customerBranch = firstCharge?.AgentBranch || {};
        customerBranchSid = firstCharge?.CostAgentBranchSid;
      }

      this.billingPartyDetails = customer;
      this.billingPartyBranchDetails = customerBranch;
      this.billingIsUnionTerritory = customerBranch?.stateMaster?.IsUnionTerritory === 'Y';

      let customerFromLookup : any;
      if (isRevenue) {
        customerFromLookup = (this.billingParties || [])?.find(c => c.CustomerMasterSid === this.currentBillingPartySid);
      } else {
        customerFromLookup = (this.parties || [])?.find(c => c.CustomerMasterSid === this.currentBillingPartySid);
      }
      const PartyLedgerMasterSid = customerFromLookup?.SubledgerMasterSid;
      const PartyCOAMasterSid = customerFromLookup?.COAMappedId;
      const placeOfSupply = this.determinePlaceOfSupply();
      const GST_VAT = this.isIndianCompany()
        ? customerBranch?.GSTNo || customer?.GSTNo || ''
        : customer?.PanType || '';
      const GSTType = this.determineTaxType(customer, customerBranch, placeOfSupply, GST_VAT);
      const customerCurrency = customerFromLookup?.currencyMaster;
      this.billingPartyCurrency = customerCurrency ?? null;
      const currentCompanyCurrencyId = this.currentCompany?.CurrencyMasterSid;
      const currentCompanyCurrencyCode = this.currentCompanyCurrency?.code;


      // initializing variabled for further usage
      this.billingPartyDetails = customer || {};
      this.billingPartyBranchDetails = customerBranch || {};

      if (!customer) {
        this.spinner.hide();
        throw new Error('No Customer found for the selected party');
      }

      if (!PartyLedgerMasterSid) {
        this.spinner.hide();
        throw new Error('No Subledger found for the selected party');
      }

      if (!PartyCOAMasterSid) {
        console.log(customer);
        this.spinner.hide();
        throw new Error('No COA found for the selected party');
      }

      if (!customerBranchSid) {
        this.spinner.hide();
        throw new Error('No Branch found for the selected party');
      }


      this.voucherForm.patchValue({
        PartyMasterSid: PartyLedgerMasterSid,
        COAMasterSid: PartyCOAMasterSid,
        PartyName: customer.CustomerName,
        PartyAddress: customerBranch?.Address || '',
        CustomerBranchSid: customerBranchSid,
        PlaceOfSupply: placeOfSupply || '',
        CurrencyMasterSid : customerCurrency?.CurrencyMasterSid ?? currentCompanyCurrencyId,
        CurrencyCode : customerCurrency?.currencyCode ?? currentCompanyCurrencyCode,
        State: this.taxCalculationService.context?.taxCategory || 'Inter',
        GST_VAT: GST_VAT || '',
        GSTType: this.currentCompanyCountryCode !== 'in' ? 'VAT' : GSTType,
        TaxType: this.currentCompanyCountryCode !== 'in' ? 'VAT' : 'GST',
        ...(this.parentFormValue?.parentMenuName === 'Service Job' && isRevenue ? { DocumentNumber: this.parentFormValue?.ShipmentNo || null } : {}),
      })

      if(customerCurrency){
        this.onHeaderCurrencyChange(customerCurrency);
      } else {
        const currency = {
          CurrencyMasterSid: currentCompanyCurrencyId,
          currencyCode: currentCompanyCurrencyCode
        }
        this.onHeaderCurrencyChange(currency);
      }

    } catch (error) {
      throw error;
    }

  }

  onHeaderCurrencyChange(currency: any) {
    // Fetch exchange rate from CurrencyExchange table
    if (currency) {
      // Get company's home currency
      const companyHomeCurrency = this.companySettings.getCurrencySettings();
      const selectedCurrencyCode = currency?.currencyCode;

      // If selected currency is same as company currency, exchange rate is 1
      if (selectedCurrencyCode === companyHomeCurrency.code) {
        this.voucherForm.patchValue({
          CurrencyMasterSid : currency?.CurrencyMasterSid,
          ExchangeRate : 1,
        })
        this.voucher['ExchangeRate']?.disable();
        this.onHeaderExchangeRateChange();
        return;
      } else {
        this.voucher['ExchangeRate']?.enable();
      }

      const dateSelected = this.voucherForm.get('VoucherDate')?.value;
      // Fetch exchange rate from CurrencyExchange table
      const payload = {
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        fromCurrencyCode: selectedCurrencyCode,
        toCurrencyCode: companyHomeCurrency.code,
        EffectiveFrom: dateSelected ? new Date(dateSelected) : new Date(),
        segment: this.selectedVoucherType === 'Invoice' ? 'revenue' : 'cost' // Use SellRate for revenue charges
      };

      this.operationService.getExchangeRate(payload).subscribe({
        next: (response: any) => {
          if (response?.status && response?.data) {
            this.voucherForm.patchValue({
              CurrencyMasterSid : currency?.CurrencyMasterSid,
              ExchangeRate : toNumber(response.data),
            })
          } else {
            this.appSettingService.showError(response.message);
            this.voucherForm.patchValue({
              CurrencyMasterSid : currency?.CurrencyMasterSid,
              ExchangeRate : 0,
            })
          }
          this.onHeaderExchangeRateChange();
        },
        error: (err) => {
          console.error('Error fetching exchange rate:', err);
          this.voucher['ExchangeRate']?.setValue(0);
          this.onHeaderExchangeRateChange();
        }
      });

    } else {
      this.voucherForm.patchValue({
        CurrencyMasterSid : null,
        ExchangeRate: 0,
      })
      this.onHeaderExchangeRateChange();
    }
  }

  onVoucherCurrencySelected(currency: any) {
    if (this.billingPartyCurrency?.CurrencyMasterSid && currency?.CurrencyMasterSid &&
        currency.CurrencyMasterSid !== this.billingPartyCurrency.CurrencyMasterSid) {
      this.toaster.warning("Selected currency differs from the party's default currency.", 'Currency Mismatch', { timeOut: 2000 });
    }
    this.onHeaderCurrencyChange(currency);
  }

  onVoucherDateChange() {
    const voucherDate = this.voucherForm.get('VoucherDate')?.value;
    if (!voucherDate) return;

    const headerCurrencyId = this.voucherForm.get('CurrencyMasterSid')?.value;
    if (headerCurrencyId) {
      const headerCurrency = this.currencyList.find(c => c.CurrencyMasterSid === headerCurrencyId);
      if (headerCurrency) {
        this.onHeaderCurrencyChange(headerCurrency);
      }
    }
  }

  onHeaderExchangeRateChange() {
    this.calculatePartyAmountForAllRows();
    this.handleDisplayFields();
  }


  private async setUpInvoiceDetail(allCharges: any[]) {
    console.log(allCharges);

    let chargeIndex = 0;

    // Determiners
    const isRevenue = this.currentVoucherTypeFilter === 'revenue';

    const isBookingScreen =
      this.isCurrentScreen('Booking');

    const isHouseScreen =
      this.isCurrentScreen('House Job') ||
      this.isCurrentScreen('House Air Waybill') ||
      this.isCurrentScreen('Agent Master Air Waybill');

    const isMasterScreen =
      this.isCurrentScreen('Master Job') ||
      this.isCurrentScreen('Master Air Waybill');
    
    const localCurrency = this.currentCompany?.CurrencyMasterSid;

    this.details.clear();

    for(const charge of allCharges) {
      const NumberOfUnit = isRevenue ? charge.RevenueNumberOfUnit : charge.CostNumberOfUnit;
      const CurrencyMasterSid = isRevenue ? charge.RevenueCurrencyMasterSid : charge.CostCurrencyMasterSid;
      const CurrencyCode = isRevenue ? charge.RevenueCurrencyMaster?.currencyCode : charge.CostCurrencyMaster?.currencyCode;
      const ExchangeRate = isRevenue ? charge.RevenueExchangeRate : charge.CostExchangeRate;
      const DrCr = isRevenue ? charge.RevenueDrCr : charge.CostDrCr;
      const Rate = isRevenue ? charge.RevenueRate : charge.CostRate;
      const Amount = isRevenue ? charge.RevenueAmount : charge.CostAmount;
      const TaxableAmount = isRevenue ? charge.RevenueLocalAmount : charge.CostLocalAmount;
      const LocalAmount = isRevenue ? charge.RevenueLocalAmount : charge.CostLocalAmount;


      this.addDetailGroup({
        Sno : chargeIndex ,
        ChargeMasterSid: charge.ChargeMasterSid,
        ChargeCode : charge.ChargeMaster?.chargeCode, 
        ChargeDescription : charge.ChargeDescription,
        Remarks : charge.Remarks ?? '',
        ChargeUOMSid : isRevenue ? charge.RevenueChargeUomSid : charge.CostChargeUomSid,
        HSSACMasterSid : this.chargeHSSACMapping?.[chargeIndex]?.[0]?.HSSACMasterSid,
        NumberOfUnit: toNumber(NumberOfUnit).toFixed(3),
        CurrencyMasterSid : CurrencyMasterSid,
        CurrencyCode : CurrencyCode,
        ExchangeRate : this.getFormattedAndPaddedExchangeRate(toNumber(ExchangeRate), CurrencyMasterSid),
        DrCr: DrCr,
        Rate: this.getFormattedAndPaddedAmount(toNumber(Rate), CurrencyMasterSid),
        Amount: this.getFormattedAndPaddedAmount(toNumber(Amount), CurrencyMasterSid),
        TaxableAmount: this.getFormattedAndPaddedAmount(toNumber(TaxableAmount), localCurrency),
        LocalAmount : this.getFormattedAndPaddedAmount(toNumber(LocalAmount), localCurrency),
        PartyAmount:this.getFormattedAndPaddedAmount(toNumber(LocalAmount), localCurrency),
        HouseJobSid : isHouseScreen ? this.getParentSid() : null,
        MasterJobSid : isMasterScreen  ? this.getParentSid() : (isHouseScreen ? this.parentFormValue?.MasterJobSid : null),
        DepartmentMasterSid : this.parentFormValue?.DepartmentMasterSid,

        InvoiceType : this.voucher['InvoiceType']?.value,
        CostRevenue : this.selectedVoucherType === "Invoice" ? "Revenue" : "Cost",
        IsAutoGenerated : 'N',
        RateSid : charge.RateSid,
      })

      this.calculateTaxAmountForRow(chargeIndex++);
    }
  }

  /**
   * 
   * @param rowIndex Particular Detail's index in FormArray
   * @returns 
   */
  public async calculateTaxAmountForRow(rowIndex: number): Promise<void> {
    const detail = this.details.at(rowIndex) as FormGroup;
    const isSelected = detail?.get('isSelected')?.value;
    const localCurrency = this.currentCompany?.CurrencyMasterSid;

    const applyFallBack = () => {
      detail.patchValue({
        TaxPercentage1 : this.getFormattedAndPaddedAmount(0,localCurrency),
        TaxAmount1 : this.getFormattedAndPaddedAmount(0,localCurrency),
        TaxPercentage2 : this.getFormattedAndPaddedAmount(0,localCurrency),
        TaxAmount2 : this.getFormattedAndPaddedAmount(0,localCurrency),
        TotalTaxAmount : this.getFormattedAndPaddedAmount(0,localCurrency),
        TotalAmount : this.getFormattedAndPaddedAmount(0,localCurrency),
        TaxLabel : ''
      })
    }

    if (!isSelected) {
      applyFallBack();
      this.handleDisplayFields();
      return;
    }

    const rawValue = detail.getRawValue();
    const hssacInForm = rawValue.HSSACMasterSid;
    if (!hssacInForm) {
      applyFallBack();
      return;
    }

    const selectedHSSAC = (this.chargeHSSACMapping[rowIndex] || []).find(
      (x: any) => x.HSSACMasterSid === hssacInForm
    );
    if (!selectedHSSAC) {
      applyFallBack();
      return;
    }

    if (!selectedHSSAC.TaxGroupSid) {
      this.appSettingService.showWarning(
        `Tax Group not found for HSSAC: ${selectedHSSAC.HSSACCode}`
      );
      applyFallBack();
      return;
    }

    this.refreshVoucherTaxClassification();

    const taxResult = this.taxCalculationService.calculateRowTax({
      taxableAmount: rawValue.TaxableAmount,
      taxGroupSid: selectedHSSAC.TaxGroupSid,
    });

    const totalTaxAmount = this.getFormattedAndPaddedAmount(
      taxResult.TotalTaxAmount,
      localCurrency
    );
    const totalAmount = toNumber(rawValue.LocalAmount) + taxResult.TotalTaxAmount;

    detail.patchValue({
      TaxPercentage1: taxResult.TaxPercentage1,
      TaxAmount1: this.getFormattedAndPaddedAmount(taxResult.TaxAmount1, localCurrency),
      TaxPercentage2: taxResult.TaxPercentage2,
      TaxAmount2: this.getFormattedAndPaddedAmount(taxResult.TaxAmount2, localCurrency),
      TotalTaxAmount: totalTaxAmount,
      TaxLabel: taxResult.TaxLabel,
      TotalAmount: this.getFormattedAndPaddedAmount(totalAmount, localCurrency),
    });

    this.handleDisplayFields();
  }

  handleDisplayFields() {
    const rawValue = this.details.getRawValue();
    let totalTaxAmountOnFirstColumn = 0;
    let totalTaxAmountOnSecondColumn = 0;
    let totalLocalAmount = 0;
    let totalTaxAmount = 0;
    let totalLocalAmountWithTax = 0;
    let totalPartyAmount = 0;
    rawValue.forEach(detail => {
      const isSelected = detail.isSelected;
      if(this.selectedVoucherType === 'Invoice'){
        if(detail.DrCr === 'C') {
          totalTaxAmountOnFirstColumn += toNumber(detail.TaxAmount1);
          totalTaxAmountOnSecondColumn += toNumber(detail.TaxAmount2);
          totalLocalAmount += isSelected ? toNumber(detail.LocalAmount) : 0;
          totalTaxAmount += toNumber(detail.TaxAmount1) + toNumber(detail.TaxAmount2);
          totalLocalAmountWithTax += isSelected ? 
            toNumber(detail.LocalAmount) + toNumber(detail.TaxAmount1) + toNumber(detail.TaxAmount2) : 
            toNumber(detail.TaxAmount1) + toNumber(detail.TaxAmount2);
          totalPartyAmount += toNumber(detail.PartyAmount);
        } else {
          totalTaxAmountOnFirstColumn -= toNumber(detail.TaxAmount1);
          totalTaxAmountOnSecondColumn -= toNumber(detail.TaxAmount2);
          totalLocalAmount -= isSelected ? toNumber(detail.LocalAmount) : 0;
          totalTaxAmount -= toNumber(detail.TaxAmount1) + toNumber(detail.TaxAmount2);
          totalLocalAmountWithTax -= isSelected ? 
            toNumber(detail.LocalAmount) + toNumber(detail.TaxAmount1) + toNumber(detail.TaxAmount2) : 
            toNumber(detail.TaxAmount1) + toNumber(detail.TaxAmount2);
          totalPartyAmount -= toNumber(detail.PartyAmount);
        }
      } else {
        if(detail.DrCr === 'D') {
          totalTaxAmountOnFirstColumn += toNumber(detail.TaxAmount1);
          totalTaxAmountOnSecondColumn += toNumber(detail.TaxAmount2);
          totalLocalAmount += isSelected ? toNumber(detail.LocalAmount) : 0;
          totalTaxAmount += toNumber(detail.TaxAmount1) + toNumber(detail.TaxAmount2);
          totalLocalAmountWithTax += isSelected ? 
            toNumber(detail.LocalAmount) + toNumber(detail.TaxAmount1) + toNumber(detail.TaxAmount2) : 
            toNumber(detail.TaxAmount1) + toNumber(detail.TaxAmount2);
          totalPartyAmount += toNumber(detail.PartyAmount);
        } else {
          totalTaxAmountOnFirstColumn -= toNumber(detail.TaxAmount1);
          totalTaxAmountOnSecondColumn -= toNumber(detail.TaxAmount2);
          totalLocalAmount -= isSelected ? toNumber(detail.LocalAmount) : 0;
          totalTaxAmount -= toNumber(detail.TaxAmount1) + toNumber(detail.TaxAmount2);
          totalLocalAmountWithTax -= isSelected ? 
            toNumber(detail.LocalAmount) + toNumber(detail.TaxAmount1) + toNumber(detail.TaxAmount2) : 
            toNumber(detail.TaxAmount1) + toNumber(detail.TaxAmount2);
          totalPartyAmount -= toNumber(detail.PartyAmount);
        }
      }
    });

    const localCurrency = this.currentCompany?.CurrencyMasterSid;
    const headerCurrency = this.voucher['CurrencyMasterSid']?.value;
    const headerExchangeRate = this.voucher['ExchangeRate']?.value;

    this.overallSummary = {
      totalTaxAmountOnFirstColumn : this.getFormattedAndPaddedAmount(totalTaxAmountOnFirstColumn, localCurrency),
      totalTaxAmountOnSecondColumn : this.getFormattedAndPaddedAmount(totalTaxAmountOnSecondColumn, localCurrency),
      totalLocalAmount : this.getFormattedAndPaddedAmount(totalLocalAmount, localCurrency),
      totalTaxAmount : this.getFormattedAndPaddedAmount(totalTaxAmount, localCurrency),
      totalLocalAmountWithTax : this.getFormattedAndPaddedAmount(totalLocalAmountWithTax, localCurrency),
      totalPartyAmount : localCurrency === headerCurrency ? 
        this.getFormattedAndPaddedAmount(totalLocalAmountWithTax, headerCurrency) : 
        this.getFormattedAndPaddedAmount(totalLocalAmountWithTax / toNumber(headerExchangeRate), headerCurrency)
    }
  }

  toNumber(value : any) {
    return toNumber(value);
  }


  calculatePartyAmountForAllRows() {
    this.details.controls.forEach((group,index) => {
      this.calculatePartyAmountForRow(index);
    })
  }




  calculatePartyAmountForRow(rowIndex: number) {
    const detail = this.details.at(rowIndex) as FormGroup;
    const rawValue = detail.getRawValue();

    const amount = rawValue.Amount;
    const localAmount = rawValue.LocalAmount;

    const headerCurrencyId = this.voucher['CurrencyMasterSid']?.value;
    const detailCurrencyId = rawValue.CurrencyMasterSid;
    const isSameCurrency = headerCurrencyId === detailCurrencyId;

    if (isSameCurrency) {
      detail.patchValue({
        PartyAmount : this.getFormattedAndPaddedAmount(toNumber(amount), headerCurrencyId),
      });
    } else {
      detail.patchValue({
        PartyAmount : this.getFormattedAndPaddedAmount(toNumber(localAmount) / toNumber(this.voucher['ExchangeRate']?.value), detailCurrencyId),
      });
    }
  }

  selectAllCharges() {
    this.details.controls.forEach((group,index) => {
      group.patchValue({
        isSelected: true
      });
      this.calculateTaxAmountForRow(index);
    })
  }

  deselectAllCharges() {
    this.details.controls.forEach((group,index) => {
      group.patchValue({
        isSelected: false
      });
      this.calculateTaxAmountForRow(index);
    })
  }


  async proceedWithSelectedCharges() {
    if (this.selectedDetailCount === 0) {
      this.appSettingService.showWarning('Please select at least one charge');
      return;
    }

    // Validate voucher date is within financial year
    const fy = this.appSettingService.getCurrentFinancialYear();
    if (fy) {
      const voucherDate = this.voucher['VoucherDate']?.value ? new Date(this.voucher['VoucherDate']?.value) : null;
      if (voucherDate) {
        const fyStart = new Date(fy.StartDate);
        const fyEnd = new Date(fy.EndDate);
        if (voucherDate < fyStart || voucherDate > fyEnd) {
          this.appSettingService.showWarning(
            `Voucher date must be within the financial year (${fy.YearName})`
          );
          return;
        }
      }
    }

    //NOTE - Check if operation date is available
    let operationDate = this.parentFormValue?.EffectiveDate ? new Date(this.parentFormValue?.EffectiveDate) : null;
    if(!operationDate){
      console.error("Operation date is not available");
      return;
    }

    const voucherDate = this.voucher['VoucherDate']?.value ? new Date(this.voucher['VoucherDate']?.value) : null;
    if(!voucherDate) {
      console.error("Voucher date is not available");
      return;
    }

    if(voucherDate < operationDate){
      const formattedVoucherDate = this.datePipe.transform(voucherDate);
      const formattedOperationDate = this.datePipe.transform(operationDate);
      const userDecision = await this.commonModalService.confirm(
        `Your <strong>Invoice Date</strong> is ${formattedVoucherDate}
   which is before the <strong>Operation Date</strong> ${formattedOperationDate}.<br><br>
   Do you want to proceed?`,
        'Operation Date Warning',
        'Proceed'
      );

      
      if(!userDecision){
        return;
      }
    }

    this.spinner.show();

    let stopGenerating = false;

    // Get all charges from the form
    const allCharges = this.details.getRawValue();

    // Fetch ledger details for ALL selected charges first
    for (let chargeIndex = 0; chargeIndex < allCharges.length; chargeIndex++) {
      const charge = allCharges[chargeIndex];

      // Skip if not selected
      if (!charge.isSelected || (charge.LedgerMasterSid && charge.COAMasterSid)) {
        continue;
      }

      if (stopGenerating) {
        break;
      }

      const selectedCharge = this.chargeList.find(c => c.ChargeMasterSid === charge.ChargeMasterSid);

      if (selectedCharge) {
        try {
          const ledgerResp = await firstValueFrom(
            this.operationService.getLedgerDetails({
              DepartmentMasterSid: this.parentFormValue?.DepartmentMasterSid,
              CompanyMasterSid: this.currentCompany.CompanyMasterSid,
              SubledgerMappingSid: charge.ChargeMasterSid,
              LedgerType: 'Charge',
              DrCr: charge.DrCr === 'D' ? 'Dr' : 'Cr',
            })
          );

          if (!ledgerResp?.status) {
            this.appSettingService.showError(ledgerResp.message);
            stopGenerating = true;
            break;
          }

          const ledgerDetail = ledgerResp.data;

          if (!ledgerDetail?.SubledgerMasterSid) {
            this.appSettingService.showError(`Subledger not found for charge ${selectedCharge.chargeName}`);
            stopGenerating = true;
            break;
          }

          if (!ledgerDetail?.COAMasterSid) {
            this.appSettingService.showError(`COA not found for charge ${selectedCharge.chargeName}`);
            stopGenerating = true;
            break;
          }

          // Patch the values for this charge at the actual form array index
          this.details.at(chargeIndex).patchValue({
            LedgerMasterSid: ledgerDetail.SubledgerMasterSid,
            COAMasterSid: ledgerDetail.COAMasterSid,
          }, { emitEvent: false }); // Don't emit events yet

          console.log("Setting detail for index", chargeIndex, "to", ledgerDetail);

        } catch (error) {
          console.error('Error fetching ledger details:', error);
          this.appSettingService.showError('Failed to fetch ledger details');
          stopGenerating = true;
          break;
        }
      }
    }

    // If any error occurred during ledger fetching, stop here
    if (stopGenerating) {
      this.spinner.hide();
      return;
    }

    // NOW update all validities at once after ALL patches are done
    this.details.controls.forEach(control => {
      control.updateValueAndValidity({ emitEvent: false });
    });

    this.details.updateValueAndValidity({ emitEvent: false });
    this.voucherForm.updateValueAndValidity();

    // Wait for Angular to process everything
    await new Promise(resolve => setTimeout(resolve, 150));

    // Validate form after all ledgers are fetched and patched
    const temporaryForm = this.getHeaderAndSelectedDetailsForm();
    if (temporaryForm.invalid) {
      errorLoggerWithToastr(temporaryForm,this.toaster, this.getVoucherValidationConfig());
      this.voucherForm.markAllAsTouched();
      this.spinner.hide();
      return;
    }

    console.log('Form is valid, proceeding with voucher creation');

    // Prepare voucher creation
    const isInvoice = this.selectedVoucherType === 'Invoice';
    const isBookingScreen = this.screenName === 'Booking';
    const rawValue = this.voucherForm.getRawValue();
    const currentYear = this.appSettingService.getCurrentFinancialYear()?.YearMasterSid
      || Number(localStorage.getItem('current-year-id'));
    const companyCurrency = this.companySettings.getCurrencySettings();

    const details = this.details.getRawValue();
    const narration = this.autoGenerateNarration();
    const vendorInvoiceRemarks = String(rawValue.Remarks ?? '').trim();
    const headerRemarks = isInvoice ? narration : (vendorInvoiceRemarks || narration);
    let interOrIntra = 'Intra';

    // india
    if (this.currentCompanyCountryCode === 'in') {
      const customerState = this.billingPartyBranchDetails?.stateMaster?.stateName
        || this.voucherForm.get('PlaceOfSupply')?.value
        || '';
      const currentCompanyState = this.currentBranchStateName;
      if (currentCompanyState === customerState) {
        interOrIntra = 'Intra';
      } else {
        interOrIntra = 'Inter';
      }
    } else if (['ae', 'us'].includes(this.currentCompanyCountryCode)) {
      interOrIntra = 'Inter';
    }
    // Union territory uses same TaxCategory as same-state (Intra)
    if (this.billingIsUnionTerritory) {
      interOrIntra = 'Intra';
    }
    // SEZ/Export with payment uses IGST regardless of state match
    if (this.taxCalculationService.context?.appliedTaxMode === 'IGST' && this.taxCalculationService.isExportOrSEZ) {
      interOrIntra = 'Inter';
    }

    // Map VoucherDetail - only include selected charges
    const VoucherDetail = details
      .filter(d => d.isSelected)
      .map((vd: any, index: number) => {
        return {
          Sno: index + 1,
          ChargeMasterSid: vd.ChargeMasterSid,
          ChargeDescription: vd.ChargeDescription,
          LedgerMasterSid: vd.LedgerMasterSid,
          COAMasterSid: vd.COAMasterSid,
          ChargeUOMSid: vd.ChargeUOMSid,
          HSSACMasterSid: vd.HSSACMasterSid,
          NumberOfUnit: toNumber(vd.NumberOfUnit),
          DrCr: vd.DrCr,
          Rate: toNumber(vd.Rate),
          CurrencyMasterSid: vd.CurrencyMasterSid,
          CurrencyCode: vd.CurrencyCode,
          ExchangeRate: toNumber(vd.ExchangeRate),
          Amount: toNumber(vd.Amount),
          TaxableAmount: toNumber(vd.TaxableAmount),
          TaxPercentage1: toNumber(vd.TaxPercentage1),
          TaxAmount1: toNumber(vd.TaxAmount1),
          TaxPercentage2: toNumber(vd.TaxPercentage2),
          TaxAmount2: toNumber(vd.TaxAmount2),
          LocalAmount: toNumber(vd.LocalAmount),
          PartyAmount: toNumber(vd.PartyAmount),
          MasterJobSid: vd.MasterJobSid,
          HouseJobSid: vd.HouseJobSid,
          DepartmentMasterSid: vd.DepartmentMasterSid,
          BookingRatesSid: isBookingScreen ? vd.RateSid : null,
          CostRevenueChargesSid: !isBookingScreen ? vd.RateSid : null,
          Narration: narration,
          YearMasterSid: currentYear,
          InvoiceType: this.voucher['InvoiceType']?.value,
          IsAutoGenerated: 'N',
          VoucherTransactionSid: null,
          CostCenter: null,
          ProfitCenter: null,
          Remarks: vd.Remarks ?? '',
          CostRevenue: isInvoice ? 'Revenue' : 'Cost',
        };
      });

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherDate: rawValue.VoucherDate,
      VoucherType: rawValue.VoucherType,
      PartyMasterSid: rawValue.PartyMasterSid,
      COAMasterSid: rawValue.COAMasterSid,
      PartyName: rawValue.PartyName,
      PartyAddress: rawValue.PartyAddress,
      CustomerBranchSid: rawValue.CustomerBranchSid,
      PlaceOfSupply: rawValue.PlaceOfSupply,
      State: rawValue.State,
      GST_VAT: rawValue.GST_VAT,
      InvoiceType: rawValue.InvoiceType,
      GSTType: rawValue.GSTType,
      TaxType: rawValue.TaxType,
      CurrencyMasterSid: rawValue.CurrencyMasterSid,
      CurrencyCode: rawValue.CurrencyCode,
      ExchangeRate: toNumber(rawValue.ExchangeRate),
      DocumentNumber: rawValue.DocumentNumber,
      DocumentDate: rawValue.DocumentDate,
      DepartmentMasterSid: rawValue.DepartmentMasterSid,
      BookingHeaderSid: rawValue.BookingHeaderSid,
      HouseJobSid: rawValue.HouseJobSid,
      HouseNumber: rawValue.HouseNumber,
      MasterJobSid: rawValue.MasterJobSid,
      MasterNumber: rawValue.MasterNumber,
      Narration: narration,
      Remarks: headerRemarks,
      Salesman: rawValue.Salesman,
      VoucherDetail: VoucherDetail,
      CreatedBy: this.userData?.userEmail,
      current_date: getDefaultTodayDate(),
      isBookingScreen: this.screenName === 'Booking',
      IsAutoPosting: this.isFieldRequired('DocumentNumber'),
      LocalCurrencyCode: companyCurrency?.code,
      LocalCurrencyMasterSid: this.currentCompany?.CurrencyMasterSid,
      YearMasterSid: currentYear,
      taxDetails: {
        CountryMasterSid: this.currentCompany?.CountryMasterSid,
        countryCode: this.currentCompanyCountryCode,
        TaxCategory: interOrIntra,
        EffectiveFrom: getDefaultTodayDate(),
        TaxType: this.selectedVoucherType === 'Invoice' ? 'Output' : 'Input',
        IsUnionTerritory: this.billingIsUnionTerritory,
        CustomerGstType: this.billingPartyBranchDetails?.CustomerGstType
          || this.billingPartyDetails?.CustomerGstType
          || ''
      }
    };

    // Create voucher
    this.operationService.createVoucher(payload).subscribe({
      next: (resp: any) => {
        if (!resp.status) {
          const msg = Array.isArray(resp.message)
            ? sortValidationErrors(resp.message).join('\n')
            : resp.message;
          console.error('Voucher generation error', msg);
          this.appSettingService.showError(msg);
          this.spinner.hide();
          return;
        } else {
          const voucherNumber = resp.data.VoucherNumber;
          const voucherHeaderSid = resp.data.VoucherHeaderSid;
          this.appSettingService.showSuccess(`Voucher generated successfully! Voucher Number: ${voucherNumber}`);
          this.reloadParent.emit(this.routeParentSid);
          this.chargeSelectionModalRef.close();

          if (voucherHeaderSid) {
            const targetRoute = this.selectedVoucherType === 'Vendor Invoice'
              ? '/operation/vendor-invoice/entry'
              : '/operation/invoice/entry';

            const joinedWords = this.screenName.split(' ').join('');
            const key = `${joinedWords}Id`;
            this.router.navigate([targetRoute, voucherHeaderSid], {
              queryParams: {
                from: joinedWords,
                [key]: this.routeParentSid,
              }
            });
          }
          this.spinner.hide();
        }
      },
      error: (error) => {
        console.error(error);
        this.toaster.clear();
        const backendMessage = error?.error?.message;

        const msg = Array.isArray(backendMessage)
          ? sortValidationErrors(backendMessage).join('\n')
          : backendMessage || 'Something went wrong. Please try again.';

        this.appSettingService.showError(msg);
        this.spinner.hide();
      }
    });
  }

  cancelChargeSelection() {
    this.chargeSelectionModalRef?.close();
    this.selectedCharges.clear();
    this.availableCharges = [];
  }


  
  // SECTION - 7 (Generate Voucher Helpers)
  
  private getCompanyState(): string {
    if (!this.currentCompany) {
      console.warn('No current company data available');
      return '';
    }

    const branchState = this.currentBranch?.stateMaster?.stateName;
    if (branchState) {
      return branchState;
    }

    // Method 1: Return already fetched name first (Mostly passed here itself)
    if (this.currentBranchStateName) {
      return this.currentBranchStateName;
    }


    // Method 2 : Get State Name from currentBranch itself
    if (this.currentBranch) {
      this.currentBranchStateName = this.currentBranch.stateMaster.stateName;
      if (this.currentBranchStateName) {
        return this.currentBranchStateName;
      }
    }

    // None of them passed
    this.currentBranchStateName = '';
    console.error('No company state found');
    return this.currentBranchStateName;
  }

  get selectedDetailCount(): number {
    return this.details.controls.filter(control => control.get('isSelected')?.value).length;
  }


  /** 
   *  Determine Place Of Supply (billing party state name )
   */
  private determinePlaceOfSupply() : string {
    if(!this.billingPartyBranchDetails){
      return '';
    }

    // Overseas party → Place of Supply is the seller's (company's) state
    const customerCountry = this.getCustomerCountry()?.toLowerCase();
    if (customerCountry && customerCountry !== this.currentCompanyCountryCode) {
      return this.currentBranchStateName || '';
    }

    return this.billingPartyBranchDetails?.stateMaster?.stateName;
  }

  private determineTaxType(
    customer: any,
    customerBranch: any,
    placeOfSupply: string,
    gstVat: string
  ) : string {
    if (!this.isIndianCompany()) {
      return 'VAT';
    }

    if (!placeOfSupply) {
      return '';
    }

    const classification = this.taxCalculationService.updateParty(
      this.buildVoucherPartyTaxProfile(customer, customerBranch, placeOfSupply, gstVat),
      this.voucher['InvoiceType']?.value as any
    );

    return classification.formGSTType || '';
  }

  private buildVoucherPartyTaxProfile(
    customer?: any,
    customerBranch?: any,
    placeOfSupply?: string,
    gstVat?: string
  ) {
    return {
      countryCode: this.getCustomerCountry() || this.currentCompanyCountryCode,
      stateName:
        placeOfSupply ||
        this.billingPartyBranchDetails?.stateMaster?.stateName ||
        this.voucher['PlaceOfSupply']?.value ||
        '',
      stateMasterSid:
        customerBranch?.stateMaster?.StateMasterSid ||
        this.billingPartyBranchDetails?.stateMaster?.StateMasterSid,
      gstNumber: gstVat ?? this.voucher['GST_VAT']?.value ?? '',
      customerGstType:
        customerBranch?.CustomerGstType ||
        customer?.CustomerGstType ||
        this.billingPartyBranchDetails?.CustomerGstType ||
        this.billingPartyDetails?.CustomerGstType ||
        'Regular',
      isUnionTerritory:
        customerBranch?.stateMaster?.IsUnionTerritory === 'Y' ||
        this.billingIsUnionTerritory,
      selectedGstType: this.voucher['GSTType']?.value || '',
    };
  }

  private refreshVoucherTaxClassification(invoiceType?: any) {
    return this.taxCalculationService.updateParty(
      this.buildVoucherPartyTaxProfile(),
      (invoiceType ?? this.voucher['InvoiceType']?.value) as any
    );
  }

  private recalculateVoucherTaxes() {
    this.details.controls.forEach((_, index) => {
      this.calculateTaxAmountForRow(index);
    });
  }

  determineTaxApplicable(): string {
    const mode = this.taxCalculationService.context?.appliedTaxMode;

    if (mode === 'CGST_SGST') {
      return 'CGST+SGST';
    }

    if (mode === 'CGST_UGST') {
      return 'CGST+UGST';
    }

    if (mode === 'IGST') {
      return 'IGST';
    }

    if (mode === 'VAT') {
      return 'VAT';
    }

    if (this.isIndianCompany()) {
      return 'IGST';
    }

    if (this.isUAECompany()) {
      return 'VAT';
    }

    return this.isIndianCompany() ? 'GST' : 'VAT';
  }

  private autoGenerateNarration(): string {
    const segment = this.parentFormValue?.Segment || '';
    if (this.currentCompany?.CompanyMasterSid === 12 || this.currentCompany?.CompanyMasterSid === 1) {
      if (this.screenName === 'Booking') {
        const BookingNo = this.parentFormValue?.BookingNumber || '';
        return `Booking No : ${BookingNo}`;
      }
      else if (this.screenName === 'Master Job' || this.screenName === 'Master Air Waybill') {
        const MBLNo = this.parentFormValue?.MBLNo || '';
        return `${segment === 'AIR' ? 'MAWBNo' : 'MBLNo'} : ${MBLNo}`;
      }
      else if (this.screenName === 'House Job' || this.screenName === 'House Air Waybill' || this.screenName === 'Service Job') {
        const MBLNo = this.parentFormValue?.MBLNo || '';
        if(MBLNo){
          return `${segment === 'AIR' ? 'MAWBNo' : 'MBLNo'} : ${MBLNo}`;
        } else {
          return `${segment === 'AIR' ? 'HAWBNo' : 'HBLNo'} : ${this.parentFormValue?.HBLNo}`;
        }
      }
    }
    let narration = '';
    if (this.screenName === 'Booking') {
      // Booking: "Booking No. XXXX, Dt. XXXX"
      const bookingNo = this.parentFormValue?.BookingNumber;
      const bookingDate = this.parentFormValue?.BookingDate || new Date().toLocaleDateString();
      narration = `${bookingNo}`;
    } else if (this.screenName === 'Master Job' || this.screenName === 'Master Air Waybill') {
      // Master Job only (no house job)
      const mblNo = this.parentFormValue?.MBLNo;
      const masterJobNo = this.parentFormValue?.MasterJobNumber;

      // Determine if Air or Sea based on segment
      const segment = this.parentFormValue?.Segment || '';
      const mblPrefix = segment === 'AIR' ? 'MAWB' : 'MBL';
      let parts = [];
      if (mblNo) {
        parts.push(`${mblPrefix}-${mblNo}`);
      }
      if (masterJobNo) {
        parts.push(`Job No-${masterJobNo}`);
      }
      narration = parts.join(' ');
    } else if (this.screenName === 'House Job' || this.screenName === 'House Air Waybill') {
      // Master Job + House Job
      const hblNo = this.parentFormValue?.HBLNo;
      const masterJobNo = this.parentFormValue?.MasterJobNumber;
      const segment = this.parentFormValue?.Segment || '';
      const hblPrefix = segment === 'AIR' ? 'HAWB' : 'HBL';

      let parts = [];
      if (hblNo) {
        parts.push(`${hblPrefix}-${hblNo}`);
      }
      if (masterJobNo) {
        parts.push(`Job No-${masterJobNo}`);
      }
      narration = parts.join(' ');
    } else {
      // Default narration
      narration = `Voucher generated from ${this.screenName} ${this.ParentSid}`.substring(0, 250);
    }
    return narration;
  }

  // Add this method to check if current company is in India
  isIndianCompany(): boolean {
    return this.taxCalculationService.isIndiaGST;
  }

  // Add this method to check if current company is in UAE
  isUAECompany(): boolean {
    return this.currentCompanyCountryCode === 'ae';
  }

  isUSCompany(): boolean {
    return this.currentCompanyCountryCode === 'us';
  }

  isUAECustomer(companyCountry: string): boolean {
    const normalized = (companyCountry || '').trim().toLowerCase();
    return normalized === 'united arab emirates' || normalized === 'uae' || normalized === 'ae';
  }

  getCustomerCountry(): string {
    if(!this.billingPartyDetails) return '';
    return this.billingPartyDetails.countryMaster?.countryCode || '';
  }


isVoucherGenerationAllowed(): boolean {
    if (this.screenName !== 'Booking') {
        return true;
    }
    
    const status = this.parentFormValue?.status;
    return status === 'Active' || status === 'A';
}
isHBLNoValid(): boolean {
    if (this.screenName !== 'Booking') {
        return true;
    }
    
    const HBLNo = this.parentFormValue?.HBLNo;
    // Return true when HBLNo is null/undefined/empty (button enabled)
    // Return false when HBLNo has a value (button disabled)
    return !HBLNo;
}
isFromQuotation(index: number): boolean {
  const formGroup = this.rateFormArray.at(index) as FormGroup;
  return !!formGroup.get('isFromQuotation')?.value;
}


  //!SECTION - 8 : Standard Charge Related

  getStdChargeModal() {
    const modalRef = this.modalService.open(GetStandardChargesComponent, {
      size: 'xl',
      scrollable: true,
    });

    modalRef.componentInstance.parentFormValue = this.parentFormValue;
    modalRef.componentInstance.currentCompany = this.currentCompany;
    modalRef.componentInstance.currentBranch = this.currentBranch;
    modalRef.componentInstance.chargeList = this.chargeList;
    modalRef.componentInstance.uomList = this.uomList;
    modalRef.componentInstance.currencyList = this.currencyList;

    // Handle single charge selection (original functionality)
    modalRef.componentInstance.chargeSelected.subscribe((selectedCharge: any) => {
      console.log('Standard charge selected from modal:', selectedCharge);
      this.patchStandardChargeToRateForm(selectedCharge);
    });

    // Handle multiple charge selection (new functionality)
    modalRef.componentInstance.chargesSelected.subscribe((selectedCharges: any[]) => {
      console.log('Multiple standard charges selected:', selectedCharges);
      this.patchMultipleStandardCharges(selectedCharges);
    });
  }

  // Add this new method to handle multiple charges
  patchMultipleStandardCharges(charges: any[]) {
    console.log('Patching multiple standard charges:', charges.length);

    charges.forEach((charge, index) => {
      // Add new row for each selected charge
      this.addRateRow();

      // Patch the charge data to the last row (which we just added)
      const lastIndex = this.rateFormArray.length - 1;
      const rateGroup = this.rateFormArray.at(lastIndex) as FormGroup;

      // Patch the charge data
      rateGroup.patchValue({
        RateSid: null,
        ChargeMasterSid: charge.ChargeMasterSid,
        ChargeDescription: charge.ChargeDescription,
        ChargeUomSid: charge.ChargeUomSid,
        RevenueChargeUomSid: charge.RevenueChargeUomSid,
        CostChargeUomSid: charge.CostChargeUomSid,
        NoOfUnit: 1,
        RevenueNumberOfUnit: 1,
        CostNumberOfUnit: 1,

        // Revenue side
        RevenueCurrencyMasterSid: charge.RevenueCurrencyMasterSid,
        RevenueAmount: charge.RevenueAmount,
        RevenueRate: charge.RevenueAmount,
        RevenueLocalAmount: null,
        RevenueExchangeRate: null,
        RevenueDrCr: 'C',
        RevenuePrepaidCollect: 'Prepaid',

        // Cost side
        CostCurrencyMasterSid: charge.CostCurrencyMasterSid,
        CostAmount: charge.CostAmount,
        CostRate: charge.CostAmount,
        CostLocalAmount: null,
        CostExchangeRate: null,
        CostDrCr: 'D',
        CostPrepaidCollect: 'Prepaid',

        Remarks: charge.Remarks || `Standard Charge - ${charge.CargoType}`
      });

      // Get currency objects to fetch exchange rates
      const revenueCurrency = this.currencyList.find(c => c.CurrencyMasterSid === charge.RevenueCurrencyMasterSid);
      const costCurrency = this.currencyList.find(c => c.CurrencyMasterSid === charge.CostCurrencyMasterSid);

      // Fetch exchange rates if currencies exist
      if (revenueCurrency) {
        this.getRevenueExchangeRate(lastIndex, revenueCurrency);
      }
      if (costCurrency) {
        this.getCostExchangeRate(lastIndex, costCurrency);
      }

      // Trigger calculations
      this.calculateRevenueAmount(lastIndex);
      this.calculateCostAmount(lastIndex);
    });

    this.calculateProfit();
  }

  patchStandardChargeToRateForm(charge: any) {
    // Create the charge data object that matches your rate form structure
    const chargeData = {
      RateSid: null,
      ChargeMasterSid: charge.ChargeMasterSid,
      ChargeDescription: charge.ChargeDescription,
      ChargeUomSid: charge.UomSid,
      RevenueChargeUomSid: charge.UomSid,
      CostChargeUomSid: charge.UomSid,
      NoOfUnit: 1,
      RevenueNumberOfUnit: 1,
      CostNumberOfUnit: 1,

      // Revenue side
      RevenueCurrencyMasterSid: charge.SaleCurrency,
      RevenueAmount: charge.SaleAmount,
      RevenueRate: charge.SaleAmount, // Assuming rate = amount when NoOfUnit = 1
      RevenueLocalAmount: null, // Will be calculated
      RevenueExchangeRate: null, // Will be fetched
      RevenueDrCr: 'C',
      RevenuePrepaidCollect: 'Prepaid',

      // Cost side
      CostCurrencyMasterSid: charge.CostCurrency,
      CostAmount: charge.CostAmount,
      CostRate: charge.CostAmount, // Assuming rate = amount when NoOfUnit = 1
      CostLocalAmount: null, // Will be calculated
      CostExchangeRate: null, // Will be fetched
      CostDrCr: 'D',
      CostPrepaidCollect: 'Prepaid',

      // Additional info
      Remarks: charge.Remarks || `Standard Charge - ${charge.CargoType}`,
      CargoType: charge.CargoType
    };

    // Check if last row is empty
    if (this.checkIfLastChargeEmpty()) {
      const lastIndex = this.rateFormArray.length - 1;
      const rateGroup = this.rateFormArray.at(lastIndex) as FormGroup;

      // Patch the charge data
      rateGroup.patchValue(chargeData);

      // Get currency objects to fetch exchange rates
      const revenueCurrency = this.currencyList.find(c => c.CurrencyMasterSid === charge.SaleCurrency);
      const costCurrency = this.currencyList.find(c => c.CurrencyMasterSid === charge.CostCurrency);

      // Fetch exchange rates if currencies exist
      if (revenueCurrency) {
        this.getRevenueExchangeRate(lastIndex, revenueCurrency);
      }
      if (costCurrency) {
        this.getCostExchangeRate(lastIndex, costCurrency);
      }

      // Trigger calculations
      this.calculateRevenueAmount(lastIndex);
      this.calculateCostAmount(lastIndex);

    } else {
      // Add new row with the charge data
      this.addRateRow(chargeData);

      // After adding, get the new row index and fetch exchange rates
      setTimeout(() => {
        const newIndex = this.rateFormArray.length - 1;
        const revenueCurrency = this.currencyList.find(c => c.CurrencyMasterSid === charge.SaleCurrency);
        const costCurrency = this.currencyList.find(c => c.CurrencyMasterSid === charge.CostCurrency);

        if (revenueCurrency) {
          this.getRevenueExchangeRate(newIndex, revenueCurrency);
        }
        if (costCurrency) {
          this.getCostExchangeRate(newIndex, costCurrency);
        }

        // Trigger calculations
        this.calculateRevenueAmount(newIndex);
        this.calculateCostAmount(newIndex);
      }, 100);
    }

    this.calculateProfit();
  }

  getVoucherValidationConfig() {
    const isInvoice = this.selectedVoucherType === 'Invoice';
    return {
      labels: {
        /* ------------ Header ------------ */
        VoucherNumber: 'Voucher Number',
        VoucherDate: 'Voucher Date',
        PostDate: 'Post Date',
        Narration: 'Narration',

        PartyMasterSid: 'Party',
        PartyName: 'Party Name',
        PartyAddress: 'Party Address',
        CustomerBranchSid: 'Customer Branch',
        PlaceOfSupply: 'Place of Supply',
        DepartmentMasterSid: 'Department',

        COAMasterSid: 'Ledger',
        CurrencyMasterSid: 'Currency',
        CurrencyCode: 'Currency Code',
        ExchangeRate: 'Exchange Rate',

        HouseJobSid: 'House Job',
        MasterJobSid: 'Master Job',
        BookingHeaderSid: 'Booking Number',

        DocumentNumber : isInvoice ? 'Ref No' : 'Bill No',
        DocumentDate : 'Bill Date',

        /* ------------ Details (FormArray) ------------ */
        'voucherDetails.ChargeMasterSid': 'Charge',
        'voucherDetails.LedgerMasterSid': 'Ledger',
        'voucherDetails.COAMasterSid': 'COA',
        'voucherDetails.HSSACMasterSid': 'HS / SAC Code',
        'voucherDetails.ChargeUOMSid': 'UOM',
        'voucherDetails.NumberOfUnit': 'Number of Units',
        'voucherDetails.CurrencyMasterSid': 'Currency',
        'voucherDetails.CurrencyCode': 'Currency Code',
        'voucherDetails.ExchangeRate': 'Exchange Rate',
        'voucherDetails.DrCr': 'Debit / Credit',
        'voucherDetails.Rate': 'Rate',
        'voucherDetails.Amount': 'Amount',
        'voucherDetails.LocalAmount': 'Local Amount',
        'voucherDetails.PartyAmount': 'Party Amount',
        'voucherDetails.HouseJobSid': 'House Job',
        'voucherDetails.MasterJobSid': 'Master Job',
      },

      messages: {
        required: (label: string) => `${label} is required`,
        min: (label: string, err: any) =>
          `${label} must be greater than ${err.min}`,
        minlength: (label: string, err: any) =>
          `${label} must be at least ${err.requiredLength} characters`,
        maxlength: (label: string, err: any) =>
          `${label} must not exceed ${err.requiredLength} characters`,
        pattern: (label: string) =>
          `${label} format is invalid`,
        default: (label: string) =>
          `${label} is invalid`,
      }
    };
  }

  private getHeaderAndSelectedDetailsForm(): FormGroup {
    // Filter ONLY selected detail FormGroups
    const selectedDetails = this.details.controls.filter((ctrl: AbstractControl) =>
      ctrl.get('isSelected')?.value === true
    ) as FormGroup[];

    // Screen-specific conditional validators (reuse your logic)
    const isBookingFieldsRequired = this.isCurrentScreen('Booking');
    const isHouseFieldsRequired = this.isCurrentScreen('House Job') || this.isCurrentScreen('House Air Waybill') || this.isCurrentScreen('Agent Master Air Waybill');
    const isMasterFieldsRequired = this.isCurrentScreen('Master Job') || this.isCurrentScreen('Master Air Waybill');

    return this.fb.group({
      // ALL required header fields from your voucherForm (preserves validators)
      PartyMasterSid: [this.voucherForm.get('PartyMasterSid')?.value, [Validators.required]],
      COAMasterSid: [this.voucherForm.get('COAMasterSid')?.value, [Validators.required]],
      PartyName: [this.voucherForm.get('PartyName')?.value, [Validators.required]],
      PartyAddress: [this.voucherForm.get('PartyAddress')?.value, [Validators.required]],
      CustomerBranchSid: [this.voucherForm.get('CustomerBranchSid')?.value, [Validators.required]],
      PlaceOfSupply: [this.voucherForm.get('PlaceOfSupply')?.value, [Validators.required]],
      DepartmentMasterSid: [this.voucherForm.get('DepartmentMasterSid')?.value, [Validators.required]],
      CurrencyMasterSid: [this.voucherForm.get('CurrencyMasterSid')?.value, [Validators.required]],
      CurrencyCode: [this.voucherForm.get('CurrencyCode')?.value, [Validators.required]],
      ExchangeRate: [this.voucherForm.get('ExchangeRate')?.value, [Validators.required, greaterThanZero()]],

      // Conditional header fields (matching your initVoucherForm logic)
      HouseJobSid: [this.voucherForm.get('HouseJobSid')?.value, isHouseFieldsRequired ? [Validators.required] : []],
      MasterJobSid: [this.voucherForm.get('MasterJobSid')?.value, (isMasterFieldsRequired) ? [Validators.required] : []],
      BookingHeaderSid: [this.voucherForm.get('BookingHeaderSid')?.value, isBookingFieldsRequired ? [Validators.required] : []],

      // Optional but commonly validated fields
      DocumentNumber: [this.voucherForm.get('DocumentNumber')?.value , this.selectedVoucherType === 'Vendor Invoice' && this.isFieldRequired('DocumentNumber') ? [Validators.required] : []],
      DocumentDate: [this.voucherForm.get('DocumentDate')?.value , this.selectedVoucherType === 'Vendor Invoice' && this.isFieldRequired('DocumentDate') ? [Validators.required] : []],
      State: [this.voucherForm.get('State')?.value],
      GST_VAT: [this.voucherForm.get('GST_VAT')?.value],

      // Scoped details FormArray (reuses ORIGINAL detail validators)
      details: this.fb.array(selectedDetails, { validators: [] })
    }, {
      // Preserve form-level validators if needed
      validators: [consistentExchangeRatesValidator(
        this.currentCompany?.CurrencyMasterSid,
        this.currentCompanyCurrency?.code
      )]
    });
  }


}
