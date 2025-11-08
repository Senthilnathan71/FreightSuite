
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
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { MasterJobUploadModalComponent } from '../../master-job/components/master-job-upload-modal/master-job-upload-modal.component';

@Component({ 
  selector: 'app-mawbill-list',
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
  templateUrl: './mawbill-list.component.html',
  styleUrl: './mawbill-list.component.scss'
})
export class MawbillListComponent extends BaseListComponent implements OnInit {
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
  modalDropdownItems: DropdownMenuItem[] = [];
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View',
        
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

  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'mawbill-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'departmentName',
    defaultSortDirection: 'asc',
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
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.appSettingService.getUser().subscribe((user) => {
      if (user) {
        this.userData = user;
        this.checkPermissions();
      }
    });
    // this.searchMasterJob();
    this.initializeTableConfig();
    this.initializeHeaderActions();
    // this.initializeModalDropdownItems();
    // Initialize base component
    super.ngOnInit();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    if (currentMenuId && userRole) {
      this.operationService
        .getRoleMenuPermissions(currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
            this.initializeHeaderActions();
            // this.initializeModalDropdownItems();
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
    return this.operationService.searchMasterJobs(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams {
    return {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      departmentType: 'Air'
    };
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response.status) {
      this.allItems = response.data.items.map(item => ({
        ...item,
        Status: item.Status === 'A' ? 'Active' : 'Suspended',
        MasterJobDate: this.datePipe.transform(item?.MasterJobDate),
        MBLDate: this.datePipe.transform(item?.MBLDate),
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
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
        label: 'Excel Import',
        icon: 'fas fa-file-excel',
        action: 'excel-dropdown',
        condition: this.hasPermission('Add'),
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
    this.router.navigate(['operation/mawbill/entry', masterJobSid]);
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
        key: 'departmentName',
        label: 'Department',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
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
        label: 'Date',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'MBLNo',
        label: 'MAWB',
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
        cellClass: 'vessel-column'
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
        label: 'FDC',
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
      // {
      //   key: 'NoOfContainers',
      //   label: 'No Of Containers ',
      //   sortable: true,
      //   filterable: true,
      //   visible: true,
      //   dataType: 'string'
      // },
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
    this.viewMasterJob(event.row.MasterJobSid); // ✅ only the ID
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

  

  updatePaginationData(): void {
    this.searchMasterjob();
  }

  // trackBy(index: number, item: any): number {
  //   return item.MasterJobSid || index;
  // }

  // clearFilterValue() {
  //   this.filterValue = '';
  //   this.searchMasterJob();
  // }

  navigateToMasterJob() {
    this.router.navigate(['operation/mawbill/entry']);
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


 

}
