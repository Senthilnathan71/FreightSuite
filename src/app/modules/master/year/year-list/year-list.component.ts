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
  selector: 'app-year-list',
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
  templateUrl: './year-list.component.html',
  styleUrl: './year-list.component.scss'
})
export class YearListComponent {

  searchType = 'YearName';
  filterValue = '';
  results: any[] = [];
  yearList: any[] = [];
  searchPerformed = false;
  loading: boolean = false;
  userData: any; 
  companyMap: { [id: number]: string} = {};

  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;

  constructor( 
    private masterService: MasterService, 
    private router: Router,
    private appSettingService: AppSettingsService, 
    private dialog: MatDialog,
    private excelReportService: ExcelExportService
  ) {}

  ngOnInit(){
    this.getAllCompanies();
   this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
      }
    });
  }

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((companies: any[]) => {
      this.companyMap = {};
      companies.forEach(c => {
        this.companyMap[c.CompanyMasterSid] = c.companyName;
      });
    });
  }

  onSearch(event: { type: string, value: string }) {
    this.searchType = event.type;
    this.filterValue = event.value;
    console.log('Searching with:', this.searchType, this.filterValue);
    this.search();
  }

  search() {
    this.loading = true;
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue,
    }
    
    this.masterService.searchYear(payload).subscribe({
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
        this.yearList = [];
        this.totalLengthOfCollection = 0;
        this.searchPerformed = true;
        this.loading = false;
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.yearList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return item.YearMasterSid || index;
  }

  deleteYearById(YearMasterSid: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteYearById(YearMasterSid).subscribe({
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

  resetPage() {
    this.searchPerformed = false;
    this.yearList = [];
    this.totalLengthOfCollection = 0;
    this.filterValue = '';
    this.searchType = 'YearName';
    this.page = 1;
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }
  report(): void {
    if (!this.yearList || this.yearList.length === 0) {
      this.appSettingService.showWarning("No data available to generate report");
      return;
    }

    const formattedData = this.yearList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Inactive',
      StartDate: new CustomDatePipe().transform(item.StartDate),
      EndDate: new CustomDatePipe().transform(item.EndDate)// Format date
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'YearName', label: ' Year Name' },
        { key: 'YearCode', label: ' Year Code' },
        { key: 'StartDate', label: 'StartDate' },
        { key: 'EndDate', label: 'End Date' },
        { key: 'CurrentYear', label: ' Current Year' },
        { key: 'YearEndCompleted', label: 'Year-End Completed' },
        { key: 'EndDate', label: 'End Date' },
        { key: 'status', label: 'Status' }
      ],
      fileName: 'Year-Report',
      title: companyName,
      sheetName: 'Year'
    });
  }

  nagivateTocreateYear(){
     this.router.navigate(['master/year/entry'])
  }
}
