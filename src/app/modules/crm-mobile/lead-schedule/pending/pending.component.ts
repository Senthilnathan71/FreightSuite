import { Router } from '@angular/router';
import { LeadService } from './../../Services/lead.service';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AppService } from 'src/app/service/app.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
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
  selector: 'app-pending',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent // Add this import
  ],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.scss'
})
export class PendingComponent extends BaseListComponent implements OnInit {
  @ViewChild('scheduleTable') scheduleTable!: ReusableTableComponent;
  @ViewChild('exitingCustomerTable') exitingCustomerTable!: ReusableTableComponent;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
 
  isMobile: boolean = false;
  currentCompany: any;
  currentBranch: any;
  PreCustomerMasterSid: any;
 
  // Table configurations
  tableConfig: TableConfig;
  tableCustomerConfig: TableConfig;
 
  // Header actions
  opportunityHeaderActions: HeaderAction[] = [];
  existingCustomerHeaderActions: HeaderAction[] = [];
 
  tableLoading = false;
 
  protected config: ListComponentConfig = {
    storageKey: 'Schedule-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'leadStatus',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };
 
  // Alias for compatibility with existing template
  get allSchedule() { return this.allItems; }
 
  tabs = [
    { name: 'Opportunity', icon: 'fas fa-calendar-check' },
    { name: 'Existing Customers', icon: 'fas fa-boxes' },
  ];
  selectedTab = this.tabs[0].name;
 
  pendingSchedule: any[] = []
  allExistingCustomers: any[] = [];
 
  constructor(
    private leadService: LeadService,
    private router: Router,
    private appService: AppService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private excelReportService: ExcelExportService
  ) {
    super(paginationService);
  }
 
  override ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.isMobile = this.appService.getDevice();
   
    // Initialize table configurations
    this.initializeTableConfigs();
   
    // Initialize header actions
    this.initializeHeaderActions();
   
    // Initialize base component
    super.ngOnInit();
   
    // Load initial data for the default tab
    this.selectTab(this.selectedTab);
  }
 
  selectTab(tabName: string): void {
    this.selectedTab = tabName;
    this.clearFilter(); // Clear search when switching tabs
 
    if (tabName === 'Existing Customers') {
      this.search('existing');
    } else if (tabName === 'Opportunity') {
      this.search('opportunity');
    }
  }
 
  // Header Actions Implementation
  private initializeHeaderActions(): void {
    this.opportunityHeaderActions = [
      {
        label: 'Report',
        icon: 'fas fa-file-alt',
        action: 'report',
        disabled: this.allItems.length === 0
      },
      {
        label: 'Reset',
        icon: 'fas fa-sync-alt',
        action: 'reset'
      }
    ];
 
    this.existingCustomerHeaderActions = [
      {
        label: 'Report',
        icon: 'fas fa-file-alt',
        action: 'report',
        disabled: this.allExistingCustomers.length === 0
      },
      {
        label: 'Reset',
        icon: 'fas fa-sync-alt',
        action: 'reset'
      }
    ];
  }
 
