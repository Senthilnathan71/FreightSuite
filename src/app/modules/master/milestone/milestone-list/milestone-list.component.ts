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

@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    ListpageComponent
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

  onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}

  search() {
    this.loading = true;
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue
    };

    this.masterService.searchMilestoneList(payload).subscribe({
      next: (res: any) => {
        this.allMilestones = (res.data || res).map(milestone => {
          const department = this.departmentOptions.find(d => d.DepartmentMasterSid === milestone.DepartmentMasterSid);
          return {
            ...milestone,
            departmentName: department ? department.DepartmentName : 'N/A',
            ShipmentType: this.getShipmentTypeLabel(milestone.ShipmentType),
            AutoCapture: milestone.AutoCapture === 'Y' ? 'Yes' : 'No',
            AutomailRequire: milestone.AutomailRequire === 'Y' ? 'Yes' : 'No'
          };
        });
        
        this.milestoneList = [...this.allMilestones];
        this.totalLengthOfCollection = this.milestoneList.length;
        this.searchPerformed = true;
        this.page = 1;
        this.updatePaginatedData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.loading = false;
      }
    });
  }

  getShipmentTypeLabel(type: string): string {
    const found = this.shipmentTypeOptions.find(t => t.value === type);
    return found ? found.label : type;
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.milestoneList = this.allMilestones.slice(startIndex, endIndex);
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
            this.search(); // Refresh search results
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