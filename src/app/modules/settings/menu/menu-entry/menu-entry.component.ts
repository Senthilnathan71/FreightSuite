import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
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
    PreventMultiClickDirective
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
  currentMenuId: number;
  TandCList: any;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService
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
      path: ['', [Validators.required, this.pathValidator()]],
      icon: [''],
      status: [{ value: 'Active', disabled: false }, Validators.required],
      permissions: this.fb.array([])
    });
  }

  createPermissionGroup(): FormGroup {
    return this.fb.group({
      permissionName: ['', [Validators.required, Validators.maxLength(100)]],
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
    }
  }




  loadMenuData(id: number) {
    this.settingsService.getMenuById(id).subscribe(
      (response: any) => {
        const data = response.data;
        this.menuForm.patchValue({
          MenuName: data.MenuName,
          MenuCode: data.MenuCode,
          ModuleMasterSid: data.ModuleMasterSid,
          ModuleName: data.ModuleName, 
          path: data.path,
          icon: data.icon,
          status: data.status === 'A' ? 'Active' : 'Suspended'
        });
        console.log(data);
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  loadMenuPermissions(MenuMasterSid){
    this.settingsService.getMenuPermissions(MenuMasterSid).subscribe(
      (resp:any)=>{
        if(resp)
        {
          const menuPermissions = resp;
          if(menuPermissions.length > 0){
            this.patchPermissions(menuPermissions);
          } else {
            this.addPermission();
          }
        }
      }
    )
  }

  patchPermissions(menuPermissions : any[]){
    menuPermissions.map(m => {
      const permissionGroup = this.createPermissionGroup();
      permissionGroup.patchValue({
        permissionName : m.permissionName
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
    } else {

      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.menuForm.getRawValue();

      const selectedModule = this.moduleList.find(
        module => module.ModuleMasterSid == this.menuForm.value.ModuleMasterSid
      );

      const payload = {
        ...formValue,
        ...createdBy,
        ...updatedBy,
        ModuleName: selectedModule?.ModuleName || '',
        status: formValue.status === "Active" ? "A" : "S",
        permissions: this.preparePermissionsPayload() 
      };

      if (this.isEditMode) {
        this.settingsService.updateMenuById(this.MenuMasterSid, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess('Menu updated successfully.');
              const menuId = resp.data?.menu?.MenuMasterSid;
              if(menuId){
                this.loadMenuData(menuId);
                this.loadMenuPermissions(menuId);
              }
            } else {
              this.appSettingService.showError('Error updating menu.');
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      } else {
        this.settingsService.createMenu(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess('Menu created successfully.');
              const menuId = resp.data?.menu?.MenuMasterSid;
              if(menuId){
                this.router.navigate(['settings/menu/entry',menuId])
              }
            } else {
              this.appSettingService.showError('Error creating menu.');
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      }
    }
  };

  private preparePermissionsPayload(): any[] {
    return this.permissions.controls.map(permissionGroup => ({
      permissionName: permissionGroup.get('permissionName')?.value,
    }));
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
    modalRef.componentInstance.item = this.menuData;
    modalRef.componentInstance.idLabel = 'Menu Id';
    modalRef.componentInstance.idValue = this.menuData?.MenuMasterSid;
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

  navigateBack(){
    history.back();
  }

}
