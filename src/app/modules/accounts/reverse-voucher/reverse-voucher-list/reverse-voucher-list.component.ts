import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbDropdownModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { OperationService } from 'src/app/modules/operation/operation.service';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { DropdownMenuItem, ToolsDropdownComponent } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { AccountsService } from '../../accounts.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

@Component({
  selector: 'app-reverse-voucher-list',
  standalone: true,
  imports: [
    CommonModule,
            RouterModule,
            FormsModule,
            FeatherModule,
            NgbPaginationModule,
            ListpageComponent,
            FavoriteStarComponent,
            MatDialogModule,
            NgxSpinnerModule,
            ReusableTableComponent,
            PageHeaderComponent,
            ToolsDropdownComponent,
            CustomDatePipe,
            NgbDropdownModule
  ],
  providers: [CustomDatePipe],
  templateUrl: './reverse-voucher-list.component.html',
  styleUrl: './reverse-voucher-list.component.scss'
})
export class ReverseVoucherListComponent extends BaseListComponent implements OnInit{
  @ViewChild('reverseVoucherTable') ReverseVoucherTable!: ReusableTableComponent;
    searchType = 'ReverseVoucherNo';
    results: any[] = [];
      reverseVoucherList: any[] = [];
      voucherList: any[] = [];
      companyMap: { [id: number]: string } = {};
      userData: any;
      loading = false;
      isFavorite: boolean = false;
      permissions: string[] = [];
      currentMenuPermissions: any = {};
      masterJobMap: { [id: number]: string } = {};
      houseJobMap: { [id: number]: string } = {};
    
      // Company
      currentCompany: any;
      currentBranch: any;
    
      toggleFavorite() {
        this.isFavorite = !this.isFavorite;
      }
    
      tableConfig: TableConfig;
    
      headerActions: HeaderAction[] = [];
      modalDropdownItems: DropdownMenuItem[] = [];
      tableLoading = false;
    
      protected config: ListComponentConfig = {
        storageKey: 'reverse-voucher-list-state',
        defaultPageSize: 10,
        defaultSortColumn: 'ReverseVoucherNo',
        defaultSortDirection: 'desc',
        pageSizeOptions: [10, 20, 50, 100, 500],
        maxPagesToShow: 3
      };
    
      // Alias for compatibility with existing template
      get allReverseVoucher() { return this.allItems; }
    
      constructor(
        private operationService: OperationService,
        private accountService: AccountsService,
        private router: Router,
        private appSettingService: AppSettingsService,
        private dialog: MatDialog,
        private userService: authService,
        private excelReportService: ExcelExportService,
        private spinner: NgxSpinnerService,
        paginationService: PaginationService,
        private datePipe: CustomDatePipe,
        public mps: MenuPermissionService
      ) {
        super(paginationService);
      }
    
      override ngOnInit() {
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        const userProfile = this.appSettingService.getDecryptedUserProfile();
    
        if (userProfile) {
          this.userData = userProfile;
        }
    
        this.initializeHeaderActions();
        this.initializeTableConfig();
        this.mps.init().subscribe(()=>{
          this.initializeTableConfig();
          this.initializeHeaderActions();
        });
        this.initializeModalDropdownItems();
        super.ngOnInit();
        this.loadVouchers();
      }
    
    
      loadVouchers() {
        const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
      this.operationService.getAllVoucher(CompanyMasterSid,BranchMasterSid).subscribe({
        next: (resp: any) => {
          this.voucherList = resp?.data || resp || [];
          // Now load credit notes after invoices are loaded
          this.loadReverseVoucher();
        },
        error: (err) => {
          console.error('Error loading invoices', err);
          this.voucherList = [];
          this.loadReverseVoucher();
        }
      });
    }
  
