import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, effect, HostListener, OnDestroy, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
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
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbInputDatepicker, NgbModal, NgbModalRef, NgbNavModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { LeadService } from '../../Services/lead.service';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';
import { catchError, forkJoin, of, Subject, Subscription, takeUntil, tap } from 'rxjs';
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
import { AuthorizationStatus, errorLogger, getFormattedPort, getDefaultTodayDate } from 'src/app/common/helper';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { PdfMakeService } from 'src/app/common/pdf';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { VoiceRecognitionService } from '../voice-recognition.service';
import { VoiceParserService } from '../voice-parser.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { VolumetricAndCbmCalculationService } from 'src/app/core/services/volumetric-and-cbm-calculation.service';
import { DropdownMenuItem } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { VerticalSidebarService } from 'src/app/shared/vertical-sidebar/vertical-sidebar.service';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { DialCodeDropdownComponent } from 'src/app/component/dial-code-dropdown/dial-code-dropdown.component';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { type } from 'os';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
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
    CustomDatePipe,
    PrintFooterComponent,
    PrintHeaderComponent,
    DialCodeDropdownComponent,
    MultiSelectComponent,
    ElementStateGuardDirective,
    FormStateGuardDirective
  ],
  templateUrl: './enquiry-entry.component.html',
  styleUrl: './enquiry-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})


