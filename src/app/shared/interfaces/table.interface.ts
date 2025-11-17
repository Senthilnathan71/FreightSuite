export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  visible?: boolean;
  width?: string;
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'custom';
  headerClass?: string;
  cellClass?: string;
  template?: 'default' | 'link' | 'status' | 'action' | 'custom';
  customRenderer?: (value: any, row: any) => string;
  sortKey?: string; // Different key for sorting if needed
  filterKey?: string; // Different key for filtering if needed
  tooltipKey?:string;
}

export interface TableAction {
  icon: string;
  label: string;
  action: string;
  tooltip?: string;
  condition?: (row: any) => boolean;
  class?: string;
}

export interface TableFilter {
  column: string;
  value: string;
  operator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
}

export interface TableSortConfig {
  column: string;
  direction: 'asc' | 'desc' | 'none';
}

export interface TableConfig {
  columns: TableColumn[];
  actions?: TableAction[];
  selectable?: boolean;
  multiSelect?: boolean;
  showColumnToggle?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  trackByKey?: string;
  rowClass?: (row: any) => string;
  emptyMessage?: string;
  loadingMessage?: string;
  dragAndDrop?: boolean;
}

export interface TableState {
  columns: TableColumn[];
  filters: TableFilter[];
  sort: TableSortConfig;
  columnOrder: string[];
  selectedRows: any[];
}

export interface TableEventData {
  action: string;
  row: any;
  value?: any;
  column?: TableColumn;
}

export interface ColumnVisibilityState {
  [key: string]: boolean;
}

export interface TableData {
  items: any[];
  totalCount: number;
  page: number;
  pageSize: number;
}