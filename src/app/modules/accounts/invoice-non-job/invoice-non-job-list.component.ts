import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { catchError, map, Observable, of } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { PageHeaderComponent, HeaderAction } from 'src/app/shared/components/header-list/header-list.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { DateRangeConfig, DateTypeConfig, DropdownFilterConfig, PartyFilterConfig, AdvancedFilterValues } from 'src/app/shared/interfaces/advanced-filter.interface';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { AccountsService } from '../accounts.service';
import { OperationService } from '../../operation/operation.service';
import { InvoiceNonJobService } from '../services/invoice-non-job.service';
import { VoucherActionGuardService } from 'src/app/shared/services/voucher-action-guard.service';
import { getFinancialYearDateRangeBounds, getFinancialYearPresetDateRange } from 'src/app/common/helper';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';

@Component({
  selector: 'app-invoice-non-job-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NgbPaginationModule,
    MatDialogModule,
    NgxSpinnerModule,
    PageHeaderComponent,
    ReusableTableComponent,
    CustomDatePipe,
    ElementStateGuardDirective
  ],
  providers: [CustomDatePipe],
  templateUrl: './invoice-non-job-list.component.html',
})
export class InvoiceNonJobListComponent extends BaseListComponent implements OnInit {
  @ViewChild('invoiceNonJobTable') invoiceNonJobTable!: ReusableTableComponent;

  currentCompany: any;
  currentBranch: any;
  userData: any;
  tableConfig!: TableConfig;
  tableLoading = false;
  headerActions: HeaderAction[] = [];
  currentFilters: AdvancedFilterValues = {};
  private partyOptions: any[] = [];

