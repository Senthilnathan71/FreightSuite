import {
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { ReusableTableComponent } from '../../table/table.component';
import {
  TableColumn,
  TableConfig,
  ColumnVisibilityState,
  TableSortConfig,
} from '../../../interfaces/table.interface';
import { REPORT_DATA } from '../../../services/report.service';
import { ReportColumnLayoutService } from '../../../services/report-column-layout.service';
import {
  ComplexReportExportConfig,
  ExcelHeader,
  ExcelRow,
} from '../../../excel-report-service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';
import {
  ReportColumnLayout,
  ReportViewOverride,
  REPORT_VIEW_OVERRIDES,
} from './report-column-config';

/**
 * Generic, column-customizable renderer for flat (list-style) reports — the "New view".
 *
 * Reuses ReusableTableComponent's built-in column show/hide + drag-reorder, derives
 * columns from the report data, persists the per-user layout in localStorage, and exposes
 * getExcelData() so the report modal's Excel/PDF/email export reflects the visible, ordered
 * columns (export parity). Optional developer-supplied column metadata can override labels.
 */
@Component({
  selector: 'app-generic-table-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ReusableTableComponent,
    PrintHeaderComponent,
    PrintFooterComponent,
  ],
  templateUrl: './generic-table-report.component.html',
  styleUrls: ['./generic-table-report.component.scss'],
})
export class GenericTableReportComponent implements OnInit, OnDestroy {
  /** ReportMasterSid — used as the per-report localStorage key. Set by the modal. */
  @Input() reportMasterSid = 0;
  /** Report display name — used for export header/title. Set by the modal. */
  @Input() reportDisplayName = 'Report';
  /** Registry ReportName — used to look up per-report overrides (data path, totals). Set by the modal. */
  @Input() reportName = '';
  /** Optional developer-supplied column definitions (key/label) to override auto-derivation. */
  @Input() columnDefs?: Array<{ key: string; label: string }>;
  /**
   * The Classic report's getExcelData() output. When provided, the New view renders from it
   * (exact heading, header lines, curated columns + formatted values, totals) so it matches Classic.
   */
  @Input() sourceConfig: any = null;

  rows: any[] = [];
  tableConfig: TableConfig = { columns: [] };
  private allRows: any[] = [];
  private currentSort: TableSortConfig = { column: '', direction: 'none' };
  /** Title shown above the table (from the Classic report when available). */
  displayTitle = 'Report';
  /** Parameter / filter summary shown under the title (e.g. From Date, To Date, Branch). */
  paramSummary: Array<{ label: string; value: string }> = [];
  /** Company name from the Classic report header (used for export parity). */
  private sourceCompanyName = '';
  /** Classic-style trailing notes extracted from sourceConfig rows. */
  reportNotes: string[] = [];

  /** Whether the "Columns" customize panel is open. */
  panelOpen = false;
  /** Search term to filter the column list inside the panel. */
  columnSearch = '';

  /** Full, default-ordered column set derived from the data (stable). */
  private allColumns: TableColumn[] = [];
  /** Current display order (column keys), updated as the user reorders. */
  private currentOrder: string[] = [];
  /** Current visibility map, updated as the user toggles columns. */
  private currentVisibility: ColumnVisibilityState = {};

