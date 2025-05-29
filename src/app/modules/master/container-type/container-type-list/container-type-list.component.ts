import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { forkJoin } from 'rxjs';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-container-type-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FeatherModule,
    NgbPaginationModule
  ],
  templateUrl: './container-type-list.component.html',
  styleUrl: './container-type-list.component.scss'
})
export class ContainerTypeListComponent {
  searchType = 'ContainerName';
  filterValue = '';
  results: any[] = [];
  containerList: any[] = [];
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
  ) { }

  ngOnInit() { }

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue
    }

    this.masterService.searchContainerType(payload).subscribe((res: any) => {
      this.results = res;
      this.searchPerformed = true;
      this.updatePaginatedData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.containerList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteContainerType(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteContainerTypeById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.router.navigate(['master/container-type/list'])
          this.search();
        });
      }
    });
  }

  navigateToaddNewContainerType() {
    this.router.navigate(['master/container-type/entry']);
  }

  resetPage(): void {
    this.containerList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
  }

  report() { }
}
