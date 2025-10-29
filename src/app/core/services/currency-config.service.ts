/**
 * @fileoverview Currency Configuration Service
 * @description Manages currency configurations, caching, and provides lookup functionality.
 * This service acts as a centralized repository for all currency-related configuration data.
 * 
 * @module CurrencyConfigurationService
 * @requires @angular/core
 * @requires rxjs
 * @requires ./currency.model
 */

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrencyConfig, CurrencyMaster } from 'src/app/modules/crm-mobile/Interfaces/currency.interface';

/**
 * Service responsible for managing currency configurations.
 * 
 * **Key Responsibilities:**
 * - Store and cache currency configurations in memory
 * - Convert CurrencyMaster objects to CurrencyConfig format
 * - Provide fast lookup of currency configurations by currency code
 * - Manage company's base currency setting
 * - Support reactive updates through RxJS Observables
 * 
 * **Usage Pattern:**
 * 1. Initialize the service with currency data from your component
 * 2. Use getCurrencyConfig() for synchronous lookups
 * 3. Use getCurrencyConfig$() for reactive/Observable-based lookups
 * 
 * @class CurrencyConfigurationService
 * @injectable
 * 
 * @example
 * // In your component's ngOnInit:
 * this.currencyConfigService.initializeConfigurations(this.currencyList);
 * 
 * // Later, to get a specific currency config:
 * const usdConfig = this.currencyConfigService.getCurrencyConfig('USD');
 */
@Injectable({
  providedIn: 'root'
})
export class CurrencyConfigurationService {
  
  /**
   * Internal cache storing currency configurations indexed by currency code.
   * Uses BehaviorSubject to enable reactive updates.
   * 
   * @private
   * @type {BehaviorSubject<Map<string, CurrencyConfig>>}
   */
  private currencyConfigCache$ = new BehaviorSubject<Map<string, CurrencyConfig>>(new Map());
  
  /**
   * Stores the company's base/default currency configuration.
   * This is typically the currency in which your company operates.
   * 
   * @private
   * @type {BehaviorSubject<CurrencyConfig | null>}
   */
  private companyCurrency$ = new BehaviorSubject<CurrencyConfig | null>(null);

  /**
   * Creates an instance of CurrencyConfigurationService.
   * No HTTP calls are made in the constructor - data is provided externally.
   * 
   * @constructor
   */
  constructor() { }

  /**
   * Initializes the service with a pre-fetched list of currencies.
   * This method should be called once from your component after fetching currency data.
   * 
   * **Processing Steps:**
   * 1. Filters active currencies (status === 'A')
   * 2. Converts CurrencyMaster objects to CurrencyConfig format
   * 3. Stores configurations in an indexed Map for fast lookup
   * 4. Emits the new configuration map to all subscribers
   * 
   * @public
   * @param {CurrencyMaster[]} currencies - Array of CurrencyMaster objects from the backend
   * @returns {void}
   * 
   * @example
   * // In CostEntryComponent after fetching data:
   * this.operationService.getCostEntryLookups().subscribe(lookups => {
   *   this.currencyList = lookups.currencies;
   *   this.currencyConfigService.initializeConfigurations(this.currencyList);
   * });
   */
  public initializeConfigurations(currencies: CurrencyMaster[]): void {
    const configMap = this.mapToConfigMap(currencies);
    this.currencyConfigCache$.next(configMap);
  }

  /**
   * Converts an array of CurrencyMaster objects to a Map of CurrencyConfig objects.
   * Only processes currencies with status 'A' (Active).
   * 
   * @private
   * @param {CurrencyMaster[]} currencies - Array of currency master records
   * @returns {Map<string, CurrencyConfig>} Map indexed by currency code
   * 
   * @example
   * // Internal usage only:
   * const configMap = this.mapToConfigMap(currenciesFromDB);
   * // Result: Map { 'USD' => {...}, 'EUR' => {...}, 'INR' => {...} }
   */
  private mapToConfigMap(currencies: CurrencyMaster[]): Map<string, CurrencyConfig> {
    const configMap = new Map<string, CurrencyConfig>();
    
    currencies.forEach(currency => {
      if (currency.status === 'A') { // Only process active currencies
        configMap.set(currency.currencyCode, this.convertToConfig(currency));
      }
    });
    
    return configMap;
  }