  private save$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    @Optional() @Inject(REPORT_DATA) private injectedData: any,
    private layoutService: ReportColumnLayoutService,
    private appSettings: AppSettingsService,
  ) {}

  ngOnInit(): void {
    // Preferred: render from the Classic report's getExcelData() so heading, header
    // parameter lines, column labels, formatted values and totals match Classic exactly.
    if (this.sourceConfig) {
      this.buildFromSourceConfig(this.sourceConfig);
    } else {
      this.buildFromInjectedData();
    }

    const saved = this.reportMasterSid ? this.layoutService.load(this.reportMasterSid) : null;
    this.applyLayout(saved);

    this.save$
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => this.persistLayout());
  }

  /** Build columns/rows/header from the Classic report's structured export config. */
  private buildFromSourceConfig(cfg: any): void {
    this.displayTitle = cfg?.reportHeader?.reportTitle || this.reportDisplayName;
    this.sourceCompanyName = cfg?.reportHeader?.companyName || '';
    this.paramSummary = (cfg?.reportHeader?.additionalInfo || [])
      .filter((a: any) => a && a.value !== undefined && a.value !== null && String(a.value).trim() !== '')
      .map((a: any) => ({ label: a.label, value: String(a.value) }));

    const headers: ExcelHeader[] = (cfg?.tableHeaders || cfg?.headers || []) as ExcelHeader[];
    this.allColumns = headers.map((h) => this.makeColumn(h.key, h.label));
    this.reportNotes = [];

    if (Array.isArray(cfg?.rows)) {
      this.allRows = [];
      for (const row of cfg.rows) {
        if (!row || !Array.isArray(row.cells) || row.style === 'section' || row.style === 'header') {
          continue;
        }

        if (this.isAmountInWordsRow(row)) {
          const noteText = this.extractAmountInWordsText(row);
          if (noteText) {
            this.reportNotes.push(noteText);
          }
          continue;
        }

        this.allRows.push(this.excelRowToObject(row, headers));
      }
    } else if (Array.isArray(cfg?.data)) {
      this.allRows = [...cfg.data];
    } else {
      this.allRows = [];
    }
    this.rows = [...this.allRows];
  }

  /** Fallback: derive columns/rows directly from the injected report payload. */
  private buildFromInjectedData(): void {
    this.displayTitle = this.reportDisplayName;
    const override: ReportViewOverride | undefined = REPORT_VIEW_OVERRIDES[this.reportName];

    const dataRows = this.resolveRows(this.injectedData, override?.dataPath);
    this.paramSummary = this.buildParamSummary(this.injectedData);
    this.allColumns = this.deriveColumns(dataRows);

    // Append a styled totals row (e.g. ledger / VAT) so it matches the Classic report.
    const totalsRow = override?.totals ? this.buildTotalsRow(dataRows, override) : null;
    this.allRows = totalsRow ? [...dataRows, totalsRow] : [...dataRows];
    this.rows = [...this.allRows];
  }

  /** Convert a Classic ExcelRow (cells, possibly with colspans) into a key->value object. */
  private excelRowToObject(row: any, headers: ExcelHeader[]): any {
    const obj: any = {};
    let col = 0;
    for (const cell of row.cells || []) {
      const span = cell?.colspan && cell.colspan > 1 ? cell.colspan : 1;
      const header = headers[col];
      if (header) obj[header.key] = cell?.value ?? '';
      col += span;
    }
    if (row.style === 'total' || row.style === 'grandTotal') obj.__isTotalRow = true;
    return obj;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Table events ---------------------------------------------------------

  onColumnOrderChange(order: string[]): void {
    this.currentOrder = order;
    this.save$.next();
  }

  onColumnVisibilityChange(visibility: ColumnVisibilityState): void {
    this.currentVisibility = { ...visibility };
    this.save$.next();
  }

  onSortChange(sort: TableSortConfig): void {
    this.currentSort = { ...sort };
    this.applySort();
  }

  /** Reset to the default layout (all columns visible, derived order) and clear storage. */
  resetColumns(): void {
    if (this.reportMasterSid) {
      this.layoutService.reset(this.reportMasterSid);
    }
    this.applyLayout(null);
  }

  // --- "Columns" customize panel -------------------------------------------

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
    if (!this.panelOpen) this.columnSearch = '';
  }

  closePanel(): void {
    this.panelOpen = false;
    this.columnSearch = '';
  }

  /** Number of data rows (excludes the appended totals row). */
  get recordCount(): number {
    return this.rows.filter((r) => !r?.__isTotalRow).length;
  }

  get visibleColumnCount(): number {
    return this.allColumns.filter((c) => this.currentVisibility[c.key] !== false).length;
  }

  get totalColumnCount(): number {
    return this.allColumns.length;
  }

  /** Columns in current display order, each with its visibility, for the panel list. */
  get panelColumns(): Array<{ key: string; label: string; visible: boolean }> {
    const byKey = new Map(this.allColumns.map((c) => [c.key, c]));
    return this.currentOrder
      .map((key) => byKey.get(key))
      .filter((c): c is TableColumn => !!c)
      .map((c) => ({ key: c.key, label: c.label, visible: this.currentVisibility[c.key] !== false }));
  }

  /** Panel list filtered by the search term (drag is disabled while searching). */
  get filteredPanelColumns(): Array<{ key: string; label: string; visible: boolean }> {
    const term = this.columnSearch.trim().toLowerCase();
    if (!term) return this.panelColumns;
    return this.panelColumns.filter((c) => c.label.toLowerCase().includes(term));
  }

  get isSearching(): boolean {
    return this.columnSearch.trim().length > 0;
  }

  onPanelDrop(event: CdkDragDrop<unknown>): void {
    if (this.isSearching) return; // reordering only in the full (unfiltered) list
    const order = this.panelColumns.map((c) => c.key);
    moveItemInArray(order, event.previousIndex, event.currentIndex);
    this.currentOrder = order;
    this.applyAndPersist();
  }

  onPanelVisibilityToggle(key: string): void {
    this.currentVisibility[key] = this.currentVisibility[key] === false;
    this.applyAndPersist();
  }

  showAllColumns(): void {
    this.allColumns.forEach((c) => (this.currentVisibility[c.key] = true));
    this.applyAndPersist();
  }

  trackPanelCol(_: number, col: { key: string }): string {
    return col.key;
  }

  // --- Export (consumed by the report modal) --------------------------------

  /**
   * Returns a ComplexReportExportConfig honoring the currently visible columns in their
   * current order, so the modal's Excel / PDF / email paths all match the on-screen view.
   */
  getExcelData(): ComplexReportExportConfig {
    const cols = this.getVisibleOrderedColumns();
    const tableHeaders: ExcelHeader[] = cols.map((c) => ({ key: c.key, label: c.label }));
    const rows: ExcelRow[] = this.rows.map((row) => ({
      style: row?.__isTotalRow ? 'total' : 'data',
      cells: cols.map((c) => ({ value: this.exportCellValue(row, c) })),
    }));

    return {
      fileName: this.safeFileName(this.reportDisplayName),
      reportHeader: {
        companyName: this.sourceCompanyName || this.companyName(),
        reportTitle: this.displayTitle || 'Report',
        additionalInfo: this.paramSummary.map((p) => ({ label: p.label, value: p.value })),
      },
      tableHeaders,
      includeTableHeaders: true,
      rows,
      columnWidths: cols.map(() => 20),
      notesLabel: this.reportNotes.length ? 'Amount in words' : undefined,
      notes: this.reportNotes.length ? [...this.reportNotes] : undefined,
    };
  }

  // --- Internals ------------------------------------------------------------

  private resolveRows(injected: any, dataPath?: string): any[] {
    // Explicit per-report path (e.g. 'transactions', 'data.inputTax').
    if (dataPath) {
      const atPath = dataPath.split('.').reduce((acc, key) => acc?.[key], injected);
      if (Array.isArray(atPath)) return atPath;
    }
    if (Array.isArray(injected)) return injected;
    if (!injected || typeof injected !== 'object') return [];
    if (Array.isArray(injected.data)) return injected.data;
    if (Array.isArray(injected.items)) return injected.items;
    // Fall back to the first array-of-objects property (the modal may merge `params` alongside it).
    for (const [key, value] of Object.entries(injected)) {
      if (key === 'params') continue;
      if (Array.isArray(value) && value.some((v) => v && typeof v === 'object')) {
        return value as any[];
      }
    }
    return [];
  }

  /** Build a bottom totals row: summed columns, carried-last columns, and a label. */
  private buildTotalsRow(dataRows: any[], override: ReportViewOverride): any | null {
    const totals = override.totals;
    if (!totals || !dataRows.length) return null;

    const row: any = { __isTotalRow: true };
    const sumKeys = totals.sumKeys ?? [];
    const lastKeys = totals.lastKeys ?? [];

    for (const key of sumKeys) {
      const sum = dataRows.reduce((acc, r) => acc + (Number(r?.[key]) || 0), 0);
      row[key] = Math.round((sum + Number.EPSILON) * 100) / 100; // avoid float noise
    }
    const last = dataRows[dataRows.length - 1];
    for (const key of lastKeys) {
      row[key] = last?.[key] ?? '';
    }

    // Place the label in the first column that isn't a numeric total column.
    const numericKeys = new Set([...sumKeys, ...lastKeys]);
    const labelColumn = this.allColumns.find((c) => !numericKeys.has(c.key)) ?? this.allColumns[0];
    if (labelColumn) row[labelColumn.key] = totals.label ?? 'Total';

    return row;
  }

  private isAmountInWordsRow(row: any): boolean {
    const firstCellText = String(row?.cells?.[0]?.value ?? '').trim().toLowerCase();
    return firstCellText === 'amount in words';
  }

  private extractAmountInWordsText(row: any): string {
    const parts = (row?.cells || [])
      .slice(1)
      .map((cell: any) => String(cell?.value ?? '').trim())
      .filter((value: string) => !!value && value !== ':');

    if (parts.length) {
      return parts.join(' ');
    }

    const fallback = (row?.cells || [])
      .map((cell: any) => String(cell?.value ?? '').trim())
      .find((value: string) => value && value.toLowerCase() !== 'amount in words' && value !== ':');

    return fallback || '';
  }

  private deriveColumns(rows: any[]): TableColumn[] {
    if (this.columnDefs?.length) {
      return this.columnDefs.map((d) => this.makeColumn(d.key, d.label));
    }
    const first = rows.find((r) => r && typeof r === 'object');
    if (!first) return [];
    return Object.keys(first).map((key) => this.makeColumn(key, this.formatLabel(key)));
  }

  private makeColumn(key: string, label: string): TableColumn {
    return {
      key,
      label,
      sortable: true,
      filterable: true,
      visible: true,
      // Format date-like values for display (e.g. ISO timestamps -> locale date).
      customRenderer: (value: any) => this.displayValue(value),
    };
  }

  /** Human-friendly display for a cell value (formats ISO date/datetime strings). */
  private displayValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toLocaleDateString();
      }
      return value;
    }
    return String(value);
  }

  /**
   * Rebuild tableConfig.columns (ordered + visibility applied) from a saved layout (or defaults),
   * and sync internal order/visibility state. Assigning a new config object triggers the table to
   * re-initialize.
   */
  private applyLayout(layout: ReportColumnLayout | null): void {
    const keys = this.allColumns.map((c) => c.key);
    const hidden = new Set((layout?.hidden ?? []).filter((k) => keys.includes(k)));

    // Order: saved order first (existing keys only), then any new/unsaved keys in derived order.
    const savedOrder = (layout?.order ?? []).filter((k) => keys.includes(k));
    const remaining = keys.filter((k) => !savedOrder.includes(k));
    const orderedKeys = [...savedOrder, ...remaining];

    const byKey = new Map(this.allColumns.map((c) => [c.key, c]));
    const orderedColumns: TableColumn[] = orderedKeys.map((k) => ({
      ...byKey.get(k)!,
      visible: !hidden.has(k),
    }));

    this.currentOrder = orderedKeys;
    this.currentVisibility = {};
    orderedColumns.forEach((c) => (this.currentVisibility[c.key] = c.visible !== false));

    this.rebuildTableConfig();
  }

  /** Rebuild the table config from the current order + visibility (triggers table re-init). */
  private rebuildTableConfig(): void {
    const byKey = new Map(this.allColumns.map((c) => [c.key, c]));
    const orderedColumns: TableColumn[] = this.currentOrder
      .map((key) => byKey.get(key))
      .filter((c): c is TableColumn => !!c)
      .map((c) => ({ ...c, visible: this.currentVisibility[c.key] !== false }));

    this.tableConfig = {
      columns: orderedColumns,
      showColumnToggle: false, // our own "Columns" panel replaces the built-in dropdown
      dragAndDrop: true, // header drag still works and stays in sync with the panel
      showFilters: true,
      showPagination: false,
      emptyMessage: 'No records found',
      rowClass: (r: any) => (r?.__isTotalRow ? 'gtr-total-row' : ''),
    };
  }

  private applySort(): void {
    if (!this.currentSort.column || this.currentSort.direction === 'none') {
      this.rows = [...this.allRows];
      return;
    }

    const regularRows = this.allRows.filter((row) => !row?.__isTotalRow);
    const totalRows = this.allRows.filter((row) => row?.__isTotalRow);
    const directionMultiplier = this.currentSort.direction === 'asc' ? 1 : -1;

    const sortedRows = [...regularRows].sort((leftRow, rightRow) => {
      const leftValue = leftRow?.[this.currentSort.column];
      const rightValue = rightRow?.[this.currentSort.column];
      return this.compareValues(leftValue, rightValue) * directionMultiplier;
    });

    this.rows = [...sortedRows, ...totalRows];
  }

  private compareValues(leftValue: any, rightValue: any): number {
    if (leftValue === rightValue) return 0;
    if (leftValue === null || leftValue === undefined || leftValue === '') return 1;
    if (rightValue === null || rightValue === undefined || rightValue === '') return -1;

    const leftNumber = this.toSortableNumber(leftValue);
    const rightNumber = this.toSortableNumber(rightValue);
    if (leftNumber !== null && rightNumber !== null) {
      return leftNumber - rightNumber;
    }

    const leftDate = this.toSortableDate(leftValue);
    const rightDate = this.toSortableDate(rightValue);
    if (leftDate !== null && rightDate !== null) {
      return leftDate - rightDate;
    }

    return String(leftValue).localeCompare(String(rightValue), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  private toSortableNumber(value: any): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.replace(/,/g, '').trim();
    if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toSortableDate(value: any): number | null {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.getTime();
    }

    if (typeof value !== 'string') {
      return null;
    }

    const isoDate = new Date(value);
    if (!isNaN(isoDate.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return isoDate.getTime();
    }

    const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!ddmmyyyy) {
      return null;
    }

    const [, day, month, year] = ddmmyyyy;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return !isNaN(parsed.getTime()) ? parsed.getTime() : null;
  }

  /** Apply the current order/visibility to the table and persist immediately. */
  private applyAndPersist(): void {
    this.rebuildTableConfig();
    this.persistLayout();
  }

  private getVisibleOrderedColumns(): TableColumn[] {
    return this.allColumns
      .filter((c) => this.currentVisibility[c.key] !== false)
      .sort((a, b) => this.currentOrder.indexOf(a.key) - this.currentOrder.indexOf(b.key));
  }

  private persistLayout(): void {
    if (!this.reportMasterSid) return;
    const hidden = this.allColumns
      .map((c) => c.key)
      .filter((k) => this.currentVisibility[k] === false);
    this.layoutService.save(this.reportMasterSid, { order: this.currentOrder, hidden });
  }

  private exportCellValue(row: any, column: TableColumn): string | number {
    const value = row?.[column.key];
    if (typeof value === 'number') return value; // keep numbers numeric for Excel
    return this.displayValue(value);
  }

  private companyName(): string {
    const info: any = this.appSettings.getCurrentCompanyInfo();
    return info?.companyName ?? info?.CompanyName ?? '';
  }

  /** Build a readable filter/parameter summary from the request params + common root metadata. */
  private buildParamSummary(injected: any): Array<{ label: string; value: string }> {
    const out: Array<{ label: string; value: string }> = [];
    const params = injected?.params ?? {};
    const skip = new Set(['companyId', 'CompanyMasterSid', 'BranchMasterSid', 'BLIssue']);

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') continue;
      if (skip.has(key) || /sid$|id$/i.test(key)) continue;
      if (typeof value === 'object') continue;
      out.push({ label: this.formatLabel(key), value: this.formatParamValue(value) });
    }
    // Common root metadata produced by several reports.
    if (injected?.branchInvolved) out.push({ label: 'Branch', value: String(injected.branchInvolved) });
    if (injected?.departmentNames) out.push({ label: 'Dept', value: String(injected.departmentNames) });
    return out;
  }

  private formatParamValue(value: any): string {
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toLocaleDateString();
    }
    return String(value);
  }

  private safeFileName(name: string): string {
    return (name || 'Report').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
  }

  private formatLabel(key: string): string {
    return key
      .replace(/[_-]+/g, ' ')
      // camelCase boundary: insert a space between a lower/digit and an upper.
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      // acronym boundary: keep "HBLNo" -> "HBL No", "MBLNo" -> "MBL No".
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
