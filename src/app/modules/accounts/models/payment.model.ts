/**
 * Payment Voucher Models
 * TypeScript interfaces for Payment Voucher system
 *
 * Supports 4 types of payments:
 * 1. Advance Payment to Vendor
 * 2. Payment against Vendor Invoice with TDS
 * 3. Multi-branch Payment with Auto Inter-branch JV
 * 4. Direct Expense Payment
 */

/**
 * Payment Mode enum
 */
export enum PaymentMode {
  Cash = 'Cash',
  Cheque = 'Cheque',
  NEFT = 'NEFT',
  RTGS = 'RTGS',
  IMPS = 'IMPS',
  DD = 'DD',
  Online = 'Online',
  Others = 'Others'
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
  Others = 'Others'
}

/**
 * Search Type enum for vendor outstanding
 */
export enum SearchType {
  VendorName = 'VendorName',
  Invoice = 'Invoice',
  HouseNo = 'HouseNo',
  HBLNo = 'HBLNo',
  MasterNo = 'MasterNo',
  MBLNo = 'MBLNo',
  HAWB = 'HAWB',
  MAWB = 'MAWB'
}

/**
 * Payment Status enum
 */
export enum PaymentStatus {
  Active = 'A',
  Suspended = 'S',
  Reversed = 'R'
}

/**
 * Main payment request interface
 */
export interface CreatePaymentRequest {
  CompanyMasterSid: number;
  BranchMasterSid: number;
  VoucherDate: string; // YYYY-MM-DD
  PaymentMode: string; // Cash or Bank
  BankLedgerMasterSid: number;
  CurrencyMasterSid: number;
  ExchangeRate: number;
  VendorLedgerMasterSid?: number; // Optional for expense payments
  PaidTo: string;
  Address?: string;
  GSTNumber?: string;
  Narration?: string;
  Remarks?: string;
  InstrumentMode?: string;
  InstrumentNumber?: string;
  InstrumentDate?: string;
  ClearanceDate?: string;
  IsMultiBranch?: boolean;
  Details: PaymentDetail[];
  TDSDetails?: PaymentTDS[];
  VoucherMatchings?: PaymentVoucherMatching[];
  InterBranch?: PaymentInterBranch[];
  CreatedBy?: string;
}

/**
 * Payment detail line (ledger allocation)
 */
export interface PaymentDetail {
  ChargeMasterSid?: number;
  SACHSCode?: string;
  LedgerMasterSid: number;
  LedgerName?: string; // For display
  BranchMasterSid: number;
  BranchName?: string; // For display
  DrCr: 'D' | 'C';
  CurrencyMasterSid: number;
  CurrencyCode?: string; // For display
  ExchangeRate: number;
  CurrencyAmount: number;
  TaxableAmount: number;
  TaxPercentage?: number;
  TaxAmount?: number;
  LocalAmount: number;
  Narration?: string;
  CostCenterSid?: number;
  ProfitCenterSid?: number;
  MasterJobSid?: number;
  HouseJobSid?: number;
}

/**
 * TDS deduction details
 */
export interface PaymentTDS {
  TDSSetRateSid: number;
  TDSCompanyType: string;
  ITSectionCode: string;
  CertificateNumber?: string;
  TDSPercentage: number;
  TaxableAmount: number;
  TDSAmount: number;
  Reason?: string;
}

/**
 * Voucher matching (invoice payment)
 */
export interface PaymentVoucherMatching {
  VoucherTransactionSid: number;
  VoucherNumber?: string; // For display
  InvoiceDate?: string; // For display
  CurrencyAmount: number;
  LocalAmount: number;
  TDSAmount?: number;
  Narration?: string;
  // For display purposes
  OriginalAmount?: number;
  OutstandingAmount?: number;
  Balance?: number;
}

/**
 * Inter-branch allocation
 */
export interface PaymentInterBranch {
  BranchMasterSid: number;
  BranchName?: string; // For display
  CurrencyAmount: number;
  Narration?: string;
  JVNumber?: string; // Generated JV number (response)
}

/**
 * Search vendor outstanding request
 */
