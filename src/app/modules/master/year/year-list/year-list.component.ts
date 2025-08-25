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
  selector: 'app-year-list',
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
  templateUrl: './year-list.component.html',
  styleUrl: './year-list.component.scss'
})
export class YearListComponent {
 isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  filterValue = '';
  yearList: any[] = [];
  searched = false;
  loading: boolean = false;
  userData: any; 
  companyMap: { [id: number]: string} = {};
  permissions: string[] = [];
  currentMenuPermissions: any = {};

  page = 1;
  pageSize = 15;
  totalLengthOfCollection: number = 0;

  sortColumn: string = 'YearName';
  sortDirection: string = 'asc';

  // Company
  currentCompany : any;
  currentBranch : any;
  constructor( 
    private masterService: MasterService, 
    private router: Router,
    private appSettingService: AppSettingsService, 
    private dialog: MatDialog,
    private excelReportService: ExcelExportService
  ) {}

  ngOnInit(){
    this.getAllCompanies();
  //  this.appSettingService.getUser().subscribe(user => {
  //     if (user) {
  //       this.userData = user;
  //       this.checkPermissions()
  //     }
  //   });
  this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
  this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
  const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
    this.loadYears();
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
  loadYears(): void {
    let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      activeCompanyId : CompanyMasterSid,
    };

    this.masterService.searchYearList(params).subscribe({
      next: (response) => {
        if(response.data){
          this.yearList = response.data.items;
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        }
      },
      error: (err) => {
        console.error('Error fetching years:', err);
        this.yearList = [];
        this.totalLengthOfCollection = 0;
      },
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

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applySorting();
  }

  applySorting() {
    if (!Array.isArray(this.yearList)) {
    this.yearList = [];
    return;
  }

    this.yearList.sort((a,b) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];

      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

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
    this.loadYears();
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
             this.loadYears();
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
    this.searched = false;
    this.yearList = [];
    this.totalLengthOfCollection = 0;
    this.filterValue = '';
    this.page = 1;
    this.sortColumn = 'YearName';
    this.sortDirection = 'asc';
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

    // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
    const companyName = this.currentCompany?.companyName ?? 'Company';
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

  clearFilterValue() {
    this.filterValue = '';
  }
}
