import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { toNumber } from 'src/app/common/helper';

interface TaxDisplayConfig {
  showCGST: boolean;
  showSGST: boolean;
  showUGST: boolean;
  showIGST: boolean;
  showVAT: boolean;
}

@Component({
  selector: 'app-invoice-without-tax',
  standalone: true,
  imports: [CommonModule, CustomDatePipe, PrintHeaderComponent],
  templateUrl: './invoice-without-tax.component.html',
  styles: ``,
})
export class InvoiceWithoutTaxComponent {
  
  @Input() invoicePrintData: any;
  @Input() invoiceData: any;
  @Input() currentCompany: any;
  @Input() currentCompanyCurrency: any;
  @Input() currentCompanyCountryCode: string = '';
  @Input() currencyList: any[] = [];
  @Input() bankDetails: any[] = [];
  @Input() effectiveTermsAndConditions: any[] = [];
  @Input() userData: any = {};
  @Input() isVATMode = false;
  @Input() printTaxDisplayConfig: TaxDisplayConfig = {
    showCGST: false,
    showSGST: false,
    showUGST: false,
    showIGST: false,
    showVAT: false,
  };
  @Input() currentDate: Date = new Date();
  @Input() departmentList: any[] = [];
  @Input() salesmanName: string | null = null;

  constructor(private currencyFormatter: CurrencyFormatService) {}

  get isUAECompany(): boolean {
    return this.currentCompanyCountryCode?.toLowerCase() === 'ae';
  }

  isSeaDepartment(): boolean {
    const deptSid = this.invoiceData?.masterJob?.DepartmentMasterSid || this.invoiceData?.BookingHeader?.DepartmentMasterSid;

    if (!deptSid || !Array.isArray(this.departmentList) || this.departmentList.length === 0) {
      return false;
    }

    const dept = this.departmentList.find(
      (d) => Number(d.DepartmentMasterSid) === Number(deptSid)
    );

    if (!dept?.departmentType) return false;

    return dept.departmentType.toUpperCase().includes('SEA');
  }

  shouldShowForeignCurrencyColumn(): boolean {
    return this.invoiceData?.CurrencyCode !== this.currentCompanyCurrency?.code;
  }

  getBankCurrencyCode(bankDetail: any): string {
    const bankCurrencySid = Number(bankDetail?.CurrencyMasterSid || bankDetail?.currencyMasterSid || 0);
    const bankCurrency = bankCurrencySid
      ? this.currencyList?.find((currency: any) => Number(currency?.CurrencyMasterSid) === bankCurrencySid)
      : null;

    return bankDetail?.CurrencyCode ||
      bankDetail?.currencyCode ||
      bankDetail?.currencyMaster?.currencyCode ||
      bankCurrency?.currencyCode ||
      this.invoiceData?.CurrencyCode ||
      '';
  }

  public formatCurrencyDisplayAmount(amount: number | string, CurrencyMasterSid?: number): string {
    const currency = this.currencyList.find(
      (currency) => Number(currency.CurrencyMasterSid) === Number(CurrencyMasterSid)
    );

    return this.currencyFormatter.formatMaskedAmount({
      value: toNumber(amount),
      currencyCode:
        currency?.currencyCode ||
        currency?.CurrencyCode ||
        this.invoiceData?.CurrencyCode ||
        '',
    });
  }

  public getFormattedAndPaddedAmount(amount: number | string, CurrencyMasterSid: number): string {
    return this.formatCurrencyDisplayAmount(amount, CurrencyMasterSid);
  }

  public formatInvoiceCurrencyAmount(amount: number | string): string {
    return this.formatCurrencyDisplayAmount(amount, this.invoiceData?.CurrencyMasterSid);
  }

  public formatCompanyCurrencyAmount(amount: number | string): string {
    return this.formatCurrencyDisplayAmount(amount, this.currentCompany?.CurrencyMasterSid);
  }

