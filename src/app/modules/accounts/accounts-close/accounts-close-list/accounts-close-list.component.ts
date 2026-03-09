import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { AccountsService } from '../../accounts.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { AccountsCloseDetailModalComponent } from '../accounts-close-detail-modal/accounts-close-detail-modal.component';

@Component({
  selector: 'app-accounts-close-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    CustomDatePipe
  ],
  providers: [CustomDatePipe],
  templateUrl: './accounts-close-list.component.html',
  styleUrl: './accounts-close-list.component.scss'
})
export class AccountsCloseListComponent extends BaseListComponent implements OnInit {
  @ViewChild('voucherPeriodTable') voucherPeriodTable!: ReusableTableComponent;

  tableConfig: TableConfig;
  tableLoading = false;
  headerActions: HeaderAction[] = [];
  yearId: number
  currentCompany: any;
  currentBranch: any;
  userData: any;

  protected config: ListComponentConfig = {
    storageKey: 'accounts-close-list-state',
    defaultPageSize: 20,
    defaultSortColumn: 'PeriodName',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100],
    maxPagesToShow: 3
  };

  get allVoucherPeriods() { return this.allItems; }

  constructor(
    private accountsService: AccountsService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private datePipe: CustomDatePipe,
    private excelReportService: ExcelExportService,
    public mps: MenuPermissionService,
    private modalService: NgbModal,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(() => {
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });
    const financialYear = this.appSettingService.getCurrentFinancialYear();
    this.yearId = financialYear?.YearMasterSid || Number(localStorage.getItem('current-year-id'));
    super.ngOnInit();
  }

  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.accountsService.searchVoucherPeriods(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams {
    return {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      yearMasterSid : this.yearId
    };
  }

  protected processSearchResults(response: any): void {
    this.spinner.hide();

    if (!response.status) {
      this.appSettingService.showError('Error fetching Voucher Periods.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
      return;
    }

    this.allItems = response.data.items.map(item => ({
      ...item,
      YearName: item?.YearMaster?.YearName || '-',
      StartDate: this.datePipe.transform(item?.StartDate),
      EndDate: this.datePipe.transform(item?.EndDate),
      Remarks: item?.Remarks || '-',
      status: item.Status === 'A' ? 'Active' : 'Suspended'
    }));

    this.totalLengthOfCollection = response.data.totalCount || 0;
    this.applySorting();
    this.updateHeaderActionState();
  }


  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error fetching accounts close.');
    // console.error('Error fetching Voucher Periods', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchVoucherPeriods();
  }

  searchVoucherPeriods(): void {
    this.page = 1;
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilterValue();
  }

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

  onActionTriggered(action: string): void {
    switch (action) {
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

  clearFilterValue(): void {
    this.clearFilter();
  }

  updatePaginationData(): void {
    this.search();
  }

  override trackBy(index: number, item: any): number {
    return item.VoucherPeriodSid || index;
  }

  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'PeriodName',
          label: 'Name',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'PeriodCode',
          label: 'Code',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'YearName',
          label: 'Year',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'StartDate',
          label: 'Start Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'EndDate',
          label: 'End Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'ARClosed',
          label: 'AR Status',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'APClosed',
          label: 'AP Status',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key:'GLClosed',
          label: 'GL Status',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          filterable: true,
          visible: true,
          template: 'status',
          width: '100px',
          dataType: 'string',
          cellClass: 'status-column'
        }
      ],
      actions: [
        {
          icon: 'fas fa-edit',
          label: 'Edit',
          action: 'edit',
          tooltip: 'Edit Voucher Period',
          state: !this.mps.can('update')
        },
        {
          icon: 'fas fa-eye',
          label: 'View',
          action: 'view',
          tooltip: 'View Voucher Period',
          state: !this.mps.can('view')
        }
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'VoucherPeriodSid',
      emptyMessage: 'No voucher periods found',
      dragAndDrop: true
    };
  }

  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.openModal(event.row, false);
    } else if (event.action === 'edit') {
      this.openModal(event.row, true);
    }
  }

  openModal(item: any, isEditMode: boolean): void {
    const modalRef = this.modalService.open(AccountsCloseDetailModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.voucherPeriod = item;
    modalRef.componentInstance.isEditMode = isEditMode;
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.search();
      }
    }).catch(() => { });
  }

  onTableRowClick(row: any): void {
    // Row clicking can be handled if needed
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    console.log('Filters changed:', filters);
  }

  report(): void {
    const formattedData = this.allVoucherPeriods;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    const visibleColumns = this.voucherPeriodTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Voucher-Period-Report',
      title: companyName
    });
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }
}
