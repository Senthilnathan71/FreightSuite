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

@Component({
  selector: 'app-generation-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    NgbPaginationModule, 
    RouterModule, 
    ListpageComponent,
    CustomDatePipe
  ],
  templateUrl: './generation-list.component.html',
  styleUrl: './generation-list.component.scss'
})
export class GenerationListComponent {
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
  }

  onSearch(event: { type: string, value: string }) {
    this.searchType = event.type;
    this.filterValue = event.value;
    this.search();
  }

  search() {
    this.loading = true;
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue,
    }
    
    this.masterService.searchHawbStock(payload).subscribe({
      next: (res: any) => {
        this.results = res.data || [];
        this.searchPerformed = true;
        this.totalLengthOfCollection = this.results.length;
        this.page = 1; // Reset to first page on new search
        this.updatePaginatedData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.results = [];
        this.hawbList = [];
        this.totalLengthOfCollection = 0;
        this.searchPerformed = true;
        this.loading = false;
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.hawbList = this.results.slice(startIndex, endIndex);
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

  navigateToCreateGeneration() {
    this.router.navigate(['master/generation/entry'])
  }

  resetPage() {
    this.searchPerformed = false;
    this.hawbList = [];
    this.totalLengthOfCollection = 0;
    this.filterValue = '';
    this.searchType = 'AirwayBillType';
    this.page = 1;
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