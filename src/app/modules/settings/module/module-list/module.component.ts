import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { SettingsService } from '../../settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from '../../email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from '../../edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
@Component({
  selector: 'app-module',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    FeatherModule,
    NgbModalModule,
    NgbPaginationModule,
    NgSelectModule,
    DatePipe,
    PreventMultiClickDirective,
    FavoriteStarComponent,
    NgxSpinnerModule,
    NgbDropdownModule,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent
  ],
  templateUrl: './module.component.html',
  styleUrls: ['./module.component.scss']
})
export class ModuleComponent extends BaseListComponent implements OnInit {
  @ViewChild('moduleTable') moduleTable!: ReusableTableComponent;
  @ViewChild('content') content: TemplateRef<any>;
  moduleForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  ModuleMasterSid!: number;
  moduleList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: any;
  userData: any;
  moduleData: any
  loading = false;
  // Table configuration
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View ',
        // condition: (row: any) => this.hasPermission('View')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete ',
        class: "text-danger",
        // condition: (row: any) => this.hasPermission('Delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'ModuleMasterSid',
    emptyMessage: 'No module found',
    dragAndDrop: true
  };

  tableLoading = false;
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  protected config: ListComponentConfig = {
    storageKey: 'module-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'ModuleName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allModules() { return this.allItems; }
  searchType = 'ModuleName';

  totalAmountOfCollection = 0;

  iconOptions = [
    { value: 'home', label: 'Home' },
    { value: 'settings', label: 'Settings' },
    { value: 'users', label: 'Users' },
    { value: 'file-text', label: 'Documents' },
    { value: 'bar-chart-2', label: 'Reports' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'mail', label: 'Mail' },
    { value: 'shopping-cart', label: 'Shopping' }
  ];
  currentMenuId: number;
  TandCList: any;
  isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  // Company
  currentCompany: any;
  currentBranch: any;
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.initForm();
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //     }
    //   }
    // );
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    // this.loadModule();
    // Initialize table configuration
    this.initializeHeaderActions();
    this.initializeTableConfig();
    // this.initializeModalDropdownItems();
    // Initialize base component
    super.ngOnInit();
  }

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.settingsService.searchModule(this.getSearchParams());
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
      this.allItems = response.data.items.map(item => ({
        ...item,
        status: item.status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching module.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching module.');
    console.error('Error searching module', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchModule() {
    this.page=1;
    this.search();
  }

    onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchModule();
  }
  clearFilterValue() {
    this.clearFilter();
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

  //   initializeModalDropdownItems(): void {
  //   this.modalDropdownItems = [
  //     {
  //       label: 'Edoc',
  //       icon: 'fas fa-file-alt',
  //       action: 'edoc',
  //       condition: this.hasPermission('Edoc')
  //     },
  //     {
  //       label: 'Terms & Condition',
  //       icon: 'fas fa-clipboard',
  //       action: 'terms',
  //       condition: this.hasPermission('Terms and Condition')
  //     },
  //     {
  //       label: 'Authorize',
  //       icon: 'fas fa-shield-alt',
  //       action: 'authority',
  //       condition: this.hasPermission('Authority')
  //     },
  //     {
  //       label: 'Email',
  //       icon: 'fas fa-envelope',
  //       action: 'email',
  //       condition: this.hasPermission('Email')
  //     }
  //   ];
  // }
  //   onModalDropdownItemClick(action: string): void {
  //   switch (action) {
  //     case 'edoc':
  //       this.openEDoc();
  //       break;
  //     case 'terms':
  //       this.openTandC();
  //       break;
  //     case 'authority':
  //       this.openAuthority();
  //       break;
  //     case 'email':
  //       this.openEmail();
  //       break;
  //     default:
  //       console.warn(`Unknown dropdown action: ${action}`);
  //   }
  // }
   private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'report') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 };
      }
      return action;
    });
  }

  override trackBy(index: number, item: any): number {
    return item.ModuleMasterSid || index;
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'ModuleName',
        label: 'Module Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ModuleCode',
        label: 'Module Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
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
        dataType: 'string',
        cellClass: 'status-column'
      }
    ];
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewModule(event.row, this.content);
    } else if (event.action === 'delete') {
      this.deleteBy(event.row)
    }
  }

  viewModule(row: any, content): void {
    this.editModule(row.ModuleMasterSid, content)
  }
  deleteBy(row: any) {
    this.deleteModuleById(row.ModuleMasterSid)
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

  report(): void {
    const formattedData = this.allModules;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.moduleTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Module-Report',
      title: companyName
    });
  }
  // loadModule() {
  //   this.spinner.show();
  //   this.loading = true;

  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection
  //   };

  //   this.settingsService.searchModule(params).subscribe({
  //     next: (response: any) => {
  //       if (response.status) {
  //         this.moduleList = response.data.items || response.data;
  //         this.totalAmountOfCollection = response.data.totalCount || response.length;
  //         this.applySorting();
  //         this.searchPerformed = true;
  //       } else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Search error:', err);
  //       this.moduleList = [];
  //       this.totalAmountOfCollection = 0;
  //       this.loading = false;
  //     }
  //   });
  // }

  initForm() {
    this.moduleForm = this.fb.group({
      ModuleName: ['', [Validators.required, Validators.maxLength(50)]],
      ModuleCode: ['', [Validators.required, Validators.maxLength(20)]],
      icon: [''],
      status: [{ value: 'Active', disabled: false }, Validators.required],
      Remarks: ['', [Validators.required, Validators.maxLength(300)]]
    });
  }
  // resetForm(): void {

  //   this.moduleForm.get('status')?.disable();
  //   this.moduleForm.reset({
  //     status: 'Active',
  //     icon: ''
  //   });
  // }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editModule(id: number, content: any) {
    this.isEditMode = true;
    this.ModuleMasterSid = id;
    this.settingsService.getModuleById(id).subscribe({
      next: (response: any) => {
        const module = response.data;
        this.moduleData = module;
        this.moduleForm.get('status')?.enable();
        this.moduleForm.patchValue({
          ModuleName: module.ModuleName,
          ModuleCode: module.ModuleCode,
          icon: module.icon || '',
          Remarks: module.Remarks,
          status: module.status === 'A' ? 'Active' : 'Suspended'
        });
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
      },
      error: (err) => {
        console.error('Error fetching Module', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  onSubmit() {
    if (this.moduleForm.get('status')?.disabled) {
      this.moduleForm.get('status')?.enable();
    }
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      this.moduleForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const formValue = this.moduleForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const payload = {
      ...formValue,
      status: formValue.status === "Active" ? "A" : "S",
      ...(this.isEditMode ? { updatedBy: userEmail } : { createdBy: userEmail })
    };

    const operation = this.isEditMode
      ? this.settingsService.updateModuleById(this.ModuleMasterSid, payload)
      : this.settingsService.createNewModule(payload);

    operation.subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message);
          this.closeModal();
          this.searchModule()
        } else {
          this.appSettingService.showError(resp.message);
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.appSettingService.showError('An error occurred');
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadModule();
  }
  //   clearFilterValue() {
  //   this.filterValue = '';
  //   this.loadModule();
  // }

  deleteModuleById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.settingsService.deleteModuleById(id).subscribe({
          next: (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess('Module deleted successfully');
              this.searchModule();
            }
          },
          error: (err) => {
            console.error('Delete error:', err);
          }
        });
      }
    });
  }

  reset() {
    this.moduleList = [];
    this.totalAmountOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    // this.loadModule();
    this.searchType = 'ModuleName';
  }

  resetForm(): void {
    // If editing an existing module, reload it (restore original state)
    if (this.isEditMode && this.ModuleMasterSid) {
      this.editModule(this.ModuleMasterSid, this.modalRef);
      return;
    }

    // Create-mode: reset form to sensible defaults
    this.moduleForm.reset({
      ModuleName: '',
      ModuleCode: '',
      icon: '',
      status: 'Active',
      Remarks: ''
    });

    // Enable status field if it was disabled
    this.moduleForm.get('status')?.enable();

    // Clear form validation states
    this.moduleForm.markAsUntouched();
    this.moduleForm.updateValueAndValidity();
  }
  trackByIndex(index: number, item: any): number {
    return index; // or return item.ModuleMasterSid if you want to track by ID
  }

  showInfo() {
    if (!this.moduleData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.moduleData;
    modalRef.componentInstance.idLabel = 'Module Id';
    modalRef.componentInstance.idValue = this.moduleData?.ModuleMasterSid;
  }

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.settingsService.getTandCByCondition(payload).subscribe(
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
          modalRef.componentInstance.DocumentSid = this.ModuleMasterSid;

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
    if (!this.moduleData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }


  openAuthority() {
    const MenuMasterSid = localStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.ModuleMasterSid;
  }

  openEDoc() {
    if (!this.moduleData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.moduleData;
    modalRef.componentInstance.idLabel = 'Module Id';
    modalRef.componentInstance.idValue = this.moduleData?.ModuleMasterSid;
  }


}