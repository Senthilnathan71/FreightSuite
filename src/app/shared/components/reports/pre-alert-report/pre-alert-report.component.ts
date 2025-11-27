import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { REPORT_DATA } from '../../../services/report.service';
import { ReportHeaderComponent } from '../report-header/report-header.component';
import { ReportFooterComponent } from '../report-footer/report-footer.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

/**
 * Pre Alert Report Component
 * Displays pre-arrival notification for master job shipments
 *
 * Features:
 * - Job and vessel details
 * - Container information
 * - House job breakdown
 * - Commodity and package details
 *
 * Data Structure Expected:
 * - company: Company and branch information
 * - masterJob: Job details, dates, vessel info
 * - containers: Array of container details
 * - houseJobs: Array of house job details (optional)
 * - printInfo: Print metadata
 */
@Component({
  selector: 'app-pre-alert-report',
  standalone: true,
  imports: [
    CommonModule,
    ReportHeaderComponent,
    ReportFooterComponent,
    CustomDatePipe
  ],
  templateUrl: './pre-alert-report.component.html',
  styleUrls: ['./pre-alert-report.component.scss']
})
export class PreAlertReportComponent {
  /**
   * Report data injected by GenericReportModalComponent
   */
  constructor(@Inject(REPORT_DATA) public data: any) {
    console.log('Pre Alert Report Data:', this.data);
  }

  // Helper getters for cleaner template access
  get company() { return this.data?.company || {}; }
  get masterJob() { return this.data?.masterJob || {}; }
  get containers() { return this.data?.containers || []; }
  get houseJobs() { return this.data?.houseJobs || []; }
  get printInfo() { return this.data?.printInfo || {}; }

  /**
   * Calculate total weight across all containers
   */
  get totalWeight(): number {
    return this.containers.reduce((sum: number, c: any) => sum + (c.weight || 0), 0);
  }

  /**
   * Calculate total CBM across all containers
   */
  get totalCBM(): number {
    return this.containers.reduce((sum: number, c: any) => sum + (c.cbm || 0), 0);
  }

  /**
   * Calculate total packages across all containers
   */
  get totalPackages(): number {
    return this.containers.reduce((sum: number, c: any) => sum + (c.packages || 0), 0);
  }

  /**
   * Get total number of containers
   */
  get containerCount(): number {
    return this.containers.length;
  }
}
