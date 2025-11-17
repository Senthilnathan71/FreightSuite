import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { ReusableTableComponent } from 'src/app/shared/components/table/table.component';
import { TableColumn, TableConfig } from 'src/app/shared/interfaces/table.interface';
import { PageHeaderComponent, HeaderAction } from 'src/app/shared/components/header-list/header-list.component';
import { TrialBalanceService, TrialBalanceItem, TrialBalanceResponse } from './trial-balance.service';
import { AccountsService } from '../accounts.service';

@Component({
  selector: 'app-trial-balance-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgxSpinnerModule,
    ReusableTableComponent,
    PageHeaderComponent,
    RouterModule,
  ],
  templateUrl: './trial-balance-report.component.html',
  styleUrls: ['./trial-balance-report.component.scss'],
})
export class TrialBalanceReportComponent implements OnInit {
  @ViewChild('TrialBalanceTable') trialBalanceTable!: ReusableTableComponent;

  filterForm!: FormGroup;
  currentCompany: any;
  currentBranch: any;
  userData: any;

  // Master data
  groupList: any[] = [];
  subGroupList: any[] = [];
  branchList: any[] = [];
  yearList: any[] = [];

  // Report data
  reportData: TrialBalanceItem[] = [];
  reportResponse: TrialBalanceResponse | null = null;
  reportGenerated = false;

  // Header actions
  headerActions: HeaderAction[] = [];

  // Table configuration
  tableConfig: TableConfig = {
    columns: [],
    actions: [],
    selectable: false,
    multiSelect: false,
    showColumnToggle: true,
    showFilters: false,
    showPagination: false,
    trackByKey: 'COAMasterSid',
    emptyMessage: 'No data available. Please generate the report.',
    dragAndDrop: false,
  };

  tableLoading = false;

