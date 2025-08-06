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
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { LeadService } from '../../Services/lead.service';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';
import { forkJoin, tap } from 'rxjs';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';


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
    DatePipe,
    NgbNavModule,
    DecimalPrecisionDirective,
    OnlyNumbersDirective
  ],
  templateUrl: './enquiry-entry.component.html',
  styleUrl: './enquiry-entry.component.scss',
    providers: [
      { provide: NgbDateAdapter, useClass: CustomDateAdapter },
      { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    ],
})
export class EnquiryEntryComponent implements OnInit {
  selectedDepartment: any = '';
  isMobile: boolean = false;
  rateRequestForm!: FormGroup;
  EnquiryHeaderSid: any;
  isEditMode = false; // Flag for edit mode
  customers: any[] = [];
  incoList : any[] = [];
  packageTypes: any;
  containerTypes: any;
  // ports: any
  departments: any[] = [];
  enquiryForm: FormGroup;
  enquiryOtherForm : FormGroup;
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
  cusBranchList : any[] = [];
  weightUnitList : any[] = [];
  consigneeList : any[] = [];
  shipperList : any[] = [];
  finalConsigneeList : any[] = [];
  finalShipperList : any[] = [];
  filteredPOLPorts: any[][] = [];
  filteredPODPorts: any[][] = [];
  userData : any;
  active = 1;
  quotationCustomerId: number;
  quotationDepartmentId: number;
  quotationPOL: number;
  quotationPOD: number;
  currentCompany : any;
  currentBranch : any;
  isAuthorizedUser : boolean;
  authStateCache : string;
  isApproved : boolean;
  minExpDate : any;
  permissions : any[] = [];
  currentMenuPermissions = {}

  modeOfEnquiry = [
    { id: 1, name: "Email" },
    { id: 2, name: "Phone" },
    { id: 3, name: "Lead" },
    { id: 4, name: "Visit" },
    { id: 5, name: "Others" }
  ]

  terms = [
    { id: 1, name: "FCL" },
    { id: 2, name: "FCL,FCL" },
    { id: 3, name: "LCL,LCL" },
    { id: 4, name: "LCL,LCL" },
    { id: 5, name: "FCL,FLT HH" },
    { id: 6, name: "FTL,LTL" }
  ]

  cargoTypes = [
    { id: 1, name: "General" },
    { id: 2, name: "Haz" },
    { id: 3, name: "Reefer" },
    { id: 4, name: "Flexi" },
    { id: 5, name: "ODC" },
    { id: 6, name: "Empty" },
    { id: 7, name: "RORO" },
    { id: 8, name: "OOG" },
    { id: 9, name: "Tanker" },
  ]

  modeOfAddtionalService = [
    { id: 1, name: 'Lashing' },
    { id: 2, name: 'Labelling' },
    { id: 3, name: "Choking" },
    { id: 4, name: "Fumigation" },
    { id: 5, name: "Palletization" }
  ]


  constructor(
    private appService: AppService,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: ModalService,
    private calendar: NgbCalendar,
    private ngbModal : NgbModal
  ) {}

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice();
    this.initializeForm();
    this.initOthersForm();


    this.userData = this.appSettingsService.getDecryptedUserProfile();
    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingsService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingsService.decrypt(storedBranch) : null;

