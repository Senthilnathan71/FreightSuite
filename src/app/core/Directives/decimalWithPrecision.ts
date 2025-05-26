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

    // Simulate the new value if this character is added
    const newValue =
      currentValue.substring(0, selectionStart) +
      inputChar +
      currentValue.substring(selectionEnd);

    if (!this.regex.test(newValue)) {
      event.preventDefault(); // Block invalid input
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!this.regex.test(value)) {
      this.control.control?.setErrors({
        decimalPrecision: {
          message: `Must be max ${this.beforeDecimal} digits before and ${this.afterDecimal} digits after decimal`
        }
      });
    } else {
      const errors = this.control.control?.errors;
      if (errors && errors['decimalPrecision']) {
        delete errors['decimalPrecision'];
        if (Object.keys(errors).length === 0) {
          this.control.control?.setErrors(null);
        } else {
          this.control.control?.setErrors(errors);
        }
      }
    }
  }
}
