import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { NgbDropdownModule, NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from '../../Services/lead.service';
import { Observable } from 'rxjs';
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
    PageHeaderComponent
  ],
  providers: [CustomDatePipe],
  templateUrl: './meeting-update-list.component.html',
  styleUrls: ['./meeting-update-list.component.scss']
})
export class MeetingUpdateListComponent extends BaseListComponent implements OnInit {
  @ViewChild('meetingTable') meetingTable!: ReusableTableComponent;
  @ViewChild('modalContentAdd', { read: TemplateRef }) modalContentAdd!: TemplateRef<any>;
  
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
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  userData: any;
  originalMeetingDate: string;

  // For mobile view data
  filteredMeetings: any[] = [];
  searched: boolean = false;

  // Header actions
  headerActions: HeaderAction[] = [];

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
    pageSizeOptions: [10, 20, 50, 100],
    maxPagesToShow: 3
  };

  constructor(
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
     private commonService: CommonService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  localStorage.getItem('currentMenuId');
    this.isMobile = this.appService.getDevice();
     const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    
    this.loadSalesPersons();
    this.initMeetingForm();
    this.initializeTableConfig();
    this.initializeHeaderActions();
    
    super.ngOnInit();
    this.sort('asc')
  }
   checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    if (currentMenuId && userRole) {
      this.leadService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions)
            .filter(key => this.currentMenuPermissions[key] === 'isTrue');
          
          // Update header actions based on permissions
          this.initializeHeaderActions();
        },
        error: (error) => {
          console.error('Error loading permissions', error);
        }
      });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
  }
  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.leadService.searchPreCustomerMeeting(this.getSearchParams());
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
    if (response.status && response.data?.items) {
      this.allItems = response.data.items.map((meeting: any) => {
        const salesPerson = this.salesPersons?.find(
          (person: any) => person.UserMasterSid === meeting.leadAssignTo
        );
        
        return {
          PreCustomerMeetingSid: meeting.PreCustomerMeetingSid,
          customerName: meeting.preCustomerMaster?.preCustomerName || 'N/A',
          meetingType: meeting.meetingType || 'N/A',
          meetingDate: meeting.meetingDate ? this.datePipe.transform(meeting.meetingDate) : '',
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
          rawCustomerName: meeting.preCustomerMaster?.preCustomerName || ''
        };
      });
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
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
    this.tableConfig.columns = [
      {
        key: 'customerName',
        label: 'Customer Name',
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
    ];
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.openModal(this.modalContentAdd, event.row);
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

  // Header actions
  initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Create',
        icon: 'fas fa-plus',
        action: 'create',
         condition: this.hasPermission('Create'),
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
      meetingNote: ['', this.meetingNoteValidator.bind(this)],
      meetingStatus: ['Scheduled', Validators.required],
      followUpNote: [''],
      meetingDuration: [''],
      remarks: [''],
      preCustomerMasterSid: [''],
      createdBy: [''],
      updatedBy: ['']
    });

    this.meetingForm.get('meetingStatus').valueChanges.subscribe(() => {
      this.meetingForm.get('meetingNote').updateValueAndValidity();
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
    this.leadService.getAllSalesPerson().subscribe(
      (resp: any) => {
        this.salesPersons = resp;
      }
    );
  }

  // Modal and form handling methods
  openModal(content: TemplateRef<any>, meeting: any) {
    this.initMeetingForm();
    if (meeting) {
      this.meetingData = meeting;
      const ourSalesperson = this.salesPersons.find(person => person.UserMasterSid === meeting.leadAssignTo)?.UserMasterSid;
      this.meetingForm.patchValue({
        ...meeting,
        leadAssignTo: ourSalesperson
      });
    }
    this.loadMeetingData(meeting.PreCustomerMeetingSid);
    this.modalRef = this.modalService.open(content, { size: 'lg' });
  }

  loadMeetingData(meetingId: number) {
    this.spinner.show();
    this.leadService.getPreCustomerMeeting(meetingId).subscribe(
      (meeting: any) => {
        this.selectedMeeting = meeting;

        const meetingDate = meeting.meetingDate
          ? this.formatDateForInput(meeting.meetingDate)
          : '';

        const followUpDate = meeting.followUpDate
          ? this.formatDateForInput(meeting.followUpDate)
          : '';

        const followUp = !!(meeting.followUpDate || meeting.followUpNote);
        this.originalMeetingDate = meetingDate;
        this.meetingForm.patchValue({
          customerName: meeting.preCustomerMaster?.preCustomerName || '',
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
        this.setupMeetingDateListener();
        this.meetingForm.controls['meetingStatus'].enable();
        if (meeting.meetingStatus === 'confirmed') {
          this.meetingForm.controls['meetingStatus'].disable();
        }
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
     const currentMeetingDate = this.meetingForm.get('meetingDate')?.value;
     if (this.originalMeetingDate && currentMeetingDate !== this.originalMeetingDate) {
    // Validate remarks if date changed
    this.meetingForm.get('remarks')?.markAsTouched();
    if (this.meetingForm.get('remarks')?.invalid) {
      this.appSettingService.showError("Please update the reason when the meeting date is changed.");
      return;
    }
  }
    if (this.meetingForm.get('meetingStatus')?.value === 'on hold' &&
      !this.meetingForm.get('meetingNote')?.value) {
      this.meetingForm.get('meetingNote')?.markAsTouched();
      this.appSettingService.showError("Meeting Note is mandatory when status is 'On Hold'");
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
          this.commonModalService.openSuccessModal(resp.message);
          this.btnDisable = false;
          this.modalRef.close();
          this.searchMeetings();
        } else {
          this.btnDisable = false;
          this.commonModalService.openErrorModal(resp.message);
        }
      },
      error => {
        this.btnDisable = false;
        this.commonModalService.openErrorModal("Failed to update meeting. Please try again.");
      }
    );
  }
  
  viewMeeting(PreCustomerMeetingSid: number) {
    this.router.navigate(['/crm/calendar/update', PreCustomerMeetingSid]);
  }

  createNew() {
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

    this.btnDisable = false;
  }

  toggleFollowUp(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.meetingForm.patchValue({ followUp: isChecked });

    if (!isChecked) {
      this.meetingForm.patchValue({ followUpDate: null, followUpNote: '' });
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
    if (!this.meetingData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.meetingData;
    modalRef.componentInstance.idLabel = 'Meeting Id';
    modalRef.componentInstance.idValue = this.meetingData?.PreCustomerMeetingSid;
  }

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.leadService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.meetingData?.PreCustomerMeetingSid;
        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
  }

  openEmail() {
    if (!this.meetingData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    // Implementation for authority
  }

  openEDoc() {
    console.log('openEDoc');
    // if (!this.meetingData) return;
     if (!this.hasPermission('Edoc')) {
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
  OnDestroy(): void {
    this.commonService.clearDocumentData()
}

}