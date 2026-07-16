/**
 * Invoice Without Tax PDF Generator
 * Mirrors invoice-without-tax.component.html (Dubai / VAT-only layout).
 * India-specific fields (HSN/SAC, CGST/SGST/UGST/IGST, IRN, PAN) are intentionally omitted.
 * Uses invoicePrintData for all display content.
 */

import { InvoicePdfData, InvoiceChargeData, InvoiceBankDetail } from '../interfaces/pdf-document.interfaces';
import { PdfTermItem } from '../interfaces/pdf-base.interface';
import { buildCompanyHeader } from '../builders/pdf-header.builder';
import { getPdfStyles, PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS } from '../styles/pdf-styles';
import { formatDate, formatNumberWithCommas } from '../helpers/pdf-formatters';

// HTML print logo uses 90px. pdfMake works in pt, so convert px -> pt (72/96).
const INVOICE_LOGO_HEIGHT_PX = 90;
const INVOICE_LOGO_HEIGHT_PT = INVOICE_LOGO_HEIGHT_PX * 0.75;
const CHARGES_TABLE_FONT_SIZE = 7;

// -----------------------------------------------------------------------------
// Dynamic currency formatting (ported from invoice-pdf.generator.ts).
// Every amount - line items AND totals - is formatted the same way, driven by the
// currency master config (GroupingStyle: Indian/International, GroupSeparator,
// amountDecimal), so grouping is consistent and never hardcoded.
// -----------------------------------------------------------------------------
function normalizeCurrencyCode(value: any): string {
  return String(value || '').trim().toUpperCase();
}

function getCurrencyMaster(data: InvoicePdfData): any[] {
  return Array.isArray((data as any).currencyMaster) ? (data as any).currencyMaster : [];
}

function findCurrencyBySid(data: InvoicePdfData, currencySid: any): any {
  const sid = Number(currencySid);
  if (!Number.isFinite(sid) || !sid) return null;
  return getCurrencyMaster(data).find((currency: any) =>
    Number(currency?.CurrencyMasterSid || currency?.currencyMasterSid || 0) === sid
  ) || null;
}

function findCurrencyByCode(data: InvoicePdfData, currencyCode: any): any {
  const code = normalizeCurrencyCode(currencyCode);
  if (!code) return null;
  return getCurrencyMaster(data).find((currency: any) =>
    normalizeCurrencyCode(currency?.currencyCode || currency?.CurrencyCode || currency?.code) === code
  ) || null;
}

function getCurrencyAmountDecimals(currency: any): number {
  const decimals = Number(currency?.amountDecimal ?? currency?.AmountDecimal);
  return Number.isFinite(decimals) ? decimals : 2;
}

function getCurrencyGroupingStyle(currency: any): 'Indian' | 'International' {
  return String(currency?.GroupingStyle || currency?.groupingStyle || '').trim() === 'Indian'
    ? 'Indian'
    : 'International';
}

function getCurrencyGroupSeparator(currency: any): string {
  return String(currency?.GroupSeparator || currency?.groupSeparator || '').trim() === 'Space'
    ? ' '
    : ',';
}

function groupIntegerPart(intDigits: string, style: 'Indian' | 'International', separator: string): string {
  if (style === 'Indian' && intDigits.length > 3) {
    const last3 = intDigits.slice(-3);
    const rest = intDigits.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, separator) + separator + last3;
  }
  return intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function formatCurrencyAmount(value: any, currency: any): string {
  const decimals = getCurrencyAmountDecimals(currency);
  const groupingStyle = getCurrencyGroupingStyle(currency);
  const groupSeparator = getCurrencyGroupSeparator(currency);
  const rounded = Number(parsePdfNumber(value).toFixed(decimals));
  const [intPart, decPart] = Math.abs(rounded).toFixed(decimals).split('.');
  const grouped = groupIntegerPart(intPart, groupingStyle, groupSeparator);
  const body = decPart ? `${grouped}.${decPart}` : grouped;
  return `${rounded < 0 ? '-' : ''}${body}`;
}

function getCompanyCurrency(data: InvoicePdfData): any {
  return findCurrencyBySid(data, (data.company as any)?.CurrencyMasterSid) ||
    findCurrencyByCode(data, data.localCurrency);
}

function getInvoiceCurrency(data: InvoicePdfData): any {
  return findCurrencyBySid(
    data,
    (data as any).invoicePrintData?.CurrencyMasterSid || (data.invoice as any)?.CurrencyMasterSid
  ) || findCurrencyByCode(data, data.invoice?.currencyCode || data.totals?.currency);
}

function getDetailCurrency(data: InvoicePdfData, detail: any): any {
  return findCurrencyBySid(data, detail?.CurrencyMasterSid || detail?.currencyMasterSid) ||
    findCurrencyByCode(data, detail?.CurrencyCode || detail?.currencyCode || detail?.currency);
}

function formatCompanyCurrencyAmount(data: InvoicePdfData, value: any): string {
  return formatCurrencyAmount(value, getCompanyCurrency(data));
}

function formatInvoiceCurrencyAmount(data: InvoicePdfData, value: any): string {
  return formatCurrencyAmount(value, getInvoiceCurrency(data));
}

function formatDetailCurrencyAmount(data: InvoicePdfData, detail: any, value: any): string {
  return formatCurrencyAmount(value, getDetailCurrency(data, detail));
}

/**
 * Generate invoice (without tax) PDF document definition
 */
