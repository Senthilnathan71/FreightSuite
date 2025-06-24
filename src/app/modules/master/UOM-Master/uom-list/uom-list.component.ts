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
  selector: 'app-uom-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    ListpageComponent
  ],
  templateUrl: './uom-list.component.html',
  styleUrl: './uom-list.component.scss'
})
export class UOMListComponent {
  searchType = 'UOMName';
  filterValue = '';
  results: any[] = [];
  uomList: any[] = [];
  searchPerformed = false;
  userData: any;
  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;

  constructor(
    private masterService: MasterService, 
    private router: Router,
    private appSettingService: AppSettingsService, 
    private dialog: MatDialog,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit() { this.appSettingService.getUser().subscribe(user => {
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
      filterValue:this.filterValue,
    }
    this.masterService.searchUomList(payload).subscribe((res: any) => {
      this.results = res;
      this.searchPerformed = true;
      this.updatePaginatedData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.uomList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteUom(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteUomById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.search(); // Refresh the list after deletion
        });
      }
    });
  }

  navigateToCreateUom() {
    this.router.navigate(['master/uom-master/view'])
  }

  resetPage() {
    this.uomList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'UOMName';
    this.page = 1;
  }

  report(): void {
 
  const formattedData = this.uomList.map(item => ({
    ...item,
    status: this.getStatusText(item.status) 
  }));

  
  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'UOMName', label: 'UOM Name' },
      { key: 'UOMCode', label: 'UOM Code' },
      { key: 'status', label: 'Status' }
    ],
    fileName: 'UOM-Report', 
    title: companyName
  });
}

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }
}