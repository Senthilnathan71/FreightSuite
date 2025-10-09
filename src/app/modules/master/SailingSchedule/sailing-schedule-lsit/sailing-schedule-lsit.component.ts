import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';


@Component({
  selector: 'app-sailing-schedule-list',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    RouterModule,
    DatePipe,
    NgbPaginationModule,
    NgSelectModule,
    CustomDatePipe,
    FavoriteStarComponent,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
  ],
  providers: [CustomDatePipe],
  templateUrl: './sailing-schedule-lsit.component.html',
  styleUrl: './sailing-schedule-lsit.component.scss'
})
export class SailingScheduleListComponent extends BaseListComponent implements OnInit {
  @ViewChild('scheduleTable') scheduleTable!: ReusableTableComponent;

  // state
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentCompany: any;
  currentBranch: any;

  portList: any[] = [];

  // table & paging
  tableConfig: TableConfig = {
    columns: [],
    actions: [],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'VoyageMasterHeaderSid',
    emptyMessage: 'No sailing schedules found',
    dragAndDrop: false
  };
  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'sailing-schedule-list-state',
    defaultPageSize: 15,
    defaultSortColumn: 'VoyageNo',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 15, 20, 50, 100],
    maxPagesToShow: 3
  };
  headerActions: HeaderAction[] = [];
  // filter & local UI
  //   filterValue = '';
  searchType = 'VoyageNo';
  searched = false;

  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
     private datePipe: CustomDatePipe,
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.initializeHeaderActions();
    this.initializeTableConfig();
    this.loadAllPorts();

    // initialize base list logic (reads saved paging/sort state and triggers first load)
    super.ngOnInit();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster?.[0]?.RoleMasterSid;
    if (currentMenuId && userRole) {
      this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response: any) => {
          this.currentMenuPermissions = response.data?.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions).filter(
            key => this.currentMenuPermissions[key] === 'isTrue'
          );
          this.initializeHeaderActions();
        },
        error: err => {
          console.error('Error getting menu permissions', err);
        }
      });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  // BaseListComponent abstract implementations
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchSailingSchedule(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams {
    return {
      search: this.filterValue?.trim() || '',
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid
    };
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();

    if (response?.status) {
      this.allItems = (response.data.items || []).map((item: any) => ({
        ...item,
        POLPort: item.portMasterPOL?.PortCode || this.getFormattedPort(item.POLSid),
        PODPort: item.portMasterPOD?.PortCode || this.getFormattedPort(item.PODSid),
        vslvoy: `${item.vesselMaster?.VesselName || ''} / ${item.VoyageNo || ''}`,
        ETA:this.datePipe.transform(item?.ETA),
        ETD:this.datePipe.transform(item?.ETD),
        status: item.status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting(); // local fallback sort if needed
      this.updateHeaderActionState();
      this.searched = true;
    } else {
      this.appSettingService.showError(response?.message || 'Error searching sailing schedules.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching sailing schedules.');
    console.error('Error searching sailing schedules', error);
    super.handleSearchError(error);
  }

  // UI helpers
  get allSchedules() { return this.allItems; } // alias used by template if needed

  initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'vslvoy',
        label: 'Vsl / Voy',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'POLPort',
        label: 'POL',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'PODPort',
        label: 'POD',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ETA',
        label: 'ETA',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'date'
      },
      {
        key: 'ETD',
        label: 'ETD',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'date'
      },
      {
        key: 'status',
        label: 'Status',
        sortable: false,
        filterable: false,
        visible: true,
        template: 'status',
        width: '100px',
        dataType: 'string',
        cellClass: 'status-column'
      }
    ];

    this.tableConfig.actions = [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Sailing Schedule',
        condition: (row: any) => this.hasPermission('View')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete Sailing Schedule',
        condition: (row: any) => this.hasPermission('Delete'),
        class:"text-danger"
      }
    ];
  }

  // Template action handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewSchedule(event.row);
    } else if (event.action === 'delete') {
      this.deleteSchedule(event.row.VoyageMasterHeaderSid);
    }
  }

  onTableRowClick(row: any): void {
    // optional row click handling
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'asc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    // keep server-side search simple; could map column filters to API later
    console.log('Table filters changed:', filters);
  }


  override trackBy(index: number, item: any): number {
    return item.VoyageMasterHeaderSid || index;
  }

  viewSchedule(schedule: any): void {
    this.router.navigate(['/master/sailing-schedule/entry', schedule.VoyageMasterHeaderSid]);
  }

  navigateToCreate() {
    this.router.navigate(['/master/sailing-schedule/entry']);
  }

  deleteSchedule(VoyageMasterHeaderSid: number) {
    // ask reusable delete flow from masterService (we'll call API directly here)
    const confirmed = confirm('Are you sure you want to delete this Sailing Schedule?');
    if (!confirmed) return;

    this.masterService.deleteSailingScheduleById(VoyageMasterHeaderSid).subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          this.appSettingService.showSuccess('Sailing Schedule Deleted Successfully');
          this.search(); // reload
        } else {
          this.appSettingService.showError(resp?.message || 'Error Deleting Sailing Schedule');
        }
      },
      error: (err) => {
        console.error('Error Deleting Sailing Schedule', err);
        this.appSettingService.showError('Error Deleting Sailing Schedule');
      }
    });
  }

  // ports
  loadAllPorts() {
    this.masterService.getAllPorts().subscribe({
      next: (resp: any) => {
        if (resp?.status) {
          this.portList = resp.data || [];
        } else {
          this.appSettingService.showError('Error Loading Ports');
        }
      },
      error: (err) => {
        console.error('Error Loading Ports', err);
      }
    });
  }

  getFormattedPort(PortMasterSid: number) {
    if (!PortMasterSid || !this.portList?.length) return '';
    const port = this.portList.find(p => p.PortMasterSid === PortMasterSid);
    return port ? `${port.PortName} (${port.PortCode})` : '';
  }

  // report/export
  // report(): void {
  //   const formattedData = (this.allSchedules || []).map((item: any) => ({
  //     vessel: item.vesselMaster?.VesselName || '',
  //     voyage: item.VoyageNo || '',
  //     POL: item.POLPort || this.getFormattedPort(item.POLSid),
  //     POD: item.PODPort || this.getFormattedPort(item.PODSid),
  //     ETA: item.ETA || '',
  //     ETD: item.ETD || ''
  //   }));

  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   const visibleColumns = this.scheduleTable?.getVisibleColumns?.() ?? [
  //     { key: 'vslvoy', label: 'Vsl/Voy' },
  //     { key: 'POLPort', label: 'POL' },
  //     { key: 'PODPort', label: 'POD' },
  //     { key: 'ETA', label: 'ETA' },
  //     { key: 'ETD', label: 'ETD' }
  //   ];

  //   const headers = visibleColumns.map((c: any) => ({ key: c.key, label: c.label }));

  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers,
  //     fileName: 'Sailing-Schedule-Report',
  //     title: companyName
  //   });
  // }

    report(): void {
    const formattedData = this.allSchedules;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.scheduleTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Sailing-Schedule-Report',
      title: companyName
    });
  }
  // small helpers for template
  searchSchedules() {
    this.page = 1;
    this.search();
  }

    onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchSchedules();
  }
    onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilterValue();
  }

  
  initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Create',
        icon: 'fas fa-plus',
        action: 'create',
        condition: this.hasPermission('Add')
      },
      {
        label: 'Report',
        icon: 'fas fa-file-alt',
        action: 'report',
        disabled: this.totalLengthOfCollection === 0
      },
      {
        label: 'Reset',
        icon: 'fas fa-sync-alt',
        action: 'reset'
      }
    ];
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
      this.navigateToCreate();
        break;
      case 'report':
        this.report();
        break;
      case 'reset':
        this.resetPage();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }



  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'report') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 };
      }
      return action;
    });
  }
  clearFilterValue() {
    this.filterValue = '';
  }

  reset() {
    this.searched = false;
    this.filterValue = '';
    this.searchType = 'VoyageNo';
    this.page = 1;
    this.pageSize = this.config.defaultPageSize;
    this.sortColumn = this.config.defaultSortColumn;
    this.sortDirection = this.config.defaultSortDirection;
    this.search();
  }
}
