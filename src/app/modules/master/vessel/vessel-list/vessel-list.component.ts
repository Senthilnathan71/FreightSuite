import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-vessel-list',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    RouterModule,
    ListpageComponent,
    FavoriteStarComponent,
    NgxSpinnerModule
  ],
  templateUrl: './vessel-list.component.html',
  styleUrl: './vessel-list.component.scss'
})
export class VesselListComponent {

  filterValue: any;
  vesselList: any[] = [];
  searched = false;
  userData: any;
  loading: boolean = false;

  permissions: string[] = [];
  currentMenuPermissions: any = {};
  // pagination
  page = 1;
  pageSize = 15;
  totalLengthOfCollection: number;
  isFavorite: boolean = false;

  // sorting
  sortColumn: string = 'VesselName'; // default sort column
  sortDirection: string = 'asc'; // default sort direction
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }
  // Company
  currentCompany : any;
  currentBranch : any;
  constructor(private masterService: MasterService, private router: Router,
    private appSettingService: AppSettingsService, private dialog: MatDialog,
    private excelReportService: ExcelExportService,private spinner: NgxSpinnerService
  ) { }
  ngOnInit() {
    // this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    //      this.checkPermissions();
    //   }
    // });
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
     const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
    this.loadVessels();
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
  loadVessels(): void {
    this.spinner.show();
    const params = {
      search: this.filterValue ? this.filterValue.trim() : '',
      page: this.page,
      pageSize: this.pageSize,
    };

    this.masterService.searchVesselList(params).subscribe({
      next: (response) => {
        if(response.status){
          this.vesselList = response.data.items;
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        }
        else {
        this.appSettingService.showError(response.message);
      }
      this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching vessels:', err);
        this.vesselList = [];
        this.totalLengthOfCollection = 0;
      },
    });
  }


  // search(): void {
  //   if (!this.filterValue) {
  //     this.searchResults = [...this.vesselList];
  //     this.totalLengthOfCollection = this.searchResults.length;
  //     this.applySorting();
  //     this.searchPerformed = true;
  //     this.updatePaginatedData();
  //     console.log(this.searchResults);
  //     return;
  //   }
  //   if (this.filterValue) {
  //     this.searchResults = this.searchResults.filter(item => {
  //       return (
  //         (item.VesselName && item.VesselName.toLowerCase().includes(this.filterValue.toLowerCase())) ||
  //         (item.VesselType && item.VesselType.toLowerCase().includes(this.filterValue.toLowerCase())) ||
  //         (item.YearofBuilt && item.YearofBuilt === Number(this.filterValue)) ||
  //         (item.VesselOperator && item.VesselOperator.toLowerCase().includes(this.filterValue.toLowerCase())) ||
  //         (item.status && item.status.toLowerCase().includes(this.filterValue.toLowerCase()))
  //       );
  //     });
  //     this.totalLengthOfCollection = this.searchResults.length;
  //     this.applySorting();
  //     this.searchPerformed = true;
  //     this.updatePaginatedData();
  //     console.log(this.searchResults);
  //   }
  // }

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
    // this.updatePaginatedData();
  }

  applySorting() {
    this.vesselList.sort((a, b) => {
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
    this.loadVessels();
    // this.vesselList = this.searchResults.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteVessel(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteVesselById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.loadVessels();
          // this.router.navigate(['master/vessel/list'])
          // this.search();
        }, (error) => {
          this.appSettingService.showError("Error Deleting Vessel", error);
        });
      }
    });
  }

  navigateToCreateVessel() {
    this.router.navigate(['master/vessel/entry'])
  }

  resetPage() {
    this.vesselList = []
    this.totalLengthOfCollection = 0
    this.sortColumn = 'vesselName';
    this.sortDirection = 'asc';
    this.searched = false;
  }

  report(): void {
    const formattedData = this.vesselList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

    // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
    const companyName = this.currentCompany?.companyName ?? 'Company';
    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'VesselName', label: 'Vessel Name' },
        // { key: 'VesselShortCode', label: 'Vessel Code' },
        { key: 'VesselType', label: 'Vessel Type' },
        { key: 'YearofBuilt', label: 'Year of Built' },
        // { key: 'IMOCode', label: 'IMO Code' },
        { key: 'VesselOperator', label: 'Vessel Operator' },
        // { key: 'NRT', label: 'Net Register Ton' },
        { key: 'status', label: 'Status' }
      ],
      fileName: 'Vessel-Report',
      title: companyName
    });
  }
  clearFilterValue() {
    this.filterValue = '';
  }

}
