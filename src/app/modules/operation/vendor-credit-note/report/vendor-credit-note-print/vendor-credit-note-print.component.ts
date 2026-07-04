import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../../operation.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';

@Component({
  selector: 'app-vendor-credit-note-print',
  standalone: true,
  imports: [CommonModule, CustomDatePipe, PrintHeaderComponent],
  templateUrl: './vendor-credit-note-print.component.html',
  styles: ``
})
export class VendorCreditNotePrintComponent {
  @Input() vendorCreditNoteData: any;
  @Input() sourceVendorCreditNoteData: any;
  @Input() printData: any;
  @Input() currentCompany: any;
  @Input() currentBranch: any;
  @Input() currentCompanyCountryCode = '';
  @Input() currentCompanyCurrency: any;
  @Input() bankDetails: any[] = [];
  @Input() TandCList: any[] = [];
  @Input() userData: any;
  @Input() isVATMode = false;
  @Input() currentMenuId: number | null = null;
  @Input() printTaxDisplayConfig: {
    showCGST: boolean;
    showSGST: boolean;
    showUGST: boolean;
    showIGST: boolean;
    showVAT: boolean;
  } | null = null;
  @Input() currentDate: Date = new Date();

  constructor(
    public activeModal: NgbActiveModal,
    private pdfMakeService: PdfMakeService,
    public mps: MenuPermissionService,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService,
    private companySettings: CompanySettingsManagerService,
    private currencyFormatService: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService
  ) {}

  get creditNoteData(): any {
    return this.sourceVendorCreditNoteData || this.vendorCreditNoteData;
  }

  // Template compatibility alias
  get invoiceData(): any {
    return this.sourceVendorCreditNoteData || this.vendorCreditNoteData;
  }

  isSeaDepartment(): boolean {
    const departmentType =
      this.invoiceData?.departmentMaster?.departmentType ||
      this.invoiceData?.masterJob?.departmentMaster?.departmentType ||
      '';
    return String(departmentType).toUpperCase().includes('SEA');
  }

  getTaxDisplayConfig() {
    if (this.printTaxDisplayConfig) {
      return this.printTaxDisplayConfig;
    }

    const details = this.vendorCreditNoteData?.voucherDetails || [];
    const hasCGST = details.some((x: any) => Number(x?.cgstAmt || 0) > 0 || Number(x?.cgstRate || 0) > 0);
    const hasSGST = details.some((x: any) => Number(x?.sgstAmt || 0) > 0 || Number(x?.sgstRate || 0) > 0);
    const hasUGST = details.some((x: any) => Number(x?.ugstAmt || 0) > 0 || Number(x?.ugstRate || 0) > 0);
    const hasIGST = details.some((x: any) => Number(x?.igstAmt || 0) > 0 || Number(x?.igstRate || 0) > 0);
    const hasVAT = details.some((x: any) => Number(x?.vatAmt || 0) > 0 || Number(x?.vatRate || 0) > 0);

    if (this.currentCompanyCountryCode?.toLowerCase() === 'in') {
      return {
        showCGST: hasCGST,
        showSGST: hasSGST,
        showUGST: hasUGST,
        showIGST: hasIGST,
        showVAT: false
      };
    }

    return {
      showCGST: false,
      showSGST: false,
      showUGST: false,
      showIGST: false,
      showVAT: hasVAT || true
    };
  }

  shouldShowForeignCurrencyColumn(): boolean {
    const headerCurrencyCode = String(
      this.invoiceData?.CurrencyCode ??
      this.vendorCreditNoteData?.CurrencyCode ??
      ''
    ).trim().toUpperCase();

    const companyCurrencyCode = String(
      this.currentCompanyCurrency?.code ??
      this.currentCompany?.CurrencyCode ??
      ''
    ).trim().toUpperCase();

    if (headerCurrencyCode && companyCurrencyCode) {
      return headerCurrencyCode !== companyCurrencyCode;
    }

    const headerCurrencySid = Number(
      this.invoiceData?.CurrencyMasterSid ??
      this.vendorCreditNoteData?.CurrencyMasterSid ??
      0
    );
    const companyCurrencySid = Number(
      this.currentCompany?.CurrencyMasterSid ??
      this.currentCompanyCurrency?.currencyMasterSid ??
      0
    );

    return !!headerCurrencySid && !!companyCurrencySid && headerCurrencySid !== companyCurrencySid;
  }

  calculateTotalColspan(): number {
    const cfg = this.getTaxDisplayConfig();
    let baseColumns = 7;

    if (this.currentCompanyCountryCode?.toLowerCase() !== 'ae') {
      baseColumns += 1;
    }

    if (cfg.showCGST) baseColumns += 2;
    if (cfg.showSGST) baseColumns += 2;
    if (cfg.showUGST) baseColumns += 2;
    if (cfg.showIGST) baseColumns += 2;
    if (cfg.showVAT) baseColumns += 2;

    return baseColumns;
  }

