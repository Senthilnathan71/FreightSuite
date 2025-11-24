import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportCard } from '../../../services/report.service';

@Component({
  selector: 'app-report-card-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-card-list.component.html',
  styleUrls: ['./report-card-list.component.scss']
})
export class ReportCardListComponent {
  @Input() reports: ReportCard[] = [];
  @Input() loading: boolean = false;
  @Output() reportSelected = new EventEmitter<ReportCard>();

  onSelectReport(report: ReportCard): void {
    this.reportSelected.emit(report);
  }

  getReportIcon(reportType: string): string {
    switch (reportType) {
      case 'ACCOUNTS':
        return 'mdi mdi-currency-usd';
      case 'OPERATION':
        return 'mdi mdi-truck-delivery';
      default:
        return 'mdi mdi-file-chart';
    }
  }

  getFormatBadgeClass(format: string): string {
    switch (format) {
      case 'EXCEL':
        return 'badge-success';
      case 'PDF':
        return 'badge-danger';
      case 'BOTH':
        return 'badge-primary';
      default:
        return 'badge-secondary';
    }
  }
}
