import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';

@Component({
  selector: 'app-charge-list',
  standalone: true,
  imports: [CommonModule, FeatherModule, FormsModule, NgbPaginationModule, RouterModule, ListpageComponent],
  templateUrl: './charge-list.component.html',
  styleUrls: ['./charge-list.component.scss']
})
export class ChargeListComponent {
  searchType = 'chargeName';
  filterValue = '';
  results: any[] = [];
  chargeList: any[] = [];
  searchPerformed = false;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;
  userData: any;

  constructor(
    private masterService: MasterService,
    private excelReportService: ExcelExportService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.appSettingService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
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
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue,
    };
    this.masterService.searchChargeList(payload).subscribe((res: any) => {
      this.results = Array.isArray(res) ? res : res.data || [];
      this.searchPerformed = true;
      this.updatePaginatedData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.chargeList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCharge(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteChargeById(id).subscribe(() => {
          this.appSettingService.showSuccess("Deleted!");
          this.search();
        });
      }
    });
  }

  navigateToCreateCharge() {
    this.router.navigate(['master/charge/entry']);
  }

  resetPage() {
    this.searchPerformed = false;
    this.chargeList = [];
    this.totalLengthOfCollection = 0;
    this.filterValue = '';
    this.searchType = 'chargeName';
    this.page = 1;
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
}