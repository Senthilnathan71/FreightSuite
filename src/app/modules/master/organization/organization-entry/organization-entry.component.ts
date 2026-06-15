import { CommonModule, DatePipe, JsonPipe, UpperCasePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  HostListener,
  TemplateRef,
  ViewChild,
  OnInit,
  OnDestroy,
  effect
} from '@angular/core';
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
import {
  NgbCalendar,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbDateStruct,
  NgbDropdownModule,
  NgbModal,
  NgbModalModule,
  NgbModalRef,
  NgbNavModule,
  NgbPaginationModule,
  NgbTooltipModule,
  NgbAccordionModule
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { City } from 'src/app/modules/crm-mobile/Interfaces/city.interface';
import { MasterService } from '../../master.service';

import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import {  firstValueFrom, forkJoin, Subject } from 'rxjs';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';
import { PasswordValidators } from 'src/app/core/ValidationFn/password.validators';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { debounceTime, distinctUntilChanged, switchMap, startWith, takeUntil } from 'rxjs/operators';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import * as XLSX from 'xlsx';
import { SearchableDropdownModal } from 'src/app/component/searchable-dropdown/searchable-dropdown-modal.component';
import { DialCodeDropdownComponent } from 'src/app/component/dial-code-dropdown/dial-code-dropdown.component';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';


@Component({
  selector: 'app-organization-entry',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgbNavModule,
    CommonModule,
    NgSelectModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    ReactiveFormsModule,
    NgbModalModule,
    OnlyTextDirective,
    OnlyNumbersDirective,
    TextWithNumbersDirective,
    NgbDatepickerModule,
    CustomDatePipe,
    NgbTooltipModule,
    DatePipe,
    MultiSelectComponent,
    NgbDropdownModule,
    NgbAccordionModule,
    SearchableDropdown,
    SearchableDropdownModal,
    DialCodeDropdownComponent
  ],
  templateUrl: './organization-entry.component.html',
  styleUrl: './organization-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    UpperCasePipe
  ],
})
export class OrganizationEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private settingsService: SettingsService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private calendar: NgbCalendar,
    private leadService: LeadService,
    public dropdownStore: DropdownStore,
    private casepipe : UpperCasePipe,
    private commonService: CommonService,
    public mps : MenuPermissionService
  ) {
    this.cusMilestoneFormArr = this.fb.array([]);
        effect(()=> {
          const countryData = this.dropdownStore.countries();
          const stateData = this.dropdownStore.states();
          const cityData = this.dropdownStore.cities();
          this.countryList = countryData;
          this.stateList = (stateData || []).map(s => ({...s,Country : s.countryMaster?.countryName}));
          this.cityList = (cityData || []).map(c => ({...c,State : c.stateMaster?.stateName,Country : c.countryMaster?.countryName}));
          if(this.customerForm){
            setTimeout(() => {
              this.autoSelectCurrency();
            });
          }
        })
  }
  private destroy$ = new Subject<void>();
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  private isUnsavedTrackingInitialized = false;
  // Existing properties
  page = 1;
  pageSize = 5;
  totalLengthOfBranch: number = 0;
    displayedCustomerTypes: any[] = [];
  extraCustomerTypesCount = 0;
  currentTaxIdLabel: string = 'PAN/VAT Number';
   activeBranchIds: string[] = [];
   private selectedStatusChanges = new Subject<void>();
   private lastCountryMasterSid: any = null;
   private temporarilySuspendedBranches = new Map<FormGroup, 'Active' | 'Suspended'>();
   private temporarilySuspendedChildRecords = new Map<FormGroup, 'Active' | 'Suspended'>();


  networkList: any[] = [];
  isCustomerSaved = false;
  showAdditionalTabs = false;
  isLoadingStates = false;
  isCurrentUserIndian: boolean = false;
  countryLookupConfig = DROPDOWN_CONFIGS.COUNTRY;
    stateLookupConfig = DROPDOWN_CONFIGS.STATE;
    cityLookupConfig = DROPDOWN_CONFIGS.CITY;
    userLookupConfig = DROPDOWN_CONFIGS.USER;
isLoadingCities = false;
  selectedTab = 'Party';
  MenuMasterSid: any;
  isLogLoading: boolean = false;
  tabs = [
    { name: 'Party', icon: 'fas fa-user-tie' },
    { name: 'Branch', icon: 'fas fa-boxes' },
  ];

  selectedTab1 = "Contact";
  tab = [
    { name: 'Contact', icon: 'fas fa-code-branch' },
    { name: 'Email', icon: 'fas fa-envelope' },
    { name: 'eLogin', icon: 'fas fa-sign-in-alt' },
  ];
  CurrencyLookupConfig = {
    displayFields : ['currencyCode', 'currencyName','countryName'],
    displayLabels : ['Code', 'Name','Country'],
    labelFields :['currencyCode'],
  };

  // Branch accordion properties
  expandedBranches: Set<number> = new Set();

  // Branch Form Array - Initialize immediately
  branchFormArray: FormArray = this.fb.array([]);

  // Cache available branches for dropdown
  availableBranchesCache: any[] = [];

  // Add active branch index for accordion
  activeBranchIndex: number | null = null;
  private setFieldErrorFlag(ctrl: AbstractControl | null, key: string, isError: boolean) {
    if (!ctrl) return;
    const cur = ctrl.errors || {};
    if (isError) {
      cur[key] = true;
    } else {
      delete cur[key];
    }
    const hasAny = Object.keys(cur).length > 0;
    ctrl.setErrors(hasAny ? cur : null);
  }
  


  // Mode arrays
  modeOfStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];

  modeOfRegistered = [
    { id: 'Y', name: 'Registered' },
    { id: 'N', name: 'Unregistered' },
  ];

  modeOfBranchType = [
    { id: 'HeadQuarters', name: 'Head Quarters' },
    { id: 'BRANCH', name: 'Branch' }
  ];

  modeofPAN = [
    { id: '1', name: 'Company' },
    { id: '2', name: 'Individual' },
    { id: '3', name: 'Not Applicable' },
  ];
  gstTypeList = [
    { id: '1', name: 'Composite' },
    { id: '2', name: 'Exempt' },
    { id: '3', name: 'RCM Others' },
    { id: '4', name: 'RCM Specified' },
    { id: '5', name: 'Regular' },
    { id: '6', name: 'SEZ' },
    { id: '7', name: 'Zero Rated' },
  ];
  airlineNumber: string = '';
  airlineCode: string = '';
  isAirlineSelected: boolean = false;
  customerSearchResults: any[] = [];
isSearchingCustomers = false;
showCustomerDropdown = false;
selectedCustomerIds: number[] = [];
  

  selectedStatus: string[] = [];

  modeOfCustomerType = [
    { id: 1, name: "Agent" },
    { id: 2, name: "Air Line" },
    { id: 3, name: "Carrier" },
    { id: 4, name: "CFS" },
    { id: 5, name: "Consignee" },
    { id: 6, name: "Customer" },
    { id: 7, name: "Feeder" },
    { id: 8, name: "Forwarder" },
    { id: 9, name: "NVOCC" },
    { id: 10, name: "Notify" },
    { id: 11, name: "Overseas Agent" },
    { id: 12, name: "Shipper" },
    { id: 13, name: "Shipping Line" },
    { id: 14, name: "Transporter" },
    { id: 15, name: "Vendor" },
    { id: 16, name: "Warehouse" },
    { id: 17, name: "Yard" }
  ].sort((a, b) => a.name.localeCompare(b.name));
  isDepartmentSelected(item: any): boolean {
    return this.selectedDepartments.includes(item.DepartmentMasterSid.toString());
  }
  validateMultipleEmails(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const emails = control.value.split(',').map(email => email.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    return invalidEmails.length ? { multipleEmail: true } : null;
  }

  toggleDepartmentSelection(item: any): void {
    const deptId = item.DepartmentMasterSid.toString();
    const index = this.selectedDepartments.indexOf(deptId);
    if (index === -1) {
      this.selectedDepartments.push(deptId);
    } else {
      this.selectedDepartments.splice(index, 1);
    }
    this.updateDisplayedDepartments();
    this.customerBranchEmailForm.get('DepartmentMasterSid').setValue(this.selectedDepartments.join(','));
  }
  updateDisplayedDepartments(): void {
    this.displayedDepartments = this.departmentList
      .filter(dept => this.selectedDepartments.includes(dept.DepartmentMasterSid.toString()))
      .slice(0, 3);
    this.extraDepartmentsCount = Math.max(0, this.selectedDepartments.length - 3);
  }
  
shouldShowGSTFields(branchIndex: number): boolean {
  const isIndia = this.isIndianCountry();
  const panAvailable = this.customerForm.get('PanAvailable')?.value;
  return isIndia && panAvailable;
}
onCountryChange(): void {
  const isIndia = this.isIndianCountry();
  const isUAE = this.isUaeCountry();
  
  // Update tax field validation based on country
  this.updateTaxIdFieldState();
  this.updatePanTypeValidation();
  
  // Update tax label
  this.currentTaxIdLabel = this.getTaxIdLabel();
  
  // Load states for India
  if (isIndia) {
    this.getStatesByCountryId();
  }
    this.autoSelectCurrency(true);
}

private autoSelectCurrency(force = false): void {
  const countryId = this.customerForm.get('CountryMasterSid')?.value;
  const currencyControl = this.customerForm.get('CurrencyMasterSid');
  const currentCurrencyId = currencyControl?.value;
  
  if (!countryId || !this.countryList) return;
  if (!force && currentCurrencyId !== null && currentCurrencyId !== undefined && currentCurrencyId !== '') return;
  
  // Find the selected country
  const selectedCountry = this.countryList.find((c: any) => c.CountryMasterSid == countryId);
  
  if (selectedCountry && selectedCountry.CurrencyMasterSid) {
    // Set the CurrencyMasterSid to match the country's currency
    currencyControl?.setValue(selectedCountry.CurrencyMasterSid);
  }
}

private normalizeStatus(value: string): 'A' | 'S' {
  if (!value) return 'A';
  const v = value.toString().trim().toLowerCase();
  if (v === 's' || v === 'suspended' || v === 'inactive') return 'S';
  return 'A';
}

  // Sales team properties
  salesTeamList: any[];
  CustomerSalesSid: number;
  salespersonForm!: FormGroup;
  spDepartmentList: any[] = [];
  departmentListForSelect: any[] = []; // Convert from getter to property
  spBranchList: any[] = [];
  salesPersonList: any[] = [];
  allDocs: any[] = [];
  allCS: any[] = [];
  branchList: any[];
  isSalespersonEdit: boolean;
  modalRef10: NgbModalRef;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  slicedSalesTeamList: any[] = [];
  salesTeamPage = 1;
  salesTeamPageSize = 10;
  selectedCustomerBranch: any[] = [];

  // Info Related Variables
  customerData: any;
  branchData: any;
  // branchContactData: any;
  // branchEmailData: any;
  // branchLoginData: any;
  salesmanData: any;
  currentMenuId: number;
  TandCList: any;
  menuList: any[] = [];

  auditLogs: any[] = [];
  auditLogModalRef!: NgbModalRef;

  // Milestone Related Variable Declaration
  milestoneListArr: any[] = [];
  cusMilestoneList: any[] = [];
  cusMilestoneFormArr: FormArray;
  realMileIndex: number;
  cusMilestoneForm!: FormGroup;
  totalLengthOfCusMile: number;
  mileForm!: FormGroup;
  cusMilePage = 1;
  cusMilePageSize = 5;
  totalCusMilePages = 1;
  slicedCusMilestoneList: any[] = [];

  updateTypeList = [
    { id: '1', name: 'eMail' },
    { id: '2', name: 'SMS' },
    { id: '3', name: 'Whatsapp' },
    { id: '4', name: 'Phone' }
  ]

  // Customer branch related properties
  customerBranchData: any;
  customerBranchContactData: any;
  customerBranchEmailData: any;
  departmentList: any[] = [];
  customerBranchName: any;
  customerName: any;

  customerBranchLoginResults: any;

  companyList = [
    { id: '1', name: 'Artificial Juridical Person' },
    { id: '2', name: 'Association Of Persons(AOP)' },
    { id: '3', name: 'Body Of Individuals' },
    { id: '4', name: 'Company' },
    { id: '5', name: 'Firm' },
    { id: '6', name: 'Government Agency' },
    { id: '7', name: 'Individual(proprietor)' },
    { id: '8', name: 'Limited Liability Company(LLC)' },
    { id: '9', name: 'Limited Liability Partnership(LLP)' },
    { id: '10', name: 'Local Authority' },
    { id: '11', name: 'Private Limited Liability(LTD)' },
  ];
  customerBranchEmailResults: any;
  customerBranchLoginData: any;

  contactList = [
    { id: '1', name: 'Manager' },
    { id: '2', name: 'Accounts' },
    { id: '3', name: 'Operation Head' },
    { id: '4', name: 'Customer Service' },
    { id: '5', name: 'MNR' },
    { id: '6', name: 'Director' },
    { id: '7', name: 'Pricing' },
    { id: '8', name: 'Commercial' },
  ];

  modalRef: NgbModalRef;
  modalRef1: NgbModalRef;
  stateList: any;
  stateNewList:any
  customerForm!: FormGroup;
  customerBranchForm!: FormGroup;
  customerBranchContactForm!: FormGroup;
  customerBranchEmailForm!: FormGroup;
  customerBranchLoginForm!: FormGroup;
  currentCompany: any;
  currentBranch: any;

  isEditMode = false;
  isModalEditMode = false;
  errorMessage: string = '';
  btnDisable: boolean = false;
  CustomerMasterSid: number;
  cityList: any;
  cityNewList:any
  countryList: any;
  currencyList: any;
  status: any;
  currentCountyID: any;
  CustomerBrEmailSid: any;
  // customerBranchResults: any;
  btnCustomerSaveDisabled: boolean = true;
  userData: any;
  currentCounty: any;
  currentUserEmail: string = '';
  customerNameConfig: any = null;
  canEditCustomerName: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};

  displayedDepartments: any[] = [];
  extraDepartmentsCount = 0;
  selectedDepartments: string[] = [];

  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended',
    'Active': 'Active',
    'Suspended': 'Suspended'
  };

  // Excel Upload Properties
  @ViewChild('excelUploadModal') excelUploadModal!: TemplateRef<any>;
  @ViewChild('importErrorsModal') importErrorsModal!: TemplateRef<any>;
  excelUploadModalRef!: NgbModalRef;
  selectedExcelFile: File | null = null;
  isDragOver = false;
  isProcessingExcel = false;
  isImporting = false;
  showDataPreview = false;
  excelUploadError: string | null = null;
  parsedCustomers: any[] = [];
  hasValidationErrors = false;
  importFailedRecords: any[] = [];

  // Excel Preview Accordion Properties
  expandedPreviewCustomers: Set<number> = new Set();

  customerFieldLabels: { key: string; label: string }[] = [
    { key: 'CustomerName', label: 'Customer Name' },
    { key: 'CustomerShortCode', label: 'Short Code' },
    { key: 'CustomerAliasName', label: 'Alias Name' },
    { key: 'CustomerAddress1', label: 'Address 1' },
    { key: 'CustomerAddress2', label: 'Address 2' },
    { key: 'CountryName', label: 'Country' },
    { key: 'CompanyType', label: 'Company Type' },
    { key: 'PanAvailable', label: 'PAN Available' },
    { key: 'PanName', label: 'PAN Name' },
    { key: 'GroupName', label: 'Group Name' },
    { key: 'Website', label: 'Website' },
    { key: 'paymentType', label: 'Payment Type' },
    { key: 'IsMSME', label: 'Is MSME' },
    { key: 'RegistrationNo', label: 'Registration No' },
    { key: 'Remarks', label: 'Remarks' },
    { key: 'CIN', label: 'CIN' },
    { key: 'TAN', label: 'TAN' },
    { key: 'status', label: 'Status' },
    { key: 'CustomerType', label: 'Customer Type' },
    { key: 'Network', label: 'Network' }
  ];

  branchFieldColumns: { key: string; label: string }[] = [
    { key: 'CustBranchName', label: 'Branch Name' },
    { key: 'CustBranchType', label: 'Type' },
    { key: 'CustBranchCode', label: 'Code' },
    { key: 'StateName', label: 'State' },
    { key: 'CityName', label: 'City' },
    { key: 'Contact_Person', label: 'Contact Person' },
    { key: 'CustBranchZipPostCode', label: 'Zip/Post Code' },
    { key: 'CustBranchPhone', label: 'Phone' },
    { key: 'CustBranchEmail', label: 'Email' },
    { key: 'CustBranchAddress', label: 'Address' },
    { key: 'CustBranchRegistered', label: 'Registered' },
    { key: 'CustBranchGSTtype', label: 'GST Type' },
    { key: 'CustBranchGSTIN', label: 'GSTIN' },
    { key: 'status', label: 'Status' }
  ];

  requiredCustomerFields: string[] = ['CustomerName', 'CustomerAddress1', 'CountryName'];
  requiredBranchFields: string[] = ['CustBranchName', 'CustBranchType', 'StateName', 'CityName', 'CustBranchEmail', 'CustBranchAddress'];

  switchToEditMode() {
    this.isEditMode = true;
    this.selectedTab = 'Party';
  }

  ngOnInit(): void {
    
    this.dropdownStore.loadCountries().subscribe(() => {

  this.dropdownStore.loadStates().subscribe(() => {

    // Auto-set country ONLY for NEW record
    if (!this.isEditMode && !this.CustomerMasterSid && this.customerForm) {

      const loginCountryId = this.appSettingService.getCurrentCompanyInfo()?.CountryMasterSid;

      if (loginCountryId) {
        console.log("Auto setting user country:", loginCountryId);

        // Set country
        this.customerForm.get('CountryMasterSid')?.setValue(loginCountryId);

        // Load dependent states
        this.getStatesByCountryId();
      }
    }

  });

});
    // ✅ Get current company & branch
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.loadNetworks();
this.mps.init().subscribe();
    // ✅ Get logged-in user profile
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.currentCounty = this.userData?.countryMaster?.countryName;
      this.currentCountyID = this.userData?.countryMaster?.CountryMasterSid;
      this.currentUserEmail = this.getUserEmail();
      this.isCurrentUserIndian = this.isUserCountryIndia();
      console.log('currentCountry', this.currentCounty);
      console.log('User Profile loaded:', this.userData);
      console.log('User Email:', this.userData?.userEmail || this.userData?.UserEmail);
      
    } 
    else {
      console.error('No user profile found in localStorage');
    }
     this.initForm();
    this.initializePanFields();
    this.loadAllSpfields();
    // this.loadDepartments();
    this.loadMenus();
    this.loadCustomerNameConfig();
    this.setupAirlineValidation();
    if (!this.isEditMode) {
    // For new customer, only show Party and Branch tabs initially
    this.tabs = [
      { name: 'Party', icon: 'fas fa-address-card' },
      { name: 'Branch', icon: 'fas fa-code-branch' }
    ];
    this.showAdditionalTabs = false;
    this.selectedTab = 'Party';
  } else {
    // For edit mode, show all tabs immediately
    this.tabs = [
      { name: 'Party', icon: 'fas fa-address-card' },
      { name: 'Branch', icon: 'fas fa-code-branch' },
      { name: 'Salesman', icon: 'fas fa-flag-checkered' },
      { name: 'Email', icon: 'fas fa-envelope' },
      { name: 'eLogin', icon: 'fas fa-sign-in-alt' },
      { name: 'Milestone', icon: 'fas fa-rupee-sign' },
    ];
    this.showAdditionalTabs = true;
    this.selectedTab = 'Party';
  }


    // ✅ Initial data loads
    // this.getAllCountries();
    this.initForm();
    this.initializePanFields();
    this.loadAllSpfields();
    // this.loadDepartments();
    this.loadMenus();

    // ✅ Initialize tabs for both new and edit modes
   

    // this.loadCustomerBranch();

    // ✅ If route has ID, switch to edit mode
    this.route.paramMap.subscribe((params) => {
      this.CustomerMasterSid = +params.get('id');
      if (this.CustomerMasterSid) {
        this.isEditMode = true;
        this.customerForm.get('status')?.enable();
        this.checkCustomerNamePermissions();
        this.showAdditionalTabs = true;
      
      // Update tabs to show all sections in edit mode
      this.tabs = [
        { name: 'Party', icon: 'fas fa-address-card' },
        { name: 'Branch', icon: 'fas fa-code-branch' },
        { name: 'Salesman', icon: 'fas fa-flag-checkered' },
        { name: 'Email', icon: 'fas fa-envelope' },
        { name: 'eLogin', icon: 'fas fa-sign-in-alt' },
        { name: 'Milestone', icon: 'fas fa-rupee-sign' },
      ];
        this.loadCustomerData(this.CustomerMasterSid);
        this.loadCustomerMilestones();
        this.getAllSpCustomerBranch();
        // Load sales team data in edit mode
        this.loadCustomerSalesTeamData();
      } else {
        const loginCountryId = this.appSettingService.getCurrentCompanyInfo()?.CountryMasterSid;
        if (loginCountryId) {
          this.customerForm.get('CountryMasterSid')?.setValue(loginCountryId);
          this.getStatesByCountryId();
          this.autoSelectCurrency(true);
        }
      }
    });
     this.customerForm.get('CompanyType')?.valueChanges
    .pipe(
      debounceTime(100),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    )
    .subscribe(() => {
      this.onCompanyTypeChange();
    });

    // ✅ Auto-generate short code when name changes with debounce
    this.customerForm.get('CustomerName')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
      this.onCountryChange();
      // this.updateShortCodeFieldState();
      // this.generateCustomerShortCode();
      this.updateTaxIdFieldValidation();
      this.updateTaxIdFieldState();
      this.getStatesByCountryId();
      });

    // ✅ React to country changes with debounce
    this.lastCountryMasterSid = this.customerForm.get('CountryMasterSid')?.value;
    this.customerForm.get('CountryMasterSid')?.valueChanges
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((countryId) => {
      if (this.lastCountryMasterSid !== null && this.lastCountryMasterSid !== countryId) {
        this.clearBranchStateAndCityOnCountryChange();
      }
      this.lastCountryMasterSid = countryId;
      this.onCountryChange();
        // this.updateShortCodeFieldState();
      // this.generateCustomerShortCode();
      this.updateTaxIdFieldValidation();
      this.updateTaxIdFieldState();
      this.getStatesByCountryId(); // Load states when country changes
      const dialCode = this.getFormDialCode();
      this.branches.controls.forEach((branch: AbstractControl) => {
      branch.get('CustBranchPhoneCode')?.setValue(dialCode, {
        emitEvent: false
      });
    });
    });

    this.customerForm.get('status')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((status) => {
        this.onCustomerStatusChange(status);
      });

    setTimeout(() => {
      this.initializeUnsavedChangesTracking();
    }, 0);
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    const currentSnapshot = this.buildUnsavedSnapshot();
    this.isDirty = !this.deepEqual(this.initialFormValue, currentSnapshot);
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return this.onSubmit();
  }

  get filteredCompanyList() {
  if (this.isIndianCountry()) {
    return this.companyList;
  }
  return this.companyList.filter(c => c.id !== '11');
}

  private initializeUnsavedChangesTracking(): void {
    if (!this.customerForm || this.isUnsavedTrackingInitialized) return;
    this.isUnsavedTrackingInitialized = true;
    this.initialFormValue = this.buildUnsavedSnapshot();
    this.isDirty = false;
    this.customerForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(this.initialFormValue, this.buildUnsavedSnapshot());
      });
    this.branchFormArray.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(this.initialFormValue, this.buildUnsavedSnapshot());
      });
  }

  private resetUnsavedState(): void {
    if (!this.customerForm) return;
    this.clearTemporaryStatusMemory();
    this.initialFormValue = this.buildUnsavedSnapshot();
    this.isDirty = false;
  }

  private buildUnsavedSnapshot(): any {
    return {
      customerForm: this.customerForm?.getRawValue() ?? null,
      branchFormArray: this.branchFormArray?.getRawValue?.() ?? []
    };
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) return Number(value);
    if (typeof value === 'number') return Number(value.toFixed(6));
    if (Array.isArray(value)) return value.map(v => this.normalizeValue(v));
    if (typeof value === 'object') {
      return Object.keys(value).sort().reduce((acc: any, key) => {
        acc[key] = this.normalizeValue(value[key]);
        return acc;
      }, {});
    }
    return value;
  }

  private deepEqual(a: any, b: any): boolean {
    return JSON.stringify(this.normalizeValue(a)) === JSON.stringify(this.normalizeValue(b));
  }

  // initializeBranchFormArray(): void {
  //   this.branchFormArray = this.fb.array([]);
  // }
  // Type casting methods to fix template errors
  getBranchFormGroup(branch: AbstractControl): FormGroup {
    return branch as FormGroup;
  }

  getContactFormGroup(contact: AbstractControl): FormGroup {
    return contact as FormGroup;
  }

  getEmailFormGroup(email: AbstractControl): FormGroup {
    return email as FormGroup;
  }

  getLoginFormGroup(login: AbstractControl): FormGroup {
    return login as FormGroup;
  }

  selectTab1(tabName: string) {
    this.selectedTab1 = tabName;
  }

  selectTab(tabName: string) {
  if (!this.shouldShowTab(tabName)) {
    this.appSettingService.showWarning('Please save customer and branch details first to access this section.');
    return;
  }
  this.selectedTab = tabName;
}
isUserCountryIndia(): boolean {
  if (!this.userData?.countryMaster) {
    return false;
  }
  
  const countryName = this.userData.countryMaster.countryName || '';
  return countryName.toLowerCase().includes('india');
}
  // Toggle branch accordion
 toggleBranch(branchIndex: number) {
  const branchId = 'branch-' + branchIndex;
  const index = this.activeBranchIds.indexOf(branchId);
  
  if (index > -1) {
    this.activeBranchIds.splice(index, 1);
  } else {
    this.activeBranchIds.push(branchId);
  }
}

  isBranchExpanded(branchIndex: number): boolean {
  return this.activeBranchIds.includes('branch-' + branchIndex);
}

  // Getter for branch form array
  get branches(): FormArray {
    return this.branchFormArray;
  }

  // Get contacts for a specific branch
  getContacts(branchIndex: number): FormArray {
    const branch = this.branches.at(branchIndex);
    return branch ? (branch.get('contacts') as FormArray) : this.fb.array([]);
  }

  // Get emails for a specific branch
  getEmails(branchIndex: number): FormArray {
    const branch = this.branches.at(branchIndex);
    return branch ? (branch.get('emails') as FormArray) : this.fb.array([]);
  }
  onDepartmentChange(branchIndex: number, emailIndex: number, selectedDepartments: any[]): void {
    const emailForm = this.getEmails(branchIndex).at(emailIndex);
    emailForm.get('DepartmentMasterSid')?.setValue(selectedDepartments);
  }
  onCustomerNameInput(event: any): void {
  const searchTerm = event.target?.value || '';
  
  if (!searchTerm || searchTerm.length < 10) {
    this.customerSearchResults = [];
    this.showCustomerDropdown = false;
    return;
  }

  this.isSearchingCustomers = true;
  this.showCustomerDropdown = true;
  
  const payload = {
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    searchTerm: searchTerm,
    excludeCustomerMasterSids: this.selectedCustomerIds
  };

  console.log('Searching customers with:', payload);

  this.masterService.searchCustomersByName(payload)
    .pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (resp: any) => {
        this.isSearchingCustomers = false;
        console.log('Search response:', resp);
        
        if (resp && resp.status !== false) {
          this.customerSearchResults = resp.data || [];
        } else {
          this.customerSearchResults = [];
          console.error('Search API returned error:', resp?.message);
        }
      },
      error: (error) => {
        this.isSearchingCustomers = false;
        this.customerSearchResults = [];
        console.error('Error searching customers:', error);
        this.appSettingService.showError('Error searching customers');
      }
    });
}
// Method to select a customer from dropdown
selectCustomer(customer: any): void {
  if (customer) {
    this.customerForm.get('CustomerName')?.setValue(customer.CustomerName);
    this.selectedCustomerIds.push(customer.CustomerMasterSid);
    this.showCustomerDropdown = false;
    this.customerSearchResults = [];
    
    // Generate short code when customer is selected
    // this.generateCustomerShortCode();
  }
}

