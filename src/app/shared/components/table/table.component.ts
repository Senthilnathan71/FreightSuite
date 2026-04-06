import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  TableColumn,
  TableConfig,
  TableState,
  TableEventData,
  TableFilter,
  TableSortConfig,
  ColumnVisibilityState,
  TableData
} from '../../interfaces/table.interface';
import { CommonPaginationComponent } from '../pagination/pagination.component';
import { PaginationConfig } from '../../interfaces/pagination.interface';

@Component({
  selector: 'app-reusable-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FeatherModule,
    DragDropModule,
    CommonPaginationComponent
  ],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ReusableTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() config: TableConfig = { columns: [] };
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() totalRecords = 0;
  @Input() paginationConfig: PaginationConfig | null = null;
  @Input() selectedRows: any[] = [];
  @Input() allowScroll: boolean = false;

  @Output() actionClick = new EventEmitter<TableEventData>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() rowSelect = new EventEmitter<any[]>();
  @Output() sortChange = new EventEmitter<TableSortConfig>();
  @Output() filterChange = new EventEmitter<TableFilter[]>();
  @Output() columnOrderChange = new EventEmitter<string[]>();
  @Output() columnVisibilityChange = new EventEmitter<ColumnVisibilityState>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  @ViewChild('columnToggleDropdown') columnToggleDropdown!: ElementRef;

  // Internal state
  currentSort: TableSortConfig = { column: '', direction: 'none' };
  currentFilters: TableFilter[] = [];
  columnVisibility: ColumnVisibilityState = {};
  columnOrder: string[] = [];
  filteredData: any[] = [];
  filterInputs: { [key: string]: string } = {};
  showColumnToggle = false;
  showFilter: { [key: string]: boolean } = {};

  // Debounced filter subjects
  private filterSubjects: { [key: string]: Subject<string> } = {};
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeComponent();
    this.setupFilterDebouncing();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.initializeComponent();
    }
    if (changes['data']) {
      this.updateFilteredData();
    }
    if (changes['selectedRows']) {
      // Handle external selectedRows changes
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    Object.values(this.filterSubjects).forEach(subject => subject.complete());
  }

  private initializeComponent(): void {
    if (!this.config.columns) return;

    // Initialize column visibility
    this.columnVisibility = {};
    this.config.columns.forEach(column => {
      this.columnVisibility[column.key] = column.visible !== false;
    });

    // Initialize column order
    this.columnOrder = this.config.columns.map(col => col.key);

    // Initialize filter inputs
    this.filterInputs = {};
    this.config.columns.forEach(column => {
      if (column.filterable !== false) {
        this.filterInputs[column.key] = '';
      }
    });

    // Clear filters when config changes
    this.currentFilters = [];
    this.updateFilteredData();
  }

  private setupFilterDebouncing(): void {
    this.config.columns?.forEach(column => {
      if (column.filterable !== false) {
        const subject = new Subject<string>();
        this.filterSubjects[column.key] = subject;

        subject.pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        ).subscribe(value => {
          this.applyFilter(column.key, value);
        });
      }
    });
  }

  // Column management
  getVisibleColumns(): TableColumn[] {
    if (!this.config.columns) return [];

    return this.config.columns
      .filter(col => this.columnVisibility[col.key] !== false)
      .sort((a, b) => {
        const aIndex = this.columnOrder.indexOf(a.key);
        const bIndex = this.columnOrder.indexOf(b.key);
        return aIndex - bIndex;
      });
  }

  toggleColumnVisibility(columnKey: string): void {
    this.columnVisibility[columnKey] = !this.columnVisibility[columnKey];
    this.columnVisibilityChange.emit({ ...this.columnVisibility });
  }

  toggleColumnDropdown(): void {
    this.showColumnToggle = !this.showColumnToggle;
  }

  // Drag and drop for column reordering
  onColumnDrop(event: CdkDragDrop<TableColumn[]>): void {
    if (!this.config.dragAndDrop) return;

    // Get the current visible columns and their keys
    const visibleColumns = this.getVisibleColumns();
    const newColumnOrder = [...visibleColumns];

    // Move the dragged column to new position
    moveItemInArray(newColumnOrder, event.previousIndex, event.currentIndex);

    // Update the column order based on the new arrangement
    const newOrder = newColumnOrder.map(col => col.key);

    // Update the full column order to include invisible columns at their original positions
    const fullOrder = [...this.columnOrder];
    const visibleKeys = visibleColumns.map(col => col.key);

    // Remove visible columns from their current positions
    visibleKeys.forEach(key => {
      const index = fullOrder.indexOf(key);
      if (index > -1) {
        fullOrder.splice(index, 1);
      }
    });

    // Insert reordered visible columns at the beginning
    fullOrder.unshift(...newOrder);

    this.columnOrder = fullOrder;
    this.columnOrderChange.emit(fullOrder);
  }

  // Sorting
  onSort(column: TableColumn): void {
    if (column.sortable === false) return;

    const sortKey = column.sortKey || column.key;

    if (this.currentSort.column === sortKey) {
      // Cycle through: asc -> desc -> none
      switch (this.currentSort.direction) {
        case 'asc':
          this.currentSort.direction = 'desc';
          break;
        case 'desc':
          this.currentSort.direction = 'none';
          this.currentSort.column = '';
          break;
        default:
          this.currentSort.direction = 'asc';
      }
    } else {
      this.currentSort.column = sortKey;
      this.currentSort.direction = 'asc';
    }

    this.sortChange.emit({ ...this.currentSort });
  }

  getSortIcon(column: TableColumn): string {
    if (column.sortable === false) return '';

    const sortKey = column.sortKey || column.key;
    if (this.currentSort.column !== sortKey) return 'fas fa-sort';

    switch (this.currentSort.direction) {
      case 'asc': return 'fas fa-sort-up';
      case 'desc': return 'fas fa-sort-down';
      default: return 'fas fa-sort';
    }
  }

  // Filtering
  toggleFilter(columnKey: string): void {
    this.showFilter[columnKey] = !this.showFilter[columnKey];
    Object.keys(this.showFilter).forEach(key => {
      if (key !== columnKey) {
        this.showFilter[key] = false;
      }
    });
  }

  hideFilter(columnKey: string): void {
    this.showFilter[columnKey] = false;
  }

  onFilterInput(columnKey: string, value: string): void {
    this.filterInputs[columnKey] = value;
    if (this.filterSubjects[columnKey]) {
      this.filterSubjects[columnKey].next(value);
    }
  }

  private applyFilter(columnKey: string, value: string): void {
    // Remove existing filter for this column
    this.currentFilters = this.currentFilters.filter(f => f.column !== columnKey);

    // Add new filter if value is not empty
    if (value.trim()) {
      this.currentFilters.push({
        column: columnKey,
        value: value.trim(),
        operator: 'contains'
      });
    }

    this.filterChange.emit([...this.currentFilters]);
    this.updateFilteredData();
  }

  clearFilter(columnKey: string): void {
    this.filterInputs[columnKey] = '';
    this.applyFilter(columnKey, '');
  }

  clearAllFilters(): void {
    this.filterInputs = {};
    this.config.columns?.forEach(column => {
      if (column.filterable !== false) {
        this.filterInputs[column.key] = '';
      }
    });
    this.currentFilters = [];
    this.filterChange.emit([]);
    this.updateFilteredData();
  }

  private updateFilteredData(): void {
    // Always start with the current data
      if (this.config.showPagination) {
    this.filteredData = this.data ? [...this.data] : [];
    return;
  }
    this.filteredData = this.data ? [...this.data] : [];

    // Apply filters if any exist
    if (this.currentFilters.length > 0) {
      this.filteredData = this.filteredData.filter(row => {
        return this.currentFilters.every(filter => {
          const value = this.getCellValue(row, filter.column);
          const filterValue = filter.value.toLowerCase();
          const cellValue = String(value || '').toLowerCase();

          switch (filter.operator) {
            case 'equals': return cellValue === filterValue;
            case 'startsWith': return cellValue.startsWith(filterValue);
            case 'endsWith': return cellValue.endsWith(filterValue);
            case 'contains':
            default: return cellValue.includes(filterValue);
          }
        });
      });
    }
  }

  // Row selection
  onRowClick(row: any): void {
    if (this.config.overlayVisible) {
      return;
    }
    this.rowClick.emit(row);
  }

  onRowSelect(row: any, event: Event): void {
    event.stopPropagation();

    if (!this.config.selectable) return;

    const trackByKey = this.config.trackByKey || 'id';
    const rowId = row[trackByKey];

    if (this.config.multiSelect) {
      const selectedIds = this.selectedRows.map(r => r[trackByKey]);
      if (selectedIds.includes(rowId)) {
        this.selectedRows = this.selectedRows.filter(r => r[trackByKey] !== rowId);
      } else {
        this.selectedRows = [...this.selectedRows, row];
      }
    } else {
      this.selectedRows = this.isRowSelected(row) ? [] : [row];
    }

    this.rowSelect.emit([...this.selectedRows]);
  }

  isRowSelected(row: any): boolean {
    if (!this.config.selectable) return false;
    const trackByKey = this.config.trackByKey || 'id';
    return this.selectedRows.some(r => r[trackByKey] === row[trackByKey]);
  }

  selectAllRows(): void {
    if (!this.config.multiSelect) return;
    this.selectedRows = [...this.filteredData];
    this.rowSelect.emit([...this.selectedRows]);
  }

  deselectAllRows(): void {
    this.selectedRows = [];
    this.rowSelect.emit([]);
  }

  // Cell rendering
  getCellValue(row: any, columnKey: string): any {
    return row[columnKey];
  }

  getCellDisplay(row: any, column: TableColumn): string {
    const value = this.getCellValue(row, column.key);

    if (column.customRenderer) {
      return column.customRenderer(value, row);
    }

    if (value === null || value === undefined) {
      return '';
    }

    switch (column.dataType) {
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : value;
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  }

  isStatusActive(value: any): boolean {
    const normalized = String(value ?? '').trim().toLowerCase();
    return normalized === 'active' || normalized === 'posted' || normalized === 'approved';
  }

  // Action handling
  onActionClick(action: string, row: any, column?: TableColumn): void {
    this.actionClick.emit({ action, row, column });
  }

  // Pagination events
  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSizeChange.emit(pageSize);
  }

  // Track by function for ngFor
  trackByFn(index: number, item: any): any {
    const trackByKey = this.config.trackByKey || 'id';
    return item[trackByKey] || index;
  }

  trackByColumn(index: number, column: TableColumn): string {
    return column.key;
  }

  // Utility methods
  getRowClass(row: any): string {
    let classes = 'enterprise-row';

    if (this.isRowSelected(row)) {
      classes += ' selected';
    }

    if (this.config.rowClass) {
      classes += ' ' + this.config.rowClass(row);
    }

    return classes;
  }

  hasVisibleColumns(): boolean {
    return this.getVisibleColumns().length > 0;
  }

  getEmptyMessage(): string {
    return this.config.emptyMessage || 'No records found';
  }

  getLoadingMessage(): string {
    return this.config.loadingMessage || 'Loading...';
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Element;

    // Check if click is outside the column toggle dropdown
    if (this.showColumnToggle && this.columnToggleDropdown) {
      const dropdownElement = this.columnToggleDropdown.nativeElement;
      const dropdownContainer = dropdownElement.parentElement; // The custom-dropdown div

      // Only close if the click is completely outside the dropdown container
      if (dropdownContainer && !dropdownContainer.contains(target)) {
        this.showColumnToggle = false;
      }
    }

    // Close filter dropdowns when clicking outside their specific areas
    Object.keys(this.showFilter).forEach(key => {
      if (this.showFilter[key]) {
        // Filter dropdowns close on Enter/Escape, so we don't need aggressive outside clicking
      }
    });
  }
}
