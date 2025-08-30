import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { MasterService } from 'src/app/modules/master/master.service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';


@Component({
  selector: 'app-chart-account-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    FeatherModule,
    FavoriteStarComponent,
    ReactiveFormsModule
  ],
  templateUrl: './chart-account-list.component.html',
  styleUrl: './chart-account-list.component.scss'
})
export class ChartAccountListComponent {

  chartAccountList: any[] = [];
  filterValue: string = '';
  userData: any;
  searched = false;
  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  // sorting
  sortColumn: string = 'Name';
  sortDirection: string = 'asc';
  
  // Company
  currentCompany : any;
  currentBranch : any;
  
  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
		}
    this.loadChartAccounts();
  }

  loadChartAccounts(): void {
  let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      activeCompanyId : CompanyMasterSid,
    };

    this.masterService.searchCoa(params).subscribe({
      next: (response) => {
        if (response?.status) {
          this.chartAccountList = response.data.items;
          console.log(this.chartAccountList,"Chart");
          
          this.totalLengthOfCollection = response.data.totalCount;
          this.applySorting();
          this.searched = true;
        }else {
        this.appSettingService.showError(response.message);
      }
      },
      error: (err) => {
        console.error('Error fetching chart accounts:', err);
        this.chartAccountList = [];
        this.totalLengthOfCollection = 0;
      }
    });
  }


  deleteChartAccount(id: number) {
  const dialogRef = this.dialog.open(DeleteWarningComponent); 

  dialogRef.afterClosed().subscribe(result => {
    if (result === true) {
      this.masterService.deleteCOA(id).subscribe(
        (resp: any) => {
          this.appSettingService.showSuccess("Chart Account Deleted!");
          // this.search(); 
        },
        (error) => {
          this.appSettingService.showError("Error Deleting Chart Account", error);
        }
      );
    }
  });
}
softDeleteTaxGroup(id: number): void {
  const dialogRef = this.dialog.open(DeleteWarningComponent);
  dialogRef.afterClosed().subscribe((result) => {
    if (result === true) {
      this.masterService.deleteCOA(id).subscribe((resp: any) => {
        this.appSettingService.showSuccess('Deleted!');
       
      });
    }
  });
}


  resetPage(): void {
    this.chartAccountList = [];
    this.totalLengthOfCollection = 0;
    this.sortColumn = 'Name';
    this.sortDirection = 'asc';
    this.searched = false;
    this.filterValue = '';
  }

  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  applySorting(): void {
    this.chartAccountList.sort((a, b) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];

      valueA = valueA ?? '';
      valueB = valueB ?? '';

      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

   updatePaginatedData(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.loadChartAccounts();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  report(): void {
    const formattedData = this.chartAccountList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

    // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
    const companyName = this.currentCompany?.companyName ?? 'Company';
    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'LedgerName', label: 'Name' },
        { key: 'LedgerCode', label: 'Ledger Code' },
        { key: 'GroupName', label: 'Group' },
        { key: 'SubGroupName', label: 'Sub Group' },
        { key: 'status', label: 'Status' }
      ],
      fileName: 'Chart-of-Accounts-Report',
      title: companyName
    });
  }

  navigateToCreate() {
    this.router.navigate(['accounts/chart-accounts/entry'])
  }

  clearFilterValue() {
    this.filterValue = '';
  }
}
