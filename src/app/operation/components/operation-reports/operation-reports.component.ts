import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { combineLatest, Subject } from 'rxjs';
import { filter, finalize, take, takeUntil } from 'rxjs/operators';

// Services
import { ReportService, ReportCard, ReportGenerateResponse, ExportReportParams } from '../../../shared/services/report.service';
import { ReportExportService, ExportFormat } from '../../../shared/services/report-export.service';

// Shared Components
import { ReportCardListComponent } from '../../../shared/components/general-reports/report-card-list/report-card-list.component';
import { ReportParameterFormComponent } from '../../../shared/components/general-reports/report-parameter-form/report-parameter-form.component';
import { ReportViewerComponent } from '../../../shared/components/general-reports/report-viewer/report-viewer.component';
import { ReportExportActionsComponent } from '../../../shared/components/general-reports/report-export-actions/report-export-actions.component';
import { ReportEmailDialogComponent, EmailReportData } from '../../../shared/components/general-reports/report-email-dialog/report-email-dialog.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { ReportViewModeService } from '../../../shared/services/report-view-mode.service';
import { ReportViewMode, isColumnCustomizableReport } from '../../../shared/components/reports/generic-table-report/report-column-config';

@Component({
  selector: 'app-operation-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReportCardListComponent,
    ReportParameterFormComponent,
    ReportViewerComponent,
    ReportExportActionsComponent
  ],
  templateUrl: './operation-reports.component.html',
  styleUrls: ['./operation-reports.component.scss']
})
export class OperationReportsComponent implements OnInit, OnDestroy {
  // State management
  reports: ReportCard[] = [];
  selectedReport: ReportCard | null = null;
  reportData: any[] = [];
  reportParameters: any = {};

  // Loading states
  loadingReports = false;
  generatingReport = false;
  exportingReport = false;

  // null = permissions not yet loaded (all cards disabled)
  allowedReportSids: Set<number> | null = null;

  currentCompany : any;
  companyId = 1;

  /** Effective report view mode (New column-customizable view vs Classic). */
  viewMode: ReportViewMode = 'CLASSIC';

  private destroy$ = new Subject<void>();

  constructor(
    private reportService: ReportService,
    private exportService: ReportExportService,
    private modalService: NgbModal,
    private appSettingService: AppSettingsService,
    private mps: MenuPermissionService,
    private reportViewModeService: ReportViewModeService
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    if (this.currentCompany) {
      this.companyId = this.currentCompany?.CompanyMasterSid;
    }
    this.mps.init().subscribe();
    combineLatest([this.mps.loaded$, this.mps.reportPermissions$])
      .pipe(filter(([loaded]) => loaded), take(1), takeUntil(this.destroy$))
      .subscribe(([, perms]) => {
        this.allowedReportSids = new Set(perms.map(p => p.ReportMasterSid));
      });
    // Apply any saved user override immediately; otherwise fall back to the company
    // default once it resolves — but never let that async value clobber a choice the
    // user makes during the request window (root cause of "first open is always Classic").
    const override = this.reportViewModeService.getUserOverride();
    if (override) {
      this.viewMode = override;
    } else {
      this.reportViewModeService.getCompanyDefault(this.companyId)
        .pipe(take(1), takeUntil(this.destroy$))
        .subscribe((mode) => {
          if (!this.reportViewModeService.getUserOverride()) this.viewMode = mode;
        });
    }
    this.loadAvailableReports();
  }

  /** True when the selected report supports the customizable (New) view. */
  get canCustomizeColumns(): boolean {
    return isColumnCustomizableReport(this.selectedReport?.ReportName);
  }

