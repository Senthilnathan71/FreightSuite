import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { OperationService } from '../../operation.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { MasterJobUploadModalComponent } from '../components/master-job-upload-modal/master-job-upload-modal.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import {
  AdvancedFilterValues,
  DateRangeConfig,
  DateTypeConfig,
  DropdownFilterConfig
} from 'src/app/shared/interfaces/advanced-filter.interface';
@Component({
  selector: 'app-master-job-list',
  standalone: true,
  imports: [
    FavoriteStarComponent,
    FeatherModule,
    CommonModule,
    FormsModule,
    CustomDatePipe,
    NgbPaginationModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent
  ],
  providers: [CustomDatePipe],
  templateUrl: './master-job-list.component.html',
  styleUrl: './master-job-list.component.scss',
})
export class MasterJobListComponent extends BaseListComponent implements OnInit {
  @ViewChild('masterTable') masterTable!: ReusableTableComponent;
  // filterValue = '';
  allMasterJob: any[] = [];
  // searchPerformed: boolean;
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // page = 1;
  // pageSize = 10;
  // totalLengthOfCollection: number;
  // sortColumn: string = 'departmentName';
  // sortDirection: string = 'desc';
  currentCompany: any;
  currentBranch: any;
  headerActions: HeaderAction[] = [];
  tableConfig: TableConfig;
  modalDropdownItems: DropdownMenuItem[] = [];
  MenuMasterSid: number;
  