// Method to hide dropdown
hideCustomerDropdown(): void {
  setTimeout(() => {
    this.showCustomerDropdown = false;
  }, 200);
}

// Method to clear search
clearCustomerSearch(): void {
  this.customerSearchResults = [];
  this.showCustomerDropdown = false;
}

  // Get logins for a specific branch
  getLogins(branchIndex: number): FormArray {
    const branch = this.branches.at(branchIndex);
    return branch ? (branch.get('logins') as FormArray) : this.fb.array([]);
  }

  addBranchFormGroup(data?: any): FormGroup {
    const dialCode = this.getFormDialCode();
    const parsedBranchPhone = this.parsePhone(data?.ContactNo ?? data?.CustBranchPhone ?? '');
    const branchPhoneCode =
      data?.CustBranchPhoneCode ||
      parsedBranchPhone.phoneCode ||
      DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData);

    const branchForm = this.fb.group({
      CustomerBranchSid: [data?.CustomerBranchSid || null],
      CustomerMasterSid: [this.CustomerMasterSid],
      CustBranchCity: [data?.CityMasterSid || '', [Validators.required]],
      CustBranchState: [data?.StateMasterSid || '', [Validators.required]],
      CustBranchName: [data?.BranchName || '', [Validators.required]],
      CustBranchType: [data?.Branch_Type || '', [Validators.required]],
       CustBranchCode: [data?.Branch_Code || ''],
      Contact_Person: [data?.Contact_Person || ''],
      CustBranchZipPostCode: [data?.Zip_PostBox || '', [Validators.maxLength(10)]],
      CustBranchPhoneCode: [dialCode],
      CustBranchPhone: [parsedBranchPhone.phoneNumber, [Validators.maxLength(15), this.phoneNumberValidator]],
      CustBranchEmail: [data?.Email || null, [ EmailValidators.multipleEmails()]],
      CustBranchAddress: [data?.Address || '', [Validators.required]],
      CustBranchRegistered: [data?.Registered || 'Y', [Validators.required]],
      CustBranchGSTtype: [data?.CustomerGstType || 'Regular'],
      CustBranchGSTIN: [data?.GSTNo || '', this.gstValidator],
      CustBranchGSTDigit13: [this.parseGST(data?.GSTNo || '', 12)],
      CustBranchGSTDigit15: [this.parseGST(data?.GSTNo || '', 14)],
      status: [{ value: this.isCustomerSuspended() ? 'Suspended' : this.toDisplayStatus(data?.status), disabled: this.isCustomerSuspended() }, Validators.required],

      // Contacts array
      contacts: this.fb.array(data?.contacts ? this.createContactsArray(data.contacts) : []),

      // Emails array
      emails: this.fb.array(data?.emails ? this.createEmailsArray(data.emails) : []),

      // Logins array
      logins: this.fb.array(data?.logins ? this.createLoginsArray(data.logins) : [])
    });
    

    // Initialize cities array for this branch
    branchForm['cities'] = data?.cities || [];
    branchForm.get('CustBranchGSTIN')?.valueChanges.subscribe((value:string)=>{
      if(value){
        branchForm.get('CustBranchGSTIN')?.setValue(this.casepipe.transform(value));
      }
    })

     branchForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
    const branchIndex = this.branches.controls.findIndex(control => control === branchForm);
    if (branchIndex !== -1) {
      this.onBranchStatusChange(branchIndex);
    }
  });

  // Initialize status if branch is suspended
  const initialStatus = branchForm.get('status')?.value;
  if (initialStatus === 'Suspended') {
    const branchIndex = this.branches.controls.findIndex(control => control === branchForm);
    if (branchIndex !== -1) {
      setTimeout(() => {
        this.updateChildRecordsStatus(branchIndex, true);
      });
    }
  }
    return branchForm;
  }

  getPANNo(){
    const pan = this.customerForm.get('PanType')?.value;
    return pan ? String(pan).toUpperCase() : ''
  }

  // Create contacts array from data
  createContactsArray(contacts: any[]): FormGroup[] {
    return contacts.map(contact => {
      const parsedMobile = this.parsePhone(contact.MobileNo || '');
      return this.fb.group({
        CusBranchContactSid: [contact.CusBranchContactSid || null],
        ContactType: [contact.ContactType || '', [Validators.required]],
        ContactName: [contact.ContactName || '', [Validators.required]],
        MobileNoCode: [
          contact.MobileNoCode ||
          parsedMobile.phoneCode ||
          this.getFormDialCode()
        ],
        MobileNo: [parsedMobile.phoneNumber, [Validators.maxLength(15), this.phoneNumberValidator]],
        Email: [contact.Email || '', [Validators.required, EmailValidators.multipleEmails()]],
        status: [contact.status === 'A' ? 'Active' : contact.status === 'S' ? 'Suspended' : 'Active']
      });
    });
  }

  debugEmailData(): void {
    console.log('=== DEBUG EMAIL DATA ===');
    for (let branchIndex = 0; branchIndex < this.branches.length; branchIndex++) {
      const emails = this.getEmails(branchIndex).value;
      console.log(`Branch ${branchIndex} emails:`, emails);

      emails.forEach((email, emailIndex) => {
        console.log(`Email ${emailIndex}:`, {
          CustomerBrEmailSid: email.CustomerBrEmailSid,
          MenuMasterSid: email.MenuMasterSid,
          DepartmentMasterSid: email.DepartmentMasterSid,
          Toemail: email.Toemail,
          CCemail: email.CCemail,
          status: email.status
        });
      });
    }
    console.log('=== END DEBUG ===');
  }
  createEmailsArray(emails: any[]): FormGroup[] {
    return emails.map(email => {
      let departmentValue = email.DepartmentMasterSid;

      console.log('Original email department data:', email.DepartmentMasterSid); // Debug

      // Ensure department value is properly formatted as an array
      if (typeof departmentValue === 'string') {
        try {
          const parsed = JSON.parse(departmentValue);
          if (parsed.departmentIds && Array.isArray(parsed.departmentIds)) {
            departmentValue = parsed.departmentIds;
          } else if (Array.isArray(parsed)) {
            departmentValue = parsed;
          }
        } catch (e) {
          if (departmentValue.includes(',')) {
            departmentValue = departmentValue.split(',').map((dept: string) => dept.trim());
          } else if (departmentValue) {
            departmentValue = [departmentValue];
          } else {
            departmentValue = [];
          }
        }
      } else if (!Array.isArray(departmentValue)) {
        departmentValue = [];
      }

      // Convert all department values to strings for consistency and remove empty values
      if (Array.isArray(departmentValue)) {
        departmentValue = departmentValue
          .map(dept => String(dept).trim())
          .filter(dept => dept !== '' && dept !== 'null' && dept !== 'undefined');
      }

      console.log('Processed department data:', departmentValue); // Debug

      return this.fb.group({
        CustomerBrEmailSid: [email.CustomerBrEmailSid || null],
        MenuMasterSid: [email.MenuMasterSid || '', [Validators.required]],
        DepartmentMasterSid: [departmentValue || [], [Validators.required]],
        Toemail: [email.Toemail || '', [Validators.required, EmailValidators.multipleEmails()]],
        CCemail: [email.CCemail || '', [EmailValidators.multipleEmails()]],
        status: [email.status === 'A' ? 'Active' : email.status === 'S' ? 'Suspended' : 'Active']
      });
    });
  }
  // Update the createLoginsArray method to include customer/branch info
  createLoginsArray(logins: any[]): FormGroup[] {
    return logins.map(login => this.fb.group({
      CustomerLoginSid: [login.CustomerLoginSid || null],
      LoginName: [login.LoginName || '', [Validators.required]],
      LoginEmail: [login.LoginEmail || '', [Validators.required, EmailValidators.singleEmail()]],
      LoginPassword: [login.LoginPassword || '', [Validators.required, Validators.maxLength(50), PasswordValidators.validate()]],
      status: [login.status === 'A' ? 'Active' : login.status === 'S' ? 'Suspended' : 'Active', Validators.required]
    }));
  }

  addNewBranch() {
  const newBranch = this.addBranchFormGroup();
  this.branches.push(newBranch);
  
  // Auto-expand the newly added branch without affecting others
  const newBranchIndex = this.branches.length - 1;
  const newBranchId = 'branch-' + newBranchIndex;
  
  // Only add the new branch to activeBranchIds, don't clear others
  if (!this.activeBranchIds.includes(newBranchId)) {
    this.activeBranchIds.push(newBranchId);
  }

  this.updateAvailableBranchesCache();
  this.cdRef.markForCheck();
}
  // Add contact to branch
  addContact(branchIndex: number) {
    const contactForm = this.fb.group({
      CusBranchContactSid: [null],
      ContactType: ['', [Validators.required]],
      ContactName: ['', [Validators.required]],
      MobileNoCode: [this.getFormDialCode()],
      MobileNo: ['', [Validators.maxLength(15), this.phoneNumberValidator]],
      Email: ['', [Validators.required, EmailValidators.multipleEmails()]],
      status: [this.isBranchSuspended(branchIndex) ? 'Suspended' : 'Active']
    });
    this.getContacts(branchIndex).push(contactForm);
    this.applyChildFormSuspendedState(contactForm, this.isBranchSuspended(branchIndex));
  }
 
  // Add email to branch
  addEmail(branchIndex: number) {
    const emailForm = this.fb.group({
      CustomerBrEmailSid: [null],
      MenuMasterSid: ['', [Validators.required]],
      DepartmentMasterSid: [[], [Validators.required]],
      Toemail: ['', [Validators.required, EmailValidators.multipleEmails()]],
      CCemail: ['', [EmailValidators.multipleEmails()]],
      status: [this.isBranchSuspended(branchIndex) ? 'Suspended' : 'Active']
    });
    this.getEmails(branchIndex).push(emailForm);
    this.applyChildFormSuspendedState(emailForm, this.isBranchSuspended(branchIndex));
  }
  // Add login to branch
  addLogin(branchIndex: number) {
    const loginForm = this.fb.group({
      CustomerLoginSid: [null],
      LoginName: ['', [Validators.required]],
      LoginEmail: ['', [Validators.required, EmailValidators.singleEmail()]],
      LoginPassword: ['', [Validators.required, Validators.maxLength(50), PasswordValidators.validate()]],
      status: [this.isBranchSuspended(branchIndex) ? 'Suspended' : 'Active', Validators.required]
    });
    this.getLogins(branchIndex).push(loginForm);
    this.applyChildFormSuspendedState(loginForm, this.isBranchSuspended(branchIndex));
  }

  // Remove branch
  removeBranch(branchIndex: number) {
  const branch = this.branches.at(branchIndex);
  const branchSid = branch.get('CustomerBranchSid')?.value;
  const branchId = 'branch-' + branchIndex;
  const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];

  if (branchSid) {
    if (confirm('Are you sure you want to delete this branch?')) {
      this.masterService.deleteCustomerBranchById(branchSid,updatedBy).subscribe({
        next: (resp: any) => {
          this.appSettingService.showSuccess('Branch deleted successfully');
          this.branches.removeAt(branchIndex);
          
          // Remove from activeBranchIds
          const index = this.activeBranchIds.indexOf(branchId);
          if (index > -1) {
            this.activeBranchIds.splice(index, 1);
          }
          
          this.updateExpandedBranchesAfterRemoval(branchIndex);
          this.updateAvailableBranchesCache();
          this.cdRef.markForCheck();
        },
        error: (error) => {
          this.appSettingService.showError('Error deleting branch');
        }
      });
    }
  } else {
    this.branches.removeAt(branchIndex);
    
    // Remove from activeBranchIds
    const index = this.activeBranchIds.indexOf(branchId);
    if (index > -1) {
      this.activeBranchIds.splice(index, 1);
    }
    
    this.updateExpandedBranchesAfterRemoval(branchIndex);
    this.updateAvailableBranchesCache();
    this.cdRef.markForCheck();
  }
}


  // Update expanded branches indices after removal
  private updateExpandedBranchesAfterRemoval(removedIndex: number) {
  const newActiveBranchIds: string[] = [];
  
  this.activeBranchIds.forEach(branchId => {
    const index = parseInt(branchId.split('-')[1]);
    if (index < removedIndex) {
      newActiveBranchIds.push(branchId);
    } else if (index > removedIndex) {
      newActiveBranchIds.push('branch-' + (index - 1));
    }
  });
  
  this.activeBranchIds = newActiveBranchIds;
}

  // Remove contact
  removeContact(branchIndex: number, contactIndex: number) {
    const contact = this.getContacts(branchIndex).at(contactIndex);
    const contactSid = contact.get('CusBranchContactSid')?.value;
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];

    if (contactSid) {
      if (confirm('Are you sure you want to delete this contact?')) {
        this.masterService.deleteCustomerBranchContactById(contactSid,updatedBy).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess('Contact deleted successfully');
            this.getContacts(branchIndex).removeAt(contactIndex);
          },
          error: (error) => {
            this.appSettingService.showError('Error deleting contact');
          }
        });
      }
    } else {
      this.getContacts(branchIndex).removeAt(contactIndex);
    }
  }

  // Remove email
  removeEmail(branchIndex: number, emailIndex: number) {
    const email = this.getEmails(branchIndex).at(emailIndex);
    const emailSid = email.get('CustomerBrEmailSid')?.value;
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];

    if (emailSid) {
      if (confirm('Are you sure you want to delete this email?')) {
        this.masterService.deleteCustomerBranchEmailById(emailSid,updatedBy).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess('Email deleted successfully');
            this.getEmails(branchIndex).removeAt(emailIndex);
          },
          error: (error) => {
            this.appSettingService.showError('Error deleting email');
          }
        });
      }
    } else {
      this.getEmails(branchIndex).removeAt(emailIndex);
    }
  }
  // Remove login
  removeLogin(branchIndex: number, loginIndex: number) {
    const login = this.getLogins(branchIndex).at(loginIndex);
    const loginSid = login.get('CustomerLoginSid')?.value;
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];

    if (loginSid) {
      if (confirm('Are you sure you want to delete this login?')) {
        this.masterService.deleteCustomerLoginById(loginSid,updatedBy).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess('Login deleted successfully');
            this.getLogins(branchIndex).removeAt(loginIndex);
          },
          error: (error) => {
            this.appSettingService.showError('Error deleting login');
          }
        });
      }
    } else {
      this.getLogins(branchIndex).removeAt(loginIndex);
    }
  }



  private getEmailDataAtIndex(index: number): any {
    let currentIndex = 0;
    for (let branchIndex = 0; branchIndex < this.branches.length; branchIndex++) {
      const emails = this.getEmails(branchIndex).value;
      for (let emailIndex = 0; emailIndex < emails.length; emailIndex++) {
        if (currentIndex === index) {
          return {
            branchIndex,
            emailIndex,
            emailData: emails[emailIndex]
          };
        }
        currentIndex++;
      }
    }
    return null;
  }
  // Mark all branches as touched for validation
  private markAllBranchesAsTouched() {
    this.branches.controls.forEach(branch => {
      branch.markAllAsTouched();
      (branch.get('contacts') as FormArray)?.controls.forEach(contact => contact.markAllAsTouched());
      (branch.get('emails') as FormArray)?.controls.forEach(email => email.markAllAsTouched());
      (branch.get('logins') as FormArray)?.controls.forEach(login => login.markAllAsTouched());
    });
  }

  // Modified loadCustomerBranch to populate form array
  // Modified loadCustomerBranch to handle state/city relationships
  loadCustomerBranch(): void {
    if (!this.CustomerMasterSid) return;

    // Use the data already loaded from getCustomerById
    if (this.customerData && this.customerData.CustomerBranch) {
      this.populateBranchFormArray(this.customerData.CustomerBranch);
      return;
    }

    // Fallback: Load customer data again if needed
    this.loadCustomerData(this.CustomerMasterSid);
  }
