import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MasterService } from '../../master.service';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { BLClause } from 'src/app/modules/crm-mobile/Interfaces/biclause.interface';
import { FeatherModule } from 'angular-feather';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';


@Component({
  selector: 'app-biclause',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    NgbPaginationModule,
    FeatherModule,
    DatePipe,
    ListpageComponent,
    PreventMultiClickDirective,
    FavoriteStarComponent,
    NgxSpinnerModule
  ],
  templateUrl: './biclause.component.html',
  styleUrls: ['./biclause.component.scss']
})
export class BIclauseComponent implements OnInit {
  biclauseForm: FormGroup;
  searchType = 'ClauseDescription';
  filterValue = '';
  clauseList: BLClause[] = [];
  allClauses: BLClause[] = [];
  searchPerformed = false;
  loading = false;
  btnDisable = false;
  isEditMode = false;
  currentClauseId: number | null = null;
  userData: any;
  blclauseData: any;
  sortColumn: string = 'ClauseDescription'; 
  sortDirection: string = 'asc';
   permissions: string[] = [];
  currentMenuPermissions: any = {};

  // Pagination
  page = 1;
  pageSize = 15;
  totalLengthOfCollection = 0;
  isFavorite: boolean = false;

  //Company
  currentCompany : any;
  currentBranch : any;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  
  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  currentMenuId: number;
  TandCList: any[]=[];
  auditLogs: any[] = []; // Stores audit logs
    auditLogModalRef!: NgbModalRef;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService
  ) {
    this.biclauseForm = this.fb.group({
      ClauseDescription: ['', [Validators.required, Validators.maxLength(500)]],
      Keyword: ['', [Validators.required, Validators.maxLength(5)]],
      Sortorder: ['', [Validators.pattern('^[0-9]*$')]],
      DefaultClause: [false],
      status: [{value: 'A', disabled: false}, Validators.required]
    });
  }
  

  ngOnInit(): void {
    
  //      this.appSettingService.getUser().subscribe(user => {
  //   if(user) {
  //     this.userData = user;
  //     this.checkPermissions();
  //   }
  // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
  const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
  this.loadAllClauses();
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
  this.updatePaginatedData();
}

applySorting() {
  this.allClauses.sort((a, b) => {
    let valueA = a[this.sortColumn];
    let valueB = b[this.sortColumn];

    // Handle null/undefined values
    if (valueA == null) valueA = this.sortColumn === 'Sortorder' ? 0 : '';
    if (valueB == null) valueB = this.sortColumn === 'Sortorder' ? 0 : '';

    // Numeric sorting for Sortorder
    if (this.sortColumn === 'Sortorder') {
      valueA = Number(valueA) || 0;
      valueB = Number(valueB) || 0;
      
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    } 
    // String sorting for other columns
    else {
      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    }
  });
}
  loadAllClauses(): void {
    this.spinner.show();
  this.loading = true;
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize
  };

  this.masterService.searchBlclauselList(params).subscribe({
    next: (response) => {
      if(response.status) {
        
        this.allClauses = response.data.items;
        this.applySorting();
        this.updatePaginatedData();
        this.clauseList = [...this.allClauses];
        this.totalLengthOfCollection = response.data.totalCount;
        
      } else {
        this.allClauses = [];
        this.clauseList = []; 
        this.totalLengthOfCollection = 0;
        this.appSettingService.showError(response.message);

      }
      
      this.searchPerformed = true;
      this.loading = false;
     this.spinner.hide(); 
    },
    error: (err) => {
      console.error('Error loading clauses:', err);
      this.loading = false;
    }
  });
}
clearFilterValue() {
  this.filterValue = '';
  this.loadAllClauses();
 
}

