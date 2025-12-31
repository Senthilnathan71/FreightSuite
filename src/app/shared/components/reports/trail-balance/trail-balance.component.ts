import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';

@Component({
  selector: 'app-trail-balance',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './trail-balance.component.html',
  styles: ``
})
export class TrailBalanceComponent {

  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  branchList: any[];
  groupedData: any[] = [];
  showSubTotal: boolean = false;
  COAList: any[] = [];
  
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private masterService: MasterService,
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

    get params(): any {
    return this.data?.parameters || {};
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    console.log(this.data);
    this.prepareGroupedData();
    this.loadBranchName()
    this.loadCOA(this.currentCompany?.CompanyMasterSid);
    this.showSubTotal = this.params?.showSubtotals === true;
  }


  loadBranchName(): void {
    if (!this.currentBranch?.BranchMasterSid) return;
    this.masterService.getAllBranches().subscribe({
      next: (response: any) => {
        console.log("Branch API response:", response);

        if (response) {
          this.branchList = response;
          console.log("Branch List:", this.branchList);
        }
      },
      error: (error) => {
        console.error("Failed to load branch:", error);
      }
    });
  }



  loadCOA(CompanyMasterSid: number): void {
    this.masterService.getAllCoa(CompanyMasterSid).subscribe({
      next: (response: any) => {
        console.log("Branch API response:", response);

        if (response) {
          this.COAList = response;
          console.log("Branch List:", this.COAList);
        }
      },
      error: (error) => {
        console.error("Failed to load branch:", error);
      }
    });
  }


  getBranchNameById(id: number): string {
    if (!id || !this.branchList?.length) return '';
    const branch = this.branchList.find(b => b.BranchMasterSid === id);
    return branch ? branch.branchName : '';
  }

  getGroupName(id: number): string {
    if (!id || !this.COAList?.length) return '';
    const group = this.COAList.find(b => b.COAMasterSid === id);
    return group ? group.GroupName : '';
  }

