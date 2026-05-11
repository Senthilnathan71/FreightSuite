import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface PublicQuotationPort {
  PortMasterSid: number;
  PortCode: string;
  PortName: string;
}

export interface PublicQuotationRoute {
  quoteRouteSid: number;
  por: PublicQuotationPort | null;
  pol: PublicQuotationPort | null;
  pod: PublicQuotationPort | null;
  fdp: PublicQuotationPort | null;
  transitDays: number | null;
}

export interface PublicQuotationCargo {
  cargoType: string | null;
  containerType: string | null;
  qty: number | null;
  grossWeight: number | null;
  netWeight: number | null;
  cbm: number | null;
  shipmentTerms: string | null;
}

export interface PublicQuotationCharge {
  chargeName: string;
  qty: number | null;
  rate: number | null;
  amount: number | null;
  currency: string | null;
}

export interface PublicQuotationCarrier {
  quoteCarrierSid: number;
  carrierName: string | null;
  transitTime: string | null;
  approvalStatus: string | null;
  charges: PublicQuotationCharge[];
}

export interface PublicQuotationResponse {
  quoteHeaderSid: number;
  quoteNumber: string | null;
  quoteDate: string;
  customerName: string;
  validFrom: string | null;
  validTo: string | null;
  routes: PublicQuotationRoute[];
  cargo: PublicQuotationCargo[];
  carriers: PublicQuotationCarrier[];
  expiresAt: string;
}

export type PublicCarrierDecisionStatus = 'Approved' | 'Rejected';

export interface PublicCarrierDecision {
  QuoteCarrierSid: number;
  ApprovalStatus: PublicCarrierDecisionStatus;
  ApprovedBy: string;
  Remarks?: string;
}

export interface SubmitDecisionsRequest {
  decisions: PublicCarrierDecision[];
}

export interface SubmitDecisionsResponse {
  ok: true;
  decisions: PublicCarrierDecision[];
}

@Injectable({ providedIn: 'root' })
export class PublicQuotationService {
  constructor(private http: HttpClient) {}

  fetch(token: string): Observable<PublicQuotationResponse> {
    return this.http.get<PublicQuotationResponse>(
      `public/quotation/${encodeURIComponent(token)}`,
    );
  }

  submit(
    token: string,
    body: SubmitDecisionsRequest,
  ): Observable<SubmitDecisionsResponse> {
    return this.http.post<SubmitDecisionsResponse>(
      `public/quotation/${encodeURIComponent(token)}/decisions`,
      body,
    );
  }
}
