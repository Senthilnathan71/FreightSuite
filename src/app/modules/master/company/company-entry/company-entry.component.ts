import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbAlertModule, NgbModal, NgbModalModule, NgbModalRef, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { City } from 'src/app/modules/crm-mobile/Interfaces/city.interface';
import { State } from 'src/app/modules/crm-mobile/Interfaces/state.interface';
import { Country } from 'src/app/modules/crm-mobile/Interfaces/country.interface';
import { forkJoin } from 'rxjs';
import { Currency } from 'src/app/modules/crm-mobile/Interfaces/currency.interface';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
@Component({
	selector: 'app-company-entry',
	standalone: true,
	imports: [
		NgbNavModule,
		NgbModalModule,
		NgbAlertModule,
		CommonModule,
		NgSelectModule,
		FeatherModule,
		OnlyNumbersDirective,
		OnlyTextDirective,
		TextWithNumbersDirective,
		FormsModule,
		ReactiveFormsModule
	],
	templateUrl: './company-entry.component.html',
	styleUrl: './company-entry.component.scss'
})
export class CompanyEntryComponent implements OnInit {
	active = 1;
	active2 = 1;
	modeOfStatus = [
		{ id: 'Active', name: 'Active' },
		{ id: 'Invalid', name: 'Invalid' },
		{ id: 'Block', name: 'Block' }
	];

	//  DECLARATIONS
	CompanyMasterSid: number;
	BranchMasterSid: number;
	BranchBankSid: number;
	isEditMode: boolean;
	isModalEditMode: boolean;
	isBankModalEdit: boolean;
	setErrorMessage:boolean;
	setBranchErrorMessage:boolean;
	branchListLength : number;
	branchBankLength:number;
	modalRef: NgbModalRef;

	companyForm!: FormGroup;
	branchForm!: FormGroup;
	branchBankForm!: FormGroup;
	branchList: any[];
	branchBankList: any;

	cityResults: City[];
	stateResults: State[];
	countryResults: Country[];
	currencyResults: Currency[];

	// CONSTRUCTOR

	constructor(
		private fb: FormBuilder,
		private masterService: MasterService,
		private appSettingService: AppSettingsService,
		private route: Router,
		private currentRoute: ActivatedRoute,
		private modalService: NgbModal,
		private matdial: MatDialog
	) { }

	// LIFECYCLE HOOK

	ngOnInit(): void {
		this.initCompanyForm();
		this.loadAllFields();

		// Looking for Company Master Id in Current URL path
		this.currentRoute.paramMap.subscribe(
			(param) => {
				this.CompanyMasterSid = +param.get('id');
				if (this.CompanyMasterSid) {
					this.isEditMode = true;
					this.loadCompanyData();
				}
			}
		)
	}

	// FORM INITIALIZATION

	initCompanyForm() {
		this.companyForm = this.fb.group({
			companyName: ['', [Validators.required]],
			companyCode: ['', [Validators.required]],
			addressLine1: ['', [Validators.required]],
			addressLine2: [''],
			webSite: [''],
			phoneNumber: [],
			email: ['', Validators.email],
			isHo: [false, [Validators.required]],
			remarks: [''],
			companyLogo: [null],
			reportLogo: [null],
			status: ['Active', [Validators.required]],
			LoginSid: [1],
			CountryMasterSid: ['', [Validators.required]],

			// Field in Excel Design but not in Database Schema
			// PAN : [''],

			// Fields required in backend but not in design
			CityMasterSid: ['', [Validators.required]],
			StateMasterSid: ['', [Validators.required]],
			postal_code: ['', [Validators.required]],
			CurrencyMasterSid: ['', [Validators.required]],
		})
	}

