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
          const masterJob = this.mapMasterJobData(masterJobData[0]);

          // Map all house jobs
          const houseJobs = houseJobsData.map(row => this.mapHouseJobData(row));

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
   * Parse date value from Excel
   */
  private parseDate(value: any): string | undefined {
    if (!value) return undefined;

    // If already a Date object
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Try to parse string dates
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  /**
   * Parse number value from Excel
   */
  private parseNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Parse integer value from Excel
   */
  private parseInt(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Map Master Job data from Excel columns to clean property names
   */
  private mapMasterJobData(row: any): any {
    if (!row) return null;

    return {
      MasterJobDate: this.parseDate(row['Master Job Date']),
      Department: row['Department'],
      FreightPPCC: row['Freight PP/CC'],
      POO: row['POO (Port Code)'],
      POL: row['POL (Port Code)'],
      POD: row['POD (Port Code)'],
      FPD: row['FPD (Port Code)'],
      POLTerminal: row['POL Terminal'],
      PODTerminal: row['POD Terminal'],
      MovementType: row['Movement Type'],
      ShipmentTerms: row['Shipment Terms'],
      MBLNo: row['MBL Number'],
      MBLDate: this.parseDate(row['MBL Date']),
      BLReleaseType: row['BL Release Type'],
      NoOfPkg: this.parseInt(row['Number of Packages']),
      GrossWeight: this.parseNumber(row['Gross Weight']),
      NetWeight: this.parseNumber(row['Net Weight']),
      Volume: this.parseNumber(row['Volume (CBM)']),
      ChargeableWeight: this.parseNumber(row['Chargeable Weight']),
      CommodityDescription: row['Commodity Description'],
      MarksandNumber: row['Marks and Number'],
      Haz: row['Hazardous (Y/N)'],
      DestinationAgentName: row['Destination Agent Name'],
      DestinationAgentAddress: row['Destination Agent Address'],
      VesselName: row['Vessel Name'],
      VoyageNumber: row['Voyage Number'],
      CarrierName: row['Carrier Name'],
      ContainerNumber: row['Container Number'],
      ContainerType: row['Container Type'],
      LineSeal: row['Line Seal'],
      CustomsSeal: row['Customs Seal']
    };
  }

  /**
   * Map House Job data from Excel columns to clean property names
   */
  private mapHouseJobData(row: any): any {
    if (!row) return null;

    return {
      ShipmentNo: row['Shipment Number'],
      CustomerName: row['Customer Name'],
      CustomerAddress: row['Customer Address'],
      IncoTerms: row['Inco Terms'],
      ShipperName: row['Shipper Name'],
      ShipperAddress: row['Shipper Address'],
      ConsigneeName: row['Consignee Name'],
      ConsigneeAddress: row['Consignee Address'],
      POL: row['POL (Port Code)'],
      POD: row['POD (Port Code)'],
      FPD: row['FPD (Port Code)'],
      POO: row['POO (Port Code)'],
      ETD: this.parseDate(row['ETD']),
      ETA: this.parseDate(row['ETA']),
      MovementType: row['Movement Type'],
      Notify: row['Notify Party'],
      NotifyAddress: row['Notify Address'],
      NominatedBy: row['Nominated By'],
      AgentName: row['Agent Name'],
      AgentAddress: row['Agent Address'],
      ShipmentType: row['Shipment Type'],
      CargoType: row['Cargo Type'],
      CargoGrossWeight: this.parseNumber(row['Cargo Gross Weight']),
      CargoNetWeight: this.parseNumber(row['Cargo Net Weight']),
      CargoVolume: this.parseNumber(row['Cargo Volume']),
      CargoNoOfPackages: this.parseInt(row['Cargo No of Packages']),
      ProductName: row['Product Name'],
      ShippingBillNumber: row['Shipping Bill Number'],
      CustomerReferenceNumber: row['Customer Reference Number'],
      CHAName: row['CHA Name'],
      YardCFS: row['Yard/CFS'],
      PickupPlace: row['Pickup Place'],
      DeliveryPlace: row['Delivery Place'],
      CargoCurrency: row['Cargo Currency'],
      CargoValue: this.parseNumber(row['Cargo Value'])
    };
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
      ['Master Job Date', 'Department', 'Freight PP/CC', 'POO (Port Code)', 'POL (Port Code)',
        'POD (Port Code)', 'FPD (Port Code)', 'POL Terminal', 'POD Terminal', 'Movement Type',
        'Shipment Terms', 'MBL Number', 'MBL Date', 'BL Release Type', 'Number of Packages', 'Gross Weight',
        'Net Weight', 'Volume (CBM)', 'Chargeable Weight', 'Commodity Description', 'Marks and Number',
        'Hazardous (Y/N)', 'Destination Agent Name', 'Destination Agent Address', 'Vessel Name', 'Voyage Number',
        'Carrier Name', 'Container Number', 'Container Type', 'Line Seal', 'Customs Seal']
    ];

    const masterJobSample = [
      ['2025-01-15', 'LCL EXPORT', 'Prepaid', 'INCCU', 'INCCU', 'AEJEA', 'AEJEA', 'Terminal 1',
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
      ['Shipment Number', 'Customer Name', 'Customer Address', 'Inco Terms',
        'Shipper Name', 'Shipper Address', 'Consignee Name', 'Consignee Address', 'POL (Port Code)', 'POD (Port Code)', 'FPD (Port Code)', 'POO (Port Code)',
        'ETD', 'ETA', 'Movement Type', 'Notify Party', 'Notify Address', 'Nominated By', 'Agent Name',
        'Agent Address', 'Shipment Type', 'Cargo Type', 'Cargo Gross Weight', 'Cargo Net Weight', 'Cargo Volume',
        'Cargo No of Packages', 'Product Name', 'Shipping Bill Number', 'Customer Reference Number', 'CHA Name',
        'Yard/CFS', 'Pickup Place', 'Delivery Place', 'Cargo Currency', 'Cargo Value']
    ];

    const houseJobSample = [
      ['SHIP-001', 'ABC Company', '456 Customer St', 'FOB', 'Shipper Inc',
        '789 Shipper Ave', 'Consignee Ltd', '321 Consignee Rd', 'INCCU', 'AEJEA', 'AEJEA', 'INCCU',
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
