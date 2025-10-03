import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { FfUser, UserRole } from 'src/app/modules/crm-mobile/Interfaces/ffuser.interface';
import { CommonModule } from '@angular/common';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';
import { PasswordValidators } from 'src/app/core/ValidationFn/password.validators';
import { TogglerComponent } from 'src/app/component/simple-toggler/toggle.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';

@Component({
	selector: 'app-user-entry',
	standalone: true,
	imports: [
		NgSelectModule,
		FeatherModule,
		ReactiveFormsModule,
		CommonModule,
		OnlyTextDirective,
		OnlyNumbersDirective,
		TextWithNumbersDirective,
		MultiSelectComponent,
		FormsModule,
		NgbDropdownModule
	],
	templateUrl: './user-entry.component.html',
	styleUrl: './user-entry.component.scss'
})
export class UserEntryComponent implements OnInit {

	UserMasterSid: number;
	isEditMode: boolean;
	userData: FfUser;
	userForm !: FormGroup;

	departmentList: any[];
	userTypeList: any[];
	companyList: any[];
	branchList: any[];
	menuList: any[];
	roleList: any[] = [];
	countryList: any[];
	passwordView: boolean
	btnDisable: boolean = true;

	permissions: string[] = [];
	currentMenuPermissions: any = {};
	userInfos: any[] = [];  // for displaying branches 
	selectedCompanies: any[];
	defaultItems : { [companyId:number] : number } = {};

	modeOfStatus = [
		{ name: 'Active' },
		{ name: 'Suspended' }
	]
	currentMenuId: number;
	TandCList: any;

	auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  currentCompany: any;


	constructor(
		private appSettingService: AppSettingsService,
		private masterService: MasterService,
		private router: Router,
		private currentRoute: ActivatedRoute,
		private modalService: NgbModal,
		private fb: FormBuilder,
		private settingService: SettingsService
	) { }

	ngOnInit(): void {
	    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));

		this.initUserForm();
		this.loadAllFields();
		this.userForm.statusChanges.subscribe(status => {
			this.btnDisable = status !== 'VALID';
		});
		// this.appSettingService.getUser().subscribe((user) => {
		// 	if (user) {
		// 		this.userData = user;
		// 		this.checkPermissions();
		// 	}
		// });
		 const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
	}

	//  Checks permissions based on userRole
	checkPermissions() {
		const currentMenuId = Number(localStorage.getItem('currentMenuId'));
		const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
		if (currentMenuId && userRole) {
			this.masterService
				.getRoleMenuPermissions(currentMenuId, userRole)
				.subscribe({
					next: (response) => {
						this.currentMenuPermissions = response.data.MenuPermissions || {};
						this.permissions = Object.keys(this.currentMenuPermissions).filter(
							(key) => this.currentMenuPermissions[key] === 'isTrue'
						);
					},
				});
		}
	}

	//  checks for menu permission
	hasPermission(permission: string): boolean {
		return this.permissions.includes(permission);
	}

	// initializes userForm
	initUserForm() {
		this.userForm = this.fb.group({
			userName: ['', [Validators.required]],
			userEmail: ['', [Validators.required, EmailValidators.singleEmail()]],
			designation: ['',[Validators.required]],
			department: [[], [Validators.required]],
			DefaultDept: [''],
			isSalesperson: [false],
			userTypeId: [, [Validators.required]],
			contactNumber: [],
			status: ['Active'],
			userPassword: [, [PasswordValidators.validate()]],
			CountryMasterSid: [, [Validators.required]],
			companies : [null,[Validators.required]],
			userCompanies : this.fb.array([],[this.atLeastOneDefaultValidator(this.defaultItems)]),
			roles :  [null,[Validators.required]]
		});
		this.userForm.get('DefaultDept').disable()
	}
	
