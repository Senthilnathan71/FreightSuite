


import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, effect, ElementRef, HostListener, OnDestroy, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import {
  NgbAccordionModule,
  NgbCalendar,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbDateStruct,
  NgbDropdownModule,
  NgbModal,
  NgbModalRef,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgbAccordionDirective } from '@ng-bootstrap/ng-bootstrap';
import { AbstractControl, Form, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from '../../Services/lead.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, firstValueFrom, forkJoin, from, map, merge, Observable, of, Subject, Subscription, tap } from 'rxjs';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { de, ro } from 'date-fns/locale';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ToastrService } from 'ngx-toastr';
import html2pdf from 'html2pdf.js';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { QuotationPdfService } from 'src/app/common/quotation-pdf.service';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { VerticalSidebarService } from 'src/app/shared/vertical-sidebar/vertical-sidebar.service';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { getDefaultTodayDate } from 'src/app/common/helper';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import {
  generateQuotationDocument,
  transformQuotationApiData,
} from 'src/app/common/pdf/generators/quotation-pdf.generator';
import { GetStandardChargesComponent } from 'src/app/modules/operation/cost/get-standard-charges/get-standard-charges.component';
import { DialCodeDropdownComponent } from 'src/app/component/dial-code-dropdown/dial-code-dropdown.component';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { VoiceRecognitionService } from '../../enquiry/voice-recognition.service';
import { VoiceParserService } from '../../enquiry/voice-parser.service';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';
type Html2PdfOptions = {
  margin?: number | [number, number, number, number];
  filename?: string;
  image?: {
    type?: 'jpeg' | 'png' | 'webp';
    quality?: number;
  };
  html2canvas?: {
    scale?: number;
    logging?: boolean;
    dpi?: number;
    letterRendering?: boolean;
    useCORS?: boolean;
  };
  jsPDF?: {
    unit?: string;
    format?: string | [number, number];
    orientation?: 'portrait' | 'landscape';
  };
};

@Component({
  selector: 'app-quotation-entry',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    NgbAccordionModule,
    FeatherModule,
    NgbDatepickerModule,
    NgbAccordionDirective,
    NgbDropdownModule,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    DecimalPrecisionDirective,
    FavoriteStarComponent,
    SearchableDropdown,
    CustomDatePipe,
    NgxSpinnerModule,
    FormsModule,
    NgbTooltip,
    PreventMultiClickDirective,
    PrintHeaderComponent,
    DialCodeDropdownComponent,
    RouterModule,
    ElementStateGuardDirective,
    FormStateGuardDirective
    // MultiColumnComboboxComponent
  ],
  templateUrl: './quotation-entry.component.html',
  styleUrl: './quotation-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})

export class QuotationEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {

  private subscription = new Subscription()

  // SECTION1 - VARIABLE DECLARATION
  @ViewChildren('revenueLocalAmountInput') revenueLocalInputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChild('customerCreatedModal') customerCreatedModal!: TemplateRef<any>
  @ViewChild('bookingConfirmationModal') bookingConfirmationModal!: TemplateRef<any>;
  currentDate = new Date()
  selectedCurrency : any;
  MenuMasterSid:any
  actionsDisabled = false;
  approvalDropdownValue = ""
  createdCustomerId : number;
  isLoading : boolean;
  selectedItem : any;
  quotationApproved : boolean;
  selectedDepartment: any = '';
  quoteAuthorized : boolean;
  isStandardRate : boolean;
  authorizerDetails = {
    isAuthorizer: false,
    isAlreadyApproved: false,
    canAuthorize: false,
    AuthorityLevel: null,
    AuthorityDetailSid: null,
    ApprovedBy : ''
  }
   rateLock: boolean = false;
  rateLockConfig: any;
  canUserLockRates: boolean = false;
  tariffData: any;
  currentUserEmail: string;
  QuoteHeaderSid: number;
  currentMenuId: number;
  currentRouteIndex : number;
  currentCarrierIndex : number;
  isEditMode: boolean;
  isAuthorizedUser: boolean;
  isAlreadyApproved: boolean;
  tariffLoading : boolean;
  quotationData: any;
  userData: any;
  currentCompany: any;
  currentBranch: any;
  minEffDate: any;
  permissions: any[] = [];
  currentMenuPermissions = {};
  packageTypes: any[] = [];
  carriers: any[] = [];
  customers: any[] = [];
  customerlist: any[] = [];
  departments: any[] = [];
  ports: any[] = [];
  filteredPorts: any[] = [];
  filteredPORPorts: any[][] = [];
  filteredPOLPorts: any[][] = [];
  filteredPODPorts: any[][] = [];
  filteredFPODPorts: any[][] = [];
  chargeMaster: any[] = [];
  filteredCharges : any[] = [];
  currencyMaster: any[] = [];
  chargeUnitMaster: any[] = [];
  packageUnitMaster: any[] = [];
  measurementUnitList: any[] = [];
  weightUnitList: any[] = [];
  incoList: any[] = [];
  salesmanList: any[] = [];
  cusBranchList: any[] = [];
  containerTypeList: any[] = []
  TandCList: any[] = []
  tariffDetails : any[] = [];
  tariffCargoGroups: { cargoLabel: string; items: any[] }[] = [];
  tariffSearchedCombination: string = '';
  tariffHeaderSid: number | null = null;
  standardChargeDetails:any[] = [];
  filteredUnits: any[][] = [];
  costAgentList : any[] = [];
  vendorSupplierList : any[] = [];
  productList : any[] =[];
  productLookupConfig = ['ProductCode','ProductName'];
   showPrintLogo: boolean = false;
    showPdfLogo: boolean = true;
    isSaving: boolean = false;
    isDirty: boolean = false;
    isPatching: boolean = false;
    private initialFormValue: any = null;
    isTermsAndConditionsEnabled: boolean = true;
    printTermsList: any[] = [];

  // PDF caching properties for performance optimization
  private cachedPdfBlob: Blob | null = null;
  private cachedQuoteNumber: string | null = null;
  private pdfDepsPromise?: Promise<{ pdfMake: any }>;

  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  
  quotationForm !: FormGroup;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  enquiryNumber = '';
  allowModifyButton : boolean;
  authStateCache : string = "Pending";
  disableAllModification : boolean;

  /** Flag that indicate whether booking is already created against this quotation or not. */
  bookingCreatedAgainstThisQuotation: boolean;
  
  auditLogs: any[] = []; // Stores audit logs
  leadList : any[] = [];
  auditLogModalRef!: NgbModalRef;

   standardChargeLoading:boolean = false;

  modeOfCargoType = [
    { id: 1, name: 'General' },
    { id: 2, name: 'Haz' },
    { id: 3, name: 'Reefer' },
    { id: 4, name: 'Tanker' },
    { id: 5, name: 'OOG' },
    { id: 6, name: 'ODC'},
    { id: 7, name: 'Flexi'},
    { id: 8, name: 'RORO'},
  ];

  serviceLevel = [
    { name: 'CFS/CFS' }, { name: 'CY/CFS' },
    { name: 'CFS/CY' }, { name: 'CFS/FO' },
    { name: 'CY/CY' }, { name: 'CY/DOOR' },
    { name: 'CY/FO' }, { name: 'DOOR/CY' },
    { name: 'DOOR/DOOR' }, { name: 'CY/HK' }
  ]

  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];

  allApprovalStatus = [
    { value : "Open" , name :"Open"},
    { value : "Pending" , name :"Waiting for Approval"},
    { value : "WaitingForFinalApproval" , name :"Waiting for Final Approval"},
    { value : "WaitingForCustomerApproval" , name :"Waiting for Customer Approval"},
    { value : "Approved" , name :"Approved"},
    { value : "Counter" , name :"Counter"},
    { value : "Rejected" , name : "Rejected"}
  ]

  approvalStatus = [
    { value : "Open" , name :"Open"},
    { value : "Pending" , name :"Waiting for Approval"},
    { value : "Approved" , name :"Approved"},
    { value : "Rejected" , name : "Rejected"},
    {value : "Counter", name : "Counter"}
  ]

  isLocked = true;


  
  tabs: string[] = ['Quotation', 'Route Details'];
  requiredFieldsToGetTariff = ['DepartmentMasterSid','POLSid','PODSid','effDate','expDate']
  selectedTab = 'Quotation';
dataFromEnqPage:any;
  imcoList: any[] = [];
  quotationDataApprovedByCustomer: any;
  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  selectedTab1= 'Quotation';
  tabs1 = [
    { name:'Quotation', icon: 'fas fa-file-signature' },
   { name: 'Route Details', icon: 'fas fa-layer-group' }
  ];
  selectTab1(tab: string) {
    this.selectedTab1 = tab;
  }

  // Voice Recognition
  isVoiceSupported = false;
  voiceStartedOnce = false;
  isListening = false;
  voiceCommands: string[] = [];
  spokenText = '';
  currentFieldIndex = 0;
  currentFieldName = '';
  currentRouteFieldIndex = 0;
  currentCargoFieldIndex = 0;
  currentProductFieldIndex = 0;
  voiceRouteIndex = 0;
  voiceCargoIndex = 0;
  voiceProductIndex = 0;
  isCargoVoiceMode = false;
  isProductVoiceMode = false;

  voiceFieldOrder: string[] = [
    'LeadOrCustomer',
    'CustomerBranchSid',
    'PreCustomerMasterSid',
    'CustomerAddress',
    'Email',
    'ContactPerson',
    'ContactNumber',
    'CustomerRef',
    'SalesmanSid',
    'AgreedRate',
    'IsContract'
  ];

  routeVoiceFieldOrder: string[] = [
    'DepartmentMasterSid',
    'PORSid',
    'POLSid',
    'PODSid',
    'FPODSid',
    'effDate',
    'expDate',
    'ServiceLevel',
    'FreightPPCC'
  ];

  cargoVoiceFieldOrder: string[] = [
    'CargoType',
    'CargoDescription',
    'ContainerType',
    'Qty',
    'ProductName',
    'PackageType',
    'GrossWeight',
    'NetWeight',
    'Volume',
    'ShipmentTerms'
  ];

  productVoiceFieldOrder: string[] = [
    'ProductName',
    'ExternalPkg',
    'ExternalQty',
    'GrossWeight',
    'NetWeight',
    'Volume',
    'Length',
    'Width',
    'Height',
    'ProductUnit',
    'IsHaz',
    'ImcoClass',
    'UnNo',
    'PkgGroup',
    'Remarks'
  ];

  private voiceResumeState = {
    tab: 'Quotation' as 'Quotation' | 'Route Details',
    formIndex: 0,
    routeIndex: 0,
    cargoIndex: 0,
    productIndex: 0,
    cargoMode: false,
    productMode: false
  };

  private getApprovalUrl(_quoteHeaderSid?: number | null): string {
    const baseUrl = (window.location.origin || '').replace(/\/$/, '');
    // The literal placeholder is replaced by the backend with the real public token
    // when the email is dispatched. See ff-quotation/send/email.
    return `${baseUrl}/public/quotation/{{APPROVAL_TOKEN}}`;
  }

  private getApprovalLinkText(quoteHeaderSid: number | null | undefined): string {
    return `Approval Hyper link ${this.getApprovalUrl(quoteHeaderSid)}`;
  }

  // Lookup Configuration
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  portLookupConfig = DROPDOWN_CONFIGS.PORT;
  chargeLookupConfig = DROPDOWN_CONFIGS.CHARGE;
  unitLookupConfig = DROPDOWN_CONFIGS.UOM;
  userLookupConfig = DROPDOWN_CONFIGS.USER;

  currencyLookupConfig = {
    displayFields : ['currencyCode', 'currencyName','countryName'],
    displayLabels : ['Code','Name','Country'],
    labelFields :['currencyCode']
  };
  incoLookupConfig = DROPDOWN_CONFIGS.INCO;
  departmentLookupConfig = DROPDOWN_CONFIGS.DEPARTMENT;

  // currencyColumns : ComboBoxColumn[] = [
  //   { field: 'currencyCode', header: 'Code', width: '30%' },
  //   { field: 'currencyName', header: 'Name', width: '70%' },
  //   // { field: 'country', header: 'Role', width: '20%' },
  //   // { field: 'department', header: 'Department', width: '25%' },
  // ];


  digitsAfterDecimal = 3;
  truncationLimit = 4;

  costRevenueAccess: string = 'NONE';
  get showRevenue(): boolean { return this.costRevenueAccess !== 'HIDE_REVENUE' && this.costRevenueAccess !== 'HIDE_BOTH'; }
  get showCost(): boolean { return this.costRevenueAccess !== 'HIDE_COST' && this.costRevenueAccess !== 'HIDE_BOTH'; }
  get isCostRevReadOnly(): boolean { return this.costRevenueAccess === 'READ_ONLY'; }

  // SECTION2 - CONSTRUCTOR
  constructor(
    public mps : MenuPermissionService,
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private leadService: LeadService,
    private calendar: NgbCalendar,
    private modalService: ModalService,
    private modelService: NgbModal,
    private ngbModal: NgbModal,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private datePipe : CustomDatePipe,
    public dropdownStore: DropdownStore,
    private pdfService: PdfDownloadService,
    private quotationPdfService: QuotationPdfService,
    private commonService: CommonService,
    private masterService: MasterService,
    public logoService : LogoService,
    private sideBarService : VerticalSidebarService,
    private operationService: OperationService,
    private cdr: ChangeDetectorRef,
    private emailTriggerService: EmailTriggerService,
    public voiceRecognitionService: VoiceRecognitionService,
    private voiceParserService: VoiceParserService,
  ) {
    effect(() =>{
      const carrierData = this.dropdownStore.customerTypeData();
      this.carriers = carrierData;
    })
  }

  // SECTION3 - NGONIT
  ngOnInit(): void {
    this.costRevenueAccess = this.appSettingService.getCostRevenueAccess();
    const initialQuotationData = this.leadService.getQuotationData();
    const historyState = window.history.state as any;
    const hasSeedData = !!(
      historyState?.dashboardQuoteData ||
      historyState?.enquiryConversionData?.rateRequest ||
      initialQuotationData?.rateRequest
    );

    this.initQuotationForm(!hasSeedData);
    this.subscribeToFormChanges();
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.currentUserEmail = this.userData?.userEmail;
      this.quotationForm.get('ContactNumberCode')?.setValue(this.getDefaultContactDialCode());
    }
     
  
    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    this.MenuMasterSid = Number(sessionStorage.getItem('currentMenuId'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadTermsAndConditionsConfig();
    this.loadCityName();
    this.mps.init().subscribe();
    this.initializeVoiceNavigation();
    this.setupVoiceSubscriptions();
   
   this.loadAllFields();
   this.loadRateLockConfig().then(() => {
    this.checkRateLockPermissions();
  }).catch(error => {
    console.error('Failed to load rate lock config:', error);
     this.canUserLockRates = false;
  });
  
    const dashboardQuoteData = historyState?.dashboardQuoteData;
    const enquiryConversionData = historyState?.enquiryConversionData;
    if (dashboardQuoteData || enquiryConversionData) {
      window.history.replaceState({}, '', window.location.href);
    }

    this.loadAllLookUps().subscribe(() => {
      this.dataFromEnqPage = this.leadService.getQuotationData();
      this.leadService.clearQuotationData();
      if (enquiryConversionData?.rateRequest) {
        this.spinner.show();
        setTimeout(() => {
          this.patchEnqPageValues(enquiryConversionData);
          this.minEffDate = this.todayDate;
          this.f['status']?.disable();
          this.spinner.hide();
        });
      } else if (this.dataFromEnqPage?.rateRequest) {
        this.spinner.show();
        setTimeout(() => {
          this.patchEnqPageValues(this.dataFromEnqPage);
          this.minEffDate = this.todayDate;
          this.f['status']?.disable();
          this.spinner.hide();
        });
      } else if (dashboardQuoteData) {
        this.patchDashboardValues(dashboardQuoteData);
        this.minEffDate = this.todayDate;
        this.f['status']?.disable();
      } else {
        this.activatedRoute.paramMap.subscribe(params => {
          this.QuoteHeaderSid = +params.get('id');
          if (this.QuoteHeaderSid) {
            this.isEditMode = true;
            this.loadQuotation(this.QuoteHeaderSid);
            this.checkAuthorisedPerson(this.userData?.UserMasterSid, this.QuoteHeaderSid);
          } else {
            this.minEffDate = this.todayDate;
            this.f['status']?.disable();
          }
        })
      }
    })
    
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    if (!this.initialFormValue) {
      return false;
    }
    this.isDirty = !this.deepEqual(this.initialFormValue, this.getCurrentFormState());
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onSubmit(resolve);
    });
  }

  private applyQuotationDisableRules(data: any): void {
  if (!this.isEditMode || !data) return;

  const isSuspended = data.status === 'S';

  if (isSuspended) {
    this.quotationForm.disable({ emitEvent: false });
  }
   if (data.quoteRoute) {
    data.quoteRoute.forEach((route: any, routeIndex: number) => {
      route.quoteCarrier?.forEach((carrier: any, carrierIndex: number) => {
        if (carrier.ApprovalStatus === "Approved") {
          const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
          if (routeForm) {
            routeForm.disable({ emitEvent: false });
          }
        }
      });
    });
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
        this.cdr.markForCheck();
      },
      error: () => {
        // Default to enabled if config fetch fails
        this.isTermsAndConditionsEnabled = true;
        this.cdr.markForCheck();
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

  patchEnqPageValues(enqData: any): void {
    this.isPatching = true;
    this.enquiryNumber = enqData?.EnquiryNumber;
    this.quoteRoutes.clear();

    const parsedContact = this.parsePhone(enqData?.ContactNumber);
    const headerFields = [
      'EnquirySid',
      'LeadOrCustomer',
      'PreCustomerMasterSid',
      'CustomerMasterSid',
      'CustomerBranchSid',
      'CustomerRef',
      'CustomerName',
      'CustomerAddress',
      'ContactPerson',
      'ContactNumber',
      'ContactNumberCode',
      'Email',
      'FreightPPCC',
      'SalesmanSid',
      'ClearanceBy',
      'TransportBy'
    ];

    this.quotationForm.patchValue(
      {
        ...headerFields.reduce((obj, field) => ({ ...obj, [field]: enqData?.[field] }), {}),
        ContactNumberCode: parsedContact.phoneCode,
        ContactNumber: parsedContact.phoneNumber
      },
      { emitEvent: false }
    );

    if (!this.quotationForm.get('FreightPPCC')?.value) {
      this.quotationForm.get('FreightPPCC')?.setValue('Prepaid');
    }

    headerFields.forEach(field => {
      if (enqData?.[field]) {
        this.quotationForm.get(field)?.disable({ emitEvent: false });
      }
    });

    const routes = Array.isArray(enqData?.quoteRoutes)
      ? enqData.quoteRoutes
      : [];

    if (!routes.length) {
      this.quoteRoutes.updateValueAndValidity({ emitEvent: false });
      this.cdr.detectChanges();
      this.isPatching = false;
      this.resetUnsavedState();
      return;
    }

    const segment = this.getSegmentTypeFromShipmentType(enqData?.ShipmentType);

    for (const [routeIndex, route] of routes.entries()) {
      const cargoGroups = Array.isArray(route?.quoteCargo) && route.quoteCargo.length
        ? route.quoteCargo
        : (Array.isArray(route?.enquiryCargo) ? route.enquiryCargo : []);
      const primaryCargo = cargoGroups[0] || this.extractCargoData(route?.enquiryCargo);
      const isFclRoute = this.isFclQuotationSegment(segment);

      const routeData = {
        QuoteRouteSid: route?.QuoteRouteSid || null,
        DepartmentMasterSid: enqData?.DepartmentMasterSid || null,
        PORSid: route?.PORSid || null,
        POLSid: route?.POLSid || null,
        PODSid: route?.PODSid || null,
        FPODSid: route?.FPODSid || route?.FDPSid || null,
        CarrierMasterSid: route?.CarrierMasterSid || null,
        CarrierName: route?.CarrierName || '',
        CargoType: primaryCargo?.CargoType || route?.CargoType || 'General',
        ContainerType: primaryCargo?.ContainerType || route?.ContainerType || null,
        BookingHeaderSid: route?.BookingHeaderSid || null,
        BookingNo: route?.BookingNo || route?.bookingHeader?.BookingNo || '',
        Qty: primaryCargo?.Qty || route?.Qty || 1,
        GrossWeight: primaryCargo?.GrossWeight || route?.GrossWeight || 0,
        NetWeight: primaryCargo?.NetWeight || route?.NetWeight || 0,
        Volume: primaryCargo?.Volume || route?.Volume || 1,
        ContainerQty: Number(primaryCargo?.ContainerQty || route?.ContainerQty) || 1,
        CBM: primaryCargo?.CBM || route?.CBM || 1,
        ChargeableWeight: primaryCargo?.ChargeableWeight || route?.ChargeableWeight || 0,
        effDate: new Date(),
        expDate: null,
        TransitDays: route?.TransitDays || '',
        ServiceLevel: route?.ServiceLevel || null,
        POLFreeDays: route?.POLFreeDays || 0,
        PODFreeDays: route?.PODFreeDays || 0,
        FreightPPCC: enqData?.FreightPPCC || 'Prepaid',
        authorizerStatus: route?.authorizerStatus || 'Pending',
        segmentType: segment,
        ShipmentTerms: primaryCargo?.ShipmentTerms || route?.ShipmentTerms || null,
        PackageType: primaryCargo?.PackageType || route?.PackageType || null,
        PackageQty: primaryCargo?.PackageQty || route?.PackageQty || null,
        CargoDescription: primaryCargo?.CargoDescription || route?.CargoDescription || null
      };

      this.addQuoteRoute(routeData);
      const addedRouteIndex = this.quoteRoutes.length - 1;
      this.addQuoteCarrier(addedRouteIndex);

      if (isFclRoute) {
  cargoGroups.forEach((cargo: any) => {
    this.addQuoteCargo(addedRouteIndex, {
      ...cargo,
      isFromEnquiry: true   // ✅ ADD THIS HERE ONLY
    });
  });
} else {
        this.addQuoteProduct(addedRouteIndex, {
          Sno: 1,
          ProductSid: null,
          ProductName: primaryCargo?.ProductName || route?.ProductName,
          PackageType: primaryCargo?.PackageType || route?.PackageType,
          CargoDescription: null,
          GrossWeight: primaryCargo?.GrossWeight || route?.GrossWeight,
          NetWeight: primaryCargo?.NetWeight || route?.NetWeight,
          ChargeableWeight: primaryCargo?.ChargeableWeight || route?.ChargeableWeight,
          Volume: primaryCargo?.Volume || route?.Volume || route?.CBM,
          ExternalPkg: this.resolvePackageTypeSid(primaryCargo?.PackageTypeId || route?.PackageTypeId || primaryCargo?.PackageType || route?.PackageType),
          ExternalQty: primaryCargo?.PackageQty || route?.PackageQty,
          Length: primaryCargo?.length || route?.length,
          Volumetric: primaryCargo?.Volumetric || route?.Volumetric,
          Width: primaryCargo?.width || route?.width,
          Height: primaryCargo?.height || route?.height,
          ProductUnit: this.resolvePackageTypeSid(primaryCargo?.PackageTypeId || route?.PackageTypeId || primaryCargo?.PackageType || route?.PackageType)
        });

        cargoGroups.slice(1).forEach((cargo: any) => {
  this.addQuoteCargo(addedRouteIndex, {
    ...cargo,
    isFromEnquiry: true   // ✅ ADD HERE ALSO
  });
});
      }

      this.onRouteChange(addedRouteIndex);

      const routeGroup = this.quoteRoutes.at(addedRouteIndex);
      const fieldsToDisable = [
        'DepartmentMasterSid',
        'PORSid',
        'POLSid',
        'PODSid',
        'FPODSid',
        'CargoType',
        'ContainerType',
        'CBM',
        'ChargeableWeight',
        'ServiceLevel'
      ];

      fieldsToDisable.forEach(field => {
        if (routeData[field] !== null && routeData[field] !== undefined) {
          routeGroup.get(field)?.disable({ emitEvent: false });
        }
      });
    }

    this.quoteRoutes.updateValueAndValidity({ emitEvent: false });
    this.cdr.detectChanges();
    this.isPatching = false;
    this.resetUnsavedState();
  }

  patchDashboardValues(data: any): void {
    this.isPatching = true;
    this.quotationForm.patchValue(
      {
        LeadOrCustomer: true,
        SalesmanSid: data?.SalesmanSid,
      },
      { emitEvent: false }
    );

    if (data?.CustomerMasterSid) {
      this.customerlist = this.customerlist.filter(
        c => c.CustomerMasterSid === data.CustomerMasterSid
      );

      if (this.customerlist.length > 0) {
        const firstItem = this.customerlist[0];
        const parsedContact = this.parsePhone(firstItem.ContactNumber);

        this.quotationForm.patchValue({
          CustomerMasterSid: firstItem.CustomerMasterSid,
          CustomerName: firstItem.CustomerName,
          CustomerAddress: firstItem.Address,
          Email: firstItem.Email,
          CustomerBranchSid: firstItem.CustomerBranchSid,
          ContactPerson: firstItem.ContactPerson,
          ContactNumberCode: parsedContact.phoneCode,
          ContactNumber: parsedContact.phoneNumber
        });

        ['CustomerMasterSid', 'CustomerName', 'CustomerAddress', 'Email', 'CustomerBranchSid', 'ContactPerson', 'ContactNumber', 'LeadOrCustomer', 'SalesmanSid']
          .forEach(key => {
            if (this.quotationForm.get(key)?.value) {
              this.quotationForm.get(key)?.disable({ emitEvent: false });
            }
          });
      } else {
        console.info(`Customer with Branch not found for CustomerMasterSid ${data.CustomerMasterSid}`);
        ['LeadOrCustomer', 'SalesmanSid'].forEach(key => {
          if (this.quotationForm.get(key)?.value) {
            this.quotationForm.get(key)?.disable({ emitEvent: false });
          }
        });
      }
    } else {
      const parsedContact = this.parsePhone(data?.ContactNumber);
      this.quotationForm.patchValue({
        CustomerMasterSid: data?.CustomerMasterSid,
        CustomerName: data?.CustomerName,
        CustomerAddress: data?.Address,
        Email: data?.Email,
        SalesmanSid: data?.SalesmanSid,
        ContactPerson: data?.ContactPerson,
        ContactNumber: parsedContact.phoneNumber
      });

      ['CustomerMasterSid', 'CustomerName', 'CustomerAddress', 'Email', 'ContactPerson', 'ContactNumber', 'LeadOrCustomer', 'SalesmanSid']
        .forEach(key => {
          if (this.quotationForm.get(key)?.value) {
            this.quotationForm.get(key)?.disable({ emitEvent: false });
          }
        });
    }
    this.isPatching = false;
    this.resetUnsavedState();
  }

    loadCityName(): void {
    if (!this.currentBranchCityId) return;


    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {
        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
        }

 
      },
      error: (error) => {
        console.error("Failed to load city:", error);
   
      }
    });
  }
private getSegmentTypeFromShipmentType(shipmentType: string): string {
  const normalizedShipmentType = this.normalizePortText(shipmentType);

  if (normalizedShipmentType.includes('AIR')) {
    return 'AIR';
  }
  if (normalizedShipmentType.includes('FCL')) {
    return 'FCL';
  }
  if (normalizedShipmentType.includes('LCL')) {
    return 'LCL';
  }
  if (normalizedShipmentType.includes('ROAD')) {
    return 'ROAD';
  }
  if (normalizedShipmentType.includes('TRANSPORT')) {
    return 'TRANSPORT';
  }
  if (normalizedShipmentType.includes('OTHER')) {
    return 'OTHERS';
  }

  return 'LCL';
}

// Helper method to extract cargo data
private extractCargoData(enquiryCargo: any[]): any {
  if (!enquiryCargo || !Array.isArray(enquiryCargo) || enquiryCargo.length === 0) {
    return {};
  }
  
  // Return the first cargo item (you might want to handle multiple cargo items differently)
  return enquiryCargo[0];
}

private getRouteCargoGroups(route: any): any[] {
  if (!route) {
    return [];
  }

  if (Array.isArray(route.quoteCargo) && route.quoteCargo.length > 0) {
    return route.quoteCargo;
  }

  return route.quoteCargo ? [route.quoteCargo] : [];
}

private getQuotationCargoProducts(cargo: any): any[] {
  if (!cargo) {
    return [];
  }

  if (Array.isArray(cargo.quoteProducts) && cargo.quoteProducts.length > 0) {
    return cargo.quoteProducts;
  }

  if (Array.isArray(cargo.quoteProduct) && cargo.quoteProduct.length > 0) {
    return cargo.quoteProduct;
  }

  if (Array.isArray(cargo.products) && cargo.products.length > 0) {
    return cargo.products;
  }

  return [];
}

  private resolveContainerTypeSid(containerTypeValue: any): number | null {
    if (!containerTypeValue) {
      return null;
    }

  const containerType = this.containerTypeList.find(type =>
    type.ContainerCode === containerTypeValue ||
    type.ContainerName === containerTypeValue
  );

  return containerType?.ContainerTypeMasterSid || null;
}

private resolveContainerTypeName(containerTypeValue: any): string | null {
  if (!containerTypeValue) {
    return null;
  }

  const resolvedSid = this.resolveContainerTypeSid(containerTypeValue);
  const containerType = this.containerTypeList.find(type =>
    Number(type.ContainerTypeMasterSid) === Number(resolvedSid)
  );

  return containerType?.ContainerTypeName || null;
}

private getTariffCargoDisplayLabel(cargo: any, isFclRoute: boolean): string {
  const cargoType = cargo?.CargoType || '';
  const containerType =
    cargo?.ContainerTypeName ||
    this.getContainerTypeDisplay(cargo?.ContainerType) ||
    '';

  if (isFclRoute) {
    return [cargoType, containerType].filter(Boolean).join(' - ');
  }

  return cargoType || containerType;
}

private getTariffGroupLabel(cargo: any, index: number, isFclRoute: boolean): string {
  const cargoLabel = this.getTariffCargoDisplayLabel(cargo, isFclRoute);
  return cargoLabel ? `Cargo ${index + 1} (${cargoLabel})` : `Cargo ${index + 1}`;
}

private resolveTariffQtyValue(
  routeForm: FormGroup,
  cargoItems: any[],
  charge: any,
  tariffDetail?: any
): number {
  const qtySourceField = this.findFieldForQty(charge?.UnitQty);

  if (qtySourceField === 'NoofContainers') {
    const matchingCargoItems = cargoItems.filter((cargo: any) =>
      this.isMatchingContainerQtyCargo(cargo, charge?.UnitQty, tariffDetail)
    );

    const totalContainers = matchingCargoItems.reduce((sum: number, cargo: any) => {
      return sum + (Number(cargo?.NoofContainers) || 0);
    }, 0);

    return totalContainers || 1;
  }

  if (typeof qtySourceField === 'string' && routeForm.get(qtySourceField)) {
    return Number(routeForm.get(qtySourceField)?.value) || 1;
  }

  if (typeof qtySourceField === 'number') {
    return qtySourceField;
  }

  return 1;
}

private isMatchingContainerQtyCargo(cargo: any, unitQty: any, tariffDetail?: any): boolean {
  const cargoContainerTypeSid = Number(cargo?.ContainerType);
  const tariffContainerTypeSid = Number(tariffDetail?.ContainerType);

  if (cargoContainerTypeSid && tariffContainerTypeSid) {
    return cargoContainerTypeSid === tariffContainerTypeSid;
  }

  const normalizedUnitQty = String(unitQty || '').trim().toUpperCase();
  const cargoContainer = this.containerTypeList.find(
    (type: any) => Number(type.ContainerTypeMasterSid) === cargoContainerTypeSid
  );
  const cargoContainerCode = String(cargoContainer?.ContainerCode || '').trim().toUpperCase();

  if (normalizedUnitQty.includes('20FT') || normalizedUnitQty === '20FT' || normalizedUnitQty === '20F') {
    return cargoContainerCode === '20F';
  }

  if (normalizedUnitQty.includes('40FT') || normalizedUnitQty === '40FT' || normalizedUnitQty === '40F') {
    return cargoContainerCode === '40F';
  }

  if (normalizedUnitQty.includes('45FT') || normalizedUnitQty === '45FT' || normalizedUnitQty === '45F') {
    return cargoContainerCode === '45F';
  }

  return true;
}

private isHazardous(value: any): boolean {
  return value === true || value === 'Y' || value === 'y' || value === 1 || value === '1';
}

  private mapQuotationCargoProduct(product: any): any {
    return {
      ProductName: product.ProductName || '',
      ExternaPkg: this.resolvePackageTypeSid(
        product.PackageTypeId ?? product.ExternalPkg ?? product.ProductUnit ?? product.PackageType
      ),
      ExternlQty: product.ExternalQty ?? product.ExternlQty ?? '',
      GrossWeight: product.GrossWeight,
      NetWeight: product.NetWeight,
    Volume: product.Volume,
    IsHaz: product.IsHaz,
    ImcoClass: product.ImcoClass,
    UnNo: product.UnNo,
    PkgGroup: product.PkgGroup,
    Length: product.Length,
    Width: product.Width,
    Height: product.Height,
    UomMasterSid: product.UomMasterSid,
    Volumetric: this.deriveProductVolumetric(product),
  };
}

