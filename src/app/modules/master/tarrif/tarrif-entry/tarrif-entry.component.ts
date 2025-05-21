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
  selector: 'app-tarrif-entry',
  standalone: true,
  imports: [
    FeatherModule,
    NgbTooltip,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective
  ],
  templateUrl: './tarrif-entry.component.html',
  styleUrl: './tarrif-entry.component.scss'
})
export class TarrifEntryComponent implements OnInit {

  inputForm!: FormGroup;
  isEditMode: boolean;
  TariffHeaderSid: number;

  constructor(
    private masterServ: MasterService,
    private appSettingServ: AppSettingsService,
    private currRoute: ActivatedRoute,
    private route: Router,
    private fb: FormBuilder
  ) { }
  ngOnInit(): void {
    this.initForm();
    this.currRoute.paramMap.subscribe(param => {
      this.TariffHeaderSid = Number(param.get('id'));
      if (this.TariffHeaderSid) {
        this.isEditMode = true;
        this.loadTariff(this.TariffHeaderSid);
      }
    })
  }

  initForm() {
    this.inputForm = this.fb.group({

      POOSid: ['', [Validators.required]],
      POLSid: ['', [Validators.required]],
      PODSid: ['', [Validators.required]],
      FDCSid: ['', [Validators.required]],
      ViaPortSid: ['', [Validators.required]],
      POLTerminal: ['', [Validators.required, Validators.maxLength(5)]],
      PODTerminal: ['', [Validators.required, Validators.maxLength(5)]],
      Carrier: ['', [Validators.required]],
      CargoType: ['', [Validators.required, Validators.maxLength(10)]],
      ServiceLevel: ['', [Validators.required, Validators.maxLength(10)]],
      AgentSid: ['', [Validators.required]],
      StuffingAt: ['', [Validators.required, Validators.maxLength(10)]],
      IncoTerms: ['', [Validators.required, Validators.maxLength(10)]],
      Remarks: ['', [Validators.required, Validators.maxLength(100)]],
      status: ['Active'],
      //Not in form also its compulsory
      // DepartmentName: [''],
      EffectiveDate: new Date(),
      SegmentMasterSid: 1,
      IsSlabApplicable: 'Y'
    })
  }



  loadTariff(TariffHeaderSid) {
    this.masterServ.getTariffById(TariffHeaderSid).subscribe(
      (tariffData) => {
        this.inputForm.patchValue({
          ...tariffData,
          status: tariffData.status === 'A' ? 'Active' : "Invalid"
        })
      },
      (error) => {
        this.appSettingServ.showError('Error Loading Tariff ', error);
      }
    )
  }

  navigateBack() {
    history.back();
  }

  onSave() {
    if (this.inputForm.invalid) {
      this.inputForm.markAllAsTouched();
      this.inputForm.updateValueAndValidity();
      this.appSettingServ.showWarning('Please fill all required fields correctly');
      return;
    } else {
      const formValue = this.inputForm.value;
      const payload = this.coerceIntoRequiredFormat(formValue);

      if (this.isEditMode) {
        this.masterServ.updateTariffById(this.TariffHeaderSid, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingServ.showSuccess('Tariff Updated Successfully');
              this.route.navigate(['master/tarrif/list']);
            } else {
              this.appSettingServ.showError(resp.message);
            }
          },
          (error) => {
            console.error('Error loading Tariff : ', error);
          }
        )
      } else {
        this.masterServ.createTariff(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingServ.showSuccess('Tariff Created Successfully');
              this.route.navigate(['master/tarrif/list']);
            } else {
              this.appSettingServ.showError(resp.message);
            }
          },
          (error) => {
            console.error('Error loading Tariff : ', error);
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
      POOSid: Number(formValue.POOSid),
      POLSid: Number(formValue.POLSid),
      PODSid: Number(formValue.PODSid),
      FDCSid: Number(formValue.FDCSid),
      ViaPortSid: Number(formValue.ViaPortSid),
      AgentSid: Number(formValue.AgentSid),
      Carrier: Number(formValue.Carrier),
      updatedBy,
      status: formValue.status === "Active" ? "A" : "I"
    } : {
      ...formValue,
      POOSid: Number(formValue.POOSid),
      POLSid: Number(formValue.POLSid),
      PODSid: Number(formValue.PODSid),
      FDCSid: Number(formValue.FDCSid),
      ViaPortSid: Number(formValue.ViaPortSid),
      AgentSid: Number(formValue.AgentSid),
      Carrier: Number(formValue.Carrier),
      createdBy,
      status: formValue.status === "Active" ? "A" : "I"
    }
  }

  resetForm(){
    this.inputForm.reset();
  }
}
