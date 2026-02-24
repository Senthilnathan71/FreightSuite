import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { NumberToWordsService } from 'src/app/common/numberTowords';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { MasterService } from 'src/app/modules/master/master.service';


@Component({
  selector: 'app-outstanding-local',
  standalone: true,
  imports: [CustomDatePipe, CommonModule, PrintHeaderComponent],
  templateUrl: './outstanding-local.component.html',
  styles: ``
})
export class OutstandingLocalComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  currencyList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  companyCurrency: any;
  currentCurrencyCode: string = '';
  currentCurrency: number;
  currencyGroups: any[] = [];

  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private reportRegistryService: ReportRegistryService,
    private numberToWords: NumberToWordsService,
    private companySettings: CompanySettingsManagerService,
    private masterService: MasterService
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.loadSalesPerson();
    this.loadcurrencyList()
    this.orientation = this.reportRegistryService.getReportConfig('outstanding-local').pdfOrientation;
    this.companyCurrency = this.companySettings.getCurrencySettings();
    this.currentCurrencyCode = this.companyCurrency.code;
    this.currentCurrency = Number(this.currentCompany?.CurrencyMasterSid)
    this.groupTransactionsByCurrency();

  }


  groupTransactionsByCurrency() {

    const transactions = this.fullData?.transactions || [];
    const grouped: any = {};

    // Group by currencyCode
    transactions.forEach((tx: any) => {
      const currency = tx.currencyCode || "";

      if (!grouped[currency]) {
        grouped[currency] = [];
      }

      grouped[currency].push(tx);
    });

    // Convert to array
    this.currencyGroups = Object.keys(grouped).map(code => ({
      currencyCode: code,
      transactions: grouped[code]
    }));

  }

  getSubtotal(transactions: any[], field: string): number {
    return transactions.reduce((sum, item) => {
      return sum + (Number(item[field]) || 0);
    }, 0);
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

  loadSalesPerson(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.leadService.getAllSalesman(CompanyMasterSid).subscribe(
      (resp: any) => {

        this.salesmanList = resp;

      });
  }

  loadcurrencyList(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.masterService.getAllCurrencies().subscribe(
      (resp: any) => {

        this.currencyList = resp;

        this.numberToWords.initializeCurrencies(this.currencyList);
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

  // getAmountInWords(): string {

  //   const transactions = this.fullData?.transactions || [];

  //   // ✅ Total Outstanding Amount
  //   const totalAmount = this.getTotal(transactions, 'outstandingCurrencyAmount');
  //   if (!totalAmount) return '';

  //   // ✅ Split Integer & Decimal Parts
  //   const integerPart = Math.floor(totalAmount);
  //   const decimalPart = Math.round((totalAmount - integerPart) * 100);

  //   // ✅ Convert Integer Part
  //   const integerWords = this.numberToWords.convert(integerPart);

  //   // ✅ Currency Code
  //   const currencyCode = this.currentCurrencyCode?.trim().toUpperCase();

  //   // ✅ Currency Names
  //   let mainCurrency = '';
  //   let subCurrency = '';

  //   if (currencyCode === 'AED') {
  //     mainCurrency = 'Dirhams';
  //     subCurrency = 'Fils';
  //   }
  //   else if (currencyCode === 'USD') {
  //     mainCurrency = 'Dollars';
  //     subCurrency = 'Cents';
  //   }
  //   else {
  //     return `${integerWords} `;
  //   }

  //   // ✅ If No Decimal Part → Only at End
  //   if (decimalPart === 0) {
  //     return `${integerWords} ${mainCurrency} `;
  //   }

  //   // ✅ Convert Decimal Part
  //   const decimalWords = this.numberToWords.convert(decimalPart);

  //   // ✅ Full Amount with Decimal + Only at End
  //   return `${integerWords} ${mainCurrency} and ${decimalWords} ${subCurrency}`;
  // }

  getAmountInWords(): string {
    const transactions = this.fullData?.transactions || [];
    if (!transactions.length) return '';
    let totalAmount =
      transactions[transactions.length - 1]?.cumulativeOutstanding || 0;
    if (!totalAmount) return '';
    totalAmount = Math.abs(totalAmount);
    const currencySid = this.currentCurrency;
    return this.numberToWords.convert(totalAmount, currencySid);
  }

  getAmountInWordsForGroup(transactions: any[], currencyCode: string): string {
    if (!transactions || !transactions.length) return '';

    // Get the cumulativeOutstanding of the last transaction in the group
    let totalAmount = this.getSubtotal(transactions, 'signedOutstandingCurrency');
    if (!totalAmount) return '';

    totalAmount = Math.abs(totalAmount);

    // Get currency SID from currency code
    const currency = (this.currencyList || []).find(c => c.currencyCode === currencyCode);
    const currencySid = currency?.CurrencyMasterSid;
    console.log(totalAmount, currencySid);
    return this.numberToWords.convert(totalAmount, currencySid);
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

    const currencyGroups = this.currencyGroups || [];
    const currencySummary = this.fullData?.currencyWiseSummary || [];

    /* ================= MAIN TABLE HEADERS ================= */

    const tableHeaders: ExcelHeader[] = [
      { key: 'voucherNo', label: 'Voucher No' },
      { key: 'voucherDate', label: 'Voucher Date' },
      { key: 'voucherType', label: 'Type' },
      { key: 'desc', label: 'Narration' },
      { key: 'drCr', label: 'Dr/Cr' },
      { key: 'amt', label: 'Amt' },
      { key: 'osAmt', label: 'O/S Currency Amt' },
      { key: 'cumulative', label: 'Cumulative' },
      { key: 'ageing', label: 'Ageing' }
    ];

    const columnWidths = [15, 10,3, 30, 3, 10, 10, 10, 4];

    /* ================= LOOP CURRENCY GROUPS ================= */

    currencyGroups.forEach(group => {

      // ✅ Currency Header Row
      rows.push({
        cells: [
          { value: group.currencyCode, colspan: 9 }
        ],
        style: 'header'
      });

      // ✅ Transaction Rows
      group.transactions.forEach(item => {
        rows.push({
          cells: [
            { value: item?.voucherNumber || '' },
            { value: this.formatDate(item?.voucherDate) },
            { value: item?.voucherType || '' },
            { value: item?.naration || '' },
            { value: item?.drCr || '' },
            { value: this.formatNumber(item?.signedOriginalCurrency || 0) },
            { value: this.formatNumber(item?.signedOutstandingCurrency || 0) },
            { value: this.formatNumber(item?.currencyWiseCumulative || 0) },

            { value: item?.ageingDays || 0 }
          ],
          style: 'data'
        });
      });

      // ✅ Total Row (Same as HTML)
      rows.push({
        cells: [
          {
            value: this.getAmountInWordsForGroup(
              group.transactions,
              group.currencyCode
            ),
            colspan: 4
          },
          { value: 'Total', colspan: 1 },

          {
            value: this.formatNumber(
              this.getSubtotal(group.transactions, 'signedOriginalCurrency')
            )
          },
          {
            value: this.formatNumber(
              this.getSubtotal(group.transactions, 'signedOutstandingCurrency')
            )
          },

          { value: '', colspan: 2 }
        ],
        style: 'total'
      });
    });

    /* ================= SUMMARY TABLE (BOTTOM) ================= */

    const summaryHeaders = [
      'Currency',
      `Total Outstanding [${this.currentCurrencyCode}]`,
      '0 - 30 Days',
      '31 - 60 Days',
      '61 - 90 Days',
      '91 - 120 Days',
      '121+ Days'
    ];

    const summaryColumnWidths = [12, 20, 14, 14, 14, 14, 14];

    /* ================= FINAL RETURN ================= */

    return {
      fileName: 'Outstanding-Report',
      sheetName: 'OutstandingReport',

      // ✅ Header Like HTML
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Outstanding Local Report`,
        additionalInfo: [
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Branch', value: this.fullData?.brancesInvoled || 'All' },
          { label: 'Subledger', value: this.fullData?.subledgerName || '' },
          { label: 'Ledger', value: this.fullData?.ledgerName || '' }
        ]
      },

      tableHeaders,
      columnWidths,
      rows,

      // ✅ Bottom Currency Summary Table
      summaryTable: {
        headers: summaryHeaders,

        rows: currencySummary.map(cur => ({
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

        columnWidths: summaryColumnWidths
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
