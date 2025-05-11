import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

interface Currency {
roundOff: any;
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
    MatDialogModule
  ],
  templateUrl: './currency-list.component.html',
  styleUrl: './currency-list.component.scss'
})
export class CurrencyListComponent implements OnInit {
  currencies: Currency[] = [];
  searchText: string = '';
  filteredCurrencies: Currency[] = [];
  totalLength: number = 0;
  loading: boolean = false;
  errorMessage: string = '';

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
        this.totalLength = this.currencies.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading currencies:', err);
        this.appSettingService.showError('Failed to load currencies');
        this.loading = false;
      }
    });
  }

  deleteCurrency(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteCurrencyById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Currency deleted successfully!");
            this.loadCurrencies();
          },
          error: (err) => {
            console.error('Error deleting currency:', err);
            this.appSettingService.showError("Failed to delete currency");
          }
        });
      }
    });
  }

  navigateToCreateCurrency() {
    this.router.navigate(['master/currency/entry']);
  }

  filterCurrencies() {
    if (!this.searchText) {
      this.filteredCurrencies = [...this.currencies];
      this.errorMessage = '';
      return;
    }

    this.filteredCurrencies = this.currencies.filter(currency =>
      currency.currencyName.toLowerCase().includes(this.searchText.toLowerCase()) ||
      currency.currencyCode.toLowerCase().includes(this.searchText.toLowerCase()) ||
      (currency.countryName && currency.countryName.toLowerCase().includes(this.searchText.toLowerCase()))
    );
    
    this.errorMessage = this.filteredCurrencies.length === 0 ? 
      'No matching currency found.' : '';
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }
}