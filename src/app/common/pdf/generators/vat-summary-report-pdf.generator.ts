import { PdfBranchInfo, PdfCompanyInfo, PdfUserInfo } from '../interfaces/pdf-base.interface';
import { getPdfStyles } from '../styles/pdf-styles';

interface VatReturnRow {
  code: string;
  description: string;
  amount: number;
  vatAmount: number;
  adjustmentAmount: number;
}

export interface VatSummaryReportPdfData {
  company: PdfCompanyInfo;
  branch: PdfBranchInfo;
  userData: PdfUserInfo;
  logo?: string;
  orientation?: 'portrait' | 'landscape';
  reportTitle: string;
  params?: any;
  fullData?: any;
  trn: string;
  companyName: string;
  addressLines: string[];
  fromDate: any;
  toDate: any;
  dueDate: any;
  taxYearEnd: any;
  referenceNumber: string;
  outputRows: VatReturnRow[];
  inputRows: VatReturnRow[];
  outputTotal: VatReturnRow;
  inputTotal: VatReturnRow;
  totalDueTax: number;
  totalRecoverableTax: number;
  netVatDue: number;
  refundRequested: string;
  profitMarginScheme: string;
  declaration: any;
}

const OUTPUT_DEFINITIONS = [
  { code: '1a', description: 'Standard rated supplies in Abu Dhabi' },
  { code: '1b', description: 'Standard rated supplies in Dubai' },
  { code: '1c', description: 'Standard rated supplies in Sharjah' },
  { code: '1d', description: 'Standard rated supplies in Ajman' },
  { code: '1e', description: 'Standard rated supplies in Umm Al Quwain' },
  { code: '1f', description: 'Standard rated supplies in Ras Al Khaimah' },
  { code: '1g', description: 'Standard rated supplies in Fujairah' },
  { code: '2', description: 'Tax Refunds provided to Tourists under Tax Refunds for Tourists Scheme' },
  { code: '3', description: 'Supplies subject to the reverse charge provisions' },
  { code: '4', description: 'Zero rated supplies' },
  { code: '5', description: 'Exempt supplies' },
  { code: '6', description: 'Goods imported into the UAE' },
  { code: '7', description: 'Adjustment to goods imported into the UAE' }
];

const INPUT_DEFINITIONS = [
  { code: '9', description: 'Standard rated expenses' },
  { code: '10', description: 'Supplies subject to the reverse charge provisions' }
];

export function transformVatSummaryReportData(
  rawData: any,
  company: PdfCompanyInfo,
  branch: PdfBranchInfo,
  userData: PdfUserInfo,
  logo?: string,
  orientation: 'portrait' | 'landscape' = 'landscape'
): VatSummaryReportPdfData {
  const fullData = rawData || {};
  const params = fullData?.params || {};

  const companyName = pick(
    fullData?.company?.companyName,
    fullData?.company?.name,
    company?.companyName,
    ''
  );

  const trn = pick(
    fullData?.company?.trn,
    fullData?.company?.TRN,
    fullData?.company?.taxRegistrationNo,
    fullData?.trn,
    ''
  );

  const address = pick(fullData?.company?.address, branch?.addressLine1, company?.addressLine1, '');
  const cityCountry = [branch?.cityName || branch?.cityMaster?.cityName || '', company?.city || '']
    .filter(Boolean)
    .join(', ');
  const addressLines = [address, cityCountry].filter(Boolean);

  const outputRows = resolveRows(fullData, OUTPUT_DEFINITIONS, 'output');
  const inputRows = resolveRows(fullData, INPUT_DEFINITIONS, 'input');

  const outputTotalBackend = fullData?.summary?.outputTotal || fullData?.outputTotal;
  const inputTotalBackend = fullData?.summary?.inputTotal || fullData?.inputTotal;

  const outputTotal: VatReturnRow = {
    code: '8',
    description: 'Totals',
    amount: toNumber(outputTotalBackend?.amount) || sum(outputRows, 'amount'),
    vatAmount: toNumber(outputTotalBackend?.vatAmount) || sum(outputRows, 'vatAmount'),
    adjustmentAmount: toNumber(outputTotalBackend?.adjustmentAmount) || sum(outputRows, 'adjustmentAmount')
  };

  const inputTotal: VatReturnRow = {
    code: '11',
    description: 'Totals',
    amount: toNumber(inputTotalBackend?.amount) || sum(inputRows, 'amount'),
    vatAmount: toNumber(inputTotalBackend?.vatAmount) || sum(inputRows, 'vatAmount'),
    adjustmentAmount: toNumber(inputTotalBackend?.adjustmentAmount) || sum(inputRows, 'adjustmentAmount')
  };

  const totalDueTax = toNumber(fullData?.summary?.totalDueTax) || outputTotal.vatAmount;
  const totalRecoverableTax = toNumber(fullData?.summary?.totalRecoverableTax) || inputTotal.vatAmount;
  const backendNetVatDue = fullData?.summary?.netVatDue;
  const netVatDue = backendNetVatDue !== null && backendNetVatDue !== undefined
    ? toNumber(backendNetVatDue)
    : (totalDueTax - totalRecoverableTax);

  return {
    company,
    branch,
    userData,
    logo,
    orientation,
    reportTitle: 'VAT Summary Report',
    params,
    fullData,
    trn,
    companyName,
    addressLines,
    fromDate: pick(params?.VoucherFromDate, params?.FromDate, fullData?.period?.fromDate),
    toDate: pick(params?.VoucherToDate, params?.ToDate, fullData?.period?.toDate),
    dueDate: pick(params?.VatReturnDueDate, fullData?.period?.dueDate),
    taxYearEnd: pick(params?.TaxYearEnd, fullData?.period?.taxYearEnd),
    referenceNumber: pick(params?.VatReturnReferenceNumber, fullData?.period?.referenceNumber, ''),
    outputRows,
    inputRows,
    outputTotal,
    inputTotal,
    totalDueTax,
    totalRecoverableTax,
    netVatDue,
    refundRequested: pick(fullData?.summary?.refundRequested, '-'),
    profitMarginScheme: pick(fullData?.additionalReporting?.profitMarginScheme, 'No'),
    declaration: fullData?.declaration || {}
  };
}

