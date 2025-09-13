import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgbPagination, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ExcelExportService } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-crago-receipt-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgbPagination,
    NgbModalModule,
    NgSelectModule,
    FeatherModule,
    ReactiveFormsModule,
    FormsModule,
    FavoriteStarComponent,
    NgxSpinnerModule
  ],
  templateUrl: './crago-receipt-list.component.html',
  styleUrl: './crago-receipt-list.component.scss'
})
export class CragoReceiptListComponent {
  cargoList: any[] = [];
  results: any[] = [];
  filterValue = '';
  page = 1;
  pageSize = 15;
  totalLengthOfCollection = 0;
  searched = false;
  sortColumn: string = 'BookingDate';
  sortDirection: string = 'desc';

  // Company/Branch
  currentCompany: any;
  currentBranch: any;
  userData: any;

  constructor(
    private router: Router,
    private appSettingService: AppSettingsService,
    private operationService: OperationService,
     private spinner: NgxSpinnerService,
     private excelReportService: ExcelExportService,
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch')
    );
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    this.loadCargoReceipts();
  }

  loadCargoReceipts(): void {
    this.spinner.show();
    let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;

    const params = {
      search: this.filterValue ? this.filterValue.trim() : '',
      page: this.page,
      pageSize: this.pageSize,
      sortDirection: this.sortDirection,
      activeCompanyId: CompanyMasterSid,
      filterType: 'cargoReceipt' // optional, if backend expects
    };

    this.operationService.search(params).subscribe({
      next: (response) => {
        if (response.status) {
          this.cargoList = response.data.items;
          this.results = [...this.cargoList];
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        } else {
          this.appSettingService.showError(response.message);
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error fetching cargo receipts:', err);
        this.cargoList = [];
        this.results = [];
        this.totalLengthOfCollection = 0;
      }
    });
  }

  applySorting() {
    this.results.sort((a, b) => {
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

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  updatePaginatedData(): void {
    this.loadCargoReceipts();
  }

  resetPage(): void {
    this.filterValue = '';
    this.page = 1;
    this.cargoList = [];
    this.totalLengthOfCollection = 0;
    this.searched = false;
    this.sortColumn = 'BookingDate';
    this.sortDirection = 'desc';
    this.loadCargoReceipts();
  }

  report(): void {
      const formattedData = this.cargoList.map(item => ({
        ...item,
        departmentName: item.departmentMaster?.departmentName,
        status: item.status === 'A' ? 'Active' : 'Suspended'
      }));
      //  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
        const companyName = this.currentCompany?.companyName ?? 'Company';
       this.excelReportService.exportAsExcel({
        data: formattedData,
        headers: [
          { key: 'departmentName', label: 'Department Name' },
          { key: 'BookingNo', label: 'Booking No' },
          { key: 'BookingDateTime', label: 'Booking Date' },
          { key: 'CustomerName', label: 'Customer Name' },
          { key: 'POO', label: 'POO' },
          { key: 'POL', label: 'POL' },
          { key: 'POD', label: 'POD' },
          { key: 'FPD', label: 'FPD' },
          { key: 'status', label: 'Status' },
        ],
        fileName: 'Cargo-Receipt-Report',
        title: companyName
       });
    }

  TonavigateCreate() {
          this.router.navigate(['operation/cargo-receipt/entry']);
        }

  clearFilterValue() {
    this.filterValue = '';
  }

  trackByIndex(index: number, item: any): number {
  return index;
}


}
