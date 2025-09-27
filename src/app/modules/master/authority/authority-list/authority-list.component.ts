// authority-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-authority-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    RouterModule,
    ListpageComponent,
    FavoriteStarComponent,
    NgxSpinnerModule,
    CommonPaginationComponent
  ],
  templateUrl: './authority-list.component.html',
 styleUrls: ['./authority-list.component.scss']
})
export class AuthorityListComponent extends BaseListComponent implements OnInit {
  // Variable Declaring Section
  userData: any;

  // Lookup Related Variable Declaration
  departmentOptions: any[] = [];

  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // Company
  currentCompany : any;
  currentBranch : any;
      protected config: ListComponentConfig = {
        storageKey: 'authority-list-state',
        defaultPageSize: 10,
        defaultSortColumn: 'DepartmentMaster',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100, 500],
        maxPagesToShow: 3
    };

    // Alias for compatibility with existing template
    get authorityList() { return this.allItems; }
  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
        paginationService: PaginationService
    ) {
        super(paginationService);
    }

  override ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userInfo = this.appSettingService.getDecryptedUserProfile();
    if (userInfo) {
      this.userData = userInfo;
      this.checkPermissions();
    }
    super.ngOnInit();
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

  protected override searchItems(): Observable<any> {
    this.spinner.show();
    return this.masterService.searchAuthority(this.getSearchParams());
  }
  protected override getSearchParams(): SearchParams {
    return {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };
  }

  // formatDepartment(depart: any[]) {
  //   return depart.join(" , ")
  // }

  protected override processSearchResults(response: any): void {
    this.spinner.hide();
    if (response.status) {
      this.allItems = response.data.items.map(item => ({
        ...item,
        DepartmentMaster: item.DepartmentMaster,
        menuName: item.menuMaster?.MenuName,
        branchName: item.branchMaster?.branchName,
        status: item.status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
    } else {
      this.appSettingService.showError('Error searching authority.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error searching authority.');
    console.error('Error searching authority',error);
    super.handleSearchError(error);
  }

  searchAuthority() {
    this.page = 1;
    this.search();
  }

  trackByAuthorityId(index: number, item: any): number {
    return item.AuthorityMasterSid;
  }

  clearFilterValue() {
    this.clearFilter();
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

  updatePaginationData(): void {
    this.search();
  }

  override trackBy(index: number, item: any) {
    return item.AuthorityMasterSid || index;
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