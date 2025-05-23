import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Country } from 'src/app/modules/crm-mobile/Interfaces/country.interface';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';

@Component({
  selector: 'app-country-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './country-list.component.html',
  styleUrl: './country-list.component.scss'
})
export class CountryListComponent {
  countries: Country[] = [];
  errorMessage: string = '';
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;
  searchType = 'countryName'
  filterValue: string = '';
  filteredCountry: Country[] = [];
  isMobile: boolean = false;
  constructor(private masterService: MasterService, private route: Router, private appService: AppService, private dialog: MatDialog, private appSettingService: AppSettingsService) { }

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice();
  }
  createNew() {
    this.route.navigate(['master/country/entry'])
  }


  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue,
    }
    this.masterService.searchCountries(payload).subscribe((res: any) => {
      this.countries = res;
      this.updatePaginatedData();
      this.totalLengthOfCollection = this.countries.length || 0;
    });
  }
  updatePaginatedData() {
    
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredCountry = this.countries.slice(startIndex, endIndex);
  }

  deleteCountry(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteCountryById(id).subscribe((resp: any) => {

          this.appSettingService.showSuccess("Deleted!");
          console.log(resp);
          this.search();

        });
      }
    });
  }
  reset(){
    this.filteredCountry = [];
    this.totalLengthOfCollection = 0
  }
}
