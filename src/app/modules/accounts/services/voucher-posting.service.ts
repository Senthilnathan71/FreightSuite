import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, timer } from 'rxjs';
import { map, catchError, retry, retryWhen, mergeMap, finalize, tap } from 'rxjs/operators';
import {
  VoucherHeader,
  VoucherDetail,
  VoucherLine,
  TaxSummary,
  PostVoucherRequest,
  PostVoucherResponse,
  ValidationResult,
  ValidationError,
  DraftVoucherResponse,
  ApiResponse,
  VoucherTransaction,
  RetryOptions,
} from '../models/voucher-posting.model';

/**
 * Service for handling voucher posting operations on the frontend
 * Provides methods for fetching draft vouchers, validating, preparing payloads,
 * posting vouchers, and handling errors with retry logic
 */
@Injectable({
  providedIn: 'root',
})
export class VoucherPostingService {
  private readonly baseUrl = '/api/accounts/voucher-posting';

  // Default retry configuration
  private readonly defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
  };

  constructor(private http: HttpClient) {}

  /**
   * Fetches a draft voucher with all details from the server
   * @param voucherHeaderSid - The ID of the voucher header
   * @returns Observable of draft voucher data
   */
  getDraftVoucher(voucherHeaderSid: number): Observable<DraftVoucherResponse> {
    return this.http
      .get<ApiResponse<DraftVoucherResponse>>(`${this.baseUrl}/draft/${voucherHeaderSid}`)
      .pipe(
        map((response) => {
          if (!response.status) {
            throw new Error(response.message || 'Failed to fetch draft voucher');
          }
          return response.data;
        }),
        catchError((error) => this.handleError(error, 'getDraftVoucher')),
      );
  }

  /**
   * Validates a voucher before posting
   * @param voucherHeaderSid - The ID of the voucher to validate
   * @returns Observable of validation result
   */
  validateVoucher(voucherHeaderSid: number): Observable<ValidationResult> {
    return this.http
      .post<ApiResponse<ValidationResult>>(`${this.baseUrl}/validate/${voucherHeaderSid}`, {})
      .pipe(
        map((response) => {
          // Note: For validation, we return the data even if status is false (validation failed)
          return response.data;
        }),
        catchError((error) => this.handleError(error, 'validateVoucher')),
      );
  }

  /**
   * Prepares the posting payload from a draft voucher
   * @param voucherHeaderSid - The ID of the voucher to prepare
   * @returns Observable of prepared posting payload
   */
  preparePostingPayload(voucherHeaderSid: number): Observable<PostVoucherRequest> {
    return this.http
      .post<ApiResponse<PostVoucherRequest>>(`${this.baseUrl}/prepare/${voucherHeaderSid}`, {})
      .pipe(
        map((response) => {
          if (!response.status) {
            throw new Error(response.message || 'Failed to prepare posting payload');
          }
          return response.data;
        }),
        catchError((error) => this.handleError(error, 'preparePostingPayload')),
      );
  }

  /**
   * Posts a voucher using a prepared payload
   * @param payload - The posting payload
   * @returns Observable of posting response
   */
  postVoucher(payload: PostVoucherRequest): Observable<PostVoucherResponse> {
    return this.http.post<ApiResponse<PostVoucherResponse>>(`${this.baseUrl}/post`, payload).pipe(
      map((response) => {
        // Return the posting response data
        return response.data;
      }),
      catchError((error) => this.handleError(error, 'postVoucher')),
    );
  }

  /**
   * Posts a voucher by ID (convenience method that combines prepare and post)
   * @param voucherHeaderSid - The ID of the voucher to post
   * @returns Observable of posting response
   */
  postVoucherById(voucherHeaderSid: number): Observable<PostVoucherResponse> {
    return this.http
      .post<ApiResponse<PostVoucherResponse>>(`${this.baseUrl}/post/${voucherHeaderSid}`, {})
      .pipe(
        map((response) => {
          return response.data;
        }),
        catchError((error) => this.handleError(error, 'postVoucherById')),
      );
  }

  /**
   * Posts a voucher with automatic retry on failure
   * @param payload - The posting payload
   * @param retryOptions - Optional retry configuration
   * @returns Observable of posting response
   */
  retryPost(payload: PostVoucherRequest, retryOptions?: RetryOptions): Observable<PostVoucherResponse> {
    const options = { ...this.defaultRetryOptions, ...retryOptions };

    return this.postVoucher(payload).pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            // Don't retry if we've exceeded max retries
            if (retryAttempt > options.maxRetries!) {
              console.error(`Max retries (${options.maxRetries}) exceeded for voucher posting`);
              return throwError(() => error);
            }

            // Don't retry on validation errors (4xx status codes)
            if (error.status >= 400 && error.status < 500) {
              console.warn('Validation error detected, not retrying');
              return throwError(() => error);
            }

            // Calculate exponential backoff delay
            const delay = options.delayMs! * Math.pow(options.backoffMultiplier!, index);

            console.log(
              `Retry attempt ${retryAttempt}/${options.maxRetries} after ${delay}ms for voucher ${payload.voucherHeaderSid}`,
            );

            // Retry after delay
            return timer(delay);
          }),
        ),
      ),
      catchError((error) => this.handleError(error, 'retryPost')),
    );
  }

  /**
   * Gets posted transactions for a voucher
   * @param voucherHeaderSid - The ID of the voucher
   * @returns Observable of posted transaction records
   */
  getPostedTransactions(voucherHeaderSid: number): Observable<VoucherTransaction[]> {
    return this.http
      .get<ApiResponse<VoucherTransaction[]>>(`${this.baseUrl}/transactions/${voucherHeaderSid}`)
      .pipe(
        map((response) => {
          if (!response.status) {
            throw new Error(response.message || 'Failed to fetch posted transactions');
          }
          return response.data;
        }),
        catchError((error) => this.handleError(error, 'getPostedTransactions')),
      );
  }

  /**
   * Client-side validation before posting
   * Validates basic requirements without making a server call
   * @param header - Voucher header data
   * @param details - Array of voucher detail lines
   * @returns Validation result
   */
  validateVoucherLocal(header: VoucherHeader, details: VoucherDetail[]): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if there are detail lines
    if (!details || details.length === 0) {
      errors.push({
        code: 'NO_DETAIL_LINES',
        message: 'Voucher has no detail lines',
      });
      return {
        isValid: false,
        errors,
        validatedAt: new Date(),
      };
    }

    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;

    details.forEach((detail) => {
      const amount = detail.Amount || 0;

      if (detail.DrCr === 'D' || detail.DrCr === 'Debit') {
        totalDebit += amount;
      } else if (detail.DrCr === 'C' || detail.DrCr === 'Credit') {
        totalCredit += amount;
      } else {
        errors.push({
          code: 'INVALID_DRCR',
          message: `Invalid DrCr value: ${detail.DrCr}`,
          field: 'DrCr',
          details: { voucherDetailSid: detail.VoucherDetailSid, drCr: detail.DrCr },
        });
      }

      // Validate mandatory fields
      if (!detail.COAMasterSid) {
        errors.push({
          code: 'MISSING_COA',
          message: 'COA Master Sid is required',
          field: 'COAMasterSid',
          details: { voucherDetailSid: detail.VoucherDetailSid },
        });
      }

      if (amount <= 0) {
        errors.push({
          code: 'INVALID_AMOUNT',
          message: 'Amount must be greater than zero',
          field: 'Amount',
          details: { voucherDetailSid: detail.VoucherDetailSid, amount },
        });
      }
    });

    // Check balanced entry (with tolerance for floating point)
    const tolerance = 0.01;
    if (Math.abs(totalDebit - totalCredit) > tolerance) {
      errors.push({
        code: 'UNBALANCED_ENTRY',
        message: `Total Debit (${totalDebit.toFixed(2)}) and Credit (${totalCredit.toFixed(2)}) amounts do not match`,
        details: { totalDebit, totalCredit, difference: totalDebit - totalCredit },
      });
    }

    // Check if already posted
    if (header.SetoffStatus === 'Posted' || header.SetoffStatus === 'Completed') {
      errors.push({
        code: 'ALREADY_POSTED',
        message: 'Voucher is already posted',
        details: { currentStatus: header.SetoffStatus },
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      totalDebit,
      totalCredit,
      lineCount: details.length,
      validatedAt: new Date(),
    };
  }

  /**
   * Summarizes taxes by grouping detail lines by HS/SAC code and tax type
   * This is a client-side implementation for preview/validation purposes
   * @param details - Array of voucher detail lines
   * @returns Array of tax summaries
   */
  summarizeTaxes(details: VoucherDetail[]): TaxSummary[] {
    const taxGroups = new Map<string, TaxSummary>();

    details.forEach((detail) => {
      // Skip if no tax
      if (!detail.TaxPercentage1 && !detail.TaxPercentage2) {
        return;
      }

      const hsSacMasterSid = detail.HSSACMasterSid;
      if (!hsSacMasterSid) {
        return;
      }

      // Note: In real implementation, you would fetch the HS/SAC code
      // For now, we use a placeholder
      const hsSacCode = `HSN_${hsSacMasterSid}`;

      // Process Tax 1 (CGST)
      if (detail.TaxPercentage1 && detail.TaxAmount1) {
        const key1 = `${hsSacMasterSid}_CGST_${detail.TaxPercentage1}`;

        if (!taxGroups.has(key1)) {
          taxGroups.set(key1, {
            hsSacMasterSid: hsSacMasterSid,
            hsSacCode: hsSacCode,
            taxType: 'CGST',
            taxPercentage: detail.TaxPercentage1,
            taxableAmount: 0,
            taxAmount: 0,
            coaMasterSid: 0, // Will be determined by server
          });
        }

        const group1 = taxGroups.get(key1)!;
        group1.taxableAmount += detail.TaxableAmount || 0;
        group1.taxAmount += detail.TaxAmount1 || 0;
      }

      // Process Tax 2 (SGST)
      if (detail.TaxPercentage2 && detail.TaxAmount2) {
        const key2 = `${hsSacMasterSid}_SGST_${detail.TaxPercentage2}`;

        if (!taxGroups.has(key2)) {
          taxGroups.set(key2, {
            hsSacMasterSid: hsSacMasterSid,
            hsSacCode: hsSacCode,
            taxType: 'SGST',
            taxPercentage: detail.TaxPercentage2,
            taxableAmount: 0,
            taxAmount: 0,
            coaMasterSid: 0, // Will be determined by server
          });
        }

        const group2 = taxGroups.get(key2)!;
        group2.taxableAmount += detail.TaxableAmount || 0;
        group2.taxAmount += detail.TaxAmount2 || 0;
      }
    });

    return Array.from(taxGroups.values());
  }

  /**
   * Locks local editing of a posted voucher
   * This is a client-side helper to prevent UI modifications
   * @param header - Voucher header
   * @returns Whether the voucher should be locked from edits
   */
  lockLocalEdit(header: VoucherHeader): boolean {
    // Lock if posted or completed
    return header.SetoffStatus === 'Posted' || header.SetoffStatus === 'Completed';
  }

  /**
   * Maps server errors to user-friendly ValidationResult
   * @param error - HTTP error response
   * @returns Validation result with mapped errors
   */
  mapErrorToValidationResult(error: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (error.error && error.error.data && error.error.data.errors) {
      // Server returned structured validation errors
      errors.push(...error.error.data.errors);
    } else if (error.message) {
      // Generic error message
      errors.push({
        code: 'SERVER_ERROR',
        message: error.message,
      });
    } else {
      errors.push({
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      });
    }

    return {
      isValid: false,
      errors,
      validatedAt: new Date(),
    };
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

  /**
   * Helper: Normalizes DrCr values to 'D' or 'C'
   * @param drCr - Debit/Credit indicator
   * @returns Normalized 'D' or 'C'
   */
  normalizeDrCr(drCr: string): 'D' | 'C' {
    if (!drCr) return 'D';
    const normalized = drCr.toUpperCase().trim();
    if (normalized.startsWith('D')) return 'D';
    if (normalized.startsWith('C')) return 'C';
    return 'D';
  }
}
