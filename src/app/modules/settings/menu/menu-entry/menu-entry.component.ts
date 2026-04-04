import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbDropdown, NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
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
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { iconsData } from 'src/assets/icons';

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
    NgbModule,
    NgbDropdownModule
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

  iconOptions = Object.values(iconsData)
    .flat()
    .map(item => ({
      label: item.name,  // for display in dropdown
      value: item.icon   // actual icon class
    }));

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

  // getOptionIcon(option: string): string {
  //   const icons: { [key: string]: string } = {
  //     'Add': 'plus',
  //     'View': 'eye',
  //     'Edit': 'edit',
  //     'Delete': 'trash-alt',
  //     'Edoc': 'file-alt',
  //     'Terms and Condition': 'clipboard',
  //     'Authority': 'shield-alt',
  //     'Email': 'envelope'
  //   };
  //   return icons[option] || 'plus-circle';
  // }

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
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    this.initForm();
    this.loadModules();

    // Watch for module changes
    this.menuForm.get('ModuleMasterSid')?.valueChanges.subscribe(moduleId => {
      if (this.isSubMenu && moduleId) {
        this.loadMainMenus(moduleId);
      }
    });

    this.route.paramMap.subscribe(
      (param: any) => {
        this.MenuMasterSid = +param.get('id');
        if (this.MenuMasterSid) {
    // EDIT MODE
    this.isEditMode = true;
    this.menuForm.get('MenuName')?.disable(); // ✅ ensure disabled
    this.menuForm.get('path')?.disable();
    this.loadMenuData(this.MenuMasterSid);
    this.loadMenuPermissions(this.MenuMasterSid);
  } else {
    // CREATE MODE
    this.isEditMode = false;
    this.menuForm.get('MenuName')?.enable(); // ✅ enable while creating
    this.menuForm.get('path')?.enable();
  }
        console.log(this.MenuMasterSid, 'MenuMasterSid')
        if (this.MenuMasterSid) {
          this.isEditMode = true;
          this.loadMenuData(this.MenuMasterSid);
          this.loadMenuPermissions(this.MenuMasterSid);
        }
      }
    );
  }

  onModuleChange(moduleId: number) {
    if (this.isSubMenu) {
      this.loadMainMenus(moduleId);
    }
  }
  loadMainMenus(moduleId: number) {
    if (!moduleId) {
      this.mainMenus = [];
      return;
    }

    this.isLoading = true;
    this.settingsService.getSubMenuList(moduleId).subscribe({
      next: (menus: any[]) => {
        this.mainMenus = menus.map(menu => ({
          MenuMasterSid: menu.MenuMasterSid,
          MenuName: menu.MenuName
        }));
        this.isLoading = false;
        this.cdr.detectChanges(); // Force UI update
      },
      error: (error) => {
        console.error('Error loading main menus:', error);
        this.mainMenus = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadModules() {
    this.settingsService.getAllModule().subscribe({
      next: (response: any) => {
        this.moduleList = response.data.map((module: any) => ({
          ModuleMasterSid: module.ModuleMasterSid,
          ModuleName: module.ModuleName,
          ModuleCode: module.ModuleCode
        }));
      },
      error: (error) => {
        console.error('Error loading modules:', error);
      }
    });
  }

  initForm() {
    this.menuForm = this.fb.group({
      MenuName: [{value:'',disabled:true}, [Validators.required, Validators.maxLength(50), this.noSpecialCharsValidator()]],
      MenuCode: ['', [Validators.required, Validators.maxLength(3), this.uppercaseValidator()]],
      ModuleMasterSid: ['', Validators.required],
      ModuleName: [''],
      parentId: ['', []],
      path: [{value:'',disabled:true}, [Validators.required, this.pathValidator()]],
      icon: [''],
      status: [{ value: 'Active', disabled: false }, Validators.required],
      menuPermissions: this.fb.group({
        add: [false],
        edit: [false],
        view : [false],
        delete: [false],
        post: [false]
      }),
      otherPermissions: this.fb.group({
        edoc: [false],
        terms_and_condition: [false],
        authority: [false],
        email: [false],
        followUp: [false],
        docRef: [false]
      })
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


  get menuPermissionsGroup(): FormGroup {
    return this.menuForm.get('menuPermissions') as FormGroup;
  }
  get otherPermissionsGroup(): FormGroup {
    return this.menuForm.get('otherPermissions') as FormGroup;
  }

  get showPostPermission(): boolean {
    const moduleId = this.menuForm.get('ModuleMasterSid')?.value;
    const selected = this.moduleList.find(m => m.ModuleMasterSid === moduleId);
    if (!selected) return false;
    const name = (selected.ModuleName || '').toLowerCase();
    const code = (selected.ModuleCode || '').toUpperCase();
    return name === 'account' || name === 'accounts' || code === 'ACC';
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
    console.log('IsSubMenu changed:', isChecked);
    this.isSubMenu = isChecked;
    const parentIdControl = this.menuForm.get('parentId');
    const moduleId = this.menuForm.get('ModuleMasterSid')?.value;
    console.log('Current moduleId:', moduleId);

    if (this.isSubMenu) {
      parentIdControl?.setValidators([Validators.required]);
      if (moduleId) {
        console.log('Loading main menus for module:', moduleId);
        this.loadMainMenus(moduleId);
      } else {
        console.log('No module selected');
        this.mainMenus = [];
      }
    } else {
      parentIdControl?.clearValidators();
      parentIdControl?.setValue(null);
      this.mainMenus = [];
    }
    parentIdControl?.updateValueAndValidity();
  }

  loadMenuPermissions(menuMasterSid: number) {
    this.settingsService.getMenuPermissions(menuMasterSid).subscribe((resp: any) => {
      if (!resp) { return; }

      // Reverse map: permissionCode → formControlName
      const reverseMap: Record<string, string> = {
        'add': 'add',
        'edit': 'edit',
        'view': 'view',
        'delete': 'delete',
        'post': 'post',
        'edoc': 'edoc',
        'terms_and_condition': 'terms_and_condition',
        'authority': 'authority',
        'email': 'email',
        'follow_up': 'followUp',
        'document_reference': 'docRef'
      };

      const menuPerms: Record<string, boolean> = {};
      const otherPerms: Record<string, boolean> = {};

      resp.forEach((item: any) => {
        const code = item.permissionCode?.toLowerCase();
        const formControlName = reverseMap[code];
        if (!formControlName) return;

        const isActive = item.status === 'A';

        if (['add', 'edit', 'view', 'delete', 'post'].includes(formControlName)) {
          menuPerms[formControlName] = isActive;
        } else {
          otherPerms[formControlName] = isActive;
        }
      });

      this.menuForm.patchValue({
        menuPermissions: menuPerms,
        otherPermissions: otherPerms
      });
    });
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
      status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
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
            this.appSettingService.showSuccess(resp.message);
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
            this.router.navigate(['settings/menu/list']);
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
            this.appSettingService.showSuccess(resp.message);
            const menuId = resp.data?.menu?.MenuMasterSid;
            if (menuId) {
              this.router.navigate(['settings/menu/list', menuId]);
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

  private readonly permissionNameMap: Record<string, string> = {
  add: 'Add',
  edit: 'Edit',
  view : 'View',
  delete: 'Delete',
  post: 'Post',
  edoc: 'Edoc',
  terms_and_condition: 'Terms and Condition',
  authority: 'Authority',
  email: 'Email',
  followUp: 'Follow Up',
  docRef: 'Document Reference'
};


private preparePermissionsPayload() {
  const build = (group: any) =>
    Object.keys(group)
      .filter(key => group[key])               // only checked boxes
      .map(key => ({
        permissionName: this.permissionNameMap[key] || key
      }));

  const menuPerms  = build(this.menuForm.value.menuPermissions);
  const otherPerms = build(this.menuForm.value.otherPermissions);

  return [...menuPerms, ...otherPerms];
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
    this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
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
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.MenuMasterSid;
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
