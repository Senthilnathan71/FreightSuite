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

@Component({
  selector: 'app-city-list',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './city-list.component.html',
  styleUrl: './city-list.component.scss'
})
export class CityListComponent {
  cities: any
  searchText: string = ''
  filterCityList: any[] = []
  totalLengthofCollection: number = 0
  countryList: any
  stateList: any
  constructor(private masterService: MasterService, private router: Router, private dialog: MatDialog, private appSettingService: AppSettingsService) { }
  ngOnInit() {
    this.loadCity()
  }

  loadCity() {
    forkJoin({
      countries: this.masterService.getAllCountry(),
      states: this.masterService.getAllState(),
      city: this.masterService.getAllCity()
    }).subscribe(({ countries, states, city }) => {
      this.countryList = countries.data;  // assuming res.data format
      this.stateList = states.data;
      this.cities = city.map(city => {
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
  deleteCountry(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteCountryById(id).subscribe((resp: any) => {

          this.appSettingService.showSuccess("Deleted!");
          console.log(resp);
          // if(resp.status){  
          // }
          this.loadCity()
        });
      }
    });
  }



  // searchDepartmentsData() {
  //   const searchQuery = this.searchText.toLowerCase().trim()
  //   if (!searchQuery) {
  //     this.cities = []
  //     this.filterCityList = []
  //     this.totalLengthofCollection = 0
  //   } else {
  //     this.loadDepartments(searchQuery)
  //   }
  // }

  // applySearch(searchQuery: string): void {
  //   this.filterCityList = this.cities.filter((city) => {
  //     return (
  //       city.cityCode?.toLowerCase().includes(searchQuery) ||
  //       city.cityName?.toLowerCase().includes(searchQuery)
  //     )
  //   })
  //   this.totalLengthofCollection = this.filterCityList.length || 0
  // }

  navigateToCreateCity() {
    this.router.navigate(['master/city/entry'])
  }

}
