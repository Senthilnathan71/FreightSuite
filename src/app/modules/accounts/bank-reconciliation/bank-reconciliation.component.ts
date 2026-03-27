import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import * as FileSaver from 'file-saver';
import { finalize } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { PageHeaderComponent, HeaderAction } from 'src/app/shared/components/header-list/header-list.component';
import { AccountsService } from '../accounts.service';

interface BankTransactionRow {
  TransactionDate: string | null;
  ValueDate: string | null;
  ReferenceNumber: string;
  Narration: string;
  Amount: number | null;
  DrCr: 'D' | 'C';
  Status?: 'Reconciled' | 'Unreconciled';
  LinkedVoucherHeaderSid?: number | null;
  LinkedVoucherTransactionSid?: number | null;
}

interface BankBookRow {
  VoucherHeaderSid: number;
  VoucherTransactionSid: number;
  VoucherNumber: string;
  VoucherTypeCode: string | null;
  VoucherDate: string;
  ClearanceDate: string | null;
  Amount: number;
  LocalAmount: number;
  DrCr: 'D' | 'C';
  ReferenceNumber: string | null;
  Narration: string | null;
  LedgerName: string | null;
  PartyName: string | null;
  status?: 'Reconciled' | 'Unreconciled';
}

@Component({
  selector: 'app-bank-reconciliation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgSelectModule,
    NgxSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './bank-reconciliation.component.html',
  styleUrls: ['./bank-reconciliation.component.scss'],
})
export class BankReconciliationComponent implements OnInit {
  filterForm!: FormGroup;
  bankRowsForm!: FormArray;

  currentCompany: any;
  currentBranch: any;
  userData: any;

  bankLedgers: any[] = [];
  bookRows: BankBookRow[] = [];
  reportData: any | null = null;

  selectedBankIndex: number | null = null;
  selectedBookRow: BankBookRow | null = null;

  loadingBooks = false;
  loadingReport = false;

  headerActions: HeaderAction[] = [];

  constructor(
    private fb: FormBuilder,
    private accountsService: AccountsService,
    private appSettings: AppSettingsService,
    private spinner: NgxSpinnerService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettings.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettings.decrypt(localStorage.getItem('selected-branch'));
    this.userData = this.appSettings.getDecryptedUserProfile();

    if (!this.currentCompany) {
      this.appSettings.showError('Please select a company');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.buildForm();
    this.initializeHeaderActions();
    this.loadBankLedgers();
    this.addBankRow();
    this.addBankRow();
  }

  private buildForm(): void {
    this.bankRowsForm = this.fb.array([]);
    this.filterForm = this.fb.group({
      BankCOAMasterSid: [null, Validators.required],
      FromDate: [this.getDefaultFromDate(), Validators.required],
      ToDate: [this.getToday(), Validators.required],
      ClearanceFilter: ['ALL'],
      Search: [''],
      BankStatementBalance: [null],
      bankTransactions: this.bankRowsForm,
    });
  }

  private initializeHeaderActions(): void {
    this.headerActions = [
      { label: 'Search', icon: 'fas fa-search', action: 'search' },
      { label: 'Auto Match', icon: 'fas fa-magic', action: 'auto' },
      { label: 'Manual Match', icon: 'fas fa-link', action: 'manual' },
      { label: 'Unmatch', icon: 'fas fa-unlink', action: 'unmatch' },
      { label: 'Report', icon: 'fas fa-file-alt', action: 'report' },
      { label: 'Excel', icon: 'fas fa-file-excel', action: 'excel' },
      { label: 'Add Row', icon: 'fas fa-plus', action: 'add-row' },
      { label: 'Reset', icon: 'fas fa-sync-alt', action: 'reset' },
    ];
  }

  get bankTransactions(): FormArray {
    return this.bankRowsForm;
  }

  get selectedBankRowValue(): BankTransactionRow | null {
    if (this.selectedBankIndex === null) return null;
    const ctrl = this.bankTransactions.at(this.selectedBankIndex);
    return ctrl ? (ctrl.getRawValue() as BankTransactionRow) : null;
  }

  get bankRowsValid(): BankTransactionRow[] {
    return (this.bankTransactions.getRawValue() as BankTransactionRow[]).filter((row) => this.isBankRowReady(row));
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'search':
        this.searchBookTransactions();
        break;
      case 'auto':
        this.autoMatch();
        break;
      case 'manual':
        this.manualMatchSelected();
        break;
      case 'unmatch':
        this.unmatchSelected();
        break;
      case 'report':
        this.generateReport();
        break;
      case 'excel':
        this.downloadExcelReport();
        break;
      case 'add-row':
        this.addBankRow();
        break;
      case 'reset':
        this.resetScreen();
        break;
      default:
        break;
    }
  }

