export interface Currency {
  CurrencyMasterSid: number;
  CountryMasterSid: number;
  currencyName: string;
  currencyCode: string;
  CurrencyUnit: string | null;
  CurrencySubUnit: string | null;
  SubUnitIn:string |null;
  GroupingStyle?: string | null;
  GroupSeparator?: string | null;
  ShortCode: string | null;
  Symbol: string | null;
  amountDecimal: number;
  exchangeDecimal: number;
  createdBy: string;
  createdOn: Date;
  updatedOn: Date;
  // deletedAt: Date | null;
  updatedBy: string | null;
  status: 'A' | 'S';
  RoundOf: string | null;
  LoginSid: number | null;
}


/**
 * @fileoverview Currency Models and Interfaces
 * @description Defines the data structures for currency management, formatting, and configuration.
 * @module CurrencyModels
 */

/**
 * Interface representing the CurrencyMaster model from Prisma database.
 * This mirrors the exact structure from your NestJS backend.
 * 
 * @interface CurrencyMaster
 * @property {number} CurrencyMasterSid - Primary key, auto-incremented unique identifier
 * @property {string} currencyCode - 3-character ISO currency code (e.g., 'USD', 'EUR', 'INR')
 * @property {string} currencyName - Full name of the currency (e.g., 'US Dollar')
 * @property {number} amountDecimal - Number of decimal places for amount display
 * @property {number} exchangeDecimal - Number of decimal places for exchange rates
 * @property {string} createdBy - Username or ID of the user who created this record
 * @property {Date} createdOn - Timestamp when the record was created
 * @property {Date} updatedOn - Timestamp when the record was last updated
 * @property {Date | null} [deletedAt] - Soft delete timestamp (null if active)
 * @property {string | null} [updatedBy] - Username or ID of the user who last updated this record
 * @property {string | null} [status] - Status flag: 'A' for Active, 'I' for Inactive
 * @property {number | null} [LoginSid] - Foreign key to login/user table
 * @property {string | null} [CurrencySubUnit] - Subunit name (e.g., 'Cent' for Dollar)
 * @property {string | null} [CurrencyUnit] - Main unit name (e.g., 'Dollar')
 * @property {string | null} [ShortCode] - Alternative short code for the currency
 * @property {string | null} [Symbol] - Currency symbol (e.g., '$', '€', '₹')
 * @property {string | null} [RoundOf] - Rounding precision as string (e.g., '3' or '0.001')
 * @property {string | null} [SubUnitIn] - Conversion rate from main unit to subunit
 * @property {number | null} [CountryMasterSid] - Foreign key to country master table
 * 
 * @example
 * const usdCurrency: CurrencyMaster = {
 *   CurrencyMasterSid: 1,
 *   currencyCode: 'USD',
 *   currencyName: 'US Dollar',
 *   amountDecimal: 2,
 *   exchangeDecimal: 3,
 *   createdBy: 'admin',
 *   createdOn: new Date(),
 *   updatedOn: new Date(),
 *   status: 'A',
 *   Symbol: '$',
 *   RoundOf: '3'
 * };
 */
export interface CurrencyMaster {
  CurrencyMasterSid: number;
  currencyCode: string;
  currencyName: string;
  amountDecimal: number;
  exchangeDecimal: number;
  createdBy: string;
  createdOn: Date;
  updatedOn: Date;
  deletedAt?: Date | null;
  updatedBy?: string | null;
  status?: string | null;
  LoginSid?: number | null;
  CurrencySubUnit?: string | null;
  CurrencyUnit?: string | null;
  ShortCode?: string | null;
  Symbol?: string | null;
  RoundOf?: string | null;
  SubUnitIn?: string | null;
  GroupingStyle?: string | null;
  GroupSeparator?: string | null;
  CountryMasterSid?: number | null;
}

