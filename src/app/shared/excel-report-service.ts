import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
// Drop-in fork of the SheetJS API that supports cell styling (.s) — used only by the
// styled exporter below so the plain `xlsx` path stays unchanged.
import * as XLSXStyle from 'xlsx-js-style';
import * as FileSaver from 'file-saver';
// Shared, reusable styling for the styled (coloured) exporter — palette, formats, borders
// and the per-row-kind cell-style builder all live here so the theme is editable in one place.
import { buildCellStyle } from './excel-report-style';

export interface ExcelHeader {
  key: string;
  label: string;
  colspan?: number;
  rowspan?: number;
}

export interface ExcelExportConfig {
  data: any[];
  headers: ExcelHeader[];
  fileName: string;
  sheetName?: string;
  title?: string;
}

/**
 * Represents a single cell in a complex report row
 */
export interface ExcelCell {
  value: string | number;
  /**
   * Raw numeric value for the styled Excel exporter. When provided the cell is written as a
   * real number with a #,##0.00 format (right-aligned + summable). `value` stays the display
   * string used by the PDF / plain-Excel paths.
   */
  num?: number;
  colspan?: number;
  rowspan?: number;
  border?: [boolean, boolean, boolean, boolean];
  fillColor?: string;
  marginTop?: number;
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
  };
}

/**
 * Represents a row in a complex report
 */
export interface ExcelRow {
  cells: ExcelCell[];
  style?: 'header' | 'data' | 'total' | 'section' | 'grandTotal';
}

/**
 * Report header configuration
 */
export interface ReportHeaderConfig {
  companyName: string;
  reportTitle: string;
  additionalInfo?: { label: string; value: string }[];
}

/**
 * Configuration for complex report exports with grouped data, sections, and totals
 */
export interface ComplexReportExportConfig {
  fileName: string;
  sheetName?: string;
  reportHeader: ReportHeaderConfig;
  /** When true the report modal routes the Excel export through the styled (coloured) exporter. */
  styled?: boolean;
  showFooterNote?: boolean;
  tableHeaders: ExcelHeader[];
  includeTableHeaders?: boolean;
  suppressSectionBorders?: boolean;
  suppressSectionBordersByText?: string[];
  suppressInnerDataRowLines?: boolean;
  sectionRowFillByText?: Record<string, string>;
  rows: ExcelRow[];
  columnWidths?: number[];
  summaryTable?: {
    title?: string;
    headers: string[];
    rows: ExcelRow[];
    columnWidths?: number[];
  };
  additionalTables?: Array<{
    title?: string;
    headers: string[];
    rows: ExcelRow[];
    columnWidths?: number[];
  }>;
  notes?: string[];
  /**
   * PDF only: render `notes` inside the page footer so they repeat on EVERY page
   * (instead of once at the end of the document). Excel/preview are unaffected.
   */
  notesEveryPage?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  exportAsExcel(config: ExcelExportConfig): void {
    const {
      data,
      headers,
      fileName,
      title,
      sheetName = fileName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 31)
    } = config;

    if (!data?.length || !headers?.length) {
      console.warn('Excel Export: No data or headers provided.');
      return;
    }

    const formattedData = data.map(item => {
      const row: any = {};
      headers.forEach(header => {
        row[header.label] = item[header.key] ?? '';
      });
      return row;
    });

    const aoa: any[][] = [];

    if (title) {
      aoa.push([`Company Name: ${title}`]);
    }

    aoa.push(headers.map(h => h.label));

