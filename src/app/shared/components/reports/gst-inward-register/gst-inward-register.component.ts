import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import {
  ComplexReportExportConfig,
  ExcelCell,
  ExcelHeader,
  ExcelRow,
} from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';

@Component({
  selector: 'app-gst-inward-register',
  standalone: true,
  imports: [
    CustomDatePipe,
    CommonModule,
    PrintHeaderComponent,
    PrintFooterComponent,
  ],
  templateUrl: './gst-inward-register.component.html',
  styles: ``,
})
export class GSTInwardRegisterComponent {
  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService,
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    this.orientation =
      this.reportRegistryService.getReportConfig(
        'GST-inward',
      ).pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get params(): any {
    return this.data?.data?.params || this.data?.params || {};
  }

  get tableData(): any[] {
    return this.data?.data?.tableData || this.data?.tableData || [];
  }

  get totalTxnValue(): number {
    return this.getTotal('TxnValue');
  }

  get totalTaxableValue(): number {
    return this.getTotal('TaxableValue');
  }

  get totalTaxCalculatedOn(): number {
    return this.getTotal('TaxCalculatedOn');
  }

  get totalIGST(): number {
    return this.getTotal('IGST');
  }

  get totalCGST(): number {
    return this.getTotal('CGST');
  }

  get totalSGST(): number {
    return this.getTotal('SGST');
  }

  get totalIGSTAmountRCM(): number {
    return this.getTotal('IGSTAmountRCM');
  }

  get totalCGSTAmountRCM(): number {
    return this.getTotal('CGSTAmountRCM');
  }

  get totalSGSTAmountRCM(): number {
    return this.getTotal('SGSTAmountRCM');
  }

  get totalGST(): number {
    return this.getTotal('TotalGST');
  }

  private getTotal(field: string): number {
    return this.tableData.reduce(
      (sum, item) => sum + Number(item?.[field] || 0),
      0,
    );
  }

  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'Location', label: 'Location' },
      { key: 'TransactionDate', label: 'Transaction Date' },
      { key: 'TransactionNo', label: 'Transaction No' },
      { key: 'PartyRefNo', label: 'Party Ref. No.' },
      { key: 'PartyRefDate', label: 'Party Ref. Date' },
      { key: 'TransactionType', label: 'Transaction Type' },
      { key: 'Organization', label: 'Organization' },
      { key: 'GSTIN', label: 'GSTIN' },
      { key: 'TxnValue', label: 'Txn Value' },
      { key: 'TaxableValue', label: 'Taxable Value' },
      { key: 'TaxCalculatedOn', label: 'Tax Calculated On' },
      { key: 'IGST', label: 'IGST' },
      { key: 'CGST', label: 'CGST' },
      { key: 'SGST', label: 'SGST' },
      { key: 'IGSTAmountRCM', label: 'IGST Amount (RCM)' },
      { key: 'CGSTAmountRCM', label: 'CGST Amount (RCM)' },
      { key: 'SGSTAmountRCM', label: 'SGST Amount (RCM)' },
      { key: 'TotalGST', label: 'Total GST' },
      { key: 'PlaceOfSupply', label: 'Place of Supply' },
      { key: 'IRNNo', label: 'IRN no.' },
    ];

    const rows: ExcelRow[] = this.tableData.map((item) => ({
      cells: [
        { value: item?.Location || '' },
        { value: this.formatDate(item?.TransactionDate) },
        { value: item?.TransactionNo || '' },
        { value: item?.PartyRefNo || '' },
        { value: this.formatDate(item?.PartyRefDate) },
        { value: item?.TransactionType || '' },
        { value: item?.Organization || '' },
        { value: item?.GSTIN || '' },
        { value: this.formatNumber(item?.TxnValue), alignment: { horizontal: 'right' } },
        { value: this.formatNumber(item?.TaxableValue), alignment: { horizontal: 'right' } },
        { value: this.formatNumber(item?.TaxCalculatedOn), alignment: { horizontal: 'right' } },
        { value: this.formatNumber(item?.IGST), alignment: { horizontal: 'right' } },
        { value: this.formatNumber(item?.CGST), alignment: { horizontal: 'right' } },
        { value: this.formatNumber(item?.SGST), alignment: { horizontal: 'right' } },
        { value: this.formatNumber(item?.IGSTAmountRCM), alignment: { horizontal: 'right' } },
        { value: this.formatNumber(item?.CGSTAmountRCM), alignment: { horizontal: 'right' } },
        { value: this.formatNumber(item?.SGSTAmountRCM), alignment: { horizontal: 'right' } },
        { value: this.formatNumber(item?.TotalGST), alignment: { horizontal: 'right' } },
        { value: item?.PlaceOfSupply || '' },
        { value: item?.IRNNo || '' },
      ],
      style: 'data',
    }));

    if (this.tableData.length > 0) {
      rows.push({
        cells: [
          { value: 'TOTAL', colspan: 8, alignment: { horizontal: 'right' } },
          { value: this.formatNumber(this.totalTxnValue), alignment: { horizontal: 'right' } },
          { value: this.formatNumber(this.totalTaxableValue), alignment: { horizontal: 'right' } },
          { value: this.formatNumber(this.totalTaxCalculatedOn), alignment: { horizontal: 'right' } },
          { value: this.formatNumber(this.totalIGST), alignment: { horizontal: 'right' } },
          { value: this.formatNumber(this.totalCGST), alignment: { horizontal: 'right' } },
          { value: this.formatNumber(this.totalSGST), alignment: { horizontal: 'right' } },
          { value: this.formatNumber(this.totalIGSTAmountRCM), alignment: { horizontal: 'right' } },
          { value: this.formatNumber(this.totalCGSTAmountRCM), alignment: { horizontal: 'right' } },
          { value: this.formatNumber(this.totalSGSTAmountRCM), alignment: { horizontal: 'right' } },
          { value: this.formatNumber(this.totalGST), alignment: { horizontal: 'right' } },
          { value: '', colspan: 2 },
        ],
        style: 'total',
      });
    }

    return {
      fileName: 'GST-Inward-Register',
      sheetName: 'GST Inward',
      reportHeader: {
        companyName: this.currentCompany?.companyName || '',
        reportTitle: 'GST Inward Register',
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Voucher Type', value: this.fullData?.voucherTypeName || '' },
          { label: 'State', value: this.fullData?.state || '' },
        ],
      },
      tableHeaders,
      rows,
      columnWidths: [
        18, 18, 22, 20, 18, 20, 32, 20, 15, 15,
        18, 14, 14, 14, 18, 18, 18, 15, 24, 18,
      ],
    };
  }

  private formatNumber(value: any): string {
    if (value === null || value === undefined || value === '') return '';

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
