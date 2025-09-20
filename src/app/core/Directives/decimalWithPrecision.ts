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

  constructor(private el: ElementRef, private control: NgControl) {}

  ngOnInit(): void {
    this.regex = new RegExp(
      `^\\d{0,${this.beforeDecimal}}(\\.\\d{0,${this.afterDecimal}})?$`
    );
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    const inputChar = event.key;
    const currentValue: string = this.el.nativeElement.value;
    const selectionStart = this.el.nativeElement.selectionStart;
    const selectionEnd = this.el.nativeElement.selectionEnd;

    // First check if the input is a valid number character
    if (!this.numberRegex.test(inputChar) && inputChar !== '.') {
      event.preventDefault();
      this.setNumberError();
      return;
    }

    // Simulate the new value if this character is added
    const newValue =
      currentValue.substring(0, selectionStart) +
      inputChar +
      currentValue.substring(selectionEnd);

    if (!this.regex.test(newValue)) {
      event.preventDefault();
      this.setPrecisionError();
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && !this.numberRegex.test(value)) {
      this.setNumberError();
    } else if (value && !this.regex.test(value)) {
      this.setPrecisionError();
    } else {
      this.clearError();
    }
  }

  @HostListener('blur')
  onBlur(): void {
    const value = this.el.nativeElement.value;
    if (value && !this.numberRegex.test(value)) {
      this.setNumberError();
    } else if (value && !this.regex.test(value)) {
      this.setPrecisionError();
    } else {
      this.clearError();
    }
  }

  private setNumberError(): void {
    this.control.control?.setErrors({
      invalidNumber: {
        message: 'Please enter a valid number'
      },
      ...this.control.control.errors
    });
  }

  private setPrecisionError(): void {
    this.control.control?.setErrors({
      decimalPrecision: {
        message: `Must be max ${this.beforeDecimal} digits before and ${this.afterDecimal} digits after decimal`
      },
      ...this.control.control.errors
    });
  }

  private clearError(): void {
    const errors = this.control.control?.errors;
    if (errors) {
      if (errors['invalidNumber']) {
        delete errors['invalidNumber'];
      }
      if (errors['decimalPrecision']) {
        delete errors['decimalPrecision'];
      }
      if (Object.keys(errors).length === 0) {
        this.control.control?.setErrors(null);
      } else {
        this.control.control?.setErrors(errors);
      }
    }
  }
}