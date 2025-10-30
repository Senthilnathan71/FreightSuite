import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbPagination, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { authService } from 'src/app/modules/authentication/auth.service';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-ledger-mapping',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbPagination,
    NgbModalModule,
    FeatherModule,
    NgSelectModule,
    FavoriteStarComponent,
    NgxSpinnerModule
  ],
  templateUrl: './ledger-mapping.component.html',
  styleUrl: './ledger-mapping.component.scss'
})
export class LedgerMappingComponent implements OnInit {
  
  // Tab management
  selectedTab: string = 'Party';
  
  // Data arrays
  partyData: any[] = [];
  chargeData: any[] = [];
  filteredPartyData: any[] = [];
  filteredChargeData: any[] = [];
  
  // COA Options for different types
  syDrCOAOptions: any[] = [];
  syCrCOAOptions: any[] = [];
  accrualCOAOptions: any[] = [];
  costCOAOptions: any[] = [];
  revenueCOAOptions: any[] = [];
  
  departmentOptions: any[] = [];
  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  
  // Loading states
  isLoading = false;
  isSaving = false;
  
  // User and company data
  userData: any;
  currentCompany: any;

  // Pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;

  // Search and Sort
  filterValue: string = '';
  sortColumn: string = 'SubledgerName';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    
    this.appSettingService.getUser().subscribe((user) => {
      if (user) this.userData = user;
    });