private mapQuotationCargoForBooking(cargo: any): any {
  return {
    BookingCargoSid: cargo?.BookingCargoSid || null,
    CargoType: cargo?.CargoType || "General",
    GrossWeight: cargo?.GrossWeight || 0,
    NetWeight: cargo?.NetWeight || 0,
    Volume: cargo?.Volume || 0,
    Volumetric: cargo?.Volumetric || 0,
    ChargeableWeight: cargo?.ChargeableWeight || 0,
    ContainerType: this.resolveContainerTypeSid(cargo?.ContainerType),
    NoofContainers: cargo?.Qty || cargo?.NoofContainers || 0,
    NoOfPackage: cargo?.PackageQty || cargo?.NoOfPackage || 0,
    ShipmentTerms: cargo?.ShipmentTerms || null,
  };
}


  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
  }
  
  checkAuthorisedPerson(UserMasterSid, QuoteHeaderSid) {
    const currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
    if (!UserMasterSid || !currentMenuId) {
      return;
    }
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: currentMenuId,
      UserMasterSid: UserMasterSid,
      DocumentSid: QuoteHeaderSid
    }

    

    // if(this.quotationApproved){
    //   return;
    // }


    this.leadService.isUserAuthorizer(payload).subscribe(
      (resp: any) => {
        const data = resp.data;
        this.isAuthorizedUser = data?.canAuthorize;
        const currentUserId = this.userData?.UserMasterSid || 'NA';
        this.authorizerDetails = {
          isAuthorizer : data?.canAuthorize,
          isAlreadyApproved : data?.alreadyApproved,
          canAuthorize : data?.canAuthorize && !data?.alreadyApproved,
          AuthorityLevel : data?.AuthorityLevel,
          AuthorityDetailSid : data?.AuthorityDetailSid,
          ApprovedBy : currentUserId
        }
        if(!this.isAuthorizedUser){
          this.quoteRoutes.controls.forEach((route: FormGroup, routeIndex: number) => {
            const carrierArr = this.quoteCarriers(routeIndex);
            carrierArr.controls.forEach((carrier: FormGroup) => {
              carrier.get('authorizerStatus')?.enable();
            })
          })
        } else {
          this.quoteRoutes.controls.forEach((route: FormGroup, routeIndex: number) => {
            const carrierArr = this.quoteCarriers(routeIndex);
            carrierArr.controls.forEach((carrier: FormGroup) => {
              carrier.get('authorizerStatus')?.disable();
            })
          })
        }
      }
    )
  }

  // SECTION4 - FORM AND FORM ARRAY RELATION
  initQuotationForm(seedDefaultRoute: boolean = true) {
    const today = getDefaultTodayDate();
    this.quotationForm = this.fb.group({
      LeadOrCustomer : [true],
      PreCustomerMasterSid : [null],
      CustomerMasterSid: [null],
      FreightPPCC : ["Prepaid"],
      CustomerRef: [''],
      Email: [''],
      status: ['Active'],
      SalesmanSid: [null],
      quoteRoutes: this.fb.array([]),
      CustomerName: [''],
      CustomerAddress: ['', [Validators.required]],
      CustomerBranchSid : [null],
      QuoteNumber: [{value : '', disabled: true}],
      QuoteDate: [today],
      EnquirySid: [''],
      AgreedRate : [false],
      BookingHeaderSid: [null],
      IsContract:[false],
      RateLock: [false],
      ContactPerson:[''],
      ContactNumberCode: [this.getDefaultContactDialCode()],
      ContactNumber: ['', [Validators.maxLength(15), this.phoneNumberValidator]]
    })
    if (seedDefaultRoute) {
      this.addQuoteRoute();
    }
    this.quotationForm.get('EnquirySid')?.disable();
    this.quoteRoutes.controls.forEach((route, index) => {
      route.get('PODSid')?.valueChanges.subscribe(() => this.onRouteChange(index));
      route.get('POLSid')?.valueChanges.subscribe(() => this.onRouteChange(index));
    });
    this.subscribeToLeadCustomerToggle(); 
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
      phoneCode: parsed.phoneCode || this.getDefaultContactDialCode(),
      phoneNumber: parsed.phoneNumber
    };
  }

  private getDefaultContactDialCode(): string {
    return DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData);
  }

  private withDialCode(phoneValue: any, dialCode?: string): string {
    return DialCodeDropdownComponent.buildPhoneWithDialCode(
      phoneValue,
      dialCode || this.getDefaultContactDialCode()
    );
  }

  subscribeToLeadCustomerToggle() {
    this.quotationForm.get('LeadOrCustomer')?.valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe(isCustomer => {
      this.toggleCustomerType(isCustomer);
    });
  }

  toggleCustomerType(isCustomer: boolean) {
    this.quotationForm.patchValue({
      PreCustomerMasterSid: null,
      CustomerMasterSid: null,
      customerName: '',
      CustomerAddress: null,
      CustomerBranchSid: null,
      Email: null,
      ContactNumberCode: this.getDefaultContactDialCode(),
      ContactNumber: null,
      ContactPerson: null,
    });
    this.cusBranchList = [];

    const preCustomerControl = this.quotationForm.get('PreCustomerMasterSid');
    const customerControl = this.quotationForm.get('CustomerMasterSid');

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

  onSelectionChange(selectedItem: any) {

    if (!selectedItem) {
      this.quotationForm.patchValue({
        CustomerMasterSid : null,
        CustomerName: '',
        CustomerAddress: null,
        CustomerBranchSid: null,
        Email: null,
        ContactNumberCode: this.getDefaultContactDialCode(),
        ContactNumber: null,
        ContactPerson: null,
      });
      this.cusBranchList = [];
      return;
    }

    const isCustomer = this.quotationForm.get('LeadOrCustomer')?.value;
    if (isCustomer) {
      const parsedContact = this.parsePhone(selectedItem.ContactNumber);
      this.quotationForm.patchValue({
        CustomerMasterSid : selectedItem.CustomerMasterSid,
        CustomerName: selectedItem.CustomerName,
        CustomerAddress: selectedItem.Address,
        Email: selectedItem.Email,
        CustomerBranchSid: selectedItem.CustomerBranchSid,
        ContactPerson:selectedItem.ContactPerson,
        ContactNumberCode: parsedContact.phoneCode,
        ContactNumber: parsedContact.phoneNumber
      });
      this.handleCustomerChangeOnCharges(selectedItem);
    } else {
      const parsedContact = this.parsePhone(selectedItem.phone);
      this.quotationForm.patchValue({
        CustomerName: selectedItem.preCustomerName,
        CustomerAddress: selectedItem.preCustomerAddress1,
        Email: selectedItem.email,
        CustomerBranchSid: null,
        ContactPerson:selectedItem.contactPerson,
        ContactNumberCode: parsedContact.phoneCode,
        ContactNumber: parsedContact.phoneNumber
      });
      this.patchSalespersonOfLead(selectedItem.PreCustomerMasterSid);
    }
  }

  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.quotationForm.controls;
  }

  // Quote Route
  get quoteRoutes(): FormArray {
    return this.quotationForm.get('quoteRoutes') as FormArray;
  }

  addQuoteRoute(data?: any) {
    const routeForm = this.fb.group({

      // Route Related Controls
      QuoteRouteSid: [data?.QuoteRouteSid || null],
      DepartmentMasterSid: [data?.DepartmentMasterSid || null, [Validators.required]],
      POLFreeDays: [data?.POLFreeDays || 0],
      PODFreeDays: [data?.PODFreeDays || 0],
      PORSid: [data?.PORSid ?? null],
      POLSid: [data?.POLSid ?? null, [Validators.required]],
      PODSid: [data?.PODSid ?? null, [Validators.required]],
      FPODSid: [data?.FPODSid ?? data?.FDPSid ?? null],
      effDate: [data?.effDate ? data?.effDate : null, [Validators.required]],
      expDate: [data?.expdate ? data?.expdate : null, [Validators.required]],
      TransitDays: [data?.TransitDays || ''],
      segmentType: [data?.segmentType || 'LCL', [Validators.required]],
      ServiceLevel: [data?.ServiceLevel || null], // Inco terms
      FreightPPCC : [{value : data?.FreightPPCC || null, disabled : true}],
      
      // Cargo Related Controls (Route wise single)
      QuoteCargoSid : [data?.QuoteCargoSid || null],
      CargoType: [data?.CargoType || null, [Validators.required]],
      WeightUnitSid: [data?.WeightUnitSid || null],
      GrossWeight: [
        data?.GrossWeight ? 
          Number(data?.GrossWeight).toFixed(this.digitsAfterDecimal) : 
          0 || 0
      ],
      NetWeight: [
        data?.NetWeight ? 
        Number(data?.NetWeight).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      Volume: [
        data?.Volume ? 
        Number(data?.Volume).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      ChargeableWeight: [
        data?.ChargeableWeight ?
        Number(data?.ChargeableWeight).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      ContainerType: [data?.ContainerType || null],
      Qty: [data?.Qty || 1],
      ShipmentTerms: [data?.ShipmentTerms || null],
      BookingHeaderSid: [data?.BookingHeaderSid || null], // Keep this for form value
      BookingNo: [data?.BookingNo || ''],

      // FormArrays (Route wise multiple)
      quoteCarriers : this.fb.array([]),
      quoteProducts : this.fb.array([]),
      quoteCargo : this.fb.array([]),
    })
    const routeIndex = this.quoteRoutes.length;
    this.quoteRoutes.push(routeForm);
    
    this.filteredPORPorts[routeIndex] = [];
    this.filteredPOLPorts[routeIndex] = [];
    this.filteredPODPorts[routeIndex] = [];
    this.filteredFPODPorts[routeIndex] = [];
    this.onRouteChange(routeIndex);
    this.handleValidationOnDept(routeIndex,data?.segmentType || 'LCL');
    if (data === null || data === undefined || !data) {
      this.addQuoteCarrier(this.quoteRoutes.length - 1);
      const today = getDefaultTodayDate();
      routeForm.get('effDate')?.setValue(today);
    } else {
      this.filterChargesBySegment(routeIndex,data?.segmentType)
    }

    routeForm.get('GrossWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(routeForm);
    });
    routeForm.get('NetWeight')?.valueChanges.subscribe(() => {
      this.setOrResetWeightError(routeForm);
    });
    this.setupDynamicQtyUpdates(routeIndex);
  }

  setOrResetWeightError(formGroup: FormGroup) {
    const grossCtrl = formGroup.get('GrossWeight');
    const grossValue = formGroup.get('GrossWeight')?.value;
    const netValue = formGroup.get('NetWeight')?.value;

    if (!grossValue || !netValue) {
      grossCtrl.setErrors(null);
      return;
    }
    if(grossCtrl) {
      if(Number(grossValue) <= Number(netValue)) {
        grossCtrl.setErrors({ grossNotGreater: true });
      } else {
        grossCtrl.setErrors(null);
      }
    } 
  }

  removeRoute(routeIndex: number, QuoteRouteSid: number) {
    const route = this.quoteRoutes.at(routeIndex)?.value;
    if (this.isRouteApproved(routeIndex)) {
      this.appSettingService.showError("Approved route cannot be deleted.");
      return;
    }
     if (route?.bookingHeader) {
    this.appSettingService.showError("Booking already created. Cannot delete this route.");
    return;
  }
    if (QuoteRouteSid) {
      this.leadService.deleteRoute(QuoteRouteSid).subscribe((resp: any) => {
        if (resp.status) {
          this.removeQuoteRoute(routeIndex);
          this.loadQuotation(this.QuoteHeaderSid);
        } else {
          this.appSettingService.showError("Error deleting route")
        }
      }, error => {
        console.error('Error deleting route:', error);
      });
    } else {
      this.quoteRoutes.removeAt(routeIndex);
    }
  }
  // helper
  removeQuoteRoute(routeIndex: number) {
    this.quoteRoutes.removeAt(routeIndex);
    this.filteredUnits.splice(routeIndex, 1);
    this.filteredPORPorts.splice(routeIndex, 1);
    this.filteredPOLPorts.splice(routeIndex, 1);
    this.filteredPODPorts.splice(routeIndex, 1);
    this.filteredFPODPorts.splice(routeIndex, 1);
  }


  // Quote Carrier
  quoteCarriers(routeIndex: number): FormArray {
    return this.quoteRoutes.at(routeIndex).get('quoteCarriers') as FormArray;
  }

  createQuoteCarrier(data?: any) {
    return this.fb.group({
      QuoteCarrierSid : [data?.QuoteCarrierSid || null],
      CarrierMasterSid : [data?.CarrierMasterSid || null],
      CarrierName : [data?.CarrierName || ''],
      TransitTime : [data?.TransitTime || null],
      authorizerStatus : [data?.authorizerStatus || 'Pending'],

      quoteCharges : this.fb.array([])
    })
  }

  addQuoteCarrier(routeIndex: number, data?: any) {
    const carrierForm = this.fb.group({
      QuoteCarrierSid : [data?.QuoteCarrierSid || null],
      CarrierMasterSid : [data?.CarrierMasterSid || null],
      CarrierName : [data?.CarrierName || ''],
      TransitTime : [data?.TransitTime || null],
      authorizerStatus : [data?.ApprovalStatus || 'Pending'],
      authorizerRemarks : [data?.Remarks || ''],
      ApprovedBy : [data?.ApprovedBy || ''],

      quoteCharges : this.fb.array([])
    })
    this.quoteCarriers(routeIndex).push(carrierForm);
    if (data?.ApprovalStatus === "Approved") {
      carrierForm.disable({ emitEvent: false });
    }

    if(!data || data === undefined){
      this.addQuoteCharge(routeIndex,this.quoteCarriers(routeIndex).length - 1);
    }
    this.updateCarrierValidationBasedOnStatus(carrierForm);
    if (data?.ApprovalStatus === "Approved") {
      carrierForm.get('authorizerStatus')?.disable({ emitEvent: false });
    }
    this.subscription.add(
      carrierForm.get('authorizerStatus')?.valueChanges.subscribe(value => {
       this.updateCarrierValidationBasedOnStatus(carrierForm);
      })
    )
    this.syncCarrierSelectionState(routeIndex, this.quoteCarriers(routeIndex).length - 1, data);
    carrierForm.updateValueAndValidity();
  }

  updateCarrierValidationBasedOnStatus = (form: FormGroup) => {
  const status = form.get('authorizerStatus')?.value;
  const approvedByControl = form.get('ApprovedBy');
  const remarksControl = form.get('authorizerRemarks');
  
  // Clear existing validators first
  approvedByControl?.clearValidators();
  remarksControl?.clearValidators();
  
  if (status === 'Approved' || status === 'Rejected') {
    approvedByControl?.setValidators([Validators.required]);
    approvedByControl?.enable({ emitEvent: false });
  } else {
    approvedByControl?.disable({ emitEvent: false });
  }
  
  if (status === 'Counter') {
    remarksControl?.setValidators([Validators.required]);
  }
  if (status === 'Approved') {
    remarksControl?.disable({ emitEvent: false });
  } else {
    remarksControl?.enable({ emitEvent: false });
  }
  
  approvedByControl?.updateValueAndValidity();
  remarksControl?.updateValueAndValidity();
  form.updateValueAndValidity();
};

  handleCarrierChange(carrier: any, routeIndex: number, carrierIndex: number) {
    const routeForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
    if (!carrier || carrier === undefined) {
      routeForm.get('CarrierName').setValue('');
      return;
    }
    routeForm.get('CarrierName').setValue(carrier.CustomerName);
  }

  deleteCarrier(routeIndex: number, carrierIndex: number, QuoteCarrierSid: number) {
    const carrierArr = this.quoteCarriers(routeIndex);
    if (QuoteCarrierSid) {
      this.leadService.deleteCarrier(QuoteCarrierSid).subscribe((resp: any) => {
        if (resp.status) {
          carrierArr.removeAt(carrierIndex);
          this.appSettingService.showSuccess("Carrier Deleted Successfully");
          this.quotationForm.updateValueAndValidity();
        } else {
          this.appSettingService.showError("Error deleting carrier");
        }
      })
    } else {
      carrierArr.removeAt(carrierIndex);
      this.appSettingService.showSuccess("Carrier Deleted Successfully");
      this.quotationForm.updateValueAndValidity();
    }
  }

  // Quote Charge
  quoteCharges(routeIndex: number,carrierIndex:number): FormArray {
    return this.quoteCarriers(routeIndex).at(carrierIndex).get('quoteCharges') as FormArray;
  }

  quoteCargo(routeIndex: number): FormArray {
    return this.quoteRoutes.at(routeIndex).get('quoteCargo') as FormArray;
  }
  get isContract(): boolean {
  return this.quotationForm.get('IsContract')?.value === true;
}

  isSavedContract(): boolean {
  return this.quotationData?.IsContract === 'Y';
}

  isContractValid(): boolean {
  // If not a contract, return true (no expiration check needed)
  if (!this.f['IsContract']?.value) {
    return true;
  }
  
  // Check all routes for expiration dates
  if (this.quoteRoutes && this.quoteRoutes.length > 0) {
    const currentDate = getDefaultTodayDate();
    
    // Check if any route has a valid expiration date
    return this.quoteRoutes.controls.some((route: FormGroup) => {
      const expDate = route.get('expDate')?.value;
      if (!expDate) return false;
      
      const expirationDate = new Date(expDate);
      return currentDate <= expirationDate;
    });
  }
  
  return false;
}

  addQuoteCharge(routeIndex: number,carrierIndex:number, data?: any) {
    if (this.costRevenueAccess === 'READ_ONLY' && (data === undefined || data === 'manual')) {
      if (data === 'manual') this.toastr.warning(`Adding a charge is not allowed. Cost/Revenue access for this branch is set to '${this.costRevenueAccess}'. Please contact your admin to change the access in User Master.`, 'Access Restricted', { timeOut: 6000 });
      return;
    }
    if (this.costRevenueAccess === 'HIDE_BOTH') {
      if (data === 'manual') {
        this.toastr.warning(
          `Adding a charge is not allowed. Cost/Revenue access for this branch is set to '${this.costRevenueAccess}'. Please contact your admin to change the access in User Master.`,
          'Access Restricted',
          { timeOut: 6000 }
        );
      }
      return;
    }
    const defaultRevenueCustomerMasterSid =
      data?.RevenueCustomerMasterSid ?? this.quotationForm.get('CustomerMasterSid')?.value ?? null;
    const defaultRevenueCustomerBranchSid =
      data?.RevenueCustomerBranchSid ?? this.quotationForm.get('CustomerBranchSid')?.value ?? null;

    const chargeForm = this.fb.group({
      QuoteChargeSid : [data?.QuoteChargeSid || null],
      QuoteRouteSid : [data?.QuoteRouteSid || null],
      QuoteHeaderSid : [data?.QuoteHeaderSid || null],
      QuoteCarrierSid : [data?.QuoteCarrierSid || null],

      ChargeUomSid : [data?.ChargeUomSid || null, [Validators.required]],
      ChargeDisplayName : [data?.ChargeDisplayName, [Validators.required]],
      Qty : [data?.Qty || 1],
      unitQtyBasis: [data?.UnitQty || null],  // This is to track Charge Based on Unit Qty
      TariffCargoType: [data?.TariffCargoType || null],
      TariffContainerType: [data?.TariffContainerType || null],

      RevenueChargeUomSid: [data?.RevenueChargeUomSid || null, [Validators.required]],
      RevenuePrepaidCollect: [data?.RevenuePrepaidCollect || "Prepaid"],
      RevenueCurrencyMasterSid: [data?.RevenueCurrencyMasterSid || null, [Validators.required]],
      RevenueExchangeRate: [
        data?.RevenueExchangeRate ? 
        Number(data?.RevenueExchangeRate).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      RevenueRate: [
        data?.RevenueRate ?
        Number(data?.RevenueRate).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      RevenueNumberOfUnit: [data?.RevenueNumberOfUnit || 0],
      RevenueDrCr: [data?.RevenueDrCr || "C"],
      RevenueAmount: [
        data?.RevenueAmount ?
        Number(data?.RevenueAmount).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      RevenueLocalAmount: [
        data?.RevenueLocalAmount ?
        Number(data?.RevenueLocalAmount).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],
      RevenueCustomerMasterSid: [defaultRevenueCustomerMasterSid], // Revenue Vendor
      RevenueCustomerBranchSid: [defaultRevenueCustomerBranchSid],

      CostChargeUomSid : [data?.CostChargeUomSid || null, [Validators.required]],  // Cost Unit
      CostPrepaidCollect : [data?.CostPrepaidCollect || "Prepaid"],
      CostCurrencyMasterSid : [data?.CostCurrencyMasterSid || null, [Validators.required]], // Cost Currency
      CostExchangeRate : [
        data?.CostExchangeRate ?
        Number(data?.CostExchangeRate).toFixed(this.digitsAfterDecimal) :
        0 || 0
      ], // Cost Exchange
      CostRate : [
        data?.CostRate ?
        Number(data?.CostRate).toFixed(this.digitsAfterDecimal) :
        0 || 0
      ],    // Cost Per Unit Rate
      CostNumberOfUnit : [data?.CostNumberOfUnit || 0],  // Count
      CostDrCr : [data?.CostDrCr || "D"],
      CostAmount : [
        data?.CostAmount ? 
        Number(data?.CostAmount).toFixed(this.digitsAfterDecimal) : 
        0 || 0
      ],   // Cost Amount
      CostLocalAmount : [
        data?.CostLocalAmount ?
        Number(data?.CostLocalAmount).toFixed(this.digitsAfterDecimal) :
        0 || 0
      ], // Cost Local Amount
      CostAgentMasterSid : [data?.CostAgentMasterSid || null],  // Cost Party
      CostAgentBranchSid : [data?.CostAgentBranchSid || null],



      TariffDetailSid : [data?.TariffDetailSid || null] 
    })
    chargeForm.get('ChargeDisplayName')?.disable();
    const costPerUnitCtrl = chargeForm.get('CostRate');
    const costAgentMasterSidCtrl = chargeForm.get('CostAgentMasterSid');

    costAgentMasterSidCtrl?.valueChanges.subscribe(value => {
      if (value) {
        costPerUnitCtrl?.setValidators([Validators.required]);
        costPerUnitCtrl?.markAsTouched();
      } else {
        costPerUnitCtrl?.clearValidators();
      }
      costPerUnitCtrl?.updateValueAndValidity();
    });

    if (costAgentMasterSidCtrl.value) {
      costPerUnitCtrl.setValidators([Validators.required]);
      costPerUnitCtrl.markAsTouched();
      costPerUnitCtrl.updateValueAndValidity();
    }
    if (this.costRevenueAccess === 'READ_ONLY') {
      chargeForm.disable({ emitEvent: false });
    }
    this.quoteCharges(routeIndex,carrierIndex).push(chargeForm)
    this.handlePartyOnChargePPCC();
  }

  setupDynamicQtyUpdates(routeIndex: number): void {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    if (!routeForm) return;

    const fieldsToWatch = ['GrossWeight', 'Volume', 'ChargeableWeight', 'Qty'];

    this.subscription.add(
      merge(
        ...fieldsToWatch
          .filter(field => routeForm.get(field)) 
          .map(field => routeForm.get(field)!.valueChanges)
      ).pipe(
        debounceTime(150),
        distinctUntilChanged()
      ).subscribe(() => {
        this.updateAllChargeQuantitiesForRoute(routeIndex);
      })
    );
  }

  private updateAllChargeQuantitiesForRoute(routeIndex: number): void {
    const routeForm = this.quoteRoutes.at(routeIndex);
    if (!routeForm) return;

    const carriers = routeForm.get('quoteCarriers') as FormArray;
    carriers.controls.forEach((carrier, carrierIndex) => {
      const charges = (carrier as FormGroup).get('quoteCharges') as FormArray;
      charges.controls.forEach((charge, chargeIndex) => {
        this.updateSingleChargeQty(routeIndex, carrierIndex, chargeIndex);
      });
    });
  }

  updateSingleChargeQty(routeIndex: number, carrierIndex: number, chargeIndex: number): void {
    const chargeGroup = this.quoteCharges(routeIndex, carrierIndex).at(chargeIndex) as FormGroup;
    const routeGroup = this.quoteRoutes.at(routeIndex) as FormGroup;
    const chargeRawValue = chargeGroup.getRawValue();
    const quoteCargoItems = this.quoteCargo(routeIndex)?.getRawValue?.() || [];

    const unitQtyBasis = chargeRawValue?.unitQtyBasis;
    if (!unitQtyBasis) {
      return; 
    }

    const qtySourceField = this.findFieldForQty(unitQtyBasis);
    let newQty = 1;

    if (typeof qtySourceField === 'string') {
      const matchingCargoItems = quoteCargoItems.filter((cargo: any) => {
        const matchesContainer = chargeRawValue?.TariffContainerType
          ? Number(cargo?.ContainerType) === Number(chargeRawValue.TariffContainerType)
          : true;
        const matchesCargoType = chargeRawValue?.TariffCargoType
          ? cargo?.CargoType === chargeRawValue.TariffCargoType
          : true;

        return matchesContainer && matchesCargoType;
      });

      if (matchingCargoItems.length > 0) {
        const cargoField = qtySourceField === 'NoofContainers' ? 'Qty' : qtySourceField;
        newQty = matchingCargoItems.reduce((sum: number, cargo: any) => {
          const rawValue = qtySourceField === 'NoofContainers'
            ? (cargo?.Qty ?? cargo?.NoofContainers)
            : cargo?.[cargoField];
          return sum + (Number(rawValue) || 0);
        }, 0) || 1;
      } else if (routeGroup.get(qtySourceField)) {
        newQty = routeGroup.get(qtySourceField)?.value || 1;
      }
    } else if (typeof qtySourceField === 'number') {
      newQty = qtySourceField;
    }

    chargeGroup.get('Qty')?.setValue(newQty);
    this.calculateRevenueTotalAmount(routeIndex, carrierIndex, chargeIndex);
    this.calculateCostTotalAmount(routeIndex, carrierIndex, chargeIndex);
  }

  isRequiredInQuoteRoute(routeIndex:number ,ctrl : string) : boolean {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    return routeForm.get(ctrl)?.hasValidator(Validators.required);
  }

  isCostPerUnitRequired(routeIndex: number,carrierIndex:number): boolean {
    const chargesArray = this.quoteCharges(routeIndex,carrierIndex);
    if (!chargesArray) {
      return false;
    }
    return chargesArray.controls.some(
      chargeCtrl => !!chargeCtrl.get('CostAgentMasterSid')?.value
    );
  }


  removeCharge(routeIndex: number, carrierIndex: number,chargeIndex: number, QuoteChargeSid: number) {
    const chargeArr = this.quoteCharges(routeIndex,carrierIndex);
    if (QuoteChargeSid) {
      this.leadService.deleteCharge(QuoteChargeSid).subscribe((resp: any) => {
        if (resp.status) {
          chargeArr.removeAt(chargeIndex);
          this.quotationForm.updateValueAndValidity();
        } else {
          this.appSettingService.showError("Error deleting quote charge.")
        }
      })
    } else {
      chargeArr.removeAt(chargeIndex);
      this.quotationForm.updateValueAndValidity();
    }
  }




  // Quote Product

  quoteProducts(routeIndex: number, cargoIndex: number = -1): FormArray {
    if (cargoIndex < 0) {
      return this.quoteRoutes.at(routeIndex)?.get('quoteProducts') as FormArray;
    }

    return this.quoteCargo(routeIndex).at(cargoIndex)?.get('quoteProducts') as FormArray;
  }

  private createQuoteCargoGroup(data?: any): FormGroup {
    return this.fb.group({
      QuoteCargoSid: [data?.QuoteCargoSid || null],
      CargoType: [data?.CargoType || null],
      WeightUnitSid: [data?.WeightUnitSid || null],
      GrossWeight: [data?.GrossWeight ? Number(data?.GrossWeight).toFixed(this.digitsAfterDecimal) : 0 || 0],
      NetWeight: [data?.NetWeight ? Number(data?.NetWeight).toFixed(this.digitsAfterDecimal) : 0 || 0],
      Volume: [data?.Volume ? Number(data?.Volume).toFixed(this.digitsAfterDecimal) : 0 || 0],
      ChargeableWeight: [data?.ChargeableWeight ? Number(data?.ChargeableWeight).toFixed(this.digitsAfterDecimal) : 0 || 0],
      ContainerType: [data?.ContainerType || null],
      Qty: [data?.Qty || 1],
      ShipmentTerms: [data?.ShipmentTerms || null],
      PackageType: [data?.PackageType || null],
      // PackageQty: [data?.PackageQty || null],
      CargoDescription: [data?.CargoDescription || ''],
      isFromEnquiry: [data?.isFromEnquiry === true],
      quoteProducts: this.fb.array([]),
    });
  }

  private syncQuoteCargoValidation(routeIndex: number): void {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    const isFclRoute = this.isFclQuotationSegment(routeForm);

    this.quoteCargo(routeIndex).controls.forEach((cargoControl: AbstractControl) => {
      const cargoForm = cargoControl as FormGroup;
      this.setOrClearRequired(cargoForm.get('CargoType'), isFclRoute);
      this.setOrClearRequired(cargoForm.get('ContainerType'), isFclRoute);
      this.setOrClearRequired(cargoForm.get('Qty'), isFclRoute);
    });
  }

  addQuoteCargo(routeIndex: number, data?: any) {
    const cargoGroup = this.createQuoteCargoGroup(data);
    this.quoteCargo(routeIndex).push(cargoGroup);
    const cargoIndex = this.quoteCargo(routeIndex).length - 1;
    this.syncQuoteCargoValidation(routeIndex);

    const cargoProducts = Array.isArray(data?.quoteProducts)
      ? data.quoteProducts
      : (Array.isArray(data?.quoteProduct)
        ? data.quoteProduct
        : (Array.isArray(data?.products) ? data.products : []));

    const routeForm = this.quoteRoutes.at(routeIndex);
    const isFCL = this.isFclQuotationSegment(routeForm);


    const defaultCargoProduct = (
      !cargoProducts.length &&
      (data?.ProductName || data?.PackageType || data?.GrossWeight || data?.NetWeight || data?.Volume))
      ? [{
          ProductSid: data?.ProductSid || null,
          ProductName: data?.ProductName || '',
          PackageType: data?.PackageType || null,
          CargoDescription: data?.CargoDescription || '',
          ExternalPkg: data?.PackageTypeId || data?.ExternalPkg || null,
          ExternalQty: data?.PackageQty || data?.ExternalQty || '',
          GrossWeight: data?.GrossWeight || '',
          NetWeight: data?.NetWeight || '',
          Volume: data?.Volume || '',
          Length: data?.Length ?? data?.length ?? '',
          Volumetric: data?.Volumetric ?? data?.volumetric ?? '',
          Width: data?.Width ?? data?.width ?? '',
          Height: data?.Height ?? data?.height ?? '',
          ProductUnit: data?.PackageTypeId || data?.ProductUnit || null,
          ChargeableWeight: data?.ChargeableWeight || '',
          IsHaz: this.isHazardous(data?.IsHaz),
          ImcoClass: data?.ImcoClass || null,
          UnNo: data?.UnNo || '',
          PkgGroup: data?.PkgGroup || '',
          Remarks: data?.Remarks || '',
        }]
      : [];

    if (cargoProducts.length || defaultCargoProduct.length) {
      (cargoProducts.length ? cargoProducts : defaultCargoProduct).forEach((product: any) => {
        this.addQuoteProduct(routeIndex, product, cargoIndex);
      });
    }
  }

  private deriveProductVolumetric(product: any): number {
    const existing = Number(product?.Volumetric ?? product?.volumetric);
    if (!Number.isNaN(existing) && existing > 0) return existing;

    const length = Number(product?.Length ?? product?.length ?? 0) || 0;
    const width = Number(product?.Width ?? product?.width ?? 0) || 0;
    const height = Number(product?.Height ?? product?.height ?? 0) || 0;
    const qty = Number(product?.ExternalQty ?? product?.ExternlQty ?? 0) || 0;

    if (length > 0 && width > 0 && height > 0 && qty > 0) {
      return Number((((length * width * height) / 6000) * qty).toFixed(this.digitsAfterDecimal));
    }
    return 0;
  }

  private resolvePackageTypeSid(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }

    const numericValue = Number(value);
    if (!Number.isNaN(numericValue) && String(value).trim() !== '') {
      return numericValue;
    }

    const matchedPackage = this.packageTypes.find(type =>
      type.UOMMasterSid === value ||
      type.UOMCode === value ||
      type.UOMName === value
    );

    return matchedPackage?.UOMMasterSid || null;
  }

  addQuoteProduct(routeIndex: number, data?: any, cargoIndex: number = -1) {
    const isHaz = this.isHazardous(data?.IsHaz);
    const productForm = this.fb.group({
      QuoteProductSid : [data?.QuoteProductSid || null],
      Sno : [data?.Sno || null],
      ProductSid : [data?.ProductSid || null ],
      ProductName : [data?.ProductName || '' ],
      PackageType : [data?.PackageType || null ],
      CargoDescription : [data?.CargoDescription || ''],
       ExternalPkg : [this.resolvePackageTypeSid(data?.ExternalPkg ?? data?.PackageTypeId ?? data?.PackageType) ],
      ExternalQty : [data?.ExternalQty ?? '' ],
      GrossWeight : [
        data?.GrossWeight ? 
        Number(data?.GrossWeight).toFixed(this.digitsAfterDecimal) : 
        0
       ],
      NetWeight : [
        data?.NetWeight ?
        Number(data?.NetWeight).toFixed(this.digitsAfterDecimal) : 
        0
      ],
      Volume : [
        data?.Volume ?
        Number(data?.Volume).toFixed(this.digitsAfterDecimal) : 
        0
      ],
      Length : [data?.Length ?? ''],
      Volumetric: [data?.Volumetric || ''],
      Width : [data?.Width ?? ''],
      Height : [data?.Height ?? ''],
       ProductUnit : [this.resolvePackageTypeSid(data?.ProductUnit ?? data?.PackageTypeId ?? data?.PackageType)],
      ChargeableWeight : [
        data?.ChargeableWeight ? 
        Number(data?.ChargeableWeight).toFixed(this.digitsAfterDecimal) : 
        0
      ],
      IsHaz : [isHaz],
      ImcoClass : [{ value : data?.ImcoClass || null, disabled : !isHaz }],
      UnNo : [{ value : data?.UnNo || '', disabled : !isHaz }],
      PkgGroup : [{ value : data?.PkgGroup || null, disabled : !isHaz }],
      Remarks : [data?.Remarks || ''],
    });


    this.quoteProducts(routeIndex, cargoIndex).push(productForm);
    const productLength = this.quoteProducts(routeIndex, cargoIndex).length;
    this.handleSegmentChangeOnProduct(routeIndex, productLength - 1, cargoIndex);
    productForm.updateValueAndValidity();
    this.handleCalculation(routeIndex, cargoIndex);
    this.subscription.add(
      productForm.valueChanges.subscribe(() => {
        this.updateCargoTotals(routeIndex, cargoIndex);
      })
    );
    productForm.get("GrossWeight").valueChanges.subscribe(() => {
      this.setOrResetWeightError(productForm);
    });
    productForm.get("NetWeight").valueChanges.subscribe(() => {
      this.setOrResetWeightError(productForm);
    });
  }

  handleSegmentChangeOnAllProducts(routeIndex: number, cargoIndex: number = -1) {
    this.quoteProducts(routeIndex, cargoIndex).controls.forEach((product, index) => {
      this.handleSegmentChangeOnProduct(routeIndex, index, cargoIndex);
    });
  }

  logProduct(routeIndex:number,productIndex:number,cargoIndex: number = -1){
    const product = this.quoteProducts(routeIndex, cargoIndex).at(productIndex) as FormGroup;
  }

  handleSegmentChangeOnProduct(routeIndex: number,productIndex:number,cargoIndex: number = -1) {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    if (!routeForm) return;

    const segmentType = routeForm.get('segmentType')?.value;
    if(!segmentType) return;
    const cargoMode = this.getRouteCargoMode(routeForm, segmentType);
    const isLCL = cargoMode === 'LCL';
    const isFCL = cargoMode === "FCL";
    const isAir = cargoMode === 'AIR';
    const isRoad = cargoMode === 'ROAD';

    const productControlsToValidate = {
        GrossWeight: isLCL || isFCL || isRoad,
        NetWeight: isLCL || isFCL || isRoad,
        Volume: isLCL || isFCL,
        ExternalQty: isLCL || isFCL,
        ExternalPkg: isLCL || isFCL,
        Length: isAir,
        Width: isAir,
        Height: isAir,
        ProductUnit: isAir,
    };

    this.quoteProducts(routeIndex, cargoIndex).controls.forEach(productControl => {
        for (const [key, isRequired] of Object.entries(productControlsToValidate)) {
            const control = (productControl as FormGroup).get(key);
            if (control) {
                this.setOrClearRequired(control, isRequired);
            }
        }
    });
    this.syncQuoteCargoValidation(routeIndex);
    this.quoteProducts(routeIndex, cargoIndex).updateValueAndValidity();
  }
  private setOrClearRequired(control: AbstractControl, isRequired: boolean) {
    const hasRequired = control.hasValidator(Validators.required);

    if (isRequired && !hasRequired) {
      control.addValidators(Validators.required);
    } else if (!isRequired && hasRequired) {
      control.removeValidators(Validators.required);
    }

    control.updateValueAndValidity({ emitEvent: false });
  }
  private updateCargoTotals(routeIndex: number, cargoIndex: number = -1): void {
  const route = this.quoteRoutes.at(routeIndex) as FormGroup;

  const products = this.quoteProducts(routeIndex, cargoIndex)?.getRawValue() || [];

  const totalGross = products.reduce((sum, p) => sum + Number(p.GrossWeight || 0), 0);
  const totalNet = products.reduce((sum, p) => sum + Number(p.NetWeight || 0), 0);
  const totalVolume = products.reduce((sum, p) => sum + Number(p.Volume || 0), 0);

  if (cargoIndex >= 0) {
    const cargo = this.quoteCargo(routeIndex).at(cargoIndex) as FormGroup;

    cargo.patchValue({
      GrossWeight: totalGross.toFixed(this.digitsAfterDecimal),
      NetWeight: totalNet.toFixed(this.digitsAfterDecimal),
      Volume: totalVolume.toFixed(this.digitsAfterDecimal)
    }, { emitEvent: false });

  } else {
    route.patchValue({
      GrossWeight: totalGross.toFixed(this.digitsAfterDecimal),
      NetWeight: totalNet.toFixed(this.digitsAfterDecimal),
      Volume: totalVolume.toFixed(this.digitsAfterDecimal)
    }, { emitEvent: false });
  }
}

  isProductRequired(routeIndex: number, productIndex: number, ctrl: string, cargoIndex: number = -1) {
    const productForm = this.quoteProducts(routeIndex, cargoIndex)?.at(productIndex);
    const control = productForm?.get(ctrl);
    return control ? control.hasValidator(Validators.required) : false;
  }

  onHazChange(routeIndex:number,productIndex:number,event:any,cargoIndex: number = -1){
      const element = event.target as HTMLInputElement;
      const control = this.quoteProducts(routeIndex, cargoIndex).at(productIndex).get('IsHaz');
      if(event instanceof KeyboardEvent){
        element.checked = !element.checked;
      }
      control.setValue(element.checked);
      this.toggleHazProduct(routeIndex,productIndex,cargoIndex);
  }

  toggleHazProduct(routeIndex:number,productIndex:number,cargoIndex: number = -1){
    const isHaz = this.quoteProducts(routeIndex, cargoIndex).at(productIndex).get('IsHaz')?.value;
   
    if(isHaz){
      this.quoteProducts(routeIndex, cargoIndex).at(productIndex).get('ImcoClass')?.enable();
      this.quoteProducts(routeIndex, cargoIndex).at(productIndex).get('PkgGroup')?.enable();
      this.quoteProducts(routeIndex, cargoIndex).at(productIndex).get('ImcoClass')?.setValidators(Validators.required);
      this.quoteProducts(routeIndex, cargoIndex).at(productIndex).get('PkgGroup')?.setValidators(Validators.required);
    } else {
      this.quoteProducts(routeIndex, cargoIndex).at(productIndex).get('ImcoClass')?.setValue(null);
      this.quoteProducts(routeIndex, cargoIndex).at(productIndex).get('PkgGroup')?.setValue('');
      this.quoteProducts(routeIndex, cargoIndex).at(productIndex).get('ImcoClass')?.clearValidators();
      this.quoteProducts(routeIndex, cargoIndex).at(productIndex).get('ImcoClass')?.disable();
      this.quoteProducts(routeIndex, cargoIndex).at(productIndex).get('PkgGroup')?.clearValidators();
      this.quoteProducts(routeIndex, cargoIndex).at(productIndex).get('PkgGroup')?.disable();
    }
  }

  onImcoChange(routeIndex:number,productIndex,item:any,cargoIndex: number = -1){

    const productForm = this.quoteProducts(routeIndex, cargoIndex).at(productIndex) as FormGroup;
    if(!item){
      productForm.get('UnNo')?.setValue("");
      productForm.get('PkgGroup')?.setValue("");
      return;
    }
    productForm.get('UnNo')?.setValue(item.ImcoUn);
    productForm.get('PkgGroup')?.setValue(item.PackingGroup);
  }

  deleteQuoteProduct(routeIndex:number, productIndex:number,QuoteProductSid:number,cargoIndex: number = -1){
    const ctrl = this.quoteProducts(routeIndex, cargoIndex) as FormArray;
    if(QuoteProductSid){
      this.leadService.deleteProduct(QuoteProductSid).subscribe((resp:any) => {
        if(resp.status){
          ctrl.removeAt(productIndex);
          this.quoteProducts(routeIndex, cargoIndex).updateValueAndValidity();
          this.handleCalculation(routeIndex, cargoIndex);
          this.appSettingService.showSuccess("Product Deleted Successfully");
        } else {
          this.appSettingService.showError("Error Deleting Product");
        }
      });
    } else {
      ctrl.removeAt(productIndex);
      this.quoteProducts(routeIndex, cargoIndex).updateValueAndValidity();
      this.handleCalculation(routeIndex, cargoIndex);
      this.appSettingService.showSuccess("Product Deleted Successfully");
    }
  }

  deleteQuoteCargo(routeIndex: number, cargoIndex: number, quoteCargoSid: number | null) {
    const ctrl = this.quoteCargo(routeIndex) as FormArray;
    const removeCargoFromForm = () => {
      ctrl.removeAt(cargoIndex);
      this.syncQuoteCargoValidation(routeIndex);
      this.quoteCargo(routeIndex).controls.forEach((_, existingCargoIndex) => {
        this.handleCalculation(routeIndex, existingCargoIndex);
      });
      this.quotationForm.markAsDirty();
    };

    // Cargo delete for persisted records is finalized on Save in update payload sync.
    if (quoteCargoSid) {
      removeCargoFromForm();
      this.appSettingService.showSuccess("Cargo removed. Click Save to update.");
      return;
    }

    removeCargoFromForm();
    this.appSettingService.showSuccess("Cargo Deleted Successfully");
  }

  onProductChange(product:any,routeIndex:number,productIndex:number,cargoIndex: number = -1){
    const productForm = this.quoteProducts(routeIndex, cargoIndex)?.at(productIndex) as FormGroup;
    
    productForm.get('ProductName')?.setValue("");
    productForm.get('IsHaz')?.setValue(false);
    productForm.get('ImcoClass')?.setValue('');
    productForm.get('PkgGroup')?.setValue('');
    if(!product){
      return;
    } else {
      productForm.get('ProductName')?.setValue(product.ProductName);
      const isHaz = product.ProductType === "2";
      productForm.get('IsHaz')?.setValue(isHaz);
      if(isHaz){
        productForm.get('ImcoClass')?.enable();
        productForm.get('UnNo')?.enable();
        productForm.get('PkgGroup')?.enable();
        
        productForm.patchValue({
          ImcoClass : product.IMOClass,
          UnNo : product.UNNo,
          PkgGroup : product.PackingGroup
        })
      } else {
        productForm.get('ImcoClass')?.setValue(null);
        productForm.get('UnNo')?.setValue('');
        productForm.get('PkgGroup')?.setValue('');
        productForm.get('ImcoClass')?.disable();
        productForm.get('UnNo')?.disable();
        productForm.get('PkgGroup')?.disable();
      }
    }
  }


  // SECTION5 - MAIN FUNCTIONS

  loadAllLookUps() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const filterOption = { 
      CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
      BranchMasterSid : this.currentBranch?.BranchMasterSid
    }
    const supplierFilterOption = {
      CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
      types : ['vendor', 'transporter', 'agent']
    }
    return forkJoin({
      countries: this.dropdownStore.loadCountries().pipe(catchError(err => of([]))),
      cargoTypes: this.leadService.getAllCargoTypes(CompanyMasterSid).pipe(catchError(err => of([]))),
      // carriers: this.leadService.getAllCarrier(CompanyMasterSid).pipe(catchError(err => of([]))),
      leads : this.leadService.fetchAllLeads(filterOption).pipe(catchError(err => of([]))),
      customers: this.operationService.getAllDebtorWithCOAMapped({CompanyMasterSid: this.currentCompany?.CompanyMasterSid}).pipe(catchError(err => of([]))),
      customerlist:this.leadService.getAllCustomersWithBranch(CompanyMasterSid).pipe(catchError(err => of([]))),
      departments: this.leadService.getAllDepartments(CompanyMasterSid).pipe(catchError(err => of([]))),
      ports: this.leadService.getAllPorts().pipe(catchError(err => of([]))),
      incos: this.leadService.getAllIncos().pipe(catchError(err => of([]))),
      salesman: this.leadService.getAllSalesman(CompanyMasterSid).pipe(catchError(err => of([]))),
      masters: this.leadService.getAllMasters(CompanyMasterSid).pipe(catchError(err => of({ charges: [], units: [] }))),
      currency: this.operationService.getAllCurrencies().pipe(catchError(err => of([]))),
      chargeUnits : this.leadService.getUOMsByType('C').pipe(catchError(err => of([]))),
      packageTypes : this.leadService.getUOMsByType('P').pipe(catchError(err => of([]))),
      measurementUnits : this.leadService.getUOMsByType('M').pipe(catchError(err => of([]))),
      weightUnits : this.leadService.getUOMsByType('W').pipe(catchError(err => of([]))),
      vendors: this.operationService.getAllCreditorWithCOAMapped({CompanyMasterSid: this.currentCompany?.CompanyMasterSid}).pipe(catchError(err => of([]))),
      containerTypes: this.leadService.getAllContainerTypes().pipe(catchError(err => of([]))),
      products : this.leadService.getAllProducts().pipe(catchError(err => of([]))),
      imcos : this.leadService.getAllImco().pipe(catchError(err => of([]))),
    }).pipe(tap(({ countries, departments , cargoTypes, leads, customers, customerlist, vendors, ports, incos, salesman, masters,currency,chargeUnits, containerTypes , packageTypes,products,imcos,measurementUnits,weightUnits }) => {
      this.dropdownStore.countries.set(countries || []);
      this.packageTypes = cargoTypes || [];
      // this.carriers = carriers || [];
      this.leadList = leads.data;
      this.customers = customers.data || [];
      this.customerlist = customerlist|| [];
      this.departments = departments || [];
      this.ports = (ports || []).map(p => ({...p,Country : p.countryMaster?.countryName}));
      this.quoteRoutes.controls.forEach((_, routeIndex: number) => this.refreshRoutePortFilters(routeIndex));
      this.chargeMaster = masters.charges || [];
      // this.currencyMaster = masters.currencies || [];
      const rawCurrencies: any[] = Array.isArray(currency)
        ? currency
        : currency?.data || [];
      this.currencyMaster = rawCurrencies.map((c: any) => ({
        ...c,
        countryName: c?.countryMaster?.countryName || ''
      }));
      this.chargeUnitMaster = chargeUnits.data || [];
      this.measurementUnitList = measurementUnits.data || [];
      this.weightUnitList = weightUnits.data || [];
      this.packageTypes = packageTypes.data || [];
      this.incoList = incos || [];
      this.salesmanList = salesman || [];
      this.containerTypeList = containerTypes || [],
      this.vendorSupplierList = vendors.data || [];
      this.productList = products || [];
      this.imcoList = imcos.data || [];
    })
    );
  }

  loadAllFields() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const payload = {
      CompanyMasterSid: CompanyMasterSid,
      types:['carrier']
    }
    this.dropdownStore.loadCustomerTypeData(payload).subscribe();
  }
isRateLockDisabled(): boolean {
  return !this.canUserLockRates || this.disableAllModification || this.quotationApproved;
}
  loadQuotation(id): void {
    this.spinner.show();
    this.leadService.getQuoteById(id).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.spinner.hide();
          this.patchValues(resp.data)
          this.quotationData = resp.data;
          this.applyQuotationDisableRules(resp.data);
          this.selectedItem = resp.data;
          this.clearPdfCache(); // Clear cached PDF when new quotation is loaded
        } else {
          this.spinner.hide();
          this.appSettingService.showError("Error loading Quotation")
          console.error(resp.message);
        }
      });
  }

  patchValues(response: any) {
    this.isPatching = true;
    const parsedContact = this.parsePhone(response.ContactNumber);
    
    const selectedDept = this.departments.find(dept => dept.DepartmentMasterSid === response.DepartmentMasterSid);
    const selectedCustomer = this.customerlist.find(cus => cus.CustomerMasterSid === response.CustomerMasterSid);
    if (selectedCustomer) {
      this.f['CustomerName']?.setValue(selectedCustomer?.CustomerName);
      this.getCustomerBranches(selectedCustomer?.CustomerMasterSid)
    }
    if (selectedDept?.departmentType === "Sea") {
      this.f['SegmentType']?.setValue(selectedDept?.FCLLCL);
    } else {
      this.f['SegmentType']?.setValue(selectedDept?.departmentType?.toUpperCase());
    }
    
    this.f['DepartmentMasterSid']?.disable();
    this.f['LeadOrCustomer']?.disable();
    this.f['CustomerMasterSid']?.disable();
    this.f['PreCustomerMasterSid']?.disable();
    this.getEnquiryName(response.EnquirySid);
    this.quotationForm.patchValue({
      ...response,
      LeadOrCustomer : response.LeadOrCustomer === "C",
      AgreedRate : response.AgreedRate === "Y",
      IsContract : response.IsContract === "Y",
      RateLock : response.RateLock === "Y", 
      status: response.status === 'A' ? 'Active' : 'Suspended',
      QuoteDate: new Date(response.QuoteDate),
      ContactPerson:response.ContactPerson,
      ContactNumberCode: parsedContact.phoneCode,
      ContactNumber: parsedContact.phoneNumber
    })
    this.quotationForm.patchValue({
      PreCustomerMasterSid: response.PreCustomerMasterSid,
      CustomerMasterSid: response.CustomerMasterSid,
      customerName: response.customerName,
      CustomerAddress: response.CustomerAddress,
      CustomerBranchSid: response.CustomerBranchSid,
      Email: response.Email,
      ContactPerson:response.ContactPerson,
      ContactNumberCode: parsedContact.phoneCode,
      ContactNumber: parsedContact.phoneNumber
    });
    this.authStateCache = response?.authorizerStatus || 'Pending';
    this.quoteRoutes.clear();
     if (response.BookingHeaderSid) {
    this.quotationForm.get('status')?.disable();
  }
    (response.quoteRoute || []).forEach((route, routeIndex) => {
      const cargoGroups = Array.isArray(route?.quoteCargo) ? route.quoteCargo : [];
      const cargo = cargoGroups[0];
      const isFclRoute = this.isFclQuotationSegment(route);
      const fullRouteData = {
        ...route,
        QuoteCargoSid : cargo?.QuoteCargoSid || null,
        CargoType : cargo?.CargoType,
        WeightUnitSid : cargo?.WeightUnitSid,
        GrossWeight : cargo?.GrossWeight,
        NetWeight : cargo?.NetWeight,
        Volume : cargo?.Volume,
        ChargeableWeight : cargo?.ChargeableWeight,
        ContainerType : cargo?.ContainerType,
        BookingHeaderSid: route.BookingHeaderSid || null,
         BookingNo: route.bookingHeader?.BookingNo || '',
        Qty : cargo?.Qty,
        ShipmentTerms : cargo?.ShipmentTerms
      }
      this.checkRateLockPermissions();
      this.addQuoteRoute(fullRouteData)
      this.handleValidationOnDept(routeIndex, route.segmentType)
      this.onRouteChange(routeIndex);
        const isRouteApproved = route?.quoteCarrier?.some(carrier => 
      carrier.ApprovalStatus === "Approved"
    );
    
    // Store in route form for easy access
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    routeForm.addControl('isRouteApproved', this.fb.control(isRouteApproved));

      if (isRouteApproved) {
        routeForm.disable({ emitEvent: false });
      }
      
      if (response.RateLock === "Y" && this.canUserLockRates)  {
        this.lockAllRateFields();
      }
      
      // Check if this route has charges/tariffs applied
      const hasCharges = route?.quoteCarrier?.some(carrier => 
        carrier?.quoteCharge && carrier.quoteCharge.length > 0
      );
      
      if (hasCharges) {
        setTimeout(() => {
          const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
          if (routeForm) {
            const fieldsToDisable = [
              'DepartmentMasterSid', 'POLSid', 'PODSid', 
              'effDate', 'expDate', 'PORSid', 'FPODSid'
            ];
            fieldsToDisable.forEach(field => {
              const control = routeForm.get(field);
              if (control) {
                control.disable({ emitEvent: false });
              }
            });
          }
        }, 0);
      }
      
      if (response.RateLock === "Y") {
        setTimeout(() => {
          this.lockAllRateFields();
        }, 100);
      }
      
      if (isFclRoute) {
        cargoGroups.forEach((cargoItem: any) => {
          this.addQuoteCargo(routeIndex, {
            ...cargoItem,
            quoteProducts: cargoItem?.quoteProducts || cargoItem?.quoteProduct || cargoItem?.products || []
          });
        });
      } else {
        if (cargo) {
          (cargo.quoteProduct || cargo.quoteProducts || []).forEach(product => {
            const productUnNo = this.productList.find(prod => prod.ProductMasterSid === product.ProductMasterSid)?.UnNo;
            this.addQuoteProduct(routeIndex, {
              ...product,
              Volumetric: this.deriveProductVolumetric(product),
              UnNo: productUnNo
            });
          })
        }

        cargoGroups.slice(1).forEach((extraCargo: any) => {
          this.addQuoteCargo(routeIndex, {
            ...extraCargo,
            quoteProducts: extraCargo?.quoteProducts || extraCargo?.quoteProduct || extraCargo?.products || []
          });
        });
      }

      (route?.quoteCarrier || []).forEach((carrier,carrierIndex) => {
        this.addQuoteCarrier(routeIndex,carrier);
        (carrier?.quoteCharge || []).forEach(charge => {
          this.addQuoteCharge(routeIndex,carrierIndex, charge);
        }) ;
        const carrierForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
        if (carrier.ApprovalStatus === "Approved") {
          const statusControl = carrierForm.get('authorizerStatus');
          if (statusControl) {
            statusControl.disable({ emitEvent: false });
          }
        }
      })
      
      this.applyBookingLockForRoute(routeIndex, route);
    })
    
    this.disableNonEditFields();
    this.applyEditModeFieldLocks();
    
    // IMPORTANT: Only disable the entire form if ALL carriers are approved
    // OR if you want to keep the header editable but only disable approved carriers
    // For now, let's NOT disable the entire form based on authStateCache
    // Instead, we'll only disable individual approved carriers
    
    // Remove this line that disables the entire form:
    // if(this.authStateCache !== 'Pending'){
    //   this.quotationForm.disable();
    //   this.disableAllModification = true;
    // }
    
    this.quoteAuthorized = (response.quoteRoute || []).some(route => {
      return (route?.quoteCarrier || []).some(carrier =>(carrier.ApprovalStatus === "Approved" || carrier.ApprovalStatus === "Rejected"));
    })

    this.quotationApproved = (response.quoteRoute || []).some(route => {
      return (route?.quoteCarrier || []).some(carrier => carrier.ApprovalStatus === "Approved")
    })

    // Rest of your code remains the same...
    const { quoteRoute, ...header } = response;
    const approvedRoute = (quoteRoute || []).find(route => {
      return (route?.quoteCarrier || []).some(carrier => carrier.ApprovalStatus === "Approved");
    });

    let approvedQuoteCarrier;
    let approvedQuoteCargo;
    let approvedQuoteRoute;

    if (approvedRoute) {
      const approvedCarrier = (approvedRoute.quoteCarrier || []).find(
        carrier => carrier.ApprovalStatus === "Approved"
      );

      approvedQuoteCarrier = approvedCarrier;
      approvedQuoteCargo = approvedRoute.quoteCargo;

      const { quoteCarrier, quoteCargo, ...routeDetails } = approvedRoute;
      approvedQuoteRoute = {
        ...routeDetails,
        quoteCarrier: approvedQuoteCarrier
      };
    }
    
    // Only disable the form if ALL carriers are approved (not just one)
    // OR if you have a specific business rule
    if(this.quoteAuthorized && this.quotationApproved){
      // Only disable if there's at least one approved carrier
      // But keep other carriers editable
      // We'll handle disabling per carrier above
    }
    
   

    let approvedData = {
      ...header,
      quoteRoute: approvedQuoteRoute
    };


    this.selectedItem = approvedData;
    this.clearPdfCache();


    this.bookingCreatedAgainstThisQuotation = this.selectedItem.BookingHeaderSid;
    this.isPatching = false;
    this.resetUnsavedState();
  }

  private applyEditModeFieldLocks(): void {
    if (!this.isEditMode) {
      return;
    }

    this.quotationForm.get('CustomerMasterSid')?.disable({ emitEvent: false });
    this.quotationForm.get('PreCustomerMasterSid')?.disable({ emitEvent: false });

    this.quoteRoutes.controls.forEach((_, routeIndex: number) => {
      const carrierArr = this.quoteCarriers(routeIndex);
      carrierArr.controls.forEach((_, carrierIndex: number) => {
        this.syncCarrierSelectionState(routeIndex, carrierIndex);
      });
    });
  }


  onSubmit(resolve?: (saved: boolean) => void) {
     if (this.isSaving) {
    if (resolve) resolve(false);
    return;
  }

  const canLoginUserAuthorize = this.authorizerDetails.canAuthorize;
  const hasApprovalAction = canLoginUserAuthorize && !!this.approvalDropdownValue;
  if (this.isEditMode && !this.hasUnsavedChanges() && !hasApprovalAction) {
    this.appSettingService.showWarning("No changes to save");
    if (resolve) resolve(false);
    return;
  }

  this.isSaving = true;

    if(canLoginUserAuthorize && !this.approvalDropdownValue){
      this.appSettingService.showWarning("Please select approval status");
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }
    let hasCarrierValidationErrors = false;
      this.quoteRoutes.controls.forEach((route: FormGroup, routeIndex: number) => {
    const carrierArr = this.quoteCarriers(routeIndex);
    carrierArr.controls.forEach((carrier: FormGroup, carrierIndex: number) => {
      // Force validation update
      carrier.updateValueAndValidity();
      carrier.markAllAsTouched();
      
      const status = carrier.get('authorizerStatus')?.value;
      const approvedBy = carrier.get('ApprovedBy')?.value;
      const remarks = carrier.get('authorizerRemarks')?.value;
      
      // Manual validation check
      if ((status === 'Approved' || status === 'Rejected') && !approvedBy?.trim()) {
        hasCarrierValidationErrors = true;
        this.appSettingService.showWarning(`Approved By is required`);
      }
      
      if (status === 'Counter' && !remarks?.trim()) {
        hasCarrierValidationErrors = true;
        this.appSettingService.showWarning(`Remarks are required for Counter`);
      }
    })
  });

  if (hasCarrierValidationErrors) {
    this.selectedTab1 = 'Route Details';
    this.isSaving = false;
    if (resolve) resolve(false);
    return;
  }
    if (this.hasInvalidRouteDetails()) {
      this.appSettingService.showWarning("Please fill all the Route details correctly");
      this.quoteRoutes.markAllAsTouched();
      this.quoteRoutes.updateValueAndValidity();
      this.selectedTab1 = 'Route Details';
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }

    this.quoteRoutes.controls.forEach((route:FormGroup,routeIndex:number)=>{
      const carrierArr = this.quoteCarriers(routeIndex);
      carrierArr.controls.forEach((carrier:FormGroup,carrierIndex:number) => {
        carrier.updateValueAndValidity();
        carrier.markAllAsTouched();
      })
    })

    if (this.quotationForm.invalid) {
      this.logInvalidControls(this.quotationForm, 'quotationForm');
      this.appSettingService.showWarning("Please fill all the required fields correctly");
      this.quotationForm.markAllAsTouched();
      this.quotationForm.updateValueAndValidity();
      this.selectedTab1 = 'Quotation';
      this.isSaving = false;
      if (resolve) resolve(false);
      return;
    }

     const disabledFieldsByRoute = [];
  
  this.quoteRoutes.controls.forEach((route: FormGroup, routeIndex) => {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    const fieldsToCheck = ['DepartmentMasterSid', 'POLSid', 'PODSid', 'effDate', 'expDate', 'PORSid', 'FPODSid'];
    
    const disabledFields = fieldsToCheck.filter(field => routeForm.get(field)?.disabled);
    disabledFieldsByRoute[routeIndex] = disabledFields;
  });

    const formValue = this.quotationForm.getRawValue();
    let currentCompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    let currentBranchMasterSid = this.currentBranch?.BranchMasterSid;
    let userEmail = this.userData?.userEmail;
  
    const transportBy = this.dataFromEnqPage?.TransportBy || null;
    const clearanceBy = this.dataFromEnqPage?.ClearanceBy || null;
    const menuId = this.sideBarService.syncMenuIdBeforeSubmit("Quotation") || this.MenuMasterSid;

    const payload = {
      CompanyMasterSid: currentCompanyMasterSid,
      BranchMasterSid: currentBranchMasterSid,
      MenuMasterSid: menuId,
      ...(this.isEditMode ? { updatedBy: userEmail } : { createdBy: userEmail }),
      UserMasterSid: this.userData?.UserMasterSid,
      LeadOrCustomer : formValue.LeadOrCustomer ? "C" : "L",
      AgreedRate : formValue.AgreedRate ? "Y" : "N",
      IsContract : formValue.IsContract ? "Y" : "N",
      RateLock : formValue.RateLock ? "Y" : "N",
      PreCustomerMasterSid : formValue.PreCustomerMasterSid,
      CustomerMasterSid: formValue.CustomerMasterSid,
      CustomerBranchSid: formValue.CustomerBranchSid,
      CustomerRef: formValue.CustomerRef,
      CustomerAddress: formValue.CustomerAddress,
      Email: formValue.Email,
      ContactPerson:formValue.ContactPerson,
      ContactNumber: this.withDialCode(
        formValue.ContactNumber,
        formValue.ContactNumberCode
      ),
      SalesmanSid: formValue.SalesmanSid,
      TransportBy: transportBy,
      ClearanceBy: clearanceBy,
      CustomerName: formValue.CustomerName,
      QuoteNumber: formValue.QuoteNumber,
      QuoteDate: formValue.QuoteDate,
      EnquirySid: formValue.EnquirySid,
      FreightPPCC: formValue.FreightPPCC,
      status: formValue.status === "Active" ? 'A' : 'S',
      authDetails : {
          canAuthorize : this.authorizerDetails?.canAuthorize,
          AuthorityDetailSid :  this.authorizerDetails?.AuthorityDetailSid || null,
          ApprovalStatus : this.approvalDropdownValue,
          ApprovedBy : this.authorizerDetails?.ApprovedBy
      },

      quoteRoutes: (formValue.quoteRoutes || []).map((route, routeIndex) => {
        const cargoItems = Array.isArray(route.quoteCargo) ? route.quoteCargo : [];
        const isFclRoute = this.isFclQuotationSegment(route);

        const mapProducts = (products: any[] = []) => products.map((product: any) => {
          const productUnNo = this.productList.find(prod => prod.ProductMasterSid === product.ProductMasterSid)?.UnNo;
          const imcoUnNo = this.imcoList.find(imco => imco.ImcoMasterSid === product.IMOClass)?.ImcoUn;
          return {
            ...product,
            UnNo: productUnNo || imcoUnNo,
          };
        });

        const quoteCargo = isFclRoute
          ? cargoItems.map((cargo: any) => ({
              QuoteCargoSid: cargo.QuoteCargoSid,
              CargoType: cargo.CargoType,
              WeightUnitSid: cargo.WeightUnitSid,
              GrossWeight: cargo.GrossWeight,
              NetWeight: cargo.NetWeight,
              Volume: cargo.Volume,
              ChargeableWeight: cargo.ChargeableWeight,
              ContainerType: cargo.ContainerType,
              Qty: cargo.Qty,
              BookingHeaderSid: cargo.BookingHeaderSid,
              ShipmentTerms: cargo.ShipmentTerms,
              PackageType: cargo.PackageType,
              PackageQty: cargo.PackageQty,
              CargoDescription: cargo.CargoDescription,
              quoteProducts: mapProducts(cargo.quoteProducts || cargo.quoteProduct || cargo.products || [])
            }))
          : [{
              QuoteCargoSid: route.QuoteCargoSid,
              CargoType: route.CargoType,
              WeightUnitSid: route.WeightUnitSid,
              GrossWeight: route.GrossWeight,
              NetWeight: route.NetWeight,
              Volume: route.Volume,
              ChargeableWeight: route.ChargeableWeight,
              ContainerType: route.ContainerType,
              Qty: route.Qty,
              BookingHeaderSid: route.BookingHeaderSid,
              ShipmentTerms: route.ShipmentTerms,
              PackageType: route.PackageType,
              PackageQty: route.PackageQty,
              CargoDescription: route.CargoDescription,
              quoteProducts: mapProducts(route.quoteProducts || [])
            }, ...cargoItems.map((cargo: any) => ({
              QuoteCargoSid: cargo.QuoteCargoSid,
              CargoType: cargo.CargoType,
              WeightUnitSid: cargo.WeightUnitSid,
              GrossWeight: cargo.GrossWeight,
              NetWeight: cargo.NetWeight,
              Volume: cargo.Volume,
              ChargeableWeight: cargo.ChargeableWeight,
              ContainerType: cargo.ContainerType,
              Qty: cargo.Qty,
              BookingHeaderSid: cargo.BookingHeaderSid,
              ShipmentTerms: cargo.ShipmentTerms,
              PackageType: cargo.PackageType,
              PackageQty: cargo.PackageQty,
              CargoDescription: cargo.CargoDescription,
              quoteProducts: mapProducts(cargo.quoteProducts || cargo.quoteProduct || cargo.products || [])
            }))];

        return {
        // Route Part
        QuoteRouteSid: route.QuoteRouteSid,
        DepartmentMasterSid: route.DepartmentMasterSid,
        POLFreeDays: route.POLFreeDays ? route.POLFreeDays : 0,
        PODFreeDays: route.PODFreeDays ? route.PODFreeDays : 0,
        PORSid: route.PORSid,
        POLSid: route.POLSid,
        PODSid: route.PODSid,
        FPODSid: route.FPODSid,
        effDate: route.effDate,
        expDate: route.expDate,
        TransitDays: route.TransitDays,
        segmentType: route.segmentType || 'LCL',
        FreightPPCC : route.FreightPPCC,
        ServiceLevel: route.ServiceLevel,

        // Route - Cargo
        QuoteCargoSid: route.QuoteCargoSid,
        CargoType: route.CargoType,
        WeightUnitSid: route.WeightUnitSid,
        GrossWeight: route.GrossWeight,
        NetWeight: route.NetWeight,
        Volume: route.Volume,
        ChargeableWeight: route.ChargeableWeight,
        ContainerType: route.ContainerType,
        Qty: route.Qty,
        BookingHeaderSid: route.BookingHeaderSid,
        ShipmentTerms: route.ShipmentTerms,
        PackageType: route.PackageType,
        PackageQty: route.PackageQty,
        CargoDescription: route.CargoDescription,
        quoteProducts: isFclRoute ? [] : quoteCargo[0].quoteProducts,
        quoteCargo,

        // Route - Carrier
        quoteCarriers : (route.quoteCarriers || []).map((carrier) => {
          const canLoginUserAuthorize = this.authorizerDetails?.canAuthorize;
          let approvalLevel = this.authorizerDetails?.AuthorityLevel;

          let finalValue;
          if(this.approvalDropdownValue === "Approved"){
            finalValue = this.statusMapBasedOnAuthLevel.get(String(approvalLevel));
          } else {
            finalValue = "Rejected";
          }
          
          const allCharges = (carrier.quoteCharges || []).map(charge => ({
            ...charge,
          }))
          return {
            ...carrier,
            ...(canLoginUserAuthorize ? {ApprovalStatus : finalValue} : {}),
            quoteCharges : allCharges
          }
        })
      };
      }),
    };

    if (this.isEditMode) {

      this.leadService.updateQuoteById(this.QuoteHeaderSid, payload).subscribe(
        (resp: any) => {
          this.isSaving = false;
          if (resp.status) {
            this.quotationForm.markAsPristine();
            this.quotationForm.markAsUntouched();
            this.resetUnsavedState();
                      setTimeout(() => {
            disabledFieldsByRoute.forEach((disabledFields, routeIndex) => {
              if (disabledFields && disabledFields.length > 0) {
                const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
                if (routeForm) {
                  disabledFields.forEach(field => {
                    const control = routeForm.get(field);
                    if (control) {
                      control.disable({ emitEvent: false });
                    }
                  });
                }
              }
            });
          }, 100);
            this.appSettingService.showSuccess('Quotation is successfully updated');
            this.emailTriggerService.triggerEmails({
              companyId: this.currentCompany?.CompanyMasterSid,
              branchId: this.currentBranch?.BranchMasterSid,
              menuMasterSid: this.MenuMasterSid,
              action: 'UPDATE',
              context: {
                quotationNumber: this.quotationData?.QuoteNumber,
                date: this.datePipe.transform(this.quotationData?.QuoteDate),
                POO: this.getFormattedPort(this.quotationData?.quoteRoute?.[0]?.PORSid),
                POL: this.getFormattedPort(this.quotationData?.quoteRoute?.[0]?.POLSid),
                POD: this.getFormattedPort(this.quotationData?.quoteRoute?.[0]?.PODSid),
                FPD: this.getFormattedPort(this.quotationData?.quoteRoute?.[0]?.FPODSid),
                departmentName: this.getDepartmentName(this.quotationData?.quoteRoute?.[0]?.DepartmentMasterSid),
                customerName: this.quotationData?.CustomerName,
                userName: this.userData?.userName,
                toEmail: this.quotationData?.Email || '',
                customerBranchSid: this.quotationData?.CustomerBranchSid || null,
                approvalLink: this.getApprovalUrl(),
                menuMasterSid: this.MenuMasterSid,
                resourceSid: this.QuoteHeaderSid
              }
            });
             this.loadQuotation(this.QuoteHeaderSid);
            const customerId = resp.data?.createdCustomer?.CustomerMasterSid;
            if(customerId){
              this.createdCustomerId = customerId;
              this.ngbModal.open(this.customerCreatedModal, {
                size: 'lg',
                backdrop: 'static',
                centered: true
              });
            } 
            // else {
            //   this.loadQuotation(this.QuoteHeaderSid);
            // }
            if (resolve) resolve(true);
          } else {
            this.appSettingService.showError(resp.message);
            if (resolve) resolve(false);

          }
        },
        () => {
          this.isSaving = false;
          if (resolve) resolve(false);
        }
      )
    } else {

      this.leadService.createQuotation(payload).subscribe(
        (resp: any) => {
          this.isSaving = false;
          if (resp.status) {
            this.quotationForm.markAsPristine();
            this.quotationForm.markAsUntouched();
            this.resetUnsavedState();
            this.appSettingService.showSuccess("Quotation Created Successfully");
            this.emailTriggerService.triggerEmails({
              companyId: this.currentCompany?.CompanyMasterSid,
              branchId: this.currentBranch?.BranchMasterSid,
              menuMasterSid: this.MenuMasterSid,
              action: 'CREATE',
              context: {
                quotationNumber: resp.data?.quoteHeader?.QuoteNumber,
                date: this.datePipe.transform(new Date()),
                POO: this.getFormattedPort(this.quoteRoutes?.at(0)?.get('PORSid')?.value),
                POL: this.getFormattedPort(this.quoteRoutes?.at(0)?.get('POLSid')?.value),
                POD: this.getFormattedPort(this.quoteRoutes?.at(0)?.get('PODSid')?.value),
                FPD: this.getFormattedPort(this.quoteRoutes?.at(0)?.get('FPODSid')?.value),
                departmentName: this.getDepartmentName(this.quoteRoutes?.at(0)?.get('DepartmentMasterSid')?.value),
                customerName: this.quotationForm.get('CustomerName')?.value || this.quotationForm.get('customerName')?.value,
                userName: this.userData?.userName,
                toEmail: this.quotationForm.get('Email')?.value || '',
                customerBranchSid: this.quotationForm.get('CustomerBranchSid')?.value || null,
                approvalLink: this.getApprovalUrl(),
                menuMasterSid: this.MenuMasterSid,
                resourceSid: resp.data?.quoteHeader?.QuoteHeaderSid
              }
            });
            const id = resp.data?.quoteHeader?.QuoteHeaderSid;
            if(id){
              this.router.navigate(['crm/quotation/entry',id])
            }
            if (resolve) resolve(true);
          } else {
            this.modalService.openErrorModal("Quotation Creation Failed");
            if (resolve) resolve(false);
          }
        },
        () => {
          this.isSaving = false;
          if (resolve) resolve(false);
        }
      )
    }
  }

  // SECTION6 - HELPER FUNCTIONS

  disableNonEditFields() {
    const disabledFields = ['QuoteNumber', 'QuoteDate', 'EnquirySid'];
    disabledFields.forEach(field => {
      this.f[field]?.disable();
    });
    this.quoteRoutes.controls.forEach((group:FormGroup)=>{
      
      group.get('DepartmentMasterSid')?.disable();
    })
  }

  private hasInvalidRouteDetails(): boolean {
    return this.quoteRoutes.controls.some((routeControl) => {
      const routeForm = routeControl as FormGroup;
      const routeFields = [
        'DepartmentMasterSid',
        'POLSid',
        'PODSid',
        'effDate',
        'expDate',
        'CargoType'
      ];

      return routeFields.some(fieldName => routeForm.get(fieldName)?.invalid);
    });
  }

  private logInvalidControls(control: AbstractControl | null, path: string): void {
    if (!control) {
      return;
    }

    if (control instanceof FormGroup) {
      Object.keys(control.controls).forEach(key => {
        this.logInvalidControls(control.get(key), `${path}.${key}`);
      });
      return;
    }

    if (control instanceof FormArray) {
      control.controls.forEach((childControl, index) => {
        this.logInvalidControls(childControl, `${path}[${index}]`);
      });
      return;
    }

    if (control.invalid) {
    
    }
  }

  handleValidationOnDept(index: number, type: string | null) {
    const routeForm = this.quoteRoutes.at(index) as FormGroup;
    const cargoMode = this.getRouteCargoMode(routeForm, type);

    const validationConfig = {
      FCL: [],
      LCL: ['GrossWeight', 'Volume'],
      AIR: ['GrossWeight', 'ChargeableWeight'],
      ROAD: ['GrossWeight', 'NetWeight'],
    };

    let allDynamicFields;
    const routeCargoControls = ['CargoType', 'GrossWeight', 'NetWeight', 'Volume', 'ChargeableWeight', 'ContainerType', 'Qty'];
    switch (cargoMode) {
      case 'FCL':
        allDynamicFields = ['GrossWeight', 'NetWeight', 'Volume', 'ChargeableWeight'];
        break;
      case 'LCL':
        allDynamicFields = ['ContainerType', 'Qty','ChargeableWeight'];
        break;
      case 'AIR':
        allDynamicFields = ['ContainerType', 'Qty'];
        break;
      case 'ROAD':
        allDynamicFields = ['ContainerType', 'Volume', 'ChargeableWeight'];
        break;
      default:
        allDynamicFields = [];
    }

    if (cargoMode === 'FCL') {
      routeCargoControls.forEach(fieldName => {
        const control = routeForm.get(fieldName);
        if (control) {
          if (['GrossWeight', 'NetWeight', 'Volume', 'ChargeableWeight'].includes(fieldName)) {
            control.setValue(null, { emitEvent: false });
          }
          control.clearValidators();
          control.updateValueAndValidity({ emitEvent: false });
        }
      });
    }

    allDynamicFields.forEach(fieldName => {
      const control = routeForm.get(fieldName);
      if (control) {
        control.setValue(null, { emitEvent: false });
        control.clearValidators();
        control.updateValueAndValidity({ emitEvent: false });
      }
    });

    if (cargoMode && validationConfig[cargoMode]) {
      const requiredFields = validationConfig[cargoMode];

      requiredFields.forEach(fieldName => {
        const control = routeForm.get(fieldName);
        if (control) {
          const newValidators = [Validators.required];

          if (fieldName !== 'ContainerType' && fieldName !== 'Volume') {
            newValidators.push(Validators.min(1));
          }

          if(fieldName === 'Volume'){
            newValidators.push(Validators.min(0.001));
          }

          control.setValidators(newValidators);
          control.updateValueAndValidity({ emitEvent: false });
        }
      });
    }

    this.syncQuoteCargoValidation(index);

    routeForm.updateValueAndValidity();
  }

  onDeptChange(dept: any, routeIndex: number) {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    routeForm.get('PORSid')?.reset();
    routeForm.get('POLSid')?.reset();
    routeForm.get('PODSid')?.reset();
    routeForm.get('FPODSid')?.reset();
    
    if (!dept || dept === undefined) {
      routeForm.get('segmentType').setValue('LCL');
      this.handleValidationOnDept(routeIndex, 'LCL');
      this.quoteCargo(routeIndex).clear();
      this.refreshRoutePortFilters(routeIndex);
      return;
    }
    const deptType = dept?.departmentType;
   
    const selectedFCLLCL = deptType === "Sea" ? dept?.FCLLCL : deptType?.toUpperCase()
    const selectedCargoMode = this.resolveCargoModeByDepartment(dept);
    routeForm.get('segmentType').setValue(selectedFCLLCL);
    this.handleValidationOnDept(routeIndex, selectedCargoMode);
    if (selectedCargoMode !== 'FCL') {
      this.quoteCargo(routeIndex).clear();
    }
    
    this.refreshRoutePortFilters(routeIndex);
    this.quoteRoutes.controls.forEach((route:FormGroup)=>{
      this.handleSegmentChangeOnAllProducts(routeIndex);
    })

    this.filterChargesBySegment(routeIndex, selectedFCLLCL);
    if (selectedCargoMode === 'FCL') {
      const cargoArray = this.quoteCargo(routeIndex);
      if (cargoArray.length === 0) {
        this.addQuoteCargo(routeIndex);
      }
    }
  }

  onCustomerChange(event: any): void {
    this.quotationForm.get('CustomerName')?.setValue('')
    this.quotationForm.get('CustomerAddress')?.setValue(null);
    this.quotationForm.get('Email')?.setValue('');
    if (!event || event === null || event === undefined) {
      this.cusBranchList = [];
      return;
    }
    const selectedCustomerId = event.CustomerMasterSid;
    this.quotationForm.get('CustomerName').setValue(event.CustomerName);
    this.getCustomerBranches(selectedCustomerId);
  }

  onPODChange(event: any, routeIndex: number) {
  const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
  
  if (!event || event === undefined) {
    routeForm.get('FPODSid')?.setValue(null);
    this.refreshRoutePortFilters(routeIndex);
    return;
  }
  
  // Auto-set FPOD with the same value as POD
  const selectedPortId = typeof event === 'object' ? event.PortMasterSid : event;
  this.refreshRoutePortFilters(routeIndex);
  const allowedFPOD = this.filteredFPODPorts[routeIndex] || [];
  routeForm.get('FPODSid')?.setValue(
    allowedFPOD.some(port => port.PortMasterSid === selectedPortId) ? selectedPortId : null
  );
}

  onChargeChange(charge: any, routeIndex: number, carrierIndex: number, chargeIndex: number) {
    const chargeForm = this.quoteCharges(routeIndex, carrierIndex).at(chargeIndex) as FormGroup;

    if (!charge) {
      const clearFields = ['ChargeDisplayName', 'ChargeUomSid', 'Qty', 'RevenueCurrencyMasterSid', 'RevenueExchangeRate', 'RevenueAmount', 'RevenueLocalAmount', 'unitQtyBasis'];
      clearFields.forEach(ctrl => chargeForm.get(ctrl)?.reset());
      return;
    }

    chargeForm.patchValue({
      ChargeDisplayName: charge.chargeName,
      RevenueChargeUomSid: charge.UOM,
      CostChargeUomSid: charge.UOM,
      RevenueCurrencyMasterSid: charge.CurrencyMasterSid,
      CostCurrencyMasterSid: charge.CurrencyMasterSid,
      unitQtyBasis: charge.UnitQty
    });

    this.updateSingleChargeQty(routeIndex, carrierIndex, chargeIndex);

    this.fetchExchangeRate(routeIndex, carrierIndex, chargeIndex, 'revenue');
    this.fetchExchangeRate(routeIndex, carrierIndex, chargeIndex, 'cost');

  }


  onCarrierChange(carrier: any, routeIndex: number) {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    if (!carrier || carrier === undefined) {
      routeForm.get('CarrierName').setValue('');
      return;
    }
    routeForm.get('CarrierName').setValue(carrier.CustomerName);
  }

  getEnquiryName(EnquirySid: number) {
    if (!EnquirySid) return;
    this.leadService.getEnquiryById(EnquirySid).subscribe(
      (resp: any) => {
        if (resp.status) {
          let enquiryData = resp.data;
          if (enquiryData) {
            this.enquiryNumber = enquiryData?.EnquiryNumber;
          }
        } else {
          this.appSettingService.showError('Error Loading Enquiry Data');
        }
      }
    )
  }


  // filterUnitsBasedOnDept(routeIndex: number, type: string) {
  //   this.filteredUnits[routeIndex] = [];
  //   if (!this.unitMaster || this.unitMaster.length === 0 || !type) {
  //     return;
  //   }
  //   if (type === 'FCL') {
  //     this.filteredUnits[routeIndex] = this.unitMaster.filter(unit => (unit.ShipmentType === "FCL" || unit.ShipmentType === "All"));
  //   } else if (type === "LCL") {
  //     this.filteredUnits[routeIndex] = this.unitMaster.filter(unit =>  (unit.ShipmentType === "LCL" || unit.ShipmentType === "All"));
  //   } else if (type === "AIR") {
  //     this.filteredUnits[routeIndex] = this.unitMaster.filter(unit =>  (unit.ShipmentType === "AIR" || unit.ShipmentType === "All"));
  //   }
  // }

  onRouteChange(routeIndex: number): void {
    this.refreshRoutePortFilters(routeIndex);
  }

  private refreshRoutePortFilters(routeIndex: number): void {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;

    if (!routeForm) {
      return;
    }

    const filteredLists = this.buildRoutePortFilterLists(routeIndex);
    this.applyRoutePortFilterLists(routeIndex, filteredLists);
    this.syncRouteValidation(routeForm);

    if (this.clearInvalidRoutePortSelections(routeForm, filteredLists)) {
      this.applyRoutePortFilterLists(routeIndex, this.buildRoutePortFilterLists(routeIndex));
      this.syncRouteValidation(routeForm);
    }
  }

  private buildRoutePortFilterLists(routeIndex: number) {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    if (!routeForm) {
      return {
        filteredPorts: [],
        filteredPORPorts: [],
        filteredPOLPorts: [],
        filteredPODPorts: [],
        filteredFPODPorts: []
      };
    }

    const segment = routeForm.get('segmentType')?.value;
    const basePorts = this.getFilteredPortsBySegment(segment);
    const department = this.getRouteDepartment(routeForm);
    const shipmentDirection = this.getShipmentDirectionForRoute(department);
    const foreignPorts = basePorts.filter(port => this.isForeignCountryPort(port));
    const companyCountryPorts = basePorts.filter(port => this.isCompanyCountryPort(port));

    let porPorts = [...basePorts];
    let polPorts = [...basePorts];
    let podPorts = [...basePorts];
    let fpodPorts = [...basePorts];

    if (this.shouldUseAllRoutePortOptions(segment, department)) {
      porPorts = [...basePorts];
      polPorts = [...basePorts];
      podPorts = [...basePorts];
      fpodPorts = [...basePorts];
    } else if (shipmentDirection === 'EXPORT') {
      porPorts = [...companyCountryPorts];
      polPorts = [...companyCountryPorts];
      podPorts = [...foreignPorts];
      fpodPorts = this.getPortsByReferenceCountry(routeForm.get('PODSid')?.value, foreignPorts);
    } else if (shipmentDirection === 'IMPORT') {
      porPorts = this.getPortsByReferenceCountry(routeForm.get('POLSid')?.value, foreignPorts);
      polPorts = [...foreignPorts];
      podPorts = [...companyCountryPorts];
      fpodPorts = this.getPortsByReferenceCountry(routeForm.get('PODSid')?.value, companyCountryPorts);
    }

    const selectedPOL = routeForm.get('POLSid')?.value;
    const selectedPOD = routeForm.get('PODSid')?.value;

    return {
      filteredPorts: basePorts,
      filteredPORPorts: porPorts,
      filteredPOLPorts: polPorts.filter(port => port.PortMasterSid !== selectedPOD),
      filteredPODPorts: podPorts.filter(port => port.PortMasterSid !== selectedPOL),
      filteredFPODPorts: fpodPorts
    };
  }

  getFilteredPortsBySegment(segment: string): any[] {
    const normalizedSegment = this.normalizePortText(segment);
    if (normalizedSegment === 'AIR') {
      return this.ports.filter(port => this.normalizePortText(port?.PortType) === 'AIR');
    } else if (normalizedSegment === 'FCL' || normalizedSegment === 'LCL' || normalizedSegment === 'SEA') {
      return this.ports.filter(port => this.normalizePortText(port?.PortType) === 'SEA');
    } else if (normalizedSegment === 'ROAD') {
      return this.ports.filter(port => {
        const portType = this.normalizePortText(port?.PortType);
        return portType === 'ROAD' || portType.includes('ROAD') || portType.includes('LAND') || portType.includes('LOCATION');
      });
    } else if (normalizedSegment === 'TRANSPORT') {
      return [...this.ports];
    } else if (normalizedSegment === 'OTHER' || normalizedSegment === 'OTHERS') {
      return [...this.ports];
    }
    return [];
  }

  private shouldUseAllRoutePortOptions(segment: string, department?: any): boolean {
    const normalizedSegment = this.normalizePortText(segment);
    const departmentType = this.normalizePortText(department?.departmentType);

    return ['OTHER', 'OTHERS', 'TRANSPORT'].includes(normalizedSegment)
      || ['OTHER', 'OTHERS', 'TRANSPORT'].includes(departmentType);
  }

  private getQuotationCargoMode(segment: string | null | undefined): 'FCL' | 'LCL' | 'AIR' | 'ROAD' {
    const normalizedSegment = this.normalizePortText(segment);
    if (normalizedSegment.includes('FCL')) {
      return 'FCL';
    }
    if (normalizedSegment === 'AIR') {
      return 'AIR';
    }
    if (normalizedSegment === 'ROAD' || normalizedSegment === 'TRANSPORT') {
      return 'ROAD';
    }
    return 'LCL';
  }

  private resolveCargoModeByDepartment(department: any): 'FCL' | 'LCL' | 'AIR' | 'ROAD' {
    const departmentType = this.normalizePortText(department?.departmentType);

    // Sea: keep existing behavior from FCL/LCL setup.
    if (departmentType === 'SEA') {
      return this.normalizePortText(department?.FCLLCL) === 'FCL' ? 'FCL' : 'LCL';
    }

    if (departmentType === 'AIR') {
      return 'AIR';
    }

    // Road/Transport: FCL/LCL decides fields; Others behaves like FCL.
    if (departmentType === 'ROAD' || departmentType === 'TRANSPORT') {
      return this.normalizePortText(department?.FCLLCL) === 'LCL' ? 'LCL' : 'FCL';
    }

    return this.getQuotationCargoMode(departmentType);
  }

  private getRouteCargoMode(
    segmentOrRoute: AbstractControl | string | any | null | undefined,
    fallbackSegment?: string | null | undefined
  ): 'FCL' | 'LCL' | 'AIR' | 'ROAD' {
    if (typeof segmentOrRoute === 'string' || segmentOrRoute == null) {
      return this.getQuotationCargoMode(segmentOrRoute ?? fallbackSegment);
    }

    // FormGroup flow.
    if (typeof segmentOrRoute?.get === 'function') {
      const routeForm = segmentOrRoute as FormGroup;
      const department = this.getRouteDepartment(routeForm);
      if (department) {
        return this.resolveCargoModeByDepartment(department);
      }

      return this.getQuotationCargoMode(routeForm.get('segmentType')?.value ?? fallbackSegment);
    }

    // Raw route object flow (payload/response mapping).
    const routeLike = segmentOrRoute as any;
    const departmentSid = Number(routeLike?.DepartmentMasterSid);
    const department = this.departments.find(
      dep => Number(dep?.DepartmentMasterSid) === departmentSid
    );
    if (department) {
      return this.resolveCargoModeByDepartment(department);
    }

    return this.getQuotationCargoMode(routeLike?.segmentType ?? fallbackSegment);
  }

  isLclStyleQuotationSegment(segmentOrRoute: AbstractControl | string | null | undefined): boolean {
    return this.getRouteCargoMode(segmentOrRoute) === 'LCL';
  }

  getRouteSegmentType(routeControl: AbstractControl | null | undefined): string {
    if (!routeControl) {
      return 'LCL';
    }

    const routeForm = routeControl as FormGroup;
    const segmentFromControl = routeForm.get('segmentType')?.value;
    if (segmentFromControl) {
      return segmentFromControl;
    }

    const segmentFromRaw = routeForm.getRawValue?.()?.segmentType;
    return segmentFromRaw || 'LCL';
  }

  isSurfaceQuotationSegment(segmentOrRoute: AbstractControl | string | null | undefined): boolean {
    return this.getRouteCargoMode(segmentOrRoute) === 'ROAD';
  }

  isAirQuotationSegment(segmentOrRoute: AbstractControl | string | null | undefined): boolean {
    return this.getRouteCargoMode(segmentOrRoute) === 'AIR';
  }

  isFclQuotationSegment(segmentOrRoute: AbstractControl | string | null | undefined): boolean {
    return this.getRouteCargoMode(segmentOrRoute) === 'FCL';
  }

  private applyRoutePortFilterLists(routeIndex: number, filteredLists: any): void {
    this.filteredPorts = filteredLists.filteredPorts;
    this.filteredPORPorts[routeIndex] = filteredLists.filteredPORPorts;
    this.filteredPOLPorts[routeIndex] = filteredLists.filteredPOLPorts;
    this.filteredPODPorts[routeIndex] = filteredLists.filteredPODPorts;
    this.filteredFPODPorts[routeIndex] = filteredLists.filteredFPODPorts;
  }

  private clearInvalidRoutePortSelections(routeForm: FormGroup, filteredLists: any): boolean {
    let hasChanges = false;

    // hasChanges = this.clearRoutePortControlIfInvalid(routeForm, 'PORSid', filteredLists.filteredPORPorts) || hasChanges;
    hasChanges = this.clearRoutePortControlIfInvalid(routeForm, 'POLSid', filteredLists.filteredPOLPorts) || hasChanges;
    hasChanges = this.clearRoutePortControlIfInvalid(routeForm, 'PODSid', filteredLists.filteredPODPorts) || hasChanges;
    hasChanges = this.clearRoutePortControlIfInvalid(routeForm, 'FPODSid', filteredLists.filteredFPODPorts) || hasChanges;

    return hasChanges;
  }

  private clearRoutePortControlIfInvalid(
    routeForm: FormGroup,
    controlName: 'PORSid' | 'POLSid' | 'PODSid' | 'FPODSid',
    allowedPorts: any[]
  ): boolean {
    const control = routeForm.get(controlName);
    const selectedValue = control?.value;

    if (!selectedValue) {
      return false;
    }

    const isValid = allowedPorts.some(port => port.PortMasterSid === selectedValue);
    if (!isValid) {
      control?.setValue(null, { emitEvent: false });
      return true;
    }

    return false;
  }

  private syncRouteValidation(routeForm: FormGroup): void {
    const selectedPOL = routeForm.get('POLSid')?.value;
    const selectedPOD = routeForm.get('PODSid')?.value;

    if (selectedPOL && selectedPOD && selectedPOL === selectedPOD) {
      this.setControlError(routeForm.get('POLSid'), 'samePort', true);
      this.setControlError(routeForm.get('PODSid'), 'samePort', true);
    } else {
      this.clearControlError(routeForm.get('POLSid'), 'samePort');
      this.clearControlError(routeForm.get('PODSid'), 'samePort');
    }
  }

  private getRouteDepartment(routeForm: FormGroup): any {
    const departmentSid = routeForm.get('DepartmentMasterSid')?.value;
    if (!departmentSid) {
      return null;
    }

    return this.departments.find(dept => dept.DepartmentMasterSid === departmentSid) || null;
  }

  private getShipmentDirectionForRoute(department?: any): 'EXPORT' | 'IMPORT' | '' {
    const departmentDirection = this.normalizePortText(department?.ExportImport);
    if (departmentDirection === 'EXPORT' || departmentDirection === 'IMPORT') {
      return departmentDirection as 'EXPORT' | 'IMPORT';
    }

    return '';
  }

  private getPortsByReferenceCountry(referencePortSid: number | null | undefined, fallbackPorts: any[]): any[] {
    const referencePort = this.getPortBySid(referencePortSid);
    if (!referencePort) {
      return [...fallbackPorts];
    }

    const referenceCountryId = this.toNumericValue(referencePort?.CountryMasterSid);
    if (referenceCountryId) {
      return fallbackPorts.filter(port => this.toNumericValue(port?.CountryMasterSid) === referenceCountryId);
    }

    const referenceCountryName = this.normalizePortText(referencePort?.Country || referencePort?.countryMaster?.countryName);
    if (!referenceCountryName) {
      return [...fallbackPorts];
    }

    return fallbackPorts.filter(port => {
      const portCountryName = this.normalizePortText(port?.Country || port?.countryMaster?.countryName);
      return portCountryName === referenceCountryName;
    });
  }

  private isCompanyCountryPort(port: any): boolean {
    const companyCountryId = this.toNumericValue(this.currentCompany?.CountryMasterSid);
    const portCountryId = this.toNumericValue(port?.CountryMasterSid);

    if (companyCountryId && portCountryId) {
      return companyCountryId === portCountryId;
    }

    const companyCountryName = this.normalizePortText(this.currentCompany?.CountryName);
    const portCountryName = this.normalizePortText(port?.Country || port?.countryMaster?.countryName);

    return !!companyCountryName && !!portCountryName && companyCountryName === portCountryName;
  }

  private isForeignCountryPort(port: any): boolean {
    const companyCountryId = this.toNumericValue(this.currentCompany?.CountryMasterSid);
    const portCountryId = this.toNumericValue(port?.CountryMasterSid);

    if (companyCountryId && portCountryId) {
      return companyCountryId !== portCountryId;
    }

    const companyCountryName = this.normalizePortText(this.currentCompany?.CountryName);
    const portCountryName = this.normalizePortText(port?.Country || port?.countryMaster?.countryName);

    return !!companyCountryName && !!portCountryName && companyCountryName !== portCountryName;
  }

  private getPortBySid(portSid: number | null | undefined): any | null {
    if (!portSid) {
      return null;
    }

    return this.ports.find(port => port.PortMasterSid === portSid) || null;
  }

  private normalizePortText(value: any): string {
    return String(value ?? '').trim().toUpperCase();
  }

  private toNumericValue(value: any): number | null {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
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

  getCustomerBranches(CustomerMasterSid: number) {
    this.leadService.getCustomerBranchByCustomerId(CustomerMasterSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.cusBranchList = resp.data;
        } else {
          this.appSettingService.showError('Error loading customer branches.')
          console.error(resp.message);
        }
      }
    )
  }

  handleQtyForRoutes(routeIndex:number,carrierIndex:number){
    const chargeArr = this.quoteCharges(routeIndex,carrierIndex);
    chargeArr.controls.forEach((_, chargeIndex) => {
      this.handleQty(routeIndex,carrierIndex, chargeIndex);
    });
  }

  handleQty(routeIndex:number,carrierIndex:number,chargeIndex:number){
    const routeCtrl = this.quoteRoutes.at(routeIndex) as FormGroup;
    const chargeCtrl = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
    const segment = routeCtrl?.get('segmentType').getRawValue();
    if(segment === "FCL"){
      let value = routeCtrl.get('ContainerQty')?.getRawValue()
      chargeCtrl.get('Qty')?.setValue(value);
    } else if(segment === "LCL"){
      chargeCtrl.get('Qty')?.setValue(routeCtrl.get('CBM')?.getRawValue());
    } else if(segment === "AIR"){
      chargeCtrl.get('Qty')?.setValue(routeCtrl.get('ChargeableWeight')?.getRawValue());
    }
    this.calculateRevenueTotalAmount(routeIndex,carrierIndex,chargeIndex);
    this.calculateCostTotalAmount(routeIndex,carrierIndex,chargeIndex);
  }

  calculateTotalAmountForRoute(routeIndex: number,carrierIndex:number) {
    const chargeArr = this.quoteCharges(routeIndex,carrierIndex);
    chargeArr.controls.forEach((_, chargeIndex) => {
      this.calculateRevenueTotalAmount(routeIndex, carrierIndex , chargeIndex);
      this.calculateCostTotalAmount(routeIndex , carrierIndex, chargeIndex);
    });
  }



  calculateRevenueTotalAmount(routeIndex: number,carrierIndex:number, chargeIndex: number) {
    const chargeCtrl = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
    const qty = Number(chargeCtrl.get('Qty')?.value);
    const revenueRate = Number(chargeCtrl.get('RevenueRate')?.value);
    const revExRate = Number(chargeCtrl.get('RevenueExchangeRate')?.value);
    if (qty && revenueRate) {
      chargeCtrl.get('RevenueAmount')?.setValue((qty * revenueRate).toFixed(this.digitsAfterDecimal));
    } else {
      chargeCtrl.get('RevenueAmount')?.setValue((0).toFixed(this.digitsAfterDecimal));
    }

    if (qty && revenueRate && revExRate) {
      chargeCtrl.get('RevenueLocalAmount')?.setValue((qty * revenueRate * revExRate).toFixed(this.digitsAfterDecimal));
      this.blurRevenueLocalInput(routeIndex, carrierIndex, chargeIndex);
    } else {
      chargeCtrl.get('RevenueLocalAmount')?.setValue((0).toFixed(this.digitsAfterDecimal));
    }
  }

  blurRevenueLocalInput(routeIndex: number, carrierIndex: number, chargeIndex: number) {
    const el = this.revenueLocalInputs.find(ref => {
      const e = ref.nativeElement;
      return +e.getAttribute('data-route') === routeIndex &&
        +e.getAttribute('data-carrier') === carrierIndex &&
        +e.getAttribute('data-charge') === chargeIndex;
    });

    if (el && document.activeElement !== el.nativeElement) {
      el.nativeElement.blur();
    }
  }

  calculateCostTotalAmount(routeIndex: number,carrierIndex:number, chargeIndex: number) {
    const chargeCtrl = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
    const qty = chargeCtrl.get('Qty')?.value;
    const costRate = chargeCtrl.get('CostRate')?.value;
    const costExRate = chargeCtrl.get('CostExchangeRate')?.value;
    if(qty && costRate){
      chargeCtrl.get('CostAmount')?.setValue(qty * costRate);
    } else {
      chargeCtrl.get('CostAmount')?.setValue('0');
    }

    if (qty && costRate && costExRate) {
      chargeCtrl.get('CostLocalAmount')?.setValue(qty * costRate * costExRate);
    } else {
      chargeCtrl.get('CostLocalAmount')?.setValue('0');
    }
  }

  hasEveryRequiredFieldsFilled(routeIndex: number) {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;

    for (let index = 0; index < this.requiredFieldsToGetTariff.length; index++) {
      const element = routeForm.get(this.requiredFieldsToGetTariff[index]);
      if (!element.value) {
        return false
      }
    }
    return true
  }

  // getTariffDetails(routeIndex:number,carrierIndex:number,template:TemplateRef<any>){
  //   const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
  //   const carrierForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
  //   if(!this.hasEveryRequiredFieldsFilled(routeIndex)){
  //     this.appSettingService.showWarning("Please fill all the required fields to get tariff details.");

  //     this.requiredFieldsToGetTariff.forEach(ctrl => {
  //       if(routeForm.get(ctrl)){
  //         routeForm.get(ctrl).markAsTouched();
  //       }
  //     });
  //     return;
  //   }
  //   this.tariffLoading = true;
  //   this.currentRouteIndex = routeIndex;
  //   this.currentCarrierIndex = carrierIndex;
  //   const routeCtrl = this.quoteRoutes.at(this.currentRouteIndex) as FormGroup;

  //   this.ngbModal.open(template,{
  //     size : 'lg',
  //     centered : true , 
  //     backdrop:'static'
  //   });

  //   const payload = {
  //     CompanyMasterSid : this.currentCompany.CompanyMasterSid,
  //     DepartmentMasterSid : routeForm.get('DepartmentMasterSid')?.value,
  //     PORSid : routeForm.get('PORSid')?.value,
  //     POLSid : routeForm.get('POLSid')?.value,
  //     PODSid : routeForm.get('PODSid')?.value,
  //     FPODSid : routeForm.get('FPODSid')?.value,
  //     CargoType : routeForm.get('CargoType')?.value,
  //     EffectiveDate : routeForm.get('effDate')?.value ? new Date(routeForm.get('effDate')?.value) : null,
  //     ExpiredDate : routeForm.get('expDate')?.value ? new Date(routeForm.get('expDate')?.value) : null,
  //     Carrier : carrierForm.get('CarrierMasterSid')?.value,
  //     IncoTerms : routeForm.get('ServiceLevel')?.value,
  //   }

  //   this.leadService.getTariffDetailsByQuote(payload).subscribe(
  //     (resp:any)=>{
  //       if(resp.status){
  //         const response : any[] = resp.data || [];
  //         const existingValue = routeForm.getRawValue();
  //         const existingTariffDetailId = (existingValue?.quoteCharges || []).map((ch)=> ch.TariffDetailSid)
  //         this.tariffDetails = response
  //           .filter(td => !existingTariffDetailId.includes(td.TariffDetailSid))
  //           .map((td:any)=>{
  //           const charge = this.getCharge(td.ChargeCode);
  //           let qtySourceField = this.findFieldForQty(charge.UnitQty);
  //           let qtyValue;
  //           if (typeof qtySourceField === 'string' && routeForm.get(qtySourceField) && qtySourceField !== '1') {
  //             qtyValue = routeForm.get(qtySourceField)?.value || 1;
  //           } else if (qtySourceField === '1') {
  //             qtyValue = qtySourceField;
  //           }
  //             return {
  //               ...td,
  //               ChargeDisplayName: charge?.chargeName,
  //               chargeCode: charge?.chargeCode,
  //               ChargeUomSid: charge?.ChargeMasterSid,
  //               Qty: Number(qtyValue) || 0,

  //               RevenueChargeUomSid: td?.UOMSid,
  //               RevenuePrepaidCollect: "Prepaid",
  //               RevenueCurrencyMasterSid: td?.SaleCurrency,
  //               RevenueRate: (Number(td?.SalePerUnitPrice) || 0).toFixed(this.digitsAfterDecimal),
  //               RevenueExchangeRate: (Number(td?.revenueExchangeRate) || 0).toFixed(this.digitsAfterDecimal),
  //               RevenueDrCr: "C",
  //               RevenueAmount: ((Number(qtyValue) || 0) * (Number(td?.SalePerUnitPrice) || 0)).toFixed(this.digitsAfterDecimal),
  //               RevenueLocalAmount: ((Number(td?.revenueExchangeRate) || 0) * (Number(qtyValue) || 0) * (Number(td?.SalePerUnitPrice) || 0)).toFixed(this.digitsAfterDecimal),

  //               CostChargeUomSid: td?.UOMSid,
  //               CostPrepaidCollect: "Prepaid",
  //               CostCurrencyMasterSid: td?.BuyCurrency,
  //               CostRate: (Number(td?.BuyPerUnitPrice) || 0).toFixed(this.digitsAfterDecimal),
  //               CostExchangeRate: (Number(td?.costExchangeRate) || 0).toFixed(this.digitsAfterDecimal),
  //               CostDrCr: "D",
  //               CostAmount: ((Number(qtyValue) || 0) * (Number(td?.BuyPerUnitPrice) || 0)).toFixed(this.digitsAfterDecimal),
  //               CostLocalAmount: ((Number(td?.costExchangeRate) || 0) * (Number(qtyValue) || 0) * (Number(td?.BuyPerUnitPrice) || 0)).toFixed(this.digitsAfterDecimal),
  //             };
  //         })
  //         console.log(this.tariffDetails);
  //         this.tariffLoading = false;
  //       } else {
  //         this.appSettingService.showError("Error loading Tariff Details");
  //         this.tariffLoading = false;
  //       }
  //     }
  //   )
  // }

  getTariffDetails(routeIndex: number, carrierIndex: number, template: TemplateRef<any>) {
    if (this.costRevenueAccess === 'HIDE_BOTH' || this.costRevenueAccess === 'READ_ONLY') {
      this.toastr.warning(`Getting tariff is not allowed. Cost/Revenue access for this branch is set to '${this.costRevenueAccess}'. Please contact your admin to change the access in User Master.`, 'Access Restricted', { timeOut: 6000 });
      return;
    }
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    const carrierForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
    const routeRawValue = routeForm.getRawValue();
    const carrierRawValue = carrierForm.getRawValue();
    const isFclRoute = this.isFclQuotationSegment(routeForm);
    this.isStandardRate = false;

    if (!this.hasEveryRequiredFieldsFilled(routeIndex)) {
      this.appSettingService.showWarning("Please fill all the required fields to get tariff details.");
      this.requiredFieldsToGetTariff.forEach(ctrl => {
        if (routeForm.get(ctrl)) {
          routeForm.get(ctrl).markAsTouched();
        }
      });
      return;
    }

    if (isFclRoute) {
      const cargoControls = this.quoteCargo(routeIndex).controls as FormGroup[];
      const hasSelectedContainerType = cargoControls.some(
        (cargoCtrl: FormGroup) => !!cargoCtrl.get('ContainerType')?.value
      );

      if (!hasSelectedContainerType) {
        cargoControls.forEach((cargoCtrl: FormGroup) => {
          cargoCtrl.get('ContainerType')?.markAsTouched();
          cargoCtrl.get('ContainerType')?.updateValueAndValidity({ emitEvent: false });
        });
        this.toastr.warning('Please choose Container Type to fetch tariff.');
        return;
      }
    }
    
    this.tariffLoading = true;
    this.currentRouteIndex = routeIndex;
    this.currentCarrierIndex = carrierIndex;

    this.ngbModal.open(template, { size: 'lg', centered: true, backdrop: 'static' });

    const cargoItems = this.quoteCargo(routeIndex).controls.map((cargoCtrl: any) => {
      const cargoRawValue = cargoCtrl.getRawValue();
      const containerTypeValue = cargoRawValue?.ContainerType || null;
      const containerTypeSid = this.resolveContainerTypeSid(containerTypeValue);
      const containerTypeName = this.resolveContainerTypeName(containerTypeValue);
      return {
        CargoType: cargoRawValue?.CargoType,
        ContainerType: containerTypeSid,
        ContainerTypeName: containerTypeName,
        GrossWeight: cargoRawValue?.GrossWeight,
        Volume: cargoRawValue?.Volume,
        NoofContainers: cargoRawValue?.Qty,
        ChargeableWeight: cargoRawValue?.ChargeableWeight,
        ShipmentTerms: cargoRawValue?.ShipmentTerms,
      };
    });

    const routeContainerTypeValue = routeRawValue?.ContainerType || null;
    const routeContainerTypeSid = this.resolveContainerTypeSid(routeContainerTypeValue);
    const payloadContainerType = routeContainerTypeSid
      ?? cargoItems.find((cargo: any) => cargo.ContainerType)?.ContainerType
      ?? null;
    const payloadCargoType = routeRawValue?.CargoType
      ?? cargoItems.find((cargo: any) => !!cargo.CargoType)?.CargoType
      ?? 'General';

    // forkJoin([]) completes without emitting in RxJS 7 — spinner would hang forever.
    // Always ensure at least one cargo item using route-level fields as fallback.
    const effectiveCargoItems = cargoItems.length > 0 ? cargoItems : [{
      CargoType: payloadCargoType,
      ContainerType: payloadContainerType,
      ContainerTypeName: null,
      GrossWeight: null,
      Volume: null,
      NoofContainers: 1,
      ChargeableWeight: null,
      ShipmentTerms: null,
    }];

    const basePayload = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DepartmentMasterSid: routeRawValue?.DepartmentMasterSid,
      PORSid: routeRawValue?.PORSid,
      POLSid: routeRawValue?.POLSid,
      PODSid: routeRawValue?.PODSid,
      FPODSid: routeRawValue?.FPODSid,
      EffectiveDate: routeRawValue?.effDate ? new Date(routeRawValue.effDate) : null,
      ExpiredDate: routeRawValue?.expDate ? new Date(routeRawValue.expDate) : null,
      Carrier: carrierRawValue?.CarrierMasterSid,
      IncoTerms: routeRawValue?.ServiceLevel,
    };
    const _deptName = this.getDepartmentName(routeRawValue?.DepartmentMasterSid);
    const _porCode = this.getPortCodeBySid(routeRawValue?.PORSid);
    const _polCode = this.getPortCodeBySid(routeRawValue?.POLSid);
    const _podCode = this.getPortCodeBySid(routeRawValue?.PODSid);
    const _fpodCode = this.getPortCodeBySid(routeRawValue?.FPODSid);
    const _carrierName = carrierRawValue?.CarrierName;
    const _incoTerms = routeRawValue?.ServiceLevel;
    const _cargoDesc = effectiveCargoItems
      .map((c: any) => this.getTariffCargoDisplayLabel(c, isFclRoute))
      .filter(Boolean).join(', ');
    const _formatDate = (d: any) => d ? new Date(d).toLocaleDateString() : '';
    const _comboParts: string[] = [];
    if (_deptName) _comboParts.push(`Department: ${_deptName}`);
    if (_porCode) _comboParts.push(`POO: ${_porCode}`);
    if (_polCode) _comboParts.push(`POL: ${_polCode}`);
    if (_podCode) _comboParts.push(`POD: ${_podCode}`);
    if (_fpodCode) _comboParts.push(`FPOD: ${_fpodCode}`);
    if (_carrierName) _comboParts.push(`Carrier: ${_carrierName}`);
    if (_incoTerms) _comboParts.push(`IncoTerms: ${_incoTerms}`);
    if (_cargoDesc) _comboParts.push(`Cargo: ${_cargoDesc}`);
    if (routeRawValue?.effDate) _comboParts.push(`Period: ${_formatDate(routeRawValue.effDate)}${routeRawValue?.expDate ? ' – ' + _formatDate(routeRawValue.expDate) : ''}`);
    this.tariffSearchedCombination = _comboParts.length
      ? `Specific tariff not found for: ${_comboParts.join(' · ')}. Showing standard rates.`
      : 'No specific tariff found for the searched combination. Showing standard rates.';

    const tariffObservables = effectiveCargoItems.map((cargo: any) =>
      this.leadService.getTariffDetailsByQuote({
        ...basePayload,
        CargoType: cargo?.CargoType || payloadCargoType,
        ContainerType: cargo?.ContainerType || payloadContainerType,
        cargoItems: [cargo],
      }).pipe(catchError(() => of({ status: false, data: [] })))
    );

    forkJoin(tariffObservables).subscribe((results: any[]) => {
      const seenCommonTariffSids = new Set<number>();
      const standardRateLabels: string[] = [];
      const commonItems: any[] = [];
      const existingCharges = (routeForm.getRawValue().quoteCarriers[carrierIndex]?.quoteCharges || []);
      const existingTariffDetailSids = new Set<number>(
        existingCharges
          .filter((row: any) => row?.ChargeUomSid && row?.TariffDetailSid)
          .map((row: any) => Number(row.TariffDetailSid))
      );
      const existingCommonChargeKeys = new Set<string>(
        existingCharges
          .filter((row: any) => row?.ChargeUomSid)
          .map((row: any) => this.getAppliedTariffChargeKey(row))
          .filter((key: string) => !!key)
      );

      this.tariffDetails = [];
      this.tariffCargoGroups = [];
      this.isStandardRate = false;
      this.tariffHeaderSid = null;

      results.forEach((resp: any, index: number) => {
        const response: any[] = resp?.status && Array.isArray(resp.data) ? resp.data : [];
        const cargo: any = effectiveCargoItems[index] || {};
        const isStandardRate = response[0]?.isStandardRate === true;
        const label = this.getTariffGroupLabel(cargo, index, isFclRoute);

        const items = response
          .map((td: any) => {
            const charge = this.getCharge(td.ChargeCode);
            const qtyValue = this.resolveTariffQtyValue(routeForm, [cargo], charge, td);
            const revenueAmount = (Number(qtyValue) || 1) * (Number(td?.SalePerUnitPrice) || 0);
            const costAmount = (Number(qtyValue) || 1) * (Number(td?.BuyPerUnitPrice) || 0);
            const isCommonCharge = this.isCommonTariffCharge(charge?.UnitQty);

            return {
              ...td,
              selected: true,
              TariffDetailSid: td?.TariffDetailSid,
              ChargeDisplayName: charge?.chargeName,
              chargeCode: charge?.chargeCode,
              ChargeUomSid: charge?.ChargeMasterSid,
              UnitQty: charge?.UnitQty,
              TariffCargoType: cargo?.CargoType || td?.CargoType || null,
              TariffContainerType: cargo?.ContainerType || td?.ContainerType || null,
              Qty: Number(qtyValue) || 1,
              RevenueChargeUomSid: td?.UOMSid,
              RevenuePrepaidCollect: 'Prepaid',
              RevenueCurrencyMasterSid: td?.SaleCurrency,
              RevenueRate: (Number(td?.SalePerUnitPrice) || 0).toFixed(this.digitsAfterDecimal),
              RevenueExchangeRate: (Number(td?.revenueExchangeRate) || 0).toFixed(this.digitsAfterDecimal),
              RevenueDrCr: 'C',
              RevenueAmount: revenueAmount.toFixed(this.digitsAfterDecimal),
              RevenueLocalAmount: (revenueAmount * (Number(td?.revenueExchangeRate) || 0)).toFixed(this.digitsAfterDecimal),
              CostChargeUomSid: td?.UOMSid,
              CostPrepaidCollect: 'Prepaid',
              CostCurrencyMasterSid: td?.BuyCurrency,
              CostRate: (Number(td?.BuyPerUnitPrice) || 0).toFixed(this.digitsAfterDecimal),
              CostExchangeRate: (Number(td?.costExchangeRate) || 0).toFixed(this.digitsAfterDecimal),
              CostDrCr: 'D',
              CostAmount: costAmount.toFixed(this.digitsAfterDecimal),
              CostLocalAmount: (costAmount * (Number(td?.costExchangeRate) || 0)).toFixed(this.digitsAfterDecimal),
              isCommonCharge,
            };
          })
          .filter((item: any) => !this.isTariffAlreadyApplied(item, existingTariffDetailSids, existingCommonChargeKeys));

        const splitItems = items.filter((item: any) => !item.isCommonCharge);
        const newCommonItems = items.filter((item: any) => {
          if (!item.isCommonCharge || seenCommonTariffSids.has(Number(item.TariffDetailSid))) {
            return false;
          }
          seenCommonTariffSids.add(Number(item.TariffDetailSid));
          return true;
        });

        if (splitItems.length > 0) {
          this.tariffCargoGroups.push({ cargoLabel: label, items: splitItems });
          this.tariffDetails.push(...splitItems);
        }

        if (newCommonItems.length > 0) {
          commonItems.push(...newCommonItems);
          this.tariffDetails.push(...newCommonItems);
        }

        if (isStandardRate) {
          standardRateLabels.push(label);
        }
      });

      if (commonItems.length > 0) {
        this.tariffCargoGroups.unshift({ cargoLabel: 'Common Charges', items: commonItems });
      }

      this.isStandardRate = standardRateLabels.length > 0;
      this.tariffHeaderSid = this.tariffDetails[0]?.TariffHeaderSid || null;

      if (this.tariffCargoGroups.length === 0) {
        this.appSettingService.showError('No tariff charges found for the selected criteria.');
        this.ngbModal.dismissAll();
      } else if (standardRateLabels.length > 0) {
        this.appSettingService.showInfo('No specific tariff found. Displaying standard rates.');
      }

      this.tariffLoading = false;
    }, () => {
      this.tariffLoading = false;
      this.ngbModal.dismissAll();
      this.appSettingService.showError('Error loading Tariff Details');
    });
  }

  getQtyByContainerType(routeIndex: number, containerType: number): number {
    const cargoControls = this.quoteCargo(routeIndex).controls as FormGroup[];

    return cargoControls
      .map(ctrl => ctrl.getRawValue())
      .filter(cargo => cargo.ContainerType === containerType)
      .reduce((sum, cargo) => sum + (Number(cargo.Qty) || 0), 0);
  }

  isCommonTariffCharge(unitQty: string) {
    const trimmedUnitQty = String(unitQty || '').trim();
    return trimmedUnitQty === 'Per BL'
      || trimmedUnitQty === 'BL'
      || trimmedUnitQty === 'Per Shipment'
      || trimmedUnitQty === 'Shipment';
  }

  getAppliedTariffChargeKey(item: any) {
    const chargeMasterSid = item?.ChargeMasterSid || item?.ChargeUomSid;
    const unitQty = String(item?.UnitQty || item?.unitQtyBasis || '').trim();

    if (!chargeMasterSid || !this.isCommonTariffCharge(unitQty)) {
      return '';
    }

    return `${chargeMasterSid}__${unitQty}`;
  }

  isTariffAlreadyApplied(item: any, existingTariffDetailSids: Set<number>, existingCommonChargeKeys: Set<string>) {
    if (item?.TariffDetailSid && existingTariffDetailSids.has(Number(item.TariffDetailSid))) {
      return true;
    }

    const commonChargeKey = this.getAppliedTariffChargeKey(item);
    return !!commonChargeKey && existingCommonChargeKeys.has(commonChargeKey);
  }

  // Add this method to your component class
