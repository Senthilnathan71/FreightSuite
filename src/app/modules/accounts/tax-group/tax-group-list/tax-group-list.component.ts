import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { take } from 'rxjs';
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
import { CustomDatePipe } from "../../../../core/pipes/custom-date-format.pipe";
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { Observable } from 'rxjs';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
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
  ],

  templateUrl: './tax-group-list.component.html',
  styleUrl: './tax-group-list.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    { provide: CustomDatePipe }
  ],
})
export class TaxGroupListComponent extends BaseListComponent implements OnInit {
  @ViewChild('taxGroupTable') taxGroupTable!: ReusableTableComponent;
    @ViewChild('content') content: TemplateRef<any>;
  taxGroupForm!: FormGroup;
  isEditMode = false;
  modalRef!: NgbModalRef;
  TaxMasterSid!: number;
  results: any[] = [];
  taxGroupList: any[] = [];
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

  // Company
  currentCompany: any;
  currentBranch: any;

  // Table configuration
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View',
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
    private datePipe: CustomDatePipe
  ) {
    super(paginationService);
  }

  modeofTaxType = [
    { id: 1, name: 'Input' },
    { id: 2, name: 'Output' },
  ];

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.initForm();
    this.taxGroupForm.valueChanges.subscribe(() => { });
    // this.loadTaxGroups();
    super.ngOnInit();
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.checkPermissions();
  }

    checkPermissions() {
		const currentMenuId = Number(localStorage.getItem('currentMenuId'));
		const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
		if (currentMenuId && userRole) {
			this.masterService
				.getRoleMenuPermissions(currentMenuId, userRole)
				.subscribe({
					next: (response) => {
						this.currentMenuPermissions = response.data.MenuPermissions || {};
						this.permissions = Object.keys(this.currentMenuPermissions).filter(
							(key) => this.currentMenuPermissions[key] === 'isTrue'
						);
					},
				});
		}
	}

	//  checks for menu permission
	hasPermission(permission: string): boolean {
		return this.permissions.includes(permission);
	}

	hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }


  // loadTaxGroups(): void {
  //   this.spinner.show();
  //   this.loading = true;

  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection
  //   };

  //   this.masterService.searchTaxGroup(params).subscribe({
  //     next: (response) => {
  //       if (response.status) {
  //         this.taxGroupList = response.data.items;
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searchPerformed = true;
  //         this.searched = true;
  //       }else {
  //       this.appSettingService.showError(response.message);
  //     }
  //       this.spinner.hide();
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error fetching tax groups:', err);
  //       this.taxGroupList = [];
  //       this.totalLengthOfCollection = 0;
  //       this.loading = false;
  //     }
  //   });
  // }

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
        EffectiveFrom: this.datePipe.transform(item?.EffectiveFrom)
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
    this.tableConfig.columns = [

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
        key: 'TaxRate',
        label: 'Tax Rate',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'Remarks',
        label: 'Tax Reason',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      // {
      //   key: 'status',
      //   label: 'Status',
      //   sortable: true,
      //   filterable: true,
      //   visible: true,
      //   template: 'status',
      //   width: '100px',
      //   dataType: 'string',
      //   cellClass: 'status-column'
      // }
    ];
  }

  // Table event handlers
onTableActionClick(event: TableEventData): void {
  if (event.action === 'view') {
      this.viewTax(this.content, event.row);
  }
}

