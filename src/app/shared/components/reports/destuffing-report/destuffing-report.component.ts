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
  selector: 'app-destuffing-report',
  standalone: true,
  imports: [
    CustomDatePipe,
    CommonModule,
    PrintHeaderComponent,
    PrintFooterComponent,
  ],
  templateUrl: './destuffing-report.component.html',
  styles: ``,
})
export class DestuffingReportComponent {
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
      this.reportRegistryService.getReportConfig('destuffing').pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get params(): any {
    return this.data?.params || {};
  }

  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'HBLDate', label: 'Received Pre-Alert' },
      { key: 'HBLNo', label: 'HBL No' },
      { key: 'OriginAgent', label: 'Origin Agent' },
      { key: 'containerNoList', label: 'Container No' },
      { key: 'ETA', label: 'ETA' },
      { key: 'containerTypeList', label: 'Container Size' },
      { key: 'VesselVoyage', label: 'Vessel / Voyage' },
      { key: 'CFS', label: 'Place of destuff' },
      { key: 'Remarks', label: 'Remarks' },
      { key: 'ATA', label: 'Time of discharge for the vessel' },
      { key: 'ATD', label: 'Time Pulled out the container' },
    ];

    const rows: ExcelRow[] = (this.fullData?.data || []).map((item) => {
      const cells: ExcelCell[] = [
        {
          value: this.formatDate(item.HBLDate),
          alignment: { horizontal: 'center' },
        },
        { value: item.HBLNo || '', alignment: { horizontal: 'left' } },
        { value: item.OriginAgent || '' },
        { value: item.containerNoList || '' },
        { value: this.formatDate(item.ETA) },
        { value: item.containerTypeList || '' },
        {
          value: `${item.VesselName || ''}${item.VoyageNo ? ' / ' + item.VoyageNo : ''}`,
        },
        { value: item.CFS || '' },
        { value: item.Remarks || '' },
        { value: this.formatDate(item.ATA) },
        { value: this.formatDate(item.ATD) },
      ];

      return { cells, style: 'data' };
    });

    return {
      fileName: 'Destuffing-Report',
      sheetName: 'DestuffingReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: 'Destuffing Report',
        additionalInfo: [
          {
            label: 'HBL From Date',
            value: this.formatDate(this.params?.FromHblDate),
          },
          {
            label: 'HBL To Date',
            value: this.formatDate(this.params?.ToHblDate),
          },
        ],
      },
      tableHeaders,
      rows,
      columnWidths: [20, 18, 25, 25, 15, 18, 25, 25, 25, 25, 25],
    };
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
