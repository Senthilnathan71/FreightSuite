import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-profit-summary',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
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


}
