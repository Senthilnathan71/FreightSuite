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

@Component({
  selector: 'app-commodity-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    RouterModule,
    NgbPaginationModule
  ],
  templateUrl: './commodity-list.component.html',
  styleUrls: ['./commodity-list.component.scss']
})
export class CommodityListComponent {
  searchType = 'CommodityName';
  filterValue = '';
  results: Commodity[] = [];
  commodityList: Commodity[] = [];
  searchPerformed = false;
  userData : any;
  
  // Pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  loading = false;

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
        }
      }
    )
  }

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'S' 
        : this.filterValue,
    };
    
    this.loading = true;
    this.masterService.searchCommodity(payload).subscribe({
      next: (res) => {
        this.results = res;
        this.searchPerformed = true;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.appSettingService.showError('Failed to search commodities');
      }
    });
  }

  updatePaginatedData() {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.commodityList = this.results.slice(startIndex, endIndex);
  }

  navigateToCreate() {
    this.router.navigate(['master/commodity/entry']);
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
            this.search(); // Refresh the list after deletion
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