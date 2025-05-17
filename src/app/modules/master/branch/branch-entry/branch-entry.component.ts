import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { City } from 'src/app/modules/crm-mobile/Interfaces/city.interface';
import { State } from 'src/app/modules/crm-mobile/Interfaces/state.interface';
import { Country } from 'src/app/modules/crm-mobile/Interfaces/country.interface';
import { forkJoin } from 'rxjs';
import { FeatherModule } from 'angular-feather';
import { Branch } from 'src/app/modules/crm-mobile/Interfaces/branch.interface';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';

@Component({
	selector: 'app-branch-entry',
	standalone: true,
	imports: [ReactiveFormsModule, CommonModule, FormsModule, FeatherModule, OnlyNumbersDirective, OnlyTextDirective],
	templateUrl: './branch-entry.component.html',
	styleUrl: './branch-entry.component.scss'
})
export class BranchEntryComponent implements OnInit {

	branchForm !: FormGroup;
	BranchMasterSid: number = 0;
	isEditMode: boolean;

	cityList: City[];
	stateList: State[];
	countryList: Country[];
	companyList: any[];
	currencyList: any[];



	constructor(
		private fb: FormBuilder,
		private masterServ: MasterService,
		private currRoute: ActivatedRoute,
		private route: Router,
		private appSettingServ: AppSettingsService
	) { }

	ngOnInit() {
		this.initForm();
		this.loadAllFields();
		this.currRoute.paramMap.subscribe(
			(param) => {
				this.BranchMasterSid = +param.get('id');
				if (this.BranchMasterSid) {
					this.isEditMode = true;
					this.loadBranch();
				}
			}
		)
	}

	initForm() {
		this.branchForm = this.fb.group({
			branchName: ['', [Validators.required, Validators.maxLength(100)]],
			branchCode: ['', [Validators.required, Validators.maxLength(10)]],
			CompanyMasterSid: ['', [Validators.required]],
			taxRegistrationNo: ['', [Validators.maxLength(50)]],
			CISN: ['', [Validators.maxLength(50)]],
			addressLine1: ['', [Validators.required, Validators.maxLength(500)]],
			addressLine2: ['', [Validators.maxLength(500)]],
			CityMasterSid: ['', [Validators.required]],
			StateMasterSid: ['', [Validators.required]],
			CountryMasterSid: ['', [Validators.required]],
			postalCode: ['', [Validators.required, Validators.maxLength(10)]],
			webSite: ['', [Validators.maxLength(100)]],
			phoneNumber: ['', [Validators.maxLength(20)]],
			email: ['', [Validators.maxLength(100), Validators.email]],
			CurrencyMasterSid: ['', [Validators.required]],
			timeZone: ['', [Validators.maxLength(6)]],
			remarks: ['', [Validators.maxLength(500)]],
			status: ['Active'],

			// Dont know what to do with these
			companyLogo: [], // Typically an image file i guess , schema type : Bytes 
			reportLogo: [], // Typically an image file i guess , schema type : Bytes 
			LoginSid: [1], // No found in any master
		})
	}

	loadAllFields() {
		forkJoin({
			countries: this.masterServ.getAllCountry(),
			states: this.masterServ.getAllState(),
			cities: this.masterServ.getAllCity(),
			companies: this.masterServ.getAllCompanies(),
			currencies: this.masterServ.getAllCurrencies()
		}).subscribe(({ countries, states, cities, companies, currencies }) => {
			this.countryList = countries.data;
			this.stateList = states.data;
			this.cityList = cities;
			this.companyList = companies;
			this.currencyList = currencies
		})
	}

	loadBranch() {
		this.masterServ.loadBranchById(this.BranchMasterSid).subscribe(
			(branchData) => {
				this.branchForm.patchValue({
					...branchData,
					status: branchData.status === 'A' ? "Active" : "Invalid"
				})
			},
			(error) => {
				console.error('Error Loading Branch ', error);
			}
		)
	}


	onSave() {
		if (this.branchForm.invalid) {
			this.branchForm.markAllAsTouched();
			this.branchForm.updateValueAndValidity();
			this.appSettingServ.showWarning('Please fill all the required fields correctly');
			return;
		} else {
			const formValue = this.branchForm.value;
			const payload = this.coerceIntoRequiredFormat(formValue);

			if (this.isEditMode) {
				this.masterServ.updateBranchById(this.BranchMasterSid, payload).subscribe(
					(res: any) => {
						if (res.status) {
							this.appSettingServ.showSuccess('Branch is successfully updated');
							this.route.navigate(['master/branch/list'])
						} else {
							this.appSettingServ.showError(res.message);
						}
					},
					(error) => {
						console.error('Error Branch Updation ', error)
					}
				)
			} else {
				this.masterServ.createBranch(payload).subscribe(
					(res: any) => {
						if (res.status) {
							this.appSettingServ.showSuccess('branch is successfully created');
							this.route.navigate(['master/branch/list'])
						} else {
							this.appSettingServ.showError(res.message);
						}
					},
					(error) => {
						console.error('Error Branch Creation ', error)
					}
				)
			}
		}
	}

	coerceIntoRequiredFormat(formData: Branch) {
		const createdBy = this.appSettingServ.userSettingSource.value['userEmail']
		const updatedBy = this.appSettingServ.userSettingSource.value['userEmail']
		return this.isEditMode ? {
			...formData,
			CityMasterSid: Number(formData.CityMasterSid),
			StateMasterSid: Number(formData.StateMasterSid),
			CountryMasterSid: Number(formData.CountryMasterSid),
			CurrencyMasterSid: Number(formData.CurrencyMasterSid),
			CompanyMasterSid: Number(formData.CompanyMasterSid),
			status: formData.status === 'Active' ? 'A' : 'I',
			updatedBy: updatedBy
		} : {
			...formData,
			CityMasterSid: Number(formData.CityMasterSid),
			StateMasterSid: Number(formData.StateMasterSid),
			CountryMasterSid: Number(formData.CountryMasterSid),
			CurrencyMasterSid: Number(formData.CurrencyMasterSid),
			CompanyMasterSid: Number(formData.CompanyMasterSid),
			status: formData.status === 'Active' ? 'A' : 'I',
			createdBy: createdBy
		}
	}

	navigateBack() {
		history.back();
	}
}
