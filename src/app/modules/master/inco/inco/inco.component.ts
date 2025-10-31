import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbPagination, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { Inco } from 'src/app/modules/crm-mobile/Interfaces/inco.intefaces';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { CommonService } from 'src/app/common/common.service';
@Component({
  selector: 'app-inco',
  standalone: true,
  imports: [
    FeatherModule,
    RouterModule,
    CommonModule,
    NgSelectModule,
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
  templateUrl: './inco.component.html',
  styleUrl: './inco.component.scss'
})
export class IncoComponent extends BaseListComponent implements OnInit {
  @ViewChild('incoTable') incoTable!: ReusableTableComponent;
  @ViewChild('content') content: TemplateRef<any>
  incoForm!: FormGroup;
  isEditMode: boolean = false;
  incos: Inco[][];
  results: any[] = [];
  IncoMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  incoList: any[] = [];
  modalRef!: NgbModalRef;
  searchType = 'IncoName';
  // filterValue = '';
  // searchPerformed = false;
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection = 0;
  userData: any;
  incoData: any;
  currentMenuId: number;
  TandCList: any;
  // sortColumn: string = 'IncoName';
  // sortDirection: string = 'asc';
  isFavorite: boolean = false;
  loading = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // Company
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  statusList = ["Active", "Suspended"];
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  incoTypeOptions = [
    { id: 'Sea', name: 'Sea' },
    { id: 'All', name: 'All' }
  ];

  oceanFreightOptions = [
    { id: 'Prepaid', name: 'Prepaid' },
    { id: 'Collect', name: 'Collect' }
  ];
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
      // {
      //   icon: 'fas fa-trash',
      //   label: 'Delete',
      //   action: 'delete',
      //   tooltip: 'Delete ',
      //   class: "text-danger",
      //   condition: (row: any) => this.hasPermission('Delete')
      // }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'IncoMasterSid',
    emptyMessage: 'No inco found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'inco-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'IncoName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allInco() { return this.allItems; }
  constructor(
    private router: Router,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private commonService: CommonService  
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    // this.loadInco()
    this.initForm();
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //        this.checkPermissions();
    //     }
    //   }
    // )
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  localStorage.getItem('currentMenuId');
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.route.paramMap.subscribe(params => {
      this.IncoMasterSid = +params.get('id');
      if (this.IncoMasterSid) {
        this.isEditMode = true;
        this.loadIncoData(this.IncoMasterSid);
      }
    });
    // this.loadIncos();
    // Initialize table configuration
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.initializeModalDropdownItems();
    // Initialize base component
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

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchInco(this.getSearchParams());
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
      this.appSettingService.showError('Error searching inco.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching inco.');
    console.error('Error searching inco', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchInco() {
    this.search();
  }

    onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchInco();
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
  // clearFilterValue() {
  //   this.clearFilter();
  // }

  override trackBy(index: number, item: any): number {
    return item.IncoMasterSid || index;
  }


  viewinco(item: any, content: any): void {
    this.editInco(item.IncoMasterSid, content)
  }



  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'IncoName',
        label: 'IncoName',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'IncoCode',
        label: 'IncoCode ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },

      {
        key: 'IncoType',
        label: 'Inco Type ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'OceanFreight',
        label: 'Ocean Freight',
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
      this.viewinco(event.row, this.content);
    } else if (event.action === 'delete') {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row: any) {
    this.softDeleteInco(row.IncoMasterSid)
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
    const formattedData = this.allInco;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.incoTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Inco-Report',
      title: companyName
    });
  }

  // loadIncos(): void {
  //   this.spinner.show();
  //   this.loading = true;

  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection
  //   };

  //   this.masterService.searchInco(params).subscribe({
  //     next: (response) => {
  //       if (response.status) {
  //         this.incoList = response.data.items;
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searchPerformed = true;
  //       } else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error fetching incos:', err);
  //       this.incoList = [];
  //       this.totalLengthOfCollection = 0;
  //       this.loading = false;
  //     }
  //   });
  // }

  // loadInco(): void {
  //   this.masterService.getAllInco().subscribe(
  //     (resp: Inco[]) => {
  //       console.log(resp, 'Inco')
  //       this.incos = resp['data'];
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;
  //       console.error('Error loading:', error);
  //     }
  //   );
  // }

  initForm() {
    this.incoForm = this.fb.group({
      IncoCode: ['', [Validators.required]],
      IncoName: ['', [Validators.required]],
      IncoType: ['', [Validators.required]],
      OceanFreight: ['', [Validators.required]],
      Remarks: [''],
      IncoDescription: [''],
      Status: [{ value: 'A', disabled: false }, Validators.required]
    });
  }
  //  resetForm(): void {
  //   this.incoForm.get('Status')?.disable();
  //   this.incoForm.reset({
  //     Status: 'Active'
  //   });
  //  }

  resetForm(): void {
    // If editing an existing Inco, reload it (restore original state)
    if (this.isEditMode && this.IncoMasterSid) {
      this.loadIncoData(this.IncoMasterSid);
      return;
    }

    // Create-mode: reset form to sensible defaults
    this.incoForm.reset({
      IncoCode: '',
      IncoName: '',
      IncoType: '',
      OceanFreight: '',
      Remarks: '',
      IncoDescription: '',
      Status: 'Active'
    });

    // Reset search and pagination
    this.filterValue = '';
    this.page = 1;
    this.sortColumn = 'IncoName';
    this.sortDirection = 'asc';

    // Clear selected data
    this.incoData = null;
    this.IncoMasterSid = null;

    // Reload the list if needed
    this.searchInco();
  }
  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  openEditModal(content: any, id: number): void {
    this.isEditMode = true;
    this.IncoMasterSid = id;
    this.getIncoById(id).add(() => {
      this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
    });
  }

  editInco(id: number, content: any) {
    this.isEditMode = true;
    this.IncoMasterSid = id;
    this.masterService.getIncoById(id).pipe(take(1)).subscribe({
      next: (inco: any) => {
        this.incoData = inco;
        this.incoForm.get('Status')?.enable();
        this.incoForm.patchValue({
          IncoCode: inco.IncoCode,
          IncoName: inco.IncoName,
          IncoType: inco.IncoType,
          OceanFreight: inco.OceanFreight,
          Remarks: inco.Remarks,
          IncoDescription: inco.IncoDescription,
          Status: inco.Status === 'A' ? 'Active' : 'Suspended'
        });
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
      },
      error: (err) => {
        console.error('Error fetching Inco', err);
        this.appSettingService.showError('Error fetching data for edting');
      }
    });
  }

  closeModal(): void {
    if (this.modalRef && typeof this.modalRef.close === 'function') {
      this.modalRef.close();
      this.modalRef = null!;
    }
  }

  getIncoById(id: number) {
    this.resetForm();
    return this.masterService.getIncoById(id).pipe(take(1)).subscribe(
      (inco: any) => {
        console.log('Inco from backend:', inco);
        this.incoForm.patchValue({
          IncoCode: inco.IncoCode,
          IncoName: inco.IncoName,
          IncoType: inco.IncoType,
          OceanFreight: inco.OceanFreight,
          Remarks: inco.Remarks,
          IncoDescription: inco.IncoDescription,
          Status: inco.Status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error  loading');
      }
    );
  }

  onSubmit() {
    if (this.incoForm.get('Status')?.disabled) {
      this.incoForm.get('Status')?.enable();
    }
    if (this.incoForm.invalid) {
      this.incoForm.markAllAsTouched();
      this.incoForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let CreatedBy = { CreatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let UpdatedBy = { UpdatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.incoForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...UpdatedBy,
        Status: formValue.Status === 'Active' || formValue.Status === 'A' ? 'A' : 'S',
      } : {
        ...formValue,
        ...CreatedBy,
        Status: formValue.Status === 'Active' || formValue.Status === 'A' ? 'A' : 'S',
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.editInco(this.IncoMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if (resp.Status) {
              this.closeModal();
              this.router.navigate(['master/inco']);
              // this.loadIncos();
              this.searchInco();
            } else {
              this.appSettingService.showSuccess(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      } else {
        this.masterService.createInco(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.Status) {
              this.closeModal();
              this.router.navigate(['master/inco']);
               this.searchInco();
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

  loadIncoData(id: number) {
    this.masterService.getIncoById(id).subscribe(
      (data) => {
        this.incoForm.patchValue({
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
  //   this.loadIncos();
  // }

  // applySorting() {
  //   this.incoList.sort((a, b) => {
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
  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadIncos();
  }

  clearFilterValue() {
    this.filterValue = '';
    // this.loadIncos();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  softDeleteInco(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.softDeleteInco(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Inco deleted successfully!");
          this.router.navigate(['master/inco']);
          this.searchInco();

        });
      }
    });
  }

  // resetPage(): void {
  //   this.incoList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.searchPerformed = false;
  //   this.filterValue = '';
  //   this.searchType = 'IncoName';
  //   this.page = 1;
  //   this.incos = [];
  //   this.sortColumn = 'IncoName';
  //   this.sortDirection = 'asc';
  //   this.loadIncos();
  // }

  // report(): void {
  //   const formattedData = this.incoList.map(item => ({
  //     ...item,
  //     Status: item.Status === 'A' ? 'Active' : 'Suspended'
  //   }));
  //   //  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'IncoCode', label: 'Inco Code' },
  //       { key: 'IncoName', label: 'Inco Name' },
  //       { key: 'IncoType', label: 'Inco Type' },
  //       { key: 'OceanFreight', label: 'Ocean Freight' },
  //       { key: 'Status', label: 'Status' },
  //     ],
  //     fileName: 'Inco-Report',
  //     title: companyName
  //   });
  // }

  showInfo() {
    if (!this.incoData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.incoData;
    modalRef.componentInstance.idLabel = 'Inco Id';
    modalRef.componentInstance.idValue = this.incoData?.IncoMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.IncoMasterSid;

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
    if (!this.incoData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    if (!this.incoData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.incoData;
    modalRef.componentInstance.idLabel = 'Inco Id';
    modalRef.componentInstance.idValue = this.incoData?.IncoMasterSid;
  }

  openEDoc() {
    if (!this.incoData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.incoData;
    modalRef.componentInstance.idLabel = 'Inco Id';
    modalRef.componentInstance.idValue = this.incoData?.IncoMasterSid;
    const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.IncoMasterSid
  }

      this.commonService.documentData.set(data)
}
 OnDestroy(): void {
    this.commonService.clearDocumentData()
 }
  

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.IncoMasterSid) return;

    this.masterService.getAuditLogs(
      'IncoMaster',
      this.IncoMasterSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        const ignoredFields = ['UpdatedOn', 'UpdatedBy']; // ✅ add more if needed later

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
