import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-viewer.component.html',
  styleUrls: ['./report-viewer.component.scss']
})
export class ReportViewerComponent implements OnChanges {
  @Input() reportData: any[] = [];
  @Input() reportName: string = '';
  @Input() loading: boolean = false;

  columns: string[] = [];
  displayedColumns: string[] = [];
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  paginatedData: any[] = [];
  searchTerm: string = '';
  filteredData: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reportData'] && this.reportData && this.reportData.length > 0) {
      this.initializeViewer();
    }
  }

  initializeViewer(): void {
    // Extract columns from first data row
    if (this.reportData.length > 0) {
      this.columns = Object.keys(this.reportData[0]);
      this.displayedColumns = [...this.columns];
    }

    this.filteredData = [...this.reportData];
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredData = [...this.reportData];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredData = this.reportData.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(term)
        )
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  getColumnLabel(column: string): string {
    // Convert camelCase/PascalCase to Title Case with spaces
    return column
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/^./, str => str.toUpperCase());
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }

    // Format dates
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    // Format numbers with commas
    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    // Format boolean
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getTotalRecords(): number {
    return this.filteredData.length;
  }

  getDisplayRange(): string {
    if (this.filteredData.length === 0) return '0-0';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredData.length);
    return `${start}-${end}`;
  }
}
