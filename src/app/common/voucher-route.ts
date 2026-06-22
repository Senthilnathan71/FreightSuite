/**
 * Single source of truth for voucher-type → entry-screen routing.
 *
 * Maps a voucher type — either a code (e.g. 'RPT') or a full DocumentTypeName
 * (e.g. 'Receipt'), case-insensitive — to its entry-screen route. Use this for
 * EVERY voucher-entry navigation in the app (list → entry, drill-down hyperlinks
 * and in-screen self-navigation) so route paths live in exactly one place. The
 * only intentional exceptions are AR-AP and cost-entry, which route by deliberate
 * revenue/cost grouping rather than per voucher type.
 *
 * Three entry points:
 *   - getVoucherEntryRoute(type)         → base route string (no id), e.g. for "Create new"
 *   - getVoucherEntryLink(type, sid)     → [route, id] array for [routerLink], or null
 *   - navigateToVoucherEntry(router, …)  → imperative navigation from TS handlers
 *
 * Returns null / false when the type is unknown (or the sid is invalid), so callers
 * can render plain text or apply their own fallback route.
 */
import { NavigationExtras, Router } from '@angular/router';

export const VOUCHER_ROUTE_MAP: Record<string, string> = {
  INV: '/operation/invoice/entry',
  INVOICE: '/operation/invoice/entry',
  VIN: '/operation/vendor-invoice/entry',
  'VENDOR INVOICE': '/operation/vendor-invoice/entry',
  RPT: '/accounts/receipt/entry',
  RECEIPT: '/accounts/receipt/entry',
  PMT: '/accounts/payment/entry',
  PAYMENT: '/accounts/payment/entry',
  'PAYMENT VOUCHER': '/accounts/payment/entry',
  JV: '/accounts/journal-voucher/entry',
  'JOURNAL VOUCHER': '/accounts/journal-voucher/entry',
  IJV: '/accounts/journal-voucher/entry',
  'INTER BRANCH JOURNAL VOUCHER': '/accounts/journal-voucher/entry',
  RJV: '/accounts/reverse-voucher/entry',
  'REVERSAL JOURNAL VOUCHER': '/accounts/reverse-voucher/entry',
  CRN: '/operation/credit-note/entry',
  'CREDIT NOTE': '/operation/credit-note/entry',
  VRN: '/operation/vendor-credit-note/entry',
  'VENDOR CREDIT NOTE': '/operation/vendor-credit-note/entry',
  NIN: '/accounts/invoice-non-job/entry',
  'NON JOB INVOICE': '/accounts/invoice-non-job/entry',
  PRQ: '/operation/payment-request/entry',
  'PAYMENT REQUEST': '/operation/payment-request/entry',
  // NOTE: VM is keyed by VoucherMatchingHeaderSid (not VoucherHeaderSid) — pass the
  // matching header sid when routing a Voucher Matching record.
  VM: '/accounts/voucher-matching/entry',
  'VOUCHER MATCHING': '/accounts/voucher-matching/entry',
};

/** Canonical voucher-type codes — reference these instead of magic strings. */
export const VoucherType = {
  INVOICE: 'INV',
  VENDOR_INVOICE: 'VIN',
  RECEIPT: 'RPT',
  PAYMENT: 'PMT',
  JOURNAL: 'JV',
  INTER_BRANCH_JV: 'IJV',
  REVERSAL_JV: 'RJV',
  CREDIT_NOTE: 'CRN',
  VENDOR_CREDIT_NOTE: 'VRN',
  NON_JOB_INVOICE: 'NIN',
  PAYMENT_REQUEST: 'PRQ',
  VOUCHER_MATCHING: 'VM',
} as const;

export type VoucherTypeCode = (typeof VoucherType)[keyof typeof VoucherType];

/** Base entry route for a voucher type (no id). Null when the type is unknown. */
export function getVoucherEntryRoute(
  voucherType: string | number | null | undefined,
): string | null {
  const type = String(voucherType ?? '')
    .trim()
    .toUpperCase();
  if (!type) {
    return null;
  }
  return VOUCHER_ROUTE_MAP[type] ?? null;
}

/**
 * [routerLink] array for a voucher's entry screen, e.g. ['/accounts/receipt/entry', '123'].
 * Returns null when the type is unknown or the sid is invalid (caller renders plain text).
 */
export function getVoucherEntryLink(
  voucherType: string | number | null | undefined,
  voucherHeaderSid: string | number | null | undefined,
): string[] | null {
  const route = getVoucherEntryRoute(voucherType);
  const sid = Number(voucherHeaderSid);
  if (!route || !Number.isFinite(sid) || sid <= 0) {
    return null;
  }
  return [route, sid.toString()];
}

/**
 * Imperative voucher-entry navigation for component handlers.
 * - Omit the sid (or pass null/empty) to open the blank "create" screen.
 * - opts.queryParams / opts.extras are forwarded to Router.navigate.
 * - opts.fallback is used when the type is unknown (e.g. the reverse-voucher default).
 * Returns false when there is nothing to navigate to.
 */
export function navigateToVoucherEntry(
  router: Router,
  voucherType: string | number | null | undefined,
  voucherHeaderSid?: string | number | null,
  opts?: {
    queryParams?: Record<string, any>;
    fallback?: string[];
    extras?: NavigationExtras;
  },
): boolean {
  const base = getVoucherEntryRoute(voucherType);
  let commands: string[] | null = null;
  if (base) {
    const hasSid =
      voucherHeaderSid !== null &&
      voucherHeaderSid !== undefined &&
      String(voucherHeaderSid).trim() !== '';
    commands = hasSid ? [base, String(voucherHeaderSid)] : [base];
  } else if (opts?.fallback) {
    commands = opts.fallback;
  }
  if (!commands) {
    return false;
  }
  const extras: NavigationExtras = { ...(opts?.extras ?? {}) };
  if (opts?.queryParams) {
    extras.queryParams = opts.queryParams;
  }
  void router.navigate(commands, extras);
  return true;
}
