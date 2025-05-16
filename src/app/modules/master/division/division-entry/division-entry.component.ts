import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';

import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Division } from 'src/app/modules/crm-mobile/Interfaces/division.interface';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-division-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule
  ],
  templateUrl: './division-entry.component.html',
  styleUrl: './division-entry.component.scss'
})
export class DivisionEntryComponent {
  divisionForm!: FormGroup;
  isEditMode = false;
  divisionId: number;
  errorMessage = '';
  btnDisable = false;

  modeOfStatus = [
    { name: 'Active' },
    { name: 'Inactive' }
  ];

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.divisionId = +idParam;
        this.isEditMode = true;
        this.loadDivisionById(this.divisionId);
      }
    });
  }

  initForm() {
    this.divisionForm = this.fb.group({
      Name: ['', Validators.required],
      Code: ['', Validators.required],
      Address: [''],
      Remarks: [''],
      Status: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.divisionForm.invalid) {
      this.divisionForm.markAllAsTouched();
      this.divisionForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const formValue = this.divisionForm.value;
    const currentUser = this.appSettingService.userSettingSource.value['userEmail'];

    const payload = this.isEditMode
      ? {
          ...formValue,
          updatedBy: currentUser,
          status: formValue.Status === 'Active' ? 'A' : 'C'
        }
      : {
          ...formValue,
          createdBy: currentUser,
          status: formValue.Status === 'Active' ? 'A' : 'C'
        };

    if (this.isEditMode) {
      this.masterService.updateDivisionById(this.divisionId, payload).subscribe(
        (res: any) => {
          if (res.status) {
            this.appSettingService.showSuccess(res.message);
            this.router.navigate(['master/division/list']);
          } else {
            this.appSettingService.showError(res.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
        }
      );
    } else {
      this.masterService.createNewDivision(payload).subscribe(
        (res: any) => {
          if (res.status) {
            this.appSettingService.showSuccess(res.message);
            this.router.navigate(['master/division/list']);
          } else {
            this.appSettingService.showError(res.message);
          }
        },
        (error) => {
          this.errorMessage = error.message;
        }
      );
    }
  }

  loadDivisionById(id: number) {
    this.masterService.getDivisionById(id).subscribe(
      (data: Division) => {
        this.divisionForm.patchValue({
          Name: data.divisionName,
          Code: data.divisionCode,
          Address: data['Address'] || '',
          Remarks: data['Remarks'] || '',
          Status: data.status === 'A' ? 'Active' : 'Inactive'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading division data.');
      }
    );
  }

  reset() {
    this.divisionForm.reset();
  }

  goBack() {
    this.router.navigate(['master/division/list']);
  }
}
