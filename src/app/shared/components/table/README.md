# Reusable Table Component

A comprehensive, feature-rich table component for Angular applications with Bootstrap 5 styling.

## Features

- ✅ **Column Management**: Show/hide columns with dropdown toggle
- ✅ **Sorting**: Click headers to sort (asc/desc/none) with visual indicators
- ✅ **Filtering**: Individual column filters with debounced search
- ✅ **Drag & Drop**: Reorder columns by dragging headers
- ✅ **Row Selection**: Single or multi-select with checkboxes
- ✅ **Pagination**: Integrated with existing pagination component
- ✅ **Custom Templates**: Support for different cell templates (link, status, action, custom)
- ✅ **Responsive**: Bootstrap 5 responsive design
- ✅ **Accessible**: ARIA labels and keyboard navigation
- ✅ **Performance**: OnPush change detection and trackBy functions

## Installation

The component is already created in `src/app/shared/components/table/`. Make sure Angular CDK is installed:

```bash
npm install @angular/cdk
```

## Basic Usage

### 1. Import the Component

```typescript
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableColumn, TableConfig } from 'src/app/shared/interfaces/table.interface';

@Component({
  imports: [ReusableTableComponent],
  // ...
})
```

### 2. Define Table Configuration

```typescript
export class MyListComponent {
  tableConfig: TableConfig = {
    columns: [
      {
        key: 'id',
        label: 'ID',
        sortable: true,
        filterable: true,
        width: '80px'
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        filterable: true,
        template: 'link'
      },
      {
        key: 'status',
        label: 'Status',
        template: 'status',
        width: '100px'
      }
    ],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Details'
      },
      {
        icon: 'fas fa-edit',
        label: 'Edit',
        action: 'edit',
        tooltip: 'Edit Item',
        condition: (row) => row.editable
      }
    ],
    selectable: true,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'id'
  };

  data = [
    { id: 1, name: 'John Doe', status: 'Active', editable: true },
    { id: 2, name: 'Jane Smith', status: 'Inactive', editable: false }
  ];
}
```

### 3. Use in Template

```html
<app-reusable-table
  [config]="tableConfig"
  [data]="data"
  [loading]="loading"
  [totalRecords]="totalRecords"
  [paginationConfig]="paginationConfig"
  [selectedRows]="selectedRows"
  (actionClick)="onActionClick($event)"
  (rowClick)="onRowClick($event)"
  (rowSelect)="onRowSelect($event)"
  (sortChange)="onSortChange($event)"
  (filterChange)="onFilterChange($event)"
  (pageChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)">
</app-reusable-table>
```

## Configuration Options

### TableConfig Interface

```typescript
interface TableConfig {
  columns: TableColumn[];           // Column definitions
  actions?: TableAction[];          // Action buttons
  selectable?: boolean;            // Enable row selection
  multiSelect?: boolean;           // Allow multiple selection
  showColumnToggle?: boolean;      // Show column visibility toggle
  showFilters?: boolean;           // Show column filters
  showPagination?: boolean;        // Show pagination
  trackByKey?: string;             // Key for trackBy function
  rowClass?: (row: any) => string; // Custom row CSS class
  emptyMessage?: string;           // Custom empty state message
  loadingMessage?: string;         // Custom loading message
  dragAndDrop?: boolean;           // Enable column reordering
}
```

### TableColumn Interface

```typescript
interface TableColumn {
  key: string;                     // Data property key
  label: string;                   // Column header text
  sortable?: boolean;              // Enable sorting (default: true)
  filterable?: boolean;            // Enable filtering (default: true)
  visible?: boolean;               // Column visibility (default: true)
  width?: string;                  // Column width (CSS)
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'custom';
  headerClass?: string;            // Header CSS class
  cellClass?: string;              // Cell CSS class
  template?: 'default' | 'link' | 'status' | 'action' | 'custom';
  customRenderer?: (value: any, row: any) => string;
  sortKey?: string;                // Different key for sorting
  filterKey?: string;              // Different key for filtering
}
```

## Templates

### Available Templates

1. **default**: Simple text display
2. **link**: Clickable link that emits action event
3. **status**: Status badge with active/inactive styling
4. **action**: View action button with eye icon
5. **custom**: Use customRenderer function

### Custom Renderer Example

```typescript
{
  key: 'amount',
  label: 'Amount',
  template: 'custom',
  customRenderer: (value, row) => {
    return `$${value.toFixed(2)}`;
  }
}
```

## Event Handling

### Action Events

```typescript
onActionClick(event: TableEventData): void {
  switch (event.action) {
    case 'view':
      this.router.navigate(['/view', event.row.id]);
      break;
    case 'edit':
      this.router.navigate(['/edit', event.row.id]);
      break;
    case 'delete':
      this.deleteItem(event.row);
      break;
  }
}
```

### Sort Events

```typescript
onSortChange(sort: TableSortConfig): void {
  this.sortColumn = sort.column;
  this.sortDirection = sort.direction;
  this.loadData();
}
```

### Filter Events

```typescript
onFilterChange(filters: TableFilter[]): void {
  this.currentFilters = filters;
  this.applyFilters();
}
```

## Advanced Features

### Column Reordering

Enable drag-and-drop column reordering:

```typescript
tableConfig: TableConfig = {
  // ...
  dragAndDrop: true
};
```

### Conditional Actions

Show actions based on row data:

```typescript
actions: [
  {
    icon: 'fas fa-trash',
    label: 'Delete',
    action: 'delete',
    condition: (row) => row.status !== 'Archived'
  }
]
```

### Custom Row Classes

Apply custom CSS classes to rows:

```typescript
tableConfig: TableConfig = {
  // ...
  rowClass: (row) => {
    if (row.priority === 'high') return 'table-danger';
    if (row.priority === 'low') return 'table-success';
    return '';
  }
};
```

## Migration from Existing Tables

### Step 1: Define Columns

Convert your existing table headers to column definitions:

```typescript
// Before (in template)
<th>Booking No</th>
<th>Department</th>
<th>Status</th>

// After (in component)
columns: [
  { key: 'BookingNo', label: 'Booking No', sortable: true, filterable: true },
  { key: 'Dept', label: 'Department', sortable: true, filterable: true },
  { key: 'status', label: 'Status', template: 'status' }
]
```

### Step 2: Handle Events

Replace existing event handlers:

```typescript
// Before
onSort(column: string) { /* ... */ }
onRowClick(row: any) { /* ... */ }

// After
onSortChange(sort: TableSortConfig) { /* ... */ }
onRowClick(row: any) { /* ... */ }
```

### Step 3: Update Template

Replace existing table markup with component:

```html
<!-- Before -->
<table class="table">
  <!-- complex table markup -->
</table>

<!-- After -->
<app-reusable-table [config]="tableConfig" [data]="data"></app-reusable-table>
```

## Performance Tips

1. **Use trackByKey**: Set appropriate tracking key for large datasets
2. **OnPush Strategy**: Component uses OnPush change detection
3. **Debounced Filters**: Filters are automatically debounced (300ms)
4. **Virtual Scrolling**: For very large datasets, consider implementing virtual scrolling

## Styling

The component uses Bootstrap 5 classes and can be customized with CSS:

```scss
// Custom table styling
.enterprise-table {
  // Your custom styles
}

// Custom status badge colors
.status-badge.custom {
  background-color: #your-color;
  color: #your-text-color;
}
```

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- Focus management
- High contrast support

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Examples

See the `operation/booking/list` component for a complete implementation example.