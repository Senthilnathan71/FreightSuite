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
  selector: 'app-outstanding-report',
  standalone: true,
  imports: [CustomDatePipe, CommonModule,PrintHeaderComponent],
  templateUrl: './outstanding-report.component.html',
  styles: ``
})
export class OutstandingReportComponent {


  currentCompany: any;
  currentBranch: any;
  salesmanList: any[];
  orientation : 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private reportRegistryService : ReportRegistryService
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.loadSalesPerson();
    this.orientation = this.reportRegistryService.getReportConfig('outstanding-report').pdfOrientation;
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

  getTotal(data: any[], field: string): number {
    if (!data) return 0;

    return data.reduce((sum, item) => {
      const value = Number(item[field]) || 0;
      return sum + value;
    }, 0);
  }

  loadSalesPerson(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.leadService.getAllSalesman(CompanyMasterSid).subscribe(
      (resp: any) => {
        console.log(resp, 'SalesPerson')
        this.salesmanList = resp;
        console.log(this.salesmanList, "SALESMAN LIST")
      });
  }

  getSalesmanById(id: number) {
    if (!id || !this.salesmanList.length) return;
    const user = this.salesmanList.find(person => person.UserMasterSid === id);
    return user?.userName;
  }

  trackByCurrencyCode(index: number, group: any): string {
    return group.CurrencyCode;
  }

  trackBySubledger(index: number, sub: any): number {
    return sub.SubledgerMasterSid;
  }


  getCumulative(transactions: any[], index: number): number {
    let total = 0;

    for (let i = 0; i <= index; i++) {
      const row = transactions[i];
      const amount = Number(row?.outstandingLocalAmount) || 0;

      if (row?.drCr?.toUpperCase() === 'C') {
        total += amount;
      } else if (row?.drCr?.toUpperCase() === 'D') {
        total -= amount;
      }
    }

    return total;
  }

  /**
   * Provide Excel data for export via report modal
   * Called by GenericReportModalComponent.downloadExcel()
   */
  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'voucherNo', label: 'Voucher No' },
      { key: 'voucherDate', label: 'Voucher Date' },
      { key: 'voucherType', label: 'Voucher Type' },
      { key: 'hblNo', label: 'HBL No' },
      { key: 'dept', label: 'Dept' },
      { key: 'desc', label: 'Desc' },
      { key: 'salesperson', label: 'Salesperson' },
      { key: 'drCr', label: 'Dr/Cr' },
      { key: 'currency', label: 'Cur' },
      { key: 'amt', label: 'Amt' },
      { key: 'localAmt', label: 'Local Amt' },
      { key: 'osCurrAmt', label: 'O/S Currency Amt' },
      { key: 'osLocalAmt', label: 'O/S Local Amt' },
      { key: 'cumulative', label: 'Cumulative' }
    ];

    const rows: ExcelRow[] = [];
    const transactions = this.fullData?.transactions || [];

    // Transaction data rows
    transactions.forEach((item: any, index: number) => {
      const cells: ExcelCell[] = [
        { value: item?.voucherNumber || '' },
        { value: this.formatDate(item?.voucherDate) },
        { value: item?.voucherType || '' },
        { value: item?.HouseJobNumber || '' },
        { value: item?.deptname || '' },
        { value: item?.naration || '' },
        { value: this.getSalesmanById(item?.salesmanSid) || '' },
        { value: item?.drCr || '' },
        { value: item?.currencyCode || '' },
        { value: this.formatNumber(item?.originalLocalAmount) },
        { value: this.formatNumber(item?.originalCurrencyAmount) },
        { value: this.formatNumber(item?.outstandingCurrencyAmount) },
        { value: this.formatNumber(item?.outstandingLocalAmount) },
        { value: this.formatNumber(this.getCumulative(transactions, index)) }
      ];
      rows.push({ cells, style: 'data' });
    });

    // Total row
    const totalCells: ExcelCell[] = [
      { value: 'TOTAL', colspan: 9 },
      { value: this.formatNumber(this.getTotal(transactions, 'originalLocalAmount')) },
      { value: this.formatNumber(this.getTotal(transactions, 'originalCurrencyAmount')) },
      { value: this.formatNumber(this.getTotal(transactions, 'outstandingCurrencyAmount')) },
      { value: this.formatNumber(this.getTotal(transactions, 'outstandingLocalAmount')) },
      { value: this.formatNumber(this.getCumulative(transactions, transactions.length - 1)) }
    ];
    rows.push({ cells: totalCells, style: 'total' });

    return {
      fileName: 'Outstanding-Report',
      sheetName: 'OutstandingReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || 'Company',
        reportTitle: `Customer Outstanding as on ${this.formatDate(this.params?.ToDate)}`,
        additionalInfo: [
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Branch', value: this.fullData?.branchesInvolved || '' },
          { label: 'Subledger', value: this.fullData?.subledgerName || '' },
          { label: 'Ledger', value: this.fullData?.ledgerName || '' }
        ]
      },
      tableHeaders,
      rows,
      columnWidths: [15, 12, 12, 15, 10, 25, 15, 8, 8, 15, 15, 15, 15, 15]
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
