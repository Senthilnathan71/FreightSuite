import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {
  FormsModule,
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import {
  NgbModalModule,
  NgbPagination,
  NgbModal,
  NgbModalRef,
  NgbDropdownModule,
} from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { Division } from 'src/app/modules/crm-mobile/Interfaces/division.interface';
import { NgSelectModule } from '@ng-select/ng-select';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { take } from 'rxjs';
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
import { UnsavedChangesAction, UnsavedChangesDialogComponent } from 'src/app/shared/components/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
@Component({
  selector: 'app-division',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPagination,
    RouterModule,
    NgbModalModule,
    NgSelectModule,
    ReactiveFormsModule,
    OnlyTextDirective,
    TextWithNumbersDirective,
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
  templateUrl: './division.component.html',
  styleUrl: './division.component.scss',
})
export class DivisionComponent extends BaseListComponent implements OnInit {
  @ViewChild('divisionTable') divisionTable!: ReusableTableComponent;
  @ViewChild('content') content: TemplateRef<any>
  divisionForm!: FormGroup;
  isEditMode: boolean = false;
  divisions: Division[] = [];
  results: any[] = [];
  DivisionMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  divisionList: any[] = [];
  statusList = ['Active', 'Suspended'];
  companyList: any[] = [];
  modalRef!: NgbModalRef;
  companyMap: { [id: number]: string } = {};
  searchType = 'DivisionName';
  // filterValue = '';
  searched = false;
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection = 0;
  userData: any;
  divisionData: any;
  currentMenuId: number;
  TandCList: any;
  isFavorite: boolean = false;
  // sortColumn: string = 'DivisionName';
  // sortDirection: string = 'asc';
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  MenuMasterSid: any;
  isDivisionDirty: boolean = false;
  isDivisionSaving: boolean = false;
  private initialDivisionFormValue: any = null;
  // Company
  currentCompany: any;
  currentBranch: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  tableConfig:TableConfig;
  private initializeTableConfig() {
  this.tableConfig = {
    columns: [
      
      {
        key: 'DivisionName',
        label: 'Division Name ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'DivisionCode',
        label: 'Division Code',
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
    emptyMessage: 'No division found',
    dragAndDrop: true
  };
}

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'division-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'DivisionName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get alldivision() { return this.allItems; }
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
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
    // this.appSettingService.getUser().subscribe((user) => {
    //   if (user) {
    //     this.userData = user;
    //   
    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
     
    }
    this.getAllCompanies();
    this.loadCompanies();
    // this.loadDivisions();
    this.initForm();
    this.route.paramMap.subscribe((params) => {
      this.DivisionMasterSid = +params.get('DivisionMasterSid');
      if (this.DivisionMasterSid) {
        this.isEditMode = true;
        this.loadDivisionData(this.DivisionMasterSid);
      }
    });
     this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
       this.initializeHeaderActions();
    });
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.initializeModalDropdownItems();
    // Initialize base component
    super.ngOnInit();
  }


  hasAnyDropdownPermission(): boolean {
  const dropdownButtons = ['Edoc', 'Authority', 'Email', 'Document Reference'];
  return dropdownButtons.some((btn) => this.permissions?.includes(btn));
}
  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchDivisionList(this.getSearchParams());
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
      this.appSettingService.showError('Error searching division.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching division.');
    console.error('Error searching division', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchDivision() {
    this.search();
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchDivision();
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

  // clearFilterValue() {
  //   this.clearFilter();
  // }

  override trackBy(index: number, item: any): number {
    return item.DivisionMasterSid || index;
  }


  viewdivision(item: any, content: any): void {
    this.updateDivisionById(item.DivisionMasterSid, content)
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewdivision(event.row, this.content);
    } else if (event.action === 'delete') {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row: any) {
    this.deleteDivision(row.DivisionMasterSid)
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
    const formattedData = this.alldivision;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.divisionTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Division-Report',
      title: companyName
    });
  }

  // loadDivisions(): void {
  //   this.spinner.show();
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;

  //   const params = {
  //     search: this.filterValue ? this.filterValue.trim() : '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortDirection: this.sortDirection,
  //     activeCompanyId: CompanyMasterSid

  //   };

  //   this.masterService.searchDivisionList(params).subscribe({
  //     next: (response) => {
  //       if (response.status) {
  //         this.divisionList = response.data.items;
  //         this.results = [...this.divisionList];
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
  //       console.error('Error fetching divisions:', err);
  //       this.divisionList = [];
  //       this.results = [];
  //       this.totalLengthOfCollection = 0;
  //     },
  //   });
  // }

  initForm() {
    this.divisionForm = this.fb.group({
      DivisionName: ['', [Validators.required]],
      DivisionCode: ['', [Validators.required]],
      // address: ['', [Validators.required]],
      // CompanyMasterSid: ['', [Validators.required]],
      Remarks: [''],
      status: [{ value: 'Active', disabled: false }, Validators.required],
    });

    this.divisionForm.valueChanges.subscribe(() => {
      if (!this.initialDivisionFormValue) return;
      this.isDivisionDirty = !this.deepEqual(
        this.initialDivisionFormValue,
        this.divisionForm.getRawValue()
      );
    });
  }

  // resetForm(): void {
  //   // Disable status field and set to 'Active' for create mode
  //   this.divisionForm.get('status')?.disable();
  //   this.divisionForm.reset({
  //     status: 'Active',
  //   });

  // }

  resetForm(): void {
    // If editing an existing division, reload it (restore original state)
    if (this.isEditMode && this.DivisionMasterSid) {
      this.loadDivisionData(this.DivisionMasterSid);
      return;
    }

    // Create-mode: reset form to initial state with proper default values
    this.divisionForm.reset({
      DivisionName: null,
      DivisionCode: null,
      Remarks: null,
      status: 'Active'
    });

    // Re-enable the status field if it was disabled
    this.divisionForm.get('status')?.enable();

    // Reset validation state
    this.divisionForm.markAsUntouched();
    this.divisionForm.markAsPristine();

    // Clear any stored data
    this.divisionData = null;
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.setDivisionFormInitialValue();
    this.modalRef = this.modalService.open(content, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      beforeDismiss: () => this.canCloseDivisionModal()
    });
  }

  openEditModal(content: any, DivisionMasterSid: number): void {
    this.isEditMode = true;
    this.DivisionMasterSid = DivisionMasterSid;
    this.getDivisionById(DivisionMasterSid).add(() => {
      this.setDivisionFormInitialValue();
      this.modalRef = this.modalService.open(content, {
        centered: true,
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
        beforeDismiss: () => this.canCloseDivisionModal()
      });
    });
    
  }

  updateDivisionById(DivisionMasterSid: number, content: any) {
    this.isEditMode = true;
    this.DivisionMasterSid = DivisionMasterSid;
    this.divisionForm.reset();
    this.modalRef = this.modalService.open(content, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      beforeDismiss: () => this.canCloseDivisionModal()
    });
    this.divisionForm.disable();
    this.masterService
      .getDivisionById(DivisionMasterSid)
      .pipe(take(1))
      .subscribe({
        next: (division: any) => {
          this.divisionData = division;
          this.divisionForm.patchValue({
            DivisionName: division.DivisionName,
            DivisionCode: division.DivisionCode,
            Remarks: division.Remarks,
            status: division.status === 'A' ? 'Active' : 'Suspended',
          });
          this.divisionForm.enable();
          this.setDivisionFormInitialValue();
        },
        error: (err) => {
          this.closeModal();
          console.error('Error fetching', err);
          this.appSettingService.showError('Error fetching data for editing');
        },
      });
  }
 
