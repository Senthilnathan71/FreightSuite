import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDropdownModule, NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { OperationService } from '../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { CommonService } from 'src/app/common/common.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';

@Component({
  selector: 'app-split-booking-entry',
  standalone: true,
  imports: [
    FeatherModule,
    NgSelectModule,
    ReactiveFormsModule,
    CommonModule,
    NgbPaginationModule,
    FormsModule,
    DatePipe,
    SearchableDropdown,
    NgbDropdownModule
  ],
  templateUrl: './split-booking-entry.component.html',
  styleUrls: ['./split-booking-entry.component.scss'],
  providers: [
      { provide: NgbDateAdapter, useClass: CustomDateAdapter },
      { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
      CustomDatePipe
    ],
})
export class SplitBookingEntryComponent implements OnInit {
  bookingForm!: FormGroup;
  bookings: any[] = [];
  bookingsOriginal: any[] = [];
  customers: any[] = [];
  ports: any[] = [];
  departments: any[] = [];
  currentCompany: any;
  currentBranch: any;
  page: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  slicedProducts: any[] = [];
  selectedRows: number[] = [];
  selectedIndex: number | null = null;
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  currentMenuId: number;
  MenuMasterSid: any;
  splitData: any;
  splitId:number;
  TandCList: any[] = [];
    userData: any;
  splitType = [
    { name: 'Full', value: 'full' },
    { name: 'Part', value: 'part' }
  ];

  constructor(
    private fb: FormBuilder,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private router: Router,
    public mps: MenuPermissionService,
    private ngbModal: NgbModal,
    private masterService: MasterService,
    private modalService: NgbModal,
    private commonService: CommonService,
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
    this.initForm();
    this.loadAllLookups();
    this.mps.init().subscribe();
   const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    // Subscribe to filters
    this.bookingForm.get('CustomerMasterSid')?.valueChanges.subscribe(() => this.applyBookingFilters());
    this.bookingForm.get('POL')?.valueChanges.subscribe(() => this.applyBookingFilters());
    this.bookingForm.get('POD')?.valueChanges.subscribe(() => this.applyBookingFilters());
  }

  // Initialize form
  initForm() {
    this.bookingForm = this.fb.group({
      DepartmentMasterSid: [null, Validators.required],
      BookingHeaderSid: [null, Validators.required],
      CustomerMasterSid: [{ value: null, disabled: true }],
      ShipperName: [{ value: null, disabled: true }],
      ConsigneeName: [{ value: null, disabled: true }],
      POL: [{ value: null, disabled: true }],
      POD: [{ value: null, disabled: true }],
      products: this.fb.array([])
    });
  }

  // Products FormArray getter
  get products(): FormArray {
    return this.bookingForm.get('products') as FormArray;
  }

  // Construct a product FormGroup
  constructProductGroup(product: any) {
  return this.fb.group({
    BookingProductSid: [product.BookingProductSid || null],
    ProductName: [product.ProductName || ''],
    ShippingBillNo: [product.ShippingBillNo || ''],
    ShippingBillDate: [product.ShippingBillDate || ''],
    ExternaPkg: [product.ExternaPkg || 0, [Validators.min(0)]],
    ExternlQty: [product.ExternlQty || 0, [Validators.min(0)]],
    NetWeight: [product.NetWeight || 0, [Validators.min(0)]],
    GrossWeight: [product.GrossWeight || 0, [Validators.min(0)]],
    Volume: [product.Volume || 0, [Validators.min(0)]],
    selected: [{ value: false, disabled: false }],
    splitType: ['full'],
    PartPackages: [null],
    PartGrossWeight: [null],
    PartCBM: [null]
  });
}

  // Load lookups for dropdowns
  loadAllLookups() {
    const filterOptions = {
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid
    };

    forkJoin({
      customers: this.operationService.getAllCustomers(filterOptions).pipe(catchError(() => of([]))),
      departments: this.operationService.getAllDepartments(this.currentCompany?.CompanyMasterSid).pipe(catchError(() => of([]))),
      ports: this.operationService.getAllPorts().pipe(catchError(() => of([]))),
    }).subscribe(({ customers, departments, ports }) => {
      this.customers = customers;
      this.departments = departments.data;
      this.filterDepartments();
      this.ports = ports.data;
    });
  }

  filterDepartments() {
    this.departments = this.departments?.filter(d => d.ExportImport === "Export" && d.departmentType === "Sea") || [];
  }

  // Filter bookings based on Customer, POL, POD
  applyBookingFilters() {
    const cust = this.bookingForm.get('CustomerMasterSid')?.value;
    const pol = this.bookingForm.get('POL')?.value;
    const pod = this.bookingForm.get('POD')?.value;

    this.bookings = this.bookingsOriginal.filter(b =>
      (!cust || b.CustomerMasterSid === cust) &&
      (!pol || b.POL === pol) &&
      (!pod || b.POD === pod)
    );
  }

  // Patch all booking details automatically
  onBookingChange(booking: any) {
    if (!booking) {
      this.bookingForm.reset();
      this.products.clear();
      this.slicedProducts = [];
      this.totalRecords = 0;
      this.enableAllFormControls();
      return;
    }

    // Patch main form fields
    this.bookingForm.patchValue({
      BookingHeaderSid: booking.BookingHeaderSid,
      CustomerMasterSid: booking.CustomerMasterSid,
      ShipperName: booking.ShipperName,
      ConsigneeName: booking.ConsigneeName,
      POL: booking.POL,
      POD: booking.POD
    });

    // Populate products FormArray
    this.products.clear();
    (booking.bookingProduct || []).forEach(prod => {
      this.products.push(this.constructProductGroup(prod));
    });

    // Update pagination
    this.totalRecords = this.products.length;
    this.page = 1;
    this.updatePagination();

  }

  onDeptChange(department: any) {
    this.bookingForm.reset({ DepartmentMasterSid: department?.DepartmentMasterSid || null });
    this.products.clear();
    this.totalRecords = 0;
    this.slicedProducts = [];

    if (!department) return;

    const options = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentMasterSid: department.DepartmentMasterSid,
      isFilteringRequired: department.departmentType === "Sea" && department.FCLLCL === "LCL" && department.ExportImport === "Export"
    };

    this.operationService.getAllBookingForMerging(options).subscribe((resp: any) => {
      if (resp.status) {
        this.bookingsOriginal = resp.data;
        this.applyBookingFilters();
      }
    });
  }


  public onSplitModeChange(value: string, index: number) {
  const control = this.products.at(index);
  if (value === 'full') {
    control.patchValue({
      PartPackages: null,
      PartGrossWeight: null,
      PartCBM: null
    });
  }
}

public onSelectRow(index: number) {
  const selectedCount = this.products.controls.filter(c => c.get('selected')?.value).length;

  // Disable the remaining unselected checkbox if all but one selected
  this.products.controls.forEach((c, i) => {
    const control = c.get('selected');
    if (!control) return;

    if (selectedCount >= this.products.length - 1 && !control.value) {
      control.disable({ emitEvent: false });
    } else {
      control.enable({ emitEvent: false });
    }
  });
}


  public onSplit() {
  const selectedProducts = this.products.controls.filter(c => c.value.selected);

  if (selectedProducts.length === 0) {
    this.appSettingService.showError('Select at least one product to split.');
    return;
  }

  const payload = {
    bookingSid: this.bookingForm.value.BookingHeaderSid,
    selectedProducts: selectedProducts.map(p => {
      const val = p.value;
      return {
        BookingProductSid: val.BookingProductSid,
        splitType: val.splitType,
        PartPackages: val.PartPackages,
        PartGrossWeight: val.PartGrossWeight,
        PartCBM: val.PartCBM
      };
    })
  };

  this.operationService.splitBooking(payload).subscribe({
    next: (resp: any) => {
      console.log('Split booking response:', resp);
      const newBookingSid = resp?.data?.BookingHeaderSid;
      this.splitData = newBookingSid;
      if (resp.message && newBookingSid) {
        this.appSettingService.showSuccess(resp.message);
        this.router.navigate(['operation/booking/entry', newBookingSid]);
      } else {
        this.appSettingService.showError('Booking split, but navigation failed.');
      }
    },
    error: (err) => {
      console.error(err);
      this.appSettingService.showError(err?.error?.message || 'Failed to split booking');
    }
  });
}




 updatePagination() {
  const start = (this.page - 1) * this.pageSize;
  const end = start + this.pageSize;
  this.slicedProducts = this.products.controls.slice(start, end);
}
  

 disableAllFormControls() {
  Object.keys(this.bookingForm.controls).forEach(key => {
    if (key !== "DepartmentMasterSid" && key !== "BookingHeaderSid" && key !== "products") {
      this.bookingForm.get(key)?.disable();
    }
  });
}


  enableAllFormControls() {
    Object.keys(this.bookingForm.controls).forEach(key => {
      this.bookingForm.get(key)?.enable();
    });
  }

  back() {
    history.back();
  }


    // openTandC() {
    //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    //   const payload = { MenuMasterSid: this.currentMenuId };
    //   this.masterService.getTandCByCondition(payload).subscribe(
    //     (resp: any) => {
    //       if (resp.status) {
    //         this.TandCList = resp.data;
    //         const modalRef = this.modalService.open(TermsAndConditionsComponent, {
    //           size: 'lg',
    //           backdrop: 'static',
    //           centered: true
    //         });
    //         modalRef.componentInstance.terms = this.TandCList;
    //         modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
    //         modalRef.componentInstance.DocumentSid = this.splitId;
  
    //       } else {
    //         this.appSettingService.showError('Error loading Terms and Conditions');
    //       }
    //     },
    //     (error) => {
    //       this.appSettingService.showError('Error loading Terms and Conditions', error);
    //     }
    //   );
    // }
     openEmail() {
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
      modalRef.componentInstance.documentSid = this.splitId;
    }
  
  openEDoc() {
    if (!this.splitData) return;
    const modalRef = this.modalService.open(EdocComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.splitData;
    modalRef.componentInstance.idLabel = 'HAWB Stock Id';
    modalRef.componentInstance.idValue = this.splitData?.headerId;
    const data:any={
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid : this.MenuMasterSid,
      DocumentSid: this.splitId
    }
  
        this.commonService.documentData.set(data)
  }
  
  //  openFollowup() {
  //     if (!this.splitData) return;
  //     const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
  //     modalRef.componentInstance.documentSid = this.splitData?.QuoteHeaderSid;
  //     modalRef.componentInstance.parentEmail = this.splitData.Email;
  //     modalRef.componentInstance.parentSubject = `Quotation No.${this.splitData.QuoteNumber} Date:${new Date(this.splitData.QuoteDate).toLocaleDateString()}`;
  //     modalRef.componentInstance.parentMailbody = `
  //     <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
  //       <p>Dear Sir/Madam,</p>
  //       <p>Please find enclosed the quotation as requested.</p>
  //       <p>Kindly review the details at your convenience.</p>
  //       <p>Looking forward to your feedback and the opportunity to work together.</p>
  //       <p>
  //         Approval Hyperlink: 
  //         <a href="https://xxxxxxxxx" target="_blank" style="color: #1a73e8;">Click here to approve</a>
  //       </p>
  //       <p>Best Regards,</p>
  //       <p>${this.userData['userEmail']}</p>
  //     </div>
  //   `;
  
  //   // Optionally, pass the quotation HTML content ID for PDF generation
  //   modalRef.componentInstance.pdfContentId = 'quotationContent';
  //   }
}
