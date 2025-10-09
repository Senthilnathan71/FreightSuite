# Number and Currency Formatting Guide

This guide explains how to use the company-aware number and currency formatting system throughout the application.

## Overview

The application now supports **company-specific formatting** for numbers and currencies based on company configuration settings. All formatting is centralized and automatically applies the company's preferences for:

- Decimal separator (`.` or `,`)
- Thousand separator (`,`, `.`, or space)
- Number of decimal places
- Currency symbol and position

## Company Configuration

Company formatting settings are stored in the company configuration (`CompanyMaster.config` JSON field) and include:

```json
{
  "systemSettings": {
    "numberFormat": {
      "decimalSeparator": ",",
      "thousandSeparator": ".",
      "decimalPlaces": 2
    },
    "currency": {
      "code": "AED",
      "symbol": "AED",
      "position": "before",
      "decimalPlaces": 2
    }
  }
}
```

## Using the Pipes

### 1. NumberFormatPipe

Formats numbers according to company configuration.

#### Import in Component

```typescript
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [
    CommonModule,
    NumberFormatPipe  // Add this
  ],
  // ...
})
```

#### Usage in Templates

```html
<!-- Basic usage - uses company default decimal places -->
<td>{{ amount | numberFormat }}</td>

<!-- Custom decimal places -->
<td>{{ weight | numberFormat:3 }}</td>

<!-- Examples with different company configs -->

<!-- Config: decimalSeparator=',', thousandSeparator='.', decimalPlaces=2 -->
{{ 1234.56 | numberFormat }}      <!-- Output: 1.234,56 -->
{{ 1000000 | numberFormat }}      <!-- Output: 1.000.000,00 -->
{{ 123.456 | numberFormat:3 }}    <!-- Output: 123,456 -->

<!-- Config: decimalSeparator='.', thousandSeparator=',', decimalPlaces=2 -->
{{ 1234.56 | numberFormat }}      <!-- Output: 1,234.56 -->
{{ 1000000 | numberFormat }}      <!-- Output: 1,000,000.00 -->
```

### 2. CurrencyFormatPipe

Formats currency values with symbol and company-specific number formatting.

#### Import in Component

```typescript
import { CurrencyFormatPipe } from 'src/app/core/pipes/currency-format.pipe';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyFormatPipe  // Add this
  ],
  // ...
})
```

#### Usage in Templates

```html
<!-- Basic usage -->
<td>{{ totalAmount | currencyFormat }}</td>

<!-- Custom decimal places -->
<td>{{ price | currencyFormat:3 }}</td>

<!-- Examples with different company configs -->

<!-- Config: symbol='$', position='before', decimalSeparator='.', thousandSeparator=',' -->
{{ 1234.56 | currencyFormat }}      <!-- Output: $1,234.56 -->
{{ 1000000 | currencyFormat }}      <!-- Output: $1,000,000.00 -->

<!-- Config: symbol='€', position='after', decimalSeparator=',', thousandSeparator='.' -->
{{ 1234.56 | currencyFormat }}      <!-- Output: 1.234,56 € -->
{{ 1000000 | currencyFormat }}      <!-- Output: 1.000.000,00 € -->

<!-- Config: symbol='AED', position='before', decimalSeparator='.', thousandSeparator=',' -->
{{ 1234.56 | currencyFormat }}      <!-- Output: AED1,234.56 -->
```

### 3. Using CompanySettingsManagerService Directly

For programmatic formatting in TypeScript code.

#### Inject the Service

```typescript
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';

export class MyComponent {
  constructor(private companySettings: CompanySettingsManagerService) {}

  calculateTotal() {
    const total = 1234.56;

    // Format as number
    const formattedNumber = this.companySettings.formatNumber(total);
    console.log(formattedNumber); // "1,234.56" or "1.234,56" based on config

    // Format as currency
    const formattedCurrency = this.companySettings.formatCurrency(total);
    console.log(formattedCurrency); // "$1,234.56" or "1.234,56 €" based on config

    // Custom decimal places
    const formatted3Decimals = this.companySettings.formatNumber(total, 3);
    console.log(formatted3Decimals); // "1,234.560"
  }

  getCompanySettings() {
    // Get current number format settings
    const numberFormat = this.companySettings.getNumberFormat();
    console.log(numberFormat);
    // { decimalSeparator: ',', thousandSeparator: '.', decimalPlaces: 2 }

    // Get current currency settings
    const currencySettings = this.companySettings.getCurrencySettings();
    console.log(currencySettings);
    // { code: 'AED', symbol: 'AED', position: 'before', decimalPlaces: 2 }
  }

  subscribeToChanges() {
    // Subscribe to formatting changes (reactive)
    this.companySettings.numberFormat$.subscribe(format => {
      console.log('Number format changed:', format);
    });

    this.companySettings.currencySettings$.subscribe(settings => {
      console.log('Currency settings changed:', settings);
    });
  }
}
```

