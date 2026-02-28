import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';

import { ReportService, ReportCard } from '../../../shared/services/report.service';
import { ReportCardListComponent } from '../../../shared/components/general-reports/report-card-list/report-card-list.component';
import { ReportParameterFormComponent } from '../../../shared/components/general-reports/report-parameter-form/report-parameter-form.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-management-reports',
  standalone: true,
  imports: [CommonModule, ReportCardListComponent, ReportParameterFormComponent],
  templateUrl: './management-reports.component.html',
  styleUrls: ['./management-reports.component.scss']
})
export class ManagementReportsComponent implements OnInit {
  reports: ReportCard[] = [];
  selectedReport: ReportCard | null = null;
  reportParameters: any = {};

  loadingReports = false;
  generatingReport = false;

  currentCompany: any;
  companyId = 1;

  constructor(
    private reportService: ReportService,
    private appSettingService: AppSettingsService
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    if (this.currentCompany) {
      this.companyId = this.currentCompany?.CompanyMasterSid;
    }
    this.loadAvailableReports();
  }

  loadAvailableReports(): void {
    this.loadingReports = true;
    this.reportService.getManagementReports(this.companyId)
      .pipe(finalize(() => (this.loadingReports = false)))
      .subscribe({
        next: (reports) => {
          const normalized = (reports || []).map((rp) => ({
            ...rp,
            ReportFormat: String(rp.ReportFormat)?.trim().toUpperCase(),
            ReportType: String(rp.ReportType || '').trim().toUpperCase()
          }));

          this.reports = normalized.filter((report) => report.ReportType === 'MANAGEMENT');
        },
        error: (error) => {
          console.error('Error loading management reports:', error);
          this.appSettingService.showError('Failed to load reports. Please try again.');
        }
      });
  }

  onReportSelected(report: ReportCard): void {
    if (this.selectedReport?.ReportMasterSid === report.ReportMasterSid) {
      this.selectedReport = null;
      this.reportParameters = {};
    } else {
      this.selectedReport = report;
      this.reportParameters = {};
    }
  }

  onGenerateReport(parameters: any): void {
    if (!this.selectedReport) {
      return;
    }

    this.reportParameters = {
      ...parameters,
      companyId: this.companyId
    };

    if (this.selectedReport.ReportName) {
      this.reportService.openReportModal(
        this.selectedReport,
        undefined,
        this.reportParameters
      );
    } else {
      this.appSettingService.showError('Invalid Report Name.');
    }
  }
}
