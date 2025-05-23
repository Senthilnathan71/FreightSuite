import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';

@Component({
  selector: 'app-country-entry',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './country-entry.component.html',
  styleUrl: './country-entry.component.scss'
})
export class CountryEntryComponent {

  countryForm!: FormGroup;
  isEditMode = false;
  selectedShipmentType: number;
  btnDisable: boolean = false;


  jobType = [
    { id: 'FCL', name: 'FCL' },
    { id: 'LCL', name: 'LCL' },
    { id: 'Air', name: 'Air' }
  ];

  measurementType = [
    { id: 'Dimension', name: 'Dimension' },
    { id: 'Volume', name: 'Volume' },
    { id: 'Weight', name: 'Weight' },
    { id: 'Number', name: 'Number' }
  ];

  errorMessage: any;
  idParam: number;

  constructor(private config: NgSelectConfig, private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router, private appSettingService: AppSettingsService, private masterService: MasterService) {
    this.config.notFoundText = 'Custom not found';
    this.config.appendTo = 'body';
    this.config.bindValue = 'value';
  }

  ngOnInit() {
    this.countryForm = new FormGroup({
      countryName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      countryCode: new FormControl('', [Validators.required, Validators.maxLength(2)]),
      dialingCode: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      ISO3DigitCode: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      UNM49Code: new FormControl('', [Validators.required, Validators.maxLength(10)]), ShortName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      LocalCurrencyCode: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      LocalCurrencyName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      AWBCurrencyCode: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      AWBCurrencyName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      region: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      Remarks: new FormControl('', [Validators.maxLength(100)]),
      status: new FormControl('A', [Validators.maxLength(100)])
    });

    this.route.paramMap.subscribe(params => {
      this.idParam = Number(params.get('id'));
      if (this.idParam) {
        this.isEditMode = true;
        this.loadCountry(this.idParam);
      }
    })



  }

  loadCountry(CountryMasterSid): void {
    this.masterService.getCountryById(CountryMasterSid).subscribe(
      (resp) => {
        console.log(resp, 'countrydata')
        this.countryForm.patchValue(resp);
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading country:', error);
      }
    );
  }

  reset() {
    this.countryForm.reset();
  }

  goBack() {
    this.router.navigate(['master/country/list'])
  }

  // Handle Form Submission
  onSubmit() {
    if (this.countryForm.invalid) {
      this.countryForm.markAllAsTouched(); // Force validation messages to show
      this.countryForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const payload = (this.isEditMode) ? { ...this.countryForm.value, ...updatedBy } : { ...this.countryForm.value, ...createdBy };


      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateCountryById(this.idParam, payload).subscribe(
          (resp: any) => {

            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess("Country Updated");
              this.router.navigate(['master/country/list']);

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
        this.masterService.createCountry(payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess("Country Created");
              this.router.navigate(['master/country/list']);

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

}
