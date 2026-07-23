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
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';

@Component({
  selector: 'app-trial-balance-level-wise',
  standalone: true,
  imports: [
    CustomDatePipe,
    CommonModule,
    PrintHeaderComponent,
    PrintFooterComponent,
  ],
  templateUrl: './trial-balance-level-wise.component.html',
  styles: ``,
})
export class TrialBalanceLevelWiseComponent {
  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  branchList: any[];
  groupedData: any[] = [];
  showSubTotal: boolean = false;
  COAList: any[] = [];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private masterService: MasterService,
    private reportRegistryService: ReportRegistryService,
  ) {}

  get params(): any {
    return this.data?.parameters || {};
  }

  get showGroupCol(): boolean {
    return !this.params?.CategoryWise;
  }

  get showSubGroupCol(): boolean {
    return !this.params?.CategoryWise && !this.params?.GroupWise;
  }

  get showLedgerCol(): boolean {
    return (
      !this.params?.CategoryWise &&
      !this.params?.GroupWise &&
      !this.params?.SubgroupWise
    );
  }

  get labelColspan(): number {
    let count = 1; // Category is always shown
    if (this.showGroupCol) count++;
    if (this.showSubGroupCol) count++;
    if (this.showLedgerCol) count++;
    if (this.params?.Subledger) count++;
    return count;
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    this.prepareGroupedData();
    this.showSubTotal = this.params?.showSubtotals === true;
    this.orientation = this.reportRegistryService.getReportConfig(
      'trial-balance-level',
    ).pdfOrientation;
  }

  getBranchNameById(id: number): string {
    if (!id || !this.branchList?.length) return '';
    const branch = this.branchList.find((b) => b.BranchMasterSid === id);
    return branch ? branch.branchName : '';
  }

  getGroupName(id: number): string {
    if (!id || !this.COAList?.length) return '';
    const group = this.COAList.find((b) => b.COAMasterSid === id);
    return group ? group.GroupName : '';
  }

  getSubGroupName(id: number): string {
    if (!id || !this.COAList?.length) return '';
    const group = this.COAList.find((b) => b.COAMasterSid === id);
    return group ? group.SubGroupName : '';
  }

  prepareGroupedData(): void {
    const rawItems = this.data?.items || [];
    const items = Array.isArray(rawItems) ? rawItems : Object.values(rawItems);

    items.sort(
      (a, b) =>
        (categoryOrder[a.Category] || 99) - (categoryOrder[b.Category] || 99) ||
        (a.GroupName || '').localeCompare(b.GroupName || '') ||
        (a.SubGroupName || '').localeCompare(b.SubGroupName || '') ||
        (a.LedgerName || '').localeCompare(b.LedgerName || '') ||
        (a.SubledgerName || '').localeCompare(b.SubledgerName || ''),
    );

    if (this.params?.Subledger === true) {
      let lastLedger = '';

      items.forEach((item, index) => {
        item.showType = false;
        item.showGroup = false;
        item.showSubGroup = false;
        item.showLedger = false;
        item.showsubledger = false;
        if (item.LedgerName !== lastLedger) {
          item.showType = true;
          item.showGroup = true;
          item.showSubGroup = true;
          item.showLedger = true;
          item.Subledger = true;
          lastLedger = item.LedgerName;
        }
      });
    }

    const groups: any = {};

    items.forEach((item) => {
      const key = item.SubGroupName || 'NO SUBGROUP';

      if (!groups[key]) {
        groups[key] = {
          items: [],
          totals: {
            OpeningDebit: 0,
            OpeningCredit: 0,
            CurrentDebit: 0,
            CurrentCredit: 0,
            ClosingDebit: 0,
            ClosingCredit: 0,
            ClosingNet: 0,
          },
        };
      }

      groups[key].items.push(item);

      Object.keys(groups[key].totals).forEach((k) => {
        groups[key].totals[k] += Number(item[k]) || 0;
      });
    });

    this.groupedData = Object.values(groups);
  }

  get fullData(): any {
    return this.data || {};
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

  getExcelData(): ComplexReportExportConfig {
    const showSubledger = this.params?.Subledger === true;
    const subTotal = this.params?.SubTotal === true;
    /* ================= TABLE HEADERS ================= */

    const tableHeaders: ExcelHeader[] = [
      { key: 'type', label: 'Category' },
      ...(this.showGroupCol ? [{ key: 'group', label: 'Group' }] : []),
      ...(this.showSubGroupCol ? [{ key: 'subGroup', label: 'Sub Group' }] : []),
      ...(this.showLedgerCol ? [{ key: 'ledger', label: 'Ledger' }] : []),
      ...(showSubledger ? [{ key: 'subledger', label: 'Subledger' }] : []),
      { key: 'openingDebit', label: 'Opening Debit' },
      { key: 'openingCredit', label: 'Opening Credit' },
      { key: 'currentDebit', label: 'Current Debit' },
      { key: 'currentCredit', label: 'Current Credit' },
      { key: 'closingDebit', label: 'Closing Debit' },
      { key: 'closingCredit', label: 'Closing Credit' },
      { key: 'closingNet', label: 'Closing Net Amount' },
    ];

    const rows: ExcelRow[] = [];

    /* ================= DATA ROWS ================= */

    for (const group of this.groupedData || []) {
      for (const item of group.items || []) {
        const cells: ExcelCell[] = [
          { value: item.Category || '' },
          ...(this.showGroupCol ? [{ value: item.GroupName || '' }] : []),
          ...(this.showSubGroupCol ? [{ value: item.SubGroupName || '' }] : []),
          ...(this.showLedgerCol ? [{ value: item.LedgerName || '' }] : []),
          ...(showSubledger ? [{ value: item.SubledgerName || '' }] : []),
          { value: this.formatNumber(item.OpeningDebit) },
          { value: this.formatNumber(item.OpeningCredit) },
          { value: this.formatNumber(item.CurrentDebit) },
          { value: this.formatNumber(item.CurrentCredit) },
          { value: this.formatNumber(item.ClosingDebit) },
          { value: this.formatNumber(item.ClosingCredit) },
          { value: this.formatNumber(item.ClosingNet) },
        ];

        rows.push({ cells, style: 'data' });
      }

      /* ================= SUB TOTAL ================= */

      if (this.params?.SubTotal) {
        const subTotalCells: ExcelCell[] = [
          {
            value: 'Total',
            colspan: this.labelColspan,
            alignment: { horizontal: 'right' },
          },
          { value: this.formatNumber(group.totals?.OpeningDebit) },
          { value: this.formatNumber(group.totals?.OpeningCredit) },
          { value: this.formatNumber(group.totals?.CurrentDebit) },
          { value: this.formatNumber(group.totals?.CurrentCredit) },
          { value: this.formatNumber(group.totals?.ClosingDebit) },
          { value: this.formatNumber(group.totals?.ClosingCredit) },
          { value: this.formatNumber(group.totals?.ClosingNet) },
        ];

        rows.push({ cells: subTotalCells, style: 'total' });
      }
    }

    /* ================= GRAND TOTAL ================= */

    if (this.data?.grandTotal) {
      const grandTotalCells: ExcelCell[] = [
        {
          value: 'Grand Total',
          colspan: this.labelColspan,
          alignment: { horizontal: 'right' },
        },
        { value: this.formatNumber(this.data.grandTotal.TotalOpeningDebit) },
        { value: this.formatNumber(this.data.grandTotal.TotalOpeningCredit) },
        { value: this.formatNumber(this.data.grandTotal.TotalCurrentDebit) },
        { value: this.formatNumber(this.data.grandTotal.TotalCurrentCredit) },
        { value: this.formatNumber(this.data.grandTotal.TotalClosingDebit) },
        { value: this.formatNumber(this.data.grandTotal.TotalClosingCredit) },
        { value: this.formatNumber(this.data.grandTotal.Difference) },
      ];

      rows.push({ cells: grandTotalCells, style: 'grandTotal' });
    }

    /* ================= EXPORT CONFIG ================= */

    return {
      fileName: 'Trial-Balance-Level-Wise',
      sheetName: 'TrialBalanceLevelWise',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Trial Balance Level Wise`,
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.fromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.toDate) },
          { label: 'Branch', value: this.params?.BranchInvolved || '' },
          { label: 'Level', value: this.params?.Level || '' }
        ],
      },
      tableHeaders,
      rows,
      columnWidths: [
        10, // Category (always shown)
        ...(this.showGroupCol ? [15] : []), // Group
        ...(this.showSubGroupCol ? [15] : []), // Sub Group
        ...(this.showLedgerCol ? [20] : []), // Ledger
        ...(showSubledger ? [18] : []), // Subledger
        15, 15, 15, 15, 15, 15, 18, // amount columns
      ],
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

const categoryOrder: Record<string, number> = {
  Asset: 1,
  Liability: 2,
  Expense: 3,
  Income: 4,
};
