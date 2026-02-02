import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function greaterThanZero(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = Number(control.value);
    if (isNaN(value) || value <= 0) {
      return { greaterThanZero: true };
    }
    return null;
  };
}
