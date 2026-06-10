import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { CommonService } from 'src/app/common/common.service';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { generateNonJobInvoiceDocument } from 'src/app/common/pdf/generators/non-job-invoice-pdf.generator';
import { PdfFileSaveService } from 'src/app/common/pdf-file-save.service';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { VoucherPeriodValidationService } from 'src/app/common/voucher-period-validation.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { TaxCalculationService } from 'src/app/modules/operation/services/tax-calculation.service';
import { InvoiceEntryComponent } from 'src/app/modules/operation/Invoice/invoice-entry/invoice-entry.component';
import { InvoiceNonJobService } from '../services/invoice-non-job.service';
import { VoucherActionGuardService } from 'src/app/shared/services/voucher-action-guard.service';
import { getDefaultTodayDate, toNumber } from 'src/app/common/helper';

@Component({
  selector: 'app-invoice-non-job-entry',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FeatherModule,
    NgbDatepickerModule,
    NgbTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSpinnerModule,
    NumberFormatPipe,
    CustomDatePipe,
    SearchableDropdown,
    NgbDropdownModule,
    PreventMultiClickDirective,
    DecimalPrecisionDirective,
    ElementStateGuardDirective,
    FormStateGuardDirective,
    RouterModule,
  ],
  templateUrl: './invoice-non-job-entry.component.html',
  styleUrl: '../../operation/Invoice/invoice-entry/invoice-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe,
    TaxCalculationService,
  ],
})
export class InvoiceNonJobEntryComponent extends InvoiceEntryComponent {
  @ViewChild('nonJobprintModal') override nonJobPrintModalRef: any;

  coaList: any[] = [];
  subledgerListDetail: any[][] = [];
  hssacListForNonJob: any[] = [];
  private payloadWrapperInstalled = false;
  private navigationInterceptorInstalled = false;

  constructor(
    private nonJobRouter: Router,
    route: ActivatedRoute,
    private nonJobFb: FormBuilder,
    private nonJobModalService: NgbModal,
    private nonJobInvoiceService: InvoiceNonJobService,
    private nonJobOperationService: OperationService,
    masterService: MasterService,
    private nonJobAppSettings: AppSettingsService,
    private nonJobSpinner: NgxSpinnerService,
    companySettings: CompanySettingsManagerService,
    mps: MenuPermissionService,
    commonService: CommonService,
    taxCalculationService: TaxCalculationService,
    currencyConfigService: CurrencyConfigurationService,
    currencyFormatter: CurrencyFormatService,
    pdfService: PdfDownloadService,
    private nonJobPdfMakeService: PdfMakeService,
    toastr: ToastrService,
    logoService: LogoService,
    numberToWords: NumberToWordsService,
    voucherPeriodService: VoucherPeriodValidationService,
    private nonJobPdfFileSaveService: PdfFileSaveService,
    emailTriggerService: EmailTriggerService,
    voucherActionGuard: VoucherActionGuardService,
  ) {
    super(
      nonJobRouter,
      route,
      nonJobFb,
      nonJobModalService,
      nonJobInvoiceService,
      nonJobOperationService,
      masterService,
      nonJobAppSettings,
      nonJobSpinner,
      companySettings,
      mps,
      commonService,
      taxCalculationService,
      currencyConfigService,
      currencyFormatter,
      pdfService,
      nonJobPdfMakeService,
      toastr,
      logoService,
      numberToWords,
      voucherPeriodService,
        nonJobPdfFileSaveService,
      emailTriggerService,
      voucherActionGuard,
    );
  }

  override initForm(): void {
    super.initForm();
    this.invoiceForm.addControl('BillNo', this.nonJobFb.control(''));
    this.invoiceForm.addControl('BillDate', this.nonJobFb.control(null));
    this.invoiceForm.addControl('BillAmt', this.nonJobFb.control(0));
    this.invoiceForm.get('voucherOthers.DueDate')?.disable({ emitEvent: false });
    this.invoiceForm.patchValue({
      Narration: '',
      Remarks: '',
      CustomsDuty: 'N',
    }, { emitEvent: false });
  }

