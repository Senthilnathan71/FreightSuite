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
  selector: 'app-cost-revenue-not-booked',
  standalone: true,
  imports: [CustomDatePipe, CommonModule, PrintHeaderComponent],
  templateUrl: './cost-revenue-not-booked.component.html',
  styles: ``,
})
export class CostRevenueNotBookedComponent {
  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService,
  ) {
    console.log('Cost & Revenue Not Booked Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation =
      this.reportRegistryService.getReportConfig(
        'not-booked-rates',
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
  const isNotBookedCost = this.fullData?.CalculationType === 'Not Cost';
  const isNotRevenue = this.fullData?.CalculationType === 'Not Revenue';

  // Excel headers
  const tableHeaders: ExcelHeader[] = [
    { key: 'BookingNo', label: 'Booking No' },
    { key: 'MasterJobNo', label: 'Master Job No' },
    { key: 'MBLNo', label: 'MBL No' },
    { key: 'HBLNo', label: 'HBL No' },
    { key: 'HBLDate', label: 'HBL Date' },
    { key: 'dept', label: 'Dept' },
    { key: 'Charge', label: 'Charge Desc' },
    { key: 'Amt', label: isNotBookedCost ? 'Revenue Amt' : 'Cost Amt' },
    { key: 'LocalAmt', label: isNotBookedCost ? 'Revenue Local Amt' : 'Cost Local Amt' },
    { key: 'Party', label: isNotBookedCost ? 'Revenue Party' : 'Cost Party' },
  ];

  const rows: ExcelRow[] = [];

  (this.fullData?.data || []).forEach((job) => {
    const costRevenues = job.costRevenues && job.costRevenues.length > 0 ? job.costRevenues : (isNotRevenue ? [null] : []);

    costRevenues.forEach((cr) => {
      rows.push({
        cells: [
          { value: job.BookingNo || '' },
          { value: job.MasterJobNo || '' },
          { value: job.MBLNo || '' },
          { value: job.HBLNo || '' },
          { value: this.formatDate(job.HBLDate) },
          { value: job.dept || '' },
          { value: cr?.Charge || '' },
          {
            value: isNotBookedCost ? this.formatNumber(cr?.RevenueAmt || 0) : this.formatNumber(cr?.CostAmt || 0),
            alignment: { horizontal: 'right' },
          },
          {
            value: isNotBookedCost
              ? this.formatNumber(cr?.RevenueLocalAmount || 0)
              : this.formatNumber(cr?.CostLocalAmount || 0),
            alignment: { horizontal: 'right' },
          },
          {
            value: isNotBookedCost ? cr?.revenueCustomer || '' : cr?.costCustomer || '',
          },
        ],
        style: 'data',
      });
    });
  });

  // Add empty row before Notes
  rows.push({ cells: Array(tableHeaders.length).fill({ value: '' }), style: 'data' });

  // Prepare notes from HTML and add as rows below table
  const notes: string[] = [];
  if (isNotBookedCost) {
    notes.push('This report includes only Revenue entries for jobs that have not been booked as Cost.');
  } else {
    notes.push('This report includes only Cost entries for jobs that have not been booked as Revenue.');
    notes.push('Jobs with no entries in the Rate tab are included in this report.');
  }

  notes.forEach((note) => {
    rows.push({
      cells: [
        { value: 'Note:' }, 
        { value: note, colspan: tableHeaders.length - 1 },
      ],
    });
  });

  return {
    fileName: isNotBookedCost ? 'Cost-Not-Booked-Report' : 'Revenue-Not-Booked-Report',
    sheetName: 'Report',
    reportHeader: {
      companyName: this.currentCompany?.companyName || 'Company',
      reportTitle: isNotBookedCost ? 'Cost Not Booked Report' : 'Revenue Not Booked Report',
      additionalInfo: [
        { label: 'From Date', value: this.formatDate(this.params?.FromJobDt) },
        { label: 'To Date', value: this.formatDate(this.params?.ToJobDt) },
        { label: 'Branch', value: this.fullData?.branchInvolved || '' },
        { label: 'Dept', value: this.fullData?.resolvedDeptNames || '' },
      ],
    },
    tableHeaders,
    rows,
    columnWidths: [18, 18, 15, 15, 15, 12, 25, 15, 15, 20],
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
