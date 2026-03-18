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
  selector: 'app-tradelane-profitability',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
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
      { key: 'bookingNo', label: 'Booking No' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'cost', label: 'Cost' },
      { key: 'profit', label: 'Profit' },
      { key: 'grossWt', label: 'Gross Weight' },
      { key: 'netWt', label: 'Net Weight' },
      { key: 'vol', label: 'CBM' }
    ];

    const rows: ExcelRow[] = [];

    (this.fullData?.groupedRoutes || []).forEach(route => {
      // ---- Route title row ----
      rows.push({
        cells: [
          { value: `Route: ${route.route}` },
          { value: '' }, { value: '' }, { value: '' },
          { value: '' }, { value: '' }, { value: '' }
        ],
        style: 'section'
      });

      // ---- Booking Section ----
      if (route.bookingRows?.length > 0) {
        rows.push({
          cells: [{ value: 'Booking' }, ...Array(6).fill({ value: '' })],
          style: 'section'
        });

        route.bookingRows.forEach(item => {
          rows.push({
            cells: [
              { value: item.bookingNo || '' },
              { value: this.formatNumber(item.revenueLocalAmt ?? 0) },
              { value: this.formatNumber(item.costLocalAmt ?? 0) },
              { value: this.formatNumber(item.profit ?? 0) },
              { value: this.formatNumber(item.grossWt ?? 0) },
              { value: this.formatNumber(item.netWt ?? 0) },
              { value: this.formatNumber(item.vol ?? 0) }
            ],
            style: 'data'
          });
        });

        rows.push({
          cells: [
            { value: 'Total' },
            { value: this.formatNumber(route.bookingTotals?.revenue ?? 0) },
            { value: this.formatNumber(route.bookingTotals?.cost ?? 0) },
            { value: this.formatNumber(route.bookingTotals?.profit ?? 0) },
            { value: this.formatNumber(route.bookingTotals?.grossWt ?? 0) },
            { value: this.formatNumber(route.bookingTotals?.netWt ?? 0) },
            { value: this.formatNumber(route.bookingTotals?.vol ?? 0) }
          ],
          style: 'total'
        });

        rows.push({
          cells: Array(7).fill({ value: '' }),
          style: 'data'
        });
      }

      // ---- Master Job Section ----
      if (route.masterRows?.length > 0) {
        rows.push({
          cells: [{ value: 'Master Job' }, ...Array(6).fill({ value: '' })],
          style: 'section'
        });

        route.masterRows.forEach(item => {
          rows.push({
            cells: [
              { value: item.MBLNo || '' , alignment:{horizontal:'left'} },
              { value: this.formatNumber(item.revenueLocalAmt ?? 0) },
              { value: this.formatNumber(item.costLocalAmt ?? 0) },
              { value: this.formatNumber(item.profit ?? 0) },
              { value: this.formatNumber(item.grossWt ?? 0) },
              { value: this.formatNumber(item.netWt ?? 0) },
              { value: this.formatNumber(item.vol ?? 0) }
            ],
            style: 'data'
          });
        });

        rows.push({
          cells: [
            { value: 'Total' },
            { value: this.formatNumber(route.masterTotals?.revenue ?? 0) },
            { value: this.formatNumber(route.masterTotals?.cost ?? 0) },
            { value: this.formatNumber(route.masterTotals?.profit ?? 0) },
            { value: this.formatNumber(route.masterTotals?.grossWt ?? 0) },
            { value: this.formatNumber(route.masterTotals?.netWt ?? 0) },
            { value: this.formatNumber(route.masterTotals?.vol ?? 0) }
          ],
          style: 'total'
        });

        rows.push({
          cells: Array(7).fill({ value: '' }),
          style: 'data'
        });
      }

      // ---- House Job Section ----
      if (route.houseRows?.length > 0) {
        rows.push({
          cells: [{ value: 'House Job' }, ...Array(6).fill({ value: '' })],
          style: 'section'
        });

        route.houseRows.forEach(item => {
          rows.push({
            cells: [
              { value: item.HBLNo || '' , alignment:{horizontal:'left'} },
              { value: this.formatNumber(item.revenueLocalAmt ?? 0) },
              { value: this.formatNumber(item.costLocalAmt ?? 0) },
              { value: this.formatNumber(item.profit ?? 0) },
              { value: this.formatNumber(item.grossWt ?? 0) },
              { value: this.formatNumber(item.netWt ?? 0) },
              { value: this.formatNumber(item.vol ?? 0) }
            ],
            style: 'data'
          });
        });

        rows.push({
          cells: [
            { value: 'Total' },
            { value: this.formatNumber(route.houseTotals?.revenue ?? 0) },
            { value: this.formatNumber(route.houseTotals?.cost ?? 0) },
            { value: this.formatNumber(route.houseTotals?.profit ?? 0) },
            { value: this.formatNumber(route.houseTotals?.grossWt ?? 0) },
            { value: this.formatNumber(route.houseTotals?.netWt ?? 0) },
            { value: this.formatNumber(route.houseTotals?.vol ?? 0) }
          ],
          style: 'total'
        });

        rows.push({
          cells: Array(7).fill({ value: '' }),
          style: 'data'
        });
      }
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
      columnWidths: [15, 12, 12, 12, 12, 12, 12]
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