private populateBranchFormArray(branches: any[]): void {
  // Clear existing form array without replacing reference
  while (this.branchFormArray.length > 0) {
    this.branchFormArray.removeAt(0);
  }
   this.getStatesByCountryId();

  // Populate form array with branch data
  branches.forEach(branch => {
    const branchWithDetails = {
      ...branch,
      contacts: branch.cusBranchContact || [],
      emails: this.getBranchEmailsFromCustomerData(branch.CustomerBranchSid),
      logins: this.getBranchLoginsFromCustomerData(branch.CustomerBranchSid),
      StateMasterSid: branch.stateMaster?.StateMasterSid,
      CityMasterSid: branch.cityMaster?.CityMasterSid,
      // Ensure these fields are properly mapped
      CustBranchCode: branch.Branch_Code,
      CustBranchGSTIN: branch.GSTNo,
      status: branch.status
    };

    const branchFormGroup = this.addBranchFormGroup(branchWithDetails);
    this.branches.push(branchFormGroup);

    const currentBranchIndex = this.branches.length - 1;
    
    // Auto-expand the first branch in edit mode
    if (currentBranchIndex === 0) {
      this.activeBranchIds.push('branch-' + currentBranchIndex);
    }

    if (branch.stateMaster?.StateMasterSid) {
      this.getCitiesByStateIdForBranch(currentBranchIndex, branch.stateMaster.StateMasterSid);
    }

    // Initialize GST digits after a short delay to ensure DOM is ready
     setTimeout(() => {
      if (branch.stateMaster?.StateMasterSid) {
        this.getCitiesByStateIdForBranch(currentBranchIndex, branch.stateMaster.StateMasterSid);
        
        // Initialize GST digits after cities are loaded
        setTimeout(() => {
          if (branch.GSTNo) {
            this.initializeGSTINDigits(currentBranchIndex, branch.GSTNo);
          }
        }, 200);
      }
    }, 300);
  });

  this.totalLengthOfBranch = this.branches.length || 0;
  this.updateAvailableBranchesCache();
  this.cdRef.markForCheck();
}

  // Update the cache of available branches
  private updateAvailableBranchesCache(): void {
    this.availableBranchesCache = [];
    for (let i = 0; i < this.branchFormArray.length; i++) {
      const branch = this.branchFormArray.at(i);
      const branchName = branch.get('CustBranchName')?.value;
      const branchSid = branch.get('CustomerBranchSid')?.value;

      this.availableBranchesCache.push({
        CustomerBranchSid: branchSid || null,
        BranchName: branchName || `Branch ${i + 1}`,
        index: i
      });
    }
  }
  private getBranchEmailsFromCustomerData(branchSid: number): any[] {
    if (!this.customerData || !this.customerData.CustomerBrEmail) return [];

    return this.customerData.CustomerBrEmail.filter(email =>
      email.customerBranch?.CustomerBranchSid === branchSid
    );
  }

  // Helper method to get logins for a specific branch from customerData
  private getBranchLoginsFromCustomerData(branchSid: number): any[] {
    if (!this.customerData || !this.customerData.CustomerLogin) return [];

    return this.customerData.CustomerLogin.filter(login =>
      login.customerBranch?.CustomerBranchSid === branchSid
    );
  }
  getAllSpCustomerBranch(): void {
    if (!this.CustomerMasterSid) {
      console.warn('No CustomerMasterSid available');
      this.spBranchList = [];
      return;
    }

    this.masterService.getBranchSidsByCustomerMasterSid(this.CustomerMasterSid).subscribe({
      next: (resp: any[]) => {
        // Filter active branches for the current customer
        this.spBranchList = resp

        console.log('Sales team branches loaded:', this.spBranchList);
      },
      error: (error) => {
        console.error('Error loading customer branches:', error);
        this.spBranchList = [];
      }
    });
  }

  getStatesByCountryId(): void {
  const countryId = this.customerForm.get('CountryMasterSid')?.value;

  if (countryId) {
    this.masterService.getStateByCountryId(countryId).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.stateList = (resp.data || []).map(s => ({...s,Country : s.countryMaster?.countryName}));
          // Update tax field states when country changes
          this.updateTaxIdFieldState();
          this.updateTaxIdFieldValidation();
          this.autoSelectCurrency();
          this.cdRef.markForCheck();
        } else {
          console.error('Error fetching States with Country Id');
          this.stateList = [];
        }
      }
    );
  } else {
    this.stateList = [];
    this.updateTaxIdFieldState();
  }
}

private clearBranchStateAndCityOnCountryChange(): void {
  this.branches.controls.forEach((control, branchIndex) => {
    const branchForm = control as FormGroup;
    branchForm.patchValue({
      CustBranchState: '',
      CustBranchCity: ''
    }, { emitEvent: false });
    branchForm['cities'] = [];
    this.generateGST(branchIndex);
  });
  this.cdRef.markForCheck();
}

  getBranchCities(branchIndex: number): any[] {
    const branchForm = this.branches.at(branchIndex) as FormGroup | null;
    return branchForm?.['cities'] || [];
  }
  getCitiesByStateIdForBranch(branchIndex: number, stateId: any): void {
    const branchForm = this.branches.at(branchIndex) as FormGroup;

    if (!stateId) {
      branchForm['cities'] = [];
      branchForm.get('CustBranchCity')?.setValue('');
      this.generateGST(branchIndex);
      this.cdRef.markForCheck();
      return;
    }

    this.leadService.getCityByStateId(stateId).subscribe(
      (resp: any) => {
        if (resp.status) {
          // ✅ Store cities in the branch form
          branchForm['cities'] = (resp.data || []).map(c => ({
            ...c,
            State: c.stateMaster?.stateName,
            Country: c.countryMaster?.countryName
          }));

          // ✅ Force change detection
          this.cdRef.markForCheck();
        } else {
          console.error('Error fetching Cities with State Id');
          branchForm['cities'] = [];
        }

       
        this.generateGST(branchIndex);
        this.cdRef.markForCheck();
      },
      (error) => {
        console.error('Error loading cities:', error);
        branchForm['cities'] = [];
        this.cdRef.markForCheck();
      }
    );
  }
   async generateGST(branchIndex: number): Promise<void> {
  const branchForm = this.branches.at(branchIndex) as FormGroup;
  const stateId = branchForm.get('CustBranchState')?.value;
  
  if (!stateId) {
    branchForm.get('CustBranchGSTIN')?.setValue('');
    return;
  }

  // Ensure state list is loaded before getting GST code
  await this.ensureStateListLoaded();
  
  const stateCode = this.getStateGSTCode(stateId);
  const pan = String(this.customerForm.get('PanType')?.value).toUpperCase() || '';
  const thirteenthDigit = String(branchForm.get('CustBranchGSTDigit13')?.value || '').toUpperCase();
  const fifteenthDigit = String(branchForm.get('CustBranchGSTDigit15')?.value || '').toUpperCase();
  const fourteenthDigit = 'Z';

  branchForm.patchValue(
    {
      CustBranchGSTDigit13: thirteenthDigit,
      CustBranchGSTDigit15: fifteenthDigit
    },
    { emitEvent: false }
  );

  if (stateCode && stateCode.trim().length === 2 &&
    pan && pan.length === 10 &&
    thirteenthDigit.length === 1 &&
    fifteenthDigit.length === 1) {

    const gstin = `${stateCode.trim()}${pan}${thirteenthDigit}${fourteenthDigit}${fifteenthDigit}`;
    branchForm.get('CustBranchGSTIN')?.setValue(gstin);
  } else {
    branchForm.get('CustBranchGSTIN')?.setValue('');
  }
}
  
  getStatesForSelect(): any[] {
    if (!this.stateList || this.stateList.length === 0) {
      this.getStatesByCountryId();
    }
    return this.stateList || [];
  }

  // Handle state change for specific branch
  onStateChange(branchIndex: number, event: any): void {
    const branchForm = this.branches.at(branchIndex) as FormGroup;
    const stateId = event?.StateMasterSid ?? event;

    branchForm.get('CustBranchCity')?.setValue('');
    branchForm['cities'] = [];
    this.getCitiesByStateIdForBranch(branchIndex, stateId);
  }
  onCityChange(branchIndex: number): void {
  
  }

  // Handle branch name change for specific branch
  onBranchNameChange(branchIndex: number): void {
  
  }

  private ensureStateListLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (this.stateList && this.stateList.length > 0) {
      resolve();
    } else {
      this.getStatesByCountryId();
      // Wait for state list to load
      const checkStateList = setInterval(() => {
        if (this.stateList && this.stateList.length > 0) {
          clearInterval(checkStateList);
          resolve();
        }
      }, 100);
    }
  });
}

  getStateGSTCode(StateMasterSid: number): string {
  if (!StateMasterSid || !this.stateList || this.stateList.length === 0) {
    console.warn('State list not loaded or StateMasterSid not provided:', StateMasterSid, this.stateList);
    return '';
  }

  const stateSid = Number(StateMasterSid);
  const state = this.stateList.find(s => s.StateMasterSid === stateSid);

  if (state && state.stateGSTCode) {
    console.log(`Found state GST code: ${state.stateGSTCode} for StateMasterSid: ${stateSid}`);
    return state.stateGSTCode;
  } else {
    console.warn(`State GST code not found for StateMasterSid: ${stateSid}`, state);
    return '';
  }
}

  parseGST(gstin: string, digit: number): string {
    if (!gstin || gstin.length !== 15) return '';
    return gstin[digit];
  }
  initializeGSTINDigits(branchIndex: number, gstin: string): void {
    if (!gstin || gstin.length !== 15) return;
    const branchForm = this.branches.at(branchIndex) as FormGroup;
    branchForm.patchValue(
      {
        CustBranchGSTDigit13: gstin[12] || '',
        CustBranchGSTDigit15: gstin[14] || ''
      },
      { emitEvent: false }
    );
  }

 


  getCitiesByStateId(state) {
    // To handle when we click clear
    this.cityList = [];

    if (this.customerBranchForm.get('CustBranchCity')?.value) {
      this.customerBranchForm.get('CustBranchCity')?.reset();
      this.customerBranchForm.get('CustBranchCity').markAsTouched();
    }

    let stateId: any;

    // Handle Invalid Case
    if (!state) {
      return;
    }

    // Handle Event happened on Selecting Dropdown
    if (state instanceof Event) {
      let element = state.target as HTMLSelectElement;
      stateId = element.value;
    }
    // Used on Patching Value
    else {
      stateId = state;
    }

    this.leadService.getCityByStateId(stateId).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.cityList = resp.data;
        } else {
          console.error('Error fetching Cities with State Id');
        }
      }
    )
  }

  // Get cities for specific branch
  getCitiesForBranch(branchIndex: number, stateId?: number): void {
    const branchForm = this.branches.at(branchIndex) as FormGroup;

    if (!stateId) {
      stateId = branchForm.get('CustBranchState')?.value;
    }

    if (!stateId) {
      branchForm.get('CustBranchCity')?.setValue('');
      return;
    }

    this.leadService.getCityByStateId(stateId).subscribe(
      (resp: any) => {
        if (resp.status) {
          // Store cities for this specific branch
          branchForm['cities'] = resp.data;
          this.cdRef.markForCheck();
        } else {
          console.error('Error fetching Cities with State Id');
          branchForm['cities'] = [];
        }
      }
    );
  }
  // Track by function
  trackByIndex(index: number, item: any): number {
    return index;
  }

  // Existing methods that need to be included
  initForm() {
    this.customerForm = this.fb.group({
      CustomerName: ['', [Validators.required]],
      CustomerShortCode: [''],
      CustomerAliasName: [''],
      CustomerAddress1: ['', [Validators.required]],
      CustomerAddress2: [''],
      CountryMasterSid: ['', [Validators.required]],
      CurrencyMasterSid: [null],
      CompanyType: [''],
      PanAvailable: [false],
      PanType: [''],
      PanName: [''],
      GroupName: [''],
      Website: [''],
      paymentType: ['Credit',[Validators.required]],
      IsMSME: [''],
      KYCSpecified: [false],
      RegistrationNo: [''],
      Remarks: [''],
      CIN:[''],
      TAN:[''],
      status: [{ value: 'Active', disabled: false }, Validators.required],
      CustomerType: [{}],
      Network: [''],
      cusMilestone: this.fb.array([]),
      cusSalesteam: this.fb.array([]),
      customerEmails: this.fb.array([]), 
      customerLogins: this.fb.array([]), 
      AirlineNumber: [null,[Validators.pattern(/^[0-9]{3}$/)]],
      AirlineCode: [null]
    });
 this.setupPanValidation();
  }


  // Add the missing validation methods
  phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const phoneRegex = /^[0-9]{6,15}$/;
  const isValid = phoneRegex.test(control.value);
  return isValid ? null : { invalidPhoneNumber: true };
}

  private getFormDialCode(): string {
    return DialCodeDropdownComponent.getCurrentCountryDialCode(
      this.customerForm,
      this.countryList,
      this.userData
    );
  }

  private parsePhone(rawValue: any): { phoneCode: string; phoneNumber: string } {
    return DialCodeDropdownComponent.splitPhoneNumber(rawValue);
  }

  private withDialCode(phoneValue: any, dialCode?: string): string {
    return DialCodeDropdownComponent.buildPhoneWithDialCode(phoneValue, dialCode || this.getFormDialCode());
  }

  gstValidator(control: AbstractControl): ValidationErrors | null {
    const gstin = control.value;
    if (!gstin) return null;

    const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return GST_REGEX.test(gstin) ? null : { invalidGST: true };
  }

  panValidator = (control: AbstractControl): ValidationErrors | null => {
  const pan = control.value;
  if (!pan) return null;

  // Remove any spaces and convert to uppercase
  const cleanPan = pan.toString().replace(/\s/g, '').toUpperCase();
  
  // Basic PAN format validation - 5 letters + 4 digits + 1 letter
  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  
  if (!PAN_REGEX.test(cleanPan)) {
    return { 
      invalidPAN: true,
      message: 'PAN must be in format:(e.g., ABCDE1234F)'
    };
  }

  // Enhanced 4th character validation for holder type
  const fourthChar = cleanPan[3]; // 4th character (0-based index)
  const companyType = this.customerForm?.get('CompanyType')?.value;
  
  console.log('PAN Validation:', { pan: cleanPan, fourthChar, companyType }); // Debug log

  // Only validate holder type if Company Type is selected
  if (companyType) {
    const holderTypeValidation = this.validatePanHolderType(fourthChar, companyType);
    if (!holderTypeValidation.isValid) {
      return { 
        invalidPANHolderType: true,
        holderTypeMessage: holderTypeValidation.message
      };
    }
  }

  return null;
}
private validatePanHolderType(fourthChar: string, companyType: string): { isValid: boolean; message: string } {
  const holderTypeMap: { [key: string]: { types: string[], description: string } } = {
    'C': { 
      types: ['Company', 'Limited Liability Company(LLC)', 'Limited Liability Partnership(LLP)','Private Limited Liability(LTD)'], 
      description: 'Company' 
    },
    'P': { 
      types: ['Individual(proprietor)', 'Association Of Persons(AOP)', 'Body Of Individuals'], 
      description: 'Individual/Person' 
    },
    'H': { 
      types: ['Association Of Persons(AOP)', 'Body Of Individuals'], 
      description: 'HUF (Hindu Undivided Family)' 
    },
    'F': { 
      types: ['Firm', 'Limited Liability Partnership(LLP)'], 
      description: 'Firm/Partnership' 
    },
    'A': { 
      types: ['Association Of Persons(AOP)'], 
      description: 'Association of Persons' 
    },
    'T': { 
      types: ['Trust'], 
      description: 'Trust' 
    },
    'B': { 
      types: ['Body Of Individuals'], 
      description: 'Body of Individuals' 
    },
    'L': { 
      types: ['Local Authority'], 
      description: 'Local Authority' 
    },
    'J': { 
      types: ['Artificial Juridical Person'], 
      description: 'Artificial Juridical Person' 
    },
    'G': { 
      types: ['Government Agency'], 
      description: 'Government' 
    },
    
  };

  const holderInfo = holderTypeMap[fourthChar];
  
  if (!holderInfo) {
    const validChars = Object.keys(holderTypeMap).join(', ');
    return { 
      isValid: false, 
      message: `Invalid 4th character '${fourthChar}'. Must be one of: ${validChars}` 
    };
  }

  // Validate against selected company type
  if (!holderInfo.types.includes(companyType)) {
    const expectedChars = Object.entries(holderTypeMap)
      .filter(([char, info]) => info.types.includes(companyType))
      .map(([char, info]) => `${char} (${info.description})`)
      .join(' or ');
    
    return { 
      isValid: false, 
      message: `Company Type , 4th character should be same  ` 
    };
  }

  return { isValid: true, message: '' };
}
  vatValidator(control: AbstractControl): ValidationErrors | null {
    const vat = control.value;
    if (!vat) return null;

    const VAT_REGEX = /^[1-9][0-9]{14}$/;
    return VAT_REGEX.test(vat) ? null : { invalidVAT: true };
  }

  // Add other existing methods that are referenced in the template
  updateCustomerType(): void {
    const result: any = {};
    this.modeOfCustomerType.forEach((type) => {
      const key = this.toCamelCase(type.name);
      result[key] = this.selectedStatus.includes(type.name)
        ? 'isTrue'
        : 'isFalse';
    });
    this.customerForm
      .get('CustomerType')
      ?.setValue(result, { emitEvent: false });
  }

  handleSelectedStatus(event: any[]) {
  this.selectedStatus = [...event];
  const allCustomerFields = ['Shipper', 'Consignee', 'Forwarder', 'Notify'];
  allCustomerFields.forEach(field => {
    if (this.selectedStatus.includes(field) && !this.selectedStatus.includes('Customer')) {
      this.selectedStatus.push('Customer');
    }
  })
  
  // Fix: Properly detect if 'Air Line' is selected
  this.isAirlineSelected = this.selectedStatus.includes('Air Line');
  
  // Debug log to check the status
  console.log('Selected statuses:', this.selectedStatus);
  console.log('Is airline selected:', this.isAirlineSelected);
  this.selectedStatusChanges.next();
  this.updateCustomerType();
}
  toCamelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^./, (c) => c.toLowerCase());
  }

  isCustomerFormValid(): boolean {
    return this.customerForm.valid;
  }

  isIndianCountry(): boolean {
  const countryId = this.customerForm.get('CountryMasterSid')?.value;
  if (!countryId) return false;
  const country = this.dropdownStore.countries()?.find(c => c.CountryMasterSid == countryId);
  return country?.countryName?.toLowerCase().includes('india') || false;
}
shouldShowPanAvailable(): boolean {
  return this.isIndianCountry();
}

  isUaeCountry(): boolean {
    const countryId = this.customerForm.get('CountryMasterSid')?.value;
    if (!countryId) return false;
    const country = this.dropdownStore.countries()?.find(c => c.CountryMasterSid == countryId);
    const countryName = country?.countryName?.toLowerCase() || '';
    return countryName.includes('uae') ||
      countryName.includes('dubai') ||
      countryName.includes('united arab emirates');
  }

  getTaxIdErrorMessage(): string {
  const errors = this.customerForm.get('PanType')?.errors;
  if (!errors) return '';
  
  if (errors['invalidPAN']) return 'Invalid PAN format. Format: AAAAA9999A (5 letters + 4 digits + 1 letter)';
  if (errors['invalidPANHolderType']) return errors['holderTypeMessage'];
  if (errors['invalidVAT']) return 'Invalid VAT format. Should be 15 digits starting with 1-9';
  if (errors['required']) return 'Required';
  return 'Invalid format';
}

