import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { ReportRegistryService } from 'src/app/shared/services/report-registry.service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';
import {
  ComplexReportExportConfig,
  ExcelCell,
  ExcelHeader,
  ExcelRow,
} from 'src/app/shared/excel-report-service';
import { PrintHeaderComponent } from '../../print-header/print-header.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-matching-list-receipt-payemnt',
  standalone: true,
  imports: [CustomDatePipe, PrintHeaderComponent, CommonModule, RouterModule],
  templateUrl: './matching-list-receipt-payemnt.component.html',
  styles: ``,
})
export class MatchingListReceiptPayemntComponent {
  currentCompany: any;
  currentBranch: any;
  orientation: 'portrait' | 'landscape' = 'portrait';
  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService,
    private reportRegistryService: ReportRegistryService,
  ) {
    console.log('Outstanding Report Data:', this.data);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    this.orientation = this.reportRegistryService.getReportConfig(
      'matching-list-report',
    ).pdfOrientation;
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

  get groupedData(): any[] {
    const raw = this.fullData?.data || [];
    const map = new Map<string, any>();
    raw.forEach((x: any) => {
      const key = `${x.VoucherNumber}_${x.VoucherType}`;

      if (!map.has(key)) {
        map.set(key, {
          VoucherNumber: x.VoucherNumber,
          VoucherType: x.VoucherType,
          VoucherDate: x.VoucherDate,
          voucherName: x.VoucherName,

          children: [],
          totalAmt: 0,
          totalLocalAmt: 0,
        });
      }

      const group = map.get(key);

      group.children.push({
        VoucherMatchingHeaderSid: x.VoucherMatchingHeaderSid,
        vouchermactingNo: x.VoucherMactingNo,
        VoucherMatchingDate: x.VoucherMatchingDate,
        CurrencyCode: x.CurrencyCode,
        ExRate: x.ExRate ?? 0,
        MatchingType: x.MatchingType,
        DrCr: x.DrCr,
        Amount: Number(x.Amount),
        LocalAmount: Number(x.LocalAmount),
      });

      group.totalAmt += Number(x.Amount);
      group.totalLocalAmt += Number(x.LocalAmount);
    });

    return Array.from(map.values());
  }

  get grandTotalAmt(): number {
  return this.groupedData.reduce((sum, v) => sum + v.totalAmt, 0);
}

get grandTotalLocalAmt(): number {
  return this.groupedData.reduce((sum, v) => sum + v.totalLocalAmt, 0);
}


  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'VoucherNumber', label: 'Voucher No' },
      { key: 'VoucherType', label: 'Voucher Type' },
      { key: 'VoucherDate', label: 'Voucher Date' },
      { key: 'VoucherMatchingNo', label: 'Voucher Matching No' },
      { key: 'VoucherMatchingDate', label: 'Voucher Matching Date' },
      { key: 'CurrencyCode', label: 'Curr' },
      { key: 'ExRate', label: 'Ex.Rate' },
      { key: 'DrCr', label: 'DrCr' },
      { key: 'Amount', label: 'Amt' },
      { key: 'LocalAmount', label: 'Local Amt' },
    ];

    const rows: ExcelRow[] = (this.groupedData || []).flatMap((v) => {
      const childRows = (v.children || []).map((c, i) => ({
        cells: [
          { value: i === 0 ? v.VoucherNumber : '' },
          { value: i === 0 ? v.voucherName : '' },
          { value: i === 0 ? this.formatDate(v.VoucherDate) : '' },
          { value: c.vouchermactingNo || '' },
          { value: this.formatDate(c.VoucherMatchingDate) },
          { value: c.CurrencyCode || '' },
          { value: this.formatNumber(c.ExRate) ?? 0 },
          { value: c.DrCr || '' },
          { value: this.formatNumber(c.Amount) ?? 0 },
          { value: this.formatNumber(c.LocalAmount) ?? 0 },
        ],
        style: 'data',
      }));

      // Add TOTAL row for this group
      const totalRow: ExcelRow = {
        cells: [
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: 'TOTAL' },
          { value: this.formatNumber(v.totalAmt) ?? 0 },
          { value: this.formatNumber(v.totalLocalAmt) ?? 0 },
        ],
        style: 'total',
      };

      return [...childRows, totalRow];
    });

    return {
      fileName: 'Matching-Receipt-Payment-Report',
      sheetName: 'MatchingReport',
      reportHeader: {
        companyName: this.currentCompany?.companyName || '',
        reportTitle: `Matching List Receipt and Payment Report`,
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.params?.FromDate) },
          { label: 'To Date', value: this.formatDate(this.params?.ToDate) },
          { label: 'Ledger', value: this.fullData?.coaMasterSid },
          { label: 'Subledger', value: this.fullData?.ledgerMasterSid },
        ],
      },
      tableHeaders,
      rows,
      columnWidths: [15, 15, 15, 20, 18, 10, 12, 6, 12, 12],
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
}
