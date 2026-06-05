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
      { key: 'total', label: 'MTD Total' },
    ];

    const rows: ExcelRow[] = (this.fullData?.data || []).map((item) => {
      const cells: ExcelCell[] = [
        { value: item.job || '' },
        { value: item.dateCount || 0 },
        { value: item.total || 0 },
      ];

      return { cells, style: 'data' };
    });

    const customerHeaders: ExcelHeader[] = [
      { key: 'customerName', label: 'Customer' },
      { key: 'jobsOpenedCount', label: 'Jobs Opened' },
      { key: 'm3Booked', label: 'M3 Booked' },
      { key: 'importCount', label: 'Import' },
      { key: 'exportCount', label: 'Export' },
      { key: 'transhipmentCount', label: 'Transhipment' },
      { key: 'nominatedCount', label: 'Nominated' },
      { key: 'lclCount', label: 'LCL' },
      { key: 'fclCount', label: 'FCL' },
      { key: 'airCount', label: 'Air' },
      { key: 'total', label: 'Total' },
    ];

    const customerRows: ExcelRow[] = (this.customerData || []).map((item) => {
      const cells: ExcelCell[] = [
        { value: item.customerName || '' },
        { value: item.jobsOpenedCount || 0 },
        { value: this.formatNumber(item.m3Booked) || 0 },
        { value: item.importCount || 0 },
        { value: item.exportCount || 0 },
        { value: item.transhipmentCount || 0 },
        { value: item.nominatedCount || 0 },
        { value: item.lclCount || 0 },
        { value: item.fclCount || 0 },
        { value: item.airCount || 0 },
        { value: item.total || 0 },
      ];

      return { cells, style: 'data' };
    });

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

      additionalTables: [
        {
          title: 'Customer Wise Job Count',
          headers: customerHeaders.map((header) => header.label),
          rows: customerRows,
          columnWidths: [35, 14, 14, 12, 12, 18, 14, 10, 10, 10, 12],
        },
      ],

      columnWidths: [30, 15, 15],
    };
  }

  private formatNumber(value: any): string {
    if (value === null || value === undefined) return '';

    const num = Number(value);
    if (isNaN(num)) return '';

    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
