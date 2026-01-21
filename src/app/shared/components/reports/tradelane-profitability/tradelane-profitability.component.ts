import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-tradelane-profitability',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './tradelane-profitability.component.html',
  styles: ``
})
export class TradelaneProfitabilityComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('Tradelane Profitability Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('tradelane-profitability').pdfOrientation;
  }

  get fullData(): any {
    return this.data || {};
  }

  get groupData(): any {
    return this.data?.groupedRoutes || {};
  }

  get params(): any {
    return this.data?.params || {};
  }

  get bucketLabels(): any {
    return this.fullData?.bucketLabels || [];
  }

  getExcelData(): ComplexReportExportConfig {

    const tableHeaders: ExcelHeader[] = [
      { key: 'bookingNo', label: 'Booking Number' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'cost', label: 'Cost' },
      { key: 'profit', label: 'Profit' },
      { key: 'grossWt', label: 'Gross Weight' },
      { key: 'netWt', label: 'Net Weight' },
      { key: 'vol', label: 'CBM' }
    ];

    const rows: ExcelRow[] = [];

    (this.groupData || []).forEach(route => {

      // ---- Route title row ----
      rows.push({
        cells: [
          { value: `Route : ${route.route}` },
          { value: '' }, { value: '' }, { value: '' },
          { value: '' }, { value: '' }, { value: '' }
        ],
        style: 'section'
      });

      // ---- Booking rows ----
      route.rows.forEach(item => {
        rows.push({
          cells: [
            { value: item.bookingNo },
            { value: item.revenueLocalAmt },
            { value: item.costLocalAmt },
            { value: item.profit },
            { value: item.grossWt },
            { value: item.netWt },
            { value: item.vol }
          ],
          style: 'data'
        });
      });

      // ---- Total row ----
      rows.push({
        cells: [
          { value: 'Total' },
          { value: route.totals.revenue },
          { value: route.totals.cost },
          { value: route.totals.profit },
          { value: route.totals.grossWt },
          { value: route.totals.netWt },
          { value: route.totals.vol }
        ],
        style: 'total'
      });

      // ---- Empty line between routes ----
      rows.push({
        cells: [
          { value: '' }, { value: '' }, { value: '' },
          { value: '' }, { value: '' }, { value: '' }, { value: '' }
        ],
        style: 'data'
      });

    });

    return {
      fileName: 'Tradelane-Profitability-Report',
      sheetName: 'Tradelane Profitability',

      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company Name',
        reportTitle: 'Tradelane Profitability',
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Branch', value: this.fullData?.resolvedBranchNames || '' },
          { label: 'POL', value: this.fullData?.filters?.POL || '' },
          { label: 'POD', value: this.fullData?.filters?.POD || '' }
        ]
      },

      tableHeaders,
      rows,

      columnWidths: [20, 15, 15, 15, 15, 15, 15]
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
