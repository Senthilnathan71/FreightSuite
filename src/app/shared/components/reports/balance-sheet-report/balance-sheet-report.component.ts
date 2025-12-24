import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';

@Component({
  selector: 'app-balance-sheet-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './balance-sheet-report.component.html',
  styles: ``
})
export class BalanceSheetReportComponent {

  currentCompany: any;
  currentBranch: any;
  groupedData: any[] = [];
  orientation: 'portrait' | 'landscape' = 'portrait';
  sourceOfFundsProcessed: any[] = [];
  applicationOfFunds: any[] = [];
  applicationOfFundsProcessed: any[] = [];
  sourceCategoryTotal: number = 0;
  applicationCategoryTotal: number = 0;
  processedFunds: { category: string, items: any[], categoryTotal: number }[] = [];

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
    this.orientation = this.reportRegistryService.getReportConfig('balance-sheet').pdfOrientation;
    this.processFunds()
  }


processFunds() {
  if (!this.fullData?.data?.length) return;

  // Group by category
  const categoryMap = new Map<string, any[]>();
  this.fullData.data.forEach(item => {
    if (!categoryMap.has(item.category)) categoryMap.set(item.category, []);
    categoryMap.get(item.category).push(item);
  });

  this.processedFunds = [];

  categoryMap.forEach((items, category) => {
    const categoryTotal = items.reduce((sum, item) => sum + item.LocalAmt, 0);

    // Group by groupName
    const groupMap = new Map<string, any[]>();
    items.forEach(item => {
      const groupKey = item.groupName || '';
      if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
      groupMap.get(groupKey).push(item);
    });

    const processedItems: any[] = [];

    groupMap.forEach((groupItems, groupName) => {
      // Group by subgroupName inside group
      const subgroupMap = new Map<string, any[]>();
      groupItems.forEach(item => {
        const subKey = item.subgroupName || '';
        if (!subgroupMap.has(subKey)) subgroupMap.set(subKey, []);
        subgroupMap.get(subKey).push(item);
      });

      subgroupMap.forEach((subItems, subgroupName) => {
        subItems.forEach((item, index) => {
          processedItems.push({
            ...item,
            showGroup: index === 0 && groupItems[0] === subItems[0], // show group only for first in group
            showSubGroup: index === 0, // show subgroup only for first in subgroup
            groupRowSpan: groupItems.length,
            subGroupRowSpan: subItems.length
          });
        });
      });
    });

    this.processedFunds.push({
      category,
      items: processedItems,
      categoryTotal
    });
  });
}


  isFirstGroup(index: number, data: any[]): boolean {
    return index === 0 || data[index - 1].groupName !== data[index].groupName;
  }

  getGroupTotal(items: any[], year: string): number {
    return items.reduce((sum, item) => sum + (item.amounts[year] || 0), 0);
  }

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
