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
  selector: 'app-zone-entry',
  standalone: true,
  imports: [
    FeatherModule,
    NgbTooltip,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective
  ],
  templateUrl: './zone-entry.component.html',
  styleUrl: './zone-entry.component.scss',
})
export class ZoneEntryComponent implements OnInit {

  inputForm!: FormGroup;
  isEditMode: boolean;
  zoneMasterSId: number;

  constructor(
    private masterServ: MasterService,
    private appSettingServ: AppSettingsService,
    private currRoute: ActivatedRoute,
    private route: Router,
    private fb: FormBuilder
  ) { }
  ngOnInit(): void {
    this.initForm();
    this.currRoute.paramMap.subscribe((params) => {
      this.zoneMasterSId = Number(params.get('id'));
      if (this.zoneMasterSId) {
        this.isEditMode = true;
        this.loadZoneById(this.zoneMasterSId);
      }
    });
  }

  initForm() {
    this.inputForm = this.fb.group({
      ZoneName: ['', [Validators.required, Validators.maxLength(100)]],
      ZoneCode: ['', [Validators.required, Validators.maxLength(2)]],
      status: ['Active']
    })
  }

  loadZoneById(zoneMasterSId: number) {
    this.masterServ.getZoneById(zoneMasterSId).subscribe(
      (resp) => {
        this.inputForm.patchValue({
          ...resp,
          status: resp.status === 'A' ? 'Active' : 'Invalid'
        });
      },
      (error) => {
        this.appSettingServ.showError('Error Loading Zone ', error);
      }
    );
  }

  navigateBack() {
    history.back();
  }

  saveZone() {
    if (this.inputForm.invalid) {
      this.inputForm.markAllAsTouched(); // Force validation messages to show
      this.inputForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingServ.showWarning('Please fill all required fields correctly');
      return;
    } else {
      const formValue = this.inputForm.value;
      const payload = this.coerceIntoRequiredFormat(formValue);

      if (this.isEditMode) {
        this.masterServ.updateZoneById(this.zoneMasterSId, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingServ.showSuccess('Zone Updated Successfully');
              this.route.navigate(['master/zone/list']);
            } else {
              this.appSettingServ.showError(resp.message);
            }
          },
          (error) => {
            console.error('Error loading Zone : ', error);
          }
        )
      } else {
        this.masterServ.createZone(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingServ.showSuccess('Zone Created Successfully');
              this.route.navigate(['master/zone/list']);
            } else {
              this.appSettingServ.showError(resp.message);
            }
          },
          (error) => {
            console.error('Error loading Zone : ', error);
          }
        )
      }
    }
  }

  coerceIntoRequiredFormat(formValue) {
    let createdBy = this.appSettingServ.userSettingSource.value['userEmail'];
    let updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];
    return (this.isEditMode) ? {
      ...formValue,
      updatedBy,
      status: formValue.status === "Active" ? "A" : "I"
    } : {
      ...formValue,
      createdBy,
      status: formValue.status === "Active" ? "A" : "I"
    }
  }

  resetForm(){
    this.inputForm.reset();
  }
}
