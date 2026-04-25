import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { SalespersonInfo } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDatepickerModule],
  templateUrl: './sm-filters.component.html',
  styleUrls: ['./sm-filters.component.scss']
})
export class SmFiltersComponent implements OnInit {
  @Input() salespersons: SalespersonInfo[] = [];
  @Input() lastUpdated: Date | null = null;
  @Output() filtersChanged = new EventEmitter<{ dateFrom: Date | null; dateTo: Date | null; salespersonId: number | null }>();
  @Output() refreshClicked = new EventEmitter<void>();

  activePreset = 'month';
  selectedSalespersonId: number | null = null;
  dateFrom: NgbDateStruct | null = null;
  dateTo: NgbDateStruct | null = null;

  ngOnInit() {
    this.setPreset('month');
  }

  setPreset(preset: string) {
    this.activePreset = preset;
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (preset) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        from = new Date(now);
        from.setDate(now.getDate() - now.getDay());
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        from = new Date(now.getFullYear(), qMonth, 1);
        break;
      case 'fy':
        const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        from = new Date(fyYear, 3, 1);
        break;
      default:
        return;
    }

    this.dateFrom = { year: from.getFullYear(), month: from.getMonth() + 1, day: from.getDate() };
    this.dateTo = { year: to.getFullYear(), month: to.getMonth() + 1, day: to.getDate() };
    this.emitFilters();
  }

  onDateChange() {
    this.activePreset = 'custom';
    this.emitFilters();
  }

  onSalespersonChange() {
    this.emitFilters();
  }

  onRefresh() {
    this.refreshClicked.emit();
  }

  getTimeSinceUpdate(): string {
    if (!this.lastUpdated) return '';
    const diff = Math.round((Date.now() - this.lastUpdated.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  private emitFilters() {
    const dateFrom = this.dateFrom ? new Date(this.dateFrom.year, this.dateFrom.month - 1, this.dateFrom.day) : null;
    const dateTo = this.dateTo ? new Date(this.dateTo.year, this.dateTo.month - 1, this.dateTo.day, 23, 59, 59) : null;
    this.filtersChanged.emit({
      dateFrom,
      dateTo,
      salespersonId: this.selectedSalespersonId
    });
  }
}
