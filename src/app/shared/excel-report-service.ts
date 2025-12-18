import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

export interface ExcelHeader {
  key: string;
  label: string;
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
  colspan?: number;
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
  tableHeaders: ExcelHeader[];
  rows: ExcelRow[];
  columnWidths?: number[];
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

    // Table Header Row
    aoa.push(tableHeaders.map(h => h.label));

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


}
