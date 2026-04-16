import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ReportCard } from '../../../services/report.service';

const SPINNER_NAME = 'report-card-spinner';

@Component({
  selector: 'app-report-card-list',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],
  templateUrl: './report-card-list.component.html',
  styleUrls: ['./report-card-list.component.scss']
})
export class ReportCardListComponent implements OnInit, OnChanges {
  @Input() reports: ReportCard[] = [];
  @Input() loading: boolean = false;
  /** null = permissions not yet loaded (all cards disabled); Set = loaded (enable matching SIDs) */
  @Input() allowedReportSids: Set<number> | null = null;
  @Output() reportSelected = new EventEmitter<ReportCard>();

  readonly spinnerName = SPINNER_NAME;

  constructor(private spinner: NgxSpinnerService) {}

  ngOnInit(): void {
    this.syncSpinner();
  }

  ngOnChanges(_: SimpleChanges): void {
    this.syncSpinner();
  }

  get isLoading(): boolean {
    return this.loading || this.allowedReportSids === null;
  }

  private syncSpinner(): void {
    if (this.isLoading) {
      this.spinner.show(SPINNER_NAME);
    } else {
      this.spinner.hide(SPINNER_NAME);
    }
  }

  isReportEnabled(report: ReportCard): boolean {
    if (this.allowedReportSids === null) return false;
    return this.allowedReportSids.has(report.ReportMasterSid);
  }

  isReportRestricted(report: ReportCard): boolean {
    return this.allowedReportSids !== null && !this.allowedReportSids.has(report.ReportMasterSid);
  }

  onSelectReport(report: ReportCard): void {
    if (!this.isReportEnabled(report)) return;
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
