import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
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
@Component({
  selector: 'app-role',
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
    PreventMultiClickDirective,
    FavoriteStarComponent,
    NgxSpinnerModule,
    NgbDropdownModule,
    ReusableTableComponent
  ],
  templateUrl: './role.component.html',
  styleUrl: './role.component.scss',
  providers: [DatePipe]
})
export class RoleComponent extends BaseListComponent implements OnInit {
  @ViewChild('roleTable') roleTable!: ReusableTableComponent;
   @ViewChild('content') content: TemplateRef<any>;
  roleForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  RoleMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  roleList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: NgbModalRef;
  searchType = 'UserRoleName';
  isLoading = false;
  userData: any;
  roleData: any;
  currentMenuId: number;
  TandCList: any;
  isFavorite: boolean = false;
  // Table configuration
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Role',
        // condition: (row: any) => this.hasPermission('View')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: '',
    emptyMessage: 'No role found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'role-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'UserRoleName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allRole() { return this.allItems; }
  // Company
  currentCompany: any;
  currentBranch: any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //     }
    //   }
    // )
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.RoleMasterSid = +params.get('id');
      if (this.RoleMasterSid) {
        this.isEditMode = true;
        this.loadRoleData(this.RoleMasterSid);
      }
    });
    this.loadRoles();
    // Initialize table configuration
    this.initializeTableConfig();

    // Initialize base component
    super.ngOnInit();
  }
  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.settingsService.searchRole(this.getSearchParams());
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
    } else {
      this.appSettingService.showError('Error searching role.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching role.');
    console.error('Error searching role', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchRole() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.RoleMasterSid || index;
  }


  viewRole(row: any,content:any): void {
    this.editRole(row.RoleMasterSid,content)
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
    
      {
        key: 'UserRoleName',
        label: 'Role Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'UserRoleCode',
        label: 'Role Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'LicenseType',
        label: 'License Type ',
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
      this.viewRole(event.row,this.content);
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

  report(): void {
    const formattedData = this.allRole;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.roleTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Role-Report',
      title: companyName
    });
  }
  loadRoles(): void {
    this.spinner.show();
    this.isLoading = true;
    let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      activeCompanyId: CompanyMasterSid
    };

    this.settingsService.searchRole(params).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.roleList = response.data.items || response.data;
          this.totalLengthOfCollection = response.data.totalCount || response.length;
          this.applySorting();
          this.searchPerformed = true;
        } else {
          this.appSettingService.showError(response.message);
        }
        this.spinner.hide();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching roles:', err);
        this.roleList = [];
        this.totalLengthOfCollection = 0;
        this.isLoading = false;
      }
    });
  }

  initForm() {
    this.roleForm = this.fb.group({
      UserRoleName: ['', [Validators.required, Validators.maxLength(50), this.alphaSpaceValidator()]],
      UserRoleCode: ['', [
        Validators.required,
        Validators.maxLength(3),
        Validators.minLength(3),
        this.alphaValidator()
      ]],
      LicenseType: ['', [
        Validators.maxLength(50),
        this.alphaSpaceValidator()
      ]],
      status: [{ value: 'Active', disabled: false }, Validators.required]
    });
    this.roleForm.get('UserRoleCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.roleForm.get('UserRoleCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }


  private alphaValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z]+$/.test(control.value);
      return valid ? null : { invalidAlpha: true };
    };
  }

  private alphaSpaceValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z\s]+$/.test(control.value);
      return valid ? null : { invalidAlphaSpace: true };
    };
  }
  onKeyPress(event: KeyboardEvent, field: string) {
    if (field === 'UserRoleCode') {
      const pattern = /[A-Za-z]/;
      if (!pattern.test(event.key)) {
        event.preventDefault();
      }
    } else if (field === 'UserRoleName') {
      const pattern = /[A-Za-z\s]/;
      if (!pattern.test(event.key)) {
        event.preventDefault();
      }
    } else if (field === 'LicenseType') {
      const pattern = /[A-Za-z\s]/;
      if (!pattern.test(event.key)) {
        event.preventDefault();
      }
    }
  }

  // resetForm(): void {
  //   this.roleForm.get('status')?.disable();
  //   this.roleForm.reset({
  //     status: 'Active'
  //   });
  // }

  resetForm(): void {
    // If editing an existing role, reload it (restore original state)
    if (this.isEditMode && this.RoleMasterSid) {
      this.loadRoleData(this.RoleMasterSid);
      return;
    }

    // Create-mode: reset form to sensible defaults
    this.roleForm.reset({
      UserRoleName: '',
      UserRoleCode: '',
      LicenseType: '',
      status: 'Active'
    });

    // Enable status field if it was disabled
    this.roleForm.get('status')?.enable();

    // Clear form validation states
    this.roleForm.markAsUntouched();
    this.roleForm.updateValueAndValidity();

    // Reset error message
    this.errorMessage = '';
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editRole(id: number, content: any) {
    this.isEditMode = true;
    this.RoleMasterSid = id;
    this.settingsService.getRoleById(id).pipe(take(1)).subscribe({
      next: (response: any) => {
        const role = response.data;
        this.roleData = role;
        this.roleForm.get('status')?.enable();
        this.roleForm.patchValue({
          UserRoleName: role.UserRoleName,
          UserRoleCode: role.UserRoleCode,
          LicenseType: role.LicenseType || '',
          status: role.status === 'A' ? 'Active' : 'Suspended'
        });
        this.roleForm.get('status')?.enable();
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
      },
      error: (err) => {
        console.error('Error fetching Role', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }
  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadRoleData(id: number) {
    this.settingsService.getRoleById(id).subscribe(
      (response: any) => {
        const data = response.data; // Access the data property from the response
        this.roleForm.patchValue({
          UserRoleName: data.UserRoleName,
          UserRoleCode: data.UserRoleCode,
          LicenseType: data.LicenseType,
          status: data.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  onSubmit() {
    if (this.roleForm.get('status')?.disabled) {
      this.roleForm.get('status')?.enable();
    }
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      this.roleForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.roleForm.value;

      const payload = {
        ...formValue,
        ...(this.isEditMode ? updatedBy : createdBy),
        status: formValue.status === "Active" ? "A" : "S",
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      };

      if (this.isEditMode) {
        this.settingsService.updateRoleById(this.RoleMasterSid, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.searchRole();
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
        this.settingsService.createNewRole(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.searchRole();
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


  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadRoles();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  // deleteRoleById(id: number) {
  //   const dialogRef = this.dialog.open(DeleteWarningComponent);
  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result === true) {
  //       this.settingsService.deleteRoleById(id).subscribe((resp: any) => {
  //         this.appSettingService.showSuccess('Deleted!');
  //         this.search();
  //       });
  //     }
  //   });
  // }


  // clearFilterValue() {
  //   this.filterValue = '';
  //   this.loadRoles();
  // }



  showInfo() {
    if (!this.roleData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.roleData;
    modalRef.componentInstance.idLabel = 'Role Id';
    modalRef.componentInstance.idValue = this.roleData?.RoleMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.RoleMasterSid;

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
    if (!this.roleData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.roleData;
    modalRef.componentInstance.idLabel = 'Role Id';
    modalRef.componentInstance.idValue = this.roleData?.RoleMasterSid;
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
    modalRef.componentInstance.documentSid = this.RoleMasterSid;
  }

  openEDoc() {
    if (!this.roleData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.roleData;
    modalRef.componentInstance.idLabel = 'Role Id';
    modalRef.componentInstance.idValue = this.roleData?.RoleMasterSid;
  }


}