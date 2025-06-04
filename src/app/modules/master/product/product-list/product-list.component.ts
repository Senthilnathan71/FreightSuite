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


    // Pagination Related Data
    page = 1;
    pageSize = 10;
    totalAmountOfCollection :number;

    constructor(
        private router: Router,
        private masterService: MasterService,
        private appSettingService: AppSettingsService,
        private dialog: MatDialog,
    ) { }


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

    report(){

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

}
