import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import {
  ComplexReportExportConfig,
  ExcelHeader,
  ExcelRow,
} from 'src/app/shared/excel-report-service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';

@Component({
  selector: 'app-profit-loss-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule, PrintHeaderComponent,PrintFooterComponent],
  templateUrl: './profit-loss-report.component.html',
  styles: ``,
})
export class ProfitLossReportComponent {
  currentCompany: any;
  currentBranch: any;
  yearKeys: string[] = [];
  orientation: 'portrait' | 'landscape' = 'portrait';

  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private reportRegistryService: ReportRegistryService,
  ) {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    this.orientation =
      this.reportRegistryService.getReportConfig('profit-loss').pdfOrientation;

    if (Array.isArray(this.fullData?.yearKeys) && this.fullData.yearKeys.length) {
      this.yearKeys = this.fullData.yearKeys;
    } else if (this.reportRows.length > 0) {
      this.yearKeys = Object.keys(this.reportRows[0]?.amounts || {});
    }
  }

  get fullData(): any {
    return this.data || {};
  }

  get params(): any {
    return this.data?.params || {};
  }

  get reportRows(): any[] {
    return Array.isArray(this.fullData?.profitLoss) ? this.fullData.profitLoss : [];
  }

  get displayRows(): any[] {
    const rows: any[] = [];

    for (const row of this.reportRows) {
      if (row?.rowType === 'section') {
        rows.push({
          rowType: 'sectionTitle',
          titleLabel: row.sectionLabel || '',
          ledgerLabel: '',
          amounts: {},
        });
        continue;
      }

      rows.push({
        ...row,
        titleLabel: row.groupLabel || '',
        showTitle: false,
        titleRowSpan: 1,
      });
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const isGroupStart = row.rowType === 'detail' && !!row.titleLabel;

      if (!isGroupStart) {
        continue;
      }

      let span = 1;
      for (let j = i + 1; j < rows.length; j++) {
        const nextRow = rows[j];
        if (nextRow.rowType !== 'detail' || nextRow.titleLabel) {
          break;
        }
        span += 1;
      }

      row.showTitle = true;
      row.titleRowSpan = span;
    }

    return rows;
  }

  shouldRenderTitleCell(row: any): boolean {
    return row.rowType === 'sectionTitle' || row.rowType !== 'detail' || row.showTitle;
  }

  getExcelData(): ComplexReportExportConfig {
    const yearKeys: string[] = this.yearKeys || [];
    const totalColumns = yearKeys.length + 2;

    const tableHeaders: ExcelHeader[] = [
      { key: 'title', label: 'Subgroup' },
      { key: 'ledger', label: 'Ledger' },
      ...yearKeys.map((y) => ({ key: y, label: y })),
    ];

    const rows: ExcelRow[] = this.displayRows.map((row) => {
      if (row.rowType === 'sectionTitle') {
        return {
          cells: [
            {
              value: row.titleLabel || '',
              colspan: totalColumns,
              fillColor: row.titleLabel?.toLowerCase()?.includes('expense') ? '#f4dada' : '#d9eaf7',
            },
          ],
          style: 'section',
        };
      }

      return {
        cells: [
          {
            value: row.rowType === 'detail' ? row.titleLabel || '' : '',
          },
          {
            value: row.ledgerLabel || row.LedgerName || '',
            alignment: {
              horizontal: row.rowType === 'total' || row.rowType === 'summary' ? 'right' : 'left',
            },
          },
          ...yearKeys.map((y) => ({
            value: this.formatNumber(row.amounts?.[y] ?? 0),
          })),
        ],
        style:
          row.rowType === 'summary'
            ? 'grandTotal'
            : row.rowType === 'total'
              ? 'total'
              : 'data'
      };
    });

    return {
      fileName: 'Profit-And-Loss-Report',
      sheetName: 'Profit & Loss',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: 'Profit and Loss Report',
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Branch', value: this.fullData?.BranchInvolved || '' },
        ],
      },
      tableHeaders,
      rows,
      columnWidths: [28, 42, ...yearKeys.map(() => 18)],
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