  /**
   * Converts a single CurrencyMaster object to CurrencyConfig format.
   * Parses and normalizes fields for easier consumption by formatting logic.
   * 
   * **Field Transformations:**
   * - RoundOf (string) → roundOffDecimal (number)
   * - Symbol (nullable) → symbol (with fallback to currency code)
   * - Adds default symbolPosition as 'before'
   * 
   * @private
   * @param {CurrencyMaster} currency - The currency master record to convert
   * @returns {CurrencyConfig} Simplified configuration object
   * 
   * @example
   * // Internal usage:
   * const config = this.convertToConfig(currencyMasterRecord);
   * // Result: { currencyCode: 'USD', symbol: '$', amountDecimal: 2, ... }
   */
  private convertToConfig(currency: CurrencyMaster): CurrencyConfig {
    return {
      currencyCode: currency.currencyCode,
      currencyName: currency.currencyName,
      amountDecimal: currency.amountDecimal,
      exchangeDecimal: currency.exchangeDecimal,
      roundOffDecimal: this.parseRoundOff(currency.RoundOf),
      symbol: currency.Symbol || currency.currencyCode,
      symbolPosition: 'before' // Default position; customize based on your requirements
    };
  }

  /**
   * Parses the RoundOf field to extract the number of decimal places.
   * Handles multiple input formats for flexibility.
   * 
   * **Supported Formats:**
   * - Integer string: "3" → 3
   * - Decimal string: "0.001" → 3 (counts decimal places)
   * - Null/undefined → 2 (default)
   * 
   * @private
   * @param {string | null | undefined} roundOf - The RoundOf field value
   * @returns {number} Number of decimal places for rounding
   * 
   * @example
   * this.parseRoundOff('3');        // Returns: 3
   * this.parseRoundOff('0.001');    // Returns: 3
   * this.parseRoundOff(null);       // Returns: 2 (default)
   */
  private parseRoundOff(roundOf: string | null | undefined): number {
    if (!roundOf) return 2; // Default to 2 decimal places
    
    // Try parsing as integer string
    const parsed = parseInt(roundOf, 10);
    if (!isNaN(parsed)) return parsed;
    
    // Try parsing as decimal string (count decimal places)
    const parts = roundOf.split('.');
    if (parts.length === 2) {
      return parts[1].length;
    }
    
    return 2; // Fallback default
  }

  /**
   * Retrieves a currency configuration synchronously from the cache.
   * This is the primary method for getting currency config in most scenarios.
   * 
   * **Performance:** O(1) lookup time (Map-based)
   * 
   * @public
   * @param {string} currencyCode - The 3-character currency code (e.g., 'USD')
   * @returns {CurrencyConfig | null} The currency configuration, or null if not found
   * 
   * @example
   * const usdConfig = this.currencyConfigService.getCurrencyConfig('USD');
   * if (usdConfig) {
   *   console.log(`USD uses ${usdConfig.amountDecimal} decimal places`);
   * }
   */
  public getCurrencyConfig(currencyCode: string): CurrencyConfig | null {
    const configMap = this.currencyConfigCache$.value;
    return configMap.get(currencyCode) || null;
  }

  /**
   * Retrieves a currency configuration as an Observable.
   * Use this for reactive components that need to respond to configuration changes.
   * 
   * @public
   * @param {string} currencyCode - The 3-character currency code
   * @returns {Observable<CurrencyConfig | null>} Observable that emits the configuration
   * 
   * @example
   * this.currencyConfigService.getCurrencyConfig$('USD').subscribe(config => {
   *   if (config) {
   *     this.displaySymbol = config.symbol;
   *   }
   * });
   */
  public getCurrencyConfig$(currencyCode: string): Observable<CurrencyConfig | null> {
    return this.currencyConfigCache$.pipe(
      map(configMap => configMap.get(currencyCode) || null)
    );
  }

