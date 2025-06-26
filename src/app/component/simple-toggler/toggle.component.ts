import { Component, forwardRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'dofi-toggler',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TogglerComponent),
      multi: true
    }
  ],
  template: `
    <div class="toggler-container">
      <label class="toggler-label">
        <input
          type="checkbox"
          (change)="onChange($event)"
          (blur)="onTouched()"
          [checked]="value"
          [disabled]="disabled"
        />
        <span class="toggler-slider"></span>
      </label>
    </div>
  `,
  styles: [`
    .toggler-container {
      display: inline-flex;
      align-items: center;
    }
    .toggler-label {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 22px;
    }
    .toggler-label input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggler-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 22px;
    }
    .toggler-slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    input:checked + .toggler-slider {
      background-color: #2196F3;
    }
    input:checked + .toggler-slider:before {
      transform: translateX(18px);
    }
    input:disabled + .toggler-slider {
      background-color: #808080; /* Gray color for disabled state */
      opacity: 0.6;
      cursor: not-allowed;
    }
    input:disabled + .toggler-slider:before {
      background-color: #e0e0e0; /* Lighter gray for the knob */
    }
  `]
})
export class TogglerComponent implements ControlValueAccessor {
  @Input() controlName: string = '';
  @Input() disabled: boolean = false;
  @Input() set toggleValue(val: boolean) {
    if (val !== undefined && val !== null && val !== this.value) {
      this.value = val;
      this.onChangeFn(val);
      this.toggleChange.emit(val);
    }
  }
  @Output() toggleChange = new EventEmitter<boolean>();
  value: boolean = false;
  private onChangeFn: (value: boolean) => void = () => {};
  private onTouchedFn: () => void = () => {};

  writeValue(value: boolean): void {
    this.value = value !== undefined ? value : false;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  onChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.value = checked;
    this.onChangeFn(checked);
    this.toggleChange.emit(checked);
  }

  onTouched(): void {
    this.onTouchedFn();
  }
}