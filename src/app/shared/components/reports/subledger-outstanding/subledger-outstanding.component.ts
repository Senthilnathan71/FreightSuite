import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';
import { OperationService } from 'src/app/modules/operation/operation.service';

@Component({
  selector: 'app-subledger-outstanding',
  standalone: true,
  imports: [CustomDatePipe, CommonModule, PrintHeaderComponent, PrintFooterComponent],
  templateUrl: './subledger-outstanding.component.html',
  styles: ``
})
export class SubledgerOutstandingComponent {

  
    currentCompany: any;
    currentBranch: any;
    salesmanList: any[];
    companyCurrency: any;
    currentCurrencyCode: string = '';
    currentCurrency: number;
    orientation: 'portrait' | 'landscape' = 'portrait';
    bankDetails: any[] = [];
    showBankDetails = false;
    isBankDetailsLoading = false;
  
    constructor(
      @Inject(REPORT_DATA) public data: any,
      private appSettingsService: AppSettingsService,
      private leadService: LeadService,
      private reportRegistryService: ReportRegistryService,
      private companySettings: CompanySettingsManagerService,
      private operationService: OperationService,
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
      this.currentCurrency = Number(this.currentCompany?.CurrencyMasterSid);
  
      this.operationService
        .getCompanyConfig(this.currentCompany?.CompanyMasterSid, 'OSandStatementShowBankDetails')
        .subscribe((resp: any) => {
          const configValue = resp?.data;
          this.showBankDetails = configValue === 'Y';
  
          if (!this.showBankDetails) {
            this.bankDetails = [];
            return;
          }
  
          this.isBankDetailsLoading = true;
          this.getBankDetails().subscribe((bankResp: any) => {
            this.bankDetails = bankResp?.data || [];
            this.isBankDetailsLoading = false;
          }, () => {
            this.bankDetails = [];
            this.isBankDetailsLoading = false;
          });
        });
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

  get ledgerWiseData(): any[] {
    return this.fullData?.ledgerWiseData || [];
  }

  get currencyWiseMergedSummary(): any[] {
    const map = new Map<string, any>();

    (this.ledgerWiseData || []).forEach((ledger: any) => {
      (ledger?.currencyWiseSummary || []).forEach((cur: any) => {
        const code = (cur?.currencyCode || '').trim();
        if (!code) return;

        if (!map.has(code)) {
          map.set(code, {
            currencyCode: code,
            totalOutstanding: 0,
            bucket_0_30: 0,
            bucket_31_60: 0,
            bucket_61_90: 0,
            bucket_91_120: 0,
            bucket_121_above: 0,
          });
        }

        const row = map.get(code);
        row.totalOutstanding += Number(cur?.totalOutstanding || 0);
        row.bucket_0_30 += Number(cur?.bucket_0_30 || 0);
        row.bucket_31_60 += Number(cur?.bucket_31_60 || 0);
        row.bucket_61_90 += Number(cur?.bucket_61_90 || 0);
        row.bucket_91_120 += Number(cur?.bucket_91_120 || 0);
        row.bucket_121_above += Number(cur?.bucket_121_above || 0);
      });
    });

    return Array.from(map.values()).sort((a, b) => a.currencyCode.localeCompare(b.currencyCode));
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
  
  getSignedTotal(transactions: any[], ledgerType?: string): number {
    if (!transactions || !transactions.length) return 0;

    const resolvedLedgerType = (ledgerType || this.fullData?.ledgerType || '').trim();
    if (!resolvedLedgerType) {
      return transactions.reduce((sum, item) => sum + (Number(item?.signedOutstandingLocal) || 0), 0);
    }

    let total = 0;
  
      transactions.forEach((item) => {
        const drCr = item?.drCr;
        const amount = +item?.outstandingLocalAmount || 0;
  
      if (resolvedLedgerType === "Sy Dr") {
        total += drCr === "D" ? amount : -amount;
      }

      if (resolvedLedgerType === "Sy Cr") {
        total += drCr === "C" ? amount : -amount;
      }
    });

    return total;
  }

  getLocalTotal(transactions: any[], ledgerType?: string): number {
    if (!transactions || !transactions.length) return 0;
    const resolvedLedgerType = (ledgerType || this.fullData?.ledgerType || '').trim();
    if (!resolvedLedgerType) {
      return transactions.reduce((sum, item) => sum + (Number(item?.signedOriginalLocal) || 0), 0);
    }
    let total = 0;
    transactions.forEach((item) => {
      const drCr = item?.drCr;
      const amount = +item?.originalLocalAmount || 0;

      if (resolvedLedgerType === "Sy Dr") {
        total += drCr === "D" ? amount : -amount;
      }

      if (resolvedLedgerType === "Sy Cr") {
        total += drCr === "C" ? amount : -amount;
      }
    });

    return total;
  }

  getNetProfit(transactions: any[]): number {
    if (!transactions || !transactions.length) return 0;

    let drTotal = 0;
    let crTotal = 0;

    transactions.forEach((item) => {
      const rawAmount = Number(item?.outstandingLocalAmount ?? item?.signedOutstandingLocal ?? 0) || 0;
      const amount = Math.abs(rawAmount);
      const drCr = String(item?.drCr || '').trim().toUpperCase();
      const isDebit = drCr === 'D' || drCr === 'DR' || drCr.startsWith('DEB');
      const isCredit = drCr === 'C' || drCr === 'CR' || drCr.startsWith('CRE');

      if (isDebit) {
        drTotal += amount;
      } else if (isCredit) {
        crTotal += amount;
      } else {
        // Fallback when Dr/Cr text is missing/invalid: infer from sign.
        if (rawAmount < 0) crTotal += amount;
        else drTotal += amount;
      }
    });

    // Rule: netProfit = abs(Dr) - abs(Cr)
    return drTotal - crTotal;
  }

  getOverallNetProfit(ledgers: any[]): number {
    if (!ledgers || !ledgers.length) return 0;
    return ledgers.reduce((sum, ledger) => {
      return sum + this.getNetProfit(ledger?.transactions || []);
    }, 0);
  }

  getOverallLocalTotal(ledgers: any[]): number {
    if (!ledgers || !ledgers.length) return 0;
    return ledgers.reduce((sum, ledger) => {
      return sum + this.getLocalTotal(ledger?.transactions || [], ledger?.ledgerType);
    }, 0);
  }

  getOverallSignedTotal(ledgers: any[]): number {
    if (!ledgers || !ledgers.length) return 0;
    return ledgers.reduce((sum, ledger) => {
      return sum + this.getSignedTotal(ledger?.transactions || [], ledger?.ledgerType);
    }, 0);
  }

  getOverallCumulativeTotal(ledgers: any[]): number {
    if (!ledgers || !ledgers.length) return 0;
    return ledgers.reduce((sum, ledger) => {
      const txns = ledger?.transactions || [];
      const last = txns.length ? Number(txns[txns.length - 1]?.cumulativeOutstanding || 0) : 0;
      return sum + last;
    }, 0);
  }

  getOverallNetProfitLocal(ledgers: any[]): number {
    return this.getNetFromLedgerTotals(ledgers, 'local');
  }

  getOverallNetProfitOutstandingLocal(ledgers: any[]): number {
    return this.getNetFromLedgerTotals(ledgers, 'outstanding');
  }

  getOverallNetProfitCumulative(ledgers: any[]): number {
    return this.getNetFromLedgerTotals(ledgers, 'cumulative');
  }

  // Calculate NET PROFIT only from each ledger TOTAL row values.
  // (No per-transaction Dr/Cr parsing.)
  private getNetFromLedgerTotals(ledgers: any[], mode: 'local' | 'outstanding' | 'cumulative'): number {
    if (!ledgers || !ledgers.length) return 0;

    return ledgers.reduce((sum, ledger) => {
      const transactions = ledger?.transactions || [];
      const signedTotal = this.getSignedTotal(transactions, ledger?.ledgerType);
      const sign = signedTotal < 0 ? -1 : 1;

      let base = 0;
      if (mode === 'local') {
        base = Math.abs(this.getLocalTotal(transactions, ledger?.ledgerType));
      } else if (mode === 'outstanding') {
        base = Math.abs(this.getSignedTotal(transactions, ledger?.ledgerType));
      } else {
        const lastCumulative = transactions.length
          ? Number(transactions[transactions.length - 1]?.cumulativeOutstanding || 0)
          : 0;
        base = Math.abs(lastCumulative);
      }

      return sum + (sign * base);
    }, 0);
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
  
    getBankDetails(): Observable<any> {
      const payload = {
        CurrencyMasterSid: this.currentCurrency,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
      };
  
      return this.operationService.getBankDetails(payload);
    }
  
  
  getExcelData(): ComplexReportExportConfig {

    const rows: ExcelRow[] = [];

    const ledgers = this.ledgerWiseData || [];
  
  
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
  
  
      ledgers.forEach((ledger: any, ledgerIndex: number) => {
        const transactions = ledger?.transactions || [];

        rows.push({
          cells: [
            { value: `${ledger?.ledgerName || '-'}`, colspan: 12 }
          ],
          style: 'section'
        });

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
            { value: item?.ageingDays ?? item?.AgeingDays ?? item?.ageing ?? '' , alignment:{horizontal:'center'} },
          ],
          style: 'data'
        });
      });

        if (transactions.length > 0) {
          rows.push({
            cells: [
              { value: 'TOTAL :', colspan: 7 , alignment:{horizontal:'right'} },
              { value: this.formatNumber(this.getLocalTotal(transactions, ledger?.ledgerType)) },
              { value: '' },
              { value: this.formatNumber(this.getSignedTotal(transactions, ledger?.ledgerType)) },
              {
                value: this.formatNumber(
                  transactions?.[transactions.length - 1]?.cumulativeOutstanding || 0
                )
              },
              { value: '' }
            ],
            style: 'total'
          });
        }

        if (ledgerIndex < ledgers.length - 1) {
          rows.push({
            cells: [{ value: '', colspan: 12 }],
            style: 'data'
          });
        }
      });

      if (ledgers.length > 0) {
        rows.push({
          cells: [
            { value: 'NET PROFIT :', colspan: 7, alignment: { horizontal: 'right' } },
            { value: this.formatNumber(this.getOverallNetProfitLocal(ledgers)) },
            { value: '' },
            { value: this.formatNumber(this.getOverallNetProfitOutstandingLocal(ledgers)) },
            { value: this.formatNumber(this.getOverallNetProfitCumulative(ledgers)) },
            { value: '' }
          ],
          style: 'grandTotal'
        });
      }
  
      return {
        fileName: 'Subledger-Outstanding-Report',
        sheetName: 'SubledgerOutstanding',
        showFooterNote: true,
        reportHeader: {
          companyName: this.currentCompany?.companyName || 'Company',
          reportTitle: `Subledger Outstanding Report`,
          additionalInfo: [
            { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
            { label: 'Branch', value: this.fullData?.branchInvolved || '' },
            { label: 'Subledger', value: this.fullData?.subledgerName || '' }
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
          rows: this.currencyWiseMergedSummary.map((cur: any) => ({
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
        },
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