getExpectedPanFourthChars(companyType: string): string[] {
  const holderTypeMap: { [key: string]: string[] } = {
    'Company': ['C'],
    'Limited Liability Company(LLC)': ['C'],
    'Limited Liability Partnership(LLP)': ['C', 'F'],
    'Firm': ['F'],
    'Individual(proprietor)': ['P'],
    'Association Of Persons(AOP)': ['P', 'H', 'A'],
    'Body Of Individuals': ['P', 'H', 'B'],
    'Artificial Juridical Person': ['J'],
    'Government Agency': ['G'],
    'Local Authority': ['L'],
    'Trust': ['T']
  };

  return holderTypeMap[companyType] || [];
}
getPanBreakdown(pan: string): any {
  if (!pan || pan.length !== 10) return null;
  
  return {
    firstThree: pan.substring(0, 3),
    fourthChar: pan[3],
    fifthChar: pan[4],
    digits: pan.substring(5, 9),
    lastChar: pan[9]
  };
}


  updateTaxIdFieldValidation(): void {
  const panTypeControl = this.customerForm.get('PanType');
  const countryId = this.customerForm.get('CountryMasterSid')?.value;

  if (countryId) {
    const country = this.dropdownStore.countries()?.find(c => c.CountryMasterSid == countryId);
    const countryName = country?.countryName || '';

    panTypeControl?.clearValidators();

    if (countryName.toLowerCase().includes('india')) {
      panTypeControl?.setValidators([Validators.required, this.panValidator]);
      this.currentTaxIdLabel = 'PAN Number';
    }
    else if (this.isUaeCountry()) {
      panTypeControl?.setValidators([Validators.required, this.vatValidator]);
      this.currentTaxIdLabel = 'VAT Number';
    }
    else {
      panTypeControl?.setValidators([]);
      this.currentTaxIdLabel = 'Tax Identification Number';
    }

    panTypeControl?.updateValueAndValidity();
  }
}


  updateTaxIdLabel(): void {
  const countryId = this.customerForm.get('CountryMasterSid')?.value;
  
  if (countryId) {
    const country = this.dropdownStore.countries()?.find(c => c.CountryMasterSid == countryId);
    const countryName = country?.countryName || '';

    if (countryName.toLowerCase().includes('india')) {
      this.currentTaxIdLabel = 'PAN Number';
    }
    else if (countryName.toLowerCase().includes('uae') ||
      countryName.toLowerCase().includes('dubai') ||
      countryName.toLowerCase().includes('united arab emirates')) {
      this.currentTaxIdLabel = 'VAT Number';
    }
    else {
      this.currentTaxIdLabel = 'Tax Identification Number';
    }
  } else {
    this.currentTaxIdLabel = 'PAN/VAT Number';
  }
}

  isPanRequiredForCompanyType(): boolean {
  const companyType = this.customerForm.get('CompanyType')?.value;
  const isIndia = this.isIndianCountry();
  
  if (!isIndia) return false;
  
  // List of company types that require PAN in India
  const panRequiredTypes = [
    'Company',
    'Limited Liability Company(LLC)',
    'Limited Liability Partnership(LLP)',
    'Firm',
    'Association Of Persons(AOP)',
    'Body Of Individuals',
    'Artificial Juridical Person',
    'Government Agency',
    'Local Authority',
    'Individual'
  ];
  
  return panRequiredTypes.includes(companyType);
}

getTaxIdLabel(): string {
  if (this.isIndianCountry()) {
    return 'PAN';
  } else if (this.isUaeCountry()) {
    return 'VAT';
  } else {
    return 'Tax ID';
  }
}
  updateTaxIdFieldState(): void {
  const panAvailableControl = this.customerForm.get('PanAvailable');
  const panTypeControl = this.customerForm.get('PanType');
  const panNameControl = this.customerForm.get('PanName');

  const panAvailable = panAvailableControl?.value;

  if (panAvailable) {
    // Enable common fields for all countries
    panTypeControl?.enable();
    panNameControl?.enable();
    
    
  }else {
    // Disable all fields when checkbox is unchecked
    panTypeControl?.disable();
    panNameControl?.disable();
    
    // Clear values
    panTypeControl?.setValue('');
    panNameControl?.setValue('');
  }

  // Update validation states
  panTypeControl?.updateValueAndValidity();
  panNameControl?.updateValueAndValidity();
}

// onCountryChange(): void {
//   this.updateTaxIdLabel();
//   this.updateTaxIdFieldValidation();
//   this.updateTaxIdFieldState();
// }


  initializePanFields(): void {
    const panAvailable = this.customerForm.get('PanAvailable')?.value;
    const panTypeControl = this.customerForm.get('PanType');
    const panNameControl = this.customerForm.get('PanName');

    if (panAvailable) {
      panTypeControl?.enable();
      panNameControl?.enable();
    } else {
      // panTypeControl?.disable();
      // panNameControl?.disable();
    }
  }
  // Add other existing methods that are referenced
  // getAllCountries() {
  //   this.masterService.getAllCountry().subscribe((res) => {
  //     this.countryList = res.data;
  //   });
  // }
onCompanyTypeChange(): void {
  this.updateTaxIdFieldState();
  this.updateTaxIdFieldValidation();
  
  // Also update PAN validation when company type changes
  const panTypeControl = this.customerForm.get('PanType');
  if (panTypeControl?.value &&  this.customerForm.get('PanAvilable')?.value) {
    panTypeControl.updateValueAndValidity();
  }
}
  loadMenus() {
    this.settingsService.getAllMenu().subscribe(
      (menus) => {
        this.menuList = menus;
      },
      (error) => {
        console.error('Error loading menus:', error);
      }
    );
  }

  // loadDepartments() {
  //   const companyMastersID = this.currentCompany?.CompanyMasterSid;
  //   this.masterService.getAllDepartments(companyMastersID).subscribe((res) => {
  //     this.departmentList = res;
  //   });
  // }

  // Helper method to get user email safely
  private getUserEmail(): string {
    const email = this.userData?.userEmail || this.userData?.UserEmail || this.userData?.email;
    if (!email) {
      console.error('Unable to get user email from userData:', this.userData);
    }
    return email || '';
  }

  async loadCustomerNameConfig(): Promise<void> {
    try {
      if (!this.currentCompany?.CompanyMasterSid) {
        console.warn('No company ID available for customer name config');
        return;
      }

      const response: any = await firstValueFrom(
        this.masterService.getAllCompanyConfigsByCompanyId(this.currentCompany.CompanyMasterSid)
      );
      const configs = response?.data ?? response ?? [];
      this.customerNameConfig = Array.isArray(configs)
        ? configs.find((c: any) => c.ConfigurationName === 'CustomerNameUpdateUsers')
        : null;
    } catch (error) {
      console.error('Error loading customer name configuration:', error);
      this.customerNameConfig = null;
      this.canEditCustomerName = false;
    } finally {
      this.checkCustomerNamePermissions();
    }
  }

  checkCustomerNamePermissions(): void {
    const customerNameControl = this.customerForm?.get('CustomerName');
    if (!customerNameControl) return;

    // Keep create mode unchanged.
    if (!this.isEditMode) {
      this.canEditCustomerName = true;
      customerNameControl.enable({ emitEvent: false });
      return;
    }

    if (!this.customerNameConfig || !this.currentUserEmail) {
      this.canEditCustomerName = false;
      customerNameControl.disable({ emitEvent: false });
      return;
    }

    const configValue = this.customerNameConfig.ConfigurationValue;
    if (!configValue || typeof configValue !== 'string') {
      this.canEditCustomerName = false;
      customerNameControl.disable({ emitEvent: false });
      return;
    }

    const allowedEmails = configValue
      .split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0);

    this.canEditCustomerName = allowedEmails.includes(this.currentUserEmail.trim());
    if (this.canEditCustomerName) {
      customerNameControl.enable({ emitEvent: false });
    } else {
      customerNameControl.disable({ emitEvent: false });
    }
  }


  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc','Authority', 'Email' , 'Document Reference'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  // Fetch customer data and patch the form
  
loadCustomerData(customerId: number) {
  const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  const payload = {
    CompanyMasterSid: CompanyMasterSid,
    CustomerMasterSid: customerId
  }
  this.masterService.getCustomerById(payload).subscribe(
    (customerData: any) => {
       if (!customerData || Object.keys(customerData).length === 0) {
    this.appSettingService.showError('Access denied.');
    return;
  }
      this.customerData = customerData;
      this.customerName = customerData.CustomerName;
      this.status = customerData.status;
      
      // Convert backend status ('A', 'S') to frontend display values
      const formattedStatus = customerData.status === 'A' ? 'Active' : 'Suspended';
      
      const customerType = this.normalizeCustomerTypeValue(customerData.CustomerType);
      const hasPanOrVat = customerData.PanType || customerData.PanName;
      const panAvailable = hasPanOrVat ? true : false;
      // Patch main customer form
      this.customerForm.patchValue({
        ...customerData,
        CountryMasterSid: customerData.countryMaster?.CountryMasterSid,
        CurrencyMasterSid: customerData.CurrencyMasterSid,
        status: formattedStatus,
        paymentType: customerData.CashCredit,
        KYCSpecified: customerData.RegistrationNo || customerData.CompanyType ? true : false,
        PanAvailable: panAvailable,
        PanType: customerData.PanType || '',
        CustomerType: customerType,
        AirlineNumber: customerData.AirlineNumber || null,
        AirlineCode: customerData.AirlineCode || null,
        PanName: customerData.PanName || ''
      },{ emitEvent: false });
      this.lastCountryMasterSid = customerData.countryMaster?.CountryMasterSid;

       if (this.isEditMode) {
        this.customerForm.get('CountryMasterSid')?.disable();
        this.customerForm.get('CurrencyMasterSid')?.disable();
        this.checkCustomerNamePermissions();
      }
      this.autoSelectCurrency();
      this.updateTaxIdLabel();

      // Handle customer types
      this.selectedStatus = this.modeOfCustomerType
        .filter(type => {
          const key = this.toCamelCase(type.name);
          return customerType[key] === 'isTrue';
        })
        .map(type => type.name);

       // FIX: Set isAirlineSelected based on loaded data
       this.isAirlineSelected = this.selectedStatus.includes('Air Line');
       this.updateAirlineFieldValidation();
       
       // Load all data from the single API response
       this.loadAllCustomerDataFromResponse(customerData);
      setTimeout(() => this.resetUnsavedState(), 0);
    },
    (error) => {
      this.appSettingService.showError('Error loading customer data.');
    }
  );
}

private normalizeCustomerTypeValue(customerType: any): Record<string, string> {
  if (!customerType) {
    return {};
  }

  if (typeof customerType === 'object' && !Array.isArray(customerType)) {
    return customerType;
  }

  if (typeof customerType === 'string') {
    const trimmedValue = customerType.trim();

    if (!trimmedValue) {
      return {};
    }

    try {
      const parsedValue = JSON.parse(trimmedValue);
      if (parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)) {
        return parsedValue;
      }
    } catch {
      const normalizedCustomerTypes: Record<string, string> = {};
      trimmedValue
        .split(',')
        .map((type: string) => type.trim())
        .filter((type: string) => !!type)
        .forEach((type: string) => {
          normalizedCustomerTypes[this.toCamelCase(type)] = 'isTrue';
        });

      return normalizedCustomerTypes;
    }
  }

  return {};
}
  private loadAllCustomerDataFromResponse(customerData: any): void {
    // 1. Load branches (with contacts, emails, logins)
    if (customerData.CustomerBranch) {
      this.populateBranchFormArray(customerData.CustomerBranch);
    }

    // 2. Load sales team
    if (customerData.CustomerSalesTeam) {
      console.log(customerData.CustomerSalesTeam,'customerData.CustomerSalesTeam')
      this.loadSalesTeamFromResponse(customerData.CustomerSalesTeam);
    }

    // 3. Load milestones
    if (customerData.CustomerMilestone) {
      this.loadMilestonesFromResponse(customerData.CustomerMilestone);
    }

    // 4. Load other data
    this.getAllSpCustomerBranch();
    this.loadMenus();
    this.getStatesByCountryId();

    // 5. Load emails data
    this.loadCustomerEmailsData();

    // 6. Load logins data
    this.loadCustomerLoginsData();
  }

  private loadSalesTeamFromResponse(salesTeamData: any[]): void {
    this.selectedCustomerBranch = salesTeamData.flatMap(st => {
      if (st.customerBranch) {
        return [{
          customerBranchSid: st.customerBranch.CustomerBranchSid,
          BranchName: st.customerBranch.BranchName
        }];
      }
      return [];
    });

    console.log('Selected branches:', this.selectedCustomerBranch);

    this.cusSalesteam.clear();
    salesTeamData.forEach(salesteam => {
      this.cusSalesteam.push(this.createSalesTeamFormGroup(salesteam));
    });
    this.updateSalesTeamPagination();
    this.cdRef.markForCheck();
  }
  // Load milestones from customer data
  private loadMilestonesFromResponse(milestoneData: any[]): void {
    this.cusMilestoneList = milestoneData || [];

    // Clear and rebuild the form array
    this.cusMilestone.clear();

    this.cusMilestoneList.forEach(milestone => {
      const formWithData = this.createCusMilestoneFormGrp(milestone);
      this.cusMilestone.push(formWithData);
    });

    this.updateCustomerMilestonePagination();
    this.cdRef.markForCheck();
  }

 
  // Customer Milestone Related Codes
  loadCustomerMilestones() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;

    console.log('Loading milestones with:', { CompanyMasterSid, BranchMasterSid, CustomerMasterSid: this.CustomerMasterSid });

    // Always load milestones first, don't check if milestoneListArr is empty
    this.masterService.getAllMilestones(CompanyMasterSid, BranchMasterSid).subscribe(
      (resp: any) => {
        console.log('Milestones API response:', resp);
        if (resp.status) {
          this.milestoneListArr = resp.data || [];
          console.log('Milestones loaded successfully:', this.milestoneListArr.length, 'items');

          // Now load customer-specific milestones
          // this.loadCustomerMilestoneData();
        } else {
          console.error('Error loading milestones:', resp.message);
          this.appSettingService.showError('Error loading Milestones: ' + (resp.message || 'Unknown error'));
          this.milestoneListArr = [];
        }
      },
      (error) => {
        console.error('Error in milestones API call:', error);
        this.appSettingService.showError('Error loading Milestones');
        this.milestoneListArr = [];
      }
    );
  }
 
  loadAllSpfields() {
    const companyMastersID = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      departments: this.masterService.getAllDepartments(companyMastersID),
      salesman: this.masterService.getAllSalesmans(companyMastersID),
      docs: this.masterService.getAllDoc(companyMastersID),
      cs: this.masterService.getAllCS(companyMastersID),
      currency: this.masterService.getAllCurrencies()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      ({ departments, salesman, docs, cs, currency}) => {
        this.spDepartmentList = departments || [];
        this.departmentList = departments || []; // Also populate departmentList for email tab
        this.salesPersonList = salesman || [];
        this.allCS = cs?.data || [];
        this.allDocs = docs?.data || [];
        const rawCurrencies: any[] = Array.isArray(currency)
        ? currency
        : currency?.data || [];
      this.currencyList = rawCurrencies.map((c: any) => ({
        ...c,
        countryName: c?.countryMaster?.countryName || ''
      }));

        // Populate departmentListForSelect once to avoid getter re-computation
        this.departmentListForSelect = this.spDepartmentList.map(dept => ({
          ...dept,
          DepartmentMasterSid: dept.DepartmentMasterSid.toString()
        }));

        // Ensure dropdowns are populated with proper data structure
        if (this.salesPersonList.length > 0) {
          console.log('Sales person list loaded:', this.salesPersonList.length, 'items');
        }

        // Only trigger change detection once after all data is loaded
        this.cdRef.markForCheck();
      },
      (error) => {
        console.error('Error loading dropdown data:', error);
        this.appSettingService.showError('Error loading dropdown data');
        // Initialize with empty arrays to prevent errors
        this.spDepartmentList = [];
        this.departmentList = [];
        this.departmentListForSelect = [];
        this.salesPersonList = [];
        this.allCS = [];
        this.allDocs = [];
        this.cdRef.markForCheck();
      }
    );
  }

  // Load customer sales team data
  // Replace the existing loadCustomerSalesTeamData method with this:
