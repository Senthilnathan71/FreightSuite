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
      DefaultClause: ['', [Validators.pattern('^[0-9]*$')]],
      status: [{value: 'A', disabled: false}, Validators.required]
    });
  }
  

  ngOnInit(): void {
        this.appSettingService.getUser().subscribe(
            user=>{
                if(user){
                    this.userData = user;
                }
            }
        )
      }

  onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}

  search(): void {
    this.loading = true;
    
    if (!this.filterValue.trim()) {
      // If empty search, load all clauses (like state-list does)
      this.loadAllClauses();
      return;
    }

    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'I'
        : this.filterValue
    };

    this.masterService.searchBlclause(payload).subscribe({
      next: (res) => {
        this.allClauses = res;
        this.totalLengthOfCollection = this.allClauses.length;
        this.searchPerformed = true;
        this.page = 1;
        this.updatePaginatedData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.loading = false;
        this.appSettingService.showError('Failed to search BI Clauses');
      }
    });
  }

  loadAllClauses(): void {
    this.loading = true;
    this.masterService.getAllBlClause().subscribe({
      next: (res) => {
        this.allClauses = res;
        this.totalLengthOfCollection = this.allClauses.length;
        this.searchPerformed = true;
        this.page = 1;
        this.updatePaginatedData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading clauses:', err);
        this.loading = false;
        this.appSettingService.showError('Failed to load BI Clauses');
      }
    });
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
        DefaultClause: clause.DefaultClause?.toString() || '',
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
      DefaultClause: formValue.DefaultClause ? parseInt(formValue.DefaultClause) : null,
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
        this.search(); // Refresh current view
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
            this.search(); // Refresh current view
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

}