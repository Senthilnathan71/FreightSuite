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
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-currency-exchange-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    RouterModule,
    NgbPaginationModule,
    CustomDatePipe,
    FavoriteStarComponent
  ],
  templateUrl: './currency-exchange-list.component.html',
  styleUrl: './currency-exchange-list.component.scss'
})
export class CurrencyExchangeListComponent {
  searchType = 'FromCurrency';
  filterValue = '';
  allResults: any[] = []; // Store all results for pagination and sorting
  currencyExchangeList: any[] = []; // Store paginated results
  searchPerformed = false;
  loading: boolean = false;
  userData: any;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;

  // sorting
  sortColumn: string = 'EffectiveFrom'; // default sort column
  sortDirection: string = 'desc'; // default sort direction (newest first)
  isFavorite: boolean = false;
  // Company
  currentCompany : any;
  currentBranch : any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  
  constructor(
    private accountService: AccountsService, 
    private router: Router,
    private appSettingService: AppSettingsService, 
    private dialog: MatDialog,
    private excelReportService: ExcelExportService
  ) { }
  ngOnInit(): void {
  //    this.appSettingService.getUser().subscribe(user => {
  //   if (user) {
  //     this.userData = user;
  //   }
  // });
  this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
  this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
  const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
		}
  this.loadCurrencyExchanges();
}

loadCurrencyExchanges(): void {
  this.loading = true;
  let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  let BranchMasterSid=this.currentBranch?.BranchMasterSid;
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize,
    sortColumn: this.sortColumn,
    sortDirection: this.sortDirection,
    activeCompanyId : CompanyMasterSid,
    activeBranchId: BranchMasterSid,
  };

  this.accountService.searchCurrencyExchangeList(params).subscribe({
    next: (response) => {
      if(response) {
        this.currencyExchangeList = response.items || response.data || [];
        this.totalLengthOfCollection = response.totalCount || response.length || 0;
        this.applySorting();
        this.searchPerformed = true;
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Error fetching currency exchanges:', err);
      this.currencyExchangeList = [];
      this.totalLengthOfCollection = 0;
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
    this.loadCurrencyExchanges();
    this.applySorting();
    this.updatePaginatedData();
  }

  applySorting() {
    this.currencyExchangeList.sort((a, b) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];
      
      // Handle null/undefined values
      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';
      
      // Special handling for dates
      if (this.sortColumn === 'EffectiveFrom') {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }
      
      // Special handling for numeric values
      if (this.sortColumn === 'SellRate' || this.sortColumn === 'BuyRate') {
        valueA = Number(valueA);
        valueB = Number(valueB);
      }
      
      // Convert to string for case-insensitive comparison if not date/number
      if (typeof valueA !== 'number' && !(valueA instanceof Date)) {
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();
      }
      
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
  clearFilterValue() {
  this.filterValue = '';
  this.loadCurrencyExchanges();
}

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadCurrencyExchanges();
  }

  trackByExchangeId(index: number, item: any): number {
    return item.ExchangeRateSid || index;
  }

  // deleteCurrencyExchange(id: number) {
  //   const dialogRef = this.dialog.open(DeleteWarningComponent);
  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result === true) {
  //       this.loading = true;
  //       this.accountService.deleteCurrencyExchangeById(id).subscribe({
  //         next: (resp: any) => {
  //           this.appSettingService.showSuccess("Currency exchange deleted successfully!");
  //           this.search(); // Refresh search results
  //         },
  //         error: (err) => {
  //           console.error('Delete error:', err);
  //           this.loading = false;
  //         }
  //       });
  //     }
  //   });
  // }

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
    this.sortColumn = 'EffectiveFrom';
    this.sortDirection = 'desc';
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  report(): void {
  const formattedData = this.currencyExchangeList.map(item => ({
    ...item,
    status: item.status === 'A' ? 'Active' : 'Suspended',
    EffectiveFrom: this.formatDateForExport(item.EffectiveFrom),
    SellRate: this.formatNumberForExport(item.SellRate),
    BuyRate: this.formatNumberForExport(item.BuyRate)
  }));

  // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  const companyName = this.currentCompany?.companyName ?? 'Company';
  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'EffectiveFrom', label: 'Effective From' },
      { key: 'FromCurrency', label: 'From Currency' },
      { key: 'ToCurrency', label: 'To Currency' },
      { key: 'SellRate', label: 'Sell Rate' },
      { key: 'BuyRate', label: 'Buy Rate' },
      { key: 'BankName', label: 'Bank Name' },
      { key: 'status', label: 'Status' }
    ],
    fileName: 'Currency-Exchange-Report',
    title: companyName
  });
}

private formatDateForExport(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

private formatNumberForExport(value: number | string): string {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toFixed(2);
}
}