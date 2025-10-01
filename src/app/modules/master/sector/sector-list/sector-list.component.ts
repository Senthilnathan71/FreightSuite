import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { Zone } from 'src/app/modules/crm-mobile/Interfaces/zone.interface';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
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

@Component({
  selector: 'app-sector',
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
    ListpageComponent,
    FavoriteStarComponent,
    NgxSpinnerModule,
    NgbDropdownModule,
    ReusableTableComponent
  ],
  templateUrl: './sector-list.component.html',
  styleUrl: './sector-list.component.scss',
  providers: [DatePipe]
})
export class SectorComponent extends BaseListComponent implements OnInit {
  @ViewChild('sectorTable') sectorTable!: ReusableTableComponent;
  @ViewChild('content') content: TemplateRef<any>
  sectorForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  SectorMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  sectorList: any[] = [];
  statusList = ["Active", "Suspended"];
  zones: Zone[] = [];
  filteredZones: Zone[] = [];
  modalRef!: NgbModalRef;
  searchType = 'sectorName';
  // filterValue = '';
  searched = false;
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection = 0;
  isLoading = false;
  userData: any;
  sectorData: any;
  isFavorite: boolean = false;
  // sortColumn: string = 'sectorName';
  // sortDirection: string = 'asc';
  currentMenuId: number;
  TandCList: any[] = [];
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  // Company
  currentCompany: any;
  currentBranch: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
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
        class: "text-danger",
        condition: (row: any) => this.hasPermission('Delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: '',
    emptyMessage: 'No sector found',
    dragAndDrop: true
  };

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'sector-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'sectorName',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allSector() { return this.allItems; }
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
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
    this.initForm();
    this.loadZones();
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       this.checkPermissions();
    //     }
    //   });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.loadSectors();
    this.route.paramMap.subscribe(params => {
      this.SectorMasterSid = +params.get('id');
      if (this.SectorMasterSid) {
        this.isEditMode = true;
        this.loadSectorData(this.SectorMasterSid);
      }
    });
    // Initialize table configuration
    this.initializeTableConfig();

