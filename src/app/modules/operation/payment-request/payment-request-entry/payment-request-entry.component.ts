import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgxSpinnerModule } from 'ngx-spinner';
import {
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbDateStruct,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subject, firstValueFrom, forkJoin } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { getDefaultTodayDate, toNgbDateStruct } from 'src/app/common/helper';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { errorLoggerWithToastr } from 'src/app/common/error-handling/form-error-handler';
import { VOUCHER_FIELD_LIMITS, buildVoucherValidationConfig } from 'src/app/common/voucher-field-limits';
import { getVoucherEntryLink, navigateToVoucherEntry, VoucherType } from 'src/app/common/voucher-route';
import { ToastrService } from 'ngx-toastr';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { PdfMakeService } from 'src/app/common/pdf';
import { OperationService } from '../../operation.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { AuditLogComponent } from '../../audit-log/audit-log.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

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
    DecimalPrecisionDirective,
    PrintHeaderComponent,
    PrintFooterComponent,
    CustomDatePipe,
    ElementStateGuardDirective,
    FormStateGuardDirective
  ],
  templateUrl: './payment-request-entry.component.html',
  styleUrl: './payment-request-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class PaymentRequestEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  // Character limits for text fields (single source of truth, mirrors DB widths).
  protected readonly LIMITS = VOUCHER_FIELD_LIMITS;
  // Shared voucher-route hub helpers for the Payment voucher hyperlink.
  protected readonly getVoucherEntryLink = getVoucherEntryLink;
  protected readonly VoucherType = VoucherType;
  // Field labels for the shared toastr validator (errorLoggerWithToastr).
  private readonly prValidationConfig = buildVoucherValidationConfig({
    PaymentRequestDate: 'Payment Request Date',
    CashBank: 'Cash / Bank',
    DepartmentMasterSid: 'Department',
    PayableTo: 'Payable To',
    CurrencyMasterSid: 'Currency',
    Remarks: 'Remarks',
    ChargeDescription: 'Charge Description',
  });
  @ViewChild('paymentRequestPrintModal') paymentRequestPrintModal!: TemplateRef<any>;

  form!: FormGroup;
  currentCompany: any;
  currentBranch: any;
  userData: any;
  isEditMode = false;
  isViewMode = false;
  isReadOnly = false;
  paymentVoucherNumber: string = '';
  loading = false;
  saving = false;
  lookupsLoaded = false;
  isDirty = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();
  private dirtyTrackingSubscribed = false;

  fyMinDate: NgbDateStruct | null = null;
  fyMaxDate: NgbDateStruct | null = null;

  currencyList: any[] = [];
  departmentList: any[] = [];
  supplierList: any[] = [];
  chargeList: any[] = [];
  uomList: any[] = [];
  paymentRequestPrintData: any = null;
  paymentRequestData: any = null;

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

  // Authorization (menu-only, mirrors the Credit Request flow).
  authorizerDetails: any = this.getDefaultAuthorizerDetails();
  authorizationRequired = false;
  authorizationChecked = false;
  authorizationMessage = '';
  private statusOptionsCache: { key: string; options: any[] } | null = null;
  private readonly finalStatusValues = ['Approved', 'Rejected'];
  private readonly nonFinalStatusValues = ['WaitingForFinalApproval', 'Rejected'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly operationService: OperationService,
    private readonly appSettingsService: AppSettingsService,
    private readonly currencyConfigService: CurrencyConfigurationService,
    private readonly currencyFormatService: CurrencyFormatService,
    private readonly numberToWords: NumberToWordsService,
    private readonly modalService: NgbModal,
    private readonly pdfMakeService: PdfMakeService,
    private readonly companySettings: CompanySettingsManagerService,
    public readonly mps: MenuPermissionService,
    private readonly toastr: ToastrService,
    private readonly leadService: LeadService,
  ) {
    this.form = this.fb.group({
      PaymentRequestSid: [null],
      PaymentRequestNumber: [''],
      PaymentRequestDate: [this.getToday(), Validators.required],
      CashBank: ['Bank', Validators.required],
      DepartmentMasterSid: [{ value: null, disabled: true }, Validators.required],
      Party: [{ value: null, disabled: true }],
      PayableTo: ['', [Validators.required, Validators.maxLength(VOUCHER_FIELD_LIMITS.paymentRequest.PayableTo)]],
      CurrencyMasterSid: [{ value: null, disabled: true }, Validators.required],
      BookingSid: [null],
      BookingNo: [{ value: '', disabled: true }],
      MasterJobSid: [null],
      MasterJobNo: [{ value: '', disabled: true }],
      HouseJobSid: [null],
      HouseNo: [{ value: '', disabled: true }],
      Remarks: ['', [Validators.maxLength(VOUCHER_FIELD_LIMITS.paymentRequest.Remarks)]],
      PaymentRequestStatus: ['Pending', Validators.required],
      Status: ['A', Validators.required],
      VoucherSid: [{ value: null, disabled: true }],
      detailItems: this.fb.array([]),
    });
  }

  copyDocumentNumber(controlName: string, label: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const documentNo = this.form?.get(controlName)?.value;
    if (!documentNo) {
      return;
    }
    navigator.clipboard.writeText(String(documentNo)).then(() => {
      this.appSettingsService.showSuccess(`${label} copied to clipboard.`);
    });
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingsService.decrypt(localStorage.getItem('selected-branch'));
    this.userData = this.appSettingsService.getDecryptedUserProfile();

    const fy = this.appSettingsService.getCurrentFinancialYear();
    if (fy) {
      this.fyMinDate = toNgbDateStruct(fy.StartDate);
      const fyEnd = new Date(fy.EndDate);
      const today = getDefaultTodayDate();
      this.fyMaxDate = toNgbDateStruct(fyEnd > today ? today : fyEnd);
    }

    this.loadLookups();

    const preview = window.history.state?.paymentRequestPreview;
    if (preview?.detailItems?.length) {
      this.applyPreview(preview);
      window.history.replaceState({}, document.title, window.location.href);
    }

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.loadRequest(Number(params['id']));
      } else {
        this.isEditMode = false;
        this.scheduleDirtyTrackingSnapshot();
        this.subscribeToFormChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      window.history.replaceState({}, document.title, window.location.href);
    }
    this.scheduleDirtyTrackingSnapshot();
  }

  private isApprovedStatus(status: any): boolean {
    return String(status ?? '').trim() === 'Approved';
  }

  private applyApprovalReadOnlyState(status: any) {
    const isApproved = this.isApprovedStatus(status);
    this.isReadOnly = isApproved;

    if (isApproved) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
      this.form.get('DepartmentMasterSid')?.disable({ emitEvent: false });
      this.form.get('Party')?.disable({ emitEvent: false });
      this.form.get('CurrencyMasterSid')?.disable({ emitEvent: false });
      this.form.get('BookingNo')?.disable({ emitEvent: false });
      this.form.get('MasterJobNo')?.disable({ emitEvent: false });
      this.form.get('HouseNo')?.disable({ emitEvent: false });
      this.applyDetailRowsEditState();
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
    this.saveWithCallback();
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
        const rawCurrencies: any[] = Array.isArray(currencies)
        ? currencies
        : currencies?.data || [];
      this.currencyList = rawCurrencies.map((c: any) => ({
        ...c,
        countryName: c?.countryMaster?.countryName || ''
      }));
        this.numberToWords.initializeCurrencies(this.currencyList);
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
        this.lookupsLoaded = true;
      },
    });
  }

  private getSelectedDetailRows(): any[] {
    return (this.detailItems.getRawValue() || []).filter((item: any) => item?.Selected !== false);
  }

  private getCashBankLabel(value: string): string {
    return this.cashBankOptions.find((item) => item.value === value)?.label || value || '';
  }

  private getRequestStatusLabel(value: string): string {
    return this.requestStatusOptions.find((item) => item.value === value)?.label || value || '';
  }

  getPartyName(partyMasterSid: number): string {
    const party = this.supplierList.find((item: any) => item.CustomerMasterSid === partyMasterSid);
    return party?.CustomerName || '';
  }

  getUnitName(uomMasterSid: number): string {
    const unit = this.uomList.find((item: any) => item.UOMMasterSid === uomMasterSid);
    return unit?.UOMCode || unit?.UOMName || '';
  }

  private getDetailCurrencyCode(row: any): string {
    return row?.CostCurrencyCode || this.getCurrencyCode(row?.CostCurrencyMasterSid) || '';
  }

  getPrintTotalAmount(): number {
    return this.getSelectedDetailRows().reduce((sum: number, item: any) => {
      return sum + Number(item?.CostAmount || 0);
    }, 0);
  }

  getPrintTotalLocalAmount(): number {
    return this.getSelectedDetailRows().reduce((sum: number, item: any) => {
      return sum + Number(item?.CostLocalAmount || 0);
    }, 0);
  }

  getPrintAmountInWords(): string {
    const total = this.getPrintTotalLocalAmount();
    if (!total) {
      return '';
    }

    const currencySid = Number(this.form.get('CurrencyMasterSid')?.value) || null;
    return this.numberToWords.convert(total, currencySid);
  }

  preparePrintData(): void {
    const raw = this.form.getRawValue();
    const detailItems = this.getSelectedDetailRows().map((item: any) => ({
      ...item,
      ChargeName: this.getChargeName(item?.ChargeMasterSid),
      UnitName: this.getUnitName(item?.CostChargeUomSid),
      CurrencyCode: this.getDetailCurrencyCode(item),
      PartyName: this.getPartyName(item?.CostAgentMasterSid),
    }));

    this.paymentRequestPrintData = {
      ...raw,
      PaymentRequestStatusLabel: this.getRequestStatusLabel(raw?.PaymentRequestStatus),
      CashBankLabel: this.getCashBankLabel(raw?.CashBank),
      DepartmentName: this.getDepartmentName(raw?.DepartmentMasterSid),
      PartyName: this.getPartyName(raw?.Party),
      CurrencyCode: this.getCurrencyCode(raw?.CurrencyMasterSid),
      detailItems,
      totalAmount: this.getPrintTotalAmount(),
      totalLocalAmount: this.getPrintTotalLocalAmount(),
      amountInWords: this.getPrintAmountInWords(),
    };
  }

  openPrintModal(): void {
    if (!this.lookupsLoaded) {
      this.appSettingsService.showWarning('Please wait until the lookups finish loading');
      return;
    }

    if (!this.isEditMode && !this.form.get('PaymentRequestSid')?.value) {
      this.appSettingsService.showWarning('Save the payment request before printing');
      return;
    }

    this.preparePrintData();
    this.modalService.open(this.paymentRequestPrintModal, {
      size: 'xl',
      centered: true,
      scrollable: true,
      backdrop: 'static',
    });
  }

  printDiv(divId: string): void {
    setTimeout(() => {
      const printContents = document.getElementById(divId)?.innerHTML;
      if (!printContents) {
        return;
      }

      const popupWin = window.open('', '_blank', 'width=900,height=600');
      if (!popupWin) {
        return;
      }

      popupWin.document.open();
      popupWin.document.write(`
        <html>
          <head>
            <title>Print</title>
            ${Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
              .map((node) => node.outerHTML)
              .join('')}
          </head>
          <body onload="window.print(); window.close();">
            ${printContents}
          </body>
        </html>
      `);
      popupWin.document.close();
    }, 50);
  }

  downloadPDF(): void {
    try {
      if (!this.lookupsLoaded) {
        this.appSettingsService.showWarning('Please wait until the lookups finish loading');
        return;
      }

      if (!this.isEditMode && !this.form.get('PaymentRequestSid')?.value) {
        this.appSettingsService.showWarning('Save the payment request before downloading');
        return;
      }

      this.preparePrintData();
      const logo = this.pdfMakeService.getReportLogo();
      const pdfCompany = this.appSettingsService.getCurrentCompanyInfo() || this.currentCompany;
      const pdfBranch = this.appSettingsService.getCurrentBranchInfo() || this.currentBranch;

      this.pdfMakeService.generatePaymentRequestFromApi(
        this.paymentRequestPrintData,
        pdfCompany,
        pdfBranch,
        this.userData,
        logo,
        { printSettings: this.companySettings.getPrintSettings() }
      );

      this.appSettingsService.showSuccess('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating payment request PDF:', error);
      this.appSettingsService.showError('Error generating PDF. Please try again.');
    }
  }

  addDetailRow() {
    if (this.isReadOnly) {
      return;
    }

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
        CostAgentMasterSid: null,
        CostAgentName: '',
      }),
    );
    this.recalculateDetailRow(this.detailItems.length - 1);
  }

  removeDetailRow(index: number) {
    if (this.isReadOnly) {
      return;
    }

    if (this.detailItems.length <= index) {
      return;
    }
    this.detailItems.removeAt(index);
  }

  private loadRequest(id: number) {
    this.loading = true;
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const payload = {
      PaymentRequestSid: id,
      CompanyMasterSid,
      BranchMasterSid
    }
    this.operationService.getPaymentRequestById(payload).subscribe({
      next: (resp: any) => {
        this.loading = false;
        if (!resp.status) {
          this.appSettingsService.showError('Access denied.');
          return;
        }

        const request = resp.data;
        this.paymentRequestData = request;
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
          VoucherSid: request.VoucherSid ?? null,
        });
        this.paymentVoucherNumber = request.VoucherNumber || '';

        const firstCurrency = request.paymentRequestDetails?.[0]?.CostCurrencyMasterSid;
        if (firstCurrency) {
          this.form.get('CurrencyMasterSid')?.setValue(firstCurrency);
        }

        this.detailItems.clear();
        (request.paymentRequestDetails || []).forEach((item: any) => {
          this.detailItems.push(this.createDetailRow({
            ...item,
            PaymentRequestDtlSid: item?.PaymentRequestDtlSid || null,
            SourceCostRevenueChargeSid:
              item?.SourceCostRevenueChargeSid ||
              item?.sourceCostRevenueCharge?.CostRevenueChargesSid ||
              item?.sourceCostRevenueCharge?.BookingRatesSid ||
              null,
            Selected: true,
          }));
        });

        this.applyApprovalReadOnlyState(request.PaymentRequestStatus);
        this.scheduleDirtyTrackingSnapshot();
        this.subscribeToFormChanges();
        this.refreshAuthorization();
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
      Party: preview.Party || null,
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
          PaymentRequestDtlSid: item?.PaymentRequestDtlSid || null,
          Selected: item.Selected !== false,
        }),
      );
    });

    this.applyApprovalReadOnlyState('Pending');
    this.scheduleDirtyTrackingSnapshot();
    this.subscribeToFormChanges();
  }

  private createDetailRow(data: any) {
    const row = this.fb.group({
      PaymentRequestDtlSid: [data?.PaymentRequestDtlSid || null],
      Selected: [data?.Selected ?? true],
      ChargeMasterSid: [data?.ChargeMasterSid || null],
      ChargeDescription: [
        data?.ChargeDescription ||
        data?.Charge?.chargeName ||
        data?.Charge?.ChargeName ||
        '',
        [Validators.maxLength(VOUCHER_FIELD_LIMITS.paymentRequest.ChargeDescription)],
      ],
      CostChargeUomSid: [data?.CostChargeUomSid || null],
      CostCurrencyMasterSid: [data?.CostCurrencyMasterSid || null],
      CostCurrencyCode: [data?.CostCurrencyCode || data?.currency?.currencyCode || ''],
      CostExchangeRate: [this.toNonNegativeNumber(data?.CostExchangeRate ?? 1)],
      CostRate: [this.toNonNegativeNumber(data?.CostRate), Validators.min(0)],
      CostNumberOfUnit: [this.toNonNegativeNumber(data?.CostNumberOfUnit), Validators.min(0)],
      CostAmount: [this.toNonNegativeNumber(data?.CostAmount), Validators.min(0)],
      CostLocalAmount: [this.toNonNegativeNumber(data?.CostLocalAmount)],
      CostDrCr: [data?.CostDrCr || 'D'],
      CostAgentMasterSid: [data?.CostAgentMasterSid || null],
      CostAgentBranchSid: [data?.CostAgentBranchSid || null],
      CostAgentName: [
        data?.CostAgentName ||
        data?.agent?.CustomerName ||
        '',
      ],
      SourceCostRevenueChargeSid: [
        data?.SourceCostRevenueChargeSid ||
        data?.sourceCostRevenueCharge?.CostRevenueChargesSid ||
        data?.sourceCostRevenueCharge?.BookingRatesSid ||
        data?.CostRevenueChargeSid ||
        null,
      ],
      COAMasterSid:          [data?.COAMasterSid ?? null],
      LedgerMasterSid:       [data?.LedgerMasterSid ?? null],
      BookingRatesSid:       [data?.BookingRatesSid ?? null],
      CostRevenueChargesSid: [data?.CostRevenueChargesSid ?? null],
    });

    this.applyDetailRowEditState(row);
    return row;
  }

  private applyDetailRowsEditState(): void {
    this.detailItems.controls.forEach((control) => {
      this.applyDetailRowEditState(control as FormGroup);
    });
  }

  private applyDetailRowEditState(row: FormGroup): void {
    const readonlyControls = [
      'ChargeMasterSid',
      'CostChargeUomSid',
      'CostCurrencyMasterSid',
      'CostExchangeRate',
      'CostNumberOfUnit',
      'CostAmount',
      'CostLocalAmount',
      'CostAgentName',
    ];
    const editableAmountControls = ['CostRate'];

    readonlyControls.forEach((controlName) => {
      row.get(controlName)?.disable({ emitEvent: false });
    });

    editableAmountControls.forEach((controlName) => {
      const control = row.get(controlName);
      if (this.isReadOnly) {
        control?.disable({ emitEvent: false });
      } else {
        control?.enable({ emitEvent: false });
      }
    });
  }

  private toNonNegativeNumber(value: any): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  private getNonNegativeControlValue(row: FormGroup, controlName: string): number {
    const control = row.get(controlName);
    const originalValue = control?.value;
    const sanitizedValue = this.toNonNegativeNumber(originalValue);

    if (Number(originalValue ?? 0) !== sanitizedValue) {
      control?.patchValue(sanitizedValue, { emitEvent: false });
    }

    return sanitizedValue;
  }

  private sanitizeAllDetailAmounts(): void {
    this.detailItems.controls.forEach((control) => {
      const row = control as FormGroup;
      this.getNonNegativeControlValue(row, 'CostNumberOfUnit');
      this.getNonNegativeControlValue(row, 'CostRate');
      this.getNonNegativeControlValue(row, 'CostAmount');
      this.getNonNegativeControlValue(row, 'CostExchangeRate');
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

  recalculateDetailRow(index: number) {
    const row = this.detailItems.at(index) as FormGroup;
    if (!row) {
      return;
    }

    const currencyMasterSid = row.get('CostCurrencyMasterSid')?.value;
    const unit = this.getNonNegativeControlValue(row, 'CostNumberOfUnit');
    const rate = this.getNonNegativeControlValue(row, 'CostRate');
    const exchangeRate = this.getNonNegativeControlValue(row, 'CostExchangeRate');
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

  onCostAmountChange(index: number) {
    const row = this.detailItems.at(index) as FormGroup;
    if (!row) {
      return;
    }

    const currencyMasterSid = row.get('CostCurrencyMasterSid')?.value;
    const unit = this.getNonNegativeControlValue(row, 'CostNumberOfUnit');
    const exchangeRate = this.getNonNegativeControlValue(row, 'CostExchangeRate');
    const amount = this.getNonNegativeControlValue(row, 'CostAmount');
    const rate = unit > 0 ? amount / unit : 0;
    const localAmount = amount * exchangeRate;

    row.patchValue(
      {
        CostRate: this.getFormattedAmount(rate, currencyMasterSid),
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

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.saveWithCallback(resolve);
    });
  }

  private async saveWithCallback(resolve?: (value: boolean) => void): Promise<void> {
    if (this.isReadOnly) {
      this.appSettingsService.showWarning('Approved payment request cannot be modified');
      if (resolve) resolve(false);
      return;
    }

    this.sanitizeAllDetailAmounts();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      errorLoggerWithToastr(this.form, this.toastr, this.prValidationConfig);
      if (resolve) resolve(false);
      return;
    }

    const selectedDetails = this.detailItems.getRawValue().filter((item: any) => item.Selected);
    if (!selectedDetails.length) {
      this.appSettingsService.showWarning('Please select at least one detail row');
      if (resolve) resolve(false);
      return;
    }

    const raw = this.form.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingsService.showWarning('No changes to save');
      this.form.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    // Fetch COA/Ledger for selected rows that are missing them
    for (const row of this.detailItems.controls) {
      if (!row.get('Selected')?.value) continue;
      if (row.get('COAMasterSid')?.value && row.get('LedgerMasterSid')?.value) continue;
      const chargeSid = row.get('ChargeMasterSid')?.value;
      if (!chargeSid) continue;
      try {
        const ledgerResp = await firstValueFrom(
          this.operationService.getLedgerDetails({
            DepartmentMasterSid: this.form.get('DepartmentMasterSid')?.value,
            CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
            SubledgerMappingSid: chargeSid,
            LedgerType: 'Charge',
            DrCr: 'Dr',
          })
        );
        if (ledgerResp?.status && ledgerResp.data) {
          row.patchValue({
            COAMasterSid:    ledgerResp.data.COAMasterSid ?? null,
            LedgerMasterSid: ledgerResp.data.SubledgerMasterSid ?? null,
          });
        } else {
          const chargeDesc = row.get('ChargeDescription')?.value || `Charge ${chargeSid}`;
          this.appSettingsService.showError(`Subledger not mapped for charge "${chargeDesc}". Please configure subledger mapping.`);
          if (resolve) resolve(false);
          return;
        }
      } catch {
        const chargeDesc = row.get('ChargeDescription')?.value || `Charge ${chargeSid}`;
        this.appSettingsService.showError(`Failed to fetch ledger for charge "${chargeDesc}". Please try again.`);
        if (resolve) resolve(false);
        return;
      }
    }

    this.saving = true;
    const userEmail = this.userData?.userEmail;
    // Only flag an authorization action when an authorizer actually changed the status.
    const statusChanged =
      this.isEditMode &&
      String(raw.PaymentRequestStatus) !== String(this.paymentRequestData?.PaymentRequestStatus ?? '');
    const payload = {
      ...raw,
      ...(this.isEditMode ? { UpdatedBy: userEmail } : { CreatedBy: userEmail }),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      detailItems: this.detailItems.getRawValue(),
      authDetails: {
        AuthorizationRequired: this.authorizationRequired,
        canAuthorize: statusChanged && !!this.authorizerDetails?.canAuthorize,
        AuthorityDetailSid: this.authorizerDetails?.AuthorityDetailSid || null,
        ApprovedBy: this.authorizerDetails?.ApprovedBy || this.userData?.userName || userEmail,
        Remarks: `PaymentRequest:${raw.PaymentRequestSid} Status:${raw.PaymentRequestStatus}`,
      },
    };

    const request$ = this.isEditMode
      ? this.operationService.updatePaymentRequest(this.form.get('PaymentRequestSid')?.value, payload)
      : this.operationService.createPaymentRequest(payload);

    request$.subscribe({
      next: (resp: any) => {
        this.saving = false;
        if (resp.status) {
          this.isDirty = false;
          this.appSettingsService.showSuccess(resp.message);
          if (raw.Status === 'S' && this.isEditMode) {
            const prSid = resp.data?.PaymentRequestSid || resp.data?.PaymentRequestHeader?.PaymentRequestSid || this.form.get('PaymentRequestSid')?.value;
            const chargeIds = this.detailItems.getRawValue()
              .map((d: any) => d.SourceCostRevenueChargeSid)
              .filter(Boolean);
            if (prSid && chargeIds.length) {
              this.operationService.suspendPaymentRequestCharges({
                PaymentRequestSid: prSid,
                chargeIds,
              }).subscribe();
            }
          }
          const id = resp.data?.PaymentRequestSid || resp.data?.PaymentRequestHeader?.PaymentRequestSid;
          if (id) {
            if (this.isEditMode) {
              this.loadRequest(id);
            } else {
              this.form.patchValue({ PaymentRequestSid: id }, { emitEvent: false });
              navigateToVoucherEntry(this.router, VoucherType.PAYMENT_REQUEST, id);
            }
          } else {
            this.scheduleDirtyTrackingSnapshot();
            this.goBack();
          }
          if (resolve) resolve(true);
        } else {
          this.appSettingsService.showError(resp.message);
          if (resolve) resolve(false);
        }
      },
      error: () => {
        this.saving = false;
        this.appSettingsService.showError('Failed to save payment request');
        if (resolve) resolve(false);
      },
    });
  }

  private subscribeToFormChanges(): void {
    if (this.dirtyTrackingSubscribed) {
      return;
    }
    this.dirtyTrackingSubscribed = true;
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        if (this.initialFormValue === null) {
          return;
        }
        this.isDirty = !this.deepEqual(this.initialFormValue, this.form.getRawValue());
      });
  }

  private scheduleDirtyTrackingSnapshot(): void {
    setTimeout(() => {
      this.initialFormValue = this.form.getRawValue();
      this.isDirty = false;
    }, 0);
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) {
      return Number(value);
    }

    if (typeof value === 'number') {
      return Number(value.toFixed(6));
    }

    if (Array.isArray(value)) {
      return value.map(v => this.normalizeValue(v));
    }

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

  private deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
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


  // ---------------------------------------------------------------------------
  // Authorization (menu-only) — mirrors the Credit Request approval flow.
  // ---------------------------------------------------------------------------
  private getDefaultAuthorizerDetails(): any {
    return {
      isAuthorizer: false,
      isAlreadyApproved: false,
      canAuthorize: false,
      AuthorityLevel: null,
      AuthorityDetailSid: null,
      ApprovedBy: this.userData?.userName || this.userData?.userEmail || '',
      totalNumberOfAuthorizers: 0,
      FinalAuthority: false,
    };
  }

  private setAuthorizationDefault(): void {
    this.authorizerDetails = this.getDefaultAuthorizerDetails();
    this.authorizationRequired = false;
    this.authorizationChecked = true;
    this.authorizationMessage = '';
    this.statusOptionsCache = null;
    this.applyStatusControlState();
  }

  private refreshAuthorization(): void {
    const menuMasterSid = Number(this.mps.getMenuId());
    const documentSid = Number(this.form.get('PaymentRequestSid')?.value) || null;

    if (
      !this.userData?.UserMasterSid ||
      !menuMasterSid ||
      !this.currentCompany?.CompanyMasterSid ||
      !this.currentBranch?.BranchMasterSid ||
      !documentSid
    ) {
      this.setAuthorizationDefault();
      return;
    }

    // Menu-only scope: department is intentionally NOT sent.
    const payload = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: menuMasterSid,
      UserMasterSid: this.userData.UserMasterSid,
      DocumentSid: documentSid,
    };

    this.leadService.isUserAuthorizer(payload).subscribe({
      next: (resp: any) => {
        const data = resp?.data || {};
        const total = Number(data?.totalNumberOfAuthorizers || 0);
        const details = {
          isAuthorizer: !!data?.canAuthorize,
          isAlreadyApproved: !!data?.alreadyApproved,
          canAuthorize: !!data?.canAuthorize && (!data?.alreadyApproved || this.hasPendingApproval()),
          AuthorityLevel: data?.AuthorityLevel,
          AuthorityDetailSid: data?.AuthorityDetailSid,
          ApprovedBy: this.userData?.userName || this.userData?.userEmail || '',
          totalNumberOfAuthorizers: total,
          FinalAuthority: data?.FinalAuthority === 'Y' || data?.FinalAuthority === true || data?.isFinalAuthorizer === true,
        };
        const hasSetup = total > 0 || !!data?.canAuthorize || !!data?.AuthorityDetailSid || !!data?.AuthorityLevel;

        this.authorizerDetails = details;
        this.authorizationRequired = hasSetup;
        this.authorizationChecked = true;
        this.authorizationMessage = hasSetup && !details.canAuthorize && !this.isPersistedApproved()
          ? 'You are not authorized to approve this payment request.'
          : '';
        this.statusOptionsCache = null;
        this.applyStatusControlState();
      },
      error: () => this.setAuthorizationDefault(),
    });
  }

  private hasPendingApproval(): boolean {
    const status = this.form.get('PaymentRequestStatus')?.value || 'Pending';
    return !['Approved', 'Rejected'].includes(String(status));
  }

  private isPersistedApproved(): boolean {
    return this.isApprovedStatus(this.paymentRequestData?.PaymentRequestStatus);
  }

  isFinalAuthorizer(): boolean {
    const d = this.authorizerDetails;
    const level = Number(d?.AuthorityLevel || 0);
    const total = Number(d?.totalNumberOfAuthorizers || 0);
    return !!d?.FinalAuthority || (level > 0 && total > 0 && level === total);
  }

  getRequestStatusOptions(): any[] {
    const required = this.authorizationRequired;
    const isFinal = this.isFinalAuthorizer();
    const currentValue = this.form.get('PaymentRequestStatus')?.value || '';

    // Bound directly in the template — memoize so ng-select gets a stable array reference and
    // doesn't drop the user's selection on every change-detection cycle.
    const cacheKey = `${required}|${isFinal}|${currentValue}`;
    if (this.statusOptionsCache && this.statusOptionsCache.key === cacheKey) {
      return this.statusOptionsCache.options;
    }

    const base = !required
      ? this.requestStatusOptions
      : this.requestStatusOptions.filter((o) =>
          (isFinal ? this.finalStatusValues : this.nonFinalStatusValues).includes(o.value),
        );

    const options = this.withCurrentStatusOption(base, currentValue);
    this.statusOptionsCache = { key: cacheKey, options };
    return options;
  }

  private withCurrentStatusOption(options: any[], currentValue: string): any[] {
    if (!currentValue || options.some((o) => o.value === currentValue)) {
      return options;
    }
    const match = this.requestStatusOptions.find((o) => o.value === currentValue);
    return match ? [...options, match] : options;
  }

  canEditStatus(): boolean {
    if (!this.isEditMode || this.isReadOnly) return false;
    if (this.isPersistedApproved()) return false;
    if (!this.form.get('PaymentRequestSid')?.value) return false;
    return !!this.authorizerDetails?.canAuthorize || !this.authorizationRequired;
  }

  private applyStatusControlState(): void {
    const ctrl = this.form.get('PaymentRequestStatus');
    if (!ctrl) return;
    if (this.canEditStatus()) {
      ctrl.enable({ emitEvent: false });
    } else {
      ctrl.disable({ emitEvent: false });
    }
  }

  onStatusChange(status: any): void {
    if (!this.canEditStatus()) {
      this.appSettingsService.showWarning(this.authorizationMessage || 'You are not authorized to approve this payment request.');
      this.revertStatus();
      return;
    }

    const selected = typeof status === 'string' ? status : status?.value;
    if (selected === 'Approved' && this.authorizationRequired && !this.isFinalAuthorizer()) {
      this.appSettingsService.showWarning('Only the final authorizer can approve the payment request.');
      this.form.get('PaymentRequestStatus')?.setValue('WaitingForFinalApproval', { emitEvent: false });
      this.statusOptionsCache = null;
    }
  }

  private revertStatus(): void {
    const saved = this.paymentRequestData?.PaymentRequestStatus || 'Pending';
    this.form.get('PaymentRequestStatus')?.setValue(saved, { emitEvent: false });
    this.statusOptionsCache = null;
  }

  openAuthority(): void {
    const documentSid = Number(this.form.get('PaymentRequestSid')?.value) || null;
    if (!documentSid) {
      this.appSettingsService.showWarning('Please save the payment request before viewing authorization.');
      return;
    }
    const modalRef = this.modalService.open(AuthorityLogComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = documentSid;
    modalRef.componentInstance.menuMasterSid = Number(this.mps.getMenuId());
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch?.BranchMasterSid;
    // Menu-only authorization: do not scope the log by department.
    modalRef.componentInstance.DepartmentMasterSid = null;
    modalRef.componentInstance.DepartmentMaster = '';
  }

  openAuditLogs() {
        if (!this.form.get('PaymentRequestSid')?.value) return;
        const modalRef = this.modalService.open(AuditLogComponent, {
          centered: true,
          scrollable: true,
          size: 'xl',
          windowClass: 'audit-log-modal'
        });
        modalRef.componentInstance.title = 'Payment Request Logs';
        modalRef.componentInstance.tableName = 'PaymentRequest';
        modalRef.componentInstance.recordId = this.form.get('PaymentRequestSid')?.value.toString();
        modalRef.componentInstance.screenName = 'PaymentRequest';
      }

      showInfo() {
          if (!this.paymentRequestData) return;
          const modalRef = this.modalService.open(DetailsComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static',
          });
          modalRef.componentInstance.item = this.paymentRequestData;
          modalRef.componentInstance.idLabel = 'Payment Request Id';
          modalRef.componentInstance.idValue = this.form.get('PaymentRequestSid')?.value;
        }

}
