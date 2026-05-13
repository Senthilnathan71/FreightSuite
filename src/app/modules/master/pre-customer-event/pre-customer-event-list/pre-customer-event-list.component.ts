import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { Observable } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';

import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';

@Component({
  selector: 'app-pre-customer-event-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
  ],
  templateUrl: './pre-customer-event-list.component.html',
  styleUrl: './pre-customer-event-list.component.scss',
})
export class PreCustomerEventListComponent extends BaseListComponent implements OnInit {
  @ViewChild('eventTable') eventTable!: ReusableTableComponent;

  headerActions: HeaderAction[] = [];
  tableConfig!: TableConfig;
  tableLoading = false;

  // Stats
  totalEvents = 0;
  upcomingEvents = 0;
  totalLeads = 0;
  conversionPct = 0;

  protected config: ListComponentConfig = {
    storageKey: 'pre-customer-event-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'EventDate',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3,
  };

  userData: any;
  currentCompany: any;
  currentBranch: any;

  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    public mps: MenuPermissionService,
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) this.userData = userProfile;

    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(() => {
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });

    super.ngOnInit();
  }

  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchPreCustomerEventList(this.getSearchParams());
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
    if (response?.status) {
      const items = (response.data?.items || []).map((item: any) => {
        const recd = item.TotalLeadRecd ?? 0;
        const success = item.TotalLeadSuccess ?? 0;
        const conv = recd > 0 ? Math.round((success / recd) * 1000) / 10 : 0;
        return {
          ...item,
          eventLeaderName: item.eventLeaderUser?.userName ?? '—',
          cityName: item.cityMaster?.cityName ?? '—',
          dateBadge: this.computeDateBadge(item.EventDate),
          conversionPct: conv,
          Status: item.status === 'A' ? 'Active' : item.status === 'D' ? 'Deleted' : 'Suspended',
        };
      });
      this.allItems = items;
      this.totalLengthOfCollection = response.data?.totalCount || 0;
      this.recomputeStats(items);
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError(response?.message || 'Error searching events.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching events.');
    super.handleSearchError(error);
  }

  private computeDateBadge(eventDate: string | Date) {
    if (!eventDate) return { label: '—', cssClass: 'text-muted' };
    const d = new Date(eventDate);
    const today = new Date();
    const dMid = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const tMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const diffDays = Math.round((dMid - tMid) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { label: 'Today', cssClass: 'badge bg-light-danger text-danger' };
    if (diffDays === 1) return { label: 'Tomorrow', cssClass: 'badge bg-light-warning text-warning' };
    if (diffDays < 0) return { label: 'Past', cssClass: 'badge bg-light-secondary text-muted' };
    return { label: 'Upcoming', cssClass: 'badge bg-light-success text-success' };
  }

  private recomputeStats(items: any[]) {
    this.totalEvents = items.length;
    const today = new Date();
    const tMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    let recd = 0, success = 0, upcoming = 0;
    for (const it of items) {
      recd += it.TotalLeadRecd ?? 0;
      success += it.TotalLeadSuccess ?? 0;
      if (it.status === 'A' && it.EventDate) {
        const d = new Date(it.EventDate);
        const dMid = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        if (dMid >= tMid) upcoming++;
      }
    }
    this.upcomingEvents = upcoming;
    this.totalLeads = recd;
    this.conversionPct = recd > 0 ? Math.round((success / recd) * 1000) / 10 : 0;
  }

  initializeHeaderActions(): void {
    this.headerActions = [
      { label: 'Create', icon: 'fas fa-plus', action: 'create', disabled: !this.mps.can('insert') },
      { label: 'Reset', icon: 'fas fa-sync-alt', action: 'reset' },
    ];
  }

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map((a) => ({ ...a }));
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.search();
  }
  onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilter();
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.router.navigate(['master/pre-customer-event/entry']);
        break;
      case 'reset':
        this.resetPage();
        break;
    }
  }

  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: [
        { key: 'EventName', label: 'Event Name', sortable: true, filterable: true, visible: true, dataType: 'string' },
        { key: 'cityName', label: 'City', sortable: true, filterable: true, visible: true, dataType: 'string' },
        { key: 'EventDate', label: 'Event Date', sortable: true, filterable: true, visible: true, dataType: 'date' },
        { key: 'eventLeaderName', label: 'Event Leader', sortable: true, filterable: true, visible: true, dataType: 'string' },
        { key: 'TotalLeadRecd', label: 'Leads', sortable: true, filterable: true, visible: true, dataType: 'number' },
        { key: 'TotalLeadSuccess', label: 'Success', sortable: true, filterable: true, visible: true, dataType: 'number' },
        { key: 'conversionPct', label: 'Conversion %', sortable: true, filterable: false, visible: true, dataType: 'number' },
        { key: 'Status', label: 'Status', sortable: true, filterable: true, visible: true, template: 'status', width: '100px', dataType: 'string', cellClass: 'status-column' },
      ],
      actions: [
        { icon: 'fas fa-eye', label: 'View', action: 'view', tooltip: 'View / Edit', state: !this.mps.can('view') },
        { icon: 'fas fa-trash', label: 'Delete', action: 'delete', tooltip: 'Delete', class: 'text-danger', state: !this.mps.can('delete') },
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'PreCustomerEventSid',
      emptyMessage: 'No events found',
      dragAndDrop: true,
    };
  }

  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.router.navigate(['/master/pre-customer-event/entry', event.row.PreCustomerEventSid]);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row.PreCustomerEventSid);
    }
  }

  onTableRowClick(_row: any): void {}

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(_filters: TableFilter[]): void {}

  override trackBy(index: number, item: any): number {
    return item.PreCustomerEventSid || index;
  }

  confirmDelete(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deletePreCustomerEventById(id).subscribe({
          next: (resp: any) => {
            if (resp?.status) {
              this.appSettingService.showSuccess('Deleted!');
              this.search();
            } else {
              this.appSettingService.showError(resp?.message || 'Delete failed');
            }
          },
          error: () => this.appSettingService.showError('Delete failed'),
        });
      }
    });
  }
}