	initBranchForm() {
		this.branchForm = this.fb.group({
			branchName: ['', [Validators.required, Validators.maxLength(100)]],
			branchCode: ['', [Validators.required, Validators.maxLength(10)]],
			branchCompanyMasterSid: [''],
			branchTaxRegistrationNo: ['', [Validators.maxLength(50)]],
			branchCISN: ['', [Validators.maxLength(50)]],
			branchAddressLine1: ['', [Validators.required, Validators.maxLength(500)]],
			branchAddressLine2: ['', [Validators.maxLength(500)]],
			branchCityMasterSid: ['', [Validators.required]],
			branchStateMasterSid: ['', [Validators.required]],
			branchCountryMasterSid: ['', [Validators.required]],
			branchPostalCode: ['', [Validators.required, Validators.maxLength(10)]],
			branchWebSite: ['', [Validators.maxLength(100)]],
			branchPhoneNumber: ['', [Validators.maxLength(20)]],
			branchEmail: ['', [Validators.maxLength(100), Validators.email]],
			branchCurrencyMasterSid: ['', [Validators.required]],
			branchTimeZone: ['', [Validators.maxLength(6)]],
			branchRemarks: ['', [Validators.maxLength(500)]],
			branchStatus: ['Active'],

			// These fields needs to be taken care
			branchCompanyLogo: [],
			branchReportLogo: [],
			branchLoginSid: [1],
			company: [{}],
			cityMaster: [{}],
		})

	}
	initBranchBankForm() {
		this.branchBankForm = this.fb.group({
			BankName: ['', [Validators.required]],
			BankCode: ['', [Validators.required]],
			BankAddress: [''],
			IFSCCode: ['', [Validators.required]],
			BankAccountNo: ['', [Validators.required]],
			BeneficiaryName: ['', [Validators.required]],
			BranchMasterSid: [],
			status: ['Active'],
			Remarks: ['']
		})
	}



	// OPEN NGB MODAL FUNCTIONS


	openBranchEntryModal(content: TemplateRef<any>, data?: any) {
		if(!this.CompanyMasterSid){
			this.setErrorMessage=true;
			return;
		}
		this.initBranchForm();
		if (data) {
			this.isModalEditMode = true;
			this.branchForm.patchValue({
				branchName: data.branchName || '',
				branchCode: data.branchCode || '',
				branchTaxRegistrationNo: data.taxRegistrationNo,
				branchCISN: data.CISN || '',
				branchAddressLine1: data.addressLine1 || '',
				branchAddressLine2: data.addressLine2 || '',
				branchPostalCode: data.postalCode || '',
				branchWebSite: data.webSite || '',
				branchPhoneNumber: data.phoneNumber || '',
				branchEmail: data.email || '',
				branchTimeZone: data.timeZone || '',
				branchRemarks: data.remarks || '',
				branchCompanyLogo: data.companyLogo || '',
				branchReportLogo: data.reportLogo || '',
				branchStatus: data.status === 'A' ? 'Active' : 'Invalid',
				branchCityMasterSid: data.CityMasterSid || '',
				branchCompanyMasterSid: this.CompanyMasterSid || data.CompanyMasterSid || '',
				branchCountryMasterSid: data.CountryMasterSid || '',
				branchCurrencyMasterSid: data.CurrencyMasterSid || '',
				branchLoginSid: data.LoginSid || '',
				branchStateMasterSid: data.StateMasterSid || '',
				cityMaster: data.cityMaster || {},
				company: data.company || {}
			})
			const companyName = this.companyForm.get('companyName').value;
			// this.branchForm.get('branchCompanyMasterSid').setValue(companyName);
			if (data.BranchMasterSid) {
				this.BranchMasterSid = data.BranchMasterSid;
			}
			this.loadBranchBanks()
		}
		this.modalRef = this.modalService.open(content, { size: 'lg' });

	}

	openBranchBankModal(content: TemplateRef<any>, data?: any) {
		if(!this.BranchMasterSid){
			this.setBranchErrorMessage = true;
			return;
		}
		this.initBranchBankForm();
		if (data) {
			this.isBankModalEdit = true;
			this.branchBankForm.patchValue({
				BankName: data.BankName || '',
				BankCode: data.BankCode || '',
				BankAddress: data.BankAddress || '',
				IFSCCode: data.IFSCCode || '',
				BankAccountNo: data.BankAccountNo || '',
				BeneficiaryName: data.BeneficiaryName || '',
				BranchMasterSid: this.BranchMasterSid || data.BranchMasterSid || '',
				status: data.status || '',
				Remarks: data.Remarks || ''
			})

			if (data.BranchBankSid) {
				this.BranchBankSid = data.BranchBankSid;
			}
		}
		this.modalRef = this.modalService.open(content, { size: 'lg' });
	}



