/**
 * Frontend models and interfaces for Voucher Posting
 * Corresponds to backend DTOs for type safety
 */

/**
 * Voucher Header interface
 */
export interface VoucherHeader {
  VoucherHeaderSid: number;
  VoucherNumber: string;
  VoucherDate: Date | string;
  PostDate: Date | string;
  VoucherType: number;
  VoucherTypeMasterSid: number;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  PartyMasterSid: number;
  PartyName: string;
  PartyAddress?: string;
  COAMasterSid: number;
  CurrencyCode?: string;
  ExchangeRate?: number;
  Amount?: number;
  LocalAmount?: number;
  NetAmount?: number;
  Narration?: string;
  SetoffStatus?: string;
  GST_VAT?: string;
  YearMasterSid?: number;
  Status: string;
  CreatedBy: string;
  CreatedOn: Date | string;
  UpdatedBy?: string;
  UpdatedOn?: Date | string;
}

/**
 * Voucher Detail interface
 */
export interface VoucherDetail {
  VoucherDetailSid: number;
  VoucherHeaderSid: number;
  VoucherTransactionSid?: number;
  Sno: number;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  ChargeMasterSid?: number;
  ChargeDescription?: string;
  LedgerMasterSid?: number;
  COAMasterSid?: number;
  YearMasterSid?: number;
  HSSACMasterSid?: number;
  DepartmentMasterSid?: number;
  HouseJobSid?: number;
  MasterJobSid?: number;
  CostRevenue?: string;
  CurrencyMasterSid: number;
  CurrencyCode: string;
  ExchangeRate: number;
  Rate: number;
  NumberOfUnit?: number;
  Narration?: string;
  DrCr: string; // 'D' or 'C'
  TaxableAmount: number;
  TaxPercentage1?: number;
  TaxAmount1?: number;
  TaxPercentage2?: number;
  TaxAmount2?: number;
  Amount: number;
  LocalAmount: number;
  CostCenter?: number;
  ProfitCenter?: number;
  Status: string;
  CreatedBy: string;
  CreatedOn: Date | string;
  UpdatedBy?: string;
  UpdatedOn?: Date | string;
}

/**
 * Voucher Line for posting payload
 */
export interface VoucherLine {
  sno: number;
  voucherDetailSid: number;
  coaMasterSid: number;
  ledgerMasterSid?: number;
  drCr: 'D' | 'C';
  chargeDescription?: string;
  taxableAmount: number;
  amount: number;
  localAmount: number;
  gstVatCode?: string;
  hsSacMasterSid?: number;
  numberOfUnit?: number;
  rate?: number;
  narration?: string;
  costCenter?: number;
  profitCenter?: number;
  departmentMasterSid?: number;
  houseJobSid?: number;
  masterJobSid?: number;
  costRevenue?: string;
  taxPercentage1?: number;
  taxAmount1?: number;
  taxPercentage2?: number;
  taxAmount2?: number;
  yearMasterSid?: number;
}

/**
 * Tax Summary for posting payload
 */
export interface TaxSummary {
  hsSacMasterSid: number;
  hsSacCode: string;
  taxType: string; // 'CGST', 'SGST', 'IGST', 'VAT'
  taxPercentage: number;
  taxableAmount: number;
  taxAmount: number;
  coaMasterSid: number;
}

/**
 * Post Voucher Request payload
 */
export interface PostVoucherRequest {
  voucherHeaderSid: number;
  voucherNumber: string;
  companyMasterSid: number;
  branchMasterSid: number;
  voucherDate: string; // YYYY-MM-DD format
  postDate: string; // YYYY-MM-DD format
  currencyCode: string;
  exchangeRate: number;
  voucherType: number;
  voucherTypeMasterSid: number;
  yearMasterSid: number;
  gstVat?: string;
  lines: VoucherLine[];
  taxSummaries: TaxSummary[];
  createdBy: string;
}

/**
 * Validation Error detail
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  totalDebit?: number;
  totalCredit?: number;
  lineCount?: number;
  validatedAt?: Date | string;
}

/**
 * Post Voucher Response
 */
export interface PostVoucherResponse {
  success: boolean;
  voucherHeaderSid?: number;
  transactionCount?: number;
  transactionSids?: number[];
  postedAt?: Date | string;
  errors: ValidationError[];
  message?: string;
}

/**
 * Draft Voucher Response
 */
export interface DraftVoucherResponse {
  header: VoucherHeader;
  details: VoucherDetail[];
  isPosted: boolean;
  postingStatus?: string;
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
 * Voucher Transaction (posted record)
 */
export interface VoucherTransaction {
  VoucherTransactionSid: number;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  VoucherHeaderSid: number;
  VoucherDetailSid: number;
  YearMasterSid?: number;
  VoucherNumber: string;
  VoucherType: number;
  VoucherDate: Date | string;
  PostDate: Date | string;
  GST_VAT: string;
  Sno: number;
  ChargeDescription: string;
  LedgerMasterSid: number;
  COAMasterSid: number;
  DepartmentMasterSid: number;
  HouseJobSid: number;
  MasterJobSid: number;
  CostRevenue: string;
  CurrencyCode: string;
  ExchangeRate: number;
  Rate: number;
  NumberOfUnit: number;
  Narration?: string;
  DrCr: string; // 'D' or 'C'
  TaxableAmount: number;
  Amount: number;
  LocalAmount: number;
  CostCenter?: number;
  ProfitCenter?: number;
  TransType: string;
  VoucherTypeMasterSid: number;
  Status: string;
  CreatedBy: string;
  CreatedOn: Date | string;
  UpdatedBy?: string;
  UpdatedOn?: Date | string;
}

/**
 * Options for retrying post operations
 */
export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}
