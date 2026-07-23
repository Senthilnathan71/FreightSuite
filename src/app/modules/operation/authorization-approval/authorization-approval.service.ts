import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

/**
 * HTTP client for the Authorization Approval screen. URLs are relative — the
 * global http interceptor prepends environment.apiUrl and sends credentials.
 */
@Injectable({ providedIn: 'root' })
export class AuthorizationApprovalService {
  constructor(private http: HttpClient) {}

  /** Menus assigned to the logged-in user (approval dropdown). */
  getAvailableMenus(userMasterSid: number, companyMasterSid: number, branchMasterSid: number): Observable<any> {
    const params = new HttpParams()
      .set('CompanyMasterSid', String(companyMasterSid ?? ''))
      .set('BranchMasterSid', String(branchMasterSid ?? ''));
    return this.http
      .get(`authorization-approval/menus/${userMasterSid}`, { params })
      .pipe(map((resp: any) => resp));
  }

  /** Paginated pending documents across the user menus. */
  getPendingDocuments(payload: any): Observable<any> {
    return this.http.post('authorization-approval/pending', payload).pipe(map((resp: any) => resp));
  }

  /** Multi-level approval timeline for one document (View). */
  getApprovalDetails(
    menuMasterSid: number,
    documentSid: number,
    companyMasterSid?: number,
    branchMasterSid?: number,
    departmentMasterSid?: number,
  ): Observable<any> {
    let params = new HttpParams();
    if (companyMasterSid) params = params.set('CompanyMasterSid', String(companyMasterSid));
    if (branchMasterSid) params = params.set('BranchMasterSid', String(branchMasterSid));
    if (departmentMasterSid) params = params.set('DepartmentMasterSid', String(departmentMasterSid));
    return this.http
      .get(`authorization-approval/details/${menuMasterSid}/${documentSid}`, { params })
      .pipe(map((resp: any) => resp));
  }

  approve(payload: any): Observable<any> {
    return this.http.post('authorization-approval/approve', payload).pipe(map((resp: any) => resp));
  }

  reject(payload: any): Observable<any> {
    return this.http.post('authorization-approval/reject', payload).pipe(map((resp: any) => resp));
  }

  bulkApprove(payload: any): Observable<any> {
    return this.http.post('authorization-approval/bulk-approve', payload).pipe(map((resp: any) => resp));
  }

  bulkReject(payload: any): Observable<any> {
    return this.http.post('authorization-approval/bulk-reject', payload).pipe(map((resp: any) => resp));
  }
}
