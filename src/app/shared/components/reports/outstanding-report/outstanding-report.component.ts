import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';

@Component({
  selector: 'app-outstanding-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule, PrintHeaderComponent],
  templateUrl: './outstanding-report.component.html',
  styles: ``
})
export class OutstandingReportComponent {


  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  companyCurrency: any;
  currentCurrencyCode: string = '';
  currentCurrency: number;
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private reportRegistryService: ReportRegistryService,
    private companySettings: CompanySettingsManagerService,
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.loadSalesPerson();
    this.orientation = this.reportRegistryService.getReportConfig('outstanding-report').pdfOrientation;
    this.companyCurrency = this.companySettings.getCurrencySettings();
    this.currentCurrencyCode = this.companyCurrency.code;
    this.currentCurrency = Number(this.currentCompany?.CurrencyMasterSid)
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

  getBucketTotal(transactions: any[], from: number, to: number): number {
    if (!transactions) return 0;

    return transactions
      .filter(item => item.ageingDays >= from && item.ageingDays <= to)
      .reduce((sum, item) => sum + (item.outstandingLocalAmount || 0), 0);
  }


  getTotal(data: any[], field: string): number {
    if (!data) return 0;

    return data.reduce((sum, item) => {
      const value = Number(item[field]) || 0;
      return sum + value;
    }, 0);
  }

  getSignedTotal(transactions: any[]): number {
    if (!transactions || !transactions.length) return 0;

    const ledgerType = this.fullData?.ledgerType?.trim(); // "Sy Dr"

    let total = 0;

    transactions.forEach((item) => {
      const drCr = item?.drCr;
      const amount = +item?.outstandingLocalAmount || 0;

      if (ledgerType === "Sy Dr") {
        total += drCr === "D" ? amount : -amount;
      }

      if (ledgerType === "Sy Cr") {
        total += drCr === "C" ? amount : -amount;
      }
    });

    return total;
  }

  getLocalTotal(transactions: any[]): number {
    if (!transactions || !transactions.length) return 0;
    const ledgerType = this.fullData?.ledgerType?.trim();
    let total = 0;
    transactions.forEach((item) => {
      const drCr = item?.drCr;
      const amount = +item?.originalLocalAmount || 0;

      if (ledgerType === "Sy Dr") {
        total += drCr === "D" ? amount : -amount;
      }

      if (ledgerType === "Sy Cr") {
        total += drCr === "C" ? amount : -amount;
      }
    });

    return total;
  }



  loadSalesPerson(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.leadService.getAllSalesman(CompanyMasterSid).subscribe(
      (resp: any) => {
        console.log(resp, 'SalesPerson')
        this.salesmanList = resp;
        console.log(this.salesmanList, "SALESMAN LIST")
      });
  }

  getSalesmanById(id: number) {
    if (!id || !this.salesmanList.length) return;
    const user = this.salesmanList.find(person => person.UserMasterSid === id);
    return user?.userName;
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

    const rows: ExcelRow[] = [];

    const transactions = this.fullData?.transactions || [];
    const currencySummary = this.fullData?.currencyWiseSummary || [];


    const tableHeaders: ExcelHeader[] = [
      { key: 'voucherNo', label: 'Voucher No' },
      { key: 'voucherDate', label: 'Voucher Date' },
      { key: 'voucherType', label: 'Type' },
      { key: 'desc', label: 'Narration' },
      { key: 'drCr', label: 'Dr/Cr' },
      { key: 'currency', label: 'Cur' },
      { key: 'amt', label: 'Amt' },
      { key: 'localAmt', label: 'Local Amt' },
      { key: 'osCurrAmt', label: 'O/S Currency Amt' },
      { key: 'osLocalAmt', label: 'O/S Local Amt' },
      { key: 'cumulative', label: 'Cumulative' },
      { key: 'ageingDays', label: 'Ageing' }
    ];

    const columnWidths = [
      15, // Voucher No
      8, // Voucher Date
      3,  // Type
      25, // Narration
      3,  // Dr/Cr
      3,  // Cur
      10, // Amt
      10, // Local Amt
      10, // O/S Currency
      10, // O/S Local
      10, // Cumulative
      4   // Ageing
    ];


    transactions.forEach((item: any) => {
      rows.push({
        cells: [
          { value: item?.voucherNumber || '' },
          { value: this.formatDate(item?.voucherDate) , alignment:{horizontal:'center'} },
          { value: item?.voucherType || '' , alignment:{horizontal:'center'} },
          { value: item?.naration || '' },
          { value: item?.drCr || '' , alignment:{horizontal:'center'} },
          { value: item?.currencyCode || '' , alignment:{horizontal:'center'} },
          { value: this.formatNumber(item?.signedOriginalCurrency || 0) },
          { value: this.formatNumber(item?.signedOriginalLocal || 0) },
          { value: this.formatNumber(item?.signedOutstandingCurrency || 0) },
          { value: this.formatNumber(item?.signedOutstandingLocal || 0) },
          { value: this.formatNumber(item?.cumulativeOutstanding || 0) },
          { value: item?.ageingDays || 0 }
        ],
        style: 'data'
      });
    });


    rows.push({
      cells: [
        { value: 'TOTAL :', colspan: 7 , alignment:{horizontal:'right'} },

        { value: this.formatNumber(this.getLocalTotal(transactions)) },
        { value: '' },
        { value: this.formatNumber(this.getSignedTotal(transactions)) },

        {
          value: this.formatNumber(
            transactions?.[transactions.length - 1]?.cumulativeOutstanding || 0
          )
        },

        { value: '' }
      ],
      style: 'total'
    });

    return {
      fileName: 'Outstanding-Report',
      sheetName: 'OutstandingReport',

      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Outstanding Report`,
        additionalInfo: [
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Branch', value: this.fullData?.brancesInvoled || '' },
          { label: 'Subledger', value: this.fullData?.subledgerName || '' },
          { label: 'Ledger', value: this.fullData?.ledgerName || '' }
        ]
      },

      tableHeaders,
      columnWidths,
      rows,

      summaryTable: {
        headers: [
          'Currency',
          'Total Outstanding',
          '0 - 30 Days',
          '31 - 60 Days',
          '61 - 90 Days',
          '91 - 120 Days',
          '121+ Days'
        ],

        rows: currencySummary.map((cur: any) => ({
          cells: [
            { value: cur.currencyCode || '' },
            { value: this.formatNumber(cur.totalOutstanding || 0) },
            { value: this.formatNumber(cur.bucket_0_30 || 0) },
            { value: this.formatNumber(cur.bucket_31_60 || 0) },
            { value: this.formatNumber(cur.bucket_61_90 || 0) },
            { value: this.formatNumber(cur.bucket_91_120 || 0) },
            { value: this.formatNumber(cur.bucket_121_above || 0) }
          ],
          style: 'data'
        })),

        columnWidths: [12, 18, 14, 14, 14, 14, 14]
      }
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
