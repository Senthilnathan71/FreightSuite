import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';

@Component({
  selector: 'app-balance-sheet-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent,PrintFooterComponent],
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

  get retainedEarning(): number {
    const retained = this.data?.retained;

    if (typeof retained === 'number') {
      return Number(retained) || 0;
    }

    if (retained && typeof retained === 'object') {
      const retainedValue = retained?.netProfit ?? retained?.amount ?? retained?.value;
      return Number(retainedValue) || 0;
    }

    return (this.data?.incomeTotal || 0) - (this.data?.expenseTotal || 0);
  }

  get sourceOfFundsCategories(): any[] {
    return (this.processedFunds || []).filter(cat => cat.category !== 'Asset');
  }

  get assetCategories(): any[] {
    return (this.processedFunds || []).filter(cat => cat.category === 'Asset');
  }

  get totalSourceOfFunds(): number {
    return this.retainedEarning + this.sourceOfFundsCategories.reduce((sum, cat) => sum + (cat.categoryTotal || 0), 0);
  }

  get totalApplicationOfFunds(): number {
    return this.assetCategories.reduce((sum, cat) => sum + (cat.categoryTotal || 0), 0);
  }

  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'LGroup', label: '' },
      { key: 'LSubGroup', label: '' },
      { key: 'LLedger', label: '' },
      { key: 'LBalance', label: '' },
      { key: 'Gap', label: '' },
      { key: 'RGroup', label: '' },
      { key: 'RSubGroup', label: '' },
      { key: 'RLedger', label: '' },
      { key: 'RBalance', label: '' }
    ];

    const rows: ExcelRow[] = [];
    const retainedEarning = this.retainedEarning;
    const nonAssetCategories = this.sourceOfFundsCategories;
    const assetCategories = this.assetCategories;
    const panelHeaderCells: ExcelCell[] = [
      { value: 'Group', alignment: { horizontal: 'center' } },
      { value: 'SubGroup', alignment: { horizontal: 'center' } },
      { value: 'Ledger', alignment: { horizontal: 'center' } },
      { value: 'Balance', alignment: { horizontal: 'center' } }
    ];

    const leftRows: ExcelRow[] = [];
    const rightRows: ExcelRow[] = [];

    const pushPanelCategoryRows = (target: ExcelRow[], cat: any): void => {
      target.push({ cells: [{ value: cat.category, colspan: 4 }], style: 'section' });
      (cat.items || []).forEach((item: any) => {
        target.push({
          cells: [
            item.showGroup
              ? {
                  value: item.groupName || '',
                  rowspan: item.groupRowSpan || 1,
                  marginTop: Math.max(0, ((item.groupRowSpan || 1) - 1) * 8)
                }
              : { value: '' },
            item.showSubGroup
              ? {
                  value: item.subgroupName || '',
                  rowspan: item.subGroupRowSpan || 1,
                  marginTop: Math.max(0, ((item.subGroupRowSpan || 1) - 1) * 8)
                }
              : { value: '' },
            { value: item.ledgerName || '' },
            { value: this.formatNumber(item.LocalAmt), alignment: { horizontal: 'right' } }
          ],
          style: 'data'
        });
      });

      target.push({
        cells: [
          { value: 'Category Total', colspan: 3, alignment: { horizontal: 'right' } },
          { value: this.formatNumber(cat.categoryTotal), alignment: { horizontal: 'right' } }
        ],
        style: 'total'
      });
    };

    // Build LEFT panel rows (Source of Funds side)
    leftRows.push({ cells: [{ value: 'Source of Funds', colspan: 4 }], style: 'section' });
    leftRows.push({ cells: [{ value: 'Equity', colspan: 4 }], style: 'section' });
    leftRows.push({ cells: panelHeaderCells, style: 'header' });
    leftRows.push({
      cells: [
        { value: 'Reserve & Surplus' },
        { value: 'Retained Earning' },
        { value: '{{retainedEarningLabel}}' },
        { value: this.formatNumber(retainedEarning), alignment: { horizontal: 'right' } }
      ],
      style: 'data'
    });
    leftRows.push({
      cells: [
        { value: 'Category Total', colspan: 3, alignment: { horizontal: 'right' } },
        { value: this.formatNumber(retainedEarning), alignment: { horizontal: 'right' } }
      ],
      style: 'total'
    });

    nonAssetCategories.forEach(cat => {
      pushPanelCategoryRows(leftRows, cat);
    });

    // Build RIGHT panel rows (Application of Funds side)
    rightRows.push({ cells: [{ value: 'Application of Funds', colspan: 4 }], style: 'section' });
    rightRows.push({ cells: [{ value: 'Asset', colspan: 4 }], style: 'section' });
    rightRows.push({ cells: panelHeaderCells, style: 'header' });
    assetCategories.forEach(cat => {
      pushPanelCategoryRows(rightRows, cat);
    });

    leftRows.push({
      cells: [
        { value: 'Total Source of Funds', colspan: 3, alignment: { horizontal: 'right' } },
        { value: this.formatNumber(this.totalSourceOfFunds), alignment: { horizontal: 'right' } }
      ],
      style: 'grandTotal'
    });

    rightRows.push({
      cells: [
        { value: 'Total Application of Funds', colspan: 3, alignment: { horizontal: 'right' } },
        { value: this.formatNumber(this.totalApplicationOfFunds), alignment: { horizontal: 'right' } }
      ],
      style: 'grandTotal'
    });

    // Merge left and right panel rows into one "flex-like" Excel sheet
    const emptyPanelCells: ExcelCell[] = Array.from({ length: 4 }, () => ({
      value: '',
      border: [false, false, false, false],
      fillColor: '#ffffff'
    }));
    const totalRows = Math.max(leftRows.length, rightRows.length);

    for (let i = 0; i < totalRows; i++) {
      const left = leftRows[i];
      const right = rightRows[i];
      const leftCells = left?.cells || emptyPanelCells;
      const rightCells = right?.cells || emptyPanelCells;
      const mergedStyle =
        left?.style === right?.style
          ? left?.style
          : (left?.style === 'data' || right?.style === 'data' ? 'data' : 'section');

      rows.push({
        cells: [
          ...leftCells,
          { value: '', border: [false, false, false, false], fillColor: '#ffffff' },
          ...rightCells
        ],
        style: mergedStyle || 'data'
      });
    }

    return {
      fileName: 'Balance-Sheet-Report',
      sheetName: 'BalanceSheet',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: 'Balance Sheet Report',
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Branch', value: this.fullData?.branchInvolved || 'All' }
        ]
      },
      includeTableHeaders: false,
      suppressSectionBorders: true,
      suppressSectionBordersByText: ['Source of Funds', 'Application of Funds'],
      tableHeaders,
      rows,
      columnWidths: [16, 16, 20, 14, 0.3, 16, 16, 20, 14]
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

get retainedEarningLabel(): string {
  const toDate = this.params?.ToDate;
  if (!toDate) return 'Retained Earning';

  const year = new Date(toDate).getFullYear();
  return `Retained Earning ${year}`;
}

}
