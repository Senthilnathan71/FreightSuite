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
  selector: 'app-tradelane-profitability',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent,PrintFooterComponent],
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
      { key: 'BookingDate', label: 'Booking Date' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'cost', label: 'Cost' },
      { key: 'profit', label: 'Profit' },
      { key: 'grossWt', label: 'Gross Weight' },
      { key: 'netWt', label: 'Net Weight' },
      { key: 'vol', label: 'CBM' },
      { key: 'chargeableWt', label: 'Chargeable Wt' }
    ];

    const rows: ExcelRow[] = [];
    const colCount = tableHeaders.length;
    const bookingHeaderValues = ['Booking No','Booking Date', 'Revenue', 'Cost', 'Profit', 'Gross Wt', 'Net Wt', 'CBM'];
    const masterHeaderValues = ['MBL No','MBL Date', 'Revenue', 'Cost', 'Profit', 'Gross Wt', 'Net Wt', 'CBM'];
    const masterAirHeaderValues = ['MAWB No','MAWB Date', 'Revenue', 'Cost', 'Profit', 'Gross Wt', 'Net Wt', 'CBM', 'Chargeable Wt'];
    const houseHeaderValues = ['HBL No','HBL Date', 'Revenue', 'Cost', 'Profit', 'Gross Wt', 'Net Wt', 'CBM'];
    const houseAirHeaderValues = ['HAWB No','HAWB Date', 'Revenue', 'Cost', 'Profit', 'Gross Wt', 'Net Wt', 'CBM', 'Chargeable Wt'];
    const buildHeaderRow = (values: string[]): ExcelRow => ({
      cells: values.map(value => ({ value, alignment: { horizontal: 'center' } })),
      style: 'header'
    });

    (this.fullData?.groupedRoutes || []).forEach(route => {
      // ---- Route title row ----
      rows.push({
        cells: [{ value: `Route: ${route.route}`, colspan: colCount }],
        style: 'section'
      });

      // ---- Booking Section ----
      if (route.bookingRows?.length > 0) {
        rows.push({
          cells: [{ value: 'Booking', colspan: colCount }],
          style: 'section'
        });
        rows.push(buildHeaderRow(bookingHeaderValues));

        route.bookingRows.forEach(item => {
          rows.push({
            cells: [
              { value: item.bookingNo || '' },
              { value: this.formatDate(item.BookingDate) , alignment:{horizontal:'center'} },
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
            { value: 'Total' , colspan:2 , alignment:{horizontal:'right'} },
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
          cells: [{ value: '', colspan: colCount }],
          style: 'section'
        });
      }

      // ---- Master Job Section ----
      const masterJobRows = this.getSectionRows(route.masterRows, 'Master Job');
      if (masterJobRows.length > 0) {
        rows.push({
          cells: [{ value: 'Master Job', colspan: colCount }],
          style: 'section'
        });
        rows.push(buildHeaderRow(masterHeaderValues));

        masterJobRows.forEach(item => {
          rows.push({
            cells: [
              { value: item.MBLNo || '' , alignment:{horizontal:'left'} },
              { value: this.formatDate(item.MasterDate)  , alignment:{horizontal:'center'}},
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

        const masterJobTotals = this.getSectionTotals(masterJobRows);

        rows.push({
          cells: [
            { value: 'Total' , colspan:2 , alignment:{horizontal:'right'} },
            { value: this.formatNumber(masterJobTotals?.revenue ?? 0) },
            { value: this.formatNumber(masterJobTotals?.cost ?? 0) },
            { value: this.formatNumber(masterJobTotals?.profit ?? 0) },
            { value: this.formatNumber(masterJobTotals?.grossWt ?? 0) },
            { value: this.formatNumber(masterJobTotals?.netWt ?? 0) },
            { value: this.formatNumber(masterJobTotals?.vol ?? 0) }
          ],
          style: 'total'
        });

        rows.push({
          cells: [{ value: '', colspan: colCount }],
          style: 'section'
        });
      }

      const masterAirRows = this.getSectionRows(route.masterRows, 'Master Air Waybill');
      if (masterAirRows.length > 0) {
        rows.push({
          cells: [{ value: 'Master Air Waybill', colspan: colCount }],
          style: 'section'
        });
        rows.push(buildHeaderRow(masterAirHeaderValues));

        masterAirRows.forEach(item => {
          rows.push({
            cells: [
              { value: item.MBLNo || '' , alignment:{horizontal:'left'} },
              { value: this.formatDate(item.MasterDate)  , alignment:{horizontal:'center'}},
              { value: this.formatNumber(item.revenueLocalAmt ?? 0) },
              { value: this.formatNumber(item.costLocalAmt ?? 0) },
              { value: this.formatNumber(item.profit ?? 0) },
              { value: this.formatNumber(item.grossWt ?? 0) },
              { value: this.formatNumber(item.netWt ?? 0) },
              { value: this.formatNumber(item.vol ?? 0) },
              { value: this.formatNumber(item.chargeableWt ?? 0) }
            ],
            style: 'data'
          });
        });

        const masterAirTotals = this.getSectionTotals(masterAirRows);

        rows.push({
          cells: [
            { value: 'Total' , colspan:2 , alignment:{horizontal:'right'} },
            { value: this.formatNumber(masterAirTotals?.revenue ?? 0) },
            { value: this.formatNumber(masterAirTotals?.cost ?? 0) },
            { value: this.formatNumber(masterAirTotals?.profit ?? 0) },
            { value: this.formatNumber(masterAirTotals?.grossWt ?? 0) },
            { value: this.formatNumber(masterAirTotals?.netWt ?? 0) },
            { value: this.formatNumber(masterAirTotals?.vol ?? 0) },
            { value: this.formatNumber(masterAirTotals?.chargeableWt ?? 0) }
          ],
          style: 'total'
        });

        rows.push({
          cells: [{ value: '', colspan: colCount }],
          style: 'section'
        });
      }

      // ---- House Job Section ----
      const houseJobRows = this.getSectionRows(route.houseRows, 'House Job');
      if (houseJobRows.length > 0) {
        rows.push({
          cells: [{ value: 'House Job', colspan: colCount }],
          style: 'section'
        });
        rows.push(buildHeaderRow(houseHeaderValues));

        houseJobRows.forEach(item => {
          rows.push({
            cells: [
              { value: item.HBLNo || '' , alignment:{horizontal:'left'} },
              { value: this.formatDate(item.HouseDate)  , alignment:{horizontal:'center'}},
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

        const houseJobTotals = this.getSectionTotals(houseJobRows);

        rows.push({
          cells: [
            { value: 'Total' , colspan:2 , alignment:{horizontal:'right'} },
            { value: this.formatNumber(houseJobTotals?.revenue ?? 0) },
            { value: this.formatNumber(houseJobTotals?.cost ?? 0) },
            { value: this.formatNumber(houseJobTotals?.profit ?? 0) },
            { value: this.formatNumber(houseJobTotals?.grossWt ?? 0) },
            { value: this.formatNumber(houseJobTotals?.netWt ?? 0) },
            { value: this.formatNumber(houseJobTotals?.vol ?? 0) }
          ],
          style: 'total'
        });

        rows.push({
          cells: [{ value: '', colspan: colCount }],
          style: 'section'
        });
      }

      const houseAirRows = this.getSectionRows(route.houseRows, 'House Air Waybill');
      if (houseAirRows.length > 0) {
        rows.push({
          cells: [{ value: 'House Air Waybill', colspan: colCount }],
          style: 'section'
        });
        rows.push(buildHeaderRow(houseAirHeaderValues));

        houseAirRows.forEach(item => {
          rows.push({
            cells: [
              { value: item.HBLNo || '' , alignment:{horizontal:'left'} },
              { value: this.formatDate(item.HouseDate)  , alignment:{horizontal:'center'}},
              { value: this.formatNumber(item.revenueLocalAmt ?? 0) },
              { value: this.formatNumber(item.costLocalAmt ?? 0) },
              { value: this.formatNumber(item.profit ?? 0) },
              { value: this.formatNumber(item.grossWt ?? 0) },
              { value: this.formatNumber(item.netWt ?? 0) },
              { value: this.formatNumber(item.vol ?? 0) },
              { value: this.formatNumber(item.chargeableWt ?? 0) }
            ],
            style: 'data'
          });
        });

        const houseAirTotals = this.getSectionTotals(houseAirRows);

        rows.push({
          cells: [
            { value: 'Total' , colspan:2 , alignment:{horizontal:'right'} },
            { value: this.formatNumber(houseAirTotals?.revenue ?? 0) },
            { value: this.formatNumber(houseAirTotals?.cost ?? 0) },
            { value: this.formatNumber(houseAirTotals?.profit ?? 0) },
            { value: this.formatNumber(houseAirTotals?.grossWt ?? 0) },
            { value: this.formatNumber(houseAirTotals?.netWt ?? 0) },
            { value: this.formatNumber(houseAirTotals?.vol ?? 0) },
            { value: this.formatNumber(houseAirTotals?.chargeableWt ?? 0) }
          ],
          style: 'total'
        });

        rows.push({
          cells: [{ value: '', colspan: colCount }],
          style: 'section'
        });
      }
    });

    // The whole report is one continuous table sized to the widest section (9 cols, incl.
    // Chargeable Wt for the air waybill sections). The 8-column ocean sections (Booking /
    // Master Job / House Job) would otherwise leave an empty column on the right. Instead of
    // adding a filler cell (which inherits the row's header colour / borders), stretch the last
    // real cell (CBM) to span the leftover column(s) so the section fills the full width with no
    // empty column. Section banner rows already span the full width via colspan, so skip them.
    const totalCols = tableHeaders.length;
    const visualWidth = (row: ExcelRow): number =>
      row.cells.reduce((n, c) => n + (c.colspan && c.colspan > 1 ? c.colspan : 1), 0);
    rows.forEach(row => {
      if (row.style === 'section' || row.cells.length === 0) return;
      const width = visualWidth(row);
      if (width < totalCols) {
        const last = row.cells[row.cells.length - 1];
        last.colspan = (last.colspan && last.colspan > 1 ? last.colspan : 1) + (totalCols - width);
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
          { label: 'POD', value: this.fullData?.filters?.POD || '' },
          { label: 'With Pro Rate', value: this.params?.['With Pro Rate'] ? 'Yes' : 'No' }
        ]
      },
      includeTableHeaders: false,
      suppressSectionBorders: true,
      tableHeaders,
      rows,
      columnWidths: [40, 12, 12, 12, 12, 12, 12, 12, 12]
    };
  }

  getSectionRows(rows: any[] | undefined, screen: string): any[] {
    return (rows || []).filter((item) => this.getRowScreen(item) === screen);
  }

  getSectionTotals(rows: any[] | undefined): any {
    return (rows || []).reduce(
      (totals, item) => ({
        revenue: totals.revenue + Number(item?.revenueLocalAmt || 0),
        cost: totals.cost + Number(item?.costLocalAmt || 0),
        profit: totals.profit + Number(item?.profit || 0),
        grossWt: totals.grossWt + Number(item?.grossWt || 0),
        netWt: totals.netWt + Number(item?.netWt || 0),
        vol: totals.vol + Number(item?.vol || 0),
        chargeableWt: totals.chargeableWt + Number(item?.chargeableWt || 0)
      }),
      { revenue: 0, cost: 0, profit: 0, grossWt: 0, netWt: 0, vol: 0 , chargeableWt: 0}
    );
  }

  private getRowScreen(item: any): string {
    if (item?.screen) return item.screen;
    if (item?.MBLNo !== undefined) return 'Master Job';
    if (item?.HBLNo !== undefined) return 'House Job';
    return '';
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
