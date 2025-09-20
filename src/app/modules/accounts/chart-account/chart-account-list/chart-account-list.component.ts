import { Component, OnInit } from '@angular/core';
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
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { CommonPaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { Observable } from 'rxjs';


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
    ReactiveFormsModule,
    NgxSpinnerModule,
    CommonPaginationComponent
  ],
  templateUrl: './chart-account-list.component.html',
  styleUrl: './chart-account-list.component.scss'
})
export class ChartAccountListComponent extends BaseListComponent implements OnInit {

  chartAccountList: any[] = [];
  // filterValue: string = '';
  userData: any;
  searched = false;
  // pagination
  // page = 1;
  // pageSize = 10;
  // totalLengthOfCollection = 0;
  // sorting
  // sortColumn: string = 'Name';
  // sortDirection: string = 'asc';

  // Company
  currentCompany: any;
  currentBranch: any;
// Selected Row 
  selectedRowId: string | null = null;
  protected config: ListComponentConfig = {
    storageKey: 'chart-account-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'LedgerName',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };
  private readonly SELECTED_ROW_KEY = 'charts-of-accounts-selected-row';
  get allChartAccounts() { return this.allItems; }
  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private dialog: MatDialog,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit() {
    // this.appSettingService.getUser().subscribe(user => {
    //   if (user) {
    //     this.userData = user;
    //   }
    // });
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    console.log('Restored selected row ID:', this.selectedRowId);
    // this.loadChartAccounts();
    super.ngOnInit();
    this.restoreSelectedRow();
  }

  // loadChartAccounts(): void {
  // this.spinner.show();
  // let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
  //   const params = {
  //     search: this.filterValue?.trim() || '',
  //     page: this.page,
  //     pageSize: this.pageSize,
  //     sortColumn: this.sortColumn,
  //     sortDirection: this.sortDirection,
  //     activeCompanyId : CompanyMasterSid,
  //   };

  //   this.masterService.searchCoa(params).subscribe({
  //     next: (response) => {
  //       if (response?.status) {
  //         this.chartAccountList = response.data.items;
  //         console.log(this.chartAccountList,"Chart");

  //         this.totalLengthOfCollection = response.data.totalCount;
  //         this.applySorting();
  //         this.searched = true;
  //       }else {
  //       this.appSettingService.showError(response.message);
  //     }
  //     this.spinner.hide();
  //     },
  //     error: (err) => {
  //       console.error('Error fetching chart accounts:', err);
  //       this.chartAccountList = [];
  //       this.totalLengthOfCollection = 0;
  //     }
  //   });
  // }
 // For Chart of Accounts table
 selectRow(Chart: any): void {
    const ChartId = String(Chart.LedgerSid);
    this.selectedRowId = this.selectedRowId === ChartId ? null : ChartId;
    console.log('Selected row changed to:', this.selectedRowId);
    this.saveSelectedRow();
}

isRowSelected(Chart: any): boolean {
    const selectedId = this.selectedRowId ? String(this.selectedRowId) : null;
    const ChartId = Chart.LedgerSid ? String(Chart.LedgerSid) : null;
    const isSelected = selectedId === ChartId;

    if (isSelected) {
        console.log('Row is selected:', Chart.LedgerSid, 'selectedRowId:', this.selectedRowId);
    }
    return isSelected;
}


    private saveSelectedRow(): void {
        try {
            if (this.selectedRowId) {
                const idToSave = String(this.selectedRowId);
                localStorage.setItem(this.SELECTED_ROW_KEY, idToSave);
                console.log('Saved selected row ID:', idToSave, 'original:', this.selectedRowId);
            } else {
                localStorage.removeItem(this.SELECTED_ROW_KEY);
                console.log('Cleared selected row');
            }
        } catch (error) {
            console.error('Error saving selected row:', error);
        }
    }

    private restoreSelectedRow(): void {
        try {
            const savedRowId = localStorage.getItem(this.SELECTED_ROW_KEY);
            console.log('Found saved row ID in localStorage:', savedRowId);
            if (savedRowId) {
                this.selectedRowId = savedRowId;
            }
        } catch (error) {
            console.error('Error restoring selected row:', error);
        }
    }

  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.masterService.searchCoa(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams {
    return {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };
  }

  protected processSearchResults(response: any): void {
    this.spinner.hide();
    if (response.status) {
      this.allItems = response.data.items.map(item => ({
        ...item,
        status: item.status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
       this.restoreSelectedRow();
      this.applySorting();

    } else {
      this.appSettingService.showError('Error fetching Chart of Accounts.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }
  
  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error fetching Chart of Accounts.');
    console.error('Error fetching Chart of Accounts', error);
    super.handleSearchError(error);
  }


  searchChartofAccounts() {
    this.page=1;
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  updatePaginationData(): void {
    this.search();
  }

  override trackBy(index: number, item: any): number {
    return item.LedgerSid || index;
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
          // this.loadChartAccounts();
        });
      }
    });
  }


  // resetPage(): void {
  //   this.chartAccountList = [];
  //   this.totalLengthOfCollection = 0;
  //   this.sortColumn = 'Name';
  //   this.sortDirection = 'asc';
  //   this.searched = false;
  //   this.filterValue = '';
  //   this.loadChartAccounts();
  // }

  // sort(column: string): void {
  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  //   this.applySorting();
  // }

  // applySorting(): void {
  //   this.chartAccountList.sort((a, b) => {
  //     let valueA = a[this.sortColumn];
  //     let valueB = b[this.sortColumn];

  //     valueA = valueA ?? '';
  //     valueB = valueB ?? '';

  //     valueA = valueA.toString().toLowerCase();
  //     valueB = valueB.toString().toLowerCase();

  //     if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
  //     if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
  //     return 0;
  //   });
  // }

  updatePaginatedData(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    // this.loadChartAccounts();
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

  // clearFilterValue() {
  //   this.filterValue = '';
  // }
}
