import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from 'src/app/modules/master/master.service';

@Component({
  selector: 'app-sector-list',
  standalone: true,
  imports: [CommonModule, FeatherModule, FormsModule, NgbPaginationModule, RouterModule],
  templateUrl: './sector-list.component.html',
  styleUrl: './sector-list.component.scss'
})
export class SectorListComponent {
  searchType = 'sectorName';
  filterValue = '';
  results: any[] = [];
  sectorList: any[] = [];
  searchPerformed = false;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;

  constructor(
    private masterService: MasterService, 
    private router: Router,
    private appSettingService: AppSettingsService, 
    private dialog: MatDialog
  ) { }

  ngOnInit() { }

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue,
    }
    this.masterService.searchSectors(payload).subscribe((res: any) => {
      this.results = res;
      this.searchPerformed = true;
      this.updatePaginatedData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.sectorList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteSector(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteSector(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.search();
        });
      }
    });
  }

  navigateToCreateSector() {
    this.router.navigate(['master/sector/entry']);
  }

  navigateToEditSector(id: number) {
    this.router.navigate(['master/sector/entry', id]);
  }

  resetPage() {
    this.sectorList = [];
    this.totalLengthOfCollection = 0;
    this.filterValue = '';
    this.searchType = 'sectorName';
  }

  report() { }
}