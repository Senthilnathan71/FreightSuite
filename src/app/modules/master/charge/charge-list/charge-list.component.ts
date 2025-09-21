import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';

import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableConfig, TableEventData, TableSortConfig, TableFilter, TableColumn } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-charge-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    RouterModule,
    NgbPaginationModule,
    FavoriteStarComponent,
    NgxSpinnerModule,
    ReusableTableComponent
  ],
  templateUrl: './charge-list.component.html',
  styleUrls: ['./charge-list.component.scss']
})
export class ChargeListComponent extends BaseListComponent implements OnInit {
  @ViewChild('chargeTable') chargeTable!: ReusableTableComponent;

  // alias for template compatibility
  get chargeLists() { return this.allItems; }

  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentCompany: any;
  currentBranch: any;

  uoms: any[] = [];
  tdsSets: any[] = [];
  hssacList: any[] = [];

  tableLoading = false;

  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Charge',
        condition: (row: any) => this.hasPermission('View')
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete Charge',
        condition: (row: any) => this.hasPermission('Delete')
      }
    ],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: true,
    showPagination: true,
    trackByKey: 'ChargeMasterSid',
    emptyMessage: 'No charges found',
    dragAndDrop: false
  };

  protected config: ListComponentConfig = {
    storageKey: 'charge-list-state',
    defaultPageSize: 10,
    defaultSortColumn: 'chargeCode',
    defaultSortDirection: 'asc',
    pageSizeOptions: [10, 20, 50, 100],
    maxPagesToShow: 3
  };

  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService,
    paginationService: PaginationService
  ) {
    super(paginationService);
  }

  override ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) this.userData = userProfile;

    // lookups
    this.masterService.getAllUom().subscribe(res => this.uoms = res.data || []);
    this.masterService.getAllHssac().subscribe(res => this.hssacList = (res && res.data) ? res.data : res || []);
    this.masterService.getAllTds(this.currentCompany?.CompanyMasterSid).subscribe(res => this.tdsSets = res.data || []);

    this.initializeTableConfig();

    super.ngOnInit();
    this.checkPermissions();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster?.[0]?.RoleMasterSid;
    if (currentMenuId && userRole) {
      this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response: any) => {
          this.currentMenuPermissions = response.data?.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions).filter(
            key => this.currentMenuPermissions[key] === 'isTrue'
          );
        }
      });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  // BaseListComponent abstract implementations
  protected searchItems(): Observable<any> {
    this.tableLoading = true;
    this.spinner.show();
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    return this.masterService.searchChargeList({
      search: this.filterValue?.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    });
  }

  protected getSearchParams(): SearchParams {
    return {
      search: this.filterValue?.trim(),
      page: Number(this.page),
      pageSize: Number(this.pageSize),
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };
  }

  protected processSearchResults(response: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    if (response?.status) {
      this.allItems = (response.data.items || []).map((item: any) => ({
        ...item,
        UOM: item.UOM,
        HSNSAC: item.chargeTaxMaster?.[0]?.HSNCode || '',
        TDSSet: item.chargeTds?.[0]?.tdsSetHeader?.TDSSetName || '',
        StatusLabel: item.Status === 'A' ? 'Active' : 'Suspended'
      }));
      this.totalLengthOfCollection = response.data.totalCount || 0;
      this.applySorting();
    } else {
      this.appSettingService.showError('Error searching charges.');
      this.allItems = [];
      this.totalLengthOfCollection = 0;
    }
  }

  protected override handleSearchError(error: any): void {
    this.tableLoading = false;
    this.spinner.hide();
    this.appSettingService.showError('Error searching charges.');
    console.error('Error searching charges', error);
    super.handleSearchError(error);
  }

  // Legacy compatibility methods
  loadCharges() {
    this.page = 1;
    this.search();
  }

  clearFilterValue() {
    this.clearFilter();
  }

  updatePaginatedData(): void {
    this.loadCharges();
  }

  trackByChargeId(index: number, item: any): number {
    return item.ChargeMasterSid || index;
  }

  navigateToCreateCharge() {
    this.router.navigate(['master/charge/entry']);
  }

  viewCharge(row: any) {
    this.router.navigate(['/master/charge/entry', row.ChargeMasterSid]);
  }

  deleteChargeByRow(row: any) {
    this.deleteCharge(row.ChargeMasterSid);
  }

  deleteCharge(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteChargeById(id).subscribe({
          next: () => {
            this.appSettingService.showSuccess("Deleted!");
            this.loadCharges();
          },
          error: (err) => {
            this.appSettingService.showError("Error Deleting Charge");
            console.error(err);
          }
        });
      }
    });
  }

  getUomCode(UOMMasterSid: any) {
    if (!UOMMasterSid || !this.uoms?.length) return '';
    const found = this.uoms.find(uom => uom.UOMMasterSid === UOMMasterSid);
    return found ? found.UOMCode : '';
  }

  getHssacCode(hsnCode: string) {
    if (!hsnCode || !this.hssacList?.length) return '';
    const found = this.hssacList.find(sac => sac.HSSACCode === hsnCode || sac.HSSACMasterSid === hsnCode);
    return found ? found.HSSACCode : '';
  }

  getTdssetCode(tdsSet: any) {
    if (!tdsSet || !this.tdsSets?.length) return '';
    const found = this.tdsSets.find(set => set.TDSSetHeaderSid === tdsSet || set.TDSSetName === tdsSet);
    return found ? found.TDSSetName : '';
  }

  // Table configuration
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'chargeCode',
        label: 'Charge Code',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'link',
        width: '150px',
        dataType: 'string'
      },
      {
        key: 'chargeName',
        label: 'Charge Name',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'UOM',
        label: 'UOM',
        sortable: true,
        filterable: true,
        visible: true,
        width: '80px',
        dataType: 'string'
      },
      {
        key: 'HSNSAC',
        label: 'HSN/SAC',
        sortable: true,
        filterable: true,
        visible: true,
        width: '100px',
        dataType: 'string'
      },
      {
        key: 'TDSSet',
        label: 'TDS Set',
        sortable: true,
        filterable: true,
        visible: true,
        dataType: 'string'
      },
      {
        key: 'StatusLabel',
        label: 'Status',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'status',
        width: '100px',
        dataType: 'string'
      }
    ];
  }

  // Table event handlers
  onTableActionClick(event: TableEventData): void {
    if (event.action === 'view') {
      this.viewCharge(event.row);
    } else if (event.action === 'delete') {
      this.deleteChargeByRow(event.row);
    }
  }

  onTableRowClick(row: any) {
    // could navigate on row click if required
  }

  onTableSortChange(sort: TableSortConfig): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction === 'none' ? 'asc' : sort.direction;
    this.search();
  }

  onTableFilterChange(filters: TableFilter[]): void {
    console.log('Filters changed:', filters);
    // keep existing simple search behavior
  }

  // Report generation using visible columns
  report(): void {
  const formattedData = (this.allItems || []).map((item: any) => ({
    ...item,
    Status: item.Status === 'A' ? 'Active' : 'Suspended',
   
    UOM: this.getUomCode(item.UOM),
    SAC: item.HSNSAC || '',
    TDSset: item.TDSSet || ''
  }));
 
  // const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';
  const companyName = this.currentCompany?.companyName ?? 'Company';
  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'chargeCode', label: 'Charge Code' },
      { key: 'chargeName', label: 'Charge Name' },
      { key: 'UOM', label: 'UOM' },
      { key: 'SAC', label: 'HSN/SAC' },
      { key: 'TDSset', label: 'TDS Set' },
      { key: 'Status', label: 'Status' }
    ],
    fileName: 'Charge-Report',
    title: companyName
  });
}
}