  override ngOnInit(): void {
    this.installNonJobPayloadWrapper();
    this.installNonJobNavigationInterceptor();
    super.ngOnInit();
    this.loadNonJobLedgers();
  }

  override async openPrintModal(): Promise<void> {
    if (!this.headerId || !this.invoiceData) {
      this.nonJobAppSettings.showWarning('Please save the invoice before printing.');
      return;
    }

    const status = this.invoiceData?.Status || this.invoiceForm.get('Status')?.value || this.invoiceForm.get('status')?.value;
    if (status !== 'A') {
      this.nonJobAppSettings.showWarning('Only active invoices can be printed.');
      return;
    }

    this.nonJobSpinner.show();
    try {
      await this.preparePrintData();
      this.nonJobModalService.open(this.nonJobPrintModalRef, {
        size: 'xl',
        scrollable: true,
      });
    } finally {
      this.nonJobSpinner.hide();
    }
  }

  override async preparePrintData(): Promise<void> {
    await super.preparePrintData();

    const billNo = this.invoiceData?.BillNo || this.invoiceData?.DocumentNumber || this.invoiceForm.get('BillNo')?.value || '';
    const billDate = this.invoiceData?.BillDate || this.invoiceData?.DocumentDate || this.invoiceForm.get('BillDate')?.value || '';
    const narration = this.invoiceData?.Narration || this.invoiceData?.Remarks || this.invoiceForm.get('Narration')?.value || '';
    const invoiceDueDate = this.getNonJobInvoiceDueDate();
    const customerTaxNo = this.getNonJobCustomerTaxNo();
    const irnNumber = this.getNonJobIRNNumber();

    this.invoicePrintData = {
      ...this.invoicePrintData,
      IsNonJobInvoice: true,
      DocumentNumber: billNo,
      BillNo: billNo,
      BillDate: billDate,
      ShipperName: '',
      ConsigneeName: '',
      Vessel: '',
      VoyageNo: '',
      POL: '',
      FPD: '',
      ETD: '',
      ETA: '',
      BOENo: '',
      DeclarationNo: '',
      HBLNo: '',
      MBLNo: '',
      MasterJobNumber: '',
      MasterJobDate: '',
      FreightTerms: '',
      BookingNumber: '',
      JobType: '',
      IsServiceJob: 'Y',
      ContainerType: '',
      ContainerNumber: '',
      GST_VAT: customerTaxNo,
      customerGstVat: customerTaxNo,
      IRNNumber: irnNumber,
      InvoiceDueDate: invoiceDueDate,
      Remarks: narration,
      voucherDetails: (this.invoicePrintData?.voucherDetails || []).map((detail: any, index: number) => ({
        ...detail,
        ChargeDescription: this.getNonJobPrintParticular(detail, index),
        NumberOfUnit: detail?.NumberOfUnit || '1.000',
      })),
    };
  }

