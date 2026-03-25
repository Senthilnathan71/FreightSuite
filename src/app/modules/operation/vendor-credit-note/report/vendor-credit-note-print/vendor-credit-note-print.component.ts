import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { LogoService } from 'src/app/core/services/logo.service';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';

@Component({
  selector: 'app-vendor-credit-note-print',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
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
  @Input() currentDate: Date = new Date();

  constructor(
    public activeModal: NgbActiveModal,
    public logoService: LogoService,
    private pdfMakeService: PdfMakeService
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
    const details = this.vendorCreditNoteData?.voucherDetails || [];
    const hasCGST = details.some((x: any) => Number(x?.cgstAmt || 0) > 0 || Number(x?.cgstRate || 0) > 0);
    const hasSGST = details.some((x: any) => Number(x?.sgstAmt || 0) > 0 || Number(x?.sgstRate || 0) > 0);
    const hasIGST = details.some((x: any) => Number(x?.igstAmt || 0) > 0 || Number(x?.igstRate || 0) > 0);
    const hasVAT = details.some((x: any) => Number(x?.vatAmt || 0) > 0 || Number(x?.vatRate || 0) > 0);

    if (this.currentCompanyCountryCode?.toLowerCase() === 'in') {
      return {
        showCGST: hasCGST,
        showSGST: hasSGST,
        showIGST: hasIGST,
        showVAT: false
      };
    }

    return {
      showCGST: false,
      showSGST: false,
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
    if (cfg.showIGST) baseColumns += 2;
    if (cfg.showVAT) baseColumns += 2;

    return baseColumns;
  }

  downloadPDF(): void {
    try {
      const rawVendorData = this.sourceVendorCreditNoteData || this.vendorCreditNoteData;
      const logo = this.pdfMakeService.getReportLogo();

      const options = {
        taxDisplayConfig: this.getTaxDisplayConfig(),
        bankDetails: this.vendorCreditNoteData?.BankDetails || this.bankDetails || [],
        terms: this.TandCList || [],
        amountInWords: this.vendorCreditNoteData?.AmountInWords || '',
        localCurrency: this.currentCompanyCurrency?.code || '',
        invoiceTitle: this.vendorCreditNoteData?.invoiceTitle || 'Vendor Credit Note',
        isSeaMode: this.isSeaDepartment(),
        isVATMode: this.isVATMode,
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
      };

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
        options
      );
    } catch (error) {
      console.error('Error generating vendor credit note PDF:', error);
    }
  }

  openEmailModal(): void {}
}
