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
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PageHeaderComponent, HeaderAction } from 'src/app/shared/components/header-list/header-list.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableAction } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';

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
    RouterModule,
    ReusableTableComponent,
    PageHeaderComponent
  ],
  templateUrl: './report-master-list.component.html',
  styleUrl: './report-master-list.component.scss'
})
export class ReportMasterListComponent extends BaseListComponent implements OnInit {
  allReports: any[] = [];
  tableLoading: boolean = false;

  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentCompany: any;

  // Table configuration
  tableConfig: TableConfig = {
    columns: [
      { key: 'ReportName', label: 'Report Name', sortable: true, filterable: true },
      { key: 'ReportDisplayName', label: 'Display Report Name', sortable: true, filterable: true },
      { key: 'ReportFormat', label: 'Report Format', sortable: true, filterable: true }
    ],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View',
        condition: (row: any) => this.hasPermission('View')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete',
        class: 'text-danger',
        condition: (row: any) => this.hasPermission('Delete')
      }
    ],
    trackByKey: 'ReportMasterSid',
    emptyMessage: 'No Reports found'
  };

  // Component configuration
  protected config: ListComponentConfig = {
    storageKey: 'report-master-list-state',
    defaultPageSize: 15,
    defaultSortColumn: 'ReportName',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  // Header actions
  headerActions: HeaderAction[] = [
    {
      label: 'Create',
      icon: 'fas fa-plus',
      action: 'create',
      condition: this.hasPermission('Add')
    },
    {
      label: 'Report',
      icon: 'fas fa-file-alt',
      action: 'report',
      disabled: this.totalLengthOfCollection === 0
    },
    {
      label: 'Reset',
      icon: 'fas fa-sync-alt',
      action: 'reset'
    }
  ];

  constructor(
    private router: Router,
    private spinner: NgxSpinnerService,
    private masterService: MasterService,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }

    // Call parent ngOnInit which will handle state restoration and initial load
    super.ngOnInit();
  }


  // Abstract methods implementation
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    return this.masterService.searchReportMaster(this.getSearchParams());
  }

  protected getSearchParams(): SearchParams {
    const companyId = this.currentCompany?.CompanyMasterSid;
    return {
      search: this.filterValue.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      activeCompanyId: companyId
    };
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    if (response.status) {
      this.allReports = response.data.items || [];
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.searchPerformed = true;
    } else {
      this.appSettingService.showError(response.message);
      this.allReports = [];
      this.totalLengthOfCollection = 0;
    }
  }

  // Permission methods
  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    if (currentMenuId && userRole) {
      this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions)
            .filter(key => this.currentMenuPermissions[key] === 'isTrue');
        }
      });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  // Header action handlers
  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.page = 1;
    this.loadData();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.page = 1;
    this.loadData();
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.navigateTocreateReport();
        break;
      case 'report':
        this.reportExport();
        break;
      case 'reset':
        this.resetPage();
        break;
    }
  }

  // Table event handlers
  onTableActionClick(event: any): void {
    switch (event.action) {
      case 'view':
        this.router.navigate(['/master/report-master/entry', event.row.ReportMasterSid]);
        break;
      case 'delete':
        this.deleteReport(event.row.ReportMasterSid);
        break;
    }
  }

  onTableRowClick(row: any): void {
    // Handle row click if needed
  }

  onTableSortChange(sortConfig: any): void {
    this.sortColumn = sortConfig.column;
    this.sortDirection = sortConfig.direction === 'asc' ? 'asc' : 'desc';
    this.loadData();
  }

  // Navigation
  navigateTocreateReport(): void {
    this.router.navigate(['/master/report-master/entry']);
  }

  // Export functionality
  reportExport(): void {
    const formattedData = this.allReports.map(item => ({
      ReportName: item.ReportName,
      ReportDisplayName: item.ReportDisplayName,
      ReportFormat: item.ReportFormat
    }));

    const companyName = this.currentCompany?.companyName || 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'ReportName', label: 'Report Name' },
        { key: 'ReportDisplayName', label: 'Report Display Name' },
        { key: 'ReportFormat', label: 'Report Format' }
      ],
      fileName: 'Report-Master',
      title: companyName
    });
  }

  // Delete functionality
  deleteReport(reportId: number): void {
    const modalRef = this.dialog.open(DeleteWarningComponent);
    modalRef.afterClosed().subscribe(result => {
      if (result) {
        this.masterService.deleteReportMasterDetail(reportId).subscribe({
          next: (res: any) => {
            if (res.status) {
              this.appSettingService.showSuccess('Report deleted successfully.');
              this.loadData();
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
}
