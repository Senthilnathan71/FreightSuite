
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { MasterService } from 'src/app/modules/master/master.service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseListComponent } from 'src/app/shared/components/base-list/base-list.component';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { PaginationService } from 'src/app/shared/services/pagination.service';
import { ListComponentConfig, SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { TableColumn, TableConfig, TableEventData, TableSortConfig, TableFilter } from 'src/app/shared/interfaces/table.interface';
import { Observable } from 'rxjs';
import { HeaderAction, PageHeaderComponent } from 'src/app/shared/components/header-list/header-list.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ToolsDropdownComponent, DropdownMenuItem } from 'src/app/shared/components/tools-dropdown/tools-dropdown.component';
import { PaymentListItem, PaymentFilter } from '../../models/payment.model';
import { PaymentService } from '../../services/payment.service';

/**
 * Payment List Component
 * Displays list of payment vouchers with search, filter, and pagination
 * Supports Cash and Bank payments
 */
@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FeatherModule,
    NgbPaginationModule,
    MatDialogModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    ToolsDropdownComponent,
    CustomDatePipe
  ],
  providers: [CustomDatePipe],
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss']
})
export class PaymentListComponent implements OnInit {
  @ViewChild('paymentTable') paymentTable!: ReusableTableComponent;

  searchType = 'VoucherNumber';
  results: any[] = [];
  paymentList: any[] = [];
  allPayments: PaymentListItem[] = [];
  companyMap: { [id: number]: string } = {};
  userData: any;
  loading = false;
  isFavorite: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  totalLengthOfCollection = 0;

  // Company & Branch
  currentCompany: any;
  currentBranch: any;

  // Filters
  filterValue = '';
  selectedPaymentMode = 'All'; // All, Cash, Bank
  dateFrom?: string;
  dateTo?: string;

  tableConfig: TableConfig = {
    columns: [],
    actions: [
      {
        icon: 'fas fa-eye',
        label: 'View',
        action: 'view',
        tooltip: 'View Payment',
      },
      {
        icon: 'fas fa-edit',
        label: 'Edit',
        action: 'edit',
        tooltip: 'Edit Payment',
      },
      {
        icon: 'fas fa-undo',
        label: 'Reverse',
        action: 'reverse',
        tooltip: 'Reverse Payment'
      },
      {
        icon: 'fas fa-trash',
        label: 'Delete',
        action: 'delete',
        tooltip: 'Delete Payment'
      }
    ],
    selectable: true,
    showPagination: true,
    showColumnToggle: true,
    emptyMessage: 'No payment vouchers found',
    loadingMessage: 'Loading payments...'
  };

  headerActions: HeaderAction[] = [
    {
      label: 'New Payment',
      icon: 'fas fa-plus',
      action: 'create',
      cssClass: 'btn-info'
    },
    {
      label: 'Refresh',
      icon: 'fas fa-sync-alt',
      action: 'refresh'
    },
    {
      label: 'Export',
      icon: 'fas fa-file-export',
      action: 'export'
    }
  ];

  toolsMenuItems: DropdownMenuItem[] = [
    {
      label: 'Import Payments',
      icon: 'fas fa-file-import',
      action: 'import'
    },
    {
      label: 'Export to Excel',
      icon: 'fas fa-file-excel',
      action: 'export-excel'
    },
    {
      label: 'Export to PDF',
      icon: 'fas fa-file-pdf',
      action: 'export-pdf'
    },
    {
      label: 'Print',
      icon: 'fas fa-print',
      action: 'print'
    }
  ];

  constructor(
    public router: Router,
    public dialog: MatDialog,
    public appSettingsService: AppSettingsService,
    public spinner: NgxSpinnerService,
    public excelService: ExcelExportService,
    private paymentService: PaymentService,
    private datePipe: CustomDatePipe
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupTableColumns();
    this.loadPayments();
  }

  initializeComponent(): void {
    // Get current company and branch from session/storage
    this.currentCompany = this.getCurrentCompany();
    this.currentBranch = this.getCurrentBranch();

    // Get user data and permissions
    this.userData = this.getUserData();
    this.permissions = this.userData?.permissions || [];

    // Check if this page is favorited
    this.isFavorite = this.checkIfFavorite();
  }

