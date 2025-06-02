import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
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
  searchType = 'countryName';
  filterValue = '';
  countryList: any[] = [];
  allCountries: any[] = [];
  searchPerformed = false;
  loading: boolean = false;
  zoneOptions: any[] = [];
  currencyOptions: any[] = [];

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;

  constructor(
    private masterService: MasterService,
    private route: Router,
    private appService: AppService,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit(): void {
    this.loadZones();
    this.loadCurrencies();
  }

  loadZones() {
    this.loading = true;
    this.masterService.getAllZones().subscribe({
      next: (res: any) => {
        this.zoneOptions = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading zones:', err);
        this.loading = false;
      }
    });
  }

  loadCurrencies() {
    this.loading = true;
    this.masterService.getAllCurrencies().subscribe({
      next: (res: any) => {
        console.log('Currency API Response:', res);
        this.currencyOptions = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading currencies:', err);
        this.loading = false;
      }
    });
  }

  search() {
    this.loading = true;
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue
    };

    this.masterService.searchCountries(payload).subscribe({
      next: (res: any) => {
        console.log('Country API Response:', res);
        const countries = res.data || res;
        // Create lookup maps for zones and currencies
        const zoneMap = this.zoneOptions.reduce((acc, zone) => {
          acc[zone.ZoneMasterSid] = zone.ZoneName;
          return acc;
        }, {});

        const currencyMap = this.currencyOptions.reduce((acc, currency) => {
          const currencyName = currency.currencyName || currency.CurrencyName;
          acc[currency.CurrencyMasterSid] = currencyName;
          return acc;
        }, {});

        // Map the data with zone and currency names
        this.allCountries = countries.map(country => ({
          ...country,
          zoneName: zoneMap[country.ZoneMasterSid] || '-',
          currencyName: currencyMap[country.CurrencyMasterSid] || '-'
        }));

        this.updatePaginatedData();
        this.totalLengthOfCollection = this.allCountries.length;
        this.searchPerformed = true;
        this.loading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.loading = false;
      }
    });
  }

  updatePaginatedData() {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.countryList = this.allCountries.slice(startIndex, endIndex);
  }
  
  createNew() {
    this.route.navigate(['master/country/entry']);
  }

  deleteCountry(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteCountryById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Country deleted successfully!");
            this.search();
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  reset() {
    this.filterValue = '';
    this.searchType = 'countryName';
    this.page = 1;
    this.searchPerformed = false;
    this.countryList = [];
    this.totalLengthOfCollection = 0;
  }

  report() {
    // Report functionality implementation
  }
}