    this.loadAllLookups().subscribe(() => {
      this.loadOtherFormLookups();
      this.activatedRoute.paramMap.subscribe((params) => {
        this.EnquiryHeaderSid = +params.get('id');
        if (this.EnquiryHeaderSid) {
          this.isEditMode = true;
          this.loadEnquiry(this.EnquiryHeaderSid);
          this.checkAuthorisedPerson(this.userData?.UserMasterSid, this.EnquiryHeaderSid);
        }
      });
      this.minExpDate = this.isEditMode ? undefined : this.today;
      this.checkPermissions();
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

  checkAuthorisedPerson(UserMasterSid, QuoteHeaderSid) {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    if (!UserMasterSid || !this.currentMenuId) {
      return;
    }
    this.leadService.isUserAuthorizer(UserMasterSid, this.currentMenuId, QuoteHeaderSid).subscribe(
      (resp: any) => {
        this.isAuthorizedUser = resp.data?.canAuthorize
        this.isApproved = resp.data?.alreadyApproved
        const authorizerStatusControl = this.rateRequestForm.get('authorizerStatus');
        if (this.isAuthorizedUser && !this.isApproved) {
          authorizerStatusControl?.setValidators([this.statusRequiredValidator]);
        } else {
          authorizerStatusControl?.clearValidators();
        }
        authorizerStatusControl?.updateValueAndValidity();
      }
    )
  }

  loadAllLookups(){
    return forkJoin({
      departments : this.leadService.getAllDepartments(),
      ports : this.leadService.getAllPorts(),
      customers : this.leadService.getAllCustomers(),
      incos : this.leadService.getAllIncos(),
      weightUnits : this.leadService.getAllWeightUnits(),
      packageTypes : this.leadService.getAllPackageTypes(),
      containerTypes : this.leadService.getAllContainerTypes(),
      products : this.leadService.getAllProducts()
    }).pipe(tap(({departments, ports , customers,incos,weightUnits,packageTypes,containerTypes,products})=>{
      this.departments = departments;
      this.ports = ports;
      this.filteredPorts = [...this.ports];
      this.customers = customers;
      this.incoList = incos;
      this.weightUnitList = weightUnits;
      this.packageTypes = packageTypes;
      this.containerTypes = containerTypes;
      this.productList = products.data;
    })
    );
  }

  initializeForm() {
    this.rateRequestForm = this.fb.group({
      CustomerMasterSid: [null],
      customerName: ['', Validators.required],
      enquiryNo : [''],
      EnquiryDate : [''],
      shipmentDate: ['', Validators.required],
      DepartmentMasterSid: [''],
      Segment: [null, Validators.required],
      CustomerAddress : [null],
      CustomerBranchSid : [''],
      Email : ['',[EmailValidators.singleEmail()]],
      EnquiryType: [null],
      IncoTerms : [null],
      ClearanceBy : [null],
      TransportBy : [null],          
      Remarks:[''],
      status: [''],
      AuthorizerRemarks : [''],
      authorizerStatus : ['Pending'],

      routes: this.fb.array([]),
    });

    this.addRoute();
    this.routes.controls.forEach((route, index) => {
      route.get('POD')?.valueChanges.subscribe(() => this.onRouteChange(index));
      route.get('POL')?.valueChanges.subscribe(() => this.onRouteChange(index));
    });
  }

  initOthersForm(){
    this.enquiryOtherForm = this.fb.group({
      EnquiryOtherSid : [null],
      ShipperName : [null],
      ShipperAddress : [''],
      ConsigneeName : [null],
      ConsigneeAddress : [''],
      FreightTerms : [null],
      AdditionalService : [null],
      PickupAddress : ['']
    })
  }

  loadOtherFormLookups(){
    forkJoin({
      shippers : this.leadService.getAllShippers(),
      consignees : this.leadService.getAllConsignees()
    }).subscribe(({shippers,consignees})=>{
      this.shipperList = shippers.data;
      this.finalShipperList = [...this.shipperList];
      this.consigneeList = consignees.data;
      this.finalConsigneeList = [...this.consigneeList];
    })
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
        POO: [null, Validators.required],
        POL: [null, Validators.required],
        POD: [null, Validators.required],
        FDC: [null, Validators.required],
        cargo: this.fb.array([]),
      }
    );

    this.routes.push(routeForm);
    this.addCargo(this.routes.length - 1); 
  }


  // Remove a Route
  removeRoute(index: number) {
    this.routes.removeAt(index);
  }


