/**
 * @fileoverview Currency Formatting Service
 * @description Provides currency formatting utilities with support for custom rounding,
 * truncation, and decimal precision rules based on currency configurations.
 * 
 * @module CurrencyFormattingService
 * @requires @angular/core
 * @requires ./currency-configuration.service
 * @requires ./currency.model
 */

import { Injectable } from '@angular/core';
import { CurrencyConfigurationService } from './currency-config.service';
import { CurrencyConfig, FormatInput, FormatInputWithOverrides, FormattingBreakdown } from 'src/app/modules/crm-mobile/Interfaces/currency.interface';

/**
 * Service for formatting currency amounts and exchange rates.
 * 
 * **Core Formatting Logic:**
 * For amounts:
 * 1. Round to `roundOffDecimal` places
 * 2. Truncate to `amountDecimal` places (without rounding)
 * 3. Apply `toFixed()` to ensure proper string format with trailing zeros
 * 4. Apply currency symbol at the configured position
 * 
 * For exchange rates:
 * 1. Truncate to `exchangeDecimal` places (no rounding)
 * 
 * **Key Features:**
 * - Precise control over rounding vs truncation
 * - Support for custom overrides per operation
 * - Comma-separated formatting for large numbers
 * - Debugging breakdown for transparency
 * - Symbol positioning (before/after amount)
 * 
 * @class CurrencyFormatService
 * @injectable
 * 
 * @example
 * // Basic usage:
 * const formatted = this.currencyFormatter.formatAmount({
 *   value: 1234.5678,
 *   currencyCode: 'USD'
 * });
 * // Result: "$1234.56"
 * 
 * @example
 * // With custom overrides:
 * const customFormatted = this.currencyFormatter.formatAmount({
 *   value: 9999.9999,
 *   currencyCode: 'EUR',
 *   amountDecimal: 3,
 *   symbol: '€',
 *   symbolPosition: 'after'
 * });
 * // Result: "9999.999 €"
 */
@Injectable({
  providedIn: 'root'
})
export class CurrencyFormatService {

  /**
   * Creates an instance of CurrencyFormattingService.
   * Injects the CurrencyConfigurationService for accessing currency rules.
   * 
   * @constructor
   * @param {CurrencyConfigurationService} configService - Service providing currency configurations
   */
  constructor(private configService: CurrencyConfigurationService) {}

  /**
   * Formats an amount by rounding it to the currency's specific `amountDecimal` places.
   *
   * **Processing Steps:**
   * 1. Resolve the currency configuration (from cache or overrides).
   * 2. Round the input value to the `amountDecimal` places.
   * 3. Apply `toFixed()` to ensure the correct number of trailing zeros.
   * 4. Optionally, apply the currency symbol.
   *
   * **Example Calculation (USD: amountDecimal=2):**
   * ```
   * Input:      1234.5678
   * Rounded:    1234.57    (to 2 places)
   * Fixed:      "1234.57"  (string with 2 decimals)
   * Final:      "$1234.57"
   * ```
   *
   * @public
   * @param {FormatInput | FormatInputWithOverrides} input - The value and currency code, with optional overrides.
   * @param {boolean} [withSymbol=true] - Whether to include the currency symbol in the result.
   * @returns {string} The formatted amount as a string.
   *
   * @example
   * // Standard formatting:
   * const result = this.formatAmount({ value: 1234.5678, currencyCode: 'USD' });
   * // Returns: "$1234.57"
   *
   * @example
   * // Without symbol:
   * const result = this.formatAmount({ value: 1234.5678, currencyCode: 'USD' }, false);
   * // Returns: "1234.57"
   */
  public formatAmount(input: FormatInput | FormatInputWithOverrides, withSymbol: boolean = true): string {
    const currency = this.resolveCurrencyConfig(input);
    
    if (!currency) {
      // console.warn(`Currency config not found for: ${input.currencyCode}`);
      return input.value.toFixed(2); // Fallback to 2 decimal places
    }

    // Step 1: Round the value to amountDecimal places.
    const roundedValue = this.round(input.value, currency.amountDecimal);

    // Step 2: Apply toFixed() to ensure proper string format (adds trailing zeros).
    const formattedValue = roundedValue.toFixed(currency.amountDecimal);

    // Step 3: Apply symbol if requested.
    if (withSymbol) {
      return this.applySymbol(formattedValue, currency);
    }

    return formattedValue;
  }

