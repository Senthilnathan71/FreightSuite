import { Injectable, Type } from '@angular/core';
import { MblComponent } from '../components/reports/mbl/mbl.component';

/**
 * Report Configuration Interface
 * Defines metadata for each report type
 */
export interface ReportConfig {
  /** Unique report identifier (e.g., 'master-job-pre-alert') */
  id: string;

  /** Display title for the report */
  title: string;

  /** Angular component class for rendering this report */
  component: Type<any>;

  /** Filename template with placeholders (e.g., 'PreAlert_{jobNumber}') */
  filenameTemplate: string;

  /** Module this report belongs to (e.g., 'master-job', 'quotation') */
  module: string;

  /** Backend API endpoint for sending email */
  apiEndpoint: string;

  /** Type of api calling you want to do */
  request?: 'GET' | 'POST';

  /** Backend API endpoint for fetching report data */
  fetchDataEndpoint: string;

  /** Email subject template with placeholders */
  emailSubjectTemplate?: string;

  /** Email body HTML template with placeholders */
  emailBodyTemplate?: string;

  /** Modal size (sm, md, lg, xl) */
  modalSize?: 'sm' | 'md' | 'lg' | 'xl';

  /** PDF orientation */
  pdfOrientation?: 'portrait' | 'landscape';

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Report Registry Service
 * Central configuration service for all report types in the application
 *
 * Usage:
 *   const config = reportRegistry.getReportConfig('master-job-pre-alert');
 *   const reports = reportRegistry.getModuleReports('master-job');
 */
@Injectable({
  providedIn: 'root'
})
export class ReportRegistryService {

  /**
   * Master registry of all reports
   * To be populated as report components are created
   */
  private registry: Map<string, ReportConfig> = new Map();

  constructor() {
    this.initializeRegistry();
  }

