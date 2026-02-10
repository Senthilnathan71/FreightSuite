import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';

@Component({
  selector: 'app-statement-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './statement-report.component.html',
  styles: ``
})
export class StatementReportComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation : 'portrait' | 'landscape' = 'portrait';

  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private reportRegistryService : ReportRegistryService
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('ledger-report').pdfOrientation;
  }

  get fullData(): any {
    console.log(this.data, "DATA")
    return this.data || {};
  }

  get params(): any {
    return this.data?.params || {};
  }

  get bucketLabels(): any {
    return this.fullData?.bucketLabels || [];
  }

  getTotal(data: any[], field: string): number {
    if (!data) return 0;
    return data.reduce((sum, item) => {
      const value = Number(item[field]) || 0;
      return sum + value;
    }, 0);
  }


  trackByCurrencyCode(index: number, group: any): string {
    return group.CurrencyCode;
  }

  trackBySubledger(index: number, sub: any): number {
    return sub.SubledgerMasterSid;
  }

  getCumulative(transactions: any[], index: number): number {
    let total = 0;

    for (let i = 0; i <= index; i++) {
      const row = transactions[i];
      const amount = Number(row?.outstandingLocalAmount) || 0;

      if (row?.drCr?.toUpperCase() === 'C') {
        total += amount;
      } else if (row?.drCr?.toUpperCase() === 'D') {
        total -= amount;
      }
    }

    return total;
  }

  
  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'voucherNo', label: 'Voucher No' },
      { key: 'voucherDate', label: 'Voucher Date' },
      { key: 'voucherType', label: 'Voucher Type' },
      // { key: 'master', label: 'Master' },
      // { key: 'house', label: 'House' },
      // { key: 'hblNo', label: 'HBL No' },
      // { key: 'dept', label: 'Dept' },
      { key: 'desc', label: 'Naration' },
      // { key: 'salesperson', label: 'Salesperson' },
      { key: 'drCr', label: 'Dr' },
      { key: 'drCr', label: 'Cr' },
      { key: 'currency', label: 'Cur' },
      { key: 'amt', label: 'Amt' },
      { key: 'localAmt', label: 'Local Amt' },
      { key: 'osCurrAmt', label: 'O/S Currency Amt' },
      { key: 'osLocalAmt', label: 'O/S Local Amt' },
      { key: 'cumulative', label: 'Cumulative' }
    ];

    const rows: ExcelRow[] = [];
    const transactions = this.fullData?.transactions || [];

   
    transactions.forEach((item: any, index: number) => {
      const cells: ExcelCell[] = [
        { value: item?.voucherNumber || '' },
        { value: this.formatDate(item?.voucherDate) },
        { value: item?.voucherType || '' },
        // { value: item?.MasterJobNumber || '' },
        // { value: '' }, 
        // { value: item?.HouseJobNumber || '' },
        // { value: item?.deptname || '' },
        { value: item?.naration || '' },
        // { value: item?.salesmanSid || '' },
        { value: item?.drCr === 'D' ? 'D' : '' },
        { value: item?.drCr === 'C' ? 'C' : '' },
        { value: item?.currencyCode || '' },
        { value: this.formatNumber(item?.originalCurrencyAmount) },
        { value: this.formatNumber(item?.originalLocalAmount) },
        { value: this.formatNumber(item?.outstandingCurrencyAmount) },
        { value: this.formatNumber(item?.outstandingLocalAmount) },
        { value: this.formatNumber(this.getCumulative(transactions, index)) }
      ];
      rows.push({ cells, style: 'data' });
    });

    
    const totalCells: ExcelCell[] = [
      { value: 'TOTAL', colspan: 7 },
      { value: this.formatNumber(this.getTotal(transactions, 'originalCurrencyAmount')) },
      { value: this.formatNumber(this.getTotal(transactions, 'originalLocalAmount')) },
      { value: this.formatNumber(this.getTotal(transactions, 'outstandingCurrencyAmount')) },
      { value: this.formatNumber(this.getTotal(transactions, 'outstandingLocalAmount')) },
      { value: this.formatNumber(this.getCumulative(transactions, transactions.length - 1)) }
    ];
    rows.push({ cells: totalCells, style: 'total' });

    return {
      fileName: 'Statement-Report',
      sheetName: 'StatementReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Customer Statement as on ${this.formatDate(this.params?.FromDate)}`,
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Branch', value: this.fullData?.BranchInvolved || this.currentBranch?.branchName || '' },
          { label: 'Subledger', value: this.fullData?.subledgerName || '' },
          { label: 'Ledger', value: this.fullData?.ledgerName || '' }
        ]
      },
      tableHeaders,
      rows,
      // columnWidths: [12, 12, 15, 12, 10, 15, 10, 25, 15, 8, 8, 15, 15, 15, 15, 15],
      columnWidths: [12, 12, 15, 25, 8, 8, 8, 15, 15, 15, 15, 15],
      notes: ['This Statement of Accounts report includes only posted voucher transactions.']
    };
  }

 
  private formatNumber(value: any): number | string {
    if (value === null || value === undefined) return '';
    const num = Number(value);
    return isNaN(num) ? '' : Number(num.toFixed(2));
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
