import {Component, Input, Output, EventEmitter,forwardRef, OnInit, OnChanges, SimpleChanges} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
@Component({
  selector: 'dofi-multiselect-dropdown',
  standalone: true,
  imports: [NgSelectModule, CommonModule, ReactiveFormsModule],
  templateUrl: './multiselect-dropdown.component.html',
  styleUrl: './multiselect-dropdown.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiselectDropdownComponent),
      multi: true
    }
  ]
})
export class MultiselectDropdownComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() items: any[] = [];
  @Input() placeholder: string = 'Select options';
  @Input() displayFields: string[] = [];
  @Input() displayLabels: string[] = [];
  @Input() bindLabel: string = '';
  @Input() bindValue: string = '';
  @Input() isLoading: boolean = false;
  @Input() control: FormControl | null = null;

  @Output() itemSelected = new EventEmitter<any[]>();

  internalControl: FormControl = new FormControl([]);
  columnWidths: number[] = [];

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    if (this.control) {
      this.internalControl = this.control;
    }

    this.internalControl.valueChanges.subscribe(value => {
      this.onChange(value);
      this.onTouched();
      this.itemSelected.emit(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['control'] && this.control) {
      this.internalControl = this.control;
    }

    if (changes['items'] || changes['displayFields'] || changes['displayLabels']) {
      this.calculateColumnWidths();
    }
  }

  writeValue(value: any): void {
    this.internalControl.setValue(value || [], { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.internalControl.disable() : this.internalControl.enable();
  }

  onSelectionChange(selected: any[]): void {
    this.onChange(selected);
    this.onTouched();
    this.itemSelected.emit(selected);
  }

  getLabel(item: any): string {
    if (!item || !this.displayFields.length) return '';

    return this.displayFields.map(field => item[field]).join(' - ');
  }

  getColumnStyle(index: number): any {
    const width = this.columnWidths[index] || 50;
    const adjustedWidth = index === 0 ? Math.max(width, 60) : width;
    return { width: `${adjustedWidth}px`, minWidth: `${adjustedWidth}px` };
  }

  calculateColumnWidths(): void {
    if (!this.items?.length || !this.displayFields?.length || !this.displayLabels?.length) {
      this.columnWidths = [];
      return;
    }

    this.columnWidths = new Array(this.displayFields.length).fill(0);

    this.items.forEach(item => {
      this.displayFields.forEach((field, index) => {
        const value = item[field] ? item[field].toString() : '';
        const estimatedWidth = value.length * 8;
        this.columnWidths[index] = Math.max(this.columnWidths[index], estimatedWidth);
      });
    });

    this.displayLabels.forEach((label, index) => {
      const labelWidth = (label?.length || 0) * 8;
      this.columnWidths[index] = Math.max(this.columnWidths[index], labelWidth);
    });

    this.columnWidths = this.columnWidths.map(w => w + 24);
  }
}

