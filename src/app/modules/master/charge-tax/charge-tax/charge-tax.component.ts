import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { take } from 'rxjs';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';

@Component({
  selector: 'app-charge-tax',
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
    NgxSpinnerModule,
    NgbDropdownModule
  ],
  templateUrl: './charge-tax.component.html',
  styleUrl: './charge-tax.component.scss',
  providers: [DatePipe]
})
export class ChargeTaxComponent implements OnInit {
  chargeTaxForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  ChargeTaxMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  chargeTaxList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: NgbModalRef;
  searchType = 'HSNCode';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 15;
  totalLengthOfCollection = 0;
  isLoading = false;
  userData:any;
  companyList: any[] = [];
  selectedCompanyId: number;
  chargeTaxData : any;
  currentMenuId: number;
  TandCList: any[]=[];
  isFavorite: boolean = false;
  sortColumn: string = 'HSNCode'; 
  sortDirection: string = 'asc';
   permissions: string[] = [];
  currentMenuPermissions: any = {};

  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  // Company
  currentCompany : any;
  currentBranch : any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    // this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
    this.loadCompanies();
    this.initForm();
    this.loadChargeTaxes();
    this.route.paramMap.subscribe(params => {
      this.ChargeTaxMasterSid = +params.get('id');
      if (this.ChargeTaxMasterSid) {
        this.isEditMode = true;
        this.loadChargeTaxData(this.ChargeTaxMasterSid);
      }
    });
    this.checkPermissions();
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
  loadChargeTaxes(): void {
    this.spinner.show();
    this.isLoading = true;
    let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      activeCompanyId : CompanyMasterSid,
    };

