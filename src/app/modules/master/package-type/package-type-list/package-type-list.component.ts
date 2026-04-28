import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
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
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
@Component({
  selector: 'app-package-type-list',
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
  templateUrl: './package-type-list.component.html',
  styleUrl: './package-type-list.component.scss',
  providers: [DatePipe]
})
export class PackageTypeListComponent extends BaseListComponent implements OnInit {
  @ViewChild('packageTypeTable') packageTypeTable!: ReusableTableComponent;
  @ViewChild('content') content: TemplateRef<any>
  packageTypeForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  PackageTypeMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  packageTypeList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: NgbModalRef;
  searchType = 'PackageName';
  // filterValue = '';
  searched = false;
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection = 0;
  isLoading = false;
  userData: any;
  packageData: any;
  currentMenuId: number;
  TandCList: any;
  isFavorite: boolean = false;
  // sortColumn: string = 'HSSACCode';
  // sortDirection: string = 'asc';
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  // Table configuration
  tableConfig:TableConfig;
    private initializeTableConfig() {
  this.tableConfig = {
    columns: [
      
      {
        key: 'PackageName',
        label: 'Package Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'PackageCode',
        label: 'Package Code',
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
    ],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View',
        state: !this.mps.can('view')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete',
        class: "text-danger",
        state: !this.mps.can('delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: '',
    emptyMessage: 'No package-type found',
    dragAndDrop: true
  }
};

  tableLoading = false;
    headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  protected config: ListComponentConfig = {
    storageKey: 'package-type-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'HSSACCode',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allPackageType() { return this.allItems; }
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
    private ngbModal: NgbModal,
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.userData = this.appSettingService.getDecryptedUserProfile();
    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
    this.initForm();


    if (this.userData) {

    }
    // this.loadPackageTypes();
    // Initialize table configuration
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.initializeModalDropdownItems();
    this.mps.init().subscribe(() => {
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });
    // Initialize base component
    super.ngOnInit();
  }


      hasAnyDropdownPermission(): boolean {
  const dropdownButtons = ['Edoc', 'Authority', 'Email' , 'Document Reference'];
  return dropdownButtons.some((btn) => this.permissions?.includes(btn));
}
    // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchPackageTypeList(this.getSearchParams());
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
      this.appSettingService.showError('Error searching package-type.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching package-type.');
    console.error('Error searching package-type', error);
    super.handleSearchError(error);
  }

   onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchPackageType();
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
        condition: this.mps.has('edoc')
      },
      // {
      //   label: 'Terms & Condition',
      //   icon: 'fas fa-clipboard',
      //   action: 'terms',
      //   // condition: this.hasPermission('Terms and Condition')
      // },
      {
        label: 'Authorize',
        icon: 'fas fa-shield-alt',
        action: 'authority',
        condition: this.mps.has('authority')
      },
      {
        label: 'Email',
        icon: 'fas fa-envelope',
        action: 'email',
        condition: this.mps.has('email')
      },
      {
        label: 'Document reference',
        icon: 'fas fa-paperclip',
        action: 'document_reference',
        condition: this.mps.has('document_reference')
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
        case 'document_reference':
          this.openDocRef();
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

  // Legacy methods for template compatibility
  searchPackageType() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.PackageTypeMasterSid || index;
  }


