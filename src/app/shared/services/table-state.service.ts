import { Injectable } from '@angular/core';
import { TableState, ColumnVisibilityState } from '../interfaces/table.interface';

@Injectable({
  providedIn: 'root'
})
export class TableStateService {

  private readonly STORAGE_PREFIX = 'table-state-';

  constructor() { }

  saveTableState(tableId: string, state: Partial<TableState>): void {
    try {
      const existingState = this.getTableState(tableId) || {};
      const newState = { ...existingState, ...state };
      localStorage.setItem(`${this.STORAGE_PREFIX}${tableId}`, JSON.stringify(newState));
    } catch (error) {
      console.warn('Failed to save table state:', error);
    }
  }

  getTableState(tableId: string): TableState | null {
    try {
      const stateJson = localStorage.getItem(`${this.STORAGE_PREFIX}${tableId}`);
      return stateJson ? JSON.parse(stateJson) : null;
    } catch (error) {
      console.warn('Failed to load table state:', error);
      return null;
    }
  }

  clearTableState(tableId: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${tableId}`);
    } catch (error) {
      console.warn('Failed to clear table state:', error);
    }
  }

  saveColumnVisibility(tableId: string, visibility: ColumnVisibilityState): void {
    this.saveTableState(tableId, { columns: [], filters: [], sort: { column: '', direction: 'none' }, columnOrder: [], selectedRows: [] });
  }

  getColumnVisibility(tableId: string): ColumnVisibilityState | null {
    const state = this.getTableState(tableId);
    return state ? this.extractColumnVisibility(state) : null;
  }

  private extractColumnVisibility(state: TableState): ColumnVisibilityState {
    const visibility: ColumnVisibilityState = {};
    state.columns?.forEach(col => {
      visibility[col.key] = col.visible !== false;
    });
    return visibility;
  }

  saveColumnOrder(tableId: string, columnOrder: string[]): void {
    this.saveTableState(tableId, { columnOrder });
  }

  getColumnOrder(tableId: string): string[] | null {
    const state = this.getTableState(tableId);
    return state?.columnOrder || null;
  }
}