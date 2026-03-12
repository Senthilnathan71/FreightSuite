import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";

export interface CreditLimitRequest {
  companyMasterSid: number;
  customerMasterSid: number;
  branchMasterSid: number;
  departmentMasterSid?: number;
  customerBranchSid?: number;
}

export interface OutstandingRequest {
  customerMasterSid: number;
  companyMasterSid: number;
  masterJobSid?: number;
  houseJobSid?: number;
}

export interface ValidateCreditRequest {
  CompanyMasterSid: number;
  BranchMasterSid: number;
  CustomerMasterSid: number;
  CustomerBranchSid?: number;
  DocumentDate : string;
  // Allow forwards-compatible fields without breaking compilation.
  // [key: string]: any;
}


@Injectable({ providedIn: 'root' })
export class CreditValidationApiService {
  private baseUrl = 'credit-request';

  constructor(private http: HttpClient) {}

  // Get credit limit
  getCreditLimit(request: CreditLimitRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/credit-limit`, request)
      .pipe(map(response => response.data));
  }

  // Get outstanding
  getOutstanding(request: OutstandingRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/outstanding`, request)
      .pipe(map(response => response.data));
  }

  // Get outstanding by job
  getOutstandingByJob(customerMasterSid: number, companyMasterSid: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/outstanding-by-job`, {
      customerMasterSid,
      companyMasterSid
    }).pipe(map(response => response.data));
  }

  // Validate credit
  validateCredit(request: ValidateCreditRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/validate-bldo`, request)
      .pipe(map(response => response));
  }

  // Get credit summary
  getCreditSummary(request: {
    companyMasterSid: number;
    customerMasterSid: number;
    branchMasterSid: number;
    departmentMasterSid?: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/credit-summary`, request)
      .pipe(map(response => response.data));
  }

  // Get customer type
  getCustomerType(customerMasterSid: number): Observable<string> {
    return this.http.post<any>(`${this.baseUrl}/customer-type`, {
      customerMasterSid
    }).pipe(map(response => response.data.type));
  }

  // Check payment status
  checkPaymentStatus(masterJobSid?: number, houseJobSid?: number): Observable<boolean> {
    return this.http.post<any>(`${this.baseUrl}/payment-status`, {
      masterJobSid,
      houseJobSid
    }).pipe(map(response => response.data.isPaid));
  }
}
