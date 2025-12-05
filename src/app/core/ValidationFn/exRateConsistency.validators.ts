import { AbstractControl, FormArray, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator that checks for inconsistent exchange rates across the entire form
 * For the same CurrencyMasterSid, all ExchangeRate values must be identical
 * 
 * Usage in component:
 * this.receiptForm.setValidators(this.consistentExchangeRatesValidator());
 */
export function consistentExchangeRatesValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    // Map to store: CurrencyMasterSid -> Array of { rate, path, controlRef }
    const currencyRateMap = new Map<number, Array<{ 
      rate: number; 
      path: string;
      control: AbstractControl;
    }>>();

    /**
     * Recursively traverse the form structure to collect all currency/exchange rate pairs
     */
    function traverseControls(control: AbstractControl, path: string[] = []): void {
      // Handle FormGroup
      if (control instanceof FormGroup) {
        const currencySid = control.get('CurrencyMasterSid')?.value;
        const exchangeRate = control.get('ExchangeRate')?.value;

        // If this FormGroup has both CurrencyMasterSid and ExchangeRate
        if (currencySid && exchangeRate) {
          const rate = Number(exchangeRate);
          const pathString = path.join('.');

          if (!currencyRateMap.has(currencySid)) {
            currencyRateMap.set(currencySid, []);
          }

          currencyRateMap.get(currencySid)!.push({
            rate,
            path: pathString,
            control: control.get('ExchangeRate')!
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
        if (currentErrors && currentErrors['inconsistentRate']) {
          delete currentErrors['inconsistentRate'];
          entry.control.setErrors(
            Object.keys(currentErrors).length > 0 ? currentErrors : null
          );
        }
      });
    });

    // Check for inconsistencies
    const conflicts: Array<{
      currencySid: number;
      rates: number[];
      paths: string[];
    }> = [];

    currencyRateMap.forEach((rateEntries, currencySid) => {
      // Get unique rates (rounded to 6 decimal places for comparison)
      const uniqueRates = new Set(
        rateEntries.map(entry => Number(entry.rate.toFixed(6)))
      );

      // If more than one unique rate exists for this currency
      if (uniqueRates.size > 1) {
        conflicts.push({
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

    // Return validation error if conflicts exist
    if (conflicts.length > 0) {
      return {
        inconsistentExchangeRates: {
          message: 'Same currency has different exchange rates in different rows',
          conflicts: conflicts.map(c => ({
            currencyId: c.currencySid,
            conflictingRates: c.rates,
            locations: c.paths
          }))
        }
      };
    }

    return null;
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
  
  if (errors && errors['inconsistentExchangeRates']) {
    const conflicts = errors['inconsistentExchangeRates'].conflicts;
    
    if (conflicts && conflicts.length > 0) {
      const messages = conflicts.map((conflict: any) => {
        const currency = currencyList.find(c => c.CurrencyMasterSid === conflict.currencyId);
        const currencyName = currency?.currencyCode || `Currency ${conflict.currencyId}`;
        const rates = conflict.conflictingRates.join(', ');
        
        return `${currencyName}: Found rates ${rates}`;
      });
      
      return `Inconsistent exchange rates detected:\n${messages.join('\n')}`;
    }
  }
  
  return null;
}

/**
 * Check if a specific exchange rate control has inconsistent rate error
 */
export function hasInconsistentRateError(control: AbstractControl): boolean {
  return !!(control?.errors?.['inconsistentRate']);
}

/**
 * Example usage in component:
 * 
 * // 1. Apply validator to form in initializeForm()
 * this.receiptForm.setValidators(consistentExchangeRatesValidator());
 * this.receiptForm.updateValueAndValidity();
 * 
 * // 2. Check for errors on submit
 * onSubmit() {
 *   if (this.receiptForm.hasError('inconsistentExchangeRates')) {
 *     const errorMsg = getExchangeRateErrorMessage(
 *       this.receiptForm, 
 *       this.currencyList
 *     );
 *     this.appSettingService.showError(errorMsg);
 *     return;
 *   }
 *   // ... continue with submission
 * }
 * 
 * // 3. Display error in template (for each row)
 * <input 
 *   formControlName="ExchangeRate"
 *   [class.is-invalid]="detailItems.at(i).get('ExchangeRate')?.errors?.['inconsistentRate']"
 * />
 * <div *ngIf="detailItems.at(i).get('ExchangeRate')?.errors?.['inconsistentRate']" 
 *      class="invalid-feedback">
 *   Exchange rate conflicts with other rows using the same currency
 * </div>
 * 
 * // 4. Display global error message
 * <div *ngIf="receiptForm.hasError('inconsistentExchangeRates')" class="alert alert-danger">
 *   {{ getExchangeRateErrorMessage(receiptForm, currencyList) }}
 * </div>
 */