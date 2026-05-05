import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import * as FileSaver from 'file-saver';
import { finalize } from 'rxjs';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { getDefaultTodayDate } from 'src/app/common/helper';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { extractBackendErrorMessage } from 'src/app/common/error-handling/payload-validation-handler';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { GlobalDateFormatService } from 'src/app/core/services/global-date-format.service';
import { CompanySettingsManagerService, CurrencySettings } from 'src/app/core/services/company-settings-manager.service';
import { PageHeaderComponent, HeaderAction } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { AccountsService } from '../accounts.service';
import {  FeatherModule } from 'angular-feather';

interface BankTransactionRow {
  TransactionDate: Date | string | NgbDateStruct | null;
  ValueDate: Date | string | NgbDateStruct | null;
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
  VoucherDate: Date | string | NgbDateStruct;
  ClearanceDate: Date | string | NgbDateStruct | null;
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
    NgbDatepickerModule,
    NgxSpinnerModule,
    PageHeaderComponent,
    FeatherModule,
    DecimalPrecisionDirective
  ],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
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
  currentCompanyCurrency: CurrencySettings | null = null;
  currencyList: any[] = [];

  bankLedgers: any[] = [];
  bookRows: BankBookRow[] = [];
  reportData: any | null = null;

  selectedBankIndex: number | null = null;
  selectedBookRow: BankBookRow | null = null;
  selectedBookRowIds: Set<number> = new Set<number>();

  loadingBooks = false;
  loadingReport = false;

  headerActions: HeaderAction[] = [];

  constructor(
    private fb: FormBuilder,
    private accountsService: AccountsService,
    private appSettings: AppSettingsService,
    private companySettings: CompanySettingsManagerService,
    private dropdownStore: DropdownStore,
    private globalDateFormat: GlobalDateFormatService,
    private spinner: NgxSpinnerService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettings.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettings.decrypt(localStorage.getItem('selected-branch'));
    this.userData = this.appSettings.getDecryptedUserProfile();
    this.currentCompanyCurrency = this.companySettings.getCurrencySettings();

    if (!this.currentCompany) {
      this.appSettings.showError('Please select a company');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.buildForm();
    this.initializeHeaderActions();
    this.loadCurrencyList();
    this.loadBankLedgers();
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
      ClearanceDate: [this.getToday()],
      BankStatementBalance: [null],
      bankTransactions: this.bankRowsForm,
    });
  }

  private initializeHeaderActions(): void {
    this.headerActions = [
      // { label: 'Unmatch', icon: 'fas fa-unlink', action: 'unmatch' },
      { label: 'Generate', icon: 'fas fa-file-alt', action: 'report' },
      { label: 'Excel', icon: 'fas fa-file-excel', action: 'excel' },
      { label: 'Reset', icon: 'fas fa-sync-alt', action: 'reset' },
    ];
  }

  get bankTransactions(): FormArray {
    return this.bankRowsForm;
  }

  get searchControl(): FormControl {
    return this.filterForm.get('Search') as FormControl;
  }

  get clearanceDateControl(): FormControl {
    return this.filterForm.get('ClearanceDate') as FormControl;
  }

  get bankStatementBalanceControl(): FormControl {
    return this.filterForm.get('BankStatementBalance') as FormControl;
  }

  isBankStatementBalanceFilled(): boolean {
    const value = this.bankStatementBalanceControl?.value;
    return value !== null && value !== undefined && value !== '';
  }

  get reconciliationSummary(): any {
    return this.reportData?.summary || {};
  }

  get reconciliationCounts(): any {
    return this.reportData?.counts || {};
  }

  get chequesIssuedButNotPresentedAmount(): number {
    const rows = Array.isArray(this.reportData?.bookEntriesNotCleared) ? this.reportData.bookEntriesNotCleared : [];
    return this.sumAmount(rows.filter((item: any) => this.normalizeDrCr(item?.DrCr) === 'C'));
  }

  get chequesDepositedInBankButNotClearedAmount(): number {
    const rows = Array.isArray(this.reportData?.bookEntriesNotCleared) ? this.reportData.bookEntriesNotCleared : [];
    return this.sumAmount(rows.filter((item: any) => this.normalizeDrCr(item?.DrCr) === 'D'));
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
    if (this.bankTransactions.length <= 1) {
      const ctrl = this.bankTransactions.at(0);
      ctrl?.patchValue(this.createBankRowGroup().getRawValue());
      this.selectedBankIndex = null;
      return;
    }

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

  isBookRowSelected(row: BankBookRow): boolean {
    return this.selectedBookRowIds.has(row.VoucherTransactionSid);
  }

  toggleBookRowSelection(row: BankBookRow, checked: boolean, event?: Event): void {
    event?.stopPropagation();
    const next = new Set(this.selectedBookRowIds);
    if (checked) {
      next.add(row.VoucherTransactionSid);
      this.selectedBookRow = row;
    } else {
      next.delete(row.VoucherTransactionSid);
      if (this.selectedBookRow?.VoucherTransactionSid === row.VoucherTransactionSid) {
        this.selectedBookRow = null;
      }
    }
    this.selectedBookRowIds = next;
  }

  toggleSelectAllBookRows(checked: boolean, event?: Event): void {
    event?.stopPropagation();
    if (checked) {
      this.selectedBookRowIds = new Set(this.bookRows.map((row) => row.VoucherTransactionSid));
      this.selectedBookRow = this.bookRows[0] || null;
    } else {
      this.selectedBookRowIds = new Set<number>();
      this.selectedBookRow = null;
    }
  }

  isAllBookRowsSelected(): boolean {
    return this.bookRows.length > 0 && this.bookRows.every((row) => this.selectedBookRowIds.has(row.VoucherTransactionSid));
  }

  isSomeBookRowsSelected(): boolean {
    return this.selectedBookRowIds.size > 0 && !this.isAllBookRowsSelected();
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
    return `${this.formatDisplayDate(row.TransactionDate)} | Ref ${ref} | ${row.DrCr} ${amount}`;
  }

  get selectedVoucherDisplay(): string {
    if (!this.selectedBookRow) return 'None selected';
    const ref = this.selectedBookRow.ReferenceNumber?.trim() || '-';
    const amount = this.formatAmount(this.selectedBookRow.LocalAmount);
    return `${this.selectedBookRow.VoucherNumber} | Ref ${ref} | ${this.selectedBookRow.DrCr} ${amount}`;
  }

  private createBankRowGroup(row?: Partial<BankTransactionRow>): FormGroup {
    return this.fb.group({
      TransactionDate: [row?.TransactionDate ?? this.getToday()],
      ValueDate: [row?.ValueDate ?? ''],
      ReferenceNumber: [row?.ReferenceNumber ?? ''],
      Narration: [row?.Narration ?? ''],
      Amount: [row?.Amount ?? null, Validators.required],
      DrCr: [row?.DrCr ?? 'D'],
      Status: [{ value: row?.Status ?? 'Unreconciled', disabled: true }],
      LinkedVoucherHeaderSid: [row?.LinkedVoucherHeaderSid ?? null],
      LinkedVoucherTransactionSid: [row?.LinkedVoucherTransactionSid ?? null],
    });
  }

  private getToday(): Date {
    return getDefaultTodayDate();
  }

  private getDefaultFromDate(): Date {
    const date = getDefaultTodayDate();
    date.setDate(date.getDate() - 30);
    return date;
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

    return this.toDateValue(toDate).getTime() >= this.toDateValue(fromDate).getTime();
  }

  private markRequiredFiltersTouched(): void {
    ['BankCOAMasterSid', 'FromDate', 'ToDate'].forEach((controlName) => {
      this.filterForm.get(controlName)?.markAsTouched();
    });
  }

  private isBankRowReady(row: BankTransactionRow | null | undefined): row is BankTransactionRow {
    return !!row
      && String(row.ReferenceNumber ?? '').trim() !== ''
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
      TransactionDate: this.toDateValue(row.TransactionDate || this.getToday()),
      ValueDate: row.ValueDate ? this.toDateValue(row.ValueDate) : null,
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
          this.selectedBookRowIds = new Set<number>();
          if (!this.bookRows.length) {
            this.appSettings.showInfo('No posted vouchers found for the selected filters');
          }
        },
        error: (error: any) => {
          console.error('Search book error', error);
          this.bookRows = [];
          this.showBackendError(error, 'Error loading book transactions');
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
          this.showBackendError(error, 'Error running auto match');
        },
      });
  }

  manualMatchSelected(): void {
    const bankRow = this.selectedBankRowValue ? this.serializeBankRow(this.selectedBankRowValue) : null;
    if (!bankRow) {
      this.appSettings.showWarning('Please select a bank row');
      return;
    }
    const selectedRows = this.bookRows.filter((row) => this.isBookRowSelected(row));
    let voucherRow: BankBookRow | null = null;

    if (selectedRows.length === 1) {
      voucherRow = selectedRows[0];
    } else if (selectedRows.length === 0 && this.selectedBookRow) {
      voucherRow = this.selectedBookRow;
    } else if (selectedRows.length > 1) {
      this.appSettings.showWarning('Please tick only one voucher row for manual match');
      return;
    }

    if (!voucherRow) {
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
      VoucherHeaderSid: voucherRow.VoucherHeaderSid,
      VoucherTransactionSid: voucherRow.VoucherTransactionSid,
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
            LinkedVoucherHeaderSid: voucherRow.VoucherHeaderSid ?? null,
            LinkedVoucherTransactionSid: voucherRow.VoucherTransactionSid ?? null,
          });
          this.appSettings.showSuccess(resp?.message || 'Manual match completed');
          this.searchBookTransactions();
        },
        error: (error: any) => {
          console.error('Manual match error', error);
          this.showBackendError(error, 'Error running manual match');
        },
      });
  }

  updateClearanceSelected(): void {
    const selectedRows = this.bookRows.filter((row) => this.isBookRowSelected(row));
    if (!selectedRows.length) {
      this.appSettings.showWarning('Please tick at least one voucher row');
      return;
    }

    const clearanceDateValue = this.filterForm.get('ClearanceDate')?.value;
    const clearanceDate = clearanceDateValue ? this.toIsoDateString(clearanceDateValue) : null;

    const payload = {
      ...this.buildPayload(),
      VoucherHeaderSids: selectedRows.map((row) => row.VoucherHeaderSid),
      ClearanceDate: clearanceDate,
      CreatedBy: this.userData?.userEmail || 'System',
    };

    this.spinner.show();
    this.accountsService.updateBankReconciliationClearance(payload)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (resp: any) => {
          if (resp?.status === false) {
            this.appSettings.showError(resp?.message || 'Clearance update failed');
            return;
          }

          const selectedIds = new Set(selectedRows.map((row) => row.VoucherHeaderSid));
          this.bookRows = this.bookRows.map((row) => selectedIds.has(row.VoucherHeaderSid)
            ? { ...row, ClearanceDate: clearanceDateValue || null, status: clearanceDateValue ? 'Reconciled' : 'Unreconciled' }
            : row);
          this.selectedBookRowIds = new Set<number>();
          this.selectedBookRow = null;
          this.appSettings.showSuccess(
            resp?.message || (clearanceDateValue ? 'Clearance date updated successfully' : 'Clearance date cleared successfully')
          );
        },
        error: (error: any) => {
          console.error('Update clearance error', error);
          this.showBackendError(error, 'Error updating clearance date');
        },
      });
  }

  saveBookRowClearanceDate(row: BankBookRow): void {
    if (!row?.VoucherHeaderSid) {
      return;
    }

    const nextClearanceDate = row.ClearanceDate ? this.toIsoDateString(row.ClearanceDate) : null;
    this.persistBookRowClearance(row, nextClearanceDate);
  }

  removeBookRowClearanceDate(row: BankBookRow, event?: Event): void {
    event?.stopPropagation();
    if (!row?.VoucherHeaderSid) {
      return;
    }

    this.persistBookRowClearance(row, null);
  }

  private persistBookRowClearance(row: BankBookRow, clearanceDate: string | null): void {
    const payload = {
      ...this.buildPayload(),
      VoucherHeaderSids: [row.VoucherHeaderSid],
      ClearanceDate: clearanceDate,
      CreatedBy: this.userData?.userEmail || 'System',
    };

    this.accountsService.updateBankReconciliationClearance(payload)
      .subscribe({
        next: (resp: any) => {
          if (resp?.status === false) {
            this.appSettings.showError(resp?.message || 'Clearance update failed');
            return;
          }

          row.ClearanceDate = clearanceDate;
          row.status = clearanceDate ? 'Reconciled' : 'Unreconciled';
          this.appSettings.showSuccess(
            resp?.message || (clearanceDate ? 'Clearance date updated successfully' : 'Clearance date removed successfully')
          );
        },
        error: (error: any) => {
          console.error('Update clearance error', error);
          this.showBackendError(error, 'Error updating clearance date');
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
          this.showBackendError(error, 'Error running unmatch');
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
          this.showBackendError(error, 'Error generating report');
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
      ClearanceDate: this.getToday(),
      BankStatementBalance: null,
    });
    this.clearBankRows();
    this.addBankRow();
    this.bookRows = [];
    this.reportData = null;
    this.selectedBookRow = null;
    this.selectedBankIndex = null;
    this.selectedBookRowIds = new Set<number>();
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
    const ledgerCurrency = this.getSelectedBankLedgerCurrencyCode();
    const bankCurrencyHeader = ledgerCurrency ? `Amount(${ledgerCurrency})` : 'Amount';
    const rawFromDate = this.filterForm.get('FromDate')?.value;
    const rawToDate = this.filterForm.get('ToDate')?.value;
    const fromDate = this.formatDisplayDate(rawFromDate);
    const toDate = this.formatDisplayDate(rawToDate);
    const asOnDate = this.formatDisplayDate(rawToDate);
    const generatedBy = this.userData?.userName || this.userData?.UserName || this.userData?.userEmail || 'System';
    const generatedOn = this.formatDisplayDateTime(new Date());

    const summary = this.reportData?.summary || {};
    const bookBalance = this.toNumber(summary.bookBalance);
    const bankStatementBalance = this.toNumber(summary.bankStatementBalance ?? this.filterForm.get('BankStatementBalance')?.value);

    const bookEntries = Array.isArray(this.reportData?.bookEntriesNotCleared) ? this.reportData.bookEntriesNotCleared : [];
    const bankEntries = Array.isArray(this.reportData?.bankEntriesNotInBooks) ? this.reportData.bankEntriesNotInBooks : [];
    const periodBookRows = Array.isArray(this.bookRows) ? this.bookRows : [];
    const reconciledBookRows = periodBookRows.filter((item: any) => !!this.getRowClearanceDate(item));
    const unreconciledBookRows = periodBookRows.filter((item: any) => !this.getRowClearanceDate(item));

    const creditBookEntries = bookEntries.filter((item: any) =>
      this.normalizeDrCr(item?.DrCr) === 'C' && this.isWithinSelectedDateRange(item?.VoucherDate ?? item?.TransactionDate, rawFromDate, rawToDate)
    );
    const debitBookEntries = bookEntries.filter((item: any) =>
      this.normalizeDrCr(item?.DrCr) === 'D' && this.isWithinSelectedDateRange(item?.VoucherDate ?? item?.TransactionDate, rawFromDate, rawToDate)
    );
    const creditBankEntries = bankEntries.filter((item: any) => this.normalizeDrCr(item?.DrCr) === 'C');
    const debitBankEntries = bankEntries.filter((item: any) => this.normalizeDrCr(item?.DrCr) === 'D');

    const bookChequesIssued = this.sumAmount(creditBookEntries);
    const bookChequesDeposited = -this.sumAmount(debitBookEntries);
    const bankCredits = this.sumAmount(creditBankEntries);
    const bankDebits = -this.sumAmount(debitBankEntries);

    const sections: string[] = [];
    if (creditBookEntries.length) {
      sections.push(
        this.buildExcelBookStatusSection('Cheques issued but not presented', creditBookEntries, {
          footerStatusLabel: 'Total',
          signedLocalTotal: false,
        })
      );
    }
    if (debitBookEntries.length) {
      sections.push(
        this.buildExcelBookStatusSection('Cheques deposited in bank but not cleared', debitBookEntries, {
          footerStatusLabel: 'Total',
          signedLocalTotal: false,
        })
      );
    }
    if (reconciledBookRows.length) {
      sections.push(
        this.buildExcelBookStatusSection('Reconciled Transactions', reconciledBookRows, {
          footerStatusLabel: 'Reconciled',
        })
      );
    }
    if (unreconciledBookRows.length) {
      sections.push(
        this.buildExcelBookStatusSection('Unreconciled Transactions', unreconciledBookRows, {
          footerStatusLabel: 'Unreconciled',
        })
      );
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
            .meta { font-size: 11pt; }
            .header { background: #507cd1; color: #fff; font-weight: 700; text-align: center; }
            .section { font-weight: 700; }
            .total { font-weight: 700; }
            .right { text-align: right; }
            .center { text-align: center; }
            .left { text-align: left; }
            .footer { font-size: 10pt; }
            .amount { text-align: right; mso-number-format:'\\#,\\##0\\.000'; }
          </style>
        </head>
        <body>
          <table class="meta">
            <tr>
              <td colspan="3" class="title">${this.escapeHtml(companyName)}<br/>Bank Reconciliation Statement</td>
            </tr>
            <tr>
              <td colspan="3" class="left">${this.escapeHtml(`Bank : ${ledgerName}${ledgerCurrency ? `(${ledgerCurrency})` : ''}`)}</td>
            </tr>
            <tr>
              <td colspan="3" class="left">${this.escapeHtml(`Location : ${locationName}`)}</td>
            </tr>
            <tr>
              <td colspan="3" class="left">${this.escapeHtml(`From Date : ${fromDate}`)}</td>
            </tr>
            <tr>
              <td colspan="3" class="left">${this.escapeHtml(`To Date : ${toDate}`)}</td>
            </tr>
         
          </table>

          <table class="meta" style="margin-top: 8px;">
            <tr class="header">
              <th style="width: 68%">Description</th>
              <th style="width: 8%"></th>
              <th style="width: 24%">Amount</th>
            </tr>
            <tr>
              <td class="left">Balance as per our books :</td>
              <td></td>
              ${this.buildExcelAmountCell(bookBalance)}
            </tr>
            <tr>
              <td class="left">Add: Cheques issued but not presented :</td>
              <td></td>
              ${this.buildExcelAmountCell(bookChequesIssued)}
            </tr>
            <tr>
              <td class="left">Less: Cheques deposited in bank but not cleared :</td>
              <td></td>
              ${this.buildExcelAmountCell(bookChequesDeposited)}
            </tr>
            <tr>
              <td class="left">Add: Credits by bank :</td>
              <td></td>
              ${this.buildExcelAmountCell(creditBankEntries.length ? bankCredits : '0.000')}
            </tr>
            <tr>
              <td class="left">Less: Debits by Bank :</td>
              <td></td>
              ${this.buildExcelAmountCell(debitBankEntries.length && Math.abs(bankDebits) > 0 ? bankDebits : '-0.000')}
            </tr>
            <tr>
              <td class="left">Balance as per Bank statement :</td>
              <td></td>
              ${this.buildExcelAmountCell(bankStatementBalance)}
            </tr>
          </table>

          ${sections.length ? `
            <table style="margin-top: 12px;">
              <tr class="header">
                <th style="width: 9%">Voucher Date</th>
                <th style="width: 13%">Voucher No.</th>
                <th style="width: 18%">Party Name</th>
                <th style="width: 12%">Inst.No.</th>
                <th style="width: 11%">Inst Date</th>
                <th style="width: 11%">Clearing Date</th>
                <th style="width: 10%">${this.escapeHtml(bankCurrencyHeader)}</th>
                <th style="width: 6%">Type</th>
                <th style="width: 10%">Local (${this.getCurrentCompanyCurrencyCode()})</th>
                <th style="width: 10%">Status</th>
                <th style="width: 20%">Narration</th>
              </tr>
              ${sections.join('')}
            </table>
          ` : ''}

          <table style="margin-top: 8px;">
            <tr>
              <td colspan="11" class="footer">${this.escapeHtml(`Generated by ${generatedBy} on ${generatedOn}`)}</td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private buildExcelBookStatusSection(
    title: string,
    rows: any[],
    options?: {
      footerStatusLabel?: string;
      signedLocalTotal?: boolean;
    }
  ): string {
    const sectionRows = Array.isArray(rows) ? rows : [];
    const footerStatusLabel = options?.footerStatusLabel || (title.includes('Reconciled') ? 'Reconciled' : 'Unreconciled');

    const dataRows = sectionRows.map((row: any) => {
      const amount = this.getAbsoluteAmount(row?.Amount ?? row?.LocalAmount);
      const transactionDate = this.formatDisplayDate(row?.VoucherDate ?? row?.TransactionDate);
      const chequeDate = this.formatDisplayDate(row?.VoucherDate ?? row?.ValueDate);
      const clearingDate = this.formatDisplayDate(this.getRowClearanceDate(row));
      const PartyName = this.escapeHtml(row?.PartyName || row?.Organization || row?.LedgerName || '');
      const transactionNo = this.escapeHtml(row?.VoucherNumber || row?.TransactionNo || '');
      const chequeNo = this.escapeHtml(row?.ReferenceNumber || row?.ChequeDDNo || '');
      const status = this.escapeHtml(row?.status || (this.getRowClearanceDate(row) ? 'Reconciled' : 'Unreconciled'));
      const narration = this.escapeHtml(row?.Narration || '');
      const localAmount = this.toNumber(row?.LocalAmount ?? row?.Amount);
      const drCr = this.normalizeDrCr(row?.DrCr);
      return `
        <tr>
          <td class="left">${this.escapeHtml(transactionDate)}</td>
          <td class="left">${transactionNo}</td>
          <td class="left">${PartyName}</td>
          <td class="left">${chequeNo}</td>
          <td class="left">${this.escapeHtml(chequeDate)}</td>
          <td class="left">${this.escapeHtml(clearingDate)}</td>
          <td class="right">${this.formatAmount(amount)}</td>
          <td class="center">${drCr === 'C' ? 'CR' : 'DR'}</td>
          <td class="right">${this.formatAmount(localAmount)}</td>
          <td class="left">${status}</td>
          <td class="left">${narration}</td>
        </tr>
      `;
    }).join('');

    const totalAmount = this.sumAmount(sectionRows);
    const totalLocalAmount = sectionRows.reduce((sum, row) => {
      const amount = Math.abs(this.toNumber(row?.LocalAmount ?? row?.Amount));
      if (options?.signedLocalTotal === false) {
        return sum + amount;
      }
      return sum + (this.normalizeDrCr(row?.DrCr) === 'C' ? -amount : amount);
    }, 0);

    return `
      <tr>
        <td colspan="11" class="section">${this.escapeHtml(title)}</td>
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
        <td></td>
        <td class="right">${sectionRows.length ? this.formatAmount(totalLocalAmount) : ''}</td>
        <td class="left">${sectionRows.length ? this.escapeHtml(footerStatusLabel) : ''}</td>
        <td></td>
      </tr>
    `;
  }

  private getSelectedBankLedgerName(): string {
    const selectedId = this.filterForm.get('BankCOAMasterSid')?.value;
    const selectedLedger = this.bankLedgers.find((item) => Number(item?.COAMasterSid) === Number(selectedId));
    return selectedLedger?.LedgerName || selectedLedger?.ledgerName || 'Bank';
  }

  private getSelectedBankLedgerCurrencyCode(): string {
    const selectedId = this.filterForm.get('BankCOAMasterSid')?.value;
    const selectedLedger = this.bankLedgers.find((item) => Number(item?.COAMasterSid) === Number(selectedId));
    const ledgerCurrency = selectedLedger?.LedgerCurrency ?? selectedLedger?.ledgerCurrency ?? null;
    const currencyCode = this.resolveCurrencyCode(ledgerCurrency);

    return String(
      currencyCode ||
      selectedLedger?.CurrencyCode ||
      selectedLedger?.currencyCode ||
      selectedLedger?.currencyMaster?.currencyCode ||
      selectedLedger?.CurrencyMaster?.currencyCode ||
      ledgerCurrency ||
      ''
    ).trim().toUpperCase();
  }

  private loadCurrencyList(): void {
    this.dropdownStore.loadCurrencies().subscribe({
      next: (currencies: any[]) => {
        this.currencyList = Array.isArray(currencies) ? currencies : [];
      },
      error: (error: any) => {
        console.error('Error loading currencies', error);
        this.currencyList = [];
      },
    });
  }

  private resolveCurrencyCode(currencyValue: any): string {
    if (currencyValue === null || currencyValue === undefined || currencyValue === '') {
      return '';
    }

    const numericCurrencySid = Number(currencyValue);
    if (Number.isFinite(numericCurrencySid) && numericCurrencySid > 0) {
      const currencies = this.currencyList.length ? this.currencyList : this.dropdownStore.currencies();
      const currency = (currencies || []).find((item: any) => Number(item?.CurrencyMasterSid) === numericCurrencySid);
      return String(currency?.currencyCode || currency?.CurrencyCode || '').trim().toUpperCase();
    }

    return String(currencyValue).trim().toUpperCase();
  }

  private getRowClearanceDate(row: any): any {
    return (
      row?.ClearanceDate ??
      row?.clearanceDate ??
      row?.ClearingDate ??
      row?.clearingDate ??
      row?.VoucherHeader?.ClearanceDate ??
      row?.VoucherHeader?.clearanceDate ??
      row?.VoucherHeader?.ClearingDate ??
      row?.VoucherHeader?.clearingDate ??
      null
    );
  }

  private isWithinSelectedDateRange(value: any, fromValue: any, toValue: any): boolean {
    const rowDate = this.toDateValue(value);
    const fromDate = this.toDateValue(fromValue);
    const toDate = this.toDateValue(toValue);

    if (Number.isNaN(rowDate.getTime()) || Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return true;
    }

    const rowTime = Date.UTC(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
    const fromTime = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const toTime = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());

    return rowTime >= fromTime && rowTime <= toTime;
  }

  private getCurrentCompanyCurrencyCode(): string {
    return String(
      this.currentCompanyCurrency?.code ||
      this.currentCompany?.CurrencyCode ||
      this.currentCompany?.currencyMaster?.currencyCode ||
      'INR'
    ).trim().toUpperCase();
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

  private getAbsoluteAmount(value: any): number {
    return Math.abs(this.toNumber(value));
  }

  private getDrCrLabel(amount: number): 'DR' | 'CR' {
    return this.toNumber(amount) >= 0 ? 'DR' : 'CR';
  }

  private formatAmount(value: any): string {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(this.toNumber(value));
  }

  private formatSignedAmount(value: any): string {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(this.toNumber(value));
  }

  private buildExcelAmountCell(value: number | string): string {
    if (typeof value === 'string') {
      return `<td class="amount">${this.escapeHtml(value)}</td>`;
    }

    return `<td class="amount" style="mso-number-format:'\\#,\\##0\\.000';">${this.toNumber(value)}</td>`;
  }

  formatDisplayDate(value: any): string {
    if (!value) return '';
    const date = this.toDateValue(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return this.globalDateFormat.formatDate(date);
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

  private toDateValue(value: Date | string | NgbDateStruct | null | undefined): Date {
    if (!value) {
      return new Date('');
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);
      return parsed;
    }

    if (this.isNgbDateStruct(value)) {
      return new Date(Date.UTC(value.year, value.month - 1, value.day, 0, 0, 0, 0));
    }

    return new Date(value as any);
  }

  private toIsoDateString(value: Date | string | NgbDateStruct | null | undefined): string {
    const date = this.toDateValue(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isNgbDateStruct(value: any): value is NgbDateStruct {
    return !!value
      && typeof value === 'object'
      && typeof value.year === 'number'
      && typeof value.month === 'number'
      && typeof value.day === 'number';
  }

  private showBackendError(error: any, fallback: string): void {
    this.appSettings.showError(extractBackendErrorMessage(error, fallback));
  }
}
