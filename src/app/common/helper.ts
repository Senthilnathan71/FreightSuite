import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import { Port } from "../modules/crm-mobile/Interfaces/port.interface";
import { AbstractControl, FormArray, FormGroup } from "@angular/forms";
import { ToastrService } from 'ngx-toastr';


type DateRangeInput = Date | string | NgbDateStruct | null | undefined;

// ── Branch Timezone Helpers ──────────────────────────────────────────────────

export function normalizeTimezoneOffset(offset?: string | null): string {
  if (!offset) return '+00:00';
  let value = String(offset).trim();
  if (!value) return '+00:00';
  if (!['+', '-'].includes(value[0])) value = `+${value}`;
  const match = value.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return '+00:00';
  const sign = match[1];
  const hours = match[2].padStart(2, '0');
  const minutes = match[3] || '00';
  return `${sign}${hours}:${minutes}`;
}

export function getOffsetMinutes(offset: string): number {
  const match = offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  return sign * ((hours * 60) + minutes);
}

/**
 * Converts a UTC-midnight Date (from CustomDateAdapter) to an ISO string
 * adjusted to the branch timezone, so the DB stores the correct local-midnight time.
 * Example: formDate = Date.UTC(2026,5,5) [UTC midnight June 5], branch = +05:30
 * → subtract 330 min → "2026-06-04T18:30:00.000Z" (= midnight June 5 in +05:30)
 */
export function branchDateToUtcIso(formDate: Date, timeZone?: string | null): string {
  const offset = normalizeTimezoneOffset(timeZone);
  const offsetMs = getOffsetMinutes(offset) * 60 * 1000;
  return new Date(formDate.getTime() - offsetMs).toISOString();
}

/**
 * Converts a DB-stored UTC ISO back to a Date where UTC getters reflect
 * the branch-local calendar date, so CustomDateAdapter.fromModel shows the correct date.
 * Example: "2026-06-04T18:30:00.000Z", branch = +05:30
 * → add 330 min → Date where getUTC*() = June 5, 2026
 */
export function utcIsoToBranchLocalDate(isoDate: string, timeZone?: string | null): Date | null {
  if (!isoDate) return null;
  const offset = normalizeTimezoneOffset(timeZone);
  const shifted = new Date(new Date(isoDate).getTime() + getOffsetMinutes(offset) * 60 * 1000);
  return isNaN(shifted.getTime()) ? null : shifted;
}

export interface FinancialYearDateRangeSource {
  StartDate?: DateRangeInput;
  EndDate?: DateRangeInput;
}

export interface DateRangeResult {
  fromDate: string | null;
  toDate: string | null;
}

export interface DateRangeBounds {
  minDate: NgbDateStruct | null;
  maxDate: NgbDateStruct | null;
}

// ── Voucher Period Grace Days ────────────────────────────────────────
export interface VoucherPeriodInfo {
  VoucherPeriodSid: number;
  StartDate: Date | string;
  EndDate: Date | string;
  APClosed: string;
  ARClosed: string;
  GLClosed: string;
  APGraceDays: number;
  ARGraceDays: number;
  GLGraceDays: number;
  PeriodName: string;
  Status: string;
}

export type VoucherModule = 'AR' | 'AP' | 'GL';

/**
 * Find the voucher period a date belongs to (date within StartDate..EndDate).
 */
export function findPeriodForDate(
  date: Date,
  periods: VoucherPeriodInfo[]
): VoucherPeriodInfo | null {
  if (!date || !periods || periods.length === 0) return null;

  // Normalize voucher date to UTC date-only (strip time) to avoid timezone shifts
  const dateTs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  for (const p of periods) {
    const s = new Date(p.StartDate);
    const e = new Date(p.EndDate);
    const startTs = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
    const endTs   = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
    if (dateTs >= startTs && dateTs <= endTs) {
      return p;
    }
  }
  return null;
}

/**
 * Check whether grace days have been exceeded for the selected voucher date.
 *
 * Logic:
 *  1. Find the period the voucher date falls into.
 *  2. If the module is closed for that period → blocked.
 *  3. Calculate graceDeadline = period.EndDate + graceDays.
 *     If today > graceDeadline → blocked with "Grace days exceeded" message.
 *  4. Otherwise → allowed.
 *
 * The datepicker should NOT have minDate/maxDate restrictions.
 */