    // Initialize base component
    super.ngOnInit();
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
          },
        });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }


  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchSectorList(this.getSearchParams());
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
      this.appSettingService.showError('Error searching sector.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching sector.');
    console.error('Error searching sector', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchSector() {
    this.search();
  }

  // clearFilterValue() {
  //   this.clearFilter();
  // }

  override trackBy(index: number, item: any): number {
    return item.SectorMasterSid || index;
  }


  viewSector(item: any, content: any): void {
    this.editSector(item.SectorMasterSid, content)
  }



  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [

      {
        key: 'sectorName',
        label: 'Sector Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'sectorCode',
        label: 'Sector Code ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'RegionName',
        label: 'Region Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
       {
        key: 'RegionCode',
        label: 'Region Name',
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
      this.viewSector(event.row, this.content);
    } else if (event.action === 'delete') {
      this.deleteBy(event.row)
    }
  }

  deleteBy(row: any) {
    this.softDeleteSector(row.SectorMasterSid)
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
    const formattedData = this.allSector;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.sectorTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Sector-Report',
      title: companyName
    });
  }
  loadSectors(): void {
    this.spinner.show();
    this.isLoading = true;
    const params = {
      search: this.filterValue ? this.filterValue.trim() : '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    this.masterService.searchSectorList(params).subscribe({
      next: (response) => {
        if (response.status) {
          this.sectorList = response.data.items;
          this.totalLengthOfCollection = response.data.totalCount;
          this.searched = true;
        }
        else {
          this.appSettingService.showError(response.message);
        }
        this.spinner.hide();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching sectors:', err);
        this.sectorList = [];
        this.totalLengthOfCollection = 0;
        this.isLoading = false;
      },
    });
  }

  initForm() {
    this.sectorForm = this.fb.group({
      sectorName: ['', [Validators.required, Validators.maxLength(50)]],
      sectorCode: ['', [Validators.required, Validators.maxLength(10),
      this.alphaNumericValidator(), this.uppercaseValidator()]],
      RegionName: [null, [Validators.maxLength(50)]],
      RegionCode: [null, [Validators.maxLength(10)]],
      status: [{ value: 'Active', disabled: !this.isEditMode }, Validators.required]
    });

    this.sectorForm.get('sectorCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.sectorForm.get('sectorCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });

    this.sectorForm.get('RegionName')?.valueChanges.subscribe(zoneName => {
      if (zoneName) {
        const selectedZone = this.zones.find(z => z.ZoneName === zoneName);
        if (selectedZone) {
          this.sectorForm.get('RegionCode')?.setValue(selectedZone.ZoneCode, { emitEvent: false });
        }
      } else {
        this.sectorForm.get('RegionCode')?.setValue(null);
      }
    });
  }

  private alphaNumericValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z0-9]+$/.test(control.value);
      return valid ? null : { invalidAlphaNumeric: true };
    };
  }

  private uppercaseValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      return control.value === control.value.toUpperCase() ? null : { notUppercase: true };
    };
  }

  loadZones() {
    this.isLoading = true;
    this.masterService.getAllZones().subscribe({
      next: (response: any) => {
        this.zones = response.data || response || [];
        this.filteredZones = [...this.zones];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading zones:', err);
        this.appSettingService.showError('Failed to load zone data');
        this.isLoading = false;
        this.filteredZones = [...this.zones];
      }
    });
  }

  // resetForm(): void {
  //   this.sectorForm.reset({
  //     status: 'Active'
  //   });
  // }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.sectorForm.get('status')?.disable();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editSector(id: number, content: any) {
    this.isEditMode = true;
    this.SectorMasterSid = id;
    this.masterService.getSectorById(id).pipe(take(1)).subscribe({
      next: (sector: any) => {
        this.sectorData = sector;
        this.sectorForm.patchValue({
          sectorName: sector.sectorName,
          sectorCode: sector.sectorCode,
          RegionName: sector.RegionName || null,
          RegionCode: sector.RegionCode || null,
          status: sector.status === 'A' ? 'Active' : 'Suspended'
        });
        this.sectorForm.get('status')?.enable();
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
      },
      error: (err) => {
        console.error('Error fetching Sector', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  loadSectorData(id: number) {
    this.masterService.getSectorById(id).subscribe(
      (data) => {
        this.sectorForm.patchValue({
          ...data,
          status: data.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  onSubmit() {
    if (this.sectorForm.invalid) {
      this.sectorForm.markAllAsTouched();
      this.sectorForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.sectorForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...updatedBy,
        status: formValue.status === "Active" ? "A" : "S"
      } : {
        ...formValue,
        ...createdBy,
        status: formValue.status === "Active" ? "A" : "S"
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateSector(this.SectorMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.loadSectors();
              this.searchSector();
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
        this.masterService.createSector(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.loadSectors();
              this.searchSector();
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
  //   this.updatePaginationData();
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
  //   this.sectorList = [...this.results];
  // }



  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadSectors();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  softDeleteSector(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteSector(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.loadSectors();
          this.searchSector();
        });
      }
    });
  }

  // resetPage(): void {
  //   this.sectorList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.searched = false;
  //   this.filterValue = '';
  //   this.sectorList = [];
  //   this.searchType = 'sectorName';
  //   this.sortColumn = 'sectorName';
  //   this.sortDirection = 'asc';
  //   this.loadSectors();
  // }

  resetForm(): void {
    // If editing an existing sector, reload it (restore original state)
    if (this.isEditMode && this.SectorMasterSid) {
      this.loadSectorData(this.SectorMasterSid);
      return;
    }

    // Create-mode: reset form to initial state with proper default values
    this.sectorForm.reset({
      sectorName: null,
      sectorCode: null,
      RegionName: null,
      RegionCode: null,
      status: 'Active'
    });

    // Disable status field for create mode
    this.sectorForm.get('status')?.disable();

    // Reset validation state
    this.sectorForm.markAsUntouched();
    this.sectorForm.markAsPristine();

    // Clear any stored data
    this.sectorData = null;
  }

  // report(): void {
  //   const formattedData = this.sectorList.map(item => ({
  //     ...item,
  //     status: item.status === 'A' ? 'Active' : 'Suspended'
  //   }));

  //   // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'sectorName', label: 'Sector Name' },
  //       { key: 'sectorCode', label: 'Sector Code' },
  //       { key: 'RegionName', label: 'Region Name' },
  //       { key: 'RegionCode', label: 'Region Code' },
  //       { key: 'status', label: 'Status' },
  //     ],
  //     fileName: 'Sector-Report',
  //     title: companyName
  //   });
  // }

  showInfo() {
    if (!this.sectorData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.sectorData;
    modalRef.componentInstance.idLabel = 'Sector Id';
    modalRef.componentInstance.idValue = this.sectorData?.SectorMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.SectorMasterSid;

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
    if (!this.sectorData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
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
    modalRef.componentInstance.documentSid = this.SectorMasterSid;
  }
  openEDoc() {
    if (!this.sectorData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.sectorData;
    modalRef.componentInstance.idLabel = 'Sector Id';
    modalRef.componentInstance.idValue = this.sectorData?.SectorMasterSid;
  }

  clearFilterValue() {
    this.filterValue = '';
  }

  // openAuditLogs(modal: TemplateRef<any>) {
  //   if (!this.SectorMasterSid) return;

  //   this.masterService.getAuditLogs('SectorMaster', this.SectorMasterSid.toString()).subscribe({
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
    if (!this.SectorMasterSid) return;

    this.masterService.getAuditLogs(
      'SectorMaster',
      this.SectorMasterSid.toString()
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

}