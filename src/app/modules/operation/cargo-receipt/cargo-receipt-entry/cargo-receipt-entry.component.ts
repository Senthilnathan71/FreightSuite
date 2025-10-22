import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModalRef, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-cargo-receipt-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    FeatherModule,
    NgbDatepickerModule,
    CommonModule,
    ReactiveFormsModule,
    CustomDatePipe,
    FormsModule
  ],
  templateUrl: './cargo-receipt-entry.component.html',
  styleUrl: './cargo-receipt-entry.component.scss',
  providers: [
    CustomDatePipe, // ✅ add this line
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class CargoReceiptEntryComponent implements OnInit {
      private destroy$ = new Subject<void>();

  cargoForm!: FormGroup;
  bookingProductsForm!: FormGroup;
  bookingProducts: any[] = [];
  BookingHeaderSid!: number;
  BookingProductSid!: number;
  bookingData: any;
  isEditMode = false;
  modalRef: NgbModalRef;
  today = this.calendar.getToday();
  minDate = this.today;
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  currentDate = new Date();
  currentCompany: any;
  // cfsList:any[] = [];

  constructor(
    private config: NgSelectConfig,
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private calendar: NgbCalendar,
    private datePipe: CustomDatePipe,
    public dropdownStore: DropdownStore
  ) {
    this.config.notFoundText = 'No items found';
    this.config.appendTo = 'body';
    this.config.bindValue = 'CustomerName';
    this.config.bindLabel = 'CustomerName';
    this.initForm();
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.initForm();
    this.loadAllFields();
    this.route.paramMap.subscribe((param) => {
      this.BookingHeaderSid = +param.get('BookingHeaderSid');
      if (this.BookingHeaderSid) {
        this.isEditMode = true;
        this.loadBooking(this.BookingHeaderSid);
      }
    });
  }

  initForm() {
    this.cargoForm = this.fb.group({
      BookingNo: ['', [Validators.required]],
      BookingDateTime: ['', [Validators.required]],
      departmentName: ['', [Validators.required]],
      CustomerName: ['', [Validators.required]],
      HBLNo: [''],
      VesselName: [''],
      VoyageNo: [''],
      POO: ['', [Validators.required]],
      POD: ['', [Validators.required]],
      POL: ['', [Validators.required]],
      FPD: ['', [Validators.required]],
      bookingProducts: this.fb.array([])
    });
  }

  get bookingProductsArray(): FormArray {
    return this.cargoForm.get('bookingProducts') as FormArray;
  }

  loadAllFields() {
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      types: ['cFS']
    }
    this.dropdownStore.loadCustomerTypeData(payload)
  }


  loadBooking(BookingHeaderSid: number) {
    this.operationService.getLCLExportBookingById(BookingHeaderSid).subscribe({
      next: (resp: any) => {
        const booking = resp?.data || resp;
        if (!booking) {
          this.appSettingService.showError('No booking details found.');
          return;
        }

        // Patch main booking info
        this.cargoForm.patchValue({
          BookingNo: booking.BookingNo,
          BookingDateTime: this.formatDateTo_ddMMyyyy(booking.BookingDateTime),
          departmentName: booking.departmentMaster?.departmentName,
          CustomerName: booking.CustomerName,
          HBLNo: booking.HBLNo,
          VesselName: booking.VesselName,
          VoyageNo: booking.VoyageNo,
          POO: booking.POO,
          POD: booking.POD,
          POL: booking.POL,
          FPD: booking.FPD,
        });

        // Clear existing FormArray
        this.bookingProductsArray.clear();

        // Patch booking products
        (booking.bookingProduct || []).forEach(prod => {
          this.bookingProductsArray.push(this.fb.group({
            ProductName: [prod.ProductName],
            ShippingBillNo: [prod.ShippingBillNo],
            ShippingBillDate: [prod.ShippingBillDate ? this.formatDateTo_ddMMyyyy(prod.ShippingBillDate) : ''],
            ExternaPkg: [prod.ExternaPkg],
            ExternlQty: [+prod.ExternlQty || 0, [Validators.required, Validators.pattern("^[0-9]*$")]],
            GrossWeight: [prod.GrossWeight != null ? parseFloat(prod.GrossWeight).toFixed(3) : '0.000', Validators.required],
            NetWeight: [prod.NetWeight != null ? parseFloat(prod.NetWeight).toFixed(3) : '0.000', Validators.required],
            Volume: [prod.Volume != null ? parseFloat(prod.Volume).toFixed(3) : '0.000', Validators.required],
            CargoRecDate: [(prod.CargoRecDate ? new Date(prod.CargoRecDate) : null) || null, Validators.required],
            CFS: [prod.CFS, Validators.required],
            RecdPack: [+prod.RecdPack || 0, [Validators.required, Validators.pattern("^[0-9]*$")]],
          }));
        });
      },
      error: err => {
        console.error('Error loading booking:', err);
        this.appSettingService.showError('Error loading booking details.');
      }
    });
  }


  save() {
    if (this.cargoForm.invalid) {
      this.cargoForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const payload = this.bookingProductsArray.controls.map(control => {
      const value = control.value;
      return {
        ProductName: value.ProductName,
        ShippingBillNo: value.ShippingBillNo,
        ShippingBillDate: value.ShippingBillDate,
        ExternaPkg: value.ExternaPkg,
        ExternlQty: Number(value.ExternlQty),
        GrossWeight: value.GrossWeight,
        NetWeight: value.NetWeight,
        Volume: value.Volume,
        CargoRecDate: value.CargoRecDate,
        CFS: value.CFS,
        RecdPack: Number(value.RecdPack),
      };
    });

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    this.operationService.updateBookingProductsById(this.BookingHeaderSid, payload).subscribe({
      next: (resp: any) => {
        console.log('Full server response:', resp);
        console.log('Response status:', resp?.status);
        console.log('Response message:', resp?.message);
        console.log('Response data:', resp?.data);

        if (resp && resp.status === true) {
          this.appSettingService.showSuccess('Cargo receipt saved successfully.');
          this.router.navigate(['/operation/cargo-receipt/list']);
        } else {
          const errorMessage = resp?.message || 'Unknown error occurred';
          console.error('Error response:', resp);
          this.appSettingService.showError(errorMessage);
        }
      },
      error: (err) => {
        console.error('HTTP error details:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Error response body:', err.error);

        const errorMessage = err.error?.message || err.message || 'Something went wrong';
        this.appSettingService.showError(errorMessage);
      },
    });
  }


  goBack() {
    this.router.navigate(['operation/cargo-receipt/list']);
  }

  resetForm() {
    // If editing an existing booking, reload it (restore original state)
    if (this.isEditMode && this.BookingHeaderSid) {
      this.loadBooking(this.BookingHeaderSid);
      return;
    }

    // Create-mode: reset form to initial state
    this.cargoForm.reset({
      BookingNo: '',
      BookingDateTime: '',
      departmentName: '',
      CustomerName: '',
      HBLNo: '',
      VesselName: '',
      VoyageNo: '',
      POO: '',
      POD: '',
      POL: '',
      FPD: ''
    });

    // Clear the booking products array
    this.bookingProductsArray.clear();

    // Reset any additional state variables if needed
    this.bookingData = null;
    this.BookingProductSid = null;
  }



  formatDateForInput(date: any): string {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`; // yyyy-MM-dd format for <input type="date">
  }

  formatDateTo_ddMMyyyy(date: any): string {
    if (!date) return '';

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    return `${day}-${month}-${year}`; // 10-JAN-2025
  }


  ngOnDestroy(): void {
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }
  
}
