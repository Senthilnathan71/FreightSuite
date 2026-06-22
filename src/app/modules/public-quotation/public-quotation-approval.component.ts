import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  PublicCarrierDecisionStatus,
  PublicQuotationCarrier,
  PublicQuotationResponse,
  PublicQuotationRoute,
  PublicQuotationService,
} from './public-quotation.service';

type ScreenState = 'loading' | 'ready' | 'submitted' | 'error';
type ErrorCode = 'NOT_FOUND' | 'EXPIRED' | 'ALREADY_USED' | 'UNKNOWN';

interface CarrierDecisionDraft {
  route: PublicQuotationRoute;
  carrier: PublicQuotationCarrier;
  status: '' | PublicCarrierDecisionStatus;
  approvedBy: string;
  remarks: string;
}

@Component({
  selector: 'app-public-quotation-approval',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './public-quotation-approval.component.html',
  styleUrls: ['./public-quotation-approval.component.scss'],
})
export class PublicQuotationApprovalComponent implements OnInit {
  state: ScreenState = 'loading';
  errorCode: ErrorCode = 'UNKNOWN';

  data: PublicQuotationResponse | null = null;
  drafts: CarrierDecisionDraft[] = [];
  submittedDecisions: CarrierDecisionDraft[] = [];

  isSubmitting = false;
  submitError: string | null = null;

  private token = '';

  constructor(
    private route: ActivatedRoute,
    private service: PublicQuotationService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!this.token) {
      this.state = 'error';
      this.errorCode = 'NOT_FOUND';
      return;
    }
    this.load();
  }

  private load(): void {
    this.service.fetch(this.token).subscribe({
      next: (data) => {
        this.data = data;
        this.drafts = data.routes.flatMap((route) =>
          route.carriers.map((carrier) => ({
            route,
            carrier,
            status: '' as const,
            approvedBy: '',
            remarks: '',
          })),
        );
        this.state = 'ready';
      },
      error: (err: HttpErrorResponse) => {
        this.state = 'error';
        this.errorCode = this.classifyError(err);
      },
    });
  }

  get hasAnyDecision(): boolean {
    return this.drafts.some((d) => d.status !== '');
  }

  get canSubmit(): boolean {
    if (this.isSubmitting) return false;
    const decided = this.drafts.filter((d) => d.status !== '');
    if (decided.length === 0) return false;
    return decided.every((d) => d.approvedBy.trim().length > 0);
  }

  submit(): void {
    if (!this.canSubmit) return;
    this.isSubmitting = true;
    this.submitError = null;

    const decisions = this.drafts
      .filter((d) => d.status !== '')
      .map((d) => ({
        QuoteCarrierSid: d.carrier.quoteCarrierSid,
        ApprovalStatus: d.status as PublicCarrierDecisionStatus,
        ApprovedBy: d.approvedBy.trim(),
        Remarks: d.remarks.trim() || undefined,
      }));

    this.service.submit(this.token, { decisions }).subscribe({
      next: () => {
        this.submittedDecisions = this.drafts.filter((d) => d.status !== '');
        this.state = 'submitted';
        this.isSubmitting = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        const code = this.classifyError(err);
        if (code === 'ALREADY_USED' || code === 'EXPIRED') {
          this.state = 'error';
          this.errorCode = code;
          return;
        }
        if (err?.error?.message) {
          this.submitError = String(err.error.message);
        } else if (err?.message) {
          this.submitError = err.message;
        } else {
          this.submitError = 'Unable to submit. Please try again.';
        }
      },
    });
  }

  draftsForRoute(route: PublicQuotationRoute): CarrierDecisionDraft[] {
  return this.drafts.filter((d) => d.route === route);
}

  private classifyError(err: HttpErrorResponse): ErrorCode {
    const code = err?.error?.code;
    if (code === 'NOT_FOUND' || code === 'EXPIRED' || code === 'ALREADY_USED') {
      return code;
    }
    if (err?.status === 404) return 'NOT_FOUND';
    if (err?.status === 410) return 'EXPIRED';
    if (err?.status === 409) return 'ALREADY_USED';
    return 'UNKNOWN';
  }
}