import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { LogoService } from 'src/app/core/services/logo.service';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../../operation.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';

@Component({
  selector: 'app-vendor-invoice-print',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './vendor-invoice-print.component.html',
  styles: ``
})
export class VendorInvoicePrintComponent {
  @Input() vendorInvoiceData: any;
  @Input() sourceVendorInvoiceData: any;
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
    public logoService: LogoService,
    private pdfMakeService: PdfMakeService,
    public mps: MenuPermissionService,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService
  ) {}

  // Template compatibility alias
  get invoiceData(): any {
    return this.sourceVendorInvoiceData || this.vendorInvoiceData;
  }

  get effectiveTermsAndConditions(): any[] {
    if (Array.isArray(this.TandCList) && this.TandCList.length > 0) {
      return this.TandCList;
    }

    const printTerms = this.vendorInvoiceData?.TermsAndConditions;
    if (Array.isArray(printTerms) && printTerms.length > 0) {
      return printTerms;
    }

    const sourceTerms = this.sourceVendorInvoiceData?.TermsAndConditions;
    if (Array.isArray(sourceTerms) && sourceTerms.length > 0) {
      return sourceTerms;
    }

    return [];
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

    const details = this.vendorInvoiceData?.voucherDetails || [];
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
      this.vendorInvoiceData?.CurrencyCode ??
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
      this.vendorInvoiceData?.CurrencyMasterSid ??
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

  private getRawVendorData(): any {
    return this.sourceVendorInvoiceData || this.vendorInvoiceData;
  }

  private getVendorInvoicePdfOptions(): any {
    return {
      taxDisplayConfig: this.getTaxDisplayConfig(),
      bankDetails: this.vendorInvoiceData?.BankDetails || this.bankDetails || [],
      terms: this.effectiveTermsAndConditions,
      amountInWords: this.vendorInvoiceData?.AmountInWords || '',
      localCurrency: this.currentCompanyCurrency?.code || '',
      invoiceTitle: this.vendorInvoiceData?.invoiceTitle || 'Vendor Invoice',
      isSeaMode: this.isSeaDepartment(),
      isVATMode: this.getTaxDisplayConfig().showVAT,
      companyVatNo:
        this.currentBranch?.taxRegistrationNo || this.currentCompany?.GST_VAT || '',
      shipmentDetails: {
        shipper: this.vendorInvoiceData?.ShipperName,
        consignee: this.vendorInvoiceData?.ConsigneeName,
        vesselName: this.vendorInvoiceData?.Vessel,
        voyageNo: this.vendorInvoiceData?.VoyageNo,
        shipperRefNo: this.vendorInvoiceData?.DocumentNumber,
        loadingPort: this.vendorInvoiceData?.POL,
        finalDestination: this.vendorInvoiceData?.FPD,
        etd: this.vendorInvoiceData?.ETD,
        eta: this.vendorInvoiceData?.ETA,
        invoiceDueDate: this.vendorInvoiceData?.InvoiceDueDate,
        BillDate: this.vendorInvoiceData?.DocumentDate,
      },
      cargoDetails: {
        packages: this.vendorInvoiceData?.pkg,
        commodityDesc: this.vendorInvoiceData?.desc,
        grossWeight: this.vendorInvoiceData?.grosswt,
        chargeableWeight: this.vendorInvoiceData?.ChargeableWeight,
        cbm: this.vendorInvoiceData?.cbm,
      },
      vendorInvoiceData: this.vendorInvoiceData,
    };
  }

  downloadPDF(): void {
    try {
      const rawVendorData = this.sourceVendorInvoiceData || this.vendorInvoiceData;
      const logo = this.pdfMakeService.getReportLogo();

      this.pdfMakeService.generateVendorInvoiceFromApi(
        rawVendorData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        {
          hssacMaster: [],
          currencyMaster: [],
        },
        this.getVendorInvoicePdfOptions()
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
          PDF: 'Vendor Invoice PDF Downloaded',
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('Error generating vendor invoice PDF:', error);
    }
  }

  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const logo = this.pdfMakeService.getReportLogo();
      return await this.pdfMakeService.generateVendorInvoiceBlobFromApi(
        this.getRawVendorData(),
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        {
          hssacMaster: [],
          currencyMaster: [],
        },
        this.getVendorInvoicePdfOptions()
      );
    } catch (error) {
      console.error('Error generating vendor invoice PDF blob:', error);
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

      const rawVendorData = this.getRawVendorData();
      const documentName = 'Vendor Invoice';
      const documentNo = rawVendorData?.VoucherNumber || this.vendorInvoiceData?.VoucherNumber || this.vendorInvoiceData?.DocumentNumber || '';
      const documentDate = this.formatEmailDate(rawVendorData?.VoucherDate || this.vendorInvoiceData?.DocumentDate);
      const toEmail = await this.emailTriggerService.resolveCustomerBranchEmailsByMenu({
        customerBranchSid: this.getVendorBranchSidForEmail(),
        customerMasterSid: this.getVendorMasterSidForEmail(),
        menuMasterSid: this.getCurrentMenuMasterSidForEmail()
      });

      if (toEmail.length === 0) {
        this.appSettingService.showError('No email found in customer branch email.');
        return;
      }

      const emailContent = this.emailTriggerService.buildOperationEmailContent({
        documentName,
        documentNoLabel: 'Vendor Invoice No.',
        documentNo,
        documentDate,
        pol: this.vendorInvoiceData?.POL || '',
        pod: this.vendorInvoiceData?.POD || '',
        fpd: this.vendorInvoiceData?.FPD || '',
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const file = new File([blob], `Vendor_Invoice_${documentNo || 'Report'}.pdf`, { type: 'application/pdf' });
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: toEmail,
        EmailCC: this.userData?.userEmail ? [this.userData.userEmail] : [],
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'Vendor Invoice No',
          menuName: documentName,
          documentNo,
          date: documentDate,
          pol: this.vendorInvoiceData?.POL || '',
          pod: this.vendorInvoiceData?.POD || '',
          fpd: this.vendorInvoiceData?.FPD || ''
        },
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('Vendor Invoice email error:', error);
      this.appSettingService.showError('Error preparing email');
    }
  }

  private createEmailAuditLog(documentName: string): void {
    const rawVendorData = this.getRawVendorData();
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
    const rawVendorData = this.getRawVendorData();
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
    const rawVendorData = this.getRawVendorData();
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
    const rawVendorData = this.getRawVendorData();
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
