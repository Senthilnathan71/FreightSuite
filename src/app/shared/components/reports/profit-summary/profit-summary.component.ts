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
  selector: 'app-profit-summary',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './profit-summary.component.html',
  styles: ``
})
export class ProfitSummaryComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('House Job Loss Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('profit-summary').pdfOrientation;
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

getHouseTotal(item: any, field: string): number {
  if (!item?.houseWithCR?.length) return 0;

  return item.houseWithCR.reduce(
    (acc: number, h: any) =>
      acc + (h?.costRevenues?.houseCrSummary?.[field] || 0),
    0
  );
}
getGrandTotal(field: string): number {
  if (!this.fullData?.data?.length) return 0;

  return this.fullData.data.reduce((total: number, item: any) => {

    // 1️⃣ MASTER VALUE
    const masterValue =
      item?.costRevenues?.masterCrSummary?.[field] || 0;

    // 2️⃣ HOUSE TOTAL
    const houseValue =
      item?.houseWithCR?.reduce(
        (sum: number, h: any) =>
          sum + (h?.costRevenues?.houseCrSummary?.[field] || 0),
        0
      ) || 0;

    // 3️⃣ MASTER + HOUSE
    return total + masterValue + houseValue;

  }, 0);
}

getExcelData(): ComplexReportExportConfig {
  const tableHeaders: ExcelHeader[] = [
    { key: 'JobNo', label: 'Job No' },
    { key: 'Dept', label: 'Dept' },
    { key: 'MBLNo', label: 'MBL No' },
    { key: 'HouseNo', label: 'House No' },
    { key: 'HBLNo', label: 'HBL No' },
    { key: 'HouseStatus', label: 'House Status' },
    { key: 'JobType', label: 'Job Type' },
    { key: 'Customer', label: 'Customer' },
    { key: 'OriginAgent', label: 'Origin Agent' },
    { key: 'DestAgent', label: 'Dest Agent' },
    { key: 'OriginPort', label: 'Origin Port' },
    { key: 'DestPort', label: 'Dest Port' },
    { key: 'LoadPort', label: 'Load Port' },
    { key: 'DischargePort', label: 'Discharge Port' },
    { key: 'ETA', label: 'ETA' },
    { key: 'ETD', label: 'ETD' },
    { key: 'ATA', label: 'ATA' },
    { key: 'ATD', label: 'ATD' },
    { key: 'ModeOfTransport', label: 'Mode of Transport' },
    { key: 'Salesperson', label: 'Salesperson' },
    { key: 'PPCC', label: 'PP/CC' },
    { key: 'PSale', label: 'P.Sale' },
    { key: 'PCost', label: 'P.Cost' },
    { key: 'PGP', label: 'P.GP' },
    { key: 'ASale', label: 'A.Sale' },
    { key: 'ACost', label: 'A.Cost' },
    { key: 'AGP', label: 'A.GP' }
  ];

  const rows: ExcelRow[] = [];

  (this.fullData?.data || []).forEach((item: any) => {
    const master = item?.costRevenues?.masterCrSummary || {};
    rows.push({
      cells: [
        { value: item.JobNo || '' },
        { value: item.deptName || '' },
        { value: item.MBLNo || '' },
        { value: item.houseNo || '' },
        { value: item.HBLNo || '' },
        { value: item.houseStatus || '' },
        { value: item.jobType || '' },
        { value: item.customerName || '' },
        { value: item.OriginAgent || '' },
        { value: item.DestinationAgent || '' },
        { value: item.POO || '' },
        { value: item.POD || '' },
        { value: item.POL || '' },
        { value: item.FPD || '' },
        { value: this.formatDate(item.ETA) },
        { value: this.formatDate(item.ETD) },
        { value: this.formatDate(item.ATA) },
        { value: this.formatDate(item.ATD) },
        { value: item.ModeOfTransport || '' },
        { value: item.salesPerson || '' },
        { value: item.PPCC || '' },
        { value: this.formatNumber(master.pSale) },
        { value: this.formatNumber(master.pCost) },
        { value: this.formatNumber(master.pGp) },
        { value: this.formatNumber(master.aSale) },
        { value: this.formatNumber(master.aCost) },
        { value: this.formatNumber(master.aGp) }
      ],
      style: 'data'
    });

    (item.houseWithCR || []).forEach((hj: any) => {
      const house = hj?.costRevenues?.houseCrSummary || {};
      rows.push({
        cells: [
          { value: '' }, { value: '' }, { value: '' }, { value: '' },
          { value: '' }, { value: '' }, { value: '' }, { value: '' },
          { value: '' }, { value: '' }, { value: '' }, { value: '' },
          { value: '' }, { value: '' }, { value: '' }, { value: '' },
          { value: '' }, { value: '' }, { value: '' }, { value: '' },
          { value: '' },
          { value: this.formatNumber(house.pSale) },
          { value: this.formatNumber(house.pCost) },
          { value: this.formatNumber(house.pGp) },
          { value: this.formatNumber(house.aSale) },
          { value: this.formatNumber(house.aCost) },
          { value: this.formatNumber(house.aGp) }
        ],
        style: 'data'
      });
    });
  });

  // Grand total row
  rows.push({
    cells: [
      { value: 'GRAND TOTAL', colspan: 21 },
      { value: this.formatNumber(this.getGrandTotal('pSale')) },
      { value: this.formatNumber(this.getGrandTotal('pCost')) },
      { value: this.formatNumber(this.getGrandTotal('pGp')) },
      { value: this.formatNumber(this.getGrandTotal('aSale')) },
      { value: this.formatNumber(this.getGrandTotal('aCost')) },
      { value: this.formatNumber(this.getGrandTotal('aGp')) }
    ],
    style: 'grandTotal'
  });

  return {
    fileName: 'Profit-Summary-Report',
    sheetName: 'ProfitSummary',
    reportHeader: {
      companyName: this.currentCompany?.companyName || 'Company',
      reportTitle: 'Profit Summary Report',
      additionalInfo: [
        { label: 'From Date', value: this.formatDate(this.params?.FromJobDt) },
        { label: 'To Date', value: this.formatDate(this.params?.ToJobDt) },
        { label: 'Branch', value: this.fullData?.brancesInvoled || 'All' },
        { label: 'Dept', value: this.fullData?.DeptNames || 'All' }
      ]
    },
    tableHeaders,
    rows,
    columnWidths: [12, 10, 14, 12, 12, 12, 10, 18, 15, 15, 12, 12, 12, 12, 12, 12, 12, 12, 14, 14, 8, 12, 12, 12, 12, 12, 12]
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

private formatNumber(value: any): number | string {
  if (value === null || value === undefined) return '';
  const num = Number(value);
  return isNaN(num) ? '' : Number(num.toFixed(2));
}

}
