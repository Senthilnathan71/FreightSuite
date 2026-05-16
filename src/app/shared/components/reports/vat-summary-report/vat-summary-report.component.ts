import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import {
  ComplexReportExportConfig,
  ExcelCell,
  ExcelHeader,
  ExcelRow,
} from 'src/app/shared/excel-report-service';
import { REPORT_DATA } from 'src/app/shared/services/report.service';

interface VatReturnRow {
  code: string;
  description: string;
  amount: number;
  vatAmount: number;
  adjustmentAmount: number;
}

@Component({
  selector: 'app-vat-summary-report',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './vat-summary-report.component.html',
  styleUrls: ['./vat-summary-report.component.scss'],
})
export class VatSummaryReportComponent implements OnInit {
  currentCompany: any;
  currentBranch: any;
  orientation: 'portrait' | 'landscape' = 'portrait';

  readonly outputDefinitions = [
    { code: '1a', description: 'Standard rated supplies in Abu Dhabi' },
    { code: '1b', description: 'Standard rated supplies in Dubai' },
    { code: '1c', description: 'Standard rated supplies in Sharjah' },
    { code: '1d', description: 'Standard rated supplies in Ajman' },
    { code: '1e', description: 'Standard rated supplies in Umm Al Quwain' },
    { code: '1f', description: 'Standard rated supplies in Ras Al Khaimah' },
    { code: '1g', description: 'Standard rated supplies in Fujairah' },
    { code: '2', description: 'Tax Refunds provided to Tourists under Tax Refunds for Tourists Scheme' },
    { code: '3', description: 'Supplies subject to the reverse charge provisions' },
    { code: '4', description: 'Zero rated supplies' },
    { code: '5', description: 'Exempt supplies' },
    { code: '6', description: 'Goods imported into the UAE' },
    { code: '7', description: 'Adjustment to goods imported into the UAE' },
  ];

  readonly inputDefinitions = [
    { code: '9', description: 'Standard rated expenses' },
    { code: '10', description: 'Supplies subject to the reverse charge provisions' },
  ];

  constructor(
    @Inject(REPORT_DATA) public data: any,
    private appSettingsService: AppSettingsService
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingsService.getCurrentBranchInfo();
  }

  get reportData(): any {
    const raw = this.data || {};
    return raw.data && !Array.isArray(raw.data) ? raw.data : raw;
  }

  get params(): any {
    return this.data?.params || this.reportData?.params || {};
  }

  get companyName(): string {
    return this.pick(
      this.reportData?.company?.companyName,
      this.reportData?.company?.name,
      this.currentCompany?.companyName,
      this.currentCompany?.CompanyName,
      ''
    );
  }

  get trn(): string {
    return this.pick(
      this.reportData?.company?.trn,
      this.reportData?.company?.TRN,
      this.reportData?.company?.taxRegistrationNo,
      this.currentBranch?.taxRegistrationNo,
      this.currentCompany?.GST_VAT,
      ''
    );
  }

  get addressLines(): string[] {
    const fromBackend = this.reportData?.company?.addressLines;
    if (Array.isArray(fromBackend) && fromBackend.length) {
      return fromBackend.filter(Boolean);
    }

    const address = this.pick(
      this.reportData?.company?.address,
      this.currentBranch?.Address,
      this.currentBranch?.BranchAddress,
      this.currentCompany?.Address,
      ''
    );

    const cityCountry = [this.currentBranch?.CityName, this.currentBranch?.CountryName]
      .filter(Boolean)
      .join(', ');

    return [address, cityCountry].filter(Boolean);
  }

  get fromDate(): any {
    return this.pick(this.params?.VoucherFromDate, this.params?.FromDate, this.reportData?.period?.fromDate);
  }

  get toDate(): any {
    return this.pick(this.params?.VoucherToDate, this.params?.ToDate, this.reportData?.period?.toDate);
  }

  get dueDate(): any {
    return this.pick(this.params?.VatReturnDueDate, this.reportData?.period?.dueDate);
  }

  get taxYearEnd(): any {
    return this.pick(this.params?.TaxYearEnd, this.reportData?.period?.taxYearEnd);
  }