  override async generatePDFBlob(): Promise<Blob> {
    await this.preparePrintData();

    const logo = this.nonJobPdfMakeService.getReportLogo();
    const invoiceNumber = this.invoicePrintData?.InvoiceNo || this.invoiceData?.VoucherNumber || this.invoiceForm.get('VoucherNumber')?.value || '';
    const invoiceDate = this.invoicePrintData?.InvoiceDate || this.invoiceData?.VoucherDate || this.invoiceForm.get('VoucherDate')?.value;
    const currencyCode = this.invoiceData?.CurrencyCode || this.invoiceForm.get('CurrencyCode')?.value || '';
    const exchangeRate = this.invoiceData?.ExchangeRate || this.invoiceForm.get('ExchangeRate')?.value || 1;
    const printDetails = this.invoicePrintData?.voucherDetails || [];

    const pdfData: any = {
      company: {
        ...this.currentCompany,
        companyName: this.currentCompany?.companyName || this.currentCompany?.CompanyName || '',
        addressLine1: this.currentCompany?.addressLine1 || this.currentCompany?.Address || '',
        addressLine2: this.currentCompany?.addressLine2 || '',
        countryCode: this.currentCompanyCountryCode,
        postalCode: this.currentCompany?.postal_code || this.currentCompany?.postalCode || this.currentCompany?.ZipCode || '',
        phoneNumber: this.currentCompany?.phoneNumber || this.currentCompany?.Phone || '',
      },
      branch: {
        ...this.currentBranch,
        branchName: this.currentBranch?.branchName || this.currentBranch?.BranchName || '',
        branchCode: this.currentBranch?.branchCode || this.currentBranch?.BranchCode || '',
        addressLine1: this.currentBranch?.addressLine1 || this.currentBranch?.Address || '',
        addressLine2: this.currentBranch?.addressLine2 || '',
        countryCode: this.currentCompanyCountryCode,
        postalCode: this.currentBranch?.postalCode || this.currentBranch?.ZipCode || '',
        phoneNumber: this.currentBranch?.phoneNumber || this.currentBranch?.Phone || '',
      },
      userData: {
        userName: this.userData?.userName || this.userData?.UserName || '',
        email: this.userData?.email || this.userData?.userEmail || '',
      },
      logo,
      invoiceTitle: this.invoicePrintData?.invoiceTitle,
      companyGstCode: this.invoicePrintData?.GSTCode || this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
      companyCountryCode: this.currentCompanyCountryCode,
      companyPan: this.currentCompany?.Pan || this.currentCompany?.PAN || '',
      companyVatNo: this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
      currentCompanyCurrency: this.currentCompanyCurrency,
      invoice: {
        invoiceNo: invoiceNumber,
        invoiceDate,
        invoiceDueDate: this.invoicePrintData?.InvoiceDueDate,
        customerName: this.invoicePrintData?.BilledTo || this.invoiceData?.PartyName || '',
        customerAddress: this.invoicePrintData?.BillingAddress || this.invoiceData?.PartyAddress || '',
        customerGstVat: this.invoicePrintData?.GST_VAT || this.invoiceData?.GST_VAT || '',
        currencyCode,
        exchangeRate,
        postStatus: this.invoiceData?.PostStatus || 'P',
        remarks: this.invoicePrintData?.Remarks || this.invoiceData?.Narration || this.invoiceData?.Remarks || '',
        irnNumber: this.invoicePrintData?.IRNNumber || this.invoiceData?.IRNNumber || '',
      },
      charges: printDetails.map((detail: any, index: number) => ({
        sno: detail.Sno || index + 1,
        chargeName: detail.ChargeDescription || '',
        hsnSacCode: detail.HSSACCode || '',
        currencyCode: detail.CurrencyCode || currencyCode,
        qty: detail.NumberOfUnit || 1,
        rate: detail.Rate || 0,
        roe: detail.ExchangeRate || 1,
        taxableAmount: detail.TaxableAmount || 0,
        cgstPercent: detail.cgstRate || 0,
        cgstAmount: detail.cgstAmt || 0,
        sgstPercent: detail.sgstRate || 0,
        sgstAmount: detail.sgstAmt || 0,
        ugstPercent: detail.ugstRate || 0,
        ugstAmount: detail.ugstAmt || 0,
        igstPercent: detail.igstRate || 0,
        igstAmount: detail.igstAmt || 0,
        vatPercent: detail.vatRate || 0,
        vatAmount: detail.vatAmt || 0,
        localAmount: detail.LocalAmount || 0,
        partyAmount: detail.PartyAmount || 0,
      })),
      totals: {
        grandTotal: this.invoicePrintData?.totalPartyAmount || this.getGrandTotal(),
        currency: currencyCode,
      },
      bankDetails: this.bankDetails || [],
      terms: (this as any).effectiveTermsAndConditions || this.TandCList || [],
      amountInWords: this.invoicePrintData?.AmountInWords || '',
      localCurrency: this.currentCompanyCurrency?.code || '',
      taxDisplayConfig: this.printTaxDisplayConfig,
      isVATMode: this.isVATMode,
      authorisedSignatory: true,
      invoicePrintData: this.invoicePrintData,
    };

    return this.nonJobPdfMakeService.getBlob(generateNonJobInvoiceDocument(pdfData));
  }

