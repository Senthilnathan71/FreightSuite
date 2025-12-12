import { Component, ViewChild, TemplateRef, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { OperationService } from '../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';
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
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { ToastrService } from 'ngx-toastr';
import { toNumber } from 'src/app/common/helper';

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
    OnlyNumbersDirective,
    TextWithNumbersDirective,
    NumberFormatPipe,
    SearchableDropdown,
    SearchableDropdownModal,
    NgxSpinnerModule,
    FormsModule,
    NgbTooltipModule
  ],
  templateUrl: './cost-entry.component.html',
  styleUrls: ['./cost-entry.component.scss'],
  providers: [
    CustomDatePipe
  ]
})
export class CostEntryComponent implements OnInit {

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

  ppcc = [
    { id: 1, name: 'Prepaid' },
    { id: 2, name: 'Collect' }
  ]
  drcr = [
    { id: 1, name: 'D', value: 'D' },
    { id: 2, name: 'C', value: 'C' }
  ]

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
    if(tab === "Profit"){
      this.calculateProfit();
    }
    this.selectedTab = tab;
  }

  @Input() screenName: string;
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
      this.slicedCostFormArray = [];
      this.slicedRevenueFormArray = [];
    }
  }
  get dataItems(): any[] {
    return this._dataItems;
  }

  parentFormValue: any = {};
  @Input()
  set formData(value: any) {
    if (value) {
      console.log("Parent Value Changed",value);
      this.parentFormValue = value;
      this.setParentData(value);
      this.filterDepartmentBasedOnSegment(this.parentFormValue?.departmentName);
    } else {
      this.parentFormValue = {};
    }
  }

  setParentData(value){
    this.countryOfCompany = value.countryOfCompany;
    this.ParentSid = this.getParentSid();
    this.isEditMode = this.ParentSid !== null;
  }

  private _stateList: any[] = [];

@Input()
set stateList(value: any[]) {
  this._stateList = value || [];
}

