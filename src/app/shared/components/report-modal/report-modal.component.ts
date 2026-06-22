import {
  Component,
  OnInit,
  Input,
  Injector,
  Type,
  ViewChild,
  ViewContainerRef,
  ComponentRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ReportService, REPORT_DATA, ReportCard } from '../../services/report.service';
import { ReportConfig } from '../../services/report-registry.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { ExcelExportService } from '../../excel-report-service';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import * as XLSX from 'xlsx';

/**
 * Generic Report Modal Component
 * Dynamically loads and displays report components with PDF/Email actions
 *
 * Usage:
 * ```typescript
 * const modalRef = this.reportService.openReportModal('master-job-pre-alert', 123);
 * ```
 *
 * Features:
 * - Dynamic component loading based on report type
 * - Automatic data fetching from backend
 * - PDF download functionality
 * - Email sending with PDF attachment
 * - Loading states and error handling
 */
@Component({
  selector: 'app-generic-report-modal',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],
  templateUrl: './report-modal.component.html',
  styleUrls: ['./report-modal.component.scss']
})
export class GenericReportModalComponent implements OnInit, OnDestroy {
  /**
   * Report identifier (e.g., 'master-job-pre-alert')
   */
  @Input() reportId?: string;

  /**
   * Entity ID (e.g., MasterJobSid, QuotationSid)
   */
  @Input() entityId?: number;

  /**
   * Payload for POST requests
   * Used when request type is 'POST' in report config
   */
  @Input() payload: any;

  /**
   * This is the report header itself
   */
  @Input() reportHeader : ReportCard;

  /**
   * Optional component to render instead of the registry's default (used by the New column view).
   */
  @Input() componentOverride?: Type<any>;

  /**
   * When true, render via the generic column-customizable table and inject report meta into it.
   */
  @Input() useColumnView = false;

  /**
   * View container for dynamic component loading
   */
  @ViewChild('reportContainer', { read: ViewContainerRef })
  reportContainer!: ViewContainerRef;

  /**
   * Report configuration from registry
   */
  reportConfig!: ReportConfig;

  /**
   * Report component class to load
   */
  reportComponent!: Type<any>;

  /**
   * Fetched report data
   */
  reportData: any = null;

  /**
   * Loading state
   */
  loading = true;

  /**
   * Error state
   */
  error: string | null = null;

  /**
   * Component reference for cleanup
   */
  private componentRef: ComponentRef<any> | null = null;

