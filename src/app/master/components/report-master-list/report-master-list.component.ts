import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { MatDialog } from '@angular/material/dialog';

import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterService } from 'src/app/modules/master/master.service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PageHeaderComponent, HeaderAction } from 'src/app/shared/components/header-list/header-list.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableSortConfig, TableFilter, TableColumn } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DropdownMenuItem } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';

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
  styleUrls: ['./report-master-list.component.scss']
})
export class ReportMasterListComponent extends BaseListComponent implements OnInit {
  allReports: any[] = [];
  tableLoading: boolean = false;
  tableConfig: TableConfig;
  headerActions: HeaderAction[] = [];
  modalDropdownItems: DropdownMenuItem[] = [];

  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentCompany: any;

  // Component configuration
  protected config: ListComponentConfig = {
    storageKey: 'report-master-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'ReportName',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100, 500],
    maxPagesToShow: 3
  };

  constructor(
    private router: Router,
    private spinner: NgxSpinnerService,
    private masterService: MasterService,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    paginationService: PaginationService,
    public mps : MenuPermissionService,
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.mps.init().subscribe(()=>{
      this.initializeHeaderActions();
      this.initializeTableConfig();
    });
    this.initializeModalDropdownItems();

    // Call parent ngOnInit which will handle state restoration and initial load
    super.ngOnInit();
  }

  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: [
        { 
          key: 'ReportName', 
          label: 'Report Name', 
          sortable: true, 
          filterable: true 
        },
        { key: 'ReportDisplayName',
          label: 'Display Report Name', 
          sortable: true, 
          filterable: true 
        },
        { key: 'ReportFormat', 
          label: 'Report Format', 
          sortable: true, 
          filterable: true 
        }
      ],
      actions: [
        {
         icon: 'fas fa-eye',
         label: 'View',
         action: 'view',
         tooltip: 'View Charge',
         state : !this.mps.can('view')
        }
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'ReportMasterSid',
      emptyMessage: 'No Reports found',
      dragAndDrop: false
    }
  }

  initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Create',
        icon: 'fas fa-plus',
        action: 'create',
        disabled : !this.mps.can('insert')
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
  }

  initializeModalDropdownItems(): void {
    this.modalDropdownItems = [
      {
        label: 'Edoc',
        icon: 'fas fa-file-alt',
        action: 'edoc',
        
      },
      {
        label: 'Terms & Condition',
        icon: 'fas fa-clipboard',
        action: 'terms',
        
      },
      {
        label: 'Authorize',
        icon: 'fas fa-shield-alt',
        action: 'authority',
        
      },
      {
        label: 'Email',
        icon: 'fas fa-envelope',
        action: 'email',
        
      }
    ];
  }

  private getErrorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }


  // Abstract methods implementation
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
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
    this.spinner.hide();
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

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError(this.getErrorMessage(error, 'Error searching reports.'));
    console.error('Error searching reports', error);
    super.handleSearchError(error);
  }

  // Permission methods
 

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
}