loadCustomerSalesTeamData() {
  if (!this.CustomerMasterSid) return;

  this.masterService.getCustomerSalesTeam(this.CustomerMasterSid)
    .pipe(takeUntil(this.destroy$))
    .subscribe(
      (resp: any) => {
        if (resp.status && resp.data) {
          // Clear existing sales team form array
          while (this.cusSalesteam.length > 0) {
            this.cusSalesteam.removeAt(0);
          }

          // Handle both array and object responses
          const salesTeamData = Array.isArray(resp.data) ? resp.data : [resp.data];
          
          // Add sales team data to form array
          salesTeamData.forEach((salesTeam: any) => {
            this.cusSalesteam.push(this.createSalesTeamFormGroup(salesTeam));
          });

          this.updateSalesTeamPagination();
          this.cdRef.markForCheck();
        }
      },
      (error) => {
        console.error('Error loading sales team data:', error);
        this.appSettingService.showWarning('Could not load sales team data');
      }
    );
}


  // Add the remaining methods that are referenced in the template
  get cusMilestone(): FormArray {
    return this.customerForm.get('cusMilestone') as FormArray;
  }

  get cusSalesteam(): FormArray {
    return this.customerForm.get('cusSalesteam') as FormArray;
  }

  get customerEmails(): FormArray {
    return this.customerForm.get('customerEmails') as FormArray;
  }

  get customerLogins(): FormArray {
    return this.customerForm.get('customerLogins') as FormArray;
  }

  updateCustomerMilestonePagination() {
    const totalItems = this.cusMilestone.length;
    this.totalCusMilePages = Math.ceil(totalItems / this.cusMilePageSize);

    const startIndex = (this.cusMilePage - 1) * this.cusMilePageSize;
    const endIndex = startIndex + this.cusMilePageSize;

    this.slicedCusMilestoneList = this.cusMilestone.controls.slice(startIndex, endIndex);
    this.cdRef.markForCheck(); // Force update
  }
  createCusMilestoneFormGrp(data?: any) {
    const formGroup = this.fb.group({
      CustomerMilestoneSid: [data?.CustomerMilestoneSid || null],
      CustomerBranchSid: [data?.customerBranch?.CustomerBranchSid || data?.CustomerBranchSid || null],
      MilestoneMasterSid: [data?.MilestoneMasterSid || null, [Validators.required]],
      UpdateType: [data?.UpdateType || null, [Validators.required]],
      ContactInfo: [data?.ContactInfo || '', [Validators.required]],
      EffectiveFrom: [data ? new Date(data?.EffectiveFrom) : null],
      Status: [data ? (data?.Status === "A" ? "Active" : "Suspended") : 'Active']
    });
    return formGroup;
  }


  onPageChange(page: number) {
    this.cusMilePage = page;
    this.updateCustomerMilestonePagination();
  }


  onAddMilestone() {
    const newGrp = this.createCusMilestoneFormGrp();
    this.cusMilestone.push(newGrp);
    this.updateCustomerMilestonePagination();

    // Ensure branches cache is populated
    if (this.availableBranchesCache.length === 0 && this.branchFormArray && this.branchFormArray.length > 0) {
      this.updateAvailableBranchesCache();
    }

    this.cdRef.markForCheck();
  }
  
  findSalesmanName(id: number) {
    if (!this.salesPersonList) {
      return;
    }
    const user = this.salesPersonList.find(person => person.UserMasterSid === id);
    if (user) {
      return user.userName;
    }
    return ''
  }

  deleteSalesman(CustomerSalesSid: number) {
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
    this.masterService.deleteSalesteamById(CustomerSalesSid,updatedBy).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Salesman Deleted Successfully')
          // this.loadCustomerSalesTeam();
        } else {
          this.appSettingService.showError('Error Deleting Salesman');
        }
      },
      (error) => {
        console.error('Error Deleting Salesman', error);
      }
    )
  }

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  deleteCustomerMilestone(CustomerMilestoneSid: number, index: number) {
    const actualIndex = this.getActualIndex(index);
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
    if (CustomerMilestoneSid) {
      this.masterService.deleteCustomerMilestoneById(CustomerMilestoneSid,updatedBy).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Customer Milestone Deleted Successfully.')
            this.cusMilestone.removeAt(actualIndex);
            this.updateCustomerMilestonePagination();
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          console.error('Error Deleting Milestone', error);
        }
      )
    } else {
      this.cusMilestone.removeAt(actualIndex);
      this.updateCustomerMilestonePagination();
      this.appSettingService.showSuccess('Customer Milestone Deleted Successfully.')
    }
  }

  getActualIndex(pageIndex: number): number {
    return (this.cusMilePage - 1) * this.cusMilePageSize + pageIndex;
  }
  updateSalesTeamPagination() {
    const startIndex = (this.salesTeamPage - 1) * this.salesTeamPageSize;
    const endIndex = startIndex + this.salesTeamPageSize;
    this.slicedSalesTeamList = this.cusSalesteam.controls.slice(startIndex, endIndex);
  }
  createSalesTeamFormGroup(data?: any): FormGroup {
    console.log(data,'createSalesTeamFormGroup')
    // Extract the actual user IDs from the nested structure
    const salesmanId = data?.Salesman || data?.salesManUser?.UserMasterSid || null;
    const csPersonId = data?.CSPerson || data?.CSPersonUser?.UserMasterSid || null;
    const docPersonId = data?.DocPerson || data?.DocPersonUser?.UserMasterSid || null;
    const branchSid = data?.customerBranch?.CustomerBranchSid || data?.CustomerBranchSid || null

    // ✅ Departments - always normalize to string[]
    let departmentIds: string[] = [];
    if (data?.Departments && Array.isArray(data.Departments)) {
      departmentIds = data.Departments.map((dept: any) => dept.DepartmentMasterSid.toString());
    } else if (data?.DepartmentMasterSid) {
      if (Array.isArray(data.DepartmentMasterSid)) {
        departmentIds = data.DepartmentMasterSid.map((id: any) => id.toString());
      } else if (typeof data.DepartmentMasterSid === 'string') {
        departmentIds = data.DepartmentMasterSid.split(',').map(id => id.trim());
      }
    }

  

    return this.fb.group({
      CustomerSalesSid: [data?.CustomerSalesSid || null],
      DepartmentMasterSid: [departmentIds, [Validators.required]],  // 👈 Only IDs
      Salesman: [salesmanId, [Validators.required]],
      CSPerson: [csPersonId],
      DocPerson: [docPersonId],
      branchSid : [branchSid],
      EffectiveFrom: [data?.EffectiveFrom ? new Date(data.EffectiveFrom) : new Date()],
      status: [data ? (data.status === 'A' ? 'Active' : 'Suspended') : 'Active'],
    });
  }

  getDepartmentNames(departmentIds: string[]): string {
    if (!departmentIds || !this.spDepartmentList) return '';

    const names = departmentIds.map(id => {
      const dept = this.spDepartmentList.find(d =>
        d.DepartmentMasterSid.toString() === id.toString()
      );
      return dept ? dept.departmentName : '';
    }).filter(name => name !== '');

    return names.join(', ');
  }

  getDepartmentOptions(): any[] {
    if (!this.spDepartmentList) return [];
    return this.spDepartmentList.map(dept => ({
      id: dept.DepartmentMasterSid.toString(),
      name: dept.departmentName,
      code: dept.departmentCode
    }));
  }

  onAddSalesTeam() {
    this.cusSalesteam.push(this.createSalesTeamFormGroup());
    this.updateSalesTeamPagination();

    // Use setTimeout to prevent blocking the UI thread
    setTimeout(() => {
      this.cdRef.markForCheck();
    }, 0);
  }

 
  // Email tab methods
  onAddCustomerEmail() {
    const newEmail = this.fb.group({
      CustomerBrEmailSid: [null],
      CustomerBranchSid: ['', [Validators.required]], // Branch dropdown
      MenuMasterSid: ['', [Validators.required]],
      DepartmentMasterSid: [[], [Validators.required]],
      Toemail: ['', [Validators.required, EmailValidators.multipleEmails()]],
      CCemail: ['', [EmailValidators.multipleEmails()]],
      status: ['Active']
    });

    this.customerEmails.push(newEmail);
    this.cdRef.markForCheck();
  }

  removeCustomerEmail(index: number) {
    const email = this.customerEmails.at(index);
    const emailSid = email.get('CustomerBrEmailSid')?.value;
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];

    if (emailSid) {
      if (confirm('Are you sure you want to delete this email?')) {
        this.masterService.deleteCustomerBranchEmailById(emailSid,updatedBy).subscribe({
          next: (resp: any) => {
            if (resp.status) {
              this.customerEmails.removeAt(index);
              this.appSettingService.showSuccess('Email deleted successfully');
              this.cdRef.markForCheck();
            } else {
              this.appSettingService.showError('Failed to delete email');
            }
          },
          error: (error) => {
            console.error('Error deleting email:', error);
            this.appSettingService.showError('Error deleting email');
          }
        });
      }
    } else {
      this.customerEmails.removeAt(index);
      this.cdRef.markForCheck();
    }
  }

  // Get available branches for dropdown
  getAvailableBranches(): any[] {
    // If cache is empty, update it
    if (this.availableBranchesCache.length === 0 && this.branchFormArray && this.branchFormArray.length > 0) {
      this.updateAvailableBranchesCache();
    }

    return this.availableBranchesCache;
  }

  // Load customer emails data
  loadCustomerEmailsData() {
    if (!this.customerData || !this.customerData.CustomerBrEmail) return;

    // Clear existing emails
    while (this.customerEmails.length > 0) {
      this.customerEmails.removeAt(0);
    }

    // Ensure branches cache is populated
    if (this.availableBranchesCache.length === 0 && this.branchFormArray && this.branchFormArray.length > 0) {
      this.updateAvailableBranchesCache();
    }

    // Add emails from all branches
    this.customerData.CustomerBrEmail.forEach((email: any) => {
      const emailForm = this.fb.group({
        CustomerBrEmailSid: [email.CustomerBrEmailSid || null],
        CustomerBranchSid: [email.customerBranch?.CustomerBranchSid || '', [Validators.required]],
        MenuMasterSid: [email.MenuMasterSid || '', [Validators.required]],
        DepartmentMasterSid: [email.DepartmentMasterSid || [], [Validators.required]],
        Toemail: [email.Toemail || '', [Validators.required, EmailValidators.multipleEmails()]],
        CCemail: [email.CCemail || '', [EmailValidators.multipleEmails()]],
        status: [email.status === 'A' ? 'Active' : email.status === 'S' ? 'Suspended' : 'Active']
      });

      this.customerEmails.push(emailForm);
    });

    this.cdRef.markForCheck();
  }

  // eLogin tab methods
  onAddCustomerLogin() {
    const newLogin = this.fb.group({
      CustomerLoginSid: [null],
      CustomerBranchSid: ['', [Validators.required]], // Branch dropdown
      LoginName: ['', [Validators.required]],
      LoginEmail: ['', [Validators.required, EmailValidators.singleEmail()]],
      LoginPassword: ['', [Validators.required, Validators.maxLength(50), PasswordValidators.validate()]],
      status: ['Active', Validators.required]
    });

    this.customerLogins.push(newLogin);
    this.cdRef.markForCheck();
  }

  removeCustomerLogin(index: number) {
    const login = this.customerLogins.at(index);
    const loginSid = login.get('CustomerLoginSid')?.value;
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];

    if (loginSid) {
      if (confirm('Are you sure you want to delete this login?')) {
        this.masterService.deleteCustomerLoginById(loginSid,updatedBy).subscribe({
          next: (resp: any) => {
            if (resp.status) {
              this.customerLogins.removeAt(index);
              this.appSettingService.showSuccess('Login deleted successfully');
              this.cdRef.markForCheck();
            } else {
              this.appSettingService.showError('Failed to delete login');
            }
          },
          error: (error) => {
            console.error('Error deleting login:', error);
            this.appSettingService.showError('Error deleting login');
          }
        });
      }
    } else {
      this.customerLogins.removeAt(index);
      this.cdRef.markForCheck();
    }
  }

  togglePasswordVisibility(indexOrId: number | string) {
    let passwordField: HTMLInputElement | null;
    let eyeIcon: HTMLElement | null;

    if (typeof indexOrId === 'string') {
      // Handle string ID (from branch logins)
      passwordField = document.getElementById(indexOrId) as HTMLInputElement;
      eyeIcon = null; // Branch logins don't have eye icons
    } else {
      // Handle number index (from eLogin tab)
      passwordField = document.querySelector(
        `#loginPassword${indexOrId}`
      ) as HTMLInputElement;
      eyeIcon = document.querySelector(`#eyeIcon${indexOrId}`) as HTMLElement;
    }

    if (passwordField) {
      if (passwordField.type === 'password') {
        passwordField.type = 'text';
        if (eyeIcon) eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        passwordField.type = 'password';
        if (eyeIcon) eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    }
  }

  // Load customer logins data
  loadCustomerLoginsData() {
    if (!this.customerData || !this.customerData.CustomerLogin) return;

    // Clear existing logins
    while (this.customerLogins.length > 0) {
      this.customerLogins.removeAt(0);
    }

    // Ensure branches cache is populated
    if (this.availableBranchesCache.length === 0 && this.branchFormArray && this.branchFormArray.length > 0) {
      this.updateAvailableBranchesCache();
    }

    // Add logins from all branches
    this.customerData.CustomerLogin.forEach((login: any) => {
      const loginForm = this.fb.group({
        CustomerLoginSid: [login.CustomerLoginSid || null],
        CustomerBranchSid: [login.customerBranch?.CustomerBranchSid || '', [Validators.required]],
        LoginName: [login.LoginName || '', [Validators.required]],
        LoginEmail: [login.LoginEmail || '', [Validators.required, EmailValidators.singleEmail()]],
        LoginPassword: [login.LoginPassword || '', [Validators.required, Validators.maxLength(50), PasswordValidators.validate()]],
        status: [login.status === 'A' ? 'Active' : login.status === 'S' ? 'Suspended' : 'Active', Validators.required]
      });

      this.customerLogins.push(loginForm);
    });

    this.cdRef.markForCheck();
  }
onPanAvailableChange(): void {
  this.updateTaxIdFieldState();
  this.updatePanTypeValidation();
  this.cdRef.markForCheck();
}
shouldShowCompanyType(): boolean {
  return this.isIndianCountry() && this.customerForm.get('PanAvailable')?.value;
}
getTaxIdName(): string {
  if (this.isIndianCountry()) return 'PAN';
  if (this.isUaeCountry()) return 'VAT';
  return 'Tax ID';
}

  deleteSalesTeam(customerSalesSid: number, index: number) {
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
    const actualIndex = this.getActualSalesTeamIndex(index);
    if (customerSalesSid) {
      this.masterService.deleteSalesteamById(customerSalesSid,updatedBy).subscribe((resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Sales Team Deleted Successfully.');
          this.cusSalesteam.removeAt(actualIndex);
          this.updateSalesTeamPagination();
        } else {
          this.appSettingService.showError(resp.message || 'Error deleting sales team.');
        }
      });
    } else {
      this.cusSalesteam.removeAt(actualIndex);
      this.updateSalesTeamPagination();
      this.appSettingService.showSuccess('Sales Team row removed.');
    }
  }


  getActualSalesTeamIndex(pageIndex: number): number {
    return (this.salesTeamPage - 1) * this.salesTeamPageSize + pageIndex;
  }

  // Add other template-referenced methods
  // Add this method to your OrganizationEntryComponent class
  // Replace your existing onSubmit method with this comprehensive version
 async onSubmit(): Promise<boolean> {
    if (this.isSaving) return false;
    this.customerForm.markAllAsTouched();
  
  // Check if the form is valid
  if (!this.customerForm.valid) {
    // Get the first invalid field and show its error
    const invalidField = this.getFirstInvalidField();
    if (invalidField) {
      this.appSettingService.showError(`Please fill in the required field: ${invalidField}`);
    } else {
      this.appSettingService.showError('Please fill all required fields');
    }
    this.btnDisable = false;
    return false;
  }
  const validation = this.validateAllForms();
  if (!validation.isValid) {
    this.appSettingService.showError(validation.errorMessage);
    return false;
  }

  if (this.isEditMode && this.deepEqual(this.buildUnsavedSnapshot(), this.initialFormValue) && !this.isDirty) {
    this.appSettingService.showWarning('No changes to save');
    this.customerForm.markAsUntouched();
    return false;
  }
  
  this.btnDisable = true;
  this.isSaving = true;

  try {
    if (this.isEditMode && this.CustomerMasterSid) {
      // SINGLE PAYLOAD - Everything included
      const updatePayload = this.prepareUpdatePayload();
      await this.updateCustomerWithAllData(updatePayload);
      if (this.hasCustomerNameChanged()) {
        this.appSettingService.showWarning('The updated customer name will be reflected in new records only.');
      }
    } else {
      // Create new customer
      const createPayload = this.prepareCreatePayload();
      await this.createCustomerWithAllData(createPayload);
    }
    this.resetUnsavedState();
    return true;
  } catch (error) {
    console.error('Error saving customer:', error);
    return false;
  } finally {
    this.isSaving = false;
    this.btnDisable = false;
  }
}

private hasCustomerNameChanged(): boolean {
  const currentName = (this.customerForm.getRawValue()?.CustomerName || '').toString().trim();
  const originalName = (this.customerName || '').toString().trim();
  return !!currentName && currentName !== originalName;
}
// Helper method to get the first invalid field
private getFirstInvalidField(): string {
  const formControls = this.customerForm.controls;
  
  for (const key in formControls) {
    if (formControls[key].invalid) {
      // Map field names to user-friendly labels
      const fieldMap: { [key: string]: string } = {
        'CustomerName': 'Customer Name',
        'CustomerAddress1': 'Address1',
        'CountryMasterSid': 'Country',
        'CurrencyMasterSid': 'Currency',
        'CustomerAddress2': 'Address2',
        'PanType': this.isUaeCountry() ? 'VAT Number' : 'PAN Number',
      };
      
      return fieldMap[key] || key;
    }
  }
  
  return '';
}

  // Add this missing validation method
  private validateAllBranches(): { isValid: boolean; message: string } {
    const customerStatus = this.customerForm.get('status')?.getRawValue();
    const activeBranchCount = this.branches.controls
      .filter(branch => this.isActiveStatus((branch as FormGroup).get('status')?.getRawValue()))
      .length;

    if (this.isActiveStatus(customerStatus) && activeBranchCount === 0) {
      return {
        isValid: false,
        message: 'Customer is Active. At least one branch must be Active.'
      };
    }

    if (this.isSuspendedStatus(customerStatus) && activeBranchCount > 0) {
      return {
        isValid: false,
        message: 'Customer is Suspended. All branches must be Suspended.'
      };
    }

    if (this.branches.invalid) {
      // this.markAllBranchesAsTouched();
      return { isValid: false, message: 'Please fill all required fields in the Branches section.' };
    }

    // Validate each branch's nested entities
    for (let i = 0; i < this.branches.length; i++) {
      const branchForm = this.branches.at(i);

      // Validate contacts
      const contacts = this.getContacts(i);
      if (contacts.invalid) {
        contacts.markAllAsTouched();
        return { isValid: false, message: `Please fill all required fields in contacts for branch ${i + 1}.` };
      }

      // Validate each contact
      for (let j = 0; j < contacts.length; j++) {
        const contactForm = contacts.at(j) as FormGroup;
        if (contactForm.invalid) {
          contactForm.markAllAsTouched();
          return { isValid: false, message: `Please fill all required contact fields in branch ${i + 1}.` };
        }
      }

      // Validate emails
      const emails = this.getEmails(i);
      if (emails.invalid) {
        emails.markAllAsTouched();
        return { isValid: false, message: `Please fill all required fields in emails for branch ${i + 1}.` };
      }

      // Validate each email
      for (let j = 0; j < emails.length; j++) {
        const emailForm = emails.at(j) as FormGroup;
        if (emailForm.invalid) {
          emailForm.markAllAsTouched();
          return { isValid: false, message: `Please fill all required email fields in branch ${i + 1}.` };
        }
      }

      // Validate logins
      const logins = this.getLogins(i);
      if (logins.invalid) {
        logins.markAllAsTouched();
        return { isValid: false, message: `Please fill all required fields in logins for branch ${i + 1}.` };
      }

      // Validate each login
      for (let j = 0; j < logins.length; j++) {
        const loginForm = logins.at(j) as FormGroup;
        if (loginForm.invalid) {
          loginForm.markAllAsTouched();
          return { isValid: false, message: `Please fill all required login fields in branch ${i + 1}.` };
        }
      }
    }

    return { isValid: true, message: '' };
  }

  // Validate sales team
  private validateSalesTeam(): { isValid: boolean; message: string } {
    if (this.cusSalesteam.invalid) {
      this.cusSalesteam.markAllAsTouched();
      return { isValid: false, message: 'Please fill all required fields in the Sales Team section.' };
    }
    return { isValid: true, message: '' };
  }

  // Validate milestones
  private validateMilestones(): { isValid: boolean; message: string } {
    if (this.cusMilestone.invalid) {
      this.cusMilestone.controls.forEach((group: FormGroup) => {
        group.markAllAsTouched();
      });
      return { isValid: false, message: 'Please fill all required fields in the Milestones section.' };
    }
    return { isValid: true, message: '' };
  }

  // Prepare main customer payload (same as before)
  // For CREATE mode - only customer and branches
  private prepareCreatePayload(): any {
    const formValue = this.customerForm.getRawValue();
    const currentUserEmail = this.getUserEmail();
    const activeCompanyId = this.currentCompany?.CompanyMasterSid;

    const statusValue = formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S';

    return {
      customer: {
        CompanyMasterSid: activeCompanyId,
        CustomerName: formValue.CustomerName,
        CustomerShortCode: formValue.CustomerShortCode,
        CustomerAliasName: formValue.CustomerAliasName,
        CustomerAddress1: formValue.CustomerAddress1,
        CustomerAddress2: formValue.CustomerAddress2,
        CountryMasterSid: Number(formValue.CountryMasterSid),
        CurrencyMasterSid: formValue.CurrencyMasterSid,
        CustomerType: formValue.CustomerType,
        PanName: formValue.PanName,
        PanType: formValue.PanType,
        GroupName: formValue.GroupName,
        Website: formValue.Website,
        CashCredit: formValue.paymentType,
        Network: formValue.Network,
        Remarks: formValue.Remarks,
        TAN: formValue.TAN,
        CIN: formValue.CIN,
        IsMSME: formValue.IsMSME ? 'A' : 'I',
        RegistrationNo: formValue.RegistrationNo,
        CompanyType: formValue.CompanyType,
        status: statusValue,
        AirlineNumber: formValue.AirlineNumber,
        AirlineCode: formValue.AirlineCode
      },
      customerBranches: this.prepareCreateBranchesPayload()
    };
  }

  private prepareCreateBranchesPayload(): any[] {
    const branchesPayload = [];

    for (let branchIndex = 0; branchIndex < this.branches.length; branchIndex++) {
      const branchForm = this.branches.at(branchIndex);
      const branchData = branchForm.getRawValue();
      const activeCompanyId = this.currentCompany?.CompanyMasterSid;
      const branchPayload = {
        CompanyMasterSid: activeCompanyId,
        BranchName: branchData.CustBranchName?.trim(),
        StateMasterSid: branchData.CustBranchState,
        CityMasterSid: branchData.CustBranchCity,
        Branch_Type: branchData.CustBranchType,
        Branch_Code: branchData.CustBranchCode,
        Contact_Person: branchData.Contact_Person,
        Zip_PostBox: String(branchData.CustBranchZipPostCode),
        ContactNo: this.withDialCode(branchData.CustBranchPhone, branchData.CustBranchPhoneCode),
        Email: branchData.CustBranchEmail,
        Address: branchData.CustBranchAddress,
        Registered: branchData.CustBranchRegistered,
        CustomerGstType: branchData.CustBranchGSTtype,
        ...(branchData.CustBranchGSTIN && { GSTNo: branchData.CustBranchGSTIN }), // Only include if GST number exists
        status: branchData.status === 'Active' ? 'A' : 'S',

        // Include nested entities for create
        customerBranchContacts: this.prepareCreateContactsPayload(branchIndex),
      };

      branchesPayload.push(branchPayload);
    }

    return branchesPayload;
  }

  private prepareCreateContactsPayload(branchIndex: number): any[] {
    const contactsPayload = [];
    const contacts = this.getContacts(branchIndex);

    for (let contactIndex = 0; contactIndex < contacts.length; contactIndex++) {
      const contactForm = contacts.at(contactIndex);
      const contactData = contactForm.getRawValue();

      contactsPayload.push({
        ContactType: contactData.ContactType,
        ContactName: contactData.ContactName?.trim(),
        MobileNo: this.withDialCode(contactData.MobileNo, contactData.MobileNoCode),
        Email: contactData.Email,
        status: contactData.status === 'Active' ? 'A' : 'S'
      });
    }

    return contactsPayload;
  }

  private prepareCreateEmailsPayload(branchIndex: number): any[] {
    const emailsPayload = [];

    // Note: For creating new customers, branch SIDs won't exist yet
    // So we need to match by branch index instead of CustomerBranchSid
    // This assumes emails are added after branches are created in the UI

    // For now, return empty array for new customer creation
    // Emails will need to be added after the customer and branches are created

    return emailsPayload;
  }

  private prepareCreateLoginsPayload(branchIndex: number): any[] {
    const loginsPayload = [];
    const logins = this.getLogins(branchIndex);

    for (let loginIndex = 0; loginIndex < logins.length; loginIndex++) {
      const loginForm = logins.at(loginIndex);
      const loginData = loginForm.getRawValue();

      loginsPayload.push({
        LoginName: loginData.LoginName?.trim(),
        LoginEmail: loginData.LoginEmail,
        LoginPassword: loginData.LoginPassword,
        status: loginData.status === 'Active' ? 'A' : 'S'
      });
    }

    return loginsPayload;
  }
  // For UPDATE mode - send all data including sales teams and milestones
 private prepareUpdatePayload(): any {
  const formValue = this.customerForm.getRawValue();
  const activeCompanyId = this.currentCompany?.CompanyMasterSid;
  const statusValue = formValue.status === 'Active' ? 'A' : 'S';

  const payload = {
    customer: {
      CompanyMasterSid: activeCompanyId,
      CustomerName: formValue.CustomerName?.trim(),
      CustomerShortCode: formValue.CustomerShortCode?.trim(),
      CustomerAliasName: formValue.CustomerAliasName,
      CustomerAddress1: formValue.CustomerAddress1,
      CustomerAddress2: formValue.CustomerAddress2,
      CountryMasterSid: formValue.CountryMasterSid,
      CurrencyMasterSid: formValue.CurrencyMasterSid,
      CustomerType: formValue.CustomerType,
      PanName: formValue.PanName,
      PanType: formValue.PanType,
      GroupName: formValue.GroupName,
      Website: formValue.Website,
      CashCredit: formValue.paymentType,
      Network: formValue.Network,
      Remarks: formValue.Remarks,
      TAN: formValue.TAN,
      CIN: formValue.CIN,
      IsMSME: formValue.IsMSME ? 'A' : 'I',
      RegistrationNo: formValue.RegistrationNo,
      CompanyType: formValue.CompanyType,
      status: statusValue,
      AirlineNumber: formValue.AirlineNumber,
      AirlineCode: formValue.AirlineCode
    },
    customerBranches: this.prepareUpdateBranchesPayload(),
  };

    console.log('Update payload status:', {
    frontendStatus: formValue.status,
    backendStatus: statusValue,
    payloadStatus: payload.customer.status
  });
  return payload;
}

  private prepareUpdateBranchesPayload(): any[] {
  const branchesPayload = [];

  for (let branchIndex = 0; branchIndex < this.branches.length; branchIndex++) {
    const branchForm = this.branches.at(branchIndex);
    const branchData = branchForm.getRawValue();
    const branchSid = branchData.CustomerBranchSid;
     const branchStatus = branchData.status === 'Active' ? 'A' : 'S';
     console.log(`Branch ${branchIndex} status mapping:`, {
      branchName: branchData.CustBranchName,
      frontendStatus: branchData.status,
      backendStatus: branchStatus,
      branchSid: branchSid
    });
    const branchPayload: any = {
      CustomerBranchSid: branchSid,
      BranchName: branchData.CustBranchName?.trim(),
      StateMasterSid: branchData.CustBranchState,
      CityMasterSid: branchData.CustBranchCity,
      Branch_Type: branchData.CustBranchType,
      Branch_Code: branchData.CustBranchCode,
      Contact_Person: branchData.Contact_Person,
      Zip_PostBox: String(branchData.CustBranchZipPostCode),
      ContactNo: this.withDialCode(branchData.CustBranchPhone, branchData.CustBranchPhoneCode),
      Email: branchData.CustBranchEmail,
      Address: branchData.CustBranchAddress,
      Registered: branchData.CustBranchRegistered,
      CustomerGstType: branchData.CustBranchGSTtype,
      GSTNo: branchData.CustBranchGSTIN || '',
      status: branchStatus,

      // ALL RELATED DATA INCLUDED
      customerBranchContacts: this.prepareUpdateContactsPayload(branchIndex),
      customerBranchEmails: this.prepareUpdateEmailsPayload(branchIndex),
      customerBranchLogins: this.prepareUpdateLoginsPayload(branchIndex),
      customerSalesTeams: this.prepareSalesTeamsForBranch(branchSid), 
      customerMilestones: this.prepareMilestonesForBranch(branchSid) 
    };

    branchesPayload.push(branchPayload);
  }

  return branchesPayload;
}

  // ✅ ADD THESE METHODS FOR UPDATE OPERATION
  private prepareUpdateContactsPayload(branchIndex: number): any[] {
    const contactsPayload = [];
    const contacts = this.getContacts(branchIndex);
    const userEmail = this.getUserEmail();

    console.log(`Preparing contacts for branch ${branchIndex}, user email:`, userEmail);

    for (let contactIndex = 0; contactIndex < contacts.length; contactIndex++) {
      const contactForm = contacts.at(contactIndex);
      const contactData = contactForm.getRawValue();
       const contactStatus = contactData.status === 'Active' ? 'A' : 'S';
      const contactPayload: any = {
        ContactType: contactData.ContactType,
        ContactName: contactData.ContactName?.trim(),
        MobileNo: this.withDialCode(contactData.MobileNo, contactData.MobileNoCode),
        Email: contactData.Email,
        status: contactStatus
      };

      // createdBy/updatedBy now handled automatically by backend via JWT token
      if (contactData.CusBranchContactSid) {
        contactPayload.CusBranchContactSid = contactData.CusBranchContactSid;
      }

      contactsPayload.push(contactPayload);
    }

    console.log(`Branch ${branchIndex} contacts payload:`, contactsPayload);
    return contactsPayload;
  }
  private prepareSalesTeamsForBranch(branchSid: number): any[] {
  const salesTeamsForBranch = [];
  
  for (let teamIndex = 0; teamIndex < this.cusSalesteam.length; teamIndex++) {
    const teamForm = this.cusSalesteam.at(teamIndex);
    const teamData = teamForm.getRawValue();

    // Only include sales teams that belong to this branch
    if (teamData.branchSid !== branchSid) {
      continue;
    }

    const salesTeamPayload: any = {
      DepartmentMasterSid: Array.isArray(teamData.DepartmentMasterSid)
        ? teamData.DepartmentMasterSid.map((id: any) => String(id))
        : teamData.DepartmentMasterSid
          ? [String(teamData.DepartmentMasterSid)]
          : [],
      Salesman: teamData.Salesman,
      CSPerson: teamData.CSPerson,
      DocPerson: teamData.DocPerson,
      EffectiveFrom: teamData.EffectiveFrom,
      status: teamData.status === 'Active' ? 'A' : 'S',
      CompanyMasterSid: Number(this.currentCompany?.CompanyMasterSid),
      CustomerBranchSid: Number(teamData.branchSid)
    };

    if (teamData.CustomerSalesSid) {
      salesTeamPayload.CustomerSalesSid = teamData.CustomerSalesSid;
    }

    salesTeamsForBranch.push(salesTeamPayload);
  }

  return salesTeamsForBranch;
}

