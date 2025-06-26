import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DatePipe } from '@angular/common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';

@Component({
    selector: 'app-imco-entry',
    standalone: true,
    imports: [FeatherModule, OnlyTextDirective, OnlyNumbersDirective, TextWithNumbersDirective, NgSelectModule, ReactiveFormsModule,DatePipe,PreventMultiClickDirective],
    templateUrl: './imco-entry.component.html',
    styleUrl: './imco-entry.component.scss'
})
export class ImcoEntryComponent implements OnInit {

    ImcoMasterSid: number;
    isEditMode: boolean;
    ImcoForm: FormGroup;
    imcoData: any;

    modeOfStatus = [
        { value: 'Active', name: 'Active' },
        { value: 'Suspended', name: 'Suspended' },
    ]

    // Pagination Variables
    page = 1;
    pageSize = 10;
    totalAmountofCollection: number;
    currentMenuId: number;
    TandCList: any;

    constructor(
        private masterService: MasterService,
        private fb: FormBuilder,
        private route: Router,
        private currRoute: ActivatedRoute,
        private appSettingService: AppSettingsService,
        private modalService : NgbModal
    ) { }

    ngOnInit() {
        this.initImcoForm();
        this.currRoute.paramMap.subscribe(
            (param) => {
                this.ImcoMasterSid = +param.get('id');
                if (this.ImcoMasterSid) {
                    this.isEditMode = true;
                    this.loadImco(this.ImcoMasterSid);
                }
            }
        )
    }

    initImcoForm() {
        this.ImcoForm = this.fb.group({
            ImcoClass: ['', [Validators.required]],
            ImcoName: ['', [Validators.required]],
            Description: ['', [Validators.required]],
            ImcoUn: [],
            ImcoPageNo: [],
            PackingGroup: [''],
            status: ['Active', [Validators.required]],
            Remarks: ['']
        })
    }

    onSubmit() {
        if (this.ImcoForm.invalid) {
            this.ImcoForm.markAllAsTouched();
            this.ImcoForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields')
            return;
        } else {
            const formValue = this.ImcoForm.value;
            const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
            const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
            const payload = {
                ...formValue,
                status: formValue.status === 'Active' ? 'A' : 'S',
                ImcoUn: parseFloat(formValue.ImcoUn),
                ImcoPageNo: parseFloat(formValue.ImcoPageNo),
                ...(this.isEditMode ? { updatedBy: updatedBy } : { createdBy: createdBy })
            }

            if (this.isEditMode) {
                this.masterService.updateIMCOById(this.ImcoMasterSid, payload).subscribe(
                    (resp: any) => {
                        if (resp.status) {
                            this.appSettingService.showSuccess('Imco Updated Successfully');
                            this.route.navigate(['master/Imco/list']);
                        } else {
                            this.appSettingService.showWarning('Problem Updating Imco');
                        }
                    },
                    (error) => {
                        console.error('Error Updating Imco', error);
                    }
                )
            } else {
                this.masterService.createNewIMCO(payload).subscribe(
                    (resp: any) => {
                        if (resp.status) {
                            this.appSettingService.showSuccess('New Imco Created');
                            this.route.navigate(['master/Imco/list']);
                        } else {
                            this.appSettingService.showWarning('Problem Creating Imco');
                        }
                    },
                    (error) => {
                        console.error('Error Creating Imco', error);
                    }
                )
            }

        }
    }

    loadImco(ImcoMasterSid) {
        this.masterService.getIMCOById(ImcoMasterSid).subscribe(
            (resp: any) => {
                if (resp.status) {
                    this.imcoData = resp.data;
                    this.ImcoForm.patchValue({
                        ...resp.data,
                        status: resp.data.status === 'A' ? 'Active' : 'Suspended',
                    })
                }
            },
            (error) => {
                this.appSettingService.showError('Error Loading Imco');
                console.error('Error Loading Imco', error);
            }
        )
    }

    goBack() {
        history.back();
    }

    resetForm() {
        this.ImcoForm.reset();
    }

    showInfo() {
        if (!this.imcoData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.imcoData;
        modalRef.componentInstance.idLabel = 'Imco Id';
        modalRef.componentInstance.idValue = this.imcoData?.ImcoMasterSid;
    }

    openTandC() {
		this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
		const payload = { MenuMasterSid: this.currentMenuId };
		this.masterService.getTandCByCondition(payload).subscribe(
			(resp: any) => {
				if (resp.status) {
					this.TandCList = resp.data;
					const modalRef = this.modalService.open(TermsAndConditionsComponent, {
						size: 'lg',
						backdrop: 'static',
						centered: true
					});
					modalRef.componentInstance.terms = this.TandCList;
					modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
					modalRef.componentInstance.DocumentSid = this.ImcoMasterSid;

				} else {
					this.appSettingService.showError('Error loading Terms and Conditions');
				}
			},
			(error) => {
				this.appSettingService.showError('Error loading Terms and Conditions', error);
			}
		);
	}

}
