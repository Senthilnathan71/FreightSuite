import { createFooterFunction } from '../builders/pdf-footer.builder';
import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { JournalVoucherPdfData } from '../interfaces/pdf-document.interfaces';
import { PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS, getPdfStyles } from '../styles/pdf-styles';

function toNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildCompanyHeader(data: JournalVoucherPdfData): any {
  const company = data.company;
  const branch = data.branch;
  const logo = data.logo;
  const printSettings = data.printSettings || {
    logoPosition: 'left' as const,
    companyPosition: 'center' as const,
    companyAlignment: 'center' as const
  };

  const city = branch?.cityMaster?.cityName || branch?.cityName || company?.city || '';
  const postalCode = branch?.postalCode || company?.postalCode || '';
  const phone = branch?.phoneNumber || company?.phoneNumber || '';
  const locationPrefix = joinNonEmpty([
    branch?.addressLine2 || company?.addressLine2,
    city
  ], ', ');

  const companyInfoStack: any[] = [
    { text: (company?.companyName || '').toUpperCase(), fontSize: 14, bold: true, alignment: printSettings.companyAlignment },
    { text: branch?.branchName || '', fontSize: 11, bold: true, alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    { text: branch?.addressLine1 || company?.addressLine1 || '', fontSize: 9, alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    {
      text: [
        { text: locationPrefix ? `${locationPrefix}${postalCode || phone ? ', ' : ''}` : '' },
        ...(postalCode ? [{ text: 'Postal Code : ', bold: true }, { text: `${postalCode}${phone ? ', ' : ''}` }] : []),
        ...(phone ? [{ text: 'Ph.no : ', bold: true }, { text: phone }] : [])
      ],
      fontSize: 8,
      alignment: printSettings.companyAlignment,
      margin: [0, 1, 0, 0],
      noWrap: true
    }
  ];

  const slotAlign: Record<'left' | 'center' | 'right', 'left' | 'center' | 'right'> = {
    left: 'left',
    center: 'center',
    right: 'right'
  };

  const buildSlot = (slot: 'left' | 'center' | 'right') => {
    const stack: any[] = [];
    if (printSettings.logoPosition === slot && logo) {
      stack.push({ image: logo, fit: [60, 60], alignment: slotAlign[slot], margin: [8, 0, 15, 0] });
    }
    if (printSettings.companyPosition === slot) {
      stack.push({ stack: companyInfoStack, margin: stack.length ? [0, 4, 0, 0] : [0, 0, 0, 0] });
    }
    return { stack };
  };

  return {
    stack: [
      {
        table: {
          widths: ['20%', '60%', '20%'],
          body: [[buildSlot('left'), buildSlot('center'), buildSlot('right')]]
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === node.table.body.length ? 1 : 0),
          vLineWidth: () => 0,
          hLineColor: () => '#000000',
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 2
        },
        margin: [0, 5, 0, 5]
      }
    ]
  };
}

function buildTitle(): any {
  return {
    text: 'Journal Voucher',
    alignment: 'center',
    bold: true,
    fontSize: 12,
    margin: [0, 8, 0, 15]
  };
}

function infoRow(label: string, value: any, labelWidth = 75): any {
  return {
    columns: [
      { text: label, width: labelWidth, style: 'labelBold' },
      { text: ':', width: 8, style: 'labelBold' },
      { text: value ?? '', width: '*' }
    ],
    margin: [0, 0, 0, 4]
  };
}

function buildInfoSection(data: JournalVoucherPdfData): any {
  const jv = data.journalVoucher;
  return {
    columns: [
      {
        width: '*',
        stack: [
          infoRow('Narration', jv.narration || ''),
          infoRow('Voucher No.', jv.voucherNumber || ''),
          infoRow('Voucher Date', jv.voucherDate ? formatDate(jv.voucherDate) : '')
        ]
      },
      {
        width: '*',
        stack: [
          infoRow('Posted On', jv.postDate ? formatDate(jv.postDate) : ''),
          infoRow('Posted Status', jv.postStatus || '')
        ]
      }
    ],
    columnGap: 14,
    margin: [20, 0, 20, 8]
  };
}

function buildDetailsTable(data: JournalVoucherPdfData): any {
  const header = [
    { text: 'Ledger', style: 'tableHeader', alignment: 'center' },
    { text: 'Subledger', style: 'tableHeader', alignment: 'center' },
    { text: 'Curr.', style: 'tableHeader', alignment: 'center' },
    { text: 'Ex.Rate', style: 'tableHeader', alignment: 'center' },
    { text: 'Curr Amt.', style: 'tableHeader', alignment: 'center' },
    { text: 'Local Amt.', style: 'tableHeader', alignment: 'center' },
    { text: 'D/C', style: 'tableHeader', alignment: 'center' },
    { text: 'Narration', style: 'tableHeader', alignment: 'center' }
  ];

  const rows = (data.details || []).map((item) => ([
    { text: item.ledgerName || '', style: 'tableCellSmall', margin: [2, 0, 2, 0] },
    { text: item.subledgerName || '', style: 'tableCellSmall', margin: [2, 0, 2, 0] },
    { text: item.currencyCode || '', style: 'tableCellSmall', alignment: 'center' },
    { text: formatNumberWithCommas(toNumber(item.exchangeRate), 3), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(item.amount), 2), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(item.localAmount), 2), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: item.drCr || '', style: 'tableCellSmall', alignment: 'center' },
    { text: item.narration || '', style: 'tableCellSmall', margin: [2, 0, 2, 0] }
  ]));

  return {
    table: {
      headerRows: 1,
      widths: ['16%', '16%', '7%', '9%', '11%', '11%', '6%', '*'],
      body: [header, ...rows]
    },
    layout: {
      ...PDF_TABLE_LAYOUTS.bordered,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 4,
      paddingBottom: () => 4,
      vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 0 : 1)
    },
    margin: [-10, 0, -10, 8]
  };
}

