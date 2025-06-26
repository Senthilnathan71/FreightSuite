import { CommonModule, DatePipe } from '@angular/common';
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
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
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
		ReactiveFormsModule,
		DatePipe,
		PreventMultiClickDirective
	],
	templateUrl: './company-entry.component.html',
	styleUrl: './company-entry.component.scss'
})
export class CompanyEntryComponent implements OnInit {
	active = 1;
	active2 = 1;
	modeOfStatus = [
		{ id: 'Active', name: 'Active' },
		{ id: 'Suspended', name: 'Suspended' },
		
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
	companyData : any;
	branchData : any;
	bankData : any;
	currentMenuId: number;
	TandCList: any;

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
			CountryMasterSid: ['', [Validators.required]],
			CurrencyMasterSid: ['', [Validators.required]],
			addressLine1: ['', [Validators.required]],
			webSite: [''],
			email: ['', Validators.email],
			phoneNumber: [],
			Pan : [''],
			isHo: [false, [Validators.required]],
			status: ['Active', [Validators.required]],
			remarks: [''],

			// Needs to be removed
			StateMasterSid : [2]
		})
	}

	initBranchForm() {
		this.branchForm = this.fb.group({
			branchCompanyMasterSid: [''],
			branchName: ['', [Validators.required, Validators.maxLength(100)]],
			branchCode: ['', [Validators.required, Validators.maxLength(10)]],
			branchAddressLine1: ['', [Validators.required, Validators.maxLength(500)]],
			branchAddressLine2: ['', [Validators.maxLength(500)]],
			branchPostalCode: ['', [Validators.required, Validators.maxLength(10)]],
			branchCityMasterSid: ['', [Validators.required]],
			branchStateMasterSid: ['', [Validators.required]],
			branchCountryMasterSid: ['', [Validators.required]],
			branchWebSite: ['', [Validators.maxLength(100)]],
			branchPhoneNumber: ['', [Validators.maxLength(20)]],
			branchEmail: ['', [Validators.maxLength(100), Validators.email]],
			branchTimeZone: ['', [Validators.maxLength(6)]],
			branchRemarks: ['', [Validators.maxLength(500)]],
			branchStatus: ['Active'],
			branchTaxRegistrationNo: ['', [Validators.maxLength(50)]],
			branchCompanyLogo: [],
			branchReportLogo: [],
			
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
		this.initBranchForm();
		if (data) {
			this.isModalEditMode = true;
			this.branchData = data;
			this.getStatesByCountry(data.CountryMasterSid);
			this.getCitiesByState(data.StateMasterSid);
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
				branchStatus: data.status === 'A' ? 'Active' : 'Suspended',
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
		this.modalRef = this.modalService.open(content, { size: 'lg',centered : true , backdrop : 'static' });

	}

	openBranchBankModal(content: TemplateRef<any>, data?: any) {
		this.initBranchBankForm();
		if (data) {
			this.isBankModalEdit = true;
			this.bankData = data;
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
		this.modalRef = this.modalService.open(content, { size: 'lg' ,centered : true , backdrop : 'static' });
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
				CountryMasterSid: parseInt(formValue.CountryMasterSid),
				CurrencyMasterSid: parseInt(formValue.CurrencyMasterSid),
				isHo: formValue.isHo ? 'Y' : 'N',
				status: formValue.status === 'Active' ? 'A' : 'S',
				updatedBy: updatedBy
			} : {
				...formValue,
				CountryMasterSid: parseInt(formValue.CountryMasterSid),
				CurrencyMasterSid: parseInt(formValue.CurrencyMasterSid),
				isHo: formValue.isHo ? 'Y' : 'N',
				status: formValue.status === 'Active' ? 'A' : 'S',
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
				status: formValue.branchStatus === 'Active' ? 'A' : 'S',
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
				status: formValue.status === 'Active' ? 'A' : 'S',
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
				this.companyData = resp;
				this.companyForm.patchValue({
					...resp,
					isHo: resp.isHo === 'Y' ? true : false,
					status: resp.status === 'A' ? 'Active' : 'Suspended'
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
			currencies: this.masterService.getAllCurrencies()
		}).subscribe(({ countries, currencies }) => {
			this.countryResults = countries.data;
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
				bank.status = bank.status === 'A' ? 'Active' : 'Suspended';
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

	getStatesByCountry(CountryMasterSid){
		// Remove Everything and mark the control as touched
		this.cityResults = [];
		this.stateResults = [];
		if (this.branchForm.get('branchStateMasterSid').value) {
			this.branchForm.get('branchStateMasterSid').reset();
			this.branchForm.get('branchStateMasterSid').markAsTouched();
		}
		if (this.branchForm.get('branchCityMasterSid').value) {
			this.branchForm.get('branchCityMasterSid').reset();
			this.branchForm.get('branchCityMasterSid').markAsTouched();
		}

		if(!CountryMasterSid){
			return;
		}

		this.masterService.getStateByCountryId(CountryMasterSid).subscribe(
			(resp:any)=>{
				if(resp.status){
					this.stateResults = resp.data;
				} else {
					console.error('Error loading States with CountryId');
				}
			}
		)
	}

	getCitiesByState(StateMasterSid){
		this.cityResults = [];

		if(this.branchForm.get('branchCityMasterSid').value){
			this.branchForm.get('branchCityMasterSid').reset();
			this.branchForm.get('branchCityMasterSid').markAsTouched();
		}

		if(!StateMasterSid){
			return;
		}

		this.masterService.getCityByStateId(StateMasterSid).subscribe(
			(resp:any)=>{
				if(resp.status){
				this.cityResults = resp.data
				} else {
					console.error('Error loading City with State Id');
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
		this.cityResults = [];
		this.stateResults = [];
		this.isModalEditMode = false;
		this.setBranchErrorMessage=false;
		this.modalService.dismissAll()
	}

	showCompanyInfo() {
    if(!this.companyData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.companyData;
    modalRef.componentInstance.idLabel = 'Company Id';
    modalRef.componentInstance.idValue = this.companyData?.CompanyMasterSid;
  }
	showBranchInfo() {
    if(!this.branchData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.branchData;
    modalRef.componentInstance.idLabel = 'Branch Id';
    modalRef.componentInstance.idValue = this.branchData?.BranchMasterSid;
  }
	showBranchBankInfo() {
    if(!this.bankData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.bankData;
    modalRef.componentInstance.idLabel = 'Branch Bank Id';
    modalRef.componentInstance.idValue = this.bankData?.BranchBankSid;
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
          modalRef.componentInstance.DocumentSid = this.CompanyMasterSid;

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
