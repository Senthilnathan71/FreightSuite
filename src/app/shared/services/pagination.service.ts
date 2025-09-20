import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PaginationConfig, PaginationState, PaginationInfo } from '../interfaces/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  private readonly STATE_EXPIRY_HOURS = 24;

  constructor() {}

  /**
   * Save pagination state to localStorage
   */
  saveState(storageKey: string, state: PaginationState): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving pagination state:', error);
    }
  }

  /**
   * Restore pagination state from localStorage
   */
  restoreState(storageKey: string): Partial<PaginationState> | null {
    try {
      const savedState = localStorage.getItem(storageKey);
      if (!savedState) return null;

      const state: PaginationState = JSON.parse(savedState);

      // Check if state is still valid (within expiry time)
      const hoursDifference = (Date.now() - state.timestamp) / (1000 * 60 * 60);

      if (hoursDifference > this.STATE_EXPIRY_HOURS) {
        this.clearState(storageKey);
        return null;
      }

      return {
        filterValue: state.filterValue || '',
        page: Number(state.page) || 1,
        pageSize: Number(state.pageSize) || 10,
        sortColumn: state.sortColumn || '',
        sortDirection: state.sortDirection || 'desc'
      };
    } catch (error) {
      console.error('Error restoring pagination state:', error);
      this.clearState(storageKey);
      return null;
    }
  }

  /**
   * Clear pagination state from localStorage
   */
  clearState(storageKey: string): void {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing pagination state:', error);
    }
  }

  /**
   * Calculate pagination information
   */
  calculatePaginationInfo(config: PaginationConfig): PaginationInfo {
    const totalPages = Math.ceil(config.totalRecords / config.pageSize);
    const startRecord = config.totalRecords > 0 ? (config.page - 1) * config.pageSize + 1 : 0;
    const endRecord = Math.min(config.page * config.pageSize, config.totalRecords);

    return {
      currentPage: config.page,
      totalPages,
      totalRecords: config.totalRecords,
      startRecord,
      endRecord,
      hasNextPage: config.page < totalPages,
      hasPreviousPage: config.page > 1
    };
  }

  /**
   * Get visible page numbers for pagination
   */
  getVisiblePages(currentPage: number, totalPages: number, maxPagesToShow: number): number[] {
    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfMaxPages = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, currentPage - halfMaxPages);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  /**
   * Check if first ellipsis should be shown
   */
  shouldShowFirstEllipsis(visiblePages: number[]): boolean {
    return visiblePages.length > 0 && visiblePages[0] > 1;
  }

  /**
   * Check if last ellipsis should be shown
   */
  shouldShowLastEllipsis(visiblePages: number[], totalPages: number): boolean {
    return visiblePages.length > 0 && visiblePages[visiblePages.length - 1] < totalPages;
  }

  /**
   * Get record range text
   */
  getRecordRangeText(page: number, pageSize: number, totalRecords: number): string {
    if (totalRecords === 0) {
      return 'No records';
    }

    const startRecord = (page - 1) * pageSize + 1;
    const endRecord = Math.min(page * pageSize, totalRecords);

    return `Showing ${startRecord}-${endRecord} of ${totalRecords} records`;
  }

  /**
   * Validate and convert pagination parameters to ensure they are numbers
   */
  sanitizePaginationParams(page: any, pageSize: any): { page: number; pageSize: number } {
    return {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10
    };
  }

  /**
   * Create pagination state object
   */
  createPaginationState(
    filterValue: string,
    page: number,
    pageSize: number,
    sortColumn: string,
    sortDirection: 'asc' | 'desc'
  ): PaginationState {
    return {
      filterValue,
      page: Number(page),
      pageSize: Number(pageSize),
      sortColumn,
      sortDirection,
      timestamp: Date.now()
    };
  }
}