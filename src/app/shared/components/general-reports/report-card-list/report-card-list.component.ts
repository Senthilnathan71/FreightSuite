import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ReportCard } from '../../../services/report.service';

const SPINNER_NAME = 'report-card-spinner';

@Component({
  selector: 'app-report-card-list',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, DragDropModule],
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
  orderedReports: ReportCard[] = [];
  draftReports: ReportCard[] = [];
  reorderPanelOpen = false;

  constructor(private spinner: NgxSpinnerService) {}

  ngOnInit(): void {
    this.syncSpinner();
  }

  ngOnChanges(_: SimpleChanges): void {
    this.syncSpinner();
    this.orderedReports = this.applySavedOrder(this.reports || []);
    if (this.reorderPanelOpen) {
      this.draftReports = [...this.orderedReports];
    }
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

  openReorderPanel(): void {
    this.draftReports = [...this.orderedReports];
    this.reorderPanelOpen = true;
  }

  closeReorderPanel(): void {
    this.reorderPanelOpen = false;
  }

  onReportDrop(event: CdkDragDrop<ReportCard[]>): void {
    moveItemInArray(this.draftReports, event.previousIndex, event.currentIndex);
  }

  saveReportOrder(): void {
    this.orderedReports = [...this.draftReports];
    localStorage.setItem(this.orderStorageKey, JSON.stringify(this.orderedReports.map(report => report.ReportMasterSid)));
    this.reorderPanelOpen = false;
  }

  resetReportOrder(): void {
    localStorage.removeItem(this.orderStorageKey);
    this.orderedReports = [...(this.reports || [])];
    this.draftReports = [...this.orderedReports];
  }

  trackByReportSid(_: number, report: ReportCard): number {
    return report.ReportMasterSid;
  }

  private get orderStorageKey(): string {
    const reportType = this.reports?.[0]?.ReportType || 'REPORTS';
    return `report-card-order:${reportType}`;
  }

  private applySavedOrder(reports: ReportCard[]): ReportCard[] {
    const savedOrder = this.getSavedOrder();
    if (!savedOrder.length) {
      return [...reports];
    }

    const orderMap = new Map(savedOrder.map((sid, index) => [sid, index]));
    return [...reports].sort((a, b) => {
      const aOrder = orderMap.get(a.ReportMasterSid);
      const bOrder = orderMap.get(b.ReportMasterSid);

      if (aOrder === undefined && bOrder === undefined) return 0;
      if (aOrder === undefined) return 1;
      if (bOrder === undefined) return -1;
      return aOrder - bOrder;
    });
  }

  private getSavedOrder(): number[] {
    try {
      const rawOrder = localStorage.getItem(this.orderStorageKey);
      const parsedOrder = rawOrder ? JSON.parse(rawOrder) : [];
      return Array.isArray(parsedOrder) ? parsedOrder.map(Number).filter(Boolean) : [];
    } catch {
      return [];
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
