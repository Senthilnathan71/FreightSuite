export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalRecords: number;
  pageSizeOptions: number[];
  maxPagesToShow: number;
}

export interface PaginationState {
  filterValue: string;
  page: number;
  pageSize: number;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  timestamp: number;
}

export interface SearchParams {
  search: string;
  page: number;
  pageSize: number;
  sortColumn?: string;
  sortDirection?: string;
  [key: string]: any; // Allow additional parameters
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  startRecord: number;
  endRecord: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ListComponentConfig {
  storageKey: string;
  defaultPageSize: number;
  defaultSortColumn: string;
  defaultSortDirection: 'asc' | 'desc';
  pageSizeOptions: number[];
  maxPagesToShow: number;
}