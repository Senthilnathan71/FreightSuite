// authority-list.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-authority-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    ListpageComponent,
    FavoriteStarComponent,
    NgxSpinnerModule
  ],
  templateUrl: './authority-list.component.html',
  styleUrl: './authority-list.component.scss'
})
export class AuthorityListComponent {
  // Variable Declaring Section

  filterValue = '';
  authorityList: any[] = [];
  searchPerformed: boolean;
  userData: any;

  // Lookup Related Variable Declaration
  departmentOptions: any[] = [];

  permissions: string[] = [];
  currentMenuPermissions: any = {};

  // Pagination related Declaring
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;

  // Sorting related declaration
  sortColumn: string = 'DepartmentMaster';
  sortDirection: string = 'desc';
  // Company
  currentCompany : any;
  currentBranch : any;
  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userInfo = this.appSettingService.getDecryptedUserProfile();
    if (userInfo) {
      this.userData = userInfo;
      this.checkPermissions();
    }
    this.searchAuthority();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId);
    console.log(userRole);
    if (currentMenuId && userRole) {
      this.masterService
        .getRoleMenuPermissions(currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
            console.log(this.permissions);
          },
        });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  searchAuthority() {
    this.spinner.show();
    const params = {
      search: this.filterValue.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
    }
    this.masterService.searchAuthority(params).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.authorityList = resp.data?.items.map(data => {
            return {
              AuthorityMasterSid : data.AuthorityMasterSid,
              DepartmentMaster: this.formatDepartment(data.DepartmentMaster),
              menuName: data?.menuMaster?.MenuName || '',
              branchName: data?.branchMaster?.branchName,
              status: data.status === 'A' ? 'Active' : 'Suspended'
            }
          });
          console.log(this.authorityList);
          this.totalLengthOfCollection = resp.data?.totalCount || 0;
          this.applySorting();
          this.searchPerformed = true;
        } else {
          this.appSettingService.showError(resp.message);
          console.error('Error searching authorization', resp.message)
          this.authorityList = [];
          this.totalLengthOfCollection = 0;
        }
        this.spinner.hide();
      }, error: (error: any) => {
        console.error(error);
      }
    })
  }

  formatDepartment(depart: any[]) {
    return depart.join(" , ")
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
    this.updatePaginationData();
  }

  applySorting() {
    this.authorityList.sort((a, b) => {
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


  updatePaginationData(): void {
    this.searchAuthority();
  }

  clearFilterValue() {
    this.filterValue = '';
    this.searchAuthority();
  }

  trackByAuthorityId(index: number, item: any): number {
    return item.AuthorityMasterSid;
  }

  softDelete(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteAuthorityById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Authority deleted successfully!");
            this.searchAuthority();
          },
          error: (err) => {
            console.error('Delete error:', err);
          }
        });
      }
    });
  }

  navigateToCreateAuthority() {
    this.router.navigate(['master/authorization/entry']);
  }

  resetPage() {
    this.filterValue = '';
    this.page = 1;
    this.searchPerformed = false;
    this.authorityList = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'DepartmentMaster';
    this.sortDirection = 'asc';
  }

  report(): void {
    const formattedData = this.authorityList;

    // const companyName = this.userData?.userCompanyMaster?.[0]?.companyMaster?.companyName ?? 'Company';
    const companyName = this.currentCompany?.companyName ?? 'Company';
    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'DepartmentMaster', label: 'Department' },
        { key: 'menuName', label: 'Screen/Menu Name' },
        { key: 'branchName', label: 'Branch' },
        { key: 'status', label: 'Status' }
      ],
      fileName: 'Authorization-Report',
      title: companyName
    });
  }
} 