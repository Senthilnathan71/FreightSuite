import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  CompanyConfiguration,
  SystemSettings,
  ModuleFeatures,
  FieldMapping,
  ApiResponse
} from '../models/company-config.interface';
import { MasterService } from '../../master.service';

@Injectable({
  providedIn: 'root'
})
export class CompanyConfigService {

  constructor(private masterService: MasterService) {}

  /**
   * Get field configuration template (uses existing MasterService method)
   */
  getFieldConfiguration(): Observable<any> {
    return this.masterService.getFieldConfiguration();
  }

  /**
   * Get company configuration by ID
   */
  getCompanyConfiguration(companyId: number): Observable<CompanyConfiguration | null> {
    return this.masterService.getCompanyConfig(companyId).pipe(
      map(response => response?.config || null),
      catchError(this.handleError<CompanyConfiguration | null>('getCompanyConfiguration', null))
    );
  }

  /**
   * Save company configuration (uses existing MasterService method)
   * This saves to CompanyMaster table config column
   */
  saveCompanyConfiguration(companyId: number, config: CompanyConfiguration): Observable<any> {
    return this.masterService.saveCompanyConfig(companyId, config);
  }

  /**
   * Get available currencies from CurrencyMaster table
   */
  getAvailableCurrencies(): Observable<any[]> {
    return this.masterService.getAllCurrencies().pipe(
      map((currencies: any[]) => {
        if (!currencies || !Array.isArray(currencies)) {
          return [];
        }
        // Map to the format expected by the component
        return currencies
          .filter(c => c.status === 'A') // Only active currencies
          .map(currency => ({
            code: currency.currencyCode || currency.CurrencyCode,
            name: currency.currencyName || currency.CurrencyName,
            symbol: currency.Symbol || currency.symbol || ''
          }));
      }),
      catchError(error => {
        console.error('Error fetching currencies:', error);
        // Return empty array on error
        return of([]);
      })
    );
  }

  /**
   * Get available timezones
   */
  getAvailableTimezones(): Observable<{ value: string; label: string }[]> {
    return of([
      { value: 'UTC', label: 'UTC' },
      { value: 'America/New_York', label: 'Eastern Time (ET)' },
      { value: 'America/Chicago', label: 'Central Time (CT)' },
      { value: 'America/Denver', label: 'Mountain Time (MT)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
      { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
      { value: 'Europe/Paris', label: 'Central European Time (CET)' },
      { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
      { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
      { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
      { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
      { value: 'Asia/Singapore', label: 'Singapore Time (SGT)' },
      { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
      { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
      { value: 'Pacific/Auckland', label: 'New Zealand Time (NZST)' }
    ]);
  }

  /**
   * Get default configuration structure (enhanced version)
   */
  getDefaultConfiguration(): CompanyConfiguration {
    return {
      systemSettings: {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24',
        timezone: 'UTC',
        currency: {
          code: 'USD',
          symbol: '$',
          position: 'before',
          decimalPlaces: 2
        },
        company: {
          name: '',
          address: '',
          contact: ''
        }
      },
      moduleFeatures: {
        crm: {
          leadManagement: { enabled: true, description: 'Enable lead capture and management' },
          enquiryProcessing: { enabled: true, description: 'Enable enquiry workflow' },
          quotationGeneration: { enabled: true, description: 'Enable quotation creation and approval' },
          customerPortal: { enabled: false, description: 'Enable customer self-service portal' },
          emailIntegration: { enabled: true, description: 'Enable email notifications and templates' },
          reportingDashboard: { enabled: true, description: 'Enable CRM analytics dashboard' }
        },
        operations: {
          bookingManagement: { enabled: true, description: 'Enable booking creation and tracking' },
          documentGeneration: { enabled: true, description: 'Enable document generation (BL, Invoice, etc.)' },
          containerTracking: { enabled: true, description: 'Enable real-time container tracking' },
          milestoneTracking: { enabled: true, description: 'Enable shipment milestone updates' },
          vendorManagement: { enabled: true, description: 'Enable vendor and supplier management' },
          cargoManagement: { enabled: true, description: 'Enable cargo details and handling' }
        },
        accounts: {
          invoiceGeneration: { enabled: true, description: 'Enable automated invoice generation' },
          paymentTracking: { enabled: true, description: 'Enable payment status tracking' },
          creditManagement: { enabled: false, description: 'Enable credit limit and terms management' },
          taxCalculation: { enabled: true, description: 'Enable automated tax calculations' },
          multiCurrency: { enabled: true, description: 'Enable multi-currency support' },
          profitAnalysis: { enabled: false, description: 'Enable profit margin analysis' }
        },
        masters: {
          portManagement: { enabled: true, description: 'Enable port master data management' },
          vesselManagement: { enabled: true, description: 'Enable vessel master data management' },
          chargeManagement: { enabled: true, description: 'Enable charge master data management' },
          customerManagement: { enabled: true, description: 'Enable customer master data management' },
          supplierManagement: { enabled: true, description: 'Enable supplier master data management' },
          userManagement: { enabled: true, description: 'Enable user and role management' }
        }
      },
      fieldCustomization: {
        crm: {},
        operations: {},
        accounts: {},
        masters: {}
      }
    };
  }

  /**
   * Get default system settings
   */
  getDefaultSystemSettings(): SystemSettings {
    return {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24',
      timezone: 'UTC',
      currency: {
        code: 'USD',
        symbol: '$',
        position: 'before',
        decimalPlaces: 2
      },
      numberFormat: {
        decimalSeparator: '.',
        thousandSeparator: ',',
        decimalPlaces: 2
      },
      preferences: {
        enableNotifications: true,
        autoSave: true,
        sessionTimeout: 30
      }
    };
  }

  /**
   * Get date format options
   */
  getDateFormatOptions(): { value: string; label: string }[] {
    return [
      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
      { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2024)' },
      { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY (12-31-2024)' },
      { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2024)' },
      { value: 'DD MMM YYYY', label: 'DD MMM YYYY (31 Dec 2024)' },
      { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY (31-Dec-2024)' },
      { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (Dec 31, 2024)' },
      { value: 'MMMM DD, YYYY', label: 'MMMM DD, YYYY (December 31, 2024)' }
    ];
  }

  /**
   * Get time format options
   */
  getTimeFormatOptions(): { value: string; label: string }[] {
    return [
      { value: '12', label: '12 Hour (3:30 PM)' },
      { value: '24', label: '24 Hour (15:30)' }
    ];
  }

  /**
   * Get currency position options
   */
  getCurrencyPositionOptions(): { value: string; label: string }[] {
    return [
      { value: 'before', label: 'Before Amount ($100.00)' },
      { value: 'after', label: 'After Amount (100.00$)' }
    ];
  }

  /**
   * Format label helper method (matches existing pattern)
   */
  formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }

  /**
   * Handle HTTP operation that failed
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}