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
  selector: 'app-freight-mo-m-growth-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent,PrintFooterComponent],
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
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
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

get momGrowth(): any[] {
  return this.data?.departmentWiseMoM || [];
}

getDeptMoM(department: string) {
  return this.momGrowth.find((d: any) => d.department === department);
}

calculateMoM(current: number, previous: number): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

getGpPercentage(row: any): number {
  return row?.totalRevenue ? (row.grossProfit / row.totalRevenue) * 100 : 0;
}

getAvgRevenuePerShipment(row: any): number {
  return row?.totalShipment ? row.totalRevenue / row.totalShipment : 0;
}

getAvgGpPerShipment(row: any): number {
  return row?.totalShipment ? row.grossProfit / row.totalShipment : 0;
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
    const colCount = tableHeaders.length;
    const sectionHeaderValues = [
      'Month',
      'Total Shipments',
      'Revenue',
      'Cost',
      'Gross Profit',
      'GP %',
      'Total Weight (KGS)',
      'Total Volume (CBM)',
      'TEUs',
      'Active Customers',
      'Avg Revenue per Shipment',
      'Avg GP per Shipment'
    ];
    const buildHeaderRow = (): ExcelRow => ({
      cells: sectionHeaderValues.map(value => ({ value, alignment: { horizontal: 'center' } })),
      style: 'header'
    });

    const currentMonth = new Date(this.fullData?.currentPeriod?.from).toLocaleString('default', { month: 'long' });
    const previousMonth = new Date(this.fullData?.previousPeriod?.from).toLocaleString('default', { month: 'long' });

    (this.fullData?.currentPeriod?.data || []).forEach(dept => {

      // ---------- Department Title Row ----------
      rows.push({
        cells: [
          { value: dept.department, colspan: colCount }
        ],
        style: 'section'
      });
      rows.push(buildHeaderRow());

      // ---------- Current Period ----------
      rows.push(this.buildDeptRow(dept, currentMonth));

      // ---------- Previous Period ----------
      const prevDept = this.getPreviousDept(dept.department);
      if (prevDept) {
        rows.push(this.buildDeptRow(prevDept, previousMonth));
      }

      // ---------- Total ----------
     rows.push(this.buildMoMRow(dept));

    });

    return {
      fileName: 'Freight-MoM-Growth-Report',
      sheetName: 'MoM Report',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: 'Freight MoM Growth Report',
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          {label:'' , value:''}
        ]
      },
      includeTableHeaders: false,
      suppressSectionBorders: true,
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

  private buildMoMRow(dept: any): ExcelRow {
  const prevDept = this.getPreviousDept(dept.department);

  if (!prevDept) return { cells: [] };

  const mom = (c: number, p: number) =>
    p ? ((c - p) / p) * 100 : 0;

  const gpCurr = this.getGpPercentage(dept);
  const gpPrev = this.getGpPercentage(prevDept);

  const avgRevCurr = this.getAvgRevenuePerShipment(dept);
  const avgRevPrev = this.getAvgRevenuePerShipment(prevDept);

  const avgGpCurr = this.getAvgGpPerShipment(dept);
  const avgGpPrev = this.getAvgGpPerShipment(prevDept);

  return {
    cells: [
      { value: 'MoM Growth %', alignment: { horizontal: 'left' } },

      { value: mom(dept.totalShipment, prevDept.totalShipment).toFixed(2) , alignment:{horizontal:'center'} },

      { value: mom(dept.totalRevenue, prevDept.totalRevenue).toFixed(2) },

      { value: mom(dept.totalCost, prevDept.totalCost).toFixed(2) },

      { value: mom(dept.grossProfit, prevDept.grossProfit).toFixed(2) },

      { value: mom(gpCurr, gpPrev).toFixed(2) , alignment:{horizontal:'right'} },

      { value: mom(dept.totalGrossWt, prevDept.totalGrossWt).toFixed(2) },

      { value: mom(dept.totalVolume, prevDept.totalVolume).toFixed(2) },

      { value: mom(dept.totalNoOfTEU, prevDept.totalNoOfTEU).toFixed(2) , alignment:{horizontal:'center'} },

      { value: mom(dept.jobCount, prevDept.jobCount).toFixed(2) , alignment:{horizontal:'center'} },

      { value: mom(avgRevCurr, avgRevPrev).toFixed(2) },

      { value: mom(avgGpCurr, avgGpPrev).toFixed(2) }
    ],
    style: 'total'
  };
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
        { value: dept.totalShipment , alignment:{horizontal:'center'}},
        { value: this.formatNumber(dept.totalRevenue) },
        { value: this.formatNumber(dept.totalCost) },
        { value: this.formatNumber(dept.grossProfit) },
        { value: gpPercent.toFixed(2)  , alignment:{horizontal:'right'}},
        { value: this.formatNumber(dept.totalGrossWt) },
        { value: this.formatNumber(dept.totalVolume) },
        { value: dept.totalNoOfTEU , alignment:{horizontal:'center'}},
        { value: dept.jobCount , alignment:{horizontal:'center'}},
        { value: avgRevenue.toFixed(2) },
        { value: avgGP.toFixed(2) }
      ],
      style: 'data'
    };
  }


  private buildTotalRow(total: any): ExcelRow {
    return {
      cells: [
        { value: 'Total' , alignment:{horizontal:'right'}},
        { value: total.totalShipment , alignment:{horizontal:'center'}},
        { value: this.formatNumber(total.totalRevenue) },
        { value: this.formatNumber(total.totalCost) },
        { value: this.formatNumber(total.grossProfit) },
        { value: '' },
        { value: this.formatNumber(total.totalGrossWt) },
        { value: this.formatNumber(total.totalVolume) },
        { value: total.totalNoOfTEU , alignment:{horizontal:'center'}},
        { value: total.jobCount , alignment:{horizontal:'center'}},
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
