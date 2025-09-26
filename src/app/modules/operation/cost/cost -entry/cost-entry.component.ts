import { Component, ViewChild, TemplateRef, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { ExcelExportService } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-cost-entry',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    FeatherModule,
    OnlyNumbersDirective,
    DecimalPrecisionDirective,
    OnlyNumbersDirective,
    TextWithNumbersDirective
  ],
  templateUrl: './cost-entry.component.html',
  styleUrls: ['./cost-entry.component.scss'],
  providers : [
    CustomDatePipe
  ]
})
export class CostEntryComponent implements OnInit {

  selectedTab = 'Sales and cost';
  costFormArray: FormArray;
  revenueFormArray: FormArray;
  chargeList: any[] = [];
  uomList: any[] = [];
  docTypeList: any[] = [];
  slicedCostFormArray: any[] = [];
  slicedRevenueFormArray: any[] = [];
  tariffLoading : boolean;
  tariffDetails : any[] = [];
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


  ppcc = [
    { id: 1, name: 'Prepaid' },
    { id: 2, name: 'Collect' }
  ]
  drcr = [
    { id: 1, name: 'Debit', value: 'D' },
    { id: 2, name: 'Credit', value: 'C' }
  ]
  tabs = [
    { name: 'Cost', icon: 'fas fa-rupee-sign' },
    { name: 'Revenue', icon: 'fas fa-chart-line' },
    { name: 'Profit', icon: 'fas fa-dollar-sign' },
  ];
  ModeofStatus=[
    {id:'A',name:"Active"},
    {id:'S',name:"Suspended"}
  ]
  ModeofShowType=[
    {id:1,name:"All"},
    {id:2,name:"Accounting"},
    {id:3,name:"Non-Accounting"},
    {id:4,name:"Manifest"},
    {id:5,name:"Non-Manifest"}
  ]
  ModeofProfitShare=[
    {id:1,name:"Yes"},
    {id:2,name:"No"}
  ]
  ModeofNeutral=[
     {id:1,name:"Yes"},
    {id:2,name:"No"}
  ]
  selectTab(tab: string) {
    this.selectedTab = tab;
  }


  @Input() screenName: string;
  private _currencyList: any[] = [];
  private _customerList: any[] = [];
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

  private prevValue;
  @Input()
  set resetTrigger(value: boolean) {
    if(value !== this.prevValue){
      this.prevValue = value;
      this.costFormArray?.clear();
      this.revenueFormArray?.clear();
      this.costDataLength = 0;
      this.revenueDataLength = 0;
      this.profitSummary = [];
      this.slicedCostFormArray = [];
      this.slicedRevenueFormArray = [];
    }
  }

  

  @Input()
  set dataItems(value: any[]) {
    if (value && value.length > 0) {
      this._dataItems = value;
      this.patchValues(this._dataItems);
    } else {
      this._dataItems = [];
      this.costFormArray?.clear();
      this.revenueFormArray?.clear();
      this.costDataLength = 0;
      this.revenueDataLength = 0;
      this.profitSummary = [];
      this.slicedCostFormArray = [];
      this.slicedRevenueFormArray = [];
    }
  }
  get dataItems(): any[] {
    return this._dataItems;
  }

  parentFormValue : any = {};
  @Input() 
  set formData(value:any){
    if(value){
      this.parentFormValue = value;
    } else {
      this.parentFormValue = {};
    }
  }

