import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { LeadService } from '../../Services/lead.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormsModule } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { forkJoin } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { LeadStatusLabels } from 'src/app/common/helper';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
@Component({
  selector: 'app-view',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule,
    NgxSpinnerModule,
    FavoriteStarComponent,
    ReusableTableComponent,
    PageHeaderComponent,
  ],
  templateUrl: './view.component.html',
  styleUrl: './view.component.scss'
})
export class ViewComponent extends BaseListComponent implements OnInit {
  @ViewChild('leadTable') leadTable!: ReusableTableComponent;
  leads: any[] = [];
  errorMessage: string = '';
  // searchPerformed: boolean = false;

  // pagination
  // page = 1;
  // pageSize = 5;
  // totalLengthOfCollection: number;
  searchText: string = '';
  isMobile: boolean = false;
  statusList = ["Active", "Suspended"];

  // Sorting
  // sortColumn = "preCustomerName";
  // sortDirection = "asc";
  headerActions: HeaderAction[] = [];
  // Company context
  currentCompany: any;
  currentBranch: any;
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Zone',
        // condition: (row: any) => this.hasPermission('View')
      },
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'PreCustomerMasterSid',
    emptyMessage: 'No bookings found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'lead-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'LeadNo',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allleads() { return this.allItems; }
  constructor(
    private leadService: LeadService,
    private route: Router,
    private appService: AppService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private excelReportService: ExcelExportService,
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    // this.searchLeads();
    this.isMobile = this.appService.getDevice();
    this.initializeTableConfig();
    this.initializeHeaderActions();
    // Initialize base component
    super.ngOnInit();
  }
  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.leadService.searchLead(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams {
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
      console.log(response.data.items, 'response.data.items')
      this.allItems = (response.data.items || []).map((item: any) => ({
        ...item,
        meetingStatus: LeadStatusLabels[item.leadStatus],
        status: item.status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
        this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching bookings.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching bookings.');
    console.error('Error searching bookings', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchlead();
  }
  // Legacy methods for template compatibility
  searchlead() {
    this.search();
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
        // condition: this.hasPermission('Add')
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
        this.createNew();
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
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.PreCustomerMasterSid || index;
  }


  viewleads(lead: any): void {
    this.route.navigate(['crm/lead', lead.PreCustomerMasterSid])
  }

  report(): void {
    const formattedData = this.allleads;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.leadTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Lead-Report',
      title: companyName
    });
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'preCustomerName',
        label: 'Lead Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'phone',
        label: 'Phone',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'preCustomerType',
        label: 'Type',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'meetingStatus',
        label: 'Schedule',
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
        dataType: 'string'
      },
    ];
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewleads(event.row);
    }
  }

  onTableRowClick(row: any): void {
    // Row clicking can be handled by the table component if needed
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    // For now, we'll handle this with the existing search functionality
    // In a more advanced implementation, you could apply individual column filters
    console.log('Filters changed:', filters);
  }


  // Server-side search implementation
  // searchLeads(): void {
  //   this.spinner.show();
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   let BranchMasterSid = this.currentBranch?.BranchMasterSid;

  //   const params = {
  //     search: this.searchText.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     activeCompanyId: CompanyMasterSid,
  //     activeBranchId: BranchMasterSid,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection
  //   }

  //   this.leadService.searchLead(params).subscribe({
  //     next: (resp: any) => {
  //       if (resp.status) {
  //         this.leads = resp.data?.items || [];
  //         this.totalLengthOfCollection = resp.data?.totalCount || 0;
  //         this.searchPerformed = true;
  //       } else {
  //         this.appSettingService.showError(resp.message)
  //         console.error('Error searching leads', resp.message);
  //         this.leads = [];
  //         this.totalLengthOfCollection = 0;
  //       }
  //       this.spinner.hide();
  //     },
  //     error: (error: any) => {
  //       console.error(error);
  //       this.appSettingService.showError('Error searching leads.');
  //     }
  //   });
  // }

  clearSearchText() {
    this.searchText = "";
    this.page = 1;
    // this.searchLeads();
  }

  // sort(column: string) {
  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.searchLeads(); 
  // }

  updatePaginatedData(): void {
    // this.searchLeads();
  }

  createNew() {
    this.route.navigate(['crm/lead'])
  }

  viewLead(id) {
    this.route.navigate(['crm/lead', id])
  }

  createMeeting(PreCustomerMasterSid: number) {
    this.route.navigate([`/crm/lead-schedule-meeting/${PreCustomerMasterSid}`]);
  }

  findStatus(value) {
    switch (value) {
      case 'A':
        return 'Active'
      default:
        return 'Suspended'
    }
  }

  resetFilters(): void {
    this.searchText = '';
    this.sortColumn = "preCustomerName";
    this.sortDirection = "asc";
    this.leads = [];
    this.totalLengthOfCollection = 0;
    this.page = 1;
    this.searchPerformed = false;
    // this.searchLeads();
  }

}