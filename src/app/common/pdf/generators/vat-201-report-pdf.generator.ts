import { PdfBranchInfo, PdfCompanyInfo, PdfUserInfo } from '../interfaces/pdf-base.interface';
import { getPdfStyles } from '../styles/pdf-styles';

interface Vat201TaxRow {
  LedgerName: string;
  TaxableAmount: number;
  TaxAmount: number;
}

interface Vat201AnnexureRow {
  VoucherDate: any;
  VoucherNumber: string;
  LedgerName: string;
  PartyName: string;
  TaxableAmount: number;
  TaxAmount: number;
}

export interface Vat201ReportPdfData {
  company: PdfCompanyInfo;
  branch: PdfBranchInfo;
  userData: PdfUserInfo;
  logo?: string;
  printSettings?: {
    logoPosition: 'left' | 'center' | 'right';
    companyPosition: 'left' | 'center' | 'right';
    companyAlignment: 'left' | 'center' | 'right';
  };
  orientation?: 'portrait' | 'landscape';
  reportTitle: string;
  params: any;
  fullData: any;
  branchName: string;

  summary: any;
  payment: any;

  localOutputTax: Vat201TaxRow[];
  overseasOutputTax: Vat201TaxRow[];
  localInputTax: Vat201TaxRow[];
  overseasInputTax: Vat201TaxRow[];

  localSalesTaxableTotal: number;
  localSalesTaxTotal: number;
  overseasSalesTaxableTotal: number;
  overseasSalesTaxTotal: number;
  localPurchaseTaxableTotal: number;
  localPurchaseTaxTotal: number;
  overseasPurchaseTaxableTotal: number;
  overseasPurchaseTaxTotal: number;

  grandSalesTaxableTotal: number;
  grandSalesTaxTotal: number;
  grandPurchaseTaxableTotal: number;
  grandPurchaseTaxTotal: number;

  vatPayableAmountLocal: number;
  vatPayableAmountOversea: number;

  taxEqualSalesLocal: Vat201AnnexureRow[];
  taxEqualSalesOverseas: Vat201AnnexureRow[];
  taxEqualPurchaseLocal: Vat201AnnexureRow[];
  taxEqualPurchaseOverseas: Vat201AnnexureRow[];
}

export function transformVat201ReportData(
  rawData: any,
  company: PdfCompanyInfo,
  branch: PdfBranchInfo,
  userData: PdfUserInfo,
  logo?: string,
  orientation: 'portrait' | 'landscape' = 'portrait',
  printSettings?: {
    logoPosition: 'left' | 'center' | 'right';
    companyPosition: 'left' | 'center' | 'right';
    companyAlignment: 'left' | 'center' | 'right';
  }
): Vat201ReportPdfData {
  const fullData = rawData || {};
  const params = fullData?.param || fullData?.params || {};

  const localOutputTax: Vat201TaxRow[] = fullData?.outputTax?.local || [];
  const overseasOutputTax: Vat201TaxRow[] = fullData?.outputTax?.overseas || [];
  const localInputTax: Vat201TaxRow[] = fullData?.inputTax?.local || [];
  const overseasInputTax: Vat201TaxRow[] = fullData?.inputTax?.overseas || [];

  const localSalesTaxableTotal = sumBy(localOutputTax, 'TaxableAmount');
  const localSalesTaxTotal = sumBy(localOutputTax, 'TaxAmount');
  const overseasSalesTaxableTotal = sumBy(overseasOutputTax, 'TaxableAmount');
  const overseasSalesTaxTotal = sumBy(overseasOutputTax, 'TaxAmount');
  const localPurchaseTaxableTotal = sumBy(localInputTax, 'TaxableAmount');
  const localPurchaseTaxTotal = sumBy(localInputTax, 'TaxAmount');
  const overseasPurchaseTaxableTotal = sumBy(overseasInputTax, 'TaxableAmount');
  const overseasPurchaseTaxTotal = sumBy(overseasInputTax, 'TaxAmount');

  const grandSalesTaxableTotal = localSalesTaxableTotal + overseasSalesTaxableTotal;
  const grandSalesTaxTotal = localSalesTaxTotal + overseasSalesTaxTotal;
  const grandPurchaseTaxableTotal = localPurchaseTaxableTotal + overseasPurchaseTaxableTotal;
  const grandPurchaseTaxTotal = localPurchaseTaxTotal + overseasPurchaseTaxTotal;

  const vatPayableAmountLocal = grandSalesTaxableTotal - grandPurchaseTaxableTotal;
  const vatPayableAmountOversea = grandSalesTaxTotal - grandPurchaseTaxTotal;

  const taxEquals = fullData?.annexure?.taxEqualsTaxable || [];

  return {
    company,
    branch,
    userData,
    logo,
    printSettings: printSettings || {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    },
    orientation,
    reportTitle: 'VAT-201 Report',
    params,
    fullData,
    branchName: fullData?.BranchName || '',

    summary: fullData?.summary || {},
    payment: fullData?.payment || {},

    localOutputTax,
    overseasOutputTax,
    localInputTax,
    overseasInputTax,

    localSalesTaxableTotal,
    localSalesTaxTotal,
    overseasSalesTaxableTotal,
    overseasSalesTaxTotal,
    localPurchaseTaxableTotal,
    localPurchaseTaxTotal,
    overseasPurchaseTaxableTotal,
    overseasPurchaseTaxTotal,

    grandSalesTaxableTotal,
    grandSalesTaxTotal,
    grandPurchaseTaxableTotal,
    grandPurchaseTaxTotal,

    vatPayableAmountLocal,
    vatPayableAmountOversea,

    taxEqualSalesLocal: filterAnnexure(taxEquals, 'Output', 'Local'),
    taxEqualSalesOverseas: filterAnnexure(taxEquals, 'Output', 'Overseas'),
    taxEqualPurchaseLocal: filterAnnexure(taxEquals, 'Input', 'Local'),
    taxEqualPurchaseOverseas: filterAnnexure(taxEquals, 'Input', 'Overseas')
  };
}

