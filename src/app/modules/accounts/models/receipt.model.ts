/**
 * Frontend models for Receipt Voucher
 * Matches backend DTOs for type safety
 */

/**
 * Receipt creation request
 */
export interface CreateReceiptRequest {
  CompanyMasterSid: number;
  BranchMasterSid: number;
  LedgerMasterSid: number; // Customer
  VoucherDate: string; // YYYY-MM-DD
  Narration?: string;
  PaymentMode: string; // Cash, Cheque, NEFT, RTGS, etc.
  ChequeNumber?: string;
  ChequeDate?: string;
  BankName?: string;
  TotalAmount: number;
  CurrencyMasterSid?: number;
  ExchangeRate?: number;
  CurrencyAmount?: number;

  // TDS
  HasTDS?: boolean;
  TDSLedgerMasterSid?: number;
  TDSAmount?: number;
  TDSPercentage?: number;

  // Details
  Details: ReceiptDetail[];

  // Inter-branch
  IsInterBranch?: boolean;
  ReceivingBranchMasterSid?: number;

  CreatedBy?: string;
}

/**
 * Receipt detail line
 */
export interface ReceiptDetail {
  VoucherTransactionSid?: number; // Invoice transaction to match
  Amount: number;
  CurrencyAmount?: number;
  Narration?: string;
  IsAdvance: boolean; // true = advance, false = invoice matching
  COAMasterSid?: number; // For advance receipt
  Description?: string;
}

/**
 * Search outstanding invoices
 */
export interface SearchOutstandingRequest {
  CompanyMasterSid: number;
  LedgerMasterSid?: number;
  CustomerName?: string;
  InvoiceNumber?: string;
  HouseNumber?: string;
  HBLNumber?: string;
  MasterNumber?: string;
  MBLNumber?: string;
  HAWB?: string;
  MAWB?: string;
  IncludeFullyPaid?: boolean;
}

/**
 * Outstanding invoice result
 */
export interface OutstandingInvoice {
  VoucherTransactionSid: number;
  VoucherHeaderSid: number;
  VoucherNumber: string;
  VoucherDate: string | Date;
  VoucherType: number;
  LedgerMasterSid: number;
  CustomerName: string;
  OriginalAmount: number;
  OriginalCurrencyAmount: number;
  MatchedAmount: number;
  MatchedCurrencyAmount: number;
  OutstandingAmount: number;
  OutstandingCurrencyAmount: number;
  CurrencyCode: string;
  DrCr: string;

  // Additional fields
  HouseNumber?: string;
  HBLNumber?: string;
  MasterNumber?: string;
  MBLNumber?: string;
  HAWB?: string;
  MAWB?: string;
  ChargeDescription?: string;
  Narration?: string;

  // UI-only fields
  selected?: boolean;
  amountToApply?: number;
}

/**
 * Receipt response
 */
export interface ReceiptResponse {
  VoucherHeaderSid: number;
  VoucherNumber: string;
  VoucherDate: string;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  LedgerMasterSid: number;
  CustomerName: string;
  TotalAmount: number;
  TDSAmount?: number;
  NetAmount: number;
  MatchedInvoices: MatchedInvoice[];
  InterBranchJV?: InterBranchJV;
  CreatedAt: Date | string;
  Status: string;
}

/**
 * Matched invoice in response
 */
export interface MatchedInvoice {
  VoucherTransactionSid: number;
  InvoiceNumber: string;
  InvoiceDate: string;
  OriginalAmount: number;
  PreviouslyMatched: number;
  MatchedAmount: number;
  OutstandingAmount: number;
}

/**
 * Inter-branch journal voucher
 */
export interface InterBranchJV {
  JVHeaderSid: number;
  JVNumber: string;
  PayingBranchSid: number;
  ReceivingBranchSid: number;
  Amount: number;
  CreatedAt: Date | string;
}

/**
 * Receipt filter options
 */
export interface ReceiptFilter {
  CompanyMasterSid?: number;
  BranchMasterSid?: number;
  LedgerMasterSid?: number;
  DateFrom?: string;
  DateTo?: string;
  PaymentMode?: string;
  VoucherNumber?: string;
  IncludeInterBranch?: boolean;
}

/**
 * Receipt list item
 */
