import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PublicQuotationPort {
  PortMasterSid: number;
  PortCode: string;
  PortName: string;
}

export interface PublicQuotationProduct {
  productName: string | null;
  grossWeight: number | null;
  netWeight: number | null;
  volume: number | null;
}

export interface PublicQuotationCargo {
  cargoType: string | null;
  grossWeight: number | null;
  netWeight: number | null;
  cbm: number | null;
  shipmentTerms: string | null;
  products: PublicQuotationProduct[];
}

export interface PublicQuotationCharge {
  chargeName: string;
  cost: number | null;
  costDrCr: string | null;
  costEx: number | null;
  costLcAmount: number | null;
  costCurrency: string | null;
  revenue: number | null;
  revenueDrCr: string | null;
  revenueEx: number | null;
  revenueLcAmount: number | null;
  revenueCurrency: string | null;
  qty: number | null;
}

export interface PublicQuotationCarrier {
  quoteCarrierSid: number;
  carrierName: string | null;
  transitTime: string | null;
  approvalStatus: string | null;
  charges: PublicQuotationCharge[];
}

export interface PublicQuotationRoute {
  quoteRouteSid: number;
  department: string | null;
  por: PublicQuotationPort | null;
  pol: PublicQuotationPort | null;
  pod: PublicQuotationPort | null;
  fdp: PublicQuotationPort | null;
  carriers: PublicQuotationCarrier[];
  cargo: PublicQuotationCargo[];
}

export interface PublicQuotationResponse {
  quoteHeaderSid: number;
  quoteNumber: string | null;
  quoteDate: string;
  customerName: string;
  validFrom: string | null;
  validTo: string | null;
  routes: PublicQuotationRoute[];
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

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function mapResponse(raw: any): PublicQuotationResponse {
  return {
    quoteHeaderSid: raw.quoteHeaderSid,
    quoteNumber: raw.quoteNumber ?? null,
    quoteDate: raw.quoteDate,
    customerName: raw.customerName,
    validFrom: raw.validFrom ?? null,
    validTo: raw.validTo ?? null,
    expiresAt: raw.expiresAt,
    routes: (raw.routes ?? []).map((r: any) => ({
      quoteRouteSid: r.quoteRouteSid,
      department: r.department ?? null,
      por: r.por ?? null,
      pol: r.pol ?? null,
      pod: r.pod ?? null,
      fdp: r.fdp ?? null,
      carriers: (r.carriers ?? []).map((c: any) => ({
        quoteCarrierSid: c.quoteCarrierSid,
        carrierName: c.carrierName ?? null,
        transitTime: c.transitTime ?? null,
        approvalStatus: c.approvalStatus ?? null,
        charges: (c.charges ?? []).map((ch: any) => ({
          chargeName: ch.chargeName,
          qty: toNum(ch.qty),
          revenue: toNum(ch.revenue),
          revenueLcAmount: toNum(ch.revenuelcamount),
          revenueCurrency: ch.revenuecurrency ?? null,
        })),
      })),
      cargo: (r.cargo ?? []).map((cg: any) => ({
        cargoType: cg.cargoType ?? null,
        grossWeight: toNum(cg.grossWeight),
        netWeight: toNum(cg.netWeight),
        cbm: toNum(cg.cbm),
        shipmentTerms: cg.shipmentTerms || null,
        products: (cg.products ?? []).map((p: any) => ({
          productName: p.productName ?? null,
          grossWeight: toNum(p.grossWeight),
          netWeight: toNum(p.netweight),
          volume: toNum(p.volume),
        })),
      })),
    })),
  };
}

@Injectable({ providedIn: 'root' })
export class PublicQuotationService {
  constructor(private http: HttpClient) {}

  fetch(token: string): Observable<PublicQuotationResponse> {
    return this.http
      .get<any>(`public/quotation/${encodeURIComponent(token)}`)
      .pipe(map(mapResponse));
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