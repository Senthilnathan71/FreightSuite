import { Component, OnInit } from '@angular/core';
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
    PreventMultiClickDirective
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
  // Pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  
  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  currentMenuId: number;
  TandCList: any[]=[];

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService
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
    
       this.appSettingService.getUser().subscribe(user => {
    if(user) {
      this.userData = user;
    }
  });
  this.loadAllClauses();
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
  this.loading = true;
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize
  };

  this.masterService.searchBlclauselList(params).subscribe({
    next: (response) => {
      if(response.data) {
        
        this.allClauses = response.data.items;
        this.applySorting();
        this.updatePaginatedData();
        this.clauseList = [...this.allClauses];
        this.totalLengthOfCollection = response.data.totalCount;
        
      } else {
        this.allClauses = [];
        this.clauseList = []; 
        this.totalLengthOfCollection = 0;
      }
      
      this.searchPerformed = true;
      this.loading = false;
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
      ...(this.isEditMode ? {updatedBy : userEmail} : {createdBy : userEmail})
    };

    const operation = this.isEditMode && this.currentClauseId
      ? this.masterService.updateBlClauseById(this.currentClauseId, payload)
      : this.masterService.createNewBlClause(payload);

    operation.subscribe({
      next: () => {
        this.btnDisable = false;
        const message = this.isEditMode 
          ? 'BI Clause updated successfully!' 
          : 'BI Clause created successfully!';
        
        this.appSettingService.showSuccess(message);
        this.modalService.dismissAll();
      
      },
      error: (err) => {
        this.btnDisable = false;
        const errorMessage = err.error?.message || 
          `Error ${this.isEditMode ? 'updating' : 'creating'} BI Clause`;
        this.appSettingService.showError(errorMessage);
      }
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

        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

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