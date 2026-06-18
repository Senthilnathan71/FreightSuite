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
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import {
  REPORT_DATA,
  ReportCard,
  ReportService,
} from 'src/app/shared/services/report.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';

// Single shape (optional fields) rather than a discriminated union, so the strict template
// checker doesn't need to narrow `item.row` / `item.dept` inside the @switch.
interface DisplayItem {
  kind: 'band' | 'leaf' | 'child' | 'grand';
  row?: any;
  dept?: any;
}

/**
 * "Group by Salesman" variant of the Ageing Report.
 *
 * Backend returns COLLAPSED rows ordered Customer -> Branch -> Salesperson; a salesperson with several
 * departments is one row carrying `departmentBreakdown[]`. Each customer has one "Unallocated" row per
 * currency (department-less vouchers: Non-Job / JV / Receipt-or-Payment).
 *
 * Preview is PAGINATED: rows are flattened into display items (band / leaf / child / grand) and chunked
 * into A4 pages, each repeating the header. Departments are expanded by default (and always in PDF/Excel).
 * Aggregates live in the band, never in the Outstanding column, so the column sums to the Grand Total —
 * an expanded multi-dept parent shows blank amounts and the department children carry them.
 */
@Component({
  selector: 'app-ageing-report-salesman',
  standalone: true,
  imports: [CommonModule, CustomDatePipe, PrintHeaderComponent, PrintFooterComponent],
  templateUrl: './ageing-report-salesman.component.html',
  styleUrls: ['./ageing-report-salesman.component.scss'],
})
export class AgeingReportSalesmanComponent implements OnInit {
  currentCompany: any;
  currentBranch: any;
  orientation: 'portrait' | 'landscape' = 'landscape';