  setupTableColumns(): void {
    this.tableConfig.columns = [
      {
        key: 'VoucherNumber',
        label: 'Payment No',
        sortable: true,
        width: '120px',
        cellClass: 'fw-bold text-primary'
      },
      {
        key: 'VoucherDate',
        label: 'Payment Date',
        sortable: true,
        width: '110px'
      },
      {
        key: 'VendorName',
        label: 'Vendor',
        sortable: true,
        width: '200px',
        cellClass: 'text-truncate'
      },
      {
        key: 'BankName',
        label: 'Bank',
        sortable: true,
        width: '150px',
        cellClass: 'text-truncate'
      },
      {
        key: 'PaymentMode',
        label: 'Payment Mode',
        sortable: true,
        width: '120px',
        cellClass: 'badge bg-success'
      },
      {
        key: 'TotalAmount',
        label: 'Total Amount',
        sortable: true,
        width: '130px',
        cellClass: 'fw-bold'
      },
      {
        key: 'TDSAmount',
        label: 'TDS Amount',
        sortable: true,
        width: '120px',
        cellClass: 'text-warning'
      },
      {
        key: 'NetAmount',
        label: 'Net Amount',
        sortable: true,
        width: '130px',
        cellClass: 'fw-bold text-success'
      },
      {
        key: 'BranchName',
        label: 'Branch',
        sortable: true,
        width: '150px',
        cellClass: 'text-truncate'
      },
      {
        key: 'CreatedBy',
        label: 'Created By',
        sortable: true,
        width: '120px'
      },
      {
        key: 'StatusDisplay',
        label: 'Status',
        sortable: true,
        width: '100px',
        cellClass: 'badge bg-success'
      }
    ];
  }

  /**
   * Load payments from API
   */
  loadPayments(): void {
    this.loading = true;
    this.spinner.show();

    const filter: PaymentFilter = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherNumber: this.filterValue.trim() || undefined,
      DateFrom: this.dateFrom,
      DateTo: this.dateTo,
      PaymentMode: this.selectedPaymentMode !== 'All' ? this.selectedPaymentMode : undefined,
      Limit: 100
    };

