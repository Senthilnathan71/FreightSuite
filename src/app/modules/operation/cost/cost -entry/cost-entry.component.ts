import { Component, ViewChild, TemplateRef, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { OperationService } from '../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { catchError, forkJoin, of } from 'rxjs';
import { FeatherModule } from 'angular-feather';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { SearchableDropdownModal } from 'src/app/component/searchable-dropdown/searchable-dropdown-modal.component';

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
    SearchableDropdownModal
  ],
  templateUrl: './cost-entry.component.html',
  styleUrls: ['./cost-entry.component.scss'],
  providers: [
    CustomDatePipe
  ]
})
export class CostEntryComponent implements OnInit {

  selectedTab = 'Sales and cost';
  // costFormArray: FormArray;
  // revenueFormArray: FormArray;
  chargeList: any[] = [];
  filteredChargeList : any[] = [];
  uomList: any[] = [];
  docTypeList: any[] = [];
  vouchers:any[]=[]
  slicedCostFormArray: any[] = [];
  slicedRevenueFormArray: any[] = [];
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
    { id: 1, name: 'Dr', value: 'D' },
    { id: 2, name: 'Cr', value: 'C' }
  ]
  // tabs = [
  //   { name: 'Cost', icon: 'fas fa-rupee-sign' },
  //   { name: 'Revenue', icon: 'fas fa-chart-line' },
  //   { name: 'Profit', icon: 'fas fa-dollar-sign' },
  // ];
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
  }
  get currencyList(): any[] {
    return this._currencyList;
  }

  @Input()
  set customerList(value: any[]) {
    this._customerList = value || [];
  }
  get customerList(): any[] {
    return this._customerList;
  }


  @Input()
  set agentList(value: any[]) {
    this._agentList = value || [];
  }
  get agentList(): any[] {
    return this._agentList;
  }

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

    this.rateFormArray.clear(); // clear existing rows first
    if (value && value.length > 0) {
      this._dataItems = value;
      console.log(value);
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
      this.parentFormValue = value;
      this.filterDepartmentBasedOnSegment(this.parentFormValue?.departmentName);
    } else {
      this.parentFormValue = {};
    }
  }

  

  @Output() dataEmitter = new EventEmitter<any[]>();
  @Output() validationResult = new EventEmitter<boolean>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('leftTableBody') leftBody!: ElementRef;
  @ViewChild('rightTableBody') rightBody!: ElementRef;
  syncScroll(event: Event) {
    const scrollTop = (event.target as HTMLElement).scrollTop;
    this.leftBody.nativeElement.scrollTop = scrollTop;
  }
  rateForm!: FormGroup;
  currentRateIndex: number = -1;
  private routeBookingHeaderSid: number | null = null;

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
    private datePipe: CustomDatePipe,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany =  ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;

    // Extract BookingHeaderSid from route parameter
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.routeBookingHeaderSid = Number(params['id']);
        console.log('BookingHeaderSid from route:', this.routeBookingHeaderSid);
      }
    });

    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentCompany?.BranchMasterSid,
    }
    this.initRateForm();
    this.loadRateLookups();

    this.rateFormArray.valueChanges.subscribe(() => {
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
    }).subscribe(({ allMasters , charges }) => {
      this.chargeList = charges;
      this.filterDepartmentBasedOnSegment(this.parentFormValue?.departmentName);
      this.uomList = allMasters.uoms;
      this.docTypeList = allMasters.docTypes;
      this.vouchers= allMasters.Vouchers
    })
  }


  initRateForm() {
    this.rateForm = this.fb.group({
      BookingRatesSid: [null],
      CostRevenueChargesSid: [null],
      TransactionSid: [null],
      SerialNumber: [{ value: '', disabled: true }],
      ChargeMasterSid: [null,[Validators.required]],
      ChargeDescription: [''],
      // ChargeUomSid: [null],
      NumberOfUnit:['',[Validators.required]],
      // Cost 
      CostCurrencyMasterSid: [null],
      CostPrepaidCollect: [''],
      CostExchangeRate: [''],
      // CostRate: [''],
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
      // RevenueRate: [''],
      RevenueNumberOfUnit:[null],
      RevenueChargeUomSid:['',[Validators.required]],
      RevenueDrCr: [''],
      RevenueAmount: [''],
      RevenueLocalAmount: [''],
      RevenueVoucherHeaderSid: [''],
      RevenueVoucherTypeSid: [null],
      AgentSid: [''],
      // 
      CustomerBranchSid: [null],
      rateFormArray: this.fb.array([])  // <-- Must include this
    });

  }

  hasRequired(controlName:string){
    const requiredFields = ['ChargeMasterSid','ChargeDescription','CostChargeUomSid','NumberOfUnit'];
    return requiredFields.includes(controlName);
  }

  validateRateArray(): boolean {
    if (!this.rateFormArray || this.rateFormArray.length === 0) {
      this.appSettingService.showWarning('No rate entries found.');
      this.validationResult.emit(false);
      return false;
    }

    for (let rateIndex = 0; rateIndex < this.rateFormArray.length; rateIndex++) {
      const rate = this.rateFormArray.at(rateIndex) as FormGroup;

      const requiredFields = [
        'ChargeMasterSid',
        'ChargeDescription',
        'CostChargeUomSid',
        'NumberOfUnit'
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
  return this.rateForm.get('rateFormArray') as FormArray;
}

// This allows you to access controls easily in the template
get r() {
  return this.rateForm.controls;
}


  patchValues(items: any[]) {
    console.log(items,'patchValues')
  if (items && items.length > 0) {
    for (const item of items) {
      this.addRateRow(item);
    }
  }else{
    this.addRateRow(); // <-- Add one empty row when no data
  }
    this.updateCostPagination();
    this.updateRevenuePagination();
    this.calculateProfit();
  }
createRateFormGroup(data?: any): FormGroup {
  console.log(data,'createRateFormGroup')
    console.log(this.docTypeList,'this.docTypeList',this.vouchers,'vouchers')

  // Extract voucher display values from enriched data
  const costVoucherNumber = data?.costVoucherHeader?.VoucherNumber || data?.CostVoucherHeader?.VoucherNumber || '';
  const revenueVoucherNumber = data?.revenueVoucherHeader?.VoucherNumber || data?.RevenueVoucherHeader?.VoucherNumber || '';
  const costDocTypeName = data?.costVoucherTypeMaster?.DocumentTypeName || data?.CostVoucherType?.DocumentTypeName || '';
  const revenueDocTypeName = data?.revenueVoucherTypeMaster?.DocumentTypeName || data?.RevenueVoucherType?.DocumentTypeName || '';

  // Ensure BookingHeaderSid is available - try from data, then helper method
  const bookingHeaderSid = data?.BookingHeaderSid ?? this.getBookingHeaderSid();

  const form = this.fb.group({
    BookingRatesSid: [data?.BookingRatesSid ?? null],
    BookingHeaderSid: [bookingHeaderSid],

    CompanyMasterSid: [data?.CompanyMasterSid ?? null],
    BranchMasterSid: [data?.BranchMasterSid ?? null],

    CostRevenueChargesSid: [data?.CostRevenueChargesSid ?? null],

    TransactionSid: [data?.TransactionSid ?? null],

    SerialNumber: [data?.SerialNumber ?? ''],
    ChargeMasterSid: [data?.ChargeMasterSid ?? null],
    ChargeDescription: [data?.ChargeDescription ?? null],
    NumberOfUnit: [data?.NoOfUnit ?? ''],

    // ChargeUomSid: [data?.ChargeUomSid ?? null],
    unitQtyBasis: [data?.UnitQty || null],  // This is to track Charge Based on Unit Qty

    CostPrepaidCollect: [data?.CostPrepaidCollect ?? "Prepaid"],
    CostChargeUomSid:[data?.CostChargeUomSid ?? ''],
    CostCurrencyMasterSid: [data?.CostCurrencyMasterSid ?? null],
    CostExchangeRate: [data?.CostExchangeRate != null ? Number(data.CostExchangeRate).toFixed(this.digitsAfterDecimal) : ''],
    CostRate: [data?.CostRate != null ? Number(data.CostRate).toFixed(this.digitsAfterDecimal) : ''],
    CostAmount: [data?.CostAmount != null ? Number(data.CostAmount).toFixed(this.digitsAfterDecimal) : ''],
    CostLocalAmount: [data?.CostLocalAmount != null ? Number(data.CostLocalAmount).toFixed(this.digitsAfterDecimal) : ''],
    CostDrCr: [data?.CostDrCr ?? 'D'],
    CostVoucherHeaderSid: [data?.CostVoucherHeaderSid ?? null],
    CostVoucherTypeSid: [data?.CostVoucherTypeMasterSid ?? null],
    CostVoucherHeader: [data?.costVoucherHeader || data?.CostVoucherHeader || null],  // Store voucher header object for display
    CostVoucherType: [data?.costVoucherTypeMaster || data?.CostVoucherType || null],  // Store voucher type object for display
    CostNumberOfUnit: [data?.CostNumberOfUnit ?? null],
    RevenueNumberOfUnit:[data?.RevenueNumberOfUnit ?? ''],
    RevenueChargeUomSid:[data?.RevenueChargeUomSid ?? ''],
    RevenuePrepaidCollect:[data?.RevenuePrepaidCollect ?? "Prepaid"],
    RevenueCurrencyMasterSid: [data?.RevenueCurrencyMasterSid ?? null],
    RevenueExchangeRate: [data?.RevenueExchangeRate != null ? Number(data.RevenueExchangeRate).toFixed(this.digitsAfterDecimal) : ''],
    RevenueRate: [data?.RevenueRate != null ? Number(data.RevenueRate).toFixed(this.digitsAfterDecimal) : ''],
    RevenueAmount: [data?.RevenueAmount != null ? Number(data.RevenueAmount).toFixed(this.digitsAfterDecimal) : ''],
    RevenueLocalAmount: [data?.RevenueLocalAmount != null ? Number(data.RevenueLocalAmount).toFixed(this.digitsAfterDecimal) : ''],
    RevenueDrCr: [data?.RevenueDrCr ?? 'C'],
    RevenueVoucherHeaderSid: [data?.RevenueVoucherHeaderSid ?? null],
    RevenueVoucherTypeSid: [data?.RevenueVoucherTypeMasterSid ?? null],
    RevenueVoucherHeader: [data?.revenueVoucherHeader || data?.RevenueVoucherHeader || null],  // Store voucher header object for display
    RevenueVoucherType: [data?.revenueVoucherTypeMaster || data?.RevenueVoucherType || null],  // Store voucher type object for display

    CustomerMasterSid: [data?.CustomerMasterSid ?? null],
    AgentSid: [data?.AgentMasterSid ?? null],
    AgentBranchSid: [data?.AgentBranchSid ?? null],
    CustomerBranchSid: [data?.CustomerBranchSid ?? null],

    Status: [data?.Status ?? ''],
    Remarks: [data?.Remarks ?? ''],

    // Store actual IDs separately for validation
    _costVoucherHeaderSid: [data?.CostVoucherHeaderSid ?? null],
    _revenueVoucherHeaderSid: [data?.RevenueVoucherHeaderSid ?? null]
  });
  return form

}


  /**
   * Get BookingHeaderSid from parent form, existing rates, or route parameter
   */
  getBookingHeaderSid(): number | null {
    // First try to get from parent form
    if (this.parentFormValue?.BookingHeaderSid) {
      return this.parentFormValue.BookingHeaderSid;
    }

    // If not in parent form, try to get from existing rates
    if (this.rateFormArray.length > 0) {
      const firstRate = this.rateFormArray.at(0).getRawValue();
      if (firstRate.BookingHeaderSid) {
        return firstRate.BookingHeaderSid;
      }
    }

    // Third fallback - try to get from route parameter
    if (this.routeBookingHeaderSid) {
      return this.routeBookingHeaderSid;
    }

    return null;
  }

  addRateRow(data?:any){
    // When adding a new row without data, populate it with parent form values immediately
    if (!data && this.parentFormValue) {
      const bookingHeaderSid = this.getBookingHeaderSid();
      data = {
        BookingHeaderSid: bookingHeaderSid,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid || null,
        BranchMasterSid: this.currentBranch?.BranchMasterSid || null,
        CustomerMasterSid: this.parentFormValue.CustomerMasterSid || null,
        CustomerBranchSid: this.parentFormValue.CustomerBranchSid || null
      };
    }

    const formGroup = this.createRateFormGroup(data);
    this.rateFormArray.push(formGroup);
  }


  onRateSubmit() {
    if (this.rateForm.invalid) {
      this.rateForm.markAllAsTouched();
      this.rateForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }
    const formValue = this.rateForm.getRawValue();
    this.updateCostPagination();
    this.updateRevenuePagination();
    this.calculateProfit();
    this.modalService.dismissAll();
  }

  onChargeChange(charge: any) {
    console.log(charge,'charge')
    if (!charge) {
      this.rateForm.get('ChargeDescription')?.setValue('');
      return;
    }
    this.rateForm.get('ChargeMasterSid')?.setValue(charge.ChargeMasterSid);
    this.rateForm.get('ChargeDescription')?.setValue(charge.chargeName);
    this.rateForm.get('CurrencyMasterSid')?.setValue(charge.CurrencyMasterSid);
    this.calculateAmount();
    this.getExchangeRate();
  }


  onChangeUOM(uom: any,i?:any) {
    if (!uom) {
      this.rateForm.get('CostChargeUomSid')?.setValue('');
      this.rateForm.get('RevenueChargeUomSid')?.setValue('');
      return;
    }
    this.rateForm.get('ChargeUomSid')?.setValue(uom.UOMName);
    this.rateForm.get('CostChargeUomSid')?.setValue(uom.UOMName);
    this.rateForm.get('RevenueChargeUomSid')?.setValue(uom.UOMName);
  }


  
  updateCostPagination() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    // this.slicedCostFormArray = this.costFormArray.getRawValue().slice(start, end);
  }

  updateRevenuePagination() {
    const start = (this.page1 - 1) * this.pageSize1;
    const end = start + this.pageSize1;
  }

  deleteRate(index: number, BookingRatesSid?: number) {
    const formGroup = this.rateFormArray.at(index) as FormGroup;

    // Check if voucher exists
    // Check the hidden ID fields for voucher existence
    if (formGroup.get('_costVoucherHeaderSid')?.value || formGroup.get('_revenueVoucherHeaderSid')?.value) {
      this.appSettingService.showWarning('Cannot delete rate. Voucher already generated for this rate.');
      return;
    }

    if (BookingRatesSid) {
      this.operationService.deleteBookingRate(BookingRatesSid).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.rateFormArray.removeAt(index);
            this.appSettingService.showSuccess("Rate Deleted Successfully");
          } else {
            this.appSettingService.showError(resp.message || 'Error deleting rate');
          }
        },
        (error) => {
          this.appSettingService.showError(error?.error?.message || 'Error deleting rate');
        }
      );
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
   * Save all rates at once
   */
  saveAllRates() {
    const ratesToSave = this.rateFormArray.controls.filter((control, index) => {
      const rateData = control.getRawValue();
      // Check if rate has charge and can be edited (no voucher)
      return rateData.ChargeMasterSid && this.canEditRate(index);
    });

    if (ratesToSave.length === 0) {
      this.appSettingService.showWarning('No charges to save');
      return;
    }

    let savedCount = 0;
    let errorCount = 0;

    // Save each rate
    ratesToSave.forEach((control, idx) => {
      const index = this.rateFormArray.controls.indexOf(control);
      const rateData = control.getRawValue();

      // Validate required fields before creating payload
      const bookingHeaderSid = this.getBookingHeaderSid() || rateData.BookingHeaderSid;

      if (!bookingHeaderSid) {
        errorCount++;
        console.error('BookingHeaderSid is missing for rate at index:', index);
        console.warn('Please save the booking first before adding rates.');
        this.appSettingService.showWarning('Please save the booking first before adding rates.');
        if (savedCount + errorCount === ratesToSave.length) {
          this.showSaveResults(savedCount, errorCount);
        }
        return;
      }

      const payload = {
        BookingHeaderSid: bookingHeaderSid,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        CreatedBy: localStorage.getItem('userName') || 'system',
        UpdatedBy: localStorage.getItem('userName') || 'system',

        ChargeMasterSid: rateData.ChargeMasterSid,
        ChargeDescription: rateData.ChargeDescription,
        NoOfUnit: rateData.NumberOfUnit || null,

        // Cost Section
        CostPrepaidCollect: rateData.CostPrepaidCollect || 'Prepaid',
        CostCurrencyMasterSid: rateData.CostCurrencyMasterSid,
        CostExchangeRate: rateData.CostExchangeRate,
        CostRate: rateData.CostRate,
        CostNumberOfUnit: null, // This field has Decimal(4,3) precision - max 9.999
        CostDrCr: 'D',
        CostAmount: rateData.CostAmount || 0,
        CostLocalAmount: rateData.CostLocalAmount || 0,
        CostChargeUomSid: rateData.CostChargeUomSid,

        // Revenue Section
        RevenuePrepaidCollect: rateData.RevenuePrepaidCollect || 'Prepaid',
        RevenueCurrencyMasterSid: rateData.RevenueCurrencyMasterSid,
        RevenueExchangeRate: rateData.RevenueExchangeRate,
        RevenueRate: rateData.RevenueRate,
        RevenueNumberOfUnit: null, // This field has Decimal(4,3) precision - max 9.999
        RevenueDrCr: 'C',
        RevenueAmount: rateData.RevenueAmount || 0,
        RevenueLocalAmount: rateData.RevenueLocalAmount || 0,
        RevenueChargeUomSid: rateData.RevenueChargeUomSid,

        // Billing Parties
        CustomerMasterSid: rateData.CustomerMasterSid || this.parentFormValue?.CustomerMasterSid,
        CustomerBranchSid: rateData.CustomerBranchSid || this.parentFormValue?.CustomerBranchSid,
        AgentMasterSid: rateData.AgentSid,

        Remarks: rateData.Remarks
      };

      if (rateData.BookingRatesSid) {
        // Update existing rate
        this.operationService.updateBookingRate(rateData.BookingRatesSid, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              savedCount++;
              control.patchValue({
                ...resp.data,
                NumberOfUnit: resp.data.NoOfUnit
              });

              if (savedCount + errorCount === ratesToSave.length) {
                this.showSaveResults(savedCount, errorCount);
              }
            } else {
              errorCount++;
              if (savedCount + errorCount === ratesToSave.length) {
                this.showSaveResults(savedCount, errorCount);
              }
            }
          },
          (error) => {
            errorCount++;
            if (savedCount + errorCount === ratesToSave.length) {
              this.showSaveResults(savedCount, errorCount);
            }
          }
        );
      } else {
        // Create new rate
        this.operationService.createBookingRate(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              savedCount++;
              control.patchValue({
                ...resp.data,
                NumberOfUnit: resp.data.NoOfUnit
              });

              if (savedCount + errorCount === ratesToSave.length) {
                this.showSaveResults(savedCount, errorCount);
              }
            } else {
              errorCount++;
              if (savedCount + errorCount === ratesToSave.length) {
                this.showSaveResults(savedCount, errorCount);
              }
            }
          },
          (error) => {
            errorCount++;
            if (savedCount + errorCount === ratesToSave.length) {
              this.showSaveResults(savedCount, errorCount);
            }
          }
        );
      }
    });
  }

  /**
   * Show save results
   */
  showSaveResults(savedCount: number, errorCount: number) {
    if (savedCount > 0 && errorCount === 0) {
      this.appSettingService.showSuccess(`${savedCount} charge(s) saved successfully`);
    } else if (savedCount > 0 && errorCount > 0) {
      this.appSettingService.showWarning(`${savedCount} charge(s) saved, ${errorCount} failed`);
    } else {
      this.appSettingService.showError('Failed to save charges');
    }
  }

  /**
   * Save individual rate (create or update)
   */
  saveRate(index: number) {
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    const rateData = formGroup.getRawValue();

    // Validate required fields
    if (!rateData.ChargeMasterSid) {
      this.appSettingService.showWarning('Please select a charge');
      return;
    }

    const bookingHeaderSid = this.getBookingHeaderSid() || rateData.BookingHeaderSid;
    if (!bookingHeaderSid) {
      this.appSettingService.showWarning('Please save the booking first before adding rates.');
      return;
    }

    const payload = {
      BookingHeaderSid: bookingHeaderSid,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      CreatedBy: localStorage.getItem('userName') || 'system',
      UpdatedBy: localStorage.getItem('userName') || 'system',

      ChargeMasterSid: rateData.ChargeMasterSid,
      ChargeDescription: rateData.ChargeDescription,
      NoOfUnit: rateData.NumberOfUnit || null,

      // Cost Section
      CostPrepaidCollect: rateData.CostPrepaidCollect || 'Prepaid',
      CostCurrencyMasterSid: rateData.CostCurrencyMasterSid,
      CostExchangeRate: rateData.CostExchangeRate,
      CostNumberOfUnit: rateData.CostNumberOfUnit,
      CostDrCr: 'D',
      CostAmount: rateData.CostAmount || 0,
      CostLocalAmount: rateData.CostLocalAmount || 0,
      CostChargeUomSid: rateData.CostChargeUomSid,

      // Revenue Section
      RevenuePrepaidCollect: rateData.RevenuePrepaidCollect || 'Prepaid',
      RevenueCurrencyMasterSid: rateData.RevenueCurrencyMasterSid,
      RevenueExchangeRate: rateData.RevenueExchangeRate,
      RevenueNumberOfUnit: rateData.RevenueNumberOfUnit,
      RevenueDrCr: 'C',
      RevenueAmount: rateData.RevenueAmount || 0,
      RevenueLocalAmount: rateData.RevenueLocalAmount || 0,
      RevenueChargeUomSid: rateData.RevenueChargeUomSid,

      // Billing Parties
      CustomerMasterSid: rateData.CustomerMasterSid || this.parentFormValue?.CustomerMasterSid,
      CustomerBranchSid: rateData.CustomerBranchSid || this.parentFormValue?.CustomerBranchSid,
      AgentMasterSid: rateData.AgentSid,

      Remarks: rateData.Remarks
    };

    if (rateData.BookingRatesSid) {
      // Update existing rate
      this.operationService.updateBookingRate(rateData.BookingRatesSid, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Rate updated successfully');
            // Update form with returned data
            formGroup.patchValue({
              ...resp.data,
              NumberOfUnit: resp.data.NoOfUnit
            });
          } else {
            this.appSettingService.showError(resp.message || 'Error updating rate');
          }
        },
        (error) => {
          this.appSettingService.showError(error?.error?.message || 'Error updating rate');
        }
      );
    } else {
      // Create new rate
      this.operationService.createBookingRate(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Rate created successfully');
            // Update form with returned data including the new ID
            formGroup.patchValue({
              ...resp.data,
              NumberOfUnit: resp.data.NoOfUnit
            });
          } else {
            this.appSettingService.showError(resp.message || 'Error creating rate');
          }
        },
        (error) => {
          this.appSettingService.showError(error?.error?.message || 'Error creating rate');
        }
      );
    }
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
      console.log(unitQtyBasis);
      if (!unitQtyBasis) {
        return; 
      }
  
      const qtySourceField = this.findFieldForQty(unitQtyBasis);
      console.log(qtySourceField);
      let newQty = 1;
      
      if (typeof qtySourceField === 'string' && this.parentFormValue[qtySourceField]) {
        newQty = this.parentFormValue[qtySourceField] || 1;
      } else if (typeof qtySourceField === 'number') {
        newQty = qtySourceField;
      }
      console.log(this.parentFormValue);
      console.log(newQty);
  
      rateGroup.get('NumberOfUnit')?.setValue(newQty);
      this.calculateRevenueLocalAmount(rateIndex);
      this.calculateCostLocalAmount(rateIndex);
    }

  /**
   * Calculate cost amount when per unit or number of units changes
   */
  calculateCostAmount(index: number) {
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    // Use NumberOfUnit (main field) if CostNumberOfUnit is not set
    const numberOfUnits = Number(formGroup.get('CostNumberOfUnit')?.value || formGroup.get('NumberOfUnit')?.value || 0);
    const perUnit = Number(formGroup.get('CostRate')?.value || 0);

    const amount = numberOfUnits * perUnit;
    formGroup.patchValue({
      CostAmount: amount.toFixed(this.digitsAfterDecimal)
    }, { emitEvent: false });

    this.calculateCostLocalAmount(index);
  }

  /**
   * Calculate cost local amount when amount or exchange rate changes
   */
  calculateCostLocalAmount(index: number) {
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    const amount = Number(formGroup.get('CostAmount')?.value || 0);
    const exchangeRate = Number(formGroup.get('CostExchangeRate')?.value || 1);

    const localAmount = amount * exchangeRate;
    formGroup.patchValue({
      CostLocalAmount: localAmount.toFixed(this.digitsAfterDecimal)
    }, { emitEvent: false });
  }

  /**
   * Calculate revenue amount when per unit or number of units changes
   */
  calculateRevenueAmount(index: number) {
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    // Use NumberOfUnit (main field) if RevenueNumberOfUnit is not set
    const numberOfUnits = Number(formGroup.get('RevenueNumberOfUnit')?.value || formGroup.get('NumberOfUnit')?.value || 0);
    const perUnit = Number(formGroup.get('RevenueRate')?.value || 0);

    const amount = numberOfUnits * perUnit;
    formGroup.patchValue({
      RevenueAmount: amount.toFixed(this.digitsAfterDecimal)
    }, { emitEvent: false });

    this.calculateRevenueLocalAmount(index);
  }

  /**
   * Calculate revenue local amount when amount or exchange rate changes
   */
  calculateRevenueLocalAmount(index: number) {
    const formGroup = this.rateFormArray.at(index) as FormGroup;
    const amount = Number(formGroup.get('RevenueAmount')?.value || 0);
    const exchangeRate = Number(formGroup.get('RevenueExchangeRate')?.value || 1);

    const localAmount = amount * exchangeRate;
    formGroup.patchValue({
      RevenueLocalAmount: localAmount.toFixed(this.digitsAfterDecimal)
    }, { emitEvent: false });
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
      formGroup.patchValue({ CostExchangeRate: '1.00' });
      this.calculateCostLocalAmount(index);
      return;
    }

    const payload = { fromCurrencyCode, toCurrencyCode ,segment: 'cost' };
    this.operationService.getExchangeRate(payload).subscribe(
      (resp: any) => {
        if (resp.status && resp.data) {
          const formGroup = this.rateFormArray.at(index) as FormGroup;
          formGroup.patchValue({ CostExchangeRate: Number(resp.data).toFixed(this.digitsAfterDecimal) });
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
      formGroup.patchValue({ RevenueExchangeRate: '1.00' });
      this.calculateRevenueLocalAmount(index);
      return;
    }

    const payload = { fromCurrencyCode, toCurrencyCode , segment : 'revenue'};
    this.operationService.getExchangeRate(payload).subscribe(
      (resp: any) => {
        if (resp.status && resp.data) {
          const formGroup = this.rateFormArray.at(index) as FormGroup;
          formGroup.patchValue({ RevenueExchangeRate: Number(resp.data).toFixed(this.digitsAfterDecimal) });
          this.calculateRevenueLocalAmount(index);
        }
      }
    );
  }



  onCurrencyChange(currency,i?:any) {
    if (!currency) {
      this.rateForm.get('CostExchangeRate')?.setValue('');
      this.rateForm.get('CostLocalAmount')?.setValue('');
      this.rateForm.get('RevenueLocalAmount')?.setValue('');
      this.rateForm.get('RevenueLocalAmount')?.setValue('');
      return;
    }
    this.getExchangeRate();
  }



  getExchangeRate() {
    const fromCurrency = Number(this.rateForm.get('CurrencyMasterSid')?.value);
    const toCurrency = Number(this.currentCompany?.CurrencyMasterSid);
    const fromCurrencyCode = (this.currencyList.find(curr => curr.CurrencyMasterSid === fromCurrency)?.currencyCode);
    const toCurrencyCode = (this.currencyList.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode);
    if (!fromCurrencyCode || !toCurrencyCode) {
      return;
    }
    if (fromCurrencyCode === toCurrencyCode) {
      this.rateForm.get('RevenueExchangeRate')?.setValue(1);
      this.rateForm.get('CostExchangeRate')?.setValue(1);
      this.calculateLocalAmount();
      return;
    }
    const payload = {
      fromCurrencyCode,
      toCurrencyCode
    }
    this.operationService.getExchangeRate(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.rateForm.get('CostExchangeRate')?.setValue(resp.data ? resp.data : '');
          this.rateForm.get('RevenueExchangeRate')?.setValue(resp.data ? resp.data : '');

          this.calculateLocalAmount();
        } else {
          this.appSettingService.showWarning('Error fetching exchange rate');
        }
      }
    )
  }

  calculateLocalAmount() {
    const CostnoOfUnit = this.rateForm.get('CostNumberOfUnit')?.value;
    const RevenuenoOfUnit = this.rateForm.get('RevenueNumberOfUnit')?.value;


    const Costrate = this.rateForm.get('CostRate')?.value;
    const Revenuerate = this.rateForm.get('RevenueRate')?.value;

    const excostrate = this.rateForm.get('CostExchangeRate')?.value;
    const exrevenuerate = this.rateForm.get('RevenueExchangeRate')?.value;

    const Costctrl = this.rateForm.get('CostLocalAmount');
    const Revenuectrl = this.rateForm.get('RevenueLocalAmount');

    if (!CostnoOfUnit || !Costrate || !excostrate) {
      Costctrl.setValue('');
      return;
    }

    if (!RevenuenoOfUnit || !Revenuerate || !exrevenuerate) {
      Revenuectrl.setValue('');
      return;
    }
    const LocalCostAmount = (Number(CostnoOfUnit) * Number(Costrate) * Number(excostrate)).toFixed(3);
    const LocalRevenueAmount = (Number(RevenuenoOfUnit) * Number(Revenuerate) * Number(exrevenuerate)).toFixed(3);

    Costctrl.setValue(LocalCostAmount);
    Revenuectrl.setValue(LocalRevenueAmount);

    Costctrl.updateValueAndValidity();
    Revenuectrl.updateValueAndValidity();
  }


  calculateAmount() {
    const CostnoOfUnit = this.rateForm.get('CostNumberOfUnit')?.value;
    const RevenuenoOfUnit = this.rateForm.get('RevenueNumberOfUnit')?.value;
    const Costrate = this.rateForm.get('CostRate')?.value;
    const Revenuerate = this.rateForm.get('RevenueRate')?.value;

    const Costctrl = this.rateForm.get('CostAmount');
    const Revenuectrl = this.rateForm.get('RevenueAmount');

    if (!CostnoOfUnit || !Costrate) {
      Costctrl.setValue('');
      return;
    }

    if (!RevenuenoOfUnit || !Revenuerate) {
      Revenuectrl.setValue('');
      return;
    }

    const Costamount = (Number(CostnoOfUnit) * Number(Revenuerate)).toFixed(3);
    const Revenueamount = (Number(RevenuenoOfUnit) * Number(Revenuerate)).toFixed(3);
    Costctrl.setValue(Costamount);
    Revenuectrl.setValue(Revenueamount);

    Costctrl.updateValueAndValidity();
    Revenuectrl.updateValueAndValidity();

  }




  calculateProfit() {
    this.profitSummary = [];
    // const costFormValue: any[] = this.costFormArray.getRawValue() || [];
    // const revenueFormValue: any[] = this.revenueFormArray.getRawValue() || [];
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
              const QtyValue = charge.UnitQty;
              const qtySourceField = this.findFieldForQty(charge?.UnitQty);
              let value = 1;
              if (typeof qtySourceField === 'string' && this.parentFormValue[qtySourceField]) {
                value = this.parentFormValue[qtySourceField] || 1;
              } else if (typeof qtySourceField === 'number') {
                value = qtySourceField;
              }

              return {
                ChargeMasterSid: charge?.ChargeMasterSid,
                ChargeDescription: td.Description,
                ChargeUomSid: td.UOMSid,
                NoOfUnit: value,

                CostPrepaidCollect: "Prepaid",
                CostCurrencyMasterSid : td.BuyCurrency,
                CostExchangeRate : Number(td.costExchangeRate).toFixed(this.digitsAfterDecimal),
                CostRate : Number(td.BuyPerUnitPrice).toFixed(this.digitsAfterDecimal),
                CostDrCr : 'D',
                CostAmount : (Number(value) * Number(td.BuyPerUnitPrice)).toFixed(this.digitsAfterDecimal),
                CostLocalAmount : (Number(td.costExchangeRate) * Number(value) * Number(td.BuyPerUnitPrice)).toFixed(this.digitsAfterDecimal),
                CostChargeUomSid: td.UOMSid,

                RevenuePrepaidCollect: "Prepaid",
                RevenueCurrencyMasterSid : td.SaleCurrency,
                RevenueExchangeRate : Number(td.costExchangeRate).toFixed(this.digitsAfterDecimal),
                RevenueRate : Number(td.SalePerUnitPrice).toFixed(this.digitsAfterDecimal),
                RevenueDrCr : 'C',
                RevenueAmount : (Number(value) * Number(td.SalePerUnitPrice)).toFixed(this.digitsAfterDecimal),
                RevenueLocalAmount : (Number(td.costExchangeRate) * Number(value) * Number(td.SalePerUnitPrice)).toFixed(this.digitsAfterDecimal),
                RevenueChargeUomSid: td.UOMSid
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

    if(this.rateFormArray.length === 0){
      this.rateFormArray.push(this.createRateFormGroup(detail));
      return;
    }
    if(this.checkIfLastChargeEmpty()){
      const rateGroup = this.rateFormArray.at(this.rateFormArray.length - 1);
      rateGroup.patchValue(detail);
    } else {
      this.rateFormArray.push(this.createRateFormGroup(detail));
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


//   onRevenueTypeChange(e: any, i:any) {
// const array = this.rateForm.get('rateFormArray') as FormArray;
//   const row = array.at(i) as FormGroup;
//   row.patchValue({ RevenueVoucherTypeSid: e?.VoucherTypeMasterSid ?? null });
//   console.log('Updated row:', row.value);}


// onRevenueVoucherChange(e: any,i) {
//   const array = this.rateForm.get('rateFormArray') as FormArray;
//   const row = array.at(i) as FormGroup;
//   row.patchValue({ RevenueVoucherHeaderSid: e?.VoucherHeaderSid ?? null });
//   console.log('Updated row:', row.value);
// }


// onCostTypeChange(e: any,i) {
//    const array = this.rateForm.get('rateFormArray') as FormArray;
//   const row = array.at(i) as FormGroup;
//   row.patchValue({ CostVoucherTypeSid: e?.VoucherTypeMasterSid ?? null });
//   console.log('Updated row:', row.value);
// }

// onCostVoucherChange(e: any,i) {
//  const array = this.rateForm.get('rateFormArray') as FormArray;
//   const row = array.at(i) as FormGroup;
//   row.patchValue({ CostVoucherHeaderSid: e?.VoucherHeaderSid ?? null });
//   console.log('Updated row:', row.value);
// }

  handleCustomerChange(rateIndex:number , customer: any) {
    const formGroup = this.rateFormArray.at(rateIndex) as FormGroup;
    if (!customer || customer === undefined) {
      formGroup.get('CustomerBranchSid')?.setValue(null);
      return;
    }
    formGroup.get('CustomerBranchSid')?.setValue(customer.CustomerBranchSid);
  }

  handleAgentChange(rateIndex:number , agent: any) {
    const formGroup = this.rateFormArray.at(rateIndex) as FormGroup;
    if (!agent || agent === undefined) {
      formGroup.get('AgentBranchSid')?.setValue(null);
      return;
    }
    formGroup.get('AgentBranchSid')?.setValue(agent.CustomerBranchSid);
  }

  filterDepartmentBasedOnSegment(departmentName: string) {
    if (departmentName) {
      console.log(departmentName);
      this.filteredChargeList = this.chargeList.filter(charge => {
        const allDepartmentNames = charge.DepartmentMasterSid || [];
        console.log(allDepartmentNames);
        return allDepartmentNames.includes(departmentName);
      });
    }
  }


}
