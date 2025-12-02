import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface MailConfiguration {
  MailConfigurationMasterSid?: number;
  CompanyMasterSid: number;
  Sno: number;
  MailName: string;
  MenuMasterSid: number;
  MailSubject: string;
  MailBody: string;
  ToEmailidFrom?: string;
  CcEmailidFrom?: string;
  AttachmentRequire: string;
  AutoPopup: string;
  Status?: string;
  CreatedOn?: string;
  CreatedBy?: string;
  UpdatedOn?: string;
  UpdatedBy?: string;
}

export interface MailConfigSearchParams {
  search?: string;
  page?: number;
  pageSize?: number;
  CompanyMasterSid: number;
  sortColumn?: string;
  sortDirection?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailModuleService {

  constructor(private http: HttpClient) { }

  // Mail Configuration CRUD Operations

  searchMailConfiguration(params: any): Observable<any> {
    return this.http.post('mail-configuration/search-list', params).pipe(
      map((resp: any) => resp)
    );
  }

  getMailConfigurationById(id: number): Observable<any> {
    return this.http.get<any>(`mail-configuration/fetch/${id}`).pipe(
      map((resp) => resp)
    );
  }

  createMailConfiguration(payload: MailConfiguration): Observable<any> {
    return this.http.post('mail-configuration/create', payload).pipe(
      map((resp: any) => resp)
    );
  }

  updateMailConfiguration(id: number, payload: Partial<MailConfiguration>): Observable<any> {
    return this.http.patch(`mail-configuration/update/${id}`, payload).pipe(
      map((resp: any) => resp)
    );
  }

  deleteMailConfiguration(id: number): Observable<any> {
    return this.http.delete(`mail-configuration/delete/${id}`).pipe(
      map((resp: any) => resp)
    );
  }

  getAllByCompany(companyId: number): Observable<any> {
    return this.http.get(`mail-configuration/company/${companyId}`).pipe(
      map((resp: any) => resp)
    );
  }

  getAuditLogs(tableName: string, recordId?: string): Observable<any> {
    let url = `mail-configuration/audit-logs?tableName=${tableName}`;
    if (recordId) {
      url += `&recordId=${recordId}`;
    }
    return this.http.get<any>(url).pipe(
      map((resp) => resp)
    );
  }
}
