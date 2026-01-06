import { AbstractControl, FormArray, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator that checks for:
 * 1. Inconsistent exchange rates across the entire form (same currency must have same rate)
 * 2. Foreign currencies (non-company currency) cannot have exchange rate of 1
 * 3. Exchange rates cannot be zero
 * 
 * Usage in component:
 * this.receiptForm.setValidators(
 *   this.consistentExchangeRatesValidator(this.companyCurrencySid, this.companyCurrencyCode)
 * );
 */
export function consistentExchangeRatesValidator(
  companyCurrencySid?: number,
  companyCurrencyCode?: string
): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    // Map to store: CurrencyMasterSid -> Array of { rate, path, controlRef, currencyCode }
    const currencyRateMap = new Map<number, Array<{ 
      rate: number; 
      path: string;
      control: AbstractControl;
      currencyCode?: string;
      currencySid: number;
    }>>();

    /**
     * Recursively traverse the form structure to collect all currency/exchange rate pairs
     */
    function traverseControls(control: AbstractControl, path: string[] = []): void {
      // Handle FormGroup
      if (control instanceof FormGroup) {
        const currencySid = control.get('CurrencyMasterSid')?.value;
        const exchangeRate = control.get('ExchangeRate')?.value;
        const currencyCode = control.get('CurrencyCode')?.value;

        // If this FormGroup has both CurrencyMasterSid and ExchangeRate
        if (currencySid && exchangeRate !== null && exchangeRate !== undefined) {
          const rate = Number(exchangeRate);
          const pathString = path.join('.');

          if (!currencyRateMap.has(currencySid)) {
            currencyRateMap.set(currencySid, []);
          }

          currencyRateMap.get(currencySid)!.push({
            rate,
            path: pathString,
            control: control.get('ExchangeRate')!,
            currencyCode: currencyCode,
            currencySid: currencySid
          });
        }

        // Recurse into child controls
        Object.keys(control.controls).forEach(key => {
          const childControl = control.get(key);
          if (childControl) {
            traverseControls(childControl, [...path, key]);
          }
        });
      }
      
      // Handle FormArray
      else if (control instanceof FormArray) {
        control.controls.forEach((childControl, index) => {
          traverseControls(childControl, [...path, `[${index}]`]);
        });
      }
    }

    // Start traversal from root
    traverseControls(formGroup, ['root']);

    // Clear previous errors first
    currencyRateMap.forEach((rateEntries) => {
      rateEntries.forEach(entry => {
        const currentErrors = entry.control.errors;
        if (currentErrors) {
          const errorsToRemove = ['inconsistentRate', 'foreignCurrencyRateOne', 'exchangeRateZero'];
          errorsToRemove.forEach(errorKey => {
            if (currentErrors[errorKey]) {
              delete currentErrors[errorKey];
            }
          });
          entry.control.setErrors(
            Object.keys(currentErrors).length > 0 ? currentErrors : null
          );
        }
      });
    });

    // Track all validation errors
    const inconsistentRateConflicts: Array<{
      currencySid: number;
      rates: number[];
      paths: string[];
    }> = [];

    const foreignCurrencyRateOneErrors: Array<{
      currencySid: number;
      currencyCode?: string;
      paths: string[];
    }> = [];

    const exchangeRateZeroErrors: Array<{
      currencySid: number;
      currencyCode?: string;
      paths: string[];
    }> = [];

    // Process each currency
    currencyRateMap.forEach((rateEntries, currencySid) => {
      // Check if this is the company currency
      const isCompanyCurrency = 
        (companyCurrencySid && currencySid === companyCurrencySid) ||
        (companyCurrencyCode && rateEntries.some(e => e.currencyCode === companyCurrencyCode));

      // Check each entry for validation rules
      rateEntries.forEach(entry => {
        // Rule 1: Exchange rate cannot be zero
        if (entry.rate === 0) {
          entry.control.setErrors({
            ...entry.control.errors,
            exchangeRateZero: true
          });
          entry.control.markAsTouched();

          // Track for global error message
          if (!exchangeRateZeroErrors.some(e => e.currencySid === currencySid)) {
            exchangeRateZeroErrors.push({
              currencySid,
              currencyCode: entry.currencyCode,
              paths: rateEntries.map(e => e.path)
            });
          }
        }

        // Rule 2: Foreign currencies cannot have rate of 1
        if (!isCompanyCurrency && entry.rate === 1) {
          entry.control.setErrors({
            ...entry.control.errors,
            foreignCurrencyRateOne: true
          });
          entry.control.markAsTouched();

          // Track for global error message
          if (!foreignCurrencyRateOneErrors.some(e => e.currencySid === currencySid)) {
            foreignCurrencyRateOneErrors.push({
              currencySid,
              currencyCode: entry.currencyCode,
              paths: rateEntries.map(e => e.path)
            });
          }
        }
      });

      // Rule 3: Check for inconsistent rates (same currency, different rates)
      // Get unique rates (rounded to 6 decimal places for comparison)
      const uniqueRates = new Set(
        rateEntries.map(entry => Number(entry.rate.toFixed(6)))
      );

      // If more than one unique rate exists for this currency
      if (uniqueRates.size > 1) {
        inconsistentRateConflicts.push({
          currencySid,
          rates: Array.from(uniqueRates),
          paths: rateEntries.map(e => e.path)
        });

        // Mark each ExchangeRate control as invalid
        rateEntries.forEach(entry => {
          entry.control.setErrors({
            ...entry.control.errors,
            inconsistentRate: true
          });
          entry.control.markAsTouched();
        });
      }
    });

    // Build combined validation errors
    const validationErrors: any = {};

    if (inconsistentRateConflicts.length > 0) {
      validationErrors.inconsistentExchangeRates = {
        message: 'Same currency has different exchange rates in different rows',
        conflicts: inconsistentRateConflicts.map(c => ({
          currencyId: c.currencySid,
          conflictingRates: c.rates,
          locations: c.paths
        }))
      };
    }

    if (foreignCurrencyRateOneErrors.length > 0) {
      validationErrors.foreignCurrencyRateOne = {
        message: 'Foreign currencies cannot have an exchange rate of 1',
        conflicts: foreignCurrencyRateOneErrors.map(e => ({
          currencyId: e.currencySid,
          currencyCode: e.currencyCode,
          locations: e.paths
        }))
      };
    }

    if (exchangeRateZeroErrors.length > 0) {
      validationErrors.exchangeRateZero = {
        message: 'Exchange rate cannot be zero',
        conflicts: exchangeRateZeroErrors.map(e => ({
          currencyId: e.currencySid,
          currencyCode: e.currencyCode,
          locations: e.paths
        }))
      };
    }

    return Object.keys(validationErrors).length > 0 ? validationErrors : null;
  };
}

