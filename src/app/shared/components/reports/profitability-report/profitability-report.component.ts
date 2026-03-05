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
  selector: 'app-profitability-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './profitability-report.component.html',
  styles: ``
})
export class ProfitabilityReportComponent {

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
    this.orientation = this.reportRegistryService.getReportConfig('profitability-report').pdfOrientation;
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
      { key: 'jobNumber', label: 'Job Number' },
      { key: 'Mbl', label: 'MBL' },
      { key: 'POL', label: 'POL' },
      { key: 'POD', label: 'POD' },

      { key: 'totalRevenueWithHouse', label: 'Prov.Revenue' },
      { key: 'totalCostWithHouse', label: 'Prov.Cost' },
      { key: 'GP', label: 'Prov.GP' },
      { key: 'proveprofit', label: 'Prov.Profit %' },

      { key: 'actualRevenue', label: 'Actual Revenue' },
      { key: 'actualCost', label: 'Actual Cost' },
      { key: 'actualGp', label: 'Actual GP' },
      { key: 'profit', label: 'Act.Profit %' },

      { key: 'noOfShipment', label: 'No.of Shipment' },
      { key: 'twentyft', label: 'No.of 20ft' },
      { key: 'fourty', label: 'No.of 40ft' },
      { key: 'fourtyfive', label: 'No.of 45ft' },
      
      { key: 'containerNo', label: 'Container No.' },
      { key: 'chargeable', label: 'Total Chargeable Wt' },
      { key: 'Vol', label: 'Total CBM/Volume' },
      { key: 'space', label: 'Unutilized Space in CBM' }
    ];
    const rows: ExcelRow[] = (this.fullData?.data || []).map(item => {
      const cells: ExcelCell[] = [
        { value: item.jobNumber || '' },
        { value: item.Mbl || '' },
        { value: item.POL || '' },
        { value: item.POD || '' },

        { value: this.formatNumber(item.totalRevenueWithHouse) || 0 },
        { value: this.formatNumber(item.totalCostWithHouse) || 0 },
        { value: this.formatNumber(item.GP) || 0 },
        { value: this.formatNumber(item.proveprofit) || 0 },

        { value: this.formatNumber(item.actualRevenue) || 0 },
        { value: this.formatNumber(item.actualCost) || 0 },
        { value: this.formatNumber(item.actualGp) || 0 },
        { value: this.formatNumber(item.profit) || 0 },

        { value: item.noOfShipment || 0 },
        { value: item.twentyft || 0 },
        { value: item.fourty || 0 },
        { value: item.fourtyfive || 0 },

        { value: item.containerNo || '' },
        { value: this.formatNumber(item.chargeable) || 0 },
        { value: this.formatNumber(item.Vol) || 0 },
        { value: this.formatNumber(item.space) || 0 }
      ];

      return { cells, style: 'data' };
    });

    return {
      fileName: 'Profitability-Report',
      sheetName: 'ProfitabilityReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Profitability Report`,
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromJobDt) },
          { label: 'To Date', value: this.formatDate(this.params?.ToJobDt) },
          { label: 'Branch', value: this.fullData?.branchInvolved || '' },
          { label: 'Dept', value: this.fullData?.departmentNames || '' }
        ]
      },

      tableHeaders,
      rows,
      columnWidths: [
        15, 15, 12, 12,
        15, 15, 15, 15,
        15, 15, 15, 15,
        12, 12, 12,
        25, 18, 18, 20
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