  getSubGroupName(id: number): string {
    if (!id || !this.COAList?.length) return '';
    const group = this.COAList.find(b => b.COAMasterSid === id);
    return group ? group.SubGroupName : '';
  }


prepareGroupedData(): void {
  const rawItems = this.data?.items || [];
  const items = Array.isArray(rawItems) ? rawItems : Object.values(rawItems);

  items.sort((a, b) => {
    const catA = categoryOrder[a.Category] || 99;
    const catB = categoryOrder[b.Category] || 99;

    return (
      catA - catB ||
      (a.GroupName || '').localeCompare(b.GroupName || '') ||
      (a.SubGroupName || '').localeCompare(b.SubGroupName || '') ||
      (a.LedgerName || '').localeCompare(b.LedgerName || '')
    );
  });

  const groups: any = {};

  items.forEach(item => {
    const sub = item.SubGroupName || 'NO SUBGROUP';

    if (!groups[sub]) {
      groups[sub] = {
        subGroupName: sub,
        items: [],
        totals: {
          OpeningDebit: 0,
          OpeningCredit: 0,
          CurrentDebit: 0,
          CurrentCredit: 0,
          ClosingDebit: 0,
          ClosingCredit: 0,
          ClosingNet: 0
        }
      };
    }

    groups[sub].items.push(item);

    groups[sub].totals.OpeningDebit += Number(item.OpeningDebit) || 0;
    groups[sub].totals.OpeningCredit += Number(item.OpeningCredit) || 0;
    groups[sub].totals.CurrentDebit += Number(item.CurrentDebit) || 0;
    groups[sub].totals.CurrentCredit += Number(item.CurrentCredit) || 0;
    groups[sub].totals.ClosingDebit += Number(item.ClosingDebit) || 0;
    groups[sub].totals.ClosingCredit += Number(item.ClosingCredit) || 0;
    groups[sub].totals.ClosingNet += Number(item.ClosingNet) || 0;
  });

  this.groupedData = Object.values(groups);
}


// prepareGroupedData(): void {
//   const rawItems = this.data?.items || [];
//   const items = Array.isArray(rawItems) ? rawItems : Object.values(rawItems);

//   // 1️⃣ DEFINE CUSTOM CATEGORY ORDER
//   const categoryOrder: Record<string, number> = {
//     Asset: 1,
//     Liability: 2,
//     Expense: 3,
//     Income: 4
//   };

//   // 2️⃣ SORT (Type → Group → SubGroup → Ledger)
//   items.sort((a, b) => {
//     // Category custom order
//     const catA = categoryOrder[a.Category] || 99; // unknown categories go last
//     const catB = categoryOrder[b.Category] || 99;

//     return (
//       catA - catB ||
//       (a.GroupName || '').localeCompare(b.GroupName || '') ||
//       (a.SubGroupName || '').localeCompare(b.SubGroupName || '') ||
//       (a.LedgerName || '').localeCompare(b.LedgerName || '')
//     );
//   });

//   // 3️⃣ ROWSPAN FLAGS (GLOBAL)
//   let lastCategory = '';
//   let lastGroup = '';
//   let lastSubGroup = '';

//   items.forEach(item => {
//     item.showType = false;
//     item.showGroup = false;
//     item.showSubGroup = false;

//     if (item.Category !== lastCategory) {
//       item.showType = true;
//       item.typeRowSpan = items.filter(x => x.Category === item.Category).length;
//       lastCategory = item.Category;
//       lastGroup = '';
//       lastSubGroup = '';
//     }

//     if (item.GroupName !== lastGroup) {
//       item.showGroup = true;
//       item.groupRowSpan = items.filter(
//         x => x.Category === item.Category && x.GroupName === item.GroupName
//       ).length;
//       lastGroup = item.GroupName;
//       lastSubGroup = '';
//     }

//     if (item.SubGroupName !== lastSubGroup) {
//       item.showSubGroup = true;
//       item.subGroupRowSpan = items.filter(
//         x =>
//           x.Category === item.Category &&
//           x.GroupName === item.GroupName &&
//           x.SubGroupName === item.SubGroupName
//       ).length;
//       lastSubGroup = item.SubGroupName;
//     }
//   });

//   // 4️⃣ GROUP BY SUBGROUP (FOR SUBTOTALS)
//   const subGroupMap: any = {};

//   items.forEach(item => {
//     const key = item.SubGroupName || 'NO SUBGROUP';

//     if (!subGroupMap[key]) {
//       subGroupMap[key] = {
//         subGroupName: key,
//         items: [],
//         totals: {
//           OpeningDebit: 0,
//           OpeningCredit: 0,
//           CurrentDebit: 0,
//           CurrentCredit: 0,
//           ClosingDebit: 0,
//           ClosingCredit: 0,
//           ClosingNet: 0
//         }
//       };
//     }

//     subGroupMap[key].items.push(item);

//     subGroupMap[key].totals.OpeningDebit += Number(item.OpeningDebit) || 0;
//     subGroupMap[key].totals.OpeningCredit += Number(item.OpeningCredit) || 0;
//     subGroupMap[key].totals.CurrentDebit += Number(item.CurrentDebit) || 0;
//     subGroupMap[key].totals.CurrentCredit += Number(item.CurrentCredit) || 0;
//     subGroupMap[key].totals.ClosingDebit += Number(item.ClosingDebit) || 0;
//     subGroupMap[key].totals.ClosingCredit += Number(item.ClosingCredit) || 0;
//     subGroupMap[key].totals.ClosingNet += Number(item.ClosingNet) || 0;
//   });

//   this.groupedData = Object.values(subGroupMap);
// }




  get fullData(): any {
    console.log(this.data, "DATA")
    return this.data || {};
  }




  get bucketLabels(): any {
    return this.fullData?.bucketLabels || [];
  }

  getTotal(data: any[], field: string): number {
    if (!data) return 0;
    return data.reduce((sum, item) => {
      const value = Number(item[field]) || 0;
      return sum + value;
    }, 0);
  }

  trackByCurrencyCode(index: number, group: any): string {
    return group.CurrencyCode;
  }

  trackBySubledger(index: number, sub: any): number {
    return sub.SubledgerMasterSid;
  }

