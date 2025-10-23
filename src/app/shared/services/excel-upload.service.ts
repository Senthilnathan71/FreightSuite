import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ExcelValidationError {
  field: string;
  message: string;
  row?: number;
  sheet?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelUploadService {

  constructor() { }

  /**
   * Read and parse Excel file
   */
  readExcelFile(file: File): Promise<{ masterJob: any; houseJobs: any[]; errors: ExcelValidationError[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true });

          const errors: ExcelValidationError[] = [];

          // Validate required sheets exist
          if (!workbook.SheetNames.includes('Master Job')) {
            errors.push({
              field: 'Sheet',
              message: 'Required sheet "Master Job" not found',
              sheet: 'Master Job'
            });
          }

          if (!workbook.SheetNames.includes('House Jobs')) {
            errors.push({
              field: 'Sheet',
              message: 'Required sheet "House Jobs" not found',
              sheet: 'House Jobs'
            });
          }

          if (errors.length > 0) {
            resolve({ masterJob: null, houseJobs: [], errors });
            return;
          }

          // Parse Master Job sheet
          const masterJobSheet = workbook.Sheets['Master Job'];
          const masterJobData = XLSX.utils.sheet_to_json(masterJobSheet, { defval: null });

          // Parse House Jobs sheet
          const houseJobsSheet = workbook.Sheets['House Jobs'];
          const houseJobsData = XLSX.utils.sheet_to_json(houseJobsSheet, { defval: null });

          if (masterJobData.length === 0) {
            errors.push({
              field: 'Data',
              message: 'Master Job sheet contains no data',
              sheet: 'Master Job'
            });
          }

          if (houseJobsData.length === 0) {
            errors.push({
              field: 'Data',
              message: 'House Jobs sheet contains no data (at least one house job required)',
              sheet: 'House Jobs'
            });
          }

          if (errors.length > 0) {
            resolve({ masterJob: null, houseJobs: [], errors });
            return;
          }

          // Get first row as master job (only one master job per upload)
          const masterJob = masterJobData[0];

          // All rows are house jobs
          const houseJobs = houseJobsData;

          resolve({ masterJob, houseJobs, errors: [] });

        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsBinaryString(file);
    });
  }

  /**
   * Validate Excel file structure
   */
  validateExcelStructure(file: File): { valid: boolean; error?: string } {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed'
      };
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return {
        valid: false,
        error: 'File size exceeds 5MB limit'
      };
    }

    return { valid: true };
  }

  /**
   * Download Excel template
   */
  generateAndDownloadTemplate(): void {
    const workbook = XLSX.utils.book_new();

    // Create Master Job sheet
    const masterJobHeaders = [
      ['Master Job Number', 'Master Job Date', 'Freight PP/CC', 'POO (Port of Origin)', 'POL (Port of Loading)',
        'POD (Port of Discharge)', 'FPD (Final Place of Delivery)', 'POL Terminal', 'POD Terminal', 'Movement Type',
        'Shipment Terms', 'MBL Number', 'MBL Date', 'BL Release Type', 'Number of Packages', 'Gross Weight',
        'Net Weight', 'Volume (CBM)', 'Chargeable Weight', 'Commodity Description', 'Marks and Number',
        'Hazardous (Y/N)', 'Destination Agent Name', 'Destination Agent Address', 'Vessel Name', 'Voyage Number',
        'Carrier Name', 'Container Number', 'Container Type', 'Line Seal', 'Customs Seal']
    ];

    const masterJobSample = [
      ['MJ-2025-001', '2025-01-15', 'Prepaid', 'Chennai', 'INMAA1', 'USNYC1', 'New York', 'Terminal 1',
        'Terminal 2', 'FCL', 'CY/CY', 'MBL123456', '2025-01-20', 'Seaway Bill', '10', '5000', '4800',
        '25.5', '5000', 'Electronic Goods', 'Sample Marks', 'N', 'ABC Logistics', '123 Main St, New York',
        'MSC EMMA', 'V123', 'MSC', 'TCLU1234567', '40HC', 'MSC001', 'CUST001']
    ];

    const masterJobWs = XLSX.utils.aoa_to_sheet([...masterJobHeaders, ...masterJobSample]);

    // Set column widths
    masterJobWs['!cols'] = [
      { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 18 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 25 },
      { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(workbook, masterJobWs, 'Master Job');

    // Create House Jobs sheet
    const houseJobHeaders = [
      ['Booking Number', 'HBL Number', 'Shipment Number', 'Customer Name', 'Customer Address', 'Inco Terms',
        'Shipper Name', 'Shipper Address', 'Consignee Name', 'Consignee Address', 'POL', 'POD', 'FPD', 'POO',
        'ETD', 'ETA', 'Movement Type', 'Notify Party', 'Notify Address', 'Nominated By', 'Agent Name',
        'Agent Address', 'Shipment Type', 'Cargo Type', 'Cargo Gross Weight', 'Cargo Net Weight', 'Cargo Volume',
        'Cargo No of Packages', 'Product Name', 'Shipping Bill Number', 'Customer Reference Number', 'CHA Name',
        'Yard/CFS', 'Pickup Place', 'Delivery Place', 'Cargo Currency', 'Cargo Value']
    ];

    const houseJobSample = [
      ['BK-2025-001', 'HBL-123456', 'SHIP-001', 'ABC Company', '456 Customer St', 'FOB', 'Shipper Inc',
        '789 Shipper Ave', 'Consignee Ltd', '321 Consignee Rd', 'INMAA1', 'USNYC1', 'New York', 'Chennai',
        '2025-01-25', '2025-02-15', 'FCL', 'Notify Party Name', 'Notify Address', 'Customer', 'Agent Company',
        'Agent Address', 'Export', 'General', '2500', '2400', '12.5', '5', 'Electronics', 'SB123456',
        'CREF-001', 'CHA Company', 'Chennai Port', 'Factory Gate', 'Warehouse A', 'USD', '50000']
    ];

    const houseJobWs = XLSX.utils.aoa_to_sheet([...houseJobHeaders, ...houseJobSample]);

    // Set column widths
    houseJobWs['!cols'] = Array(37).fill({ wch: 18 });

    XLSX.utils.book_append_sheet(workbook, houseJobWs, 'House Jobs');

    // Generate and download
    XLSX.writeFile(workbook, 'Master_Job_Upload_Template.xlsx');
  }

  /**
   * Convert Excel date serial to JavaScript Date
   */
  private excelDateToJSDate(serial: number): Date | null {
    if (!serial) return null;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info;
  }

  /**
   * Format date for display
   */
  formatDate(date: any): string | null {
    if (!date) return null;

    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }

    if (typeof date === 'number') {
      const jsDate = this.excelDateToJSDate(date);
      return jsDate ? jsDate.toISOString().split('T')[0] : null;
    }

    return date;
  }

  /**
   * Validate required fields in data
   */
  validateRequiredFields(data: any, requiredFields: string[], sheetName: string, rowNumber?: number): ExcelValidationError[] {
    const errors: ExcelValidationError[] = [];

    requiredFields.forEach(field => {
      if (!data[field] || data[field] === '') {
        errors.push({
          field: field,
          message: `${field} is required`,
          sheet: sheetName,
          row: rowNumber
        });
      }
    });

    return errors;
  }
}
