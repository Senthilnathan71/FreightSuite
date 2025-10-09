import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { OperationService } from '../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

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
    DatePipe
  ],
  templateUrl: './split-booking-entry.component.html',
  styleUrls: ['./split-booking-entry.component.scss'],
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

  splitType = [
    { name: 'Full', value: 'full' },
    { name: 'Part', value: 'part' }
  ];

  constructor(
    private fb: FormBuilder,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.initForm();
    this.loadAllLookups();

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

 onSelectRow(index: number) {
  const productsArray = this.bookingForm.get('products') as FormArray;
  const selectedCount = productsArray.controls.filter(c => c.get('selected')?.value).length;

  // Example: Allow only all but one row to be selected
  if (selectedCount >= productsArray.length - 1) {
    productsArray.controls.forEach(c => {
      if (!c.get('selected')?.value) {
        c.get('selected')?.disable(); // disables only the unselected ones
      }
    });
  } else {
    productsArray.controls.forEach(c => c.get('selected')?.enable());
  }
}



updateCheckboxDisabledStates() {
  const total = this.products.length;
  const selectedCount = this.products.controls.filter(p => p.get('selected')?.value).length;

  this.products.controls.forEach(p => {
    const control = p.get('selected');
    if (!control) return;

    if (selectedCount === total - 1 && !control.value) {
      control.disable({ emitEvent: false }); // disables without triggering change detection issues
    } else {
      control.enable({ emitEvent: false }); // re-enable if condition no longer met
    }
  });
}



  onSplitModeChange(value: string, index: number) {
  const control = this.products.at(index);
  if (value === 'full') {
    control.patchValue({
      PartPackages: null,
      PartGrossWeight: null,
      PartCBM: null
    });
  }
}

  onSplit() {
  const selected = this.products.controls.filter(c => c.value.selected);

  if (selected.length === 0) {
    this.appSettingService.showError('Select at least one product.');
    return;
  }

  if (selected.length === this.products.length) {
    this.appSettingService.showError('At least one product must remain unselected.');
    return;
  }

  const payload = {
    bookingSid: this.bookingForm.value.BookingHeaderSid,
    selectedProducts: selected.map(p => {
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
      this.appSettingService.showSuccess('Booking split successfully');

      // Update original booking quantities
      selected.forEach(p => {
        if (p.value.splitType === 'part') {
          p.patchValue({
            ExternaPkg: p.value.ExternaPkg - p.value.PartPackages,
            GrossWeight: p.value.GrossWeight - p.value.PartGrossWeight,
            Volume: p.value.Volume - p.value.PartCBM
          });
        } else {
          const idx = this.products.controls.indexOf(p);
          this.products.removeAt(idx);
        }
      });

      this.selectedRows = [];

      // Navigate to the new booking entry screen
      this.router.navigate(['operation/booking/entry', resp.newBooking.BookingHeaderSid]);
    },
    error: (err) => {
      console.error('Error while splitting booking', err);
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
}
