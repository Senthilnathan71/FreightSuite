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
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ReportService, REPORT_DATA, ReportCard } from '../../services/report.service';
import { ReportConfig } from '../../services/report-registry.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from '../../excel-report-service';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';

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
    private reportService: ReportService,
    private spinner: NgxSpinnerService,
    private appSettingsService: AppSettingsService,
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
      this.reportComponent = this.reportConfig.component;

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

    // Create component instance
    this.componentRef = this.reportContainer.createComponent(
      this.reportComponent,
      { injector: componentInjector }
    );

    // Detect changes
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

      let pdfBlob: Blob;
      const filename = this.reportService.generateFilename(
        this.reportConfig.filenameTemplate,
        this.reportData
      );

      // Use pdfmake if component provides structured data
      if (this.componentRef?.instance?.getExcelData) {
        const exportConfig = this.componentRef.instance.getExcelData();
        if (exportConfig?.reportHeader && exportConfig?.rows) {
          const company = this.appSettingsService.getCurrentCompanyInfo();
          const branch = this.appSettingsService.getCurrentBranchInfo();
          const userData = this.appSettingsService.getDecryptedUserProfile();
          const logo = this.pdfMakeService.getReportLogo();

          pdfBlob = await this.pdfMakeService.generateGenericReportBlob(
            exportConfig, company, branch, userData, logo,
            this.reportConfig?.pdfOrientation || 'portrait'
          );
        } else {
          // Fallback to html2canvas
          pdfBlob = await this.reportService.generatePDFBlob(this.printElementId);
        }
      } else {
        // Fallback to html2canvas
        pdfBlob = await this.reportService.generatePDFBlob(this.printElementId);
      }

      const emailData = this.reportService.buildEmailData(
        this.reportConfig,
        this.reportData
      );

      this.spinner.hide();

      // Close this modal
      this.activeModal.dismiss();

      // Open email modal with PDF attachment
      this.reportService.openEmailModal(emailData, pdfBlob, filename);
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
        this.excelReportService.exportComplexReport(excelData);
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

}
