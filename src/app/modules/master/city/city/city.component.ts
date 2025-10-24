import { CommonModule, DatePipe } from '@angular/common';
import { Component, effect, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { City } from 'src/app/modules/crm-mobile/Interfaces/city.interface';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, Subject, take } from 'rxjs';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
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
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
@Component({
  selector: 'app-city',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OnlyTextDirective,
    TextWithNumbersDirective,
    NgbPagination,
    RouterModule,
    NgbModalModule,
    NgSelectModule,
    DatePipe,
    ListpageComponent,
    PreventMultiClickDirective,
    FavoriteStarComponent,
    NgxSpinnerModule,
    NgbDropdownModule,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent,
    SearchableDropdown
  ],
  templateUrl: './city.component.html',
  styleUrl: './city.component.scss'
})
export class CityComponent extends BaseListComponent implements OnInit {
  @ViewChild('cityTable') cityTable!: ReusableTableComponent;
  @ViewChild('content') content: TemplateRef<any>
  cityForm!: FormGroup;
  isEditMode: boolean = false;
  citys: City[] = [];        // Array to store the leads
  results: any[] = [];
  CityMasterSid!: number;
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  isViewMode = false;
  cityList: any[] = [];
  statusList = ["Active", "Suspended"]
  countryList: any[] = [];
  currentMenuId: number;
  TandCList: any;
  stateList: any[] = [];
  countryMap: { [id: number]: string } = {};
  stateMap: { [id: number]: string } = {};
  modalRef!: NgbModalRef;
  searchType = 'cityName';
  // filterValue = '';
  // searchPerformed = false;
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection = 0;
  userData: any;
  cityData: any;
  isFavorite: boolean = false;
  // sortColumn: string = 'cityName'; 
  // sortDirection: string = 'asc'; 
  allCities: any[] = [];
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // Company
  currentCompany: any;
  currentBranch: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
    headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  // Table configuration
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View',
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
    trackByKey: 'CityMasterSid',
    emptyMessage: 'No city found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'city-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'cityName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };
  countryLookupConfig = DROPDOWN_CONFIGS.COUNTRY;
    stateLookupConfig = DROPDOWN_CONFIGS.STATE;

