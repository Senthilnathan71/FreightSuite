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
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

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
    ListpageComponent,
    FavoriteStarComponent
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
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // pagination
  page = 1;
  pageSize = 15;
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
  //   this.appSettingService.getUser().subscribe(user => {
  //   if (user) {
  //     this.userData = user;
  //     this.checkPermissions();
  //   }
  // });
  const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
    this.loadZones();
    this.loadCurrencies();
    this.loadCountries();
  }
  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId)
    console.log(userRole)
    if (currentMenuId && userRole) {
     this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
  next: (response) => {
    this.currentMenuPermissions = response.data.MenuPermissions || {};
    this.permissions = Object.keys(this.currentMenuPermissions)
      .filter(key => this.currentMenuPermissions[key] === 'isTrue');
      console.log(this.permissions)
  }
});
    }
  }
 
  hasPermission(permission: string): boolean {
  return this.permissions.includes(permission);
}
  loadCountries(): void {
  this.loading = true;
  
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize,
    sortColumn: this.sortColumn,
    sortDirection: this.sortDirection
  };

  this.masterService.searchCountries(params).subscribe({
    next: (response) => {
      if(response) {
        // Create lookup maps
        const zoneMap = this.zoneOptions.reduce((acc, zone) => {
          acc[zone.ZoneMasterSid] = zone.ZoneName;
          return acc;
        }, {});

        const currencyMap = this.currencyOptions.reduce((acc, currency) => {
          acc[currency.CurrencyMasterSid] = currency.currencyName || currency.CurrencyName;
          return acc;
        }, {});

        // Map the response data with zone and currency names
        this.countryList = (response.items || response.data || response).map((country: any) => ({
          ...country,
          zoneName: zoneMap[country.ZoneMasterSid] || '-',
          currencyName: currencyMap[country.CurrencyMasterSid] || '-'
        }));

        this.totalLengthOfCollection = response.totalCount || response.length || 0;
        this.applySorting();
        this.searchPerformed = true;
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Error fetching countries:', err);
      this.countryList = [];
      this.totalLengthOfCollection = 0;
      this.loading = false;
    }
  });
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

  
sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    //  this.page = 1;
    this.loadCountries();
  }

 applySorting() {
    this.countryList.sort((a, b) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];

      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }


  

  updatePaginatedData() {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadCountries();
  }
  clearFilterValue() {
    this.filterValue = '';
    this.loadCountries();
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