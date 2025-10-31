import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbDropdownModule, NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MasterService } from '../../master.service';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { BLClause } from 'src/app/modules/crm-mobile/Interfaces/biclause.interface';
import { FeatherModule } from 'angular-feather';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { Observable } from 'rxjs';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { CommonService } from 'src/app/common/common.service';


@Component({
  selector: 'app-biclause',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    NgbPaginationModule,
    FeatherModule,
    DatePipe,
    ListpageComponent,
    PreventMultiClickDirective,
    FavoriteStarComponent,
    NgxSpinnerModule,
    NgbDropdownModule,
    TextWithNumbersDirective,
    CommonPaginationComponent,
    DecimalPrecisionDirective,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent
  ],
  templateUrl: './biclause.component.html',
  styleUrls: ['./biclause.component.scss']
})
export class BIclauseComponent extends BaseListComponent implements OnInit {
  @ViewChild('biclauseTable') biclauseTable!: ReusableTableComponent;
  @ViewChild('content') content: TemplateRef<any>;

  biclauseForm: FormGroup;
  searchType = 'ClauseDescription';

  clauseList: BLClause[] = [];
  allClauses: BLClause[] = [];

  loading = false;
  btnDisable = false;
  isEditMode = false;
  currentClauseId: number | null = null;
  userData: any;
  blclauseData: any;
  MenuMasterSid:any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};

  // Pagination
  // Alias for compatibility with existing template
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View ',
        condition: (row: any) => this.hasPermission('View')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete ',
        class: "text-danger",
        condition: (row: any) => this.hasPermission('Delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'BLClauseMasterSid',
    emptyMessage: 'No BLClause found',
    dragAndDrop: true
  };
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'biclause-type-state',
    defaultPageSize: 10,
    defaultSortColumn: 'ClauseDescription',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allClause() { return this.allItems; }

  isFavorite: boolean = false;

  //Company
  currentCompany: any;
  currentBranch: any;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  currentMenuId: number;
  TandCList: any[] = [];
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private commonService: CommonService,
  ) {
    super(paginationService);
  }


  override ngOnInit(): void {

    //      this.appSettingService.getUser().subscribe(user => {
    //   if(user) {
    //     this.userData = user;
    //     this.checkPermissions();
    //   }
    // });
    this.initForm();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid = Number(localStorage.getItem('currentMenuId'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.initializeHeaderActions();
    this.initializeTableConfig();
    this.initializeModalDropdownItems();
    super.ngOnInit();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId)
    console.log(userRole)
    if (currentMenuId && userRole) {
      this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions)
            .filter(key => this.currentMenuPermissions[key] === 'isTrue');
          console.log(this.permissions)
          this.initializeHeaderActions();
          this.initializeModalDropdownItems();
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

  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.masterService.searchBlclauselList(this.getSearchParams());
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
      this.appSettingService.showError('Error searching BI clauses.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error searching BI clauses.');
    console.error('Error searching BI clauses', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadAllClauses();
  }


  // Legacy method for template compatibility
  loadAllClauses() {
    this.page = 1;
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilterValue();
  }

  // Legacy method for template compatibility
  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.BLClauseMasterSid || index;
  }

  initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Create',
        icon: 'fas fa-plus',
        action: 'create',
        condition: this.hasPermission('Add')
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

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'ClauseDescription',
        label: 'Clause Description',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'Keyword',
        label: 'Keyword',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'Sortorder',
        label: 'Sort Order',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '150px',
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

  initializeModalDropdownItems(): void {
    this.modalDropdownItems = [
      {
        label: 'Edoc',
        icon: 'fas fa-file-alt',
        action: 'edoc',
        condition: this.hasPermission('Edoc')
      },
      {
        label: 'Terms & Condition',
        icon: 'fas fa-clipboard',
        action: 'terms',
        condition: this.hasPermission('Terms and Condition')
      },
      {
        label: 'Authorize',
        icon: 'fas fa-shield-alt',
        action: 'authority',
        condition: this.hasPermission('Authority')
      },
      {
        label: 'Email',
        icon: 'fas fa-envelope',
        action: 'email',
        condition: this.hasPermission('Email')
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

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.editbyrow(event.row, this.content);
    } else if (event.action === 'delete') {
      this.deleteBiclauseByRow(event.row);
    }
  }

  editbyrow(row: any, content?: TemplateRef<any>) {
    this.openModal(content, row);
  }



  deleteBiclauseByRow(row: any) {
    this.deleteClause(row.BLClauseMasterSid);
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
    const formattedData = this.allClause;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.biclauseTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'BlClause-Report',
      title: companyName
    });
  }


  initForm() {
    this.biclauseForm = this.fb.group({
      ClauseDescription: ['', [Validators.required, Validators.maxLength(500)]],
      Keyword: ['', [Validators.required, Validators.maxLength(5)]],
      Sortorder: [''],
      DefaultClause: [false],
      status: [{ value: 'A', disabled: false }, Validators.required]
    });
  }

  openModal(content: any, clause?: BLClause): void {
    this.isEditMode = !!clause;
    this.currentClauseId = clause?.BLClauseMasterSid || null;

    if (this.isEditMode) {
      this.biclauseForm.get('status')?.enable();
      this.blclauseData = clause;
      console.log(clause);
      this.biclauseForm.patchValue({
        ClauseDescription: clause.ClauseDescription,
        Keyword: clause.Keyword,
        Sortorder: clause.Sortorder?.toString() || '',
        DefaultClause: clause.DefaultClause === 'Y',
        status: clause.status ? (clause.status === "A" ? "Active" : "Suspended") : 'Active'
      });
    } else {
      this.biclauseForm.get('status')?.disable();
      this.biclauseForm.reset({
        ClauseDescription: '',
        Keyword: '',
        Sortorder: '',
        DefaultClause: '',
        status: 'A'
      });
    }

    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  onSubmit(): void {
    if (this.biclauseForm.get('status')?.disabled) {
      this.biclauseForm.get('status')?.enable();
    }
    if (this.biclauseForm.invalid) {
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    this.btnDisable = true;
    const formValue = this.biclauseForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];

    const payload = {
      ClauseDescription: formValue.ClauseDescription,
      Keyword: formValue.Keyword,
      Sortorder: formValue.Sortorder ? parseInt(formValue.Sortorder) : null,
      DefaultClause: formValue.DefaultClause ? 'Y' : 'N',
      status: formValue.status,
      ...(this.isEditMode ? { updatedBy: userEmail } : { createdBy: userEmail })
    };

    const operation = this.isEditMode && this.currentClauseId
      ? this.masterService.updateBlClauseById(this.currentClauseId, payload)
      : this.masterService.createNewBlClause(payload);

    operation.subscribe({
      next: (response: any) => {
        this.btnDisable = false;

        if (response.status) {

          this.appSettingService.showSuccess(response.message);
        }
        else {
          this.appSettingService.showError(response.message);
        }


        this.modalService.dismissAll();
        this.loadAllClauses();
      },
      error: (err) => {
        this.btnDisable = false;
        if (err.error?.message) {
          this.appSettingService.showError(err.error.message);
        } else {
          this.appSettingService.showError(
            `Error ${this.isEditMode ? 'updating' : 'creating'} BI Clause`
          );
        }
      }
    });
  }


 openAuditLogs(modal: TemplateRef<any>) {
  if (!this.blclauseData?.BLClauseMasterSid) return;
 
  this.masterService.getAuditLogsBlclause(
    'BLClauseMaster',
    this.blclauseData?.BLClauseMasterSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['updatedOn','updatedBy']; 
 
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
    error: err => console.error('Error fetching audit logs:', err)
  });
}

  deleteClause(id: number): void {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteBlclauseById(id).subscribe({
          next: () => {
            this.appSettingService.showSuccess("BI Clause deleted successfully!");
            this.loadAllClauses();
            this.loadAllClauses()
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
            this.appSettingService.showError('Failed to delete BI Clause');
          }
        });
      }
    });
  }

  resetForm(): void {
    // If editing an existing clause, reload it (restore original state)
    if (this.isEditMode && this.currentClauseId) {
      // Find the clause in the list and patch the form
      const clause = this.allClauses.find(c => c.BLClauseMasterSid === this.currentClauseId);
      if (clause) {
        this.biclauseForm.patchValue({
          ClauseDescription: clause.ClauseDescription,
          Keyword: clause.Keyword,
          Sortorder: clause.Sortorder?.toString() || '',
          DefaultClause: clause.DefaultClause === 'Y',
          status: clause.status || 'A'
        });
        this.biclauseForm.get('status')?.enable();
      }
      return;
    }

    // Create-mode: reset form to initial state with proper default values
    this.biclauseForm.reset({
      ClauseDescription: null,
      Keyword: null,
      Sortorder: null,
      DefaultClause: false,
      status: 'A'
    });

    // Re-enable the status field if it was disabled
    this.biclauseForm.get('status')?.enable();

    // Reset validation state
    this.biclauseForm.markAsUntouched();
    this.biclauseForm.markAsPristine();

    // Clear any stored data
    this.blclauseData = null;
    this.currentClauseId = null;
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'bg-light-success' : 'bg-light-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';  // This expects 'A' or 'S'
  }

  trackByClauseId(index: number, item: BLClause): number {
    return item.BLClauseMasterSid;
  }


  showInfo() {
    if (!this.blclauseData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.blclauseData;
    modalRef.componentInstance.idLabel = 'BlClause Id';
    modalRef.componentInstance.idValue = this.blclauseData?.BLClauseMasterSid;
  }


  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe(
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
          modalRef.componentInstance.DocumentSid = this.currentClauseId;

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
    if (!this.blclauseData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  // openAuthority() {
  //   if (!this.blclauseData) return;
  //   const modalRef = this.modalService.open(AuthorityEntryComponent, { 
  //     size: 'lg', 
  //     centered: true, 
  //     backdrop: 'static' 
  //   });
  //   modalRef.componentInstance.item = this.blclauseData;
  //   modalRef.componentInstance.idLabel = 'BLClause Id';
  //   modalRef.componentInstance.idValue = this.blclauseData?.BLClauseMasterSid;
  // }

  openAuthority() {
    const MenuMasterSid = localStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.currentClauseId;
  }


  openEDoc() {
    if (!this.blclauseData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.blclauseData;
    modalRef.componentInstance.idLabel = 'BLClause Id';
    modalRef.componentInstance.idValue = this.blclauseData?.BLClauseMasterSid;
    const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.currentClauseId
  }

      this.commonService.documentData.set(data)
  }

OnDestroy(): void {
    this.commonService.clearDocumentData()
 }
}