import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { AppService } from 'src/app/service/app.service';

import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { LeadService } from '../../Services/lead.service';


@Component({
  selector: 'app-enquiry-entry',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    NgbDatepickerModule,
    DatePipe
  ],
  templateUrl: './enquiry-entry.component.html',
  styleUrl: './enquiry-entry.component.scss',
    providers: [
      { provide: NgbDateAdapter, useClass: CustomDateAdapter },
      { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    ],
})
export class EnquiryEntryComponent implements OnInit {
  selectedDepartment: any;
  isMobile: boolean = false;
  rateRequestForm!: FormGroup;
  EnquiryHeaderSid: any;
  isEditMode = false; // Flag for edit mode
  customers: any;
  packageTypes: any;
  containerTypes: any;
  // ports: any
  departments: any;
  enquiryForm: FormGroup;
  errorMessage: string = ''; // To store any error messages
  btnDisable: boolean = false;
  enquiry: any;
  selectedFCLLCL: string = ''; // Store selected segment's FCL/LCL type
  selectedCustomerName: any;
  statusList = ['Active', 'Suspended'];
  minDate: string = '';
  rateRequest: boolean = false;
  ports = [];
  filteredPorts = [];
  searchText = '';
  selectedPort: any;
  quotationEnquiryNumber: any;
	today = this.calendar.getToday();
	todayDate = new Date(this.today.year,this.today.month,this.today.day);
  rateRequestData : any;
  currentMenuId: number;
  TandCList: any;
  productList : any[];

  constructor(
    private appService: AppService,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: ModalService,
    private toaster: ToastrService,
    private calendar: NgbCalendar,
    private ngbModal : NgbModal
  ) {}

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice();
    this.loadCustomers();
    this.loadDepartment();
    this.loadCargoTypes();
    this.loadContainerTypes();
    this.loadPorts();
    this.initializeForm();
    this.loadProducts();

    this.activatedRoute.paramMap.subscribe((params) => {
      this.EnquiryHeaderSid = +params.get('id');
      if (this.EnquiryHeaderSid) {
        this.isEditMode = true;
        this.loadEnquiry(this.EnquiryHeaderSid);
      }
    });

