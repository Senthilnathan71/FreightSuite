import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControl, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subscription } from 'rxjs';

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
export class MultiSelectComponent implements ControlValueAccessor, OnInit, OnChanges, OnDestroy {
  // Defaults to an internal control so it is always present. When a consumer binds [control],
  // Angular overwrites this before ngOnInit (non-CVA path). When used via formControlName/ngModel
  // no [control] is bound, so this internal control persists and the CVA methods bridge to the parent.
  // Type stays nullable so `[control]="form.get('x')"` (AbstractControl | null) still type-checks;
  // ngOnInit re-asserts the non-null invariant.
  @Input() control: AbstractControl | null = new FormControl<any[]>([]);
  @Input() items: any[] = [];
  @Input() bindLabel: string = 'name';
  @Input() bindValue: string = 'id';
  @Input() placeholder: string = 'Select items';
  @Input() searchable: boolean = true;
  @Input() displayCount: number = 2;
  // Optional secondary field rendered per option as a muted, truncated column (e.g. department),
  // mirroring dofi-searchable-dropdown. Backward-compatible: undefined ⇒ nothing extra is rendered.
  @Input() secondaryField?: string;
  @Input() secondaryMaxWidth: string = '110px';
  /** Values that cannot be un-ticked/removed (mandatory). Default [] keeps all other consumers unchanged. */
  @Input() lockedValues: any[] = [];

  @Output() searchChange = new EventEmitter<string>();
  @Output() valueChange = new EventEmitter<any[]>();
  /** Emits the locked value(s) the user tried to remove, so the consumer can warn (e.g. toastr). */
  @Output() lockedAttempt = new EventEmitter<any[]>();

  filterValue: string;
  isClearFocused: boolean = false;
  filteredItems: any[] = [];
  public internalValue: any[] = [];
  public onChange: (value: any[]) => void = () => {};
  public onTouched: () => void = () => {};

  private valueChangesSub?: Subscription;
  private subscribedControl?: AbstractControl;

  ngOnInit() {
    this.filteredItems = Array.isArray(this.items) ? [...this.items] : [];
    // Null-safety net: a [control]="form.get('x')" that resolves to null would otherwise NPE below.
    this.control = this.control ?? new FormControl<any[]>([]);
    this.updateInternalValue();
    this.subscribeToControl();
  }

  ngOnChanges() {
    this.filteredItems = Array.isArray(this.items) ? [...this.items] : [];
    this.updateInternalValue();
    // The bound [control] can change identity (e.g. a parent rebuilds its form) — re-subscribe so
    // programmatic value updates keep refreshing the displayed selection.
    if (this.control !== this.subscribedControl) {
      this.subscribeToControl();
    }
  }

  ngOnDestroy() {
    this.valueChangesSub?.unsubscribe();
  }

  private subscribeToControl(): void {
    this.valueChangesSub?.unsubscribe();
    if (!this.control) return;
    this.subscribedControl = this.control;
    this.valueChangesSub = this.control.valueChanges.subscribe(value => {
      this.internalValue = value || [];
    });
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

  setDisabledState(isDisabled: boolean): void {
    if (!this.control) return;
    if (isDisabled) {
      this.control.disable({ emitEvent: false });
    } else {
      this.control.enable({ emitEvent: false });
    }
  }

  onModelChange(value: any[]): void {
    if (this.control?.disabled) {
      return;
    }
    let next = value || [];
    // A locked (mandatory) value can never be dropped — re-add any that ng-select's row click / clear-all removed.
    const dropped = (this.lockedValues || []).filter(v => !next.includes(v));
    if (dropped.length) {
      next = [...next, ...dropped];
      this.internalValue = next;
      this.lockedAttempt.emit(dropped);
    }
    if (this.control) {
      this.control.setValue(next);
      this.onChange(next);
    }
    this.valueChange.emit(next);
  }

  toggleSelectAll(): void {
    if (!this.control || !this.filteredItems || this.control.disabled) return;
    const currentValue = this.control.value || [];
    if (currentValue.length === this.filteredItems.length) {
      // Unselect all — but keep locked (mandatory) items selected.
      this.control.setValue(this.filteredItems.map(item => item[this.bindValue]).filter(v => this.isLocked(v)));
    } else {
      this.control.setValue(this.filteredItems.map(item => item[this.bindValue]));
    }
    this.updateInternalValue();
    this.onChange(this.control.value);
    this.valueChange.emit(this.control.value);
    this.onTouched();
  }

  toggleItem(itemValue: any): void {
    if (!this.control || this.control.disabled) return;
    const currentValue = this.control.value || [];
    // Mandatory (locked) item cannot be un-ticked.
    if (this.isLocked(itemValue) && currentValue.includes(itemValue)) {
      this.lockedAttempt.emit([itemValue]);
      return;
    }
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

  /** A locked value is mandatory: cannot be un-ticked or removed. */
  isLocked(itemValue: any): boolean {
    return (this.lockedValues || []).includes(itemValue);
  }

  removeItem(item: any, event: Event): void {
    if (!this.control || this.control.disabled) return;
    event.stopPropagation();
    if (this.isLocked(item[this.bindValue])) {
      this.lockedAttempt.emit([item[this.bindValue]]);
      return;
    }
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
      const term = searchTerm.toLowerCase();
      this.filteredItems = searchTerm
        ? this.items.filter(item =>
            String(item[this.bindLabel] ?? '').toLowerCase().includes(term) ||
            (!!this.secondaryField &&
              String(item[this.secondaryField] ?? '').toLowerCase().includes(term)))
        : [...this.items];
    }
  }

  resetFilter() {
    this.filteredItems = [...this.items];
  }

  onOpen(): void {
    if (this.control?.disabled) {
      return;
    }
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
