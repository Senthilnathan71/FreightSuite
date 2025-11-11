// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { NgSelectModule } from '@ng-select/ng-select';
// import { ActivatedRoute, Router } from '@angular/router';
// import { SettingsService } from '../../settings.service';
// import { AppSettingsService } from 'src/app/core/services/app-settings.service';
// import { NgxSpinnerService } from 'ngx-spinner';
// import { forkJoin } from 'rxjs';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { DetailsComponent } from 'src/app/component/details/details.component';
// @Component({
//   selector: 'app-rolemenu-entry',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
//   templateUrl: './rolemenu-entry.component.html',
//   styleUrls: ['./rolemenu-entry.component.scss'],
// })
// export class RolemenuEntryComponent implements OnInit {
//   roleMenuForm!: FormGroup;
//   moduleList: any[] = [];
//   menuList: any[] = [];
//   roleList: any[] = [];
//   menuPermissionList: any[] = [];
//   selectedPermission: string[] = [];
//   menuPermissionsFetched = false;
//   isEditMode = false;

//   RoleMenuMasterSid: number;
//   roleMenuData: any;
//   currentCompany: any;
//   currentBranch: any;
//   userData: any;
//   selectedModuleMenuList: any
//   roleMenuMasterSid: number
//   modeOfStatus = [
//     { value: 'A', name: "Active" },
//     { value: 'S', name: "Suspended" },
//   ];

//   constructor(
//     private fb: FormBuilder,
//     private router: Router,
//     private settingService: SettingsService,
//     private appSettingService: AppSettingsService,
//     private spinner: NgxSpinnerService,
//     private modalService: NgbModal,
//     private route: ActivatedRoute
//   ) { }

//   ngOnInit(): void {
//     this.initRoleMenuForm();
//     this.loadDropdownData();

//     // decrypt company and branch
//     this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
//     this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
//     const userProfile = this.appSettingService.getDecryptedUserProfile();
//     if (userProfile) this.userData = userProfile;


//     this.route.paramMap.subscribe((params) => {
//       const id = params.get('id');
//       console.log(id)
//       if (id) {
//         this.isEditMode = true;
//         this.roleMenuMasterSid = Number(id)
//         // Wait until dropdowns are ready
//       const interval = setInterval(() => {
//         if (this.moduleList.length > 0 && this.roleList.length > 0) {
//           clearInterval(interval);
//           this.loadRoleMenuData();
//         }
//       }, 200);
//       }})
//     }

//   initRoleMenuForm() {
//     this.roleMenuForm = this.fb.group({
//       Module: [, [Validators.required]],
//       MenuMasterSid: [, [Validators.required]],
//       RoleMasterSid: [, [Validators.required]],
//       DisplayName: [''],
//       Remarks: [''],
//       status: ['Active'],
//       InsertRole: [false],
//       ViewRole: [false],
//       UpdateRole: [false],
//       DeleteRole: [false]
//     });
//   }

//   loadDropdownData() {
//     const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
//     forkJoin({
//       modules: this.settingService.getAllModule(),
//       roles: this.settingService.getAllRole(CompanyMasterSid)
//     }).subscribe(({ modules, roles }) => {
//       this.moduleList = modules.data;
//       this.roleList = roles.data;
//     });
//   }

//   clearMenuPermissions() {
//     this.menuPermissionsFetched = false;
//     this.roleMenuForm.get('MenuPermissions').reset({});
//     this.menuPermissionList = [];
//     this.selectedPermission = [];
//   }


//   filterMenuByModule(selectedModule: any) {
//     if (!selectedModule) {
//       this.menuList = [];
//       this.selectedPermission = [];
//       return;
//     }

//     this.settingService.getMenuByModuleId(selectedModule.ModuleMasterSid).subscribe(
//       (resp: any) => this.menuList = resp || [],
//       (err) => console.error('Error loading menus', err)
//     );
//   }



//   onSubmit() {
//     if (this.roleMenuForm.invalid) {
//       this.appSettingService.showWarning('Please fill all required fields');
//       this.roleMenuForm.markAllAsTouched();
//       return;
//     }

//     const formValue = this.roleMenuForm.value;
//     const currentUserEmail = this.userData?.UserEmail || this.appSettingService.userSettingSource.value['userEmail'];

//     const payload = {
//       ...formValue,
//       status: formValue.status === 'Active' ? 'A' : 'S',
//       InsertRole: formValue.InsertRole === true ? 'Y' : 'N',
//       ViewRole: formValue.ViewRole === true ? 'Y' : 'N',
//       UpdateRole: formValue.UpdateRole === true ? 'Y' : 'N',
//       DeleteRole: formValue.DeleteRole === true ? 'Y' : 'N',
//       ...(this.isEditMode ? { updatedBy: currentUserEmail } : { createdBy: currentUserEmail })
//     };

//     console.log(payload, 'payload')

