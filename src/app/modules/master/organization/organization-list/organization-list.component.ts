import { Component, OnInit } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [FeatherModule, NgSelectModule, NgbPaginationModule, CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './organization-list.component.html',
  styleUrl: './organization-list.component.scss'
})
export class OrganizationListComponent implements OnInit {

   modeOfStatus =[
        { value:'Active',name:'Active'},
        { value:'Invalid',name:'Invalid'},
        { value:'Block',name:'Block'},
    ]
  searchType = 'CustomerName';
  filterValue = '';
  results: any[] = [];
  organizationList: any[] = []
  searchPerformed = false;
  userData : any;

  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;

  constructor(private masterService: MasterService, private router: Router,
    private dialog: MatDialog, private appSettingService: AppSettingsService,
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
    this.masterService.searchOrganizationList(payload).subscribe((res: any) => {
      this.results = res;
      this.searchPerformed = true;
      this.updatePaginatedData();  // Update paginated data
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.organizationList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteOrganization(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteOrganizationById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.router.navigate(['master/department/list'])
        });
      }
    });
  }

  navigateToCreateOrganization() {
    this.router.navigate(['master/organization/entry'])
  }

  reset(){
    this.organizationList=[];
    this.totalLengthOfCollection=0;
  }

  report(): void {
    const formattedData = this.organizationList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'CustomerName', label: 'Customer Name' },
                { key: 'CustomerShortCode', label: 'Type' },
                { key: 'CustomerAliasName', label: 'Short Name' },
                { key: 'Website', label: 'PAN/Vat' },
                { key: 'LocalLanguage', label: 'Country' },
                { key: 'status', label: 'Status' },
            ],
            fileName: 'Organization-Report', 
            title: companyName
        });
    }
}
