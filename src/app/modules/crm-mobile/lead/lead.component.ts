import { CommonModule, DatePipe } from '@angular/common';
import { Component, effect, OnInit, TemplateRef } from '@angular/core';
import { NgbAccordionModule, NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { LeadService } from '../Services/lead.service';
import { City } from '../Interfaces/city.interface';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { FeatherModule } from 'angular-feather';
import { ActivatedRoute, Router } from '@angular/router';
// import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
// import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { forkJoin, Subject } from 'rxjs';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { EdocComponent } from '../../settings/edoc/edoc/edoc.component';
import { AuthorityEntryComponent } from '../../master/authority/authority-entry/authority-entry.component';
import { EmailEntryComponent } from '../../settings/email/email-entry/email-entry.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';
import { AppService } from 'src/app/service/app.service';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { LeadStatus } from 'src/app/common/helper';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { MasterService } from '../../master/master.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { CommonService } from 'src/app/common/common.service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from '../../settings/follow-up/follow-up/follow-up.component';
import { DialCodeDropdownComponent } from 'src/app/component/dial-code-dropdown/dial-code-dropdown.component';
import { DocReferenceComponent } from '../../operation/doc-reference/doc-reference.component';


@Component({
  selector: 'app-lead',
  standalone: true,
  imports: [
    NgbAccordionModule,
    NgbDropdownModule,
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    PreventMultiClickDirective,
    NgSelectModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    OnlyTextDirective,
    DatePipe,
    TextWithNumbersDirective,
    DecimalPrecisionDirective,
    EdocComponent,
    SearchableDropdown,
    OnlyNumbersDirective,
    DialCodeDropdownComponent
    // NgxIntlTelInputModule
  ],
  templateUrl: './lead.component.html',
  styleUrl: './lead.component.scss'
})
export class LeadComponent implements OnInit {
  private destroy$ = new Subject<void>();
  leadForm!: FormGroup;
  isEditMode = false; // Flag for edit mode
  citys: City[] = [];        // Array to store the leads
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  PreCustomerMasterSid: number;
  companyList: any[];
  countryList: any[];
  stateList: any[];
  cityList: any[];
  permissions: string[] = [];
	currentMenuPermissions: any = {};
  leadData: any;
  currentCompany: any;
  currentBranch: any;
  userData: any;
  // Add these properties to your component
isLoadingStates = false;
isLoadingCities = false;
  customerByOptions = ['Email', 'Advertisement', 'Website', 'Others'];
  leadSourceList = ['Email', 'Advertisement', 'Website', 'Inquiries', 'Referrals', "Trade shows", "Cold calls", "Social media", 'Others']
  statusList = ["Active", "Suspended"];
  // CountryISO = CountryISO;
  // PhoneNumberFormat = PhoneNumberFormat;
  // SearchCountryField = SearchCountryField;
  // separateDialCode = true;
  // preferredCountries: CountryISO[] = [CountryISO.UnitedStates, CountryISO.UnitedKingdom, CountryISO.India, CountryISO.Canada, CountryISO.Malaysia, CountryISO.SriLanka, CountryISO.UnitedArabEmirates, CountryISO.Singapore, CountryISO.Qatar, CountryISO.Kuwait, CountryISO.Australia];
  isMobile: boolean = false;
  // collapsed: any;
  items = [
    { collapsed: false },
    { collapsed: true },
    // More items as needed
  ];
  currentMenuId: number;
  TandCList: any;
  currentClauseId: any;

  trackByFn(index: number, item: any): any {
    return item;
  }

  readonly EARLY_STATUSES = ['Discovery', 'Qualify'];
  readonly LOCK_AFTER_STATUS = 'Meeting Scheduled';



  modeOfPreferredContactMode = [
    { id: "1", name: "Email" },
    { id: "2", name: "Phone" },
    { id: "3", name: "Text" }
  ]

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
  ]

  countryLookupConfig = DROPDOWN_CONFIGS.COUNTRY;
  stateLookupConfig = DROPDOWN_CONFIGS.STATE;
  cityLookupConfig = DROPDOWN_CONFIGS.CITY;


  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

MenuMasterSid:any
  leads = [{ id: 1, name: 'Lead 001' }]; // Initial lead

  constructor(
    public mps : MenuPermissionService,
    private fb: FormBuilder,
    private leadService: LeadService,
    private appService: AppService,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    public dropdownStore:DropdownStore,
    private commonService: CommonService,
    private ngbModal: NgbModal
  ) { 
    effect(()=> {
      const countryData = this.dropdownStore.countries();
      const cityData = this.dropdownStore.cities();
      this.countryList = countryData;
      this.cityList = (cityData || []).map(c => ({...c,State : c.stateMaster?.stateName,Country : c.countryMaster?.countryName}));
    })
  }

  ngOnInit(): void {

    const currentCompanyInfo = this.appSettingService.getCurrentCompanyInfo();
    const currentBranchInfo = this.appSettingService.getCurrentBranchInfo();
    console.log("Current Company Info", currentCompanyInfo);
    console.log("Current Branch Info", currentBranchInfo);
    this.loadAllFields()
    this.initForm();
    this.isMobile = this.appService.getDevice()
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
    console.info(this.currentBranch, this.userData, 'userData')
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.mps.init().subscribe();

    console.log("Current Company", this.currentCompany);
    console.log("Current Branch", this.currentBranch);


    // Subscribe to route params and load lead if ID exists
    this.route.paramMap.subscribe(params => {
      this.PreCustomerMasterSid = +params.get('id');
      if (this.PreCustomerMasterSid) {
        this.isEditMode = true;
        this.loadLeadData(this.PreCustomerMasterSid);
      }
      else {
        // 👇 Only patch default Country when creating new
        if (currentCompanyInfo?.CountryMasterSid) {
          this.leadForm.patchValue({
            CountryMasterSid: currentCompanyInfo?.CountryMasterSid
          });
          this.updatePhoneCodeByCountry(currentCompanyInfo?.CountryMasterSid, true);
          this.filterStateByCountryId({ CountryMasterSid: currentCompanyInfo?.CountryMasterSid })
        }
      }

      

    });


    this.leadForm.get('isQualify')?.valueChanges.subscribe((checked: boolean) => {

  // 🚫 Do NOT auto-change status when status is locked
  if (
    this.isEditMode &&
    this.leadForm.get('leadStatus')?.disabled
  ) {
    return;
  }

  this.leadForm.get('leadStatus')?.setValue(
    checked ? 'Qualify' : 'Discovery',
    { emitEvent: false }
  );
});

  }

  // // Method to load the city data
  // loadCity(): void {
  //   this.leadService.getAllCity().subscribe(
  //     (resp: City[]) => {
  //       console.log(resp, 'Cities')
  //       this.citys = resp['data'];  // On success, store the leads data in the component
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;  // On error, store the error message
  //       console.error('Error loading leads:', error);  // Optionally log the error
  //     }
  //   );
  // }

  // Initialize the Form
  initForm() {
    this.leadForm = this.fb.group({
      preCustomerName: ['', [Validators.required]],
      leadReferredBy: ['', [Validators.required]],
      leadFrom: ['', [Validators.required]],
      preCustomerType: [],
      preCustomerAddress1: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9#\/\s,.\-]+$/)
                       // only letters, numbers, space
      ]],

      preCustomerAddress2: [''],
      POBOX: [''],
      CountryMasterSid: [, [Validators.required]],
      StateMasterSid: [, [Validators.required]],
      CityMasterSid: [, [Validators.required]],
      contactPerson: ['', [Validators.required]],
      email: ['', [Validators.required, EmailValidators.multipleEmails(), Validators.maxLength(100)]],
      phoneCode: [DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData)],
      phone: ['',[Validators.required,Validators.maxLength(15), this.phoneNumberValidator]],
      leadStatus: [{ value: LeadStatus.Discovery, disabled: true }],
      PreferredContactMode: ['Email'],
      LanguagePreferrence: ['', [
  Validators.maxLength(100),
  this.languagePrefValidator()
]],
      ServiceOfInterest: [''],
      // PurchaseTimeline : [''],
      SpecificRequirements: [''],
      Industry: [''],
      CompanySize: [''],
      AnnualRevenue: [''],
      Notes: [''],
      isQualify: [false],
      status: ['Active', [Validators.required]]
    });
    this.leadForm.get('email').valueChanges.subscribe(
      () => {
        console.log(this.leadForm.get('email'));
      }
    )
    
  }

  phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const phoneRegex = /^[0-9]{6,15}$/;
    const isValid = phoneRegex.test(control.value);
    return isValid ? null : { invalidPhoneNumber: true };
  }
languagePrefValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.trim();
    if (!value) return null;

    // ALLOW: letters, space, comma
    const pattern = /^[A-Za-z\s,]+$/;

    if (!pattern.test(value)) {
      return { invalidLanguage: true };
    }

    return null;
  };
}


  // Handle Form Submission
  onSubmit() {
    if (this.leadForm.invalid) {
      this.leadForm.markAllAsTouched(); // Force validation messages to show
      this.leadForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    }

    this.btnDisable = true;
    const userEmail = this.userData['userEmail'];
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid
    const formData = this.leadForm.value;
    console.log(formData)
    const payload = {
      ...formData,
      phone: this.withDialCode(formData.phone, formData.phoneCode),
      CompanySize: parseInt(formData.CompanySize),
      AnnualRevenue: parseInt(formData.AnnualRevenue),
      ...(this.isEditMode ? { updatedBy: userEmail } : { createdBy: userEmail }),
      status: formData.status.charAt(0),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      isQualify: formData.isQualify ? "Y" : "N",
      leadStatus: formData.leadStatus,
    }
    console.log(payload, "PAYLOAD")
    if (this.isEditMode) {
      this.leadService.updateLeadById(this.PreCustomerMasterSid, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message || 'Lead Updated Successfully');
            this.router.navigate(['crm/lead/list']);
          } else {
            this.appSettingService.showError(resp.message || 'Internal Server Error');
          }
        },
        (error) => {
          console.error('leadUpdate', error)
        }
      )
    } else {
      this.leadService.createNewLead(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message || 'Lead Created Successfully');
            this.PreCustomerMasterSid = resp.data?.PreCustomerMasterSid;
            if(this.PreCustomerMasterSid){
            this.router.navigate(['crm/lead/entry', this.PreCustomerMasterSid]);
            }
          } else {
            this.appSettingService.showError(resp.message || "Internal Server Error");
          }
        },
        (error) => {
          console.error('leadCreate', error)
        }
      )
    }
  }



  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.PreCustomerMasterSid) return;

    this.leadService.getAuditLogsLead('PreCustomerMaster', this.PreCustomerMasterSid.toString()).subscribe({
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

        this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
      },
      error: err => console.error('Error fetching audit logs:', err)
    });
  }
  // Mapping for API status values
  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended'
  };

  allStatuses = [
    "Discovery",
    "Qualify",
    "Meeting Scheduled",
    "Meeting Completed",
    "EnquiryGenerated",
    "QuotationCreated",
    "QuotationConfirmed",
    "ContractSigned",
    "DealWon",
    "DealLost"
  ];

  normalizeLeadStatus(apiStatus: string): string {
  if (!apiStatus) return 'Discovery';

  const map: Record<string, string> = {
    Discovery: 'Discovery',
    Qualify: 'Qualify',
    MeetingScheduled: 'Meeting Scheduled',
    MeetingCompleted: 'Meeting Completed',
    EnquiryGenerated: 'EnquiryGenerated',
    QuotationCreated: 'QuotationCreated',
    QuotationConfirmed: 'QuotationConfirmed',
    ContractSigned: 'ContractSigned',
    DealWon: 'DealWon',
    DealLost: 'DealLost'
  };

  return map[apiStatus] || 'Discovery';
}


  filteredStatuses: string[] = [];
  // Fetch lead data and patch the form
  loadLeadData(leadId: number) {
  this.leadService.getLeadById(leadId).subscribe(
    (resp: any) => {
      if (!resp.status) {
        this.appSettingService.showError('Error Loading Lead Data');
        return;
      }

      this.leadData = resp;

      // Patch dependent dropdowns
      this.filterStateByCountryId(resp);
      this.filterCityByStateId(resp);

      const apiLeadStatus = this.normalizeLeadStatus(resp.leadStatus);

const currentIndex = this.allStatuses.indexOf(apiLeadStatus);
const lockIndex = this.allStatuses.indexOf(this.LOCK_AFTER_STATUS);

// 🔒 Lock for Meeting Scheduled AND ALL NEXT STEPS
if (currentIndex >= lockIndex) {
  this.filteredStatuses = [apiLeadStatus];
  this.leadForm.get('leadStatus')?.disable({ emitEvent: false });
} 
// 🔓 Early stages
else {
  this.filteredStatuses = this.allStatuses.slice(0, lockIndex);
  this.leadForm.get('leadStatus')?.enable({ emitEvent: false });
}


      // Patch form
      this.leadForm.patchValue({
        ...resp,
        ...this.parsePhone(resp.phone),
        isQualify: resp.isQualify === 'Y',
        leadStatus: apiLeadStatus,
        status: this.findStatus(resp.status)
      },
    { emitEvent: false }
  );

    },
    (error) => {
      console.error('Error Loading Lead Data', error);
    }
  );
}


  loadAllFields() {
    const currentCompanyInfo = this.appSettingService.getCurrentCompanyInfo();
    forkJoin({
      companies: this.leadService.getAllCompanies(),
      // countries: this.leadService.fetchAllCountries(),
    }).subscribe(({ companies}) => {
      this.companyList = companies.data;
      // this.countryList = countries
    })
    this.dropdownStore.loadCountries().subscribe(() => {
      this.leadService.getStateByCountryId({ CountryMasterSid: currentCompanyInfo?.CountryMasterSid });
    });
  }

  filterStateByCountryId(countryData: any) {
  console.log(countryData, 'country data');
  
  // Clear dependent fields
  this.leadForm.patchValue({
    StateMasterSid: null,
    CityMasterSid: null
  });
  
  // Clear the lists
  this.stateList = [];
  this.cityList = [];
  
  const countryId = countryData?.CountryMasterSid;
  
  if (!countryId) {
    console.log('No country ID provided');
    return;
  }

  // Show loading state
  this.isLoadingStates = true;

  // Direct API call to get states by country
  this.leadService.getStateByCountryId(countryId).subscribe({
    next: (resp: any) => {
      this.isLoadingStates = false;
      if (resp.status) {
        this.stateList = resp.data.map(state => ({
          ...state,
          // Ensure consistent property names for dropdown
          name: state.stateName || state.name,
          id: state.StateMasterSid || state.id,
          Country: state.countryMaster?.countryName || state.Country
        }));
        console.log('States loaded via API:', this.stateList);
      } else {
        this.appSettingService.showError('Error Loading States');
        this.stateList = [];
      }
    },
    error: (error) => {
      this.isLoadingStates = false;
      console.error('Error Loading States via API', error);
      this.appSettingService.showError('Error Loading States');
      this.stateList = [];
    }
  });
}

  filterCityByStateId(stateData: any) {
  console.log(stateData, 'state data');
  
  // Clear dependent field
  this.leadForm.patchValue({
    CityMasterSid: null
  });
  
  // Clear city list
  this.cityList = [];
  
  const stateId = stateData?.StateMasterSid;
  
  if (!stateId) {
    console.log('No state ID provided');
    return;
  }

  // Show loading state
  this.isLoadingCities = true;

  // Direct API call to get cities by state
  this.leadService.getCityByStateId(stateId).subscribe({
    next: (resp: any) => {
      this.isLoadingCities = false;
      if (resp.status) {
        this.cityList = resp.data.map(city => ({
          ...city,
          // Ensure consistent property names for dropdown
          name: city.cityName || city.name,
          id: city.CityMasterSid || city.id,
          State: city.stateMaster?.stateName || city.State,
          Country: city.countryMaster?.countryName || city.Country
        }));
        console.log('Cities loaded via API:', this.cityList);
      } else {
        this.appSettingService.showError('Error Loading Cities');
        this.cityList = [];
      }
    },
    error: (error) => {
      this.isLoadingCities = false;
      console.error('Error Loading Cities via API', error);
      this.appSettingService.showError('Error Loading Cities');
      this.cityList = [];
    }
  });
}

  // Add these methods to handle dropdown changes
