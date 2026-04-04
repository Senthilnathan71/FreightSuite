import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import {
  ComplexReportExportConfig,
  ExcelCell,
  ExcelHeader,
  ExcelRow,
} from 'src/app/shared/excel-report-service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';
import { PrintHeaderComponent } from '../../print-header/print-header.component';

@Component({
  selector: 'app-cash-flow',
  standalone: true,
  imports: [CommonModule, PrintHeaderComponent, PrintFooterComponent],
  templateUrl: './cash-flow.component.html',
  styles: ``,
})
export class CashFlowComponent {
  currentCompany: any;
  currentBranch: any;
  orientation: 'portrait' | 'landscape' = 'landscape';

  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService,
  ) {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    this.orientation = this.reportRegistryService.getReportConfig('cash-flow').pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get params(): any {
    return this.data?.params || {};
  }

  get reportTitle(): string {
    return this.fullData?.reportTitle || 'Consolidated Statement of Cash flows';
  }

  get reportSubTitle(): string {
    return this.fullData?.reportSubTitle || this.getPeriodLabel();
  }

  get currencyLabel(): string {
    return this.fullData?.currencyLabel || this.params?.CurrencyLabel || 'In Local Currency';
  }

  get yearColumns(): string[] {
    const explicitYears = this.fullData?.yearKeys || this.fullData?.years || this.params?.yearKeys;
    if (Array.isArray(explicitYears) && explicitYears.length) {
      return explicitYears;
    }

    return [this.getYearLabel()];
  }

  get cashFlowSections(): any[] {
    const apiData = this.fullData?.data;

    if (apiData) {
      return [
        {
          title: 'Cash flows from operating activities',
          rows: this.buildActivityRows(apiData?.operatingActivities, 'Net cash'),
        },
        {
          title: 'Cash flow from investing activities',
          rows: this.buildActivityRows(apiData?.investingActivities, 'Net cash'),
        },
        {
          title: 'Cash flows from financing activities',
          rows: this.buildActivityRows(apiData?.financingActivities, 'Net cash'),
        },
        {
          title: '',
          rows: this.buildSummaryRows(),
        },
      ].filter((section) => Array.isArray(section.rows) && section.rows.length > 0);
    }

    return this.getDefaultSections();
  }

  get noteRows(): any[] {
    const breakup = this.fullData?.data?.cashAndCashEquivalents;
    const summary = this.fullData?.summary;

    if (Array.isArray(breakup) && breakup.length) {
      return [
        {
          title: 'Cash & Cash equivalents includes:',
          rows: [
            ...breakup.map((item: any) => ({
              label: item?.label || item?.LedgerName || item?.SubGroupName || item?.GroupName || 'Cash / Bank',
              amount: item?.ClosingBalance ?? 0,
              values: item?.values,
              rowType: 'detail',
            })),
            {
              label: 'Total',
              amount: summary?.closingCashAndCashEquivalents ?? 0,
              values: summary?.closingCashAndCashEquivalents,
              rowType: 'summary',
            },
          ],
        },
      ];
    }

    return [
      {
        title: 'Cash & Cash equivalents includes:',
        rows: [
          {
            label: 'Bank balance',
            amount: this.fullData?.summary?.closingCashAndCashEquivalents ?? 0,
            values: this.fullData?.summary?.closingCashAndCashEquivalents,
            rowType: 'detail',
          },
          {
            label: 'Total',
            amount: this.fullData?.summary?.closingCashAndCashEquivalents ?? 0,
            values: this.fullData?.summary?.closingCashAndCashEquivalents,
            rowType: 'summary',
          },
        ],
      },
    ];
  }

  getRowValue(row: any, year: string): any {
    return row?.values?.[year] ?? row?.amounts?.[year] ?? row?.[year] ?? row?.amount ?? row?.value ?? '';
  }

  formatAmount(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    const num = Number(String(value).replace(/,/g, ''));
    if (Number.isNaN(num)) {
      return String(value);
    }

    const formatted = Math.abs(num).toLocaleString('en-US');
    return num < 0 ? `(${formatted})` : formatted;
  }

  isEmphasizedRow(row: any): boolean {
    return ['summary', 'total'].includes(row?.rowType) || !!row?.isSummary || !!row?.isTotal;
  }

  isSpacerRow(row: any): boolean {
    return row?.rowType === 'spacer' || !!row?.isSpacer;
  }

  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'particulars', label: 'Particulars' },
      ...this.yearColumns.map((year) => ({ key: year, label: year })),
    ];

    const rows: ExcelRow[] = [];
    const totalColumns = tableHeaders.length;

    const pushSectionHeader = (title: string): void => {
      rows.push({
        cells: [
          {
            value: title,
            colspan: totalColumns,
          },
        ],
        style: 'section',
      });
    };

    const pushDataRow = (label: string, valuesByYear: Record<string, any>, rowType: 'detail' | 'summary' = 'detail'): void => {
      const cells: ExcelCell[] = [
        { value: label },
        ...this.yearColumns.map((year) => ({
          value: this.formatAmount(valuesByYear?.[year]),
        })),
      ];

      rows.push({
        cells,
        style: rowType === 'summary' ? 'total' : 'data',
      });
    };

    pushSectionHeader('Cash flows from operating activities');
    pushDataRow(
      'Total Comprehensive Income',
      this.getLabelValues(this.fullData?.data?.operatingActivities, 'Total Comprehensive Income'),
    );
    pushDataRow('Adjustments for:', {});
    pushDataRow(
      'Depreciation',
      this.getLabelValues(this.fullData?.data?.operatingActivities, 'Depreciation / Non-cash adjustments'),
    );
    pushDataRow(
      '(Increase)/Decrease in Trade & Other Receivables',
      this.getLabelValues(this.fullData?.data?.operatingActivities, '(Increase) / Decrease in Trade & Other Receivables'),
    );
    pushDataRow(
      '(Increase)/Decrease in Other Current Assets',
      this.getLabelValues(this.fullData?.data?.operatingActivities, '(Increase) / Decrease in Other Current Assets'),
    );
    pushDataRow(
      'Increase / (Decrease) in Other Current Liabilities',
      this.getLabelValues(this.fullData?.data?.operatingActivities, 'Increase / (Decrease) in Other Current Liabilities'),
    );
    pushDataRow(
      'Net cash (used in) / generated from operating activities (A)',
      this.getLabelValues(this.fullData?.data?.operatingActivities, 'Net cash generated from operating activities (A)'),
      'summary',
    );

    pushSectionHeader('Cash flow from investing activities');
    pushDataRow(
      'Fixed Assets purchased',
      this.getLabelValues(this.fullData?.data?.investingActivities, 'Fixed Assets purchased'),
    );
    pushDataRow(
      'Net cash (used in) / generated from investing activities (B)',
      this.getLabelValues(this.fullData?.data?.investingActivities, 'Net cash generated from investing activities (B)'),
      'summary',
    );

    pushSectionHeader('Cash flows from financing activities');
    pushDataRow(
      'Net cash (used in) / generated from financing activities (C)',
      this.getLabelValues(this.fullData?.data?.financingActivities, 'Net cash generated from financing activities (C)'),
      'summary',
    );

    pushDataRow(
      'Net increase/(decrease) in cash and cash equivalents (A+B+C)',
      this.fullData?.summary?.netIncreaseInCashAndCashEquivalents || {},
      'summary',
    );
    pushDataRow(
      'Cash and cash equivalents at the beginning of the Year',
      this.fullData?.summary?.openingCashAndCashEquivalents || {},
    );
    pushDataRow(
      'Cash and cash equivalents at the end of the Year',
      this.fullData?.summary?.closingCashAndCashEquivalents || {},
      'summary',
    );

    pushSectionHeader('Note: Cash & Cash equivalents includes:');
    (this.noteRows?.[0]?.rows || []).forEach((row: any) => {
      pushDataRow(
        row?.label || '',
        row?.values || this.mapAmountToYears(row?.amount),
        row?.rowType === 'summary' ? 'summary' : 'detail',
      );
    });

    return {
      fileName: 'Cash-Flow-Report',
      sheetName: 'CashFlow',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: this.reportTitle,
        additionalInfo: [
          { label: 'Period', value: this.reportSubTitle },
          { label: 'Currency', value: this.currencyLabel },
        ],
      },
      tableHeaders,
      rows,
      columnWidths: [50, ...this.yearColumns.map(() => 18)],
    };
  }

  private getPeriodLabel(): string {
    const fromDate = this.params?.FromDate;
    const toDate = this.params?.ToDate || this.fullData?.toDate;

    if (!fromDate && !toDate) {
      return 'For the selected period';
    }

    try {
      const from = fromDate
        ? new Date(fromDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '';
      const to = toDate
        ? new Date(toDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '';

      if (from && to) {
        return `For the period ${from} to ${to}`;
      }

      return `For the year ended ${to}`;
    } catch {
      return 'For the selected period';
    }
  }

  private getYearLabel(): string {
    const fromDate = this.params?.FromDate;
    const toDate = this.params?.ToDate || this.fullData?.toDate;

    if (!fromDate && !toDate) {
      return 'Year';
    }

    try {
      const baseDate = toDate ? new Date(toDate) : new Date(fromDate);
      const year = baseDate.getFullYear();
      const shortNextYear = String((year + 1) % 100).padStart(2, '0');
      const shortYear = String(year % 100).padStart(2, '0');

      if (fromDate) {
        const from = new Date(fromDate);
        const to = toDate ? new Date(toDate) : from;

        if (from.getFullYear() !== to.getFullYear()) {
          return `${from.getFullYear()} - ${String(to.getFullYear()).slice(-2)}`;
        }

        const financialYearStart = to.getMonth() >= 3 ? year : year - 1;
        return `${financialYearStart} - ${String((financialYearStart + 1) % 100).padStart(2, '0')}`;
      }

      return `${year} - ${shortNextYear || shortYear}`;
    } catch {
      return 'Year';
    }
  }

  private buildActivityRows(rows: any[], summaryKeyword: string): any[] {
    if (!Array.isArray(rows) || !rows.length) {
      return [];
    }

    const mappedRows: any[] = rows.map((row: any, index: number) => ({
      label: row?.label || '',
      amount: row?.amount ?? 0,
      values: row?.values,
      rowType:
        row?.rowType ||
        (String(row?.label || '').toLowerCase().includes(summaryKeyword.toLowerCase()) ||
        index === rows.length - 1
          ? 'summary'
          : 'detail'),
    }));

    mappedRows.splice(mappedRows.length, 0, { rowType: 'spacer' });
    return mappedRows;
  }

  private buildSummaryRows(): any[] {
    const summary = this.fullData?.summary;
    if (!summary) {
      return [];
    }

    return [
      {
        label: 'Net increase/(decrease) in cash and cash equivalents (A+B+C)',
        amount: summary?.netIncreaseInCashAndCashEquivalents ?? 0,
        values: summary?.netIncreaseInCashAndCashEquivalents,
        rowType: 'summary',
      },
      {
        label: 'Cash and cash equivalents at the beginning of the Year',
        amount: summary?.openingCashAndCashEquivalents ?? 0,
        values: summary?.openingCashAndCashEquivalents,
        rowType: 'detail',
      },
      {
        label: 'Cash and cash equivalents at the end of the Year',
        amount: summary?.closingCashAndCashEquivalents ?? 0,
        values: summary?.closingCashAndCashEquivalents,
        rowType: 'summary',
      },
    ];
  }

  private getDefaultSections(): any[] {
    return [
      {
        title: 'Cash flows from operating activities',
        rows: [
          { label: 'Total Comprehensive Income', values: {}, rowType: 'detail' },
          { label: 'Adjustments for:', values: {}, rowType: 'detail' },
          { label: 'Depreciation', values: {}, rowType: 'detail' },
          { label: 'End of service benefits', values: {}, rowType: 'detail' },
          {
            label: 'Net cash (used in) / generated from operating activities (A)',
            values: {},
            rowType: 'summary',
          },
          { rowType: 'spacer' },
        ],
      },
      {
        title: 'Cash flow from investing activities',
        rows: [
          { label: 'Fixed Assets purchased', values: {}, rowType: 'detail' },
          {
            label: 'Net cash (used in) / generated from investing activities (B)',
            values: {},
            rowType: 'summary',
          },
          { rowType: 'spacer' },
        ],
      },
      {
        title: 'Cash flows from financing activities',
        rows: [
          {
            label: 'Net cash (used in) / generated from financing activities (C)',
            values: {},
            rowType: 'summary',
          },
          { rowType: 'spacer' },
          {
            label: 'Net increase/(decrease) in cash and cash equivalents (A+B+C)',
            values: {},
            rowType: 'summary',
          },
          { label: 'Cash and cash equivalents at the beginning of the Year', values: {}, rowType: 'detail' },
          { label: 'Cash and cash equivalents at the end of the Year', values: {}, rowType: 'summary' },
        ],
      },
    ];
  }

  private getLabelValues(rows: any[], label: string): Record<string, any> {
    const match = Array.isArray(rows)
      ? rows.find((row: any) => String(row?.label || '').trim().toLowerCase() === label.trim().toLowerCase())
      : null;

    if (match?.values) {
      return match.values;
    }

    return this.mapAmountToYears(match?.amount);
  }

  private mapAmountToYears(amount: any): Record<string, any> {
    return this.yearColumns.reduce((acc: Record<string, any>, year: string) => {
      acc[year] = amount ?? '';
      return acc;
    }, {});
  }
}
