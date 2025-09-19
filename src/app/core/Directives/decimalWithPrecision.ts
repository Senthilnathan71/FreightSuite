import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit
} from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    standalone: true,
    selector: '[DecimalPrecision]'
})
export class DecimalPrecisionDirective implements OnInit {
  @Input('DecimalPrecisionBefore') beforeDecimal = 10;
  @Input('DecimalPrecisionAfter') afterDecimal = 2;

  private regex!: RegExp;
  private numberRegex = /^-?\d*\.?\d*$/; // Regex to check if input is a valid number

  constructor(private el: ElementRef<HTMLInputElement>, private control: NgControl) {}

  ngOnInit(): void {
    this.regex = new RegExp(
      `^\\d{0,${this.beforeDecimal}}(\\.\\d{0,${this.afterDecimal}})?$`
    );
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    const inputChar = event.key;
    const currentValue: string = this.el.nativeElement.value;
    const selectionStart = this.el.nativeElement.selectionStart ?? currentValue.length;
    const selectionEnd = this.el.nativeElement.selectionEnd ?? currentValue.length;

    // Allow navigation keys, backspace, delete, etc.
    if (event.ctrlKey || event.metaKey || inputChar.length > 1) {
      return;
    }

    // Allow digits, minus sign (only at start), and dot.
    if (!/[\d.-]/.test(inputChar)) {
      event.preventDefault();
      this.setNumberError();
      return;
    }

    // If minus sign, only allow if caret at start and not already present
    if (inputChar === '-') {
      if (selectionStart !== 0 || currentValue.includes('-')) {
        event.preventDefault();
        this.setNumberError();
        return;
      }
    }

    // If dot, only allow one dot
    if (inputChar === '.' && currentValue.includes('.')) {
      event.preventDefault();
      this.setNumberError();
      return;
    }

    // Simulate new value and test precision
    const newValue =
      currentValue.substring(0, selectionStart) +
      inputChar +
      currentValue.substring(selectionEnd);

    // Remove leading '-' when testing integer part length
    const unsigned = newValue.replace('-', '');
    const [intPart = '', decPart = ''] = unsigned.split('.');

    if (intPart.length > this.beforeDecimal || decPart.length > this.afterDecimal) {
      event.preventDefault();
      this.setPrecisionError();
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && !this.numberRegex.test(value)) {
      // Allow temporary non-exact entries (like typed letters) but mark error
      this.setNumberError();
    } else if (value && !this.regex.test(this.normalizeForRegex(value))) {
      this.setPrecisionError();
    } else {
      this.clearError();
    }
  }

  @HostListener('blur')
  onBlur(): void {
    const rawValue: string = this.el.nativeElement.value;

    // Try to extract a numeric substring (first occurrence of -?digits(.digits)?)
    const extracted = this.extractNumberFromString(rawValue);

    if (extracted === null) {
      // No numeric value found -> set invalidNumber error and clear field (or keep as-is)
      this.setNumberError();
      return;
    }

    // Validate integer/decimal length against precision limits
    const unsigned = Math.abs(extracted).toString();
    const [intPart = '', decPart = ''] = unsigned.split('.');

    if (intPart.length > this.beforeDecimal || (decPart && decPart.length > this.afterDecimal)) {
      this.setPrecisionError();
      // but still format/truncate to desired decimals for saving
    } else {
      this.clearError();
    }

    // Format to fixed decimals (pads with zeros)
    const formatted = Number(extracted).toFixed(this.afterDecimal);

    // Update native input and Angular form control (without emitting extra events)
    this.el.nativeElement.value = formatted;
    this.control.control?.setValue(formatted, { emitEvent: false });
    this.control.control?.updateValueAndValidity({ onlySelf: false, emitEvent: false });
  }

  private extractNumberFromString(value: string): number | null {
    if (!value) return null;
    // Match first numeric sequence: optional -, digits, optional (.digits)
    const match = value.match(/-?\d+(\.\d+)?/);
    if (!match) return null;
    const parsed = parseFloat(match[0]);
    if (Number.isNaN(parsed)) return null;
    return parsed;
  }

  // normalize string for regex precision checking by removing non-digit (except dot)
  private normalizeForRegex(value: string): string {
    // Keep minus and dot and digits only for basic precision check
    const match = value.match(/-?[\d.]+/);
    return match ? match[0] : '';
  }

  private setNumberError(): void {
    const ctrl = this.control.control;
    if (!ctrl) return;
    const errors = { ...(ctrl.errors || {}), invalidNumber: { message: 'Please enter a valid number' } };
    ctrl.setErrors(errors);
  }

  private setPrecisionError(): void {
    const ctrl = this.control.control;
    if (!ctrl) return;
    const errors = {
      ...(ctrl.errors || {}),
      decimalPrecision: {
        message: `Must be max ${this.beforeDecimal} digits before and ${this.afterDecimal} digits after decimal`
      }
    };
    ctrl.setErrors(errors);
  }

  private clearError(): void {
    const ctrl = this.control.control;
    if (!ctrl) return;
    const errors = { ...(ctrl.errors || {}) };
    if (errors['invalidNumber']) delete errors['invalidNumber'];
    if (errors['decimalPrecision']) delete errors['decimalPrecision'];
    if (Object.keys(errors).length === 0) {
      ctrl.setErrors(null);
    } else {
      ctrl.setErrors(errors);
    }
  }
}
