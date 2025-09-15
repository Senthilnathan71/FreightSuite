import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
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
import { forkJoin } from 'rxjs';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { EdocComponent } from '../../settings/edoc/edoc/edoc.component';
import { AuthorityEntryComponent } from '../../master/authority/authority-entry/authority-entry.component';
import { EmailEntryComponent } from '../../settings/email/email-entry/email-entry.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';


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
    OnlyNumbersDirective,
    DatePipe
    // NgxIntlTelInputModule
  ],
  templateUrl: './lead.component.html',
  styleUrl: './lead.component.scss'
})
export class LeadComponent implements OnInit {
  leadForm!: FormGroup;
  isEditMode = false; // Flag for edit mode
  citys: City[] = [];        // Array to store the leads
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  PreCustomerMasterSid: number;
  companyList : any[];
  countryList : any[];
  stateList : any[];
  cityList : any[];
  leadData : any;
  currentCompany : any;
  currentBranch : any;
  userData : any;
  customerByOptions = ['Email', 'Advertisement', 'Website', 'Others'];
  leadSourceList = ['Email', 'Advertisement','Website', 'Inquiries', 'Referrals',"Trade shows", "Cold calls", "Social media", 'Others']
  statusList = ["Active", "Suspended"];
  // CountryISO = CountryISO;
  // PhoneNumberFormat = PhoneNumberFormat;
  // SearchCountryField = SearchCountryField;
  // separateDialCode = true;
  // preferredCountries: CountryISO[] = [CountryISO.UnitedStates, CountryISO.UnitedKingdom, CountryISO.India, CountryISO.Canada, CountryISO.Malaysia, CountryISO.SriLanka, CountryISO.UnitedArabEmirates, CountryISO.Singapore, CountryISO.Qatar, CountryISO.Kuwait, CountryISO.Australia];

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


  modeOfPreferredContactMode=[
    {id:"1",name:"Email"},
    {id:"2",name:"Phone"},
    {id:"3",name:"Text"}
  ]

  
auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;


  leads = [{ id: 1, name: 'Lead 001' }]; // Initial lead

