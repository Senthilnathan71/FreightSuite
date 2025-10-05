import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
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
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModalRef, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { LeadService } from '../../Services/lead.service';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import {
  debounceTime,
  distinctUntilChanged
} from 'rxjs';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';

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
    OnlyNumbersDirective,
    NgbDropdownModule,
    SearchableDropdown
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
  incoList: any[] = [];
  packageTypes: any;
  containerTypes: any;
  // ports: any
  departments: any[] = [];
  enquiryForm: FormGroup;
  enquiryOtherForm: FormGroup;
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
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  disableAddButtons: boolean;
  rateRequestData: any;
  currentMenuId: number;
  TandCList: any;
  productList: any[];
  leadList : any[] = [];
  cusBranchList: any[] = [];
  weightUnitList: any[] = [];
  consigneeList: any[] = [];
  shipperList: any[] = [];
  finalConsigneeList: any[] = [];
  finalShipperList: any[] = [];
  filteredPOLPorts: any[][] = [];
  filteredPODPorts: any[][] = [];
  userData: any;
  active = 1;
  quotationCustomerId: number;
  quotationDepartmentId: number;
  quotationPOL: number;
  quotationPOD: number;
  currentCompany: any;
  currentBranch: any;
  isAuthorizedUser: boolean;
  authStateCache: string;
  isApproved: boolean;
  minExpDate: any;
  permissions: any[] = [];
  currentMenuPermissions = {}


  modeOfEnquiry = [
    { id: 1, name: "Email" },
    { id: 2, name: "Phone" },
    { id: 3, name: "Lead" },
    { id: 4, name: "Visit" },
    { id: 5, name: "Others" }
  ]

  terms = [
    { id: 1, name: "FCL/FCL" },
    { id: 2, name: "FCL/LCL" },
    { id: 3, name: "LCL/FCL" },
    { id: 4, name: "LCL,LCL" },
    { id: 5, name: "LTL" },
    { id: 6, name: "FTL" },
    { id: 6, name: "FLT HH" }
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

    selectedTab = 'Enquiry';
 tabs = [
    { name: 'Enquiry', icon: 'fas fa-file-signature' },
    { name: 'Route Details', icon: 'fas fa-file-signature' },
   { name: 'Other', icon: 'fas fa-layer-group' }
  ];
  
  
  freightTermsList: any[] = [
    { FreightTermsSid: 'Prepaid', FreightTerms: 'Prepaid' },
    { FreightTermsSid: 'Collect', FreightTerms: 'Collect' }
  ];


  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

  constructor(
    private appService: AppService,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: ModalService,
    private calendar: NgbCalendar,
    private ngbModal: NgbModal
  ) { }

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

      // Check for voice enquiry data first
      this.activatedRoute.queryParams.subscribe(queryParams => {
        if (queryParams['voice'] === 'true') {
          this.handleVoiceEnquiryData();
        }
      });

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
    this.subscribeToLeadCustomerToggle(); 
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
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: this.currentMenuId,
      UserMasterSid: UserMasterSid,
      DocumentSid: this.EnquiryHeaderSid
    }
    this.leadService.isUserAuthorizer(payload).subscribe(
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

  loadAllLookups() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const filterOption = { 
      CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
      BranchMasterSid : this.currentBranch?.BranchMasterSid
    }
    return forkJoin({
      departments: this.leadService.getAllDepartments(CompanyMasterSid).pipe(catchError(() => of([]))),
      ports: this.leadService.getAllPorts().pipe(catchError(() => of([]))),
      customers: this.leadService.getAllCustomersWithBranch(CompanyMasterSid).pipe(catchError(() => of([]))),
      leads: this.leadService.fetchAllLeads(filterOption).pipe(catchError(() => of([]))),
      incos: this.leadService.getAllIncos().pipe(catchError(() => of([]))),
      weightUnits: this.leadService.getAllWeightUnits().pipe(catchError(() => of([]))),
      packageTypes: this.leadService.getUOMsByType('P').pipe(catchError(() => of([]))),
      containerTypes: this.leadService.getAllContainerTypes().pipe(catchError(() => of([]))),
      products: this.leadService.getAllProducts(CompanyMasterSid).pipe(catchError(() => of([]))),
    }).pipe(tap(({ departments, ports, customers, leads, incos, weightUnits, packageTypes, containerTypes, products }) => {
      this.departments = departments;
      this.ports = ports;
      this.filteredPorts = [...this.ports];
      this.customers = customers;
      this.leadList = leads.data;
      this.incoList = incos;
      this.weightUnitList = weightUnits;
      this.packageTypes = packageTypes.data;
      this.containerTypes = containerTypes;
      this.productList = products;
    })
    );
  }

  initializeForm() {
    this.rateRequestForm = this.fb.group({
      LeadOrCustomer : [true],
      PreCustomerMasterSid : [null],
      CustomerMasterSid: [null],
      customerName: ['', Validators.required],
      enquiryNo: [''],
      EnquiryDate: [''],
      shipmentDate: ['', Validators.required],
      DepartmentMasterSid: [''],
      Segment: [null, Validators.required],
      CustomerAddress: [null],
      CustomerBranchSid: [''],
      Email: ['', [EmailValidators.singleEmail()]],
      EnquiryType: [null],
      IncoTerms: [null],
      ClearanceBy: [null],
      TransportBy: [null],
      Remarks: [''],
      status: [''],
      AuthorizerRemarks: [''],
      authorizerStatus: ['Pending'],
      FreightPPCC : ['Prepaid'],
      routes: this.fb.array([]),
    });

    this.addRoute();
  }

  subscribeToLeadCustomerToggle() {
    this.rateRequestForm.get('LeadOrCustomer')?.valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe(isCustomer => {
      this.toggleCustomerType(isCustomer);
    });
  }

  private subscribeToRouteChanges(routeGroup: FormGroup, index: number): void {
    routeGroup.get('POL')?.valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe(selectedPOL => {
      this.updateFilteredPorts(index, selectedPOL, 'POL');
    });

    routeGroup.get('POD')?.valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe(selectedPOD => {
      this.updateFilteredPorts(index, selectedPOD, 'POD');
    });
  }

  // toggleCustomerType(isCustomer: boolean) {
    
  //   this.rateRequestForm.patchValue({
  //     PreCustomerMasterSid: null,
  //     CustomerMasterSid: null,
  //     customerName: '',
  //     CustomerAddress: null,
  //     CustomerBranchSid: null,
  //     Email: null,
  //   });
  //   this.cusBranchList = []; 

  //   const preCustomerControl = this.rateRequestForm.get('PreCustomerMasterSid');
  //   const customerControl = this.rateRequestForm.get('CustomerMasterSid');

  //   if (isCustomer) {
  //     customerControl?.setValidators(Validators.required);
  //     preCustomerControl?.clearValidators();
  //   } else {
  //     preCustomerControl?.setValidators(Validators.required);
  //     customerControl?.clearValidators();
  //   }

  //   customerControl?.updateValueAndValidity();
  //   preCustomerControl?.updateValueAndValidity();
  // }

  toggleCustomerType(isCustomer: boolean, isPatching = false) {
  // Only reset if not patching existing record
  if (!isPatching) {
    this.rateRequestForm.patchValue({
      PreCustomerMasterSid: null,
      CustomerMasterSid: null,
      customerName: '',
      CustomerAddress: null,
      CustomerBranchSid: null,
      Email: null,
    });
    this.cusBranchList = []; 
  }

  const preCustomerControl = this.rateRequestForm.get('PreCustomerMasterSid');
  const customerControl = this.rateRequestForm.get('CustomerMasterSid');

  if (isCustomer) {
    customerControl?.setValidators(Validators.required);
    preCustomerControl?.clearValidators();
  } else {
    preCustomerControl?.setValidators(Validators.required);
    customerControl?.clearValidators();
  }

  customerControl?.updateValueAndValidity();
  preCustomerControl?.updateValueAndValidity();
}

  initOthersForm() {
    this.enquiryOtherForm = this.fb.group({
      EnquiryOtherSid: [null],
      ShipperName: [null],
      ShipperAddress: [''],
      ConsigneeName: [null],
      ConsigneeAddress: [''],
      FreightTerms: [null],
      AdditionalService: [null],
      PickupAddress: ['']
    })
  }

  loadOtherFormLookups() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      shippers: this.leadService.getAllShippers(CompanyMasterSid),
      consignees: this.leadService.getAllConsignees(CompanyMasterSid)
    }).subscribe(({ shippers, consignees }) => {
      this.shipperList = shippers.data;
      this.finalShipperList = [...this.shipperList];
      this.consigneeList = consignees.data;
      this.finalConsigneeList = [...this.consigneeList];
    })
  }

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
        POO: [null, ],
        POL: [null, Validators.required],
        POD: [null, Validators.required],
        FDC: [null, ],
        cargo: this.fb.array([]),
      }
    );

    
    this.routes.push(routeForm);
    this.subscribeToRouteChanges(routeForm, this.routes.length - 1);
    this.addCargo(this.routes.length - 1);
    const initialPorts = this.getFilteredPortsBySegment();
    this.filteredPOLPorts[this.routes.length - 1] = initialPorts;
    this.filteredPODPorts[this.routes.length - 1] = initialPorts;

  //POD Selected Automatically changed the FDC Value 

  // routeForm.get('POD')?.valueChanges.subscribe((podValue: string | null) => {
  //   routeForm.get('FDC')?.setValue(podValue, { emitEvent: false });
  // });


  //Only FDC Value empty
    
  routeForm.get('POD')?.valueChanges.subscribe((podValue: string | null) => {
    const fdcControl = routeForm.get('FDC');
    const currentFDC = fdcControl?.value;

    // ✅ Only assign when FDC is empty or null
    if (!currentFDC || currentFDC.trim() === '') {
      fdcControl?.setValue(podValue, { emitEvent: false });
    }
  });
  }


  // Remove a Route
  removeRoute(index: number) {
    this.routes.removeAt(index);
  }


  deleteCargo(routeIndex: number, cargoIndex: number) {
    (this.routeCargo(routeIndex) as FormArray).removeAt(cargoIndex);
  }

  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.rateRequestForm.controls;
  }


  addCargo(routeIndex: number) {
    const cargoForm = this.fb.group({
      CargoType: [null, [Validators.required]],
      ProductName: [null],
      CargoDescription: [''],
      PackageType: [null],
      PackageQty: [''],
      Qty: ['1'],
      WeightUnitSid: [null],
      GrossWeight: ['', [this.weightValidator]],
      NetWeight: [''],
      ShipmentTerms: [null],
      cbm: ['1'],
      ContainerType: [null],
      ChargeableWeight: [''],
      length: [''],
      width: [''],
      height: ['']
    });
    this.updateCargoValidators(cargoForm, this.selectedFCLLCL);
    this.routeCargo(routeIndex).push(cargoForm);
    cargoForm.get('NetWeight')?.valueChanges.subscribe(() => {
      cargoForm.get('GrossWeight')?.updateValueAndValidity();
    });
    cargoForm.get("GrossWeight").valueChanges.subscribe(() => {
      this.setOrResetWeightError(cargoForm);
    });
    cargoForm.get("NetWeight").valueChanges.subscribe(() => {
      this.setOrResetWeightError(cargoForm);
    });
  }

  setOrResetWeightError(formGroup: FormGroup) {
    const grossCtrl = formGroup.get('GrossWeight');
    const grossValue = formGroup.get('GrossWeight')?.value;
    const netValue = formGroup.get('NetWeight')?.value;

    if (!grossValue || !netValue) {
      grossCtrl.setErrors(null);
      return;
    }
    if (grossCtrl) {
      if (Number(grossValue) <= Number(netValue)) {
        grossCtrl.setErrors({ grossNotGreater: true });
      } else {
        grossCtrl.setErrors(null);
      }
    }
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
    if (selectedDept?.departmentType === "Sea") {
      this.selectedFCLLCL = selectedDept?.FCLLCL;
    } else {
      this.selectedFCLLCL = selectedDept?.departmentType?.toUpperCase();
    }

    this.routes.controls.forEach((routeGroup: FormGroup, index) => {
      ['POO', 'POL', 'POD', 'FDC'].forEach((field) => {
        routeGroup.get(field)?.setValue(null);
      }
      );
      const initialPorts = this.getFilteredPortsBySegment();
      this.filteredPOLPorts[index] = initialPorts;
      this.filteredPODPorts[index] = initialPorts;

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


  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.EnquiryHeaderSid) return;

    this.leadService.getAuditLogsEnquiry('EnquiryHeader', this.EnquiryHeaderSid.toString()).subscribe({
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
    const AIRFields = ['ChargeableWeight', 'length', 'width', 'height'];

    resetFields(['PackageType', 'Qty', 'WeightUnitSid', 'PackageQty', 'GrossWeight', 'NetWeight', 'ShipmentTerms', 'cbm', 'ContainerType', 'ChargeableWeight', 'length', 'width', 'height']);

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

onSelectionChange(selectedItem: any) {
  if (!selectedItem) {
    this.rateRequestForm.patchValue({
      customerName: '',
      CustomerAddress: null,
      CustomerBranchSid: null,
      Email: null,
    });
    this.cusBranchList = [];
    return;
  }

  const isCustomer = this.rateRequestForm.get('LeadOrCustomer')?.value;
  console.log(selectedItem);
  if (isCustomer) {
    this.rateRequestForm.patchValue({
      customerName: selectedItem.CustomerName,
      CustomerAddress: selectedItem.Address, 
      Email: selectedItem.Email,
      CustomerBranchSid: selectedItem.CustomerBranchSid,
    });
    this.selectedCustomerName = selectedItem.CustomerName;
    this.getCustomerBranches(selectedItem.CustomerMasterSid);
  } else {
    this.rateRequestForm.patchValue({
      customerName: selectedItem.preCustomerName,
      CustomerAddress: selectedItem.preCustomerAddress1,
      Email: selectedItem.email,
      CustomerBranchSid: null, 
    });
    this.selectedCustomerName = selectedItem.preCustomerName;
    this.cusBranchList = []; 
  }
}

  onCustomerChange(event: any): void {
    console.log("Event triggered");
    if (!event || event === null || event === undefined) {
      this.selectedCustomerName = '';
      this.cusBranchList = [];
      this.rateRequestForm.get('customerName').setValue('')
      this.rateRequestForm.get('CustomerAddress').setValue('');
      this.rateRequestForm.get('Email').setValue('');
      return;
    }
    this.rateRequestForm.get('customerName').setValue('');
    this.rateRequestForm.get('CustomerAddress').setValue(null);
    this.rateRequestForm.get('Email').setValue('');

    const isCustomer = Boolean(this.rateRequestForm.get('LeadOrCustomer')?.value);
    console.log(isCustomer);
    if (isCustomer) {
      const selectedCustomer = event;
      console.log(selectedCustomer)
      this.selectedCustomerName = selectedCustomer?.CustomerName;
      this.rateRequestForm.get('customerName').setValue(this.selectedCustomerName)
      this.rateRequestForm.get('CustomerAddress').setValue(selectedCustomer?.Address);
      this.rateRequestForm.get('Email').setValue(selectedCustomer?.Email);
    } else {
      const selectedLead = event;
      this.selectedCustomerName = selectedLead?.preCustomerName;
      this.rateRequestForm.get('customerName').setValue(this.selectedCustomerName)
      this.rateRequestForm.get('CustomerAddress').setValue(selectedLead.preCustomerAddress1);
      this.rateRequestForm.get('Email').setValue(selectedLead.email);
    }
  }

  getCustomerBranches(CustomerMasterSid: number) {
    this.leadService.getCustomerBranchByCustomerId(CustomerMasterSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.cusBranchList = resp.data;
        } else {
          this.appSettingsService.showError('Error loading customer branches.')
          console.error(resp.message);
        }
      }
    )
  }


  onCustomerAddressChange(event: any) {
    if (event) {
      this.rateRequestForm.patchValue({
        CustomerBranchSid: event.CustomerBranchSid,
        Email: event.Email,
      });
    } else {
      this.rateRequestForm.patchValue({
        CustomerBranchSid: null,
        Email: null,
      });
    }
  }



  loadEnquiry(id): void {
    this.leadService.getEnquiryById(id).subscribe((resp: any) => {
      if (resp.status) {
        this.patchValues(resp.data);
        this.rateRequestData = resp.data;
      }
    });
  }



  patchValues(response: any) {

 // Lead/Customer toggle first
  const isCustomer = response.LeadOrCustomer === 'C';
  this.rateRequestForm.get('LeadOrCustomer')?.setValue(isCustomer, { emitEvent: false });
  this.toggleCustomerType(isCustomer, true);

  if (!isCustomer) {
    // patch lead only after leadList loaded
    const selectedLead = this.leadList.find(l => l.PreCustomerMasterSid === Number(response.PreCustomerMasterSid));
    if (selectedLead) {
      this.rateRequestForm.patchValue({
        PreCustomerMasterSid: selectedLead.PreCustomerMasterSid,
        customerName: selectedLead.preCustomerName,
        CustomerAddress: selectedLead.preCustomerAddress1,
        Email: selectedLead.email,
      });
    }
  }  else {
    // patch customer fields
    const selectedCustomer = this.customers.find(c => c.CustomerMasterSid === response.CustomerMasterSid);
    if (selectedCustomer) {
      this.rateRequestForm.patchValue({
        CustomerMasterSid: selectedCustomer.CustomerMasterSid,
        customerName: selectedCustomer.CustomerName,
        CustomerAddress: selectedCustomer.Address,
        Email: selectedCustomer.Email,
      });
    }
  }

    this.selectedDepartment = response.ShipmentType;
    const selectedDept = this.departments.find(dept => dept.DepartmentMasterSid === response.DepartmentMasterSid);
    if (selectedDept?.departmentType === "Sea") {
      this.selectedFCLLCL = selectedDept?.FCLLCL;
    } else {
      this.selectedFCLLCL = selectedDept?.departmentType?.toUpperCase();
    }
// const selectedLead = this.leadList.find(l => l.PreCustomerMasterSid === Number(response.PreCustomerMasterSid));
// if (selectedLead) {
//   this.rateRequestForm.get('PreCustomerMasterSid')?.setValue(selectedLead.PreCustomerMasterSid);
// }
    
    console.log(response.PreCustomerMasterSid,'response.PreCustomerMasterSid')
    // Patch header fields
    this.quotationEnquiryNumber = response.EnquiryNumber;
    this.quotationCustomerId = response.CustomerMasterSid;
    this.quotationDepartmentId = response.DepartmentMasterSid;
    this.getCustomerBranches(response.CustomerMasterSid);
    this.authStateCache = response.authorizerStatus,
    this.rateRequestForm.patchValue({
        // PreCustomerMasterSid: Number(response.PreCustomerMasterSid),
        // LeadOrCustomer : response.LeadOrCustomer === "C",
        // CustomerMasterSid: response.CustomerMasterSid,
        // customerName: response.CustomerName,
        enquiryNo: response.EnquiryNumber,
        EnquiryDate: new Date(response.EnquiryDate),
        shipmentDate: new Date(response.ShipmentExpectedDate),
        Segment: response.DepartmentMasterSid,
        // CustomerAddress: response.CustomerAddress,
        // Email: response.Email,
        EnquiryType: response.EnquiryType,
        IncoTerms: response.IncoTerms,
        ClearanceBy: response.ClearanceBy,
        TransportBy: response.TransportBy,
        Remarks: response.Remarks,
        AuthorizerRemarks: response.AuthorizerRemarks,
        authorizerStatus: response.authorizerStatus || 'Pending',
        status: response.status === 'A' ? 'Active' : 'Suspended',
      });
    this.rateRequestForm.get('Segment')?.disable();
    this.rateRequestForm.get('enquiryNo')?.disable();
    this.rateRequestForm.get('EnquiryDate')?.disable();
    this.rateRequestForm.get('customerName')?.disable();
    this.rateRequestForm.get('CustomerMasterSid')?.disable();
    if (response.authorizerStatus !== "Pending") {
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

    response.enquiryRoute.forEach((route, index) => {
      this.quotationPOL = route.POLSid;
      this.quotationPOD = route.PODSid;
      const routeFormGroup = this.fb.group({
        EnquiryRouteSid: [route.EnquiryRouteSid || null],
        POO: [route.PORSid,],
        POL: [route.POLSid, Validators.required],
        POD: [route.PODSid, Validators.required],
        FDC: [route.FDPSid, ],
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
            ProductName: [cargo.ProductName],
            CargoDescription: [cargo.CargoDescription],
            PackageType: [cargo.PackageType || ''],
            PackageQty: [cargo.PackageQty || ''],
            Qty: [cargo.Qty || '1'],
            WeightUnitSid: [cargo.WeightUnitSid || null],
            GrossWeight: [cargo.GrossWeight || ''],
            NetWeight: [cargo.NetWeight || ''],
            ShipmentTerms: [cargo.ShipmentTerms || null],
            cbm: [cargo.Volume || '1'],
            ContainerType: [cargo.ContainerType || null],
            ChargeableWeight: [cargo.ChargeableWeight || null],
            length: [cargo.length || ''],
            width: [cargo.width || ''],
            height: [cargo.height || '']
          })
        );
      });

      // Push the route to the FormArray
      this.updateCargoValidators(routeFormGroup, this.selectedFCLLCL);
      routesArray.push(routeFormGroup);
      routeFormGroup.updateValueAndValidity();
      this.onRouteChange(index);
    });
    if (this.authStateCache !== "Pending") {
      this.disableAddButtons = true;
      this.rateRequestForm.disable();
      this.enquiryOtherForm.disable();
    }
  }

  restrictDecimal(event: KeyboardEvent) {
    if (event.key === '.' || event.key === ',') {
      event.preventDefault(); // Prevents entering a decimal point or comma
    }
  }

  onSubmit() {
    if (this.hasInvalidExcept('routes',this.rateRequestForm)) {
      this.rateRequestForm.markAllAsTouched();
      this.rateRequestForm.updateValueAndValidity();
      this.appSettingsService.showWarning('Please fill all the required fields correctly');
      return;
    }
    let routeInvalid : boolean;
    this.routes.controls.forEach((routeGroup: FormGroup,index:number) => {
      if(this.hasInvalidExcept('cargo',routeGroup)){
        routeGroup.markAllAsTouched();
        routeGroup.updateValueAndValidity();
        this.appSettingsService.showWarning(`Please enter the Route.`);
        routeInvalid = true;
      }
    });
    if(routeInvalid){
      this.selectedTab = "Route Details";
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
        LeadOrCustomer : this.rateRequestForm.value.LeadOrCustomer ? 'C' : 'L',
        CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
			BranchMasterSid : this.currentBranch?. BranchMasterSid,
        enquiryOther: otherFormValue,
        updatedBy: userEmail,
        MenuMaster: this.currentMenuId,
        UserMasterSid: this.userData?.UserMasterSid,
        approvalStatusChange: this.authStateCache !== this.rateRequestForm.value?.authorizerStatus,
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
        enquiryOther: otherFormValue,
        LeadOrCustomer : this.rateRequestForm.value.LeadOrCustomer ? 'C' : 'L',
        CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
			BranchMasterSid : this.currentBranch?. BranchMasterSid,
        createdBy: userEmail,
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

hasInvalidExcept(controlName: string, formGroup: FormGroup): boolean {
  return Object.keys(formGroup.controls)
    .filter(control => control !== controlName)
    .some(control => formGroup.get(control)?.invalid);
}

  resetForm() {
  // If editing an existing enquiry, reload it from server to restore original state
  if (this.isEditMode && this.EnquiryHeaderSid) {
    this.loadEnquiry(this.EnquiryHeaderSid);
    return;
  }

  // Reset main header form to sensible defaults
  this.rateRequestForm.reset({
    CustomerMasterSid: null,
    customerName: '',
    enquiryNo: '',
    EnquiryDate: '',
    shipmentDate: '',
    DepartmentMasterSid: '',
    Segment: null,
    CustomerAddress: null,
    CustomerBranchSid: '',
    Email: '',
    EnquiryType: null,
    IncoTerms: null,
    ClearanceBy: null,
    TransportBy: null,
    Remarks: '',
    status: '',
    AuthorizerRemarks: '',
    authorizerStatus: 'Pending'
  });

  // Clear and re-create routes (preserve lookups like ports)
  const routesArray = this.rateRequestForm.get('routes') as FormArray;
  routesArray.clear();
  this.filteredPOLPorts = [];
  this.filteredPODPorts = [];
  this.filteredPorts = [...this.ports]; // reset filtered ports to full list
  this.addRoute(); // adds one default route and one cargo row (same as init)

  // Reset the other form used on second tab
  if (this.enquiryOtherForm) {
    this.enquiryOtherForm.reset({
      EnquiryOtherSid: null,
      ShipperName: null,
      ShipperAddress: '',
      ConsigneeName: null,
      ConsigneeAddress: '',
      FreightTerms: null,
      AdditionalService: null,
      PickupAddress: ''
    });
  }

  // Reset UI / state flags
  this.selectedDepartment = '';
  this.selectedFCLLCL = '';
  this.disableAddButtons = false;
  this.rateRequestData = null;
  this.quotationEnquiryNumber = null;
  this.quotationCustomerId = null;
  this.quotationDepartmentId = null;
  this.authStateCache = undefined;
  this.isAuthorizedUser = false;
  this.isApproved = false;
  this.btnDisable = false;

  // Ensure controls that should be disabled on init are disabled again
  this.rateRequestForm.get('Segment')?.enable(); // segment enabled in create mode
  this.rateRequestForm.get('customerName')?.enable();
  this.rateRequestForm.get('CustomerMasterSid')?.enable();
  this.rateRequestForm.get('enquiryNo')?.enable();
  this.rateRequestForm.get('EnquiryDate')?.enable();

  // run change detection if you have a reference
  try { (this as any).cdRef?.detectChanges(); } catch (e) { /* ignore if cdRef not injected */ }
}


  goBack() {
    history.back();
  }

  navigateQuotation() {
    const response = this.rateRequestData;
;
    const polList = response.enquiryRoute.map(route => route.POLSid);
    const podList = response.enquiryRoute.map(route => route.PODSid);

    let cargoTypeList: string[] = [];

    if (Array.isArray(response.enquiryCargo)) {
      cargoTypeList.push(...response.enquiryCargo.map(cargo => cargo.CargoType));
    }

    response.enquiryRoute.forEach(route => {
      if (Array.isArray(route.enquiryCargo)) {
        cargoTypeList.push(...route.enquiryCargo.map(cargo => cargo.CargoType));
      }
    });
    console.log("This is department");
    const dept = this.departments.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);
    console.log("This is department",dept);
      let selectedFCLLCL;
      if (dept?.departmentType === "Sea") {
        selectedFCLLCL = dept?.FCLLCL;
      } else {
        selectedFCLLCL = dept?.departmentType?.toUpperCase();
      }

      let routeDetails = response.enquiryRoute.flatMap(route => {
        return route.enquiryCargo.map(cargo => {
          const containerTypeCode = this.containerTypes.find(
            con => con.ContainerName === cargo.ContainerType
          )?.ContainerCode || null;
          return {
            PORSid: route.PORSid,
            POLSid: route.POLSid,
            PODSid: route.PODSid,
            FPODSid: route.FDPSid,
            CargoType: cargo.CargoType,
            CBM: cargo.Volume,
            ContainerType: containerTypeCode,
            ChargeableWeight : cargo.ChargeableWeight,
            Qty: cargo.Qty
          };
        });
      });

      const enqData = {
        // EnquirySid: response?.EnquiryHeaderSid,
        // EnquiryNumber: response?.EnquiryNumber,
        // CustomerMasterSid: response?.CustomerMasterSid,
        // CustomerName: response?.CustomerName,
        // CustomerAddress: response?.CustomerAddress,
        // Email: response?.Email,
        // DepartmentMasterSid: response.DepartmentMasterSid,
        // segment: selectedFCLLCL,
        // rateRequest: true,
        // enqRoutes: routeDetails

        EnquirySid: response?.EnquiryHeaderSid,
        EnquiryNumber: response.EnquiryNumber,
      CustomerAddress: response.CustomerAddress,
      CustomerName: response.CustomerName,
      Email: response.Email,
      CustomerMasterSid: response.CustomerMasterSid,
      DepartmentMasterSid: response.DepartmentMasterSid,
      polList: polList,  // Sending as an array
      podList: podList,  // Sending as an array
      status: response.status,
      cargoTypeList: cargoTypeList,  // Merging from both possible sources
      ShipmentType: selectedFCLLCL,
      rateRequest: true,
      quoteRoutes:routeDetails,
      };
      this.leadService.clearQuotationData();
      this.leadService.setQuotationData(enqData);
      this.router.navigate(['crm/quotation/entry']);
    }

  updateFilteredPorts(index: number, selectedValue: any, type: 'POL' | 'POD'): void {
    const routesArray = this.rateRequestForm.get('routes') as FormArray;
    const currentRoute = routesArray.at(index);

    const polValue = currentRoute.get('POL')?.value;
    const podValue = currentRoute.get('POD')?.value;

    const basePorts = this.getFilteredPortsBySegment();

    if (type === 'POL') {
      this.filteredPODPorts[index] = basePorts.filter(p => p.PortMasterSid !== selectedValue);
    }

    if (type === 'POD') {
      this.filteredPOLPorts[index] = basePorts.filter(p => p.PortMasterSid !== selectedValue);
    }

    if (!polValue) {
      this.filteredPODPorts[index] = basePorts;
    }
    if (!podValue) {
      this.filteredPOLPorts[index] = basePorts;
    }
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
    if (!shipperName) {
      this.finalConsigneeList = [...this.consigneeList];
    } else {
      this.finalConsigneeList = this.consigneeList.filter(consignee => consignee.CustomerName !== shipperName)
    }
  }
  filterShipper() {
    const consigneeName = this.enquiryOtherForm.get('ConsigneeName')?.value
    if (!this.shipperList) {
      return;
    }
    if (!consigneeName) {
      this.finalShipperList = [...this.shipperList];
    } else {
      this.finalShipperList = this.shipperList.filter(consignee => consignee.CustomerName !== consigneeName)
    }
  }


  showInfo() {
    if (!this.rateRequestData) return;
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
          modalRef.componentInstance.DocumentSid = this.rateRequestData?.EnquiryHeaderSid;

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
    const modalRef = this.ngbModal.open(EdocComponent, {
    	size: 'lg',
    	centered: true,
    	backdrop: 'static'
    });
  }

  private handleVoiceEnquiryData(): void {
    const voiceData = this.leadService.getVoiceEnquiryData();

    if (!voiceData || Object.keys(voiceData).length === 0) {
      return;
    }

    console.log('Voice enquiry data received:', voiceData);

    // Clear voice data after use
    this.leadService.clearVoiceEnquiryData();

    // Pre-fill form with voice data
    this.prefillFormWithVoiceData(voiceData);

    // Show notification about voice data
    this.appSettingsService.showSuccess('Form pre-filled with voice input data. Please review and complete any missing fields.');
  }

  private prefillFormWithVoiceData(voiceData: any): void {
    // Set basic form values
    if (voiceData.CustomerMasterSid) {
      this.rateRequestForm.patchValue({
        CustomerMasterSid: voiceData.CustomerMasterSid,
        customerName: voiceData.customerName
      });
    }

    if (voiceData.DepartmentMasterSid) {
      this.rateRequestForm.patchValue({
        DepartmentMasterSid: voiceData.DepartmentMasterSid,
        Segment: voiceData.Segment
      });
      this.selectedFCLLCL = voiceData.Segment;
    }

    if (voiceData.shipmentDate) {
      this.rateRequestForm.patchValue({
        shipmentDate: voiceData.shipmentDate
      });
    }

    // Handle routes data
    if (voiceData.routes && voiceData.routes.length > 0) {
      const routesArray = this.rateRequestForm.get('routes') as FormArray;
      routesArray.clear();

      voiceData.routes.forEach((routeData: any, routeIndex: number) => {
        const routeFormGroup = this.fb.group({
          POO: [routeData.POO, ],
          POL: [routeData.POL, Validators.required],
          POD: [routeData.POD, Validators.required],
          FDC: [routeData.FDC, ],
          cargo: this.fb.array([])
        });

        // Handle cargo data
        if (routeData.cargo && routeData.cargo.length > 0) {
          const cargoArray = routeFormGroup.get('cargo') as FormArray;

          routeData.cargo.forEach((cargoData: any) => {
            const cargoForm = this.fb.group({
              CargoType: [cargoData.CargoType || 'General', Validators.required],
              ProductName: [cargoData.ProductName,],
              CargoDescription: [cargoData.CargoDescription],
              PackageType: [cargoData.PackageType],
              PackageQty: [cargoData.PackageQty],
              Qty: [cargoData.Qty || '1'],
              WeightUnitSid: [cargoData.WeightUnitSid],
              GrossWeight: [cargoData.GrossWeight],
              NetWeight: [cargoData.NetWeight],
              ShipmentTerms: [cargoData.ShipmentTerms],
              cbm: [cargoData.cbm || '1'],
              ContainerType: [cargoData.ContainerType],
              ChargeableWeight: [cargoData.ChargeableWeight],
              length: [cargoData.length],
              width: [cargoData.width],
              height: [cargoData.height]
            });

            this.updateCargoValidators(cargoForm, this.selectedFCLLCL);
            cargoArray.push(cargoForm);
          });
        } else {
          // Add default cargo if none provided
          this.addCargo(routeIndex);
        }

        routesArray.push(routeFormGroup);
      });
    }

    // Mark form as touched to show validation
    this.rateRequestForm.markAllAsTouched();

    // Show additional info about voice extraction
    if (voiceData.rawTranscription) {
      console.log('Original voice transcription:', voiceData.rawTranscription);
    }

    if (voiceData.confidence) {
      console.log('Extraction confidence scores:', voiceData.confidence);
    }
  }

  getRouteInfo(routeIndex: number) {
    const routeForm = this.routes.at(routeIndex) as FormGroup;
    const POL = routeForm.get('POL')?.value;
    const POD = routeForm.get('POD')?.value;
    const FPOD = routeForm.get('FDC')?.value;
    const portArray: String[] = [];
    const POLName = this.ports.find(p => p.PortMasterSid === POL)?.PortCode;
    const PODName = this.ports.find(p => p.PortMasterSid === POD)?.PortCode;
    const FPODName = this.ports.find(p => p.PortMasterSid === FPOD)?.PortCode;
    if (POLName && PODName) {
      portArray.push(POLName);
      portArray.push(PODName);
      const isEqual = PODName === FPODName;
      if (!isEqual && FPODName) {
        portArray.push(FPODName);
      }
      return portArray.join(' - ');
    } else {
      return 'Route Details'
    }
  }

  hasGrossWeightError(routeIndex: number) {
    const cargoForm = this.routeCargo(routeIndex).at(0) as FormGroup;
    return cargoForm.get('GrossWeight')?.hasError('grossNotGreater');
  }



}
