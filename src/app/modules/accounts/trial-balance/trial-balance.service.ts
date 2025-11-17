import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TrialBalanceItem {
  COAMasterSid: number;
  LedgerCode: string;
  LedgerName: string;
  Category: string;
  GroupName: string;
  SubGroupName?: string;
  LedgerType: string;
  OpeningDebit: number;
  OpeningCredit: number;
  CurrentDebit: number;
  CurrentCredit: number;
  ClosingDebit: number;
  ClosingCredit: number;
  ClosingNet: number;
}

export interface TrialBalanceSubtotal {
  type: 'Group' | 'SubGroup';
  name: string;
  OpeningDebit: number;
  OpeningCredit: number;
  CurrentDebit: number;
  CurrentCredit: number;
  ClosingDebit: number;
  ClosingCredit: number;
  ClosingNet: number;
}

export interface TrialBalanceGrandTotal {
  TotalOpeningDebit: number;
  TotalOpeningCredit: number;
  TotalCurrentDebit: number;
  TotalCurrentCredit: number;
  TotalClosingDebit: number;
  TotalClosingCredit: number;
  IsBalanced: boolean;
  Difference: number;
}

export interface TrialBalanceQueryParams {
  CompanyMasterSid: number;
  BranchMasterSid?: number[];
  fromDate: string;
  toDate: string;
  GroupName?: string;
  SubGroupName?: string;
  showSubtotals?: boolean;
  YearMasterSid?: number;
}

export interface TrialBalanceResponse {
  success: boolean;
  message?: string;
  parameters: {
    CompanyMasterSid: number;
    BranchMasterSid?: number[];
    fromDate: string;
    toDate: string;
    GroupName?: string;
    SubGroupName?: string;
    showSubtotals: boolean;
  };
  items: TrialBalanceItem[];
  subtotals?: TrialBalanceSubtotal[];
  grandTotal: TrialBalanceGrandTotal;
  totalLedgers: number;
  generatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TrialBalanceService {
  private baseUrl = `${environment.apiUrl}accounts/trial-balance`;

  constructor(private http: HttpClient) {}

  /**
   * Generate trial balance report
   */
  generateTrialBalance(params: TrialBalanceQueryParams): Observable<TrialBalanceResponse> {
    let httpParams = new HttpParams()
      .set('CompanyMasterSid', params.CompanyMasterSid.toString())
      .set('fromDate', params.fromDate)
      .set('toDate', params.toDate);

    if (params.BranchMasterSid && params.BranchMasterSid.length > 0) {
      params.BranchMasterSid.forEach(branchId => {
        httpParams = httpParams.append('BranchMasterSid', branchId.toString());
      });
    }

    if (params.GroupName) {
      httpParams = httpParams.set('GroupName', params.GroupName);
    }

    if (params.SubGroupName) {
      httpParams = httpParams.set('SubGroupName', params.SubGroupName);
    }

    if (params.showSubtotals !== undefined) {
      httpParams = httpParams.set('showSubtotals', params.showSubtotals.toString());
    }

    if (params.YearMasterSid) {
      httpParams = httpParams.set('YearMasterSid', params.YearMasterSid.toString());
    }

    return this.http.get<TrialBalanceResponse>(`${this.baseUrl}/report`, { params: httpParams });
  }
}
