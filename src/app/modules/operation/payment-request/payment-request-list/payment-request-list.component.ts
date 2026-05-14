import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableFilter, TableSortConfig } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { OperationService } from '../../operation.service';

@Component({
  selector: 'app-payment-request-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FeatherModule,
    NgbPaginationModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    CustomDatePipe,
  ],
  providers: [CustomDatePipe],
  templateUrl: './payment-request-list.component.html',
})
export class PaymentRequestListComponent extends BaseListComponent implements OnInit {
  @ViewChild('paymentRequestTable') paymentRequestTable!: ReusableTableComponent;

  currentCompany: any;
  currentBranch: any;
  userData: any;
  loading = false;
  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'payment-request-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'PaymentRequestDate',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  tableConfig: TableConfig;
  headerActions: HeaderAction[] = [];

  get allPaymentRequests() { return this.allItems; }

  constructor(
    private operationService: OperationService,
    public router: Router,
    public appSettingsService: AppSettingsService,
    public spinner: NgxSpinnerService,
    public mps: MenuPermissionService,
    private datePipe: CustomDatePipe,
    public excelService: ExcelExportService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingsService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingsService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(() => {
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });

    super.ngOnInit();
  }

  initializeHeaderActions(): void {
    this.headerActions = [
      // {
      //   label: 'Create',
      //   icon: 'fas fa-plus',
      //   action: 'create',
      //   disabled: !this.mps.can('insert')
      // },
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

  initializeTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'PaymentRequestNumber',
          label: 'Request No',
          sortable: true,
          filterable: true,
          visible: true,
        
        },
        {
          key: 'PaymentRequestDate',
          label: 'Request Date',
          sortable: true,
          filterable: true,
          visible: true,
          width: '140px'
        },
        {
          key: 'PayableTo',
          label: 'Payable To',
          sortable: true,
          filterable: true,
          visible: true,
          cellClass: 'text-truncate'
        },
        {
          key: 'PartyName',
          label: 'Party Name',
          sortable: true,
          filterable: true,
          visible: true,
         
          cellClass: 'text-truncate'
        },
        {
          key: 'DepartmentName',
          label: 'Department',
          sortable: true,
          filterable: true,
          visible: true,
          width: '150px'
        },
        {
          key: 'CurrencyCode',
          label: 'Cur',
          sortable: true,
          filterable: true,
          visible: true,
          width: '100px'
        },
        {
          key: 'ListAmount',
          label: 'Amount',
          sortable: true,
          filterable: true,
          visible: true,
          width: '130px',
          cellClass: 'text-end pe-5'
        },
        {
          key: 'PaymentRequestStatus',
          label: 'Request Status',
          sortable: true,
          filterable: true,
          visible: true,
          width: '150px',
          template: 'status',
          dataType: 'string',
          cellClass: 'text-center'
        },
        {
          key: 'Status',
          label: 'Status',
          sortable: true,
          filterable: true,
          visible: true,
          width: '100px',
          template: 'status',
          dataType: 'string',
          cellClass: 'status-column'
        }
      ],
      actions: [
        {
          icon: 'fas fa-eye',
          label: 'View',
          action: 'view',
          tooltip: 'View Payment Request',
          state: !this.mps.can('view')
        }
      ],
      selectable: true,
      showPagination: true,
      showColumnToggle: true,
      emptyMessage: 'No payment requests found',
      loadingMessage: 'Loading payment requests...'
    };
  }

  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.operationService.searchPaymentRequest(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams & Record<string, any> {
    return {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response.status) {
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
      this.allItems = rawItems.map((item: any) => ({
        ...item,
        PaymentRequestDateRaw: item.PaymentRequestDate,
        PaymentRequestDate: this.datePipe.transform(item.PaymentRequestDate),
        PartyName: item.customer?.CustomerName || '-',
        DepartmentName: item.dept?.departmentName || '-',
        CurrencyCode: item.paymentRequestDetails?.[0]?.currency?.currencyCode || '-',
        ListAmount: Number(
          (item.paymentRequestDetails || []).reduce((sum: number, detail: any) => sum + Number(detail.CostLocalAmount || 0), 0)
        ).toFixed(2),
        PaymentRequestStatus: this.mapRequestStatus(item.PaymentRequestStatus),
        Status: item.Status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response?.data?.totalCount || rawItems.length || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingsService.showError('Error searching payment requests.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingsService.showError('Error searching payment requests.');
    console.error('Error searching payment requests', error);
    super.handleSearchError(error);
  }

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'report') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 };
      }
      return action;
    });
  }

  onTableFilterChange(filters: TableFilter[]): void {
    console.log('Filters changed:', filters);
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableRowClick(row: any): void {
    // keep parity with payment-list component
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.navigateToCreate();
        break;
      case 'report':
        this.exportToExcel();
        break;
      case 'reset':
        this.resetPage();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  navigateToCreate() {
    this.router.navigate(['operation/payment-request/entry']);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilter();
  }

  onTableActionClick(event: TableEventData): void {
    const row = event.row;
    if (event.action === 'view') {
      this.router.navigate(['operation/payment-request/entry', row.PaymentRequestSid]);
    }
  }

  exportToExcel(): void {
    const formattedData = this.allItems;
    const companyName = this.currentCompany?.companyName ?? 'Company';
    const visibleColumns = this.paymentRequestTable?.getVisibleColumns?.() || [];
    const dynamicHeaders = visibleColumns.map((column: any) => ({
      key: column.key,
      label: column.label
    }));

    this.excelService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Payment-Request-Report',
      title: companyName
    });
  }

  private mapRequestStatus(status: string): string {
    switch (status) {
      case 'Pending':
        return 'Waiting for Approval';
      case 'WaitingForFinalApproval':
        return 'Waiting for Final Approval';
      case 'Approved':
        return 'Approved';
      case 'Rejected':
        return 'Rejected';
      default:
        return status || '-';
    }
  }
}