export function generateVatSummaryReportDocument(data: VatSummaryReportPdfData): any {
  return {
    pageSize: 'A4',
    pageOrientation: data.orientation || 'landscape',
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
      buildPartyTable(data),
      buildPeriodTable(data),
      buildVatTable('VAT on Sales and all other Outputs', data.outputRows, data.outputTotal, 'VAT Amount (AED)', 'Adjustment (AED)'),
      buildVatTable('VAT on Expenses and all other Inputs', data.inputRows, data.inputTotal, 'Recoverable VAT Amount (AED)', 'Adjustment Amount (AED)'),
      buildNetVatTable(data),
      buildAdditionalReportingTable(data),
      buildDeclarationTable(data)
    ],
    styles: getStyles(),
    defaultStyle: {
      fontSize: 8,
      color: '#000'
    }
  };
}

function buildHeader(data: VatSummaryReportPdfData): any {
  const address1 = data.branch?.addressLine1 || data.company?.addressLine1 || '';
  const address2 = [
    data.branch?.addressLine2 || '',
    data.branch?.cityMaster?.cityName || data.branch?.cityName || '',
    data.branch?.postalCode ? `Postal Code : ${data.branch.postalCode}` : '',
    data.branch?.phoneNumber ? `Ph.no : ${data.branch.phoneNumber}` : ''
  ].filter(Boolean).join(', ');

  return {
    stack: [
      {
        columns: [
          data.logo ? { image: data.logo, fit: [50, 50], width: 56, margin: [0, 4, 0, 0] } : { text: '', width: 56 },
          {
            width: '*',
            stack: [
              { text: (data.company?.companyName || '').toUpperCase(), style: 'headerCompany', alignment: 'center' },
              { text: data.branch?.branchName || '', style: 'headerBranch', alignment: 'center', margin: [0, 1, 0, 0] },
              { text: address1, style: 'headerAddress', alignment: 'center', margin: [0, 1, 0, 0] },
              { text: address2, style: 'headerAddress', alignment: 'center', margin: [0, 1, 0, 0] }
            ]
          },
          { text: '', width: 56 }
        ]
      },
      { text: data.reportTitle, style: 'reportTitle', margin: [0, 2, 0, 8] }
    ],
    margin: [18, 18, 18, 6]
  };
}

function buildFooter(data: VatSummaryReportPdfData, currentPage: number, pageCount: number): any {
  return {
    columns: [
      { text: `Printed By : ${data.userData?.userName || ''}`, fontSize: 7, alignment: 'left', width: '50%' },
      { text: `Printed On : ${formatDateValue(new Date())}  Page: ${currentPage} of ${pageCount}`, fontSize: 7, alignment: 'right', width: '50%' }
    ],
    margin: [18, 0, 18, 8]
  };
}