    this.loadAllCOAOptions();
    this.loadDepartmentOptions();
    this.loadData();
  }

  // Load all COA options based on ledger types
  loadAllCOAOptions(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!CompanyMasterSid) return;

    // Load all COA types in parallel
    forkJoin({
      syDr: this.masterService.getCOAByLedgerType('Sy Dr', CompanyMasterSid),
      syCr: this.masterService.getCOAByLedgerType('Sy Cr', CompanyMasterSid),
      accrual: this.masterService.getCOAByLedgerType('Accrual', CompanyMasterSid),
      cost: this.masterService.getCOAByLedgerType('Cost', CompanyMasterSid),
      revenue: this.masterService.getCOAByLedgerType('Revenue', CompanyMasterSid)
    }).subscribe({
      next: (results) => {
        this.syDrCOAOptions = results.syDr || [];
        this.syCrCOAOptions = results.syCr || [];
        this.accrualCOAOptions = results.accrual || [];
        this.costCOAOptions = results.cost || [];
        this.revenueCOAOptions = results.revenue || [];
      },
      error: (err) => {
        console.error('Error loading COA options:', err);
        this.appSettingService.showError('Failed to load COA options');
      }
    });
  }

  // Get COA options based on type and tab
  getCOAOptions(coaType: string): any[] {
    if (this.selectedTab === 'Party') {
      switch (coaType) {
        case 'debtor': return this.syDrCOAOptions;
        case 'creditor': return this.syCrCOAOptions;
        case 'accrual': return this.accrualCOAOptions;
        default: return [];
      }
    } else { // Charge tab
      switch (coaType) {
        case 'debtor': return this.costCOAOptions;
        case 'creditor': return this.revenueCOAOptions;
        default: return [];
      }
    }
  }

  // Get COA name for display
  getCOAName(coaSid: number, coaType: string): string {
    if (!coaSid) return '';
    
    const options = this.getCOAOptions(coaType);
    const coa = options.find(opt => opt.COAMasterSid === coaSid);
    return coa ? `${coa.LedgerCode} - ${coa.LedgerName}` : '';
  }

  // Tab management
  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.page = 1;
    this.filterValue = '';
    this.sortColumn = 'SubledgerName';
    this.sortDirection = 'asc';
    this.loadData();
  }

  // Load data methods
  loadData(): void {
    this.isLoading = true;
    this.spinner.show();

    const observable = this.selectedTab === 'Party' 
      ? this.masterService.getSubledgerMasterByType('Customer')
      : this.masterService.getSubledgerMasterByType('Charge');

    observable.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.spinner.hide();
        
        if (response.status) {
          const data = response.data || response || [];
          const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
          const processedData = data.map((item: any) => ({
            ...item,
            CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
            AccrualCOAMasterSid: this.extractCOAId(item.AccrualCOAMasterSid),
            DrCOAMasterSid: this.extractCOAId(item.DrCOAMasterSid),
            CrCOAMasterSid: this.extractCOAId(item.CrCOAMasterSid),
            canEditAccrualCOA: !item.AccrualCOAMasterSid,
            canEditDebtorCOA: !item.DrCOAMasterSid,
            canEditCreditorCOA: !item.CrCOAMasterSid,
            hasChanges: false,
            departmentName: item.departmentMaster?.departmentName || '',
            Status: item.Status
          }));

          if (this.selectedTab === 'Party') {
            this.partyData = processedData;
            this.filteredPartyData = [...this.partyData];
          } else {
            this.chargeData = processedData;
            this.filteredChargeData = [...this.chargeData];
          }
          
          this.totalLengthOfCollection = processedData.length;
          this.applyFilter();
        } else {
          this.appSettingService.showError('Error loading subledger data.');
          this.clearData();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.spinner.hide();
        this.appSettingService.showError('Error loading subledger data.');
        console.error('Error loading subledger data', error);
      }
    });
  }

  loadDepartmentOptions(): void {
    const companyId = this.currentCompany?.CompanyMasterSid;
    if (companyId) {
      this.masterService.getAllDepartments(companyId).subscribe({
        next: (res: any) => {
          this.departmentOptions = res.data || res || [];
        },
        error: (err) => {
          console.error('Error loading departments:', err);
        }
      });
    }
  }

  // Search functionality
  onSearch(): void {
    this.page = 1;
    this.applyFilter();
  }

  clearSearch(): void {
    this.filterValue = '';
    this.applyFilter();
  }

  // Filter data based on search criteria
  applyFilter(): void {
    const data = this.selectedTab === 'Party' ? this.partyData : this.chargeData;
    
    let filtered = data;
    
    if (this.filterValue.trim()) {
      const searchTerm = this.filterValue.toLowerCase();
      filtered = filtered.filter(item =>
        item.SubledgerName?.toLowerCase().includes(searchTerm) ||
        this.getSortValue(item, 'AccrualCOA')?.toString().toLowerCase().includes(searchTerm) ||
        this.getSortValue(item, 'DebtorCOA')?.toString().toLowerCase().includes(searchTerm) ||
        this.getSortValue(item, 'CreditorCOA')?.toString().toLowerCase().includes(searchTerm) ||
        this.getSortValue(item, 'RevenueCOA')?.toString().toLowerCase().includes(searchTerm) ||
        this.getSortValue(item, 'CostCOA')?.toString().toLowerCase().includes(searchTerm) ||
        item.departmentName?.toLowerCase().includes(searchTerm) ||
        item.Status?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let valueA = this.getSortValue(a, this.sortColumn);
      let valueB = this.getSortValue(b, this.sortColumn);

      valueA = valueA ?? '';
      valueB = valueB ?? '';

      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    if (this.selectedTab === 'Party') {
      this.filteredPartyData = filtered;
    } else {
      this.filteredChargeData = filtered;
    }
    
    this.totalLengthOfCollection = filtered.length;
  }

  // Helper method to get sort value based on column
  private getSortValue(item: any, column: string): any {
    switch (column) {
      case 'AccrualCOA':
        return this.getCOAName(item.AccrualCOAMasterSid, 'accrual');
      case 'DebtorCOA':
        return this.selectedTab === 'Party' 
          ? this.getCOAName(item.DrCOAMasterSid, 'debtor')
          : this.getCOAName(item.DrCOAMasterSid, 'debtor');
      case 'CreditorCOA':
        return this.selectedTab === 'Party'
          ? this.getCOAName(item.CrCOAMasterSid, 'creditor')
          : this.getCOAName(item.CrCOAMasterSid, 'creditor');
      case 'RevenueCOA':
        return this.getCOAName(item.CrCOAMasterSid, 'creditor');
      case 'CostCOA':
        return this.getCOAName(item.DrCOAMasterSid, 'debtor');
      case 'SubledgerName':
        return item.SubledgerName;
      case 'departmentName':
        return item.departmentName;
      case 'Status':
        return item.Status === 'A' ? 'Active' : 'Suspended';
      default:
        return item[column];
    }
  }

  // Sorting functionality
  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilter();
  }

  // COA Selection handlers
  onCOAChange(item: any, coaSid: number, coaType: string): void {
    if (coaType === 'debtor') {
      item.DrCOAMasterSid = coaSid;
    } else if (coaType === 'creditor') {
      item.CrCOAMasterSid = coaSid;
    } else if (coaType === 'accrual') {
      item.AccrualCOAMasterSid = coaSid;
    } 
    
    item.hasChanges = true;
  }

  onStatusChange(item: any, status: string): void {
    item.Status = status;
    item.hasChanges = true;
  }

  // Save methods
  saveChanges(): void {
    const itemsToUpdate = this.selectedTab === 'Party' 
      ? this.partyData.filter(item => item.hasChanges)
      : this.chargeData.filter(item => item.hasChanges);

    if (itemsToUpdate.length === 0) {
      this.appSettingService.showInfo('No changes to save');
      return;
    }

    this.isSaving = true;
    this.spinner.show();
    const activeCompanyId = this.currentCompany?.CompanyMasterSid;
    const updates = itemsToUpdate.map(item => ({
       CompanyMasterSid: activeCompanyId,
      SubledgerMasterSid: item.SubledgerMasterSid,
      AccrualCOAMasterSid: this.extractCOAId(item.AccrualCOAMasterSid),
      DrCOAMasterSid: this.extractCOAId(item.DrCOAMasterSid),
      CrCOAMasterSid: this.extractCOAId(item.CrCOAMasterSid),
      Status: typeof item.Status === 'object' ? item.Status.id : item.Status, 
      UpdatedBy: this.userData?.userEmail || 'system'
    }));

    this.masterService.bulkUpdateSubledgerMaster(updates).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.isSaving = false;
        this.appSettingService.showSuccess('Changes saved successfully');
        
        itemsToUpdate.forEach(item => item.hasChanges = false);
        this.loadData();
      },
      error: (err) => {
        this.spinner.hide();
        this.isSaving = false;
        console.error('Error saving changes:', err);
        this.appSettingService.showError('Failed to save changes');
      }
    });
  }

  // Reset page
  resetPage(): void {
    this.clearData();
    this.filterValue = '';
    this.sortColumn = 'SubledgerName';
    this.sortDirection = 'asc';
    this.page = 1;
    this.loadData();
  }

  private clearData(): void {
    this.partyData = [];
    this.filteredPartyData = [];
    this.chargeData = [];
    this.filteredChargeData = [];
    this.totalLengthOfCollection = 0;
  }

  // Utility method to extract COA ID from object or number
  extractCOAId(coa: any): number | null {
    if (!coa) return null;
    
    if (typeof coa === 'number') {
      return coa;
    }
    
    if (typeof coa === 'object' && coa.COAMasterSid !== undefined) {
      return coa.COAMasterSid;
    }
    
    return null;
  }

  // Utility methods
  getCurrentData(): any[] {
    const data = this.selectedTab === 'Party' ? this.filteredPartyData : this.filteredChargeData;
    const startIndex = (this.page - 1) * this.pageSize;
    return data.slice(startIndex, startIndex + this.pageSize);
  }

  // CompareWith function for ng-select
  compareWithCOA(item: any, selected: any): boolean {
    if (!item || !selected) return false;
    
    const itemId = typeof item === 'object' ? item.COAMasterSid : item;
    const selectedId = typeof selected === 'object' ? selected.COAMasterSid : selected;
    
    return itemId === selectedId;
  }

  compareWithStatus(item: any, selected: any): boolean {
  if (!item || !selected) return false;
  
  const itemId = typeof item === 'object' ? item.id : item;
  const selectedId = typeof selected === 'object' ? selected.id : selected;
  
  return itemId === selectedId;
}

  // Math functions for template
  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Report generation
  generateReport(): void {
    const data = this.selectedTab === 'Party' ? this.filteredPartyData : this.filteredChargeData;
    
    if (data.length === 0) {
      this.appSettingService.showInfo('No data available to generate report');
      return;
    }

    const reportName = this.selectedTab === 'Party' ? 'Party-Subledger-Mapping' : 'Charge-Subledger-Mapping';
    
    const headers = this.selectedTab === 'Party' 
      ? [
          { key: 'SubledgerName', label: 'Party Name' },
          { key: 'AccrualCOA', label: 'Accrual COA' },
          { key: 'DebtorCOA', label: 'Debtor COA' },
          { key: 'CreditorCOA', label: 'Creditor COA' },
          { key: 'Status', label: 'Status' },
        ]
      : [
          { key: 'SubledgerName', label: 'Charge Name' },
          { key: 'Department', label: 'Department' },
          { key: 'RevenueCOA', label: 'Revenue COA (Creditor)' },
          { key: 'CostCOA', label: 'Cost COA (Debtor)' },
          { key: 'Status', label: 'Status' }
        ];

    const formattedData = data.map(item => ({
      'SubledgerName': item.SubledgerName,
      'AccrualCOA': this.getCOAName(item.AccrualCOAMasterSid, 'accrual'),
      'DebtorCOA': this.selectedTab === 'Party' 
        ? this.getCOAName(item.DrCOAMasterSid, 'debtor')
        : this.getCOAName(item.DrCOAMasterSid, 'debtor'),
      'CreditorCOA': this.selectedTab === 'Party'
        ? this.getCOAName(item.CrCOAMasterSid, 'creditor')
        : this.getCOAName(item.CrCOAMasterSid, 'creditor'),
      'Department': item.departmentName || '',
      'RevenueCOA': this.getCOAName(item.CrCOAMasterSid, 'creditor'),
      'CostCOA': this.getCOAName(item.DrCOAMasterSid, 'debtor'),
      'Status': item.Status === 'A' ? 'Active' : 'Suspended'
    }));

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: headers,
      fileName: reportName,
      title: `${this.currentCompany?.companyName || 'Company'} - ${this.selectedTab} Subledger Mapping`
    });
  }

  // Check if there are any changes
  hasChanges(): boolean {
    const data = this.selectedTab === 'Party' ? this.partyData : this.chargeData;
    return data.some(item => item.hasChanges);
  }

  // Pagination
  onPageChange(page: number): void {
    this.page = page;
  }

  trackBy(index: number, item: any): number {
    return item.SubledgerMasterSid || index;
  }
}