import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-charge-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    ReactiveFormsModule,
    NgbPaginationModule, 
    RouterModule, 
    ListpageComponent,
    FavoriteStarComponent
  ],
  templateUrl: './charge-list.component.html',
  styleUrls: ['./charge-list.component.scss']
})
export class ChargeListComponent {
  filterValue: any;
  chargeList: any[] = [];
  searchPerformed = false;
  userData: any;
  loading: boolean = false;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number = 0;

  // sorting
  sortColumn: string = 'chargeName';
  sortDirection: string = 'asc';

  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit() {
    this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
      }
    });
    this.loadCharges();
  }

  // In your component
loadCharges(): void {
  this.loading = true;
  
  this.masterService.searchChargeList({
    search: this.filterValue || '',
    page: this.page,
    pageSize: this.pageSize
  }).subscribe({
    next: (res) => {
      this.chargeList = res?.items || res || []; // Handle both formats
      this.totalLengthOfCollection = res.data?.totalCount || this.chargeList.length;
      this.applySorting();
      this.searchPerformed = true;
      this.loading = false;
    },
    error: (err) => {
      this.chargeList = [];
      this.totalLengthOfCollection = 0;
      this.loading = false;
    }
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

  applySorting() {
    this.chargeList.sort((a, b) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];
      
      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';
      
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
    this.loadCharges();
  }

  trackByChargeId(index: number, item: any): number {
    return item.ChargeMasterSid;
  }

  deleteCharge(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteChargeById(id).subscribe({
          next: () => {
            this.appSettingService.showSuccess("Deleted!");
            this.loadCharges();
          },
          error: (err) => {
            this.appSettingService.showError("Error Deleting Charge", err);
          }
        });
      }
    });
  }

  navigateToCreateCharge() {
    this.router.navigate(['master/charge/entry']);
  }

  resetPage() {
    this.filterValue = '';
    this.page = 1;
    this.searchPerformed = false;
    this.chargeList = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'chargeName';
    this.sortDirection = 'asc';
  }

  report(): void {
    const formattedData = this.chargeList.map(item => ({
      ...item,
      Status: item.Status === 'A' ? 'Active' : 'Inactive'
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'chargeCode', label: 'Charge Code' },
        { key: 'chargeName', label: 'Charge Name' },
        { key: 'UOM', label: 'UOM' },
        { key: 'SAC', label: 'HSN/SAC' },
        { key: 'TDSset', label: 'TDS Set' },
        { key: 'Status', label: 'Status' }
      ],
      fileName: 'Charge-Report',
      title: companyName
    });
  }

  clearFilterValue() {
    this.filterValue = '';
  }
}