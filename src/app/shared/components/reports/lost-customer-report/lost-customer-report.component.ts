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
  selector: 'app-lost-customer-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './lost-customer-report.component.html',
  styles: ``
})
export class LostCustomerReportComponent {

  currentCompany: any;
  currentBranch: any;
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
    this.orientation = this.reportRegistryService.getReportConfig('lost-customer-report').pdfOrientation;
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
      { key: 'CustomerName', label: 'Customer Name' },
      { key: 'CustomerAddress', label: 'Address' },
      { key: 'ContactNo', label: 'Contact' },
      { key: 'BookingNo', label: 'Last Booking No' },
      { key: 'BookingDateTime', label: 'Last Booking Date' },
      { key: 'SalesmanName', label: 'Salesperson' },
      { key: 'GP', label: 'GP in last Booking' },
      { key: 'days', label: 'Days' }
    ];

    const rows: ExcelRow[] = (this.fullData?.data || []).map(item => ({
      cells: [
        { value: item.CustomerName || '' },
        { value: item.CustomerAddress || '' },
        { value: item.ContactNo || '' , alignment:{horizontal:'left'} },
        { value: item.BookingNo || '' },
        { value: this.formatDate(item.BookingDateTime) , alignment:{horizontal:'center'} },
        { value: item.SalesmanName || '' },
        { value: this.formatNumber(item.GP) ?? 0 },
        { value: item.days ?? 0 , alignment:{horizontal:'center'} }
      ],
      style: 'data'
    }));

    return {
      fileName: 'Lost-Customer-Report',
      sheetName: 'LostCustomer',
      reportHeader: {
        companyName: this.currentCompany?.companyName || '',
        reportTitle: `Lost Customer Report`,
        additionalInfo: [
          { label: 'Booking From Date', value: this.formatDate(this.params?.BookingFromDate) },
          { label: 'Booking To Date', value: this.formatDate(this.params?.BookingToDate) },
          { label: 'Branch', value: this.fullData?.branchInvolved || 'All' },
          { label: 'Dept', value: this.fullData?.departmentInvolved || 'All' },
          { label: 'Customer', value: this.fullData?.customerInvolved || 'All' }
        ]
      },
      tableHeaders,
      rows,
      columnWidths: [25, 25, 20, 24, 14, 14, 18, 12],
      notes: ['Shipper/Customer who has booking earlier but no booking has been given between From and To Booking Date.']
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