updatePaginatedData(): void {
  const startIndex = (this.page - 1) * this.pageSize;
  const endIndex = startIndex + this.pageSize;
  this.clauseList = this.allClauses.slice(startIndex, endIndex);
}

  openModal(content: any, clause?: BLClause): void {
    this.isEditMode = !!clause;
    this.currentClauseId = clause?.BLClauseMasterSid || null;
    
    if (this.isEditMode) {
      this.biclauseForm.get('status')?.enable();
      this.blclauseData = clause;
      this.biclauseForm.patchValue({
        ClauseDescription: clause.ClauseDescription,
        Keyword: clause.Keyword,
        Sortorder: clause.Sortorder?.toString() || '',
        DefaultClause: clause.DefaultClause === 'Y',
        status: clause.status || 'A'
      });
    } else {
       this.biclauseForm.get('status')?.disable();
      this.biclauseForm.reset({
        ClauseDescription: '',
        Keyword: '',
        Sortorder: '',
        DefaultClause: '',
        status: 'A'
      });
    }

    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  onSubmit(): void {
  if (this.biclauseForm.get('status')?.disabled) {
    this.biclauseForm.get('status')?.enable();
  }
  if (this.biclauseForm.invalid) {
    this.appSettingService.showWarning('Please fill all required fields correctly.');
    return;
  }

  this.btnDisable = true;
  const formValue = this.biclauseForm.value;
  const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
  
  const payload = {
    ClauseDescription: formValue.ClauseDescription,
    Keyword: formValue.Keyword,
    Sortorder: formValue.Sortorder ? parseInt(formValue.Sortorder) : null,
    DefaultClause: formValue.DefaultClause ? 'Y' : 'N',
    status: formValue.status,
    ...(this.isEditMode ? { updatedBy: userEmail } : { createdBy: userEmail })
  };

  const operation = this.isEditMode && this.currentClauseId
    ? this.masterService.updateBlClauseById(this.currentClauseId, payload)
    : this.masterService.createNewBlClause(payload);

  operation.subscribe({
    next: (response: any) => {
      this.btnDisable = false;

      if (response.status) {
        
        this.appSettingService.showSuccess(response.message);
      } 
else {
        this.appSettingService.showError(response.message);
      }


      this.modalService.dismissAll();
      this.loadAllClauses();
    },
    error: (err) => {
      this.btnDisable = false;
      if (err.error?.message) {
        this.appSettingService.showError(err.error.message);
      } else {
        this.appSettingService.showError(
          `Error ${this.isEditMode ? 'updating' : 'creating'} BI Clause`
        );
      }
    }
  });
}


  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.blclauseData?.BLClauseMasterSid) return;
  
    this.masterService.getAuditLogsBlclause('BLClauseMaster', this.blclauseData?.BLClauseMasterSid.toString()).subscribe({
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

  deleteClause(id: number): void {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteBlclauseById(id).subscribe({
          next: () => {
            this.appSettingService.showSuccess("BI Clause deleted successfully!");
            this.loadAllClauses();
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
            this.appSettingService.showError('Failed to delete BI Clause');
          }
        });
      }
    });
  }

  resetPage(): void {
    // this.filterValue = '';
    // this.searchType = 'ClauseDescription';
    // this.page = 1;
    this.searchPerformed = false;
    this.allClauses = [];
    this.clauseList = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'ClauseDescription';
    this.sortDirection = 'asc';
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'bg-light-success' : 'bg-light-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  trackByClauseId(index: number, item: BLClause): number {
    return item.BLClauseMasterSid;
  }

  report(): void {
        const formattedData = this.clauseList.map(item => ({
            ...item,
            status : this.getStatusText(item.status)
        }));

        // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
        const companyName = this.currentCompany?.companyName ?? 'Company';
        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'ClauseDescription', label: 'Clause Description' },
                { key: 'Keyword', label: 'Keyword' },
                { key: 'Sortorder', label: 'Sort Order' },
                { key: 'status', label: 'Status' }
            ],
            fileName: 'Blclause-Report', 
            title: companyName
        });
    }

  showInfo() {
    if(!this.blclauseData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.blclauseData;
    modalRef.componentInstance.idLabel = 'BlClause Id';
    modalRef.componentInstance.idValue = this.blclauseData?.BLClauseMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.currentClauseId;

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
    if (!this.blclauseData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

openAuthority() {
  if (!this.blclauseData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.blclauseData;
  modalRef.componentInstance.idLabel = 'BLClause Id';
  modalRef.componentInstance.idValue = this.blclauseData?.BLClauseMasterSid;
}

openEDoc() {
  if (!this.blclauseData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.blclauseData;
  modalRef.componentInstance.idLabel = 'BLClause Id';
  modalRef.componentInstance.idValue = this.blclauseData?.BLClauseMasterSid;
}

}