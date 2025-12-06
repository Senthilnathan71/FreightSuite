import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export type SummaryMode = 'Pending' | 'Processed' | 'All';
export type Stage =
  | 'RateRequest'
  | 'Quotation'
  | 'Booking'
  | 'LoadPlan'
  | 'MasterJob'
  | 'Job'
  | 'BL'
  | 'SI'
  | 'Invoice';
export type WorkStatus = 'Pending' | 'Processed';

export interface ResourceSummaryRow {
  userSid: number;
  userName: string;
  rateRequestCount: number;
  quotationCount: number;
  bookingCount: number;
  loadPlanCount: number;
  masterJobCount: number;
  jobCount: number;
  blCount: number;
  siCount: number;
  invoiceCount: number;
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
  documentationName: string;
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
  private readonly baseUrl = `${environment.apiUrl}crm/activity-allocation`;

  constructor(private http: HttpClient) {}

  getResourceSummary(mode: SummaryMode): Observable<ResourceSummaryRow[]> {
    const params = new HttpParams().set('mode', mode);
    return this.http
      .get<ResponseData<ResourceSummaryRow[]>>(
        `${this.baseUrl}/summary`,
        { params },
      )
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
  ): Observable<WorkloadDetailResponse> {
    const params = new HttpParams()
      .set('userSid', userSid)
      .set('stage', stage)
      .set('mode', mode);

    return this.http
      .get<ResponseData<WorkloadDetailResponse>>(
        `${this.baseUrl}/workload-details`,
        { params },
      )
      .pipe(
        map(res => ({
          data: res.data?.data || [],
          availableUsers: res.data?.availableUsers || [],
        })),
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
    const params = new HttpParams().set('mode', mode);
    return this.http
      .get<ResponseData<any>>(`${this.baseUrl}/report`, { params })
      .pipe(
        map(res => res.data),
        catchError(err => {
          console.error('Error generating report:', err);
          return throwError(() => err);
        }),
      );
  }
}
