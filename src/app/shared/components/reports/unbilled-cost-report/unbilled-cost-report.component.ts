import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-unbilled-cost-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './unbilled-cost-report.component.html',
  styles: ``
})
export class UnbilledCostReportComponent {
  currentCompany: any;
  currentBranch: any;
 
  viewMode: 'detail' | 'summary' = 'detail';
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
    this.orientation = this.reportRegistryService.getReportConfig('unbilled-cost-report').pdfOrientation;
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
    // Determine which view mode is selected
    const isDetail = this.viewMode === 'detail';

    // Build headers dynamically based on view mode
    const tableHeaders: ExcelHeader[] = isDetail
      ? [
          { key: 'branchName', label: 'Branch' },
          { key: 'houseDept', label: 'Dept' },
          { key: 'HBLNo', label: 'HBL No.' },
          { key: 'houseStatus', label: 'Job Status' },
          { key: 'bookingNo', label: 'Booking No' },
          { key: 'chargeName', label: 'Charge Name' },
          { key: 'PPCC', label: 'PP/CC' },
          { key: 'CostDrCr', label: 'Dr/Cr' },
          { key: 'CostAmount', label: 'Amount' },
          { key: 'CostLocalAmount', label: 'Local Amount' },
          { key: 'partyName', label: 'Party' }
        ]
      : [
          { key: 'branchName', label: 'Branch' },
          { key: 'houseDept', label: 'Dept' },
          { key: 'HBLNo', label: 'HBL No.' },
          { key: 'houseStatus', label: 'Job Status' },
          { key: 'bookingNo', label: 'Booking No' },
          { key: 'CostAmount', label: 'Amount' },
          { key: 'CostLocalAmount', label: 'Local Amount' },
          { key: 'partyName', label: 'Party' }
        ];

    // Prepare rows
    const rows: ExcelRow[] = (this.fullData?.data || []).map(item => {
      const cells: ExcelCell[] = isDetail
        ? [
            { value: item.branchName || '' },
            { value: item.houseDept || '' },
            { value: item.HBLNo || '' },
            { value: item.houseStatus || '' },
            { value: item.bookingNo || '' },
            { value: item.costRevenueDetails?.[0]?.chargeName || '' },
            { value: item.PPCC || '' },
            { value: item.costRevenueDetails?.[0]?.CostDrCr || '' },
            { value: this.formatNumber(item.CostAmount) },
            { value: this.formatNumber(item.costRevenueDetails?.[0]?.CostLocalAmount) },
            { value: item.costRevenueDetails?.[0]?.partyName || '' }
          ]
        : [
            { value: item.branchName || '' },
            { value: item.houseDept || '' },
            { value: item.HBLNo || '' },
            { value: item.houseStatus || '' },
            { value: item.bookingNo || '' },
            { value: this.formatNumber(item.CostAmount) },
            { value: this.formatNumber(item.costRevenueDetails?.[0]?.CostLocalAmount) },
            { value: item.costRevenueDetails?.[0]?.partyName || '' }
          ];
      return { cells, style: 'data' };
    });

    // Column widths (adjust as needed)
    const columnWidths = isDetail ? [15, 12, 15, 15, 15, 20, 10, 10, 15, 15, 20] : [15, 12, 15, 15, 15, 15, 15, 20];

    return {
      fileName: 'Unbilled-Cost-Report',
      sheetName: 'UnbilledCostReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Unbilled Cost Report (${isDetail ? 'Detail' : 'Summary'}) as on ${this.formatDate(this.params?.FromHBLDt)}`,
        additionalInfo: [
          { label: 'Branch', value: this.params?.Branch || '' },
          { label: 'Dept', value: this.params?.Dept || '' },
          { label: 'From Date', value: this.formatDate(this.params?.FromHBLDt) },
          { label: 'To Date', value: this.formatDate(this.params?.ToHBLDt) }
        ]
      },
      tableHeaders,
      rows,
      columnWidths
    };
  }

  private formatNumber(value: any): number | string {
    if (value === null || value === undefined) return '';
    const num = Number(value);
    return isNaN(num) ? '' : Number(num.toFixed(2));
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
