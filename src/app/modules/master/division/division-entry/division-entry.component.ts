import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Division } from 'src/app/modules/crm-mobile/Interfaces/division.interface';
import { param } from 'jquery';

@Component({
  selector: 'app-division-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FeatherModule,
  ],
  templateUrl: './division-entry.component.html',
  styleUrls: ['./division-entry.component.scss']
})
export class DivisionEntryComponent {
  divisionForm!: FormGroup;
  isEditMode = false;
  DivisionMasterSid: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  statusList = ["Active", "Invalid", "Block"]
  Status: any

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.DivisionMasterSid = +params.get('id');
      if (this.DivisionMasterSid) {
        this.isEditMode = true;
        this.loadDivisionData(this.DivisionMasterSid);
      }
    });
  }

  // Initialize the Form
  initForm() {
    this.divisionForm = this.fb.group({
      divisionName: ['', [Validators.required]],
      divisionCode: ['', [Validators.required]],
      Address: ['', [Validators.required]],
      Remarks: ['', [Validators.required]],
      Status: ['']
    });
  }

  onSubmit() {
    if (this.divisionForm.invalid) {
      this.divisionForm.markAllAsTouched();
      this.divisionForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.divisionForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...updatedBy,
        Status: this.Status === "A" ? "A" : "I"
      } : {
        ...formValue,
        ...createdBy,
        Status: this.Status === "Active" ? "A" : "C"
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateDivisionById(this.DivisionMasterSid, payload).subscribe(
          (resp: any) => {

            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/division/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Update Division Error:', error);
          }
        );
      } else {
        this.masterService.createNewDivision(payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/division/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Create Division Error:', error);
          }
        );
      }
    }
  }

  statusMap: { [key: string]: string } = {
    A: 'Active',
    I: 'Invalid',
    B: 'Block'
  };

  // Fetch division data and patch the form
  loadDivisionData(divisionId: number) {
    this.masterService.getDivisionById(divisionId).subscribe(
      (divisionData: any) => {
        this.Status = divisionData.Status
        console.log(divisionData)
        const formattedStatus = this.statusMap[divisionData.Status] || '';
        this.divisionForm.patchValue({
          ...divisionData,
          Status: formattedStatus
        },
        );
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
    history.back();
  }
}
