import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-city-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    RouterModule,
    NgbPaginationModule
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
  countryList: any[] = [];
  stateList: any[] = [];

  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;

  constructor(
    private masterService: MasterService, 
    private router: Router,
    private appSettingService: AppSettingsService, 
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.loadCountryAndStateData();
  }

  loadCountryAndStateData() {
    forkJoin({
      countries: this.masterService.getAllCountry(),
      states: this.masterService.getAllState(),
      city: this.masterService.getAllCity()
    }).subscribe(({ countries, states, city }) => {
      this.countryList = countries.data;  // assuming res.data format
      this.stateList = states.data;
      this.cityList = city.map(city => {
        const country = this.countryList.find(c => c.CountryMasterSid === city.CountryMasterSid);
        const state = this.stateList.find(s => s.StateMasterSid === city.StateMasterSid);
        return {
          ...city,
          countryName: country ? country.countryName : '',
          stateName: state ? state.stateName : ''
        };
      });
    });
  }

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'I' 
        : this.filterValue,
    }
    
    this.masterService.searchCityList(payload).subscribe((res: any) => {
      this.results = res.map(city => {
        const country = this.countryList.find(c => c.CountryMasterSid === city.CountryMasterSid);
        const state = this.stateList.find(s => s.StateMasterSid === city.StateMasterSid);
        return {
          ...city,
          countryName: country ? country.countryName : '',
          stateName: state ? state.stateName : ''
        };
      });
      this.searchPerformed = true;
      this.updatePaginatedData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.cityList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCity(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteCityById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.search(); // Refresh the list after deletion
        });
      }
    });
  }

  navigateToCreateCity() {
    this.router.navigate(['master/city/entry']);
  }

  resetPage() {
    this.cityList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
  }
}