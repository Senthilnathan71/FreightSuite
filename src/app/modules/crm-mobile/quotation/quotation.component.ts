import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbModal, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppService } from 'src/app/service/app.service';
import { LeadService } from '../Services/lead.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { catchError, forkJoin, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { VerticalSidebarService } from 'src/app/shared/vertical-sidebar/vertical-sidebar.service';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from '../../settings/email/email-entry/email-entry.component';


@Component({
  selector: 'app-quotation',
  standalone: true,
  imports: [
    NgbNavModule,
    CommonModule,
    NgbDropdownModule,
    ReactiveFormsModule,
    FeatherModule,
    NgbPaginationModule,
    NgbDatepickerModule
  ],
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class QuotationComponent implements OnInit {
  active = 1;
  @ViewChild('nav', { static: true }) nav!: NgbNavModule;

  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;
  enquiryItems: any[] = [];
  enquiryData: any
  selectedDepartment: any
  isMobile: boolean = false;
  quotationForm!: FormGroup;
  selectCustomerAddress: any;
  allMasters: any
  customers: any
  carriers: any
  packageTypes: any
  ports: any
  filteredPorts : any[]
  departments: any
  enquiryForm: FormGroup;
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  enquiry: any
  selectedFCLLCL: string = 'LCL'; // Store selected segment's FCL/LCL type
  chargeMaster: any
  currencyMaster: any
  unitMaster: any
  selectedCustomerName: any
  selectedCarrierName: any
  statusList = ["Active", "Suspend"];
  minExpDate: string = '';
  formattedExpDate: string = ''; // For displaying MM/DD/YYYY
  rateRequestCustomerMasterSid: number;
  rateRequestDepartmentMasterSid: number;
  rateRequestPOLSid: number;
  rateRequestPODSid: number;
  rateRequestCargoTypes: any;
  rateRequestActive: number;
  rateEnquirySid : number;
  rateEnquiryNumber = "";
	today = this.calendar.getToday();
	todayDate = new Date(this.today.year,this.today.month,this.today.day);
  minQuoteDate :any;
  quotationData : any;
  TandCList : any[] = [];
  currentMenuId : number;
  constructor(
    private appService: AppService,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private toaster: ToastrService,
    private modalService: ModalService,
    private ngbModal : NgbModal,
    private calendar:NgbCalendar
  ) { }

  ngOnInit(): void {
    const quotationData = this.leadService.getQuotationData();
    if (quotationData) {
      this.rateRequestCustomerMasterSid = quotationData.customerId
      this.rateRequestDepartmentMasterSid = quotationData.departmentId
      this.rateRequestPOLSid = quotationData.polList;
      this.rateRequestPODSid = quotationData.podList
      this.rateRequestCargoTypes = quotationData.cargoTypeList || []; // Store cargo types
      this.rateEnquirySid = quotationData.EnquirySid;
      this.rateEnquiryNumber = quotationData.EnquiryNumber || '';
      this.active = quotationData.active;
    }

    console.log(quotationData, 'quotationData')
    console.log(this.rateEnquirySid,'EnquirySid');
    this.setMinDate();
    this.initializeForm();
    this.isMobile = this.appService.getDevice();
    forkJoin({
      cargoTypes: this.leadService.getAllCargoTypes().pipe(catchError(err => of([]))),
      carriers: this.leadService.getAllCarrier().pipe(catchError(err => of([]))),
      customers: this.leadService.getAllCustomers().pipe(catchError(err => of([]))),
      departments: this.leadService.getAllDepartments().pipe(catchError(err => of([]))),
      ports: this.leadService.getAllPorts().pipe(catchError(err => of([]))),
      masters: this.leadService.getAllMasters().pipe(catchError(err => of({ charges: [], currencies: [], units: [] })))
    }).subscribe(({ cargoTypes, carriers, customers, departments, ports, masters }) => {
      this.packageTypes = cargoTypes || [];
      this.carriers = carriers || [];
      this.customers = customers || []; // Ensure customers is always defined
      this.departments = departments;
      this.ports = ports;
      this.chargeMaster = masters.charges;
      this.currencyMaster = masters.currencies;
      this.unitMaster = masters.units;

      this.activatedRoute.paramMap.subscribe(params => {
        this.QuoteHeaderSid = +params.get('id');
        if (this.QuoteHeaderSid) {
          this.isEditMode = true;
          this.minQuoteDate = undefined;
          this.loadEnquiry(this.QuoteHeaderSid);
        } else{
          this.minQuoteDate = this.today;
        }
      });
      // Now patch the form after data is available
      if (quotationData.rateRequest) {
        this.patchDefaultValues();
      }
    }, error => {
      console.error("Error loading data:", error);
    });

    this.quotationForm.statusChanges.subscribe(() => {
      this.showToasterForErrors();
    });
  }


  patchDefaultValues() {
    // Find customer name by ID
    const selectedCustomer = this.customers.find(cust => cust.CustomerMasterSid === this.rateRequestCustomerMasterSid);
    this.selectedCustomerName = selectedCustomer?.CustomerName || '';
    this.selectCustomerAddress = selectedCustomer.CustomerAddress1 || '';

    // Find department name by ID
    const selectedDepartment = this.departments.find(dep => dep.DepartmentMasterSid === this.rateRequestDepartmentMasterSid);

    // Ensure POL and POD lists are arrays
    const polList = Array.isArray(this.rateRequestPOLSid) ? this.rateRequestPOLSid : [this.rateRequestPOLSid];
    const podList = Array.isArray(this.rateRequestPODSid) ? this.rateRequestPODSid : [this.rateRequestPODSid];
    const cargoList = Array.isArray(this.rateRequestCargoTypes) ? this.rateRequestCargoTypes : [this.rateRequestCargoTypes]
    // Clear existing routes
    this.routes.clear();

    // Iterate over polList and podList to create routes dynamically
    polList.forEach((pol, index) => {
      const pod = podList[index] || podList[0]; // Use corresponding POD or default to first
      const carGo = cargoList[index] || cargoList[0]
      // Find POL and POD names
      const selectedPOL = this.ports.find(port => port.PortMasterSid === pol);
      const selectedPOD = this.ports.find(port => port.PortMasterSid === pod);
      const selectedCargo = this.packageTypes.find(cargo => cargo.PackageName === carGo)

      // Create and patch a new route
      const routeForm = this.fb.group({
        POR: ['', Validators.required],
        POL: [selectedPOL?.PortMasterSid || '', Validators.required],
        POD: [selectedPOD?.PortMasterSid || '', Validators.required],
        FPOD: ['', Validators.required],
        Carrier: ['', Validators.required],
        CarrierMasterSid: [''],
        Segment: [selectedDepartment?.DepartmentMasterSid || '', Validators.required],
        segmentType: ['LCL'],
        DepartmentMasterSid: [selectedDepartment?.DepartmentMasterSid || ''],
        effDate: ['', Validators.required],
        expDate: ['', Validators.required],
        twentyft: [''],
        fortyft: [''],
        cargoType: [selectedCargo.PackageName, ''],
        transit: [''],
        cargo: this.fb.array([]),
      });

      this.routes.push(routeForm);
      this.addCargo(this.routes.length - 1); // Add at least one cargo row per route
    });

    // Patch header values
    this.quotationForm.patchValue({
      customerName: selectedCustomer?.CustomerMasterSid || '',
      CustomerMasterSid: selectedCustomer?.CustomerMasterSid || '',
      EnquirySid : this.rateEnquirySid
    });
    this.quotationForm.get('customerName').setValue(selectedCustomer?.CustomerMasterSid);
  }



  QuoteHeaderSid: any
  isEditMode = false; // Flag for edit mode


  initializeForm() {
    const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
    this.quotationForm = this.fb.group({
      // Header Data
      customerName: ['', Validators.required],
      quoteDate: [, Validators.required],
      quoteNo: [''],
      EnquirySid : [],
      status: [''], // Default
      // DepartmentMasterSid: [this.rateRequestDepartmentMasterSid ||''],
      CustomerMasterSid: [''],
      CustomerAddress: [''],
      Remarks:[''],
      // Routes (Multiple)
      routes: this.fb.array([]),
    });
    this.quotationForm.get('quoteNo')?.disable();
    this.addRoute(); // Add at least one route by default
  }

  // Getters for Form Arrays
  get routes(): FormArray {
    return this.quotationForm.get('routes') as FormArray;
  }

  routeCargo(routeIndex: number): FormArray {
    return this.routes.at(routeIndex).get('cargo') as FormArray;
  }

  // Add New Route
  addRoute() {
    const routeForm = this.fb.group({
      POR: ['', Validators.required],
      POL: ['', Validators.required],
      POD: ['', Validators.required],
      FPOD: ['', Validators.required],
      Carrier: ['', Validators.required],
      CarrierMasterSid: [''],
      Segment: ['', Validators.required],
      segmentType: ['LCL'],
      cargoType: ['', Validators.required],
      DepartmentMasterSid: [''],
      effDate: ['', Validators.required],
      expDate: ['', Validators.required],
      twentyft: [''],
      fortyft: [''],
      transit: [''],
      routeStatus: [''],
      cargo: this.fb.array([]),
    },
      // { validator: [this.validatePOLPOD, this.validateEffExpDates] } // Attach the custom validator
    );
    // Subscribe to POD changes and update FDC automatically
    routeForm.get('POD')?.valueChanges.subscribe(selectedPOD => {
      if (selectedPOD) {
        routeForm.patchValue({ FPOD: selectedPOD }, { emitEvent: false });
      }
    });
    this.routes.push(routeForm);
    this.addCargo(this.routes.length - 1); // Add at least one cargo row by default
  }


  // Add New Cargo Row to a Route
  addCargo(routeIndex: number) {
    const cargoForm = this.fb.group({
      charge: ['', Validators.required],
      unit: ['', Validators.required],
      currency: ['', Validators.required],
      twentyft: ['', Validators.required],
      fortyft: ['', Validators.required],
      perUnit: ['', Validators.required],
      costUnit: ['', Validators.required],
      costCurrency: ['', Validators.required],
      costPerUnit: ['', Validators.required]
    });

    this.routeCargo(routeIndex).push(cargoForm);
  }

  // Remove a Route


  // Remove a Cargo Row from a Route
  // removeCargo(routeIndex: number, cargoIndex: number) {
  //   this.routeCargo(routeIndex).removeAt(cargoIndex);
  // }

  validatePOLPOD(group: AbstractControl): ValidationErrors | null {
    const pol = group.get('POL')?.value;
    const pod = group.get('POD')?.value;

    return pol && pod && pol === pod ? { polPodSame: true } : null;
  }

  validateEffExpDates(group: AbstractControl): ValidationErrors | null {
    const effDate = group.get('effDate')?.value;
    const expDate = group.get('expDate')?.value;

    if (effDate && expDate && new Date(expDate) <= new Date(effDate)) {
      return { expDateInvalid: true }; // Return an error object
    }
    return null; // No error
  }

  setMinDate() {
    const today = new Date();
    // Convert to YYYY-MM-DD (required for [min] attribute)
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');

    this.minExpDate = `${yyyy}-${mm}-${dd}`; // For input restriction
    this.formattedExpDate = `${mm}/${dd}/${yyyy}`; // For display in MM/DD/YYYY
  }



  // Create a single row FormGroup
  createRow(): FormGroup {
    return this.fb.group({
      charge: ['', Validators.required],
      currency: ['', Validators.required],
      twentyft: ['', Validators.required],
      fortyft: ['', Validators.required],
      unit: ['', Validators.required]
    });
  }
  // Access the cargoRoutes FormArray
  get cargoRoutes(): FormArray {
    return this.quotationForm.get('cargoRoutes') as FormArray;
  }


  getRows(routeIndex: number): FormArray {
    return this.routes.at(routeIndex).get('cargo') as FormArray;
  }


  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.quotationForm.controls || {};
  }






  loadEnquiry(id): void {
    this.leadService.getQuoteById(id).subscribe(
      (resp: any) => {
        if (resp) {
          this.patchValues(resp)
          this.quotationData = resp;
        }
      });
  }





  patchValues(response: any) {
    // Find the department based on DepartmentMasterSid
    const selectedDept = this.departments.find(dept => dept.DepartmentMasterSid === response.DepartmentMasterSid);
    const selectCustomer = this.customers.find(cus => cus.CustomerMasterSid === response.CustomerMasterSid)
    if (selectedDept) {
      this.selectedDepartment = selectedDept;
      this.selectedFCLLCL = selectedDept.departmentName.includes('FCL') ? 'FCL' : 'LCL';
    }
    this.getEnquiryName(response.EnquirySid);
    console.log('Enquiry Number',this.rateEnquiryNumber)
    // Patch header fields
    this.quotationForm.patchValue({
      customerName: selectCustomer.CustomerMasterSid,
      CustomerAddress: selectCustomer.CustomerAddress1,
      EnquirySid : response.EnquirySid,
      quoteNo: response.QuoteNumber,
      quoteDate: new Date(response.QuoteDate),
      Segment: response.DepartmentMasterSid,
      status: response.status === "A" ? "Active" : "Suspend"
    });
    this.quotationForm.get('Segment')?.disable();
    // Get the FormArray for routes and clear existing data
    const routesArray = this.quotationForm.get('routes') as FormArray;
    routesArray.clear();

    // Loop through enquiryRoute and add routes dynamically
    response.quoteRoute.forEach(route => {
      const routeFormGroup = this.fb.group({
        QuoteRouteSid: [route.QuoteRouteSid || null], // Ensure Route ID is captured
        POR: [route.PORSid, Validators.required],
        POL: [route.POLSid, Validators.required],
        POD: [route.PODSid, Validators.required],
        FPOD: [route.FDPSid, Validators.required],
        Segment: [route.DepartmentMasterSid, Validators.required],
        segmentType: [route.segmentType, Validators.required],
        CarrierMasterSid: [route.CarrierMasterSid, Validators.required],
        effDate: [new Date(route.effDate)],
        expDate: [new Date(route.expdate)],
        cargoType: [route.cargoType, Validators.required],
        transit: [route.TransitDays, Validators.required],
        fortyft: [route.fortyft],
        twentyft: [route.twentyft],
        routeStatus: route.status === "A" ? "Active" : "Suspend",
        cargo: this.fb.array([]) // Initialize cargo array
      });

      // Get the cargo array inside the route
      const cargoArray = routeFormGroup.get('cargo') as FormArray;

      // Loop through enquiryCargo and add cargo rows dynamically
      route.quoteCharge.forEach(cargo => {
        const selectedUnit = this.unitMaster.find(unit => unit.UnitMasterSid === cargo.UnitMasterSid);
        const selectedCurrency = this.currencyMaster.find(currency => currency.CurrencyMasterSid === cargo.CurrencyMasterSid);
        cargoArray.push(this.fb.group({
          QuoteChargeSid: [cargo.QuoteChargeSid || null], // Ensure Cargo ID is captured
          charge: [cargo.ChargeDisplayName, Validators.required],
          unit: [selectedUnit ? selectedUnit.UnitMasterSid : '', Validators.required],
          currency: [selectedCurrency ? selectedCurrency.CurrencyMasterSid : '', Validators.required],
          perUnit: [cargo.perUnit, Validators.required],
          costCurrency: [cargo.costCurrency, Validators.required],
          costPerUnit: [cargo.costPerUnit, Validators.required],
          costUnit: [cargo.costUnit, Validators.required],
        }));
      });

      // Push the route to the FormArray
      routesArray.push(routeFormGroup);
    });
  }



  onSegmentChange(event: Event, routeIndex: number) {

    const selectedDepartmentId = Number((event.target as HTMLSelectElement).value);

    // Get the specific route form group
    const routeForm = this.routes.at(routeIndex) as FormGroup;
    routeForm.get('DepartmentMasterSid')?.setValue(selectedDepartmentId);

    // Once it is initialized and then made a segment change. The Value of previously selected segment will be still there.
    // So remove it
    routeForm.get('POR').reset();
    routeForm.get('POL').reset();
    routeForm.get('POD').reset();
    routeForm.get('FPOD').reset();

    const selectedDept = this.departments.find(dept => dept.DepartmentMasterSid === selectedDepartmentId);
    const selectedFCLLCL = selectedDept ? selectedDept.FCLLCL : 'LCL';

    // **Set segmentType (FCL or LCL) in the form group**
    routeForm.get('segmentType')?.setValue(selectedFCLLCL);

    // Update field visibility based on segment
    if (selectedFCLLCL === 'LCL') {
      routeForm.get('twentyft')?.clearValidators();
      routeForm.get('fortyft')?.clearValidators();
    } else if (selectedFCLLCL === 'FCL') {
      routeForm.get('twentyft')?.setValidators([Validators.required]);
      routeForm.get('fortyft')?.setValidators([Validators.required]);
    }

    routeForm.get('twentyft')?.updateValueAndValidity();
    routeForm.get('fortyft')?.updateValueAndValidity();




    setTimeout(() => {
      this.cdr.detectChanges(); // Ensure Angular detects the change
    }, 100);
  }






  onCustomerChange(event: Event): void {
    const selectedCustomerId = Number((event.target as HTMLSelectElement).value);
    this.quotationForm.get('CustomerMasterSid')?.setValue(selectedCustomerId);

    const selectedCustomer = this.customers.find(cust => cust.CustomerMasterSid === selectedCustomerId);
    console.log(selectedCustomer)
    this.selectedCustomerName = selectedCustomer?.CustomerName; // Store customer name if needed
    this.selectCustomerAddress = selectedCustomer?.CustomerAddress1
  }

  onCarrierChange(event: Event, routeIndex: number): void {
    const routeForm = this.routes.at(routeIndex) as FormGroup;
    const selectedCustomerId = Number((event.target as HTMLSelectElement).value);
    const selectedCustomer = this.carriers.find(cust => cust.CustomerMasterSid === selectedCustomerId);

    if (selectedCustomer) {
      routeForm.get('CarrierMasterSid')?.setValue(selectedCustomerId);
      routeForm.get('Carrier')?.setValue(selectedCustomer.CustomerName); // Corrected
    }
  }



  restrictDecimal(event: KeyboardEvent) {
    if (event.key === '.' || event.key === ',') {
      event.preventDefault(); // Prevents entering a decimal point or comma
    }
  }

  showToasterForErrors() {
    // Loop through all routes to check for the error
    this.routes.controls.forEach((route, index) => {
      if (route.hasError('polPodSame')) {
        this.toaster.error(`Route ${index + 1}: POL & POD should not be the same!`, "Error", {
          closeButton: true, timeOut: 2000
        });
      }

      if (route.hasError('expDateInvalid')) {
        this.toaster.error(`Route ${index + 1}: Expiry Date must be greater than Effective Date!`, "Error", {
          closeButton: true, timeOut: 2000
        });
      }
    });
  }

  onSubmit() {
    this.btnDisable = true;
    console.log(this.quotationForm.value)
    // return false;
    if (this.QuoteHeaderSid) {
      const updatePayload = {
        ...this.quotationForm.value,
        CustomerMasterSid: this.quotationForm.get('CustomerMasterSid')?.value,
        Segment: this.selectedDepartment,
        QuoteHeaderSid: this.QuoteHeaderSid,
        status: this.quotationForm.get('status')?.value,
        routes: this.quotationForm.value.routes.map(route => ({
          ...route,
          QuoteRouteSid: route.QuoteRouteSid,
          cargo: route.cargo.map(cargo => ({
            ...cargo,
            QuoteChargeSid: cargo.QuoteChargeSid
          }))
        }))
      };
      this.leadService.updateQuoteById(this.QuoteHeaderSid, updatePayload).subscribe(
        resp => {
          console.log('API Response:', resp); // Debugging step

          if (resp) {
            // this.appSettingsService.showSuccess("Enquiry Updated SuccessFully");
            this.modalService.openSuccessModal("Quotation Updated Successfully")
            this.btnDisable = false;
            // this.quotationForm.patchValue(resp.data);
            this.router.navigate(['crm/quotation/list'])
          } else {
            // this.appSettingsService.showError("Enquiry Update Failed");
            this.modalService.openErrorModal("Quotation Update Failed");
          }
        }
      )
    } else {
      const createPayload = {
        ...this.quotationForm.value,
        DepartmentMasterSid: this.quotationForm.get('DepartmentMasterSid')?.value,
        CustomerMasterSid: this.quotationForm.get('CustomerMasterSid')?.value,
        CustomerName: this.selectedCustomerName, // Store customer name
        Segment: this.selectedDepartment, // Ensure the segment name is included
        CustomerAddress: this.selectCustomerAddress
      }
      console.log(createPayload,'createPayload')
      this.leadService.createQuotation(createPayload).subscribe(
        resp => {
          if (resp.status) {
            // this.appSettingsService.showSuccess("Enquiry Created SuccessFully");
            this.modalService.openSuccessModal("Quotation Created Successfully");
            this.btnDisable = false;
            // this.quotationForm.patchValue(resp.data);
            this.router.navigate(['crm/quotation/list'])
          } else {
            // this.appSettingsService.showError("Enquiry Creation Failed");
            this.modalService.openErrorModal("Quotation Creation Failed");
          }
        }
      )
    }
    this.btnDisable = false;
  }

  resetForm() {
    this.quotationForm.reset();
  }

  goBack() {
    history.back()
  }




  removeRoute(index: number, routeId: number) {
    if (routeId) {
      const confirmDelete = window.confirm("Are you sure you want to delete this route?");
      if (!confirmDelete) return;
      // Call API to delete from backend if necessary
      this.leadService.deleteRoute(routeId).subscribe(() => {
        this.routes.removeAt(index);
      }, error => {
        console.error('Error deleting route:', error);
      });
    } else {
      // Just remove from the form if it's not saved yet
      this.routes.removeAt(index);
    }
  }



  deleteCargo(routeIndex: number, cargoIndex: number, chargeId: number | null) {
    const routesArray = this.quotationForm.get('routes') as FormArray;
    const cargoArray = routesArray.at(routeIndex).get('cargo') as FormArray;

    if (chargeId) {
      const confirmDelete = window.confirm("Are you sure you want to delete this charge?");
      if (!confirmDelete) return;
      // Call API to delete from backend
      this.leadService.deleteCharge(chargeId).subscribe(() => {
        cargoArray.removeAt(cargoIndex);
        this.quotationForm.updateValueAndValidity();
        this.cdr.detectChanges(); // Force UI refresh
      }, error => {
        console.error('Error deleting cargo:', error);
      });
    } else {
      // Just remove from the form if it's not saved yet
      cargoArray.removeAt(cargoIndex);
      this.quotationForm.updateValueAndValidity();
      this.cdr.detectChanges();
    }
  }

 
  getEnquiryName(EnquirySid:number){
    if(!EnquirySid) return;
    this.leadService.getAllEnquiries().subscribe(
      (resp:any)=>{
        if(resp.status){
          let enquiryData = resp.data;
          this.rateEnquiryNumber =  enquiryData.find(data => data.EnquiryHeaderSid === EnquirySid).EnquiryNumber;
        } else {
          this.appSettingsService.showError('Error Loading Enquiry Data');
        }
      }
    )

  }

  getFilteredPOLPorts(routeIndex: number): any[] {
    if(!this.ports){
      return null;
    }
    const currentPOD = this.routes.at(routeIndex).get('POD')?.value;
    this.filterPortBySegment(routeIndex);
    return this.filteredPorts.filter(port => port.PortMasterSid != currentPOD);
  }

  getFilteredPODPorts(routeIndex: number): any[] {
    if(!this.ports){
      return null;
    }
    const currentPOL = this.routes.at(routeIndex).get('POL')?.value;
    this.filterPortBySegment(routeIndex);
    return this.filteredPorts.filter(port => port.PortMasterSid != currentPOL);
  }

  filterPortBySegment(routeIndex){
    const segmentType =this.routes.controls[routeIndex].get('segmentType')?.value
    if(segmentType==='AIR'){
      this.filteredPorts = this.ports.filter(port => port.PortType === 'Air')
    } else if(segmentType === 'FCL' || segmentType === 'LCL'){
      this.filteredPorts = this.ports.filter(port => port.PortType === 'Sea')
    }
  }

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  showInfo() {
    if(!this.quotationData) return;
    const modalRef = this.ngbModal.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.quotationData;
    modalRef.componentInstance.idLabel = 'Quotation Id';
    modalRef.componentInstance.idValue = this.quotationData?.QuoteHeaderSid;
  }

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.leadService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.ngbModal.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.QuoteHeaderSid;

        } else {
          this.appSettingsService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingsService.showError('Error loading Terms and Conditions',error);
      }
    );
  }

  openEmail() {
		if (!this.quotationData) return;
		const modalRef = this.ngbModal.open(EmailEntryComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
	}

	openAuthority() {
		// if (!this.tariffData) return;
		// const modalRef = this.modalService.open(AuthorityEntryComponent, {
		// 	size: 'lg',
		// 	centered: true,
		// 	backdrop: 'static'
		// });
	}

	openEDoc() {
		// if (!this.tariffData) return;
		// const modalRef = this.modalService.open(EdocComponent, {
		// 	size: 'lg',
		// 	centered: true,
		// 	backdrop: 'static'
		// });
	}

}
