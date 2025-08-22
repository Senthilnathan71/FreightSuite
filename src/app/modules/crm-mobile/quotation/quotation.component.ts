import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
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
import { NgSelectModule } from '@ng-select/ng-select';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';


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
    NgbDatepickerModule,
    NgSelectModule,
    FormsModule
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
  incoList : any[] = [];
  departments: any[] = []
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
	todayDate = new Date(this.today.year,this.today.month -1,this.today.day);
  minQuoteDate :any;
  minEffDate : any;
  quotationData : any;
  TandCList : any[] = [];
  currentMenuId : number;
  salesmanList : any[] = [];
  userData : any;
  permissions : any[] = [];
  cusBranchList : any[] = [];
  currentMenuPermissions = {}
  cusBranchEmail :any;
  isAuthorizedUser : boolean;
  authStateCache : string;
  currentCompany : any;
  currentBranch : any;
  
auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

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

    this.setMinDate();
    this.initializeForm();
    this.isMobile = this.appService.getDevice();
    const userProfile = this.appSettingsService.getDecryptedUserProfile();
    if(userProfile){
      this.userData = userProfile;
      this.checkPermissions();
    }
     const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingsService.decrypt(storedCompany) : null;
     const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingsService.decrypt(storedBranch) : null;
    console.info(this.currentBranch)
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;

    forkJoin({
      cargoTypes: this.leadService.getAllCargoTypes(CompanyMasterSid).pipe(catchError(err => of([]))),
      carriers: this.leadService.getAllCarrier(CompanyMasterSid).pipe(catchError(err => of([]))),
      customers: this.leadService.getAllCustomers(CompanyMasterSid).pipe(catchError(err => of([]))),
      departments: this.leadService.getAllDepartments(CompanyMasterSid).pipe(catchError(err => of([]))),
      ports: this.leadService.getAllPorts().pipe(catchError(err => of([]))),
      incos : this.leadService.getAllIncos().pipe(catchError(err => of([]))),
      salesman : this.leadService.getAllSalesman().pipe(catchError(err => of([]))),
      masters: this.leadService.getAllMasters(CompanyMasterSid).pipe(catchError(err => of({ charges: [], currencies: [], units: [] })))
    }).subscribe(({ cargoTypes, carriers, customers, departments, ports,incos,salesman, masters }) => {
      this.packageTypes = cargoTypes || [];
      this.carriers = carriers || [];
      this.customers = customers || []; // Ensure customers is always defined
      this.departments = departments;
      this.ports = ports;
      this.chargeMaster = masters.charges;
      this.currencyMaster = masters.currencies;
      this.unitMaster = masters.units;
      this.incoList = incos;
      this.salesmanList = salesman;

      this.activatedRoute.paramMap.subscribe(params => {
        this.QuoteHeaderSid = +params.get('id');
        if (this.QuoteHeaderSid) {
          this.isEditMode = true;
          this.minQuoteDate = undefined;
          this.loadEnquiry(this.QuoteHeaderSid);
          this.checkAuthorisedPerson(this.userData?.UserMasterSid,this.QuoteHeaderSid);
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

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    if (currentMenuId && userRole) {
      this.leadService
        .getRoleMenuPermissions(currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
          },
        });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  checkAuthorisedPerson(UserMasterSid,QuoteHeaderSid){
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    if(!UserMasterSid || !currentMenuId){
      return;
    }
    this.leadService.isUserAuthorizer(UserMasterSid,currentMenuId,QuoteHeaderSid).subscribe(
      (resp:any)=>{
          this.isAuthorizedUser = resp.data?.canAuthorize
      }
    )
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
      CustomerMasterSid: [null],
      CustomerAddress: [null],
      CustomerBranchSid : [''],
      Remarks:[''],
      IncoTerms : [null],
      Email : ['',[EmailValidators.multipleEmails()]],
      SalesmanSid : [null],
      ClearanceBy : [null],
      TransportBy : [null],
      authorizerStatus : ['Pending',(this.isEditMode && this.isAuthorizedUser) ?[this.statusRequiredValidator] : []],
      AuthorizerRemarks : [''],
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
      POR: [null, Validators.required],
      POL: [null, Validators.required],
      POD: [null, Validators.required],
      FPOD: [null, Validators.required],
      Carrier: ['', Validators.required],
      CarrierMasterSid: [null],
      POLFreeDays : [,[Validators.min(0),Validators.max(99)]],
      PODFreeDays : [,[Validators.min(0),Validators.max(99)]],
      TransitDays : [,[Validators.min(0),Validators.max(999)]],
      Segment: [null, Validators.required],
      segmentType: ['LCL'],
      cargoType: [null, Validators.required],
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
    const isFCL = this.routes.at(routeIndex).get('segmentType')?.value === 'FCL';
    const cargoForm = this.fb.group({
      charge: [null, Validators.required],
      Qty : ['',[Validators.required,Validators.min(1),Validators.max(9999)]],
      unit: [null, Validators.required],
      currency: [null, Validators.required],
      // twentyft: ['', isFCL ? Validators.required : []],
      // fortyft: ['', isFCL ? Validators.required : []],
      perUnit: ['', Validators.required],
      costUnit: [null, Validators.required],
      costCurrency: [null, Validators.required],
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
    if(this.isEditMode){
      this.minEffDate = undefined
    } else {
      this.minEffDate = this.toNgbDateStruct(this.todayDate)
    }
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
          this.patchValues(resp.status)
          this.quotationData = resp;
        }
      });
  }





  patchValues(response: any) {
    // Find the department based on DepartmentMasterSid
    const selectedDept = this.departments.find(dept => dept.DepartmentMasterSid === response.DepartmentMasterSid);
    const selectCustomer = this.customers.find(cus => cus.CustomerMasterSid === response?.CustomerMasterSid)
    console.log(selectCustomer);
    this.selectedCustomerName = selectCustomer.CustomerName;
    if (selectedDept) {
      this.selectedDepartment = selectedDept;
      this.selectedFCLLCL = selectedDept.departmentName.includes('FCL') ? 'FCL' : 'LCL';
    }
    this.getEnquiryName(response.EnquirySid);
    // Patch header fields
    this.quotationForm.patchValue({
      CustomerMasterSid: selectCustomer.CustomerMasterSid,
      CustomerName : selectCustomer.CustomerName,
      CustomerAddress: response.CustomerAddress,
      Email : response.Email,
      IncoTerms : response.IncoTerms || null,
      ClearanceBy : response.ClearanceBy,
      TransportBy : response.TransportBy,
      EnquirySid : response.EnquirySid,
      SalesmanSid : response.SalesmanSid,
      CustomerBranchSid : response.CustomerBranchSid,
      Remarks : response.Remarks,
      quoteNo: response.QuoteNumber,
      quoteDate: new Date(response.QuoteDate),
      Segment: response.DepartmentMasterSid,
      status: response.status === "A" ? "Active" : "Suspended",
      authorizerStatus : response.authorizerStatus || 'Pending',
      AuthorizerRemarks : response.AuthorizerRemarks
    });
    this.authStateCache = response.authorizerStatus || 'Pending';
    this.getCustomerBranches(selectCustomer.CustomerMasterSid);
    this.quotationForm.get('Segment')?.disable();
    // Get the FormArray for routes and clear existing data
    const routesArray = this.quotationForm.get('routes') as FormArray;
    routesArray.clear();

    // Loop through enquiryRoute and add routes dynamically
    response.quoteRoute.forEach((route,index) => {
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
        POLFreeDays: [route.POLFreeDays, [Validators.min(0), Validators.max(99)]],
        PODFreeDays: [route.PODFreeDays, [Validators.min(0), Validators.max(99)]],
        TransitDays: [route.TransitDays, [Validators.min(0), Validators.max(999)]],
        routeStatus: route.status === "A" ? "Active" : "Suspended",
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
          Qty : [cargo.Qty,[Validators.required,Validators.min(1),Validators.max(9999)]],
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

      const department = this.departments.find(d => d.DepartmentMasterSid === route.DepartmentMasterSid)
      this.onSegmentChange(department,index);
    });
  }


  
openAuditLogs(modal: TemplateRef<any>) {
  if (!this.QuoteHeaderSid) return;

  this.leadService.getAuditLogsQuotation('QuoteHeader', this.QuoteHeaderSid.toString()).subscribe({
    next: (logs: any[]) => {
      const formatFields = (val: any) => {
        if (!val) return ['NA'];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        delete obj.updatedOn; // Remove updatedOn field
        // If no fields exist after deleting updatedOn
        if (Object.keys(obj).length === 0) return ['NA'];
        return Object.entries(obj).map(
          ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
        );
      };

      this.auditLogs = logs.map(log => ({
        ...log,
        oldValDisplay: formatFields(log.oldVal),
        newValDisplay: formatFields(log.newVal)
      }));

      this.auditLogModalRef = this.ngbModal.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
}

  onSegmentChange(event: any, routeIndex: number) {
    if(!event || event === null || event === undefined || !this.departments || this.departments === undefined){
      const routeForm = this.routes.at(routeIndex) as FormGroup;
      routeForm.get('DepartmentMasterSid').reset();
      routeForm.get('POR').reset();
      routeForm.get('POL').reset();
      routeForm.get('POD').reset();
      routeForm.get('FPOD').reset();
      routeForm.get('segmentType')?.setValue('LCL');
      routeForm.get('twentyft')?.clearValidators();
      routeForm.get('fortyft')?.clearValidators();
      routeForm.get('twentyft')?.updateValueAndValidity();
      routeForm.get('fortyft')?.updateValueAndValidity();
      return;
    }
    
    const selectedDepartmentId = event.DepartmentMasterSid;
    
    // Get the specific route form group
    const routeForm = this.routes.at(routeIndex) as FormGroup;
    routeForm.get('DepartmentMasterSid')?.setValue(selectedDepartmentId);
    
    
    const selectedDept =event;
    const selectedFCLLCL = selectedDept ? selectedDept.FCLLCL : 'LCL';
    
    // **Set segmentType (FCL or LCL) in the form group**
    routeForm.get('segmentType')?.setValue(selectedFCLLCL);
    
    // Update field visibility based on segment
    const cargoArray = this.routeCargo(routeIndex);
    cargoArray.controls.forEach((cargoForm: FormGroup) => {
      if (selectedFCLLCL === 'LCL') {
        cargoForm.get('twentyft')?.clearValidators();
        cargoForm.get('fortyft')?.clearValidators();
      } else {
        cargoForm.get('twentyft')?.setValidators([Validators.required]);
        cargoForm.get('fortyft')?.setValidators([Validators.required]);
      }
      cargoForm.get('twentyft')?.updateValueAndValidity();
      cargoForm.get('fortyft')?.updateValueAndValidity();
    });





    setTimeout(() => {
      this.cdr.detectChanges(); // Ensure Angular detects the change
    }, 100);
  }






  onCustomerChange(event: any): void {
    if (!event || event === null || event === undefined) {
      this.selectedCustomerName = '';
      this.selectCustomerAddress = '';
      this.cusBranchList = [];
      this.quotationForm.get('customerName').setValue('')
      this.quotationForm.get('CustomerAddress').setValue(null);
      this.quotationForm.get('Email').setValue('');
      return;
    }
    const selectedCustomerId = event.CustomerMasterSid;
    this.quotationForm.get('customerName').setValue('');
    this.quotationForm.get('CustomerAddress').setValue(null);
    this.quotationForm.get('CustomerMasterSid')?.setValue(selectedCustomerId);
    this.quotationForm.get('Email').setValue('');

    const selectedCustomer = event;
    this.selectedCustomerName = selectedCustomer?.CustomerName; // Store customer name if needed
    this.selectCustomerAddress = selectedCustomer?.CustomerAddress1
    this.quotationForm.get('customerName').setValue(this.selectedCustomerName)
    // this.quotationForm.get('CustomerAddress').setValue(this.selectCustomerAddress)
    this.getCustomerBranches(selectedCustomerId);    
  }

  getCustomerBranches(CustomerMasterSid:number){
    this.leadService.getCustomerBranchByCustomerId(CustomerMasterSid).subscribe(
      (resp:any) => {
        if(resp.status){
          this.cusBranchList = resp.data;
        } else {
          this.appSettingsService.showError('Error loading customer branches.')
          console.error(resp.message);
        }
      }
    )
  }

  onCustomerAddressChange(event){
    if(event === null || event === undefined || !event){
      this.quotationForm.get('CustomerBranchSid').setValue(null);
      this.quotationForm.get('Email').setValue('');
      return;
    }
    this.quotationForm.get('CustomerBranchSid').setValue(event.CustomerBranchSid);
    this.quotationForm.get('Email').setValue(event.Email);
  }

  onCarrierChange(event: any, routeIndex: number): void {
    if(!event || event === null || event === undefined){
      const routeForm = this.routes.at(routeIndex) as FormGroup;
      routeForm.get('CarrierMasterSid')?.setValue(null);
      routeForm.get('Carrier')?.setValue('');
    }
    const routeForm = this.routes.at(routeIndex) as FormGroup;
    const selectedCustomerId = event.CustomerMasterSid;
    const selectedCustomer = event;

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
    let currentCompanyMasterSid = this.currentCompany.CompanyMasterSid
    let currentBranchMasterSid = this.currentBranch.BranchMasterSid
    let userEmail = this.userData.userEmail;

    console.log(currentCompanyMasterSid)
    console.log(currentBranchMasterSid)
    // return false;
    if (this.QuoteHeaderSid) {
      const updatePayload = {
        ...this.quotationForm.value,
        CompanyMasterSid : currentCompanyMasterSid,
        BranchMasterSid : currentBranchMasterSid,
        updatedBy : userEmail,
        UserMasterSid : this.userData?.UserMasterSid,
        CustomerMasterSid: this.quotationForm.get('CustomerMasterSid')?.value,
        CustomerName: this.selectedCustomerName,
        Segment: this.selectedDepartment,
        QuoteHeaderSid: this.QuoteHeaderSid,
        approvalStatusChange : this.authStateCache !== this.quotationForm.value?.authorizerStatus,
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
        CompanyMasterSid : currentCompanyMasterSid,
        BranchMasterSid : currentBranchMasterSid,
        createdBy : userEmail,
        DepartmentMasterSid: this.quotationForm.get('DepartmentMasterSid')?.value,
        CustomerMasterSid: this.quotationForm.get('CustomerMasterSid')?.value,
        CustomerName: this.selectedCustomerName, // Store customer name
        Segment: this.selectedDepartment, // Ensure the segment name is included
        CustomerAddress: this.selectCustomerAddress
      }
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
    this.router.navigate(['crm/quotation/list'])
  }

  statusRequiredValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || value === 'Pending') {
      return { required: true };
    }
    return null;
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
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    if(!EnquirySid) return;
    this.leadService.getAllEnquiries(CompanyMasterSid,BranchMasterSid).subscribe(
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
    const MenuMasterSid = localStorage.getItem('currentMenuId');
		if (!MenuMasterSid) return;
		const modalRef = this.ngbModal.open(AuthorityLogComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.QuoteHeaderSid;
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
