import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { PasswordValidators } from 'src/app/core/ValidationFn/password.validators';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
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
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    FeatherModule,
    FormsModule,
    CommonModule,
    RouterModule,
    NgbPaginationModule,
    ListpageComponent,
    ReactiveFormsModule,
    FavoriteStarComponent,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent extends BaseListComponent implements OnInit {
  @ViewChild('userTable') userTable!: ReusableTableComponent;
  @ViewChild('resetTemplate') content: TemplateRef<any>;
  searchType: string = "userName";
  // filterValue: string;
  results: any[];
  userList: any[];
  searched: boolean = false;
  userData: any;
  loading: boolean = false;
  alluser: any[] = []
  // pagination values
  // page = 1;
  // pageSize = 15;
  totalNumberOfCollection: number;
  isFavorite: boolean = false;
  resetPasswordForm !: FormGroup
  passwordView: boolean;
  passwordView1: boolean;
  UserMasterSid: boolean;
  modalRef: NgbModalRef
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // sorting
  // sortColumn: string = 'userName'; // default sort column
  // sortDirection: string = 'asc'; // default sort direction
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  // Company
  currentCompany: any;
  currentBranch: any;
  tableConfig:TableConfig;
  private initializeTableConfig() {
  this.tableConfig= {
    columns: [
       {
        key: 'userName',
        label: 'User Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'userEmail',
        label: 'Email',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'designation',
        label: 'Designation',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: '200px',
      },
      {
        key: 'isSalesperson',
        label: 'IsSalesman',
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
        icon: 'fas fa-key',
        label: 'Change Password',
        action: 'changePassword',
        tooltip: 'Change Password',
        class:"text-info"
        // condition: (row: any) => this.hasPermission('View')
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
    trackByKey: 'userName',
    emptyMessage: 'No User found',
    dragAndDrop: true
  };
}
  headerActions: HeaderAction[] = [];

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'user-type-state',
    defaultPageSize: 10,
    defaultSortColumn: 'UserMasterSid',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allUser() { return this.allItems; }
  constructor(
    private masterServ: MasterService,
    private dialog: MatDialog,
    private appSettingServ: AppSettingsService,
    private appSettingService: AppSettingsService,
    private router: Router,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    public mps : MenuPermissionService,
  ) {
    super(paginationService);
  }


  override ngOnInit(): void {
    // this.appSettingServ.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       this.checkPermissions();
    //     }
    //   });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingServ.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      
    }
      this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });
    this.loadUsers();
    this.initializeHeaderActions();
    this.initializeTableConfig();
    super.ngOnInit();
  }


  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.masterServ.searchFfUserList(this.getSearchParams());
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
        isSalesperson: item.isSalesperson === '1' ? 'Yes' : 'No',
        status: item.status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching user.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error searching user.');
    console.error('Error searching user', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchUser();
  }


  // Legacy method for template compatibility
  searchUser() {
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
    return item.UserMasterSid || index;
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





  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.nagivateTocreateUser();
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

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.editbyrow(event.row);
    } else if (event.action === 'delete') {
      this.deleteBiclauseByRow(event.row);
    } else if(event.action === "changePassword"){
      this.ChangePassword(event.row,this.content)
    }
  }

  editbyrow(row: any) {
    this.router.navigate(['/master/user/entry/', row.UserMasterSid]);
  }