  shouldShowVatAmountTotals(): boolean {
    const cfg = this.getTaxDisplayConfig();
    return this.currentCompanyCountryCode?.toLowerCase() === 'ae' && !!cfg?.showVAT;
  }

  shouldShowDetailedTaxAmountTotals(): boolean {
    return this.shouldShowVatAmountTotals();
  }

  calculateBasePrintColspan(): number {
    let baseColumns = 7;

    if (this.currentCompanyCountryCode?.toLowerCase() !== 'ae') {
      baseColumns += 1;
    }

    return baseColumns;
  }

  getPrintAmountTotal(fieldName: 'vatAmt' | 'LocalAmount'): string {
    const total = (this.vendorCreditNoteData?.voucherDetails || []).reduce(
      (sum: number, detail: any) => sum + this.parseAmount(detail?.[fieldName]),
      0
    );

    return this.formatCompanyCurrencyAmount(total);
  }

  formatCurrencyDisplayAmount(amount: number | string, currencyCode?: string): string {
    const resolvedCurrencyCode = String(currencyCode || '').trim();
    const config = this.currencyConfigService.getCurrencyConfig(resolvedCurrencyCode);

    return this.currencyFormatService.formatMaskedAmount({
      value: this.parseAmount(amount),
      currencyCode: config?.currencyCode || resolvedCurrencyCode,
    });
  }

  formatVendorCreditNoteCurrencyAmount(amount: number | string): string {
    return this.formatCurrencyDisplayAmount(
      amount,
      this.vendorCreditNoteData?.CurrencyCode || this.invoiceData?.CurrencyCode || ''
    );
  }

  formatCompanyCurrencyAmount(amount: number | string): string {
    return this.formatCurrencyDisplayAmount(
      amount,
      this.currentCompanyCurrency?.code || this.currentCompany?.CurrencyCode || ''
    );
  }

  private parseAmount(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    return Number(String(value).replace(/,/g, '')) || 0;
  }

  private getRawVendorCreditNoteData(): any {
    return this.sourceVendorCreditNoteData || this.vendorCreditNoteData;
  }

  private getVendorCreditNotePdfOptions(): any {
    return {
      taxDisplayConfig: this.getTaxDisplayConfig(),
      bankDetails: this.vendorCreditNoteData?.BankDetails || this.bankDetails || [],
      terms: this.TandCList || [],
      amountInWords: this.vendorCreditNoteData?.AmountInWords || '',
      localCurrency: this.currentCompanyCurrency?.code || '',
      invoiceTitle: this.vendorCreditNoteData?.invoiceTitle || 'Vendor Credit Note',
      isSeaMode: this.isSeaDepartment(),
      isVATMode: this.getTaxDisplayConfig().showVAT,
      companyVatNo:
        this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
      shipmentDetails: {
        shipper: this.vendorCreditNoteData?.ShipperName,
        consignee: this.vendorCreditNoteData?.ConsigneeName,
        vesselName: this.vendorCreditNoteData?.Vessel,
        voyageNo: this.vendorCreditNoteData?.VoyageNo,
        shipperRefNo: this.vendorCreditNoteData?.DocumentNumber,
        loadingPort: this.vendorCreditNoteData?.POL,
        finalDestination: this.vendorCreditNoteData?.FPD,
        etd: this.vendorCreditNoteData?.ETD,
        eta: this.vendorCreditNoteData?.ETA,
        invoiceDueDate: this.vendorCreditNoteData?.InvoiceDueDate,
        BillDate: this.vendorCreditNoteData?.DocumentDate,
      },
      cargoDetails: {
        packages: this.vendorCreditNoteData?.pkg,
        commodityDesc: this.vendorCreditNoteData?.desc,
        grossWeight: this.vendorCreditNoteData?.grosswt,
        chargeableWeight: this.vendorCreditNoteData?.ChargeableWeight,
        cbm: this.vendorCreditNoteData?.cbm,
      },
      vendorCreditNoteData: this.vendorCreditNoteData,
      printSettings: this.companySettings.getPrintSettings(),
    };
  }

  downloadPDF(): void {
    try {
      const rawVendorData = this.getRawVendorCreditNoteData();
      const logo = this.pdfMakeService.getReportLogo();

      this.pdfMakeService.generateVendorCreditNoteFromApi(
        rawVendorData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        {
          hssacMaster: [],
          currencyMaster: [],
        },
        this.getVendorCreditNotePdfOptions()
      );
      const payload = {
        tableName: 'VoucherHeader',
        recordId: String(rawVendorData.VoucherHeaderSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Download'
        },
        newVal: {
          Print: 'Vendor Credit Note PDF Downloaded',
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('Error generating vendor credit note PDF:', error);
    }
  }

  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const logo = this.pdfMakeService.getReportLogo();
      return await this.pdfMakeService.generateVendorCreditNoteBlobFromApi(
        this.getRawVendorCreditNoteData(),
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        {
          hssacMaster: [],
          currencyMaster: [],
        },
        this.getVendorCreditNotePdfOptions()
      );
    } catch (error) {
      console.error('Error generating vendor credit note PDF blob:', error);
      return null;
    }
  }

