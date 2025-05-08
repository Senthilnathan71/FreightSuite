import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { City } from 'src/app/modules/crm-mobile/Interfaces/city.interface';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-city-entry',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './city-entry.component.html',
  styleUrl: './city-entry.component.scss'
})
export class CityEntryComponent {
  cityForm!: FormGroup;
  isEditMode = false; // Flag for edit mode
  citys: City[] = [];        // Array to store the leads
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  CityMasterSid: number;

  countryList: any
  stateList: any
  statusList = ["Active", "In Active"]

  status: any
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getAllCountries()
    this.getAllState()
    this.loadCity()
    this.initForm();

    // Subscribe to route params and load lead if ID exists
    this.route.paramMap.subscribe(params => {
      this.CityMasterSid = +params.get('id');
      if (this.CityMasterSid) {
        this.isEditMode = true;
        this.loadLeadData(this.CityMasterSid);
      }
    });
  }

  // Method to load the city data
  loadCity(): void {
    this.masterService.getAllCity().subscribe(
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
    this.cityForm = this.fb.group({
      cityName: ['', [Validators.required]],
      cityCode: ['', [Validators.required]],
      StateMasterSid: ['', [Validators.required]],
      CountryMasterSid: ['', [Validators.required]], // Dropdown
      status: ['']
    });
  }

  onSubmit() {
    if (this.cityForm.invalid) {
      this.cityForm.markAllAsTouched(); // Force validation messages to show
      this.cityForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.cityForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        StateMasterSid: Number(formValue.StateMasterSid),
        CountryMasterSid: Number(formValue.CountryMasterSid),
        ...updatedBy,
        status: this.status === "A" ? "A" : "C"
      } : {
        ...formValue,
        StateMasterSid: Number(formValue.StateMasterSid),
        CountryMasterSid: Number(formValue.CountryMasterSid),
        ...createdBy,
        status: formValue.status === "Active" ? "A" : "C"
      };


      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateCityById(this.CityMasterSid, payload).subscribe(
          (resp: any) => {

            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/city/list']);

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

        this.masterService.createCity(payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/city/list']);

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
  }

  // Mapping for API status values
  statusMap: { [key: string]: string } = {
    A: 'Active',
    IA: 'Inactive'
  };


  // Fetch lead data and patch the form
  loadLeadData(leadId: number) {
    this.masterService.getCityById(leadId).subscribe(
      (leadData) => {
        this.status = leadData.status
        console.log(leadData)
        // Convert API status (A/IA) to display status (Active/Inactive)
        const formattedStatus = this.statusMap[leadData.status] || '';
        this.cityForm.patchValue({
          ...leadData,
          CountryMasterSid: leadData.CountryMasterSid,  // assign ID
          StateMasterSid: leadData.StateMasterSid,      // assign ID
          status: formattedStatus
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading lead data.');
      }
    );
  }

  getAllCountries() {
    this.masterService.getAllCountry().subscribe((res) => {
      this.countryList = res.data
    })
  }

  getAllState() {
    this.masterService.getAllState().subscribe((res) => {
      this.stateList = res.data
    })
  }

  reset() {
    this.cityForm.reset();
  }

  goBack() {
    this.router.navigate(['master/city/list'])
  }



}
