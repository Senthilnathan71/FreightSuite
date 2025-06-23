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
    ListpageComponent
  ],
  templateUrl: './vessel-list.component.html',
  styleUrl: './vessel-list.component.scss'
})
export class VesselListComponent {
  searchType = 'VesselName';
  filterValue: any;
  results: any[] = [];
  vesselList: any[] = []
  searchPerformed = false;
  userData: any;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;

  constructor(private masterService: MasterService, private router: Router,
    private appSettingService: AppSettingsService, private dialog: MatDialog,
    private excelReportService: ExcelExportService
  ) { }
  ngOnInit() {
    this.appSettingService.getUser().subscribe(user => {
    if (user) {
      this.userData = user;
    }
  });}

  onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}

  search() {
    const intSearch = [
      'YearofBuilt',
      'NRT'
    ]
    const payload = {
      searchType: this.searchType,
      filterValue: intSearch.includes(this.searchType) ? Number(this.filterValue) : this.filterValue,
    }
    this.masterService.searchVesselList(payload).subscribe((res: any) => {
      this.results = res;
      this.searchPerformed = true;
      this.updatePaginatedData();  // Update paginated data
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.vesselList = this.results.slice(startIndex, endIndex);
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
          // this.router.navigate(['master/vessel/list'])
          this.search();
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
  }

  report(): void {
  const formattedData = this.vesselList.map(item => ({
    ...item,
    status: item.status === 'A' ? 'Active' : 'Suspended'
  }));

  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

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

}
