import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';

@Component({
  selector: 'app-vat-payable',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './vat-payable.component.html',
  styles: ``
})
export class VatPayableComponent {

  currentCompany: any;
  currentBranch: any;
  selectedData: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  viewMode: 'receviable' | 'payable' = 'receviable';
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
    this.orientation = this.reportRegistryService.getReportConfig('vat-payable-report').pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get params(): any {
    return this.data?.params || {};
  }

  get bucketLabels(): any {
    return this.fullData?.bucketLabels || [];
  }

  getTotalTaxableAmt() {
    return this.fullData?.data?.inputTax?.reduce(
      (sum: number, item: any) => sum + (+item.taxableAmt || 0),
      0
    );
  }

  getTotalTaxAmt() {
    return this.fullData?.data?.inputTax?.reduce(
      (sum: number, item: any) => sum + (+item.taxAmt || 0),
      0
    );
  }

  getExcelData(): ComplexReportExportConfig {

    const tableHeaders: ExcelHeader[] = [
      { key: 'date', label: 'Date' },
      { key: 'particulars', label: 'Particulars' },
      { key: 'trn', label: 'TRN' },
      { key: 'vocuherType', label: 'Voucher Type' },
      { key: 'voucherNo', label: 'Voucher No.' },
      { key: 'supplierRef', label: 'Supplier Inv / Ref No / Date' },
      { key: 'taxableAmt', label: 'Taxable Amt' },
      { key: 'taxAmt', label: 'Tax Amt' }
    ];

    const rows: ExcelRow[] = [];

    // ✅ Same as HTML: inputTax
    const data = this.fullData?.data?.inputTax || [];

    data.forEach((item: any) => {

      const supplierRef =
        item?.documentNo && item?.documentDate
          ? `${item.documentNo} - ${this.formatDate(item.documentDate)}`
          : item?.documentNo || this.formatDate(item?.documentDate) || '';

      const cells: ExcelCell[] = [
        { value: this.formatDate(item?.voucherDate) },
        { value: item?.subledgerName || '' },
        { value: item?.panType || '' },
        { value: item?.vocuherType || '' },   // same as HTML
        { value: item?.voucherNo || '' },
        { value: supplierRef },
        { value: this.formatNumber(item?.taxableAmt) },
        { value: this.formatNumber(item?.taxAmt) }
      ];

      rows.push({ cells, style: 'data' });
    });

    /* TOTAL ROW */

    const totalTaxable = data.reduce(
      (sum: number, x: any) => sum + Number(x?.taxableAmt || 0),
      0
    );

    const totalTax = data.reduce(
      (sum: number, x: any) => sum + Number(x?.taxAmt || 0),
      0
    );

    rows.push({
      cells: [
        { value: 'TOTAL', colspan: 6 },
        { value: this.formatNumber(totalTaxable) },
        { value: this.formatNumber(totalTax) }
      ],
      style: 'total'
    });

    return {
      fileName: 'VAT-Payable-Report',
      sheetName: 'VAT Payable',

      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: 'VAT Payable Report',

        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.VoucherFromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.VoucherToDate) },
          {label:"",value:""}
        ]
      },

      tableHeaders,
      rows,
      columnWidths: [12, 22, 12, 16, 16, 30, 15, 15],
      notes: ['VAT Payable Report is generated based only on Invoice, Credit Note and Journal Voucher types.']
    };
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


  private formatDate(date: any): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch {
      return String(date);
    }
  }
}
