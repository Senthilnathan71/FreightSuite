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
  emptyStatusText?: string; // Label shown by the 'status' template when the value is null/empty (default 'N/A')
}

export interface TableAction {
  // icon/tooltip/class may be a static value or a per-row function so a single action can render
  // differently depending on the row (e.g. a lock vs open-lock icon based on JobStatus).
  icon: string | ((row: any) => string);
  label: string;
  action: string;
  tooltip?: string | ((row: any) => string);
  condition?: (row: any) => boolean;
  disabledCondition?: (row: any) => boolean;
  state ?: boolean;   // Whether the action is enabled or disabled
  class?: string | ((row: any) => string);
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
  overlayMessage?: string;
  overlayIcon?: string;
  overlayVisible?: boolean;
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
