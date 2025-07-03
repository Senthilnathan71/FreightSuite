import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbModal, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
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
  selector: 'app-module',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    FeatherModule,
    NgbModalModule,
    NgbPaginationModule,
    NgSelectModule,
    DatePipe,
    PreventMultiClickDirective
  ],
  templateUrl: './module.component.html',
  styleUrls: ['./module.component.scss']
})
export class ModuleComponent implements OnInit {
  moduleForm!: FormGroup;
  isEditMode: boolean = false;
  results: any[] = [];
  ModuleMasterSid!: number;
  moduleList: any[] = [];
  statusList = ["Active", "Suspended"];
  modalRef!: any;
  userData : any;
  moduleData : any
  
  searchType = 'ModuleName';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 10;
  totalAmountOfCollection = 0;
  sortColumn: string = 'ModuleName'; 
  sortDirection: string = 'asc';
   iconOptions = [
    { value: 'home', label: 'Home' },
    { value: 'settings', label: 'Settings' },
    { value: 'users', label: 'Users' },
    { value: 'file-text', label: 'Documents' },
    { value: 'bar-chart-2', label: 'Reports' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'mail', label: 'Mail' },
    { value: 'shopping-cart', label: 'Shopping' }
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
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.appSettingService.getUser().subscribe(
      user => {
        if (user) {
          this.userData = user;
        }
      }
    )
  }

  initForm() {
    this.moduleForm = this.fb.group({
      ModuleName: ['', [Validators.required, Validators.maxLength(50)]],
      ModuleCode: ['', [Validators.required, Validators.maxLength(20)]],
      icon: [''],
      status: [{value: 'Active', disabled: false}, Validators.required],
      Remarks: ['', [Validators.required, Validators.maxLength(300)]]
    });
  }
  resetForm(): void {
    
    this.moduleForm.get('status')?.disable();
    this.moduleForm.reset({
      status: 'Active',
      icon: ''
    });
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  editModule(id: number, content: any) {
    this.isEditMode = true;
    this.ModuleMasterSid = id;
    this.settingsService.getModuleById(id).subscribe({
      next: (response: any) => {
        const module = response.data;
        this.moduleData = module;
        this.moduleForm.get('status')?.enable();
        this.moduleForm.patchValue({
          ModuleName: module.ModuleName,
          ModuleCode: module.ModuleCode,
          icon: module.icon || '',
          Remarks: module.Remarks,
          status: module.status === 'A' ? 'Active' : 'Suspended'
        });
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
      },
      error: (err) => {
        console.error('Error fetching Module', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  onSubmit() {
    if (this.moduleForm.get('status')?.disabled) {
      this.moduleForm.get('status')?.enable();
    }
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      this.moduleForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const formValue = this.moduleForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const payload = {
      ...formValue,
      status: formValue.status === "Active" ? "A" : "S",
      ...(this.isEditMode ? { updatedBy: userEmail } : { createdBy: userEmail })
    };

    const operation = this.isEditMode 
      ? this.settingsService.updateModuleById(this.ModuleMasterSid, payload)
      : this.settingsService.createNewModule(payload);

    operation.subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message || 'Operation successful');
          this.closeModal();
          this.onSearch();
        } else {
          this.appSettingService.showError(resp.message || 'Operation failed');
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.appSettingService.showError('An error occurred');
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  onSearch() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue
    };

    this.settingsService.searchModule(payload).subscribe({
      next: (res: any) => {
        this.results = res.data || res;
        this.applySorting();
        this.searchPerformed = true;
        this.updatePaginationData();
        this.totalAmountOfCollection = this.results.length;
      },
      error: (err) => {
        console.error('Search error:', err);
      }
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
    this.moduleList = this.results.slice(startIndex, endIndex);
  }

  deleteModuleById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.settingsService.deleteModuleById(id).subscribe({
          next: (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess('Module deleted successfully');
              this.onSearch();
            }
          },
          error: (err) => {
            console.error('Delete error:', err);
          }
        });
      }
    });
  }

  reset() {
    this.moduleList = [];
    this.totalAmountOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'ModuleName';
  }
  trackByIndex(index: number, item: any): number {
  return index; // or return item.ModuleMasterSid if you want to track by ID
}

  report(): void {
    const formattedData = this.moduleList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended',
      icon: item.icon || 'N/A'
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'ModuleName', label: 'Module Name' },
        { key: 'ModuleCode', label: 'Module Code' },
        { key: 'icon', label: 'Icon' },
        { key: 'Remarks', label: 'Remarks' },
        { key: 'status', label: 'Status' },
      ],
      fileName: 'Module-Report',
      title: companyName
    });
  }

  showInfo() {
    if(!this.moduleData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.moduleData;
    modalRef.componentInstance.idLabel = 'Module Id';
    modalRef.componentInstance.idValue = this.moduleData?.ModuleMasterSid;
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
					modalRef.componentInstance.DocumentSid = this.ModuleMasterSid;

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
  if (!this.moduleData) return;
  const modalRef = this.modalService.open(EmailEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.moduleData;
  modalRef.componentInstance.idLabel = 'Module Id';
  modalRef.componentInstance.idValue = this.moduleData?.ModuleMasterSid;
}

openAuthority() {
  if (!this.moduleData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.moduleData;
  modalRef.componentInstance.idLabel = 'Module Id';
  modalRef.componentInstance.idValue = this.moduleData?.ModuleMasterSid;
}

openEDoc() {
  if (!this.moduleData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.moduleData;
  modalRef.componentInstance.idLabel = 'Module Id';
  modalRef.componentInstance.idValue = this.moduleData?.ModuleMasterSid;
}


}