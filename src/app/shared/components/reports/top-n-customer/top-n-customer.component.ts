import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-top-n-customer',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './top-n-customer.component.html',
  styles: ``
})
export class TopNCustomerComponent {

  currentCompany: any;
  currentBranch: any;
  selectedData: any[];
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
    this.orientation = this.reportRegistryService.getReportConfig('top-n-customer').pdfOrientation;
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
      { key: 'customer', label: 'Customer' },
      { key: 'gp', label: 'GP' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'volume', label: 'Volume' },
      { key: 'weight', label: 'Weight' },
      { key: 'volumeWt', label: 'Volume Wt' },
      { key: 'chargeableWt', label: 'Chargeable Wt' },
      { key: 'noOfHouse', label: 'No of House' }
    ];

    const rows: ExcelRow[] = [];

    const data = this.fullData?.data || [];

    data.forEach(item => {
      if (!item.customerSummary || !item.customerSummary.length) return;

      item.customerSummary.forEach(cust => {
        const cells: ExcelCell[] = [
          { value: cust.customerName || '' },
          { value: this.formatNumber(cust.GP) },
          { value: this.formatNumber(cust.totalRevenue) },
          { value: this.formatNumber(item.Vol) },
          { value: this.formatNumber(item.Weight) },
          { value: this.formatNumber(item.netwt) },
          { value: this.formatNumber(item.chargeable) },
          { value: item.noOfShipment || 0 }
        ];

        rows.push({ cells, style: 'data' });
      });
    });

    return {
      fileName: 'Top-N-Customer-Report',
      sheetName: 'Top N Customer',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Top N Customer Report`,
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Branch', value: this.fullData?.branchNames || '' },
          { label: 'Dept', value: this.fullData?.departmentNames || '' },
          { label: 'Top N', value: this.params?.TopN || '' }
        ]
      },
      tableHeaders,
      rows,
      columnWidths: [30, 15, 15, 15, 15, 18, 18, 15]
    };
  }

  private formatNumber(value: any): number | string {
    if (value === null || value === undefined) return '';
    const num = Number(value);
    return isNaN(num) ? '' : Number(num.toFixed(2));
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
