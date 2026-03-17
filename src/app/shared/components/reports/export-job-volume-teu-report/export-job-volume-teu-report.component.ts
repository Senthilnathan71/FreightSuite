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
  selector: 'app-export-job-volume-teu-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './export-job-volume-teu-report.component.html',
  styles: ``
})
export class ExportJobVolumeTeuReportComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('Export Job Volume and TEU Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('export-job-volume-teu-report').pdfOrientation;
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
    { key: 'dept', label: 'Department' },
    { key: 'jobNo', label: 'Job No' },
    { key: 'movementType', label: 'Mode of Transport' },
    { key: 'MBLDate', label: 'Job Date' },
    { key: 'ETD', label: 'ETD' },
    { key: 'deliveyAgent', label: 'Delivery Agent' },
    { key: 'carrier', label: 'Carrier' },
    { key: 'portOfloading', label: 'Port of Loading' },
    { key: 'portOfdischarge', label: 'Port of Discharge' },
    { key: 'portOfDestination', label: 'Port of Destination' },
    { key: 'TEUCount', label: 'No of TEU' },
    { key: 'weight', label: 'Gross Weight' },
    { key: 'chargebaleWt', label: 'Chargeable Wt' }
  ];

  const rows: ExcelRow[] = (this.fullData?.data || []).map(item => {
    const cells: ExcelCell[] = [
      { value: item.dept || '' },
      { value: item.jobNo || '' },
      { value: item.movementType || '' },
      { value: this.formatDate(item.MBLDate) },
      { value: this.formatDate(item.ETD) },
      { value: item.deliveyAgent || '' },
      { value: item.carrier || '' },
      { value: item.portOfloading || '' },
      { value: item.portOfdischarge || '' },
      { value: item.portOfDestination || '' },
      { value: item.TEUCount ?? 0 },
      { value: this.formatNumber(item.weight ?? 0) },
      { value: this.formatNumber(item.chargebaleWt ?? 0) }
    ];

    return { cells, style: 'data' };
  });

  return {
    fileName: 'Export-Job-Volume-TEU-Report',
    sheetName: 'ExportJobVolumeTEU',
    reportHeader: {
      companyName: this.currentCompany?.companyName || '',
      reportTitle: `Export Job Volume and TEU Report`,
      additionalInfo: [
        { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
        { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
        { label: 'Branch', value: this.fullData?.branchesInvolved || '' },
        { label: 'Dept', value: this.fullData?.departmentInvoled || '' }
      ]
    },
    tableHeaders,
    rows,
    columnWidths: [
      18, // Department
      15, // Job No
      18, // Mode of Transport
      15, // Job Date
      15, // ETD
      25, // Delivery Agent
      20, // Carrier
      18, // POL
      18, // POD
      22, // PODestination
      12, // TEU
      15, // Weight
      18  // Chargeable Wt
    ]
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

 private formatNumber(value: any): string {
  if (value === null || value === undefined) return '';

  const num = Number(value);
  if (isNaN(num)) return '';

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
}
