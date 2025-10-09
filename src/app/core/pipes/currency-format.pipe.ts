import { Pipe, PipeTransform } from '@angular/core';
import { CompanySettingsManagerService } from '../services/company-settings-manager.service';

/**
 * Currency Format Pipe
 *
 * Formats currency values according to company configuration settings
 * (currency symbol, position, decimal separator, thousand separator, decimal places)
 *
 * Usage:
 * {{ 1234.56 | currencyFormat }}                    // Uses company default settings
 * {{ 1234.5678 | currencyFormat:3 }}                // Override decimal places to 3
 * {{ amount | currencyFormat }}                      // Format any number variable
 *
 * Examples (assuming company config: symbol='$', position='before', decimalSeparator='.', thousandSeparator=','):
 * {{ 1234.56 | currencyFormat }}      -> "$1,234.56"
 * {{ 1000000 | currencyFormat }}      -> "$1,000,000.00"
 * {{ 123.456 | currencyFormat:3 }}    -> "$123.456"
 *
 * Examples (assuming company config: symbol='€', position='after', decimalSeparator=',', thousandSeparator='.'):
 * {{ 1234.56 | currencyFormat }}      -> "1.234,56 €"
 * {{ 1000000 | currencyFormat }}      -> "1.000.000,00 €"
 *
 * The pipe automatically uses the company's configured:
 * - Currency symbol (e.g., $, €, ₹, AED)
 * - Currency position (before or after the amount)
 * - Decimal separator (. or ,)
 * - Thousand separator (, or . or space)
 * - Decimal places (default from company config, can be overridden)
 */
@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {

  constructor(private companySettings: CompanySettingsManagerService) {}

  transform(value: number | string | null | undefined, decimalPlaces?: number): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return '';
    }

    return this.companySettings.formatCurrency(numValue, decimalPlaces);
  }
}
