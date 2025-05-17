import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-state-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule
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
  countryOptions: any[] = [];
  countryInput$ = new Subject<string>();

  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;

  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit() { }

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status'
        ? this.filterValue === 'Active' ? 'A' : 'I'
        : this.filterValue,
    }

    this.masterService.searchState(payload).subscribe((res: any) => {
      this.results = res;
      this.searchPerformed = true;
      this.updatePaginatedData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.stateList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteState(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.softDeleteState(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.search(); // Refresh the current search results
        });
      }
    });
  }

  navigateToCreateState() {
    this.router.navigate(['master/state/entry']);
  }

  resetPage() {
    this.stateList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'stateName';
    this.page = 1;
  }

  report() {
    // Implement report functionality
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }
}