canGetTariff(routeIndex: number): boolean {
  const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
  
  if (!routeForm) return false;
  
  // Check if all required fields have values
  for (const field of this.requiredFieldsToGetTariff) {
    const control = routeForm.get(field);
    const value = control?.value;
    
    // Check if the value is null, undefined, or empty
    if (!value && value !== 0) { // Allow 0 as valid value
      return false;
    }
    
    // For date fields, check if it's a valid date
    if ((field === 'effDate' || field === 'expDate') && value) {
      if (isNaN(new Date(value).getTime())) {
        return false;
      }
    }
  }
  
  return true;
}

  getCharge(chargeCode){
    if(!chargeCode || !this.chargeMaster || this.chargeMaster.length === 0){
      return {};
    }
    const charge = this.chargeMaster.find(ch => ch.chargeCode === chargeCode);
    return charge;
  }

  isFormValidExcept(form: FormGroup, exceptControlName: string): boolean {
    return Object.entries(form.controls)
      .filter(([name]) => name !== exceptControlName)
      .every(([_, control]) => {
        if (control.validator) {
          const errors = control.validator(control);
          return errors === null;
        }
        return true;
      });
  }


  closeTariffModal(){
    this.currentRouteIndex = undefined;
    this.tariffDetails = [];
    this.tariffCargoGroups = [];
    this.tariffSearchedCombination = '';
    this.tariffHeaderSid = null;
    this.ngbModal.dismissAll();
  }

  private initializeVoiceNavigation(): void {
    this.isVoiceSupported = this.voiceRecognitionService.isSupported();
    if (!this.isVoiceSupported) {
      return;
    }

    this.voiceCommands = [
      'quotation tab',
      'route details',
      'add route',
      'add cargo',
      'add product',
      'save',
      'next',
      'previous',
      'skip',
      'clear',
      'stop'
    ];
  }

  private setupVoiceSubscriptions(): void {
    this.voiceRecognitionService.navigationCommand.subscribe((command: string) => {
      this.spokenText = command;
      this.handleNavigationCommand(command);
    });

    this.voiceRecognitionService.voiceInputComplete.subscribe((transcript: string) => {
      this.spokenText = transcript;
      this.handleVoiceInput(transcript);
    });
  }

  startVoiceNavigation(): void {
    if (!this.isVoiceSupported) return;

    if (this.voiceRecognitionService.isContinuous) {
      this.saveVoiceState();
      this.voiceRecognitionService.stopListening();
      this.isListening = false;
      this.toastr.info('Voice assistant stopped');
      return;
    }

    this.voiceRecognitionService.startContinuous();
    this.isListening = true;
    this.toastr.success('Voice assistant started');

    setTimeout(() => this.restoreVoiceState(), 250);
  }

  stopVoiceGuide(): void {
    if (this.voiceRecognitionService.isContinuous) {
      this.saveVoiceState();
      this.voiceRecognitionService.stopListening();
    }

    this.isListening = false;
    this.spokenText = '';
    this.currentFieldName = '';
  }

  private saveVoiceState(): void {
    this.voiceResumeState = {
      tab: this.selectedTab1 as any,
      formIndex: this.currentFieldIndex,
      routeIndex: this.voiceRouteIndex,
      cargoIndex: this.voiceCargoIndex,
      productIndex: this.voiceProductIndex,
      cargoMode: this.isCargoVoiceMode,
      productMode: this.isProductVoiceMode
    };
  }

  private restoreVoiceState(): void {
    const state = this.voiceResumeState;
    this.selectTab1(state.tab);
    this.currentFieldIndex = state.formIndex;
    this.voiceRouteIndex = state.routeIndex;
    this.voiceCargoIndex = state.cargoIndex;
    this.voiceProductIndex = state.productIndex;
    this.isCargoVoiceMode = state.cargoMode;
    this.isProductVoiceMode = state.productMode;

    if (this.selectedTab1 === 'Route Details') {
      if (this.isProductVoiceMode) {
        this.focusProductField();
      } else if (this.isCargoVoiceMode) {
        this.focusCargoField();
      } else {
        this.focusRouteField();
      }
      return;
    }

    this.focusQuotationField();
  }

  private handleNavigationCommand(command: string): void {
    const parsed = this.voiceParserService.parseNavigationCommand(command);
    if (parsed.type === 'CONTROL') {
      this.handleControlCommand(parsed.action || '');
      return;
    }

    if (parsed.type === 'NAVIGATE') {
      this.handleNavigation(parsed.direction || 'NEXT');
    }
  }

  private handleControlCommand(action: string): void {
    switch (action) {
      case 'SAVE':
        this.handleVoiceSave();
        break;
      case 'TAB_QUOTATION':
        this.selectTab1('Quotation');
        this.currentFieldIndex = 0;
        this.isCargoVoiceMode = false;
        this.isProductVoiceMode = false;
        setTimeout(() => this.focusQuotationField(), 200);
        break;
      case 'TAB_ROUTE':
        this.selectTab1('Route Details');
        this.ensureVoiceRoute();
        this.currentRouteFieldIndex = 0;
        this.currentCargoFieldIndex = 0;
        this.currentProductFieldIndex = 0;
        this.isCargoVoiceMode = false;
        this.isProductVoiceMode = false;
        setTimeout(() => this.focusRouteField(), 200);
        break;
      case 'ADD_ROUTE':
        this.addQuoteRoute();
        this.selectTab1('Route Details');
        this.voiceRouteIndex = this.quoteRoutes.length - 1;
        this.currentRouteFieldIndex = 0;
        this.isCargoVoiceMode = false;
        this.isProductVoiceMode = false;
        setTimeout(() => this.focusRouteField(), 200);
        break;
      case 'ADD_CARGO':
        this.selectTab1('Route Details');
        this.ensureVoiceRoute();
        this.addQuoteCargo(this.voiceRouteIndex);
        this.voiceCargoIndex = this.quoteCargo(this.voiceRouteIndex).length - 1;
        this.isCargoVoiceMode = true;
        this.isProductVoiceMode = false;
        this.currentCargoFieldIndex = 0;
        setTimeout(() => this.focusCargoField(), 200);
        break;
      case 'ADD_PRODUCT':
        this.selectTab1('Route Details');
        this.ensureVoiceRoute();
        this.ensureVoiceCargo();
        this.addQuoteProduct(this.voiceRouteIndex, undefined, this.voiceCargoIndex);
        this.voiceProductIndex = this.quoteProducts(this.voiceRouteIndex, this.voiceCargoIndex).length - 1;
        this.isProductVoiceMode = true;
        this.isCargoVoiceMode = false;
        this.currentProductFieldIndex = 0;
        setTimeout(() => this.focusProductField(), 200);
        break;
      case 'CLEAR':
        this.clearCurrentField();
        break;
      case 'STOP':
        this.stopVoiceGuide();
        this.toastr.info('Voice assistant stopped');
        break;
    }
  }

  private handleNavigation(direction: 'NEXT' | 'PREVIOUS' | 'SKIP'): void {
    this.closeAllVoiceControls();

    if (this.selectedTab1 === 'Route Details') {
      if (this.isProductVoiceMode) {
        if (direction === 'PREVIOUS') {
          this.currentProductFieldIndex = Math.max(0, this.currentProductFieldIndex - 1);
        } else {
          this.currentProductFieldIndex++;
        }
        this.focusProductField();
        return;
      }

      if (this.isCargoVoiceMode) {
        if (direction === 'PREVIOUS') {
          this.currentCargoFieldIndex = Math.max(0, this.currentCargoFieldIndex - 1);
        } else {
          this.currentCargoFieldIndex++;
        }
        this.focusCargoField();
        return;
      }

      if (direction === 'PREVIOUS') {
        this.currentRouteFieldIndex = Math.max(0, this.currentRouteFieldIndex - 1);
      } else {
        this.currentRouteFieldIndex++;
      }
      this.focusRouteField();
      return;
    }

    if (direction === 'PREVIOUS') {
      this.currentFieldIndex = Math.max(0, this.currentFieldIndex - 1);
    } else {
      this.currentFieldIndex++;
    }
    this.focusQuotationField();
  }

  private handleVoiceInput(transcript: string): void {
    if (!transcript?.trim()) return;

    if (this.selectedTab1 === 'Route Details') {
      if (this.isProductVoiceMode) {
        this.handleProductVoiceInput(transcript);
      } else if (this.isCargoVoiceMode) {
        this.handleCargoVoiceInput(transcript);
      } else {
        this.handleRouteVoiceInput(transcript);
      }
      return;
    }

    this.handleQuotationVoiceInput(transcript);
  }

  private handleVoiceSave(): void {
    if (this.disableAllModification || this.isSaving) {
      this.toastr.info('Saving is currently disabled');
      return;
    }

    this.onSubmit();
  }

  private ensureVoiceRoute(): void {
    if (this.quoteRoutes.length === 0) {
      this.addQuoteRoute();
    }
    this.voiceRouteIndex = Math.min(this.voiceRouteIndex, this.quoteRoutes.length - 1);
  }

  private ensureVoiceCargo(): void {
    this.ensureVoiceRoute();
    if (this.quoteCargo(this.voiceRouteIndex).length === 0) {
      this.addQuoteCargo(this.voiceRouteIndex);
    }
    this.voiceCargoIndex = Math.min(this.voiceCargoIndex, this.quoteCargo(this.voiceRouteIndex).length - 1);
  }

  private closeAllVoiceControls(): void {
    const active = document.activeElement as HTMLElement | null;
    active?.blur();
  }

  private clearCurrentField(): void {
    const control = this.getCurrentVoiceControl();
    control?.reset();
    control?.updateValueAndValidity({ emitEvent: false });
    this.toastr.info('Field cleared');
  }

  private getCurrentVoiceControl(): AbstractControl | null {
    if (this.selectedTab1 === 'Route Details') {
      if (this.isProductVoiceMode) {
        return this.quoteProducts(this.voiceRouteIndex, this.voiceCargoIndex).at(this.voiceProductIndex) as FormGroup || null;
      }
      if (this.isCargoVoiceMode) {
        return this.quoteCargo(this.voiceRouteIndex).at(this.voiceCargoIndex) as FormGroup || null;
      }
      return this.quoteRoutes.at(this.voiceRouteIndex) as FormGroup || null;
    }

    return this.quotationForm;
  }

  private focusQuotationField(): void {
    while (this.currentFieldIndex < this.voiceFieldOrder.length) {
      this.currentFieldName = this.voiceFieldOrder[this.currentFieldIndex];

      if (!this.isQuotationVoiceFieldActive(this.currentFieldName)) {
        this.currentFieldIndex++;
        continue;
      }

      this.announceVoiceField(this.currentFieldName, 'Quotation');

      const el = this.getQuotationFieldElement(this.currentFieldName);
      if (el) {
        this.focusElement(el);
        this.openQuotationField(this.currentFieldName);
        return;
      }

      this.currentFieldIndex++;
    }

    this.toastr.info('Quotation fields completed. Say "route details" to continue.');
  }

  private focusRouteField(): void {
    this.ensureVoiceRoute();
    while (this.currentRouteFieldIndex < this.routeVoiceFieldOrder.length) {
      this.currentFieldName = this.routeVoiceFieldOrder[this.currentRouteFieldIndex];

      if (!this.isRouteVoiceFieldActive(this.voiceRouteIndex, this.currentFieldName)) {
        this.currentRouteFieldIndex++;
        continue;
      }

      this.announceVoiceField(this.currentFieldName, `Route ${this.voiceRouteIndex + 1}`);

      const el = this.getRouteFieldElement(this.voiceRouteIndex, this.currentFieldName);
      if (el) {
        this.focusElement(el);
        this.openRouteField(this.voiceRouteIndex, this.currentFieldName);
        return;
      }

      this.currentRouteFieldIndex++;
    }

    this.toastr.success('Route completed. You can say "add cargo" or "add product".');
  }

  private focusProductField(): void {
    this.ensureVoiceCargo();
    while (this.currentProductFieldIndex < this.productVoiceFieldOrder.length) {
      const fieldName = this.productVoiceFieldOrder[this.currentProductFieldIndex];

      if (!fieldName || !this.isProductVoiceFieldActive(this.voiceRouteIndex, this.voiceCargoIndex, this.voiceProductIndex, fieldName)) {
        this.currentProductFieldIndex++;
        continue;
      }

      this.currentFieldName = fieldName;
      this.announceVoiceField(fieldName, `Product ${this.voiceProductIndex + 1}`);

      const el = this.getProductFieldElement(this.voiceRouteIndex, this.voiceCargoIndex, this.voiceProductIndex, fieldName);
      if (el) {
        this.focusElement(el);
        this.openProductField(this.voiceRouteIndex, this.voiceCargoIndex, this.voiceProductIndex, fieldName);
        return;
      }

      this.currentProductFieldIndex++;
    }

    this.isProductVoiceMode = false;
    this.toastr.success('Product completed');
  }

  private announceVoiceField(fieldName: string, scope: string): void {
    const labels: Record<string, string> = {
      LeadOrCustomer: 'Customer or Lead',
      CustomerBranchSid: 'Customer',
      PreCustomerMasterSid: 'Lead',
      CustomerAddress: 'Customer address',
      Email: 'Email',
      ContactPerson: 'Contact person',
      ContactNumber: 'Contact number',
      CustomerRef: 'Customer reference',
      SalesmanSid: 'Salesman',
      AgreedRate: 'Rate agreed',
      IsContract: 'Contract',
      DepartmentMasterSid: 'Department',
      PORSid: 'POO',
      POLSid: 'POL',
      PODSid: 'POD',
      FPODSid: 'FPOD',
      effDate: 'Effective date',
      expDate: 'Expiry date',
      ServiceLevel: 'Inco terms',
      FreightPPCC: 'Freight PPCC',
      CargoType: 'Cargo type',
      CargoDescription: 'Cargo description',
      ContainerType: 'Container type',
      Qty: 'Quantity',
      ProductName: 'Product name',
      PackageType: 'Package type',
      GrossWeight: 'Gross weight',
      NetWeight: 'Net weight',
      Volume: 'CBM',
      ChargeableWeight: 'Chargeable weight',
      ShipmentTerms: 'Shipment terms',
      ExternalPkg: 'External package',
      ExternalQty: 'Package quantity',
      Length: 'Length',
      Width: 'Width',
      Height: 'Height',
      ProductUnit: 'Product unit',
      IsHaz: 'Hazardous flag',
      ImcoClass: 'IMCO class',
      UnNo: 'UN number',
      PkgGroup: 'Package group',
      Remarks: 'Remarks'
    };

    const label = labels[fieldName] || fieldName;
    this.toastr.info(`Speak ${label} for ${scope}. Say "next" to continue or "stop" to pause.`, 'Voice assistant', {
      positionClass: 'toast-top-center',
      timeOut: 3500
    });
  }

  private handleQuotationVoiceInput(transcript: string): void {
    const text = transcript.toLowerCase().trim();
    const fieldName = this.voiceFieldOrder[this.currentFieldIndex];

    if (!fieldName) return;

    if (fieldName === 'LeadOrCustomer') {
      const isCustomer = text.includes('customer');
      const isLead = text.includes('lead');
        if (isCustomer || isLead) {
        this.quotationForm.get('LeadOrCustomer')?.setValue(isCustomer);
        this.cdr.detectChanges();
        setTimeout(() => {
          this.currentFieldIndex = this.voiceFieldOrder.indexOf(isCustomer ? 'CustomerBranchSid' : 'PreCustomerMasterSid');
          this.focusQuotationField();
        }, 200);
      }
      return;
    }

    if (fieldName === 'AgreedRate' || fieldName === 'IsContract') {
      const checked = ['yes', 'true', 'on', '1', 'y'].some(v => text.includes(v));
      this.quotationForm.get(fieldName)?.setValue(checked);
      setTimeout(() => this.moveQuotationNext(), 200);
      return;
    }

    if (fieldName === 'CustomerBranchSid') {
      const match = this.matchDropdownItem(text, this.customerlist, ['CustomerName', 'BranchName', 'Address']);
      if (match) {
        this.quotationForm.get('CustomerBranchSid')?.setValue(match.CustomerBranchSid);
        this.onSelectionChange(match);
        setTimeout(() => this.moveQuotationNext(), 200);
      }
      return;
    }

    if (fieldName === 'PreCustomerMasterSid') {
      const match = this.matchDropdownItem(text, this.leadList, ['preCustomerName', 'preCustomerAddress1']);
      if (match) {
        this.quotationForm.get('PreCustomerMasterSid')?.setValue(match.PreCustomerMasterSid);
        this.onSelectionChange(match);
        setTimeout(() => this.moveQuotationNext(), 200);
      }
      return;
    }

    if (fieldName === 'SalesmanSid') {
      const match = this.matchDropdownItem(text, this.salesmanList, ['userName']);
      if (match) {
        this.quotationForm.get('SalesmanSid')?.setValue(match.UserMasterSid);
        setTimeout(() => this.moveQuotationNext(), 200);
      }
      return;
    }

    if (fieldName === 'Email') {
      const email = text.replace(/ at /g, '@').replace(/ dot /g, '.').replace(/\s+/g, '');
      this.quotationForm.get('Email')?.setValue(email);
      setTimeout(() => this.moveQuotationNext(), 200);
      return;
    }

    if (fieldName === 'ContactNumber') {
      const number = text.replace(/\D/g, '');
      this.quotationForm.get('ContactNumber')?.setValue(number);
      setTimeout(() => this.moveQuotationNext(), 200);
      return;
    }

    const control = this.quotationForm.get(fieldName);
    if (control) {
      control.setValue(transcript);
      setTimeout(() => this.moveQuotationNext(), 200);
    }
  }

  private handleRouteVoiceInput(transcript: string): void {
    this.ensureVoiceRoute();
    const routeForm = this.quoteRoutes.at(this.voiceRouteIndex) as FormGroup;
    if (!routeForm) return;

    const fieldName = this.routeVoiceFieldOrder[this.currentRouteFieldIndex];
    if (!fieldName) return;

    const spoken = transcript.toLowerCase().trim();

    if (fieldName === 'DepartmentMasterSid') {
      const match = this.matchDropdownItem(spoken, this.departments, ['departmentName']);
      if (match) {
        routeForm.get('DepartmentMasterSid')?.setValue(match.DepartmentMasterSid);
        this.onDeptChange(match, this.voiceRouteIndex);
        setTimeout(() => this.moveRouteNext(), 250);
      }
      return;
    }

    if (['PORSid', 'POLSid', 'PODSid', 'FPODSid'].includes(fieldName)) {
      const list = fieldName === 'POLSid'
        ? (this.filteredPOLPorts[this.voiceRouteIndex] || [])
        : fieldName === 'PODSid'
          ? (this.filteredPODPorts[this.voiceRouteIndex] || [])
          : this.ports;
      const match = this.matchDropdownItem(spoken, list, ['PortCode', 'PortName']);
      if (match) {
        routeForm.get(fieldName)?.setValue(match.PortMasterSid);
        if (fieldName === 'POLSid') this.onRouteChange(this.voiceRouteIndex);
        if (fieldName === 'PODSid') this.onPODChange(match, this.voiceRouteIndex);
        setTimeout(() => this.moveRouteNext(), 200);
      }
      return;
    }

    if (fieldName === 'effDate' || fieldName === 'expDate') {
      const parsed = Date.parse(transcript);
      if (!Number.isNaN(parsed)) {
        routeForm.get(fieldName)?.setValue(new Date(parsed));
        setTimeout(() => this.moveRouteNext(), 200);
      } else {
        this.toastr.warning('Could not understand the date');
      }
      return;
    }

    if (fieldName === 'ServiceLevel') {
      const match = this.matchDropdownItem(spoken, this.incoList, ['IncoCode', 'IncoName']);
      if (match) {
        routeForm.get('ServiceLevel')?.setValue(match.IncoName || match.IncoCode);
        this.handleFreightPPCCForDetail(match, this.voiceRouteIndex);
        setTimeout(() => this.moveRouteNext(), 200);
      }
      return;
    }

    if (fieldName === 'FreightPPCC') {
      const value = spoken.includes('collect') ? 'Collect' : 'Prepaid';
      routeForm.get('FreightPPCC')?.setValue(value);
      setTimeout(() => this.moveRouteNext(), 200);
      return;
    }

    if (fieldName === 'CargoType') {
      const match = this.matchDropdownItem(spoken, this.modeOfCargoType, ['name']);
      if (match) {
        routeForm.get('CargoType')?.setValue(match.name);
        this.handleSegmentChangeOnAllProducts(this.voiceRouteIndex);
        setTimeout(() => this.moveRouteNext(), 200);
      }
      return;
    }

    if (fieldName === 'ContainerType') {
      const match = this.matchDropdownItem(spoken, this.containerTypeList, ['ContainerName', 'ContainerCode', 'ContainerTypeName']);
      if (match) {
        routeForm.get('ContainerType')?.setValue(match.ContainerCode || match.ContainerName || match.ContainerTypeName);
        setTimeout(() => this.moveRouteNext(), 200);
      }
      return;
    }

    const control = routeForm.get(fieldName);
    if (control) {
      control.setValue(transcript);
      setTimeout(() => this.moveRouteNext(), 200);
    }
  }

  private focusCargoField(): void {
    this.ensureVoiceCargo();
    while (this.currentCargoFieldIndex < this.cargoVoiceFieldOrder.length) {
      const fieldName = this.cargoVoiceFieldOrder[this.currentCargoFieldIndex];

      if (!fieldName || !this.isCargoVoiceFieldActive(this.voiceRouteIndex, this.voiceCargoIndex, fieldName)) {
        this.currentCargoFieldIndex++;
        continue;
      }

      this.currentFieldName = fieldName;
      this.announceVoiceField(fieldName, `Cargo ${this.voiceCargoIndex + 1}`);

      const el = this.getCargoFieldElement(this.voiceRouteIndex, this.voiceCargoIndex, fieldName);
      if (el) {
        this.focusElement(el);
        this.openCargoField(this.voiceRouteIndex, this.voiceCargoIndex, fieldName);
        return;
      }

      this.currentCargoFieldIndex++;
    }

    this.isCargoVoiceMode = false;
    this.toastr.success('Cargo completed');
  }

  private handleCargoVoiceInput(transcript: string): void {
    this.ensureVoiceCargo();
    const cargoForm = this.quoteCargo(this.voiceRouteIndex).at(this.voiceCargoIndex) as FormGroup;
    if (!cargoForm) return;

    const fieldName = this.cargoVoiceFieldOrder[this.currentCargoFieldIndex];
    if (!fieldName) return;

    const spoken = transcript.toLowerCase().trim();

    if (fieldName === 'CargoType') {
      const match = this.matchDropdownItem(spoken, this.modeOfCargoType, ['name']);
      if (match) {
        cargoForm.get('CargoType')?.setValue(match.name);
        setTimeout(() => this.moveCargoNext(), 200);
      }
      return;
    }

    if (fieldName === 'ContainerType') {
      const match = this.matchDropdownItem(spoken, this.containerTypeList, ['ContainerName', 'ContainerCode', 'ContainerTypeName']);
      if (match) {
        cargoForm.get('ContainerType')?.setValue(match.ContainerCode || match.ContainerName || match.ContainerTypeName);
        setTimeout(() => this.moveCargoNext(), 200);
      }
      return;
    }

    if (fieldName === 'ProductName') {
      const match = this.matchDropdownItem(spoken, this.productList, ['ProductCode', 'ProductName']);
      if (match) {
        cargoForm.get('ProductName')?.setValue(match.ProductName);
        setTimeout(() => this.moveCargoNext(), 200);
      }
      return;
    }

    if (fieldName === 'PackageType') {
      const match = this.matchDropdownItem(spoken, this.packageTypes, ['UOMCode', 'UOMName']);
      if (match) {
        cargoForm.get('PackageType')?.setValue(match.UOMCode || match.UOMName);
        setTimeout(() => this.moveCargoNext(), 200);
      }
      return;
    }

    if (fieldName === 'ShipmentTerms') {
      const match = this.matchDropdownItem(spoken, this.serviceLevel, ['name']);
      if (match) {
        cargoForm.get('ShipmentTerms')?.setValue(match.name);
        setTimeout(() => this.moveCargoNext(), 200);
      }
      return;
    }

    if (['Qty', 'GrossWeight', 'NetWeight', 'Volume', 'ChargeableWeight'].includes(fieldName)) {
      const numeric = spoken.replace(/[^\d.]/g, '');
      cargoForm.get(fieldName)?.setValue(numeric);
      setTimeout(() => this.moveCargoNext(), 200);
      return;
    }

    const control = cargoForm.get(fieldName);
    if (control) {
      control.setValue(transcript);
      setTimeout(() => this.moveCargoNext(), 200);
    }
  }

  private moveCargoNext(): void {
    this.currentCargoFieldIndex++;
    if (this.currentCargoFieldIndex >= this.cargoVoiceFieldOrder.length) {
      this.isCargoVoiceMode = false;
      this.toastr.success('Cargo completed. Say "add product" or "next".');
      return;
    }
    this.focusCargoField();
  }

  private handleProductVoiceInput(transcript: string): void {
    this.ensureVoiceCargo();
    const productForm = this.quoteProducts(this.voiceRouteIndex, this.voiceCargoIndex).at(this.voiceProductIndex) as FormGroup;
    if (!productForm) return;

    const fieldName = this.productVoiceFieldOrder[this.currentProductFieldIndex];
    if (!fieldName) {
      this.isProductVoiceMode = false;
      return;
    }

    const spoken = transcript.toLowerCase().trim();

    if (fieldName === 'ProductName') {
      const match = this.matchDropdownItem(spoken, this.productList, ['ProductCode', 'ProductName']);
      if (match) {
        productForm.get('ProductName')?.setValue(match.ProductName);
        this.onProductChange(match, this.voiceRouteIndex, this.voiceProductIndex, this.voiceCargoIndex);
        setTimeout(() => this.moveProductNext(), 200);
      }
      return;
    }

    if (fieldName === 'ExternalPkg') {
      const match = this.matchDropdownItem(spoken, this.packageTypes, ['UOMCode', 'UOMName']);
      if (match) {
        productForm.get('ExternalPkg')?.setValue(match.UOMMasterSid);
        setTimeout(() => this.moveProductNext(), 200);
      }
      return;
    }

    if (fieldName === 'ProductUnit') {
      const match = this.matchDropdownItem(spoken, this.measurementUnitList, ['name']);
      if (match) {
        productForm.get('ProductUnit')?.setValue(match.id);
        setTimeout(() => this.moveProductNext(), 200);
      }
      return;
    }

    if (fieldName === 'IsHaz') {
      const checked = ['yes', 'true', 'on', '1', 'haz', 'hazardous'].some(v => spoken.includes(v));
      productForm.get('IsHaz')?.setValue(checked);
      this.toggleHazProduct(this.voiceRouteIndex, this.voiceProductIndex, this.voiceCargoIndex);
      setTimeout(() => this.moveProductNext(), 200);
      return;
    }

    if (fieldName === 'ImcoClass') {
      const match = this.matchDropdownItem(spoken, this.imcoList, ['ImcoName']);
      if (match) {
        productForm.get('ImcoClass')?.setValue(match.ImcoMasterSid);
        this.onImcoChange(this.voiceRouteIndex, this.voiceProductIndex, match, this.voiceCargoIndex);
        setTimeout(() => this.moveProductNext(), 200);
      }
      return;
    }

    if (['ExternalQty', 'GrossWeight', 'NetWeight', 'Volume', 'Length', 'Width', 'Height'].includes(fieldName)) {
      const numeric = spoken.replace(/[^\d.]/g, '');
      productForm.get(fieldName)?.setValue(numeric);
      setTimeout(() => this.moveProductNext(), 200);
      return;
    }

    const control = productForm.get(fieldName);
    if (control) {
      control.setValue(transcript);
      setTimeout(() => this.moveProductNext(), 200);
    }
  }

  private moveQuotationNext(): void {
    this.currentFieldIndex++;
    this.focusQuotationField();
  }

  private moveRouteNext(): void {
    this.currentRouteFieldIndex++;
    this.focusRouteField();
  }

  private moveProductNext(): void {
    this.currentProductFieldIndex++;
    if (this.currentProductFieldIndex >= this.productVoiceFieldOrder.length) {
      this.isProductVoiceMode = false;
      this.toastr.success('Product completed');
      return;
    }
    this.focusProductField();
  }

  private getQuotationFieldElement(fieldName: string): HTMLElement | null {
    return document.querySelector(`[formControlName="${fieldName}"]`) as HTMLElement | null;
  }

  private getRouteFieldElement(routeIndex: number, fieldName: string): HTMLElement | null {
    return document.querySelector(`[data-route-index="${routeIndex}"] [formControlName="${fieldName}"]`) as HTMLElement | null;
  }

  private getCargoFieldElement(routeIndex: number, cargoIndex: number, fieldName: string): HTMLElement | null {
    const selectors = [
      `[data-route-index="${routeIndex}"] [data-cargo-index="${cargoIndex}"] [formControlName="${fieldName}"]`,
      `[data-route-index="${routeIndex}"] [formControlName="${fieldName}"]`
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) return el;
    }

    return null;
  }

  private getProductFieldElement(routeIndex: number, cargoIndex: number, productIndex: number, fieldName: string): HTMLElement | null {
    const selectors = [
      `[data-route-index="${routeIndex}"] [data-cargo-index="${cargoIndex}"] [data-product-index="${productIndex}"] [formControlName="${fieldName}"]`,
      `[data-route-index="${routeIndex}"] [data-cargo-index="${cargoIndex}"] [formControlName="${fieldName}"]`
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) return el;
    }
    return null;
  }

  private openQuotationField(fieldName: string): void {
    if (fieldName === 'CustomerBranchSid' || fieldName === 'PreCustomerMasterSid' || fieldName === 'SalesmanSid') {
      this.openDropdownForElement(this.getQuotationFieldElement(fieldName));
    }
  }

  private openRouteField(routeIndex: number, fieldName: string): void {
    if (['DepartmentMasterSid', 'PORSid', 'POLSid', 'PODSid', 'FPODSid', 'ServiceLevel', 'FreightPPCC', 'CargoType', 'ContainerType'].includes(fieldName)) {
      this.openDropdownForElement(this.getRouteFieldElement(routeIndex, fieldName));
    }

    if (fieldName === 'effDate' || fieldName === 'expDate') {
      const input = this.getRouteFieldElement(routeIndex, fieldName) as HTMLInputElement | null;
      if (input) {
        setTimeout(() => {
          input.focus();
          input.click();
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        }, 120);
      }
    }
  }

  private openCargoField(routeIndex: number, cargoIndex: number, fieldName: string): void {
    if (['CargoType', 'ContainerType', 'ProductName', 'PackageType', 'ShipmentTerms'].includes(fieldName)) {
      this.openDropdownForElement(this.getCargoFieldElement(routeIndex, cargoIndex, fieldName));
    }
  }

  private openProductField(routeIndex: number, cargoIndex: number, productIndex: number, fieldName: string): void {
    if (['ProductName', 'ExternalPkg', 'ProductUnit', 'ImcoClass'].includes(fieldName)) {
      this.openDropdownForElement(this.getProductFieldElement(routeIndex, cargoIndex, productIndex, fieldName));
    }
  }

  private openDropdownForElement(element: HTMLElement | null): void {
    if (!element) return;
    setTimeout(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      element.click();
      const input = element.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
      input?.focus();
    }, 120);
  }

  private focusElement(element: HTMLElement | null): void {
    if (!element) return;
    setTimeout(() => {
      const input = element.matches('input, textarea, select') ? element as HTMLInputElement : element.querySelector('input, textarea, select') as HTMLInputElement | null;
      input?.focus();
    }, 120);
  }

  private matchDropdownItem(text: string, items: any[], fields: string[]): any | null {
    return this.voiceParserService.matchDropdownValue(text, items || [], fields);
  }

  private isQuotationVoiceFieldActive(fieldName: string): boolean {
    return this.isFieldActive(fieldName, this.quotationForm);
  }

  private isRouteVoiceFieldActive(routeIndex: number, fieldName: string): boolean {
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup | null;
    return this.isFieldActive(fieldName, routeForm || undefined);
  }

  private isCargoVoiceFieldActive(routeIndex: number, cargoIndex: number, fieldName: string): boolean {
    const cargoForm = this.quoteCargo(routeIndex).at(cargoIndex) as FormGroup | null;
    return this.isFieldActive(fieldName, cargoForm || undefined);
  }

  private isProductVoiceFieldActive(routeIndex: number, cargoIndex: number, productIndex: number, fieldName: string): boolean {
    const productForm = this.quoteProducts(routeIndex, cargoIndex).at(productIndex) as FormGroup | null;
    return this.isFieldActive(fieldName, productForm || undefined);
  }

  private isFieldActive(fieldName: string, formGroup?: FormGroup | null): boolean {
    if (!formGroup) return false;

    const control = formGroup.get(fieldName);
    if (!control) return false;

    if (control.disabled) return false;

    if (fieldName === 'CustomerBranchSid' && this.quotationForm.get('LeadOrCustomer')?.value === false) {
      return false;
    }

    if (fieldName === 'PreCustomerMasterSid' && this.quotationForm.get('LeadOrCustomer')?.value === true) {
      return false;
    }

    return true;
  }

  // applyTariff(tariffData:any){
    
  //   const isEmpty = this.checkIfLastChargeEmpty(this.currentRouteIndex,this.currentCarrierIndex);
  //   let chargeIndex;
  //   if(isEmpty){
  //     chargeIndex = this.quoteCharges(this.currentRouteIndex,this.currentCarrierIndex).length - 1;
  //     const chargeForm = this.quoteCharges(this.currentRouteIndex,this.currentCarrierIndex).at(chargeIndex) as FormGroup;
  //     chargeForm.patchValue({
  //       ...tariffData
  //     })
  //     chargeForm.updateValueAndValidity();
  //   } else {
  //     this.addQuoteCharge(this.currentRouteIndex,this.currentCarrierIndex,tariffData);
  //     chargeIndex = this.quoteCharges(this.currentRouteIndex,this.currentCarrierIndex).length - 1;
  //   }
  //   const customerId = this.quotationForm.get('CustomerMasterSid')?.value;
  //   const customer = this.customers.find(c => c.CustomerMasterSid === customerId);
  //   if (customer) {
  //     this.handleCustomerChangeOnCharges(customer);
  //   }
  //   this.closeTariffModal();
  // }

  applySelectedTariffs(): void {
    const routeIndex = this.currentRouteIndex;
    const carrierIndex = this.currentCarrierIndex;

    const selectedTariffs = this.tariffDetails.filter(tariff => tariff.selected);

    if (selectedTariffs.length === 0) {
      this.appSettingService.showWarning('Please select at least one tariff to apply.');
      return;
    }

    // 🔹 Precompute container-wise Qty map
    const containerQtyMap = new Map<number, number>();
    const cargoControls = this.quoteCargo(routeIndex).controls as FormGroup[];

    cargoControls.forEach(ctrl => {
      const cargo = ctrl.getRawValue();
      const containerType = cargo?.ContainerType;
      const qty = Number(cargo?.Qty) || 0;

      if (containerType) {
        containerQtyMap.set(
          containerType,
          (containerQtyMap.get(containerType) || 0) + qty
        );
      }
    });

    selectedTariffs.forEach(tariffData => {

      let finalQty = Number(tariffData.Qty) || 1;

      // 🔹 Override Qty using container grouping logic
      if (tariffData?.TariffContainerType && containerQtyMap.has(tariffData.TariffContainerType)) {
        const groupedQty = containerQtyMap.get(tariffData.TariffContainerType);
        if (groupedQty && groupedQty > 0) {
          finalQty = groupedQty;
        }
      }

      // 🔹 Recalculate amounts
      const revenueRate = Number(tariffData.RevenueRate || 0);
      const costRate = Number(tariffData.CostRate || 0);
      const revenueExRate = Number(tariffData.RevenueExchangeRate || 0);
      const costExRate = Number(tariffData.CostExchangeRate || 0);

      const revenueAmount = finalQty * revenueRate;
      const costAmount = finalQty * costRate;

      const updatedTariff = {
        ...tariffData,
        Qty: finalQty,
        RevenueAmount: revenueAmount.toFixed(this.digitsAfterDecimal),
        CostAmount: costAmount.toFixed(this.digitsAfterDecimal),
        RevenueLocalAmount: (revenueAmount * revenueExRate).toFixed(this.digitsAfterDecimal),
        CostLocalAmount: (costAmount * costExRate).toFixed(this.digitsAfterDecimal),
      };

      const isEmpty = this.checkIfLastChargeEmpty(routeIndex, carrierIndex);
      let chargeIndex: number;

      if (isEmpty) {
        chargeIndex = this.quoteCharges(routeIndex, carrierIndex).length - 1;
        const chargeForm = this.quoteCharges(routeIndex, carrierIndex).at(chargeIndex) as FormGroup;

        chargeForm.patchValue(updatedTariff, { emitEvent: false });
        chargeForm.updateValueAndValidity({ emitEvent: false });

      } else {
        this.addQuoteCharge(routeIndex, carrierIndex, updatedTariff);
        chargeIndex = this.quoteCharges(routeIndex, carrierIndex).length - 1;
      }

      // ❗ IMPORTANT: Prevent Qty override issue
      // If your updateSingleChargeQty recalculates Qty incorrectly, avoid calling it
      // OR modify that function to respect existing Qty

      // this.updateSingleChargeQty(routeIndex, carrierIndex, chargeIndex);

      // 🔹 Still fetch exchange rates (safe)
      this.fetchExchangeRate(routeIndex, carrierIndex, chargeIndex, 'revenue');
      this.fetchExchangeRate(routeIndex, carrierIndex, chargeIndex, 'cost');
    });

    this.disableTariffFieldsForCurrentRoute();

    const customerId = this.quotationForm.get('CustomerMasterSid')?.value;
    const customer = this.customers.find(c => c.CustomerMasterSid === customerId);

    if (customer) {
      this.handleCustomerChangeOnCharges(customer);
    }

    this.closeTariffModal();
  }

  disableTariffFieldsForCurrentRoute(): void {
  if (this.currentRouteIndex === undefined || this.currentRouteIndex === null) {
    return;
  }

  const routeForm = this.quoteRoutes.at(this.currentRouteIndex) as FormGroup;
  
  // Disable the required fields for tariff
  const fieldsToDisable = ['DepartmentMasterSid', 'POLSid', 'PODSid', 'effDate', 'expDate'];
  
  fieldsToDisable.forEach(field => {
    const control = routeForm.get(field);
    if (control && control.enabled) {
      control.disable({ emitEvent: false });
    }
  });
  
  // Also disable PORSid if it exists
  const porsControl = routeForm.get('PORSid');
  if (porsControl && porsControl.enabled) {
    porsControl.disable({ emitEvent: false });
  }
  
  // Also disable FPODSid if it exists
  const fpodControl = routeForm.get('FPODSid');
  if (fpodControl && fpodControl.enabled) {
    fpodControl.disable({ emitEvent: false });
  }
}

  areAllTariffsSelected(): boolean {
    if (!this.tariffDetails || this.tariffDetails.length === 0) {
      return false;
    }
    return this.tariffDetails.every(td => td.selected);
  }

  toggleSelectAllTariffs(event: any): void {
    const checked = event.target.checked;
    if (this.tariffDetails) {
      this.tariffDetails.forEach(td => td.selected = checked);
    }
  }

  getUOMCode(UOMMasterSid:number){
    if(!UOMMasterSid){
      return '';
    }
    return (this.chargeUnitMaster.find(uom => uom.UOMMasterSid === UOMMasterSid))?.UOMCode;
  }

  checkIfLastChargeEmpty(routeIndex,carrierIndex) {
    const chargeLen = this.quoteCharges(routeIndex,carrierIndex).length - 1;
    const chargeForm = this.quoteCharges(routeIndex,carrierIndex).at(chargeLen) as FormGroup;
    const rawValue = chargeForm.getRawValue();
    const isEmpty = rawValue.ChargeUomSid === null;
    return isEmpty;
  }


  toNgbDateStruct(
    value: string | Date | NgbDateStruct | null
  ): NgbDateStruct | null {

    if (!value) return null;

    // Already NgbDateStruct
    if (
      typeof value === 'object' &&
      'year' in value &&
      'month' in value &&
      'day' in value
    ) {
      return value;
    }

    // ISO string like 2026-01-23T00:00:00.000Z
    if (typeof value === 'string') {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return null;

      return {
        year: +match[1],
        month: +match[2],
        day: +match[3],
      };
    }

    // Date object
    if (value instanceof Date && !isNaN(value.getTime())) {
      return {
        year: value.getUTCFullYear(),
        month: value.getUTCMonth() + 1,
        day: value.getUTCDate(),
      };
    }

    return null;
  }


  navigateToBooking(){
    this.router.navigate(['operation/booking/entry'])
  }

  showInfo() {
    if (!this.quotationData) return;
    const modalRef = this.ngbModal.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.quotationData;
    modalRef.componentInstance.idLabel = 'Quotation Id';
    modalRef.componentInstance.idValue = this.quotationData?.QuoteHeaderSid;
  }

  openFollowup() {
    if (!this.quotationData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.quotationData?.QuoteHeaderSid;
    modalRef.componentInstance.parentSubject = `__SUBJECT__ for Quotation No."${this.quotationData.QuoteNumber}"`;
    modalRef.componentInstance.parentMailbodyTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <p>Dear Sir/Madam,</p>
      <p>Kindly do the needful for "__SUBJECT__" Quotation No."${this.quotationData.QuoteNumber}" Dated:${new Date(this.quotationData.QuoteDate).toLocaleDateString()}</p>
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

  private getPortCodeBySid(portSid: number | null | undefined): string | null {
    if (portSid === null || portSid === undefined) return null;
    const port = this.ports.find(p => p.PortMasterSid === portSid);
    return port?.PortCode ?? null;
  }

  openTandC(routeIndex: number = 0) {
  this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
  // Use the specific route based on routeIndex
  const route = this.quotationData?.quoteRoute?.[routeIndex] || null;
  const departmentSid = route?.DepartmentMasterSid ?? null;
  const pol = this.getPortCodeBySid(route?.POLSid);
  const pod = this.getPortCodeBySid(route?.PODSid);
  const carrier = route?.quoteCarrier?.[0]?.CarrierMasterSid ?? null;
  const transactionPayload = {
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    MenuMasterSid: this.currentMenuId,
    DocumentSid: this.quotationData?.quoteRoute?.[routeIndex]?.QuoteRouteSid
  };
  const payload = {
    MenuMasterSid: this.currentMenuId,
    DepartmentMasterSid: departmentSid,
    POL: pol,
    POD: pod,
    Carrier: carrier,
    DocumentSid: this.quotationData?.quoteRoute?.[routeIndex]?.QuoteRouteSid
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
      (a?.DocumentSid ?? this.quotationData?.quoteRoute?.[routeIndex]?.QuoteRouteSid ?? null) ===
      (b?.DocumentSid ?? this.quotationData?.quoteRoute?.[routeIndex]?.QuoteRouteSid ?? null)
    );
  const openModal = (terms: any[]) => {
    const modalRef = this.ngbModal.open(TermsAndConditionsComponent, {
        size: 'lg',
        backdrop: 'static',
        centered: true,
      });
      modalRef.componentInstance.terms = terms || [];
      modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
      modalRef.componentInstance.DocumentSid = this.quotationData?.quoteRoute?.[routeIndex]?.QuoteRouteSid;
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

  // loadTandC(payload: {
  //   MenuMasterSid: number;
  //   DepartmentMasterSid?: number | null;
  //   POL?: string | null;
  //   POD?: string | null;
  //   Carrier?: number | null;
  //   DocumentSid?: number | null;
  // }): Observable<any[]> {
  //   return this.leadService.getTandCByCondition(payload).pipe(
  //     map((resp: any) => {
  //       if (resp && resp.status) {
  //         return resp.data;
  //       }
  //       this.appSettingService.showError('Failed to load Terms and Conditions: Invalid response');
  //       return [];
  //     }),
  //     catchError((error) => {
  //       this.appSettingService.showError('Error loading Terms and Conditions');
  //       return of([]);
  //     })
  //   );
  // }

  async openEmail() {
    if (!this.quotationData) return;
    if(!this.quotationApproved){
      this.appSettingService.showWarning("Please approve the quotation before sending email");
      return;
    }

    try {
      this.spinner.show();

      await new Promise(resolve => setTimeout(resolve, 100));
      // Generate PDF blob automatically
          const pdfBlob = await this.generatePDFBlob();
    const pdfFileName = (this.quotationData?.QuotationNumber || 'quotation') + '.pdf';
    const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
    await new Promise(resolve => setTimeout(resolve, 100));

    const modalRef = this.ngbModal.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });

    const toEmailSet = new Set<string>();
    toEmailSet.add(this.selectedItem.Email);

    const toEmail = Array.from(toEmailSet);
    const ccEmail = [this.userData['userEmail']];

    const POL = this.selectedItem?.quoteRoute[0]?.POLSid;
    const POD =  this.selectedItem?.quoteRoute[0]?.PODSid;
    const FPD =  this.selectedItem?.quoteRoute[0]?.FPODSid;
    const formattedPOL = this.getFormattedPort(POL);
    const formattedPOD = this.getFormattedPort(POD);
    const formattedFPD = this.getFormattedPort(FPD);

    const subject = `Quotation No.${this.quotationData?.QuoteNumber} Date: ${this.datePipe.transform(this.quotationData?.QuoteDate)} ${formattedPOL} - ${formattedPOD}${POD !== FPD ? ' - ' + formattedFPD : ''} confirmation`;

    const mailBody = `Dear Sir/Madam,
Please find enclosed the quotation as requested.
Kindly review the details at your convenience.
Looking forward to your feedback and the opportunity to work together.
${this.getApprovalLinkText(this.QuoteHeaderSid)}
Best Regards,
${this.userData.userName}`;
    const departmentName = this.getQuotationDepartmentName();
    const mailHtml = this.emailTriggerService.buildCommonTemplate(
      mailBody,
      subject,
      { menuName: 'Quotation', DepartmentName: departmentName, departmentName }
    );
    
    this.spinner.hide();

    modalRef.componentInstance.setContent = {
      EmailTo: toEmail,
      EmailCC: ccEmail,
      EmailBCC: [],
      Subject: subject,
      Mailbody: mailHtml,
      attachments: [pdfFile]
    };

    } catch (error) {
      this.spinner.hide();
      console.error('PDF generation error:', error);
      this.appSettingService.showError('Error generating PDF for email attachment.');
    }



  }

  openAuthority() {
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
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
    const modalRef = this.ngbModal.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.screenName = 'Edoc';
 modalRef.componentInstance.formData = this.tariffData; 
  modalRef.componentInstance.resetTrigger = false;

    const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.QuoteHeaderSid
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
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.QuoteHeaderSid;
  }

  logFormValue() {
  }

  async sendManualMail(): Promise<void> {
    const pdfBlob = await this.generatePDFBlob();
    let attachmentFile: File | undefined;
    if (pdfBlob) {
      attachmentFile = new File([pdfBlob], (this.quotationData?.QuoteNumber || 'Quotation') + '.pdf', { type: 'application/pdf' });
    }

    const departmentName = this.getQuotationDepartmentName();
    this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid: this.MenuMasterSid,
      action: 'UPDATE',
      attachmentFile,
      context: {
        quotationNumber: this.quotationData?.QuoteNumber,
        date: this.datePipe.transform(this.quotationData?.QuoteDate),
        DepartmentName: departmentName,
        POO: this.getFormattedPort(this.quotationData?.quoteRoute?.[0]?.PORSid),
        POL: this.getFormattedPort(this.quotationData?.quoteRoute?.[0]?.POLSid),
        POD: this.getFormattedPort(this.quotationData?.quoteRoute?.[0]?.PODSid),
        FPD: this.getFormattedPort(this.quotationData?.quoteRoute?.[0]?.FPODSid),
        customerName: this.quotationData?.CustomerName,
        userName: this.userData?.userName,
        toEmail: this.quotationData?.Email || '',
        customerBranchSid: this.quotationData?.CustomerBranchSid || null,
        approvalLink: this.getApprovalUrl(),
        menuMasterSid: this.MenuMasterSid,
        resourceSid: this.QuoteHeaderSid
      }
    });
    const payload = {
        tableName: 'QuoteHeader',
        recordId: String(this.quotationData?.QuoteHeaderSid),
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

  private getQuotationDepartmentName(): string {
    const deptIds: number[] = [];

    const headerDeptId = this.quotationData?.DepartmentMasterSid;
    if (headerDeptId !== null && headerDeptId !== undefined) {
      deptIds.push(Number(headerDeptId));
    }

    const routes = Array.isArray(this.quotationData?.quoteRoute) ? this.quotationData.quoteRoute : [];
    for (const route of routes) {
      if (route?.DepartmentMasterSid !== null && route?.DepartmentMasterSid !== undefined) {
        deptIds.push(Number(route.DepartmentMasterSid));
      }
    }

    if (this.quoteRoutes?.length) {
      this.quoteRoutes.controls.forEach((routeCtrl: AbstractControl) => {
        const routeDeptId = routeCtrl.get('DepartmentMasterSid')?.value;
        if (routeDeptId !== null && routeDeptId !== undefined) {
          deptIds.push(Number(routeDeptId));
        }
      });
    }

    const uniqueIds = Array.from(new Set(deptIds));
    const names = uniqueIds
      .map(id => this.departments.find(dept => Number(dept.DepartmentMasterSid) === id)?.departmentName)
      .filter(Boolean) as string[];

    return names.join(', ') || '';
  }

  back() {
    this.router.navigate(['crm/quotation/list']);
  }
  resetForm() {
  // If editing an existing quotation, reload it from the server to restore original values
  if (this.isEditMode && this.QuoteHeaderSid) {
    this.loadQuotation(this.QuoteHeaderSid);
    return;
  }

  // Reset header-level fields only
  this.quotationForm.reset({
    CustomerMasterSid: null,
    CustomerRef: '',
    Email: '',
    status: 'Active',
    SalesmanSid: null,
    CustomerName: '',
    CustomerAddress: '',
    QuoteNumber: '',
    QuoteDate: null,
    EnquirySid: '',
    ContactPerson: '',
    ContactNumberCode: this.getDefaultContactDialCode(),
    ContactNumber: ''
  });

  // Clear any cached or derived UI state related to routes/charges
  this.quoteRoutes.clear();
  this.filteredUnits = [];
  this.filteredPORPorts = [];
  this.filteredPOLPorts = [];
  this.filteredPODPorts = [];
  this.filteredFPODPorts = [];
  this.tariffDetails = [];
  this.enquiryNumber = '';

  // Re-create a single empty route (same as component init)
  this.addQuoteRoute();

  // Ensure the same controls are disabled as on init
  this.quotationForm.get('EnquirySid')?.disable();
  this.f['status']?.disable();

  // If you had flags that disable edits after approval, reset them
  this.disableAllModification = false;
  this.authStateCache = 'Pending';

  // run change detection if needed (optional)
  try { (this as any).cdRef?.detectChanges(); } catch (e) { /* ignore if cdRef not available */ }
}

  openAuditLogs() {
    if (!this.quotationData?.QuoteHeaderSid) return;
    const modalRef = this.modelService.open(AuditLogComponent, {
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'Quotation Logs';
    modalRef.componentInstance.tableName = 'QuoteHeader';
    modalRef.componentInstance.recordId = this.quotationData?.QuoteHeaderSid.toString();
    modalRef.componentInstance.screenName = 'Quotation';
  }


  // patchRevenueExchangeRate(routeIndex,carrierIndex, chargeIndex) {
  //   const chargeForm = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
  //   const revCurrencyMasterSid = chargeForm.get('RevenueCurrencyMasterSid');
  //   const revenueExchangeRate = chargeForm.get('RevenueExchangeRate');
  //   const userCompany = (this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany.CompanyMasterSid);
  //   const fromCurrency = revCurrencyMasterSid.value;
  //   const toCurrency = userCompany.companyMaster.CurrencyMasterSid;
  //   const fromCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === fromCurrency)?.currencyCode;
  //   const toCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode;
  //   const payload = {
  //     fromCurrencyCode: fromCurrencyCode,
  //     toCurrencyCode: toCurrencyCode
  //   }
  //   if (fromCurrencyCode && toCurrencyCode) {
  //     this.leadService.getExchangeRate(payload).subscribe(
  //       (resp: any) => {
  //         if (resp.status) {
  //           const exchangeRate = resp.data;
  //           revenueExchangeRate.setValue(exchangeRate);
  //         } else {
  //           revenueExchangeRate?.setValue('');
  //         }
  //       }
  //     )
  //   } else {
  //     revenueExchangeRate?.setValue('');
  //   }
  //   revenueExchangeRate?.updateValueAndValidity();
  // }

  // patchCostExchangeRate(routeIndex,carrierIndex, chargeIndex) {
  //   const chargeForm = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
  //   const costCurrencyMasterSid = chargeForm.get('CostCurrencyMasterSid');
  //   const costExchangeRate = chargeForm.get('CostExchangeRate');
  //   const userCompany = (this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany.CompanyMasterSid);
  //   const fromCurrency = costCurrencyMasterSid.value;
  //   const toCurrency = userCompany.companyMaster.CurrencyMasterSid;
  //   console.log(fromCurrency, toCurrency);
  //   const fromCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === fromCurrency)?.currencyCode;
  //   const toCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode;
  //   const payload = {
  //     fromCurrencyCode: fromCurrencyCode,
  //     toCurrencyCode: toCurrencyCode
  //   }
  //   console.log(payload);
  //   if (fromCurrencyCode && toCurrencyCode) {
  //     this.leadService.getExchangeRate(payload).subscribe(
  //       (resp: any) => {
  //         if (resp.status) {
  //           const exchangeRate = resp.data;
  //           costExchangeRate.setValue(exchangeRate);
  //         } else {
  //           costExchangeRate?.setValue('');
  //         }
  //       }
  //     )
  //   } else {
  //     costExchangeRate?.setValue('');
  //   }
  //   costExchangeRate?.updateValueAndValidity();
  // }

  handleCalculation(routeIndex:number, cargoIndex: number = -1){
    const targetCtrl = cargoIndex < 0
      ? (this.quoteRoutes.at(routeIndex) as FormGroup)
      : (this.quoteCargo(routeIndex).at(cargoIndex) as FormGroup);
    const productFormArr = this.quoteProducts(routeIndex, cargoIndex);
    let totalPackageQty = 0;
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalVolume = 0;
    let totalChargeableWeight = 0;
    if (productFormArr.length === 0) {
      targetCtrl.get('PackageQty')?.enable();
      targetCtrl.get('PackageQty')?.setValue('');
      targetCtrl.get('GrossWeight')?.enable();
      targetCtrl.get('NetWeight')?.enable()
      targetCtrl.get('Volume')?.enable();
      targetCtrl.get('ChargeableWeight')?.enable();
      return;
    }
    productFormArr.controls.forEach((productForm:FormGroup)=>{
      totalPackageQty += Number(productForm.get('ExternalQty')?.value) || 0;
      totalGrossWeight += Number(productForm.get('GrossWeight')?.value) || 0;
      totalNetWeight += Number(productForm.get('NetWeight')?.value) || 0;
      totalVolume += Number(productForm.get('Volume')?.value) || 0;

      const length = Number(productForm.get('Length')?.value) || 0;
      const width = Number(productForm.get('Width')?.value) || 0;
      const height = Number(productForm.get('Height')?.value) || 0;
      const qty = Number(productForm.get('ExternalQty')?.value) || 0;
      const mappedChargeable = Number(productForm.get('ChargeableWeight')?.value) || 0;
      const volumetricChargeable = length > 0 && width > 0 && height > 0 && qty > 0
        ? ((length * width * height) / 6000) * qty
        : 0;

      totalChargeableWeight += Math.max(volumetricChargeable, mappedChargeable);
    });
    targetCtrl.get('PackageQty')?.setValue(totalPackageQty > 0 ? Number(totalPackageQty.toFixed(this.digitsAfterDecimal)) : '', { emitEvent: false });
    targetCtrl.get('GrossWeight')?.setValue(totalGrossWeight);
    targetCtrl.get('NetWeight')?.setValue(totalNetWeight);
    targetCtrl.get('Volume')?.setValue(totalVolume);
    targetCtrl.get('ChargeableWeight')?.setValue(totalChargeableWeight);
    targetCtrl.get('PackageQty')?.updateValueAndValidity();
    targetCtrl.get('GrossWeight')?.updateValueAndValidity();

    targetCtrl.get('PackageQty')?.disable({ emitEvent: false });
    targetCtrl.get('GrossWeight')?.disable();
    targetCtrl.get('NetWeight')?.disable()
    targetCtrl.get('Volume')?.disable();
    targetCtrl.get('ChargeableWeight')?.disable();

    this.updateAllChargeQuantitiesForRoute(routeIndex);
  }

  getRouteInfo(routeIndex : number){
    const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
    const POL = routeForm.get('POLSid')?.value;
    const POD = routeForm.get('PODSid')?.value;
    const FPOD = routeForm.get('FPODSid')?.value;
    const portArray : String[] = [];
    const POLName = this.ports.find(p => p.PortMasterSid === POL)?.PortCode;
    const PODName = this.ports.find(p => p.PortMasterSid === POD)?.PortCode;
    const FPODName = this.ports.find(p => p.PortMasterSid === FPOD)?.PortCode;
    if(POLName && PODName){
      portArray.push(POLName);
      portArray.push(PODName);
      const isEqual = PODName === FPODName;
      if(!isEqual && FPODName){
        portArray.push(FPODName);
      }
      return portArray.join(' - ');
    } else {
      return 'Route Details'
    }
  }


  handleCustomerChangeOnCharges(customer:any){
    this.quoteRoutes.controls.forEach((route:FormGroup,routeIndex:number)=>{
      const carrierArr = this.quoteCarriers(routeIndex);
      
      carrierArr.controls.forEach((carrier:FormGroup,carrierIndex:number)=>{
        const chargeArr = this.quoteCharges(routeIndex,carrierIndex);
        chargeArr.controls.forEach((charge:FormGroup,chargeIndex:number)=>{
          const revCusControl = charge.get('RevenueCustomerMasterSid');
          const revCusBranchControl = charge.get('RevenueCustomerBranchSid');
          if (customer) {
            if (!revCusBranchControl.value) {
              revCusControl.setValue(customer.CustomerMasterSid);
              revCusBranchControl.setValue(customer.CustomerBranchSid);
            }
          } else {
            revCusControl.setValue(null);
            revCusBranchControl.setValue(null);
          }
        });
      })
    })
  }

  findFieldForQty(UnitQty:string){
    const trimmedUnitQty = String(UnitQty).trim();
    switch(trimmedUnitQty){
      case 'Per 20ft Cont':
      case 'Per 40ft Cont':
      case 'Per 45ft Cont':
      case 'Per Cont':
      case '20ft':
      case '40ft':
        return 'NoofContainers';
      case 'Per CBM':
      case 'GrossWeight':
      case 'CBM':
        return trimmedUnitQty === 'GrossWeight' ? 'GrossWeight' : 'Volume';
      case 'Per GrossWeight':
        return 'GrossWeight';
      case 'ChargeableWeight':
        return 'ChargeableWeight';
      case 'Per BL':
      case 'BL':
        return 1;
      case 'Per Shipment':
      case 'Shipment':
        return 1;
      default:
        return 1;
    }
  }

  statusMapBasedOnAuthLevel = new Map<string, string>([
    ['1', 'WaitingForFinalApproval'],
    ['2', 'WaitingForCustomerApproval'],
    ['C', 'Approved'],
  ]);

  statusMap = new Map<string, string>([
    ['Pending', 'Waiting for Approval'],
    ['Approved', 'Approved'],
    ['Rejected', 'Rejected']
  ]);

  // onInternalApprovalStatusChange(status: any) {
  //   this.approvalDropdownValue = status;
  //   this.quoteRoutes.controls.forEach((route: FormGroup, routeIndex: number) => {
  //     const carrierArr = this.quoteCarriers(routeIndex);
  //     carrierArr.controls.forEach((carrier: FormGroup) => {
  //       carrier.get('authorizerStatus')?.setValue(status);
  //     })
  //   })
  // }
  onInternalApprovalStatusChange(status: any) {
  this.approvalDropdownValue = status;
  this.appSettingService.showInfo(`Status ${status} selected. Please apply to individual carriers.`);
}

  // onCustomerApprovalStatusChange(routeIndex:number,carrierIndex:number,status: any) {
  //   console.log(status);
  //   this.quoteRoutes.controls.forEach((route: FormGroup, rIndex: number) => {
  //     const carrierArr = this.quoteCarriers(rIndex);
  //     carrierArr.controls.forEach((carrier: FormGroup,cIndex:number) => {
  //       if (status.value === "Approved") {
  //         if (routeIndex === rIndex && carrierIndex === cIndex) {
  //           carrier.get('authorizerStatus')?.setValue(status.value);
  //         } else {
  //           carrier.get('authorizerStatus')?.setValue("Rejected");
  //         }
  //       } else if (status?.value === "Counter") {
  //         if (routeIndex === rIndex && carrierIndex === cIndex) {
  //           carrier.get('authorizerStatus')?.setValue(status.value);
  //         } else {
  //           carrier.get('authorizerStatus')?.setValue("Pending");
  //         }
  //       } else {
  //         carrier.get('authorizerStatus')?.setValue(status.value);
  //       }
  //     });
  //   })
  // }
onCustomerApprovalStatusChange(routeIndex: number, carrierIndex: number, status: any) {
  const carriersFA = this.quoteCarriers(routeIndex);
  const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
  
  // Get the current carrier form
  const currentCarrier = carriersFA.at(carrierIndex) as FormGroup;
  
  // ADD THIS CHECK - If already approved, prevent changes
  if (this.isCarrierApproved(routeIndex, carrierIndex)) {
    this.appSettingService.showWarning("Approved carriers cannot be modified");
    return;
  }

  // Only when Approved is selected
  if (status?.value === 'Approved') {
    
    // First, disable all carriers' status controls temporarily
    carriersFA.controls.forEach((carrierCtrl, index) => {
      const carrierForm = carrierCtrl as FormGroup;
      const statusCtrl = carrierForm.get('authorizerStatus');
      if (statusCtrl) {
        statusCtrl.disable({ emitEvent: false });
      }
    });

    carriersFA.controls.forEach((carrierCtrl, index) => {
      const carrierForm = carrierCtrl as FormGroup;
      const statusCtrl = carrierForm.get('authorizerStatus');

      if (!statusCtrl) return;

      if (index === carrierIndex) {
        // Selected carrier - set to Approved
        statusCtrl.setValue('Approved', { emitEvent: false });
        // DISABLE the status dropdown for approved carrier
        statusCtrl.disable({ emitEvent: false });
        this.updateCarrierValidationBasedOnStatus(carrierForm);
        this.syncCarrierSelectionState(routeIndex, index);
      } else {
        // Force change other carriers to "Pending"
        statusCtrl.setValue('Pending', { emitEvent: false });
        statusCtrl.enable({ emitEvent: false });
        
        // Clear ApprovedBy for other carriers
        const approvedByCtrl = carrierForm.get('ApprovedBy');
        if (approvedByCtrl) {
          approvedByCtrl.setValue('', { emitEvent: false });
          approvedByCtrl.disable({ emitEvent: false });
        }
        
        this.enableCarrierFields(routeIndex, index);
        this.updateCarrierValidationBasedOnStatus(carrierForm);
        this.syncCarrierSelectionState(routeIndex, index);
      }
    });

    routeForm.get('isRouteApproved')?.setValue(true);
    this.applyBookingLockForRoute(routeIndex);
    return;
  }

  // For other statuses (Rejected, Counter, etc.) - only if not already approved
  const statusCtrl = currentCarrier.get('authorizerStatus');
  if (statusCtrl && !this.isCarrierApproved(routeIndex, carrierIndex)) {
    statusCtrl.enable({ emitEvent: false });
    statusCtrl.setValue(status?.value, { emitEvent: false });
  }

  routeForm.get('isRouteApproved')?.setValue(false);
  this.enableCarrierFields(routeIndex, carrierIndex);
  this.updateCarrierValidationBasedOnStatus(currentCarrier);
  this.syncCarrierSelectionState(routeIndex, carrierIndex);
  this.applyBookingLockForRoute(routeIndex);
}


private hasBookingForRoute(routeIndex: number, routeData?: any): boolean {
  const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
  const formBookingSid = routeForm?.get('BookingHeaderSid')?.value;
  const formBookingNo = routeForm?.get('BookingNo')?.value;
  const dataBookingSid = routeData?.BookingHeaderSid || routeData?.bookingHeader?.BookingHeaderSid;
  const dataBookingNo = routeData?.BookingNo || routeData?.bookingHeader?.BookingNo;
  return !!formBookingSid || !!formBookingNo || !!dataBookingSid || !!dataBookingNo;
}

private setCarrierSelectionDisabled(routeIndex: number, carrierIndex: number, disabled: boolean): void {
  const carrierForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
  const carrierControl = carrierForm?.get('CarrierMasterSid');
  if (!carrierControl) return;

  if (disabled) {
    carrierControl.disable({ emitEvent: false });
  } else {
    carrierControl.enable({ emitEvent: false });
  }
}

private syncCarrierSelectionState(routeIndex: number, carrierIndex: number, routeData?: any): void {
  const carrierForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
  if (!carrierForm) return;

  this.setCarrierSelectionDisabled(
    routeIndex,
    carrierIndex,
    this.isCarrierSelectionLocked(routeIndex, carrierIndex, routeData)
  );
}

isCarrierApproved(routeIndex: number, carrierIndex: number, routeData?: any): boolean {
  const sourceRoute = routeData || this.quotationData?.quoteRoute?.[routeIndex];
  const dataCarrier = sourceRoute?.quoteCarrier?.[carrierIndex];
  if (dataCarrier?.ApprovalStatus === 'Approved') {
    return true;
  }
  return false;
}

private routeHasApprovedCarrier(routeIndex: number, routeData?: any): boolean {
  const sourceRoute = routeData || this.quotationData?.quoteRoute?.[routeIndex];
  if (sourceRoute?.quoteCarrier?.length) {
    return sourceRoute.quoteCarrier.some(carrier => carrier?.ApprovalStatus === "Approved");
  }
  return false;
}

isBookingLockedForRoute(routeIndex: number): boolean {
  return this.hasBookingForRoute(routeIndex, this.quotationData?.quoteRoute?.[routeIndex]);
}

isCarrierSelectionLocked(routeIndex: number, carrierIndex: number, routeData?: any): boolean {
  const sourceRoute = routeData || this.quotationData?.quoteRoute?.[routeIndex];
  const carrierForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
  const currentStatus = carrierForm?.get('authorizerStatus')?.value;

  return this.hasBookingForRoute(routeIndex, sourceRoute) ||
    currentStatus === 'Approved' ||
    this.isCarrierApproved(routeIndex, carrierIndex, sourceRoute);
}

isCarrierApprovalLocked(routeIndex: number, carrierIndex: number): boolean {
  return this.isCarrierApproved(routeIndex, carrierIndex, this.quotationData?.quoteRoute?.[routeIndex]) ||
    this.isBookingLockedForRoute(routeIndex);
}

private applyBookingLockForRoute(routeIndex: number, routeData?: any): void {
  const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
  const bookingLocked = this.hasBookingForRoute(routeIndex, routeData);

  if (bookingLocked) {
    routeForm?.disable({ emitEvent: false });
    return;
  }

  if (routeForm?.disabled) {
    routeForm.enable({ emitEvent: false });
  }

  const carrierArr = this.quoteCarriers(routeIndex);

  carrierArr.controls.forEach((_, carrierIndex: number) => {
    this.syncCarrierSelectionState(routeIndex, carrierIndex, routeData);
  });

  const routeFullyUnlocked = carrierArr.controls.every((_, carrierIndex: number) =>
    !this.isCarrierApproved(routeIndex, carrierIndex, routeData) &&
    !this.hasBookingForRoute(routeIndex, routeData)
  );

  if (routeFullyUnlocked) {
    carrierArr.controls.forEach((carrierCtrl: AbstractControl) => {
      this.updateCarrierValidationBasedOnStatus(carrierCtrl as FormGroup);
    });

    if (this.isRateLocked()) {
      this.lockAllRateFields();
    }
  }
}

private setCarrierControlsDisabled(routeIndex: number, carrierIndex: number, disabled: boolean): void {
  const carrierForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;

  Object.keys(carrierForm.controls).forEach(key => {
    if (key === 'quoteCharges') return;
    const control = carrierForm.get(key);
    if (!control) return;
    if (disabled) {
      control.disable({ emitEvent: false });
      return;
    }
    control.enable({ emitEvent: false });
  });

  const chargeArr = this.quoteCharges(routeIndex, carrierIndex);
  chargeArr.controls.forEach((charge: FormGroup) => {
    Object.keys(charge.controls).forEach(field => {
      const control = charge.get(field);
      if (!control) return;
      if (disabled) {
        control.disable({ emitEvent: false });
        return;
      }
      control.enable({ emitEvent: false });
    });
  });
}

// Helper method to disable fields of an approved carrier
disableApprovedCarrierFields(routeIndex: number, carrierIndex: number): void {
  this.setCarrierControlsDisabled(routeIndex, carrierIndex, true);
}

// Helper method to enable fields of a carrier
enableCarrierFields(routeIndex: number, carrierIndex: number): void {
  const carrierForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
  
  // Enable the authorizer status field
  carrierForm.get('authorizerStatus')?.enable({ emitEvent: false });
  
  // Enable charge fields if they were disabled
  const chargeArr = this.quoteCharges(routeIndex, carrierIndex);
  chargeArr.controls.forEach((charge: FormGroup) => {
    const chargeFields = [
      'ChargeUomSid', 'RevenueRate', 'RevenueCurrencyMasterSid', 
      'RevenueExchangeRate', 'CostRate', 'CostCurrencyMasterSid', 
      'CostExchangeRate', 'Qty'
    ];
    
    chargeFields.forEach(field => {
      const control = charge.get(field);
      if (control && control.disabled && !this.isRateLocked()) {
        control.enable({ emitEvent: false });
      }
    });
  });
}

  getStatusName(statusValue) {
    const statusObject = this.approvalStatus.find(status => status.value === statusValue);
    return statusObject ? statusObject.name : null;
  }

  getAuthorityStatusForCarrier(routeIndex:number,carrierIndex:number){
    const carrier = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
    const currentStatus = carrier.get('authorizerStatus')?.value
    const currentStatusName = this.getStatusName(currentStatus);
    return  currentStatusName || '';
  }

  isRequiredInQuoteCarrier(routeIndex:number,carrierIndex:number,ctrl:string){
    const carrier = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;
    const control = carrier.get(ctrl);
    return control ? control.hasValidator(Validators.required) : false;
  }

  navigateToCustomers(){
    this.router.navigate(['master/organization/entry', this.createdCustomerId]);
    this.ngbModal.dismissAll();
  }

  onClosingCustomerModal(){
    this.createdCustomerId = null;
    this.loadQuotation(this.QuoteHeaderSid);
    this.ngbModal.dismissAll();
  }

  getFormattedPort(PortMasterSid) {
    if (!PortMasterSid || PortMasterSid === undefined || this.ports.length === 0) {
      return '';
    }
    const ourPort = this.ports.find(p => p.PortMasterSid === PortMasterSid);
    return ourPort ? `${ourPort.PortName} (${ourPort.PortCode})` : '';
  }

  getUOMCodeById(id:number){
    if(!id){
      return '';
    } else {
      const uom = this.chargeUnitMaster.find(c => c.UOMMasterSid === id);
      return uom ? uom.UOMCode : '';
    }
  }

  reportAndEmailModel(content: TemplateRef<any>) {
    this.prepareTermsForPrint();
    this.ngbModal.open(content, {
      size: 'xl',
      scrollable: true,
    });
  }


  async sendEmail() {
    try {
      // Step 1: Validate email FIRST (before expensive PDF generation)
      const toEmailSet = new Set<string>();

      if (this.selectedItem?.Email) {
        toEmailSet.add(this.selectedItem.Email);
      }

      if (toEmailSet.size === 0 && this.selectedItem?.CustomerBranchSid) {
        const customerEmail = this.customerlist.find(
          cus => cus.CustomerBranchSid === this.selectedItem?.CustomerBranchSid
        )?.Email;
        if (customerEmail) {
          toEmailSet.add(customerEmail);
        }
      }

      if (toEmailSet.size === 0) {
        this.appSettingService.showError('To Email is missing.');
        return; // Exit early - no email to send to
      }

      // Step 2: Now show loader and generate PDF (only after validation passes)
      this.isLoading = true;
      this.spinner.show();

      // Use cached PDF or generate new for better performance
      const pdfBlob = await this.getOrGeneratePdfBlob();
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF');
      }

      // Step 3: Build FormData
      const formData = new FormData();

      const toEmail = Array.from(toEmailSet);
      toEmail.forEach(email => {
        if (email) {
          formData.append("EmailTo[]", email);
        }
      });

      const ccEmailSet = new Set<string>([this.userData['userEmail']]);
      const ccEmail = Array.from(ccEmailSet);

      ccEmail.forEach(email => {
        if (email) {
          formData.append("EmailCC[]", email);
        }
      });

      formData.append('Subject', `Quotation No.${this.selectedItem.QuoteNumber} Date:${new Date(this.selectedItem.QuoteDate)} ${this.getFormattedPort(this.selectedItem.quoteRoute[0].POLSid)} - ${this.getFormattedPort(this.selectedItem.quoteRoute[0].PODSid)}`);
      const mailBody = `Dear Sir/Madam,
Please find enclosed the quotation as requested.
Kindly review the details at your convenience.
Looking forward to your feedback and the opportunity to work together.
Approval Hyperlink: <a href="${this.getApprovalUrl(this.QuoteHeaderSid)}" target="_blank" rel="noopener noreferrer" style="color:#0b6aa1;font-weight:600;">Click here to approve</a>
Best Regards,
${this.userData['userEmail']}`;
      const mailHtml = this.emailTriggerService.buildCommonTemplate(
        mailBody,
        `Quotation No.${this.selectedItem.QuoteNumber} Date:${new Date(this.selectedItem.QuoteDate)} ${this.getFormattedPort(this.selectedItem.quoteRoute[0].POLSid)} - ${this.getFormattedPort(this.selectedItem.quoteRoute[0].PODSid)}`,
        { menuName: 'Quotation' }
      );
      formData.append('Mailbody', mailHtml);
      if (this.QuoteHeaderSid) {
        formData.append('QuoteHeaderSid', String(this.QuoteHeaderSid));
      }
      formData.append('CreatedBy', this.userData?.['userEmail'] || '');
      formData.append('file', pdfBlob, (this.selectedItem?.QuotationName || 'quotation') + '.pdf');

      // Step 4: Use firstValueFrom for cleaner async handling
      const response = await firstValueFrom(this.leadService.quotationReport(formData));

      if (response?.data) {
        this.toastr.success('Report Email Sent successfully!');
      }

    } catch (err) {
      console.error('Email send error:', err);
      this.toastr.error('Failed to send email. Please try again.');
    } finally {
      this.isLoading = false;
      this.spinner.hide();
    }
  }




  async downloadPDF() {
    this.showPrintLogo = false;
    this.showPdfLogo = true;
    this.spinner.show();

    try {
      const { pdfMake } = await this.getPdfDependencies();
      const docDefinition = await this.buildQuotationDocDefinition();
      if (!docDefinition) {
        this.appSettingService.showError('No quotation data available for PDF.');
        return;
      }

      const quotationNumber = this.quotationForm.get('QuoteNumber')?.value || 'Quotation';
      pdfMake.createPdf(docDefinition).download(`Quotation_${quotationNumber}.pdf`);
      if (this.QuoteHeaderSid) {
        this.leadService.markQuoteWaitingForApproval(this.QuoteHeaderSid, {
          updatedBy: this.userData?.['userEmail'] || ''
        }).subscribe();
      }
      this.appSettingService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'QuoteHeader',
        recordId: String(this.quotationData?.QuoteHeaderSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          Pdf: 'PDF Downloaded'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('Quotation PDF download error:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }

  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const { pdfMake } = await this.getPdfDependencies();
      const docDefinition = await this.buildQuotationDocDefinition();
      if (!docDefinition) {
        return null;
      }

      return await new Promise<Blob>((resolve, reject) => {
        try {
          pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => resolve(blob));
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      return null;
    }
  }

  private async getPdfDependencies(): Promise<{ pdfMake: any }> {
    if (this.pdfDepsPromise) {
      return this.pdfDepsPromise;
    }

    this.pdfDepsPromise = (async () => {
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

      const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;
      const pdfFonts: any = (pdfFontsModule as any).default || pdfFontsModule;
      pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts;

      return { pdfMake };
    })();

    return this.pdfDepsPromise;
  }

  private async buildQuotationDocDefinition(): Promise<any | null> {
    if (!this.selectedItem) {
      return null;
    }

    const terms = await this.prepareTermsForPrint();
    const logo = await this.resolveReportLogo();
    const apiData = {
      ...this.selectedItem,
      terms
    };

    const pdfData = transformQuotationApiData(
      apiData,
      this.currentCompany,
      this.currentBranch,
      this.userData,
      logo,
      {
        currencyMaster: this.currencyMaster,
        chargeUnitMaster: this.chargeUnitMaster,
        departments: this.departments,
        ports: this.ports,
        containerTypeList: this.containerTypeList
      }
    );

    const documentType = this.selectedItem?.IsContract === 'Y' ? 'contract' : 'quotation';
    return generateQuotationDocument(pdfData, documentType as any);
  }

  private getTermDisplayText(term: any): string {
    return (term?.TandC || term?.Terms || term?.content || '').trim();
  }

  private isSameTerm(a: any, b: any): boolean {
    const aText = this.getTermDisplayText(a).toLowerCase();
    const bText = this.getTermDisplayText(b).toLowerCase();

    return (
      (a?.TandCTransactionSid &&
        b?.TandCTransactionSid &&
        a.TandCTransactionSid === b.TandCTransactionSid) ||
      (aText !== '' &&
        aText === bText &&
        (a?.DocumentSid ?? this.getTermsDocumentSid()) ===
          (b?.DocumentSid ?? this.getTermsDocumentSid()))
    );
  }

  private getUniqueTerms(terms: any[]): any[] {
    return (terms || []).filter((item: any, index: number, arr: any[]) => {
      const text = this.getTermDisplayText(item);
      if (!text) return false;

      return index === arr.findIndex((existing: any) => this.isSameTerm(existing, item));
    });
  }

  private getTermsDocumentSid(route?: any): number | null {
    return route?.QuoteRouteSid ?? this.quotationData?.quoteRoute?.[0]?.QuoteRouteSid ?? this.QuoteHeaderSid ?? null;
  }

  private buildTermsConditionPayload(route: any) {
    return {
      MenuMasterSid: this.currentMenuId,
      DepartmentMasterSid: route?.DepartmentMasterSid ?? null,
      POL: this.getPortCodeBySid(route?.POLSid),
      POD: this.getPortCodeBySid(route?.PODSid),
      Carrier: route?.quoteCarrier?.[0]?.CarrierMasterSid ?? null,
      DocumentSid: this.getTermsDocumentSid(route)
    };
  }

  private async prepareTermsForPrint(): Promise<any[]> {
    if (!this.quotationData || !this.currentCompany?.CompanyMasterSid || !this.currentMenuId) {
      this.printTermsList = this.getUniqueTerms(
        this.selectedItem?.terms?.length ? this.selectedItem.terms : this.TandCList
      );
      return this.printTermsList;
    }

    const transactionPayload = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      MenuMasterSid: this.currentMenuId,
      DocumentSid: this.getTermsDocumentSid()
    };

    try {
      const savedTermsResponse = await firstValueFrom(this.masterService.getTandC(transactionPayload));
      const savedTerms = savedTermsResponse?.status ? (savedTermsResponse.data || []) : [];

      if (!this.isTermsAndConditionsEnabled) {
        this.printTermsList = this.getUniqueTerms(savedTerms);
        this.TandCList = this.printTermsList;
        return this.printTermsList;
      }

      const routes = Array.isArray(this.quotationData?.quoteRoute) ? this.quotationData.quoteRoute : [];
      const defaultRequests = routes.map((route: any) =>
        firstValueFrom(this.masterService.getTandCByCondition(this.buildTermsConditionPayload(route)))
          .then((resp: any) => (resp?.status ? (resp.data || []) : []))
          .catch(() => [])
      );

      const defaultTermsByRoute = await Promise.all(defaultRequests);
      const combinedTerms = this.getUniqueTerms([
        ...savedTerms,
        ...defaultTermsByRoute.flat()
      ]);

      this.printTermsList = combinedTerms;
      this.TandCList = combinedTerms;
      return combinedTerms;
    } catch (error) {
      console.error('Error preparing terms for print:', error);
      this.printTermsList = this.getUniqueTerms(
        this.selectedItem?.terms?.length ? this.selectedItem.terms : this.TandCList
      );
      return this.printTermsList;
    }
  }

  private async resolveReportLogo(): Promise<string | undefined> {
    const logoFromStream = await firstValueFrom(this.logoService.reportLogo$);
    const logoSource = logoFromStream || localStorage.getItem('current_report_logo') || '';

    if (!logoSource) return undefined;
    if (logoSource.startsWith('data:image')) return logoSource;

    return this.imageUrlToBase64(logoSource);
  }

  private imageUrlToBase64(url: string): Promise<string | undefined> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(undefined);
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => resolve(undefined);
      img.src = url;
    });
  }
  /**
   * Get cached PDF blob or generate a new one
   * Improves performance when using both download and email features
   */
  private async getOrGeneratePdfBlob(): Promise<Blob | null> {
    const currentQuoteNumber = this.quotationForm.get('QuoteNumber')?.value;

    // Return cached if same quote
    if (this.cachedPdfBlob && this.cachedQuoteNumber === currentQuoteNumber) {
      return this.cachedPdfBlob;
    }

    // Generate new PDF blob
    const blob = await this.generatePDFBlob();
    if (blob) {
      this.cachedPdfBlob = blob;
      this.cachedQuoteNumber = currentQuoteNumber;
    }
    return blob;
  }

  /**
   * Clear PDF cache when quotation data changes
   */
  clearPdfCache(): void {
    this.cachedPdfBlob = null;
    this.cachedQuoteNumber = null;
  }

  getChargeUOMCodeById(UOMMasterSid) {
    if(!UOMMasterSid || this.chargeUnitMaster.length === 0){
      return '';
    } else {
      return (this.chargeUnitMaster.find(uom => uom.UOMMasterSid === UOMMasterSid))?.UOMCode || 'N/A';
    }
  }

  getCurrencyCodeById(CurrencyMasterSid) {
    if(!CurrencyMasterSid || this.currencyMaster.length === 0){
      return '';
    } else {
      return (this.currencyMaster.find(curr => curr.CurrencyMasterSid === CurrencyMasterSid))?.currencyCode || 'N/A';
    }
  }

  getRoutePrintCargoDetails(route: any): Array<{ cargoType: string; containerType: string; quantity: number | string }> {
    const cargoGroups = this.getRouteCargoGroups(route);
    return cargoGroups
      .map((cargo: any) => ({
        cargoType: cargo?.CargoType || '',
        containerType: this.getContainerTypeDisplay(cargo?.ContainerType),
        quantity: cargo?.Qty ?? cargo?.NoofContainers ?? ''
      }))
      .filter((cargo: any) => cargo.cargoType || cargo.containerType || cargo.quantity !== '');
  }

  getContainerTypeDisplay(containerType: any): string {
    if (containerType === null || containerType === undefined || containerType === '') {
      return '';
    }

    const matchedType = this.containerTypeList.find((type: any) =>
      type.ContainerTypeMasterSid === containerType ||
      String(type.ContainerTypeMasterSid) === String(containerType) ||
      type.ContainerCode === containerType ||
      type.ContainerName === containerType
    );

    if (!matchedType) {
      return String(containerType);
    }

    return matchedType.ContainerName || matchedType.ContainerTypeName || matchedType.ContainerCode || String(containerType);
  }
getContainerTypeName(containerCode: string): string {
  if (!containerCode) return 'Container';
  
  const container = this.containerTypeList.find(
    type => type.ContainerCode === containerCode || type.ContainerName === containerCode
  );
  
  return container?.ContainerName || containerCode;
}
  shouldShowContainerQuantity(route: any): boolean {
    const departmentName = (this.getDepartmentName(route?.DepartmentMasterSid) || '').toLowerCase();
    return departmentName.includes('fcl');
  }

  shouldShowRouteCargoTable(route: any): boolean {
    return this.shouldShowContainerQuantity(route) && this.getRoutePrintCargoDetails(route).length > 0;
  }

  getRoutePrintCargoTypeSummary(route: any): string {
    const cargoTypes = this.getRoutePrintCargoDetails(route)
      .map((cargo: any) => cargo?.cargoType)
      .filter((cargoType: string) => !!cargoType);

    return cargoTypes.length ? Array.from(new Set(cargoTypes)).join(', ') : '-';
  }

  //  goForBookingCreation() {
  //   console.log(this.selectedItem, 'this.selectedItem');

  //   // TODO : need to fix this after completion of Authorization
  //   // const approvedRoute = (QuoteData.quoteRoute || []).find(route =>
  //   //   route.quoteCarrier.some(carrier => carrier.ApprovalStatus === "A")
  //   // ) || {};
  //   const approvedRoute = selectedItem.quoteRoute[0] || [];
  //   const POO = this.ports.find(port => port.PortMasterSid === approvedRoute.PORSid);
  //   const POL = this.ports.find(port => port.PortMasterSid === approvedRoute.POLSid);
  //   const POD = this.ports.find(port => port.PortMasterSid === approvedRoute.PODSid);
  //   const FPD = this.ports.find(port => port.PortMasterSid === approvedRoute.FDPSid);


  //   // TODO : need to fix this after completion of Authorization
  //   // const approvedCarrier = (approvedRoute?.quoteCarrier || []).find(
  //   //   carrier => carrier.ApprovalStatus === "A"
  //   // ) || {};
  //   const approvedCarrier = approvedRoute?.quoteCarrier?.[0] || {};

  //   const cargo = approvedRoute?.quoteCargo?.[0] || {};

  //   const data = {
  //     quotation: true,
  //     DepartmentMasterSid: approvedRoute.DepartmentMasterSid || null,
  //     CustomerMasterSid: QuoteData.CustomerMasterSid || null,
  //     CustomerBranchSid: QuoteData.CustomerBranchSid || null,
  //     CustomerName: QuoteData.CustomerName || "",
  //     CustomerAddress: QuoteData.CustomerAddress || "",
  //     SalesmanSid: QuoteData.SalesmanSid || null,
  //     FreightTerms: QuoteData.FreightPPCC || "",
  //     QuotationHeaderSid: QuoteData.QuoteHeaderSid || null,
  //     CarrierName: approvedCarrier?.CarrierName || "",

  //     POO: POO?.PortCode || null,
  //     POL: POL?.PortCode || null,
  //     POD: POD?.PortCode || null,
  //     FPD: FPD?.PortCode || null,

  //     bookingCargo: cargo ? [
  //       {
  //         CargoType: cargo.CargoType,
  //         GrossWeight: cargo.GrossWeight,
  //         NetWeight: cargo.NetWeight,
  //         Volume: cargo.Volume,
  //         ChargeableWeight: cargo.ChargeableWeight,
  //         ContainerType: cargo.ContainerType,
  //         NoofContainers: cargo.Qty,
  //       }
  //     ] : [],

  //     bookingProduct: (cargo?.quoteProduct || []).map(product => ({
  //       ProductName: product.ProductName,
  //       ExternaPkg: product.ExternalPkg,
  //       ExternlQty: product.ExternalQty,
  //       GrossWeight: product.GrossWeight,
  //       NetWeight: product.NetWeight,
  //       Volume: product.Volume,
  //       IsHaz: product.IsHaz,
  //       ImcoClass: product.ImcoClass,
  //       UnNo: product.UnNo,
  //       PkgGroup: product.PkgGroup,
  //       Length: product.Length,
  //       Width: product.Width,
  //       Height: product.Height,
  //       UomMasterSid: product.UomMasterSid,
  //     })),

  //     bookingRates: (approvedCarrier?.quoteCharge || []).map((charge, index) => ({
  //       CompanyMasterSid: charge.CompanyMasterSid,
  //       BranchMasterSid: charge.BranchMasterSid,
  //       SerialNumber: index + 1,
  //       ChargeMasterSid: charge.ChargeUomSid, 
  //       ChargeDescription: charge.ChargeDisplayName,
  //       NoOfUnit: charge.Qty,

  //       CostChargeUomSid: charge.CostChargeUomSid,
  //       CostPrepaidCollect: charge.CostPrepaidCollect,
  //       CostDrCr: charge.CostDrCr,
  //       CostCurrencyMasterSid: charge.CostCurrencyMasterSid,
  //       CostExchangeRate: charge.CostExchangeRate,
  //       CostRate: charge.CostRate,
  //       CostAmount: charge.CostAmount,
  //       CostLocalAmount: charge.CostLocalAmount,

  //       RevenueChargeUomSid: charge.RevenueChargeUomSid,
  //       RevenuePrepaidCollect: charge.RevenuePrepaidCollect,
  //       RevenueDrCr: charge.RevenueDrCr,
  //       RevenueCurrencyMasterSid: charge.RevenueCurrencyMasterSid,
  //       RevenueExchangeRate: charge.RevenueExchangeRate,
  //       RevenueRate: charge.RevenueRate,
  //       RevenueAmount: charge.RevenueAmount,
  //       RevenueLocalAmount: charge.RevenueLocalAmount,
  //     }))
  //   };

  //   this.route.navigate(['operation/booking/entry'], {
  //     state: {
  //       dataFromQuotation: data
  //     }
  //   });
  // }

  filterChargesBySegment(routeIndex: number, segment: string): void {
    const routeDeptId = this.quoteRoutes.at(routeIndex)?.get('DepartmentMasterSid')?.value;

    this.filteredCharges = (this.chargeMaster || []).filter(charge => {
      const departmentNames = charge.DepartmentMasterSid || []; 

      const fullDepartments = departmentNames
        .map(name => this.departments.find(dept => dept.departmentName === name))
        .filter((dept): dept is any => Boolean(dept)); 

      return fullDepartments.some(dept => {
        if (!dept) return false;
        return dept.DepartmentMasterSid === routeDeptId
      });
    });
   
  }



  fetchExchangeRate(routeIndex : number ,carrierIndex : number , chargeIndex : number,revenueOrCost: 'cost' | 'revenue') {
    const chargeGroup = this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup;
    // Take TO currency from userData
    const currentCompanyID = this.currentCompany?.CompanyMasterSid;
    const currentCompany = (this.userData.userCompanyMaster || []).find(ucom => ucom.CompanyMasterSid === currentCompanyID);
    const toCurrency = currentCompany?.companyMaster.CurrencyMasterSid;

    // Take FROM currency from charge
    let fromCurrency;
    let segment;
    let destExRateCtrl;
    if (revenueOrCost === 'cost') {
      fromCurrency = chargeGroup.get('CostCurrencyMasterSid')?.value;
      segment = 'cost'
      destExRateCtrl = chargeGroup.get('CostExchangeRate');
    } else {
      fromCurrency = chargeGroup.get('RevenueCurrencyMasterSid')?.value;
      segment = 'revenue'
      destExRateCtrl = chargeGroup.get('RevenueExchangeRate');
    }

    const fromCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === fromCurrency)?.currencyCode;
    const toCurrencyCode = this.currencyMaster.find(curr => curr.CurrencyMasterSid === toCurrency)?.currencyCode;

    if(fromCurrency === toCurrency){
      destExRateCtrl.setValue(1);
      return;
    }
    
    if(fromCurrencyCode && toCurrencyCode && segment){
      const payload = {
        CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
        BranchMasterSid : this.currentBranch?.BranchMasterSid,
        fromCurrencyCode: fromCurrencyCode,
        toCurrencyCode: toCurrencyCode,
        EffectiveFrom : this.isEditMode ? new Date(this.quotationData?.QuoteDate) : new Date(),
        segment: segment
      }
      this.subscription.add(
        this.leadService.getExchangeRate(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              const exchangeRate = resp.data;
              destExRateCtrl.setValue(exchangeRate);
            } else {
              destExRateCtrl?.setValue('');
            }
          },
          (error) => {
            this.appSettingService.showError('Error fetching exchange rate: ' + error.message);
          }
        )
      )
    }

  }


  private subscribeToFormChanges(): void {
    this.subscription.add(
      this.quotationForm.valueChanges
        .pipe(debounceTime(300))
        .subscribe(() => this.updateDirtyState())
    );

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
      quotationForm: this.quotationForm?.getRawValue(),
    };
  }

  private normalizeValue(value: any): any {

  // Treat "", null, undefined as same
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  // Normalize numbers: treat "0" and 0 same
  if (typeof value === 'string' && !isNaN(Number(value))) {
    value = Number(value);
  }

  // OPTIONAL: Treat null and 0 as same (enable only if business allows)
  if (value === 0) {
    return null;
  }

  // Trim strings (avoid "Dubhai " vs "Dubhai")
  if (typeof value === 'string') {
    return value.trim();
  }

  // Handle Date
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle Array
  if (Array.isArray(value)) {
    return value.map(v => this.normalizeValue(v));
  }

  // Handle Object
  if (typeof value === 'object') {
    const normalizedObj: any = {};
    Object.keys(value)
      .sort() // ensure consistent key order
      .forEach(key => {
        normalizedObj[key] = this.normalizeValue(value[key]);
      });
    return normalizedObj;
  }

  return value;
}


  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(this.normalizeValue(obj1)) === JSON.stringify(this.normalizeValue(obj2));
  }

  ngOnDestroy(): void {
    this.commonService.clearDocumentData()
    this.mps.clear();
    this.subscription.unsubscribe();
  }


