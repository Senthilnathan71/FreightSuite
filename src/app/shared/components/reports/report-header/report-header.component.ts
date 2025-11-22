import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Report Header Component
 * Reusable header component for all reports
 * Displays company information, logo, and branch details
 *
 * Usage:
 * ```html
 * <app-report-header
 *   [companyName]="'ABC Logistics'"
 *   [branchName]="'Mumbai Branch'"
 *   [address]="'123 Main Street, Mumbai'"
 *   [logoUrl]="'/assets/images/company-logo.png'"
 *   [phone]="'+91 22 1234 5678'"
 *   [email]="'info@abclogistics.com'"
 *   [website]="'www.abclogistics.com'"
 *   [gst]="'27AABCU9603R1ZK'">
 * </app-report-header>
 * ```
 */
@Component({
  selector: 'app-report-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-header.component.html',
  styleUrls: ['./report-header.component.scss']
})
export class ReportHeaderComponent {
  /**
   * Company name
   */
  @Input() companyName?: string;

  /**
   * Branch name
   */
  @Input() branchName?: string;

  /**
   * Company address
   */
  @Input() address?: string;

  /**
   * Additional address line
   */
  @Input() addressLine2?: string;

  /**
   * City
   */
  @Input() city?: string;

  /**
   * State
   */
  @Input() state?: string;

  /**
   * Postal code
   */
  @Input() postalCode?: string;

  /**
   * Country
   */
  @Input() country?: string;

  /**
   * Company logo URL
   */
  @Input() logoUrl?: string;

  /**
   * Phone number
   */
  @Input() phone?: string;

  /**
   * Email address
   */
  @Input() email?: string;

  /**
   * Website
   */
  @Input() website?: string;

  /**
   * GST number (or tax ID)
   */
  @Input() gst?: string;

  /**
   * PAN number
   */
  @Input() pan?: string;

  /**
   * IEC code
   */
  @Input() iec?: string;

  /**
   * Show logo
   */
  @Input() showLogo = true;

  /**
   * Show contact details
   */
  @Input() showContactDetails = true;

  /**
   * Show tax details
   */
  @Input() showTaxDetails = true;

  /**
   * Custom header class
   */
  @Input() customClass?: string;

  /**
   * Get full address
   */
  get fullAddress(): string {
    const parts = [
      this.address,
      this.addressLine2,
      this.city,
      this.state,
      this.postalCode,
      this.country
    ].filter(part => part);

    return parts.join(', ');
  }

  /**
   * Check if logo should be displayed
   */
  get shouldShowLogo(): boolean {
    return this.showLogo && !!this.logoUrl;
  }

  /**
   * Check if any contact details exist
   */
  get hasContactDetails(): boolean {
    return !!(this.phone || this.email || this.website);
  }

  /**
   * Check if any tax details exist
   */
  get hasTaxDetails(): boolean {
    return !!(this.gst || this.pan || this.iec);
  }
}
