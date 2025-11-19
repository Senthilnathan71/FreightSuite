import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ExportFormat = 'EXCEL' | 'PDF' | 'CSV';

@Component({
  selector: 'app-report-export-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-export-actions.component.html',
  styleUrls: ['./report-export-actions.component.scss']
})
export class ReportExportActionsComponent {
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() showExcel: boolean = true;
  @Input() showPdf: boolean = true;
  @Input() showCsv: boolean = true;
  @Input() showEmail: boolean = true;
  @Input() showPrint: boolean = true;

  @Output() onExport = new EventEmitter<ExportFormat>();
  @Output() onEmail = new EventEmitter<void>();
  @Output() onPrint = new EventEmitter<void>();

  exportingFormat: ExportFormat | null = null;

  exportToExcel(): void {
    if (!this.disabled && !this.loading) {
      this.exportingFormat = 'EXCEL';
      this.onExport.emit('EXCEL');
      setTimeout(() => this.exportingFormat = null, 2000);
    }
  }

  exportToPdf(): void {
    if (!this.disabled && !this.loading) {
      this.exportingFormat = 'PDF';
      this.onExport.emit('PDF');
      setTimeout(() => this.exportingFormat = null, 2000);
    }
  }

  exportToCsv(): void {
    if (!this.disabled && !this.loading) {
      this.exportingFormat = 'CSV';
      this.onExport.emit('CSV');
      setTimeout(() => this.exportingFormat = null, 2000);
    }
  }

  emailReport(): void {
    if (!this.disabled && !this.loading) {
      this.onEmail.emit();
    }
  }

  printReport(): void {
    if (!this.disabled && !this.loading) {
      this.onPrint.emit();
    }
  }

  isExporting(format: ExportFormat): boolean {
    return this.exportingFormat === format;
  }
}
