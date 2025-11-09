import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { REPORT_DATA } from '../../../services/report.service';
import { ReportHeaderComponent } from '../report-header/report-header.component';
import { ReportFooterComponent } from '../report-footer/report-footer.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

/**
 * Cargo Manifest Report Component
 * Displays comprehensive cargo manifest for shipment
 *
 * Features:
 * - Detailed container and cargo information
 * - House job breakdown
 * - Weights, measurements, and package details
 * - Landscape orientation for better data visibility
 */
@Component({
  selector: 'app-cargo-manifest-report',
  standalone: true,
  imports: [
    CommonModule,
    ReportHeaderComponent,
    ReportFooterComponent,
    CustomDatePipe
  ],
  templateUrl: './cargo-manifest-report.component.html',
  styleUrls: ['./cargo-manifest-report.component.scss']
})
export class CargoManifestReportComponent {
  /**
   * Report data injected by GenericReportModalComponent
   */
  constructor(@Inject(REPORT_DATA) public data: any) {
    console.log('Cargo Manifest Report Data:', this.data);
  }

  // Helper getters for cleaner template access
  get company() { return this.data?.data?.company || {}; }
  get masterJob() { return this.data?.data?.masterJob || {}; }
  get containers() { return this.data?.data?.containers || []; }
  get houseJobs() { return this.data?.data?.houseJobs || []; }
  get printInfo() { return this.data?.data?.printInfo || {}; }

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

  /**
   * Calculate total weight for house jobs
   */
  get totalHouseWeight(): number {
    return this.houseJobs.reduce((sum: number, h: any) => sum + (h.weight || 0), 0);
  }

  /**
   * Calculate total CBM for house jobs
   */
  get totalHouseCBM(): number {
    return this.houseJobs.reduce((sum: number, h: any) => sum + (h.cbm || 0), 0);
  }

  /**
   * Calculate total packages for house jobs
   */
  get totalHousePackages(): number {
    return this.houseJobs.reduce((sum: number, h: any) => sum + (h.packages || 0), 0);
  }
}
