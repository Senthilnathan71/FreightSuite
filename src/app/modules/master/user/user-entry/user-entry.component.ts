import { Component, OnInit } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
		TextWithNumbersDirective
	],
	templateUrl: './user-entry.component.html',
	styleUrl: './user-entry.component.scss'
})
export class UserEntryComponent implements OnInit {

	UserMasterSid: number;
	isEditMode : boolean;
	userData: FfUser;
	userForm !: FormGroup;
	userCompanyForm !: FormGroup;
	userRoleForm !:FormGroup;

	departmentList : any[];
	filteredDeptList : any[] = [];
	userTypeList : any[];
	companyList : any[];
	branchList : any[];
	filteredBranchList : any[] = []
	roleList : any[];
	filteredRoleList : any[] = [];
	countryList : any[];
	passwordView : boolean

	modeOfStatus = [
		{name : 'Active'},
		{name : 'Suspended'}
	]
	currentMenuId: number;
	TandCList: any;



	constructor(
		private appSettingService: AppSettingsService,
		private masterService: MasterService,
		private router: Router,
		private currentRoute: ActivatedRoute,
		private modalService: NgbModal,
		private fb:FormBuilder,
		private settingService : SettingsService
	) { }

	ngOnInit(): void {
		this.initUserForm(); 
		this.loadAllFields();
		this.currentRoute.paramMap.subscribe((param) => {
			this.UserMasterSid = +param.get('id');
			if (this.UserMasterSid) {
				this.isEditMode = true;
				this.loadUserData(this.UserMasterSid);
			}
		});
	}

	initUserForm() {
		this.userForm = this.fb.group({
			userName: ['', [Validators.required]],
			userEmail: ['', [Validators.required,this.customEmailValidator()]],
			department: [[], [Validators.required]], 
			DefaultDept: [''],
			isSalesperson: [false],
			userTypeId: [,[Validators.required]],
			contactNumber: [],
			status: ['Active'],
			userPassword: [,[this.customPasswordValidator()]],
			CountryMasterSid: [,[Validators.required]],
			CompanyMasterSid : [,[Validators.required]],
			branches : [[],[Validators.required]],
			roles : [[],[Validators.required]]
		});
		this.userForm.get('DefaultDept').disable()
	}



	loadAllFields(){
		forkJoin({
			departments : this.masterService.getAllDepartments(),
			userType : this.masterService.getAllUserType(),
			companies : this.masterService.getAllCompanies(),
			roles : this.settingService.getAllRole(),
			countries : this.masterService.getAllCountry()
		}).subscribe(({departments,userType,companies,roles,countries})=>{
			this.departmentList = departments,
			this.filteredDeptList = departments,
			this.userTypeList = userType.data,
			this.companyList = companies
			this.filteredRoleList = roles.data;
			this.roleList = roles.data;
			this.countryList = countries.data;
		})
	}

