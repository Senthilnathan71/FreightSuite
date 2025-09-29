import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  standalone: true,
  selector: '[DecimalPrecision]',
})
export class DecimalPrecisionDirective implements OnInit {
  @Input('DecimalPrecisionBefore') beforeDecimal = 10;
  @Input('DecimalPrecisionAfter') afterDecimal = 2;

  private regex!: RegExp;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    private control: NgControl
  ) {}

  ngOnInit(): void {
    // This regex is the single source of truth for validating the number's structure.
    this.regex = new RegExp(
      `^\\d{0,${this.beforeDecimal}}(\\.\\d{0,${this.afterDecimal}})?$`
    );
  }

  /**
   * On blur, format the input value to the specified number of decimal places.
   * This provides the final, clean formatting after the user has finished editing.
   * Example: '123' becomes '123.00' or '45.6' becomes '45.60'.
   */
  @HostListener('blur')
  onBlur(): void {
    const currentValue = this.el.nativeElement.value;

    // Only format if there is a value
    if (currentValue) {
      const numValue = parseFloat(currentValue);
      if (!isNaN(numValue)) {
        const formattedValue = numValue.toFixed(this.afterDecimal);
        this.updateValue(formattedValue);
      } else {
        // Clear out invalid values like a single '.'
        this.updateValue('');
      }
    }
  }

  /**
   * The keypress event is used to proactively guide and restrict user input.
   * It prevents invalid characters from ever being entered.
   */
  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    const { key } = event;
    const { value, selectionStart, selectionEnd } = this.el.nativeElement;

    if (this.isControlKey(event)) {
      return; // Allow backspace, arrows, etc.
    }

    // This is the core logic for automatically inserting a decimal point.
    // If the integer part is full and the user types another digit,
    // we insert a '.' before that digit.
    const integerPart = value.split('.')[0];
    if (
      integerPart.length >= this.beforeDecimal &&
      !value.includes('.') &&
      /\d/.test(key) &&
      selectionStart === value.length // Important: only trigger when typing at the end
    ) {
      event.preventDefault();
      const newValue = `${value}.${key}`;
      if (this.regex.test(newValue)) {
        this.updateValue(newValue);
      }
      return;
    }

    // Predict the next value and test it against the regex.
    // If the new value would be invalid, prevent the keypress.
    const nextValue = `${value.slice(
      0,
      selectionStart ?? 0
    )}${key}${value.slice(selectionEnd ?? 0)}`;

    if (nextValue && !this.regex.test(nextValue)) {
      event.preventDefault();
    }
  }

  /**
   * The input event handler is a fallback to catch changes that bypass keypress,
   * such as pasting text. It sanitizes the entire value.
   */
  @HostListener('input')
  onInput(): void {
    const { value } = this.el.nativeElement;

    // If the value somehow becomes invalid (e.g., from a paste),
    // we truncate it to a valid format.
    if (value && !this.regex.test(value)) {
      const [integerPart, decimalPart] = value.replace(/[^\d.]/g, '').split('.');
      
      let newValue = integerPart.slice(0, this.beforeDecimal);
      
      if (decimalPart !== undefined) {
        // Also truncate the decimal part
        newValue += '.' + decimalPart.slice(0, this.afterDecimal);
      }

      this.updateValue(newValue);
    }
  }

  /**
   * Helper function to check for allowed non-character keys.
   */
  private isControlKey(event: KeyboardEvent): boolean {
    const controlKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
      'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Enter'
    ];
    return controlKeys.includes(event.key) || event.ctrlKey || event.metaKey;
  }

  /**
   * Centralized method to update the input's value and the associated form control.
   */
  private updateValue(value: string): void {
    this.el.nativeElement.value = value;
    if (this.control?.control) {
      this.control.control.setValue(value, { emitEvent: false });
    }
  }
}