viewTax(content: any, row: any) {
  this.TaxMasterSid = row.TaxMasterSid; // store the id if needed
  this.openModal(content);
  // If you need to prefill form with row data:
  this.isEditMode = true;
  this.selectedId = row.TaxMasterSid;
  this.taxGroupForm.patchValue({
    TaxName: row.TaxName,
    TaxCode: row.TaxCode,
    TaxType: row.TaxType,
    EffectiveFrom: new Date(row.EffectiveFrom),
    TaxRate: row.TaxRate,
    TaxExempt: row.TaxExempt === 'Y',
    Remarks: row.Remarks,
  });
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
    const formattedData = this.allTaxGroup;
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

  initForm(): void {
    this.taxGroupForm = this.fb.group({
      TaxName: ['', Validators.required],
      TaxCode: ['', Validators.required],
      TaxType: [null, Validators.required],
      EffectiveFrom: ['', Validators.required],
      TaxRate: [null, Validators.required],
      TaxExempt: [false],
      Remarks: [''],
    });
  }

  // resetForm(): void {
  //   this.taxGroupForm.reset();
  // }

  resetForm(): void {
    // If editing an existing tax group, reload it (restore original state)
    if (this.isEditMode && this.selectedId) {
      this.masterService
        .fetchTaxById(this.selectedId)
        .pipe(take(1))
        .subscribe({
          next: (taxGroup: any) => {
            this.taxGroupData = taxGroup;
            this.taxGroupForm.patchValue({
              TaxName: taxGroup.TaxName,
              TaxCode: taxGroup.TaxCode,
              TaxType: taxGroup.TaxType,
              EffectiveFrom: new Date(taxGroup.EffectiveFrom),
              TaxRate: taxGroup.TaxRate,
              TaxExempt: taxGroup.TaxExempt === 'Y' ? true : false,
              Remarks: taxGroup.Remarks,
            });
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
      Remarks: ''
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
    this.modalRef = this.modalService.open(content, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    });
  }

  openEditModal(content: any, id: number): void {
    this.isEditMode = true;

    this.masterService
      .fetchTaxById(this.TaxMasterSid)
      .pipe(take(1))
      .subscribe({
        next: (taxGroup: any) => {
          this.taxGroupData = taxGroup;

          this.taxGroupForm.patchValue({
            TaxName: taxGroup.TaxName,
            TaxCode: taxGroup.TaxCode,
            TaxType: taxGroup.TaxType,
            EffectiveFrom: new Date(taxGroup.EffectiveFrom),
            TaxRate: taxGroup.TaxRate,
            TaxExempt: taxGroup.TaxExempt === 'Y' ? true : false,
            Remarks: taxGroup.Remarks,
          });

          this.modalRef = this.modalService.open(content, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
          });
        },
        error: () => {
          this.appSettingService.showError('Error loading data for editing.');
        },
      });
  }

  onSubmit(): void {
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
            this.closeModal();
          } else {
            this.appSettingService.showError(res.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Update failed:', error);
        }
      );
    } else {
      this.masterService.createNewTax(payload).subscribe(
        (res: any) => {
          if (res.status) {
            this.appSettingService.showSuccess(res.message);
            this.closeModal();
          } else {
            this.appSettingService.showError(res.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Creation failed:', error);
        }
      );
    }
  }

  // loadTaxGroups(): void {
  //   this.masterService.getAllTax().subscribe({
  //     next: (res: any) => {
  //       this.results = res.data;
  //       console.log(this.results);

  //       this.searchPerformed = true;
  //       if (this.results.length > 0) {
  //         this.applySorting();
  //         this.updatePaginationData();
  //         this.totalLengthOfCollection = this.results.length;
  //       } else {
  //         this.taxGroupList = [];
  //         this.totalLengthOfCollection = 0;
  //       }
  //     },
  //     error: () =>
  //       this.appSettingService.showError('Error fetching Tax Groups'),
  //   });
  // }

  // sort(column: string): void {
  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.loadTaxGroups();
  // }

  // applySorting(): void {
  //   this.taxGroupList.sort((a, b) => {
  //     let valA = (a[this.sortColumn] || '').toString().toLowerCase();
  //     let valB = (b[this.sortColumn] || '').toString().toLowerCase();
  //     return this.sortDirection === 'asc'
  //       ? valA.localeCompare(valB)
  //       : valB.localeCompare(valA);
  //   });
  // }

  // updatePaginationData(): void {
  //   const start = (this.page - 1) * this.pageSize;
  //   const end = start + this.pageSize;
  //   this.loadTaxGroups();
  // }

  trackByIndex(index: number): number {
    return index;
  }
  // clearFilterValue() {
  //   this.filterValue = '';
  //   this.loadTaxGroups();
  // }

  // softDeleteTaxGroup(id: number): void {
  //   const dialogRef = this.dialog.open(DeleteWarningComponent);
  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result === true) {
  //       this.masterService.deleteTax(id).subscribe((resp: any) => {
  //         this.appSettingService.showSuccess('Deleted!');
  //         this.router.navigate(['accounts/tax-group/list']);

  //       });
  //     }
  //   });
  // }

  closeModal(): void {
    if (this.modalRef && typeof this.modalRef.close === 'function') {
      this.modalRef.close();
    }
  }



  // resetPage(): void {
  //   this.taxGroupList = [];
  //   this.results = [];
  //   this.searchPerformed = false;
  //   this.filterValue = '';
  //   this.searchType = 'TaxName';
  //   this.page = 1;
  //   this.sortColumn = 'TaxName';
  //   this.sortDirection = 'asc';
  //   this.loadTaxGroups();
  // }

  // report(): void {
  //   const formattedData = this.taxGroupList.map((item) => ({
  //     ...item,
  //     Status: item.Status === 'A' ? 'Active' : 'Suspended',
  //     EffectiveFrom: this.formatDateForExport(item.EffectiveFrom),
  //   }));
  //   // const companyName =
  //   //   this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ??
  //   //   'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'TaxName', label: 'Tax Name' },
  //       { key: 'TaxCode', label: 'Tax Code' },
  //       { key: 'TaxType', label: 'Tax Type' },
  //       { key: 'EffectiveFrom', label: 'Effective From' },
  //       { key: 'TaxRate', label: 'Tax Rate' },
  //       { key: 'Remarks', label: 'Tax Reason' },
  //     ],
  //     fileName: 'Tax-Report',
  //     title: companyName,
  //   });
  // }

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
            centered: true,
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.TaxMasterSid;
        } else {
          this.appSettingService.showError(
            'Error loading Terms and Conditions'
          );
        }
      },
      (error) => {
        this.appSettingService.showError(
          'Error loading Terms and Conditions',
          error
        );
      }
    );
  }
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
}
