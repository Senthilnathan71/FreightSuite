// barcode.service.ts
import { Injectable } from '@angular/core';

export interface BarcodeConfig {
  format?: string;      // CODE128, CODE39, EAN13, etc. (default: CODE128)
  height?: number;      // Barcode height in pixels (default: 40)
  width?: number;       // Barcode width multiplier (default: 1.5)
  fontSize?: number;    // Font size for display value (default: 14)
  displayValue?: boolean; // Show/hide text below barcode (default: true)
}

@Injectable({
  providedIn: 'root'
})
export class BarcodeService {

  /**
   * Convert string to barcode value
   * @param input - The string to convert to barcode
   * @param config - Optional barcode configuration
   * @returns Barcode value string
   */
  convertToBarcode(input: string, config?: BarcodeConfig): string {
    if (!input || input.trim().length === 0) {
      throw new Error('Input string cannot be empty');
    }

    // Clean and format the input
    let barcodeValue = input.trim().toUpperCase();

    // Remove special characters based on format
    const format = config?.format || 'CODE128';

    switch (format) {
      case 'CODE128':
        // CODE128 supports alphanumeric and special characters
        barcodeValue = barcodeValue.replace(/[^\x20-\x7E]/g, '');
        break;

      case 'CODE39':
        // CODE39 supports: 0-9, A-Z, space, and special chars (- . $ / + % *)
        barcodeValue = barcodeValue.replace(/[^0-9A-Z\-\.\$\/\+\%\*\s]/g, '');
        break;

      case 'EAN13':
      case 'EAN8':
        // EAN only supports digits
        barcodeValue = barcodeValue.replace(/\D/g, '');
        // Pad with zeros if needed
        const targetLength = format === 'EAN13' ? 13 : 8;
        barcodeValue = barcodeValue.padStart(targetLength, '0').substring(0, targetLength);
        break;

      case 'UPC':
        // UPC only supports 12 digits
        barcodeValue = barcodeValue.replace(/\D/g, '');
        barcodeValue = barcodeValue.padStart(12, '0').substring(0, 12);
        break;

      default:
        // Default: keep alphanumeric only
        barcodeValue = barcodeValue.replace(/[^A-Z0-9]/g, '');
    }

    if (barcodeValue.length === 0) {
      throw new Error('Invalid input for the specified barcode format');
    }

    return barcodeValue;
  }

  /**
   * Batch convert multiple strings to barcodes
   * @param inputs - Array of strings to convert
   * @param config - Optional barcode configuration
   * @returns Array of barcode values
   */
  convertMultipleToBarcodes(inputs: string[], config?: BarcodeConfig): string[] {
    return inputs.map(input => {
      try {
        return this.convertToBarcode(input, config);
      } catch (error) {
        console.error(`Error converting "${input}":`, error);
        return '';
      }
    }).filter(value => value.length > 0);
  }

  /**
   * Validate if a string can be converted to a specific barcode format
   * @param input - String to validate
   * @param format - Barcode format (default: CODE128)
   * @returns True if valid, false otherwise
   */
  validateForBarcode(input: string, format: string = 'CODE128'): boolean {
    try {
      const result = this.convertToBarcode(input, { format });
      return result.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get default barcode configuration
   * @returns Default BarcodeConfig object
   */
  getDefaultConfig(): BarcodeConfig {
    return {
      format: 'CODE128',
      height: 40,
      width: 1.5,
      fontSize: 14,
      displayValue: true
    };
  }

  /**
   * Create custom configuration
   * @param options - Partial configuration options
   * @returns Complete BarcodeConfig object
   */
  createConfig(options: Partial<BarcodeConfig>): BarcodeConfig {
    return {
      ...this.getDefaultConfig(),
      ...options
    };
  }
}


// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Basic usage
constructor(private barcodeService: BarcodeService) {}

ngOnInit() {
  const barcode = this.barcodeService.convertToBarcode('ABC123');
  console.log(barcode); // Output: "ABC123"
}

// Example 2: With specific format
const eanBarcode = this.barcodeService.convertToBarcode('1234567890123', { format: 'EAN13' });
console.log(eanBarcode); // Output: "1234567890123"

// Example 3: Convert multiple strings
const barcodes = this.barcodeService.convertMultipleToBarcodes([
  'ITEM001',
  'ITEM002',
  'ITEM003'
]);
console.log(barcodes); // Output: ["ITEM001", "ITEM002", "ITEM003"]

// Example 4: Validate before converting
const isValid = this.barcodeService.validateForBarcode('ABC123', 'CODE39');
if (isValid) {
  const barcode = this.barcodeService.convertToBarcode('ABC123', { format: 'CODE39' });
}

// Example 5: Use in component with ngx-barcode
export class MyComponent {
  barcodeValue: string = '';
  barcodeConfig: BarcodeConfig;

  constructor(private barcodeService: BarcodeService) {
    this.barcodeConfig = this.barcodeService.createConfig({
      height: 60,
      width: 2,
      fontSize: 16
    });
  }

  generateBarcode(input: string) {
    try {
      this.barcodeValue = this.barcodeService.convertToBarcode(input, this.barcodeConfig);
    } catch (error) {
      console.error('Invalid input:', error);
    }
  }
}

// In template:
<input [(ngModel)]="inputValue" placeholder="Enter text">
<button (click)="generateBarcode(inputValue)">Generate</button>

<ngx-barcode6
  *ngIf="barcodeValue"
  [bc-value]="barcodeValue"
  [bc-format]="barcodeConfig.format"
  [bc-height]="barcodeConfig.height"
  [bc-width]="barcodeConfig.width"
  [bc-font-size]="barcodeConfig.fontSize"
  [bc-display-value]="barcodeConfig.displayValue">
</ngx-barcode6>
*/