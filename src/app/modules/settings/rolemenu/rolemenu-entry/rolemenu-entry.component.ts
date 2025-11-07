import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router } from '@angular/router';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { SettingsService } from '../../settings.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { TogglerComponent } from 'src/app/component/simple-toggler/toggle.component';
import { debounceTime, forkJoin } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
@Component({
  selector: 'app-rolemenu-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, TextWithNumbersDirective, TogglerComponent,MultiSelectComponent],
  templateUrl: './rolemenu-entry.component.html',
  styleUrls: ['./rolemenu-entry.component.scss'],
})
export class RolemenuEntryComponent implements OnInit {
  roleMenuForm!: FormGroup;
  moduleList: any[] = [];
  menuList: any[] = [];
  roleList: any[] = [];
  menuPermissionList: any[] = [];
  selectedPermission: string[] = [];
  menuPermissionsFetched = false;
  isEditMode = false;

  RoleMenuMasterSid: number;
  roleMenuData: any;
  currentCompany: any;
  currentBranch: any;
  userData: any;
  selectedModuleMenuList:any

  modeOfStatus = [
    { value: 'A', name: "Active" },
    { value: 'S', name: "Suspended" },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private settingService: SettingsService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    this.initRoleMenuForm();
    this.loadDropdownData();

    // decrypt company and branch
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) this.userData = userProfile;

    // if editing (detect route param)
    const existingData = history.state?.data;
    if (existingData) {
      this.isEditMode = true;
      this.roleMenuData = existingData;
      this.loadRoleMenuData(existingData);
    }
  }

  initRoleMenuForm() {
    this.roleMenuForm = this.fb.group({
      Module: [, [Validators.required]],
      MenuMasterSid: [, [Validators.required]],
      RoleMasterSid: [, [Validators.required]],
      DisplayName:[''],
      Remarks: [''],
      MenuPermissions: [{}],
      status: ['Active'],
      InsertRole: [false],
      ViewRole: [false],
      UpdateRole: [false],
      DeleteRole: [false]
    });
  }

  loadDropdownData() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      modules: this.settingService.getAllModule(),
      roles: this.settingService.getAllRole(CompanyMasterSid)
    }).subscribe(({ modules, roles }) => {
      this.moduleList = modules.data;
      this.roleList = roles.data;
    });
  }

  	clearMenuPermissions() {
		this.menuPermissionsFetched = false;
		this.roleMenuForm.get('MenuPermissions').reset({});
		this.menuPermissionList = [];
		this.selectedPermission = [];
	}

  	onCheckboxKeydown(event: KeyboardEvent, permissionName: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			this.handlePermission(permissionName, { target: { checked: !this.selectedPermission.includes(permissionName) } } as any);
		}

		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
			event.preventDefault();
			const checkboxes = document.querySelectorAll<HTMLInputElement>('.form-check-input');
			const currentIndex = Array.from(checkboxes).findIndex(cb => cb === event.target);

			if (currentIndex >= 0) {
				let nextIndex = currentIndex;

				if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
					nextIndex = Math.min(currentIndex + 1, checkboxes.length - 1);
				} else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
					nextIndex = Math.max(currentIndex - 1, 0);
				}

				checkboxes[nextIndex]?.focus();
			}
		}
	}
  // filterMenuByModule(selectedModule: any) {
  //   if (!selectedModule) {
  //     this.menuList = [];
  //     this.selectedPermission = [];
  //     return;
  //   }

  //   this.settingService.getMenuByModuleId(selectedModule.ModuleMasterSid).subscribe(
  //     (resp: any) => this.menuList = resp || [],
  //     (err) => console.error('Error loading menus', err)
  //   );
  // }


