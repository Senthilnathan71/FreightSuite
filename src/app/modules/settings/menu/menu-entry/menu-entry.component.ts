import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbDropdown, NgbModal, NgbModalModule, NgbModalRef, NgbModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { SettingsService } from '../../settings.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from '../../email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from '../../edoc/edoc/edoc.component';
import { take } from 'rxjs';

@Component({
  selector: 'app-menu-entry',
  standalone: true,
  imports: [
    NgbModalModule,
    FeatherModule,
    NgSelectModule,
    CommonModule,
    ReactiveFormsModule,
    NgbPagination,
    RouterModule,
    FormsModule,
    PreventMultiClickDirective,
    NgbModule
  ],
  templateUrl: './menu-entry.component.html',
  styleUrl: './menu-entry.component.scss'
})
export class MenuEntryComponent implements OnInit {

  menuForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  MenuMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  menuList: any[] = [];
  moduleList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: NgbModalRef;
  searchType = 'MenuName';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  isLoading = false;
  userData: any;
  menuData: any;
  isSubMenu: boolean = false;
  mainMenus: any[] = [];
  displayMenus: any[] = [];

  modeOfPermissions = [
    { value: 'Y', name: "Allowed" },
    { value: 'N', name: "Restricted" }
  ];

  iconOptions = [
    { value: 'home', label: 'Home' },
    { value: 'settings', label: 'Settings' },
    { value: 'users', label: 'Users' },
    { value: 'file-text', label: 'Documents' },
    { value: 'bar-chart-2', label: 'Reports' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'mail', label: 'Mail' },
    { value: 'shopping-cart', label: 'Shopping' },
    { value: 'disc', label: 'Disc' }

  ];


  specialOptions = [
    'Add',
    'View',
    'Edit',
    'Delete',
    'Edoc',
    'Terms and Condition',
    'Authority',
    'Email'
  ];

  getOptionIcon(option: string): string {
    const icons: { [key: string]: string } = {
      'Add': 'plus',
      'View': 'eye',
      'Edit': 'edit',
      'Delete': 'trash-alt',
      'Edoc': 'file-alt',
      'Terms and Condition': 'clipboard',
      'Authority': 'shield-alt',
      'Email': 'envelope'
    };
    return icons[option] || 'plus-circle';
  }

  filteredPermissions = [...this.specialOptions];
  currentMenuId: number;
  TandCList: any;
  allPermissions: any[]

  constructor(
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
  ) { }

  ngOnInit(): void {
    this.appSettingService.getUser().subscribe(
      user => {
        if (user) {
          this.userData = user;
        }
      }
    )

    this.initForm();
    this.loadModules();
    this.loadMainMenus();
    // this.loadDisplayMenus();
    this.route.paramMap.subscribe(
      (param: any) => {
        this.MenuMasterSid = +param.get('id');
        if (this.MenuMasterSid) {
          this.isEditMode = true;
          this.loadMenuData(this.MenuMasterSid);
          this.loadMenuPermissions(this.MenuMasterSid);
        } else {
          this.addPermission();
        }
      }
    )
  }
  loadMainMenus() {

    this.mainMenus = [
      { MenuMasterSid: -1, MenuName: 'Global Master' },
      { MenuMasterSid: -2, MenuName: 'Finance Master' }
    ];


    this.settingsService.getMainMenus().subscribe({
      next: (response: any) => {

        const additionalMenus = response.data.filter((menu: any) =>
          menu.MenuName !== 'Global Master' && menu.MenuName !== 'Finance Master'
        ).map((menu: any) => ({
          MenuMasterSid: menu.MenuMasterSid,
          MenuName: menu.MenuName
        }));


        this.mainMenus = [...this.mainMenus, ...additionalMenus];
      },
      error: (error) => {
        console.error('Error loading main menus:', error);

      }
    });
  }
  // loadDisplayMenus() {
  //         this.settingsService.getAllMenu().subscribe({
  //             next: (menus) => {
  //                 this.displayMenus = menus;
  //             },
  //             error: (error) => {
  //                 console.error('Error loading menu hierarchy:', error);
  //             }
  //         });
  //     }

  // Load all modules for dropdown
  loadModules() {
    this.settingsService.getAllModule().subscribe({
      next: (response: any) => {
        this.moduleList = response.data.map((module: any) => ({
          ModuleMasterSid: module.ModuleMasterSid,
          ModuleName: module.ModuleName
        }));
      },
      error: (error) => {
        console.error('Error loading modules:', error);
      }
    });
  }

  initForm() {
    this.menuForm = this.fb.group({
      MenuName: ['', [Validators.required, Validators.maxLength(50), this.noSpecialCharsValidator()]],
      MenuCode: ['', [Validators.required, Validators.maxLength(3), this.uppercaseValidator()]],
      ModuleMasterSid: ['', Validators.required],
      ModuleName: [''],
      parentId: ['', []],
      path: ['', [Validators.required, this.pathValidator()]],
      icon: [''],
      status: [{ value: 'Active', disabled: false }, Validators.required],
      permissions: this.fb.array([])
    });
    this.menuForm.get('isSubMenu')?.valueChanges.subscribe(isSubMenu => {
      const parentIdControl = this.menuForm.get('parentId');
      if (isSubMenu) {
        parentIdControl?.setValidators([Validators.required]);
      } else {
        parentIdControl?.clearValidators();
        parentIdControl?.setValue(null);
      }
      parentIdControl?.updateValueAndValidity();
    });
  }

