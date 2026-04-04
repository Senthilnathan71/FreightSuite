import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router } from '@angular/router';
import { SettingsService } from '../../settings.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { forkJoin } from 'rxjs';
import { FeatherModule } from 'angular-feather';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { CommonEntryHeaderComponent } from 'src/app/shared/components/common-entry-header/common-entry-header.component';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PaginationConfig } from 'src/app/shared/interfaces/pagination.interface';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PrintPermissionModalComponent } from '../print-permission-modal/print-permission-modal.component';
// PrintPermissionModalComponent is opened via NgbModal — not used directly in template

@Component({
  selector: 'app-rolemenu-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    FeatherModule,
    NgxSpinnerModule,
    MultiSelectComponent,
    CommonEntryHeaderComponent,
    CommonPaginationComponent
  ],
  templateUrl: './rolemenu-entry.component.html',
  styleUrls: ['./rolemenu-entry.component.scss'],
})
export class RolemenuEntryComponent implements OnInit, OnDestroy {
  roleMenuForm!: FormGroup;
  moduleList: any[] = [];
  roleList: any[] = [];
  dynamicMenuList: any[] = [];
  isEditMode = false;
  roleMenuHeaderSid!: number;
  currentCompany: any;
  userData: any;
  isLoading = false;
  moduleWithMenuMap: Map<number, any[]> = new Map<number, any[]>();
  originalMenuList: any[] = [];
  dynamicMenuPage = 1;
  dynamicMenuPageSize = 10;
  dynamicMenuPaginationConfig: PaginationConfig = {
    page: 1,
    pageSize: 10,
    totalRecords: 0,
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3,
  };

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
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    // Get current company and user data
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) this.userData = userProfile;

    // Initialize form
    this.initForm();

    // Load dropdown data first
    this.loadDropdownData();

    // Check if edit mode
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.roleMenuHeaderSid = Number(id);
      }
    });
  }

  initForm(): void {
    this.roleMenuForm = this.fb.group({
      RoleMasterSid: [null, Validators.required],
      Modules: [[], Validators.required],
      Remarks: [''],
      status: ['Active', Validators.required],
    });
  }

  loadDropdownData(): void {
    const companySid = this.currentCompany?.CompanyMasterSid;
    if (!companySid) {
      this.appSettingService.showError('Company information not found');
      return;
    }

    this.spinner.show();
    this.isLoading = true;

    forkJoin({
      modules: this.settingService.getAllModule(),
      roles: this.settingService.getAllRole(Number(companySid)),
      moduleWithMenus: this.settingService.getAllModulesWithMenus(),
    }).subscribe({
      next: ({ modules, roles, moduleWithMenus }) => {
        this.moduleList = (modules.data || []).sort((a, b) => {
          return a.ModuleName.localeCompare(b.ModuleName);
        });
        this.roleList = roles.data || [];
        const allMenuWithModules = moduleWithMenus.data;
        Object.entries(allMenuWithModules).forEach(([key, value]) => {
          const moduleId = Number(key);

          if (this.moduleWithMenuMap.has(moduleId)) {
            const prev = this.moduleWithMenuMap.get(moduleId) || [];
            this.moduleWithMenuMap.set(moduleId, [...prev, ...value]);
          } else {
            this.moduleWithMenuMap.set(moduleId, [...value]);
          }
        });

        console.log("Module vs Menu Map", this.moduleWithMenuMap);

        // Load edit mode data if applicable
        if (this.isEditMode && this.roleMenuHeaderSid) {
          this.loadRoleMenuData();
        }

        this.spinner.hide();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load dropdown data:', err);
        this.appSettingService.showError('Failed to load initial data');
        this.spinner.hide();
        this.isLoading = false;
      },
    });
  }

  // Called when module selection changes
  // onModuleChange(selectedModules: any[]): void {
  //   console.log("Module Change",selectedModules);
  //   if (!selectedModules?.length) {
  //     this.dynamicMenuList = [];
  //     return;
  //   }

  //   const moduleIds = selectedModules

  //   // Fetch menus for all selected modules
  //   const selectedModuleWithMenus = moduleIds.map(id => {
  //     console.log("Module Id",id);
  //     console.log("Menu Map Value",this.moduleWithMenuMap.get(id));
  //     return this.moduleWithMenuMap.has(id) ? this.moduleWithMenuMap.get(id) : []
  //   });

  //   this.dynamicMenuList = [];
  //   selectedModuleWithMenus.forEach((moduleWithMenu, index) => {
  //     const currentModuleId = selectedModules[index];
  //     const currentModule = this.moduleList.find(m => m.ModuleMasterSid === currentModuleId);
  //     const menus = moduleWithMenu || [];

  //     menus.forEach((menu: any) => {
  //       // Check if menu already exists (avoid duplicates)
  //       const exists = this.dynamicMenuList.some(
  //         m => m.MenuMasterSid === menu.MenuMasterSid
  //       );

  //       if (!exists) {
  //         // Process menu permissions
  //         const processedMenu = this.processMenuPermissions(menu, currentModule);
  //         this.dynamicMenuList.push(processedMenu);
  //       }
  //     });
  //   });

  //   // Sort by ModuleName then MenuName
  //   this.dynamicMenuList.sort((a, b) => {
  //     const moduleCompare = String(a.ModuleName).localeCompare(String(b.ModuleName));
  //     if (moduleCompare !== 0) return moduleCompare;
  //     return String(a.MenuName).localeCompare(String(b.MenuName));
  //   });
  // }

  onModuleChange(selectedModules: any[]): void {
    if (!selectedModules?.length) {
      this.dynamicMenuList = [];
      this.updateDynamicMenuPagination();
      return;
    }

    const moduleIds = selectedModules;
    const menusFromSelection: any[] = [];

    moduleIds.forEach(id => {
      const menus = this.moduleWithMenuMap.get(id) || [];
      menus.forEach((menu: any) => {
        const exists = menusFromSelection.some(m => m.MenuMasterSid === menu.MenuMasterSid);
        if (!exists) menusFromSelection.push(menu);
      });
    });

    const finalList: any[] = [];

    menusFromSelection.forEach(menu => {
      // find existing saved menu in edit mode
      const saved = this.originalMenuList.find(
        o => o.MenuMasterSid === menu.MenuMasterSid
      );

      const module = this.moduleList.find(m => m.ModuleMasterSid === menu.ModuleMasterSid);

      let processed = this.processMenuPermissions(menu, module);

      // 💡 restore old permissions for remaining modules
      if (this.isEditMode && saved) {
        processed.InsertRole = saved.InsertRole === "Y";
        processed.UpdateRole = saved.UpdateRole === "Y";
        processed.ViewRole = saved.ViewRole === "Y";
        processed.DeleteRole = saved.DeleteRole === "Y";
      }

      finalList.push(processed);
    });

    this.dynamicMenuList = finalList.sort((a, b) => {
      const m = a.ModuleName.localeCompare(b.ModuleName);
      return m !== 0 ? m : a.MenuName.localeCompare(b.MenuName);
    });
    this.updateDynamicMenuPagination();
  }


  private processMenuPermissions(menu: any, module: any): any {

    const hasPermission = (permissionCode: string) => {
      const code = (permissionCode || '').toLowerCase();
      return (menu.menuPermission || []).includes(code);
    }

    const processedMenu: any = {
      RoleMenuDetailSid: menu.RoleMenuDetailSid || null,
      MenuMasterSid: menu.MenuMasterSid,
      MenuName: menu.MenuName,
      DisplayName: menu.DisplayName || menu.MenuName,
      ModuleName: module.ModuleName,
      ModuleMasterSid: module.ModuleMasterSid,
      InsertRole: false,
      UpdateRole: false,
      ViewRole: false,
      DeleteRole: false,
      disableInsert: true,
      disableUpdate: true,
      disableView: true,
      disableDelete: true,
    };

    // Check menuPermission array for existing permissions
    if (Array.isArray(menu.menuPermission) && menu.menuPermission.length > 0) {
      if (hasPermission('add')) {
        if (!this.isEditMode) {
          processedMenu.InsertRole = true;
        } else {
          processedMenu.InsertRole = menu.InsertRole === "Y";
        }
        processedMenu.disableInsert = false;
      }
      if (hasPermission('edit')) {
        if (!this.isEditMode) {
          processedMenu.UpdateRole = true;
        } else {
          processedMenu.UpdateRole = menu.UpdateRole === "Y";
        }
        processedMenu.disableUpdate = false;
      }
      if (hasPermission('view')) {
        if (!this.isEditMode) {
          processedMenu.ViewRole = true;
        } else {
          processedMenu.ViewRole = menu.ViewRole === "Y";
        }
        processedMenu.disableView = false;
      }
      if (hasPermission('delete')) {
        if (!this.isEditMode) {
          processedMenu.DeleteRole = true;
        } else {
          processedMenu.DeleteRole = menu.DeleteRole === "Y";
        }
        processedMenu.disableDelete = false;
      }
    }

    return processedMenu;
  }

  loadRoleMenuData(): void {
    if (!this.roleMenuHeaderSid || !this.currentCompany?.CompanyMasterSid) {
      return;
    }

    this.spinner.show();
    this.settingService.getRoleMenuById(
      this.currentCompany.CompanyMasterSid,
      this.roleMenuHeaderSid
    ).subscribe({
      next: (resp) => {
        const data = resp.data;
        this.originalMenuList = JSON.parse(JSON.stringify(data.roleMenuDetails || []));

        // Extract unique modules from roleMenuDetails
        const moduleSet = new Set<number>();
        const menuMap = new Map<number, any>();

        data.roleMenuDetails?.forEach((detail: any) => {
          moduleSet.add(detail.ModuleMasterSid);
          menuMap.set(detail.MenuMasterSid, detail);
        });

        // Find selected module objects
        const selectedModules = Array.from(moduleSet);

        // Patch form values
        this.roleMenuForm.patchValue({
          RoleMasterSid: data.RoleMasterSid,
          Modules: selectedModules,
          Remarks: data.Remarks || '',
          status: data.status === "A" ? "Active" : "Suspended",
        });

        // Build dynamic menu list from saved data
        this.dynamicMenuList = (data.roleMenuDetails || []).map((detail: any) => {
          const result = this.processMenuPermissions(detail, {
            ModuleMasterSid: detail.ModuleMasterSid,
            ModuleName: detail.ModuleName
          })
          console.log("Processing Detail", {
            detail: detail,
            result: result
          })
          return result;
        });
        console.log("Final Dynamic Menu List", this.dynamicMenuList);

        // Sort by ModuleName then MenuName
        this.dynamicMenuList.sort((a, b) => {
          const moduleCompare = a.ModuleName.localeCompare(b.ModuleName);
          if (moduleCompare !== 0) return moduleCompare;
          return a.MenuName.localeCompare(b.MenuName);
        });

        
        // 🆕 Auto-mark deleted menus at load time
        const validMenuIds = new Set<number>();

        // Collect all valid menu IDs from moduleWithMenuMap
        this.moduleWithMenuMap.forEach((menus) => {
          menus.forEach((m: any) => validMenuIds.add(m.MenuMasterSid));
        });

        this.originalMenuList.forEach(item => {
          if (!validMenuIds.has(item.MenuMasterSid)) {
            this.dynamicMenuList = this.dynamicMenuList.filter(m => m.MenuMasterSid !== item.MenuMasterSid);
            console.log("Deleted Menu", item.MenuName);
          }
        });

        this.updateDynamicMenuPagination();

        this.spinner.hide();
      },
      error: (err) => {
        console.error('Failed to load role menu data:', err);
        this.appSettingService.showError('Failed to load role menu data');
        this.spinner.hide();
      },
    });
  }

  onSubmit(): void {
    // Validate form
    if (this.roleMenuForm.invalid) {
      this.appSettingService.showWarning('Please fill all required fields');
      this.roleMenuForm.markAllAsTouched();
      return;
    }

    // Validate at least one menu exists
    if (this.dynamicMenuList.length === 0) {
      this.appSettingService.showWarning('Please select at least one module with menus');
      return;
    }

    // Validate at least one permission is selected
    const hasPermission = this.dynamicMenuList.some(menu =>
      menu.InsertRole || menu.UpdateRole || menu.ViewRole || menu.DeleteRole
    );

    if (!hasPermission) {
      this.appSettingService.showWarning('Please select at least one permission for at least one menu');
      return;
    }

    const payload = this.preparePayload();
    console.log('Submitting payload:', payload);

    this.spinner.show();

    if (this.isEditMode) {
      this.settingService.updateRoleMenu(payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message || 'Role menu updated successfully');
            this.spinner.hide();
            this.router.navigate(['/settings/rolemenu']);
          } else {
            this.appSettingService.showError(resp.message || 'Failed to update role menu');
            this.spinner.hide();
          }
        },
        error: (err) => {
          console.error('Update failed:', err);
          this.appSettingService.showError(err.error?.message || 'Failed to update role menu');
          this.spinner.hide();
        },
      });
    } else {
      this.settingService.createNewRoleMenu(payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message || 'Role menu created successfully');
            this.spinner.hide();
            this.router.navigate(['/settings/rolemenu']);
          } else {
            this.appSettingService.showError(resp.message || 'Failed to create role menu');
            this.spinner.hide();
          }
        },
        error: (err) => {
          console.error('Create failed:', err);
          this.appSettingService.showError(err.error?.message || 'Failed to create role menu');
          this.spinner.hide();
        },
      });
    }
  }

  private preparePayload(): any {
    const formValue = this.roleMenuForm.value;

    const modifiedMenus = this.getModifiedMenus();
    const deletedMenus = this.getDeletedMenus();

    const finalMenus = [
      ...modifiedMenus.map(m => ({
        ...(m.RoleMenuDetailSid && { RoleMenuDetailSid: m.RoleMenuDetailSid }),
        MenuMasterSid: m.MenuMasterSid,
        DisplayName: m.DisplayName || m.MenuName,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        InsertRole: m.InsertRole ? 'Y' : 'N',
        UpdateRole: m.UpdateRole ? 'Y' : 'N',
        ViewRole: m.ViewRole ? 'Y' : 'N',
        DeleteRole: m.DeleteRole ? 'Y' : 'N',
        isDeleted: false
      })),
      ...deletedMenus
    ];

    return {
      RoleMasterSid: formValue.RoleMasterSid,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      Remarks: formValue.Remarks || '',
      status: formValue.status === 'Active' ? 'A' : 'S',
      RoleMenuDetail: finalMenus,
      ...(this.isEditMode ? {
        RoleMenuHeaderSid: this.roleMenuHeaderSid,
        updatedBy: this.userData.userEmail
      } : {
        createdBy: this.userData.userEmail
      })
    };
  }


  resetForm(): void {
    if (this.isEditMode && this.roleMenuHeaderSid) {
      // In edit mode, restore to saved state
      this.loadRoleMenuData();
      this.appSettingService.showInfo('Form restored to saved state');
    } else {
      // In create mode, clear everything
      this.roleMenuForm.reset({
        RoleMasterSid: null,
        Modules: [],
        Remarks: '',
        status: 'Active',
      });
      this.dynamicMenuList = [];
      this.updateDynamicMenuPagination();
      this.roleMenuForm.markAsPristine();
      this.roleMenuForm.markAsUntouched();
      this.appSettingService.showInfo('Form has been reset');
    }
  }

  private getModifiedMenus(): any[] {
    const modified: any[] = [];

    this.dynamicMenuList.forEach(newItem => {
      const oldItem = this.originalMenuList.find(
        o => o.MenuMasterSid === newItem.MenuMasterSid
      );

      if (!oldItem) {
        // New menu added
        modified.push(newItem);
        console.log("New Item", newItem);
        return;
      }

      const toBool = (val: any) => val === 'Y' || val === true;

      const changed =
        oldItem.MenuDisplayName !== newItem.DisplayName ||
        toBool(oldItem.InsertRole) !== toBool(newItem.InsertRole) ||
        toBool(oldItem.UpdateRole) !== toBool(newItem.UpdateRole) ||
        toBool(oldItem.ViewRole) !== toBool(newItem.ViewRole) ||
        toBool(oldItem.DeleteRole) !== toBool(newItem.DeleteRole);


      if (changed) {
        console.log("Changed Item", {
          oldItem,
          newItem
        });
        modified.push(newItem);
      }
    });

    return modified;
  }

  private getDeletedMenus(): any[] {
    return this.originalMenuList.filter(oldItem =>
      !this.dynamicMenuList.some(newItem =>
        newItem.MenuMasterSid === oldItem.MenuMasterSid
      )
    ).map(del => ({
      RoleMenuDetailSid: del.RoleMenuDetailSid,
      MenuMasterSid: del.MenuMasterSid,
      isDeleted: true
    }));
  }



  navigateBack(): void {
    this.router.navigate(['/settings/rolemenu']);
  }

  get paginatedDynamicMenuList(): any[] {
    const startIndex = (this.dynamicMenuPage - 1) * this.dynamicMenuPageSize;
    const endIndex = startIndex + this.dynamicMenuPageSize;
    return this.dynamicMenuList.slice(startIndex, endIndex);
  }

  onDynamicMenuPageChange(page: number): void {
    this.dynamicMenuPage = page;
    this.updateDynamicMenuPagination(false);
  }

  onDynamicMenuPageSizeChange(pageSize: number): void {
    this.dynamicMenuPageSize = Number(pageSize);
    this.dynamicMenuPage = 1;
    this.updateDynamicMenuPagination(false);
  }

  private updateDynamicMenuPagination(resetPage: boolean = true): void {
    if (resetPage) {
      this.dynamicMenuPage = 1;
    }

    const totalPages = Math.max(
      1,
      Math.ceil(this.dynamicMenuList.length / this.dynamicMenuPageSize),
    );

    if (this.dynamicMenuPage > totalPages) {
      this.dynamicMenuPage = totalPages;
    }

    this.dynamicMenuPaginationConfig = {
      ...this.dynamicMenuPaginationConfig,
      page: this.dynamicMenuPage,
      pageSize: this.dynamicMenuPageSize,
      totalRecords: this.dynamicMenuList.length,
    };
  }

  openPrintModal(menu: any): void {
    if (!menu.RoleMenuDetailSid) {
      this.appSettingService.showWarning('Please save the Role Menu before managing print permissions.');
      return;
    }
    const modalRef = this.modalService.open(PrintPermissionModalComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.menuItem = {
      RoleMenuDetailSid: menu.RoleMenuDetailSid,
      RoleMenuHeaderSid: this.roleMenuHeaderSid,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      MenuMasterSid: menu.MenuMasterSid,
      MenuName: menu.MenuName
    };
  }

  ngOnDestroy(): void {
    this.spinner.hide();
  }

  // Add these methods after your existing methods in the component class

// Check if all Add permissions are selected (excluding disabled ones)
isAllAddSelected(): boolean {
  if (this.dynamicMenuList.length === 0) return false;
  
  const enabledMenus = this.dynamicMenuList.filter(menu => !menu.disableInsert);
  if (enabledMenus.length === 0) return false;
  
  return enabledMenus.every(menu => menu.InsertRole);
}

// Toggle all Add permissions
toggleAllAdd(event: any): void {
  const isChecked = event.target.checked;
  
  this.dynamicMenuList.forEach(menu => {
    if (!menu.disableInsert) {
      menu.InsertRole = isChecked;
    }
  });
}

// Check if all Add checkboxes are disabled
isAllAddDisabled(): boolean {
  if (this.dynamicMenuList.length === 0) return true;
  
  const enabledMenus = this.dynamicMenuList.filter(menu => !menu.disableInsert);
  return enabledMenus.length === 0;
}

// Check if all Modify permissions are selected (excluding disabled ones)
isAllModifySelected(): boolean {
  if (this.dynamicMenuList.length === 0) return false;
  
  const enabledMenus = this.dynamicMenuList.filter(menu => !menu.disableUpdate);
  if (enabledMenus.length === 0) return false;
  
  return enabledMenus.every(menu => menu.UpdateRole);
}

// Toggle all Modify permissions
toggleAllModify(event: any): void {
  const isChecked = event.target.checked;
  
  this.dynamicMenuList.forEach(menu => {
    if (!menu.disableUpdate) {
      menu.UpdateRole = isChecked;
    }
  });
}

// Check if all Modify checkboxes are disabled
isAllModifyDisabled(): boolean {
  if (this.dynamicMenuList.length === 0) return true;
  
  const enabledMenus = this.dynamicMenuList.filter(menu => !menu.disableUpdate);
  return enabledMenus.length === 0;
}

// Check if all View permissions are selected (excluding disabled ones)
isAllViewSelected(): boolean {
  if (this.dynamicMenuList.length === 0) return false;
  
  const enabledMenus = this.dynamicMenuList.filter(menu => !menu.disableView);
  if (enabledMenus.length === 0) return false;
  
  return enabledMenus.every(menu => menu.ViewRole);
}

// Toggle all View permissions
toggleAllView(event: any): void {
  const isChecked = event.target.checked;
  
  this.dynamicMenuList.forEach(menu => {
    if (!menu.disableView) {
      menu.ViewRole = isChecked;
    }
  });
}

// Check if all View checkboxes are disabled
isAllViewDisabled(): boolean {
  if (this.dynamicMenuList.length === 0) return true;
  
  const enabledMenus = this.dynamicMenuList.filter(menu => !menu.disableView);
  return enabledMenus.length === 0;
}

// Check if all Delete permissions are selected (excluding disabled ones)
isAllDeleteSelected(): boolean {
  if (this.dynamicMenuList.length === 0) return false;
  
  const enabledMenus = this.dynamicMenuList.filter(menu => !menu.disableDelete);
  if (enabledMenus.length === 0) return false;
  
  return enabledMenus.every(menu => menu.DeleteRole);
}

// Toggle all Delete permissions
toggleAllDelete(event: any): void {
  const isChecked = event.target.checked;
  
  this.dynamicMenuList.forEach(menu => {
    if (!menu.disableDelete) {
      menu.DeleteRole = isChecked;
    }
  });
}

// Check if all Delete checkboxes are disabled
isAllDeleteDisabled(): boolean {
  if (this.dynamicMenuList.length === 0) return true;
  
  const enabledMenus = this.dynamicMenuList.filter(menu => !menu.disableDelete);
  return enabledMenus.length === 0;
}

// Call this method when any individual permission checkbox changes
onPermissionChange(): void {
  // This method is called to ensure header checkboxes update properly
  // No need to implement anything, just triggering change detection
}
}
