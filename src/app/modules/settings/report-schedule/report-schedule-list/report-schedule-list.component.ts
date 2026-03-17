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
import { ReportScheduleService } from '../report-schedule.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';

@Component({
  selector: 'app-report-schedule-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
  ],
  templateUrl: './report-schedule-list.component.html',
})
export class ReportScheduleListComponent extends BaseListComponent implements OnInit {
  @ViewChild('scheduleTable') scheduleTable!: ReusableTableComponent;

  currentCompany: any;
  userData: any;
  tableLoading = false;

  tableConfig: TableConfig = {
    columns: [],
    actions: [
      { icon: 'fas fa-eye', label: 'Edit', action: 'edit', tooltip: 'Edit' },
      { icon: 'fas fa-paper-plane', label: 'Test Send', action: 'testSend', tooltip: 'Test Send' },
      { icon: 'fas fa-trash', label: 'Delete', action: 'delete', tooltip: 'Delete' , class: 'text-danger' },
    ],
    selectable: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    emptyMessage: 'No report schedules found',
  };

  headerActions: HeaderAction[] = [];

  protected config: ListComponentConfig = {
    storageKey: 'report-schedule-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'ScheduleName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100],
    maxPagesToShow: 3,
  };

  constructor(
    private router: Router,
    private appSettingService: AppSettingsService,
    private reportScheduleService: ReportScheduleService,
    private spinner: NgxSpinnerService,
    private dialog: MatDialog,
    paginationService: PaginationService,
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.initializeTableConfig();
    this.initializeHeaderActions();
    super.ngOnInit();
  }

  // ─── BaseListComponent abstract methods ───────────────────

  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) {
      this.tableLoading = false;
      this.spinner.hide();
      return of({ status: true, data: [] });
    }
    return this.reportScheduleService.getAll(companyId);
  }

  protected getSearchParams(): SearchParams {
    return {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
    };
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response.status) {
      const items = Array.isArray(response.data) ? response.data : [];
      this.allItems = items.map((item: any) => ({
        ...item,
        ReportDisplayName: item.ReportMaster?.ReportDisplayName || '',
        SubledgerName: item.SubledgerMaster?.SubledgerName || '',
        ActiveLabel: item.IsActive ? 'Active' : 'Inactive',
        LastRunLabel: item.LastRunStatus
          ? `${item.LastRunStatus}${item.LastRunAt ? ' — ' + new Date(item.LastRunAt).toLocaleString() : ''}`
          : 'Never',
      }));

      // Client-side filtering by search text
      if (this.filterValue.trim()) {
        const search = this.filterValue.trim().toLowerCase();
        this.allItems = this.allItems.filter(
          (item: any) =>
            item.ScheduleName?.toLowerCase().includes(search) ||
            item.ReportDisplayName?.toLowerCase().includes(search) ||
            item.ToEmails?.toLowerCase().includes(search),
        );
      }

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
    this.appSettingService.showError('Error loading report schedules');
    super.handleSearchError(error);
  }

  // ─── Table config ─────────────────────────────────────────

  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      { key: 'ScheduleName', label: 'Schedule Name', sortable: true, filterable: true, visible: true, dataType: 'string' },
      { key: 'ReportDisplayName', label: 'Report', sortable: true, filterable: true, visible: true, dataType: 'string' },
      { key: 'Frequency', label: 'Frequency', sortable: true, filterable: true, visible: true, dataType: 'string', width: '100px' },
      { key: 'ScheduleTime', label: 'Time', sortable: true, visible: true, dataType: 'string', width: '80px' },
      { key: 'ToEmails', label: 'To Emails', sortable: false, visible: true, dataType: 'string' },
      { key: 'ReportFormat', label: 'Format', sortable: true, visible: true, dataType: 'string', width: '80px' },
      {
        key: 'ActiveLabel',
        label: 'Active',
        sortable: true,
        visible: true,
        dataType: 'string',
        width: '90px',
        template: 'status',
        cellClass: 'status-column',
      },
      { key: 'LastRunLabel', label: 'Last Run', sortable: false, visible: true, dataType: 'string' },
    ];
  }

  // ─── Header actions ───────────────────────────────────────

  private initializeHeaderActions(): void {
    this.headerActions = [
      { label: 'Create', icon: 'fas fa-plus', action: 'create' },
      { label: 'Reset', icon: 'fas fa-sync-alt', action: 'reset' },
    ];
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.router.navigate(['/settings/report-schedule/entry']);
        break;
      case 'reset':
        this.resetPage();
        break;
    }
  }

  // ─── Table events ─────────────────────────────────────────

  onTableActionClick(event: TableEventData): void {
    switch (event.action) {
      case 'edit':
        this.router.navigate(['/settings/report-schedule/entry', event.row.ReportScheduleSid]);
        break;
      case 'testSend':
        this.onTestSend(event.row);
        break;
      case 'delete':
        this.onDelete(event.row);
        break;
    }
  }

  onTableRowClick(row: any): void {
    this.router.navigate(['/settings/report-schedule/entry', row.ReportScheduleSid]);
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {}

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.page = 1;
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilter();
  }

  // ─── Actions ──────────────────────────────────────────────

  private onTestSend(row: any): void {
    this.spinner.show();
    this.reportScheduleService
      .testSend(row.ReportScheduleSid, this.currentCompany.CompanyMasterSid)
      .subscribe({
        next: (resp: any) => {
          this.spinner.hide();
          if (resp.status) {
            this.appSettingService.showSuccess('Test report sent successfully');
          } else {
            this.appSettingService.showError(resp.message || 'Test send failed');
          }
        },
        error: () => {
          this.spinner.hide();
          this.appSettingService.showError('Test send failed');
        },
      });
  }

  private onDelete(row: any): void {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        const username = this.userData?.userEmail || 'system';
        this.reportScheduleService.delete(row.ReportScheduleSid, username).subscribe({
          next: (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess('Schedule deleted');
              this.search();
            } else {
              this.appSettingService.showError(resp.message || 'Delete failed');
            }
          },
          error: () => this.appSettingService.showError('Delete failed'),
        });
      }
    });
  }
}