  @Output() dataEmitter = new EventEmitter<any[]>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
@ViewChild('leftTableBody') leftBody!: ElementRef;
@ViewChild('rightTableBody') rightBody!: ElementRef;
syncScroll(event: Event) {
  const scrollTop = (event.target as HTMLElement).scrollTop;
  this.leftBody.nativeElement.scrollTop = scrollTop;
}
  rateForm!: FormGroup;
  currentRateIndex: number = -1;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private excelExportService : ExcelExportService,
    private datePipe : CustomDatePipe
  ) {
    this.costFormArray = this.fb.array([]);
    this.revenueFormArray = this.fb.array([]);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentCompany?.BranchMasterSid,
    }
    this.initRateForm();
    this.loadRateLookups();
  }

  loadRateLookups() {
    forkJoin({
      allMasters: this.operationService.getAllBookingRateLookups(this.filterOption).pipe(catchError(err => of({ charges: [], uoms: [], docTypes: [] }))),
    }).subscribe(({ allMasters }) => {
      this.chargeList = allMasters.charges;
      this.uomList = allMasters.uoms;
      this.docTypeList = allMasters.docTypes;
    })
  }



  revenueRows = [
    {
      charge: '',
      chargeDesc: '',
      ppcc: '',
      unit: '',
      noOfUnit: '',
      drCr: '',
      curr: '',
      exRate: '',
      rate: '',
      amount: '',
      localAmount: '',
      billingParty: '',
      voucherNo: '',
      type: ''
    }
  ];

  addRow() {
    this.revenueRows.push({
      charge: '',
      chargeDesc: '',
      ppcc: '',
      unit: '',
      noOfUnit: '',
      drCr: '',
      curr: '',
      exRate: '',
      rate: '',
      amount: '',
      localAmount: '',
      billingParty: '',
      voucherNo: '',
      type: ''
    });
  }

 deleteRow(index: number): void {
  this.revenueRows.splice(index, 1);
}



  initRateForm() {
    this.rateForm = this.fb.group({
      BookingRatesSid: [null],
      CostRevenueChargesSid: [null],
      TransactionSid : [null],
      SerialNumber: [{ value: '', disabled: true }],
      ChargeMasterSid: [null],
      ChargeDescription: [''],
      ChargeUomSid: [null],
      NumberOfUnit: [''],
      PrepaidCollect: [''],
      Status:[''],
      Remarks:[''],
      CostDrCr: [''],
      RevenueDrCr: [''],

      RevenueCurrencyMasterSid: [null], 
      CostCurrencyMasterSid: [null],

      RevenueExchangeRate:[''],
      CostExchangeRate: [''],

      RevenueRate:[''],
      CostRate: [''],

      RevenueAmount:[''],
      CostAmount:[''],

      RevenueLocalAmount: [''],
      CostLocalAmount: [''],
      CustomerMasterSid: [null],
      CustomerBranchSid: [null],
      VoucherHeaderSid: [null],
      VoucherTypeSid: [null],
    });
  }

  get r(): { [key: string]: any } {
    return this.rateForm.controls;
  }


  patchValues(items: any[]) {
    this.costFormArray.clear();
    this.revenueFormArray.clear();
    for (const item of items) {
      const formGroup = this.createRateFormGroup(item);
      if (item.CostRevenue === "Cost") {
        this.costFormArray.push(formGroup);
      } else {
        this.revenueFormArray.push(formGroup);
      }
    }
    console.log(this.costFormArray.value);
    console.log(this.revenueFormArray.value);
    this.costDataLength = this.costFormArray.length;
    this.revenueDataLength = this.revenueFormArray.length;
    this.costFormArray.updateValueAndValidity();
    this.revenueFormArray.updateValueAndValidity();
    this.updateCostPagination();
    this.updateRevenuePagination();
    this.calculateProfit();
  }

  createRateFormGroup(data?: any): FormGroup {
    return this.fb.group({
      BookingRatesSid: [data?.BookingRatesSid || null],
      BookingHeaderSid: [data?.BookingHeaderSid || null],
      CompanyMasterSid: [data?.CompanyMasterSid || null],
      BranchMasterSid: [data?.BranchMasterSid || null],
      CostRevenueChargesSid: [data?.CostRevenueChargesSid || null],
      TransactionSid : [data?.TransactionSid || null],
      SerialNumber: [data?.SerialNumber || ''],
      ChargeMasterSid: [data?.ChargeMasterSid || null],
      ChargeDescription: [data?.ChargeDescription || ''],
      PrepaidCollect: [data?.PrepaidCollect || null],
      ChargeUomSid: [data?.ChargeUomSid || null],
      NumberOfUnit: [data?.NumberOfUnit || ''],
      CostDrCr: [data?.CostDrCr || null],
      RevenueDrCr: [data?.RevenueDrCr || null],
      CostCurrencyMasterSid: [data?.CostCurrencyMasterSid || null],
      RevenueCurrencyMasterSid: [data?.RevenueCurrencyMasterSid || null],
      CostExchangeRate: [Number(data?.CostExchangeRate).toFixed(2) || ''],
      RevenueExchangeRate: [Number(data?.RevenueExchangeRate).toFixed(2) || ''],
      CostRate: [Number(data?.CostRate).toFixed(2) || ''],
      RevenueRate: [Number(data?.RevenueRate).toFixed(2) || ''],
      CostAmount: [Number(data?.CostAmount).toFixed(2) || ''],
      RevenueAmount: [Number(data?.RevenueAmount).toFixed(2) || ''],
      // CostRevenue: [data?.CostRevenue || ''],
      CostLocalAmount: [Number(data?.CostLocalAmount).toFixed(2) || ''],
      RevenueLocalAmount: [Number(data?.RevenueLocalAmount).toFixed(2) || ''],
      CustomerMasterSid: [data?.CustomerMasterSid || null],
      CustomerBranchSid: [data?.CustomerBranchSid || null],
      VoucherHeaderSid: [data?.VoucherHeaderSid || null],
      VoucherTypeSid: [data?.VoucherTypeSid || null],
      Status:[data?.Status],
      Remarks:[data?.Remarks]
    });
  }

  openModalBasedOnTab(content: TemplateRef<any>, data?: any, index?: number) {
    this.initRateForm();
    this.currentRateIndex = index ?? -1;
    let originalIndex;
    if (this.selectedTab === "Cost") {
      originalIndex = ((this.page - 1) * this.pageSize) + index;
    } else {
      originalIndex = ((this.page1 - 1) * this.pageSize1) + index;
    }
    if (data) {
      this.rateForm.patchValue({
        CostRevenueChargesSid: data?.CostRevenueChargesSid,
        TransactionSid : data?.TransactionSid,
        SerialNumber: originalIndex + 1,
        ChargeMasterSid: data.ChargeMasterSid,
        ChargeDescription: data.ChargeDescription,
        PrepaidCollect: data.PrepaidCollect,
        ChargeUomSid: data.ChargeUomSid,
        NumberOfUnit: data.NumberOfUnit,
        DrCr: data.DrCr,
        CurrencyMasterSid: data.CurrencyMasterSid,
        ExchangeRate: data.ExchangeRate,
        Rate: data.Rate,
        Amount: data.Amount,
        CostRevenue: this.selectedTab,
        LocalAmount: data.LocalAmount,
        CustomerMasterSid: data.CustomerMasterSid,
        CustomerBranchSid: data.CustomerBranchSid,
        VoucherHeaderSid: data.VoucherHeaderSid,
        VoucherTypeSid: data.VoucherTypeSid,
      });
    } else {
      this.rateForm.patchValue({
        CostRevenue: this.selectedTab,
        DrCr : this.selectedTab === "Cost" ? "D" : "C",
        SerialNumber: this.selectedTab === "Cost" ? this.costFormArray.length + 1 : this.revenueFormArray.length + 1
      })
    }
    this.modalService.open(content, { size: 'lg', backdrop: 'static', centered: true });
  }

  onRateSubmit() {
    if (this.rateForm.invalid) {
      this.rateForm.markAllAsTouched();
      this.rateForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const formValue = this.rateForm.getRawValue();
    if (this.currentRateIndex !== -1) {
      if (this.selectedTab === "Cost") {
        const existingForm = this.costFormArray.at(this.currentRateIndex) as FormGroup;
        existingForm.patchValue(formValue);
      } else {
        const existingForm = this.revenueFormArray.at(this.currentRateIndex) as FormGroup;
        existingForm.patchValue(formValue);
      }
    } else {
      if (this.selectedTab === "Cost") {
        this.costFormArray.push(this.rateForm);
      } else {
        this.revenueFormArray.push(this.rateForm);
      }
    }

    this.costDataLength = this.costFormArray.length;
    this.revenueDataLength = this.revenueFormArray.length;
    this.costFormArray.updateValueAndValidity();
    this.revenueFormArray.updateValueAndValidity();
    this.updateCostPagination();
    this.updateRevenuePagination();
    this.calculateProfit();
    this.syncDataWithParentComponent();
    this.modalService.dismissAll();
  }

  onChargeChange(charge: any) {
    if (!charge) {
      this.rateForm.get('ChargeDescription')?.setValue('');
      return;
    }
    this.rateForm.get('ChargeDescription')?.setValue(charge.chargeName);
    this.rateForm.get('ChargeUomSid')?.setValue(charge.UOM);
    this.rateForm.get('CurrencyMasterSid')?.setValue(charge.CurrencyMasterSid);
    this.calculateAmount();
    this.getExchangeRate();
  }

  copyRate(content: TemplateRef<any>,data ?:any) {
    this.openModalBasedOnTab(content);
    const selectedTabLen = this.selectedTab === 'Cost' ? this.costFormArray.length : this.revenueFormArray.length;
    this.rateForm.patchValue({
      ...data,
      SerialNumber: selectedTabLen + 1,
    });
  }

  syncDataWithParentComponent() {
    const costFormValue: any[] = this.costFormArray.getRawValue() || [];
    const revenueFormValue: any[] = this.revenueFormArray.getRawValue() || [];
    const combined = [...costFormValue, ...revenueFormValue];
    this.dataEmitter.emit(combined);
  }

  updateCostPagination() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.slicedCostFormArray = this.costFormArray.getRawValue().slice(start, end);
  }

  updateRevenuePagination() {
    const start = (this.page1 - 1) * this.pageSize1;
    const end = start + this.pageSize1;
    this.slicedRevenueFormArray = this.revenueFormArray.getRawValue().slice(start, end);
  }

  deleteRate(index: number, segment: string, BookingRatesSid?: number) {
    let realIndex;
    if (segment === "Cost") {
      realIndex = ((this.page - 1) * this.pageSize) + index;
    } else {
      realIndex = ((this.page1 - 1) * this.pageSize1) + index;
    }
    if (BookingRatesSid) {
      this.operationService.deleteBookingRate(BookingRatesSid).subscribe(
        (resp: any) => {
          if (resp.status) {
            if (segment === "Cost") {
              this.costFormArray.removeAt(realIndex);
              this.costDataLength = this.costFormArray.length;
              this.appSettingService.showSuccess('Cost deleted successfully.');
              this.adjustCostPageAfterDelete();
              this.updateCostPagination();
              this.calculateProfit();
              this.syncDataWithParentComponent();
            } else {
              this.revenueFormArray.removeAt(realIndex);
              this.revenueDataLength = this.revenueFormArray.length;
              this.appSettingService.showSuccess('Revenue deleted successfully.');
              this.adjustRevenuePageAfterDelete();
              this.updateRevenuePagination();
              this.calculateProfit();
              this.syncDataWithParentComponent();
            }
          } else {
            this.appSettingService.showError('Error deleting rate');
          }
        }
      );
    } else {

      if (segment === "Cost") {
        this.costFormArray.removeAt(realIndex);
        this.costDataLength = this.costFormArray.length;
        this.appSettingService.showSuccess('Cost deleted successfully.');
        this.adjustCostPageAfterDelete();
        this.updateCostPagination();
        this.calculateProfit();
        this.syncDataWithParentComponent();
      } else {
        this.revenueFormArray.removeAt(realIndex);
        this.revenueDataLength = this.revenueFormArray.length;
        this.appSettingService.showSuccess('Revenue deleted successfully.');
        this.adjustRevenuePageAfterDelete();
        this.updateRevenuePagination();
        this.calculateProfit();
        this.syncDataWithParentComponent();
      }
    }
  }

  adjustCostPageAfterDelete() {
    const totalPages = Math.ceil(this.costDataLength / this.pageSize);
    if (this.page > totalPages && totalPages > 0) {
      this.page = totalPages;
    } else if (this.costDataLength === 0) {
      this.page = 1;
    }
  }

  adjustRevenuePageAfterDelete() {
    const totalPages = Math.ceil(this.revenueDataLength / this.pageSize1);
    if (this.page1 > totalPages && totalPages > 0) {
      this.page1 = totalPages;
    } else if (this.revenueDataLength === 0) {
      this.page1 = 1;
    }
  }

  onCurrencyChange(currency) {
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

  save(){
    console.log(this.rateForm.getRawValue())
  }


  calculateProfit() {
    this.profitSummary = [];
    const costFormValue: any[] = this.costFormArray.getRawValue() || [];
    const revenueFormValue: any[] = this.revenueFormArray.getRawValue() || [];
    const data = [...costFormValue, ...revenueFormValue];

    data.forEach(item => {
      console.log(item);
      const amt = parseFloat(item.LocalAmount);
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

      if (item.CostRevenue === "Cost") {
        existing.totalCost += item.DrCr === "D" ? amt : -amt;
      }

      if (item.CostRevenue === "Revenue") {
        existing.totalSales += item.DrCr === "C" ? amt : -amt;
      }
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

      p.profit = profit.toFixed(2);
      p.profitPercent = profitPercent.toFixed(2) + "%";
      p.totalSales = p.totalSales.toFixed(2);
      p.totalCost = p.totalCost.toFixed(2);
    });


  }

  calculateTotal(field: string): number {
    return this.profitSummary.reduce((sum, item) => sum + parseFloat(item[field] || 0), 0);
  }

  calculateTotalProfitPercent(): number {
    const totalSales = this.calculateTotal('totalSales');
    const totalCost = this.calculateTotal('totalCost');
    const totalProfit = this.calculateTotal('profit');
    if(totalSales !== 0 && totalSales > totalCost){
      return totalProfit / totalSales * 100;
    }
    return totalSales !== 0 ? (totalProfit / totalCost) * 100 : 0;
  }

  getTotalProfitPercent(): string {
    return this.calculateTotalProfitPercent().toFixed(2);
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

  getDocTypeName(VoucherTypeSid) {
    if (!VoucherTypeSid || this.docTypeList.length === 0) {
      return '';
    }
    return (this.docTypeList.find(docType => docType.DocumentTypeMasterSid === VoucherTypeSid)?.DocumentTypeName);
  }

  getTariffDetails(content:TemplateRef<any>){
    if(!this.hasRequiredFieldsFilled()){
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
    this.modalService.open(content,{size : 'lg',centered : true , backdrop:'static'});
    this.operationService.getTariffDetails(this.parentFormValue).subscribe(
      (resp:any)=>{
        if(resp.status){
          const response : any[] = resp.data || [];
          this.tariffDetails = response
            .map((td:any)=>{
            const charge = this.getCharge(td.ChargeCode);
            return {
              ChargeMasterSid : charge.ChargeMasterSid,
              ChargeDescription : td.Description,
              PrepaidCollect : "Collect",
              ChargeUomSid : td.UOMSid,
              NumberOfUnit : value,
              Cost : {
                DrCr : 'D',
                CurrencyMasterSid : td.BuyCurrency,
                Rate : Number(td.BuyPerUnitPrice).toFixed(2),
                Amount : (Number(value) * Number(td.BuyPerUnitPrice)).toFixed(2),
                LocalAmount : (Number(td.costExchangeRate) * Number(value) * Number(td.BuyPerUnitPrice)).toFixed(2),
                ExchangeRate : Number(td.costExchangeRate).toFixed(2)
              },
              Revenue : {
                DrCr : 'C',
                CurrencyMasterSid : td.SaleCurrency,
                Rate : Number(td.SalePerUnitPrice).toFixed(2),
                Amount : (Number(value) * Number(td.SalePerUnitPrice)).toFixed(2),
                LocalAmount : (Number(td.revenueExchangeRate) * Number(value) * Number(td.SalePerUnitPrice)).toFixed(2),
                ExchangeRate : Number(td.revenueExchangeRate).toFixed(2)
              }
            }
          })
          console.log(this.tariffDetails);
          this.tariffLoading = false;
        } else {
          this.appSettingService.showError("Error loading Tariff Details");
          this.tariffLoading = false;
        }
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

  hasRequiredFieldsFilled(){
    const data = this.parentFormValue;
    return (data.DepartmentMasterSid || data.POLSid || data.PODSid || data.EffectiveDate || data.ExpiredDate)
  }

  applyTariff(detail){
    const costFormValue = {
      ChargeMasterSid: detail.ChargeMasterSid,
      ChargeDescription: detail.ChargeDescription,
      PrepaidCollect: "Collect",
      ChargeUomSid: detail.ChargeUomSid,
      NumberOfUnit: detail.NumberOfUnit,
      CostRevenue : "Cost",
      ...detail.Cost
    }
    console.log(costFormValue);
    const costFormGroup = this.createRateFormGroup(costFormValue); 
    this.costFormArray.push(costFormGroup);
    const revenueFormValue = {
      ChargeMasterSid: detail.ChargeMasterSid,
      ChargeDescription: detail.ChargeDescription,
      PrepaidCollect: "Collect",
      ChargeUomSid: detail.ChargeUomSid,
      NumberOfUnit: detail.NumberOfUnit,
      CostRevenue : "Revenue",
      ...detail.Revenue
    }
    const revenueFormGroup = this.createRateFormGroup(revenueFormValue);
    this.revenueFormArray.push(revenueFormGroup)
    this.costDataLength = this.costFormArray.length;
    this.revenueDataLength = this.revenueFormArray.length;
    this.costFormArray.updateValueAndValidity();
    this.revenueFormArray.updateValueAndValidity();
    this.updateCostPagination();
    this.updateRevenuePagination();
    this.calculateProfit();
    this.syncDataWithParentComponent();
    this.modalService.dismissAll();
  }

  closeTariffModal() {
    this.tariffDetails = [];
    this.modalService.dismissAll();
  }

  activeTab1: string = 'revenue';

  setTab(tab1: string) {
    this.activeTab1 = tab1;
  }

    openRevenueModal(content: any) {
    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  openCostModal(content: any) {
    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }

  reportCostRates(): void {
    const allCostRates = this.slicedCostFormArray;

    const formattedData = allCostRates.map(rate => ({
      ChargeCode: this.getChargeCode(rate.ChargeMasterSid),
      ChargeName: this.getChargeName(rate.ChargeMasterSid),
      ChargeDescription: rate.ChargeDescription || '',
      PrepaidCollect: rate.PrepaidCollect || '',
      UnitCode: this.getUnitCode(rate.ChargeUomSid),
      NumberOfUnit: rate.NumberOfUnit || 0,
      DebitCredit: rate.DrCr === 'D' ? 'Debit' : 'Credit',
      Currency: this.getCurrencyCode(rate.CurrencyMasterSid),
      ExchangeRate: rate.ExchangeRate || 0,
      Rate: rate.Rate || 0,
      Amount: rate.Amount || 0,
      LocalAmount: rate.LocalAmount || 0,
      Customer: this.getCustomerName(rate.CustomerMasterSid) || '',
      VoucherHeaderSid: rate.VoucherHeaderSid || '',
      DocumentType: this.getDocTypeName(rate.VoucherTypeSid)
    }));

    const companyName = this.currentCompany?.companyName ?? 'Company';

    this.excelExportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'ChargeCode', label: 'Charge Code' },
        { key: 'ChargeName', label: 'Charge Name' },
        { key: 'ChargeDescription', label: 'Charge Description' },
        { key: 'PrepaidCollect', label: 'Prepaid/Collect' },
        { key: 'UnitCode', label: 'Unit Code' },
        { key: 'NumberOfUnit', label: 'Number Of Unit' },
        { key: 'DebitCredit', label: 'Debit/Credit' },
        { key: 'Currency', label: 'Currency' },
        { key: 'ExchangeRate', label: 'Exchange Rate' },
        { key: 'Rate', label: 'Rate' },
        { key: 'Amount', label: 'Amount' },
        { key: 'LocalAmount', label: 'Local Amount' },
        { key: 'Customer', label: 'Customer' },
        { key: 'VoucherHeaderSid', label: 'Voucher Header Sid' },
        { key: 'DocumentType', label: 'Document Type' }
      ],
      fileName: 'Cost-Rates-Report',
      title: companyName
    });
  }

  reportRevenueRates(): void {
    const allCostRates = this.slicedRevenueFormArray;

    const formattedData = allCostRates.map(rate => ({
      ChargeCode: this.getChargeCode(rate.ChargeMasterSid),
      ChargeName: this.getChargeName(rate.ChargeMasterSid),
      ChargeDescription: rate.ChargeDescription || '',
      PrepaidCollect: rate.PrepaidCollect || '',
      UnitCode: this.getUnitCode(rate.ChargeUomSid),
      NumberOfUnit: rate.NumberOfUnit || 0,
      DebitCredit: rate.DrCr === 'D' ? 'Debit' : 'Credit',
      Currency: this.getCurrencyCode(rate.CurrencyMasterSid),
      ExchangeRate: rate.ExchangeRate || 0,
      Rate: rate.Rate || 0,
      Amount: rate.Amount || 0,
      LocalAmount: rate.LocalAmount || 0,
      Customer: this.getCustomerName(rate.CustomerMasterSid) || '',
      VoucherHeaderSid: rate.VoucherHeaderSid || '',
      DocumentType: this.getDocTypeName(rate.VoucherTypeSid)
    }));

    const companyName = this.currentCompany?.companyName ?? 'Company';

    this.excelExportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'ChargeCode', label: 'Charge Code' },
        { key: 'ChargeName', label: 'Charge Name' },
        { key: 'ChargeDescription', label: 'Charge Description' },
        { key: 'PrepaidCollect', label: 'Prepaid/Collect' },
        { key: 'UnitCode', label: 'Unit Code' },
        { key: 'NumberOfUnit', label: 'Number Of Unit' },
        { key: 'DebitCredit', label: 'Debit/Credit' },
        { key: 'Currency', label: 'Currency' },
        { key: 'ExchangeRate', label: 'Exchange Rate' },
        { key: 'Rate', label: 'Rate' },
        { key: 'Amount', label: 'Amount' },
        { key: 'LocalAmount', label: 'Local Amount' },
        { key: 'Customer', label: 'Customer' },
        { key: 'VoucherHeaderSid', label: 'Voucher Header Sid' },
        { key: 'DocumentType', label: 'Document Type' }
      ],
      fileName: 'Revenue-Rates-Report',
      title: companyName
    });
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
      ProfitPercent: `${this.calculateTotalProfitPercent().toFixed(2)}%`
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



}
