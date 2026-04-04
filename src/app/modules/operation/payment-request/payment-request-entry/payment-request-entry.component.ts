import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner';
import {
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgSelectComponent } from '@ng-select/ng-select';
import { forkJoin } from 'rxjs';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { OperationService } from '../../operation.service';

@Component({
  selector: 'app-payment-request-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    NgxSpinnerModule,
    NgbDatepickerModule,
    FeatherModule,
    NgSelectComponent,
    SearchableDropdown,
    DecimalPrecisionDirective
  ],
  templateUrl: './payment-request-entry.component.html',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class PaymentRequestEntryComponent implements OnInit {
  form!: FormGroup;
  currentCompany: any;
  currentBranch: any;
  userData: any;
  isEditMode = false;
  isViewMode = false;
  isReadOnly = false;
  loading = false;
  saving = false;

  currencyList: any[] = [];
  departmentList: any[] = [];
  supplierList: any[] = [];
  chargeList: any[] = [];
  uomList: any[] = [];

  CurrencyLookupConfig = DROPDOWN_CONFIGS.CURRENCY;
  CustomerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  ChargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;

  cashBankOptions = [
    { value: 'Bank', label: 'Bank' },
    { value: 'Cash', label: 'Cash' }
  ];
  requestStatusOptions = [
    { value: 'Pending', label: 'Waiting for Approval' },
    { value: 'WaitingForFinalApproval', label: 'Waiting for Final Approval' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' }
  ];
  statusOptions = [
    { value: 'A', label: 'Active' },
    { value: 'S', label: 'Suspend' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly operationService: OperationService,
    private readonly appSettingsService: AppSettingsService,
    private readonly currencyConfigService: CurrencyConfigurationService,
    private readonly currencyFormatService: CurrencyFormatService,
  ) {
    this.form = this.fb.group({
      PaymentRequestSid: [null],
      PaymentRequestNumber: [''],
      PaymentRequestDate: [this.getToday(), Validators.required],
      CashBank: ['Bank', Validators.required],
      DepartmentMasterSid: [null, Validators.required],
      Party: [null, Validators.required],
      PayableTo: ['', Validators.required],
      CurrencyMasterSid: [null, Validators.required],
      BookingSid: [null],
      BookingNo: [''],
      MasterJobSid: [null],
      MasterJobNo: [''],
      HouseJobSid: [null],
      HouseNo: [''],
      Remarks: [''],
      PaymentRequestStatus: ['Pending', Validators.required],
      Status: ['A', Validators.required],
      detailItems: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingsService.decrypt(localStorage.getItem('selected-branch'));
    this.userData = this.appSettingsService.getDecryptedUserProfile();

    this.loadLookups();

    const preview = window.history.state?.paymentRequestPreview;
    if (preview?.detailItems?.length) {
      this.applyPreview(preview);
    }

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.loadRequest(Number(params['id']));
      }
    });
  }

  get detailItems(): FormArray {
    return this.form.get('detailItems') as FormArray;
  }

  get r() {
    return this.form.controls;
  }

  get totalLocalAmount(): number {
    return this.detailItems.controls.reduce((sum, ctrl) => {
      if (!ctrl.get('Selected')?.value) {
        return sum;
      }
      return sum + Number(ctrl.get('CostLocalAmount')?.value || 0);
    }, 0);
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Payment Request' : 'Create Payment Request';
  }

  goBack() {
    this.router.navigate(['/operation/payment-request/list']);
  }

  resetForm() {
    if (this.isEditMode) {
      this.loadRequest(Number(this.form.get('PaymentRequestSid')?.value));
      return;
    }

    this.form.reset({
      PaymentRequestSid: null,
      PaymentRequestNumber: '',
      PaymentRequestDate: this.getToday(),
      CashBank: 'Bank',
      DepartmentMasterSid: null,
      Party: null,
      PayableTo: '',
      CurrencyMasterSid: null,
      BookingSid: null,
      BookingNo: '',
      MasterJobSid: null,
      MasterJobNo: '',
      HouseJobSid: null,
      HouseNo: '',
      Remarks: '',
      PaymentRequestStatus: 'Pending',
      Status: 'A',
    });
    this.detailItems.clear();

    const preview = window.history.state?.paymentRequestPreview;
    if (preview?.detailItems?.length) {
      this.applyPreview(preview);
    }
  }

  onPartyChange(value: any) {
    const selectedParty = value?.CustomerMasterSid
      ? value
      : this.supplierList.find((item: any) => item.CustomerMasterSid === value);
    this.form.patchValue({
      PayableTo: selectedParty?.CustomerName || ''
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.appSettingsService.showWarning('Please fill mandatory fields');
      return;
    }

    const selectedDetails = this.detailItems.getRawValue().filter((item: any) => item.Selected);
    if (!selectedDetails.length) {
      this.appSettingsService.showWarning('Please select at least one detail row');
      return;
    }

    this.saving = true;
    const payload = {
      ...this.form.getRawValue(),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      CreatedBy: this.userData?.userEmail,
      UpdatedBy: this.userData?.userEmail,
      detailItems: this.detailItems.getRawValue(),
    };

    const request$ = this.isEditMode
      ? this.operationService.updatePaymentRequest(this.form.get('PaymentRequestSid')?.value, payload)
      : this.operationService.createPaymentRequest(payload);

    request$.subscribe({
      next: (resp: any) => {
        this.saving = false;
        if (resp.status) {
          this.appSettingsService.showSuccess(resp.message);
          const id = resp.data?.PaymentRequestSid || resp.data?.PaymentRequestHeader?.PaymentRequestSid;
          if (id) {
            this.router.navigate(['/operation/payment-request/entry', id]);
          } else {
            this.goBack();
          }
        } else {
          this.appSettingsService.showError(resp.message);
        }
      },
      error: () => {
        this.saving = false;
        this.appSettingsService.showError('Failed to save payment request');
      },
    });
  }

  getCurrencyCode(currencyMasterSid: number): string {
    return this.currencyList.find((currency: any) => currency.CurrencyMasterSid === currencyMasterSid)?.currencyCode || '';
  }

  getChargeName(chargeMasterSid: number): string {
    const charge = this.chargeList.find((item: any) => item.ChargeMasterSid === chargeMasterSid);
    return charge?.chargeName || charge?.ChargeName || '';
  }

  getDepartmentName(departmentMasterSid: number): string {
    const department = this.departmentList.find(
      (item: any) => item.DepartmentMasterSid === departmentMasterSid
    );
    return department?.departmentName || department?.DepartmentName || '';
  }

  private loadLookups() {
    const filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };

    forkJoin({
      currencies: this.operationService.getAllCurrencies(),
      departments: this.operationService.getAllDepartments(this.currentCompany?.CompanyMasterSid),
      suppliers: this.operationService.getAllCreditorWithCOAMapped(filterOption),
      charges: this.operationService.getAllCharges(this.currentCompany?.CompanyMasterSid),
      uoms: this.operationService.getAllUom(),
    }).subscribe({
      next: ({ currencies, departments, suppliers, charges, uoms }: any) => {
        this.currencyList = currencies?.data || [];
        this.departmentList = departments?.data || [];
        this.supplierList = suppliers?.data || [];
        const chargeItems = Array.isArray(charges) ? charges : charges?.data || [];
        const uomItems = Array.isArray(uoms) ? uoms : uoms?.data || [];

        this.chargeList = chargeItems.map((item: any) => ({
          ...item,
          chargeCode: item?.chargeCode || item?.ChargeCode || '',
          chargeName: item?.chargeName || item?.ChargeName || '',
        }));
        this.uomList = uomItems.map((item: any) => ({
          ...item,
          UOMCode: item?.UOMCode || item?.uomCode || '',
          UOMName: item?.UOMName || item?.uomName || '',
        }));
        this.refreshDetailLookupBindings();
      },
    });
  }

  addDetailRow() {
    const currencyMasterSid =
      this.form.get('CurrencyMasterSid')?.value || this.currentCompany?.CurrencyMasterSid || null;
    this.detailItems.push(
      this.createDetailRow({
        Selected: true,
        CostCurrencyMasterSid: currencyMasterSid,
        CostCurrencyCode: this.getCurrencyCode(currencyMasterSid) || '',
        CostExchangeRate: this.getDefaultExchangeRate(currencyMasterSid),
        CostRate: 0,
        CostNumberOfUnit: 1,
        CostAmount: 0,
        CostLocalAmount: 0,
        CostDrCr: 'D',
        CostAgentMasterSid: this.form.get('Party')?.value || null,
        CostAgentName: this.form.get('PayableTo')?.value || '',
      }),
    );
    this.recalculateDetailRow(this.detailItems.length - 1);
  }

  removeDetailRow(index: number) {
    if (this.detailItems.length <= index) {
      return;
    }
    this.detailItems.removeAt(index);
  }

  private loadRequest(id: number) {
    this.loading = true;
    this.operationService.getPaymentRequestById(id).subscribe({
      next: (resp: any) => {
        this.loading = false;
        if (!resp.status) {
          this.appSettingsService.showError(resp.message);
          return;
        }

        const request = resp.data;
        this.form.patchValue({
          PaymentRequestSid: request.PaymentRequestSid,
          PaymentRequestNumber: request.PaymentRequestNumber,
          PaymentRequestDate: this.toInputDate(request.PaymentRequestDate),
          CashBank: request.CashBank || 'Bank',
          DepartmentMasterSid: request.DepartmentMasterSid,
          Party: request.Party,
          PayableTo: request.PayableTo,
          BookingSid: request.BookingSid,
          BookingNo: request.bookingHeader?.BookingNo || '',
          MasterJobSid: request.MasterJobSid,
          MasterJobNo: request.masterJob?.JobNo || request.masterJob?.MBLNo || '',
          HouseJobSid: request.HouseJobSid,
          HouseNo: request.houseJob?.HBLNo || request.houseJob?.HouseNo || '',
          Remarks: request.Remarks || '',
          PaymentRequestStatus: request.PaymentRequestStatus,
          Status: request.Status,
        });

        const firstCurrency = request.paymentRequestDetails?.[0]?.CostCurrencyMasterSid;
        if (firstCurrency) {
          this.form.get('CurrencyMasterSid')?.setValue(firstCurrency);
        }

        this.detailItems.clear();
        (request.paymentRequestDetails || []).forEach((item: any) => {
          this.detailItems.push(this.createDetailRow({
            ...item,
            SourceCostRevenueChargeSid:
              item?.SourceCostRevenueChargeSid ||
              item?.sourceCostRevenueCharge?.CostRevenueChargesSid ||
              null,
            Selected: true,
          }));
        });
      },
      error: () => {
        this.loading = false;
        this.appSettingsService.showError('Failed to load payment request');
      },
    });
  }

  private applyPreview(preview: any) {
    this.detailItems.clear();
    const detailRows = preview.detailItems || [];
    const selectedItems = detailRows.filter((item: any) => item.Selected !== false);
    const firstItem = selectedItems[0] || detailRows[0];

    this.form.patchValue({
      PaymentRequestDate: this.getToday(),
      CashBank: 'Bank',
      DepartmentMasterSid: preview.DepartmentMasterSid || firstItem?.DepartmentMasterSid || null,
      Party: preview.Party || firstItem?.CostAgentMasterSid || null,
      PayableTo: preview.PayableTo || firstItem?.CostAgentName || '',
      CurrencyMasterSid: preview.CurrencyMasterSid || firstItem?.CostCurrencyMasterSid || null,
      BookingSid: preview.BookingSid || null,
      BookingNo: preview.BookingNo || '',
      MasterJobSid: preview.MasterJobSid || null,
      MasterJobNo: preview.MasterJobNo || '',
      HouseJobSid: preview.HouseJobSid || null,
      HouseNo: preview.HouseNo || '',
      PaymentRequestStatus: 'Pending',
      Status: 'A',
    });

    detailRows.forEach((item: any) => {
      this.detailItems.push(
        this.createDetailRow({
          ...item,
          Selected: item.Selected !== false,
        }),
      );
    });
  }

  private createDetailRow(data: any) {
    return this.fb.group({
      Selected: [data?.Selected ?? true],
      ChargeMasterSid: [data?.ChargeMasterSid || null],
      ChargeDescription: [data?.ChargeDescription || ''],
      CostChargeUomSid: [data?.CostChargeUomSid || null],
      CostCurrencyMasterSid: [data?.CostCurrencyMasterSid || null],
      CostCurrencyCode: [data?.CostCurrencyCode || data?.currency?.currencyCode || ''],
      CostExchangeRate: [data?.CostExchangeRate || 1],
      CostRate: [data?.CostRate || 0],
      CostNumberOfUnit: [data?.CostNumberOfUnit || 0],
      CostAmount: [data?.CostAmount || 0],
      CostLocalAmount: [data?.CostLocalAmount || 0],
      CostDrCr: [data?.CostDrCr || 'D'],
      CostAgentMasterSid: [data?.CostAgentMasterSid || null],
      CostAgentBranchSid: [data?.CostAgentBranchSid || null],
      CostAgentName: [data?.CostAgentName || data?.agent?.CustomerName || ''],
      SourceCostRevenueChargeSid: [data?.SourceCostRevenueChargeSid || data?.CostRevenueChargeSid || null],
    });
  }

  onDetailChargeChange(index: number, value: any) {
    const row = this.detailItems.at(index) as FormGroup;
    const chargeMasterSid = value?.ChargeMasterSid || value || null;
    const selectedCharge = this.chargeList.find((item: any) => item.ChargeMasterSid === chargeMasterSid);

    row.patchValue(
      {
        ChargeMasterSid: chargeMasterSid,
        ChargeDescription: selectedCharge?.chargeName || selectedCharge?.ChargeName || '',
        CostChargeUomSid: selectedCharge?.UOM || selectedCharge?.ChargeUOMSid || null,
      },
      { emitEvent: false },
    );

    this.recalculateDetailRow(index);
  }

  onDetailCurrencyChange(index: number, value: any) {
    const row = this.detailItems.at(index) as FormGroup;
    const currencyMasterSid = value?.CurrencyMasterSid || value || null;
    const selectedCurrency = this.currencyList.find(
      (item: any) => item.CurrencyMasterSid === currencyMasterSid,
    );

    row.patchValue(
      {
        CostCurrencyMasterSid: currencyMasterSid,
        CostCurrencyCode: selectedCurrency?.currencyCode || '',
      },
      { emitEvent: false },
    );

    const companyCurrency = this.currencyList.find(
      (item: any) => item.CurrencyMasterSid === this.currentCompany?.CurrencyMasterSid,
    );

    if (!selectedCurrency?.currencyCode || !companyCurrency?.currencyCode) {
      this.recalculateDetailRow(index);
      return;
    }

    if (selectedCurrency.currencyCode === companyCurrency.currencyCode) {
      row.patchValue(
        {
          CostExchangeRate: this.getDefaultExchangeRate(currencyMasterSid),
        },
        { emitEvent: false },
      );
      this.recalculateDetailRow(index);
      return;
    }

    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      fromCurrencyCode: selectedCurrency.currencyCode,
      toCurrencyCode: companyCurrency.currencyCode,
      EffectiveFrom: new Date(this.form.get('PaymentRequestDate')?.value || new Date()),
      segment: 'cost',
    };

    this.operationService.getExchangeRate(payload).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp?.data !== undefined && resp?.data !== null) {
          row.patchValue(
            {
              CostExchangeRate: this.getFormattedExchangeRate(Number(resp.data), currencyMasterSid),
            },
            { emitEvent: false },
          );
        } else {
          row.patchValue(
            {
              CostExchangeRate: this.getFormattedExchangeRate(0, currencyMasterSid),
            },
            { emitEvent: false },
          );
        }
        this.recalculateDetailRow(index);
      },
      error: () => {
        row.patchValue(
          {
            CostExchangeRate: this.getFormattedExchangeRate(0, currencyMasterSid),
          },
          { emitEvent: false },
        );
        this.recalculateDetailRow(index);
      },
    });
  }

  onDetailPartyChange(index: number, value: any) {
    const row = this.detailItems.at(index) as FormGroup;
    const partyMasterSid = value?.CustomerMasterSid || value || null;
    const selectedParty = this.supplierList.find(
      (item: any) => item.CustomerMasterSid === partyMasterSid,
    );

    row.patchValue(
      {
        CostAgentMasterSid: partyMasterSid,
        CostAgentName: selectedParty?.CustomerName || '',
      },
      { emitEvent: false },
    );
  }

  recalculateDetailRow(index: number) {
    const row = this.detailItems.at(index) as FormGroup;
    if (!row) {
      return;
    }

    const currencyMasterSid = row.get('CostCurrencyMasterSid')?.value;
    const unit = Number(row.get('CostNumberOfUnit')?.value || 0);
    const rate = Number(row.get('CostRate')?.value || 0);
    const exchangeRate = Number(row.get('CostExchangeRate')?.value || 0);
    const amount = unit * rate;
    const localAmount = amount * exchangeRate;

    row.patchValue(
      {
        CostAmount: this.getFormattedAmount(amount, currencyMasterSid),
        CostLocalAmount: this.getFormattedAmount(localAmount, this.currentCompany?.CurrencyMasterSid),
      },
      { emitEvent: false },
    );
  }

  private refreshDetailLookupBindings() {
    this.detailItems.controls.forEach((control, index) => {
      const row = control as FormGroup;
      const currencyMasterSid = row.get('CostCurrencyMasterSid')?.value;
      const currencyCode =
        row.get('CostCurrencyCode')?.value || this.getCurrencyCode(currencyMasterSid) || '';
      const partyMasterSid = row.get('CostAgentMasterSid')?.value;
      const partyName =
        row.get('CostAgentName')?.value ||
        this.supplierList.find((item: any) => item.CustomerMasterSid === partyMasterSid)?.CustomerName ||
        '';

      row.patchValue(
        {
          ChargeMasterSid: row.get('ChargeMasterSid')?.value,
          CostChargeUomSid: row.get('CostChargeUomSid')?.value,
          CostCurrencyMasterSid: currencyMasterSid,
          CostCurrencyCode: currencyCode,
          CostAgentMasterSid: partyMasterSid,
          CostAgentName: partyName,
        },
        { emitEvent: false },
      );
      this.recalculateDetailRow(index);
    });
  }

  private getDefaultExchangeRate(currencyMasterSid: number): number {
    const selectedCurrency = this.currencyList.find(
      (item: any) => item.CurrencyMasterSid === currencyMasterSid,
    );
    const companyCurrency = this.currencyList.find(
      (item: any) => item.CurrencyMasterSid === this.currentCompany?.CurrencyMasterSid,
    );

    if (selectedCurrency?.currencyCode && companyCurrency?.currencyCode) {
      if (selectedCurrency.currencyCode === companyCurrency.currencyCode) {
        return this.getFormattedExchangeRate(1, currencyMasterSid);
      }
    }

    return this.getFormattedExchangeRate(0, currencyMasterSid);
  }

  getAmountDecimalPlaces(currencyMasterSid: number): number {
    const currency = this.currencyList.find((item: any) => item.CurrencyMasterSid === currencyMasterSid);
    if (currency?.currencyCode) {
      return this.currencyConfigService.getCurrencyConfig(currency.currencyCode)?.amountDecimal ?? 2;
    }
    return 2;
  }

  getExchangeRateDecimalPlaces(currencyMasterSid: number): number {
    const currency = this.currencyList.find((item: any) => item.CurrencyMasterSid === currencyMasterSid);
    if (currency?.currencyCode) {
      return this.currencyConfigService.getCurrencyConfig(currency.currencyCode)?.exchangeDecimal ?? 3;
    }
    return 3;
  }

  private getFormattedAmount(value: number, currencyMasterSid: number): string {
    const currency = this.currencyList.find((item: any) => item.CurrencyMasterSid === currencyMasterSid);
    return this.currencyFormatService.formatAmount(
      { value: Number(value || 0), currencyCode: currency?.currencyCode },
      false,
    );
  }

  private getFormattedExchangeRate(value: number, currencyMasterSid: number): number {
    const currency = this.currencyList.find((item: any) => item.CurrencyMasterSid === currencyMasterSid);
    return this.currencyFormatService.formatExchangeRate({
      value: Number(value || 0),
      currencyCode: currency?.currencyCode,
    });
  }

  private getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  private toInputDate(value: string | Date) {
    if (!value) {
      return this.getToday();
    }
    return new Date(value).toISOString().slice(0, 10);
  }
}
