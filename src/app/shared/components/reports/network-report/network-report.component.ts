import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';
@Component({
  selector: 'app-network-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent,PrintFooterComponent],
  templateUrl: './network-report.component.html',
  styles: ``
})
export class NetworkReportComponent {
  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('Network Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('network-report').pdfOrientation;
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
    { key: 'customerName', label: 'Customer' },
    { key: 'network', label: 'Network' },
    { key: 'departmentName', label: 'Department' },
    { key: 'BookingNo', label: 'Booking No' },
    { key: 'HouseNo', label: 'House Job No' },
    { key: 'masterJobNo', label: 'Master Job No' },
    { key: 'HblNo', label: 'HBL No' },
    { key: 'MBLNo', label: 'MBL No' },
    { key: 'totalRevenue', label: 'Revenue' },
    { key: 'totalCost', label: 'Cost' },
    { key: 'profit', label: 'Profit' },
    { key: 'profit %', label: 'Profit %' },
    { key: 'nominationBy', label: 'Nomination' },
    { key: 'originAgent', label: 'Origin Agent' },
    { key: 'originNetwork', label: 'Origin Agent Network' },
    { key: 'destinationAgent', label: 'Destination Agent' },
    { key: 'destinationNetwork', label: 'Destination Agent Network' },
    { key: 'grossWt', label: 'Gross Wt' },
    { key: 'netWt', label: 'Net Wt' },
    { key: 'totalNoOfTEU', label: 'No of TEUs' }
  ];

  const rows: ExcelRow[] = (this.fullData?.data || []).map(item => ({
    cells: [
      { value: item.customerName || '' },
      { value: item.network || '' },
      { value: item.departmentName || '' },
      { value: item.BookingNo || '' },
      { value: item.HouseNo || '' },
      { value: item.masterJobNo || '' },
      { value: item.HblNo || '' },
      { value: item.MBLNo || '' },
      { value: this.formatNumber(item.totalRevenue ?? 0) },
      { value: this.formatNumber(item.totalCost ?? 0) },
      { value: this.formatNumber(item.profit ?? 0) },
      { value: this.formatNumber(item.totalGP ?? 0) + '%' },
      { value: item.nominationBy || '' },
      { value: item.originAgent || '' },
      { value: item.originNetwork || '' },
      { value: item.destinationAgent || '' },
      { value: item.destinationNetwork || '' },
      { value: this.formatNumber(item.grossWt ?? 0) },
      { value: this.formatNumber(item.netWt ?? 0) },
      { value: item.totalNoOfTEU ?? 0 }
    ],
    style: 'data'
  }));

  return {
    fileName: 'Network-Report',
    sheetName: 'NetworkReport',
    reportHeader: {
      companyName: this.currentCompany?.companyName || '',
      reportTitle: 'Network Report',
      additionalInfo: [
        { label: 'From Date', value: this.formatDate(this.fullData?.FromDate) },
        { label: 'To Date', value: this.formatDate(this.fullData?.ToDate) },
        { label: 'Network', value: this.params.Network ? this.params?.Network : 'All Network' }
      ]
    },
    tableHeaders,
    rows,
    columnWidths: [
      25, 15, 18, 15, 18, 18, 15, 15,
      15, 15, 15, 15, 20, 20, 22, 22,
      12, 12, 12
    ]
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
