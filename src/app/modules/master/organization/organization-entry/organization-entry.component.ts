import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  TemplateRef,
  ViewChild,
  OnInit
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
import { combineLatest, forkJoin } from 'rxjs';
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
import { debounceTime, distinctUntilChanged, switchMap, finalize, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-organization-entry',
  standalone: true,
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
    MultiSelectComponent
  ],
  templateUrl: './organization-entry.component.html',
  styleUrl: './organization-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }
  ],
})
export class OrganizationEntryComponent implements OnInit {
  // Existing properties
  page = 1;
  pageSize = 5;
  totalLengthOfBranch: number = 0;
  totalLengthOfBranchContact: number = 0;
  totalLengthOfBranchEmail: number = 0;
  totalLengthOfBranchLogin: number = 0;
  displayedCustomerTypes: any[] = [];
  extraCustomerTypesCount = 0;
  currentTaxIdLabel: string = 'PAN/VAT Number';
  duplicateMessage: string = '';
  

  selectedTab = 'Party';
  tabs = [
    { name: 'Party', icon: 'fas fa-user-tie' },
    { name: 'Branch', icon: 'fas fa-boxes' },
    { name: 'Milestone', icon: 'fas fa-rupee-sign' },
    { name: 'Salesman', icon: 'fas fa-flag-checkered' },
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
isCheckingDuplicates = false;


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



  // Sales team properties
  salesTeamList: any[];
  CustomerSalesSid: number;
  salespersonForm!: FormGroup;
  spDepartmentList: any[];
  spBranchList: any[];
  salesPersonList: any[];
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
  branchContactData: any;
  branchEmailData: any;
  branchLoginData: any;
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
  departmentList: any;
  customerBranchName: any;
  customerName: any;
  modeOfCountry = [
    { id: 'India', name: 'India' },
    { id: 'Singapore', name: 'Singapore' },
    { id: 'Canada', name: 'Canada' },
  ];
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
  customerBranchResults: any;
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

 ngOnInit(): void {
  // ✅ Get current company & branch
  this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
  this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

  // ✅ Get logged-in user profile
  const userProfile = this.appSettingService.getDecryptedUserProfile();
  if (userProfile) {
    this.userData = userProfile;
    this.checkPermissions();
  }

  // ✅ Initial data loads
  this.getAllCountries();
  this.initForm();
  this.initializePanFields();
  this.loadAllSpfields();
  this.loadDepartments();
  this.loadMenus();
  this.loadCustomerMilestones();
  this.getAllSpCustomerBranch();
  this.loadCustomerBranch();

  // ✅ If route has ID, switch to edit mode
  this.route.paramMap.subscribe((params) => {
    this.CustomerMasterSid = +params.get('id');
    if (this.CustomerMasterSid) {
      this.isEditMode = true;
      this.loadCustomerData(this.CustomerMasterSid);
      this.loadCustomerSalesTeam();
      this.loadCustomerBranch();
      this.loadMenus();
      this.getStatesByCountryId();
      this.loadCustomerMilestoneData();
    }
  });

  // ✅ Auto-generate short code when name changes
  this.customerForm.get('CustomerName')?.valueChanges.subscribe(() => {
    this.generateCustomerShortCode();
  });

  // ✅ React to country changes
  this.customerForm.get('CountryMasterSid')?.valueChanges.subscribe(() => {
    this.updateShortCodeFieldState();
    this.generateCustomerShortCode();
    this.updateTaxIdFieldValidation();
    this.updateTaxIdFieldState();
    this.getStatesByCountryId(); // Load states when country changes
  });

  // ✅ --- ONE-CALL DUPLICATE CHECK (name + code) ---
  const nameCtrl = this.customerForm.get('CustomerName');
  const codeCtrl = this.customerForm.get('CustomerShortCode');

  combineLatest([
    nameCtrl!.valueChanges.pipe(startWith(nameCtrl!.value)),
    codeCtrl!.valueChanges.pipe(startWith(codeCtrl!.value)),
  ])
    .pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      switchMap(([name, code]) => {
        // Skip API when both empty
        if ((!name || String(name).trim() === '') && (!code || String(code).trim() === '')) {
          this.setFieldErrorFlag(nameCtrl, 'customerNameTaken', false);
          this.setFieldErrorFlag(codeCtrl, 'customerCodeTaken', false);
          return [];
        }

        const payload = {
          CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
          customerName: name ? String(name).trim() : undefined,
          customerShortCode: code ? String(code).trim() : undefined,
          excludeCustomerMasterSid: this.isEditMode ? this.CustomerMasterSid : undefined,
        };

        this.isCheckingDuplicates = true;
        return this.masterService.checkCustomerUnique(payload).pipe(
          finalize(() => (this.isCheckingDuplicates = false))
        );
      })
    )
    .subscribe((res: any) => {
      if (!res) return;
      
      this.setFieldErrorFlag(nameCtrl, 'customerNameTaken', !!res.nameTaken);
      this.setFieldErrorFlag(codeCtrl, 'customerCodeTaken', !!res.codeTaken);
      if (res.nameTaken || res.codeTaken) {
    this.duplicateMessage = res.message;  // from backend
  } else {
    this.duplicateMessage = '';
  }
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
    this.selectedTab = tabName;
  }

  // Toggle branch accordion
  toggleBranch(index: number) {
    if (this.expandedBranches.has(index)) {
      this.expandedBranches.delete(index);
    } else {
      this.expandedBranches.add(index);
    }
  }

  isBranchExpanded(index: number): boolean {
    return this.expandedBranches.has(index);
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
      CustBranchCode: [{ value: data?.Branch_Code || '', disabled: true }],
      Contact_Person: [data?.Contact_Person || ''],
      CustBranchZipPostCode: [data?.Zip_PostBox || '', [Validators.maxLength(10)]],
      CustBranchPhone: [data?.ContactNo || '', [Validators.maxLength(15), this.phoneNumberValidator]],
      CustBranchEmail: [data?.Email || '', [Validators.required, EmailValidators.multipleEmails()]],
      CustBranchAddress: [data?.Address || '', [Validators.required]],
      CustBranchRegistered: [data?.Registered || 'Y', [Validators.required]],
      CustBranchGSTtype: [data?.CustomerGstType || '', [Validators.required]],
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

  // Add new branch
 addNewBranch() {
    const newBranch = this.addBranchFormGroup();
    this.branches.push(newBranch);
    this.expandedBranches.add(this.branches.length - 1);
    this.cdRef.detectChanges();
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
//   initCustomerBranchEmailForm() {
//   this.customerBranchEmailForm = this.fb.group({
//     CustomerBranchSid: [''],
//     MenuMasterSid: ['', [Validators.required]],
//     DepartmentMasterSid: [[], [Validators.required]],
//     BranchName: [{ value: this.customerBranchName || '', disabled: true }],
//     Toemail: ['', [Validators.required, EmailValidators.multipleEmails()]],
//     CCemail: ['', [EmailValidators.multipleEmails()]],
//   });
// }

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
  // Add this method to your component class
 togglePasswordVisibility(passwordFieldId: string): void {
    const passwordField = document.getElementById(passwordFieldId) as HTMLInputElement;
    if (passwordField) {
      if (passwordField.type === 'password') {
        passwordField.type = 'text';
      } else {
        passwordField.type = 'password';
      }
    }
  }
  // Remove branch
  removeBranch(branchIndex: number) {
    const branch = this.branches.at(branchIndex);
    const branchSid = branch.get('CustomerBranchSid')?.value;

    if (branchSid) {
      if (confirm('Are you sure you want to delete this branch?')) {
        this.masterService.deleteCustomerBranchById(branchSid).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess('Branch deleted successfully');
            this.branches.removeAt(branchIndex);
            this.expandedBranches.delete(branchIndex);
            this.updateExpandedBranchesAfterRemoval(branchIndex);
          },
          error: (error) => {
            this.appSettingService.showError('Error deleting branch');
          }
        });
      }
    } else {
      this.branches.removeAt(branchIndex);
      this.expandedBranches.delete(branchIndex);
      this.updateExpandedBranchesAfterRemoval(branchIndex);
    }
  }

  // Update expanded branches indices after removal
   private updateExpandedBranchesAfterRemoval(removedIndex: number) {
    const newExpandedBranches = new Set<number>();
    this.expandedBranches.forEach(index => {
      if (index < removedIndex) {
        newExpandedBranches.add(index);
      } else if (index > removedIndex) {
        newExpandedBranches.add(index - 1);
      }
    });
    this.expandedBranches = newExpandedBranches;
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


  // Save all branches
   saveAllBranches() {
  this.debugEmailData();
  if (this.branches.invalid) {
    this.appSettingService.showWarning('Please fill all required fields in the branches section.');
    this.markAllBranchesAsTouched();
    return;
  }

  const saveObservables = [];

  for (let i = 0; i < this.branches.length; i++) {
    const branchForm = this.branches.at(i);
    
    // Validate each email in this branch before proceeding
    const emails = this.getEmails(i).value;
    for (let j = 0; j < emails.length; j++) {
      const emailForm = this.getEmails(i).at(j) as FormGroup;
      if (!this.validateEmailForm(emailForm)) {
        this.appSettingService.showWarning(`Please fix errors in email ${j + 1} of branch ${i + 1}`);
        return;
      }
    }

    const branchData = branchForm.value;

    // Prepare branch payload
    const branchPayload = {
      CustomerMasterSid: this.CustomerMasterSid,
      CityMasterSid: Number(branchData.CustBranchCity),
      StateMasterSid: Number(branchData.CustBranchState),
      Branch_Code: branchData.CustBranchCode,
      Contact_Person: branchData.Contact_Person,
      BranchName: branchData.CustBranchName,
      Branch_Type: branchData.CustBranchType,
      Zip_PostBox: String(branchData.CustBranchZipPostCode),
      ContactNo: String(branchData.CustBranchPhone),
      Email: branchData.CustBranchEmail,
      Address: branchData.CustBranchAddress,
      Registered: branchData.CustBranchRegistered,
      CustomerGstType: branchData.CustBranchGSTtype,
      GSTNo: branchData.CustBranchGSTIN,
      status: branchData.status === "Active" ? "A" : "S",
      createdBy: branchData.CustomerBranchSid ? undefined : this.userData?.userEmail,
      updatedBy: branchData.CustomerBranchSid ? this.userData?.userEmail : undefined
    };

    if (branchData.CustomerBranchSid) {
      saveObservables.push(
        this.masterService.updateCustomerBranchById(branchData.CustomerBranchSid, branchPayload)
      );
    } else {
      saveObservables.push(this.masterService.createCustomerBranch(branchPayload));
    }
  }

  forkJoin(saveObservables).subscribe({
    next: (responses: any[]) => {
      let allSuccess = true;
      responses.forEach((resp, index) => {
        if (resp.status) {
          if (!this.branches.at(index).get('CustomerBranchSid')?.value && resp.data) {
            this.branches.at(index).get('CustomerBranchSid')?.setValue(resp.data.CustomerBranchSid);
          }
        } else {
          allSuccess = false;
          this.appSettingService.showError(`Error saving branch ${index + 1}: ${resp.message || 'Unknown error'}`);
        }
      });

      if (allSuccess) {
        this.appSettingService.showSuccess('All branches saved successfully');
        this.saveAllBranchDetails();
      }
    },
    error: (error) => {
      console.error('Error saving branches:', error);
      this.appSettingService.showError('Error saving branches: ' + error.message);
    }
  });
}

  // Save all branch details (contacts, emails, logins)
   
   private saveAllBranchDetails(): void {
  const detailObservables = [];

  for (let branchIndex = 0; branchIndex < this.branches.length; branchIndex++) {
    const branchForm = this.branches.at(branchIndex);
    const branchSid = branchForm.get('CustomerBranchSid')?.value;

    if (!branchSid) continue;

    // Save contacts
    const contacts = this.getContacts(branchIndex).value;
    contacts.forEach(contact => {
      const contactPayload = {
        CustomerMasterSid: this.CustomerMasterSid,
        CustomerBranchSid: branchSid,
        ContactType: contact.ContactType,
        MobileNo: String(contact.MobileNo),
        Email: contact.Email,
        ContactName: contact.ContactName,
        status: contact.status === "Active" ? "A" : "S",
        createdBy: contact.CusBranchContactSid ? undefined : this.userData?.userEmail,
        updatedBy: contact.CusBranchContactSid ? this.userData?.userEmail : undefined
      };

      if (contact.CusBranchContactSid) {
        detailObservables.push(
          this.masterService.updateCustomerBranchContactById(contact.CusBranchContactSid, contactPayload)
        );
      } else {
        detailObservables.push(this.masterService.createCustomerBranchContact(contactPayload));
      }
    });

    // Save emails - FIXED VERSION
    // Save emails
const emails = this.getEmails(branchIndex).value;
emails.forEach(email => {
  let departmentValue = email.DepartmentMasterSid;
  
  // Convert array to comma-separated string
  // if (Array.isArray(departmentValue)) {
  //   departmentValue = departmentValue.join(',');
  // } else if (typeof departmentValue === 'string' && departmentValue.startsWith('[')) {
  //   // Handle case where it might already be a stringified array
  //   try {
  //     const parsedArray = JSON.parse(departmentValue);
  //     if (Array.isArray(parsedArray)) {
  //       departmentValue = parsedArray.join(',');
  //     }
  //   } catch (e) {
  //     // If parsing fails, use as is
  //     console.warn('Failed to parse DepartmentMasterSid:', departmentValue);
  //   }
  // }
  
  // // Ensure it's not empty
  // if (!departmentValue || (Array.isArray(departmentValue) && departmentValue.length === 0)) {
  //   departmentValue = '';
  // }

  const emailPayload = {
    CustomerBranchSid: branchSid,
    MenuMasterSid: Number(email.MenuMasterSid),
    DepartmentMasterSid: departmentValue, // This should now be a comma-separated string
    Toemail: email.Toemail,
    CCemail: email.CCemail,
    status: email.status === "Active" ? "A" : "S",
    createdBy: email.CustomerBrEmailSid ? undefined : this.userData?.userEmail,
    updatedBy: email.CustomerBrEmailSid ? this.userData?.userEmail : undefined
  };

  if (email.CustomerBrEmailSid) {
    detailObservables.push(
      this.masterService.updateCustomerBranchEmailById(email.CustomerBrEmailSid, emailPayload)
    );
  } else {
    detailObservables.push(this.masterService.createCustomerBranchEmail(emailPayload));
  }
});

    // Save logins
    const logins = this.getLogins(branchIndex).value;
    logins.forEach(login => {
      const loginPayload = {
        CustomerMasterSid: this.CustomerMasterSid,
        CustomerBranchSid: branchSid,
        LoginName: login.LoginName,
        LoginEmail: login.LoginEmail,
        LoginPassword: login.LoginPassword,
        status: login.status === "Active" ? "A" : "S",
        createdBy: login.CustomerLoginSid ? undefined : this.userData?.userEmail,
        updatedBy: login.CustomerLoginSid ? this.userData?.userEmail : undefined
      };

      if (login.CustomerLoginSid) {
        detailObservables.push(
          this.masterService.updateCustomerLoginById(login.CustomerLoginSid, loginPayload)
        );
      } else {
        detailObservables.push(this.masterService.createCustomerLogin(loginPayload));
      }
    });
  }

  if (detailObservables.length > 0) {
    forkJoin(detailObservables).subscribe({
      next: (responses: any[]) => {
        let allSuccess = true;
        let errorCount = 0;
        
        responses.forEach((resp, index) => {
          if (!resp.status) {
            allSuccess = false;
            errorCount++;
            console.error(`Error saving detail at index ${index}:`, resp);
            
            // Log more details about the failing request
            if (index === 1) { // The specific failing email
              console.error('Failing email data:', this.getEmailDataAtIndex(1));
            }
          }
        });

        if (allSuccess) {
          this.appSettingService.showSuccess('All branch details saved successfully');
          this.loadCustomerBranch();
        } else {
          this.appSettingService.showWarning(`Saved with ${errorCount} error(s). Some details may not have been saved.`);
          // Reload data to show current state
          this.loadCustomerBranch();
        }
      },
      error: (error) => {
        console.error('Error saving branch details:', error);
        this.appSettingService.showError('Error saving some branch details');
      }
    });
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
    forkJoin([
      this.masterService.getAllCustomerBranches(),
      this.masterService.getAllCustomerBranchContacts(),
      this.masterService.getAllCustomerBranchEmail(),
      this.masterService.getAllCustomerLogin()
    ]).subscribe(([branches, contacts, emails, logins]) => {
      // Filter branches for current customer
      const customerBranches = branches.filter(
        (item) => item.CustomerMasterSid === this.CustomerMasterSid
      );

      // Clear existing form array
      this.branchFormArray = this.fb.array([]);

      // Populate form array with branch data and their details
      customerBranches.forEach(branch => {
        const branchContacts = contacts.filter(contact =>
          contact.CustomerBranchSid === branch.CustomerBranchSid
        );
        const branchEmails = emails.filter(email =>
          email.CustomerBranchSid === branch.CustomerBranchSid
        );
        const branchLogins = logins.filter(login =>
          login.CustomerBranchSid === branch.CustomerBranchSid
        );

        const branchWithDetails = {
          ...branch,
          contacts: branchContacts,
          emails: branchEmails,
          logins: branchLogins
        };

        const branchFormGroup = this.addBranchFormGroup(branchWithDetails);
        this.branches.push(branchFormGroup);

        // Load cities for this branch's state
        if (branch.StateMasterSid) {
          this.getCitiesByStateIdForBranch(this.branches.length - 1, branch.StateMasterSid);
          setTimeout(() => {
            if (branch.GSTNo) {
              this.initializeGSTINDigits(this.branches.length - 1, branch.GSTNo);
            }
          }, 100);
        }
      });
      this.getAllSpCustomerBranch();

      this.totalLengthOfBranch = this.branches.length || 0;
      this.cdRef.detectChanges();
    });
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
      this.spBranchList = resp.filter(
        (item) => item.CustomerMasterSid === this.CustomerMasterSid && 
                  (item.status === 'A' || item.status === 'Active')
      );
      
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
            this.cdRef.detectChanges();
          } else {
            console.error('Error fetching States with Country Id');
            this.stateList = [];
          }
        }
      );
    } else {
      this.stateList = [];
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
          branchForm['cities'] = resp.data;
          if (resp.data.length === 1) {
            branchForm.get('CustBranchCity')?.setValue(resp.data[0].CityMasterSid);
          }
          this.generateBranchCode(branchIndex);
          this.generateGST(branchIndex);
          this.cdRef.detectChanges();
        } else {
          console.error('Error fetching Cities with State Id');
          branchForm['cities'] = [];
        }
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

