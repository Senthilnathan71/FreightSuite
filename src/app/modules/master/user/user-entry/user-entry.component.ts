import { Component, HostListener, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
  NgbDropdownModule,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, forkJoin, Subject, takeUntil } from 'rxjs';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  FfUser,
  UserRole,
} from 'src/app/modules/crm-mobile/Interfaces/ffuser.interface';
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
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { DialCodeDropdownComponent } from 'src/app/component/dial-code-dropdown/dial-code-dropdown.component';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

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
    NgbDropdownModule,
    SearchableDropdown,
    DialCodeDropdownComponent,
    ElementStateGuardDirective,
    FormStateGuardDirective
  ],
  templateUrl: './user-entry.component.html',
  styleUrl: './user-entry.component.scss',
})
export class UserEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private destroy$ = new Subject<void>();
  private initialFormValue: any = null;
  isDirty = false;
  isSaving = false;
  private formChangesSubscribed = false;

  UserMasterSid: number;
  isEditMode: boolean;
  userData: FfUser;
  userForm!: FormGroup;

  departmentList: any[];
  userTypeList: any[];
  companyList: any[];
  salesCompanyList: any[] = [];
  branchList: any[];
  menuList: any[];
  roleList: any[] = [];
  countryList: any[];
  reportingManagersList: any[] = [];
  passwordView: boolean;

  permissions: string[] = [];
  currentMenuPermissions: any = {};
  userInfos: any[] = []; // for displaying branches
  selectedCompanies: any[];
  defaultItems: { [companyId: number]: number } = {};
  /**
   * 	Maps Role List with Selected CompanyMasterSid Index
   */
  roleDataForCompany: any[][] = [];
  /**
   * For nth index , selected roles for nth company
   */
  selectedRoles: number[][] = [];

  modeOfStatus = [{ name: 'Active' }, { name: 'Suspended' }];
  currentMenuId: number;
  TandCList: any;

  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  countryLookupConfig = DROPDOWN_CONFIGS.COUNTRY;

  constructor(
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private router: Router,
    private currentRoute: ActivatedRoute,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private settingService: SettingsService,
    public dropdownStore: DropdownStore,
    private commonService: CommonService,
    public mps: MenuPermissionService,
    private ngbModal: NgbModal
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingService.getCurrentBranchInfo();
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.MenuMasterSid = this.mps.getMenuId();
    this.mps.init().subscribe();
    this.initUserForm();
    this.loadAllFields();
  }

  // initializes userForm
  initUserForm() {
    this.userForm = this.fb.group({
      userName: ['', [Validators.required]],
      userEmail: [
        '',
        [Validators.required, Validators.maxLength(50), EmailValidators.singleEmail()],
      ],
      designation: ['', [Validators.required]],
      department: [[], [Validators.required]],
      DefaultDept: [''],
      DeptHead : [null],
      isSalesperson: [false],
      SalesCompany: [[]],
      isLoginUser: [true],
      userTypeId: [, [Validators.required]],
      contactNumberCode: [DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData)],
      contactNumber: [null, [Validators.maxLength(15)]],
      status: ['Active'],
      AttemptDateTime: [null],
      userPassword: [, [PasswordValidators.validate()]],
      CountryMasterSid: [, [Validators.required]],
      companies: [[], [Validators.required]],
      userCompanyMaster: this.fb.array(
        [],
        [this.atLeastOneDefaultValidator()]
      ),
    });
    this.userForm.get('DefaultDept').disable();
    this.handleLoginUserToggle();
    this.handleSalespersonToggle();
    this.subscribeToFormChanges();
  }

  handleSalespersonToggle() {
    this.userForm.get('isSalesperson')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const salesCompanyCtrl = this.userForm.get('SalesCompany');
        if (!value) {
          // Not a salesman → clear selection and drop the required rule
          salesCompanyCtrl?.setValue([]);
          salesCompanyCtrl?.clearValidators();
        } else {
          // Salesman → SalesCompany is mandatory
          salesCompanyCtrl?.setValidators([Validators.required]);
        }
        salesCompanyCtrl?.updateValueAndValidity();
      });
  }

  /**
   * Builds the SalesCompany dropdown options from the login company's CompanyGroup.
   * Shows every company that shares the login company's CompanyGroup, plus the
   * login company itself. If the login company has no group, only itself shows.
   */
  buildSalesCompanyOptions() {
    const loginCompanySid = this.currentCompany?.CompanyMasterSid;
    const loginCompany = (this.companyList || []).find(
      (company) => company.CompanyMasterSid === loginCompanySid
    );
    const group = loginCompany?.CompanyGroup;

    this.salesCompanyList = (this.companyList || []).filter(
      (company) =>
        company.CompanyMasterSid === loginCompanySid ||
        (!!group && company.CompanyGroup === group)
    );
  }

  handleLoginUserToggle() {
  this.userForm.get('isLoginUser')?.valueChanges.subscribe((value) => {

    if (!value) {
      //  Not Login User → remove company/branch/role validation

      this.userForm.get('companies')?.clearValidators();
      this.userForm.get('companies')?.setValue([]);

      this.userCompanyMaster.clear();
      this.userCompanyMaster.clearValidators();

    } else {
      //  Login User → make company mandatory again

      this.userForm.get('companies')?.setValidators([Validators.required]);
      this.userCompanyMaster.setValidators([
        this.atLeastOneDefaultValidator()
      ]);
    }

    this.userForm.get('companies')?.updateValueAndValidity();
    this.userCompanyMaster.updateValueAndValidity();
  });
}

  sanitizeEmailInput() {
    const emailControl = this.userForm.get('userEmail');
    const currentValue = emailControl?.value;

    if (typeof currentValue !== 'string') {
      return;
    }

    const sanitizedValue = currentValue.replace(/\s+/g, '');
    if (sanitizedValue !== currentValue) {
      emailControl?.setValue(sanitizedValue);
    }
  }

  sanitizeEmailPaste(event: ClipboardEvent) {
    event.preventDefault();

    const pastedText = event.clipboardData?.getData('text') ?? '';
    const sanitizedValue = pastedText.replace(/\s+/g, '');

    this.userForm.get('userEmail')?.setValue(sanitizedValue);
    this.userForm.get('userEmail')?.markAsDirty();
    this.userForm.get('userEmail')?.markAsTouched();
  }


  get userCompanyMaster(): FormArray {
    return this.userForm.get('userCompanyMaster') as FormArray;
  }

  userBranchMaster(companyIndex: number): FormArray {
    return this.userCompanyMaster
      .at(companyIndex)
      .get('userBranchMaster') as FormArray;
  }

  userRoleMaster(companyIndex: number): FormArray {
    return this.userCompanyMaster
      .at(companyIndex)
      .get('userRoleMaster') as FormArray;
  }

  createNewUserCompany(data?: any) {
    const companyName = data?.companyName || 'Unnamed Company';
    return this.fb.group({
      UserCompanyMasterSid: [data.UserCompanyMasterSid || null],
      CompanyMasterSid: [data.CompanyMasterSid || null],
      companyName: [companyName || ''],
      GiveAccess: [true],
      IsDefault: [data.IsDefault === 'Y' || false],
      roles: [[], [Validators.required]],
      userBranchMaster: this.fb.array(
        [],
        this.atLeastOneBranchAccessValidator(companyName)
      ),
      userRoleMaster: this.fb.array(
        [],
        this.atLeastOneRoleAccessValidator(companyName)
      ),
    });
  }

  createNewUserBranches(data?: any) {
    return this.fb.group({
      UserBranchMasterSid: [data.UserBranchMasterSid || null],
      CompanyMasterSid: [data.CompanyMasterSid || null],
      BranchMasterSid: [data.BranchMasterSid || null],
      branchName: [data.branchName || ''],
      GiveAccess: [data.GiveAccess === 'Y' || false],
      IsDefault: [data.IsDefault === 'Y' || false],
      CostRevenueAccess: [data?.CostRevenueAccess || 'NONE'],
    });
  }

  createNewUserRoles(data?: any) {
    return this.fb.group({
      UserRoleMasterSid: [data.UserRoleMasterSid || null],
      RoleMasterSid: [data.RoleMasterSid || null],
      GiveAccess: [data.GiveAccess === 'Y' || true],
      IsDefault: [data.IsDefault === 'Y' || false],
    });
  }

  addToSelectedCompany(companies: number[]) {
    const oldCompaniesArr: number[] = this.selectedCompanies || [];
    const newCompaniesArr: number[] = companies || [];

    const companyToRemove = oldCompaniesArr.filter(
      (oldCompSid) => !newCompaniesArr.includes(oldCompSid)
    );
    const companyToAdd = newCompaniesArr.filter(
      (newCompSid) => !oldCompaniesArr.includes(newCompSid)
    );

    if (companyToRemove.length > 0) {
      const indicesToRemove: number[] = [];
      this.userCompanyMaster.controls.forEach((formGroup, index) => {
        const companySid = formGroup.get('CompanyMasterSid')?.value;
        if (companyToRemove.includes(companySid)) {
          this.roleDataForCompany.splice(index, 1);
          indicesToRemove.push(index);
        }
      });

      indicesToRemove
        .sort((a, b) => b - a)
        .forEach((index) => {
          this.userCompanyMaster.removeAt(index);
        });
    }

    if (companyToAdd.length > 0) {
      for (const companySid of companyToAdd) {
        const company = this.companyList.find(
          (company) => company.CompanyMasterSid === companySid
        );
        if (company) {
          this.handleCompanySelection(company);
        }
      }
    }

    this.selectedCompanies = [...newCompaniesArr];
    console.log('USER FORM AFTER COMPANY SELECTION', this.userForm.value);
  }

  addToSelectedRole(companyIndex:number,roles: number[]){
	const oldRoleArr : number[] = this.selectedRoles[companyIndex] || [];
	const newRoleArr : number[] = roles || [];

	const roleToRemove = oldRoleArr.filter((oldRole) => !newRoleArr.includes(oldRole));
	const roleToAdd = newRoleArr.filter((newRole) => !oldRoleArr.includes(newRole));

	if (roleToRemove.length > 0) {
		const indicesToRemove: number[] = [];
		this.userRoleMaster(companyIndex).controls.forEach((formGroup, index) => {
			const roleSid = formGroup.get('RoleMasterSid')?.value;
			if (roleToRemove.includes(roleSid)) {
				this.selectedRoles[companyIndex].splice(index, 1);
				indicesToRemove.push(index);
			}
		});

		indicesToRemove
			.sort((a, b) => b - a)
			.forEach((index) => {
				this.userRoleMaster(companyIndex).removeAt(index);
			});
	}

	if (roleToAdd.length > 0) {
		for (const roleSid of roleToAdd) {
			const role = this.roleDataForCompany[companyIndex].find((role) => role.RoleMasterSid === roleSid);
			if (role) {
				const roleForm = this.createNewUserRoles({
					...role,
					GiveAccess: 'Y',
				});
				this.userRoleMaster(companyIndex).push(roleForm);
			}
		}
	}

	this.selectedRoles[companyIndex] = [...newRoleArr];
	console.log("selectedRoles",this.selectedRoles);


    const conflicts = this.checkModuleConflicts(this.selectedRoles[companyIndex], this.roleDataForCompany[companyIndex]);
    console.log("CONFLICTS", conflicts);
    if (conflicts.length > 0) {
      this.userRoleMaster(companyIndex)?.setErrors({ roleModuleError: conflicts });
      console.log("ERRORS", this.userRoleMaster(companyIndex)?.errors);
    } else {
      this.userRoleMaster(companyIndex)?.setErrors(null);
    }
  }

  checkModuleConflicts(selectedRoleIds: number[], roleList: any[]) {
    const moduleMap = new Map<string, number[]>();

    for (const roleId of selectedRoleIds) {
      const role = roleList.find(r => r.RoleMasterSid === roleId);
      if (!role) continue;

      for (const module of role.ModuleInvolved) {
        if (!moduleMap.has(module)) moduleMap.set(module, [roleId]);
        else moduleMap.get(module)!.push(roleId);
      }
    }

    const conflicts: { module: string, roles: number[] }[] = [];

    moduleMap.forEach((roles, module) => {
      if (roles.length > 1) conflicts.push({ module, roles });
    });

    return conflicts; // empty array → no conflict
  }

  handleCompanySelection(company) {
    if (!company || company === undefined || company === null) {
      return;
    }
    const branches: any[] = company.branchMaster || [];
    this.userCompanyMaster.push(this.createNewUserCompany(company));
    const lastCompanyIndex = this.userCompanyMaster.length - 1;
    if (branches.length > 0) {
      branches.map((branch) =>
        this.userBranchMaster(lastCompanyIndex).push(
          this.createNewUserBranches(branch)
        )
      );
    }
    this.fetchRolesForCompany(company.CompanyMasterSid, lastCompanyIndex);
  }



  toggleDefaultCompany(companyIndex: number, event: any) {
    const element = event.target as HTMLInputElement;
    if (event instanceof KeyboardEvent) {
      element.checked = !element.checked;
    }
    this.userCompanyMaster.controls.forEach((ctrl, idx) => {
      if (idx !== companyIndex) {
        ctrl.get('IsDefault')?.setValue(false);
      } else {
        ctrl.get('IsDefault')?.setValue(element.checked);
      }
    });
    this.userCompanyMaster.updateValueAndValidity();
  }

  toggleBranchDefaultCheckbox(companyIndex, branchIndex, event) {
    const element = event.target as HTMLInputElement;
    const defaultCtrl = this.userBranchMaster(companyIndex)
      .at(branchIndex)
      .get('IsDefault');
    const accessCtrl = this.userBranchMaster(companyIndex)
      .at(branchIndex)
      .get('GiveAccess');
    if (event instanceof KeyboardEvent) {
      element.checked = !element.checked;
    }
    this.userBranchMaster(companyIndex).controls.forEach((ctrl, idx) => {
      if (idx !== branchIndex) {
        ctrl.get('IsDefault')?.setValue(false);
      } else {
        defaultCtrl.setValue(true);
        accessCtrl.setValue(true);
      }
    });
    this.userCompanyMaster.updateValueAndValidity();
  }

  toggleBranchAccessCheckBox(companyIndex, branchIndex, event) {
    const element = event.target as HTMLInputElement;
    const accessCtrl = this.userBranchMaster(companyIndex)
      .at(branchIndex)
      .get('GiveAccess');
    const defaultCtrl = this.userBranchMaster(companyIndex)
      .at(branchIndex)
      .get('IsDefault');
    if (event instanceof KeyboardEvent) {
      element.checked = !element.checked;
    }
    accessCtrl.setValue(element.checked);
    accessCtrl.updateValueAndValidity();
    // if access removed on a default branch, remove default
    if (!element.checked && defaultCtrl.value) {
      defaultCtrl.setValue(false);
    }
    this.userCompanyMaster.updateValueAndValidity();
  }

  loadReportingUsers() {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.reportingManagersList = [];

    if (!companyMasterSid) {
      return;
    }

    const payload = {
      CompanyMasterSid: companyMasterSid,
    };

    this.masterService.getReportingUsers(payload).subscribe({
      next: (resp: any) => {
        this.reportingManagersList = (resp.data || []).map((user: any) => ({
          ...user,
          userTypeName: user.userType?.name || user.userType?.code || '',
        }));
        // if (this.isEditMode && this.UserMasterSid) {
        //   this.reportingManagersList = this.reportingManagersList.filter(
        //     (mgr: any) => mgr.UserMasterSid !== this.UserMasterSid
        //   );
        // }
      },
      error: (error) => {
        console.error('Error fetching reporting users:', error);
        this.reportingManagersList = [];
      }
    });
  }

  // loads all lookups
  loadAllFields() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      departments: this.masterService.getAllDepartments(CompanyMasterSid),
      userType: this.masterService.getAllUserType(),
      companies: this.masterService.getAllCompanies(),
      menus: this.settingService.getAllMenu(),
    }).subscribe(({ departments, userType, companies, menus }) => {
      (this.departmentList = departments),
        (this.userTypeList = userType.data),
        (this.companyList = (companies || []).filter(
          (company: any) =>
            Array.isArray(company.branchMaster) &&
            company.branchMaster.length > 0
        ));
      this.menuList = menus;
      this.buildSalesCompanyOptions();

      this.currentRoute.paramMap.subscribe((param) => {
        this.UserMasterSid = +param.get('id');
        if (this.UserMasterSid) {
          this.isEditMode = true;
          this.loadReportingUsers();
          this.loadUserData(this.UserMasterSid);
        } else {
          this.loadReportingUsers();
          this.userForm
            .get('userPassword')
            ?.setValidators([
              Validators.required,
              PasswordValidators.validate(),
            ]);
          this.captureInitialFormState();
        }
      });
    });
    this.dropdownStore.loadCountries().subscribe();
  }

  // Load Data for Edit Mode
  loadUserData(UserMasterSid: number) {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const payload = {
      UserMasterSid: UserMasterSid,
      CompanyMasterSid: CompanyMasterSid,
    }
    this.masterService.getFfUserById(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.userData = resp.data;
          const d = resp.data;
          const parsedContact = this.parsePhone(d.contactNumber);
          const allCompanyIds = d.userCompanyMaster.map((comp) => comp.CompanyMasterSid);
          this.selectedCompanies = allCompanyIds || [];

          this.userForm.patchValue({
            userCode: d.userCode?.trim(),
            userName: d.userName,
            userEmail: d.userEmail,
            contactNumberCode: parsedContact.phoneCode,
            contactNumber: parsedContact.phoneNumber,
            designation: d.designation,
            isLoginUser: d.isLoginUser === 'Y',
            isSalesperson: d.isSalesperson === '1' || d.isSalesperson === 'Y',
            SalesCompany: d.SalesCompany ?? [],
            userTypeId: d.userTypeId,
            companies: allCompanyIds,
            department: d.department ?? [],
            CountryMasterSid: d.CountryMasterSid,
            status: d.status === 'A' ? 'Active' : 'Suspended',
            AttemptDateTime: this.toDateTimeLocalValue(d.AttemptDateTime),
            DeptHead: d.DeptHead || null
          });
          this.setDefaultDept();

          (d.userCompanyMaster || []).forEach((company, companyIdx) => {
            // Find company in dropdown list to get valid branches
            const companyFromList = this.companyList.find(
              (comp) => comp.CompanyMasterSid === company.CompanyMasterSid
            );

            if (!companyFromList) return;

            // Get valid branches from company dropdown
            const validBranchesMap : Map<number,any> = new Map(
              (companyFromList.branchMaster || []).map(branch => [
                branch.BranchMasterSid,
                branch
              ])
            );

            // userBranchMaster is inside companyMaster
            const userBranches = company.companyMaster?.userBranchMaster || [];
            // Filter out branches that don't exist in company dropdown
            const validUserBranches = userBranches.filter(userBranch =>
              validBranchesMap.has(userBranch.BranchMasterSid)
            );

            // userRoleMaster is at company level
            const userRoles = company.userRoleMaster || [];
            const allRoleIds = userRoles.map((role) => role.RoleMasterSid);

            // Create company form group with company name
            const companyData = {
              UserCompanyMasterSid: company.UserCompanyMasterSid,
              CompanyMasterSid: company.CompanyMasterSid,
              companyName: companyFromList.companyName || company.companyMaster?.companyName,
              GiveAccess: company.GiveAccess,
              IsDefault: company.IsDefault
            };

            this.userCompanyMaster.push(this.createNewUserCompany(companyData));
            const lastCompanyIndex = this.userCompanyMaster.length - 1;

            // Fetch all available roles for this company
            this.fetchRolesForCompany(
              company.CompanyMasterSid,
              lastCompanyIndex
            );

            // Initialize selectedRoles array for this company with actual user roles
            this.selectedRoles[lastCompanyIndex] = allRoleIds;

            // Populate role form array with user's assigned roles
            if (userRoles.length > 0) {
              const roleFormArray = this.userRoleMaster(lastCompanyIndex);
              userRoles.forEach((role) => {
                roleFormArray.push(this.createNewUserRoles(role));
              });
            }

            // Patch roles control in company form group for dropdown
            this.userCompanyMaster.at(lastCompanyIndex).get('roles')?.setValue(allRoleIds);

            // Populate branch form array with ONLY valid branches
            validUserBranches.forEach((userBranch) => {
              const validBranch = validBranchesMap.get(userBranch.BranchMasterSid);
              const branchData = {
                UserBranchMasterSid: userBranch.UserBranchMasterSid,
                CompanyMasterSid: userBranch.CompanyMasterSid,
                BranchMasterSid: userBranch.BranchMasterSid,
                branchName: validBranch?.branchName || userBranch.branchMaster?.branchName,
                GiveAccess: userBranch.GiveAccess,
                IsDefault: userBranch.IsDefault,
                CostRevenueAccess: userBranch.CostRevenueAccess,
              };

              this.userBranchMaster(lastCompanyIndex).push(
                this.createNewUserBranches(branchData)
              );
            });
          });
          this.captureInitialFormState();

        } else {
          this.appSettingService.showError('Access denied.');
        }
      },
      (error) => {
        this.appSettingService.showError('Error Loading User Data');
        console.error('Error Loading User Data', error);
      }
    );
  }

  onSubmit(resolve?: (saved: boolean) => void) {
    if (this.isSaving) {
      resolve?.(false);
      return;
    }
    this.isSaving = true;
    console.log(this.userForm.value);
    if (this.userForm.invalid) {
	  this.errorLogger(this.userForm);
      this.userForm.markAllAsTouched();
      this.userForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all the required fields');
      this.isSaving = false;
      resolve?.(false);
      return;
    }

    const raw = this.userForm.getRawValue();
    if (this.isEditMode && this.initialFormValue && this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.isSaving = false;
      resolve?.(false);
      return;
    }

    const currentUserEmail =
      this.appSettingService.userSettingSource.value['userEmail'];
    const formValue = this.userForm.getRawValue();
    let companyPayload = [];
    if (this.userForm.value.isLoginUser) {
    companyPayload = this.userCompanyMaster.controls.map(
      (companyFormGroup, companyIndex) => {
        const companyFormValue = companyFormGroup.value;

        const branchArrValues = this.userBranchMaster(companyIndex).value;
        const branchPayload = branchArrValues.map((branch) => {
          return {
            UserBranchMasterSid: branch.UserBranchMasterSid,
            CompanyMasterSid: branch.CompanyMasterSid,
            BranchMasterSid: branch.BranchMasterSid,
            GiveAccess: branch.GiveAccess ? 'Y' : 'N',
            IsDefault: branch.IsDefault ? 'Y' : 'N',
            CostRevenueAccess: branch.CostRevenueAccess,
          };
        });

        const roleArrValues = this.userRoleMaster(companyIndex).value;
        const rolePayload = roleArrValues.map((role) => {
          return {
            UserRoleMasterSid: role.UserRoleMasterSid,
            RoleMasterSid: role.RoleMasterSid,
            GiveAccess: role.GiveAccess ? 'Y' : 'N',
            IsDefault: role.IsDefault ? 'Y' : 'N',
          }
        });

        return {
          UserCompanyMasterSid: companyFormValue.UserCompanyMasterSid,
          CompanyMasterSid: companyFormValue.CompanyMasterSid,
          GiveAccess: 'Y',
          IsDefault: companyFormValue.IsDefault ? 'Y' : 'N',
          userBranchMaster: branchPayload,
          userRoleMaster: rolePayload
        };
      }
    );
  }

    const payload = {
      userName: formValue.userName,
      userEmail: formValue.userEmail,
      designation: formValue.designation,
      department: formValue.department,
      DefaultDept: formValue.DefaultDept,
      DeptHead : formValue.DeptHead,
      isSalesperson: formValue.isSalesperson ? '1' : '0',
      SalesCompany: formValue.isSalesperson ? (formValue.SalesCompany || []) : [],
      userTypeId: formValue.userTypeId,
      contactNumber: this.withDialCode(formValue.contactNumber, formValue.contactNumberCode)|| null,
      CountryMasterSid: formValue.CountryMasterSid,
      AttemptDateTime: this.toApiDateTimeValue(formValue.AttemptDateTime),
      status:
        formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      userCode: this.getUserCode(formValue.userName),
      isLoginUser: formValue.isLoginUser ? 'Y' : 'N',
      userCompanyMaster: companyPayload,
      ...(this.isEditMode
        ? { updatedBy: currentUserEmail }
        : {
            createdBy: currentUserEmail,
            userPassword: formValue.userPassword,
          }),
    };
	console.log("PAYLOAD",payload);
    if (this.isEditMode) {
      this.masterService
        .updateFfUserById(this.UserMasterSid, payload)
        .subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.isDirty = false;
              this.captureInitialFormState();
              this.isSaving = false;
              resolve?.(true);
              this.router.navigate(['master/user/list']);
            } else {
              this.appSettingService.showError(resp.message);
              this.isSaving = false;
              resolve?.(false);
            }
          },
          (error) => {
            this.appSettingService.showError('Error Updating User');
            console.error('Error Updating User', error);
            this.isSaving = false;
            resolve?.(false);
          }
        );
    } else {
      this.masterService.createNewFfUser(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.isDirty = false;
            this.captureInitialFormState();
            this.isSaving = false;
            resolve?.(true);
            this.router.navigate(['master/user/list']);
          } else {
            this.appSettingService.showError(resp.message);
            this.isSaving = false;
            resolve?.(false);
          }
        },
        (error) => {
          this.appSettingService.showError('Error Creating User');
          console.error('Error Creating User', error);
          this.isSaving = false;
          resolve?.(false);
        }
      );
    }
  }

  // ====== Helper Functions ========= \\

  toggleCheckbox(event: Event) {
    event.preventDefault();
    const element = event.target as HTMLInputElement;
    element.checked = !element.checked;
    this.userForm
      .get('isSalesperson')
      .setValue(!this.userForm.get('isSalesperson').value);
    this.userForm.get('isSalesperson').updateValueAndValidity();
  }

  // ====== Company Related Functions ========= \\



  atLeastOneBranchAccessValidator(companyName: string): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const hasAccess = (formArray as FormArray).controls.some(
        (control) => control.get('GiveAccess')?.value === true
      );

      if (!hasAccess) {
        return {
          noAccess: `At least one branch must have 'Access' selected for company: "${companyName}".`,
        };
      }

      return null;
    };
  }

  atLeastOneRoleAccessValidator(companyName: string): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const hasAccess = (formArray as FormArray).controls.some(
        (control) => control.get('GiveAccess')?.value === true
      );

      if (!hasAccess) {
        return {
          noAccess: `At least one role must have 'Access' selected for company: "${companyName}".`,
        };
      }

      return null;
    };
  }
  getConflictRoles(roleIds: number[], companyIndex: number): string {
    return roleIds
      .map(id => this.getRoleName(id, companyIndex))
      .join(', ');
  }

  getRoleName(roleId: number, companyIndex: number) {
    return this.roleDataForCompany[companyIndex].find(r => r.RoleMasterSid === roleId)?.UserRoleName ?? '';
  }



  atLeastOneDefaultValidator(): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const hasDefault = (formArray as FormArray).controls.some(
        (control) => control.get('IsDefault')?.value === true
      );

      if (!hasDefault) {
        return {
          atLeastOneDefaultCompany: true,
        };
      }
      return null;
    };
  }

  getUserCode(userName: string) {
    return userName.replace(/\s+/g, '_');
  }

  setDefaultDept() {
    const departmentSelected: string[] =
      this.userForm.get('department')?.value || [];
    if (departmentSelected.length > 0) {
      this.userForm.get('DefaultDept')?.setValue(departmentSelected[0]);
    } else {
      this.userForm.get('DefaultDept')?.setValue('');
    }
  }

  private fetchRolesForCompany(companyId: number, companyIndex: number) {
    const payload = { CompanyMasterSid: companyId };

    this.masterService.getRoleDetailsByCompanyId(payload).subscribe({
      next: (response: any) => {
        if (response.status && response.data) {
          this.roleDataForCompany[companyIndex] = response.data;

          // ✅ Initialize roles form array with validator
          const roleFormArray = this.userRoleMaster(companyIndex);
          roleFormArray.setValidators(
            this.atLeastOneRoleAccessValidator(
              response.data[0]?.companyName || 'Company'
            )
          );
          roleFormArray.updateValueAndValidity();
        }
      },
      error: (error) => {
        console.error(`Error fetching roles for company ${companyId}:`, error);
        this.roleDataForCompany[companyIndex] = [];
      },
    });
  }

  navigateBack() {
    history.back();
  }

  showInfo() {
    if (!this.userData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
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

  clearAttemptDateTime(): void {
    this.userForm.get('AttemptDateTime')?.setValue(null);
    this.userForm.get('AttemptDateTime')?.markAsDirty();
    this.userForm.get('AttemptDateTime')?.markAsTouched();
    this.appSettingService.showSuccess('Login lock cleared. Save changes to apply.');
  }

  getLoginLockStatus(): string {
    const value = this.userForm.get('AttemptDateTime')?.value;
    if (!value) {
      return 'No active login lock.';
    }

    const lockedAt = new Date(value);
    if (Number.isNaN(lockedAt.getTime())) {
      return 'Login lock time is invalid.';
    }

    const lockEndsAt = new Date(lockedAt.getTime() + 5 * 60 * 1000);
    const remainingMs = lockEndsAt.getTime() - Date.now();

    if (remainingMs <= 0) {
      return 'Lock window has expired. Clear and save to reset it now.';
    }

    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return `Account is locked. About ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} remaining.`;
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
      SalesCompany: [],
      userTypeId: null,
      contactNumberCode: DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData),
      contactNumber: null,
      status: 'Active',
      AttemptDateTime: null,
      userPassword: null,
      CountryMasterSid: null,
      companies: [],
      roles: [],
    });

    // Clear form arrays
    this.userCompanyMaster.clear();

    // Reset password field validators for new entries
    this.userForm
      .get('userPassword')
      ?.setValidators([Validators.required, PasswordValidators.validate()]);
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
    this.captureInitialFormState();

    // Clear any loaded user data for new entries
    this.userData = null;
    this.UserMasterSid = null;
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onSubmit(resolve);
    });
  }

  private subscribeToFormChanges(): void {
    if (this.formChangesSubscribed) {
      return;
    }
    this.formChangesSubscribed = true;
    this.userForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.initialFormValue) {
          return;
        }
        this.isDirty = !this.deepEqual(this.initialFormValue, this.userForm.getRawValue());
      });
  }

  private captureInitialFormState(): void {
    this.initialFormValue = this.userForm.getRawValue();
    this.isDirty = false;
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) {
      return Number(value);
    }
    if (typeof value === 'number') {
      return Number(value.toFixed(6));
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.normalizeValue(v));
    }
    if (typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc: any, key) => {
          acc[key] = this.normalizeValue(value[key]);
          return acc;
        }, {});
    }
    return value;
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }

  private parsePhone(rawValue: any): { phoneCode: string; phoneNumber: string } {
    const parsed = DialCodeDropdownComponent.splitPhoneNumber(rawValue);
    return {
      phoneCode:
        parsed.phoneCode ||
        DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData),
      phoneNumber: parsed.phoneNumber,
    };
  }

  private withDialCode(phoneValue: any, dialCode?: string): string {
    return DialCodeDropdownComponent.buildPhoneWithDialCode(
      phoneValue,
      dialCode || DialCodeDropdownComponent.getDefaultDialCodeFromLoginCountry(this.userData)
    );
  }

  private toDateTimeLocalValue(value: any): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  }

  private toApiDateTimeValue(value: any): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(`${value}Z`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  // openTandC() {
  //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //   const payload = { MenuMasterSid: this.currentMenuId };
  //   this.masterService.getTandCByCondition(payload).subscribe(
  //     (resp: any) => {
  //       if (resp.status) {
  //         this.TandCList = resp.data;
  //         const modalRef = this.modalService.open(TermsAndConditionsComponent, {
  //           size: 'lg',
  //           backdrop: 'static',
  //           centered: true,
  //         });
  //         modalRef.componentInstance.terms = this.TandCList;
  //         modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //         modalRef.componentInstance.DocumentSid = this.UserMasterSid;
  //       } else {
  //         this.appSettingService.showError(
  //           'Error loading Terms and Conditions'
  //         );
  //       }
  //     },
  //     (error) => {
  //       this.appSettingService.showError(
  //         'Error loading Terms and Conditions',
  //         error
  //       );
  //     }
  //   );
  // }

  private findInvalidControlsRecursive(form: FormGroup | FormArray): string[] {
    let invalidControls: string[] = [];
    Object.keys(form.controls).forEach(key => {
      const control = (form as any).get(key);
      if (control.invalid) {
        invalidControls.push(key);
      }
      if (control instanceof FormGroup || control instanceof FormArray) {
        invalidControls = invalidControls.concat(
          this.findInvalidControlsRecursive(control).map(childKey => `${key}.${childKey}`)
        );
      }
    });
    return invalidControls;
  }

  public errorLogger(formGroup : FormGroup): void {
	console.log("Form Controls:",formGroup.controls);
    console.log('Form Status:', formGroup.status);
    console.log('Form Value', formGroup.value);
    if (formGroup.invalid) {
      const invalid = this.findInvalidControlsRecursive(formGroup);
      console.log('Invalid controls:', invalid);
    } else {
      console.log('No invalid controls found.');
    }
  }

  openEmail() {
    if (!this.userData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
  }

  openAuthority() {
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.UserMasterSid;
  }

  openEDoc() {
    if (!this.userData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.userData;
    modalRef.componentInstance.idLabel = 'User Id';
    modalRef.componentInstance.idValue = this.userData?.UserMasterSid;
    const data: any = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: this.UserMasterSid,
    };

    this.commonService.documentData.set(data);
  }

  openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.UserMasterSid;
  }

  ngOnDestroy(): void {
    this.commonService.clearDocumentData();
    this.dropdownStore.clearCache();
    this.destroy$.next();
    this.destroy$.complete();
  }

  openFollowup() {
    if (!this.userData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.documentSid = this.userData?.UserMasterSid;
    modalRef.componentInstance.parentEmail = this.userData;
    //   modalRef.componentInstance.parentSubject = `Quotation No.${this.userData} Date:${new Date(this.userData).toLocaleDateString()}`;
    modalRef.componentInstance.parentMailbody = `
	  <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
		<p>Dear Sir/Madam,</p>
		<p>Please find enclosed the quotation as requested.</p>
		<p>Kindly review the details at your convenience.</p>
		<p>Looking forward to your feedback and the opportunity to work together.</p>
		<p>
		  Approval Hyperlink: 
		  <a href="https://xxxxxxxxx" target="_blank" style="color: #1a73e8;">Click here to approve</a>
		</p>
		<p>Best Regards,</p>
		<p>${this.userData['userEmail']}</p>
	  </div>
	`;

    // Optionally, pass the quotation HTML content ID for PDF generation
    modalRef.componentInstance.pdfContentId = 'quotationContent';
  }

  openAuditLogs() {
        if (!this.userData?.UserMasterSid) return;
        const modalRef = this.modalService.open(AuditLogComponent, {
          centered: true,
          scrollable: true,
          size: 'xl',
          windowClass: 'audit-log-modal'
        });
        modalRef.componentInstance.title = 'User Logs';
        modalRef.componentInstance.tableName = 'UserMaster';
        modalRef.componentInstance.recordId = this.userData?.UserMasterSid.toString();
        modalRef.componentInstance.screenName = 'User';
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