    this.rateRequestForm.statusChanges.subscribe(() => {
      this.showToasterForErrors();
    });
  }

  showToasterForErrors() {
    // Loop through all routes to check for the error
    this.routes.controls.forEach((route, index) => {
      if (route.hasError('polPodSame')) {
        this.toaster.error(
          `Route ${index + 1}: POL & POD should not be the same!`,
          'Error',
          {
            closeButton: true,
            timeOut: 2000,
          }
        );
      }
    });
  }

  modeOfEnquiry=[
    {id:1,name:"Email"},
    {id:2,name:"Phone"},
    {id:3,name:"Lead"},
    {id:4,name:"Visit"},
    {id:5,name:"Others"}
  ]

  terms=[
    {id:1,name:"FCL"},
    {id:2,name:"FCL.FCL"},
    {id:3,name:"LCL,LCL"},
    {id:4,name:"LCL,LCL"},
    {id:5,name:"FCL,FLT HH"},
    {id:6,name:"FTL,LTL"}
  ]

  modeOfAddtionalService=[
    {id:1,name:'Lashing'},
    {id:2,name:'Labelling'},
    {id:3,name:"Choking"},
    {id:4,name:"Fumigation"},
    {id:5,name:"Palletization"}
  ]

  initializeForm() {
    this.rateRequestForm = this.fb.group({
      // Header Data
      customerName: ['', Validators.required],
      shipmentDate: ['', Validators.required],
      Segment: ['', Validators.required],
      status: [''], // Default
      DepartmentMasterSid: [''],
      CustomerMasterSid: [''],
      modeOfEnquiry: [''],             
      additionalService: [''], 
      Remarks:[''],
      // Routes (Multiple)
      routes: this.fb.array([]),
    });

    this.addRoute(); // Add at least one route by default
  }

  // Getters for Form Arrays
  get routes(): FormArray {
    return this.rateRequestForm.get('routes') as FormArray;
  }

  routeCargo(routeIndex: number): FormArray {
    return this.routes.at(routeIndex).get('cargo') as FormArray;
  }

  // Add New Route
  addRoute() {
    const routeForm = this.fb.group(
      {
        POO: ['', Validators.required],
        POL: ['', Validators.required],
        POD: ['', Validators.required],
        FDC: ['', Validators.required],
        cargo: this.fb.array([]),
      },
      { validator: this.validatePOLPOD } // Attach the custom validator
    );

    // Subscribe to POD changes and update FDC automatically
    routeForm.get('POD')?.valueChanges.subscribe((selectedPOD) => {
      if (selectedPOD) {
        routeForm.patchValue({ FDC: selectedPOD }, { emitEvent: false });
      }
    });
    this.routes.push(routeForm);
    this.addCargo(this.routes.length - 1); // Add at least one cargo row by default
  }

  // Add New Cargo Row to a Route
  addCargo(routeIndex: number) {
    const cargoForm = this.fb.group({
      cargoType: ['', Validators.required],
      contentType: [''],
      product: ['', Validators.required],
      Qty: ['', [Validators.required, Validators.pattern('^\\d{1,5}$')]],
      Weight: [
        '',
        [Validators.required, Validators.pattern('^\\d{1,5}(\\.\\d{1,3})?$')],
      ],
      cbm: ['', Validators.pattern('^\\d{1,3}(\\.\\d{1,3})?$')],
    });

    this.routeCargo(routeIndex).push(cargoForm);
  }

  // Remove a Route
  removeRoute(index: number) {
    this.routes.removeAt(index);
  }

  // Remove a Cargo Row from a Route
  removeCargo(routeIndex: number, cargoIndex: number) {
    this.routeCargo(routeIndex).removeAt(cargoIndex);
  }

  deleteCargo(index: number) {
    (this.routeCargo(index) as FormArray).removeAt(index);
  }

  validatePOLPOD(group: AbstractControl): ValidationErrors | null {
    const pol = group.get('POL')?.value;
    const pod = group.get('POD')?.value;

    return pol && pod && pol === pod ? { polPodSame: true } : null;
  }

  // Create a single row FormGroup
  createRow(): FormGroup {
    return this.fb.group({
      cargoType: ['', Validators.required],
      product: ['', Validators.required],
      Qty: ['', Validators.required],
      Weight: ['', Validators.required],
      Volume: ['', Validators.required],
      contentType: ['', Validators.required],
    });
  }
  // Access the cargoRoutes FormArray
  get cargoRoutes(): FormArray {
    return this.rateRequestForm.get('cargoRoutes') as FormArray;
  }

  getRows(routeIndex: number): FormArray {
    return this.routes.at(routeIndex).get('cargo') as FormArray;
  }

  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.rateRequestForm.controls;
  }

  // getFormGroup(index: number): FormGroup {
  //   return this.cargoRoutes.at(index) as FormGroup;
  // }

  getCurrentDateTime(): string {
    const now = new Date();
    return now.toISOString().slice(0, 16); // Format as 'YYYY-MM-DDTHH:mm'
  }

  // onSegmentChange(event: Event) {
  //   const selectedDepartmentName = (event.target as HTMLSelectElement).value
  //   this.rateRequestForm.get('DepartmentMasterSid')?.setValue(Number((event.target as HTMLSelectElement).value));
  //   const selectedDept = this.departments.find(dept => dept.departmentName === selectedDepartmentName);
  //   console.log(selectedDept)
  //   this.selectedDepartment = selectedDept?.departmentName
  //   this.selectedFCLLCL = selectedDept ? selectedDept.FCLLCL : 'LCL';
  //   setTimeout(() => {
  //     this.cdr.detectChanges(); // Ensure Angular detects the change
  //   }, 100);

  // }
  onSegmentChange(event) {
    if(!event){
      return;
    }
    const selectedDepartmentId = Number(event);
    this.rateRequestForm
      .get('DepartmentMasterSid')
      ?.setValue(selectedDepartmentId);

    const selectedDept = this.departments.find(
      (dept) => dept.DepartmentMasterSid === selectedDepartmentId
    );
    console.log(selectedDept);

    this.selectedDepartment = selectedDept?.departmentName;
    this.selectedFCLLCL = selectedDept ? selectedDept.FCLLCL : 'LCL';

    this.routes.controls.forEach((routeGroup: FormGroup) => {  
      routeGroup.get('POO')?.setValue('');
      routeGroup.get('POL')?.setValue('');
      routeGroup.get('POD')?.setValue('');
      routeGroup.get('FDC')?.setValue('');
      const cargoArray = routeGroup.get('cargo') as FormArray; // Explicitly cast as FormArray

      cargoArray.controls.forEach((cargoControl, cargoIndex: number) => {
        const cargoForm = cargoControl as FormGroup; // Now safely treated as FormGroup

        if (this.selectedFCLLCL === 'LCL') {
          cargoForm.get('contentType')?.clearValidators(); // contentType NOT required
          cargoForm.get('cbm')?.setValidators([Validators.required]); // cbm IS required
        } else if (this.selectedFCLLCL === 'FCL') {
          cargoForm.get('contentType')?.setValidators([Validators.required]); // contentType IS required
          cargoForm.get('cbm')?.clearValidators(); // cbm NOT required
        } else  if(this.selectedFCLLCL==='AIR'){
              cargoForm.get('contentType')?.setValidators([Validators.required]); // contentType IS required
          cargoForm.get('cbm')?.clearValidators(); // cbm NOT required
        }

        cargoForm.get('contentType')?.updateValueAndValidity();
        cargoForm.get('cbm')?.updateValueAndValidity();
      });
    });


    console.log('Selected Department',selectedDept);
    if(selectedDept.FCLLCL==='AIR'){
      this.filteredPorts = this.ports.filter(port => port.PortType === 'Air')
      console.log('Air Selected',this.filteredPorts);
    } else if(selectedDept.FCLLCL === 'FCL' || selectedDept.FCLLCL === 'LCL'){
      this.filteredPorts = this.ports.filter(port => port.PortType === 'Sea')
      console.log('FCL / LCL Selected',this.filteredPorts);
    }

    setTimeout(() => {
      this.cdr.detectChanges(); // Ensure Angular detects the change
    }, 100);
  }

  onCustomerChange(CustomerMasterSid): void {
    const selectedCustomerId = CustomerMasterSid
    this.rateRequestForm.get('CustomerMasterSid')?.setValue(selectedCustomerId);

    const selectedCustomer = this.customers.find(
      (cust) => cust.CustomerMasterSid === selectedCustomerId
    );
    this.selectedCustomerName = selectedCustomer?.CustomerName; // Store customer name if needed
  }

  loadCustomers(): void {
    this.leadService.getAllCustomers().subscribe((resp: any) => {
      this.customers = resp;
    });
  }

  loadDepartment(): void {
    this.leadService.getAllDepartments().subscribe((resp: any) => {
      this.departments = resp;
    });
  }

  loadCargoTypes(): void {
    this.leadService.getAllCargoTypes().subscribe((resp: any) => {
      console.log(resp);
      this.packageTypes = resp;
    });
  }

  loadContainerTypes(): void {
    this.leadService.getAllContainerTypes().subscribe((resp: any) => {
      console.log(resp);
      this.containerTypes = resp;
    });
  }

  // loadPorts(): void {
  //   this.leadService.getAllPorts().subscribe(
  //     (resp: any) => {
  //       this.ports = resp
  //     });
  // }

  loadPorts(): void {
    this.leadService.getAllPorts().subscribe((resp: any) => {
      this.ports = resp;
      this.filteredPorts = [...this.ports];
    });
  }

 