//     if (this.isEditMode) {
//       this.settingService.updateRoleMenuById(this.RoleMenuMasterSid, payload).subscribe(
//         (resp: any) => {
//           if (resp.status) {
//             this.appSettingService.showSuccess(resp.message);
//             this.router.navigate(['/settings/rolemenu']);
//           } else this.appSettingService.showError(resp.message);
//         },
//         (error) => console.error('Update failed', error)
//       );
//     } else {
//       this.settingService.createNewRoleMenu(payload).subscribe(
//         (resp: any) => {
//           if (resp.status) {
//             this.appSettingService.showSuccess(resp.message);
//             this.router.navigate(['/settings/rolemenu']);
//           } else this.appSettingService.showError(resp.message);
//         },
//         (error) => console.error('Create failed', error)
//       );
//     }
//   }
// loadRoleMenuData() {
//   this.settingService.getRoleMenuById(this.roleMenuMasterSid).subscribe({
//     next: (resp) => {
//       this.roleMenuData = resp.data;
//       console.log(this.roleMenuData, 'this.roleMenuData');

//       // ✅ Filter menu and permissions
// const selectedModule = this.moduleList.find(
//   item => item.ModuleName === this.roleMenuData.Module
// );

// if (selectedModule) {
//   this.filterMenuByModule(selectedModule);
// }      
//       this.roleMenuForm.patchValue({
//         Module: this.roleMenuData.Module,
//         MenuMasterSid: this.roleMenuData.MenuMasterSid,
//         RoleMasterSid: this.roleMenuData.RoleMasterSid,
//         DisplayName: this.roleMenuData.DisplayName,
//         Remarks: this.roleMenuData.Remarks,
//         status: this.roleMenuData.status === 'A' ? 'Active' : 'Suspended',
//         InsertRole: this.roleMenuData.InsertRole === 'Y',
//         ViewRole: this.roleMenuData.ViewRole === 'Y',
//         UpdateRole: this.roleMenuData.UpdateRole === 'Y',
//         DeleteRole: this.roleMenuData.DeleteRole === 'Y',
//       });

//     },
//     error: (err) => {
//       console.error('Failed to load role menu data:', err);
//     },
//   });
// }


//   resetForm(): void {
//     // If editing an existing role menu, reload the form data without reopening modal
//     if (this.isEditMode && this.RoleMenuMasterSid && this.roleMenuData) {
//       this.loadRoleMenuData();
//       return;
//     }

//     // Create-mode: reset form to sensible defaults
//     this.roleMenuForm.reset({
//       Module: null,
//       MenuMasterSid: null,
//       RoleMasterSid: null,
//       Remarks: '',
//       MenuPermissions: {},
//       status: 'Active',
//       InsertRole: true,
//       ViewRole: true,
//       UpdateRole: true,
//       DeleteRole: false
//     });

//     // Clear related data
//     this.menuList = [];
//     this.selectedPermission = [];
//     this.menuPermissionList = [];
//     this.menuPermissionsFetched = false;

//     // Clear form validation states
//     this.roleMenuForm.markAsUntouched();
//     this.roleMenuForm.updateValueAndValidity();
//   }

//   showInfo() {
//     if (!this.roleMenuData) return;
//     const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
//     modalRef.componentInstance.item = this.roleMenuData;
//     modalRef.componentInstance.idLabel = 'Role Menu Id';
//     modalRef.componentInstance.idValue = this.roleMenuData?.RoleMenuMasterSid;
//   }
//   navigateBack() {
//     this.router.navigate(['/settings/rolemenu']);
//   }
// }

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router } from '@angular/router';
import { SettingsService } from '../../settings.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { forkJoin } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';

@Component({
  selector: 'app-rolemenu-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './rolemenu-entry.component.html',
  styleUrls: ['./rolemenu-entry.component.scss'],
})
export class RolemenuEntryComponent implements OnInit {
  roleMenuForm!: FormGroup;
  moduleList: any[] = [];
  menuList: any[] = [];
  roleList: any[] = [];
  dynamicMenuList: any[] = [];
  isEditMode = false;

  roleMenuHeaderSid!: number;
  roleMenuData: any;
  currentCompany: any;
  userData: any;

