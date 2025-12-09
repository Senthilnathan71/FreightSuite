import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, effect, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModalRef, NgbNavModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { LeadService } from '../../Services/lead.service';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';
import { catchError, forkJoin, of, Subject, tap } from 'rxjs';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import {
  debounceTime,
  distinctUntilChanged
} from 'rxjs';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { AuthorizationStatus, getFormattedPort } from 'src/app/common/helper';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
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
    SearchableDropdown,
    NgbTooltip,
    NgxSpinnerModule,
    CustomDatePipe
  ],
  templateUrl: './enquiry-entry.component.html',
  styleUrl: './enquiry-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class EnquiryEntryComponent implements OnInit {
  @ViewChild('enquiryPrint') enquiryPrint!: TemplateRef<any>;
    @ViewChild('emailModal') emailModalRef: any;
  private destroy$ = new Subject<void>();
  enquiryData:any;
  selectedDepartment: any = '';
  isMobile: boolean = false;
  rateRequestForm!: FormGroup;
  EnquiryHeaderSid: any;
  isEditMode = false; // Flag for edit mode
  customers: any[] = [];
  incoList: any[] = [];
  salesmanList: any[] = [];
  packageTypes: any;
  containerTypes: any;
  MenuMasterSid:any
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
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day+1);
  disableAddButtons: boolean;
  rateRequestData: any;
  currentMenuId: number;
  TandCList: any;
  productList: any[];
  leadList: any[] = [];
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
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  portLookupConfig = DROPDOWN_CONFIGS.PORT;
  incoLookupConfig = DROPDOWN_CONFIGS.INCO;
  currentDate = new Date();
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
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
    { id: 4, name: "LCL/LCL" },
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
    { id: 5, name: "Pallet" }
  ]

  selectedTab = 'Enquiry';
  tabs = [
    { name: 'Enquiry', icon: 'fas fa-file-signature' },
    { name: 'Route Details', icon: 'fas fa-layer-group' },
    //  { name: 'Other', icon: 'fas fa-layer-group' }
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
  

  /** Flag that decides whether to disable the whole form or not. */
  isEnquiryAuthActionTaken: boolean;

  /** Flag that indicate if the particular enquiry is approved or not.*/
  isEnquiryApproved: boolean;

  /** Stores the approved part of Enquiry Data */
  approvedEnquiryData: any;

  /** Flag that indicate whether quotation is already created against this enquiry or not. */
  quotationCreatedAgainstThisEnquiry: boolean;

  /**
   * Stores authorization-related details for an enquiry.
   *
   * @typedef {Object} AuthRelatedDetails
   * @property {boolean} isAuthorizer - Indicates whether the user is an authorizer for this enquiry.
   * @property {boolean} alreadyApproved - Indicates whether the user has already approved this enquiry.
   * @property {boolean} canAuthorize - Indicates whether the user has permission to authorize this enquiry.
   * @property {number|null} AuthorityDetailSid - Unique identifier for the user's authorization record, or `null` if not applicable.
   * @property {number|null} AuthorityLevel - Represents the user's authorization hierarchy level, or `null` if not applicable.
   * @property {string} message - Descriptive message about the authorization status.
   * @property {number} totalNumberOfAuthorizers - Total number of active authorizers for the current menu or enquiry.
   */
  authRelatedDetails = {
    isAuthorizer: false,
    alreadyApproved: false,
    canAuthorize: false,
    AuthorityDetailSid: null,
    AuthorityLevel: null,
    message: "User is not an authorizer for this menu.",
    totalNumberOfAuthorizers: 0
  };


  constructor(
    public mps : MenuPermissionService,
    private appService: AppService,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: ModalService,
    private calendar: NgbCalendar,
    private ngbModal: NgbModal,
    private spinner: NgxSpinnerService,
    private datePipe: CustomDatePipe,
    public dropdownStore: DropdownStore,
    private pdfService:PdfDownloadService,
    private commonService: CommonService,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
  ) {
    effect(() => {
      const customerTypeOutput = this.dropdownStore.customerTypeData()
      this.shipperList = customerTypeOutput.filter(c => c.CustomerType?.shipper === 'isTrue');
      this.consigneeList = customerTypeOutput.filter(c => c.CustomerType?.consignee === 'isTrue');
      this.finalShipperList = [...this.shipperList]
      this.finalConsigneeList = [...this.consigneeList]
    })
  }

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice();
    this.initializeForm();
    this.mps.init().subscribe();
    this.userData = this.appSettingsService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company') );
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    console.log(this.branchDetails, "BRANCH DETAILS");
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    console.log(this.currentBranchCityId, "CITY")
    this.loadCityName();
    this.MenuMasterSid =  localStorage.getItem('currentMenuId');
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
        }
      });
      this.minExpDate = this.isEditMode ? undefined : this.today;
    });
    this.checkAuthorisedPerson(this.userData?.UserMasterSid);
    this.subscribeToLeadCustomerToggle();
  }

   loadCityName(): void {
    if (!this.currentBranchCityId) return;

    this.spinner.show();

    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {
        console.log("City API response:", response);

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
          console.log("Final City Name:", this.currentBranchCityName);
        }

        this.spinner.hide();
      },
      error: (error) => {
        console.error("Failed to load city:", error);
        this.spinner.hide();
      }
    });
  }

  checkAuthorisedPerson(UserMasterSid) {
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
        const data = resp.data;
        this.isAuthorizedUser = data?.canAuthorize
        this.isApproved = data?.alreadyApproved
        this.authRelatedDetails = {
          isAuthorizer: data?.isAuthorizer,
          alreadyApproved: data?.alreadyApproved,
          canAuthorize: data?.canAuthorize && !data?.alreadyApproved,
          AuthorityDetailSid: data?.AuthorityDetailSid || null,
          AuthorityLevel: data?.AuthorityLevel || null,
          message: data?.message || "User is not an authorizer for this menu.",
          totalNumberOfAuthorizers: data?.totalNumberOfAuthorizers || 0
        }
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

  // loadAllLookups() {
  //   const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   const BranchMasterSid = this.currentBranch?.BranchMasterSid;
  //   const filterOption = { 
  //     CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
  //     BranchMasterSid : this.currentBranch?.BranchMasterSid
  //   }
  //   // this.dropdownStore.loadDepartments({CompanyMasterSid});
  //   // this.dropdownStore.loadPorts();
  //   return forkJoin({
  //     departments: this.leadService.getAllDepartments(CompanyMasterSid).pipe(catchError(() => of([]))),
  //     ports: this.leadService.getAllPorts().pipe(catchError(() => of([]))),
  //     customers: this.leadService.getAllCustomersWithBranch(CompanyMasterSid).pipe(catchError(() => of([]))),
  //     leads: this.leadService.fetchAllLeads(filterOption).pipe(catchError(() => of([]))),
  //     incos: this.leadService.getAllIncos().pipe(catchError(() => of([]))),
  //     weightUnits: this.leadService.getUOMsByType('W').pipe(catchError(() => of([]))),
  //     packageTypes: this.leadService.getUOMsByType('P').pipe(catchError(() => of([]))),
  //     containerTypes: this.leadService.getAllContainerTypes().pipe(catchError(() => of([]))),
  //     products: this.leadService.getAllProducts(CompanyMasterSid).pipe(catchError(() => of([]))),salesman: this.leadService.getAllSalesman().pipe(catchError(err => of([]))),
  //   }).pipe(tap(({ departments , ports , customers, leads, incos, weightUnits, packageTypes, containerTypes, products,salesman }) => {
  //     this.departments = departments;
  //     this.ports = ports.map(p => ({...p,Country : p.countryMaster?.countryName}));
  //     this.filteredPorts = [...this.ports];
  //     this.customers = customers;
  //     this.leadList = leads.data;
  //     this.incoList = incos;
  //     this.weightUnitList = weightUnits.data;
  //     this.packageTypes = packageTypes.data;
  //     this.containerTypes = containerTypes;
  //     this.productList = products;
  //     this.salesmanList = salesman
  //   })
  //   );
  // }

  loadAllLookups() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const filterOption = { CompanyMasterSid, BranchMasterSid };

    return forkJoin({
      departments: this.dropdownStore.loadDepartments({ CompanyMasterSid }).pipe(catchError(() => of([]))),
      ports: this.dropdownStore.loadPorts().pipe(catchError(() => of([]))),
      customers: this.leadService.getAllCustomersWithBranch(CompanyMasterSid).pipe(catchError(() => of([]))),
      leads: this.leadService.fetchAllLeads(filterOption).pipe(catchError(() => of([]))),
      incos: this.dropdownStore.loadIncos().pipe(catchError(() => of([]))),
      weightUnits: this.leadService.getUOMsByType('W').pipe(catchError(() => of([]))),
      packageTypes: this.leadService.getUOMsByType('P').pipe(catchError(() => of([]))),
      containerTypes: this.dropdownStore.loadContainerTypes().pipe(catchError(() => of([]))),
      products: this.leadService.getAllProducts().pipe(catchError(() => of([]))),
      salesman: this.leadService.getAllSalesman(CompanyMasterSid).pipe(catchError(() => of([]))),
    }).pipe(
      tap(({ departments, ports, customers, leads, incos, weightUnits, packageTypes, containerTypes, products, salesman }) => {
        this.departments = departments;
        this.ports = ports.map(p => ({ ...p, Country: p.countryMaster?.countryName }));
        this.filteredPorts = [...this.ports];
        this.customers = customers;
        this.leadList = leads.data;
        this.incoList = incos;
        this.weightUnitList = weightUnits.data;
        this.packageTypes = packageTypes.data;
        this.containerTypes = containerTypes;
        this.productList = products;
        this.salesmanList = salesman;
      })
    );
  }

  initializeForm() {
    const today = this.calendar.getToday();
    this.rateRequestForm = this.fb.group({
      LeadOrCustomer: [true],
      PreCustomerMasterSid: [null],
      CustomerMasterSid: [null],
      customerName: ['', Validators.required],
      enquiryNo: [''],
      EnquiryDate: [today],
      shipmentDate: ['', Validators.required],
      DepartmentMasterSid: [''],
      Segment: [null, Validators.required],
      CustomerAddress: [''],
      CustomerBranchSid: [null],
      Email: ['', [EmailValidators.singleEmail()]],
      EnquiryType: [null],
      IncoTerms: [null],
      ClearanceBy: [null],
      TransportBy: [null],
      Remarks: [''],
      status: ['Active'],
      AuthorizerRemarks: [''],
      authorizerStatus: ['Pending'],
      CustomerRef: [''],
      UserMasterSid: [null],
      FreightPPCC: ['Prepaid'],
      routes: this.fb.array([]),
      ContactPerson:[''],
      ContactNumber:['',[Validators.maxLength(15), this.phoneNumberValidator]]
    });

    this.addRoute();
    this.initOthersForm()
  }

   phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const phoneRegex = /^(\+[0-9]{1,3})?[0-9]{6,15}$/;
    const isValid = phoneRegex.test(control.value);
    return isValid ? null : { invalidPhoneNumber: true };
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

  // Add this method to find KG weight unit
