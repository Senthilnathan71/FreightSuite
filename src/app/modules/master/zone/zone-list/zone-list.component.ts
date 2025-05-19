import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { Zone } from 'src/app/modules/crm-mobile/Interfaces/zone.interface';
import { MasterService } from '../../master.service';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-zone-list',
  standalone: true,
  imports: [FeatherModule, FormsModule, RouterModule, CommonModule, NgbPaginationModule, OnlyTextDirective],
  templateUrl: './zone-list.component.html',
  styleUrl: './zone-list.component.scss',
})
export class ZoneListComponent {
  results: Zone[];
  zoneList: Zone[];
  searchType: string = 'ZoneName';
  filterValue: any;
  searchText: ''

  // pagination values
  page = 1;
  pageSize = 10;
  totalNumberOfCollection: number;

  constructor(
    private masterServ: MasterService,
    private matdig: MatDialog,
    private appSettingServ: AppSettingsService,
    private router: Router
  ) { }

  search() {
    const intFields = [''];
    const payload = {
      searchType: this.searchType,
      filterValue: intFields.includes(this.searchType) ? Number(this.filterValue) : this.filterValue
    }
    this.masterServ.searchZone(payload).subscribe(
      (res) => {
        this.results = res;
        this.updatePaginationData();
        this.totalNumberOfCollection = this.results.length || 0;
      }
    )
  }

  updatePaginationData() {
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
    this.zoneList = this.results.slice(start, end)
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  async deleteZone(zoneMasterSId: number) {
    const dialogRef = this.matdig.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.masterServ.deleteZone(zoneMasterSId).subscribe((res) => {
          this.appSettingServ.showSuccess("Deleted!");
          this.search();
        });
      }
    });
  }

  navigateToCreateZone() {
    this.router.navigate(['master/zone/entry']);
  }

  report() { }

  reset() {
    this.zoneList = [];
    this.totalNumberOfCollection = 0;
  }
}
