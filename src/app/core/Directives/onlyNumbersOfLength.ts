// import { Directive, HostListener, Input, ElementRef, Optional } from '@angular/core';
// import { NgControl } from '@angular/forms';

// @Directive({
//     standalone: true,
//     selector: '[onlyNumbers]'
// })
// export class OnlyNumbersDirective {
//     @Input() onlyNumbers: number | undefined; // Max length

//     constructor(private el: ElementRef, @Optional() private control: NgControl) { }

//     @HostListener('keydown', ['$event'])
//     onKeyDown(event: KeyboardEvent) {
//         const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete'];

//         if (allowedKeys.includes(event.key)) return;

//         const allowedChars = /^[0-9]$/;
//         const currentValue: string = this.el.nativeElement.value;
//         const maxLength = this.onlyNumbers ?? Infinity;

//         this.clearErrors();

//         // Block anything not digit, + or -
//         if (!allowedChars.test(event.key)) {
//             event.preventDefault();
//             this.setValidationError('onlyNumbers');
//             return;
//         }

//         // Optional: Only allow one '+' or '-' (at the start)
//         if ((event.key === '+' || event.key === '-') && currentValue.length > 0) {
//             event.preventDefault();
//             this.setValidationError('onlyNumbers');
//             return;
//         }

//         if (currentValue.length >= maxLength) {
//             event.preventDefault();
//             this.setValidationError('maxlength');
//             return;
//         }
//     }



//     @HostListener('input', ['$event'])
//     onInput(event: Event) {
//         this.validateAndCorrect();
//     }

//     @HostListener('blur')
//     onBlur() {
//         this.validateAndCorrect();
//     }

//     private validateAndCorrect() {
//         const maxLength = this.onlyNumbers ?? Infinity;
//         let value: string = this.el.nativeElement.value;

//         // Extract optional + or - at the start
//         const match = value.match(/^([+-]?)(\d*)/);
//         const sign = match ? match[1] : '';
//         let digits = match ? match[2] : '';

//         // Truncate if needed
//         if (digits.length > maxLength) {
//             this.setValidationError('maxlength');
//             digits = digits.substring(0, maxLength);
//         }

//         const cleanedValue = sign + digits;

//         if (cleanedValue !== value) {
//             this.setValidationError('onlyNumbers');
//         }

//         this.el.nativeElement.value = cleanedValue;

//         if (this.control?.control) {
//             this.control.control.setValue(cleanedValue, { emitEvent: false });
//             this.control.control.markAsTouched();
//             this.control.control.updateValueAndValidity();
//         }
//     }


//     private setValidationError(errorKey: string) {
//         if (this.control?.control) {
//             const errors = { ...(this.control.control.errors || {}) };
//             errors[errorKey] = true;
//             this.control.control.setErrors(errors);
//         }
//     }

//     private clearErrors() {
//         if (this.control?.control) {
//             const errors = { ...(this.control.control.errors || {}) };
//             delete errors['onlyNumbers'];
//             delete errors['maxlength'];
//             if (Object.keys(errors).length === 0) {
//                 this.control.control.setErrors(null);
//             } else {
//                 this.control.control.setErrors(errors);
//             }
//         }
//     }
// }



import { Directive, HostListener, Input, ElementRef, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    standalone: true,
    selector: '[onlyNumbers]'
})
export class OnlyNumbersDirective {
    @Input() onlyNumbers: number | undefined; // Max length

    constructor(private el: ElementRef, @Optional() private control: NgControl) { }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
         if (event.ctrlKey || event.metaKey) {
        return;
    }
        const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete'];

        if (allowedKeys.includes(event.key)) return;

        const currentValue: string = this.el.nativeElement.value;
        const maxLength = this.onlyNumbers ?? Infinity;

        this.clearErrors();

        console.log('Current value:', currentValue, 'Key pressed:', event.key); // Debug log

        // Check if we're trying to type "NA" first (before any other validation)
        if (this.isValidNAInput(currentValue, event.key)) {
            console.log('Allowing NA input'); // Debug log
            return; // Allow the input
        }

        // If current value is already "NA" (any case), don't allow more characters
        if (this.containsNA(currentValue)) {
            console.log('Already contains NA, blocking'); // Debug log
            event.preventDefault();
            this.setValidationError('onlyNumbers');
            return;
        }

        // Allow digits
        const allowedChars = /^[0-9]$/;
        
        // Allow + or - only at the start
        const isSignAtStart = (event.key === '+' || event.key === '-') && currentValue.length === 0;
        