export interface SearchVendorOutstandingRequest {
  CompanyMasterSid: number;
  BranchMasterSid?: number;
  LedgerMasterSid?: number;
  VendorName?: string;
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
 * Vendor outstanding invoice
 */
export interface VendorOutstandingInvoice {
  VoucherTransactionSid: number;
  VoucherHeaderSid: number;
  VoucherNumber: string;
  VoucherDate: string;
  VoucherType: number;
  LedgerMasterSid: number;
  VendorName: string;
  BranchName?: string;
  OriginalAmount: number;
  OriginalCurrencyAmount: number;
  MatchedAmount: number;
  MatchedCurrencyAmount: number;
  OutstandingAmount: number;
  OutstandingCurrencyAmount: number;
  CurrencyCode: string;
  ExchangeRate: number;
  DrCr: string;
  ChargeDescription?: string;
  HouseNumber?: string;
  MasterNumber?: string;
  // For UI
  selected?: boolean;
  matchingAmount?: number;
  matchingCurrencyAmount?: number;
  matchingTDSAmount?: number;
  balance?: number;
}

/**
 * Payment response (after creation)
 */
export interface PaymentResponse {
  VoucherHeaderSid: number;
  VoucherNumber: string;
  VoucherDate: string;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  VendorLedgerMasterSid?: number;
  VendorName?: string;
  TotalAmount: number;
  TDSAmount?: number;
  NetAmount: number;
  PaymentMode: string;
  MatchedInvoices: MatchedInvoice[];
  TDSDetails?: PaymentTDSResponse[];
  InterBranchJVs?: InterBranchJV[];
  ExchangeJV?: ExchangeJV;
  CreatedAt: Date | string;
  Status: string;
}

/**
 * Matched invoice details
 */
export interface MatchedInvoice {
  VoucherTransactionSid: number;
  InvoiceNumber: string;
  InvoiceDate: string;
  OriginalAmount: number;
  PreviouslyMatched: number;
  MatchedAmount: number;
  TDSAmount?: number;
  OutstandingAmount: number;
}

/**
 * TDS response details
 */
export interface PaymentTDSResponse {
  VoucherTDSSid: number;
  ITSectionCode: string;
  TDSPercentage: number;
  TaxableAmount: number;
  TDSAmount: number;
  CertificateNumber?: string;
}

/**
 * Inter-branch JV details
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
 * Exchange gain/loss JV details
 */
export interface ExchangeJV {
  JVHeaderSid: number;
  JVNumber: string;
  ExchangeDifference: number;
  IsGain: boolean;
  CreatedAt: Date | string;
}

/**
 * Payment filter for list
 */
export interface PaymentFilter {
  CompanyMasterSid?: number;
  BranchMasterSid?: number;
  VoucherNumber?: string;
  VendorLedgerMasterSid?: number;
  DateFrom?: string;
  DateTo?: string;
  PaymentMode?: string;
  Limit?: number;
  Offset?: number;
}

/**
 * Payment list item (for grid display)
 */
export interface PaymentListItem {
  VoucherHeaderSid: number;
  VoucherNumber: string;
  VoucherDate: string;
  VendorName: string;
  BankName?: string;
  PaymentMode: string;
  TotalAmount: number;
  TDSAmount?: number;
  NetAmount: number;
  BranchName?: string;
  CreatedBy?: string;
  Status: string;
  StatusDisplay?: string;
}

/**
 * Payment detail view (for display)
 */
export interface PaymentDetailView {
  VoucherHeaderSid: number;
  VoucherNumber: string;
  VoucherDate: string;
  CompanyName?: string;
  BranchName?: string;
  VendorName?: string;
  PaidTo: string;
  Address?: string;
  GSTNumber?: string;
  PaymentMode: string;
  BankName?: string;
  CurrencyCode?: string;
  ExchangeRate?: number;
  InstrumentMode?: string;
  InstrumentNumber?: string;
  InstrumentDate?: string;
  ClearanceDate?: string;
  TotalAmount: number;
  TDSAmount?: number;
  NetAmount: number;
  Narration?: string;
  Remarks?: string;
  CreatedBy?: string;
  CreatedOn?: string;
  Status: string;
  // Related data
  details?: PaymentDetailLineView[];
  tdsDetails?: PaymentTDSView[];
  matchedInvoices?: MatchedInvoice[];
  interBranchJVs?: InterBranchJV[];
  exchangeJV?: ExchangeJV;
}

/**
 * Payment detail line view (for display)
 */
export interface PaymentDetailLineView {
  Sno: number;
  LedgerName: string;
  BranchName: string;
  DrCr: string;
  CurrencyCode: string;
  ExchangeRate: number;
  CurrencyAmount: number;
  TaxableAmount: number;
  TaxPercentage?: number;
  TaxAmount?: number;
  LocalAmount: number;
  Narration?: string;
  CostCenterName?: string;
  ProfitCenterName?: string;
  MasterJobNo?: string;
  HouseJobNo?: string;
}

/**
 * TDS view (for display)
 */
export interface PaymentTDSView {
  ITSectionCode: string;
  TDSCompanyType: string;
  TDSPercentage: number;
  TaxableAmount: number;
  TDSAmount: number;
  CertificateNumber?: string;
  Reason?: string;
}

/**
 * TDS Set Rate master
 */
export interface TDSSetRate {
  TDSSetRateSid: number;
  ITSectionCode: string;
  SectionDescription: string;
  TDSCompanyType: string;
  TDSPercentage: number;
  ThresholdLimit?: number;
  Status: string;
}

/**
 * Update payment request
 */
export interface UpdatePaymentRequest {
  Narration?: string;
  Remarks?: string;
  Status?: string;
  UpdatedBy?: string;
}

/**
 * Reverse payment request
 */
export interface ReversePaymentRequest {
  VoucherHeaderSid: number;
  ReversalDate: string;
  ReversalReason: string;
  ReversedBy?: string;
}

/**
 * Payment summary
 */
export interface PaymentSummary {
  totalPayments: number;
  totalCashPayments: number;
  totalBankPayments: number;
  totalTDS: number;
  branchWiseSummary?: BranchPaymentSummary[];
}

/**
 * Branch-wise payment summary
 */
export interface BranchPaymentSummary {
  BranchMasterSid: number;
  BranchName: string;
  TotalPayments: number;
  TotalAmount: number;
  TotalTDS: number;
  NetAmount: number;
}

/**
 * Form state for payment entry
 */
export interface PaymentFormState {
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  validationErrors: { [key: string]: string };
}

/**
 * Payment tab enum
 */
export enum PaymentTab {
  Detail = 'detail',
  TDS = 'tds',
  Voucher = 'voucher',
  InterBranch = 'interbranch'
}
