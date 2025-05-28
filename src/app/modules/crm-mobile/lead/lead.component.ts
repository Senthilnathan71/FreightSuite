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


@Component({
  selector: 'app-lead',
  standalone: true,
  imports: [
    NgbAccordionModule,
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    PreventMultiClickDirective,
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

  customerByOptions = ['Email', 'Advertisement', 'Website', 'Others'];
  statusList = ["Active", "Suspend"];
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

    this.loadCity()
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

  // Method to load the city data
  loadCity(): void {
    this.leadService.getAllCity().subscribe(
      (resp: City[]) => {
        console.log(resp, 'Cities')
        this.citys = resp['data'];  // On success, store the leads data in the component
      },
      (error) => {
        this.errorMessage = error.message;  // On error, store the error message
        console.error('Error loading leads:', error);  // Optionally log the error
      }
    );
  }

  // Initialize the Form
  initForm() {
    this.leadForm = this.fb.group({
      preCustomerName: ['', [Validators.required, Validators.minLength(5)]],
      leadFrom: ['',],
      leadReferredBy: ['', [Validators.required]], // Dropdown
      preCustomerAddress1: ['', [Validators.required, Validators.minLength(10)]],
      preCustomerAddress2: [''],
      CityMasterSid: Number(['', [Validators.required]]), // Dropdown
      contactPerson: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, this.customEmailValidator()]],
      phone: ['', [Validators.required]], //, Validators.pattern('^[0-9]{10,15}$')
      StateMasterSid: [''],
      CountryMasterSid: [''],
      status: ['A', [Validators.required]],
      PreCustomerMasterSid: [''],
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
    let formData: any = {
      ...this.leadForm.value,
      phone: this.leadForm.value.phone.e164Number
    }
    if (this.isEditMode) {
      formData = {
        ...this.leadForm.value,
        phone: this.leadForm.value.phone.e164Number,
        status: this.leadForm.value.status === 'Active' ? 'A' : this.leadForm.value.status === 'Suspend' ? 'S' : ''
      };
    }

    this.btnDisable = true;
    this.leadService.createPreCustomer(formData).subscribe(
      resp => {
        if (resp.data && resp.status) {
          // this.appSettingService.showSuccess(resp.message);
          this.modalService.openSuccessModal(resp.message);

          this.btnDisable = false;
          this.leadForm.patchValue(resp.data);
          this.router.navigate([`/crm/lead/list`]);
        } else {
          // this.appSettingService.showError(resp.message);
          this.modalService.openErrorModal(resp.message);
        }
      }
    )
    console.log('Creating Lead:', this.leadForm.value);
    this.btnDisable = false;
  }

  // Mapping for API status values
  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspend'
  };


  // Fetch lead data and patch the form
  loadLeadData(leadId: number) {
    this.leadService.getPrecustomerById(leadId).subscribe(
      (leadData) => {
        console.log(leadData)
        // Convert API status (A/IA) to display status (Active/Inactive)
        const formattedStatus = this.statusMap[leadData.status] || '';
        this.leadForm.patchValue({ ...leadData, status: formattedStatus, emitEvent: false },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading lead data.');
      }
    );
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




}
