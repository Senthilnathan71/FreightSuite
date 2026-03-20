import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MawbStockAllocationComponent } from '../mawstockallocate/mawb-stock-allocation.component';
@Component({
  selector: 'app-mawb-stock-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    ListpageComponent,
    CustomDatePipe,
    FavoriteStarComponent,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
  ],
  providers: [CustomDatePipe],
  templateUrl: './mawb-stock-list.component.html',
  styles: ``,
})
export class MawbStockListComponent extends BaseListComponent implements OnInit {
  @ViewChild('mawbTable') mawbTable!: ReusableTableComponent;
  searchType = 'AirwayBillType';

  results: any[] = [];
  mawbList: any[] = [];

  loading: boolean = false;
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // Table configuration
  tableConfig:TableConfig;

  private initializeTableConfig() {
    this.tableConfig = {
      columns: [

        {
          key: 'AirwayBillType',
          label: 'Received From',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'BLNumber',
          label: 'Master BL Number',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'ReceivedDate',
          label: 'Received Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'StockStatus',
          label: 'Status',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
        },
        {
          key: 'AvailableStatus',
          label: 'Available Status',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
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
      trackByKey: 'MawbStockSid',
      emptyMessage: 'No mawb found',
      dragAndDrop: true
    }
  };

  tableLoading = false;
  headerActions: HeaderAction[] = [];
  protected config: ListComponentConfig = {
    storageKey: 'mawb-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'AirwayBillType',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Alias for compatibility with existing template
  get allMawb() { return this.allItems; }
  // pagination

  isFavorite: boolean = false;

  // Company
  currentCompany: any;
  currentBranch: any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private modalService: NgbModal,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService,
    private datePipe: CustomDatePipe,
    public mps : MenuPermissionService,
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    //  this.appSettingService.getUser().subscribe(user => {
    //     if (user) {
    //       this.userData = user;
    //      
    //     }
    //   });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    
    }
      this.mps.init().subscribe(()=>{
      this.initializeTableConfig();
       this.initializeHeaderActions();
    });
    // this.loadMawbStocks();
    // Initialize table configuration
    this.initializeTableConfig();
    this.initializeHeaderActions();
    // Initialize base component
    super.ngOnInit();
  }



  // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.masterService.searchMawbStock(this.getSearchParams());
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
        BLNumber: item.MasterBillNumber,
        status: item.status === 'A' ? 'Active' : 'Suspended',
        ReceivedDate: this.datePipe.transform(item?.ReceivedDate),
        AvailableStatus: item.AvailableStatus || 'Available',
         canDelete: item.StockStatus !== 'Utilised'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError('Error searching mawb-stock.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching mawb-stock.');
    console.error('Error searching mawb-stock', error);
    super.handleSearchError(error);
  }

  // Legacy methods for template compatibility
  searchMawbs() {
    this.search();
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchMawbs();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilterValue();
  }

  initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Allocate',
        icon: '',
        action: 'allocate'
      },
      {
        label: 'Deallocate',
        icon: '',
        action: 'deallocate'
      },

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

  onActionTriggered(action: string): void {
    switch (action) {
      case 'allocate':
        this.openAllocation('allocate');
        break;

      case 'deallocate':
        this.openAllocation('deallocate');
        break;
      case 'create':
        this. navigateToCreateGeneration();
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
  clearFilterValue() {
    this.clearFilter();
  }

  override trackBy(index: number, item: any): number {
    return item.MawbStockSid || index;
  }


  viewMawb(item: any): void {
    this.router.navigate(['/master/mawb-stock/entry/', item.MawbStockSid]);
  }
 

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewMawb(event.row);
    } else if (event.action === "delete") {
       if (!event.row.canDelete) {
        this.appSettingService.showError('Utilised MAWB cannot be deleted');
        return;
      }
      this.deleteBy(event.row)
    }
  }

  deleteBy(row: any) {
    if (!row.canDelete) {
      this.appSettingService.showError('Utilised MAWB cannot be deleted');
      return;
    }
    this.deleteMawbStock(row.MawbStockSid)
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
    const formattedData = this.allMawb;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.mawbTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'Mawb-Stock-Report',
      title: companyName
    });
  }

  // loadMawbStocks(): void {
  //   this.spinner.show();
  //   this.loading = true;
  //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   let BranchMasterSid = this.currentBranch?.BranchMasterSid;

  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection,
  //     activeCompanyId: CompanyMasterSid,
  //     activeBranchId: BranchMasterSid,
  //   };

  //   this.masterService.searchMawbStock(params).subscribe({
  //     next: (response: any) => {
  //       if (response.status) {
  //         this.mawbList = response.data.items || [];
  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searchPerformed = true;
  //       }
  //       else {
  //         this.appSettingService.showError(response.message);
  //       }
  //       this.spinner.hide();
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error fetching MAWB stocks:', err);
  //       this.mawbList = [];
  //       this.totalLengthOfCollection = 0;
  //       this.loading = false;
  //     }
  //   });
  // }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    // this.loadMawbStocks();
  }
  // clearFilterValue() {
  //   this.filterValue = '';
  //   this.loadMawbStocks();
  // }

  trackByIndex(index: number, item: any): number {
    return item.MawbStockSid || index;
  }

  deleteMawbStock(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteMawbStock(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("MAWB-Stock deleted successfully!");
            // this.loadMawbStocks();
            this.searchMawbs();
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateGeneration() {
    this.router.navigate(['master/mawb-stock/entry'])
  }



  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }
openAllocation(mode: 'allocate' | 'deallocate') {

  const modalRef = this.modalService.open(
    MawbStockAllocationComponent,
    {
      size: 'xl',
      centered: true,
      backdrop: 'static'
    }
  );

  modalRef.componentInstance.mode = mode;

  modalRef.result.then((result) => {
    if (result) {
      this.search();
    }
  }).catch(() => {});
}

}


