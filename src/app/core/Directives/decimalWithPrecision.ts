import { 
  Directive, 
  ElementRef, 
  HostListener, 
  Input, 
  OnInit, 
  AfterViewInit, 
  OnChanges, 
  OnDestroy, 
  SimpleChanges, 
  Optional,
  Renderer2
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';

/**
 * Industrial-grade directive for decimal precision formatting.
 * 
 * Features:
 * - Always keeps the host input formatted (except during active typing)
 * - Auto-inserts decimal point when integer limit is reached
 * - Preserves cursor position during typing
 * - Handles programmatic FormControl updates
 * - Prevents circular update loops
 * - Thread-safe with proper cleanup
 * 
 * @example
 * <input 
 *   type="text" 
 *   [formControl]="amount"
 *   DecimalPrecision
 *   [DecimalPrecisionBefore]="10"
 *   [DecimalPrecisionAfter]="2">
 */
@Directive({
  standalone: true,
  selector: '[DecimalPrecision]',
})
export class DecimalPrecisionDirective implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  
  @Input('DecimalPrecisionBefore') beforeDecimal: number = 10;
  @Input('DecimalPrecisionAfter') afterDecimal: number = 2;

  private regex!: RegExp;
  private isTyping: boolean = false;
  private destroy$ = new Subject<void>();
  private internalUpdate: boolean = false;
  private lastKnownValue: string = '';
  
  constructor(
    private el: ElementRef<HTMLInputElement>,
    private renderer: Renderer2,
    @Optional() private control?: NgControl
  ) {}

  ngOnInit(): void {
    this.buildRegex();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['afterDecimal'] || changes['beforeDecimal']) {
      this.buildRegex();
      if (!this.isTyping) {
        this.scheduleFormat();
      }
    }
  }

  ngAfterViewInit(): void {
    // Initial format on load
    this.scheduleFormat();

    // Subscribe to external FormControl changes
    if (this.control?.control) {
      this.control.control.valueChanges
        .pipe(
          takeUntil(this.destroy$),
          distinctUntilChanged(),
          debounceTime(0)
        )
        .subscribe((value) => {
          // Only react to external changes (not our own updates)
          if (!this.internalUpdate && !this.isTyping) {
            this.applyFormatting(value);
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('focus')
  onFocus(): void {
    this.isTyping = true;
    // Store the current formatted value when starting to type
    this.lastKnownValue = this.el.nativeElement.value;
  }

  @HostListener('blur')
  onBlur(): void {
    this.isTyping = false;
    // Format immediately on blur
    this.applyFormatting(this.el.nativeElement.value);
  }

  @HostListener('input', ['$event'])
  onInput(event: InputEvent): void {
    if (!this.isTyping) return;

    const input = this.el.nativeElement;
    const cursorPosition = input.selectionStart || 0;
    const value = input.value;

    // Sanitize: allow only digits and one decimal point
    const sanitized = this.sanitizeInput(value);

    // Validate and constrain
    const validated = this.validateAndConstrain(sanitized);

    // Check if we need to auto-insert decimal point
    const withAutoDecimal = this.autoInsertDecimalIfNeeded(validated, cursorPosition);

    // Update if changed
    if (value !== withAutoDecimal.value) {
      this.setInputValue(withAutoDecimal.value, withAutoDecimal.cursorPosition);
      this.updateFormControl(withAutoDecimal.value, false);
    }
  }

  /**
   * Auto-inserts decimal point when integer limit is reached.
   */
  private autoInsertDecimalIfNeeded(value: string, cursorPosition: number): { value: string, cursorPosition: number } {
    // Check if value has no decimal point
    if (!value.includes('.')) {
      const integerPart = value;
      
      // If integer part reaches the limit, auto-insert decimal
      if (integerPart.length === this.beforeDecimal) {
        return {
          value: integerPart + '.',
          cursorPosition: cursorPosition + 1
        };
      }
    }

    return { value, cursorPosition };
  }

  /**
   * Applies full formatting to the input value.
   * This is called when NOT typing (blur, external updates, init).
   */
  private applyFormatting(value: any): void {
    const formatted = this.formatValue(value);
    
    // Prevent unnecessary DOM updates
    if (this.el.nativeElement.value !== formatted) {
      this.setInputValue(formatted, formatted.length);
      this.updateFormControl(formatted, true);
    }
  }

  /**
   * Formats a value to the specified decimal precision.
   */
  private formatValue(value: any): string {
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') {
      return this.getDefaultValue();
    }

    // Convert to number
    const numValue = typeof value === 'number' ? value : parseFloat(value);

    // Handle NaN
    if (isNaN(numValue)) {
      return this.getDefaultValue();
    }

    // Format with fixed decimal places
    return numValue.toFixed(this.afterDecimal);
  }

  /**
   * Returns the default formatted value (0 with proper precision).
   */
  private getDefaultValue(): string {
    return (0).toFixed(this.afterDecimal);
  }

  /**
   * Sanitizes input by removing invalid characters.
   */
  private sanitizeInput(value: string): string {
    // Remove everything except digits and decimal point
    let sanitized = value.replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }

    return sanitized;
  }

  /**
   * Validates and constrains input based on precision rules.
   */
  private validateAndConstrain(value: string): string {
    if (value === '') return '';

    const parts = value.split('.');
    let integerPart = parts[0] || '';
    let decimalPart = parts[1];

    // Constrain integer part length
    if (integerPart.length > this.beforeDecimal) {
      integerPart = integerPart.slice(0, this.beforeDecimal);
    }

    // Build result
    let result = integerPart;

    // Handle decimal part
    if (parts.length > 1) {
      result += '.';
      if (decimalPart !== undefined) {
        // Constrain decimal part length
        decimalPart = decimalPart.slice(0, this.afterDecimal);
        result += decimalPart;
      }
    }

    return result;
  }

  /**
   * Sets the input value and cursor position.
   */
  private setInputValue(value: string, cursorPosition: number): void {
    const input = this.el.nativeElement;
    
    this.renderer.setProperty(input, 'value', value);
    
    // Set cursor position (safe bounds)
    const safePosition = Math.max(0, Math.min(cursorPosition, value.length));
    
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      if (document.activeElement === input) {
        input.setSelectionRange(safePosition, safePosition);
      }
    });
  }

  /**
   * Updates the FormControl value without triggering valueChanges.
   */
  private updateFormControl(value: string, parseAsNumber: boolean): void {
    if (!this.control?.control) return;

    this.internalUpdate = true;

    let controlValue: number | string | null;

    if (parseAsNumber) {
      // When formatting (blur/external), always store as number
      const numericValue = value === '' ? 0 : parseFloat(value);
      controlValue = isNaN(numericValue) ? 0 : numericValue;
    } else {
      // When typing, store string to preserve partial input like "12." or "12.0"
      controlValue = value === '' ? null : value;
    }

    const currentValue = this.control.control.value;

    // Only update if value actually changed
    if (currentValue !== controlValue) {
      this.control.control.setValue(controlValue, { 
        // emitEvent: parseAsNumber,
        emitEvent: false,
        emitModelToViewChange: false 
      });
    }

    // Reset flag after micro-task
    Promise.resolve().then(() => {
      this.internalUpdate = false;
    });
  }

  /**
   * Schedules formatting in the next tick.
   */
  private scheduleFormat(): void {
    setTimeout(() => {
      if (!this.isTyping) {
        this.applyFormatting(this.el.nativeElement.value);
      }
    }, 0);
  }

  /**
   * Builds the validation regex based on precision settings.
   */
  private buildRegex(): void {
    this.regex = new RegExp(
      `^\\d{0,${this.beforeDecimal}}(\\.\\d{0,${this.afterDecimal}})?$`
    );
  }
}