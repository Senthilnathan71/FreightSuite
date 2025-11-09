import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { REPORT_DATA } from '../../../services/report.service';
import { ReportHeaderComponent } from '../report-header/report-header.component';
import { ReportFooterComponent } from '../report-footer/report-footer.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

/**
 * Job Card Report Component
 * Comprehensive job tracking and monitoring document
 *
 * Features:
 * - Complete job details
 * - Timeline and milestones
 * - Container tracking
 * - Status monitoring
 */
@Component({
  selector: 'app-job-card-report',
  standalone: true,
  imports: [
    CommonModule,
    ReportHeaderComponent,
    ReportFooterComponent,
    CustomDatePipe
  ],
  templateUrl: './job-card-report.component.html',
  styleUrls: ['./job-card-report.component.scss']
})
export class JobCardReportComponent {
  constructor(@Inject(REPORT_DATA) public data: any) {
    console.log('Job Card Report Data:', this.data);
  }

  get company() { return this.data?.company || {}; }
  get masterJob() { return this.data?.masterJob || {}; }
  get containers() { return this.data?.containers || []; }
  get houseJobs() { return this.data?.houseJobs || []; }
  get printInfo() { return this.data?.printInfo || {}; }

  get totalWeight(): number {
    return this.containers.reduce((sum: number, c: any) => sum + (c.weight || 0), 0);
  }

  get totalCBM(): number {
    return this.containers.reduce((sum: number, c: any) => sum + (c.cbm || 0), 0);
  }

  get totalPackages(): number {
    return this.containers.reduce((sum: number, c: any) => sum + (c.packages || 0), 0);
  }

  get containerCount(): number {
    return this.containers.length;
  }
}
