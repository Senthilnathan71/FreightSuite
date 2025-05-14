import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-city-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    MatDialogModule
  ],
  templateUrl: './city-list.component.html',
  styleUrl: './city-list.component.scss'
})
export class CityListComponent {
  searchType = 'cityName';
  filterValue = '';
  results: any[] = [];
  cityList: any[] = [];
  searchPerformed = false;
  loading: boolean = false;
  errorMessage: string = '';
  countryList: any[] = [];
  stateList: any[] = [];

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;

  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit() {
    this.loadCity();
  }

  loadCity() {
    this.loading = true;
    this.masterService.getAllCity().subscribe({
      next: (resp: any) => {
        this.results = resp.data || resp;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading cities:', err);
        this.appSettingService.showError('Failed to load cities');
        this.loading = false;
      }
    });
  }

  search() {
    if (!this.filterValue.trim()) {
      this.loadCity();
      this.searchPerformed = false;
      return;
    }

    this.loading = true;
    this.page = 1; // Reset to first page when searching
    
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue
    };

    // If searching by status, convert the display text to status code
    if (this.searchType === 'status') {
      payload.filterValue = this.filterValue === 'Active' ? 'A' : 'I';
    }

    this.masterService.searchCityList(payload).subscribe({
      next: (res: any) => {
        this.results = res.data || res;
        this.searchPerformed = true;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error searching cities:', err);
        this.appSettingService.showError('Failed to search cities');
        this.loading = false;
      }
    });
  }

  resetSearch() {
    this.searchType = 'cityName';
    this.filterValue = '';
    this.searchPerformed = false;
    this.page = 1;
    this.loadCity();
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.cityList = this.results.slice(startIndex, endIndex);
  }

  deleteCity(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteCityById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("City deleted successfully!");
            this.loadCity();
          },
          error: (err) => {
            console.error('Error deleting city:', err);
            this.appSettingService.showError("Failed to delete city");
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateCity() {
    this.router.navigate(['master/city/entry']);
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
}