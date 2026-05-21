import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, AfterViewInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { NgbDropdownModule, NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from '../../Services/lead.service';
import { catchError, map, Observable, of } from 'rxjs';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { LeadStatus, LeadStatusLabels } from 'src/app/common/helper';
import { NgSelectModule } from '@ng-select/ng-select';
import { DateTimePickerComponent } from 'src/app/component/datetimepicker/datetimepicker.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { HeaderAction } from 'src/app/shared/components/header-list/header-list.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  PartyFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { UnsavedChangesAction, UnsavedChangesDialogComponent } from 'src/app/shared/components/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

@Component({
  selector: 'app-meeting-update-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule,
    ReactiveFormsModule,
    PreventMultiClickDirective,
    NgxSpinnerModule,
    NgbDropdownModule,
    FavoriteStarComponent,
    NgSelectModule,
    DateTimePickerComponent,
    ReusableTableComponent,
    PageHeaderComponent,
    SearchableDropdown,
    ElementStateGuardDirective,
    FormStateGuardDirective
  ],
  providers: [CustomDatePipe,DatePipe],
  templateUrl: './meeting-update-list.component.html',
  styleUrls: ['./meeting-update-list.component.scss']
})
export class MeetingUpdateListComponent extends BaseListComponent implements OnInit, AfterViewInit {
  @ViewChild('meetingTable') meetingTable!: ReusableTableComponent;
  @ViewChild('modalContentAdd', { read: TemplateRef }) modalContentAdd!: TemplateRef<any>;
  @ViewChild('customerCreatedModal', { static: true }) customerCreatedModal!: TemplateRef<any>;
  