## Default Currency in New Invoices

The invoice entry component automatically sets the **default currency** from company configuration when creating new invoices:

- **Currency Code**: Automatically set to company's home currency (e.g., "AED", "USD", "INR")
- **Exchange Rate**: Automatically set to `1` (home currency rate)

This is implemented in `invoice-entry.component.ts`:

```typescript
// New invoice - set default currency from company config
const currencySettings = this.companySettings.getCurrencySettings();
this.invoiceForm.patchValue({
  CurrencyCode: currencySettings.code,
  ExchangeRate: 1 // Home currency always has exchange rate of 1
});
```

## Complete Example: Booking Entry Rates Table

Here's how to use both pipes in a complex component:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { CurrencyFormatPipe } from 'src/app/core/pipes/currency-format.pipe';

@Component({
  selector: 'app-rates-table',
  standalone: true,
  imports: [
    CommonModule,
    NumberFormatPipe,
    CurrencyFormatPipe
  ],
  template: `
    <table class="table">
      <thead>
        <tr>
          <th>Charge</th>
          <th>Rate</th>
          <th>Quantity</th>
          <th>Amount</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let rate of rates">
          <td>{{ rate.description }}</td>
          <td>{{ rate.perUnit | currencyFormat:3 }}</td>
          <td>{{ rate.quantity | numberFormat:2 }}</td>
          <td>{{ rate.amount | currencyFormat }}</td>
          <td>{{ rate.total | currencyFormat }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4"><strong>Grand Total:</strong></td>
          <td><strong>{{ grandTotal | currencyFormat }}</strong></td>
        </tr>
      </tfoot>
    </table>
  `
})
export class RatesTableComponent {
  rates = [
    { description: 'Freight', perUnit: 25.5, quantity: 100, amount: 2550, total: 2550 },
    { description: 'Handling', perUnit: 10.25, quantity: 50, amount: 512.5, total: 512.5 }
  ];

  get grandTotal() {
    return this.rates.reduce((sum, rate) => sum + rate.total, 0);
  }
}
```

## Configuration Management

### Setting Company Configuration

Company configuration is set at:
- **Path**: `/master/company/:id/config`
- **Stored in**: `BranchMaster.config` JSON field
- **Managed by**: `CompanyConfigService`

### Auto-Loading

The `CompanySettingsManagerService` automatically:
1. Loads company settings when user logs in
2. Caches settings in localStorage
3. Applies settings globally across the application
4. Updates all components reactively when settings change

## Migration Guide

### Replacing Angular's Built-in Number Pipe

**Before:**
```html
<td>{{ amount | number:'1.2-2' }}</td>
```

**After:**
```html
<td>{{ amount | numberFormat }}</td>
```

### Replacing Angular's Built-in Currency Pipe

**Before:**
```html
<td>{{ amount | currency:'USD':'symbol':'1.2-2' }}</td>
```

**After:**
```html
<td>{{ amount | currencyFormat }}</td>
```

## Benefits

1. **Consistency**: All numbers and currencies formatted the same way across the app
2. **Localization**: Automatically adapts to company's locale preferences
3. **Maintainability**: Single source of truth for formatting rules
4. **Flexibility**: Easy to change formatting by updating company configuration
5. **User-Friendly**: No need to remember locale codes or format strings

## Testing Different Configurations

You can test different company configurations at `/master/company/:id/config`:

**US Format:**
```json
{
  "numberFormat": {
    "decimalSeparator": ".",
    "thousandSeparator": ",",
    "decimalPlaces": 2
  },
  "currency": {
    "code": "USD",
    "symbol": "$",
    "position": "before"
  }
}
```

**European Format:**
```json
{
  "numberFormat": {
    "decimalSeparator": ",",
    "thousandSeparator": ".",
    "decimalPlaces": 2
  },
  "currency": {
    "code": "EUR",
    "symbol": "€",
    "position": "after"
  }
}
```

**UAE Format:**
```json
{
  "numberFormat": {
    "decimalSeparator": ".",
    "thousandSeparator": ",",
    "decimalPlaces": 2
  },
  "currency": {
    "code": "AED",
    "symbol": "AED",
    "position": "before"
  }
}
```

**Indian Format:**
```json
{
  "numberFormat": {
    "decimalSeparator": ".",
    "thousandSeparator": ",",
    "decimalPlaces": 2
  },
  "currency": {
    "code": "INR",
    "symbol": "₹",
    "position": "before"
  }
}
```

## Troubleshooting

### Pipe not working
- Ensure pipe is imported in component's `imports` array
- Check that component is `standalone: true`

### Wrong format displayed
- Check company configuration at `/master/company/:id/config`
- Verify settings are saved correctly
- Clear localStorage and re-login to reload settings

### Values not updating
- The pipes are pure by default and cache results
- If currency settings change, the service will emit new values via observables
- Subscribe to `companySettings.currencySettings$` for reactive updates
