import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { CostCenter } from 'src/app/modules/crm-mobile/Interfaces/cost-center.interfaces';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { take } from 'rxjs';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
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
  selector: 'app-cost-center',
  standalone: true,
  imports: [
    FeatherModule,
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
  templateUrl: './cost-center.component.html',
  styleUrl: './cost-center.component.scss'
})
export class CostCenterComponent extends BaseListComponent implements OnInit {
  @ViewChild('costcenterTable') costcenterTable!: ReusableTableComponent;
  @ViewChild('content') content: TemplateRef<any>
  costCenterForm!: FormGroup;
  isEditMode: boolean = false;
  costCenters: CostCenter[] = [];
  results: any[] = [];
  CostCenterMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  costCenterList: any[] = [];
  modalRef!: NgbModalRef;
  searchType = 'CostCenterName';
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  // filterValue = '';
  // searchPerformed = false;
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection = 0;
  userData: any;
  costCenterData: any;
  currentMenuId: number;
  TandCList: any;
  // sortColumn: string = 'CostCenterName';
  // sortDirection: string = 'asc';
  isFavorite: boolean = false;
  loading = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // Company
  currentCompany: any;
  currentBranch: any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  statusList = ["Active", "Suspended"];

  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  // Table configuration
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
    trackByKey: 'CostCenterMasterSid',
    emptyMessage: 'No cost-center found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'cost-center-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'CostCenterName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allCostcenter() { return this.allItems; }
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
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    // this.loadCostCenter()
    this.initForm();
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       this.checkPermissions();
    //     }
    //   }
    // )
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.route.paramMap.subscribe(params => {
      this.CostCenterMasterSid = +params.get('id');
      if (this.CostCenterMasterSid) {
        this.isEditMode = true;
        this.loadCostCenterData(this.CostCenterMasterSid);
      }
    });
    // this.loadCostCenters();
    // Initialize table configuration
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.initializeModalDropdownItems();

