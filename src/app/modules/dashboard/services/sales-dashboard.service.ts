import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
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
}
