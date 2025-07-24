
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbDropdownModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
@Component({
  selector: 'app-booking-entry',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule, FormsModule, ReactiveFormsModule, RouterModule,NgbNavModule],
  templateUrl: './booking-entry.component.html',
  styleUrl: './booking-entry.component.scss'
})
export class BookingEntryComponent {
  
  fromStation: string = '';
toStation: string = '';

swapStations() {
  const temp = this.fromStation;
  this.fromStation = this.toStation;
  this.toStation = temp;
}

 activeTab = 'normal';
  selectedOption: string = ''; // Default value
  cargoExpectedOn: string = ''; // This will hold the date-time string
  isEditMode = false; // Flag for edit mode
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  bookingForm!: FormGroup;
  numberOfContainers: number = 1;
  isSwapped = false;
  packageTypeList: any[] = []; // from API
  departmentList: any[] = []; // from API
  containerTypeList: any[] = []; // from API
  filteredDepartmentList: any[] = [];
  selectedContainerType: any;
  portList: any
  BookingHeaderSid: any
  cargoTypeList: string[] = [
    'General', 'Tank', 'Haz', 'Reefer', 'Empty', 'OOG', 'RORO', 'BreakBulk'
  ];
  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    // private modalService: ModalService,
    // private bookingService: BookingService,
    private appSettingsService: AppSettingsService
  ) { }


  // ngOnInit() {
  //   this.getAllPackageType()
  //   this.getAllContainerTypes()
  //   this.getAllPorts()
  //   this.activatedRoute.paramMap.subscribe(params => {
  //     this.BookingHeaderSid = params.get('id');
  //   });

  //   const booking = this.bookingService.getBooking();
  //   const rateBooking = this.bookingService.getRateBooking();

  //   console.log(booking)

  //   if (booking?.patch) {
  //     console.log(booking)
  //     this.getAllDepartment(true); // pass a flag to filter
  //     this.patchForm(booking);
  //   }
  //   if (rateBooking?.patch) {
  //     console.log(rateBooking)
  //     this.getAllDepartment(false); // pass a flag to filter
  //     this.patchRateForm(rateBooking);
  //   }
  //   else if (this.BookingHeaderSid) {
  //     this.getAllDepartment(false); // pass a flag to filter
  //     this.loadBookingData(Number(this.BookingHeaderSid));
  //   }
  //   else {
  //     this.getAllDepartment(false); // default
  //     this.initializeForm(); // Empty/default form
  //   }
  // }

  // patchForm(booking: any) {
  //   const formatDateOnly = (dateStr: string) => {
  //     if (!dateStr) return '';
  //     const date = new Date(dateStr);
  //     return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  //   };

  //   this.bookingForm = this.fb.group({
  //     from: [booking.POLCode],
  //     to: [booking.PODCode],
  //     ETA: [formatDateOnly(booking.ETA)],
  //     ETD: [formatDateOnly(booking.ETD)],
  //     bookingNo: [''],
  //     DepartmentMasterSid: [''],
  //     IncoTerms: [''],
  //     CargoType: [''],
  //     Qty: [''],
  //     GrossWeight: [''],
  //     Volume: [''],
  //     ContainerType: [''],
  //     packageType: [''],
  //     ShipmentTerms: [''],
  //   });
  // }
  // patchRateForm(booking: any) {
  //   const formatDateOnly = (dateStr: string) => {
  //     if (!dateStr) return '';
  //     const date = new Date(dateStr);
  //     return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  //   };

  //   this.bookingForm = this.fb.group({
  //     from: [booking.POLCode],
  //     to: [booking.PODCode],
  //     ETA: [formatDateOnly(booking.ETA)],
  //     ETD: [formatDateOnly(booking.ETD)],
  //     bookingNo: [''],
  //     DepartmentMasterSid: [booking.DepartmentMasterSid],
  //     IncoTerms: [''],
  //     CargoType: [booking.CargoType],
  //     Qty: [booking.Qty],
  //     GrossWeight: [booking.GrossWeight],
  //     Volume: [booking.Volume],
  //     ContainerType: [booking.ContainerType],
  //     packageType: [booking.packageType],
  //     product: [booking.product],
  //     ShipmentTerms: [''],
  //   });
  //   const selectedDept = this.departmentList.find(
  //     dept => dept.DepartmentMasterSid === Number(booking.DepartmentMasterSid)
  //   );
  //   this.selectedOption = selectedDept?.FCLLCL || '';
  // }

  // patchBookingForm(booking: any) {
  //   console.log(booking)
  //   const formatDateOnly = (dateStr: string) => {
  //     if (!dateStr) return '';
  //     const date = new Date(dateStr);
  //     return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  //   };

  //   const cargo = booking.bookingCargo[0] || {};
  //   const containerType = this.containerTypeList.find(
  //     item => item.ContainerCode === booking.bookingCargo[0]?.ContainerType
  //   );
  //   console.log(containerType, 'containerType')
  //   this.numberOfContainers = cargo.Qty;
  //   this.selectedContainerType = containerType
  //   this.bookingForm = this.fb.group({
  //     from: [booking.POL],
  //     to: [booking.POD],
  //     ETA: [formatDateOnly(booking.ETA)],
  //     ETD: [formatDateOnly(booking.ETD)],
  //     bookingNo: [booking.BookingNo],
  //     DepartmentMasterSid: [booking.DepartmentMasterSid],
  //     IncoTerms: [booking.IncoTerms],
  //     CargoType: [booking.bookingCargo['0'].CargoType],
  //     Qty: [booking.bookingCargo['0'].Qty],
  //     GrossWeight: [booking.bookingCargo['0'].GrossWeight],
  //     Volume: [booking.bookingCargo['0'].Volume],
  //     ContainerType: [booking.bookingCargo['0'].ContainerType],
  //     packageType: [booking.bookingCargo['0'].pkgType],
  //     ShipmentTerms: [''],
  //     BookingCargoSid: [booking.bookingCargo['0'].BookingCargoSid],
  //   });
  // }

  // loadBookingData(id: number) {
  //   this.bookingService.getBookingById(id).subscribe(
  //     (resp: any) => {
  //       if (resp) {
  //         this.patchBookingForm(resp)
  //         const selectedDept = this.departmentList.find(
  //           dept => dept.DepartmentMasterSid === Number(resp.DepartmentMasterSid)
  //         );
  //         this.selectedOption = selectedDept?.FCLLCL || '';
  //       }
  //     });
  // }




  // viewPrice() {
  //   this.router.navigate(['/booking/price'])
  // }

  // incrementContainer() {
  //   if (this.numberOfContainers < 10) {
  //     this.numberOfContainers++;
  //     this.bookingForm.get('Qty')?.setValue(this.numberOfContainers);
  //   }
  // }

  // decrementContainer() {
  //   if (this.numberOfContainers > 1) {
  //     this.numberOfContainers--;
  //     this.bookingForm.get('Qty')?.setValue(this.numberOfContainers);
  //   }
  // }


  // initializeForm() {
  //   this.bookingForm = this.fb.group({
  //     bookingNo: [{ value: '', disabled: true }],
  //     ETD: [''],
  //     ETA: [''],
  //     FreightTerms: [''],
  //     from: ['', Validators.required],
  //     to: ['', Validators.required],
  //     DepartmentMasterSid: ['', Validators.required],
  //     IncoTerms: [''],

  //     // Common fields
  //     CargoType: ['', Validators.required],
  //     Qty: ['', Validators.required],
  //     GrossWeight: ['', Validators.required],
  //     Volume: ['', Validators.required],
  //     ContainerType: ['', Validators.required],
  //     packageType: ['', Validators.required],
  //     ShipmentTerms: [''],

  //     // FCL only
  //     numOfContainers: [1]
  //   });

  // }

  // getAllPackageType() {
  //   this.bookingService.getAllPackageType().subscribe({
  //     next: (data) => {
  //       this.packageTypeList = data;
  //     }
  //   });
  // }


  // getAllContainerTypes() {
  //   this.bookingService.getAllContainerTypes().subscribe({
  //     next: (data) => {
  //       this.containerTypeList = data;
  //     }
  //   });
  // }


  // getAllDepartment(filterExportOnly: boolean = false) {
  //   this.bookingService.getAllDepartment().subscribe({
  //     next: (data) => {
  //       if (filterExportOnly) {
  //         this.departmentList = data.filter((dept: any) =>
  //           ['FCL Export', 'LCL Export'].includes(dept.departmentName)
  //         );
  //       } else {
  //         this.departmentList = data;
  //       }
  //     }
  //   });
  // }


  // getAllPorts() {
  //   this.bookingService.getAllPorts().subscribe({
  //     next: (data) => {
  //       this.portList = data;
  //     }
  //   });
  // }


  // onOptionChange(event: Event): void {
  //   const target = event.target as HTMLSelectElement;
  //   const deptId = Number(target.value);
  //   const selectedDept = this.departmentList.find(
  //     dept => dept.DepartmentMasterSid === deptId
  //   );
  //   this.selectedOption = selectedDept?.FCLLCL || '';
  //   console.log(this.selectedOption);
  // }


  // selectKey = true;

  // swapInputs() {
  //   this.isSwapped = !this.isSwapped;

  //   const fromControl = this.bookingForm.get('from');
  //   const toControl = this.bookingForm.get('to');

  //   const fromValue = fromControl?.value;
  //   const toValue = toControl?.value;

  //   fromControl?.setValue(toValue);
  //   toControl?.setValue(fromValue);

  //   // Toggle selectKey to force re-render
  //   this.selectKey = false;
  //   setTimeout(() => {
  //     this.selectKey = true;
  //   }, 0);
  // }





  // selectContainerType(item: any) {
  //   console.log(item)
  //   this.selectedContainerType = item
  //   this.bookingForm.get('ContainerType')?.setValue(item.ContainerCode);
  // }

  // onSubmit() {
  //   this.btnDisable = true;
  //   if (this.BookingHeaderSid) {
  //     const rawETA = this.bookingForm.value.ETA; // e.g., "2025-04-26T19:46"
  //     const isoETA = new Date(rawETA).toISOString(); // "2025-04-26T19:46:00.000Z"
  //     const rawETD = this.bookingForm.value.ETD; // e.g., "2025-04-26T19:46"
  //     const isoETD = new Date(rawETD).toISOString(); // "2025-04-26T19:46:00.000Z"

  //     const updatePayload = {
  //       ...this.bookingForm.value,
  //       ShipmentType: this.selectedOption,
  //       ETA: isoETA,
  //       ETD: isoETD,
  //     };
  //     this.bookingService.updateBookingById(this.BookingHeaderSid, updatePayload).subscribe(
  //       resp => {
  //         console.log('API Response:', resp); // Debugging step

  //         if (resp) {
  //           this.modalService.openSuccessModal("Booking Updated Successfully");
  //           this.bookingForm.reset();

  //           this.numberOfContainers = 0;
  //           this.selectedOption = "";
  //           this.router.navigate(['/booking/list'])
  //         } else {
  //           this.modalService.openErrorModal("Booking Update Failed");
  //         }
  //       }
  //     )
  //   }
  //   else {
  //     const rawETA = this.bookingForm.value.ETA; // e.g., "2025-04-26T19:46"
  //     const isoETA = new Date(rawETA).toISOString(); // "2025-04-26T19:46:00.000Z"
  //     const rawETD = this.bookingForm.value.ETD; // e.g., "2025-04-26T19:46"
  //     const isoETD = new Date(rawETD).toISOString(); // "2025-04-26T19:46:00.000Z"
  //     const formValues = {
  //       ...this.bookingForm.value,
  //       numberOfContainers: this.numberOfContainers,
  //       ShipmentType: this.selectedOption,
  //       ETA: isoETA,
  //       ETD: isoETD,
  //     };
  //     console.log(formValues, 'formValues')
  //     this.bookingService.createBooking(formValues).subscribe(
  //       resp => {
  //         if (resp) {
  //           // this.modalService.openSuccessModal("Booking Created Successfully");

  //           this.appSettingsService.showSuccess("Booking Created SuccessFully");
  //           // ✅ Reset the form properly
  //           this.bookingForm.reset();

  //           // Optional: reset other related values
  //           this.numberOfContainers = 0;
  //           this.selectedOption = "";
  //           this.btnDisable = false;
  //           this.router.navigate(['/booking/list'])
  //         } else {
  //           this.appSettingsService.showError("Booking Creation Failed");
  //           // this.modalService.openErrorModal("Booking Creation Failed");
  //         }
  //       }
  //     )
  //     this.btnDisable = false;
  //   }
  // }
  // onReset() {
  //   this.bookingForm.reset({});
  // }


  // rateRequest() {
  //   this.router.navigate([`/booking/rates`]);
  // }


  // goBack() {
  //   history.back()
  // }


  // ngOnDestroy() {
  //   this.bookingService.clearBooking()
  //   this.bookingService.clearRateBooking()
  //   this.bookingForm.reset({});
  // }
}
