import { Pipe, PipeTransform } from '@angular/core';
import { CompanySettingsManagerService } from '../services/company-settings-manager.service';

/**
 * Number Format Pipe
 *
 * Formats numbers according to company configuration settings (decimal separator, thousand separator, decimal places)
 *
 * Usage:
 * {{ 1234.56 | numberFormat }}                    // Uses company default decimal places
 * {{ 1234.5678 | numberFormat:3 }}                // Override decimal places to 3
 * {{ amount | numberFormat }}                      // Format any number variable
 *
 * Examples (assuming company config: decimalSeparator=',', thousandSeparator='.', decimalPlaces=2):
 * {{ 1234.56 | numberFormat }}      -> "1.234,56"
 * {{ 1000000 | numberFormat }}      -> "1.000.000,00"
 * {{ 123.456 | numberFormat:3 }}    -> "123,456"
 *
 * The pipe automatically uses the company's configured:
 * - Decimal separator (. or ,)
 * - Thousand separator (, or . or space)
 * - Decimal places (default from company config, can be overridden)
 */
@Pipe({
  name: 'numberFormat',
  standalone: true
})
export class NumberFormatPipe implements PipeTransform {

  constructor(private companySettings: CompanySettingsManagerService) {}

  transform(value: number | string | null | undefined, decimalPlaces?: number): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return '';
    }

    return this.companySettings.formatNumber(numValue, decimalPlaces);
  }
}