  constructor(
    private fb: FormBuilder,
    private leadService: LeadService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {

    this.loadAllFields()
    this.initForm();
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if(userProfile){
      this.userData = userProfile;
    }
     const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
     const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
    console.info(this.currentBranch)

    // Subscribe to route params and load lead if ID exists
    this.route.paramMap.subscribe(params => {
      this.PreCustomerMasterSid = +params.get('id');
      if (this.PreCustomerMasterSid) {
        this.isEditMode = true;
        this.loadLeadData(this.PreCustomerMasterSid);
      }
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
      preCustomerName : [,[Validators.required]],
      leadReferredBy : [,[Validators.required]],
      leadFrom : [],
      preCustomerType : [],
      preCustomerAddress1 : ['',[Validators.required]],
      preCustomerAddress2 : [''],
      POBOX : [''],
      CountryMasterSid : [,[Validators.required]],
      StateMasterSid : [,[Validators.required]],
      CityMasterSid : [,[Validators.required]],
      contactPerson : ['',[Validators.required]],
      email : ['',[Validators.required,EmailValidators.multipleEmails(),Validators.maxLength(100)]],
      phone : ['',[Validators.required]],
      PreferredContactMode : ['Email'],
      LanguagePreferrence : [''],
      ServiceOfInterest : [''],
      PurchaseTimeline : [''],
      SpecificRequirements : [''],
      Industry : [''],
      CompanySize : [''],
      AnnualRevenue : [''],
      Notes : [''],
      status : ['Active',[Validators.required]]
    });
    this.leadForm.get('email').valueChanges.subscribe(
      ()=>{
        console.log(this.leadForm.get('email'));
      }
    )
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
    const payload = {
      ...formData,
      CompanySize : parseInt(formData.CompanySize),
      AnnualRevenue : parseInt(formData.AnnualRevenue),
      ...(this.isEditMode ? {updatedBy : userEmail}:{createdBy : userEmail}),
      status : formData.status.charAt(0),
      CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
			BranchMasterSid : this.currentBranch?. BranchMasterSid,
    }

    if(this.isEditMode){
      this.leadService.updateLeadById(this.PreCustomerMasterSid,payload).subscribe(
        (resp:any)=>{
          if(resp.status){
            this.appSettingService.showSuccess('Lead Updated Successfully');
            this.router.navigate(['crm/lead/list']);
          } else {
            this.appSettingService.showError('Error Updating Lead');
          }
        },
        (error)=>{
          console.error('Error Updating Lead',error)
        }
      )
    } else {
      this.leadService.createNewLead(payload).subscribe(
        (resp:any)=>{
          if(resp.status){
            this.appSettingService.showSuccess('Lead Created Successfully');
            this.router.navigate(['crm/lead/list']);
          } else {
            this.appSettingService.showError('Error Creating Lead');
          }
        },
        (error)=>{
          console.error('Error Creating Lead',error)
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


  // Fetch lead data and patch the form
  loadLeadData(leadId: number) {
    this.leadService.getLeadById(leadId).subscribe(
      (resp:any) => {
          if(resp.status){
            let response = resp.data;
            this.leadData = response;
            this.filterStateByCountryId(response);
            this.filterCityByStateId(response);
            let formattedStatus = this.findStatus(response.status);
            this.leadForm.patchValue({
               ...response,
               status : formattedStatus
             })
          } else { 
            this.appSettingService.showError('Error Loading Lead Data')
          }
      },
      (error) => {
        console.log('Error Loading Lead Data',error);
      }
    );
  }

  loadAllFields(){
    forkJoin({
      companies : this.leadService.getAllCompanies(),
      countries : this.leadService.fetchAllCountries(),
    }).subscribe(({companies,countries})=>{
      this.companyList = companies.data;
      this.countryList = countries
      console.log(this.countryList);
    })
  }

  filterStateByCountryId(country){
      const countryId = country.CountryMasterSid;
      this.leadService.getStateByCountryId(countryId).subscribe(
        (resp:any)=>{
          if(resp.status){
            this.stateList = resp.data;
          } else {
            this.appSettingService.showError('Error Loading States')
          }
        },
        (error)=>{
          console.error('Error Loading States',error)
        }
      )
  }
  filterCityByStateId(state){
      const stateId = state.StateMasterSid;
      this.leadService.getCityByStateId(stateId).subscribe(
        (resp:any)=>{
          if(resp.status){
            this.cityList = resp.data;
          } else {
            this.appSettingService.showError('Error Loading City')
          }
        },
        (error)=>{
          console.error('Error Loading City',error)
        }
      )
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
    phone: null,
    PreferredContactMode: 'Email',
    LanguagePreferrence: null,
    ServiceOfInterest: null,
    PurchaseTimeline: null,
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

  findStatus(value){
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
    if(!this.leadData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.leadData;
    modalRef.componentInstance.idLabel = 'Lead Id';
    modalRef.componentInstance.idValue = this.leadData?.PreCustomerMasterSid;
  }

  openTandC() {
      this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
      const payload = { MenuMasterSid: this.currentMenuId };
      this.leadService.getTandCByCondition(payload).subscribe(
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
            modalRef.componentInstance.DocumentSid = this.currentClauseId;
  
          } else {
            this.appSettingService.showError('Error loading Terms and Conditions');
          }
        },
        (error) => {
          this.appSettingService.showError('Error loading Terms and Conditions', error);
        }
      );
    }

  openEmail() {
		if (!this.leadData) return;
		const modalRef = this.modalService.open(EmailEntryComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
	}

	openAuthority() {
		// if (!this.leadData) return;
		// const modalRef = this.modalService.open(AuthorityEntryComponent, {
		// 	size: 'lg',
		// 	centered: true,
		// 	backdrop: 'static'
		// });
	}

	openEDoc() {
		// if (!this.leadData) return;
		// const modalRef = this.modalService.open(EdocComponent, {
		// 	size: 'lg',
		// 	centered: true,
		// 	backdrop: 'static'
		// });
	}


}
