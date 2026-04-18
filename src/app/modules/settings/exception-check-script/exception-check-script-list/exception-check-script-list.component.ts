import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Observable, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PageHeaderComponent, HeaderAction } from 'src/app/shared/components/header-list/header-list.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';

import { ExceptionCheckScriptService } from '../exception-check-script.service';
import { ExceptionCheckScriptResultComponent } from '../exception-check-script-result/exception-check-script-result.component';

@Component({
  selector: 'app-exception-check-script-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
  ],
  templateUrl: './exception-check-script-list.component.html',
})
export class ExceptionCheckScriptListComponent extends BaseListComponent implements OnInit {
  @ViewChild('scriptTable') scriptTable!: ReusableTableComponent;

  userData: any;
  tableLoading = false;

  tableConfig: TableConfig = {
    columns: [],
    actions: [
      { icon: 'fas fa-eye',     label: 'Edit',         action: 'edit',    tooltip: 'Edit' },
      { icon: 'fas fa-play',    label: 'Execute Now',  action: 'execute', tooltip: 'Execute Now' },
      { icon: 'fas fa-history', label: 'View History', action: 'history', tooltip: 'View History' },
      { icon: 'fas fa-trash',   label: 'Delete',       action: 'delete',  tooltip: 'Delete', class: 'text-danger' },
    ],
    selectable: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    emptyMessage: 'No exception-check scripts found',
  };

  headerActions: HeaderAction[] = [];

  protected config: ListComponentConfig = {
    storageKey: 'exception-check-script-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'ScriptName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100],
    maxPagesToShow: 3,
  };

  constructor(
    private router: Router,
    private appSettingService: AppSettingsService,
    private svc: ExceptionCheckScriptService,
    private spinner: NgxSpinnerService,
    private dialog: MatDialog,
    paginationService: PaginationService,
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.initializeTableConfig();
    this.initializeHeaderActions();
    super.ngOnInit();
  }

  // ─── BaseListComponent abstract methods ───────────────────

  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.svc.list$(this.filterValue?.trim() || undefined);
  }

  protected getSearchParams(): SearchParams {
    return {
      search: this.filterValue?.trim() || '',
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
    };
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response?.status !== false) {
      const items = Array.isArray(response?.data) ? response.data : [];
      this.allItems = items.map((item: any) => ({
        ...item,
        ActiveLabel: item.IsActive ? 'Active' : 'Inactive',
        LastRunLabel: item.LastRunStatus
          ? `${item.LastRunStatus}${item.LastRunAt ? ' — ' + new Date(item.LastRunAt).toLocaleString() : ''}`
          : 'Never',
      }));
      this.totalLengthOfCollection = this.allItems.length;
      this.applySorting();
    } else {
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error loading exception-check scripts');
    super.handleSearchError(error);
  }

  // ─── Table config ─────────────────────────────────────────

  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      { key: 'ScriptName',        label: 'Script Name',  sortable: true,  filterable: true,  visible: true, dataType: 'string' },
      { key: 'ScriptDescription', label: 'Description',  sortable: false, visible: true, dataType: 'string' },
      { key: 'ExecutionMode',     label: 'Mode',         sortable: true,  visible: true, dataType: 'string', width: '100px' },
      { key: 'Frequency',         label: 'Frequency',    sortable: true,  visible: true, dataType: 'string', width: '100px' },
      { key: 'ScheduleTime',      label: 'Time',         sortable: true,  visible: true, dataType: 'string', width: '80px' },
      { key: 'ToEmails',          label: 'To Emails',    sortable: false, visible: true, dataType: 'string' },
      { key: 'ActiveLabel',       label: 'Active',       sortable: true,  visible: true, dataType: 'string', width: '90px', template: 'status', cellClass: 'status-column' },
      { key: 'LastRunLabel',      label: 'Last Run',     sortable: false, visible: true, dataType: 'string' },
    ];
  }

  private initializeHeaderActions(): void {
    this.headerActions = [
      { label: 'Create', icon: 'fas fa-plus',      action: 'create' },
      { label: 'Reset',  icon: 'fas fa-sync-alt',  action: 'reset'  },
    ];
  }

  // ─── Header events ────────────────────────────────────────

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create': this.router.navigate(['/settings/exception-check-script/entry']); break;
      case 'reset':  this.resetPage(); break;
    }
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.page = 1;
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilter();
  }

  // ─── Table events ─────────────────────────────────────────

  onTableActionClick(event: TableEventData): void {
    switch (event.action) {
      case 'edit':
        this.router.navigate(['/settings/exception-check-script/entry', event.row.ExceptionCheckScriptSid]);
        break;
      case 'execute':
        this.openResultDialog(event.row);
        break;
      case 'history':
        this.showHistory(event.row);
        break;
      case 'delete':
        this.onDelete(event.row);
        break;
    }
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.applySorting();
  }

  onTableFilterChange(_filters: TableFilter[]): void {}

  // ─── Actions ──────────────────────────────────────────────

  private openResultDialog(row: any): void {
    this.dialog.open(ExceptionCheckScriptResultComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: { scriptSid: row.ExceptionCheckScriptSid, scriptName: row.ScriptName },
    });
  }

  private showHistory(row: any): void {
    this.svc.runs$(row.ExceptionCheckScriptSid, 50).subscribe((res) => {
      // eslint-disable-next-line no-console
      console.table(res?.data ?? []);
      this.appSettingService.showSuccess(`Latest ${res?.data?.length ?? 0} run(s) logged to console (F12)`);
    });
  }

  private onDelete(row: any): void {
    const ref = this.dialog.open(DeleteWarningComponent);
    ref.afterClosed().subscribe((ok) => {
      if (ok !== true) return;
      const username = this.userData?.userEmail || 'system';
      this.spinner.show();
      this.svc.remove$(row.ExceptionCheckScriptSid, username).subscribe({
        next: (resp: any) => {
          this.spinner.hide();
          if (resp?.status !== false) {
            this.appSettingService.showSuccess('Script deleted');
            this.search();
          } else {
            this.appSettingService.showError(resp?.message || 'Delete failed');
          }
        },
        error: () => { this.spinner.hide(); this.appSettingService.showError('Delete failed'); },
      });
    });
  }
}
