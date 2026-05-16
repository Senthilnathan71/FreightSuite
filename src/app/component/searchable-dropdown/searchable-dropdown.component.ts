import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, forwardRef, ViewChild, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'dofi-searchable-dropdown',
  imports: [NgSelectModule, CommonModule, ReactiveFormsModule,NgbTooltipModule],
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
export class SearchableDropdown implements OnChanges, OnInit, ControlValueAccessor, AfterViewInit {
  @Input() items: any[] = [];
  @Input() placeholder: string = '';
  @Input() displayFields: string[] = [];
  @Input() displayLabels: string[] = [];
  @Input() bindLabel: string = '';
  @Input() labelFields: string[] = [];
  @Input() bindValue!: string;
  @Input() isLoading: boolean = false;
  @Input() control: FormControl | null = null;
  @Input() clearable: boolean = true;
  @Input() readonly: boolean = false;
  @Input() style: string = '';

  @ViewChild('ngSelect', { static: false, read: ElementRef }) ngSelectRef!: ElementRef;
  @ViewChild(NgSelectComponent) ngSelect!: NgSelectComponent;

  @Input() width : number[] = [];
  @Output() itemSelected = new EventEmitter<any>();

  columnWidths: number[] = [];
  internalControl: FormControl = new FormControl(null);
  isOpen = false; // or whatever you already use internally

  public open(): void {
  // if (this.readonly || this.internalControl.disabled) {
  //   return;
  // }
  if (this.ngSelect) {
    this.ngSelect.open();   // ✅ REAL OPEN
  }
}


  public close(): void {
  if (this.ngSelect) {
    this.ngSelect.close();
  }
}


  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {}

  @HostListener('click')
  onHostClick(): void {
    this.open();
  }

  ngOnInit() {
   
    if (this.control) {
      this.internalControl = this.control;
    }
    if(this.width.length === 0){
      const length = this.displayFields.length;
      for (let index = 0; index < length; index++) {
        this.width.push(Math.floor(12 / length));
      }
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

  ngAfterViewInit() {
    this.calculateColumnWidths();
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
    setTimeout(() => this.close(), 0);
  }

  getLabel(item: any): string {
    if (!item || !this.labelFields?.length) {
      return this.bindLabel ? item[this.bindLabel] : '';
    }
    if (!this.internalControl.value || this.internalControl.value !== item) {
      return this.labelFields.map((field) => item[field]).join(' - ');
    }
    return this.labelFields.map((field) => item[field]).join(' - ');
  }

  getColumnStyle(index: number): any {
    const width = this.columnWidths[index] || 100;
    return { 'width': `${width}px`, 'min-width': `${width}px`, 'max-width': `${width}px` };
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
        let estimatedWidth = charLength * 9;
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

    this.columnWidths = this.columnWidths.map((width) => Math.min(width + 24, 400));
  }

  searchFn = (term: string, item: any): boolean => {
    if (!term || !item) return true;

    const searchTerm = term.toLowerCase().trim();
    const fieldsToSearch = this.displayFields;

    return fieldsToSearch.some((field) => {
      const value = item[field] ? item[field].toString().toLowerCase().trim() : '';
      return value.includes(searchTerm);
    });
  };
  onOpen(){
    this.onTouched();
    if (this.control) {
      this.control.markAsTouched();
      this.control.markAsDirty();
    }
    setTimeout(() => {
    requestAnimationFrame(() => this.adjustDropdownWidth());
  }, 10); // You can experiment with 0, 10, or 50ms
  }

  adjustDropdownWidth() {
    const ngSelectElement: HTMLElement = this.ngSelectRef?.nativeElement;
    if (!ngSelectElement) return;

    const rect = ngSelectElement.getBoundingClientRect();
    const windowWidth = window.innerWidth;

    const totalContentWidth = this.columnWidths.length > 0
      ? this.columnWidths.reduce((sum, w) => sum + w, 0) + 40
      : 400;

    // Cap panel width at viewport width minus margins
    const maxWidth = windowWidth - 32;
    const minWidth = Math.max(rect.width, 200);
    const panelWidth = Math.min(Math.max(totalContentWidth, minWidth), maxWidth);

    const panels = document.querySelectorAll('.ng-dropdown-panel');
    const dropdownPanel = panels[panels.length - 1] as HTMLElement;
    if (dropdownPanel) {
      dropdownPanel.style.width = `${panelWidth}px`;

      // If panel overflows the right edge, shift it left
      const rightOverflow = (rect.left + panelWidth) - (windowWidth - 16);
      if (rightOverflow > 0) {
        const newLeft = Math.max(16, rect.left - rightOverflow);
        dropdownPanel.style.left = `${newLeft}px`;
      }
    }
  }


  // Focus method using ElementRef
  focus() {
    if (this.ngSelectRef?.nativeElement) {
      // Find the input element inside ng-select and focus it
      const inputElement = this.ngSelectRef.nativeElement.querySelector('input');
      if (inputElement) {
        inputElement.focus();
      }
    }
  }

  onScrollToEnd(){
    console.log("Reached End");
  }

  @HostListener('window:resize', [])
  onResize() {
    this.adjustDropdownWidth();
  }

}
