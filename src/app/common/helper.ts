import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import { Port } from "../modules/crm-mobile/Interfaces/port.interface";
import { AbstractControl, FormArray, FormGroup } from "@angular/forms";
import { ToastrService } from 'ngx-toastr';

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

  const ts = date.getTime();
  for (const p of periods) {
    const start = new Date(p.StartDate);
    const end = new Date(p.EndDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (ts >= start.getTime() && ts <= end.getTime()) {
      return p;
    }
  }
  return null;
}

/**
 * Compute minDate/maxDate NgbDateStruct for the datepicker based on period + grace days.
 * Returns { minDate, maxDate, isClosed, errorMessage }
 */
export function getVoucherDateConstraints(
  voucherDate: Date,
  periods: VoucherPeriodInfo[],
  module: VoucherModule
): {
  minDate: NgbDateStruct | null;
  maxDate: NgbDateStruct | null;
  isClosed: boolean;
  errorMessage: string | null;
} {
  const result: {
    minDate: NgbDateStruct | null;
    maxDate: NgbDateStruct | null;
    isClosed: boolean;
    errorMessage: string | null;
  } = { minDate: null, maxDate: null, isClosed: false, errorMessage: null };

  if (!voucherDate || !periods || periods.length === 0) return result;

  const period = findPeriodForDate(voucherDate, periods);
  if (!period) {
    result.errorMessage = 'Selected date does not fall within any voucher period.';
    return result;
  }

  // Check if the module is closed for this period
  const closedKey = `${module}Closed` as keyof VoucherPeriodInfo;
  if (period[closedKey] === 'Y') {
    result.isClosed = true;
    result.errorMessage = `${module} is closed for period "${period.PeriodName}".`;
    return result;
  }

  // Compute grace days constraint
  const graceDaysKey = `${module}GraceDays` as keyof VoucherPeriodInfo;
  const graceDays = Number(period[graceDaysKey]) || 0;

  const periodStart = new Date(period.StartDate);
  periodStart.setHours(0, 0, 0, 0);
  result.minDate = toNgbDateStruct(periodStart);

  const periodEnd = new Date(period.EndDate);
  periodEnd.setHours(0, 0, 0, 0);
  const maxDateValue = getMaxDate(periodEnd, graceDays);
  result.maxDate = toNgbDateStruct(maxDateValue);

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
  DealLost = 'DealLost'
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
  [LeadStatus.DealLost]: 'Deal Lost'
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
  
  return parseFloat(value.toString()) || 0;
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