  /**
   * Print element ID
   */
  readonly printElementId = 'reportPrintContent';

  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private reportService: ReportService,
    private spinner: NgxSpinnerService,
    private appSettingsService: AppSettingsService,
    private companySettings: CompanySettingsManagerService,
    private injector: Injector,
    private excelReportService: ExcelExportService,
    private appSettingService: AppSettingsService,
    private pdfMakeService: PdfMakeService,
  ) {}

  ngOnInit(): void {
    this.loadReport();
  }

  ngOnDestroy(): void {
    // Clean up dynamic component
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  /**
   * Load report configuration, fetch data, and render component
   */
  async loadReport(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      this.spinner.show();

      // Validate inputs
      if (!this.reportId) {
        throw new Error('Report ID is required');
      }

      // Get report configuration
      this.reportConfig = this.reportService.getReportConfig(this.reportId);
      // Use the override component (New column view) when provided, else the registry default.
      this.reportComponent = this.componentOverride || this.reportConfig.component;

      const requestType = this.reportConfig.request || 'GET';

      // Validate inputs based on request type
      if (requestType === 'GET' && !this.entityId) {
        throw new Error('Entity ID is required for GET requests');
      }

      if (requestType === 'POST' && !this.payload) {
        throw new Error('Payload is required for POST requests');
      }

      // Fetch report data from backend based on request type
      if (requestType === 'POST') {
        this.reportData = await this.reportService
          .fetchReportDataPost(this.reportId, this.payload)
          .toPromise();
      } else {
        this.reportData = await this.reportService
          .fetchReportData(this.reportId, this.entityId!)
          .toPromise();
      }


      // Set loading to false to render the container
      this.loading = false;
      this.spinner.hide();

      // Wait for view to update and render the container
      await this.delay(100);

      // Load report component dynamically
      this.loadReportComponent();
    } catch (error: any) {
      console.error('Error loading report:', error);
      this.error = error.message || 'Failed to load report';
      if(error.status == 400){
        this.error = error.error.message || "Invalid Request";
      }
      this.loading = false;
      this.spinner.hide();
      this.appSettingsService.showError(this.error);
    }
  }

  /**
   * Dynamically load report component with data injection
   */
  private loadReportComponent(): void {
    if (!this.reportContainer) {
      console.error('Report container not found');
      return;
    }

    // Clear any existing components
    this.reportContainer.clear();

    // Merge payload as params into report data so report components can access request filters (e.g. FromMBLDt, ToMBLDt)
    let dataToInject = this.reportData;
    if (this.payload) {
      if (dataToInject && typeof dataToInject === 'object' && !Array.isArray(dataToInject)) {
        dataToInject = { ...dataToInject, params: this.payload };
      } else {
        // Wrap non-object/array responses so params are still accessible
        dataToInject = { data: dataToInject, params: this.payload };
      }
    }
    console.log('Report data injected:', dataToInject);
    console.log('Payload (params):', this.payload);

    // Create injector with report data
    const componentInjector = Injector.create({
      providers: [
        {
          provide: REPORT_DATA,
          useValue: dataToInject
        }
      ],
      parent: this.injector
    });

    // For the New (column-customizable) view, first build the report's CLASSIC
    // component to obtain its authoritative presentation via getExcelData()
    // (exact heading, header parameter lines, curated column labels, formatted values,
    // and any totals row). Then render the customizable table from that, so the data
    // and details match the Classic view exactly.
    if (this.useColumnView && this.componentOverride) {
      let sourceConfig: any = null;
      try {
        const classicRef = this.reportContainer.createComponent(
          this.reportConfig.component,
          { injector: componentInjector }
        );
        classicRef.changeDetectorRef.detectChanges();
        if (typeof classicRef.instance?.getExcelData === 'function') {
          sourceConfig = classicRef.instance.getExcelData();
        }
        classicRef.destroy();
        this.reportContainer.clear();
      } catch (err) {
        console.warn('New view: classic getExcelData probe failed; using raw-data fallback', err);
        sourceConfig = null;
        this.reportContainer.clear();
      }

      this.componentRef = this.reportContainer.createComponent(
        this.componentOverride,
        { injector: componentInjector }
      );
      const inst = this.componentRef.instance;
      inst.reportMasterSid = this.reportHeader?.ReportMasterSid ?? 0;
      inst.reportDisplayName =
        this.reportHeader?.ReportDisplayName || this.reportConfig?.title || 'Report';
      inst.reportName = this.reportId;
      inst.sourceConfig = sourceConfig;
      this.componentRef.changeDetectorRef.detectChanges();
      return;
    }

    // Standard (Classic) path
    this.componentRef = this.reportContainer.createComponent(
      this.reportComponent,
      { injector: componentInjector }
    );
    this.componentRef.changeDetectorRef.detectChanges();
  }

  /**
   * Download PDF action
   */
  async downloadPDF(): Promise<void> {
    try {
      this.spinner.show();

      const filename = this.reportService.generateFilename(
        this.reportConfig.filenameTemplate,
        this.reportData
      );

      if (this.reportId === 'comprehensive-management') {
        const company = this.appSettingsService.getCurrentCompanyInfo();
        const branch = this.appSettingsService.getCurrentBranchInfo();
        const userData = this.appSettingsService.getDecryptedUserProfile();
        const logo = this.pdfMakeService.getReportLogo();
        const printSettings = this.companySettings.getPrintSettings();

        this.pdfMakeService.generateComprehensiveManagementReport(
          this.buildInjectedReportData(),
          company,
          branch,
          userData,
          logo,
          this.reportConfig?.pdfOrientation || 'landscape',
          printSettings,
          filename
        );
        this.appSettingsService.showSuccess('PDF downloaded successfully!');
        this.spinner.hide();
        return;
      }

      if (this.reportId === 'balance-sheet') {
        const company = this.appSettingsService.getCurrentCompanyInfo();
        const branch = this.appSettingsService.getCurrentBranchInfo();
        const userData = this.appSettingsService.getDecryptedUserProfile();
        const logo = this.pdfMakeService.getReportLogo();
        const printSettings = this.companySettings.getPrintSettings();

        this.pdfMakeService.generateBalanceSheetReport(
          this.buildInjectedReportData(),
          company,
          branch,
          userData,
          logo,
          this.reportConfig?.pdfOrientation || 'landscape',
          printSettings,
          filename
        );
        this.appSettingsService.showSuccess('PDF downloaded successfully!');
        this.spinner.hide();
        return;
      }

      if (this.reportId === 'Vat-Summary-Report') {
        const company = this.appSettingsService.getCurrentCompanyInfo();
        const branch = this.appSettingsService.getCurrentBranchInfo();
        const userData = this.appSettingsService.getDecryptedUserProfile();
        const logo = this.pdfMakeService.getReportLogo();
        const printSettings = this.companySettings.getPrintSettings();

        this.pdfMakeService.generateVatSummaryReport(
          this.buildInjectedReportData(),
          company,
          branch,
          userData,
          logo,
          'landscape',
          printSettings,
          filename
        );
        this.appSettingsService.showSuccess('PDF downloaded successfully!');
        this.spinner.hide();
        return;
      }

      if (this.reportId === 'balance-sheet') {
        const company = this.appSettingsService.getCurrentCompanyInfo();
        const branch = this.appSettingsService.getCurrentBranchInfo();
        const userData = this.appSettingsService.getDecryptedUserProfile();
        const logo = this.pdfMakeService.getReportLogo();
        const printSettings = this.companySettings.getPrintSettings();

        this.pdfMakeService.generateBalanceSheetReport(
          this.buildInjectedReportData(),
          company,
          branch,
          userData,
          logo,
          this.reportConfig?.pdfOrientation || 'landscape',
          printSettings,
          filename
        );
        this.appSettingsService.showSuccess('PDF downloaded successfully!');
        this.spinner.hide();
        return;
      }

      // Use pdfmake if component provides structured data
      if (this.componentRef?.instance?.getExcelData) {
        const exportConfig = this.componentRef.instance.getExcelData();
        if (exportConfig?.reportHeader && exportConfig?.rows) {
          const company = this.appSettingsService.getCurrentCompanyInfo();
          const branch = this.appSettingsService.getCurrentBranchInfo();
          const userData = this.appSettingsService.getDecryptedUserProfile();
          const logo = this.pdfMakeService.getReportLogo();

          this.pdfMakeService.generateGenericReport(
            { ...exportConfig, fileName: filename },
            company, branch, userData, logo,
            this.reportConfig?.pdfOrientation || 'portrait'
          );
          this.appSettingsService.showSuccess('PDF downloaded successfully!');
          this.spinner.hide();
          return;
        }
      }

      // Fallback to html2canvas for components without getExcelData
      await this.reportService.downloadPDF(this.printElementId, filename, { orientation: this.reportConfig?.pdfOrientation || 'portrait' });

      this.spinner.hide();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      this.spinner.hide();
      this.appSettingsService.showError('Failed to download PDF');
    }
  }

  /**
   * Send Email action
   */
  async sendEmail(): Promise<void> {
    try {
      this.spinner.show();

      let attachmentFile: File;
      const filename = this.reportService.generateFilename(
        this.reportConfig.filenameTemplate,
        this.reportData
      );
      const reportFormat = (this.reportHeader?.ReportFormat || '').toUpperCase();
      const selectedFormat = reportFormat === 'EXCEL' || reportFormat === 'XL' ? 'XL' : 'PDF';
      const exportConfig = typeof this.componentRef?.instance?.getExcelData === 'function'
        ? this.componentRef.instance.getExcelData()
        : null;

      if (selectedFormat === 'XL') {
        const excelBlob = this.buildExcelAttachmentBlob(exportConfig, filename);
        attachmentFile = new File(
          [excelBlob],
          `${filename}.xlsx`,
          { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        );
      } else {
        let pdfBlob: Blob;
        if (this.reportId === 'comprehensive-management') {
          const company = this.appSettingsService.getCurrentCompanyInfo();
          const branch = this.appSettingsService.getCurrentBranchInfo();
          const userData = this.appSettingsService.getDecryptedUserProfile();
          const logo = this.pdfMakeService.getReportLogo();
          const printSettings = this.companySettings.getPrintSettings();

          pdfBlob = await this.pdfMakeService.generateComprehensiveManagementReportBlob(
            this.buildInjectedReportData(),
            company,
            branch,
            userData,
            logo,
            this.reportConfig?.pdfOrientation || 'landscape',
            printSettings
          );
        } else if (this.reportId === 'balance-sheet') {
          const company = this.appSettingsService.getCurrentCompanyInfo();
          const branch = this.appSettingsService.getCurrentBranchInfo();
          const userData = this.appSettingsService.getDecryptedUserProfile();
          const logo = this.pdfMakeService.getReportLogo();
          const printSettings = this.companySettings.getPrintSettings();

          pdfBlob = await this.pdfMakeService.generateBalanceSheetReportBlob(
            this.buildInjectedReportData(),
            company,
            branch,
            userData,
            logo,
            this.reportConfig?.pdfOrientation || 'landscape',
            printSettings
          );
        } else if (this.reportId === 'Vat-Summary-Report') {
          const company = this.appSettingsService.getCurrentCompanyInfo();
          const branch = this.appSettingsService.getCurrentBranchInfo();
          const userData = this.appSettingsService.getDecryptedUserProfile();
          const logo = this.pdfMakeService.getReportLogo();
          const printSettings = this.companySettings.getPrintSettings();

          pdfBlob = await this.pdfMakeService.generateVatSummaryReportBlob(
            this.buildInjectedReportData(),
            company,
            branch,
            userData,
            logo,
            'landscape',
            printSettings
          );
        } else if (exportConfig?.reportHeader && exportConfig?.rows) {
          const company = this.appSettingsService.getCurrentCompanyInfo();
          const branch = this.appSettingsService.getCurrentBranchInfo();
          const userData = this.appSettingsService.getDecryptedUserProfile();
          const logo = this.pdfMakeService.getReportLogo();

          pdfBlob = await this.pdfMakeService.generateGenericReportBlob(
            exportConfig, company, branch, userData, logo,
            this.reportConfig?.pdfOrientation || 'portrait'
          );
        } else {
          pdfBlob = await this.reportService.generatePDFBlob(this.printElementId);
        }

        attachmentFile = new File([pdfBlob], `${filename}.pdf`, {
          type: 'application/pdf'
        });
      }

      const emailData = this.reportService.buildEmailData(
        this.reportConfig,
        this.reportData
      );

      this.spinner.hide();

      // Close this modal
      this.activeModal.dismiss();

      const modalRef = this.modalService.open(EmailEntryComponent, {
        size: 'xl',
        centered: true,
        backdrop: 'static'
      });

      modalRef.componentInstance.setContent = {
        EmailTo: emailData.to,
        EmailCC: emailData.cc || [],
        EmailBCC: emailData.bcc || [],
        Subject: emailData.subject,
        Mailbody: this.reportService.buildEmailPreviewBody(emailData.body),
        attachments: [attachmentFile]
      };
    } catch (error) {
      console.error('Error preparing email:', error);
      this.spinner.hide();
      this.appSettingsService.showError('Failed to prepare email');
    }
  }


  
  /**
   * Print action
   */
  print(): void {
    window.print();
  }

  /**
   * Close modal
   */
  close(): void {
    this.activeModal.dismiss();
  }

  /**
   * Retry loading report
   */
  retry(): void {
    this.loadReport();
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private buildInjectedReportData(): any {
    if (this.payload) {
      if (this.reportData && typeof this.reportData === 'object' && !Array.isArray(this.reportData)) {
        return { ...this.reportData, params: this.payload };
      }

      return { data: this.reportData, params: this.payload };
    }

    return this.reportData;
  }


 downloadExcel(): void {
  try {
    console.log('Download Excel clicked');
    this.spinner.show();
    
    // Check if the dynamic component is loaded
    if (!this.componentRef || !this.componentRef.instance) {
      console.error('Dynamic report component not loaded');
      this.spinner.hide();
      this.appSettingService.showError('Report component not loaded yet');
      return;
    }
    
    console.log('Dynamic component instance:', this.componentRef.instance);
    
    // Try to get Excel data from the dynamic component
    // Check for common method names that might exist in report components
    let excelData: any = null;
    let dynamicHeaders: Array<{key: string, label: string}> = [];
    let dataToExport: any[] = [];
    
    // Method 1: Component has getExcelData() method
    if (typeof this.componentRef.instance.getExcelData === 'function') {
      excelData = this.componentRef.instance.getExcelData();
      console.log('Got data from getExcelData():', excelData);

      // Check if it's a ComplexReportExportConfig (has reportHeader and rows properties)
      if (excelData && excelData.reportHeader && excelData.rows) {
        if (excelData.styled) {
          // Coloured/styled export (xlsx-js-style) — opted in by the component's getExcelData()
          this.excelReportService.exportComplexReportStyled(excelData);
        } else {
          this.excelReportService.exportComplexReport(excelData);
        }
        console.log('Excel export completed successfully (complex report)');
        this.spinner.hide();
        return;
      }
    }
    
    // Method 2: Component has getTableData() method (common pattern)
    else if (typeof this.componentRef.instance.getTableData === 'function') {
      dataToExport = this.componentRef.instance.getTableData();
      console.log('Got data from getTableData(), length:', dataToExport?.length);
    }
    
    // Method 3: Component has tableData property
    else if (this.componentRef.instance.tableData && Array.isArray(this.componentRef.instance.tableData)) {
      dataToExport = this.componentRef.instance.tableData;
      console.log('Got data from tableData property, length:', dataToExport?.length);
    }
    
    // Method 4: Component has items/data property (check common structures)
    else if (this.componentRef.instance.items && Array.isArray(this.componentRef.instance.items)) {
      dataToExport = this.componentRef.instance.items;
      console.log('Got data from items property, length:', dataToExport?.length);
    }
    else if (this.componentRef.instance.data && Array.isArray(this.componentRef.instance.data)) {
      dataToExport = this.componentRef.instance.data;
      console.log('Got data from data property, length:', dataToExport?.length);
    }
    
    // Method 5: Try to extract from HTML table in the component
    else {
      console.log('Trying to extract data from component DOM...');
      dataToExport = this.extractDataFromComponentDOM();
    }
    
    // Process the data based on what we got
    if (excelData && excelData.data && excelData.headers) {
      // If component returned complete Excel config
      dataToExport = excelData.data;
      dynamicHeaders = excelData.headers;
    }
    else if (dataToExport && dataToExport.length > 0) {
      // If we got raw data, create headers from it
      const firstItem = dataToExport[0];
      if (firstItem && typeof firstItem === 'object') {
        dynamicHeaders = Object.keys(firstItem).map(key => ({
          key: key,
          label: this.formatLabel(key)
        }));
      }
    }
    
    // Check if we have valid data
    if (!dataToExport || !Array.isArray(dataToExport) || dataToExport.length === 0) {
      console.error('No exportable data found in component');
      console.log('Component properties:', Object.keys(this.componentRef.instance));
      this.spinner.hide();
      this.appSettingService.showError('No table data found in report for Excel export');
      return;
    }
    
    if (!dynamicHeaders || dynamicHeaders.length === 0) {
      console.error('No headers generated');
      this.spinner.hide();
      this.appSettingService.showError('Could not determine column headers');
      return;
    }
    
    console.log('Exporting data:', {
      rowCount: dataToExport.length,
      headers: dynamicHeaders,
      firstRow: dataToExport[0]
    });
    
    // Get company name
    const encryptedCompany = localStorage.getItem('selected-company');
    const companyName = encryptedCompany 
      ? this.appSettingService.decrypt(encryptedCompany)?.companyName || 'Company'
      : 'Company';
    
    // Generate filename with current date
    const reportTitle = this.reportConfig?.title || 'Report';
    const safeTitle = reportTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.getTime();
    const filename = `${safeTitle}-${dateStr}-${timeStr}`;
    
    // Export to Excel
    this.excelReportService.exportAsExcel({
      data: dataToExport,
      headers: dynamicHeaders,
      fileName: filename,
      title: companyName
    });
    
    console.log('Excel export completed successfully');
    this.spinner.hide();
    
  } catch (error: any) {
    console.error('Error in downloadExcel:', error);
    console.error('Error stack:', error.stack);
    this.spinner.hide();
    this.appSettingService.showError(`Failed to generate Excel: ${error.message}`);
  }
}

/**
 * Extract data from component DOM by looking for table elements
 * This is a fallback method if the component doesn't expose data directly
 */
private extractDataFromComponentDOM(): any[] {
  try {
    // Get the component's root element
    const componentElement = this.componentRef?.location?.nativeElement;
    if (!componentElement) {
      console.error('Component element not found');
      return [];
    }
    
    // Look for tables in the component
    const tables = componentElement.querySelectorAll('table');
    console.log('Found tables in component:', tables.length);
    
    if (tables.length === 0) {
      return [];
    }
    
    // Use the first table (assuming it's the main data table)
    const table = tables[0];
    const rows = table.querySelectorAll('tr');
    const data: any[] = [];
    
    // Extract table headers
    const headerCells = rows[0]?.querySelectorAll('th, td');
    const headers: string[] = [];
    
    if (headerCells && headerCells.length > 0) {
      headerCells.forEach(cell => {
        headers.push(cell.textContent?.trim() || `Column${headers.length + 1}`);
      });
    }
    
    // Extract table data rows (skip header row if it exists)
    const startRow = headers.length > 0 ? 1 : 0;
    
    for (let i = startRow; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td');
      const rowData: any = {};
      
      cells.forEach((cell, index) => {
        const header = headers[index] || `Column${index + 1}`;
        rowData[header] = cell.textContent?.trim() || '';
      });
      
      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    }
    
    console.log('Extracted data from DOM:', {
      headers: headers,
      rowCount: data.length,
      sample: data[0]
    });
    
    return data;
    
  } catch (error) {
    console.error('Error extracting data from DOM:', error);
    return [];
  }
}

private formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

private buildExcelAttachmentBlob(excelData: any, filename: string): Blob {
  if (excelData?.styled && excelData?.reportHeader && excelData?.rows) {
    // Coloured/styled export (xlsx-js-style) for email attachments.
    return this.excelReportService.buildComplexReportStyledBlob(excelData);
  }

  if (excelData?.reportHeader && excelData?.rows) {
    return this.buildComplexExcelBlob(excelData, filename);
  }

  if (excelData?.data && excelData?.headers) {
    return this.buildSimpleExcelBlob(excelData, filename);
  }

  throw new Error('No Excel-compatible data found in report');
}

private buildSimpleExcelBlob(excelData: any, filename: string): Blob {
  const headers = excelData.headers || [];
  const data = excelData.data || [];
  const sheetName = (excelData.sheetName || filename).replace(/[^a-zA-Z0-9]/g, '').slice(0, 31);
  const title = excelData.title;

  if (!data.length || !headers.length) {
    throw new Error('No Excel data or headers provided');
  }

  const formattedData = data.map((item: any) => {
    const row: any = {};
    headers.forEach((header: any) => {
      row[header.label] = item[header.key] ?? '';
    });
    return row;
  });

  const aoa: any[][] = [];
  if (title) {
    aoa.push([`Company Name: ${title}`]);
  }
  aoa.push(headers.map((h: any) => h.label));
  formattedData.forEach((row: any) => {
    aoa.push(headers.map((h: any) => row[h.label]));
  });

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);
  if (title) {
    const endCol = headers.length - 1;
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: endCol } }];
  }

  const workbook: XLSX.WorkBook = {
    Sheets: { [sheetName]: worksheet },
    SheetNames: [sheetName]
  };

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