  createPermissionGroup(): FormGroup {
    return this.fb.group({
      permissionName: ['', [Validators.required, Validators.maxLength(100), this.duplicatePermissionValidator()]],
    });
  }

  get permissions(): FormArray {
    return this.menuForm.get('permissions') as FormArray;
  }

  addPermission(): void {
    this.permissions.push(this.createPermissionGroup());
  }

  removePermission(index: number): void {
    if (this.permissions.length > 1) {
      this.permissions.removeAt(index);
      this.permissions.controls.forEach(control => {
        control.get('permissionName').updateValueAndValidity();
      });
      this.permissions.updateValueAndValidity();
      this.menuForm.updateValueAndValidity();
    }
  }

  clearPermission(index: number) {
    console.log(index);
    if (index !== undefined) {
      console.log(this.permissions);
      this.permissions.at(index).get('permissionName')?.setValue('');
    }
  }

  createPermissionWithOption(event: string) {
    if (this.permissions.value[this.permissions.length - 1].permissionName === '') {
      this.permissions.at(this.permissions.length - 1).setValue({ permissionName: event });
      return;
    }
    const formWithPermission = this.fb.group({
      permissionName: [event, [Validators.required, Validators.maxLength(100), this.duplicatePermissionValidator()]],
    })
    this.permissions.push(formWithPermission);
  }

  filterPermissionList(state) {
    if (state) {
      let existingPermissions = this.permissions.value;
      existingPermissions = existingPermissions.map(p => p.permissionName.toLowerCase());
      this.filteredPermissions = this.specialOptions.filter(perm => !existingPermissions.includes(perm.toLowerCase()));
    }
  }

  get isSubMenuChecked(): boolean {
    return !!this.menuForm.get('parentId')?.value;
  }