	// HELPER FUNCTIONS
	submitCompanyForm() {
		if (this.companyForm.invalid) {
			this.companyForm.markAllAsTouched();
			this.companyForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all required fields correctly');
			return;
		} else {
			let createdBy = this.appSettingService.userSettingSource.value['userEmail'];
			let updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
			const formValue = this.companyForm.value;
			const payload = this.isEditMode ? {
				...formValue,
				CityMasterSid: parseInt(formValue.CityMasterSid),
				StateMasterSid: parseInt(formValue.StateMasterSid),
				CountryMasterSid: parseInt(formValue.CountryMasterSid),
				CurrencyMasterSid: parseInt(formValue.CurrencyMasterSid),
				isHo: formValue.isHo ? 'Y' : 'N',
				status: formValue.status === 'Active' ? 'A' : 'I',
				updatedBy: updatedBy
			} : {
				...formValue,
				CityMasterSid: parseInt(formValue.CityMasterSid),
				StateMasterSid: parseInt(formValue.StateMasterSid),
				CountryMasterSid: parseInt(formValue.CountryMasterSid),
				CurrencyMasterSid: parseInt(formValue.CurrencyMasterSid),
				isHo: formValue.isHo ? 'Y' : 'N',
				status: formValue.status === 'Active' ? 'A' : 'I',
				createdBy: createdBy
			}

			if (this.isEditMode) {
				this.masterService.updateCompanyById(this.CompanyMasterSid, payload).subscribe(
					(resp: any) => {
						if (resp.status) {
							this.appSettingService.showSuccess('Company Updated Successfully');
							this.route.navigate(['master/company/list']);
						} else {
							this.appSettingService.showError(resp.message);
						}
					},
					(error) => {
						console.error('Error loading Company : ', error);
					}
				)
			} else {
				this.masterService.createCompany(payload).subscribe(
					(resp: any) => {
						if (resp.status) {
							this.appSettingService.showSuccess('Company Created Successfully');
							this.route.navigate(['master/company/list']);
						} else {
							this.appSettingService.showError(resp.message);
						}
					},
					(error) => {
						console.error('Error loading Company : ', error);
					}
				)
			}
		}
	}


	submitBranchForm() {
		if (this.branchForm.invalid) {
			this.branchForm.markAllAsTouched();
			this.branchForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all required fields correctly');
			return;
		} else {
			let createdBy = this.appSettingService.userSettingSource.value['userEmail'];
			let updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
			const formValue = this.branchForm.value;
			const payload = {
				branchName: formValue.branchName,
				branchCode: formValue.branchCode,
				taxRegistrationNo: formValue.branchTaxRegistrationNo,
				CISN: formValue.branchCISN,
				addressLine1: formValue.branchAddressLine1,
				addressLine2: formValue.branchAddressLine2,
				postalCode: formValue.branchPostalCode,
				webSite: formValue.branchWebSite,
				phoneNumber: formValue.branchPhoneNumber,
				email: formValue.branchEmail,
				timeZone: formValue.branchTimeZone,
				remarks: formValue.branchRemarks,
				companyLogo: null,
				reportLogo: null,
				status: formValue.branchStatus === 'Active' ? 'A' : 'I',
				CityMasterSid: parseInt(formValue.branchCityMasterSid),
				CompanyMasterSid: this.CompanyMasterSid,
				CountryMasterSid: parseInt(formValue.branchCountryMasterSid),
				CurrencyMasterSid: parseInt(formValue.branchCurrencyMasterSid),
				LoginSid: formValue.branchLoginSid,
				StateMasterSid: parseInt(formValue.branchStateMasterSid),
				...(this.isModalEditMode ? { updatedBy: updatedBy } : { createdBy: createdBy })
			}

			if (this.isModalEditMode) {
				this.masterService.updateBranchById(this.BranchMasterSid, payload).subscribe(
					(resp: any) => {
						if (resp.status) {
							this.appSettingService.showSuccess('Branch Updated Successfully');
							this.loadBranches();
							this.closeBranchForm();
						} else {
							this.appSettingService.showError(resp.message);
						}
					},
					(error) => {
						console.error('Error loading Branch : ', error);
					}
				)
			} else {
				this.masterService.createBranch(payload).subscribe(
					(resp: any) => {
						if (resp.status) {
							this.appSettingService.showSuccess('Branch Created Successfully');
							this.loadBranches()
							this.closeBranchForm();
						} else {
							this.appSettingService.showError(resp.message);
						}
					},
					(error) => {
						console.error('Error loading Branch : ', error);
					}
				)
			}
		}
	}

