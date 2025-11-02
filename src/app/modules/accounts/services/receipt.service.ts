import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  CreateReceiptRequest,
  ReceiptResponse,
  SearchOutstandingRequest,
  OutstandingInvoice,
  ReceiptFilter,
  ReceiptListItem,
  UpdateReceiptRequest,
  ReverseReceiptRequest,
  ApiResponse,
  ReceiptSummary,
  PaymentMode,
} from '../models/receipt.model';
import { OutstandingService } from './outstanding.service';

/**
 * Receipt Voucher Service
 * Handles all receipt-related HTTP operations
 * Integrates with backend API at /api/accounts/receipt
 */
@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  private readonly baseUrl = '/api/accounts/receipt';

  constructor(
    private http: HttpClient,
    private outstandingService: OutstandingService, // REUSE existing service
  ) {}

  /**
   * Create new receipt voucher
   * @param createRequest - Receipt creation data
   * @returns Observable of created receipt
   */
  createReceipt(createRequest: CreateReceiptRequest): Observable<ReceiptResponse> {
    return this.http
      .post<ApiResponse<ReceiptResponse>>(this.baseUrl, createRequest)
      .pipe(
        tap((response) => {
          console.log('Receipt created:', response);
        }),
        map((response) => {
          if (!response.status) {
            throw new Error(response.message || 'Failed to create receipt');
          }
          return response.data;
        }),
        catchError((error) => this.handleError(error, 'createReceipt')),
      );
  }

  /**
   * Search outstanding invoices for receipt matching
   * @param searchRequest - Search criteria
   * @returns Observable of outstanding invoices
   */
  searchOutstandingInvoices(searchRequest: SearchOutstandingRequest): Observable<OutstandingInvoice[]> {
    return this.http
      .post<ApiResponse<OutstandingInvoice[]>>(`${this.baseUrl}/search-outstanding`, searchRequest)
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
   * Get customer outstanding invoices (convenience method)
   * REUSES existing OutstandingService
   * @param companySid - Company Sid
   * @param customerSid - Customer Ledger Master Sid
   * @returns Observable of outstanding invoices
   */
  getCustomerOutstanding(companySid: number, customerSid: number): Observable<OutstandingInvoice[]> {
    // Option 1: Use the new receipt API endpoint
    return this.http
      .get<ApiResponse<OutstandingInvoice[]>>(`${this.baseUrl}/outstanding/${companySid}/${customerSid}`)
      .pipe(
        map((response) => {
          if (!response.status) {
            throw new Error(response.message || 'Failed to get customer outstanding');
          }
          return response.data;
        }),
        catchError((error) => this.handleError(error, 'getCustomerOutstanding')),
      );

    // Option 2: Use existing OutstandingService and map the response
    // return this.outstandingService.getCustomerOutstanding(companySid, customerSid).pipe(
    //   map((customerOutstanding) => {
    //     return customerOutstanding.transactions.map((txn) => ({
    //       VoucherTransactionSid: txn.voucherTransactionSid,
    //       VoucherHeaderSid: 0,
    //       VoucherNumber: txn.voucherNumber,
    //       VoucherDate: txn.voucherDate,
    //       VoucherType: txn.voucherType,
    //       LedgerMasterSid: customerOutstanding.ledgerMasterSid,
    //       CustomerName: customerOutstanding.customerName || '',
    //       OriginalAmount: txn.originalLocalAmount,
    //       OriginalCurrencyAmount: txn.originalCurrencyAmount,
    //       MatchedAmount: txn.matchedLocalAmount,
    //       MatchedCurrencyAmount: txn.matchedCurrencyAmount,
    //       OutstandingAmount: txn.outstandingLocalAmount,
    //       OutstandingCurrencyAmount: txn.outstandingCurrencyAmount,
    //       CurrencyCode: txn.currencyCode,
    //       DrCr: txn.drCr,
    //       ChargeDescription: txn.chargeDescription,
    //     }));
    //   })
    // );
  }

  /**
   * Get receipt by ID
   * @param voucherHeaderSid - Receipt voucher header Sid
   * @returns Observable of receipt details
   */
  getReceiptById(voucherHeaderSid: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${voucherHeaderSid}`).pipe(
      tap((response) => {
        console.log('Receipt details:', response);
      }),
      map((response) => {
        if (!response.status) {
          throw new Error(response.message || 'Failed to get receipt');
        }
        return response.data;
      }),
      catchError((error) => this.handleError(error, 'getReceiptById')),
    );
  }

  /**
   * Get receipt by voucher number
   * @param companySid - Company Sid
   * @param voucherNumber - Voucher number (e.g., RV2511001)
   * @returns Observable of receipt details
   */
  getReceiptByNumber(companySid: number, voucherNumber: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/by-number/${companySid}/${voucherNumber}`).pipe(
      map((response) => {
        if (!response.status) {
          throw new Error(response.message || 'Receipt not found');
        }
        return response.data;
      }),
      catchError((error) => this.handleError(error, 'getReceiptByNumber')),
    );
  }

  /**
   * Get list of receipts with filters
   * @param filter - Filter criteria
   * @returns Observable of receipt list
   */
  getReceipts(filter: ReceiptFilter): Observable<ReceiptListItem[]> {
    let params = new HttpParams();

    if (filter.CompanyMasterSid) {
      params = params.set('CompanyMasterSid', filter.CompanyMasterSid.toString());
    }
    if (filter.BranchMasterSid) {
      params = params.set('BranchMasterSid', filter.BranchMasterSid.toString());
    }
    if (filter.LedgerMasterSid) {
      params = params.set('LedgerMasterSid', filter.LedgerMasterSid.toString());
    }
    if (filter.DateFrom) {
      params = params.set('DateFrom', filter.DateFrom);
    }
    if (filter.DateTo) {
      params = params.set('DateTo', filter.DateTo);
    }
    if (filter.PaymentMode) {
      params = params.set('PaymentMode', filter.PaymentMode);
    }
    if (filter.VoucherNumber) {
      params = params.set('VoucherNumber', filter.VoucherNumber);
    }
    if (filter.IncludeInterBranch !== undefined) {
      params = params.set('IncludeInterBranch', filter.IncludeInterBranch.toString());
    }

    return this.http.get<ApiResponse<ReceiptListItem[]>>(this.baseUrl, { params }).pipe(
      tap((response) => {
        console.log('Receipts retrieved:', response);
      }),
      map((response) => {
        if (!response.status) {
          throw new Error(response.message || 'Failed to get receipts');
        }
        return response.data;
      }),
      catchError((error) => this.handleError(error, 'getReceipts')),
    );
  }

  /**
   * Update receipt
   * @param voucherHeaderSid - Receipt Sid
   * @param updateRequest - Update data
   * @returns Observable of updated receipt
   */
  updateReceipt(voucherHeaderSid: number, updateRequest: UpdateReceiptRequest): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/${voucherHeaderSid}`, updateRequest).pipe(
      tap((response) => {
        console.log('Receipt updated:', response);
      }),
      map((response) => {
        if (!response.status) {
          throw new Error(response.message || 'Failed to update receipt');
        }
        return response.data;
      }),
      catchError((error) => this.handleError(error, 'updateReceipt')),
    );
  }

  /**
   * Reverse receipt
   * @param voucherHeaderSid - Receipt Sid
   * @param reverseRequest - Reversal data
   * @returns Observable of reversal result
   */
  reverseReceipt(voucherHeaderSid: number, reverseRequest: ReverseReceiptRequest): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${voucherHeaderSid}/reverse`, reverseRequest).pipe(
      tap((response) => {
        console.log('Receipt reversed:', response);
      }),
      map((response) => {
        if (!response.status) {
          throw new Error(response.message || 'Failed to reverse receipt');
        }
        return response.data;
      }),
      catchError((error) => this.handleError(error, 'reverseReceipt')),
    );
  }

  /**
   * Get receipt summary/statistics
   * @param companySid - Company Sid
   * @param branchSid - Branch Sid (optional)
   * @param dateFrom - Start date (optional)
   * @param dateTo - End date (optional)
   * @returns Observable of receipt summary
   */
  getReceiptSummary(
    companySid: number,
    branchSid?: number,
    dateFrom?: string,
    dateTo?: string,
  ): Observable<ReceiptSummary> {
    let params = new HttpParams();

    if (branchSid) {
      params = params.set('BranchMasterSid', branchSid.toString());
    }
    if (dateFrom) {
      params = params.set('DateFrom', dateFrom);
    }
    if (dateTo) {
      params = params.set('DateTo', dateTo);
    }

    return this.http.get<ApiResponse<ReceiptSummary>>(`${this.baseUrl}/summary/${companySid}`, { params }).pipe(
      map((response) => {
        if (!response.status) {
          throw new Error(response.message || 'Failed to get receipt summary');
        }
        return response.data;
      }),
      catchError((error) => this.handleError(error, 'getReceiptSummary')),
    );
  }

  /**
   * Helper: Calculate TDS amount
   * @param amount - Taxable amount
   * @param percentage - TDS percentage
   * @returns Calculated TDS amount
   */
  calculateTDS(amount: number, percentage: number): number {
    return Math.round((amount * percentage) / 100 * 100) / 100; // 2 decimal precision
  }

  /**
   * Helper: Calculate net receipt amount (Total - TDS)
   * @param totalAmount - Total receipt amount
   * @param tdsAmount - TDS deducted
   * @returns Net amount
   */
  calculateNetAmount(totalAmount: number, tdsAmount: number): number {
    return Math.round((totalAmount - tdsAmount) * 100) / 100;
  }

  /**
   * Helper: Validate receipt amounts
   * @param totalAmount - Total amount
   * @param selectedInvoices - Selected invoices to match
   * @param advanceAmount - Advance amount
   * @returns Validation result
   */
  validateReceiptAmounts(
    totalAmount: number,
    selectedInvoices: OutstandingInvoice[],
    advanceAmount: number,
  ): { valid: boolean; message: string } {
    const totalInvoiceAmount = selectedInvoices.reduce((sum, inv) => sum + (inv.amountToApply || 0), 0);
    const totalApplied = totalInvoiceAmount + advanceAmount;

    if (Math.abs(totalApplied - totalAmount) > 0.01) {
      return {
        valid: false,
        message: `Total applied amount (${totalApplied.toFixed(2)}) does not match receipt amount (${totalAmount.toFixed(2)})`,
      };
    }

    // Check individual invoice outstanding
    for (const invoice of selectedInvoices) {
      if ((invoice.amountToApply || 0) > invoice.OutstandingAmount) {
        return {
          valid: false,
          message: `Amount applied to invoice ${invoice.VoucherNumber} (${invoice.amountToApply}) exceeds outstanding (${invoice.OutstandingAmount})`,
        };
      }
    }

    return { valid: true, message: 'Valid' };
  }

  /**
   * Helper: Get payment mode display name
   * @param mode - Payment mode code
   * @returns Display name
   */
  getPaymentModeDisplay(mode: string): string {
    const modeMap: { [key: string]: string } = {
      Cash: 'Cash',
      Cheque: 'Cheque',
      NEFT: 'NEFT (Bank Transfer)',
      RTGS: 'RTGS (Bank Transfer)',
      IMPS: 'IMPS (Instant Transfer)',
      UPI: 'UPI Payment',
      Card: 'Card Payment',
      Online: 'Online Payment',
    };

    return modeMap[mode] || mode;
  }

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

  /**
   * Helper: Format currency display
   * @param amount - Amount to format
   * @param currencyCode - Currency code (default: INR)
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted currency string
   */
  formatCurrency(amount: number, currencyCode: string = 'INR', decimals: number = 2): string {
    return `${currencyCode} ${amount.toFixed(decimals)}`;
  }

  /**
   * Helper: Format date for API
   * @param date - Date object or string
   * @returns YYYY-MM-DD formatted string
   */
  formatDateForAPI(date: Date | string): string {
    if (!date) {
      return new Date().toISOString().split('T')[0];
    }
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
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
