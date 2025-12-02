import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { EmailModuleService } from '../../email.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';

@Component({
  selector: 'app-mail-configuration-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    FeatherModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent
  ],
  templateUrl: './mail-configuration-list.component.html',
  styleUrl: './mail-configuration-list.component.scss'
})
export class MailConfigurationListComponent extends BaseListComponent implements OnInit {
  @ViewChild('mailConfigTable') mailConfigTable!: ReusableTableComponent;

  currentCompany: any;
  currentBranch: any;
  tableConfig: TableConfig;
  headerActions: HeaderAction[] = [];
  tableLoading = false;

  protected config: ListComponentConfig = {
    storageKey: 'mail-configuration-state',
    defaultPageSize: 10,
    defaultSortColumn: 'Sno',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100],
    maxPagesToShow: 3
  };

  get allMailConfig() { return this.allItems; }

  constructor(
    private emailService: EmailModuleService,
    private appSettingService: AppSettingsService,
    private router: Router,
    private dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private excelService: ExcelExportService,
    paginationService: PaginationService,
    public mps: MenuPermissionService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    this.currentBranch = this.appSettingService.getCurrentBranchInfo();

    this.mps.init().subscribe(() => {
      this.initializeTableConfig();
      this.initializeHeaderActions();
    });

    this.initializeTableConfig();
    this.initializeHeaderActions();
    super.ngOnInit();
  }

  private initializeTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'Sno',
          label: 'S.No',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'number',
          width: '80px'
        },
        {
          key: 'MailName',
          label: 'Mail Name',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'menuName',
          label: 'Menu',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'MailSubject',
          label: 'Subject',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string'
        },
        {
          key: 'AttachmentRequireDisplay',
          label: 'Attachment',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: '120px'
        },
        {
          key: 'AutoPopupDisplay',
          label: 'Auto/Popup',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          width: '120px'
        },
        {
          key: 'StatusDisplay',
          label: 'Status',
          sortable: true,
          filterable: true,
          visible: true,
          template: 'status',
          width: '100px',
          dataType: 'string'
        }
      ],
      actions: [
        {
          icon: 'fas fa-eye',
          label: 'View',
          action: 'view',
          tooltip: 'View',
          state: !this.mps.can('view')
        },
        {
          icon: 'fas fa-trash',
          label: 'Delete',
          action: 'delete',
          tooltip: 'Delete',
          class: 'text-danger',
          state: !this.mps.can('delete')
        }
      ],
      selectable: false,
      multiSelect: false,
      showColumnToggle: true,
      showFilters: true,
      showPagination: true,
      trackByKey: 'MailConfigurationMasterSid',
      emptyMessage: 'No Mail Configuration found',
      dragAndDrop: true
    };
  }

  initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Create',
        icon: 'fas fa-plus',
        action: 'create',
        disabled: false
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

  protected searchItems(): Observable<any> {
    this.spinner.show();
    return this.emailService.searchMailConfiguration(this.getSearchParams());
  }

  protected override getSearchParams(): SearchParams {
    return {
      search: this.filterValue?.trim() || '',
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };
  }

  protected processSearchResults(response: any): void {
    this.spinner.hide();
    if (response.status) {
      this.allItems = (response.data.items || []).map((item: any) => ({
        ...item,
        menuName: item.MenuMaster?.MenuName || '',
        AttachmentRequireDisplay: item.AttachmentRequire === 'Y' ? 'Yes' : 'No',
        AutoPopupDisplay: item.AutoPopup === 'A' ? 'Auto' : 'Popup',
        StatusDisplay: item.Status === 'A' ? 'Active' : 'Inactive'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError(response.message || 'Error fetching mail configurations.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.spinner.hide();
    this.appSettingService.showError('Error searching mail configurations.');
    console.error('Error searching mail configurations', error);
    super.handleSearchError(error);
  }

  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.page = 1;
    this.search();
  }

  onSearchCleared(): void {
    this.filterValue = '';
    this.clearFilter();
  }

  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.router.navigate(['/email/mail-configuration/entry']);
        break;
      case 'report':
        this.exportReport();
        break;
      case 'reset':
        this.resetPage();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.router.navigate(['/email/mail-configuration/entry/', event.row.MailConfigurationMasterSid]);
    } else if (event.action === 'delete') {
      this.deleteRecord(event.row.MailConfigurationMasterSid);
    }
  }

  onTableRowClick(event: any): void {
    // Optional: Handle row click for navigation
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'asc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    console.log('Filters changed:', filters);
  }

  private deleteRecord(id: number): void {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.spinner.show();
        this.emailService.deleteMailConfiguration(id).subscribe({
          next: (resp) => {
            this.spinner.hide();
            if (resp.status) {
              this.appSettingService.showSuccess('Mail configuration deleted successfully!');
              this.search();
            } else {
              this.appSettingService.showError(resp.message || 'Error deleting mail configuration.');
            }
          },
          error: (err) => {
            this.spinner.hide();
            this.appSettingService.showError('Error deleting mail configuration.');
            console.error('Delete error:', err);
          }
        });
      }
    });
  }

  private exportReport(): void {
    const visibleColumns = this.mailConfigTable?.getVisibleColumns() || [];
    const headers = visibleColumns.map(col => ({ key: col.key, label: col.label }));

    this.excelService.exportAsExcel({
      data: this.allMailConfig,
      headers,
      fileName: 'Mail-Configuration-Report',
      title: this.currentCompany?.companyName ?? 'Company'
    });
  }

  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'report') {
        return { ...action, disabled: this.totalLengthOfCollection === 0 };
      }
      return action;
    });
  }
}
