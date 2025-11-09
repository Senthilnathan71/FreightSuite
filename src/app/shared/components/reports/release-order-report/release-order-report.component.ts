import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { REPORT_DATA } from '../../../services/report.service';
import { ReportHeaderComponent } from '../report-header/report-header.component';
import { ReportFooterComponent } from '../report-footer/report-footer.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

/**
 * Release Order Report Component
 * Generates delivery/release order for containers
 *
 * Features:
 * - Official release order format
 * - Container-wise release details
 * - Delivery instructions
 * - Authorization section
 */
@Component({
  selector: 'app-release-order-report',
  standalone: true,
  imports: [
    CommonModule,
    ReportHeaderComponent,
    ReportFooterComponent,
    CustomDatePipe
  ],
  templateUrl: './release-order-report.component.html',
  styleUrls: ['./release-order-report.component.scss']
})
export class ReleaseOrderReportComponent {
  constructor(@Inject(REPORT_DATA) public data: any) {
    console.log('Release Order Report Data:', this.data);
  }

  get company() { return this.data?.company || {}; }
  get masterJob() { return this.data?.masterJob || {}; }
  get containers() { return this.data?.containers || []; }
  get houseJobs() { return this.data?.houseJobs || []; }
  get printInfo() { return this.data?.printInfo || {}; }

  get containerCount(): number {
    return this.containers.length;
  }

  get todayDate(): Date {
    return new Date();
  }
}