function buildPartyTable(data: VatSummaryReportPdfData): any {
  return {
    stack: [
      { text: 'Taxable Person Details', style: 'sectionTitle', margin: [0, 0, 0, 4] },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'TRN', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: data.trn || '-', fontSize: 8, margin: [0, 0, 0, 6] },
              { text: 'Taxable Person Name (English)', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: data.companyName || '-', fontSize: 8 }
            ]
          },
          { width: 32, text: '' },
          {
            width: '*',
            stack: [
              { text: 'Taxable Person Name (Arabic)', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: data.fullData?.company?.nameArabic || '-', fontSize: 8, margin: [0, 0, 0, 6] },
              { text: 'Taxable Person Address', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: data.addressLines.join(', ') || '-', fontSize: 8 }
            ]
          }
        ]
      }
    ],
    margin: [0, 0, 0, 8]
  };
}

function buildPeriodTable(data: VatSummaryReportPdfData): any {
  const period = `${formatDateValue(data.fromDate)} to ${formatDateValue(data.toDate)}`;
  return {
    stack: [
      { text: 'VAT Return Period', style: 'sectionTitle', margin: [0, 0, 0, 4] },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'VAT Return Period', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: period || '-', fontSize: 8, margin: [0, 0, 0, 6] },
              { text: 'TAX Year End', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: formatDateValue(data.taxYearEnd) || '-', fontSize: 8 }
            ]
          },
          { width: 32, text: '' },
          {
            width: '*',
            stack: [
              { text: 'VAT Return Due Date', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: formatDateValue(data.dueDate) || '-', fontSize: 8, margin: [0, 0, 0, 6] },
              { text: 'VAT Return Period Reference Number', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: data.referenceNumber || '-', fontSize: 8 }
            ]
          }
        ]
      }
    ],
    margin: [0, 0, 0, 8]
  };
}

function buildVatTable(
  title: string,
  rows: VatReturnRow[],
  totalRow: VatReturnRow,
  vatColumnTitle: string,
  adjustmentTitle: string
): any {
  const body: any[] = [
    [
      { text: title, style: 'tableHeader', colSpan: 2, alignment: 'left' }, {},
      { text: 'Amount (AED)', style: 'tableHeader', alignment: 'center' },
      { text: vatColumnTitle, style: 'tableHeader', alignment: 'center' },
      { text: adjustmentTitle, style: 'tableHeader', alignment: 'center' }
    ]
  ];

  rows.forEach((row) => {
    body.push([
      textCell(row.code, 'center'),
      textCell(row.description, 'left'),
      numberCell(row.amount),
      numberCell(row.vatAmount),
      numberCell(row.adjustmentAmount)
    ]);
  });

  body.push([
    textCell(totalRow.code, 'center', true),
    textCell(totalRow.description, 'left', true),
    numberCell(totalRow.amount, true),
    numberCell(totalRow.vatAmount, true),
    numberCell(totalRow.adjustmentAmount, true)
  ]);

  return {
    table: {
      headerRows: 1,
      widths: [38, '*', 95, 95, 95],
      body
    },
    layout: tableLayout(),
    margin: [0, 0, 0, 8]
  };
}

function buildNetVatTable(data: VatSummaryReportPdfData): any {
  return {
    table: {
      headerRows: 0,
      widths: [38, '*', 110],
      body: [
        [textCell('12', 'center'), textCell('Total value of due tax for the period', 'left'), numberCell(data.totalDueTax)],
        [textCell('13', 'center'), textCell('Total value of recoverable tax for the period', 'left'), numberCell(data.totalRecoverableTax)],
        [textCell('14', 'center', true), textCell('Net VAT due(or reclaimed) for the period', 'left', true), numberCell(data.netVatDue, true)],
        [textCell('15', 'center'), textCell('Do you wish to request a refund for the above amount of excess recoverable tax.', 'left'), textCell(data.refundRequested || '-', 'right')]
      ]
    },
    layout: tableLayout(),
    margin: [0, 0, 0, 8]
  };
}

function buildAdditionalReportingTable(data: VatSummaryReportPdfData): any {
  return {
    stack: [
      { text: 'Additional Reporting Requirements', style: 'sectionTitle', margin: [0, 0, 0, 4] },
      { text: 'Profit Margin Scheme', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
      { text: data.profitMarginScheme || 'No', fontSize: 8 }
    ],
    margin: [0, 0, 0, 8]
  };
}

function buildDeclarationTable(data: VatSummaryReportPdfData): any {
  const d = data.declaration || {};
  return {
    stack: [
      {
        text: 'Declaration and Authorised Signatory',
        style: 'sectionTitle',
        margin: [0, 0, 0, 6]
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Name in English', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: pick(d?.nameEnglish, '-'), fontSize: 8, margin: [0, 0, 0, 6] },
              { text: 'Phone/Mobile Country code', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: pick(d?.phoneCountryCode, '-'), fontSize: 8, margin: [0, 0, 0, 6] },
              { text: 'Date of Submission (dd/mm/yyyy)', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: formatDateValue(d?.submissionDate) || '-', fontSize: 8 }
            ]
          },
          {
            width: 32,
            text: ''
          },
          {
            width: '*',
            stack: [
              { text: 'Name in Arabic', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: pick(d?.nameArabic, '-'), fontSize: 8, margin: [0, 0, 0, 6] },
              { text: 'Phone/Mobile number', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: pick(d?.phoneNumber, '-'), fontSize: 8, margin: [0, 0, 0, 6] },
              { text: 'E-mail address', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
              { text: pick(d?.email, '-'), fontSize: 8 }
            ]
          }
        ],
        margin: [0, 0, 0, 6]
      },
      {
        text: 'I declare that all information provided is true, accurate and complete to the best of my knowledge and belief.',
        fontSize: 8
      }
    ],
    margin: [0, 0, 0, 8]
  };
}