  override async downloadPDF(): Promise<void> {
    this.nonJobSpinner.show();
    try {
      const blob = await this.generatePDFBlob();
      const voucherNumber = this.invoiceForm.get('VoucherNumber')?.value || this.invoiceData?.VoucherNumber || this.invoiceData?.InvoiceNo || 'Invoice';
      const filename = `Invoice_${voucherNumber}.pdf`;
      const companyMasterSid = Number(this.currentCompany?.CompanyMasterSid || 0);
      const saveAsFilePath = await this.nonJobPdfFileSaveService.shouldDownloadByFilePath(companyMasterSid);
      await this.nonJobPdfFileSaveService.savePdf(blob, filename, saveAsFilePath);
      this.nonJobAppSettings.showSuccess('PDF downloaded successfully!');
    } catch (error) {
      if ((error as any)?.name !== 'AbortError') {
        console.error('Error generating non-job PDF:', error);
        this.nonJobAppSettings.showError('Error generating PDF. Please try again.');
      }
    } finally {
      this.nonJobSpinner.hide();
    }
  }

  override createDetailGroup(data?: any): FormGroup {
    const group = super.createDetailGroup(data);
    group.get('ChargeMasterSid')?.clearValidators();
    group.get('ChargeMasterSid')?.updateValueAndValidity({ emitEvent: false });
    group.get('ChargeDescription')?.clearValidators();
    group.get('ChargeDescription')?.updateValueAndValidity({ emitEvent: false });
    group.get('ChargeUOMSid')?.clearValidators();
    group.get('ChargeUOMSid')?.updateValueAndValidity({ emitEvent: false });
    group.get('NumberOfUnit')?.setValue(data?.NumberOfUnit || 1, { emitEvent: false });
    group.get('NumberOfUnit')?.clearValidators();
    group.get('NumberOfUnit')?.updateValueAndValidity({ emitEvent: false });
    group.get('COAMasterSid')?.setValidators(Validators.required);
    group.get('COAMasterSid')?.updateValueAndValidity({ emitEvent: false });
    return group;
  }

  override addDetailRow(): void {
    if (this.isReadOnly || this.isPosted) return;
    const missingErrors: string[] = [];
    if (!this.invoiceForm.get('CustomerBranchSid')?.value) {
      missingErrors.push('Please select Customer Address.');
      this.invoiceForm.get('CustomerBranchSid')?.markAsTouched();
    }
    if (!this.invoiceForm.get('CurrencyCode')?.value) {
      missingErrors.push('Please select Currency.');
      this.invoiceForm.get('CurrencyCode')?.markAsTouched();
    }
    if (missingErrors.length) {
      this.nonJobAppSettings.showWarning(missingErrors.join('\n'));
      return;
    }
    this.details.push(this.createDetailGroup());
    this.hssacList[this.details.length - 1] = this.hssacListForNonJob;
    this.onDetailChange(this.details.length - 1, 'CurrencyCode');
    this.invoiceForm.updateValueAndValidity();
  }

