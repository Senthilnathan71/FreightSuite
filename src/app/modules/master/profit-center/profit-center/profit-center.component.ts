import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { MasterService } from '../../master.service';
import { ProfitCenter } from 'src/app/modules/crm-mobile/Interfaces/profit-center.interfaces';
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
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
@Component({
  selector: 'app-profit-center',
  standalone: true,
  imports: [FeatherModule,
    NgSelectModule,
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbPagination,
    ListpageComponent,
    OnlyTextDirective,
    TextWithNumbersDirective,
    PreventMultiClickDirective,
    NgbModalModule,
    FavoriteStarComponent,
    NgxSpinnerModule,
    NgbDropdownModule,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent
  ],
  templateUrl: './profit-center.component.html',
  styleUrl: './profit-center.component.scss'
})
export class ProfitCenterComponent extends BaseListComponent implements OnInit {
  @ViewChild('profitcenterTable') profitcenterTable!: ReusableTableComponent;
  @ViewChild('content') content: TemplateRef<any>
  profitCenterForm!: FormGroup;
  isEditMode: boolean = false;
  profitCenters: ProfitCenter[] = [];
  results: any[] = [];
  ProfitCenterMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  profitCenterList: any[] = [];
  modalRef!: NgbModalRef;
  searchType = 'ProfitCenterName';
  // filterValue = '';
  searched = false;
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection = 0;
  userData: any;
  profitCenterData: any;
  currentMenuId: number;
  TandCList: any;
  // sortColumn: string = 'ProfitCenterName';
  // sortDirection: string = 'asc';
  isFavorite: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  MenuMasterSid:any;
  // Company
  currentCompany: any;
  currentBranch: any;
  tableConfig: TableConfig;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  statusList = ["Active", "Suspended"];

  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
 
  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'profit-center-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'ProfitCenterName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allProfitcenter() { return this.allItems; }

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private commonService: CommonService,
    public mps : MenuPermissionService
  ) {
    super(paginationService);
  }
  override ngOnInit(): void {
    // this.loadProfitCenters()
    this.initForm();
    //  this.appSettingService.getUser().subscribe(
    //    user => {
    //      if (user) {
    //        this.userData = user;
    
    //      }
    //    }
    //  )
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    this.MenuMasterSid =  localStorage.getItem('currentMenuId');
    if (userProfile) {
      this.userData = userProfile;
      
    }
    this.route.paramMap.subscribe(params => {
      this.ProfitCenterMasterSid = +params.get('id');
      if (this.ProfitCenterMasterSid) {
        this.isEditMode = true;
        this.loadProfitCenterData(this.ProfitCenterMasterSid);
      }
    });
    // Initialize table configuration
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
    this.initializeHeaderActions();
    });
    // this.initializeModalDropdownItems();

    // Initialize base component
    super.ngOnInit();

  }
  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchProfitCenterList(this.getSearchParams());
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
        Status: item.Status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching profit-center.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching profit-center.');
    console.error('Error searching profit-center', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchProfitCenter() {
    this.search();
  }

  
   onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchProfitCenter();
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
       disabled : !this.mps.can('insert')
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

  //  initializeModalDropdownItems(): void {
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
      case 'terms':
        this.openTandC();
        break;
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
  // clearFilterValue() {
  //   this.clearFilter();
  // }

  override trackBy(index: number, item: any): number {
    return item.ProfitCenterMasterSid || index;
  }


  viewCostCenter(item: any, content: any): void {
    this.editProfitCenter(item.ProfitCenterMasterSid, content);
  }

  // Table configuration
  private initializeTableConfig(): void {
     this.tableConfig= {
    columns: [
      {
        key: 'ProfitCenterName',
        label: 'Profit Center Name ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ProfitCenterCode',
        label: 'Profit Center Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'Remarks',
        label: 'Remarks ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'Status',
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
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View ',
        state : !this.mps.can('view') 
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete ',
        class: "text-danger",
        state : !this.mps.can('delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'ProfitCenterMasterSid',
    emptyMessage: 'No profit-center found',
    dragAndDrop: true
  };

  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewCostCenter(event.row, this.content);
    } else if (event.action === 'delete') {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row: any) {
    this.softDeleteProfitCenter(row.ProfitCenterMasterSid)
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
    const formattedData = this.allProfitcenter;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.profitcenterTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Profit-Center-Report',
      title: companyName
    });
  }
 

  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  // loadProfitCenters(): void {
  //   this.spinner.show();
  //   const params = {
  //     search: this.filterValue ? this.filterValue.trim() : '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //   };

  //   this.masterService.searchProfitCenterList(params).subscribe({
  //     next: (response) => {
  //       if (response.status) {
  //         this.profitCenterList = response.data.items;
  //         this.results = [...this.profitCenterList];
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searched = true;
  //       }
  //       else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //     },
  //     error: (err) => {
  //       console.error('Error fetching profit-centers:', err);
  //       this.profitCenterList = [];
  //       this.results = [];
  //       this.totalLengthOfCollection = 0;
  //     },
  //   });
  // }

  initForm() {
    this.profitCenterForm = this.fb.group({
      ProfitCenterCode: ['', [Validators.required]],
      ProfitCenterName: ['', [Validators.required]],
      Remarks: [''],
      Status: [{ value: 'A', disabled: false }, Validators.required]
    });
  }
  // resetForm(): void {
  //  this.profitCenterForm.get('Status')?.disable();
  //  this.profitCenterForm.reset({
  //    Status: 'Active'
  //  });
  // }

  resetForm(): void {
    // If editing an existing profit center, reload it (restore original state)
    if (this.isEditMode && this.ProfitCenterMasterSid) {
      this.loadProfitCenterData(this.ProfitCenterMasterSid);
      return;
    }

    // Create-mode: reset form to initial state with proper default values
    this.profitCenterForm.reset({
      ProfitCenterCode: null,
      ProfitCenterName: null,
      Remarks: null,
      Status: 'Active'
    });

    // Re-enable the status field if it was disabled
    this.profitCenterForm.get('Status')?.enable();

    // Reset validation state
    this.profitCenterForm.markAsUntouched();
    this.profitCenterForm.markAsPristine();

    // Clear any stored data
    this.profitCenterData = null;
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  openEditModal(content: any, id: number): void {
    this.isEditMode = true;
    this.ProfitCenterMasterSid = id;
    this.getProfitCenterById(id).add(() => {
      this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
    });
  }

 editProfitCenter(id: number, content: TemplateRef<any>) {
  // 1. STATE SETUP
  this.isEditMode = true;
  this.ProfitCenterMasterSid = id;

  this.profitCenterForm.reset();

  // 2. LOCK UI (Optimistic Open)
  this.modalRef = this.modalService.open(content, { 
    centered: true, 
    size: 'lg', 
    backdrop: 'static',
    keyboard: false 
  });

  // 3. DISABLE FORM
  this.profitCenterForm.disable();

  // 4. FETCH DATA
  this.masterService.getProfitCenterById(id).pipe(take(1)).subscribe({
    next: (response: any) => {
      // Robust Data Extraction: Handle 'response.data' or direct 'response'
      const data = response?.data || response;

      if (!data) {
        throw new Error('Data payload missing');
      }

      this.profitCenterData = data;

      this.profitCenterForm.patchValue({
        ProfitCenterCode: data.ProfitCenterCode,
        ProfitCenterName: data.ProfitCenterName,
        // Null Safety: Ensure text fields are empty string if null
        Remarks: data.Remarks || '',
        Status: data.Status === 'A' ? 'Active' : 'Suspended'
      });

      // 5. UNLOCK UI
      this.profitCenterForm.enable();
    },
    error: (err) => {
      // 6. ROLLBACK
      this.closeModal(); 
      console.error('Error fetching Profit-Center:', err);
      this.appSettingService.showError('Unable to load data. Please try again.');
    }
  });
}


  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.ProfitCenterMasterSid) return;

    this.masterService.getAuditLogsProfitCenter(
      'ProfitCenterMaster',
      this.ProfitCenterMasterSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        const ignoredFields = ['UpdatedOn']; // ✅ add more if needed later

        const formatFields = (val: any) => {
          if (!val) return [];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          if (Object.keys(obj).length === 0) return [];
          return Object.entries(obj)
            .filter(([key]) => !ignoredFields.includes(key)) // 🚫 exclude fields
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
      error: err => console.error('Error fetching audit logs:', err)
    });
  }


  closeModal(): void {
    if (this.modalRef && typeof this.modalRef.close === 'function') {
      this.modalRef.close();
      this.modalRef = null!;
    }
  }

  getProfitCenterById(id: number) {
    this.resetForm();
    return this.masterService.getProfitCenterById(id).pipe(take(1)).subscribe(
      (profitCenter: any) => {
        console.log('Profit-Center from backend:', profitCenter);
        this.profitCenterForm.patchValue({
          ProfitCenterCode: profitCenter.ProfitCenterCode,
          ProfitCenterName: profitCenter.ProfitCenterName,
          Remarks: profitCenter.Remarks,
          Status: profitCenter.Status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error  loading');
      }
    );
  }

  onSubmit() {
    if (this.profitCenterForm.get('Status')?.disabled) {
      this.profitCenterForm.get('Status')?.enable();
    }
    if (this.profitCenterForm.invalid) {
      this.profitCenterForm.markAllAsTouched();
      this.profitCenterForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let CreatedBy = { CreatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let UpdatedBy = { UpdatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.profitCenterForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...UpdatedBy,
        Status: formValue.Status === 'Active' || formValue.Status === 'A' ? 'A' : 'S'
      } : {
        ...formValue,
        ...CreatedBy,
        Status: formValue.Status === 'Active' || formValue.Status === 'A' ? 'A' : 'S'
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.editProfitCenter(this.ProfitCenterMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if (resp.Status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              // this.loadProfitCenters()
              this.searchProfitCenter();
              this.router.navigate(['master/profit-center']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      } else {
        this.masterService.createProfitCenter(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.Status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              // this.loadProfitCenters()
              this.searchProfitCenter();
              this.router.navigate(['master/profit-center']);
            } else {
              this.appSettingService.showSuccess(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      }
    }
  }

  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended'
  };

  loadProfitCenterData(id: number) {
    this.masterService.getProfitCenterById(id).subscribe(
      (data) => {
        this.profitCenterForm.patchValue({
          ...data,
          Status: data.Status === 'A' ? 'Active' : 'Suspended'
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  onSearch(event: { type: string, value: string }) {
    this.searchType = event.type;
    this.filterValue = event.value;
    console.log('Searching with:', this.searchType, this.filterValue);
    this.search();
  }

  // search() {
  //   const payload = {
  //     searchType: this.searchType,
  //     filterValue: this.filterValue,
  //   };

  //   this.masterService.searchProfitCenterList(payload).subscribe((res: any) => {
  //     this.results = res;
  //     console.log(this.results)
  //     this.searched = true;
  //     this.applySorting();
  //     this.updatePaginationData();
  //     this.totalLengthOfCollection = this.results.length || 0;
  //   });
  // }

  // sort(column: string) {
  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.applySorting();
  // }

  // applySorting() {
  //   this.results.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];

  //     // Handle null/undefined values
  //     if (valueA == null) valueA = '';
  //     if (valueB == null) valueB = '';

  //     // Convert to string for case-insensitive comparison
  //     valueA = valueA.toString().toLowerCase();
  //     valueB = valueB.toString().toLowerCase();

  //     if (valueA < valueB) {
  //       return this.sortDirection === 'asc' ? -1 : 1;
  //     }
  //     if (valueA > valueB) {
  //       return this.sortDirection === 'asc' ? 1 : -1;
  //     }
  //     return 0;
  //   });
  //   this.profitCenterList = [...this.results];
  // }
  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadProfitCenters();
    this.searchProfitCenter()
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  softDeleteProfitCenter(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.softDeleteProfitCenter(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.router.navigate(['master/profit-center']);
          // this.loadProfitCenters();
          this.searchProfitCenter()
        });
      }
    });
  }

  // resetPage(): void {
  //   this.profitCenterList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.searched = false;
  //   this.filterValue = '';
  //   this.searchType = 'ProfitCenterName';
  //   this.page = 1;
  //   this.profitCenters = [];
  //   this.sortColumn = 'ProfitCenterName';
  //   this.sortDirection = 'asc';
  //   this.loadProfitCenters()
  // }


  showInfo() {
    if (!this.profitCenterData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.profitCenterData;
    modalRef.componentInstance.idLabel = 'Profit-Center Id';
    modalRef.componentInstance.idValue = this.profitCenterData?.ProfitCenterMasterSid;
  }

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.Status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.ProfitCenterMasterSid;

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
    if (!this.profitCenterData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.profitCenterData;
    modalRef.componentInstance.idLabel = 'Profit-Center Id';
    modalRef.componentInstance.idValue = this.profitCenterData?.ProfitCenterMasterSid;
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
    modalRef.componentInstance.documentSid = this.ProfitCenterMasterSid;
  }

  openEDoc() {
    if (!this.profitCenterData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.profitCenterData;
    modalRef.componentInstance.idLabel = 'Profit-Center Id';
    modalRef.componentInstance.idValue = this.profitCenterData?.ProfitCenterMasterSid;
    const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.ProfitCenterMasterSid
  }

      this.commonService.documentData.set(data)
  }
  OnDestroy(): void {
    this.commonService.clearDocumentData()
 }

  clearFilterValue() {
    this.filterValue = '';
  }
}
