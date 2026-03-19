import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';

@Component({
  selector: 'app-profit-loss-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
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
    console.log('Profit Loss Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('profit-loss').pdfOrientation;

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

  getGrossProfit(year: string): number {
    const totalIncome = this.groupedData
      .filter(g => g.subGroupName.toLowerCase().includes('income'))
      .reduce((sum, group) => sum + this.getGroupTotal(group.items, year), 0);

    const totalExpenses = this.groupedData
      .filter(g => g.subGroupName.toLowerCase().includes('expense'))
      .reduce((sum, group) => sum + this.getGroupTotal(group.items, year), 0);

    return Math.abs(totalIncome) - Math.abs(totalExpenses);
  }

  getNetProfit(year: string): number {
    const grossProfit = this.getGrossProfit(year);

    const indirectOtherIncome = this.groupedData
      .filter(g =>
        g.subGroupName &&
        g.subGroupName.toLowerCase().includes('income') &&
        (
          g.subGroupName.toLowerCase().includes('indirect') ||
          g.subGroupName.toLowerCase().includes('other')
        )
      )
      .reduce((sum, group) => sum + this.getGroupTotal(group.items, year), 0);

    const indirectOtherExpense = this.groupedData
      .filter(g =>
        g.subGroupName &&
        g.subGroupName.toLowerCase().includes('expense') &&
        (
          g.subGroupName.toLowerCase().includes('indirect') ||
          g.subGroupName.toLowerCase().includes('other')
        )
      )
      .reduce((sum, group) => sum + this.getGroupTotal(group.items, year), 0);

    return grossProfit + indirectOtherIncome - indirectOtherExpense;
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
  const yearKeys: string[] = this.yearKeys || [];

  // Table headers same as your HTML
  const tableHeaders: ExcelHeader[] = [
    { key: 'subgroup', label: 'SubGroup' },
    { key: 'ledger', label: 'Ledger' },
    ...yearKeys.map(y => ({ key: y, label: y }))
  ];

  const rows: ExcelRow[] = [];

  /* =======================
     REVENUE SECTION
  ======================== */
  rows.push({
    cells: [
      { value: 'REVENUE' , colspan:3},
    ],
    style: 'section'
  });

  this.groupedData
    .filter(g => g.subGroupName.toLowerCase().includes('income'))
    .forEach(group => {

      group.items.forEach((item, index) => {
        const cells: ExcelCell[] = [];

        if (index === 0) {
          cells.push({
            value: group.subGroupName,
            rowspan: group.items.length + 1,
            marginTop: Math.max(0, group.items.length * 8)
          }); // Subgroup
        } else {
          cells.push({ value: '' }); // placeholder row for rowspan
        }

        cells.push({ value: item.LedgerName }); // Ledger

        yearKeys.forEach(y => {
          cells.push({ value: this.formatNumber(item.amounts[y] ?? 0) });
        });

        rows.push({ cells, style: 'data' });
      });

      // Total row
      rows.push({
        cells: [
          { value: '' }, // blank for ledger
          { value: `Total ${group.subGroupName}` , alignment:{horizontal:'right'} },
          ...yearKeys.map(y => ({ value: this.formatNumber(this.getGroupTotal(group.items, y)) }))
        ],
        style: 'total'
      });
    });

  /* =======================
     EXPENSES SECTION
  ======================== */
  rows.push({
    cells: [
      { value: 'EXPENSES' , colspan:3},
    ],
    style: 'section'
  });

  this.groupedData
    .filter(g => g.subGroupName.toLowerCase().includes('expense'))
    .forEach(group => {

      group.items.forEach((item, index) => {
        const cells: ExcelCell[] = [];

        if (index === 0) {
          cells.push({
            value: group.subGroupName,
            rowspan: group.items.length + 1,
            marginTop: Math.max(0, group.items.length * 8)
          });
        } else {
          cells.push({ value: '' }); // placeholder row for rowspan
        }

        cells.push({ value: item.LedgerName });

        yearKeys.forEach(y => {
          cells.push({ value: this.formatNumber(item.amounts[y] ?? 0) });
        });

        rows.push({ cells, style: 'data' });
      });

      // Total row
      rows.push({
        cells: [
          { value: '' },
          { value: `Total ${group.subGroupName}` , alignment:{horizontal:'right'} },
          ...yearKeys.map(y => ({ value: this.formatNumber(this.getGroupTotal(group.items, y)) }))
        ],
        style: 'total'
      });
    });

  /* =======================
     GROSS PROFIT
  ======================== */
  rows.push({
    cells: [
      { value: 'Gross Profit' ,  colspan:2 , alignment:{horizontal:'right'} },
      ...yearKeys.map(y => ({ value: this.formatNumber(this.getGrossProfit(y)) }))
    ],
    style: 'grandTotal'
  });

  /* =======================
     NET PROFIT
  ======================== */
  rows.push({
    cells: [
      { value: 'Net Profit' , colspan:2 , alignment:{horizontal:'right'} },
      ...yearKeys.map(y => ({ value: this.formatNumber(this.getNetProfit(y)) }))
    ],
    style: 'grandTotal'
  });

  return {
    fileName: 'Profit-And-Loss-Report',
    sheetName: 'Profit & Loss',
    reportHeader: {
      companyName: this.currentCompany?.companyName || 'Company',
      reportTitle: 'Profit and Loss Report',
      additionalInfo: [
        { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
        { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
        { label: 'Branch', value: this.fullData?.BranchInvolved || '' }
      ]
    },
    sectionRowFillByText: {
      REVENUE: '#dceff4',
      EXPENSES: '#f2dcdc'
    },
    tableHeaders,
    rows,
    columnWidths: [
      20, // SubGroup
      30, // Ledger
      ...yearKeys.map(() => 18)
    ]
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
