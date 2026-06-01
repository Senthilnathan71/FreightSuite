import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { LogoService } from 'src/app/core/services/logo.service';

@Component({
  selector: 'app-invoice-commodity-print',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './invoice-commodity-print.component.html',
})
export class InvoiceCommodityPrintComponent {
  constructor(public logoService: LogoService) {}

  @Input() invoicePrintData: any;
  @Input() invoiceData: any;
  @Input() currentCompany: any;
  @Input() currentBranch: any;
  @Input() currentCompanyCountryCode = '';
  @Input() currentCompanyCurrency: any;
  @Input() userData: any;
  @Input() currentDate: any;
  @Input() isUAECompany = false;
  @Input() bankDetails: any[] = [];
  @Input() effectiveTermsAndConditions: any[] = [];
  @Input() printTaxDisplayConfig: any = {
    showCGST: false,
    showSGST: false,
    showUGST: false,
    showIGST: false,
    showVAT: false,
  };
  @Input() isSeaMode = true;
  @Input() isVATMode = false;

  isSeaDepartment(): boolean {
    return !!this.isSeaMode;
  }

  shouldShowForeignCurrencyColumn(): boolean {
    return this.invoiceData?.CurrencyCode !== this.currentCompanyCurrency?.code;
  }

  shouldShowIndiaGstAmountTotals(configOverride?: {
    showCGST: boolean;
    showSGST: boolean;
  }): boolean {
    const config = configOverride ?? this.printTaxDisplayConfig;
    return (
      (this.currentCompanyCountryCode || '').toLowerCase() === 'in' &&
      !!config?.showCGST &&
      !!config?.showSGST
    );
  }

  shouldShowVatAmountTotals(configOverride?: {
    showVAT: boolean;
  }): boolean {
    const config = configOverride ?? this.printTaxDisplayConfig;
    return (
      (this.currentCompanyCountryCode || '').toLowerCase() === 'ae' &&
      !!config?.showVAT
    );
  }

  shouldShowDetailedTaxAmountTotals(configOverride?: {
    showCGST: boolean;
    showSGST: boolean;
    showVAT: boolean;
  }): boolean {
    return (
      this.shouldShowIndiaGstAmountTotals(configOverride) ||
      this.shouldShowVatAmountTotals(configOverride)
    );
  }

  calculateBaseInvoicePrintColspan(): number {
    let base = 7; // S.No, Particulars, Curr, No. of Unit, Rate, ROE, Taxable Amt
    if ((this.currentCompanyCountryCode || '').toLowerCase() !== 'ae') {
      base += 1; // HSN/SAC
    }
    return base;
  }

  calculateTotalColspan(configOverride?: {
    showCGST: boolean;
    showSGST: boolean;
    showUGST: boolean;
    showIGST: boolean;
    showVAT: boolean;
  }): number {
    const config = configOverride ?? this.printTaxDisplayConfig;
    let total = this.calculateBaseInvoicePrintColspan();
    if (config?.showCGST) total += 2;
    if (config?.showSGST) total += 2;
    if (config?.showUGST) total += 2;
    if (config?.showIGST) total += 2;
    if (config?.showVAT) total += 2;
    return total;
  }

  getInvoicePrintAmountTotal(field: string): number {
    return (this.invoicePrintData?.voucherDetails || []).reduce(
      (sum: number, d: any) => {
        return sum + Number(d?.[field] || 0);
      },
      0,
    );
  }

  getBankCurrencyCode(bankDetail: any): string {
    return (
      bankDetail?.CurrencyCode ||
      bankDetail?.currencyCode ||
      bankDetail?.currencyMaster?.currencyCode ||
      this.invoiceData?.CurrencyCode ||
      ''
    );
  }

  get commodityRows(): any[] {
    const products =
      this.invoiceData?.houseJob?.Products ??
      this.invoiceData?.Products ??
      [];
    if (Array.isArray(products) && products.length > 0) {
      return products.map((p: any) => {
        const c = p?.masterJobContainer || {};
        const masterContainers = Array.isArray(this.invoiceData?.masterJob?.containers)
          ? this.invoiceData.masterJob.containers
          : [];
        const matchedMasterContainer = masterContainers.find(
          (item: any) =>
            Number(item?.MasterJobContainerSid) ===
            Number(c?.MasterJobContainerSid ?? p?.MasterJobContainerSid),
        );
        return {
          pkg: Number(p?.ExternlQty ?? c?.NoOfPkg ?? 0),
          pkgtype: p?.ExternaPkg || p?.PkgGroup || c?.PkgType || '',
          desc:
            c?.CommodityDescription ||
            p?.CommodityDescription ||
            '',
          grosswt: Number(c?.GrossWeight ?? p?.GrossWeight ?? 0),
          metric: this.isSeaDepartment()
            ? Number(c?.Volume ?? p?.Volume ?? 0)
            : Number(c?.ChargeableWeight ?? p?.ChargeableWeight ?? 0),
          containerNo: c?.ContainerNumber || '',
          containerType:
            matchedMasterContainer?.containerType?.ContainerName ||
            '',
        };
      });
    }

    const masterJob = this.invoiceData?.masterJob;
    if (masterJob) {
      return [
        {
          pkg: Number(masterJob?.NoOfPkg ?? 0),
          pkgtype: masterJob?.PkgGroup || '',
          desc: masterJob?.CommodityDescription || '',
          grosswt: Number(masterJob?.GrossWeight ?? 0),
          metric: this.isSeaDepartment()
            ? Number(masterJob?.Volume ?? 0)
            : Number(masterJob?.ChargeableWeight ?? 0),
        },
      ];
    }

    return [
      {
        pkg: Number(this.invoicePrintData?.pkg ?? 0),
        pkgtype: this.invoicePrintData?.pkgType ?? '',
        desc: this.invoicePrintData?.desc ?? '',
        grosswt: Number(this.invoicePrintData?.grosswt ?? 0),
        metric: this.isSeaDepartment()
          ? Number(this.invoicePrintData?.cbm ?? 0)
          : Number(this.invoicePrintData?.ChargeableWeight ?? 0),
          containerType:
            this.invoicePrintData?.ContainerType || '',
      },
    ];
  }

  get showHouseJobContainerColumns(): boolean {
    const products =
      this.invoiceData?.houseJob?.Products ??
      this.invoiceData?.Products ??
      [];
    return Array.isArray(products) && products.length > 0;
  }

  get showCommodityDescColumn(): boolean {
    return !this.showHouseJobContainerColumns;
  }
}
