import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, } from '@angular/forms';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbPagination, } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { HSSAC } from 'src/app/modules/crm-mobile/Interfaces/hs-sac.interfaces';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { Observable, take } from 'rxjs';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';

import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';

import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
@Component({
  selector: 'app-hs-sac',
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
    OnlyTextDirective,
    TextWithNumbersDirective,
    CustomDatePipe,
    NgbDatepickerModule,
    DatePipe,
    ListpageComponent,
    PreventMultiClickDirective,
    FavoriteStarComponent,
    NgxSpinnerModule,
    NgbDropdownModule,
    CommonPaginationComponent,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent
  ],
  templateUrl: './hs-sac.component.html',
  styleUrl: './hs-sac.component.scss',
  providers: [
    CustomDatePipe,
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class HSSACComponent extends BaseListComponent implements OnInit {
  @ViewChild('hasacTable') hasacTable!: ReusableTableComponent;
  @ViewChild('content') content: TemplateRef<any>
  hssacForm!: FormGroup;
  isEditMode: boolean = false;
  hssacs: HSSAC[] = [];
  results: any[] = [];
  HSSACMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  hssacList: any[] = [];
  statusList = ["Active", "Suspended"]
  taxList: any[] = [];
  modalRef!: NgbModalRef;
  searchType = 'HSSACCode';
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month, this.today.day);
  hssacData: any;
  MenuMasterSid: any;
  currentMenuId: number;
  TandCList: any;
  isLogLoading: boolean = false;

  loading = true;
  // Alias for compatibility with existing template
  tableConfig:TableConfig;
  private initializeTableConfig() {
  this.tableConfig = {
    columns: [
         {
        key: 'HSSACCode',
        label: 'HS-SAC Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: "130px"
      },
      {
        key: 'HSSACName',
        label: 'HS-SAC Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ServiceName',
        label: 'Service Name',
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
        dataType: 'string',
        width: "120px"
      },
      {
        key: 'TaxType',
        label: ' Tax Type',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',

        width: "120px"
      },
      {
        key: 'EffectiveFrom',
        label: 'Effective From',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width: "150px"
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
    trackByKey: 'HSSACMasterSid',
    emptyMessage: 'No Ha-sac found',
    dragAndDrop: true
  }
};

  tableLoading = false;
  protected config: ListComponentConfig = {
    storageKey: 'hssac-type-state',
    defaultPageSize: 10,
    defaultSortColumn: 'HSSACCode',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get hssacLists() { return this.allItems; }
  isFavorite: boolean = false;
  // Company
  currentCompany: any;
  currentBranch: any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private calendar: NgbCalendar,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe,
    private commonService: CommonService,
    public mps : MenuPermissionService,
      private ngbModal: NgbModal,
  ) {
    super(paginationService);
  }


  override ngOnInit(): void {
    // this.loadHssac()
    this.initForm();
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //     
    //     }
    //   }
    // )
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      
    }
    this.route.paramMap.subscribe(params => {
      this.HSSACMasterSid = +params.get('id');
      if (this.HSSACMasterSid) {
        this.isEditMode = true;
        this.loadHssacData(this.HSSACMasterSid);
      }
    });
    super.ngOnInit();
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.initializeModalDropdownItems();
    this.loadTaxData();
    this.mps.init().subscribe(() => {
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });
  }
  // In the component class
// In the component class
loadTaxData(): void {
  this.masterService.getAllTaxGroup().subscribe({
    next: (response: any) => {
      console.log('Complete API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response));
      
      // Handle different possible response structures
      if (Array.isArray(response)) {
        // If response is directly an array
        this.taxList = response;
      } else if (response && Array.isArray(response.data)) {
        // If response has data property containing array
        this.taxList = response.data;
      } else if (response && response.data && Array.isArray(response.data.items)) {
        // If response has data.items structure (common in paginated APIs)
        this.taxList = response.data.items;
      } else {
        console.warn('Unexpected response structure:', response);
        this.taxList = [];
      }
      
      console.log('Processed taxList:', this.taxList);
      console.log('Tax list length:', this.taxList.length);
      
      if (this.taxList.length > 0) {
        console.log('First tax item:', this.taxList[0]);
        console.log('Available properties in first item:', Object.keys(this.taxList[0]));
      }
    },
    error: (error) => {
      console.error('Error loading tax data:', error);
      console.error('Error details:', error.error);
      this.appSettingService.showError('Failed to load tax data');
    }
  });
}

// Update the tax type change handler
onTaxTypeChange(selectedTaxGroup: string): void {
  if (selectedTaxGroup) {
    // Find the selected tax object from the taxList using TaxGroup
    const selectedTax = this.taxList.find(tax => tax.TaxGroup === selectedTaxGroup);

    if (selectedTax) {
      // Auto-fill the TaxRate field with the selected tax's rate
      this.hssacForm.patchValue({
        TaxRate: selectedTax.TaxRate,
        TaxGroupSid: selectedTax.TaxGroupSid,
      });
    }
  } else {
    // Clear TaxRate if no tax type is selected
    this.hssacForm.patchValue({
      TaxRate: '',
      TaxGroupSid: '',
    });
  }
}



hasAnyDropdownPermission(): boolean {
  const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
  return dropdownButtons.some((btn) => this.permissions?.includes(btn));
}

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.masterService.searchHssac(this.getSearchParams());
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
      this.allItems = response.data.items.map(item => ({
        ...item,
        status: item.status === 'A' ? 'Active' : 'Suspended',
        EffectiveFrom: this.datePipe.transform(item?.EffectiveFrom)
      }))
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching HS-SAC codes.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error searching HS-SAC codes.');
    console.error('Error searching HS-SAC codes', error);
    super.handleSearchError(error);
  }

  // Legacy method for template compatibility
  loadHssacs() {
    this.page = 1;
    this.search();
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadHssacs();
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
        // condition: this.hasPermission('Edoc')
      },
      {
        label: 'Terms & Condition',
        icon: 'fas fa-clipboard',
        action: 'terms',
        // condition: this.hasPermission('Terms and Condition')
      },
      {
        label: 'Authorize',
        icon: 'fas fa-shield-alt',
        action: 'authority',
        // condition: this.hasPermission('Authority')
      },
      {
        label: 'Email',
        icon: 'fas fa-envelope',
        action: 'email',
        // condition: this.hasPermission('Email')
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

  // Legacy method for template compatibility
  clearFilterValue() {
    this.clearFilter();
  }


  initForm() {
    this.hssacForm = this.fb.group({
      HSSACCode: ['', [Validators.required]],
      HSSACName: ['', [Validators.required]],
      ServiceName: ['', [Validators.required]],
      TaxRate: ['Default', [Validators.required]],
      TaxType: ['', [Validators.required]],
      TaxGroupSid: ['', [Validators.required]],
      EffectiveFrom: ['', [Validators.required]],
      Remarks: [''],
      status: [{ value: 'Active', disabled: false }, Validators.required],
    });
    this.hssacForm.get('TaxType').valueChanges.subscribe(value => {
      this.onTaxTypeChange(value);
    });
  }


  override trackBy(index: number, item: any): number {
    return item.HSSACMasterSid || index;
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewHasac(event.row, this.content);
    } else if (event.action === 'delete') {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row) {
    this.softDeleteHssac(row.HSSACMasterSid)
  }
  viewHasac(item: any, content: TemplateRef<any>) {
  this.editHssac(item.HSSACMasterSid, content);
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
    const formattedData = this.hssacLists;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.hasacTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Ha-sac-Report',
      title: companyName
    });
  }


  resetForm(): void {
    // If editing an existing HSSAC, reload it (restore original state)
    if (this.isEditMode && this.HSSACMasterSid) {
      this.loadHssacData(this.HSSACMasterSid);
      return;
    }

    // Create-mode: reset form to initial state with proper default values
    this.hssacForm.reset({
      HSSACCode: null,
      HSSACName: null,
      ServiceName: null,
      TaxRate: 'Default',
      TaxType: null,
      EffectiveFrom: null,
      Remarks: null,
      status: 'Active'
    });

    // Re-enable the status field if it was disabled
    this.hssacForm.get('status')?.enable();

    // Reset validation state
    this.hssacForm.markAsUntouched();
    this.hssacForm.markAsPristine();

    // Clear any stored data
    this.hssacData = null;
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  openEditModal(content: any, id: number): void {
    this.isEditMode = true;
    this.HSSACMasterSid = id;
    this.getHssacById(id).add(() => {
      this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
    });
  }

editHssac(id: number, content: TemplateRef<any>) {
  // 1. STATE SETUP
  this.isEditMode = true;
  this.HSSACMasterSid = id;
  this.hssacForm.reset();

  // 2. LOCK UI (Optimistic Open)
  this.modalRef = this.modalService.open(content, { 
    centered: true, 
    size: 'lg', 
    backdrop: 'static',
    keyboard: false 
  });

  // 3. DISABLE FORM
  this.hssacForm.disable();

  // 4. FETCH DATA
  this.masterService.getHssacById(id).pipe(take(1)).subscribe({
    next: (response: any) => {
      // Robust Data Extraction: Handle 'response.data' or direct 'response'
      const data = response?.data || response;

      if (!data) {
        throw new Error('Data payload missing');
      }

      this.hssacData = data;
      
      this.hssacForm.patchValue({
        HSSACCode: data.HSSACCode,
        HSSACName: data.HSSACName,
        ServiceName: data.ServiceName,
        TaxRate: data.TaxRate,
        TaxType: data.TaxType,
        // Safe Date Parsing: Ensure date is valid before creating object
        EffectiveFrom: data.EffectiveFrom ? new Date(data.EffectiveFrom) : null,
        Remarks: data.Remarks || '', 
        status: data.status === 'A' ? 'Active' : 'Suspended'
      });

      // 5. UNLOCK UI
      this.hssacForm.enable();
    },
    error: (err) => {
      // 6. ROLLBACK
      this.closeModal(); 
      console.error('Error fetching HSSAC:', err);
      this.appSettingService.showError('Unable to load data. Please try again.');
    }
  });
}





  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  getHssacById(id: number) {
    this.resetForm();
    return this.masterService.getHssacById(id).pipe(take(1)).subscribe(
      (hssac: any) => {
        console.log('HSSAC from backend:', hssac);
        this.hssacForm.patchValue({
          HSSACCode: hssac.HSSACCode,
          HSSACName: hssac.HSSACName,
          ServiceName: hssac.ServiceName,
          TaxRate: hssac.TaxRate,
          TaxType: hssac.TaxType,
          EffectiveFrom: hssac.EffectiveFrom,
          Remarks: hssac.Remarks,
          status: hssac.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading');
      }
    );
  }

  onSubmit() {
    if (this.btnDisable) return;
    if (this.hssacForm.get('status')?.disabled) {
      this.hssacForm.get('status')?.enable();
    }
    if (this.hssacForm.invalid) {
      this.hssacForm.markAllAsTouched();
      this.hssacForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      this.btnDisable = true;
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.hssacForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...updatedBy,
        EffectiveFrom: new Date(formValue.EffectiveFrom),
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
        TaxGroupSid: formValue.TaxGroupSid,
      } : {
        ...formValue,
        ...createdBy,
        EffectiveFrom: new Date(formValue.EffectiveFrom),
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
        TaxGroupSid: formValue.TaxGroupSid,
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.editHssac(this.HSSACMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message|| 'Saved Successfully!');
              this.closeModal();
              this.router.navigate(['master/hs-sac']);
              this.loadHssacs()
            } else {
              this.appSettingService.showError(resp.message);
            }
            this.btnDisable = false;
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
            this.btnDisable = false;
          }
        );
      } else {
        this.masterService.createHssac(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/hs-sac']);
              this.loadHssacs()
            } else {
              this.appSettingService.showError(resp.message);
            }
            this.btnDisable = false;
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
            this.btnDisable = false;
          }
        );
      }
    }
  }

  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended'
  };

  loadHssacData(id: number) {
    this.masterService.getHssacById(id).subscribe(
      (data) => {
        this.hssacForm.patchValue({
          ...data,
          status: data.status === 'A' ? 'Active' : 'Suspended'
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }


  trackByIndex(index: number, item: any): number {
    return index;
  }

  softDeleteHssac(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.softDeleteHssac(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.router.navigate(['master/hs-sac']);
          this.loadHssacs();
        });
      }
    });
  }



  showInfo() {
    if (!this.hssacData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.hssacData;
    modalRef.componentInstance.idLabel = 'HSSAC Id';
    modalRef.componentInstance.idValue = this.hssacData?.HSSACMasterSid;
  }

  openTandC() {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
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
          modalRef.componentInstance.DocumentSid = this.HSSACMasterSid;

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
    if (!this.hssacData) return;
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
    modalRef.componentInstance.documentSid = this.HSSACMasterSid;
  }

  openEDoc() {
    if (!this.hssacData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.hssacData;
    modalRef.componentInstance.idLabel = 'HSSAC Id';
    modalRef.componentInstance.idValue = this.hssacData?.HSSACMasterSid;
     const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.HSSACMasterSid
  }

      this.commonService.documentData.set(data)
  }

   openFollowup() {
      if (!this.hssacData) return;
      const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
      modalRef.componentInstance.documentSid = this.hssacData?.QuoteHeaderSid;
      modalRef.componentInstance.parentEmail = this.hssacData.Email;
      modalRef.componentInstance.parentSubject = `Quotation No.${this.hssacData.QuoteNumber} Date:${new Date(this.hssacData.QuoteDate).toLocaleDateString()}`;
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

  //  openAuditLogs(modal: TemplateRef<any>) {
  //   if (!this.HSSACMasterSid) return;

  //   this.masterService.getAuditLogs('HSSACMaster', this.HSSACMasterSid.toString()).subscribe({
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
    if (!this.HSSACMasterSid) return;
    if (this.isLogLoading) return; 
    this.isLogLoading = true;

    this.masterService.getAuditLogs(
      'HSSACMaster',
      this.HSSACMasterSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        this.isLogLoading = false;
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
      error: err => {
        this.isLogLoading = false;
        console.error('Error fetching audit logs:', err)
      }
    });
  }
}
