import { createFooterFunction } from '../builders/pdf-footer.builder';
import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { PaymentPdfData } from '../interfaces/pdf-document.interfaces';
import { PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS, getPdfStyles } from '../styles/pdf-styles';

function toNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildCompanyHeader(data: PaymentPdfData): any {
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

  const cityLine = joinNonEmpty([
    branch?.addressLine2 || company?.addressLine2,
    city,
    postalCode ? `Postal Code : ${postalCode}` : '',
    phone ? `Ph.no : ${phone}` : ''
  ], ', ');

  const companyInfoStack: any[] = [
    { text: (company?.companyName || '').toUpperCase(), fontSize: 14, bold: true, alignment: printSettings.companyAlignment },
    { text: branch?.branchName || '', fontSize: 11, bold: true, alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    { text: branch?.addressLine1 || company?.addressLine1 || '', fontSize: 9, alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    { text: cityLine, fontSize: 9, alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] }
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
          widths: ['33%', '34%', '33%'],
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

function buildTitle(data: PaymentPdfData): any {
  return {
    text: data.paymentType === 'bank' ? 'Bank Payment' : 'Cash Payment',
    alignment: 'center',
    bold: true,
    fontSize: 12,
    margin: [0, 8, 0, 15]
  };
}

function infoRow(label: string, value: any): any {
  return {
    columns: [
      { text: label, width: 70, style: 'labelBold' },
      { text: ':', width: 0 , style: 'labelBold' },
      { text: value ?? '', width: '*' }
    ],
    margin: [0, 0, 0, 4]
  };
}

function buildInfoSection(data: PaymentPdfData): any {
  const p = data.payment;
  const leftStack: any[] = [
    infoRow('Payment No.', p.voucherNumber || '')
  ];
  const rightStack: any[] = [];

  if (data.paymentType === 'bank') {
    leftStack.push(infoRow('Payment Date', p.voucherDate ? formatDate(p.voucherDate) : ''));
    leftStack.push(infoRow('Paid To', p.paidTo || ''));

    rightStack.push(infoRow('Bank', p.bankName || ''));
    rightStack.push(infoRow('Bank Ref.', joinNonEmpty([p.instrumentMode, p.instrumentNumber, p.instrumentDate ? formatDate(p.instrumentDate) : ''], ' / ')));
    rightStack.push(infoRow('Currency', p.currencyCode || ''));
    rightStack.push(infoRow('Ex. Rate', formatNumberWithCommas(toNumber(p.exchangeRate), 3)));
  } else {
    leftStack.push(infoRow('Paid From', p.paidFrom || ''));
    leftStack.push(infoRow('Paid To', p.paidTo || ''));

    rightStack.push(infoRow('Payment Date', p.voucherDate ? formatDate(p.voucherDate) : ''));
    rightStack.push(infoRow('Currency', p.currencyCode || ''));
  }

  return {
    columns: [
      { width: 'auto', stack: leftStack },
      { width: 'auto', stack: rightStack }
    ],
    columnGap: 10,
    margin: [80, 0, 0, 6]
  };
}

function buildDetailsTable(data: PaymentPdfData): any {
  const header = [
    { text: 'Ledger', style: 'tableHeader', alignment: 'center' },
    { text: 'Description', style: 'tableHeader', alignment: 'center' },
    { text: 'Curr.', style: 'tableHeader', alignment: 'center' },
    { text: 'Ex.Rate', style: 'tableHeader', alignment: 'center' },
    { text: 'Amount', style: 'tableHeader', alignment: 'center' },
    { text: `${data.payment.currencyCode || ''} Amount`, style: 'tableHeader', alignment: 'center' }
  ];

  const rows = (data.details || []).map((item) => ([
    { text: item.ledgerName || '', style: 'tableCellSmall', margin: [2, 0, 0, 0] },
    { text: item.narration || '', style: 'tableCellSmall' ,margin: [2, 0, 0, 0] },
    { text: item.currencyCode || '', style: 'tableCellSmall', alignment: 'center' },
    { text: formatNumberWithCommas(toNumber(item.exchangeRate), 3), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(item.amount), 2), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(item.partyAmount), 2), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] }
  ]));

  rows.push([
    { text: '', style: 'tableCellSmall' , margin: [2, 0, 0, 0] },
    { text: '', style: 'tableCellSmall', margin: [2, 0, 0, 0] },
    { text: '', style: 'tableCellSmall', margin: [2, 0, 0, 0] },
    { text: '', style: 'tableCellSmall' , margin: [2, 0, 0, 0]},
    { text: 'Total', style: 'tableCellBoldSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(data.totals.totalAmount), 2), style: 'tableCellBoldSmall', alignment: 'right', margin: [0, 0, 2, 0] }
  ]);

  return {
    table: {
      headerRows: 1,
      widths: ['22%', '*', '4%', '10%', '12%', '12%'],
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

function buildAmountInWords(data: PaymentPdfData): any {
  return {
    columns: [
      { text: 'Amount in Words', style: 'labelBold', width: 90 },
      { text: ':', width: 8 },
      { text: data.amountInWords || '', width: '*' }
    ],
    margin: [10, 0, 10, 8]
  };
}

function buildRemittanceSection(data: PaymentPdfData): any[] {
  const rows = data.voucherMatchings || [];
  if (!rows.length) return [];

  const header = [
    { text: 'Voucher No.', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'Bill No.', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'Bill Date', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'INV Type', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'Voucher Date', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'Curr.', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'Ex. Rate', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'Curr. Amt', style: 'tableHeaderSmall', alignment: 'center' },
    { text: 'Local Amount', style: 'tableHeaderSmall', alignment: 'center' }
  ];
  const widths: any[] = ['20%', '8%', '10%', '6%', '10%', '4%', '12%', '15%', '15%'];

  const bodyRows = rows.map((r) => ([
    { text: r.voucherNumber || '', style: 'tableCellSmall', margin: [2, 0, 0, 0] },
    { text: r.BillNo || '', style: 'tableCellSmall', margin: [2, 0, 0, 0] },
    { text: r.BillDate ? formatDate(r.BillDate) : '', style: 'tableCellSmall', alignment: 'center' },
    { text: r.voucherType || '', style: 'tableCellSmall', alignment: 'center' },
    { text: r.voucherDate ? formatDate(r.voucherDate) : '', style: 'tableCellSmall', alignment: 'center' },
    { text: r.currencyCode || '', style: 'tableCellSmall', alignment: 'center' },
    { text: formatNumberWithCommas(toNumber(r.exchangeRate), 3), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(r.matchingAmount), 2), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(r.matchingLocalAmount), 2), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] }
  ]));

  const totalRow: any[] = [
    { text: '', style: 'tableCellSmall' },
    { text: '', style: 'tableCellSmall' },
    { text: '', style: 'tableCellSmall' },
    { text: '', style: 'tableCellSmall' },
    { text: '', style: 'tableCellSmall' },
    { text: '', style: 'tableCellSmall' },
    { text: 'Total', style: 'tableCellBoldSmall', alignment: 'right' },
    { text: formatNumberWithCommas(toNumber(data.totals.totalMatchingAmount), 2), style: 'tableCellBoldSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(data.totals.totalMatchingLocalAmount), 2), style: 'tableCellBoldSmall', alignment: 'right', margin: [0, 0, 2, 0] }
  ];

  return [
    { text: 'Remittance Details', style: 'sectionTitle', margin: [0, 4, 0, 4] },
    {
      table: {
        headerRows: 1,
        widths,
        body: [header, ...bodyRows, totalRow]
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
    }
  ];
}

function buildSignatureSection(): any {
  return {
    columns: [
      { text: 'Checked By', bold: true, width: '*' ,margin: [15, 0, 0, 0]},
      { text: 'Approved By', bold: true, width: '*', alignment: 'right' }
    ],
    margin: [10, 0, 10, 0], 
    absolutePosition: { x: 0, y: 750 }
  };
}

export function generatePaymentDocument(data: PaymentPdfData): any {
  const configuredMargins = data.config?.pageMargins as number[] | undefined;
  const resolvedPageMargins = configuredMargins
    ? [
        configuredMargins[0] ?? 20,
        Math.max(configuredMargins[1] ?? 82, 82),
        configuredMargins[2] ?? 20,
        configuredMargins[3] ?? 55
      ]
    : [20, 82, 20, 55];

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
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
      buildTitle(data),
      buildInfoSection(data),
      buildDetailsTable(data),
      buildAmountInWords(data),
      ...buildRemittanceSection(data),
      buildSignatureSection()
    ],
    footer: createFooterFunction(data.userData, { showPageNumbers: true }),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

function getLedgerName(item: any, coaList: any[]): string {
  if (!item?.COAMasterSid) return '';
  return coaList.find((v: any) => v.COAMasterSid === item.COAMasterSid)?.LedgerName || '';
}

function getSubledgerName(item: any, voucherDetails: any[], ledgerList: any[]): string {
  const index = voucherDetails.findIndex((vd: any) => vd.VoucherDetailSid === item?.VoucherDetailSid);
  if (index === -1 || !item?.LedgerMasterSid || !ledgerList?.[index]?.length) return '';
  return ledgerList[index].find((v: any) => v?.SubledgerMasterSid === item?.LedgerMasterSid)?.SubledgerName || '';
}

function getDisplayLedgerName(item: any, voucherDetails: any[], coaList: any[], ledgerList: any[]): string {
  const sub = getSubledgerName(item, voucherDetails, ledgerList);
  return sub || getLedgerName(item, coaList);
}

export function transformPaymentApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    paymentType?: 'bank' | 'cash';
    coaList?: any[];
    ledgerList?: any[];
    bankTypedLedgers?: any[];
    amountInWords?: string;
    printSettings?: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  }
): PaymentPdfData {
  const paymentType = options?.paymentType || 'cash';
  const coaList = options?.coaList || [];
  const ledgerList = options?.ledgerList || [];
  const bankTypedLedgers = options?.bankTypedLedgers || [];
  const voucherDetails = apiData?.VoucherDetail || [];

  const detailRows = voucherDetails
    .filter((item: any) => item?.DrCr === 'D' && toNumber(item?.LocalAmount) !== 0)
    .map((item: any) => ({
      ledgerName: getDisplayLedgerName(item, voucherDetails, coaList, ledgerList),
      narration: item?.Narration || '',
      currencyCode: item?.CurrencyCode || '',
      exchangeRate: toNumber(item?.ExchangeRate),
      amount: toNumber(item?.Amount),
      partyAmount: toNumber(item?.PartyAmount)
    }));

  const totalAmount = detailRows.reduce((sum: number, item: any) => sum + toNumber(item.partyAmount), 0);

  const voucherMatchings = (apiData?.voucherMatchings || []).map((m: any) => ({
    voucherNumber: m?.VoucherNumber || '',
    voucherType: m?.VoucherType || '',
    voucherDate: m?.VoucherDate || '',
    currencyCode: m?.CurrencyCode || '',
    exchangeRate: toNumber(m?.ExchangeRate),
    matchingAmount: toNumber(m?.MatchingAmount),
    matchingLocalAmount: toNumber(m?.MatchingLocalAmount),
    BillNo: m?.BillNo || '',
    BillDate: m?.BillDate || ''
  }));

  const totalMatchingAmount = voucherMatchings.reduce((sum: number, item: any) => sum + toNumber(item.matchingAmount), 0);
  const totalMatchingLocalAmount = voucherMatchings.reduce((sum: number, item: any) => sum + toNumber(item.matchingLocalAmount), 0);

  const bank = bankTypedLedgers.find((b: any) => b?.COAMasterSid == apiData?.BankCOA);

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
    paymentType,
    payment: {
      voucherNumber: apiData?.VoucherNumber || '',
      voucherDate: apiData?.VoucherDate || '',
      paidTo: apiData?.BankPartyName || '',
      paidFrom: getLedgerName({ COAMasterSid: apiData?.BankCOA }, coaList),
      currencyCode: apiData?.CurrencyCode || '',
      exchangeRate: toNumber(apiData?.ExchangeRate),
      bankName: bank?.LedgerName || '',
      instrumentMode: apiData?.InstrumentMode || '',
      instrumentNumber: apiData?.InstrumentNumber || '',
      instrumentDate: apiData?.InstrumentDate || ''
    },
    details: detailRows,
    voucherMatchings,
    totals: {
      totalAmount,
      totalMatchingAmount,
      totalMatchingLocalAmount
    },
    amountInWords:
      options?.amountInWords ||
      apiData?.AmountInWords ||
      apiData?.amountInWords ||
      ''
  };
}
