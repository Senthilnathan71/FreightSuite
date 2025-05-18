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
  pageSize = 5;
  totalLengthOfCollection: number;
  searchText: string = '';
  filteredCountry: Country[] = [];
  isMobile: boolean = false;
  constructor(private masterService: MasterService, private route: Router, private appService: AppService, private dialog: MatDialog, private appSettingService: AppSettingsService) { }

  ngOnInit(): void {
    this.loadCountry();
    this.isMobile = this.appService.getDevice();
  }
  createNew() {
    this.route.navigate(['master/country/entry'])
  }

  loadCountry() {
    this.masterService.getAllCountry().subscribe(
      (resp: Country[]) => {
        this.countries = resp['data'];
        console.log(this.countries);
        this.filteredCountry = [...this.countries];
        this.totalLengthOfCollection = this.countries.length || 0;
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading ports:', error);
      }
    );
  }


  searchCountry(): void {
    const searchQuery = this.searchText?.toLowerCase().trim(); // Trim spaces and handle null/undefined

    if (!searchQuery) {
      this.filteredCountry = [...this.countries];
    } else {
      this.filteredCountry = this.countries.filter((country) => {
        return (
          country.countryName?.toLowerCase().includes(searchQuery) ||
          country.countryCode?.toLowerCase().includes(searchQuery) ||
          country.dialingCode?.toLowerCase().includes(searchQuery) ||
          country.ISO3DigitCode?.toLowerCase().includes(searchQuery) ||
          country.UNM49Code?.toLowerCase().includes(searchQuery) ||
          country.AWBCurrencyCode?.toLowerCase().includes(searchQuery) ||
          country.Remarks?.toLowerCase().includes(searchQuery) ||
          (country.status === 'A' ? 'Active' : 'Cancelled').toLowerCase().includes(searchQuery)
        );
      });
    }
  }

  deleteCountry(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteCountryById(id).subscribe((resp: any) => {

          this.appSettingService.showSuccess("Deleted!");
          console.log(resp);
          // if(resp.status){
          this.loadCountry();

          // }

        });
      }
    });
  }

}