  onCOAChange(coa: any, detailIndex: number, resetSubledger: boolean = true): void {
    const ctrl = this.details.at(detailIndex) as FormGroup;
    if (resetSubledger) {
      ctrl.get('LedgerMasterSid')?.setValue(null);
      ctrl.get('LedgerMasterSid')?.disable();
    }
    if (!coa) {
      this.subledgerListDetail[detailIndex] = [];
      return;
    }

    const coaSid = coa.COAMasterSid ?? coa;
    const fullCoa = this.coaList.find((item) => Number(item.COAMasterSid) === Number(coaSid)) || coa;
    if (resetSubledger) {
      const ledgerCurrencyId = fullCoa?.LedgerCurrency;
      if (ledgerCurrencyId) {
        const currency = this.currencyList.find((item: any) => Number(item.CurrencyMasterSid) === Number(ledgerCurrencyId));
        ctrl.patchValue({
          CurrencyMasterSid: ledgerCurrencyId,
          CurrencyCode: currency?.currencyCode ?? ctrl.get('CurrencyCode')?.value,
        }, { emitEvent: false });
      }
    }

    if (fullCoa?.SubledgerName === 'Y') {
      ctrl.get('LedgerMasterSid')?.enable();
      this.nonJobOperationService.getAllSubledgerByCOA({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        COAMasterSid: coaSid,
      }).subscribe({
        next: (resp: any) => {
          this.subledgerListDetail[detailIndex] = resp.status ? (resp.data || []) : [];
          if (!resp.status) this.nonJobAppSettings.showError('Error fetching subledger for ledger');
        },
        error: () => {
          this.subledgerListDetail[detailIndex] = [];
          ctrl.get('LedgerMasterSid')?.setValue(null);
          ctrl.get('LedgerMasterSid')?.disable();
        },
      });
    } else {
      ctrl.get('LedgerMasterSid')?.disable();
    }
  }

  onDetailSubledgerChange(subledger: any, detailIndex: number): void {
    if (!subledger) return;
    const ctrl = this.details.at(detailIndex) as FormGroup;
    const currencyId = subledger.CurrencyMasterSid || subledger.currencyMaster?.CurrencyMasterSid;
    if (!currencyId) return;
    const currency = this.currencyList.find((item: any) => Number(item.CurrencyMasterSid) === Number(currencyId));
    if (!currency) return;
    ctrl.patchValue({
      CurrencyMasterSid: currencyId,
      CurrencyCode: currency.currencyCode,
    });
    this.onDetailChange(detailIndex, 'CurrencyCode');
  }

  override onSubmit(resolve?: (value: boolean) => void, isPostingTrue?: boolean): void {
    const narration = this.invoiceForm.get('Narration')?.value || '';
    this.syncNonJobDueDate(this.invoiceForm.get('voucherOthers.DueDate')?.value || this.dueDate);
    this.invoiceForm.get('Remarks')?.setValue(narration, { emitEvent: false });
    this.invoiceForm.get('DocumentNumber')?.setValue(this.invoiceForm.get('BillNo')?.value || '', { emitEvent: false });
    this.details.controls.forEach((control) => {
      const group = control as FormGroup;
      if (!group.get('ChargeDescription')?.value) {
        group.get('ChargeDescription')?.setValue(narration, { emitEvent: false });
      }
      group.patchValue({
        MasterJobSid: null,
        HouseJobSid: null,
        DepartmentMasterSid: null,
        ChargeMasterSid: null,
        ChargeUOMSid: null,
        NumberOfUnit: 1,
      }, { emitEvent: false });
    });
    super.onSubmit(resolve, isPostingTrue);
  }

  override patchValues(data: any): void {
    super.patchValues(data);
    const voucherOthers = this.getVoucherOthersSource(data);
    this.invoiceForm.patchValue({
      BillNo: data?.BillNo || data?.DocumentNumber || '',
      BillDate: data?.BillDate || data?.DocumentDate ? new Date(data?.BillDate || data?.DocumentDate) : null,
      DocumentNumber: data?.BillNo || data?.DocumentNumber || '',
      IRNNumber: data?.IRNNumber || voucherOthers?.IRNNumber || voucherOthers?.IRNNo || '',
      Narration: data?.Narration || data?.Remarks || '',
      Remarks: data?.Narration || data?.Remarks || '',
      CustomsDuty: 'N',
    }, { emitEvent: false });

    this.details.controls.forEach((control, index) => {
      this.hssacList[index] = this.hssacListForNonJob;
      const coaSid = (control as FormGroup).get('COAMasterSid')?.value;
      if (coaSid) {
        const coa = this.coaList.find((item) => Number(item.COAMasterSid) === Number(coaSid)) || { COAMasterSid: coaSid, SubledgerName: 'Y' };
        this.onCOAChange(coa, index, false);
      }
    });
    this.updateBillAmount();
  }

