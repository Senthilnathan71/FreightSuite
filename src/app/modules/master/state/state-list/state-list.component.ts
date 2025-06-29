import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { forkJoin } from 'rxjs';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-state-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    ListpageComponent,
    FavoriteStarComponent
  ],
  templateUrl: './state-list.component.html',
  styleUrl: './state-list.component.scss'
})
export class StateListComponent {
  searchType = 'stateName';
  filterValue = '';
  stateList: any[] = [];
  allStates: any[] = [];
  searchPerformed = false;
  loading: boolean = false;
  countryOptions: any[] = [];
  zoneOptions: any[] = [];
  userData: any;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;

  // sorting
  sortColumn: string = 'stateName'; // default sort column
  sortDirection: string = 'asc'; // default sort direction 
  
  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit() {
    this.appSettingService.getUser().subscribe(user => {
    if (user) {
      this.userData = user;
    }
  });
    this.loadCountries();
    this.loadZones();
  }

  loadCountries() {
    this.loading = true;
    this.masterService.getAllCountry().subscribe({
      next: (res: any) => {
        this.countryOptions = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading countries:', err);
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

  onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}

  search() {
    this.loading = true;
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue
    };

    this.masterService.searchState(payload).subscribe({
      next: (res: any) => {
        this.allStates = (res.data || res).map(state => {
          const country = this.countryOptions.find(c => c.CountryMasterSid === state.CountryMasterSid);
          const zone = this.zoneOptions.find(z => z.ZoneMasterSid === state.ZoneMasterSid);
          return {
            ...state,
            countryName: country ? country.countryName : 'N/A',
            zoneName: zone ? zone.ZoneName : 'N/A' 
          };
        });
        
        // Apply sorting after loading new data
        this.applySorting();
        
        this.stateList = [...this.allStates];
        this.totalLengthOfCollection = this.stateList.length;
        this.searchPerformed = true;
        this.page = 1;
        this.updatePaginatedData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.loading = false;
      }
    });
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
    this.allStates.sort((a, b) => {
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

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.stateList = this.allStates.slice(startIndex, endIndex);
  }

  trackByStateId(index: number, item: any): number {
    return item.StateMasterSid;
  }

  softDelete(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.softDelete(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("State deleted successfully!");
            this.search(); // Refresh search results
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateState() {
    this.router.navigate(['master/state/entry']);
  }

  resetPage() {
    this.filterValue = '';
    this.searchType = 'stateName';
    this.page = 1;
    this.searchPerformed = false;
    this.stateList = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'stateName';
    this.sortDirection = 'asc';
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  report(): void {
  const formattedData = this.stateList.map(item => ({
    ...item,
    status: item.status === 'A' ? 'Active' : 'Suspended'
  }));

  
  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'stateName', label: 'State Name' },
      { key: 'stateCode', label: 'State Code' },
      { key: 'stateGSTCode', label: 'GST Code' },
      { key: 'countryName', label: 'Country' },
      { key: 'zoneName', label: 'Zone' },
      { key: 'status', label: 'Status' }
    ],
    fileName: 'State-Report',
    title: companyName
  });
}
}