/**
 * Get user-friendly error message for display
 */
export function getExchangeRateErrorMessage(
  formGroup: FormGroup,
  currencyList: any[]
): string | null {
  const errors = formGroup.errors;
  
  if (!errors) {
    return null;
  }

  const messages: string[] = [];

  // Check for zero exchange rate errors
  if (errors['exchangeRateZero']) {
    const conflicts = errors['exchangeRateZero'].conflicts;
    if (conflicts && conflicts.length > 0) {
      conflicts.forEach((conflict: any) => {
        const currency = currencyList.find(c => c.CurrencyMasterSid === conflict.currencyId);
        const currencyName = conflict.currencyCode || currency?.currencyCode || `Currency ${conflict.currencyId}`;
        messages.push(`${currencyName}: Exchange rate cannot be zero`);
      });
    }
  }

  // Check for foreign currency rate = 1 errors
  if (errors['foreignCurrencyRateOne']) {
    const conflicts = errors['foreignCurrencyRateOne'].conflicts;
    if (conflicts && conflicts.length > 0) {
      conflicts.forEach((conflict: any) => {
        const currency = currencyList.find(c => c.CurrencyMasterSid === conflict.currencyId);
        const currencyName = conflict.currencyCode || currency?.currencyCode || `Currency ${conflict.currencyId}`;
        messages.push(`${currencyName}: Foreign currency cannot have exchange rate of 1`);
      });
    }
  }

  // Check for inconsistent exchange rate errors
  if (errors['inconsistentExchangeRates']) {
    const conflicts = errors['inconsistentExchangeRates'].conflicts;
    if (conflicts && conflicts.length > 0) {
      conflicts.forEach((conflict: any) => {
        const currency = currencyList.find(c => c.CurrencyMasterSid === conflict.currencyId);
        const currencyName = currency?.currencyCode || `Currency ${conflict.currencyId}`;
        const rates = conflict.conflictingRates.join(', ');
        messages.push(`${currencyName}: Found inconsistent rates ${rates}`);
      });
    }
  }
  
  return messages.length > 0 ? `Exchange rate validation errors:\n${messages.join('\n')}` : null;
}

