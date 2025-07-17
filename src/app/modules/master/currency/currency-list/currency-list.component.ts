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
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-currency-list',
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
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;

  // sorting
  sortColumn: string = 'currencyName'; // default sort column
  sortDirection: string = 'asc'; // default sort direction
  isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  
  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit() {
    this.appSettingService.getUser().subscribe(user => {
    if (user) {
      this.userData = user;
        this.checkPermissions();
    }
  });
  this.loadCurrencies();
}

 checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId)
    console.log(userRole)
    if (currentMenuId && userRole) {
     this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
  next: (response) => {
    this.currentMenuPermissions = response.data.MenuPermissions || {};
    this.permissions = Object.keys(this.currentMenuPermissions)
      .filter(key => this.currentMenuPermissions[key] === 'isTrue');
      console.log(this.permissions)
  }
});
    }
  }
 
  hasPermission(permission: string): boolean {
  return this.permissions.includes(permission);
}
  loadCurrencies(): void {
  this.loading = true;
  
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize,
    sortColumn: this.sortColumn,
    sortDirection: this.sortDirection
  };

  this.masterService.searchCurrencyList(params).subscribe({
    next: (response) => {
      if(response){
        this.currencyList = response.items;
        this.allCurrencies = response.items; // Maintain both lists if needed
        this.totalLengthOfCollection = response.totalCount;
        this.applySorting();
        this.searchPerformed = true;
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Error fetching currencies:', err);
      this.currencyList = [];
      this.allCurrencies = [];
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
    this.loadCurrencies();
  }
  clearFilterValue() {
  this.filterValue = '';
  this.loadCurrencies(); 
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

  report(): void {
  const formattedData = this.currencyList.map(item => ({
    ...item,
    status: item.status === 'A' ? 'Active' : 'Suspended'
  }));

  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'currencyName', label: 'Currency Name' },
      { key: 'currencyCode', label: 'Currency Code' },
      { key: 'ShortCode', label: 'Short Code' },
      { key: 'CurrencyUnit', label: 'Unit' },
      { key: 'CurrencySubUnit', label: 'Sub Unit' },
      { key: 'SubUnitIn', label: 'Sub Unit In' },
      { key: 'RoundOf', label: 'Round Off' },
      { key: 'status', label: 'Status' }
    ],
    fileName: 'Currency-Report', 
    title: companyName
  });
}
}