export function getVoucherDateConstraints(
  voucherDate: Date,
  periods: VoucherPeriodInfo[],
  module: VoucherModule
): {
  isClosed: boolean;
  errorMessage: string | null;
} {
  const result: {
    isClosed: boolean;
    errorMessage: string | null;
  } = { isClosed: false, errorMessage: null };

  if (!voucherDate || !periods || periods.length === 0) return result;

  const period = findPeriodForDate(voucherDate, periods);
  if (!period) {
    result.isClosed = true;
    result.errorMessage = 'Selected date does not fall within any voucher period.';
    return result;
  }

  // Check if the module is closed for this period
  const closedKey = `${module}Closed` as keyof VoucherPeriodInfo;
  if (period[closedKey] === 'Y') {
    result.isClosed = true;
    result.errorMessage = `${period.PeriodName} month closed. Please contact your finance team.`;
    return result;
  }

  // --- Grace-days block ---
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();            // 0-indexed local month

  // Rule 1: voucher dated in today's calendar month → no grace check
  if (
    voucherDate.getUTCFullYear() === todayYear &&
    voucherDate.getUTCMonth() === todayMonth
  ) {
    return result;
  }

  // Use the voucher's own period grace days (e.g. March voucher → March grace).
  const graceDaysKey = `${module}GraceDays` as keyof VoucherPeriodInfo;
  const graceDays = Number(period[graceDaysKey]) || 0;

  // Rule 2: null / zero grace days → no restriction
  if (graceDays <= 0) return result;

  // Grace deadline = voucherDate + graceDays (inclusive boundary uses >=)
  const graceDeadlineTs = Date.UTC(
    voucherDate.getUTCFullYear(), voucherDate.getUTCMonth(), voucherDate.getUTCDate() + graceDays,
  );
  const todayTs = Date.UTC(todayYear, todayMonth, now.getDate());

  if (todayTs >= graceDeadlineTs) {
    result.isClosed = true;
    result.errorMessage = `Grace days of ${period.PeriodName} voucher booking exceeded`;
    return result;
  }

  return result;
}

export enum LeadStatus {
  Qualify = 'Qualify',
  Discovery = 'Discovery',
  MeetingScheduled = 'MeetingScheduled',
  MeetingCompleted = 'MeetingCompleted',
  EnquiryGenerated = 'EnquiryGenerated',
  QuotationCreated = 'QuotationCreated',
  QuotationConfirmed = 'QuotationConfirmed',
  ContractSigned = 'ContractSigned',
  DealWon = 'DealWon',
  DealLost = 'DealLost',
  CustomerCreated = 'CustomerCreated'
}


// Optional: map to readable labels
export const LeadStatusLabels: Record<LeadStatus, string> = {
  [LeadStatus.Qualify]: 'Qualify',
  [LeadStatus.Discovery]: 'Discovery',
  [LeadStatus.MeetingScheduled]: 'Meeting Scheduled',
  [LeadStatus.MeetingCompleted]: 'Meeting Completed',
  [LeadStatus.EnquiryGenerated]: 'Enquiry Generated',
  [LeadStatus.QuotationCreated]: 'Quotation Created',
  [LeadStatus.QuotationConfirmed]: 'Quotation Confirmed',
  [LeadStatus.ContractSigned]: 'Contract Signed',
  [LeadStatus.DealWon]: 'Deal Won',
  [LeadStatus.DealLost]: 'Deal Lost',
  [LeadStatus.CustomerCreated]: 'Customer Created'
};

export enum AuthorizationStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Counter = 'Counter'
}

export const AuthorizationStatusLabels: Record<AuthorizationStatus, string> = {
  [AuthorizationStatus.Pending]: 'Waiting for Approval',
  [AuthorizationStatus.Approved]: 'Approved',
  [AuthorizationStatus.Rejected]: 'Rejected',
  [AuthorizationStatus.Counter]: 'Counter'
};

