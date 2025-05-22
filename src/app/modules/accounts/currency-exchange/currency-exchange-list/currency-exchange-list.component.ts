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
  results: any[] = [];
  loading: boolean = false;
  currencyExchangeList: any[] = [];
  searchPerformed = false;

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
    this.loadCurrencyExchangeData();
  }

  loadCurrencyExchangeData() {
    this.accountService.getAllCurrencyExchange().subscribe((res: any) => {
      this.currencyExchangeList = res;
      this.totalLengthOfCollection = this.currencyExchangeList.length;
    });
  }

  // Fix the search payload to match backend expectations
search() {
  this.loading = true;
  const payload = {
    searchType: this.searchType,
    filterValue: this.searchType === 'status' 
      ? this.filterValue === 'Active' ? 'A' : 'I'
      : this.filterValue
  };
  
  this.accountService.searchCurrencyExchangeList(payload).subscribe((res: any) => {
    this.results = res;
    this.searchPerformed = true;
    this.updatePaginatedData();
    this.totalLengthOfCollection = this.results.length || 0;
    this.loading = false;
  }, () => {
    this.loading = false;
  });
}

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.currencyExchangeList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCurrencyExchange(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.accountService.deleteCurrencyExchangeById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.search(); // Refresh the list after deletion
        });
      }
    });
  }

  navigateToCreateCurrencyExchange() {
    this.router.navigate(['accounts/currency-exchange/entry']);
  }

  resetPage() {
    this.currencyExchangeList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}