//   async goForBookingCreation() {
//   const customerHasBranch = this.customers.find(cus => cus.CustomerMasterSid === this.selectedItem.CustomerMasterSid);
//   if (!customerHasBranch) {
//     this.appSettingService.showWarning("Please fill KYC and Branch details for the customer.");
//     return;
//   }

//   try {
//     // Fetch full quote details with enquiry data using the new service method
//     const quoteResponse = await firstValueFrom(
//       this.leadService.getQuote(this.selectedItem.QuoteHeaderSid)
//     );

//     if (!quoteResponse) {
//       this.appSettingService.showError("Error loading quotation details");
//       return;
//     }

//     const QuoteData = quoteResponse.data;
//     console.log('Full Quotation Data with Enquiry:', QuoteData);

//     // TODO: need to fix this after completion of Authorization
//     // const approvedRoute = (QuoteData.quoteRoute || []).find(route =>
//     //   route.quoteCarrier.some(carrier => carrier.ApprovalStatus === "A")
//     // ) || {};
//     const approvedRoute = QuoteData.quoteRoute?.[0] || [];
//     const POO = this.ports.find(port => port.PortMasterSid === approvedRoute.PORSid);
//     const POL = this.ports.find(port => port.PortMasterSid === approvedRoute.POLSid);
//     const POD = this.ports.find(port => port.PortMasterSid === approvedRoute.PODSid);
//     const FPD = this.ports.find(port => port.PortMasterSid === approvedRoute.FDPSid);

