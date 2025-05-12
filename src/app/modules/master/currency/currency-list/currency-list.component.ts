import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

interface Currency {
  CurrencyMasterSid: any|string;
  subUnit: any;
  unit: any;
  currencyMasterSid: number;
  currencyCode: string;
  currencyName: string;
  currencyUnit: string;
  currencySubUnit: string;
  symbol: string;
  currencyRatio: number;
  amountDecimal: number;
  exchangeDecimal: number;
  status: string;
  countryName: string;
}

@Component({
  selector: 'app-currency-list',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    FormsModule,
    MatDialogModule,
    NgbPaginationModule
  ],
  templateUrl: './currency-list.component.html',
  styleUrl: './currency-list.component.scss'
})
export class CurrencyListComponent implements OnInit {
  searchType = 'currencyName';
  filterValue = '';
  currencies: Currency[] = [];
  filteredCurrencies: Currency[] = [];
  searchPerformed = false;
  loading: boolean = false;
  errorMessage: string = '';

  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number = 0;
  CurrencyList: any;

  constructor(
    private masterService: MasterService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit() {
    this.loadCurrencies();
    
    this.route.queryParams.subscribe(params => {
      if (params['refresh'] === 'true') {
        this.loadCurrencies();
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  loadCurrencies() {
    this.loading = true;
    this.masterService.getAllCurrency().subscribe({
      next: (resp: any) => {
        this.currencies = resp.data || resp;
        this.filteredCurrencies = [...this.currencies];
        this.totalLengthOfCollection = this.currencies.length;
        this.updatePaginatedData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading currencies:', err);
        this.appSettingService.showError('Failed to load currencies');
        this.loading = false;
      }
    });
  }

  search() {
    if (!this.filterValue) {
      this.filteredCurrencies = [...this.currencies];
      this.errorMessage = '';
      this.updatePaginatedData();
      return;
    }

    const searchValue = this.filterValue.toLowerCase();
  
    this.filteredCurrencies = this.currencies.filter(currency => {
      switch(this.searchType) {
        case 'currencyName':
          return currency.currencyName?.toLowerCase().includes(searchValue);
        case 'currencyCode':
          return currency.currencyCode?.toLowerCase().includes(searchValue);
        case 'symbol':
          return currency.symbol?.toLowerCase().includes(searchValue);
        case 'unit':
          return currency.unit?.toString().toLowerCase().includes(searchValue);
        case 'subUnit':
          return currency.subUnit?.toString().toLowerCase().includes(searchValue);
        case 'status':
          return this.getStatusText(currency.status).toLowerCase().includes(searchValue);
        case 'countryName':
          return currency.countryName?.toLowerCase().includes(searchValue);
        default:
          return true;
      }
    });
    
    this.errorMessage = this.filteredCurrencies.length === 0 ? 
      'No matching currency found.' : '';
    this.searchPerformed = true;
    this.updatePaginatedData();
    this.totalLengthOfCollection = this.filteredCurrencies.length;
  }
  // Add this method to your component class
resetSearch() {
  this.searchType = 'currencyName';
  this.filterValue = '';
  this.searchPerformed = false;
  this.page = 1;
  this.loadCurrencies(); // This will reload all currencies
}

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredCurrencies = this.filteredCurrencies.slice(startIndex, endIndex);
  }

  deleteCurrency(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteCurrencyById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Currency deleted successfully!");
            this.loadCurrencies();
            this.loading = false;
          },
          error: (err) => {
            console.error('Error deleting currency:', err);
            this.appSettingService.showError("Failed to delete currency");
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateCurrency() {
    this.router.navigate(['master/currency/entry']);
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