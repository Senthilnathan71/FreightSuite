import { Component } from '@angular/core';
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
    FavoriteStarComponent
],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent {

    searchType : string = "ProductName";
    filterValue : any;
    productList : Product[];
    slicedProductList: Product[];
    searched : boolean = false;
    userData:any;
    modeOfProductType = [
        { id: "1", name: "General" },
        { id: "2", name: "Haz" },
        { id: "3", name: "Frozen" },
    ]


    // Pagination Related Data
    page = 1;
    pageSize = 10;
    totalAmountOfCollection :number;
   
    isFavorite: boolean = false;
    allProducts: Product[] = [];
    sortColumn: string = 'ProductName'; 
    sortDirection: string = 'asc';

    toggleFavorite() {
        this.isFavorite = !this.isFavorite;
    } 
    
    constructor(
        private router: Router,
        private masterService: MasterService,
        private appSettingService: AppSettingsService,
        private dialog: MatDialog,
        private userService : authService,
        private excelReportService : ExcelExportService
    ) { }

    ngOnInit(): void {
        this.appSettingService.getUser().subscribe(
            user=>{
                if(user){
                    this.userData = user;
                    console.log(this.userData,'UserData')
                }
            }
        );
        this.loadProducts();
    }


    loadProducts(): void {
        
        const params = {
            search: this.filterValue?.trim() || '',
            page: this.page,
            pageSize: this.pageSize,
        };

        this.masterService.searchProductList(params).subscribe({
            next: (response) => {
                if(response.data){
                    this.productList = response.data.items;
                    this.totalAmountOfCollection = response.data.totalCount;
                    this.applySorting();
                    this.updatePaginationData();
                    this.searched = true;
                }
            },
            error: (err) => {
                console.error('Error fetching products:', err);
                this.productList = [];
                this.totalAmountOfCollection = 0;
            },
        });
    }

   
    sort(column: string) {
        if (this.sortColumn === column) {
            // Reverse the sort direction if clicking the same column
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // Set new sort column and default to ascending
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        this.applySorting();
        this.updatePaginationData();
    }

    applySorting() {
        if (!Array.isArray(this.productList)){
            this.productList = [];
            return;
        }
    this.productList.sort((a, b) => {
        let valueA = a[this.sortColumn];
        let valueB = b[this.sortColumn];
        
        // Special handling for ProductType which is numeric
        if (this.sortColumn === 'ProductType') {
            valueA = this.getProductType(valueA);
            valueB = this.getProductType(valueB);
        }
        
        // Handle null/undefined values
        if (valueA == null) valueA = '';
        if (valueB == null) valueB = '';
        
        // Convert to string for case-insensitive comparison
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();
    
        if (valueA < valueB) {
            return this.sortDirection === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return this.sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });
    
    // Update pagination after sorting
}
    navigateTocreateProduct(){
        this.router.navigate(["master/product/entry"])
    }


    reset(){
        this.productList =[];
        this.slicedProductList = [];
        this.totalAmountOfCollection = 0;
        this.searched = false;
        this.filterValue = '';
        this.searchType = 'ProductName';
        this.page = 1;
        this.sortColumn = 'ProductName';
        this.sortDirection = 'asc';
        
    }

    deleteProductById(ProductMasterSid){
        const modalRef = this.dialog.open(DeleteWarningComponent);
        modalRef.afterClosed().subscribe(
            (res)=>{
                if(res){
                    this.masterService.deleteProductById(ProductMasterSid).subscribe(
                        (resp:any)=>{
                            if(resp.status){
                                this.appSettingService.showSuccess('Product Deleted Successfully');
                                this.loadProducts();
                            } else {
                                console.error('Error Deleting Product',resp.message);
                            }
                        },
                        (error)=>{
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

    report(): void {
        const formattedData = this.productList.map(item => ({
            ...item,
            type : this.getProductType(item.ProductType),
            status: item.status === 'A' ? 'Active' : 'Suspended',
            
        }));

        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'ProductName', label: 'Product Name' },
                { key: 'ProductCode', label: 'Product Code' },
                { key: 'type', label: 'Type' },
                { key: 'UOMCode', label: 'UOM' },
                { key: 'HSNCode', label: 'HSN Code' },
                { key: 'status', label: 'Status' }
                
            ],
            fileName: 'Product-Report', 
            title: companyName
        });
    }
    
    getProductType(id){
        return this.modeOfProductType.find(type => type.id === id).name;
    }

    clearFilterValue() {
    this.filterValue = '';
  }

}
