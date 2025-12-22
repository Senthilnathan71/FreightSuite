import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';

@Component({
  selector: 'app-profit-loss-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './profit-loss-report.component.html',
  styles: ``
})
export class ProfitLossReportComponent {


  currentCompany: any;
  currentBranch: any;
  groupedData: any[] = [];
  yearKeys: string[] = [];
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private reportRegistryService: ReportRegistryService
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('ageing-report').pdfOrientation;

    if (this.fullData?.profitLoss?.length) {

      this.yearKeys = Object.keys(this.fullData.profitLoss[0].amounts);


      const groups: { [key: string]: any[] } = {};
      this.fullData.profitLoss.forEach(item => {
        if (!groups[item.SubGroupName]) {
          groups[item.SubGroupName] = [];
        }
        groups[item.SubGroupName].push(item);
      });


      this.groupedData = Object.keys(groups).map(subGroupName => ({
        subGroupName,
        items: groups[subGroupName]
      }));
    }
  }

  getGroupTotal(items: any[], year: string): number {
    return items.reduce((sum, item) => sum + (item.amounts[year] || 0), 0);
  }

  //  Gross Profit: Total Income - Total Expenses
  getGrossProfit(year: string): number {
    const totalIncome = this.groupedData
      .filter(g => g.subGroupName.toLowerCase().includes('income'))
      .reduce((sum, group) => sum + this.getGroupTotal(group.items, year), 0);

    const totalExpenses = this.groupedData
      .filter(g => g.subGroupName.toLowerCase().includes('expense'))
      .reduce((sum, group) => sum + this.getGroupTotal(group.items, year), 0);

    return totalIncome - totalExpenses;
  }

  //  Net Profit: Gross Profit +  Income -  Expenses
  getNetProfit(year: string): number {
    const grossProfit = this.getGrossProfit(year);
    const totalIncome = this.groupedData
      .filter(g => g.subGroupName.toLowerCase().includes('income'))
      .reduce((sum, group) => sum + this.getGroupTotal(group.items, year), 0);

    const totalExpenses = this.groupedData
      .filter(g => g.subGroupName.toLowerCase().includes('expense'))
      .reduce((sum, group) => sum + this.getGroupTotal(group.items, year), 0);

    return grossProfit + totalIncome - totalExpenses;
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
}
