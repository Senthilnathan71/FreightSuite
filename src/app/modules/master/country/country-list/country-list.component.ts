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
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';

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
    MatButtonModule,
    ListpageComponent
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
  userData: any;
  sortColumn: string = 'countryName'; 
  sortDirection: string = 'asc';

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;
  isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  
  constructor(
    private masterService: MasterService,
    private route: Router,
    private appService: AppService,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit(): void {
    this.appSettingService.getUser().subscribe(user => {
    if (user) {
      this.userData = user;
    }
  });
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

  onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}
sort(column: string) {
  if (this.sortColumn === column) {
    // Reverse the sort direction if clicking the same column
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new sort column and default to ascending
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }
  
  this.applySorting();
  this.updatePaginatedData();
}

applySorting() {
  this.allCountries.sort((a, b) => {
    let valueA = a[this.sortColumn];
    let valueB = b[this.sortColumn];
    
    // Handle null/undefined values
    if (valueA == null) valueA = '';
    if (valueB == null) valueB = '';
    
    // Convert to string for case-insensitive comparison
    valueA = valueA.toString().toLowerCase();
    valueB = valueB.toString().toLowerCase();
  
    if (valueA < valueB) {
      return this.sortDirection === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return this.sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
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
      const countries = res.data || res;
      
      // Create lookup maps
      const zoneMap = this.zoneOptions.reduce((acc, zone) => {
        acc[zone.ZoneMasterSid] = zone.ZoneName;
        return acc;
      }, {});

      const currencyMap = this.currencyOptions.reduce((acc, currency) => {
        acc[currency.CurrencyMasterSid] = currency.currencyName || currency.CurrencyName;
        return acc;
      }, {});

      // Map data with additional fields
      this.allCountries = countries.map(country => ({
        ...country,
        zoneName: zoneMap[country.ZoneMasterSid] || '-',
        currencyName: currencyMap[country.CurrencyMasterSid] || '-'
      }));

      // Apply sorting after data load
      this.applySorting();
      
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
    this.sortColumn = 'countryName';
    this.sortDirection = 'asc';
  }

  report(): void {
  const formattedData = this.countryList.map(item => ({
    ...item,
    status: item.status === 'A' ? 'Active' : 'Suspended'
  }));

  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'countryName', label: 'Country Name' },
      { key: 'countryCode', label: 'Country Code' },
      { key: 'zoneName', label: 'Zone' },
      { key: 'currencyName', label: 'Currency' },
      { key: 'status', label: 'Status' }
    ],
    fileName: 'Country-Report', 
    title: companyName
  });
}
}