  /**
   * Initialize report registry with all available reports
   * Components are imported lazily to avoid circular dependencies
   */
  private async initializeRegistry(): Promise<void> {
    // MASTER JOB REPORTS

    // Pre Alert Report
    try {
      const { PreAlertReportComponent } = await import(
        '../components/reports/pre-alert-report/pre-alert-report.component'
      );

      this.registerReport({
        id: 'master-job-pre-alert',
        title: 'Pre Alert',
        component: PreAlertReportComponent,
        filenameTemplate: 'PreAlert_{jobNumber}_{date}',
        module: 'master-job',
        apiEndpoint: 'master-job/send-email',
        request: 'GET',
        fetchDataEndpoint: 'master-job/{id}/report-data',
        emailSubjectTemplate: 'Pre Alert - Job No: {jobNumber}',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong>Pre-Alert</strong> for Job No: <strong>{jobNumber}</strong></p>
            <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px;"><strong>Vessel:</strong></td>
                <td style="padding: 5px;">{vesselName}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>Voyage:</strong></td>
                <td style="padding: 5px;">{voyageNumber}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>ETD:</strong></td>
                <td style="padding: 5px;">{etd}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>ETA:</strong></td>
                <td style="padding: 5px;">{eta}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>POL:</strong></td>
                <td style="padding: 5px;">{pol}</td>
              </tr>
              <tr>
                <td style="padding: 5px;"><strong>POD:</strong></td>
                <td style="padding: 5px;">{pod}</td>
              </tr>
            </table>
            <p style="margin-top: 15px;">Best regards,</p>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">
              This is an auto-generated email. Please do not reply.
            </p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'portrait'
      });
    } catch (error) {
      console.warn('Pre Alert Report component not yet created:', error);
    }

    // Cargo Manifest Report
    try {
      const { CargoManifestReportComponent } = await import(
        '../components/reports/cargo-manifest-report/cargo-manifest-report.component'
      );

      this.registerReport({
        id: 'master-job-cargo-manifest',
        title: 'Cargo Manifest',
        component: CargoManifestReportComponent,
        filenameTemplate: 'CargoManifest_{jobNumber}_{date}',
        module: 'master-job',
        apiEndpoint: 'master-job/send-email',
        request: 'GET',
        fetchDataEndpoint: 'master-job/{id}/report-data',
        emailSubjectTemplate: 'Cargo Manifest - Job No: {jobNumber}',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong>Cargo Manifest</strong> for Job No: <strong>{jobNumber}</strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'landscape'
      });
    } catch (error) {
      console.warn('Cargo Manifest Report component not yet created:', error);
    }

    // Release Letter Report
    try {
      const { ReleaseLetterReportComponent } = await import(
        '../components/reports/release-letter-report/release-letter-report.component'
      );

      this.registerReport({
        id: 'master-job-release-letter',
        title: 'Release Letter',
        component: ReleaseLetterReportComponent,
        filenameTemplate: 'ReleaseLetter_{jobNumber}_{date}',
        module: 'master-job',
        apiEndpoint: 'master-job/send-email',
        request: 'GET',
        fetchDataEndpoint: 'master-job/{id}/report-data',
        emailSubjectTemplate: 'Cargo Release Letter - Job No: {jobNumber}',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong>Release Letter</strong> for Job No: <strong>{jobNumber}</strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'lg',
        pdfOrientation: 'portrait'
      });
    } catch (error) {
      console.warn('Release Letter Report component not yet created:', error);
    }

    // Release Order Report
    try {
      const { ReleaseOrderReportComponent } = await import(
        '../components/reports/release-order-report/release-order-report.component'
      );

      this.registerReport({
        id: 'master-job-release-order',
        title: 'Release Order',
        component: ReleaseOrderReportComponent,
        filenameTemplate: 'ReleaseOrder_{jobNumber}_{date}',
        module: 'master-job',
        apiEndpoint: 'master-job/send-email',
        request: 'GET',
        fetchDataEndpoint: 'master-job/{id}/report-data',
        emailSubjectTemplate: 'Delivery/Release Order - Job No: {jobNumber}',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong>Release Order</strong> for Job No: <strong>{jobNumber}</strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'lg',
        pdfOrientation: 'portrait'
      });
    } catch (error) {
      console.warn('Release Order Report component not yet created:', error);
    }

    // Job Card Report
    try {
      const { JobCardReportComponent } = await import(
        '../components/reports/job-card-report/job-card-report.component'
      );

      this.registerReport({
        id: 'master-job-job-card',
        title: 'Job Card',
        component: JobCardReportComponent,
        filenameTemplate: 'JobCard_{jobNumber}_{date}',
        module: 'master-job',
        apiEndpoint: 'master-job/send-email',
        request: 'GET',
        fetchDataEndpoint: 'master-job/{id}/report-data',
        emailSubjectTemplate: 'Job Card - Job No: {jobNumber}',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong>Job Card</strong> for Job No: <strong>{jobNumber}</strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'portrait'
      });
    } catch (error) {
      console.warn('Job Card Report component not yet created:', error);
    }

    // MBL Report
    try {
      const { MblComponent } = await import(
        '../components/reports/mbl/mbl.component'
      );

      this.registerReport({
        id: 'master-job-mbl',
        title: 'MBL',
        component: MblComponent,
        filenameTemplate: 'MBL_{jobNumber}_{date}',
        module: 'master-job',
        apiEndpoint: 'master-job/send-email',
        request: 'GET',
        fetchDataEndpoint: 'master-job/{id}/report-data',
        emailSubjectTemplate: 'MBL - Job No: {jobNumber}',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong>MBL</strong> for Job No: <strong>{jobNumber}</strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'portrait'
      });
    } catch (error) {
      console.warn('MBL Report component not yet created:', error);
    }

    // Ageing Report
    try {
      const { AgeingReportComponent } = await import(
        '../components/reports/ageing-report/ageing-report.component'
      );

      this.registerReport({
        id: 'ageing-report',
        title: 'Ageing Report',
        component: AgeingReportComponent,
        filenameTemplate: 'Ageing_Report_{LedgerName}_{date}',
        module: 'accounts-report',
        apiEndpoint: 'accounts-report/send-email',
        request: 'POST',
        fetchDataEndpoint: 'accounts/reports/{id}/generate',
        emailSubjectTemplate: 'Ageing Report - Ledger: {LedgerName}',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong>Ageing Report</strong> for Ledger: <strong>{LedgerName}</strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'landscape'
      });

    } catch (error) {
      console.warn('Ageing Report component not yet created:', error);
    }

     // Outstanding Report
    try {
      const { OutstandingReportComponent } = await import(
        '../components/reports/outstanding-report/outstanding-report.component'
      );

      this.registerReport({
        id: 'outstanding-report',
        title: 'Oustanding Report',
        component: OutstandingReportComponent,
        filenameTemplate: 'Outstanding_Report_{LedgerName}_{date}',
        module: 'accounts-report',
        apiEndpoint: 'accounts-report/send-email',
        request: 'POST',
        fetchDataEndpoint: 'accounts/reports/{id}/generate',
        emailSubjectTemplate: 'Outstanding Report - Ledger: {LedgerName}',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong>Outstanding Report</strong> for Ledger: <strong>{LedgerName}</strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'landscape'
      });

    } catch (error) {
      console.warn('Outstanding Report component not yet created:', error);
    }

    // Statement Report
     try {
      const { StatementReportComponent } = await import(
        '../components/reports/statement-report/statement-report.component'
      );

      this.registerReport({
        id: 'statement-ledger-report',
        title: 'Statment Ledger Report',
        component: StatementReportComponent,
        filenameTemplate: 'Statemnt_Ledger_Report_{LedgerName}_{date}',
        module: 'accounts-report',
        apiEndpoint: 'accounts-report/send-email',
        request: 'POST',
        fetchDataEndpoint: 'accounts/reports/{id}/generate',
        emailSubjectTemplate: 'Statment Ledger Report - Ledger: {LedgerName}',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong>Statment Ledger Report</strong> for Ledger: <strong>{LedgerName}</strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'portrait'
      });

    } catch (error) {
      console.warn('Statment Ledger Report component not yet created:', error);
    }

    // Trail_Balance Report
     try {
      const { TrailBalanceComponent } = await import(
        '../components/reports/trail-balance/trail-balance.component'
      );

      this.registerReport({
        id: 'trial-balance',
        title: 'Trail Balance',
        component: TrailBalanceComponent,
        filenameTemplate: 'Trail_Balance_Report_{GroupName}_{date}',
        module: 'accounts-report',
        apiEndpoint: 'accounts-report/send-email',
        request: 'POST',
        fetchDataEndpoint: 'accounts/trial-balance/report',
        emailSubjectTemplate: 'Trail_Balance Report - Ledger: {GroupName}',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong>Trail Balance Report</strong> for Ledger: <strong>{GroupName}</strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'portrait'
      });

    } catch (error) {
      console.warn('Trail Balance Report component not yet created:', error);
    }

      // Balance_Sheet Report
     try {
      const { BalanceSheetsComponent } = await import(
        '../components/reports/balance-sheets/balance-sheets.component'
      );

      this.registerReport({
        id: 'balance-sheet',
        title: 'Balance Sheet',
        component: BalanceSheetsComponent,
        filenameTemplate: 'Balance_Sheet_Report_{GroupName}_{date}',
        module: 'accounts-report',
        apiEndpoint: 'accounts-report/send-email',
        request: 'POST',
        fetchDataEndpoint: 'accounts/reports/{id}/generate',
        emailSubjectTemplate: 'Balance_Sheet_Report - Ledger: {GroupName}',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong> Balance Sheet Report</strong> for Ledger: <strong>{GroupName}</strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'portrait'
      });

    } catch (error) {
      console.warn(' Balance Sheet Report component not yet created:', error);
    }

// ======================================================
    // operation report

    // shipment-summary

    try {
      const { ShipmentSummaryReportComponent } = await import(
        '../components/reports/shipment-summary-report/shipment-summary-report.component'
      );

      this.registerReport({
        id: 'shipment-summary',
        title: 'Shipment Summary Report',
        component: ShipmentSummaryReportComponent,
        filenameTemplate: 'Shipment_Summary_Report{GroupName}_{date}',
        module: 'accounts-report',
        apiEndpoint: 'accounts-report/send-email',
        request: 'POST',
        fetchDataEndpoint: 'operation/reports/{id}/generate',
        emailSubjectTemplate: 'Shipment_Summary_Report - Ledger: {GroupName}',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong> Shipment_Summary_Report</strong> for Ledger: <strong>{GroupName}</strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'portrait'
      });

    } catch (error) {
      console.warn(' Balance Sheet Report component not yet created:', error);
    }


    // BL-Issue 

    try {
      const { BlIssueReportComponent } = await import(
        '../components/reports/bl-issue-report/bl-issue-report.component'
      );

      this.registerReport({
        id: 'bl-issue-list',
        title: 'BL Issue Report',
        component: BlIssueReportComponent,
        filenameTemplate: 'BL_Issue_Report{GroupName}_{date}',
        module: 'accounts-report',
        apiEndpoint: 'accounts-report/send-email',
        request: 'POST',
        fetchDataEndpoint: 'operation/reports/{id}/generate',
        emailSubjectTemplate: 'BL_Issue_Report',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong> BL_Issue_Report</strong></strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'landscape'
      });

    } catch (error) {
      console.warn(' Balance Sheet Report component not yet created:', error);
    }

    // profitability 

    try {
      const { ProfitabilityReportComponent } = await import(
        '../components/reports/profitability-report/profitability-report.component'
      );

      this.registerReport({
        id: 'profitability-report',
        title: 'Profitability Report',
        component: ProfitabilityReportComponent,
        filenameTemplate: 'Profitability_Report_{date}',
        module: 'accounts-report',
        apiEndpoint: 'accounts-report/send-email',
        request: 'POST',
        fetchDataEndpoint: 'operation/reports/{id}/generate',
        emailSubjectTemplate: 'Profitability_Report',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong> Profitability_Report</strong></strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'landscape'
      });

    } catch (error) {
      console.warn(' Profitability Report component not yet created:', error);
    }

    // Container-wise-kpi

    try {
      const { ContainerWiseKpiComponent } = await import(
        '../components/reports/container-wise-kpi/container-wise-kpi.component'
      );

      this.registerReport({
        id: 'contanier-wise-kpi',
        title: 'Container-wise-KPI',
        component: ContainerWiseKpiComponent,
        filenameTemplate: 'Container_Wise-KPI_Report_{date}',
        module: 'accounts-report',
        apiEndpoint: 'accounts-report/send-email',
        request: 'POST',
        fetchDataEndpoint: 'operation/reports/{id}/generate',
        emailSubjectTemplate: 'Container_Wise-KPI_Report',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong> Container_Wise-KPI_Report</strong></strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'landscape'
      });

    } catch (error) {
      console.warn(' Profitability Report component not yet created:', error);
    }

    // DO_Issue
      try {
      const { DoIssueListComponent } = await import(
        '../components/reports/do-issue-list/do-issue-list.component'
      );

      this.registerReport({
        id: 'do-issue-list',
        title: 'Do_Issue_List',
        component: DoIssueListComponent,
        filenameTemplate: 'Do_Issue_List_{date}',
        module: 'accounts-report',
        apiEndpoint: 'accounts-report/send-email',
        request: 'POST',
        fetchDataEndpoint: 'operation/reports/{id}/generate',
        emailSubjectTemplate: 'Do_Issue_List_Report',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong> Do_Issue_List_Report</strong></strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'landscape'
      });

    } catch (error) {
      console.warn(' Profitability Report component not yet created:', error);
    }


       // Shipment_summary_details
      try {
      const { ShipmentSummaryDetailsComponent } = await import(
        '../components/reports/shipment-summary-details/shipment-summary-details.component'
      );

      this.registerReport({
        id: 'shipment-summary-details',
        title: 'Shipment_Summary_Details',
        component: ShipmentSummaryDetailsComponent,
        filenameTemplate: 'Shipment_Summary_Details_{date}',
        module: 'accounts-report',
        apiEndpoint: 'accounts-report/send-email',
        request: 'POST',
        fetchDataEndpoint: 'operation/reports/{id}/generate',
        emailSubjectTemplate: 'Shipment_Summary_Details_Report',
        emailBodyTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear Sir/Madam,</p>
            <p>Please find attached the <strong> Shipment_Summary_Details_Report</strong></strong></p>
            <p>Best regards,</p>
          </div>
        `,
        modalSize: 'xl',
        pdfOrientation: 'landscape'
      });

    } catch (error) {
      console.warn(' Profitability Report component not yet created:', error);
    }

    // 
  }

  /**
   * Register a new report configuration
   * @param config Report configuration object
   */
  registerReport(config: ReportConfig): void {
    if (this.registry.has(config.id)) {
      console.warn(`Report with ID '${config.id}' is already registered. Overwriting...`);
    }

    this.registry.set(config.id, config);
    console.log(`✓ Registered report: ${config.id} (${config.title})`);
  }

  /**
   * Get report configuration by ID
   * @param reportId Unique report identifier
   * @returns Report configuration or throws error if not found
   */
  getReportConfig(reportId: string): ReportConfig {
    const config = this.registry.get(reportId);

    if (!config) {
      throw new Error(`Report configuration not found for ID: ${reportId}`);
    }

    return config;
  }

  /**
   * Get all reports for a specific module
   * @param moduleName Module name (e.g., 'master-job', 'quotation')
   * @returns Array of report configurations
   */
  getModuleReports(moduleName: string): ReportConfig[] {
    const moduleReports: ReportConfig[] = [];

    this.registry.forEach((config) => {
      if (config.module === moduleName) {
        moduleReports.push(config);
      }
    });

    return moduleReports.sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Get all registered report IDs
   * @returns Array of report IDs
   */
  getAllReportIds(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Get all registered reports
   * @returns Array of all report configurations
   */
  getAllReports(): ReportConfig[] {
    return Array.from(this.registry.values());
  }

  /**
   * Check if a report exists
   * @param reportId Report identifier
   * @returns True if report is registered
   */
  hasReport(reportId: string): boolean {
    return this.registry.has(reportId);
  }

  /**
   * Get report count
   * @returns Total number of registered reports
   */
  getReportCount(): number {
    return this.registry.size;
  }

  /**
   * Get unique modules
   * @returns Array of unique module names
   */
  getModules(): string[] {
    const modules = new Set<string>();
    this.registry.forEach((config) => modules.add(config.module));
    return Array.from(modules).sort();
  }

  /**
   * Build endpoint URL with parameters
   * @param template URL template with placeholders
   * @param params Parameters to replace in template
   * @returns Processed URL
   */
  buildEndpointUrl(template: string, params: Record<string, any>): string {
    let url = template;

    Object.keys(params).forEach((key) => {
      const placeholder = `{${key}}`;
      url = url.replace(placeholder, String(params[key]));
    });

    return url;
  }

  /**
   * Process template string by replacing placeholders
   * @param template Template string with {placeholder} syntax
   * @param data Data object with values
   * @returns Processed string
   */
  processTemplate(template: string, data: Record<string, any>): string {
    let result = template;

    Object.keys(data).forEach((key) => {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g');
      const value = data[key] !== null && data[key] !== undefined ? String(data[key]) : '';
      result = result.replace(placeholder, value);
    });

    return result;
  }
}
