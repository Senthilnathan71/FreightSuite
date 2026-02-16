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
  selector: 'app-comprehensive-management-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './comprehensive-management-report.component.html',
  styles: ``
})
export class ComprehensiveManagementReportComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  bookingRows: any[] = [];
  masterJobRows: any[] = [];
  houseJobRows: any[] = [];
  salesmanRows: any[] = [];
  customerRows: any[] = [];
  cashBankRows:any[] = [];
  vendorRows:any[] = [];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('Comprehensive Management Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('comprehensive-management').pdfOrientation;

    const bookingObj = this.fullData?.bookingDeptSummary;
    this.bookingRows = bookingObj ? Object.values(bookingObj) : [];

    const masterObj = this.fullData?.reportMap;
    this.masterJobRows = masterObj ? Object.values(masterObj) : [];

    const houseObj = this.fullData?.houseWithAllCal;
    this.houseJobRows = houseObj ? Object.values(houseObj) : [];

    const SalesmanObj = this.fullData?.salesmanSummary;
    this.salesmanRows = SalesmanObj ? Object.values(SalesmanObj) : [];

    this.salesmanRows = this.fullData?.salesmanSummary;
    this.groupByDepartment(this.salesmanRows);

    const CustomerObj = this.fullData?.customerRows;
    this.customerRows = CustomerObj ? Object.values(CustomerObj) : [];

    const VendorObj = this.fullData?.vendorRows;
    this.vendorRows = VendorObj ? Object.values(VendorObj) : [];

    const CashOrBank = this.fullData?.AllCashAndBank;
    this.cashBankRows = CashOrBank ? Object.values(CashOrBank) : [];
  }

  groupedSalesmanRows: any[] = [];

    groupByDepartment(data: any[]) {
      const map = new Map<number, any>();

      data.forEach(item => {
        if (!map.has(item.DepartmentMasterSid)) {
          map.set(item.DepartmentMasterSid, {
            DepartmentMasterSid: item.DepartmentMasterSid,
            DepartmentName: item.DepartmentName,
            salesmen: []
          });
        }
        map.get(item.DepartmentMasterSid).salesmen.push(item);
      });

      this.groupedSalesmanRows = Array.from(map.values());
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

    const rows: ExcelRow[] = [];
    rows.push({
      cells: [{ value: 'Comprehensive Management Report', colspan: 10 }],
      style: 'section'
    });

    rows.push({
      cells: [
        { value: `From Date : ${this.formatDate(this.params?.FromDate)}`, colspan: 5 },
        { value: `To Date : ${this.formatDate(this.params?.ToDate)}`, colspan: 5 }
      ],
      style: 'section'
    });

    rows.push({
      cells: [
        { value: `Branch : ${this.fullData?.branchesInvolved}`, colspan: 5 },
        { value: `Dept : ${this.fullData?.departmentInvolved}`, colspan: 5 }
      ],
      style: 'section'
    });

    rows.push({ cells: [{ value: '' }], style: 'section' });


    rows.push({
      cells: [{ value: 'Booking Details', colspan: 8 }],
      style: 'section'
    });

    rows.push({
      cells: [
        { value: 'Dept' },
        { value: 'No of Booking' },
        { value: 'Revenue' },
        { value: 'Cost' },
        { value: 'Profit' },
        { value: 'Gross Wt' },
        { value: 'Net Wt' },
        { value: 'CBM' }
      ],
      style: 'header'
    });

    (this.bookingRows || []).forEach(item => {
      rows.push({
        cells: [
          { value: item.dept },
          { value: item.totalBookings },
          { value: this.formatNumber(item.totalRevenue) },
          { value: this.formatNumber(item.totalCost) },
          { value: this.formatNumber(item.totalProfit) },
          { value: this.formatNumber(item.totalGrossWt) },
          { value: this.formatNumber(item.totalNetWt) },
          { value: this.formatNumber(item.totalVolume) }
        ],
        style: 'data'
      });
    });

    rows.push({ cells: [{ value: '' }], style: 'section' });


    rows.push({
      cells: [{ value: 'Master Job Details', colspan: 9 }],
      style: 'section'
    });

    rows.push({
      cells: [
        { value: 'Dept' },
        { value: 'No of Master Jobs' },
        { value: 'Revenue' },
        { value: 'Cost' },
        { value: 'Profit' },
        { value: 'Gross Wt' },
        { value: 'Net Wt' },
        { value: 'CBM' },
        { value: 'TEUs' }
      ],
      style: 'header'
    });

    (this.masterJobRows || []).forEach(item => {
      rows.push({
        cells: [
          { value: item.Department },
          { value: item.NoOfMasterJobs },
          { value: this.formatNumber(item.Revenue) },
          { value: this.formatNumber(item.Cost) },
          { value: this.formatNumber(item.Profit) },
          { value: this.formatNumber(item.GrossWeight) },
          { value: this.formatNumber(item.NetWeight) },
          { value: this.formatNumber(item.CBM) },
          { value: item.TEU || 0 }
        ],
        style: 'data'
      });
    });

    rows.push({ cells: [{ value: '' }], style: 'section' });


    rows.push({
      cells: [{ value: 'House Job Details', colspan: 8 }],
      style: 'section'
    });

    rows.push({
      cells: [
        { value: 'Dept' },
        { value: 'No of House Jobs' },
        { value: 'Revenue' },
        { value: 'Cost' },
        { value: 'Profit' },
        { value: 'Gross Wt' },
        { value: 'Net Wt' },
        { value: 'CBM' }
      ],
      style: 'header'
    });

    (this.houseJobRows || []).forEach(item => {
      rows.push({
        cells: [
          { value: item.Department },
          { value: item.NoOfHouseJobs },
          { value: this.formatNumber(item.Revenue) },
          { value: this.formatNumber(item.Cost) },
          { value: this.formatNumber(item.Profit) },
          { value: this.formatNumber(item.GrossWeight) },
          { value: this.formatNumber(item.NetWeight) },
          { value: this.formatNumber(item.CBM) }
        ],
        style: 'data'
      });
    });

    rows.push({ cells: [{ value: '' }], style: 'section' });


    rows.push({
      cells: [{ value: 'Salesman Performance', colspan: 7 }],
      style: 'section'
    });

    (this.groupedSalesmanRows || []).forEach(dept => {

      // Dept Header
      rows.push({
        cells: [{ value: dept.DepartmentName, colspan: 7 }],
        style: 'section'
      });

      // Table Header
      rows.push({
        cells: [
          { value: 'Salesman' },
          { value: 'Lead' },
          { value: 'Opportunity' },
          { value: 'Meetings' },
          { value: 'Enquiry' },
          { value: 'Quotation' },
          { value: 'Booking' }
        ],
        style: 'header'
      });

      // Salesman Rows
      dept.salesmen.forEach(item => {
        rows.push({
          cells: [
            { value: item.SalesmanName },
            { value: item.TotalLeads },
            { value: item.TotalOpportunity },
            { value: item.TotalMeetings },
            { value: item.TotalEnquiries },
            { value: item.TotalQuotations },
            { value: item.TotalBookings }
          ],
          style: 'data'
        });
      });

    });

    rows.push({ cells: [{ value: '' }], style: 'section' });

    rows.push({
      cells: [{ value: 'Customer Outstanding', colspan: 10 }],
      style: 'section'
    });

    rows.push({
      cells: [
        { value: 'Customer' },
        { value: 'Salesman' },
        { value: 'Total Outstanding' },
        { value: '0-30' },
        { value: '31-60' },
        { value: '61-90' },
        { value: '91-120' },
        { value: '120 & Above' },
        { value: 'Credit Days' },
        { value: 'Credit Limit' }
      ],
      style: 'header'
    });

    (this.customerRows || []).forEach(item => {
      rows.push({
        cells: [
          { value: item.SubledgerName },
          { value: item.SalesmanName },
          { value: this.formatNumber(item.TotalOutstanding) },
          { value: this.formatNumber(item.buckets['0-30']) },
          { value: this.formatNumber(item.buckets['31-60']) },
          { value: this.formatNumber(item.buckets['61-90']) },
          { value: this.formatNumber(item.buckets['91-120']) },
          { value: this.formatNumber(item.buckets['120 & Above']) },
          { value: item.CreditDays },
          { value: this.formatNumber(item.CreditLimit) }
        ],
        style: 'data'
      });
    });

    rows.push({ cells: [{ value: '' }], style: 'section' });

    rows.push({
      cells: [{ value: 'Vendor Outstanding', colspan: 9 }],
      style: 'section'
    });

    rows.push({
      cells: [
        { value: 'Vendor' },
        { value: 'Total Outstanding' },
        { value: '0-30' },
        { value: '31-60' },
        { value: '61-90' },
        { value: '91-120' },
        { value: '120 & Above' },
        { value: 'Credit Days' },
        { value: 'Credit Limit' }
      ],
      style: 'header'
    });

    (this.vendorRows || []).forEach(item => {
      rows.push({
        cells: [
          { value: item.SubledgerName },
          { value: this.formatNumber(item.TotalOutstanding) },
          { value: this.formatNumber(item.buckets['0-30']) },
          { value: this.formatNumber(item.buckets['31-60']) },
          { value: this.formatNumber(item.buckets['61-90']) },
          { value: this.formatNumber(item.buckets['91-120']) },
          { value: this.formatNumber(item.buckets['120 & Above']) },
          { value: item.CreditDays },
          { value: this.formatNumber(item.CreditLimit) }
        ],
        style: 'data'
      });
    });

    rows.push({ cells: [{ value: '' }], style: 'section' });

    rows.push({
      cells: [{ value: 'Cash and Bank', colspan: 4 }],
      style: 'section'
    });

    rows.push({
      cells: [
        { value: 'Account' },
        { value: 'Dr Amount' },
        { value: 'Cr Amount' },
        { value: 'Dr-Cr Balance' }
      ],
      style: 'header'
    });

    (this.cashBankRows || []).forEach(item => {
      rows.push({
        cells: [
          { value: item.SubledgerName },
          { value: this.formatNumber(item.DrAmount) },
          { value: this.formatNumber(item.CrAmount) },
          { value: this.formatNumber(item.Balance) }
        ],
        style: 'data'
      });
    });

    return {
      fileName: 'Comprehensive-Management-Report',
      sheetName: 'ComprehensiveReport',
      reportHeader: null,
      tableHeaders: [],
      rows,
      columnWidths: [25, 18, 18, 18, 18, 15, 15, 15, 15, 15]
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