  // Opportunity Tab Methods
  onOpportunitySearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.search('opportunity');
  }
 
  opportunityResetPage(): void {
    this.clearFilter();
    this.clearSearch();
    this.filterValue = '';
    this.search('opportunity');
  }
 
  onOpportunityActionTriggered(action: string): void {
    switch (action) {
      case 'report':
        this.opportunityReport();
        break;
      case 'reset':
        this.opportunityResetPage();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
 
  onOpportunityTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      const id = event.row.PreCustomerMasterSid;
      this.createMeeting(id);
    }
  }
 
  onOpportunityTableRowClick(row: any): void {
    // Handle row click if needed
    console.log('Opportunity row clicked:', row);
  }
 
  onOpportunityTableFilterChange(filters: TableFilter[]): void {
    console.log('Opportunity filters changed:', filters);
    // You can implement additional filter logic here if needed
  }
 
  private opportunityReport(): void {
    const visibleColumns = this.scheduleTable?.getVisibleColumns();
    if (!visibleColumns || this.allItems.length === 0) return;
 
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));
   
    this.excelReportService.exportAsExcel({
      data: this.allItems,
      headers: dynamicHeaders,
      fileName: 'Opportunity-Report',
      title: this.currentCompany?.companyName ?? 'Company'
    });
  }
 
  clearSearch() {
  if (this.searchInput) {
    this.searchInput.nativeElement.value = '';
  }
}
 
  // Existing Customers Tab Methods
  onExistingCustomerSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.search('existing');
  }
 
  existingCustomerResetPage(): void {
    this.clearFilter();
    this.filterValue = '';
    this.clearSearch();
    this.search('existing');
  }
 
  onExistingCustomerActionTriggered(action: string): void {
    switch (action) {
      case 'report':
        this.existingCustomerReport();
        break;
      case 'reset':
        this.existingCustomerResetPage();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
 
  onExistingCustomerTableActionClick(event: TableEventData): void {
    // Handle existing customer table actions if needed
    console.log('Existing customer table action:', event);
  }
 
  onExistingCustomerTableRowClick(row: any): void {
    // Handle row click if needed
    console.log('Existing customer row clicked:', row);
  }
 
  onExistingCustomerTableFilterChange(filters: TableFilter[]): void {
    console.log('Existing customer filters changed:', filters);
    // You can implement additional filter logic here if needed
  }
 
  private existingCustomerReport(): void {
    const visibleColumns = this.exitingCustomerTable?.getVisibleColumns();
    if (!visibleColumns || this.allExistingCustomers.length === 0) return;
 
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));
   
    this.excelReportService.exportAsExcel({
      data: this.allExistingCustomers,
      headers: dynamicHeaders,
      fileName: 'Existing-Customers-Report',
      title: this.currentCompany?.companyName ?? 'Company'
    });
  }
 
  // Base search implementation
  protected searchItems(context?: string): Observable<any> {
    this.tableLoading = true;
    this.spinner.show(); 
    if (context === 'existing') {
      return this.leadService.searchExistingCustomers(this.getSearchParams());
    } else {
      return this.leadService.searchOpportunity(this.getSearchParams());
    }
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
 
 protected processSearchResults(response: any, context?: any): void {
  this.tableLoading = false;
  this.spinner.hide();

  console.log('Search Result:', response);

  // Handle structure: { status, data: { items: [] } }
  const data =
    response?.data?.items ??
    response?.data ??
    response; // fallback if structure changes

  if (!Array.isArray(data)) {
    this.appSettingService.showError('Error searching schedule.');
    console.error('Unexpected response format:', response);
    this.allItems = [];
    this.allExistingCustomers = [];
    return;
  }

  if (context === 'existing') {
    this.allExistingCustomers = data;
    this.totalLengthOfCollection = data.length;
    this.updateExistingCustomerHeaderActions();
    return;
  }

  // Default: opportunity
  this.allItems = data.map((schedule: any) => ({
    ...schedule,
    cityName: schedule.cityMaster?.cityName || 'N/A',
    calendarIcon: '📅',
    PreCustomerMasterSid: schedule.PreCustomerMasterSid,
    leadStatus: LeadStatusLabels[schedule.leadStatus]
  }));

  this.totalLengthOfCollection = this.allItems.length;
  this.applySorting();
  this.updateOpportunityHeaderActions();
}



 
  protected override applySorting(): void {
    if (!this.allItems.length) return;
 
    // Custom sorting to prioritize Qualify records
    this.allItems.sort((a, b) => {
      const isAQualify = a.leadStatus === 'Qualify' || a.leadStatus === 'Qualified';
      const isBQualify = b.leadStatus === 'Qualify' || b.leadStatus === 'Qualified';
     
      // If one is qualify and other isn't, qualify comes first
      if (isAQualify && !isBQualify) return -1;
      if (!isAQualify && isBQualify) return 1;
     
      // If both are qualify or both aren't, apply normal sorting
      if (this.sortColumn && a[this.sortColumn] !== b[this.sortColumn]) {
        const direction = this.sortDirection === 'asc' ? 1 : -1;
        if (a[this.sortColumn] < b[this.sortColumn]) return -1 * direction;
        if (a[this.sortColumn] > b[this.sortColumn]) return 1 * direction;
      }
     
      return 0;
    });
  }
 
  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching schedule.');
    console.error('Error searching schedule', error);
    super.handleSearchError(error);
  }
 
  // Helper methods to update header actions state
  private updateOpportunityHeaderActions(): void {
    const reportAction = this.opportunityHeaderActions.find(action => action.action === 'report');
    if (reportAction) {
      reportAction.disabled = this.allItems.length === 0;
    }
  }
 
  private updateExistingCustomerHeaderActions(): void {
    const reportAction = this.existingCustomerHeaderActions.find(action => action.action === 'report');
    if (reportAction) {
      reportAction.disabled = this.allExistingCustomers.length === 0;
    }
  }
 
  // Table configurations
  private initializeTableConfigs(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'preCustomerName',
          label: 'Customer Name',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'cityName',
          label: 'City',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'contactPerson',
          label: 'Contact',
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
          key: 'leadStatus',
          label: 'Lead Status',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'calendarIcon',
          label: 'Schedule',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: "100px",
          template: 'link',
        }
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'PreCustomerMasterSid',
      emptyMessage: 'No schedule found',
      dragAndDrop: true
    };
 
    this.tableCustomerConfig = {
      columns: [
        {
          key: 'CustomerName',
          label: 'Customer Name',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'CustomerAddress1',
          label: 'Customer Address',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'PreCustomerMasterSid',
      emptyMessage: 'No customers found',
      dragAndDrop: true
    };
  }
 
  // Add missing method for sort change
  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }
 
  createMeeting(PreCustomerMasterSid: number) {
    this.router.navigate([`/crm/lead-schedule-meeting/${PreCustomerMasterSid}`]);
  }
 
  // Override clearFilter to handle both tabs
  override clearFilter(): void {
    super.clearFilter();
    // Additional clearing logic if needed
  }
}