get stateList(): any[] {
  return this._stateList;
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
  currentVoucherTypeFilter: 'revenue' | 'cost' = 'revenue';
  @ViewChild('voucherTypeModal') voucherTypeModal!: TemplateRef<any>;
  @ViewChild('billingPartyModal') billingPartyModal!: TemplateRef<any>;
  @ViewChild('chargeSelectionModal') chargeSelectionModal!: TemplateRef<any>;

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
  invoiceHeaderCurrency: any = null;
  invoiceHeaderExchangeRate: number = 1;
  selectedTaxCategory : string = 'VAT'
  billingPartyDetails: any = null;
  billingPartyBranchDetails : any = null;
  billingPartyAddress: string = '';
  billingGST_VAT: string = '';
  taxGroupList: any[] = [];
  currentCountry: Number;
  currentCountryName:string;
  currentBranchstate:string;
  chargeTaxGroupMap: Map<number, any[]> = new Map(); // Map of BookingRatesSid to selected tax group
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
    private taxCalculationService: TaxCalculationService,
    private companySettings: CompanySettingsManagerService,
    private masterService: MasterService,
    private router : Router,
    private toaster: ToastrService
  ) { this.initRateForm();}

  ngOnInit(): void {
  this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
  this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
  this.currentBranchstate = this.currentBranch?.StateMasterSid;
  
  // Get user data first
  this.userData = this.appSettingService.getDecryptedUserProfile();
  
  // ✅ FIX: Follow the same pattern as OrganizationEntryComponent
  if (this.currentCompany && this.userData?.userCompanyMaster) {
    // Find the company record in user's company master list
    const companyRecord = this.userData.userCompanyMaster.find(
      (c: any) => c.CompanyMasterSid === this.currentCompany.CompanyMasterSid
    );
    // Update currentCompany with the full companyMaster object
    this.currentCompany = companyRecord?.companyMaster || this.currentCompany;
    
    if (this.currentBranch && this.currentCompany?.userBranchMaster) {
      const branchRecord = this.currentCompany.userBranchMaster.find(
        (b: any) => b.BranchMasterSid === this.currentBranch.BranchMasterSid
      );
      this.currentBranch = branchRecord?.branchMaster || this.currentBranch;
    }
    
    // Now get the country information
    this.currentCountry = Number(this.currentCompany?.CountryMasterSid);
    this.currentCountryName = this.currentCompany?.countryMaster?.countryName;
  }
  
  console.log("CURRENT COUNTRY NAME", this.currentCountryName);
  console.log("currentCountry", this.currentCountry);
  
  this.isBooking = this.screenName === "Booking";
  this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
  
  // The line below is redundant since we already updated currentCompany above
  // Remove or keep as fallback:
  // this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;

  // Extract BookingHeaderSid from route parameter
  this.route.params.subscribe(params => {
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

  this.rateFormArray.valueChanges.subscribe(() => {
    this.validateExchangeRates();
    this.dataEmitter.emit(this.rateFormArray.getRawValue());
    this.calculateProfit();
  });

  // If dataItems was set before ngOnInit, process them now
  if (this._dataItems && this._dataItems.length > 0) {
    this.patchValues(this._dataItems);
  }
}
  ngOnChanges(){
    if(!this.dataItems){
      this.addRateRow()
    }
  }

  loadRateLookups() {
    forkJoin({
      allMasters: this.operationService.getAllBookingRateLookups(this.filterOption).pipe(catchError(err => of({ charges: [], uoms: [], docTypes: [] }))),
      charges: this.operationService.getAllCharges(this.currentCompany?.CompanyMasterSid).pipe(catchError(err => of([]))),
      revenueParties : this.operationService.getAllDebtorWithCOAMapped({CompanyMasterSid: this.currentCompany?.CompanyMasterSid}).pipe(catchError(err => of([]))),
      costParties : this.operationService.getAllCreditorWithCOAMapped({CompanyMasterSid: this.currentCompany?.CompanyMasterSid}).pipe(catchError(err => of([]))),
      states :this.operationService.getAllState().pipe(catchError(err => of([]))),
    }).subscribe(({ allMasters , charges , revenueParties, costParties, states }) => {
      this.chargeList = charges;
      this.filterDepartmentBasedOnSegment(this.parentFormValue?.departmentName);
      this.uomList = allMasters.uoms;
      this.docTypeList = allMasters.docTypes;
      this.stateList = states?.data || states || [];
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
    console.log(this.rateFormArray.getRawValue())
    if (!this.rateFormArray || this.rateFormArray.length === 0) {
      this.appSettingService.showWarning('No rate entries found.');
      this.validationResult.emit(false);
      return false;
    }
    if (this.rateFormArray.invalid) {
      this.rateFormArray.markAllAsTouched();
      this.rateFormArray.updateValueAndValidity();
      this.appSettingService.showError("Please fill all the required fields correctly");
      this.validationResult.emit(false);
      return false;
    }

    for (let rateIndex = 0; rateIndex < this.rateFormArray.length; rateIndex++) {
      const rate = this.rateFormArray.at(rateIndex) as FormGroup;

      const requiredFields = [
        'ChargeMasterSid',
        'ChargeDescription',
        'ChargeUomSid',
        'NoOfUnit'
      ];

      const hasAllRequired = requiredFields.every(field => {
        const control = rate.get(field);
        control?.markAsTouched();
        control?.updateValueAndValidity();
        return !!control?.value;
      });

      if (!hasAllRequired) {
        this.appSettingService.showWarning(
          `[SNo: ${rateIndex + 1}] Please fill all required mandatory (*) fields.`
        );
        this.validationResult.emit(false);
        return false;
      }

      const hasLocalAmountAtLeastOneSide =
        !!Number(rate.get('CostLocalAmount')?.value) || !!Number(rate.get('RevenueLocalAmount')?.value);

      if (!hasLocalAmountAtLeastOneSide) {
        this.appSettingService.showWarning(
          `[Sno: ${rateIndex + 1}] Please fill at least one side: either Revenue or Cost.`
        );
        this.validationResult.emit(false);
        return false;
      }

      // Validate Cost side
      if (!Number(rate.get('CostLocalAmount')?.value)) {
        const hasCostCurrency = !!rate.get('CostCurrencyMasterSid')?.value;
        const hasCostExchangeRate = rate.get('CostExchangeRate')?.value != null;
        const hasCostRate = !!rate.get('CostRate')?.value;

        if (hasCostCurrency || !hasCostExchangeRate) {
          this.appSettingService.showWarning(
            `[Sno: ${rateIndex + 1}] Please fill Exchange Rate for cost currency.`
          );
          this.validationResult.emit(false);
          return false;
        }

        if (hasCostExchangeRate && !hasCostRate) {
          this.appSettingService.showWarning(
            `[Sno: ${rateIndex + 1}] Please fill Cost Per Unit Rate.`
          );
          this.validationResult.emit(false);
          return false;
        }
      } else {

      }

      // Validate Revenue side
      if (!Number(rate.get('RevenueLocalAmount')?.value)) {
        const hasRevenueCurrency = !!rate.get('RevenueCurrencyMasterSid')?.value;
        const hasRevenueExchangeRate = rate.get('RevenueExchangeRate')?.value != null;
        const hasRevenueRate = !!rate.get('RevenueRate')?.value;

        if (hasRevenueCurrency || !hasRevenueExchangeRate) {
          this.appSettingService.showWarning(
            `[Row: ${rateIndex + 1}] Please select Exchange Rate for Revenue currency.`
          );
          this.validationResult.emit(false);
          return false;
        }

        if (!hasRevenueRate) {
          this.appSettingService.showWarning(
            `[Row: ${rateIndex + 1}] Please fill Revenue Per Unit Rate.`
          );
          this.validationResult.emit(false);
          return false;
        }
      }
    }

    // ✅ Always return true if all checks passed
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
    ChargeMasterSid: [data?.ChargeMasterSid ?? null],
    ChargeDescription: [data?.ChargeDescription ?? null],

    ChargeUomSid : [(data?.ChargeUomSid || data?.RevenueChargeUomSid || data?.CostChargeUomSid) ?? null],
    RevenueChargeUomSid:[(data?.RevenueChargeUomSid || data?.ChargeUomSid) ?? null],
    CostChargeUomSid:[(data?.CostChargeUomSid || data?.ChargeUomSid) ?? null],

    NoOfUnit: [(data?.NoOfUnit || data?.RevenueNumberOfUnit || data?.CostNumberOfUnit) ?? ''],
    RevenueNumberOfUnit:[(data?.RevenueNumberOfUnit || data?.NoOfUnit) ?? ''],
    CostNumberOfUnit: [(data?.CostNumberOfUnit || data?.NoOfUnit) ?? ''],
    
    // Revenue Fields
    RevenueCurrencyMasterSid: [data?.RevenueCurrencyMasterSid ?? null],
    RevenueExchangeRate: [data?.RevenueExchangeRate != null ? Number(data.RevenueExchangeRate) : ''],
    RevenueRate: [data?.RevenueRate != null ? Number(data.RevenueRate) : ''],
    RevenueAmount: [data?.RevenueAmount != null ? Number(data.RevenueAmount) : ''],
    RevenueLocalAmount: [data?.RevenueLocalAmount != null ? Number(data.RevenueLocalAmount): ''],
    RevenueDrCr: [data?.RevenueDrCr ?? 'C'],
    RevenueCustomerMasterSid: [data?.RevenueCustomerMasterSid ?? null],
    RevenueCustomerBranchSid: [data?.RevenueCustomerBranchSid ?? null],
    RevenuePrepaidCollect:[data?.RevenuePrepaidCollect ?? "Prepaid"],
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
    BookingRateSid : [data?.RateSid ?? null],
    unitQtyBasis: [data?.UnitQty || null],  // Store unit quantity basis for taking no of unit from parent
    _costVoucherHeaderSid: [data?.CostVoucherHeaderSid ?? null], // Store actual IDs separately for validation
    _revenueVoucherHeaderSid: [data?.RevenueVoucherHeaderSid ?? null] // Store actual IDs separately for validation
  });
  form.get('NoOfUnit')?.valueChanges.subscribe((value) => {
    form.get('RevenueNumberOfUnit')?.setValue(value);
    form.get('CostNumberOfUnit')?.setValue(value);
  });
  form.get('ChargeUomSid')?.valueChanges.subscribe((value) => {
    form.get('RevenueChargeUomSid')?.setValue(value);
    form.get('CostChargeUomSid')?.setValue(value);
  });
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

    // Check if voucher exists
    // Check the hidden ID fields for voucher existence
    if (formGroup.get('_costVoucherHeaderSid')?.value || formGroup.get('_revenueVoucherHeaderSid')?.value) {
      this.appSettingService.showWarning('Cannot delete rate. Voucher already generated for this rate.');
      return;
    }

    if (RatesSid) {
      const api = this.isBooking ?
      this.operationService.deleteBookingRate(RatesSid) :
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

    formGroup.patchValue({
      ChargeMasterSid: charge.ChargeMasterSid,
      ChargeDescription: charge.chargeName,
      unitQtyBasis: charge.UnitQty,
      RevenueCurrencyMasterSid: charge.CurrencyMasterSid,
      CostCurrencyMasterSid: charge.CurrencyMasterSid,
      ChargeUomSid: charge.UOM,
      RevenueChargeUomSid: charge.UOM,
      CostChargeUomSid: charge.UOM,
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

    const toCurrency = Number(this.currentCompany?.CurrencyMasterSid);
    const fromCurrencyCode = currency?.currencyCode;
    const toCurrencyCode = this.currencyList.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode;

    if (!fromCurrencyCode || !toCurrencyCode) return;

    if (fromCurrencyCode === toCurrencyCode) {
      const formGroup = this.rateFormArray.at(index) as FormGroup;
      formGroup.patchValue({ CostExchangeRate: this.getFormattedExchangeRate(1, fromCurrencyCode), });
      formGroup.get('CostExchangeRate')?.disable();
      this.calculateCostLocalAmount(index);
      return;
    }

    const payload = { fromCurrencyCode, toCurrencyCode ,segment: 'cost' };
    this.operationService.getExchangeRate(payload).subscribe(
      (resp: any) => {
        if (resp.status && resp.data) {
          const formGroup = this.rateFormArray.at(index) as FormGroup;
          formGroup.get('CostExchangeRate')?.enable();
          formGroup.patchValue({ CostExchangeRate: this.getFormattedExchangeRate(Number(resp.data), fromCurrencyCode), });
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
    const toCurrency = Number(this.currentCompany?.CurrencyMasterSid);
    const fromCurrencyCode = currency?.currencyCode;
    const toCurrencyCode = this.currencyList.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode;
    if (!fromCurrencyCode || !toCurrencyCode) return;

    if (fromCurrencyCode === toCurrencyCode) {
      const formGroup = this.rateFormArray.at(index) as FormGroup;
      formGroup.patchValue({ 
        RevenueExchangeRate:  this.getFormattedExchangeRate(1, fromCurrencyCode),
      });
      formGroup.get('RevenueExchangeRate')?.disable();
      this.calculateRevenueLocalAmount(index);
      return;
    }

    const payload = { fromCurrencyCode, toCurrencyCode , segment : 'revenue'};
    this.operationService.getExchangeRate(payload).subscribe(
      (resp: any) => {
        if (resp.status && resp.data) {
          const formGroup = this.rateFormArray.at(index) as FormGroup;
          formGroup.get('RevenueExchangeRate')?.enable();
          formGroup.patchValue({ RevenueExchangeRate: this.getFormattedExchangeRate(Number(resp.data), fromCurrencyCode), });
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
    this.profitSummary = [];
    const rateFormValue = this.rateFormArray.getRawValue() || [];
    const data = [...rateFormValue];

    data.forEach(item => {
      console.log(item);
      const costAmt = parseFloat(item.CostLocalAmount);
      const revenueAmt = parseFloat(item.RevenueLocalAmount);
      const charge = this.chargeList.find(c => c.ChargeMasterSid === item.ChargeMasterSid);
      const chargeName = charge ? charge.chargeName : "Unknown";

      let existing = this.profitSummary.find(p => p.chargeName === chargeName);

      if (!existing) {
        existing = {
          chargeName,
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

  calculateTotal(field: string): number {
    return this.profitSummary.reduce((sum, item) => sum + parseFloat(item[field] || 0), 0);
  }

  calculateTotalProfitPercent(): number {
    const totalSales = this.calculateTotal('totalSales');
    const totalCost = this.calculateTotal('totalCost');
    const totalProfit = this.calculateTotal('profit');
    if (totalSales !== 0 && totalSales > totalCost) {
      return totalProfit / totalSales * 100;
    }
    return totalSales !== 0 ? (totalProfit / totalCost) * 100 : 0;
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
    return (this.docTypeList.find(docType => docType.DocumentTypeMasterSid === VoucherTypeSid)?.DocumentTypeName);
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
    this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
    this.operationService.getTariffDetails(this.parentFormValue).subscribe(
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
                RevenueLocalAmount : (Number(td.costExchangeRate) * Number(value) * Number(td.SalePerUnitPrice)).toFixed(this.digitsAfterDecimal),
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
    return;
  }

  formGroup.get('RevenueCustomerBranchSid')?.setValue(customerBranch.CustomerBranchSid);
  
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
      this.billingGST_VAT = customerMaster.PanType || '';
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
  public getExchangeRateDecimalPlaces(CurrencyMasterSid: string): number {
    const currency = this.currencyList.find(currency => currency.CurrencyMasterSid === CurrencyMasterSid);
    if (currency) {
      const config = this.currencyConfigService.getCurrencyConfig(currency.currencyCode);
      return config?.exchangeDecimal;
    }
    return 2;
  }
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
   |--------------------------------------------------
   |   Section-8: Voucher Generation Methods
   |--------------------------------------------------
   */

  openVoucherTypeModal() {
    if (!this.isEditMode || !this.rateFormArray?.length) {
      this.appSettingService.showWarning('No rates available for voucher generation');
      return;
    }

    // Open voucher type selection modal
    this.voucherTypeModalRef = this.modalService.open(this.voucherTypeModal, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
  }

  selectVoucherType(voucherType: 'Invoice' | 'Vendor Invoice') {
    this.selectedVoucherType = voucherType;
    this.voucherTypeModalRef?.close();

    // Based on voucher type, determine charges to include
    if (voucherType === 'Invoice') {
      this.processPendingCharges('revenue');
    } else {
      this.processPendingCharges('cost');
    }
  }

  private async processPendingCharges(type: 'revenue' | 'cost') {
    try {
      this.spinner.show();

      // Store the type for later use in filtering
      this.currentVoucherTypeFilter = type;

      // Get booking rates with full details including customer information
      let ratesResp;
      if (this.isBooking) {
        ratesResp = ((await firstValueFrom(this.operationService.getBookingRatesWithDetails(this.ParentSid))).data || []).map(rate =>({
          ...rate,
          RateSid : rate.BookingRatesSid,
          ParentSid : rate.BookingHeaderSid,
          RevenueCustomerMasterSid : rate.CustomerMasterSid,
          RevenueCustomerBranchSid : rate.CustomerBranchSid,
          CostAgentMasterSid : rate.AgentMasterSid,
          CostAgentBranchSid : rate.AgentBranchSid,
        }));
      } else {
        ratesResp = ((await firstValueFrom(this.operationService.getCostRevenueChargeWithDetails({
          TransactionSid: this.routeParentSid,
          MenuMasterSid: this.screenName === "HouseJob" ? -1 : this.currentMenuId,
          modelName : this.screenName  // this is the screen name. For houseJob we need this to be "houseJob"
        }))).data || []).map(rate =>({
          ...rate,
          RateSid : rate.CostRevenueChargesSid,
          ParentSid : rate.TransactionSid,
        }));
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

      console.log(`Billing Party ${partySid} (${isRevenue ? 'Revenue' : 'Cost'}):`, {
        billingPartyName: billingPartyInfo?.CustomerName,
        chargesCount: pendingCharges.length,
        charges: pendingCharges.map((c: any) => ({
          id: c.RateSid,
          desc: c.ChargeDescription,
          customerSid :c.RevenueCustomerMasterSid,
          agentSid: c.CostAgentMasterSid
        }))
      });

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
    // Show charge selection modal
    this.showChargeSelectionModal(billingPartySid, pendingCharges);
  }

  private showChargeSelectionModal(billingPartySid: number, pendingCharges: BookingRateDetails[]) {
  console.log('showChargeSelectionModal called with:', {
    billingPartySid,
    parentValue: this.parentFormValue,
    chargesCount: pendingCharges.length,
    charges: pendingCharges.map((c: any) => ({
      id: c.RateSid,
      desc: c.ChargeDescription,
      agentMasterSid: c.CostAgentMasterSid
    }))
  });

  this.currentBillingPartySid = billingPartySid;
  this.availableCharges = pendingCharges.map(charge => ({
    ...charge,
    isSelected: true // Select all by default
  }));

  console.log('Available charges set:', {
    count: this.availableCharges.length,
    charges: this.availableCharges
  });

  // Select all charges by default
  this.selectedCharges = new Set(pendingCharges.map(c => c.RateSid));

  // Initialize invoice header
  this.initializeInvoiceHeader(pendingCharges);
  this.determineGSTTypeAndPlaceOfSupply();

  // ✅ ADD THIS: Initialize tax groups for charges
  this.initializeTaxGroupsForCharges();

  // Calculate initial tax
  this.calculateChargeSelectionTax();

  // Open charge selection modal with custom extra-wide size
  this.chargeSelectionModalRef = this.modalService.open(this.chargeSelectionModal, {
    size: 'xl',
    backdrop: 'static',
    keyboard: false,
    scrollable: true
  });
}

  private initializeInvoiceHeader(charges: any[]) {
    if (!charges || charges.length === 0) {
      console.error('No charges provided to initialize invoice header');
      return;
    }

    const firstCharge = charges[0];
    const isRevenue = this.currentVoucherTypeFilter === 'revenue';

    console.log('Initializing invoice header with:', {
      firstCharge,
      isRevenue,
      currencyListLength: this.currencyList?.length
    });

    // Set billing party details
    if (isRevenue) {
      this.billingPartyDetails = firstCharge?.customerMasterBP || {};
      const branch = firstCharge?.customerBranch || {};
      this.billingPartyBranchDetails = branch;
      this.billingPartyAddress = `${branch?.Address || ''}, ${branch?.cityMaster?.cityName || ''}, ${branch?.stateMaster?.stateName || ''} ${branch?.Zip_PostBox || ''}`.trim();
    } else {
        this.billingPartyDetails = firstCharge?.AgentMaster || {};
         const branch = firstCharge?.AgentBranch || {};
         this.billingPartyBranchDetails = branch;
         this.billingPartyAddress = `${branch?.Address || ''}, ${branch?.cityMaster?.cityName || ''}, ${branch?.stateMaster?.stateName || ''} ${branch?.Zip_PostBox || ''}`.trim();
  }
  this.setGstVatForBillingParty(firstCharge, isRevenue);

    // Get company's home currency from settings (FIRST PRIORITY)
    const companyHomeCurrency = this.companySettings.getCurrencySettings();
    const companyCurrency = this.currencyList?.find(c => c?.currencyCode === companyHomeCurrency.code);

    // Fallback to charge currency if company currency not found
    const chargeCurrency = isRevenue
        ? firstCharge?.RevenueCurrencyMaster
        : firstCharge?.CostCurrencyMaster;

    this.invoiceHeaderCurrency = companyCurrency || chargeCurrency || null;

    // Set default exchange rate to 1 (company home currency)
    this.invoiceHeaderExchangeRate = 1;

    console.log('Invoice header initialized:', {
      billingParty: this.billingPartyDetails,
      address: this.billingPartyAddress,
      currency: this.invoiceHeaderCurrency,
      exchangeRate: this.invoiceHeaderExchangeRate
    });
  }

  private setGstVatForBillingParty(charge: any, isRevenue: boolean) {
    if (isRevenue) {
      // For Revenue (Invoice) - use customer data
      const customerMaster = charge?.customerMasterBP;
      const customerBranch = charge?.customerBranch;

      console.log('Revenue - Customer Data:', {
        customerMaster: customerMaster?.CustomerName,
        customerBranch: customerBranch?.BranchName,
        country: customerMaster?.countryMaster?.countryCode,
        gstNo: customerBranch?.GSTNo,
        panType: customerMaster?.PanType
      });

      if (customerMaster && customerMaster.countryMaster) {
        const countryCode = customerMaster.countryMaster.countryCode;

        if (countryCode === 'IN') {
          this.billingGST_VAT = customerBranch?.GSTNo || '';
        } else {
          this.billingGST_VAT = customerMaster?.PanType || '';
        }
      } else {
        this.billingGST_VAT = '';
      }
    } else {
      // For Cost (Vendor Invoice) - use agent data
      const agentMaster = charge?.AgentMaster;
      const agentBranch = charge?.AgentBranch;

      console.log('Cost - Agent Data:', {
        agentMaster: agentMaster?.CustomerName,
        agentBranch: agentBranch?.BranchName,
        country: agentMaster?.countryMaster?.countryCode,
        gstNo: agentBranch?.GSTNo,
        panType: agentMaster?.PanType
      });

      if (agentMaster && agentMaster.countryMaster) {
        const countryCode = agentMaster.countryMaster.countryCode;

        if (countryCode === 'IN') {
          this.billingGST_VAT = agentBranch?.GSTNo || '';
        } else {
          this.billingGST_VAT = agentMaster?.PanType || '';
        }
      } else {
        this.billingGST_VAT = '';
      }
    }

    console.log('Final GST-VAT:', this.billingGST_VAT);
  }

  /**
 * Initialize tax groups for available charges by extracting TaxGroupSid from charge data
 */
  private async initializeTaxGroupsForCharges() {
    console.log('=== INITIALIZING TAX GROUPS FOR CHARGES ===');

    this.chargeTaxGroupMap.clear();

    // Get place of supply for tax category determination
    const placeOfSupplyState = this.placeOfSupply;
    const companyState = this.getCompanyState();
    const customerCountry = this.getCustomerCountryFromCharge(this.availableCharges[0], this.selectedVoucherType === 'Invoice');
    const TaxCategory = this.determineTaxCategory(companyState, placeOfSupplyState, customerCountry);

    for (const charge of this.availableCharges) {
      const taxGroupSid = this.getTaxGroupSidFromCharge(charge);

      if (taxGroupSid) {
        try {
          // Fetch actual tax data from API immediately
          const response = await firstValueFrom(this.operationService.getLedgerForTaxGroup({
            taxGroup: taxGroupSid,
            InputOrOutput: this.selectedVoucherType === 'Invoice' ? 'Input' : 'Output',
            TaxCategory,
            CountryMasterSid: Number(this.currentCompany?.CountryMasterSid)
          }));

          console.log("Tax Group Fetch response",response);

          const taxMasters = (response?.data || []).find(tg => tg.TaxGroupSid === taxGroupSid)?.taxMaster || [];

          console.log("Tax Masters", taxMasters);

          if (taxMasters && taxMasters.length > 0) {
            if (this.chargeTaxGroupMap.has(charge.RateSid)) {
              console.log('📋 Existing tax group found for rate SID:', charge.RateSid);
              const prev = this.chargeTaxGroupMap.get(charge.RateSid);
              console.log('📋 Previous tax group:', prev);
              this.chargeTaxGroupMap.set(charge.RateSid, [...prev, ...taxMasters]);
            } else {
              console.log('📋 No existing tax group found from Map:', charge.RateSid);
              this.chargeTaxGroupMap.set(charge.RateSid, taxMasters);
            }
            console.log('🔍 Updated tax group map:', {
              size: this.chargeTaxGroupMap.size,
              entries: Array.from(this.chargeTaxGroupMap.entries())
            });
          } else {
            console.warn(`No tax data found for charge: ${charge.ChargeDescription}`);
          }
        } catch (error) {
          console.error(`Error initializing tax group for charge ${charge.RateSid}:`, error);
        }
      } else {
        console.log(`No TaxGroupSid found for charge: ${charge.ChargeDescription}`);
      }
    }

    this.calculateChargeSelectionTax();
    console.log('Tax group map after initialization:', {
      size: this.chargeTaxGroupMap.size,
      entries: this.chargeTaxGroupMap
    });
  }

  onHeaderCurrencyChange() {
    // Fetch exchange rate from CurrencyExchange table
    if (this.invoiceHeaderCurrency) {
      // Get company's home currency
      const companyHomeCurrency = this.companySettings.getCurrencySettings();
      const selectedCurrencyCode = this.invoiceHeaderCurrency?.currencyCode;

      // If selected currency is same as company currency, exchange rate is 1
      if (selectedCurrencyCode === companyHomeCurrency.code) {
        this.invoiceHeaderExchangeRate = 1;
        this.calculateChargeSelectionTax();
      } else {
        // Fetch exchange rate from CurrencyExchange table
        const payload = {
          fromCurrencyCode: companyHomeCurrency.code,
          toCurrencyCode: selectedCurrencyCode,
          segment: this.selectedVoucherType === 'Invoice' ? 'revenue' : 'cost' // Use SellRate for revenue charges
        };

        this.operationService.getExchangeRate(payload).subscribe({
          next: (response: any) => {
            if (response?.status && response?.data) {
              this.invoiceHeaderExchangeRate = Number(response.data) || 1;
            } else {
              console.warn('Exchange rate not found, defaulting to 1');
              this.invoiceHeaderExchangeRate = 1;
            }
            this.calculateChargeSelectionTax();
          },
          error: (err) => {
            console.error('Error fetching exchange rate:', err);
            this.invoiceHeaderExchangeRate = 1;
            this.calculateChargeSelectionTax();
          }
        });
      }
    }
  }


  onHeaderExchangeRateChange() {
    this.calculateChargeSelectionTax();
  }

  // onChargeTaxGroupChange(charge: any, taxGroup: any) {
  //   console.log('Tax group changed for charge:', {
  //     chargeId: charge.RateSid,
  //     chargeName: charge.ChargeDescription,
  //     newTaxGroup: taxGroup
  //   });

  //   if (taxGroup) {
  //     this.chargeTaxGroupMap.set(charge.RateSid, taxGroup);
  //   } else {
  //     this.chargeTaxGroupMap.delete(charge.RateSid);
  //   }

  //   console.log('Current tax group map size:', this.chargeTaxGroupMap.size);
  //   this.calculateChargeSelectionTax();
  // }

  // onChargeTaxGroupChangeBySid(charge: any, taxMasterSid: any) {
  //   console.log('Tax group changed by SID for charge:', {
  //     chargeId: charge.RateSid,
  //     chargeName: charge.ChargeDescription,
  //     newTaxMasterSid: taxMasterSid
  //   });

  //   if (taxMasterSid) {
  //     // Find the tax group object from the list
  //     const taxGroup = this.taxGroupList.find(tg => tg.TaxMasterSid === taxMasterSid);
  //     if (taxGroup) {
  //       this.chargeTaxGroupMap.set(charge.RateSid, taxGroup);
  //       console.log('Set tax group:', taxGroup);
  //     }
  //   } else {
  //     this.chargeTaxGroupMap.delete(charge.RateSid);
  //     console.log('Cleared tax group');
  //   }

  //   console.log('Current tax group map size:', this.chargeTaxGroupMap.size);
  //   console.log('Tax group map entries:', Array.from(this.chargeTaxGroupMap.entries()).map(([k, v]) => ({
  //     chargeId: k,
  //     taxGroup: v
  //   })));
  //   this.calculateChargeSelectionTax();
  // }

  // getSelectedTaxGroup(charge: any): any {
  //   return this.chargeTaxGroupMap.get(charge.RateSid);
  // }

  // getSelectedTaxGroupSid(charge: any): any {
  //   let taxGroup;
  //   taxGroup = this.chargeTaxGroupMap.get(charge.RateSid);
  //   return taxGroup?.TaxMasterSid || null;
  // }

  convertToHeaderCurrency(amount: number): number {
    if (!this.invoiceHeaderCurrency || !this.invoiceHeaderExchangeRate) {
      return amount;
    }
    // Convert amount to header currency using exchange rate
    return amount * this.invoiceHeaderExchangeRate;
  }

  toggleChargeSelection(charge: any) {
    const exist = this.selectedCharges.has(charge.RateSid)
    if (exist) {
      this.selectedCharges.delete(charge.RateSid);
      charge.isSelected = false;
    } else {
      this.selectedCharges.add(charge.RateSid);
      charge.isSelected = true;
    }
    this.calculateChargeSelectionTax();
  }

  selectAllCharges() {
    this.availableCharges.forEach(charge => {
      this.selectedCharges.add(charge.RateSid);
      charge.isSelected = true;
    });
    this.calculateChargeSelectionTax();
  }

  deselectAllCharges() {
    this.selectedCharges.clear();
    this.availableCharges.forEach(charge => {
      charge.isSelected = false;
    });
    this.calculateChargeSelectionTax();
  }

  calculateChargeSelectionTax() {
    const selectedChargeData = this.availableCharges.filter(c => this.selectedCharges.has(c.RateSid));

    if (selectedChargeData.length === 0) {
      this.chargeSelectionTaxResult = null;
      return;
    }

    // Get the first charge's billing party info
    // Revenue: customerMasterBP, Cost: AgentMaster
    const firstCharge: any = selectedChargeData[0];
    const isRevenue = this.currentVoucherTypeFilter === 'revenue';

    const billingParty = {
      ...(isRevenue ? (firstCharge?.customerMasterBP || {}) : (firstCharge?.AgentMaster || {})),
      StateName: firstCharge?.customerBranch?.StateName || ''
    };

    // Check if we have manual tax group selections
    const hasManualTaxGroups = Array.from(this.chargeTaxGroupMap.keys()).some(key =>
      this.selectedCharges.has(key)
    );

    console.log('Calculating tax:', {
      selectedCharges: selectedChargeData,
      hasManualTaxGroups,
      taxGroupMapSize: this.chargeTaxGroupMap
    });

    this.calculateManualTax(selectedChargeData, isRevenue);

    console.log('Tax calculation result:', this.chargeSelectionTaxResult);
  }

private async calculateManualTax(charges: any[], isRevenue: boolean) {
  console.log('Manual tax calculation started for', charges.length, 'charges');
  
  let subtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalVAT = 0;
  const lineItems: any[] = [];
  let taxType = 'GST'; // Default

  // Get place of supply state
  const placeOfSupplyState = this.placeOfSupply;
  const companyState = this.getCompanyState();

  for (const charge of charges) {
    const amount = isRevenue
      ? (charge.RevenueLocalAmount || 0)
      : (charge.CostLocalAmount || 0);

    const chargeAmount = parseFloat(amount.toString());
    subtotal += chargeAmount;

    // Get manually selected tax group for this charge
    const selectedTaxGroup = this.chargeTaxGroupMap.get(charge.RateSid);

    if (selectedTaxGroup) {
      // Get customer country for tax determination
      const customerCountry = this.getCustomerCountryFromCharge(charge, isRevenue);
      
      console.log('=== TAX CALCULATION DEBUG ===');
      console.log('Charge:', charge.ChargeDescription);
      console.log('Company State:', companyState);
      console.log('Place of Supply:', placeOfSupplyState);
      console.log('Customer Country:', customerCountry);
      console.log('Selected Tax Group:', selectedTaxGroup);

      // Use the new tax ledger API
      const taxMasters = this.chargeTaxGroupMap.get(charge.RateSid);
      
      console.log('Tax Ledger API Response:', taxMasters);
      
      let lineItem: any = {
        description: charge.ChargeDescription,
        hsn: charge.ChargeMaster?.chargeTaxMaster?.[0]?.HSNCode || charge.ChargeMaster?.HSNSAC || '-',
        amount: chargeAmount
      };

      if (taxMasters && taxMasters.length > 0) {
        if (this.isUAECompany()) {
          // UAE or VAT countries - apply full VAT rate 
          const vatTax = taxMasters.find(t => t.TaxCode === 'VAT');
          const vatAmount = (chargeAmount * Number(vatTax.TaxRate)) / 100;
          lineItem.RateSid = charge.RateSid;
          lineItem.vatRate = vatTax.TaxRate; 
          lineItem.vatAmount = vatAmount;
          lineItem.totalTaxAmount = vatAmount;
          lineItem.cgstRate = 0;
          lineItem.sgstRate = 0;
          lineItem.igstRate = 0;
          lineItem.cgstAmount = 0;
          lineItem.sgstAmount = 0;
          lineItem.igstAmount = 0;
          totalVAT += vatAmount;
          taxType = 'VAT';
          console.log('VAT Applied:', { vatAmount,taxRate : vatTax.TaxRate, chargeAmount });
        } 
        else if (this.isIndianCompany()) {
          // GST logic - determine IGST vs CGST+SGST
          const isIndianCustomer = customerCountry && 
                                  (customerCountry.toLowerCase() === 'india' || 
                                   customerCountry.toLowerCase() === 'in');
          
          const isSameState = companyState && placeOfSupplyState && 
                             companyState.toLowerCase() === placeOfSupplyState.toLowerCase();

          if (isIndianCustomer) {
            if (isSameState) {
              const cgstTax = taxMasters.find(t => t.TaxCode === 'CGST');
              const sgstTax = taxMasters.find(t => t.TaxCode === 'SGST');

              const cgstAmount = (chargeAmount * Number(cgstTax.TaxRate)) / 100;
              const sgstAmount = (chargeAmount * Number(sgstTax.TaxRate)) / 100;
              lineItem.RateSid = charge.RateSid;
              lineItem.cgstRate = cgstTax.TaxRate;
              lineItem.sgstRate = sgstTax.TaxRate;
              lineItem.igstRate = 0;
              lineItem.cgstAmount = cgstAmount;
              lineItem.sgstAmount = sgstAmount;
              lineItem.igstAmount = 0;
              lineItem.totalTaxAmount = cgstAmount + sgstAmount;
              lineItem.vatRate = 0;
              lineItem.vatAmount = 0;
              totalCGST += cgstAmount;
              totalSGST += sgstAmount;
              taxType = 'GST';
              console.log('CGST+SGST Applied for same state:', { cgstAmount, sgstAmount });
            } else {
              const igstTax = taxMasters.find(t => t.TaxCode === 'IGST');
              // Different state - Apply IGST (full rate)
              const igstAmount = (chargeAmount * igstTax.TaxRate) / 100;
              lineItem.RateSid = charge.RateSid;
              lineItem.igstRate = igstTax.TaxRate;
              lineItem.cgstRate = 0;
              lineItem.sgstRate = 0;
              lineItem.igstAmount = igstAmount;
              lineItem.cgstAmount = 0;
              lineItem.sgstAmount = 0;
              lineItem.totalTaxAmount = igstAmount;
              lineItem.vatRate = 0;
              lineItem.vatAmount = 0;
              totalIGST += igstAmount;
              taxType = 'GST';
              console.log('IGST Applied for different state:', { igstAmount, taxRate : igstTax.taxRate });
            }
          } 
        }
      } else {
          // Apply full VAT rate for UAE
          const vatAmount = (chargeAmount * 0) / 100;
          lineItem.RateSid = charge.RateSid;
          lineItem.vatRate = 0;
          lineItem.vatAmount = vatAmount;
          lineItem.totalTaxAmount = vatAmount;
          lineItem.cgstRate = 0;
          lineItem.sgstRate = 0;
          lineItem.igstRate = 0;
          lineItem.cgstAmount = 0;
          lineItem.sgstAmount = 0;
          lineItem.igstAmount = 0;
          totalVAT += vatAmount;
          taxType = 'VAT';
          console.log('Fallback VAT Applied:', { vatAmount, rate: 0 });
      }

      lineItems.push(lineItem);
    } else {
      console.log('No tax group selected for charge:', charge.ChargeDescription);
      // No tax group selected, add with 0 tax
      lineItems.push({
        RateSid: charge.RateSid,
        description: charge.ChargeDescription,
        hsn: charge.ChargeMaster?.chargeTaxMaster?.[0]?.HSNCode || charge.ChargeMaster?.HSNSAC || '-',
        amount: chargeAmount,
        totalTaxAmount: 0,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
        vatRate: 0,
        vatAmount: 0
      });
    }
  }

  const totalTaxAmount = totalCGST + totalSGST + totalIGST + totalVAT;
  const grandTotal = subtotal + totalTaxAmount;

  this.chargeSelectionTaxResult = {
    type: taxType,
    lineItems: lineItems,
    subtotal: subtotal,
    totalAmount: subtotal,
    totalCGST: totalCGST,
    totalSGST: totalSGST,
    totalIGST: totalIGST,
    totalVAT: totalVAT,
    totalTaxAmount: totalTaxAmount,
    grandTotal: grandTotal,
    totalInvoiceAmount: grandTotal,
    isSameState: totalCGST > 0 || totalSGST > 0,
    isInterState: totalIGST > 0,
    vatRate: totalVAT > 0 ? (totalVAT / subtotal * 100) : 0
  };

  console.log('Manual tax calculation complete:', {
    subtotal,
    totalCGST,
    totalSGST,
    totalIGST,
    totalVAT,
    grandTotal,
    lineItemsCount: lineItems.length,
    taxResult: this.chargeSelectionTaxResult
  });
}

// private applyFallbackTax(
//   selectedTaxGroup: any, 
//   lineItem: any, 
//   chargeAmount: number,
//   totalCGST: number,
//   totalSGST: number, 
//   totalIGST: number,
//   totalVAT: number
// ) {
//   const taxRate = parseFloat(selectedTaxGroup.TaxRate || 0);
//   const isGSTType = selectedTaxGroup.TaxType === 'GST' || selectedTaxGroup.TaxType === 'Input' || selectedTaxGroup.TaxType === 'Output';

//   console.log('Using fallback tax calculation:', { taxRate, isGSTType, taxType: selectedTaxGroup.TaxType });

//   // CHECK: If UAE company or VAT type, apply full VAT rate
//   if (this.isUAECompany() || selectedTaxGroup.TaxType === 'VAT') {
//     // Apply full VAT rate (5% for UAE, not split)
//     const vatAmount = (chargeAmount * taxRate) / 100;
//     lineItem.vatRate = taxRate; // Should be 5%
//     lineItem.vatAmount = vatAmount;
//     lineItem.totalTaxAmount = vatAmount;
//     lineItem.cgstRate = 0;
//     lineItem.sgstRate = 0;
//     lineItem.igstRate = 0;
//     lineItem.cgstAmount = 0;
//     lineItem.sgstAmount = 0;
//     lineItem.igstAmount = 0;
//     totalVAT += vatAmount;
//     console.log('Fallback VAT (full rate):', { vatAmount, taxRate });
//   } 
//   else if (isGSTType) {
//     // GST logic
//     const companyState = this.getCompanyState();
//     const placeOfSupplyState = this.placeOfSupply;
//     const isInterState = companyState !== placeOfSupplyState;

//     if (isInterState) {
//       // IGST - full rate
//       const igstAmount = (chargeAmount * taxRate) / 100;
//       lineItem.igstRate = taxRate;
//       lineItem.cgstRate = 0;
//       lineItem.sgstRate = 0;
//       lineItem.igstAmount = igstAmount;
//       lineItem.cgstAmount = 0;
//       lineItem.sgstAmount = 0;
//       lineItem.totalTaxAmount = igstAmount;
//       lineItem.vatRate = 0;
//       lineItem.vatAmount = 0;
//       totalIGST += igstAmount;
//     } else {
//       // CGST + SGST - split rate
//       const halfRate = taxRate / 2;
//       const cgstAmount = (chargeAmount * halfRate) / 100;
//       const sgstAmount = (chargeAmount * halfRate) / 100;
//       lineItem.cgstRate = halfRate;
//       lineItem.sgstRate = halfRate;
//       lineItem.igstRate = 0;
//       lineItem.cgstAmount = cgstAmount;
//       lineItem.sgstAmount = sgstAmount;
//       lineItem.igstAmount = 0;
//       lineItem.totalTaxAmount = cgstAmount + sgstAmount;
//       lineItem.vatRate = 0;
//       lineItem.vatAmount = 0;
//       totalCGST += cgstAmount;
//       totalSGST += sgstAmount;
//     }
//   } else if (selectedTaxGroup.TaxType === 'VAT') {
//     // VAT calculation - full rate
//     const vatAmount = (chargeAmount * taxRate) / 100;
//     lineItem.vatRate = taxRate; // Full rate
//     lineItem.vatAmount = vatAmount;
//     lineItem.totalTaxAmount = vatAmount;
//     lineItem.cgstRate = 0;
//     lineItem.sgstRate = 0;
//     lineItem.igstRate = 0;
//     lineItem.cgstAmount = 0;
//     lineItem.sgstAmount = 0;
//     lineItem.igstAmount = 0;
//     totalVAT += vatAmount;
//   }
// }
  // private checkIfInterState(charge: any): boolean {
  //   // Compare company state with billing party state
  //   const companyState = this.currentBranch?.StateName || '';
  //   const billingPartyState = charge?.customerBranch?.StateName || '';
  //   return companyState !== billingPartyState;
  // }

  /**
   * Determine GST Type for Indian companies based on business rules
   * B2B: Sale between GST-registered entities
   * B2CS: Business to Consumer (Small) - unregistered, same state, <= 2.5 lakh
   * B2CL: Business to Consumer (Large) - unregistered, different state, > 2.5 lakh
   * EXWP: Export with payment of IGST
   * EXWOP: Export without payment (LUT/bond)
   */
//   private determineGSTType(selectedCharges: any[]): string | null {
//   // Get company country from multiple possible sources
//   let companyCountry = '';
  
//   // Try multiple sources for company country
//   if (this.countryOfCompany) {
//     companyCountry = this.countryOfCompany.toLowerCase();
//   } else if (this.currentCompany?.countryMaster?.countryCode) {
//     companyCountry = this.currentCompany.countryMaster.countryCode.toLowerCase();
//   } else if (this.currentCompany?.Country) {
//     companyCountry = this.currentCompany.Country.toLowerCase();
//   } else if (this.currentBranch?.countryMaster?.countryCode) {
//     companyCountry = this.currentBranch.countryMaster.countryCode.toLowerCase();
//   }
  
//   // Only determine GST Type for Indian companies
//   if (companyCountry !== 'india' && companyCountry !== 'in') {
//     console.log('Not an Indian company, GST Type not applicable. Country:', companyCountry);
//     return null;
//   }

//   // Get first charge for common data
//   const firstCharge = selectedCharges[0];
//   if (!firstCharge) {
//     console.log('No charges available for GST Type determination');
//     return null;
//   }

//   const isRevenue = this.currentVoucherTypeFilter === 'revenue';

//   // Get billing party details based on type
//   const billingParty = isRevenue
//     ? (firstCharge?.customerMasterBP || {})
//     : (firstCharge?.AgentMaster || {});

//   const customerBranch = firstCharge?.customerBranch || {};

//   // Check if this is an export shipment
//   const isExport = this.checkIfExportShipment();

//   console.log('GST Type Determination:', {
//     companyCountry,
//     isExport,
//     billingParty: billingParty?.CustomerName,
//     hasGSTNumber: !!customerBranch?.GSTNo?.trim()
//   });

//   if (isExport) {
//     // For export, check if IGST is applied
//     const hasIGST = this.chargeSelectionTaxResult?.totalIGST > 0;
//     const gstType = hasIGST ? 'EXWP' : 'EXWOP';
//     console.log('Export shipment, GST Type:', gstType);
//     return gstType;
//   }

//   // Check if customer has GST number
//   const customerGSTNo = customerBranch?.GSTNo?.trim();
//   const hasGSTNumber = customerGSTNo && customerGSTNo.length > 0;

//   if (hasGSTNumber) {
//     console.log('B2B: Customer has GST number');
//     return 'B2B';
//   } else {
//     // B2C: Customer does not have GST number
//     const invoiceAmount = this.chargeSelectionTaxResult?.grandTotal || 0;
//     const invoiceAmountInLakhs = invoiceAmount / 100000;

//     // Check if same state or different state
//     const companyState = this.currentBranch?.StateName || '';
//     const customerState = customerBranch?.StateName || '';
//     const isSameState = companyState === customerState;

//     console.log('B2C Determination:', {
//       invoiceAmount,
//       invoiceAmountInLakhs,
//       companyState,
//       customerState,
//       isSameState
//     });

//     if (isSameState && invoiceAmountInLakhs <= 2.5) {
//       console.log('B2CS: Same state, amount <= 2.5 lakh');
//       return 'B2CS';
//     } else {
//       console.log('B2CL: Different state or amount > 2.5 lakh');
//       return 'B2CL';
//     }
//   }
// }

  /**
   * Check if this is an export shipment based on port countries
   */
  private checkIfExportShipment(): boolean {
  // If company country is not India, not an export from India
  let companyCountry = '';
  if (this.countryOfCompany) {
    companyCountry = this.countryOfCompany.toLowerCase();
  } else if (this.currentCompany?.countryMaster?.countryCode) {
    companyCountry = this.currentCompany.countryMaster.countryCode.toLowerCase();
  }
  
  if (companyCountry !== 'india' && companyCountry !== 'in') {
    return false;
  }

  // Check if POL or POD has country information
  const polData = this.parentFormValue?.POLSid;
  const podData = this.parentFormValue?.PODSid;

  const polCountry = polData?.countryMaster?.countryCode?.trim()?.toLowerCase() ||
                   polData?.Country?.trim()?.toLowerCase() || 
                   polData?.country?.trim()?.toLowerCase() || '';
  
  const podCountry = podData?.countryMaster?.countryCode?.trim()?.toLowerCase() ||
                   podData?.Country?.trim()?.toLowerCase() ||
                   podData?.country?.trim()?.toLowerCase() || '';

  console.log('Export Check:', {
    companyCountry,
    polCountry,
    podCountry,
    parentFormValue: this.parentFormValue
  });

  // Export if destination is outside India
  const isExport = podCountry && podCountry !== 'india' && podCountry !== 'in';

  console.log('Is Export:', isExport);
  return isExport;
}


getChargeTaxPercentage(charge: any): string {
  // First check if there's a manually selected tax group
  const selectedTaxGroup = this.chargeTaxGroupMap.get(charge.RateSid);

  if (selectedTaxGroup) {
    const isIndia = this.isIndianCompany();
    const isUAE = this.isUAECompany();

    if (isIndia) {
      // For India - display as GST
      const isRevenue = this.currentVoucherTypeFilter === 'revenue';
      const customerCountry = this.getCustomerCountryFromCharge(charge, isRevenue);
      const isIndianCustomer = customerCountry && 
                              (customerCountry.toLowerCase() === 'india' || 
                               customerCountry.toLowerCase() === 'in');
      
      const companyState = this.getCompanyState();
      const billingPartyState = this.placeOfSupply;
      const isSameState = companyState && billingPartyState && 
                         companyState.toLowerCase() === billingPartyState.toLowerCase();

      if (isIndianCustomer && isSameState) {
        const cgstTax = selectedTaxGroup.find(t => t.TaxCode === 'CGST');
        const sgstTax = selectedTaxGroup.find(t => t.TaxCode === 'SGST');
        return `CGST ${cgstTax.TaxRate}% + SGST ${sgstTax.TaxRate}%`;
      } else if (isIndianCustomer) {
        const igstTax = selectedTaxGroup.find(t => t.TaxCode === 'IGST');
        return `IGST ${igstTax.TaxRate}%`;
      } else {
        return `VAT 0%`;
      }
    } else if (isUAE) {
      // For UAE - display as VAT
      const vatTax = selectedTaxGroup.find(t => t.TaxCode === 'VAT');
      return `VAT ${vatTax.TaxRate}%`;
    } else {
      const vatTax = selectedTaxGroup.find(t => t.TaxCode === 'VAT');
      if (vatTax) {
        return `VAT ${vatTax.TaxRate}%`;
      } else {
        const tax = selectedTaxGroup[0];
        return `Tax ${tax.TaxRate}%`;
      }
    }
  }

  // Fall back to calculation result
  const notExist = !this.selectedCharges.has(charge.RateSid)
  if (!this.chargeSelectionTaxResult || notExist) {
    return '-';
  }

  const lineItem = this.chargeSelectionTaxResult.lineItems?.find(
    item => item.description === charge.ChargeDescription
  );

  if (!lineItem) return '-';

  // Display based on company country
  const isIndia = this.isIndianCompany();
  const isUAE = this.isUAECompany();

  if (isIndia) {
    const gstItem = lineItem as any;
    if (gstItem.igstRate > 0) {
      return `IGST ${gstItem.igstRate}%`;
    } else if (gstItem.cgstRate > 0) {
      return `CGST ${gstItem.cgstRate}% + SGST ${gstItem.sgstRate}%`;
    }
  } else if (isUAE) {
    const vatItem = lineItem as any;
    return `VAT ${vatItem.vatRate}%`;
  } else {
    // Other countries
    if (this.chargeSelectionTaxResult.type === 'GST') {
      const gstItem = lineItem as any;
      if (gstItem.igstRate > 0) {
        return `IGST ${gstItem.igstRate}%`;
      } else if (gstItem.cgstRate > 0) {
        return `CGST ${gstItem.cgstRate}% + SGST ${gstItem.sgstRate}%`;
      }
    } else if (this.chargeSelectionTaxResult.type === 'VAT') {
      const vatItem = lineItem as any;
      return `VAT ${vatItem.vatRate}%`;
    }
  }

  return '-';
}
  getChargeTaxAmount(charge: any): number {
    const notExist = !this.selectedCharges.has(charge.RateSid);
    if (!this.chargeSelectionTaxResult || notExist) {
      return 0;
    }

    const lineItem = this.chargeSelectionTaxResult.lineItems?.find(
      item => item.RateSid === charge.RateSid
    );
    // console.log("lineItem", lineItem);
    return lineItem?.totalTaxAmount || 0;
  }

  getChargeTaxTotal(charge: any): number {
    const notExist = !this.selectedCharges.has(charge.RateSid);
    if (!this.chargeSelectionTaxResult || notExist) {
      return 0;
    }

    const lineItem = this.chargeSelectionTaxResult.lineItems?.find(
      item => item.RateSid === charge.RateSid
    );
    if(this.isUAECompany()){
      return toNumber(lineItem?.totalTaxAmount) + toNumber(lineItem?.amount) || 0;
    } else if(this.isIndianCompany()){
      const isSameState = this.currentBranch?.StateMasterSid === this.billingPartyDetails?.StateMasterSid;
      if(isSameState){
        const cgstAmount = toNumber(lineItem?.totalTaxAmount) + toNumber(lineItem?.amount) || 0;
        const sgstAmount = toNumber(lineItem?.totalTaxAmount) + toNumber(lineItem?.amount) || 0;
        return (cgstAmount + sgstAmount);
      } else {
        return toNumber(lineItem?.totalTaxAmount) + toNumber(lineItem?.igstRate) || 0;
      }
    } else {
      return toNumber(lineItem?.totalTaxAmount) || 0;
    }
  }

  async proceedWithSelectedCharges() {
    if (this.selectedCharges.size === 0) {
      this.appSettingService.showWarning('Please select at least one charge');
      return;
    }

    try {
      const selectedChargeData = this.availableCharges.filter(c =>
        this.selectedCharges.has(c.RateSid)
      );

      if (selectedChargeData.length === 0) {
        this.appSettingService.showWarning('Selected charges could not be found in availableCharges');
        return;
      }

      // Close modal first
      this.chargeSelectionModalRef?.close();

      const isRevenue = this.currentVoucherTypeFilter === 'revenue';
      const billingPartyBranchSid = isRevenue
        ? selectedChargeData[0]?.RevenueCustomerBranchSid
        : selectedChargeData[0]?.CostAgentBranchSid;

      const currUserEmail = this.appSettingService.userSettingSource.value?.userEmail || 'System';

      // ----------------------------
      // ❗ PARTY LEDGER VALIDATION
      // ----------------------------
      let PartyLedgerMasterSid: number | null = null;
      let PartyCOAMasterSid: number | null = null;

      const partyList = this.selectedVoucherType === 'Invoice'
        ? this.billingParties
        : this.parties;

      const party = partyList?.find((p: any) => p.CustomerMasterSid === this.currentBillingPartySid);

      PartyLedgerMasterSid = party?.SubledgerMasterSid ?? null;
      PartyCOAMasterSid = party?.COAMappedId ?? null;

      if (!PartyLedgerMasterSid) {
        this.appSettingService.showWarning('No Ledger found for the selected party');
        return;
      }
      if (!PartyCOAMasterSid) {
        this.appSettingService.showWarning('No COA found for the selected party');
        return;
      }
      const currentYearId = Number(localStorage.getItem('current-year-id'));

      // ----------------------------
      // ❗ HEADER PAYLOAD
      // ----------------------------
      console.log("parentFormValue",this.parentFormValue)
      let narration = '';
      if (this.screenName === 'Booking') {
  // Booking: "Booking No. XXXX, Dt. XXXX"
  const bookingNo = this.parentFormValue?.BookingNumber || 'N/A';
  const bookingDate = this.parentFormValue?.BookingDate || new Date().toLocaleDateString();
  narration = `Booking No. ${bookingNo}, Dt. ${bookingDate}`;
} else if (this.screenName === 'MasterJob') {
  // Master Job only (no house job)
  const mblNo = this.parentFormValue?.MBLNo || 'N/A';
  const mblDate = this.parentFormValue?.MBLDate || new Date().toLocaleDateString();
  const masterJobNo = this.parentFormValue?.MasterJobNumber || 'N/A';
  
  // Determine if Air or Sea based on segment
  const segment = this.parentFormValue?.Segment || '';
  const mblPrefix = segment === 'AIR' ? 'MAWB' : 'MBL';
  
  narration = `Voucher from Master Job – ${mblPrefix} No. ${mblNo}, Master Job No. ${masterJobNo}, Dt. ${mblDate}`;
} else if (this.screenName === 'HouseJob') {
  // Master Job + House Job
  const hblNo = this.parentFormValue?.HBLNo || 'N/A';
  const hblDate = this.parentFormValue?.HBLDate || new Date().toLocaleDateString();
  const mblNo = this.parentFormValue?.MBLNo || 'N/A';
  const masterJobNo = this.parentFormValue?.MasterJobNumber || 'N/A';
  
  // Determine if Air or Sea based on segment
  const segment = this.parentFormValue?.Segment || '';
  const hblPrefix = segment === 'AIR' ? 'HAWB' : 'HBL';
  const mblPrefix = segment === 'AIR' ? 'MAWB' : 'MBL';
  
  narration = `Voucher from House Job – ${hblPrefix} No. ${hblNo}, ${mblPrefix} No. ${mblNo}, Master Job No. ${masterJobNo}, Dt. ${hblDate}`;
} else {
  // Default narration
  narration = `Voucher generated from ${this.screenName} ${this.ParentSid}`.substring(0, 250);
}
      const headerDetails = {
        CreatedBy: currUserEmail,
        Status: 'A',
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid ?? null,
        BranchMasterSid: this.currentBranch?.BranchMasterSid ?? null,
        VoucherTypeName: this.selectedVoucherType,
        Narration: narration,
        PartyMasterSid: PartyLedgerMasterSid,
        PartyName: this.billingPartyDetails?.CustomerName ?? '',
        PartyAddress: this.billingPartyBranchDetails?.Address ?? '',
        CustomerBranchSid: billingPartyBranchSid ?? this.billingPartyBranchDetails?.CustomerBranchSid ?? null,
        PlaceOfSupply: this.placeOfSupply ?? '',
        State: this.placeOfSupply ?? '',
        COAMasterSid: PartyCOAMasterSid,
        BankCOA: null,
        BankPartyName: null,
        GST_VAT: this.billingGST_VAT ?? '',
        InvoiceType: this.selectedGSTType ?? '',
        ReversalVoucher: null,
        TaxNumber: null,
        GSTType: this.selectedTaxCategory ?? '',
        Remarks: '',
        DepartmentMasterSid: this.parentFormValue?.DepartmentMasterSid ?? null,
        HouseNumber: this.screenName === 'HouseJob' ? this.parentFormValue?.HBLNo ?? '' : '',
        MasterNumber: this.screenName === 'MasterJob' ? this.parentFormValue?.MasterJobNumber : (this.screenName === 'HouseJob') ? this.parentFormValue?.MasterJobNumber : '',
        HouseJobSid: this.screenName === 'HouseJob' ? this.getParentSid() : null,
        MasterJobSid: (this.screenName === 'MasterJob') ? this.getParentSid() : (this.screenName === 'HouseJob') ? this.parentFormValue?.MasterJobSid : null,
        CurrencyMasterSid: this.invoiceHeaderCurrency?.CurrencyMasterSid ?? null,
        CurrencyCode: this.invoiceHeaderCurrency?.currencyCode ?? '',
        ExchangeRate: this.invoiceHeaderExchangeRate ?? 1,
        Amount: 0,
        LocalAmount: 0,
        NetAmount: 0,
        DocumentNumber: null,
        DocumentDate: null,
        SetoffStatus: null,
        TaxType: this.isIndianCompany() ? 'GST' : (this.isUAECompany() ? 'VAT' : null),
        BookingHeaderSid: this.screenName === 'Booking' ? this.getParentSid() : null,
        YearMasterSid : currentYearId ?? null,
      };
      console.log("Header payload",headerDetails)

      // ----------------------------
      // ❗ DETAIL PAYLOAD GENERATION
      // ----------------------------
      let stopGenerating = false;
      const detailPromises = [];

      for (const RateSid of this.selectedCharges) {

        if (stopGenerating) break; // ← FULL STOP

        const chargeInfo = this.availableCharges.find((c: any) => c.RateSid === RateSid);

        if (!chargeInfo) {
          this.appSettingService.showError(`Charge not found for RateSid: ${RateSid}`);
          stopGenerating = true;
          break;
        }

        console.log(chargeInfo);

        // Get Subledger details
        const ledgerResp = await firstValueFrom(
          this.operationService.getLedgerDetails({
            CompanyMasterSid: this.currentCompany.CompanyMasterSid,
            SubledgerMappingSid: chargeInfo.ChargeMasterSid,
            LedgerType: 'Charge',
            DrCr: this.selectedVoucherType === 'Invoice' ? 'Cr' : 'Dr',
          })
        );

        if (!ledgerResp?.status) {
          this.appSettingService.showError(ledgerResp.message);
          stopGenerating = true;
          break;
        }

        const chargeSubledger = ledgerResp.data;

        // TAX CALCULATION
        const associatedTaxMasters = this.chargeTaxGroupMap.get(RateSid) ?? [];
        const getTax = (code: string) =>
          Number(associatedTaxMasters.find((tm: any) => tm.TaxCode === code)?.TaxRate ?? 0);

        let taxPercentage1 = 0, taxPercentage2 = 0;
        let taxAmount1 = 0, taxAmount2 = 0;

        const amount = isRevenue ? chargeInfo.RevenueLocalAmount : chargeInfo.CostLocalAmount;
        const chargeAmount = Number(amount ?? 0);

        if (this.isUAECompany()) {
          taxPercentage1 = getTax('VAT');
          taxAmount1 = (chargeAmount * taxPercentage1) / 100;

        } else if (this.isIndianCompany()) {
          taxPercentage1 = getTax('CGST');
          taxPercentage2 = getTax('SGST');
          taxAmount1 = (chargeAmount * taxPercentage1) / 100;
          taxAmount2 = (chargeAmount * taxPercentage2) / 100;
        }

        detailPromises.push({
          Sno: detailPromises.length + 1,
          ChargeMasterSid: chargeInfo.ChargeMasterSid,
          ChargeDescription: chargeInfo.ChargeDescription || chargeInfo.ChargeMaster?.chargeName || "",
          LedgerMasterSid: chargeSubledger?.SubledgerMasterSid ?? null,
          COAMasterSid: chargeSubledger?.COAMasterSid ?? null,
          HSSACMasterSid: chargeInfo.ChargeMaster?.chargeTaxMaster?.[0]?.HSSACMasterSid || chargeInfo.ChargeMaster?.HSNSAC || null,
          DepartmentMasterSid: this.parentFormValue?.DepartmentMasterSid ?? null,
          HouseJobSid: this.screenName === 'HouseJob' ? this.getParentSid() : null,
          MasterJobSid: (this.screenName === 'MasterJob') ? this.getParentSid() : (this.screenName === 'HouseJob') ? this.parentFormValue?.MasterJobSid : null,
          CurrencyMasterSid: isRevenue ? chargeInfo.RevenueCurrencyMasterSid : chargeInfo.CostCurrencyMasterSid,
          CurrencyCode: isRevenue ? chargeInfo.RevenueCurrencyMaster?.currencyCode : chargeInfo.CostCurrencyMaster?.currencyCode,
          ExchangeRate: Number(isRevenue ? chargeInfo.RevenueExchangeRate : chargeInfo.CostExchangeRate),
          Rate: Number(isRevenue ? chargeInfo.RevenueRate : chargeInfo.CostRate),
          NumberOfUnit: Number(isRevenue ? chargeInfo.RevenueNumberOfUnit : chargeInfo.CostNumberOfUnit),
          Narration:  narration.substring(0, 250),
          DrCr: isRevenue ? chargeInfo.RevenueDrCr : chargeInfo.CostDrCr,
          TaxableAmount: Number(isRevenue ? chargeInfo.RevenueAmount : chargeInfo.CostAmount),
          TaxPercentage1: taxPercentage1,
          TaxAmount1: taxAmount1,
          TaxPercentage2: taxPercentage2,
          TaxAmount2: taxAmount2,
          Amount: Number(isRevenue ? chargeInfo.RevenueAmount : chargeInfo.CostAmount),
          LocalAmount: chargeAmount,
          CostRevenue : this.selectedVoucherType === "Invoice" ? "Revenue" : "Cost",
          InvoiceType: this.isIndianCompany() ? 'GST' : (this.isUAECompany() ? 'VAT' : null),
          ChargeUOMSid: isRevenue ? chargeInfo.RevenueChargeUomSid : chargeInfo.CostChargeUomSid,
          IsAutoGenerated: 'N',
        });

      } // end loop

      if (stopGenerating) {
        console.warn("Voucher generation stopped intentionally.");
        return;
      }

      const detailPayload = detailPromises;

      const payload = {
        ...headerDetails,
        selectedRateIds : Array.from(this.selectedCharges),
        screenName : this.screenName,
        VoucherDetail: detailPayload
      };

      
      console.log('Voucher generation payload:', payload);
      
      this.appSettingService.showInfo('Generating voucher...');
      // ----------------------------
      // ❗ API: CREATE VOUCHER
      // -----------------------------
    const result = await firstValueFrom(this.operationService.createVoucher(payload));

      if (!result?.status) {
        const msg = Array.isArray(result.message) ? result.message[0] : result.message;
        this.appSettingService.showError(`Failed to generate voucher: ${msg}`);
        return;
      }

      // SUCCESS
      const voucherNumber = result.data?.VoucherNumber || 'N/A';
      const voucherHeaderSid = result.data?.VoucherHeaderSid;

      this.toaster.clear();
      this.appSettingService.showSuccess(`Voucher generated successfully! Voucher Number: ${voucherNumber}`);

      await this.reloadParent.emit(this.routeParentSid);

      if (voucherHeaderSid) {
        const targetRoute =
          this.selectedVoucherType === 'Vendor Invoice'
            ? '/operation/vendor-invoice/entry'
            : '/operation/invoice/entry';

        const key = `${this.screenName}Id`;

        this.router.navigate([targetRoute, voucherHeaderSid], {
          queryParams: {
            from: this.screenName,
            [key]: this.routeParentSid,
          }
        });
      }

    } catch (error: any) {
      this.appSettingService.showError(
        'Error generating voucher: ' +
        (error?.error?.message || error?.message || 'Unknown error')
      );
      console.error('Error generating voucher:', error);
    }
  }

// private getCustomerBranchSid(): number | null {
//   const firstCharge = this.availableCharges[0];
//   if (!firstCharge) return null;
  
//   const isRevenue = this.currentVoucherTypeFilter === 'revenue';
//   return isRevenue ? 
//     firstCharge.RevenueCustomerBranchSid : 
//     firstCharge.CostAgentBranchSid;
// }
  cancelChargeSelection() {
    this.chargeSelectionModalRef?.close();
    this.selectedCharges.clear();
    this.availableCharges = [];
  }
  private getDepartmentMasterSid(): number | null {
  // Priority 1: Try to get from parent form value
  if (this.parentFormValue?.DepartmentMasterSid) {
    return Number(this.parentFormValue.DepartmentMasterSid);
  }

  // Priority 2: Try to get from departmentName in parent form
  if (this.parentFormValue?.departmentName) {
    // If departmentName is a string, you might need to convert it to DepartmentMasterSid
    // This depends on your data structure - you may need to map department name to ID
    console.log('Department name found:', this.parentFormValue.departmentName);
    // You might need to implement a mapping logic here based on your department list
  }

  // Priority 3: Try to get from current company/branch settings
  if (this.currentCompany?.DefaultDepartmentSid) {
    return Number(this.currentCompany.DefaultDepartmentSid);
  }

  // Priority 4: Return null if not found
  console.warn('DepartmentMasterSid not found in parent form or company settings');
  return null;
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
  private getCompanyState(): string {
  if (!this.currentCompany) {
    console.warn('No current company data available');
    return '';
  }

  console.log('=== COMPANY STATE DEBUG ===');
  console.log('Current Company:', this.currentCompany);
  console.log('Current Branch:', this.currentBranch);
  console.log('User Data:', this.userData);

  // Method 1: Check currentBranch stateMaster first
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

  private determineGSTTypeAndPlaceOfSupply() {
  console.log('=== DETERMINING GST TYPE AND PLACE OF SUPPLY ===');
   const isIndia = this.isIndianCompany();
   if (!isIndia) {
    // For non-India companies, don't set GST Type
    this.selectedGSTType = '';
    console.log('Company is not in India. GST Type not applicable.');
    
    // Still determine place of supply for display
    const companyState = this.getCompanyState();
    const isRevenue = this.currentVoucherTypeFilter === 'revenue';
    let billingPartyState = '';
    
    if (isRevenue) {
      const customerBranch = this.availableCharges[0]?.customerBranch;
      billingPartyState = customerBranch?.stateMaster?.stateName || 
                         customerBranch?.StateName || '';
    } else {
      const agentBranch = this.availableCharges[0]?.AgentBranch;
      billingPartyState = agentBranch?.stateMaster?.stateName || 
                         agentBranch?.StateName || '';
    }
    
    this.placeOfSupply = billingPartyState || companyState || '';
    console.log('Place of Supply (non-India):', this.placeOfSupply);
    return;
  }
  // Get company state
  const companyState = this.getCompanyState();
  console.log('Company State:', companyState);
  
  // Get customer/agent state based on voucher type
  const isRevenue = this.currentVoucherTypeFilter === 'revenue';
  
  let billingPartyState = '';
  
  if (isRevenue) {
    // For Revenue (Invoice) - get from customer branch
    const customerBranch = this.availableCharges[0]?.customerBranch;
    billingPartyState = customerBranch?.stateMaster?.stateName || 
                       customerBranch?.StateName || 
                       customerBranch?.stateMaster?.stateCode || 
                       customerBranch?.StateCode || 
                       this.billingPartyDetails?.stateMaster?.stateName || 
                       this.billingPartyDetails?.StateName || 
                       '';
    console.log('Revenue - Customer Branch State:', {
      customerBranch: customerBranch,
      stateMaster: customerBranch?.stateMaster,
      stateName: customerBranch?.stateMaster?.stateName,
      StateName: customerBranch?.StateName,
      finalState: billingPartyState
    });
  } else {
    // For Cost (Vendor Invoice) - get from agent branch
    const agentBranch = this.availableCharges[0]?.AgentBranch;
    billingPartyState = agentBranch?.stateMaster?.stateName || 
                       agentBranch?.StateName || 
                       agentBranch?.stateMaster?.stateCode || 
                       agentBranch?.StateCode || 
                       this.billingPartyDetails?.stateMaster?.stateName || 
                       this.billingPartyDetails?.StateName || 
                       '';
    console.log('Cost - Agent Branch State:', {
      agentBranch: agentBranch,
      stateMaster: agentBranch?.stateMaster,
      stateName: agentBranch?.stateMaster?.stateName,
      StateName: agentBranch?.StateName,
      finalState: billingPartyState
    });
  }
  
  console.log('Billing Party State:', billingPartyState);
  console.log('Billing Party GST:', this.billingGST_VAT);
  console.log('Is Revenue:', isRevenue);

  // Determine Place of Supply
  this.placeOfSupply = billingPartyState || companyState || '';
  console.log('Place of Supply:', this.placeOfSupply);

  // Determine GST Type based on business rules
  if (this.countryOfCompany?.toLowerCase() === 'india' || 
      this.currentCompany?.countryMaster?.countryCode?.toLowerCase() === 'in') {
    
    if (this.billingGST_VAT && this.billingGST_VAT.trim() !== '') {
      // Registered dealer with GST number
      if (companyState === billingPartyState) {
        this.selectedTaxCategory = 'CGST+SGST';
        this.selectedGSTType = 'B2B';
        console.log('GST Type: B2B (Same state, registered dealer)');
      } else {
        this.selectedTaxCategory = 'IGST';
        this.selectedGSTType = 'B2B';
        console.log('GST Type: B2B (Different state, registered dealer)');
      }
    } else {
      // Unregistered dealer
      if (companyState === billingPartyState) {
        this.selectedTaxCategory = 'CGST+SGST';
        this.selectedGSTType = 'B2C';
        console.log('GST Type: B2C (Same state, unregistered dealer)');
      } else {
        this.selectedTaxCategory = 'IGST';
        this.selectedGSTType = 'B2C';
        console.log('GST Type: B2C (Different state, unregistered dealer)');
      }
    }

    // Check for export scenarios
    const isExport = this.checkIfExportShipment();
    if (isExport) {
      this.selectedGSTType = 'EXWP';
      console.log('GST Type: EXWP (Export shipment)');
    }
  } else if(this.countryOfCompany?.toLowerCase() === 'united arab emirates' || 
      this.currentCompany?.countryMaster?.countryCode?.toLowerCase() === 'ae'){
            // UAE - no GST only VAT
    this.selectedTaxCategory = "VAT";
    this.selectedGSTType = '';
    console.log('GST Type: Not applicable (Non-India company)');
  } else {
    // Non-India - no GST
    this.selectedTaxCategory = "";
    this.selectedGSTType = '';
    console.log('GST Type: Not applicable (Non-India company)');
  }

  console.log('Final GST Type:', this.selectedGSTType);
  console.log('=== END GST DETERMINATION ===');
}

onGSTTypeChange() {
  console.log('GST Type changed to:', this.selectedGSTType);
  this.calculateChargeSelectionTax();
}
  

// private async getTaxLedgerForCharge(
//   charge: any, 
//   isRevenue: boolean, 
//   placeOfSupplyState: string
// ): Promise<any> {
//   try {
//     const taxGroupSid = this.getTaxGroupSidFromCharge(charge);
    
//     console.log('=== TAX GROUP SID DEBUG ===');
//     console.log('Charge:', charge.ChargeDescription);
//     console.log('Voucher Type:', this.selectedVoucherType);
//     console.log('Is Revenue:', isRevenue);
//     console.log('Extracted TaxGroupSid:', taxGroupSid);
    
//     if (!taxGroupSid) {
//       console.log('No TaxGroupSid found for charge:', charge.ChargeDescription);
//       return null;
//     }

//     const currentCountry = Number(this.currentCompany?.CountryMasterSid);
    
//     // ✅ CORRECTED LOGIC:
//     // Revenue (Invoice) = Input (we are receiving money from customer)
//     // Cost (Vendor Invoice) = Output (we are paying money to vendor)
//     const inputOrOutput: 'Input' | 'Output' = 
//       this.selectedVoucherType === 'Invoice' ? 'Input' : 'Output';

//     console.log('Determined InputOrOutput:', {
//       voucherType: this.selectedVoucherType,
//       inputOrOutput
//     });

//     const companyState = this.getCompanyState();
    
//     // Get customer country from charge data
//     const customerCountry = this.getCustomerCountryFromCharge(charge, isRevenue);
    
//     // Use tax category determination (Same state = Inter, Different state = Intra)
//     const taxCategory = this.determineTaxCategory(companyState, placeOfSupplyState, customerCountry);

//     console.log('Tax Ledger Parameters:', {
//       charge: charge.ChargeDescription,
//       taxGroupSid,
//       inputOrOutput,
//       taxCategory,
//       companyState,
//       placeOfSupplyState,
//       customerCountry,
//       currentCountry,
//       voucherType: this.selectedVoucherType
//     });

//     const payload = {
//       taxGroup: taxGroupSid,
//       InputOrOutput: inputOrOutput,
//       TaxCategory: taxCategory, // This will be either 'Inter' or 'Intra'
//       CountryMasterSid: currentCountry
//     };

//     console.log('Calling tax ledger API with payload:', payload);

//     const response = await firstValueFrom(
//       this.operationService.getLedgerForTaxGroup(payload)
//     );

//     // ✅ Store the actual tax rate from API response
//     if (response?.status && response.data && response.data.length > 0) {
//       const taxData = response.data;
//       console.log('Tax Ledger Data with Rate:', taxData);
      
//       // Update the tax group map with actual rate from API
//       this.updateTaxGroupWithRate(charge.RateSid, taxData);
      
//       return response.data;
//     } else {
//       console.warn('No tax ledger data found for charge:', charge.ChargeDescription);
//       return null;
//     }

//   } catch (error) {
//     console.error('Error fetching tax ledger:', error);
//     return null;
//   }
// }
private getCustomerCountryFromCharge(charge: any, isRevenue: boolean): string {
  if (isRevenue) {
    // For Revenue (Invoice) - get from customer
    const customerMaster = charge?.customerMasterBP;
    const customerBranch = charge?.customerBranch;
    
    const country = customerMaster?.countryMaster?.countryCode || 
                   customerMaster?.Country ||
                   customerBranch?.countryMaster?.countryCode ||
                   customerBranch?.Country ||
                   '';
    
    console.log('Customer Country (Revenue):', {
      customerName: customerMaster?.CustomerName,
      countryFromMaster: customerMaster?.countryMaster?.countryCode,
      countryFromBranch: customerBranch?.countryMaster?.countryCode,
      finalCountry: country
    });
    
    return country;
  } else {
    // For Cost (Vendor Invoice) - get from agent
    const agentMaster = charge?.AgentMaster;
    const agentBranch = charge?.AgentBranch;
    
    const country = agentMaster?.countryMaster?.countryCode || 
                   agentMaster?.Country ||
                   agentBranch?.countryMaster?.countryCode ||
                   agentBranch?.Country ||
                   '';
    
    console.log('Agent Country (Cost):', {
      agentName: agentMaster?.CustomerName,
      countryFromMaster: agentMaster?.countryMaster?.countryCode,
      countryFromBranch: agentBranch?.countryMaster?.countryCode,
      finalCountry: country
    });
    
    return country;
  }
}

private getTaxGroupSidFromCharge(charge: any): number | null {
  if (!charge?.ChargeMaster?.chargeTaxMaster?.length) {
    return null;
  }

  const chargeTaxMaster = charge.ChargeMaster.chargeTaxMaster[0];
  
  // Try different possible field names for TaxGroupSid
  const taxGroupSid = chargeTaxMaster.TaxGroupSid || 
                     chargeTaxMaster.taxGroupSid || 
                     chargeTaxMaster.TaxGroupMasterSid ||
                     chargeTaxMaster.taxGroupMasterSid;

  return taxGroupSid ? Number(taxGroupSid) : null;
}

  /**
   * Determine tax category based on company state and place of supply
   */
  private determineTaxCategory(companyState: string, billingPartyState: string, customerCountry: string): 'Inter' | 'Intra' {
    if (!companyState || !billingPartyState) {
      console.warn('Missing state information, defaulting to Inter');
      return 'Inter';
    }

    // Normalize country codes for comparison
    const normalizedCustomerCountry = customerCountry?.toLowerCase() || '';
    const isIndianCustomer = normalizedCustomerCountry === 'india' || normalizedCustomerCountry === 'in';
    const isInternationalCustomer = !isIndianCustomer && normalizedCustomerCountry !== '';

    console.log('Tax Category - Customer Country Analysis:', {
      customerCountry,
      normalizedCustomerCountry,
      isIndianCustomer,
      isInternationalCustomer
    });

    // For international customers (like Dubai), use 'Inter' category for VAT
    if (isInternationalCustomer) {
      console.log('International transaction - Using Inter category for customer country:', customerCountry);
      return 'Inter'; // Use 'Inter' for international transactions (VAT)
    }

    // For Indian customers, check if same state or different state
    const normalizedCompanyState = companyState.trim().toLowerCase();
    const normalizedBillingState = billingPartyState.trim().toLowerCase();

    const isSameState = normalizedCompanyState === normalizedBillingState;

    console.log('Tax Category Determination for Indian Customer:', {
      companyState: normalizedCompanyState,
      billingPartyState: normalizedBillingState,
      isSameState,
      // CORRECT: Same state = Inter, Different state = Intra
      taxCategory: isSameState ? 'Inter' : 'Intra'
    });

    // CORRECT LOGIC:
    // Same state = Inter (CGST+SGST)
    // Different state = Intra (IGST)
    return isSameState ? 'Inter' : 'Intra';
  }

  // Add this method to check if company is in India
  isIndianCompany(): boolean {
    const companyCountry = this.countryOfCompany?.toLowerCase() ||
      this.currentCompany?.countryMaster?.countryCode?.toLowerCase() ||
      this.currentCountryName?.toLowerCase() || '';

    return companyCountry === 'india' || companyCountry === 'in';
  }

  // Add this method to check if company is in UAE (or any specific country)
  isUAECompany(): boolean {
    const companyCountry = this.countryOfCompany?.toLowerCase() ||
      this.currentCompany?.countryMaster?.countryCode?.toLowerCase() ||
      this.currentCountryName?.toLowerCase() || '';

    return companyCountry.includes('united arab emirates') ||
      companyCountry === 'uae' ||
      companyCountry === 'ae';
  }

}
