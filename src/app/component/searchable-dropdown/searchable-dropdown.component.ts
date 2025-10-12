import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, forwardRef } from '@angular/core';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'dofi-searchable-dropdown',
  imports: [CommonModule, ReactiveFormsModule, NgbTooltipModule],
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
  @Input() placeholder: string = 'Select an option';
  @Input() displayFields: string[] = [];
  @Input() displayLabels: string[] = [];
  @Input() bindLabel: string = '';
  @Input() labelFields: string[] = [];
  @Input() bindValue!: string;
  @Input() isLoading: boolean = false;
  @Input() control: FormControl | null = null;
  @Input() disabled: boolean = false;

  @Output() itemSelected = new EventEmitter<any>();

  columnWidths: number[] = [];
  internalControl: FormControl = new FormControl(null);
  searchControl: FormControl = new FormControl('');
  filteredItems: any[] = [];
  selectedItem: any = null;
  modalRef: NgbModalRef | null = null;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private modalService: NgbModal) {}

  ngOnInit() {
    if (this.control) {
      this.internalControl = this.control;
    }
    this.filteredItems = [...this.items];
    
    // Subscribe to search control changes
    this.searchControl.valueChanges.subscribe(term => {
      this.filterItems(term || '');
    });

    // Update selected item display when value changes
    this.internalControl.valueChanges.subscribe(value => {
      this.updateSelectedItem(value);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['control'] && this.control) {
      this.internalControl = this.control;
    }

    if (changes['items']) {
      this.filteredItems = [...this.items];
      this.calculateColumnWidths();
      this.updateSelectedItem(this.internalControl.value);
    }

    if (changes['displayFields'] || changes['displayLabels']) {
      this.calculateColumnWidths();
    }

    if (changes['disabled']) {
      this.setDisabledState(this.disabled);
    }
  }

  writeValue(value: any): void {
    this.internalControl.setValue(value, { emitEvent: false });
    this.updateSelectedItem(value);
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

  openModal(content: any) {
    if (this.disabled || this.internalControl.disabled) {
      return;
    }

    this.searchControl.setValue('');
    this.filteredItems = [...this.items];
    this.modalRef = this.modalService.open(content, {
      size: 'lg',
      centered: true,
      scrollable: true,
      windowClass: 'compact-modal'
    });
    this.onTouched();
  }

  selectItem(item: any) {
    this.selectedItem = item;
    const value = item ? item[this.bindValue] : null;
    this.internalControl.setValue(value);
    this.onChange(value);
    this.itemSelected.emit(item);
    this.closeModal();
  }

  clearSelection() {
    this.selectedItem = null;
    this.internalControl.setValue(null);
    this.onChange(null);
    this.itemSelected.emit(null);
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
  }

  updateSelectedItem(value: any) {
    if (value && this.items.length > 0) {
      this.selectedItem = this.items.find(item => item[this.bindValue] === value) || null;
    } else {
      this.selectedItem = null;
    }
  }

  getDisplayText(): string {
    if (!this.selectedItem) {
      return this.placeholder;
    }
    return this.getLabel(this.selectedItem);
  }

  getLabel(item: any): string {
    if (!item) {
      return '';
    }
    if (this.labelFields?.length) {
      return this.labelFields.map((field) => item[field]).join(' - ');
    }
    if (this.bindLabel) {
      return item[this.bindLabel];
    }
    return '';
  }

  filterItems(term: string) {
    if (!term || term.trim() === '') {
      this.filteredItems = [...this.items];
      return;
    }

    const searchTerm = term.toLowerCase().trim();
    const fieldsToSearch = this.labelFields?.length ? this.labelFields : this.displayFields;

    this.filteredItems = this.items.filter(item => {
      return fieldsToSearch.some((field) => {
        const value = item[field] ? item[field].toString().toLowerCase().trim() : '';
        return value.includes(searchTerm);
      });
    });
  }

  getColumnStyle(index: number): any {
    const width = this.columnWidths[index] || 100;
    return { width: `${width}px`, minWidth: `${width}px` };
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
}