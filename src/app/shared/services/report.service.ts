
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Observable, firstValueFrom } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { ReportRegistryService, ReportConfig } from './report-registry.service';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';

export interface ReportCard {
  ReportMasterSid: number;
  ReportName: string;
  ReportDisplayName: string;
  ReportMenuSid: number;
  ReportFormat: string;
  ReportType: string;
  ReportExcludedCompany?: number[];
  ReportMasterDetail: ReportParameter[];
}

export interface ReportParameter {
  ReportMasterDetailSid: number;
  ParameterName: string;
  ParameterDisplayName: string;
  ParameterFieldType: 'DATE' | 'DROPDOWN' | 'NUMBER' | 'TEXT' | 'YEAR';
  DropDownValue?: any[];
  ParameterQuery?: string;
  IsMandatory: boolean;
  ReportMasterSid: number;
  Status: string;
}

export interface ReportGenerateResponse {
  success: boolean;
  data: any[];
  reportName: string;
  reportDisplayName: string;
  columns?: string[];
  totalRecords?: number;
}

export interface ExportReportParams {
  format: 'EXCEL' | 'PDF' | 'CSV';
  parameters: any;
  reportDisplayName: string;
}

export interface EmailReportParams {
  email: string;
  cc?: string;
  subject: string;
  message: string;
  format: 'EXCEL' | 'PDF' | 'CSV';
  parameters: any;
}

interface ApiResponse<T> {
  status: boolean;
  data: T;
  message: string;
}


/**
 * Injection token for passing report data to report components
 */
export const REPORT_DATA = 'REPORT_DATA';

/**
 * Interface for email data
 */
export interface EmailData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: File[];
}

/**
 * Interface for PDF configuration
 */
export interface PdfConfig {
  scale?: number;
  imageQuality?: number;
  imageFormat?: 'PNG' | 'JPEG';
  compress?: boolean;
}