  viewPackageType(item: any, content: any): void {
    this.editPackageType(item.PackageTypeMasterSid, content)
  }


  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewPackageType(event.row, this.content);
    } else if (event.action === 'delete') {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row: any) {
    this.deletePackageTypeById(row.PackageTypeMasterSid)
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
    const formattedData = this.allPackageType;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.packageTypeTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'package-type-Report',
      title: companyName
    });
  }

  // loadPackageTypes(): void {
  //   this.spinner.show();
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   const params = {
  //     search: this.filterValue ? this.filterValue.trim() : '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     activeCompanyId: CompanyMasterSid,
  //   };

  //   this.masterService.searchPackageTypeList(params).subscribe({
  //     next: (response) => {
  //       if (response.status) {
  //         this.packageTypeList = response.data.items;
  //         this.results = [...this.packageTypeList];
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
  //       console.error('Error fetching packageTypes:', err);
  //       this.packageTypeList = [];
  //       this.results = [];
  //       this.totalLengthOfCollection = 0;
  //     },
  //   });
  // }

  initForm() {


    this.packageTypeForm = this.fb.group({
      PackageName: ['', [Validators.required, Validators.maxLength(100)]],
      PackageCode: ['', [Validators.required, Validators.maxLength(3)]],
      status: [{ value: 'Active', disabled: false }, Validators.required],
      CompanyMasterSid: [this.currentCompany?.CompanyMasterSid]
    });

  }

  // resetForm(): void {


  //   this.packageTypeForm.get('status')?.disable();
  //   this.packageTypeForm.reset({
  //     status: 'Active',

  //   });
  // }

  resetForm(): void {
    // If editing an existing package type, reload it (restore original state)
    if (this.isEditMode && this.PackageTypeMasterSid) {
      // You might want to implement a loadPackageTypeData method similar to other components
      this.editPackageType(this.PackageTypeMasterSid, this.modalRef);
      return;
    }

    // Create-mode: reset form to initial state with proper default values
    this.packageTypeForm.reset({
      PackageName: null,
      PackageCode: null,
      status: 'Active',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid
    });

    // Re-enable the status field if it was disabled
    this.packageTypeForm.get('status')?.enable();

    // Reset validation state
    this.packageTypeForm.markAsUntouched();
    this.packageTypeForm.markAsPristine();

    // Clear any stored data
    this.packageData = null;
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editPackageType(id: number, content: any) {
    this.isEditMode = true;
    this.PackageTypeMasterSid = id;
    this.spinner.show();
    this.masterService.getPackageTypeById(id).pipe(take(1)).subscribe({
      next: (response: any) => {
        this.packageData = response;
        this.packageTypeForm.get('status')?.enable();
        this.packageTypeForm.patchValue({
          PackageName: response.PackageName,
          PackageCode: response.PackageCode,
          status: response.status === 'A' ? 'Active' : 'Suspended',
          CompanyMasterSid: response.CompanyMasterSid
        });
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching Package Type', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  onSubmit() {
    if (this.packageTypeForm.get('status')?.disabled) {
      this.packageTypeForm.get('status')?.enable();
    }
    if (this.packageTypeForm.invalid) {
      this.packageTypeForm.markAllAsTouched();
      this.packageTypeForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.packageTypeForm.value;

      const payload = {
        PackageName: formValue.PackageName,
        PackageCode: formValue.PackageCode,
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
        createdBy: this.appSettingService.userSettingSource.value['userEmail'],
        updatedBy: this.appSettingService.userSettingSource.value['userEmail'],
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid
      };


      if (this.isEditMode) {
        this.masterService.updatePackageTypeById(this.PackageTypeMasterSid, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.search();
              // this.loadPackageTypes();
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
        this.masterService.createNewPackageType(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.search();
              // this.loadPackageTypes();
               this.searchPackageType();
            } else {
              this.appSettingService.showError(resp.message);
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

  onSearch(event: { type: string, value: string }) {
    this.searchType = event.type;
    this.filterValue = event.value;
    console.log('Searching with:', this.searchType, this.filterValue);
    this.search();
  }

  // search() {
  //   const payload = {
  //     searchType: this.searchType,
  //     filterValue: this.searchType === 'status'
  //       ? this.filterValue === 'Active' ? 'A' : 'S'
  //       : this.filterValue
  //   };

  //   this.masterService.searchPackageTypeList(payload).subscribe((res: any) => {
  //     this.results = res.data || res;
  //     this.searched = true;
  //     this.applySorting();
  //     this.updatePaginationData();
  //     this.totalLengthOfCollection = this.results.length || 0;
  //   });
  // }

  // sort(column: string) {
  //   if (this.sortColumn === column) {
  //     // Reverse the sort direction if clicking the same column
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     // Set new sort column and default to ascending
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
  //   this.packageTypeList = [...this.results];
  // }

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadPackageTypes();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deletePackageTypeById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deletePackageById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Zone deleted successfully!");
          // this.loadPackageTypes();
          this.searchPackageType();
        });
      }
    });
  }

  // resetPage(): void {
  //   this.packageTypeList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.searched = false;
  //   this.filterValue = '';
  //   this.searchType = 'PackageName';
  //   this.sortColumn = 'PackageName';
  //   this.sortDirection = 'asc';
  //   this.loadPackageTypes();
  // }

  // report(): void {
  //   const formattedData = this.packageTypeList.map(item => ({
  //     ...item,
  //     status: item.status === 'A' ? 'Active' : 'Suspended'
  //   }));

  //   // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'PackageName', label: 'Package Name' },
  //       { key: 'PackageCode', label: 'Package Code' },
  //       { key: 'status', label: 'Status' },
  //     ],
  //     fileName: 'Package-Type-Report',
  //     title: companyName
  //   });
  // }

  showInfo() {
    if (!this.packageData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.packageData;
    modalRef.componentInstance.idLabel = 'Package Type Id';
    modalRef.componentInstance.idValue = this.packageData?.PackageTypeMasterSid;
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
  //         modalRef.componentInstance.DocumentSid = this.PackageTypeMasterSid;

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
    if (!this.packageData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.PackageTypeMasterSid;
  }

  openEDoc() {
    if (!this.packageData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.packageData;
    modalRef.componentInstance.idLabel = 'Package Type Id';
    modalRef.componentInstance.idValue = this.packageData?.PackageTypeMasterSid;
    const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.PackageTypeMasterSid
  }

      this.commonService.documentData.set(data)
  }

  openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.PackageTypeMasterSid;
  }

   openFollowup() {
      if (!this.packageData) return;
      const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
      modalRef.componentInstance.documentSid = this.packageData?.QuoteHeaderSid;
      modalRef.componentInstance.parentEmail = this.packageData.Email;
      modalRef.componentInstance.parentSubject = `Quotation No.${this.packageData.QuoteNumber} Date:${new Date(this.packageData.QuoteDate).toLocaleDateString()}`;
      modalRef.componentInstance.parentMailbody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
        <p>Dear Sir/Madam,</p>
        <p>Please find enclosed the quotation as requested.</p>
        <p>Kindly review the details at your convenience.</p>
        <p>Looking forward to your feedback and the opportunity to work together.</p>
        <p>
          Approval Hyperlink: 
          <a href="https://xxxxxxxxx" target="_blank" style="color: #1a73e8;">Click here to approve</a>
        </p>
        <p>Best Regards,</p>
        <p>${this.userData['userEmail']}</p>
      </div>
    `;
  
    // Optionally, pass the quotation HTML content ID for PDF generation
    modalRef.componentInstance.pdfContentId = 'quotationContent';
    }
  // clearFilterValue() {
  //   this.filterValue = '';
  // }
  //  openAuditLogs(modal: TemplateRef<any>) {
  //   if (!this.PackageTypeMasterSid) return;

  //   this.masterService.getAuditLogs('PackageTypeMaster', this.PackageTypeMasterSid.toString()).subscribe({
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
    if (!this.PackageTypeMasterSid) return;

    this.masterService.getAuditLogs(
      'PackageTypeMaster',
      this.PackageTypeMasterSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        const ignoredFields = ['updatedOn', 'updatedBy']; // ✅ add more if needed later

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
}