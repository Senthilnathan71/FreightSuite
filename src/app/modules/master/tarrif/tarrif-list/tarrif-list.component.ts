import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Tariff } from 'src/app/modules/crm-mobile/Interfaces/tariff.interface';
import { Router, RouterModule } from '@angular/router';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-tarrif-list',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    RouterModule,
    NgbPaginationModule,
    CustomDatePipe,
    ListpageComponent,
    FavoriteStarComponent
  ],
  templateUrl: './tarrif-list.component.html',
  styleUrl: './tarrif-list.component.scss'
})
export class TarrifListComponent implements OnInit {

  searchType: string = "POLTerminal";
  filterValue: string;
  results: Tariff[];
  tariffList: any[];
  searched : boolean = false;
  userData : any;

  // pagination values
  page = 1;
  pageSize = 15;
  totalNumberOfCollection: number;
  sortColumn: string = 'POLTerminal'; 
  sortDirection: string = 'asc';
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  isFavorite: boolean = false;
  // Company
  currentCompany : any;
  currentBranch : any;
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 

  constructor(
    private masterServ: MasterService,
    private dialog: MatDialog,
    private appSettingServ: AppSettingsService,
    private appSettingService: AppSettingsService,
    private router: Router,
    private userService: authService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit() {
    // this.appSettingServ.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       this.checkPermissions();
    //     }
    //   });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingServ.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
      this.loadTariffs();
  }

    checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId);
    console.log(userRole);
    if (currentMenuId && userRole) {
      this.masterServ
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
  loadTariffs(): void {
     let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const params = {
      search: this.filterValue ? this.filterValue.trim() : '',
      page: this.page,
      pageSize: this.pageSize,
      activeCompanyId : CompanyMasterSid,
    };

    this.masterServ.searchTariffList(params).subscribe({
      next: (response) => {
        if(response.status) {
          this.tariffList = response.data.items;
          this.results = [...this.tariffList];
          this.totalNumberOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        }else {
        this.appSettingService.showError(response.message);
      }

      },
      error: (err) => {
        console.error('Error fetching tariffs:', err);
        this.tariffList = [];
        this.results = [];
        this.totalNumberOfCollection = 0;
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
    const intFields = ['Carrier', 'AgentSid'];
    const payload = {
      searchType: this.searchType,
      filterValue: intFields.includes(this.searchType) ? Number(this.filterValue) : this.filterValue
    }
    this.masterServ.searchTariffList(payload).subscribe(
      (res) => {
        this.results = res.data;
        this.searched = true;
        this.applySorting();
        this.updatePaginationData();
        this.totalNumberOfCollection = this.results.length || 0;
      }
    )
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
}

applySorting() {
  this.results.sort((a, b) => {
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
  this.tariffList = [...this.results];
}

  updatePaginationData() {
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
    this.loadTariffs();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteTariff(TariffHeaderSid) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.masterServ.deleteTariffById(TariffHeaderSid).subscribe(
          (resp: any) => {
            this.appSettingServ.showSuccess("Deleted!");
            // this.router.navigate([`master/tarrif/list`]);
            this.loadTariffs()
          });
      }
    })
  }

  navigateToCreateTariff() {
    this.router.navigate(['master/tarrif/entry']);
  }

  report(): void {
    const formattedData = this.tariffList.map(item => ({
      ...item,
      department : item.departmentMaster?.departmentName,
      carrier : item.customerCarrier.CustomerName,
      agent : item.customerAgent.CustomerName,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

        // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
        const companyName = this.currentCompany?.companyName ?? 'Company';
        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'department', label: 'Dept' },
                { key: 'POLTerminal', label: 'POL' },
                { key: 'PODTerminal', label: 'POD' },
                { key: 'carrier', label: 'Carrier' },
                { key: 'agent', label: 'Agent' },
                { key: 'EffectiveDate', label: 'Effective Date' },
                { key: 'status', label: 'Status' },
            ],
            fileName: 'Tariff-Report', 
            title: companyName
        });
    }

  reset() {
    this.tariffList = [];
    this.filterValue = '';
    this.searched = false;
    this.totalNumberOfCollection = 0;
    this.sortColumn = 'POLTerminal';
    this.sortDirection = 'asc';
  }
  clearFilterValue(){
      this.filterValue = '';
    }

}