  override patchDueDate(): void {
    let CustomerMasterSid: number | undefined;
    let CustomerBranchSid: number | undefined;
    const partyLedgerSid = this.invoiceForm?.get('PartyMasterSid')?.value;
    if (partyLedgerSid) {
      const selectedParty = this.customerList.find((cus: any) => cus.SubledgerMasterSid === partyLedgerSid);
      CustomerMasterSid = selectedParty?.CustomerMasterSid;
    }

    const branchId = this.invoiceForm?.get('CustomerBranchSid')?.value;
    if (branchId) {
      const selectedBranch = this.customerBranchList.find(
        (branch: any) => Number(branch.CustomerBranchSid || branch.BranchMasterSid) === Number(branchId)
      );
      CustomerBranchSid = branchId;
      CustomerMasterSid = CustomerMasterSid || selectedBranch?.CustomerMasterSid;
    }

    const voucherDate = this.invoiceForm?.get('VoucherDate')?.value;
    const validDate = voucherDate && !isNaN(new Date(voucherDate).getTime());

    if (!voucherDate || !CustomerMasterSid) {
      this.syncNonJobDueDate(null, false);
      return;
    }

    this.nonJobOperationService.getDueDate({
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      CustomerMasterSid,
      CustomerBranchSid,
      DepartmentMasterSid: null,
      current_date: getDefaultTodayDate(),
      VoucherDate: validDate ? new Date(voucherDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }).subscribe({
      next: (response: any) => {
        this.syncNonJobDueDate(response?.status && response.data ? response.data?.dueDate : null, false);
      },
      error: () => {
        this.syncNonJobDueDate(null, false);
      },
    });
  }

  override goBack(): void {
    this.routerNavigateToList();
  }

  override onReset(): void {
    super.onReset();
    this.invoiceForm.get('CustomsDuty')?.setValue('N', { emitEvent: false });
  }

  private loadNonJobLedgers(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) return;
    const countryMasterSid = Number(this.currentCompany?.CountryMasterSid || this.currentCompany?.countryMaster?.CountryMasterSid || 0);
    const hssacRequest = countryMasterSid
      ? this.nonJobOperationService.getHssacByCountry(countryMasterSid)
      : this.nonJobOperationService.getAllHssac();

    hssacRequest.subscribe({
      next: (resp: any) => {
        const hssacRows = Array.isArray(resp) ? resp : [];
        this.hssacListForNonJob = hssacRows.filter((item: any) => this.isOutputTaxHssac(item));
        this.details.controls.forEach((_control, index) => {
          this.hssacList[index] = this.hssacListForNonJob;
        });
      },
      error: () => {
        this.hssacListForNonJob = [];
      },
    });
    this.nonJobOperationService.getAllCoaWithLedgerCategory({
      CompanyMasterSid: companyId,
      LedgerCategory: 'Ledger',
    }).subscribe({
      next: (resp: any) => {
        this.coaList = Array.isArray(resp?.data) ? resp.data : [];
      },
      error: () => {
        this.coaList = [];
      },
    });
  }

  private routerNavigateToList(): void {
    this.nonJobRouter.navigate(['/accounts/invoice-non-job/list']);
  }

  private installNonJobPayloadWrapper(): void {
    if (this.payloadWrapperInstalled) return;
    this.payloadWrapperInstalled = true;

    const originalCreate = this.nonJobInvoiceService.createInvoice.bind(this.nonJobInvoiceService);
    const originalUpdate = this.nonJobInvoiceService.updateInvoiceById.bind(this.nonJobInvoiceService);

    this.nonJobInvoiceService.createInvoice = (payload: any) => originalCreate(this.buildNonJobPayload(payload));
    this.nonJobInvoiceService.updateInvoiceById = (voucherHeaderSid: number, payload: any) =>
      originalUpdate(voucherHeaderSid, this.buildNonJobPayload(payload));
  }

