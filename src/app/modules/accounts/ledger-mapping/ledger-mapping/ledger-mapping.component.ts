import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
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
  NgbDropdownModule,
} from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { TemplateRef } from '@angular/core';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { Observable } from 'rxjs';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
@Component({
  selector: 'app-ledger-mapping',
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
    ToolsDropdownComponent
  ],
  templateUrl: './ledger-mapping.component.html',
  styleUrl: './ledger-mapping.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class LedgerMappingComponent extends BaseListComponent implements OnInit {
  @ViewChild('subledgerMappingable') subledgerMappingable!: ReusableTableComponent;
   @ViewChild('content') content: TemplateRef<any>
  ledgerForm!: FormGroup;
  isEditMode = false;
  modalRef!: NgbModalRef;
  // page = 1;
  // pageSize = 10;
  // totalLengthOfCollection = 0;
  ledgerMappingList: any[] = [];
  results: any[] = [];
  // sortColumn = 'ledgerName';
  // sortDirection = 'asc';
  // isFavorite = false;
  // filterValue = '';
  // searchPerformed = false;
  searched = false;
  ledgerMappingData: any;
  errorMessage = '';
  userData: any;
  TandCList: any;
  currentMenuId: number;
  isLoading = false;
  ledgerList = [];
  LedgerMappingId!: number;
  ledgerNames: string[] = [];
  ledgerList1: any[] = [];
  selectedLedger: any = null;
  subledgerMappingOptions: any[] = [];
  subledgerMappingList: any[] = [];
  customerList: any[] = [];
  chargeList: any[] = [];
  permissions: string[] = [];
	currentMenuPermissions: any = {};


  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

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
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete ',
        class: "text-danger",
        // condition: (row: any) => this.hasPermission('Delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'SubledgerMasterSid',
    emptyMessage: 'No SubledgerMapping found',
    dragAndDrop: true
  };

  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  tableLoading = false;
  protected config: ListComponentConfig = {
    storageKey: 'SubledgerMapping-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'LedgerName',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  get allSubledagerMapping() { return this.allItems; }
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private userService: authService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.appSettingService.getUser().subscribe((user) => {
      if (user) this.userData = user;
    });

    this.initForm();
    // this.loadLedgerMappings();
    this.getLedgerList();
    this.ledgerForm.get('subledgerType')?.valueChanges.subscribe((value) => {
      this.onSubledgerTypeChange(value);
    });

    this.route.paramMap.subscribe((params) => {
      this.LedgerMappingId = +params.get('id');
      if (this.LedgerMappingId) {
        this.isEditMode = true;
        this.loadLedgerMappingData(this.LedgerMappingId);
      }
    });
    super.ngOnInit();
    this.checkPermissions();
      this.initializeTableConfig();
      this.initializeHeaderActions();
    this.initializeModalDropdownItems();
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

  modeOfStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];

  modeOfSubledgerType = [
    { id: 1, name: 'Customer', value: 'customer' },
    { id: 2, name: 'Charge', value: 'charge' },
  ];

  initForm(): void {
    this.ledgerForm = this.fb.group({
      SubledgerName: ['', Validators.required],
      SubledgerType: ['', Validators.required],
      SubledgerMappingSid: ['', Validators.required],
      COAMasterSid: ['', Validators.required],
      Status: ['A'],
      Remarks: [''],
    });
  }

  // loadLedgerMappings(): void {
  //   this.spinner.show();
  //   this.isLoading = true;
  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //   };

  //   this.masterService.searchSubledgerMaster(params).subscribe({
  //     next: (response: any) => {
  //       if (response.status) {
  //         this.results = response.data.items || [];
  //         this.applySorting();
  //         // this.updatePaginationData();
  //         this.ledgerMappingList = [...this.results];
  //         this.searched = true;
  //         this.totalLengthOfCollection = response.data.totalCount || 0;
  //       } else {
  //         this.appSettingService.showError(response.message);
  //         this.results = [];
  //         this.ledgerMappingList = [];
  //         this.totalLengthOfCollection = 0;
  //       }
  //       this.searchPerformed = true;
  //       this.spinner.hide();
  //       this.isLoading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error loading ledger mappings:', err);
  //       this.isLoading = false;
  //     },
  //   });
  // }
  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.masterService.searchSubledgerMaster(this.getSearchParams());
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
        LedgerName:item.CoaMaster?.LedgerName,
        LedgerCode:item.CoaMaster?.LedgerCode,
        branchName: item.CoaMaster?.CompanyMaster?.branchMaster?.[0]?.branchName || '',
        currencyName:item.CoaMaster?.CurrencyMaster?.currencyName,
        Status: item.Status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
       this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error fetching subledgerMapping.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error fetching subledgerMapping.');
    console.error('Error fetching subledgerMapping', error);
    super.handleSearchError(error);
  }

    onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchSubledgerMpping();
  }


  searchSubledgerMpping() {
    this.page = 1;
    this.search();
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

  clearFilterValue() {
    this.clearFilter();
  }

  updatePaginationData(): void {
    this.search();
  }

  override trackBy(index: number, item: any): number {
    return item.SubledgerMasterSid || index;
  }


  viewSubledgerMapping(row: any,content:any): void {
    this.editLedgerMapping(row.SubledgerMasterSid,content)
  }



  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      // {
      //   key: 'BookingNo',
      //   label: 'Booking No',
      //   sortable: true,
      //   filterable: true,
      //   visible: true,
      //   template: 'link',
      //   width: '180px',
      //   dataType: 'string'
      // },
      {
        key: 'LedgerName',
        label: 'COA Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'LedgerCode',
        label: 'COA Code',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'branchName',
        label: 'Branch',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'currencyName',
        label: 'Currency',
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
      this.viewSubledgerMapping(event.row,this.content);
    }else if(event.action === 'delete'){
      this.deleteBy(event.row)
    }
  }

  deleteBy(row:any){
    this.deleteSudledgerMaster(row.SubledgerMappingSid)
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
    const formattedData = this.allSubledagerMapping;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.subledgerMappingable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Subledger-Mapping-Report',
      title: companyName
    });
  }
  loadLedgers(): void {
    this.masterService.getAllSuledgermaster().subscribe({
      next: (res) => {
        this.ledgerList = res.data || res;
      },
      error: (err) => {
        console.error('Error loading ledgers', err);
        this.appSettingService.showError('Failed to load ledgers');
      },
    });
  }

  getLedgerList(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.masterService.getCoaWithSubledger(CompanyMasterSid).subscribe({
      next: (data) => {
        this.ledgerList = data;
      },
      error: (err) => {
        console.error('Error fetching ledger list', err);
      },
    });
  }

  // updatePaginationData(): void {
  //   const start = (this.page - 1) * this.pageSize;
  //   const end = start + this.pageSize;
  //   this.loadLedgerMappings();
  // }

  onSubledgerTypeChange(selectedType: string): void {
    this.ledgerForm.get('SubledgerMappingSid')?.reset();
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;

    if (selectedType === 'Customer') {
      this.masterService.getAllCustomers(CompanyMasterSid).subscribe((res: any) => {
        console.log('API Response:', res);

        const data = res?.data ?? res;

        if (Array.isArray(data)) {
          this.subledgerMappingOptions = data.map((item: any) => ({
            id: item.CustomerMasterSid,
            name: item.CustomerName,
          }));
          console.log('Mapped Options:', this.subledgerMappingOptions);
        } else {
          console.warn('Subledger data is not an array:', data);
        }
      });
    } else if (selectedType === 'Charge') {
      this.masterService.getAllCharges(CompanyMasterSid).subscribe((res: any) => {
        console.log('API Response:', res);

        const data = res?.data ?? res;

        if (Array.isArray(data)) {
          this.subledgerMappingOptions = data.map((item: any) => ({
            id: item.ChargeMasterSid,
            name: item.chargeName,
          }));
          console.log('Mapped Options:', this.subledgerMappingOptions);
        } else {
          console.warn('Subledger data is not an array:', data);
        }
      });
    }
  }


  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.LedgerMappingId) return;

    this.masterService.getAuditLogsSubledgerMaster(
      'SubledgerMaster',
      this.LedgerMappingId.toString()
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

  deleteSudledgerMaster(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteSudledgerMaster(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.searchSubledgerMpping();
        });
      }
    });
  }

  openModal(content: TemplateRef<any>, id?: number): void {
    this.modalRef = this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });

    if (id) {
      this.isEditMode = true;
      this.LedgerMappingId = id;
      this.loadLedgerMappingData(id);
      console.log(this.loadLedgerMappingData);
    } else {
      this.isEditMode = false;
      this.ledgerForm.reset();
    }
  }

  editLedgerMapping(id: number, content: any): void {
    this.isEditMode = true;
    this.LedgerMappingId = id;

    this.masterService.fetchSubledgerMasterId(id).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const data = res.data;
          this.onSubledgerTypeChange(data.SubledgerType);
          this.ledgerForm.patchValue({
            SubledgerName: data.SubledgerName,
            SubledgerType: data.SubledgerType,
            COAMasterSid: data.COAMasterSid,
            SubledgerMappingSid: data.SubledgerMappingSid,
            CompanyMasterSid: data.CompanyMasterSid,
            Status: data.Status === 'A' ? 'Active' : 'Suspended',
          });

          this.modalRef = this.modalService.open(content, {
            size: 'lg',
            centered: true,
            backdrop: 'static',
          });

          this.ledgerMappingData = data;
        }
      },
      error: () =>
        this.appSettingService.showError('Failed to load data for editing.'),
    });
  }

  loadLedgerMappingData(id: number): void {
    this.masterService.fetchSubledgerMasterId(id).subscribe({
      next: (res: any) => {
        const data = res.data;
        this.ledgerForm.patchValue({
          SubledgerName: data.SubledgerName,
          SubledgerType: data.SubledgerType,
          SubledgerMappingSid: data.SubledgerMappingSid,
          COAMasterSid: data.LedgerName,
          Remarks: data.Remarks,
          Status: data.Status === 'A' ? 'Active' : 'Suspended',
        });
        this.onSubledgerTypeChange(data.SubledgerType);
      },
      error: () =>
        this.appSettingService.showError('Error loading ledger mapping'),
    });
  }

  deleteLedgerMapping(id: number): void {
    const ref = this.dialog.open(DeleteWarningComponent);
    ref.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteSudledgerMaster(id).subscribe(() => {
          this.appSettingService.showSuccess('Deleted!');
          // this.loadLedgerMappings();
        });
      }
    });
  }

  onSubmit(): void {
    if (this.ledgerForm.invalid) {
      this.ledgerForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required fields.');
      return;
    }

    const form = this.ledgerForm.value;

    const mappedStatus = form.Status === 'A' ? 'A' : 'S';
    const currentuseremail =
      this.appSettingService.userSettingSource.value['userEmail'];
    const payload = this.isEditMode
      ? {
        ...this.ledgerForm.value,
        Status: mappedStatus,
        UpdatedBy: currentuseremail,
      }
      : {
        ...this.ledgerForm.value,
        Status: mappedStatus,
        CreatedBy: currentuseremail,
      };

    if (this.isEditMode) {
      this.masterService
        .updateSubledgerMasterById(this.LedgerMappingId, payload)
        .subscribe({
          next: (res: any) => {
            this.appSettingService.showSuccess(res.message);
            this.closeModal();
            // this.loadLedgerMappings();
          },
          error: () =>
            this.appSettingService.showError('Failed to update Ledger Mapping'),
        });
    } else {
      this.masterService.createNewSubledgerMaster(payload).subscribe({
        next: (res: any) => {
          this.appSettingService.showSuccess(res.message);
          this.closeModal();
          // this.loadLedgerMappings();
        },
        error: () =>
          this.appSettingService.showError('Failed to create Ledger Mapping'),
      });
    }
  }

  resetForm(): void {
    this.ledgerList = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'ledgerName';
    this.sortDirection = 'asc';
    this.searched = false;
    this.filterValue = '';
    // this.loadLedgerMappings();
  }

  reset(): void {
    // If editing an existing ledger mapping, reload it (restore original state)
    if (this.isEditMode && this.LedgerMappingId) {
      this.loadLedgerMappingData(this.LedgerMappingId);
      return;
    }

    // Create-mode: reset form to sensible defaults
    this.ledgerForm.reset({
      SubledgerName: '',
      SubledgerType: '',
      SubledgerMappingSid: '',
      COAMasterSid: '',
      Status: 'Active',
      Remarks: ''
    });

    // Reset search and pagination
    this.filterValue = '';
    this.page = 1;
    this.sortColumn = 'ledgerName';
    this.sortDirection = 'asc';

    // Clear component state
    this.ledgerMappingData = null;
    this.LedgerMappingId = null;
    this.subledgerMappingOptions = [];

    // Reload the list
    // this.loadLedgerMappings();
  }

  closeModal(): void {
    if (this.modalRef && typeof this.modalRef.close === 'function') {
      this.modalRef.close();
    }
  }


  // sort(column: string): void {
  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.applySorting();
  // }

  // applySorting(): void {
  //   this.ledgerMappingList.sort((a, b) => {
  //     const valA = (this.getNestedValue(a, this.sortColumn) ?? '').toString().toLowerCase();
  //     const valB = (this.getNestedValue(b, this.sortColumn) ?? '').toString().toLowerCase();

  //     return this.sortDirection === 'asc'
  //       ? valA.localeCompare(valB)
  //       : valB.localeCompare(valA);
  //   });
  // }

  getNestedValue(item: any, column: string): any {
    switch (column) {
      case 'COAName':
        return item.CoaMaster?.LedgerName;
      case 'COACode':
        return item.CoaMaster?.LedgerCode;
      case 'Branch':
        return item.CoaMaster?.CompanyMaster?.branchMaster?.[0]?.branchName;
      case 'Currency':
        return item.CoaMaster?.CurrencyMaster?.currencyName;
      case 'Status':
        return item.Status === 'A' ? 'Active' : 'Suspended';
      default:
        return item[column];
    }
  }


  trackByIndex(index: number): number {
    return index;
  }

  // clearFilterValue(): void {
  //   this.filterValue = '';
  //   this.loadLedgerMappings();
  // }

  // report(): void {
  //   const formattedData = this.ledgerMappingList.map((item) => ({
  //     LedgerCode: item.CoaMaster?.LedgerCode || '',
  //     LedgerName: item.CoaMaster?.LedgerName || '',
  //     branchName: item.CoaMaster?.CompanyMaster?.branchMaster?.[0]?.branchName || '',
  //     currencyName: item.CoaMaster?.CurrencyMaster?.currencyName || '',
  //     Status: item.Status === 'A' ? 'Active' : 'Suspended'
  //   }));

  //   const companyName = this.currentCompany?.companyName ?? 'Company';

  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'LedgerName', label: 'COA Name' },
  //       { key: 'LedgerCode', label: 'COA code' },
  //       { key: 'branchName', label: 'Branch Name' },
  //       { key: 'currencyName', label: 'Currency' },
  //       { key: 'Status', label: 'Status' }
  //     ],
  //     fileName: 'Ledger-Mapping-Report',
  //     title: companyName
  //   });
  // }


  showInfo(): void {
    if (!this.ledgerMappingData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.ledgerMappingData;
    modalRef.componentInstance.idLabel = 'Ledger Mapping Id';
    modalRef.componentInstance.idValue = this.ledgerMappingData?.id;
  }

  openEmail(): void {
    if (!this.ledgerMappingData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.ledgerMappingData;
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
    modalRef.componentInstance.documentSid = this.LedgerMappingId;
  }
  openEDoc(): void {
    if (!this.ledgerMappingData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.ledgerMappingData;
  }

  openTandC(): void {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe({
      next: (resp: any) => {
        this.TandCList = resp.data;
        const modalRef = this.modalService.open(TermsAndConditionsComponent, {
          size: 'lg',
          backdrop: 'static',
          centered: true,
        });
        modalRef.componentInstance.terms = this.TandCList;
        modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
        modalRef.componentInstance.DocumentSid = this.ledgerMappingData?.id;
      },
      error: () => {
        this.appSettingService.showError('Error loading Terms and Conditions');
      },
    });
  }
}