onFilter(search: string) {
  const normalizedSearch = search.toLocaleLowerCase();
  this.filteredPorts = this.ports.filter(port =>
    port.PortCode?.toLocaleLowerCase().includes(normalizedSearch)
  );
}


  loadEnquiry(id): void {
    this.leadService.getEnquiryById(id).subscribe((resp: any) => {
      if (resp) {
        this.patchValues(resp);
        this.rateRequestData = resp;
      }
    });
  }

  quotationCustomerId: number;
  quotationDepartmentId: number;
  quotationPOL: number;
  quotationPOD: number;

  patchValues(response: any) {
    this.selectedDepartment = response.ShipmentType;
    this.selectedFCLLCL = response.ShipmentType.includes('FCL') ? 'FCL' : 'LCL';
    // Patch header fields
    this.quotationEnquiryNumber = response.EnquiryNumber;
    this.quotationCustomerId = response.CustomerMasterSid;
    this.quotationDepartmentId = response.DepartmentMasterSid;

    this.rateRequestForm.patchValue({
      customerName: response.CustomerMasterSid,
      shipmentDate:new Date(response.ShipmentExpectedDate),
      Segment: response.DepartmentMasterSid,
      status: response.status === 'A' ? 'Active' : 'Suspended',
    });
    this.rateRequestForm.get('Segment')?.disable();
    // Get the FormArray for routes and clear existing data
    const routesArray = this.rateRequestForm.get('routes') as FormArray;
    routesArray.clear();

    // Loop through enquiryRoute and add routes dynamically
    response.enquiryRoute.forEach((route) => {
      this.quotationPOL = route.POLSid;
      this.quotationPOD = route.PODSid;
      const routeFormGroup = this.fb.group({
        EnquiryRouteSid: [route.EnquiryRouteSid || null], // Ensure Route ID is captured
        POO: [route.PORSid, Validators.required],
        POL: [route.POLSid, Validators.required],
        POD: [route.PODSid, Validators.required],
        FDC: [route.FDPSid, Validators.required],
        cargo: this.fb.array([]), // Initialize cargo array
      });

      // Get the cargo array inside the route
      const cargoArray = routeFormGroup.get('cargo') as FormArray;

      // Loop through enquiryCargo and add cargo rows dynamically
      route.enquiryCargo.forEach((cargo) => {
        cargoArray.push(
          this.fb.group({
            EnquiryCargoSid: [cargo.EnquiryCargoSid || null], // Ensure Cargo ID is captured
            cargoType: [cargo.CargoType, Validators.required],
            contentType: [cargo.ContainerType || '', Validators.required], // Default empty if null
            product: [cargo.ProductName, Validators.required],
            Qty: [cargo.Qty, Validators.required],
            Weight: [cargo.GrossWeight, Validators.required],
            cbm: [cargo.Volume, Validators.required],
          })
        );
      });

      // Push the route to the FormArray
      routesArray.push(routeFormGroup);
    });
  }

  restrictDecimal(event: KeyboardEvent) {
    if (event.key === '.' || event.key === ',') {
      event.preventDefault(); // Prevents entering a decimal point or comma
    }
  }

  onSubmit() {
    this.btnDisable = true;
    if (this.EnquiryHeaderSid) {
      const updatePayload = {
        ...this.rateRequestForm.value,
        CustomerMasterSid: this.rateRequestForm.get('CustomerMasterSid')?.value,
        Segment: this.selectedDepartment,
        EnquiryHeaderSid: this.EnquiryHeaderSid,
        status:
          this.rateRequestForm.get('status')?.value === 'Active' ? 'A' : 'S',
        routes: this.rateRequestForm.value.routes.map((route) => ({
          ...route,
          EnquiryRouteSid: route.EnquiryRouteSid,
          cargo: route.cargo.map((cargo) => ({
            ...cargo,
            EnquiryCargoSid: cargo.EnquiryCargoSid,
          })),
        })),
      };
      this.leadService
        .updateEnquiryById(this.EnquiryHeaderSid, updatePayload)
        .subscribe((resp) => {
          console.log('API Response:', resp); // Debugging step

          if (resp) {
            // this.appSettingsService.showSuccess("Enquiry Updated SuccessFully");
            this.modalService.openSuccessModal('Enquiry Updated Successfully');
            this.btnDisable = false;
            // this.rateRequestForm.patchValue(resp.data);
            this.router.navigate(['crm/enquiry/list']);
          } else {
            // this.appSettingsService.showError("Enquiry Update Failed");
            this.modalService.openErrorModal('Enquiry Update Failed');
          }
        });
    } else {
      const createPayload = {
        ...this.rateRequestForm.value,
        DepartmentMasterSid: this.rateRequestForm.get('DepartmentMasterSid')
          ?.value,
        CustomerMasterSid: this.rateRequestForm.get('CustomerMasterSid')?.value,
        CustomerName: this.selectedCustomerName, // Store customer name
        Segment: this.selectedDepartment, // Ensure the segment name is included
      };
      console.log(createPayload);
      this.leadService.createEnquiry(createPayload).subscribe((resp) => {
        if (resp.status) {
          // this.appSettingsService.showSuccess("Enquiry Created SuccessFully");
          this.modalService.openSuccessModal('Enquiry Created Successfully');
          this.btnDisable = false;
          // this.rateRequestForm.patchValue(resp.data);
          this.router.navigate(['crm/enquiry/list']);
        } else {
          // this.appSettingsService.showError("Enquiry Creation Failed");
          this.modalService.openErrorModal('Enquiry Creation Failed');
        }
      });
    }
    this.btnDisable = false;
  }

  resetForm() {
    this.rateRequestForm.reset();
  }

  goBack() {
    history.back();
  }

  navigateQuotation() {
    const polList = this.rateRequestForm.value.routes.map((route) => route.POL);
    const podList = this.rateRequestForm.value.routes.map((route) => route.POD);
    // Extract all cargoType values from each route
    const cargoTypeList = this.rateRequestForm.value.routes.flatMap((route) =>
      route.cargo.map((cargoItem) => cargoItem.cargoType)
    );
    this.leadService.clearQuotationData(); // <-- Add this line to clear previous data

    this.leadService.setQuotationData({
      customerId: this.quotationCustomerId,
      departmentId: this.quotationDepartmentId,
      EnquirySid : this.EnquiryHeaderSid,
      EnquiryNumber : this.quotationEnquiryNumber,
      polList: polList, // Sending as an array
      podList: podList, // Sending as an array
      cargoTypeList: cargoTypeList,
      rateRequest: true,
      active: 2,
    });

    this.router.navigate(['crm/quotation/view']);
  }

  getFilteredPOLPorts(routeIndex: number): any[] {
    if(!this.ports){
      return [];
    }
    const currentPOD = this.routes.at(routeIndex).get('POD')?.value;
    this.filterPortBySegment();
    return this.filteredPorts.filter(port => port.PortMasterSid != currentPOD);
  }

  getFilteredPODPorts(routeIndex: number): any[] {
    if(!this.ports){
      return [];
    }
    const currentPOL = this.routes.at(routeIndex).get('POL')?.value;
    this.filterPortBySegment();
    return this.filteredPorts.filter(port => port.PortMasterSid != currentPOL);
  }

  filterPortBySegment(){
    if(!this.ports){
      return;
    }
    if(this.selectedFCLLCL==='AIR'){
      this.filteredPorts = this.ports.filter(port => port.PortType === 'Air')
    } else if(this.selectedFCLLCL === 'FCL' || this.selectedFCLLCL === 'LCL'){
      this.filteredPorts = this.ports.filter(port => port.PortType === 'Sea')
    }
  }

  loadProducts(){
    this.leadService.getAllProducts().subscribe(
      (resp:any)=>{
        if(resp.status){
          this.productList = resp.data;
        } else {
          console.error('Error loading Product');
          this.appSettingsService.showError('Error loading products.')
        }
      }
    )
  }

  showInfo() {
    if(!this.rateRequestData) return;
    const modalRef = this.ngbModal.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.rateRequestData;
    modalRef.componentInstance.idLabel = 'Rate Request Id';
    modalRef.componentInstance.idValue = this.rateRequestData?.EnquiryHeaderSid;
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
          modalRef.componentInstance.DocumentSid =this.rateRequestData?.EnquiryHeaderSid;

        } else {
          this.appSettingsService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingsService.showError('Error loading Terms and Conditions', error);
      }
    );
  }
  openEmail() {
		if (!this.rateRequestData) return;
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
