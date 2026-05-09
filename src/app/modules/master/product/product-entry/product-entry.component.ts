import { Component, HostListener, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { CommonModule, DatePipe } from '@angular/common';
import { NgbDropdownModule, NgbModal ,NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { debounceTime, Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-product-entry',
    standalone: true,
    imports: [FeatherModule, NgSelectModule,ReactiveFormsModule,OnlyTextDirective,OnlyNumbersDirective,TextWithNumbersDirective,DatePipe,CommonModule,NgbDropdownModule,SearchableDropdown],
    templateUrl: './product-entry.component.html',
    styleUrl: './product-entry.component.scss',
})
export class ProductEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges{

    productForm !:FormGroup;
    isEditMode : boolean;
    ProductMasterSId : number;
    UOMList : any[];
    hsnList: any[];
    productData: any;
    auditLogs: any[] = []; // Stores audit logs
    auditLogModalRef!: NgbModalRef;
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
    permissions: string[] = [];
    currentMenuPermissions: any = {};
    userData:any;
    currentCompany:any;
    currentBranch:any;
    MenuMasterSid: any;
    HSSACLookupConfig = DROPDOWN_CONFIGS.HSSAC;
    uomLookupConfig = DROPDOWN_CONFIGS.UOM;
    isDirty: boolean = false;
    isSaving: boolean = false;
    private initialFormValue: any = null;
    private destroy$ = new Subject<void>();
    constructor(
        public mps : MenuPermissionService, 
        private masterService:MasterService,
        private appSettingService:AppSettingsService,
        private currentRoute : ActivatedRoute,
        private route:Router,
        private fb:FormBuilder,
        private modalService : NgbModal,
        private commonService: CommonService,
    ){}

    ngOnInit(): void {
        
   this.mps.init().subscribe();
         this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
        this.initProductForm();
        this.initialFormValue = this.productForm.getRawValue();
        this.subscribeToFormChanges();
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
//          this.appSettingService.getUser().subscribe(user => {
//     if (user) {
//       this.userData = user;
//      
//     }
//   });
const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
    
		}
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: BeforeUnloadEvent): void {
      if (this.hasUnsavedChanges()) {
        $event.preventDefault();
        $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    }

    hasUnsavedChanges(): boolean {
      return this.isDirty;
    }

    async saveChanges(): Promise<boolean> {
      return new Promise((resolve) => {
        this.onSubmit(resolve);
      });
    }

    private subscribeToFormChanges(): void {
      this.productForm.valueChanges
        .pipe(takeUntil(this.destroy$), debounceTime(300))
        .subscribe(() => {
          this.isDirty = !this.deepEqual(this.initialFormValue, this.productForm.getRawValue());
        });
    }

    private normalizeValue(value: any): any {
      if (value === null || value === undefined) return null;
      if (value instanceof Date) return value.toISOString().split('T')[0];
      if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) return Number(value);
      if (typeof value === 'number') return Number(value.toFixed(6));
      if (Array.isArray(value)) return value.map((v) => this.normalizeValue(v));
      if (typeof value === 'object') {
        return Object.keys(value).sort().reduce((acc: any, key) => {
          acc[key] = this.normalizeValue(value[key]);
          return acc;
        }, {});
      }
      return value;
    }

    private deepEqual(obj1: any, obj2: any): boolean {
      const normalizedObj1 = this.normalizeValue(obj1);
      const normalizedObj2 = this.normalizeValue(obj2);
      return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
    }

   
            
            hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
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
                });
                this.initialFormValue = this.productForm.getRawValue();
                this.isDirty = false;
                this.productForm.markAsPristine();
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

    

    onSubmit(resolve?: (value: boolean) => void){
        if(this.productForm.invalid){
            this.productForm.markAllAsTouched();
            this.productForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields');
            if (resolve) resolve(false);
            return;
        }

        const raw = this.productForm.getRawValue();
        if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
            this.appSettingService.showWarning('No changes to save');
            if (resolve) resolve(false);
            return;
        }
        if (this.isSaving) {
            if (resolve) resolve(false);
            return;
        }

        this.isSaving = true;
        const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
        const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
        const formValue = raw;
        const payload = this.isEditMode ? {
            ...formValue,
            UNNo : parseInt(formValue.UNNo),
            status : formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
            updatedBy:updatedBy
        } : {
            ...formValue,
            UNNo : parseInt(formValue.UNNo),
            status : formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
            createdBy:createdBy,
           
        }
        if(this.isEditMode){
            this.masterService.updateProductById(this.ProductMasterSId,payload).subscribe(
                (resp:any)=>{
                    this.isSaving = false;
                    if(resp.status){
                        this.appSettingService.showSuccess(resp.message);
                        this.isDirty = false;
                        this.initialFormValue = this.productForm.getRawValue();
                        if (resolve) resolve(true);
                        this.route.navigate(['master/product/list']);
                    } else {
                        this.appSettingService.showError(resp.message);
                        if (resolve) resolve(false);
                    }
                },
                (error)=>{
                    this.isSaving = false;
                    console.error('Error Updating Product',error);
                    if (resolve) resolve(false);
                }
            )
        } else {
            this.masterService.createNewProduct(payload).subscribe(
                (resp:any)=>{
                    this.isSaving = false;
                    if(resp.status){
                        this.appSettingService.showSuccess(resp.message);
                        this.isDirty = false;
                        this.initialFormValue = this.productForm.getRawValue();
                        if (resolve) resolve(true);
                        this.route.navigate(['master/product/list']);
                    } else {
                        this.appSettingService.showError(resp.message);
                        if (resolve) resolve(false);
                    }
                },
                (error)=>{
                    this.isSaving = false;
                    console.error('Error Creating Product',error);
                    if (resolve) resolve(false);
                }
            )
        }
    }

    // resetForm(){
    //     this.productForm.reset({
    //         status : 'Active'
    //     });
    // }

    resetForm() {
  // If editing an existing product, reload it (restore original state)
  if (this.isEditMode && this.ProductMasterSId) {
    this.loadProductData();
    return;
  }

  // Create-mode: reset form to sensible defaults
  this.productForm.reset({
    ProductName: '',
    ProductCode: '',
    Product_LL: '',
    UOMCode: '',
    ProductId: '',
    PackingGroup: '',
    Description: '',
    ProductType: '',
    UNNo: '',
    UNPackingCode: '',
    IMOClass: '',
    IMOSubClass: '',
    FlashPoint: '',
    HSNCode: '',
    status: 'Active'
  });

  // Clear any validation errors
  this.productForm.markAsUntouched();
  this.productForm.markAsPristine();
  this.productForm.updateValueAndValidity();
  this.initialFormValue = this.productForm.getRawValue();
  this.isDirty = false;

  // Reset any additional component state if needed
  this.productData = null;
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

    // openTandC() {
	// 	this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
	// 	const payload = { MenuMasterSid: this.currentMenuId };
	// 	this.masterService.getTandCByCondition(payload).subscribe(
	// 		(resp: any) => {
	// 			if (resp.status) {
	// 				this.TandCList = resp.data;
	// 				const modalRef = this.modalService.open(TermsAndConditionsComponent, {
	// 					size: 'lg',
	// 					backdrop: 'static',
	// 					centered: true
	// 				});
	// 				modalRef.componentInstance.terms = this.TandCList;
	// 				modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
	// 				modalRef.componentInstance.DocumentSid = this.ProductMasterSId;

	// 			} else {
	// 				this.appSettingService.showError('Error loading Terms and Conditions');
	// 			}
	// 		},
	// 		(error) => {
	// 			this.appSettingService.showError('Error loading Terms and Conditions', error);
	// 		}
	// 	);
	// }
    openEmail() {
        if (!this.productData) return;
        const modalRef = this.modalService.open(EmailEntryComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });
    }

  openAuthority() {
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
   const modalRef = this.modalService.open(AuthorityLogComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.ProductMasterSId;
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
  const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.ProductMasterSId
  }

      this.commonService.documentData.set(data)
}

openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.ProductMasterSId;
  }
 ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.commonService.clearDocumentData()
 }

//  openAuditLogs(modal: TemplateRef<any>) {
//   if (!this.ProductMasterSId) return;

//   this.masterService.getAuditLogs('ProductMaster', this.ProductMasterSId.toString()).subscribe({
//     next: (logs: any[]) => {
//       const formatFields = (val: any) => {
//         if (!val) return ['NA'];
//         const obj = typeof val === 'string' ? JSON.parse(val) : val;
//         delete obj.updatedOn; // Remove updatedOn field
//         // If no fields exist after deleting updatedOn
//         if (Object.keys(obj).length === 0) return ['NA'];
//         return Object.entries(obj).map(
//           ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
//         );
//       };

//       this.auditLogs = logs.map(log => ({
//         ...log,
//         oldValDisplay: formatFields(log.oldVal),
//         newValDisplay: formatFields(log.newVal)
//       }));

//       this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
//     },
//     error: err => console.error('Error fetching audit logs:', err)
//   });
// }


openFollowup(){
        const modalRef = this.modalService.open(FollowUpComponent,{
            size : 'lg',
            backdrop : 'static',
            centered : true
        })
    }
    
openAuditLogs(modal: TemplateRef<any>) {
  if (!this.ProductMasterSId) return;

  this.masterService.getAuditLogs(
    'ProductMaster',
    this.ProductMasterSId.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['updatedOn','updatedBy']; // ✅ add more if needed later

      const formatFields = (val: any) => {
        if (!val) return [];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        if (Object.keys(obj).length === 0) return [];
        return Object.entries(obj)
          .filter(([key]) => !ignoredFields.includes(key)) // 🚫 exclude fields
          .map(([key, value]) => `${key}: ${value ?? 'NA'}`);
      };

      this.auditLogs = logs
        .map(log => ({
          ...log,
          oldValDisplay: formatFields(log.oldVal),
          newValDisplay: formatFields(log.newVal),
        }))
        .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);

      this.auditLogModalRef = this.modalService.open(modal, {
        centered: true,
        scrollable: true,
        windowClass: 'audit-log-modal'
      });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
}
navigateTocreateProduct() {
        this.route.navigate(["master/product/entry"])
    }
}
