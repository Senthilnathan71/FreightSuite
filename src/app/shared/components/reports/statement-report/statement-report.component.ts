import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { NumberToWordsService } from 'src/app/common/numberTowords';

@Component({
  selector: 'app-statement-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule, PrintHeaderComponent, PrintFooterComponent],
  templateUrl: './statement-report.component.html',
  styles: ``
})
export class StatementReportComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  companyCurrency: any;
  currentCurrencyCode: string = '';
  currentCurrency: number;
  bankDetails: any[] = [];
  currencyList: any[] = [];
  showBankDetails = false;
  isBankDetailsLoading = false;
  isPrintAllBankEnabled = false;
  isPrintAllBankConfigLoaded = false;
  isBankFetched = false;
  orientation: 'portrait' | 'landscape' = 'portrait';

  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private reportRegistryService: ReportRegistryService,
    private companySettings: CompanySettingsManagerService,
    private operationService: OperationService,
    private masterService: MasterService,
    private numberToWords: NumberToWordsService,
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('ledger-report').pdfOrientation;
    this.companyCurrency = this.companySettings.getCurrencySettings();
    this.currentCurrencyCode = this.companyCurrency.code;
    this.currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
    this.ensureCurrencyListLoaded();

    this.operationService
      .getCompanyConfig(this.currentCompany?.CompanyMasterSid, 'OSandStatementShowBankDetails')
      .subscribe(async (resp: any) => {
        const configValue = resp?.data;
        this.showBankDetails = configValue === 'Y';

        if (!this.showBankDetails) {
          this.bankDetails = [];
          return;
        }

        this.isBankDetailsLoading = true;
        await this.getAndStoreBankDetails();
        this.isBankDetailsLoading = false;
      }, () => {
        this.bankDetails = [];
        this.isBankDetailsLoading = false;
      });
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

  async getAndStoreBankDetails(): Promise<void> {
    try {
      if (!this.isPrintAllBankConfigLoaded) {
        await this.loadPrintAllBankConfig();
      }
      await this.ensureCurrencyListLoaded();
      const resp: any = await firstValueFrom(this.getBankDetails());
      this.isBankFetched = true;
      this.bankDetails = this.filterPrintableBankDetails(resp ?? []);
    } catch (err) {
      console.error('Error fetching bank details', err);
      this.bankDetails = [];
    }
  }

  getBankDetails(): Observable<any[]> {
    return this.masterService.getAllBranchBanks();
  }

  private filterPrintableBankDetails(bankDetails: any[]): any[] {
    if (!Array.isArray(bankDetails)) {
      return [];
    }

    const branchSid = Number(this.currentBranch?.BranchMasterSid || 0);
    const reportCurrencySid = Number(this.fullData?.CurrencyMasterSid || this.currentCurrency || 0);

    return bankDetails.filter((bankDetail: any) => {
      const bankBranchSid = Number(bankDetail?.BranchMasterSid || 0);
      const bankCurrencySid = Number(bankDetail?.CurrencyMasterSid || 0);
      const printOnInvoice = bankDetail?.PrintOnInvoice ?? bankDetail?.printOnInvoice;

      if (branchSid && bankBranchSid !== branchSid) {
        return false;
      }

      if (!this.isPrintAllBankEnabled && reportCurrencySid && bankCurrencySid !== reportCurrencySid) {
        return false;
      }

      return this.parseConfigBoolean(printOnInvoice, false);
    });
  }

  getBankCurrencyCode(bankDetail: any): string {
    const bankCurrencySid = Number(
      bankDetail?.CurrencyMasterSid ??
      bankDetail?.currencyMasterSid ??
      bankDetail?.currencyMaster?.CurrencyMasterSid ??
      bankDetail?.currency?.CurrencyMasterSid ??
      0
    );
    const currencyFromList = bankCurrencySid
      ? this.currencyList.find((c: any) => Number(c?.CurrencyMasterSid) === bankCurrencySid)
      : null;

    return bankDetail?.CurrencyCode ||
      bankDetail?.currencyCode ||
      bankDetail?.currencyMaster?.CurrencyCode ||
      bankDetail?.currencyMaster?.currencyCode ||
      bankDetail?.currency?.CurrencyCode ||
      bankDetail?.currency?.currencyCode ||
      currencyFromList?.currencyCode ||
      currencyFromList?.CurrencyCode ||
      this.fullData?.currencyCode ||
      this.currentCurrencyCode ||
      '';
  }

  private async loadPrintAllBankConfig(): Promise<void> {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) {
      this.isPrintAllBankEnabled = false;
      this.isPrintAllBankConfigLoaded = true;
      return;
    }

    try {
      const resp: any = await firstValueFrom(
        this.masterService.getConfigurationValue(companyId, 'Printallbank')
      );
      const rawValue = resp?.ConfigurationValue ?? resp?.value ?? resp;
      this.isPrintAllBankEnabled = this.parseConfigBoolean(rawValue, false);
    } catch (error) {
      console.warn('Could not load Printallbank configuration:', error);
      this.isPrintAllBankEnabled = false;
    } finally {
      this.isPrintAllBankConfigLoaded = true;
    }
  }

  private parseConfigBoolean(value: any, fallback = false): boolean {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'boolean') return value;
    const normalized = String(value).trim().toLowerCase();
    if (!normalized) return fallback;
    return ['y', 'yes', 'true', '1', 'on'].includes(normalized);
  }

  private async ensureCurrencyListLoaded(): Promise<void> {
    if (this.currencyList?.length) return;
    try {
      const currencies = await firstValueFrom(this.masterService.getAllCurrencies());
      this.currencyList = Array.isArray(currencies) ? currencies : [];
      this.numberToWords.initializeCurrencies(this.currencyList);
    } catch (error) {
      console.warn('Could not load currency list for bank headers:', error);
      this.currencyList = [];
    }
  }

  getOutstandingAmountInWordsLines(): string[] {
    const transactions = this.fullData?.transactions || [];
    const total = Math.abs(this.getLocalTotal(transactions));
    if (!total) return [];

    const currencyCode = this.getReportCurrencyCode();
    const currencySid = this.getCurrencySidByCode(currencyCode) || Number(this.fullData?.CurrencyMasterSid || this.currentCurrency || 0);
    return [this.convertAmountWithZeroSubUnit(total, currencyCode, currencySid)];
  }

  private getReportCurrencyCode(): string {
    const configuredCode = String(
      this.fullData?.currencyCode ||
      this.fullData?.CurrencyCode ||
      this.companyCurrency?.code ||
      this.currentCurrencyCode ||
      this.currentCompany?.CurrencyCode ||
      this.currentCompany?.currencyCode ||
      ''
    ).trim().toUpperCase();

    if (configuredCode === 'UAE') return 'AED';
    if (configuredCode === 'IND') return 'INR';
    if (configuredCode) return configuredCode;

    return this.getCompanyCountryCurrencyCode();
  }

  private getCompanyCountryCurrencyCode(): string {
    const selectedCountry = this.safeDecryptLocalStorage('selected-country') || {};
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

    if (countryText.includes('AE') || countryText.includes('UAE') || countryText.includes('UNITED ARAB') || countryText.includes('DUBAI')) {
      return 'AED';
    }

    if (countryText.includes('IN') || countryText.includes('INDIA')) {
      return 'INR';
    }

    return '';
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

  private getCurrencySidByCode(currencyCode: string): number {
    const currency = (this.currencyList || []).find((item: any) => {
      const code = String(item?.currencyCode || item?.CurrencyCode || item?.code || '').trim().toUpperCase();
      return code === currencyCode;
    });

    return Number(currency?.CurrencyMasterSid || currency?.currencyMasterSid || 0);
  }

  private convertAmountWithZeroSubUnit(amount: number, currencyCode: string, currencySid: number): string {
    const normalizedCode = String(currencyCode || '').trim().toUpperCase();
    const currency = this.getCurrencyByCodeOrSid(normalizedCode, currencySid);
    const unit = this.getCurrencyUnit(currency, normalizedCode);
    const subUnit = this.getCurrencySubUnit(currency, normalizedCode);
    const decimals = this.getCurrencyDecimals(currency, normalizedCode);
    const absoluteAmount = Math.abs(Number(amount) || 0);
    const integerPart = Math.floor(absoluteAmount);
    const decimalPart = decimals > 0
      ? Math.round((absoluteAmount - integerPart) * Math.pow(10, decimals))
      : 0;

    const integerWords = this.stripCurrencyUnit(this.stripOnly(this.numberToWords.convert(integerPart, currencySid)), unit);
    const decimalWords = decimals > 0
      ? this.stripOnly(this.numberToWords.convert(decimalPart, null))
      : 'Zero';

    if (!unit && !subUnit) {
      return this.numberToWords.convert(absoluteAmount, currencySid);
    }

    return `${integerWords}${unit ? ` ${unit}` : ''} and ${decimalWords}${subUnit ? ` ${subUnit}` : ''} Only`;
  }

  private getCurrencyByCodeOrSid(currencyCode: string, currencySid: number): any {
    return (this.currencyList || []).find((item: any) => {
      const code = String(item?.currencyCode || item?.CurrencyCode || item?.code || '').trim().toUpperCase();
      const sid = Number(item?.CurrencyMasterSid || item?.currencyMasterSid || 0);
      return (currencyCode && code === currencyCode) || (currencySid && sid === Number(currencySid));
    }) || {};
  }

  private getCurrencyUnit(currency: any, currencyCode: string): string {
    const configuredUnit = String(currency?.CurrencyUnit || currency?.currencyUnit || '').trim();
    if (configuredUnit) return configuredUnit;

    const fallbackUnits: Record<string, string> = {
      AED: 'Dirhams',
      UAE: 'Dirhams',
      USD: 'Dollars',
      INR: 'Rupees',
      IND: 'Rupees'
    };

    return fallbackUnits[currencyCode] || '';
  }

  private getCurrencySubUnit(currency: any, currencyCode: string): string {
    const configuredSubUnit = String(currency?.CurrencySubUnit || currency?.currencySubUnit || '').trim();
    if (configuredSubUnit) return configuredSubUnit;

    const fallbackSubUnits: Record<string, string> = {
      AED: 'Fils',
      UAE: 'Fils',
      USD: 'Cents',
      INR: 'Paise',
      IND: 'Paise'
    };

    return fallbackSubUnits[currencyCode] || '';
  }

  private getCurrencyDecimals(currency: any, currencyCode: string): number {
    const subUnitIn = Number(currency?.SubUnitIn || currency?.subUnitIn || 0);
    if (subUnitIn >= 10) {
      return Math.round(Math.log10(subUnitIn));
    }

    if (subUnitIn > 0 && subUnitIn < 10) {
      return Math.floor(subUnitIn);
    }

    if (currencyCode === 'AED' || currencyCode === 'UAE' || currencyCode === 'USD' || currencyCode === 'INR' || currencyCode === 'IND') {
      return 2;
    }

    return 2;
  }

  private stripOnly(value: string): string {
    return String(value || '')
      .replace(/\s+Only$/i, '')
      .trim();
  }

  private stripCurrencyUnit(value: string, unit: string): string {
    if (!unit) return value;

    return String(value || '')
      .replace(new RegExp(`\\s+${this.escapeRegExp(unit)}$`, 'i'), '')
      .trim();
  }

  private escapeRegExp(value: string): string {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  getLocalTotal(transactions: any[]): number {
    if (!transactions || !transactions.length) return this.fullData?.openingBalance || 0;
    const ledgerType = this.fullData?.ledgerType?.trim();
    let total = this.fullData?.openingBalance || 0;
    transactions.forEach((item) => {
      const drCr = item?.drCr;
      const signedAmount = Number(item?.signedLocalAmt);
      const amount = Number.isFinite(signedAmount)
        ? Math.abs(signedAmount)
        : (+item?.originalLocalAmount || 0);

      if (ledgerType === "Sy Dr") {
        total += drCr === "D" ? amount : -amount;
      }

      if (ledgerType === "Sy Cr") {
        total += drCr === "C" ? amount : -amount;
      }

      if (ledgerType !== "Sy Dr" && ledgerType !== "Sy Cr") {
        total += Number.isFinite(signedAmount) ? signedAmount : amount;
      }
    });

    return total;
  }


  getSignedTotal(transactions: any[]): number {
    if (!transactions || !transactions.length) return 0;

    const ledgerType = this.fullData?.ledgerType?.trim();

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

  getExcelData(): ComplexReportExportConfig {

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
      { key: 'cumulative', label: 'Cumulative' }
    ];

    const rows: ExcelRow[] = [];
    const transactions = this.fullData?.transactions || [];
    const openingBalance = this.fullData?.openingBalance || 0;
    const amountInWordsLines = this.getOutstandingAmountInWordsLines();

    if (openingBalance !== 0) {

      const openingCells: ExcelCell[] = [
        { value: 'Opening Balance' , alignment:{horizontal:'center'} },
        { value: this.formatDate(this.params?.FromDate) , alignment:{horizontal:'center'} },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: this.formatNumber(openingBalance) },
        { value: '' },
        { value: '' },
        { value: this.formatNumber(openingBalance) }
      ];

      rows.push({ cells: openingCells, style: 'data' });
    }

    transactions.forEach((item: any) => {

      const cells: ExcelCell[] = [
        { value: item?.voucherNumber || '' },
        { value: this.formatDate(item?.voucherDate) , alignment:{horizontal:'center'} },
        { value: item?.voucherType || '' , alignment:{horizontal:'center'} },
        { value: item?.naration || '' },
        { value: item?.drCr?.toUpperCase() || '' , alignment:{horizontal:'center'} },
        { value: item?.currencyCode || '' , alignment:{horizontal:'center'} },
        { value: this.formatNumber(item?.signedOriginalCurrency) },
        { value: this.formatNumber(item?.signedLocalAmt) },
        { value: this.formatNumber(item?.signedOutstandingCurrency) },
        { value: this.formatNumber(item?.signedoutstandingLocalAmount) },


        { value: this.formatNumber(item?.cumulativeOutstanding) }
      ];

      rows.push({ cells, style: 'data' });
    });

    if(transactions && transactions.length > 0){
    const totalCells: ExcelCell[] = [

      // TOTAL label should span first 6 columns
      { value: 'TOTAL', colspan: 7 , alignment:{horizontal:'right'} },

      // Totals
      // { value: this.formatNumber(this.getTotal(transactions, 'signedOriginalCurrency')) },
      { value: this.formatNumber(this.getLocalTotal(transactions)) },
      // { value: this.formatNumber(this.getTotal(transactions, 'signedOutstandingCurrency')) },
      { value: '' },
      { value: '' },
      // { value: this.formatNumber(this.getSignedTotal(transactions)) },
      {
        value: this.formatNumber(
          transactions.length > 0
            ? transactions[transactions.length - 1]?.cumulativeOutstanding
            : 0
        )
      }
    ];

    rows.push({ cells: totalCells, style: 'total' });
  }

    amountInWordsLines.forEach((amountInWords, index) => {
      rows.push({
        cells: [
          { value: index === 0 ? 'Amount in words' : '', colspan: 2 },
          { value: amountInWords, colspan: tableHeaders.length - 2 }
        ],
        style: 'data'
      });
    });

    return {
      fileName: 'Statement-Report',
      sheetName: 'StatementReport',
      showFooterNote: true,
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Statement of Acconuts`,
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Branch', value: this.fullData?.BranchInvolved || '' },
          { label: 'Ledger', value: this.fullData?.ledgerName || '' },
          { label: 'Subledger', value: this.fullData?.subledgerName || '' },
          {
          label: 'Address',
          value: `${this.fullData?.customerAddress || ''}${
            this.fullData?.customerAddress && this.fullData?.contactNo ? ', ' : ''
          }${this.fullData?.contactNo || ''}`
         }
        ]
      },
      tableHeaders,
      rows,
      columnWidths: [20, 12, 4, 35, 4, 3, 13, 13, 13, 13, 13],
      additionalTables: this.showBankDetails && this.bankDetails && this.bankDetails.length > 0
        ? [
            {
              title: 'Bank Details',
              headers: [
                'Details',
                ...this.bankDetails.map((bankDetail: any) => `Bank (${this.getBankCurrencyCode(bankDetail)})`)
              ],
              rows: [
                {
                  cells: [
                    { value: 'Beneficiary Name' },
                    ...this.bankDetails.map((bankDetail: any) => ({ value: bankDetail?.BeneficiaryName || '' }))
                  ],
                  style: 'data'
                },
                {
                  cells: [
                    { value: 'Account No.' },
                    ...this.bankDetails.map((bankDetail: any) => ({ value: bankDetail?.BankAccountNo || '', alignment: { horizontal: 'left' } }))
                  ],
                  style: 'data'
                },
                {
                  cells: [
                    { value: 'IFSC' },
                    ...this.bankDetails.map((bankDetail: any) => ({ value: bankDetail?.IFSCCode || '' }))
                  ],
                  style: 'data'
                },
                {
                  cells: [
                    { value: 'Swift Code' },
                    ...this.bankDetails.map((bankDetail: any) => ({ value: bankDetail?.BankCode || '' }))
                  ],
                  style: 'data'
                },
                {
                  cells: [
                    { value: 'Bank Name' },
                    ...this.bankDetails.map((bankDetail: any) => ({ value: bankDetail?.BankName || '' }))
                  ],
                  style: 'data'
                },
                {
                  cells: [
                    { value: 'Branch' },
                    ...this.bankDetails.map((bankDetail: any) => ({ value: bankDetail?.BankAddress || '' }))
                  ],
                  style: 'data'
                }
              ]
            }
          ]
        : undefined,
      notes: [
        'This Statement of Accounts report includes only posted voucher transactions.'
      ]
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
