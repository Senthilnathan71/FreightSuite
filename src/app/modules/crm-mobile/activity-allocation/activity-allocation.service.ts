import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

export type SummaryMode = 'Pending' | 'Processed' | 'All';
export type Stage =
  | 'RateRequest'
  | 'Quotation'
  | 'Booking'
  | 'LoadPlan'
  | 'MasterJob';
export type WorkStatus = 'Pending' | 'Processed';

export interface ResourceSummaryRow {
  userSid: number;
  userName: string;
  rateRequestCount: number;
  quotationCount: number;
  bookingCount: number;
  loadPlanCount: number;
  masterJobCount: number;
}

export interface WorkloadRow {
  activityId: number;
  userSid: number;
  userName: string;
  stage: Stage;
  status: WorkStatus;
  quotationNo: string;
  bookingNo: string;
  customerName: string;
  salesPersonName: string;
  customerServiceName: string;
  customerServiceSid?: number;
  documentationName: string;
  documentationSid?: number;
  jobStatus?: string;
  etd: string;
  createdOn: string;
  updatedOn: string;
}

export interface AllocateUser {
  userSid: number;
  userName: string;
}

export interface WorkloadDetailResponse {
  data: WorkloadRow[];
  availableUsers: AllocateUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AllocateApiResponse {
  success: boolean;
  message: string;
}

export interface ResponseData<T> {
  status: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityAllocationService {
  private readonly baseUrl = `${environment.apiUrl}activity-allocation`;

  constructor(
    private http: HttpClient,
    private appSettingService: AppSettingsService,
  ) {}

  private getCompanyId(): number | undefined {
    return this.appSettingService.getCurrentCompanyInfo()?.CompanyMasterSid;
  }

  getResourceSummary(mode: SummaryMode): Observable<ResourceSummaryRow[]> {
    return this.http
      .post<ResponseData<ResourceSummaryRow[]>>(`${this.baseUrl}/summary`, { mode, companyId: this.getCompanyId() })
      .pipe(
        map(res => {
          if (!res.data || !Array.isArray(res.data)) {
            console.warn('API returned non-array data:', res.data);
            return [];
          }
          return res.data;
        }),
        catchError(err => {
          console.error('Error fetching resource summary:', err);
          return throwError(() => err);
        }),
      );
  }

  getWorkloadDetails(
    userSid: number,
    stage: Stage,
    mode: SummaryMode,
    page: number = 1,
    limit: number = 100,
  ): Observable<WorkloadDetailResponse> {
    return this.http
      .post<ResponseData<WorkloadDetailResponse>>(
        `${this.baseUrl}/workload-details`,
        { userSid, stage, mode, page, limit, companyId: this.getCompanyId() },
      )
      .pipe(
        map(res => {
          const d: any = res.data || {};
          return {
            data: d.data || [],
            availableUsers: d.availableUsers || [],
            total: d.total ?? 0,
            page: d.page ?? page,
            limit: d.limit ?? limit,
            totalPages: d.totalPages ?? 1,
          };
        }),
        catchError(err => {
          console.error('Error fetching workload details:', err);
          return throwError(() => err);
        }),
      );
  }

  allocate(
    activityId: number,
    allocateToUserSid?: number,
  ): Observable<AllocateApiResponse> {
    const body: any = { activitySid: activityId };
    if (allocateToUserSid) {
      body.userSid = allocateToUserSid;
    }

    return this.http
      .patch<ResponseData<any>>(
        `${this.baseUrl}/allocation/${activityId}`,
        body,
      )
      .pipe(
        map(res => ({
          success: res.status,
          message: res.message,
        })),
        catchError(err => {
          console.error('Error allocating activity:', err);
          return throwError(() => err);
        }),
      );
  }

  generateReport(mode: SummaryMode): Observable<any> {
    return this.http
      .post<ResponseData<any>>(`${this.baseUrl}/report`, { mode, companyId: this.getCompanyId() })
      .pipe(
        map(res => res.data),
        catchError(err => {
          console.error('Error generating report:', err);
          return throwError(() => err);
        }),
      );
  }

  updateCSPerson(activityId: number, csUserSid: number, stage: Stage): Observable<AllocateApiResponse> {
    return this.http
      .patch<ResponseData<any>>(`${this.baseUrl}/cs-person/${activityId}`, { csUserSid, stage })
      .pipe(
        map(res => ({
          success: res.status,
          message: res.message,
        })),
        catchError(err => {
          console.error('Error updating CS person:', err);
          return throwError(() => err);
        }),
      );
  }
}
