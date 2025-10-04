import { Router } from '@angular/router';
import { LeadService } from './../../Services/lead.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AppService } from 'src/app/service/app.service'; import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgxSpinnerModule,
    ReusableTableComponent
  ],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.scss'
})
export class PendingComponent extends BaseListComponent implements OnInit {
  @ViewChild('scheduleTable') LeadTable!: ReusableTableComponent;
  isMobile: boolean = false;
  currentCompany: any;
  currentBranch: any;
  PreCustomerMasterSid: any;
  // Table configuration
  tableConfig: TableConfig = {
    columns: [],
    // actions: [
    //   {
    //     icon: 'fas fa-eye',
    //     label: 'View',
    //     action: 'view',
    //     tooltip: 'View Booking',
    //     condition: (row: any) => this.hasPermission('View')
    //   }
    // ],
    
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'PreCustomerMasterSid',
    emptyMessage: 'No Schedule found',
    dragAndDrop: true
  };

 tableCustomerConfig: TableConfig = {
    columns: [],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'PreCustomerMasterSid',
    emptyMessage: 'No Schedule found',
    dragAndDrop: true
  };



  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'Schedule-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'BookingNo',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allSchedule() { return this.allItems; }
  constructor(private leadService: LeadService, private router: Router, private appService: AppService, private appSettingService: AppSettingsService, private spinner: NgxSpinnerService, paginationService: PaginationService
  ) {
    super(paginationService);
  }

  
  // selectTab(tab: string) {
  //   this.selectedTab = tab;
  // }

  selectTab(tabName: string): void {
  this.selectedTab = tabName;

  if (tabName === 'Existing Customers') {
    this.search('existing'); // calls Existing Customers API
  } else if (tabName === 'Opportunity') {
    this.search('opportunity'); // calls Opportunity API
  }
}

  tabs = [
    { name: 'Opportunity', icon: 'fas fa-calendar-check' },
    { name: 'Existing Customers', icon: 'fas fa-boxes' },
  ];
  selectedTab = this.tabs[0].name;
  
  pendingSchedule: any[] = []
  allExistingCustomers: any[] = [];

  override ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    // this.getAllLeadPendingMeetings();
    this.isMobile = this.appService.getDevice()
    // Initialize table configuration
    this.initializeTableConfig();

    // Initialize base component
    super.ngOnInit();
  }

  // getAllLeadPendingMeetings() {
  //   this.spinner.show();
  //   const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   const BranchMasterSid = this.currentBranch?.BranchMasterSid;
  //   this.leadService.getAllPendingMeetings(CompanyMasterSid, BranchMasterSid).subscribe(
  //     (resp: any[]) => {
  //       console.log(resp,"Pending Schedule")
  //       this.pendingSchedule = resp['data'];  // On success, store the leads data in the component
  //       this.spinner.hide();
  //     }
  //   );

  // }

  // getAllExistingCustomers() {
  //   this.spinner.show();
  //   const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   const BranchMasterSid = this.currentBranch?.BranchMasterSid;
  //   const PreCustomerMasterSid = this.PreCustomerMasterSid;

  //   const payload ={
  //     CompanyMasterSid : CompanyMasterSid,
  //     PreCustomerMasterSid :PreCustomerMasterSid
  //   }
  //   this.leadService.getAllExistingCustomers(payload).subscribe(
  //     (resp: any[]) => {
  //       console.log(resp)
  //       this.allExistingCustomers = resp['data'];  
  //       this.spinner.hide();
  //     }
  //   );

  // }


  protected searchItems(context?: string): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();

    const companyId = this.currentCompany?.CompanyMasterSid;
    const branchId = this.currentBranch?.BranchMasterSid;

    if (context === 'existing') {
      return this.leadService.getAllExistingCustomers({
        CompanyMasterSid: companyId,
        BranchMasterSid: branchId
      });
    } else {
      return this.leadService.getAllPendingMeetings(companyId, branchId);
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
    if (context === 'existing') {
      if (response?.data && Array.isArray(response.data)) {
        this.allExistingCustomers = response?.data || [];
        this.totalLengthOfCollection = this.allExistingCustomers.length;
        this.applySorting();
        return;
      }
    } else {
      if (response?.data && Array.isArray(response.data)) {
        this.allItems = response.data.map((schedule: any) => ({
          ...schedule,
          cityName: schedule.cityMaster?.cityName || 'N/A',
          calendarIcon: '📅',
          PreCustomerMasterSid: schedule.PreCustomerMasterSid
        }));

        this.totalLengthOfCollection = this.allItems.length;
        this.applySorting();
        return;
      }
    }

    // Error case
    this.appSettingService.showError('Error searching schedule.');
    this.allItems = [];
    this.totalLengthOfCollection = 0;
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching schedule.');
    console.error('Error searching schedule', error);
    super.handleSearchError(error);
  }

  searchScedhule() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.PreCustomerMasterSid || index;
  }


  viewBooking(PreCustomerMasterSid: number) {
    this.router.navigate([`/crm/lead-schedule-meeting/${PreCustomerMasterSid}`]);
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
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
        key: 'calendarIcon',
        label: 'Schedule',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: "100px",
        template: 'link',
      }


    ];
    this.tableCustomerConfig.columns = [
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
        key: 'calendarIcon',
        label: 'Schedule',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: "100px",
        template: 'link',
      }
    ];
  }
onTabChange(tab: string) {
    this.selectedTab = tab;
    if (tab === 'Existing Customers') {
      this.search('existing');
    } else if (tab === 'Opportunity') {
      this.search('opportunity');
    }
  }
  onTableActionClick(event: any) {
    console.log(event);
    if (event.action === 'view') {
      const id = event.row.PreCustomerMasterSid;
      console.log("Event triggered", id);
      this.createMeeting(id);
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

  createMeeting(PreCustomerMasterSid: number) {
    this.router.navigate([`/crm/lead-schedule-meeting/${PreCustomerMasterSid}`]);
  }

}
