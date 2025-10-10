import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import {
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChild,
  OnInit,
  OnDestroy
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
import {  forkJoin, Subject } from 'rxjs';
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
    SearchableDropdown
  ],
  templateUrl: './organization-entry.component.html',
  styleUrl: './organization-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }
  ],
})
export class OrganizationEntryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  // Existing properties
  page = 1;
  pageSize = 5;
  totalLengthOfBranch: number = 0;
    displayedCustomerTypes: any[] = [];
  extraCustomerTypesCount = 0;
  currentTaxIdLabel: string = 'PAN/VAT Number';
   activeBranchIds: string[] = [];



  isCustomerSaved = false;
  showAdditionalTabs = false;
  selectedTab = 'Party';
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
  
  if (!isIndia) {
    // Reset PAN Available if not India
    this.customerForm.get('PanAvailable')?.setValue(false);
  }
  
  // Update tax field validation
  this.updateTaxIdFieldValidation();
  this.updateTaxIdFieldState();
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
  countryList: any;
  status: any;
  CustomerBrEmailSid: any;
  // customerBranchResults: any;
  btnCustomerSaveDisabled: boolean = true;
  userData: any;
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

  ) {
    this.cusMilestoneFormArr = this.fb.array([]);
  }
  switchToEditMode() {
    this.isEditMode = true;
    this.selectedTab = 'Party';
  }

  ngOnInit(): void {
    // ✅ Get current company & branch
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    // ✅ Get logged-in user profile
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      console.log('User Profile loaded:', this.userData);
      console.log('User Email:', this.userData?.userEmail || this.userData?.UserEmail);
      this.checkPermissions();
    } else {
      console.error('No user profile found in localStorage');
    }
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
    this.getAllCountries();
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
      this.updateShortCodeFieldState();
      this.generateCustomerShortCode();
      this.updateTaxIdFieldValidation();
      this.updateTaxIdFieldState();
      this.getStatesByCountryId();
      });

    // ✅ React to country changes with debounce
    this.customerForm.get('CountryMasterSid')?.valueChanges
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
         this.onCountryChange();
        this.updateShortCodeFieldState();
      this.generateCustomerShortCode();
      this.updateTaxIdFieldValidation();
      this.updateTaxIdFieldState();
      this.getStatesByCountryId(); // Load states when country changes
    });


   

    
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
    this.generateCustomerShortCode();
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
      CustBranchPhone: [data?.ContactNo || '', [Validators.maxLength(15), this.phoneNumberValidator]],
      CustBranchEmail: [data?.Email || '', [Validators.required, EmailValidators.multipleEmails()]],
      CustBranchAddress: [data?.Address || '', [Validators.required]],
      CustBranchRegistered: [data?.Registered || 'Y', [Validators.required]],
      CustBranchGSTtype: [data?.CustomerGstType || ''],
      CustBranchGSTIN: [data?.GSTNo || '', this.gstValidator],
      status: [{ value: data?.status === 'A' ? 'Active' : data?.status === 'S' ? 'Suspended' : 'Active', disabled: false }, Validators.required],

      // Contacts array
      contacts: this.fb.array(data?.contacts ? this.createContactsArray(data.contacts) : []),

      // Emails array
      emails: this.fb.array(data?.emails ? this.createEmailsArray(data.emails) : []),

      // Logins array
      logins: this.fb.array(data?.logins ? this.createLoginsArray(data.logins) : [])
    });

    // Initialize cities array for this branch
    branchForm['cities'] = data?.cities || [];

    return branchForm;
  }

  // Create contacts array from data
  createContactsArray(contacts: any[]): FormGroup[] {
    return contacts.map(contact => this.fb.group({
      CusBranchContactSid: [contact.CusBranchContactSid || null],
      ContactType: [contact.ContactType || '', [Validators.required]],
      ContactName: [contact.ContactName || '', [Validators.required]],
      MobileNo: [contact.MobileNo || '', [Validators.maxLength(15), this.phoneNumberValidator]],
      Email: [contact.Email || '', [Validators.required, EmailValidators.multipleEmails()]],
      status: [contact.status === 'A' ? 'Active' : contact.status === 'S' ? 'Suspended' : 'Active']
    }));
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
      MobileNo: ['', [Validators.maxLength(15), this.phoneNumberValidator]],
      Email: ['', [Validators.required, EmailValidators.multipleEmails()]],
      status: ['Active']
    });
    this.getContacts(branchIndex).push(contactForm);
  }
 
  // Add email to branch
  addEmail(branchIndex: number) {
    const emailForm = this.fb.group({
      CustomerBrEmailSid: [null],
      MenuMasterSid: ['', [Validators.required]],
      DepartmentMasterSid: [[], [Validators.required]],
      Toemail: ['', [Validators.required, EmailValidators.multipleEmails()]],
      CCemail: ['', [EmailValidators.multipleEmails()]],
      status: ['Active']
    });
    this.getEmails(branchIndex).push(emailForm);
  }
  // Add login to branch
  addLogin(branchIndex: number) {
    const loginForm = this.fb.group({
      CustomerLoginSid: [null],
      LoginName: ['', [Validators.required]],
      LoginEmail: ['', [Validators.required, EmailValidators.singleEmail()]],
      LoginPassword: ['', [Validators.required, Validators.maxLength(50), PasswordValidators.validate()]],
      status: ['Active', Validators.required]
    });
    this.getLogins(branchIndex).push(loginForm);
  }

  // Remove branch
  removeBranch(branchIndex: number) {
  const branch = this.branches.at(branchIndex);
  const branchSid = branch.get('CustomerBranchSid')?.value;
  const branchId = 'branch-' + branchIndex;

  if (branchSid) {
    if (confirm('Are you sure you want to delete this branch?')) {
      this.masterService.deleteCustomerBranchById(branchSid).subscribe({
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

    if (contactSid) {
      if (confirm('Are you sure you want to delete this contact?')) {
        this.masterService.deleteCustomerBranchContactById(contactSid).subscribe({
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

    if (emailSid) {
      if (confirm('Are you sure you want to delete this email?')) {
        this.masterService.deleteCustomerBranchEmailById(emailSid).subscribe({
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

    if (loginSid) {
      if (confirm('Are you sure you want to delete this login?')) {
        this.masterService.deleteCustomerLoginById(loginSid).subscribe({
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
  // Clear existing form array
  this.branchFormArray = this.fb.array([]);

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
      status: branch.status === 'A' ? 'Active' : 'Suspended'
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
      if (branch.GSTNo) {
        this.initializeGSTINDigits(currentBranchIndex, branch.GSTNo);
      }
    }, 100);
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
          this.stateList = resp.data;
          // Update tax field states when country changes
          this.updateTaxIdFieldState();
          this.updateTaxIdFieldValidation();
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
  getCitiesByStateIdForBranch(branchIndex: number, stateId: any): void {
    const branchForm = this.branches.at(branchIndex) as FormGroup;

    if (!stateId) {
      branchForm['cities'] = [];
      branchForm.get('CustBranchCity')?.setValue('');
      this.generateBranchCode(branchIndex);
      this.generateGST(branchIndex);
      return;
    }

    this.leadService.getCityByStateId(stateId).subscribe(
      (resp: any) => {
        if (resp.status) {
          // ✅ Store cities in the branch form
          branchForm['cities'] = resp.data;

          // ✅ Force change detection
          this.cdRef.markForCheck();

          console.log(`Loaded ${resp.data.length} cities for branch ${branchIndex}`);
        } else {
          console.error('Error fetching Cities with State Id');
          branchForm['cities'] = [];
        }

        this.generateBranchCode(branchIndex);
        this.generateGST(branchIndex);
      },
      (error) => {
        console.error('Error loading cities:', error);
        branchForm['cities'] = [];
      }
    );
  }
  generateGST(branchIndex: number): void {
    const branchForm = this.branches.at(branchIndex) as FormGroup;
    const stateId = branchForm.get('CustBranchState')?.value;
    const stateCode = this.getStateGSTCode(stateId);
    const pan = this.customerForm.get('PanType')?.value || '';

    const thirteenthDigitInput = document.getElementById(`thirteenthDigit_${branchIndex}`) as HTMLInputElement;
    const fifteenthDigitInput = document.getElementById(`fifteenthDigit_${branchIndex}`) as HTMLInputElement;

    const thirteenthDigit = thirteenthDigitInput?.value || '';
    const fifteenthDigit = fifteenthDigitInput?.value || '';
    const fourteenthDigit = 'Z';

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
    let stateId: any;

    if (event instanceof Event) {
      const element = event.target as HTMLSelectElement;
      stateId = element.value;
    } else {
      stateId = event;
    }

    this.getCitiesByStateIdForBranch(branchIndex, stateId);
  }
  onCityChange(branchIndex: number): void {
    this.generateBranchCode(branchIndex);
  }

  // Handle branch name change for specific branch
  onBranchNameChange(branchIndex: number): void {
    this.generateBranchCode(branchIndex);
  }


  getStateGSTCode(StateMasterSid: number): string {
    if (!StateMasterSid || !this.stateList || this.stateList.length === 0) {
      return '';
    }

    const stateSid = Number(StateMasterSid);
    const state = this.stateList.find(s => s.StateMasterSid === stateSid);

    if (state && state.stateGSTCode) {
      return state.stateGSTCode;
    } else {
      return '';
    }
  }
  parseGST(gstin: string, digit: number): string {
    if (!gstin || gstin.length !== 15) return '';
    return gstin[digit];
  }
  initializeGSTINDigits(branchIndex: number, gstin: string): void {
    if (!gstin || gstin.length !== 15) return;

    const thirteenthDigitInput = document.getElementById(`thirteenthDigit_${branchIndex}`) as HTMLInputElement;
    const fifteenthDigitInput = document.getElementById(`fifteenthDigit_${branchIndex}`) as HTMLInputElement;

    if (thirteenthDigitInput) thirteenthDigitInput.value = gstin[12] || '';
    if (fifteenthDigitInput) fifteenthDigitInput.value = gstin[14] || '';
  }

  generateBranchCode(branchIndex: number): void {
  const branchForm = this.branches.at(branchIndex) as FormGroup;
  const branchName = branchForm.get('CustBranchName')?.value;
  const stateId = branchForm.get('CustBranchState')?.value;
  const cityId = branchForm.get('CustBranchCity')?.value;
  console.log('Generating branch code with:', { branchName, stateId, cityId }); 
  if (!branchName || !stateId || !cityId) {
    branchForm.get('CustBranchCode')?.setValue('');
    return;
  }

  const state = this.stateList?.find(s => s.StateMasterSid == stateId);
  const city = branchForm['cities']?.find((c: any) => c.CityMasterSid == cityId);
   console.log('Found state/city:', { state, city });
  if (!state || !city) {
    branchForm.get('CustBranchCode')?.setValue('');
    return;
  }

  // Ensure we have valid codes with fallbacks
  const namePart = (branchName.substring(0, 3) || 'BRN').trim().toUpperCase();
  const statePart = (state.stateCode?.substring(0, 3) || state.stateName?.substring(0, 3) || 'ST').trim().toUpperCase();
  const cityPart = (city.cityCode?.substring(0, 3) || city.cityName?.substring(0, 3) || 'CT').trim().toUpperCase();

  const branchCode = `${namePart}${statePart}${cityPart}`;
  console.log('Generated branch code:', branchCode); 
  branchForm.get('CustBranchCode')?.setValue(branchCode);
}
  validateEmailForm(emailForm: FormGroup): boolean {
    if (emailForm.invalid) {
      emailForm.markAllAsTouched();
      return false;
    }

    // Additional validation for department selection
    const departments = emailForm.get('DepartmentMasterSid')?.value;
    if (!departments || (Array.isArray(departments) && departments.length === 0)) {
      this.appSettingService.showWarning('Please select at least one department for the email');
      return false;
    }

    return true;
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
      CustomerShortCode: [{ value: '', disabled: true }],
      CustomerAliasName: [''],
      CustomerAddress1: ['', [Validators.required]],
      CustomerAddress2: [''],
      CountryMasterSid: ['', [Validators.required]],
      CompanyType: [''],
      PanAvailable: [false],
      PanType: [{ value: '', disabled: true }, [this.panValidator]],
      PanName: [{ value: '', disabled: true },],
      GroupName: [''],
      Website: [''],
      paymentType: [''],
      IsMSME: [''],
      KYCSpecified: [false],
      RegistrationNo: [''],
      Remarks: [''],
      status: [{ value: 'Active', disabled: !this.isEditMode }, Validators.required],
      CustomerType: [{}],
      Network: [''],
      cusMilestone: this.fb.array([]),
      cusSalesteam: this.fb.array([]),
      customerEmails: this.fb.array([]), // Add customer emails FormArray
      customerLogins: this.fb.array([]), // Add customer logins FormArray
      AirlineNumber: [''],
      AirlineCode: ['']
    });

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

  gstValidator(control: AbstractControl): ValidationErrors | null {
    const gstin = control.value;
    if (!gstin) return null;

    const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return GST_REGEX.test(gstin) ? null : { invalidGST: true };
  }

  panValidator(control: AbstractControl): ValidationErrors | null {
  const pan = control.value;
  if (!pan) return null;

  // Basic PAN format validation
  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!PAN_REGEX.test(pan)) {
    return { invalidPAN: true };
  }

  // Enhanced 4th character validation for holder type
  const fourthChar = pan[3]; // 4th character (0-based index)
  const companyType = this.customerForm?.get('CompanyType')?.value;
  
  const holderTypeValidation = this.validatePanHolderType(fourthChar, companyType);
  if (!holderTypeValidation.isValid) {
    return { 
      invalidPANHolderType: true,
      holderTypeMessage: holderTypeValidation.message
    };
  }

  return null;
}
private validatePanHolderType(fourthChar: string, companyType: string): { isValid: boolean; message: string } {
  const holderTypeMap: { [key: string]: { types: string[], description: string } } = {
    'C': { 
      types: ['Company', 'Limited Liability Company(LLC)', 'Limited Liability Partnership(LLP)'], 
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
    }
  };

  const holderInfo = holderTypeMap[fourthChar];
  
  if (!holderInfo) {
    return { 
      isValid: false, 
      message: `Invalid 4th character '${fourthChar}'. Valid characters: ${Object.keys(holderTypeMap).join(', ')}` 
    };
  }

  // If company type is selected, validate against it
  if (companyType && !holderInfo.types.includes(companyType)) {
    const expectedTypes = Object.entries(holderTypeMap)
      .filter(([char, info]) => info.types.includes(companyType))
      .map(([char, info]) => `${char} (${info.description})`)
      .join(', ');
    
    return { 
      isValid: false, 
      message: `4th character '${fourthChar}' (${holderInfo.description}) doesn't match selected company type '${companyType}'. Expected: ${expectedTypes}` 
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

  updateShortCodeFieldState() {
    const customerName = this.customerForm.get('CustomerName')?.value;
    const countryId = this.customerForm.get('CountryMasterSid')?.value;

    if (customerName && countryId) {
      this.customerForm.get('CustomerShortCode')?.enable();
    } else {
      this.customerForm.get('CustomerShortCode')?.disable();
    }
  }


  generateCustomerShortCode() {
    const customerName = this.customerForm.get('CustomerName')?.value;
    const countryId = this.customerForm.get('CountryMasterSid')?.value;

    if (!customerName || !countryId) {
      this.customerForm.get('CustomerShortCode')?.disable();
      this.customerForm.get('CustomerShortCode')?.setValue('');
      return;
    }

    const selectedCountry = this.countryList?.find(c => c.CountryMasterSid == countryId);
    if (!selectedCountry || !selectedCountry.countryCode) {
      this.customerForm.get('CustomerShortCode')?.disable();
      this.customerForm.get('CustomerShortCode')?.setValue('');
      return;
    }

    this.customerForm.get('CustomerShortCode')?.enable();

    const namePart = customerName.substring(0, 3).toUpperCase();
    const countryPart = selectedCountry.countryCode.slice(-3).toUpperCase();

    this.customerForm.get('CustomerShortCode')?.setValue(`${namePart}${countryPart}`);
  }

  isIndianCountry(): boolean {
  const countryId = this.customerForm.get('CountryMasterSid')?.value;
  if (!countryId) return false;
  const country = this.countryList?.find(c => c.CountryMasterSid == countryId);
  return country?.countryName?.toLowerCase().includes('india') || false;
}
shouldShowPanAvailable(): boolean {
  return this.isIndianCountry();
}

  isUaeCountry(): boolean {
    const countryId = this.customerForm.get('CountryMasterSid')?.value;
    if (!countryId) return false;
    const country = this.countryList?.find(c => c.CountryMasterSid == countryId);
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
getPanFormatDescription(): string {
  const companyType = this.customerForm.get('CompanyType')?.value;
  
  if (!companyType) {
    return 'PAN Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)';
  }

  const expectedChars = this.getExpectedPanFourthChars(companyType);
  
  if (expectedChars.length === 0) {
    return 'PAN Format: 5 letters + 4 digits + 1 letter';
  }

  const charDescriptions = expectedChars.map(char => {
    const holderTypeMap = {
      'C': 'Company',
      'P': 'Individual/Person',
      'H': 'HUF',
      'F': 'Firm',
      'A': 'AOP',
      'T': 'Trust',
      'B': 'BOI',
      'L': 'Local Authority',
      'J': 'Artificial Juridical Person',
      'G': 'Government'
    };
    return `${char} (${holderTypeMap[char] || char})`;
  });

  return `PAN Format: 3 letters + [${expectedChars.join('/')}] + 1 letter + 4 digits + 1 letter. Expected 4th character: ${charDescriptions.join(', ')}`;
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
    const country = this.countryList?.find(c => c.CountryMasterSid == countryId);
    const countryName = country?.countryName || '';

    panTypeControl?.clearValidators();

    if (countryName.toLowerCase().includes('india')) {
      panTypeControl?.setValidators([this.panValidator]);
      this.updateTaxIdLabel();
    }
    else if (countryName.toLowerCase().includes('uae') ||
      countryName.toLowerCase().includes('dubai') ||
      countryName.toLowerCase().includes('united arab emirates')) {
      panTypeControl?.setValidators([this.vatValidator]);
      this.updateTaxIdLabel();
    }
    else {
      panTypeControl?.setValidators([]);
      this.updateTaxIdLabel();
    }

    panTypeControl?.updateValueAndValidity();
  }
}



  updateTaxIdLabel(): void {
  const countryId = this.customerForm.get('CountryMasterSid')?.value;
  
  if (countryId) {
    const country = this.countryList?.find(c => c.CountryMasterSid == countryId);
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
  updateTaxIdFieldState(): void {
  const panAvailableControl = this.customerForm.get('PanAvailable');
  const panTypeControl = this.customerForm.get('PanType');
  const panNameControl = this.customerForm.get('PanName');

  // Subscribe to PAN available changes
  panAvailableControl?.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe((panAvailable: boolean) => {
      if (panAvailable) {
        panTypeControl?.enable();
        panNameControl?.enable();
        this.updateTaxIdFieldValidation();
      } else {
        panTypeControl?.disable();
        panNameControl?.disable();
        panTypeControl?.clearValidators();
        panTypeControl?.updateValueAndValidity();
        panTypeControl?.setValue('');
        panNameControl?.setValue('');
      }
    });
    
  // Initialize based on current value
  const currentPanAvailable = panAvailableControl?.value;
  if (currentPanAvailable) {
    panTypeControl?.enable();
    panNameControl?.enable();
  } else {
    panTypeControl?.disable();
    panNameControl?.disable();
  }
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
      panTypeControl?.disable();
      panNameControl?.disable();
    }
  }
  // Add other existing methods that are referenced
  getAllCountries() {
    this.masterService.getAllCountry().subscribe((res) => {
      this.countryList = res.data;
    });
  }
onCompanyTypeChange(): void {
  this.updateTaxIdFieldState();
  this.updateTaxIdFieldValidation();
  
  // Also update PAN validation when company type changes
  const panTypeControl = this.customerForm.get('PanType');
  if (panTypeControl?.value) {
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

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    if (currentMenuId && userRole) {
      this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions)
            .filter(key => this.currentMenuPermissions[key] === 'isTrue');
        }
      });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  // Fetch customer data and patch the form
  
loadCustomerData(customerId: number) {
  this.masterService.getCustomerById(customerId).subscribe(
    (customerData: any) => {
      this.customerData = customerData;
      this.customerName = customerData.CustomerName;
      this.status = customerData.status;
      
      // Convert backend status ('A', 'S') to frontend display values
      const formattedStatus = customerData.status === 'A' ? 'Active' : 'Suspended';
      
      let customerType = customerData.CustomerType;

      if (typeof customerType === 'string') {
        try {
          customerType = JSON.parse(customerType);
        } catch (e) {
          console.error('Error parsing CustomerType:', e);
          customerType = {};
        }
      }

      // Patch main customer form
      this.customerForm.patchValue({
        ...customerData,
        CountryMasterSid: customerData.countryMaster?.CountryMasterSid,
        status: formattedStatus,
        paymentType: customerData.CashCredit,
        KYCSpecified: customerData.RegistrationNo || customerData.CompanyType ? true : false,
        PanAvailable: customerData.PanType || customerData.PanName ? true : false,
        CustomerType: customerType,
        AirlineNumber: customerData.AirlineNumber || '',
        AirlineCode: customerData.AirlineCode || ''
      });

      // Handle customer types
      this.selectedStatus = this.modeOfCustomerType
        .filter(type => {
          const key = this.toCamelCase(type.name);
          return customerType[key] === 'isTrue';
        })
        .map(type => type.name);

      // FIX: Set isAirlineSelected based on loaded data
      this.isAirlineSelected = this.selectedStatus.includes('Air Line');
      
      console.log('Airline fields:', {
        AirlineNumber: customerData.AirlineNumber,
        AirlineCode: customerData.AirlineCode,
        isAirlineSelected: this.isAirlineSelected,
        selectedStatus: this.selectedStatus
      });

      // Load all data from the single API response
      this.loadAllCustomerDataFromResponse(customerData);
    },
    (error) => {
      this.appSettingService.showError('Error loading customer data.');
    }
  );
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
      salesman: this.masterService.getAllSalesperson(),
      docs: this.masterService.getAllDoc(),
      cs: this.masterService.getAllCS()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      ({ departments, salesman, docs, cs }) => {
        this.spDepartmentList = departments || [];
        this.departmentList = departments || []; // Also populate departmentList for email tab
        this.salesPersonList = salesman?.data || [];
        this.allCS = cs?.data || [];
        this.allDocs = docs?.data || [];

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

            // Add sales team data to form array
            resp.data.forEach((salesTeam: any) => {
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
    this.masterService.deleteSalesteamById(CustomerSalesSid).subscribe(
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
    if (CustomerMilestoneSid) {
      this.masterService.deleteCustomerMilestoneById(CustomerMilestoneSid).subscribe(
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

  // Save sales team data
  saveSalesTeamData(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.cusSalesteam.length === 0) {
        resolve({ success: true });
        return;
      }

      const salesTeamsPayload = this.prepareUpdateSalesTeamsPayload();

      if (salesTeamsPayload.length === 0) {
        resolve({ success: true });
        return;
      }

      const payload = {
        CustomerMasterSid: this.CustomerMasterSid,
        salesTeams: salesTeamsPayload
      };

      this.masterService.saveCustomerSalesTeam(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess('Sales team saved successfully');
            resolve({ success: true });
          } else {
            this.appSettingService.showError('Error saving sales team');
            reject({ success: false, message: 'Error saving sales team' });
          }
        },
        (error) => {
          console.error('Error saving sales team:', error);
          this.appSettingService.showError('Error saving sales team');
          reject({ success: false, error });
        }
      );
    });
  }

  // Save customer milestones
  saveCustomerMilestones(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.cusMilestone.length === 0) {
        resolve({ success: true });
        return;
      }

      const milestonesPayload = this.prepareUpdateMilestonesPayload();

      if (milestonesPayload.length === 0) {
        resolve({ success: true });
        return;
      }

      // Assuming there's a save method for milestones, similar to sales team
      // If not, this should be integrated into the main customer update
      resolve({ success: true });
    });
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

    if (emailSid) {
      if (confirm('Are you sure you want to delete this email?')) {
        this.masterService.deleteCustomerBranchEmailById(emailSid).subscribe({
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

    if (loginSid) {
      if (confirm('Are you sure you want to delete this login?')) {
        this.masterService.deleteCustomerLoginById(loginSid).subscribe({
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
  // This will trigger change detection for all branches
  this.cdRef.markForCheck();
}


  deleteSalesTeam(customerSalesSid: number, index: number) {
    const actualIndex = this.getActualSalesTeamIndex(index);
    if (customerSalesSid) {
      this.masterService.deleteSalesteamById(customerSalesSid).subscribe((resp: any) => {
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
  async onSubmit() {
    // Set loading state
    this.btnDisable = true;

    // Debug: Log email tab status
    console.log('=== Save operation started ===');
    console.log('Email tab entries:', this.customerEmails.length);
    console.log('Email tab data:', this.customerEmails.value);

    // Validate main customer form
    if (this.customerForm.invalid) {
      this.appSettingService.showWarning('Please fill all required fields in the Party section.');
      this.customerForm.markAllAsTouched();
      this.selectedTab = 'Party';
      this.btnDisable = false;
      return;
    }

    // Validate branches if any exist
    if (this.branches.length > 0) {
      const branchValidation = this.validateAllBranches();
      if (!branchValidation.isValid) {
        this.appSettingService.showWarning(branchValidation.message);
        this.selectedTab = 'Branch';
        this.btnDisable = false;
        return;
      }
    }

    // Validate sales team if in edit mode and any exist
    if (this.isEditMode && this.cusSalesteam.length > 0) {
      const salesTeamValidation = this.validateSalesTeam();
      if (!salesTeamValidation.isValid) {
        this.appSettingService.showWarning(salesTeamValidation.message);
        this.selectedTab = 'Salesman';
        this.btnDisable = false;
        return;
      }
    }

    // Validate milestones if in edit mode and any exist
    if (this.isEditMode && this.cusMilestone.length > 0) {
      const milestoneValidation = this.validateMilestones();
      if (!milestoneValidation.isValid) {
        this.appSettingService.showWarning(milestoneValidation.message);
        this.selectedTab = 'Milestone';
        this.btnDisable = false;
        return;
      }
    }

    try {
      if (this.isEditMode && this.CustomerMasterSid) {
        // UPDATE existing customer with all data
        const updatePayload = this.prepareUpdatePayload();
        await this.updateCustomerWithAllData(updatePayload);
      } else {
        // CREATE new customer with only customer and branches
        const createPayload = this.prepareCreatePayload();
        await this.createCustomerWithAllData(createPayload);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      this.appSettingService.showError('Error saving customer data');
    } finally {
      this.btnDisable = false;
    }
  }

  // Add this missing validation method
  private validateAllBranches(): { isValid: boolean; message: string } {
    if (this.branches.length === 0) {
      return { isValid: true, message: '' }; // No branches is valid
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

    const statusValue = formValue.status === 'Active' ? 'A' : 'S';

    return {
      customer: {
        CompanyMasterSid: activeCompanyId,
        CustomerName: formValue.CustomerName,
        CustomerShortCode: formValue.CustomerShortCode,
        CustomerAliasName: formValue.CustomerAliasName,
        CustomerAddress1: formValue.CustomerAddress1,
        CustomerAddress2: formValue.CustomerAddress2,
        CountryMasterSid: Number(formValue.CountryMasterSid),
        CustomerType: formValue.CustomerType,
        PanName: formValue.PanName,
        PanType: formValue.PanType,
        GroupName: formValue.GroupName,
        Website: formValue.Website,
        CashCredit: formValue.paymentType,
        Network: formValue.Network,
        Remarks: formValue.Remarks,
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
      const branchData = branchForm.value;
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
        ContactNo: String(branchData.CustBranchPhone),
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
      const contactData = contactForm.value;

      contactsPayload.push({
        ContactType: contactData.ContactType,
        ContactName: contactData.ContactName?.trim(),
        MobileNo: String(contactData.MobileNo),
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
      const loginData = loginForm.value;

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
  const formValue = this.customerForm.value;
  const currentUserEmail = this.getUserEmail();
  const activeCompanyId = this.currentCompany?.CompanyMasterSid;


  const statusValue = formValue.status === 'Active' ? 'A' : 'S';
  console.log(statusValue, 'statusValue')

  const payload = {
    customer: {
      CompanyMasterSid: activeCompanyId,
      CustomerName: formValue.CustomerName?.trim(),
      CustomerShortCode: formValue.CustomerShortCode?.trim(),
      CustomerAliasName: formValue.CustomerAliasName,
      CustomerAddress1: formValue.CustomerAddress1,
      CustomerAddress2: formValue.CustomerAddress2,
      CountryMasterSid:formValue.CountryMasterSid,
      CustomerType: formValue.CustomerType,
      PanName: formValue.PanName,
      PanType: formValue.PanType,
      GroupName: formValue.GroupName,
      Website: formValue.Website,
      CashCredit: formValue.paymentType,
      Network: formValue.Network,
      Remarks: formValue.Remarks,
      IsMSME: formValue.IsMSME ? 'A' : 'I',
      RegistrationNo: formValue.RegistrationNo,
      CompanyType: formValue.CompanyType,
      status: statusValue,
      AirlineNumber: formValue.AirlineNumber,
      AirlineCode: formValue.AirlineCode
    },
    customerBranches: this.prepareUpdateBranchesPayload(),
  };

  // Debug: Log the complete payload
  console.log('Complete update payload:', JSON.stringify(payload, null, 2));

  return payload;
}

  private prepareUpdateBranchesPayload(): any[] {
  const branchesPayload = [];

  for (let branchIndex = 0; branchIndex < this.branches.length; branchIndex++) {
    const branchForm = this.branches.at(branchIndex);
    const branchData = branchForm.value;
     console.log('Branch Data:', branchData); 
    console.log('CustBranchCode value:', branchData.CustBranchCode); 

    const branchPayload: any = {
      CustomerBranchSid: branchData.CustomerBranchSid,
      BranchName: branchData.CustBranchName?.trim(),
      StateMasterSid: branchData.CustBranchState,
      CityMasterSid: branchData.CustBranchCity,
      Branch_Type: branchData.CustBranchType,
      Branch_Code: branchData.CustBranchCode,
      Contact_Person: branchData.Contact_Person,
      Zip_PostBox: String(branchData.CustBranchZipPostCode),
      ContactNo: String(branchData.CustBranchPhone),
      Email: branchData.CustBranchEmail,
      Address: branchData.CustBranchAddress,
      Registered: branchData.CustBranchRegistered,
      CustomerGstType: branchData.CustBranchGSTtype,
      GSTNo: branchData.CustBranchGSTIN || '', 
      ...(branchData.CustBranchGSTIN && { GSTNo: branchData.CustBranchGSTIN }), // Only include if GST number exists
      status: branchData.status === 'Active' ? 'A' : 'S',

      customerBranchContacts: this.prepareUpdateContactsPayload(branchIndex),
      customerBranchEmails: this.prepareUpdateEmailsPayload(branchIndex),
      customerBranchLogins: this.prepareUpdateLoginsPayload(branchIndex),
      customerSalesTeams: this.prepareUpdateSalesTeamsPayload(branchData.CustomerBranchSid),
      customerMilestones: this.prepareUpdateMilestonesPayload(branchData.CustomerBranchSid)
    };
    console.log('Final Branch Payload:', branchPayload);
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
      const contactData = contactForm.value;

      const contactPayload: any = {
        ContactType: contactData.ContactType,
        ContactName: contactData.ContactName?.trim(),
        MobileNo: String(contactData.MobileNo),
        Email: contactData.Email,
        status: contactData.status === 'Active' ? 'A' : 'S'
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

  private prepareUpdateEmailsPayload(branchIndex: number): any[] {
    const emailsPayload = [];
    const processedEmailSids = new Set<number>(); // Track processed email SIDs to avoid duplicates

    // Get the branch SID for the current branch
    const branch = this.branches.at(branchIndex);
    const branchSid = branch.get('CustomerBranchSid')?.value;

    // Debug: Log current state
    console.log(`Preparing emails for branch ${branchIndex} (SID: ${branchSid})`);
    console.log('Total customerEmails:', this.customerEmails.length);

    // Process emails from the Email tab (customerEmails FormArray) for this specific branch
    // We'll prioritize Email tab data over branch tab data
    for (let i = 0; i < this.customerEmails.length; i++) {
      const emailForm = this.customerEmails.at(i);
      const emailData = emailForm.value;

      // Only include emails that belong to this branch
      if (emailData.CustomerBranchSid !== branchSid) {
        continue;
      }

      // Track this email SID if it exists
      if (emailData.CustomerBrEmailSid) {
        processedEmailSids.add(emailData.CustomerBrEmailSid);
      }

      // Ensure DepartmentMasterSid is always an array as expected by API
      let departmentValue = emailData.DepartmentMasterSid;
      if (!Array.isArray(departmentValue)) {
        // If it's a string (from old data), convert to array
        departmentValue = departmentValue ? [departmentValue] : [];
      }

      const emailPayload: any = {
        MenuMasterSid: Number(emailData.MenuMasterSid),
        DepartmentMasterSid: departmentValue, // Keep as array
        Toemail: emailData.Toemail,
        CCemail: emailData.CCemail,
        status: emailData.status === 'Active' ? 'A' : 'S'
      };

      // createdBy/updatedBy now handled automatically by backend via JWT token
      if (emailData.CustomerBrEmailSid) {
        emailPayload.CustomerBrEmailSid = emailData.CustomerBrEmailSid;
      }

      emailsPayload.push(emailPayload);
      console.log('Added email from Email tab:', emailPayload);
    }

    // Then, get emails from the branch's own emails FormArray (from Branch tab)
    // Only add those that haven't been processed from the Email tab
    const branchEmails = this.getEmails(branchIndex);
    for (let emailIndex = 0; emailIndex < branchEmails.length; emailIndex++) {
      const emailForm = branchEmails.at(emailIndex);
      const emailData = emailForm.value;

      // Skip if we already processed this email from the Email tab
      if (emailData.CustomerBrEmailSid && processedEmailSids.has(emailData.CustomerBrEmailSid)) {
        continue;
      }

      // Ensure DepartmentMasterSid is always an array as expected by API
      let departmentValue = emailData.DepartmentMasterSid;
      if (!Array.isArray(departmentValue)) {
        // If it's a string (from old data), convert to array
        departmentValue = departmentValue ? [departmentValue] : [];
      }

      const emailPayload: any = {
        MenuMasterSid: Number(emailData.MenuMasterSid),
        DepartmentMasterSid: departmentValue, // Keep as array
        Toemail: emailData.Toemail,
        CCemail: emailData.CCemail,
        status: emailData.status === 'Active' ? 'A' : 'S'
      };

      // createdBy/updatedBy now handled automatically by backend via JWT token
      if (emailData.CustomerBrEmailSid) {
        emailPayload.CustomerBrEmailSid = emailData.CustomerBrEmailSid;
      }

      emailsPayload.push(emailPayload);
      console.log('Added email from Branch tab:', emailPayload);
    }

    // Debug: Log the emails being sent
    if (emailsPayload.length > 0) {
      console.log(`Branch ${branchIndex} emails payload:`, emailsPayload);
    }

    return emailsPayload;
  }

  private prepareUpdateLoginsPayload(branchIndex: number): any[] {
    const loginsPayload = [];
    const processedLoginSids = new Set<number>(); // Track processed login SIDs to avoid duplicates

    // Get the branch SID for the current branch
    const branch = this.branches.at(branchIndex);
    const branchSid = branch.get('CustomerBranchSid')?.value;

    // Debug: Log current state
    console.log(`Preparing logins for branch ${branchIndex} (SID: ${branchSid})`);
    console.log('Total customerLogins:', this.customerLogins.length);

    // Process logins from the eLogin tab (customerLogins FormArray) for this specific branch
    // We'll prioritize eLogin tab data over branch tab data
    for (let i = 0; i < this.customerLogins.length; i++) {
      const loginForm = this.customerLogins.at(i);
      const loginData = loginForm.value;

      // Only include logins that belong to this branch
      if (loginData.CustomerBranchSid !== branchSid) {
        continue;
      }

      // Track this login SID if it exists
      if (loginData.CustomerLoginSid) {
        processedLoginSids.add(loginData.CustomerLoginSid);
      }

      const loginPayload: any = {
        LoginName: loginData.LoginName?.trim(),
        LoginEmail: loginData.LoginEmail,
        LoginPassword: loginData.LoginPassword,
        status: loginData.status === 'Active' ? 'A' : 'S'
      };

      // createdBy/updatedBy now handled automatically by backend via JWT token
      if (loginData.CustomerLoginSid) {
        loginPayload.CustomerLoginSid = loginData.CustomerLoginSid;
      }

      loginsPayload.push(loginPayload);
      console.log('Added login from eLogin tab:', loginPayload);
    }

    // Then, get logins from the branch's own logins FormArray (from Branch tab)
    // Only add those that haven't been processed from the eLogin tab
    const branchLogins = this.getLogins(branchIndex);
    for (let loginIndex = 0; loginIndex < branchLogins.length; loginIndex++) {
      const loginForm = branchLogins.at(loginIndex);
      const loginData = loginForm.value;

      // Skip if we already processed this login from the eLogin tab
      if (loginData.CustomerLoginSid && processedLoginSids.has(loginData.CustomerLoginSid)) {
        continue;
      }

      const loginPayload: any = {
        LoginName: loginData.LoginName?.trim(),
        LoginEmail: loginData.LoginEmail,
        LoginPassword: loginData.LoginPassword,
        status: loginData.status === 'Active' ? 'A' : 'S'
      };

      // createdBy/updatedBy now handled automatically by backend via JWT token
      if (loginData.CustomerLoginSid) {
        loginPayload.CustomerLoginSid = loginData.CustomerLoginSid;
      }

      loginsPayload.push(loginPayload);
      console.log('Added login from Branch tab:', loginPayload);
    }

    // Debug: Log the logins being sent
    if (loginsPayload.length > 0) {
      console.log(`Branch ${branchIndex} logins payload:`, loginsPayload);
    }

    return loginsPayload;
  }

  private prepareUpdateSalesTeamsPayload(branchSid?: number): any[] {
  if (this.cusSalesteam.length === 0) return [];
  const activeCompanyId = this.currentCompany?.CompanyMasterSid;
  const salesTeamsPayload = [];
  const salesTeams = this.cusSalesteam;

  for (let teamIndex = 0; teamIndex < salesTeams.length; teamIndex++) {
    const teamForm = salesTeams.at(teamIndex);
    const teamData = teamForm.value;

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
      CustomerBranchSid: teamData.branchSid ? Number(teamData.branchSid) : null // ✅ Fixed: use branchSid
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
    const milestones = this.cusMilestone;

    for (let mileIndex = 0; mileIndex < milestones.length; mileIndex++) {
      const mileForm = milestones.at(mileIndex);
      const mileData = mileForm.value;

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

      // createdBy/updatedBy now handled automatically by backend via JWT token
      if (mileData.CustomerMilestoneSid) {
        milestonePayload.CustomerMilestoneSid = mileData.CustomerMilestoneSid;
      }

      milestonesPayload.push(milestonePayload);
    }

    return milestonesPayload;
  }
  // Create customer with all data (same as before)
  private async createCustomerWithAllData(payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.masterService.createCustomer(payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.CustomerMasterSid = resp.data.CustomerMasterSid;
            this.isCustomerSaved = true;
            this.showAdditionalTabs = true;
          
          // Update tabs to show additional sections
          this.tabs = [
            { name: 'Party', icon: 'fas fa-address-card' },
            { name: 'Branch', icon: 'fas fa-code-branch' },
            { name: 'Salesman', icon: 'fas fa-flag-checkered' },
            { name: 'Email', icon: 'fas fa-envelope' },
            { name: 'eLogin', icon: 'fas fa-sign-in-alt' },
            { name: 'Milestone', icon: 'fas fa-rupee-sign' },
          ];
            this.appSettingService.showSuccess('Customer created successfully');
            this.router.navigate([`master/organization/entry/${this.CustomerMasterSid}`]);
            resolve();
          } else {
            this.appSettingService.showError(resp.message);
            reject(resp.message);
          }
        },
        error: (error) => {
          this.errorMessage = error.message;
          console.error('Error creating customer:', error);
          this.appSettingService.showError('Error creating customer');
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
    return new Promise(async (resolve, reject) => {
      try {
        // First update the customer and branches
        await new Promise<void>((res, rej) => {
          this.masterService.updateCustomerById(this.CustomerMasterSid, payload).subscribe({
            next: (resp: any) => {
              if (resp.status) {
                res();
              } else {
                rej(resp.message);
              }
            },
            error: (error) => {
              console.error('Error updating customer:', error);
              rej(error);
            }
          });
        });

        // Then save sales team data if any
        if (this.cusSalesteam.length > 0) {
          await this.saveSalesTeamData();
        }

        // Save milestones if any
        if (this.cusMilestone.length > 0) {
          await this.saveCustomerMilestones();
        }

        this.appSettingService.showSuccess('Customer updated successfully');

        // Reload the data to reflect changes
        this.loadCustomerData(this.CustomerMasterSid);
        this.loadCustomerSalesTeamData();
        this.loadCustomerMilestones();

        resolve();
      } catch (error) {
        this.errorMessage = error?.message || 'Error updating customer';
        console.error('Error updating customer:', error);
        this.appSettingService.showError('Error updating customer');
        reject(error);
      }
    });
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
      CustomerShortCode: { value: '', disabled: true },
      CustomerAliasName: '',
      CustomerAddress1: '',
      CustomerAddress2: '',
      CountryMasterSid: '',
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
      status: { value: 'Active', disabled: true },
      CustomerType: {},
      Network: ''
    });
     if (!this.isEditMode) {
    this.customerForm.get('status')?.disable();
  }

    // Reset selected statuses and customer types
    this.selectedStatus = [];
    this.displayedCustomerTypes = [];
    this.extraCustomerTypesCount = 0;

    // Reset form validation state
    this.customerForm.markAsUntouched();
    this.customerForm.markAsPristine();

    // Enable/disable fields based on initial conditions
    this.updateShortCodeFieldState();

    // Reset customer name reference
    this.customerName = '';
  }







  goBack() {
    this.router.navigate([`master/organization/list`]);
  }

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.CustomerMasterSid) return;

    this.masterService.getAuditLogsCustomer(
      'CustomerMaster',
      this.CustomerMasterSid.toString()
    ).subscribe({
      next: (logs: any[]) => {
        const ignoredFields = ['updatedOn', 'updatedBy']; // ✅ add more if needed later

        const formatFields = (val: any) => {
          if (!val) return [];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          if (Object.keys(obj).length === 0) return [];
          return Object.entries(obj)
            .filter(([key]) => !ignoredFields.includes(key)) // 🚫 exclude fields
            .map(([key, value]) => `${key}: ${value ?? 'NA'}`);
        };

        this.auditLogs = logs
          .map(log => ({
            ...log,
            oldValDisplay: formatFields(log.oldVal),
            newValDisplay: formatFields(log.newVal),
          }))
          .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);

        this.auditLogModalRef = this.modalService.open(modal, {
          centered: true,
          scrollable: true,
          windowClass: 'audit-log-modal'
        });
      },
      error: err => console.error('Error fetching audit logs:', err)
    });
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
  }


  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.CustomerMasterSid;

        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
  }

  openAuthority() {
    const MenuMasterSid = localStorage.getItem('currentMenuId');
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

 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}