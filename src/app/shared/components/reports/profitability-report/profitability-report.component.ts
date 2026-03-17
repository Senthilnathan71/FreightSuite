import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import {
  ComplexReportExportConfig,
  ExcelCell,
  ExcelHeader,
  ExcelRow,
} from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';

@Component({
  selector: 'app-profitability-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule, PrintHeaderComponent],
  templateUrl: './profitability-report.component.html',
  styles: ``,
})
export class ProfitabilityReportComponent {
  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService,
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig(
      'profitability-report',
    ).pdfOrientation;
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
    { key: 'dept', label: 'Dept' },
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
    { key: 'space', label: 'Unutilized Space in CBM' },
  ];

  const rows: ExcelRow[] = (this.fullData?.data || []).map((item) => {
    const cells: ExcelCell[] = [
      { value: item.jobNumber || '' },
      { value: item.Mbl || '' },
      { value: item.dept || '' },
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

      { value: Number(item.noOfShipment) || 0 },
      { value: Number(item.twentyft) || 0 },
      { value: Number(item.fourty) || 0 },
      { value: Number(item.fourtyfive) || 0 },

      { value: item.containerNo || '' },
      { value: this.formatNumber(item.chargeable) || 0 },
      { value: this.formatNumber(item.Vol) || 0 },
      { value: this.formatNumber(item.space) || 0 },
    ];

    return { cells, style: 'data' };
  });

  rows.push({
    cells: [
      { value: '' },
      { value: '' },
      { value: '' },
      { value: '' },
      { value: 'Grand Total' },

      { value: this.formatNumber(this.grandtotalRevenueWithHouse()) },
      { value: this.formatNumber(this.grandtotalCostWithHouse()) },
      { value: this.formatNumber(this.grandGP()) },
      { value: this.formatNumber(this.grandproveprofit()) },

      { value: this.formatNumber(this.grandactualRevenue()) },
      { value: this.formatNumber(this.grandactualCost()) },
      { value: this.formatNumber(this.grandactualGp()) },
      { value: this.formatNumber(this.grandprofit()) },

      { value: this.grandnoOfShipment() },
      { value: this.grandtwentyft() },
      { value: this.grandfourty() },
      { value: this.grandfourtyfive() },

      { value: '' },
      { value: this.formatNumber(this.grandchargeable()) },
      { value: this.formatNumber(this.grnadVol()) },
      { value: this.formatNumber(this.grandspace()) },
    ],
    style: 'total',
  });

  return {
    fileName: 'Profitability-Report',
    sheetName: 'ProfitabilityReport',
    reportHeader: {
      companyName: this.currentCompany?.companyName || 'Company',
      reportTitle: `Profitability Report`,
      additionalInfo: [
        {
          label: 'From Date',
          value: this.formatDate(this.params?.FromJobDt),
        },
        { label: 'To Date', value: this.formatDate(this.params?.ToJobDt) },
        { label: 'Branch', value: this.fullData?.branchInvolved || '' },
        { label: 'Dept', value: this.fullData?.departmentNames || '' },
      ],
    },
    tableHeaders,
    rows,
    columnWidths: [
      15, 15, 12, 12, 12, 15, 15, 15, 15, 15, 15, 15, 15, 12, 12, 12, 12, 25,
      18, 18, 20,
    ],
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

  // Total

  grandtotalRevenueWithHouse(): number {
    return (
      this.fullData?.data?.reduce((a, b) => a + b.totalRevenueWithHouse, 0) || 0
    );
  }

  grandtotalCostWithHouse(): number {
    return (
      this.fullData?.data?.reduce((a, b) => a + b.totalCostWithHouse, 0) || 0
    );
  }

  grandGP(): number {
    return this.fullData?.data?.reduce((a, b) => a + b.GP, 0) || 0;
  }

  grandproveprofit(): number {
    return this.fullData?.data?.reduce((a, b) => a + b.proveprofit, 0) || 0;
  }

  grandactualRevenue(): number {
    return this.fullData?.data?.reduce((a, b) => a + b.actualRevenue, 0) || 0;
  }

  grandactualCost(): number {
    return this.fullData?.data?.reduce((a, b) => a + b.actualCost, 0) || 0;
  }

  grandactualGp(): number {
    return this.fullData?.data?.reduce((a, b) => a + b.actualGp, 0) || 0;
  }

  grandprofit(): number {
    return this.fullData?.data?.reduce((a, b) => a + b.profit, 0) || 0;
  }

  grandnoOfShipment(): number {
    return this.fullData?.data?.reduce((a, b) => a + b.noOfShipment, 0) || 0;
  }

  grandtwentyft(): number {
    return this.fullData?.data?.reduce((a, b) => a + b.twentyft, 0) || 0;
  }

  grandfourty(): number {
    return this.fullData?.data?.reduce((a, b) => a + b.fourty, 0) || 0;
  }

  grandfourtyfive(): number {
    return this.fullData?.data?.reduce((a, b) => a + b.fourtyfive, 0) || 0;
  }

  grandchargeable(): number {
    return (
      this.fullData?.data?.reduce((a, b) => {
        return a + (Number(b.chargeable) || 0);
      }, 0) || 0
    );
  }

  grnadVol(): number {
    return (
      this.fullData?.data?.reduce((a, b) => {
        return a + (Number(b.Vol) || 0);
      }, 0) || 0
    );
  }

  grandspace(): number {
    return this.fullData?.data?.reduce((a, b) => a + b.space, 0) || 0;
  }
}