        if (allowedChars.test(event.key) || isSignAtStart) {
            console.log('Allowing number/sign'); // Debug log
            // Check max length for numeric values
            if (currentValue.length >= maxLength) {
                event.preventDefault();
                this.setValidationError('maxlength');
                return;
            }
            return; // Allow the input
        }

        // Block everything else
        console.log('Blocking input:', event.key); // Debug log
        event.preventDefault();
        this.setValidationError('onlyNumbers');
    }

    @HostListener('input', ['$event'])
    onInput(event: Event) {
        this.validateAndCorrect();
    }

    @HostListener('blur')
    onBlur() {
        this.validateAndCorrect();
    }

    private isValidNAInput(currentValue: string, newKey: string): boolean {
        const currentLower = currentValue.toLowerCase();
        const keyLower = newKey.toLowerCase();
        
        console.log('isValidNAInput check - currentValue:', currentValue, 'newKey:', newKey, 'currentLower:', currentLower, 'keyLower:', keyLower);
        
        // Allow typing "n" if field is empty
        if (keyLower === 'n' && currentValue.length === 0) {
            console.log('Allowing N as first character');
            return true;
        }
        
        // Allow typing "a" if current value is exactly "n" (any case)
        if (keyLower === 'a' && currentLower === 'n' && currentValue.length === 1) {
            console.log('Allowing A as second character after N');
            return true;
        }
        
        console.log('Not valid NA input');
        return false;
    }

    private containsNA(value: string): boolean {
        return value.toLowerCase() === 'na';
    }

    private validateAndCorrect() {
        const maxLength = this.onlyNumbers ?? Infinity;
        let value: string = this.el.nativeElement.value;
        
        console.log('validateAndCorrect called with value:', value); // Debug log
        
        // Check if the value is "NA" (case insensitive)
        if (this.containsNA(value)) {
            console.log('Value is NA, keeping it'); // Debug log
            // Keep original case but ensure it's valid
            const cleanedValue = value.toLowerCase() === 'na' ? value : value.toUpperCase();
            this.el.nativeElement.value = cleanedValue;
            
            if (this.control?.control) {
                this.control.control.setValue(cleanedValue, { emitEvent: false });
                this.control.control.markAsTouched();
                this.control.control.updateValueAndValidity();
            }
            return;
        }

        // Check if it's partial NA (just "N" or "n")
        if (value.toLowerCase() === 'n') {
            console.log('Value is partial NA (N), keeping it'); // Debug log
            // Keep it as is - don't modify partial NA input
            if (this.control?.control) {
                this.control.control.setValue(value, { emitEvent: false });
                this.control.control.markAsTouched();
                this.control.control.updateValueAndValidity();
            }
            return;
        }

        // Extract optional + or - at the start (only for numeric values)
        const match = value.match(/^([+-]?)(\d*)/);
        const sign = match ? match[1] : '';
        let digits = match ? match[2] : '';

        // If we have non-numeric, non-NA content, it might be invalid
        if (!match || (sign === '' && digits === '' && value !== '')) {
            console.log('Invalid content detected:', value); // Debug log
            // Don't clear completely - there might be partial NA input
            if (value.toLowerCase() !== 'n') {
                this.setValidationError('onlyNumbers');
            }
            return;
        }

        // Truncate if needed
        if (digits.length > maxLength) {
            this.setValidationError('maxlength');
            digits = digits.substring(0, maxLength);
        }

        const cleanedValue = sign + digits;

        if (cleanedValue !== value && cleanedValue !== '') {
            console.log('Cleaning value from', value, 'to', cleanedValue); // Debug log
            this.setValidationError('onlyNumbers');
        }

        this.el.nativeElement.value = cleanedValue;

        if (this.control?.control) {
            this.control.control.setValue(cleanedValue, { emitEvent: false });
            this.control.control.markAsTouched();
            this.control.control.updateValueAndValidity();
        }
    }

    private setValidationError(errorKey: string) {
        if (this.control?.control) {
            const errors = { ...(this.control.control.errors || {}) };
            errors[errorKey] = true;
            this.control.control.setErrors(errors);
        }
    }

    private clearErrors() {
        if (this.control?.control) {
            const errors = { ...(this.control.control.errors || {}) };
            delete errors['onlyNumbers'];
            delete errors['maxlength'];
            if (Object.keys(errors).length === 0) {
                this.control.control.setErrors(null);
            } else {
                this.control.control.setErrors(errors);
            }
        }
    }
}