//     // TODO: need to fix this after completion of Authorization
//     // const approvedCarrier = (approvedRoute?.quoteCarrier || []).find(
//     //   carrier => carrier.ApprovalStatus === "A"
//     // ) || {};
//     const approvedCarrier = approvedRoute?.quoteCarrier?.[0] || {};

//     const cargo = approvedRoute?.quoteCargo?.[0] || {};
//     const containerTypeId = this.containerTypeList.find(type => type.ContainerCode === cargo.ContainerType)?.ContainerTypeMasterSid;

//     // Extract shipper and consignee from enquiry if available
//     const enquiryData = QuoteData.EnquiryHeader;
//     const enquiryOther = enquiryData?.enquiryOther?.[0];
//     const shipperName = enquiryOther?.ShipperName || "";
//     const shipperAddress = enquiryOther?.ShipperAddress || "";
//     const consigneeName = enquiryOther?.ConsigneeName || "";
//     const consigneeAddress = enquiryOther?.ConsigneeAddress || "";


//     const data = {
//       quotation: true,
//       DepartmentMasterSid: approvedRoute.DepartmentMasterSid || null,
//       IncoTerms: approvedRoute.ServiceLevel,
//       CustomerMasterSid: QuoteData.CustomerMasterSid || null,
//       CustomerBranchSid: QuoteData.CustomerBranchSid || null,
//       CustomerName: QuoteData.CustomerName || "",
//       CustomerAddress: QuoteData.CustomerAddress || "",
//       SalesmanSid: QuoteData.SalesmanSid || null,
//       FreightTerms: QuoteData.FreightPPCC || "",
//       QuotationHeaderSid: QuoteData.QuoteHeaderSid || null,
//       CarrierName: approvedCarrier?.CarrierName || "",
//       status: 'A',

