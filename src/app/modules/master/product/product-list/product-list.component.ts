import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { Product } from 'src/app/modules/crm-mobile/Interfaces/product.interface';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [
        FeatherModule,
        RouterModule,
        FormsModule,
        CommonModule,
        NgbPaginationModule,
        ListpageComponent,
        FavoriteStarComponent,
        NgxSpinnerModule,
        PageHeaderComponent,
        ReusableTableComponent
    ],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.scss'
})
export class ProductListComponent extends BaseListComponent implements OnInit {
    @ViewChild('productTable') productTable!: ReusableTableComponent;
    searchType: string = "ProductName";
    // filterValue: any;
    productList: Product[];
    slicedProductList: Product[];
    searched: boolean = false;
    userData: any;
    modeOfProductType = [
        { id: "1", name: "General" },
        { id: "2", name: "Haz" },
        { id: "3", name: "Frozen" },
    ]
    permissions: string[] = [];
    currentMenuPermissions: any = {};
    headerActions: HeaderAction[] = [];
    // Pagination Related Data
    // page = 1;
    // pageSize = 15;
    // totalAmountOfCollection: number;

    isFavorite: boolean = false;
    allProducts: Product[] = [];
    // sortColumn: string = 'ProductName';
    // sortDirection: string = 'asc';
    // Company
    currentCompany: any;
    currentBranch: any;
    toggleFavorite() {
        this.isFavorite = !this.isFavorite;
    }
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
                tooltip: 'Delete',
                class: "text-danger",
                condition: (row: any) => this.hasPermission('Delete')
            }
        ],
        selectable: false,
        multiSelect: false,
        showColumnToggle: true,
        showFilters: true,
        showPagination: true,
        trackByKey: 'ProductMasterSId',
        emptyMessage: 'No product found',
        dragAndDrop: true
    };

    tableLoading = false;

    protected config: ListComponentConfig = {
        storageKey: 'product-list-state',
        defaultPageSize: 10,
        defaultSortColumn: 'ProductName',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100, 500],
        maxPagesToShow: 3
    };

    // Alias for compatibility with existing template
    get allProduct() { return this.allItems; }
    constructor(
        private router: Router,
        private masterService: MasterService,
        private appSettingService: AppSettingsService,
        private dialog: MatDialog,
        private userService: authService,
        private excelReportService: ExcelExportService,
        private spinner: NgxSpinnerService,
        paginationService: PaginationService,
        // private datePipe: CustomDatePipe,
    ) {
        super(paginationService);
    }

    override ngOnInit(): void {
        // this.appSettingService.getUser().subscribe(
        //     user=>{
        //         if(user){
        //             this.userData = user;
        //             console.log(this.userData,'UserData')
        //             this.checkPermissions();
        //         }
        //     }
        // );
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        const userProfile = this.appSettingService.getDecryptedUserProfile();
        if (userProfile) {
            this.userData = userProfile;
            this.checkPermissions();
        }
        // this.loadProducts();
        // Initialize table configuration
        this.initializeTableConfig();
            this.initializeHeaderActions();
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
                }
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
        return this.masterService.searchProductList(this.getSearchParams());
    }

    protected getSearchParams(): SearchParams {
        return {
            search: this.filterValue.trim(),
            page: Number(this.page),
            pageSize: Number(this.pageSize),
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
                status: item.status === 'A' ? 'Active' : 'Suspended',
                ProductType: this.getProductType(item.ProductType),
                // ReceivedDate: this.datePipe.transform(item?.ReceivedDate)
            }));
            this.totalLengthOfCollection = response.data.totalCount || 0;
            this.applySorting();
             this.updateHeaderActionState();
        } else {
            this.appSettingService.showError('Error searching product.');
            this.allItems = [];
            this.totalLengthOfCollection = 0;
        }
    }

    protected override handleSearchError(error: any): void {
        this.tableLoading = false;
        this.spinner.hide();
        this.appSettingService.showError('Error searching product.');
        console.error('Error searching product', error);
        super.handleSearchError(error);
    }

      onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.searchProduct();
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


  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this. navigateTocreateProduct()
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
    searchProduct() {
        this.search();
    }

    clearFilterValue() {
        this.clearFilter();
    }

    override trackBy(index: number, item: any): number {
        return item.ProductMasterSid || index;
    }


    viewProduct(row: any): void {
        this.router.navigate(['/master/product/entry/', row.ProductMasterSId]);
    }


    // Table configuration
    private initializeTableConfig(): void {
        this.tableConfig.columns = [

            {
                key: 'ProductName',
                label: 'Product Name',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string'
            },
            {
                key: 'ProductCode',
                label: 'Product Code',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string'
            },
            {
                key: 'ProductType',
                label: 'Type',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string'
            },
            {
                key: 'UOMCode',
                label: ' UOM',
                sortable: true,
                filterable: true,
                visible: true,
                dataType: 'string'
            },
              {
                key: 'HSNCode',
                label: 'HSN Code',
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
            this.viewProduct(event.row);
        } else if (event.action === "delete") {
            this.deleteBy(event.row)
        }
    }

    deleteBy(row: any) {
        this.deleteProductById(row.ProductMasterSid)
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
        const formattedData = this.allProduct;
        

        // Get visible columns in their current order from the table component
        const visibleColumns = this.productTable.getVisibleColumns();
        const dynamicHeaders = visibleColumns.map(column => ({
            key: column.key,
            label: column.label
        }));

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: dynamicHeaders,
            fileName: 'Product-Report',
           
        });
    }

    // loadProducts(): void {
    //     this.spinner.show();
    //     let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    //     const params = {
    //         search: this.filterValue?.trim() || '',
    //         page: this.page,
    //         pageSize: this.pageSize,
    //         activeCompanyId: CompanyMasterSid,
    //     };

    //     this.masterService.searchProductList(params).subscribe({
    //         next: (response) => {
    //             if (response.status) {
    //                 this.productList = response.data.items;
    //                 // this.totalAmountOfCollection = response.data.totalCount;
    //                 this.applySorting();
    //                 this.updatePaginationData();
    //                 this.searched = true;
    //             } else {
    //                 this.appSettingService.showError(response.message);
    //             }
    //             this.spinner.hide();
    //         },
    //         error: (err) => {
    //             console.error('Error fetching products:', err);
    //             this.productList = [];
    //             // this.totalAmountOfCollection = 0;
    //         },
    //     });
    // }


    // sort(column: string) {
    //     if (this.sortColumn === column) {
    //         // Reverse the sort direction if clicking the same column
    //         this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    //     } else {
    //         // Set new sort column and default to ascending
    //         this.sortColumn = column;
    //         this.sortDirection = 'asc';
    //     }

    //     this.applySorting();
    //     this.updatePaginationData();
    // }

    // applySorting() {
    //     if (!Array.isArray(this.productList)) {
    //         this.productList = [];
    //         return;
    //     }
    //     this.productList.sort((a, b) => {
    //         let valueA = a[this.sortColumn];
    //         let valueB = b[this.sortColumn];

    //         // Special handling for ProductType which is numeric
    //         if (this.sortColumn === 'ProductType') {
    //             valueA = this.getProductType(valueA);
    //             valueB = this.getProductType(valueB);
    //         }

    //         // Handle null/undefined values
    //         if (valueA == null) valueA = '';
    //         if (valueB == null) valueB = '';

    //         // Convert to string for case-insensitive comparison
    //         valueA = valueA.toString().toLowerCase();
    //         valueB = valueB.toString().toLowerCase();

    //         if (valueA < valueB) {
    //             return this.sortDirection === 'asc' ? -1 : 1;
    //         }
    //         if (valueA > valueB) {
    //             return this.sortDirection === 'asc' ? 1 : -1;
    //         }
    //         return 0;
    //     });

    //     // Update pagination after sorting
    // }
    navigateTocreateProduct() {
        this.router.navigate(["master/product/entry"])
    }


    reset() {
        this.productList = [];
        this.slicedProductList = [];
        // this.totalAmountOfCollection = 0;
        this.searched = false;
        this.filterValue = '';
        this.searchType = 'ProductName';
        this.page = 1;
        this.sortColumn = 'ProductName';
        this.sortDirection = 'asc';
        // this.loadProducts();
// 
    }

    deleteProductById(ProductMasterSid) {
        const modalRef = this.dialog.open(DeleteWarningComponent);
        modalRef.afterClosed().subscribe(
            (res) => {
                if (res) {
                    this.masterService.deleteProductById(ProductMasterSid).subscribe(
                        (resp: any) => {
                            if (resp.status) {
                                this.appSettingService.showSuccess('Product Deleted Successfully');
                                // this.loadProducts();
                                this.searchProduct();
                            } else {
                                console.error('Error Deleting Product', resp.message);
                            }
                        },
                        (error) => {
                            this.appSettingService.showError('Error Deleting Product')
                        }
                    )
                }
            }
        )
    }


    updatePaginationData() {
        let start = (this.page - 1) * this.pageSize;
        let end = start + this.pageSize;
        this.slicedProductList = this.productList.slice(start, end);
    }

    // report(): void {
    //     const formattedData = this.productList.map(item => ({
    //         ...item,
    //         type: this.getProductType(item.ProductType),
    //         status: item.status === 'A' ? 'Active' : 'Suspended',

    //     }));

    //     // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
    //     const companyName = this.currentCompany?.companyName ?? 'Company';
    //     this.excelReportService.exportAsExcel({
    //         data: formattedData,
    //         headers: [
    //             { key: 'ProductName', label: 'Product Name' },
    //             { key: 'ProductCode', label: 'Product Code' },
    //             { key: 'type', label: 'Type' },
    //             { key: 'UOMCode', label: 'UOM' },
    //             { key: 'HSNCode', label: 'HSN Code' },
    //             { key: 'status', label: 'Status' }

    //         ],
    //         fileName: 'Product-Report',
    //         title: companyName
    //     });
    // }

    getProductType(id: string | number): string {
  if (!id) return 'Unknown';
  
  const productType = this.modeOfProductType.find(type => type.id === id.toString());
  return productType?.name ;
}

    // clearFilterValue() {
    //     this.filterValue = '';
    // }

}
