import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { OperationService } from '../../operation.service';

@Component({
  selector: 'app-hawb-bill-list',
  standalone: true,
  imports: [
    FavoriteStarComponent,
    FeatherModule,
    CommonModule,
    FormsModule,
    CustomDatePipe,
    NgbPaginationModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent
  ],
  providers: [CustomDatePipe],
  templateUrl: './hawb-bill-list.component.html',
  styleUrl: './hawb-bill-list.component.scss'
})
export class HawbBillListComponent extends BaseListComponent implements OnInit {
  @ViewChild('houseTable') houseTable!: ReusableTableComponent;

  userData: any;
  currentCompany: any;
  currentBranch: any;

  headerActions: HeaderAction[] = [];
  tableConfig!: TableConfig;

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'house-job-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'HBLNo',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100],
    maxPagesToShow: 3
  };

  // Alias for template compatibility
  get allHouseJob() {
    return this.allItems;
  }

  constructor(
    private operationService: OperationService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe,
    public mps: MenuPermissionService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
      }
    });

    this.mps.init().subscribe(() => {
      this.initializeHeaderActions();
      this.initializeTableConfig();
    });

    this.initializeHeaderActions();
    this.initializeTableConfig();

    super.ngOnInit();
  }

  // =========================
  // BaseListComponent methods
  // =========================

  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.operationService.searchHouseJob(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams & { departmentType: string } {
    return {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      departmentType: 'Air'
    };
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();

    if (!response?.status) {
      this.allItems = [];
      this.totalLengthOfCollection = 0;
      return;
    }

    this.allItems = response.data.items.map((item: any) => ({
      ...item,
      MasterJobSid: item.MasterJobSid,
      MasterJobNumber: item.masterJob?.MasterJobNumber ?? item.MBLNo ?? '',
      departmentName: item?.departmentMaster?.departmentName ?? '',
      ETD: item?.ETD ? this.datePipe.transform(item.ETD) : '',
      ETA: item?.ETA ? this.datePipe.transform(item.ETA) : '',
      HBLDate: item?.HBLDate ? this.datePipe.transform(item.HBLDate) : '',
      Status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

    this.totalLengthOfCollection = response.data.totalCount || 0;
    this.updateHeaderActionState();
  }

  // =========================
  // Header actions
  // =========================

  initializeHeaderActions(): void {
    this.headerActions = [

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

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action =>
      action.action === 'report'
        ? { ...action, disabled: this.totalLengthOfCollection === 0 }
        : action
    );
  }

  // =========================
  // Table config
  // =========================

  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: [
        { key: 'MasterJobNumber', label: 'Master Job No', sortable: true, filterable: true, visible: true, template: 'link', cellClass: 'master-job-column' },
        { key: 'HBLNo', label: 'HBL No', sortable: true, filterable: true, visible: true },
        { key: 'BookingNo', label: 'Booking No', sortable: true, filterable: true, visible: true },
        { key: 'departmentName', label: 'Department', sortable: true, filterable: true, visible: true },
        { key: 'POL', label: 'POL', sortable: true, filterable: true, visible: true },
        { key: 'POD', label: 'POD', sortable: true, filterable: true, visible: true },
        { key: 'ETD', label: 'ETD', sortable: true, filterable: true, visible: true },
        { key: 'ETA', label: 'ETA', sortable: true, filterable: true, visible: true },
        { key: 'HouseStatus', label: 'House Status', sortable: true, filterable: true, visible: true }
      ],
      actions: [
        {
          icon: 'fas fa-eye',
          label: 'View',
          action: 'view',
          tooltip: 'View',
          // state: !this.mps.can('view')
        }
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      emptyMessage: 'No House AirwayBill found'
    };
  }

  // =========================
  // Table events
  // =========================

  onTableActionClick(event: TableEventData): void {
    if (event.column?.key === 'MasterJobNumber') {
      this.router.navigate([
        'operation/mawbill/entry',
        event.row.MasterJobSid
      ]);
      return;
    }

    // Existing view action
    if (event.action === 'view') {
      this.router.navigate([
        'operation/house-job/entry',
        event.row.HouseJobSid
      ]);
    }
  }

  onTableRowClick(row: any): void {
    // same as master-job-list (no action on row click)
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    console.log('Filters changed', filters);
  }

  // =========================
  // Search handlers (REQUIRED)
  // =========================

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchHouseJob();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilterValue();
  }

  // Legacy aliases (same as master list)
  searchHouseJob(): void {
    this.search();
  }

  clearFilterValue(): void {
    this.clearFilter();
  }

  // =========================
  // Header action handlers
  // =========================

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.router.navigate(['operation/house-job/entry']);
        break;
      case 'report':
        this.exportReport();
        break;
      case 'reset':
        this.resetPage();
        break;
    }
  }

  exportReport(): void {
    const visibleColumns = this.houseTable.getVisibleColumns();
    const headers = visibleColumns.map(col => ({
      key: col.key,
      label: col.label
    }));

    this.excelReportService.exportAsExcel({
      data: this.allHouseJob,
      headers,
      fileName: 'House-AirwayBill-Report',
      title: this.currentCompany?.companyName ?? 'Company'
    });
  }
}
