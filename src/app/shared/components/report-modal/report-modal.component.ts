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
import { ReportService, REPORT_DATA } from '../../services/report.service';
import { ReportConfig } from '../../services/report-registry.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

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
    private injector: Injector
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

    // Create injector with report data
    const componentInjector = Injector.create({
      providers: [
        {
          provide: REPORT_DATA,
          useValue: this.reportData
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

      // Generate filename
      const filename = this.reportService.generateFilename(
        this.reportConfig.filenameTemplate,
        this.reportData
      );

      // Download PDF
      await this.reportService.downloadPDF(this.printElementId, filename);

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

      // Generate PDF blob
      const pdfBlob = await this.reportService.generatePDFBlob(this.printElementId);

      // Generate filename
      const filename = this.reportService.generateFilename(
        this.reportConfig.filenameTemplate,
        this.reportData
      );

      // Build email data
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
}
