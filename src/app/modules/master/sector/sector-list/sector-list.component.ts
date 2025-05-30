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
  sectorList: any[] = [];
  allSectors: any[] = [];
  searchPerformed = false;
  loading: boolean = false;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;

  constructor(
    private masterService: MasterService, 
    private router: Router,
    private appSettingService: AppSettingsService, 
    private dialog: MatDialog
  ) { }

  ngOnInit() { }

  search() {
    this.loading = true;
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue
    };

    this.masterService.searchSectors(payload).subscribe({
      next: (res: any) => {
        this.allSectors = res.data || res;
        this.sectorList = [...this.allSectors];
        this.totalLengthOfCollection = this.sectorList.length;
        this.searchPerformed = true;
        this.page = 1;
        this.updatePaginatedData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.loading = false;
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.sectorList = this.allSectors.slice(startIndex, endIndex);
  }

  trackBySectorId(index: number, item: any): number {
    return item.SectorMasterSid || index;
  }

  deleteSector(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteSector(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Sector deleted successfully!");
            this.search(); // Refresh search results
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
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
    this.filterValue = '';
    this.searchType = 'sectorName';
    this.page = 1;
    this.searchPerformed = false;
    this.sectorList = [];
    this.totalLengthOfCollection = 0;
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  report() { }
}