export function generateInvoiceWithoutTaxDocument(data: InvoicePdfData): any {
  const chargesCount = data.charges?.length || 0;
  const resolvedTerms = getInvoiceTerms(data);
  const logoHeaderHeight = INVOICE_LOGO_HEIGHT_PT;
  // Reserved height for the repeating page header (company + title + Billed To block).
  // The Billed To block height varies with the billing-address line count, so the reserved
  // margin grows/shrinks with it -> content always sits snug (no fixed gap, no overlap).
  const headerPrintData = (data as any).invoicePrintData;
  const billingAddress = headerPrintData?.BillingAddress || data.invoice?.customerAddress || '';
  const billingAddressLineCount = billingAddress
    ? (String(billingAddress).split(/\r?\n/).filter((line: string) => line.trim()).length || 1)
    : 0;
  const LINE_HEIGHT = 11;                 // approx height of one Billed To line
  const baseTopMargin = 120 + billingAddressLineCount * LINE_HEIGHT;
  const extraTopMarginForLogo = Math.max(0, logoHeaderHeight - 55);
  // Dubai company: when VAT No is absent the company info stack is ~6pt shorter,
  // pulling the header bottom line above the first content line -> double-line.
  const companyVatNoForMargin = (data as any)?.companyVatNo || (data as any)?.companyPan || '';
  const extraTopMarginForVATLine = !companyVatNoForMargin ? -6 : 0;
  const dynamicTopMargin = baseTopMargin + extraTopMarginForLogo + extraTopMarginForVATLine;
  const configuredMargins = data.config?.pageMargins as number[] | undefined;
  const resolvedPageMargins = configuredMargins
    ? [
        configuredMargins[0] ?? 20,
        Math.max(configuredMargins[1] ?? dynamicTopMargin, dynamicTopMargin),
        configuredMargins[2] ?? 20,
        Math.max(configuredMargins[3] ?? 42, 42)
      ]
    : [20, dynamicTopMargin, 20, 42];

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: resolvedPageMargins,

    background: function (currentPage: number, pageSize: any) {
      return {
        canvas: [
          { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 0.5 },
          { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.5 },
          { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 0.5 },
          { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.5 }
        ]
      };
    },

    header: () => {
      return {
        stack: [
          buildInvoiceHeader(data),
          buildInvoiceTitle(data),
          buildInvoiceInfo(data)
        ],
        // Top >= ~12 so the company name clears the box's top border line (drawn at y=10).
        margin: [20, 14, 20, 0]
      };
    },

    content: [
      buildShipmentDetails(data),
      buildChargesTable(data),
      buildAmountInWords(data),
      ...(data.invoice?.remarks ? [buildRemarks(data.invoice.remarks)] : []),
      ...(buildContainerDetails(data) ? [buildContainerDetails(data)] : []),
      ...buildBankDetailsSection(data),
      ...(resolvedTerms.length > 0 ? [buildTermsSectionWithBullets(resolvedTerms)] : []),
      ...buildAuthorisedSignatory(data)
    ],
    footer: (currentPage: number, pageCount: number) => buildInvoiceFooter(data, currentPage, pageCount),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

function buildInvoiceFooter(data: InvoicePdfData, currentPage: number, pageCount: number): any {
  return {
    margin: [24, 22, 24, 0],
    columns: [
      { text: `Printed By : ${data.userData?.userName || ''}`, alignment: 'left', width: '25%', fontSize: 7, noWrap: true },
      {
        text: 'This document is computer-generated and does not require a signature.',
        alignment: 'center',
        width: '*',
        fontSize: 7,
        noWrap: true
      },
      {
        text: `Printed On : ${formatDate(new Date())}  Page: ${currentPage} of ${pageCount}`,
        alignment: 'right',
        width: '30%',
        fontSize: 7,
        noWrap: true
      }
    ]
  };
}

/**
 * Build invoice header - reuses the shared company header builder.
 * For Dubai (country != 'in') it renders the VAT No line automatically.
 */
function buildInvoiceHeader(data: InvoicePdfData): any {
  const PAGE_LEFT = -10;
  const PAGE_RIGHT = 565;

  const bottomLine = {
    canvas: [{
      type: 'line',
      x1: PAGE_LEFT,
      y1: 0,
      x2: PAGE_RIGHT,
      y2: 0,
      lineWidth: 0.5
    }],
    margin: [0, 0, 0, 6]
  };

  return [
    buildCompanyHeader({
      ...data,
      showTaxRegistration: true
    }),
    bottomLine
  ];
}

/**
 * Build invoice title - "INVOICE"
 */
function buildInvoiceTitle(data: InvoicePdfData): any {
  const title = 'INVOICE';
  return {
    stack: [
      {
        text: title,
        style: 'Invoice',
        alignment: 'center',
        bold: true,
        fontSize: 12,
        margin: [0, 0, 0, 6]
      }
    ]
  };
}

/**
 * Build invoice info section - Billed To + Invoice No/Date + VAT No (no IRN/PAN)
 */
function buildInvoiceInfo(data: InvoicePdfData): any {
  const invoice = data.invoice;
  const printData = (data as any).invoicePrintData;

  const RIGHT_LABEL_WIDTH = 89;
  const COLON_WIDTH = 6;

  const billedTo = printData?.BilledTo || invoice?.customerName || '';
  const billingAddress = printData?.BillingAddress || invoice?.customerAddress || '';

  const leftStack: any[] = [
    { text: 'Billed To', style: 'labelBold', margin: [0, 0, 0, 3] },
    { text: billedTo, margin: [0, 0, 0, 3] }
  ];

  if (billingAddress) {
    leftStack.push({ text: billingAddress, margin: [0, 0, 0, 3] });
  }

  const rightStack: any[] = [];

  rightStack.push({
    columns: [
      { text: 'Invoice No', width: RIGHT_LABEL_WIDTH, style: 'labelBold' },
      { text: ':', width: COLON_WIDTH },
      { text: printData?.InvoiceNo || invoice?.invoiceNo || '', width: '*' }
    ],
    margin: [0, 0, 0, 5]
  });

  rightStack.push({
    columns: [
      { text: 'Invoice Date', width: RIGHT_LABEL_WIDTH, style: 'labelBold' },
      { text: ':', width: COLON_WIDTH },
      {
        text: printData?.InvoiceDate ? formatDate(printData.InvoiceDate) : formatDate(invoice?.invoiceDate),
        width: '*'
      }
    ],
    margin: [0, 0, 0, 5]
  });

  if (rightStack.length > 0) {
    rightStack[rightStack.length - 1].margin = [0, 0, 0, 0];
  }

  const twoColumnLayout = {
    columns: [
      { width: '50%', stack: leftStack },
      { width: '50%', stack: rightStack }
    ],
    columnGap: 0,
    margin: [15, 0, 0, 0]
  };

  // No bottom line here: buildShipmentDetails draws the separator line for us.
  return {
    stack: [twoColumnLayout],
    margin: [0, 0, 0, 0]
  };
}

/**
 * Build shipment details + simple cargo table (Pkg / Commodity Desc / Gross Wt / CBM|Charge Wt)
 */
function buildShipmentDetails(data: InvoicePdfData): any {
  const invoice = data.invoice;
  const printData = (data as any).invoicePrintData;
  const cargo = data.cargoDetails;
  const isSeaMode = data.isSeaMode !== false;
  const PAGE_LEFT = -10;
  const PAGE_RIGHT = 565;
  const companyCountry = String((data as any)?.companyCountryCode || getNormalizedCompanyCountry(data))
    .trim()
    .toLowerCase();
  const isUAECompany = companyCountry === 'ae' || companyCountry === 'uae' || companyCountry === 'dubai';

  const RIGHT_LABEL_WIDTH = 88;
  const COLON_WIDTH = 5;
  const vesselValue = printData?.Vessel || invoice?.vesselName || '';
  const voyageValue = printData?.VoyageNo || invoice?.voyageNo || '';
  const etdValue = printData?.ETD ? formatDate(printData.ETD) : formatDate(invoice?.etd || '');
  const etaValue = printData?.ETA ? formatDate(printData.ETA) : formatDate(invoice?.eta || '');

  const leftItems: { label: string; value: string }[] = [
    { label: 'Shipper', value: printData?.ShipperName || invoice?.shipperName || '' },
    { label: 'Consignee', value: printData?.ConsigneeName || invoice?.consigneeName || '' },
    {
      label: `${isSeaMode ? 'Vsl Name' : 'Flight Name'} / ${isSeaMode ? 'Voy No.' : 'No.'}`,
      value: `${vesselValue}${vesselValue && voyageValue ? ' / ' : ''}${voyageValue}`
    },
    { label: 'Ref No.', value: printData?.DocumentNumber || invoice?.shipperRefNo || '' },
    { label: 'Loading Port', value: printData?.POL || invoice?.loadingPort || invoice?.pol || '' },
    { label: 'Final Destination', value: printData?.FPD || invoice?.finalDestination || invoice?.fpd || '' },
    {
      label: 'ETD / ETA',
      value: `${etdValue}${etdValue && etaValue ? ' / ' : ''}${etaValue}`
    },
    ...(isUAECompany
      ? [
          { label: 'BOE No.', value: printData?.BOENo || '' },
          { label: 'Declaration No.', value: printData?.DeclarationNo || printData?.declarationNo || '' }
        ]
      : [])
  ];

  const dueDate = printData?.InvoiceDueDate || invoice?.invoiceDueDate || invoice?.dueDate;
  const currExRate =
    printData?.CurrExRate ||
    (invoice?.currencyCode && invoice?.exchangeRate
      ? `${invoice.currencyCode} / ${invoice.exchangeRate}`
      : invoice?.currencyCode || '');

  const rightItems: { label: string; value: string }[] = [
    ...(printData?.IsServiceJob !== 'Y' && printData?.JobType !== 'Agent'
      ? [{ label: isSeaMode ? 'HBL' : 'HAWB', value: printData?.HBLNo || invoice?.hblNo || '' }]
      : []),
    ...(printData?.IsServiceJob !== 'Y'
      ? [{ label: isSeaMode ? 'MBL' : 'MAWB', value: printData?.MBLNo || invoice?.mblNo || '' }]
      : []),
    { label: 'Job No.', value: printData?.MasterJobNumber || invoice?.jobNo || '' },
    { label: 'Freight Terms', value: printData?.FreightTerms || invoice?.freightTerms || '' },
    { label: 'Booking No.', value: printData?.BookingNumber || invoice?.bookingNo || '' },
    { label: 'Invoice Due Date', value: dueDate === 'Cash Invoice' ? 'Cash Invoice' : (dueDate ? formatDate(dueDate) : '') },
    { label: 'Currency / Ex-Rate', value: currExRate }
  ];

  const leftStack = leftItems.map(item => ({
    columns: [
      { text: item.label, width: RIGHT_LABEL_WIDTH, style: 'labelBold' },
      { text: ':', width: COLON_WIDTH },
      { text: item.value, width: '*' }
    ],
    margin: [10, 2, 0, 3]
  }));

  const rightStack: any[] = rightItems.map(item => ({
    columns: [
      { text: item.label, width: RIGHT_LABEL_WIDTH, style: 'labelBold' },
      { text: ':', width: COLON_WIDTH },
      { text: item.value, width: '*' }
    ],
    margin: [0, 2, 0, 2]
  }));

  // Simple cargo table (matches invoice-without-tax HTML)
  const grossWt = Number(printData?.grosswt ?? cargo?.grossWeight ?? 0);
  const metric = Number(isSeaMode ? (printData?.cbm ?? cargo?.cbm ?? 0) : (printData?.ChargeableWeight ?? cargo?.chargeableWeight ?? 0));

  const cargoHeaderRow: any[] = [
    { text: 'Pkg', style: 'tableHeader', alignment: 'center' },
    { text: 'Commodity Desc', style: 'tableHeader', alignment: 'center' },
    { text: 'Gross Wt.', style: 'tableHeader', alignment: 'center' },
    { text: isSeaMode ? 'CBM' : 'Charge Wt.', style: 'tableHeader', alignment: 'center' }
  ];

  const cargoBodyRow: any[] = [
    { text: String(printData?.pkg ?? cargo?.packages ?? ''), alignment: 'right' },
    { text: printData?.desc || cargo?.commodityDesc || '' },
    { text: formatNumberWithCommas(grossWt, 3), alignment: 'right' },
    { text: formatNumberWithCommas(metric, 3), alignment: 'right' }
  ];

  const cargoTableBlock = {
    table: {
      headerRows: 1,
      widths: ['15%', '45%', '20%', '20%'],
      body: [cargoHeaderRow, cargoBodyRow]
    },
    layout: PDF_TABLE_LAYOUTS.bordered,
    margin: [0, 6, 0, 10]
  };

  const rightColumnStack = [...rightStack, cargoTableBlock];

  const detailsTable = {
    table: {
      widths: ['50%', '50%'],
      body: [[
        { stack: leftStack, margin: [5, 2, 5, 2] },
        { stack: rightColumnStack, margin: [5, 2, 0, 2] }
      ]]
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 0]
  };

  return {
    stack: [
      {
        canvas: [{
          type: 'line',
          x1: PAGE_LEFT,
          y1: 0,
          x2: PAGE_RIGHT,
          y2: 0,
          lineWidth: 0.5
        }],
        margin: [0, 6, 0, 4]
      },
      detailsTable
    ],
    margin: [0, 0, 0, 0]
  };
}

/**
 * Build charges table - VAT-only (no HSN/SAC, no India GST columns)
 */
function buildChargesTable(data: InvoicePdfData): any {
  const charges = data.charges || [];
  const printData = (data as any).invoicePrintData;
  const voucherDetails = printData?.voucherDetails || [];

  const localCurrency = data.localCurrency || 'AED';
  const invoiceCurr = data.invoice?.currencyCode;
  const grandTotal = printData?.totalPartyAmount || data.totals?.grandTotal || 0;
  const hasForeignCurrencyColumn = !!(invoiceCurr && invoiceCurr !== localCurrency);

  const displayDetails = voucherDetails.length > 0 ? voucherDetails : charges;

  const softenLongTokens = (value: any): string => {
    const input = String(value || '');
    if (!input) return '';
    const withBreakableSeparators = input
      .replace(/,/g, ',​')
      .replace(/\//g, '/​')
      .replace(/-/g, '-​');
    return withBreakableSeparators.replace(/([^\s​]{14})(?=[^\s​])/g, '$1​');
  };

  if (!displayDetails.length) return { text: '' };

  /* ---------------- HEADER ---------------- */
  const headerRow: any[] = [
    { text: 'S.No.', style: 'tableHeaderSmall', alignment: 'center', noWrap: true },
    { text: 'Particulars', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'Curr.', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'Unit', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'Rate', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'ROE', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'Amt', style: 'tableHeaderSmall', alignment: 'center' }
  ];

  headerRow.push({
    text: `Amt In ${localCurrency}`,
    style: 'tableHeaderSmall',
    alignment: 'center'
  });

  if (hasForeignCurrencyColumn) {
    headerRow.push({
      text: `Amt In ${invoiceCurr}`,
      style: 'tableHeaderSmall',
      alignment: 'center'
    });
  }

  /* ---------------- ROWS ---------------- */
  const dataRows = displayDetails.map((detail: any, index: number) => {
    const row: any[] = [
      { text: detail.Sno || index + 1, style: 'tableCellSmall', alignment: 'center' },
      {
        text: softenLongTokens(detail.ChargeDescription || detail.chargeName || ''),
        style: 'tableCellSmall',
        noWrap: false,
        lineHeight: 1.1
      },
      { text: detail.CurrencyCode || detail.currencyCode || '', style: 'tableCellSmall', alignment: 'center' },
      { text: detail.NumberOfUnit || formatNumberWithCommas(detail.qty, 3), style: 'tableCellSmall', alignment: 'right', noWrap: true },
      { text: formatDetailCurrencyAmount(data, detail, detail.Rate ?? detail.rate), style: 'tableCellSmall', alignment: 'right' },
      { text: detail.ExchangeRate || formatNumberWithCommas(detail.roe || 1, 4), style: 'tableCellSmall', alignment: 'right', noWrap: true },
      { text: formatCompanyCurrencyAmount(data, detail.TaxableAmount ?? detail.taxableAmount ?? detail.amount), style: 'tableCellSmall', alignment: 'right', noWrap: true }
    ];

    row.push({
      text: formatCompanyCurrencyAmount(data, detail.LocalAmount ?? detail.localAmount),
      style: 'tableCellSmall',
      alignment: 'right',
      noWrap: true
    });

    if (hasForeignCurrencyColumn) {
      row.push({
        text: formatInvoiceCurrencyAmount(data, detail.PartyAmount ?? detail.partyAmount),
        style: 'tableCellSmall',
        alignment: 'right',
        noWrap: true
      });
    }

    return row;
  });

  /* ---------------- TOTAL ROW ---------------- */
  const totalRow: any[] = buildWithoutTaxTotalRow(data, displayDetails, hasForeignCurrencyColumn, grandTotal);

  const applyFontSize = (cells: any[]): any[] =>
    cells.map((cell) => ({ fontSize: CHARGES_TABLE_FONT_SIZE, ...cell }));

  /* ---------------- WIDTHS ---------------- */
  const widths: (number | string)[] = [
    16,    // S.No
    '*',   // Particulars
    16,    // Curr
    40,    // Qty
    35,    // Rate
    35,    // ROE
    70     // Amt
  ];

  widths.push(70); // Amt in Local Currency
  if (hasForeignCurrencyColumn) widths.push(70); // Amt in Party Currency

  return {
    table: {
      headerRows: 1,
      widths,
      body: [applyFontSize(headerRow), ...dataRows.map(applyFontSize), applyFontSize(totalRow)]
    },
    layout: PDF_TABLE_LAYOUTS.bordered,
    // Negative side margins extend the table out to the page border box (removes the inset).
    margin: [-10, 0, -10, 2]
  };
}

function getNormalizedCompanyCountry(data: InvoicePdfData): string {
  return String(
    data.company?.countryCode ||
    data.branch?.countryCode ||
    (data.company as any)?.country ||
    (data.branch as any)?.country ||
    ''
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

/**
 * Total row - "Total" label under the Amt column, with the summed amounts under BOTH
 * currency columns: Amt In {local} and Amt In {foreign}.
 * Column order: S.No, Particulars, Curr, Unit, Rate, ROE, Amt, Amt In {local}, [Amt In {foreign}].
 */
function buildWithoutTaxTotalRow(data: InvoicePdfData, details: any[], hasForeignCurrencyColumn: boolean, grandTotal: any): any[] {
  const localTotal = (details || []).reduce(
    (acc: number, d: any) => acc + parsePdfNumber(d?.LocalAmount ?? d?.localAmount), 0);
  const partyTotal = parsePdfNumber(grandTotal) ||
    (details || []).reduce((acc: number, d: any) => acc + parsePdfNumber(d?.PartyAmount ?? d?.partyAmount), 0);

  const totalRow: any[] = [];
  // 6 empty cells: S.No, Particulars, Curr, Unit, Rate, ROE
  for (let i = 0; i < 6; i++) {
    totalRow.push({ text: '', style: 'tableCellSmall' });
  }
  // "Total" label sits under the Amt column
  totalRow.push({ text: 'Total', style: 'tableCellBoldSmall', alignment: 'right' });

  if (hasForeignCurrencyColumn) {
    // Amt In {local} + Amt In {foreign}
    totalRow.push(
      { text: formatCompanyCurrencyAmount(data, localTotal), style: 'tableCellBoldSmall', alignment: 'right', noWrap: true },
      { text: formatInvoiceCurrencyAmount(data, partyTotal), style: 'tableCellBoldSmall', alignment: 'right', noWrap: true }
    );
  } else {
    // Only Amt In {local} column present
    totalRow.push(
      { text: formatInvoiceCurrencyAmount(data, partyTotal), style: 'tableCellBoldSmall', alignment: 'right', noWrap: true }
    );
  }

  return totalRow;
}

function parsePdfNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  return Number(String(value).replace(/,/g, '')) || 0;
}

/**
 * Build amount in words
 */
function buildAmountInWords(data: InvoicePdfData): any {
  const printData = (data as any).invoicePrintData;
  const amountInWords = printData?.AmountInWords || data.amountInWords;

  if (!amountInWords) {
    return { text: '' };
  }

  return {
    margin: [0, 0, 0, 0],
    columns: [
      { width: 88, text: 'Amount In Words', style: 'labelBold' , fontSize:8},
      { width: 0, text: ':' },
      { width: '*', text: amountInWords }
    ],
    columnGap: 5
  };
}

/**
 * Build remarks
 */
function buildRemarks(remarks: string): any {
  if (!remarks) {
    return { text: '' };
  }

  return {
    margin: [0, 2, 0, 2],
    columns: [
      { width: 90, text: 'Remarks', style: 'labelBold' , fontSize:8},
      { width: 10, text: ':', alignment: 'center' },
      { width: '*', text: remarks }
    ]
  };
}

/**
 * Build container number / type line (matches the HTML "Cont No. / Type" row).
 * Returns null when there is no container info.
 */
function buildContainerDetails(data: InvoicePdfData): any | null {
  const printData = (data as any).invoicePrintData;
  const containerNumber = printData?.ContainerNumber || '';
  const containerType = printData?.ContainerType || '';

  if (!containerNumber && !containerType) {
    return null;
  }

  const value = containerNumber && containerType
    ? `${containerNumber} / ${containerType}`
    : (containerNumber || containerType);

  return {
    margin: [0, 2, 0, 2],
    columns: [
      { width: 90, text: 'Cont No. / Type', style: 'labelBold' },
      { width: 10, text: ':', alignment: 'center' },
      { width: '*', text: value }
    ]
  };
}

/**
 * Build bank details section - IBAN (VAT mode)
 */
function buildBankDetailsSection(data: InvoicePdfData): any[] {
  const bankDetails = data.bankDetails || [];

  if (bankDetails.length === 0) return [];

  const getBankValue = (bank: any, ...keys: string[]): string => {
    for (const key of keys) {
      const value = bank?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value);
      }
    }
    return '';
  };

  const getBankCurrencyCode = (bank: any): string =>
    getBankValue(bank, 'CurrencyCode', 'currencyCode', 'bankCurrencyCode') ||
    data.invoice?.currencyCode ||
    data.localCurrency ||
    '';

  const validBanks = bankDetails.filter((bank: any) =>
    getBankValue(bank, 'BeneficiaryName', 'beneficiaryName', 'AccountName', 'accountName') ||
    getBankValue(bank, 'BankAccountNo', 'accountNo') ||
    getBankValue(bank, 'BankName', 'bankName') ||
    getBankValue(bank, 'IFSCCode', 'ifscCode', 'IBAN', 'iban') ||
    getBankValue(bank, 'BankCode', 'swiftCode') ||
    getBankValue(bank, 'BankAddress', 'bankAddress', 'Address', 'address') ||
    getBankValue(bank, 'BranchName', 'branchName')
  );

  if (validBanks.length === 0) return [];

  const banksToDisplay = validBanks;

  const headers = [
    { text: 'Details', style: 'tableHeader', alignment: 'center' , fontSize:7}
  ];

  for (let i = 0; i < banksToDisplay.length; i++) {
    const currencyCode = getBankCurrencyCode(banksToDisplay[i]);
    headers.push({
      text: currencyCode ? `Bank (${currencyCode})` : `Bank ${i + 1}`,
      style: 'tableHeader',
      alignment: 'center',
      fontSize:7
    });
  }

  const rows: any[] = [headers];

  const pushRow = (label: string, valueFor: (bank: any) => string) => {
    const row: any[] = [{ text: label, style: 'labelBold', alignment: 'left', fontSize: 7 }];
    for (let i = 0; i < banksToDisplay.length; i++) {
      row.push({ text: valueFor(banksToDisplay[i]), alignment: 'left', noWrap: false, fontSize: 7 } as any);
    }
    rows.push(row);
  };

  pushRow('Beneficiary Name', (b) => getBankValue(b, 'BeneficiaryName', 'beneficiaryName', 'AccountName', 'accountName'));
  pushRow('Account No.', (b) => getBankValue(b, 'BankAccountNo', 'accountNo'));
  pushRow('IBAN', (b) => getBankValue(b, 'IFSCCode', 'iban', 'IBAN', 'ifscCode'));
  pushRow('Swift Code', (b) => getBankValue(b, 'BankCode', 'swiftCode'));
  pushRow('Bank Name', (b) => getBankValue(b, 'BankName', 'bankName'));
  pushRow('Branch', (b) => getBankValue(b, 'BankAddress', 'bankAddress', 'Address', 'address', 'BranchName', 'branchName'));

  const DETAILS_COLUMN_WIDTH = 110;
  const widths: (number | string)[] = [DETAILS_COLUMN_WIDTH];

  if (banksToDisplay.length === 1) {
    widths.push('auto');
  } else {
    for (let i = 0; i < banksToDisplay.length; i++) {
      widths.push('*');
    }
  }

  const bankTable = {
    table: {
      headerRows: 1,
      widths: widths,
      body: rows,
      dontBreakRows: true
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingLeft: () => 3,
      paddingRight: () => 3,
      paddingTop: () => 2,
      paddingBottom: () => 2
    },
    margin: [0, 0, 0, 5],
    style: { noWrap: false }
  };

  return [
    {
      stack: [
        { text: 'Bank Details', bold: true, fontSize: 8, margin: [0, 10, 0, 3] },
        bankTable
      ],
      unbreakable: true
    }
  ];
}

/**
 * Build terms section with bullet points
 */
function buildTermsSectionWithBullets(terms: (PdfTermItem | string)[]): any {
  if (!terms || terms.length === 0) {
    return { text: '' };
  }

  const termsList = terms.map((term) => (typeof term === 'string' ? term : term.content));

  return {
    stack: [
      { text: 'Terms and Conditions', style: 'sectionTitle', margin: [0, 10, 0, 5] , fontSize:8},
      { ul: termsList, margin: [0, 0, 0, 6] }
    ],
    margin: [0, 0, 0, 8]
  };
}

function getInvoiceTerms(data: InvoicePdfData): PdfTermItem[] {
  const companyMasterSid = Number((data.company as any)?.CompanyMasterSid || (data as any)?.companyMasterSid || 0);

  if (companyMasterSid === 13) {
    return [
      { content: 'If any discrepancy is noticed in the invoice, kindly inform us in writing within 7 days, otherwise the above amount will be considered as correct.' },
      { content: 'Please mention our invoice number(s) on your remittance instructions.' }
    ];
  }

  return (data.terms || []).filter((term) => {
    const content = typeof term === 'string' ? term : term?.content;
    return !!String(content || '').trim();
  }) as PdfTermItem[];
}

/**
 * Build authorised signatory
 */
function buildAuthorisedSignatory(data: InvoicePdfData): any[] {
  if (data.authorisedSignatory === false) {
    return [];
  }

  const companyName = data.company?.companyName || '';

  return [{
    text: [
      ...(companyName ? [{ text: `For ${companyName}\n`, bold: false }] : []),
      { text: 'Authorised Signatory', bold: true }
    ],
    alignment: 'right',
    margin: [0, 8, 0, 0],
    unbreakable: true
  }];
}

/**
 * Transform API data to InvoicePdfData format
 * IMPORTANT: This receives the RAW API data (invoiceData), not invoicePrintData
 */
export function transformInvoiceWithoutTaxApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  lookups?: {
    hssacMaster?: any[];
    currencyMaster?: any[];
  },
  options?: {
    taxDisplayConfig?: {
      showCGST: boolean;
      showSGST: boolean;
      showIGST: boolean;
      showVAT: boolean;
    };
    bankDetails?: any[];
    terms?: any[];
    amountInWords?: string;
    localCurrency?: string;
    invoiceTitle?: string;
    isSeaMode?: boolean;
    isVATMode?: boolean;
    companyCountryCode?: string;
    companyVatNo?: string;
    printSettings?: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
    shipmentDetails?: any;
    cargoDetails?: any;
    invoicePrintData?: any;
    containerTypeList?: any[];
  }
): InvoicePdfData {
  const invoice = apiData;
  const masterJob = invoice.masterJob;
  const houseJob = invoice.houseJob;
  const bookingHeader = invoice.BookingHeader;

  const isHouseJobInvoice = !!(houseJob && masterJob);
  const isBookingInvoice = !!invoice.BookingHeaderSid;

  const vesselName = isHouseJobInvoice
    ? houseJob?.masterJob?.VesselName || masterJob?.VesselName
    : (isBookingInvoice ? bookingHeader?.VesselName : masterJob?.VesselName) || '';
  const voyageNo = isHouseJobInvoice
    ? houseJob?.masterJob?.VoyageNo || masterJob?.VoyageNo
    : (isBookingInvoice ? bookingHeader?.VoyageNo : masterJob?.VoyageNo) || '';

  const pol = isHouseJobInvoice
    ? houseJob?.masterJob?.POL || masterJob?.POL
    : (isBookingInvoice ? bookingHeader?.POL : masterJob?.POL) || '';
  const pod = isHouseJobInvoice
    ? houseJob?.masterJob?.POD || masterJob?.POD
    : (isBookingInvoice ? bookingHeader?.POD : masterJob?.POD) || '';

  const voucherDetails = (invoice.VoucherDetail || [])
    .filter((d: any) => d.IsAutoGenerated !== 'Y')
    .map((detail: any, index: number): InvoiceChargeData => ({
      sno: index + 1,
      chargeName: detail.ChargeDescription || '',
      hsnSacCode: '',
      drCr: detail.DrCr || 'D',
      unit: '',
      qty: Number(detail.NumberOfUnit) || 0,
      currency: detail.CurrencyCode || '',
      currencyCode: detail.CurrencyCode || '',
      rate: Number(detail.Rate) || 0,
      amount: Number(detail.Amount) || 0,
      exchangeRate: Number(detail.ExchangeRate) || 1,
      roe: Number(detail.ExchangeRate) || 1,
      taxableAmount: Number(detail.TaxableAmount) || 0,
      cgstPercent: 0,
      cgstAmount: 0,
      sgstPercent: 0,
      sgstAmount: 0,
      igstPercent: 0,
      igstAmount: 0,
      vatPercent: Number(detail.TaxPercentage1) || 0,
      vatAmount: Number(detail.TaxAmount1) || 0,
      localAmount: Number(detail.LocalAmount) || 0,
      partyAmount: Number(detail.PartyAmount) || 0
    }));

  const subTotal = voucherDetails.reduce((sum: number, charge: InvoiceChargeData) => {
    const amount = charge.taxableAmount || charge.amount || 0;
    return charge.drCr === 'C' ? sum + amount : sum - amount;
  }, 0);

  const taxAmount = voucherDetails.reduce((sum: number, charge: InvoiceChargeData) => {
    return sum + (charge.vatAmount || 0);
  }, 0);

  const grandTotal = voucherDetails.reduce((sum: number, charge: InvoiceChargeData) => {
    const amount = charge.partyAmount || charge.localAmount || charge.amount || 0;
    return charge.drCr === 'C' ? sum + amount : sum - amount;
  }, 0);

  const bankDetails: InvoiceBankDetail[] = (options?.bankDetails || []).map((bank: any) => ({
    bankName: bank.BankName || bank.bankName || '',
    branchName: bank.BranchName || bank.branchName || '',
    accountNo: bank.BankAccountNo || bank.accountNo || '',
    ifscCode: bank.IFSCCode || bank.ifscCode || '',
    swiftCode: bank.BankCode || bank.swiftCode || '',
    iban: bank.IFSCCode || bank.IBAN || bank.iban || '',
    bankAddress: bank.BankAddress || bank.bankAddress || bank.Address || bank.address || '',
    beneficiaryName: bank.BeneficiaryName || bank.beneficiaryName || bank.AccountName || bank.accountName || '',
    currencyCode: bank.CurrencyCode ||
      bank.currencyCode ||
      bank.currencyMaster?.currencyCode ||
      lookups?.currencyMaster?.find((currency: any) =>
        Number(currency?.CurrencyMasterSid) === Number(bank.CurrencyMasterSid || bank.currencyMasterSid)
      )?.currencyCode ||
      ''
  }));

  const terms: PdfTermItem[] = (options?.terms || []).map((term: any) => ({
    content: term?.TandC || term?.Terms || term?.content || ''
  })).filter((term: PdfTermItem) => !!String(term.content || '').trim());

  const result: any = {
    apiData,
    company: {
      companyName: company?.companyName || '',
      CompanyMasterSid: company?.CompanyMasterSid,
      addressLine1: company?.addressLine1 || company?.Address || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || '',
      countryCode: company?.countryMaster?.countryCode || company?.countryCode || '',
      country: company?.countryMaster?.countryName || company?.countryName || '',
      postalCode: company?.postal_code || company?.ZipCode || '',
      phoneNumber: company?.phoneNumber || company?.Phone || ''
    },
    branch: {
      branchName: branch?.branchName || '',
      addressLine1: branch?.addressLine1 || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || '',
      countryCode: branch?.countryMaster?.countryCode || branch?.countryCode || company?.countryMaster?.countryCode || company?.countryCode || '',
      country: branch?.countryMaster?.countryName || branch?.countryName || company?.countryMaster?.countryName || company?.countryName || '',
      postalCode: branch?.postalCode || '',
      phoneNumber: branch?.phoneNumber || '',
      cityMaster: branch?.cityMaster
    },
    userData: {
      userName: userData?.userName || '',
      email: userData?.email || ''
    },
    logo,
    invoiceTitle: options?.invoiceTitle || 'INVOICE',
    companyGstCode: branch?.taxRegistrationNo || company?.GST_VAT || '',
    companyCountryCode: options?.companyCountryCode,
    companyPan: company?.Pan || company?.PAN || '',
    invoice: {
      invoiceNo: invoice.VoucherNumber || '',
      invoiceDate: invoice.VoucherDate,
      dueDate: invoice.DueDate,
      customerName: invoice.PartyName || invoice.subledgerMaster?.SubledgerName || '',
      customerAddress: invoice.PartyAddress || invoice.subledgerMaster?.Address || '',
      customerGstVat: invoice.GST_VAT || '',
      jobNo: masterJob?.MasterJobNumber || '',
      hblNo: houseJob?.HBLNo || '',
      mblNo: masterJob?.MBLNo || '',
      bookingNo: isHouseJobInvoice
        ? houseJob?.BookingNo
        : (isBookingInvoice ? bookingHeader?.BookingNo : ''),
      vesselVoyage: vesselName && voyageNo ? `${vesselName} / ${voyageNo}` : (vesselName || voyageNo || ''),
      pol,
      pod,
      fpd: isHouseJobInvoice
        ? houseJob?.FPD
        : (isBookingInvoice ? bookingHeader?.FPD : masterJob?.FPD) || '',
      placeOfSupply: invoice.PlaceOfSupply || '',
      exchangeRate: Number(invoice.ExchangeRate) || 1,
      currencyCode: invoice.CurrencyCode || '',
      postStatus: invoice.PostStatus || 'U',
      remarks: invoice.Remarks || '',
      salesPerson: '',
      shipperName: options?.shipmentDetails?.shipper || (isHouseJobInvoice
        ? houseJob?.ShipperName
        : (isBookingInvoice ? bookingHeader?.ShipperName : '')),
      consigneeName: options?.shipmentDetails?.consignee || (isHouseJobInvoice
        ? houseJob?.ConsigneeName
        : (isBookingInvoice ? bookingHeader?.ConsigneeName : '')),
      freightTerms: isHouseJobInvoice
        ? houseJob?.FreightTerms
        : (isBookingInvoice ? bookingHeader?.FreightTerms : masterJob?.FreightPPCC) || '',
      irnNumber: invoice.IRNNumber || '',
      jobType: isHouseJobInvoice ? houseJob?.JobType : (isBookingInvoice ? bookingHeader?.JobType : masterJob?.JobType) || '',
      IsServiceJob: isHouseJobInvoice ? houseJob?.IsServiceJob : '',
      vesselName: options?.shipmentDetails?.vesselName || vesselName,
      voyageNo: options?.shipmentDetails?.voyageNo || voyageNo,
      flightName: options?.shipmentDetails?.flightName || '',
      flightNo: options?.shipmentDetails?.flightNo || '',
      shipperRefNo: options?.shipmentDetails?.shipperRefNo || '',
      loadingPort: options?.shipmentDetails?.loadingPort || pol,
      finalDestination: options?.shipmentDetails?.finalDestination || (isHouseJobInvoice
        ? houseJob?.FPD
        : (isBookingInvoice ? bookingHeader?.FPD : masterJob?.FPD)) || '',
      etd: options?.shipmentDetails?.etd || '',
      eta: options?.shipmentDetails?.eta || '',
      invoiceDueDate: options?.shipmentDetails?.invoiceDueDate || invoice.DueDate || '',
      containerType: '',
      containerNumber: masterJob?.ContainerNumber || houseJob?.ContainerNumber || ''
    },
    charges: voucherDetails,
    totals: {
      subTotal: Math.abs(subTotal),
      taxAmount: Math.abs(taxAmount),
      grandTotal: Math.abs(grandTotal),
      currency: invoice.CurrencyCode || options?.localCurrency || ''
    },
    bankDetails,
    terms,
    amountInWords: options?.amountInWords || '',
    localCurrency: options?.localCurrency || '',
    taxDisplayConfig: options?.taxDisplayConfig || {
      showCGST: false,
      showSGST: false,
      showUGST: false,
      showIGST: false,
      showVAT: true
    },
    companyVatNo: options?.companyVatNo || branch?.taxRegistrationNo || company?.GST_VAT || '',
    isSeaMode: options?.isSeaMode,
    isVATMode: options?.isVATMode,
    printSettings: options?.printSettings || {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    },
    authorisedSignatory: true,
    cargoDetails: options?.cargoDetails,
    currencyMaster: lookups?.currencyMaster || [],
    invoicePrintData: options?.invoicePrintData
  };

  return result;
}
