import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { OperationService } from '../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-crago-receipt-entry',
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
  templateUrl: './crago-receipt-entry.component.html',
  styleUrl: './crago-receipt-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class CragoReceiptEntryComponent implements OnInit{
  cargoForm!: FormGroup;
  bookingProductsForm!: FormGroup;
  bookingProducts: any[] = [];
  BookingHeaderSid!: number;
  BookingProductSid!: number;
  bookingData: any;
  isEditMode = false;
  modalRef: NgbModalRef;
  
  constructor(
    private router: Router,
    private fb : FormBuilder,
    private route: ActivatedRoute,
    private operationService: OperationService,
    private appSettingService: AppSettingsService
  ) {}

  ngOnInit(): void {
    this.initForm();
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
      VesselName: ['', [Validators.required]],
      VoyageNo: ['', [Validators.required]],
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
            ExternlQty: [+prod.ExternlQty || 0, Validators.required],
            GrossWeight: [+prod.GrossWeight || 0, Validators.required],
            NetWeight: [+prod.NetWeight || 0, Validators.required],
            Volume: [+prod.Volume || 0, Validators.required],
            CargoRecDate: [prod.CargoRecDate ? this.formatDateForInput(prod.CargoRecDate) : null],
            CFS: [prod.CFS],
            RecdPack: [prod.RecdPack],
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
      GrossWeight: Number(value.GrossWeight),
      NetWeight: Number(value.NetWeight),
      Volume: Number(value.Volume),
      CargoRecDate: value.CargoRecDate,
      CFS: value.CFS,
      RecdPack: value.RecdPack,
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
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`; // dd-MM-yyyy
}

}
