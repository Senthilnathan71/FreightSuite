import { Component, ViewChild, TemplateRef, Input, OnInit, Output, EventEmitter } from '@angular/core';
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
  styleUrls: ['./cost-entry.component.scss']
})
export class CostEntryComponent implements OnInit {

  selectedTab = 'Cost';
  costFormArray: FormArray;
  revenueFormArray: FormArray;
  chargeList: any[] = [];
  uomList: any[] = [];
  docTypeList: any[] = [];
  slicedCostFormArray: any[] = [];
  slicedRevenueFormArray: any[] = [];
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
      this.revenueDataLength
      this.slicedCostFormArray = [];
      this.slicedRevenueFormArray = [];
    }
  }
  get dataItems(): any[] {
    return this._dataItems;
  }

  @Output() dataEmitter = new EventEmitter<any[]>();

  @ViewChild('costModal') costModal!: TemplateRef<any>;
  @ViewChild('revenueModal') revenueModal!: TemplateRef<any>;
  @ViewChild('profitModal') profitModal!: TemplateRef<any>;

  rateForm!: FormGroup;
  currentRateIndex: number = -1;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private operationService: OperationService,
    private appSettingService: AppSettingsService
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

  initRateForm() {
    this.rateForm = this.fb.group({
      BookingRatesSid: [null],
      SerialNumber: [{ value: '', disabled: true }],
      ChargeMasterSid: [null],
      ChargeDescription: [''],
      PrepaidCollect: [null],
      ChargeUomSid: [null],
      NumberOfUnit: [''],
      DrCr: [null],
      CurrencyMasterSid: [null],
      ExchangeRate: [{ value: '', disabled: true }],
      Rate: [''],
      Amount: [{ value: '', disabled: true }],
      CostRevenue: [''],
      LocalAmount: [{ value: '', disabled: true }],
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
    this.costDataLength = items.length;
    this.revenueDataLength = items.length;
    this.costFormArray.updateValueAndValidity();
    this.revenueFormArray.updateValueAndValidity();
    this.updateCostPagination();
    this.updateRevenuePagination();
    this.calculateProfit();
  }

  createRateFormGroup(data?: any): FormGroup {
    return this.fb.group({
      BookingRatesSid: [data?.BookingRatesSid || null],
      SerialNumber: [data?.SerialNumber || ''],
      ChargeMasterSid: [data?.ChargeMasterSid || null],
      ChargeDescription: [data?.ChargeDescription || ''],
      PrepaidCollect: [data?.PrepaidCollect || null],
      ChargeUomSid: [data?.ChargeUomSid || null],
      NumberOfUnit: [data?.NumberOfUnit || ''],
      DrCr: [data?.DrCr || null],
      CurrencyMasterSid: [data?.CurrencyMasterSid || null],
      ExchangeRate: [Number(data?.ExchangeRate).toFixed(2) || ''],
      Rate: [data?.Rate || ''],
      Amount: [Number(data?.Amount).toFixed(2) || ''],
      CostRevenue: [data?.CostRevenue || ''],
      LocalAmount: [Number(data?.LocalAmount).toFixed(2) || ''],
      CustomerMasterSid: [data?.CustomerMasterSid || null],
      CustomerBranchSid: [data?.CustomerBranchSid || null],
      VoucherHeaderSid: [data?.VoucherHeaderSid || null],
      VoucherTypeSid: [data?.VoucherTypeSid || null],
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
        BookingRatesSid: data.BookingRatesSid,
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
    this.rateForm.get('ChargeDescription')?.setValue(charge.chargeTaxMaster[0]?.description);
    this.rateForm.get('ChargeUomSid')?.setValue(charge.UOM);
    this.rateForm.get('CurrencyMasterSid')?.setValue(charge.CurrencyMasterSid);
    this.calculateAmount();
    this.getExchangeRate();
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

  onCurrencyChange(currency) {
    if (!currency) {
      this.rateForm.get('ExchangeRate')?.setValue('');
      this.rateForm.get('LocalAmount')?.setValue('');
      return;
    }
    this.getExchangeRate();
  }

  adjustRevenuePageAfterDelete() {
    const totalPages = Math.ceil(this.revenueDataLength / this.pageSize1);
    if (this.page1 > totalPages && totalPages > 0) {
      this.page1 = totalPages;
    } else if (this.revenueDataLength === 0) {
      this.page1 = 1;
    }
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
      this.rateForm.get('ExchangeRate')?.setValue(1);
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
          this.rateForm.get('ExchangeRate')?.setValue(resp.data ? resp.data : '');
          this.calculateLocalAmount();
        } else {
          this.appSettingService.showWarning('Error fetching exchange rate');
        }
      }
    )
  }

  calculateLocalAmount() {
    const noOfUnit = this.rateForm.get('NumberOfUnit')?.value;
    const rate = this.rateForm.get('Rate')?.value;
    const exrate = this.rateForm.get('ExchangeRate')?.value;
    const ctrl = this.rateForm.get('LocalAmount');
    if (!noOfUnit || !rate || !exrate) {
      ctrl.setValue('');
      return;
    }
    const LocalAmount = (Number(noOfUnit) * Number(rate) * Number(exrate)).toFixed(3);
    ctrl.setValue(LocalAmount);
    ctrl.updateValueAndValidity();
  }

  calculateAmount() {
    const noOfUnit = this.rateForm.get('NumberOfUnit')?.value;
    const rate = this.rateForm.get('Rate')?.value;
    const ctrl = this.rateForm.get('Amount');
    if (!noOfUnit || !rate) {
      ctrl.setValue('');
      return;
    }
    const amount = (Number(noOfUnit) * Number(rate)).toFixed(3);
    ctrl.setValue(amount);
    ctrl.updateValueAndValidity();
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


  getChargeCode(ChargeMasterSid) {
    if (!ChargeMasterSid || this.chargeList.length === 0) {
      return '';
    }
    return (this.chargeList.find(charge => charge.ChargeMasterSid === ChargeMasterSid)?.chargeCode);
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

  onTariffDetails(){
      
  }

}