  /** Display rows chunked into A4-sized pages for the paginated preview. */
  pages: DisplayItem[][] = [];

  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService,
    private reportService: ReportService,
  ) {}

  get fullData(): any {
    return this.data || {};
  }

  get params(): any {
    return this.data?.params || {};
  }

  get bucketLabels(): string[] {
    return this.fullData?.bucketLabels || [];
  }

  get rows(): any[] {
    return this.fullData?.rows || [];
  }

  /** When the result spans a single customer branch, the Branch column is hidden. */
  get singleBranch(): boolean {
    return !!this.fullData?.singleBranch;
  }

  /** Identity columns before the amounts: [Branch?] + Salesperson + Department. */
  get identitySpan(): number {
    return (this.singleBranch ? 0 : 1) + 2;
  }

  /** Total leaf columns: identity + OS Local + buckets + On Acc Local. */
  get colCount(): number {
    return this.identitySpan + this.bucketLabels.length + 2;
  }

  /**
   * Rows that fit one A4 page in the PDF (pdfmake, fontSize 7 + compact 2pt padding -> ~14.5pt/row
   * incl. the repeating table-header row). Measured against the generated PDF: 26 rows/page landscape,
   * ~41 portrait. Every display item maps to exactly one PDF table row, so chunking the preview by this
   * count keeps its page total in step with the PDF.
   */
  private get rowsPerPage(): number {
    return this.orientation === 'portrait' ? 41 : 26;
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    const cfg = this.reportRegistryService.getReportConfig('ageing-report');
    this.orientation = (cfg?.pdfOrientation as any) || 'landscape';
    // Departments expanded by default.
    for (const r of this.rows) r.expanded = this.hasBreakdown(r);
    this.buildPages();
  }

  spLabel(row: any): string {
    return row?.salespersonName || '';
  }

  branchLabel(row: any): string {
    return row?.branchLabel || '';
  }

  /** A multi-department salesperson row can expand to show the per-department split. */
  hasBreakdown(row: any): boolean {
    return !row?.isOnAccount && (row?.departmentCount ?? 0) > 1;
  }

  /** Parent shows its own amounts unless it is a multi-dept row currently expanded. */
  showAmounts(row: any): boolean {
    return !(this.hasBreakdown(row) && row.expanded);
  }

  toggle(row: any): void {
    if (this.hasBreakdown(row)) {
      row.expanded = !row.expanded;
      this.buildPages();
    }
  }

  // ----- Pagination -----

  private buildDisplayItems(): DisplayItem[] {
    const items: DisplayItem[] = [];
    for (const row of this.rows) {
      if (row.isFirstOfCustomer) items.push({ kind: 'band', row });
      items.push({ kind: 'leaf', row });
      if (this.hasBreakdown(row) && row.expanded && row.departmentBreakdown?.length) {
        for (const d of row.departmentBreakdown) items.push({ kind: 'child', row, dept: d });
      }
    }
    if (this.rows.length) items.push({ kind: 'grand' });
    return items;
  }

  private buildPages(): void {
    const items = this.buildDisplayItems();
    const budget = this.rowsPerPage;

    // Each display item is one PDF table row of (near) equal height, so chunk by a flat row count
    // rather than a weighted budget — this is what keeps the preview's page total in step with the PDF.
    const pages: DisplayItem[][] = [];
    let cur: DisplayItem[] = [];
    for (const it of items) {
      // Break if the page is already full, or a band would be left orphaned at the very bottom.
      const needBreak =
        cur.length > 0 &&
        (cur.length >= budget || (it.kind === 'band' && cur.length >= budget - 1));
      if (needBreak) {
        pages.push(cur);
        cur = [];
      }
      cur.push(it);
    }
    if (cur.length) pages.push(cur);
    // Empty -> no pages; the template renders a dedicated "no data" page instead.
    this.pages = pages;
  }

  /** Format a number; zeros / blanks render as an em-dash to declutter the grid. */
  fmt(value: any): string {
    if (value === null || value === undefined) return '—';
    const num = Number(value);
    if (isNaN(num)) return '—';
    if (Math.round(num * 100) === 0) return '—';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /** Open the per-customer Outstanding Report (from the band's O/S button). */
  async openOutstandingReportForParty(row: any): Promise<void> {
    const subledgerMasterSid = Number(row?.SubledgerMasterSid ?? 0);
    if (!subledgerMasterSid) {
      this.appSettingsService.showError(
        'Unable to open Outstanding: Subledger ID not found for this customer.',
      );
      return;
    }

    const branchFromParams =
      this.params?.Branch ??
      this.params?.Branches ??
      this.params?.BranchMasterSids ??
      (this.params?.BranchMasterSid ? [this.params.BranchMasterSid] : []);

    const payload: any = {
      ToDate: this.params?.ToDate || this.fullData?.concludedUpto,
      Ledger:
        this.params?.Ledger ??
        this.params?.LedgerMasterSid ??
        this.fullData?.LedgerMasterSid,
      Branch: Array.isArray(branchFromParams) ? branchFromParams : [branchFromParams],
      Subledger: subledgerMasterSid,
      companyId: this.params?.companyId ?? this.currentCompany?.CompanyMasterSid,
      LedgerName: this.fullData?.LedgerName,
      SubledgerName: row?.customerName || '',
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
        delete payload[key];
      }
    });

    const outstandingReportCard: ReportCard = {
      ReportMasterSid: 0,
      ReportName: 'outstanding-report',
      ReportDisplayName: 'Outstanding Report',
      ReportMenuSid: 0,
      ReportFormat: 'PDF',
      ReportType: 'REPORT',
      Orientation: 'P',
      ReportMasterDetail: [],
    };

    await this.reportService.openReportModal(
      outstandingReportCard,
      undefined,
      payload,
    );
  }

  /**
   * Excel/PDF export data. Departments are ALWAYS expanded here: a multi-dept salesperson becomes a
   * blank-amount sub-header followed by its department rows (which carry the amounts), so the Outstanding
   * column stays summable. The customer band puts the name on the left and Total/Credit on the right.
   */
  getExcelData(): ComplexReportExportConfig {
    const buckets = this.bucketLabels || [];
    const showBranch = !this.singleBranch;
    const identityCount = (showBranch ? 1 : 0) + 2; // branch?, salesperson, department

    const tableHeaders: ExcelHeader[] = [
      ...(showBranch ? [{ key: 'branch', label: 'Branch' }] : []),
      { key: 'salesperson', label: 'Salesperson' },
      { key: 'department', label: 'Department' },
      { key: 'oslocal', label: 'OS Local' },
      ...buckets.map((label: string) => ({ key: label, label })),
      { key: 'onacc', label: 'On Acc Local' },
    ];
    const totalCols = tableHeaders.length;

    const amt = (v: any): ExcelCell => ({ value: this.fmt(v), num: Number(v) || 0 });
    const rows: ExcelRow[] = [];

    for (const r of this.rows) {
      // Customer band: name (left) + Total/Credit (right).
      if (r.isFirstOfCustomer) {
        const totalsText =
          `Total (Local): ${this.formatNumber(r.customerTotalLocal)}` +
          `      Credit Days: ${r.CreditDays ?? 0}` +
          `      Credit Limit: ${this.formatNumber(r.CreditLimit)}`;
        rows.push({
          style: 'section',
          cells: [
            { value: r.customerName || '', colspan: identityCount, fillColor: '#E9EEF5' },
            {
              value: totalsText,
              colspan: totalCols - identityCount,
              fillColor: '#E9EEF5',
              alignment: { horizontal: 'right' },
            },
          ],
        });
      }

      const salesperson = r.isOnAccount
        ? ''
        : r.isUnassigned
          ? 'Unassigned'
          : this.spLabel(r);
      const tint = r.isOnAccount ? '#FBF1DD' : undefined;
      const t = (c: ExcelCell): ExcelCell => (tint ? { ...c, fillColor: tint } : c);

      if (this.hasBreakdown(r)) {
        // Sub-header row (blank amounts) + one row per department (amounts).
        rows.push({
          style: 'data',
          cells: [
            ...(showBranch ? [{ value: this.branchLabel(r) }] : []),
            { value: salesperson },
            { value: `${r.departmentCount} Departments` },
            { value: '' },
            ...buckets.map(() => ({ value: '' })),
            { value: '' },
          ],
        });
        for (const d of r.departmentBreakdown) {
          rows.push({
            style: 'data',
            cells: [
              ...(showBranch ? [{ value: '' }] : []),
              { value: '' },
              // Use a Latin-1 marker (»); pdfmake's Roboto has no U+21B3 arrow glyph -> renders as tofu in the PDF.
              { value: `   » ${d.departmentName}` },
              amt(d.outstandingLocal),
              ...buckets.map((label: string) => amt(d.buckets?.[label])),
              amt(d.onAccountLocal),
            ],
          });
        }
      } else {
        const dept = r.isOnAccount ? 'Unallocated' : r.departmentText || '';
        rows.push({
          style: 'data',
          cells: [
            ...(showBranch ? [t({ value: this.branchLabel(r) })] : []),
            t({ value: salesperson }),
            t({ value: dept }),
            t(amt(r.outstandingLocal)),
            ...buckets.map((label: string) => t(amt(r.buckets?.[label]))),
            t(amt(r.onAccountLocal)),
          ],
        });
      }
    }

    // Grand total — label across identity columns, then OS Local (reconciles) /
    // buckets (local) / On Acc Local (local).
    const grandCells: ExcelCell[] = [
      { value: 'Grand Total' },
      ...(showBranch ? [{ value: '' }] : []),
      { value: '' },
      amt(this.fullData?.grandTotalLocal),
      ...buckets.map((label: string) => amt(this.fullData?.overallBucketTotals?.[label])),
      amt(this.fullData?.overallOnAccountLocal),
    ];
    rows.push({ cells: grandCells, style: 'grandTotal' });

    return {
      fileName: 'Ageing-Report-Salesman',
      sheetName: 'AgeingSalesman',
      styled: true,
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: 'Customer Ageing (Salesman-wise)',
        additionalInfo: [
          { label: 'To Date', value: this.formatDate(this.fullData?.concludedUpto) },
          { label: 'Branch', value: this.fullData?.branchInvolvedText || '' },
          { label: 'Ledger', value: this.fullData?.LedgerName || '' },
        ],
      },
      tableHeaders,
      rows,
      columnWidths: [
        ...(showBranch ? [16] : []),
        20,
        24,
        14,
        ...buckets.map(() => 13),
        14,
      ],
      notes: [
        'OS Local & buckets are in local currency; OS Local sums to the Grand Total.',
        'Unallocated = department-less vouchers (Non-Job INV / JV / Receipt / Payment), no salesperson.',
        'On Acc Local = Advances + JV portion.',
        'Unassigned = no matching salesteam record.',
      ],
      // Repeat the terse legend in the PDF footer on every page (not just the last).
      notesEveryPage: true,
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