  /** Switch the report view between New and Classic (per-user override, remembered in this browser). */
  setViewMode(mode: ReportViewMode): void {
    this.viewMode = mode;
    this.reportViewModeService.setUserOverride(mode);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all available Operation reports for the current company
   */
  loadAvailableReports(): void {
    this.loadingReports = true;
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const payload = {
      CompanyMasterSid
    }
    this.reportService.getOperationReports(payload)
      .pipe(finalize(() => this.loadingReports = false))
      .subscribe({
        next: (reports) => {
          this.reports = (reports || []).map((rp) => ({...rp,ReportFormat : String(rp.ReportFormat)?.trim().toUpperCase()}));
        },
        error: (error) => {
          console.error('Error loading reports:', error);
          alert('Failed to load reports. Please try again.');
        }
      });
  }

  /**
   * Handle report card selection
   */
  onReportSelected(report: ReportCard): void {
    if (this.selectedReport?.ReportMasterSid === report.ReportMasterSid) {
      // Clicking the same report again - collapse it
      this.selectedReport = null;
      this.reportData = [];
      this.reportParameters = {};
    } else {
      // Select new report
      this.selectedReport = report;
      this.reportData = [];
      this.reportParameters = {};
    }
  }

  /**
   * Handle parameter form submission
   */
/**
 * Handle parameter form submission
 */
onGenerateReport(parameters: any): void {
  if (!this.selectedReport) {
    return;
  }

  // Store parameters for export/email operations
  this.reportParameters = {
    ...parameters,
    companyId: this.companyId
  };

  console.log('Opening report with payload:', this.reportParameters);

  if (this.selectedReport.ReportName) {
    const columnView = this.viewMode === 'NEW' && isColumnCustomizableReport(this.selectedReport.ReportName);
    this.reportService.openReportModal(
      this.selectedReport,
      undefined,
      this.reportParameters,
      { columnView },
    );
  } else {
    this.appSettingService.showError('Invalid Report Name.');
  }
}


// Utility function to handle alerts
private handleAlert(message: string): void {
  alert(message);
}

  /**
   * Handle export action
   */
  onExportReport(format: ExportFormat): void {
    if (!this.selectedReport || !this.reportData || this.reportData.length === 0) {
      alert('No data to export. Please generate the report first.');
      return;
    }

    const exportParams: ExportReportParams = {
      format,
      parameters: this.reportParameters,
      reportDisplayName: this.selectedReport.ReportDisplayName
    };

    this.exportingReport = true;
    this.reportService.exportReport('operation', this.selectedReport.ReportName, exportParams)
      .pipe(finalize(() => this.exportingReport = false))
      .subscribe({
        next: (blob: Blob) => {
          const filename = this.exportService.generateFilename(
            this.selectedReport!.ReportDisplayName,
            format
          );
          this.exportService.downloadFile(blob, filename.replace(`.${this.getExtension(format)}`, ''), format);
        },
        error: (error) => {
          console.error('Error exporting report:', error);
          alert('Failed to export report. Please try again.');
        }
      });
  }

  /**
   * Handle email action
   */
  onEmailReport(): void {
    if (!this.selectedReport || !this.reportData || this.reportData.length === 0) {
      alert('No data to email. Please generate the report first.');
      return;
    }

    const modalRef = this.modalService.open(ReportEmailDialogComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.reportName = this.selectedReport.ReportDisplayName;
    modalRef.componentInstance.defaultSubject = `${this.selectedReport.ReportDisplayName} - ${new Date().toLocaleDateString()}`;

    modalRef.componentInstance.onSend.subscribe((emailData: EmailReportData) => {
      this.sendEmail(emailData, modalRef);
    });
  }

  /**
   * Send email with report
   */
  private sendEmail(emailData: EmailReportData, modalRef: any): void {
    if (!this.selectedReport) {
      return;
    }

    const emailParams = {
      ...emailData,
      parameters: this.reportParameters
    };

    this.reportService.emailReport('operation', this.selectedReport.ReportName, emailParams)
      .subscribe({
        next: (response) => {
          if (response.success) {
            alert('Report sent successfully!');
            modalRef.close();
          } else {
            alert('Failed to send email. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error sending email:', error);
          alert('Failed to send email. Please try again.');
        }
      });
  }

  /**
   * Handle print action
   */
  onPrintReport(): void {
    if (!this.selectedReport || !this.reportData || this.reportData.length === 0) {
      alert('No data to print. Please generate the report first.');
      return;
    }

    this.exportService.printReport(this.reportData, this.selectedReport.ReportDisplayName);
  }

  /**
   * Get file extension for format
   */
  private getExtension(format: ExportFormat): string {
    switch (format) {
      case 'EXCEL': return 'xlsx';
      case 'PDF': return 'pdf';
      case 'CSV': return 'csv';
      default: return 'xlsx';
    }
  }

  /**
   * Check if report has been generated
   */
  hasReportData(): boolean {
    return this.reportData && this.reportData.length > 0;
  }

  get selectedReportNotes(): string {
    return this.selectedReport?.Notes?.trim() || '';
  }


  /**
   * Get available export formats for selected report
   */
  getAvailableFormats(): { excel: boolean; pdf: boolean; csv: boolean } {
    if (!this.selectedReport) {
      return { excel: false, pdf: false, csv: false };
    }

    const format = this.selectedReport.ReportFormat;
    return {
      excel: format === 'EXCEL' || format === 'BOTH',
      pdf: format === 'PDF' || format === 'BOTH',
      csv: format === 'BOTH' // CSV typically available when BOTH is selected
    };
  }
}