    if (!branchName || !stateId || !cityId) {
      branchForm.get('CustBranchCode')?.setValue('');
      return;
    }

    const state = this.stateList?.find(s => s.StateMasterSid == stateId);
    const city = branchForm['cities']?.find((c: any) => c.CityMasterSid == cityId);

    if (!state || !city) {
      branchForm.get('CustBranchCode')?.setValue('');
      return;
    }

    const namePart = branchName.substring(0, 3).trim().toUpperCase();
    const statePart = state.stateCode.substring(0, 3).trim().toUpperCase();
    const cityPart = city.cityCode.substring(0, 3).trim().toUpperCase();

    branchForm.get('CustBranchCode')?.setValue(`${namePart}${statePart}${cityPart}`);
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



  getCitiesByStateId(state){
    // To handle when we click clear
    this.cityList = [];

    if (this.customerBranchForm.get('CustBranchCity')?.value) {
      this.customerBranchForm.get('CustBranchCity')?.reset();
      this.customerBranchForm.get('CustBranchCity').markAsTouched();
    }
    
    let stateId : any;

    // Handle Invalid Case
    if(!state){
      return;
    }
    
    // Handle Event happened on Selecting Dropdown
    if(state instanceof Event){
      let element = state.target as HTMLSelectElement;
      stateId = element.value;
    } 
    // Used on Patching Value
    else {
      stateId = state;
    }

    this.leadService.getCityByStateId(stateId).subscribe(
      (resp:any)=>{
        if(resp.status){
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
        this.cdRef.detectChanges();
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
      CustomerShortCode: [{ value: '', disabled: true }, [Validators.required]],
      CustomerAliasName: [''],
      CustomerAddress1: ['', [Validators.required]],
      CustomerAddress2: [''],
      CountryMasterSid: ['', [Validators.required]],
      CompanyType: [''],
      PanAvailable: [false],
      PanType: [{ value: '', disabled: true }, [this.panValidator]],
      PanName: [{ value: '', disabled: true }],
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
    
    const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return PAN_REGEX.test(pan) ? null : { invalidPAN: true };
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
    this.isAirlineSelected = this.selectedStatus.includes('Air Line');
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
    if (errors['invalidPAN']) return 'Invalid PAN format. Format: AAAAA9999A';
    if (errors['invalidVAT']) return 'Invalid VAT format. Should be 15 digits starting with 1-9';
    if (errors['required']) return 'Required';
    return 'Invalid format';
  }

  updateTaxIdFieldValidation(): void {
    const panTypeControl = this.customerForm.get('PanType');
    const countryId = this.customerForm.get('CountryMasterSid')?.value;
    
    if (countryId) {
      const country = this.countryList?.find(c => c.CountryMasterSid == countryId);
      const countryName = country?.countryName || '';
      
      panTypeControl?.clearValidators();
      
      if (countryName.toLowerCase().includes('india')) {
        panTypeControl?.setValidators([Validators.required, this.panValidator]);
        this.updateTaxIdLabel('PAN Number');
      }
      else if (countryName.toLowerCase().includes('uae') || 
               countryName.toLowerCase().includes('dubai') ||
               countryName.toLowerCase().includes('united arab emirates')) {
        panTypeControl?.setValidators([Validators.required, this.vatValidator]);
        this.updateTaxIdLabel('VAT Number');
      }
      else {
        panTypeControl?.setValidators([Validators.required]);
        this.updateTaxIdLabel('Tax Identification Number');
      }
      
      panTypeControl?.updateValueAndValidity();
    }
  }

updateTaxIdLabel(label: string): void {
 
  this.currentTaxIdLabel = label;
}
 updateTaxIdFieldState(): void {
    this.customerForm.get('PanAvailable')?.valueChanges.subscribe((panAvailable: boolean) => {
      const panType = this.customerForm.get('PanType');
      const panName = this.customerForm.get('PanName');
      
      if (panAvailable) {
        panType?.enable();
        panName?.enable();
        this.updateTaxIdFieldValidation();
      } else {
        panType?.disable();
        panName?.disable();
        panType?.clearValidators();
        panType?.updateValueAndValidity();
        panType?.setValue('');
        panName?.setValue('');
      }
    });
  }
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

  loadDepartments() {
    const companyMastersID = this.currentCompany?.CompanyMasterSid;
    this.masterService.getAllDepartments(companyMastersID).subscribe((res) => {
      this.departmentList = res;
    });
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

  // Fetch customer data and patch the form
  loadCustomerData(customerId: number) {
    this.masterService.getCustomerById(customerId).subscribe(
      (customerData: any) => {
        this.customerData = customerData;
        this.customerName = customerData.CustomerName;
        this.status = customerData.status;
        const formattedStatus = this.statusMap[customerData.status] || customerData.status;
        let customerType = customerData.CustomerType;
        if (typeof customerType === 'string') {
          try {
            customerType = JSON.parse(customerType);
          } catch (e) {
            console.error('Error parsing CustomerType:', e);
            customerType = {};
          }
        }
        this.customerForm.patchValue({
          ...customerData,
          CountryMasterSid: customerData.CountryMasterSid,
          status: formattedStatus,
          paymentType: customerData.CashCredit,
          KYCSpecified: customerData.RegistrationNo || customerData.CompanyType ? true : false,
          PanAvailable: customerData.PanType || customerData.PanName ? true : false,
          CustomerType: customerType,
           AirlineNumber: customerData.AirlineNumber || '',
        AirlineCode: customerData.AirlineCode || ''
        });
        
        setTimeout(() => {
          if (!customerData.CustomerShortCode) {
            this.generateCustomerShortCode();
          }
        });

        this.selectedStatus = this.modeOfCustomerType
          .filter(type => {
            const key = this.toCamelCase(type.name);
            return customerType[key] === 'isTrue';
          })
          .map(type => type.name);
        this.loadCustomerBranch();
        console.log('CustomerType loaded:', customerType);
        console.log('Selected statuses:', this.selectedStatus);
      },
      (error) => {
        this.appSettingService.showError('Error loading customer data.');
      }
    );
  }

   loadCustomerSalesTeam() {
    this.masterService.getCustomerSalesTeam(this.CustomerMasterSid).subscribe((resp: any) => {
      if (resp.status) {
        const salesTeamData = resp.data || [];
        this.selectedCustomerBranch = salesTeamData.flatMap(st => st.branches || []);
        console.log(this.selectedCustomerBranch);
        this.cusSalesteam.clear();
        salesTeamData.forEach(salesteam => {
          this.cusSalesteam.push(this.createSalesTeamFormGroup(salesteam));
        });
        this.updateSalesTeamPagination();
      } else {
        this.appSettingService.showError('Error loading Customer Sales Team');
      }
    });
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
        this.loadCustomerMilestoneData();
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
loadCustomerMilestoneData() {
  if (!this.CustomerMasterSid) {
    console.log('No CustomerMasterSid available for loading customer milestones');
    return;
  }

  console.log('Loading customer milestones for CustomerMasterSid:', this.CustomerMasterSid);

  this.masterService.getAllCustomerMilestone(this.CustomerMasterSid).subscribe(
    (resp: any) => {
      console.log('Customer milestones API response:', resp);
      if (resp.status) {
        this.cusMilestoneList = resp.data || [];
        console.log('Customer milestones loaded:', this.cusMilestoneList.length, 'items');
        
        // Clear and rebuild the form array
        this.cusMilestone.clear();
        
        this.cusMilestoneList.forEach(milestone => {
          const formWithData = this.createCusMilestoneFormGrp(milestone);
          this.cusMilestone.push(formWithData);
        });
        
        this.updateCustomerMilestonePagination();
        this.cdRef.detectChanges();
        
        console.log('Form array after loading:', this.cusMilestone.length, 'items');
      } else {
        console.error('Error loading customer milestones:', resp.message);
        this.appSettingService.showError('Error loading Customer Milestones: ' + (resp.message || 'Unknown error'));
      }
    },
    (error) => {
      console.error('Error in customer milestones API call:', error);
      this.appSettingService.showError('Error loading Customer Milestones');
    }
  );
}

  loadAllSpfields(){
     const companyMastersID = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      departments : this.masterService.getAllDepartments(companyMastersID),
      salesman : this.masterService.getAllSalesperson(),
      docs : this.masterService.getAllDoc(),
      cs : this.masterService.getAllCS()
    }).subscribe(({departments,salesman,docs,cs})=>{
      this.spDepartmentList = departments;
      this.salesPersonList = salesman.data;
      this.allCS = cs.data;
      this.allDocs = docs.data;
    })
  }

   saveAllCusMilestones() {
  if (this.cusMilestone.invalid) {
    this.appSettingService.showWarning('Please fill all the required fields correctly');
    this.cusMilestone.controls.forEach((group: FormGroup) => {
      group.markAllAsTouched();
      group.updateValueAndValidity();
    });
    return;
  }
  
  const formValue = this.cusMilestone.value;
  const currentUserEmail = this.userData?.userEmail;
  
  const payload = formValue.map(form => {
    return {
      CustomerMilestoneSid: form.CustomerMilestoneSid,
      CustomerMasterSid: this.CustomerMasterSid,
      MilestoneMasterSid: form.MilestoneMasterSid,
      UpdateType: form.UpdateType,
      ContactInfo: form.ContactInfo,
      EffectiveFrom: form.EffectiveFrom,
      Status: form.Status === "Active" ? "A" : "S",
      createdBy: form.CustomerMilestoneSid ? undefined : currentUserEmail,
      updatedBy: form.CustomerMilestoneSid ? currentUserEmail : undefined
    };
  });

  console.log('Saving milestones payload:', payload);

  this.masterService.saveAllCustomerMilestones(payload).subscribe(
    (resp: any) => {
      if (resp.status) {
        this.appSettingService.showSuccess('Milestones saved successfully');
        this.loadCustomerMilestones(); // Reload to get updated data
      } else {
        this.appSettingService.showError('Error saving Milestones: ' + (resp.message || 'Unknown error'));
      }
    },
    (error) => {
      console.error('Error saving Milestones', error);
      this.appSettingService.showError('Error saving Milestones');
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
  updateCustomerMilestonePagination() {
  const totalItems = this.cusMilestone.length;
  this.totalCusMilePages = Math.ceil(totalItems / this.cusMilePageSize);

  const startIndex = (this.cusMilePage - 1) * this.cusMilePageSize;
  const endIndex = startIndex + this.cusMilePageSize;

  this.slicedCusMilestoneList = this.cusMilestone.controls.slice(startIndex, endIndex);
  this.cdRef.detectChanges(); // Force update
}
   createCusMilestoneFormGrp(data?: any) {
  const formGroup = this.fb.group({
    CustomerMilestoneSid: [data?.CustomerMilestoneSid || null],
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


  onAddMilestone(){
    const newGrp = this.createCusMilestoneFormGrp();
    this.cusMilestone.push(newGrp);
    this.updateCustomerMilestonePagination();
    this.cdRef.detectChanges();
  }
  saveAllCustomerSalesTeam() {
  if (this.cusSalesteam.invalid) {
    this.appSettingService.showWarning('Please fill all required fields in the sales team section.');
    this.cusSalesteam.markAllAsTouched();
    return;
  }

  const currentUserEmail = this.userData?.userEmail;
  const companyMasterSid = this.currentCompany?.CompanyMasterSid;

  const payload = this.cusSalesteam.value.map(salesteam => {
    const branches = (salesteam.branches || []).map(branch => {
      const branchSid = branch.customerBranchSid ?? branch;

      const saleBranchFromResp = this.selectedCustomerBranch.find(
        b => b.customerBranchSid === branchSid
      );

      return {
        id: saleBranchFromResp ? saleBranchFromResp.id : null,
        customerBranchSid: branchSid
      };
    });

    return {
      CustomerSalesSid: salesteam.CustomerSalesSid,
      CompanyMasterSid: companyMasterSid,
      CustomerMasterSid: this.CustomerMasterSid,
      DepartmentMasterSid : salesteam.DepartmentMasterSid,
      Salesman: salesteam.Salesman,
      CSPerson: salesteam.CSPerson,
      DocPerson: salesteam.DocPerson,
      EffectiveFrom: salesteam.EffectiveFrom,
      status: salesteam.status === 'Active' ? 'A' : 'S',
      createdBy: salesteam.CustomerSalesSid ? undefined : currentUserEmail,
      updatedBy: salesteam.CustomerSalesSid ? currentUserEmail : undefined,
      branches: branches
    };
  });

  console.log('Payload to save:', payload);

  this.masterService.saveCustomerSalesTeam(payload).subscribe(
    (resp: any) => {
      if (resp.status) {
        this.appSettingService.showSuccess('Sales team saved successfully');
        this.loadCustomerSalesTeam();
      } else {
        this.appSettingService.showError('Error saving sales team');
      }
    },
    (error) => {
      console.error('Error saving sales team', error);
      this.appSettingService.showError('An unexpected error occurred.');
    }
  );
}


  findSalesmanName(id : number){
    if(!this.salesPersonList){
      return;
    }
    const user = this.salesPersonList.find(person => person.UserMasterSid === id );
    if(user){
      return user.userName;
    }
    return ''
  }

  deleteSalesman(CustomerSalesSid : number){
    this.masterService.deleteSalesteamById(CustomerSalesSid).subscribe(
      (resp:any)=>{
        if(resp.status){
          this.appSettingService.showSuccess('Salesman Deleted Successfully')
          this.loadCustomerSalesTeam();
        } else {
          this.appSettingService.showError('Error Deleting Salesman');
        }
      },
      (error)=>{
        console.error('Error Deleting Salesman',error);
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

  deleteCustomerMilestone(CustomerMilestoneSid:number,index:number){
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
    return this.fb.group({
      CustomerSalesSid: [data?.CustomerSalesSid || null],
      DepartmentMasterSid: [data?.DepartmentMasterSid || null],
      Salesman: [data?.Salesman || null, [Validators.required]],
      branches: [data?.branches?.map(b => b.customerBranchSid) || [], [Validators.required, Validators.minLength(1)]],
      CSPerson: [data?.CSPerson || null],
      DocPerson: [data?.DocPerson || null],
      EffectiveFrom: [data ? new Date(data.EffectiveFrom) : new Date()],
      status: [data ? (data.status === 'A' ? 'Active' : 'Suspended') : 'Active'],
    });
  }



  onAddSalesTeam() {
    this.cusSalesteam.push(this.createSalesTeamFormGroup());
    this.updateSalesTeamPagination();
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
  onSubmit() {
    if (this.customerForm.disabled) {
    this.customerForm.enable();
  }
  
    let createdBy = {
      createdBy: this.appSettingService.userSettingSource.value['userEmail'],
    };
    let updatedBy = {
      updatedBy: this.appSettingService.userSettingSource.value['userEmail'],
    };
    let activeCompanyId  = this.currentCompany.CompanyMasterSid;
    const formValue = this.customerForm.value;
    const statusValue = formValue.status === 'Active' ? 'A' : 
                     formValue.status === 'Suspended' ? 'S' : 
                     formValue.status;
    const selectedPaymentType = this.customerForm.value.paymentType;
    console.log(formValue, 'formValue');
    const payload = this.isEditMode
      ? {
        CompanyMasterSid : activeCompanyId,
        CustomerName: formValue.CustomerName,
        CustomerShortCode: formValue.CustomerShortCode,
        CustomerAliasName: formValue.CustomerAliasName,
        CustomerAddress1: formValue.CustomerAddress1,
        CustomerAddress2: formValue.CustomerAddress2,
        LocalLanguage: formValue.LocalLanguage,
        PanType: formValue.PanType,
        PanName: formValue.PanName,
        GroupName: formValue.GroupName,
        Website: formValue.Website,
        Network: formValue.Network,
        Remarks: formValue.Remarks,
        AirlineNumber: formValue.AirlineNumber,
      AirlineCode: formValue.AirlineCode,
        CountryMasterSid: Number(formValue.CountryMasterSid),
        CustomerType: formValue.CustomerType,
        CashCredit: selectedPaymentType,
        IsMSME: formValue.IsMSME ? 'A' : 'I',
        CompanyType: formValue.CompanyType,
        RegistrationNo: formValue.RegistrationNo,
        ...updatedBy,
        status: statusValue,
      }
      : {
        CompanyMasterSid : activeCompanyId,
        CustomerName: formValue.CustomerName,
        CustomerShortCode: formValue.CustomerShortCode,
        CustomerAliasName: formValue.CustomerAliasName,
        CustomerAddress1: formValue.CustomerAddress1,
        CustomerAddress2: formValue.CustomerAddress2,
        LocalLanguage: formValue.LocalLanguage,
        PanType: formValue.PanType,
        PanName: formValue.PanName,
        GroupName: formValue.GroupName,
        Website: formValue.Website,
        Network: formValue.Network,
        Remarks: formValue.Remarks,
        CountryMasterSid: Number(formValue.CountryMasterSid),
        CustomerType: formValue.CustomerType,
        CashCredit: selectedPaymentType,
        IsMSME: formValue.IsMSME ? 'A' : 'I',
        CompanyType: formValue.CompanyType,
        RegistrationNo: formValue.RegistrationNo,
         AirlineNumber: formValue.AirlineNumber,
      AirlineCode: formValue.AirlineCode,
        ...createdBy,
        status: statusValue,
      };

    if (this.isEditMode) {
      this.masterService
        .updateCustomerById(this.CustomerMasterSid, payload)
        .subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate([`master/organization/entry/${this.CustomerMasterSid}`]);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading country:', error);
          }
        );
    } else {
      this.masterService.createCustomer(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate([`master/organization/entry/${resp.data.CustomerMasterSid}`]);
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading country:', error);
        }
      );
    }
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
    status: { value: 'Active', disabled: !this.isEditMode },
    CustomerType: {},
    Network: ''
  });

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
    history.back();
  }

  openAuditLogs(modal: TemplateRef<any>) {
  if (!this.CustomerMasterSid) return;

  this.masterService.getAuditLogsCustomer(
    'CustomerMaster',
    this.CustomerMasterSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['updatedOn','updatedBy']; // ✅ add more if needed later

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


  // Add other utility methods
  getStateName(stateSid: number): string {
    if (!this.stateList) return '';
    const state = this.stateList.find((s) => s.StateMasterSid === stateSid);
    return state ? state.stateName : '';
  }

  getCityName(citySid: number): string {
    if (!this.cityList) return '';
    const city = this.cityList.find((c) => c.CityMasterSid === citySid);
    return city ? city.cityName : '';
  }

  getBranchName(CustomerBranchSid: number): string {
    if (!this.customerBranchData) return '';
    return (
      this.customerBranchData.find(
        (c) => c.CustomerBranchSid === CustomerBranchSid
      )?.BranchName || ''
    );
  }

  getMenuName(menuSid: number): string {
    if (!this.menuList) return '';
    const menu = this.menuList.find(m => m.MenuMasterSid === menuSid);
    return menu ? menu.MenuName : '';
  }

  getDepartmentName(DepartmentMasterSid: number): string {
    if (!this.departmentList) return '';
    return (
      this.departmentList.find(
        (c) => c.DepartmentMasterSid === DepartmentMasterSid
      )?.departmentName || ''
    );
  }
}