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
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { forkJoin } from 'rxjs';



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
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective
  ],
  templateUrl: './post-master-view.component.html',
  styleUrl: './post-master-view.component.scss'
})
export class PostMasterViewComponent {
  portForm!: FormGroup;
  isEditMode = false;
  btnDisable: boolean = false;
  countryList: Country[] = [];
  stateList: State[] = [];
  filteredStateList: State[];
  regionList: any[] = [];

  modeOfStatus = [
    { name: 'Active', value: 'Active' },
    { name: 'Suspended', value: 'Suspended' },
  ]

  errorMessage: any;
  idParam: number;
  statusOptions = [
    { value: 'A', name: 'Active' },
    { value: 'S', name: 'Suspended' }
  ];

  constructor(private config: NgSelectConfig, private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router, private appSettingService: AppSettingsService, private masterService: MasterService) {
    this.config.notFoundText = 'Custom not found';
    this.config.appendTo = 'body';
    this.config.bindValue = 'value';
  }
  ngOnInit() {
    this.initPortForm();
    this.loadAllFields();
    this.route.paramMap.subscribe(params => {
      this.idParam = Number(params.get('id'));
      if (this.idParam) {
        this.isEditMode = true;
        this.loadPort(this.idParam);
      }
    })
  }

  initPortForm() {
    this.portForm = this.fb.group({
      PortName: ['', [Validators.required, Validators.maxLength(50)]],
      PortCode: ['', [Validators.required, Validators.maxLength(5)]],
      CountryMasterSid: [, [Validators.required]],
      StateMasterSid: [,],
      TimeZone: [''],
      ZoneMasterSid: [''],
      TerminalCode: ['', [Validators.maxLength(10)]],
      PortType: ['Sea', [Validators.maxLength(10)]],
      ExportRestriction: ['', [Validators.maxLength(100)]],
      ImportRestriction: ['', [Validators.maxLength(100)]],
      SCMTPortCode: ['', [Validators.maxLength(10)]],
      CBMRequire: [false],
      status: ['Active'],
      EdiPortCode: ['', [Validators.maxLength(10)]],
      Remarks: ['', [Validators.maxLength(100)]]
    });
  }

  loadPort(PortMasterSid): void {
    this.masterService.getPortById(PortMasterSid).subscribe(
      (resp) => {
        console.log(resp, 'portdata')
        this.portForm.patchValue({
          ...resp,
          CBMRequire: (resp.CBMRequire == 'Y' ? true : false),
          status: resp.status === 'A' ? 'Active' : 'Suspended'
        });
        console.log(this.portForm.value);
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading port:', error);
      }
    );
  }

  // loadCountry(): void {
  //   this.masterService.getAllCountry().subscribe(
  //     (resp: Country[]) => {
  //       console.log(resp, 'Countries')
  //       this.countries = resp['data'];
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;
  //       console.error('Error loading leads:', error);
  //     }
  //   );
  // }

  // loadSector(): void {
  //   this.masterService.getAllSector().subscribe(
  //     (resp: Country[]) => {
  //       console.log(resp, 'Sectors')
  //       this.sectors = resp['data'];
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;
  //       console.error('Error loading leads:', error);
  //     }
  //   );
  // }

  // loadStates(): void {

  // }

  loadAllFields() {
    forkJoin({
      countries: this.masterService.getAllCountry(),
      states: this.masterService.getAllState(),
      regions: this.masterService.getAllZones()
    }).subscribe(({ countries, states, regions }) => {
      this.countryList = countries.data,
        this.stateList = states.data,
        this.filteredStateList = states.data,
        this.regionList = regions
    })
  }

  filterStateByCountry(CountryMasterSid) {
    if (!CountryMasterSid) {
      this.filteredStateList = this.stateList;
      return;
    }
    this.filteredStateList = this.stateList.filter(state => state.CountryMasterSid === CountryMasterSid);
  }

  setCountryByState(StateMasterSid) {
    if (!StateMasterSid) {
      return;
    }
    console.log(StateMasterSid);
    let selectedState = this.stateList.find(state => state.StateMasterSid);
    this.portForm.get('StateMasterSid').setValue(StateMasterSid);
    this.portForm.get('CountryMasterSid').setValue(selectedState.CountryMasterSid);
    console.log('CountryCode', selectedState.CountryMasterSid)
  }


  reset() {
    this.portForm.reset();
  }

  goBack() {
    history.back()
  }

  // Handle Form Submission
  onSubmit() {
    if (this.portForm.invalid) {
      this.portForm.markAllAsTouched(); // Force validation messages to show
      this.portForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {

      let formValue = this.portForm.value;

      let createdBy = this.appSettingService.userSettingSource.value['userEmail'];
      let updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
      const payload = (this.isEditMode) ?
        {
          ...formValue,
          status: formValue.status === 'Active' ? 'A' : 'S',
          CBMRequire: formValue.CBMRequire ? 'Y' : 'N',
          updatedBy: updatedBy
        }
        :
        {
          ...formValue,
          status: formValue.status === 'Active' ? 'A' : 'S',
          CBMRequire: formValue.CBMRequire ? 'Y' : 'N',
          createdBy: createdBy
        }


      if (this.isEditMode) {
        this.masterService.updatePortById(this.idParam, payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess("Port Updated Successfully");
              this.router.navigate(['master/port-master/list']);

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
              this.appSettingService.showSuccess("Port Created Successfully");
              this.router.navigate(['master/port-master/list']);

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
