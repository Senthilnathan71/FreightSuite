import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { PackageType } from 'src/app/modules/crm-mobile/Interfaces/packageType.interface';
import { MasterService } from '../../master.service';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';

@Component({
  selector: 'app-package-type-list',
  standalone: true,
  imports: [FeatherModule, FormsModule, RouterModule, CommonModule, NgbPaginationModule, OnlyTextDirective],
  templateUrl: './package-type-list.component.html',
  styleUrl: './package-type-list.component.scss',
})
export class PackageTypeListComponent{
  results: any;
  packageList: any;
  searchType: string = 'PackageName';
  filterValue: any;
  searchText: ''
  
    // pagination values
  page = 1;
  pageSize = 10;
  totalNumberOfCollection: number;

  constructor(
    private masterService: MasterService,
    private route: Router,
    private matdig: MatDialog,
    private appSettingServ: AppSettingsService,
  ) { }

  navigateToEntry() {
    this.route.navigate(['master/package-type/entry']);
  }

  onSearch() {
    const intFields = [''];
    const payload = {
      searchType: this.searchType,
      filterValue: intFields.includes(this.searchType) ? Number(this.filterValue) : this.filterValue
    }
    this.masterService.searchPackageType(payload).subscribe(
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
    this.packageList = this.results.slice(start, end)
  }


  // delete Package Type

  async deletePackageTypeById(packageMasterSid: number) {
    const dialogRef = this.matdig.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(async (res) => {
      if (res) {
        this.masterService.deletePackageById(packageMasterSid).subscribe((res) => {
          this.appSettingServ.showSuccess("Deleted!");
          this.onSearch();
        });
      }
    });
  }

  report() { }

  reset() {
    this.packageList = [];
    this.totalNumberOfCollection = 0;
  }
}