export function generateVat201ReportDocument(data: Vat201ReportPdfData): any {
  return {
    pageSize: 'A4',
    pageOrientation: data.orientation || 'portrait',
    pageMargins: [18, 118, 18, 30],
    background: (_: number, pageSize: any) => ({
      canvas: [{
        type: 'rect',
        x: 12,
        y: 12,
        w: pageSize.width - 24,
        h: pageSize.height - 24,
        lineWidth: 1,
        lineColor: '#000'
      }]
    }),
    header: () => buildHeader(data),
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    content: [
      buildSummaryTable(data),
      buildSalesTable(data),
      buildPurchaseTable(data),
      buildPaymentTable(data),
      ...buildAnnexure(data)
    ],
    styles: getStyles(),
    defaultStyle: {
      fontSize: 8,
      color: '#000'
    }
  };
}

function buildHeader(data: Vat201ReportPdfData): any {
  const company = data.company;
  const branch = data.branch;
  const printSettings = data.printSettings || {
    logoPosition: 'left' as const,
    companyPosition: 'center' as const,
    companyAlignment: 'center' as const
  };
  const city = branch?.cityMaster?.cityName || branch?.cityName || company?.city || '';
  const postalCode = branch?.postalCode || company?.postalCode || '';
  const phone = branch?.phoneNumber || company?.phoneNumber || '';
  const addressLine2 = branch?.addressLine2 || company?.addressLine2 || '';
  const cityLine: any[] = [];

  const appendText = (text: string | any[]) => {
    if (cityLine.length) cityLine.push({ text: ', ' });
    if (Array.isArray(text)) {
      cityLine.push(...text);
    } else {
      cityLine.push({ text });
    }
  };

  if (addressLine2) appendText(addressLine2);
  if (city) appendText(city);
  if (postalCode) appendText([{ text: 'Postal Code : ', bold: true }, { text: postalCode }]);
  if (phone) appendText([{ text: 'Ph.no : ', bold: true }, { text: phone }]);

  const companyInfoStack: any[] = [
    { text: (company?.companyName || '').toUpperCase(), style: 'headerCompany', alignment: printSettings.companyAlignment },
    { text: branch?.branchName || '', style: 'headerBranch', alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    { text: branch?.addressLine1 || company?.addressLine1 || '', style: 'headerAddress', alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    { text: cityLine, style: 'headerAddress', alignment: printSettings.companyAlignment, margin: [0, 2, 0, 0], noWrap: true }
  ];

  const slotAlign: Record<'left' | 'center' | 'right', 'left' | 'center' | 'right'> = {
    left: 'left',
    center: 'center',
    right: 'right'
  };

  const buildSlot = (slot: 'left' | 'center' | 'right') => {
    const stack: any[] = [];
    if (printSettings.logoPosition === slot && data.logo) {
      stack.push({ image: data.logo, fit: [50, 50], width: 56, alignment: slotAlign[slot], margin: [8, 0, 15, 0] });
    }
    if (printSettings.companyPosition === slot) {
      const companyMargin = slot === 'right'
        ? (stack.length ? [0, 4, 18, 0] : [0, 0, 18, 0])
        : (stack.length ? [0, 4, 0, 0] : [0, 0, 0, 0]);
      stack.push({ stack: companyInfoStack, margin: companyMargin });
    }
    return { stack };
  };

  return {
    stack: [
      {
        table: {
          widths: getHeaderWidths(printSettings.logoPosition, printSettings.companyPosition),
          body: [[buildSlot('left'), buildSlot('center'), buildSlot('right')]]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 4
        }
      },
      {
        text: data.reportTitle,
        style: 'reportTitle',
        margin: [0, 0, 0, 8]
      },
      {
        columns: [
          {
            width: '55%',
            stack: [
              buildFilterRow('From Date', formatDateValue(data.params?.FromDate)),
              buildFilterRow('To Date', formatDateValue(data.params?.ToDate))
            ]
          },
          { width: '*', text: '' },
          {
            width: '30%',
            stack: [
              buildFilterRow('Branch', data.branchName || 'All')
            ]
          }
        ],
        margin: [0, 0, 0, 6]
      }
    ],
    margin: [18, 18, 18, 6]
  };
}

function getHeaderWidths(
  logoPosition: 'left' | 'center' | 'right',
  companyPosition: 'left' | 'center' | 'right'
): any[] {
  if (companyPosition === 'center' && logoPosition !== 'center') {
    return [110, '*', 110];
  }

  if (companyPosition === 'right' && logoPosition === 'left') {
    return [110, '*', 300];
  }

  if (companyPosition === 'left' && logoPosition === 'right') {
    return [300, '*', 110];
  }

  return ['33%', '34%', '33%'];
}

/* ================= Voucher Summary ================= */
function buildSummaryTable(data: Vat201ReportPdfData): any {
  const summary = data.summary || {};
  const body: any[] = [
    [
      { text: 'Particulars', style: 'tableHeader', alignment: 'left' },
      { text: 'Voucher Count', style: 'tableHeader', alignment: 'center' }
    ],
    summaryRow('Total Vouchers', summary.totalVouchers || 0, true),
    summaryRow('Included in Return', summary.vouchersWithTaxLedger || 0),
    summaryRow('Not relevant for this Return', summary.vouchersWithoutTaxLedger || 0),
    summaryRow('Uncertain Transactions (Corrections needed)', 0),
    summaryRow('Information required for generating Audit File not provided', summary.unpostedVoucher || 0, true)
  ];

  return {
    table: {
      headerRows: 1,
      widths: ['*', 110],
      body
    },
    layout: tableLayout(),
    margin: [0, 0, 0, 10]
  };
}

function summaryRow(label: string, value: any, bold = false): any[] {
  return [
    { text: label, style: bold ? 'boldCell' : 'tableCell', alignment: 'left' },
    { text: String(value), style: bold ? 'boldCell' : 'tableCell', alignment: 'right' }
  ];
}

/* ================= Sales (Outwards) ================= */
function buildSalesTable(data: Vat201ReportPdfData): any {
  const body: any[] = [
    [
      { text: 'Particulars', style: 'tableHeader', alignment: 'left' },
      { text: 'Taxable Amount', style: 'tableHeader', alignment: 'center' },
      { text: 'Tax Amount', style: 'tableHeader', alignment: 'center' }
    ],
    sectionRow('Sales (Outwards) :'),
    sectionRow('Local Supplies')
  ];

  data.localOutputTax.forEach(item => body.push(amountRow(item)));
  body.push(totalRow('Total Local Supplies', data.localSalesTaxableTotal, data.localSalesTaxTotal));

  body.push(sectionRow('Outside GCC Supplies'));
  data.overseasOutputTax.forEach(item => body.push(amountRow(item)));
  body.push(totalRow('Total Outside GCC Supplies', data.overseasSalesTaxableTotal, data.overseasSalesTaxTotal));

  body.push(grandTotalRow('GRAND TOTAL – SALES (OUTWARDS)', data.grandSalesTaxableTotal, data.grandSalesTaxTotal));

  return {
    table: {
      headerRows: 1,
      widths: ['*', 110, 110],
      body
    },
    layout: tableLayout(),
    margin: [0, 0, 0, 10]
  };
}

/* ================= Purchases (Inwards) ================= */
function buildPurchaseTable(data: Vat201ReportPdfData): any {
  const body: any[] = [
    sectionRow('Purchases (Inwards) :'),
    sectionRow('Local Purchases')
  ];

  data.localInputTax.forEach(item => body.push(amountRow(item)));
  body.push(totalRow('Total Local Purchases', data.localPurchaseTaxableTotal, data.localPurchaseTaxTotal));

  body.push(sectionRow('Outside GCC Purchases'));
  data.overseasInputTax.forEach(item => body.push(amountRow(item)));
  body.push(totalRow('Total Outside GCC Purchases', data.overseasPurchaseTaxableTotal, data.overseasPurchaseTaxTotal));

  body.push(grandTotalRow('GRAND TOTAL – PURCHASES (INWARDS)', data.grandPurchaseTaxableTotal, data.grandPurchaseTaxTotal));

  body.push([
    { text: 'PAYABLE', style: 'grandTotalLabelCell', colSpan: 2, alignment: 'left' },
    {},
    { text: formatNumber(data.vatPayableAmountOversea), style: 'grandTotalValueCell', alignment: 'right', noWrap: true }
  ]);

  return {
    table: {
      headerRows: 0,
      widths: ['*', 110, 110],
      body
    },
    layout: tableLayout(),
    margin: [0, 0, 0, 10]
  };
}

/* ================= Payment Details ================= */
function buildPaymentTable(data: Vat201ReportPdfData): any {
  const payment = data.payment || {};
  const period = (data.params?.FromDate && data.params?.ToDate)
    ? `${formatDateValue(data.params.FromDate)} - ${formatDateValue(data.params.ToDate)}`
    : '';

  const body: any[] = [
    [
      { text: 'Payment Details', style: 'tableHeader', alignment: 'left' },
      { text: period, style: 'tableHeader', alignment: 'right', colSpan: 2 },
      {}
    ],
    paymentRow('Tax payment (included)', payment.totalPaymentVoucher || 0),
    paymentRow('Tax payments (not included/uncertain)', payment.totalWithoutPayment || 0),
    paymentRow('Tax paid at customs', ''),
    paymentRow('VAT Paid', '', true),
    [
      { text: 'Balance VAT Payable', style: 'grandTotalLabelCell', alignment: 'left' },
      { text: formatNumber(data.vatPayableAmountLocal), style: 'grandTotalValueCell', alignment: 'right', noWrap: true },
      { text: formatNumber(data.vatPayableAmountOversea), style: 'grandTotalValueCell', alignment: 'right', noWrap: true }
    ]
  ];

  return {
    table: {
      headerRows: 1,
      widths: ['*', 110, 110],
      body
    },
    layout: tableLayout(),
    margin: [0, 0, 0, 10]
  };
}

function paymentRow(label: string, value: any, bold = false): any[] {
  return [
    { text: label, style: bold ? 'boldCell' : 'tableCell', alignment: 'left', colSpan: 2 },
    {},
    { text: value === '' ? '' : String(value), style: bold ? 'boldCell' : 'tableCell', alignment: 'right' }
  ];
}

/* ================= Annexure ================= */
function buildAnnexure(data: Vat201ReportPdfData): any[] {
  const hasAny =
    data.taxEqualSalesLocal.length ||
    data.taxEqualSalesOverseas.length ||
    data.taxEqualPurchaseLocal.length ||
    data.taxEqualPurchaseOverseas.length;

  if (!hasAny) return [];

  const content: any[] = [
    { text: 'Annexure', style: 'sectionTitle', margin: [0, 4, 0, 6] }
  ];

  pushAnnexureSection(content, 'Sales (Outwards) – Local Supplies', data.taxEqualSalesLocal);
  pushAnnexureSection(content, 'Sales (Outwards) – Outside GCC Supplies', data.taxEqualSalesOverseas);
  pushAnnexureSection(content, 'Purchases (Inwards) – Local Purchases', data.taxEqualPurchaseLocal);
  pushAnnexureSection(content, 'Purchases (Inwards) – Outside GCC Purchases', data.taxEqualPurchaseOverseas);

  return content;
}

function pushAnnexureSection(content: any[], title: string, rows: Vat201AnnexureRow[]): void {
  if (!rows?.length) return;

  const body: any[] = [
    [
      { text: 'Date', style: 'tableHeader', alignment: 'center' },
      { text: 'Voucher No', style: 'tableHeader', alignment: 'center' },
      { text: 'Ledger', style: 'tableHeader', alignment: 'center' },
      { text: 'Party Name', style: 'tableHeader', alignment: 'center' },
      { text: 'Taxable Amount', style: 'tableHeader', alignment: 'center' },
      { text: 'Tax Amount', style: 'tableHeader', alignment: 'center' }
    ]
  ];

  rows.forEach(item => {
    body.push([
      { text: formatDateValue(item?.VoucherDate), style: 'tableCell' },
      { text: item?.VoucherNumber || '', style: 'tableCell' },
      { text: item?.LedgerName || '', style: 'tableCell' },
      { text: item?.PartyName || '', style: 'tableCell' },
      { text: formatNumber(item?.TaxableAmount), style: 'tableCell', alignment: 'right', noWrap: true },
      { text: formatNumber(item?.TaxAmount), style: 'tableCell', alignment: 'right', noWrap: true }
    ]);
  });

  content.push({ text: title, style: 'boldCell', margin: [0, 6, 0, 2] });
  content.push({
    table: {
      headerRows: 1,
      widths: [55, 120, 100, '*', 70, 70],
      body
    },
    layout: tableLayout(),
    margin: [0, 0, 0, 6]
  });
}

/* ================= Shared cell/row builders ================= */
function sectionRow(label: string): any[] {
  return [
    { text: label, style: 'boldCell', colSpan: 3, alignment: 'left' },
    {},
    {}
  ];
}

function amountRow(item: Vat201TaxRow): any[] {
  return [
    { text: item?.LedgerName || '', style: 'tableCell', alignment: 'left' },
    { text: formatNumber(item?.TaxableAmount), style: 'tableCell', alignment: 'right', noWrap: true },
    { text: formatNumber(item?.TaxAmount), style: 'tableCell', alignment: 'right', noWrap: true }
  ];
}

function totalRow(label: string, taxable: number, tax: number): any[] {
  return [
    { text: label, style: 'totalLabelCell', alignment: 'left' },
    { text: formatNumber(taxable), style: 'totalValueCell', alignment: 'right', noWrap: true },
    { text: formatNumber(tax), style: 'totalValueCell', alignment: 'right', noWrap: true }
  ];
}

function grandTotalRow(label: string, taxable: number, tax: number): any[] {
  return [
    { text: label, style: 'grandTotalLabelCell', alignment: 'left' },
    { text: formatNumber(taxable), style: 'grandTotalValueCell', alignment: 'right', noWrap: true },
    { text: formatNumber(tax), style: 'grandTotalValueCell', alignment: 'right', noWrap: true }
  ];
}

function buildFilterRow(label: string, value: string): any {
  return {
    columns: [
      { text: label, bold: true, fontSize: 8, width: 70 },
      { text: `: ${value || ''}`, fontSize: 8, width: '*' }
    ],
    margin: [0, 1, 0, 1]
  };
}

function buildFooter(data: Vat201ReportPdfData, currentPage: number, pageCount: number): any {
  return {
    columns: [
      {
        text: `Printed By : ${data.userData?.userName || ''}`,
        fontSize: 7,
        alignment: 'left',
        width: '50%'
      },
      {
        text: `Printed On : ${formatDateValue(new Date())}  Page: ${currentPage} of ${pageCount}`,
        fontSize: 7,
        alignment: 'right',
        width: '50%'
      }
    ],
    margin: [18, 0, 18, 8]
  };
}

function tableLayout(): any {
  return {
    hLineWidth: () => 0.6,
    vLineWidth: () => 0.6,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 3,
    paddingBottom: () => 3
  };
}

function filterAnnexure(rows: any[], direction: 'Input' | 'Output', locality: 'Local' | 'Overseas'): Vat201AnnexureRow[] {
  return (rows || []).filter((x: any) => x?.Direction === direction && x?.Locality === locality);
}

function sumBy(rows: any[], key: string): number {
  return (rows || []).reduce((total, row) => total + (Number(row?.[key]) || 0), 0);
}

function formatDateValue(value: any): string {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-GB');
  } catch {
    return String(value);
  }
}

function formatNumber(value: any): string {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function getStyles(): any {
  return {
    ...getPdfStyles(),
    headerCompany: { bold: true, fontSize: 14 },
    headerBranch: { bold: true, fontSize: 10 },
    headerAddress: { fontSize: 8 },
    reportTitle: { fontSize: 12, bold: true, alignment: 'center' },
    sectionTitle: { fontSize: 9, bold: true },
    tableHeader: { bold: true, fillColor: '#05608d', color: '#ffffff', fontSize: 8 },
    tableCell: { fontSize: 8 },
    boldCell: { fontSize: 8, bold: true },
    totalLabelCell: { fontSize: 8, bold: true },
    totalValueCell: { fontSize: 8, bold: true },
    grandTotalLabelCell: { fontSize: 8, bold: true, fillColor: '#e9ecef' },
    grandTotalValueCell: { fontSize: 8, bold: true, fillColor: '#e9ecef' }
  };
}
