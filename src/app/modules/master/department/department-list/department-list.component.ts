import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from 'src/app/modules/master/master.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, FeatherModule, FormsModule, NgbPaginationModule, RouterModule, ListpageComponent,FavoriteStarComponent],
  templateUrl: './department-list.component.html',
  styleUrl: './department-list.component.scss'
})
export class DepartmentListComponent {
  searchType = 'departmentName';
  filterValue = '';
  results: any[] = [];
  departmentList: any[] = []
  searchPerformed = false;
  allDepartments: any[] = []; 
  sortColumn: string = 'departmentCode'; 
  sortDirection: string = 'asc';
  loading = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};

  // pagination
  page = 1;
  pageSize = 15;
  totalLengthOfCollection: number;
userData:any
  constructor(private userService: authService,private masterService: MasterService, private excelReportService:ExcelExportService, private router: Router,
    private appSettingService: AppSettingsService, private dialog: MatDialog
  ) { }
  ngOnInit() {
this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
        console.log(this.userData,'userData');
        this.checkPermissions();
      }
    });  
    this.loadDepartments();
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

  
  sort(column: string) {
    if (this.sortColumn === column) {
      // Reverse the sort direction if clicking the same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new sort column and default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.loadDepartments();
  }

  applySorting() {
    this.departmentList.sort((a, b) => {
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


  updatePaginatedData(): void {
  const startIndex = (this.page - 1) * this.pageSize;
  const endIndex = startIndex + this.pageSize;
  this.loadDepartments();
}

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteDepartment(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteDepartmentById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.router.navigate(['master/department/list'])
         
        });
      }
    });
  }
  loadDepartments(): void {
    this.loading = true;
    
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    this.masterService.searchDepartmentList(params).subscribe({
      next: (response) => {
        if(response) {
          this.departmentList = response.items;
          this.totalLengthOfCollection = response.totalCount;
          this.applySorting();
          this.searchPerformed = true;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching departments:', err);
        this.departmentList = [];
        this.totalLengthOfCollection = 0;
        this.loading = false;
      }
    });
  }

  navigateToCreateDepartment() {
    this.router.navigate(['master/department/entry'])
  }
  clearFilterValue() {
    this.filterValue = '';
    this.loadDepartments();
  }

  resetPage() {
    this.searchPerformed = false;
    this.departmentList = [];
    this.totalLengthOfCollection = 0;
    this.filterValue = '';
    this.searchType = 'departmantName';
    this.page = 1;
    this.sortColumn = 'departmentCode';
    this.sortDirection = 'asc';
  }

  report(): void {
   const formattedData = this.departmentList.map(item => ({
    ...item,
    Status: item.Status === 'A' ? 'Active' : 'Suspended'
  }));

  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'departmentCode', label: 'Dept Code' },
      { key: 'departmentName', label: 'Dept Name' },
      { key: 'departmentType', label: 'Dept Type' },
      { key: 'ExportImport', label: 'Exp/Imp' },
      { key: 'FCLLCL', label: 'FCL/LCL' },
      { key: 'Division', label: 'Division' },
      { key: 'Status', label: 'Status' }
    ],
  fileName: 'Department-Report', // Will also be used as sheet name: DepartmentReport
    title: companyName
  });
}


isFavorite: boolean = false;

toggleFavorite() {
  this.isFavorite = !this.isFavorite;
}

}



