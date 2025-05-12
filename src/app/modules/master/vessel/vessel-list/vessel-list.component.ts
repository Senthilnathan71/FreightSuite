import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-vessel-list',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    RouterModule
  ],
  templateUrl: './vessel-list.component.html',
  styleUrl: './vessel-list.component.scss'
})
export class VesselListComponent {
  searchType = 'VesselName';
  filterValue = '';
  results: any[] = [];
  vesselList: any[] = []
  searchPerformed = false;

  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;

  constructor(private masterService: MasterService, private router: Router,
    private appSettingService: AppSettingsService, private dialog: MatDialog
  ) { }
  ngOnInit() { }

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue,
    }
    this.masterService.searchVesselList(payload).subscribe((res: any) => {
      this.results = res;
      this.searchPerformed = true;
      this.updatePaginatedData();  // Update paginated data
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.vesselList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteVessel(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteVesselById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.router.navigate(['master/vessel/list'])
        });
      }
    });
  }

  navigateToCreateVessel() {
    this.router.navigate(['master/vessel/entry'])
  }

  resetPage() {
    this.vesselList = []
    this.totalLengthOfCollection = 0
  }

  report() { }

}