/**
 * Simplified currency configuration used for formatting operations.
 * This is a processed version of CurrencyMaster optimized for runtime use.
 * 
 * @interface CurrencyConfig
 * @property {string} currencyCode - 3-character ISO currency code
 * @property {string} currencyName - Full name of the currency
 * @property {number} amountDecimal - Decimal places for amount formatting
 * @property {number} exchangeDecimal - Decimal places for exchange rate formatting
 * @property {number} roundOffDecimal - Decimal places for rounding (parsed from RoundOf field)
 * @property {string} symbol - Currency symbol for display
 * @property {'before' | 'after'} symbolPosition - Position of currency symbol relative to amount
 * 
 * @example
 * const usdConfig: CurrencyConfig = {
 *   currencyCode: 'USD',
 *   currencyName: 'US Dollar',
 *   amountDecimal: 2,
 *   exchangeDecimal: 3,
 *   roundOffDecimal: 3,
 *   symbol: '$',
 *   symbolPosition: 'before'
 * };
 */
export interface CurrencyConfig {
  currencyCode: string;
  currencyName: string;
  amountDecimal: number;
  exchangeDecimal: number;
  roundOffDecimal: number;
  symbol: string;
  symbolPosition: 'before' | 'after';
  /** Digit grouping: 'International' = 3-3-3 (1,234,567); 'Indian' = 3-2-2 (12,34,567). */
  groupingStyle: 'International' | 'Indian';
  /** The actual group-separator character to insert (',' or ' '). */
  groupSeparator: string;
}

/**
 * Basic input structure for formatting operations.
 * Contains the minimum required information to format a currency value.
 * 
 * @interface FormatInput
 * @property {number} value - The numeric value to format
 * @property {string} currencyCode - The 3-character ISO currency code
 * 
 * @example
 * const input: FormatInput = {
 *   value: 1234.5678,
 *   currencyCode: 'USD'
 * };
 */
export interface FormatInput {
  value: number;
  currencyCode: string;
}

/**
 * Extended format input with custom overrides for formatting rules.
 * Use this when you need to override the default currency configuration.
 * 
 * @interface FormatInputWithOverrides
 * @extends FormatInput
 * @property {number} [amountDecimal] - Override for amount decimal places
 * @property {number} [exchangeDecimal] - Override for exchange rate decimal places
 * @property {number} [roundOffDecimal] - Override for rounding decimal places
 * @property {string} [symbol] - Override for currency symbol
 * @property {'before' | 'after'} [symbolPosition] - Override for symbol position
 * 
 * @example
 * const customInput: FormatInputWithOverrides = {
 *   value: 9999.9999,
 *   currencyCode: 'EUR',
 *   amountDecimal: 3,
 *   roundOffDecimal: 4,
 *   symbol: '€',
 *   symbolPosition: 'after'
 * };
 */
export interface FormatInputWithOverrides extends FormatInput {
  amountDecimal?: number;
  exchangeDecimal?: number;
  roundOffDecimal?: number;
  symbol?: string;
  symbolPosition?: 'before' | 'after';
}

/**
 * Result structure for formatting breakdown analysis.
 * Used for debugging and understanding the formatting process.
 * 
 * @interface FormattingBreakdown
 * @property {number} original - The original unformatted value
 * @property {number} rounded - Value after rounding to roundOffDecimal places
 * @property {number} truncated - Value after truncating to amountDecimal places
 * @property {string} final - Final formatted string with proper decimal representation
 * @property {CurrencyConfig | null} currency - The currency configuration used (null if not found)
 * 
 * @example
 * const breakdown: FormattingBreakdown = {
 *   original: 1234.5678,
 *   rounded: 1234.568,
 *   truncated: 1234.56,
 *   final: "1234.56",
 *   currency: { currencyCode: 'USD', ... }
 * };
 */
export interface FormattingBreakdown {
  original: number;
  rounded: number;
  truncated: number;
  final: string;
  currency: CurrencyConfig | null;
}
