/**
 * Journal Voucher PDF Generator
 * Mirrors journal-voucher-print.component.html layout
 */

import { JournalVoucherPdfData, JournalVoucherDetailRow } from '../interfaces/pdf-document.interfaces';
import { PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS, getPdfStyles } from '../styles/pdf-styles';
import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';

const LOGO_HEIGHT_PX = 100;
const LOGO_HEIGHT_PT = LOGO_HEIGHT_PX * 0.75;

export function generateJournalVoucherDocument(data: JournalVoucherPdfData): any {
  const configuredMargins = data.config?.pageMargins as number[] | undefined;
  const resolvedPageMargins = configuredMargins
    ? [
        configuredMargins[0] ?? 20,
        configuredMargins[1] ?? 20,
        configuredMargins[2] ?? 20,
        configuredMargins[3] ?? 25
      ]
    : [20, 20, 20, 25];

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: resolvedPageMargins,

    background: function (currentPage, pageSize) {
      return {
        canvas: [
          { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 0.8 },
          { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.8 },
          { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 0.8 },
          { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.8 }
        ]
      };
    },

    content: [
      buildPrintHeader(data),
      buildTitle(),
      buildVoucherDetails(data),
      buildVoucherTable(data),
      buildTotalsRow(data),
      buildCheckedByRow()
    ],

    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

function buildPrintHeader(data: JournalVoucherPdfData): any {
  const company = data.company;
  const branch = data.branch;
  const logo = data.logo;

  const logoColumn = logo
    ? { image: logo, height: LOGO_HEIGHT_PT, alignment: 'left' as const }
    : { text: '', width: LOGO_HEIGHT_PT };

  const addressLine1 = branch?.addressLine1 || company?.addressLine1;
  const addressLine2 = branch?.addressLine2 || company?.addressLine2;
  const cityName = branch?.cityMaster?.cityName || branch?.cityName || company?.city;
  const postalCode = branch?.postalCode || company?.postalCode;
  const phone = branch?.phoneNumber || company?.phoneNumber;

  let addressLine2Text = joinNonEmpty([addressLine2, cityName], ', ');
  if (postalCode) {
    addressLine2Text = addressLine2Text
      ? `${addressLine2Text}, Postal Code : ${postalCode}`
      : `Postal Code : ${postalCode}`;
  }
  if (phone) {
    addressLine2Text = addressLine2Text
      ? `${addressLine2Text}, Ph.no : ${phone}`
      : `Ph.no : ${phone}`;
  }

  const companyStack: any[] = [];
  if (company?.companyName) {
    companyStack.push({
      text: company.companyName,
      fontSize: 18,
      bold: true,
      alignment: 'center'
    });
  }

  if (branch?.branchName) {
    companyStack.push({
      text: branch.branchName,
      fontSize: 14,
      bold: true,
      alignment: 'center'
    });
  }

  if (addressLine1) {
    companyStack.push({
      text: addressLine1,
      fontSize: 12,
      alignment: 'center'
    });
  }

  if (addressLine2Text) {
    companyStack.push({
      text: addressLine2Text,
      fontSize: 12,
      alignment: 'center'
    });
  }

  return {
    columns: [
      logoColumn,
      { stack: companyStack, width: '*' },
      { text: '', width: LOGO_HEIGHT_PT }
    ],
    margin: [20, 0, 20, 0]
  };
}

function buildTitle(): any {
  return {
    stack: [
      {
        canvas: [{ type: 'line', x1: -10, y1: 0, x2: 565, y2: 0, lineWidth: 0.8 }],
        margin: [0, 10, 0, 0]
      },
      {
        text: 'Journal Voucher',
        alignment: 'center',
        fontSize: 20,
        bold: true,
        margin: [0, 8, 0, 6]
      }
    ]
  };
}

function buildVoucherDetails(data: JournalVoucherPdfData): any {
  const voucher = data.voucher || {};
  const leftStack = [
    buildDetailRow('Narration', voucher.narration || '', { labelWidth: 120 }),
    buildDetailRow('Voucher No.', voucher.voucherNumber || '', { labelWidth: 120 }),
    buildDetailRow('Voucher Date', voucher.voucherDate ? formatDate(voucher.voucherDate) : '', { labelWidth: 120 })
  ];

  const rightStack = [
    buildDetailRow('Posted On', voucher.postDate ? formatDate(voucher.postDate) : '', { labelWidth: 115 }),
    buildDetailRow('Posted Status', voucher.postStatus || '', { labelWidth: 115 })
  ];

  return {
    table: {
      widths: ['48%', '4%', '48%'],
      body: [[
        { stack: leftStack, margin: [0, 0, 0, 0] },
        { text: '', margin: [0, 0, 0, 0] },
        { stack: rightStack, margin: [0, 0, 0, 0] }
      ]]
    },
    layout: 'noBorders',
    margin: [80, 10, 80, 6]
  };
}

function buildDetailRow(
  label: string,
  value: string,
  options: { labelWidth: number }
): any {
  return {
    columns: [
      { text: label, width: options.labelWidth, bold: true, fontSize: 17 },
      { text: ':', width: 10, fontSize: 17 },
      { text: value, width: '*', fontSize: 17 }
    ],
    margin: [0, 0, 0, 4]
  };
}

function buildVoucherTable(data: JournalVoucherPdfData): any {
  const details = data.details || [];

  const headerRow = [
    { text: 'Ledger', style: 'tableHeader', alignment: 'center', fontSize: 17, bold: true },
    { text: 'Subledger', style: 'tableHeader', alignment: 'center', fontSize: 17, bold: true },
    { text: 'Curr.', style: 'tableHeader', alignment: 'center', fontSize: 17, bold: true },
    { text: 'Ex.Rate', style: 'tableHeader', alignment: 'center', fontSize: 17, bold: true },
    { text: 'Curr Amt.', style: 'tableHeader', alignment: 'center', fontSize: 17, bold: true },
    { text: 'Local Amt.', style: 'tableHeader', alignment: 'center', fontSize: 17, bold: true },
    { text: 'D/C', style: 'tableHeader', alignment: 'center', fontSize: 17, bold: true },
    { text: 'Narration', style: 'tableHeader', alignment: 'center', fontSize: 17, bold: true }
  ];

  const bodyRows = details.map((row: JournalVoucherDetailRow) => ([
    { text: row.ledgerName || '', style: 'tableCell', alignment: 'left', fontSize: 17 },
    { text: row.subledgerName || '', style: 'tableCell', alignment: 'left', fontSize: 17 },
    { text: row.currencyCode || '', style: 'tableCell', alignment: 'left', fontSize: 17 },
    { text: formatNumberWithCommas(row.exchangeRate || 0, 3), style: 'tableCell', alignment: 'right', fontSize: 17 },
    { text: formatNumberWithCommas(row.currencyAmount || 0, 2), style: 'tableCell', alignment: 'right', fontSize: 17 },
    { text: formatNumberWithCommas(row.localAmount || 0, 2), style: 'tableCell', alignment: 'right', fontSize: 17 },
    { text: row.drCr || '', style: 'tableCell', alignment: 'center', fontSize: 17 },
    { text: row.narration || '', style: 'tableCell', alignment: 'left', fontSize: 17 }
  ]));

  return {
    table: {
      headerRows: 1,
      widths: [70, 80, 35, 45, 55, 55, 25, '*'],
      body: [headerRow, ...bodyRows]
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: (i: number, node: any) => {
        const last = node.table.widths.length;
        if (i === 0 || i === last) return 0;
        return 1;
      },
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3
    },
    margin: [0, 6, 0, 6]
  };
}

function buildTotalsRow(data: JournalVoucherPdfData): any {
  return {
    columns: [
      { text: '', width: '*' },
      {
        text: `Total Debit : ${formatNumberWithCommas(data.totals?.totalDebit || 0, 2)}`,
        alignment: 'right',
        bold: true,
        fontSize: 17,
        width: 'auto'
      },
      { text: '   ', width: 20 },
      {
        text: `Total Credit : ${formatNumberWithCommas(data.totals?.totalCredit || 0, 2)}`,
        alignment: 'right',
        bold: true,
        fontSize: 17,
        width: 'auto'
      },
      { text: '   ', width: 20 },
      {
        text: `Difference : ${formatNumberWithCommas(data.totals?.difference || 0, 2)}`,
        alignment: 'right',
        bold: true,
        fontSize: 17,
        width: 'auto'
      }
    ],
    margin: [0, 6, 10, 10]
  };
}

function buildCheckedByRow(): any {
  return {
    columns: [
      { text: 'Checked By', bold: true, alignment: 'left', fontSize: 17 },
      { text: 'Approved By', bold: true, alignment: 'right', fontSize: 17 }
    ],
    margin: [20, 14, 20, 10]
  };
}

function buildFooter(data: JournalVoucherPdfData, currentPage: number, pageCount: number): any {
  const disclaimerText = 'This document is computer-generated and does not require a signature.';
  return {
    columns: [
      {
        text: `Printed By : ${data.userData?.userName || ''}`,
        fontSize: 7,
        alignment: 'left',
        width: '25%'
      },
      {
        text: disclaimerText,
        fontSize: 7,
        alignment: 'center',
        noWrap: true,
        width: '*'
      },
      {
        text: `Printed On : ${formatDate(new Date())}  |  Page ${currentPage} of ${pageCount}`,
        fontSize: 7,
        alignment: 'right',
        width: '30%'
      }
    ],
    margin: [30, 0, 30, 5]
  };
}

export function transformJournalVoucherApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  lookups?: {
    coaList?: any[];
    subledgerList?: any[];
  }
): JournalVoucherPdfData {
  const details = apiData?.VoucherDetail || [];
  const coaList = lookups?.coaList || [];
  const subledgerList = lookups?.subledgerList || [];

  const mappedDetails: JournalVoucherDetailRow[] = details.map((detail: any) => {
    const ledger = coaList.find((c: any) => c.COAMasterSid === detail.COAMasterSid);
    const subledger = subledgerList.find((s: any) => s.SubledgerMasterSid === detail.LedgerMasterSid);
    return {
      ledgerName: ledger?.LedgerName || '',
      subledgerName: subledger?.SubledgerName || '',
      currencyCode: detail.CurrencyCode || '',
      exchangeRate: Number(detail.ExchangeRate) || 0,
      currencyAmount: Number(detail.Amount) || 0,
      localAmount: Number(detail.LocalAmount) || 0,
      drCr: detail.DrCr || '',
      narration: detail.Narration || ''
    };
  });

  const totalDebit = mappedDetails
    .filter(d => d.drCr === 'D')
    .reduce((sum, d) => sum + (d.localAmount || 0), 0);

  const totalCredit = mappedDetails
    .filter(d => d.drCr === 'C')
    .reduce((sum, d) => sum + (d.localAmount || 0), 0);

  const difference = Math.abs(totalDebit - totalCredit);

  return {
    company: {
      companyName: company?.CompanyName || company?.companyName || '',
      addressLine1: company?.Address || company?.addressLine1 || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || company?.city || '',
      postalCode: company?.postal_code || company?.postalCode || '',
      phoneNumber: company?.Phone || company?.phoneNumber || ''
    },
    branch: {
      branchName: branch?.BranchName || branch?.branchName || '',
      addressLine1: branch?.Address || branch?.addressLine1 || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || branch?.cityName || '',
      postalCode: branch?.postalCode || branch?.ZipCode || '',
      phoneNumber: branch?.phoneNumber || branch?.Phone || '',
      cityMaster: branch?.cityMaster
    },
    userData: {
      userName: userData?.UserName || userData?.userName || ''
    },
    logo,
    voucher: {
      narration: apiData?.Narration || '',
      voucherNumber: apiData?.VoucherNumber || '',
      voucherDate: apiData?.VoucherDate || '',
      postDate: apiData?.PostDate || '',
      postStatus: apiData?.PostStatus || ''
    },
    details: mappedDetails,
    totals: {
      totalDebit,
      totalCredit,
      difference
    }
  };
}
