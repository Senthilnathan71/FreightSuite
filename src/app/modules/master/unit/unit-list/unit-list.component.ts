import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    NgbPaginationModule, 
    RouterModule,
    MatDialogModule
  ],
  templateUrl: './unit-list.component.html',
  styleUrl: './unit-list.component.scss'
})
export class UnitListComponent {
  searchType = 'unitName';
  filterValue = '';
  results: any[] = [];
  unitList: any[] = [];
  errorMessage: string = '';
  searchPerformed = false;
  isMobile: boolean = false;

  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number = 0;
  loading: boolean = false;

  constructor(
    private masterService: MasterService, 
    private router: Router,
    private appService: AppService,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit() {
    this.loadUnits();
    this.isMobile = this.appService.getDevice();
  }

  loadUnits() {
    this.loading = true;
    this.masterService.getAllUnits().subscribe({
      next: (resp: any) => {
        this.results = resp.data || resp;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading units:', err);
        this.appSettingService.showError('Failed to load units');
        this.loading = false;
      }
    });
  }

  search() {
    this.filterValue = this.filterValue?.trim();
    
    if (!this.filterValue) {
      this.loadUnits();
      this.page = 1;
      this.searchPerformed = false;
      return;
    }
    
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'C' 
        : this.filterValue,
    }
    
    this.loading = true;
    this.page = 1;
    this.masterService.searchUnitList(payload).subscribe({
      next: (res: any) => {
        this.results = res.data || res;
        this.searchPerformed = true;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error searching units:', err);
        this.appSettingService.showError('Failed to search units');
        this.loading = false;
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.unitList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteUnit(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteUnitById(id).subscribe((resp: any) => {

          this.appSettingService.showSuccess("Deleted!");
          console.log(resp);
          // if(resp.status){
          this.loadUnits();

          // }

        });
      }
    });
  }
  
  navigateToCreateUnit() {
    this.router.navigate(['master/unit/entry']);
  }

  resetSearch() {
    this.searchType = 'unitName';
    this.filterValue = '';
    this.searchPerformed = false;
    this.page = 1;
    this.loadUnits();
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Cancelled';
  }
}