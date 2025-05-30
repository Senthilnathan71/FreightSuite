import { Component, OnInit } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';

@Component({
  selector: 'app-package-type-entry',
  standalone: true,
  imports: [
    FeatherModule,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective
  ],
  templateUrl: './package-type-entry.component.html',
  styleUrl: './package-type-entry.component.scss',
})
export class PackageTypeEntryComponent implements OnInit {
  inputForm!: FormGroup;
  packageMasterSid: number;
  isEditMode: boolean;

  constructor(
    private masterService: MasterService,
    private currentUrl: ActivatedRoute,
    private route: Router,
    private appSettingServ: AppSettingsService,
    private fb: FormBuilder
  ) { }
  ngOnInit(): void {
    this.initForm();
    this.currentUrl.paramMap.subscribe((param) => {
      this.packageMasterSid = Number(param.get('id'));
      if (this.packageMasterSid) {
        this.isEditMode = true;
        this.loadPackageType(this.packageMasterSid);
      }
    });
  }

  initForm() {
    this.inputForm = this.fb.group({
      PackageName : ['',[Validators.required,Validators.maxLength(100)]],
      PackageCode : ['',[Validators.required,Validators.maxLength(3)]],
      status:['Active'],
      CompanyMasterSid:[2]
    });
  }

  loadPackageType(packageMasterSid: number) {
    this.masterService.getPackageTypeById(packageMasterSid).subscribe(
      (resp) => {
        this.inputForm.patchValue({
          ...resp,
          status: resp.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        console.error('Error loading Package Type ', error);
      }
    );
  }

  navigateBack() {
    history.back();
  }

  savePackageType() {
    if (this.inputForm.invalid) {
      this.inputForm.markAllAsTouched(); // Force validation messages to show
      this.inputForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingServ.showWarning('Please fill all required fields correctly');
      return;
    } else {
      const formValue = this.inputForm.value;
      const payload = this.coerceIntoRequiredFormat(formValue);
      if (this.isEditMode) {
        this.masterService
          .updatePackageTypeById(this.packageMasterSid,payload)
          .subscribe(
            (resp) => {
              this.appSettingServ.showSuccess('Package Type Updated Successfully');
              this.route.navigate(['master/package-type/list']);
            },
            (error) => {
              console.error(
                'Error Occured on Package Type Updation',
                error.message
              );
            }
          );
      } else {
        this.masterService.createNewPackageType(payload).subscribe(
          (resp) => {
            this.appSettingServ.showSuccess('Package Type Created Successfully');
            this.route.navigate(['master/package-type/list']);
          },
          (error) => {
            console.error(
              'Error Occured on PackageType Creation',
              error.message
            );
          }
        );
      }
    }
  }
  coerceIntoRequiredFormat(formValue) {
    let createdBy = this.appSettingServ.userSettingSource.value['userEmail'];
    let updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];
    return (this.isEditMode) ? {
      ...formValue,
      updatedBy,
      status: formValue.status === "Active" ? "A" : "S"
    } : {
      ...formValue,
      createdBy,
      status: formValue.status === "Active" ? "A" : "S"
    }
  }
}