    this.masterService.searchChargeTax(params).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.results = response.data.items || [];
          this.applySorting();
          this.updatePaginationData();
          this.chargeTaxList = [...this.results];
          this.totalLengthOfCollection = response.data.totalCount || 0;
          
        } else {
          this.results = [];
          this.chargeTaxList = [];
          this.totalLengthOfCollection = 0;
          this.appSettingService.showError(response.message);
        }
        this.searchPerformed = true;
        this.isLoading = false;
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error loading charge taxes:', err);
        this.isLoading = false;
      }
    });
  }
  loadCompanies(): void {
    this.masterService.getAllCompanies().subscribe({
      next: (res) => {
        this.companyList = res.data || res;
      },
      error: (err) => {
        console.error('Error loading companies', err);
        this.appSettingService.showError('Failed to load companies');
      }
    });
  }

  initForm() {
    this.chargeTaxForm = this.fb.group({
      HSNCode: ['', [Validators.required, Validators.maxLength(10)]],
      description: ['', [Validators.required, Validators.maxLength(100)]],
      TaxGroup: ['', [Validators.required, Validators.maxLength(10)]],
      TaxRate: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      Remarks: ['', [Validators.maxLength(100)]],
      status: [{value: 'Active', disabled: false}, Validators.required],
      // CompanyMasterSid: ['', Validators.required]
    });
  }

  // resetForm(): void {
  //   this.chargeTaxForm.get('status')?.disable();
  //   this.chargeTaxForm.reset({
  //     status: 'Active'
  //   });
  // }

  resetForm(): void {
  // If editing an existing charge tax, reload it (restore original state)
  if (this.isEditMode && this.ChargeTaxMasterSid) {
    this.loadChargeTaxData(this.ChargeTaxMasterSid);
    return;
  }

  // Create-mode: reset form to initial state with proper default values
  this.chargeTaxForm.reset({
    HSNCode: null,
    description: null,
    TaxGroup: null,
    TaxRate: null,
    Remarks: null,
    status: 'Active'
  });

  // Re-enable the status field if it was disabled
  this.chargeTaxForm.get('status')?.enable();
  
  // Reset validation state
  this.chargeTaxForm.markAsUntouched();
  this.chargeTaxForm.markAsPristine();
  
  // Clear any stored data
  this.chargeTaxData = null;
}

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editChargeTax(id: number, content: any) {
    this.isEditMode = true;
    this.ChargeTaxMasterSid = id;
    this.masterService.getChargeTaxById(id).pipe(take(1)).subscribe({
      next: (response: any) => {
        const chargeTax = response.data; 
        this.chargeTaxData = chargeTax;
        this.chargeTaxForm.get('status')?.enable();
        this.chargeTaxForm.patchValue({
          HSNCode: chargeTax.HSNCode,
          description: chargeTax.description,
          TaxGroup: chargeTax.TaxGroup,
          TaxRate: chargeTax.TaxRate,
          Remarks: chargeTax.Remarks || '',
          status: chargeTax.Status === 'A' ? 'Active' : 'Suspended',
          CompanyMasterSid: chargeTax.CompanyMasterSid
        });
        this.modalRef = this.modalService.open(content, {centered: true, size: 'lg', backdrop: 'static'});
      },
      error: (err) => {
        console.error('Error fetching Charge Tax', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  loadChargeTaxData(id: number) {
    this.masterService.getChargeTaxById(id).subscribe(
      (response: any) => {
        const data = response.data;
        this.chargeTaxForm.patchValue({
          HSNCode: data.HSNCode,
          description: data.description,
          TaxGroup: data.TaxGroup,
          TaxRate: data.TaxRate,
          Remarks: data.Remarks,
          status: data.Status === 'A' ? 'Active' : 'Suspended',
          CompanyMasterSid: data.CompanyMasterSid
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  openAuditLogs(modal: TemplateRef<any>) {
  if (!this.ChargeTaxMasterSid) return;

  this.masterService.getAuditLogsChargeTax('ChargeTaxMaster', this.ChargeTaxMasterSid.toString()).subscribe({
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

  onSubmit() {
  const statusControl = this.chargeTaxForm.get('status');
  if (statusControl?.disabled) {
    statusControl.enable();
  }

  if (this.chargeTaxForm.invalid) {
    this.chargeTaxForm.markAllAsTouched();
    this.chargeTaxForm.updateValueAndValidity();
    this.appSettingService.showWarning('Please fill all required fields correctly.');
    return;
  }

  const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
  const formValue = this.chargeTaxForm.value;

  // Prepare the payload with both CreatedBy and UpdatedBy
  const payload: any = {
    HSNCode: formValue.HSNCode,
    description: formValue.description,
    TaxGroup: formValue.TaxGroup,
    TaxRate: parseFloat(formValue.TaxRate),
    Remarks: formValue.Remarks || '',
    Status: formValue.status === "Active" ? "A" : "S",
    CompanyMasterSid:this.currentCompany?.CompanyMasterSid,
    CreatedBy: currentUserEmail,
    UpdatedBy: currentUserEmail  // ✅ Always include both
  };

  if (this.isEditMode) {
    this.masterService.updateChargeTaxById(this.ChargeTaxMasterSid, payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message);
          this.closeModal();
          this.loadChargeTaxes();
        } else {
          this.appSettingService.showError(resp.message);
        }
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error updating:', error);
        this.appSettingService.showError('Failed to update Charge Tax');
      }
    );
  } else {
    this.masterService.createNewChargeTax(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message);
          this.closeModal();
          this.loadChargeTaxes();
        } else {
          this.appSettingService.showError(resp.message);
        }
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error creating:', error);
        this.appSettingService.showError('Failed to create Charge Tax');
      }
    );
  }
}
clearFilterValue() {
    this.filterValue = '';
    this.loadChargeTaxes();
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
}

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.chargeTaxList = this.results.slice(startIndex, endIndex);
  }
onPageChange(newPage: number) {
  this.page = newPage;
  this.loadChargeTaxes(); 
}
  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteChargeTaxById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.deleteChargeTaxById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.loadChargeTaxes();
        });
      }
    });
  }

  resetPage(): void {
    this.chargeTaxList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'HSNCode';
    this.sortColumn = 'HSNCode';
    this.sortDirection = 'asc';
    this.loadChargeTaxes();
  }

  report(): void {
   const formattedData = this.chargeTaxList.map(item => ({
    ...item,
    Status: item.Status === 'A' ? 'Active' : 'Suspended'
  }));

  // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  const companyName = this.currentCompany?.companyName ?? 'Company';
  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'HSNCode', label: 'HSN Code' },
        { key: 'description', label: 'Description' },
        { key: 'TaxGroup', label: 'Tax Group' },
        { key: 'TaxRate', label: 'Tax Rate (%)' },
        { key: 'Remarks', label: 'Remarks' },
        { key: 'Status', label: 'Status' }
    ],
  fileName: 'Charge-tax-Report', 
    title: companyName
  });
}

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  showInfo() {
    if(!this.chargeTaxData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.chargeTaxData;
    modalRef.componentInstance.idLabel = 'ChargeTax Id';
    modalRef.componentInstance.idValue = this.chargeTaxData?.ChargeTaxMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.ChargeTaxMasterSid;

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
    if (!this.chargeTaxData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    const MenuMasterSid = localStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
   const modalRef = this.modalService.open(AuthorityLogComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.ChargeTaxMasterSid;
  }

openEDoc() {
  if (!this.chargeTaxData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.chargeTaxData;
  modalRef.componentInstance.idLabel = 'ChargeTax Id';
  modalRef.componentInstance.idValue = this.chargeTaxData?.ChargeTaxMasterSid;
}
}