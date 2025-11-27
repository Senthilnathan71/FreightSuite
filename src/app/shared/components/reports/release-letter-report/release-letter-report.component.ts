import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { REPORT_DATA } from '../../../services/report.service';
import { ReportHeaderComponent } from '../report-header/report-header.component';
import { ReportFooterComponent } from '../report-footer/report-footer.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

/**
 * Release Letter Report Component
 * Generates formal release authorization letter
 *
 * Features:
 * - Official letter format
 * - Cargo release authorization
 * - Container and shipment details
 * - Signature section
 */
@Component({
  selector: 'app-release-letter-report',
  standalone: true,
  imports: [
    CommonModule,
    ReportHeaderComponent,
    ReportFooterComponent,
    CustomDatePipe
  ],
  templateUrl: './release-letter-report.component.html',
  styleUrls: ['./release-letter-report.component.scss']
})
export class ReleaseLetterReportComponent {
  /**
   * Report data injected by GenericReportModalComponent
   */
  constructor(@Inject(REPORT_DATA) public data: any) {
    console.log('Release Letter Report Data:', this.data);
  }

  // Helper getters for cleaner template access
  get company() { return this.data?.company || {}; }
  get masterJob() { return this.data?.masterJob || {}; }
  get containers() { return this.data?.containers || []; }
  get houseJobs() { return this.data?.houseJobs || []; }
  get printInfo() { return this.data?.printInfo || {}; }

  /**
   * Get total number of containers
   */
  get containerCount(): number {
    return this.containers.length;
  }

  /**
   * Get container numbers as comma-separated string
   */
  get containerList(): string {
    return this.containers.map((c: any) => c.containerNumber).join(', ');
  }

  /**
   * Get today's date for the letter
   */
  get todayDate(): Date {
    return new Date();
  }
}
