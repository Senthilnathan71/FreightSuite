import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ReportScheduleService {
  constructor(private http: HttpClient) {}

  getAll(companyId: number): Observable<any> {
    return this.http
      .get(`report-schedule?companyId=${companyId}`)
      .pipe(map((res: any) => res));
  }

  getById(id: number, companyId: number): Observable<any> {
    return this.http
      .get(`report-schedule/${id}?companyId=${companyId}`)
      .pipe(map((res: any) => res));
  }

  getAvailableReports(companyId: number): Observable<any> {
    return this.http
      .get(`report-schedule/available-reports?companyId=${companyId}`)
      .pipe(map((res: any) => res));
  }

  create(payload: any, username: string): Observable<any> {
    return this.http
      .post(`report-schedule?username=${encodeURIComponent(username)}`, payload)
      .pipe(map((res: any) => res));
  }

  update(id: number, payload: any, username: string): Observable<any> {
    return this.http
      .patch(`report-schedule/${id}?username=${encodeURIComponent(username)}`, payload)
      .pipe(map((res: any) => res));
  }

  delete(id: number, username: string): Observable<any> {
    return this.http
      .delete(`report-schedule/${id}?username=${encodeURIComponent(username)}`)
      .pipe(map((res: any) => res));
  }

  toggleActive(id: number, username: string): Observable<any> {
    return this.http
      .patch(`report-schedule/${id}/toggle-active?username=${encodeURIComponent(username)}`, {})
      .pipe(map((res: any) => res));
  }

  testSend(id: number, companyId: number): Observable<any> {
    return this.http
      .post(`report-schedule/${id}/test-send?companyId=${companyId}`, {})
      .pipe(map((res: any) => res));
  }
}