  /**
   * Retrieves all currency configurations as a Map.
   * Useful for populating dropdowns or displaying currency lists.
   * 
   * @public
   * @returns {Map<string, CurrencyConfig>} Map of all active currency configurations
   * 
   * @example
   * const allConfigs = this.currencyConfigService.getAllCurrencyConfigs();
   * const currencyCodes = Array.from(allConfigs.keys()); // ['USD', 'EUR', 'INR', ...]
   */
  public getAllCurrencyConfigs(): Map<string, CurrencyConfig> {
    return this.currencyConfigCache$.value;
  }

  /**
   * Retrieves all currency configurations as an Observable.
   * Emits whenever the configuration map is updated.
   * 
   * @public
   * @returns {Observable<Map<string, CurrencyConfig>>} Observable stream of configuration maps
   * 
   * @example
   * this.currencyConfigService.getAllCurrencyConfigs$().subscribe(configMap => {
   *   this.availableCurrencies = Array.from(configMap.values());
   * });
   */
  public getAllCurrencyConfigs$(): Observable<Map<string, CurrencyConfig>> {
    return this.currencyConfigCache$.asObservable();
  }

  /**
   * Sets the company's base/default currency.
   * This is typically called during app initialization with the company's primary currency.
   * 
   * @public
   * @param {string} currencyCode - The currency code to set as company currency
   * @returns {void}
   * 
   * @example
   * // During app initialization:
   * this.currencyConfigService.setCompanyCurrency('INR');
   */
  public setCompanyCurrency(currencyCode: string): void {
    const config = this.getCurrencyConfig(currencyCode);
    if (config) {
      this.companyCurrency$.next(config);
    } else {
      console.warn(`Cannot set company currency: ${currencyCode} not found in configurations`);
    }
  }

  /**
   * Retrieves the company's base currency configuration synchronously.
   * 
   * @public
   * @returns {CurrencyConfig | null} The company currency config, or null if not set
   * 
   * @example
   * const companyCurrency = this.currencyConfigService.getCompanyCurrency();
   * if (companyCurrency) {
   *   console.log(`Company operates in ${companyCurrency.currencyCode}`);
   * }
   */
  public getCompanyCurrency(): CurrencyConfig | null {
    return this.companyCurrency$.value;
  }

  /**
   * Retrieves the company's base currency as an Observable.
   * Emits whenever the company currency is updated.
   * 
   * @public
   * @returns {Observable<CurrencyConfig | null>} Observable stream of company currency
   * 
   * @example
   * this.currencyConfigService.getCompanyCurrency$().subscribe(currency => {
   *   if (currency) {
   *     this.baseCurrencySymbol = currency.symbol;
   *   }
   * });
   */
  public getCompanyCurrency$(): Observable<CurrencyConfig | null> {
    return this.companyCurrency$.asObservable();
  }

  /**
   * Manually adds or updates a single currency configuration.
   * Useful for testing, dynamic updates, or handling special cases.
   * 
   * @public
   * @param {CurrencyConfig} config - The currency configuration to add/update
   * @returns {void}
   * 
   * @example
   * // Add a custom test currency:
   * this.currencyConfigService.updateCurrencyConfig({
   *   currencyCode: 'TST',
   *   currencyName: 'Test Currency',
   *   amountDecimal: 4,
   *   exchangeDecimal: 6,
   *   roundOffDecimal: 5,
   *   symbol: 'T$',
   *   symbolPosition: 'before'
   * });
   */
  public updateCurrencyConfig(config: CurrencyConfig): void {
    const configMap = new Map(this.currencyConfigCache$.value);
    configMap.set(config.currencyCode, config);
    this.currencyConfigCache$.next(configMap);
  }
}
