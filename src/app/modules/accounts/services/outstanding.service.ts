import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  VoucherOutstanding,
  CustomerOutstanding,
  ApiResponse,
} from '../models/outstanding.model';

/**
 * Service for retrieving outstanding balances for vouchers and customers
 * Provides methods to fetch outstanding amounts from the backend API
 */
@Injectable({
  providedIn: 'root',
})
export class OutstandingService {
  private readonly baseUrl = 'accounts/outstanding';

  constructor(private http: HttpClient) {}

  /**
   * Get outstanding amount for a specific voucher transaction
   * @param companySid - Company Master Sid
   * @param voucherTransactionSid - Voucher Transaction Sid
   * @returns Observable of voucher outstanding details
   */
  getVoucherOutstanding(companySid: number, voucherTransactionSid: number): Observable<VoucherOutstanding> {
    return this.http
      .get<ApiResponse<VoucherOutstanding>>(`${this.baseUrl}/voucher/${companySid}/${voucherTransactionSid}`)
      .pipe(
        tap((response) => {
          console.log('Voucher Outstanding Response:', response);
        }),
        map((response) => {
          if (!response.status) {
            throw new Error(response.message || 'Failed to fetch voucher outstanding');
          }
          return response.data;
        }),
        catchError((error) => this.handleError(error, 'getVoucherOutstanding')),
      );
  }

  /**
   * Get all outstanding vouchers for a customer
   * @param companySid - Company Master Sid
   * @param ledgerMasterSid - Customer's Ledger Master Sid (SubledgerMasterSid)
   * @returns Observable of customer outstanding details
   */
  getCustomerOutstanding(companySid: number, ledgerMasterSid: number): Observable<CustomerOutstanding> {
    return this.http
      .get<ApiResponse<CustomerOutstanding>>(`${this.baseUrl}/customer/${companySid}/${ledgerMasterSid}`)
      .pipe(
        tap((response) => {
          console.log('Customer Outstanding Response:', response);
        }),
        map((response) => {
          if (!response.status) {
            throw new Error(response.message || 'Failed to fetch customer outstanding');
          }
          return response.data;
        }),
        catchError((error) => this.handleError(error, 'getCustomerOutstanding')),
      );
  }

  /**
   * Get outstanding summary for company (optional - for future use)
   * @param companySid - Company Master Sid
   * @returns Observable of summary data
   */
  getOutstandingSummary(companySid: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/summary/${companySid}`).pipe(
      map((response) => {
        if (!response.status) {
          throw new Error(response.message || 'Failed to fetch outstanding summary');
        }
        return response.data;
      }),
      catchError((error) => this.handleError(error, 'getOutstandingSummary')),
    );
  }

  /**
   * Helper method to format currency display
   * @param amount - Amount to format
   * @param currencyCode - Currency code (e.g., 'USD')
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted currency string
   */
  formatCurrency(amount: number, currencyCode: string = 'USD', decimals: number = 2): string {
    return `${currencyCode} ${amount.toFixed(decimals)}`;
  }

  /**
   * Helper method to check if voucher has outstanding balance
   * @param voucher - Voucher outstanding object
   * @returns True if there is outstanding balance
   */
  hasOutstanding(voucher: VoucherOutstanding): boolean {
    return Math.abs(voucher.outstandingLocalAmount) > 0.01;
  }

  /**
   * Helper method to calculate outstanding percentage
   * @param original - Original amount
   * @param outstanding - Outstanding amount
   * @returns Percentage of outstanding (0-100)
   */
  calculateOutstandingPercentage(original: number, outstanding: number): number {
    if (original === 0) return 0;
    return Math.round((outstanding / original) * 100);
  }

  /**
   * Helper method to get outstanding status badge color
   * @param outstanding - Outstanding amount
   * @param original - Original amount
   * @returns Bootstrap badge class
   */
  getOutstandingBadgeClass(outstanding: number, original: number): string {
    const percentage = this.calculateOutstandingPercentage(original, outstanding);

    if (percentage === 0) {
      return 'badge-success'; // Fully paid
    } else if (percentage < 50) {
      return 'badge-info'; // Partially paid (< 50%)
    } else if (percentage < 100) {
      return 'badge-warning'; // Partially paid (>= 50%)
    } else {
      return 'badge-danger'; // Unpaid
    }
  }

  /**
   * Helper method to get outstanding status text
   * @param outstanding - Outstanding amount
   * @param original - Original amount
   * @returns Status text
   */
  getOutstandingStatus(outstanding: number, original: number): string {
    const percentage = this.calculateOutstandingPercentage(original, outstanding);

    if (percentage === 0) {
      return 'Fully Paid';
    } else if (percentage < 100) {
      return 'Partially Paid';
    } else {
      return 'Unpaid';
    }
  }

  /**
   * Centralized error handling
   * @param error - HTTP error response
   * @param operation - Name of the operation that failed
   * @returns Observable that throws the error
   */
  private handleError(error: HttpErrorResponse, operation: string): Observable<never> {
    console.error(`${operation} failed:`, error);

    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
      }
    }

    // Log to console for debugging
    console.error(`Operation: ${operation}`);
    console.error(`Error Message: ${errorMessage}`);
    console.error(`Full Error:`, error);

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error,
      operation,
    }));
  }

  /**
   * Helper: Formats date to YYYY-MM-DD string
   * @param date - Date object or string
   * @returns Formatted date string
   */
  formatDate(date: Date | string): string {
    if (!date) {
      return new Date().toISOString().split('T')[0];
    }
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }
}
