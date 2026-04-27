import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScoreboardRow } from '../../../interfaces/sales-manager-dashboard.interfaces';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-sm-scoreboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sm-scoreboard.component.html',
  styleUrls: ['./sm-scoreboard.component.scss']
})
export class SmScoreboardComponent {
  @Input() rows: ScoreboardRow[] = [];
  @Input() loading = false;
  @Output() rowClicked = new EventEmitter<ScoreboardRow>();
  @Output() remindClicked = new EventEmitter<ScoreboardRow>();

  sortField = 'total';
  sortDir: 'asc' | 'desc' = 'desc';

  get sortedRows(): ScoreboardRow[] {
    return [...this.rows].sort((a, b) => {
      const av = (a as any)[this.sortField] ?? 0;
      const bv = (b as any)[this.sortField] ?? 0;
      return this.sortDir === 'asc' ? av - bv : bv - av;
    });
  }

  get teamTotal(): { s1: number; s2: number; s3: number; s4: number; s5: number; s6: number; s7: number; s8: number; total: number } {
    const t = { s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, s6: 0, s7: 0, s8: 0, total: 0 };
    for (const r of this.rows) {
      t.s1 += r.s1; t.s2 += r.s2; t.s3 += r.s3; t.s4 += r.s4;
      t.s5 += r.s5; t.s6 += r.s6; t.s7 += r.s7; t.s8 += r.s8;
      t.total += r.total;
    }
    return t;
  }

  sort(field: string) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'desc';
    }
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'fas fa-sort';
    return this.sortDir === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  getInitials(name: string): string {
    return name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '';
  }

  getCellClass(value: number): string {
    if (value === 0) return 'zero';
    if (value <= 3) return 'low';
    if (value <= 8) return 'medium';
    return 'high';
  }

  getConversionRate(row: ScoreboardRow): number {
    const total = row.s1 + row.s4;
    if (total === 0) return 0;
    return Math.round((row.s4 / (row.s1 + row.s4 + row.s5)) * 100) || 0;
  }

  getConvRateClass(rate: number): string {
    if (rate >= 30) return 'good';
    if (rate >= 15) return 'okay';
    return 'bad';
  }

  onRowClick(row: ScoreboardRow) {
    this.rowClicked.emit(row);
  }

  onRemind(event: Event, row: ScoreboardRow) {
    event.stopPropagation();
    this.remindClicked.emit(row);
  }

  downloadExcel() {
    if (!this.rows.length) return;
    const data = this.sortedRows.map(r => ({
      'Salesperson': r.userName,
      'Email': r.userEmail,
      'S1 - Leads No Mtg': r.s1,
      'S2 - Meetings Sched.': r.s2,
      'S3 - Follow-Ups': r.s3,
      'S4 - Not Converted': r.s4,
      'S5 - Cust. No Quote': r.s5,
      'S6 - Enq. No Quotation': r.s6,
      'S7 - Pending Approval': r.s7,
      'S8 - Appr. No Booking': r.s8,
      'Conv. Rate': `${this.getConversionRate(r)}%`,
      'Total': r.total,
    }));

    const t = this.teamTotal;
    data.push({
      'Salesperson': 'TEAM TOTAL',
      'Email': `${this.rows.length} salespersons`,
      'S1 - Leads No Mtg': t.s1,
      'S2 - Meetings Sched.': t.s2,
      'S3 - Follow-Ups': t.s3,
      'S4 - Not Converted': t.s4,
      'S5 - Cust. No Quote': t.s5,
      'S6 - Enq. No Quotation': t.s6,
      'S7 - Pending Approval': t.s7,
      'S8 - Appr. No Booking': t.s8,
      'Conv. Rate': '',
      'Total': t.total,
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scoreboard');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    FileSaver.saveAs(blob, `Scoreboard-${new Date().getTime()}.xlsx`);
  }
}