  get referenceNumber(): string {
    return this.pick(this.params?.VatReturnReferenceNumber, this.reportData?.period?.referenceNumber, '');
  }

  get outputRows(): VatReturnRow[] {
    const rows = this.pickRows(
      this.reportData?.outputRows,
      this.reportData?.outputTaxRows,
      this.reportData?.vatOutputRows
    );

    if (rows.length) {
      return this.outputDefinitions.map((definition) => this.normalizeRow(definition, rows));
    }

    return this.buildOutputRowsFromDetailData();
  }

  get inputRows(): VatReturnRow[] {
    const rows = this.pickRows(
      this.reportData?.inputRows,
      this.reportData?.inputTaxRows,
      this.reportData?.vatInputRows
    );

    if (rows.length) {
      return this.inputDefinitions.map((definition) => this.normalizeRow(definition, rows));
    }

    return this.buildInputRowsFromDetailData();
  }

  get outputTotal(): VatReturnRow {
    const backend = this.reportData?.summary?.outputTotal || this.reportData?.outputTotal;
    return {
      code: '8',
      description: 'Totals',
      amount: this.toNumber(backend?.amount) || this.sum(this.outputRows, 'amount'),
      vatAmount: this.toNumber(backend?.vatAmount) || this.sum(this.outputRows, 'vatAmount'),
      adjustmentAmount:
        this.toNumber(backend?.adjustmentAmount) || this.sum(this.outputRows, 'adjustmentAmount'),
    };
  }

  get inputTotal(): VatReturnRow {
    const backend = this.reportData?.summary?.inputTotal || this.reportData?.inputTotal;
    return {
      code: '11',
      description: 'Totals',
      amount: this.toNumber(backend?.amount) || this.sum(this.inputRows, 'amount'),
      vatAmount: this.toNumber(backend?.vatAmount) || this.sum(this.inputRows, 'vatAmount'),
      adjustmentAmount:
        this.toNumber(backend?.adjustmentAmount) || this.sum(this.inputRows, 'adjustmentAmount'),
    };
  }

  get totalDueTax(): number {
    return this.toNumber(this.reportData?.summary?.totalDueTax) || this.outputTotal.vatAmount;
  }

  get totalRecoverableTax(): number {
    return this.toNumber(this.reportData?.summary?.totalRecoverableTax) || this.inputTotal.vatAmount;
  }

  get netVatDue(): number {
    const backendValue = this.reportData?.summary?.netVatDue;
    if (backendValue !== null && backendValue !== undefined) {
      return this.toNumber(backendValue);
    }
    return this.totalDueTax - this.totalRecoverableTax;
  }

  get declaration(): any {
    return this.reportData?.declaration || {};
  }

