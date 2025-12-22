import { Directive, HostListener, Input, ElementRef, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    standalone: true,
    selector: '[onlyText]'
})
export class OnlyTextDirective {
    @Input() onlyText: number | undefined; // Max length

    constructor(private el: ElementRef, @Optional() private control: NgControl) { }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete', ' '];

        // Allow navigation keys and space (space allowed inside)
        if (allowedKeys.includes(event.key)) return;

        // Block numeric characters (0-9)
        if (/^[0-9]$/.test(event.key)) {
            event.preventDefault();
            this.setValidationError('numberNotAllowed');
            return;
        }

        // Allow only letters (a-z, A-Z,.)
        if (!/^[a-zA-Z.]$/.test(event.key)) {
            event.preventDefault();
            return;
        }

        const currentValue: string = this.el.nativeElement.value;
        const maxLength = this.onlyText ?? Infinity;

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
        const maxLength = this.onlyText ?? Infinity;
        let value: string = this.el.nativeElement.value;

        // Remove any non-letters (including numbers and symbols), but allow space
        value = value.replace(/[^a-zA-Z.\s]/g, '');

        // Trim leading and trailing spaces
        value = value.trimStart();

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
            delete errors['numberNotAllowed'];
            if (Object.keys(errors).length === 0) {
                this.control.control.setErrors(null);
            } else {
                this.control.control.setErrors(errors);
            }
        }
    }
}
