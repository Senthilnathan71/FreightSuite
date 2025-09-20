
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { Observable, forkJoin } from 'rxjs';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';

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
    MatDialogModule,
    NgxSpinnerModule,
    CommonPaginationComponent,
    
  ],
  templateUrl: './container-activity-list.component.html',
  styleUrl: './container-activity-list.component.scss'
})
export class ContainerActivityListComponent extends BaseListComponent implements OnInit {
  searchType = 'ActivityName';
  
  results: any[] = [];
  containerActivityList: any[] = [];
 
  companyMap: { [id: number]: string } = {};
  userData: any;
  
  loading = false;

  // Pagination 
  get containerActivityLists() { return this.allItems; }

  protected config: ListComponentConfig = {
        storageKey: 'containerActivity-type-state',
        defaultPageSize: 10,
        defaultSortColumn: 'ActivityCode',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100, 500],
        maxPagesToShow: 3
    };
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
    private excelReportService: ExcelExportService,
     private spinner: NgxSpinnerService,
     paginationService: PaginationService
  ) {
    super(paginationService);
  }

 override ngOnInit() {
    this.getAllCompanies();
    
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    
    super.ngOnInit();
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

   // Implement abstract methods from BaseListComponent
  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.masterService.searchContainerActivities(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams {
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

  protected processSearchResults(response: any): void {
    this.spinner.hide();
    if (response.status) {
      this.allItems = response.data.items.map(item => ({
        ...item,
        status: item.status === 'A' ? 'Active' : 'Suspended',
        ContainerMoveStatus: item.ContainerMoveStatus || 'N/A',
        MoveType: item.MoveType || 'N/A',
        IsDamageMove: item.IsDamageMove === 'Y' ? 'Yes' : 'No'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
    } else {
      this.appSettingService.showError('Error searching container activities.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error searching container activities.');
    console.error('Error searching container activities', error);
    super.handleSearchError(error);
  }

  // Legacy method for template compatibility
  loadContainerActivities() {
    this.page=1;
    this.search();
  }

  // Legacy method for template compatibility
  clearFilterValue() {
    this.clearFilter();
  }


  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((companies: any[]) => {
      this.companyMap = {};
      companies.forEach(c => {
        this.companyMap[c.CompanyMasterSid] = c.companyName;
      });
    });
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