      protected searchItems(): Observable<any> {
        this.spinner.show();
        return this.operationService.searchReverseVoucher(this.getSearchParams());
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
          this.allItems = (response.data.items || []).map((item: any) => ({
            ...item,
            VoucherDate: this.datePipe.transform(item?.VoucherDate),
            PostStatusLabel: item.PostStatus === 'P' ? 'Posted' : 'Unposted',
            Status: item.Status === 'A' ? 'Active' : 'Suspended',
            ReversalVoucherDisplay: this.getInvoiceNumber(item.ReversalVoucher),
            
          }));
          this.totalLengthOfCollection = response.data.totalCount || 0;
          this.applySorting();
          this.updateHeaderActionState();
        } else {
          this.appSettingService.showError('Error searching Reverse Voucher.');
          this.allItems = [];
          this.totalLengthOfCollection = 0;
        }
      }
  
      getInvoiceNumber(reversalVoucherId: number): string {
      if (!reversalVoucherId) return '-';
      
      const invoice = this.voucherList.find(inv => 
        inv.VoucherHeaderSid === reversalVoucherId || 
        inv.voucherHeaderSid === reversalVoucherId
      );
      
      return invoice ? invoice.VoucherNumber : `ID: ${reversalVoucherId}`;
    }
  
      protected override handleSearchError(error: any): void {
        this.spinner.hide();
        this.appSettingService.showError('Error searching Reverse Voucher.');
        console.error('Error searching Reverse Voucher', error);
        super.handleSearchError(error);
      }
    
      onSearchTriggered(searchValue: string): void {
        this.filterValue = searchValue;
        this.loadReverseVoucher();
      }
    
      loadReverseVoucher() {
        this.page = 1;
        this.search();
      }
    
      onSearchCleared(): void {
        this.filterValue = '';
        this.clearFilterValue();
      }
    
      clearFilterValue() {
        this.clearFilter();
      }
    
      override trackBy(index: number, item: any): number {
        return item.VoucherHeaderSid || index;
      }
    
      initializeHeaderActions(): void {
        this.headerActions = [
          {
            label: 'Create',
            icon: 'fas fa-plus',
            action: 'create',
            disabled: !this.mps.can('insert')
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
    
      private initializeTableConfig() {
        this.tableConfig = {
          columns : [
          {
            key: 'VoucherNumber',
            label: 'Reverse Voucher No',
            sortable: true,
            filterable: true,
            visible: true,
            dataType: 'string',
          },
          {
          key: 'reversalVoucherNumber',
          label: 'Voucher No',
          sortable: true,
          filterable: true,
          visible: true,
          dataType: 'string',
          template: 'link'       
        },
          {
            key: 'VoucherDate',
            label: 'Date',
            sortable: true,
            filterable: true,
            visible: true,
            dataType: 'string'
          },
          {
            key: 'VendorName',
            label: 'Vendor Name',
            sortable: true,
            filterable: true,
            visible: true,
            dataType: 'string',
          },
          {
        key: 'PostStatusLabel',
        label: 'Posted Status',
        sortable: true,
        filterable: true,
        visible: true,
        template: 'status',
        dataType: 'string',
      },
      {
            key: 'Status',
            label: 'Status',
            sortable: true,
            filterable: true,
            visible: true,
            dataType: 'string',
          }
        ],
        actions: [
          {
            icon: 'fas fa-eye',
            label: 'View',
            action: 'view',
            tooltip: 'View Reverse Voucher',
            state: !this.mps.can('view')
          },
          {
            icon: 'fas fa-trash',
            label: 'Delete',
            action: 'delete',
            tooltip: 'Delete ',
            class: "text-danger",
            state: !this.mps.can('delete')
          }
        ],
        selectable: false,
        multiSelect: false,
        showColumnToggle: true,
        showFilters: true,
        showPagination: true,
        trackByKey: 'VoucherHeaderSid',
        emptyMessage: 'No Reverse Voucher found',
        dragAndDrop: true
      };
      }
    
      private initializeModalDropdownItems(): void {
        this.modalDropdownItems = [
          {
            label: 'Export to Excel',
            icon: 'fas fa-file-excel',
            action: 'exportExcel',
            disabled: this.totalLengthOfCollection === 0
          }
        ];
      }
    
      onHeaderAction(action: string) {
        switch (action) {
          case 'create':
            this.onCreate();
            break;
          case 'report':
            this.onReport();
            break;
          case 'reset':
            this.onReset();
            break;
          default:
            console.log('Unknown action:', action);
        }
      }
    
      onCreate() {
        this.router.navigate(['/accounts/reverse-voucher/entry']);
      }
    
      onReport() {
        if (this.allItems.length > 0) {
          this.exportExcel();
        }
      }
  
      onTableRowClick(row: any): void {
      // Row clicking can be handled by the table component if needed
    }
    
      onReset() {
        this.filterValue = '';
        this.page = 1;
        this.search();
      }
    
      onTableAction(event: TableEventData): void {
        const returnRoute = (voucherType : string) => {
          switch(voucherType) {
            case 'Receipt':
              return 'accounts/receipt/entry';
            case 'Payment Voucher':
              return 'accounts/payment/entry';
            case 'Journal Voucher':
              return 'accounts/journal-voucher/entry';
            case 'Invoice':
              return 'operation/invoice/entry';
            case 'Credit Note':
              return 'operation/credit-note/entry';
            default :
              return 'accounts/reverse-voucher/entry';
          }
        }

        if(event.column?.template === "link") {
          const path = returnRoute(event.row.reversalVoucherType);
          console.log("path", path);
          console.log(event.row.ReversalVoucher);
          this.router.navigate([path, event.row.ReversalVoucher]);
        } else if (event.action === 'view') {
          this.viewReverseVoucher(event.row);
        } else if (event.action === 'delete') {
          this.deleteReverseVoucher(event.row);
        }
      }
    
      onTableSortChange(sort: any): void {
        this.sortColumn = sort.column;
        this.sortDirection = sort.direction === 'none' ? 'desc' : sort.direction;
        this.search();
      }
    
      onTableFilterChange(filters: any[]): void {
        // Handle column filters if needed
        console.log('Filters changed:', filters);
      }
    
      viewReverseVoucher(ReverseVoucher: any) {
        this.router.navigate(['/accounts/reverse-voucher/entry', ReverseVoucher.VoucherHeaderSid]);
      }
    
      editReverseVoucher(ReverseVoucher: any) {
        this.router.navigate(['/accounts/reverse-voucher/entry', ReverseVoucher.VoucherHeaderSid]);
      }
    
      deleteReverseVoucher(ReverseVoucher: any) {
        const dialogRef = this.dialog.open(DeleteWarningComponent);
    
        dialogRef.afterClosed().subscribe(result => {
          if (result === true) {
            this.spinner.show();
            this.operationService.deleteReverseVoucherById(ReverseVoucher.VoucherHeaderSid).subscribe({
              next: (response) => {
                this.spinner.hide();
                if (response.status) {
                  this.appSettingService.showSuccess('Reverse Voucher deleted successfully');
                  this.search();
                } else {
                  this.appSettingService.showError('Failed to delete Reverse Voucher');
                }
              },
              error: (error) => {
                this.spinner.hide();
                this.appSettingService.showError('Error deleting Reverse Voucher');
                console.error('Error deleting Reverse Voucher:', error);
              }
            });
          }
        });
      }
    
      exportExcel() {
        this.excelReportService.exportAsExcel({
          data: this.allItems,
          headers: [
            { key: 'VoucherNumber', label: 'Reverse Voucher No' },
            { key: 'VoucherDate', label: 'Invoice Date' },
            { key: 'VendorName', label: 'Vendor Name' },
            { key: 'Status', label: 'Status' }
          ],
          fileName: 'Reverse_Voucher',
          sheetName: 'Reverse Voucher'
        });
      }
    
      updateHeaderActionState(): void {
        this.headerActions = this.headerActions.map(action => {
          if (action.action === 'report') {
            return { ...action, disabled: this.totalLengthOfCollection === 0 };
          }
          return action;
        });
    
        this.modalDropdownItems = this.modalDropdownItems.map(item => {
          if (item.action === 'exportExcel') {
            return { ...item, disabled: this.totalLengthOfCollection === 0 };
          }
          return item;
        });
      }

}