  async openEmailModal(): Promise<void> {
    try {
      const blob = await this.generatePDFBlob();
      if (!blob) {
        this.appSettingService.showError('Error generating PDF. Please try again.');
        return;
      }

      const rawVendorData = this.getRawVendorCreditNoteData();
      const documentName = 'Vendor Credit Note';
      const documentNo = rawVendorData?.VoucherNumber || this.vendorCreditNoteData?.VoucherNumber || this.vendorCreditNoteData?.DocumentNumber || '';
      const documentDate = this.formatEmailDate(rawVendorData?.VoucherDate || this.vendorCreditNoteData?.DocumentDate);
      const emailRecipients = await this.emailTriggerService.resolveCustomerBranchEmailRecipientsByMenu({
        customerBranchSid: this.getVendorBranchSidForEmail(),
        customerMasterSid: this.getVendorMasterSidForEmail(),
        menuMasterSid: this.getCurrentMenuMasterSidForEmail()
      });
      const attachmentRequired = await this.emailTriggerService.isAttachmentRequiredForMenu(this.appSettingService.getCurrentCompanyInfo()?.CompanyMasterSid, this.getCurrentMenuMasterSidForEmail());

      if (emailRecipients.toEmail.length === 0) {
        this.appSettingService.showError('No email found in customer branch email.');
        return;
      }

      const emailContent = this.emailTriggerService.buildOperationEmailContent({
        documentName,
        documentNoLabel: 'Vendor Credit Note No.',
        documentNo,
        documentDate,
        pol: this.vendorCreditNoteData?.POL || '',
        pod: this.vendorCreditNoteData?.POD || '',
        fpd: this.vendorCreditNoteData?.FPD || '',
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const file = new File([blob], `Vendor_Credit_Note_${documentNo || 'Report'}.pdf`, { type: 'application/pdf' });
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: emailRecipients.toEmail,
        EmailCC: emailRecipients.ccEmail,
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'Vendor Credit Note No',
          menuName: documentName,
          documentNo,
          date: documentDate,
          pol: this.vendorCreditNoteData?.POL || '',
          pod: this.vendorCreditNoteData?.POD || '',
          fpd: this.vendorCreditNoteData?.FPD || ''
        },
        attachmentRequired,
        // Print "Send Mail" always carries the generated PDF, even when the
        // menu's Mail Configuration has AttachmentRequire = No.
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('Vendor Credit Note email error:', error);
      this.appSettingService.showError('Error preparing email');
    }
  }

  private createEmailAuditLog(documentName: string): void {
    const rawVendorData = this.getRawVendorCreditNoteData();
    const payload = {
      tableName: 'VoucherHeader',
      recordId: String(rawVendorData?.VoucherHeaderSid),
      operation: 'EMAIL',
      changedBy: this.appSettingService.userSettingSource.value['userEmail'],
      changes: {
        action: 'Send Mail'
      },
      newVal: {
        Email: `${documentName} Mail Send`
      }
    };

    this.operationService.createAuditLog(payload).subscribe({
      next: () => { },
      error: (err) => console.error(err)
    });
  }

  private getVendorBranchSidForEmail(): number | null {
    const rawVendorData = this.getRawVendorCreditNoteData();
    const candidates = [
      rawVendorData?.CustomerBranchSid,
      rawVendorData?.customerBranch?.CustomerBranchSid,
      rawVendorData?.CustomerBranch?.CustomerBranchSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getVendorMasterSidForEmail(): number | null {
    const rawVendorData = this.getRawVendorCreditNoteData();
    const candidates = [
      rawVendorData?.CustomerMasterSid,
      rawVendorData?.customerMaster?.CustomerMasterSid,
      rawVendorData?.CustomerMaster?.CustomerMasterSid,
      rawVendorData?.customerBranch?.CustomerMasterSid,
      rawVendorData?.CustomerBranch?.CustomerMasterSid
    ];

    const sid = candidates
      .map(value => Number(value))
      .find(value => Number.isFinite(value) && value > 0);

    return sid || null;
  }

  private getCurrentMenuMasterSidForEmail(): number | null {
    const rawVendorData = this.getRawVendorCreditNoteData();
    const sid = Number(
      this.currentMenuId ||
      rawVendorData?.voucherTypeMaster?.MenuMasterSid ||
      rawVendorData?.MenuMasterSid
    );

    return Number.isFinite(sid) && sid > 0 ? sid : null;
  }

  private formatEmailDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB');
  }
}