/**
 * Report Service
 * Centralized service for all report operations including:
 * - Opening report modals
 * - Fetching report data
 * - Generating PDFs
 * - Sending emails
 *
 * Usage Example:
 * ```typescript
 * constructor(private reportService: ReportService) {}
 *
 * openPreAlert() {
 *   this.reportService.openReportModal('master-job-pre-alert', this.masterJobId);
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private reportRegistry: ReportRegistryService,
    private pdfDownloadService: PdfDownloadService,
    private appSettingsService: AppSettingsService,
    private injector: Injector
  ) {}

  /**
   * Get all Accounts reports available for a specific company
   */
  getAccountsReports(companyId: number): Observable<ReportCard[]> {
    return this.http.get<ApiResponse<ReportCard[]>>(
      `${this.baseUrl}accounts/reports`,
      { params: new HttpParams().set('companyId', companyId.toString()) }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get all Operation reports available for a specific company
   */
  getOperationReports(companyId: number): Observable<ReportCard[]> {
    return this.http.get<ApiResponse<ReportCard[]>>(
      `${this.baseUrl}operation/reports`,
      { params: new HttpParams().set('companyId', companyId.toString()) }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get parameters for a specific report
   */
  getReportParameters(module: 'accounts' | 'operation', reportName: string): Observable<ReportParameter[]> {
    return this.http.get<ApiResponse<ReportParameter[]>>(
      `${this.baseUrl}/${module}/reports/${reportName}/parameters`
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Generate report data
   */
  generateReport(
    module: 'accounts' | 'operation',
    reportName: string,
    parameters: any
  ): Observable<ReportGenerateResponse> {
    return this.http.post<ApiResponse<ReportGenerateResponse>>(
      `${this.baseUrl}${module}/reports/${reportName}/generate`,
      parameters
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Export report to specified format
   */
  exportReport(
    module: 'accounts' | 'operation',
    reportName: string,
    exportParams: ExportReportParams
  ): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/${module}/reports/${reportName}/export`,
      exportParams,
      { responseType: 'blob' }
    );
  }

  /**
   * Email report to recipients
   */
  emailReport(
    module: 'accounts' | 'operation',
    reportName: string,
    emailParams: EmailReportParams
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/${module}/reports/${reportName}/email`,
      emailParams
    );
  }

  /**
   * Get all reports for admin management
   */
  getAllReports(): Observable<ReportCard[]> {
    return this.http.get<ApiResponse<ReportCard[]>>(`${this.baseUrl}report-master`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get single report by ID for admin
   */
  getReportById(reportId: number): Observable<ReportCard> {
    return this.http.get<ApiResponse<ReportCard>>(`${this.baseUrl}report-master/fetch/${reportId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Create new report (admin)
   */
  createReport(reportData: any): Observable<ReportCard> {
    return this.http.post<ApiResponse<ReportCard>>(`${this.baseUrl}report-master/create`, reportData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Update existing report (admin)
   */
  updateReport(reportId: number, reportData: any): Observable<ReportCard> {
    return this.http.patch<ApiResponse<ReportCard>>(`${this.baseUrl}report-master/update/${reportId}`, reportData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Delete report (admin)
   */
  deleteReport(reportId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}report-master/delete/${reportId}`);
  }

  /**
   * Get parameters for a report (admin)
   */
  getReportParametersById(reportId: number): Observable<ReportParameter[]> {
    return this.http.get<ApiResponse<ReportParameter[]>>(`${this.baseUrl}report-master/${reportId}/parameters`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Add parameter to report (admin)
   */
  addReportParameter(reportId: number, parameterData: any): Observable<ReportParameter> {
    return this.http.post<ApiResponse<ReportParameter>>(
      `${this.baseUrl}report-master/${reportId}/parameters`,
      parameterData
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Update report parameter (admin)
   */
  updateReportParameter(parameterId: number, parameterData: any): Observable<ReportParameter> {
    return this.http.patch<ApiResponse<ReportParameter>>(
      `${this.baseUrl}report-master/parameters/${parameterId}`,
      parameterData
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Delete report parameter (admin)
   */
  deleteReportParameter(parameterId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}report-master/parameters/${parameterId}`);
  }

  /**
   * Execute parameter query to get dynamic dropdown options
   */
  executeParameterQuery(
    module: 'accounts' | 'operation',
    parameterId: number,
    context: { companyId?: number; branchId?: number }
  ): Observable<Array<{ value: any; label: string }>> {
    return this.http.post<ApiResponse<Array<{ value: any; label: string }>>>(
      `${this.baseUrl}${module}/reports/parameters/${parameterId}/execute-query`,
      context
    ).pipe(
      map(response => response.data)
    );

  }
  

  /**
   * Open report modal with specified report type and entity ID
   * This is the main entry point for opening reports
   *
   * @param reportId Report identifier (e.g., 'master-job-pre-alert')
   * @param entityId Entity ID (e.g., MasterJobSid)
   * @returns Modal reference
   */
  async openReportModal(reportId: string, entityId: number): Promise<NgbModalRef> {
    const config = this.reportRegistry.getReportConfig(reportId);

    // Import GenericReportModalComponent dynamically to avoid circular dependencies
    const { GenericReportModalComponent } = await import(
      '../components/report-modal/report-modal.component'
    );

    // Open modal
    const modalRef = this.modalService.open(GenericReportModalComponent, {
      size: config.modalSize || 'xl',
      scrollable: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'report-modal-wide'
    });

    // Pass input data
    modalRef.componentInstance.reportId = reportId;
    modalRef.componentInstance.entityId = entityId;

    return modalRef;
  }

  /**
   * Fetch report data from backend
   *
   * @param reportId Report identifier
   * @param entityId Entity ID
   * @returns Observable of report data
   */
  fetchReportData(reportId: string, entityId: number): Observable<any> {
    const config = this.reportRegistry.getReportConfig(reportId);

    // Build endpoint URL
    const url = this.reportRegistry.buildEndpointUrl(
      config.fetchDataEndpoint,
      { id: entityId }
    );

    // Add reportType as query parameter
    const fullUrl = `${url}?reportType=${reportId}`;

    return this.http.get(fullUrl);
  }

  /**
   * Generate PDF blob from HTML element
   *
   * @param elementId HTML element ID to convert
   * @param config Optional PDF configuration
   * @returns Promise resolving to PDF Blob
   */
  async generatePDFBlob(
    elementId: string,
    config?: PdfConfig
  ): Promise<Blob> {
    const element = document.getElementById(elementId);

    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    try {
      // Use existing PdfDownloadService but get blob instead of downloading
      // We'll need to modify the service or use html2canvas + jsPDF directly
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Convert HTML to canvas
      const canvas = await html2canvas(element, {
        scale: config?.scale || 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        removeContainer: true
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Convert canvas to image
      const imgFormat = config?.imageFormat || 'JPEG';
      const imgQuality = config?.imageQuality || 0.75;
      const imgData = canvas.toDataURL(`image/${imgFormat.toLowerCase()}`, imgQuality);

      // Add image to PDF
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, imgFormat, 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, imgFormat, 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Return as blob
      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Download PDF file
   *
   * @param elementId HTML element ID to convert
   * @param filename Output filename (without extension)
   * @param config Optional PDF configuration
   */
  async downloadPDF(
    elementId: string,
    filename: string,
    config?: PdfConfig
  ): Promise<void> {
    try {
      this.spinner.show();

      // Use existing PdfDownloadService
      await this.pdfDownloadService.downloadBalancedPDF(
        elementId,
        filename,
        () => {
          this.appSettingsService.showSuccess('PDF downloaded successfully!');
          this.spinner.hide();
        },
        (error) => {
          this.appSettingsService.showError('Error generating PDF');
          this.spinner.hide();
          throw error;
        }
      );
    } catch (error) {
      this.spinner.hide();
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Generate filename from template and data
   *
   * @param filenameTemplate Template with placeholders
   * @param data Data object
   * @returns Processed filename
   */
  generateFilename(filenameTemplate: string, data: any): string {
    let filename = this.reportRegistry.processTemplate(filenameTemplate, data);

    // Replace {date} placeholder with current date
    const currentDate = new Date().toISOString().split('T')[0];
    filename = filename.replace('{date}', currentDate);

    // Remove any remaining placeholders
    filename = filename.replace(/\{[^}]+\}/g, '');

    return filename;
  }

  /**
   * Build email data from report config and data
   *
   * @param config Report configuration
   * @param reportData Report data
   * @returns Email data object
   */
  buildEmailData(config: ReportConfig, reportData: any): EmailData {
    // Get user data for CC
    const userData = this.getCurrentUser();
    const userEmail = userData?.userEmail || '';

    // Build recipient list from report data
    const recipients = this.extractEmailRecipients(reportData);

    // Flatten reportData for template processing
    // Email templates expect flat structure like {jobNumber}, but data is nested
    const flattenedData = {
      // Spread masterJob fields to top level
      ...(reportData.masterJob || {}),
      // Spread company fields (prefixed to avoid conflicts)
      companyName: reportData.company?.name || '',
      companyBranch: reportData.company?.branchName || '',
      // Format dates to readable strings
      etd: reportData.masterJob?.etd ? new Date(reportData.masterJob.etd).toLocaleDateString() : '',
      eta: reportData.masterJob?.eta ? new Date(reportData.masterJob.eta).toLocaleDateString() : '',
      mblDate: reportData.masterJob?.mblDate ? new Date(reportData.masterJob.mblDate).toLocaleDateString() : '',
    };

    // Process subject template
    const subject = config.emailSubjectTemplate
      ? this.reportRegistry.processTemplate(config.emailSubjectTemplate, flattenedData)
      : `${config.title} - ${this.extractPrimaryIdentifier(reportData)}`;

    // Process body template
    const body = config.emailBodyTemplate
      ? this.reportRegistry.processTemplate(config.emailBodyTemplate, flattenedData)
      : this.buildDefaultEmailBody(config, reportData);

    return {
      to: recipients,
      cc: userEmail ? [userEmail] : [],
      subject,
      body
    };
  }

  /**
   * Open email modal with pre-populated data and PDF attachment
   *
   * @param emailData Email data
   * @param pdfBlob PDF blob to attach
   * @param filename PDF filename
   */
  openEmailModal(emailData: EmailData, pdfBlob: Blob, filename: string): void {
    // Create File from Blob
    const pdfFile = new File([pdfBlob], `${filename}.pdf`, {
      type: 'application/pdf'
    });

    // Open EmailEntryComponent
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'xl',
      centered: true,
      backdrop: 'static'
    });

    // Pre-populate email form
    modalRef.componentInstance.setContent = {
      EmailTo: emailData.to,
      EmailCC: emailData.cc || [],
      EmailBCC: emailData.bcc || [],
      Subject: emailData.subject,
      Mailbody: emailData.body,
      attachments: [pdfFile]
    };
  }

  /**
   * Send report email via module-specific API endpoint
   *
   * @param reportId Report identifier
   * @param formData Form data with email details and PDF
   * @returns Observable of API response
   */
  sendReportEmail(reportId: string, formData: FormData): Observable<any> {
    const config = this.reportRegistry.getReportConfig(reportId);

    // Get API endpoint
    const endpoint = config.apiEndpoint;

    return this.http.post(endpoint, formData);
  }

  /**
   * Get report configuration
   *
   * @param reportId Report identifier
   * @returns Report configuration
   */
  getReportConfig(reportId: string): ReportConfig {
    return this.reportRegistry.getReportConfig(reportId);
  }

  /**
   * Get all reports for a module
   *
   * @param moduleName Module name
   * @returns Array of report configurations
   */
  getModuleReports(moduleName: string): ReportConfig[] {
    return this.reportRegistry.getModuleReports(moduleName);
  }

  /**
   * Extract email recipients from report data
   * Override this method for custom recipient extraction logic
   *
   * @param reportData Report data
   * @returns Array of email addresses
   */
  private extractEmailRecipients(reportData: any): string[] {
    const emails: string[] = [];

    // Try common email field names
    const emailFields = ['Email', 'email', 'CustomerEmail', 'VendorEmail', 'contactEmail'];

    emailFields.forEach(field => {
      if (reportData[field]) {
        emails.push(reportData[field]);
      }
    });

    // Check nested objects
    if (reportData.customer?.Email) {
      emails.push(reportData.customer.Email);
    }

    if (reportData.vendor?.Email) {
      emails.push(reportData.vendor.Email);
    }

    // Remove duplicates
    return [...new Set(emails)].filter(email => this.isValidEmail(email));
  }

  /**
   * Extract primary identifier from report data (e.g., Job Number, Quote Number)
   *
   * @param reportData Report data
   * @returns Primary identifier
   */
  private extractPrimaryIdentifier(reportData: any): string {
    const identifierFields = [
      'jobNumber',
      'JobNumber',
      'quoteNumber',
      'QuoteNumber',
      'bookingNumber',
      'BookingNumber',
      'invoiceNumber',
      'InvoiceNumber'
    ];

    for (const field of identifierFields) {
      if (reportData[field]) {
        return reportData[field];
      }
    }

    return 'Report';
  }

  /**
   * Build default email body if template not provided
   *
   * @param config Report configuration
   * @param reportData Report data
   * @returns HTML email body
   */
  private buildDefaultEmailBody(config: ReportConfig, reportData: any): string {
    const identifier = this.extractPrimaryIdentifier(reportData);

    return `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <p>Dear Sir/Madam,</p>
        <p>Please find attached the <strong>${config.title}</strong> for ${identifier}.</p>
        <p>Best regards,</p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          This is an auto-generated email. Please do not reply.
        </p>
      </div>
    `;
  }

  /**
   * Validate email address
   *
   * @param email Email address
   * @returns True if valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get current user data from AppSettingsService
   *
   * @returns User data
   */
  private getCurrentUser(): any {
    try {
      const userProfile = this.appSettingsService.getDecryptedUserProfile();
      return userProfile;
    } catch (error) {
      console.warn('Could not get user profile:', error);
      return null;
    }
  }
}
