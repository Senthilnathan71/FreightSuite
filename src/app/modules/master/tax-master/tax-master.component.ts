import { CommonModule } from '@angular/common';
import { Component, effect, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  NgbModal,
  NgbModalRef,
  NgbModalModule,
  NgbPagination,
  NgbDatepickerModule,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbCalendar,
  NgbDropdownModule,
} from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from 'src/app/modules/master/master.service';
import { forkJoin, take } from 'rxjs';
import { authService } from 'src/app/modules/authentication/auth.service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { MatDialog } from '@angular/material/dialog';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { ParseFlags } from '@angular/compiler';

import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { Observable } from 'rxjs';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { Country } from 'src/app/modules/crm-mobile/Interfaces/country.interface';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DocReferenceComponent } from '../../operation/doc-reference/doc-reference.component';
import { UnsavedChangesAction, UnsavedChangesDialogComponent } from 'src/app/shared/components/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { AuditLogComponent } from '../../operation/audit-log/audit-log.component';
@Component({
  selector: 'app-tax-group-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NgbPagination,
    NgbModalModule,
    FeatherModule,
    NgSelectModule,
    ListpageComponent,
    NgbDatepickerModule,
    FavoriteStarComponent,
    EmailEntryComponent,
    EdocComponent,
    TermsAndConditionsComponent,
    AuthorityEntryComponent,
    DetailsComponent,
    CustomDatePipe,
    NgxSpinnerModule,
    NgbDropdownModule,
    CommonPaginationComponent,
    ReusableTableComponent,
    PageHeaderComponent,
    SearchableDropdown
  ],

  templateUrl: './tax-master.component.html',
  
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    { provide: CustomDatePipe }
  ],
})
export class TaxMasterComponent extends BaseListComponent implements OnInit {
  @ViewChild('taxGroupTable') taxGroupTable!: ReusableTableComponent;
    @ViewChild('content') content: TemplateRef<any>;
  taxGroupForm!: FormGroup;
  isEditMode = false;
  modalRef!: NgbModalRef;
  TaxMasterSid!: number;
  results: any[] = [];
  taxGroupList: any[] = [];
  MenuMasterSid: any;
  // page = 1;
  // pageSize = 5;
  // totalLengthOfCollection = 0;
  errorMessage = '';
  // searchPerformed = false;
  searchType = 'TaxName';
  // filterValue = '';
  // sortColumn: string = 'TaxName';
  // sortDirection: string = 'asc';
  selectedId!: number;
  isFavorite = false;
  taxGroupData: any;
  userData: any;
  TandCList: any;
  currentMenuId: number;
  today = this.calendar.getToday();
  minDate = this.today;
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  searched = false;
  loading = true;
  permissions: string[] = [];
	currentMenuPermissions: any = {};
  countryResults: Country[];
  taxCodeOptions = [
  { id: 1, name: 'CGST' },
  { id: 2, name: 'SGST' },
  { id: 3, name: 'IGST' },
  { id: 4, name: 'UGST' },
  { id: 5, name: 'VAT' }
];
  // Company
  currentCompany: any;
  currentBranch: any;
  tableConfig: TableConfig;
  taxGroupResults: any[] = [];
  isTaxMasterDirty: boolean = false;
  isTaxMasterSaving: boolean = false;
  private initialTaxMasterFormValue: any = null;
  taxCategoryOptions = [
    { id: 1, name: 'Inter' },
    { id: 2, name: 'Intra' }
  ];

  // Table configuration
 