  /**
   * Formats an exchange rate by truncating to the specified decimal places.
   * Unlike amount formatting, exchange rates are only truncated, not rounded first.
   * 
   * **Processing Steps:**
   * 1. Resolve currency configuration
   * 2. Truncate to `exchangeDecimal` places
   * 
   * **Example (USD: exchangeDecimal=3):**
   * ```
   * Input:     1234.5678
   * Truncated: 1234.567
   * ```
   * 
   * @public
   * @param {FormatInput | FormatInputWithOverrides} input - The value and currency code
   * @returns {number} The truncated exchange rate as a number
   * 
   * @example
   * const rate = this.formatExchangeRate({ value: 1234.5678, currencyCode: 'USD' });
   * // Returns: 1234.567
   */
  public formatExchangeRate(input: FormatInput | FormatInputWithOverrides): number {
    const currency = this.resolveCurrencyConfig(input);
    
    if (!currency) {
      console.warn(`Currency config not found for: ${input.currencyCode}`);
      return this.truncate(input.value, 4); // Fallback to 3 decimal places
    }

    // Truncate to exchangeDecimal places
    return this.truncate(input.value, currency.exchangeDecimal);
  }

  /**
   * Formats an exchange rate as a string with fixed decimal representation.
   * This ensures trailing zeros are included for consistent display.
   * 
   * @public
   * @param {FormatInput | FormatInputWithOverrides} input - The value and currency code
   * @returns {string} The formatted exchange rate as a string
   * 
   * @example
   * const rateStr = this.formatExchangeRateAsString({ value: 1234.5, currencyCode: 'USD' });
   * // Returns: "1234.500" (assuming exchangeDecimal=3)
   */
  public formatExchangeRateAsString(input: FormatInput | FormatInputWithOverrides): string {
    const currency = this.resolveCurrencyConfig(input);
    
    if (!currency) {
      console.warn(`Currency config not found for: ${input.currencyCode}`);
      return this.truncate(input.value, 3).toFixed(3);
    }

    return this.truncate(input.value, currency.exchangeDecimal).toString();
  }

  /**
   * Formats an amount with comma separators for thousands.
   * Useful for displaying large amounts in tables or reports.
   * 
   * **Example:**
   * ```
   * Input:  1234567.89
   * Output: "$1,234,567.89"
   * ```
   * 
   * @public
   * @param {FormatInput | FormatInputWithOverrides} input - The value and currency code
   * @param {boolean} [withSymbol=true] - Whether to include the currency symbol
   * @returns {string} The formatted amount with comma separators
   * 
   * @example
   * const formatted = this.formatAmountWithCommas({
   *   value: 1234567.89,
   *   currencyCode: 'USD'
   * });
   * // Returns: "$1,234,567.89"
   */
  public formatAmountWithCommas(input: FormatInput | FormatInputWithOverrides, withSymbol: boolean = true): string {
    const formattedValue = this.formatAmount(input, false);
    const parts = formattedValue.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decimalPart = parts[1] || '';
    
    const result = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
    
    if (withSymbol) {
      const currency = this.resolveCurrencyConfig(input);
      if (currency) {
        return this.applySymbol(result, currency);
      }
    }
    
    return result;
  }

  /**
   * Provides a detailed breakdown of the formatting process.
   * Useful for debugging, testing, and understanding how a value was formatted.
   * 
   * @public
   * @param {FormatInput | FormatInputWithOverrides} input - The value and currency code
   * @returns {FormattingBreakdown} Object containing each step of the formatting process
   * 
   * @example
   * const breakdown = this.getFormattingBreakdown({
   *   value: 1234.5678,
   *   currencyCode: 'USD'
   * });
   * 
   * console.log(breakdown);
   * // Output:
   * // {
   * //   original: 1234.5678,
   * //   rounded: 1234.568,
   * //   truncated: 1234.56,
   * //   final: "1234.56",
   * //   currency: { currencyCode: 'USD', ... }
   * // }
   */
  public getFormattingBreakdown(input: FormatInput | FormatInputWithOverrides): FormattingBreakdown {
    const currency = this.resolveCurrencyConfig(input);
    
    if (!currency) {
      return {
        original: input.value,
        rounded: input.value,
        truncated: input.value,
        final: input.value.toFixed(2),
        currency: null
      };
    }

    const rounded = this.round(input.value, currency.roundOffDecimal);
    const truncated = this.truncate(rounded, currency.amountDecimal);
    const final = truncated.toFixed(currency.amountDecimal);

    return {
      original: input.value,
      rounded,
      truncated,
      final,
      currency
    };
  }

  /**
   * Rounds a number to a specified number of decimal places using standard rounding.
   * Uses Math.round() for consistent behavior.
   * 
   * **Formula:** Math.round(value × 10^places) / 10^places
   * 
   * @private
   * @param {number} value - The number to round
   * @param {number} decimalPlaces - Number of decimal places to round to
   * @returns {number} The rounded number
   * 
   * @example
   * this.round(1234.5678, 3); // Returns: 1234.568
   * this.round(1234.5678, 2); // Returns: 1234.57
   */
  private round(value: number, decimalPlaces: number): number {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(value * factor) / factor;
  }

