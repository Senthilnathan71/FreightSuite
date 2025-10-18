import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GlobalDateFormatService } from './global-date-format.service';
import { CompanyConfigService } from '../../modules/master/company/services/company-config.service';

export interface NumberFormatSettings {
  decimalSeparator: string;
  thousandSeparator: string;
  decimalPlaces: number;
}

export interface CurrencySettings {
  code: string;
  symbol: string;
  position: 'before' | 'after';
  decimalPlaces: number;
  currencyMasterSid?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CompanySettingsManagerService {
  private currentCompanyIdSubject = new BehaviorSubject<number | null>(null);
  public currentCompanyId$ = this.currentCompanyIdSubject.asObservable();

  private numberFormatSubject = new BehaviorSubject<NumberFormatSettings>({
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  });
  public numberFormat$ = this.numberFormatSubject.asObservable();

  private currencySettingsSubject = new BehaviorSubject<CurrencySettings>({
    code: 'USD',
    symbol: '$',
    position: 'before',
    decimalPlaces: 2
  });
  public currencySettings$ = this.currencySettingsSubject.asObservable();

  private isLoggingOut = false;

  constructor(
    private globalDateService: GlobalDateFormatService,
    private configService: CompanyConfigService
  ) {}

  /**
   * Set the current company and load its configuration
   */
  setCurrentCompany(companyId: number): void {
    if (this.isLoggingOut) {
      console.warn('Skipping company settings load during logout');
      return;
    }

    this.currentCompanyIdSubject.next(companyId);

    // Store in localStorage for persistence across sessions
    localStorage.setItem('selectedCompanyId', companyId.toString());

    // Load the company's date format configuration
    this.loadCompanySettings(companyId);
  }

  /**
   * Get the current company ID
   */
  getCurrentCompanyId(): number | null {
    return this.currentCompanyIdSubject.value;
  }

  /**
   * Load company settings and apply them globally
   */
  private loadCompanySettings(companyId: number): void {
    this.configService.getCompanyConfiguration(companyId).subscribe({
      next: (config) => {
        if (config?.systemSettings) {
          // Store the complete config in localStorage for quick access
          localStorage.setItem(`company-config-${companyId}`, JSON.stringify(config));

          // Apply date format
          if (config.systemSettings.dateFormat) {
            this.globalDateService.setDateFormat(config.systemSettings.dateFormat);
          }

          // Apply number format settings
          if (config.systemSettings.numberFormat) {
            const numberFormat: NumberFormatSettings = {
              decimalSeparator: config.systemSettings.numberFormat.decimalSeparator || '.',
              thousandSeparator: config.systemSettings.numberFormat.thousandSeparator || ',',
              decimalPlaces: config.systemSettings.numberFormat.decimalPlaces ?? 2
            };
            this.numberFormatSubject.next(numberFormat);
            localStorage.setItem('companyNumberFormat', JSON.stringify(numberFormat));
          }

          // Apply currency settings
          if (config.systemSettings.currency) {
            const currencySettings: CurrencySettings = {
              code: config.systemSettings.currency.code || 'USD',
              symbol: config.systemSettings.currency.symbol || '$',
              position: config.systemSettings.currency.position || 'before',
              decimalPlaces: config.systemSettings.currency.decimalPlaces ?? 2
            };
            this.currencySettingsSubject.next(currencySettings);
            localStorage.setItem('companyCurrency', JSON.stringify(currencySettings));
          }
        }
      },
      error: (error) => {
        console.warn('Could not load company settings:', error);
      }
    });
  }

  /**
   * Initialize from stored company ID
   */
  initializeFromStorage(): void {
    // Check if user is authenticated before making API calls
    if (this.isLoggingOut || !this.isUserAuthenticated()) {
      console.warn('User not authenticated or logging out, skipping company date format initialization');
      return;
    }

    const storedCompanyId = localStorage.getItem('selectedCompanyId');
    if (storedCompanyId) {
      const companyId = parseInt(storedCompanyId, 10);
      if (!isNaN(companyId)) {
        this.setCurrentCompany(companyId);
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  private isUserAuthenticated(): boolean {
    try {
      // Check for token using the same method as the app
      // The app uses StorageMap service for crm-token
      const userProfile = localStorage.getItem('userProfile');
      return !!userProfile;
    } catch (error) {
      console.warn('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Update date format for current company
   */
  updateDateFormat(dateFormat: string): void {
    this.globalDateService.setDateFormat(dateFormat);

    const companyId = this.getCurrentCompanyId();
    if (companyId) {
      // Store updated format in localStorage for immediate use
      localStorage.setItem('companyDateFormat', dateFormat);
    }
  }

  /**
   * Get current number format settings (synchronous)
   */
  getNumberFormat(): NumberFormatSettings {
    return this.numberFormatSubject.value;
  }

  /**
   * Get current currency settings (synchronous)
   * Reads from localStorage if not yet loaded in BehaviorSubject
   */
  getCurrencySettings(): CurrencySettings {
    // First, try to get from stored company config based on current company
    const companyId = this.getCurrentCompanyId();
    if (companyId) {
      const storedConfig = localStorage.getItem(`company-config-${companyId}`);
      if (storedConfig) {
        try {
          const config = JSON.parse(storedConfig);
          if (config?.systemSettings?.currency) {
            const currencySettings: CurrencySettings = {
              code: config.systemSettings.currency.code || 'USD',
              symbol: config.systemSettings.currency.symbol || '$',
              position: config.systemSettings.currency.position || 'before',
              decimalPlaces: config.systemSettings.currency.decimalPlaces ?? 2
            };
            // Update the subject so other subscribers get the latest value
            this.currencySettingsSubject.next(currencySettings);
            return currencySettings;
          }
        } catch (e) {
          console.warn('Could not parse stored company config:', e);
        }
      }
    }

    // Fallback: return current BehaviorSubject value
    return this.currencySettingsSubject.value;
  }

  /**
   * Update number format settings
   */
  updateNumberFormat(numberFormat: NumberFormatSettings): void {
    this.numberFormatSubject.next(numberFormat);
    localStorage.setItem('companyNumberFormat', JSON.stringify(numberFormat));
  }

  /**
   * Update currency settings
   */
  updateCurrencySettings(currencySettings: CurrencySettings): void {
    this.currencySettingsSubject.next(currencySettings);
    localStorage.setItem('companyCurrency', JSON.stringify(currencySettings));
  }

  /**
   * Format a number using company settings
   */
  formatNumber(value: number, customDecimalPlaces?: number): string {
    const settings = this.getNumberFormat();
    const decimals = customDecimalPlaces ?? settings.decimalPlaces;

    // Round to specified decimal places
    const roundedValue = Number(value.toFixed(decimals));

    // Split into integer and decimal parts
    const parts = roundedValue.toString().split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';

    // Add thousand separators
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, settings.thousandSeparator);

    // Combine with decimal separator
    if (decimals > 0) {
      const paddedDecimals = decimalPart.padEnd(decimals, '0');
      return `${formattedInteger}${settings.decimalSeparator}${paddedDecimals}`;
    }

    return formattedInteger;
  }

  /**
   * Format a currency value using company settings
   */
  formatCurrency(value: number, customDecimalPlaces?: number): string {
    const currencySettings = this.getCurrencySettings();
    const decimals = customDecimalPlaces ?? currencySettings.decimalPlaces;
    const formattedNumber = this.formatNumber(value, decimals);

    if (currencySettings.position === 'before') {
      return `${currencySettings.symbol}${formattedNumber}`;
    } else {
      return `${formattedNumber} ${currencySettings.symbol}`;
    }
  }

  /**
   * Clear company settings (call during logout)
   */
  clearCompanySettings(): void {
    this.isLoggingOut = true;
    this.currentCompanyIdSubject.next(null);
    localStorage.removeItem('selectedCompanyId');
    localStorage.removeItem('companyDateFormat');
    localStorage.removeItem('companyNumberFormat');
    localStorage.removeItem('companyCurrency');
    this.globalDateService.setDateFormat('DD/MM/YYYY'); // Reset to default

    // Reset to defaults
    this.numberFormatSubject.next({
      decimalSeparator: '.',
      thousandSeparator: ',',
      decimalPlaces: 2
    });
    this.currencySettingsSubject.next({
      code: 'USD',
      symbol: '$',
      position: 'before',
      decimalPlaces: 2
    });
  }

  /**
   * Safe initialization that won't cause API loops during logout
   */
  safeInitialize(): void {
    // Only load from localStorage cache, don't make API calls
    const cachedFormat = localStorage.getItem('companyDateFormat');
    if (cachedFormat) {
      this.globalDateService.setDateFormat(cachedFormat);
    }

    const cachedNumberFormat = localStorage.getItem('companyNumberFormat');
    if (cachedNumberFormat) {
      try {
        const numberFormat = JSON.parse(cachedNumberFormat);
        this.numberFormatSubject.next(numberFormat);
      } catch (e) {
        console.warn('Could not parse cached number format:', e);
      }
    }

    const cachedCurrency = localStorage.getItem('companyCurrency');
    if (cachedCurrency) {
      try {
        const currencySettings = JSON.parse(cachedCurrency);
        this.currencySettingsSubject.next(currencySettings);
      } catch (e) {
        console.warn('Could not parse cached currency settings:', e);
      }
    }
  }
}