    formattedData.forEach(row => {
      aoa.push(headers.map(h => row[h.label]));
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);

    if (title) {
      const endCol = headers.length - 1;
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: endCol } }
      ];
    }

    const workbook: XLSX.WorkBook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName]
    };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    FileSaver.saveAs(blob, `${fileName}-${new Date().getTime()}.xlsx`);
  }

  /**
   * Export complex reports with grouped data, sections, and totals
   * Supports: merged header rows, section headers, subtotals, grand totals
   */
  exportComplexReport(config: ComplexReportExportConfig): void {
    const {
      fileName,
      sheetName = fileName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 31),
      reportHeader,
      tableHeaders,
      includeTableHeaders = true,
      rows,
      columnWidths
    } = config;

    const aoa: any[][] = [];
    const merges: XLSX.Range[] = [];
    const totalCols = tableHeaders.length;

    // Row 1: Company Name (merged across all columns)
    aoa.push([reportHeader.companyName]);
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } });

    // Row 2: Report Title (merged across all columns)
    aoa.push([reportHeader.reportTitle]);
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } });

    // Row 3: Empty row
    aoa.push([]);

    // Additional info rows (Branch, Ledger, Date, etc.)
    if (reportHeader.additionalInfo && reportHeader.additionalInfo.length > 0) {
      for (const info of reportHeader.additionalInfo) {
        aoa.push([`${info.label} : ${info.value}`]);
        merges.push({
          s: { r: aoa.length - 1, c: 0 },
          e: { r: aoa.length - 1, c: totalCols - 1 }
        });
      }
    }

    // Table Header Row (optional)
    if (includeTableHeaders) {
      aoa.push(tableHeaders.map(h => h.label));
    }

    // Data Rows
    let currentRowIndex = aoa.length;
    for (const row of rows) {
      const excelRow: any[] = [];
      let colIndex = 0;

      for (const cell of row.cells) {
        excelRow.push(cell.value ?? '');

        // Handle colspan for merged cells (section headers, etc.)
        if (cell.colspan && cell.colspan > 1) {
          merges.push({
            s: { r: currentRowIndex, c: colIndex },
            e: { r: currentRowIndex, c: colIndex + cell.colspan - 1 }
          });
          // Fill remaining columns for colspan
          for (let i = 1; i < cell.colspan; i++) {
            excelRow.push('');
          }
          colIndex += cell.colspan;
        } else {
          colIndex++;
        }
      }

      // Pad remaining columns if row has fewer cells than headers
      while (excelRow.length < totalCols) {
        excelRow.push('');
      }

      aoa.push(excelRow);
      currentRowIndex++;
    }

    // Summary table (e.g., currency-wise summary in Outstanding Report)
    if (config.summaryTable) {
      // Empty separator row
      aoa.push([]);
      currentRowIndex++;

      // Summary title (optional)
      if (config.summaryTable.title) {
        aoa.push([config.summaryTable.title]);
        merges.push({ s: { r: currentRowIndex, c: 0 }, e: { r: currentRowIndex, c: totalCols - 1 } });
        currentRowIndex++;
      }

      // Summary header row
      const summaryHeaders = config.summaryTable.headers;
      aoa.push(summaryHeaders);
      currentRowIndex++;

      // Summary data rows
      for (const row of config.summaryTable.rows) {
        const summaryExcelRow: any[] = [];
        for (const cell of row.cells) {
          summaryExcelRow.push(cell.value ?? '');
        }
        while (summaryExcelRow.length < summaryHeaders.length) summaryExcelRow.push('');
        aoa.push(summaryExcelRow);
        currentRowIndex++;
      }
    }

    if (config.additionalTables?.length) {
      for (const table of config.additionalTables) {
        aoa.push([]);
        currentRowIndex++;

        if (table.title) {
          aoa.push([table.title]);
          merges.push({ s: { r: currentRowIndex, c: 0 }, e: { r: currentRowIndex, c: totalCols - 1 } });
          currentRowIndex++;
        }

        aoa.push(table.headers);
        currentRowIndex++;

        for (const row of table.rows) {
          const extraExcelRow: any[] = [];
          for (const cell of row.cells) {
            extraExcelRow.push(cell.value ?? '');
          }
          while (extraExcelRow.length < table.headers.length) extraExcelRow.push('');
          aoa.push(extraExcelRow);
          currentRowIndex++;
        }
      }
    }

    // Create worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet['!merges'] = merges;

    // Set column widths if provided
    if (columnWidths && columnWidths.length > 0) {
      worksheet['!cols'] = columnWidths.map(w => ({ wch: w }));
    }

    // Create workbook and export
    const workbook: XLSX.WorkBook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName]
    };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    FileSaver.saveAs(blob, `${fileName}-${new Date().getTime()}.xlsx`);
  }

  excelToJson(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];

          // Get all data including headers
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (rawData.length === 0) {
            resolve([]);
            return;
          }

          // First row as headers (keys)
          const headers = rawData[0] as string[];

          // Convert remaining rows to objects using first row as keys
          const jsonData = rawData.slice(1).map((row: any[]) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || null;
            });
            return obj;
          });

          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // ===================================================================
  // Styled complex-report export (xlsx-js-style) — coloured header,
  // banded sections, bold totals, borders and REAL numeric cells.
  // Opt-in via ComplexReportExportConfig.styled; the plain path is untouched.
  // ===================================================================

  exportComplexReportStyled(config: ComplexReportExportConfig): void {
    const blob = this.buildComplexReportStyledBlob(config);
    FileSaver.saveAs(blob, `${config.fileName}-${new Date().getTime()}.xlsx`);
  }

  buildComplexReportStyledBlob(config: ComplexReportExportConfig): Blob {
    const wb = this.buildStyledComplexWorkbook(config);
    const buf: Uint8Array = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  private buildStyledComplexWorkbook(config: ComplexReportExportConfig): any {
    const {
      fileName,
      sheetName = (fileName || 'Report').replace(/[^a-zA-Z0-9]/g, '').slice(0, 31),
      reportHeader,
      tableHeaders,
      includeTableHeaders = true,
      rows,
      columnWidths,
      notes,
    } = config;

    const totalCols = Math.max(1, tableHeaders.length);
    const aoa: any[][] = [];
    const merges: XLSX.Range[] = [];
    const cellMeta: (ExcelCell | undefined)[][] = []; // per (r,c) source cell (fill/num/align)
    const rowKind: string[] = [];

    const pushMetaRow = (kind: string, metaCells: (ExcelCell | undefined)[]) => {
      rowKind.push(kind);
      const filled = metaCells.slice(0, totalCols);
      while (filled.length < totalCols) filled.push(undefined);
      cellMeta.push(filled);
    };
    const fullMerge = () =>
      merges.push({
        s: { r: aoa.length - 1, c: 0 },
        e: { r: aoa.length - 1, c: totalCols - 1 },
      });

    // --- Title block ---
    aoa.push([reportHeader.companyName || '']);
    fullMerge();
    pushMetaRow('company', []);

    aoa.push([reportHeader.reportTitle || '']);
    fullMerge();
    pushMetaRow('title', []);

    aoa.push([]);
    pushMetaRow('blank', []);

    if (reportHeader.additionalInfo?.length) {
      for (const info of reportHeader.additionalInfo) {
        aoa.push([`${info.label} : ${info.value}`]);
        fullMerge();
        pushMetaRow('info', []);
      }
    }

    // --- Table header ---
    if (includeTableHeaders) {
      aoa.push(tableHeaders.map((h) => h.label));
      pushMetaRow('header', []);
    }

    // --- Data rows ---
    for (const row of rows) {
      const rowValues: any[] = [];
      const metaCells: (ExcelCell | undefined)[] = [];
      let colIndex = 0;
      for (const cell of row.cells) {
        const num = Number(cell.num);
        const isNum = cell.num !== undefined && cell.num !== null && isFinite(num);
        rowValues.push(isNum ? num : (cell.value ?? ''));
        metaCells[colIndex] = cell;
        if (cell.colspan && cell.colspan > 1) {
          merges.push({
            s: { r: aoa.length, c: colIndex },
            e: { r: aoa.length, c: colIndex + cell.colspan - 1 },
          });
          for (let i = 1; i < cell.colspan; i++) {
            rowValues.push('');
            metaCells[colIndex + i] = cell; // share style across the merged span
          }
          colIndex += cell.colspan;
        } else {
          colIndex++;
        }
      }
      while (rowValues.length < totalCols) rowValues.push('');
      aoa.push(rowValues);
      pushMetaRow(row.style || 'data', metaCells);
    }

    // --- Notes ---
    if (notes?.length) {
      aoa.push([]);
      pushMetaRow('blank', []);
      for (const n of notes) {
        aoa.push([n]);
        fullMerge();
        pushMetaRow('note', []);
      }
    }

    const ws: any = XLSXStyle.utils.aoa_to_sheet(aoa);
    ws['!merges'] = merges;
    if (columnWidths?.length) {
      ws['!cols'] = columnWidths.map((w) => ({ wch: w }));
    }

    // --- Cell styling (palette / formats / per-row-kind styles live in excel-report-style.ts) ---
    const range = XLSXStyle.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; R++) {
      const kind = rowKind[R] || 'data';
      for (let C = range.s.c; C <= range.e.c; C++) {
        const ref = XLSXStyle.utils.encode_cell({ r: R, c: C });
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };
        const cell = ws[ref];
        const meta = cellMeta[R]?.[C];

        const { s, z } = buildCellStyle(kind, {
          isNumeric: cell.t === 'n',
          fillColor: meta?.fillColor,
          alignment: meta?.alignment,
        });
        if (z) cell.z = z;
        cell.s = s;
      }
    }

    return { Sheets: { [sheetName]: ws }, SheetNames: [sheetName] };
  }
}
