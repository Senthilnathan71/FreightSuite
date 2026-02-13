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
  selector: 'app-unbilled-revenue-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './unbilled-revenue-report.component.html',
  styles: ``
})
export class UnbilledRevenueReportComponent {
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
    this.orientation = this.reportRegistryService.getReportConfig('unbilled-revenue-report').pdfOrientation;
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

    const isDetail = this.viewMode === 'detail';

    // ================= HEADERS =================
    const tableHeaders: ExcelHeader[] = isDetail
      ? [
        { key: 'screen', label: 'Screen' },
        { key: 'branchName', label: 'Branch' },
        { key: 'dept', label: 'Dept' },
        { key: 'MBLNo', label: 'MBL No.' },
        { key: 'HBLNo', label: 'HBL No.' },
        { key: 'jobStatus', label: 'Job Status' },
        { key: 'bookingNo', label: 'Booking No' },
        { key: 'chargeName', label: 'Charge Name' },
        { key: 'PPCC', label: 'PP/CC' },
        { key: 'RevenueDrCr', label: 'Dr/Cr' },
        { key: 'RevenueAmount', label: 'Amount' },
        { key: 'RevenueLocalAmt', label: 'Local Amount' },
        { key: 'partyName', label: 'Party' }
      ]
      : [
        { key: 'screen', label: 'Screen' },
        { key: 'branchName', label: 'Branch' },
        { key: 'dept', label: 'Dept' },
        { key: 'MBLNo', label: 'MBL No.' },
        { key: 'HBLNo', label: 'HBL No.' },
        { key: 'jobStatus', label: 'Job Status' },
        { key: 'bookingNo', label: 'Booking No' },
        { key: 'RevenueAmount', label: 'Amount' },
        { key: 'RevenueLocalAmt', label: 'Local Amount' },
        { key: 'partyName', label: 'Party' }
      ];

    // ================= ROWS =================
    const rows: ExcelRow[] = [];

    (this.fullData?.data || []).forEach(item => {

      // ---------- HOUSE ----------
      if (item.costRevenueDetails?.length) {
        item.costRevenueDetails.forEach((cr: any) => {
          rows.push({
            style: 'data',
            cells: isDetail
              ? [
                { value: 'House' },
                { value: item.branchName || '' },
                { value: item.houseDept || '' },
                { value: item.MBLNo || '' },
                { value: item.HBLNo || '' },
                { value: item.houseStatus || '' },
                { value: item.bookingNo || '' },
                { value: cr.chargeName || '' },
                { value: item.PPCC || '' },
                { value: cr.RevenueDrCr || '' },
                { value: this.formatNumber(cr.RevenueAmount) || 0 },
                { value: this.formatNumber(cr.RevenueLocalAmt) || 0 },
                { value: cr.partyName || '' }
              ]
              : [
                { value: 'House' },
                { value: item.branchName || '' },
                { value: item.houseDept || '' },
                { value: item.MBLNo || '' },
                { value: item.HBLNo || '' },
                { value: item.houseStatus || '' },
                { value: item.bookingNo || '' },
                { value: this.formatNumber(cr.RevenueAmount) || 0 },
                { value: this.formatNumber(cr.RevenueLocalAmt) || 0  },
                { value: cr.partyName || '' }
              ]
          });
        });
      }

      // ---------- MASTER ----------
      if (item.masterCrDetails?.length) {
        item.masterCrDetails.forEach((cr: any) => {
          rows.push({
            style: 'data',
            cells: isDetail
              ? [
                { value: 'Master' },
                { value: item.branchName || '' },
                { value: item.masterDept || '' },
                { value: item.MBLNo || '' },
                { value: '' },
                { value: '' },
                { value: item.bookingNo || '' },
                { value: cr.chargeName || '' },
                { value: '' },
                { value: cr.RevenueDrCr || '' },
                { value: this.formatNumber(cr.RevenueAmount) || 0 },
                { value: this.formatNumber(cr.RevenueLocalAmt) || 0  },
                { value: cr.partyName || '' }
              ]
              : [
                { value: 'Master' },
                { value: item.branchName || '' },
                { value: item.masterDept || '' },
                { value: item.MBLNo || '' },
                { value: '' },
                { value: '' },
                { value: item.bookingNo || '' },
                { value: this.formatNumber(cr.RevenueAmount) || 0  },
                { value: this.formatNumber(cr.RevenueLocalAmt) || 0  },
                { value: cr.partyName || '' }
              ]
          });
        });
      }

      // ---------- BOOKING ----------
      if (!item.costRevenueDetails && !item.masterCrDetails) {
        rows.push({
          style: 'data',
          cells: isDetail
            ? [
              { value: 'Booking' },
              { value: item.branchName || '' },
              { value: item.dept || '' },
              { value: '' },
              { value: item.HBLno || '' },
              { value: '' },
              { value: item.bookingNo || '' },
              { value: item.chargeName || '' },
              { value: item.FreightTerm || '' },
              { value: item.ReveuneDrCr || '' },
              { value: this.formatNumber(item.RevenueAmount) || 0 },
              { value: this.formatNumber(item.RevenueLocalAmount) || 0  },
              { value: item.partyName || '' }
            ]
            : [
              { value: 'Booking' },
              { value: item.branchName || '' },
              { value: item.dept || '' },
              { value: '' },
              { value: item.HBLno || '' },
              { value: '' },
              { value: item.bookingNo || '' },
              { value: this.formatNumber(item.RevenueAmount) || 0 },
              { value: this.formatNumber(item.RevenueLocalAmount) || 0 },
              { value: item.partyName || '' }
            ]
        });
      }
    });

    // ================= COLUMN WIDTHS =================
    const columnWidths = isDetail
      ? [8, 12, 10, 12, 12, 12, 12, 15, 8, 8, 12, 12, 15]
      : [8, 12, 10, 12, 12, 12, 12, 12, 12, 15];

    // ================= RETURN =================
    return {
      fileName: 'Unbilled-Revenue-Report',
      sheetName: isDetail ? 'Detail' : 'Summary',

      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Unbilled Revenue Report (${isDetail ? 'Detail' : 'Summary'})`,
        additionalInfo: [
           { label: 'From Date', value: this.formatDate(this.params?.FromDt) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDt) },
          { label: 'Branch', value: this.fullData?.branchInvoled || '' },
          { label: 'Dept', value: this.fullData?.departmentNames || '' }
        ]
      },

      tableHeaders,
      rows,
      columnWidths
    };
  }
  private formatNumber(value: any): string {
    if (value === null || value === undefined) return '';

    const num = Number(value);
    return isNaN(num) ? '' : num.toFixed(2);
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