  dateRangeConfig: DateRangeConfig = { enabled: true };
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [{ label: 'Invoice Date', value: 'VoucherDate' }],
    defaultValue: 'VoucherDate',
  };
  partyFilterConfig: PartyFilterConfig = {
    enabled: true,
    partyTypes: [{ label: 'Customer', value: 'CustomerMasterSid' }],
    defaultPartyType: 'CustomerMasterSid',
  };
  currencyFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Currency',
    options: [],
    bindLabel: 'currencyCode',
    bindValue: 'currencyCode',
  };

  protected config: ListComponentConfig = {
    storageKey: 'invoice-non-job-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'VoucherDate',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3,
  };

  get allInvoiceNonJob() {
    return this.allItems;
  }

  partySearchFn = (_searchTerm: string, partyType: string): Observable<any[]> => {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    const branchMasterSid = this.currentBranch?.BranchMasterSid;
    if (!companyMasterSid || !branchMasterSid || partyType !== 'CustomerMasterSid') return of([]);

    return this.operationService.getAllDebtorWithCOAMapped({ CompanyMasterSid: companyMasterSid, BranchMasterSid: branchMasterSid }).pipe(
      map((resp: any) => {
        const rows = Array.isArray(resp?.data) ? resp.data : [];
        this.partyOptions = rows;
        return rows;
      }),
      catchError(() => of([]))
    );
  };

  constructor(
    private invoiceNonJobService: InvoiceNonJobService,
    private operationService: OperationService,
    private accountsService: AccountsService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    private datePipe: CustomDatePipe,
    private mps: MenuPermissionService,
    private voucherActionGuard: VoucherActionGuardService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.userData = this.appSettingService.getDecryptedUserProfile();

    const fy = this.appSettingService.getCurrentFinancialYear();
    const bounds = getFinancialYearDateRangeBounds(fy);
    this.dateRangeConfig = { enabled: true, defaultPreset: 'last30', minDate: bounds.minDate, maxDate: bounds.maxDate };
    this.currentFilters = { dateRange: this.getDefaultDateRange(), dateType: 'VoucherDate' };

    this.initializeHeaderActions();
    this.initializeTableConfig();
    this.mps.init().subscribe(() => {
      this.initializeHeaderActions();
      this.initializeTableConfig();
    });
    this.loadCurrencies();
    super.ngOnInit();
  }

  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.invoiceNonJobService.searchInvoices(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams & Record<string, any> {
    const params: any = {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      JobOrNonJob: true,
    };

    if (this.currentFilters.dateRange?.fromDate) params.dateFrom = this.currentFilters.dateRange.fromDate;
    if (this.currentFilters.dateRange?.toDate) params.dateTo = this.currentFilters.dateRange.toDate;
    if (this.currentFilters.dateType) params.dateField = this.currentFilters.dateType;
    if (this.currentFilters.party) {
      const partyMasterSid = this.resolvePartyMasterSid(this.currentFilters.party.partyId);
      if (partyMasterSid) params.PartyMasterSid = partyMasterSid;
      params.CustomerMasterSid = this.currentFilters.party.partyId;
      params.customerName = this.currentFilters.party.partyName;
    }
    if (this.currentFilters.pol) params.CurrencyCode = this.currentFilters.pol;
    if (!this.hasExplicitDateRange()) {
      const currentYear = this.appSettingService.getCurrentFinancialYear();
      if (currentYear?.YearMasterSid) params.YearMasterSid = currentYear.YearMasterSid;
    }
    return params;
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (!response.status) {
      this.appSettingService.showError('Error searching Non Job Invoice.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
      return;
    }

    const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
    this.allItems = rawItems.map((item: any) => ({
      ...item,
      VoucherDateRaw: item?.VoucherDate,
      VoucherDate: this.datePipe.transform(item?.VoucherDate),
      BillNo: item?.BillNo || item?.DocumentNumber || '',
      BillDate: this.datePipe.transform(item?.BillDate || item?.DocumentDate),
      PostStatusLabel: item.PostStatus === 'P' ? 'Posted' : 'Unposted',
      Status: item.Status === 'A' ? 'Active' : 'Suspended',
      AmountFormatted: this.formatAmount(item.Amount),
    }));
    this.totalLengthOfCollection = response?.data?.totalCount || rawItems.length || 0;
    this.applySorting();
    this.updateHeaderActionState();
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching Non Job Invoice.');
    console.error('Error searching Non Job Invoice', error);
    super.handleSearchError(error);
  }

  initializeHeaderActions(): void {
    this.headerActions = [
      { label: 'Create', icon: 'fas fa-plus', action: 'create', disabled: !this.mps.can('insert') },
      { label: 'Report', icon: 'fas fa-file-alt', action: 'report', disabled: this.totalLengthOfCollection === 0 },
      { label: 'Reset', icon: 'fas fa-sync-alt', action: 'reset' },
    ];
  }

  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: [
        { key: 'VoucherNumber', label: 'Invoice No', sortable: true, filterable: true, visible: true, dataType: 'string' },
        { key: 'VoucherDate', label: 'Invoice Date', sortable: true, filterable: true, visible: true, dataType: 'string', width: '120px' },
        { key: 'PartyName', label: 'Customer Name', sortable: true, filterable: true, visible: true, dataType: 'string', width: '180px' },
        { key: 'BillNo', label: 'Bill No', sortable: true, filterable: true, visible: true, dataType: 'string', width: '130px' },
        { key: 'BillDate', label: 'Bill Date', sortable: true, filterable: true, visible: true, dataType: 'string', width: '120px' },
        { key: 'Narration', label: 'Narration', sortable: true, filterable: true, visible: true, dataType: 'string', width: '220px' },
        { key: 'CurrencyCode', label: 'Currency', sortable: true, filterable: true, visible: true, dataType: 'string', width: '100px' },
        { key: 'AmountFormatted', label: 'Amount', sortable: true, filterable: true, visible: true, dataType: 'number', width: '120px', cellClass: 'text-end' },
        { key: 'PostStatusLabel', label: 'Post Status', sortable: true, filterable: true, visible: true, dataType: 'string', width: '120px', template: 'status' },
        { key: 'Status', label: 'Status', sortable: true, filterable: true, visible: true, template: 'status', width: '100px', dataType: 'string' },
        { key: 'CreatedBy', label: 'Created By', sortable: true, filterable: true, visible: true, dataType: 'string', width: '150px' },
      ],
      actions: [
        { icon: 'fas fa-eye', label: 'View', action: 'view', tooltip: 'View', state: !this.mps.can('view') },
        { icon: 'fas fa-trash', label: 'Delete', action: 'delete', tooltip: 'Delete', class: 'text-danger', state: !this.mps.can('delete'), condition: (row: any) => this.canDeleteInvoice(row) },
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'VoucherHeaderSid',
      emptyMessage: 'No Non Job Invoice found',
      dragAndDrop: true,
    };
  }

  onActionTriggered(action: string): void {
    if (action === 'create') this.navigateToAddNewInvoice();
    if (action === 'report') this.report();
    if (action === 'reset') this.resetPage();
  }

  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') this.router.navigate(['/accounts/invoice-non-job/entry', event.row.VoucherHeaderSid]);
    if (event.action === 'delete') this.deleteInvoice(event.row.VoucherHeaderSid, event.row);
  }

  onTableRowClick(_row: any): void {}

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(_filters: TableFilter[]): void {}

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.page = 1;
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = { dateRange: this.getDefaultDateRange(), dateType: 'VoucherDate' };
    this.clearFilter();
  }

  navigateToAddNewInvoice(): void {
    const blockedReason = this.voucherActionGuard.getInsertBlockedReason({ documentName: 'Invoice Non Job', canInsert: this.mps.can('insert') });
    if (this.voucherActionGuard.block(blockedReason)) return;
    this.router.navigate(['/accounts/invoice-non-job/entry']);
  }

  deleteInvoice(id: number, invoice?: any): void {
    const row = invoice ?? this.allItems.find((item: any) => item?.VoucherHeaderSid === id);
    const blockedReason = this.voucherActionGuard.getDeleteBlockedReason({
      documentName: 'Invoice Non Job',
      status: row?.Status,
      postStatus: row?.PostStatus ?? row?.PostStatusLabel,
      canDelete: this.mps.can('delete'),
      blockedByCondition: !this.canDeleteInvoice(row),
      blockedConditionReason: 'Only active unposted invoices can be deleted.',
    });
    if (this.voucherActionGuard.block(blockedReason)) return;

    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result !== true) return;
      this.spinner.show();
      this.accountsService.deleteVoucher({
        VoucherHeaderSid: id,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        UserEmail: this.userData?.userEmail,
      }).subscribe({
        next: (resp: any) => {
          this.spinner.hide();
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message || 'Invoice deleted successfully');
            this.search();
          } else {
            this.appSettingService.showError(resp.message || 'Failed to delete invoice');
          }
        },
        error: () => {
          this.spinner.hide();
          this.appSettingService.showError('Failed to delete invoice');
        },
      });
    });
  }

  report(): void {
    const visibleColumns = this.invoiceNonJobTable.getVisibleColumns();
    const headers = visibleColumns.map((column) => ({ key: column.key, label: column.label }));
    this.excelReportService.exportAsExcel({
      data: this.allInvoiceNonJob,
      headers,
      fileName: 'Invoice-Non-Job-Report',
      title: this.currentCompany?.companyName ?? 'Company',
    });
  }

  private loadCurrencies(): void {
    this.operationService.getAllCurrencies().pipe(
      map((response: any) => (Array.isArray(response?.data) ? response.data : []).map((row: any) => ({ ...row, currencyCode: row.currencyCode || row.CurrencyCode || row.code || '' }))),
      catchError(() => of([]))
    ).subscribe((currencies: any[]) => {
      this.currencyFilterConfig = { ...this.currencyFilterConfig, options: currencies.filter((c: any) => !!c.currencyCode) };
    });
  }

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map((action) => action.action === 'report' ? { ...action, disabled: this.totalLengthOfCollection === 0 } : action);
  }

  private getDefaultDateRange(): NonNullable<AdvancedFilterValues['dateRange']> {
    const range = getFinancialYearPresetDateRange('last30', this.appSettingService.getCurrentFinancialYear());
    return { preset: 'last30', ...range };
  }

  private hasExplicitDateRange(): boolean {
    return !!(this.currentFilters.dateRange?.fromDate || this.currentFilters.dateRange?.toDate);
  }

  private resolvePartyMasterSid(partyId: any): number | null {
    const idNum = Number(partyId);
    if (!idNum || this.partyOptions.length === 0) return null;
    const match = this.partyOptions.find((p: any) =>
      Number(p?.CustomerMasterSid) === idNum ||
      Number(p?.SubledgerMasterSid) === idNum ||
      Number(p?.PartyMasterSid) === idNum
    );
    return match?.SubledgerMasterSid ?? match?.PartyMasterSid ?? null;
  }

  private canDeleteInvoice(row: any): boolean {
    const status = String(row?.Status ?? '').trim().toUpperCase();
    const postStatus = String(row?.PostStatus ?? row?.PostStatusLabel ?? '').trim().toUpperCase();
    return (status === 'A' || status === 'ACTIVE') && (postStatus === 'U' || postStatus === 'UNPOSTED');
  }

  private formatAmount(amount: number | string): string {
    if (!amount) return '0.00';
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return Number.isNaN(value) ? '0.00' : value.toFixed(2);
  }
}
