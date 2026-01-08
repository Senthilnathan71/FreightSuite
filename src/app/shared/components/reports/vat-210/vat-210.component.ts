import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-vat-210',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './vat-210.component.html',
  styles: ``
})
export class Vat210Component {

  currentCompany: any;
  currentBranch: any;
  selectedData: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('VAT Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('vat-report').pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get param(): any {
    return this.data?.param || {};
  }


  get localInputTax(): any[] {
    return this.fullData?.inputTax?.local || [];
  }

  get outSideInputTax(): any[] {
    return this.fullData?.inputTax?.overseas || [];
  }

  get localoutputTax(): any[] {
    return this.fullData?.outputTax?.local || [];
  }

  get overseasoutputTax(): any[] {
    return this.fullData?.outputTax?.overseas || [];
  }

  get summary() {
    return this.fullData?.summary || {};
  }


  get payment() {
    return this.fullData?.payment || {};
  }

  get bucketLabels(): any {
    return this.fullData?.bucketLabels || [];
  }



  get localSalesTaxableTotal(): number {
    return this.localInputTax?.reduce(
      (sum, x) => sum + (x.TaxableAmount || 0),
      0
    );
  }

  get localSalesTaxTotal(): number {
    return this.localInputTax?.reduce(
      (sum, x) => sum + (x.TaxAmount || 0),
      0
    );
  }



  get overseasSalesTaxableTotal(): number {
    return this.outSideInputTax?.reduce(
      (sum, x) => sum + (x.TaxableAmount || 0),
      0
    );
  }

  get overseasSalesTaxTotal(): number {
    return this.outSideInputTax?.reduce(
      (sum, x) => sum + (x.TaxAmount || 0),
      0
    );
  }



  get localPurchaseTaxableTotal(): number {
    return this.localoutputTax?.reduce(
      (sum, x) => sum + (x.TaxableAmount || 0),
      0
    );
  }

  get localPurchaseTaxTotal(): number {
    return this.localoutputTax?.reduce(
      (sum, x) => sum + (x.TaxAmount || 0),
      0
    );
  }


  get overseasPurchaseTaxableTotal(): number {
    return this.overseasoutputTax?.reduce(
      (sum, x) => sum + (x.TaxableAmount || 0),
      0
    );
  }

  get overseasPurchaseTaxTotal(): number {
    return this.overseasoutputTax?.reduce(
      (sum, x) => sum + (x.TaxAmount || 0),
      0
    );
  }


  get grandSalesTaxableTotal(): number {
    return (
      (this.localSalesTaxableTotal || 0) +
      (this.overseasSalesTaxableTotal || 0)
    );
  }

  get grandSalesTaxTotal(): number {
    return (
      (this.localSalesTaxTotal || 0) +
      (this.overseasSalesTaxTotal || 0)
    );
  }


  get grandPurchaseTaxableTotal(): number {
    return (
      (this.localPurchaseTaxableTotal || 0) +
      (this.overseasPurchaseTaxableTotal || 0)
    );
  }

  get grandPurchaseTaxTotal(): number {
    return (
      (this.localPurchaseTaxTotal || 0) +
      (this.overseasPurchaseTaxTotal || 0)
    );
  }


  get vatPayableAmountLocal(): number {
    return (
      (this.grandSalesTaxableTotal || 0) -
      (this.grandPurchaseTaxableTotal || 0)
    );
  }


  get vatPayableAmountOversea(): number {
    return (
      (this.grandSalesTaxTotal || 0) -
      (this.grandPurchaseTaxTotal || 0)
    );
  }

