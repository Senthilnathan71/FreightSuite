import { CommonModule, DatePipe } from '@angular/common';
import { Component,TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-package-type-list',
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
    DatePipe,
    ListpageComponent,
    PreventMultiClickDirective,
    FavoriteStarComponent,
    NgxSpinnerModule
  ],
  templateUrl: './package-type-list.component.html',
  styleUrl: './package-type-list.component.scss',
  providers: [DatePipe]
})
export class PackageTypeListComponent {
  packageTypeForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  PackageTypeMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  packageTypeList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: NgbModalRef;
  searchType = 'PackageName';
  filterValue = '';
  searched = false;
  page = 1;
  pageSize = 15;
  totalLengthOfCollection = 0;
  isLoading = false;
  userData : any;
  packageData : any;
  currentMenuId: number;
  TandCList: any;
  isFavorite: boolean = false;
  sortColumn: string = 'HSSACCode'; 
  sortDirection: string = 'asc';
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentCompany:any;
  currentBranch: any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.userData = this.appSettingService.getDecryptedUserProfile();
    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
 this.initForm();
   
 
		if(this.userData){
			
      this.checkPermissions();
		}
      this.loadPackageTypes();
      
  }


   checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId)
    console.log(userRole)
    if (currentMenuId && userRole) {
     this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
  next: (response) => {
    this.currentMenuPermissions = response.data.MenuPermissions || {};
    this.permissions = Object.keys(this.currentMenuPermissions)
      .filter(key => this.currentMenuPermissions[key] === 'isTrue');
      console.log(this.permissions)
  }
});
    }
  }
 
  hasPermission(permission: string): boolean {
  return this.permissions.includes(permission);
}

  loadPackageTypes(): void {
    this.spinner.show();
    let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const params = {
      search: this.filterValue ? this.filterValue.trim() : '',
      page: this.page,
      pageSize: this.pageSize,
      activeCompanyId : CompanyMasterSid,
    };

    this.masterService.searchPackageTypeList(params).subscribe({
      next: (response) => {
        if(response.status) {
          this.packageTypeList = response.data.items;
          this.results = [...this.packageTypeList];
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        }
        else {
        this.appSettingService.showError(response.message);
      }
      this.spinner.hide();

      },
      error: (err) => {
        console.error('Error fetching packageTypes:', err);
        this.packageTypeList = [];
        this.results = [];
        this.totalLengthOfCollection = 0;
      },
    });
  }

  initForm() {
  
  
  this.packageTypeForm = this.fb.group({
    PackageName: ['', [Validators.required, Validators.maxLength(100)]],
    PackageCode: ['', [Validators.required, Validators.maxLength(3)]],
    status: [{value: 'Active', disabled: false}, Validators.required],
    CompanyMasterSid: [this.currentCompany?.CompanyMasterSid]  
  });
  
}

  resetForm(): void {

    
    this.packageTypeForm.get('status')?.disable();
    this.packageTypeForm.reset({
      status: 'Active',
       
    });
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editPackageType(id: number, content: any) {
    this.isEditMode = true;
    this.PackageTypeMasterSid = id;
    this.masterService.getPackageTypeById(id).pipe(take(1)).subscribe({
      next: (response: any) => {
        this.packageData = response;
        this.packageTypeForm.get('status')?.enable();
        this.packageTypeForm.patchValue({
          PackageName: response.PackageName,
          PackageCode: response.PackageCode,
          status: response.status === 'A' ? 'Active' : 'Suspended',
          CompanyMasterSid: response.CompanyMasterSid
        });
        this.modalRef = this.modalService.open(content, {centered: true, size: 'lg', backdrop: 'static'});
      },
      error: (err) => {
        console.error('Error fetching Package Type', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  onSubmit() {
     if (this.packageTypeForm.get('status')?.disabled) {
      this.packageTypeForm.get('status')?.enable();
    }
    if (this.packageTypeForm.invalid) {
      this.packageTypeForm.markAllAsTouched();
      this.packageTypeForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.packageTypeForm.value;

        const payload = {
  PackageName: formValue.PackageName,
  PackageCode: formValue.PackageCode,
  status: formValue.status === "Active" ? "A" : "S",
  createdBy: this.appSettingService.userSettingSource.value['userEmail'],
  updatedBy: this.appSettingService.userSettingSource.value['userEmail'],
  CompanyMasterSid:this.currentCompany?.CompanyMasterSid
};


      if (this.isEditMode) {
        this.masterService.updatePackageTypeById(this.PackageTypeMasterSid, payload).subscribe(
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
        this.masterService.createNewPackageType(payload).subscribe(
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

  onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue
    };

    this.masterService.searchPackageTypeList(payload).subscribe((res: any) => {
      this.results = res.data || res;
      this.searched = true;
      this.applySorting();
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
}

applySorting() {
  this.results.sort((a, b) => {
    let valueA = a[this.sortColumn];
    let valueB = b[this.sortColumn];
    
    // Handle null/undefined values
    if (valueA == null) valueA = '';
    if (valueB == null) valueB = '';
    
    // Convert to string for case-insensitive comparison
    valueA = valueA.toString().toLowerCase();
    valueB = valueB.toString().toLowerCase();
  
    if (valueA < valueB) {
      return this.sortDirection === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return this.sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
  this.packageTypeList = [...this.results];
}

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadPackageTypes();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deletePackageTypeById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deletePackageById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.loadPackageTypes();
        });
      }
    });
  }

  resetPage(): void {
    this.packageTypeList = [];
    this.totalLengthOfCollection = 0;
    this.searched = false;
    this.filterValue = '';
    this.searchType = 'PackageName';
    this.sortColumn = 'PackageName';
  this.sortDirection = 'asc';
  }

  report(): void {
    const formattedData = this.packageTypeList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

        // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
      const companyName = this.currentCompany?.companyName ?? 'Company';
        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'PackageName', label: 'Package Name' },
                { key: 'PackageCode', label: 'Package Code' },
                { key: 'status', label: 'Status' },
            ],
            fileName: 'Package-Type-Report', 
            title: companyName
        });
    }

  showInfo() {
    if(!this.packageData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.packageData;
    modalRef.componentInstance.idLabel = 'Package Type Id';
    modalRef.componentInstance.idValue = this.packageData?.PackageTypeMasterSid;
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
					modalRef.componentInstance.DocumentSid = this.PackageTypeMasterSid;

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
    if (!this.packageData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

openAuthority() {
  if (!this.packageData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.packageData;
  modalRef.componentInstance.idLabel = 'Package Type Id';
  modalRef.componentInstance.idValue = this.packageData?.PackageTypeMasterSid;
}

openEDoc() {
  if (!this.packageData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.packageData;
  modalRef.componentInstance.idLabel = 'Package Type Id';
  modalRef.componentInstance.idValue = this.packageData?.PackageTypeMasterSid;
}
clearFilterValue(){
      this.filterValue = '';
    }
 openAuditLogs(modal: TemplateRef<any>) {
  if (!this.PackageTypeMasterSid) return;

  this.masterService.getAuditLogs('PackageTypeMaster', this.PackageTypeMasterSid.toString()).subscribe({
    next: (logs: any[]) => {
      const formatFields = (val: any) => {
        if (!val) return ['NA'];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        delete obj.updatedOn; // Remove updatedOn field
        // If no fields exist after deleting updatedOn
        if (Object.keys(obj).length === 0) return ['NA'];
        return Object.entries(obj).map(
          ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
        );
      };

      this.auditLogs = logs.map(log => ({
        ...log,
        oldValDisplay: formatFields(log.oldVal),
        newValDisplay: formatFields(log.newVal)
      }));

      this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
}
}