/**
 * Check if a specific exchange rate control has any error
 */
export function hasExchangeRateError(control: AbstractControl): boolean {
  return !!(
    control?.errors?.['inconsistentRate'] ||
    control?.errors?.['foreignCurrencyRateOne'] ||
    control?.errors?.['exchangeRateZero']
  );
}

/**
 * Check if a specific exchange rate control has inconsistent rate error
 */
export function hasInconsistentRateError(control: AbstractControl): boolean {
  return !!(control?.errors?.['inconsistentRate']);
}

/**
 * Check if a specific exchange rate control has foreign currency rate = 1 error
 */
export function hasForeignCurrencyRateOneError(control: AbstractControl): boolean {
  return !!(control?.errors?.['foreignCurrencyRateOne']);
}

/**
 * Check if a specific exchange rate control has zero rate error
 */
export function hasExchangeRateZeroError(control: AbstractControl): boolean {
  return !!(control?.errors?.['exchangeRateZero']);
}

/**
 * Get specific error message for a control
 */
export function getControlErrorMessage(control: AbstractControl): string | null {
  if (!control?.errors) {
    return null;
  }

  if (control.errors['exchangeRateZero']) {
    return 'Exchange rate cannot be zero';
  }

  if (control.errors['foreignCurrencyRateOne']) {
    return 'Foreign currency cannot have exchange rate of 1';
  }

  if (control.errors['inconsistentRate']) {
    return 'Exchange rate conflicts with other rows using the same currency';
  }

  return null;
}

/**
 * Example usage in component:
 * 
 * // 1. Apply validator to form in initializeForm()
 * this.receiptForm.setValidators(
 *   consistentExchangeRatesValidator(
 *     this.companyCurrencySid,  // e.g., 1 for USD
 *     this.companyCurrencyCode  // e.g., 'USD'
 *   )
 * );
 * this.receiptForm.updateValueAndValidity();
 * 
 * // 2. Check for errors on submit
 * onSubmit() {
 *   if (this.receiptForm.invalid) {
 *     const errorMsg = getExchangeRateErrorMessage(
 *       this.receiptForm, 
 *       this.currencyList
 *     );
 *     if (errorMsg) {
 *       this.appSettingService.showError(errorMsg);
 *       return;
 *     }
 *   }
 *   // ... continue with submission
 * }
 * 
 * // 3. Display error in template (for each row)
 * <input 
 *   formControlName="ExchangeRate"
 *   [class.is-invalid]="hasExchangeRateError(detailItems.at(i).get('ExchangeRate'))"
 * />
 * <div *ngIf="detailItems.at(i).get('ExchangeRate')?.errors" 
 *      class="invalid-feedback">
 *   {{ getControlErrorMessage(detailItems.at(i).get('ExchangeRate')) }}
 * </div>
 * 
 * // 4. Display global error message
 * <div *ngIf="receiptForm.invalid && receiptForm.errors" class="alert alert-danger">
 *   <pre>{{ getExchangeRateErrorMessage(receiptForm, currencyList) }}</pre>
 * </div>
 * 
 * // 5. In component class, make helper functions available to template
 * hasExchangeRateError = hasExchangeRateError;
 * getControlErrorMessage = getControlErrorMessage;
 * getExchangeRateErrorMessage = getExchangeRateErrorMessage;
 */