  getExcelData(): ComplexReportExportConfig {
    const tableHeaders: ExcelHeader[] = [
      { key: 'box', label: 'Box' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount (AED)' },
      { key: 'vatAmount', label: 'VAT Amount (AED)' },
      { key: 'adjustmentAmount', label: 'Adjustment (AED)' },
    ];

    const rows: ExcelRow[] = [
      this.sectionRow('VAT on Sales and all other Outputs'),
      ...this.outputRows.map((row) => this.excelRow(row)),
      this.excelRow(this.outputTotal, true),
      this.sectionRow('VAT on Expenses and all other Inputs'),
      ...this.inputRows.map((row) => this.excelRow(row)),
      this.excelRow(this.inputTotal, true),
      this.sectionRow('Net VAT due'),
      this.summaryExcelRow('12', 'Total value of due tax for the period', this.totalDueTax),
      this.summaryExcelRow('13', 'Total value of recoverable tax for the period', this.totalRecoverableTax),
      this.summaryExcelRow('14', 'Net VAT due(or reclaimed) for the period', this.netVatDue),
    ];

    return {
      fileName: 'VAT-Summary-Report',
      sheetName: 'VAT Summary',
      reportHeader: {
        companyName: this.companyName || 'Company',
        reportTitle: 'VAT Summary Report',
        additionalInfo: [
          { label: 'From Date', value: this.formatDate(this.fromDate) },
          { label: 'To Date', value: this.formatDate(this.toDate) },
          { label: 'TRN', value: this.trn },
        ],
      },
      tableHeaders,
      rows,
      columnWidths: [10, 50, 18, 18, 18],
    };
  }

  formatNumber(value: any): string {
    return this.toNumber(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private buildOutputRowsFromDetailData(): VatReturnRow[] {
    const outputTax = this.pickRows(this.reportData?.outputTax, this.reportData?.data?.outputTax);
    const totalAmount = this.sumAny(outputTax, ['taxableAmt', 'TaxableAmount', 'amount', 'Amount']);
    const totalVat = this.sumAny(outputTax, ['taxAmt', 'TaxAmount', 'vatAmount', 'VatAmount']);

    return this.outputDefinitions.map((definition) => ({
      ...definition,
      amount: definition.code === '1b' ? totalAmount : 0,
      vatAmount: definition.code === '1b' ? totalVat : 0,
      adjustmentAmount: 0,
    }));
  }

  private buildInputRowsFromDetailData(): VatReturnRow[] {
    const inputTax = this.pickRows(this.reportData?.inputTax, this.reportData?.data?.inputTax);
    const totalAmount = this.sumAny(inputTax, ['taxableAmt', 'TaxableAmount', 'amount', 'Amount']);
    const totalVat = this.sumAny(inputTax, ['taxAmt', 'TaxAmount', 'vatAmount', 'VatAmount']);

    return this.inputDefinitions.map((definition) => ({
      ...definition,
      amount: definition.code === '9' ? totalAmount : 0,
      vatAmount: definition.code === '9' ? totalVat : 0,
      adjustmentAmount: 0,
    }));
  }

  private normalizeRow(
    definition: { code: string; description: string },
    rows: any[]
  ): VatReturnRow {
    const row = rows.find((item) => {
      const code = this.pick(item?.code, item?.box, item?.Box, item?.BoxNo, item?.lineNo, item?.LineNo, '');
      return String(code).trim().toLowerCase() === definition.code.toLowerCase();
    });

    return {
      code: definition.code,
      description: this.pick(row?.description, row?.particulars, row?.Particulars, definition.description),
      amount: this.toNumber(this.pick(row?.amount, row?.Amount, row?.taxableAmount, row?.TaxableAmount)),
      vatAmount: this.toNumber(
        this.pick(row?.vatAmount, row?.VatAmount, row?.taxAmount, row?.TaxAmount, row?.recoverableVatAmount)
      ),
      adjustmentAmount: this.toNumber(
        this.pick(row?.adjustmentAmount, row?.AdjustmentAmount, row?.adjustment, row?.Adjustment)
      ),
    };
  }

  private pickRows(...values: any[]): any[] {
    for (const value of values) {
      if (Array.isArray(value)) {
        return value;
      }
    }
    return [];
  }

  private sum(rows: VatReturnRow[], key: keyof VatReturnRow): number {
    return rows.reduce((total, row) => total + this.toNumber(row[key]), 0);
  }

  private sumAny(rows: any[], keys: string[]): number {
    return rows.reduce((total, row) => {
      const value = keys.map((key) => row?.[key]).find((item) => item !== null && item !== undefined);
      return total + this.toNumber(value);
    }, 0);
  }

  private pick(...values: any[]): any {
    return values.find((value) => value !== null && value !== undefined && value !== '');
  }

  private toNumber(value: any): number {
    const numberValue = Number(String(value ?? 0).replace(/,/g, ''));
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  private excelRow(row: VatReturnRow, isTotal = false): ExcelRow {
    const cells: ExcelCell[] = [
      { value: row.code },
      { value: row.description },
      { value: this.formatNumber(row.amount) },
      { value: this.formatNumber(row.vatAmount) },
      { value: this.formatNumber(row.adjustmentAmount) },
    ];
    return { cells, style: isTotal ? 'total' : 'data' };
  }

  private sectionRow(title: string): ExcelRow {
    return {
      cells: [{ value: title, colspan: 5 }],
      style: 'section',
    };
  }

  private summaryExcelRow(code: string, description: string, value: number): ExcelRow {
    return {
      cells: [
        { value: code },
        { value: description },
        { value: this.formatNumber(value), colspan: 3 },
      ],
      style: 'total',
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
}
