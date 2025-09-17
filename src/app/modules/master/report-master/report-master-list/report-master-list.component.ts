import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { MatDialog } from '@angular/material/dialog';

import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterService } from '../../master.service';

@Component({
  selector: 'app-report-master-list',
  standalone: true,
  imports: [
    FeatherModule,
    FavoriteStarComponent,
    NgxSpinnerModule,
    NgbPaginationModule,
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './report-master-list.component.html',
  styleUrl: './report-master-list.component.scss'
})
export class ReportMasterListComponent implements OnInit {
  reportList: any[] = [];
  filteredReportList: any[] = [];

  filterValue: string = '';
  isFavorite: boolean = false;
  searched: boolean = false;
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  page: number = 1;
  pageSize: number = 15;
  totalAmountOfCollection: number = 0;

  sortColumn: string = 'ReportName';
  sortDirection: string = 'asc';

  currentCompany: any;

  constructor(
    private router: Router,
    private spinner: NgxSpinnerService,
    private masterService: MasterService,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    // this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.loadReports();
  }


  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId)
    console.log(userRole)
    if (currentMenuId && userRole) {
      this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions)
            .filter(key => this.currentMenuPermissions[key] === 'isTrue');
          console.log(this.permissions)
        }
      });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  navigateTocreateReport() {
    this.router.navigate(["master/report-master/entry"]);
  }

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  loadReports() {
    this.spinner.show();
    const companyId = this.currentCompany?.CompanyMasterSid;

    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      activeCompanyId: companyId
    };

    this.masterService.searchReportMaster(params).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.reportList = res.data.items || [];
          this.totalAmountOfCollection = res.data.totalCount || 0;
          this.applySorting();
          this.updatePaginationData();
          this.searched = true;
        } else {
          this.appSettingService.showError(res.message);
        }
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
        this.reportList = [];
        this.totalAmountOfCollection = 0;
        this.appSettingService.showError('Failed to load report master list.');
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
    this.updatePaginationData();
  }

  applySorting() {
    if (!Array.isArray(this.reportList)) return;

    this.reportList.sort((a, b) => {
      let valueA = a[this.sortColumn] ?? '';
      let valueB = b[this.sortColumn] ?? '';

      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  updatePaginationData() {
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
    this.filteredReportList = this.reportList.slice(start, end);
  }

  reset() {
    this.filterValue = '';
    this.page = 1;
    this.sortColumn = 'ReportName';
    this.sortDirection = 'asc';
    this.searched = false;
    this.loadReports();
  }

  reportExport() {
    const formattedData = this.reportList.map(item => ({
      ReportName: item.ReportName,
      ReportDisplayName: item.ReportDisplayName,
      ReportFormat: item.ReportFormat,
      // Status: "A"
    }));

    const companyName = this.currentCompany?.companyName || 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'ReportName', label: 'Report Name' },
        { key: 'ReportDisplayName', label: 'Report Display Name' },
        { key: 'ReportFormat', label: 'Report Format' },
        // { key: 'Status', label: 'Status' }
      ],
      fileName: 'Report-Master',
      title: companyName
    });
  }

  deleteReport(reportId: number) {
    const modalRef = this.dialog.open(DeleteWarningComponent);
    modalRef.afterClosed().subscribe(result => {
      if (result) {
        this.masterService.deleteReportMasterDetail(reportId).subscribe({
          next: (res: any) => {
            if (res.status) {
              this.appSettingService.showSuccess('Report deleted successfully.');
              this.loadReports();
            } else {
              this.appSettingService.showError(res.message);
            }
          },
          error: () => {
            this.appSettingService.showError('Error deleting report.');
          }
        });
      }
    });
  }

  clearFilterValue() {
    this.filterValue = '';
  }
}
