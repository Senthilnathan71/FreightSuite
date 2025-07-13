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

@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    ListpageComponent,
    FavoriteStarComponent
  ],
  templateUrl: './milestone-list.component.html',
  styleUrl: './milestone-list.component.scss'
})
export class MilestoneListComponent {
  searchType = 'MilestoneName';
  filterValue = '';
  milestoneList: any[] = [];
  allMilestones: any[] = [];
  searchPerformed = false;
  loading: boolean = false;
  departmentOptions: any[] = [];
  userData: any;
  sortColumn: string = 'MilestoneName'; 
  sortDirection: string = 'asc';

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;
  isFavorite: boolean = false;

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  
  shipmentTypeOptions = [
    { value: 'Export', label: 'Export' },
    { value: 'Import', label: 'Import' },
    { value: 'Transshipment', label: 'Transshipment' }
  ];

  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit() {
    this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
      }
    });
    this.loadDepartments();
    this.loadMilestones();
  }

  loadMilestones(): void {
  this.loading = true;
  
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize,
    sortColumn: this.sortColumn,
    sortDirection: this.sortDirection
  };

  this.masterService.searchMilestoneList(params).subscribe({
    next: (response: any) => {
      if (response) {
        this.allMilestones = response.items || response;
        this.totalLengthOfCollection = response.totalCount || response.length;
        this.applySorting();
        this.milestoneList = this.allMilestones; 
        this.searchPerformed = true;
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Error fetching milestones:', err);
      this.allMilestones = [];
      this.milestoneList = []; 
      this.totalLengthOfCollection = 0;
      this.loading = false;
    }
  });
}


  loadDepartments() {
    this.loading = true;
    this.masterService.getAllDepartments().subscribe({
      next: (res: any) => {
        this.departmentOptions = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading departments:', err);
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
  this.loadMilestones();
  this.applySorting();
  this.updatePaginatedData();
}

applySorting() {
  this.allMilestones.sort((a, b) => {
    let valueA = a[this.sortColumn];
    let valueB = b[this.sortColumn];
    if (this.sortColumn === 'departmentName') {
      valueA = a.departmentMaster?.departmentName || a.departmentName || '';
      valueB = b.departmentMaster?.departmentName || b.departmentName || '';
    } 

    
    
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

  

  getShipmentTypeLabel(type: string): string {
    const found = this.shipmentTypeOptions.find(t => t.value === type);
    return found ? found.label : type;
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadMilestones();
  }
  clearFilterValue() {
    this.filterValue = '';
     this.loadMilestones();
  }

  trackByMilestoneId(index: number, item: any): number {
    return item.MilestoneMasterSid;
  }

  softDelete(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteMilestoneById(id).subscribe({
          next: (resp: any) => {
            this.appSettingService.showSuccess("Milestone deleted successfully!");
            
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateMilestone() {
    this.router.navigate(['master/milestone/entry']);
  }

  resetPage() {
    this.filterValue = '';
    this.searchType = 'MilestoneName';
    this.page = 1;
    this.searchPerformed = false;
    this.milestoneList = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'MilestoneName'; 
  this.sortDirection = 'asc';
  }

  getStatusClass(status: string): string {
    return status === 'A' ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }

  report(): void {
    const formattedData = this.milestoneList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'MilestoneName', label: 'Milestone Name' },
        { key: 'MilestoneCode', label: 'Milestone Code' },
        { key: 'departmentName', label: 'Department' },
        { key: 'ShipmentType', label: 'Shipment Type' },
        { key: 'SortBy', label: 'Order By' },
        { key: 'AutoCapture', label: 'Auto Capture' },
        { key: 'AutomailRequire', label: 'Auto Mail' },
        { key: 'status', label: 'Status' }
      ],
      fileName: 'Milestone-Report',
      title: companyName
    });
  }
}