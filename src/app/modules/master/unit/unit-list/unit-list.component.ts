import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    MatDialogModule,
    ListpageComponent,
    FavoriteStarComponent
  ],
  templateUrl: './unit-list.component.html',
  styleUrl: './unit-list.component.scss'
})
export class UnitListComponent {
  filterValue = '';
  searchType = 'unitName';
  unitList: any[] = [];
  allUnits: any[] = [];
  searched = false;
  loading: boolean = false;
  userData: any;

  // pagination
  page = 1;
  pageSize = 15;
  totalLengthOfCollection: number = 0;
  isFavorite: boolean = false;

  sortColumn: string = 'unitName';
  sortDirection: string = 'asc';

  permissions: string[] = [];
  currentMenuPermissions: any = {};

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  // Company
  currentCompany : any;
  currentBranch : any;
  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit() { 
  //   this.appSettingService.getUser().subscribe(user => {
  //   if (user) {
  //     this.userData = user;
  //     this.checkPermissions();
  //   }
  // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
  const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
  this.loadUnits();
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

  loadUnits(): void {
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
    };

    this.masterService.searchUnitList(params).subscribe({
      next: (response) => {
        if(response.status) {
          this.unitList = response.data.items;
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        }else {
        this.appSettingService.showError(response.message);
      }

      },
      error: (err) => {
        console.error('Error fetching units:', err);
        this.unitList = [];
        this.totalLengthOfCollection = 0;
      },
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
    
    // If search term is empty, get all units
    if (!this.filterValue.trim()) {
      this.masterService.getAllUnits().subscribe({
        next: (res: any) => {
          this.handleSearchResponse(res);
        },
        error: (err) => {
          this.handleSearchError(err);
        }
      });
    } else {
      // If search term exists, perform filtered search
      const payload = {
        searchType: this.searchType,
        filterValue: this.searchType === 'status' 
          ? this.filterValue === 'Active' ? 'A' : 'S'
          : this.filterValue
      };

      this.masterService.searchUnitList(payload).subscribe({
        next: (res: any) => {
          this.handleSearchResponse(res);
        },
        error: (err) => {
          this.handleSearchError(err);
        }
      });
    }
  }

  private handleSearchResponse(res: any) {
    this.allUnits = res.data || res;
    this.unitList = [...this.allUnits];
    this.totalLengthOfCollection = this.unitList.length;
    this.searched = true;
    this.page = 1;
    this.updatePaginatedData();
    this.loading = false;
  }

  private handleSearchError(err: any) {
    console.error('Search error:', err);
    this.appSettingService.showError('Failed to load units');
    this.loading = false;
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
    // if (!Array.isArray(this.unitList)) {
    //   this.unitList = [];
    //   return;
    // }

    this.unitList.sort((a,b) => {
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
    this.loadUnits();
  }

  trackByUnitId(index: number, item: any): number {
    return item.UnitMasterSid;
  }

  deleteUnit(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteUnitById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Unit deleted successfully!");
            this.search(); // Refresh the list
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateUnit() {
    this.router.navigate(['master/unit/entry']);
  }

  resetPage() {
    this.filterValue = '';
    this.searchType = 'unitName';
    this.page = 1;
    this.searched = false;
    this.unitList = [];
    this.allUnits = [];
    this.totalLengthOfCollection = 0;
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }
 report(): void {
 
  const formattedData = this.unitList.map(item => ({
    ...item,
    status: this.getStatusText(item.status) // Convert 'A'/'S' to 'Active'/'Suspended'
  }));

  
  // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  const companyName = this.currentCompany?.companyName ?? 'Company';
  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'unitName', label: 'Unit Name' },
      { key: 'unitCode', label: 'Unit Code' },
      { key: 'jobType', label: 'Job Type' },
      { key: 'containerType', label: 'Container Type' },
      { key: 'measurementType', label: 'Measurement Type' },
      { key: 'Remarks', label: 'Remarks' },
      { key: 'status', label: 'Status' }

    ],
    fileName: 'Unit-Report',
    title: companyName
  });
}

clearFilterValue() {
    this.filterValue = '';
  }
 
}