onCountryChange(selectedCountry: any) {
  if (selectedCountry) {
    this.updatePhoneCodeByCountry(selectedCountry);
    this.filterStateByCountryId(selectedCountry);
  } else {
    // Clear states and cities if no country selected
    this.stateList = [];
    this.cityList = [];
    this.leadForm.patchValue({
      StateMasterSid: null,
      CityMasterSid: null
    });
  }
}

onStateChange(selectedState: any) {
  if (selectedState) {
    this.filterCityByStateId(selectedState);
  } else {
    // Clear cities if no state selected
    this.cityList = [];
    this.leadForm.patchValue({
      CityMasterSid: null
    });
  }
}

  // Handle city selection change
  onCityChange(event: any) {
    const selectedCityId = event.target.value;
    const selectedCity = this.citys.find((city) => city.CityMasterSid == selectedCityId);

    if (selectedCity) {
      this.leadForm.patchValue({
        StateMasterSid: selectedCity.StateMasterSid,
        CountryMasterSid: selectedCity.CountryMasterSid,
      });
    }
  }

  // reset() {
  //   this.leadForm.reset();
  // }
  reset() {
    // If editing an existing lead, reload it (restore original state)
    if (this.isEditMode && this.PreCustomerMasterSid) {
      this.loadLeadData(this.PreCustomerMasterSid);
      return;
    }

    // Create-mode: reset form to initial state with proper default values
    this.leadForm.reset({
      preCustomerName: null,
      leadReferredBy: null,
      leadFrom: null,
      preCustomerType: null,
      preCustomerAddress1: null,
      preCustomerAddress2: null,
      POBOX: null,
      CountryMasterSid: null,
      StateMasterSid: null,
      CityMasterSid: null,
      contactPerson: null,
      email: null,
      phoneCode: DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData),
      phone: null,
      PreferredContactMode: 'Email',
      LanguagePreferrence: null,
      ServiceOfInterest: null,
      // PurchaseTimeline: null,
      SpecificRequirements: null,
      Industry: null,
      CompanySize: null,
      AnnualRevenue: null,
      Notes: null,

      status: 'Active'
    });

    // Reset validation state
    this.leadForm.markAsUntouched();
    this.leadForm.markAsPristine();

    // Reset related data arrays
    this.stateList = [];
    this.cityList = [];

    // Clear selected data
    this.leadData = null;
  }

  private parsePhone(rawValue: any): { phoneCode: string; phone: string } {
    const parsed = DialCodeDropdownComponent.splitPhoneNumber(rawValue);
    return {
      phoneCode: parsed.phoneCode || DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData),
      phone: parsed.phoneNumber
    };
  }

  private withDialCode(phoneValue: any, dialCode?: string): string {
    return DialCodeDropdownComponent.buildPhoneWithDialCode(phoneValue, dialCode);
  }
  private updatePhoneCodeByCountry(countryInput: any, force = false): void {
    const phoneCodeControl = this.leadForm.get('phoneCode');
    const phoneValue = this.leadForm.get('phone')?.value;
    if (!phoneCodeControl) return;
    if (!force && phoneValue && String(phoneValue).trim()) return;

    const countryId =
      typeof countryInput === 'object' ? countryInput?.CountryMasterSid : countryInput;
    const country =
      this.countryList?.find((c: any) => c?.CountryMasterSid == countryId) ||
      this.dropdownStore.countries()?.find((c: any) => c?.CountryMasterSid == countryId);

    const dialCode =
      DialCodeDropdownComponent.getDialCodeByCountry(country) ||
      DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData);

    phoneCodeControl.setValue(dialCode);
  }
  goBack() {
    this.router.navigate(['crm/lead/list'])
  }

  customEmailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.trim();

      if (!value) return null;

      const emails = value.split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      if (emails.length === 0) return null;


      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


      for (const email of emails) {
        if (!emailPattern.test(email)) {
          return {
            emailInvalid: true,
            invalidEmail: email
          };
        }
      }

      return null;
    };
  }

  findStatus(value) {
    switch (value) {
      case 'A':
        return 'Active'

      case 'P':
        return 'Pending'

      case 'S':
        return 'Success'

      case 'N':
        return 'No Progress'

      default:
        return 'Closed'
    }
  }

  showInfo() {
    if (!this.leadData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.leadData;
    modalRef.componentInstance.idLabel = 'Lead Id';
    modalRef.componentInstance.idValue = this.leadData?.PreCustomerMasterSid;
  }

  // openTandC() {
  //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //   const payload = { MenuMasterSid: this.currentMenuId };
  //   this.leadService.getTandCByCondition(payload).subscribe(
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
  //         modalRef.componentInstance.DocumentSid = this.currentClauseId;

  //       } else {
  //         this.appSettingService.showError('Error loading Terms and Conditions');
  //       }
  //     },
  //     (error) => {
  //       this.appSettingService.showError('Error loading Terms and Conditions', error);
  //     }
  //   );
  // }

  openEmail() {
    if (!this.leadData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.PreCustomerMasterSid;
  }

openEDoc() {
  console.log('openEDoc clicked');

  if (!this.leadData) return;

  // Permission check before opening modal
  if (!this.mps.has('edoc')) {
    this.appSettingService.showWarning('You do not have permission to access Edoc.');
    return;
  }

  const modalRef = this.modalService.open(EdocComponent, {
    size: 'xl',
    centered: true,
    backdrop: 'static',
        windowClass: 'full-screen-modal' // ✅ custom class

  });

  // ✅ Pass data to EdocComponent here
  modalRef.componentInstance.screenName = 'Edoc';
 modalRef.componentInstance.formData = this.leadData; // or any object
  modalRef.componentInstance.resetTrigger = false;

  const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.PreCustomerMasterSid
  }

      this.commonService.documentData.set(data)

  

  // Listen for close event
  modalRef.componentInstance.closeModal.subscribe((data: boolean) => {
    if (data) {
      this.modalService.dismissAll();
    }
  });
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
    modalRef.componentInstance.DocumentSid = this.PreCustomerMasterSid;
  }
 createNew() {
    this.router.navigate(['crm/lead/entry'])
  }
  openFollowup() {
    if (!this.leadData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.leadData?.PreCustomerMasterSid;
    modalRef.componentInstance.parentSubject = `__SUBJECT__ for Customer"${this.leadData.preCustomerName}"`;
    modalRef.componentInstance.parentMailbodyTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <p>Dear Sir/Madam,</p>
      <p>Kindly do the needful for "__SUBJECT__" Customer "${this.leadData.preCustomerName}"</p>
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



  ngOnDestroy(): void {
    this.commonService.clearDocumentData()
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  } 

}
