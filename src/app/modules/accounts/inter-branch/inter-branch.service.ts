import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface InterBranchMatch {
  VoucherHeaderSid: number;
  VoucherDetailSid: number;
  VoucherTransactionSid: number;
  VoucherType: string;
  BranchName?: string;
  CurrencyCode: string;
  ExchangeRate: number;
  DrCr: string;
  Amount: number;
  LocalAmount: number;
  MatchingAmount: number;
  MatchingLocalAmount: number;
  PartyAmount?: number;
  MatchingCurrency?: number;
}

export interface InterBranchAllocation {
  AllotmentBranchSid: number;
  CurrencyAmount: number;
  LocalAmount: number;
  matches?: InterBranchMatch[];
}

export interface StageAllocationsPayload {
  CompanyMasterSid: number;
  BranchMasterSid: number;
  VoucherHeaderSid: number;
  CreatedBy: string;
  CurrencyCode: string;
  ExchangeRate: number;
  allocations: InterBranchAllocation[];
}

/** Shared API client for the inter-branch (multi-branch) receipt/payment feature. */
@Injectable({ providedIn: 'root' })
export class InterBranchService {
  constructor(private http: HttpClient) {}

  /** Persist (replace) the staged allocations + owning-branch matches for a draft voucher. */
  stageAllocations(payload: StageAllocationsPayload): Observable<any> {
    return this.http.post('inter-branch/stage', payload).pipe(map((r: any) => r));
  }

  /** Read staged allocations when re-opening a draft. */
  getAllocations(voucherHeaderSid: number): Observable<any> {
    return this.http
      .get<{ data: any }>(`inter-branch/allocations/${voucherHeaderSid}`)
      .pipe(map((r) => r.data));
  }
}
