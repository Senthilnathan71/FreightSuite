import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  SalesDashboardData,
  SalesDashboardCounts,
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
    let params = new HttpParams()
      .set('companyMasterSid', filters.companyMasterSid);

    if (filters.branchMasterSid != null)
      params = params.set('branchMasterSid', filters.branchMasterSid);
    if (filters.salespersonId)
      params = params.set('salespersonId', filters.salespersonId);
    if (filters.salespersonEmail)
      params = params.set('salespersonEmail', filters.salespersonEmail);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);

    return this.http.get<{
      data: SalesDashboardData;
      status: boolean;
      message: string;
    }>(`${this.baseUrl}/sales-dashboard`, { params });
  }

  getSalesDashboardCounts(
    filters: SalesDashboardFilters & {
      companyMasterSid: number;
      branchMasterSid: number;
    },
  ): Observable<{ data: SalesDashboardCounts; status: boolean; message: string }> {
    let params = new HttpParams()
      .set('companyMasterSid', filters.companyMasterSid);

    if (filters.branchMasterSid != null)
      params = params.set('branchMasterSid', filters.branchMasterSid);
    if (filters.salespersonId)
      params = params.set('salespersonId', filters.salespersonId);
    if (filters.salespersonEmail)
      params = params.set('salespersonEmail', filters.salespersonEmail);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);

    return this.http.get<{
      data: SalesDashboardCounts;
      status: boolean;
      message: string;
    }>(`${this.baseUrl}/sales-dashboard/counts`, { params });
  }

  getSectionData(
    sectionNumber: number,
    filters: SalesDashboardFilters & {
      companyMasterSid: number;
      branchMasterSid: number;
    },
  ): Observable<any> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) params = params.set(key, String(value));
    });
    return this.http.get(
      `${this.baseUrl}/sales-dashboard/section/${sectionNumber}`,
      { params },
    );
  }
}