private buildComplexExcelBlob(config: any, filename: string): Blob {
  const {
    fileName,
    sheetName = (fileName || filename).replace(/[^a-zA-Z0-9]/g, '').slice(0, 31),
    reportHeader,
    tableHeaders,
    includeTableHeaders = true,
    rows,
    columnWidths
  } = config;

  const aoa: any[][] = [];
  const merges: XLSX.Range[] = [];
  const totalCols = tableHeaders.length;

  aoa.push([reportHeader.companyName]);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } });

  aoa.push([reportHeader.reportTitle]);
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } });

  aoa.push([]);

  if (reportHeader.additionalInfo?.length) {
    for (const info of reportHeader.additionalInfo) {
      aoa.push([`${info.label} : ${info.value}`]);
      merges.push({
        s: { r: aoa.length - 1, c: 0 },
        e: { r: aoa.length - 1, c: totalCols - 1 }
      });
    }
  }

  if (includeTableHeaders) {
    aoa.push(tableHeaders.map((h: any) => h.label));
  }

  let currentRowIndex = aoa.length;
  for (const row of rows) {
    const excelRow: any[] = [];
    let colIndex = 0;

    for (const cell of row.cells) {
      excelRow.push(cell.value ?? '');

      if (cell.colspan && cell.colspan > 1) {
        merges.push({
          s: { r: currentRowIndex, c: colIndex },
          e: { r: currentRowIndex, c: colIndex + cell.colspan - 1 }
        });
        for (let i = 1; i < cell.colspan; i++) {
          excelRow.push('');
        }
        colIndex += cell.colspan;
      } else {
        colIndex++;
      }
    }

    while (excelRow.length < totalCols) {
      excelRow.push('');
    }

    aoa.push(excelRow);
    currentRowIndex++;
  }

  if (config.summaryTable) {
    aoa.push([]);
    currentRowIndex++;

    if (config.summaryTable.title) {
      aoa.push([config.summaryTable.title]);
      merges.push({ s: { r: currentRowIndex, c: 0 }, e: { r: currentRowIndex, c: totalCols - 1 } });
      currentRowIndex++;
    }

    const summaryHeaders = config.summaryTable.headers;
    aoa.push(summaryHeaders);
    currentRowIndex++;

    for (const row of config.summaryTable.rows) {
      const summaryExcelRow: any[] = [];
      for (const cell of row.cells) {
        summaryExcelRow.push(cell.value ?? '');
      }
      while (summaryExcelRow.length < summaryHeaders.length) {
        summaryExcelRow.push('');
      }
      aoa.push(summaryExcelRow);
      currentRowIndex++;
    }
  }

  if (config.additionalTables?.length) {
    for (const table of config.additionalTables) {
      aoa.push([]);
      currentRowIndex++;

      if (table.title) {
        aoa.push([table.title]);
        merges.push({ s: { r: currentRowIndex, c: 0 }, e: { r: currentRowIndex, c: totalCols - 1 } });
        currentRowIndex++;
      }

      aoa.push(table.headers);
      currentRowIndex++;

      for (const row of table.rows) {
        const extraExcelRow: any[] = [];
        for (const cell of row.cells) {
          extraExcelRow.push(cell.value ?? '');
        }
        while (extraExcelRow.length < table.headers.length) {
          extraExcelRow.push('');
        }
        aoa.push(extraExcelRow);
        currentRowIndex++;
      }
    }
  }

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet['!merges'] = merges;

  if (columnWidths?.length) {
    worksheet['!cols'] = columnWidths.map((w: number) => ({ wch: w }));
  }

  const workbook: XLSX.WorkBook = {
    Sheets: { [sheetName]: worksheet },
    SheetNames: [sheetName]
  };

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

}
