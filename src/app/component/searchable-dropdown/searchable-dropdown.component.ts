import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, forwardRef } from '@angular/core';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'dofi-searchable-dropdown',
  imports: [NgSelectModule, CommonModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './searchable-dropdown.component.html',
  styleUrls: ['./searchable-dropdown.component.scss'],
  host: {
    'class': 'searchable-dropdown-host',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableDropdown),
      multi: true,
    },
  ],
})
export class SearchableDropdown implements OnChanges, OnInit, ControlValueAccessor {
  @Input() items: any[] = [];
  @Input() placeholder: string = '';
  @Input() displayFields: string[] = [];
  @Input() displayLabels: string[] = [];
  @Input() bindLabel: string = '';
  @Input() labelFields: string[] = [];
  @Input() bindValue!: string;
  @Input() isLoading: boolean = false;
  @Input() control: FormControl | null = null;  

  @Output() itemSelected = new EventEmitter<any>();

  columnWidths: number[] = [];
  internalControl: FormControl = new FormControl(null);

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {}

  ngOnInit() {
   
    if (this.control) {
      this.internalControl = this.control;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['control'] && this.control) {
      this.internalControl = this.control;
    }

    if (changes['items'] || changes['displayFields'] || changes['displayLabels']) {
      this.calculateColumnWidths();
    }
  }

  writeValue(value: any): void {
    this.internalControl.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.internalControl.disable();
    } else {
      this.internalControl.enable();
    }
  }

  onSelectionChange(item: any) {
    const value = item ? item[this.bindValue] : null;
    this.onChange(value); 
    this.onTouched(); 
    this.itemSelected.emit(item); 
  }

  getLabel(item: any): string {
    if (!item || !this.labelFields?.length) {
      return this.bindLabel ? item[this.bindLabel] : '';
    }
    if (!this.internalControl.value || this.internalControl.value !== item) {
      return this.labelFields.map((field) => item[field]).join(' - ');
    }
    return this.displayFields.map((field) => item[field]).join(' - ');
  }

  getColumnStyle(index: number): any {
    const width = this.columnWidths[index] || 50;
    const finalWidth = index === 0 ? Math.max(width, 60) : width;
    return { width: `${finalWidth}px`, minWidth: `${finalWidth}px` };
  }

  calculateColumnWidths() {
    if (!this.items?.length || !this.displayFields?.length || !this.displayLabels?.length) {
      this.columnWidths = [];
      return;
    }

    this.columnWidths = new Array(this.displayFields.length).fill(0);

    this.items.forEach((item) => {
      this.displayFields.forEach((field, index) => {
        const value = item[field] ? item[field].toString() : '';
        const charLength = value.length;
        let estimatedWidth = charLength * 8;
        if (field.toLowerCase() === 'id') {
          estimatedWidth = Math.max(estimatedWidth, 60);
        }
        this.columnWidths[index] = Math.max(this.columnWidths[index], estimatedWidth);
      });
    });

    this.displayLabels.forEach((label, index) => {
      const charLength = label?.length || 0;
      const estimatedWidth = charLength * 8;
      this.columnWidths[index] = Math.max(this.columnWidths[index], estimatedWidth);
    });

    this.columnWidths = this.columnWidths.map((width) => width + 24);
  }

  searchFn = (term: string, item: any): boolean => {
    if (!term || !item) return true;

    const searchTerm = term.toLowerCase().trim();
    const fieldsToSearch = this.labelFields?.length ? this.labelFields : this.displayFields;

    return fieldsToSearch.some((field) => {
      const value = item[field] ? item[field].toString().toLowerCase().trim() : '';
      return value.includes(searchTerm);
    });
  };
}