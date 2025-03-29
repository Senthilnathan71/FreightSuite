import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { FormsModule,FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { PortService } from '../../Services/port.service';
import { Country } from '../../Interfaces/country.interface';
import { State } from '../../Interfaces/state.interface';
import { Sector } from '../../Interfaces/sector.interface';

 
@Component({
  selector: 'app-post-master-view',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    NgSelectModule, 
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './post-master-view.component.html',
  styleUrl: './post-master-view.component.scss'
})
export class PostMasterViewComponent {
  portForm!: FormGroup;
  selectedState: number;
  selectedCountry: number;
  selectedTransport: number;
  btnDisable: boolean = false;
  countries : Country[]=[]; 
  states : State[] = [];
  sectors : Sector[]=[]; 

modeOfTransports = [
    { id: 'Sea',  name: 'Sea' },
    { id: 'Air',  name: 'Air' },
    { id: 'ICD',  name: 'ICD' },
    { id: 'Terminal',  name: 'Terminal' },
    { id: 'Road',  name: 'Road' },
    { id: 'Rail',  name: 'Rail' }
];
  errorMessage: any;

  constructor(private config: NgSelectConfig,private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,private appSettingService: AppSettingsService,private portService: PortService) {
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
      CountryMasterSid: new FormControl(null, []),
      StateMasterSid: new FormControl(null, []),
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

    // Watch for changes in the selected country and load states accordingly
    this.portForm.get('CountryMasterSid')?.valueChanges.subscribe(CountryMasterSid => {
      this.loadStates(CountryMasterSid);
    });

  }

  loadCountry(): void {
      this.portService.getAllCountry().subscribe(
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
      this.portService.getAllSector().subscribe(
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
      this.portService.getAllState(CountryMasterSid).subscribe(
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
    }else{ 
     
     // let payload = this.portForm.value;
     
       let createdBy = {createdBy: this.appSettingService.userSettingSource.value['userLogin']};
       const payload = { ...this.portForm.value, ...createdBy };
       payload.CBMRequire = (this.portForm.value.CBMRequire)?'Y':'N';
       console.log('payload',payload);
      this.portService.createPort(payload).subscribe(
              (resp: any) => {
                this.appSettingService.showSuccess(resp.message);  
                console.log(resp);
                this.router.navigate(['crm/port-master/list']);
              },
              (error) => {
                this.errorMessage = error.message; 
                console.error('Error loading ports:', error);  
              }
            );
    }
  }
}
