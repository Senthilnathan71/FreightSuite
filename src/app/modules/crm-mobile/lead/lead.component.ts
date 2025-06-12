import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
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


@Component({
  selector: 'app-lead',
  standalone: true,
  imports: [
    NgbAccordionModule,
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    PreventMultiClickDirective,
    NgSelectModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    OnlyTextDirective,
    OnlyNumbersDirective
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

  customerByOptions = ['Email', 'Advertisement', 'Website', 'Others'];
  leadSourceList = ['Email', 'Advertisement','Website', 'Inquiries', 'Referrals',"Trade shows", "Cold calls", "Social media", 'Others']
  statusList = ["Active", "Pending","Success","No Progress","Closed"];
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

  trackByFn(index: number, item: any): any {
    return item;
  }


  modeOfPreferredContactMode=[
    {id:"1",name:"Email"},
    {id:"2",name:"Phone"},
    {id:"3",name:"Text"}
  ]

  leads = [{ id: 1, name: 'Lead 001' }]; // Initial lead

  constructor(
    private fb: FormBuilder,
    private leadService: LeadService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: ModalService
  ) { }

  ngOnInit(): void {

    this.loadAllFields()
    this.initForm();

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
      email : ['',[Validators.required,this.customEmailValidator()]],
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
    const updatedBy = this.appSettingService.userSettingSource.value['UserEmail'];
    const createdBy = this.appSettingService.userSettingSource.value['UserEmail'];
    const companyId = this.appSettingService.userSettingSource.value['userBranchMaster'][0]?.CompanyMasterSid;
    const formData = this.leadForm.value;
    const payload = {
      ...formData,
      CompanySize : parseInt(formData.CompanySize),
      AnnualRevenue : parseInt(formData.AnnualRevenue),
      ...(this.isEditMode ? {updatedBy : updatedBy}:{createdBy : createdBy}),
      status : formData.status.charAt(0),
      CompanyMasterSid : companyId
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

  reset() {
    this.leadForm.reset();
  }

  goBack() {
    this.router.navigate(['crm/lead/list'])
  }

  customEmailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = control.value?.trim();

      if (!email) return { required: true }; // Empty email error

      // Enhanced Email Pattern for Strict Validation
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      return emailPattern.test(email) ? null : { emailInvalid: true };
    };
  }

  findStatus(value){
    switch (value) {
      case 'A':
        return 'Active'
        break;
      case 'P':
        return 'Pending'
        break;
      case 'S':
        return 'Success'
        break;
      case 'N':
        return 'No Progress'
        break;
    
      default:
        return 'Closed'
        break;
    }
  }



}