//       // Shipper and Consignee from Enquiry
//       ShipperName: shipperName,
//       ShipperAddress: shipperAddress,
//       ConsigneeName: consigneeName,
//       ConsigneeAddress: consigneeAddress,

//       // Port details
//       POO: POO?.PortCode || null,
//       POL: POL?.PortCode || null,
//       POD: POD?.PortCode || null,
//       FPD: FPD?.PortCode || null,

//       // Cargo details
//       bookingCargo: cargo ? [
//         {
//           CargoType: cargo.CargoType,
//           GrossWeight: cargo.GrossWeight,
//           NetWeight: cargo.NetWeight,
//           Volume: cargo.Volume,
//           ChargeableWeight: cargo.ChargeableWeight,
//           ContainerType: containerTypeId,
//           NoofContainers: cargo.Qty,
//         }
//       ] : [],

//       // Product details
//       bookingProduct: (cargo?.quoteProduct || []).map(product => ({
//         ProductName: product.ProductName,
//         ExternaPkg: product.PackageType,
//         ExternlQty: product.ExternalQty,
//         GrossWeight: product.GrossWeight,
//         NetWeight: product.NetWeight,
//         Volume: product.Volume,
//         IsHaz: product.IsHaz,
//         ImcoClass: product.ImcoClass,
//         UnNo: product.UnNo,
//         PkgGroup: product.PkgGroup,
//         Length: product.Length,
//         Width: product.Width,
//         Height: product.Height,
//         UomMasterSid: product.UomMasterSid,
//       })),