function tableSection(body: any[], widths: any[], margin: number[]): any {
  return {
    table: { headerRows: 1, widths, body },
    layout: tableLayout(),
    margin
  };
}

function headerCell(text: string, colSpan = 1): any {
  return { text, style: 'sectionTitle', colSpan, margin: [0, 1, 0, 1] };
}

function labelValueCell(label: string, value: string): any {
  return {
    stack: [
      { text: label, bold: true, fontSize: 8 },
      { text: value || '-', fontSize: 8, margin: [0, 1, 0, 0] }
    ]
  };
}

function textCell(text: string, alignment: 'left' | 'center' | 'right', bold = false): any {
  return { text: text || '', style: 'tableCell', alignment, bold };
}

function numberCell(value: any, bold = false): any {
  return { text: formatNumber(value), style: 'tableCell', alignment: 'right', bold, noWrap: true };
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

function resolveRows(fullData: any, definitions: Array<{ code: string; description: string }>, type: 'output' | 'input'): VatReturnRow[] {
  const rows = pickRows(
    type === 'output' ? fullData?.outputRows : fullData?.inputRows,
    type === 'output' ? fullData?.outputTaxRows : fullData?.inputTaxRows,
    type === 'output' ? fullData?.vatOutputRows : fullData?.vatInputRows
  );

  if (rows.length) return definitions.map((def) => normalizeRow(def, rows));

  const fallbackRows = pickRows(
    type === 'output' ? fullData?.outputTax : fullData?.inputTax,
    type === 'output' ? fullData?.data?.outputTax : fullData?.data?.inputTax
  );
  const totalAmount = sumAny(fallbackRows, ['taxableAmt', 'TaxableAmount', 'amount', 'Amount']);
  const totalVat = sumAny(fallbackRows, ['taxAmt', 'TaxAmount', 'vatAmount', 'VatAmount']);

  const targetCode = type === 'output' ? '1b' : '9';
  return definitions.map((def) => ({
    ...def,
    amount: def.code === targetCode ? totalAmount : 0,
    vatAmount: def.code === targetCode ? totalVat : 0,
    adjustmentAmount: 0
  }));
}

function normalizeRow(definition: { code: string; description: string }, rows: any[]): VatReturnRow {
  const row = rows.find((item) => {
    const code = pick(item?.code, item?.box, item?.Box, item?.BoxNo, item?.lineNo, item?.LineNo, '');
    return String(code).trim().toLowerCase() === definition.code.toLowerCase();
  });

  return {
    code: definition.code,
    description: pick(row?.description, row?.particulars, row?.Particulars, definition.description),
    amount: toNumber(pick(row?.amount, row?.Amount, row?.taxableAmount, row?.TaxableAmount)),
    vatAmount: toNumber(pick(row?.vatAmount, row?.VatAmount, row?.taxAmount, row?.TaxAmount, row?.recoverableVatAmount)),
    adjustmentAmount: toNumber(pick(row?.adjustmentAmount, row?.AdjustmentAmount, row?.adjustment, row?.Adjustment))
  };
}

function pickRows(...values: any[]): any[] {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function sum(rows: VatReturnRow[], key: keyof VatReturnRow): number {
  return rows.reduce((total, row) => total + toNumber(row[key]), 0);
}

function sumAny(rows: any[], keys: string[]): number {
  return rows.reduce((total, row) => {
    const value = keys.map((key) => row?.[key]).find((item) => item !== null && item !== undefined);
    return total + toNumber(value);
  }, 0);
}

function pick(...values: any[]): any {
  return values.find((value) => value !== null && value !== undefined && value !== '');
}

function toNumber(value: any): number {
  const numberValue = Number(String(value ?? 0).replace(/,/g, ''));
  return Number.isFinite(numberValue) ? numberValue : 0;
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
    tableCell: { fontSize: 8 }
  };
}
