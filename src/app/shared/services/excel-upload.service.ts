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
  readExcelFile(file: File): Promise<{
    masterJob: any;
    containers: any[];
    voyages: any[];
    connections: any[];
    others: any;
    houseJobs: any[];
    errors: ExcelValidationError[]
  }> {
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
            resolve({ masterJob: null, containers: [], voyages: [], connections: [], others: null, houseJobs: [], errors });
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
            resolve({ masterJob: null, containers: [], voyages: [], connections: [], others: null, houseJobs: [], errors });
            return;
          }

          // Get first row as master job (only one master job per upload)
          const masterJob = this.mapMasterJobData(masterJobData[0]);

          // Parse Containers sheet (optional)
          let containers: any[] = [];
          if (workbook.SheetNames.includes('Containers')) {
            const containersSheet = workbook.Sheets['Containers'];
            const containersData = XLSX.utils.sheet_to_json(containersSheet, { defval: null });
            containers = containersData.map(row => this.mapContainerData(row));
          }

          // Parse Master Voyages sheet (optional)
          let voyages: any[] = [];
          if (workbook.SheetNames.includes('Master Voyages')) {
            const voyagesSheet = workbook.Sheets['Master Voyages'];
            const voyagesData = XLSX.utils.sheet_to_json(voyagesSheet, { defval: null });
            voyages = voyagesData.map(row => this.mapMasterVoyageData(row));
          }

          // Parse Master Connections sheet (optional)
          let connections: any[] = [];
          if (workbook.SheetNames.includes('Master Connections')) {
            const connectionsSheet = workbook.Sheets['Master Connections'];
            const connectionsData = XLSX.utils.sheet_to_json(connectionsSheet, { defval: null });
            connections = connectionsData.map(row => this.mapMasterConnectionData(row));
          }

          // Parse Master Others sheet (optional)
          let others: any = null;
          if (workbook.SheetNames.includes('Master Others')) {
            const othersSheet = workbook.Sheets['Master Others'];
            const othersData = XLSX.utils.sheet_to_json(othersSheet, { defval: null });
            if (othersData.length > 0) {
              others = this.mapMasterOthersData(othersData[0]);
            }
          }

          // Parse House Cargo sheet (optional)
          let houseCargoData: any[] = [];
          if (workbook.SheetNames.includes('House Cargo')) {
            const houseCargoSheet = workbook.Sheets['House Cargo'];
            houseCargoData = XLSX.utils.sheet_to_json(houseCargoSheet, { defval: null });
          }

          // Parse House Products sheet (optional)
          let houseProductsData: any[] = [];
          if (workbook.SheetNames.includes('House Products')) {
            const houseProductsSheet = workbook.Sheets['House Products'];
            houseProductsData = XLSX.utils.sheet_to_json(houseProductsSheet, { defval: null });
          }

          // Parse House Connections sheet (optional)
          let houseConnectionsData: any[] = [];
          if (workbook.SheetNames.includes('House Connections')) {
            const houseConnectionsSheet = workbook.Sheets['House Connections'];
            houseConnectionsData = XLSX.utils.sheet_to_json(houseConnectionsSheet, { defval: null });
          }

          // Map house jobs and attach their child data
          const houseJobs = houseJobsData.map(row => {
            const houseJob = this.mapHouseJobData(row);
            const shipmentNo = houseJob.ShipmentNo;

            // Attach cargo data for this shipment
            houseJob.cargo = houseCargoData
              .filter(cargoRow => cargoRow['Shipment Number'] === shipmentNo)
              .map(cargoRow => this.mapHouseCargoData(cargoRow));

            // Attach products data for this shipment
            houseJob.products = houseProductsData
              .filter(productRow => productRow['Shipment Number'] === shipmentNo)
              .map(productRow => this.mapHouseProductData(productRow));

            // Attach connections data for this shipment
            houseJob.connections = houseConnectionsData
              .filter(connRow => connRow['Shipment Number'] === shipmentNo)
              .map(connRow => this.mapHouseConnectionData(connRow));

            return houseJob;
          });

          resolve({ masterJob, containers, voyages, connections, others, houseJobs, errors: [] });

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
   * Map Container data from Excel columns to clean property names
   */
  private mapContainerData(row: any): any {
    if (!row) return null;

    return {
      ContainerNumber: row['Container Number'],
      ContainerType: this.parseInt(row['Container Type']),
      LineSeal: row['Line Seal'],
      CustomsSeal: row['Customs Seal'],
      HsCode: row['HS Code'],
      CommodityDescription: row['Commodity Description'],
      PkgType: this.parseInt(row['Package Type']),
      NoOfPkg: this.parseInt(row['No of Packages']),
      GrossWeight: this.parseNumber(row['Gross Weight']),
      NetWeight: this.parseNumber(row['Net Weight']),
      ChargeableWeight: this.parseNumber(row['Chargeable Weight']),
      Volume: this.parseNumber(row['Volume (CBM)']),
      IsSoc: row['Is SOC (Y/N)']
    };
  }

  /**
   * Map Master Voyage data from Excel columns to clean property names
   */
  private mapMasterVoyageData(row: any): any {
    if (!row) return null;

    return {
      VesselName: row['Vessel Name'],
      VoyageNo: row['Voyage Number'],
      ETD: this.parseDate(row['ETD']),
      ETA: this.parseDate(row['ETA']),
      ATA: this.parseDate(row['ATA']),
      ATD: this.parseDate(row['ATD']),
      DestinationATA: this.parseDate(row['Destination ATA']),
      CarrierName: row['Carrier Name']
    };
  }

  /**
   * Map Master Connection data from Excel columns to clean property names
   */
  private mapMasterConnectionData(row: any): any {
    if (!row) return null;

    return {
      Mode: row['Mode'],
      POL: row['POL (Port Code)'],
      POD: row['POD (Port Code)'],
      VesselName: row['Vessel Name'],
      VoyageNo: row['Voyage Number'],
      ETD: this.parseDate(row['ETD']),
      ETA: this.parseDate(row['ETA']),
      ATD: this.parseDate(row['ATD']),
      ATA: this.parseDate(row['ATA']),
      Remarks: row['Remarks']
    };
  }

  /**
   * Map Master Others data from Excel columns to clean property names
   */
  private mapMasterOthersData(row: any): any {
    if (!row) return null;

    return {
      Yard: row['Yard'],
      YardAddress: row['Yard Address'],
      Transporter: row['Transporter'],
      HandlingInformation: row['Handling Information'],
      InternalNote: row['Internal Note'],
      CFS: row['CFS'],
      CFSAddress: row['CFS Address'],
      StuffingStartDate: this.parseDate(row['Stuffing Start Date']),
      StuffingEndDate: this.parseDate(row['Stuffing End Date']),
      CurrencyCode: row['Currency Code'],
      SellExchangeRate: this.parseNumber(row['Sell Exchange Rate']),
      AgentExchangeRate: this.parseNumber(row['Agent Exchange Rate']),
      Coload: row['Coload (Y/N)'],
      CoLoader: row['Co Loader'],
      ExportDoNo: row['Export DO Number'],
      ExportDoDate: this.parseDate(row['Export DO Date']),
      SOBDate: this.parseDate(row['SOB Date'])
    };
  }

  /**
   * Map House Cargo data from Excel columns to clean property names
   */
  private mapHouseCargoData(row: any): any {
    if (!row) return null;

    return {
      ShipmentNo: row['Shipment Number'],
      CargoType: row['Cargo Type'],
      GrossWeight: this.parseNumber(row['Gross Weight']),
      NetWeight: this.parseNumber(row['Net Weight']),
      Volume: this.parseNumber(row['Volume (CBM)']),
      ChargeableWeight: this.parseNumber(row['Chargeable Weight']),
      NoOfPackage: this.parseInt(row['No of Packages']),
      PackageType: this.parseInt(row['Package Type']),
      ContainerNumber: row['Container Number'],
      ContainerType: this.parseInt(row['Container Type']),
      CommodityDescription: row['Commodity Description'],
      MarksAndNumber: row['Marks and Number'],
      FreightAmount: row['Freight Amount']
    };
  }

  /**
   * Map House Product data from Excel columns to clean property names
   */
  private mapHouseProductData(row: any): any {
    if (!row) return null;

    return {
      ShipmentNo: row['Shipment Number'],
      ProductName: row['Product Name'],
      ProductDescription: row['Product Description'],
      ShippingBillNo: row['Shipping Bill Number'],
      ShippingBillDate: this.parseDate(row['Shipping Bill Date']),
      GrossWeight: this.parseNumber(row['Gross Weight']),
      NetWeight: this.parseNumber(row['Net Weight']),
      Volume: this.parseNumber(row['Volume (CBM)']),
      PkgType: this.parseInt(row['Package Type']),
      NoOfPkg: this.parseInt(row['No of Packages']),
      ChargeableWeight: this.parseNumber(row['Chargeable Weight']),
      IsHaz: row['Hazardous (Y/N)'],
      UnNo: row['UN Number'],
      ImcoClass: row['IMCO Class'],
      HsCode: row['HS Code']
    };
  }

  /**
   * Map House Connection data from Excel columns to clean property names
   */
  private mapHouseConnectionData(row: any): any {
    if (!row) return null;

    return {
      ShipmentNo: row['Shipment Number'],
      Mode: row['Mode'],
      POL: row['POL (Port Code)'],
      POD: row['POD (Port Code)'],
      VesselName: row['Vessel Name'],
      VoyageNo: row['Voyage Number'],
      ETD: this.parseDate(row['ETD']),
      ETA: this.parseDate(row['ETA']),
      ATD: this.parseDate(row['ATD']),
      ATA: this.parseDate(row['ATA']),
      Remarks: row['Remarks']
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

    // Create Containers sheet
    const containersHeaders = [
      ['Container Number', 'Container Type', 'Line Seal', 'Customs Seal', 'HS Code',
        'Commodity Description', 'Package Type', 'No of Packages', 'Gross Weight', 'Net Weight',
        'Chargeable Weight', 'Volume (CBM)', 'Is SOC (Y/N)']
    ];

    const containersSample = [
      ['TCLU1234567', '40', 'MSC001', 'CUST001', '8471.30', 'Electronic Equipment',
        '10', '100', '5000', '4800', '5000', '25.5', 'N']
    ];

    const containersWs = XLSX.utils.aoa_to_sheet([...containersHeaders, ...containersSample]);
    containersWs['!cols'] = Array(13).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(workbook, containersWs, 'Containers');

    // Create Master Voyages sheet
    const masterVoyagesHeaders = [
      ['Vessel Name', 'Voyage Number', 'ETD', 'ETA', 'ATA', 'ATD', 'Destination ATA', 'Carrier Name']
    ];

    const masterVoyagesSample = [
      ['MSC EMMA', 'V123', '2025-01-25', '2025-02-15', '2025-02-16', '2025-01-26', '2025-02-20', 'MSC']
    ];

    const masterVoyagesWs = XLSX.utils.aoa_to_sheet([...masterVoyagesHeaders, ...masterVoyagesSample]);
    masterVoyagesWs['!cols'] = Array(8).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(workbook, masterVoyagesWs, 'Master Voyages');

    // Create Master Connections sheet
    const masterConnectionsHeaders = [
      ['Mode', 'POL (Port Code)', 'POD (Port Code)', 'Vessel Name', 'Voyage Number',
        'ETD', 'ETA', 'ATD', 'ATA', 'Remarks']
    ];

    const masterConnectionsSample = [
      ['Sea', 'INCCU', 'AEJEA', 'MSC EMMA', 'V123', '2025-01-25', '2025-02-15',
        '2025-01-26', '2025-02-16', 'Direct connection']
    ];

    const masterConnectionsWs = XLSX.utils.aoa_to_sheet([...masterConnectionsHeaders, ...masterConnectionsSample]);
    masterConnectionsWs['!cols'] = Array(10).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(workbook, masterConnectionsWs, 'Master Connections');

    // Create Master Others sheet
    const masterOthersHeaders = [
      ['Yard', 'Yard Address', 'Transporter', 'Handling Information', 'Internal Note', 'CFS', 'CFS Address',
        'Stuffing Start Date', 'Stuffing End Date', 'Currency Code', 'Sell Exchange Rate', 'Agent Exchange Rate',
        'Coload (Y/N)', 'Co Loader', 'Export DO Number', 'Export DO Date', 'SOB Date']
    ];

    const masterOthersSample = [
      ['Chennai Yard', '123 Yard St, Chennai', 'ABC Transport', 'Handle with care', 'Priority shipment',
        'Chennai CFS', '456 CFS Ave, Chennai', '2025-01-20', '2025-01-22', 'USD', '83.50', '83.00',
        'N', '', 'DO123456', '2025-01-18', '2025-01-15']
    ];

    const masterOthersWs = XLSX.utils.aoa_to_sheet([...masterOthersHeaders, ...masterOthersSample]);
    masterOthersWs['!cols'] = Array(17).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(workbook, masterOthersWs, 'Master Others');

    // Create House Cargo sheet
    const houseCargoHeaders = [
      ['Shipment Number', 'Cargo Type', 'Gross Weight', 'Net Weight', 'Volume (CBM)', 'Chargeable Weight',
        'No of Packages', 'Package Type', 'Container Number', 'Container Type', 'Commodity Description',
        'Marks and Number', 'Freight Amount']
    ];

    const houseCargoSample = [
      ['SHIP-001', 'General', '2500', '2400', '12.5', '2500', '50', '10', 'TCLU1234567', '40',
        'Electronic Goods', 'Sample Marks', '5000']
    ];

    const houseCargoWs = XLSX.utils.aoa_to_sheet([...houseCargoHeaders, ...houseCargoSample]);
    houseCargoWs['!cols'] = Array(13).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(workbook, houseCargoWs, 'House Cargo');

    // Create House Products sheet
    const houseProductsHeaders = [
      ['Shipment Number', 'Product Name', 'Product Description', 'Shipping Bill Number', 'Shipping Bill Date',
        'Gross Weight', 'Net Weight', 'Volume (CBM)', 'Package Type', 'No of Packages', 'Chargeable Weight',
        'Hazardous (Y/N)', 'UN Number', 'IMCO Class', 'HS Code']
    ];

    const houseProductsSample = [
      ['SHIP-001', 'Laptops', 'Dell Laptops', 'SB123456', '2025-01-15', '1000', '950', '5.0',
        '10', '20', '1000', 'N', '', '', '8471.30']
    ];

    const houseProductsWs = XLSX.utils.aoa_to_sheet([...houseProductsHeaders, ...houseProductsSample]);
    houseProductsWs['!cols'] = Array(15).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(workbook, houseProductsWs, 'House Products');

    // Create House Connections sheet
    const houseConnectionsHeaders = [
      ['Shipment Number', 'Mode', 'POL (Port Code)', 'POD (Port Code)', 'Vessel Name', 'Voyage Number',
        'ETD', 'ETA', 'ATD', 'ATA', 'Remarks']
    ];

    const houseConnectionsSample = [
      ['SHIP-001', 'Sea', 'INCCU', 'AEJEA', 'MSC EMMA', 'V123', '2025-01-25', '2025-02-15',
        '2025-01-26', '2025-02-16', 'Direct route']
    ];

    const houseConnectionsWs = XLSX.utils.aoa_to_sheet([...houseConnectionsHeaders, ...houseConnectionsSample]);
    houseConnectionsWs['!cols'] = Array(11).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(workbook, houseConnectionsWs, 'House Connections');

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
