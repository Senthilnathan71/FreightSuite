import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { MasterService } from 'src/app/modules/master/master.service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
      CommonModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    FeatherModule,
    FavoriteStarComponent,
    ReactiveFormsModule,
    NgxSpinnerModule,
    ReusableTableComponent,
     PageHeaderComponent,
  ],
  templateUrl: './payment-list.component.html',
  styles: ``
})
export class PaymentListComponent extends BaseListComponent implements OnInit{
   @ViewChild('paymentTable') paymentTable!: ReusableTableComponent;
    chartAccountList: any[] = [];
    // filterValue: string = '';
    userData: any;
    searched = false;
    // pagination
    // page = 1;
    // pageSize = 10;
    // totalLengthOfCollection = 0;
    // sorting
    // sortColumn: string = 'Name';
    // sortDirection: string = 'asc';
  
    // Company
    currentCompany: any;
    currentBranch: any;
    headerActions: HeaderAction[] = [];
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
      trackByKey: 'COAMasterSid',
      emptyMessage: 'No payment found',
      dragAndDrop: true
    };
  
    tableLoading = false;
  
    protected config: ListComponentConfig = {
      storageKey: 'payment-list-state',
      defaultPageSize: 10,
      defaultSortColumn: 'Name',
      defaultSortDirection: 'desc',
      pageSizeOptions: [10, 20, 50, 100, 500],
      maxPagesToShow: 3
    };
  
    // Alias for compatibility with existing template
    get Allpayment() { return this.allItems; }
    constructor(
      private masterService: MasterService,
      private router: Router,
      private appSettingService: AppSettingsService,
      private excelReportService: ExcelExportService,
      private dialog: MatDialog,
      private spinner: NgxSpinnerService,
      paginationService: PaginationService
    ) {
      super(paginationService);
    }
  
  
    override ngOnInit() {
      // this.appSettingService.getUser().subscribe(user => {
      //   if (user) {
      //     this.userData = user;
      //   }
      // });
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
      const userProfile = this.appSettingService.getDecryptedUserProfile();
      if (userProfile) {
        this.userData = userProfile;
      }
      // this.loadChartAccounts();
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
      return this.masterService.searchCoa(this.getSearchParams());
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
          Status: item.Status === 'A' ? 'Active' : 'Suspended'
        }));
        this.totalLengthOfCollection = response.data.totalCount || 0;
        this.applySorting();
        this.updateHeaderActionState();
      } else {
        this.appSettingService.showError('Error searching chart of account.');
        this.allItems = [];
        this.totalLengthOfCollection = 0;
      }
    }
  
    protected override handleSearchError(error: any): void {
      this.tableLoading = false;
      this.spinner.hide();
      this.appSettingService.showError('Error searching chart of account.');
      console.error('Error searching chart of account', error);
      super.handleSearchError(error);
    }
  
      onSearchTriggered(searchValue: string): void {
      this.filterValue = searchValue;
      this.searchChartAccounts();
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
          this.navigateToCreate();
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
  
    // Legacy methods for template compatibility
    searchChartAccounts() {
      this.search();
    }
  
    clearFilterValue() {
      this.clearFilter();
    }
  
    override trackBy(index: number, item: any): number {
      return item.COAMasterSid || index;
    }
  
    viewChartAccount(item: any): void {
      // this.router.navigate(['/pa/chart-accounts/entry', item.COAMasterSid]);
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
          key: ' ',
          label: 'Payment Voucher No.',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
         {
          key: ' ',
          label: 'Date',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: ' ',
          label: 'Currency',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: ' ',
          label: 'Amount',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: ' ',
          label: 'Vendor',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: ' ',
          label: 'Bank or Cash ',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
         {
          key: ' ',
          label: 'Post  Status ',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        
        {
          key: ' ',
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
        this.viewChartAccount(event.row);
      } else if (event.action === 'delete') {
        this.deleteBy(event.row);
      }
    }
  
    deleteBy(row: any) {
      // this.deleteChartAccount(row.COAMasterSid)
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
      const formattedData = this.Allpayment;
      const companyName = this.currentCompany?.companyName ?? 'Company';
  
      // Get visible columns in their current order from the table component
      const visibleColumns = this.paymentTable.getVisibleColumns();
      const dynamicHeaders = visibleColumns.map(column => ({
        key: column.key,
        label: column.label
      }));
  
      this.excelReportService.exportAsExcel({
        data: formattedData,
        headers: dynamicHeaders,
        fileName: 'Chart-Account-Report',
        title: companyName
      });
    }
    // loadChartAccounts(): void {
    //   this.spinner.show();
    //   let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    //   const params = {
    //     search: this.filterValue?.trim() || '',
    //     page: this.page,
    //     pageSize: this.pageSize,
    //     sortColumn: this.sortColumn,
    //     sortDirection: this.sortDirection,
    //     activeCompanyId: CompanyMasterSid,
    //   };
  
    //   this.masterService.searchCoa(params).subscribe({
    //     next: (response) => {
    //       if (response?.status) {
    //         this.chartAccountList = response.data.items;
    //         console.log(this.chartAccountList, "Chart");
  
    //         this.totalLengthOfCollection = response.data.totalCount;
    //         this.applySorting();
    //         this.searched = true;
    //       } else {
    //         this.appSettingService.showError(response.message);
    //       }
    //       this.spinner.hide();
    //     },
    //     error: (err) => {
    //       console.error('Error fetching chart accounts:', err);
    //       this.chartAccountList = [];
    //       this.totalLengthOfCollection = 0;
    //     }
    //   });
    // }
  
  
  //   deleteChartAccount(id: number) {
  //     const dialogRef = this.dialog.open(DeleteWarningComponent);
  
  //     dialogRef.afterClosed().subscribe(result => {
  //         if (result === true) {
  //             this.masterService.deleteCOA(id).subscribe(
  //                 (resp: any) => {
  //                     this.appSettingService.showSuccess("Chart Account Deleted!");
  //                     this.searchChartAccounts();
  //                 },
  //                 (error) => {
  //                     console.error('Error deleting Chart Account', error);
  //                     // Show specific error message for linked records
  //                     if (error.error && error.error.message) {
  //                         this.appSettingService.showError(error.error.message);
  //                     } else {
  //                         this.appSettingService.showError("Error Deleting Chart Account");
  //                     }
  //                 }
  //             );
  //         }
  //     });
  // }
    // softDeleteTaxGroup(id: number): void {
    //   const dialogRef = this.dialog.open(DeleteWarningComponent);
    //   dialogRef.afterClosed().subscribe((result) => {
    //     if (result === true) {
    //       this.masterService.deleteCOA(id).subscribe((resp: any) => {
    //         this.appSettingService.showSuccess('Deleted!');
    //         // this.loadChartAccounts();
    //       });
    //     }
    //   });
    // }
  
  
    // resetPage(): void {
    //   this.chartAccountList = [];
    //   this.totalLengthOfCollection = 0;
    //   this.sortColumn = 'Name';
    //   this.sortDirection = 'asc';
    //   this.searched = false;
    //   this.filterValue = '';
    //   this.loadChartAccounts();
    // }
  
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
    //   this.chartAccountList.sort((a, b) => {
    //     let valueA = a[this.sortColumn];
    //     let valueB = b[this.sortColumn];
  
    //     valueA = valueA ?? '';
    //     valueB = valueB ?? '';
  
    //     valueA = valueA.toString().toLowerCase();
    //     valueB = valueB.toString().toLowerCase();
  
    //     if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
    //     if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
    //     return 0;
    //   });
    // }
  
    updatePaginatedData(): void {
      const start = (this.page - 1) * this.pageSize;
      const end = start + this.pageSize;
      // this.loadChartAccounts();
    }
  
    trackByIndex(index: number, item: any): number {
      return index;
    }
  
    // report(): void {
    //   const formattedData = this.chartAccountList.map(item => ({
    //     ...item,
    //     status: item.status === 'A' ? 'Active' : 'Suspended'
    //   }));
  
    //   // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
    //   const companyName = this.currentCompany?.companyName ?? 'Company';
    //   this.excelReportService.exportAsExcel({
    //     data: formattedData,
    //     headers: [
    //       { key: 'LedgerName', label: 'Name' },
    //       { key: 'LedgerCode', label: 'Ledger Code' },
    //       { key: 'GroupName', label: 'Group' },
    //       { key: 'SubGroupName', label: 'Sub Group' },
    //       { key: 'status', label: 'Status' }
    //     ],
    //     fileName: 'Chart-of-Accounts-Report',
    //     title: companyName
    //   });
    // }
  
    navigateToCreate() {
      this.router.navigate(['accounts/payment/entry'])
    }
}
