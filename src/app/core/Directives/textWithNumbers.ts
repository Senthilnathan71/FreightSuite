import { Directive, HostListener, Input, ElementRef, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    standalone: true,
    selector: '[textWithNumbers]'
})
export class TextWithNumbersDirective {
    @Input() textWithNumbers: number | undefined; // Max length

    constructor(private el: ElementRef, @Optional() private control: NgControl) { }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete'];

        // Allow navigation keys
        if (allowedKeys.includes(event.key)) return;
        if (event.key ==='' || event.key === ' ' || event.key === '') return;
        // Allow only letters (A-Z, a-z) and numbers (0-9) - no special characters
        const regex = /^[a-zA-Z0-9]$/;

        if (!regex.test(event.key)) {
            event.preventDefault();
            this.setValidationError('invalidChar');
            return;
        }

        // Check max length
        const currentValue: string = this.el.nativeElement.value;
        const maxLength = this.textWithNumbers ?? Infinity;

        this.clearErrors();

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
        const maxLength = this.textWithNumbers ?? Infinity;
        let value: string = this.el.nativeElement.value;

        // Remove special characters but keep letters, numbers, spaces, commas, and periods
        value = value.replace(/[^a-zA-Z0-9 ,.]/g, '');

        // Enforce max length
        if (value.length > maxLength) {
            this.setValidationError('maxlength');
            value = value.substring(0, maxLength);
        }

        this.el.nativeElement.value = value;

        if (this.control?.control) {
            this.control.control.setValue(value, { emitEvent: false });
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
            delete errors['maxlength'];
            delete errors['invalidChar'];
            if (Object.keys(errors).length === 0) {
                this.control.control.setErrors(null);
            } else {
                this.control.control.setErrors(errors);
            }
        }
    }
}