private prepareMilestonesForBranch(branchSid: number): any[] {
  const milestonesForBranch = [];
  
  for (let mileIndex = 0; mileIndex < this.cusMilestone.length; mileIndex++) {
    const mileForm = this.cusMilestone.at(mileIndex);
    const mileData = mileForm.getRawValue();

    // Only include milestones that belong to this branch
    if (mileData.CustomerBranchSid !== branchSid) {
      continue;
    }

    const milestonePayload: any = {
      MilestoneMasterSid: mileData.MilestoneMasterSid,
      UpdateType: mileData.UpdateType,
      ContactInfo: mileData.ContactInfo,
      EffectiveFrom: mileData.EffectiveFrom,
      Status: mileData.Status === 'Active' ? 'A' : 'S'
    };

    if (mileData.CustomerMilestoneSid) {
      milestonePayload.CustomerMilestoneSid = mileData.CustomerMilestoneSid;
    }

    milestonesForBranch.push(milestonePayload);
  }

  return milestonesForBranch;
}
  
  private prepareUpdateEmailsPayload(branchIndex: number): any[] {
  const emailsPayload = [];
  const addedEmailSids = new Set<any>();
  const branch = this.branches.at(branchIndex);
  const branchSid = branch.get('CustomerBranchSid')?.value;

  // Prefer the Email tab values because users edit status there.
  for (let i = 0; i < this.customerEmails.length; i++) {
    const emailForm = this.customerEmails.at(i);
   const emailData = emailForm.getRawValue();;

    if (!this.idsEqual(emailData.CustomerBranchSid, branchSid)) {
      continue;
    }

    if (emailData.CustomerBrEmailSid) {
      addedEmailSids.add(emailData.CustomerBrEmailSid);
    }

    emailsPayload.push(this.buildBranchEmailPayload(emailData));
  }

  const nestedEmails = this.getEmails(branchIndex);
  for (let i = 0; i < nestedEmails.length; i++) {
    const emailData = nestedEmails.at(i).getRawValue();

    if (emailData.CustomerBrEmailSid && addedEmailSids.has(emailData.CustomerBrEmailSid)) {
      continue;
    }

    emailsPayload.push(this.buildBranchEmailPayload(emailData));
  }

  return emailsPayload;
}

private buildBranchEmailPayload(emailData: any): any {
  let departmentValue = emailData.DepartmentMasterSid;
  if (!Array.isArray(departmentValue)) {
    departmentValue = departmentValue ? [departmentValue] : [];
  }

  const emailPayload: any = {
    MenuMasterSid: Number(emailData.MenuMasterSid),
    DepartmentMasterSid: departmentValue,
    Toemail: emailData.Toemail,
    CCemail: emailData.CCemail,
    status: this.isActiveStatus(emailData.status) ? 'A' : 'S'
  };

  if (emailData.CustomerBrEmailSid) {
    emailPayload.CustomerBrEmailSid = emailData.CustomerBrEmailSid;
  }

  return emailPayload;
}

  private prepareUpdateLoginsPayload(branchIndex: number): any[] {
  const loginsPayload = [];
  const addedLoginSids = new Set<any>();
  const branch = this.branches.at(branchIndex);
  const branchSid = branch.get('CustomerBranchSid')?.value;

  // Prefer the eLogin tab values because users edit status there.
  for (let i = 0; i < this.customerLogins.length; i++) {
    const loginForm = this.customerLogins.at(i);
    const loginData = loginForm.getRawValue();

    if (!this.idsEqual(loginData.CustomerBranchSid, branchSid)) {
      continue;
    }

    if (loginData.CustomerLoginSid) {
      addedLoginSids.add(loginData.CustomerLoginSid);
    }

    loginsPayload.push(this.buildBranchLoginPayload(loginData));
  }

  const nestedLogins = this.getLogins(branchIndex);
  for (let i = 0; i < nestedLogins.length; i++) {
    const loginData = nestedLogins.at(i).getRawValue();

    if (loginData.CustomerLoginSid && addedLoginSids.has(loginData.CustomerLoginSid)) {
      continue;
    }

    loginsPayload.push(this.buildBranchLoginPayload(loginData));
  }

  return loginsPayload;
}

private buildBranchLoginPayload(loginData: any): any {
  const loginPayload: any = {
    LoginName: loginData.LoginName?.trim(),
    LoginEmail: loginData.LoginEmail,
    LoginPassword: loginData.LoginPassword,
    status: this.isActiveStatus(loginData.status) ? 'A' : 'S'
  };

  if (loginData.CustomerLoginSid) {
    loginPayload.CustomerLoginSid = loginData.CustomerLoginSid;
  }

  return loginPayload;
}
  private prepareUpdateSalesTeamsPayload(branchSid?: number): any[] {
  if (this.cusSalesteam.length === 0) return [];
  
  const activeCompanyId = this.currentCompany?.CompanyMasterSid;
  const salesTeamsPayload = [];

  for (let teamIndex = 0; teamIndex < this.cusSalesteam.length; teamIndex++) {
    const teamForm = this.cusSalesteam.at(teamIndex);
    const teamData = teamForm.getRawValue();

    // Filter by branch if branchSid is provided
    if (branchSid && teamData.branchSid !== branchSid) {
      continue;
    }

    const salesTeamPayload: any = {
      DepartmentMasterSid: Array.isArray(teamData.DepartmentMasterSid)
        ? teamData.DepartmentMasterSid.map((id: any) => String(id))
        : teamData.DepartmentMasterSid
          ? [String(teamData.DepartmentMasterSid)]
          : [],
      Salesman: teamData.Salesman,
      CSPerson: teamData.CSPerson,
      DocPerson: teamData.DocPerson,
      EffectiveFrom: teamData.EffectiveFrom,
      status: teamData.status === 'Active' ? 'A' : 'S',
      CompanyMasterSid: Number(activeCompanyId),
      CustomerBranchSid: teamData.branchSid ? Number(teamData.branchSid) : null
    };

    if (teamData.CustomerSalesSid) {
      salesTeamPayload.CustomerSalesSid = teamData.CustomerSalesSid;
    }

    salesTeamsPayload.push(salesTeamPayload);
  }

  return salesTeamsPayload;
}
  private prepareUpdateMilestonesPayload(branchSid?: number): any[] {
  if (this.cusMilestone.length === 0) return [];

  const milestonesPayload = [];

  for (let mileIndex = 0; mileIndex < this.cusMilestone.length; mileIndex++) {
    const mileForm = this.cusMilestone.at(mileIndex);
    const mileData = mileForm.getRawValue();

    // Filter by branch if branchSid is provided
    if (branchSid && mileData.CustomerBranchSid !== branchSid) {
      continue;
    }

    const milestonePayload: any = {
      MilestoneMasterSid: mileData.MilestoneMasterSid,
      UpdateType: mileData.UpdateType,
      ContactInfo: mileData.ContactInfo,
      EffectiveFrom: mileData.EffectiveFrom,
      Status: mileData.Status === 'Active' ? 'A' : 'S'
    };

    if (mileData.CustomerMilestoneSid) {
      milestonePayload.CustomerMilestoneSid = mileData.CustomerMilestoneSid;
    }

    milestonesPayload.push(milestonePayload);
  }

  return milestonesPayload;
}
  // Create customer with all data (same as before)
  private async createCustomerWithAllData(payload: any): Promise<void> {
  console.log('Create payload:', JSON.stringify(payload, null, 2));
  
  return new Promise((resolve, reject) => {
    this.masterService.createCustomer(payload).subscribe({
      next: (resp: any) => {
        console.log('API Response:', resp);
        
        if (resp.status) {
          this.CustomerMasterSid = resp.data.CustomerMasterSid;
          this.isCustomerSaved = true;
          this.showAdditionalTabs = true;
          this.resetUnsavedState();
          
          this.appSettingService.showSuccess('Customer created successfully');
          this.router.navigate([`master/organization/entry/${this.CustomerMasterSid}`]);
          resolve();
        } else {
          // Show the actual error message from API
          const errorMsg = resp.message || 'Error creating customer';
          console.error('API Error:', errorMsg);
          this.appSettingService.showError(errorMsg);
          reject(errorMsg);
        }
      },
      error: (error) => {
        console.error('HTTP Error:', error);
        const errorMsg = this.extractApiErrorMessage(error, 'Error creating customer');
        this.appSettingService.showError(errorMsg);
        reject(error);
      }
    });
  });
}
  shouldShowTab(tabName: string): boolean {
  if (tabName === 'Party' || tabName === 'Branch') {
    return true; // Always show Party and Branch tabs
  }
  
  // For other tabs, only show if customer is saved (either new customer saved or editing existing)
  return this.isEditMode || this.showAdditionalTabs;
}
  // Update customer with all data
 private async updateCustomerWithAllData(payload: any): Promise<void> {
  return new Promise((resolve, reject) => {
    // SINGLE API CALL - Everything is handled in one call
    this.masterService.updateCustomerById(this.CustomerMasterSid, payload).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.resetUnsavedState();
          this.appSettingService.showSuccess('Customer updated successfully');
          
          // Reload all data to reflect changes
          this.loadCustomerData(this.CustomerMasterSid);
          resolve();
        } else {
          this.appSettingService.showError(resp.message);
          reject(resp.message);
        }
      },
      error: (error) => {
        console.error('Error updating customer:', error);
        const errorMsg = this.extractApiErrorMessage(error, 'Error updating customer');
        this.appSettingService.showError(errorMsg);
        reject(error);
      }
    });
  });
}

private extractApiErrorMessage(error: any, fallbackMessage: string): string {
  if (typeof error?.error?.message === 'string' && error.error.message.trim()) {
    return error.error.message.trim();
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error?.error === 'string' && error.error.trim()) {
    return error.error.trim();
  }

  return fallbackMessage;
}



  reset() {
    // If editing an existing customer, reload it (restore original state)
    if (this.isEditMode && this.CustomerMasterSid) {
      this.loadCustomerData(this.CustomerMasterSid);
      return;
    }

    // Create-mode: reset customer form to sensible defaults
    this.customerForm.reset({
      CustomerName: '',
      CustomerShortCode: '',
      CustomerAliasName: '',
      CustomerAddress1: '',
      CustomerAddress2: '',
      CountryMasterSid: '',
      CurrencyMasterSid: '',
      CompanyType: { value: '', disabled: true },
      PanAvailable: false,
      PanType: { value: '', disabled: true },
      PanName: { value: '', disabled: true },
      GroupName: '',
      Website: '',
      paymentType: '',
      AirlineNumber: '',
      AirlineCode: '',
      IsMSME: '',
      KYCSpecified: false,
      RegistrationNo: { value: '', disabled: true },
      Remarks: '',
      TAN:'',
      CIN:'',
      status: { value: 'Active', disabled: true },
      CustomerType: {},
      Network: ''
    });
     if (!this.isEditMode) {
    this.customerForm.get('status')?.disable();
     this.customerForm.get('CountryMasterSid')?.enable();
    this.customerForm.get('CurrencyMasterSid')?.enable();
    this.customerForm.get('CustomerName')?.enable();
  }

    // Reset selected statuses and customer types
    this.selectedStatus = [];
    this.displayedCustomerTypes = [];
    this.extraCustomerTypesCount = 0;

    // Reset form validation state
    this.customerForm.markAsUntouched();
    this.customerForm.markAsPristine();

    // Enable/disable fields based on initial conditions
    // this.updateShortCodeFieldState();

    // Reset customer name reference
    this.customerName = '';
  }

  goBack() {
   this.router.navigate(['master/organization/list']);
  }

  openAuditLogs() {
      if (!this.customerData?.CustomerMasterSid) return;
      const modalRef = this.modalService.open(AuditLogComponent, {
        centered: true,
        scrollable: true,
        size: 'xl',
        windowClass: 'audit-log-modal'
      });
      modalRef.componentInstance.title = 'Organization Logs';
      modalRef.componentInstance.tableName = 'CustomerMaster';
      modalRef.componentInstance.recordId = this.customerData?.CustomerMasterSid.toString();
      modalRef.componentInstance.screenName = 'Organization';
    }


  showCustomerInfo() {
    if (!this.customerData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.customerData;
    modalRef.componentInstance.idLabel = 'Customer Id';
    modalRef.componentInstance.idValue = this.customerData?.CustomerMasterSid;
  }

  openEDoc() {
    if (!this.customerData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.customerData;
    modalRef.componentInstance.idLabel = 'Customer Id';
    modalRef.componentInstance.idValue = this.customerData?.CustomerMasterSid;
     const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.CustomerMasterSid
  }

      this.commonService.documentData.set(data)
  }

  openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.CustomerMasterSid;
  }


  // openTandC() {
  //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //   const payload = { MenuMasterSid: this.currentMenuId };
  //   this.masterService.getTandCByCondition(payload).subscribe(
  //     (resp: any) => {
  //       if (resp.status) {
  //         this.TandCList = resp.data;
  //         const modalRef = this.modalService.open(TermsAndConditionsComponent, {
  //           size: 'lg',
  //           backdrop: 'static',
  //           centered: true
  //         });
  //         modalRef.componentInstance.terms = this.TandCList;
  //         modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //         modalRef.componentInstance.DocumentSid = this.CustomerMasterSid;

  //       } else {
  //         this.appSettingService.showError('Error loading Terms and Conditions');
  //       }
  //     },
  //     (error) => {
  //       this.appSettingService.showError('Error loading Terms and Conditions', error);
  //     }
  //   );
  // }

  openAuthority() {
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.CustomerMasterSid;
  }

  openEmail() {
    if (!this.customerData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.customerData;
    modalRef.componentInstance.idLabel = 'Customer Id';
    modalRef.componentInstance.idValue = this.customerData?.CustomerMasterSid;
  }


  getCityName(citySid: number): string {
    if (!this.cityList) return '';
    const city = this.cityList.find((c) => c.CityMasterSid === citySid);
    return city ? city.cityName : '';
  }
private setupPanValidation(): void {
  const panAvailableControl = this.customerForm.get('PanAvailable');
  const panTypeControl = this.customerForm.get('PanType');
  const panNameControl = this.customerForm.get('PanName');

  // Listen to PanAvailable changes
  panAvailableControl?.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe((panAvailable: boolean) => {
      if (panAvailable) {
        // Enable appropriate fields based on country
        this.updateTaxIdFieldState();
        this.updatePanTypeValidation();
      } else {
        // Remove validators when unchecked
        panTypeControl?.clearValidators();
        panNameControl?.clearValidators();
        
        // Clear values
        panTypeControl?.setValue('');
        panNameControl?.setValue('');
        
        // Disable fields
        panTypeControl?.disable();
        panNameControl?.disable();
      }
      
      // Update validation states
      panTypeControl?.updateValueAndValidity();
      panNameControl?.updateValueAndValidity();
    });

  // Update validation when country changes
  this.customerForm.get('CountryMasterSid')?.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      if (panAvailableControl?.value) {
        this.updateTaxIdFieldState();
        this.updatePanTypeValidation();
      }
    });
}

