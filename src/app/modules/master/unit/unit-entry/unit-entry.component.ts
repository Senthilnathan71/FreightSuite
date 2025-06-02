import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { ContainerType } from 'src/app/modules/crm-mobile/Interfaces/container-type.interface';
import { Unit } from 'src/app/modules/crm-mobile/Interfaces/unit.interface';


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
  styleUrls: ['./unit-entry.component.scss']
})
export class UnitEntryComponent {
  unitForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  containerTypes: ContainerType[] = [];
  idParam: number;
  errorMessage: string;

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

  constructor(
    private config: NgSelectConfig, 
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router, 
    private appSettingService: AppSettingsService, 
    private masterService: MasterService
  ) {
    this.config.notFoundText = 'No items found';
    this.config.appendTo = 'body';
    this.config.bindValue = 'ContainerTypeMasterSid';
    this.config.bindLabel = 'ContainerName';
    this.initializeForm();
  }

  ngOnInit() {
    this.loadContainerTypes();
    
    this.route.paramMap.subscribe(params => {
      this.idParam = Number(params.get('id'));
      if (this.idParam) {
        this.isEditMode = true;
        this.loadUnit(this.idParam);
        this.unitForm.get('status')?.enable();
      } else {
        this.unitForm.get('status')?.disable();
      }
    });
  }

  loadContainerTypes() {
    this.masterService.getAllContainerTypes().subscribe({
      next: (resp: any) => {
        this.containerTypes = resp.data || resp;
      },
      error: (error) => {
        console.error('Error loading container types:', error);
        this.appSettingService.showError('Failed to load container types');
      }
    });
  }

  initializeForm() {
    this.unitForm = this.fb.group({
      unitName: ['', [Validators.required, Validators.maxLength(100)]],
      unitCode: ['', [Validators.required, Validators.maxLength(4)]],
      jobType: ['FCL', [Validators.required]],
      measurementType: ['Dimension', [Validators.required]],
      containerType: [null, [Validators.required]],
      status: ['A', [Validators.required]],
      Remarks: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  loadUnit(UnitMasterSid: number): void {
    this.masterService.getUnitById(UnitMasterSid).subscribe({
      next: (unit: Unit) => {
        this.unitForm.patchValue({
          unitName: unit.unitName,
          unitCode: unit.unitCode,
          jobType: unit.jobType,
          measurementType: unit.measurementType,
          containerType: unit.containerType,
          status: unit.status,
          Remarks: unit.Remarks
        });
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.appSettingService.showError('Failed to load unit data');
      }
    });
  }

  reset() {
    this.unitForm.reset({
      jobType: 'FCL',
      measurementType: 'Dimension',
      status: 'A'
    });
    if (!this.isEditMode) {
      this.unitForm.get('status')?.disable();
    }
  }

  goBack() {
    this.router.navigate(['master/unit/list']);
  }

  onSubmit() {
    if (this.unitForm.invalid) {
      this.unitForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const formValue = this.unitForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    
    // Prepare payload based on create/update
    const payload = {
      ...formValue,
      createdBy: this.isEditMode ? undefined : userEmail,
      updatedBy: this.isEditMode ? userEmail : undefined
    };

    // Handle status for new records
    if (!this.isEditMode) {
      payload.status = 'A'; // Default status for new records
    }

    const apiCall = this.isEditMode 
      ? this.masterService.updateUnitById(this.idParam, payload)
      : this.masterService.createUnit(payload);

    this.btnDisable = true;
    apiCall.subscribe({
      next: (resp: any) => {
        this.btnDisable = false;
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message);
          this.router.navigate(['master/unit/list']);
        } else {
          this.appSettingService.showError(resp.message);
        }
      },
      error: (error) => {
        this.btnDisable = false;
        this.errorMessage = error.message;
        this.appSettingService.showError('Operation failed');
      }
    });
  }
}