    // Initialize base component
    super.ngOnInit();

  }

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchCostCenter(this.getSearchParams());
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
      this.appSettingService.showError('Error searching cost-center.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

   onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchCostCenter();
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
  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching cost-center.');
    console.error('Error searching cost-center', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchCostCenter() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.CostCenterMasterSid || index;
  }


  viewCostCenter(item: any, content: any): void {
    this.editCostCenter(item.CostCenterMasterSid, content)
  }



  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [

      {
        key: 'CostCenterName',
        label: 'Cost Center Name ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'CostCenterCode',
        label: 'Cost Center Code',
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
    ];
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
    this.softDeleteCostCenter(row.CostCenterMasterSid)
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
    const formattedData = this.allCostcenter;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.costcenterTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Cost-Center-Report',
      title: companyName
    });
  }
  // loadCostCenters(): void {
  //   this.spinner.show();
  //   this.loading = true;
  //   this.errorMessage = '';

  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection
  //   };

  //   this.masterService.searchCostCenter(params).subscribe({
  //     next: (response) => {
  //       if (response.status) {
  //         this.costCenterList = response.data.items;
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searchPerformed = true;
  //       } else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.loading = false;
  //       this.spinner.hide();
  //     },
  //     error: (err) => {
  //       console.error('Error fetching cost centers:', err);
  //       this.costCenterList = [];
  //       this.totalLengthOfCollection = 0;
  //       this.errorMessage = err?.error?.message || 'Failed to load Cost Centers';
  //       this.appSettingService.showError(this.errorMessage);
  //       this.loading = false;
  //     }
  //   });
  // }

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

  // loadCostCenter(): void {
  //   this.masterService.getAllCostCenter().subscribe(
  //     (resp: CostCenter[]) => {
  //       console.log(resp, 'CostCenter')
  //       this.costCenters = resp['data'];
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;
  //       console.error('Error loading:', error);
  //     }
  //   );
  // }

  initForm() {
    this.costCenterForm = this.fb.group({
      CostCenterCode: ['', [Validators.required]],
      CostCenterName: ['', [Validators.required]],
      Remarks: [''],
      Status: [{ value: 'A', disabled: false }, Validators.required]
    });
  }
  //  resetForm(): void {
  //   this.costCenterForm.get('Status')?.disable();
  //   this.costCenterForm.reset({
  //     Status: 'Active'
  //   });
  //  }

  resetForm(): void {
    // If editing an existing cost center, reload it (restore original state)
    if (this.isEditMode && this.CostCenterMasterSid) {
      this.loadCostCenterData(this.CostCenterMasterSid);
      return;
    }

    // Create-mode: reset form to initial state with proper default values
    this.costCenterForm.reset({
      CostCenterCode: null,
      CostCenterName: null,
      Remarks: null,
      Status: 'Active'
    });

    // Re-enable the status field if it was disabled
    this.costCenterForm.get('Status')?.enable();

    // Reset validation state
    this.costCenterForm.markAsUntouched();
    this.costCenterForm.markAsPristine();

    // Clear any stored data
    this.costCenterData = null;
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  openEditModal(content: any, id: number): void {
    this.isEditMode = true;
    this.CostCenterMasterSid = id;
    this.getCostCenterById(id).add(() => {
      this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
    });
  }

  editCostCenter(id: number, content: any) {
    this.isEditMode = true;
    this.CostCenterMasterSid = id;
    this.masterService.getCostCenterById(id).pipe(take(1)).subscribe({
      next: (costCenter: any) => {
        this.costCenterData = costCenter;
        this.costCenterForm.get('Status')?.enable();
        this.costCenterForm.patchValue({
          CostCenterCode: costCenter.CostCenterCode,
          CostCenterName: costCenter.CostCenterName,
          Remarks: costCenter.Remarks,
          Status: costCenter.Status === 'A' ? 'Active' : 'Suspended'
        });
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
      },
      error: (err) => {
        console.error('Error fetching Cost-Center', err);
        this.appSettingService.showError('Error fetching data for edting');
      }
    });
  }

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.CostCenterMasterSid) return;

    this.masterService.getAuditLogsCostCenter(
      'CostCenterMaster',
      this.CostCenterMasterSid.toString()
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

  getCostCenterById(id: number) {
    this.resetForm();
    return this.masterService.getCostCenterById(id).pipe(take(1)).subscribe(
      (costCenter: any) => {
        console.log('Cost-Center from backend:', costCenter);
        this.costCenterForm.patchValue({
          CostCenterCode: costCenter.CostCenterCode,
          CostCenterName: costCenter.CostCenterName,
          Remarks: costCenter.Remarks,
          Status: costCenter.Status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error  loading');
      }
    );
  }

  onSubmit() {
    if (this.costCenterForm.get('Status')?.disabled) {
      this.costCenterForm.get('Status')?.enable();
    }
    if (this.costCenterForm.invalid) {
      this.costCenterForm.markAllAsTouched();
      this.costCenterForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let CreatedBy = { CreatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let UpdatedBy = { UpdatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.costCenterForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...UpdatedBy,
        Status: formValue.Status === "Active" ? "A" : "S"
      } : {
        ...formValue,
        ...CreatedBy,
        Status: formValue.Status === "Active" ? "A" : "S"
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.editCostCenter(this.CostCenterMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if (resp.Status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              // this.loadCostCenters();
              this.searchCostCenter();
              this.router.navigate(['master/cost-center']);
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
        this.masterService.createCostCenter(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.Status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              // this.loadCostCenters();
              this.searchCostCenter();
              this.router.navigate(['master/cost-center']);
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

  loadCostCenterData(id: number) {
    this.masterService.getCostCenterById(id).subscribe(
      (data) => {
        this.costCenterForm.patchValue({
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



  // sort(column: string) {
  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.loadCostCenters();
  //   this.applySorting();
  //   this.updatePaginationData();
  // }

  // applySorting() {
  //   this.costCenterList.sort((a, b) => {
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
  // }
  // clearFilterValue() {
  //   this.filterValue = '';
  //   this.loadCostCenters();
  // }
  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadCostCenters();
    this.searchCostCenter();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  softDeleteCostCenter(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.softDeleteCostCenter(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          // this.loadCostCenters();
          this.router.navigate(['master/cost-center']);
          this.searchCostCenter()
        });
      }
    });
  }

  // resetPage(): void {
  //   this.costCenterList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.searchPerformed = false;
  //   this.filterValue = '';
  //   this.searchType = 'CostCenterName';
  //   this.page = 1;
  //   this.costCenters = [];
  //   this.sortColumn = 'CostCenterName';
  //   this.sortDirection = 'asc';
  //   this.loadCostCenters();
  // }


  showInfo() {
    if (!this.costCenterData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.costCenterData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.costCenterData?.CostCenterMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.CostCenterMasterSid;

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
    if (!this.costCenterData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.costCenterData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.costCenterData?.CostCenterMasterSid;
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
    modalRef.componentInstance.documentSid = this.CostCenterMasterSid;
  }

  openEDoc() {
    if (!this.costCenterData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.costCenterData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.costCenterData?.CostCenterMasterSid;
  }

}