getWeightUnitSidByCode(code: string): number | null {
  if (!this.weightUnitList || this.weightUnitList.length === 0) {
    return null;
  }
  
  const unit = this.weightUnitList.find(unit => 
    unit.UOMCode?.toUpperCase() === code.toUpperCase()
  );
  
  return unit ? unit.UOMMasterSid : null;
}
getDefaultWeightUnitSid(): number | null {
  if (!this.weightUnitList || this.weightUnitList.length === 0) {
    return null;
  }
  
  // First try to find Kg (case-insensitive)
  const kgUnit = this.weightUnitList.find(unit => 
    unit.UOMCode?.toUpperCase() === 'KG'
  );
  
  if (kgUnit) return kgUnit.UOMMasterSid;
  
  // If Kg not found, use the first available weight unit
  return this.weightUnitList[0].UOMMasterSid;
}
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
      FreightTerms: [''],
      AdditionalService: [null],
      PickupAddress: ['']
    })
  }

  loadOtherFormLookups() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const payload = {
      CompanyMasterSid,
      types: ['shipper', 'consignee']
    };
    this.dropdownStore.loadCustomerTypeData(payload).subscribe();
    this.dropdownStore.loadDepartments(CompanyMasterSid).subscribe();
    this.dropdownStore.loadIncos().subscribe();
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
        POO: [null,],
        POL: [null, Validators.required],
        POD: [null, Validators.required],
        FDC: [null,],
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



  openEmail() {
    if (!this.rateRequestData) return;

    // Need to add later
    // if(!this.enquiryApproved){
    //   this.appSettingsService.showWarning("Please approve the quotation before sending email");
    //   return;
    // }

    const selectedItem = this.rateRequestData;

    const modalRef = this.ngbModal.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });

    const toEmailSet = new Set<string>();
    toEmailSet.add(selectedItem.Email);

    const toEmail = Array.from(toEmailSet);
    const ccEmail = [this.userData['userEmail']];

    const POL = selectedItem?.enquiryRoute[0]?.POLSid;
    const POD = selectedItem?.enquiryRoute[0]?.PODSid;
    const FPD = selectedItem?.enquiryRoute[0]?.FDPSid;
    const formattedPOL = getFormattedPort(this.ports, POL);
    const formattedPOD = getFormattedPort(this.ports, POD);
    const formattedFPD = getFormattedPort(this.ports, FPD);

    const subject = `Enquiry No.${this.rateRequestData?.EnquiryNumber} Date: ${this.datePipe.transform(this.rateRequestData?.EnquiryDate)} ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''}`;

    const mailBody = `Dear Sir/Madam,
Please find enclosed the enquiry as requested
Kindly review the details at your convenience.
Looking forward to your feedback and the opportunity to work together.
Best Regards,
${this.userData.userName}`;

    modalRef.componentInstance.setContent = {
      EmailTo: toEmail,
      EmailCC: ccEmail,
      EmailBCC: [],
      Subject: subject,
      Mailbody: mailBody,
      // attachments: [pdfFile]
    };
  }


  openAgentEmail() {
    if (!this.rateRequestData) return;

    // Need to add later
    // if(!this.enquiryApproved){
    //   this.appSettingsService.showWarning("Please approve the quotation before sending email");
    //   return;
    // }

    const selectedItem = this.rateRequestData;

    const modalRef = this.ngbModal.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });

    const toEmailSet = new Set<string>();
    // toEmailSet.add(selectedItem.Email);  // We dont take agent input in entry page

    const toEmail = Array.from(toEmailSet);
    const ccEmail = [this.userData['userEmail']];

    const POL = selectedItem?.enquiryRoute[0]?.POLSid;
    const POD = selectedItem?.enquiryRoute[0]?.PODSid;
    const FPD = selectedItem?.enquiryRoute[0]?.FDPSid;
    const formattedPOL = getFormattedPort(this.ports, POL);
    const formattedPOD = getFormattedPort(this.ports, POD);
    const formattedFPD = getFormattedPort(this.ports, FPD);
    const containerTypes = (selectedItem?.enquiryRoute?.[0]?.enquiryCargo || []).map(cargo => {
      return this.containerTypes.find(type => type.ContainerName === cargo.ContainerType)?.ContainerCode;
    }).join(', ');

    const subject = `Rate Request for ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''}`;

    const mailBody = `Dear Sir/Madam,
Kindly share the rate for ${formattedPOL} - ${formattedPOD} Container: ${containerTypes}
Looking forward to your feedback and the opportunity to work together.
Best Regards,
${this.userData.userName}`;

    modalRef.componentInstance.setContent = {
      EmailTo: toEmail,
      EmailCC: ccEmail,
      EmailBCC: [],
      Subject: subject,
      Mailbody: mailBody,
      // attachments: [pdfFile]
    };
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

    getFormattedPort(PortMasterSid) {
    if (!PortMasterSid || PortMasterSid === undefined || this.ports.length === 0) {
      return '';
    }
    const ourPort = this.ports.find(p => p.PortMasterSid === PortMasterSid);
    return ourPort ? `${ourPort.PortName} (${ourPort.PortCode})` : '';
  }


  addCargo(routeIndex: number) {
    const defaultWeightUnitSid = this.getDefaultWeightUnitSid();
    const cargoForm = this.fb.group({
      CargoType: [null, [Validators.required]],
      ProductName: [null],
      CargoDescription: [''],
      PackageType: [null],
      PackageQty: [''],
      Qty: ['1'],
      WeightUnitSid: [defaultWeightUnitSid],
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

  onSegmentChange(event: any) {
    if (!event) {
      this.selectedFCLLCL = "LCL";
      this.selectedDepartment = "";
      this.routes.controls.forEach((routeGroup: FormGroup) => {
        ['POO', 'POL', 'POD', 'FDC'].forEach(field => {
          routeGroup.get(field)?.setValue(null);
        });
      });
      return;
    }

    // Get the selected department ID - handle both object and ID scenarios
    let selectedDepartmentId: number;

    if (typeof event === 'object' && event.DepartmentMasterSid) {
      // Event is the selected department object
      selectedDepartmentId = Number(event.DepartmentMasterSid);
    } else {
      // Event is just the ID
      selectedDepartmentId = Number(event);
    }

    this.rateRequestForm.get('DepartmentMasterSid')?.setValue(selectedDepartmentId);

    const selectedDept = this.departments.find(
      dept => dept.DepartmentMasterSid === selectedDepartmentId
    );

    // Set selectedDepartment correctly
    this.selectedDepartment = selectedDept?.departmentName || '';

    if (selectedDept?.departmentType === "Sea") {
      this.selectedFCLLCL = selectedDept?.FCLLCL || "LCL";
    } else {
      this.selectedFCLLCL = selectedDept?.departmentType?.toUpperCase() || "LCL";
    }

    // Reset route ports
    this.routes.controls.forEach((routeGroup: FormGroup, index) => {
      ['POO', 'POL', 'POD', 'FDC'].forEach((field) => {
        routeGroup.get(field)?.setValue(null);
      });

      const initialPorts = this.getFilteredPortsBySegment();
      this.filteredPOLPorts[index] = initialPorts;
      this.filteredPODPorts[index] = initialPorts;

      // Update cargo validators
      const cargoArray = routeGroup.get('cargo') as FormArray;
      cargoArray.controls.forEach((cargoForm: FormGroup) => {
        this.updateCargoValidators(cargoForm, this.selectedFCLLCL);
      });
    });

    // Filter ports based on selected segment
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

  openPrint() {
    this.ngbModal.open(this.enquiryPrint, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      scrollable:true
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
          if (f === 'WeightUnitSid' && !ctrl.value) {
          const defaultWeightUnitSid = this.getDefaultWeightUnitSid();
          ctrl.setValue(defaultWeightUnitSid);
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
    console.log(selectedItem,"Selcted Values");
    if (isCustomer) {
      this.rateRequestForm.patchValue({
        customerName: selectedItem.CustomerName,
        CustomerAddress: selectedItem.Address,
        Email: selectedItem.Email,
        CustomerMasterSid: selectedItem.CustomerMasterSid,
        CustomerBranchSid: selectedItem.CustomerBranchSid,
      ContactPerson:selectedItem.ContactPerson,
      ContactNumber:selectedItem.ContactNumber
      });
      this.selectedCustomerName = selectedItem.CustomerName;
      // this.getCustomerBranches(selectedItem.CustomerMasterSid);
    } else {
      this.rateRequestForm.patchValue({
        customerName: selectedItem.preCustomerName,
        CustomerAddress: selectedItem.preCustomerAddress1,
        Email: selectedItem.email,
        CustomerBranchSid: null,
          ContactPerson:selectedItem.contactPerson,
      ContactNumber:selectedItem.phone,
      });
      this.selectedCustomerName = selectedItem.preCustomerName;
      this.patchSalespersonOfLead(selectedItem);
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
        this.enquiryData=resp.data;
        console.log(this.enquiryData,"Enquiry Data")
        this.patchValues(resp.data);
        this.rateRequestData = resp.data;
      }
    });
  }

   formatDate(date: any): string {
    if (!date) return '-';
    // Handle NgbDateStruct
    if (date.year && date.month && date.day) {
      return `${date.day.toString().padStart(2, '0')}/${date.month.toString().padStart(2, '0')}/${date.year}`;
    }
    // Handle Date object or string
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }


  patchValues(response: any) {
    /** Disables the form control. */
    const disableFormControl = (formGroup: FormGroup, controlName: string) => {
      formGroup.get(controlName)?.disable();
    }

    const isCustomer = response.LeadOrCustomer === 'C';
    this.rateRequestForm.get('LeadOrCustomer')?.setValue(isCustomer);
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
    } else {
      const selectedCustomer = this.customers.find(c => c.CustomerBranchSid === response.CustomerBranchSid);
      if (selectedCustomer) {
        this.rateRequestForm.patchValue({
          CustomerMasterSid: selectedCustomer.CustomerMasterSid,
          CustomerBranchSid: selectedCustomer.CustomerBranchSid,
          customerName: selectedCustomer.CustomerName,
          CustomerAddress: selectedCustomer.Address,
          Email: selectedCustomer.Email,
        });
      }
    }
    console.log(this.rateRequestForm.value)
    this.selectedDepartment = response.ShipmentType;
    const selectedDept = this.departments.find(dept => dept.DepartmentMasterSid === response.DepartmentMasterSid);
    if (selectedDept?.departmentType === "Sea") {
      this.selectedFCLLCL = selectedDept?.FCLLCL;
    } else {
      this.selectedFCLLCL = selectedDept?.departmentType?.toUpperCase();
    }

    // Patch header fields
    this.quotationEnquiryNumber = response.EnquiryNumber;
    this.quotationCustomerId = response.CustomerMasterSid;
    this.quotationDepartmentId = response.DepartmentMasterSid;
    this.getCustomerBranches(response.CustomerMasterSid);
    this.authStateCache = response.authorizerStatus,
      this.rateRequestForm.patchValue({
        CustomerMasterSid: response.CustomerMasterSid,
        CustomerBranchSid: response.CustomerBranchSid,
        customerName : response.CustomerName,
        CustomerAddress : response.CustomerAddress,
        Email : response.Email,
        PreCustomerMasterSid : response.PreCustomerMasterSid,
        enquiryNo: response.EnquiryNumber,
        EnquiryDate: new Date(response.EnquiryDate),
        shipmentDate: new Date(response.ShipmentExpectedDate),
        Segment: response.DepartmentMasterSid,
        UserMasterSid: response.UserMasterSid,
        FreightPPCC: response.FreightPPCC,
        EnquiryType: response.EnquiryType,
        IncoTerms: response.IncoTerms,
        ClearanceBy: response.ClearanceBy,
        TransportBy: response.TransportBy,
        Remarks: response.Remarks,
        AuthorizerRemarks: response.AuthorizerRemarks,
        authorizerStatus: response.authorizerStatus || 'Pending',
        status: response.status === 'A' ? 'Active' : 'Suspended',
        CustomerRef: response.CustomerRef,
              ContactPerson:response.ContactPerson,
      ContactNumber:response.ContactNumber
      });
    const disableFields = ['Segment', 'enquiryNo', 'EnquiryDate', 'customerName', 'CustomerMasterSid', 'PreCustomerMasterSid'];
    disableFields.forEach(f => disableFormControl(this.rateRequestForm, f));
    if (response.authorizerStatus !== "Pending") {
      ['authorizerStatus', 'AuthorizerRemarks'].forEach(f => disableFormControl(this.rateRequestForm, f));
    }

    const routesArray = this.rateRequestForm.get('routes') as FormArray;
    routesArray.clear();

    if (response?.enquiryOther && response.enquiryOther.length > 0) {
      const other = response.enquiryOther[0];



      this.enquiryOtherForm.patchValue({
        EnquiryOtherSid: other.EnquiryOtherSid,
        ShipperName: other.ShipperName,
        ShipperAddress: other.ShipperAddress || '',
        ConsigneeName: other.ConsigneeName,
        ConsigneeAddress: other.ConsigneeAddress || '',
        FreightTerms: other.FreightTerms,
        AdditionalService: other.AdditionalService,
        PickupAddress: other.PickupAddress,
      });

    }

    response.enquiryRoute.forEach((route, index) => {
      this.quotationPOL = route.POLSid;
      this.quotationPOD = route.PODSid;
      const routeFormGroup = this.fb.group({
        EnquiryRouteSid: [route.EnquiryRouteSid || null],
        POO: [route.PORSid,],
        POL: [route.POLSid, Validators.required],
        POD: [route.PODSid, Validators.required],
        FDC: [route.FDPSid,],
        cargo: this.fb.array([]),
      });

      // Get the cargo array inside the route
      const cargoArray = routeFormGroup.get('cargo') as FormArray;

      // Loop through enquiryCargo and add cargo rows dynamically
      route.enquiryCargo.forEach((cargo) => {
          let weightUnitSid = cargo.WeightUnitSid;
  if (!weightUnitSid) {
    weightUnitSid = this.getDefaultWeightUnitSid();
  }
        cargoArray.push(
          this.fb.group({
            EnquiryCargoSid: [cargo.EnquiryCargoSid || null],
            CargoType: [cargo.CargoType, Validators.required],
            ProductName: [cargo.ProductName],
            CargoDescription: [cargo.CargoDescription],
            PackageType: [cargo.PackageType || ''],
            PackageQty: [cargo.PackageQty || ''],
            Qty: [cargo.Qty || '1'],
            WeightUnitSid: [weightUnitSid],
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



    this.isEnquiryAuthActionTaken = response.authorizerStatus === "Approved" || response.authorizerStatus === "Rejected";

    if (this.isEnquiryAuthActionTaken) {
      this.rateRequestForm.disable();
      this.enquiryOtherForm.disable();
    }
    this.isEnquiryApproved = response.authorizerStatus === "Approved";
    if (this.isEnquiryApproved) {
      // Filter route that is approved
    }
    this.quotationCreatedAgainstThisEnquiry = response.QuoteHeaderSid === null;
  }

  restrictDecimal(event: KeyboardEvent) {
    if (event.key === '.' || event.key === ',') {
      event.preventDefault(); // Prevents entering a decimal point or comma
    }
  }

  onSubmit() {
    if (this.hasInvalidExcept('routes', this.rateRequestForm)) {
      this.rateRequestForm.markAllAsTouched();
      this.rateRequestForm.updateValueAndValidity();
      const errorMessage = this.getValidationErrorMessage();
      this.appSettingsService.showWarning(errorMessage);
      return;
    }
    let routeInvalid: boolean;
    this.routes.controls.forEach((routeGroup: FormGroup, index: number) => {
      if (this.hasInvalidExcept('cargo', routeGroup)) {
        routeGroup.markAllAsTouched();
        routeGroup.updateValueAndValidity();
        this.appSettingsService.showWarning(`Please enter the Route.`);
        routeInvalid = true;
      }
    });
    if (routeInvalid) {
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
        LeadOrCustomer: this.rateRequestForm.value.LeadOrCustomer ? 'C' : 'L',
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        enquiryOther: otherFormValue,
        updatedBy: userEmail,
        ContactPerson:this.rateRequestForm.value.ContactPerson,
      ContactNumber:this.rateRequestForm.value.ContactNumber,
        MenuMaster: this.currentMenuId,
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
      if (this.authRelatedDetails.totalNumberOfAuthorizers === 0) {
        updatePayload.authorizerStatus = AuthorizationStatus.Approved;
      }
      this.leadService
        .updateEnquiryById(this.EnquiryHeaderSid, updatePayload)
        .subscribe((resp) => {

          if (resp) {
            this.modalService.openSuccessModal('Enquiry Updated Successfully');
            this.btnDisable = false;
            this.loadEnquiry(this.EnquiryHeaderSid);
          } else {
            this.modalService.openErrorModal('Enquiry Update Failed');
          }
        });
    } else {
      const createPayload = {
        ...this.rateRequestForm.value,
        enquiryOther: otherFormValue,
        LeadOrCustomer: this.rateRequestForm.value.LeadOrCustomer ? 'C' : 'L',
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        createdBy: userEmail,
        DepartmentMasterSid: this.rateRequestForm.get('DepartmentMasterSid')
          ?.value,
        CustomerMasterSid: this.rateRequestForm.get('CustomerMasterSid')?.value,
        CustomerName: this.selectedCustomerName,
        Segment: this.selectedDepartment,
                ContactPerson:this.rateRequestForm.value.ContactPerson,
      ContactNumber:this.rateRequestForm.value.ContactNumber,
      };
      if (this.authRelatedDetails.totalNumberOfAuthorizers === 0) {
        createPayload.authorizerStatus = AuthorizationStatus.Approved;
      }
      this.leadService.createEnquiry(createPayload).subscribe((resp) => {
        if (resp.status) {
          this.modalService.openSuccessModal('Enquiry Created Successfully');
          this.btnDisable = false;
          this.EnquiryHeaderSid = resp?.data?.enquiryHeader?.EnquiryHeaderSid;
          if(this.EnquiryHeaderSid){
            this.router.navigate(['crm/enquiry/entry', this.EnquiryHeaderSid]);
          }
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
      CustomerRef: "",
      TransportBy: null,
      Remarks: '',
      status: 'Active',
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
    const polList = response.enquiryRoute.map(route => route.POLSid);
    const podList = response.enquiryRoute.map(route => route.PODSid);

    let cargoTypeList: string[] = [];

    if (Array.isArray(response.enquiryCargo)) {
      cargoTypeList.push(...response.enquiryCargo.map(cargo => cargo.CargoType));
    }

    (response.enquiryRoute || []).forEach(route => {
      if (Array.isArray(route.enquiryCargo)) {
        cargoTypeList.push(...route.enquiryCargo.map(cargo => cargo.CargoType));
      }
    });

    const dept = this.departments.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);


    let selectedFCLLCL;
    if (dept?.departmentType === "Sea") {
      selectedFCLLCL = dept?.FCLLCL;
    } else {
      selectedFCLLCL = dept?.departmentType?.toUpperCase();
    }

    let routeDetails = (response.enquiryRoute || []).flatMap(route => {
      return (route.enquiryCargo || []).map(cargo => {
        const containerTypeCode = this.containerTypes.find(
          con => con.ContainerName === cargo.ContainerType
        )?.ContainerCode || null;
        let packageTypeId = null;
    
    if (cargo.PackageType) {
      
      // Case 1: If PackageType is a string (like "CON", "CBM", etc.)
      if (typeof cargo.PackageType === 'string') {
        // First try to find by UOMCode (this is likely what you need)
        const packageTypeByCode = this.packageTypes.find(uom => 
          uom.UOMCode === cargo.PackageType
        );
        
        // If not found by code, try by name
        const packageTypeByName = this.packageTypes.find(uom => 
          uom.UOMName === cargo.PackageType
        );
        
        // Use whichever is found
        const foundPackageType = packageTypeByCode || packageTypeByName;
        
        if (foundPackageType) {
          packageTypeId = foundPackageType.UOMMasterSid;
          console.log(`Found package type: ${foundPackageType.UOMCode} (${foundPackageType.UOMName}) -> ID: ${packageTypeId}`);
        } else {
          console.warn(`No package type found for: "${cargo.PackageType}"`);
          console.warn('Available:', this.packageTypes?.map(p => p.UOMCode).join(', '));
        }
      }
    } 
    
    console.log('Final PackageType ID:', packageTypeId);
        return {
          PORSid: route.PORSid,
          POLSid: route.POLSid,
          PODSid: route.PODSid,
          FPODSid: route.FDPSid,
          CargoType: cargo.CargoType,
          GrossWeight: cargo.GrossWeight,
          NetWeight: cargo.NetWeight,
          Volume: cargo.Volume,
          ContainerType: containerTypeCode,
          ChargeableWeight: cargo.ChargeableWeight,
          PackageQty: cargo.PackageQty,
          PackageType: cargo.PackageType,
          ServiceLevel: response.IncoTerms,
          ProductName : cargo.ProductName,
          length: cargo.length,
          width: cargo.width,
          height: cargo.height,
        };
      });
    });

    const enqData = {
      EnquirySid: response?.EnquiryHeaderSid,
      EnquiryNumber: response.EnquiryNumber,
      CustomerAddress: response.CustomerAddress,
      CustomerName: response.CustomerName,
      Email: response.Email,
      CustomerRef: response.CustomerRef,
      LeadOrCustomer: response.LeadOrCustomer === "C",
      CustomerMasterSid: response.CustomerMasterSid,
      CustomerBranchSid: response.CustomerBranchSid,
      PreCustomerMasterSid: response.PreCustomerMasterSid,
      DepartmentMasterSid: response.DepartmentMasterSid,
      ContactPerson: response.ContactPerson,
      ContactNumber: response.ContactNumber,
      SalesmanSid: response.UserMasterSid,
      FreightPPCC: response.FreightPPCC,
      polList: polList,
      podList: podList,
      status: response.status,
      cargoTypeList: cargoTypeList,
      ShipmentType: selectedFCLLCL,
      rateRequest: true,
      quoteRoutes: routeDetails,
    };
    this.leadService.clearQuotationData();
    this.leadService.setQuotationData(enqData);
    console.log(this.leadService.getQuotationData());
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

  onIncoChange(selectedInco: any): void {
 
  if (!selectedInco) {
 
    return; // Do nothing if incoterm is cleared
 
  }
 
 
 
  // Find the selected incoterm object
 
  let selectedIncoTerm;
 
  
 
  if (typeof selectedInco === 'object' && selectedInco.IncoName) {
 
    selectedIncoTerm = this.incoList.find(inco => inco.IncoName === selectedInco.IncoName);
 
  } else if (typeof selectedInco === 'string') {
 
    selectedIncoTerm = this.incoList.find(inco => inco.IncoName === selectedInco);
 
  }
 
 
 
  if (selectedIncoTerm && selectedIncoTerm.OceanFreight) {
 
    // Direct mapping since OceanFreight is only Prepaid or Collect
 
    const freightValue = selectedIncoTerm.OceanFreight;
 
    
 
    // Update FreightPPCC field
 
    this.rateRequestForm.patchValue({
 
      FreightPPCC: freightValue
 
    }, { emitEvent: false });
 
    
 
    console.log(`IncoTerm "${selectedIncoTerm.IncoName}" selected, FreightPPCC set to: ${freightValue}`);
 
  }
 
}

  onShipperChange(selectedShipper?: any) {
    if (!selectedShipper) {
      // Clear ShipperAddress and reset Consignee list
      this.enquiryOtherForm.patchValue({ ShipperAddress: '' });
      this.finalConsigneeList = [...this.consigneeList];
      return;
    }

    // Find the full shipper object from finalShipperList
    const shipper = this.finalShipperList.find(
      (s: any) => s.CustomerName === selectedShipper.CustomerName || s.CustomerName === selectedShipper
    );

    if (shipper) {
      // ✅ Auto fill the ShipperAddress from CustomerAddress1
      this.enquiryOtherForm.patchValue({
        ShipperAddress: shipper.Address || ''
      });

      // ✅ Filter consignee list to exclude same shipper
      this.finalConsigneeList = this.consigneeList.filter(
        (consignee: any) => consignee.CustomerName !== shipper.CustomerName
      );
    }
  }
  onConsigneeChange(selectedConsignee?: any) {
    if (!selectedConsignee) {
      // Clear ConsigneeAddress and reset shipper list
      this.enquiryOtherForm.patchValue({ ConsigneeAddress: '' });
      this.finalShipperList = [...this.shipperList]; // reset shipper options
      return;
    }

    // Find the full consignee object
    const consignee = this.finalConsigneeList.find(
      (c: any) => c.CustomerName === selectedConsignee.CustomerName || c.CustomerName === selectedConsignee
    );

    if (consignee) {
      // ✅ Auto fill the Consignee Address from CustomerAddress1
      this.enquiryOtherForm.patchValue({
        ConsigneeAddress: consignee.Address || ''
      });

      // ✅ Filter shipper list to exclude same consignee
      this.finalShipperList = this.shipperList.filter(
        (shipper: any) => shipper.CustomerName !== consignee.CustomerName
      );
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
  // openEmail() {
  //   if (!this.rateRequestData) return;
  //   const modalRef = this.ngbModal.open(EmailEntryComponent, {
  //     size: 'lg',
  //     centered: true,
  //     backdrop: 'static'
  //   });
  // }

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
    const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.EnquiryHeaderSid
  }

      this.commonService.documentData.set(data)
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
          POO: [routeData.POO,],
          POL: [routeData.POL, Validators.required],
          POD: [routeData.POD, Validators.required],
          FDC: [routeData.FDC,],
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

  patchSalespersonOfLead(precustomer: any) {
    this.leadService.getSalespersonOfLead(precustomer.PreCustomerMasterSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.rateRequestForm.patchValue({
            UserMasterSid: resp.data
          })
        } else {
          this.appSettingsService.showError('Failed to load salesperson: Invalid response');
        }
      },
      error => {
        console.error('Error fetching salesperson:', error);
      });
  }


  async downloadPDF() {
  this.spinner.show();
  try {
    const enquiryNumber = this.rateRequestData?.EnquiryNumber || 'Enquiry';
    
    await this.pdfService.downloadBalancedPDF(
      'printContent',
      `Enquiry_${enquiryNumber}`,
      () => this.appSettingsService.showSuccess('PDF downloaded successfully!'),
      (error) => this.appSettingsService.showError('Error generating PDF. Please try again.')
    );
  } finally {
    this.spinner.hide();
  }
}

      async generatePDFBlob(): Promise<Blob | null> {
        const printContent = document.getElementById('printContent');
        if (!printContent) {
          return null;
        }
    
        try {
          const canvas = await html2canvas(printContent, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
    
          const imgWidth = 210;
          const pageHeight = 297;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;
    
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgData = canvas.toDataURL('image/png');
    
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
    
          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
    
          return pdf.output('blob');
        } catch (error) {
          console.error('Error generating PDF blob:', error);
          return null;
        }
      }

    getPort(PortMasterSid:number){
      return getFormattedPort(this.ports,PortMasterSid)
    }

   getUOMCode(uomId: number): string {
  if (!uomId) return '';
  const weightUnit = this.weightUnitList.find(unit => unit.UOMMasterSid === uomId);
  return weightUnit?.UOMCode || '';
}

// Add these methods to your EnquiryEntryComponent class

calculateTotalQty(): number {
  if (!this.enquiryData?.enquiryRoute?.[0]?.enquiryCargo) return 0;
  
  let total = 0;
  this.enquiryData.enquiryRoute[0].enquiryCargo.forEach((cargo: any) => {
    total += Number(cargo.Qty) || 0;
  });
  return total;
}

calculateTotalGrossWeight(): number {
  if (!this.enquiryData?.enquiryRoute?.[0]?.enquiryCargo) return 0;
  
  let total = 0;
  this.enquiryData.enquiryRoute[0].enquiryCargo.forEach((cargo: any) => {
    total += Number(cargo.GrossWeight) || 0;
  });
  return total;
}

calculateTotalNetWeight(): number {
  if (!this.enquiryData?.enquiryRoute?.[0]?.enquiryCargo) return 0;
  
  let total = 0;
  this.enquiryData.enquiryRoute[0].enquiryCargo.forEach((cargo: any) => {
    total += Number(cargo.NetWeight) || 0;
  });
  return total;
}

calculateTotalCBM(): number {
  if (!this.enquiryData?.enquiryRoute?.[0]?.enquiryCargo) return 0;
  
  let total = 0;
  this.enquiryData.enquiryRoute[0].enquiryCargo.forEach((cargo: any) => {
    total += Number(cargo.Volume) || 0;
  });
  return total;
}

calculateTotalPackageQty(): number {
  if (!this.enquiryData?.enquiryRoute?.[0]?.enquiryCargo) return 0;
  
  let total = 0;
  this.enquiryData.enquiryRoute[0].enquiryCargo.forEach((cargo: any) => {
    total += Number(cargo.PackageQty) || 0;
  });
  return total;
}

openFollowup() {
    if (!this.enquiryData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.enquiryData?.EnquiryHeaderSid;
    modalRef.componentInstance.parentSubject = `__SUBJECT__ for Enquiry No."${this.enquiryData.EnquiryNumber}"`;
    modalRef.componentInstance.parentMailbodyTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <p>Dear Sir/Madam,</p>
      <p>Kindly do the needful for "__SUBJECT__" Enquiry No."${this.enquiryData.EnquiryNumber}" Dated:${new Date(this.enquiryData.EnquiryDate).toLocaleDateString()}</p>
      <p>Best Regards,</p>
      <p>${this.userData['userEmail']}</p>
    </div>
  `;

  modalRef.componentInstance.followupSaved.subscribe((result) => {
    console.log('Follow-up saved successfully:', result);
    this.appSettingService.showSuccess('Follow-up created successfully');
  });

  modalRef.result.then(
    (result) => console.log('Modal closed:', result),
    (dismissReason) => console.log('Modal dismissed:', dismissReason)
  );
  }


           printDiv(divId: string): void {
  const printContents = document.getElementById(divId)?.innerHTML;
  if (!printContents) return;

  const popupWin = window.open('', '_blank', 'width=900,height=600');
  if (popupWin) {
    popupWin.document.open();
    popupWin.document.write(`
      <html>
        <head>
          <title>Print</title>
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);
    popupWin.document.close();
  }
}

  ngOnDestroy(): void {
    this.commonService.clearDocumentData()
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }

  getValidationErrorMessage(): string {
  const form = this.rateRequestForm;
  
  // Check specific required fields first
  if (form.get('shipmentDate')?.invalid) {
    return 'Please enter Expected Shipment Date.';
  }
  
  if (form.get('Segment')?.invalid) {
    return 'Please select Department.';
  }
  
  if (form.get('CustomerMasterSid')?.invalid && form.get('LeadOrCustomer')?.value === true) {
    return 'Please select Customer.';
  }
  
  if (form.get('PreCustomerMasterSid')?.invalid && form.get('LeadOrCustomer')?.value === false) {
    return 'Please select Lead.';
  }
  
  // Check routes
  const routesArray = form.get('routes') as FormArray;
  for (let i = 0; i < routesArray.length; i++) {
    const route = routesArray.at(i) as FormGroup;
    
    if (route.get('POL')?.invalid) {
      return `Please select POL for Route.`;
    }
    
    if (route.get('POD')?.invalid) {
      return `Please select POD for Route.`;
    }
  }
  
  // Default message
  return 'Please fill all the required fields correctly.';
}

}
