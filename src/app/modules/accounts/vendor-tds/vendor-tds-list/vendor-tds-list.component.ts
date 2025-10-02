import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { AccountsService } from '../../accounts.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CommonModule } from '@angular/common';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { Observable } from 'rxjs';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';

@Component({
  selector: 'app-vendor-tds-list',
  standalone: true,
  imports: [
    FeatherModule,
    FavoriteStarComponent,
    CommonModule,
    FormsModule,
    RouterModule,
    NgbPaginationModule,
    NgxSpinnerModule,
    CommonPaginationComponent,
    ReusableTableComponent
  ],
  templateUrl: './vendor-tds-list.component.html',
  styleUrl: './vendor-tds-list.component.scss'
})
export class VendorTdsListComponent extends BaseListComponent implements OnInit {
  @ViewChild('supplierTdsTable') supplierTdsTable!: ReusableTableComponent;
  // Variable Declaring Section

  // filterValue = '';
  // allSupplierTDS: any[] = [];
  // searchPerformed: boolean;
  userData: any;

  permissions: string[] = [];
  currentMenuPermissions: any = {};

  // Pagination related Declaring
  // page = 1;
  // pageSize = 10;
  // totalLengthOfCollection: number;

  // Sorting related declaration
  // sortColumn: string = 'CustomerName';
  // sortDirection: string = 'desc';

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
    trackByKey: 'SupplierTdsMappingSid',
    emptyMessage: 'No supplier-tds found',
    dragAndDrop: true
  };

  tableLoading = false;
  protected config: ListComponentConfig = {
    storageKey: 'Supplier-tds-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'CustomerName',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };
  get allSupplierTDS() { return this.allItems; }
  constructor(
    private accountService: AccountsService,
    private router: Router,
    private appSettingService: AppSettingsService,
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
    this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
        this.checkPermissions();
      }
    })
    // this.searchSupplierTDS();
    this.initializeTableConfig();
    super.ngOnInit();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId);
    console.log(userRole);
    if (currentMenuId && userRole) {
      this.accountService
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

  // Search
  // searchSupplierTDS() {
  //     this.spinner.show();
  //     let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //     const params = {
  //         search: this.filterValue.trim() || '',
  //         page: this.page,
  //         pageSize: this.pageSize,
  //         activeCompanyId : CompanyMasterSid,
  //     }
  //     this.accountService.searchSupplierTDS(params).subscribe({
  //         next : (resp: any) => {
  //             if (resp.status) {
  //                 this.allSupplierTDS = resp.data?.items.map(data => {
  //                     return {
  //                         SupplierTdsMappingSid: data.SupplierTdsMappingSid,
  //                         SupplierName: data.customerMaster?.CustomerName,
  //                         PanNo: data.customerMaster?.PanName,
  //                         CompanyType: data?.CompanyType,
  //                         CountryName: data.customerMaster?.countryMaster?.countryName,
  //                         status : data.Status === 'A' ? 'Active' : 'Suspended'
  //                     }
  //                 });
  //                 console.log(this.allSupplierTDS);
  //                 this.totalLengthOfCollection = resp.data?.totalCount || 0;
  //                 this.applySorting();
  //                 this.searchPerformed = true;
  //             } else {
  //                 this.appSettingService.showError(resp.message);
  //                 console.error('Error searching supplier TDS mapping', resp.message)
  //                 this.allSupplierTDS = [];
  //                 this.totalLengthOfCollection = 0;
  //             }
  //             this.spinner.hide();
  //         }, error : (error: any) => {
  //             console.error(error);
  //         }
  //     })
  // }
  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.accountService.searchSupplierTDS(this.getSearchParams());
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
      this.allItems = (response.data.items || []).map((data: any) => {
        return {
          SupplierTdsMappingSid: data.SupplierTdsMappingSid,
          SupplierName: data.customerMaster?.CustomerName,
          PanNo: data.customerMaster?.PanName,
          CompanyType: data?.CompanyType,
          CountryName: data.customerMaster?.countryMaster?.countryName,
          status: data.Status === 'A' ? 'Active' : 'Suspended'
        };
      });

      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
    } else {
      this.appSettingService.showError('Error fetching Supplier TDS mapping.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }


  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error fetching Supplier TDS mapping.');
    console.error('Error fetching Supplier TDS mapping', error);
    super.handleSearchError(error);
  }

  searchSupplierTdsMapping() {
    this.page = 1;
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  updatePaginationData(): void {
    this.search();
  }
  SupplierTdsMappingSid(index: number, item: any): number {
    return index;
  }
  override trackBy(index: number, item: any): number {
    return item.SupplierTdsMappingSid || index;
  }

  viewSupplier(item: any): void {
    this.router.navigate(['/accounts/supplier-tds/entry', item.SupplierTdsMappingSid]);
  }


  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [

      {
        key: 'SupplierName',
        label: 'Supplier Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'PanNo',
        label: 'PAN No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'CompanyType',
        label: 'Company Type',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'CountryName',
        label: 'Country ',
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
      this.viewSupplier(event.row);
    } else if (event.action === 'delete') {
      this.deleteBy(event.row);
    }
  }

  deleteBy(row: any) {
    this.deleteSupplierTDS(row.SupplierTdsMappingSid)
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
    const formattedData = this.allSupplierTDS;
    const companyName = this.currentCompany?.companyName ?? 'Company';

    // Get visible columns in their current order from the table component
    const visibleColumns = this.supplierTdsTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map(column => ({
      key: column.key,
      label: column.label
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: dynamicHeaders,
      fileName: 'supplier-Tds-Report',
      title: companyName
    });
  }

  //  Deletes an item
  deleteSupplierTDS(SupplierTdsMappingSid: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.accountService.deleteSupplierTDSById(SupplierTdsMappingSid).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess('Supplier TDS deleted successfully.');
              // this.searchSupplierTDS();
            } else {
              this.appSettingService.showError('Error deleting supplier TDS.')
              console.error('Error deleting supplier TDS', resp.message);
            }
          },
          (error: any) => {
            this.appSettingService.showError('Error deleting supplier TDS.')
            console.error("Error deleting supplier TDS.", error)
          }
        )
      }
    })
  }

  // Sorting related Function
  // sort(column: string) {
  //     if (this.sortColumn === column) {
  //         this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //     } else {
  //         this.sortColumn = column;
  //         this.sortDirection = 'asc';
  //     }
  //     this.applySorting();
  // }

  // applySorting() {
  //     this.allSupplierTDS.sort((a, b) => {
  //         let valueA = a[this.sortColumn];
  //         let valueB = b[this.sortColumn];

  //         if (valueA == null) valueA = '';
  //         if (valueB == null) valueB = '';

  //         if (typeof valueA !== 'number' && !(valueA instanceof Date)) {
  //             valueA = valueA.toString().toLowerCase();
  //             valueB = valueB.toString().toLowerCase();
  //         }

  //         if (valueA < valueB) {
  //             return this.sortDirection === 'asc' ? -1 : 1;
  //         }
  //         if (valueA > valueB) {
  //             return this.sortDirection === 'asc' ? 1 : -1;
  //         }
  //         return 0;
  //     })
  // }

  // updatePaginationData(): void {
  //     this.searchSupplierTDS();
  // }

  // trackBy(index: number, item: any): number {
  //     return item.SupplierTdsMappingSid || index;
  // }

  // clearFilterValue() {
  //     this.filterValue = '';
  //     this.searchSupplierTDS();
  // }


  navigateToCreateVendorTDS() {
    this.router.navigate(['accounts/supplier-tds/entry'])
  }

  // resetPage(){
  //     this.filterValue = '';
  //     this.page = 1;
  //     this.searchPerformed = false;
  //     this.allSupplierTDS = [];
  //     this.totalLengthOfCollection = 0;
  //     this.sortColumn = 'CustomerName';
  //     this.sortDirection = 'desc';
  //     this.searchSupplierTDS();
  // }

  // report(): void {
  //   const formattedData = this.allItems;
  //   // SupplierName , PanNo,CompanyType , CountryName , status
  //   // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  //   const companyName = this.currentCompany?.companyName ?? 'Company';
  //   this.excelReportService.exportAsExcel({
  //     data: formattedData,
  //     headers: [
  //       { key: 'SupplierName', label: 'Supplier Name' },
  //       { key: 'PanNo', label: 'PAN No' },
  //       { key: 'CompanyType', label: 'Company Type' },
  //       { key: 'CountryName', label: 'Country' },
  //       { key: 'status', label: 'Status' },
  //     ],
  //     fileName: 'Supplier-TDS-Report',
  //     title: companyName
  //   });
  // }

}
