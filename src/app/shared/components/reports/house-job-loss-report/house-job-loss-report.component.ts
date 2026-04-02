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
  selector: 'app-house-job-loss-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent,PrintFooterComponent],
  templateUrl: './house-job-loss-report.component.html',
  styles: ``
})
export class HouseJobLossReportComponent {


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
    this.orientation = this.reportRegistryService.getReportConfig('house-job-loss-report').pdfOrientation;
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
      { key: 'JobNo', label: 'Job No' },
      { key: 'JobDate', label: 'Job Date' },
      { key: 'Dept', label: 'Dept' },
      { key: 'MBLNo', label: 'MBL No' },
      { key: 'HBLNo', label: 'HBL No' },
      { key: 'HouseStatus', label: 'House Status' },
      { key: 'JobType', label: 'Job Type' },
      { key: 'Customer', label: 'Customer' },
      { key: 'VslVoy', label: 'Vsl / Voy' },
      { key: 'OriginAgent', label: 'Origin Agent' },
      { key: 'DestinationAgent', label: 'Destination Agent' },
      { key: 'Revenue', label: 'Revenue' },
      { key: 'Cost', label: 'Cost' },
      { key: 'GP', label: 'GP' },
      { key: 'GPPercent', label: 'GP %' }
    ];

   
    const rows: ExcelRow[] = (this.fullData?.data || []).map(item => ({
      cells: [
        { value: item.HouseNo || '' },
        { value: this.formatDate(item.jobDate) , alignment:{horizontal:'center'} },
        { value: item.houseDept || '' , alignment:{horizontal:'center'} },
        { value: item.MBLNo || '' , alignment:{horizontal:'left'} },
        { value: item.HBLNo || '' , alignment:{horizontal:'left'} },
        { value: item.houseStatus || '' },
        { value: item.jobType || '' , alignment:{horizontal:'center'} },
        { value: item.customerName || '' },

        {
          value: `${item.vesselName || ''}${item.vesselName && item.voyNo ? ' / ' : ''
            }${item.voyNo || ''}` , alignment:{horizontal:'left'}
        },

        { value: item.originAgent || '' },
        { value: item.destinationAgent || '' },

        
        { value: this.formatNumber(item.costRevenueDetails?.RevenueLocalAmount || 0) },
        { value: this.formatNumber(item.costRevenueDetails?.CostLocalAmount || 0) },
        { value: this.formatNumber(item.costRevenueDetails?.Profit || 0) },
        { value: this.formatNumber(item.costRevenueDetails?.GP || 0) + '%' }
      ],
      style: 'data'
    }));

   
    return {
      fileName: 'House-Job-Loss-Report',
      sheetName: 'HouseJobLoss',

      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `House Job Loss Report`,

        additionalInfo: [
          { label: 'HBL From Date', value: this.formatDate(this.params?.FromHblDt) },
          { label: 'HBL To Date', value: this.formatDate(this.params?.ToHblDt) },
          { label: 'Branch', value: this.fullData?.branchInvoled || '' },
          { label: 'Dept', value: this.fullData?.departmentNames || '' },
          { label: 'Customer', value: this.fullData?.Customer || '' }
        ]
      },

      tableHeaders,
      rows,
      columnWidths: [15, 15, 15, 15, 15, 18, 12, 25, 18, 20, 20, 15, 15, 15, 12]
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
}
