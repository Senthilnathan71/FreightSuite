import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MasterService } from '../../master.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { BLClause } from 'src/app/modules/crm-mobile/Interfaces/biclause.interface';

@Component({
  selector: 'app-biclause',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    NgbPaginationModule
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

  // Pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'Inactive' }
  ];

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog
  ) {
    this.biclauseForm = this.fb.group({
      ClauseDescription: ['', [Validators.required, Validators.maxLength(500)]],
      Keyword: ['', [Validators.required, Validators.maxLength(5)]],
      Sortorder: ['', [Validators.pattern('^[0-9]*$')]],
      DefaultClause: ['', [Validators.pattern('^[0-9]*$')]],
      status: ['A', Validators.required]
    });
  }
  

  ngOnInit(): void {
    // Don't load all clauses initially - wait for search
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
      this.biclauseForm.patchValue({
        ClauseDescription: clause.ClauseDescription,
        Keyword: clause.Keyword,
        Sortorder: clause.Sortorder?.toString() || '',
        DefaultClause: clause.DefaultClause?.toString() || '',
        status: clause.status || 'A'
      });
    } else {
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
    if (this.biclauseForm.invalid) {
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    this.btnDisable = true;
    const formValue = this.biclauseForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    
    const payload: BLClause = {
      ClauseDescription: formValue.ClauseDescription,
      Keyword: formValue.Keyword,
      Sortorder: formValue.Sortorder ? parseInt(formValue.Sortorder) : null,
      DefaultClause: formValue.DefaultClause ? parseInt(formValue.DefaultClause) : null,
      status: formValue.status,
      createdBy: this.isEditMode ? '' : userEmail,
      updatedBy: this.isEditMode ? userEmail : undefined
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
    this.filterValue = '';
    this.searchType = 'ClauseDescription';
    this.page = 1;
    this.searchPerformed = false;
    this.allClauses = [];
    this.clauseList = [];
    this.totalLengthOfCollection = 0;
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'bg-light-success' : 'bg-light-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }

  trackByClauseId(index: number, item: BLClause): number {
    return item.BLClauseMasterSid;
  }

  report() {
    // Report implementation
  }
}