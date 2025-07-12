import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

export class PasswordValidators {
  static validate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const errors: ValidationErrors = {};

      // Minimum 8 characters
      if (value.length < 4) {
        errors['minLength'] = { 
          requiredLength: 4,
          actualLength: value.length
        };
      }

      // At least one letter (uppercase or lowercase)
      if (!/[a-zA-Z]/.test(value)) {
        errors['missingLetter'] = true;
      }
    //   // At least one letter (uppercase)
    //   if (!/[a-zA-Z]/.test(value)) {
    //     errors['missingUpperCase'] = true;
    //   }
    //   // At least one letter (lowercase)
    //   if (!/[a-zA-Z]/.test(value)) {
    //     errors['missingLowerCase'] = true;
    //   }



      // At least one number
      if (!/[0-9]/.test(value)) {
        errors['missingNumber'] = true;
      }

      // At least one special character from !@#$%^&*
      if (!/[!@#$%^&*]/.test(value)) {
        errors['missingSpecialChar'] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }
}