  private buildNonJobPayload(payload: any): any {
    const billNo = this.invoiceForm.get('BillNo')?.value || payload?.BillNo || payload?.DocumentNumber || '';
    const billDate = this.invoiceForm.get('BillDate')?.value || payload?.BillDate || payload?.DocumentDate || null;
    const payloadVoucherOthers = this.getVoucherOthersSource(payload);
    const voucherOthersPayload = { ...(payloadVoucherOthers || {}) };
    delete voucherOthersPayload.DueDate;
    const irnNumber = this.invoiceForm.get('IRNNumber')?.value || payload?.IRNNumber || payloadVoucherOthers?.IRNNumber || payloadVoucherOthers?.IRNNo || '';

    return {
      ...payload,
      BillNo: billNo,
      BillDate: billDate,
      DocumentNumber: billNo,
      DocumentDate: billDate,
      IRNNumber: irnNumber,
      VoucherOthers: {
        ...voucherOthersPayload,
        IRNNumber: irnNumber,
      },
      TaxType: payload?.TaxType || this.invoiceForm.get('TaxType')?.value || (this.currentCompanyCountryCode === 'in' ? 'GST' : 'VAT'),
      CustomsDuty: 'N',
      MasterJobSid: null,
      HouseJobSid: null,
      DepartmentMasterSid: null,
      VoucherDetail: (payload?.VoucherDetail || []).map((detail: any) => ({
        ...detail,
        ChargeMasterSid: null,
        ChargeUOMSid: null,
        NumberOfUnit: 1,
        MasterJobSid: null,
        HouseJobSid: null,
        DepartmentMasterSid: null,
      })),
    };
  }

  private getVoucherOthersSource(source: any): any {
    if (!source) return null;
    if (Array.isArray(source.VoucherOthers)) return source.VoucherOthers[0] || null;
    if (source.VoucherOthers) return source.VoucherOthers;
    if (Array.isArray(source.voucherOthers)) return source.voucherOthers[0] || null;
    return source.voucherOthers || null;
  }

  syncNonJobDueDate(value: any, emitEvent: boolean = true): void {
    const dueDate = this.normalizeNonJobDate(value);
    this.dueDate = dueDate;
    this.invoiceForm.get('voucherOthers.DueDate')?.setValue(dueDate, { emitEvent });
  }

  private normalizeNonJobDate(value: any): any {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
      return new Date(value.year, value.month - 1, value.day);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }

  private installNonJobNavigationInterceptor(): void {
    if (this.navigationInterceptorInstalled) return;
    this.navigationInterceptorInstalled = true;

    const originalNavigate = this.nonJobRouter.navigate.bind(this.nonJobRouter);
    this.nonJobRouter.navigate = ((commands: any[], extras?: any) => {
      if (Array.isArray(commands) && commands[0] === 'operation/invoice/entry' && commands[1]) {
        return originalNavigate(['/accounts/invoice-non-job/entry', commands[1]], extras);
      }
      return originalNavigate(commands, extras);
    }) as Router['navigate'];
  }

  override updateBillAmount(): void {
    const totalLocalAmount = this.details.controls.reduce((sum: number, row: any) => {
      const localAmount = toNumber(row.get('LocalAmount')?.value);
      return row.get('DrCr')?.value === 'D' ? sum - localAmount : sum + localAmount;
    }, 0);

    this.invoiceForm.get('BillAmt')?.setValue(this.round(totalLocalAmount), { emitEvent: false });
  }

  private isOutputTaxHssac(item: any): boolean {
    const taxText = String(
      item?.TaxType ||
      item?.TaxGroup ||
      item?.TaxGroupName ||
      item?.taxGroup?.TaxGroup ||
      item?.taxGroup?.TaxGroupName ||
      ''
    ).toUpperCase();

    if (!taxText) return true;
    if (/\b(IP|INPUT)\b/.test(taxText)) return false;
    if (/\b(OP|OUTPUT)\b/.test(taxText)) return true;
    return true;
  }

