import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { DatePipe } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';

@Component({
    selector: 'app-product-entry',
    standalone: true,
    imports: [FeatherModule, NgSelectModule,ReactiveFormsModule,OnlyTextDirective,OnlyNumbersDirective,TextWithNumbersDirective,DatePipe],
    templateUrl: './product-entry.component.html',
    styleUrl: './product-entry.component.scss',
})
export class ProductEntryComponent implements OnInit{

    productForm !:FormGroup;
    isEditMode : boolean;
    ProductMasterSId : number;
    UOMList : any[];
    hsnList: any[];
    productData: any;

    // modeOfUOM = [
    //     { id: '1', name: 'Days' },
    //     { id: '2', name: 'Shipment' },
    //     { id: '3', name: 'KG' },
    //     { id: '4', name: 'CBMS' },
    //     { id: '5', name: 'Per Unit' },
    //     { id: '6', name: 'Per MT' },
    //     { id: '7', name: 'Per Ton' },
    //     { id: '8', name: 'Per Cntr' },
    //     { id: '9', name: 'Teu' },
    // ];
    modeOfProductType = [
        { id: "1", name: "General" },
        { id: "2", name: "Haz" },
        { id: "3", name: "Frozen" },
    ]
    modeOfStatus = [
    { name: 'Active', value: 'Active' },
    { name: 'Suspended', value: 'Suspended' },
  ]
    currentMenuId: number;
    TandCList: any;

    constructor(
        private masterService:MasterService,
        private appSettingService:AppSettingsService,
        private currentRoute : ActivatedRoute,
        private route:Router,
        private fb:FormBuilder,
        private modalService : NgbModal
    ){}

    ngOnInit(): void {
        this.initProductForm();
        this.getAllUom();
        this.getAllHSN();
        this.currentRoute.paramMap.subscribe(
            (param)=>{
                this.ProductMasterSId = +param.get('id')
                if(this.ProductMasterSId){
                    this.isEditMode = true;
                    this.loadProductData();
                }
            }
        )
    }

    initProductForm(){
        this.productForm = this.fb.group({
            ProductName:['',[Validators.required]],
            ProductCode:['',[Validators.required]],
            Product_LL : [''],
            UOMCode : [''],
            ProductId : [''],
            PackingGroup :[''],
            Description : [''],
            ProductType : [''],
            UNNo : [''],
            UNPackingCode : [''],
            IMOClass : [''],
            IMOSubClass : [''],
            FlashPoint : [''],
            
            HSNCode : [''],
            status : ['Active'],

        })
    }


    loadProductData(){
        let ourProduct :any;
        this.masterService.getProductById(this.ProductMasterSId).subscribe(
            (resp:any)=>{
                this.productData = resp.data;
                this.productForm.patchValue({
                    ...resp.data,
                    status : resp.data.status === 'A' ? 'Active' : 'Suspended'
                })
            },
            (error)=>{
                console.error('Error Loading Product',error);
            }
        )
        return ourProduct
    }

    getAllUom(){
        this.masterService.getAllUom().subscribe(
            (resp)=>{
                this.UOMList=resp.data;
            },
            (error)=>{
                console.error('Error Loading UOM',error);
            }
        )
    }

    

    onSubmit(){
        if(this.productForm.invalid){
            this.productForm.markAllAsTouched();
            this.productForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields');
            return;
        }
        else {
            const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
            const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
            const formValue = this.productForm.value;
            const payload = this.isEditMode ? {
                ...formValue,
                UNNo : parseInt(formValue.UNNo),
                status : formValue.status === 'Active' ? 'A' : 'S',
                updatedBy:updatedBy
            } : {
                ...formValue,
                UNNo : parseInt(formValue.UNNo),
                status : formValue.status === 'Active' ? 'A' : 'S',
                createdBy:createdBy
            }
            if(this.isEditMode){
                this.masterService.updateProductById(this.ProductMasterSId,payload).subscribe(
                    (resp:any)=>{
                        if(resp.status){
                            this.appSettingService.showSuccess('Product Updated Successfully');
                            this.route.navigate(['master/product/list']);
                        } else {
                            this.appSettingService.showWarning('Error Updating Product');
                        }
                    },
                    (error)=>{
                        console.error('Error Updating Product',error);
                    }
                )
            } else {
                this.masterService.createNewProduct(payload).subscribe(
                    (resp:any)=>{
                        if(resp.status){
                            this.appSettingService.showSuccess('Product Created Successfully');
                            this.route.navigate(['master/product/list']);
                        } else {
                            this.appSettingService.showWarning('Error Creating Product');
                        }
                    },
                    (error)=>{
                        console.error('Error Creating Product',error);
                    }
                )
            }
        }
    }

    resetForm(){
        this.productForm.reset({
            status : 'Active'
        });
    }


    navigateBack() {
        history.back();
    }

    getAllHSN(){
        this.masterService.getAllHssac().subscribe(
            (resp:any)=>{
                this.hsnList = resp;
            },
            (error)=>{
                console.error('Error Loading Charge Tax',error);
            }
        )
    }

    showInfo() {
        if (!this.productData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.productData;
        modalRef.componentInstance.idLabel = 'Product Id';
        modalRef.componentInstance.idValue = this.productData?.ProductMasterSId;
    }

    openTandC() {
		this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
		const payload = { MenuMasterSid: this.currentMenuId };
		this.masterService.getTandCByCondition(payload).subscribe(
			(resp: any) => {
				if (resp.status) {
					this.TandCList = resp.data;
					const modalRef = this.modalService.open(TermsAndConditionsComponent, {
						size: 'lg',
						backdrop: 'static',
						centered: true
					});
					modalRef.componentInstance.terms = this.TandCList;
					modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
					modalRef.componentInstance.DocumentSid = this.ProductMasterSId;

				} else {
					this.appSettingService.showError('Error loading Terms and Conditions');
				}
			},
			(error) => {
				this.appSettingService.showError('Error loading Terms and Conditions', error);
			}
		);
	}
    openEmail() {
        if (!this.productData) return;
        const modalRef = this.modalService.open(EmailEntryComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });
    }

openAuthority() {
  if (!this.productData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.productData;
  modalRef.componentInstance.idLabel = 'Product Id';
  modalRef.componentInstance.idValue = this.productData?.ProductMasterSId;
}

openEDoc() {
  if (!this.productData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.productData;
  modalRef.componentInstance.idLabel = 'Product Id';
  modalRef.componentInstance.idValue = this.productData?.ProductMasterSId;
}


}
