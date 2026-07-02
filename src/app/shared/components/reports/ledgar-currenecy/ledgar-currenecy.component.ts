import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import {
  ComplexReportExportConfig,
  ExcelCell,
  ExcelHeader,
  ExcelRow,
} from 'src/app/shared/excel-report-service';
import { firstValueFrom, Observable } from 'rxjs';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { NumberToWordsService } from 'src/app/common/numberTowords';
@Component({
  selector: 'app-ledgar-currenecy',
  standalone: true,
  imports: [
    CustomDatePipe,
    CommonModule,
    PrintHeaderComponent,
    PrintFooterComponent,
  ],
  templateUrl: './ledgar-currenecy.component.html',
  styles: ``,
})
export class LedgarCurrenecyComponent {
  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  currencyList: any[] = [];
  orientation: 'portrait' | 'landscape' = 'portrait';
  private _localCurrencyCode: string | null = null;
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService,
    private currencyFormatService: CurrencyFormatService,
    private currencyConfigService: CurrencyConfigurationService,
    private masterService: MasterService,
    private numberToWords: NumberToWordsService
  ) {
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    this.orientation = this.reportRegistryService.getReportConfig(
      'ledger-report-currenecy',
    ).pdfOrientation;
    this.ensureCurrencyListLoaded();
  }

    private async ensureCurrencyListLoaded(): Promise<void> {
      if (this.currencyList?.length) return;
      try {
        const currencies = await firstValueFrom(
          this.masterService.getAllCurrencies(),
        );
        this.currencyList = Array.isArray(currencies) ? currencies : [];
        this.numberToWords.initializeCurrencies(this.currencyList);
        this.currencyConfigService.initializeConfigurations(this.currencyList);
      } catch (error) {
        console.warn('Could not load currency list for bank headers:', error);
        this.currencyList = [];
      }
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

  getLocalTotal(transactions: any[]): number {
    if (!transactions || !transactions.length) return 0;

    const ledgerType = this.fullData?.ledgerType?.trim();
    let total = this.fullData?.openingBalance || 0;

    transactions.forEach((item) => {
      const drCr = item?.drCr;
      const amount = +item?.originalLocalAmount || 0;

      if (ledgerType === 'Sy Dr') {
        total += drCr === 'D' ? amount : -amount;
      } else if (ledgerType === 'Sy Cr') {
        total += drCr === 'C' ? amount : -amount;
      } else {
        total += drCr === 'D' ? amount : -amount;
      }
    });

    return total;
  }

  getSignedTotal(transactions: any[]): number {
    if (!transactions || !transactions.length) return 0;

    const ledgerType = this.fullData?.ledgerType?.trim();
    let total = this.fullData?.openingBalance || 0;

    transactions.forEach((item) => {
      const drCr = item?.drCr;
      const amount = +item?.originalCurrencyAmount || 0;

      if (ledgerType === 'Sy Dr') {
        total += drCr === 'D' ? amount : -amount;
      } else if (ledgerType === 'Sy Cr') {
        total += drCr === 'C' ? amount : -amount;
      } else {
        total += drCr === 'D' ? amount : -amount;
      }
    });

    return total;
  }

  getExcelData(): ComplexReportExportConfig {
    const localCode = this.localCurrencyCode;
    const amt = (v: any, code: string = localCode): ExcelCell => ({
      value: this.currencyFormatService.formatMaskedAmount({ value: Number(v) || 0, currencyCode: code }),
      num: Number(v) || 0,
      numFmt: this.currencyFormatService.getExcelNumberFormat(code),
      isAmount: true,
      alignment: { horizontal: 'right' },
    });
    const tableHeaders: ExcelHeader[] = [
      { key: 'voucherNo', label: 'Voucher No' },
      { key: 'voucherDate', label: 'Voucher Date' },
      { key: 'voucherType', label: 'Type' },
      { key: 'desc', label: 'Narration' },
      { key: 'drCr', label: 'Dr/Cr' },
      { key: 'currency', label: 'Cur' },
      { key: 'amt', label: 'Amt' },
      // { key: 'localAmt', label: 'Local Amt' },
      // { key: 'osCurrAmt', label: 'O/S Currency Amt' },
      // { key: 'osLocalAmt', label: 'O/S Local Amt' },
      { key: 'cumulative', label: 'Cumulative' },
    ];

    const rows: ExcelRow[] = [];
    const transactions = this.fullData?.transactions || [];
    const openingBalance = this.fullData?.openingBalance || 0;

    if (openingBalance !== 0) {
      const openingCells: ExcelCell[] = [
        { value: 'Opening Balance', alignment: { horizontal: 'center' } },
        { value: this.formatDate(this.params?.FromDate) },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: '' },
        // { value: '' },
        { value: this.formatNumber(openingBalance) },
        // { value: '' },
        // { value: '' },
        // { value: '' },
        { value: this.formatNumber(openingBalance) },
      ];

      rows.push({ cells: openingCells, style: 'data' });
    }

    transactions.forEach((item: any, index: number) => {
      const cells: ExcelCell[] = [
        { value: item?.voucherNumber || '' },
        { value: this.formatDate(item?.voucherDate) },
        { value: item?.voucherType || '', alignment: { horizontal: 'center' } },
        { value: item?.naration || '' },
        { value: item?.drCr || '', alignment: { horizontal: 'center' } },
        {
          value: item?.currencyCode || '',
          alignment: { horizontal: 'center' },
        },
        amt(item?.signedOriginalCurrency, item?.currencyCode) ,
        // { value: this.formatNumber(item?.signedLocalAmt) },
        // { value: this.formatNumber(item?.signedOutstandingCurrency) },
        // { value: this.formatNumber(item?.signedoutstandingLocalAmount) },
        amt(item?.cumulativeOutstanding, item?.currencyCode) ,
      ];
      rows.push({ cells, style: 'data' });
    });

    if (transactions && transactions.length > 0) {
      const totalCells: ExcelCell[] = [
        { value: 'TOTAL', colspan: 6, alignment: { horizontal: 'right' } },
         amt(this.getSignedTotal(transactions)) ,
        // { value: '' },
        // { value: this.formatNumber(this.getSignedTotal(transactions)) },
           amt(
            transactions.length > 0
              ? transactions[transactions.length - 1]?.cumulativeOutstanding
              : 0,
          ),
      ];
      rows.push({ cells: totalCells, style: 'total' });
    }

    return {
      fileName: 'Ledger-Currency-Report',
      sheetName: 'LedgerCurrencyReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Ledger Currency Report`,
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Branch', value: this.fullData?.branchInvolved || '' },
          { label: 'Ledger', value: this.fullData?.ledgerName || '' },
          { label: 'Subledger', value: this.fullData?.subledgerName || '' },
          {
            label: 'Voucher Type',
            value: this.fullData?.voucherTypeName || '',
          },
          {
            label: 'Currenecy',
            value: this.fullData?.currencyCode || '',
          }
        ],
      },
      tableHeaders,
      rows,
      columnWidths: [12, 8, 3, 30, 3, 3, 12, 12]
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
  
   private safeDecryptLocalStorage(key: string): any {
    const value = localStorage.getItem(key);
    if (!value) return null;

    try {
      return this.appSettingsService.decrypt(value);
    } catch {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
  }

   private getCompanyCountryCurrencyCode(): string {
      const selectedCountry =
        this.safeDecryptLocalStorage('selected-country') || {};
      const countryText = [
        selectedCountry?.countryCode,
        selectedCountry?.countryName,
        this.currentCompany?.countryCode,
        this.currentCompany?.countryName,
        this.currentCompany?.countryMaster?.countryCode,
        this.currentCompany?.countryMaster?.countryName,
        this.currentBranch?.countryCode,
        this.currentBranch?.countryName,
        this.currentBranch?.countryMaster?.countryCode,
        this.currentBranch?.countryMaster?.countryName,
        this.currentBranch?.branchName,
        this.currentCompany?.companyName,
      ]
        .filter(Boolean)
        .join(' ')
        .toUpperCase();
  
      if (
        countryText.includes('AE') ||
        countryText.includes('UAE') ||
        countryText.includes('UNITED ARAB') ||
        countryText.includes('DUBAI')
      ) {
        return 'AED';
      }
  
      if (countryText.includes('IN') || countryText.includes('INDIA')) {
        return 'INR';
      }
  
      return '';
    }
  
    private getReportCurrencyCode(): string {
    const configuredCode = String(
      this.fullData?.currencyCode ||
        this.fullData?.CurrencyCode ||
        this.currentCompany?.CurrencyCode ||
        this.currentCompany?.currencyCode ||
        '',
    )
      .trim()
      .toUpperCase();

    if (configuredCode === 'UAE') return 'AED';
    if (configuredCode === 'IND') return 'INR';
    if (configuredCode) return configuredCode;

    return this.getCompanyCountryCurrencyCode();
  }

   get localCurrencyCode(): string {
      if (!this._localCurrencyCode) {
        const code = this.getReportCurrencyCode();
        if (code) this._localCurrencyCode = code;
        return code;
      }
      return this._localCurrencyCode;
    }
  
  
    maskLocal(value: any): string {
      return this.currencyFormatService.formatMaskedAmount({
        value: Number(value) || 0,
        currencyCode: this.localCurrencyCode,
      });
    }
  
    maskCur(value: any, currencyCode: string): string {
      return this.currencyFormatService.formatMaskedAmount({
        value: Number(value) || 0,
        currencyCode: currencyCode || this.localCurrencyCode,
      });
    }
}