//       // Rate details
//       bookingRates: (approvedCarrier?.quoteCharge || []).map((charge, index) => ({
//         CompanyMasterSid: charge.CompanyMasterSid,
//         BranchMasterSid: charge.BranchMasterSid,
//         SerialNumber: index + 1,
//         ChargeMasterSid: charge.ChargeUomSid,
//         ChargeDescription: charge.ChargeDisplayName,
//         NoOfUnit: charge.Qty,

//         CostChargeUomSid: charge.CostChargeUomSid,
//         CostPrepaidCollect: charge.CostPrepaidCollect,
//         CostDrCr: charge.CostDrCr,
//         CostCurrencyMasterSid: charge.CostCurrencyMasterSid,
//         CostExchangeRate: charge.CostExchangeRate,
//         CostRate: charge.CostRate,
//         CostAmount: charge.CostAmount,
//         CostLocalAmount: charge.CostLocalAmount,
//         AgentMasterSid: charge.CostAgentMasterSid,

//         RevenueChargeUomSid: charge.RevenueChargeUomSid,
//         RevenuePrepaidCollect: charge.RevenuePrepaidCollect,
//         RevenueDrCr: charge.RevenueDrCr,
//         RevenueCurrencyMasterSid: charge.RevenueCurrencyMasterSid,
//         RevenueExchangeRate: charge.RevenueExchangeRate,
//         RevenueRate: charge.RevenueRate,
//         RevenueAmount: charge.RevenueAmount,
//         RevenueLocalAmount: charge.RevenueLocalAmount,
//         CustomerMasterSid: charge.RevenueCustomerMasterSid,
//         QuoteChargeSid: charge.QuoteChargeSid,
//         TariffDetailSid: charge.TariffDetailSid,
//       }))
//     };

//     console.log('Booking Data with Shipper/Consignee:', data);

//     this.router.navigate(['operation/booking/entry'], {
//       state: {
//         dataFromQuotation: data
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching quotation details:', error);
//     this.appSettingService.showError("Failed to load quotation details for booking");
//   }
// }

private validateCustomerForBookingCreation(): boolean {
  const customerMasterSid = this.selectedItem?.CustomerMasterSid ?? this.quotationForm.get('CustomerMasterSid')?.value;
  let customerBranchSid = this.selectedItem?.CustomerBranchSid ?? this.quotationForm.get('CustomerBranchSid')?.value;

  // Backward compatibility: old quotations may have null CustomerBranchSid on header.
  // If exactly one branch exists for this customer, auto-select it for booking flow.
  if (customerMasterSid && !customerBranchSid) {
    const availableBranches = (this.cusBranchList || []).filter((branch: any) =>
      Number(branch?.CustomerMasterSid ?? branch?.customerMaster?.CustomerMasterSid) === Number(customerMasterSid)
    );

    if (availableBranches.length === 1) {
      customerBranchSid = availableBranches[0]?.CustomerBranchSid ?? null;
      if (customerBranchSid) {
        this.quotationForm.patchValue({ CustomerBranchSid: customerBranchSid }, { emitEvent: false });
        if (this.selectedItem) {
          this.selectedItem.CustomerBranchSid = customerBranchSid;
        }
      }
    }
  }

  if (!customerMasterSid || !customerBranchSid) {
    this.appSettingService.showWarning("Please fill KYC and Branch details for the customer.");
    return false;
  }

  const isMappedCustomerBranch = this.customers.some((cus) =>
    Number(cus.CustomerMasterSid) === Number(customerMasterSid) &&
    Number(cus.CustomerBranchSid) === Number(customerBranchSid)
  );

  if (!isMappedCustomerBranch) {
    this.appSettingService.showWarning("Selected customer branch is not mapped in debtor/COA. Please complete mapping before booking.");
    return false;
  }

  return true;
}

async goForBookingCreation() {
  if (!this.validateCustomerForBookingCreation()) {
    return;
  }
  // Check if booking already exists
  if (this.selectedItem.BookingHeaderSid) {
    // Show confirmation modal
    const confirmed = await this.showBookingConfirmationModal();
    
    if (!confirmed) {
      // User cancelled
      this.appSettingService.showInfo('Booking creation cancelled');
      return;
    }
  }

  // Proceed with booking creation
  await this.createBookingFromQuotation();
}

