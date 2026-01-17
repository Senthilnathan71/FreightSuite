import { Component, OnInit, OnDestroy } from '@angular/core';
import { PaginationService } from '../../services/pagination.service';
import { PaginationConfig, PaginationState, SearchParams, ListComponentConfig } from '../../interfaces/pagination.interface';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  template: ''
})
export abstract class BaseListComponent implements OnInit, OnDestroy {
  protected destroy$ = new Subject<void>();

  // Common properties
  filterValue = '';
  allItems: any[] = [];
  searchPerformed = false;
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Pagination configuration
  paginationConfig: PaginationConfig = {
    page: 1,
    pageSize: 10,
    totalRecords: 0,
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Component configuration (to be overridden by child classes)
  protected abstract config: ListComponentConfig;

  constructor(protected paginationService: PaginationService) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.restoreSearchState();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected initializeComponent(): void {
    this.pageSize = this.config.defaultPageSize;
    this.sortColumn = this.config.defaultSortColumn;
    this.sortDirection = this.config.defaultSortDirection;
    this.paginationConfig = {
      page: this.page,
      pageSize: this.pageSize,
      totalRecords: this.totalLengthOfCollection,
      pageSizeOptions: this.config.pageSizeOptions,
      maxPagesToShow: this.config.maxPagesToShow
    };
  }

  // Abstract methods to be implemented by child classes
  protected abstract searchItems(context?:any): Observable<any>;
  protected abstract getSearchParams(): SearchParams;
  protected abstract processSearchResults(response: any,context?:any): void;

  // Common search method
  search(context?:any): void {
    const params = this.getSearchParams();

    // Ensure numeric types
    const sanitizedParams = this.paginationService.sanitizePaginationParams(params.page, params.pageSize);
    params.page = sanitizedParams.page;
    params.pageSize = sanitizedParams.pageSize;

    // Update pagination config before saving state to ensure consistency
    this.updatePaginationConfig();
    this.saveSearchState();

    this.searchItems(context)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.processSearchResults(response,context);
          this.updatePaginationConfig();
          this.searchPerformed = true;
        },
        error: (error) => {
          this.handleSearchError(error);
        }
      });
  }

  // Common sorting functionality
  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  protected applySorting(): void {
    this.allItems.sort((a, b) => {
      let valueA = a[this.sortColumn] || '';
      let valueB = b[this.sortColumn] || '';

      if (typeof valueA !== 'number' && !(valueA instanceof Date)) {
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();
      }

      return valueA < valueB
        ? this.sortDirection === 'asc' ? -1 : 1
        : valueA > valueB
        ? this.sortDirection === 'asc' ? 1 : -1
        : 0;
    });
  }

  // Pagination event handlers
  onPageChange(newPage: number): void {
    this.page = newPage;
    this.updatePaginationConfig();
    this.loadData();
  }

  onPageSizeChange(newPageSize: number): void {
    this.pageSize = Number(newPageSize);
    this.page = 1; // Reset to first page when changing page size
    this.updatePaginationConfig();
    this.loadData();
  }

  // Common utility methods
  clearFilter(): void {
    this.filterValue = '';
    this.page = 1;
    this.updatePaginationConfig();
    this.loadData();
  }

  resetPage(): void {
    this.filterValue = '';
    this.page = 1;
    this.pageSize = this.config.defaultPageSize;
    this.searchPerformed = false;
    this.allItems = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = this.config.defaultSortColumn;
    this.sortDirection = this.config.defaultSortDirection;

    this.clearSearchState();
    this.updatePaginationConfig();
    this.loadData();
  }

  // State persistence methods
  private saveSearchState(): void {
    const state = this.paginationService.createPaginationState(
      this.filterValue,
      this.page,
      this.pageSize,
      this.sortColumn,
      this.sortDirection
    );
    this.paginationService.saveState(this.config.storageKey, state);
  }

  private restoreSearchState(): void {
    const state = this.paginationService.restoreState(this.config.storageKey);
    if (state) {
      this.filterValue = state.filterValue || '';
      this.page = state.page || 1;
      this.pageSize = state.pageSize || this.config.defaultPageSize;
      this.sortColumn = state.sortColumn || this.config.defaultSortColumn;
      this.sortDirection = state.sortDirection || this.config.defaultSortDirection;

      // Update pagination config after restoring state
      this.updatePaginationConfig();
    }
  }

  private clearSearchState(): void {
    this.paginationService.clearState(this.config.storageKey);
  }

  public updatePaginationConfig(): void {
    this.paginationConfig = {
      page: this.page,
      pageSize: this.pageSize,
      totalRecords: this.totalLengthOfCollection,
      pageSizeOptions: this.config.pageSizeOptions,
      maxPagesToShow: this.config.maxPagesToShow
    };
  }

  // Common method for loading data
  protected loadData(): void {
    this.search();
  }

  // Error handling
  protected handleSearchError(error: any): void {
    console.error('Error searching items:', error);
    this.allItems = [];
    this.totalLengthOfCollection = 0;
    this.updatePaginationConfig();
  }

  // Track by function for *ngFor
  trackBy(index: number, item: any): any {
    return item.id || item.sid || index;
  }
}