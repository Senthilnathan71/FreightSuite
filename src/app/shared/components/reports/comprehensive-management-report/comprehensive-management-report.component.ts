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
  selector: 'app-comprehensive-management-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent,PrintFooterComponent],
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
    // Define table headers for each section (we'll use the main one for structure)
    const tableHeaders: ExcelHeader[] = [
      { key: 'section', label: 'Comprehensive Management Report' }
    ];

    const rows: ExcelRow[] = [];



    rows.push({
      cells: [{ value: 'Booking Details', colspan: 8 }],
      style: 'section'
    });

    // Booking Details Header
    rows.push({
      cells: [
        { value: 'Dept' },
        { value: 'No of Booking' },
        { value: 'Revenue' },
        { value: 'Cost' },
        { value: 'Profit' },
        { value: 'Gross Wt' },
        { value: 'Net Wt' },
        { value: 'CBM' },
        { value: '', colspan: 2 }
      ],
      style: 'header'
    });

    // Booking Details Data
    if (this.bookingRows && this.bookingRows.length > 0) {
      this.bookingRows.forEach(item => {
        rows.push({
          cells: [
            { value: item.dept || '' },
            { value: item.totalBookings || 0 },
            { value: this.formatNumber(item.totalRevenue) },
            { value: this.formatNumber(item.totalCost) },
            { value: this.formatNumber(item.totalProfit) },
            { value: this.formatNumber(item.totalGrossWt) },
            { value: this.formatNumber(item.totalNetWt) },
            { value: this.formatNumber(item.totalVolume) },
            { value: '', colspan: 2 }
          ],
          style: 'data'
        });
      });
    } else {
      rows.push({
        cells: [{ value: 'No Record Found', colspan: 8 }, { value: '', colspan: 2 }],
        style: 'data'
      });
    }

    // Empty row for spacing
    rows.push({ cells: [{ value: '', colspan: 10 }], style: 'data' });

    // MASTER JOB DETAILS SECTION
    rows.push({
      cells: [{ value: 'Master Job Details', colspan: 9 }],
      style: 'section'
    });

    // Master Job Details Header
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
        { value: 'TEUs' },
        { value: '' }
      ],
      style: 'header'
    });

    // Master Job Details Data
    if (this.masterJobRows && this.masterJobRows.length > 0) {
      this.masterJobRows.forEach(item => {
        rows.push({
          cells: [
            { value: item.Department || '' },
            { value: item.NoOfMasterJobs || 0 },
            { value: this.formatNumber(item.Revenue) },
            { value: this.formatNumber(item.Cost) },
            { value: this.formatNumber(item.Profit) },
            { value: this.formatNumber(item.GrossWeight) },
            { value: this.formatNumber(item.NetWeight) },
            { value: this.formatNumber(item.CBM) },
            { value: item.TEU || 0 },
            { value: '' }
          ],
          style: 'data'
        });
      });
    } else {
      rows.push({
        cells: [{ value: 'No Record Found', colspan: 9 }, { value: '' }],
        style: 'data'
      });
    }

    // Empty row for spacing
    rows.push({ cells: [{ value: '', colspan: 10 }], style: 'data' });

    // HOUSE JOB DETAILS SECTION
    rows.push({
      cells: [{ value: 'House Job Details', colspan: 8 }],
      style: 'section'
    });

    // House Job Details Header
    rows.push({
      cells: [
        { value: 'Dept' },
        { value: 'No of House Jobs' },
        { value: 'Revenue' },
        { value: 'Cost' },
        { value: 'Profit' },
        { value: 'Gross Wt' },
        { value: 'Net Wt' },
        { value: 'CBM' },
        { value: '', colspan: 2 }
      ],
      style: 'header'
    });

    // House Job Details Data
    if (this.houseJobRows && this.houseJobRows.length > 0) {
      this.houseJobRows.forEach(item => {
        rows.push({
          cells: [
            { value: item.Department || '' },
            { value: item.NoOfHouseJobs || 0 },
            { value: this.formatNumber(item.Revenue) },
            { value: this.formatNumber(item.Cost) },
            { value: this.formatNumber(item.Profit) },
            { value: this.formatNumber(item.GrossWeight) },
            { value: this.formatNumber(item.NetWeight) },
            { value: this.formatNumber(item.CBM) },
            { value: '', colspan: 2 }
          ],
          style: 'data'
        });
      });
    } else {
      rows.push({
        cells: [{ value: 'No Record Found', colspan: 8 }, { value: '', colspan: 2 }],
        style: 'data'
      });
    }

    // Empty row for spacing
    rows.push({ cells: [{ value: '', colspan: 10 }], style: 'data' });

    // SALESMAN PERFORMANCE SECTION
    rows.push({
      cells: [{ value: 'Salesman Performance', colspan: 7 }],
      style: 'section'
    });

    if (this.groupedSalesmanRows && this.groupedSalesmanRows.length > 0) {
      this.groupedSalesmanRows.forEach(dept => {
        // Department Header
        rows.push({
          cells: [{ value: dept.DepartmentName || '', colspan: 7 }, { value: '', colspan: 3 }],
          style: 'section'
        });

        // Salesman Table Header
        rows.push({
          cells: [
            { value: 'Salesman' },
            { value: 'Lead' },
            { value: 'Opportunity' },
            { value: 'Meetings' },
            { value: 'Enquiry' },
            { value: 'Quotation' },
            { value: 'Booking' },
            { value: '', colspan: 3 }
          ],
          style: 'header'
        });

        // Salesman Data Rows
        dept.salesmen.forEach(item => {
          rows.push({
            cells: [
              { value: item.SalesmanName || '' },
              { value: item.TotalLeads || 0 },
              { value: item.TotalOpportunity || 0 },
              { value: item.TotalMeetings || 0 },
              { value: item.TotalEnquiries || 0 },
              { value: item.TotalQuotations || 0 },
              { value: item.TotalBookings || 0 },
              { value: '', colspan: 3 }
            ],
            style: 'data'
          });
        });
      });
    } else {
      rows.push({
        cells: [{ value: 'No Record Found', colspan: 7 }, { value: '', colspan: 3 }],
        style: 'data'
      });
    }

    // Empty row for spacing
    rows.push({ cells: [{ value: '', colspan: 10 }], style: 'data' });

    // CUSTOMER OUTSTANDING SECTION
    rows.push({
      cells: [{ value: 'Customer Outstanding', colspan: 10 }],
      style: 'section'
    });

    // Customer Outstanding Header
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

    // Customer Outstanding Data
    if (this.customerRows && this.customerRows.length > 0) {
      this.customerRows.forEach(item => {
        rows.push({
          cells: [
            { value: item.SubledgerName || '' },
            { value: item.SalesmanName || '' },
            { value: this.formatNumber(item.TotalOutstanding) },
            { value: this.formatNumber(item.buckets?.['0-30']) },
            { value: this.formatNumber(item.buckets?.['31-60']) },
            { value: this.formatNumber(item.buckets?.['61-90']) },
            { value: this.formatNumber(item.buckets?.['91-120']) },
            { value: this.formatNumber(item.buckets?.['120 & Above']) },
            { value: item.CreditDays || 0 },
            { value: this.formatNumber(item.CreditLimit) }
          ],
          style: 'data'
        });
      });
    } else {
      rows.push({
        cells: [{ value: 'No Record Found', colspan: 10 }],
        style: 'data'
      });
    }

    // Empty row for spacing
    rows.push({ cells: [{ value: '', colspan: 10 }], style: 'data' });

    // VENDOR OUTSTANDING SECTION
    rows.push({
      cells: [{ value: 'Vendor Outstanding', colspan: 9 }],
      style: 'section'
    });

    // Vendor Outstanding Header
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
        { value: 'Credit Limit' },
        { value: '' }
      ],
      style: 'header'
    });

    // Vendor Outstanding Data
    if (this.vendorRows && this.vendorRows.length > 0) {
      this.vendorRows.forEach(item => {
        rows.push({
          cells: [
            { value: item.SubledgerName || '' },
            { value: this.formatNumber(item.TotalOutstanding) },
            { value: this.formatNumber(item.buckets?.['0-30']) },
            { value: this.formatNumber(item.buckets?.['31-60']) },
            { value: this.formatNumber(item.buckets?.['61-90']) },
            { value: this.formatNumber(item.buckets?.['91-120']) },
            { value: this.formatNumber(item.buckets?.['120 & Above']) },
            { value: item.CreditDays || 0 },
            { value: this.formatNumber(item.CreditLimit) },
            { value: '' }
          ],
          style: 'data'
        });
      });
    } else {
      rows.push({
        cells: [{ value: 'No Record Found', colspan: 9 }, { value: '' }],
        style: 'data'
      });
    }

    // Empty row for spacing
    rows.push({ cells: [{ value: '', colspan: 10 }], style: 'data' });

    // CASH AND BANK SECTION
    rows.push({
      cells: [{ value: 'Cash and Bank', colspan: 4 }],
      style: 'section'
    });

    // Cash and Bank Header
    rows.push({
      cells: [
        { value: 'Account' },
        { value: 'Dr Amount' },
        { value: 'Cr Amount' },
        { value: 'Dr-Cr Balance' },
        { value: '', colspan: 6 }
      ],
      style: 'header'
    });

    // Cash and Bank Data
    if (this.cashBankRows && this.cashBankRows.length > 0) {
      this.cashBankRows.forEach(item => {
        rows.push({
          cells: [
            { value: item.LedgerName || '' },
            { value: this.formatNumber(item.DrAmount) },
            { value: this.formatNumber(item.CrAmount) },
            { value: this.formatNumber(item.Balance) },
            { value: '', colspan: 6 }
          ],
          style: 'data'
        });
      });
    } else {
      rows.push({
        cells: [{ value: 'No Record Found', colspan: 4 }, { value: '', colspan: 6 }],
        style: 'data'
      });
    }

    return {
      fileName: 'Comprehensive-Management-Report',
      sheetName: 'ComprehensiveReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: 'Comprehensive Management Report',
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Branch', value: this.fullData?.branchesInvolved || '' },
          { label: 'Department', value: this.fullData?.departmentInvolved || '' }
        ]
      },
      tableHeaders,
      rows,
      columnWidths: [25, 18, 18, 18, 18, 15, 15, 15, 15, 15],
      notes: ['Comprehensive management report including booking details, master/house job details, salesman performance, customer/vendor outstanding, and cash/bank information.']
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
