import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-state-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    NgbPaginationModule, 
    RouterModule,
    MatDialogModule
  ],
  templateUrl: './state-list.component.html',
  styleUrl: './state-list.component.scss'
})
export class StateListComponent {
  searchType = 'stateName';
  filterValue = '';
  results: any[] = [];
  stateList: any[] = [];
  searchPerformed = false;
  loading: boolean = false;

  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;

  constructor(
    private masterService: MasterService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit() {
    this.loadState();
  }

  loadState() {
    this.loading = true;
    this.masterService.getAllState().subscribe({
      next: (res: any) => {
        this.results = res.data;
        this.totalLengthOfCollection = this.results.length;
        this.updatePaginatedData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading states:', err);
        this.appSettingService.showError('Failed to load states');
        this.loading = false;
      }
    });
  }

  search() {
    if (!this.filterValue) {
      this.loadState();
      this.searchPerformed = false;
      return;
    }

    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'I' 
        : this.filterValue,
    };

    this.loading = true;
    this.masterService.searchStateList(payload).subscribe({
      next: (res: any) => {
        this.results = res.data || res;
        this.searchPerformed = true;
        this.totalLengthOfCollection = this.results.length;
        this.updatePaginatedData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error searching states:', err);
        this.appSettingService.showError('Failed to search states');
        this.loading = false;
      }
    });
  }

  resetSearch() {
    this.searchType = 'stateName';
    this.filterValue = '';
    this.searchPerformed = false;
    this.page = 1;
    this.loadState();
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.stateList = this.results.slice(startIndex, endIndex);
  }

  deleteState(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteStateById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("State deleted successfully!");
            this.loadState();
          },
          error: (err) => {
            console.error('Error deleting state:', err);
            this.appSettingService.showError("Failed to delete state");
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateState() {
    this.router.navigate(['master/state/entry']);
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
}