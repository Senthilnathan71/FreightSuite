import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';

@Component({
  selector: 'app-bl-issue-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './bl-issue-report.component.html',
  styles: ``
})
export class BlIssueReportComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('bl-issue-list').pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get params(): any {
    return this.data?.params || {};
  }

  get bucketLabels(): any {
    return this.fullData?.bucketLabels || [];
  }


  getExcelData(): ComplexReportExportConfig {
  const tableHeaders: ExcelHeader[] = [
    { key: 'HBLNo', label: 'HBL No' },
    { key: 'HBLDate', label: 'HBL Date' },
    { key: 'MBLNo', label: 'MBL No' },
    { key: 'BookingNo', label: 'Booking No' },
    { key: 'Shipper', label: 'Shipper' },
    { key: 'Consignee', label: 'Consignee' },
    { key: 'POL', label: 'POL' },
    { key: 'POD', label: 'POD' },
    { key: 'jobStatus', label: 'Job Status' }
  ];

  const rows: ExcelRow[] = (this.fullData?.data || []).map(item => {
    const cells: ExcelCell[] = [
      { value: item.HBLNo || '' },
      { value: this.formatDate(item.HBLDate) },
      { value: item.MBLNo || '' },
      { value: item.BookingNo || '' },
      { value: item.Shipper || '' },
      { value: item.Consignee || '' },
      { value: item.POL || '' },
      { value: item.POD || '' },
      { value: item.jobStatus || '' }
    ];
    return { cells, style: 'data' };
  });

  return {
    fileName: 'BL-Issue-Report',
    sheetName: 'BLIssueReport',
    reportHeader: {
      companyName: this.currentCompany?.companyName || 'Company',
      reportTitle: `${this.params?.BLIssue ? 'BL Issue List' : 'BL Not Issue List'}`,
      additionalInfo: [
        { label: 'Branch', value: this.fullData?.branchInvolved || '' },
        { label: 'Dept', value: this.fullData?.departmentNames || '' },
        { label: 'From Date', value: this.formatDate(this.params?.FromHblDt) },
        { label: 'To Date', value: this.formatDate(this.params?.ToHblDt) }
      ]
    },
    tableHeaders,
    rows,
    columnWidths: [15, 15, 15, 15, 25, 25, 15, 15, 15] // adjust widths as needed
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
