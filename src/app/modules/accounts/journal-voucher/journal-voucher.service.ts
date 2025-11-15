import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class JournalVoucherService {
  private baseUrl = `${environment.apiUrl}/accounts/journal-voucher`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new journal voucher (draft)
   */
  createJournalVoucher(request: CreateJournalVoucherRequest): Observable<JournalVoucherResponse> {
    return this.http.post<JournalVoucherResponse>(this.baseUrl, request);
  }

  /**
   * Update an existing journal voucher (unposted only)
   */
  updateJournalVoucher(id: number, request: UpdateJournalVoucherRequest, companyMasterSid: number, branchMasterSid: number): Observable<JournalVoucherResponse> {
    const params = new HttpParams()
      .set('CompanyMasterSid', companyMasterSid.toString())
      .set('BranchMasterSid', branchMasterSid.toString());
    return this.http.put<JournalVoucherResponse>(`${this.baseUrl}/${id}`, request, { params });
  }

  /**
   * Get journal voucher by ID
   */
  getJournalVoucherById(id: number, companyMasterSid: number, branchMasterSid: number): Observable<JournalVoucherResponse> {
    const params = new HttpParams()
      .set('CompanyMasterSid', companyMasterSid.toString())
      .set('BranchMasterSid', branchMasterSid.toString());
    return this.http.get<JournalVoucherResponse>(`${this.baseUrl}/${id}`, { params });
  }

  /**
   * Get list of journal vouchers with filters
   */
  searchJournalVouchers(params: {
    CompanyMasterSid: number;
    BranchMasterSid: number;
    page?: number;
    limit?: number;
    voucherNumber?: string;
    fromDate?: string;
    toDate?: string;
    postStatus?: 'U' | 'P';
    searchTerm?: string;
  }): Observable<JournalVoucherListResponse> {
    let httpParams = new HttpParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });

    return this.http.get<JournalVoucherListResponse>(`${this.baseUrl}/list`, { params: httpParams });
  }

  /**
   * Delete journal voucher (unposted only)
   */
  deleteJournalVoucher(id: number, companyMasterSid: number, branchMasterSid: number): Observable<{ message: string }> {
    const params = new HttpParams()
      .set('CompanyMasterSid', companyMasterSid.toString())
      .set('BranchMasterSid', branchMasterSid.toString());
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`, { params });
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
  postJournalVoucher(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/post`, {});
  }

  /**
   * Get voucher transactions for a posted journal voucher
   */
  getVoucherTransactions(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/transactions`);
  }
}