ChangePassword(row: any, content?: TemplateRef<any>) {
  this.openChangePassword(content, row.UserMasterSid);
}


  deleteBiclauseByRow(row: any) {
    this.deleteUser(row.UserMasterSid);
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
    const formattedData = this.allUser;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.userTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'User-Report',
      title: companyName
    });
  }
  loadUsers(): void {
    this.spinner.show();
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
    };

    this.masterServ.searchFfUserList(params).subscribe({
      next: (response) => {
        if (response.status) {
          this.userList = response.data.items;
          this.results = [...this.userList];
          this.totalNumberOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        } else {
          this.appSettingService.showError(response.message);
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.userList = [];
        this.results = [];
        this.totalNumberOfCollection = 0;
      },
    });
  }

  // search(event ?: any) {
  //   const payload = {
  //     searchType: event.type,
  //     filterValue: event.value
  //   }
  //   this.masterServ.searchFfUser(payload).subscribe(
  //     (res) => {
  //       this.results = res.data;
  //       this.searchPerformed = true;
  //       this.updatePaginationData();
  //       this.totalNumberOfCollection = this.results.length || 0;
  //     }
  //   )
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
  //   this.userList = [...this.results];
  // }


  updatePaginationData() {
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
    this.loadUsers();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteUser(UserMasterSid) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.masterServ.deleteFfUserById(UserMasterSid).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingServ.showSuccess("User deleted successfully!");
              this.loadUsers();
              this.searchUser();
            } else {
              this.appSettingServ.showError('Error Deleting User');
            }
          },
          (error) => {
            console.error('Error Deleting User', error);
          }
        );
      }
    })
  }

  nagivateTocreateUser() {
    this.router.navigate(['master/user/entry']);
  }

  // report(): void {
  //   const formattedData = this.userList.map(item => ({
  //     ...item,
  //     salesperson : item.isSalesperson === '1' ? 'Yes' : 'No',
  //     status : item.status === 'A' ? 'Active' : 'Suspended'
  //   }));

  //   // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'userName', label: 'User Name' },
  //       { key: 'designation', label: 'Designation' },
  //       { key: 'userEmail', label: 'Email' },
  //       { key: 'salesperson', label: 'isSalesman' },
  //       { key: 'status', label: 'Status' },
  //     ],
  //     fileName: 'User-Report',
  //     title: companyName
  //   });
  // }

  reset() {
    this.userList = [];
    this.searchType = 'userName';
    this.filterValue = '';
    this.searched = false;
    this.totalNumberOfCollection = 0;
    this.loadUsers();
  }

  initResetPassForm() {
    this.resetPasswordForm = this.fb.group({
      password: ["", [
        Validators.required,
        PasswordValidators.validate()
      ]],
      confirmPassword: ["", [Validators.required, this.confirmPasswordValidator()]]
    });
    this.resetPasswordForm.get('password')?.valueChanges.subscribe(
      () => {
        this.resetPasswordForm.get('confirmPassword').updateValueAndValidity()
      }
    )
  }


  confirmPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!this.resetPasswordForm) return null;

      const password = this.resetPasswordForm.get('password')?.value;
      const confirmPassword = control.value;

      // Only validate if both fields have values
      if (!password || !confirmPassword) {
        return null;
      }

      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  openChangePassword(content: TemplateRef<any>, UserMasterSid) {
    this.initResetPassForm();
    this.UserMasterSid = UserMasterSid;
    if (this.UserMasterSid) {
      this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' })
    }
  }

  onSubmitPassForm() {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      this.resetPasswordForm.updateValueAndValidity();
      this.appSettingServ.showWarning('Please fill all the required fields correctly.')
      return;
    }

    const currentUserEmail = this.appSettingServ.userSettingSource.value['userEmail'];
    const formValue = this.resetPasswordForm.value;
    const payload = {
      password: formValue.password,
      updatedBy: currentUserEmail
    }

    this.masterServ.resetUserPassword(this.UserMasterSid, payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.appSettingServ.showSuccess('Password changed Successfully');
          this.modalRef.close()
        } else {
          this.appSettingServ.showError('Error Changing Password');
          console.error(resp.message)
        }
      }
    )

  }


  togglePassword(isPassword: boolean, input: HTMLInputElement): void {
    if (isPassword) {
      this.passwordView = !this.passwordView
      input.type = 'text'
    } else {
      this.passwordView1 = !this.passwordView1
      input.type = 'text'
    }
  }

  viewPassword(isPassword: boolean, input: HTMLInputElement): void {
    if (input.type === 'password') {
      return;
    }
    if (isPassword) {
      this.passwordView = !this.passwordView
      input.type = 'password'
    } else {
      this.passwordView1 = !this.passwordView1
      input.type = 'password'
    }
  }

  // clearFilterValue(){
  //     this.filterValue = '';
  //   }
}
