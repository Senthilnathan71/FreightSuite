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
    return this.fullData?.reportTitle || 'Cash Flow Statement';
  }

  get reportSubTitle(): string {
    return this.fullData?.reportSubTitle || this.getPeriodLabel();
  }

  get currencyLabel(): string {
    return this.fullData?.currencyLabel || this.params?.CurrencyLabel;
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
          title: '',
          rows: this.buildActivityRows(apiData?.operatingActivities, 'NET CASH'),
        },
        {
          title: '',
          rows: this.buildActivityRows(apiData?.investingActivities, 'NET CASH'),
        },
        {
          title: '',
          rows: this.buildActivityRows(apiData?.financingActivities, 'NET CASH'),
        },
        {
          title: '',
          rows: this.buildActivityRows(
            apiData?.netChangeInCashAndCashEquivalents,
            'NET ',
          ),
        },
        {
          title: '',
          rows: this.buildActivityRows(apiData?.cashReconciliation, 'Closing Cash'),
        },
        {
          title: '',
          rows: this.buildActivityRows(
            apiData?.supplementalIncomeExpenseSummary,
            'TOTAL',
          ),
        },
      ].filter((section) => Array.isArray(section.rows) && section.rows.length > 0);
    }

    return this.getDefaultSections();
  }

  get noteRows(): any[] {
    const notes = this.fullData?.notes;
    if (!Array.isArray(notes) || !notes.length) {
      return [];
    }

    return notes.map((note: any) => ({
      title: note?.title || '',
      rows: Array.isArray(note?.rows)
        ? note.rows
        : [
            {
              label: note?.label || note?.text || '',
              rowType: 'detail',
            },
          ],
    }));
  }

  getRowValue(row: any, year: string): any {
    return row?.values?.[year] ?? row?.amounts?.[year] ?? row?.[year] ?? row?.amount ?? row?.value ?? '';
  }

  formatAmount(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '';
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

  isSectionRow(row: any): boolean {
    return row?.rowType === 'section';
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

    this.cashFlowSections.forEach((section) => {
      if (section?.title) {
        pushSectionHeader(section.title);
      }

      (section?.rows || []).forEach((row: any) => {
        if (this.isSpacerRow(row)) {
          rows.push({
            cells: [{ value: '', colspan: totalColumns }],
            style: 'data',
          });
          return;
        }

        pushDataRow(
          row?.label || row?.description || row?.title || '',
          row?.values || this.mapAmountToYears(row?.amount),
          this.isEmphasizedRow(row) ? 'summary' : 'detail',
        );
      });
    });

    this.noteRows.forEach((note: any) => {
      pushSectionHeader(note?.title ? `Note: ${note.title}` : 'Note:');
      (note?.rows || []).forEach((row: any) => {
        pushDataRow(
          row?.label || row?.description || row?.title || '',
          row?.values || this.mapAmountToYears(row?.amount),
          this.isEmphasizedRow(row) ? 'summary' : 'detail',
        );
      });
    });

    return {
      fileName: 'Cash-Flow-Report',
      sheetName: 'CashFlow',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: this.reportTitle,
        additionalInfo: [
          { label: 'Period', value: this.reportSubTitle },
          // { label: 'Currency', value: this.currencyLabel },
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

        return `For the period ${from} to ${to}`;
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
      amount: row?.amount ?? '',
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

  private getDefaultSections(): any[] {
    return [
      {
        title: '',
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
        title: '',
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
        title: '',
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
      {
        title: '',
        rows: [
          { label: 'Total Income', values: {}, rowType: 'summary' },
          { label: 'Total Expenses', values: {}, rowType: 'summary' },
          { label: 'Net Profit / (Loss)', values: {}, rowType: 'summary' },
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
