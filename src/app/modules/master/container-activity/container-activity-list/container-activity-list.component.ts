
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { forkJoin } from 'rxjs';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-container-activity-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FeatherModule,
    NgbPaginationModule,
    ListpageComponent,
    FavoriteStarComponent,
    MatDialogModule
  ],
  templateUrl: './container-activity-list.component.html',
  styleUrl: './container-activity-list.component.scss'
})
export class ContainerActivityListComponent {
  searchType = 'ActivityName';
  filterValue = '';
  results: any[] = [];
  containerActivityList: any[] = [];
  searchPerformed = false;
  companyMap: { [id: number]: string } = {};
  userData: any;
  sortColumn: string = 'ActivityName';
  sortDirection: string = 'asc';
  loading = false;

  // Pagination 
  page = 1;
  pageSize = 15;
  totalLengthOfCollection = 0;
  isFavorite: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  
  // Company
  currentCompany: any;
  currentBranch: any;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit() {
    this.getAllCompanies();
    
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    
    this.loadContainerActivities();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    
    if (currentMenuId && userRole) {
      this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions)
            .filter(key => this.currentMenuPermissions[key] === 'isTrue');
        }
      });
    }
  }
 
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  loadContainerActivities(): void {
    this.loading = true;

    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    this.masterService.searchContainerActivities(params).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.results = response.data.items || response.data || [];
          this.containerActivityList = response.data.items || response.data || [];
          this.totalLengthOfCollection = response.totalCount || this.containerActivityList.length;
          this.applySorting();
          this.searchPerformed = true;
        }
else {
        this.appSettingService.showError(response.message);
      }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching container activities:', err);
        this.results = [];
        this.containerActivityList = [];
        this.totalLengthOfCollection = 0;
        this.loading = false;
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

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadContainerActivities();
    this.applySorting();
    this.updatePaginatedData();
  }

  applySorting() {
    this.results.sort((a, b) => {
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
    this.loadContainerActivities();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteContainerActivity(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteContainerActivityById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.loadContainerActivities();
        });
      }
    });
  }

  navigateToAddNewContainerActivity() {
    this.router.navigate(['master/container-activity/entry']);
  }

  clearFilterValue() {
    this.filterValue = '';
  }

  resetPage(): void {
    this.containerActivityList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'ActivityName';
    this.page = 1;
    this.sortColumn = 'ActivityName';
    this.sortDirection = 'asc';
    this.loadContainerActivities();
  }

  report(): void {
    const formattedData = this.containerActivityList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended',
      ContainerMoveStatus: item.ContainerMoveStatus || 'N/A',
      MoveType: item.MoveType || 'N/A'
    }));

    const companyName = this.currentCompany?.companyName ?? 'Company';
    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'ActivityCode', label: 'Activity Code' },
        { key: 'ActivityName', label: 'Activity Name' },
        { key: 'ContainerMoveStatus', label: 'Container Move Status' },
        { key: 'MoveType', label: 'Move Type' },
        { key: 'IsDamageMove', label: 'Damage Move' },
        { key: 'Remarks', label: 'Remarks' },
        { key: 'status', label: 'Status' },
      ],
      fileName: 'Container-Activity-Report',
      title: companyName
    });
  }
}