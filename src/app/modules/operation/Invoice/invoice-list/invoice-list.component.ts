// invoice-list.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { forkJoin } from 'rxjs';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { OperationService } from '../../operation.service';


@Component({
  selector: 'app-invoice-list',
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
    NgxSpinnerModule
  ],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss'
})
export class InvoiceListComponent {
  searchType = 'InvoiceNo';
  filterValue = '';
  results: any[] = [];
  invoiceList: any[] = [];
  searchPerformed = false;
  companyMap: { [id: number]: string } = {};
  userData: any;
  sortColumn: string = 'InvoiceNo';
  sortDirection: string = 'asc';
  loading = false;

  // Pagination 
  page = 1;
  pageSize = 15;
  totalLengthOfCollection = 0;
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

  constructor(
    private operationService: OperationService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit() {
    this.getAllCompanies();
    this.loadJobMappings(); 
    
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
    
    this.loadInvoices();
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    
    if (currentMenuId && userRole) {
      // Assuming you have a similar permission service for operations
      // this.operationService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
      //   next: (response) => {
      //     this.currentMenuPermissions = response.data.MenuPermissions || {};
      //     this.permissions = Object.keys(this.currentMenuPermissions)
      //       .filter(key => this.currentMenuPermissions[key] === 'isTrue');
      //   }
      // });
    }
  }
 
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }
loadJobMappings() {
    // Load master jobs mapping
    this.operationService.getAllMasterJobs({}).subscribe({
      next: (response: any) => {
        if (response.data) {
          response.data.forEach((job: any) => {
            this.masterJobMap[job.MasterJobSid] = job.MasterJobNumber;
          });
        }
      }
    });

    // Load house jobs mapping if needed
    // this.operationService.getAllHouseJobs({}).subscribe({
    //   next: (response: any) => {
    //     if (response.data) {
    //       response.data.forEach((job: any) => {
    //         this.houseJobMap[job.HouseJobSid] = job.HouseJobNumber;
    //       });
    //     }
    //   }
    // });
  }
  loadInvoices(): void {
    this.spinner.show();
    this.loading = true;

    const params = {
      search: this.filterValue?.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      includeDetails: true // Request to include voucher details for calculation
    };

    this.operationService.searchInvoices(params).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.results = this.processInvoiceData(response.data.items || response.data || []);
          this.invoiceList = this.results;
          this.totalLengthOfCollection = response.totalCount || this.invoiceList.length;
          this.applySorting();
          this.searchPerformed = true;
        }
        this.spinner.hide();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching invoices:', err);
        this.results = [];
        this.invoiceList = [];
        this.totalLengthOfCollection = 0;
        this.loading = false;
        this.spinner.hide();
      }
    });
  }
  private processInvoiceData(invoices: any[]): any[] {
    return invoices.map(invoice => {
      // Calculate local amount if not provided
      if (!invoice.LocalAmount && invoice.voucherDetails) {
        invoice.LocalAmount = invoice.voucherDetails.reduce((total: number, detail: any) => {
          return total + (detail.LocalAmount || 0);
        }, 0);
      }

      // Get job numbers from mappings
      if (invoice.MasterJobSid) {
        invoice.MasterJobNumber = this.masterJobMap[invoice.MasterJobSid] || invoice.MasterJobSid;
      }

      if (invoice.HouseJobSid) {
        invoice.HouseJobNumber = this.houseJobMap[invoice.HouseJobSid] || invoice.HouseJobSid;
      }

      return invoice;
    });
  }


  getAllCompanies() {
    // Assuming you have a service to get companies
    // this.masterService.getAllCompanies().subscribe((companies: any[]) => {
    //   this.companyMap = {};
    //   companies.forEach(c => {
    //     this.companyMap[c.CompanyMasterSid] = c.companyName;
    //   });
    // });
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadInvoices();
    this.applySorting();
    this.updatePaginatedData();
  }

  applySorting() {
    this.results.sort((a, b) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];

      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadInvoices();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteInvoice(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.operationService.deleteInvoiceById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.loadInvoices();
        });
      }
    });
  }

  navigateToAddNewInvoice() {
    this.router.navigate(['operation/invoice/entry']);
  }

  clearFilterValue() {
    this.filterValue = '';
  }

  resetPage(): void {
    this.invoiceList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'InvoiceNo';
    this.page = 1;
    this.sortColumn = 'InvoiceNo';
    this.sortDirection = 'asc';
    this.loadInvoices();
  }

  report(): void {
    const formattedData = this.invoiceList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended',
      InvoiceDate: this.formatDate(item.InvoiceDate),
      CreateOn: this.formatDate(item.CreateOn)
    }));

    const companyName = this.currentCompany?.companyName ?? 'Company';
    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'VoucherNumber', label: 'VoucherNumber' },
        { key: 'VoucherDate', label: 'VoucherDate ' },
        { key: 'PartyName', label: 'PartyName ' },
        { key: 'CurrencyCode', label: 'CurrencyCode' },
        { key: 'LocalAmount', label: 'Local Amount' },
        { key: 'IRNNumber', label: 'INR No' },
        { key: 'MasterJobSid', label: 'Job No' },
        { key: 'HouseJobSid', label: 'House No' },
        { key: 'status', label: 'Status' },
        { key: 'CreateOn', label: 'Created On' },
        { key: 'CreditNoteNo', label: 'Credit Note No' },
      ],
      fileName: 'Invoice-Report',
      title: companyName
    });
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    
    // Handle string dates, timestamps, and Date objects
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
  }

  viewInvoice(id: number) {
    this.router.navigate(['operation/invoice/entry/', id]);
  }
}