  isEditMode: boolean = false;
  isMobile: boolean = false;
  modalRef: NgbModalRef;
  meetingForm: FormGroup;
  salesPersons: any[] = [];
  btnDisable: boolean = false;
  PreCustomerMeetingSid: number;
  MenuMasterSid:any
  selectedMeeting: any;
  meetingData: any;
  currentMenuId: number;
  TandCList: any;
  currentCompany: any;
  currentBranch: any;
  tableLoading = false;
  dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [
      { label: 'Meeting Date', value: 'meetingDate' },
    ],
    defaultValue: 'meetingDate'
  };
  createdCustomerId: number | null = null;
  userLookupConfig = DROPDOWN_CONFIGS.USER;
  partyFilterConfig: PartyFilterConfig = {
  enabled: true,
  partyTypes: [
    { label: 'Lead', value: 'LeadMasterSid' },
    { label: 'Customer', value: 'PreCustomerMasterSid' }
  ],
  defaultPartyType: 'PreCustomerMasterSid'
};
  currentFilters: AdvancedFilterValues = {};
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  userData: any;
  originalMeetingDate: string;
  private pendingViewMeetingSid: number | null = null;
  isMeetingDirty: boolean = false;
  isMeetingSaving: boolean = false;
  private initialMeetingFormValue: any = null;

  // For mobile view data
  filteredMeetings: any[] = [];
  searched: boolean = false;

  // Header actions
  headerActions: HeaderAction[] = [];
  partySearchFn = (_searchTerm: string, partyType: string): Observable<any[]> => {
  const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;

  if (!CompanyMasterSid) {
    return of([]);
  }

  // Lead dropdown
  if (partyType === 'LeadMasterSid') {
    return this.leadService.fetchAllLeads(CompanyMasterSid).pipe(
      map((data: any) => {
        const rows = Array.isArray(data) ? data : [];
        return rows.map((row: any) => ({
          ...row,
          id: row.LeadMasterSid,
          name: row.leadName
        }));
      }),
      catchError(() => of([]))
    );
  }

  // Customer dropdown
  if (partyType === 'PreCustomerMasterSid') {
    return this.leadService.getAllCustomersWithBranch(CompanyMasterSid).pipe(
      map((data: any) => {
        const rows = Array.isArray(data) ? data : [];
        return rows.map((row: any) => ({
          ...row,
          id: row.PreCustomerMasterSid ?? row.CustomerMasterSid,
          name: row.preCustomerName ?? row.CustomerName
        }));
      }),
      catchError(() => of([]))
    );
  }

  return of([]);
};

  // Table configuration
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Meeting',
        condition: (row: any) => true
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'PreCustomerMeetingSid',
    emptyMessage: 'No meetings found',
    dragAndDrop: true
  };

  meetingDurations = [
    { label: '10 min', value: '10 min' },
    { label: '20 min', value: '20 min' },
    { label: '30 min', value: '30 min' },
    { label: '40 min', value: '40 min' },
    { label: '50 min', value: '50 min' },
    { label: '1 hr', value: '1 hr' }
  ];

  reasonList = [
    { id: 1, name: "Customer Postponed" },
    { id: 2, name: "Salesman on Leave" },
    { id: 3, name: "Salesman having other meeting" },
    { id: 4, name: "Natural Calamity" },
    { id: 5, name: "Assigned to New Salesman " }
  ];

  protected config: ListComponentConfig = {
    storageKey: 'meeting-update-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'customerName',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 50, 100, 500],
    maxPagesToShow: 3
  };

  constructor(
    public mps : MenuPermissionService,
    private router: Router,
    private appService: AppService,
    private appSettingService: AppSettingsService,
    private leadService: LeadService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private commonModalService: ModalService,
    private spinner: NgxSpinnerService,
    private datePipe: CustomDatePipe,
    private excelReportService: ExcelExportService,
    paginationService: PaginationService,
     private commonService: CommonService,
     private ngbModal: NgbModal,
     private dateFormatPipe : DatePipe
  ) {
    super(paginationService);
  }

  get canCreate(): boolean {
    return this.mps.can('insert');
  }

  get canUpdate(): boolean {
    return this.mps.can('update');
  }

  get canView(): boolean {
    return this.mps.can('view');
  }

  get canDelete(): boolean {
    return this.mps.can('delete');
  }

  canAccessAction(action: string): boolean {
    return this.mps.has(action);
  }

  showActionMenu(): boolean {
    return this.mps.hasAtLeastOne();
  }

  override ngOnInit(): void {
    
    // Check if navigated from sales dashboard with a meeting to view
    const navState = history.state;
    if (navState?.viewMeetingSid) {
      this.pendingViewMeetingSid = navState.viewMeetingSid;
      history.replaceState({ ...navState, viewMeetingSid: undefined }, '');
    }
    
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.isMobile = this.appService.getDevice();
     const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(()=>{
      this.initializeHeaderActions();
      this.initializeTableConfig();
    });
    
    this.loadSalesPersons();
    this.initMeetingForm();
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'meetingDate'
    };
    
    super.ngOnInit();
    this.sort('asc')
  }

  ngAfterViewInit(): void {
    if (this.pendingViewMeetingSid) {
      const meetingSid = this.pendingViewMeetingSid;
      this.pendingViewMeetingSid = null;

      setTimeout(() => {
        this.openModal(this.modalContentAdd, { PreCustomerMeetingSid: meetingSid });
      });
    }
  }

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.leadService.searchPreCustomerMeeting(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams & Record<string, any> {
    const userContext = this.getMeetingUserContext();
    const params: any = {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      userId: userContext.userId || undefined,
      userTypeCode: userContext.userTypeCode || undefined
    };

    const selectedDateField = this.currentFilters.dateType || 'meetingDate';
    const isMeetingDatePresetRange =
      selectedDateField === 'meetingDate' &&
      this.currentFilters.dateRange?.preset &&
      this.currentFilters.dateRange.preset !== 'custom';

    if (this.currentFilters.dateRange?.fromDate) {
      params.dateFrom = this.currentFilters.dateRange.fromDate;
      params.DateFrom = this.currentFilters.dateRange.fromDate;
    }
    if (this.currentFilters.dateRange?.toDate && !isMeetingDatePresetRange) {
      params.dateTo = this.currentFilters.dateRange.toDate;
      params.DateTo = this.currentFilters.dateRange.toDate;
    }
    if (this.currentFilters.dateType) {
      params.dateField = this.currentFilters.dateType;
      params.DateField = this.currentFilters.dateType;
      if (params.dateFrom) {
        params[`${this.currentFilters.dateType}From`] = params.dateFrom;
      }
      if (params.dateTo) {
        params[`${this.currentFilters.dateType}To`] = params.dateTo;
      }
    }
    if (this.currentFilters.party) {
  const partyType = this.currentFilters.party.partyType;
  const partyId = this.currentFilters.party.partyId;

  if (partyType === 'LeadMasterSid') {
    params.LeadMasterSid = partyId;
  }

  if (partyType === 'PreCustomerMasterSid') {
    params.PreCustomerMasterSid = partyId;
  }
}

    return params;
  }

  private getMeetingUserContext(): { userId: number; userTypeCode: string } {
    const userProfile = this.appSettingService.getDecryptedUserProfile() || {};
    const userFromStream = this.appSettingService.userSettingSource.value || {};

    const userId = Number(
      userProfile?.UserMasterSid
      || userProfile?.userMasterSid
      || userProfile?.UserSid
      || userProfile?.userSid
      || userProfile?.userMaster?.UserMasterSid
      || userProfile?.userMaster?.userMasterSid
      || userFromStream?.UserMasterSid
      || userFromStream?.userMasterSid
      || userFromStream?.UserSid
      || userFromStream?.userSid
      || 0
    );

    const userTypeCode = String(
      userProfile?.userType?.code
      || userProfile?.userMaster?.userType?.code
      || userFromStream?.userType?.code
      || ''
    );

    return { userId, userTypeCode };
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response.status && response.data?.items) {
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
      const filteredItems = this.applyAdvancedFilters(rawItems);
      this.allItems = filteredItems.map((meeting: any) => {
        const salesPerson = this.salesPersons?.find(
          (person: any) => person.UserMasterSid === meeting.leadAssignTo
        );
        return {
          PreCustomerMeetingSid: meeting.PreCustomerMeetingSid,
          customerName: meeting.customerMaster?.CustomerName || meeting.preCustomerMaster?.preCustomerName ,
          LeadOrCustomer: meeting.LeadOrCustomer === "C" ? "Customer" : "Lead",
          meetingType: meeting.meetingType || 'N/A',
          meetingDate: meeting.meetingDate
          ? this.dateFormatPipe.transform(
              meeting.meetingDate,
              'dd/MMM/yyyy hh:mm:ss a',
              'UTC'
            )
          : '',
          salesPerson: salesPerson?.userName || 'N/A',
          leadAssignTo: meeting.leadAssignTo,
          status: meeting.status === "A" ? "Active" : "Suspended",
          meetingStatus: meeting.meetingStatus || '',
          leadStatus: LeadStatusLabels[meeting?.preCustomerMaster?.leadStatus as LeadStatus] || "-",
          preCustomerMaster: meeting.preCustomerMaster,
          userMaster: meeting.userMaster,
          followUp: meeting.followUpDate || meeting.followUpNote,
          followUpDate: meeting.followUpDate ? this.datePipe.transform(meeting.followUpDate) : '',
          followUpNote: meeting.followUpNote,
          meetingNote: meeting.meetingNote,
          createdBy: meeting.createdBy,
          createdOn: meeting.createdOn,
          updatedBy: meeting.updatedBy,
          updatedOn: meeting.updatedOn,
          rawMeetingDate: meeting.meetingDate,
          rawCustomerName: meeting.preCustomerMaster?.preCustomerName || '',
          preCustomerMasterSid: meeting.preCustomerMaster?.PreCustomerMasterSid || null
        };
      });
      this.totalLengthOfCollection =
        rawItems.length !== filteredItems.length
          ? filteredItems.length
          : (response.data.totalCount || 0);
      this.updateHeaderActionState();
      this.updatePaginatedData();
      this.searched = true;
    } else {
      this.appSettingService.showError('Error searching meetings.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
      this.filteredMeetings = [];
      this.searched = true;
    }
  }

  private parseCustomDate(dateStr: any): Date | null {
    // 🚫 Handle undefined / null / empty
    if (!dateStr || typeof dateStr !== 'string') {
      return null;
    }

    // Expected format: 24/Jan/2026 12:30:00 AM
    const parts = dateStr.split(' ');
    if (parts.length < 3) {
      return null;
    }

    const [datePart, timePart, meridian] = parts;
    if (!datePart || !timePart || !meridian) {
      return null;
    }

    const dateParts = datePart.split('/');
    if (dateParts.length !== 3) {
      return null;
    }

    const [day, monthStr, year] = dateParts;

    const monthMap: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const month = monthMap[monthStr];
    if (month === undefined) {
      return null;
    }

    let [hours, minutes, seconds] = timePart.split(':').map(Number);
    if (
      [hours, minutes, seconds].some(v => Number.isNaN(v))
    ) {
      return null;
    }

    // AM / PM logic
    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    return new Date(
      Number(year),
      month,
      Number(day),
      hours,
      minutes,
      seconds
    );
  }



  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching meetings.');
    console.error('Error searching meetings', error);
    super.handleSearchError(error);
  }

  // Update paginated data for mobile view
  updatePaginatedData(): void {
    if (this.isMobile) {
      const startIndex = (this.page - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      this.filteredMeetings = this.allItems.slice(startIndex, endIndex);
    }
  }

  // Add Math.min method for template
  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig =
    {
      columns: [
        {
          key: 'customerName',
          label: 'Customer Name',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'LeadOrCustomer',
          label: 'Lead Or Customer',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'meetingType',
          label: 'Meeting Type',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'meetingDate',
          label: 'Meeting Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'date'
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
          key: 'salesPerson',
          label: 'Sales Person',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'meetingStatus',
          label: 'Meeting Status',
          sortable: true,
          filterable: true,
          visible: true,
          template: 'status',
          width: '140px',
          dataType: 'string',
          cellClass: 'status-column'
        }
      ],
      actions: [
        {
          icon: 'fas fa-eye',
          label: 'View',
          action: 'view',
          tooltip: 'View Meeting',
          state:  !this.canView
        },
        {
          icon: 'fas fa-trash',
          label: 'Delete',
          action: 'delete',
          tooltip: 'Delete Meeting',
          class:'text-danger',
          state:  !this.canDelete
        }
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'PreCustomerMeetingSid',
      emptyMessage: 'No meetings found',
      dragAndDrop: true
    };
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.openModal(this.modalContentAdd, event.row);
    } else if (event.action === 'delete') {
      this.deleteMeeting(event.row.PreCustomerMeetingSid);
    }
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    console.log('Filters changed:', filters);
  }

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
  }

  // Header actions
  initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Create',
        icon: 'fas fa-plus',
        action: 'create',
         condition: !this.canCreate,
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

  // Report functionality
  report(): void {
    if (!this.allItems || this.allItems.length === 0) {
      this.appSettingService.showWarning("No data available to generate report");
      return;
    }

    const formattedData = this.allItems.map(item => ({
      ...item,
      meetingStatus: this.getMeetingStatusText(item.meetingStatus),
      status: item.status === "A" ? "Active" : "Suspended"
    }));

    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns for desktop, use all columns for mobile
    let dynamicHeaders = [];
    
    if (!this.isMobile && this.meetingTable) {
      const visibleColumns = this.meetingTable.getVisibleColumns();
      dynamicHeaders = visibleColumns.map(column => ({
        key: column.key,
        label: column.label
      }));
    } else {
      // For mobile or when table is not available, use all columns
      dynamicHeaders = [
        { key: 'customerName', label: 'Customer Name' },
        { key: 'meetingType', label: 'Meeting Type' },
        { key: 'meetingDate', label: 'Meeting Date' },
        { key: 'salesPerson', label: 'Sales Person' },
        { key: 'leadStatus', label: 'Lead Status' },
        { key: 'meetingStatus', label: 'Meeting Status' },
        { key: 'status', label: 'Status' }
      ];
    }

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Meeting-Update-Report',
      title: companyName,
      sheetName: 'Meetings'
    });
  }

  // Helper method to format meeting status text
  private getMeetingStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'Scheduled';
      case 'in progress':
        return 'In Progress';
      case 'on hold':
        return 'On Hold';
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      default:
        return status || 'N/A';
    }
  }

  // Legacy methods for template compatibility
  searchMeetings(): void {
    this.search();
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchMeetings();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'meetingDate'
    };
    this.clearFilterValue();
  }

  clearFilterValue(): void {
    this.clearFilter();
  }

  // Form initialization and validation
  initMeetingForm() {
    this.meetingForm = this.fb.group({
      customerName: ['', Validators.required],
      PreCustomerMeetingSid: [''],
      meetingDate: ['', Validators.required],
      followUpDate: [''],
      followUp: [false],
      meetingType: ['', Validators.required],
      leadAssignTo: ['', Validators.required],
      meetingNote: ['', Validators.required],
      meetingStatus: ['Scheduled', Validators.required],
      followUpNote: [''],
      meetingDuration: [''],
      remarks: [''],
      preCustomerMasterSid: [''],
      createdBy: [''],
      updatedBy: ['']
    });

    this.meetingForm.valueChanges.subscribe(() => {
      if (this.initialMeetingFormValue === null) return;
      this.isMeetingDirty = !this.deepEqual(
        this.initialMeetingFormValue,
        this.meetingForm.getRawValue()
      );
    });
  }

  private meetingNoteValidator(control: AbstractControl) {
    const status = this.meetingForm?.get('meetingStatus')?.value;
    if (status === 'on hold' && !control.value) {
      return { required: true };
    }
    return null;
  }

  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.meetingForm.controls;
  }

  loadSalesPersons() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.leadService.getAllSalesman(CompanyMasterSid).subscribe(
      (resp: any) => {
        this.salesPersons = resp;
      }
    );
  }

  private getLast30FromDate(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }

  private hasAdvancedFilterValues(): boolean {
    return !!(
      this.currentFilters.party?.partyId ||
      this.currentFilters.dateRange?.fromDate ||
      this.currentFilters.dateRange?.toDate
    );
  }

  private applyAdvancedFilters(items: any[]): any[] {
    if (!this.hasAdvancedFilterValues()) {
      return items;
    }

    const selectedDateField = this.currentFilters.dateType || 'meetingDate';
    const from = this.currentFilters.dateRange?.fromDate ? new Date(this.currentFilters.dateRange.fromDate) : null;
    const to = this.currentFilters.dateRange?.toDate ? new Date(this.currentFilters.dateRange.toDate) : null;
    const isMeetingDatePresetRange =
      selectedDateField === 'meetingDate' &&
      this.currentFilters.dateRange?.preset &&
      this.currentFilters.dateRange.preset !== 'custom';
    const selectedCustomerSid = this.currentFilters.party?.partyId ? Number(this.currentFilters.party.partyId) : null;
    const selectedCustomerName = this.currentFilters.party?.partyName
      ? String(this.currentFilters.party.partyName).trim().toUpperCase()
      : null;

    return items.filter((item: any) => {
      if (selectedCustomerSid || selectedCustomerName) {
        const itemCustomerSid = Number(
          item?.PreCustomerMasterSid ??
          item?.preCustomerMaster?.PreCustomerMasterSid ??
          item?.CustomerMasterSid ??
          item?.customerMaster?.CustomerMasterSid ??
          0
        );
        const itemCustomerName = String(
          item?.preCustomerMaster?.preCustomerName ??
          item?.CustomerName ??
          item?.customerMaster?.CustomerName ??
          ''
        ).trim().toUpperCase();

        const sidMatches = selectedCustomerSid ? itemCustomerSid === selectedCustomerSid : false;
        const nameMatches = selectedCustomerName ? itemCustomerName === selectedCustomerName : false;
        if (!(sidMatches || nameMatches)) {
          return false;
        }
      }

      if (from || to) {
        const rawDate = item?.[selectedDateField];
        if (!rawDate) {
          return false;
        }

        const itemDate = new Date(rawDate);
        if (Number.isNaN(itemDate.getTime())) {
          return false;
        }

        if (from && itemDate < from) {
          return false;
        }
        if (to && !isMeetingDatePresetRange && itemDate > to) {
          return false;
        }
      }

      return true;
    });
  }

  // Modal and form handling methods
  openModal(content: TemplateRef<any>, meeting: any) {
    this.initMeetingForm();
    // if (meeting) {
    //   this.meetingData = meeting;
    //   const ourSalesperson = this.salesPersons.find(person => person.UserMasterSid === meeting.leadAssignTo)?.UserMasterSid;
    //   this.meetingForm.patchValue({
    //     ...meeting,
    //     leadAssignTo: ourSalesperson
    //   });
    // }
    this.loadMeetingData(meeting.PreCustomerMeetingSid);
    this.modalRef = this.modalService.open(content, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
      keyboard: false,
      beforeDismiss: () => this.canCloseMeetingModal()
    });
  }

  loadMeetingData(meetingId: number) {
    this.spinner.show();
    this.leadService.getPreCustomerMeeting(meetingId).subscribe(
      (meeting: any) => {
        this.selectedMeeting = meeting;

        const meetingDate = meeting.meetingDate
          ? new Date(meeting.meetingDate)
          : '';

        const followUpDate = meeting.followUpDate
          // ? this.formatDateForInput(meeting.followUpDate)
          ? meeting.followUpDate
          : '';

        const followUp = !!(meeting.followUpDate || meeting.followUpNote);
        // this.originalMeetingDate = meetingDate;
        this.meetingForm.patchValue({
          customerName: meeting.preCustomerMaster?.preCustomerName || meeting.customerMaster?.CustomerName || '',
          PreCustomerMeetingSid: meeting.PreCustomerMeetingSid,
          meetingDate: meetingDate,
          meetingType: meeting.meetingType,
          leadAssignTo: meeting.leadAssignTo,
          meetingNote: meeting.meetingNote,
          meetingStatus: meeting.meetingStatus || 'Scheduled',
          followUp: followUp,
          followUpDate: followUp ? followUpDate : '',
          followUpNote: followUp ? meeting.followUpNote || '' : '',
          meetingDuration: meeting.meetingDuration,
          preCustomerMasterSid: meeting.preCustomerMaster?.PreCustomerMasterSid || null,
          createdBy: meeting.createdBy,
          updatedBy: meeting.updatedBy,
          remarks: meeting.remarks || ''
        });
        if (followUp) {
          this.meetingForm.get('followUpDate')?.setValidators(Validators.required);
          this.meetingForm.get('followUpDate')?.updateValueAndValidity();
          this.meetingForm.get('followUpNote')?.setValidators(Validators.required);
          this.meetingForm.get('followUpNote')?.updateValueAndValidity();
        }
        this.setupMeetingDateListener();
        this.meetingForm.controls['meetingStatus'].enable();
        if (meeting.meetingStatus === 'confirmed') {
          this.meetingForm.controls['meetingStatus'].disable();
        }
        this.setMeetingFormInitialValue();
        this.spinner.hide();
      }
    );
  }
  private setupMeetingDateListener(): void {
  this.meetingForm.get('meetingDate')?.valueChanges.subscribe((newDate: string) => {
    this.handleMeetingDateChange(newDate);
  });
}
private handleMeetingDateChange(newDate: string): void {
  if (this.originalMeetingDate && newDate !== this.originalMeetingDate) {
    // Date has changed - make remarks mandatory
    this.meetingForm.get('remarks')?.setValidators([Validators.required]);
    this.meetingForm.get('remarks')?.updateValueAndValidity();
    
    
    
  } else {
    // Date is same as original or no original date - remove required validator
    this.meetingForm.get('remarks')?.clearValidators();
    this.meetingForm.get('remarks')?.updateValueAndValidity();
  }
}


  formatDateForInput(dateString: string) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  onUpdateMeeting() {
     if (this.isMeetingSaving) return;
     if (!this.canUpdate) {
      this.appSettingService.showWarning('You do not have permission to update this meeting.');
      return;
    }
     if (!this.isMeetingDirty) {
      this.appSettingService.showWarning('No changes to save.');
      return;
    }
     const currentMeetingDate = this.meetingForm.get('meetingDate')?.value;
     if (this.originalMeetingDate && currentMeetingDate !== this.originalMeetingDate) {
    // Validate remarks if date changed
    this.meetingForm.get('remarks')?.markAsTouched();
    if (this.meetingForm.get('remarks')?.invalid) {
      this.appSettingService.showError("Please update the reason when the meeting date is changed.");
      return;
    }
  }
    if (!this.meetingForm.get('meetingNote')?.value?.trim()) {
      this.meetingForm.get('meetingNote')?.markAsTouched();
      this.appSettingService.showError("Meeting Note is required.");
      return;
    }

    if (this.meetingForm.get('followUp')?.value && !this.meetingForm.get('followUpDate')?.value) {
      this.meetingForm.get('followUpDate')?.markAsTouched();
      this.appSettingService.showError("Follow Up Date is required when Follow Up is enabled.");
      return;
    }

    if (this.meetingForm.get('followUp')?.value && !this.meetingForm.get('followUpNote')?.value?.trim()) {
      this.meetingForm.get('followUpNote')?.markAsTouched();
      this.appSettingService.showError("Follow Up Note is required when Follow Up is enabled.");
      return;
    }

    if (!this.meetingForm.get('meetingStatus')?.value) {
      this.meetingForm.get('meetingStatus')?.markAsTouched();
      this.appSettingService.showError("Meeting status is required.");
      return;
    }

    if (this.selectedMeeting.meetingStatus === 'confirmed') {
      this.appSettingService.showError("Meeting status is already confirmed and cannot be edited.");
      return;
    }

    this.btnDisable = true;
    this.isMeetingSaving = true;

    const payload = {
      PreCustomerMeetingSid: this.selectedMeeting.PreCustomerMeetingSid,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      PreCustomerMasterSid:
        this.meetingForm.get('preCustomerMasterSid')?.value ||
        this.selectedMeeting.preCustomerMaster?.PreCustomerMasterSid,
      ...this.meetingForm.getRawValue(),
    };

    if (!this.meetingForm.get('followUp')?.value) {
      delete payload.followUpNote;
      delete payload.followUpDate;
    }

    this.leadService.createPreCustomerMeeting(payload).subscribe(
      resp => {
        if (resp.data && resp.status) {
          const meetingStatus = (payload?.meetingStatus || '').toString().toLowerCase();
          const leadOrCustomer = (
            this.selectedMeeting?.LeadOrCustomer ??
            resp?.data?.LeadOrCustomer ??
            payload?.LeadOrCustomer ??
            ''
          ).toString();
          const preCustomerMasterSid =
            payload?.PreCustomerMasterSid ??
            this.selectedMeeting?.PreCustomerMasterSid ??
            this.selectedMeeting?.preCustomerMaster?.PreCustomerMasterSid ??
            resp?.data?.PreCustomerMasterSid;

          const isLeadConfirmedMeeting =
            meetingStatus === 'confirmed' &&
            leadOrCustomer === 'L' &&
            !!preCustomerMasterSid;

          const createdCustomerId = this.extractCreatedCustomerId(resp);

          if (isLeadConfirmedMeeting && createdCustomerId) {
            this.createdCustomerId = createdCustomerId;
            this.modalService.open(this.customerCreatedModal, {
              size: 'lg',
              backdrop: 'static',
              centered: true
            });
          } else {
            this.commonModalService.openSuccessModal(resp.message);
          }
          
          this.btnDisable = false;
          this.isMeetingSaving = false;
          this.setMeetingFormInitialValue();
          this.modalRef.close();
          this.searchMeetings();
        } else {
          this.btnDisable = false;
          this.isMeetingSaving = false;
          this.commonModalService.openErrorModal(resp.message);
        }
      },
      error => {
        this.btnDisable = false;
        this.isMeetingSaving = false;
        this.commonModalService.openErrorModal("Failed to update meeting. Please try again.");
      }
    );
  }
  
  viewMeeting(PreCustomerMeetingSid: number) {
    this.router.navigate(['/crm/calendar/update', PreCustomerMeetingSid]);
  }

  createNew() {
    if (!this.canCreate) {
      this.appSettingService.showWarning('You do not have permission to create a meeting.');
      return;
    }
    this.router.navigate(['/crm/calendar']);
  }

  getSalesmanById(id: number) {
    if (!id || !this.salesPersons.length) return;
    const user = this.salesPersons.find(person => person.UserMasterSid === id);
    return user?.userName;
  }

  resetForm(): void {
    if (this.isEditMode && this.selectedMeeting && this.selectedMeeting.PreCustomerMeetingSid) {
      this.loadMeetingData(this.selectedMeeting.PreCustomerMeetingSid);
      return;
    }

    const originalValues = {
      customerName: this.selectedMeeting?.preCustomerMaster?.preCustomerName || '',
      PreCustomerMeetingSid: this.selectedMeeting?.PreCustomerMeetingSid || '',
      meetingDate: this.selectedMeeting?.meetingDate ? this.formatDateForInput(this.selectedMeeting.meetingDate) : '',
      followUpDate: this.selectedMeeting?.followUpDate ? this.formatDateForInput(this.selectedMeeting.followUpDate) : '',
      followUp: !!(this.selectedMeeting?.followUpDate || this.selectedMeeting?.followUpNote),
      meetingType: this.selectedMeeting?.meetingType || '',
      leadAssignTo: this.selectedMeeting?.leadAssignTo || '',
      meetingNote: this.selectedMeeting?.meetingNote || '',
      meetingStatus: this.selectedMeeting?.meetingStatus || 'Scheduled',
      followUpNote: this.selectedMeeting?.followUpNote || '',
      remarks: this.selectedMeeting?.remarks || ''
    };
      this.originalMeetingDate = originalValues.meetingDate;


    this.meetingForm.patchValue(originalValues);
    this.meetingForm.markAsPristine();
    this.meetingForm.markAsUntouched();

    Object.keys(this.meetingForm.controls).forEach(key => {
      const control = this.meetingForm.get(key);
      control?.markAsPristine();
      control?.markAsUntouched();
      control?.setErrors(null);
    });
    this.meetingForm.get('remarks')?.clearValidators();
    this.meetingForm.get('remarks')?.updateValueAndValidity();

    const hasFollowUp = !!(this.selectedMeeting?.followUpDate || this.selectedMeeting?.followUpNote);
    if (hasFollowUp) {
      this.meetingForm.get('followUpDate')?.setValidators(Validators.required);
      this.meetingForm.get('followUpNote')?.setValidators(Validators.required);
    } else {
      this.meetingForm.get('followUpDate')?.clearValidators();
      this.meetingForm.get('followUpNote')?.clearValidators();
    }
    this.meetingForm.get('followUpDate')?.updateValueAndValidity();
    this.meetingForm.get('followUpNote')?.updateValueAndValidity();

    this.btnDisable = false;
    this.setMeetingFormInitialValue();
  }

  toggleFollowUp(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.meetingForm.patchValue({ followUp: isChecked });

    if (isChecked) {
      this.meetingForm.get('followUpDate')?.setValidators(Validators.required);
      this.meetingForm.get('followUpDate')?.updateValueAndValidity();
      this.meetingForm.get('followUpNote')?.setValidators(Validators.required);
      this.meetingForm.get('followUpNote')?.updateValueAndValidity();
    } else {
      this.meetingForm.patchValue({ followUpDate: null, followUpNote: '' });
      this.meetingForm.get('followUpDate')?.clearValidators();
      this.meetingForm.get('followUpDate')?.setErrors(null);
      this.meetingForm.get('followUpDate')?.updateValueAndValidity();
      this.meetingForm.get('followUpNote')?.clearValidators();
      this.meetingForm.get('followUpNote')?.setErrors(null);
      this.meetingForm.get('followUpNote')?.updateValueAndValidity();
    }
  }

  // Status badge class logic (same as year list pattern)
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'badge bg-success';
      case 'in progress':
        return 'badge bg-warning';
      case 'on hold':
        return 'badge bg-danger';
      case 'confirmed':
        return 'badge bg-info';
      case 'completed':
        return 'badge bg-secondary';
      default:
        return 'badge bg-light text-dark';
    }
  }

  // Other existing methods...
  showInfo() {
    if (!this.selectedMeeting.PreCustomerMeetingSid) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.meetingData;
    modalRef.componentInstance.idLabel = 'Meeting Id';
    modalRef.componentInstance.idValue = this.selectedMeeting?.PreCustomerMeetingSid;
  }

  openAuditLogs() {
          if (!this.selectedMeeting.PreCustomerMeetingSid) return;
          const modalRef = this.modalService.open(AuditLogComponent, {
            centered: true,
            scrollable: true,
            size: 'xl',
            windowClass: 'audit-log-modal'
          });
          modalRef.componentInstance.title = 'Meeting Logs';
          modalRef.componentInstance.tableName = 'PreCustomerMeeting';
          modalRef.componentInstance.recordId = this.selectedMeeting.PreCustomerMeetingSid.toString();
          modalRef.componentInstance.screenName = 'Meeting';
        }

  // openTandC() {
  //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //   const payload = { MenuMasterSid: this.currentMenuId };
  //   this.leadService.getTandCByCondition(payload).subscribe(
  //     (resp: any) => {
  //       if (resp.status) {
  //         this.TandCList = resp.data;
  //         const modalRef = this.modalService.open(TermsAndConditionsComponent, {
  //           size: 'lg',
  //           backdrop: 'static',
  //           centered: true
  //         });
  //         modalRef.componentInstance.terms = this.TandCList;
  //         modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //         modalRef.componentInstance.DocumentSid = this.meetingData?.PreCustomerMeetingSid;
  //       } else {
  //         this.appSettingService.showError('Error loading Terms and Conditions');
  //       }
  //     },
  //     (error) => {
  //       this.appSettingService.showError('Error loading Terms and Conditions', error);
  //     }
  //   );
  // }

  openEmail() {
    if (!this.meetingData) return;
    if (!this.canAccessAction('email')) {
      this.appSettingService.showWarning('You do not have permission to access Email.');
      return;
    }
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    if (!this.canAccessAction('authority')) {
      this.appSettingService.showWarning('You do not have permission to access Authority.');
      return;
    }
    // Implementation for authority
  }

  openEDoc() {
    console.log('openEDoc');
    // if (!this.meetingData) return;
     if (!this.canAccessAction('edoc')) {
    this.appSettingService.showWarning('You do not have permission to access Edoc.');
    return;
  }
   const modalRef = this.modalService.open(EdocComponent, {
    size: 'xl',
    centered: true,
    backdrop: 'static',
        windowClass: 'full-screen-modal' // ✅ custom class

  });
    modalRef.componentInstance.screenName = 'Edoc';
 modalRef.componentInstance.formData = this.meetingData; // or any object
  modalRef.componentInstance.resetTrigger = false;
   const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.PreCustomerMeetingSid
  }
   this.commonService.documentData.set(data)



  }

  openDocRef() {
    if (!this.canAccessAction('document_reference')) {
      this.appSettingService.showWarning('You do not have permission to access Document reference.');
      return;
    }
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.PreCustomerMeetingSid;
  }

  deleteMeeting(PreCustomerMeetingSid: number) {
    this.leadService.deletePrecustomerMeeting(PreCustomerMeetingSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess("Meeting Deleted Successfully");
          this.search();
        } else {
          this.appSettingService.showError("Error deleting meeting");
        }
      }
    )
  }

 openFollowup() {
    if (!this.meetingData) return;
    if (!this.canAccessAction('follow_up')) {
      this.appSettingService.showWarning('You do not have permission to access Followup.');
      return;
    }
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.meetingData?.PreCustomerMeetingSid;
    modalRef.componentInstance.parentSubject = `__SUBJECT__ for Meeting Update for "${this.meetingData.customerName}"`;
    modalRef.componentInstance.parentMailbodyTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <p>Dear Sir/Madam,</p>
      <p>Kindly do the needful for "__SUBJECT__" Meeting Update for  "${this.meetingData.customerName}" Dated:${new Date(this.meetingData.meetingDate).toLocaleDateString()}</p>
      <p>Best Regards,</p>
      <p>${this.userData['userEmail']}</p>
    </div>
  `;

  modalRef.componentInstance.followupSaved.subscribe((result) => {
    console.log('Follow-up saved successfully:', result);
    this.appSettingService.showSuccess('Follow-up created successfully');
  });

  modalRef.result.then(
    (result) => console.log('Modal closed:', result),
    (dismissReason) => console.log('Modal dismissed:', dismissReason)
  );
  }

  OnDestroy(): void {
    this.commonService.clearDocumentData()
}

private extractCreatedCustomerId(resp: any): number | null {
    const candidate =
      resp?.data?.createdCustomer?.CustomerMasterSid ??
      resp?.data?.CustomerMasterSid ??
      resp?.data?.customerMaster?.CustomerMasterSid ??
      null;

    const numericId = Number(candidate);
    return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
  }

  navigateToCreatedCustomer(): void {
    if (!this.createdCustomerId) return;
    this.router.navigate(['master/organization/entry', this.createdCustomerId]);
    this.closeCustomerCreatedModal();
  }

  closeCustomerCreatedModal(): void {
    this.createdCustomerId = null;
    this.modalService.dismissAll();
  }

  private setMeetingFormInitialValue(): void {
    this.initialMeetingFormValue = this.meetingForm.getRawValue();
    this.isMeetingDirty = false;
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((v) => this.normalizeValue(v));
    if (typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc: any, key) => {
          acc[key] = this.normalizeValue(value[key]);
          return acc;
        }, {});
    }
    return value;
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(this.normalizeValue(obj1)) === JSON.stringify(this.normalizeValue(obj2));
  }

  canCloseMeetingModal(): boolean | Promise<boolean> {
    if (this.isMeetingSaving) return false;
    if (!this.isMeetingDirty) return true;

    const modalRef = this.modalService.open(UnsavedChangesDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    return modalRef.result
      .then((action: UnsavedChangesAction) => action === 'discard')
      .catch(() => false);
  }

  async closeUpdateMeetingModal(): Promise<void> {
    const canClose = await Promise.resolve(this.canCloseMeetingModal());
    if (!canClose) return;
    this.modalRef?.close();
  }

}
