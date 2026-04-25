import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SalesManagerFilters,
  SalespersonInfo,
  SalesManagerCounts,
  ScoreboardRow,
  WeeklyTrendPoint,
  ResponseTimeMetric,
  ActivityFeedItem,
  AtRiskAlert,
  AgingRow,
  MeetingsBoardData,
} from '../interfaces/sales-manager-dashboard.interfaces';

interface ApiResponse<T> {
  data: T;
  status: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class SalesManagerDashboardService {
  private baseUrl = 'dashboard/sales-manager';

  constructor(private http: HttpClient) {}

  getSalespersons(companyMasterSid: number, branchMasterSid: number): Observable<ApiResponse<SalespersonInfo[]>> {
    const params = new HttpParams()
      .set('companyMasterSid', companyMasterSid)
      .set('branchMasterSid', branchMasterSid);
    return this.http.get<ApiResponse<SalespersonInfo[]>>(`${this.baseUrl}/salespersons`, { params });
  }

  getCounts(filters: SalesManagerFilters): Observable<ApiResponse<SalesManagerCounts>> {
    return this.http.get<ApiResponse<SalesManagerCounts>>(`${this.baseUrl}/counts`, { params: this.buildParams(filters) });
  }

  getSectionData(sectionNumber: number, filters: SalesManagerFilters): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/section/${sectionNumber}`, { params: this.buildParams(filters) });
  }

  getScoreboard(filters: SalesManagerFilters): Observable<ApiResponse<ScoreboardRow[]>> {
    return this.http.get<ApiResponse<ScoreboardRow[]>>(`${this.baseUrl}/scoreboard`, { params: this.buildParams(filters) });
  }

  getWeeklyTrend(filters: SalesManagerFilters): Observable<ApiResponse<WeeklyTrendPoint[]>> {
    return this.http.get<ApiResponse<WeeklyTrendPoint[]>>(`${this.baseUrl}/weekly-trend`, { params: this.buildParams(filters) });
  }

  getResponseTimes(filters: SalesManagerFilters): Observable<ApiResponse<ResponseTimeMetric[]>> {
    return this.http.get<ApiResponse<ResponseTimeMetric[]>>(`${this.baseUrl}/response-times`, { params: this.buildParams(filters) });
  }

  getActivityFeed(filters: SalesManagerFilters): Observable<ApiResponse<ActivityFeedItem[]>> {
    return this.http.get<ApiResponse<ActivityFeedItem[]>>(`${this.baseUrl}/activity-feed`, { params: this.buildParams(filters) });
  }

  getAlerts(filters: SalesManagerFilters): Observable<ApiResponse<AtRiskAlert[]>> {
    return this.http.get<ApiResponse<AtRiskAlert[]>>(`${this.baseUrl}/alerts`, { params: this.buildParams(filters) });
  }

  getAgingAnalysis(filters: SalesManagerFilters): Observable<ApiResponse<AgingRow[]>> {
    return this.http.get<ApiResponse<AgingRow[]>>(`${this.baseUrl}/aging`, { params: this.buildParams(filters) });
  }

  getMeetingsBoard(filters: SalesManagerFilters): Observable<ApiResponse<MeetingsBoardData>> {
    return this.http.get<ApiResponse<MeetingsBoardData>>(`${this.baseUrl}/meetings-board`, { params: this.buildParams(filters) });
  }

  reassignLead(body: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/reassign-lead`, body);
  }

  bulkReassign(body: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/bulk-reassign`, body);
  }

  createMeeting(body: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/create-meeting`, body);
  }

  sendReminder(body: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/send-reminder`, body);
  }

  private buildParams(filters: SalesManagerFilters): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
