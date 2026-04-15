import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule, NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { CommonService } from 'src/app/common/common.service';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { MasterService } from 'src/app/modules/master/master.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';

@Component({
  selector: 'app-merge-booking',
  standalone: true,
  imports: [
    NgSelectModule,
    ReactiveFormsModule,
    CommonModule,
    NgbPaginationModule,
    SearchableDropdown,
    NgbDropdownModule
  ],
  templateUrl: './merge-booking.component.html',
  styleUrls: ['./merge-booking.component.scss']
})
export class MergeBookingComponent implements OnInit {
  fromBookingForm!: FormGroup;
  toBookingForm!: FormGroup;

  departments: any[] = [];
  bookings: any[] = [];
  bookingsOriginal: any[] = [];
  customers: any[] = [];
  ports: any[] = [];
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  MenuMasterSid: any;
  currentMenuId: number;
  TandCList: any[]=[];
  currentClauseId: any;

  toBookingOptions: any[] = [];

  currentCompany: any;
  currentBranch: any;
  pageFrom: number = 1;
  pageSizeFrom: number = 10;
  fromTotalRecords: number;
  pageTo: number = 1;
  pageSizeTo: number = 10;
  toTotalRecords: number;
  slicedFromProducts: any[] = [];
  slicedToProducts: any[] = [];
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;

  constructor(
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
    private fb: FormBuilder,
    private router: Router,
    public mps: MenuPermissionService,
    private commonService: CommonService,
    private masterService: MasterService,
     private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService,
  ) { }