  deleteCargo(routeIndex:number,cargoIndex: number) {
    (this.routeCargo(routeIndex) as FormArray).removeAt(cargoIndex);
  }

  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.rateRequestForm.controls;
  }


  addCargo(routeIndex: number) {
    const cargoForm = this.fb.group({
      CargoType: [null, [Validators.required]],
      ProductName: [null, [Validators.required]],
      CargoDescription: [''],
      PackageType: [null],
      PackageQty : [''],
      Qty: ['1'],
      WeightUnitSid: [null],
      GrossWeight: ['',[this.weightValidator]],
      NetWeight: [''],
      ShipmentTerms: [null],
      cbm: ['1'],
      ContainerType: [null],
      length: [''],
      width: [''],
      height: ['']
    });
    this.updateCargoValidators(cargoForm,this.selectedFCLLCL);
    this.routeCargo(routeIndex).push(cargoForm);
    cargoForm.get('NetWeight')?.valueChanges.subscribe(() => {
      cargoForm.get('GrossWeight')?.updateValueAndValidity();
    });
  }

  onSegmentChange(event) {
    if (!event) {
      this.selectedFCLLCL = "LCL"
      this.routes.controls.forEach((routeGroup: FormGroup) => {
        ['POO', 'POL', 'POD', 'FDC'].forEach(field => {
          routeGroup.get(field)?.setValue(null);
        });
      })
      return;
    }

    const selectedDepartmentId = Number(event);
    this.rateRequestForm.get('DepartmentMasterSid')?.setValue(selectedDepartmentId);

    const selectedDept = this.departments.find(
      dept => dept.DepartmentMasterSid === selectedDepartmentId
    );

    this.selectedDepartment = selectedDept?.departmentName;
    this.selectedFCLLCL = selectedDept?.FCLLCL ?? 'LCL';

    this.routes.controls.forEach((routeGroup: FormGroup) => {
      ['POO', 'POL', 'POD', 'FDC'].forEach(field => {
        routeGroup.get(field)?.setValue(null);
      });
      

      const cargoArray = routeGroup.get('cargo') as FormArray;
      cargoArray.controls.forEach((cargoForm: FormGroup) => {
        this.updateCargoValidators(cargoForm, this.selectedFCLLCL);
      });
    });

    this.filteredPorts = this.ports.filter(port => {
      if (this.selectedFCLLCL === 'AIR') return port.PortType === 'Air';
      return port.PortType === 'Sea';
    });
  }

  updateCargoValidators(cargoForm: FormGroup, type: string) {
    const resetFields = (fields: string[]) => {
      fields.forEach(f => {
        const ctrl = cargoForm.get(f);
        if (ctrl) {
          ctrl.reset();
          ctrl.clearValidators();
          ctrl.updateValueAndValidity();
        }
      });
    };

    const setRequired = (fields: string[]) => {
      fields.forEach(f => {
        const ctrl = cargoForm.get(f);
        if (ctrl) {
          ctrl.setValidators([Validators.required]);
          if (f === 'Qty' || f === 'cbm') {
            ctrl.setValue('1');
          }
          ctrl.updateValueAndValidity();
        }
      });
    };

    const FCLFields = ['ContainerType', 'PackageType', 'Qty', 'ShipmentTerms'];
    const LCLFields = ['PackageType', 'PackageQty', 'WeightUnitSid', 'GrossWeight', 'NetWeight', 'ShipmentTerms', 'cbm'];
    const AIRFields = ['ContainerType', 'length', 'width', 'height'];

    resetFields(['PackageType', 'Qty', 'WeightUnitSid', 'PackageQty', 'GrossWeight', 'NetWeight', 'ShipmentTerms', 'cbm', 'ContainerType', 'length', 'width', 'height']);

    if (type === 'FCL') {
      setRequired(FCLFields);
    } else if (type === 'LCL') {
      setRequired(LCLFields);
    } else if (type === 'AIR') {
      setRequired(AIRFields);
    }

    const grossWeightCtrl = cargoForm.get('GrossWeight');

    if (type === "LCL" && grossWeightCtrl) {
      grossWeightCtrl.setValidators([
        Validators.required,
        this.weightValidator()
      ]);
    }

    cargoForm.updateValueAndValidity();
  }

  onCustomerChange(event: any): void {
    if (!event || event === null || event === undefined) {
      this.selectedCustomerName = '';
      this.cusBranchList = [];
      this.rateRequestForm.get('customerName').setValue('')
      this.rateRequestForm.get('CustomerAddress').setValue(null);
      this.rateRequestForm.get('Email').setValue('');
      return;
    }
    const selectedCustomerId = event.CustomerMasterSid;
    this.rateRequestForm.get('customerName').setValue('');
    this.rateRequestForm.get('CustomerAddress').setValue(null);
    this.rateRequestForm.get('CustomerMasterSid')?.setValue(selectedCustomerId);
    this.rateRequestForm.get('Email').setValue('');

    const selectedCustomer = event;
    this.selectedCustomerName = selectedCustomer?.CustomerName;
    this.rateRequestForm.get('customerName').setValue(this.selectedCustomerName)
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
      this.rateRequestForm.get('CustomerBranchSid').setValue(null);
      this.rateRequestForm.get('Email').setValue('');
      return;
    }
    this.rateRequestForm.get('CustomerBranchSid').setValue(event.CustomerBranchSid);
    this.rateRequestForm.get('Email').setValue(event.Email);
  }



  loadEnquiry(id): void {
    this.leadService.getEnquiryById(id).subscribe((resp: any) => {
      if (resp) {
        this.patchValues(resp);
        this.rateRequestData = resp;
      }
    });
  }



  patchValues(response: any) {
    this.selectedDepartment = response.ShipmentType;
    this.selectedFCLLCL = (this.departments.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid)?.FCLLCL) || 'LCL';
    // Patch header fields
    this.quotationEnquiryNumber = response.EnquiryNumber;
    this.quotationCustomerId = response.CustomerMasterSid;
    this.quotationDepartmentId = response.DepartmentMasterSid;
    this.getCustomerBranches(response.CustomerMasterSid);
    this.authStateCache = response.authorizerStatus,
    this.rateRequestForm.patchValue({
      CustomerMasterSid: response.CustomerMasterSid,
      customerName : response.CustomerName,
      enquiryNo : response.EnquiryNumber,
      EnquiryDate : new Date(response.EnquiryDate),
      shipmentDate:new Date(response.ShipmentExpectedDate),
      Segment: response.DepartmentMasterSid,
      CustomerAddress : response.CustomerAddress,
      Email : response.Email,
      EnquiryType : response.EnquiryType,
      IncoTerms : response.IncoTerms,
      ClearanceBy : response.ClearanceBy,
      TransportBy : response.TransportBy,
      Remarks : response.Remarks,
      AuthorizerRemarks : response.AuthorizerRemarks,
      authorizerStatus : response.authorizerStatus || 'Pending',
      status: response.status === 'A' ? 'Active' : 'Suspended',
    });
    this.rateRequestForm.get('Segment')?.disable();
    this.rateRequestForm.get('enquiryNo')?.disable();
    this.rateRequestForm.get('EnquiryDate')?.disable();
    this.rateRequestForm.get('customerName')?.disable();
    this.rateRequestForm.get('CustomerMasterSid')?.disable();
    if(response.authorizerStatus!== "Pending"){
      this.f['authorizerStatus']?.disable();
      this.f['AuthorizerRemarks']?.disable();
    }
    // Get the FormArray for routes and clear existing data
    const routesArray = this.rateRequestForm.get('routes') as FormArray;
    routesArray.clear();
    this.enquiryOtherForm.patchValue({
      ...response?.enquiryOther[0]
    })
    this.filterConsignee();
    this.filterShipper();

    response.enquiryRoute.forEach((route,index) => {
      this.quotationPOL = route.POLSid;
      this.quotationPOD = route.PODSid;
      const routeFormGroup = this.fb.group({
        EnquiryRouteSid: [route.EnquiryRouteSid || null],
        POO: [route.PORSid, Validators.required],
        POL: [route.POLSid, Validators.required],
        POD: [route.PODSid, Validators.required],
        FDC: [route.FDPSid, Validators.required],
        cargo: this.fb.array([]), 
      });

      // Get the cargo array inside the route
      const cargoArray = routeFormGroup.get('cargo') as FormArray;

      // Loop through enquiryCargo and add cargo rows dynamically
      route.enquiryCargo.forEach((cargo) => {
        cargoArray.push(
          this.fb.group({
            EnquiryCargoSid: [cargo.EnquiryCargoSid || null],
            CargoType: [cargo.CargoType, Validators.required],
            ProductName : [cargo.ProductName,Validators.required],
            CargoDescription : [cargo.CargoDescription],
            PackageType: [cargo.PackageType || ''], 
            PackageQty : [cargo.PackageQty || ''],
            Qty: [cargo.Qty || '1'],
            WeightUnitSid : [cargo.WeightUnitSid || null],
            GrossWeight :[cargo.GrossWeight || ''],
            NetWeight : [cargo.NetWeight || ''],
            ShipmentTerms : [cargo.ShipmentTerms || null],
            cbm: [cargo.Volume || '1'],
            ContainerType : [cargo.ContainerType || null],
            length : [cargo.length || ''],
            width : [cargo.width || ''],
            height : [cargo.height || '']
          })
        );
      });

      // Push the route to the FormArray
      this.updateCargoValidators(routeFormGroup,this.selectedFCLLCL);
      routesArray.push(routeFormGroup);
      routeFormGroup.updateValueAndValidity();
      this.onRouteChange(index);
    });
  }

  restrictDecimal(event: KeyboardEvent) {
    if (event.key === '.' || event.key === ',') {
      event.preventDefault(); // Prevents entering a decimal point or comma
    }
  }

  onSubmit() {
    if(this.rateRequestForm.invalid){
      this.rateRequestForm.markAllAsTouched();
      this.rateRequestForm.updateValueAndValidity();
      this.appSettingsService.showWarning('Please fill all the required fields correctly');
      return;
    }
    if(this.enquiryOtherForm.invalid){
      this.active = 2;
      this.enquiryOtherForm.markAllAsTouched();
      this.enquiryOtherForm.updateValueAndValidity();
      this.appSettingsService.showWarning('Please fill all the required fields correctly');
      return;
    }
    this.btnDisable = true;
    const otherFormValue = this.enquiryOtherForm.value;
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
  
    const userEmail = this.userData['userEmail'];
    if (this.EnquiryHeaderSid) {
      const updatePayload = {
        ...this.rateRequestForm.value,
        CompanyMasterSid : CompanyMasterSid,
        BranchMasterSid : BranchMasterSid,
        enquiryOther : otherFormValue,
        updatedBy : userEmail,
        MenuMaster : this.currentMenuId,
        UserMasterSid : this.userData?.UserMasterSid,
        approvalStatusChange : this.authStateCache !== this.rateRequestForm.value?.authorizerStatus,
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

          if (resp) {
            this.modalService.openSuccessModal('Enquiry Updated Successfully');
            this.btnDisable = false;
            this.router.navigate(['crm/enquiry/list']);
          } else {
            this.modalService.openErrorModal('Enquiry Update Failed');
          }
        });
    } else {
      const createPayload = {
        ...this.rateRequestForm.value,
        enquiryOther : otherFormValue,
        CompanyMasterSid : CompanyMasterSid,
        BranchMasterSid : BranchMasterSid,
        createdBy : userEmail,
        DepartmentMasterSid: this.rateRequestForm.get('DepartmentMasterSid')
          ?.value,
        CustomerMasterSid: this.rateRequestForm.get('CustomerMasterSid')?.value,
        CustomerName: this.selectedCustomerName,
        Segment: this.selectedDepartment,
      };
      this.leadService.createEnquiry(createPayload).subscribe((resp) => {
        if (resp.status) {
          this.modalService.openSuccessModal('Enquiry Created Successfully');
          this.btnDisable = false;
          this.router.navigate(['crm/enquiry/list']);
        } else {
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
    const pooList = this.rateRequestForm.value.routes.map((route) => route.POO);
    const polList = this.rateRequestForm.value.routes.map((route) => route.POL);
    const podList = this.rateRequestForm.value.routes.map((route) => route.POD);
    const fpodList = this.rateRequestForm.value.routes.map((route) => route.FDC);
    // Extract all cargoType values from each route
    const cargoTypeList = this.rateRequestForm.value.routes.flatMap((route) =>
      route.cargo.map((cargoItem) => cargoItem.cargoType)
    );

    this.leadService.clearQuotationData();

    this.leadService.setQuotationData({
      EnquirySid : this.EnquiryHeaderSid,
      EnquiryNumber : this.rateRequestData?.EnquiryNumber,
      customerId: this.quotationCustomerId,
      departmentId: this.quotationDepartmentId,
      CustomerAddress : this.rateRequestData?.CustomerAddress,
      Email : this.rateRequestData?.Email,
      CustomerBranchSid : this.rateRequestData?.CustomerBranchSid,
      IncoTerms : this.rateRequestData?.IncoTerms,
      ClearanceBy : this.rateRequestData?.ClearanceBy,
      TransportBy : this.rateRequestData?.TransportBy,
      EnquiryRemarks : this.rateRequestData?.Remarks,
      ShipmentType : this.rateRequestData?.ShipmentType,
      pooList : pooList,
      polList: polList, // Sending as an array
      podList: podList, // Sending as an array
      fpodList : fpodList,
      cargoTypeList: cargoTypeList,
      rateRequest: true,
      active: 2,
    });

    this.router.navigate(['crm/quotation/view']);
  }

onRouteChange(routeIndex: number): void {
  const pod = this.routes.at(routeIndex).get('POD')?.value;
  const pol = this.routes.at(routeIndex).get('POL')?.value;

  this.filteredPorts = this.getFilteredPortsBySegment(); // Just get by segment

  this.filteredPOLPorts[routeIndex] = this.filteredPorts.filter(port => port.PortMasterSid !== pod);
  this.filteredPODPorts[routeIndex] = this.filteredPorts.filter(port => port.PortMasterSid !== pol);
}

getFilteredPortsBySegment(): any[] {
  if (this.selectedFCLLCL === 'AIR') {
    return this.ports.filter(port => port.PortType === 'Air');
  } else if (this.selectedFCLLCL === 'FCL' || this.selectedFCLLCL === 'LCL') {
    return this.ports.filter(port => port.PortType === 'Sea');
  }
  return this.ports;
}

  statusRequiredValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || value === 'Pending') {
      return { required: true };
    }
    return null;
  }


  weightValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const grossWeight = parseFloat(control.value);
      const parent = control.parent;

      if (!parent) return null;

      const netWeight = parseFloat(parent.get('NetWeight')?.value);

      if (isNaN(grossWeight) || isNaN(netWeight)) return null;

      return grossWeight >= netWeight
        ? null
        : { weightMismatch: true };
    };
  }

  filterConsignee() {
    const shipperName = this.enquiryOtherForm.get('ShipperName')?.value
    if (!this.consigneeList) {
      return;
    }
    if(!shipperName){
      this.finalConsigneeList = [...this.consigneeList];
    } else {
      this.finalConsigneeList = this.consigneeList.filter(consignee => consignee.CustomerName !== shipperName)
    }
  }
  filterShipper(){
    const consigneeName = this.enquiryOtherForm.get('ConsigneeName')?.value
    if(!this.shipperList){
      return;
    }
    if(!consigneeName){
      this.finalShipperList = [...this.shipperList];
    } else {
      this.finalShipperList = this.shipperList.filter(consignee => consignee.CustomerName !== consigneeName)
    }
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
    const MenuMasterSid = localStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.ngbModal.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.EnquiryHeaderSid;
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