    this.paymentService.getPayments(filter).subscribe({
      next: (payments) => {
        this.allPayments = payments;
        this.paymentList = payments;
        this.totalLengthOfCollection = payments.length;
        this.loading = false;
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.loading = false;
        this.spinner.hide();
        this.appSettingsService.showError('Failed to load payments');
      }
    });
  }

  /**
   * Handle search triggered from header
   */
  onSearchTriggered(searchValue: string): void {
    this.filterValue = searchValue;
    this.loadPayments();
  }

  /**
   * Handle header actions
   */
  onHeaderAction(action: string): void {
    switch (action) {
      case 'create':
        this.router.navigate(['accounts/payment/entry']);
        break;
      case 'refresh':
        this.loadPayments();
        break;
      case 'export':
        this.exportToExcel();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  /**
   * Handle table actions (view, edit, delete, etc.)
   */
  onTableActionClick(event: TableEventData): void {
    const payment = event.row;

    switch (event.action) {
      case 'view':
        this.viewPayment(payment.VoucherHeaderSid);
        break;
      case 'edit':
        this.editPayment(payment.VoucherHeaderSid);
        break;
      case 'reverse':
        this.reversePayment(payment);
        break;
      case 'delete':
        this.deletePayment(payment);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  /**
   * View payment details
   */
  viewPayment(id: number): void {
    this.router.navigate(['accounts/payment/view', id]);
  }

  /**
   * Edit payment
   */
  editPayment(id: number): void {
    this.router.navigate(['accounts/payment/entry', id]);
  }

  /**
   * Reverse payment voucher
   */
  reversePayment(payment: any): void {
    const dialogRef = this.dialog.open(DeleteWarningComponent, {
      data: {
        title: 'Reverse Payment',
        message: `Are you sure you want to reverse payment voucher ${payment.VoucherNumber}?`,
        confirmText: 'Reverse',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.spinner.show();

        const reverseRequest = {
          VoucherHeaderSid: payment.VoucherHeaderSid,
          ReversalDate: new Date().toISOString().split('T')[0],
          ReversalReason: 'Payment reversal',
          ReversedBy: this.userData?.userName
        };

        this.paymentService.reversePayment(reverseRequest).subscribe({
          next: () => {
            this.appSettingsService.showSuccess('Payment reversed successfully');
            this.loadPayments();
            this.spinner.hide();
          },
          error: (error) => {
            console.error('Error reversing payment:', error);
            this.spinner.hide();
          }
        });
      }
    });
  }

  /**
   * Delete payment voucher
   */
  deletePayment(payment: any): void {
    const dialogRef = this.dialog.open(DeleteWarningComponent, {
      data: {
        title: 'Delete Payment',
        message: `Are you sure you want to delete payment voucher ${payment.VoucherNumber}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.spinner.show();

        this.paymentService.deletePayment(payment.VoucherHeaderSid).subscribe({
          next: () => {
            this.appSettingsService.showSuccess('Payment deleted successfully');
            this.loadPayments();
            this.spinner.hide();
          },
          error: (error) => {
            console.error('Error deleting payment:', error);
            this.spinner.hide();
          }
        });
      }
    });
  }

  /**
   * Export to Excel
   */
  exportToExcel(): void {
    const exportData = this.allPayments.map(payment => ({
      'Payment No': payment.VoucherNumber,
      'Payment Date': payment.VoucherDate,
      'Vendor': payment.VendorName,
      'Bank': payment.BankName || 'N/A',
      'Payment Mode': payment.PaymentMode,
      'Total Amount': payment.TotalAmount,
      'TDS Amount': payment.TDSAmount || 0,
      'Net Amount': payment.NetAmount,
      'Branch': payment.BranchName || 'N/A',
      'Created By': payment.CreatedBy || 'N/A',
      'Status': payment.StatusDisplay
    }));

    this.excelService.exportAsExcel({
      data: exportData,
      headers: [
        { key: 'Payment No', label: 'Payment No' },
        { key: 'Payment Date', label: 'Payment Date' },
        { key: 'Vendor', label: 'Vendor' },
        { key: 'Bank', label: 'Bank' },
        { key: 'Payment Mode', label: 'Payment Mode' },
        { key: 'Total Amount', label: 'Total Amount' },
        { key: 'TDS Amount', label: 'TDS Amount' },
        { key: 'Net Amount', label: 'Net Amount' },
        { key: 'Branch', label: 'Branch' },
        { key: 'Created By', label: 'Created By' },
        { key: 'Status', label: 'Status' }
      ],
      fileName: 'Payment_Vouchers',
      sheetName: 'Payments'
    });
    this.appSettingsService.showSuccess('Payment data exported successfully');
  }

  /**
   * Handle tools menu actions
   */
  onToolsAction(action: string): void {
    switch (action) {
      case 'import':
        this.appSettingsService.showInfo('Import functionality coming soon');
        break;
      case 'export-excel':
        this.exportToExcel();
        break;
      case 'export-pdf':
        this.appSettingsService.showInfo('PDF export coming soon');
        break;
      case 'print':
        window.print();
        break;
      default:
        console.log('Unknown tools action:', action);
    }
  }

  /**
   * Check if this page is in favorites
   */
  checkIfFavorite(): boolean {
    // TODO: Implement favorite check
    return false;
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
    // TODO: Implement favorite persistence
    this.appSettingsService.showInfo(
      this.isFavorite ? 'Added to favorites' : 'Removed from favorites'
    );
  }

  /**
   * Filter by payment mode
   */
  filterByPaymentMode(mode: string): void {
    this.selectedPaymentMode = mode;
    this.loadPayments();
  }

  /**
   * Filter by date range
   */
  filterByDateRange(dateFrom: string, dateTo: string): void {
    this.dateFrom = dateFrom;
    this.dateTo = dateTo;
    this.loadPayments();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterValue = '';
    this.selectedPaymentMode = 'All';
    this.dateFrom = undefined;
    this.dateTo = undefined;
    this.loadPayments();
  }

  // Helper methods
  private getCurrentCompany(): any {
    // Get from session storage or auth service
    const companyStr = sessionStorage.getItem('selectedCompany');
    return companyStr ? JSON.parse(companyStr) : null;
  }

  private getCurrentBranch(): any {
    // Get from session storage or auth service
    const branchStr = sessionStorage.getItem('selectedBranch');
    return branchStr ? JSON.parse(branchStr) : null;
  }

  private getUserData(): any {
    // Get from session storage or auth service
    const userStr = sessionStorage.getItem('userData');
    return userStr ? JSON.parse(userStr) : null;
  }
}