  // Alias for compatibility with existing template
  get allCity() { return this.allItems; }
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    public dropdownStore: DropdownStore
  ) {
    super(paginationService);
    effect(()=> {
          const countryData = this.dropdownStore.countries();
          const stateData = this.dropdownStore.states();
          this.countryList = countryData;
          this.stateList = (stateData || []).map(s => ({...s,Country : s.countryMaster?.countryName}));
        })
  }

  override ngOnInit(): void {
    //    this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    //     this.checkPermissions();

    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    // this.getAllCountries();
    // this.getAllState();
    // this.loadCities();
    this.loadCountryAndStateData();
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.CityMasterSid = +params.get('id');
      if (this.CityMasterSid) {
        this.isEditMode = true;
        // Check if we're in view mode (from query params)
        this.route.queryParams.subscribe(queryParams => {
          this.isViewMode = queryParams['mode'] === 'view';
          this.loadLeadData(this.CityMasterSid);
          // In edit mode, update statusList to include both options
          this.statusList = ["Active", "Suspended"];
          // Enable the status control in edit mode
          this.cityForm.get('status')?.enable();
        });
      }
    });
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
    return this.masterService.searchCityList(this.getSearchParams());
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
        countryName: item.countryMaster?.countryName,
        stateName: item.stateMaster?.stateName,
        status: item.status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching city.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching city.');
    console.error('Error searching city', error);
    super.handleSearchError(error);
  }

    onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchCity();
  }

  // Legacy methods for template compatibility
  searchCity() {
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


  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.CityMasterSid || index;
  }

  viewcity(row: any, content: any): void {
    this.updateCityById(row.CityMasterSid, content)
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'cityName',
        label: 'City Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'cityCode',
        label: 'City Code',
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
        key: 'stateName',
        label: 'State',
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
      this.viewcity(event.row, this.content);
    } else if (event.action === 'delete') {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row: any) {
    this.deleteCity(row.CityMasterSid)
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
    const formattedData = this.allCity;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.cityTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'City-Report',
      title: companyName
    });
  }
  // loadCities(): void {
  //   this.spinner.show();
  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize
  //   };

  //   this.masterService.searchCityList(params).subscribe({
  //     next: (response: any) => {
  //       if (response.status) {
  //         this.cityList = response.data.items.map((city: any) => {
  //           return {
  //             ...city,
  //             countryName: city?.countryMaster?.countryName || 'N/A',
  //             stateName: city?.stateMaster?.stateName || 'N/A'
  //           };
  //         });
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //       } else {
  //         this.cityList = [];
  //         this.totalLengthOfCollection = 0;
  //         this.appSettingService.showError(response.message);

  //       }
  //       this.searchPerformed = true;
  //       this.spinner.hide();
  //     },
  //     error: (err) => {
  //       console.error('Error loading cities:', err);
  //     }
  //   });
  // }



  loadCountryAndStateData() {
    this.dropdownStore.loadStates().subscribe();
    this.dropdownStore.loadCountries().subscribe();
  }

  // Method to load the city data
  // loadCity(): void {
  //   this.masterService.getAllCity().subscribe(
  //     (resp: City[]) => {
  //       console.log(resp, 'Cities')
  //       this.citys = resp['data'];  // On success, store the leads data in the component
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;  // On error, store the error message
  //       console.error('Error loading leads:', error);  // Optionally log the error
  //     }
  //   );
  // }




  // Initialize the Form
  initForm() {
    this.cityForm = this.fb.group({
      cityName: ['', [Validators.required]],
      cityCode: ['', [Validators.required]],
      StateMasterSid: ['', [Validators.required]],
      CountryMasterSid: ['', [Validators.required]], // Dropdown
      status: [{ value: 'Active', disabled: false }, Validators.required],
    });
  }

  // resetForm(): void {
  //   this.cityForm.get('status')?.disable();
  //   this.cityForm.reset({
  //     status: 'Active'
  //   });
  // }

  resetForm(): void {
    // If editing an existing city, reload it (restore original state)
    if (this.isEditMode && this.CityMasterSid) {
      this.loadLeadData(this.CityMasterSid);
      return;
    }

    // Create-mode: reset form to initial state with proper default values
    this.cityForm.reset({
      cityName: null,
      cityCode: null,
      StateMasterSid: null,
      CountryMasterSid: null,
      status: 'Active'
    });

    // Re-enable the status field if it was disabled
    this.cityForm.get('status')?.enable();

    // Reset validation state
    this.cityForm.markAsUntouched();
    this.cityForm.markAsPristine();

    // Clear any stored data
    this.cityData = null;
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  openEditModal(content: any, id: number): void {
    this.isEditMode = true;
    this.CityMasterSid = id;
    this.getCityById(id).add(() => {
      this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
    });
  }

  updateCityById(id: number, content: any) {
    this.isEditMode = true;
    this.CityMasterSid = id;
    this.masterService.getCityById(id).pipe(take(1)).subscribe({
      next: (city: any) => {
        this.cityData = city;
        this.cityForm.get('status')?.enable();
        this.cityForm.patchValue({
          cityName: city.cityName,
          cityCode: city.cityCode,
          CountryMasterSid: Number(city.CountryMasterSid),
          StateMasterSid: Number(city.StateMasterSid),
          status: city.status === 'A' ? 'Active' : 'Suspended'
        });
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
      },
      error: (err) => {
        console.error('Error fetching', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  //   openAuditLogs(modal: TemplateRef<any>) {
  //   if (!this.CityMasterSid) return;

  //   this.masterService.getAuditLogsCity('CityMaster', this.CityMasterSid.toString()).subscribe({
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
    if (!this.CityMasterSid) return;

    this.masterService.getAuditLogsCity(
      'CityMaster',
      this.CityMasterSid.toString()
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
  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }
  // clearFilterValue() {
  //   this.filterValue = '';
  //   this.loadCities();
  // }

  getCityById(id: number) {
    this.resetForm();
    return this.masterService.getCityById(id).pipe(take(1)).subscribe(
      (city: any) => {
        console.log('City from backend:', city);
        this.cityForm.patchValue({
          cityName: city.cityName,
          cityCode: city.cityCode,
          CountryMasterSid: Number(city.CountryMasterSid),
          StateMasterSid: Number(city.StateMasterSid),
          status: city.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading');
      }
    );
  }

  onSubmit() {
    if (this.btnDisable) return;
    if (this.cityForm.get('status')?.disabled) {
      this.cityForm.get('status')?.enable();
    }
    if (this.cityForm.invalid) {
      this.cityForm.markAllAsTouched(); // Force validation messages to show
      this.cityForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      this.btnDisable = true;
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.cityForm.getRawValue(); // Use getRawValue() to get disabled values too

      const payload = (this.isEditMode) ? {
        ...formValue,
        StateMasterSid: Number(formValue.StateMasterSid),
        CountryMasterSid: Number(formValue.CountryMasterSid),
        ...updatedBy,
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      } : {
        ...formValue,
        StateMasterSid: Number(formValue.StateMasterSid),
        CountryMasterSid: Number(formValue.CountryMasterSid),
        ...createdBy,
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateCityById(this.CityMasterSid, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();             // <-- Close the modal here
              this.router.navigate(['master/city']);
            } else {
              this.appSettingService.showError(resp.message);
            }
            this.btnDisable = false;
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading country:', error);
            this.btnDisable = false;
          }
        );
      } else {
        this.masterService.createCity(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/city']);
            } else {
              this.appSettingService.showError(resp.message);
            }
            this.btnDisable = false;
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading country:', error);
            this.btnDisable = false;
          }
        );
      }
    }
  }


  // Mapping for API status values
  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended'
  };

  // Fetch lead data and patch the form
  loadLeadData(leadId: number) {
    this.masterService.getCityById(leadId).subscribe(
      (leadData) => {
        this.cityForm.patchValue({
          ...leadData,
          CountryMasterSid: leadData.CountryMasterSid,
          StateMasterSid: leadData.StateMasterSid,
          status: leadData.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading lead data.');
      }
    );
  }


  //   sort(column: string) {
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
  //     this.cityList.sort((a, b) => {
  //       let valueA: any;
  //       let valueB: any;

  //       // Handle special cases for mapped fields
  //       if (this.sortColumn === 'countryName') {
  //         valueA = a.countryName;
  //         valueB = b.countryName;
  //       } else if (this.sortColumn === 'stateName') {
  //         valueA = a.stateName;
  //         valueB = b.stateName;
  //       } else {
  //         valueA = a[this.sortColumn];
  //         valueB = b[this.sortColumn];
  //       }

  //       // Handle null/undefined values
  //       if (valueA == null) valueA = '';
  //       if (valueB == null) valueB = '';

  //       // Convert to string for case-insensitive comparison
  //       valueA = valueA.toString().toLowerCase();
  //       valueB = valueB.toString().toLowerCase();

  //       if (valueA < valueB) {
  //         return this.sortDirection === 'asc' ? -1 : 1;
  //       }
  //       if (valueA > valueB) {
  //         return this.sortDirection === 'asc' ? 1 : -1;
  //       }
  //       return 0;
  //     });
  //   }


  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadCities();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCity(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteCityById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("City deleted successfully!");
          this.router.navigate(['master/city/list'])
          // this.loadCities();
          this.searchCity();
        });
      }
    });
  }

  // getAllCountries() {
  //   this.masterService.getAllCountry().subscribe((res) => {
  //     this.countryList = res.data;
  //   })
  // }


  // getAllState() {
  //   this.masterService.getAllState().subscribe((res) => {
  //     this.stateList = res.data;
  //   })
  // }

  // resetPage(): void {
  //   this.filterValue = '';
  //   this.searchType = 'cityName';
  //   this.page = 1;
  //   this.citys = [] ;
  //   this.cityList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.searchPerformed = false;
  //   this.sortColumn = 'cityName';
  //   this.sortDirection = 'asc';
  //   this.loadCities();
  // }

  //   report(): void {
  //   const formattedData = this.cityList.map(item => ({
  //     ...item,
  //     status: item.status === 'A' ? 'Active' : 'Suspended'
  //   }));

  //   // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //     const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'cityName', label: 'City Name' },
  //       { key: 'cityCode', label: 'City Code' },
  //       { key: 'countryName', label: 'Country' },
  //       { key: 'stateName', label: 'State' },
  //       { key: 'status', label: 'Status' }
  //     ],
  //     fileName: 'City-Report',
  //     title: companyName
  //   });
  // }

  showInfo() {
    if (!this.cityData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.cityData;
    modalRef.componentInstance.idLabel = 'City Id';
    modalRef.componentInstance.idValue = this.cityData?.CountryMasterSid;
  }

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
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
          modalRef.componentInstance.DocumentSid = this.CityMasterSid;

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
    if (!this.cityData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.cityData;
    modalRef.componentInstance.idLabel = 'City Id';
    modalRef.componentInstance.idValue = this.cityData?.CityMasterSid;
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
    modalRef.componentInstance.documentSid = this.CityMasterSid;
  }

  openEDoc() {
    if (!this.cityData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.cityData;
    modalRef.componentInstance.idLabel = 'City Id';
    modalRef.componentInstance.idValue = this.cityData?.CityMasterSid;
  }


}
