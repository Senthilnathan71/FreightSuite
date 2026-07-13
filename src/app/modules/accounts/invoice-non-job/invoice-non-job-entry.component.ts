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
import { ExpandTextDirective } from 'src/app/core/Directives/expand-text.directive';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { VOUCHER_FIELD_LIMITS } from 'src/app/common/voucher-field-limits';
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
import { navigateToVoucherEntry, VoucherType } from 'src/app/common/voucher-route';
import { MasterService } from 'src/app/modules/master/master.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { TaxCalculationService } from 'src/app/modules/operation/services/tax-calculation.service';
import { InvoiceEntryComponent } from 'src/app/modules/operation/Invoice/invoice-entry/invoice-entry.component';
import { InvoiceNonJobService } from '../services/invoice-non-job.service';
import { VoucherActionGuardService } from 'src/app/shared/services/voucher-action-guard.service';
import { getDefaultTodayDate, toNumber } from 'src/app/common/helper';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';

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
    ExpandTextDirective,
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
  // Character limits for text fields (single source of truth, mirrors DB widths).
  protected override readonly LIMITS = VOUCHER_FIELD_LIMITS;
  @ViewChild('nonJobprintModal') override nonJobPrintModalRef: any;
  @ViewChild('nonJobCurrencyDropdown') nonJobCurrencyDropdown?: SearchableDropdown;

  coaList: any[] = [];
  subledgerListDetail: any[][] = [];
  hssacListForNonJob: any[] = [];
  private payloadWrapperInstalled = false;

  constructor(
    private nonJobRouter: Router,
    route: ActivatedRoute,
    private nonJobFb: FormBuilder,
    private nonJobModalService: NgbModal,
    private nonJobConfirmService: ModalService,
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
      nonJobConfirmService,
    );
  }

  override initForm(): void {
    super.initForm();
    this.invoiceForm.addControl('BillNo', this.nonJobFb.control('', [Validators.maxLength(VOUCHER_FIELD_LIMITS.header.DocumentNumber)]));
    this.invoiceForm.addControl('BillDate', this.nonJobFb.control(null));
    this.invoiceForm.addControl('BillAmt', this.nonJobFb.control(0));
    this.invoiceForm.get('voucherOthers.DueDate')?.disable({ emitEvent: false });
    this.invoiceForm.patchValue({
      Narration: '',
      Remarks: '',
      CustomsDuty: 'N',
      TaxType: this.getNonJobCompanyTaxType(),
    }, { emitEvent: false });
  }

  override ngOnInit(): void {
    const copiedState = history?.state;
    const copiedNonJobInvoiceData = copiedState?.copiedNonJobInvoiceData;
    const isCopiedNonJobInvoice = !!copiedState?.isCopiedNonJobInvoice;
    if (isCopiedNonJobInvoice && copiedNonJobInvoiceData) {
      history.replaceState({}, '', location.pathname);
    }

    this.installNonJobPayloadWrapper();
    super.ngOnInit();
    this.loadNonJobLedgers();
    if (isCopiedNonJobInvoice && copiedNonJobInvoiceData) {
      void this.loadCopiedNonJobInvoiceForNewEntry(copiedNonJobInvoiceData);
    }
  }

  override determineGSTType(placeOfSupply: string): void {
    super.determineGSTType(placeOfSupply);
    this.invoiceForm.get('TaxType')?.setValue(this.getNonJobCompanyTaxType(), { emitEvent: false });
  }

  override getCustomerBranchByCustomer(CustomerMasterSid: number): void {
    if (!CustomerMasterSid) {
      this.customerBranchList = [];
      return;
    }

    this.nonJobOperationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          this.customerBranchList = resp.data || [];
          if (!this.headerId && this.invoiceData?.VoucherHeaderSid === null) {
            this.restoreCopiedCustomerAddressSelection(this.invoiceData);
          } else {
            this.autoSelectCustomerBranch();
          }
        }
      },
      error: (err) => {
        console.error('Error fetching customer branches', err);
        this.customerBranchList = [];
        if (!this.headerId && this.invoiceData?.VoucherHeaderSid === null) {
          this.restoreCopiedCustomerAddressSelection(this.invoiceData);
        }
      },
    });
  }

  /**
   * After a customer is picked, auto-fill the address by selecting the customer's first
   * (primary) branch — or the only one — and patching its address via onCustomerBranchChange,
   * then move the cursor to the Currency field. Skips when a branch is already chosen (existing
   * record being loaded) so the saved address is preserved.
   */
  private autoSelectCustomerBranch(): void {
    if (this.invoiceForm.get('CustomerBranchSid')?.value) return;
    const branch = (this.customerBranchList || [])[0];
    if (!branch?.CustomerBranchSid) return;

    this.invoiceForm.get('CustomerBranchSid')?.setValue(branch.CustomerBranchSid);
    this.onCustomerBranchChange(branch);
    setTimeout(() => this.nonJobCurrencyDropdown?.focus(), 0);
  }

  copyNonJobInvoice(): void {
    if (!this.invoiceData) {
      this.nonJobAppSettings.showWarning('No invoice data to copy');
      return;
    }

    this.nonJobConfirmService.confirm(
      'Are you sure you want to copy this invoice?',
      'Copy Non Job Invoice',
      'Copy'
    ).then((confirmed) => {
      if (confirmed) {
        this.performNonJobInvoiceCopy();
      }
    });
  }

  private performNonJobInvoiceCopy(): void {
    try {
      const copiedData = this.prepareCopiedNonJobInvoiceData();

      navigateToVoucherEntry(this.nonJobRouter, VoucherType.NON_JOB_INVOICE, null, {
        extras: {
          state: {
            copiedNonJobInvoiceData: copiedData,
            isCopiedNonJobInvoice: true,
          },
        },
      });
    } catch (err) {
      console.error('Error copying non-job invoice:', err);
      this.nonJobAppSettings.showError('Failed to copy invoice.');
    }
  }

  private async loadCopiedNonJobInvoiceForNewEntry(invoice: any): Promise<void> {
    this.nonJobSpinner.show();

    try {
      await this.waitForNonJobCopyDependencies();
      const copiedData = this.prepareCopiedNonJobInvoiceData(invoice);

      this.headerId = null;
      this.invoiceData = copiedData;
      this.invoicePrintData = null;
      this.showVoucherDateError = false;
      this.invoiceForm.enable({ emitEvent: false });

      this.patchValues(copiedData);
      this.applyNonJobCopyDefaults();

      this.isDirty = true;
      this.invoiceForm.markAsDirty();
      this.nonJobAppSettings.showSuccess('Invoice copied successfully. Please review and save.');
    } catch (err) {
      console.error('Error copying non-job invoice:', err);
      this.nonJobAppSettings.showError('Failed to copy invoice.');
    } finally {
      this.nonJobSpinner.hide();
    }
  }

  private async waitForNonJobCopyDependencies(): Promise<void> {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 0; attempt < 50; attempt++) {
      if (this.invoiceForm && this.customerList?.length && this.coaList?.length) {
        return;
      }
      await delay(100);
    }
  }

  private prepareCopiedNonJobInvoiceData(source: any = this.invoiceData): any {
    const customerAddress = this.resolveCopiedCustomerAddress(source);
    const customerBranchSid = this.resolveCopiedCustomerBranchSid(source);
    const copiedData = {
      ...source,
      CustomerBranchSid: customerBranchSid,
      VoucherOthers: Array.isArray(source?.VoucherOthers)
        ? source.VoucherOthers.map((item: any) => ({ ...item }))
        : source?.VoucherOthers
          ? { ...source.VoucherOthers }
          : null,
      voucherOthers: Array.isArray(source?.voucherOthers)
        ? source.voucherOthers.map((item: any) => ({ ...item }))
        : source?.voucherOthers
          ? { ...source.voucherOthers }
          : null,
      VoucherHeaderSid: null,
      VoucherNumber: '',
      VoucherDate: getDefaultTodayDate(),
      BillNo: '',
      BillDate: null,
      DocumentNumber: '',
      DocumentDate: null,
      PostDate: null,
      PostStatus: 'U',
      Status: 'A',
      status: 'A',
      PartyAddress: customerAddress,
      customerBranch: this.resolveCopiedCustomerBranch(source, customerBranchSid, customerAddress),
      PostedOn: null,
      IRNStatus: '',
      VoucherDetail: Array.isArray(source?.VoucherDetail)
        ? source.VoucherDetail
            .filter((detail: any) => String(detail?.IsAutoGenerated || 'N').toUpperCase() !== 'Y')
            .map((detail: any) => ({
              ...detail,
              VoucherDetailSid: null,
              IsAutoGenerated: 'N',
            }))
        : [],
    };

    const voucherOthers = this.getVoucherOthersSource(copiedData);
    if (voucherOthers) {
      voucherOthers.DueDate = null;
    }

    return copiedData;
  }

  private applyNonJobCopyDefaults(): void {
    const today = getDefaultTodayDate();

    this.invoiceForm.patchValue({
      VoucherNumber: '',
      VoucherDate: today,
      BillNo: '',
      BillDate: null,
      DocumentNumber: '',
      PostStatus: 'U',
      status: 'A',
      CustomerBranchSid: this.resolveCopiedCustomerBranchSid(this.invoiceData),
    }, { emitEvent: false });

    this.restoreCopiedCustomerAddressSelection(this.invoiceData);
    setTimeout(() => this.restoreCopiedCustomerAddressSelection(this.invoiceData), 0);
    this.syncNonJobDueDate(null, false);
    this.updateBillAmount();
    this.invoiceForm.get('VoucherNumber')?.disable({ emitEvent: false });
    this.invoiceForm.get('PartyAddress')?.disable({ emitEvent: false });
    this.invoiceForm.get('MBLNo')?.disable({ emitEvent: false });
    this.invoiceForm.get('voucherOthers.DueDate')?.disable({ emitEvent: false });

    if (this.invoiceForm.get('CurrencyMasterSid')?.value === this.currentCompany?.CurrencyMasterSid) {
      this.invoiceForm.get('ExchangeRate')?.disable({ emitEvent: false });
    }
  }

  private restoreCopiedCustomerAddressSelection(source: any): void {
    const branchSid = this.resolveCopiedCustomerBranchSid(source);
    const copiedAddress = this.resolveCopiedCustomerAddress(source);

    this.ensureCopiedCustomerBranchOption(source);
    this.invoiceForm.patchValue({
      CustomerBranchSid: branchSid,
      PartyAddress: copiedAddress,
    }, { emitEvent: false });
  }

  private resolveCopiedCustomerBranchSid(source: any): number | null {
    const rawSid =
      source?.CustomerBranchSid ||
      source?.customerBranch?.CustomerBranchSid ||
      source?.CustomerBranch?.CustomerBranchSid ||
      source?.customerBranch?.BranchMasterSid ||
      source?.CustomerBranch?.BranchMasterSid;

    const branchSid = Number(rawSid);
    return Number.isFinite(branchSid) && branchSid > 0 ? branchSid : null;
  }

  private resolveCopiedCustomerBranch(source: any, branchSid: number | null, address: string): any {
    const branch = source?.customerBranch || source?.CustomerBranch || {};

    return {
      ...branch,
      CustomerBranchSid: branchSid,
      Address: address || branch?.Address || branch?.CustomerAddress || branch?.CustomerAddress1 || '',
      CustomerName: source?.PartyName || source?.CustomerName || branch?.CustomerName || '',
    };
  }

  private ensureCopiedCustomerBranchOption(source: any): void {
    const branchSid = this.resolveCopiedCustomerBranchSid(source);
    if (!branchSid) return;

    const address = this.resolveCopiedCustomerAddress(source);
    const existingIndex = this.customerBranchList.findIndex(
      (branch: any) => Number(branch?.CustomerBranchSid) === Number(branchSid)
    );
    const branchOption = this.resolveCopiedCustomerBranch(source, branchSid, address);

    if (existingIndex >= 0) {
      this.customerBranchList[existingIndex] = {
        ...this.customerBranchList[existingIndex],
        ...branchOption,
      };
      return;
    }

    this.customerBranchList = [branchOption, ...this.customerBranchList];
  }

  private resolveCopiedCustomerAddress(source: any): string {
    const customerBranch = source?.customerBranch || source?.CustomerBranch || {};
    const subledger = source?.subledgerMaster || source?.SubledgerMaster || {};
    const customer = customerBranch?.customerMaster || customerBranch?.CustomerMaster || {};

    return String(
      source?.PartyAddress ||
      source?.CustomerAddress ||
      customerBranch?.Address ||
      customerBranch?.CustomerAddress ||
      customerBranch?.CustomerAddress1 ||
      customerBranch?.address ||
      customerBranch?.addressLine1 ||
      subledger?.Address ||
      subledger?.address ||
      customer?.Address ||
      ''
    ).trim();
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
        Narration: this.getNonJobPrintNarration(detail, index),
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
    // Per-row narration (defaults to header narration; manual edits are preserved and saved).
    // Added after super.createDetailGroup so disableControlsIfVoucherExists doesn't lock it on saved rows.
    if (!group.get('Narration')) {
      group.addControl('Narration', this.nonJobFb.control(
        data?.Narration ?? this.invoiceForm.get('Narration')?.value ?? '',
        [Validators.maxLength(VOUCHER_FIELD_LIMITS.header.Narration)],
      ));
    }
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
        const ledgerCurrencyCode = currency?.currencyCode ?? ctrl.get('CurrencyCode')?.value;
        ctrl.patchValue({
          CurrencyMasterSid: ledgerCurrencyId,
          CurrencyCode: ledgerCurrencyCode,
        }, { emitEvent: false });
        // Ledger drove the row currency — refetch its exchange rate and recalc,
        // same as the subledger/currency-dropdown change paths.
        this.patchExchangeRateForDetail(ledgerCurrencyCode, this.currentCompanyCurrency.code, detailIndex);
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

  /**
   * When a detail row's currency matches the HEADER currency (and it isn't the company/local
   * currency, which the base already pins to rate 1), mirror the header's exchange rate onto
   * the row and lock it — instead of fetching an independent rate. This makes a manually set
   * header rate flow down to same-currency rows. Other currencies fall back to the base fetch.
   */
  override patchExchangeRateForDetail(fromCurrencyCode: string, toCurrencyCode: string, index: number): void {
    const headerCurrencyCode = this.invoiceForm.get('CurrencyCode')?.value;
    if (
      fromCurrencyCode &&
      headerCurrencyCode &&
      fromCurrencyCode === headerCurrencyCode &&
      fromCurrencyCode !== toCurrencyCode // toCurrencyCode is the company currency; if equal, let base pin to 1
    ) {
      const group = this.details.at(index) as FormGroup;
      group.get('ExchangeRate')?.setValue(toNumber(this.invoiceForm.get('ExchangeRate')?.value) || 1, { emitEvent: false });
      group.get('ExchangeRate')?.disable({ emitEvent: false });
      this.onDetailChange(index, 'ExchangeRate');
      return;
    }
    super.patchExchangeRateForDetail(fromCurrencyCode, toCurrencyCode, index);
  }

  /**
   * Keep same-currency detail rows in sync when the HEADER currency or exchange rate changes.
   * recalculateAllRows() runs after both (header currency change -> fetchExchangeRate, and the
   * header Ex. Rate input), so re-pinning matching rows here covers both cases.
   */
  override recalculateAllRows(): void {
    this.syncDetailRatesWithHeaderCurrency();
    super.recalculateAllRows();
  }

  private syncDetailRatesWithHeaderCurrency(): void {
    if (this.isPosted) return;
    const headerCurrencyCode = this.invoiceForm.get('CurrencyCode')?.value;
    const companyCurrencyCode = this.currentCompanyCurrency?.code;
    // Company-currency rows are already pinned to rate 1 by the base — nothing to mirror.
    if (!headerCurrencyCode || headerCurrencyCode === companyCurrencyCode) return;
    const headerExRate = toNumber(this.invoiceForm.get('ExchangeRate')?.value) || 1;
    this.details.controls.forEach((control) => {
      const group = control as FormGroup;
      if (group.get('CurrencyCode')?.value === headerCurrencyCode) {
        group.get('ExchangeRate')?.setValue(headerExRate, { emitEvent: false });
        group.get('ExchangeRate')?.disable({ emitEvent: false });
      }
    });
  }

  override onSubmit(resolve?: (value: boolean) => void, isPostingTrue?: boolean): void {
    // Mirror the base "No changes to save" guard BEFORE the normalizations below.
    // Those normalizations mutate the form every call, so if we let them run first they
    // make the form differ from the load-time baseline and defeat the base guard —
    // which is why an untouched edit was saving. isDirty is the baseline-vs-current flag
    // maintained by subscribeToFormChanges, so !isDirty means the user changed nothing.
    if (this.isEditMode && !this.isDirty) {
      this.nonJobAppSettings.showWarning('No changes to save');
      this.invoiceForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    const narration = this.invoiceForm.get('Narration')?.value || '';
    this.syncNonJobDueDate(this.invoiceForm.get('voucherOthers.DueDate')?.value || this.dueDate);
    this.invoiceForm.get('Remarks')?.setValue(narration, { emitEvent: false });
    this.invoiceForm.get('DocumentNumber')?.setValue(this.invoiceForm.get('BillNo')?.value || '', { emitEvent: false });
    this.details.controls.forEach((control) => {
      const group = control as FormGroup;
      // Preserve the row's manual narration; fall back to the header narration only when blank.
      const rowNarration = String(group.get('Narration')?.value ?? '').trim() || narration;
      group.patchValue({
        ChargeDescription: rowNarration,
        Narration: rowNarration,
        MasterJobSid: null,
        HouseJobSid: null,
        DepartmentMasterSid: null,
        ChargeMasterSid: null,
        ChargeUOMSid: null,
        NumberOfUnit: 1,
        // recalcRow stores these as comma-grouped strings ("73,340.00"). The base save does
        // Number(...) on them, so >=1000 values become NaN -> 0 (and the header Amount too,
        // via computeHeaderAmounts). Coerce to plain numbers here so the base saves them intact.
        Amount: toNumber(group.get('Amount')?.value),
        LocalAmount: toNumber(group.get('LocalAmount')?.value),
        PartyAmount: toNumber(group.get('PartyAmount')?.value),
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

    const loadedDetails = Array.isArray(data?.VoucherDetail) ? data.VoucherDetail : [];
    // A posted invoice can include auto-generated rows (bank / tax / party) whose ledger was not in the
    // create-time dropdown set. If any loaded row's ledger is missing from coaList, re-fetch ONLY the
    // ledger dropdown (with VoucherHeaderSid → posted/static config) so those ledgers resolve — without
    // reloading the other lookups. (No redundant fetch when the list already covers every row.)
    if (this.isPosted && loadedDetails.some((d: any) => {
      const sid = Number(d?.COAMasterSid);
      return sid && !this.coaList.some((x: any) => Number(x.COAMasterSid) === sid);
    })) {
      this.loadLedgerDropdown();
    }
    this.details.controls.forEach((control, index) => {
      this.hssacList[index] = this.hssacListForNonJob;
      const rawDetail = loadedDetails[index];
      (control as FormGroup).get('Narration')?.setValue(
        rawDetail?.Narration ?? rawDetail?.ChargeDescription ?? '',
        { emitEvent: false },
      );
      const coaSid = (control as FormGroup).get('COAMasterSid')?.value;
      if (coaSid) {
        const coa = this.coaList.find((item) => Number(item.COAMasterSid) === Number(coaSid)) || { COAMasterSid: coaSid, SubledgerName: 'Y' };
        this.onCOAChange(coa, index, false);
      }
    });
    // Reconstruct each row's LocalAmount / PartyAmount from the reliable Amount on load, then
    // refresh BillAmt. recalcRow stores LocalAmount/PartyAmount as comma-grouped strings which
    // the base save path's Number(...) turned into 0 for >=1000 values — corrupting the stored
    // LocalAmount/PartyAmount and the header Amount. Amount itself is stored correctly, so we
    // rederive: LocalAmount = Amount * rowExRate, PartyAmount via getPartyAmount. This makes the
    // bill total show on load AND lets the next save persist correct values. Taxes are untouched;
    // posted and auto-generated rows keep their stored values.
    if (!this.isPosted) {
      this.details.controls.forEach((control, index) => {
        const group = control as FormGroup;
        const isAuto = group.get('IsAutoGenerated')?.value;
        if (isAuto === true || String(isAuto ?? 'N').toUpperCase() === 'Y') return;
        const rowExRate = toNumber(group.get('ExchangeRate')?.value) || 1;
        const localAmount = toNumber(this.getFormattedAmount(
          toNumber(group.get('Amount')?.value) * rowExRate,
          this.currentCompany?.CurrencyMasterSid,
        ));
        group.get('LocalAmount')?.setValue(localAmount, { emitEvent: false });
        group.get('PartyAmount')?.setValue(toNumber(this.getPartyAmount(index)), { emitEvent: false });
      });
    }
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
    this.loadLedgerDropdown();
  }

  private loadLedgerDropdown(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) return;
    this.nonJobOperationService.getAllCoaWithLedgerCategory({
      CompanyMasterSid: companyId,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      LedgerCategory: 'Ledger',
      VoucherType: 'NIN',
      ...(this.headerId ? { VoucherHeaderSid: this.headerId } : {}),
    }).subscribe({
      next: (resp: any) => {
        this.coaList = Array.isArray(resp?.data)
          ? resp.data
          : [];
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
      TaxType: this.getNonJobCompanyTaxType(),
      CustomsDuty: 'N',
      MasterJobSid: null,
      HouseJobSid: null,
      DepartmentMasterSid: null,
      VoucherDetail: (payload?.VoucherDetail || []).map((detail: any) => {
        const headerNarration = payload?.Narration || payload?.Remarks || '';
        // Base onSubmit carries ChargeDescription (not Narration) per row — read from it,
        // and fall back to the header narration only when the row narration is blank.
        const rowNarration = String(detail?.Narration ?? detail?.ChargeDescription ?? '').trim() || headerNarration;
        return {
          ...detail,
          ChargeDescription: rowNarration,
          Narration: rowNarration,
          ChargeMasterSid: null,
          ChargeUOMSid: null,
          NumberOfUnit: 1,
          MasterJobSid: null,
          HouseJobSid: null,
          DepartmentMasterSid: null,
        };
      }),
    };
  }

  private getVoucherOthersSource(source: any): any {
    if (!source) return null;
    if (Array.isArray(source.VoucherOthers)) return source.VoucherOthers[0] || null;
    if (source.VoucherOthers) return source.VoucherOthers;
    if (Array.isArray(source.voucherOthers)) return source.voucherOthers[0] || null;
    return source.voucherOthers || null;
  }

  private getNonJobCompanyTaxType(): 'GST' | 'VAT' {
    return String(this.currentCompanyCountryCode || '').toLowerCase() === 'in' ? 'GST' : 'VAT';
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

  /**
   * Keep post-create navigation on the non-job entry route. Overrides the base
   * (which routes to the job-invoice entry) so we no longer need to patch the
   * shared Router — that global patch leaked app-wide and hijacked the operation
   * invoice list's "view" navigation.
   */
  protected override navigateAfterCreate(headerId: number): void {
    navigateToVoucherEntry(this.nonJobRouter, VoucherType.NON_JOB_INVOICE, headerId, {
      extras: { replaceUrl: true },
    });
  }

  override updateBillAmount(): void {
    const billAmount = this.details.controls.reduce((sum: number, row: any) => {
      const isAutoGenerated = row.get('IsAutoGenerated')?.value;
      if (isAutoGenerated === true || String(isAutoGenerated || 'N').toUpperCase() === 'Y') {
        return sum;
      }

      const partyAmount = toNumber(row.get('PartyAmount')?.value);
      const headerExchangeRate = toNumber(this.invoiceForm.get('ExchangeRate')?.value || 1) || 1;
      const taxAmount = (toNumber(row.get('TaxAmount1')?.value) + toNumber(row.get('TaxAmount2')?.value)) / headerExchangeRate;
      const rowTotal = partyAmount + taxAmount;

      return row.get('DrCr')?.value === 'D' ? sum - rowTotal : sum + rowTotal;
    }, 0);

    this.invoiceForm.get('BillAmt')?.setValue(this.round(billAmount), { emitEvent: false });
  }

  private isNonJobInvoicePosted(): boolean {
    const postStatus = String(
      this.invoiceData?.PostStatus ||
      this.invoiceForm?.get('PostStatus')?.value ||
      ''
    ).toUpperCase();

    return postStatus === 'P' || postStatus === 'POSTED';
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

  private getNonJobPrintNarration(detail: any, index: number): string {
    const rawDetail = this.invoiceData?.VoucherDetail?.filter((row: any) => row?.IsAutoGenerated !== 'Y')?.[index];
    return rawDetail?.Narration ||
      detail?.Narration ||
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