  shouldShowIndiaGstAmountTotals(configOverride?: { showCGST: boolean; showSGST: boolean }): boolean {
    const config = configOverride ?? this.printTaxDisplayConfig;
    return this.currentCompanyCountryCode?.toLowerCase() === 'in' && !!config?.showCGST && !!config?.showSGST;
  }

  shouldShowVatAmountTotals(configOverride?: { showVAT: boolean }): boolean {
    const config = configOverride ?? this.printTaxDisplayConfig;
    return this.currentCompanyCountryCode?.toLowerCase() === 'ae' && !!config?.showVAT;
  }

  shouldShowDetailedTaxAmountTotals(configOverride?: {
    showCGST: boolean;
    showSGST: boolean;
    showVAT: boolean;
  }): boolean {
    return this.shouldShowIndiaGstAmountTotals(configOverride) || this.shouldShowVatAmountTotals(configOverride);
  }

  getInvoicePrintAmountTotal(fieldName: 'cgstAmt' | 'sgstAmt' | 'vatAmt' | 'TaxableAmount' | 'LocalAmount'): string {
    const total = (this.invoicePrintData?.voucherDetails || []).reduce((sum: number, detail: any) => {
      return sum + toNumber(detail?.[fieldName]);
    }, 0);

    return this.getFormattedAndPaddedAmount(total, this.currentCompany?.CurrencyMasterSid);
  }

  getInvoicePrintVatSummary(): Array<{ vatRate: string; vatRateDisplay: string; taxableAmount: number; vatAmt: number }> {
    const summary = new Map<string, { vatRate: string; vatRateDisplay: string; taxableAmount: number; vatAmt: number }>();

    for (const detail of this.invoicePrintData?.voucherDetails || []) {
      const vatRate = detail?.vatRate ?? '0.000';
      // UAE: group by TaxGroup name (VAT 5% / VAT 0% / Exempt / Out of Scope);
      // other countries keep the tax-percentage grouping.
      const groupByTaxGroup = this.isUAECompany;
      const key = groupByTaxGroup ? (detail?.taxGroupName || 'Unmapped') : vatRate;
      const display = groupByTaxGroup ? (detail?.taxGroupName || 'Unmapped') : `${toNumber(vatRate)}%`;
      const summaryRow = summary.get(key) || {
        vatRate,
        vatRateDisplay: display,
        taxableAmount: 0,
        vatAmt: 0,
      };

      summaryRow.taxableAmount += toNumber(detail?.TaxableAmount);
      summaryRow.vatAmt += toNumber(detail?.vatAmt);
      summary.set(key, summaryRow);
    }

    return Array.from(summary.values());
  }

  calculateBaseInvoicePrintColspan(): number {
    let baseColumns = 6; // S.No, Particulars, Curr, No. of Unit, Rate, ROE, Taxable Amt

    if (this.currentCompanyCountryCode?.toLowerCase() !== 'ae') {
      baseColumns += 1; // HSN/SAC
    }

    return baseColumns;
  }

  calculateTotalColspan(configOverride?: TaxDisplayConfig): number {
    const config = configOverride ?? this.printTaxDisplayConfig;
    let baseColumns = 7; // S.No, Particulars, Curr, No of Unit, Rate, ROE, Taxable Value

    // Add HSN/SAC column if not UAE
    if (this.currentCompanyCountryCode?.toLowerCase() !== 'ae') {
      baseColumns += 1;
    }

    // Add tax columns based on what's visible
    if (config.showCGST) baseColumns += 2; // CGST % + CGST Amt
    if (config.showSGST) baseColumns += 2; // SGST % + SGST Amt
    if (config.showUGST) baseColumns += 2; // UGST % + UGST Amt
    if (config.showIGST) baseColumns += 2; // IGST % + IGST Amt
    if (config.showVAT) baseColumns += 2; // VAT % + VAT Amt

    return baseColumns;
  }
}
