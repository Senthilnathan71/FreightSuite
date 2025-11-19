import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ReportCard {
  ReportMasterSid: number;
  ReportName: string;
  ReportDisplayName: string;
  ReportMenuSid: number;
  ReportFormat: string;
  ReportType: string;
  ReportExcludedCompany?: number[];
  ReportMasterDetail: ReportParameter[];
}

export interface ReportParameter {
  ReportMasterDetailSid: number;
  ParameterName: string;
  ParameterDisplayName: string;
  ParameterFieldType: 'DATE' | 'DROPDOWN' | 'NUMBER' | 'TEXT' | 'YEAR';
  DropDownValue?: any[];
  ParameterQuery?: string;
  IsMandatory: boolean;
  ReportMasterSid: number;
  Status: string;
}

export interface ReportGenerateResponse {
  success: boolean;
  data: any[];
  reportName: string;
  reportDisplayName: string;
  columns?: string[];
  totalRecords?: number;
}

export interface ExportReportParams {
  format: 'EXCEL' | 'PDF' | 'CSV';
  parameters: any;
  reportDisplayName: string;
}

export interface EmailReportParams {
  email: string;
  cc?: string;
  subject: string;
  message: string;
  format: 'EXCEL' | 'PDF' | 'CSV';
  parameters: any;
}

interface ApiResponse<T> {
  status: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all Accounts reports available for a specific company
   */
  getAccountsReports(companyId: number): Observable<ReportCard[]> {
    return this.http.get<ApiResponse<ReportCard[]>>(
      `${this.baseUrl}accounts/reports`,
      { params: new HttpParams().set('companyId', companyId.toString()) }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get all Operation reports available for a specific company
   */
  getOperationReports(companyId: number): Observable<ReportCard[]> {
    return this.http.get<ApiResponse<ReportCard[]>>(
      `${this.baseUrl}operation/reports`,
      { params: new HttpParams().set('companyId', companyId.toString()) }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get parameters for a specific report
   */
  getReportParameters(module: 'accounts' | 'operation', reportName: string): Observable<ReportParameter[]> {
    return this.http.get<ApiResponse<ReportParameter[]>>(
      `${this.baseUrl}/${module}/reports/${reportName}/parameters`
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Generate report data
   */
  generateReport(
    module: 'accounts' | 'operation',
    reportName: string,
    parameters: any
  ): Observable<ReportGenerateResponse> {
    return this.http.post<ApiResponse<ReportGenerateResponse>>(
      `${this.baseUrl}${module}/reports/${reportName}/generate`,
      parameters
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Export report to specified format
   */
  exportReport(
    module: 'accounts' | 'operation',
    reportName: string,
    exportParams: ExportReportParams
  ): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/${module}/reports/${reportName}/export`,
      exportParams,
      { responseType: 'blob' }
    );
  }

  /**
   * Email report to recipients
   */
  emailReport(
    module: 'accounts' | 'operation',
    reportName: string,
    emailParams: EmailReportParams
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/${module}/reports/${reportName}/email`,
      emailParams
    );
  }

  /**
   * Get all reports for admin management
   */
  getAllReports(): Observable<ReportCard[]> {
    return this.http.get<ApiResponse<ReportCard[]>>(`${this.baseUrl}report-master`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get single report by ID for admin
   */
  getReportById(reportId: number): Observable<ReportCard> {
    return this.http.get<ApiResponse<ReportCard>>(`${this.baseUrl}report-master/fetch/${reportId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Create new report (admin)
   */
  createReport(reportData: any): Observable<ReportCard> {
    return this.http.post<ApiResponse<ReportCard>>(`${this.baseUrl}report-master/create`, reportData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Update existing report (admin)
   */
  updateReport(reportId: number, reportData: any): Observable<ReportCard> {
    return this.http.patch<ApiResponse<ReportCard>>(`${this.baseUrl}report-master/update/${reportId}`, reportData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Delete report (admin)
   */
  deleteReport(reportId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}report-master/delete/${reportId}`);
  }

  /**
   * Get parameters for a report (admin)
   */
  getReportParametersById(reportId: number): Observable<ReportParameter[]> {
    return this.http.get<ApiResponse<ReportParameter[]>>(`${this.baseUrl}report-master/${reportId}/parameters`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Add parameter to report (admin)
   */
  addReportParameter(reportId: number, parameterData: any): Observable<ReportParameter> {
    return this.http.post<ApiResponse<ReportParameter>>(
      `${this.baseUrl}report-master/${reportId}/parameters`,
      parameterData
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Update report parameter (admin)
   */
  updateReportParameter(parameterId: number, parameterData: any): Observable<ReportParameter> {
    return this.http.patch<ApiResponse<ReportParameter>>(
      `${this.baseUrl}report-master/parameters/${parameterId}`,
      parameterData
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Delete report parameter (admin)
   */
  deleteReportParameter(parameterId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}report-master/parameters/${parameterId}`);
  }

  /**
   * Execute parameter query to get dynamic dropdown options
   */
  executeParameterQuery(
    module: 'accounts' | 'operation',
    parameterId: number,
    context: { companyId?: number; branchId?: number }
  ): Observable<Array<{ value: any; label: string }>> {
    return this.http.post<ApiResponse<Array<{ value: any; label: string }>>>(
      `${this.baseUrl}${module}/reports/parameters/${parameterId}/execute-query`,
      context
    ).pipe(
      map(response => response.data)
    );
  }
}