  loadBankLedgers(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) return;

    this.accountsService.getAllLedgersByItsType({
      CompanyMasterSid: companyId,
      LedgerType: 'Bank',
      filterNonJob: true,
    }).subscribe({
      next: (resp: any) => {
        this.bankLedgers = Array.isArray(resp?.data) ? resp.data : [];
      },
      error: (error: any) => {
        console.error('Error loading bank ledgers', error);
        this.bankLedgers = [];
      },
    });
  }

  addBankRow(): void {
    this.bankTransactions.push(this.createBankRowGroup());
  }

  removeBankRow(index: number): void {
    this.bankTransactions.removeAt(index);
    if (this.selectedBankIndex === index) {
      this.selectedBankIndex = null;
    } else if (this.selectedBankIndex !== null && this.selectedBankIndex > index) {
      this.selectedBankIndex -= 1;
    }
  }

  clearBankRows(): void {
    while (this.bankTransactions.length) {
      this.bankTransactions.removeAt(0);
    }
    this.selectedBankIndex = null;
  }

  selectBankRow(index: number, event?: Event): void {
    event?.stopPropagation();
    this.selectedBankIndex = index;
  }

  selectBookRow(row: BankBookRow, event?: Event): void {
    event?.stopPropagation();
    this.selectedBookRow = row;
  }

  isSelectedBankRow(index: number): boolean {
    return this.selectedBankIndex === index;
  }

  isSelectedBookRow(row: BankBookRow): boolean {
    if (!this.selectedBookRow) return false;
    return this.selectedBookRow.VoucherTransactionSid === row.VoucherTransactionSid;
  }

  get selectedBankRowDisplay(): string {
    const row = this.selectedBankRowValue;
    if (!row) return 'None selected';
    const ref = row.ReferenceNumber?.trim() || '-';
    const amount = this.formatAmount(row.Amount);
    return `${row.TransactionDate || '-'} | Ref ${ref} | ${row.DrCr} ${amount}`;
  }

  get selectedVoucherDisplay(): string {
    if (!this.selectedBookRow) return 'None selected';
    const ref = this.selectedBookRow.ReferenceNumber?.trim() || '-';
    const amount = this.formatAmount(this.selectedBookRow.LocalAmount);
    return `${this.selectedBookRow.VoucherNumber} | Ref ${ref} | ${this.selectedBookRow.DrCr} ${amount}`;
  }

  private createBankRowGroup(row?: Partial<BankTransactionRow>): FormGroup {
    return this.fb.group({
      TransactionDate: [row?.TransactionDate ?? this.getToday(), Validators.required],
      ValueDate: [row?.ValueDate ?? ''],
      ReferenceNumber: [row?.ReferenceNumber ?? ''],
      Narration: [row?.Narration ?? ''],
      Amount: [row?.Amount ?? null, Validators.required],
      DrCr: [row?.DrCr ?? 'D', Validators.required],
      Status: [{ value: row?.Status ?? 'Unreconciled', disabled: true }],
      LinkedVoucherHeaderSid: [row?.LinkedVoucherHeaderSid ?? null],
      LinkedVoucherTransactionSid: [row?.LinkedVoucherTransactionSid ?? null],
    });
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getDefaultFromDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().slice(0, 10);
  }

  private buildPayload() {
    const formValue = this.filterForm.value;
    return {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      BankCOAMasterSid: formValue.BankCOAMasterSid,
      FromDate: formValue.FromDate,
      ToDate: formValue.ToDate,
      ClearanceFilter: formValue.ClearanceFilter ?? 'ALL',
      Search: formValue.Search ?? '',
    };
  }

  private buildReportBalance(): number | null {
    const value = this.filterForm.get('BankStatementBalance')?.value;
    return value === null || value === undefined || value === '' ? null : this.normalizeAmount(value);
  }

  private hasRequiredFilters(): boolean {
    const bankCoa = this.filterForm.get('BankCOAMasterSid')?.value;
    const fromDate = this.filterForm.get('FromDate')?.value;
    const toDate = this.filterForm.get('ToDate')?.value;

    if (!bankCoa || !fromDate || !toDate) {
      return false;
    }

    return new Date(toDate) >= new Date(fromDate);
  }

  private markRequiredFiltersTouched(): void {
    ['BankCOAMasterSid', 'FromDate', 'ToDate'].forEach((controlName) => {
      this.filterForm.get(controlName)?.markAsTouched();
    });
  }

  private isBankRowReady(row: BankTransactionRow | null | undefined): row is BankTransactionRow {
    return !!row
      && !!row.TransactionDate
      && row.Amount !== null
      && row.Amount !== undefined
      && String(row.Amount).trim() !== ''
      && Number.isFinite(Number(row.Amount));
  }

  private normalizeAmount(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private serializeBankRow(row: BankTransactionRow): BankTransactionRow {
    return {
      TransactionDate: row.TransactionDate,
      ValueDate: row.ValueDate || null,
      ReferenceNumber: String(row.ReferenceNumber ?? '').trim(),
      Narration: String(row.Narration ?? '').trim(),
      Amount: this.normalizeAmount(row.Amount),
      DrCr: String(row.DrCr ?? 'D').toUpperCase() === 'C' ? 'C' : 'D',
      Status: row.Status ?? 'Unreconciled',
      LinkedVoucherHeaderSid: row.LinkedVoucherHeaderSid ?? null,
      LinkedVoucherTransactionSid: row.LinkedVoucherTransactionSid ?? null,
    };
  }

  searchBookTransactions(): void {
    if (!this.hasRequiredFilters()) {
      this.markRequiredFiltersTouched();
      this.appSettings.showWarning('Please fill the required filters');
      return;
    }

    this.loadingBooks = true;
    this.spinner.show();
    this.accountsService.searchBankReconciliationBookTransactions(this.buildPayload())
      .pipe(finalize(() => {
        this.loadingBooks = false;
        this.spinner.hide();
      }))
      .subscribe({
        next: (resp: any) => {
          if (resp?.status === false) {
            this.appSettings.showError(resp?.message || 'Failed to load bank reconciliation data');
            this.bookRows = [];
            return;
          }
          const items = Array.isArray(resp?.data?.items) ? resp.data.items : Array.isArray(resp?.data) ? resp.data : [];
          this.bookRows = items.map((item: any) => ({
            ...item,
            status: item.status || (item.ClearanceDate ? 'Reconciled' : 'Unreconciled'),
          }));
          this.selectedBookRow = null;
          if (!this.bookRows.length) {
            this.appSettings.showInfo('No posted vouchers found for the selected filters');
          }
        },
        error: (error: any) => {
          console.error('Search book error', error);
          this.bookRows = [];
          this.appSettings.showError(error?.error?.message || 'Error loading book transactions');
        },
      });
  }

  autoMatch(): void {
    const rows = this.bankRowsValid.map((row) => this.serializeBankRow(row));
    if (!rows.length) {
      this.appSettings.showWarning('Please add at least one valid bank transaction row');
      return;
    }
    if (!this.hasRequiredFilters()) {
      this.markRequiredFiltersTouched();
      this.appSettings.showWarning('Please fill the required filters');
      return;
    }

    const payload = {
      ...this.buildPayload(),
      BankTransactions: rows,
      CreatedBy: this.userData?.userEmail || 'System',
    };

    this.spinner.show();
    this.accountsService.autoMatchBankReconciliation(payload)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (resp: any) => {
          if (resp?.status === false) {
            this.appSettings.showError(resp?.message || 'Auto match failed');
            return;
          }

          this.applyMatchedBankRows(resp?.data?.items ?? []);
          this.appSettings.showSuccess(resp?.message || 'Auto match completed');
          this.searchBookTransactions();
        },
        error: (error: any) => {
          console.error('Auto match error', error);
          this.appSettings.showError(error?.error?.message || 'Error running auto match');
        },
      });
  }

  manualMatchSelected(): void {
    const bankRow = this.selectedBankRowValue ? this.serializeBankRow(this.selectedBankRowValue) : null;
    if (!bankRow) {
      this.appSettings.showWarning('Please select a bank row');
      return;
    }
    if (!this.selectedBookRow) {
      this.appSettings.showWarning('Please select a voucher row');
      return;
    }
    if (!this.isBankRowReady(bankRow)) {
      this.appSettings.showWarning('Selected bank row is incomplete');
      return;
    }
    if (!this.hasRequiredFilters()) {
      this.markRequiredFiltersTouched();
      this.appSettings.showWarning('Please fill the required filters');
      return;
    }

    const payload = {
      ...this.buildPayload(),
      BankTransaction: bankRow,
      VoucherHeaderSid: this.selectedBookRow.VoucherHeaderSid,
      VoucherTransactionSid: this.selectedBookRow.VoucherTransactionSid,
      CreatedBy: this.userData?.userEmail || 'System',
    };

    this.spinner.show();
    this.accountsService.manualMatchBankReconciliation(payload)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (resp: any) => {
          if (resp?.status === false) {
            this.appSettings.showError(resp?.message || 'Manual match failed');
            return;
          }
          this.patchBankRow(this.selectedBankIndex, {
            Status: 'Reconciled',
            LinkedVoucherHeaderSid: this.selectedBookRow?.VoucherHeaderSid ?? null,
            LinkedVoucherTransactionSid: this.selectedBookRow?.VoucherTransactionSid ?? null,
          });
          this.appSettings.showSuccess(resp?.message || 'Manual match completed');
          this.searchBookTransactions();
        },
        error: (error: any) => {
          console.error('Manual match error', error);
          this.appSettings.showError(error?.error?.message || 'Error running manual match');
        },
      });
  }

  unmatchSelected(): void {
    const bankRow = this.selectedBankRowValue;
    if (!bankRow?.LinkedVoucherHeaderSid) {
      this.appSettings.showWarning('Please select a reconciled bank row');
      return;
    }

    const payload = {
      ...this.buildPayload(),
      VoucherHeaderSid: bankRow.LinkedVoucherHeaderSid,
      VoucherTransactionSid: bankRow.LinkedVoucherTransactionSid ?? undefined,
      CreatedBy: this.userData?.userEmail || 'System',
    };

    this.spinner.show();
    this.accountsService.unmatchBankReconciliation(payload)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (resp: any) => {
          if (resp?.status === false) {
            this.appSettings.showError(resp?.message || 'Unmatch failed');
            return;
          }
          this.patchBankRow(this.selectedBankIndex, {
            Status: 'Unreconciled',
            LinkedVoucherHeaderSid: null,
            LinkedVoucherTransactionSid: null,
          });
          this.selectedBookRow = null;
          this.appSettings.showSuccess(resp?.message || 'Unmatch completed');
          this.searchBookTransactions();
        },
        error: (error: any) => {
          console.error('Unmatch error', error);
          this.appSettings.showError(error?.error?.message || 'Error running unmatch');
        },
      });
  }

  generateReport(): void {
    const rows = this.bankRowsValid.map((row) => this.serializeBankRow(row));
    if (!this.hasRequiredFilters()) {
      this.markRequiredFiltersTouched();
      this.appSettings.showWarning('Please fill the required filters');
      return;
    }

    this.loadingReport = true;
    this.spinner.show();
    const payload = {
      ...this.buildPayload(),
      BankStatementBalance: this.buildReportBalance(),
      BankTransactions: rows,
    };

    this.accountsService.generateBankReconciliationReport(payload)
      .pipe(finalize(() => {
        this.loadingReport = false;
        this.spinner.hide();
      }))
      .subscribe({
        next: (resp: any) => {
          if (resp?.status === false) {
            this.appSettings.showError(resp?.message || 'Failed to generate report');
            this.reportData = null;
            return;
          }
          this.reportData = resp?.data || null;
          this.appSettings.showSuccess(resp?.message || 'Report generated successfully');
        },
        error: (error: any) => {
          console.error('Report error', error);
          this.appSettings.showError(error?.error?.message || 'Error generating report');
        },
      });
  }

  downloadExcelReport(): void {
    if (!this.reportData) {
      this.appSettings.showWarning('Please generate the report first');
      return;
    }

    const html = this.buildExcelHtmlReport();
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const fileName = `Bank-Reconciliation-Report-${new Date().getTime()}.xls`;
    FileSaver.saveAs(blob, fileName);
  }

  resetScreen(): void {
    this.filterForm.patchValue({
      BankCOAMasterSid: null,
      FromDate: this.getDefaultFromDate(),
      ToDate: this.getToday(),
      ClearanceFilter: 'ALL',
      Search: '',
      BankStatementBalance: null,
    });
    this.clearBankRows();
    this.addBankRow();
    this.addBankRow();
    this.bookRows = [];
    this.reportData = null;
    this.selectedBookRow = null;
    this.selectedBankIndex = null;
  }

  private patchBankRow(index: number | null, patch: Partial<BankTransactionRow>): void {
    if (index === null) return;
    const ctrl = this.bankTransactions.at(index);
    if (!ctrl) return;
    ctrl.patchValue(patch);
  }

  private applyMatchedBankRows(items: any[]): void {
    const currentRows = this.bankTransactions.getRawValue() as BankTransactionRow[];
    items.forEach((item: any, index: number) => {
      const bankIndex = currentRows.findIndex((row) =>
        row.TransactionDate === item.TransactionDate &&
        this.normalizeAmount(row.Amount) === this.normalizeAmount(item.Amount) &&
        String(row.ReferenceNumber ?? '').trim() === String(item.ReferenceNumber ?? '').trim()
      );
      const targetIndex = bankIndex >= 0 ? bankIndex : index;
      this.patchBankRow(targetIndex, {
        Status: item.status || 'Unreconciled',
        LinkedVoucherHeaderSid: item.linkedVoucherHeaderSid ?? null,
        LinkedVoucherTransactionSid: item.linkedVoucherTransactionSid ?? null,
      });
    });
  }

  getVoucherRoute(row: BankBookRow): string[] | null {
    const voucherType = String(row.VoucherTypeCode ?? '').trim().toUpperCase();
    const voucherRouteMap: Record<string, string> = {
      RPT: '/accounts/receipt/entry',
      RECEIPT: '/accounts/receipt/entry',
      PMT: '/accounts/payment/entry',
      PAYMENT: '/accounts/payment/entry',
      JV: '/accounts/journal-voucher/entry',
      'JOURNAL VOUCHER': '/accounts/journal-voucher/entry',
      RJV: '/accounts/reverse-voucher/entry',
      'REVERSAL JOURNAL VOUCHER': '/accounts/reverse-voucher/entry',
    };

    const route = voucherRouteMap[voucherType];
    return route ? [route, String(row.VoucherHeaderSid)] : null;
  }

  private buildExcelHtmlReport(): string {
    const companyName = this.currentCompany?.companyName || this.currentCompany?.CompanyName || 'Company';
    const locationName = this.currentBranch?.BranchName || this.currentBranch?.branchName || 'Location';
    const ledgerName = this.getSelectedBankLedgerName();
    const asOnDate = this.formatDisplayDate(this.filterForm.get('ToDate')?.value);
    const generatedBy = this.userData?.userName || this.userData?.UserName || this.userData?.userEmail || 'System';
    const generatedOn = this.formatDisplayDateTime(new Date());

    const summary = this.reportData?.summary || {};
    const bookBalance = this.toNumber(summary.bookBalance);
    const bankStatementBalance = this.toNumber(summary.bankStatementBalance ?? this.filterForm.get('BankStatementBalance')?.value);
    const addBankEntries = this.toNumber(summary.addBankEntriesNotInBooks);
    const lessBookEntries = this.toNumber(summary.lessBookEntriesNotClearedInBank);

    const bookEntries = Array.isArray(this.reportData?.bookEntriesNotCleared) ? this.reportData.bookEntriesNotCleared : [];
    const bankEntries = Array.isArray(this.reportData?.bankEntriesNotInBooks) ? this.reportData.bankEntriesNotInBooks : [];

    const creditBookEntries = bookEntries.filter((item: any) => this.normalizeDrCr(item?.DrCr) === 'C');
    const debitBookEntries = bookEntries.filter((item: any) => this.normalizeDrCr(item?.DrCr) === 'D');
    const creditBankEntries = bankEntries.filter((item: any) => this.normalizeDrCr(item?.DrCr) === 'C');
    const debitBankEntries = bankEntries.filter((item: any) => this.normalizeDrCr(item?.DrCr) === 'D');

    const lines = [
      `Bank : ${ledgerName}`,
      `Location : ${locationName}`,
      `As On Date : ${asOnDate}`,
      '',
      `Balance as per our books : ${this.formatAmount(bookBalance)} ${this.getDrCrLabel(bookBalance)}`,
      `Add: Cheques issued but not presented : ${this.formatAmount(this.sumAmount(creditBookEntries))}`,
      `Less: Cheques deposited in bank but not cleared : ${this.formatAmount(this.sumAmount(debitBookEntries))}`,
      `Add: Credits by bank : ${creditBankEntries.length ? this.formatAmount(this.sumAmount(creditBankEntries)) : 'Nil'}`,
      `Less: Debits by Bank : ${debitBankEntries.length ? this.formatAmount(this.sumAmount(debitBankEntries)) : 'Nil'}`,
      `Balance as per Bank statement : ${this.formatAmount(bankStatementBalance)} ${this.getDrCrLabel(bankStatementBalance)}`,
    ];

    const summaryHtml = lines.map((line) => this.escapeHtml(line)).join('<br/>');

    const sections: string[] = [];
    sections.push(this.buildExcelSection('Cheques issued but not presented', creditBookEntries, bookBalance, 'C'));
    sections.push(this.buildExcelSection('Cheques deposited in bank but not cleared', debitBookEntries, bookBalance, 'D'));

    if (creditBankEntries.length) {
      sections.push(this.buildExcelSection('Add: Credits by bank', creditBankEntries, bookBalance, 'C'));
    }
    if (debitBankEntries.length) {
      sections.push(this.buildExcelSection('Less: Debits by Bank', debitBankEntries, bookBalance, 'D'));
    }

    return `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #000; }
            table { border-collapse: collapse; width: 100%; table-layout: fixed; }
            td, th { border: 1px solid #d9d9d9; padding: 4px 6px; vertical-align: middle; }
            .title { font-size: 14pt; font-weight: 700; text-align: center; white-space: pre-line; }
            .summary { font-size: 11pt; white-space: pre-line; line-height: 1.55; }
            .header { background: #507cd1; color: #fff; font-weight: 700; text-align: center; }
            .section { font-weight: 700; }
            .total { font-weight: 700; }
            .right { text-align: right; }
            .center { text-align: center; }
            .left { text-align: left; }
            .footer { font-size: 10pt; }
          </style>
        </head>
        <body>
          <table>
            <tr>
              <td colspan="12" class="title">${this.escapeHtml(companyName)}<br/>Reconciliation Statement</td>
            </tr>
            <tr>
              <td colspan="12" class="summary">${summaryHtml}</td>
            </tr>
            <tr class="header">
              <th style="width: 9%">Transaction Date</th>
              <th style="width: 13%">Transaction No.</th>
              <th style="width: 18%">Organization</th>
              <th style="width: 12%">Cheque/DD No.</th>
              <th style="width: 11%">Cheque/DD Date</th>
              <th style="width: 11%">Clearing Date</th>
              <th style="width: 10%">Amount(INR)</th>
              <th style="width: 6%">Type</th>
              <th style="width: 10%">Balance(INR)</th>
              <th style="width: 6%">Type</th>
              <th style="width: 10%">Payee Name</th>
              <th style="width: 20%">Narration</th>
            </tr>
            ${sections.join('')}
            <tr>
              <td colspan="12" class="footer">${this.escapeHtml(`Generated by ${generatedBy} on ${generatedOn}`)}</td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private buildExcelSection(title: string, rows: any[], startBalance: number, type: 'C' | 'D'): string {
    const sectionRows = Array.isArray(rows) ? rows : [];
    let runningBalance = startBalance;
    const direction = type === 'C' ? 1 : -1;

    const dataRows = sectionRows.map((row: any) => {
      const amount = this.toNumber(row?.Amount ?? row?.LocalAmount);
      runningBalance += direction * amount;
      const transactionDate = this.formatDisplayDate(row?.TransactionDate ?? row?.VoucherDate);
      const chequeDate = this.formatDisplayDate(row?.ValueDate ?? row?.VoucherDate);
      const clearingDate = this.formatDisplayDate(row?.ClearanceDate);
      const organization = this.escapeHtml(row?.Organization || row?.LedgerName || row?.PartyName || '');
      const transactionNo = this.escapeHtml(row?.TransactionNo || row?.VoucherNumber || '');
      const chequeNo = this.escapeHtml(row?.ReferenceNumber || row?.ChequeDDNo || '');
      const payeeName = this.escapeHtml(row?.PayeeName || row?.PartyName || row?.Organization || '');
      const narration = this.escapeHtml(row?.Narration || '');
      return `
        <tr>
          <td class="left">${this.escapeHtml(transactionDate)}</td>
          <td class="left">${transactionNo}</td>
          <td class="left">${organization}</td>
          <td class="left">${chequeNo}</td>
          <td class="left">${this.escapeHtml(chequeDate)}</td>
          <td class="left">${this.escapeHtml(clearingDate)}</td>
          <td class="right">${this.formatAmount(amount)}</td>
          <td class="center">${type === 'C' ? 'CR' : 'DR'}</td>
          <td class="right">${this.formatAmount(runningBalance)}</td>
          <td class="center">${this.getDrCrLabel(runningBalance)}</td>
          <td class="left">${payeeName}</td>
          <td class="left">${narration}</td>
        </tr>
      `;
    }).join('');

    const totalAmount = this.sumAmount(sectionRows);
    const totalBalance = sectionRows.length ? runningBalance : startBalance;

    return `
      <tr>
        <td colspan="12" class="section">${this.escapeHtml(title)}</td>
      </tr>
      ${dataRows || ''}
      <tr class="total">
        <td></td>
        <td class="left">Total</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td class="right">${this.formatAmount(totalAmount)}</td>
        <td class="center">${type === 'C' ? 'CR' : 'DR'}</td>
        <td class="right">${sectionRows.length ? this.formatAmount(totalBalance) : ''}</td>
        <td class="center">${sectionRows.length ? this.getDrCrLabel(totalBalance) : ''}</td>
        <td></td>
        <td></td>
      </tr>
    `;
  }

  private getSelectedBankLedgerName(): string {
    const selectedId = this.filterForm.get('BankCOAMasterSid')?.value;
    const selectedLedger = this.bankLedgers.find((item) => Number(item?.COAMasterSid) === Number(selectedId));
    return selectedLedger?.LedgerName || selectedLedger?.ledgerName || 'Bank';
  }

  private normalizeDrCr(value: any): 'D' | 'C' {
    return String(value ?? '').trim().toUpperCase() === 'C' ? 'C' : 'D';
  }

  private sumAmount(rows: any[]): number {
    return (rows || []).reduce((sum, row) => sum + this.toNumber(row?.Amount ?? row?.LocalAmount), 0);
  }

  private toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getDrCrLabel(amount: number): 'DR' | 'CR' {
    return this.toNumber(amount) >= 0 ? 'DR' : 'CR';
  }

  private formatAmount(value: any): string {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.toNumber(value));
  }

  private formatDisplayDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  }

  private formatDisplayDateTime(value: any): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', '');
  }

  private escapeHtml(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
