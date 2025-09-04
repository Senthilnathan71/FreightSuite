import { Injectable } from '@angular/core';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import * as XLSX from 'xlsx';

export interface BookingData {
  bookingHeader: any;
  bookingCargo: any;
  bookingOthers: any;
  bookingProducts: any[];
  bookingConnections: any[];
  costRevenueCharges: any[];
  shipmentMilestones: any[];
  [key :string] : any;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelParserService {

  constructor(private appSettingService: AppSettingsService) { }

  parseExcelFile(file: File): Promise<BookingData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          
          // Validate required sheets exist
          const requiredSheets = [
            'BookingHeader', 'BookingCargo', 'BookingOthers',
            'BookingProduct', 'BookingConnection', 
            'CostRevenueCharges', 'ShipmentMilestone'
          ];

          requiredSheets.forEach(sheet => {
            if (!workbook.SheetNames.includes(sheet)) {
              this.appSettingService.showWarning(`Missing required sheet: ${sheet}`);
              if(sheet === 'BookingHeader'){
                this.appSettingService.showWarning(`BookingHeader sheet is required`);
                return;
              }
            }
          });
          

          const sheetsData = this.parseAllSheets(workbook);

          const bookings = this.convertSheetsToNestedStructure(sheetsData);
          resolve(bookings);
          
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  }

  private parseAllSheets(workbook: XLSX.WorkBook): { [sheetName: string]: any[] } {
    const sheetsData: { [sheetName: string]: any[] } = {};
    
    const sheetNames = [
      'BookingHeader', 'BookingCargo', 'BookingOthers',
      'BookingProduct', 'BookingConnection', 
      'CostRevenueCharges', 'ShipmentMilestone'
    ];
    
    sheetNames.forEach(sheetName => {
      if (workbook.Sheets[sheetName]) {
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        sheetsData[sheetName] = jsonData;
      } else {
        sheetsData[sheetName] = [];
      }
    });
    
    return sheetsData;
  }

  private convertSheetsToNestedStructure(sheetsData: { [sheetName: string]: any[] }): BookingData[] {
    const bookings: BookingData[] = [];
    
    const bookingHeaders = sheetsData['BookingHeader'] || [];
    const bookingCargos = sheetsData['BookingCargo'] || [];
    const bookingOthers = sheetsData['BookingOthers'] || [];
    
    bookingHeaders.forEach(header => {
      const bookingNo = header.BookingNo;
      
      if (!bookingNo) {
        console.warn('BookingHeader row missing BookingNo:', header);
        return;
      }
      
      const cargo = bookingCargos.find(c => c.BookingNo === bookingNo) || {};
      const others = bookingOthers.find(o => o.BookingNo === bookingNo) || {};
      const products = this.filterByBookingNo(sheetsData['BookingProduct'], bookingNo);
      const connections = this.filterByBookingNo(sheetsData['BookingConnection'], bookingNo);
      const charges = this.filterByBookingNo(sheetsData['CostRevenueCharges'], bookingNo);
      const milestones = this.filterByBookingNo(sheetsData['ShipmentMilestone'], bookingNo);

      const cleanHeader = this.removeBookingNo(header);
      const cleanCargo = this.removeBookingNo(cargo);
      const cleanOthers = this.removeBookingNo(others);
      const cleanProducts = products.map(p => this.removeBookingNo(p));
      const cleanConnections = connections.map(c => this.removeBookingNo(c));
      const cleanCharges = charges.map(c => this.removeBookingNo(c));
      const cleanMilestones = milestones.map(m => this.removeBookingNo(m));
      
      bookings.push({
        ...cleanHeader,
        bookingCargo: [cleanCargo],
        bookingOthers: [cleanOthers],
        bookingProduct: cleanProducts,
        bookingConnection: cleanConnections,
        bookingRates: cleanCharges,
        shipmentMilestones: cleanMilestones
      });
    });
    
    return bookings;
  }

  private filterByBookingNo(data: any[], bookingNo: string): any[] {
    return (data || []).filter(item => item.BookingNo === bookingNo);
  }

  private removeBookingNo(obj: any): any {
    const { BookingNo, ...rest } = obj;
    return rest;
  }
}
