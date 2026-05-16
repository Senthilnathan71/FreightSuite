import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationService } from '../../services/pagination.service';
import { PaginationConfig, PaginationInfo } from '../../interfaces/pagination.interface';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';

@Component({
  selector: 'app-common-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule, ElementStateGuardDirective],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class CommonPaginationComponent implements OnChanges {
  @Input() config: PaginationConfig = {
    page: 1,
    pageSize: 10,
    totalRecords: 0,
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  paginationInfo: PaginationInfo | null = null;
  visiblePages: number[] = [];

  constructor(private paginationService: PaginationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.updatePaginationInfo();
    }
  }

  private updatePaginationInfo(): void {
    this.paginationInfo = this.paginationService.calculatePaginationInfo(this.config);
    this.visiblePages = this.paginationService.getVisiblePages(
      this.config.page,
      this.paginationInfo.totalPages,
      this.config.maxPagesToShow
    );
  }

  onPageSizeChange(newPageSize: number | string): void {
    this.pageSizeChange.emit(Number(newPageSize));
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.paginationInfo!.totalPages && page !== this.config.page) {
      this.pageChange.emit(page);
    }
  }

  goToFirstPage(): void {
    if (this.paginationInfo?.hasPreviousPage) {
      this.pageChange.emit(1);
    }
  }

  goToLastPage(): void {
    if (this.paginationInfo?.hasNextPage) {
      this.pageChange.emit(this.paginationInfo.totalPages);
    }
  }

  previousPage(): void {
    if (this.paginationInfo?.hasPreviousPage) {
      this.pageChange.emit(this.config.page - 1);
    }
  }

  nextPage(): void {
    if (this.paginationInfo?.hasNextPage) {
      this.pageChange.emit(this.config.page + 1);
    }
  }

  shouldShowFirstEllipsis(): boolean {
    return this.paginationService.shouldShowFirstEllipsis(this.visiblePages);
  }

  shouldShowLastEllipsis(): boolean {
    return this.paginationService.shouldShowLastEllipsis(
      this.visiblePages,
      this.paginationInfo?.totalPages || 0
    );
  }

  getRecordRangeText(): string {
    return this.paginationService.getRecordRangeText(
      this.config.page,
      this.config.pageSize,
      this.config.totalRecords
    );
  }
}
