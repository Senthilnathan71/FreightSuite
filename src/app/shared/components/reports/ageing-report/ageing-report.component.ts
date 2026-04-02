import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ComplexReportExportConfig, ExcelCell, ExcelHeader, ExcelRow } from 'src/app/shared/excel-report-service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { PrintFooterComponent } from '../../print-footer/print-footer.component';

@Component({
  selector: 'app-ageing-report',
  standalone: true,
  imports: [
    CommonModule,
    CustomDatePipe,
    PrintHeaderComponent,
    PrintFooterComponent
  ],
  templateUrl: './ageing-report.component.html',
  styles: ``
})
export class AgeingReportComponent implements OnInit{

  currentCompany : any;
  currentBranch : any;
  orientation : 'portrait' | 'landscape' = 'portrait';

  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService : AppSettingsService,
    private reportRegistryService : ReportRegistryService
  ) { 
    console.log('Ageing Report Data:', this.data);
  }

  get fullData() : any {
    return this.data || {};
  }

  get params() : any {
    return this.data?.params || {};
  }
  
  get bucketLabels() : any{
    return this.fullData?.bucketLabels || [];
  }

  get ageingResults() : any {
    return this.data?.ageingResult || [];
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig('ageing-report').pdfOrientation;
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
    const buckets = this.bucketLabels || [];

    // Build table headers dynamically based on bucket labels
    const tableHeaders: ExcelHeader[] = [
      { key: 'subledger', label: 'Subledger' },
      { key: 'osLocal', label: 'OS in Local' },
      { key: 'osCurr', label: 'OS in Curr' },
      ...buckets.map((label: string) => ({ key: label, label: label })),
      { key: 'onAccLocal', label: 'On Acc Local' },
      { key: 'onAccCurr', label: 'On Acc Curr' },
      { key: 'creditDays', label: 'Credit Days' },
      { key: 'creditLimit', label: 'Credit Limit' }
    ];

    const rows: ExcelRow[] = [];
    const totalCols = tableHeaders.length;

    // Process each currency group
    for (const group of this.ageingResults) {
      // Currency header row (only if CurrencyWise is enabled)
      if (this.params?.CurrencyWise) {
        rows.push({
          cells: [{ value: `Curr : ${group.CurrencyCode || 'N/A'}`, colspan: totalCols }],
          style: 'section'
        });
      }

      // Subledger data rows
      for (const sub of group.subledgers || []) {
        const cells: ExcelCell[] = [
          { value: sub.SubledgerName || '' },
          { value: this.formatNumber(sub.totalOutstandingLocal) },
          { value: this.formatNumber(sub.totalOutstandingCurrency) },
          ...buckets.map((label: string) => ({
            value: this.formatNumber(sub.buckets?.[label] || 0)
          })),
          { value: this.formatNumber(sub.totalOnAccountCreditLocal) },
          { value: this.formatNumber(sub.totalOnAccountCreditCurr) },
          { value: sub.CreditDays ?? 0 },
          { value: sub.CreditLimit ?? 0 }
        ];
        rows.push({ cells, style: 'data' });
      }

      // Currency total row
      const totalCells: ExcelCell[] = [
        { value: 'Total' },
        { value: this.formatNumber(group.totalOutstandingLocal) },
        { value: this.formatNumber(group.totalOutstandingCurrency) },
        ...buckets.map((label: string) => ({
          value: this.formatNumber(group.bucketTotals?.[label] || 0)
        })),
        { value: this.formatNumber(group.totalOnAccountCreditLocal) },
        { value: this.formatNumber(group.totalOnAccountCreditCurr) },
        { value: '' },
        { value: '' }
      ];
      rows.push({ cells: totalCells, style: 'total' });
    }

    // Grand total row
    const grandTotalCells: ExcelCell[] = [
      { value: 'Grand Total' },
      { value: this.formatNumber(this.fullData?.grandTotalLocal) },
      ...Array(totalCols - 2).fill(null).map(() => ({ value: '' }))
    ];
    rows.push({ cells: grandTotalCells, style: 'grandTotal' });

    return {
      fileName: 'Ageing-Report',
      sheetName: 'AgeingReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Customer Ageing`,
        additionalInfo: [
          { label: 'To Date', value: this.formatDate(this.fullData?.concludedUpto) },
          { label: 'Branch', value: this.fullData?.branchInvolvedText || '' },
          { label: 'Ledger', value: this.fullData?.LedgerName || '' }
        ]
      },
      tableHeaders,
      rows,
      columnWidths: [25, 15, 15, ...buckets.map(() => 12), 15, 15, 12, 12],
      notes: [
        'Credit Days and Credit Limit are taken from Customer Credit Request. If multiple branches exist, then branch with the highest credit limit is considered.',
        'Advance amounts are not included in the ageing buckets. they are recorded under On Account.'
      ]
    };
  }

  /**
   * Format number for Excel display
   */
 private formatNumber(value: any): string {
  if (value === null || value === undefined) return '';

  const num = Number(value);
  if (isNaN(num)) return '';

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
