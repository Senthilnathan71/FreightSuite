import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AccountsService } from '../../accounts.service';

@Component({
  selector: 'app-currency-exchange-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    RouterModule,
    NgbPaginationModule
  ],
  templateUrl: './currency-exchange-list.component.html',
  styleUrl: './currency-exchange-list.component.scss'
})
export class CurrencyExchangeListComponent {
  searchType = 'FromCurrency';
  filterValue = '';
  allResults: any[] = []; // Store all results for pagination
  currencyExchangeList: any[] = []; // Store paginated results
  searchPerformed = false;
  loading: boolean = false;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;

  constructor(
    private accountService: AccountsService, 
    private router: Router,
    private appSettingService: AppSettingsService, 
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    // Initial load if needed
    // this.loadCurrencyExchangeData();
  }

  search() {

    this.loading = true;
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue
    };
    
    this.accountService.searchCurrencyExchangeList(payload).subscribe({
      next: (res: any) => {
        this.allResults = res.data || res || [];
        this.totalLengthOfCollection = this.allResults.length;
        this.searchPerformed = true;
        this.page = 1; // Reset to first page on new search
        this.updatePaginatedData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.allResults = [];
        this.currencyExchangeList = [];
        this.totalLengthOfCollection = 0;
        this.searchPerformed = true;
        this.loading = false;
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.currencyExchangeList = this.allResults.slice(startIndex, endIndex);
  }

  trackByExchangeId(index: number, item: any): number {
    return item.ExchangeRateSid; // Assuming there's an ID field
  }

  deleteCurrencyExchange(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.accountService.deleteCurrencyExchangeById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Currency exchange deleted successfully!");
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

  navigateToCreateCurrencyExchange() {
    this.router.navigate(['accounts/currency-exchange/entry']);
  }

  resetPage() {
    this.filterValue = '';
    this.searchType = 'FromCurrency';
    this.page = 1;
    this.searchPerformed = false;
    this.allResults = [];
    this.currencyExchangeList = [];
    this.totalLengthOfCollection = 0;
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }
  report(){

  }
}