import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vessel } from 'src/app/modules/crm-mobile/Interfaces/vessel.interface';
import { CommonModule } from '@angular/common';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';

@Component({
    selector: 'app-vessel-entry',
    standalone: true,
    imports: [
        FeatherModule,
        ReactiveFormsModule,
        CommonModule,
        OnlyNumbersDirective,
        OnlyTextDirective,
        TextWithNumbersDirective
    ],
    templateUrl: './vessel-entry.component.html',
    styleUrl: './vessel-entry.component.scss'
})
export class VesselEntryComponent implements OnInit {

    vesselForm !: FormGroup;
    VesselMasterSid: number;
    isEditMode: boolean;

    vesselTypes = [
        "Container", "Tank", "Bulk", "General"
    ]

    constructor(
        private masterServ: MasterService,
        private appSettingService: AppSettingsService,
        private currRoute: ActivatedRoute,
        private fb: FormBuilder,
        private route: Router
    ) { }

    ngOnInit() {
        this.initForm();

        this.currRoute.paramMap.subscribe(
            (param) => {
                this.VesselMasterSid = +param.get('id');
                if (this.VesselMasterSid) {
                    this.isEditMode = true;
                    this.loadVessel();
                }
            }
        )
    }

    initForm() {
        this.vesselForm = this.fb.group({
            VesselName: ['', [Validators.required, Validators.maxLength(100)]],
            VesselShortCode: ['', [Validators.required, Validators.maxLength(5)]],
            IMOCode: ['', [Validators.required, Validators.maxLength(10)]],
            CallSignIn: ['', [Validators.required, Validators.maxLength(10)]],
            YearofBuilt: ['', [Validators.required]],
            MMSINo: ['', [Validators.required]],
            GRT: ['', [Validators.required]],
            NRT: ['', [Validators.required]],
            VesselType: ['', [Validators.required, Validators.maxLength(10)]],
            VesselOperator: ['', [Validators.required, Validators.maxLength(100)]],
            LengthinMtr: ['', [Validators.required]],
            BreadthinMtr: ['', [Validators.required]],
            Remarks: ['', [Validators.required, Validators.maxLength(200)]],
            status: ['Active']
        })
    }

    loadVessel() {
        this.masterServ.loadVesselById(this.VesselMasterSid).subscribe(
            (vesselData: Vessel) => {
                this.vesselForm.patchValue({
                    ...vesselData,
                    status: vesselData.status === 'A' ? "Active" : "Suspended"
                })
            },
            (error) => {
                this.appSettingService.showError(`Error Loading Vessel `, error)
            }
        )
    }

    navigateBack() {
        history.back();
    }

    onSave() {
        if (this.vesselForm.invalid) {
            this.vesselForm.markAllAsTouched();
            this.vesselForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill out all the required fields');
            return;
        } else {
            const formValue = this.vesselForm.value;
            const payload = this.coerceIntoRequiredFormat(formValue);


            if (this.isEditMode) {
                this.masterServ.updateVesselById(this.VesselMasterSid, payload).subscribe(
                    (resp: any) => {
                        if (resp.status) {
                            this.appSettingService.showSuccess("Vessel Updated Successfully");
                            this.route.navigate(['/master/vessel/list']);
                        } else {
                            this.appSettingService.showError(resp.message)
                        }
                    },
                    (error) => {
                        console.error('Error updating Vessel', error);
                    }
                )
            } else {
                this.masterServ.createVessel(payload).subscribe(
                    (resp: any) => {
                        if (resp.status) {
                            this.appSettingService.showSuccess('Vessel Created Successfully');
                            this.route.navigate(['/master/vessel/list']);
                        } else {
                            this.appSettingService.showError(resp.message)
                        }
                    },
                    (error) => {
                        console.error('Error Creating Vessel', error);
                    }
                )
            }
        }
    }

    coerceIntoRequiredFormat(formValue: Vessel) {
        const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
        const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
        return this.isEditMode ? {
            ...formValue,
            YearofBuilt: Number(formValue.YearofBuilt),
            MMSINo: Number(formValue.MMSINo),
            GRT: Number(formValue.GRT),
            NRT: Number(formValue.NRT),
            LengthinMtr: Number(formValue.LengthinMtr),
            BreadthinMtr: Number(formValue.BreadthinMtr),
            status: formValue.status === 'Active' ? 'A' : 'S',
            updatedBy: updatedBy
        } : {
            ...formValue,
            YearofBuilt: Number(formValue.YearofBuilt),
            MMSINo: Number(formValue.MMSINo),
            GRT: Number(formValue.GRT),
            NRT: Number(formValue.NRT),
            LengthinMtr: Number(formValue.LengthinMtr),
            BreadthinMtr: Number(formValue.BreadthinMtr),
            status: formValue.status === 'Active' ? 'A' : 'S',
            createdBy: createdBy
        }
    }


}