export enum Status {
  Active = 'A',
  Suspended = 'S',
  Deleted = 'D',
}

/**
 * Retrieves and formats a port's name and code from a given list of ports.
 *
 * @param {Port[]} portList - The complete list of port objects.
 * Each port object must include at least `PortMasterSid`, `PortName`, and `PortCode` properties.
 * @param {number} PortMasterSid - The unique identifier (`PortMasterSid`) of the port to locate and format.
 * @returns {string} A formatted string in the format `"PortName - PortCode"`.
 * Returns an empty string (`''`) if:
 * - The `portList` is empty or undefined
 * - The `PortMasterSid` is invalid or not found in the list
 *
 * @example
 * const ports = [
 *   { PortMasterSid: 1, PortName: 'Chennai', PortCode: 'INMAA' },
 *   { PortMasterSid: 2, PortName: 'Mumbai', PortCode: 'INBOM' },
 * ];
 *
 * const result = getFormattedPort(ports, 2);
 * console.log(result); // "Mumbai - INBOM"
 */
export function getFormattedPort(portList: Port[], PortMasterSid: number): string {
  if (!PortMasterSid || portList.length === 0) {
    return '';
  }
  const ourPort = portList.find(p => p.PortMasterSid === PortMasterSid);
  return getConcatenatedPorts(ourPort?.PortName, ourPort?.PortCode);
}

/**
 * Concatenates a port's name and code into a formatted string.
 *
 * @param {string} portName - The name of the port.
 * @param {string} portCode - The code of the port.
 * @returns {string} A string formatted as `"PortName - PortCode"`.
 * Returns an empty string (`''`) if `portName` is missing or undefined.
 *
 * @example
 * const result = getConcatenatedPorts('Chennai', 'INMAA');
 * console.log(result); // "Chennai - INMAA"
 */
export function getConcatenatedPorts(portName: String, portCode: String): string {
  return portName ? `${portName} - ${portCode}` : '';
}

// Converts NgbDateStruct to a UTC-midnight Date
export function ngbDateStructToDate(date: NgbDateStruct | null): Date | null {
  if (!date) return null;
  return new Date(Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0, 0));
}

// Converts a JS Date to NgbDateStruct
export function toNgbDateStruct(
  date: Date | string | null
): NgbDateStruct | null {
  if (!date) return null;

  const d = (date instanceof Date) ? date : new Date(date);

  if (isNaN(d.getTime())) return null;

  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate()
  };
}


function isNgbDateStruct(value: DateRangeInput): value is NgbDateStruct {
  return !!value &&
    typeof value === 'object' &&
    !(value instanceof Date) &&
    typeof (value as NgbDateStruct).year === 'number' &&
    typeof (value as NgbDateStruct).month === 'number' &&
    typeof (value as NgbDateStruct).day === 'number';
}