filterMenuByModule(selectedModules: any) {
  console.log('Selected modules:', selectedModules);

  // Case 1: If nothing selected
  if (!selectedModules || selectedModules.length === 0) {
    this.menuList = [];
    this.selectedPermission = [];
    this.clearMenuPermissions();
    this.roleMenuForm.patchValue({ MenuMasterSid: null });
    return;
  }

  // ✅ Extract only the IDs
  const moduleIds = selectedModules.map((m: any) => m.ModuleMasterSid);

  console.log('moduleIds:', moduleIds);

  // ✅ Send to backend in correct structure
  this.settingService.getMenusByModuleIds( moduleIds ).subscribe(
    (resp: any) => {
      this.menuList = resp || [];
      const currentMenuSid = this.roleMenuForm.get('MenuMasterSid')?.value;
      if (currentMenuSid && !this.menuList.some(m => m.MenuMasterSid === currentMenuSid)) {
        this.roleMenuForm.patchValue({ MenuMasterSid: null });
        this.clearMenuPermissions();
      }
    },
    (err) => console.error('Error loading menus', err)
  );
}



  getMenuPermissions(menu: any) {
    this.settingService.getMenuPermissions(menu.MenuMasterSid).subscribe(
      (resp: any) => {
        this.menuPermissionList = resp || [];
        this.menuPermissionsFetched = this.menuPermissionList.length > 0;
      },
      (err) => console.error('Error loading permissions', err)
    );
  }

  handlePermission(permissionName: string, event: any) {
    const checked = event.target.checked;
    if (checked) this.selectedPermission.push(permissionName);
    else this.selectedPermission = this.selectedPermission.filter(p => p !== permissionName);
    this.updatePermissionControl();
  }

  updatePermissionControl() {
    const permissions: any = {};
    this.menuPermissionList.forEach((p) => {
      permissions[p.permissionName] = this.selectedPermission.includes(p.permissionName)
        ? 'isTrue' : 'isFalse';
    });
    this.roleMenuForm.get('MenuPermissions')?.setValue(permissions, { emitEvent: false });
  }

  onSubmit() {
    if (this.roleMenuForm.invalid) {
      this.appSettingService.showWarning('Please fill all required fields');
      this.roleMenuForm.markAllAsTouched();
      return;
    }

    this.updatePermissionControl();
    const formValue = this.roleMenuForm.value;
    const currentUserEmail = this.userData?.UserEmail || this.appSettingService.userSettingSource.value['userEmail'];

    const payload = {
      ...formValue,
      status: formValue.status === 'Active' ? 'A' : 'S',
      InsertRole: formValue.InsertRole ===true ? 'Y' : 'N',
      ViewRole: formValue.ViewRole===true ? 'Y' : 'N',
      UpdateRole: formValue.UpdateRole===true ? 'Y' : 'N',
      DeleteRole: formValue.DeleteRole=== true ? 'Y' : 'N',
      ...(this.isEditMode ? { updatedBy: currentUserEmail } : { createdBy: currentUserEmail })
    };

    if (this.isEditMode) {
      this.settingService.updateRoleMenuById(this.RoleMenuMasterSid, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['/settings/rolemenu']);
          } else this.appSettingService.showError(resp.message);
        },
        (error) => console.error('Update failed', error)
      );
    } else {
      this.settingService.createNewRoleMenu(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['/settings/rolemenu']);
          } else this.appSettingService.showError(resp.message);
        },
        (error) => console.error('Create failed', error)
      );
    }
  }

  loadRoleMenuData(data: any) {
    const ourModule = this.moduleList.find(m => m.ModuleName === data.Module);
    this.filterMenuByModule(ourModule);
    this.getMenuPermissions(data);

    let permissions = data.MenuPermissions;
    if (typeof permissions === 'string') {
      try { permissions = JSON.parse(permissions); } catch { permissions = {}; }
    }

    this.roleMenuForm.patchValue({
      Module: data.Module,
      MenuMasterSid: data.MenuMasterSid,
      RoleMasterSid: data.RoleMasterSid,
      Remarks: data.Remarks,
      status: data.status === 'A' ? 'Active' : 'Suspended',
    });

    this.selectedPermission = Object.entries(permissions || {})
      .filter(([k, v]) => v === 'isTrue')
      .map(([k]) => k);
  }

  	resetForm(): void {
		// If editing an existing role menu, reload the form data without reopening modal
		if (this.isEditMode && this.RoleMenuMasterSid && this.roleMenuData) {
			this.loadRoleMenuData(this.roleMenuData);
			return;
		}

		// Create-mode: reset form to sensible defaults
		this.roleMenuForm.reset({
			Module: null,
			MenuMasterSid: null,
			RoleMasterSid: null,
			Remarks: '',
			MenuPermissions: {},
			status: 'Active',
			InsertRole: true,
			ViewRole: true,
			UpdateRole: true,
			DeleteRole: false
		});

		// Clear related data
		this.menuList = [];
		this.selectedPermission = [];
		this.menuPermissionList = [];
		this.menuPermissionsFetched = false;

		// Clear form validation states
		this.roleMenuForm.markAsUntouched();
		this.roleMenuForm.updateValueAndValidity();
	}

  showInfo() {
      if (!this.roleMenuData) return;
      const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
      modalRef.componentInstance.item = this.roleMenuData;
      modalRef.componentInstance.idLabel = 'Role Menu Id';
      modalRef.componentInstance.idValue = this.roleMenuData?.RoleMenuMasterSid;
    }
  navigateBack() {
    this.router.navigate(['/settings/rolemenu']);
  }
}
