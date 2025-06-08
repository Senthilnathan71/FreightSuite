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

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    FeatherModule,
    RouterModule,
    FormsModule,
    CommonModule,
    NgbPaginationModule
],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent {

    searchType : string = "ProductName";
    filterValue : any;
    productList : Product[];
    slicedProductList: Product[];
    searchPerformed : boolean;
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
        )
    }

    onSearch(){        
        const payload = {
            searchType : this.searchType,
            filterValue : this.filterValue
        }
        this.masterService.searchProducts(payload).subscribe(
            (resp:any)=>{
                this.productList = resp.data;
                this.searchPerformed = true;
                this.updatePaginationData();
                this.totalAmountOfCollection = this.productList.length || 0;
            }
        )
    }

    navigateTocreateProduct(){
        this.router.navigate(["master/product/entry"])
    }


    reset(){
        this.productList =[];
        this.slicedProductList = [];
        this.totalAmountOfCollection = 0;
        this.searchPerformed = false;
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
                                this.onSearch();
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


    updatePaginationData(){
        let start = (this.page-1)*this.pageSize;
        let end = start + this.pageSize;
        this.slicedProductList = this.productList.slice(start,end);
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

}
