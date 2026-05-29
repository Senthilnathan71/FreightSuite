import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardFollowupItem,
  PagedResult,
  SalesDashboardCounts,
  SalesDashboardData,
  SalesDashboardFilters,
} from '../interfaces/sales-dashboard.interfaces';

@Injectable({ providedIn: 'root' })
export class SalesDashboardService {
  private baseUrl = 'dashboard';

  constructor(private http: HttpClient) {}

  getSalesDashboardData(
    filters: SalesDashboardFilters & {
      companyMasterSid: number;
      branchMasterSid: number;
    },
  ): Observable<{ data: SalesDashboardData; status: boolean; message: string }> {
    return this.http.get<{
      data: SalesDashboardData;
      status: boolean;
      message: string;
    }>(`${this.baseUrl}/sales-dashboard`, { params: this.buildParams(filters) });
  }

  getSalesDashboardCounts(
    filters: SalesDashboardFilters & {
      companyMasterSid: number;
      branchMasterSid: number;
    },
  ): Observable<{ data: SalesDashboardCounts; status: boolean; message: string }> {
    return this.http.get<{
      data: SalesDashboardCounts;
      status: boolean;
      message: string;
    }>(`${this.baseUrl}/sales-dashboard/counts`, { params: this.buildParams(filters) });
  }

  getSectionData(
    sectionNumber: number,
    filters: SalesDashboardFilters & {
      companyMasterSid: number;
      branchMasterSid: number;
    },
  ): Observable<{ data: unknown; status: boolean; message: string }> {
    return this.http.get<{ data: unknown; status: boolean; message: string }>(
      `${this.baseUrl}/sales-dashboard/section/${sectionNumber}`,
      { params: this.buildParams(filters) },
    );
  }

  getSectionDataWithCompany(
    companyMasterSid: number,
    branchMasterSid: number,
    sectionNumber: number,
    filters: SalesDashboardFilters
  ): Observable<{ data: unknown; status: boolean; message: string }> {
    const params = this.buildParams({
      ...filters,
      companyMasterSid,
      branchMasterSid,
    });
    return this.http.get<{ data: unknown; status: boolean; message: string }>(
      `${this.baseUrl}/sales-dashboard/section/${sectionNumber}`,
      { params }
    );
  }

  private buildParams(filters: SalesDashboardFilters & {
    companyMasterSid: number;
    branchMasterSid: number;
  }): HttpParams {
    let params = new HttpParams()
      .set('companyMasterSid', filters.companyMasterSid)
      .set('branchMasterSid', filters.branchMasterSid);

    Object.entries(filters).forEach(([key, value]) => {
      if (value != null && key !== 'companyMasterSid' && key !== 'branchMasterSid') {
        params = params.set(key, String(value));
      }
    });

    return params;
  }

  getQuoteDataForBookingConversion(payload: {
    CompanyMasterSid: number,
    BranchMasterSid: number,
    QuoteHeaderSid: number,
    QuoteRouteSid?: number
  }): Observable<{ data: any; status: boolean; message: string }> {
    return this.http.post<{ data: any; status: boolean; message: string }>(
      `ff-quotation/get-quote-for-booking`,
      payload,
    );
  }

  validateCustomerForBooking(payload: {
    CustomerMasterSid: number;
  }): Observable<{ data: { valid: boolean; message: string; errorType: string | null }; status: boolean; message: string }> {
    return this.http.post<{ data: { valid: boolean; message: string; errorType: string | null }; status: boolean; message: string }>(
      `customer/validate-for-booking`,
      payload,
    );
  }

  getEnquiryDataForQuotationConversion(payload : {
    CompanyMasterSid: number,
    BranchMasterSid: number,
    EnquiryHeaderSid : number,
   }) : Observable<{ data: any; status: boolean; message: string }> {
    return this.http.post<{ data: any; status: boolean; message: string }>(
      `ff-quotation/get-enquiry-for-quote`,
      payload,
    );
  }

  getFunnelJourneys(
    filters: SalesDashboardFilters & {
      companyMasterSid: number;
      branchMasterSid: number;
    },
  ): Observable<{ data: any; status: boolean; message: string }> {
    return this.http.get<{ data: any; status: boolean; message: string }>(
      `${this.baseUrl}/sales-dashboard/funnel-journeys`,
      { params: this.buildParams(filters) },
    );
  }

  completeMeetingFollowup(meetingFollowupSid: number): Observable<{ data: any; status: boolean; message: string }> {
    return this.http.patch<{ data: any; status: boolean; message: string }>(
      `${this.baseUrl}/sales-dashboard/followup/complete/${meetingFollowupSid}`,
      {},
    );
  }

  getDashboardFollowups(params: {
    companyMasterSid: number;
    branchMasterSid: number;
    mode?: 'our' | 'created';
    menuMasterSid?: number;
    followUpStatus?: string;
    page?: number;
    pageSize?: number;
  }): Observable<{ data: PagedResult<DashboardFollowupItem>; status: boolean; message: string }> {
    let httpParams = new HttpParams()
      .set('companyMasterSid', params.companyMasterSid)
      .set('branchMasterSid', params.branchMasterSid);
    if (params.mode) httpParams = httpParams.set('mode', params.mode);
    if (params.menuMasterSid != null) httpParams = httpParams.set('menuMasterSid', params.menuMasterSid);
    if (params.followUpStatus) httpParams = httpParams.set('followUpStatus', params.followUpStatus);
    if (params.page != null) httpParams = httpParams.set('page', params.page);
    if (params.pageSize != null) httpParams = httpParams.set('pageSize', params.pageSize);
    return this.http.get<{ data: PagedResult<DashboardFollowupItem>; status: boolean; message: string }>(
      `${this.baseUrl}/my-followups`,
      { params: httpParams },
    );
  }

  completeDashboardFollowup(followupSid: number): Observable<{ data: any; status: boolean; message: string }> {
    return this.http.patch<{ data: any; status: boolean; message: string }>(
      `${this.baseUrl}/complete-followup/${followupSid}`,
      {},
    );
  }
}