private updatePanTypeValidation(): void {
  const panTypeControl = this.customerForm.get('PanType');
  const panNameControl = this.customerForm.get('PanName');

  // Clear existing validators
  panTypeControl?.clearValidators();
  panNameControl?.clearValidators();

  // Set appropriate validators based on country
  if (this.isIndianCountry()) {
    // For India - PAN validation with Company Type
    panTypeControl?.setValidators([Validators.required, this.panValidator]);
    panNameControl?.setValidators([]);
  } else if (this.isUaeCountry()) {
    // For UAE - VAT validation without Company Type
    panTypeControl?.setValidators([Validators.required, this.vatValidator]);
    panNameControl?.setValidators([]);
  } else {
    // For other countries - Basic Tax ID validation
    panTypeControl?.setValidators([Validators.required]);
    panNameControl?.setValidators([]);
  }

  // Update validation states
  panTypeControl?.updateValueAndValidity();
  panNameControl?.updateValueAndValidity();
}


 private showCompanyTypeAlert(): void {
  this.appSettingService.showWarning('Please select Company Type before entering PAN details.');
}
setupAirlineValidation(): void {
  // Watch for changes in selected customer types
  this.customerForm.get('CustomerType')?.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.updateAirlineFieldValidation();
    });

  // Also watch for direct changes to selectedStatus
  this.selectedStatusChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.updateAirlineFieldValidation();
    });
}
updateAirlineFieldValidation(): void {
  const airlineNumberControl = this.customerForm.get('AirlineNumber');
  const airlineCodeControl = this.customerForm.get('AirlineCode');
  
  const isAirlineSelected = this.selectedStatus.includes('Air Line');
  
  if (isAirlineSelected) {
    // Make fields mandatory when Air Line is selected
    airlineNumberControl?.setValidators([Validators.required, Validators.maxLength(3), Validators.pattern(/^[0-9]{1,3}$/)]);
    airlineCodeControl?.setValidators([Validators.required, Validators.maxLength(10)]);
  } else {
    // Remove required validation when Air Line is not selected
    airlineNumberControl?.setValidators([Validators.maxLength(3), Validators.pattern(/^[0-9]{1,3}$/)]);
    airlineCodeControl?.setValidators([Validators.maxLength(10)]);
    
    // Clear the values when Air Line is deselected
    airlineNumberControl?.setValue('');
    airlineCodeControl?.setValue('');
  }
  
  // Update validation state
  airlineNumberControl?.updateValueAndValidity();
  airlineCodeControl?.updateValueAndValidity();
}

  ngOnDestroy(): void {
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }

  private toDisplayStatus(status: any): 'Active' | 'Suspended' {
    const normalizedStatus = (status || '').toString().trim().toLowerCase();
    return normalizedStatus === 's' || normalizedStatus === 'suspended' ? 'Suspended' : 'Active';
  }

  private isSuspendedStatus(status: any): boolean {
    return this.toDisplayStatus(status) === 'Suspended';
  }

  private isActiveStatus(status: any): boolean {
    return this.toDisplayStatus(status) === 'Active';
  }

  private idsEqual(left: any, right: any): boolean {
    if (left === null || left === undefined || right === null || right === undefined) {
      return left === right;
    }
    return String(left) === String(right);
  }

  private isCustomerSuspended(): boolean {
    return this.isSuspendedStatus(this.customerForm?.get('status')?.getRawValue());
  }

  private isBranchSuspended(branchIndex: number): boolean {
    const branchForm = this.branches.at(branchIndex) as FormGroup | null;
    return this.isSuspendedStatus(branchForm?.get('status')?.getRawValue());
  }

  private clearTemporaryStatusMemory(): void {
    this.temporarilySuspendedBranches.clear();
    this.temporarilySuspendedChildRecords.clear();
  }

  private onCustomerStatusChange(status: any): void {
    const isSuspended = this.isSuspendedStatus(status);

    this.branches.controls.forEach((branchControl, branchIndex) => {
      const branchForm = branchControl as FormGroup;
      const branchStatusControl = branchForm.get('status');

      if (isSuspended) {
        if (!this.temporarilySuspendedBranches.has(branchForm)) {
          this.temporarilySuspendedBranches.set(branchForm, this.toDisplayStatus(branchStatusControl?.getRawValue()));
        }
        branchStatusControl?.setValue('Suspended', { emitEvent: false });
        branchStatusControl?.disable({ emitEvent: false });
        this.updateChildRecordsStatus(branchIndex, true);
      } else {
        branchStatusControl?.enable({ emitEvent: false });
        if (this.temporarilySuspendedBranches.get(branchForm) === 'Active') {
          branchStatusControl?.setValue('Active', { emitEvent: false });
          this.updateChildRecordsStatus(branchIndex, false);
          this.temporarilySuspendedBranches.delete(branchForm);
        }
      }
    });

    this.cdRef.markForCheck();
  }

  onBranchStatusChange(branchIndex: number): void {
  const branchForm = this.branches.at(branchIndex) as FormGroup;
  const branchStatus = branchForm.get('status')?.value;
  const isSuspended = branchStatus === 'Suspended' || branchStatus === 'S';

  // Update child records status and disable/enable controls
  this.updateChildRecordsStatus(branchIndex, isSuspended);
}

private updateChildRecordsStatus(branchIndex: number, isSuspended: boolean): void {
  const branchForm = this.branches.at(branchIndex) as FormGroup;
  const branchSid = branchForm.get('CustomerBranchSid')?.value;
  
  // Update nested contacts, emails and logins under this branch.
  const contacts = this.getContacts(branchIndex);
  contacts.controls.forEach(contact => {
    this.applyChildFormSuspendedState(contact as FormGroup, isSuspended);
  });

  const emails = this.getEmails(branchIndex);
  emails.controls.forEach(email => {
    this.applyChildFormSuspendedState(email as FormGroup, isSuspended);
  });

  const logins = this.getLogins(branchIndex);
  logins.controls.forEach(login => {
    this.applyChildFormSuspendedState(login as FormGroup, isSuspended);
  });

  // Update emails in Email tab for this branch
  this.updateEmailTabForBranch(branchSid, isSuspended);
  
  // Update logins in eLogin tab for this branch
  this.updateELoginTabForBranch(branchSid, isSuspended);

  // Update sales teams for this branch
  this.updateSalesTeamsForBranch(branchIndex, isSuspended);
  
  // Update milestones for this branch
  this.updateMilestonesForBranch(branchIndex, isSuspended);
}

private applyChildFormSuspendedState(
  childForm: FormGroup,
  isSuspended: boolean,
  statusControlName: string = 'status'
): void {
  const statusControl = childForm.get(statusControlName);

  if (isSuspended) {
    if (!this.temporarilySuspendedChildRecords.has(childForm)) {
      this.temporarilySuspendedChildRecords.set(childForm, this.toDisplayStatus(statusControl?.getRawValue()));
    }
    statusControl?.setValue('Suspended', { emitEvent: false });
  } else if (this.temporarilySuspendedChildRecords.get(childForm) === 'Active') {
    statusControl?.setValue('Active', { emitEvent: false });
    this.temporarilySuspendedChildRecords.delete(childForm);
  }

  Object.keys(childForm.controls).forEach(controlName => {
    const control = childForm.get(controlName);
    if (!control) return;

    if (isSuspended) {
      control.disable({ emitEvent: false });
    } else {
      control.enable({ emitEvent: false });
    }
  });
}

private updateEmailTabForBranch(branchSid: number, isSuspended: boolean): void {
  this.customerEmails.controls.forEach(email => {
    const emailForm = email as FormGroup;
    const emailBranchSid = emailForm.get('CustomerBranchSid')?.value;
    
    if (emailBranchSid === branchSid) {
      this.applyChildFormSuspendedState(emailForm, isSuspended);
    }
  });
}

private updateELoginTabForBranch(branchSid: number, isSuspended: boolean): void {
  this.customerLogins.controls.forEach(login => {
    const loginForm = login as FormGroup;
    const loginBranchSid = loginForm.get('CustomerBranchSid')?.value;
    
    if (loginBranchSid === branchSid) {
      this.applyChildFormSuspendedState(loginForm, isSuspended);
    }
  });
}

private updateSalesTeamsForBranch(branchIndex: number, isSuspended: boolean): void {
  const branchForm = this.branches.at(branchIndex) as FormGroup;
  const branchSid = branchForm.get('CustomerBranchSid')?.value;

  this.cusSalesteam.controls.forEach(team => {
    const teamForm = team as FormGroup;
    const teamBranchSid = teamForm.get('branchSid')?.value;
    
    if (teamBranchSid === branchSid) {
      this.applyChildFormSuspendedState(teamForm, isSuspended);
    }
  });
}

