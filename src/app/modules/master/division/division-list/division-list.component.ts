import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { Division } from 'src/app/modules/crm-mobile/Interfaces/division.interface';

@Component({
  selector: 'app-division-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    NgbPaginationModule, 
    RouterModule],
  templateUrl: './division-list.component.html',
  styleUrl: './division-list.component.scss'
})
export class DivisionListComponent {
  searchType = 'divisionName'; 
  filterValue = '';
  results: any[] = [];
  divisionList: any[] = [];
  searchPerformed = false;

  // Pagination 
  page = 1;
  pageSize = 5;
  totalLengthOfCollection = 0;

  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {}

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue
    }

    this.masterService.searchDivisionList(payload).subscribe((res: any) => {
      this.results = res;
      this.searchPerformed = true;
      this.updatePaginatedData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.divisionList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteDivision(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteDivisionById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.router.navigate(['master/division/list'])
        });
      }
    });
  }

  navigateToCreateDivision() {
    this.router.navigate(['master/division/entry']);
  }

  resetPage(): void {
    this.divisionList = [];
    this.totalLengthOfCollection = 0;
  }

  report() {  }

}
