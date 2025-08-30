import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { OperationService } from '../../operation.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-master-job-list',
  standalone: true,
  imports: [
    FavoriteStarComponent,
    FeatherModule,
    CommonModule,
    FormsModule,
    CustomDatePipe,
    NgbPaginationModule,

  ],
  templateUrl: './master-job-list.component.html',
  styleUrl: './master-job-list.component.scss',
})
export class MasterJobListComponent {

  filterValue = '';
  allMasterJob: any[] = [];
  searchPerformed: boolean;
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;
  sortColumn: string = 'departmentName';
  sortDirection: string = 'desc';
  currentCompany : any;
  currentBranch : any;

  constructor(
    private operationService: OperationService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService
  ) {}

  ngOnInit(): void {
    this.currentCompany = localStorage.getItem('selected-company');
    this.currentBranch = localStorage.getItem('selected-branch');
    this.appSettingService.getUser().subscribe((user) => {
      if(user) {
        this.userData = user;
        this.checkPermissions();
      }
    });
    this.searchMasterJob();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    if (currentMenuId && userRole) {
      this.operationService
        .getRoleMenuPermissions(currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
          },
        });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  searchMasterJob() {
    let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const params = {
      search: this.filterValue.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      activeCompanyId: CompanyMasterSid,
    }
    this.operationService.searchMasterJobs(params).subscribe({
      next: (response:any) => {
        if(response.status){
          this.allMasterJob = response?.data?.items || [];
          this.totalLengthOfCollection = this.allMasterJob.length;
          this.searchPerformed = true;
          this.applySorting();
        } else {
          this.allMasterJob = [];
          this.totalLengthOfCollection = 0;
          this.searchPerformed = true;
          this.appSettingService.showError('Error fetching Master Job data');
        }
      },
      error: (error) => {
        console.error('Error fetching Master Job data:', error);
      }
    });
  }

  deleteMasterJob(MasterJobSid: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.operationService.deleteMasterJob(MasterJobSid).subscribe({
          next: (response:any) => {
            if(response.status){
              this.appSettingService.showSuccess('Master Job deleted successfully');
              this.searchMasterJob();
            } else {
              this.appSettingService.showError('Error deleting Master Job');
            }
          },
          error: (error) => {
            console.error('Error deleting Master Job:', error);
            this.appSettingService.showError('Error deleting Master Job');
          }
        });
      }
    });
  }

  // Sorting related Function
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
    this.allMasterJob.sort((a, b) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];
      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';
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
    })
  }

  updatePaginationData(): void {
    this.searchMasterJob();
  }

  trackBy(index: number, item: any): number {
    return item.MasterJobSid || index;
  }

  clearFilterValue() {
    this.filterValue = '';
    this.searchMasterJob();
  }
  
  navigateToMasterJob() {
    this.router.navigate(['operation/master-job/entry']);
  }

  resetPage() {
    this.page = 1;
    this.filterValue = '';
    this.allMasterJob = [];
    this.searchPerformed = false;
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'departmentName';
    this.sortDirection = 'desc';
  }

  report(): void {
    const formattedData = this.allMasterJob.map(item =>{
      return {
        ...item,
        status : item.Status === "A" ? "Active" : "Suspended"
      }
    })
    const companyName = this.currentCompany?.companyName ?? 'Company';
    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'departmentName', label: 'Department' },
        { key: 'MasterJobNumber', label: 'Master Job No.' },
        { key: 'MasterJobDate', label: 'Master Job Date' },
        { key: 'MBLNo', label: 'MBL No' },
        { key: 'MBLDate', label: 'MBL Date' },
        { key: 'POL', label: 'POL' },
        { key: 'POD', label: 'POD' },
        { key: 'FDC', label: 'FDC' },
        { key: 'NoOfHouses', label: 'No of Houses' },
        { key: 'NoOfContainers', label: 'No of Containers' },
        { key: 'status', label: 'Status' },
      ],
      fileName: 'Master-Job-Report',
      title: companyName
    });
  }
 
}
