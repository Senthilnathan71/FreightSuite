import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import {
  ComplexReportExportConfig,
  ExcelCell,
  ExcelHeader,
  ExcelRow,
} from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';

@Component({
  selector: 'app-daily-job-register',
  standalone: true,
  imports: [
    CustomDatePipe,
    CommonModule,
    PrintHeaderComponent,
    PrintFooterComponent,
  ],
  templateUrl: './daily-job-register.component.html',
  styles: ``,
})
export class DailyJobRegisterComponent {
  currentCompany: any;
  currentBranch: any;
  selectedData: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService,
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    this.orientation =
      this.reportRegistryService.getReportConfig(
        'daily-job-register',
      ).pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get params(): any {
    return this.data?.params || {};
  }

  get customerData(): any[] {
    const rows = Array.isArray(this.fullData?.customerData)
      ? this.fullData.customerData
      : [];

    return rows.filter(
      (item) =>
        Number(item?.jobsOpenedCount || 0) > 0 ||
        Number(item?.m3Booked || 0) > 0 ||
        Number(item?.importCount || 0) > 0 ||
        Number(item?.exportCount || 0) > 0 ||
        Number(item?.transhipmentCount || 0) > 0 ||
        Number(item?.nominatedCount || 0) > 0 ||
        Number(item?.lclCount || 0) > 0 ||
        Number(item?.fclCount || 0) > 0 ||
        Number(item?.airCount || 0) > 0 ||
        Number(item?.total || 0) > 0,
    );
  }

  getExcelData(): ComplexReportExportConfig {
    const dateLabel =
      this.fullData?.dateLabel || this.formatDate(this.params?.ToDate);

    const tableHeaders: ExcelHeader[] = [
      { key: 'job', label: 'Job' },
      { key: 'dateCount', label: dateLabel },
      { key: 'total', label: 'Total' },
    ];

    const rows: ExcelRow[] = (this.fullData?.data || []).map((item) => {
      const cells: ExcelCell[] = [
        { value: item.job || '' },
        { value: item.dateCount || 0 },
        { value: item.total || 0 },
      ];

      return { cells, style: 'data' };
    });

    // const additionalTables: ComplexReportExportConfig['additionalTables'] = [];

    // additionalTables.push({
    //   title: 'Note :',
    //   headers: ['Description'],
    //   rows: this.getReportNotes().map((note) => ({
    //     cells: [{ value: note }],
    //     style: 'data',
    //   })),
    //   columnWidths: [120],
    // });

    return {
      fileName: 'DailyJobRegisterReport',
      sheetName: 'DailyJobRegisterReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || '',
        reportTitle: 'Daily Job Register Report',
        additionalInfo: [
          {
            label: 'To Date',
            value: dateLabel,
          },
        ],
      },

      tableHeaders,
      rows,

      // additionalTables,

      columnWidths: [30, 15, 15],
    };
  }

  private getReportNotes(): string[] {
    return [
      'Jobs Opened - Total count of filtered Master Job records.',
      'M3 Booked - Sum of the Volume value from Master Jobs.',
      'Import Jobs - Count of jobs where Department Export/Import type is Import.',
      'Export Jobs - Count of jobs where Department Export/Import type is Export.',
      'Transhipment Jobs - Count of jobs where a Transhipment Port is assigned.',
      'Nominated Jobs - Count of jobs where a Destination Agent is assigned.',
      'LCL Jobs - Count of jobs where Department is LCL.',
      'FCL Jobs - Count of jobs where Department is FCL.',
      'Air Jobs - Count of jobs where Department is Air.',
      'Employee-wise Jobs - Shows the number of Master Jobs created by each employee.',
      'Date Count - Displays the count/value for the selected date only.',
      'Total - Displays the cumulative count/value from the beginning of the month up to the selected date.',
    ];
  }

  private formatDate(date: any): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch {
      return String(date);
    }
  }
}
