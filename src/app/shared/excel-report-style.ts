/**
 * Shared, reusable styling for `xlsx-js-style` "styled complex report" exports.
 *
 * Centralises the colour palette, number formats, borders and the per-row-kind
 * cell-style builder so every styled export (e.g. the Salesman Ageing report)
 * shares one look and the theme can be tuned in a single place.
 *
 * `buildCellStyle()` returns a plain `xlsx-js-style` cell-style object (`s`) plus an
 * optional number format (`z`) — it has NO dependency on the xlsx library, so it can
 * be imported anywhere. Extra palette entries, formats and row kinds are included for
 * future reports even if not yet used.
 */

// xlsx-js-style expects 6-hex RGB strings WITHOUT the leading '#'.
export const EXCEL_PALETTE = {
  // Brand
  brand: '116897', // primary blue — table header background + report title
  brandDark: '0D527A', // darker brand — header borders / accents
  navy: '1B3A5C', // dark navy — section / emphasis text

  // Fills
  sectionFill: 'E9EEF5', // customer / section band
  subHeaderFill: 'EAF1FA', // secondary grouping header (future)
  subtotalFill: 'EFF4FB', // subtotal rows (future)
  grandTotalFill: 'DCE6F2', // grand total row
  totalFill: 'F2F2F2', // generic total row
  bandedFill: 'F7FAFC', // zebra striping for data rows (future)
  amberFill: 'FBF1DD', // highlight tint (e.g. Unallocated / On Account)

  // Status accents (future use)
  success: '16A34A',
  danger: 'DC2626',
  warning: 'D97706',
  info: '0369A1',

  // Neutrals
  border: 'D7DEE8',
  note: '666666',
  muted: '6B7280',
  white: 'FFFFFF',
  black: '000000',
} as const;

/** Excel number-format codes. */
export const EXCEL_FORMATS = {
  amount: '#,##0.00', // 2-dp money
  amountRed: '#,##0.00;[Red]-#,##0.00', // negatives in red (future)
  integer: '#,##0',
  percent: '0.00%',
  date: 'dd-mmm-yyyy',
} as const;

/** Back-compat alias for the default money format. */
export const EXCEL_NUMBER_FORMAT = EXCEL_FORMATS.amount;

const thin = (rgb: string = EXCEL_PALETTE.border) => ({ style: 'thin', color: { rgb } });

/** Thin border on all four sides (the default grid). */
export const EXCEL_THIN_BORDERS = {
  top: thin(),
  bottom: thin(),
  left: thin(),
  right: thin(),
};

/** Bottom-only thin border (future — e.g. underlined headers). */
export const EXCEL_BOTTOM_BORDER = { bottom: thin() };

/** Normalise a hex colour (with or without '#') to a 6-hex RGB string; fallback white. */
export function hexToRgb(hex: string): string {
  const h = String(hex || '')
    .replace('#', '')
    .toUpperCase();
  return /^[0-9A-F]{6}$/.test(h) ? h : EXCEL_PALETTE.white;
}

/** Row kinds understood by {@link buildCellStyle}. `data` (or anything unknown) = base style. */
export type ExcelRowKind =
  | 'company'
  | 'title'
  | 'info'
  | 'note'
  | 'header'
  | 'subHeader'
  | 'section'
  | 'data'
  | 'subtotal'
  | 'total'
  | 'grandTotal';

export interface CellStyleOptions {
  /** Cell holds a real number → right-align + number format. */
  isNumeric?: boolean;
  /** Per-cell fill override (hex, with or without '#') — wins over the row-kind fill. */
  fillColor?: string;
  /** Explicit alignment override (honoured for non-numeric cells). */
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
  /** Number-format override; defaults to {@link EXCEL_FORMATS.amount} for numeric cells. */
  numFmt?: string;
}

/**
 * Build the `xlsx-js-style` style for a cell of the given row kind.
 * @returns `{ s, z }` — `s` is the cell `.s` style object; `z` (when present) is the
 *          cell number format to assign to `.z`.
 */
export function buildCellStyle(
  kind: ExcelRowKind | string,
  opts: CellStyleOptions = {},
): { s: any; z?: string } {
  const { isNumeric, fillColor, alignment } = opts;
  const s: any = { font: {}, alignment: {}, border: EXCEL_THIN_BORDERS };

  switch (kind) {
    case 'company':
      s.font = { bold: true, sz: 14 };
      s.alignment = { horizontal: 'center', vertical: 'center' };
      s.border = undefined;
      break;
    case 'title':
      s.font = { bold: true, sz: 12, color: { rgb: EXCEL_PALETTE.brand } };
      s.alignment = { horizontal: 'center', vertical: 'center' };
      s.border = undefined;
      break;
    case 'info':
      s.font = { sz: 10 };
      s.alignment = { horizontal: 'left' };
      s.border = undefined;
      break;
    case 'note':
      s.font = { italic: true, sz: 9, color: { rgb: EXCEL_PALETTE.note } };
      s.alignment = { horizontal: 'left', wrapText: true };
      s.border = undefined;
      break;
    case 'header':
      s.font = { bold: true, color: { rgb: EXCEL_PALETTE.white } };
      s.fill = { patternType: 'solid', fgColor: { rgb: EXCEL_PALETTE.brand } };
      s.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
      break;
    case 'subHeader': // future: secondary grouping header
      s.font = { bold: true, color: { rgb: EXCEL_PALETTE.navy } };
      s.fill = { patternType: 'solid', fgColor: { rgb: EXCEL_PALETTE.subHeaderFill } };
      s.alignment = { horizontal: 'left', vertical: 'center' };
      break;
    case 'section':
      s.font = { bold: true, color: { rgb: EXCEL_PALETTE.navy } };
      s.fill = { patternType: 'solid', fgColor: { rgb: EXCEL_PALETTE.sectionFill } };
      s.alignment = { horizontal: 'left', vertical: 'center' };
      break;
    case 'subtotal': // future
      s.font = { bold: true, color: { rgb: EXCEL_PALETTE.navy } };
      s.fill = { patternType: 'solid', fgColor: { rgb: EXCEL_PALETTE.subtotalFill } };
      break;
    case 'grandTotal':
      s.font = { bold: true };
      s.fill = { patternType: 'solid', fgColor: { rgb: EXCEL_PALETTE.grandTotalFill } };
      break;
    case 'total':
      s.font = { bold: true };
      s.fill = { patternType: 'solid', fgColor: { rgb: EXCEL_PALETTE.totalFill } };
      break;
    // 'data' and anything unknown → base style only.
  }

  // Per-cell fill override (e.g. amber tint) wins over the row-kind fill.
  if (fillColor) {
    s.fill = { patternType: 'solid', fgColor: { rgb: hexToRgb(fillColor) } };
  }

  // Numeric cells get a number format + right alignment (skip the centred title rows).
  let z: string | undefined;
  if (isNumeric && kind !== 'company' && kind !== 'title') {
    z = opts.numFmt || EXCEL_FORMATS.amount;
    s.alignment = { ...s.alignment, horizontal: 'right' };
  } else if (alignment?.horizontal) {
    // Honour an explicit per-cell alignment (e.g. right-aligned band totals).
    s.alignment = { ...s.alignment, horizontal: alignment.horizontal };
  }

  return { s, z };
}