export interface ReceiptListItem {
  VoucherHeaderSid: number;
  VoucherNumber: string;
  VoucherDate: Date | string;
  CustomerName?: string;
  TotalAmount: number;
  PaymentMode?: string;
  Status: string;
  BranchName?: string;
  Narration?: string;
}

/**
 * Receipt summary
 */
export interface ReceiptSummary {
  TotalReceipts: number;
  TotalAmount: number;
  TotalTDS: number;
  NetAmount: number;
  MatchedInvoicesCount: number;
  AdvanceReceiptsCount: number;
}

/**
 * Update receipt request
 */
export interface UpdateReceiptRequest {
  Narration?: string;
  Status?: string;
  UpdatedBy?: string;
}

/**
 * Reverse receipt request
 */
export interface ReverseReceiptRequest {
  VoucherHeaderSid: number;
  ReversalDate: string;
  Reason?: string;
  ReversedBy?: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

/**
 * Payment mode options
 */
export enum PaymentMode {
  CASH = 'Cash',
  CHEQUE = 'Cheque',
  NEFT = 'NEFT',
  RTGS = 'RTGS',
  IMPS = 'IMPS',
  UPI = 'UPI',
  CARD = 'Card',
  ONLINE = 'Online',
}

/**
 * Instrument Mode enum
 */
export enum InstrumentMode {
  Cheque = 'Cheque',
  DD = 'DD',
  IMPS = 'IMPS',
  NEFT = 'NEFT',
  RTGS = 'RTGS',
  TT = 'TT',
  Others = 'Others'
}

/**
 * Receipt voucher status
 */
export enum ReceiptStatus {
  DRAFT = 'D',
  POSTED = 'Posted',
  REVERSED = 'R',
  CANCELLED = 'C',
  ACTIVE = 'A',
}

/**
 * Search type for outstanding invoices
 */
export enum SearchType {
  CUSTOMER = 'customer',
  INVOICE = 'invoice',
  HOUSE_NUMBER = 'house',
  HBL = 'hbl',
  MASTER_NUMBER = 'master',
  MBL = 'mbl',
  HAWB = 'hawb',
  MAWB = 'mawb',
}

/**
 * Receipt entry form data (UI-specific)
 */
export interface ReceiptFormData {
  // Header
  CompanyMasterSid: number;
  BranchMasterSid: number;
  LedgerMasterSid: number;
  CustomerName?: string;
  VoucherDate: Date;
  PaymentMode: string;
  ChequeNumber?: string;
  ChequeDate?: Date;
  BankName?: string;
  Narration?: string;

  // Currency
  CurrencyMasterSid?: number;
  CurrencyCode?: string;
  ExchangeRate: number;

  // TDS
  HasTDS: boolean;
  TDSPercentage?: number;
  TDSLedgerMasterSid?: number;

  // Inter-branch
  IsInterBranch: boolean;
  ReceivingBranchMasterSid?: number;

  // Calculated amounts
  TotalInvoiceAmount: number;
  TotalCurrencyAmount: number;
  TDSAmount: number;
  NetReceiptAmount: number;

  // Invoice matching
  selectedInvoices: OutstandingInvoice[];
  advanceAmount: number;
}

/**
 * Receipt detail view (for display)
 */
export interface ReceiptDetailView {
  VoucherHeaderSid: number;
  VoucherNumber: string;
  VoucherDate: string;
  CompanyName: string;
  BranchName: string;
  CustomerName: string;
  PaymentMode: string;
  ChequeNumber?: string;
  ChequeDate?: string;
  BankName?: string;
  TotalAmount: number;
  TDSAmount: number;
  NetAmount: number;
  Narration?: string;
  CreatedBy: string;
  CreatedOn: Date | string;
  Status: string;

  // Lines
  lines: ReceiptLineView[];
  matchedInvoices: MatchedInvoice[];
  interBranchJV?: InterBranchJV;
}

/**
 * Receipt line for display
 */
export interface ReceiptLineView {
  Sno: number;
  COAName: string;
  SubledgerName?: string;
  DrCr: string;
  Amount: number;
  CurrencyCode: string;
  CurrencyAmount: number;
  ExchangeRate: number;
  Narration?: string;
}
