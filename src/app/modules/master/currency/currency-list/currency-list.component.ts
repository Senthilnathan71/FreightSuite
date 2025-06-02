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

@Component({
  selector: 'app-currency-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule
  ],
  templateUrl: './currency-list.component.html',
  styleUrl: './currency-list.component.scss'
})
export class CurrencyListComponent {
  searchType = 'currencyName';
  filterValue = '';
  results: any[] = [];
  allCurrencies: any[] = []; // Renamed from results to allCurrencies for consistency
  currencyList: any[] = [];
  searchPerformed = false;
  loading: boolean = false;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;

  // sorting
  sortColumn: string = 'currencyName'; // default sort column
  sortDirection: string = 'asc'; // default sort direction

  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog
  ) { }

  ngOnInit() { }

  search() {
    this.loading = true;
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue,
    };

    this.masterService.searchCurrencyList(payload).subscribe({
      next: (res: any) => {
        this.allCurrencies = res.data || res;
        this.applySorting(); // Apply sorting after getting new data
        this.searchPerformed = true;
        this.totalLengthOfCollection = this.allCurrencies.length;
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
    this.allCurrencies.sort((a, b) => {
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
    this.currencyList = this.allCurrencies.slice(startIndex, endIndex);
  }

  trackByCurrencyId(index: number, item: any): number {
  return item.CurrencyMasterSid;
}

  deleteCurrency(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.softDelete(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Currency deleted successfully!");
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

  navigateToCreateCurrency() {
    this.router.navigate(['master/currency/entry']);
  }

  resetPage() {
    this.filterValue = '';
    this.searchType = 'currencyName';
    this.page = 1;
    this.searchPerformed = false;
    this.currencyList = [];
    this.allCurrencies = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'currencyName';
    this.sortDirection = 'asc';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  report() {
    // Implement report functionality here
  }
}