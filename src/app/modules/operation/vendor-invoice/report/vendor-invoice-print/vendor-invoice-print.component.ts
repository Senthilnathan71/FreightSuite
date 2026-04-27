import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { LogoService } from 'src/app/core/services/logo.service';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../../operation.service';

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
    private appSettingService: AppSettingsService
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

  downloadPDF(): void {
    try {
      const rawVendorData = this.sourceVendorInvoiceData || this.vendorInvoiceData;
      const logo = this.pdfMakeService.getReportLogo();

      const options = {
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
        options
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

  openEmailModal(): void {}
}
