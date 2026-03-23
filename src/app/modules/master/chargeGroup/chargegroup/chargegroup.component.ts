import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
@Component({
  selector: 'app-chargegroup',
  standalone: true,
  imports: [
    NgbModalModule,
    FeatherModule,
    NgSelectModule,
    CommonModule,
    ReactiveFormsModule,
    NgbPagination,
    RouterModule,
    FormsModule,
    DatePipe,
    ListpageComponent,
    PreventMultiClickDirective,
    FavoriteStarComponent,
    NgxSpinnerModule,
    NgbDropdownModule,
    TextWithNumbersDirective,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent
  ],
  templateUrl: './chargegroup.component.html',
  styleUrl: './chargegroup.component.scss',
  providers: [DatePipe]
})
export class ChargegroupComponent extends BaseListComponent implements OnInit {
  @ViewChild('chargeGroupTable') chargeGroupTable!: ReusableTableComponent;
  @ViewChild('content') content: TemplateRef<any>;
  chargeGroupForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  ChargeGroupSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  chargeGroupList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: NgbModalRef;
  searchType = 'GroupName';
  // filterValue = '';
  // searchPerformed = false;
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection = 0;
  isLoading = false;
  companyOptions: any[] = [];
  userData: any;
  chargeGroupData: any;
  currentMenuId: number;
  TandCList: any[] = [];
  isFavorite: boolean = false;
  isLogLoading: boolean = false;
  // sortColumn: string = 'GroupName';
  // sortDirection: string = 'asc';
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  // Company
  currentCompany: any;
  MenuMasterSid:any;
  currentBranch: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  tableConfig: TableConfig ;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private commonService: CommonService,
    public mps : MenuPermissionService,
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       
    //     }
    //   }
    // );
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid = Number(sessionStorage.getItem('currentMenuId'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      
    }

    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.ChargeGroupSid = +params.get('id');
      if (this.ChargeGroupSid) {
        this.isEditMode = true;
        this.loadChargeGroupData(this.ChargeGroupSid);
      }
    });
    this.loadCompanies();
    // this.loadChargeGroups();
    this.initializeTableConfig();
    super.ngOnInit();
    this.initializeHeaderActions();
    this.mps.init().subscribe(()=>{
      this.initializeHeaderActions();
      this.initializeTableConfig();
    });
    this.initializeModalDropdownItems();
  }

  
  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'charge-group-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'GroupName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allChargeGroup() { return this.allItems; }

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchChargeGroups(this.getSearchParams());
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
      this.allItems = (response.data.items || []).map((item: any) => ({
        ...item,
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

  // Legacy methods for template compatibility
  searchChargeGroup() {
    this.page = 1;
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchChargeGroup()
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
        disabled: !this.mps.can('insert')
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

  initializeModalDropdownItems(): void {
    this.modalDropdownItems = [
      {
        label: 'Edoc',
        icon: 'fas fa-file-alt',
        action: 'edoc',
        
      },
      // {
      //   label: 'Terms & Condition',
      //   icon: 'fas fa-clipboard',
      //   action: 'terms',
       
      // },
      {
        label: 'Authorize',
        icon: 'fas fa-shield-alt',
        action: 'authority',
       
      },
      {
        label: 'Email',
        icon: 'fas fa-envelope',
        action: 'email',
        
      }
    ];
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.openModal(this.content);
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

  onModalDropdownItemClick(action: string): void {
    switch (action) {
      case 'edoc':
        this.openEDoc();
        break;
      // case 'terms':
      //   this.openTandC();
      //   break;
      case 'authority':
        this.openAuthority();
        break;
      case 'email':
        this.openEmail();
        break;
      default:
        console.warn(`Unknown dropdown action: ${action}`);
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
  override trackBy(index: number, item: any): number {
    return item.BookingHeaderSid || index;
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig= {
    columns: [
      {
        key: 'GroupName',
        label: 'Group Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: "150px"
      },
      {
        key: 'Remarks',
        label: 'Remarks',
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
    ],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View ',
        state: !this.mps.can('view')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete ',
        class: "text-danger",
        state: !this.mps.can('delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'ChargeGroupSid',
    emptyMessage: 'No Charge-Group found',
    dragAndDrop: true
  };
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewZone(event.row.ChargeGroupSid, this.content);
    } else if (event.action === 'delete') {
      this.deleteChargeGroupById(event.row.ChargeGroupSid);
    }
  }

  deleteChargeByRow(row: any) {
    this.deleteChargeGroupById(row.ChargeGroupSid);
  }

  deleteChargeGroupById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteChargeGroupById(id).subscribe({
          next: () => {
            this.appSettingService.showSuccess('Deleted successfully!');
            // this.loadChargeGroups();
            this.searchChargeGroup();
          },
          error: () => {
            this.appSettingService.showError('Failed to delete');
          }
        });
      }
    });
  }

  
viewZone(id: number, content?: TemplateRef<any>) {
  this.editChargeGroup(id, content);
}


  onTableRowClick(row: any): void {

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

  report(): void {
    const formattedData = this.allChargeGroup;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.chargeGroupTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'ChargeGroup-Report',
      title: companyName
    });
  }
 

      hasAnyDropdownPermission(): boolean {
  const dropdownButtons = ['Edoc', 'Authority', 'Email'];
  return dropdownButtons.some((btn) => this.permissions?.includes(btn));
}
  //   loadChargeGroups(): void {
  //     this.spinner.show();
  //     let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     activeCompanyId : CompanyMasterSid
  //   };

  //   this.masterService.searchChargeGroups(params).subscribe({
  //     next: (response: any) => {
  //       if (response?.status) {
  //         this.results = response.data.items || [];
  //         this.applySorting();
  //         this.updatePaginationData();
  //         this.chargeGroupList = [...this.results];
  //         this.totalLengthOfCollection = response.data.totalCount || 0;

  //       } else {
  //         this.results = [];
  //         this.chargeGroupList = [];
  //         this.totalLengthOfCollection = 0;
  //         this.appSettingService.showError(response.message);

  //       }
  //       this.searchPerformed = true;
  //       this.spinner.hide();
  //     },
  //     error: (err) => {
  //       console.error('Error loading charge groups:', err);
  //     }
  //   });
  // }

  loadCompanies(): void {
    this.masterService.getAllCompanies().subscribe({
      next: (companies) => {
        this.companyOptions = companies.data || companies;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.appSettingService.showError('Failed to load companies');
      }
    });
  }

  initForm() {
    this.chargeGroupForm = this.fb.group({

      GroupName: ['', [Validators.required]],
      Remarks: ['',],
      status: [{ value: 'Active', disabled: false }, Validators.required]
    });
  }

  // resetForm(): void {
  //   this.chargeGroupForm.get('status')?.disable();
  //   this.chargeGroupForm.reset({
  //     status: 'Active'
  //   });
  // }

  resetForm(): void {
    // If editing an existing charge group, reload it (restore original state)
    if (this.isEditMode && this.ChargeGroupSid) {
      this.loadChargeGroupData(this.ChargeGroupSid);
      return;
    }

    // Create-mode: reset form to initial state with proper default values
    this.chargeGroupForm.reset({
      GroupName: null,
      Remarks: null,
      status: 'Active'
    });

    // Re-enable the status field if it was disabled
    this.chargeGroupForm.get('status')?.enable();

    // Reset validation state
    this.chargeGroupForm.markAsUntouched();
    this.chargeGroupForm.markAsPristine();

    // Clear any stored data
    this.chargeGroupData = null;
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }
  trackByIndex(index: number, item: any): number {
    return index;
  }

editChargeGroup(id: number, content: TemplateRef<any>) {
  // 1. STATE & UI SETUP (Synchronous - Immediate execution)
  this.isEditMode = true;
  this.ChargeGroupSid = id;
  
  // Reset form to clear previous validation errors/values
  this.chargeGroupForm.reset(); 

  // 2. LOCK UI (Optimistic Open)
  // 'static' backdrop and 'keyboard: false' ensure the user cannot escape 
  // the modal while data is in an inconsistent (loading) state.
  this.modalRef = this.modalService.open(content, { 
    centered: true, 
    size: 'lg', 
    backdrop: 'static',
    keyboard: false 
  });

  // 3. DISABLE FORM (Read-Only Mode)
  // Prevents 'Dirty Reads': User cannot type into fields before the DB data arrives.
  this.chargeGroupForm.disable();

  // 4. FETCH DATA (Async Operation)
  this.masterService.getChargeGroupById(id)
    .pipe(take(1)) // Memory Safety: Ensures subscription dies after 1 emit
    .subscribe({
      next: (response: any) => {
        // Validation Guard: Protect against malformed API responses
        if (!response?.data) {
          console.warn('API returned success but no data payload.');
          throw new Error('Data payload missing'); 
        }

        const data = response.data;
        this.chargeGroupData = data;

        // Data Patching
        this.chargeGroupForm.patchValue({
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          GroupName: data.GroupName,
          Remarks: data.Remarks || '', // Default to empty string if null
          status: data.status === 'A' ? 'Active' : 'Suspended'
        });

        // 5. UNLOCK UI (Success State)
        // Data is ready. Allow user interaction.
        this.chargeGroupForm.enable();
      },
      error: (err) => {
        // 6. ROLLBACK (Failure State)
        // Critical: Close modal so user isn't stuck in a disabled/empty UI.
        this.closeModal();
        
        console.error(`Failed to fetch Charge Group (ID: ${id})`, err);
        this.appSettingService.showError('Unable to load data. Please try again.');
      }
    });
}



  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.ChargeGroupSid) return;

    if (this.isLogLoading) {
      return; 
    }
    this.isLogLoading = true; 

    this.masterService.getAuditLogsChargeGroups(
      'ChargeGroup',
      this.ChargeGroupSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        this.isLogLoading = false;

        const ignoredFields = ['updatedOn', 'updatedBy'];

        const formatFields = (val: any) => {
          if (!val) return [];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          if (Object.keys(obj).length === 0) return [];
          return Object.entries(obj)
            .filter(([key]) => !ignoredFields.includes(key))
            .map(([key, value]) => `${key}: ${value ?? 'NA'}`);
        };

        this.auditLogs = logs
          .map(log => ({
            ...log,
            oldValDisplay: formatFields(log.oldVal),
            newValDisplay: formatFields(log.newVal),
          }))
          .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);

        this.auditLogModalRef = this.modalService.open(modal, {
          centered: true,
          scrollable: true,
          windowClass: 'audit-log-modal'
        });
      },
      error: (err) => {
        this.isLogLoading = false;
        console.error('Error fetching audit logs:', err);
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadChargeGroupData(id: number) {
    this.masterService.getChargeGroupById(id).subscribe(
      (response: any) => {
        const data = response.data;
        this.chargeGroupForm.patchValue({
          CompanyMasterSid: data.CompanyMasterSid,
          GroupName: data.GroupName,
          Remarks: data.Remarks,
          status: data.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  // clearFilterValue() {
  //   this.filterValue = '';
  //   this.loadChargeGroups();
  // }

  onSubmit() {
    if (this.chargeGroupForm.get('status')?.disabled) {
      this.chargeGroupForm.get('status')?.enable();
    }
    if (this.chargeGroupForm.invalid) {
      this.chargeGroupForm.markAllAsTouched();
      this.chargeGroupForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    this.btnDisable = true;
    const formValue = this.chargeGroupForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];

    const payload = {
      ...formValue,
      status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      ...(this.isEditMode ? { updatedBy: userEmail } : { createdBy: userEmail })
    };

    const operation = this.isEditMode
      ? this.masterService.updateChargeGroupById(this.ChargeGroupSid, payload)
      : this.masterService.createNewChargeGroup(payload);

    operation.subscribe({
      next: (resp: any) => {
        this.btnDisable = false;
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message);
          this.closeModal();
          // this.loadChargeGroups();
          this.searchChargeGroup();
        } else {
          this.appSettingService.showError(resp.message);
        }
      },
      error: (err) => {
        this.btnDisable = false;
        this.errorMessage = err.message;
        console.error('Error:', err);
        this.appSettingService.showError('Operation failed');
      }
    });
  }



  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.chargeGroupList = this.results.slice(startIndex, endIndex);
  }

  // onPageChange(page: number) {
  //   this.page = page;
  //   this.updatePaginationData();
  // }



  // resetPage(): void {
  //   this.filterValue = '';
  //   this.searchType = 'GroupName';
  //   this.page = 1;
  //   this.searchPerformed = false;
  //   this.results = [];
  //   this.chargeGroupList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.sortColumn = 'GroupName';
  //   this.sortDirection = 'asc';
  //   this.loadChargeGroups();
  // }

  // report(): void {
  //   const formattedData = this.chargeGroupList.map(item => ({
  //     ...item,
  //     company: item.companyMaster?.companyName,
  //     status: item.status === 'A' ? 'Active' : 'Suspended'
  //   }));


  //     const companyName = this.currentCompany?.companyName ?? 'Company';

  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'company', label: 'Company' },
  //       { key: 'GroupName', label: 'Group Name' },
  //       { key: 'Remarks', label: 'Remarks' },
  //       { key: 'status', label: 'Status' },
  //     ],
  //     fileName: 'Charge-Group-Report',
  //     title: companyName
  //   });
  // }

  showInfo() {
    if (!this.chargeGroupData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.chargeGroupData;
    modalRef.componentInstance.idLabel = 'Charge Group Id';
    modalRef.componentInstance.idValue = this.chargeGroupData?.ChargeGroupSid;
  }

  // openTandC() {
  //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //   const payload = { MenuMasterSid: this.currentMenuId };
  //   this.masterService.getTandCByCondition(payload).subscribe(
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
  //         modalRef.componentInstance.DocumentSid = this.ChargeGroupSid;
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
    if (!this.chargeGroupData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  // openAuthority() {
  //   if (!this.chargeGroupData) return;
  //   const modalRef = this.modalService.open(AuthorityEntryComponent, {
  //     size: 'lg',
  //     centered: true,
  //     backdrop: 'static'
  //   });
  //   modalRef.componentInstance.item = this.chargeGroupData;
  //   modalRef.componentInstance.idLabel = 'Charge Group Id';
  //   modalRef.componentInstance.idValue = this.chargeGroupData?.ChargeGroupSid;
  // }
  openAuthority() {
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.ChargeGroupSid;
  }

  openEDoc() {
    if (!this.chargeGroupData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.chargeGroupData;
    modalRef.componentInstance.idLabel = 'Charge Group Id';
    modalRef.componentInstance.idValue = this.chargeGroupData?.ChargeGroupSid;
    const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.ChargeGroupSid
  }
  this.commonService.documentData.set(data)

  }
  OnDestroy(): void {
    this.commonService.clearDocumentData()
 }
}

