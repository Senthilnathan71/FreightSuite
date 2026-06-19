import { ValidationMessageConfig } from './error-handling/form-error-handler';

/**
 * Single source of truth for voucher field character limits.
 *
 * Values mirror the backend Prisma `@db.VarChar(n)` widths in
 * `crm-mobile-api/prisma/schema/voucher.prisma` and are organised by table, because
 * the same logical field has different widths per table (e.g. Narration/Remarks are
 * 300 on VoucherHeader/VoucherDetail but 100 on VoucherMatchingHeader / PaymentRequest).
 *
 * Use in reactive forms: `Validators.maxLength(VOUCHER_FIELD_LIMITS.header.Narration)`
 * and in templates: `[attr.maxlength]="LIMITS.header.Narration"`.
 */
export const VOUCHER_FIELD_LIMITS = {
  // VoucherHeader — INV, VIN, RPT, PMT, CRN, VRN, JV, NIN
  header: {
    VoucherNumber: 50,
    Narration: 300,
    Remarks: 300,
    PartyName: 100,
    PartyAddress: 300,
    DocumentNumber: 30,
    InstrumentNumber: 25,
    BankPartyName: 100,
    CreditNoteReason: 100,
    Salesman: 30,
    PlaceOfSupply: 50,
    State: 50,
    HouseNumber: 50,
    MasterNumber: 50,
    GST_VAT: 20,
    GSTType: 10,
    InvoiceType: 10,
    CurrencyCode: 3,
  },
  // VoucherDetail — per-row columns in voucher detail grids
  detail: {
    ChargeDescription: 100,
    Narration: 300,
    Remarks: 300,
    CurrencyCode: 3,
  },
  // VoucherOthers
  others: {
    Footer: 300,
    ContainerNumber: 100,
    VoucherNote: 200,
    IRNNumber: 100,
    IRNStatus: 10,
    IRNQRCode: 300,
  },
  // VoucherTDS — TDS sub-grid on payment / vendor-tds screens
  tds: {
    ITSectionCode: 100,
    CertificateNo: 50,
    NotificationNo: 50,
    Reason: 100,
  },
  // VoucherMatchingHeader — voucher-matching screen
  matching: {
    Narration: 100,
    Remarks: 100,
  },
  // PaymentRequest / PaymentRequestDetail — payment-request screen
  paymentRequest: {
    PayableTo: 100,
    Remarks: 100,
    ChargeDescription: 100,
  },
} as const;

/**
 * Standard validation messages shared by every voucher screen. Each screen supplies
 * only its field `labels`; the messages (required / maxlength / min / default) are
 * identical everywhere, so they live here once.
 */
export const VOUCHER_VALIDATION_MESSAGES: ValidationMessageConfig['messages'] = {
  required: (label: string) => `${label} is required`,
  maxlength: (label: string, error: any) =>
    `${label} must not exceed ${error.requiredLength} characters`,
  min: (label: string, error: any) => `${label} must be greater than ${error.min}`,
  default: (label: string) => `${label} is invalid`,
};

/**
 * Builds a `ValidationMessageConfig` from a per-screen labels map, wired to the shared
 * messages. Pass the result to `errorLoggerWithToastr(form, toastr, config)`.
 */
export function buildVoucherValidationConfig(
  labels: Record<string, string>,
): ValidationMessageConfig {
  return { labels, messages: VOUCHER_VALIDATION_MESSAGES };
}
