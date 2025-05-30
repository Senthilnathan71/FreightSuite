import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';

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
    OnlyTextDirective,
    TextWithNumbersDirective
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
  
  statusOptions = [
    { value: 'A', name: 'Active' },
    { value: 'S', name: 'Suspended' }
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
    this.initializeForm();
    
    this.route.paramMap.subscribe(params => {
      this.idParam = Number(params.get('id'));
      if (this.idParam) {
        this.isEditMode = true;
        this.loadUnit(this.idParam);
        // Enable status field in edit mode
        this.unitForm.get('status')?.enable();
      } else {
        // Disable status field in create mode
        this.unitForm.get('status')?.disable();
      }
    });
  }

  initializeForm() {
    this.unitForm = new FormGroup({
      unitName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      unitCode: new FormControl('', [Validators.required, Validators.maxLength(4)]),
      jobType: new FormControl('FCL', [Validators.required]),
      measurementType: new FormControl('Dimension', [Validators.required]),
      containerType: new FormControl('', [Validators.required, Validators.maxLength(20)]),
      status: new FormControl('A', [Validators.required]),
      Remarks: new FormControl('', [Validators.required, Validators.maxLength(100)])
    });
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
    // Reset status to 'A' and disable if in create mode
    this.unitForm.get('status')?.setValue('A');
    if (!this.isEditMode) {
      this.unitForm.get('status')?.disable();
    }
  }

  goBack() {
    history.back()
  }

  onSubmit() {
    if (this.unitForm.invalid) {
      this.unitForm.markAllAsTouched();
      this.unitForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      
      // Enable status temporarily to get its value
      const statusWasDisabled = this.unitForm.get('status')?.disabled;
      if (statusWasDisabled) {
        this.unitForm.get('status')?.enable();
      }
      
      const payload = (this.isEditMode) 
        ? { ...this.unitForm.value, ...updatedBy } 
        : { ...this.unitForm.value, ...createdBy };
      
      // Restore disabled state if it was disabled
      if (statusWasDisabled) {
        this.unitForm.get('status')?.disable();
      }

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateUnitById(this.idParam, payload).subscribe(
          (resp: any) => {
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