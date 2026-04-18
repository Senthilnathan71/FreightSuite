import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PageHeaderComponent, HeaderAction } from 'src/app/shared/components/header-list/header-list.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData } from 'src/app/shared/interfaces/table.interface';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';

import { ExceptionCheckScriptService } from '../exception-check-script.service';
import { ExceptionCheckScriptResultComponent } from '../exception-check-script-result/exception-check-script-result.component';

@Component({
  selector: 'app-exception-check-script-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    NgxSpinnerModule, ReusableTableComponent, PageHeaderComponent,
  ],
  templateUrl: './exception-check-script-list.component.html',
})
export class ExceptionCheckScriptListComponent extends BaseListComponent implements OnInit {
  @ViewChild('scriptTable') scriptTable!: ReusableTableComponent;

  userData: any;
  tableLoading = false;

  tableConfig: TableConfig = {
    columns: [
      { key: 'ScriptName',     header: 'Script Name',  sortable: true },
      { key: 'ScriptDescription', header: 'Description' },
      { key: 'ExecutionMode',  header: 'Mode' },
      { key: 'Frequency',      header: 'Frequency' },
      { key: 'ScheduleTime',   header: 'Time' },
      { key: 'ToEmails',       header: 'To Emails' },
      { key: 'IsActive',       header: 'Active', type: 'boolean' as any },
      { key: 'LastRunStatus',  header: 'Last Run' },
    ],
    actions: [
      { icon: 'fas fa-eye',        label: 'Edit',         action: 'edit',    tooltip: 'Edit' },
      { icon: 'fas fa-play',       label: 'Execute Now',  action: 'execute', tooltip: 'Execute Now' },
      { icon: 'fas fa-history',    label: 'View History', action: 'history', tooltip: 'View History' },
      { icon: 'fas fa-trash',      label: 'Delete',       action: 'delete',  tooltip: 'Delete', class: 'text-danger' },
    ],
    selectable: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    emptyMessage: 'No exception-check scripts found',
  };

  headerActions: HeaderAction[] = [
    { icon: 'fas fa-plus', label: 'Create', action: 'create', class: 'btn-primary' },
  ];

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
    private toastr: ToastrService,
    paginationService: PaginationService,
  ) {
    super(paginationService);
  }

  ngOnInit(): void {
    this.userData = this.appSettingService.decrypt(localStorage.getItem('userData')) || {};
    this.initializeComponent();
    this.loadData();
  }

  protected loadData(params?: SearchParams): void {
    this.tableLoading = true;
    this.svc.list$(params?.searchValue).subscribe({
      next: (res: any) => {
        this.allItems = res?.data || [];
        this.totalLengthOfCollection = this.allItems.length;
        this.applyClientSidePagination();
        this.tableLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load exception-check scripts');
        this.tableLoading = false;
      },
    });
  }

  onActionTriggered(action: string): void {
    if (action === 'create') this.router.navigate(['/settings/exception-check-script/entry']);
  }

  onTableActionClick(event: TableEventData): void {
    const row = event.row;
    switch (event.action) {
      case 'edit':    this.router.navigate(['/settings/exception-check-script/entry', row.ExceptionCheckScriptSid]); return;
      case 'execute': this.openResultDialog(row); return;
      case 'history': this.openHistoryDialog(row); return;
      case 'delete':  this.confirmDelete(row); return;
    }
  }

  private openResultDialog(row: any): void {
    this.dialog.open(ExceptionCheckScriptResultComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: { scriptSid: row.ExceptionCheckScriptSid, scriptName: row.ScriptName },
    });
  }

  private openHistoryDialog(row: any): void {
    // V1: simple console dump; fast-follow improvement is a dedicated drawer component.
    this.svc.runs$(row.ExceptionCheckScriptSid, 50).subscribe((res) => {
      // eslint-disable-next-line no-console
      console.table(res?.data ?? []);
      this.toastr.info(`Latest ${res?.data?.length ?? 0} run(s) logged to console (F12)`);
    });
  }

  private confirmDelete(row: any): void {
    const ref = this.dialog.open(DeleteWarningComponent, {
      width: '400px', data: { message: `Delete script "${row.ScriptName}"?` },
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.spinner.show();
      this.svc.remove$(row.ExceptionCheckScriptSid, this.userData?.login || 'system').subscribe({
        next: () => {
          this.spinner.hide();
          this.toastr.success('Script deleted');
          this.loadData();
        },
        error: () => { this.spinner.hide(); this.toastr.error('Delete failed'); },
      });
    });
  }
}
