import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NgbAlertModule, NgbModal, NgbModalModule, NgbModalRef, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
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
import { forkJoin, Subscription } from 'rxjs';
import { Currency } from 'src/app/modules/crm-mobile/Interfaces/currency.interface';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';
import { ConfigComponent } from '../config/config.component';
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
		PreventMultiClickDirective,
		NgbPaginationModule,
		ConfigComponent
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
	setErrorMessage: boolean;
	setBranchErrorMessage: boolean;
	branchListLength: number;
	branchBankLength: number;
	modalRef: NgbModalRef;
	permissions: string[] = [];
	currentMenuPermissions: any = {};
	userData: any;

	companyForm!: FormGroup;
	branchForm!: FormGroup;
	branchBankForm!: FormGroup;
	branchList: any[];
	branchBankList: any;

	cityResults: City[];
	branchCityList: City[] = [];
	stateResults: State[];
	countryResults: Country[];
	currencyResults: Currency[];
	companyData: any;
	branchData: any;
	bankData: any;
	currentMenuId: number;
	TandCList: any;
	currentBranchIndex: number;
	currentBankIndex: number;
	branchFormSubmitted = false;
	private branchModalRef: NgbModalRef;
	private bankModalRef: NgbModalRef;
	modalDismissSubscription: Subscription;
	isPanRequiredFlag = false;
	branchPage = 1;
	branchPageSize = 5;
	totalBranches = 0;
	bankPage = 1;
	bankPageSize = 5;
	totalBanks = 0;
	paginatedBranches: any[] = [];
	paginatedBanks: any[] = [];
	configModalData: ConfigModalData;
	configModalRef: NgbModalRef;
	

	// CONSTRUCTOR

	constructor(
		private fb: FormBuilder,
		private masterService: MasterService,
		private appSettingService: AppSettingsService,
		private route: Router,
		private currentRoute: ActivatedRoute,
		private modalService: NgbModal,
		private matdial: MatDialog,
		private cdRef: ChangeDetectorRef
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
		// this.appSettingService.getUser().subscribe(
		// 	user => {
		// 		if (user) {
		// 			this.userData = user;
		// 			this.checkPermissions();

		// 		}
		// 	}
		// )
		const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}

	}
	checkPermissions() {
		const currentMenuId = Number(localStorage.getItem('currentMenuId'));
		const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
		console.log(currentMenuId)
		console.log(userRole)
		if (currentMenuId && userRole) {
			this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
				next: (response) => {
					this.currentMenuPermissions = response.data.MenuPermissions || {};
					this.permissions = Object.keys(this.currentMenuPermissions)
						.filter(key => this.currentMenuPermissions[key] === 'isTrue');
					console.log(this.permissions)
				}
			});
		}
	}

	hasPermission(permission: string): boolean {
		return this.permissions.includes(permission);
	}


	openConfigModal(isCompany: boolean) {
  if (isCompany) {
    const currentConfig = this.companyForm.get('config').value || {};
    this.route.navigate(['master/company', this.CompanyMasterSid, 'config'], {
      state: {
        companyName: this.companyForm.get('companyName')?.value,
        config: currentConfig
      }
    });
  } 
}
	
	
	// FORM INITIALIZATION

	initCompanyForm() {
		this.companyForm = this.fb.group({
			companyName: ['', [Validators.required]],
			companyCode: ['', [Validators.required]],
			CountryMasterSid: [null, [Validators.required]],
			CurrencyMasterSid: [null, [Validators.required]],
			addressLine1: ['', [Validators.required]],
			webSite: ['', [this.customWebsiteValidator(), Validators.maxLength(100)]],
			email: ['', [EmailValidators.multipleEmails(), Validators.maxLength(100)]],
			phoneNumber: [],
			Pan: ['', this.panValidator],
			isHo: [false],
			status: ['Active'],
			remarks: [''],
			StateMasterSid: [2],
			config: [{}],
			branches: this.fb.array([])
		});
		this.companyForm.get('CountryMasterSid')?.valueChanges.subscribe((countryId) => {
			const country = this.countryResults?.find(c => c.CountryMasterSid === countryId);
			this.handlePanControl(country);
		});
	}

	initBranchForm() {
		this.branchForm = this.fb.group({
			branchCompanyMasterSid: [''],
			branchName: ['', [Validators.required, Validators.maxLength(100)]],
			branchCode: ['', [Validators.required, Validators.maxLength(10)]],
			branchAddressLine1: ['', [Validators.required, Validators.maxLength(500)]],
			branchAddressLine2: ['', [Validators.maxLength(500)]],
			branchPostalCode: ['', [Validators.required, Validators.maxLength(10)]],
			branchCityMasterSid: [null, [Validators.required]],
			branchStateMasterSid: [null, [Validators.required]],
			branchCountryMasterSid: [null, [Validators.required]],
			branchWebSite: ['', [Validators.maxLength(100), this.customWebsiteValidator()]],
			branchPhoneNumber: ['', [Validators.maxLength(20)]],
			branchEmail: ['', [Validators.maxLength(100), EmailValidators.multipleEmails()]],
			branchTimeZone: ['', [Validators.maxLength(6)]],
			branchRemarks: ['', [Validators.maxLength(500)]],
			branchStatus: ['Active'],
			branchTaxRegistrationNo: ['', [Validators.maxLength(50), this.gstValidator]],
			branchCompanyLogo: [],
			branchReportLogo: [],
			config: [{}],
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

	get branches(): FormArray {
		return this.companyForm.get('branches') as FormArray;
	}

	createBranchFormGroup(branchData?: any): FormGroup {
		const group = this.fb.group({
			BranchMasterSid: [branchData?.BranchMasterSid || null],
			branchName: [branchData?.branchName || '', [Validators.required, Validators.maxLength(100)]],
			branchCode: [branchData?.branchCode || '', [Validators.required, Validators.maxLength(10)]],
			addressLine1: [branchData?.branchAddressLine1 || '', [Validators.required, Validators.maxLength(500)]],
			addressLine2: [branchData?.branchAddressLine2 || '', [Validators.maxLength(500)]],
			postalCode: [branchData?.branchPostalCode || '', [Validators.required, Validators.maxLength(10)]],
			CityMasterSid: [branchData?.branchCityMasterSid || null, [Validators.required]],
			StateMasterSid: [branchData?.branchStateMasterSid || null, [Validators.required]],
			CountryMasterSid: [branchData?.branchCountryMasterSid || null, [Validators.required]],
			webSite: [branchData?.branchWebSite || '', [Validators.maxLength(100), this.customWebsiteValidator()]],
			phoneNumber: [branchData?.branchPhoneNumber || '', [Validators.maxLength(20)]],
			email: [branchData?.branchEmail || '', [Validators.maxLength(100), this.customEmailValidator()]],
			timeZone: [branchData?.branchTimeZone || '', [Validators.maxLength(6)]],
			remarks: [branchData?.branchRemarks || '', [Validators.maxLength(500)]],
			status: [branchData?.status ? (branchData.status === 'A' ? 'Active' : 'Suspended') : 'Active'],
			taxRegistrationNo: [branchData?.branchTaxRegistrationNo || '', [Validators.maxLength(50)]],
			companyLogo: [branchData?.branchCompanyLogo || null],
			reportLogo: [branchData?.branchReportLogo || null],
			config: [branchData?.branchconfig || {}],
			branchBanks: this.fb.array([])
		});
		
		return group;
	}

	branchBanks(branchIndex: number): FormArray {
		if (!this.branches || branchIndex >= this.branches.length) {
			return this.fb.array([]);
		}
		const branch = this.branches.at(branchIndex);
		const banks = branch.get('branchBanks');
		return banks ? (banks as FormArray) : this.fb.array([]);
	}

	createBankFormGroup(bankData?: any): FormGroup {
		return this.fb.group({
			BranchBankSid: [bankData?.BranchBankSid || null],
			BankName: [bankData?.BankName || '', [Validators.required]],
			BankCode: [bankData?.BankCode || '', [Validators.required]],
			BankAddress: [bankData?.BankAddress || ''],
			IFSCCode: [bankData?.IFSCCode || '', [Validators.required]],
			BankAccountNo: [bankData?.BankAccountNo || '', [Validators.required]],
			BeneficiaryName: [bankData?.BeneficiaryName || '', [Validators.required]],
			status: [bankData?.status],
			Remarks: [bankData?.Remarks || '']
		});
	}

	loadCompanyData() {
		this.masterService.getCompanyById(this.CompanyMasterSid).subscribe(
    (resp) => {
      if (resp) {
        this.companyData = resp;
        const config = resp.config || {};

					// Patch main company form values
					this.companyForm.patchValue({
						...resp,
						isHo: resp.isHo === 'Y' ? true : false,
						status: resp.status === 'A' ? 'Active' : 'Suspended',
						config: resp.config || {}
					});
					
					
					this.handlePanControl({ CountryMasterSid: this.companyData?.CountryMasterSid });

					// Clear existing branches
					while (this.branches.length !== 0) {
						this.branches.removeAt(0);
					}

					// Process branches
					const branchData: any[] = resp.branchMaster || [];
					branchData.forEach((branch) => {
						// Create branch form group
						const branchGroup = this.fb.group({
							BranchMasterSid: branch?.BranchMasterSid,
							branchName: branch?.branchName,
							branchCode: branch?.branchCode,
							addressLine1: branch?.addressLine1,
							addressLine2: branch?.addressLine2,
							postalCode: branch?.postalCode,
							CityMasterSid: branch?.CityMasterSid,
							StateMasterSid: branch?.StateMasterSid,
							CountryMasterSid: branch?.CountryMasterSid,
							webSite: branch?.webSite,
							phoneNumber: branch?.phoneNumber,
							email: branch?.email,
							timeZone: branch?.timeZone,
							remarks: branch?.remarks,
							status: branch?.status ? (branch.status === 'A' ? 'Active' : 'Suspended') : 'Active',
							taxRegistrationNo: branch?.taxRegistrationNo,
							companyLogo: branch?.companyLogo || null,
							reportLogo: branch?.reportLogo || null,
							cityName: branch.cityMaster?.cityName,
							config: branch?.config,
							branchBanks: this.fb.array([])
						});
						// const branchGroup = this.createBranchFormGroup(branch);
						this.branches.push(branchGroup);

						// Process branch banks if they exist
						const branchBankData: any[] = branch.branchBank || [];
						const branchBanksArray = branchGroup.get('branchBanks') as FormArray;

						// Clear existing banks for this branch
						while (branchBanksArray.length !== 0) {
							branchBanksArray.removeAt(0);
						}

						// Add banks to this branch's FormArray
						branchBankData.forEach(bank => {
							const bankGroup = this.fb.group({
								BranchBankSid: bank?.BranchBankSid,
								BankName: bank?.BankName,
								BankCode: bank?.BankCode,
								BankAddress: bank?.BankAddress,
								IFSCCode: bank?.IFSCCode,
								BankAccountNo: bank?.BankAccountNo,
								BeneficiaryName: bank?.BeneficiaryName,
								status: bank?.status === 'A' ? 'Active' : 'Suspended',
								Remarks: bank?.Remarks
							})
							branchBanksArray.push(bankGroup);
						});
					});
					this.onBranchesUpdated();
				}
			},
			(error) => {
				this.appSettingService.showWarning('Error loading company.');
			}
		);
	}

	openBranchEntryModal(content: TemplateRef<any>, branchIndex?: number) {
		this.branchFormSubmitted = false;

		// Initialize branch form (same as before)
		if (branchIndex === undefined) {
			const newBranch = this.createBranchFormGroup();
			this.branches.push(newBranch);
			this.currentBranchIndex = this.branches.length - 1;
			this.isModalEditMode = false;

			this.initBranchForm();
			this.branchForm.patchValue({ branchStatus: 'Active' });
			let CountryMasterSid: any;
			if (this.companyForm.get('CountryMasterSid').value !== '' || this.companyForm.get('CountryMasterSid').value !== null) {
				CountryMasterSid = this.companyForm.get('CountryMasterSid').value;
				this.branchForm.get('branchCountryMasterSid').setValue(CountryMasterSid);
				this.getStatesByCountry(CountryMasterSid, true);
			}
		} else {
			this.isModalEditMode = true;
			this.currentBranchIndex = branchIndex;
			this.branchData = this.branches.at(branchIndex).value;

			let timeZoneValue = this.branchData?.timeZone;
			if (timeZoneValue) {

				if (!['+', '-'].includes(timeZoneValue[0])) {
					timeZoneValue = '+' + timeZoneValue;
				}
				if (timeZoneValue.includes(':') && timeZoneValue.length === 4) {
					timeZoneValue = timeZoneValue.replace(/^([+-])(\d):/, '$10$2:');
				}
			}

			this.initBranchForm();
			this.branchForm.patchValue({
				BranchMasterSid: this.branchData?.BranchMasterSid,
				branchName: this.branchData?.branchName,
				branchCode: this.branchData?.branchCode,
				branchAddressLine1: this.branchData?.addressLine1,
				branchAddressLine2: this.branchData?.addressLine2,
				branchPostalCode: this.branchData?.postalCode,
				branchCityMasterSid: this.branchData?.CityMasterSid,
				branchStateMasterSid: this.branchData?.StateMasterSid,
				branchCountryMasterSid: this.branchData?.CountryMasterSid,
				branchWebSite: this.branchData?.webSite,
				branchPhoneNumber: this.branchData?.phoneNumber,
				branchEmail: this.branchData?.email,
				branchTimeZone: this.branchData?.timeZone,
				branchRemarks: this.branchData?.remarks,
				branchStatus: this.branchData?.status,
				branchTaxRegistrationNo: this.branchData?.taxRegistrationNo,
				branchCompanyLogo: this.branchData?.companyLogo || null,
				branchReportLogo: this.branchData?.reportLogo || null,
				branchconfig: this.branchData?.config

			});
			
			if (this.isModalEditMode) {
				this.getStatesByCountry(this.branchData?.CountryMasterSid, true);
				this.getCitiesByState(this.branchData?.StateMasterSid, true);
			}
		}

		if (this.branchModalRef) {
			this.branchModalRef.close();
		}

		// Open modal and handle dismissal
		this.branchModalRef = this.modalService.open(content, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});

		// Store subscription to clean up later
		this.modalDismissSubscription = this.branchModalRef.closed.subscribe((reason) => {
			if (reason !== 'submitted' && !this.isModalEditMode && this.currentBranchIndex !== null) {
				this.branches.removeAt(this.currentBranchIndex);
				this.currentBranchIndex = null;
			}
			this.cleanupSubscriptions();
		});

		this.updateBranchPagination();
		if (branchIndex !== undefined) {
			this.updateBankPagination(branchIndex);
		}
	}

	submitBranchForm() {
		console.log('Submitting branch:', this.branchForm.value);
		const fullConfig: any = {};
		
		this.branchForm.get('config')?.setValue(fullConfig);

		// 1. Validate branch form
		if (this.branchForm.invalid) {
			this.branchForm.markAllAsTouched();
			this.appSettingService.showWarning('Please fill all required fields correctly.');
			return;
		}

		// 2. Validate at least one bank exists for new branches
		if (!this.isModalEditMode && this.currentBranchIndex !== null) {
			const banks = this.branchBanks(this.currentBranchIndex);
			if (banks.length === 0) {
				this.appSettingService.showWarning('At least one bank must be added to the branch.');
				return;
			}
		}


		// 3. Prepare payload
		const formValue = this.branchForm.value;
		const payload = {
			branchName: formValue.branchName,
			branchCode: formValue.branchCode,
			addressLine1: formValue.branchAddressLine1,
			addressLine2: formValue.branchAddressLine2,
			postalCode: formValue.branchPostalCode,
			webSite: formValue.branchWebSite,
			phoneNumber: formValue.branchPhoneNumber,
			email: formValue.branchEmail,
			timeZone: formValue.branchTimeZone,
			remarks: formValue.branchRemarks,
			taxRegistrationNo: formValue.branchTaxRegistrationNo,
			status: formValue.branchStatus,
			config: formValue.config,
			CityMasterSid: parseInt(formValue.branchCityMasterSid),
			StateMasterSid: parseInt(formValue.branchStateMasterSid),
			CountryMasterSid: parseInt(formValue.branchCountryMasterSid),
			branchBanks: this.currentBranchIndex !== null
				? this.branchBanks(this.currentBranchIndex).value
				: []
		};

		// 4. Update FormArray
		if (this.currentBranchIndex !== null) {
			this.branches.at(this.currentBranchIndex).patchValue(payload);
			console.log('Updated branch:', this.branches.at(this.currentBranchIndex).value);
		}

		// 5. Mark as submitted and close modal FIRST
		this.branchFormSubmitted = true;
		this.branchModalRef.close('submitted');

		this.onBranchesUpdated();

		// 6. Then show success message and cleanup
		this.appSettingService.showSuccess(
			this.isModalEditMode ? 'Branch updated successfully.' : 'Branch added successfully.'
		);
		this.cleanupSubscriptions();

		// 7. Force UI update
		this.cdRef.detectChanges();
	}

	closeBranchForm() {
		if (this.isModalEditMode && this.currentBranchIndex !== null) {
			// Restore original data only if in edit mode
			this.branches.at(this.currentBranchIndex).patchValue(this.branchData);
		} else if (!this.isModalEditMode && this.currentBranchIndex !== null) {
			// Remove the newly added branch if not in edit mode
			this.branches.removeAt(this.currentBranchIndex);
		}

		this.branchModalRef.dismiss('closed');
		this.cleanupSubscriptions();
		this.cdRef.detectChanges();
	}
	cleanupSubscriptions() {
		if (this.modalDismissSubscription) {
			this.modalDismissSubscription.unsubscribe();
			this.modalDismissSubscription = null;
		}
	}

	// Don't forget to clean up in ngOnDestroy
	ngOnDestroy() {
		if (this.modalDismissSubscription) {
			this.modalDismissSubscription.unsubscribe();
		}
	}

	openBranchBankModal(content: TemplateRef<any>, branchIndex: number, bankIndex?: number) {
		// Initialize the bank form
		this.initBranchBankForm();
		console.log(branchIndex);

		if (this.bankModalRef) {
			this.bankModalRef.close();
		}

		if (bankIndex !== undefined) {
			// Edit existing bank
			this.isBankModalEdit = true;
			this.currentBankIndex = bankIndex;
			this.currentBranchIndex = branchIndex; // Store branch index
			this.bankData = this.branchBanks(branchIndex).at(bankIndex).value;

			// Patch values into the bank form
			this.branchBankForm.patchValue({
				...this.bankData
			});
		} else {
			// Add new bank
			this.isBankModalEdit = false;
			this.currentBankIndex = null;
			this.currentBranchIndex = branchIndex; // Store branch index
			this.bankData = null;
		}

		this.bankModalRef = this.modalService.open(content, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
	}

	submitBranchBankForm() {
		console.log('Branch Bank Form Value Before Submission', this.branchBankForm.value);
		if (this.branchBankForm.invalid) {
			this.branchBankForm.markAllAsTouched();
			this.appSettingService.showWarning('Please fill all required fields correctly.');
			return;
		}

		const formValue = this.branchBankForm.value;

		if (this.isBankModalEdit &&
			this.currentBranchIndex !== null &&
			this.currentBankIndex !== null) {
			// Update existing bank in FormArray
			this.branchBanks(this.currentBranchIndex)
				.at(this.currentBankIndex)
				.patchValue(formValue);
			this.appSettingService.showSuccess('Bank updated successfully.');
		} else if (this.currentBranchIndex !== null) {
			// Add new bank to FormArray
			const newBank = this.createBankFormGroup(formValue);
			this.branchBanks(this.currentBranchIndex).push(newBank);
			this.appSettingService.showSuccess('Bank added successfully.');
		}
		this.onBankOperationComplete(this.currentBranchIndex);
		console.log('Branch Bank Form Value After Submission', this.branchBanks(this.currentBranchIndex))
		this.bankModalRef.close();
	}

	submitCompanyForm() {
		console.log(this.companyForm.value);
		if (this.companyForm.invalid) {
			this.companyForm.markAllAsTouched();
			this.companyForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all required fields correctly');
			return;
		}


		if (this.branches.length === 0) {
			this.appSettingService.showWarning('Company must have atleast one branch.');
			return;
		}

		const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
		const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
		const formValue = this.companyForm.value;

		// Prepare branches array with their banks
		const branchesPayload = this.branches.controls.map(branchControl => {
			const branchValue = branchControl.value;
			const branchBanks = (branchControl.get('branchBanks') as FormArray).controls.map(bankControl => {
				const bankValue = bankControl.value;
				return {
					...bankValue,
					status: bankValue.status === 'Active' ? 'A' : 'S',
					...(bankValue.BranchBankSid ? { updatedBy } : { createdBy })
				};
			});

			return {
				branchName: branchValue.branchName,
				branchCode: branchValue.branchCode,
				addressLine1: branchValue.addressLine1,
				addressLine2: branchValue.addressLine2,
				postalCode: branchValue.postalCode,
				webSite: branchValue.webSite,
				phoneNumber: branchValue.phoneNumber,
				email: branchValue.email,
				timeZone: branchValue.timeZone,
				remarks: branchValue.remarks,
				taxRegistrationNo: branchValue.taxRegistrationNo,
				status: branchValue.status === 'Active' ? 'A' : 'S',
				config: branchValue.config || {},
				CityMasterSid: parseInt(branchValue.CityMasterSid),
				StateMasterSid: parseInt(branchValue.StateMasterSid),
				CountryMasterSid: parseInt(branchValue.CountryMasterSid),
				branchBank: branchBanks,
				...(branchValue.BranchMasterSid ? { updatedBy } : { createdBy })
			};
		});

		const payload = {
			...formValue,
			CountryMasterSid: parseInt(formValue.CountryMasterSid),
			CurrencyMasterSid: parseInt(formValue.CurrencyMasterSid),
			isHo: formValue.isHo ? 'Y' : 'N',
			status: formValue.status === 'Active' ? 'A' : 'S',
			branches: branchesPayload,
			...(this.isEditMode ?
				{ updatedBy: updatedBy } :
				{ createdBy: createdBy }
			)
		};

		if (this.isEditMode) {
			this.masterService.updateCompanyById(this.CompanyMasterSid, payload).subscribe(
				(resp: any) => {
					if (resp.status) {
						this.appSettingService.showSuccess('Company updated successfully.');
						const companyId = resp.company?.CompanyMasterSid
						console.log(resp);
						if (companyId) {
							this.CompanyMasterSid = companyId
							this.loadCompanyData();
						}
					} else {
						this.appSettingService.showError(resp.message);
					}
				},
				(error) => {
					console.error('Error updating company:', error);
					this.appSettingService.showError('Error updating company.');
				}
			);
		} else {
			this.masterService.createCompany(payload).subscribe(
				(resp: any) => {
					if (resp.status) {
						this.appSettingService.showSuccess('Company created successfully.');
						const companyId = resp.data.company?.CompanyMasterSid
						console.log(resp);
						if (companyId) {
							console.log(companyId);
							this.route.navigate(['master/company/entry', companyId]);
						}
					} else {
						this.appSettingService.showError(resp.message);
					}
				},
				(error) => {
					console.error('Error creating Company:', error);
					this.appSettingService.showError('Error creating company.');
				}
			);
		}
	}

	loadAllFields() {
		forkJoin({
			countries: this.masterService.getAllCountry(),
			currencies: this.masterService.getAllCurrencies(),
			cities: this.masterService.getAllCity()
		}).subscribe(({ countries, currencies, cities }) => {
			this.countryResults = countries.data;
			this.currencyResults = currencies;
			this.cityResults = cities

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


	deleteBranch(BranchMasterSid: number, index?: number) {
		const matRef = this.matdial.open(DeleteWarningComponent);
		this.modalService.dismissAll();
		matRef.afterClosed().subscribe(
			(res) => {
				if (res) {
					this.masterService.deleteBranchById(BranchMasterSid).subscribe(
						(resp: any) => {
							if (resp) {
								this.appSettingService.showSuccess("Branch successfully deleted.");

								if (index !== undefined) {
									this.branches.removeAt(index);
								} else {
									this.loadBranches();
								}
							} else {
								this.appSettingService.showError('Error deleting branch.');
							}
						},
						(error) => {
							this.appSettingService.showError('Error deleting branch.');
							console.error('Error deleting branch:', error);
						}
					)
				}
			}
		)
	}

	deleteBranchBankById(BranchBankSid: number, index?: number) {
		const matRef = this.matdial.open(DeleteWarningComponent);
		this.modalService.dismissAll();
		matRef.afterClosed().subscribe(
			(res) => {
				if (res) {
					this.masterService.deleteBranchBankById(BranchBankSid).subscribe(
						(resp: any) => {
							if (resp) {
								this.appSettingService.showSuccess("Branch bank successfully deleted.");
								// Remove from FormArray if index is provided
								if (index !== undefined && this.currentBranchIndex !== null) {
									this.branchBanks(this.currentBranchIndex).removeAt(index);
								} else {
									this.loadBranchBanks(); // Fallback to reload if no index
								}
							} else {
								this.appSettingService.showError('Error deleting branch bank.');
							}
						},
						(error) => {
							this.appSettingService.showError('Error deleting branch bank.');
							console.error('Error deleting branch bank:', error);
						}
					);
				}
			}
		);
	}

	getStatesByCountry(CountryMasterSid, isPatch?: boolean) {
		// Remove Everything and mark the control as touched
		this.branchCityList = [];
		this.stateResults = [];
		console.log(isPatch)
		if (!isPatch && this.branchForm.get('branchStateMasterSid').value) {
			this.branchForm.get('branchStateMasterSid').reset();
			this.branchForm.get('branchStateMasterSid').markAsTouched();
		}
		if (!isPatch && this.branchForm.get('branchCityMasterSid').value) {
			this.branchForm.get('branchCityMasterSid').reset();
			this.branchForm.get('branchCityMasterSid').markAsTouched();
		}

		if (!CountryMasterSid) {
			return;
		}

		this.masterService.getStateByCountryId(CountryMasterSid).subscribe(
			(resp: any) => {
				if (resp.status) {
					this.stateResults = resp.data;
				} else {
					console.error('Error loading States with CountryId');
				}
			}
		)
	}

	getCitiesByState(StateMasterSid, isPatch?: boolean) {
		this.branchCityList = [];

		if (!isPatch && this.branchForm.get('branchCityMasterSid').value) {
			this.branchForm.get('branchCityMasterSid').reset();
			this.branchForm.get('branchCityMasterSid').markAsTouched();
		}

		if (!StateMasterSid) {
			return;
		}

		this.masterService.getCityByStateId(StateMasterSid).subscribe(
			(resp: any) => {
				if (resp.status) {
					this.branchCityList = resp.data
				} else {
					console.error('Error loading City with State Id');
				}
			}
		)

	}

	navigateBack() {
  this.route.navigate(['/master/company/list']);
}

	

	resetCompanyForm() {
		this.companyForm.reset();
	}

	closeBranchBankForm() {
		this.branchBankForm.reset();
		this.setErrorMessage = false;
		this.isBankModalEdit = false;
		this.bankModalRef.close()
	}

	showCompanyInfo() {
		if (!this.companyData) return;
		const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
		modalRef.componentInstance.item = this.companyData;
		modalRef.componentInstance.idLabel = 'Company Id';
		modalRef.componentInstance.idValue = this.companyData?.CompanyMasterSid;
	}
	showBranchInfo() {
		if (!this.branchData) return;
		const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
		modalRef.componentInstance.item = this.branchData;
		modalRef.componentInstance.idLabel = 'Branch Id';
		modalRef.componentInstance.idValue = this.branchData?.BranchMasterSid;
	}
	showBranchBankInfo() {
		if (!this.bankData) return;
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
					this.appSettingService.showError('Error loading terms and conditions.');
				}
			},
			(error) => {
				this.appSettingService.showError('Error loading terms and conditions.', error);
			}
		);
	}
	openEmail() {
		if (!this.companyData) return;
		const modalRef = this.modalService.open(EmailEntryComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
	}

	openAuthority() {
		if (!this.companyData) return;
		const modalRef = this.modalService.open(AuthorityEntryComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
		modalRef.componentInstance.item = this.companyData;
		modalRef.componentInstance.idLabel = 'Company Id';
		modalRef.componentInstance.idValue = this.companyData?.CompanyMasterSid;
	}

	openEDoc() {
		if (!this.companyData) return;
		const modalRef = this.modalService.open(EdocComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
		modalRef.componentInstance.item = this.companyData;
		modalRef.componentInstance.idLabel = 'Company Id';
		modalRef.componentInstance.idValue = this.companyData?.CompanyMasterSid;
	}


	customEmailValidator(): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			const email = control.value?.trim();

			if (!email) return null;

			const emailPattern = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;

			return emailPattern.test(email) ? null : { emailInvalid: true };
		};
	}
	customWebsiteValidator(): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			const website = control.value?.trim();

			if (!website) return null;

			const websitePattern = /^(https?:\/\/)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/][a-zA-Z0-9-./]*)?$/;

			return websitePattern.test(website) ? null : { websiteInvalid: true };
		};
	}

	validateTimezoneKey(event: KeyboardEvent) {
		// Allow control keys (backspace, delete, arrows, tab, etc)
		const allowedKeys = [8, 9, 13, 37, 38, 39, 40, 46];
		if (event.ctrlKey || event.metaKey || allowedKeys.includes(event.keyCode)) {
			return;
		}

		// Only allow: numbers, +, -, or :
		if (!/[0-9+-:]/.test(event.key)) {
			event.preventDefault();
			return;
		}

		const input = event.target as HTMLInputElement;
		const cursorPos = input.selectionStart;
		const currentValue = input.value;

		// Prevent + or - anywhere except start
		if ((event.key === '+' || event.key === '-') && cursorPos !== 0) {
			event.preventDefault();
		}

		// Prevent colon if one already exists or if position is wrong
		if (event.key === ':' && (currentValue.includes(':') || cursorPos < 3)) {
			event.preventDefault();
		}
	}

	formatAndValidateTimezone(event: Event) {
		const input = event.target as HTMLInputElement;
		let val = input.value.replace(/[^0-9+-:]/g, '');

		// Handle empty case
		if (val.length === 0) {
			this.branchForm.get('branchTimeZone').setValue('');
			this.branchForm.get('branchTimeZone').setErrors(null);
			return;
		}

		// Ensure first character is + or -
		if (!['+', '-'].includes(val[0])) {
			val = '+' + val;
		}

		// Auto-insert colon after 2 digits
		if (!val.includes(':') && val.length > 3) {
			val = val.substring(0, 3) + ':' + val.substring(3);
		}

		// Ensure proper format
		const parts = val.split(':');
		if (parts.length > 1) {
			// Validate hours part (including sign)
			const hoursPart = parts[0];
			// Limit hours to valid range before proceeding
			const hours = parseInt(hoursPart.substring(1), 10);
			const maxHours = hoursPart.startsWith('+') ? 14 : 12;
			if (hours > maxHours) {
				parts[0] = hoursPart.substring(0, 1) + maxHours.toString().padStart(2, '0');
			}

			parts[1] = parts[1].substring(0, 2); // Limit minutes to 2 digits
			val = parts[0] + ':' + parts[1];
		}

		// Enforce max length
		val = val.substring(0, 6);
		input.value = val;
		this.branchForm.get('branchTimeZone').setValue(val);

		// Validate final format and range
		this.validateTimezoneRange(val);
	}

	validateTimezoneRange(value: string) {
		if (!value) {
			this.branchForm.get('branchTimeZone').setErrors(null);
			return;
		}

		// First validate the format
		const timezoneRegex = /^[+-]([01]\d|2[0-3]):[0-5]\d$/;
		if (!timezoneRegex.test(value)) {
			this.branchForm.get('branchTimeZone').setErrors({
				pattern: true,
				range: false
			});
			return;
		}

		// Extract components
		const sign = value.charAt(0);
		const [hoursStr, minutesStr] = value.substring(1).split(':');
		const hours = parseInt(hoursStr, 10);
		const minutes = parseInt(minutesStr, 10);

		// Validate range
		let isValid = true;
		if (sign === '+') {
			// Positive timezones: +00:00 to +14:00
			if (hours > 14 || (hours === 14 && minutes > 0)) {
				isValid = false;
			}
		} else {
			// Negative timezones: -12:00 to -00:00
			if (hours > 12 || (hours === 12 && minutes > 0)) {
				isValid = false;
			}
		}

		if (!isValid) {
			this.branchForm.get('branchTimeZone').setErrors({
				pattern: false,
				range: true
			});
		} else {
			this.branchForm.get('branchTimeZone').setErrors(null);
		}
	}
	getCityName(CityMasterSid) {
		if (!CityMasterSid) {
			console.log('No CityMasterSid provided');
			return null;
		}
		const city = this.cityResults.find(c => c.CityMasterSid === CityMasterSid);
		return city?.cityName || 'N/A';
	}

	toggleCheckbox(event: Event) {
		event.preventDefault(); // Prevent default form submission behavior
		const checkbox = event.target as HTMLInputElement;
		checkbox.checked = !checkbox.checked;

		// Update the form control value
		this.companyForm.get('isHo')?.setValue(checkbox.checked);

		// Trigger change detection (if needed)
		this.companyForm.get('isHo')?.updateValueAndValidity();
	}

	updateBranchPagination(): void {
		this.totalBranches = this.branches.length;
		const startIndex = (this.branchPage - 1) * this.branchPageSize;
		const endIndex = startIndex + this.branchPageSize;
		this.paginatedBranches = this.branches.controls.slice(startIndex, endIndex);
	}

	// Call this whenever branches change
	onBranchesUpdated(): void {
		this.updateBranchPagination();
		this.cdRef.detectChanges();
	}

	updateBankPagination(branchIndex: number): void {
		const banksArray = this.branchBanks(branchIndex);
		this.totalBanks = banksArray.length;
		const startIndex = (this.bankPage - 1) * this.bankPageSize;
		const endIndex = startIndex + this.bankPageSize;
		this.paginatedBanks = banksArray.controls.slice(startIndex, endIndex);
	}

	onBankOperationComplete(branchIndex: number): void {
		this.updateBankPagination(branchIndex);
		this.cdRef.detectChanges();
	}

	isPanRequired(): boolean {
		const countryControl = this.companyForm.get('CountryMasterSid');
		if (!countryControl || !this.countryResults) return false;

		const countryId = countryControl.value;
		const country = this.countryResults.find(c => c.CountryMasterSid === countryId);

		return country?.countryName?.toLowerCase() === 'india';
	}

	handlePanControl(country: any): void {
		if (!country || !this.countryResults) return;

		const panControl = this.companyForm.get('Pan');
		if (!panControl) return;

		const countryName = country.countryName ||
			this.countryResults.find(c => c.CountryMasterSid === country.CountryMasterSid)?.countryName;

		const isIndia = countryName?.toLowerCase() === 'india';
		this.isPanRequiredFlag = isIndia;

		if (isIndia) {
			panControl.setValidators([Validators.required, Validators.maxLength(20), this.panValidator]);
			// this.appSettingService.showInfo('PAN is required for Indian companies');
		} else {
			panControl.setValidators([Validators.maxLength(20), this.panValidator]);
		}
		panControl.updateValueAndValidity();
	}

	gstValidator(control: AbstractControl): ValidationErrors | null {
		const gstin = control.value;
		// 2 numbers + 5 alphabet + 4 numbers + 1 alphabet + 1 alphanumeric + Z + 1 alphanumberic
		const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
		if (!gstin) return null;
		return GST_REGEX.test(gstin) ? null : { invalidGST: true };
	}
	panValidator(control: AbstractControl): ValidationErrors | null {
		const pan = control.value;
		// 5 alphabets + 4 numbers + 1 alphabet
		const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
		if (!pan) return null;
		return PAN_REGEX.test(pan) ? null : { invalidPAN: true };
	}


}
interface FieldSelection {
	name: string;
	label: string;
	selected: boolean;
}

interface ConfigModalData {
	title: string;
	fields: FieldSelection[];
}