private showBookingConfirmationModal(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const modalRef = this.ngbModal.open(this.bookingConfirmationModal, {
      size: 'md',
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.then(
      (result) => {
        // result will be true if user clicked "Create New Booking"
        resolve(result);
      },
      (dismissReason) => {
        // User dismissed the modal (clicked outside or X button)
        resolve(false);
      }
    );
  });
}

private async createBookingFromQuotation() {
  try {
    this.spinner.show();
    
    // Fetch full quote details
    const quoteResponse = await firstValueFrom(
      this.leadService.getQuote(this.selectedItem.QuoteHeaderSid)
    );

    if (!quoteResponse) {
      this.spinner.hide();
      this.appSettingService.showError("Error loading quotation details");
      return;
    }

    const QuoteData = quoteResponse.data;
    
    const approvedRoute = (QuoteData.quoteRoute || []).find(route =>
      (route?.quoteCarrier || []).some(carrier => carrier.ApprovalStatus === "Approved")
    );

    if (!approvedRoute) {
      this.spinner.hide();
      this.appSettingService.showWarning("No approved route found for booking creation.");
      return;
    }
    const POO = this.ports.find(port => port.PortMasterSid === approvedRoute.PORSid);
    const POL = this.ports.find(port => port.PortMasterSid === approvedRoute.POLSid);
    const POD = this.ports.find(port => port.PortMasterSid === approvedRoute.PODSid);
    const FPD = this.ports.find(port => port.PortMasterSid === approvedRoute.FDPSid);

    const approvedCarrier = approvedRoute?.quoteCarrier?.find((carrier: any) => carrier?.ApprovalStatus === "Approved") ||
      approvedRoute?.quoteCarrier?.[0] || {};
    const cargoGroups = this.getRouteCargoGroups(approvedRoute);
    const bookingCargoSource = cargoGroups.length ? cargoGroups : [{}];
    const bookingCargo = bookingCargoSource.map((cargo: any) => ({
      ...this.mapQuotationCargoForBooking(cargo),
      bookingProducts: this.getQuotationCargoProducts(cargo).map((product: any) => this.mapQuotationCargoProduct(product))
    }));
    const bookingProducts = bookingCargo.flatMap((cargo: any) => cargo.bookingProducts || []);

    // Extract shipper and consignee from enquiry if available
    const enquiryData = QuoteData.EnquiryHeader;
    const enquiryOther = enquiryData?.enquiryOther?.[0];
    const shipperName = enquiryOther?.ShipperName || "";
    const shipperAddress = enquiryOther?.ShipperAddress || "";
    const consigneeName = enquiryOther?.ConsigneeName || "";
    const consigneeAddress = enquiryOther?.ConsigneeAddress || "";
    const selectedDept = this.departments.find(dept => dept.DepartmentMasterSid === approvedRoute.DepartmentMasterSid);
    let jobType = '';
    if (selectedDept) {
      const departmentName = selectedDept.departmentName?.toLowerCase() || '';
      const exportImport = selectedDept.ExportImport;
      
      if (departmentName.includes('fcl') || departmentName.includes('lcl') || departmentName.includes('air')) {
        if (exportImport === 'Export') {
          jobType = 'Export';
        } else if (exportImport === 'Import') {
          jobType = 'Import';
        }
      }
    }
    // Prepare booking data
    const primaryCargo = bookingCargoSource[0] || {};
    const cargoCurrency = primaryCargo?.CargoCurrency || enquiryOther?.CargoCurrency || null;
    const cargoValue = Number(primaryCargo?.CargoValue ?? enquiryOther?.CargoValue ?? 0) || 0;

    const bookingData = {
      quotation: true,
      // Clear BookingHeaderSid to ensure new booking creation
      BookingHeaderSid: null,
      DepartmentMasterSid: approvedRoute.DepartmentMasterSid || null,
      IncoTerms: approvedRoute.ServiceLevel,
      CustomerMasterSid: QuoteData.CustomerMasterSid || null,
      CustomerBranchSid: QuoteData.CustomerBranchSid || null,
      CustomerName: QuoteData.CustomerName || "",
      CustomerAddress: QuoteData.CustomerAddress || "",
      SalesmanSid: QuoteData.SalesmanSid || null,
      FreightTerms: approvedRoute.FreightPPCC || "Prepaid",
      QuotationHeaderSid: QuoteData.QuoteHeaderSid || null,
      QuoteRouteSid: approvedRoute.QuoteRouteSid || null,
      CarrierName: approvedCarrier?.CarrierName || "",
      status: 'A',
      JobType: jobType,
      
      // Additional contract info
      IsContract: QuoteData.IsContract || "N",
      ContractExpired: QuoteData.expDate ? new Date(QuoteData.expDate) < new Date() : false,

      // Shipper and Consignee from Enquiry
      ShipperName: shipperName,
      ShipperAddress: shipperAddress,
      ConsigneeName: consigneeName,
      ConsigneeAddress: consigneeAddress,

      // Port details
      POO: POO?.PortCode || null,
      POL: POL?.PortCode || null,
      POD: POD?.PortCode || null,
      FPD: FPD?.PortCode || null,

      // Cargo details
      bookingCargo,

      // Other details (Booking tab "Cargo Value" patches from bookingOthers)
      bookingOthers: [{
        CargoCurrency: cargoCurrency,
        CargoValue: cargoValue
      }],

      // Product details
      bookingProduct: bookingProducts,

      // Rate details
      bookingRates: (approvedCarrier?.quoteCharge || []).map((charge, index) => ({
        CompanyMasterSid: charge.CompanyMasterSid,
        BranchMasterSid: charge.BranchMasterSid,
        SerialNumber: index + 1,
        ChargeMasterSid: charge.ChargeUomSid,
        ChargeDescription: charge.ChargeDisplayName,
        NoOfUnit: charge.Qty || 1,

        CostChargeUomSid: charge.CostChargeUomSid,
        CostPrepaidCollect: charge.CostPrepaidCollect || "Prepaid",
        CostDrCr: charge.CostDrCr || "D",
        CostCurrencyMasterSid: charge.CostCurrencyMasterSid,
        CostExchangeRate: charge.CostExchangeRate || 1,
        CostRate: charge.CostRate || 0,
        CostAmount: charge.CostAmount || 0,
        CostLocalAmount: charge.CostLocalAmount || 0,
        AgentMasterSid: charge.CostAgentMasterSid,
        CostAgentBranchSid: charge.CostAgentBranchSid,
        CostAgentMasterSid: charge.CostAgentMasterSid,

        RevenueChargeUomSid: charge.RevenueChargeUomSid,
        RevenuePrepaidCollect: charge.RevenuePrepaidCollect || "Prepaid",
        RevenueDrCr: charge.RevenueDrCr || "C",
        RevenueCurrencyMasterSid: charge.RevenueCurrencyMasterSid,
        RevenueExchangeRate: charge.RevenueExchangeRate || 1,
        RevenueRate: charge.RevenueRate || 0,
        RevenueAmount: charge.RevenueAmount || 0,
        RevenueLocalAmount: charge.RevenueLocalAmount || 0,
        CustomerMasterSid: charge.RevenueCustomerMasterSid,
        RevenueCustomerMasterSid: charge.RevenueCustomerMasterSid,
        RevenueCustomerBranchSid: charge.RevenueCustomerBranchSid,
        QuoteChargeSid: charge.QuoteChargeSid,
        TariffDetailSid: charge.TariffDetailSid,
      }))
    };

    this.spinner.hide();
    // Navigate to booking page
    this.router.navigate(['operation/booking/entry'], {
      state: {
        dataFromQuotation: bookingData,
        isNewBooking: true,
        existingBookingId: this.selectedItem.BookingHeaderSid
      }
    });

  } catch (error) {
    this.spinner.hide();
    console.error('Error creating booking from quotation:', error);
    this.appSettingService.showError("Failed to create booking from quotation");
  }
}

  
toggleLock() {
  this.isLocked = !this.isLocked;
}

  copyToCostUnit(routeIndex:number , carrierIndex:number , chargeIndex:number,unit){
    const ctrl = (this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup).get('CostChargeUomSid');
    if(!unit){
      ctrl.setValue(null);
    } else {
      ctrl.setValue(unit.UOMMasterSid);
    }
  }

  setOrResetValidationForCostAmount(routeIndex:number , carrierIndex:number , chargeIndex:number){
    const costAgent = (this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup).get('CostAgentMasterSid').value;
    const costRateCtrl = (this.quoteCharges(routeIndex,carrierIndex).at(chargeIndex) as FormGroup).get('CostRate');
    if(!costAgent){
      costRateCtrl.clearValidators();
    } else {
      costRateCtrl.setValidators([Validators.required]);
    }
    costRateCtrl.updateValueAndValidity();
  }

  handlePartyOnChargePPCC() {
    const CustomerMasterSid = this.quotationForm.get('CustomerMasterSid')?.value;
    const CustomerBranchSid = this.quotationForm.get('CustomerBranchSid')?.value;
    this.quoteRoutes.controls.forEach((route: FormGroup, routeIndex: number) => {
      this.quoteCarriers(routeIndex).controls.forEach((carrier: FormGroup, carrierIndex: number) => {
        this.quoteCharges(routeIndex, carrierIndex).controls.forEach((charge: FormGroup, chargeIndex: number) => {
          if (!charge.get('RevenueCustomerMasterSid')?.value) {
            charge.get('RevenueCustomerMasterSid')?.setValue(CustomerMasterSid);
          }
          if (!charge.get('RevenueCustomerBranchSid')?.value) {
            charge.get('RevenueCustomerBranchSid')?.setValue(CustomerBranchSid);
          }
        })
      })
    })
  }

  handleFreightPPCCForDetail(inco:any,index:number) {
    const group = this.quoteRoutes.at(index) as FormGroup;
    if(!inco || inco === undefined){
      group.get('FreightPPCC')?.setValue('Prepaid');
      return;
    } else {
      group.get('FreightPPCC')?.setValue(inco.OceanFreight);
    }
  }

  patchSalespersonOfLead(precustomer:any){
    this.leadService.getSalespersonOfLead(precustomer.PreCustomerMasterSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.quotationForm.patchValue({
            SalesmanSid: resp.data
          })
        } else {
          this.appSettingService.showError('Failed to load salesperson: Invalid response');
        }
      },
      error => {
        console.error('Error fetching salesperson:', error);
      });
  }

  onChargeCustomerChange(routeIndex: number, carrierIndex: number, chargeIndex: number, type: string, customer: any) {
    const chargeGroup = this.quoteCharges(routeIndex, carrierIndex).at(chargeIndex) as FormGroup;
    if(!chargeGroup) return;
    if (!customer) {
      if (type === 'party') {
        chargeGroup.get('RevenueCustomerMasterSid')?.setValue(null);
      } else {
        chargeGroup.get('CostAgentMasterSid')?.setValue(null);
      }
    } else {
      if (type === 'party') {
        chargeGroup.get('RevenueCustomerMasterSid')?.setValue(customer.CustomerMasterSid);
      } else {
        chargeGroup.get('CostAgentMasterSid')?.setValue(customer.CustomerMasterSid);
      }
    }

  }

  getDepartmentName(deptId: number) {
    if (!deptId || this.departments.length === 0) {
      return null;
    } else {
      return (this.departments.find(dep => dep.DepartmentMasterSid === deptId)?.departmentName);
    }
  }
 async loadRateLockConfig(): Promise<void> {
  try {
    if (!this.currentCompany?.CompanyMasterSid) {
      console.warn('No company ID available for rate lock config');
      return;
    }
    
   
    
    const config = await firstValueFrom(
      this.leadService.getAllCompanyConfigsByCompanyId(this.currentCompany.CompanyMasterSid)
    );
    
  
    
    // Find the QuoteRateLockUser configuration
    this.rateLockConfig = config.find((c: any) => c.ConfigurationName === 'QuoteRateLockUser');
    
    
    
    // After loading config, check permissions
    this.checkRateLockPermissions();
    
  } catch (error) {
    console.error('Error loading rate lock configuration:', error);
    this.rateLockConfig = null;
    this.canUserLockRates = false;
    
    // Disable the checkbox on error
    const rateLockControl = this.quotationForm.get('RateLock');
    if (rateLockControl) {
      rateLockControl.disable({ emitEvent: false });
    }
  }
}

checkRateLockPermissions(): void {
 
  const rateLockControl = this.quotationForm.get('RateLock');
  if (!rateLockControl) return;

  // Store the current value before any changes
  const currentRateLockValue = rateLockControl.value;
  
  
  if (!this.rateLockConfig || !this.currentUserEmail) {
    
    this.canUserLockRates = false;
    
    // Keep the existing value but disable the checkbox
    rateLockControl.disable({ emitEvent: false });
    
    // If it was locked, keep fields locked
    if (currentRateLockValue === true) {
      this.lockAllRateFields();
    }
    return;
  }

  // Parse the ConfigurationValue to get allowed emails
  const configValue = this.rateLockConfig.ConfigurationValue;
  // console.log('Raw ConfigurationValue:', configValue);
  
  if (!configValue || typeof configValue !== 'string') {
   
    this.canUserLockRates = false;
    
    // Keep the existing value but disable the checkbox
    rateLockControl.disable({ emitEvent: false });
    
    // If it was locked, keep fields locked
    if (currentRateLockValue === true) {
      this.lockAllRateFields();
    }
    return;
  }

  // Split by comma and trim each email (case-sensitive comparison)
  const allowedEmails = configValue
    .split(',')
    .map((email: string) => email.trim())
    .filter((email: string) => email.length > 0); // Remove empty strings
  
  // console.log('Allowed Emails:', allowedEmails);
  // console.log('Current User Email:', this.currentUserEmail.trim());

  // Check if current user's email is in the allowed list
  this.canUserLockRates = allowedEmails.includes(this.currentUserEmail.trim());
  

  // Enable or disable the RateLock checkbox based on permission
  if (this.canUserLockRates) {
   
    rateLockControl.enable({ emitEvent: false });
    
    // If already locked in data, apply the lock
    if (currentRateLockValue === true) {
      this.lockAllRateFields();
    }
  } else {
    
    // This preserves RateLock = "Y" from database
    rateLockControl.disable({ emitEvent: false });
    
    // If it's locked, keep the fields locked even though user can't change it
    if (currentRateLockValue === true) {
    
      this.lockAllRateFields();
    }
  }
}
 onRateLockChange(): void {
  if (!this.canUserLockRates) return;

  const rateLockValue = this.quotationForm.get('RateLock')?.value;
  
  if (rateLockValue) {
    this.lockAllRateFields();
  } else {
    this.unlockAllRateFields();
  }
}
 lockAllRateFields(): void {
  this.quoteRoutes.controls.forEach((route: FormGroup, routeIndex: number) => {
    const carrierArr = this.quoteCarriers(routeIndex);
    carrierArr.controls.forEach((carrier: FormGroup, carrierIndex: number) => {
      const chargeArr = this.quoteCharges(routeIndex, carrierIndex);
      chargeArr.controls.forEach((charge: FormGroup) => {
        // Disable all charge-related rate fields
        const rateFieldsToDisable = [
          'RevenueRate', 'RevenueExchangeRate', 'RevenueCurrencyMasterSid',
          'CostRate', 'CostExchangeRate', 'CostCurrencyMasterSid',
          'Qty', 'ChargeUomSid', 'RevenueAmount', 'RevenueLocalAmount',
          'CostAmount', 'CostLocalAmount', 'RevenueNumberOfUnit',
          'CostNumberOfUnit', 'RevenuePrepaidCollect', 'CostPrepaidCollect',
          'RevenueChargeUomSid', 'CostChargeUomSid'
        ];

        
        rateFieldsToDisable.forEach(field => {
          const control = charge.get(field);
          if (control && control.enabled) {
            control.disable({ emitEvent: false });
          }
        });
       const customerFields = ['RevenueCustomerMasterSid', 'RevenueCustomerBranchSid'];
        const agentFields = ['CostAgentMasterSid', 'CostAgentBranchSid'];
        
        [...customerFields, ...agentFields].forEach(field => {
          const control = charge.get(field);
          if (control && control.enabled) {
            control.disable({ emitEvent: false });
          }
        });
      });
    });
  });
}

// Update the unlockAllRateFields method
unlockAllRateFields(): void {
  this.quoteRoutes.controls.forEach((route: FormGroup, routeIndex: number) => {
    const carrierArr = this.quoteCarriers(routeIndex);
    carrierArr.controls.forEach((carrier: FormGroup, carrierIndex: number) => {
      const chargeArr = this.quoteCharges(routeIndex, carrierIndex);
      chargeArr.controls.forEach((charge: FormGroup) => {
        // Enable all charge-related rate fields
        const rateFieldsToEnable = [
          'RevenueRate', 'RevenueExchangeRate', 'RevenueCurrencyMasterSid',
          'CostRate', 'CostExchangeRate', 'CostCurrencyMasterSid',
          'Qty', 'ChargeUomSid'
        ];
        
        rateFieldsToEnable.forEach(field => {
          const control = charge.get(field);
          if (control && control.disabled && !this.disableAllModification && !this.quotationApproved) {
            control.enable({ emitEvent: false });
          }
        });
      });
    });
  });
}
isRateLocked(): boolean {
  return this.quotationForm.get('RateLock')?.value === true;
}

navigateToEnquiry(): void {
  const enquiryId = this.quotationForm?.get('EnquirySid')?.value;
  
  if (enquiryId) {
    this.router.navigate(['crm/enquiry/entry', enquiryId]);
  } else if (this.enquiryNumber) {
    this.appSettingService.showInfo('Enquiry ID not available for navigation');
  }
}

get isSuspended() : boolean {
    return this.quotationData?.status !== 'A';
  }

  
async printDiv(divId: string): Promise<void> {
  this.showPrintLogo = true;
  this.showPdfLogo = false;
  await this.prepareTermsForPrint();

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
  }, 50); 
}
 createNew() {
    this.router.navigate(['crm/quotation/entry']);  }
isRouteApproved(routeIndex: number): boolean {
  const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
  if (!routeForm) return false;
  
  // Get the carriers for this route
  const carrierArr = this.quoteCarriers(routeIndex);
  
  // Check if any carrier in this route is approved
  const hasApprovedCarrier = carrierArr.controls.some((carrier: FormGroup) => 
    carrier.get('authorizerStatus')?.value === "Approved"
  );
  
  return hasApprovedCarrier;
}
private getSavedRouteBySid(routeSid: number | null | undefined): any | null {
  if (!routeSid || !this.quotationData?.quoteRoute?.length) return null;
  return (
    this.quotationData.quoteRoute.find((r: any) => Number(r?.QuoteRouteSid) === Number(routeSid)) ??
    null
  );
}

doesBookingExistForRoute(routeSid: number | null | undefined): boolean {
  if (this.isSavedContract()) return false;

  const savedRoute = this.getSavedRouteBySid(routeSid);
  if (!savedRoute) return false;

  return (
    !!savedRoute?.BookingHeaderSid ||
    (!!savedRoute?.bookingHeader && !!savedRoute.bookingHeader.BookingHeaderSid)
  );
}

private resolveRouteSidForBooking(routeIndex: number, routeSid: number | null | undefined): number | null {
  const formRouteSid = Number(this.quoteRoutes.at(routeIndex)?.get('QuoteRouteSid')?.value);
  if (formRouteSid) {
    return formRouteSid;
  }

  const savedRouteSid = Number(this.quotationData?.quoteRoute?.[routeIndex]?.QuoteRouteSid);
  if (savedRouteSid) {
    return savedRouteSid;
  }

  const clickedRouteSid = Number(routeSid);
  return clickedRouteSid || null;
}

async goForBookingCreationForRoute(routeIndex: number, routeSid: number | null | undefined) {
  if (!this.validateCustomerForBookingCreation()) {
    return;
  }

  if (this.isContract && !this.isSavedContract()) {
    this.appSettingService.showWarning("Please save the contract before creating a booking.");
    return;
  }

  const resolvedRouteSid = this.resolveRouteSidForBooking(routeIndex, routeSid);
  if (!resolvedRouteSid) {
    this.appSettingService.showWarning("Route is not saved yet. Please save quotation before creating booking.");
    return;
  }

  // Check against SAVED data, not form state
  const savedRoute = this.getSavedRouteBySid(resolvedRouteSid);
  const savedApprovedCarrier = (savedRoute?.quoteCarrier || [])
    .find((carrier: any) => carrier?.ApprovalStatus === 'Approved');

  if (!savedRoute || !savedApprovedCarrier) {
    this.appSettingService.showWarning("This route is not approved and saved. Please save after approving the route before creating a booking.");
    return;
  }

  // const isContract = this.quotationForm.get('IsContract')?.value;
  const hasExistingBooking = this.doesBookingExistForRoute(resolvedRouteSid);

  if (!this.isContract && hasExistingBooking) {
    const confirmed = await this.showBookingConfirmationModal();
    if (!confirmed) {
      this.appSettingService.showInfo('Booking creation cancelled');
      return;
    }
  }

  await this.createBookingFromRoute(Number(savedRoute.QuoteRouteSid), Number(savedApprovedCarrier.QuoteCarrierSid));
}

private async createBookingFromRoute(routeSid: number, approvedCarrierSid: number) {
  try {
    this.spinner.show();
    
    // Fetch full quote details
    const quoteResponse = await firstValueFrom(
      this.leadService.getQuote(this.selectedItem.QuoteHeaderSid)
    );

    if (!quoteResponse) {
      this.spinner.hide();
      this.appSettingService.showError("Error loading quotation details");
      return;
    }

    const QuoteData = quoteResponse.data;
    
    
    // Get the specific route data
    const routeData = (QuoteData.quoteRoute || []).find((r: any) => Number(r?.QuoteRouteSid) === Number(routeSid));
    if (!routeData) {
      this.spinner.hide();
      this.appSettingService.showWarning("Selected route was not found in saved quotation.");
      return;
    }

    const POO = this.ports.find(port => port.PortMasterSid === routeData.PORSid);
    const POL = this.ports.find(port => port.PortMasterSid === routeData.POLSid);
    const POD = this.ports.find(port => port.PortMasterSid === routeData.PODSid);
    const FPD = this.ports.find(port => port.PortMasterSid === routeData.FDPSid);

    const approvedCarrier =
      (routeData?.quoteCarrier || []).find((c: any) => Number(c?.QuoteCarrierSid) === Number(approvedCarrierSid)) ||
      (routeData?.quoteCarrier || []).find((c: any) => c?.ApprovalStatus === 'Approved') ||
      {};
    if (!approvedCarrier?.QuoteCarrierSid) {
      this.spinner.hide();
      this.appSettingService.showWarning("Approved carrier for selected route was not found.");
      return;
    }

    const cargoGroups = this.getRouteCargoGroups(routeData);
    const bookingCargoSource = cargoGroups.length ? cargoGroups : [{}];
    const bookingCargo = bookingCargoSource.map((cargo: any) => ({
      ...this.mapQuotationCargoForBooking(cargo),
      bookingProducts: this.getQuotationCargoProducts(cargo).map((product: any) => this.mapQuotationCargoProduct(product))
    }));
    const bookingProducts = bookingCargo.flatMap((cargo: any) => cargo.bookingProducts || []);

    // Extract shipper and consignee from enquiry if available
    const enquiryData = QuoteData.EnquiryHeader;
    const enquiryOther = enquiryData?.enquiryOther?.[0];
    const shipperName = enquiryOther?.ShipperName || "";
    const shipperAddress = enquiryOther?.ShipperAddress || "";
    const consigneeName = enquiryOther?.ConsigneeName || "";
    const consigneeAddress = enquiryOther?.ConsigneeAddress || "";
    
    const selectedDept = this.departments.find(dept => dept.DepartmentMasterSid === routeData.DepartmentMasterSid);
    let jobType = '';
    if (selectedDept) {
      const departmentName = selectedDept.departmentName?.toLowerCase() || '';
      const exportImport = selectedDept.ExportImport;
      
      if (departmentName.includes('fcl') || departmentName.includes('lcl') || departmentName.includes('air')) {
        if (exportImport === 'Export') {
          jobType = 'Export';
        } else if (exportImport === 'Import') {
          jobType = 'Import';
        }
      }
    }

    
    // Prepare booking data
    const primaryCargo = bookingCargoSource[0] || {};
    const cargoCurrency = primaryCargo?.CargoCurrency || enquiryOther?.CargoCurrency || null;
    const cargoValue = Number(primaryCargo?.CargoValue ?? enquiryOther?.CargoValue ?? 0) || 0;

    const bookingData = {
      quotation: true,
      // Clear BookingHeaderSid to ensure new booking creation
      BookingHeaderSid: null,
      DepartmentMasterSid: routeData.DepartmentMasterSid || null,
      IncoTerms: routeData.ServiceLevel,
      CustomerMasterSid: QuoteData.CustomerMasterSid || null,
      CustomerBranchSid: QuoteData.CustomerBranchSid || null,
      CustomerName: QuoteData.CustomerName || "",
      CustomerAddress: QuoteData.CustomerAddress || "",
      SalesmanSid: QuoteData.SalesmanSid || null,
      FreightTerms: routeData.FreightPPCC || "",
      QuotationHeaderSid: QuoteData.QuoteHeaderSid || null,
      QuoteRouteSid: routeData.QuoteRouteSid || null,// Add this to identify the route
      QuoteCarrierSid: approvedCarrier.QuoteCarrierSid || null,
      CarrierName: approvedCarrier?.CarrierName || "",
      status: 'A',
      JobType: jobType,
      
      // Additional contract info
      IsContract: QuoteData.IsContract || "N",
      ContractExpired: QuoteData.expDate ? new Date(QuoteData.expDate) < new Date() : false,

      // Shipper and Consignee from Enquiry
      ShipperName: shipperName,
      ShipperAddress: shipperAddress,
      ConsigneeName: consigneeName,
      ConsigneeAddress: consigneeAddress,

      // Port details
      POO: POO?.PortCode || null,
      POL: POL?.PortCode || null,
      POD: POD?.PortCode || null,
      FPD: FPD?.PortCode || null,
      

      // Cargo details
      bookingCargo,

      // Other details (Booking tab "Cargo Value" patches from bookingOthers)
      bookingOthers: [{
        CargoCurrency: cargoCurrency,
        CargoValue: cargoValue
      }],

      // Product details
      bookingProduct: bookingProducts,

      // Rate details
      bookingRates: (approvedCarrier?.quoteCharge || []).map((charge, index) => ({
        CompanyMasterSid: charge.CompanyMasterSid,
        BranchMasterSid: charge.BranchMasterSid,
        SerialNumber: index + 1,
        ChargeMasterSid: charge.ChargeUomSid,
        ChargeDescription: charge.ChargeDisplayName,
        NoOfUnit: charge.Qty || 1,

        CostChargeUomSid: charge.CostChargeUomSid,
        CostPrepaidCollect: charge.CostPrepaidCollect || "Prepaid",
        CostDrCr: charge.CostDrCr || "D",
        CostCurrencyMasterSid: charge.CostCurrencyMasterSid,
        CostExchangeRate: charge.CostExchangeRate || 1,
        CostRate: charge.CostRate || 0,
        CostAmount: charge.CostAmount || 0,
        CostLocalAmount: charge.CostLocalAmount || 0,
        AgentMasterSid: charge.CostAgentMasterSid,
        AgentBranchSid: charge.CostAgentBranchSid,
       

        RevenueChargeUomSid: charge.RevenueChargeUomSid,
        RevenuePrepaidCollect: charge.RevenuePrepaidCollect || "Prepaid",
        RevenueDrCr: charge.RevenueDrCr || "C",
        RevenueCurrencyMasterSid: charge.RevenueCurrencyMasterSid,
        RevenueExchangeRate: charge.RevenueExchangeRate || 1,
        RevenueRate: charge.RevenueRate || 0,
        CustomerBranchSid: charge.RevenueCustomerBranchSid,
        RevenueAmount: charge.RevenueAmount || 0,
        RevenueLocalAmount: charge.RevenueLocalAmount || 0,
        CustomerMasterSid: charge.RevenueCustomerMasterSid,
        QuoteChargeSid: charge.QuoteChargeSid,
        TariffDetailSid: charge.TariffDetailSid,
      }))
    };

   
    this.spinner.hide();
    
    // Navigate to booking page
    this.router.navigate(['operation/booking/entry'], {
      state: {
        dataFromQuotation: bookingData,
        isNewBooking: true,
        existingBookingId: routeData.BookingHeaderSid,
        quoteRouteSid: routeSid // Pass route sid for reference
        
      }
    });

    // Note: The actual booking creation will happen in the booking entry component
    // After booking is created, the backend should update both QuoteHeader and QuoteRoute
    // with the BookingHeaderSid

  } catch (error) {
    this.spinner.hide();
    console.error('Error creating booking from quotation route:', error);
    this.appSettingService.showError("Failed to create booking from quotation route");
  }
  
}

hasPendingApprovalChanges(): boolean {
  if (!this.quotationData) return false;
  
  const formRoutes = this.quoteRoutes.getRawValue();
  
  // Compare current form approval status with original quotation data
  return formRoutes.some((route: any, routeIndex: number) => {
    const formCarriers = route.quoteCarriers || [];
    const originalRoute = this.quotationData?.quoteRoute?.[routeIndex];
    const originalCarriers = originalRoute?.quoteCarrier || [];
    
    // Check if any carrier approval status has changed
    return formCarriers.some((carrier: any, carrierIndex: number) => {
      const originalCarrier = originalCarriers[carrierIndex];
      if (!originalCarrier) return true; // New carrier added
      
      return carrier.authorizerStatus !== originalCarrier.ApprovalStatus;
    });
  });
}

// Add this method to check if all approved routes are saved
allApprovedRoutesSaved(): boolean {
  const formRoutes = this.quoteRoutes.getRawValue();
  
  return formRoutes.every((route: any) => {
    const carriers = route.quoteCarriers || [];
    return carriers.every((carrier: any) => {
      // If carrier is approved, check if it matches the saved data
      if (carrier.authorizerStatus === 'Approved') {
        const routeIndex = formRoutes.findIndex(r => r === route);
        const carrierIndex = carriers.findIndex(c => c === carrier);
        
        // Check if this approval status has been saved
        const originalRoute = this.quotationData?.quoteRoute?.[routeIndex];
        const originalCarrier = originalRoute?.quoteCarrier?.[carrierIndex];
        
        return originalCarrier?.ApprovalStatus === 'Approved';
      }
      return true;
    });
  });
}

getBookingNumber(routeSid: number | null | undefined): string {
  const savedRoute = this.getSavedRouteBySid(routeSid);
  return savedRoute?.bookingHeader?.BookingNo || '';
}

getBookingHeader(routeSid: number | null | undefined): any {
  const savedRoute = this.getSavedRouteBySid(routeSid);
  return savedRoute?.bookingHeader || null;
}

// Add this method to get booking header SID for a specific route
getBookingHeaderSid(routeIndex: number): number | null {
  if (!this.quotationData || !this.quotationData.quoteRoute) {
    return null;
  }
  
  const routeData = this.quotationData.quoteRoute[routeIndex];
  if (routeData && routeData.bookingHeader) {
    return routeData.bookingHeader.BookingHeaderSid || null;
  }
  
  return null;
}
viewBooking(booking: any): void {
    if (booking?.BookingHeaderSid) {
        this.router.navigate(['/operation/booking/entry', booking.BookingHeaderSid]);
    } else {
        this.appSettingService.showWarning('Booking information not available');
    }
}

isQuotationSavedAfterApproval(routeIndex: number): boolean {
  if (!this.isEditMode || !this.quotationData) {
    return false;
  }
  
  const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
  const carrierArr = this.quoteCarriers(routeIndex);
  
  // Check if any carrier is approved in the form
  const hasApprovedCarrierInForm = carrierArr.controls.some((carrier: FormGroup) => 
    carrier.get('authorizerStatus')?.value === "Approved"
  );
  
  if (!hasApprovedCarrierInForm) {
    return false;
  }
  
  // Check if this approval is already saved in the database (by QuoteRouteSid, not index)
  const routeSid = routeForm?.get('QuoteRouteSid')?.value;
  const savedRoute = this.getSavedRouteBySid(routeSid);
  const savedCarriers = savedRoute?.quoteCarrier || [];
  
  const hasSavedApproval = savedCarriers.some(carrier => 
    carrier.ApprovalStatus === "Approved"
  );
  
  return hasSavedApproval;
}
openStandardCharges(routeIndex: number, carrierIndex: number) {
  if (this.costRevenueAccess === 'HIDE_BOTH' || this.costRevenueAccess === 'READ_ONLY') {
    this.toastr.warning(`Getting standard charges is not allowed. Cost/Revenue access for this branch is set to '${this.costRevenueAccess}'. Please contact your admin to change the access in User Master.`, 'Access Restricted', { timeOut: 6000 });
    return;
  }
  const routeForm = this.quoteRoutes.at(routeIndex) as FormGroup;
  const carrierForm = this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;

  // ✅ Open Modal Component
  const modalRef = this.ngbModal.open(GetStandardChargesComponent, {
    size: 'xl',
    centered: true,
    backdrop: 'static'
  });

  // ✅ Pass Required Inputs
    modalRef.componentInstance.parentFormValue = {

    DepartmentMasterSid: routeForm.get('DepartmentMasterSid')?.value,
    CargoType: routeForm.get('CargoType')?.value,

    // Quotation Flag
    isQuotation: true,


    // Dates
    EffectiveFrom: routeForm.get('effDate')?.value,
    ExpiredTo: routeForm.get('expDate')?.value,
  };
  modalRef.componentInstance.currentCompany = this.currentCompany;
  modalRef.componentInstance.currentBranch = this.currentBranch;

  modalRef.componentInstance.chargeMaster = this.chargeMaster;
  modalRef.componentInstance.chargeUnitMaster = this.chargeUnitMaster;
  modalRef.componentInstance.currencyMaster = this.currencyMaster;

  // ✅ Receive Selected Charges Back
  modalRef.componentInstance.chargesSelected.subscribe((charges: any[]) => {
    this.patchStandardCharges(routeIndex, carrierIndex, charges);
  });
}

  patchStandardCharges(routeIndex: number, carrierIndex: number, charges: any[]) {

    const carrierForm =
      this.quoteCarriers(routeIndex).at(carrierIndex) as FormGroup;

    const quoteChargesArray =
      carrierForm.get('quoteCharges') as FormArray;

    if (!quoteChargesArray) return;

    // Existing Standard Charge IDs (Avoid Duplicate)
    const existingIds =
      quoteChargesArray.value.map((x: any) => x.StdTariffDetailSid);

    charges.forEach((sc: any) => {

      if (existingIds.includes(sc.StdTariffDetailSid)) return;

      // ✅ Calculate Amounts
      const qty = Number(sc.NoofUnit) || 1;

      const revenueAmt = qty * (Number(sc.SaleAmount) || 0);
      const costAmt = qty * (Number(sc.CostAmount) || 0);

      // ✅ Push into FormArray (Same Structure as Tariff)
      this.addQuoteCharge(routeIndex, carrierIndex, {

        StdTariffDetailSid: sc.StdTariffDetailSid,

        ChargeUomSid: sc.ChargeMasterSid,
        RevenueChargeUomSid: sc.ChargeUomSid,
        CostChargeUomSid: sc.ChargeUomSid,
        ChargeDisplayName: sc.ChargeDescription,
        Qty: qty,

        // ---------------- Revenue ----------------
        RevenueCurrencyMasterSid: sc.SaleCurrencyMasterSid,
        RevenueRate: sc.SaleAmount,
        RevenueExchangeRate: sc.exchangerateRevenue,
        RevenueDrCr: "C",

        RevenueAmount: revenueAmt,
        RevenueLocalAmount: revenueAmt * (Number(sc.exchangerateRevenue) || 0),

        // ---------------- Cost ----------------
        CostCurrencyMasterSid: sc.CostCurrencyMasterSid,
        CostRate: sc.CostAmount,
        CostExchangeRate: sc.exchangeRateCost,
        CostDrCr: "D",

        CostAmount: costAmt,
        CostLocalAmount: costAmt * (Number(sc.exchangeRateCost) || 0),

        Remarks: sc.Remarks || '',
        ChargeCode: sc.ChargeMaster?.chargeCode,
        UOMCode: sc.UOMMaster?.UOMCode,

        // RevenueCustomerMasterSid: null,
        // RevenueCustomerBranchSid: null,
        // CostAgentMasterSid: null,
        // CostAgentBranchSid: null,

      })

    });

    this.appSettingService.showSuccess("Standard Charges Applied Successfully ✅");
  }


}



