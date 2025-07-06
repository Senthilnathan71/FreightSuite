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
        const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete'];

        if (allowedKeys.includes(event.key)) return;

        const allowedChars = /^[0-9]$/;
        const currentValue: string = this.el.nativeElement.value;
        const maxLength = this.onlyNumbers ?? Infinity;

        this.clearErrors();

        // Block anything not digit, + or -
        if (!allowedChars.test(event.key)) {
            event.preventDefault();
            this.setValidationError('onlyNumbers');
            return;
        }

        // Optional: Only allow one '+' or '-' (at the start)
        if ((event.key === '+' || event.key === '-') && currentValue.length > 0) {
            event.preventDefault();
            this.setValidationError('onlyNumbers');
            return;
        }

        if (currentValue.length >= maxLength) {
            event.preventDefault();
            this.setValidationError('maxlength');
            return;
        }
    }



    @HostListener('input', ['$event'])
    onInput(event: Event) {
        this.validateAndCorrect();
    }

    @HostListener('blur')
    onBlur() {
        this.validateAndCorrect();
    }

    private validateAndCorrect() {
        const maxLength = this.onlyNumbers ?? Infinity;
        let value: string = this.el.nativeElement.value;

        // Extract optional + or - at the start
        const match = value.match(/^([+-]?)(\d*)/);
        const sign = match ? match[1] : '';
        let digits = match ? match[2] : '';

        // Truncate if needed
        if (digits.length > maxLength) {
            this.setValidationError('maxlength');
            digits = digits.substring(0, maxLength);
        }

        const cleanedValue = sign + digits;

        if (cleanedValue !== value) {
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
