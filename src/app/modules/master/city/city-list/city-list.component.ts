import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

interface City {
  CityMasterSid: number;
  cityName: string;
  cityCode: string;
  CountryMasterSid: number;
  StateMasterSid: number;
  status: string;
  countryName?: string;
  stateName?: string;
} 

@Component({
  selector: 'app-city-list',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    FormsModule,
    MatDialogModule,
    NgbPaginationModule
  ],
  templateUrl: './city-list.component.html',
  styleUrl: './city-list.component.scss'
})
export class CityListComponent {
  searchType = 'cityName';
  searchText: string = '';
  cities: City[] = [];
  filteredCityList: City[] = [];
  searchPerformed = false;
  loading: boolean = false;
  errorMessage: string = '';
  totalLengthofCollection: number = 0;
  countryList: any;
  stateList: any;
  
  // Pagination properties
  page = 1;
  pageSize = 10;

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
    forkJoin({
      countries: this.masterService.getAllCountry(),
      states: this.masterService.getAllState(),
      city: this.masterService.getAllCity()
    }).subscribe(({ countries, states, city }) => {
      this.countryList = countries.data || countries;
      this.stateList = states.data || states;
      this.cities = city.map((city: any) => {
        const country = this.countryList.find((c: any) => c.CountryMasterSid === city.CountryMasterSid);
        const state = this.stateList.find((s: any) => s.StateMasterSid === city.StateMasterSid);
        return {
          ...city,
          countryName: country ? country.countryName : '',
          stateName: state ? state.stateName : ''
        };
      });
      this.filteredCityList = [...this.cities];
      this.totalLengthofCollection = this.cities.length;
      this.updatePaginatedData();
      this.loading = false;
    });
  }

  search() {
    if (!this.searchText) {
      this.filteredCityList = [...this.cities];
      this.errorMessage = '';
      this.searchPerformed = false;
      this.updatePaginatedData();
      return;
    }

    const searchValue = this.searchText.toLowerCase();
    this.filteredCityList = this.cities.filter(city => {
      switch(this.searchType) {
        case 'cityName':
          return city.cityName?.toLowerCase().includes(searchValue);
        case 'cityCode':
          return city.cityCode?.toLowerCase().includes(searchValue);
        case 'countryName':
          return city.countryName?.toLowerCase().includes(searchValue);
        case 'stateName':
          return city.stateName?.toLowerCase().includes(searchValue);
        case 'status':
          return this.getStatusText(city.status).toLowerCase().includes(searchValue);
        default:
          return true;
      }
    });
    
    this.errorMessage = this.filteredCityList.length === 0 ? 
      'No matching cities found.' : '';
    this.searchPerformed = true;
    this.totalLengthofCollection = this.filteredCityList.length;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredCityList = this.filteredCityList.slice(startIndex, endIndex);
  }

  resetSearch() {
    this.searchType = 'cityName';
    this.searchText = '';
    this.searchPerformed = false;
    this.page = 1;
    this.filteredCityList = [...this.cities];
    this.totalLengthofCollection = this.cities.length;
    this.updatePaginatedData();
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }

  deleteCity(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteCityById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("City deleted successfully!");
            this.loadCity();
          },
          error: (err) => {
            console.error('Error deleting city:', err);
            this.appSettingService.showError("Failed to delete city");
          }
        });
      }
    });
  }

  navigateToCreateCity() {
    this.router.navigate(['master/city/entry']);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
}