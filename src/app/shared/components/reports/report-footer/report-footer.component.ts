import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

/**
 * Report Footer Component
 * Reusable footer component for all reports
 * Displays print information, page numbers, and optional signatures
 *
 * Usage:
 * ```html
 * <app-report-footer
 *   [printedBy]="'John Doe'"
 *   [printedOn]="currentDate"
 *   [showSignature]="true"
 *   [signatureLabel]="'Authorized Signatory'"
 *   [showPageNumber]="true">
 * </app-report-footer>
 * ```
 */
@Component({
  selector: 'app-report-footer',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './report-footer.component.html',
  styleUrls: ['./report-footer.component.scss']
})
export class ReportFooterComponent {
  /**
   * Name of person who printed the report
   */
  @Input() printedBy?: string;

  /**
   * Date/time when report was printed
   */
  @Input() printedOn?: Date | string = new Date();

  /**
   * Show signature section
   */
  @Input() showSignature = false;

  /**
   * Signature label text
   */
  @Input() signatureLabel = 'Authorized Signatory';

  /**
   * Show page number
   */
  @Input() showPageNumber = false;

  /**
   * Current page number
   */
  @Input() pageNumber?: number;

  /**
   * Total number of pages
   */
  @Input() totalPages?: number;

  /**
   * Show terms and conditions
   */
  @Input() showTerms = false;

  /**
   * Terms and conditions text
   */
  @Input() termsText?: string;

  /**
   * Custom footer class
   */
  @Input() customClass?: string;

  /**
   * Additional notes
   */
  @Input() notes?: string;

  /**
   * Company tagline or slogan
   */
  @Input() tagline?: string;

  /**
   * Get formatted date
   */
  get formattedDate(): Date {
    if (this.printedOn instanceof Date) {
      return this.printedOn;
    }
    return new Date(this.printedOn);
  }

  /**
   * Get page info text
   */
  get pageInfo(): string {
    if (this.pageNumber && this.totalPages) {
      return `Page ${this.pageNumber} of ${this.totalPages}`;
    }
    if (this.pageNumber) {
      return `Page ${this.pageNumber}`;
    }
    return '';
  }
}
