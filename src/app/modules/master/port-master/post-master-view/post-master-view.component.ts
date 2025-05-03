import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Country } from 'src/app/modules/crm-mobile/Interfaces/country.interface';
import { State } from 'src/app/modules/crm-mobile/Interfaces/state.interface';
import { Sector } from 'src/app/modules/crm-mobile/Interfaces/sector.interface';
import { MasterService } from '../../master.service';



@Component({
  selector: 'app-post-master-view',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,

  ],
  templateUrl: './post-master-view.component.html',
  styleUrl: './post-master-view.component.scss'
})
export class PostMasterViewComponent {
  portForm!: FormGroup;
  isEditMode = false;
  selectedState: number;
  selectedCountry: number;
  selectedTransport: number;
  btnDisable: boolean = false;
  countries: Country[] = [];
  states: State[] = [];
  sectors: Sector[] = [];

  modeOfTransports = [
    { id: 'Sea', name: 'Sea' },
    { id: 'Air', name: 'Air' },
    { id: 'ICD', name: 'ICD' },
    { id: 'Terminal', name: 'Terminal' },
    { id: 'Road', name: 'Road' },
    { id: 'Rail', name: 'Rail' }
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
  toggleDisabled() {
    const car2: any = this.states[1];
    car2.disabled = !car2.disabled;
  }
  ngOnInit() {
    this.loadCountry();
    this.loadSector();
    this.portForm = new FormGroup({
      PortName: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      PortCode: new FormControl('', [Validators.required, Validators.maxLength(5)]),
      CountryMasterSid: new FormControl(Validators.required, []),
      StateMasterSid: new FormControl(Validators.required, []),
      TimeZone: new FormControl('', []),
      SectorMasterSid: new FormControl(null, [Validators.required]),
      TerminalCode: new FormControl('', [Validators.maxLength(10)]),
      PortType: new FormControl(null, [Validators.maxLength(10)]),
      ExportRestriction: new FormControl('', [Validators.maxLength(100)]),
      ImportRestriction: new FormControl('', [Validators.maxLength(100)]),
      SCMTPortCode: new FormControl('', [Validators.maxLength(10)]),
      CBMRequire: new FormControl('', []),
      EdiPortCode: new FormControl('', [Validators.maxLength(10)]),
      Remarks: new FormControl('', [Validators.maxLength(100)]),
    });

    this.route.paramMap.subscribe(params => {
      this.idParam = Number(params.get('id'));
      if (this.idParam) {
        this.isEditMode = true;
        this.loadPort(this.idParam);
      }
    })


    // Watch for changes in the selected country and load states accordingly
    this.portForm.get('CountryMasterSid')?.valueChanges.subscribe(CountryMasterSid => {
      this.loadStates(CountryMasterSid);
    });

  }

  loadPort(PortMasterSid): void {
    this.masterService.getPortById(PortMasterSid).subscribe(
      (resp) => {
        console.log(resp, 'portdata')
        this.portForm.patchValue(resp);
        this.portForm.patchValue({ CBMRequire: (resp.CBMRequire == 'Y' ? true : false) })
        //this.states = resp['data'];  
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading port:', error);
      }
    );
  }

  loadCountry(): void {
    this.masterService.getAllCountry().subscribe(
      (resp: Country[]) => {
        console.log(resp, 'Countries')
        this.countries = resp['data'];
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading leads:', error);
      }
    );
  }

  loadSector(): void {
    this.masterService.getAllSector().subscribe(
      (resp: Country[]) => {
        console.log(resp, 'Sectors')
        this.sectors = resp['data'];
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading leads:', error);
      }
    );
  }

  loadStates(CountryMasterSid): void {
    this.masterService.getAllStateByCountry(CountryMasterSid).subscribe(
      (resp: State[]) => {
        console.log(resp, 'States')
        this.states = resp['data'];
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading leads:', error);
      }
    );
  }

  reset() {
    this.portForm.reset();
  }

  goBack() {
    this.router.navigate(['crm/port-master/list'])
  }

  // Handle Form Submission
  onSubmit() {
    if (this.portForm.invalid) {
      this.portForm.markAllAsTouched(); // Force validation messages to show
      this.portForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {

      // let payload = this.portForm.value;

      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const payload = (this.isEditMode) ? { ...this.portForm.value, ...updatedBy } : { ...this.portForm.value, ...createdBy };


      payload.CBMRequire = (this.portForm.value.CBMRequire) ? 'Y' : 'N';
      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updatePortById(this.idParam, payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['crm/port-master/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading ports:', error);
          }
        );
      } else {
        this.masterService.createPort(payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['crm/port-master/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading ports:', error);
          }
        );
      }


    }
  }
}
