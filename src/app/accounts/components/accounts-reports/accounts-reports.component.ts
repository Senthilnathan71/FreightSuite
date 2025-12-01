import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs/operators';

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
import { AgeingReportComponent } from 'src/app/shared/components/reports/ageing-report/ageing-report.component';

@Component({
  selector: 'app-accounts-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReportCardListComponent,
    ReportParameterFormComponent,
    ReportViewerComponent,
    ReportExportActionsComponent
  ],
  templateUrl: './accounts-reports.component.html',
  styleUrls: ['./accounts-reports.component.scss']
})
export class AccountsReportsComponent implements OnInit {
  // State management
  reports: ReportCard[] = [];
  selectedReport: ReportCard | null = null;
  reportData: any[] = [];
  reportParameters: any = {};

  // Loading states
  loadingReports = false;
  generatingReport = false;
  exportingReport = false;

  // Company ID (should come from auth service or session)
  currentCompany : any;
  companyId = 1; // TODO: Get from auth service

  constructor(
    private reportService: ReportService,
    private exportService: ReportExportService,
    private modalService: NgbModal,
    private appSettingService: AppSettingsService
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    if(this.currentCompany){
      this.companyId = this.currentCompany?.CompanyMasterSid;
    }
    this.loadAvailableReports();
  }

  /**
   * Load all available Accounts reports for the current company
   */
  loadAvailableReports(): void {
    this.loadingReports = true;
    console.log("Current Company ID:", this.companyId);
    this.reportService.getAccountsReports(this.companyId)
      .pipe(finalize(() => this.loadingReports = false))
      .subscribe({
        next: (reports) => {
          this.reports = reports;
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
  // onGenerateReport(parameters: any): void {
  //   if (!this.selectedReport) {
  //     return;
  //   }

  //   // Store parameters for export/email operations
  //   this.reportParameters = {
  //     ...parameters,
  //     companyId: this.companyId
  //   };
  //   console.log(this.reportParameters);
  //   this.generatingReport = true;
  //   this.reportService.generateReport('accounts', this.selectedReport.ReportName, this.reportParameters)
  //     .pipe(finalize(() => this.generatingReport = false))
  //     .subscribe({
  //       next: (response: ReportGenerateResponse) => {
  //         if (response.success && response.data) {
  //           this.reportData = response.data;
  //           if (response.data.length === 0) {
  //             alert('No data found for the selected parameters.');
  //           }
  //         } else {
  //           alert('Failed to generate report. Please try again.');
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error generating report:', error);
  //         const errorMessage = error.error?.message || 'Failed to generate report. Please try again.';
  //         alert(errorMessage);
  //       }
  //     });
  // }

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

    if (this.selectedReport.ReportName === 'ageing-report') {
      this.reportService.openReportModal(
        'ageing-report',
        undefined,
        this.reportParameters,
      );
    } else {
      this.appSettingService.showError('Invalid Report Name.');
    }
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
    this.reportService.exportReport('accounts', this.selectedReport.ReportName, exportParams)
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

    this.reportService.emailReport('accounts', this.selectedReport.ReportName, emailParams)
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
