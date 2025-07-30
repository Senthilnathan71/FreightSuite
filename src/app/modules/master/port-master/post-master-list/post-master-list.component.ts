import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { forkJoin } from 'rxjs';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-post-master-list',
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
  templateUrl: './post-master-list.component.html',
  styleUrls: ['./post-master-list.component.scss']
})
export class PostMasterListComponent implements OnInit {
  // search controls
  searchType = 'PortName';
  filterValue = '';
  searched = false;
  userData: any;


  // raw + paged data
  results: any[] = [];
  portList: any[] = [];
  totalLengthOfCollection = 0;
  sortColumn: string = 'PortName'; 
  sortDirection: string = 'asc'; 
  // pagination
  page = 1;
  pageSize = 15;

  // lookup arrays
  countryOptions: any[] = [];
  sectorOptions: any[] = [];
  regionList : any[];
  isFavorite: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  
  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  
  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService, 
    private userService: authService 
  ) { }

  ngOnInit(): void {
    this.loadAllRegions();
    this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
        this.checkPermissions();
      }
    });
    this.loadPorts();
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
  loadPorts(): void {
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
    };

    this.masterService.searchPortList(params).subscribe({
      next: (response) => {
        if(response.data) {
          this.portList = response.data.items;
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        }
      },
      error: (err) => {
        console.error('Error fetching ports:', err);
        this.portList = [];
        this.totalLengthOfCollection = 0;
      },
    });
  }

  /** Load all countries and sectors for lookup */
  // loadMasterData(): void {
  //   this.masterService.getAllCountry().subscribe(countries => {
  //     this.countryOptions = countries.data || countries;
  //   });

  //   this.masterService.getAllSector().subscribe(sectors => {
  //     this.sectorOptions = sectors.data || sectors;
  //   });
  // }

  /** Triggered when user clicks “Search” */

  onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}


  search(): void {
  const payload = {
    searchType: 
      this.searchType === 'countryName' ? 'CountryMasterSid' : 
      this.searchType === 'sectorName' ? 'SectorMasterSid' : 
      this.searchType,
    filterValue: this.filterValue
  };

  this.masterService.searchPortList(payload).subscribe(res => {
    const items = Array.isArray(res) ? res : res.data || [];
    this.results = items.map((port: any) => {
      // Find country and sector names from the options arrays
      const country = this.countryOptions.find(c => c.CountryMasterSid === port.CountryMasterSid);
      const sector = this.sectorOptions.find(s => s.SectorMasterSid === port.SectorMasterSid);

      return {
        ...port,
        countryName: country?.countryName || '—',
        sectorName: sector?.sectorName || '—',
        statusText: port.status === 'A' ? 'Active' : 'Suspended'
      };
    });

    this.searched = true;
    this.totalLengthOfCollection = this.results.length;
    this.page = 1;
    this.updatePaginatedData();
    this.applySorting();
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
  
  this.applySorting();
}

applySorting() {
  if (!Array.isArray(this.portList)){
    this.portList = [];
    return;
  }
  this.portList.sort((a, b) => {
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


  /** Slice results for current page */
  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadPorts();
  }

  trackByIndex(index: number, item: any): number {
    return item.PortMasterSid || index;
  }

  deletePort(id: number): void {
    this.dialog.open(DeleteWarningComponent)
      .afterClosed()
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.masterService.deletePortById(id).subscribe(() => {
          this.appSettingService.showSuccess('Deleted!');
          this.loadPorts();
        });
      });
  }

  navigateToCreatePort(): void {
    this.router.navigate(['master/port-master/view']);
  }

  loadAllRegions(){
    this.masterService.getAllZones().subscribe(
      (resp)=>{
        this.regionList = resp;
      }
    )
  }

  getRegionNameById(RegionMasterSid: number): string {
  if (!this.regionList || !Array.isArray(this.regionList)) return '';
  const region = this.regionList.find(r => r.ZoneMasterSid === RegionMasterSid);
  return region?.ZoneName || '';
}

  resetPage(): void {
    this.page = 1;
    this.filterValue = '';
    this.searched = false;
    this.portList = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'PortName';
  this.sortDirection = 'asc';
  }
  report(): void {
    const formattedData = this.portList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended',
      countryName: item.countryMaster?.countryName || '—',
      regionName: this.getRegionNameById(item.ZoneMasterSid)
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'PortName', label: 'Port Name' },
        { key: 'PortCode', label: 'Port Code' },
        { key: 'countryName', label: 'Country' },
        { key: 'regionName', label: 'Region' },
        { key: 'PortType', label: 'Port Type' },
        { key: 'TerminalCode', label: 'Terminal Code' },
        { key: 'status', label: 'Status' }
      ],
      fileName: 'Port-Report',
      title: companyName
    });
  }
  clearFilterValue(){
      this.filterValue = '';
    }

}
