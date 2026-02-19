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
  selector: 'app-freight-mo-m-growth-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './freight-mo-m-growth-report.component.html',
  styles: ``
})
export class FreightMoMGrowthReportComponent {
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
    this.orientation = this.reportRegistryService.getReportConfig('freight-mom-growth').pdfOrientation;
  }

  getPreviousDept(department: string) {
    return this.fullData?.previousPeriod?.data
      ?.find((d: any) => d.department === department);
  }

  getDeptTotal(dept: any) {
    const prev = this.getPreviousDept(dept.department);

    const totalShipment =
      dept.totalShipment + (prev?.totalShipment || 0);

    const totalRevenue =
      dept.totalRevenue + (prev?.totalRevenue || 0);

    const totalCost =
      dept.totalCost + (prev?.totalCost || 0);

    const grossProfit = totalRevenue - totalCost;

    const totalGrossWt =
      dept.totalGrossWt + (prev?.totalGrossWt || 0);

    const totalVolume =
      dept.totalVolume + (prev?.totalVolume || 0);

    const totalNoOfTEU =
      dept.totalNoOfTEU + (prev?.totalNoOfTEU || 0);

    const jobCount =
      dept.jobCount + (prev?.jobCount || 0);

    const gpPercentage =
      totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalShipment,
      totalRevenue,
      totalCost,
      grossProfit,
      gpPercentage,
      totalGrossWt,
      totalVolume,
      totalNoOfTEU,
      jobCount
    };
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
      { key: 'month', label: 'Month' },
      { key: 'shipments', label: 'Total Shipments' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'cost', label: 'Cost' },
      { key: 'gp', label: 'Gross Profit' },
      { key: 'gpPercent', label: 'GP %' },
      { key: 'weight', label: 'Total Weight (KGS)' },
      { key: 'volume', label: 'Total Volume (CBM)' },
      { key: 'teu', label: 'TEUs' },
      { key: 'customers', label: 'Active Customers' },
      { key: 'avgRevenue', label: 'Avg Revenue / Shipment' },
      { key: 'avgGP', label: 'Avg GP / Shipment' }
    ];

    const rows: ExcelRow[] = [];

    const currentMonth = new Date(this.fullData?.currentPeriod?.from).toLocaleString('default', { month: 'long' });
    const previousMonth = new Date(this.fullData?.previousPeriod?.from).toLocaleString('default', { month: 'long' });

    (this.fullData?.currentPeriod?.data || []).forEach(dept => {

      // ---------- Department Title Row ----------
      rows.push({
        cells: [
          { value: dept.department, }
        ],
        style: 'section'
      });

      // ---------- Current Period ----------
      rows.push(this.buildDeptRow(dept, currentMonth));

      // ---------- Previous Period ----------
      const prevDept = this.getPreviousDept(dept.department);
      if (prevDept) {
        rows.push(this.buildDeptRow(prevDept, previousMonth));
      }

      // ---------- Total ----------
      const total = this.getDeptTotal(dept);
      if (total) {
        rows.push(this.buildTotalRow(total));
      }

      // ---------- Empty spacer ----------
      rows.push({ cells: [{ value: '' }] });

    });

    return {
      fileName: 'Freight-MoM-Growth-Report',
      sheetName: 'MoM Report',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: 'Freight MoM Growth Report',
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) }
        ]
      },
      tableHeaders,
      rows,
      columnWidths: [14, 16, 14, 14, 14, 10, 16, 16, 10, 16, 18, 18],
      notes: ['The system should derive the previous month\'s date range using the current From and To dates.']
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


  private buildDeptRow(dept: any, monthLabel: string): ExcelRow {

    const gpPercent = dept.totalRevenue
      ? (dept.grossProfit / dept.totalRevenue) * 100
      : 0;

    const avgRevenue = dept.totalShipment
      ? dept.totalRevenue / dept.totalShipment
      : 0;

    const avgGP = dept.totalShipment
      ? dept.grossProfit / dept.totalShipment
      : 0;

    return {
      cells: [
        { value: monthLabel },
        { value: dept.totalShipment },
        { value: this.formatNumber(dept.totalRevenue) },
        { value: this.formatNumber(dept.totalCost) },
        { value: this.formatNumber(dept.grossProfit) },
        { value: gpPercent.toFixed(2) + ' %' },
        { value: this.formatNumber(dept.totalGrossWt) },
        { value: this.formatNumber(dept.totalVolume) },
        { value: dept.totalNoOfTEU },
        { value: dept.jobCount },
        { value: avgRevenue.toFixed(2) },
        { value: avgGP.toFixed(2) }
      ],
      style: 'data'
    };
  }


  private buildTotalRow(total: any): ExcelRow {
    return {
      cells: [
        { value: 'Total' },
        { value: total.totalShipment },
        { value: this.formatNumber(total.totalRevenue) },
        { value: this.formatNumber(total.totalCost) },
        { value: this.formatNumber(total.grossProfit) },
        { value: '' },
        { value: this.formatNumber(total.totalGrossWt) },
        { value: this.formatNumber(total.totalVolume) },
        { value: total.totalNoOfTEU },
        { value: total.jobCount },
        { value: '' },
        { value: '' }
      ],
      style: 'total'
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
}
