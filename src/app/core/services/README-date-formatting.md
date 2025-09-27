# Global Date Format System

This document explains how to use the global date format system that automatically applies the company's selected date format throughout the application.

## Overview

The global date format system consists of:
- `GlobalDateFormatService`: Central service that manages the current date format
- `CompanySettingsManagerService`: Manages company-specific settings including date format
- `CustomDatePipe`: Updated pipe that uses global date format
- `GlobalDateFormatDirective`: Directive for automatic date formatting in templates

## Quick Start

### 1. Using the Updated Date Pipe (Recommended)

The existing `formatDate` pipe has been updated to automatically use the global date format:

```html
<!-- Automatically uses the company's configured date format -->
<div>{{ someDate | formatDate }}</div>

<!-- Override with a custom format if needed -->
<div>{{ someDate | formatDate: 'DD-MM-YYYY' }}</div>
```

### 2. Using the Directive

For more dynamic scenarios where the date might change:

```html
<!-- Automatically updates when global format changes -->
<span [appGlobalDateFormat]="someDate"></span>

<!-- With custom format override -->
<span [appGlobalDateFormat]="someDate" customFormat="MM/DD/YYYY"></span>
```

### 3. Using the Service Directly

In TypeScript code:

```typescript
import { GlobalDateFormatService } from './core/services/global-date-format.service';

constructor(private globalDateService: GlobalDateFormatService) {}

formatMyDate(date: Date): string {
  return this.globalDateService.formatDate(date);
}

// Listen for format changes
ngOnInit() {
  this.globalDateService.dateFormat$.subscribe(format => {
    console.log('Date format changed to:', format);
    // React to format changes if needed
  });
}
```

## Company Settings Integration

### Setting Company Date Format

When a user selects a company or changes company settings:

```typescript
import { CompanySettingsManagerService } from './core/services/company-settings-manager.service';

constructor(private companySettings: CompanySettingsManagerService) {}

selectCompany(companyId: number) {
  // This automatically loads and applies the company's date format
  this.companySettings.setCurrentCompany(companyId);
}

updateDateFormat(newFormat: string) {
  // Updates the global format immediately
  this.companySettings.updateDateFormat(newFormat);
}
```

### Available Date Formats

The system supports these date formats:
- `DD/MM/YYYY` → 31/12/2024
- `MM/DD/YYYY` → 12/31/2024
- `YYYY-MM-DD` → 2024-12-31
- `DD-MM-YYYY` → 31-12-2024
- `MM-DD-YYYY` → 12-31-2024
- `DD.MM.YYYY` → 31.12.2024
- `MM.DD.YYYY` → 12.31.2024
- `DD MMM YYYY` → 31 Dec 2024
- `DD-MMM-YYYY` → 31-Dec-2024
- `MMM DD, YYYY` → Dec 31, 2024
- `MMMM DD, YYYY` → December 31, 2024

## Migration Guide

### Updating Existing Components

1. **Replace Angular's DatePipe with formatDate pipe:**
   ```html
   <!-- Old -->
   <div>{{ someDate | date: 'dd/MM/yyyy' }}</div>

   <!-- New -->
   <div>{{ someDate | formatDate }}</div>
   ```

2. **Import the formatDate pipe in standalone components:**
   ```typescript
   import { CustomDatePipe } from './core/pipes/custom-date-format.pipe';

   @Component({
     imports: [CustomDatePipe]
   })
   ```

3. **For module-based components, ensure the pipe is available.**

### Handling Date Format Changes

Components that need to react to date format changes can subscribe to the service:

```typescript
export class MyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private globalDateService: GlobalDateFormatService) {}

  ngOnInit() {
    this.globalDateService.dateFormat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(format => {
        // Refresh data displays or update calculations
        this.refreshDateDisplays();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Configuration

### Initialization

The system is automatically initialized on app startup through `APP_INITIALIZER`. It:
1. Checks localStorage for the selected company ID
2. Loads the company's configuration
3. Applies the date format globally

### Storage

- Current company ID is stored in localStorage
- Date format preferences are cached for performance
- Settings persist across browser sessions

## Best Practices

1. **Always use the formatDate pipe** for date displays instead of Angular's built-in date pipe
2. **Let the system handle format changes automatically** - avoid hardcoding date formats
3. **Use the directive for dynamic content** where dates might change frequently
4. **Subscribe to format changes** only when you need to perform additional actions
5. **Test with different date formats** to ensure your UI works with all supported formats

## Troubleshooting

### Common Issues

1. **Dates not updating when format changes:**
   - Ensure you're using `formatDate` pipe, not Angular's `date` pipe
   - Check that the component imports `CustomDatePipe`

2. **Format not persisting:**
   - Verify localStorage is enabled
   - Check company configuration is being saved properly

3. **Default format being used:**
   - Confirm company ID is being set correctly
   - Check network requests for configuration loading

### Debug Mode

To see current date format in console:

```typescript
constructor(private globalDateService: GlobalDateFormatService) {
  console.log('Current date format:', globalDateService.getCurrentDateFormat());
}
```