import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControl, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'multi-select',
  standalone: true,
  imports: [
    NgSelectModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbTooltip
  ],
  templateUrl: './multiselect-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectComponent),
      multi: true
    }
  ],
  styles: [`
    :host ::ng-deep .ng-dropdown-panel .ng-dropdown-panel-items .ng-option.ng-option-selected {
      background-color: #ffffff !important; 
      color: #000000 !important;       
    }
    :host ::ng-deep .ng-dropdown-panel .ng-dropdown-panel-items .ng-option.ng-option-marked.ng-option-selected {
      background-color: #05608D !important; 
      color: #ffffff !important;       
    }
    :host ::ng-deep .ng-dropdown-panel .ng-dropdown-header {
      padding: 0;       
    }
  `]
})
export class MultiSelectComponent implements ControlValueAccessor {
  @Input() control: AbstractControl | null = null;
  @Input() items: any[] = [];
  @Input() bindLabel: string = 'name';
  @Input() bindValue: string = 'id';
  @Input() placeholder: string = 'Select items';
  @Input() searchable: boolean = true;
  @Input() displayCount: number = 2;

  @Output() searchChange = new EventEmitter<string>();
  @Output() valueChange = new EventEmitter<any[]>();

  filterValue: string;
  isClearFocused: boolean = false;
  filteredItems: any[] = [];
  public internalValue: any[] = [];
  public onChange: (value: any[]) => void = () => {};
  public onTouched: () => void = () => {};

  ngOnInit() {
    this.filteredItems = Array.isArray(this.items) ? [...this.items] : [];
    if (!this.control) {
      this.control = new FormControl([]);
    }
    this.updateInternalValue();
  }

  ngOnChanges() {
    this.filteredItems = Array.isArray(this.items) ? [...this.items] : [];
    this.updateInternalValue();
  }

  private updateInternalValue(): void {
    if (this.control) {
      this.internalValue = this.control.value || [];
    }
  }

  writeValue(value: any[]): void {
    if (this.control) {
      this.control.setValue(value || [], { emitEvent: false });
      this.updateInternalValue();
    }
  }

  registerOnChange(fn: (value: any[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onModelChange(value: any[]): void {
    if (this.control) {
      this.control.setValue(value);
      this.onChange(value);
    }
    this.valueChange.emit(value);
  }

  toggleSelectAll(): void {
    if (!this.control || !this.filteredItems) return;
    const currentValue = this.control.value || [];
    if (currentValue.length === this.filteredItems.length) {
      this.control.setValue([]);
    } else {
      this.control.setValue(this.filteredItems.map(item => item[this.bindValue]));
    }
    this.updateInternalValue();
    this.onChange(this.control.value);
    this.valueChange.emit(this.control.value);
    this.onTouched();
  }

  toggleItem(itemValue: any): void {
    if (!this.control) return;
    const currentValue = this.control.value || [];
    const newValue = currentValue.includes(itemValue)
      ? currentValue.filter((v: any) => v !== itemValue)
      : [...currentValue, itemValue];
    this.control.setValue(newValue);
    this.updateInternalValue();
    this.onChange(newValue);
    this.valueChange.emit(newValue);
    this.onTouched();
  }

  isSelected(itemValue: any): boolean {
    return this.control?.value?.includes(itemValue) || false;
  }

  removeItem(item: any, event: Event): void {
    if (!this.control) return;
    event.stopPropagation();
    const currentValue = this.control.value || [];
    const newValue = currentValue.filter((v: any) => v !== item[this.bindValue]);
    this.control.setValue(newValue);
    this.updateInternalValue();
    this.onChange(newValue);
    this.valueChange.emit(newValue);
    this.onTouched();
  }

  onSearchInput(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchChange.emit(searchTerm);
    if (this.searchable) {
      this.filteredItems = searchTerm
        ? this.items.filter(item =>
            item[this.bindLabel].toLowerCase().includes(searchTerm.toLowerCase()))
        : [...this.items];
    }
  }

  resetFilter() {
    this.filteredItems = [...this.items];
  }

  onOpen(): void {
    this.onTouched();
    if (this.control) {
      this.control.markAsTouched();
      this.control.markAsDirty();
    }
  }

  clearFilterValue() {
    this.filterValue = '';
    this.filteredItems = [...this.items];
  }
}

/*
USAGE : 
With FormControl : 
  <multi-select 
    [control]="anyForm.get('control')" 
    [items]="itemList" 
    bindLabel="name" 
    bindValue="id" 
    placeholder="Select item" 
    (valueChange)="handleChange()"
  >
  </multi-select>

With NgModel

<multi-select 
  [items]="modeOfCustomerType" 
  bindLabel="name" bindValue="name" 
  placeholder="Select Customer Type" 
  [(ngModel)]="selectedStatus" 
  (valueChange)="handleSelectedStatus($event)" 
  [ngModelOptions]="{standalone: true}"
  >
</multi-select>

*/