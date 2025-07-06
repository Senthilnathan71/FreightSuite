import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { SettingsService } from '../../settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from '../../email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from '../../edoc/edoc/edoc.component';

@Component({
  selector: 'app-menu-list',
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
  templateUrl: './menu-list.component.html',
  styleUrl: './menu-list.component.scss',
  providers: [DatePipe]
})
export class MenuListComponent implements OnInit {
  menuForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  MenuMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  menuList: any[] = [];
  moduleList: any[] = []; // Added for module dropdown
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
  menuData : any;
  sortColumn: string = 'ModuleName'; 
  sortDirection: string = 'asc';
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
   isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private datePipe: DatePipe,
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
      status: [{value: 'Active', disabled: false}, Validators.required],
      AllowAdd: ['N'],
    AllowModify: ['N'],
    AllowView: ['N'],
    AllowDelete: ['N'],
    TandCRequire: ['N'],
    AttachmentRequire: ['N'],
    FollowupRequire: ['N']
    });
  }
  private noSpecialCharsValidator(): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    if (!control.value) return null;
    const valid = /^[a-zA-Z0-9\s]*$/.test(control.value); // Only alphanumeric and spaces
    return valid ? null : { invalidChars: true };
  };
}
private pathValidator(): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    if (!control.value) return null;
    // Allows lowercase letters, numbers, hyphens, and forward slashes
    const valid = /^[a-z0-9-/]+$/.test(control.value);
    return valid ? null : { invalidPath: true };
  };
}

  private uppercaseValidator(): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
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

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editMenu(id: number, content: TemplateRef<any>) {
    this.isEditMode = true;
    this.MenuMasterSid = id;
    this.settingsService.getMenuById(id).pipe(take(1)).subscribe({
      next: (response: any) => {
        const menu = response.data; 
        this.menuData = menu;
        this.menuForm.get('status')?.enable();
        this.menuForm.patchValue({
          MenuName: menu.MenuName,
          MenuCode: menu.MenuCode,
          ModuleMasterSid: menu.ModuleMasterSid|| '',
          ModuleName: menu.ModuleName || '',
          path: menu.path || '', 
          icon: menu.icon || '', 
          status: menu.status === 'A' ? 'Active' : 'Suspended',
          AllowAdd: menu.AllowAdd || 'N',
        AllowModify: menu.AllowModify || 'N',
        AllowView: menu.AllowView || 'N',
        AllowDelete: menu.AllowDelete || 'N',
        TandCRequire: menu.TandCRequire || 'N',
        AttachmentRequire: menu.AttachmentRequire || 'N',
        FollowupRequire: menu.FollowupRequire || 'N'
        });
        // this.menuForm.get('status')?.enable();
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
      },
      error: (err) => {
        console.error('Error fetching Menu', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }
  

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
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
          status: data.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  onSubmit() {
    if (this.menuForm.get('status')?.disabled) {
      this.menuForm.get('status')?.enable();
    }
    if (this.menuForm.invalid) {
      this.menuForm.markAllAsTouched();
      this.menuForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      // Get selected module name for display
      const selectedModule = this.moduleList.find(
        module => module.ModuleMasterSid == this.menuForm.value.ModuleMasterSid
      );
      
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.menuForm.value;

      const payload = {
        ...formValue,
        ModuleName: selectedModule?.ModuleName || '', // Add ModuleName to payload
        ...(this.isEditMode ? updatedBy : createdBy),
        status: formValue.status === "Active" ? "A" : "S"
      };

      if (this.isEditMode) {
        this.settingsService.updateMenuById(this.MenuMasterSid, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.search();
            } else {
              this.appSettingService.showError(resp.message);
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
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.search();
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      }
    }
  }

  // Rest of the methods remain the same as before...
  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue
    };

    this.settingsService.searchMenuList(payload).subscribe((res: any) => {
      this.results = res.data || res;
      this.applySorting();
      this.searchPerformed = true;
      this.updatePaginationData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }
  sort(column: string) {
  if (this.sortColumn === column) {
    // Reverse the sort direction if clicking the same column
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new sort column and default to ascending
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }
  
  this.applySorting();
  this.updatePaginationData();
}

applySorting() {
  this.results.sort((a, b) => {
    // First sort by ModuleName
    let moduleA = a.ModuleName || '';
    let moduleB = b.ModuleName || '';
    
    if (moduleA < moduleB) {
      return this.sortDirection === 'asc' ? -1 : 1;
    }
    if (moduleA > moduleB) {
      return this.sortDirection === 'asc' ? 1 : -1;
    }
    
    // If ModuleNames are equal, sort by MenuName
    let menuA = a.MenuName || '';
    let menuB = b.MenuName || '';
    
    if (menuA < menuB) {
      return this.sortDirection === 'asc' ? -1 : 1;
    }
    if (menuA > menuB) {
      return this.sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.menuList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  // deleteMenuById(id: number) {
  //   const dialogRef = this.dialog.open(DeleteWarningComponent);
  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result === true) {
  //       this.settingsService.deleteMenuById(id).subscribe((resp: any) => {
  //         this.appSettingService.showSuccess('Deleted!');
  //         this.search();
  //       });
  //     }
  //   });
  // }

  resetPage(): void {
    this.menuList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'MenuName';
    this.sortColumn = 'ModuleName';
    this.sortDirection = 'asc';
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
    if(!this.menuData) return;
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

navigateToCreate(){
  this.router.navigate(['settings/menu/entry'])
}

}