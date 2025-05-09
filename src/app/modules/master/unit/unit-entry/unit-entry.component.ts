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
  selector: 'app-unit-entry',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './unit-entry.component.html',
  styleUrl: './unit-entry.component.scss'
})
export class UnitEntryComponent {

  unitForm!: FormGroup;
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
    this.unitForm = new FormGroup({
      unitName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      unitCode: new FormControl('', [Validators.required, Validators.maxLength(4)]),
      jobType: new FormControl('FCL', [Validators.required]),
      measurementType: new FormControl('Dimension', [Validators.required]),
      containerType: new FormControl('', [Validators.required, Validators.maxLength(20)]),
      Remarks: new FormControl('', [Validators.required, Validators.maxLength(100)])
    });

    this.route.paramMap.subscribe(params => {
      this.idParam = Number(params.get('id'));
      if (this.idParam) {
        this.isEditMode = true;
        this.loadUnit(this.idParam);
      }
    })



  }

  loadUnit(UnitMasterSid): void {
    this.masterService.getUnitById(UnitMasterSid).subscribe(
      (resp) => {
        console.log(resp, 'uomdata')
        this.unitForm.patchValue(resp);
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading port:', error);
      }
    );
  }

  reset() {
    this.unitForm.reset();
  }

  goBack() {
    history.back()
  }

  // Handle Form Submission
  onSubmit() {
    if (this.unitForm.invalid) {
      this.unitForm.markAllAsTouched(); // Force validation messages to show
      this.unitForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const payload = (this.isEditMode) ? { ...this.unitForm.value, ...updatedBy } : { ...this.unitForm.value, ...createdBy };


      // payload.DimensionReq = (this.unitForm.value.DimensionReq)?'Y':'N';
      //payload.WeightReq = (this.unitForm.value.WeightReq)?'Y':'N';
      //payload.VolumeReq = (this.unitForm.value.VolumeReq)?'Y':'N';
      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateUnitById(this.idParam, payload).subscribe(
          (resp: any) => {

            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/unit/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading unit:', error);
          }
        );
      } else {
        this.masterService.createUnit(payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/unit/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading unit:', error);
          }
        );
      }
    }
  }

}