  headerActions: HeaderAction[] = [];
  tableLoading = false;
  protected config: ListComponentConfig = {
    storageKey: 'Tax-group-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'TaxName',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  get allTaxGroup() { return this.allItems; }
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private router: Router,
    private userService: authService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService,
    private calendar: NgbCalendar,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe,
     public dropdownStore: DropdownStore,
     public mps : MenuPermissionService,
  ) {
    super(paginationService);
      effect(() => {
      const countryData = this.dropdownStore.countries();
      this.countryResults = countryData;
    });
  }
 countryLookupConfig = DROPDOWN_CONFIGS.COUNTRY;
  modeofTaxType = [
    { id: 1, name: 'Input' },
    { id: 2, name: 'Output' },
  ];

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid = sessionStorage.getItem('currentMenuId');
    this.initForm();
    // this.loadTaxGroups();
    super.ngOnInit();
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });
   
    this.loadAllFields();
  }

   

	

	hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }


  

  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.masterService.searchTaxGroup(this.getSearchParams());
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
      EffectiveFrom: this.datePipe.transform(item?.EffectiveFrom),
      // Ensure countryName is available
      countryName: item.countryMaster?.countryName || item.countryName || 'N/A',
      // Ensure TaxGroupName is available
      taxGroupName : item.taxGroup?.TaxGroup && item.taxGroup?.TaxRate ? `${item.taxGroup.TaxGroup}${item.taxGroup.TaxRate}` : ""
    }));
    this.totalLengthOfCollection = response.data.totalCount || 0;
    this.applySorting();
    this.updateHeaderActionState();
  } else {
    this.appSettingService.showError('Error fetching Tax-group.');
    this.allItems = [];
    this.totalLengthOfCollection = 0;
  }
}

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error fetching Tax-group.');
    console.error('Error fetching Tax-group', error);
    super.handleSearchError(error);
  }


  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchTaxGroup();
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
        // condition: this.hasPermission('Add')
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

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'report') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 };
      }
      return action;
    });
  }
  searchTaxGroup() {
    this.page = 1;
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  updatePaginationData(): void {
    this.search();
  }

  override trackBy(index: number, item: any): number {
    return item.TaxMasterSid || index;
  }


  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig = {
    columns: [
      {
        key: 'taxGroupName',
        label: 'Tax Group',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'TaxName',
        label: 'Tax Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
      {
        key: 'TaxCode',
        label: 'Tax Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'TaxType',
        label: 'Tax Type',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'EffectiveFrom',
        label: 'Effective From',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
       {
        key: 'TaxCategory',
        label: 'Type',
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
        key: 'countryName',
        label: 'Country',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'InvoiceType',
        label: 'Invoice Type',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },

    ],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View',
         state : !this.mps.can('view')
        // condition: (row: any) => this.hasPermission('View')

      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'TaxMasterSid',
    emptyMessage: 'No tax-group found',
    dragAndDrop: true
  };
  }

  // Table event handlers
onTableActionClick(event: TableEventData): void {
  if (event.action === 'view') {
      this.viewTax(this.content, event.row);
  }
}

viewTax(content: any, row: any) {
  this.openEditModal(content, row.TaxMasterSid);
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
  const formattedData = this.allTaxGroup.map(item => ({
    ...item,
    TaxGroup: item.TaxGroupName, // Use the formatted Tax Group name
    Country: item.CountryName    // Use the country name
  }));
  
  const companyName = this.currentCompany?.companyName ?? 'Company';

  // Get visible columns in their current order from the table component
  const visibleColumns = this.taxGroupTable.getVisibleColumns();
  const dynamicHeaders = visibleColumns.map(column => ({
    key: column.key,
    label: column.label
  }));

  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: dynamicHeaders,
    fileName: 'Tax-Group-Report',
    title: companyName
  });
}
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  invoiceTypeOptions = [{ id: 'RCM', name: 'RCM' }];

  initForm(): void {
    this.taxGroupForm = this.fb.group({
       TaxGroupSid: ['', Validators.required],
      TaxName: ['', Validators.required],
      TaxCode: ['', Validators.required],
      TaxType: [null, Validators.required],
      TaxCategory: [null, Validators.required],
      EffectiveFrom: ['', Validators.required],
      TaxRate: [null, [Validators.required, Validators.min(0)]],
      TaxExempt: [false],
      CountryMasterSid: ['', Validators.required],
      InvoiceType: [null],
    });

    this.taxGroupForm.valueChanges.subscribe(() => {
      if (!this.initialTaxMasterFormValue) return;
      this.isTaxMasterDirty = !this.deepEqual(
        this.initialTaxMasterFormValue,
        this.taxGroupForm.getRawValue()
      );
    });
  }

  

  resetForm(): void {
    // If editing an existing tax group, reload it (restore original state)
    if (this.isEditMode && this.selectedId) {
      this.masterService
        .fetchTaxById(this.selectedId)
        .pipe(take(1))
        .subscribe({
          next: (taxGroup: any) => {
            this.taxGroupData = taxGroup;
            this.patchTaxForm(taxGroup);
          },
          error: () => {
            this.appSettingService.showError('Error reloading tax group data.');
          },
        });
      return;
    }

    // Create-mode: reset form to sensible defaults
    this.taxGroupForm.reset({
      TaxName: '',
      TaxCode: '',
      TaxType: null,
      EffectiveFrom: '',
      TaxRate: null,
      TaxExempt: false,
      Remarks: '',
      InvoiceType: null,
    });

    // Reset date to today for new entries
    this.minDate = this.calendar.getToday();

    // Clear component state
    this.taxGroupData = null;
    this.selectedId = null;
    this.TaxMasterSid = null;
  }

  private formatDateForExport(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  openModal(content: any): void {
    this.resetForm();
    this.isEditMode = false;
    this.setTaxMasterFormInitialValue();
    this.modalRef = this.modalService.open(content, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      beforeDismiss: () => this.canCloseTaxMasterModal()
    });
  }

  openEditModal(content: any, id: number): void {
    this.isEditMode = true;
    this.selectedId = id;
    this.TaxMasterSid = id;
    this.taxGroupForm.reset({
      TaxGroupSid: '',
      TaxName: '',
      TaxCode: '',
      TaxType: null,
      TaxCategory: null,
      EffectiveFrom: '',
      TaxRate: null,
      TaxExempt: false,
      CountryMasterSid: '',
      InvoiceType: null,
    });

    this.masterService
      .fetchTaxById(id)
      .pipe(take(1))
      .subscribe({
        next: (taxGroup: any) => {
          this.taxGroupData = taxGroup;
          this.patchTaxForm(taxGroup);
          this.setTaxMasterFormInitialValue();

          this.modalRef = this.modalService.open(content, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
            beforeDismiss: () => this.canCloseTaxMasterModal()
          });
        },
        error: () => {
          this.appSettingService.showError('Error loading data for editing.');
        },
      });
  }

  private patchTaxForm(taxGroup: any): void {
    this.taxGroupForm.patchValue({
      TaxGroupSid: taxGroup.TaxGroupSid ?? taxGroup.taxGroup?.TaxGroupSid ?? '',
      TaxName: taxGroup.TaxName ?? '',
      TaxCode: taxGroup.TaxCode ?? null,
      TaxType: taxGroup.TaxType ?? null,
      TaxCategory: taxGroup.TaxCategory ?? null,
      EffectiveFrom: taxGroup.EffectiveFrom ? new Date(taxGroup.EffectiveFrom) : '',
      TaxRate: taxGroup.TaxRate ?? null,
      TaxExempt: taxGroup.TaxExempt === 'Y' || taxGroup.TaxExempt === true,
      CountryMasterSid: taxGroup.CountryMasterSid ?? taxGroup.countryMaster?.CountryMasterSid ?? '',
      InvoiceType: taxGroup.InvoiceType || null,
    });
  }

  onSubmit(): void {
    if (this.isTaxMasterSaving) return;
    if (this.taxGroupForm.get('Status')?.disabled) {
      this.taxGroupForm.get('Status')?.enable();
    }
    if (this.taxGroupForm.invalid) {
      this.taxGroupForm.markAllAsTouched();
      this.taxGroupForm.updateValueAndValidity();
      this.appSettingService.showWarning(
        'Please fill all required fields correctly.'
      );
      return;
    }
    if (!this.isTaxMasterDirty) {
      this.appSettingService.showWarning('No changes to save.');
      return;
    }

    this.isTaxMasterSaving = true;

    const formValue = this.taxGroupForm.value;
    const CreatedBy = {
      CreatedBy: this.appSettingService.userSettingSource.value['userEmail'],
    };
    const UpdatedBy = {
      UpdatedBy: this.appSettingService.userSettingSource.value['userEmail'],
    };

    const payload = this.isEditMode
      ? {
        ...formValue,
        TaxRate: parseFloat(formValue.TaxRate),
        TaxExempt: formValue.TaxExempt ? 'Y' : 'N',
        ...UpdatedBy,
      }
      : {
        ...formValue,
        TaxRate: parseFloat(formValue.TaxRate),
        TaxExempt: formValue.TaxExempt ? 'Y' : 'N',
        ...CreatedBy,
      };

    console.log('payload', payload);

    if (this.isEditMode) {
      this.masterService.updateTaxById(this.selectedId, payload).subscribe(
        (res: any) => {
          if (res.status) {
            this.appSettingService.showSuccess(res.message);
            this.setTaxMasterFormInitialValue();
            this.closeModal();
            this.searchTaxGroup();
          } else {
            this.appSettingService.showError(res.message);
          }
          this.isTaxMasterSaving = false;
        },
        (error) => {
          this.isTaxMasterSaving = false;
          this.errorMessage = error.message;
          console.error('Update failed:', error);
        }
      );
    } else {
      this.masterService.createNewTax(payload).subscribe(
        (res: any) => {
          if (res.status) {
            this.appSettingService.showSuccess(res.message);
            this.setTaxMasterFormInitialValue();
            this.closeModal();
            this.searchTaxGroup();
          } else {
            this.appSettingService.showError(res.message);
          }
          this.isTaxMasterSaving = false;
        },
        (error) => {
          this.isTaxMasterSaving = false;
          this.errorMessage = error.message;
          console.error('Creation failed:', error);
        }
      );
    }
  }

    loadAllFields() {
    forkJoin({
      countries: this.dropdownStore.loadCountries(),
      taxGroups: this.masterService.getAllTaxGroup() // Load tax groups
    }).subscribe(({ countries, taxGroups }) => {
      // this.countryResults = countries;
      this.countryResults =(countries || []).map(c => ({...c,Country : c.countryMaster?.countryName}));
      this.taxGroupResults = (taxGroups.data || []).map(t => ({...t,TaxGroup : t.TaxGroup}));
      // this.taxGroupResults = taxGroups.data || []; // Assuming the API returns { data: [] }
    });
  }

  

  trackByIndex(index: number): number {
    return index;
  }
 

  closeModal(): void {
    if (this.modalRef && typeof this.modalRef.close === 'function') {
      this.modalRef.close();
    }
  }

  private setTaxMasterFormInitialValue(): void {
    this.initialTaxMasterFormValue = this.taxGroupForm.getRawValue();
    this.isTaxMasterDirty = false;
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

  canCloseTaxMasterModal(): boolean | Promise<boolean> {
    if (this.isTaxMasterSaving) return false;
    if (!this.isTaxMasterDirty) return true;

    const modalRef = this.modalService.open(UnsavedChangesDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    return modalRef.result
      .then((action: UnsavedChangesAction) => action === 'discard')
      .catch(() => false);
  }



  

  showInfo() {
    if (!this.taxGroupData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.taxGroupData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.taxGroupData?.TaxMasterSid;
  }

  // openTandC() {
  //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //   const payload = { MenuMasterSid: this.currentMenuId };
  //   this.masterService.getTandCByCondition(payload).subscribe(
  //     (resp: any) => {
  //       if (resp.Status) {
  //         this.TandCList = resp.data;
  //         const modalRef = this.modalService.open(TermsAndConditionsComponent, {
  //           size: 'lg',
  //           backdrop: 'static',
  //           centered: true,
  //         });
  //         modalRef.componentInstance.terms = this.TandCList;
  //         modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //         modalRef.componentInstance.DocumentSid = this.TaxMasterSid;
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
    if (!this.taxGroupData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.taxGroupData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.taxGroupData?.TaxMasterSid;
  }

  openAuthority() {
    if (!this.taxGroupData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.taxGroupData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.taxGroupData?.TaxMasterSid;
  }

  openEDoc() {
    if (!this.taxGroupData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.taxGroupData;
    modalRef.componentInstance.idLabel = 'Cost-Center Id';
    modalRef.componentInstance.idValue = this.taxGroupData?.TaxMasterSid;
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
    modalRef.componentInstance.DocumentSid = this.taxGroupData?.TaxMasterSid;
  }

  openAuditLogs() {
        if (!this.taxGroupData?.TaxMasterSid) return;
        const modalRef = this.modalService.open(AuditLogComponent, {
          centered: true,
          scrollable: true,
          size: 'xl',
          windowClass: 'audit-log-modal'
        });
        modalRef.componentInstance.title = 'Tax Logs';
        modalRef.componentInstance.tableName = 'TaxMaster';
        modalRef.componentInstance.recordId = this.taxGroupData?.TaxMasterSid.toString();
        modalRef.componentInstance.screenName = 'Tax';
      }
}
