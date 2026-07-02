import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';

@Component({
  selector: 'app-vat-210',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent, PrintFooterComponent],
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

  // ---- Annexures (detail lists; do not affect the main report totals) ----
  get annexure(): any {
    return this.fullData?.annexure || {};
  }

  // Filter one annexure list by Direction (Input/Output) and Locality (Local/Overseas).
  private filterAnnexure(
    key: 'reclassifiedZeroRated' | 'taxEqualsTaxable',
    direction: 'Input' | 'Output',
    locality: 'Local' | 'Overseas'
  ): any[] {
    return (this.annexure?.[key] || []).filter(
      (x: any) => x?.Direction === direction && x?.Locality === locality
    );
  }

  // Annexure – rows where Taxable Amount = Tax Amount (JV / Payment on the VAT ledger),
  // split by Sales (Output) / Purchases (Input) and Local / Outside GCC.
  get taxEqualSalesLocal(): any[] {
    return this.filterAnnexure('taxEqualsTaxable', 'Output', 'Local');
  }

  get taxEqualSalesOverseas(): any[] {
    return this.filterAnnexure('taxEqualsTaxable', 'Output', 'Overseas');
  }

  get taxEqualPurchaseLocal(): any[] {
    return this.filterAnnexure('taxEqualsTaxable', 'Input', 'Local');
  }

  get taxEqualPurchaseOverseas(): any[] {
    return this.filterAnnexure('taxEqualsTaxable', 'Input', 'Overseas');
  }

  // Same split for the reclassified (VAT 5% shown under VAT 0%) annexure.
  get reclassifiedSalesLocal(): any[] {
    return this.filterAnnexure('reclassifiedZeroRated', 'Output', 'Local');
  }

  get reclassifiedSalesOverseas(): any[] {
    return this.filterAnnexure('reclassifiedZeroRated', 'Output', 'Overseas');
  }

  get reclassifiedPurchaseLocal(): any[] {
    return this.filterAnnexure('reclassifiedZeroRated', 'Input', 'Local');
  }

  get reclassifiedPurchaseOverseas(): any[] {
    return this.filterAnnexure('reclassifiedZeroRated', 'Input', 'Overseas');
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
    return this.localoutputTax?.reduce(
      (sum, x) => sum + (x.TaxableAmount || 0),
      0
    );
  }

  get localSalesTaxTotal(): number {
    return this.localoutputTax?.reduce(
      (sum, x) => sum + (x.TaxAmount || 0),
      0
    );
  }



  get overseasSalesTaxableTotal(): number {
    return this.overseasoutputTax?.reduce(
      (sum, x) => sum + (x.TaxableAmount || 0),
      0
    );
  }

  get overseasSalesTaxTotal(): number {
    return this.overseasoutputTax?.reduce(
      (sum, x) => sum + (x.TaxAmount || 0),
      0
    );
  }



  get localPurchaseTaxableTotal(): number {
    return this.localInputTax?.reduce(
      (sum, x) => sum + (x.TaxableAmount || 0),
      0
    );
  }

  get localPurchaseTaxTotal(): number {
    return this.localInputTax?.reduce(
      (sum, x) => sum + (x.TaxAmount || 0),
      0
    );
  }


  get overseasPurchaseTaxableTotal(): number {
    return this.outSideInputTax?.reduce(
      (sum, x) => sum + (x.TaxableAmount || 0),
      0
    );
  }

  get overseasPurchaseTaxTotal(): number {
    return this.outSideInputTax?.reduce(
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

  /* ======================================================
     ✅ VOUCHER SUMMARY (2 Columns Like HTML)
     ====================================================== */

  rows.push(this.twoColumnHeaderRow('Particulars', 'Voucher Count'));

  rows.push({
    cells: [
      { value: 'Total Vouchers', colspan: 2 },
      { value: this.summary?.totalVouchers || 0 }
    ]
  });

  rows.push({
    cells: [
      { value: 'Included in Return', colspan: 2 },
      { value: this.summary?.vouchersWithTaxLedger || 0 }
    ]
  });

  rows.push({
    cells: [
      { value: 'Not Relevant for this Return', colspan: 2 },
      { value: this.summary?.vouchersWithoutTaxLedger || 0 }
    ]
  });

  rows.push({
    cells: [
      { value: 'Uncertain Transactions (Corrections needed)', colspan: 2 },
      { value: 0 }
    ]
  });

  rows.push({
    cells: [
      { value: 'Information required for generating Audit File not provided', colspan: 2 },
      { value: this.summary?.unpostedVoucher || 0 }
    ]
  });

  /* ======================================================
     ✅ SALES (OUTWARDS)
     ====================================================== */

  rows.push(this.blankRow());
  rows.push(this.threeColumnHeaderRow('Particulars', 'Taxable Amount', 'Tax Amount'));
  rows.push(this.sectionRow('Sales (Outwards) :'));

  // Local Supplies
  rows.push(this.subSectionRow('Local Supplies'));

  this.localoutputTax.forEach(item => {
    rows.push({
      cells: [
        { value: item.LedgerName },
        { value: this.formatNumber(item.TaxableAmount) },
        { value: this.formatNumber(item.TaxAmount) }
      ]
    });
  });

  rows.push(this.totalRow(
    'Total Local Supplies',
    this.localSalesTaxableTotal,
    this.localSalesTaxTotal
  ));

  // Outside GCC Supplies
  rows.push(this.subSectionRow('Outside GCC Supplies'));

  this.overseasoutputTax.forEach(item => {
    rows.push({
      cells: [
        { value: item.LedgerName },
        { value: this.formatNumber(item.TaxableAmount) }, 
        { value: this.formatNumber(item.TaxAmount) }
      ]
    });
  });

  rows.push(this.totalRow(
    'Total Outside GCC Supplies',
    this.overseasSalesTaxableTotal,
    this.overseasSalesTaxTotal
  ));

  // Grand Total Sales
  rows.push(this.grandTotalRow(
    'GRAND TOTAL – SALES (OUTWARDS)',
    this.grandSalesTaxableTotal,
    this.grandSalesTaxTotal
  ));

  /* ======================================================
     ✅ PURCHASES (INWARDS)
     ====================================================== */

  rows.push(this.blankRow());
  rows.push(this.sectionRow('Purchases (Inwards) :'));

  // Local Purchases
  rows.push(this.subSectionRow('Local Purchases'));

  this.localInputTax.forEach(item => {
    rows.push({
      cells: [
        { value: item.LedgerName },
        { value: this.formatNumber(item.TaxableAmount) },
        { value: this.formatNumber(item.TaxAmount) }
      ]
    });
  });

  rows.push(this.totalRow(
    'Total Local Purchases',
    this.localPurchaseTaxableTotal,
    this.localPurchaseTaxTotal
  ));

  // Outside GCC Purchases
  rows.push(this.subSectionRow('Outside GCC Purchases'));

  this.outSideInputTax.forEach(item => {
    rows.push({
      cells: [
        { value: item.LedgerName },
        { value: this.formatNumber(item.TaxableAmount) },
        { value: this.formatNumber(item.TaxAmount) }
      ]
    });
  });

  rows.push(this.totalRow(
    'Total Outside GCC Purchases',
    this.overseasPurchaseTaxableTotal,
    this.overseasPurchaseTaxTotal
  ));

  // Grand Total Purchases
  rows.push(this.grandTotalRow(
    'GRAND TOTAL – PURCHASES (INWARDS)',
    this.grandPurchaseTaxableTotal,
    this.grandPurchaseTaxTotal
  ));


  rows.push({
    cells: [
      { value: 'PAYABLE', colspan: 2 },
      { value: this.formatNumber(this.vatPayableAmountOversea) }
    ],
    style: 'grandTotal'
  });

  rows.push(this.blankRow());
  rows.push(this.paymentHeaderRow(
    'Payment Details',
    this.param?.FromDate && this.param?.ToDate
      ? `${this.formatDate(this.param.FromDate)} - ${this.formatDate(this.param.ToDate)}`
      : ''
  ));

  rows.push({
    cells: [
      { value: 'Tax payment (included)', colspan: 2 },
      { value: this.payment?.totalPaymentVoucher || 0 }
    ]
  });

  rows.push({
    cells: [
      { value: 'Tax payments (not included/uncertain)', colspan: 2 },
      { value: this.payment?.totalWithoutPayment || 0 }
    ]
  });

  rows.push({
    cells: [
      { value: 'Tax paid at customs', colspan: 2 },
      { value: '' }
    ]
  });

  rows.push({
    cells: [
      { value: 'VAT Paid', colspan: 2 },
      { value: '' }
    ]
  });

  rows.push({
    cells: [
      { value: 'Balance VAT Payable' },
      { value: this.formatNumber(this.vatPayableAmountLocal), alignment: { horizontal: 'right' } },
      { value: this.formatNumber(this.vatPayableAmountOversea) , alignment: { horizontal: 'right' } }
    ],
    style: 'grandTotal'
  });

  /* ======================================================
   ✅ ANNEXURE
   ====================================================== */

const addAnnexure = (title: string, data: any[]) => {
  if (!data?.length) return;

  rows.push(this.blankRow());

  rows.push({
    cells: [
      { value: title, colspan: 6 }
    ],
    style: 'section'
  });

  rows.push({
    cells: [
      { value: 'Date' },
      { value: 'Voucher No' },
      { value: 'Ledger' },
      { value: 'Party Name' },
      { value: 'Taxable Amount' },
      { value: 'Tax Amount' }
    ],
    style: 'header'
  });

  data.forEach(item => {
    rows.push({
      cells: [
        { value: this.formatDate(item.VoucherDate) },
        { value: item.VoucherNumber || '' },
        { value: item.LedgerName || '' },
        { value: item.PartyName || '' },
        { value: this.formatNumber(item.TaxableAmount) },
        { value: this.formatNumber(item.TaxAmount) }
      ]
    });
  });
};

if (
  this.taxEqualSalesLocal.length ||
  this.taxEqualSalesOverseas.length ||
  this.taxEqualPurchaseLocal.length ||
  this.taxEqualPurchaseOverseas.length
) {

  rows.push(this.blankRow());

  rows.push({
    cells: [
      { value: 'ANNEXURE', colspan: 6 }
    ],
    style: 'grandTotal'
  });

  addAnnexure(
    'Sales (Outwards) - Local Supplies',
    this.taxEqualSalesLocal
  );

  addAnnexure(
    'Sales (Outwards) - Outside GCC Supplies',
    this.taxEqualSalesOverseas
  );

  addAnnexure(
    'Purchases (Inwards) - Local Purchases',
    this.taxEqualPurchaseLocal
  );

  addAnnexure(
    'Purchases (Inwards) - Outside GCC Purchases',
    this.taxEqualPurchaseOverseas
  );
}

  return {
    fileName: 'VAT-201-Report',
    sheetName: 'VAT201',

    reportHeader: {
      companyName: this.currentCompany?.companyName || '',
      reportTitle: 'VAT-201 Report',
      additionalInfo: [
        { label: 'From Date', value: this.formatDate(this.param?.FromDate) },
        { label: 'To Date', value: this.formatDate(this.param?.ToDate) },
        { label: 'Branch', value: this.fullData?.BranchName }
      ]
    },

    tableHeaders,
    includeTableHeaders: false,
    rows,

    columnWidths: [45, 20, 20],
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
      style: 'data'
    };
  }

  private twoColumnHeaderRow(col1: string, col2: string): ExcelRow {
    return {
      cells: [
        { value: col1, colspan: 2, alignment: { horizontal: 'left' } },
        { value: col2, alignment: { horizontal: 'center' } }
      ],
      style: 'header'
    };
  }

  private threeColumnHeaderRow(col1: string, col2: string, col3: string): ExcelRow {
    return {
      cells: [
        { value: col1, alignment: { horizontal: 'left' } },
        { value: col2, alignment: { horizontal: 'center' } },
        { value: col3, alignment: { horizontal: 'center' } }
      ],
      style: 'header'
    };
  }

  private paymentHeaderRow(label: string, value: string): ExcelRow {
    return {
      cells: [
        { value: label, colspan: 2, alignment: { horizontal: 'left' } },
        { value, alignment: { horizontal: 'right' } }
      ],
      style: 'header'
    };
  }

  private blankRow(): ExcelRow {
    return {
      cells: [{ value: '', colspan: 3 }],
      style: 'data'
    };
  }

  private amountRow(item: any): ExcelRow {
    return {
      cells: [
        { value: item.LedgerName },
        { value: this.formatNumber(item.TaxableAmount || 0) },
        { value: this.formatNumber(item.TaxAmount || 0) } 
      ],
      style: 'data'
    };
  }

  private totalRow(label: string, taxable: number, tax: number): ExcelRow {
    return {
      cells: [
        { value: label },
        { value: this.formatNumber(taxable || 0) },
        { value: this.formatNumber(tax || 0) }  
      ],
      style: 'total'
    };
  }

  private grandTotalRow(label: string, taxable: number, tax: number): ExcelRow {
    return {
      cells: [
        { value: label },
        { value: this.formatNumber(taxable || 0) },
        { value: this.formatNumber(tax || 0) }  
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

private formatNumber(value: any): string {
  if (value === null || value === undefined) return '';

  const num = Number(value);
  if (isNaN(num)) return '';

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

}