  loadMenuData(id: number) {
    this.settingsService.getMenuById(id).subscribe(
      (response: any) => {
        const data = response.data;
        this.menuData = data;
        this.menuForm.patchValue({
          MenuName: data.MenuName,
          MenuCode: data.MenuCode,
          ModuleMasterSid: data.ModuleMasterSid,
          ModuleName: data.ModuleName,
          path: data.path,
          icon: data.icon,
          status: data.status === 'A' ? 'Active' : 'Suspended',
          parentId: data.parentId
        });
        this.isSubMenu = !!data.parentId;
        const parentIdControl = this.menuForm.get('parentId');
        if (this.isSubMenu) {
          parentIdControl?.setValidators([Validators.required]);
        } else {
          parentIdControl?.clearValidators();
        }
        parentIdControl?.updateValueAndValidity();
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  onParentMenuChange(isChecked: boolean) {
    this.isSubMenu = isChecked;
    const parentIdControl = this.menuForm.get('parentId');
    if (this.isSubMenu) {
      parentIdControl?.setValidators([Validators.required]);
    } else {
      parentIdControl?.clearValidators();
      parentIdControl?.setValue(null);
    }
    parentIdControl?.updateValueAndValidity();
  }

  loadMenuPermissions(MenuMasterSid) {
    this.settingsService.getMenuPermissions(MenuMasterSid).subscribe(
      (resp: any) => {
        if (resp) {
          const menuPermissions = resp;
          if (menuPermissions.length > 0) {
            this.patchPermissions(menuPermissions);
          } else {
            this.addPermission();
          }
        }
      }
    )
  }

  patchPermissions(menuPermissions: any[]) {
    menuPermissions.map(m => {
      const permissionGroup = this.createPermissionGroup();
      permissionGroup.patchValue({
        permissionName: m.permissionName
      })
      this.permissions.push(permissionGroup);
    })
  }

  onSubmit() {
    if (this.menuForm.invalid) {
      this.menuForm.markAllAsTouched();
      this.menuForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    // Prepare payload data
    const formValue = this.menuForm.getRawValue();
    const selectedModule = this.moduleList.find(
      module => module.ModuleMasterSid == formValue.ModuleMasterSid
    );

    // Process parentId - convert empty/undefined/falsey values to null
    const parentId = formValue.parentId ? formValue.parentId : null;

    const payload = {
      ...formValue,
      createdBy: this.appSettingService.userSettingSource.value['userEmail'],
      updatedBy: this.appSettingService.userSettingSource.value['userEmail'],
      ModuleName: selectedModule?.ModuleName || '',
      status: formValue.status === "Active" ? "A" : "S",
      parentId: parentId, // Use the processed parentId
      permissions: this.preparePermissionsPayload()
    };

    if (this.isEditMode) {
      this.btnDisable = true; // Disable button during submission
      this.isLoading = true; // Show loading indicator

      this.settingsService.updateMenuById(this.MenuMasterSid, payload).subscribe(
        (resp: any) => {
          this.btnDisable = false;
          this.isLoading = false;

          if (resp.status) {
            this.appSettingService.showSuccess('Menu updated successfully.');
            const updatedMenu = resp.data?.updatedMenu || resp.data?.menu;

            // Update form with exact values from server
            this.menuForm.patchValue({
              MenuName: updatedMenu.MenuName,
              MenuCode: updatedMenu.MenuCode,
              ModuleMasterSid: updatedMenu.ModuleMasterSid,
              path: updatedMenu.path,
              icon: updatedMenu.icon,
              status: updatedMenu.status === 'A' ? 'Active' : 'Suspended',
              parentId: updatedMenu.parentId // This will be null if cleared
            });

            // Update flags based on actual response
            this.isSubMenu = !!updatedMenu.parentId;

            // Update local data for display
            this.menuData = updatedMenu;

            // Force UI update if using change detection strategy OnPush
            this.cdr.detectChanges();
          } else {
            this.appSettingService.showError(resp.message || 'Error updating menu.');
          }
        },
        (error) => {
          this.btnDisable = false;
          this.isLoading = false;
          this.errorMessage = error.message;
          console.error('Error updating menu:', error);
          this.appSettingService.showError(error.message || 'Error updating menu.');
        }
      );
    } else {
      this.btnDisable = true;
      this.isLoading = true;

      this.settingsService.createMenu(payload).subscribe(
        (resp: any) => {
          this.btnDisable = false;
          this.isLoading = false;

          if (resp.status) {
            this.appSettingService.showSuccess('Menu created successfully.');
            const menuId = resp.data?.menu?.MenuMasterSid;
            if (menuId) {
              this.router.navigate(['settings/menu/entry', menuId]);
            }
          } else {
            this.appSettingService.showError(resp.message || 'Error creating menu.');
          }
        },
        (error) => {
          this.btnDisable = false;
          this.isLoading = false;
          this.errorMessage = error.message;
          console.error('Error creating menu:', error);
          this.appSettingService.showError(error.message || 'Error creating menu.');
        }
      );
    }
  }

  private preparePermissionsPayload(): any[] {
    const permissionNames = this.permissions.controls.map(permissionGroup => ({
      permissionName: permissionGroup.get('permissionName')?.value,
    }));
    return permissionNames
  }

  // Add this method to your component
  duplicatePermissionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !this.permissions) {
        return null;
      }

      const currentPermissionName = control.value.trim().toLowerCase();
      const duplicateIndex = this.permissions.controls.findIndex((permission, index) => {
        // Skip current control being validated
        if (control.parent && control.parent === permission) {
          return false;
        }
        return permission.get('permissionName')?.value?.trim().toLowerCase() === currentPermissionName;
      });

      return duplicateIndex >= 0 ? { duplicatePermission: true } : null;
    };
  }


  trackByIndex(index: number, item: any): number {
    return index;
  }

  resetPage(): void {
    this.menuList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'MenuName';
  }

  report(): void {
    const formattedData = this.menuList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended',
      path: item.path || 'N/A',
      icon: item.icon || 'N/A'
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'MenuName', label: 'Menu Name' },
        { key: 'ModuleName', label: 'Module Name' },
        { key: 'status', label: 'Status' },
      ],
      fileName: 'Menu-Report',
      title: companyName
    });
  }

  showInfo() {
    if (!this.menuData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.menuData;
    modalRef.componentInstance.idLabel = 'Menu Id';
    modalRef.componentInstance.idValue = this.menuData?.MenuMasterSid;
  }

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.settingsService.getTandCByCondition(payload).subscribe(
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
          modalRef.componentInstance.DocumentSid = this.MenuMasterSid;

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
    if (!this.menuData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    if (!this.menuData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.menuData;
    modalRef.componentInstance.idLabel = 'Menu Id';
    modalRef.componentInstance.idValue = this.menuData?.MenuMasterSid;
  }

  openEDoc() {
    if (!this.menuData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.menuData;
    modalRef.componentInstance.idLabel = 'Menu Id';
    modalRef.componentInstance.idValue = this.menuData?.MenuMasterSid;
  }

  private noSpecialCharsValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      const valid = /^[a-zA-Z0-9\s]*$/.test(control.value); // Only alphanumeric and spaces
      return valid ? null : { invalidChars: true };
    };
  }

  private pathValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      // Allows lowercase letters, numbers, hyphens, and forward slashes
      const valid = /^[a-z0-9-/]+$/.test(control.value);
      return valid ? null : { invalidPath: true };
    };
  }

  private uppercaseValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      const valid = /^[A-Z0-9]+$/.test(control.value); // Only uppercase and numbers
      return valid ? null : { invalidUppercase: true };
    };
  }

  onToggleChange(controlName: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.menuForm.get(controlName)?.setValue(isChecked ? 'Y' : 'N');
  }


  resetForm(): void {
    this.menuForm.get('status')?.disable();
    this.menuForm.reset({
      status: 'Active'
    });
  }

  navigateBack() {
    history.back();
  }

}