  /**
   * Provide Excel data for export via report modal
   * Called by GenericReportModalComponent.downloadExcel()
   */
  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'type', label: 'Type' },
      { key: 'group', label: 'Group' },
      { key: 'subGroup', label: 'Sub Group' },
      { key: 'ledger', label: 'Ledger' },
      { key: 'openingDebit', label: 'Opening Debit' },
      { key: 'openingCredit', label: 'Opening Credit' },
      { key: 'currentDebit', label: 'Current Debit' },
      { key: 'currentCredit', label: 'Current Credit' },
      { key: 'closingDebit', label: 'Closing Debit' },
      { key: 'closingCredit', label: 'Closing Credit' },
      { key: 'closingNet', label: 'Closing Net Amount' }
    ];

    const rows: ExcelRow[] = [];
    const totalCols = tableHeaders.length;

    // Process each subgroup
    for (const group of this.groupedData) {
      // Ledger data rows
      for (const item of group.items || []) {
        const cells: ExcelCell[] = [
          { value: item.LedgerType || '' },
          { value: item.GroupName || '' },
          { value: item.SubGroupName || '' },
          { value: item.LedgerName || '' },
          { value: this.formatNumber(item.OpeningDebit) },
          { value: this.formatNumber(item.OpeningCredit) },
          { value: this.formatNumber(item.CurrentDebit) },
          { value: this.formatNumber(item.CurrentCredit) },
          { value: this.formatNumber(item.ClosingDebit) },
          { value: this.formatNumber(item.ClosingCredit) },
          { value: this.formatNumber(item.ClosingNet) }
        ];
        rows.push({ cells, style: 'data' });
      }

      // Subgroup total row
      const subTotalCells: ExcelCell[] = [
        { value: 'Total', colspan: 3 },
        { value: '' },
        { value: this.formatNumber(group.totals?.OpeningDebit) },
        { value: this.formatNumber(group.totals?.OpeningCredit) },
        { value: this.formatNumber(group.totals?.CurrentDebit) },
        { value: this.formatNumber(group.totals?.CurrentCredit) },
        { value: this.formatNumber(group.totals?.ClosingDebit) },
        { value: this.formatNumber(group.totals?.ClosingCredit) },
        { value: this.formatNumber(group.totals?.ClosingNet) }
      ];
      rows.push({ cells: subTotalCells, style: 'total' });
    }

    // Grand total row
    if (this.data?.grandTotal) {
      const grandTotalCells: ExcelCell[] = [
        { value: 'Grand Total', colspan: 3 },
        { value: '' },
        { value: this.formatNumber(this.data.grandTotal.TotalOpeningDebit) },
        { value: this.formatNumber(this.data.grandTotal.TotalOpeningCredit) },
        { value: this.formatNumber(this.data.grandTotal.TotalCurrentDebit) },
        { value: this.formatNumber(this.data.grandTotal.TotalCurrentCredit) },
        { value: this.formatNumber(this.data.grandTotal.TotalClosingDebit) },
        { value: this.formatNumber(this.data.grandTotal.TotalClosingCredit) },
        { value: this.formatNumber(this.data.grandTotal.Difference) }
      ];
      rows.push({ cells: grandTotalCells, style: 'grandTotal' });
    }

    return {
      fileName: 'Trail-Balance-Report',
      sheetName: 'TrailBalance',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Customer Trail Balance as on ${this.formatDate(this.params?.fromDate)}`,
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.fromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.toDate) },
          { label: 'Branch', value: this.getBranchNameById(this.params?.BranchMasterSid) || '' },
          { label: 'SubGroup Name', value: this.params?.SubGroupName || '' },
          { label: 'Group Name', value: this.getGroupName(this.params?.GroupName) || '' }
        ]
      },
      tableHeaders,
      rows,
      columnWidths: [10, 15, 15, 20, 15, 15, 15, 15, 15, 15, 18]
    };
  }

  /**
   * Format number for Excel display
   */
  private formatNumber(value: any): number | string {
    if (value === null || value === undefined) return '';
    const num = Number(value);
    return isNaN(num) ? '' : Number(num.toFixed(2));
  }

  /**
   * Format date for display
   */
  private formatDate(date: any): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch {
      return String(date);
    }
  }
}


const categoryOrder: Record<string, number> = {
  Asset: 1,
  Liability: 2,
  Expense: 3,
  Income: 4
};

