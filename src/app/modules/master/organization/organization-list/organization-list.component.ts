import { Component, OnInit } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [FeatherModule, NgSelectModule, NgbPaginationModule, CommonModule, RouterModule, FormsModule, ReactiveFormsModule, ListpageComponent,FavoriteStarComponent],
  templateUrl: './organization-list.component.html',
  styleUrl: './organization-list.component.scss'
})
export class OrganizationListComponent implements OnInit {

   modeOfStatus =[
        { value:'Active',name:'Active'},
        { value:'Invalid',name:'Invalid'},
        { value:'Block',name:'Block'},
    ]
  searchType = 'CustomerName';
  filterValue = '';
  results: any[] = [];
  organizationList: any[] = []
  searchPerformed = false;
  userData : any;
  loading = false;

  // pagination
  page = 1;
  pageSize = 15;
  totalLengthOfCollection: number;
  isFavorite: boolean = false;
  allOrganizations: any[] = [];
  sortColumn: string = 'CustomerName'; 
  sortDirection: string = 'asc';
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  countryList: any[] = [];

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  
  constructor(private masterService: MasterService, private router: Router,
    private dialog: MatDialog, private appSettingService: AppSettingsService,
    private userService: authService,
    private excelReportService: ExcelExportService
  ) { }
  ngOnInit() {
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       this.checkPermissions();
    //     }
    //   }
    // );
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
    this.loadCountryList();
    this.loadOrganizations();
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
   loadCountryList() {
  this.masterService.getAllCountry().subscribe({
    next: (response) => {
      this.countryList = response.data || [];
    },
    error: (err) => {
      console.error('Error loading country list:', err);
    }
  });
}
  loadOrganizations(): void {
    this.loading = true;
    
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    this.masterService.searchOrganizationList(params).subscribe({
      next: (response) => {
        if(response) {
          this.organizationList = response.items;
          this.totalLengthOfCollection = response.totalCount;
          this.applySorting();
          this.searchPerformed = true;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching organizations:', err);
        this.organizationList = [];
        this.totalLengthOfCollection = 0;
        this.loading = false;
      }
    });
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
    this.loadOrganizations();
    this.applySorting();
    this.updatePaginatedData();
  }

  applySorting() {
    this.organizationList.sort((a, b) => {
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
    this.loadOrganizations();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
getCountryName(countrySid: number): string {
  return this.countryList.find(c => c.CountryMasterSid === countrySid)?.countryName || '';
}

  deleteOrganization(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteOrganizationById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.router.navigate(['master/department/list'])
        });
      }
    });
  }

  navigateToCreateOrganization() {
    this.router.navigate(['master/organization/entry'])
  }
  clearFilterValue() {
    this.filterValue = '';
    this.loadOrganizations();
  }

  reset(){
    this.organizationList=[];
    this.totalLengthOfCollection=0;
    this.sortColumn = 'CustomerName';
    this.sortDirection = 'asc';
    this.searchPerformed = false;
  }

  report(): void {
  const formattedData = this.organizationList.map(item => {
    const country = this.getCountryName(item.CountryMasterSid);
    return {
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended',
      Country: country
    };
  });
        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'CustomerName', label: 'Customer Name' },
                { key: 'CustomerShortCode', label: 'Type' },
                { key: 'CustomerAliasName', label: 'Short Name' },
                { key: 'PanType', label: 'PAN/Vat' },
                { key: 'Country', label: 'Country' },
                { key: 'status', label: 'Status' },
            ],
            fileName: 'Organization-Report', 
            title: companyName
        });
    }
}
