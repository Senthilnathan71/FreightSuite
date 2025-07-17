import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from '../../master.service';
import { Commodity } from 'src/app/modules/crm-mobile/Interfaces/commodity.interface';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';


@Component({
  selector: 'app-commodity-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    RouterModule,
    NgbPaginationModule,
    ListpageComponent,
    FavoriteStarComponent 
  ],
  templateUrl: './commodity-list.component.html',
  styleUrls: ['./commodity-list.component.scss']
})
export class CommodityListComponent {
  searchType = 'CommodityName';
  filterValue = '';
  // results: Commodity[] = [];
  commodityList: Commodity[] = [];
  searchPerformed = false;
  userData : any;
  
  // Pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  loading = false;
  isFavorite: boolean = false;
  sortColumn: string = 'CommodityName'; 
  sortDirection: string = 'asc';
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  
  constructor(
    private masterService: MasterService,
    private router: Router,
    private modalService: NgbModal,
    private appSettingService: AppSettingsService,
    private userService: authService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit(): void {
    this.appSettingService.getUser().subscribe(
      user => {
        if (user) {
          this.userData = user;
          this.checkPermissions();
        }
      }
    )
    this.loadCommodities();
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

  loadCommodities(): void {
  this.loading = true; // Show loading indicator
  
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize,
    sortColumn: this.sortColumn,
    sortDirection: this.sortDirection
  };

  this.masterService.searchCommodity(params).subscribe({
    next: (response) => {
      if(response){
        this.commodityList = response.items;
        this.totalLengthOfCollection = response.totalCount;
        this.applySorting();
        this.searchPerformed = true;
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Error fetching commodities:', err);
      this.commodityList = [];
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
   
  this.loadCommodities();
  this.applySorting();
  this.updatePaginatedData();
}

applySorting() {
  this.commodityList.sort((a, b) => {
    let valueA = a[this.sortColumn];
    let valueB = b[this.sortColumn];

    if (valueA == null) valueA = '';
    if (valueB == null) valueB = '';

    valueA = valueA.toString().toLowerCase();
    valueB = valueB.toString().toLowerCase();

    if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}


  updatePaginatedData() {
  const startIndex = (this.page - 1) * this.pageSize;
  const endIndex = startIndex + this.pageSize;
  this.loadCommodities(); 
  // this.commodityList = this.results.slice(startIndex, endIndex);
}

  navigateToCreate() {
    this.router.navigate(['master/commodity/entry']);
  }
  clearFilterValue() {
  this.filterValue = '';
}

  editCommodity(id: number) {
    this.router.navigate(['master/commodity/entry', id]);
  }

  deleteCommodityById(id: number) {
    const modalRef = this.modalService.open(DeleteWarningComponent);
    modalRef.result.then((result) => {
      if (result === true) {
        this.masterService.deleteCommodityById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Deleted!");
            
          },
          error: (err) => {
            this.appSettingService.showError("Failed to delete commodity");
          }
        });
      }
    }).catch(() => {
      // Handle dismissal
    });
  }

  resetPage() {
    this.commodityList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'CommodityName';
    this.page = 1;
    this.sortColumn = 'CommodityName';
    this.sortDirection = 'asc';
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  trackByFn(index: number, item: any): number {
    return item.CommodityMasterSid;
  }
  report(): void {
    const formattedData = this.commodityList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'CommodityName', label: 'Commodity Name' },
                { key: 'CommodityCode', label: 'Commodity Code' },
                { key: 'CommodityType', label: 'Type' },
                { key: 'HSSACCode', label: 'HS Code' },
                { key: 'status', label: 'Status' },
            ],
            fileName: 'Commodity-Report', 
            title: companyName
        });
    }
}