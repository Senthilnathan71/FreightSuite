import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

interface State {
  StateMasterSid: number;
  stateName: string;
  stateCode: string;
  status: string;
  countryName: string;
  CountryMasterSid: number;
}

@Component({
  selector: 'app-state-list',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    FormsModule,
    MatDialogModule,
    NgbPaginationModule
  ],
  templateUrl: './state-list.component.html',
  styleUrl: './state-list.component.scss'
})
export class StateListComponent implements OnInit {
  searchType = 'stateName';
  searchText: string = '';
  filteredStateList: State[] = [];
  stateList: State[] = [];
  totalLengthofCollection: number = 0;
  countryList: any;
  loading: boolean = false;
  errorMessage: string = '';
  searchPerformed = false;

  // pagination
  page = 1;
  pageSize = 5;

  constructor(
    private masterService: MasterService, 
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit() {
    this.loadState();
    
    this.route.queryParams.subscribe(params => {
      if (params['refresh'] === 'true') {
        this.loadState();
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  loadState() {
    this.loading = true;
    forkJoin({
      countries: this.masterService.getAllCountry(),
      states: this.masterService.getAllState()
    }).subscribe({
      next: ({ countries, states }) => {
        this.countryList = countries.data || countries;
        this.stateList = (states.data || states).map((state: any) => {
          const country = this.countryList.find((c: any) => c.CountryMasterSid === state.CountryMasterSid);
          return {
            ...state,
            countryName: country ? country.countryName : ''
          };
        });
        this.filteredStateList = [...this.stateList];
        this.totalLengthofCollection = this.stateList.length;
        this.updatePaginatedData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading states:', err);
        this.appSettingService.showError('Failed to load states');
        this.loading = false;
      }
    });
  }

  search() {
    if (!this.searchText) {
      this.filteredStateList = [...this.stateList];
      this.errorMessage = '';
      this.searchPerformed = false;
      this.updatePaginatedData();
      return;
    }

    this.filteredStateList = this.stateList.filter(state => {
      const searchValue = this.searchText.toLowerCase();
      switch(this.searchType) {
        case 'stateName':
          return state.stateName.toLowerCase().includes(searchValue);
        case 'stateCode':
          return state.stateCode.toLowerCase().includes(searchValue);
        case 'countryName':
          return state.countryName && state.countryName.toLowerCase().includes(searchValue);
        case 'status':
          return this.getStatusText(state.status).toLowerCase().includes(searchValue);
        default:
          return true;
      }
    });
    
    this.errorMessage = this.filteredStateList.length === 0 ? 
      'No matching state found.' : '';
    this.searchPerformed = true;
    this.updatePaginatedData();
    this.totalLengthofCollection = this.filteredStateList.length;
  }
  resetSearch() {
    this.searchType = 'stateName';
    this.searchText = '';
    this.searchPerformed = false;
    this.page = 1;
    this.filteredStateList = [...this.stateList];
    this.totalLengthofCollection = this.stateList.length;
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredStateList = this.filteredStateList.slice(startIndex, endIndex);
  }

  deleteState(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteStateById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("State deleted successfully!");
            this.loadState();
            this.loading = false;
          },
          error: (err) => {
            console.error('Error deleting state:', err);
            this.appSettingService.showError("Failed to delete state");
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateState() {
    this.router.navigate(['master/state/entry']);
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
}