import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Add this import
import { environment } from '../../../../environments/environment';

export interface JournalVoucherDetail {
  VoucherDetailSid?: number;
  COAMasterSid: number;
  LedgerMasterSid?: number;
  CurrencyMasterSid: number;
  CurrencyCode?: string;
  ExchangeRate: number;
  Amount: number;
  LocalAmount: number;
  DrCr: 'D' | 'C';
  Narration?: string;
  DepartmentMasterSid?: number;
  ChargeMasterSid?: number;
  ChargeDescription?: string;
  HSNSAC?: string;
  MasterJobSid?: number;
  HouseJobSid?: number;
  TaxPercentage1?: number;
  TaxAmount1?: number;
  TaxPercentage2?: number;
  TaxAmount2?: number;
  CostCenterMasterSid?: number;
  ProfitCenterMasterSid?: number;
  isAutoTaxLine?: boolean;
}

export interface CreateJournalVoucherRequest {
  CompanyMasterSid: number;
  BranchMasterSid: number;
  VoucherDate: string;
  Narration?: string;
  Remarks?: string;
  Status?: string;
  details: JournalVoucherDetail[];
}

export interface UpdateJournalVoucherRequest {
  VoucherDate?: string;
  Narration?: string;
  Remarks?: string;
  Status?: string;
  details?: JournalVoucherDetail[];
}

export interface JournalVoucherResponse {
  VoucherHeaderSid: number;
  VoucherNumber: string;
  VoucherDate: Date;
  PostDate?: Date;
  PostStatus: string;
  Narration?: string;
  Remarks?: string;
  Status: string;
  Amount: number;
  LocalAmount: number;
  details: any[];
  DebitTotal: number;
  CreditTotal: number;
  IsBalanced: boolean;
}

export interface JournalVoucherListResponse {
  data: JournalVoucherResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Add this interface for the search API response
export interface JournalVoucherSearchResponse {
  status: boolean;
  data: {
    items: any[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JournalVoucherService {
  private baseUrl = `${environment.apiUrl}/accounts/journal-voucher`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new journal voucher (draft)
   */
  createJournalVoucher(payload: any) {
  return this.http.post<{ status: boolean; message: string; data: any }>('accounts/journal-voucher/create', payload).pipe(
    map((resp) => {
      return resp;
    })
  );
}


  /**
   * Update an existing journal voucher (unposted only)
   */
  updateJournalVoucherById(VoucherHeaderSid: number, payload: any) {
  return this.http.patch<{ status: boolean; data: any }>(`accounts/journal-voucher/update/${VoucherHeaderSid}`, payload).pipe(
    map((resp) => {
      return resp;
    })
  );
}


  /**
   * Get journal voucher by ID
   */
  getJournalVoucherById(VoucherHeaderSid: number) {
  return this.http.get<{ status: boolean; data: any }>(`accounts/journal-voucher/fetch/${VoucherHeaderSid}`).pipe(
    map((resp) => {
      return resp;
    })
  );
}


  /**
   * Get list of journal vouchers with filters
   */
  searchJournalVouchers(payload: any) {
  return this.http.post<{ status: boolean; data: any }>('accounts/journal-voucher/search-list', payload).pipe(
    map((resp) => {
      return resp;
    })
  );
}

getAllVoucher() {
    return this.http.get<{ status: boolean; data: any[] }>('accounts/journal-voucher').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  /**
   * Delete journal voucher (unposted only)
   */
  deleteJournalVoucherById(VoucherHeaderSid: number) {
  return this.http.delete<{ status: boolean; data: any }>(`accounts/journal-voucher/deleteVoucher/${VoucherHeaderSid}`).pipe(
    map((resp) => {
      return resp;
    })
  );
}


  /**
   * Validate journal voucher before posting
   */
  validateJournalVoucher(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/validate`, {});
  }

  /**
   * Post journal voucher to VoucherTransaction
   */
  postJournalVoucher(VoucherHeaderSid: number) {
  return this.http.post<{ status: boolean; data: any }>(`accounts/journal-voucher/post/${VoucherHeaderSid}`, {}).pipe(
    map((resp) => {
      return resp;
    })
  );
}

  /**
   * Get voucher transactions for a posted journal voucher
   */
  getVoucherTransactions(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/transactions`);
  }
}