  override getTotalTaxAmount(): string {
    return this.getFormattedAmount(
      this.details.getRawValue().reduce((sum: number, row: any) => sum + toNumber(row.TaxAmount1) + toNumber(row.TaxAmount2), 0),
      this.currentCompany?.CurrencyMasterSid
    );
  }

  canPrintInvoiceNonJob(action: string): boolean {
    return this.mps.canPrint('Invoice Non Job', action) || this.mps.canPrint('Invoice', action);
  }

  private getNonJobPrintParticular(detail: any, index: number): string {
    const rawDetail = this.invoiceData?.VoucherDetail?.filter((row: any) => row?.IsAutoGenerated !== 'Y')?.[index];
    return rawDetail?.ChargeDescription ||
      rawDetail?.coaMaster?.LedgerName ||
      rawDetail?.COAMaster?.LedgerName ||
      rawDetail?.ledgerMaster?.SubledgerName ||
      detail?.ChargeDescription ||
      this.invoicePrintData?.Remarks ||
      this.invoiceData?.Narration ||
      this.invoiceData?.Remarks ||
      '';
  }

  private getNonJobInvoiceDueDate(): any {
    if (this.invoiceData?.CustomsDuty === 'Y') {
      return 'Cash Invoice';
    }

    const voucherOthers = Array.isArray(this.invoiceData?.VoucherOthers)
      ? this.invoiceData.VoucherOthers[0]
      : Array.isArray(this.invoiceData?.voucherOthers)
        ? this.invoiceData.voucherOthers[0]
        : this.invoiceData?.VoucherOthers || this.invoiceData?.voucherOthers;

    const candidates = [
      this.invoiceData?.InvoiceDueDate,
      this.invoiceData?.DueDate,
      voucherOthers?.DueDate,
      this.invoiceForm.get('voucherOthers.DueDate')?.value,
      this.invoiceForm.get('DueDate')?.value,
      this.dueDate,
    ];

    const dueDate = candidates.find((value) => value !== null && value !== undefined && value !== '');
    if (!dueDate) {
      return '';
    }

    if (typeof dueDate === 'object' && 'year' in dueDate && 'month' in dueDate && 'day' in dueDate) {
      return new Date(dueDate.year, dueDate.month - 1, dueDate.day);
    }

    return dueDate;
  }

  private getNonJobCustomerTaxNo(): string {
    const branchSid = Number(
      this.invoiceData?.CustomerBranchSid ||
      this.invoiceData?.customerBranch?.CustomerBranchSid ||
      this.invoiceForm.get('CustomerBranchSid')?.value ||
      0
    );
    const selectedBranch = branchSid
      ? this.customerBranchList?.find((branch: any) => Number(branch?.CustomerBranchSid) === branchSid)
      : null;

    const candidates = [
      this.invoicePrintData?.GST_VAT,
      this.invoicePrintData?.customerGstVat,
      this.invoiceData?.GST_VAT,
      this.invoiceData?.customerGstVat,
      this.invoiceData?.customerBranch?.GSTNo,
      this.invoiceData?.customerBranch?.GST_VAT,
      this.invoiceData?.customerBranch?.customerMaster?.PanType,
      selectedBranch?.GSTNo,
      selectedBranch?.GST_VAT,
      selectedBranch?.customerMaster?.PanType,
      this.invoiceForm.get('GST_VAT')?.value,
    ];

    return String(candidates.find((value) => value !== null && value !== undefined && String(value).trim() !== '') || '').trim();
  }

  private getNonJobIRNNumber(): string {
    const voucherOthers = this.getVoucherOthersSource(this.invoiceData);
    return String(
      this.invoiceData?.IRNNumber ||
      voucherOthers?.IRNNumber ||
      voucherOthers?.IRNNo ||
      this.invoiceForm.get('IRNNumber')?.value ||
      ''
    ).trim();
  }
}