  tableLoading = false;
  dateRangeConfig: DateRangeConfig = { enabled: true, defaultPreset: 'last30' };
  dateTypeConfig: DateTypeConfig = {
    enabled: true,
    options: [
      { label: 'Job Date', value: 'MasterJobDate' },
      { label: 'MBLDate', value: 'MBLDate' }
    ],
    defaultValue: 'MasterJobDate'
  };
  departmentFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'Dept',
    options: [],
    bindLabel: 'departmentName',
    bindValue: 'DepartmentMasterSid'
  };
  polFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'POL',
    options: [],
    bindLabel: 'displayName',
    bindValue: 'PortCode'
  };
  podFilterConfig: DropdownFilterConfig = {
    enabled: true,
    label: 'POD',
    options: [],
    bindLabel: 'displayName',
    bindValue: 'PortCode'
  };
  private allPorts: any[] = [];
  currentFilters: AdvancedFilterValues = {};

  protected config: ListComponentConfig = {
    storageKey: 'master-job-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'MasterJobDate',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allMaster() { return this.allItems; }
  constructor(
    private operationService: OperationService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private modalService: NgbModal,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe,
    public mps: MenuPermissionService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.appSettingService.getUser().subscribe((user) => {
      if (user) {
        this.userData = user;
        
      }
    });
    this.MenuMasterSid = this.mps.getMenuId();
    // this.searchMasterJob();
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(()=>{
this.initializeTableConfig();
    this.initializeHeaderActions();
    })
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'MasterJobDate'
    };
    this.loadHeaderLookups();
    // this.initializeModalDropdownItems();
    // Initialize base component
    super.ngOnInit();
  }

  

  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.operationService.searchMasterJobs(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams & Record<string, any> {
    const params: any = {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      MenuMasterSid : this.MenuMasterSid,
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    if (this.currentFilters.dateRange?.fromDate) {
      params.dateFrom = this.currentFilters.dateRange.fromDate;
      params.DateFrom = this.currentFilters.dateRange.fromDate;
    }
    if (this.currentFilters.dateRange?.toDate) {
      params.dateTo = this.currentFilters.dateRange.toDate;
      params.DateTo = this.currentFilters.dateRange.toDate;
    }
    if (this.currentFilters.dateType) {
      params.dateField = this.currentFilters.dateType;
      params.DateField = this.currentFilters.dateType;
      if (params.dateFrom) {
        params[`${this.currentFilters.dateType}From`] = params.dateFrom;
      }
      if (params.dateTo) {
        params[`${this.currentFilters.dateType}To`] = params.dateTo;
      }
    }
    if (this.currentFilters.departmentSid) {
      params.DepartmentMasterSid = Number(this.currentFilters.departmentSid);
      params.departmentMasterSid = Number(this.currentFilters.departmentSid);
    }
    if (this.currentFilters.pol) {
      const polCode = String(this.currentFilters.pol);
      params.POL = polCode;
      params.pol = polCode;
      const polSid = this.getPortSidByCode(polCode);
      if (polSid) {
        params.POLSid = polSid;
        params.polSid = polSid;
      }
    }
    if (this.currentFilters.pod) {
      const podCode = String(this.currentFilters.pod);
      params.POD = podCode;
      params.pod = podCode;
      const podSid = this.getPortSidByCode(podCode);
      if (podSid) {
        params.PODSid = podSid;
        params.podSid = podSid;
      }
    }

    return params;
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response.status) {
      const rawItems = Array.isArray(response?.data?.items) ? response.data.items : [];
      const filteredItems = this.applyAdvancedFilters(rawItems);

      this.allItems = filteredItems.map(item => ({
        ...item,
        Status: item.Status === 'A' ? 'Active' : 'Suspended',
        MasterJobDate: this.datePipe.transform(item?.MasterJobDate),
        MBLDate: this.datePipe.transform(item?.MBLDate),
      }));
      this.totalLengthOfCollection =
              rawItems.length !== filteredItems.length
                ? filteredItems.length
                : (response.data.totalCount || 0);
      // this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching company.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchMasterjob();
  }
  onSearchCleared(): void {
    this.filterValue = '';
    this.currentFilters = {
      dateRange: {
        preset: 'last30',
        fromDate: this.getLast30FromDate(),
        toDate: new Date().toISOString()
      },
      dateType: 'MasterJobDate'
    };
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
        label: 'XL Upload',
        icon: 'fas fa-file-excel',
        action: 'excel-dropdown',
       
        tooltip: 'Import master jobs and house jobs from Excel template. Download the template, fill in your data, and upload to create multiple jobs at once.',
        children: [
          {
            label: 'Download Template',
            icon: 'fas fa-download',
            action: 'download-template'
          },
          {
            label: 'Upload Excel',
            icon: 'fas fa-file-upload',
            action: 'upload-file'
          }
        ]
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

  // initializeModalDropdownItems(): void {
  //   this.modalDropdownItems = [
  //     {
  //       label: 'Edoc',
  //       icon: 'fas fa-file-alt',
  //       action: 'edoc',
  //       condition: this.hasPermission('Edoc')
  //     },
  //     {
  //       label: 'Terms & Condition',
  //       icon: 'fas fa-clipboard',
  //       action: 'terms',
  //       condition: this.hasPermission('Terms and Condition')
  //     },
  //     {
  //       label: 'Authorize',
  //       icon: 'fas fa-shield-alt',
  //       action: 'authority',
  //       condition: this.hasPermission('Authority')
  //     },
  //     {
  //       label: 'Email',
  //       icon: 'fas fa-envelope',
  //       action: 'email',
  //       condition: this.hasPermission('Email')
  //     }
  //   ];
  // }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.navigateToMasterJob()
        break;
      case 'download-template':
        this.downloadTemplate();
        break;
      case 'upload-file':
        this.openUploadModal();
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

  // onModalDropdownItemClick(action: string): void {
  //   switch (action) {
  //     case 'edoc':
  //       this.openEDoc();
  //       break;
  //     case 'terms':
  //       this.openTandC();
  //       break;
  //     case 'authority':
  //       this.openAuthority();
  //       break;
  //     case 'email':
  //       this.openEmail();
  //       break;
  //     default:
  //       console.warn(`Unknown dropdown action: ${action}`);
  //   }
  // }

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'report') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 };
      }
      return action;
    });
  }
  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching company.');
    console.error('Error searching company', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchMasterjob() {
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.MasterJobSid || index;
  }


 viewMasterJob(masterJobSid: number): void {
  this.navigateToEdit(masterJobSid);
}


  navigateToEdit(masterJobSid: number) {
    this.router.navigate(['operation/master-job/entry', masterJobSid]);
  }


  // Table configuration
  private initializeTableConfig(): void {
   this.tableConfig = {
    columns: [
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
        key: 'departmentName',
        label: 'Dept',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width:'90px'
      },
      {
        key: 'MasterJobNumber',
        label: 'Master Job No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        // template: "link"
      },
      {
        key: 'MasterJobDate',
        label: 'Job Date',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        width:'100px'
      },
      {
        key: 'MBLNo',
        label: 'MBL No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },

      {
        key: 'MBLDate',
        label: 'MBL Date',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
        cellClass: 'vessel-column',
        width:'100px'
      
      },
      {
        key: 'POL',
        label: 'POL',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'POD',
        label: 'POD',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'FDC',
        label: 'FPOD',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'NoOfHouses',
        label: '	No Of Houses',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
      {
        key: 'NoOfContainers',
        label: 'No Of Containers ',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'JobStatus',
        label: 'Job Close',
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
        label: 'Job Close',
        icon: 'fas fa-lock',
        action: 'job_close',
        tooltip: 'job-close',
      },
      {
        label: 'Pro Rate',
        icon: 'fas fa-percentage',
        action: 'pro_rate',  
        tooltip: 'Pro-Rate',
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: '',
    emptyMessage: 'No master job found',
    dragAndDrop: true
  };

  }

  // Table event handlers
 onTableActionClick(event: TableEventData): void {
  if (event.action === 'view') {
    this.viewMasterJob(event.row.MasterJobSid);
  }
  if (event.action === 'job_close') {
    this.router.navigate(['operation/job-close', event.row.MasterJobSid]);
  }
  if(event.action === 'pro_rate'){
    this.router.navigate(['operation/pro-rate']);
  }
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

  onAdvancedSearch(event: { searchValue: string; filters: AdvancedFilterValues }): void {
    this.filterValue = event.searchValue;
    this.currentFilters = event.filters;
    this.page = 1;
    this.search();
  }

  onDepartmentFilterChanged(departmentSid: number | null): void {
    this.setFilteredPortOptions(departmentSid);
  }

  private loadHeaderLookups(): void {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!companyMasterSid) {
      return;
    }

    forkJoin({
      departments: this.operationService
        .getDepartmentByType(companyMasterSid, ['Sea', 'Road', 'Transport', 'Others'])
        .pipe(catchError(() => of([]))),
      ports: this.operationService.getAllPorts().pipe(catchError(() => of({ data: [] })))
    }).subscribe(({ departments, ports }: any) => {
      this.departmentFilterConfig = {
        ...this.departmentFilterConfig,
        options: Array.isArray(departments) ? departments : []
      };

      const allPorts = Array.isArray(ports?.data) ? ports.data : [];
      this.allPorts = allPorts.map((port: any) => ({
        ...port,
        displayName: `${port.PortName} (${port.PortCode})`
      }));

      this.setFilteredPortOptions(null);
    });
  }

  private setFilteredPortOptions(departmentSid: number | null): void {
    const normalizedDepartmentSid = departmentSid !== null ? Number(departmentSid) : null;
    const selectedDepartment = this.departmentFilterConfig.options.find(
      (dept: any) => Number(dept?.DepartmentMasterSid) === normalizedDepartmentSid
    );

    const departmentType = (selectedDepartment?.departmentType || '').toUpperCase();
    const filteredPorts = !departmentType
      ? [...this.allPorts]
      : this.allPorts.filter((port: any) => {
          const portType = (port?.PortType || '').toUpperCase();
          return departmentType === 'AIR' ? portType === 'AIR' : portType === 'SEA';
        });

    this.polFilterConfig = { ...this.polFilterConfig, options: filteredPorts };
    this.podFilterConfig = { ...this.podFilterConfig, options: filteredPorts };
  }

  private getPortSidByCode(portCode: string | null | undefined): number | null {
    if (!portCode) {
      return null;
    }

    const port = this.allPorts.find((p: any) => String(p?.PortCode) === String(portCode));
    return port?.PortMasterSid ? Number(port.PortMasterSid) : null;
  }

  private getPortCode(value: any): string {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    return String(value?.PortCode || value?.portCode || '').trim();
  }

  private getLast30FromDate(): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }

  private hasAdvancedFilterValues(): boolean {
    return !!(
      this.currentFilters.departmentSid ||
      this.currentFilters.pol ||
      this.currentFilters.pod ||
      this.currentFilters.dateRange?.fromDate ||
      this.currentFilters.dateRange?.toDate
    );
  }

  private applyAdvancedFilters(items: any[]): any[] {
    if (!this.hasAdvancedFilterValues()) {
      return items;
    }

    const selectedDateField = this.currentFilters.dateType || 'MasterJobDate';
    const from = this.currentFilters.dateRange?.fromDate ? new Date(this.currentFilters.dateRange.fromDate) : null;
    const to = this.currentFilters.dateRange?.toDate ? new Date(this.currentFilters.dateRange.toDate) : null;
    const selectedPol = this.currentFilters.pol ? String(this.currentFilters.pol).trim().toUpperCase() : null;
    const selectedPod = this.currentFilters.pod ? String(this.currentFilters.pod).trim().toUpperCase() : null;
    const selectedDeptSid = this.currentFilters.departmentSid ? Number(this.currentFilters.departmentSid) : null;
    const selectedDeptName = selectedDeptSid
      ? String(
          this.departmentFilterConfig.options.find(
            (dept: any) => Number(dept?.DepartmentMasterSid) === selectedDeptSid
          )?.departmentName || ''
        ).trim().toUpperCase()
      : null;

    return items.filter((item: any) => {
      if (selectedDeptSid) {
        const itemDeptSid = Number(
          item?.DepartmentMasterSid ??
          item?.departmentMasterSid ??
          item?.departmentMaster?.DepartmentMasterSid ??
          item?.departmentMaster?.departmentMasterSid ??
          0
        );

        if (itemDeptSid > 0) {
          if (itemDeptSid !== selectedDeptSid) {
            return false;
          }
        } else if (selectedDeptName) {
          const itemDeptName = String(
            item?.departmentName ??
            item?.departmentMaster?.departmentName ??
            ''
          ).trim().toUpperCase();
          if (itemDeptName !== selectedDeptName) {
            return false;
          }
        }
      }

      const itemPol = this.getPortCode(item?.POL).toUpperCase();
      const itemPod = this.getPortCode(item?.POD).toUpperCase();

      if (selectedPol && itemPol !== selectedPol) {
        return false;
      }

      if (selectedPod && itemPod !== selectedPod) {
        return false;
      }

      if (from || to) {
        const rawDate = item?.[selectedDateField];
        if (!rawDate) {
          return false;
        }

        const itemDate = new Date(rawDate);
        if (Number.isNaN(itemDate.getTime())) {
          return false;
        }

        if (from && itemDate < from) {
          return false;
        }
        if (to && itemDate > to) {
          return false;
        }
      }

      return true;
    });
  }

  report(): void {
    const formattedData = this.allMaster;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.masterTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Master-Job-Report',
      title: companyName
    });
  }
 

  deleteMasterJob(MasterJobSid: number) {
    const modalRef = this.modalService.open(DeleteWarningComponent, {
      centered: true,
      backdrop: 'static'
    });

    modalRef.result.then(
      (result) => {
        if (result === true) {
          this.operationService.deleteMasterJob(MasterJobSid).subscribe({
            next: (response: any) => {
              if (response.status) {
                this.appSettingService.showSuccess('Master Job deleted successfully');
                this.searchMasterjob();
              } else {
                this.appSettingService.showError('Error deleting Master Job');
              }
            },
            error: (error) => {
              console.error('Error deleting Master Job:', error);
              this.appSettingService.showError('Error deleting Master Job');
            }
          });
        }
      },
      (reason) => {
        // Modal dismissed
        console.log('Delete modal dismissed:', reason);
      }
    );
  }

  

  navigateToMasterJob() {
    this.router.navigate(['operation/master-job/entry']);
  }

  downloadTemplate(): void {
    this.spinner.show();
    this.operationService.downloadMasterJobTemplate().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Master_Job_Upload_Template.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
        this.spinner.hide();
        this.appSettingService.showSuccess('Template downloaded successfully');
      },
      error: (error) => {
        console.error('Error downloading template:', error);
        this.spinner.hide();
        this.appSettingService.showError('Error downloading template');
      }
    });
  }

  openUploadModal(): void {
    const modalRef = this.modalService.open(MasterJobUploadModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: false
    });

    // Pass data to modal via component instance
    modalRef.componentInstance.currentCompany = this.currentCompany;
    modalRef.componentInstance.currentBranch = this.currentBranch;
    modalRef.componentInstance.userData = this.userData;

    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          this.appSettingService.showSuccess('Master Job and House Jobs created successfully');
          this.searchMasterjob(); // Refresh the list
        }
      },
      (reason) => {
        // Modal dismissed (cancelled)
        console.log('Modal dismissed:', reason);
      }
    );
  }


  // resetPage() {
  //   this.page = 1;
  //   this.filterValue = '';
  //   this.allMasterJob = [];
  //   this.searchPerformed = false;
  //   this.totalLengthOfCollection = 0;
  //   this.sortColumn = 'departmentName';
  //   this.sortDirection = 'desc';
  // }

  // report(): void {
  //   const formattedData = this.allMasterJob.map(item => {
  //     return {
  //       ...item,
  //       status: item.Status === "A" ? "Active" : "Suspended"
  //     }
  //   })
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'departmentName', label: 'Department' },
  //       { key: 'MasterJobNumber', label: 'Master Job No.' },
  //       { key: 'MasterJobDate', label: 'Master Job Date' },
  //       { key: 'MBLNo', label: 'MBL No' },
  //       { key: 'MBLDate', label: 'MBL Date' },
  //       { key: 'POL', label: 'POL' },
  //       { key: 'POD', label: 'POD' },
  //       { key: 'FDC', label: 'FDC' },
  //       { key: 'NoOfHouses', label: 'No of Houses' },
  //       { key: 'NoOfContainers', label: 'No of Containers' },
  //       { key: 'status', label: 'Status' },
  //     ],
  //     fileName: 'Master-Job-Report',
  //     title: companyName
  //   });
  // }

}
