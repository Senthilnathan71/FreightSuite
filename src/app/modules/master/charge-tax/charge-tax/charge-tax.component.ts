import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
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
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
@Component({
  selector: 'app-charge-tax',
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
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent
  ],
  templateUrl: './charge-tax.component.html',
  styleUrl: './charge-tax.component.scss',
  providers: [DatePipe]
})
export class ChargeTaxComponent extends BaseListComponent implements OnInit {
  @ViewChild('charegeTaxTable') charegeTaxTable!: ReusableTableComponent;
  @ViewChild('content') content: TemplateRef<any>
  chargeTaxForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  ChargeTaxMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  chargeTaxList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: NgbModalRef;
  searchType = 'description';
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  isLoading = false;
  userData: any;
  companyList: any[] = [];
  selectedCompanyId: number;
  chargeTaxData: any;
  currentMenuId: number;
  TandCList: any[] = [];
  isFavorite: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // Table configuration
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View',
        condition: (row: any) => this.hasPermission('View')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete',
        class: "text-danger",
        condition: (row: any) => this.hasPermission('Delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'ChargeTaxMasterSid',
    emptyMessage: 'No charge-tax found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'charge-tax-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'description',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allChargeTax() { return this.allItems; }
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  // Company
  currentCompany: any;
  currentBranch: any;
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
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    // this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.loadCompanies();
    this.initForm();
    // this.loadChargeTaxes();
    this.route.paramMap.subscribe(params => {
      this.ChargeTaxMasterSid = +params.get('id');
      if (this.ChargeTaxMasterSid) {
        this.isEditMode = true;
        this.loadChargeTaxData(this.ChargeTaxMasterSid);
      }
    });
    this.checkPermissions();
    this.initializeTableConfig();
    this.initializeHeaderActions();
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

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchChargeTax(this.getSearchParams());
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
      this.appSettingService.showError('Error searching charge-tax.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching charge-tax.');
    console.error('Error searching charge-tax', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchChargeTax();
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
  searchChargeTax() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.ChargeTaxMasterSid || index;
  }


  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'description',
        label: 'Description',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'TaxGroup',
        label: 'Tax Group',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'TaxRate',
        label: 'Tax Rate',
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
    ];
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewCharegeTax(event.row, this.content);
    } else if (event.action === 'delete') {
      this.deleteBy(event.row)
    }
  }


  deleteBy(row: any) {
    this.deleteChargeTaxById(row.ChargeTaxMasterSid)
  }

  viewCharegeTax(row: any, content: TemplateRef<any>) {
    this.editChargeTax(row.ChargeTaxMasterSid, content)
    this.searchChargeTax()
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
    const formattedData = this.allChargeTax;
    const companyName = this.currentCompany?.companyName ?? 'Company';
    const visibleColumns = this.charegeTaxTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Charge-Tax-Report',
      title: companyName
    });
  }

  // loadChargeTaxes(): void {
  //   this.spinner.show();
  //   this.isLoading = true;
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     activeCompanyId: CompanyMasterSid,
  //   };

  //   this.masterService.searchChargeTax(params).subscribe({
  //     next: (response: any) => {
  //       if (response.status) {
  //         this.results = response.data.items || [];
  //         this.applySorting();
  //         this.updatePaginationData();
  //         this.chargeTaxList = [...this.results];
  //         this.totalLengthOfCollection = response.data.totalCount || 0;

  //       } else {
  //         this.results = [];
  //         this.chargeTaxList = [];
  //         this.totalLengthOfCollection = 0;
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.searchPerformed = true;
  //       this.isLoading = false;
  //       this.spinner.hide();
  //     },
  //     error: (err) => {
  //       console.error('Error loading charge taxes:', err);
  //       this.isLoading = false;
  //     }
  //   });
  // }

  loadCompanies(): void {
    this.masterService.getAllCompanies().subscribe({
      next: (res) => {
        this.companyList = res.data || res;
      },
      error: (err) => {
        console.error('Error loading companies', err);
        this.appSettingService.showError('Failed to load companies');
      }
    });
  }

  initForm() {
    this.chargeTaxForm = this.fb.group({
      // HSNCode: ['', [Validators.required, Validators.maxLength(10)]],
      description: ['', [Validators.required, Validators.maxLength(100)]],
      TaxGroup: ['', [Validators.required, Validators.maxLength(10)]],
      TaxRate: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      Remarks: ['', [Validators.maxLength(100)]],
      status: [{ value: 'Active', disabled: false }, Validators.required],
      // CompanyMasterSid: ['', Validators.required]
    });
  }

  // resetForm(): void {
  //   this.chargeTaxForm.get('status')?.disable();
  //   this.chargeTaxForm.reset({
  //     status: 'Active'
  //   });
  // }

  resetForm(): void {
    // If editing an existing charge tax, reload it (restore original state)
    if (this.isEditMode && this.ChargeTaxMasterSid) {
      this.loadChargeTaxData(this.ChargeTaxMasterSid);
      return;
    }

    // Create-mode: reset form to initial state with proper default values
    this.chargeTaxForm.reset({
      // HSNCode: null,
      description: null,
      TaxGroup: null,
      TaxRate: null,
      Remarks: null,
      status: 'Active'
    });

    // Re-enable the status field if it was disabled
    this.chargeTaxForm.get('status')?.enable();

    // Reset validation state
    this.chargeTaxForm.markAsUntouched();
    this.chargeTaxForm.markAsPristine();

    // Clear any stored data
    this.chargeTaxData = null;
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editChargeTax(id: number, content: any) {
    this.isEditMode = true;
    this.ChargeTaxMasterSid = id;
    this.masterService.getChargeTaxById(id).pipe(take(1)).subscribe({
      next: (response: any) => {
        const chargeTax = response.data;
        this.chargeTaxData = chargeTax;
        this.chargeTaxForm.get('status')?.enable();
        this.chargeTaxForm.patchValue({
          // HSNCode: chargeTax.HSNCode,
          description: chargeTax.description,
          TaxGroup: chargeTax.TaxGroup,
          TaxRate: chargeTax.TaxRate,
          Remarks: chargeTax.Remarks || '',
          status: chargeTax.Status === 'A' ? 'Active' : 'Suspended',
          CompanyMasterSid: chargeTax.CompanyMasterSid
        });
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
      },
      error: (err) => {
        console.error('Error fetching Charge Tax', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  loadChargeTaxData(id: number) {
    this.masterService.getChargeTaxById(id).subscribe(
      (response: any) => {
        const data = response.data;
        this.chargeTaxForm.patchValue({
          // HSNCode: data.HSNCode,
          description: data.description,
          TaxGroup: data.TaxGroup,
          TaxRate: data.TaxRate,
          Remarks: data.Remarks,
          status: data.Status === 'A' ? 'Active' : 'Suspended',
          CompanyMasterSid: data.CompanyMasterSid
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  //   openAuditLogs(modal: TemplateRef<any>) {
  //   if (!this.ChargeTaxMasterSid) return;

  //   this.masterService.getAuditLogsChargeTax('ChargeTaxMaster', this.ChargeTaxMasterSid.toString()).subscribe({
  //     next: (logs: any[]) => {
  //       const formatFields = (val: any) => {
  //         if (!val) return ['NA'];
  //         const obj = typeof val === 'string' ? JSON.parse(val) : val;
  //         delete obj.updatedOn; // Remove updatedOn field
  //         // If no fields exist after deleting updatedOn
  //         if (Object.keys(obj).length === 0) return ['NA'];
  //         return Object.entries(obj).map(
  //           ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
  //         );
  //       };

  //       this.auditLogs = logs.map(log => ({
  //         ...log,
  //         oldValDisplay: formatFields(log.oldVal),
  //         newValDisplay: formatFields(log.newVal)
  //       }));

  //       this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
  //     },
  //     error: err => console.error('Error fetching audit logs:', err)
  //   });
  // }

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.ChargeTaxMasterSid) return;

    this.masterService.getAuditLogsChargeTax(
      'ChargeTaxMaster',
      this.ChargeTaxMasterSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        const ignoredFields = ['updatedOn', 'UpdatedBy']; // ✅ add more if needed later

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

  onSubmit() {
    const statusControl = this.chargeTaxForm.get('status');
    if (statusControl?.disabled) {
      statusControl.enable();
    }

    if (this.chargeTaxForm.invalid) {
      this.chargeTaxForm.markAllAsTouched();
      this.chargeTaxForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const formValue = this.chargeTaxForm.value;

    // Prepare the payload with both CreatedBy and UpdatedBy
    const payload: any = {
      // HSNCode: formValue.HSNCode,
      description: formValue.description,
      TaxGroup: formValue.TaxGroup,
      TaxRate: parseFloat(formValue.TaxRate),
      Remarks: formValue.Remarks || '',
      Status: formValue.status === "Active" ? "A" : "S",
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      CreatedBy: currentUserEmail,
      UpdatedBy: currentUserEmail  // ✅ Always include both
    };

    if (this.isEditMode) {
      this.masterService.updateChargeTaxById(this.ChargeTaxMasterSid, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.closeModal();
            // this.loadChargeTaxes();
            this.searchChargeTax();
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error updating:', error);
          this.appSettingService.showError('Failed to update Charge Tax');
        }
      );
    } else {
      this.masterService.createNewChargeTax(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.closeModal();
            // this.loadChargeTaxes();
            this.searchChargeTax();
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error creating:', error);
          this.appSettingService.showError('Failed to create Charge Tax');
        }
      );
    }
  }



  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.chargeTaxList = this.results.slice(startIndex, endIndex);
  }
  // onPageChange(newPage: number) {
  //   this.page = newPage;
  //   this.loadChargeTaxes();
  // }
  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteChargeTaxById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteChargeTaxById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          // this.loadChargeTaxes();
          this.searchChargeTax();
        });
      }
    });
  }




  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  showInfo() {
    if (!this.chargeTaxData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.chargeTaxData;
    modalRef.componentInstance.idLabel = 'ChargeTax Id';
    modalRef.componentInstance.idValue = this.chargeTaxData?.ChargeTaxMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.ChargeTaxMasterSid;

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
    if (!this.chargeTaxData) return;
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
    modalRef.componentInstance.documentSid = this.ChargeTaxMasterSid;
  }

  openEDoc() {
    if (!this.chargeTaxData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.chargeTaxData;
    modalRef.componentInstance.idLabel = 'ChargeTax Id';
    modalRef.componentInstance.idValue = this.chargeTaxData?.ChargeTaxMasterSid;
  }
}