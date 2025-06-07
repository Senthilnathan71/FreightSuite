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
}

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  exportAsExcel(config: ExcelExportConfig): void {
    const { data, headers, fileName, sheetName = 'Sheet1' } = config;

    if (!data || data.length === 0 || headers.length === 0) {
      console.warn('Excel Export: No data or headers provided');
      return;
    }

    const exportData = data.map(item => {
      const row: any = {};
      headers.forEach(header => {
        row[header.label] = item[header.key] ?? '';
      });
      return row;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    FileSaver.saveAs(blob, `${fileName}-${new Date().getTime()}.xlsx`);
  }
}