	// Load Data for Edit Mode
	loadUserData(UserMasterSid:number){
		this.masterService.getFfUserById(UserMasterSid).subscribe(
			(resp :any)=>{
				if(resp.status){
					this.userData = resp.data;
					const user = resp.data;
					const userCompanyMasterSid = user.userCompanyMaster[0].CompanyMasterSid;
					this.getBranchesByCompanyId({ CompanyMasterSid : userCompanyMasterSid});
					const userBranches = user.userBranchMaster.map(
						(branch) => 
							branch.BranchMasterSid
					)
					const userRoles = user.userRoleMaster.map(
						(role:UserRole) => role.RoleMasterSid
					)
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
						CompanyMasterSid: userCompanyMasterSid,
						branches: userBranches,
						roles:userRoles
					})
					this.setDefaultDept();
					
				} else {
					this.appSettingService.showError('Error Loading User Data')
				}
			},
			(error)=>{
				this.appSettingService.showError('Error Loading User Data');
				console.error('Error Loading User Data',error);
			}
		)
	}

	onSubmit(){
		if(this.userForm.invalid){
			this.userForm.markAllAsTouched();
			this.userForm.updateValueAndValidity();
			this.appSettingService.showWarning('Please fill all the required fields');
			return;
		}

		const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
		const formValue = this.userForm.getRawValue();

		const payload = {
			...formValue,
			userCode: this.getUserCode(formValue.userName),
			isSalesperson: formValue.isSalesperson ? '1' : '0',
			status: formValue.status === 'Active' ? 'A' : 'S',
			...(this.isEditMode ?  { updatedBy: currentUserEmail } : { createdBy: currentUserEmail }),
		}

		if(this.isEditMode){
			this.masterService.updateFfUserById(this.UserMasterSid,payload).subscribe(
				(resp:any)=>{
					if(resp.status){
						this.appSettingService.showSuccess('User Updated Successfully');
						this.router.navigate(['master/user/list']);
					} else {
						this.appSettingService.showError('Error Updating User');
					}
				},
				(error)=>{						
					this.appSettingService.showError('Error Updating User');
					console.error('Error Updating User',error);
				}
			)
		} else {
			this.masterService.createNewFfUser(payload).subscribe(
				(resp : any)=>{
					if(resp.status){
						this.appSettingService.showSuccess('New User Successfully Created');
						this.router.navigate(['master/user/list']);
					} else {
						this.appSettingService.showError('Error Creating User');
					}
				},
				(error)=>{						
					this.appSettingService.showError('Error Creating User');
					console.error('Error Creating User',error);
				}
			)
		}

	}


	// ====== Helper Functions ========= \\

	getBranchesByCompanyId(company){
		if(!company) return;
		this.userForm.get('branches')?.setValue([]);
		this.branchList = [];
		this.masterService.getBranchesByCompanyId(company.CompanyMasterSid).subscribe(
			(resp:any)=>{
				this.branchList = resp;
				this.filteredBranchList = resp;
			}
		)
	}

	clearCompany(){
		this.userForm.get('branches')?.setValue([]);
		this.branchList = [];
		this.filteredBranchList = []
	}

	getUserCode(userName : string){
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

	
	clearDefaultDept(){
		this.userForm.get('DefaultDept').reset();
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

	customEmailValidator(): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			const email = control.value?.trim();

			if (!email) return { required: true }; // Empty email error

			// Enhanced Email Pattern for Strict Validation
			const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

			return emailPattern.test(email) ? null : { emailInvalid: true };
		};
	}

	customPasswordValidator(): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			const password = control.value?.trim();

			// Return required error if empty
			if (!password) return this.isEditMode ? null : {required : true};

			const errors: ValidationErrors = {};


			// Check minimum length (8 characters)
			if (password.length < 8) {
				errors['minLength'] = true;
			}

			// Check for at least one uppercase letter
			// if (!/[A-Z]/.test(password)) {
			// 	errors['noUppercase'] = true;
			// }

			// Check for at least one lowercase letter
			if (!/[a-z]/.test(password)) {
				errors['noLowercase'] = true;
			}

			// Check for at least one number
			if (!/\d/.test(password)) {
				errors['noNumber'] = true;
			}

			// Check for at least one special character
			if (!/[@$!%*?&]/.test(password)) {
				errors['noSpecialChar'] = true;
			}

			// Return null if no errors, otherwise return the errors object
			return Object.keys(errors).length > 0 ? errors : null;
		};
	}

	togglePassword(input: HTMLInputElement): void {
		this.passwordView = true;
		input.type = 'text'; // Show password on mousedown
	}

	resetPassword(input: HTMLInputElement): void {
		this.passwordView = false;
		input.type = 'password'; // Hide password on mouseup or mouseleave
	}

	resetForm(){
		this.userForm.reset({
			status : 'Active'
		})
	}

	onRoleSearch(event: any): void {
		const searchTerm = event.target.value.toLowerCase();
		this.filteredRoleList = this.roleList.filter(role =>
			role.UserRoleName.toLowerCase().includes(searchTerm)
		);
	}

	roleControl():AbstractControl {
		return this.userForm.get('roles');
	}

	toggleRole(id: number) {
		console.log(id);
		const currentValue = this.roleControl().value;
		console.log(currentValue);
		console.log(currentValue.includes(id));
		if (currentValue.includes(id)) {
			this.roleControl().setValue(currentValue.filter((v: number) => v != id));
		} else {
			this.roleControl().setValue([...currentValue, id]);
		}
		console.log(this.roleControl().value);
	}

	toggleSelectAll() {
		const currentValue = this.roleControl().value;
		if (currentValue.length === this.filteredRoleList.length) {
			this.roleControl().setValue([]);
		} else {
			this.roleControl().setValue(this.filteredRoleList.map(r => r.RoleMasterSid));
		}
	}

	onSearchKeydown(event: KeyboardEvent): void {
		if (event.key === 'Backspace') {
			// Prevent backspace from clearing selected items
			event.stopPropagation();
			// Update search term and filtered list
			const input = event.target as HTMLInputElement;
			this.updateFilteredRoles(input.value);
		}
	}

	private updateFilteredRoles(searchTerm): void {
		// Assuming you have an original role list
		const originalRoleList = [...this.filteredRoleList]; // Replace with your actual data source
		if (searchTerm) {
			this.filteredRoleList = originalRoleList.filter(role =>
				role.UserRoleName.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			this.filteredRoleList = [...originalRoleList];
		}
	}
	// Branch related Data

	onBranchSearch(event: any): void {
		const searchTerm = event.target.value.toLowerCase();
		this.filteredBranchList = this.branchList.filter(branch =>
			branch.branchName.toLowerCase().includes(searchTerm)
		);
	}

	branchControl():AbstractControl {
		return this.userForm.get('branches');
	}

	toggleBranch(id: number) {
		const currentValue = this.branchControl().value;
		if (currentValue.includes(id)) {
			this.branchControl().setValue(currentValue.filter((v: number) => v != id));
		} else {
			this.branchControl().setValue([...currentValue, id]);
		}
	}

	toggleBranchSelectAll() {
		const currentValue = this.branchControl().value;
		if (currentValue.length === this.filteredBranchList.length) {
			this.branchControl().setValue([]);
		} else {
			this.branchControl().setValue(this.filteredBranchList.map(r => r.BranchMasterSid));
		}
	}

	onBranchSearchKeydown(event: KeyboardEvent): void {
		if (event.key === 'Backspace') {
			event.stopPropagation();
			const input = event.target as HTMLInputElement;
			this.updateFilteredBranches(input.value);
		}
	}

	private updateFilteredBranches(searchTerm): void {

		const originalBranchList = [...this.filteredBranchList]; 
		if (searchTerm) {
			this.filteredBranchList = originalBranchList.filter(branch =>
				branch.branchName.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			this.filteredBranchList = [...originalBranchList];
		}
	}

	// Department related Data

	onDeptSearch(event: any): void {
		const searchTerm = event.target.value.toLowerCase();
		this.filteredDeptList = this.departmentList.filter(dept =>
			dept.departmentName.toLowerCase().includes(searchTerm)
		);
	}

	deptControl():AbstractControl {
		return this.userForm.get('department');
	}

	toggleDept(name: string) {
		const currentValue = this.deptControl().value;
		if (currentValue.includes(name)) {
			this.deptControl().setValue(currentValue.filter((v: string) => v != name));
		} else {
			this.deptControl().setValue([...currentValue, name]);
		}
	}

	toggleDeptSelectAll() {
		const currentValue = this.deptControl().value;
		if (currentValue.length === this.filteredDeptList.length) {
			this.deptControl().setValue([]);
		} else {
			this.deptControl().setValue(this.filteredDeptList.map(r => r.departmentName));
		}
	}

	onDeptSearchKeydown(event: KeyboardEvent): void {
		if (event.key === 'Backspace') {
			event.stopPropagation();
			const input = event.target as HTMLInputElement;
			this.updateFilteredDept(input.value);
		}
	}

	private updateFilteredDept(searchTerm): void {

		const originalDeptList = [...this.filteredDeptList]; 
		if (searchTerm) {
			this.filteredDeptList = originalDeptList.filter(dept =>
				dept.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
			);
		} else {
			this.filteredBranchList = [...originalDeptList];
		}
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