// Always extracts the UTC calendar date — consistent with CustomDateAdapter which is UTC-only.
function toUtcDateOnly(value: DateRangeInput): Date | null {
  if (!value) return null;
  if (isNgbDateStruct(value)) {
    return new Date(Date.UTC(value.year, value.month - 1, value.day));
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  // String: extract YYYY-MM-DD directly to avoid any timezone shift
  const m = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

function startOfUtcDay(date: Date): Date {
  const d = new Date(date.getTime());
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfUtcDay(date: Date): Date {
  const d = new Date(date.getTime());
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// Clamps a UTC-midnight date within [min, max]. Inputs from toUtcDateOnly are always midnight.
function clampDate(date: Date, min: Date | null, max: Date | null): Date {
  if (min && max && max < min) return startOfUtcDay(min);
  if (min && date < min) return startOfUtcDay(min);
  if (max && date > max) return startOfUtcDay(max);
  return date;
}

function toUtcNgbDateStruct(date: Date): NgbDateStruct {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function getBoundedPresetDateRange(
  preset: string,
  options: {
    minDate?: DateRangeInput;
    maxDate?: DateRangeInput;
    referenceDate?: DateRangeInput;
  } = {}
): DateRangeResult {
  if (preset === 'all') return { fromDate: null, toDate: null };

  const min = toUtcDateOnly(options.minDate);
  const max = toUtcDateOnly(options.maxDate);
  const ref = toUtcDateOnly(options.referenceDate ?? new Date()) ?? startOfUtcDay(new Date());
  const effectiveTo = clampDate(ref, min, max);

  let fromDate: Date = effectiveTo;
  let toDate = effectiveTo;

  switch (preset) {
    case 'last30':      fromDate = addDays(effectiveTo, -30); break;
    case 'thisMonth':   fromDate = new Date(Date.UTC(effectiveTo.getUTCFullYear(), effectiveTo.getUTCMonth(), 1)); break;
    case 'lastMonth':
      fromDate = new Date(Date.UTC(effectiveTo.getUTCFullYear(), effectiveTo.getUTCMonth() - 1, 1));
      toDate = new Date(Date.UTC(effectiveTo.getUTCFullYear(), effectiveTo.getUTCMonth(), 0));
      break;
    case 'last2Months': fromDate = new Date(Date.UTC(effectiveTo.getUTCFullYear(), effectiveTo.getUTCMonth() - 2, 1)); break;
    case 'last3Months': fromDate = new Date(Date.UTC(effectiveTo.getUTCFullYear(), effectiveTo.getUTCMonth() - 3, 1)); break;
    default:            fromDate = addDays(effectiveTo, -30); break;
  }

  const boundedTo = clampDate(toDate, min, max);
  let boundedFrom = clampDate(fromDate, min, max);
  if (boundedFrom > boundedTo) boundedFrom = startOfUtcDay(boundedTo);

  return {
    fromDate: boundedFrom.toISOString(),
    toDate: endOfUtcDay(boundedTo).toISOString()
  };
}

export function getFinancialYearPresetDateRange(
  preset: string,
  financialYear: FinancialYearDateRangeSource | null | undefined,
  referenceDate: DateRangeInput = new Date()
): DateRangeResult {
  return getBoundedPresetDateRange(preset, {
    minDate: financialYear?.StartDate,
    maxDate: financialYear?.EndDate,
    referenceDate
  });
}

export function getFinancialYearDateRangeBounds(
  financialYear: FinancialYearDateRangeSource | null | undefined,
  referenceDate: DateRangeInput = new Date()
): DateRangeBounds {
  const fyStart = toUtcDateOnly(financialYear?.StartDate);
  const fyEnd = toUtcDateOnly(financialYear?.EndDate);
  if (!fyStart || !fyEnd) return { minDate: null, maxDate: null };

  const ref = toUtcDateOnly(referenceDate) ?? startOfUtcDay(new Date());
  return {
    minDate: toUtcNgbDateStruct(fyStart),
    maxDate: toUtcNgbDateStruct(clampDate(ref, fyStart, fyEnd))
  };
}


/**
 * Calculates the minimum allowed date based on a base date and tolerance.
 *
 * How it works:
 * 1. Validates that `baseDate` is a valid Date object.
 * 2. Subtracts `toleranceDays` from the base date.
 * 3. If `withinThisYear` is true, ensures the result does not go
 *    earlier than January 1st of the base date's year.
 * 4. Returns a **new Date instance** (original date is never mutated).
 *
 * @param baseDate - The reference date used to calculate the minimum date.
 * @param toleranceDays - Number of days allowed before the base date.
 *                         Must be a non-negative number. Default is `0`.
 * @param withinThisYear - If true, clamps the minimum date to
 *                         January 1st of the base date's year. Default is `false`.
 *
 * @returns A new Date representing the calculated minimum date.
 *
 * @throws {Error} If `baseDate` is not a valid Date.
 * @throws {Error} If `toleranceDays` is negative.
 *
 * @example
 * // Base date: 15 Mar 2025
 * getMinDate(new Date('2025-03-15'), 10);
 * // → 05 Mar 2025
 *
 * @example
 * // Clamped to start of year
 * getMinDate(new Date('2025-01-05'), 10, true);
 * // → 01 Jan 2025
 */
export function getMinDate(
  baseDate: Date,
  toleranceDays: number = 0,
  withinThisYear: boolean = false
): Date {
  // Validate inputs
  if (!(baseDate instanceof Date) || isNaN(baseDate.getTime())) {
    throw new Error('Invalid base date provided');
  }

  if (toleranceDays < 0) {
    throw new Error('toleranceDays must be non-negative');
  }

  // Create new date instance to avoid mutating the original
  const d = new Date(baseDate.getTime());
  d.setDate(d.getDate() - toleranceDays);

  if (withinThisYear) {
    const yearStart = new Date(baseDate.getFullYear(), 0, 1);
    // Set to start of day for consistent comparison
    yearStart.setHours(0, 0, 0, 0);

    if (d < yearStart) {
      return yearStart;
    }
  }

  return d;
}


export function getDefaultTodayDate(): Date {
  const now = new Date(); // local time

  return new Date(Date.UTC(
    now.getFullYear(),   // ✅ LOCAL year
    now.getMonth(),      // ✅ LOCAL month
    now.getDate(),       // ✅ LOCAL day
    0, 0, 0, 0
  ));
}

/**
 * Calculates the maximum allowed date based on a base date and tolerance.
 *
 * How it works:
 * 1. Validates that `baseDate` is a valid Date object.
 * 2. Adds `toleranceDays` to the base date.
 * 3. If `withinThisYear` is true, ensures the result does not go
 *    beyond December 31st of the base date's year.
 * 4. Returns a **new Date instance** (original date is never mutated).
 *
 * @param baseDate - The reference date used to calculate the maximum date.
 * @param toleranceDays - Number of days allowed after the base date.
 *                         Must be a non-negative number. Default is `0`.
 * @param withinThisYear - If true, clamps the maximum date to
 *                         December 31st of the base date's year. Default is `false`.
 *
 * @returns A new Date representing the calculated maximum date.
 *
 * @throws {Error} If `baseDate` is not a valid Date.
 * @throws {Error} If `toleranceDays` is negative.
 *
 * @example
 * // Base date: 15 Mar 2025
 * getMaxDate(new Date('2025-03-15'), 10);
 * // → 25 Mar 2025
 *
 * @example
 * // Clamped to end of year
 * getMaxDate(new Date('2025-12-25'), 10, true);
 * // → 31 Dec 2025 23:59:59.999
 */
export function getMaxDate(
  baseDate: Date,
  toleranceDays: number = 0,
  withinThisYear: boolean = false
): Date {
  // Validate inputs
  if (!(baseDate instanceof Date) || isNaN(baseDate.getTime())) {
    throw new Error('Invalid base date provided');
  }

  if (toleranceDays < 0) {
    throw new Error('toleranceDays must be non-negative');
  }

  // Create new date instance to avoid mutating the original
  const d = new Date(baseDate.getTime());
  d.setDate(d.getDate() + toleranceDays);

  if (withinThisYear) {
    const yearEnd = new Date(baseDate.getFullYear(), 11, 31, 23, 59, 59, 999);

    if (d > yearEnd) {
      return yearEnd;
    }
  }

  return d;
}

export function toNumber(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  
  const cleaned = value.toString().replace(/,/g, '');
  return parseFloat(cleaned) || 0;
}


/**
 * 
 * @param form FormGroup you want to check
 */
export function errorLogger(form: FormGroup | FormArray): void {
  console.log('Form Status:', form.status);
  console.log('Form Value', form.value);
  if (form.invalid) {
    const invalid = findInvalidControlsRecursive(form);
    console.log('Invalid controls:', invalid);
  } else {
    console.log('No invalid controls found.');
  }
}

export function findInvalidControlsRecursive(form: FormGroup | FormArray): string[] {
  let invalidControls: string[] = [];
  Object.keys(form.controls).forEach(key => {
    const control = (form as any).get(key);
    if (control.invalid) {
      invalidControls.push(key);
    }
    if (control instanceof FormGroup || control instanceof FormArray) {
      invalidControls = invalidControls.concat(
        findInvalidControlsRecursive(control).map(childKey => `${key}.${childKey}`)
      );
    }
  });
  return invalidControls;
}