function buildTotalsSection(data: JournalVoucherPdfData): any {
  return {
    columns: [
      { text: '' , width: '*' },
      {
        text: `Total Debit : ${formatNumberWithCommas(toNumber(data.totals.totalDebit), 2)}     Total Credit : ${formatNumberWithCommas(toNumber(data.totals.totalCredit), 2)}     Difference : ${formatNumberWithCommas(toNumber(data.totals.difference), 2)}`,
        bold: true,
        alignment: 'right',
        width: 'auto'
      }
    ],
    margin: [0, 4, 0, 12]
  };
}

// function buildAmountInWords(data: JournalVoucherPdfData): any[] {
//   if (!data.amountInWords) return [];

//   return [{
//     columns: [
//       { text: 'Amount in Words', style: 'labelBold', width: 95 },
//       { text: ':', width: 8 },
//       { text: data.amountInWords, width: '*' }
//     ],
//     margin: [10, 0, 10, 8]
//   }];
// }

function buildSignatureSection(): any {
  return {
    columns: [
      { text: 'Checked By', bold: true, width: '*', margin: [15, 0, 0, 0] },
      { text: 'Approved By', bold: true, width: '*', alignment: 'right' }
    ],
    margin: [10, 20, 10, 0]
  };
}

export function generateJournalVoucherDocument(data: JournalVoucherPdfData): any {
  const configuredMargins = data.config?.pageMargins as number[] | undefined;
  const resolvedPageMargins = configuredMargins
    ? [
        configuredMargins[0] ?? 20,
        Math.max(configuredMargins[1] ?? 82, 82),
        configuredMargins[2] ?? 20,
        configuredMargins[3] ?? 28
      ]
    : [20, 82, 20, 28];

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: 'portrait',
    pageMargins: resolvedPageMargins,
    header: () => ({
      stack: [buildCompanyHeader(data)],
      margin: [10, 10, 10, 4]
    }),
    background: (_currentPage: number, pageSize: any) => ({
      canvas: [
        { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 1 },
        { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 1 },
        { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 1 },
        { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 1 }
      ]
    }),
    content: [
      buildTitle(),
      buildInfoSection(data),
      buildDetailsTable(data),
      buildTotalsSection(data),
      // ...buildAmountInWords(data),
      buildSignatureSection()
    ],
    footer: createFooterFunction(data.userData, { showPageNumbers: true, pageMargins: [30, 0, 30, 0] }),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

function getLedgerName(coaMasterSid: any, coaList: any[]): string {
  if (!coaMasterSid) return '';
  return coaList.find((v: any) => v?.COAMasterSid === coaMasterSid)?.LedgerName || '';
}

function getSubledgerName(subledgerMasterSid: any, subledgerList: any[]): string {
  if (!subledgerMasterSid) return '';
  return subledgerList.find((v: any) => v?.SubledgerMasterSid === subledgerMasterSid)?.SubledgerName || '';
}

export function transformJournalVoucherApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    coaList?: any[];
    subledgerList?: any[];
    amountInWords?: string;
    printSettings?: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  }
): JournalVoucherPdfData {
  const coaList = options?.coaList || [];
  const subledgerList = options?.subledgerList || [];
  const details = (apiData?.VoucherDetail || []).map((item: any) => ({
    ledgerName: getLedgerName(item?.COAMasterSid, coaList),
    subledgerName: getSubledgerName(item?.LedgerMasterSid, subledgerList),
    currencyCode: item?.CurrencyCode || '',
    exchangeRate: toNumber(item?.ExchangeRate),
    amount: toNumber(item?.Amount),
    localAmount: toNumber(item?.LocalAmount),
    drCr: item?.DrCr || '',
    narration: item?.Narration || ''
  }));

  const totalDebit = details
    .filter((item) => item.drCr === 'D')
    .reduce((sum, item) => sum + toNumber(item.localAmount), 0);
  const totalCredit = details
    .filter((item) => item.drCr === 'C')
    .reduce((sum, item) => sum + toNumber(item.localAmount), 0);

  return {
    company: {
      companyName: company?.companyName || company?.CompanyName || '',
      addressLine1: company?.addressLine1 || company?.Address || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.city || '',
      postalCode: company?.postalCode || '',
      phoneNumber: company?.phoneNumber || company?.Phone || ''
    },
    branch: {
      branchName: branch?.branchName || branch?.BranchName || '',
      addressLine1: branch?.addressLine1 || branch?.Address || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || branch?.cityName || '',
      postalCode: branch?.postalCode || '',
      phoneNumber: branch?.phoneNumber || '',
      cityMaster: branch?.cityMaster
    },
    userData: {
      userName: userData?.userName || userData?.UserName || '',
      email: userData?.email || userData?.Email || ''
    },
    logo,
    printSettings: options?.printSettings || {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    },
    journalVoucher: {
      narration: apiData?.Narration || '',
      voucherNumber: apiData?.VoucherNumber || '',
      voucherDate: apiData?.VoucherDate || '',
      postDate: apiData?.PostDate || '',
      postStatus: apiData?.PostStatus || apiData?.PostedStatus || ''
    },
    details,
    totals: {
      totalDebit,
      totalCredit,
      difference: Math.abs(totalDebit - totalCredit)
    },
    amountInWords: options?.amountInWords || apiData?.AmountInWords || apiData?.amountInWords || ''
  };
}
