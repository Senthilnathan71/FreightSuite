/**
 * Configuration for the report column-customization ("New view") feature.
 *
 * The New view lets end-users rearrange / show-hide columns on flat (list-style)
 * reports. It is gated by the New/Classic switch (see ReportViewModeService) and
 * only applies to the reports listed in COLUMN_CUSTOMIZABLE_REPORTS below.
 */

/** Report view mode. */
export type ReportViewMode = 'NEW' | 'CLASSIC';

/** Company configuration flag (boolean / 'Y' | 'N') that sets the company-wide default mode. */
export const REPORT_COLUMN_CONFIG_NAME = 'EnableReportColumnCustomization';

/** localStorage key holding the per-user view-mode override ('NEW' | 'CLASSIC'). */
export const REPORT_VIEW_MODE_STORAGE_KEY = 'report-view-mode';

/** localStorage key prefix for a report's saved column layout: `report-columns:{ReportMasterSid}`. */
export const REPORT_COLUMN_LAYOUT_PREFIX = 'report-columns:';

/**
 * Reports eligible for the New (column-customizable) view, identified by their
 * registry `ReportName` (== ReportRegistryService id).
 *
 * ONLY genuinely flat, single-table list reports belong here — each row maps 1:1
 * to the same columns. Grouped / multi-level / financial-statement reports are
 * intentionally EXCLUDED because a flat column grid cannot represent their sections,
 * subtotals, merged/multi-level headers, or multi-table layouts (they would render
 * broken). Those stay on the Classic view. Excluded examples:
 *   ageing-report, outstanding-report, outstanding-local, trial-balance, profit-loss,
 *   balance-sheet, vat-report, Vat-Summary-Report, profit-summary-report,
 *   matching-list-report, cash-flow, subledger-outstanding, unbilled-cost-report,
 *   unbilled-revenue-report, profit-summary, comprehensive-management,
 *   tradelane-profitability, freight-mom-growth, daily-job-register.
 *
 * Note: a few list reports below carry a single appended total/grand-total row in
 * Classic. The New view renders the data rows only, so that summary row is not shown
 * in the New view or its export — use Classic when the totals row is required.
 *
 * Add a report's ReportName here to opt it into the feature.
 */
export const COLUMN_CUSTOMIZABLE_REPORTS: ReadonlyArray<string> = [
  // Operation list reports
  'bl-issue-list',
  'do-issue-list',
  'shipment-summary',
  'shipment-summary-details',
  'house-job-loss-report',
  'lost-customer-report',
  'destination-report',
  'export-job-volume-teu-report',
  'network-report',
  'not-booked-rates',
  'unpicked-cargo',
  'transhipment-cargo',
  'nomination-booking',
  'contanier-wise-kpi',
  'profitability-report',
  // Accounts / tax list reports
  'unposted-voucher-list',
  'top-n-customer',
  'statement-ledger-report',
  'ledger-report',
  'ledger-report-currenecy',
  'vat-receivable-report',
  'vat-payable-report',
  'GST-inward',
  'GST-outward',
  'GSTR',
];

/** True if the given report (by ReportName) supports the New column-customizable view. */
export function isColumnCustomizableReport(reportName?: string | null): boolean {
  return !!reportName && COLUMN_CUSTOMIZABLE_REPORTS.includes(reportName);
}

/** Persisted column layout for a single report. */
export interface ReportColumnLayout {
  /** Column keys in display order. */
  order: string[];
  /** Column keys that are hidden. */
  hidden: string[];
}

/** Definition of the bottom "Total" row for a report in the New view. */
export interface ReportTotalsConfig {
  /** Label shown in the first non-numeric column (default 'Total'). */
  label?: string;
  /** Column keys whose values are summed across the data rows. */
  sumKeys?: string[];
  /** Column keys that should display the LAST data row's value (e.g. running balance). */
  lastKeys?: string[];
}

/** Per-report overrides for the New view (data location + totals row). */
export interface ReportViewOverride {
  /**
   * Dot-path to the rows array inside the injected report payload
   * (e.g. 'transactions', 'data.inputTax'). When omitted, the rows are auto-detected.
   */
  dataPath?: string;
  /** Optional bottom totals row. */
  totals?: ReportTotalsConfig;
}

/**
 * Reports that need a specific rows location and/or a totals row in the New view.
 * Keys are registry `ReportName`s. Anything not listed uses auto row-detection and no totals.
 */
export const REPORT_VIEW_OVERRIDES: Record<string, ReportViewOverride> = {
  'statement-ledger-report': {
    dataPath: 'transactions',
    totals: { label: 'Total', sumKeys: ['signedLocalAmt'], lastKeys: ['cumulativeOutstanding'] },
  },
  'ledger-report': {
    dataPath: 'transactions',
    totals: { label: 'Total', sumKeys: ['signedLocalAmt'], lastKeys: ['cumulativeOutstanding'] },
  },
  'ledger-report-currenecy': {
    dataPath: 'transactions',
    totals: { label: 'Total', sumKeys: ['signedOriginalCurrency'], lastKeys: ['cumulativeOutstanding'] },
  },
  'vat-receivable-report': {
    dataPath: 'data.inputTax',
    totals: { label: 'Total', sumKeys: ['taxableAmt', 'taxAmt'] },
  },
  'vat-payable-report': {
    dataPath: 'data.outputTax',
    totals: { label: 'Total', sumKeys: ['taxableAmt', 'taxAmt'] },
  },
  'GST-inward': {
    dataPath: 'data.tableData',
    totals: {
      label: 'Total',
      sumKeys: [
        'TxnValue', 'TaxableValue', 'TaxCalculatedOn', 'IGST', 'CGST', 'SGST',
        'IGSTAmountRCM', 'CGSTAmountRCM', 'SGSTAmountRCM', 'TotalGST',
      ],
    },
  },
  'GST-outward': {
    dataPath: 'data.tableData',
    totals: {
      label: 'Total',
      sumKeys: [
        'TxnValue', 'TaxableValue', 'TaxCalculatedOn', 'IGST', 'CGST', 'SGST',
        'IGSTAmountRCM', 'CGSTAmountRCM', 'SGSTAmountRCM', 'TotalGST',
      ],
    },
  },
};