  modeOfStatus = [
    { value: 'A', name: 'Active' },
    { value: 'S', name: 'Suspended' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private settingService: SettingsService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownData();

    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) this.userData = userProfile;

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.roleMenuHeaderSid = Number(id);
        const interval = setInterval(() => {
          if (this.moduleList.length && this.roleList.length) {
            clearInterval(interval);
            this.loadRoleMenuData();
          }
        }, 200);
      }
    });
  }

  initForm() {
    this.roleMenuForm = this.fb.group({
      RoleMasterSid: [null, Validators.required],
      Modules: [[], Validators.required],
      Remarks: [''],
      status: ['A'],
    });
  }

  loadDropdownData() {
    const companySid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      modules: this.settingService.getAllModule(),
      roles: this.settingService.getAllRole(companySid),
    }).subscribe(({ modules, roles }) => {
      this.moduleList = modules.data;
      this.roleList = roles.data;
    });
  }

    // Called on multi-select module change
    onModuleChange(selectedModules: any[]) {
      if (!selectedModules?.length) {
        this.dynamicMenuList = [];
        return;
      }

      this.dynamicMenuList = []; // reset

      selectedModules.forEach((module) => {
        this.settingService.getMenuByModuleId(module.ModuleMasterSid).subscribe({
          next: (res: any) => {
            const menus = res.map((m: any) => ({
              ...m,
              DisplayName: m.MenuName,
              InsertRole: false,
              UpdateRole: false,
              ViewRole: false,
              DeleteRole: false,
              ModuleName: module.ModuleName,
            }));
            this.dynamicMenuList.push(...menus);
          },
        });
      });
    }

    // ✅ Load data for Edit Mode
    loadRoleMenuData() {
      this.settingService.getRoleMenuById(this.roleMenuHeaderSid).subscribe({
        next: (resp) => {
          this.roleMenuData = resp.data;

          // Extract modules from existing RoleMenuDetail
          const existingModules = [
            ...new Set(
              this.roleMenuData.RoleMenuDetail.flatMap((d: any) =>
                Object.keys(d.ModuleAndMenus)
              )
            ),
          ];

          const selectedModules = this.moduleList.filter((m) =>
            existingModules.includes(m.ModuleName)
          );

          this.roleMenuForm.patchValue({
            RoleMasterSid: this.roleMenuData.RoleMasterSid,
            Modules: selectedModules,
            Remarks: this.roleMenuData.Remarks,
            status: this.roleMenuData.status === 'A' ? 'A' : 'S',
          });

          // Build table rows
          this.dynamicMenuList = this.roleMenuData.RoleMenuDetail.map((d: any) => {
            const moduleName = Object.keys(d.ModuleAndMenus)[0];
            const menuName = d.ModuleAndMenus[moduleName][0];
            return {
              MenuMasterSid: d.MenuMasterSid,
              DisplayName: d.DisplayName,
              MenuName: menuName,
              ModuleName: moduleName,
              InsertRole: d.InsertRole === 'Y',
              UpdateRole: d.UpdateRole === 'Y',
              ViewRole: d.ViewRole === 'Y',
              DeleteRole: d.DeleteRole === 'Y',
            };
          });
        },
        error: (err) => console.error('Failed to load role menu data:', err),
      });
    }

  // ✅ Prepare payload for Create / Update
  preparePayload(isUpdate: boolean) {
    const formValue = this.roleMenuForm.value;
    const userEmail =
      this.userData?.UserEmail ||
      this.appSettingService.userSettingSource.value['userEmail'];

    return {
      RoleMasterSid: formValue.RoleMasterSid,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      Remarks: formValue.Remarks,
      status: formValue.status,
      [isUpdate ? 'updatedBy' : 'createdBy']: userEmail,
      details: this.dynamicMenuList.map((menu) => ({
        MenuMasterSid: menu.MenuMasterSid,
        DisplayName: menu.DisplayName,
        ModuleAndMenus: {
          [menu.ModuleName]: [menu.MenuName],
        },
        InsertRole: menu.InsertRole ? 'Y' : 'N',
        UpdateRole: menu.UpdateRole ? 'Y' : 'N',
        ViewRole: menu.ViewRole ? 'Y' : 'N',
        DeleteRole: menu.DeleteRole ? 'Y' : 'N',
      })),
    };
  }

  onSubmit() {
    if (this.roleMenuForm.invalid) {
      this.appSettingService.showWarning('Please fill all required fields');
      this.roleMenuForm.markAllAsTouched();
      return;
    }

    const payload = this.preparePayload(this.isEditMode);

    console.log('Final Payload:', payload);

    if (this.isEditMode) {
      this.settingService
        .updateRoleMenuById(this.roleMenuHeaderSid, payload)
        .subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['/settings/rolemenu']);
          },
          error: (err) => {
            console.error('Update failed', err);
            this.appSettingService.showError('Failed to update role menu');
          },
        });
    } else {
      this.settingService.createNewRoleMenu(payload).subscribe({
        next: (resp: any) => {
          this.appSettingService.showSuccess(resp.message);
          this.router.navigate(['/settings/rolemenu']);
        },
        error: (err) => {
          console.error('Create failed', err);
          this.appSettingService.showError('Failed to create role menu');
        },
      });
    }
  }

  navigateBack() {
    this.router.navigate(['/settings/rolemenu']);
  }

  resetForm(): void {
    if (this.isEditMode && this.roleMenuHeaderSid && this.roleMenuData) {
      // 🟡 If editing → reload saved data instead of clearing
      this.loadRoleMenuData();
      this.appSettingService.showInfo('Form restored to saved state');
      return;
    }

    // 🟢 If creating new → clear all values
    this.roleMenuForm.reset({
      RoleMasterSid: null,
      Modules: [],
      Remarks: '',
      status: 'A',
    });

    // clear dynamic menu table
    this.dynamicMenuList = [];

    // clear UI validation states
    this.roleMenuForm.markAsPristine();
    this.roleMenuForm.markAsUntouched();
    this.roleMenuForm.updateValueAndValidity();

    this.appSettingService.showInfo('Form has been reset');
  }

  ngOnDestroy() { }
}
