import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';

import { MasterService } from 'src/app/modules/master/master.service';
@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [FeatherModule, FormsModule, CommonModule,RouterModule],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss',
})
export class CompanyListComponent implements OnInit {
  searchType = 'companyName';
  filterValue = '';
  results: any[] = [];
  companyList: any[] = []
  searchPerformed = false;
  userData : any;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;

  constructor(private masterService: MasterService, private router: Router,
    private appSettingService: AppSettingsService, private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService
  ) { }
  ngOnInit() {
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
      filterValue: this.filterValue,
    }
    this.masterService.searchCompanyList(payload).subscribe((res: any) => {
      this.results = res;
      this.searchPerformed = true;
      this.updatePaginatedData();  // Update paginated data
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }


  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.companyList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCompany(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteCompanyById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.search();
        });
      }
    });
  }

  navigateToCreateDepartment() {
    this.router.navigate(['master/company/entry'])
  }

  resetPage() {
    this.companyList = []
    this.totalLengthOfCollection = 0
  }

  report(): void {
    const formattedData = this.companyList.flatMap(item => {
      if (!item.branchMaster || item.branchMaster.length === 0) {
        return ({
          companyName : item.companyName,
          companyCode : item.companyCode,
          branchName : '',
          city : '',
          state : '',
          country : '',
          gst : '',
          status: item.status === 'A' ? 'Active' : 'Suspended'
      })
      }
      return item.branchMaster.map(branch=>({
        companyName : item.companyName,
          companyCode : item.companyCode,
          branchName : branch.branchName,
          city : branch.cityMaster?.cityName || '',
          state : branch.stateMaster?.stateName || '',
          country : branch.countryMaster?.countryName || '',
          gst : branch.taxRegistrationNo,
          status: branch.status === 'A' ? 'Active' : 'Suspended'
      }))
    });

        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'companyName', label: 'Company Name' },
                { key: 'companyCode', label: 'Company Code' },
                { key: 'branchName', label: 'Branch Name' },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'country', label: 'Country' },
                { key: 'gst', label: 'Vat/GST No' },
                { key: 'status', label: 'Status' },
            ],
            fileName: 'Company-Report', 
            title: companyName
        });
    }
}
