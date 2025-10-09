import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbModalModule, NgbPagination, NgbModal, NgbModalRef, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { Zone } from 'src/app/modules/crm-mobile/Interfaces/zone.interface';
import { NgSelectModule } from '@ng-select/ng-select';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { filter, take } from 'rxjs';
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
@Component({
  selector: 'app-zone',
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
  templateUrl: './zone.component.html',
  styleUrl: './zone.component.scss'
})
export class ZoneComponent extends BaseListComponent implements OnInit {
  @ViewChild('zoneTable') zoneTable!: ReusableTableComponent;
  @ViewChild('content') content : TemplateRef<any>
  zoneForm!: FormGroup;
  isEditMode: boolean = false;
  zones: Zone[] = [];
  results: any[] = [];
  ZoneMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  zoneList: any[] = [];
  statusList = ["Active", "Suspended"]
  modalRef!: NgbModalRef;
  // filterValue = '';
  searched = false;
  searchResults: any[];
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection = 0;
  userData: any;
  zoneData: any;
  currentMenuId: number;
  TandCList: any;
  isFavorite: boolean = false;
  // sortColumn: string = 'ZoneName';
  // sortDirection: string = 'asc';
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
    headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  // Company
  currentCompany: any;
  currentBranch: any;
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
    private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }



  override ngOnInit(): void {
    // this.appSettingService.getUser().subscribe(user=>{
    //   if (user) {
    //     this.userData = user;
    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    // this.loadZones();
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.ZoneMasterSid = +params.get('id');
      if (this.ZoneMasterSid) {
        this.isEditMode = true;
        this.loadZoneData(this.ZoneMasterSid);
      }
    });
    // this.appSettingService.getUser().subscribe((user) => {
    //   if (user) {
    //     this.userData = user;
    //     this.checkPermissions();
    //   }
    // });
    // Initialize table configuration
    this.initializeTableConfig();
     this.initializeHeaderActions();
    this.initializeModalDropdownItems();
    // Initialize base component
    super.ngOnInit();
  }
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
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete ',
        class:"text-danger",
        condition: (row: any) => this.hasPermission('Delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'ZoneMasterSid',
    emptyMessage: 'No Zone found',
    dragAndDrop: true
  };
  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'zone-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'zoneNo',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allZone() { return this.allItems; }

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchZonelList(this.getSearchParams());
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
    this.allItems = (response.data.items || []).map((item: any) => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

    this.totalLengthOfCollection = response.data.totalCount || 0;
    this.applySorting();
      this.updateHeaderActionState();
  } else {
    this.appSettingService.showError('Error searching bookings.');
    this.allItems = [];
    this.totalLengthOfCollection = 0;
  }
}


  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching bookings.');
    console.error('Error searching bookings', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchZone() {
     this.page = 1;
    this.search();
  }

  
  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchZone();
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
    return item.ZoneMasterSid || index;
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
       {
        key: 'ZoneName',
        label: 'Zone Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'ZoneCode',
        label: 'Zone Code',
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
        dataType: 'string'
      },
    ];
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewZone(event.row);
    } else if (event.action === 'delete') {
      this.deleteChargeByRow(event.row);
    }
  }

   viewZone(row: any) {
    this.openEditModal(this.content,row.ZoneMasterSid)
  }

  deleteChargeByRow(row: any) {
    this.deleteCharge(row.ZoneMasterSid);
  }

   deleteCharge(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.softDeleteZone(id).subscribe({
          next: () => {
            this.appSettingService.showSuccess("Zone deleted successfully!");
            this.searchZone();
          },
          error: (err) => {
            this.appSettingService.showError("Error Deleting Charge");
            console.error(err);
          }
        });
      }
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
    const formattedData = this.allZone;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.zoneTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Zone-Report',
      title: companyName
    });
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId);
    console.log(userRole);
    if (currentMenuId && userRole) {
      this.masterService
        .getRoleMenuPermissions(currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
            console.log(this.permissions);
                      this.initializeHeaderActions();
          this.initializeModalDropdownItems();
          },
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
  // loadZones(): void {
  //   this.spinner.show();
  //   const params = {
  //     search: this.filterValue ? this.filterValue.trim() : '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //   };

  //   this.masterService.searchZonelList(params).subscribe({
  //     next: (response) => {
  //       if (response.status) {
  //         this.zoneList = response.data.items;
  //         this.results = [...this.zoneList];
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searched = true;
  //       } else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //     },
  //     error: (err) => {
  //       console.error('Error fetching zones:', err);
  //       this.zoneList = [];
  //       this.results = [];
  //       this.totalLengthOfCollection = 0;
  //     },
  //   });
  // }

  // loadZone(): void {
  //   this.masterService.getAllZone().subscribe(
  //     (resp: Zone[]) => {
  //       console.log(resp,'Zones')
  //       this.zones=resp['data'];
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;
  //       console.error('Error loading:',error);
  //     }
  //   );
  // }

  initForm() {
    this.zoneForm = this.fb.group({
      ZoneCode: ['', [Validators.required]],
      ZoneName: ['', [Validators.required]],
      status: [{ value: 'Active', disabled: false }, Validators.required],
    });
  }

  //  resetForm(): void {

  //   this.zoneForm.get('status')?.disable();
  //   this.zoneForm.reset({
  //     status: 'Active'
  //   });
  // }

  resetForm(): void {
    // If editing an existing zone, reload it (restore original state)
    if (this.isEditMode && this.ZoneMasterSid) {
      this.loadZoneData(this.ZoneMasterSid);
      return;
    }

    // Create-mode: reset form to initial state with proper default values
    this.zoneForm.reset({
      ZoneCode: null,
      ZoneName: null,
      status: 'Active'
    });

    // Re-enable the status field if it was disabled
    this.zoneForm.get('status')?.enable();

    // Reset validation state
    this.zoneForm.markAsUntouched();
    this.zoneForm.markAsPristine();

    // Clear any stored data
    this.zoneData = null;
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  openEditModal(content: any, id: number): void {
    this.isEditMode = true;
    this.ZoneMasterSid = id;
    this.getZoneById(id).add(() => {
      this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
    });
  }

  updateZoneById(id: number, content: any) {
    this.isEditMode = true;
    this.ZoneMasterSid = id;
    this.masterService.getZoneById(id).pipe(take(1)).subscribe({
      next: (zone: any) => {
        this.zoneData = zone;
        this.zoneForm.get('status')?.enable();
        this.zoneForm.patchValue({
          ZoneName: zone.ZoneName,
          ZoneCode: zone.ZoneCode,
          status: zone.status === 'A' ? 'Active' : 'Suspended'
        });
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
      },
      error: (err) => {
        console.error('Error fetching', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  getZoneById(id: number) {
    this.resetForm();
    return this.masterService.getZoneById(id).pipe(take(1)).subscribe(
      (zone: any) => {
        console.log('Zone from backend:', zone);
        this.zoneForm.patchValue({
          ZoneName: zone.ZoneName,
          ZoneCode: zone.ZoneCode,
          status: zone.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading');
      }
    );
  }

  onSubmit() {
    if (this.btnDisable) return;
    if (this.zoneForm.get('status')?.disabled) {
      this.zoneForm.get('status')?.enable();
    }
    if (this.zoneForm.invalid) {
      this.zoneForm.markAllAsTouched();
      this.zoneForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      this.btnDisable = true;
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.zoneForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...updatedBy,
        status: formValue.status === "Active" ? "A" : "I"
      } : {
        ...formValue,
        ...createdBy,
        status: formValue.status === "Active" ? "A" : "I"
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateZoneById(this.ZoneMasterSid, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              // this.loadZones();
              this.searchZone();
              this.router.navigate(['master/zone']);
            } else {
              this.appSettingService.showError(resp.message);
            }
            this.btnDisable = false;
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Update Zone Error:', error);
            this.btnDisable = false;
          }
        );
      } else {
        this.masterService.createNewZone(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              // this.loadZones();
              this.searchZone();
              this.router.navigate(['master/zone']);
            } else {
              this.appSettingService.showError(resp.message);
            }
            this.btnDisable = false;
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Create Zone Error:', error);
            this.btnDisable = false;
          }
        );
      }
    }
  }

  statusMap: { [key: string]: string } = {
    A: 'Active',
    IA: 'Suspended'
  };

  loadZoneData(id: number) {
    this.masterService.getZoneById(id).subscribe(
      (zoneData) => {
        this.zoneForm.patchValue({
          ...zoneData,
          status: zoneData.status === 'A' ? 'Active' : 'Suspended'
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }


  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadZones();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  softDeleteZone(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.softDeleteZone(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Zone deleted successfully!");
          this.router.navigate(['master/zone'])
          // this.loadZones();
          this.searchZone();
        });
      }
    });
  }

  // resetPage(): void {
  //   this.filterValue = '';
  //   this.page = 1;
  //   this.zones = [];
  //   this.zoneList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.searched = false;
  //   this.sortColumn = 'ZoneName';
  //   this.sortDirection = 'asc';
  //   this.loadZones();
  // }

  // report() {
  //   const formattedData = this.zoneList.map(item => ({
  //     ...item,
  //     status: item.status === 'A' ? "Active" : "Suspended"
  //   }));

  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'ZoneName', label: 'Zone Name' },
  //       { key: 'ZoneCode', label: 'Zone Code' },
  //       { key: 'status', label: 'Status' }
  //     ],
  //     fileName: 'Zone-Report',
  //     title: companyName
  //   });
  // }

  showInfo() {
    if (!this.zoneData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.zoneData;
    modalRef.componentInstance.idLabel = 'Zone Id';
    modalRef.componentInstance.idValue = this.zoneData?.ZoneMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.ZoneMasterSid;

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
    if (!this.zoneData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.zoneData;
    modalRef.componentInstance.idLabel = 'Zone Id';
    modalRef.componentInstance.idValue = this.zoneData?.ZoneMasterSid;
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
    modalRef.componentInstance.documentSid = this.ZoneMasterSid;
  }

  openEDoc() {
    if (!this.zoneData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.zoneData;
    modalRef.componentInstance.idLabel = 'Zone Id';
    modalRef.componentInstance.idValue = this.zoneData?.ZoneMasterSid;
  }
  // clearFilterValue() {
  //   this.filterValue = '';
  // }

  // openAuditLogs(modal: TemplateRef<any>) {
  //   if (!this.ZoneMasterSid) return;

  //   this.masterService.getAuditLogs('ZoneMaster', this.ZoneMasterSid.toString()).subscribe({
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
  if (!this.ZoneMasterSid) return;

  this.masterService.getAuditLogs(
    'ZoneMaster',
    this.ZoneMasterSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['updatedOn','updatedBy']; // ✅ add more if needed later

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