export class EnquiryEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  @ViewChild('enquiryPrint') enquiryPrint!: TemplateRef<any>;
  @ViewChild('emailModal') emailModalRef: any;
  private destroy$ = new Subject<void>();
  enquiryData: any;
  selectedDepartment: any = '';
  isMobile: boolean = false;
  isTermsAndConditionsEnabled: boolean = true;
  rateRequestForm!: FormGroup;
  EnquiryHeaderSid: any;
  isEditMode = false; // Flag for edit mode
  customers: any[] = [];
  incoList: any[] = [];
  salesmanList: any[] = [];
  packageTypes: any;
  containerTypes: any;
  MenuMasterSid: any
  // ports: any
  departments: any[] = [];
  enquiryForm: FormGroup;
  enquiryOtherForm: FormGroup;
  errorMessage: string = ''; // To store any error messages
  btnDisable: boolean = false;
  enquiry: any;
  // selectedFCLLCL is used for port filtering (AIR/SEA/FCL/LCL/ROAD/TRANSPORT/etc).
  // selectedCargoMode drives which cargo fields/table are shown + cargo validators.
  selectedFCLLCL: string = ''; // Store selected segment/department type (and Sea FCL/LCL)
  selectedCargoMode: 'FCL' | 'LCL' | 'AIR' | 'ROAD' = 'LCL';
  selectedCustomerName: any;
  statusList = ['Active', 'Suspended'];
  minDate: string = '';
  rateRequest: boolean = false;
  ports = [];
  filteredPorts = [];
  searchText = '';
  selectedPort: any;
  decimalAfterPrecision = 3;
  digitsAfterDecimal = 3;
  quotationEnquiryNumber: any;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day + 1);
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
  filteredPOOPorts: any[][] = [];
  filteredFDCPorts: any[][] = [];
  private routePortFilterPayloadKeys: string[] = [];
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
  isPatching = false;
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  actionMenuItems: DropdownMenuItem[] = [];
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  portLookupConfig = DROPDOWN_CONFIGS.PORT;
  incoLookupConfig = DROPDOWN_CONFIGS.INCO;
  userLookupConfig = DROPDOWN_CONFIGS.USER;
  currentDate = new Date();
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  @ViewChild('enquiryTypeNg', { static: false }) enquiryTypeNg!: any;
  @ViewChild('leadNg', { static: false }) leadNg!: any;
  @ViewChild('ClearanceByNg', { static: false }) ClearanceByNg!: NgSelectComponent;
  @ViewChild('TransportByNg', { static: false }) TransportByNg!: any;
  @ViewChild('SalesmanNg', { static: false }) SalesmanNg!: any;
  @ViewChild('AdditionalServiceNg', { static: false }) AdditionalServiceNg!: any;
  @ViewChild('freightTermsNg', { static: false }) freightTermsNg!: any;
  @ViewChild('shipmentDp', { static: false })
  shipmentDp!: NgbInputDatepicker;
  @ViewChildren('CargoTypeNg') cargoTypeNgs!: QueryList<NgSelectComponent>;
  @ViewChildren('ProductNameNg') productNameNgs!: QueryList<NgSelectComponent>;
  @ViewChildren('PackageTypeNg') packageTypeNgs!: QueryList<NgSelectComponent>;
  @ViewChildren('ShipmentTermsNg') shipmentTermsNgs!: QueryList<NgSelectComponent>;

  @ViewChild('segmentDd')
  segmentDd!: SearchableDropdown;
  @ViewChild('CustomerDP')
  CustomerDP!: SearchableDropdown;
  @ViewChild('IncoNameDd') IncoNameDd!: SearchableDropdown;
  @ViewChild('ShipperNameDd') ShipperNameDd!: SearchableDropdown;
  @ViewChild('ConsigneeNameDd') ConsigneeNameDd!: SearchableDropdown;
  @ViewChild('pooDd') pooDd!: SearchableDropdown;
  @ViewChild('polDd') polDd!: SearchableDropdown;
  @ViewChild('podDd') podDd!: SearchableDropdown;
  @ViewChild('fdcDd') fdcDd!: SearchableDropdown;


  //voice Recognition

  isVoiceSupported = false;
  voiceStartedOnce: boolean = false;
  isListening = false;
  voiceCommands: string[] = [];
  spokenText = '';

  // Voice Navigation Properties
  currentFieldIndex = 0;
  // In initializeVoiceNavigation() or in the voiceFieldOrder array:
  voiceFieldOrder: string[] = [

    'Segment',
    'EnquiryType',
    'shipmentDate',
    'LeadOrCustomer',
    'CustomerBranchSid',
    'PreCustomerMasterSid',
    'CustomerAddress',
    'Email',
    'ContactPerson',
    'ContactNumber',
    'ClearanceBy',
    'UserMasterSid',
    'AdditionalService',
    'TransportBy',
    'PickupAddress',
    'IncoTerms',
    'ShipperName',
    'ShipperAddress',
    'ConsigneeName',
    'ConsigneeAddress',
    'CustomerRef',
    'Remarks',

  ];
  currentFieldName: string = '';
  isDropdownOpen = false;
  dropdownOptions: any[] = [];
  activeRouteIndex = 0;
  routeVoiceFieldOrder = ['POO', 'POL', 'POD', 'FDC'];
  currentRouteFieldIndex = 0;
  isCargoVoiceMode = false;
  private routerSub!: Subscription;
  activeCargoIndex = 0;
  currentCargoFieldIndex = 0;
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


  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

  selectTab(tab: string) {
    this.selectedTab = tab;
    if (this.voiceRecognitionService.isContinuous) {
      // this.toastr.info(`${tab} tab selected`);
    }
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

  measurementUnitList =[
    { id: 1, name: 'M' },
    { id: 2, name: 'CM' },
    { id: 3, name: 'Inch'}
  ]


  constructor(
    public mps: MenuPermissionService,
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
    private pdfService: PdfDownloadService,
    private pdfMakeService: PdfMakeService,
    private commonService: CommonService,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    public voiceRecognitionService: VoiceRecognitionService,
    private voiceParserService: VoiceParserService,
    private toastr: ToastrService,
    private cdRef: ChangeDetectorRef,
    private volumetricAndCbmCalculationService: VolumetricAndCbmCalculationService,
    public logoService: LogoService,
    private sidebarService : VerticalSidebarService,
    private emailTriggerService: EmailTriggerService,
    private modelService: NgbModal,
    private operationService: OperationService,
    private companySettings: CompanySettingsManagerService
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
    this.initializeVoiceNavigation();
    this.setupVoiceSubscriptions();
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.stopVoiceGuide();
      }
    });
    this.mps.init().subscribe(() => {
      this.initializeActionMenu();
    });
    this.userData = this.appSettingsService.getDecryptedUserProfile();
    this.rateRequestForm.patchValue({
      ContactNumberCode: DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData)
    });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
    this.MenuMasterSid = Number(sessionStorage.getItem('currentMenuId'));
    this.loadTermsAndConditionsConfig();
    this.loadAllLookups().subscribe(() => {
      this.loadOtherFormLookups();
      // Check for voice enquiry data first
      this.activatedRoute.queryParams.subscribe(queryParams => {
        if (queryParams['voice'] === 'true') {
          // this.handleVoiceEnquiryData();
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
    this.subscribeToFormChanges();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onSubmit(resolve);
    });
  }

  initializeActionMenu(): void {
    this.actionMenuItems = [
      {
        label: 'Edoc',
        icon: 'fas fa-file-alt',
        action: 'edoc',
        condition: this.mps.has('edoc')
      },
      // {
      //   label: 'Terms & Condition',
      //   icon: 'fas fa-clipboard',
      //   action: 'terms_and_condition',
      //   condition: this.mps.has('terms_and_condition')
      // },
      {
        label: 'Authorize',
        icon: 'fas fa-shield-alt',
        action: 'authority',
        condition: this.mps.has('authority')
      },
      {
        label: 'Email',
        icon: 'fas fa-envelope',
        action: 'email',
        condition: this.mps.has('email')
      },
      {
        label: 'Agent Email',
        icon: 'fas fa-envelope',
        action: 'agent_email',
        condition: this.selectedFCLLCL === 'FCL'
      },
      {
        label: 'Followup',
        icon: 'fas fa-paperclip',
        action: 'follow_up',
        condition: this.mps.has('follow_up')
      },
      {
        label: 'Document reference',
        icon: 'fas fa-paperclip',
        action: 'document_reference',
        condition: this.mps.has('document_reference')
      }
    ];
  }

  onActionMenuClick(action: string): void {
    switch (action) {
      case 'edoc':
        this.openEDoc();
        break;
      // case 'terms_and_condition':
      //   this.openTandC();
      //   break;
      case 'authority':
        this.openAuthority();
        break;
      case 'email':
        this.openEmail();
        break;
      case 'agent_email':
        this.openAgentEmail();
        break;
      case 'follow_up':
        this.openFollowup();
        break;
      case 'document_reference':
        this.openDocRef();
        break;
    }
  }

  private loadTermsAndConditionsConfig(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (!companyId) {
      this.isTermsAndConditionsEnabled = true;
      return;
    }

    this.masterService.getConfigurationValue(companyId, 'TermsandConditions').subscribe({
      next: (resp: any) => {
        const rawValue = resp?.ConfigurationValue ?? resp?.value ?? resp;
        this.isTermsAndConditionsEnabled = this.parseConfigBoolean(rawValue, true);
        this.cdRef.markForCheck();
      },
      error: () => {
        // Default to enabled if config fetch fails
        this.isTermsAndConditionsEnabled = true;
        this.cdRef.markForCheck();
      }
    });
  }

  private parseConfigBoolean(value: any, defaultValue: boolean): boolean {
    if (value === true || value === false) return value;
    if (value === null || value === undefined) return defaultValue;
    const normalized = String(value).trim().toUpperCase();
    if (['Y', 'YES', 'TRUE', '1'].includes(normalized)) return true;
    if (['N', 'NO', 'FALSE', '0'].includes(normalized)) return false;
    return defaultValue;
  }

  loadCityName(): void {
    if (!this.currentBranchCityId) return;

    this.spinner.show();

    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
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
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
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
      countries: this.dropdownStore.loadCountries().pipe(catchError(() => of([]))),
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
      tap(({ countries, departments, ports, customers, leads, incos, weightUnits, packageTypes, containerTypes, products, salesman }) => {
        this.departments = departments;
        this.ports = ports.map(p => ({ ...p, Country: p.countryMaster?.countryName }));
        this.filteredPorts = [...this.ports];
        this.routes?.controls?.forEach((_, routeIndex: number) => this.refreshRoutePortFilters(routeIndex));
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
    const today = getDefaultTodayDate();
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
      CustomerRef: ['', [Validators.maxLength(20)]],
      UserMasterSid: [null],
      FreightPPCC: ['Prepaid'],
      routes: this.fb.array([]),
      ContactPerson: [''],
      ContactNumberCode: [DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData)],
      ContactNumber: ['', [Validators.maxLength(15), this.phoneNumberValidator]]
    });

    this.addRoute();
    this.initOthersForm()
  }

  phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const phoneRegex = /^[0-9]{6,15}$/;
    const isValid = phoneRegex.test(control.value);
    return isValid ? null : { invalidPhoneNumber: true };
  }

  private parsePhone(rawValue: any): { phoneCode: string; phoneNumber: string } {
    const parsed = DialCodeDropdownComponent.splitPhoneNumber(rawValue);
    return {
      phoneCode: parsed.phoneCode || DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData),
      phoneNumber: parsed.phoneNumber
    };
  }

  private withDialCode(phoneValue: any, dialCode?: string): string {
    return DialCodeDropdownComponent.buildPhoneWithDialCode(phoneValue, dialCode);
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

  private subscribeToRouteAutoFill(routeGroup: FormGroup): void {
    routeGroup.get('POD')?.valueChanges.subscribe((podValue: number | null) => {
      const fdcControl = routeGroup.get('FDC');
      const currentFDC = fdcControl?.value;

      if (!currentFDC) {
        fdcControl?.setValue(podValue, { emitEvent: false });
      }
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
        EnquiryRouteSid: [null],
        POO: [null,],
        POL: [null, Validators.required],
        POD: [null, Validators.required],
        FDC: [null,],
        cargo: this.fb.array([]),
      }
    );


    this.routes.push(routeForm);
    this.subscribeToRouteChanges(routeForm, this.routes.length - 1);
    this.subscribeToRouteAutoFill(routeForm);
    this.addCargo(this.routes.length - 1, true);
    this.filteredPOOPorts[this.routes.length - 1] = [];
    this.filteredPOLPorts[this.routes.length - 1] = [];
    this.filteredPODPorts[this.routes.length - 1] = [];
    this.filteredFDCPorts[this.routes.length - 1] = [];
    this.refreshRoutePortFilters(this.routes.length - 1);

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
    const departmentName =
      this.departments.find(dept => dept.DepartmentMasterSid === selectedItem?.DepartmentMasterSid)
        ?.departmentName ||
      selectedItem?.departmentMaster?.departmentName ||
      selectedItem?.department?.departmentName ||
      selectedItem?.departmentName ||
      selectedItem?.DepartmentName ||
      selectedItem?.ShipmentType ||
      '';

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
      context: { departmentName },
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
    const departmentName =
      this.departments.find(dept => dept.DepartmentMasterSid === selectedItem?.DepartmentMasterSid)
        ?.departmentName ||
      selectedItem?.departmentMaster?.departmentName ||
      selectedItem?.department?.departmentName ||
      selectedItem?.departmentName ||
      selectedItem?.DepartmentName ||
      selectedItem?.ShipmentType ||
      '';
      
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
      context: { departmentName },
      // attachments: [pdfFile]
    };
  }

  // Remove a Route
  removeRoute(index: number) {
    const routeGroup = this.routes.at(index) as FormGroup;
    const enquiryRouteSid = Number(routeGroup?.get('EnquiryRouteSid')?.value) || 0;

    if (enquiryRouteSid > 0) {
      this.leadService.deleteEnquiryRoute(enquiryRouteSid).subscribe({
        next: (resp: any) => {
          if (resp?.status !== false) {
            this.removeRouteAt(index);
            this.loadEnquiry(this.EnquiryHeaderSid);
          } else {
            this.appSettingsService.showError('Error deleting route');
          }
        },
        error: (error) => {
          console.error('Error deleting enquiry route:', error);
          this.appSettingsService.showError('Error deleting route');
        }
      });
      return;
    }

    this.removeRouteAt(index);
  }

  private removeRouteAt(index: number): void {
    this.routes.removeAt(index);
    this.routePortFilterPayloadKeys.splice(index, 1);
    this.filteredPOOPorts.splice(index, 1);
    this.filteredPOLPorts.splice(index, 1);
    this.filteredPODPorts.splice(index, 1);
    this.filteredFDCPorts.splice(index, 1);
  }


  deleteCargo(routeIndex: number, cargoIndex: number) {
    const cargoArray = this.routeCargo(routeIndex) as FormArray;
    const cargoGroup = cargoArray.at(cargoIndex) as FormGroup;
    const enquiryCargoSid = Number(cargoGroup?.get('EnquiryCargoSid')?.value) || 0;

    if (enquiryCargoSid > 0) {
      this.leadService.deleteEnquiryCargo(enquiryCargoSid).subscribe({
        next: (resp: any) => {
          if (resp?.status !== false) {
            cargoArray.removeAt(cargoIndex);
            this.appSettingsService.showSuccess('Cargo deleted successfully');
          } else {
            this.appSettingsService.showError('Error deleting cargo');
          }
        },
        error: (error) => {
          console.error('Error deleting enquiry cargo:', error);
          this.appSettingsService.showError('Error deleting cargo');
        }
      });
      return;
    }

    cargoArray.removeAt(cargoIndex);
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
  get isSuspended() : boolean {
    return this.rateRequestData?.status !== 'A';
  }

  calculateCBM(routeIndex: number, cargoIndex: number): void {
    const cargoForm = this.routeCargo(routeIndex).at(cargoIndex) as FormGroup;

    if (this.selectedCargoMode === 'ROAD') {
      cargoForm.get('cbm')?.setValue('', { emitEvent: false });
      return;
    }

    const qty = Number(cargoForm.get('PackageQty')?.value) || 0;
    const length = Number(cargoForm.get('length')?.value) || 0;
    const width = Number(cargoForm.get('width')?.value) || 0;
    const height = Number(cargoForm.get('height')?.value) || 0;

    // Calculate CBM: (qty * length * width * height) / 1000000
    if (qty > 0 && length > 0 && width > 0 && height > 0) {
      const cbm = (qty * length * width * height) / 1000000;
      cargoForm.get('cbm')?.setValue(cbm.toFixed(3), { emitEvent: false });
    } else {
      cargoForm.get('cbm')?.setValue('1', { emitEvent: false });
    }
  }


  addCargo(routeIndex: number, isInitialCargo = false) {
    if (!isInitialCargo && this.selectedCargoMode !== 'FCL') {
      return;
    }

    if (this.quotationCreatedAgainstThisEnquiry) {
      return;
    }

    const cargoForm = this.fb.group({
      EnquiryCargoSid: [null],
      CargoType: [null, [Validators.required]],
      ProductName: [null],
      CargoDescription: [''],
      PackageType: [null],
      PackageQty: [1],
      Qty: ['1'],
      WeightUnitSid: [2],
      GrossWeight: ['', [this.weightValidator]],
      NetWeight: [''],
      ShipmentTerms: [null],
      cbm: ['1'],
      ContainerType: [null],
      ContainerNo: [''],
      ChargeableWeight: [''],
      volumetric: [''],
      length: [''],
      width: [''],
      height: ['']
    });
    this.updateCargoValidators(cargoForm, this.selectedCargoMode);
    this.routeCargo(routeIndex).push(cargoForm);
    const cargoArray = this.routeCargo(routeIndex);
    const cargoIndex = cargoArray.length - 1;
    this.setupCargoCalculations(cargoIndex, routeIndex);
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

  private setupCargoCalculations(cargoIndex: number, routeIndex: number): void {
  const cargoForm = this.routeCargo(routeIndex).at(cargoIndex) as FormGroup;
  const dimensionFields = ['PackageQty', 'length', 'width', 'height', 'WeightUnitSid'];
  const manualWeightFields = ['GrossWeight', 'cbm', 'volumetric'];

  dimensionFields.forEach(field => {
    cargoForm.get(field)?.valueChanges.subscribe(() => {
      this.calculateCargoValues(cargoForm);
    });
  });

  manualWeightFields.forEach(field => {
    cargoForm.get(field)?.valueChanges.subscribe(() => {
      if (this.selectedCargoMode !== 'ROAD') {
        this.setChargeableWeightByGreatest(cargoForm);
      }
    });
  });
}

  openAuditLogs() {
    if (!this.enquiryData?.EnquiryHeaderSid) return;
    const modalRef = this.modelService.open(AuditLogComponent, {
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'Enquiry Logs';
    modalRef.componentInstance.tableName = 'EnquiryHeader';
    modalRef.componentInstance.recordId = this.enquiryData?.EnquiryHeaderSid.toString();
    modalRef.componentInstance.screenName = 'Enquiry';
  }

private calculateCargoValues(cargoForm: FormGroup): void {
  
  if (this.isPatching) {
    return;
  }

  if (this.selectedCargoMode === 'ROAD') {
    cargoForm.get('cbm')?.setValue('', { emitEvent: false });
    cargoForm.get('volumetric')?.setValue('', { emitEvent: false });
    return;
  }

  const packageQty = this.parseFloatSafe(cargoForm.get('PackageQty')?.value);
  const length = this.parseFloatSafe(cargoForm.get('length')?.value);
  const width = this.parseFloatSafe(cargoForm.get('width')?.value);
  const height = this.parseFloatSafe(cargoForm.get('height')?.value);
  const uomMasterSid = cargoForm.get('WeightUnitSid')?.value;
  
  if (packageQty > 0 && length > 0 && width > 0 && height > 0 && uomMasterSid) {
    // For LCL and AIR: Calculate both CBM and Volumetric
    if (this.selectedCargoMode === 'LCL' || this.selectedCargoMode === 'AIR') {
      const { cbm, volumetric } = this.volumetricAndCbmCalculationService.calculateCBMAndVolumetric(
        packageQty, length, width, height, uomMasterSid,
        this.selectedCargoMode as 'LCL' | 'AIR',
        this.digitsAfterDecimal
      );
      
      // Update CBM field
      cargoForm.get('cbm')?.setValue(cbm > 0 ? cbm : '', { emitEvent: false });
      cargoForm.get('volumetric')?.setValue(volumetric > 0 ? volumetric: '', { emitEvent: false});
      this.setChargeableWeightByGreatest(cargoForm);
    } else {
      // For FCL: Calculate only CBM
      const cbm = this.volumetricAndCbmCalculationService.calculateCBM(
        packageQty, length, width, height, uomMasterSid, this.digitsAfterDecimal
      );
      cargoForm.get('cbm')?.setValue(cbm > 0 ? cbm : '', { emitEvent: false });
      this.setChargeableWeightByGreatest(cargoForm);
    }
  } else {
    // Keep manually entered CBM/Volumetric when dimensions are not provided.
    this.setChargeableWeightByGreatest(cargoForm);
  }
}

private setChargeableWeightByGreatest(cargoForm: FormGroup): void {
  if (this.selectedCargoMode === 'ROAD') {
    return;
  }

  const cbm = this.parseFloatSafe(cargoForm.get('cbm')?.value);
  const volumetric = this.parseFloatSafe(cargoForm.get('volumetric')?.value);
  const grossWeight = this.parseFloatSafe(cargoForm.get('GrossWeight')?.value);
  const chargeableWeight = Math.max(cbm, volumetric, grossWeight);

  cargoForm.get('ChargeableWeight')?.setValue(
    chargeableWeight > 0 ? Number(chargeableWeight.toFixed(this.digitsAfterDecimal)) : '',
    { emitEvent: false }
  );
}

private parseFloatSafe(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
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
      this.selectedCargoMode = 'LCL';
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

    this.selectedFCLLCL = this.resolveSelectedSegment(selectedDept);
    this.selectedCargoMode = this.resolveCargoMode(selectedDept);

    // Refresh action menu items based on new segment selection
    this.initializeActionMenu();

    // Reset route ports
    this.routes.controls.forEach((routeGroup: FormGroup, index) => {
      ['POO', 'POL', 'POD', 'FDC'].forEach((field) => {
        routeGroup.get(field)?.setValue(null);
      });

      this.routePortFilterPayloadKeys[index] = '';
      this.filteredPOOPorts[index] = [];
      this.filteredPOLPorts[index] = [];
      this.filteredPODPorts[index] = [];
      this.filteredFDCPorts[index] = [];

      // Update cargo validators
      const cargoArray = routeGroup.get('cargo') as FormArray;
      cargoArray.controls.forEach((cargoForm: FormGroup) => {
        this.updateCargoValidators(cargoForm, this.selectedCargoMode);
      });
    });

    this.routes.controls.forEach((_, routeIndex: number) => this.refreshRoutePortFilters(routeIndex));
  }

  openPrint() {
    this.ngbModal.open(this.enquiryPrint, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      scrollable: true
    });
  }
  updateCargoValidators(cargoForm: FormGroup, type: string) {
    Object.keys(cargoForm.controls).forEach(fieldName => {
      const ctrl = cargoForm.get(fieldName);
      if (!ctrl) {
        return;
      }

      if (fieldName === 'GrossWeight') {
        ctrl.clearValidators();
      } else {
        ctrl.clearValidators();
      }
      ctrl.setErrors(null);
      ctrl.updateValueAndValidity({ emitEvent: false });
    });

    const resetFields = (fields: string[]) => {
      if (this.isPatching) {
        return;
      }

      fields.forEach(f => {
        const ctrl = cargoForm.get(f);
        if (ctrl) {
          ctrl.setValue(null);
          ctrl.updateValueAndValidity({ emitEvent: false });
        }
      });
    };

    const setRequired = (fields: string[]) => {
      fields.forEach(f => {
        const ctrl = cargoForm.get(f);
        if (ctrl) {
          const validators = [Validators.required];
          if (f === 'PackageQty' || f === 'volumetric') {
            validators.push(Validators.min(1));
          }
          ctrl.setValidators(validators);
          if (!this.isPatching && (f === 'Qty' || f === 'cbm') && !ctrl.value) {
            ctrl.setValue('1');
          }
          if (f === 'WeightUnitSid' && !ctrl.value) {
            ctrl.setValue(2);
          }
          ctrl.updateValueAndValidity({ emitEvent: false });
        }
      });
    };

    const applyGrossWeightValidation = () => {
  const ctrl = cargoForm.get('GrossWeight');
  if (!ctrl) return;

  ctrl.setValidators([
    Validators.required,
    this.weightValidator()
  ]);

  ctrl.updateValueAndValidity({ emitEvent: false });
};


    const FCLFields = ['CargoType','ContainerType', 'PackageType', 'PackageQty', 'ShipmentTerms', 'GrossWeight', 'cbm', 'ProductName'];
    const LCLFields = ['CargoType','PackageType', 'PackageQty', 'WeightUnitSid', 'cbm', 'volumetric' ,'GrossWeight', 'ChargeableWeight', 'ShipmentTerms', 'ProductName'];
    const AIRFields = ['CargoType', 'PackageType','ChargeableWeight','WeightUnitSid','PackageQty','cbm', 'volumetric','GrossWeight', 'ChargeableWeight', 'ProductName'];
    const ROADFields = ['CargoType', 'Qty','cbm', 'GrossWeight', 'NetWeight'];

    resetFields(['PackageType', 'Qty', 'WeightUnitSid', 'PackageQty', 'ShipmentTerms', 'cbm', 'ContainerType', 'ContainerNo', 'volumetric', 'length', 'width', 'height']);

    if (type === 'FCL') {
      setRequired(FCLFields);
    } else if (type === 'LCL') {
      setRequired(LCLFields);
    } else if (type === 'AIR') {
      setRequired(AIRFields);
    } else if (type === 'ROAD') {
      setRequired(ROADFields);
    }
    applyGrossWeightValidation();
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
    if (isCustomer) {
      const parsedContact = this.parsePhone(selectedItem.ContactNumber);
      this.rateRequestForm.patchValue({
        customerName: selectedItem.CustomerName,
        CustomerAddress: selectedItem.Address,
        Email: selectedItem.Email,
        CustomerMasterSid: selectedItem.CustomerMasterSid,
        CustomerBranchSid: selectedItem.CustomerBranchSid,
        ContactPerson: selectedItem.ContactPerson,
        ContactNumberCode: parsedContact.phoneCode,
        ContactNumber: parsedContact.phoneNumber
      });
      this.selectedCustomerName = selectedItem.CustomerName;
      // this.getCustomerBranches(selectedItem.CustomerMasterSid);
    } else {
      const parsedContact = this.parsePhone(selectedItem.phone);
      this.rateRequestForm.patchValue({
        customerName: selectedItem.preCustomerName,
        CustomerAddress: selectedItem.preCustomerAddress1,
        Email: selectedItem.email,
        CustomerBranchSid: null,
        ContactPerson: selectedItem.contactPerson,
        ContactNumberCode: parsedContact.phoneCode,
        ContactNumber: parsedContact.phoneNumber,
      });
      this.selectedCustomerName = selectedItem.preCustomerName;
      this.patchSalespersonOfLead(selectedItem);
      this.cusBranchList = [];
    }
  }

  onCustomerChange(event: any): void {
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
    if (isCustomer) {
      const selectedCustomer = event;
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
    const customerSid = Number(CustomerMasterSid);
    if (!Number.isFinite(customerSid) || customerSid <= 0) {
      this.cusBranchList = [];
      return;
    }

    this.leadService.getCustomerBranchByCustomerId(customerSid).subscribe(
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
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const payload = {
      CompanyMasterSid: CompanyMasterSid,
      BranchMasterSid: BranchMasterSid,
      EnquiryHeaderSid: id
    }
    this.leadService.getEnquiryById(payload).subscribe((resp: any) => {
      if (resp.status) {
        this.enquiryData = resp.data;
        this.patchValues(resp.data);
        this.rateRequestData = resp.data;
        this.resetUnsavedState();
        if (this.isEditMode && resp.data.status === 'S') {
        this.rateRequestForm.disable();
        this.enquiryOtherForm.disable();
      }
      } else {
        this.appSettingService.showError('Access denied.');
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return '';

    const d = new Date(date);

    // Use UTC values to avoid timezone shift
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();

    return `${day}-${month}-${year}`;
  }


  patchValues(response: any) {
    this.isPatching = true;
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
    const selectedDept = this.departments.find(dept => dept.DepartmentMasterSid === response.DepartmentMasterSid);
    this.selectedDepartment = selectedDept?.departmentName || response.ShipmentType || '';
    this.selectedFCLLCL = this.resolveSelectedSegment(selectedDept);
    this.selectedCargoMode = this.resolveLoadedCargoMode(selectedDept, response);

    // Refresh action menu items based on loaded segment
    this.initializeActionMenu();

    // Patch header fields
    this.quotationEnquiryNumber = response.EnquiryNumber;
    this.quotationCustomerId = response.CustomerMasterSid;
    this.quotationDepartmentId = response.DepartmentMasterSid;
    if (response.LeadOrCustomer === 'C' && Number(response.CustomerMasterSid) > 0) {
      this.getCustomerBranches(Number(response.CustomerMasterSid));
    } else {
      this.cusBranchList = [];
    }
    const parsedContact = this.parsePhone(response.ContactNumber);
    this.authStateCache = response.authorizerStatus,
      this.rateRequestForm.patchValue({
        DepartmentMasterSid: response.DepartmentMasterSid,
        CustomerMasterSid: response.CustomerMasterSid,
        CustomerBranchSid: response.CustomerBranchSid,
        customerName: response.CustomerName,
        CustomerAddress: response.CustomerAddress,
        Email: response.Email,
        PreCustomerMasterSid: response.PreCustomerMasterSid,
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
        ContactPerson: response.ContactPerson,
        ContactNumberCode: parsedContact.phoneCode,
        ContactNumber: parsedContact.phoneNumber
      });
    const disableFields = ['enquiryNo', 'LeadOrCustomer', 'Segment'];
    disableFields.forEach(f => disableFormControl(this.rateRequestForm, f));

    const routesArray = this.rateRequestForm.get('routes') as FormArray;
    routesArray.clear();
    this.routePortFilterPayloadKeys = [];
    this.filteredPOOPorts = [];
    this.filteredPOLPorts = [];
    this.filteredPODPorts = [];
    this.filteredFDCPorts = [];

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
            cbm: [cargo.Volume ?? ''],
            ContainerType: [cargo.ContainerType || null],
            ContainerNo: [cargo.ContainerNo || ''],
            ChargeableWeight: [cargo.ChargeableWeight || null],
            length: [cargo.length || null],
            width: [cargo.width || null],
            height: [cargo.height || null],
            volumetric: [cargo.Volumetric || '']
          })
        );
      });

      // Apply validators to each cargo row based on the resolved cargo mode.
      cargoArray.controls.forEach((cargoForm) => {
        this.updateCargoValidators(cargoForm as FormGroup, this.selectedCargoMode);
      });
      routesArray.push(routeFormGroup);
      const addedRouteIndex = routesArray.length - 1;
      this.lockSavedRouteControls(routeFormGroup);
      this.subscribeToRouteChanges(routeFormGroup, addedRouteIndex);
      this.subscribeToRouteAutoFill(routeFormGroup);
      const addedCargoArray = this.routeCargo(addedRouteIndex);
      addedCargoArray.controls.forEach((_, cargoIndex: number) => {
        this.setupCargoCalculations(cargoIndex, addedRouteIndex);
      });
      routeFormGroup.updateValueAndValidity();
      this.onRouteChange(addedRouteIndex);
    });



    this.isEnquiryAuthActionTaken = response.authorizerStatus === "Approved" || response.authorizerStatus === "Rejected";
    this.isEnquiryApproved = response.authorizerStatus === "Approved";
    if (this.isEnquiryApproved) {
      // Filter route that is approved
    }
    this.quotationCreatedAgainstThisEnquiry = response.QuoteHeaderSid !== null;
    if (this.quotationCreatedAgainstThisEnquiry) {
      this.rateRequestForm.disable();
      this.enquiryOtherForm.disable();
    } else {
      this.rateRequestForm.enable();
      this.enquiryOtherForm.enable();
      disableFormControl(this.rateRequestForm, 'enquiryNo');
      disableFormControl(this.rateRequestForm, 'LeadOrCustomer');
    }
    this.isPatching = false;
  }

  restrictDecimal(event: KeyboardEvent) {
    if (event.key === '.' || event.key === ',') {
      event.preventDefault(); // Prevents entering a decimal point or comma
    }
  }

  preventEmailSpaces(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
    }
  }

  preventEmailSpacePaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';
    if (/\s/.test(pastedText)) {
      event.preventDefault();
    }
  }

  hasInvalidCargoFields(): boolean {
  let hasInvalid = false;

  this.routes.controls.forEach((routeGroup: FormGroup) => {
    const cargoArray = routeGroup.get('cargo') as FormArray;

    cargoArray.controls.forEach((cargoForm: FormGroup) => {
      const grossWeight = cargoForm.get('GrossWeight')?.value;

      if (!grossWeight || +grossWeight <= 0) {
        cargoForm.get('GrossWeight')?.setErrors({ required: true });
        cargoForm.get('GrossWeight')?.markAsTouched();
        hasInvalid = true;
      }

      if (cargoForm.invalid) {
        cargoForm.markAllAsTouched();
        hasInvalid = true;
      }
    });
  });

  return hasInvalid;
}


  onSubmit(resolve?: (saved: boolean) => void) {
    errorLogger(this.rateRequestForm.value);
    const currentValue = this.getCurrentFormState();
    if (this.deepEqual(currentValue, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.rateRequestForm.markAsUntouched();
      this.enquiryOtherForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    if (this.hasInvalidExcept('routes', this.rateRequestForm)) {
      this.rateRequestForm.markAllAsTouched();
      this.rateRequestForm.updateValueAndValidity();
      const errorMessage = this.getValidationErrorMessage();
       const timeout = errorMessage.includes('\n') ? 10000 : 5000;
    this.toastr.error(errorMessage, 'Validation Failed', { 
      timeOut: timeout,
      closeButton: true,
      enableHtml: true,
      positionClass: 'toast-top-right'
    });
      return;
    }
     let routeInvalid: boolean = false;
  const routeErrors: string[] = [];
    this.routes.controls.forEach((routeGroup: FormGroup, index: number) => {
      routeGroup.markAllAsTouched();
      if (this.hasInvalidExcept('cargo', routeGroup)) {
      routeInvalid = true;
      
      // Check specific route fields
      if (routeGroup.get('POL')?.invalid) {
        routeErrors.push(`Route ${index + 1}: Port of Loading (POL) is required`);
      }
      if (routeGroup.get('POD')?.invalid) {
        routeErrors.push(`Route ${index + 1}: Port of Discharge (POD) is required`);
      }
    }
  });
    if (routeInvalid) {
    const errorMessage = routeErrors.length > 0 
      ? `Route validation failed:\n• ${routeErrors.join('\n• ')}`
      : 'Please complete all required route details.';
      
    this.toastr.error(errorMessage, 'Route Validation Failed', {
      timeOut: 8000,
      closeButton: true,
      enableHtml: true,
      positionClass: 'toast-top-right'
    });
    this.selectedTab = 'Route Details';
    return;
  }
     if (this.hasInvalidCargoFields()) {
    const errorMessage = this.getValidationErrorMessage();
    this.toastr.error(errorMessage, 'Cargo Validation Failed', {
      timeOut: 10000,
      closeButton: true,
      enableHtml: true,
      positionClass: 'toast-top-right'
    });
    this.selectedTab = 'Route Details';
    return;
  }

    this.btnDisable = true;
    this.isSaving = true;
    const formRawValue = this.rateRequestForm.getRawValue();
    const otherFormValue = this.enquiryOtherForm.getRawValue();
    const isCustomerMode = formRawValue.LeadOrCustomer === true || String(formRawValue.LeadOrCustomer).toUpperCase() === 'C';
    const preCustomerMasterSid = formRawValue.PreCustomerMasterSid || this.enquiryData?.PreCustomerMasterSid || null;
    const leadFromList = this.leadList.find(
      (lead: any) => Number(lead?.PreCustomerMasterSid) === Number(preCustomerMasterSid)
    );
    const resolvedLeadEmail = !isCustomerMode
      ? (
        formRawValue.Email ||
        this.rateRequestForm.get('Email')?.value ||
        this.enquiryData?.Email ||
        this.enquiryData?.email ||
        leadFromList?.email ||
        leadFromList?.Email ||
        ''
      )
      : '';
    const resolvedToEmail = isCustomerMode
      ? (this.enquiryData?.Email || this.rateRequestForm.get('Email')?.value || '')
      : resolvedLeadEmail;
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;

    
    const menuId = this.sidebarService.syncMenuIdBeforeSubmit("Enquiry") || this.MenuMasterSid;

    const userEmail = this.userData['userEmail'];
    if (this.EnquiryHeaderSid) {
      const updatePayload = {
        ...formRawValue,
        LeadOrCustomer: formRawValue.LeadOrCustomer ? 'C' : 'L',
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        enquiryOther: otherFormValue,
        ClearanceBy: formRawValue.ClearanceBy,
        TransportBy: formRawValue.TransportBy,
        updatedBy: userEmail,
        ContactPerson: formRawValue.ContactPerson,
        ContactNumber: this.withDialCode(
          formRawValue.ContactNumber,
          formRawValue.ContactNumberCode
        ),
        MenuMasterSid: menuId,
        approvalStatusChange: this.authStateCache !== formRawValue?.authorizerStatus,
        CustomerMasterSid: this.rateRequestForm.get('CustomerMasterSid')?.value,
        Segment: this.selectedDepartment,
        EnquiryHeaderSid: this.EnquiryHeaderSid,
        status:
          this.rateRequestForm.get('status')?.value === 'Active' ? 'A' : 'S',
        routes: formRawValue.routes.map((route) => ({
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
            this.rateRequestForm.markAsPristine();
            this.rateRequestForm.markAsUntouched();
            this.enquiryOtherForm.markAsPristine();
            this.enquiryOtherForm.markAsUntouched();
            this.resetUnsavedState();
            this.appSettingService.showSuccess('Enquiry Updated Successfully');
            this.btnDisable = false;
            this.isSaving = false;
            if (resolve) resolve(true);
            this.loadEnquiry(this.EnquiryHeaderSid);
            this.emailTriggerService.triggerEmails({
              companyId: this.currentCompany?.CompanyMasterSid,
              branchId: this.currentBranch?.BranchMasterSid,
              menuMasterSid: this.MenuMasterSid,
              action: 'UPDATE',
              context: {
                leadOrCustomer: isCustomerMode ? 'C' : 'L',
                leadEmail: resolvedLeadEmail,
                menuMasterSid: this.MenuMasterSid,
                EnquiryNo: this.enquiryData?.EnquiryNumber,
                date: this.enquiryData?.EnquiryDate ? this.datePipe.transform(this.enquiryData.EnquiryDate) : '',
                POO: getFormattedPort(this.ports, this.enquiryData?.enquiryRoute?.[0]?.PORSid),
                POL: getFormattedPort(this.ports, this.enquiryData?.enquiryRoute?.[0]?.POLSid),
                POD: getFormattedPort(this.ports, this.enquiryData?.enquiryRoute?.[0]?.PODSid),
                FPD: getFormattedPort(this.ports, this.enquiryData?.enquiryRoute?.[0]?.FDPSid),
                customerName: this.enquiryData?.CustomerName,
                userName: this.userData?.userName,
                customerMasterSid: this.enquiryData?.CustomerMasterSid || null,
                // {{toEmail}} resolves from CustomerBrEmail (Organization -> Email tab) via enrichContext;
                // {{menumail}} is the email entered on the enquiry record itself.
                toEmail: '',
                menumail: resolvedToEmail,
                customerBranchSid: this.enquiryData?.CustomerBranchSid || null
              }
            });
          } else {
            this.appSettingService.showError('Enquiry Update Failed');
            this.isSaving = false;
            if (resolve) resolve(false);
          }
        });
    } else {
      const createPayload = {
        ...formRawValue,
        enquiryOther: otherFormValue,
        LeadOrCustomer: formRawValue.LeadOrCustomer ? 'C' : 'L',
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        createdBy: userEmail,
        ClearanceBy: formRawValue.ClearanceBy,
        TransportBy: formRawValue.TransportBy,
        DepartmentMasterSid: this.rateRequestForm.get('DepartmentMasterSid')
          ?.value,
        MenuMasterSid: this.MenuMasterSid,
        CustomerMasterSid: this.rateRequestForm.get('CustomerMasterSid')?.value,
        CustomerName: this.selectedCustomerName,
        Segment: this.selectedDepartment,
        ContactPerson: formRawValue.ContactPerson,
        ContactNumber: this.withDialCode(
          formRawValue.ContactNumber,
          formRawValue.ContactNumberCode
        ),
      };
      if (this.authRelatedDetails.totalNumberOfAuthorizers === 0) {
        createPayload.authorizerStatus = AuthorizationStatus.Approved;
      }
      this.leadService.createEnquiry(createPayload).subscribe((resp) => {
        if (resp.status) {
          this.rateRequestForm.markAsPristine();
          this.rateRequestForm.markAsUntouched();
          this.enquiryOtherForm.markAsPristine();
          this.enquiryOtherForm.markAsUntouched();
          this.resetUnsavedState();
          this.appSettingService.showSuccess('Enquiry Created Successfully');
          this.btnDisable = false;
          this.isSaving = false;
          if (resolve) resolve(true);
          this.EnquiryHeaderSid = resp?.data?.enquiryHeader?.EnquiryHeaderSid;
          if (this.EnquiryHeaderSid) {
            this.router.navigate(['crm/enquiry/entry', this.EnquiryHeaderSid]);
          }
          this.emailTriggerService.triggerEmails({
            companyId: this.currentCompany?.CompanyMasterSid,
            branchId: this.currentBranch?.BranchMasterSid,
            menuMasterSid: this.MenuMasterSid,
            action: 'CREATE',
            context: {
              leadOrCustomer: isCustomerMode ? 'C' : 'L',
              leadEmail: resolvedLeadEmail,
              menuMasterSid: this.MenuMasterSid,
              EnquiryNo: resp?.data?.enquiryHeader?.EnquiryNumber,
              date: new Date().toLocaleDateString(),
              POO: getFormattedPort(this.ports, this.routes?.at(0)?.get('POO')?.value),
              POL: getFormattedPort(this.ports, this.routes?.at(0)?.get('POL')?.value),
              POD: getFormattedPort(this.ports, this.routes?.at(0)?.get('POD')?.value),
              FPD: getFormattedPort(this.ports, this.routes?.at(0)?.get('FDC')?.value),
              customerName: this.rateRequestForm.get('customerName')?.value,
              userName: this.userData?.userName,
              customerMasterSid: this.rateRequestForm.get('CustomerMasterSid')?.value || null,
              // {{toEmail}} resolves from CustomerBrEmail (Organization -> Email tab) via enrichContext;
              // {{menumail}} is the email entered on the enquiry record itself.
              toEmail: '',
              menumail: resolvedToEmail,
              customerBranchSid: this.rateRequestForm.get('CustomerBranchSid')?.value || null
            }
          });
        } else {
          this.appSettingService.showError('Enquiry Creation Failed');
          this.isSaving = false;
          if (resolve) resolve(false);
        }
      });
    }
    this.btnDisable = false;
  }

  private subscribeToFormChanges(): void {
    this.rateRequestForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => this.updateDirtyState());

    this.enquiryOtherForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => this.updateDirtyState());

    this.resetUnsavedState();
  }

  private updateDirtyState(): void {
    if (this.isPatching || this.isSaving || !this.initialFormValue) {
      return;
    }
    this.isDirty = !this.deepEqual(this.initialFormValue, this.getCurrentFormState());
  }

  private resetUnsavedState(): void {
    this.initialFormValue = this.getCurrentFormState();
    this.isDirty = false;
  }

  private getCurrentFormState(): any {
    return {
      rateRequestForm: this.rateRequestForm?.getRawValue(),
      enquiryOtherForm: this.enquiryOtherForm?.getRawValue(),
    };
  }

  private normalizeValue(value: any): any {

  // Treat undefined/null/empty string as 0
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return 0;
  }

  // Normalize Date
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  // Convert numeric strings
  if (typeof value === 'string' && !isNaN(+value)) {
    return Number(value);
  }

  // Normalize numbers
  if (typeof value === 'number') {
    return Number(value.toFixed(6));
  }

  // Normalize arrays
  if (Array.isArray(value)) {
    return value.map(v => this.normalizeValue(v));
  }

  // Normalize objects
  if (typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = this.normalizeValue(value[key]);
        return acc;
      }, {});
  }

  return value;
}

  private deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
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
      authorizerStatus: 'Pending',
      ContactNumberCode: DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData)
    });

    // Clear and re-create routes (preserve lookups like ports)
    const routesArray = this.rateRequestForm.get('routes') as FormArray;
    routesArray.clear();
    this.routePortFilterPayloadKeys = [];
    this.filteredPOOPorts = [];
    this.filteredPOLPorts = [];
    this.filteredPODPorts = [];
    this.filteredFDCPorts = [];
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
    this.selectedCargoMode = 'LCL';
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


  async sendManualMail(): Promise<void> {
    const leadCustomerValue = this.rateRequestForm.get('LeadOrCustomer')?.value;
    const isCustomer = leadCustomerValue === true || String(leadCustomerValue).toUpperCase() === 'C';
    const preCustomerMasterSid =
      this.rateRequestForm.get('PreCustomerMasterSid')?.value ||
      this.enquiryData?.PreCustomerMasterSid ||
      null;
    const leadFromList = this.leadList.find(
      lead => Number(lead?.PreCustomerMasterSid) === Number(preCustomerMasterSid)
    );
    const resolvedLeadEmail = !isCustomer
      ? (
        this.rateRequestForm.get('Email')?.value ||
        this.enquiryData?.Email ||
        this.enquiryData?.email ||
        leadFromList?.email ||
        leadFromList?.Email ||
        ''
      )
      : '';
    const resolvedToEmail = isCustomer
      ? (this.enquiryData?.Email || this.rateRequestForm.get('Email')?.value || '')
      : resolvedLeadEmail;
    const pdfBlob = await this.generatePDFBlob();
    let attachmentFile: File | undefined;
    if (pdfBlob) {
      attachmentFile = new File([pdfBlob], (this.enquiryData?.EnquiryNumber || 'Enquiry') + '.pdf', { type: 'application/pdf' });
    }
    const departmentName =
        this.departments.find(dept => Number(dept.DepartmentMasterSid) === Number(this.enquiryData?.DepartmentMasterSid))?.departmentName ||
        this.selectedDepartment ||"";
      this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid: this.MenuMasterSid,
      action: 'UPDATE',
      attachmentFile,
      context: {
        requireToEmail: !isCustomer,
        allowManualEmailEntry: isCustomer,
        menuMasterSid: this.MenuMasterSid,
        leadOrCustomer: isCustomer ? 'C' : 'L',
        leadEmail: resolvedLeadEmail,
        preCustomerMasterSid,
        EnquiryNo: this.enquiryData?.EnquiryNumber,
        date: this.enquiryData?.EnquiryDate ? this.datePipe.transform(this.enquiryData.EnquiryDate) : '',
        DepartmentName: departmentName,
        POO: getFormattedPort(this.ports, this.enquiryData?.enquiryRoute?.[0]?.PORSid),
        POL: getFormattedPort(this.ports, this.enquiryData?.enquiryRoute?.[0]?.POLSid),
        POD: getFormattedPort(this.ports, this.enquiryData?.enquiryRoute?.[0]?.PODSid),
        FPD: getFormattedPort(this.ports, this.enquiryData?.enquiryRoute?.[0]?.FDPSid),
        customerName: this.enquiryData?.CustomerName,
        userName: this.userData?.userName,
        customerMasterSid: this.enquiryData?.CustomerMasterSid || null,
        // {{toEmail}} resolves from CustomerBrEmail (Organization -> Email tab) via enrichContext;
        // {{menumail}} is the email entered on the enquiry record itself.
        toEmail: '',
        menumail: resolvedToEmail,
        customerBranchSid: this.enquiryData?.CustomerBranchSid || null
      }
    });
    const payload = {
        tableName: 'EnquiryHeader',
        recordId: String(this.rateRequestData?.EnquiryHeaderSid),
        operation: 'EMAIL',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'Email Send'
        },
        newVal: {
          Email: 'Mail Send'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
  }

  goBack() {
    this.stopVoiceGuide();
    this.router.navigate(['/crm/enquiry/list']);
  }

  navigateQuotation() {
    const response = this.rateRequestData;
    const polList = (response.enquiryRoute || []).map(route => route.POLSid);
    const podList = (response.enquiryRoute || []).map(route => route.PODSid);

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

    const routeDetails = (response.enquiryRoute || []).map(route => {
      const cargoList = (route.enquiryCargo || []).map(cargo => {
        const containerTypeCode = (this.containerTypes || []).find(
          con => con.ContainerName === cargo.ContainerType
        )?.ContainerCode || null;
        let packageTypeId = null;

        const packageType = this.packageTypes.find(uom => uom.UOMCode === cargo.PackageType);
        if (packageType) {
          packageTypeId = packageType?.UOMMasterSid;
        }

        return {
          ...cargo,
          EnquiryRouteSid: route.EnquiryRouteSid,
          PORSid: route.PORSid,
          POLSid: route.POLSid,
          PODSid: route.PODSid,
          FPODSid: route.FDPSid,
          ContainerType: containerTypeCode || cargo.ContainerType || null,
          Qty: cargo.PackageQty,
          Volume: cargo.Volume ?? cargo.CBM ?? cargo.cbm ?? null,
          Volumetric: cargo.Volumetric ?? cargo.volumetric ?? null,
          Length: cargo.Length ?? cargo.length ?? null,
          Width: cargo.Width ?? cargo.width ?? null,
          Height: cargo.Height ?? cargo.height ?? null,
          PackageTypeId: packageTypeId,
          ServiceLevel: response.IncoTerms,
        };
      });

      const primaryCargo = cargoList[0] || {};

      return {
        EnquiryRouteSid: route.EnquiryRouteSid,
        PORSid: route.PORSid,
        POLSid: route.POLSid,
        PODSid: route.PODSid,
        FDPSid: route.FDPSid,
        FPODSid: route.FDPSid,
        DepartmentMasterSid: route.DepartmentMasterSid ?? response.DepartmentMasterSid,
        ShipmentTerms: primaryCargo.ShipmentTerms || null,
        CargoType: primaryCargo.CargoType || null,
        GrossWeight: primaryCargo.GrossWeight || null,
        NetWeight: primaryCargo.NetWeight || null,
        Volume: primaryCargo.Volume || null,
        ContainerType: primaryCargo.ContainerType || null,
        Qty: primaryCargo.Qty || primaryCargo.PackageQty || 1,
        ChargeableWeight: primaryCargo.ChargeableWeight || null,
        PackageQty: primaryCargo.PackageQty || null,
        PackageType: primaryCargo.PackageType || null,
        PackageTypeId: primaryCargo.PackageTypeId || null,
        ServiceLevel: response.IncoTerms,
        ProductName: primaryCargo.ProductName || null,
        length: primaryCargo.Length || primaryCargo.length || 0,
        width: primaryCargo.Width || primaryCargo.width || 0,
        height: primaryCargo.Height || primaryCargo.height || 0,
        Volumetric: primaryCargo.Volumetric || null,
        quoteCargo: cargoList,
      };
    });

    const enqData = {
      EnquirySid: response?.EnquiryHeaderSid,
      EnquiryNumber: response.EnquiryNumber,
      CustomerAddress: response.CustomerAddress,
      CustomerName: response.CustomerName,
      Email: response.Email,
      CustomerRef: response.CustomerRef,
      TransportBy: response.TransportBy,
      ClearanceBy: response.ClearanceBy,
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
      Remarks: response.Remarks,
      cargoTypeList: cargoTypeList,
      ShipmentType: selectedFCLLCL,
      rateRequest: true,
      quoteRoutes: routeDetails,
    };
    this.leadService.clearQuotationData();
    this.leadService.setQuotationData(enqData);
    this.router.navigate(['crm/quotation/entry']);
  }

  updateFilteredPorts(index: number, selectedValue: any, type: 'POL' | 'POD'): void {
    this.refreshRoutePortFilters(index);
  }

  onRouteChange(routeIndex: number): void {
    this.refreshRoutePortFilters(routeIndex);
  }

  onRoutePortSelected(routeIndex: number, controlName: 'POO' | 'POL' | 'POD' | 'FDC', selectedPort: any): void {
    const routeForm = this.routes.at(routeIndex) as FormGroup;
    if (!routeForm) {
      return;
    }

    const selectedPortSid = selectedPort?.PortMasterSid ?? selectedPort ?? null;
    routeForm.get(controlName)?.setValue(selectedPortSid, { emitEvent: false });

    if (controlName === 'POD') {
      const fdcControl = routeForm.get('FDC');
      if (!fdcControl?.value) {
        fdcControl?.setValue(selectedPortSid, { emitEvent: false });
      }
    }

    this.refreshRoutePortFilters(routeIndex);
  }

  private refreshRoutePortFilters(routeIndex: number): void {
    const routeForm = this.routes.at(routeIndex) as FormGroup;
    if (!routeForm) {
      return;
    }

    const departmentSid = this.rateRequestForm.get('DepartmentMasterSid')?.value;
    if (!departmentSid) {
      this.routePortFilterPayloadKeys[routeIndex] = '';
      this.applyRoutePortFilterLists(routeIndex, {
        filteredPorts: [],
        filteredPOOPorts: [],
        filteredPOLPorts: [],
        filteredPODPorts: [],
        filteredFDCPorts: []
      });
      this.syncRouteValidation(routeForm);
      return;
    }

    const department = this.departments.find(
      dept => Number(dept.DepartmentMasterSid) === Number(departmentSid)
    );

    const payload = {
      DepartmentMasterSid: departmentSid,
      ShipmentType: this.getShipmentDirection(department),
      LoginCountryMasterSid: this.getLoginCountryMasterSid(),
      PortFieldType: 'ALL',
      SelectedPOO: routeForm.get('POO')?.value,
      SelectedPOL: routeForm.get('POL')?.value,
      SelectedPOD: routeForm.get('POD')?.value,
      SelectedFPOD: routeForm.get('FDC')?.value
    };

    const payloadKey = JSON.stringify(payload);
    if (payloadKey === this.routePortFilterPayloadKeys[routeIndex]) {
      return;
    }
    this.routePortFilterPayloadKeys[routeIndex] = payloadKey;
    this.applyRoutePortFilterLists(routeIndex, {
      filteredPorts: this.filteredPorts || [],
      filteredPOOPorts: this.filteredPOOPorts[routeIndex] || [],
      filteredPOLPorts: this.filteredPOLPorts[routeIndex] || [],
      filteredPODPorts: this.filteredPODPorts[routeIndex] || [],
      filteredFDCPorts: this.filteredFDCPorts[routeIndex] || []
    });

    this.operationService.getFilteredPorts(payload).subscribe({
      next: (resp: any) => {
        const data = resp?.data || {};
        this.applyRoutePortFilterLists(routeIndex, {
          filteredPorts: [
            ...(data.POO || []),
            ...(data.POL || []),
            ...(data.POD || []),
            ...(data.FPOD || [])
          ],
          filteredPOOPorts: data.POO || [],
          filteredPOLPorts: data.POL || [],
          filteredPODPorts: data.POD || [],
          filteredFDCPorts: data.FPOD || []
        });
        this.syncRouteValidation(routeForm);
      },
      error: () => {
        this.routePortFilterPayloadKeys[routeIndex] = '';
      }
    });
  }

  private lockSavedRouteControls(routeFormGroup: FormGroup): void {
    const enquiryRouteSid = Number(routeFormGroup.get('EnquiryRouteSid')?.value) || 0;
    if (!enquiryRouteSid) {
      return;
    }

    routeFormGroup.get('POL')?.disable({ emitEvent: false });
    routeFormGroup.get('POD')?.disable({ emitEvent: false });
  }

  private applyRoutePortFilterLists(routeIndex: number, filteredLists: any): void {
    const routeForm = this.routes.at(routeIndex) as FormGroup;
    const filteredPOOPorts = this.withSelectedPort(filteredLists.filteredPOOPorts, routeForm?.get('POO')?.value);
    const filteredPOLPorts = this.withSelectedPort(filteredLists.filteredPOLPorts, routeForm?.get('POL')?.value);
    const filteredPODPorts = this.withSelectedPort(filteredLists.filteredPODPorts, routeForm?.get('POD')?.value);
    const filteredFDCPorts = this.withSelectedPort(filteredLists.filteredFDCPorts, routeForm?.get('FDC')?.value);

    this.filteredPorts = this.mergeUniquePorts([
      ...(filteredLists.filteredPorts || []),
      ...filteredPOOPorts,
      ...filteredPOLPorts,
      ...filteredPODPorts,
      ...filteredFDCPorts
    ]);
    this.filteredPOOPorts[routeIndex] = filteredPOOPorts;
    this.filteredPOLPorts[routeIndex] = filteredPOLPorts;
    this.filteredPODPorts[routeIndex] = filteredPODPorts;
    this.filteredFDCPorts[routeIndex] = filteredFDCPorts;
  }

  private withSelectedPort(items: any[] = [], selectedPortSid: any): any[] {
    const list = Array.isArray(items) ? items : [];
    const selectedPort = this.ports.find(port => this.isSameSid(port?.PortMasterSid, selectedPortSid));

    if (!selectedPort || list.some(port => this.isSameSid(port?.PortMasterSid, selectedPortSid))) {
      return list;
    }

    return [selectedPort, ...list];
  }

  private mergeUniquePorts(ports: any[]): any[] {
    const seen = new Set<number | string>();

    return (ports || []).filter(port => {
      const key = this.toNumericValue(port?.PortMasterSid) ?? String(port?.PortMasterSid ?? '');
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private syncRouteValidation(routeForm: FormGroup): void {
    const selectedPOL = routeForm.get('POL')?.value;
    const selectedPOD = routeForm.get('POD')?.value;

    if (selectedPOL && selectedPOD && this.isSameSid(selectedPOL, selectedPOD)) {
      this.setControlError(routeForm.get('POL'), 'samePort', true);
      this.setControlError(routeForm.get('POD'), 'samePort', true);
    } else {
      this.clearControlError(routeForm.get('POL'), 'samePort');
      this.clearControlError(routeForm.get('POD'), 'samePort');
    }
  }

  private getShipmentDirection(department?: any): 'EXPORT' | 'IMPORT' | '' {
    const departmentDirection = this.normalizePortText(department?.ExportImport);
    if (departmentDirection === 'EXPORT' || departmentDirection === 'IMPORT') {
      return departmentDirection as 'EXPORT' | 'IMPORT';
    }

    return '';
  }

  private getLoginCountryMasterSid(): number | null {
    return this.toNumericValue(
      this.currentBranch?.CountryMasterSid ??
      this.currentBranch?.branchMaster?.CountryMasterSid ??
      this.currentCompany?.CountryMasterSid
    );
  }

  private normalizePortText(value: any): string {
    return String(value ?? '').trim().toUpperCase();
  }

  private resolveSelectedSegment(department: any): string {
    const departmentType = this.normalizePortText(department?.departmentType);
    if (departmentType === 'SEA') {
      return this.normalizePortText(department?.FCLLCL) || 'LCL';
    }

    return departmentType || 'LCL';
  }

  private resolveCargoMode(department: any): 'FCL' | 'LCL' | 'AIR' | 'ROAD' {
    const departmentType = this.normalizePortText(department?.departmentType);

    // Sea: keep existing behavior (department.FCLLCL drives the cargo mode)
    if (departmentType === 'SEA') {
      const seaMode = this.normalizePortText(department?.FCLLCL) || 'LCL';
      return seaMode === 'FCL' ? 'FCL' : 'LCL';
    }

    // Air: always LCL-like fields; ignore FCL/LCL selection.
    if (departmentType === 'AIR') {
      return 'AIR';
    }

    // Road/Transport: use department.FCLLCL to decide which cargo fields to show.
    // Others behaves like FCL per requirement.
    if (departmentType === 'ROAD' || departmentType === 'TRANSPORT') {
      const roadMode = this.normalizePortText(department?.FCLLCL) || 'FCL';
      return roadMode === 'LCL' ? 'LCL' : 'FCL';
    }

    // Default: use LCL fields.
    return 'LCL';
  }

  private resolveLoadedCargoMode(department: any, response: any): 'FCL' | 'LCL' | 'AIR' | 'ROAD' {
    const shipmentType = this.normalizePortText(response?.ShipmentType);

    if (shipmentType.includes('FCL')) {
      return 'FCL';
    }

    if (shipmentType.includes('LCL')) {
      return 'LCL';
    }

    if (shipmentType.includes('AIR')) {
      return 'AIR';
    }

    // Older data can have ShipmentType as ROAD/TRANSPORT only. In that case,
    // drive cargo mode using department.FCLLCL (Others -> FCL).
    if (shipmentType.includes('ROAD') || shipmentType.includes('TRANSPORT')) {
      return this.resolveCargoMode(department);
    }

    return this.resolveCargoMode(department);
  }

  private toNumericValue(value: any): number | null {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  }

  private isSameSid(left: any, right: any): boolean {
    const leftNumeric = this.toNumericValue(left);
    const rightNumeric = this.toNumericValue(right);

    if (leftNumeric && rightNumeric) {
      return leftNumeric === rightNumeric;
    }

    return String(left ?? '').trim() !== '' && String(left ?? '').trim() === String(right ?? '').trim();
  }

  private setControlError(control: AbstractControl | null, errorKey: string, value: any): void {
    if (!control) {
      return;
    }

    control.setErrors({
      ...(control.errors || {}),
      [errorKey]: value
    });
  }

  private clearControlError(control: AbstractControl | null, errorKey: string): void {
    if (!control?.errors?.[errorKey]) {
      return;
    }

    const { [errorKey]: _, ...remainingErrors } = control.errors || {};
    control.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
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

  private getPortCodeBySid(portSid: number | null | undefined): string | null {
    if (portSid === null || portSid === undefined) return null;
    const port = this.ports.find(p => p.PortMasterSid === portSid);
    return port?.PortCode ?? null;
  }

  openTandC(routeIndex: number = 0) {
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    // Use the specific route based on routeIndex
    const route = this.enquiryData?.enquiryRoute?.[routeIndex] || null;
    const departmentSid = this.enquiryData?.DepartmentMasterSid;
    const pol = this.getPortCodeBySid(route?.POLSid);
    const pod = this.getPortCodeBySid(route?.PODSid);
    const carrier = null;
    const transactionPayload = {
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    MenuMasterSid: this.currentMenuId,
    DocumentSid: this.enquiryData?.enquiryRoute?.[routeIndex]?.EnquiryRouteSid
  };
    const payload = {
      MenuMasterSid: this.currentMenuId,
      DepartmentMasterSid: departmentSid,
      POL: pol,
      POD: pod,
      Carrier: carrier,
      DocumentSid: this.enquiryData?.enquiryRoute?.[routeIndex]?.EnquiryRouteSid
    };

    const getTermText = (item: any): string =>
    (item?.Terms || item?.TandC || '').trim().toLowerCase();

  const isSameTerm = (a: any, b: any): boolean =>
    (
      a?.TandCTransactionSid &&
      b?.TandCTransactionSid &&
      a.TandCTransactionSid === b.TandCTransactionSid
    ) ||
    (
      getTermText(a) === getTermText(b) &&
      (a?.DocumentSid ?? this.enquiryData?.enquiryRoute?.[routeIndex]?.EnquiryRouteSid ?? null) ===
      (b?.DocumentSid ?? this.enquiryData?.enquiryRoute?.[routeIndex]?.EnquiryRouteSid ?? null)
    );

    const openModal = (terms: any[]) => {
      const modalRef = this.ngbModal.open(TermsAndConditionsComponent, {
          size: 'lg',
          backdrop: 'static',
          centered: true,
        });
  
        modalRef.componentInstance.terms = terms || [];
        modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
        modalRef.componentInstance.DocumentSid = this.enquiryData?.enquiryRoute?.[routeIndex]?.EnquiryRouteSid;
        modalRef.componentInstance.DepartmentMasterSid = departmentSid;
        modalRef.componentInstance.POL = pol;
        modalRef.componentInstance.POD = pod;
        modalRef.componentInstance.Carrier = carrier;
        modalRef.componentInstance.loadAllOnGet = !this.isTermsAndConditionsEnabled;
    };
if (this.isTermsAndConditionsEnabled) {
    forkJoin({
      tandc: this.masterService.getTandC(transactionPayload),
      defaults: this.masterService.getTandCByCondition(payload)
    }).subscribe(
      (resp: any) => {
        const tandcData = resp?.tandc?.status ? (resp.tandc.data || []) : [];
        const defaultData = resp?.defaults?.status ? (resp.defaults.data || []) : [];

        const combined = [...tandcData, ...defaultData].filter(
          (item: any, index: number, arr: any[]) =>
            index === arr.findIndex((x: any) => isSameTerm(x, item))
        );

        this.TandCList = combined;
        openModal(this.TandCList);
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
    return;
  }
    this.masterService.getTandC(transactionPayload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          openModal(this.TandCList);
        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
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
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
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
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: this.EnquiryHeaderSid
    }

    this.commonService.documentData.set(data)
  }


 openDocRef() {
  const modalRef = this.ngbModal.open(DocReferenceComponent, {
    size: 'lg',
    centered: true,
    backdrop: 'static'
  });

  modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
  modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
  modalRef.componentInstance.MenuMasterSid = this.MenuMasterSid;
  modalRef.componentInstance.DocumentSid = this.EnquiryHeaderSid;
}

  // private handleVoiceEnquiryData(): void {
  //   const voiceData = this.leadService.getVoiceEnquiryData();

  //   if (!voiceData || Object.keys(voiceData).length === 0) {
  //     return;
  //   }

  //   console.log('Voice enquiry data received:', voiceData);

  //   // Clear voice data after use
  //   this.leadService.clearVoiceEnquiryData();

  //   // Pre-fill form with voice data
  //   this.prefillFormWithVoiceData(voiceData);

  //   // Show notification about voice data
  //   this.appSettingsService.showSuccess('Form pre-filled with voice input data. Please review and complete any missing fields.');
  // }

  // private prefillFormWithVoiceData(voiceData: any): void {
  //   // Set basic form values
  //   if (voiceData.CustomerMasterSid) {
  //     this.rateRequestForm.patchValue({
  //       CustomerMasterSid: voiceData.CustomerMasterSid,
  //       customerName: voiceData.customerName
  //     });
  //   }

  //   if (voiceData.DepartmentMasterSid) {
  //     this.rateRequestForm.patchValue({
  //       DepartmentMasterSid: voiceData.DepartmentMasterSid,
  //       Segment: voiceData.Segment
  //     });
  //     this.selectedFCLLCL = voiceData.Segment;
  //   }

  //   if (voiceData.shipmentDate) {
  //     this.rateRequestForm.patchValue({
  //       shipmentDate: voiceData.shipmentDate
  //     });
  //   }

  //   // Handle routes data
  //   if (voiceData.routes && voiceData.routes.length > 0) {
  //     const routesArray = this.rateRequestForm.get('routes') as FormArray;
  //     routesArray.clear();

  //     voiceData.routes.forEach((routeData: any, routeIndex: number) => {
  //       const routeFormGroup = this.fb.group({
  //         POO: [routeData.POO,],
  //         POL: [routeData.POL, Validators.required],
  //         POD: [routeData.POD, Validators.required],
  //         FDC: [routeData.FDC,],
  //         cargo: this.fb.array([])
  //       });

  //       // Handle cargo data
  //       if (routeData.cargo && routeData.cargo.length > 0) {
  //         const cargoArray = routeFormGroup.get('cargo') as FormArray;

  //         routeData.cargo.forEach((cargoData: any) => {
  //           const cargoForm = this.fb.group({
  //             CargoType: [cargoData.CargoType || 'General', Validators.required],
  //             ProductName: [cargoData.ProductName,],
  //             CargoDescription: [cargoData.CargoDescription],
  //             PackageType: [cargoData.PackageType],
  //             PackageQty: [cargoData.PackageQty],
  //             Qty: [cargoData.Qty || '1'],
  //             WeightUnitSid: [cargoData.WeightUnitSid],
  //             GrossWeight: [cargoData.GrossWeight],
  //             NetWeight: [cargoData.NetWeight],
  //             ShipmentTerms: [cargoData.ShipmentTerms],
  //             cbm: [cargoData.cbm || '1'],
  //             ContainerType: [cargoData.ContainerType],
  //             ChargeableWeight: [cargoData.ChargeableWeight],
  //             length: [cargoData.length],
  //             width: [cargoData.width],
  //             height: [cargoData.height]
  //           });

  //           this.updateCargoValidators(cargoForm, this.selectedFCLLCL);
  //           cargoArray.push(cargoForm);
  //         });
  //       } else {
  //         // Add default cargo if none provided
  //         this.addCargo(routeIndex);
  //       }

  //       routesArray.push(routeFormGroup);
  //     });
  //   }

  //   // Mark form as touched to show validation
  //   this.rateRequestForm.markAllAsTouched();

  //   // Show additional info about voice extraction
  //   if (voiceData.rawTranscription) {
  //     console.log('Original voice transcription:', voiceData.rawTranscription);
  //   }

  //   if (voiceData.confidence) {
  //     console.log('Extraction confidence scores:', voiceData.confidence);
  //   }
  // }

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
      const logo = this.pdfMakeService.getReportLogo();

      this.pdfMakeService.generateEnquiryFromApi(
        this.enquiryData || this.rateRequestData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        {
          ports: this.ports,
          departments: this.departments,
          salesmen: this.salesmanList
        },
        {
          printSettings: this.companySettings.getPrintSettings()
        }
      );

      this.appSettingService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'EnquiryHeader',
        recordId: String(this.rateRequestData?.EnquiryHeaderSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: 'PDF Downloaded'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }

  // Print Send Mail
  async sendMail() {
    const enquiry = this.enquiryData || this.rateRequestData;
    if (!enquiry) {
      this.appSettingService.showWarning('No enquiry data found.');
      return;
    }

    try {
      this.spinner.show();

      const enquiryNumber = enquiry?.EnquiryNumber || 'Enquiry';
      const customerBranchSid = Number(enquiry?.CustomerBranchSid || this.rateRequestForm?.get('CustomerBranchSid')?.value);
      const customerMasterSid = Number(enquiry?.CustomerMasterSid || this.rateRequestForm?.get('CustomerMasterSid')?.value) || null;
      const menuMasterSid = this.getCurrentEnquiryMenuMasterSid();

      // Resolve recipients from the menu's Mail Configuration (honours
      // {{toEmail}} / {{menumail}} exactly like the manual mail trigger),
      // falling back to combined branch + record emails when none is set.
      const resolvedRecipients = await this.emailTriggerService.resolveConfigToRecipientsForRecord({
        companyId: this.currentCompany?.CompanyMasterSid,
        menuMasterSid,
        recordEmail: enquiry?.Email || '',
        customerBranchSid,
        customerMasterSid
      });
      const toEmail = resolvedRecipients.toEmail;

      if (toEmail.length === 0) {
        this.spinner.hide();
        this.appSettingService.showError('No email found in enquiry or customer branch email.');
        return;
      }

      // Enquiry print mail ALWAYS attaches the PDF, regardless of the mail
      // configuration's AttachmentRequire. AttachmentRequire only controls the
      // "send without attachment" validation (fires only when set to 'Y').
      const attachmentRequired = resolvedRecipients.config?.AttachmentRequire === 'Y';
      const pdfBlob = await this.generatePDFBlob();
      if (!pdfBlob) {
        this.spinner.hide();
        this.appSettingService.showError('Error generating PDF for email.');
        return;
      }
      const pdfFileName = `Enquiry_${enquiryNumber}`.replace(/[\\/:*?"<>|]+/g, '_') + '.pdf';
      const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });

      const route = enquiry?.enquiryRoute?.[0] || {};
      const POL = route?.POLSid;
      const POD = route?.PODSid;
      const FPD = route?.FDPSid;
      const formattedPOL = getFormattedPort(this.ports, POL);
      const formattedPOD = getFormattedPort(this.ports, POD);
      const formattedFPD = getFormattedPort(this.ports, FPD);
      const departmentName =
        this.departments.find(dept => Number(dept.DepartmentMasterSid) === Number(enquiry?.DepartmentMasterSid))?.departmentName ||
        this.selectedDepartment ||
        '';
      const { subject, body } = this.emailTriggerService.buildOperationEmailContent({
        documentName: 'Enquiry',
        documentNo: enquiryNumber,
        documentDate: enquiry?.EnquiryDate ? this.datePipe.transform(enquiry.EnquiryDate) : '',
        pol: formattedPOL,
        pod: formattedPOD,
        fpd: formattedFPD,
        userName: this.userData?.userName || ''
      });

      const modalRef = this.ngbModal.open(EmailEntryComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
      });

      const ccEmail = Array.from(new Set([
        ...resolvedRecipients.ccEmail,
        ...(this.userData?.userEmail ? [this.userData.userEmail] : [])
      ].map(email => String(email || '').trim()).filter(Boolean)));

      modalRef.componentInstance.setContent = {
        EmailTo: toEmail,
        EmailCC: ccEmail,
        EmailBCC: [],
        Subject: subject,
        Mailbody: body,
        attachmentRequired,
        attachments: [pdfFile],
        context: {
          menuName: 'Enquiry',
          EnquiryNo: enquiryNumber,
          date: enquiry?.EnquiryDate ? this.datePipe.transform(enquiry.EnquiryDate) : '',
          DepartmentName: departmentName,
          POO: getFormattedPort(this.ports, route?.PORSid),
          POL: formattedPOL,
          POD: formattedPOD,
          FPD: formattedFPD,
          customerName: enquiry?.CustomerName || ''
        }
      };

      modalRef.componentInstance.dataChange.subscribe(() => {
        const payload = {
          tableName: 'EnquiryHeader',
          recordId: String(enquiry?.EnquiryHeaderSid),
          operation: 'EMAIL',
          changedBy: this.appSettingService.userSettingSource.value['userEmail'],
          changes: {
            action: 'Email Send'
          },
          newVal: {
            Email: 'Mail Send'
          }
        };

        this.operationService.createAuditLog(payload).subscribe({
          next: () => { },
          error: (err) => console.error(err)
        });
      });

      this.spinner.hide();
    } catch (error) {
      this.spinner.hide();
      console.error('Enquiry email error:', error);
      this.appSettingService.showError('Error sending enquiry email.');
    }
  }

  private getCurrentEnquiryMenuMasterSid(): number | null {
    const syncedMenuSid = this.sidebarService.syncMenuIdBeforeSubmit("Enquiry");
    const candidates = [
      this.enquiryData?.MenuMasterSid,
      this.rateRequestData?.MenuMasterSid,
      syncedMenuSid,
      this.MenuMasterSid,
      this.currentMenuId,
      Number(sessionStorage.getItem('currentMenuId'))
    ];

    for (const value of candidates) {
      const menuSid = Number(value);
      if (Number.isFinite(menuSid) && menuSid > 0) {
        return menuSid;
      }
    }

    return null;
  }

  private splitEmailForSend(value: string | string[]): string[] {
    const source = Array.isArray(value) ? value.join(',') : (value || '');
    return source
      .split(/[;,]/)
      .map(email => email.trim())
      .filter(email => !!email);
  }
  // Legacy method using html2canvas (kept for fallback)
  async downloadPDFLegacy() {
    this.showPrintLogo = false;
    this.showPdfLogo = true;

    setTimeout(async () => {
      this.spinner.show();
      try {
        const enquiryNumber = this.rateRequestData?.EnquiryNumber || 'Enquiry';

        await this.pdfService.downloadBalancedPDF(
          'printContent',
          `Enquiry_${enquiryNumber}`,
          () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
          (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
        );
      } finally {
        this.spinner.hide();
      }
    }, 50);
  }

  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const logo = this.pdfMakeService.getReportLogo();

      return await this.pdfMakeService.generateEnquiryBlobFromApi(
        this.enquiryData || this.rateRequestData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        {
          ports: this.ports,
          departments: this.departments,
          salesmen: this.salesmanList
        },
        {
          printSettings: this.companySettings.getPrintSettings()
        }
      );
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      return null;
    }
  }

  getPort(PortMasterSid: number) {
    return getFormattedPort(this.ports, PortMasterSid)
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
    let total = 0;

    this.enquiryData?.enquiryRoute?.forEach((route: any) => {
      route?.enquiryCargo?.forEach((cargo: any) => {
        total += Number(cargo.GrossWeight) || 0;
      });
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
    let total = 0;

    this.enquiryData?.enquiryRoute?.forEach((route: any) => {
      route?.enquiryCargo?.forEach((cargo: any) => {
        total += Number(cargo.Volume) || 0;
      });
    });

    return total;
  }

  calculateTotalChargeableWeight(): number {
    let total = 0;

    this.enquiryData?.enquiryRoute?.forEach((route: any) => {
      route?.enquiryCargo?.forEach((cargo: any) => {
        total += Number(cargo.ChargeableWeight) || 0;
      });
    });

    return total;
  }


  calculateTotalPackageQty(): number {
    let total = 0;

    this.enquiryData?.enquiryRoute?.forEach((route: any) => {
      route?.enquiryCargo?.forEach((cargo: any) => {
        total += Number(cargo.PackageQty) || 0;
      });
    });

    return total;
  }

  calculateRouteGrossWeight(route: any): number {
    let total = 0;
    route?.enquiryCargo?.forEach((cargo: any) => {
      total += Number(cargo?.GrossWeight) || 0;
    });
    return total;
  }

  calculateRouteCBM(route: any): number {
    let total = 0;
    route?.enquiryCargo?.forEach((cargo: any) => {
      total += Number(cargo?.Volume) || 0;
    });
    return total;
  }

  calculateRouteNetWeight(route: any): number {
    let total = 0;
    route?.enquiryCargo?.forEach((cargo: any) => {
      total += Number(cargo?.NetWeight) || 0;
    });
    return total;
  }



  openFollowup() {
    if (!this.enquiryData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.enquiryData?.EnquiryHeaderSid;
    modalRef.componentInstance.menuMasterSid = this.MenuMasterSid;
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
      this.appSettingService.showSuccess('Follow-up created successfully');
    });

    modalRef.result.then(
      (result) => console.log('Modal closed:', result),
      (dismissReason) => console.log('Modal dismissed:', dismissReason)
    );
  }



  printDiv(divId: string): void {
    this.showPrintLogo = true;
    this.showPdfLogo = false;

    setTimeout(() => {
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
    }, 50); // small timeout so Angular updates DOM
  }
  ngOnDestroy(): void {
    this.commonService.clearDocumentData()
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
    this.stopVoiceGuide();
  }

  getValidationErrorMessage(): string {
  const form = this.rateRequestForm;
  const validationIssues: string[] = [];

  // Define field labels for better readability
  const fieldLabels: { [key: string]: string } = {
    'shipmentDate': 'Expected Shipment Date',
    'Segment': 'Department',
    'CustomerMasterSid': 'Customer',
    'PreCustomerMasterSid': 'Lead',
    'Email': 'Email',
    'ContactNumber': 'Contact Number',
    'POL': 'Port of Loading (POL)',
    'POD': 'Port of Discharge (POD)',
    'CargoType': 'Cargo Type',
    'ProductName': 'Product Name',
    'PackageType': 'Package Type',
    'WeightUnitSid': 'Weight Unit',
    'GrossWeight': 'Gross Weight',
    'cbm': 'CBM',
    'ContainerType': 'Container Type',
    'ShipmentTerms': 'Shipment Terms',
    'PackageQty': 'Package Quantity',
    'ChargeableWeight': 'Chargeable Weight',
    'volumetric': 'Volumetric',
    'authorizerStatus': 'Authorizer Status'
  };

  // Check main form fields
  if (form.get('shipmentDate')?.invalid) {
    validationIssues.push(`${fieldLabels['shipmentDate']} is required`);
  }

  if (form.get('Segment')?.invalid) {
    validationIssues.push(`${fieldLabels['Segment']} is required`);
  }

  // Check Customer/Lead based on toggle
  const isCustomer = form.get('LeadOrCustomer')?.value;
  if (isCustomer && form.get('CustomerMasterSid')?.invalid) {
    validationIssues.push(`${fieldLabels['CustomerMasterSid']} is required`);
  } else if (!isCustomer && form.get('PreCustomerMasterSid')?.invalid) {
    validationIssues.push(`${fieldLabels['PreCustomerMasterSid']} is required`);
  }

  const emailControl = form.get('Email');
  const emailErrorMessage = emailControl?.errors?.['invalidEmail']?.message;
  if (emailErrorMessage) {
    validationIssues.push(`Email: ${emailErrorMessage}`);
  }

  // Check contact number format if filled
  if (form.get('ContactNumber')?.hasError('invalidPhoneNumber')) {
    validationIssues.push('Contact Number: Enter a valid contact number');
  }

  // Check authorizer status if applicable
  if (this.isAuthorizedUser && !this.isApproved) {
    if (form.get('authorizerStatus')?.invalid) {
      validationIssues.push(`${fieldLabels['authorizerStatus']} is required`);
    }
  }

  // Check routes
  const routesArray = form.get('routes') as FormArray;
  routesArray.controls.forEach((route: FormGroup, routeIndex: number) => {
    const routeLabel = `Route ${routeIndex + 1}`;

    if (route.get('POL')?.invalid) {
      validationIssues.push(`${routeLabel} - ${fieldLabels['POL']} is required`);
    }

    if (route.get('POD')?.invalid) {
      validationIssues.push(`${routeLabel} - ${fieldLabels['POD']} is required`);
    }

    // Check cargo within route
    const cargoArray = route.get('cargo') as FormArray;
    cargoArray.controls.forEach((cargo: FormGroup, cargoIndex: number) => {
      const cargoLabel = `${routeLabel} - Cargo ${cargoIndex + 1}`;

      // Check all required cargo fields based on segment type
      const requiredCargoFields = this.getRequiredCargoFields();
      
      requiredCargoFields.forEach(fieldName => {
        const control = cargo.get(fieldName);
        if (control?.invalid) {
          const label = fieldLabels[fieldName] || fieldName;
          if (control.hasError('min')) {
            validationIssues.push(`${cargoLabel} - ${label} must be at least 1`);
          } else {
            validationIssues.push(`${cargoLabel} - ${label} is required`);
          }
        }
      });

      // Special check for Gross Weight > Net Weight
      if (cargo.get('GrossWeight')?.hasError('grossNotGreater')) {
        validationIssues.push(`${cargoLabel} - Gross Weight must be greater than Net Weight`);
      }
    });
  });

  // Build error message
  if (validationIssues.length === 0) {
    return 'Please fill all required fields correctly.';
  }

  if (validationIssues.length === 1) {
    return `Please correct this field: ${validationIssues[0]}`;
  }

  return `Please correct the following fields:\n- ${validationIssues.join('\n- ')}`;
}
private getRequiredCargoFields(): string[] {
  if (this.selectedCargoMode === 'FCL') {
    return ['CargoType', 'ContainerType', 'PackageType', 'PackageQty', 'ShipmentTerms', 'GrossWeight', 'cbm', 'ProductName'];
  } else if (this.selectedCargoMode === 'LCL') {
    return ['CargoType', 'PackageType', 'PackageQty', 'WeightUnitSid', 'cbm', 'volumetric', 'GrossWeight', 'ChargeableWeight', 'ShipmentTerms', 'ProductName'];
  } else if (this.selectedCargoMode === 'AIR') {
    return ['CargoType', 'PackageType', 'ChargeableWeight', 'WeightUnitSid', 'PackageQty', 'cbm', 'volumetric', 'GrossWeight', 'ProductName'];
  } else if (this.selectedCargoMode === 'ROAD') {
    return ['CargoType', 'Qty','cbm', 'GrossWeight', 'NetWeight'];
  }
  return [];
}

  // Voice Recognition

  private initializeVoiceNavigation(): void {
    this.isVoiceSupported = this.voiceRecognitionService.isSupported();
    if (this.isVoiceSupported) {
      this.voiceCommands = [
        'CustomerBranchSid',
        'pol', 'pod', 'fdc', 'poo',
        'cargo type',
        'gross weight',
        'net weight',
        'cbm',
        'shipper',
        'consignee',
        'remarks',
        'email',
        'phone',
        'save',
        'reset',
        'back',
        'print',
        'email tab',
        'route tab',
        'other tab',
        'add route',
        'add cargo',
        'remove route',
        'clear field'
      ];
    }
  }

  private setupVoiceSubscriptions(): void {
    this.voiceRecognitionService.navigationCommand.subscribe((command: string) => {
      const parsed = this.voiceParserService.parseNavigationCommand(command);

      if (parsed.type === 'CONTROL' && parsed.action === 'SAVE') {
        this.handleVoiceSave();
      }
    });

    // Subscribe to navigation commands
    this.voiceRecognitionService.navigationCommand.subscribe(command => {
      this.spokenText = command;
      this.handleNavigationCommand(command);
    });

    // Subscribe to voice input completion
    this.voiceRecognitionService.voiceInputComplete.subscribe(transcript => {
      this.spokenText = transcript;
      this.handleVoiceInput(transcript);
    });

    // Subscribe to listening state
    // this.voiceRecognitionService.listeningState.subscribe(isListening => {
    //   if (isListening && this.voiceRecognitionService.isContinuous) {
    //     this.startVoiceNavigation();
    //   }
    // });
  }
  startVoiceNavigation(): void {
    if (!this.isVoiceSupported) return;

    // STOP
    if (this.voiceRecognitionService.isContinuous) {
      this.saveVoiceState();
      this.voiceRecognitionService.stopListening();
      this.toastr.info('Voice guide stopped');
      return;
    }

    // START (RESUME)
    this.voiceRecognitionService.startContinuous();
    this.toastr.success('Voice guide started');

    setTimeout(() => {
      this.restoreVoiceState();
    }, 300);
  }

  private restoreVoiceState(): void {
    const s = this.voiceResumeState;

    this.selectTab(s.tab);

    this.currentFieldIndex = s.formIndex;
    this.activeRouteIndex = s.routeIndex;
    this.currentRouteFieldIndex = s.routeFieldIndex;
    this.activeCargoIndex = s.cargoIndex;
    this.currentCargoFieldIndex = s.cargoFieldIndex;
    this.isCargoVoiceMode = s.isCargoMode;


    if (this.isCargoVoiceMode) {
      this.focusCargoField();
      return;
    }

    if (this.selectedTab === 'Route Details') {
      this.focusRouteField();
      return;
    }

    this.focusCurrentField();
  }


  private focusCurrentField(): void {
    if (this.currentFieldIndex >= this.voiceFieldOrder.length) {
      this.toastr.success('Form completed! Say "save" to submit.');
      return;
    }

    this.currentFieldName = this.voiceFieldOrder[this.currentFieldIndex];

    // ✅ AUTO-SKIP IF VALUE ALREADY EXISTS
    const autoSkipFields = ['ShipperAddress', 'ConsigneeAddress'];

    const control =
      this.enquiryOtherForm.get(this.currentFieldName) ||
      this.rateRequestForm.get(this.currentFieldName);

    if (
      autoSkipFields.includes(this.currentFieldName) &&
      control?.value
    ) {
      
      this.currentFieldIndex++;
      this.focusCurrentField();
      return;
    }

    // Existing logic continues

    if (this.currentFieldName === 'LeadOrCustomer') {
      this.announceCurrentField();
      return;
    }

    const el = this.getFieldElement(this.currentFieldName);
    if (el) {
      el.focus();
      this.highlightActiveField(this.currentFieldName);

      if (this.currentFieldName === 'shipmentDate') {
        this.openDatePicker();
      } else {
        this.openDropdownForField(this.currentFieldName);
      }

      this.announceCurrentField();
    } else {
      this.currentFieldIndex++;
      this.focusCurrentField();
    }
  }




  private highlightActiveField(fieldName: string): void {
    document
      .querySelectorAll('.voice-active')
      .forEach(el => el.classList.remove('voice-active'));

    const el = this.getFieldElement(fieldName);
    el?.classList.add('voice-active');
  }


  private getFieldElement(fieldName: string): HTMLElement | null {
    const fieldId = this.getFieldId(fieldName);
    return document.getElementById(fieldId) ||
      document.querySelector(`[formControlName="${fieldName}"]`) as HTMLElement;
  }

  private getFieldId(fieldName: string): string {
    return fieldName === 'Segment'
      ? 'segmentDropdown'
      : fieldName.toLowerCase();
  }

  private isDropdownField(fieldName: string): boolean {
    return [
      'Segment',
      'CustomerBranchSid',
      'PreCustomerMasterSid',
      'EnquiryType',
      'IncoTerms',
      'ClearanceBy',
      'TransportBy',
      'UserMasterSid',
      'AdditionalService',
      'ShipperName',
      'ConsigneeName',
      'status'
    ].includes(fieldName);
  }

  private openDropdownForField(fieldName: string): void {

    const dropdownMap: Record<string, any[]> = {
      Segment: this.departments,
      EnquiryType: this.modeOfEnquiry,
      CustomerBranchSid: this.customers,
      PreCustomerMasterSid: this.leadList,
      UserMasterSid: this.salesmanList,
      ClearanceBy: [{ name: 'Own' }, { name: 'CHA' }, { name: 'By us' }], TransportBy: [{ name: 'Own' }, { name: 'CHA' }, { name: 'By us' }]
    };

    setTimeout(() => {
      if (fieldName === 'Segment') this.segmentDd?.open();
      if (fieldName === 'EnquiryType') this.enquiryTypeNg?.open();
      if (fieldName === 'CustomerBranchSid') this.CustomerDP?.open();
      if (fieldName === 'PreCustomerMasterSid') this.leadNg?.open();
      if (fieldName === 'ClearanceBy') this.ClearanceByNg?.open();
      if (fieldName === 'UserMasterSid') this.SalesmanNg?.open();
      if (fieldName === 'AdditionalService') this.AdditionalServiceNg?.open();
      if (fieldName === 'TransportBy') this.TransportByNg?.open();
      if (fieldName === 'IncoTerms') this.IncoNameDd?.open();
      if (fieldName === 'FreightPPCC') this.freightTermsNg?.open();
      if (fieldName === 'ShipperName') this.ShipperNameDd?.open();
      if (fieldName === 'ConsigneeName') this.ConsigneeNameDd?.open();
    }, 120);
  }


  private normalizeDeptSpeech(text: string): string {
    return text
      .toLowerCase()
      .replace('department', '')
      .replace('dept', '')
      .replace('select', '')
      .trim();
  }






  private announceCurrentField(): void {
    const fieldLabels: Record<string, string> = {
      // Mode
      LeadOrCustomer: 'Customer or Lead mode',

      // Customer / Lead
      CustomerBranchSid: 'Customer name',
      PreCustomerMasterSid: 'Lead name',
      CustomerAddress: 'Customer address',

      // Core enquiry
      Segment: 'Department',
      EnquiryType: 'Enquiry type',
      shipmentDate: 'Expected shipment date',

      // Contact
      Email: 'Email address',
      ContactPerson: 'Contact person',
      ContactNumber: 'Phone number',

      // Logistics
      IncoTerms: 'Inco terms',
      FreightPPCC: 'Freight terms',
      ClearanceBy: 'Clearance by',
      TransportBy: 'Transport by',
      PickupAddress: 'Pickup address',

      // Shipper / Consignee  ✅ MISSING BEFORE
      ShipperName: 'Customer name',
      ShipperAddress: 'Shipper address',
      ConsigneeName: 'Customer name',
      ConsigneeAddress: 'Consignee address',

      // Others
      CustomerRef: 'Customer reference',
      Remarks: 'Remarks or comments'
    };

    const label = fieldLabels[this.currentFieldName] || this.currentFieldName;

    this.toastr.info(
      `Speak ${label}. Say "next" to skip or "stop" to end.`,
      '',
      {
        timeOut: 4000,
        positionClass: 'toast-top-center',
        toastClass: 'ngx-toastr voice-guide-toast'
      }
    );
  }


  private handleNavigationCommand(command: string): void {
    const parsedCommand = this.voiceParserService.parseNavigationCommand(command);

    switch (parsedCommand.type) {
      case 'NAVIGATE':
        this.handleNavigation(parsedCommand.direction!);
        break;
      case 'CONTROL':
        this.handleControlCommand(parsedCommand.action!);
        break;
    }
  }

  private handleNavigation(direction: 'NEXT' | 'PREVIOUS' | 'SKIP'): void {
    this.closeAllOpenControls();

    // ===============================
    // 🚢 CARGO MODE — FULL OVERRIDE
    // ===============================
    if (this.isCargoVoiceMode) {

      if (direction === 'NEXT' || direction === 'SKIP') {
        this.currentCargoFieldIndex++;
        this.focusCargoField();
        return; // 🔴 CRITICAL: STOP HERE
      }

      if (direction === 'PREVIOUS' && this.currentCargoFieldIndex > 0) {
        this.currentCargoFieldIndex--;
        this.focusCargoField();
        return; // 🔴 CRITICAL
      }

      return; // 🔴 BLOCK FORM NAVIGATION
    }

    // ===============================
    // 🧭 ROUTE MODE
    // ===============================
    if (this.selectedTab === 'Route Details') {
      if (direction === 'NEXT' || direction === 'SKIP') {
        this.currentRouteFieldIndex++;
        this.focusRouteField();
        return;
      }

      if (direction === 'PREVIOUS' && this.currentRouteFieldIndex > 0) {
        this.currentRouteFieldIndex--;
        this.focusRouteField();
        return;
      }
    }

    // ===============================
    // 📝 FORM MODE (DEFAULT)
    // ===============================
    switch (direction) {
      case 'NEXT':
        this.moveToNextField();
        break;
      case 'PREVIOUS':
        this.moveToPreviousField();
        break;
      case 'SKIP':
        this.skipCurrentField();
        break;
    }
  }



  private moveToNextField(): void {
    this.closeAllOpenControls();
    this.currentFieldIndex++;
    this.focusCurrentField();
  }

  private moveToPreviousField(): void {
    this.closeAllOpenControls();
    if (this.currentFieldIndex > 0) {
      this.currentFieldIndex--;
      // const field = this.rateRequestForm.get(this.voiceFieldOrder[this.currentFieldIndex]);
      // field?.reset();
      this.focusCurrentField();
    }
  }

  private skipCurrentField(): void {
    this.closeAllOpenControls();
    this.currentFieldIndex++;
    this.focusCurrentField();
  }
  private openDatePicker(): void {
    if (this.shipmentDp && !this.shipmentDp.isOpen()) {
      this.shipmentDp.open();
    }
  }


  private handleControlCommand(action: string): void {
    switch (action) {

      case 'TAB_ENQUIRY':
        this.selectTab('Enquiry');
        this.toastr.success('Switched to Enquiry tab');
        break;

      case 'TAB_ROUTE':
        this.selectTab('Route Details');
        this.toastr.success('Switched to Route Details tab');
        break;

      case 'STOP':
        this.saveVoiceState();
        this.voiceRecognitionService.stopListening();
        this.toastr.info('Voice guide stopped');
        break;

      case 'CLEAR':
        this.clearCurrentField();
        break;
      case 'SELECT':
        // Handle selection confirmation
        break;
    }
  }
  private handleRouteDropdownVoice(transcript: string): void {
    const spoken = transcript.toLowerCase().trim();
    const fieldName = this.routeVoiceFieldOrder[this.currentRouteFieldIndex];
    const routeGroup = this.routes.at(this.activeRouteIndex) as FormGroup;

    if (!routeGroup) return;

    // Match by PortCode or PortName
    const match = this.ports.find(p =>
      p.PortCode?.toLowerCase() === spoken ||
      p.PortName?.toLowerCase().includes(spoken) ||
      p.PortCode?.toLowerCase().includes(spoken)
    );

    if (!match) {
      this.toastr.warning(`No port found for "${spoken}"`);
      return;
    }

    // ✅ SET VALUE
    routeGroup.get(fieldName)?.setValue(match.PortMasterSid);

    // ✅ CLOSE DROPDOWN
    this.closeRouteDropdown(fieldName);

    // ✅ MOVE NEXT
    this.currentRouteFieldIndex++;

    if (this.currentRouteFieldIndex >= this.routeVoiceFieldOrder.length) {
      this.toastr.success('Route details completed');

      this.isCargoVoiceMode = true;
      this.currentCargoFieldIndex = 0;
      this.activeCargoIndex = 0;

      setTimeout(() => this.focusCargoField(), 400);
      return;
    }
    setTimeout(() => this.focusRouteField(), 300);
  }
  private closeRouteDropdown(field: string): void {
    if (field === 'POO') this.pooDd?.close();
    if (field === 'POL') this.polDd?.close();
    if (field === 'POD') this.podDd?.close();
    if (field === 'FDC') this.fdcDd?.close();
  }


  private handleVoiceInput(transcript: string): void {
    if (!this.currentFieldName) return;

    const text = transcript.toLowerCase().trim();
    // ===============================
    // 🚢 CARGO MODE FIRST
    // ===============================
    if (this.isCargoVoiceMode) {
      this.handleCargoVoiceInput(transcript);
      return;
    }

    // ===============================
    // 🧭 ROUTE MODE
    // ===============================
    if (this.selectedTab === 'Route Details') {
      this.handleRouteDropdownVoice(transcript);
      return;
    }



    // ✅ Handle LeadOrCustomer radio button FIRST
    if (this.currentFieldName === 'LeadOrCustomer') {
      this.handleLeadOrCustomerRadio(text);
      return;
    }

    // ✅ DATE HANDLING
    if (this.currentFieldName === 'shipmentDate') {
      this.handleDateVoiceInput(transcript);
      return;
    }

    // ✅ DROPDOWN HANDLING
    if (this.isDropdownField(this.currentFieldName)) {
      this.handleDropdownVoiceInput(transcript);
      return;
    }

    // ✅ TEXT INPUT HANDLING
    this.handleTextVoiceInput(transcript);
  }

  private handleLeadOrCustomerRadio(text: string): void {
    const isCustomer = text.includes('customer');
    const isLead = text.includes('lead');

    if (!isCustomer && !isLead) {
      this.toastr.warning('Say "Customer" or "Lead"');
      return;
    }

    // Set the radio button value
    this.rateRequestForm.get('LeadOrCustomer')?.setValue(isCustomer);

    // 🔴 IMPORTANT: Force UI update
    this.cdRef.detectChanges();

    // 🔴 Set the next field based on selection
    setTimeout(() => {
      if (isCustomer) {
        // For Customer, move to Customer dropdown
        this.currentFieldIndex = this.voiceFieldOrder.indexOf('CustomerBranchSid');
      } else {
        // For Lead, move to Lead dropdown
        this.currentFieldIndex = this.voiceFieldOrder.indexOf('PreCustomerMasterSid');
      }

      this.focusCurrentField();
    }, 400);
  }

  private handleDropdownVoiceInput(transcript: string): void {
    let spoken = transcript.toLowerCase().trim();

    spoken = this.normalizeSpelledAcronym(spoken);

    /* =======================
       DEPARTMENT
       ======================= */
    if (this.currentFieldName === 'Segment') {
      const cleanText = this.normalizeDeptSpeech(this.normalizeSpelledAcronym(spoken));
      const matched = this.voiceParserService.matchDropdownValue(
        cleanText,
        this.departments,
        ['departmentName']
      );

      if (!matched) {
        this.toastr.warning(`No department found for "${cleanText}"`);
        return;
      }

      this.rateRequestForm.get('Segment')?.setValue(matched.DepartmentMasterSid);
      this.segmentDd?.close();

      setTimeout(() => {
        this.onSegmentChange(matched);
        this.currentFieldIndex = this.voiceFieldOrder.indexOf('EnquiryType');
        this.focusCurrentField();
      }, 300);

      return;
    }

    /* =======================
       CUSTOMER DROPDOWN - FIXED
       ======================= */
    if (this.currentFieldName === 'CustomerBranchSid') {
      const clean = this.normalizeCustomerSpeech(spoken);

      // Log for debugging

      const match = this.customers.find(customer =>
        customer.CustomerName.toLowerCase().includes(clean) ||
        customer.CustomerName.toLowerCase().replace(/\s+/g, '') === clean.replace(/\s+/g, '')
      );

      if (!match) {
        this.toastr.warning(`No customer found for "${clean}"`);
        return;
      }


      // 🔴 IMPORTANT: Patch ALL required fields
      const parsedContact = this.parsePhone(match.ContactNumber || '');
      this.rateRequestForm.patchValue({
        CustomerBranchSid: match.CustomerBranchSid,
        CustomerMasterSid: match.CustomerMasterSid,
        customerName: match.CustomerName,
        CustomerAddress: match.Address || '',
        Email: match.Email || '',
        ContactPerson: match.ContactPerson || '',
        ContactNumberCode: parsedContact.phoneCode,
        ContactNumber: parsedContact.phoneNumber
      });

      // Manually trigger the selection change
      this.onSelectionChange(match);

      // Close dropdown
      this.CustomerDP?.close();

      // Move to next field
      setTimeout(() => {
        this.moveToFirstEmptyAfterCustomer();
      }, 300);

      return;
    }

    /* =======================
       LEAD DROPDOWN - FIXED
       ======================= */
    if (this.currentFieldName === 'PreCustomerMasterSid') {
      const clean = this.normalizeCustomerSpeech(spoken);


      const match = this.leadList.find(lead =>
        lead.preCustomerName.toLowerCase().includes(clean) ||
        lead.preCustomerName.toLowerCase().replace(/\s+/g, '') === clean.replace(/\s+/g, '')
      );

      if (!match) {
        this.toastr.warning(`No lead found for "${clean}"`);
        return;
      }


      // 🔴 IMPORTANT: Patch ALL required fields for lead
      const parsedContact = this.parsePhone(match.phone || '');
      this.rateRequestForm.patchValue({
        PreCustomerMasterSid: match.PreCustomerMasterSid,
        customerName: match.preCustomerName,
        CustomerAddress: match.preCustomerAddress1 || '',
        Email: match.email || '',
        ContactPerson: match.contactPerson || '',
        ContactNumberCode: parsedContact.phoneCode,
        ContactNumber: parsedContact.phoneNumber
      });

      // Trigger salesperson loading
      this.patchSalespersonOfLead(match);

      // Close dropdown
      this.leadNg?.close();

      // Move to next field
      setTimeout(() => {
        this.moveToFirstEmptyAfterCustomer();
      }, 300);

      return;
    }

    /* =======================
       ENQUIRY TYPE DROPDOWN
       ======================= */
    if (this.currentFieldName === 'EnquiryType') {
      const clean = spoken;
      const option = this.modeOfEnquiry.find(item =>
        item.name.toLowerCase() === clean
      );

      if (!option) {
        this.toastr.warning(`No enquiry type found for "${clean}"`);
        return;
      }

      this.rateRequestForm.get('EnquiryType')?.setValue(option.name);
      this.enquiryTypeNg?.close();

      setTimeout(() => {
        this.currentFieldIndex = this.voiceFieldOrder.indexOf('shipmentDate');
        this.focusCurrentField();
      }, 200);

      return;
    }

    /* =======================
     FREIGHT TERMS DROPDOWN - FIX
     ======================= */
    if (this.currentFieldName === 'FreightPPCC') {
      const clean = spoken.replace(/\s+/g, ' ').trim();

      const option = this.freightTermsList.find(item =>
        item.FreightTerms.toLowerCase() === clean
      );

      if (!option) {
        this.toastr.warning(`No freight terms found for "${clean}"`);
        return;
      }

      this.rateRequestForm.get('FreightPPCC')?.setValue(option.FreightTerms);
      this.freightTermsNg?.close();

      setTimeout(() => {
        this.currentFieldIndex = this.voiceFieldOrder.indexOf('shipmentDate');
        this.focusCurrentField();
      }, 200);

      return;
    }
    /* =======================
    ADDITIONAL SERVICE - FIXED
    ======================= */
    if (this.currentFieldName === 'AdditionalService') {
      const clean = spoken.toLowerCase().trim();

      // Map common spoken terms to service names
      const serviceMap: { [key: string]: string } = {
        'lashing': 'Lashing',
        'las': 'Lashing',
        'labeling': 'Labelling',
        'label': 'Labelling',
        'labelling': 'Labelling',
        'choking': 'Choking',
        'choke': 'Choking',
        'fumigation': 'Fumigation',
        'fumigate': 'Fumigation',
        'pallet': 'Pallet',
        'pallets': 'Pallet'
      };

      let serviceName = serviceMap[clean];
      if (!serviceName) {
        // Try direct match
        const option = this.modeOfAddtionalService.find(o =>
          o.name.toLowerCase() === clean
        );
        serviceName = option?.name;
      }

      if (!serviceName) {
        this.toastr.warning(`Say: Lashing, Labelling, Choking, Fumigation, or Pallet`);
        return;
      }

      this.enquiryOtherForm.get('AdditionalService')?.setValue(serviceName);
      this.AdditionalServiceNg.close();



      setTimeout(() => this.moveToNextField(), 300);
      return;
    }


    /* =======================
      CLEARANCE BY - FIXED
      ======================= */
    if (this.currentFieldName === 'ClearanceBy') {
      const clean = spoken.replace(/\s+/g, ' ').trim().toLowerCase();

      // Map spoken words to valid values
      let value = null;

      if (clean.includes('own') || clean === 'own') {
        value = 'Own';
      } else if (clean.includes('cha') || clean.includes('agent')) {
        value = 'CHA';
      } else if (clean.includes('by us') || clean.includes('our') || clean.includes('company')) {
        value = 'By us';
      }

      if (!value) {
        this.toastr.warning(`Say "Own", "CHA", or "By us" for Clearance By`);
        return;
      }

      this.rateRequestForm.get('ClearanceBy')?.setValue(value);
      this.ClearanceByNg?.close();
      // ✅ MOVE NEXT
      setTimeout(() => {

        this.moveToNextField();
      }, 300);
      return;
    }



    /* =======================
       TRANSPORT BY DROPDOWN - FIXED
       ======================= */
    if (this.currentFieldName === 'TransportBy') {
      const clean = spoken.replace(/\s+/g, ' ').trim().toLowerCase();

      let value = null;

      if (clean.includes('own') || clean === 'own') {
        value = 'Own';
      } else if (clean.includes('1') || clean.includes('agent')) {
        value = 'CHA';
      } else if (clean.includes('by us') || clean.includes('our') || clean.includes('company')) {
        value = 'By us';
      }

      if (!value) {
        this.toastr.warning(`Say "Own", "CHA", or "By us" for Transport By`);
        return;
      }

      this.rateRequestForm.get('TransportBy')?.setValue(value);
      this.TransportByNg.close();

      setTimeout(() => this.moveToNextField(), 300);
      return;
    }

    /* =======================
     SALESMAN DROPDOWN - FIX
     ======================= */
    if (this.currentFieldName === 'UserMasterSid') {
      const clean = this.normalizeCustomerSpeech(spoken);

      const match = this.salesmanList.find(user =>
        user.userName.toLowerCase().includes(clean) ||
        user.userName.toLowerCase().replace(/\s+/g, '') === clean.replace(/\s+/g, '')
      );

      if (!match) {
        this.toastr.warning(`No salesman found for "${clean}"`);
        return;
      }

      // ✅ PATCH CORRECT VALUE
      this.rateRequestForm.get('UserMasterSid')?.setValue(match.UserMasterSid);

      // ✅ Close dropdown if needed

      this.SalesmanNg?.close();

      // ✅ Move forward
      setTimeout(() => this.moveToNextField(), 300);
      return;
    }
    /* =======================
       INCOTERMS DROPDOWN - FIX
       ======================= */
    if (this.currentFieldName === 'IncoTerms') {
      const clean = this.normalizeIncoSpeech(spoken);

      const match = this.incoList.find(inco =>
        inco.IncoCode.toLowerCase() === clean ||
        inco.IncoName.toLowerCase().replace(/\s+/g, '') === clean
      );

      if (!match) {
        this.toastr.warning(`No IncoTerms found for "${spoken}"`);
        return;
      }

      // ✅ PATCH FORM VALUE
      this.rateRequestForm.get('IncoTerms')?.setValue(match.IncoName);

      // ✅ CLOSE DROPDOWN
      this.IncoNameDd?.close();

      // ✅ MOVE NEXT
      setTimeout(() => this.moveToNextField(), 200);
      return;
    }




    /* =======================
       SHIPPER NAME
       ======================= */
    if (this.currentFieldName === 'ShipperName') {
      const clean = spoken.toLowerCase().trim();

      const option = this.finalShipperList.find(item =>
        item.CustomerName?.toLowerCase().includes(clean)
      );

      if (!option) {
        this.toastr.warning(`No shipper found for "${spoken}"`);
        return;
      }

      this.enquiryOtherForm.patchValue({
        ShipperName: option.CustomerName
      });

      this.onShipperChange(option);
      this.ShipperNameDd?.close();

      setTimeout(() => {
        this.currentFieldIndex = this.voiceFieldOrder.indexOf('ShipperAddress');
        this.focusCurrentField();
      }, 300);

      return; // 🔴 VERY IMPORTANT
    }


    /* =======================
       CONSIGNEE NAME - FIXED
       ======================= */
    if (this.currentFieldName === 'ConsigneeName') {
      const clean = spoken.toLowerCase().trim();

      const option = this.finalConsigneeList.find(item =>
        item.CustomerName?.toLowerCase().includes(clean)
      );

      if (!option) {
        this.toastr.warning(`No consignee found for "${spoken}"`);
        return;
      }

      this.enquiryOtherForm.patchValue({
        ConsigneeName: option.CustomerName
      });

      this.onConsigneeChange(option);
      this.ConsigneeNameDd?.close();

      setTimeout(() => {
        this.currentFieldIndex = this.voiceFieldOrder.indexOf('ConsigneeAddress');
        this.focusCurrentField();
      }, 300);

      return;
    }


    // Handle other dropdowns generically
    // 🔽 GENERIC DROPDOWNS ONLY
    const option = this.voiceParserService.matchDropdownValue(
      spoken,
      this.dropdownOptions,
      ['name', 'CustomerName', 'userName']
    );


    if (!option) {
      this.toastr.warning(`No match for "${spoken}"`);
      return;
    }

    // Set value based on field type
    const control = this.rateRequestForm.get(this.currentFieldName);
    if (control) {
      if (option.name) {
        control.setValue(option.name);
      } else if (option.CustomerName) {
        control.setValue(option.CustomerName);
      } else if (option.userName) {
        control.setValue(option.userName);
      }
    }

    // Close relevant dropdowns
    this.shipmentDp?.close();

    // Move to next field
    setTimeout(() => this.moveToNextField(), 300);
  }




  private handleTextVoiceInput(transcript: string): void {
    const control = this.rateRequestForm.get(this.currentFieldName);

    if (this.currentFieldName === 'Email') {
      const email = transcript
        .replace(/ at /g, '@')
        .replace(/ dot /g, '.')
        .replace(/\s+/g, '');

      this.rateRequestForm.get('Email')?.setValue(email);
      this.moveToNextField();
      return;
    }


    if (this.currentFieldName === 'ContactNumber') {
      const number = transcript.replace(/\D/g, '');
      control?.setValue(number);
      this.moveToNextField();
      return;
    }

    if (this.currentFieldName === 'shipmentDate') {
      this.handleDateVoiceInput(transcript);
      return;
    }
    if (this.currentFieldName === 'PickupAddress') {
      this.enquiryOtherForm
        .get('PickupAddress')
        ?.setValue(transcript);

      setTimeout(() => this.moveToNextField(), 300);
      return;
    }
    if (this.currentFieldName === 'ShipperAddress') {
      this.enquiryOtherForm
        .get('ShipperAddress')
        ?.setValue(transcript);

      setTimeout(() => this.moveToNextField(), 300);
      return;
    }
    if (this.currentFieldName === 'ConsigneeAddress') {
      this.enquiryOtherForm
        .get('ConsigneeAddress')
        ?.setValue(transcript);

      setTimeout(() => this.moveToNextField(), 300);
      return;
    }
    // 🔹 CUSTOMER REF
    if (this.currentFieldName === 'CustomerRef') {
      this.rateRequestForm
        .get('CustomerRef')
        ?.setValue(transcript);

      setTimeout(() => this.moveToNextField(), 300);
      return;
    }

    // 🔹 REMARKS
    if (this.currentFieldName === 'Remarks') {
      this.rateRequestForm.get('Remarks')?.setValue(transcript);

      setTimeout(() => {
        this.selectTab('Route Details');

        // ✅ RESET ROUTE VOICE FLOW
        this.activeRouteIndex = 0;
        this.currentRouteFieldIndex = 0;

        this.focusRouteField();
      }, 300);

      return;
    }




    control?.setValue(transcript);
    setTimeout(() => this.moveToNextField(), 300);
  }
  private focusRouteField(): void {
    const fieldName = this.routeVoiceFieldOrder[this.currentRouteFieldIndex];
    const routeGroup = this.routes.at(this.activeRouteIndex) as FormGroup;

    if (!routeGroup) return;


    // OPEN DROPDOWN
    setTimeout(() => {
      this.openRouteDropdown(fieldName);
    }, 150);

    this.toastr.info(
      `Speak ${fieldName} port name or code`,
      '',
      { positionClass: 'toast-top-center', timeOut: 3000 }
    );
  }
  private openRouteDropdown(field: string): void {
    if (field === 'POO') this.pooDd?.open();
    if (field === 'POL') this.polDd?.open();
    if (field === 'POD') this.podDd?.open();
    if (field === 'FDC') this.fdcDd?.open();
  }


  private handleDateVoiceInput(transcript: string): void {
    const parsed = Date.parse(transcript);

    if (isNaN(parsed)) {
      this.toastr.warning('Could not understand date');
      this.openDatePicker();
      return;
    }

    const date = new Date(parsed);


    // ✅ set value
    this.rateRequestForm.get('shipmentDate')?.setValue(date);

    // ✅ close the SAME datepicker instance
    setTimeout(() => {
      if (this.shipmentDp?.isOpen()) {
        this.shipmentDp.close();
      }
    }, 0);

    // ✅ move to LeadOrCustomer
    setTimeout(() => {
      this.moveToNextField();
    }, 300);
  }

  private normalizeSpelledAcronym(text: string): string {
    return text
      // convert "a i" → "ai"
      .replace(/\b([a-z])\s+([a-z])\b/g, '$1$2')
      // convert "l c l" → "lcl"
      .replace(/\b([a-z])\s+([a-z])\s+([a-z])\b/g, '$1$2$3')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private clearCurrentField(): void {
    const fieldControl = this.rateRequestForm.get(this.currentFieldName);
    fieldControl?.reset();
    this.toastr.info('Field cleared');
  }
  private normalizeCustomerSpeech(text: string): string {
    return text
      .toLowerCase()
      .replace(/\b(customer|client|lead|select|choose|please|set|enter)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeIncoSpeech(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, '')     // "f a s" → "fas"
      .replace('incode', '')
      .replace('inco', '')
      .replace('incoterm', '')
      .trim();
  }

  private moveToFirstEmptyAfterCustomer(): void {
    const autoFields = [
      'CustomerAddress',
      'Email',
      'ContactPerson',
      'ContactNumber'
    ];

    for (const field of autoFields) {
      const control = this.rateRequestForm.get(field);
      if (!control?.value) {
        this.currentFieldIndex = this.voiceFieldOrder.indexOf(field);
        this.focusCurrentField();
        return;
      }
    }

    // ✅ If all auto fields filled → jump to ClearanceBy
    this.currentFieldIndex = this.voiceFieldOrder.indexOf('ClearanceBy');
    this.focusCurrentField();
  }
  private closeAllOpenControls(): void {
    // ng-selects
    this.enquiryTypeNg?.close();
    this.leadNg?.close();
    this.ClearanceByNg?.close();
    this.TransportByNg?.close();
    this.SalesmanNg?.close();
    this.AdditionalServiceNg?.close();
    this.freightTermsNg?.close();

    // searchable dropdowns
    this.segmentDd?.close();
    this.CustomerDP?.close();
    this.IncoNameDd?.close();
    this.ShipperNameDd?.close();
    this.ConsigneeNameDd?.close();

    // datepicker
    if (this.shipmentDp?.isOpen()) {
      this.shipmentDp.close();
    }
  }

  private getCargoVoiceFieldOrder(): string[] {
    if (this.selectedCargoMode === 'FCL') {
      return [
        'CargoType',
        'CargoDescription',
        'ContainerType',
        'PackageQty',
        'ProductName',
        'PackageType',
        'GrossWeight',
        'NetWeight',
        'cbm',
        'ShipmentTerms'
      ];
    }

    if (this.selectedCargoMode === 'AIR' || this.selectedCargoMode === 'LCL') {
      return [
        'CargoType',
        'CargoDescription',
        'ProductName',
        'PackageType',
        'PackageQty',
        'length',
        'width',
        'height',
        'cbm',
        'GrossWeight',
        'NetWeight',
        'ShipmentTerms'
      ];
    }

    if (this.selectedCargoMode === 'ROAD') {
      return [
        'CargoType',
        'CargoDescription',
        'cbm',
        'Qty',
        'GrossWeight',
        'NetWeight',
        'ChargeableWeight'
      ];
    }

    return [];
  }

  private focusCargoField(): void {
    const fields = this.getCargoVoiceFieldOrder();
    const fieldName = fields[this.currentCargoFieldIndex];

    const cargoGroup = this.routeCargo(this.activeRouteIndex)
      .at(this.activeCargoIndex) as FormGroup;

    if (!cargoGroup || !fieldName) {
      this.toastr.success('Cargo entry completed');
      this.isCargoVoiceMode = false; // Exit cargo mode
      return;
    }


    // 🔔 INFORM USER WITH CLEAR MESSAGE
    const fieldLabels: Record<string, string> = {
      'CargoType': 'Cargo Type (say: General, Haz, Reefer, etc)',
      'ProductName': 'Product Name',
      'PackageType': 'Package Type',
      'ContainerType': 'Container Type',
      'ShipmentTerms': 'Shipment Terms (say: FCL/FCL, FCL/LCL, etc)',
      'CargoDescription': 'Cargo Description',
      'PackageQty': 'Package Quantity (numbers only)',
      'length': 'Length (numbers only)',
      'width': 'Width (numbers only)',
      'height': 'Height (numbers only)',
      'cbm': 'CBM (numbers only)',
      'GrossWeight': 'Gross Weight (numbers only)',
      'NetWeight': 'Net Weight (numbers only)'
    };

    const label = fieldLabels[fieldName] || fieldName.replace(/([A-Z])/g, ' $1');

    this.toastr.info(
      `Speak ${label}. Say "next" to skip.`,
      'Cargo Entry Mode',
      { timeOut: 5000, positionClass: 'toast-top-center' }
    );

    // 🔽 OPEN DROPDOWN IF NEEDED
    if (this.isCargoDropdownField(fieldName)) {
      this.closeAllCargoDropdowns();

      setTimeout(() => {
        this.openCargoDropdown(fieldName);

        // 🔴 FORCE FOCUS ON NG-SELECT
        const index = this.activeCargoIndex;
        switch (fieldName) {
          case 'CargoType':
            this.cargoTypeNgs?.toArray()[index]?.focus();
            break;
          case 'ProductName':
            this.productNameNgs?.toArray()[index]?.focus();
            break;
          case 'PackageType':
            this.packageTypeNgs?.toArray()[index]?.focus();
            break;
          case 'ShipmentTerms':
            this.shipmentTermsNgs?.toArray()[index]?.focus();
            break;
        }
      }, 250);
      return;
    }
    else {
      // For non-dropdown fields, focus the input
      setTimeout(() => {
        const inputElement = this.getCargoFieldElement(fieldName);
        inputElement?.focus();
      }, 300);
    }
  }

  private closeAllCargoDropdowns(): void {
    this.cargoTypeNgs?.toArray().forEach(dd => dd.close());
    this.productNameNgs?.toArray().forEach(dd => dd.close());
    this.packageTypeNgs?.toArray().forEach(dd => dd.close());
    this.shipmentTermsNgs?.toArray().forEach(dd => dd.close());
  }

  private getCargoFieldElement(fieldName: string): HTMLElement | null {
    const cargoGroup = this.routeCargo(this.activeRouteIndex)
      .at(this.activeCargoIndex) as FormGroup;

    if (!cargoGroup) return null;

    // Find the input element for this field
    const formControlName = fieldName;
    return document.querySelector(`[formControlName="${formControlName}"]`) as HTMLElement;
  }
  private isCargoDropdownField(field: string): boolean {
    return [
      'CargoType',
      'ProductName',
      'PackageType',
      'ContainerType',
      'ShipmentTerms'
    ].includes(field);
  }
  private openCargoDropdown(field: string): void {
    const index = this.activeCargoIndex;

    setTimeout(() => {
      switch (field) {
        case 'CargoType':
          this.cargoTypeNgs?.toArray()[index]?.open();
          break;

        case 'ProductName':
          this.productNameNgs?.toArray()[index]?.open();
          break;

        case 'PackageType':
          this.packageTypeNgs?.toArray()[index]?.open();
          break;

        case 'ShipmentTerms':
          this.shipmentTermsNgs?.toArray()[index]?.open();
          break;
      }
    }, 100);
  }


  private handleCargoVoiceInput(transcript: string): void {
    const fields = this.getCargoVoiceFieldOrder();
    const fieldName = fields[this.currentCargoFieldIndex];

    const cargoGroup = this.routeCargo(this.activeRouteIndex)
      .at(this.activeCargoIndex) as FormGroup;

    if (!cargoGroup) return;

    const spoken = transcript.toLowerCase().trim();


    // 🔽 DROPDOWNS
    if (this.isCargoDropdownField(fieldName)) {
      const options = this.getCargoDropdownOptions(fieldName);
      const option = this.voiceParserService.matchDropdownValue(
        spoken,
        options,
        ['name', 'ProductName', 'UOMName', 'ContainerName']
      );

      if (!option) {
        this.toastr.warning(`No match for "${spoken}". Try again.`);
        return; // Don't move forward if no match
      }

      // Set the value
      const value = option.name || option.ProductName || option.UOMCode || option.ContainerName;
      cargoGroup.get(fieldName)?.setValue(value);

      // Close the dropdown after selection
      setTimeout(() => {
        this.closeAllCargoDropdowns();
      }, 200);

      this.toastr.success(`Set ${fieldName} to ${value}`);

    }
    // 🔢 NUMERIC FIELDS
    else if (['PackageQty', 'length', 'width', 'height', 'cbm', 'GrossWeight', 'NetWeight'].includes(fieldName)) {
      const numericValue = spoken.replace(/\D/g, '');
      cargoGroup.get(fieldName)?.setValue(numericValue);
      this.toastr.success(`Set ${fieldName} to ${numericValue}`);
    }
    // ✍ TEXT FIELDS
    else {
      cargoGroup.get(fieldName)?.setValue(transcript);
      this.toastr.success(`Set ${fieldName} to ${transcript}`);
    }

    // ✅ MOVE TO NEXT FIELD WITH DELAY
    setTimeout(() => {
      this.currentCargoFieldIndex++;

      // Check if we've completed all fields
      if (this.currentCargoFieldIndex >= fields.length) {
        this.toastr.success('Cargo entry completed!');
        this.isCargoVoiceMode = false;
        return;
      }

      this.focusCargoField();
    }, 1000); // Give user time to see the confirmation
  }
  private getCargoDropdownOptions(field: string): any[] {
    switch (field) {
      case 'CargoType': return this.cargoTypes;
      case 'ProductName': return this.productList;
      case 'PackageType': return this.packageTypes;
      case 'ContainerType': return this.containerTypes;
      case 'ShipmentTerms': return this.terms;
      default: return [];
    }
  }
  private voiceResumeState = {
    tab: 'Enquiry' as 'Enquiry' | 'Route Details',
    formIndex: 0,
    routeIndex: 0,
    routeFieldIndex: 0,
    cargoIndex: 0,
    cargoFieldIndex: 0,
    isCargoMode: false
  };

  private saveVoiceState(): void {
    this.voiceResumeState = {
      tab: this.selectedTab as any,
      formIndex: this.currentFieldIndex,
      routeIndex: this.activeRouteIndex,
      routeFieldIndex: this.currentRouteFieldIndex,
      cargoIndex: this.activeCargoIndex,
      cargoFieldIndex: this.currentCargoFieldIndex,
      isCargoMode: this.isCargoVoiceMode
    };

  }
  stopVoiceGuide(): void {
    if (this.voiceRecognitionService.isContinuous) {
      this.voiceRecognitionService.stopListening();
      this.isListening = false;
      this.spokenText = '';
      this.currentFieldName = '';
    }
  }

  handleVoiceSave(): void {
    // 🔒 Prevent duplicate submits
    if (this.btnDisable) {
      this.toastr.info('Save already in progress');
      return;
    }

    // ❌ Mandatory validation (same rules as onSubmit)
    if (this.hasInvalidExcept('routes', this.rateRequestForm)) {
      this.rateRequestForm.markAllAsTouched();
      this.rateRequestForm.updateValueAndValidity();

      const errorMessage = this.getValidationErrorMessage();
      this.toastr.warning(errorMessage || 'Please fill mandatory fields');
      return;
    }

    // ❌ Route validation
    let routeInvalid = false;
    this.routes.controls.forEach((routeGroup: FormGroup) => {
      if (this.hasInvalidExcept('cargo', routeGroup)) {
        routeInvalid = true;
      }
    });

    if (routeInvalid) {
      this.selectedTab = 'Route Details';
      this.toastr.warning('Please complete route details');
      return;
    }

    // ✅ Everything valid → SAVE
    this.toastr.success('Saving enquiry');
    this.onSubmit();
  }

  createNew() {
    this.router.navigate(['crm/enquiry/entry'])
  }

}


