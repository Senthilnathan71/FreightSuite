/**
 * Frontend models and interfaces for Outstanding Calculations
 * Corresponds to backend DTOs for type safety
 */

/**
 * Voucher Outstanding response
 */
export interface VoucherOutstanding {
  companyMasterSid: number;
  voucherTransactionSid: number;
  voucherNumber: string;
  originalCurrencyAmount: number;
  originalLocalAmount: number;
  matchedCurrencyAmount: number;
  matchedLocalAmount: number;
  outstandingCurrencyAmount: number;
  outstandingLocalAmount: number;
  currencyCode: string;
  drCr: string;
  voucherDate: Date | string;
  partyName?: string;
}

/**
 * Single outstanding transaction in customer list
 */
export interface CustomerOutstandingTransaction {
  voucherTransactionSid: number;
  voucherNumber: string;
  voucherDate: Date | string;
  voucherType: number;
  originalCurrencyAmount: number;
  originalLocalAmount: number;
  matchedCurrencyAmount: number;
  matchedLocalAmount: number;
  outstandingCurrencyAmount: number;
  outstandingLocalAmount: number;
  currencyCode: string;
  drCr: string;
  chargeDescription?: string;
}

/**
 * Customer Outstanding response
 */
export interface CustomerOutstanding {
  companyMasterSid: number;
  ledgerMasterSid: number;
  customerName?: string;
  totalOutstandingCurrency: number;
  totalOutstandingLocal: number;
  voucherCount: number;
  transactions: CustomerOutstandingTransaction[];
}

/**
 * Outstanding Summary
 */
export interface OutstandingSummary {
  totalDebit: number;
  totalCredit: number;
  netOutstanding: number;
  currencyCode: string;
}

/**
 * API Response wrapper (matches backend ResponseData)
 */
export interface ApiResponse<T = any> {
  status: boolean;
  data: T;
  message: string;
}

/**
 * Options for filtering outstanding records
 */
export interface OutstandingFilterOptions {
  includeFullyMatched?: boolean;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  voucherTypes?: number[];
  minAmount?: number;
}