  getExcelData(): ComplexReportExportConfig {

    const tableHeaders: ExcelHeader[] = [
      { key: 'particular', label: 'Particulars' },
      { key: 'taxable', label: 'Taxable Amount' },
      { key: 'tax', label: 'Tax Amount' }
    ];

    const rows: ExcelRow[] = [];

    /* =======================
       VOUCHER SUMMARY
       ======================= */

    rows.push(this.sectionRow('VOUCHER SUMMARY'));

    rows.push(this.simpleRow('Total Vouchers', this.summary?.totalVouchers));
    rows.push(this.simpleRow('Included in Return', this.summary?.vouchersWithTaxLedger));
    rows.push(this.simpleRow('Not relevant for this Return', this.summary?.vouchersWithoutTaxLedger));
    rows.push(this.simpleRow('Uncertain Transactions', 0));
    rows.push(this.simpleRow('Information required for Audit File not provided', this.summary?.unpostedVoucher));

    /* =======================
       SALES – OUTWARDS
       ======================= */

    rows.push(this.sectionRow('SALES (OUTWARDS)'));
    rows.push(this.subSectionRow('Local Supplies'));

    this.localInputTax.forEach(item => {
      rows.push(this.amountRow(item));
    });

    rows.push(this.totalRow(
      'Total Local Supplies',
      this.localSalesTaxableTotal,
      this.localSalesTaxTotal
    ));

    rows.push(this.subSectionRow('Outside GCC Supplies'));

    this.outSideInputTax.forEach(item => {
      rows.push(this.amountRow(item));
    });

    rows.push(this.totalRow(
      'Total Outside GCC Supplies',
      this.overseasSalesTaxableTotal,
      this.overseasSalesTaxTotal
    ));

    rows.push(this.grandTotalRow(
      'GRAND TOTAL – SALES (OUTWARDS)',
      this.grandSalesTaxableTotal,
      this.grandSalesTaxTotal
    ));

    /* =======================
       PURCHASES – INWARDS
       ======================= */

    rows.push(this.sectionRow('PURCHASES (INWARDS)'));
    rows.push(this.subSectionRow('Local Purchases'));

    this.localoutputTax.forEach(item => {
      rows.push(this.amountRow(item));
    });

    rows.push(this.totalRow(
      'Total Local Purchases',
      this.localPurchaseTaxableTotal,
      this.localPurchaseTaxTotal
    ));

    rows.push(this.subSectionRow('Outside GCC Purchases'));

    this.overseasoutputTax.forEach(item => {
      rows.push(this.amountRow(item));
    });

    rows.push(this.totalRow(
      'Total Outside GCC Purchases',
      this.overseasPurchaseTaxableTotal,
      this.overseasPurchaseTaxTotal
    ));

    rows.push(this.grandTotalRow(
      'GRAND TOTAL – PURCHASES (INWARDS)',
      this.grandPurchaseTaxableTotal,
      this.grandPurchaseTaxTotal
    ));

    /* =======================
       PAYABLE
       ======================= */

    rows.push(this.sectionRow('PAYABLE'));
    rows.push({
      cells: [
        { value: 'VAT Payable', colspan: 2 },
        { value: this.vatPayableAmountOversea }
      ],
      style: 'total'
    });

    /* =======================
       PAYMENT DETAILS
       ======================= */

    rows.push(this.sectionRow('PAYMENT DETAILS'));

    rows.push(this.simpleRow('Tax payment (included)', this.payment?.totalPaymentVoucher));
    rows.push(this.simpleRow('Tax payments (not included/uncertain)', this.payment?.totalWithoutPayment));
    rows.push(this.simpleRow('Tax paid at customs', ''));
    rows.push(this.simpleRow('VAT Paid', ''));

    rows.push({
      cells: [
        { value: 'Balance VAT Payable', colspan: 2 },
        { value: this.vatPayableAmountLocal }
      ],
      style: 'grandTotal'
    });

    return {
      fileName: 'VAT-201-Report',
      sheetName: 'VAT201',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `VAT-201 Report`,
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.param?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.param?.ToDate) },
          { label: 'Branch', value: this.fullData?.BranchName }
        ]
      },
      tableHeaders,
      rows,
      columnWidths: [40, 20, 20]
    };
  }


  private sectionRow(title: string): ExcelRow {
    return {
      cells: [{ value: title, colspan: 3 }],
      style: 'section'
    };
  }

  private subSectionRow(title: string): ExcelRow {
    return {
      cells: [{ value: title, colspan: 3 }],

    };
  }

  private amountRow(item: any): ExcelRow {
    return {
      cells: [
        { value: item.LedgerName },
        { value: item.TaxableAmount || 0 },
        { value: item.TaxAmount || 0 }
      ],
      style: 'data'
    };
  }

  private totalRow(label: string, taxable: number, tax: number): ExcelRow {
    return {
      cells: [
        { value: label },
        { value: taxable || 0 },
        { value: tax || 0 }
      ],
      style: 'total'
    };
  }

  private grandTotalRow(label: string, taxable: number, tax: number): ExcelRow {
    return {
      cells: [
        { value: label },
        { value: taxable || 0 },
        { value: tax || 0 }
      ],
      style: 'grandTotal'
    };
  }

  private simpleRow(label: string, value: any): ExcelRow {
    return {
      cells: [
        { value: label, colspan: 2 },
        { value: value ?? 0 }
      ],
      style: 'data'
    };
  }


  private formatDate(date: any): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch {
      return String(date);
    }
  }


}