openAuditLogs() {
              if (!this.divisionData?.DivisionMasterSid) return;
              const modalRef = this.modalService.open(AuditLogComponent, {
                centered: true,
                scrollable: true,
                size: 'xl',
                windowClass: 'audit-log-modal'
              });
              modalRef.componentInstance.title = 'Division Logs';
              modalRef.componentInstance.tableName = 'DivisionMaster';
              modalRef.componentInstance.recordId = this.divisionData?.DivisionMasterSid.toString();
              modalRef.componentInstance.screenName = 'Division';
            }
  async closeModal(): Promise<void> {
    const canClose = await Promise.resolve(this.canCloseDivisionModal());
    if (!canClose) return;
    if (this.modalRef && typeof this.modalRef.close === 'function') {
      this.modalRef.close();
      this.modalRef = null!;
    }
  }

  getDivisionById(DivisionMasterSid: number) {
    this.resetForm();
    return this.masterService
      .getDivisionById(DivisionMasterSid)
      .pipe(take(1))
      .subscribe(
        (division: any) => {
          console.log('Division from backend:', division);
          this.divisionForm.patchValue({
            DivisionName: division.DivisionName,
            DivisionCode: division.DivisionCode,

            Remarks: division.Remarks,
            status: division.status === 'A' ? 'Active' : 'Suspended',
          });
          this.setDivisionFormInitialValue();
        },
        (error) => {
          this.appSettingService.showError('Error loading');
        }
      );
  }

  onSubmit() {
    if (this.isDivisionSaving) return;
    if (this.divisionForm.get('status')?.disabled) {
      this.divisionForm.get('status')?.enable();
    }
    if (this.divisionForm.invalid) {
      this.divisionForm.markAllAsTouched();
      this.divisionForm.updateValueAndValidity();
      this.appSettingService.showWarning(
        'Please fill all required fields correctly.'
      );
      return;
    }

    if (!this.isDivisionDirty) {
      this.appSettingService.showWarning('No changes to save.');
      return;
    } else {
      this.btnDisable = true;
      this.isDivisionSaving = true;
      let createdBy = {
        createdBy: this.appSettingService.userSettingSource.value['userEmail'],
      };
      let updatedBy = {
        updatedBy: this.appSettingService.userSettingSource.value['userEmail'],
      };
      const formValue = this.divisionForm.value;

      const payload = this.isEditMode
        ? {
          ...formValue,
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          ...updatedBy,
          status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'I',
        }
        : {
          ...formValue,
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          ...createdBy,
          status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'I',
        };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService
          .updateDivisionById(this.DivisionMasterSid, payload)
          .subscribe(
            (resp: any) => {
              if (resp.status) {
                this.appSettingService.showSuccess("Division updated successfully.");
                this.setDivisionFormInitialValue();
                this.closeModal();
                this.router.navigate(['master/division']);
                // this.loadDivisions();
                this.searchDivision();
              } else {
                this.appSettingService.showError(resp.message);
              }
              this.btnDisable = false;
              this.isDivisionSaving = false;
            },
            (error) => {
              this.errorMessage = error.message;
              console.error('Update Division Error:', error);
              this.btnDisable = false;
              this.isDivisionSaving = false;
            }
          );
      } else {
        this.masterService.createNewDivision(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess("Division created successfully.");
              this.setDivisionFormInitialValue();
              this.closeModal();
              this.router.navigate(['master/division']);
              // this.loadDivisions();
              this.searchDivision();
            } else {
              this.appSettingService.showError(resp.message);
            }
            this.btnDisable = false;
            this.isDivisionSaving = false;
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Create Division Error:', error);
            this.btnDisable = false;
            this.isDivisionSaving = false;
          }
        );
      }
    }
  }

  statusMap: { [key: string]: string } = {
    A: 'Active',
    IA: 'Suspended',
  };

  loadDivisionData(DivisionMasterSid: number) {
    this.masterService.getDivisionById(DivisionMasterSid).subscribe(
      (divisionData) => {
        this.divisionForm.patchValue({
          ...divisionData,
          status: divisionData.status === 'A' ? 'Active' : 'Suspended',
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

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
  //   this.updatePaginatedData();
  // }

  // applySorting() {
  //   this.results.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];

  //     // Handle null/undefined values
  //     if (valueA == null) valueA = '';
  //     if (valueB == null) valueB = '';

  //     // Special handling for company names
  //     if (this.sortColumn === 'CompanyMasterSid') {
  //       valueA = this.companyMap[valueA] || '';
  //       valueB = this.companyMap[valueB] || '';
  //     }

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

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadDivisions();
    this.searchDivision();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteDivision(DivisionMasterSid) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService
          .deleteDivision(DivisionMasterSid)
          .subscribe((resp: any) => {
            this.appSettingService.showSuccess('Deleted!');
            this.router.navigate(['master/division/list']);
            // this.loadDivisions();
            this.searchDivision();
          });
      }
    });
  }

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((res) => {
      this.companyList = res;
    });
  }

  loadCompanies() {
    this.masterService.getAllCompanies().subscribe((companies: any[]) => {
      this.companyMap = {};
      companies.forEach((c) => {
        this.companyMap[c.CompanyMasterSid] = c.companyName;
      });
    });
  }

  // resetPage(): void {
  //   this.filterValue = '';
  //   this.page = 1;
  //   this.divisions = [];
  //   this.divisionList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.searched = false;
  //   this.sortColumn = 'DivisionName';
  //   this.sortDirection = 'asc';
  //   this.loadDivisions();
  // }

  // report(): void {
  //   const formattedData = this.divisionList.map((item) => ({
  //     ...item,
  //     status: item.status === 'A' ? 'Active' : 'Suspended',
  //     CompanyName:
  //       this.companyMap[item.CompanyMasterSid] || item.CompanyMasterSid,
  //   }));

  //   // const companyName =
  //   //   this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ??
  //   //   'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'DivisionName', label: 'Division Name' },
  //       { key: 'DivisionCode', label: 'Division Code' },
  //       { key: 'CompanyName', label: 'Company' },
  //       { key: 'Remarks', label: 'Remarks' },
  //       { key: 'status', label: 'Status' },
  //     ],
  //     fileName: 'Division-Report',
  //     title: companyName,
  //   });
  // }

  showInfo() {
    if (!this.divisionData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.divisionData;
    modalRef.componentInstance.idLabel = 'Division Id';
    modalRef.componentInstance.idValue = this.divisionData?.DivisionMasterSid;
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
  //           centered: true,
  //         });
  //         modalRef.componentInstance.terms = this.TandCList;
  //         modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //         modalRef.componentInstance.DocumentSid = this.DivisionMasterSid;
  //       } else {
  //         this.appSettingService.showError(
  //           'Error loading Terms and Conditions'
  //         );
  //       }
  //     },
  //     (error) => {
  //       this.appSettingService.showError(
  //         'Error loading Terms and Conditions',
  //         error
  //       );
  //     }
  //   );
  // }
  openEmail() {
    if (!this.divisionData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
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
    modalRef.componentInstance.documentSid = this.DivisionMasterSid;
  }

  openEDoc() {
    if (!this.divisionData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.divisionData;
    modalRef.componentInstance.idLabel = 'Division Id';
    modalRef.componentInstance.idValue = this.divisionData?.DivisionMasterSid;
     const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.DivisionMasterSid
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
    modalRef.componentInstance.DocumentSid = this.DivisionMasterSid;
  }
   openFollowup() {
      if (!this.divisionData) return;
      const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
      modalRef.componentInstance.documentSid = this.divisionData?.UserMasterSid;
      modalRef.componentInstance.parentEmail = this.divisionData;
    //   modalRef.componentInstance.parentSubject = `Quotation No.${this.userData} Date:${new Date(this.userData).toLocaleDateString()}`;
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

  clearFilterValue() {
    this.filterValue = '';
  }

  private setDivisionFormInitialValue(): void {
    this.initialDivisionFormValue = this.divisionForm.getRawValue();
    this.isDivisionDirty = false;
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((v) => this.normalizeValue(v));
    if (typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc: any, key) => {
          acc[key] = this.normalizeValue(value[key]);
          return acc;
        }, {});
    }
    return value;
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(this.normalizeValue(obj1)) === JSON.stringify(this.normalizeValue(obj2));
  }

  canCloseDivisionModal(): boolean | Promise<boolean> {
    if (this.isDivisionSaving) return false;
    if (!this.isDivisionDirty) return true;

    const modalRef = this.modalService.open(UnsavedChangesDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    return modalRef.result
      .then((action: UnsavedChangesAction) => action === 'discard')
      .catch(() => false);
  }

  async closeDivisionModal(): Promise<void> {
    await this.closeModal();
  }
}
