import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { HttpClient } from '@angular/common/http';


import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import {
  ListComponentConfig,
  SearchParams,
} from 'src/app/shared/interfaces/pagination.interface';
import {
  TableConfig,
  TableEventData,
  TableSortConfig,
  TableFilter,
} from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import {
  HeaderAction,
  PageHeaderComponent,
} from 'src/app/shared/components/header-list/header-list.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';


@Component({
  selector: 'app-doc-reference-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FeatherModule,
    NgbModalModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    FavoriteStarComponent,
  ],
  templateUrl: './doc-reference-list.component.html',
  styleUrls: ['./doc-reference-list.component.scss'],
})
export class DocReferenceListComponent
  extends BaseListComponent
  implements OnInit
{
  @ViewChild('docRefTable') docRefTable!: ReusableTableComponent;
  @ViewChild('viewModal') viewModalTemplate!: TemplateRef<any>;


  currentCompany: any;
  currentBranch: any;
  selectedDocument: any = null;


  originalDataBeforeFilter: any[] = [];


  
  statusFilter: 'A' | 'I' | 'ALL' = 'A';


  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Details',
      },
      {
        icon: 'fas fa-edit',
        label: 'Edit',
        action: 'edit',
        tooltip: 'Edit Document',
        class: 'text-warning',
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete Document',
        class: 'text-danger',
      },
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'RefDocumentSid',
    emptyMessage: 'No documents found',
    dragAndDrop: false,
  };


  tableLoading = false;
  headerActions: HeaderAction[] = [];


  protected config: ListComponentConfig = {
    storageKey: 'doc-reference-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'RefDocumentNo',
    defaultSortDirection: 'desc',
    pageSizeOptions: [10, 20, 50, 100],
    maxPagesToShow: 3,
  };


  get allDocuments() {
    return this.allItems;
  }


  constructor(
    private http: HttpClient,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private excelReportService: ExcelExportService,
    paginationService: PaginationService,
  ) {
    super(paginationService);
  }


  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company'),
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch'),
    );


    this.initializeHeaderActions();
    this.initializeTableConfig();
    super.ngOnInit();
  }


  
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    return this.http.get<any>('doc-reference/list', {
      params: this.getSearchParams() as any,
    });
  }


  
  protected getSearchParams(): SearchParams {
    const params: any = {
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      CompanyMasterSid:
        this.currentCompany?.CompanyMasterSid?.toString(),
      BranchMasterSid:
        this.currentBranch?.BranchMasterSid?.toString(),
      Status: this.statusFilter, 
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
    };


    if (this.filterValue && this.filterValue.trim()) {
      params.search = this.filterValue.trim();
      params.RefDocumentNo = this.filterValue.trim();
      params.Remarks = this.filterValue.trim();
      params.searchTerm = this.filterValue.trim();
    }


    return params;
  }


  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();


    if (response.Status || response.status) {
      this.allItems = (response.data || []).map((item: any) => ({
        ...item,
        RefDocumentDate: this.formatDate(item.RefDocumentDate),
        PublicText: item.Public === 'Y' ? 'Public' : 'Private',
        StatusText: item.Status === 'A' ? 'Active' : 'Inactive',
      }));


      this.originalDataBeforeFilter = [...this.allItems];
      this.totalLengthOfCollection = this.allItems.length;


      this.applySorting();
      this.updateHeaderActionState();
    } else {
      this.appSettingService.showError(
        'Error loading documents: ' + (response.message || 'Unknown error'),
      );
      this.allItems = [];
      this.originalDataBeforeFilter = [];
      this.totalLengthOfCollection = 0;
    }
  }


  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error loading documents');
    super.handleSearchError(error);
  }


  private initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Create',
        icon: 'fas fa-plus',
        action: 'create',
      },
      {
        label: 'Report',
        icon: 'fas fa-file-alt',
        action: 'report',
        disabled: this.totalLengthOfCollection === 0,
      },
      {
        label: 'Reset',
        icon: 'fas fa-sync-alt',
        action: 'reset',
      },
    ];
  }


  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map((action) => {
      if (action.action === 'report') {
        return {
          ...action,
          disabled: this.totalLengthOfCollection === 0,
        };
      }
      return action;
    });
  }


  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'RefDocumentNo',
        label: 'Document No',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
      {
        key: 'RefDocumentDate',
        label: 'Document Date',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
      {
        key: 'Remarks',
        label: 'Remarks',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string',
      },
      {
        key: 'PublicText',
        label: 'Public',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'status',
        width: '100px',
        dataType: 'string',
      },
      {
        key: 'StatusText',
        label: 'Status',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'status',
        width: '100px',
        dataType: 'string',
      },
    ];
  }


  onActionTriggered(action: string): void {
    switch (action) {
      case 'create':
        this.addNew();
        break;
      case 'report':
        this.report();
        break;
      case 'reset':
        this.resetPage();
        break;
      default:
        break;
    }
  }


  searchDocuments() {
    this.page = 1;
    this.search();
  }


  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.page = 1;
    this.search();
  }


  onSearchCleared(): void {
    this.filterValue = '';
    this.page = 1;
    this.search();
  }


  
  onStatusFilterChange(): void {
    this.page = 1;
    this.search();
  }


  onTableActionClick(event: TableEventData): void {
    switch (event.action) {
      case 'view':
        this.viewDocument(event.row);
        break;
      case 'edit':
        this.editDocument(event.row);
        break;
      case 'delete':
        this.deleteDocument(event.row);
        break;
    }
  }


  onTableRowClick(row: any): void {
    
  }


  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection =
      sort.direction === 'none' ? 'desc' : sort.direction;
    this.search();
  }


  onTableFilterChange(filters: TableFilter[]): void {
    
  }


  addNew() {
    this.router.navigate(['/settings/doc-reference/add']);
  }


  viewDocument(row: any): void {
    this.selectedDocument = row;
    this.modalService.open(this.viewModalTemplate, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
  }


  editDocument(row: any): void {
    this.router.navigate([
      '/settings/doc-reference/edit',
      row.RefDocumentSid,
    ]);
  }


  deleteDocument(row: any): void {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.spinner.show();
        this.http
          .delete<any>(`doc-reference/delete/${row.RefDocumentSid}`)
          .subscribe({
            next: (response) => {
              if (response.status || response.Status) {
                this.appSettingService.showSuccess(
                  `Document "${row.RefDocumentNo}" deleted successfully`,
                );
                this.searchDocuments();
              } else {
                this.appSettingService.showError(
                  response.message || 'Failed to delete document',
                );
              }
              this.spinner.hide();
            },
            error: () => {
              this.appSettingService.showError(
                'Error deleting document',
              );
              this.spinner.hide();
            },
          });
      }
    });
  }


  report(): void {
    const visibleColumns = this.docRefTable.getVisibleColumns();
    const dynamicHeaders = visibleColumns.map((column) => ({
      key: column.key,
      label: column.label,
    }));


    const companyName =
      this.currentCompany?.companyName ?? 'Company';


    this.excelReportService.exportAsExcel({
      data: this.allDocuments,
      headers: dynamicHeaders,
      fileName: 'Document-Reference-Report',
      title: companyName,
    });
  }


  private formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }


  override trackBy(index: number, item: any): number {
    return item.RefDocumentSid || index;
  }
}                                            