private updateMilestonesForBranch(branchIndex: number, isSuspended: boolean): void {
  const branchForm = this.branches.at(branchIndex) as FormGroup;
  const branchSid = branchForm.get('CustomerBranchSid')?.value;

  this.cusMilestone.controls.forEach(milestone => {
    const milestoneForm = milestone as FormGroup;
    const milestoneBranchSid = milestoneForm.get('CustomerBranchSid')?.value;
    
    if (milestoneBranchSid === branchSid) {
      this.applyChildFormSuspendedState(milestoneForm, isSuspended, 'Status');
    }
  });
}
private validateAllForms(): { isValid: boolean; errorMessage: string } {
  // Validate main customer form
  this.customerForm.markAllAsTouched();
  
  if (this.customerForm.invalid) {
    return { 
      isValid: false, 
      errorMessage: 'Please fill all required fields in the Customer section.' 
    };
  }

  // Validate all branches if they exist
  const branchValidation = this.validateAllBranches();
  if (!branchValidation.isValid) {
    return { 
      isValid: false, 
      errorMessage: branchValidation.message  // Map 'message' to 'errorMessage'
    };
  }

  return { isValid: true, errorMessage: '' };
}
private loadNetworks(): void {
  const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  if (!CompanyMasterSid ) {
    console.warn('Company ID not available for loading networks');
    return;
  }

  this.masterService.getAllNetworks().subscribe({
    next: (resp: any) => {
      if (resp && resp) {
        this.networkList = resp;
        console.log('Networks loaded successfully:', this.networkList);
      } else {
        console.warn('No network data received');
        this.networkList = [];
      }
      this.cdRef.markForCheck();
    },
    error: (error) => {
      console.error('Error loading networks:', error);
      this.networkList = [];
      this.appSettingService.showError('Error loading networks');
      this.cdRef.markForCheck();
    }
  });
}
  navigateToCreateOrganization() {
    this.router.navigate(['master/organization/entry'])
  }

  // ============== EXCEL UPLOAD METHODS ==============

  openExcelUploadModal(content: TemplateRef<any>) {
    this.resetExcelUploadState();
    this.excelUploadModalRef = this.modalService.open(content, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
  }

  resetExcelUploadState() {
    this.selectedExcelFile = null;
    this.isDragOver = false;
    this.isProcessingExcel = false;
    this.isImporting = false;
    this.showDataPreview = false;
    this.excelUploadError = null;
    this.parsedCustomers = [];
    this.hasValidationErrors = false;
    this.expandedPreviewCustomers = new Set();
  }

  openImportErrorsModal() {
    this.modalService.open(this.importErrorsModal, {
      size: 'xl',
      centered: true,
      scrollable: true,
      backdrop: 'static'
    });
  }

  parseValidationErrors(messages: string[]): any[] {
    // Map to collect errors by customer index and branch
    const errorsByCustomer: Map<number, Map<number, { errors: string[], branchData: any }>> = new Map();

    // Field name mappings for user-friendly display
    const fieldLabels: { [key: string]: string } = {
      'CityMasterSid': 'City',
      'StateMasterSid': 'State',
      'CountryMasterSid': 'Country',
      'CustomerName': 'Customer Name',
      'BranchName': 'Branch Name',
      'BranchCode': 'Branch Code',
      'BranchAddress1': 'Branch Address',
      'PinCode': 'Pin Code',
      'ContactPerson': 'Contact Person',
      'ContactNumber': 'Contact Number',
      'EmailId': 'Email'
    };

    for (const msg of messages) {
      // Parse format: "customers.INDEX.customerBranches.BRANCH_INDEX.FIELD validation"
      // or "customers.INDEX.FIELD validation"
      const customerMatch = msg.match(/^customers\.(\d+)/);
      if (customerMatch) {
        const customerIndex = parseInt(customerMatch[1], 10);

        if (!errorsByCustomer.has(customerIndex)) {
          errorsByCustomer.set(customerIndex, new Map());
        }

        // Check if it's a branch field
        const branchMatch = msg.match(/customerBranches\.(\d+)\.(\w+)\s+(.+)/);
        if (branchMatch) {
          const branchIndex = parseInt(branchMatch[1], 10);
          const fieldName = branchMatch[2];
          const errorMsg = branchMatch[3];
          const fieldLabel = fieldLabels[fieldName] || fieldName;

          const customerBranches = errorsByCustomer.get(customerIndex)!;
          if (!customerBranches.has(branchIndex)) {
            // Get branch data from parsedCustomers
            const branchData = this.parsedCustomers[customerIndex]?.branches?.[branchIndex] || {};
            customerBranches.set(branchIndex, { errors: [], branchData });
          }
          customerBranches.get(branchIndex)!.errors.push(`${fieldLabel} ${errorMsg}`);
        } else {
          // Customer-level field (use -1 as branch index)
          const fieldMatch = msg.match(/customers\.\d+\.(\w+)\s+(.+)/);
          if (fieldMatch) {
            const fieldName = fieldMatch[1];
            const errorMsg = fieldMatch[2];
            const fieldLabel = fieldLabels[fieldName] || fieldName;

            const customerBranches = errorsByCustomer.get(customerIndex)!;
            if (!customerBranches.has(-1)) {
              customerBranches.set(-1, { errors: [], branchData: {} });
            }
            customerBranches.get(-1)!.errors.push(`${fieldLabel} ${errorMsg}`);
          }
        }
      }
    }

    // Convert to array format for display
    const result: any[] = [];
    errorsByCustomer.forEach((branchErrors, customerIndex) => {
      const customer = this.parsedCustomers[customerIndex];
      const customerName = customer?.CustomerName || `Customer ${customerIndex + 1}`;

      branchErrors.forEach((data, branchIndex) => {
        if (branchIndex === -1) {
          // Customer-level error
          result.push({
            CustomerName: customerName,
            BranchName: '-',
            StateName: '-',
            CityName: '-',
            error: data.errors.join('; ')
          });
        } else {
          // Branch-level error
          const branch = data.branchData;
          result.push({
            CustomerName: customerName,
            BranchName: branch.CustBranchName || `Branch ${branchIndex + 1}`,
            StateName: branch.StateName || '-',
            CityName: branch.CityName || '-',
            error: data.errors.join('; ')
          });
        }
      });
    });

    return result;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.setExcelFile(files[0]);
    }
  }

  onExcelFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setExcelFile(input.files[0]);
    }
  }

  setExcelFile(file: File) {
    this.excelUploadError = null;
    this.showDataPreview = false;
    this.parsedCustomers = [];

    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      this.excelUploadError = 'Invalid file format. Please upload an Excel file (.xlsx or .xls)';
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      this.excelUploadError = 'File size exceeds 10MB limit';
      return;
    }

    this.selectedExcelFile = file;
    this.cdRef.markForCheck();
  }

  removeExcelFile() {
    this.selectedExcelFile = null;
    this.showDataPreview = false;
    this.parsedCustomers = [];
    this.excelUploadError = null;
    this.hasValidationErrors = false;
    this.cdRef.markForCheck();
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async processExcelFile() {
    if (!this.selectedExcelFile) return;

    this.isProcessingExcel = true;
    this.excelUploadError = null;
    this.cdRef.markForCheck();

    // Ensure all dropdown data is loaded before processing
    // try {
    //   await Promise.all([
    //     this.dropdownStore.loadCountries().toPromise(),
    //     this.dropdownStore.loadStates().toPromise(),
    //     this.dropdownStore.loadCities().toPromise()
    //   ]);
    //   console.log('Dropdown data loaded - Countries:', this.countryList?.length, 'States:', this.stateList?.length, 'Cities:', this.cityList?.length);
    // } catch (error) {
    //   console.error('Error loading dropdown data:', error);
    // }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rows.length === 0) {
          this.excelUploadError = 'No data found in the Excel file';
          this.isProcessingExcel = false;
          this.cdRef.markForCheck();
          return;
        }

        // Group rows by CustomerName
        this.parsedCustomers = this.groupExcelDataByCustomer(rows);

        // Validate parsed data
        this.validateParsedCustomers();

        this.showDataPreview = true;
        this.isProcessingExcel = false;
        this.cdRef.markForCheck();
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        this.excelUploadError = 'Error parsing Excel file. Please ensure the file format is correct.';
        this.isProcessingExcel = false;
        this.cdRef.markForCheck();
      }
    };

    reader.onerror = () => {
      this.excelUploadError = 'Error reading file';
      this.isProcessingExcel = false;
      this.cdRef.markForCheck();
    };

    reader.readAsArrayBuffer(this.selectedExcelFile);
  }

  groupExcelDataByCustomer(rows: any[]): any[] {
    const customerMap = new Map<string, any>();

    rows.forEach(row => {
      const customerName = row.CustomerName?.toString().trim();
      if (!customerName) return;

      if (!customerMap.has(customerName)) {
        // Support CountryMasterSid (numeric ID) or CountryName (text)
        const countryValue = row.CountryName || row.CountryMasterSid || '';

        customerMap.set(customerName, {
          CustomerName: customerName,
          CustomerShortCode: row.CustomerShortCode?.toString().trim() || '',
          CustomerAliasName: row.CustomerAliasName?.toString().trim() || '',
          CustomerAddress1: row.CustomerAddress1?.toString().trim() || '',
          CustomerAddress2: row.CustomerAddress2?.toString().trim() || '',
          CountryMasterSid: row.CountryMasterSid || null,  // Keep numeric ID
          CountryName: countryValue?.toString().trim() || '',
          CompanyType: row.CompanyType?.toString().trim() || '',
          PanAvailable: row.PanAvailable?.toString().toLowerCase() === 'true' || row.PanAvailable?.toString().toUpperCase() === 'Y' || row.PanType?.toString().trim() !== '',
          PanName: row.PanName?.toString().trim() || '',
          GroupName: row.GroupName?.toString().trim() || '',
          Website: row.Website?.toString().trim() || '',
          paymentType: row.PaymentType?.toString().trim() || row.paymentType?.toString().trim() || row.CashCredit?.toString().trim() || '',
          IsMSME: row.IsMSME?.toString().toUpperCase() === 'Y' || row.IsMSME?.toString().toLowerCase() === 'yes' ? 'Y' : 'N',
          RegistrationNo: row.RegistrationNo?.toString().trim() || '',
          Remarks: row.Remarks?.toString().trim() || '',
          CIN: row.CIN?.toString().trim() || '',
          TAN: row.TAN?.toString().trim() || '',
          status: row.CustomerStatus?.toString().trim() || row.status?.toString().trim() || 'Active',
          CustomerType: row.CustomerTypes?.toString().trim() || row.CustomerType?.toString().trim() || '',
          Network: row.Network?.toString().trim() || '',
          branches: [],
          errors: []
        });
      }

      // Add branch - support ALL Excel column name variants
      const branchName = row.BranchName?.toString().trim() || row.CustBranchName?.toString().trim();
      if (branchName) {
        customerMap.get(customerName).branches.push({
          CustBranchName: branchName,
          // Branch_Type (Excel) or BranchType or CustBranchType
          CustBranchType: row.Branch_Type?.toString().trim() || row.BranchType?.toString().trim() || row.CustBranchType?.toString().trim() || 'BRANCH',
          // Branch_Code (Excel) or BranchCode or CustBranchCode
          CustBranchCode: row.Branch_Code?.toString().trim() || row.BranchCode?.toString().trim() || row.CustBranchCode?.toString().trim() || '',
          // StateMasterSid (Excel numeric) or StateName
          StateMasterSid: row.StateMasterSid || null,
          StateName: row.StateName?.toString().trim() || row.CustBranchState?.toString().trim() || row.StateMasterSid?.toString() || '',
          // CityMasterSid (Excel numeric) or CityName
          CityMasterSid: row.CityMasterSid || null,
          CityName: row.CityName?.toString().trim() || row.CustBranchCity?.toString().trim() || row.CityMasterSid?.toString() || '',
          // Contact_Person (Excel has underscore)
          Contact_Person: row.Contact_Person?.toString().trim() || row.ContactPerson?.toString().trim() || '',
          // Zip_PostBox (Excel) or ZipPostCode
          CustBranchZipPostCode: row.Zip_PostBox?.toString().trim() || row.ZipPostCode?.toString().trim() || row.CustBranchZipPostCode?.toString().trim() || '',
          // ContactNo (Excel) or BranchPhone
          CustBranchPhone: row.ContactNo?.toString().trim() || row.BranchPhone?.toString().trim() || row.CustBranchPhone?.toString().trim() || '',
          CustBranchPhoneCode: row.BranchPhoneCode?.toString().trim() || row.CustBranchPhoneCode?.toString().trim() || '',
          // Email (Excel) or BranchEmail
          CustBranchEmail: row.Email?.toString().trim() || row.BranchEmail?.toString().trim() || row.CustBranchEmail?.toString().trim() || '',
          // Address (Excel) or BranchAddress
          CustBranchAddress: row.Address?.toString().trim() || row.BranchAddress?.toString().trim() || row.CustBranchAddress?.toString().trim() || '',
          // Registered
          CustBranchRegistered: row.Registered?.toString().toUpperCase() === 'Y' || row.CustBranchRegistered?.toString().toUpperCase() === 'Y' ? 'Y' : 'N',
          // CustomerGstType (Excel) or GSTType
          CustBranchGSTtype: row.CustomerGstType?.toString().trim() || row.GSTType?.toString().trim() || row.CustBranchGSTtype?.toString().trim() || 'Regular',
          // GSTNo (Excel) or GSTIN
          CustBranchGSTIN: row.GSTNo?.toString().trim() || row.GSTIN?.toString().trim() || row.CustBranchGSTIN?.toString().trim() || '',
          status: row.BranchStatus?.toString().trim() || row.status?.toString().trim() || 'Active'
        });
      }
    });

    return Array.from(customerMap.values());
  }

  validateParsedCustomers() {
    this.hasValidationErrors = false;

    this.parsedCustomers.forEach(customer => {
      customer.errors = [];

      // Validate required customer fields
      if (!customer.CustomerName) {
        customer.errors.push('Customer Name is required');
      }
      if (!customer.CustomerAddress1) {
        customer.errors.push('Customer Address is required');
      }

      // Country validation - check numeric ID first, then name lookup
      const hasCountry = customer.CountryName ||
        (customer.CountryName && this.resolveCountryId(customer.CountryName));
      if (!hasCountry) {
        customer.errors.push('Country is required or not found');
      }

      // Validate branches
      if (!customer.branches || customer.branches.length === 0) {
        customer.errors.push('At least one branch is required');
      } else {
        customer.branches.forEach((branch: any, idx: number) => {
          if (!branch.CustBranchName) {
            customer.errors.push(`Branch ${idx + 1}: Name is required`);
          }
          if (!branch.CustBranchType) {
            customer.errors.push(`Branch ${idx + 1}: Type is required`);
          }

          // State - check numeric ID first, then name lookup
          const hasState = branch.StateName ||
            (branch.StateName && this.resolveStateId(branch.StateName));
          if (!hasState) {
            customer.errors.push(`Branch ${idx + 1}: State is required or not found`);
          }

          // City - check numeric ID first, then name lookup
          const hasCity = branch.CityName ||
            (branch.CityName && this.resolveCityId(branch.CityName, branch.StateName));
          if (!hasCity) {
            customer.errors.push(`Branch ${idx + 1}: City is required or not found`);
          }

          if (!branch.CustBranchEmail) {
            customer.errors.push(`Branch ${idx + 1}: Email is required`);
          }
          if (!branch.CustBranchAddress) {
            customer.errors.push(`Branch ${idx + 1}: Address is required`);
          }
        });
      }

      if (customer.errors.length > 0) {
        this.hasValidationErrors = true;
      }
    });

    this.cdRef.markForCheck();
  }

  getCountryDisplayName(customer: any): string {
    if (customer.CountryMasterSid) {
      const country = this.countryList?.find((c: any) => c.CountryMasterSid === customer.CountryMasterSid);
      return country?.countryName || customer.CountryMasterSid?.toString();
    }
    return customer.CountryName || '';
  }

  togglePreviewCustomer(index: number) {
    if (this.expandedPreviewCustomers.has(index)) {
      this.expandedPreviewCustomers.delete(index);
    } else {
      this.expandedPreviewCustomers.add(index);
    }
  }

  isPreviewCustomerExpanded(index: number): boolean {
    return this.expandedPreviewCustomers.has(index);
  }

  isFieldMissing(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  isRequiredCustomerField(key: string): boolean {
    return this.requiredCustomerFields.includes(key);
  }

  isRequiredBranchField(key: string): boolean {
    return this.requiredBranchFields.includes(key);
  }

  private cleanLookupName(value: string): string {
    if (!value) return '';
    return value.toString().trim().replace(/\d+$/, '').trim();
  }

   resolveCountryId(countryValue: string) {
    if (!countryValue || !this.countryList || this.countryList.length === 0) {
      console.log('resolveCountryId: No value or empty countryList', { countryValue, listLength: this.countryList?.length });
      return null;
    }
    const val = countryValue.toString().trim().toLowerCase();

    // Try exact match on name
    let country = this.countryList.find((c: any) =>
      c.countryName?.toLowerCase() === val
    );

    // Try match on code (if exists)
    if (!country) {
      country = this.countryList.find((c: any) =>
        c.countryCode?.toLowerCase() === val
      );
    }

    // Try partial match on name (e.g., "IND" might be start of "India")
    if (!country) {
      country = this.countryList.find((c: any) =>
        c.countryName?.toLowerCase().startsWith(val) ||
        c.countryName?.toLowerCase().includes(val)
      );
    }

  //     console.log('resolveCountryId', {
  //   input: countryValue,
  //   matched: country?.countryName,
  //   id: country?.CountryMasterSid
  // });

  return country?.CountryMasterSid ?? null;
  }

   async resolveStateId(stateValue: string, countryValue?: string): Promise<number | null> {
    const countryId = this.resolveCountryId(countryValue);
    console.log(countryId);

    if (countryId == null) {
      console.log('resolveStateId: No countryId resolved, returning null');
      return null;
    }

    try {
      const resp: any = await firstValueFrom(this.masterService.getStateByCountryId(Number(countryId)));
      console.log(resp, 'getStateByCountryId');
      if (resp.status) {
        this.stateNewList = resp.data;
        this.cdRef.markForCheck();
      } else {
        console.error('Error fetching States with Country Id');
        this.stateList = [];
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      return null;
    }

    if (!stateValue || !this.stateNewList || this.stateNewList.length === 0) {
      console.log('resolveStateId: No value or empty stateList', { stateValue, listLength: this.stateNewList?.length });
      return null;
    }

    const val = stateValue.toString().trim().toLowerCase();
    const cleanedVal = this.cleanLookupName(stateValue).toLowerCase();

    // Try exact match on name
    let state = this.stateNewList.find((s: any) =>
      s.stateName?.toLowerCase() === val
    );

    // Try cleaned name match (trailing digits stripped)
    if (!state && cleanedVal !== val) {
      state = this.stateNewList.find((s: any) =>
        s.stateName?.toLowerCase() === cleanedVal
      );
    }

    // Try match on code
    if (!state) {
      state = this.stateNewList.find((s: any) =>
        s.stateCode?.toLowerCase() === val
      );
    }

    // Try partial/contains match
    if (!state) {
      state = this.stateNewList.find((s: any) =>
        s.stateName?.toLowerCase().startsWith(val) ||
        s.stateName?.toLowerCase().includes(val)
      );
    }

    // Try partial/contains with cleaned name
    if (!state && cleanedVal !== val) {
      state = this.stateNewList.find((s: any) =>
        s.stateName?.toLowerCase().startsWith(cleanedVal) ||
        s.stateName?.toLowerCase().includes(cleanedVal)
      );
    }

    if (!state) {
      console.log('resolveStateId: No match found. Input:', stateValue, 'Sample item:', this.stateNewList?.[0]);
    }

    return state?.StateMasterSid || null;
  }

   async resolveCityId(cityValue: string, stateValue?: string, country?: string, resolvedStateId?: number): Promise<number | null> {
    const stateId = resolvedStateId ?? await this.resolveStateId(stateValue, country);
    console.log(stateId);

    if (stateId == null) {
      console.log('resolveCityId: No stateId resolved, returning null');
      return null;
    }

    try {
      const resp: any = await firstValueFrom(this.leadService.getCityByStateId(Number(stateId)));
      if (resp.status) {
        this.cityNewList = resp.data;
      } else {
        console.error('Error fetching Cities with State Id');
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      return null;
    }

    if (!cityValue || !this.cityNewList || this.cityNewList.length === 0) {
      console.log('resolveCityId: No value or empty cityList', { cityValue, listLength: this.cityNewList?.length });
      return null;
    }

    const val = cityValue.toString().trim().toLowerCase();
    const cleanedVal = this.cleanLookupName(cityValue).toLowerCase();

    // Try exact match on name
    let city = this.cityNewList.find((c: any) =>
      c.cityName?.toLowerCase() === val
    );

    // Try cleaned name match (trailing digits stripped)
    if (!city && cleanedVal !== val) {
      city = this.cityNewList.find((c: any) =>
        c.cityName?.toLowerCase() === cleanedVal
      );
    }

    // Try match on code
    if (!city) {
      city = this.cityNewList.find((c: any) =>
        c.cityCode?.toLowerCase() === val
      );
    }

    // Try partial/contains match
    if (!city) {
      city = this.cityNewList.find((c: any) =>
        c.cityName?.toLowerCase().startsWith(val) ||
        c.cityName?.toLowerCase().includes(val)
      );
    }

    // Try partial/contains with cleaned name
    if (!city && cleanedVal !== val) {
      city = this.cityNewList.find((c: any) =>
        c.cityName?.toLowerCase().startsWith(cleanedVal) ||
        c.cityName?.toLowerCase().includes(cleanedVal)
      );
    }

    if (!city) {
      console.log('resolveCityId: No match found. Input:', cityValue, 'Sample item:', this.cityNewList?.[0]);
    }

    console.log('resolveCityId:', { input: cityValue, cleaned: this.cleanLookupName(cityValue), state: stateValue, found: city?.cityName, id: city?.CityMasterSid });
    return city?.CityMasterSid || null;
  }

  async prepareCustomerPayloadFromExcel(customer: any): Promise<any> {
    const countryId = customer.CountryMasterSid || this.resolveCountryId(customer.CountryName);
    let currencyId: number | null = null;
    if (countryId && this.countryList) {
      const selectedCountry = this.countryList.find((c: any) => c.CountryMasterSid == countryId);
      currencyId = selectedCountry?.CurrencyMasterSid || null;
    }

    const branches: any[] = [];
    for (const branch of customer.branches) {
      const stateId = branch.StateMasterSid || await this.resolveStateId(branch.StateName, customer.CountryName);
      const cityId = branch.CityMasterSid || await this.resolveCityId(branch.CityName, branch.StateName, customer.CountryName, stateId);

      if (!stateId) {
        console.error(`Branch "${branch.CustBranchName}": Could not resolve state "${branch.StateName}". stateNewList sample:`, this.stateNewList?.[0]);
      }
      if (!cityId) {
        console.error(`Branch "${branch.CustBranchName}": Could not resolve city "${branch.CityName}" in state "${branch.StateName}". cityNewList sample:`, this.cityNewList?.[0]);
      }

      branches.push({
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchName: branch.CustBranchName,
        StateMasterSid: stateId || undefined,
        CityMasterSid: cityId || undefined,
        StateName: branch.StateName || '',
        CityName: branch.CityName || '',
        Branch_Type: branch.CustBranchType || 'BRANCH',
        Branch_Code: branch.CustBranchCode || '',
        Contact_Person: branch.Contact_Person || '',
        Zip_PostBox: branch.CustBranchZipPostCode || '',
        ContactNo: this.withDialCode(branch.CustBranchPhone, branch.CustBranchPhoneCode),
        Email: branch.CustBranchEmail || '',
        Address: branch.CustBranchAddress || '',
        Registered: branch.CustBranchRegistered === 'Y' ? 'Y' : 'N',
        CustomerGstType: branch.CustBranchGSTtype || 'Regular',
        GSTNo: branch.CustBranchGSTIN || '',
        status: this.normalizeStatus(branch.status),
        customerBranchContacts: []
      });
    }

    // Build CustomerType as object (same format as updateCustomerType)
    const typeNames = customer.CustomerType ?
      customer.CustomerType.split(',').map((t: string) => t.trim().toLowerCase()) : [];
    const customerTypePayload: any = {};
    this.modeOfCustomerType.forEach((type) => {
      const key = this.toCamelCase(type.name);
      customerTypePayload[key] = typeNames.some(
        (name: string) => name === type.name.toLowerCase()
      ) ? 'isTrue' : 'isFalse';
    });

    return {
      customer: {
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        CustomerName: customer.CustomerName,
        CustomerShortCode: customer.CustomerShortCode || '',
        CustomerAliasName: customer.CustomerAliasName || '',
        CustomerAddress1: customer.CustomerAddress1 || '',
        CustomerAddress2: customer.CustomerAddress2 || '',
        CountryMasterSid: countryId,
        CurrencyMasterSid: currencyId,
        CustomerType: customerTypePayload,
        PanName: customer.PanName || '',
        PanType: customer.PanAvailable ? 'Y' : 'N',
        GroupName: customer.GroupName || '',
        Website: customer.Website || '',
        CashCredit: customer.paymentType || '',
        Network: customer.Network || '',
        Remarks: customer.Remarks || '',
        TAN: customer.TAN || '',
        CIN: customer.CIN || '',
        IsMSME: customer.IsMSME === 'Y' ? 'A' : 'I',
        RegistrationNo: customer.RegistrationNo || '',
        CompanyType: customer.CompanyType || '',
        status: this.normalizeStatus(customer.status),
        AirlineNumber: '',
        AirlineCode: ''
      },
      customerBranches: branches
    };
  }

  async importExcelData() {
    if (this.parsedCustomers.length === 0 || this.hasValidationErrors) {
      this.appSettingService.showError('Please fix validation errors before importing');
      return;
    }

    this.isImporting = true;
    this.cdRef.markForCheck();

    try {
      // Prepare all customer payloads
      const customerPayloads: any[] = [];
      for (const customer of this.parsedCustomers) {
        const payload = await this.prepareCustomerPayloadFromExcel(customer);
        customerPayloads.push(payload);
      }

      // Call bulk API
      const result = await this.masterService.createBulkCustomers({
        customers: customerPayloads
      }).toPromise();

      if (result.status) {
        const successCount = result.data?.success?.length || 0;
        const failCount = result.data?.failed?.length || 0;

        if (failCount === 0) {
          this.appSettingService.showSuccess(`Successfully imported ${successCount} customer(s)`);
          if (this.excelUploadModalRef) {
            this.excelUploadModalRef.close();
          }
          this.resetExcelUploadState();
          this.router.navigate(['/master/organization/list']);
        } else {
          // Store failed records for display
          this.importFailedRecords = result.data.failed || [];

          // Open modal to show detailed errors
          this.openImportErrorsModal();

          if (successCount > 0) {
            this.appSettingService.showWarning(
              `Imported ${successCount} successfully. ${failCount} failed - see details.`
            );
          }
        } 
      } else {
        this.appSettingService.showError(result.message || 'Bulk upload failed');
      }

    } catch (error: any) {
      console.error('Bulk upload error:', error);

      // Handle NestJS validation errors (400 Bad Request)
      if (error?.error?.message && Array.isArray(error.error.message)) {
        this.importFailedRecords = this.parseValidationErrors(error.error.message);
        this.openImportErrorsModal();
      } else {
        this.appSettingService.showError(error.message || error?.error?.message || 'Error during bulk upload');
      }
    } finally {
      this.isImporting = false;
      this.cdRef.markForCheck();
    }
  }

  async populateFormsFromExcel(customer: any) {
    // Resolve country ID
    const countryId = this.resolveCountryId(customer.CountryName);

    // Patch customer form
    this.customerForm.patchValue({
      CustomerName: customer.CustomerName,
      CustomerShortCode: customer.CustomerShortCode,
      CustomerAliasName: customer.CustomerAliasName,
      CustomerAddress1: customer.CustomerAddress1,
      CustomerAddress2: customer.CustomerAddress2,
      CountryMasterSid: countryId,
      CompanyType: customer.CompanyType,
      PanAvailable: customer.PanAvailable,
      PanName: customer.PanName,
      GroupName: customer.GroupName,
      Website: customer.Website,
      paymentType: customer.paymentType,
      IsMSME: customer.IsMSME,
      RegistrationNo: customer.RegistrationNo,
      Remarks: customer.Remarks,
      CIN: customer.CIN,
      TAN: customer.TAN,
      status: this.normalizeStatus(customer.status) === 'S' ? 'Suspended' : 'Active',
      Network: customer.Network
    },{ emitEvent: false });

    // Handle CustomerType (comma-separated)
    if (customer.CustomerType) {
      const typeNames = customer.CustomerType.split(',').map((t: string) => t.trim());
      this.selectedStatus = this.modeOfCustomerType
        .filter(type => typeNames.some((name: string) => name.toLowerCase() === type.name.toLowerCase()))
        .map(type => type.name);
      this.updateCustomerType();
    }

    // Load states for the selected country
    if (countryId) {
      this.customerForm.get('CountryMasterSid')?.setValue(countryId);
      this.getStatesByCountryId();
      this.autoSelectCurrency();
    }

    // Clear existing branches and add new ones from Excel
    while (this.branchFormArray.length > 0) {
      this.branchFormArray.removeAt(0);
    }
    this.activeBranchIds = [];

    // Add branches from Excel data
    for (let index = 0; index < customer.branches.length; index++) {
      const branch = customer.branches[index];
      const stateId = await this.resolveStateId(branch.StateName, customer.CountryName);
      const cityId = await this.resolveCityId(branch.CityName, branch.StateName, customer.CountryName);

      const branchForm = this.addBranchFormGroup({
        BranchName: branch.CustBranchName,
        Branch_Type: branch.CustBranchType,
        Branch_Code: branch.CustBranchCode,
        StateMasterSid: stateId,
        CityMasterSid: cityId,
        Contact_Person: branch.Contact_Person,
        Zip_PostBox: branch.CustBranchZipPostCode,
        CustBranchPhoneCode: branch.CustBranchPhoneCode,
        ContactNo: branch.CustBranchPhone,
        Email: branch.CustBranchEmail,
        Address: branch.CustBranchAddress,
        Registered: branch.CustBranchRegistered,
        CustomerGstType: branch.CustBranchGSTtype,
        GSTNo: branch.CustBranchGSTIN,
        status: this.normalizeStatus(branch.status)
      });

      this.branchFormArray.push(branchForm);
      this.activeBranchIds.push('branch-' + index);
    }

    this.updateAvailableBranchesCache();
    this.cdRef.markForCheck();
  }

  downloadExcelTemplate() {
    // Create template data with headers and sample row
    const templateData = [
      {
        // Customer Fields
        CustomerName: 'ABC Corporation',
        CustomerShortCode: 'ABC',
        CustomerAliasName: 'ABC Corp',
        CustomerAddress1: '123 Main Street',
        CustomerAddress2: 'Suite 100',
        CountryName: 'India',
        CompanyType: 'Company',
        PanAvailable: 'Y',
        PanName: 'ABCDE1234F',
        GroupName: 'ABC Group',
        Website: 'www.abc.com',
        PaymentType: 'Credit',
        IsMSME: 'N',
        RegistrationNo: 'REG12345',
        Remarks: 'Sample customer',
        CIN: 'U12345MH2020PTC123456',
        TAN: 'ABCD12345E',
        CustomerStatus: 'Active',
        CustomerTypes: 'Customer,Shipper',
        Network: '',
        // Branch Fields
        BranchName: 'Head Office',
        BranchType: 'HeadQuarters',
        BranchCode: 'HO001',
        StateName: 'Maharashtra',
        CityName: 'Mumbai',
        ContactPerson: 'John Doe',
        ZipPostCode: '400001',
        BranchPhone: '9876543210',
        BranchPhoneCode: '+91',
        BranchEmail: 'ho@abc.com',
        BranchAddress: '123 Main Street, Mumbai',
        Registered: 'Y',
        GSTType: 'Regular',
        GSTIN: '27ABCDE1234F1Z5',
        BranchStatus: 'Active'
      },
      {
        // Same customer, different branch
        CustomerName: 'ABC Corporation',
        CustomerShortCode: '',
        CustomerAliasName: '',
        CustomerAddress1: '',
        CustomerAddress2: '',
        CountryName: '',
        CompanyType: '',
        PanAvailable: '',
        PanName: '',
        GroupName: '',
        Website: '',
        PaymentType: '',
        IsMSME: '',
        RegistrationNo: '',
        Remarks: '',
        CIN: '',
        TAN: '',
        CustomerStatus: '',
        CustomerTypes: '',
        Network: '',
        // Branch Fields
        BranchName: 'Delhi Branch',
        BranchType: 'BRANCH',
        BranchCode: 'DEL001',
        StateName: 'Delhi',
        CityName: 'New Delhi',
        ContactPerson: 'Jane Smith',
        ZipPostCode: '110001',
        BranchPhone: '9876543211',
        BranchPhoneCode: '+91',
        BranchEmail: 'delhi@abc.com',
        BranchAddress: '456 Park Avenue, Delhi',
        Registered: 'Y',
        GSTType: 'Regular',
        GSTIN: '07ABCDE1234F1Z5',
        BranchStatus: 'Active'
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OrganizationData');

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // CustomerName
      { wch: 15 }, // CustomerShortCode
      { wch: 18 }, // CustomerAliasName
      { wch: 25 }, // CustomerAddress1
      { wch: 20 }, // CustomerAddress2
      { wch: 12 }, // CountryName
      { wch: 15 }, // CompanyType
      { wch: 12 }, // PanAvailable
      { wch: 15 }, // PanName
      { wch: 15 }, // GroupName
      { wch: 20 }, // Website
      { wch: 12 }, // PaymentType
      { wch: 8 },  // IsMSME
      { wch: 15 }, // RegistrationNo
      { wch: 20 }, // Remarks
      { wch: 25 }, // CIN
      { wch: 15 }, // TAN
      { wch: 12 }, // CustomerStatus
      { wch: 20 }, // CustomerTypes
      { wch: 10 }, // Network
      { wch: 18 }, // BranchName
      { wch: 14 }, // BranchType
      { wch: 12 }, // BranchCode
      { wch: 15 }, // StateName
      { wch: 15 }, // CityName
      { wch: 18 }, // ContactPerson
      { wch: 12 }, // ZipPostCode
      { wch: 15 }, // BranchPhone
      { wch: 15 }, // BranchPhoneCode
      { wch: 25 }, // BranchEmail
      { wch: 30 }, // BranchAddress
      { wch: 12 }, // Registered
      { wch: 12 }, // GSTType
      { wch: 18 }, // GSTIN
      { wch: 12 }  // BranchStatus
    ];

    // Download file
    XLSX.writeFile(wb, 'Organization_Upload_Template.xlsx');
  }
}