  constructor(
    private fb: FormBuilder,
    private trialBalanceService: TrialBalanceService,
    private accountsService: AccountsService,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private pdfDownloadService: PdfDownloadService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    if (!this.currentCompany) {
      this.appSettingService.showError('Please select a company');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.initializeForm();
    this.initializeTableConfig();
    this.initializeHeaderActions();
    this.loadMasterData();
  }

  /**
   * Initialize filter form
   */
  private initializeForm(): void {
    const currentYear = this.appSettingService.decrypt(localStorage.getItem('current-year-id'));

    this.filterForm = this.fb.group({
      fromDate: ['', Validators.required],
      toDate: ['', Validators.required],
      GroupName: [null],
      SubGroupName: [null],
      BranchMasterSid: [[]],
      showSubtotals: [true],
      YearMasterSid: [currentYear ? parseInt(currentYear) : null],
    });
  }

  /**
   * Initialize table configuration
   */
  private initializeTableConfig(): void {
    this.tableConfig.columns = [
      {
        key: 'LedgerCode',
        label: 'Code',
        sortable: true,
        filterable: false,
        visible: true,
        dataType: 'string',
        width: '100px',
      },
      {
        key: 'LedgerName',
        label: 'Ledger Name',
        sortable: true,
        filterable: false,
        visible: true,
        dataType: 'string',
        width: '250px',
      },
      {
        key: 'GroupName',
        label: 'Group',
        sortable: true,
        filterable: false,
        visible: true,
        dataType: 'string',
        width: '150px',
      },
      {
        key: 'SubGroupName',
        label: 'Sub Group',
        sortable: true,
        filterable: false,
        visible: true,
        dataType: 'string',
        width: '150px',
      },
      {
        key: 'OpeningDebit',
        label: 'Opening Dr',
        sortable: true,
        filterable: false,
        visible: true,
        dataType: 'number',
        width: '120px',
      },
      {
        key: 'OpeningCredit',
        label: 'Opening Cr',
        sortable: true,
        filterable: false,
        visible: true,
        dataType: 'number',
        width: '120px',
      },
      {
        key: 'CurrentDebit',
        label: 'Current Dr',
        sortable: true,
        filterable: false,
        visible: true,
        dataType: 'number',
        width: '120px',
      },
      {
        key: 'CurrentCredit',
        label: 'Current Cr',
        sortable: true,
        filterable: false,
        visible: true,
        dataType: 'number',
        width: '120px',
      },
      {
        key: 'ClosingDebit',
        label: 'Closing Dr',
        sortable: true,
        filterable: false,
        visible: true,
        dataType: 'number',
        width: '120px',
      },
      {
        key: 'ClosingCredit',
        label: 'Closing Cr',
        sortable: true,
        filterable: false,
        visible: true,
        dataType: 'number',
        width: '120px',
      },
    ];
  }

  /**
   * Initialize header actions
   */
  private initializeHeaderActions(): void {
    this.headerActions = [
      {
        label: 'Generate',
        icon: 'fas fa-play',
        action: 'generate',
      },
      {
        label: 'Excel',
        icon: 'fas fa-file-excel',
        action: 'excel',
        disabled: !this.reportGenerated,
      },
      {
        label: 'PDF',
        icon: 'fas fa-file-pdf',
        action: 'pdf',
        disabled: !this.reportGenerated,
      },
      {
        label: 'Reset',
        icon: 'fas fa-sync-alt',
        action: 'reset',
      },
    ];
  }

  /**
   * Update header action states
   */
  private updateHeaderActionState(): void {
    this.headerActions = this.headerActions.map(action => {
      if (action.action === 'excel' || action.action === 'pdf') {
        return { ...action, disabled: !this.reportGenerated };
      }
      return action;
    });
  }

  /**
   * Load master data
   */
  private loadMasterData(): void {
    this.loadGroups();
    this.loadSubGroups();
    this.loadBranches();
    this.loadFinancialYears();
  }

  /**
   * Load groups
   */
  private loadGroups(): void {
    this.accountsService.getGroupsByCompany(this.currentCompany.CompanyMasterSid).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.groupList = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading groups:', error);
      },
    });
  }

  /**
   * Load sub groups
   */
  private loadSubGroups(): void {
    this.accountsService.getSubGroupsByCompany(this.currentCompany.CompanyMasterSid).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.subGroupList = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading sub groups:', error);
      },
    });
  }

  /**
   * Load branches
   */
  private loadBranches(): void {
    this.accountsService.getBranchesByCompany(this.currentCompany.CompanyMasterSid).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.branchList = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading branches:', error);
      },
    });
  }

  /**
   * Load financial years
   */
  private loadFinancialYears(): void {
    this.accountsService.getFinancialYears(this.currentCompany.CompanyMasterSid).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.yearList = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading financial years:', error);
      },
    });
  }

  /**
   * Handle action triggers
   */
  onActionTriggered(action: string): void {
    switch (action) {
      case 'generate':
        this.generateReport();
        break;
      case 'excel':
        this.exportToExcel();
        break;
      case 'pdf':
        this.exportToPDF();
        break;
      case 'reset':
        this.resetForm();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  /**
   * Validate form dates
   */
  private validateDates(): boolean {
    const fromDate = this.filterForm.get('fromDate')?.value;
    const toDate = this.filterForm.get('toDate')?.value;

    if (!fromDate || !toDate) {
      this.appSettingService.showError('From Date and To Date are required');
      return false;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      this.appSettingService.showError('To Date must be greater than or equal to From Date');
      return false;
    }

    return true;
  }

  /**
   * Generate report
   */
  generateReport(): void {
    if (!this.filterForm.valid) {
      this.appSettingService.showError('Please fill all required fields');
      return;
    }

    if (!this.validateDates()) {
      return;
    }

    this.tableLoading = true;
    this.spinner.show();

    const formValue = this.filterForm.value;
    const params = {
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: formValue.BranchMasterSid,
      fromDate: formValue.fromDate,
      toDate: formValue.toDate,
      GroupName: formValue.GroupName,
      SubGroupName: formValue.SubGroupName,
      showSubtotals: formValue.showSubtotals,
      YearMasterSid: formValue.YearMasterSid,
    };

    this.trialBalanceService.generateTrialBalance(params).subscribe({
      next: (response) => {
        this.tableLoading = false;
        this.spinner.hide();

        if (response.success) {
          this.reportResponse = response;
          this.reportData = response.items;
          this.reportGenerated = true;
          this.updateHeaderActionState();

          if (response.items.length === 0) {
            this.appSettingService.showInfo(response.message || 'No data found for the selected criteria');
          } else {
            this.appSettingService.showSuccess('Report generated successfully');
          }
        } else {
          this.appSettingService.showError(response.message || 'Failed to generate report');
        }
      },
      error: (error) => {
        this.tableLoading = false;
        this.spinner.hide();
        console.error('Error generating report:', error);
        this.appSettingService.showError(
          error.error?.message || 'Error generating trial balance report'
        );
      },
    });
  }

  /**
   * Export to Excel
   */
  exportToExcel(): void {
    if (!this.reportResponse || this.reportData.length === 0) {
      this.appSettingService.showError('No data to export');
      return;
    }

    const formattedData = this.reportData.map(item => ({
      'Account Code': item.LedgerCode,
      'Account Name': item.LedgerName,
      'Group': item.GroupName,
      'Sub Group': item.SubGroupName || '-',
      'Opening Debit': item.OpeningDebit.toFixed(2),
      'Opening Credit': item.OpeningCredit.toFixed(2),
      'Current Debit': item.CurrentDebit.toFixed(2),
      'Current Credit': item.CurrentCredit.toFixed(2),
      'Closing Debit': item.ClosingDebit.toFixed(2),
      'Closing Credit': item.ClosingCredit.toFixed(2),
    }));

    // Add grand totals row
    if (this.reportResponse.grandTotal) {
      const gt = this.reportResponse.grandTotal;
      formattedData.push({
        'Account Code': '',
        'Account Name': 'GRAND TOTAL',
        'Group': '',
        'Sub Group': '',
        'Opening Debit': gt.TotalOpeningDebit.toFixed(2),
        'Opening Credit': gt.TotalOpeningCredit.toFixed(2),
        'Current Debit': gt.TotalCurrentDebit.toFixed(2),
        'Current Credit': gt.TotalCurrentCredit.toFixed(2),
        'Closing Debit': gt.TotalClosingDebit.toFixed(2),
        'Closing Credit': gt.TotalClosingCredit.toFixed(2),
      });
    }

    const companyName = this.currentCompany?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'Account Code', label: 'Account Code' },
        { key: 'Account Name', label: 'Account Name' },
        { key: 'Group', label: 'Group' },
        { key: 'Sub Group', label: 'Sub Group' },
        { key: 'Opening Debit', label: 'Opening Debit' },
        { key: 'Opening Credit', label: 'Opening Credit' },
        { key: 'Current Debit', label: 'Current Debit' },
        { key: 'Current Credit', label: 'Current Credit' },
        { key: 'Closing Debit', label: 'Closing Debit' },
        { key: 'Closing Credit', label: 'Closing Credit' },
      ],
      fileName: 'Trial-Balance-Report',
      title: companyName,
    });
  }

  /**
   * Export to PDF
   */
  exportToPDF(): void {
    if (!this.reportResponse || this.reportData.length === 0) {
      this.appSettingService.showError('No data to export');
      return;
    }

    this.pdfDownloadService.downloadPDF({
      elementId: 'trial-balance-print',
      filename: `Trial-Balance-${new Date().getTime()}.pdf`,
    });
  }

  /**
   * Reset form
   */
  resetForm(): void {
    this.filterForm.reset({
      fromDate: '',
      toDate: '',
      GroupName: null,
      SubGroupName: null,
      BranchMasterSid: [],
      showSubtotals: true,
      YearMasterSid: null,
    });
    this.reportData = [];
    this.reportResponse = null;
    this.reportGenerated = false;
    this.updateHeaderActionState();
  }
}