openAuditLogs(modal: TemplateRef<any>) {
  if (!this.UserMasterSid) return;

  this.masterService.getAuditLogsFfUser(
    'UserMaster',
    this.UserMasterSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['UpdatedOn', 'UpdatedBy']; // ✅ add more if needed later

      const formatFields = (val: any) => {
        if (!val) return [];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        if (Object.keys(obj).length === 0) return [];
        return Object.entries(obj)
          .filter(([key]) => !ignoredFields.includes(key)) // 🚫 exclude fields
          .map(([key, value]) => `${key}: ${value ?? 'NA'}`);
      };

      this.auditLogs = logs
        .map(log => ({
          ...log,
          oldValDisplay: formatFields(log.oldVal),
          newValDisplay: formatFields(log.newVal),
        }))
        .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);

      this.auditLogModalRef = this.modalService.open(modal, {
        centered: true,
        scrollable: true,
        windowClass: 'audit-log-modal'
      });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
}

	get userCompanies() : FormArray {
		return this.userForm.get('userCompanies') as FormArray;
	}

	userBranches(companyIndex:number) : FormArray {
		return this.userCompanies.at(companyIndex).get('userBranches') as FormArray
	}

	createNewUserCompany(data?:any) {
		const companyName = data?.companyName || 'Unnamed Company';
		return this.fb.group({
			UserCompanyMasterSid : [data.UserCompanyMasterSid || null],
			CompanyMasterSid : [data.CompanyMasterSid || null],
			companyName : [companyName || ''],
			GiveAccess : [true],
			IsDefault : [data.IsDefault === 'Y' || false],
			userBranches : this.fb.array([],this.atLeastOneBranchAccessValidator(companyName))
		})
	}

	createNewUserBranches(data?:any) {
		return this.fb.group({
			UserBranchMasterSid : [data.UserBranchMasterSid || null],
			CompanyMasterSid : [data.CompanyMasterSid || null],
			BranchMasterSid : [data.BranchMasterSid || null],
			branchName : [data.branchName || ''],
			GiveAccess : [data.GiveAccess === 'Y' || false],
			IsDefault : [data.IsDefault === 'Y' || false],
		})
	}

	addToSelectedCompany(companies: number[]) {
		const oldCompaniesArr: number[] = this.selectedCompanies || [];
		const newCompaniesArr: number[] = companies || [];

		const companyToRemove = oldCompaniesArr.filter((oldCompSid) => !newCompaniesArr.includes(oldCompSid));
		const companyToAdd = newCompaniesArr.filter((newCompSid) => !oldCompaniesArr.includes(newCompSid));

		if (companyToRemove.length > 0) {
			const indicesToRemove: number[] = [];
			this.userCompanies.controls.forEach((formGroup, index) => {
				const companySid = formGroup.get('CompanyMasterSid')?.value;
				if (companyToRemove.includes(companySid)) {
					indicesToRemove.push(index);
				}
			});

			indicesToRemove.sort((a, b) => b - a).forEach((index) => {
				this.userCompanies.removeAt(index);
			});
		}

		if (companyToAdd.length > 0) {
			for (const companySid of companyToAdd) {
				const company = this.companyList.find((company) => company.CompanyMasterSid === companySid);
				if (company) {
					this.handleCompanySelection(company);
				}
			}
		}

		this.selectedCompanies = [...newCompaniesArr];
		console.log('USER FORM AFTER COMPANY SELECTION', this.userForm.value);
	}

	handleCompanySelection(company) {
		if(!company || company === undefined || company === null) {
			return;
		}
		const branches : any[] = company.branchMaster || [];
		this.userCompanies.push(this.createNewUserCompany(company))
		const lastCompanyIndex = this.userCompanies.length - 1;
		console.log(branches);
		console.log(lastCompanyIndex);
		if(branches.length > 0){
			branches.map(branch => this.userBranches(lastCompanyIndex).push(this.createNewUserBranches(branch)));
		}
	}

	toggleDefaultItems(companyIndex, branchIndex, CompanyMasterSid, BranchMasterSid, event) {
		const element = event.target as HTMLInputElement;
		const control = this.userBranches(companyIndex).at(branchIndex).get('GiveAccess');
		this.defaultItems = {};
		if (event instanceof KeyboardEvent) {
			element.checked = !element.checked;
		}
		if (element.checked) {
			control.setValue(element.checked);
			this.defaultItems[`${CompanyMasterSid}`] = BranchMasterSid;
		} 
		
		const userCompanies = this.userForm.get('userCompanies') as FormArray;
		userCompanies.setValidators([this.atLeastOneDefaultValidator(this.defaultItems)]);
		userCompanies.updateValueAndValidity();
		console.log(this.userForm.controls);
	}


	isDefaultCompany(CompanyMasterSid){
		let keys : any[] = Object.keys(this.defaultItems);
		keys = keys.map(k => Number(k));
		return keys.includes(CompanyMasterSid);
	}

	toggleDefaultCompany(companyIndex: number, companySid: number, event: any) {
  const userCompanies = this.userForm.get('userCompanies') as FormArray;

  // Uncheck all companies first
  userCompanies.controls.forEach(ctrl => {
    ctrl.patchValue({ IsDefaultCompany: false }, { emitEvent: false });
  });

  // Set the selected company as default
  const currentCompany = userCompanies.at(companyIndex);
  currentCompany.patchValue({ IsDefaultCompany: event.target.checked }, { emitEvent: true });
}

	isDefaultBranch(BranchMasterSid){
		const keys = Object.values(this.defaultItems);
		return keys.includes(BranchMasterSid);
	}

	toggleBranchAccessCheckBox(companyIndex,branchIndex,BranchMasterSid,event){
		console.log(event);
		const element = event.target as HTMLInputElement;
		const control = this.userBranches(companyIndex).at(branchIndex).get('GiveAccess')
		console.log(control);
		if(event instanceof KeyboardEvent){
			element.checked = !element.checked;
		}
		if (element.checked) {
			control.setValue(true);
		} else {
			control.setValue(false);
			if (this.isDefaultBranch(BranchMasterSid)) {
				this.defaultItems = {};
			}
		}
		control.updateValueAndValidity();
		const userCompanies = this.userForm.get('userCompanies') as FormArray;
		userCompanies.setValidators([this.atLeastOneDefaultValidator(this.defaultItems)]);
		userCompanies.updateValueAndValidity();
		console.log(this.userCompanies.controls);
	}


	// loads all lookups
	loadAllFields() {
		 const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
		forkJoin({
			departments: this.masterService.getAllDepartments(CompanyMasterSid),
			userType: this.masterService.getAllUserType(),
			companies: this.masterService.getAllCompanies(),
			roles: this.settingService.getAllRole(CompanyMasterSid),
			countries: this.masterService.getAllCountry(),
			menus: this.settingService.getAllMenu()
		}).subscribe(({ departments, userType, companies, roles, countries, menus }) => {
			this.departmentList = departments,
			this.userTypeList = userType.data,
			// this.companyList = companies
			this.companyList = (companies || []).filter(
      (company: any) => Array.isArray(company.branchMaster) && company.branchMaster.length > 0
    );
			this.roleList = roles.data;
			this.countryList = countries.data;
			this.menuList = menus;

			this.currentRoute.paramMap.subscribe((param) => {
				this.UserMasterSid = +param.get('id');
				if (this.UserMasterSid) {
					this.isEditMode = true;
					this.loadUserData(this.UserMasterSid);
				} else {
					this.userForm.get('userPassword')?.setValidators([Validators.required,PasswordValidators.validate()])
				}
			});
		})
	}

	// Load Data for Edit Mode
	loadUserData(UserMasterSid: number) {
		this.masterService.getFfUserById(UserMasterSid).subscribe(
			(resp: any) => {
				if (resp.status) {
					this.userData = resp.data;
					const user = resp.data;
					this.patchCompanies(user.userCompanyMaster);
					const rolePatchValue = user.userRoleMaster.map(userRole => userRole.RoleMasterSid);
					this.userForm.patchValue({
						userName: user.userName,
						userEmail: user.userEmail,
						designation: user.designation,
						department: user.department, // Fixed syntax
						DefaultDept: user.DefaultDept,
						isSalesperson: user.isSalesperson === '1' ? true : false,
						userTypeId: user.userTypeId,
						contactNumber: user.contactNumber,
						status: user.status === 'A' ? 'Active' : 'Suspended',
						userPassword: user.userPassword,
						CountryMasterSid: user.CountryMasterSid,
						roles : rolePatchValue,
					})
					this.setDefaultDept();

				} else {
					this.appSettingService.showError('Error Loading User Data')
				}
			},
			(error) => {
				this.appSettingService.showError('Error Loading User Data');
				console.error('Error Loading User Data', error);
			}
		)
	}

	onSubmit() {
		console.log(this.userForm.value);
		if (this.userForm.invalid) {
			this.userForm.markAllAsTouched();
			this.userForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all the required fields');
			return;
		}

		const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
		const formValue = this.userForm.getRawValue();
		const companyPayload = this.userCompanies.controls.map((companyFormGroup,companyIndex) => {
			const companyFormValue = companyFormGroup.value;
			const branchArrValues = this.userBranches(companyIndex).value;
			let branchPayload;
			branchPayload = branchArrValues.map(branch => {
				return {
					UserBranchMasterSid: branch.UserBranchMasterSid,
					CompanyMasterSid: branch.CompanyMasterSid,
					BranchMasterSid: branch.BranchMasterSid,
					GiveAccess: branch.GiveAccess ? 'Y' : 'N',
					IsDefault: this.isDefaultBranch(branch.BranchMasterSid) ? 'Y' : 'N' ,
				}
			})
			return {
				UserCompanyMasterSid: companyFormValue.UserCompanyMasterSid,
				CompanyMasterSid: companyFormValue.CompanyMasterSid,
				GiveAccess: 'Y',
				IsDefault: this.isDefaultCompany(companyFormValue.CompanyMasterSid) ? 'Y' : 'N',
				userBranches : branchPayload
			}
		})
		
		const payload = {
			userName: formValue.userName,
			userEmail: formValue.userEmail,
			designation: formValue.designation,
			department: formValue.department,
			DefaultDept: formValue.DefaultDept,
			isSalesperson: formValue.isSalesperson ? '1' : '0',
			userTypeId: formValue.userTypeId,
			contactNumber: formValue.contactNumber,
			CountryMasterSid: formValue.CountryMasterSid,
			status: formValue.status === 'Active' ? 'A' : 'S',
			roles : formValue.roles,
			userCode: this.getUserCode(formValue.userName),
			companies : companyPayload,
			...(this.isEditMode ? { updatedBy: currentUserEmail } : { createdBy: currentUserEmail,userPassword: formValue.userPassword, }),
		}

		if (this.isEditMode) {
			this.masterService.updateFfUserById(this.UserMasterSid, payload).subscribe(
				(resp: any) => {
					if (resp.status) {
						this.appSettingService.showSuccess('User Updated Successfully');
						this.router.navigate(['master/user/list']);
					} else {
						this.appSettingService.showError('Error Updating User');
					}
				},
				(error) => {
					this.appSettingService.showError('Error Updating User');
					console.error('Error Updating User', error);
				}
			)
		} else {
			this.masterService.createNewFfUser(payload).subscribe(
				(resp: any) => {
					if (resp.status) {
						this.appSettingService.showSuccess('New User Successfully Created');
						this.router.navigate(['master/user/list']);
					} else {
						this.appSettingService.showError('Error Creating User');
					}
				},
				(error) => {
					this.appSettingService.showError('Error Creating User');
					console.error('Error Creating User', error);
				}
			)
		}

	}


	// ====== Helper Functions ========= \\

	toggleCheckbox(event :Event){
		event.preventDefault();
		const element = event.target as HTMLInputElement;
		element.checked = !element.checked;
		this.userForm.get('isSalesperson').setValue(!this.userForm.get('isSalesperson').value)
		this.userForm.get('isSalesperson').updateValueAndValidity();
	}

	// ====== Company Related Functions ========= \\

	//  Handles Selected Company during patching
	patchCompanies(userCompanyList: any[]) {
		const allCompanyIds = userCompanyList.map(comp => comp.CompanyMasterSid);
		this.userForm.get('companies').setValue([...allCompanyIds]);
		this.selectedCompanies = [...allCompanyIds];
		userCompanyList.map(userCompanyMaster => {
			const companyFromList = this.companyList.find(
				company => company.CompanyMasterSid === userCompanyMaster.CompanyMasterSid
			);
			if (!companyFromList) return;
			const companyData = {
				UserCompanyMasterSid: userCompanyMaster?.UserCompanyMasterSid,
				CompanyMasterSid: userCompanyMaster?.CompanyMasterSid,
				companyName: companyFromList?.companyName || userCompanyMaster?.companyMaster?.companyName,
				GiveAccess: userCompanyMaster?.GiveAccess,
			}
			this.userCompanies.push(this.createNewUserCompany(companyData));
			const lastCompanyIndex = this.userCompanies.length - 1;


			const allBranchesFromCompanyList = companyFromList.branchMaster || [];
			const existingUserBranches = userCompanyMaster?.companyMaster?.userBranchMaster || [];

			const userBranchMap = new Map();
			existingUserBranches.forEach(userBranch => {
				userBranchMap.set(userBranch.BranchMasterSid, userBranch);
			});

			allBranchesFromCompanyList.forEach(branch => {
				const existingUserBranch = userBranchMap.get(branch.BranchMasterSid);

				if (existingUserBranch && existingUserBranch.IsDefault === 'Y') {
					this.defaultItems = {};
					this.defaultItems[`${existingUserBranch.CompanyMasterSid}`] = existingUserBranch.BranchMasterSid;
					this.userForm.get('userCompanies').setValidators([this.atLeastOneDefaultValidator(this.defaultItems)]);
					this.userForm.get('userCompanies').updateValueAndValidity();
				}
				const branchData = {
					UserBranchMasterSid: existingUserBranch?.UserBranchMasterSid || null,
					CompanyMasterSid: branch.CompanyMasterSid,
					BranchMasterSid: branch.BranchMasterSid,
					branchName: branch.branchName,
					GiveAccess: existingUserBranch?.GiveAccess || 'N',
				};

				this.userBranches(lastCompanyIndex).push(this.createNewUserBranches(branchData));
			});
		});
	}

	atLeastOneBranchAccessValidator(companyName: string): ValidatorFn {
		return (formArray: AbstractControl): ValidationErrors | null => {
			const hasAccess = (formArray as FormArray).controls.some(
				control => control.get('GiveAccess')?.value === true
			);

			if (!hasAccess) {
				return {
					noAccess: `At least one branch must have 'Access' selected for company: "${companyName}".`
				};
			}

			return null;
		};
	}

	atLeastOneDefaultValidator(defaultItems: { [key: string]: any }): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!defaultItems || Object.keys(defaultItems).length === 0) {
				return { noDefault: true };
			}
			return null;
		};
	}


	getUserCode(userName: string) {
		return userName.replace(/\s+/g, '_');
	}

	setDefaultDept() {
		const departmentSelected: string[] = this.userForm.get('department')?.value || [];
		if (departmentSelected.length > 0) {
			this.userForm.get('DefaultDept')?.setValue(departmentSelected[0]);
		} else {
			this.userForm.get('DefaultDept')?.setValue('');
		}
	}

	navigateBack() {
		history.back();
	}

	showInfo() {
		if (!this.userData) return;
		const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
		modalRef.componentInstance.item = this.userData;
		modalRef.componentInstance.idLabel = 'User Id';
		modalRef.componentInstance.idValue = this.userData?.UserMasterSid;
	}


	togglePassword(input: HTMLInputElement): void {
		this.passwordView = true;
		input.type = 'text'; // Show password on mousedown
	}

	resetPassword(input: HTMLInputElement): void {
		this.passwordView = false;
		input.type = 'password'; // Hide password on mouseup or mouseleave
	}

	// resetForm() {
	// 	this.userForm.reset({
	// 		userName: '',
	// 		userEmail: '',
	// 		department: [],
	// 		DefaultDept: '',
	// 		isSalesperson: false,
	// 		userTypeId: null,
	// 		contactNumber: '',
	// 		status: 'Active',
	// 		userPassword: null,
	// 		CountryMasterSid: null,
	// 		companies: [],
	// 		roles: [],	 
	// 	});
	// 	this.userCompanies.clear();
	// 	this.selectedCompanies = [];
	// 	this.userInfos = [];
	// 	this.setDefaultDept();
	// }

	resetForm() {
  // If editing an existing user, reload it (restore original state)
  if (this.isEditMode && this.UserMasterSid) {
    this.loadUserData(this.UserMasterSid);
    return;
  }

  // Create-mode: reset form to sensible defaults
  this.userForm.reset({
    userName: '',
    userEmail: '',
	designation: '',
    department: [],
    DefaultDept: '',
    isSalesperson: false,
    userTypeId: null,
    contactNumber: '',
    status: 'Active',
    userPassword: null,
    CountryMasterSid: null,
    companies: [],
    roles: [],
  });

  // Clear form arrays
  this.userCompanies.clear();
  
  // Reset password field validators for new entries
  this.userForm.get('userPassword')?.setValidators([Validators.required, PasswordValidators.validate()]);
  this.userForm.get('userPassword')?.updateValueAndValidity();

  // Clear selected companies and default items
  this.selectedCompanies = [];
  this.defaultItems = {};
  this.userInfos = [];

  // Disable DefaultDept field
  this.userForm.get('DefaultDept')?.disable();

  // Reset form validation
  this.userForm.markAsUntouched();
  this.userForm.updateValueAndValidity();

  // Clear any loaded user data for new entries
  this.userData = null;
  this.UserMasterSid = null;
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
					modalRef.componentInstance.DocumentSid = this.UserMasterSid;

				} else {
					this.appSettingService.showError('Error loading Terms and Conditions');
				}
			},
			(error) => {
				this.appSettingService.showError('Error loading Terms and Conditions', error);
			}
		);
	}

	openEmail() {
		if (!this.userData) return;
		const modalRef = this.modalService.open(EmailEntryComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
	}

	  openAuthority() {
		const MenuMasterSid = localStorage.getItem('currentMenuId');
		if (!MenuMasterSid) return;
	   const modalRef = this.modalService.open(AuthorityLogComponent, { 
		size: 'lg', 
		centered: true, 
		backdrop: 'static' 
	  });
		modalRef.componentInstance.menuMasterSid = MenuMasterSid;
		modalRef.componentInstance.documentSid = this.UserMasterSid;
	  }

	openEDoc() {
		if (!this.userData) return;
		const modalRef = this.modalService.open(EdocComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
		modalRef.componentInstance.item = this.userData;
		modalRef.componentInstance.idLabel = 'User Id';
		modalRef.componentInstance.idValue = this.userData?.UserMasterSid;
	}
	
}
// constructRoleForm(data?: any) {
	// 	if (data) {
	// 		return this.fb.group({
	// 			RoleMasterSid: [data.RoleMasterSid || '', [Validators.required]],
	// 			MenuMasterSid: [data.MenuMasterSid || null, [Validators.required]],
	// 			GiveAccess: [data.GiveAccess || false],
	// 			IsDefault: [data.IsDefault || false],
	// 			UserRoleName: [data.UserRoleName || '']  // Only for Displaying purpose
	// 		})
	// 	}
	// 	return this.fb.group({
	// 		RoleMasterSid: ['', [Validators.required]],
	// 		MenuMasterSid: [null, [Validators.required]],
	// 		GiveAccess: [false],
	// 		IsDefault: [false],
	// 		UserRoleName: ['']  // Only for Displaying purpose
	// 	})
	// }

	// get roles(): FormArray {
	// 	return this.userForm.get('roles') as FormArray;
	// }
	
	// addRoleChanges(role: any) {
	// 	const roleFormWithRoleId = this.constructRoleForm({ RoleMasterSid: role.RoleMasterSid, UserRoleName: role.UserRoleName });
	// 	this.roles.push(roleFormWithRoleId)
	// }

	// removeRoleChanges(role: any) {
	// 	const requiredId = this.roles.value.findIndex(
	// 		roleFromArr => roleFromArr.RoleMasterSid === role.RoleMasterSid
	// 	)
	// 	this.roles.removeAt(requiredId);
	// }

	// clearRoleChanges() {
	// 	this.roles.clear();
	// }

	// patchRoles(userRoleList:any[]){
	// 	userRoleList.map(userRole => {
	// 		this.selectedRoles = [...this.selectedRoles,userRole.RoleMasterSid];
	// 		const formGroupWithData = this.constructRoleForm({
	// 			RoleMasterSid : userRole.RoleMasterSid,
	// 			UserRoleName : userRole.roleMaster?.UserRoleName,
	// 			MenuMasterSid : userRole.MenuMasterSid,
	// 			GiveAccess : userRole.GiveAccess === 'Y' ? true : false,
	// 			IsDefault : userRole.IsDefault === 'Y' ? true : false,
	// 		})
	// 		this.roles.push(formGroupWithData);
	// 	})
	// }

	// prepareRolePayload(){
	// 	const rolesArray :any[] = this.roles.value;
	// 	let result = [];
	// 	if(rolesArray.length > 0){
	// 		result = rolesArray.map(roleItem => {
	// 			return ({
	// 				RoleMasterSid: roleItem.RoleMasterSid,
	// 				MenuMasterSid: roleItem.MenuMasterSid,
	// 				GiveAccess: roleItem.GiveAccess ? 'Y' : 'N',
	// 				IsDefault: roleItem.IsDefault ? 'Y' : 'N'
	// 			})
	// 		})
	// 	}
	// 	return result;
	// }
