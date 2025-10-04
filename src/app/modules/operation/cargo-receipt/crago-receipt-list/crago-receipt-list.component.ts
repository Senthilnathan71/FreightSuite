import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgbPagination, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
@Component({
  selector: 'app-crago-receipt-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgbPagination,
    NgbModalModule,
    NgSelectModule,
    FeatherModule,
    ReactiveFormsModule,
    FormsModule,
    FavoriteStarComponent,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent,
    CustomDatePipe
  ],
  providers: [CustomDatePipe],
  templateUrl: './crago-receipt-list.component.html',
  styleUrl: './crago-receipt-list.component.scss'
})
export class CragoReceiptListComponent extends BaseListComponent implements OnInit {
  @ViewChild('cargoReceiptTable') cargoReceiptTable!: ReusableTableComponent;
  cargoList: any[] = [];
  results: any[] = [];
  // filterValue = '';
  // page = 1;
  // pageSize = 15;
  // totalLengthOfCollection = 0;
  // searched = false;
  // sortColumn: string = 'BookingNo';
  // sortDirection: string = 'desc';

  // Company/Branch
  currentCompany: any;
  currentBranch: any;
  userData: any;
  // Table configuration
  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Booking',
        // condition: (row: any) => this.hasPermission('View')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'BookingHeaderSid',
    emptyMessage: 'No cargo receipt found',
    dragAndDrop: true
  };

  tableLoading = false;
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];
  protected config: ListComponentConfig = {
    storageKey: 'booking-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'BookingNo',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allCargo() { return this.allItems; }
  constructor(
    private router: Router,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    private spinner: NgxSpinnerService,
    private excelReportService: ExcelExportService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe,
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch')
    );
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    // this.loadCargoReceipts();
    this.initializeHeaderActions();
    this.initializeTableConfig();
    // this.initializeModalDropdownItems();
    super.ngOnInit();
  }


  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.operationService.search(this.getSearchParams());
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
      this.allItems = (response.data.items || []).map((item: any) => ({
        ...item,
        status: item.status === 'A' ? 'Active' : 'Suspended',
        departmentName:item.departmentMaster?.departmentName,
        BookingDateTime:this.datePipe.transform(item?.BookingDateTime)
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching BI clauses.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error searching BI clauses.');
    console.error('Error searching BI clauses', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadAllClauses();
  }


  // Legacy method for template compatibility
  loadAllClauses() {
    this.page = 1;
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilterValue();
  }

  // Legacy method for template compatibility
  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.BookingHeaderSid || index;
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

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'departmentName',
        label: 'Dept',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'BookingNo',
        label: 'Booking No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'BookingDateTime',
        label: 'Booking Date',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
       {
        key: 'CustomerName',
        label: 'Customer',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
       {
        key: 'POO',
        label: 'POO',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
       {
        key: 'POL',
        label: 'POL',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
       {
        key: 'POD',
        label: 'POD',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
       {
        key: 'FPD',
        label: 'FPD',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
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
        this.TonavigateCreate()
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

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.editbyrow(event.row);
    }
  }

  editbyrow(row: any,) {
   this.router.navigate(['/operation/cargo-receipt/entry', row.BookingHeaderSid]);
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
    const formattedData = this.allCargo;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.cargoReceiptTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Cargo-Receipt-Report',
      title: companyName
    });
  }

  // loadCargoReceipts(): void {
  //   this.spinner.show();
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;

  //   const params = {
  //     search: this.filterValue ? this.filterValue.trim() : '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortDirection: this.sortDirection,
  //     activeCompanyId: CompanyMasterSid,
  //     filterType: 'cargoReceipt' // optional, if backend expects
  //   };

  //   this.operationService.search(params).subscribe({
  //     next: (response) => {
  //       if (response.status) {
  //         this.cargoList = response.data.items;
  //         this.results = [...this.cargoList];
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searched = true;
  //       } else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //     },
  //     error: (err) => {
  //       console.error('Error fetching cargo receipts:', err);
  //       this.cargoList = [];
  //       this.results = [];
  //       this.totalLengthOfCollection = 0;
  //     }
  //   });
  // }

  // applySorting() {
  //   this.results.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];

  //     if (valueA == null) valueA = '';
  //     if (valueB == null) valueB = '';

  //     valueA = valueA.toString().toLowerCase();
  //     valueB = valueB.toString().toLowerCase();

  //     if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
  //     if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
  //     return 0;
  //   });
  // }

  // sort(column: string) {
  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.applySorting();
  // }

  // updatePaginatedData(): void {
  //   this.loadCargoReceipts();
  // }

  // resetPage(): void {
  //   this.filterValue = '';
  //   this.page = 1;
  //   this.cargoList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.searched = false;
  //   this.sortColumn = 'BookingDate';
  //   this.sortDirection = 'desc';
  //   this.loadCargoReceipts();
  // }

  // report(): void {
  //     const formattedData = this.cargoList.map(item => ({
  //       ...item,
  //       departmentName: item.departmentMaster?.departmentName,
  //       status: item.status === 'A' ? 'Active' : 'Suspended'
  //     }));
  //     //  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //       const companyName = this.currentCompany?.companyName ?? 'Company';
  //      this.excelReportService.exportAsExcel({
  //       data: formattedData,
  //       headers: [
  //         { key: 'departmentName', label: 'Department Name' },
  //         { key: 'BookingNo', label: 'Booking No' },
  //         { key: 'BookingDateTime', label: 'Booking Date' },
  //         { key: 'CustomerName', label: 'Customer Name' },
  //         { key: 'POO', label: 'POO' },
  //         { key: 'POL', label: 'POL' },
  //         { key: 'POD', label: 'POD' },
  //         { key: 'FPD', label: 'FPD' },
  //         { key: 'status', label: 'Status' },
  //       ],
  //       fileName: 'Cargo-Receipt-Report',
  //       title: companyName
  //      });
  //   }

  TonavigateCreate() {
    this.router.navigate(['operation/cargo-receipt/entry']);
  }

  // clearFilterValue() {
  //   this.filterValue = '';
  // }

  trackByIndex(index: number, item: any): number {
    return index;
  }


}