  sendManualMail(): void {
    this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid: Number(sessionStorage.getItem('currentMenuId')),
      action: 'UPDATE',
      context: {}
    });
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.mps.init().subscribe();
    this.loadAllLookups();
    this.initFromBooking();
    this.initToBooking();

    this.fromBookingForm.get('CustomerMasterSid')?.valueChanges.subscribe(() => this.applyBookingFilters());
    this.fromBookingForm.get('POL')?.valueChanges.subscribe(() => this.applyBookingFilters());
    this.fromBookingForm.get('POD')?.valueChanges.subscribe(() => this.applyBookingFilters());
  }

  initFromBooking() {
    this.fromBookingForm = this.fb.group({
      DepartmentMasterSid: [null, [Validators.required]],
      BookingHeaderSid: [null, [Validators.required]],
      CustomerMasterSid: [null, [Validators.required]],
      SalesmanName: [{ value: '', disabled: true }],
      ShipperName: [{ value: null, disabled: true }],
      ConsigneeName: [{ value: null, disabled: true }],
      POL: [null, [Validators.required]],
      POD: [null, [Validators.required]],
      FPD: [null],
      products: this.fb.array([])
    });
  }

  initToBooking() {
    this.toBookingForm = this.fb.group({
      DepartmentMasterSid: [{ value: null, disabled: true }, [Validators.required]],
      BookingHeaderSid: [{ value: null, disabled: true }, [Validators.required]],
      CustomerMasterSid: [null, [Validators.required]],
      SalesmanName: [{ value: '', disabled: true }],
      ShipperName: [{ value: null, disabled: true }],
      ConsigneeName: [{ value: null, disabled: true }],
      POL: [{ value: null , disabled: true }, [Validators.required]],
      POD: [{ value: null , disabled: true }, [Validators.required]],
      FPD: [{ value: null , disabled: true }],
      products: this.fb.array([])
    });
  }

  loadAllLookups() {
    const filterOptions = {
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
    };
    forkJoin({
      customers: this.operationService.getAllCustomers(filterOptions).pipe(catchError(err => of([]))),
      departments: this.operationService.getAllDepartments(this.currentCompany?.CompanyMasterSid).pipe(catchError(err => of([]))),
      ports: this.operationService.getAllPorts().pipe(catchError(err => of([]))),
    }).subscribe(({ customers, departments, ports }) => {
      this.customers = customers;
      this.departments = departments.data;
      this.filterDepartments();
      this.ports = ports.data;
    });
  }

  filterDepartments() {
    if (!this.departments) return;
    this.departments = this.departments.filter(d => d.ExportImport === "Export" && d.departmentType === "Sea");
  }

  applyBookingFilters() {
    const selectedCustomerSid = this.fromBookingForm.get('CustomerMasterSid')?.value;
    const selectedPOL = this.fromBookingForm.get('POL')?.value;
    const selectedPOD = this.fromBookingForm.get('POD')?.value;

    this.bookings = this.bookingsOriginal.filter(b =>
      (!selectedCustomerSid || b.CustomerMasterSid === selectedCustomerSid) &&
      (!selectedPOL || b.POL === selectedPOL) &&
      (!selectedPOD || b.POD === selectedPOD)
    );
  }

  

  constructProductGroup(product: any) {
    const productGroup = this.fb.group({
      BookingProductSid: [product.BookingProductSid || null],
      ProductName: [product.ProductName || ''],
      ShippingBillNo: [product.ShippingBillNo || ''],
      ExternlQty: [product.ExternlQty || 0, [Validators.min(0)]],
      GrossWeight: [product.GrossWeight || 0, [Validators.min(0)]],
      Volume: [product.Volume || 0, [Validators.min(0)]]
    });
    return productGroup;
  }

  get fromProducts(): FormArray {
    return this.fromBookingForm.get('products') as FormArray;
  }
  get toProducts(): FormArray {
    return this.toBookingForm.get('products') as FormArray;
  }

  onFromBookingChange(fromBooking: any) {
    if (!fromBooking) {
      this.bookings = [];
      this.fromBookingForm.reset();
      this.fromProducts.clear();
      this.fromTotalRecords = 0;
      this.slicedFromProducts = [];
      this.toBookingForm.reset();
      this.toProducts.clear();
      this.toTotalRecords = 0;
      this.enableAllFromControls();
      this.toBookingOptions = [];
      this.slicedToProducts = [];
      return;
    }
    const toBookingId = this.toBookingForm.get('BookingHeaderSid')?.value;
    this.fromBookingForm.patchValue({
      CustomerMasterSid: fromBooking.CustomerMasterSid,
      SalesmanName: fromBooking.salesman?.userName,
      ShipperName: fromBooking.ShipperName,
      ConsigneeName: fromBooking.ConsigneeName,
      POL: fromBooking.POL,
      POD: fromBooking.POD,
      FPD: fromBooking.FPD,
    })
    const allProducts = (fromBooking.bookingProduct || []);
    this.fromProducts?.clear();
    allProducts.forEach(product => {
      const productGroup = this.constructProductGroup(product);
      this.fromProducts.push(productGroup);
    });
    this.fromTotalRecords = this.fromProducts.length;
    
    this.toBookingForm.patchValue({
      DepartmentMasterSid: fromBooking.DepartmentMasterSid,
      CustomerMasterSid: fromBooking.CustomerMasterSid,
      POL: fromBooking.POL,
      POD: fromBooking.POD,
    })
    if(toBookingId && fromBooking.BookingHeaderSid === toBookingId){
      this.toBookingForm.reset();
      this.toProducts.clear();
      this.toTotalRecords = 0;
      this.slicedToProducts = [];
    }
    this.toBookingForm.get('BookingHeaderSid')?.enable();
    this.updateFromPagination();
    this.filterToBookings();
    this.disableAllFromControls();
  }

  filterToBookings() {
    const from = this.fromBookingForm.value;
    this.toBookingOptions = this.bookings.filter(b =>
      b.CustomerMasterSid === from.CustomerMasterSid &&
      b.POL === from.POL &&
      b.POD === from.POD &&
      b.DepartmentMasterSid === from.DepartmentMasterSid &&
      b.BookingHeaderSid !== from.BookingHeaderSid
    );
  }

  onDeptChange(department: any) {
    this.fromProducts.clear();
    this.fromTotalRecords = 0;
    this.slicedFromProducts = [];
    this.toBookingForm.reset();
    this.toProducts.clear();
    this.toTotalRecords = 0;
    this.slicedToProducts = [];
    if (!department) {
      this.fromBookingForm.reset();
      return;
    }
    
    this.fromBookingForm.reset({
      DepartmentMasterSid: department.DepartmentMasterSid,
    });
    const selectedFCLLCL =
      department.departmentType === "Sea" ?
        department.FCLLCL.toUpperCase() :
        department.departmentType.toUpperCase();

    const bookingStatusFieldRequired =
      department.departmentType === "Sea" && department.FCLLCL === "LCL" && department.ExportImport === "Export";

    const options = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentMasterSid: department.DepartmentMasterSid,
      isFilteringRequired: bookingStatusFieldRequired,
    }



    this.operationService.getAllBookingForMerging(options).subscribe((resp: any) => {
      if (resp.status) {
        this.bookingsOriginal = resp.data;
        this.applyBookingFilters();
      }
    })
  }


  patchToBookingDetails(toBooking: any) {
    if (!toBooking) {
      this.toBookingForm.reset();
      this.toProducts.clear();
      this.toTotalRecords = 0;
      return;
    }
    this.toBookingForm.patchValue({
      DepartmentMasterSid: toBooking.DepartmentMasterSid,
      CustomerMasterSid: toBooking.CustomerMasterSid,
      POL: toBooking.POL,
      POD: toBooking.POD,
      FPD: toBooking.FPD,
      SalesmanName: toBooking.salesman?.userName,
      ShipperName: toBooking.ShipperName,
      ConsigneeName: toBooking.ConsigneeName
    }, { emitEvent: false });

    const allProducts = (toBooking.bookingProduct || []);
    this.toProducts?.clear();
    allProducts.forEach(product => {
      const productGroup = this.constructProductGroup(product);
      this.toProducts.push(productGroup);
    });
    this.updateToPagination();
    this.toTotalRecords = this.toProducts.length;
  }

  mergeBookings() {
    if (this.fromBookingForm.valid && this.toBookingForm.valid) {
      const payload = {
        fromBookingSid: this.fromBookingForm.value.BookingHeaderSid,
        toBookingSid: this.toBookingForm.value.BookingHeaderSid
      };
      console.log(payload);
      this.operationService.mergeBooking(payload).subscribe((resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Booking Merged Successfully');
          this.router.navigate(['operation/booking/entry',payload.toBookingSid]);
        } else {
          this.appSettingService.showError(resp.message);
        }
      });
    }
  }

  updateFromPagination() {
    const start = (this.pageFrom - 1) * this.pageSizeFrom;
    const end = start + this.pageSizeFrom;
    console.log(this.fromProducts)
    this.slicedFromProducts = this.fromProducts.getRawValue().slice(start, end);
    console.log(this.slicedFromProducts)
  }

  updateToPagination() {
    const start = (this.pageTo - 1) * this.pageSizeTo;
    const end = start + this.pageSizeTo;
    this.slicedToProducts = this.toProducts.getRawValue().slice(start, end);
    console.log(this.slicedToProducts)
  }

  disableAllFromControls() {
    Object.keys(this.fromBookingForm.controls).forEach(key => {
      if (key !== "DepartmentMasterSid" && key !== "BookingHeaderSid") {
        this.fromBookingForm.get(key)?.disable();
      }
    });
  }

  enableAllFromControls() {
    Object.keys(this.fromBookingForm.controls).forEach(key => {
      this.fromBookingForm.get(key)?.enable();
    });
  }

  disableAllToControls() {
    Object.keys(this.toBookingForm.controls).forEach(key => {
      if (key !== "DepartmentMasterSid" && key !== "BookingHeaderSid") {
        this.toBookingForm.get(key)?.disable();
      }
    });
  }

  enableAllToControls() {
    Object.keys(this.toBookingForm.controls).forEach(key => {
      this.toBookingForm.get(key)?.enable();
    });
  }

  // openTandC() {
  //       this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //       const payload = { MenuMasterSid: this.currentMenuId };
  //       this.masterService.getTandCByCondition(payload).subscribe(
  //         (resp: any) => {
  //           if (resp.status) {
  //             this.TandCList = resp.data;
  //             const modalRef = this.modalService.open(TermsAndConditionsComponent, {
  //               size: 'lg',
  //               backdrop: 'static',
  //               centered: true
  //             });
  //             modalRef.componentInstance.terms = this.TandCList;
  //             modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //             modalRef.componentInstance.DocumentSid = this.currentClauseId;
    
  //           } else {
  //             this.appSettingService.showError('Error loading Terms and Conditions');
  //           }
  //         },
  //         (error) => {
  //           this.appSettingService.showError('Error loading Terms and Conditions', error);
  //         }
  //       );
  //     }
    
      openEmail() {
      const modalRef = this.modalService.open(EmailEntryComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
      
    }
    
    openAuthority() {
      const modalRef = this.modalService.open(AuthorityEntryComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
      
    }
    
    openEDoc() {
      const modalRef = this.modalService.open(EdocComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
    }
  
    openFollowup() {
  
    }

}
