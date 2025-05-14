import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-currency-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    NgbPaginationModule, 
    RouterModule,
    MatDialogModule
  ],
  templateUrl: './currency-list.component.html',
  styleUrl: './currency-list.component.scss'
})
export class CurrencyListComponent {
  searchType = 'currencyName';
  filterValue = '';
  results: any[] = [];
  currencyList: any[] = [];
  errorMessage: string = '';
  searchPerformed = false;

  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number = 0;
  loading: boolean = false;

  constructor(
    private masterService: MasterService, 
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['refresh']) {
        this.loadCurrencies();
      }
    });
    this.loadCurrencies();
  }

  loadCurrencies() {
    this.loading = true;
    this.masterService.getAllCurrency().subscribe({
      next: (resp: any) => {
        this.results = resp.data || resp;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
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
    this.filterValue = this.filterValue?.trim();
    
    if (!this.filterValue) {
      this.loadCurrencies();
      this.page = 1;
      this.searchPerformed = false;
      return;
    }
    
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'I' 
        : this.filterValue,
    }
    
    this.loading = true;
    this.page = 1;
    this.masterService.searchCurrencyList(payload).subscribe({
      next: (res: any) => {
        this.results = res.data || res;
        this.searchPerformed = true;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error searching currencies:', err);
        this.appSettingService.showError('Failed to search currencies');
        this.loading = false;
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.currencyList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCurrency(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
  
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteCurrencyById(id).subscribe({
          next: (resp: any) => {
            if (resp && (resp.success || resp.status)) { // Modified check
              this.appSettingService.showSuccess("Currency deleted successfully!");
              this.loadCurrencies();
            } else {
              this.appSettingService.showError(resp.message || "Failed to delete Currency");
            }
            this.loading = false;
          },
          error: (err) => {
            console.error('Error deleting Currency:', err);
            this.appSettingService.showError(err.error?.message || "Failed to delete Currency");
            this.loading = false;
          }
        });
      }
    });
  }
  
  navigateToCreateCurrency() {
    this.router.navigate(['master/currency/entry']);
  }

  resetSearch() {
    this.searchType = 'currencyName';
    this.filterValue = '';
    this.searchPerformed = false;
    this.page = 1;
    this.loadCurrencies();
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }
}