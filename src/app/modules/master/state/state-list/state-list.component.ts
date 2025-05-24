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

@Component({
  selector: 'app-state-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule
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

  search() {
    this.loading = true;
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'I'
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

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.stateList = this.allStates.slice(startIndex, endIndex);
  }

  trackByStateId(index: number, item: any): number {
    return item.StateMasterSid;
  }

  deleteState(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.softDelete(id).subscribe({ // Changed to softDeleteState for clarity
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
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }
  report(){
    
  }
}