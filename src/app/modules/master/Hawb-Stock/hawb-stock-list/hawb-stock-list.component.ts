import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-hawb-stock-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    NgbPaginationModule, 
    RouterModule, 
    ListpageComponent,
    CustomDatePipe,
    FavoriteStarComponent
  ],
  templateUrl: './hawb-stock-list.component.html',
  styleUrl: './hawb-stock-list.component.scss'
})
export class HawbStockListComponent {
  searchType = 'AirwayBillType';
  filterValue = '';
  results: any[] = [];
  hawbList: any[] = [];
  searchPerformed = false;
  loading: boolean = false;
  userData: any; 

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;
  isFavorite: boolean = false;
  sortColumn: string = 'AirwayBillType'; 
  sortDirection: string = 'asc';

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
  ngOnInit(){
   this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
      }
    });
    this.loadHawbStocks();
  }

  loadHawbStocks(): void {
    this.loading = true;
    
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    this.masterService.searchHawbStock(params).subscribe({
      next: (response:any) => {
        if(response.data) {
          this.hawbList = response.data.items || [];
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searchPerformed = true;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching HAWB stocks:', err);
        this.hawbList = [];
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
  if (!this.results) return;
  
  this.results.sort((a, b) => {
    let valueA = a[this.sortColumn];
    let valueB = b[this.sortColumn];
    
    // Handle null/undefined values
    if (valueA == null) valueA = '';
    if (valueB == null) valueB = '';
    
    // Special handling for dates
    if (this.sortColumn === 'ReceivedDate') {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    } else {
      // Convert to string for case-insensitive comparison
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


  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadHawbStocks();
  }
  clearFilterValue() {
    this.filterValue = '';
    this.loadHawbStocks();
  }

  trackByIndex(index: number, item: any): number {
    return item.HawbStockSid || index;
  }

  deleteHawbStock(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteHawbStock(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Deleted successfully!");
           
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateGeneration() {
    this.router.navigate(['master/hawbstock/entry'])
  }

  resetPage() {
    this.searchPerformed = false;
    this.hawbList = [];
    this.totalLengthOfCollection = 0;
    this.filterValue = '';
    this.searchType = 'AirwayBillType';
    this.page = 1;
    this.sortColumn = 'AirwayBillType';
    this.sortDirection = 'asc';
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }
  report(): void {
    if (!this.hawbList || this.hawbList.length === 0) {
      this.appSettingService.showWarning("No data available to generate report");
      return;
    }

    const formattedData = this.hawbList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Inactive',
      ReceivedDate: new CustomDatePipe().transform(item.ReceivedDate) // Format date
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'AirwayBillType', label: 'Received From' },
        { key: 'HAWBSerial', label: 'Serial No' },
        { key: 'NumberofHAWB', label: 'No of AWB' },
        { key: 'ReceivedDate', label: 'Received Date' },
        { key: 'status', label: 'Status' }
      ],
      fileName: 'HAWB-Stock-Report',
      title: companyName,
      sheetName: 'HAWB Stock'
    });
  }


}