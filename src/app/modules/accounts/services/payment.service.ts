import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  CreatePaymentRequest,
  PaymentResponse,
  SearchVendorOutstandingRequest,
  VendorOutstandingInvoice,
  PaymentFilter,
  PaymentListItem,
  PaymentDetailView,
  TDSSetRate,
  UpdatePaymentRequest,
  ReversePaymentRequest,
  PaymentSummary,
  InstrumentMode,
} from '../models/payment.model';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { SearchParams } from 'src/app/shared/interfaces/pagination.interface';
import { ApiResponse, OutstandingInvoice, PaymentMode, SearchOutstandingRequest } from '../models/receipt.model';

/**
 * Payment Service
 * Handles all payment voucher HTTP operations
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'api/accounts/payment';

  constructor(
    private http: HttpClient,
    private appSettingsService: AppSettingsService
  ) {}


  /**
   * Helper: Get available payment modes
   * @returns List of payment modes
   */
  getPaymentModes(): { value: string; label: string }[] {
    return [
      { value: PaymentMode.CASH, label: 'Cash' },
      { value: PaymentMode.CHEQUE, label: 'Cheque' },
      { value: PaymentMode.NEFT, label: 'NEFT' },
      { value: PaymentMode.RTGS, label: 'RTGS' },
      { value: PaymentMode.IMPS, label: 'IMPS' },
      { value: PaymentMode.UPI, label: 'UPI' },
      { value: PaymentMode.CARD, label: 'Card' },
      { value: PaymentMode.ONLINE, label: 'Online' },
    ];
  }

  getInstrumentModes(): { value: string; label: string }[] {
    return [
      { value: InstrumentMode.Cheque, label: 'Cheque' },
      { value: InstrumentMode.DD, label: 'DD' },
      { value: InstrumentMode.IMPS, label: 'IMPS' },
      { value: InstrumentMode.NEFT, label: 'NEFT' },
      { value: InstrumentMode.TT, label: 'TT' },
      { value: InstrumentMode.RTGS, label: 'RTGS' },
      { value: InstrumentMode.Others, label: 'Others' },
    ];
  }

  /**
   * Create a new payment voucher
   *
   * @param request Payment creation request
   * @returns Payment response with voucher number and JV details
   */
  createPayment(request: any) {
    return this.http.post<PaymentResponse>(this.apiUrl, request).pipe(
      map((response: any) => {
        // Handle API response format
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError((error) => {
        console.error('Error creating payment:', error);
        this.appSettingsService.showError(
          error.error?.message || 'Failed to create payment voucher'
        );
        return throwError(() => error);
      })
    );
  }

  postPayment(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/post`, payload).pipe(
      map((response: any) => {
        return response;
      })
    );
  }

  /**
   * Search vendor outstanding invoices
   *
   * @param request Search criteria
   * @returns List of outstanding vendor invoices
   */
  searchVendorOutstanding(request: SearchVendorOutstandingRequest): Observable<VendorOutstandingInvoice[]> {
    return this.http.post<VendorOutstandingInvoice[]>(`${this.apiUrl}/search-outstanding`, request).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error searching vendor outstanding:', error);
        this.appSettingsService.showError(
          error.error?.message || 'Failed to search vendor outstanding'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Search outstanding invoices for receipt matching
   * @param searchRequest - Search criteria
   * @returns Observable of outstanding invoices
   */
  searchOutstandingInvoices(searchRequest: SearchOutstandingRequest): Observable<OutstandingInvoice[]> {
    return this.http
      .post<ApiResponse<OutstandingInvoice[]>>(`${this.apiUrl}/search-outstanding`, searchRequest)
      .pipe(
        tap((response) => {
          console.log('Outstanding invoices found:', response);
        }),
        map((response) => {
          if (!response.status) {
            throw new Error(response.message || 'Failed to search outstanding invoices');
          }
          return response.data;
        }),
        catchError((error) => this.handleError(error, 'searchOutstandingInvoices')),
      );
  }

  /**
   * Get payment voucher by ID
   *
   * @param id Voucher Header SID
   * @returns Payment details
   */
  getPaymentById(payload:any) {
    return this.http.post<PaymentDetailView>(`${this.apiUrl}/fetch`,payload).pipe(
      map((response: any) => {
        return response;
      })
    );
  }

  /**
   * Get list of payments with filters
   *
   * @param filter Filter criteria
   * @returns List of payments
   */
  getPayments(filter: PaymentFilter): Observable<PaymentListItem[]> {
    return this.http.post<any>(`${this.apiUrl}/search-list`, filter).pipe(
      map((response: any) => {
        if (response.status) {
          return response.data.map((item: any) => this.processPaymentListItem(item));
        }
        if (Array.isArray(response)) {
          return response.map((item: any) => this.processPaymentListItem(item));
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching payments:', error);
        this.appSettingsService.showError(
          error.error?.message || 'Failed to load payments'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Update payment voucher
   *
   * @param id Voucher Header SID
   * @param request Update data
   * @returns Updated payment
   */
  updatePaymentById(id: number, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/update/${id}`, payload).pipe(
      map((response : any)=>{
        return response;
      })
    );
  }

  /**
   * Reverse payment voucher
   *
   * @param request Reversal data
   * @returns Reversal voucher details
   */
  reversePayment(request: ReversePaymentRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reverse`, request).pipe(
      catchError((error) => {
        console.error('Error reversing payment:', error);
        this.appSettingsService.showError(
          error.error?.message || 'Failed to reverse payment'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete payment voucher
   *
   * @param id Voucher Header SID
   * @returns Deletion confirmation
   */
  deletePayment(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${id}`).pipe(
      map((response: any) => {
        return response;
      })
    );
  }

  /**
   * Get payment summary
   *
   * @param filter Filter criteria
   * @returns Payment summary
   */
  getPaymentSummary(filter: PaymentFilter): Observable<PaymentSummary> {
    const params = new HttpParams({ fromObject: filter as any });
    return this.http.get<PaymentSummary>(`${this.apiUrl}/summary`, { params }).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        return response;
      }),
      catchError((error) => {
        console.error('Error fetching payment summary:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get TDS Set Rates for dropdown
   *
   * @param companySid Company Master SID
   * @returns List of TDS Set Rates
   */
  getTDSSets(companySid: number): Observable<TDSSetRate[]> {
    // TODO: Replace with actual endpoint when TDS master API is ready
    return this.http.get<TDSSetRate[]>(`/api/masters/tds-set-rate?companySid=${companySid}`).pipe(
      map((response: any) => {
        if (response.data) {
          return response.data;
        }
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching TDS sets:', error);
        // Return empty array instead of error for optional data
        return [];
      })
    );
  }

  searchPayment(payload: SearchParams): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/search-list`, payload).pipe(
      map((response: any) => {
        return response;
      })
    );
  }

  /**
   * Calculate TDS amount
   *
   * @param taxableAmount Taxable amount
   * @param tdsPercentage TDS percentage
   * @returns TDS amount
   */
  calculateTDS(taxableAmount: number, tdsPercentage: number): number {
    if (!taxableAmount || !tdsPercentage) {
      return 0;
    }
    return Number((taxableAmount * tdsPercentage / 100).toFixed(2));
  }

  /**
   * Calculate local amount from currency amount
   *
   * @param currencyAmount Currency amount
   * @param exchangeRate Exchange rate
   * @returns Local amount
   */
  calculateLocalAmount(currencyAmount: number, exchangeRate: number): number {
    if (!currencyAmount || !exchangeRate) {
      return 0;
    }
    return Number((currencyAmount * exchangeRate).toFixed(2));
  }

  /**
   * Calculate tax amount
   *
   * @param taxableAmount Taxable amount
   * @param taxPercentage Tax percentage
   * @returns Tax amount
   */
  calculateTax(taxableAmount: number, taxPercentage: number): number {
    if (!taxableAmount || !taxPercentage) {
      return 0;
    }
    return Number((taxableAmount * taxPercentage / 100).toFixed(2));
  }

  /**
   * Validate payment amounts
   *
   * @param totalDr Total debit amount
   * @param totalCr Total credit amount
   * @param tolerance Tolerance for difference
   * @returns Validation result
   */
  validatePaymentAmounts(totalDr: number, totalCr: number, tolerance: number = 0.01): {
    isValid: boolean;
    difference: number;
    message?: string;
  } {
    const difference = Math.abs(totalDr - totalCr);

    if (difference > tolerance) {
      return {
        isValid: false,
        difference: difference,
        message: `Dr/Cr mismatch: Dr=${totalDr.toFixed(2)}, Cr=${totalCr.toFixed(2)}, Difference=${difference.toFixed(2)}`
      };
    }

    return {
      isValid: true,
      difference: difference
    };
  }

  /**
   * Format date for API
   *
   * @param date Date object or string
   * @returns Formatted date string (YYYY-MM-DD)
   */
  formatDateForAPI(date: Date | string): string {
    if (!date) {
      return '';
    }

    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Process payment data from API
   *
   * @param data Raw payment data
   * @returns Processed payment detail view
   */
  private processPaymentData(data: any): PaymentDetailView {
    return {
      VoucherHeaderSid: data.VoucherHeaderSid,
      VoucherNumber: data.VoucherNumber,
      VoucherDate: data.VoucherDate,
      CompanyName: data.CompanyMaster?.CompanyName || data.CompanyName,
      BranchName: data.BranchMaster?.BranchName || data.BranchName,
      VendorName: data.PartyName,
      PaidTo: data.PartyName,
      Address: data.Address,
      GSTNumber: data.GSTNumber,
      PaymentMode: data.InstrumentMode || 'Bank',
      BankName: data.BankName,
      CurrencyCode: data.CurrencyCode || 'INR',
      ExchangeRate: data.ExchangeRate,
      InstrumentMode: data.InstrumentMode,
      InstrumentNumber: data.InstrumentNumber,
      InstrumentDate: data.InstrumentDate,
      ClearanceDate: data.ClearanceDate,
      TotalAmount: this.calculateTotalAmount(data),
      TDSAmount: this.getTDSAmount(data),
      NetAmount: this.calculateNetAmount(data),
      Narration: data.Narration,
      Remarks: data.Remarks,
      CreatedBy: data.CreatedBy,
      CreatedOn: data.CreatedOn,
      Status: data.Status === 'A' ? 'Active' : data.Status === 'S' ? 'Suspended' : 'Reversed',
      details: this.processDetailLines(data.VoucherDetail || []),
      tdsDetails: this.processTDSDetails(data.VoucherTDS || []),
      matchedInvoices: this.processMatchedInvoices(data.voucherMatchings || []),
      interBranchJVs: data.InterBranchJVs || [],
      exchangeJV: data.ExchangeJV
    };
  }

  /**
   * Process payment list item
   *
   * @param item Raw payment item
   * @returns Processed payment list item
   */
  private processPaymentListItem(item: any): PaymentListItem {
    const totalAmount = this.calculateTotalAmount(item);
    const tdsAmount = this.getTDSAmount(item);

    return {
      VoucherHeaderSid: item.VoucherHeaderSid,
      VoucherNumber: item.VoucherNumber,
      VoucherDate: item.VoucherDate,
      VendorName: item.PartyName || 'N/A',
      BankName: item.BankName,
      PaymentMode: item.InstrumentMode || 'Bank',
      TotalAmount: totalAmount,
      TDSAmount: tdsAmount,
      NetAmount: totalAmount - tdsAmount,
      BranchName: item.BranchMaster?.BranchName || item.BranchName,
      CreatedBy: item.CreatedBy,
      Status: item.Status,
      StatusDisplay: item.Status === 'A' ? 'Active' : item.Status === 'S' ? 'Suspended' : 'Reversed'
    };
  }

  /**
   * Calculate total payment amount from details
   *
   * @param data Payment data
   * @returns Total amount
   */
  private calculateTotalAmount(data: any): number {
    if (data.TotalAmount) {
      return Number(data.TotalAmount);
    }

    if (data.VoucherDetail && data.VoucherDetail.length > 0) {
      return data.VoucherDetail
        .filter((d: any) => d.DrCr === 'D')
        .reduce((sum: number, d: any) => sum + Number(d.Amount || d.LocalAmount || 0), 0);
    }

    return 0;
  }

  /**
   * Get TDS amount from details
   *
   * @param data Payment data
   * @returns TDS amount
   */
  private getTDSAmount(data: any): number {
    if (data.TDSAmount) {
      return Number(data.TDSAmount);
    }

    if (data.VoucherTDS && data.VoucherTDS.length > 0) {
      return data.VoucherTDS.reduce((sum: number, tds: any) => sum + Number(tds.TDSAmount || 0), 0);
    }

    return 0;
  }

  /**
   * Calculate net payment amount
   *
   * @param data Payment data
   * @returns Net amount
   */
  private calculateNetAmount(data: any): number {
    const totalAmount = this.calculateTotalAmount(data);
    const tdsAmount = this.getTDSAmount(data);
    return totalAmount - tdsAmount;
  }

  /**
   * Process detail lines
   *
   * @param details Raw detail lines
   * @returns Processed detail lines
   */
  private processDetailLines(details: any[]): any[] {
    return details.map((detail: any, index: number) => ({
      Sno: detail.Sno || index + 1,
      LedgerName: detail.subledgerMaster?.SubledgerName || detail.LedgerName || 'N/A',
      BranchName: detail.BranchMaster?.BranchName || detail.BranchName || 'N/A',
      DrCr: detail.DrCr,
      CurrencyCode: detail.CurrencyCode || 'INR',
      ExchangeRate: Number(detail.ExchangeRate || 1),
      CurrencyAmount: Number(detail.CurrencyAmount || detail.Amount || 0),
      TaxableAmount: Number(detail.TaxableAmount || 0),
      TaxPercentage: Number(detail.TaxPercentage || 0),
      TaxAmount: Number(detail.TaxAmount || 0),
      LocalAmount: Number(detail.LocalAmount || detail.Amount || 0),
      Narration: detail.Narration || ''
    }));
  }

  /**
   * Process TDS details
   *
   * @param tdsDetails Raw TDS details
   * @returns Processed TDS details
   */
  private processTDSDetails(tdsDetails: any[]): any[] {
    return tdsDetails.map((tds: any) => ({
      ITSectionCode: tds.ITSectionCode,
      TDSCompanyType: tds.TDSCompanyType || 'Company',
      TDSPercentage: Number(tds.TDSRate || tds.TDSPercentage || 0),
      TaxableAmount: Number(tds.TaxableAmount || 0),
      TDSAmount: Number(tds.TDSAmount || 0),
      CertificateNumber: tds.CertificateNumber,
      Reason: tds.Reason
    }));
  }

  /**
   * Process matched invoices
   *
   * @param matchings Raw matching records
   * @returns Processed matched invoices
   */
  private processMatchedInvoices(matchings: any[]): any[] {
    return matchings.map((matching: any) => ({
      VoucherTransactionSid: matching.VoucherTransactionSid,
      InvoiceNumber: matching.VoucherNumber || 'N/A',
      InvoiceDate: matching.VoucherDate || '',
      OriginalAmount: Number(matching.OriginalAmount || 0),
      PreviouslyMatched: Number(matching.PreviouslyMatched || 0),
      MatchedAmount: Number(matching.Amount || matching.LocalAmount || 0),
      TDSAmount: Number(matching.TDSAmount || 0),
      OutstandingAmount: Number(matching.OutstandingAmount || 0)
    }));
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

}
