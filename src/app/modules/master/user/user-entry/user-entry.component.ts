import { Component, OnInit } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
		FormsModule
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
	selectedBranches: { [key: number]: number[] } = {};
	selectedRoles: any[] = [];
	defaultCompanies: { [key: number]: boolean } = {};
    defaultBranches: { [key: number]: number } = {};

	modeOfStatus = [
		{ name: 'Active' },
		{ name: 'Suspended' }
	]
	currentMenuId: number;
	TandCList: any;



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
		this.initUserForm();
		this.loadAllFields();
		this.userForm.statusChanges.subscribe(status => {
			this.btnDisable = status !== 'VALID';
		});
		this.currentRoute.paramMap.subscribe((param) => {
			this.UserMasterSid = +param.get('id');
			if (this.UserMasterSid) {
				this.isEditMode = true;
				this.loadUserData(this.UserMasterSid);
			}
		});
		this.appSettingService.getUser().subscribe((user) => {
			if (user) {
				this.userData = user;
				this.checkPermissions();
			}
		});
		if(!this.isEditMode){
			this.userForm.get('userPassword')?.setValidators([Validators.required,PasswordValidators.validate()])
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
			department: [[], [Validators.required]],
			DefaultDept: [''],
			isSalesperson: [false],
			userTypeId: [, [Validators.required]],
			contactNumber: [],
			status: ['Active'],
			userPassword: [, [PasswordValidators.validate()]],
			CountryMasterSid: [, [Validators.required]],
			companies : [null,[Validators.required]],
			roles: [null,[Validators.required]]
		});
		this.userForm.get('DefaultDept').disable()
	}

	// loads all lookups
	loadAllFields() {
		forkJoin({
			departments: this.masterService.getAllDepartments(),
			userType: this.masterService.getAllUserType(),
			companies: this.masterService.getAllCompanies(),
			roles: this.settingService.getAllRole(),
			countries: this.masterService.getAllCountry(),
			menus: this.settingService.getAllMenu()
		}).subscribe(({ departments, userType, companies, roles, countries, menus }) => {
			this.departmentList = departments,
			this.userTypeList = userType.data,
			this.companyList = companies
			this.roleList = roles.data;
			this.countryList = countries.data;
			this.menuList = menus;
			this.handleCompanySelect(this.selectedCompanies);
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
					this.patchBranches(user.userBranchMaster);
					const rolePatchValue = user.userRoleMaster.map(userRole => userRole.RoleMasterSid);
					this.userForm.patchValue({
						userName: user.userName,
						userEmail: user.userEmail,
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
		if (this.userForm.invalid) {
			this.userForm.markAllAsTouched();
			this.userForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all the required fields');
			return;
		}

		const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
		const formValue = this.userForm.getRawValue();
		const companyPayload = formValue.companies.map(companyId => ({
    CompanyMasterSid: companyId,
    IsDefault: this.isDefaultCompany(companyId) ? 'Y' : 'N',
    GiveAccess: 'Y', // Assuming all selected companies get access
    status: 'A'
  }));

  const branchPayload = [];
  for (const companyId of Object.keys(this.selectedBranches)) {
    const companyIdNum = Number(companyId);
    const branches = this.selectedBranches[companyIdNum];
    
    branches.forEach(branchId => {
      branchPayload.push({
        BranchMasterSid: branchId,
        IsDefault: this.isDefaultBranch(companyIdNum, branchId) ? 'Y' : 'N',
        GiveAccess: 'Y', // Assuming all selected branches get access
        status: 'A'
      });
    });
  }
		const payload = {
			userName: formValue.userName,
			userEmail: formValue.userEmail,
			department: formValue.department,
			DefaultDept: formValue.DefaultDept,
			isSalesperson: formValue.isSalesperson ? '1' : '0',
			userTypeId: formValue.userTypeId,
			contactNumber: formValue.contactNumber,
			CountryMasterSid: formValue.CountryMasterSid,
			status: formValue.status === 'Active' ? 'A' : 'S',
			companies: formValue.companies,
			branches: this.selectedBranches,
			roles : formValue.roles,
			userCode: this.getUserCode(formValue.userName),
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
	patchCompanies(companyList: any[]) {
		if (!companyList) {
			return;
		}
		const companies = companyList.map(userCompany => userCompany.CompanyMasterSid);
		this.userForm.get('companies').setValue(companies);
		this.addToSelectedCompanies(companies)

	}

	// handles selected Company during user event
	addToSelectedCompanies(value: any[]) {
		this.selectedCompanies = value;
		this.userForm.get('companies').setValue(value);
		this.lookAfterBranch();
		if (this.companyList !== undefined) {
			this.handleCompanySelect(value);
		}
	}
	// Once a company is removed it filter out the related branch
	lookAfterBranch() {
		if (!this.selectedBranches || !this.selectedCompanies) {
			return;
		}
		const updatedBranches: any = {};
		for (const companyId of Object.keys(this.selectedBranches)) {
			if (this.selectedCompanies.includes(Number(companyId))) {
				updatedBranches[companyId] = this.selectedBranches[companyId];
			}
		}
		this.selectedBranches = updatedBranches;
	}

	//  On selecting a company it takes Company and branchMaster to UI through userInfo variable
	handleCompanySelect(company: any[]) {
		if (!company) {
			return;
		}
		const newArr = company.map(companyId => {
			const ourCompany = this.companyList.find(company => company.CompanyMasterSid === companyId);
			let companyName = ourCompany.companyName;
			let branchMaster = ourCompany.branchMaster;
			return {
				CompanyMasterSid: companyId,
				companyName: companyName,
				branches: branchMaster
			};
		})
		this.userInfos = newArr;
	}


	// ====== Branch Related Functions ========= \\\

	//  Check if a branch is selected
	isCheckedBranch(BranchMasterSid){
		if(!BranchMasterSid || !this.selectedBranches){
			return false;
		}
		const branches = Object.values(this.selectedBranches).flat();
		return branches.includes(BranchMasterSid);
	}

	patchBranches(branchList: any[]) {
		if (!branchList) {
			return;
		}
		branchList.map(branch => this.handleBranchToggle(true, branch))
	}


	toggleBranchCheckBox(event:Event,branch){
		event.preventDefault();
		const element = event.target as HTMLInputElement;
		if(event instanceof KeyboardEvent){
			element.checked = !element.checked;
		}
		this.handleBranchToggle(element.checked,branch);
	}

	handleBranchToggle(event: boolean, branch: any) {
  const companyId = branch.CompanyMasterSid;
  const branchId = branch.BranchMasterSid;
  
  if (event) {
   
    const existArr = this.selectedBranches[companyId] || [];
    if (!existArr.includes(branchId)) {
      this.selectedBranches[companyId] = [...existArr, branchId];
    }
  } else {
    
    const existArr = this.selectedBranches[companyId] || [];
    const newArr = existArr.filter(id => id !== branchId);
    
   
    if (this.defaultBranches[companyId] === branchId) {
      delete this.defaultBranches[companyId];
    }
    
    if (newArr.length === 0) {
      delete this.selectedBranches[companyId];
    } else {
      this.selectedBranches[companyId] = newArr;
    }
  }
}

toggleDefaultCompany(companyId: number, isDefault: boolean) {
  if (isDefault) {
   
    this.defaultCompanies = { [companyId]: true };
  } else {
    delete this.defaultCompanies[companyId];
  }
}


toggleDefaultBranch(companyId: number, branchId: number) {
  this.defaultBranches[companyId] = branchId;
}


isDefaultBranch(companyId: number, branchId: number): boolean {
  return this.defaultBranches[companyId] === branchId;
}


isDefaultCompany(companyId: number): boolean {
  return this.defaultCompanies[companyId] === true;
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

	resetForm() {
		this.userForm.reset({
			userName: '',
			userEmail: '',
			department: [],
			DefaultDept: '',
			isSalesperson: false,
			userTypeId: null,
			contactNumber: '',
			status: 'Active',
			userPassword: null,
			CountryMasterSid: null,
			companies: [],
			roles: [] 
		});

		this.selectedCompanies = [];
		this.selectedBranches = {};
		this.userInfos = [];
		this.setDefaultDept();
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
		if (!this.userData) return;
		const modalRef = this.modalService.open(AuthorityEntryComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
		modalRef.componentInstance.item = this.userData;
		modalRef.componentInstance.idLabel = 'User Id';
		modalRef.componentInstance.idValue = this.userData?.UserMasterSid;
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