  /**
   * Truncates a number to a specified number of decimal places without rounding.
   * Uses Math.trunc() to simply cut off additional decimal places.
   * 
   * **Formula:** Math.trunc(value × 10^places) / 10^places
   * 
   * **Important:** This does NOT round. It simply discards extra decimal places.
   * 
   * @private
   * @param {number} value - The number to truncate
   * @param {number} decimalPlaces - Number of decimal places to keep
   * @returns {number} The truncated number
   * 
   * @example
   * this.truncate(1234.5678, 3); // Returns: 1234.567
   * this.truncate(1234.5678, 2); // Returns: 1234.56
   * this.truncate(1234.9999, 2); // Returns: 1234.99 (NOT 1235.00)
   */
  private truncate(value: number, decimalPlaces: number): number {
    const factor = Math.pow(10, decimalPlaces);
    return Math.trunc(value * factor) / factor;
  }

  /**
   * Applies a currency symbol to a formatted value string.
   * Positions the symbol before or after based on currency configuration.
   * 
   * @private
   * @param {string} valueStr - The formatted number as a string
   * @param {CurrencyConfig} currency - The currency configuration
   * @returns {string} The value with currency symbol applied
   * 
   * @example
   * this.applySymbol("1234.56", { symbol: '$', symbolPosition: 'before', ... });
   * // Returns: "$1234.56"
   * 
   * @example
   * this.applySymbol("1234.56", { symbol: '€', symbolPosition: 'after', ... });
   * // Returns: "1234.56 €"
   */
  private applySymbol(valueStr: string, currency: CurrencyConfig): string {
    return currency.symbolPosition === 'before' 
      ? `${currency.symbol}${valueStr}` 
      : `${valueStr} ${currency.symbol}`;
  }

  /**
   * Resolves the currency configuration for a given input.
   * Supports both direct lookup from cache and custom overrides.
   * 
   * **Resolution Priority:**
   * 1. Check if input contains custom overrides
   * 2. If overrides exist, merge with base config
   * 3. If no overrides, return base config from cache
   * 
   * @private
   * @param {FormatInput | FormatInputWithOverrides} input - The formatting input
   * @returns {CurrencyConfig | null} The resolved configuration, or null if not found
   * 
   * @example
   * // With overrides:
   * const config = this.resolveCurrencyConfig({
   *   value: 100,
   *   currencyCode: 'USD',
   *   amountDecimal: 3
   * });
   * // Returns: USD config with amountDecimal overridden to 3
   * 
   * @example
   * // Without overrides:
   * const config = this.resolveCurrencyConfig({
   *   value: 100,
   *   currencyCode: 'USD'
   * });
   * // Returns: Standard USD config from cache
   */
  private resolveCurrencyConfig(input: FormatInput | FormatInputWithOverrides): CurrencyConfig | null {
    // Check if input has custom overrides
    const overrides = input as FormatInputWithOverrides;
    
    if (this.hasCustomOverrides(overrides)) {
      const baseConfig = this.configService.getCurrencyConfig(input.currencyCode);
      
      // Merge base config with overrides
      return {
        currencyCode: input.currencyCode,
        currencyName: baseConfig?.currencyName || input.currencyCode,
        amountDecimal: overrides.amountDecimal ?? baseConfig?.amountDecimal ?? 2,
        exchangeDecimal: overrides.exchangeDecimal ?? baseConfig?.exchangeDecimal ?? 3,
        roundOffDecimal: overrides.roundOffDecimal ?? baseConfig?.roundOffDecimal ?? 3,
        symbol: overrides.symbol ?? baseConfig?.symbol ?? input.currencyCode,
        symbolPosition: overrides.symbolPosition ?? baseConfig?.symbolPosition ?? 'before'
      };
    }

    // No overrides, return base config
    return this.configService.getCurrencyConfig(input.currencyCode);
  }

  /**
   * Checks if the input contains any custom override properties.
   * 
   * @private
   * @param {FormatInputWithOverrides} input - The input to check
   * @returns {boolean} True if any override property is defined
   * 
   * @example
   * this.hasCustomOverrides({ value: 100, currencyCode: 'USD' });
   * // Returns: false
   * 
   * @example
   * this.hasCustomOverrides({ value: 100, currencyCode: 'USD', amountDecimal: 3 });
   * // Returns: true
   */
  private hasCustomOverrides(input: FormatInputWithOverrides): boolean {
    return !!(
      input.amountDecimal !== undefined ||
      input.exchangeDecimal !== undefined ||
      input.roundOffDecimal !== undefined ||
      input.symbol !== undefined ||
      input.symbolPosition !== undefined
    );
  }
}
