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