	submitBranchBankForm() {
		if (this.branchBankForm.invalid) {
			this.branchBankForm.markAllAsTouched();
			this.branchBankForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all required fields correctly');
			return;
		} else {
			let createdBy = this.appSettingService.userSettingSource.value['userEmail'];
			let updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
			const formValue = this.branchBankForm.value;
			const payload = {
				...formValue,
				status: formValue.status === 'Active' ? 'A' : 'I',
				BranchMasterSid: this.BranchMasterSid,
				...(this.isEditMode ? { updatedBy: updatedBy } : { createdBy: createdBy })
			};

			if (this.isBankModalEdit) {
				this.masterService.updateBranchBankById(this.BranchBankSid, payload).subscribe(
					(resp: any) => {
						if (resp.status) {
							this.appSettingService.showSuccess('Branch Bank Updated Successfully');
							this.loadBranchBanks();
							this.closeBranchBankForm();
						} else {
							this.appSettingService.showError(resp.message);
						}
					},
					(error) => {
						console.error('Error loading Branch Bank : ', error);
					}
				)
			} else {
				this.masterService.createBranchBank(payload).subscribe(
					(resp: any) => {
						if (resp.status) {
							this.appSettingService.showSuccess('Branch Bank Created Successfully');
							this.loadBranchBanks();
							this.closeBranchBankForm();
						} else {
							this.appSettingService.showError(resp.message);
						}
					},
					(error) => {
						console.error('Error loading Branch Bank : ', error);
					}
				)
			}
		}
	}


	loadCompanyData() {
		this.masterService.getCompanyById(this.CompanyMasterSid).subscribe(
			(resp) => {
				this.companyForm.patchValue({
					...resp,
					isHo: resp.isHo === 'Y' ? true : false,
					status: resp.status === 'A' ? 'Active' : 'Invalid'
				})
			},
			(error) => {
				this.appSettingService.showWarning('Error Loading Company');
			}
		)
		this.loadBranches();
	}

	loadAllFields() {
		forkJoin({
			countries: this.masterService.getAllCountry(),
			states: this.masterService.getAllState(),
			cities: this.masterService.getAllCity(),
			currencies: this.masterService.getAllCurrencies()
		}).subscribe(({ countries, states, cities, currencies }) => {
			this.countryResults = countries.data;
			this.stateResults = states.data;
			this.cityResults = cities;
			this.currencyResults = currencies;

		})
	}

	loadBranches() {
		this.masterService.getAllBranches().subscribe(
			(branches: any) => {
				this.branchList = branches.filter(branch => branch.CompanyMasterSid === this.CompanyMasterSid)
				this.branchListLength = this.branchList.length;
			}
		);
	}

	loadBranchBanks() {
		this.masterService.getAllBranchBanks().subscribe((banks) => {
			this.branchBankList = banks.filter((bank: { BranchMasterSid: number; }) => bank.BranchMasterSid === this.BranchMasterSid)
			this.branchBankList.forEach(bank => {
				bank.status = bank.status === 'A' ? 'Active' : 'Invalid';
			})
			this.branchBankLength = this.branchBankList.length;
		});
	}

	fetchCompanyNameById(CompanyMasterSid: number) {
		let companyName: string = '';
		this.masterService.getCompanyById(CompanyMasterSid).subscribe(
			(resp: any) => {
				companyName = resp.companyName
			}
		)
		return companyName
	}


	deleteBranch(BranchMasterSid) {
		const matRef = this.matdial.open(DeleteWarningComponent);
		this.modalService.dismissAll();
		matRef.afterClosed().subscribe(
			(res) => {
				if (res) {
					this.masterService.deleteBranchById(BranchMasterSid).subscribe(
						(resp: any) => {
							if (resp) {
								this.appSettingService.showSuccess("Branch Successfully Deleted");
								this.loadBranches();
							} else {
								this.appSettingService.showError('Error Deleting Branch')
							}
						},
					)
				}
			}
		)
	}

	deleteBranchBankById(BranchBankSid) {
		const matRef = this.matdial.open(DeleteWarningComponent);
		this.modalService.dismissAll();
		matRef.afterClosed().subscribe(
			(res) => {
				if (res) {
					this.masterService.deleteBranchBankById(BranchBankSid).subscribe(
						(resp: any) => {
							if (resp) {
								this.appSettingService.showSuccess("Branch Bank Successfully Deleted");
								this.loadBranchBanks();
							} else {
								this.appSettingService.showError('Error Deleting Branch Bank')
							}
						}
					)
				}
			}
		)
	}

	navigateBack() {
		history.back();
	}

	resetCompanyForm() {
		this.companyForm.reset();
	}

	closeBranchBankForm() {
		this.branchBankForm.reset();
		this.setErrorMessage = false;
		this.isBankModalEdit = false;
		this.modalRef.close()
	}
	closeBranchForm() {
		this.branchForm.reset();
		this.isModalEditMode = false;
		this.setBranchErrorMessage=false;
		this.modalService.dismissAll()
	}


}
